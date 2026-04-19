"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    UserPlus,
    Users,
    Search,
    Shield,
    HelpCircle,
    Youtube,
    Instagram,
    Linkedin,
    MessageCircle,
    Hash,
    Settings,
    CalendarCheck2
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useRouter } from 'next/navigation';

interface CreatorSelectionSlideoverProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectMode: (mode: 'new_group' | 'new_contact' | 'booking_settings' | 'support' | 'hire_ai') => void;
}

export const CreatorSelectionSlideover: React.FC<CreatorSelectionSlideoverProps> = ({
    isOpen,
    onClose,
    onSelectMode
}) => {
    const router = useRouter();
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
                        <div className="relative pt-12 pb-6 px-6 bg-gradient-to-b from-zinc-900/50 to-transparent">
                            <div className="flex items-center gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.1, x: -2 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                                >
                                    <ArrowLeft size={24} />
                                </motion.button>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black text-white tracking-tight uppercase">Create New</h2>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Select what you want to add</p>
                                </div>
                            </div>
                        </div>

                        {/* ⚡ CONTENT AREA */}
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <div className="px-6 py-6 h-full flex flex-col gap-8">
                                {/* 🔎 Search Command */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                                        <Search className="text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="SEARCH..."
                                        className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-white/10 text-xs font-black text-white tracking-widest focus:border-emerald-500/50 transition-all outline-none placeholder:text-zinc-700"
                                    />
                                </div>

                                {/* Actions Grid */}
                                <div className="grid grid-cols-1 gap-3">
                                    <SelectionCard
                                        icon={Users}
                                        label="New Group"
                                        description="Chat with multiple people"
                                        onClick={() => onSelectMode('new_group')}
                                        color="emerald"
                                    />
                                    <SelectionCard
                                        icon={UserPlus}
                                        label="New Contact"
                                        description="Save someone to your list"
                                        onClick={() => onSelectMode('new_contact')}
                                        color="blue"
                                    />

                                    <SelectionCard
                                        icon={CalendarCheck2}
                                        label="Booking Engine"
                                        description="Manage slots, hours & scheduling"
                                        onClick={() => onSelectMode('booking_settings')}
                                        color="purple"
                                    />

                                    <div className="pt-4">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="h-[1px] flex-1 bg-white/5"></div>
                                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">Premium</span>
                                            <div className="h-[1px] flex-1 bg-white/5"></div>
                                        </div>
                                        <SelectionCard
                                            icon={Shield}
                                            label="Hire AI Employee"
                                            description="Deploy 24/7 Digital Workforce"
                                            onClick={() => {
                                                onClose();
                                                router.push('/dashboard/communication/employees');
                                            }}
                                            color="amber"
                                        />
                                    </div>
                                </div>



                                <div className="flex flex-col gap-8 mt-4 pb-12">
                                    <div className="flex items-center gap-4">
                                        <div className="h-[1px] flex-1 bg-white/5"></div>
                                        <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em]">Connect Us</span>
                                        <div className="h-[1px] flex-1 bg-white/5"></div>
                                    </div>
                                    <SelectionCard
                                        icon={HelpCircle}
                                        label="Cluaiz Support"
                                        description="Direct line to developers"
                                        onClick={() => onSelectMode('support')}
                                        color="purple"
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <SocialBadge icon={MessageCircle} label="WhatsApp" handle="@Cluaiz" color="emerald" />
                                        <SocialBadge icon={Instagram} label="Instagram" handle="@Cluaiz" color="purple" />
                                        <SocialBadge icon={Youtube} label="YouTube" handle="@Cluaiz" color="red" />
                                        <SocialBadge icon={Linkedin} label="LinkedIn" handle="@Cluaiz" color="blue" />
                                    </div>

                                    <div className="pt-4 flex flex-col items-center justify-center text-center opacity-10">
                                        <Shield size={24} className="text-zinc-600 mb-2" />
                                        <p className="text-[8px] font-black uppercase tracking-widest leading-loose">
                                            SECURE NEURAL OVERLAY ACTIVE<br />
                                            ENCRYPTED END-TO-END
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const SocialBadge = ({ icon: Icon, label, handle, color }: { icon: any, label: string, handle: string, color: string }) => {
    const variants: any = {
        emerald: "group-hover:text-emerald-500 group-hover:bg-emerald-500/10 border-white/5",
        purple: "group-hover:text-purple-500 group-hover:bg-purple-500/10 border-white/5",
        red: "group-hover:text-red-500 group-hover:bg-red-500/10 border-white/5",
        blue: "group-hover:text-blue-500 group-hover:bg-blue-500/10 border-white/5",
    };

    return (
        <motion.button
            whileHover={{ y: -2 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 transition-all group hover:border-white/10"
        >
            <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-900 transition-all",
                variants[color]
            )}>
                <Icon size={16} className="text-zinc-600 transition-colors group-hover:text-inherit" />
            </div>
            <div className="flex flex-col items-start">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-tight">{handle}</span>
            </div>
        </motion.button>
    );
};

const SelectionCard = ({ icon: Icon, label, description, onClick, color }: { icon: any, label: string, description: string, onClick: () => void, color: string }) => {
    const colorMap: any = {
        emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/10 hover:border-emerald-500/30",
        blue: "text-blue-500 bg-blue-500/10 border-blue-500/10 hover:border-blue-500/30",
        purple: "text-purple-500 bg-purple-500/10 border-purple-500/10 hover:border-purple-500/30",
        amber: "text-amber-500 bg-amber-500/10 border-amber-500/10 hover:border-amber-500/30",
    };

    return (
        <motion.button
            whileHover={{ x: 4 }}
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-5 p-4 rounded-2xl border transition-all group backdrop-blur-sm",
                colorMap[color] || "bg-white/5 border-white/5"
            )}
        >
            <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                color === 'emerald' ? 'bg-emerald-500' : (color === 'blue' ? 'bg-blue-500' : (color === 'purple' ? 'bg-purple-500' : 'bg-amber-500'))
            )}>
                <Icon size={22} className="text-black" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col items-start">
                <span className="text-[13px] font-black text-white uppercase tracking-wider">{label}</span>
                <span className="text-[10px] mt-1 text-zinc-500 font-bold uppercase tracking-tight opacity-70 group-hover:opacity-100 transition-opacity">
                    {description}
                </span>
            </div>
            <ArrowLeft className="ml-auto opacity-0 group-hover:opacity-30 -rotate-180 transition-all duration-500 group-hover:translate-x-1" size={16} />
        </motion.button>
    );
};
