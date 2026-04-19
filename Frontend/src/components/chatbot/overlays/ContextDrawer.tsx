"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Tag, Calendar, Shield, Activity, MessageSquare, Star } from 'lucide-react';
import { X as AnimatedX } from '@/components/animate-ui/icons/x';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Conversation } from '../types';
import { cn } from '@/lib/utils';

interface ContextDrawerProps {
    conversation: Conversation;
    onClose: () => void;
}

const InfoRow = ({ icon: Icon, label, value, colorClass = "text-zinc-400" }: { icon: any, label: string, value: string, colorClass?: string }) => (
    <div className="flex flex-col gap-1 py-3 px-4 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-default rounded-xl">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-600">
            <Icon size={12} className={colorClass} /> {label}
        </div>
        <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">{value}</div>
    </div>
);

export const ContextDrawer: React.FC<ContextDrawerProps> = ({ conversation, onClose }) => {
    return (
        <motion.div
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-[380px] h-full bg-white dark:bg-neutral-950 border-l border-black/5 dark:border-white/10 flex flex-col shadow-2xl z-40"
        >
            {/* Header */}
            <div className="p-5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-black/50 backdrop-blur-md">
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">Contact Info</h2>
                <button
                    onClick={onClose}
                    className="p-2 text-zinc-500 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all"
                >
                    <AnimatedX size={20} animateOnHover />
                </button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6 flex flex-col items-center">
                    {/* Hero Avatar */}
                    <div className="relative mb-6">
                        <Avatar className="w-36 h-36 border-4 border-white/50 dark:border-white/5 shadow-2xl">
                            <AvatarImage src={conversation.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conversation.userName}`} />
                            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-900 text-6xl text-zinc-700 font-black">{conversation.userName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-2 right-2 w-8 h-8 bg-emerald-500 border-4 border-white dark:border-[#0b141a] rounded-full shadow-lg"></div>
                    </div>

                    <h1 className="text-2xl font-black text-zinc-900 dark:text-white text-center mb-1 tracking-tight">
                        {conversation.userName}
                    </h1>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        <Shield size={10} /> Verified Lead
                    </div>
                </div>

                <div className="px-2 space-y-1">
                    <InfoRow icon={MapPin} label="Location" value={conversation.userLocation || "India, Earth"} colorClass="text-blue-500" />
                    <InfoRow icon={Mail} label="Email Address" value="Lead captured via AI..." colorClass="text-red-500" />
                    <InfoRow icon={Phone} label="Phone Number" value="+91 63943 11141" colorClass="text-emerald-500" />
                    <InfoRow icon={Calendar} label="First Contact" value={new Date(conversation.last_message_at).toLocaleDateString()} colorClass="text-purple-500" />
                </div>

                <Separator className="my-4 bg-black/5 dark:bg-white/5 mx-4 w-auto" />

                {/* Tags Section */}
                <div className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">
                        <Tag size={12} className="text-amber-500" /> Relationship Tags
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['Potential Customer', 'Hindi Speaker', 'Website Visitor', 'Active'].map(tag => (
                            <span key={tag} className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-zinc-900 border border-black/5 dark:border-white/5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:border-emerald-500/50 cursor-pointer transition-colors">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>

                <Separator className="my-4 bg-black/5 dark:bg-white/5 mx-4 w-auto" />

                {/* Relationship Stats */}
                <div className="grid grid-cols-2 gap-px bg-neutral-100 dark:bg-white/5 mx-4 rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 mb-8">
                    <div className="bg-white dark:bg-black/20 p-4 flex flex-col items-center gap-1">
                        <div className="text-sm font-black text-zinc-900 dark:text-white">42</div>
                        <div className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Total Chats</div>
                    </div>
                    <div className="bg-white dark:bg-black/20 p-4 flex flex-col items-center gap-1">
                        <div className="text-sm font-black text-emerald-500">Active</div>
                        <div className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Lifecycle</div>
                    </div>
                </div>

                {/* Quick Actions Footer */}
                <div className="p-6 space-y-3">
                    <button className="w-full py-3 bg-neutral-100 dark:bg-zinc-900 hover:bg-neutral-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-black/5 dark:border-white/5">
                        Add Custom Note
                    </button>
                    <button className="w-full py-3 bg-red-50 dark:bg-zinc-900/50 hover:bg-red-100 dark:hover:bg-red-500/10 text-red-500/70 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-red-500/10">
                        Archive Relationship
                    </button>
                </div>
            </ScrollArea>
        </motion.div>
    );
};
