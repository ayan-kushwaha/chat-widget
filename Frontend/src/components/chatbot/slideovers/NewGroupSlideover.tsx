"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Users,
    Check,
    Lock,
    Globe,
    MessageSquare,
    Shield,
    Image as ImageIcon,
    Settings2,
    Info,
    UserCircle2,
    ToggleLeft,
    ToggleRight,
    EyeOff,
    Trash2,
    Zap,
    Hash,
    Sparkles,
    Smile,
    X
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover";
import { GroupService, Group } from '@/services/group.service';
import { useOrg } from '@/context/OrgContext';
import { cn } from '@/lib/utils';

interface NewGroupSlideoverProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    onGroupCreated: (group: any) => void;
    editGroup?: Group | null;
}

export const NewGroupSlideover: React.FC<NewGroupSlideoverProps> = ({
    isOpen,
    onClose,
    onBack,
    onGroupCreated,
    editGroup
}) => {
    const { activeOrg } = useOrg();
    const orgId = activeOrg?._id || activeOrg?.id;

    const [formData, setFormData] = useState({
        name: editGroup?.name || '',
        description: editGroup?.description || '',
        emoji: editGroup?.emoji || '👥',
        isPrivate: editGroup?.isPrivate ?? true,
        onlyAdminsCanPost: editGroup?.onlyAdminsCanPost ?? false,
        requiresApproval: editGroup?.requiresApproval ?? true,
        hideMemberList: editGroup?.hideMemberList ?? false,
        ephemeralSignals: editGroup?.ephemeralSignals ?? false,
        ephemeralDuration: editGroup?.ephemeralDuration || '24h',
        canAiAutoAdd: editGroup?.isSmart || false,
        aiIntent: editGroup?.aiIntent || '',
        aiTags: editGroup?.aiTags || [] as string[]
    });

    const [currentTag, setCurrentTag] = useState('');
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    // 🔄 Sync form data when editGroup changes
    React.useEffect(() => {
        if (isOpen) {
            if (editGroup) {
                setFormData({
                    name: editGroup.name || '',
                    description: editGroup.description || '',
                    emoji: editGroup.emoji || '👥',
                    isPrivate: editGroup.isPrivate ?? true,
                    onlyAdminsCanPost: editGroup.onlyAdminsCanPost ?? false,
                    requiresApproval: editGroup.requiresApproval ?? true,
                    hideMemberList: editGroup.hideMemberList ?? false,
                    ephemeralSignals: editGroup.ephemeralSignals ?? false,
                    ephemeralDuration: editGroup.ephemeralDuration || '24h',
                    canAiAutoAdd: editGroup.isSmart || false,
                    aiIntent: editGroup.aiIntent || '',
                    aiTags: editGroup.aiTags || []
                });
            } else {
                // Reset to defaults for New Group
                setFormData({
                    name: '',
                    description: '',
                    emoji: '👥',
                    isPrivate: true,
                    onlyAdminsCanPost: false,
                    requiresApproval: true,
                    hideMemberList: false,
                    ephemeralSignals: false,
                    ephemeralDuration: '24h',
                    canAiAutoAdd: false,
                    aiIntent: '',
                    aiTags: []
                });
            }
        }
    }, [editGroup, isOpen]);

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !orgId) return;

        setIsSaving(true);
        try {
            if (editGroup?._id) {
                // UPDATE MODE
                const response = await GroupService.updateGroup(editGroup._id, {
                    ...formData,
                    isSmart: formData.canAiAutoAdd
                } as any);
                if (response.success) {
                    onGroupCreated(response.group || response.data);
                    onClose();
                }
            } else {
                // CREATE MODE
                const response = await GroupService.createGroup(orgId, {
                    ...formData,
                    isSmart: formData.canAiAutoAdd
                });
                if (response.success) {
                    onGroupCreated(response.group);
                    onClose();
                }
            }
        } catch (err) {
            console.error("Failed to save group:", err);
        } finally {
            setIsSaving(false);
        }
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
                        {/* 💎 HEADER */}
                        <div className="relative pt-12 pb-6 px-6 bg-gradient-to-b from-emerald-500/10 to-transparent">
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
                                    <h2 className="text-xl font-black text-white tracking-tight uppercase">
                                        {editGroup ? 'EDIT GROUP' : 'NEW GROUP'}
                                    </h2>
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.2em]">
                                        {editGroup ? 'UPDATE YOUR GROUP SETTINGS' : 'SETUP YOUR CHAT GROUP'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ⚡ CONTENT */}
                        <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                            <div className="px-6 py-6 space-y-10">
                                {/* Profile Piece */}
                                <div className="flex flex-col items-center gap-6">
                                    <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                                        <PopoverAnchor asChild>
                                            <div
                                                className="relative group cursor-pointer select-none"
                                                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    setIsEmojiPickerOpen(true);
                                                }}
                                            >
                                                <div className="w-28 h-28 rounded-full bg-zinc-900 border-2 border-dashed border-white/10 flex items-center justify-center group-hover:border-emerald-500/50 transition-all overflow-hidden relative">
                                                    <span className="text-6xl">{formData.emoji}</span>
                                                </div>
                                                <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-4 border-neutral-950 group-hover:scale-110 transition-transform">
                                                    <Smile size={14} className="text-black" />
                                                </div>
                                            </div>
                                        </PopoverAnchor>
                                        <PopoverContent
                                            className="w-auto p-0 border-none bg-transparent shadow-2xl z-[1000]"
                                            align="center"
                                            side="right"
                                            sideOffset={20}
                                        >
                                            <EmojiPicker
                                                theme={Theme.DARK}
                                                onEmojiClick={(emojiData) => {
                                                    setFormData({ ...formData, emoji: emojiData.emoji });
                                                    setIsEmojiPickerOpen(false);
                                                }}
                                                lazyLoadEmojis={true}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Inputs */}
                                <div className="space-y-8">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Group Details</label>
                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-6">
                                            <PremiumInput
                                                icon={Users}
                                                placeholder="GROUP NAME"
                                                value={formData.name}
                                                onChange={(val: string) => setFormData({ ...formData, name: val })}
                                                required
                                                maxLength={40}
                                            />
                                            <div className="flex gap-4 group">
                                                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5 group-focus-within:border-emerald-500/50 transition-colors">
                                                    <Info className="text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <textarea
                                                        maxLength={120}
                                                        placeholder="WHAT IS THIS GROUP FOR? (OPTIONAL)"
                                                        value={formData.description}
                                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                        className="w-full bg-transparent py-2 text-sm font-bold text-white placeholder:text-zinc-700 outline-none transition-all tracking-widest border-b border-transparent focus:border-emerald-500/30 resize-none h-20 overflow-hidden"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Settings Toggle Area */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">Group Settings</label>
                                        <div className="bg-white/5 rounded-2xl p-2 border border-white/5 divide-y divide-white/5 overflow-hidden">
                                            <div className="flex flex-col">
                                                <SettingToggle
                                                    icon={Sparkles}
                                                    title="AI AUTO-ASSIGNMENT"
                                                    description="AI AUTOMATICALLY ADDS RELEVANT USERS TO THIS GROUP"
                                                    isActive={formData.canAiAutoAdd}
                                                    onToggle={() => setFormData({ ...formData, canAiAutoAdd: !formData.canAiAutoAdd })}
                                                    color="emerald"
                                                />
                                                <AnimatePresence>
                                                    {formData.canAiAutoAdd && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden px-6 pb-6 space-y-4"
                                                        >
                                                            <div className="flex flex-col gap-1.5 pt-4 border-t border-white/5 group/intent">
                                                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 text-left w-full">AI Intent / Criteria</label>
                                                                <div className="flex items-center gap-4 w-full">
                                                                    <motion.div
                                                                        initial={{ x: -20, opacity: 0 }}
                                                                        animate={{ x: 0, opacity: 1 }}
                                                                        className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5 group-focus-within/intent:border-emerald-500/50 transition-all duration-500"
                                                                    >
                                                                        <Sparkles className="text-zinc-600 group-focus-within/intent:text-emerald-500 transition-colors" size={18} />
                                                                    </motion.div>
                                                                    <div className="flex-1 relative">
                                                                        <input
                                                                            type="text"
                                                                            maxLength={60}
                                                                            placeholder="E.G. USERS INTERESTED IN PRICING"
                                                                            className="w-full bg-transparent py-2 text-sm font-bold text-white placeholder:text-zinc-700 outline-none transition-all tracking-widest border-b border-transparent focus:border-emerald-500/30"
                                                                            value={formData.aiIntent}
                                                                            onChange={(e) => setFormData({ ...formData, aiIntent: e.target.value })}
                                                                        />
                                                                        <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 group-focus-within/intent:w-full transition-all duration-500"></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1.5 pt-2 group/tags">
                                                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">ASSIGN IDENTIFICATION TAGS</label>
                                                                <div className="flex flex-col gap-2">
                                                                    <div className="flex flex-wrap gap-2">
                                                                        <AnimatePresence>
                                                                            {formData.aiTags.map((tag, index) => (
                                                                                <motion.span
                                                                                    key={index}
                                                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                                                    animate={{ scale: 1, opacity: 1 }}
                                                                                    exit={{ scale: 0.8, opacity: 0 }}
                                                                                    className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1.5"
                                                                                >
                                                                                    {tag}
                                                                                    <X
                                                                                        size={10}
                                                                                        className="cursor-pointer hover:text-white transition-colors"
                                                                                        onClick={() => {
                                                                                            setFormData({
                                                                                                ...formData,
                                                                                                aiTags: formData.aiTags.filter((_, i) => i !== index)
                                                                                            });
                                                                                        }}
                                                                                    />
                                                                                </motion.span>
                                                                            ))}
                                                                        </AnimatePresence>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 relative">
                                                                        <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5 group-focus-within/tags:border-emerald-500/50 transition-colors">
                                                                            <Hash size={18} className="text-zinc-600 group-focus-within/tags:text-emerald-500 transition-colors" />
                                                                        </div>
                                                                        <div className="flex-1 relative">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="E.G. NEW LEAD, VIP CLIENT"
                                                                                className="w-full bg-transparent py-2 text-sm font-bold text-white placeholder:text-zinc-700 outline-none transition-all tracking-widest border-b border-transparent focus:border-emerald-500/30"
                                                                                value={currentTag}
                                                                                onChange={(e) => setCurrentTag(e.target.value)}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter' && currentTag.trim()) {
                                                                                        e.preventDefault();
                                                                                        if (formData.aiTags.length >= 10) return;
                                                                                        if (!formData.aiTags.includes(currentTag.trim().toUpperCase())) {
                                                                                            setFormData({
                                                                                                ...formData,
                                                                                                aiTags: [...formData.aiTags, currentTag.trim().toUpperCase()]
                                                                                            });
                                                                                        }
                                                                                        setCurrentTag('');
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 group-focus-within/tags:w-full transition-all duration-500"></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ✅ FINAL SAVE */}
                        <AnimatePresence>
                            {formData.name && (
                                <motion.div
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 100, opacity: 0 }}
                                    className="p-8 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent absolute bottom-0 left-0 right-0 z-20"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={isSaving}
                                        onClick={(e) => handleCreateGroup(e as any)}
                                        className={cn(
                                            "w-full h-16 bg-emerald-500 text-black rounded-2xl shadow-[0_20px_40px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 group relative overflow-hidden",
                                            isSaving && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                        <span className="text-sm font-black uppercase tracking-[0.3em]">
                                            {isSaving ? (editGroup ? 'Updating...' : 'Creating...') : (editGroup ? 'Update Group' : 'Create Group')}
                                        </span>
                                        <div className="w-8 h-8 bg-black/10 rounded-lg flex items-center justify-center">
                                            {isSaving ? (
                                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            ) : (
                                                <Check size={20} strokeWidth={3} />
                                            )}
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

const SettingToggle = ({ icon: Icon, title, description, isActive, onToggle, color }: any) => (
    <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.03] transition-all group"
    >
        <div className="flex items-center gap-4">
            <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
                isActive ? (
                    color === 'emerald' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                        color === 'purple' ? "bg-purple-500/10 border-purple-500/20 text-purple-500" :
                            "bg-blue-500/10 border-blue-500/20 text-blue-500"
                ) : "bg-zinc-900 border-white/5 text-zinc-600"
            )}>
                <Icon size={18} />
            </div>
            <div className="flex flex-col items-start">
                <span className={cn("text-xs font-black uppercase tracking-widest", isActive ? "text-white" : "text-zinc-500")}>{title}</span>
                <span className="text-[10px] mt-1 font-bold text-zinc-600 uppercase tracking-tight">{description}</span>
            </div>
        </div>
        {isActive ? (
            <ToggleRight className="text-emerald-500" size={28} />
        ) : (
            <ToggleLeft className="text-zinc-800" size={28} />
        )}
    </button>
);

const PremiumInput = ({ icon: Icon, placeholder, value, onChange, hideIcon = false, type = "text", required = false, maxLength }: any) => (
    <div className="flex items-center gap-4 group">
        {!hideIcon && (
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5 group-focus-within:border-emerald-500/50 transition-colors">
                <Icon className="text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
            </div>
        )}
        <div className={cn("flex-1 relative", hideIcon && "ml-14")}>
            <input
                required={required}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder.toUpperCase()}
                maxLength={maxLength}
                className="w-full bg-transparent py-2 text-sm font-bold text-white placeholder:text-zinc-700 outline-none transition-all tracking-widest border-b border-transparent focus:border-emerald-500/30"
            />
            <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 group-focus-within:w-full transition-all duration-500"></div>
        </div>
    </div>
);
