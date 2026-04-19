"use client";

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface PollBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (pollData: PollData) => void;
}

export interface PollData {
    question: string;
    options: string[];
    allowMultiple: boolean;
}

export const PollBuilder: React.FC<PollBuilderProps> = ({ isOpen, onClose, onSend }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [allowMultiple, setAllowMultiple] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const addOption = () => {
        if (options.length < 10) {
            setOptions([...options, '']);
        }
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSend = () => {
        if (!question.trim()) {
            toast.error('Please enter a question');
            return;
        }

        const validOptions = options.filter(opt => opt.trim());
        if (validOptions.length < 2) {
            toast.error('Please add at least 2 options');
            return;
        }

        onSend({
            question: question.trim(),
            options: validOptions,
            allowMultiple
        });

        // Reset
        setQuestion('');
        setOptions(['', '']);
        setAllowMultiple(false);
        onClose();
    };

    if (!isMounted || typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000]"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 flex items-center justify-center z-[10001] p-4"
                    >
                        <div className="bg-[#1a1f2e] rounded-2xl border border-white/10 shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                        <BarChart3 size={20} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Create Poll</h3>
                                        <p className="text-xs text-zinc-500">Ask customers their opinion</p>
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
                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                {/* Question */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Question *
                                    </label>
                                    <input
                                        type="text"
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        placeholder="e.g., What's your budget?"
                                        className="w-full px-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                        maxLength={200}
                                    />
                                    <p className="text-xs text-zinc-600 mt-1">{question.length}/200</p>
                                </div>

                                {/* Options */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Options * (min 2, max 10)
                                    </label>
                                    <div className="space-y-2">
                                        {options.map((option, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <span className="text-zinc-500 text-sm w-6">{index + 1}.</span>
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(e) => updateOption(index, e.target.value)}
                                                    placeholder={`Option ${index + 1}`}
                                                    className="flex-1 px-4 py-2.5 bg-zinc-800/50 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                                                    maxLength={100}
                                                />
                                                {options.length > 2 && (
                                                    <button
                                                        onClick={() => removeOption(index)}
                                                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {options.length < 10 && (
                                        <button
                                            onClick={addOption}
                                            className="mt-3 flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                        >
                                            <Plus size={16} />
                                            Add Option
                                        </button>
                                    )}
                                </div>

                                {/* Settings */}
                                <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-xl border border-white/5">
                                    <div>
                                        <p className="text-sm font-medium text-white">Allow multiple choices</p>
                                        <p className="text-xs text-zinc-500">Users can select more than one option</p>
                                    </div>
                                    <button
                                        onClick={() => setAllowMultiple(!allowMultiple)}
                                        className={`
                                            relative w-12 h-6 rounded-full transition-colors
                                            ${allowMultiple ? 'bg-emerald-500' : 'bg-zinc-700'}
                                        `}
                                    >
                                        <div
                                            className={`
                                                absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg transition-transform
                                                ${allowMultiple ? 'translate-x-6' : 'translate-x-0.5'}
                                            `}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center gap-3 px-6 py-4 border-t border-white/10">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSend}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all font-medium"
                                >
                                    Send Poll
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
