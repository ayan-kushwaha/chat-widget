import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { useCallStore } from '@/store/useCallStore';
import { cn } from '@/lib/utils';

export const CallModal = () => {
    const {
        status,
        callerName,
        callerNumber,
        callerImage,
        isMuted,
        isSpeakerOn,
        toggleMute,
        toggleSpeaker,
        endCall,
        setStatus,
        setMinimized
    } = useCallStore();

    const [duration, setDuration] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'connected') {
            interval = setInterval(() => setDuration((d) => d + 1), 1000);
        } else {
            setDuration(0);
        }
        return () => clearInterval(interval);
    }, [status]);

    // Auto-close after 2 seconds when call ends
    useEffect(() => {
        if (status === 'ended') {
            const timeout = setTimeout(() => {
                // Card will fade out via AnimatePresence
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [status]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const isEnded = status === 'ended';
    const isCalling = status === 'calling';

    return (
        <div className="fixed inset-0 z-[9999999] pointer-events-none flex items-center justify-center">
            <motion.div
                drag
                dragMomentum={false}
                initial={{ scale: 0.85, opacity: 0, y: 60 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 60 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-[340px] pointer-events-auto relative"
            >
                {/* Card with Animated Border */}
                <div className="relative from-neutral-900/95 via-neutral-900/90 to-neutral-950/95 backdrop-blur-3xl rounded-[32px] shadow-2xl overflow-hidden">

                    {/* Inner Content */}
                    <div className="relative from-neutral-900 via-neutral-900 to-neutral-950 rounded-[32px]">
                        {/* Ambient Glow */}
                        <div className={cn(
                            "absolute inset-0 opacity-50",
                            isEnded ? "bg-gradient-to-br from-red-500/20 via-transparent to-red-500/20" : "bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10"
                        )} />

                        {/* Profile Section */}
                        <div className="relative flex flex-col items-center justify-center px-8 pt-12 pb-8 space-y-6">
                            {/* Animated Avatar */}
                            <div className="relative">
                                {/* Pulsing Rings */}
                                {!isEnded && (status === 'ringing' || status === 'calling') && (
                                    <>
                                        <motion.div
                                            className="absolute inset-0 rounded-full bg-emerald-500/20"
                                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                                        />
                                        <motion.div
                                            className="absolute inset-0 rounded-full bg-emerald-500/30"
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                                        />
                                    </>
                                )}

                                {/* Red Pulsing on End */}
                                {isEnded && (
                                    <motion.div
                                        className="absolute  inset-0 rounded-full bg-red-500/30"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                                        transition={{ duration: 0.8, repeat: Infinity }}
                                    />
                                )}

                                <Avatar className={cn(
                                    "w-28 h-28 border-4 shadow-2xl ring-2",
                                    isEnded
                                        ? "border-neutral-800/50 shadow-red-500/20 ring-red-500/20"
                                        : "border-neutral-800/50 shadow-emerald-500/20 ring-emerald-500/20"
                                )}>
                                    <AvatarImage src={callerImage || undefined} />
                                    <AvatarFallback className="text-3xl bg-gradient-to-br from-neutral-800 to-neutral-900 text-zinc-400">
                                        {callerName.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>


                            {/* Caller Info */}
                            <div className="text-center space-y-1 ">
                                {/* Status Text Below Avatar */}
                                <div className={cn(
                                    "text-sm font-semibold flex items-center",
                                    isEnded ? "text-red-400" : "text-emerald-400"
                                )}>
                                    <AnimatedShinyText className="flex items-center">
                                        <span>
                                            {isEnded ? 'Call Ended' : (status === 'ringing' ? 'Incoming Call' : (status === 'connected' ? formatTime(duration) : 'Calling'))}
                                        </span>

                                        {/* Inline Animated Dots */}
                                        {(isCalling || status === 'ringing') && (
                                            <span className="inline-flex ml-0.5">
                                                {[0, 1, 2].map((i) => (
                                                    <motion.span
                                                        key={i}
                                                        className="inline-block"
                                                        animate={{
                                                            y: [-2, 2, -2],
                                                        }}
                                                        transition={{
                                                            duration: 0.9,
                                                            repeat: Infinity,
                                                            delay: i * 0.1
                                                        }}
                                                    >
                                                        .
                                                    </motion.span>
                                                ))}
                                            </span>
                                        )}
                                    </AnimatedShinyText>
                                </div>
                                <h3 className="text-2xl font-bold text-white tracking-tight">{callerName}</h3>
                                <p className="text-md text-zinc-500 font-mono">{callerNumber}</p>
                            </div>
                        </div>

                        {/* Controls Section */}
                        <div className="relative bg-gradient-to-b from-neutral-950/50 to-neutral-950/50 backdrop-blur-xl p-6 border-t border-white/5">
                            <div className="flex items-center justify-center gap-10">
                                {/* Incoming Call: Show only Accept + End (as Decline) */}
                                {status === 'ringing' && (
                                    <>
                                        {/* Accept Button */}
                                        <motion.button
                                            onClick={() => setStatus('connected')}
                                            whileHover={{ scale: 1.1, y: -4 }}
                                            whileTap={{ scale: 0.92 }}
                                            transition={{ type: 'spring', stiffness: 200 }}
                                            className="group flex flex-col items-center gap-2"
                                        >
                                            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/50 group-hover:shadow-emerald-500/70 transition-all">
                                                <motion.div
                                                    animate={{ rotate: [0, -15, 15, -10, 0] }}
                                                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                                                >
                                                    <Phone size={32} className="text-white" fill="white" />
                                                </motion.div>

                                                {/* Glow Rings */}
                                                <motion.div
                                                    className="absolute inset-0 rounded-full bg-emerald-500/20"
                                                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                                                />
                                                <motion.div
                                                    className="absolute inset-0 rounded-full bg-emerald-500/30"
                                                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                                                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                                                />
                                            </div>
                                        </motion.button>
                                    </>
                                )}
                                {/* Active Call: Mute / End / Speaker */}
                                <>
                                    {/* Mute Button */}
                                    {status !== 'ringing' && (
                                        <>
                                            <motion.button
                                                whileHover={{ scale: 1.1, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={toggleMute}
                                                transition={{ type: 'spring', stiffness: 200 }}
                                                className={cn(
                                                    "group relative p-4 rounded-2xl transition-all duration-100",
                                                    isMuted
                                                        ? "bg-white text-black shadow-lg border shadow-white/20"
                                                        : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                                                )}
                                            >
                                                <motion.div
                                                    whileHover={{ rotate: 15 }}
                                                    transition={{ type: 'spring', stiffness: 300 }}
                                                >
                                                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                                                </motion.div>
                                            </motion.button>
                                        </>
                                    )}
                                    {/* End Call Button (Reused for Active Call) */}
                                    <motion.button
                                        whileHover={{ scale: 1.1, y: -4 }}
                                        whileTap={{ scale: 0.92 }}
                                        onClick={endCall}
                                        transition={{ type: 'spring', stiffness: 200 }}
                                        className="group relative p-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-2xl shadow-red-500/40 hover:shadow-red-500/60 transition-all duration-100"
                                    >
                                        <motion.div>
                                            <PhoneOff size={28} fill="white" />
                                        </motion.div>
                                    </motion.button>

                                    {/* Speaker Button */}
                                    {status !== 'ringing' && (
                                        <motion.button
                                            whileHover={{ scale: 1.1, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={toggleSpeaker}
                                            transition={{ type: 'spring', stiffness: 200 }}
                                            className={cn(
                                                "group relative p-4 rounded-2xl transition-all duration-100",
                                                isSpeakerOn
                                                    ? "bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 border border-emerald-500/50 shadow-lg shadow-emerald-500/20"
                                                    : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                                            )}
                                        >
                                            <motion.div
                                                whileHover={{ rotate: 15 }}
                                                transition={{ type: 'spring', stiffness: 300 }}
                                            >
                                                {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
                                            </motion.div>
                                        </motion.button>
                                    )}
                                </>
                                {/* )} */}
                            </div>

                            {/* Indicator Dots */}
                            <div className="flex justify-center gap-1.5 mt-6">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            isEnded ? "bg-red-500/40" : "bg-white/20"
                                        )}
                                        animate={{ opacity: [0.2, 0.6, 0.2] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div >
        </div >
    );
};
