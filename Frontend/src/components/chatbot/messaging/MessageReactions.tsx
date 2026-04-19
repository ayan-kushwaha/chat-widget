import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EmojiMeta } from '@/assets/emogy/EmojiMeta';
import { LottieEmoji } from '@/components/global/LottieEmoji';

interface MessageReactionsProps {
    reactions: Record<string, number>; // e.g. { '❤️': 1, '👍': 2 }
    userReaction?: string; // Reaction selected by current user
    onReactionClick: (emoji: string) => void;
    isUserMessage: boolean;
}

// Helper to convert emoji character to codepoint string used in EmojiMeta
const getEmojiCodepoint = (emoji: string) => {
    return [...emoji]
        .map(char => char.codePointAt(0)?.toString(16))
        .filter(Boolean)
        .join('_');
};

export const MessageReactions: React.FC<MessageReactionsProps> = ({ reactions, userReaction, onReactionClick, isUserMessage }) => {
    if (!reactions || Object.keys(reactions).length === 0) return null;

    return (
        <div className={cn(
            "absolute bottom-0 transform translate-y-1/2 flex gap-1.5 z-50",
            isUserMessage ? "right-0" : "left-0"
        )}>
            {Object.entries(reactions).map(([emoji, count]) => {
                if (count === 0) return null;

                const codepoint = getEmojiCodepoint(emoji);
                const meta = EmojiMeta[codepoint];

                return (
                    <motion.button
                        layout
                        key={emoji}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        whileHover={{ scale: 1.5, rotate: [0, -10, 10, 0], transition: { duration: 0.2 } }}
                        whileTap={{ scale: 0.8 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onReactionClick(emoji);
                        }}
                        className="flex items-center gap-0.5 transition-all hover:scale-125 px-1 py-0.5"
                    >
                        <div className="w-6 h-6 flex items-center justify-center">
                            {meta?.path ? (
                                <LottieEmoji
                                    path={meta.path}
                                    loop={true}
                                    autoplay={true}
                                    shouldPreload={true} // ⚡ Critical for visibility
                                    alt={emoji} // 🛡️ Fallback
                                    style={{ width: 24, height: 24 }}
                                />
                            ) : (
                                <span style={{ fontSize: '1.2em' }}>{emoji}</span>
                            )}
                        </div>
                        {count > 1 && (
                            <span className="text-[10px] font-bold text-zinc-400">
                                {count}
                            </span>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
};
