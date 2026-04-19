"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Monitor,
    Shield,
    MessageSquare,
    Bell,
    HelpCircle,
    LayoutDashboard,
} from 'lucide-react';
import { X as AnimatedX } from '@/components/animate-ui/icons/x';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Modular Tab Components
import { GeneralSettings } from './settings/GeneralSettings';
import { SecuritySettings } from './settings/SecuritySettings';
import { ChatsSettings } from './settings/ChatsSettings';
import { NotificationsSettings } from './settings/NotificationsSettings';

interface SettingsOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

type SettingsTab = 'general' | 'security' | 'chats' | 'notifications';

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    const navItems = [
        { id: 'general', label: 'General', icon: Monitor, description: 'Startup and close' },
        { id: 'security', label: 'Security & Access', icon: Shield, description: 'Guest Mode, Login, Permissions' },
        { id: 'chats', label: 'Chats', icon: MessageSquare, description: 'Theme, Wallpaper, Chat settings' },
        { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alerts, Sound, Desktop' },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return <GeneralSettings />;
            case 'security':
                return <SecuritySettings />;
            case 'chats':
                return <ChatsSettings />;
            case 'notifications':
                return <NotificationsSettings />;
            default:
                return (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                        <LayoutDashboard size={64} className="mb-4 text-zinc-700" />
                        <h3 className="text-lg font-black text-zinc-500 uppercase tracking-widest">Warping Logic...</h3>
                        <p className="text-xs font-bold text-zinc-600 max-w-[240px] mt-2 leading-relaxed">This business module is being synthesized by the AI Brain.</p>
                    </div>
                );
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-10 select-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="w-full max-w-5xl h-[80vh] bg-zinc-900/60 backdrop-blur-2xl rounded-[2rem] border border-white/10 flex overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 🛠️ LEFT NAVIGATION */}
                        <div className="w-[320px] bg-black/50 border-r border-white/5 flex flex-col p-6">
                            <div className="flex items-center gap-4 mb-10">
                                <Avatar className="w-16 h-16 border border-white/10">
                                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aryan" />
                                    <AvatarFallback>AK</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Aryan</h3>
                                    <p className="text-xs text-zinc-500 font-medium">Administrator</p>
                                </div>
                            </div>

                            <nav className="flex-1 space-y-1">
                                {navItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id as SettingsTab)}
                                        className={cn(
                                            "w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group text-left",
                                            activeTab === item.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                                        )}
                                    >
                                        <item.icon size={20} className={cn(activeTab === item.id ? "text-emerald-500" : "group-hover:text-zinc-400")} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold">{item.label}</div>
                                            <div className="text-[10px] opacity-60 truncate">{item.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </nav>

                            <button className="flex items-center gap-2 p-3 text-zinc-600 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mt-auto">
                                <HelpCircle size={14} /> Help & Feedback
                            </button>
                        </div>

                        {/* ⚡ CONTENT AREA */}
                        <div className="flex-1 flex flex-col bg-transparent relative">
                            <div className="p-8 flex items-center justify-between">
                                <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                                    {navItems.find(i => i.id === activeTab)?.label}
                                </h1>
                                <button
                                    onClick={onClose}
                                    className="p-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
                                >
                                    <AnimatedX size={24} animateOnHover />
                                </button>
                            </div>

                            <ScrollArea className="flex-1 px-8 pb-10">
                                <div className="space-y-8">
                                    {renderTabContent()}
                                </div>
                            </ScrollArea>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
