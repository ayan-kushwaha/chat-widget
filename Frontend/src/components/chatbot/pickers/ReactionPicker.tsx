import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { EmojiMeta } from '@/assets/emogy/EmojiMeta';
import { LottieEmoji } from '@/components/global/LottieEmoji';
import { EmojiPicker } from './EmojiPicker';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

interface ReactionPickerProps {
    isOpen: boolean;
    onSelect: (emoji: string) => void;
    onClose: () => void;
    position?: 'left' | 'right';
}

const getEmojiCodepoint = (emoji: string) => {
    return [...emoji]
        .map(char => char.codePointAt(0)?.toString(16))
        .filter(Boolean)
        .join('_');
};

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ isOpen, onSelect, onClose, position = 'left' }) => {
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop to close on click outside */}
                    <div className="fixed inset-0 z-40" onClick={onClose} />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={`absolute bottom-full mb-2 ${position === 'right' ? 'right-0' : 'left-0'} z-50 bg-[#202c33] border border-white/10 rounded-full shadow-2xl p-1.5 flex items-center gap-1`}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                    >
                        {REACTIONS.map((emoji, index) => {
                            const codepoint = getEmojiCodepoint(emoji);
                            const meta = EmojiMeta[codepoint];

                            return (
                                <motion.button
                                    key={emoji}
                                    whileHover={{ scale: 1.2, y: -5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        onSelect(emoji);
                                        onClose();
                                    }}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors p-1"
                                >
                                    {meta?.path ? (
                                        <LottieEmoji
                                            path={meta.path}
                                            loop={true}
                                            autoplay={true}
                                            shouldPreload={true}
                                            alt={emoji} // 🛡️ Fallback
                                            style={{ width: 32, height: 32 }}
                                        />
                                    ) : (
                                        <span className="text-xl">{emoji}</span>
                                    )}
                                </motion.button>
                            );
                        })}

                        <div className="w-[1px] h-6 bg-white/10 mx-1" />

                        {/* 🧠 Smart Popover for Full Picker */}
                        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                            <PopoverTrigger asChild>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className={cn(
                                        "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                                        isPopoverOpen ? "bg-blue-500/20 text-blue-400" : "hover:bg-white/5 text-zinc-400"
                                    )}
                                >
                                    <Plus className="w-5 h-5" />
                                </motion.button>
                            </PopoverTrigger>
                            <PopoverContent
                                side="top"
                                align="center"
                                className="p-0 border-none bg-transparent shadow-none w-auto h-auto"
                                sideOffset={10}
                            >
                                <EmojiPicker
                                    onSelect={(emoji) => {
                                        onSelect(emoji);
                                        onClose();
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
