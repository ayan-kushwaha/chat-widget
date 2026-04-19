import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Video, Mail, Globe, QrCode, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Conversation } from '../types';

interface IdentityCardProps {
    conversation: Conversation;
}

export const IdentityCard: React.FC<IdentityCardProps> = ({ conversation }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div className="perspective-1000 w-full aspect-[4/5] relative group">
            <motion.div
                className="w-full h-full relative preserve-3d transition-all duration-700"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
                {/* FRONT FACE */}
                <div className="absolute inset-0 backface-hidden">
                    <div className="h-full w-full bg-white dark:bg-zinc-900/80 border border-white/20 dark:border-white/5 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-8 backdrop-blur-2xl">
                        {/* Card Texture/Shine */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                        <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-50" />

                        {/* Avatar Ring */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20" />
                            <Avatar className="w-32 h-32 border-[6px] border-white dark:border-[#1a1a1a] shadow-2xl">
                                <AvatarImage src={conversation.userAvatar} />
                                <AvatarFallback className="text-3xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">{conversation.userName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-2 right-2 bg-emerald-500 p-1.5 rounded-full border-4 border-white dark:border-[#1a1a1a]" title="Online">
                                <div className="w-full h-full bg-emerald-300 rounded-full animate-ping absolute inset-0 opacity-50" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-1 text-center">{conversation.userName}</h2>
                        <div className="flex items-center gap-2 mb-8">
                            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1 px-3 py-1 rounded-full">
                                <ShieldCheck className="w-3 h-3" /> Verified
                            </Badge>
                            <span className="text-xs font-medium text-zinc-400">{conversation.userLocation || 'Dubai, UAE'}</span>
                        </div>

                        {/* Action Bar */}
                        <div className="grid grid-cols-4 gap-3 w-full mb-8">
                            {[
                                { icon: Phone, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Call" },
                                { icon: Video, color: "text-blue-500", bg: "bg-blue-500/10", label: "Meet" },
                                { icon: Mail, color: "text-purple-500", bg: "bg-purple-500/10", label: "Email" },
                                { icon: Globe, color: "text-orange-500", bg: "bg-orange-500/10", label: "Site" }
                            ].map((action, idx) => (
                                <Button key={idx} variant="outline" className={cn("h-14 rounded-2xl border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all flex flex-col gap-1 items-center justify-center group/btn", action.bg, "dark:bg-zinc-800/50")}>
                                    <action.icon size={20} className={action.color} />
                                </Button>
                            ))}
                        </div>

                        <Button
                            onClick={() => setIsFlipped(true)}
                            className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-bold h-12 rounded-2xl hover:scale-[1.02] transition-transform active:scale-95 shadow-xl flex items-center gap-2"
                        >
                            <QrCode size={18} />
                            Flip to Connect
                        </Button>
                    </div>
                </div>

                {/* BACK FACE (QR CODE) */}
                <div className="absolute inset-0 backface-hidden rotate-y-180">
                    <div className="h-full w-full bg-zinc-900 dark:bg-black border border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-8 text-center">
                        <div className="absolute top-0 right-0 p-8 opacity-20">
                            <QrCode size={120} className="text-white" />
                        </div>

                        <h3 className="text-white font-black text-2xl mb-2">Scan to Chat</h3>
                        <p className="text-zinc-500 text-sm mb-8">Share contact instantly</p>

                        <div className="p-4 bg-white rounded-3xl mb-8 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                            <QrCode size={180} className="text-black" />
                        </div>

                        <Button
                            onClick={() => setIsFlipped(false)}
                            variant="outline"
                            className="w-full border-white/20 text-white hover:bg-white/10 h-12 rounded-2xl"
                        >
                            Back to Profile
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
