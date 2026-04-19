"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Send, User, Check, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactDOM from 'react-dom';

interface Contact {
    id: string;
    name: string;
    avatar?: string;
    lastSeen?: string;
}

interface ForwardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onForward: (contactIds: string[]) => void;
    messageCount: number;
}

// Mock contacts for demonstration
const MOCK_CONTACTS: Contact[] = [
    { id: '1', name: 'Aryan Maurya', lastSeen: 'Active now' },
    { id: '2', name: 'DeepMind Team', lastSeen: 'Yesterday' },
    { id: '3', name: 'Sarah Wilson', lastSeen: '2h ago' },
    { id: '4', name: 'John Doe', lastSeen: '5m ago' },
    { id: '5', name: 'Tech Support', lastSeen: 'Online' },
    { id: '6', name: 'Marketing Group', lastSeen: 'Active now' },
];

export const ForwardModal: React.FC<ForwardModalProps> = ({
    isOpen,
    onClose,
    onForward,
    messageCount
}) => {
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSending, setIsSending] = useState(false);

    const filteredContacts = useMemo(() => {
        return MOCK_CONTACTS.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [search]);

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-[340px] bg-neutral-950 border border-white/5 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
                    <div className="flex flex-col">
                        <h2 className="text-base font-black text-white flex items-center gap-2 tracking-tight">
                            Forward
                            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md font-black uppercase tracking-[0.1em]">
                                {messageCount} Item{messageCount !== 1 ? 's' : ''}
                            </span>
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 py-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-zinc-700 outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Contact List */}
                <ScrollArea className="flex-1 h-[320px]">
                    <div className="px-2 pb-4 space-y-0.5">
                        {filteredContacts.length > 0 ? (
                            filteredContacts.map((contact) => (
                                <button
                                    key={contact.id}
                                    onClick={() => toggleSelect(contact.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-2 rounded-2xl transition-all group",
                                        selectedIds.has(contact.id)
                                            ? "bg-emerald-500/5"
                                            : "hover:bg-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Avatar className="w-10 h-10 border border-white/5 group-hover:border-emerald-500/20 transition-colors">
                                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`} />
                                                <AvatarFallback className="bg-zinc-900 text-zinc-600 font-black text-xs">{contact.name[0]}</AvatarFallback>
                                            </Avatar>
                                            {selectedIds.has(contact.id) && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-neutral-950 animate-in zoom-in-50 duration-200">
                                                    <Check size={10} className="text-white font-black" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{contact.name}</span>
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{contact.lastSeen}</span>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-[1.5px] transition-all flex items-center justify-center",
                                        selectedIds.has(contact.id)
                                            ? "bg-emerald-500 border-emerald-500"
                                            : "border-white/10 group-hover:border-white/20"
                                    )}>
                                        {selectedIds.has(contact.id) && <Check size={12} className="text-white" />}
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-zinc-800 italic">
                                <Users size={32} className="mb-2 opacity-20" />
                                <p className="text-[11px] font-bold uppercase tracking-widest">No contacts</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-xl flex items-center gap-3">
                    <button
                        disabled={selectedIds.size === 0 || isSending}
                        onClick={async () => {
                            setIsSending(true);
                            await onForward(Array.from(selectedIds));
                            // Timer is handled in parent but we reset just in case modal stay open
                            // setIsSending(false);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-900 disabled:opacity-40 text-white rounded-[1.2rem] font-black uppercase tracking-[0.15em] text-[10px] transition-all shadow-[0_10px_30px_rgba(16,185,129,0.2)] active:scale-[0.98] disabled:active:scale-100"
                    >
                        {isSending ? (
                            <>Sending... <Loader2 size={14} className="animate-spin" /></>
                        ) : (
                            <>Send to {selectedIds.size} Target{selectedIds.size !== 1 ? 's' : ''} <Send size={14} className="mb-0.5" /></>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );

    return typeof document !== 'undefined'
        ? ReactDOM.createPortal(modalContent, document.body)
        : null;
};
