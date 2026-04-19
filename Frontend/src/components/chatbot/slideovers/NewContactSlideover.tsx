"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Smile,
    Check,
    Smartphone,
    Mail,
    MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewContactSlideoverProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    onContactCreated: (contact: any) => void;
}

export const NewContactSlideover: React.FC<NewContactSlideoverProps> = ({
    isOpen,
    onClose,
    onBack,
    onContactCreated
}) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: ''
    });

    const reset = () => {
        setFormData({ firstName: '', lastName: '', phone: '', email: '', address: '' });
    };

    const handleCreateContact = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.firstName || !formData.phone) return;

        onContactCreated({
            _id: `temp-${Date.now()}`,
            userName: `${formData.firstName} ${formData.lastName}`.trim(),
            userLocation: "India",
            last_message_at: new Date(),
            summary: "Identity Registry Sync Successful",
            unreadCount: 0,
            status: 'active',
            mode: 'human'
        });
        onClose();
        setTimeout(reset, 500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
                    />

                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="absolute left-0 top-0 bottom-0 w-full max-w-[480px] bg-neutral-950 border-r border-white/5 flex flex-col pointer-events-auto shadow-[20px_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        {/* 💎 PREMIUM HEADER */}
                        <div className="relative pt-12 pb-6 px-6 bg-gradient-to-b from-blue-500/10 to-transparent">
                            <div className="flex items-center gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.1, x: -2 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onBack || onClose}
                                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                                >
                                    <ArrowLeft size={24} />
                                </motion.button>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black text-white tracking-tight uppercase">Add New Contact</h2>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.2em]">Save a new person</p>
                                </div>
                            </div>
                        </div>

                        {/* ⚡ CONTENT AREA */}
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <div className="px-6 py-6 h-full">
                                <form onSubmit={handleCreateContact} className="flex flex-col gap-10 py-4">
                                    <div className="flex flex-col gap-1.5 px-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Contact Details</label>
                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-8 backdrop-blur-sm">
                                            <PremiumInput
                                                icon={Smile}
                                                placeholder="FIRST NAME"
                                                value={formData.firstName}
                                                onChange={(val: string) => setFormData({ ...formData, firstName: val })}
                                                required
                                            />
                                            <PremiumInput
                                                icon={Smile}
                                                placeholder="LAST NAME"
                                                value={formData.lastName}
                                                onChange={(val: string) => setFormData({ ...formData, lastName: val })}
                                                hideIcon
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5 px-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Contact Information</label>
                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-8 backdrop-blur-sm">
                                            <PremiumInput
                                                icon={Smartphone}
                                                placeholder="PHONE NUMBER"
                                                value={formData.phone}
                                                onChange={(val: string) => setFormData({ ...formData, phone: val })}
                                                type="tel"
                                                required
                                            />
                                            <PremiumInput
                                                icon={Mail}
                                                placeholder="EMAIL ADDRESS (OPTIONAL)"
                                                value={formData.email}
                                                onChange={(val: string) => setFormData({ ...formData, email: val })}
                                                type="email"
                                            />
                                            <PremiumInput
                                                icon={MapPin}
                                                placeholder="LOCATION / ADDRESS"
                                                value={formData.address}
                                                onChange={(val: string) => setFormData({ ...formData, address: val })}
                                            />
                                        </div>
                                    </div>

                                    {/* Submit Placeholder */}
                                    <button type="submit" className="hidden" />
                                </form>
                            </div>
                        </div>

                        {/* ✅ PREMIUM FLOATING SAVE BUTTON */}
                        <AnimatePresence>
                            {(formData.firstName && formData.phone) && (
                                <motion.div
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 100, opacity: 0 }}
                                    className="p-8 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent absolute bottom-0 left-0 right-0 z-20"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleCreateContact}
                                        className="w-full h-16 bg-blue-500 text-black rounded-2xl shadow-[0_20px_40px_rgba(59,130,246,0.3)] flex items-center justify-center gap-3 group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                        <span className="text-sm font-black uppercase tracking-[0.3em]">Authorize Entry</span>
                                        <div className="w-8 h-8 bg-black/10 rounded-lg flex items-center justify-center">
                                            <Check size={20} strokeWidth={3} />
                                        </div>
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const PremiumInput = ({ icon: Icon, placeholder, value, onChange, hideIcon = false, type = "text", required = false }: any) => (
    <div className="flex items-center gap-4 group">
        {!hideIcon && (
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5 group-focus-within:border-blue-500/50 transition-colors">
                <Icon className="text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={18} />
            </div>
        )}
        <div className={cn("flex-1 relative", hideIcon && "ml-14")}>
            <input
                required={required}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder.toUpperCase()}
                className="w-full bg-transparent py-2 text-sm font-bold text-white placeholder:text-zinc-700 outline-none transition-all tracking-widest border-b border-transparent focus:border-blue-500/30"
            />
            <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-blue-500 group-focus-within:w-full transition-all duration-500"></div>
        </div>
    </div>
);
