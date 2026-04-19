"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Edit2, AlertTriangle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GroupService, Group } from '@/services/group.service';

interface ManageGroupsModalProps {
    isOpen: boolean;
    onClose: () => void;
    groups: Group[];
    onGroupDeleted: (groupId: string) => void;
}

export const ManageGroupsModal: React.FC<ManageGroupsModalProps> = ({ isOpen, onClose, groups, onGroupDeleted }) => {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (groupId: string) => {
        try {
            const res = await GroupService.deleteGroup(groupId);
            if (res.success) {
                onGroupDeleted(groupId);
                setDeletingId(null);
            }
        } catch (error) {
            console.error('Failed to delete group:', error);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                                    <Users size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Manage Segments</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                            {groups.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 grayscale opacity-20">
                                        <Users size={32} />
                                    </div>
                                    <p className="text-zinc-500 font-medium">No segments created yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {groups.map(group => (
                                        <div
                                            key={group._id}
                                            className="flex items-center justify-between p-3 px-4 hover:bg-white/5 rounded-xl transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl">{group.emoji || '👥'}</span>
                                                <div>
                                                    <h3 className="text-sm font-bold text-white">{group.name}</h3>
                                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                                                        {group.members?.length || 0} Members
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {deletingId === group._id ? (
                                                    <div className="flex items-center gap-1 bg-red-500/20 rounded-lg p-1 animate-in slide-in-from-right-2">
                                                        <button
                                                            onClick={() => handleDelete(group._id)}
                                                            className="px-2 py-1 text-[10px] font-black text-red-500 hover:text-red-400 transition-colors uppercase"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingId(null)}
                                                            className="px-2 py-1 text-[10px] font-black text-zinc-500 hover:text-zinc-400 transition-colors uppercase"
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeletingId(group._id)}
                                                        className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-white/5 text-center text-[10px] font-medium text-zinc-500">
                            Deleting a segment only removes the list, not the conversations.
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
