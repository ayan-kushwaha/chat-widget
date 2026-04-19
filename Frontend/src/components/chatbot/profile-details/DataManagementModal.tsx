"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Loader2, Eraser,
    ShieldAlert, RotateCcw, Sparkles,
    Trash2, AlertTriangle, CheckCircle2, EyeOff
} from 'lucide-react';
import { X as AnimatedX } from '@/components/animate-ui/icons/x';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DataManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    chatId: string;
    orgId: string;
    isolatedId: string;
}

type ConfirmAction = 'clear' | 'clear-all' | 'wipe-me' | 'wipe-all' | null;

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
    isOpen,
    onClose,
    chatId,
    orgId,
    isolatedId
}) => {
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);
    const [stats, setStats] = useState({
        deletedForEveryone: 0,
        deletedForMe: 0,
        labelsToClear: 0
    });
    const [wipedAt, setWipedAt] = useState<string | null>(null);
    const [wipedMode, setWipedMode] = useState<'me' | 'everyone' | null>(null);
    const [confirmingAction, setConfirmingAction] = useState<ConfirmAction>(null);

    // ⏱️ Countdown timer calculation
    const getRemainingTime = () => {
        if (!wipedAt) return null;
        const wipedTime = new Date(wipedAt).getTime();
        const now = Date.now();
        const elapsed = now - wipedTime;
        const remaining = (24 * 60 * 60 * 1000) - elapsed; // 24 hours in ms

        if (remaining <= 0) return '0hr';

        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

        if (hours > 0) {
            return `${hours}hr ${minutes}min`;
        }
        return `${minutes}min`;
    };

    const remainingTime = getRemainingTime();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

    useEffect(() => {
        if (isOpen && chatId) {
            fetchStats();
        }
    }, [isOpen, chatId]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/chats/${chatId}/deletion-stats?organizationId=${orgId}&isolatedId=${isolatedId}`);
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                // 🔥 Restore wipe status from backend
                if (data.wipeStatus) {
                    setWipedAt(data.wipeStatus.wipedAt);
                    setWipedMode(data.wipeStatus.wipedMode);
                }
            }
        } catch (error) {
            console.error("Fetch Stats Failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearLabels = async () => {
        try {
            setClearing(true);
            const res = await fetch(`${API_URL}/chats/${chatId}/clear-deleted`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: orgId, isolatedId })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Cleanup Success! Cleared ${data.deletedCount} indicators.`);
                setStats({ ...stats, labelsToClear: 0 });
                setConfirmingAction(null);
                window.dispatchEvent(new CustomEvent('chat-data-purged'));
            }
        } catch (error) {
            toast.error("Cleanup failed.");
        } finally {
            setClearing(false);
        }
    };

    const handleWipe = async (mode: 'me' | 'everyone') => {
        try {
            setClearing(true);
            const res = await fetch(`${API_URL}/chats/${chatId}/wipe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: orgId, isolatedId, mode })
            });
            const data = await res.json();
            if (data.success) {
                setWipedMode(mode);
                setWipedAt(new Date().toISOString());
                toast.success(mode === 'me' ? "History hidden from user side." : "Wipe initiated for everyone.");
                setConfirmingAction(null);
                window.dispatchEvent(new CustomEvent('chat-data-purged'));
            }
        } catch (error) {
            toast.error("Process failed.");
        } finally {
            setClearing(false);
        }
    };

    const handleUndo = async () => {
        if (!wipedMode) return;
        try {
            setClearing(true);
            const res = await fetch(`${API_URL}/chats/${chatId}/undo-wipe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: orgId, isolatedId, mode: wipedMode })
            });
            const data = await res.json();
            if (data.success) {
                setWipedMode(null);
                setWipedAt(null);
                toast.success(wipedMode === 'me' ? "User side history restored." : "Global history restored.");
                window.dispatchEvent(new CustomEvent('chat-data-purged'));
            }
        } catch (error) {
            toast.error("Undo failed.");
        } finally {
            setClearing(false);
        }
    };

    // 🛡️ Confirmation Config
    const confirmConfig: Record<string, { title: string; description: string; action: () => void; color: string }> = {
        'clear': {
            title: 'Clear Ghost Labels For Me?',
            description: 'This will permanently remove the "This message was deleted" indicators from your local view.',
            action: handleClearLabels,
            color: 'indigo'
        },
        'clear-all': {
            title: 'Clear Ghost Labels For Everyone?',
            description: `This will permanently remove ${stats.deletedForMe} "Deleted" indicators for all users.`,
            action: () => handleWipe('me'),
            color: 'indigo'
        },
        'wipe-me': {
            title: 'Hide Chats From User Side?',
            description: 'This will hide all previous chat history from the user widget. New messages will still be visible. Admin can restore anytime.',
            action: () => handleWipe('me'),
            color: 'indigo'
        },
        'wipe-all': {
            title: 'Delete All SMS For Everyone?',
            description: 'This will hide all chat history for everyone. Recoverable within 24 hours, then permanently deleted from server.',
            action: () => handleWipe('everyone'),
            color: 'red'
        }
    };

    if (!isOpen) return null;

    // 🔥 Render modal at document.body level to escape sidebar stacking context
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
            >
                {/* 🛡️ Unified Confirmation Overlay */}
                <AnimatePresence>
                    {confirmingAction && confirmConfig[confirmingAction] && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="absolute inset-x-0 bottom-0 z-[110] p-6 bg-white dark:bg-zinc-950 border-t border-neutral-100 dark:border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] rounded-t-[2rem]"
                        >
                            <div className="space-y-4">
                                <div className={cn(
                                    "flex items-center gap-3",
                                    confirmConfig[confirmingAction].color === 'red' ? "text-red-500" : "text-orange-500"
                                )}>
                                    <AlertTriangle size={20} />
                                    <h4 className="text-sm font-black uppercase tracking-wider">{confirmConfig[confirmingAction].title}</h4>
                                </div>
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
                                    {confirmConfig[confirmingAction].description}
                                </p>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => setConfirmingAction(null)}
                                        className="flex-1 h-12 rounded-2xl bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-widest text-[9px] hover:bg-neutral-200 dark:hover:bg-white/10"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={confirmConfig[confirmingAction].action}
                                        disabled={clearing}
                                        className={cn(
                                            "flex-[2] h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg",
                                            confirmConfig[confirmingAction].color === 'red'
                                                ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                                                : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20"
                                        )}
                                    >
                                        {clearing ? <Loader2 size={16} className="animate-spin" /> : "Yes, Proceed"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 🏷️ Header */}
                <div className="p-6 flex justify-between items-center border-b border-neutral-100 dark:border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                            <Database size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">Data Control</h3>
                            <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest">Management & Recovery</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-all"
                    >
                        <AnimatedX size={18} animateOnHover />
                    </button>
                </div>

                <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="py-16 flex flex-col items-center gap-4">
                            <div className="relative">
                                <Loader2 size={32} className="text-indigo-500 animate-spin" />
                                <div className="absolute inset-0 blur-lg opacity-50 bg-indigo-500 rounded-full animate-pulse" />
                            </div>
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em]">Analyzing encrypted bytes...</p>
                        </div>
                    ) : (
                        <>
                            {/* 🧹 Maintenance Zone */}
                            <div className="space-y-4">
                                <SectionHeader title="Maintenance" icon={Sparkles} color="indigo" />
                                <div className="bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800/60 rounded-3xl p-5 space-y-3">
                                    <ActionButton
                                        title="Clear Ghost Labels For Me"
                                        desc={`Remove ${stats.labelsToClear} "Deleted" indicators.`}
                                        onClick={() => setConfirmingAction('clear')}
                                        icon={CheckCircle2}
                                        danger={false}
                                        disabled={stats.labelsToClear === 0}
                                    />
                                    <ActionButton
                                        title="Clear Ghost Labels For Everyone"
                                        desc={`Permanently remove ${stats.deletedForMe} indicators for all.`}
                                        onClick={() => setConfirmingAction('clear-all')}
                                        icon={Eraser}
                                        danger={false}
                                        disabled={stats.deletedForMe === 0}
                                    />
                                </div>
                            </div>

                            {/* 🌪️ Danger Zone */}
                            <div className="space-y-4">
                                <SectionHeader title="Danger Zone" icon={ShieldAlert} color="red" />
                                <div className="bg-red-50/50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-3xl p-5 space-y-4">
                                    {wipedAt && wipedMode === 'everyone' ? (
                                        // Global wipe active - show only restore
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl">
                                                <div className="text-emerald-500 pt-0.5">
                                                    <RotateCcw size={16} className="animate-spin" />
                                                </div>
                                                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
                                                    Deleted all chats for everyone. Can undo till <span className="font-bold text-emerald-600 dark:text-emerald-200">{remainingTime}</span>
                                                </p>
                                            </div>
                                            <Button
                                                onClick={handleUndo}
                                                disabled={clearing}
                                                className="w-full h-12 rounded-[1.2rem] bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20"
                                            >
                                                {clearing ? <Loader2 size={16} className="animate-spin" /> : "Restore Chats"}
                                            </Button>
                                        </div>
                                    ) : wipedMode === 'me' ? (
                                        // User-side hide active (no TTL, permanent until restored)
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-4 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl">
                                                <div className="text-amber-500 pt-0.5">
                                                    <EyeOff size={16} />
                                                </div>
                                                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                                                    Chat history <span className="font-bold">hidden from user side</span>. Admin can view and restore anytime.
                                                </p>
                                            </div>
                                            <Button
                                                onClick={handleUndo}
                                                disabled={clearing}
                                                className="w-full h-12 rounded-[1.2rem] bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20"
                                            >
                                                {clearing ? <Loader2 size={16} className="animate-spin" /> : "Restore Chats"}
                                            </Button>
                                            {/* Still allow global wipe */}
                                            <ActionButton
                                                title="Delete All SMS For Everyone"
                                                desc="Wipe globally with 24h recovery window."
                                                onClick={() => setConfirmingAction('wipe-all')}
                                                icon={Trash2}
                                                danger={true}
                                            />
                                        </div>
                                    ) : (
                                        // No wipe active - show both options
                                        <>
                                            <div className="grid grid-cols-1 gap-3">
                                                <ActionButton
                                                    title="Hide Chats from User Side"
                                                    desc="User won't see chats. Admin can view & restore anytime."
                                                    onClick={() => setConfirmingAction('wipe-me')}
                                                    icon={EyeOff}
                                                    danger={false}
                                                />
                                                <ActionButton
                                                    title="Delete All SMS For Everyone"
                                                    desc="Wipe globally with 24h recovery window."
                                                    onClick={() => setConfirmingAction('wipe-all')}
                                                    icon={Trash2}
                                                    danger={true}
                                                />
                                            </div>
                                            <p className="text-[9px] text-neutral-400 dark:text-neutral-500 text-center font-bold uppercase tracking-widest mt-2 px-4 italic opacity-70">
                                                Everyone Delete = 24hr TTL. User Side Hide = Permanent until restored.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

const SectionHeader = ({ title, icon: Icon, color }: { title: string; icon: any; color: string }) => (
    <div className="flex items-center gap-2 px-1">
        <Icon size={14} className={color === 'red' ? "text-red-500" : "text-indigo-500"} />
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">{title}</h4>
    </div>
);

const ActionButton = ({ title, desc, onClick, icon: Icon, danger, loading, disabled }: { title: string; desc: string; onClick: () => void; icon: any; danger: boolean; loading?: boolean; disabled?: boolean }) => (
    <button
        onClick={onClick}
        disabled={loading || disabled}
        className={cn(
            "w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 group disabled:opacity-40 disabled:cursor-not-allowed",
            danger
                ? "bg-red-500/5 hover:bg-red-500 border-red-500/20 hover:border-red-500 text-red-500 hover:text-white"
                : "bg-white dark:bg-zinc-900 hover:bg-neutral-900 dark:hover:bg-white border-neutral-200 dark:border-white/10 hover:border-neutral-900 dark:hover:border-white text-neutral-900 dark:text-white hover:text-white dark:hover:text-black shadow-sm"
        )}
    >
        <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
            danger ? "bg-red-500/10 group-hover:bg-white/20" : "bg-neutral-100 dark:bg-white/5 group-hover:bg-white/10 dark:group-hover:bg-black/10"
        )}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />}
        </div>
        <div className="flex-1">
            <div className="text-[11px] font-black uppercase tracking-wider">{title}</div>
            <div className={cn(
                "text-[9px] font-medium leading-tight opacity-60 group-hover:opacity-90 transition-opacity",
                danger ? "text-red-600 group-hover:text-red-100" : "text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-50 dark:group-hover:text-neutral-700"
            )}>
                {desc}
            </div>
        </div>
    </button>
);
