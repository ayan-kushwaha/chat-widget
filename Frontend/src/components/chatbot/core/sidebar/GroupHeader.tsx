import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Group } from '@/services/group.service';
import { MoreVertical, Sparkles, Trash2, Info, Edit, Users, ChevronDown, Archive, ArrowLeft, ChevronLeft, ArchiveRestore } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from '@/lib/utils';

interface GroupHeaderProps {
    group: Group;
    onEdit: () => void;
    onDelete: () => void;
    onArchive: () => void;
    onBack?: () => void;
    activeCount?: number;
    archivedCount?: number;
    groupFilter?: 'active' | 'archived';
    onGroupFilterChange?: (filter: 'active' | 'archived') => void;
    isShrunk?: boolean;
}

export const GroupHeader: React.FC<GroupHeaderProps> = ({
    group, onEdit, onDelete, onArchive, onBack,
    activeCount = 0, archivedCount = 0, groupFilter = 'active', onGroupFilterChange,
    isShrunk = false
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    // 🌟 Shrunk Header (Sticky)
    if (isShrunk) {
        return (
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="absolute top-0 left-0 right-0 z-30 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-black/5 dark:border-white/10 px-4 py-3 flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-500 transition-all mr-1 hover:bg-white/5"
                            title="Back to Groups"
                        >
                            <ArrowLeft size={18} strokeWidth={2.5} />
                        </button>
                    )}
                    <span className="text-2xl">{group.emoji || '👥'}</span>
                    <div>
                        <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider leading-none">
                            {group.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter mt-0.5">
                            {activeCount} Active • {archivedCount} Archived
                        </p>
                    </div>
                </div>

                <GroupActionMenu
                    isOpen={isMenuOpen}
                    onOpenChange={setIsMenuOpen}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onArchive={onArchive}
                    onInfo={() => setShowInfo(!showInfo)}
                    isArchived={!!group.isArchived}
                />
            </motion.div>
        );
    }

    // 🏗️ Full Header (Compact Single Line)
    return (
        <div className="px-5 py-4 border-b border-black/5 dark:border-white/5 bg-neutral-50/30 dark:bg-white/[0.02] relative group/header">
            {/* Background Gradient decoration */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative flex items-center justify-between">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="-ml-4 mr-1 ounded-lg text-zinc-400 hover:text-emerald-500 "
                        title="Back to Groups"
                    >
                        <ChevronLeft size={22} strokeWidth={2.5} />
                    </button>
                )}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-14 h-14 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-3xl shadow-lg ring-1 ring-black/5 dark:ring-white/5 shrink-0">
                        {group.emoji || '👥'}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex flex-col items-start gap-2 min-w-0 flex-wrap">
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-snug break-words">
                                {group.name}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <button
                                    onClick={() => onGroupFilterChange?.('active')}
                                    className={cn(
                                        "px-2 py-0.5 rounded-full flex items-center gap-1 transition-all border",
                                        groupFilter === 'active'
                                            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-500"
                                            : "bg-black/20 border-white/5 text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    <Users size={10} strokeWidth={2.5} />
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                        {activeCount}
                                    </span>
                                </button>

                                {archivedCount > 0 && (
                                    <button
                                        onClick={() => onGroupFilterChange?.('archived')}
                                        className={cn(
                                            "px-2 py-0.5 rounded-full flex items-center gap-1 transition-all border",
                                            groupFilter === 'archived'
                                                ? "bg-amber-500/20 border-amber-500/30 text-amber-500"
                                                : "bg-black/20 border-white/5 text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        <Archive size={10} strokeWidth={2.5} />
                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                            {archivedCount}
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {group.isSmart && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <Sparkles size={10} className="text-purple-500" />
                                <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wide leading-none">
                                    AI Optimized
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <GroupActionMenu
                    isOpen={isMenuOpen}
                    onOpenChange={setIsMenuOpen}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onArchive={onArchive}
                    onInfo={() => setShowInfo(!showInfo)}
                    isArchived={!!group.isArchived}
                />
            </div>

            <AnimatePresence>
                {(showInfo || (group.description && showInfo)) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[95%] font-medium">
                            {group.description || "No description provided."}
                        </p>

                        {group.aiIntent && (
                            <div className="bg-zinc-100/50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-lg p-2.5 flex items-start gap-2 mt-2">
                                <Sparkles size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-tight italic">
                                    "{group.aiIntent}"
                                </p>
                            </div>
                        )}

                        {group.aiTags && group.aiTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {group.aiTags.map((tag, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[9px] font-black text-emerald-500 uppercase tracking-wide">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};



// ----------------------------------------------------------------------
// 🔘 Action Menu Component
// ----------------------------------------------------------------------
interface GroupActionMenuProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
    onArchive: () => void;
    onInfo: () => void;
    isArchived: boolean;
}

const GroupActionMenu: React.FC<GroupActionMenuProps> = ({ isOpen, onOpenChange, onEdit, onDelete, onArchive, onInfo, isArchived }) => {
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Reset confirm state when menu closes
    React.useEffect(() => {
        if (!isOpen) setConfirmDelete(false);
    }, [isOpen]);

    return (
        <Popover open={isOpen} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "p-2 rounded-xl transition-all outline-none",
                        isOpen ? "bg-zinc-100 dark:bg-white/10 text-emerald-500" : "hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 hover:text-emerald-500"
                    )}
                >
                    <MoreVertical size={20} />
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-1 bg-zinc-900 border-zinc-800 rounded-xl shadow-2xl backdrop-blur-xl z-[50]">
                <div className="flex flex-col gap-0.5">
                    {!confirmDelete ? (
                        <>
                            <MenuItem icon={Info} label="Group Info" onClick={() => { onInfo(); onOpenChange(false); }} />
                            <MenuItem icon={Edit} label="Edit Group" onClick={() => { onEdit(); onOpenChange(false); }} />
                            <div className="h-px bg-white/5 my-1 mx-2" />

                            <MenuItem
                                icon={isArchived ? ArchiveRestore : Archive}
                                label={isArchived ? "Unarchive Group" : "Archive Group"}
                                onClick={() => { onArchive(); onOpenChange(false); }}
                            />
                            <MenuItem
                                icon={Trash2}
                                label="Delete Group"
                                onClick={() => setConfirmDelete(true)}
                                variant="danger"
                            />
                        </>
                    ) : (
                        <div className="p-2 py-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <p className="text-[11px] font-black text-white uppercase tracking-wider text-center mb-3">
                                Are you sure?
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { onDelete(); onOpenChange(false); }}
                                    className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase rounded-md transition-all"
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={() => setConfirmDelete(false)}
                                    className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-black uppercase rounded-md transition-all"
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

const MenuItem = ({ icon: Icon, label, onClick, variant = 'default' }: { icon: any, label: string, onClick: () => void, variant?: 'default' | 'danger' }) => (
    <button
        onClick={(e) => {
            e.stopPropagation();
            onClick();
        }}
        className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-[13px] font-black transition-all rounded-lg uppercase tracking-tight",
            variant === 'default' ? "text-zinc-300 hover:bg-zinc-800 hover:text-white" : "text-red-500 hover:bg-red-500/10"
        )}
    >
        <Icon size={16} />
        {label}
    </button>
);
