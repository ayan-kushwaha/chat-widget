import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSkillManager } from './SkillManagerContext';

interface LiveVoiceProps {
    isSpeaking: boolean;
    isProcessing?: boolean;
    botReply: string;
    interimTranscript?: string;
    transcript?: string;
    activeWordIndex?: number;
}

export default function LiveVoiceCaptionSkill({ 
    isSpeaking, 
    isProcessing,
    botReply, 
    interimTranscript, 
    activeWordIndex = -1 
}: LiveVoiceProps) {
    const { activeSkill } = useSkillManager();

    const isVisible = activeSkill === 'live_voice' || isSpeaking || isProcessing || !!interimTranscript;
    if (!isVisible) return null;

    const words = botReply ? botReply.trim().split(/\s+/) : [];

    // Single word from user's live input
    const userWords = (interimTranscript || '').trim().split(/\s+/);
    const latestUserWord = userWords[userWords.length - 1] || '';
    
    // Priority: TTS speaking > Processing > User talking
    const showSpeaking = isSpeaking && activeWordIndex >= 0 && activeWordIndex < words.length;
    const showThinking = !isSpeaking && !!isProcessing;
    const showUser = !isSpeaking && !isProcessing && !!latestUserWord;

    return (
        <div className="absolute top-[75%] left-1/2 -translate-x-1/2 z-[150] w-full flex flex-col items-center justify-center text-center pointer-events-none ">
            
            {/* AI reply — one word at a time (highest priority) */}
            <AnimatePresence mode="wait">
                {showSpeaking && (
                    <motion.div
                        key={`word-${activeWordIndex}`}
                        initial={{ opacity: 0, scale: 0.9, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="text-[9px] font-bold text-[#00e5ff] whitespace-nowrap tracking-wide"
                        style={{ textShadow: "0 0 12px rgba(0,229,255,0.9)" }}
                    >
                        {words[activeWordIndex]}
                    </motion.div>
                )}

                {/* Thinking indicator — only when NOT speaking */}
                {showThinking && (
                    <motion.div
                        key="thinking"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-[2px] mt-2"
                    >
                        {[0, 1, 2].map((i) => (
                            <motion.span
                                key={i}
                                className="w-[3px] h-[3px] rounded-full bg-white/50 inline-block"
                                animate={{ y: [0, -4, 0] }}
                                transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    delay: i * 0.15,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </motion.div>
                )}

                {/* User's last spoken word — only when idle */}
                {showUser && (
                    <motion.div
                        key={`user-${latestUserWord}`}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 0.6, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        transition={{ duration: 0.15 }}
                        className="text-[10px] italic text-[#00e5ff] font-mono tracking-wider whitespace-nowrap"
                    >
                        {latestUserWord}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
