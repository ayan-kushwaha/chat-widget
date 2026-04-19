"use client";

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Plus, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface QuickReplyBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (data: { text: string; buttons: string[] }) => void;
}

export const QuickReplyBuilder: React.FC<QuickReplyBuilderProps> = ({ isOpen, onClose, onSend }) => {
    const [text, setText] = useState('');
    const [buttons, setButtons] = useState(['Yes', 'No']);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const addButton = () => {
        if (buttons.length < 3) {
            setButtons([...buttons, '']);
        }
    };

    const removeButton = (index: number) => {
        if (buttons.length > 1) {
            setButtons(buttons.filter((_, i) => i !== index));
        }
    };

    const updateButton = (index: number, value: string) => {
        const newButtons = [...buttons];
        newButtons[index] = value;
        setButtons(newButtons);
    };

    const handleSend = () => {
        if (!text.trim()) {
            toast.error('Please enter a message');
            return;
        }
        const validButtons = buttons.filter(b => b.trim());
        if (validButtons.length === 0) {
            toast.error('Please add at least one button');
            return;
        }

        onSend({
            text: text.trim(),
            buttons: validButtons
        });
        onClose();
        setText('');
        setButtons(['Yes', 'No']);
    };

    if (!isMounted || typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 flex items-center justify-center z-[10001] p-4"
                    >
                        <div className="bg-[#1a1f2e] rounded-2xl border border-white/10 shadow-2xl max-w-md w-full overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                                        <Zap size={20} className="text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Quick Reply</h3>
                                        <p className="text-xs text-zinc-500">Buttons for fast responses</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Message Text
                                    </label>
                                    <textarea
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="Hello! How can I help you today?"
                                        className="w-full px-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none h-24"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Buttons (Max 3)
                                    </label>
                                    <div className="space-y-2">
                                        {buttons.map((btn, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={btn}
                                                    onChange={(e) => updateButton(idx, e.target.value)}
                                                    placeholder={`Button ${idx + 1}`}
                                                    className="flex-1 px-4 py-2 bg-zinc-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                                                    maxLength={20}
                                                />
                                                {buttons.length > 1 && (
                                                    <button
                                                        onClick={() => removeButton(idx)}
                                                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {buttons.length < 3 && (
                                        <button
                                            onClick={addButton}
                                            className="mt-2 flex items-center gap-2 text-xs font-medium text-amber-500 hover:text-amber-400"
                                        >
                                            <Plus size={14} /> Add Button
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center gap-3 px-6 py-4 border-t border-white/10 bg-[#1a1f2e]">
                                <button
                                    onClick={handleSend}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all font-bold"
                                >
                                    Send Quick Reply
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
