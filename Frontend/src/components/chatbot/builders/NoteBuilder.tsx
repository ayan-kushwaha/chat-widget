"use client";

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, StickyNote } from 'lucide-react';
import { toast } from 'sonner';

interface NoteBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (note: string) => void;
}

export const NoteBuilder: React.FC<NoteBuilderProps> = ({ isOpen, onClose, onSend }) => {
    const [note, setNote] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleSend = () => {
        if (!note.trim()) {
            toast.error('Please enter a note');
            return;
        }

        onSend(note.trim());
        setNote('');
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
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                                        <StickyNote size={20} className="text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Internal Note</h3>
                                        <p className="text-xs text-zinc-500">Visible only to team members</p>
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
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Note Content *
                                    </label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Enter internal note..."
                                        className="w-full h-32 px-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none"
                                        maxLength={500}
                                    />
                                    <p className="text-xs text-zinc-600 mt-1">{note.length}/500</p>
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
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all font-medium"
                                >
                                    Add Note
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
