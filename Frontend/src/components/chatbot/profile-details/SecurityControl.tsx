import React, { useState } from 'react';
import {
    ShieldAlert, ShieldOff, Trash2, Flag, Timer, TimerOff,
    ChevronRight, Star, Clock, Bell, BellOff, Fingerprint, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Conversation } from '../types';
import { DataManagementModal } from './DataManagementModal';

interface SecurityControlProps {
    conversation?: Conversation;
}

export const SecurityControl: React.FC<SecurityControlProps> = ({ conversation }) => {
    const [disappearingOn, setDisappearingOn] = useState(false);
    const [notificationsOn, setNotificationsOn] = useState(true);
    const [blocked, setBlocked] = useState(false);
    const [timer, setTimer] = useState('Weekly');
    const [showDataModal, setShowDataModal] = useState(false);

    // Get Device & Role for Deletion Management
    const deviceId = typeof window !== 'undefined' ? localStorage.getItem('cluaiz_device_id') || 'guest_device' : 'guest_device';
    const isolatedId = `${deviceId}_user`; // Always 'user' role for widget side

    return (
        <div className="flex flex-col gap-6 w-full max-w-xl mx-auto ">
            <SectionHeader title="Chat Customization" icon={Clock} />

            <div className="bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg overflow-hidden p-1">
                <SecurityItem
                    icon={notificationsOn ? Bell : BellOff}
                    label="Chat Notifications"
                    status={notificationsOn ? "Alert On Message" : "Muted"}
                    color="indigo"
                    hasSwitch
                    checked={notificationsOn}
                    onCheckedChange={setNotificationsOn}
                />
            </div>

            <SectionHeader title="Privacy & Security" icon={ShieldAlert} />

            <div className="flex flex-col gap-4">
                {/* SETTINGS GROUP */}
                <div className="bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg overflow-hidden p-1">
                    <SecurityItem
                        icon={disappearingOn ? Timer : TimerOff}
                        label="Disappearing Messages"
                        status={disappearingOn ? timer : "Off"}
                        color="indigo"
                        hasSwitch
                        checked={disappearingOn}
                        onCheckedChange={setDisappearingOn}
                    />

                    <AnimatePresence>
                        {disappearingOn && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mx-2 rounded-lg mb-1"
                            >
                                <div className="p-3 flex flex-wrap gap-2 justify-center">
                                    {['Weekly', 'Monthly', '60 Days', '90 Days'].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTimer(t)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                                                timer === t
                                                    ? "bg-indigo-500 text-black border-indigo-500"
                                                    : "bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50"
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* DANGER DEPARTMENTS */}
                <div className="bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg overflow-hidden p-1">
                    <SecurityItem
                        icon={Flag}
                        label="Report Contact"
                        status="Report Spam or Abuse"
                        color="red"
                    />
                    <div className="h-px bg-zinc-200/50 dark:bg-zinc-800/30 mx-4" />
                    <SecurityItem
                        icon={blocked ? ShieldAlert : ShieldOff}
                        label="Block Contact"
                        status={blocked ? "Account Restricted" : "Interaction Allowed"}
                        color="red"
                        hasSwitch
                        checked={blocked}
                        onCheckedChange={setBlocked}
                    />
                </div>

                {/* DESTRUCTIVE ACTION CARDS */}
                <div className="bg-red-500/5 border border-red-500/10 rounded-lg overflow-hidden p-1 mt-2">
                    <SecurityItem
                        icon={Trash2}
                        label="Delete Chat History"
                        status="Clear all interaction data"
                        color="red"
                    />
                    <div className="h-px bg-red-500/10 mx-4" />
                    <SecurityItem
                        icon={Trash2}
                        label="Delete Account"
                        status="Permanent Account Removal"
                        color="red"
                    />
                </div>

                {/* 🧹 DATA MANAGEMENT (Phase 4) */}
                <SectionHeader title="System Optimization" icon={Database} />
                <div
                    className="bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg overflow-hidden p-1"
                    onClick={() => setShowDataModal(true)}
                >
                    <SecurityItem
                        icon={Database}
                        label="Data Management"
                        status="Clear deleted labels & stats"
                        color="indigo"
                    />
                </div>
            </div>

            {/* 🔒 Footer Encryption Info */}
            <div className="mt-8 flex flex-col items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
                <Fingerprint size={24} className="text-zinc-500" strokeWidth={1} />
                <p className="text-[10px] font-bold text-zinc-500 text-center px-8">
                    Your personal messages are end-to-end encrypted and verified secure.
                </p>
            </div>

            {/* MODALS */}
            {conversation && (
                <DataManagementModal
                    isOpen={showDataModal}
                    onClose={() => setShowDataModal(false)}
                    chatId={conversation._id}
                    orgId={conversation.organizationId}
                    isolatedId={isolatedId}
                />
            )}
        </div>
    );
};

const SecurityItem = ({ icon: Icon, label, status, color, hasSwitch, checked, onCheckedChange }: any) => (
    <motion.div
        initial={{ borderColor: 'transparent' }}
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
        className="flex items-center justify-between p-4 px-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all cursor-pointer group rounded-lg"
    >
        <div className="flex items-center gap-4">
            <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center border transition-colors",
                color === 'indigo' ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/10 group-hover:bg-indigo-500 group-hover:text-black" :
                    color === 'emerald' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-black" :
                        color === 'amber' ? "bg-amber-500/10 text-amber-500 border-amber-500/10 group-hover:bg-amber-500 group-hover:text-black" :
                            "bg-red-500/10 text-red-500 border-red-500/10 group-hover:bg-red-500 group-hover:text-black"
            )}>
                <Icon size={18} strokeWidth={2} />
            </div>
            <div>
                <div className="text-[14px] font-bold text-zinc-800 dark:text-zinc-100 transition-colors">{label}</div>
                <div className="text-[11px] text-zinc-500 font-medium">{status}</div>
            </div>
        </div>
        {hasSwitch ? (
            <Switch
                checked={checked}
                onCheckedChange={onCheckedChange}
                className={cn(
                    "transition-all",
                    color === 'indigo' ? "data-[state=checked]:bg-indigo-500" :
                        color === 'amber' ? "data-[state=checked]:bg-amber-500" :
                            "data-[state=checked]:bg-red-500"
                )}
            />
        ) : (
            <ChevronRight size={14} className="text-zinc-500 opacity-40 group-hover:opacity-100 transition-opacity" />
        )}
    </motion.div>
);

const SectionHeader = ({ title, icon: Icon }: any) => (
    <div className="flex items-center gap-3 opacity-80 mt-12 mb-2 px-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
        <span className="text-[12px] font-bold text-zinc-400 flex items-center gap-2 italic">
            <Icon size={14} className="text-zinc-500" /> {title}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
    </div>
);
