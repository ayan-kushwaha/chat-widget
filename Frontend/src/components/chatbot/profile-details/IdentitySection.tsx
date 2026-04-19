import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    QrCode, Share2, Edit2, Download, CheckCircle2, MoreHorizontal, Mail, MapPin,
    Phone, Calendar, Hash, PhoneCall, CalendarDays
} from 'lucide-react';
import { IoLogoWhatsapp, IoLogoInstagram, IoLogoLinkedin } from 'react-icons/io5';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Conversation } from '../types';

interface IdentitySectionProps {
    conversation: Conversation;
    onCallClick?: () => void;
    onScheduleClick?: () => void;
}

export const IdentitySection: React.FC<IdentitySectionProps> = ({
    conversation,
    onCallClick,
    onScheduleClick
}) => {
    return (
        <div className="flex flex-col items-center w-full max-w-full">

            {/* 1. Main Avatar (Click Trigger) with Green Glow */}
            <div className="relative group cursor-pointer z-10 flex flex-col items-center">
                <AvatarCardModal conversation={conversation}>
                    <div className="relative">
                        {/* 🌟 Radiant Green Glow (Slowed Down) */}
                        <motion.div
                            animate={{ opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-emerald-500/30 rounded-full blur-[40px] group-hover:bg-emerald-400/40 transition-all duration-700"
                        />

                        {/* Inner Circle Glow (Shadow) */}
                        <div className="absolute inset-x-0 inset-y-0 rounded-full shadow-[0_0_25px_rgba(16,185,129,0.3)] pointer-events-none z-0" />

                        <Avatar className="w-40 h-40 border-[4px] border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02] relative z-10 bg-zinc-900 overflow-hidden">
                            <AvatarImage src={conversation.userAvatar} className="object-cover" />
                            <AvatarFallback className="text-4xl font-black">{conversation.userName?.[0]}</AvatarFallback>
                        </Avatar>

                        {/* Verified Check Overlay (Slow Pulse) */}
                        <div className="absolute bottom-2 right-2 z-20">
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="relative"
                            >
                                <div className="absolute inset-0 bg-emerald-500 blur-md opacity-50 rounded-full" />
                                <div className="bg-emerald-500 p-1 rounded-full shadow-lg border-2 border-zinc-950 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-zinc-950 fill-none" strokeWidth={3} />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </AvatarCardModal>
            </div>

            {/* 2. Name & Verified Badge */}
            <div className="mt-8 text-center flex flex-col items-center gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-[42px] font-black text-white tracking-tight leading-none">
                        {conversation.userName}
                    </h1>
                </div>

                {/* ⚡ Action & Social Hub */}
                <div className="flex flex-col items-center gap-6 mt-4">
                    {/* Action Hub (Cards with Text) */}
                    <div className="flex items-center gap-4">
                        <ActionButton
                            icon={PhoneCall}
                            label="Voice Call "
                            onClick={onCallClick}
                            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        />
                        <ActionButton
                            icon={CalendarDays}
                            label="Book Slot"
                            onClick={onScheduleClick}
                            className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                        />
                    </div>

                    <div className="flex items-center gap-6 px-12">
                        <div className="h-px w-12 bg-zinc-800" />
                        <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">Direct Connect</span>
                        <div className="h-px w-12 bg-zinc-800" />
                    </div>

                    {/* Social Nexus (Original Brand Icons) */}
                    <div className="flex items-center gap-4">
                        <SocialIcon icon={IoLogoInstagram} className="hover:text-pink-500 hover:bg-pink-500/5" />
                        <SocialIcon icon={IoLogoLinkedin} className="hover:text-blue-500 hover:bg-blue-500/5" />
                        <SocialIcon icon={IoLogoWhatsapp} className="hover:text-emerald-500 hover:bg-emerald-500/5" />
                    </div>
                </div>
            </div>

            {/* 3. Premium Info Grid (Glassmorphism Level 2) */}
            <div className="w-full mt-16 grid grid-cols-1 md:grid-cols-2 gap-4 px-8 max-w-5xl">
                <InfoItem icon={MapPin} label="Location" value={conversation.userLocation || "Dubai, UAE"} color="blue" />
                <InfoItem icon={Mail} label="Email Address" value={`contact@${conversation.userName?.toLowerCase().replace(/\s/g, '')}.com` || "Hidden"} color="emerald" />
                <InfoItem icon={Phone} label="Phone Number" value="+91 63943 11141" color="indigo" />
                <InfoItem icon={Calendar} label="Campaign Timeline" value="20/01/2026 — 29/01/2026" color="purple" />
            </div>

        </div>
    );
};

// --- SUB-COMPONENTS ---

const ActionButton = ({ icon: Icon, label, className, onClick }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "flex flex-col items-center gap-3 p-4 px-8 rounded-3xl border transition-all active:scale-95 group min-w-[120px]",
            className
        )}
    >
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
            <Icon size={18} />
        </div>
        <span className="text-[11px] font-black uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
            {label}
        </span>
    </button>
);

const SocialIcon = ({ icon: Icon, className }: any) => (
    <button className={cn(
        "w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800/50 flex items-center justify-center text-zinc-500 transition-all active:scale-90 group",
        className
    )}>
        <div className="transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
            <Icon size={20} />
        </div>
    </button>
);

const InfoItem = ({ icon: Icon, label, value, color }: any) => {
    const colorMap: any = {
        blue: "text-blue-500 bg-blue-500/5 border-blue-500/10",
        emerald: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10",
        indigo: "text-indigo-500 bg-indigo-500/5 border-indigo-500/10",
        purple: "text-purple-500 bg-purple-500/5 border-purple-500/10"
    };

    return (
        <div className="flex flex-col gap-3 p-6 bg-zinc-900/40 dark:bg-black/20 border border-zinc-800/50 rounded-[2rem] hover:bg-zinc-800/40 transition-all group">
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6", colorMap[color])}>
                    <Icon size={14} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none">
                    {label}
                </span>
            </div>
            <div className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight pl-1">
                {value}
            </div>
        </div>
    );
};

// --- THE POPUP CARD (Reuse Logic) ---
const AvatarCardModal = ({ children, conversation }: { children: React.ReactNode, conversation: Conversation }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;
    const swipeConfidenceThreshold = 10000;

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-transparent border-none shadow-none p-0 flex items-center justify-center max-w-sm w-full outline-none">

                <div className="w-full perspective-1000 h-[500px] group cursor-grab active:cursor-grabbing select-none">
                    <motion.div
                        className="w-full h-full relative preserve-3d transition-all duration-700"
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = swipePower(offset.x, velocity.x);
                            if (swipe < -swipeConfidenceThreshold) setIsFlipped(true);
                            else if (swipe > swipeConfidenceThreshold) setIsFlipped(false);
                        }}
                    >
                        {/* FRONT FACE */}
                        <div className="absolute inset-0 backface-hidden">
                            <div className="h-full w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center pt-12 pb-8 px-6">
                                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
                                <div className="relative mb-6">
                                    <Avatar className="w-40 h-40 border-[8px] border-white dark:border-zinc-950 shadow-xl">
                                        <AvatarImage src={conversation.userAvatar} className="object-cover" />
                                        <AvatarFallback>{conversation.userName?.[0]}</AvatarFallback>
                                    </Avatar>
                                </div>
                                <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">{conversation.userName}</h2>
                                <div className="mt-auto flex flex-col items-center gap-4 w-full">
                                    <Button onClick={() => setIsFlipped(true)} className="w-full rounded-2xl h-12 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold shadow-lg">
                                        <QrCode size={18} className="mr-2" /> Show QR Code
                                    </Button>
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Tap or Swipe to Flip</p>
                                </div>
                            </div>
                        </div>

                        {/* BACK FACE */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180">
                            <div className="h-full w-full bg-zinc-900 dark:bg-black border border-zinc-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-row">
                                <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                                    <div className="absolute top-6 left-6" onClick={() => setIsFlipped(false)}><Button variant="ghost" size="icon" className="rounded-full text-zinc-500"><MoreHorizontal size={20} /></Button></div>
                                    <div className="p-1 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl shadow-[0_0_60px_rgba(99,102,241,0.3)]">
                                        <div className="bg-white p-4 rounded-[20px]"><QrCode size={160} className="text-black" /></div>
                                    </div>
                                    <h3 className="text-white font-black text-sm mt-8 uppercase tracking-widest">Scan Me</h3>
                                </div>
                                <div className="w-16 border-l border-white/5 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center gap-6 py-8">
                                    <ActionIcon icon={Download} label="Save" />
                                    <ActionIcon icon={Share2} label="Share" />
                                    <ActionIcon icon={Edit2} label="Edit" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

            </DialogContent>
        </Dialog>
    );
};
const ActionIcon = ({ icon: Icon, label }: any) => (
    <div className="flex flex-col items-center gap-1 group cursor-pointer">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-indigo-500 transition-all"><Icon size={16} /></div>
        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider group-hover:text-zinc-300">{label}</span>
    </div>
);
