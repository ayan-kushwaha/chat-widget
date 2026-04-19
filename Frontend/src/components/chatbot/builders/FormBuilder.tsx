"use client";

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Plus, Trash2, List } from 'lucide-react';
import { toast } from 'sonner';

interface FormBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (data: any) => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({ isOpen, onClose, onSend }) => {
    const [title, setTitle] = useState('');
    const [fields, setFields] = useState<{ id: string; label: string; type: string }[]>([
        { id: '1', label: 'Name', type: 'text' },
        { id: '2', label: 'Phone', type: 'tel' }
    ]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const addField = () => {
        if (fields.length < 5) {
            setFields([...fields, {
                id: Date.now().toString(),
                label: '',
                type: 'text'
            }]);
        }
    };

    const removeField = (index: number) => {
        if (fields.length > 1) {
            setFields(fields.filter((_, i) => i !== index));
        }
    };

    const updateField = (index: number, key: string, value: string) => {
        const newFields = [...fields];
        // @ts-ignore
        newFields[index][key] = value;
        setFields(newFields);
    };

    const handleSend = () => {
        if (!title.trim()) {
            toast.error('Please enter a form title');
            return;
        }
        if (fields.some(f => !f.label.trim())) {
            toast.error('Please verify all field labels');
            return;
        }

        onSend({
            title,
            fields,
            type: 'form'
        });
        onClose();
        setTitle('');
        setFields([{ id: '1', label: 'Name', type: 'text' }, { id: '2', label: 'Phone', type: 'tel' }]);
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
                        className="fixed inset-0 flex items-center justify-center z-[10001] p-4 form-builder-modal"
                    >
                        <div className="bg-[#1a1f2e] rounded-2xl border border-white/10 shadow-2xl max-w-md w-full overflow-hidden flex flex-col h-[600px]">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1a1f2e]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
                                        <FileText size={20} className="text-pink-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Form Builder</h3>
                                        <p className="text-xs text-zinc-500">Collect info from users</p>
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
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Form Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Contact Information"
                                        className="w-full px-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all font-bold"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-zinc-300">Fields (Max 5)</label>
                                        <span className="text-xs text-zinc-500">{fields.length}/5</span>
                                    </div>

                                    {fields.map((field, idx) => (
                                        <div key={field.id} className="flex gap-2 items-start bg-zinc-800/30 p-2 rounded-xl border border-white/5">
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    type="text"
                                                    value={field.label}
                                                    onChange={(e) => updateField(idx, 'label', e.target.value)}
                                                    placeholder="Field Label (e.g., Email)"
                                                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                                                />
                                                <select
                                                    value={field.type}
                                                    onChange={(e) => updateField(idx, 'type', e.target.value)}
                                                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-zinc-300 text-xs focus:outline-none"
                                                >
                                                    <option value="text">Text Input</option>
                                                    <option value="number">Number</option>
                                                    <option value="email">Email</option>
                                                    <option value="tel">Phone</option>
                                                    <option value="url">URL</option>
                                                </select>
                                            </div>
                                            {fields.length > 1 && (
                                                <button
                                                    onClick={() => removeField(idx)}
                                                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mt-1"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {fields.length < 5 && (
                                        <button
                                            onClick={addField}
                                            className="w-full py-2 border border-dashed border-zinc-600 rounded-xl text-zinc-400 text-sm hover:border-pink-500 hover:text-pink-500 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Plus size={14} /> Add Field
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-white/10 bg-[#1a1f2e]">
                                <button
                                    onClick={handleSend}
                                    className="w-full py-3 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-pink-600/20"
                                >
                                    <List size={18} />
                                    Send Form
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
