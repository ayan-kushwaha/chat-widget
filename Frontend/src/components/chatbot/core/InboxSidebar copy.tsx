"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Bot,
    MessageCircle,
    History,
    Users,
    Heart,
    Archive,
    MoreVertical,
    Check,
    CheckCheck,
    Pin,
    Plus,
    Calendar as CalendarIcon,
    X as CloseIcon,
    ListFilter,
    Grid,
    CheckSquare,
    X,
    Trash2,
    Ban
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Conversation } from '../types';
import { ChatContextMenu } from '../messaging/ChatContextMenu';
import { InboxService } from '@/services/inbox.service';
import { useOrg } from '@/context/OrgContext';
import { cn } from '@/lib/utils';
import { StatusCircle, StatusViewerOverlay, StatusCreatorOverlay, StatusSidebarRing, type StatusData } from '@/components/status';
import { statusService } from '@/services/statusService';
import { LabelModal } from '../messaging/LabelModal';

const TAG_STYLES: Record<string, { gradient: string }> = {
    urgent: { gradient: 'from-red-500 to-rose-600' },
    warning: { gradient: 'from-amber-400 to-orange-500' },
    success: { gradient: 'from-emerald-400 to-teal-600' },
    info: { gradient: 'from-blue-400 to-indigo-600' },
    priority: { gradient: 'from-purple-400 to-violet-600' },
    pending: { gradient: 'from-cyan-400 to-sky-500' },
    hot: { gradient: 'from-pink-400 to-rose-500' },
    lead: { gradient: 'from-indigo-400 to-purple-500' },
    // Legacy support
    red: { gradient: 'from-red-500 to-rose-600' },
    yellow: { gradient: 'from-amber-400 to-orange-500' },
    green: { gradient: 'from-emerald-400 to-teal-600' },
    blue: { gradient: 'from-blue-400 to-indigo-600' },
    purple: { gradient: 'from-purple-400 to-violet-600' },
};

const ChatRibbon = ({ tags }: { tags: string[] | string }) => {
    // 🏷️ Ensure we only ever show ONE ribbon at a time (User request: "one at a time one")
    const activeTag = Array.isArray(tags) ? tags[0] : tags;
    if (!activeTag) return null;

    const [name, colorName] = activeTag.includes(':') ? activeTag.split(':') : [activeTag, 'success'];
    const style = TAG_STYLES[colorName.toLowerCase()] || TAG_STYLES.green;

    return (
        <div className="absolute left-0 top-0 z-[15] flex flex-col items-start shrink-0 pointer-events-none">
            {/* 🎀 Main Label: Swallowtail (V-Cut) on RIGHT */}
            <div
                className={cn(
                    "relative h-[14px] pl-2 pr-5 text-lg bg-gradient-to-r flex items-center shadow-md z-20",
                    style.gradient
                )}
                style={{ clipPath: 'polygon(0 0, 100% 0, 92% 50%, 100% 100%, 0 100%)' }}
            >
                <span className="text-[9px] font-black text-white uppercase tracking-[0.1em] whitespace-nowrap leading-none drop-shadow-sm translate-y-[0.5px]">
                    {name}
                </span>
            </div>

            {/* 🆕 3D Fold Effect: CURVED Triangle (User request: "cliff path se curve") */}
            {/* <div
                className={cn(
                    "absolute top-full left-0 w-2 h-2 bg-white/20 z-10", style.gradient
                )}
                // This path draws a curve connecting the top-left (0,0) to bottom-right (simulated curve) closing at top-right (ribbon edge)
                // Actually, for a fold under a ribbon on the LEFT edge, the triangle is usually top-left, top-right, bottom-left.
                // The curve would be the hypotenuse.
                style={{ clipPath: 'polygon(0 0, 100% 0, 0 50%)' }}
            /> */}
        </div>
    );
};

interface InboxSidebarProps {
    conversations: Conversation[];
    onConversationsUpdate: (update: (prev: Conversation[]) => Conversation[]) => void;
    statuses?: any[];
    selectedId: string | null;
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    onSelect: (id: string) => void;
    onOpenNewChat: () => void;
    onOpenSettings: () => void;
    onStatusCreated?: () => void;
    searchQuery: string;
    onSearchChange: (val: string) => void;
    onSearch?: (query: string) => void;
    dateRange?: DateRange;
    onDateRangeChange?: (range: DateRange | undefined) => void;
    isLoading?: boolean;
}

const StatusBubble = ({ name, image, isHighlighted, onContextMenu }: { name: string, image?: string, isHighlighted?: boolean, onContextMenu?: (e: React.MouseEvent) => void }) => (
    <div
        onContextMenu={onContextMenu}
        className="flex flex-col items-center gap-1.5 px-2 shrink-0 cursor-pointer group"
    >
        <div className={cn(
            "p-[2.5px] rounded-full transition-all group-hover:scale-105",
            isHighlighted ? "bg-emerald-500 scale-105 shadow-lg shadow-emerald-500/20" : "bg-gradient-to-tr from-zinc-700 to-zinc-500"
        )}>
            <div className="p-[2px] bg-black rounded-full">
                <Avatar className="w-12 h-12 border border-white/5">
                    <AvatarImage src={image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-500 text-xs">{name[0]}</AvatarFallback>
                </Avatar>
            </div>
        </div>
        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">
            {name.split(' ')[0]}
        </span>
    </div>
);

const Highlight = ({ text, query }: { text: string, query: string }) => {
    if (!query || !text || typeof text !== 'string') return <>{text}</>;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase()
                    ? <mark key={i} className="bg-yellow-400 text-green-950 px-0.5 rounded font-bold shadow-sm inline-block leading-normal">{part}</mark>
                    : part
            )}
        </>
    );
};

const ConversationItem = ({
    conv,
    isSelected,
    onClick,
    onContextMenu,
    searchQuery,
    isSelectionMode,
    isChecked,
    onToggleSelection
}: {
    conv: Conversation;
    isSelected: boolean;
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent, conversation: Conversation) => void;
    searchQuery?: string;
    isSelectionMode?: boolean;
    isChecked?: boolean;
    onToggleSelection?: () => void;
}) => {
    const lastActive = new Date(conv.last_message_at || Date.now());
    const isValidDate = !isNaN(lastActive.getTime());
    const displayDate = isValidDate ? lastActive : new Date();

    const now = new Date();
    const isToday = displayDate.toDateString() === now.toDateString();

    const timeLabel = isToday
        ? displayDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : displayDate.toLocaleDateString([], { day: 'numeric', month: 'short' });

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onContextMenu={(e) => onContextMenu(e, conv)}
            onClick={isSelectionMode ? onToggleSelection : onClick}
            className={cn(
                "flex items-center gap-3 p-4 pl-6 cursor-pointer transition-all border-b border-black/5 dark:border-white/5 relative group w-full",
                isSelected && !isSelectionMode ? "bg-emerald-500/5 dark:bg-white/5" : "hover:bg-neutral-50 dark:hover:bg-zinc-900/50",
                isChecked && isSelectionMode && "bg-emerald-500/10"
            )}
        >
            {/* 🆕 Selection Checkbox Overlay */}
            {isSelectionMode && (
                <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20">
                    <div className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all bg-white dark:bg-black",
                        isChecked ? "bg-emerald-500 border-emerald-500" : "border-zinc-400"
                    )}>
                        {isChecked && <Check size={14} className="text-white stroke-[4]" />}
                    </div>
                </div>
            )}

            {/* 🎀 Ribbon Tag (Stuck to Top-Left) */}
            {conv.tags && conv.tags.length > 0 && (
                <ChatRibbon tags={conv.tags} />
            )}

            <div className="relative flex-shrink-0 pointer-events-none">
                <Avatar className="w-12 h-12 border border-white/10 shadow-lg group-hover:border-emerald-500/30 transition-colors">
                    <AvatarImage src={conv.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.userName}`} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold">{conv.userName?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                {/* 🟢 Pulsing Online Indicator (Always persistent for users) */}
                <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full z-10 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                    <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40"></div>
                </div>
            </div>

            <div className="flex-1 min-w-0 grid grid-rows-[auto_auto] gap-0.5 self-center">
                {/* Row 1: Name and Time */}
                <div className="grid grid-cols-[1fr_auto] items-center min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className={cn(
                            "text-[15px] font-bold truncate",
                            isSelected ? "text-emerald-900 dark:text-white" : ((conv.unreadCount || conv.unread_count) ? "text-zinc-900 dark:text-white" : "text-zinc-700 dark:text-zinc-300")
                        )}>
                            <Highlight text={conv.userName || 'Visitor'} query={searchQuery || ''} />
                        </h3>
                        {conv.is_pinned && <Pin size={12} className="text-emerald-500 rotate-45 shrink-0" />}
                        {conv.is_favourite && <Heart size={12} className="text-red-500 fill-red-500 shrink-0" />}
                    </div>
                    <span className={cn(
                        "text-[11px] font-medium whitespace-nowrap shrink-0 ml-2",
                        conv.unreadCount ? "text-emerald-500" : "text-zinc-500"
                    )}>
                        {timeLabel}
                    </span>
                </div>

                {/* Row 2: Preview and Badge */}
                <div className="grid grid-cols-[1fr_auto] items-center min-w-0 mt-0.5">
                    <div className="flex flex-col gap-1 min-w-0">
                        {!searchQuery && (
                            <div className="flex items-center gap-1.5 min-w-0">
                                {/* ✨ WHATSAPP-STYLE STATUS INDICATORS */}
                                {conv.last_message_sender !== 'user' && (
                                    <>
                                        {(conv.last_message_status === 'sent' || (!conv.last_message_status && conv.last_message_sender)) && (
                                            <Check size={14} className="text-zinc-500 shrink-0" />
                                        )}
                                        {conv.last_message_status === 'delivered' && (
                                            <CheckCheck size={14} className="text-zinc-500 shrink-0" />
                                        )}
                                        {conv.last_message_status === 'read' && (
                                            <CheckCheck size={14} className="text-sky-400 shrink-0" />
                                        )}
                                    </>
                                )}
                                <p className={cn(
                                    "text-sm truncate font-medium",
                                    (conv.unreadCount || conv.unread_count) ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-500"
                                )}>
                                    <Highlight text={conv.last_message_preview || conv.summary || 'Tap to see history...'} query={searchQuery || ''} />
                                </p>
                            </div>
                        )}

                        {/* 🔍 Search Results Badge: "33 matches found" */}
                        {searchQuery && conv.matchCount !== undefined && conv.matchCount > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 w-fit px-2 py-0.5 rounded-full uppercase tracking-tighter border border-emerald-500/20 shadow-sm animate-in fade-in zoom-in duration-300">
                                <Search size={10} strokeWidth={3} className="shrink-0" />
                                <span>{conv.matchCount} {conv.matchCount === 1 ? 'match' : 'matches'} found</span>
                            </div>
                        )}

                        {/* 🎀 Ribbon Tag (Moved to top-left) */}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                        {(conv.unreadCount || conv.unread_count) ? (
                            <div className="min-w-[18px] h-[18px] px-1 bg-emerald-500 text-black rounded-full flex items-center justify-center text-[10px] font-black">
                                {conv.unreadCount || conv.unread_count}
                            </div>
                        ) : null}
                        <MoreVertical
                            size={16}
                            className="text-zinc-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity hover:text-emerald-500 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                onContextMenu(e, conv);
                            }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export const InboxSidebar: React.FC<InboxSidebarProps> = ({
    conversations,
    onConversationsUpdate,
    statuses,
    selectedId,
    activeFilter,
    onFilterChange,
    onSelect,
    onOpenNewChat,
    onOpenSettings,
    onStatusCreated,
    searchQuery: globalSearchQuery,
    onSearchChange,
    onSearch,
    dateRange,
    onDateRangeChange,
    isLoading
}) => {
    const { activeOrg, refreshOrgs } = useOrg();
    const orgId = activeOrg?._id || activeOrg?.id;

    // 🔍 Local search state for smooth typing (Debounced to parent)
    const [localQuery, setLocalQuery] = useState(globalSearchQuery);

    // Sync local query if prop changes externally (e.g. clear search)
    useEffect(() => {
        setLocalQuery(globalSearchQuery);
    }, [globalSearchQuery]);

    // 🎢 Premium Scroll State
    const [showStatus, setShowStatus] = useState(true);
    const [scrolled, setScrolled] = useState(false);
    const lastScrollY = useRef(0);

    // 📸 Status Modal States
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewerStatuses, setViewerStatuses] = useState<any[]>([]);
    const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, conversation: Conversation } | null>(null);
    const [statusContextMenu, setStatusContextMenu] = useState<{ x: number, y: number, status: any } | null>(null);

    // 🗓️ Calendar State (UI Only)
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [dbBookedDates, setDbBookedDates] = useState<Date[]>([]);

    // 🎀 Persistent Ribbon Pool State
    const [poolRibbons, setPoolRibbons] = useState<string[]>(activeOrg?.available_ribbons || []);

    // Sync from Org Context on mount/org change
    useEffect(() => {
        if (activeOrg?.available_ribbons) {
            setPoolRibbons(activeOrg.available_ribbons);
        }
    }, [activeOrg?.available_ribbons]);

    // 🏷️ Label Modal State
    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
    const [labelChatId, setLabelChatId] = useState<string | null>(null);

    // ✅ Bulk Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());

    // 🔄 Bulk Handlers
    const handleEnterSelectionMode = (initialId?: string) => {
        setIsSelectionMode(true);
        if (initialId) {
            setSelectedChatIds(new Set([initialId]));
        }
    };

    const toggleChatSelection = (id: string) => {
        const newSet = new Set(selectedChatIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedChatIds(newSet);
    };

    const handleSelectAll = () => {
        if (selectedChatIds.size === filteredConversations.length) {
            setSelectedChatIds(new Set()); // Deselect All
        } else {
            const allIds = filteredConversations.map(c => String(c._id || c.chatId));
            setSelectedChatIds(new Set(allIds));
        }
    };

    const handleExitSelectionMode = () => {
        setIsSelectionMode(false);
        setSelectedChatIds(new Set());
    };

    const handleBulkArchive = async () => {
        if (!orgId) return;
        const ids = Array.from(selectedChatIds);

        // Optimistic UI
        onConversationsUpdate(prev => prev.map(c =>
            ids.includes(String(c._id)) ? { ...c, status: 'archived' } : c
        ));
        handleExitSelectionMode();

        // API Call
        await Promise.all(ids.map(id => InboxService.archiveChat(orgId, id)));
    };

    const handleBulkBlock = async () => {
        // Placeholder for Block logic
        console.log("Blocking", selectedChatIds);
        handleExitSelectionMode();
    };

    // 🚀 Fetch all historical active dates from MongoDB
    useEffect(() => {
        const fetchActiveDates = async () => {
            if (!orgId) return;
            try {
                const dates = await InboxService.getActiveDates(orgId as string);
                setDbBookedDates(dates.map((dStr: string) => {
                    // 🛡️ Parse YYYY-MM-DD safely in local time to avoid timezone shifts
                    const [year, month, day] = dStr.split('-').map(Number);
                    return new Date(year, month - 1, day);
                }));
            } catch (error) {
                console.error("Failed to fetch active dates:", error);
            }
        };
        fetchActiveDates();
    }, [orgId]);

    // 🔇 Mute State Management - Use Global Audio Manager
    const [isMuted, setIsMuted] = useState(() => {
        if (typeof window !== 'undefined') {
            // Import audioManager dynamically to avoid SSR issues
            const { audioManager } = require('@/utils/audioManager');
            return audioManager.getMuteState();
        }
        return false;
    });

    // 🎬 Animated Search Placeholder Logic
    const PLACEHOLDERS = [
        "Search User",
        "Search Email",
        "Search Phone...",
        "Search SMS",
        "Search Everything",
        "Search by Date...",
        "Search Old SMS...",
        "Search New Messages..."
    ];
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // 🔍 Debounced Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (onSearchChange) onSearchChange(localQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [localQuery, onSearchChange]);

    const toggleMute = () => {
        if (typeof window !== 'undefined') {
            const { audioManager } = require('@/utils/audioManager');
            const newState = audioManager.toggleMute();
            setIsMuted(newState);
            console.log(`🔔 Notifications ${newState ? 'MUTED ❌' : 'UNMUTED ✅'}`);
        }
    };




    const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = event.currentTarget.scrollTop;
        const diff = currentScrollY - lastScrollY.current;

        // 🔥 RULE 1: Agar user TOP par hai (0-50px), to Status HAMESHA dikhao.
        // Ye line sabse important hai taaki "atakne" waali feeling na aaye.
        if (currentScrollY < 50) {
            setShowStatus(true);
            lastScrollY.current = currentScrollY;
            return;
        }

        // 🔥 RULE 2: Scroll DOWN (Neeche ja rahe ho -> Chhupa do)
        // 'diff > 10' ka matlab: Jab tak 10px neeche na jao, tab tak mat chhupao (Jhatka nahi lagega)
        if (diff > 10) {
            setShowStatus(false);
        }

        // 🔥 RULE 3: Scroll UP (Upar aa rahe ho -> Dikha do)
        // 'diff < -10' ka matlab: Thoda tezi se upar aao tabhi dikhao
        else if (diff < -10) {
            setShowStatus(true);
        }

        lastScrollY.current = currentScrollY;
    };
    const handleContextMenu = (e: React.MouseEvent, conversation: Conversation) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, conversation });
    };

    const handleStatusContextMenu = (e: React.MouseEvent, status: any) => {
        e.preventDefault();
        setStatusContextMenu({ x: e.clientX, y: e.clientY, status });
    };

    const handlePin = async (id: string) => {
        if (!orgId) return;

        // 🚀 Optimistic Update
        const conv = conversations.find(c => c._id === id);
        if (conv) {
            const newState = !conv.is_pinned;
            onConversationsUpdate(prev => prev.map(c =>
                c._id === id ? { ...c, is_pinned: newState } : c
            ));
        }

        await InboxService.togglePin(orgId, id);
    };

    const handleArchive = async (id: string) => {
        if (!orgId) return;
        const conv = conversations.find(c => c._id === id);
        if (!conv) return;

        const isArchived = conv.status === 'archived';
        const newStatus = isArchived ? 'active' : 'archived';

        // 🚀 Optimistic Update (Instant Hide/Show)
        onConversationsUpdate(prev => prev.map(c =>
            c._id === id ? { ...c, status: newStatus } : c
        ));

        if (isArchived) {
            await InboxService.unarchiveChat(orgId, id);
        } else {
            await InboxService.archiveChat(orgId, id);
        }
    };

    const handleToggleFavourite = async (id: string) => {
        if (!orgId) return;

        // 🚀 Optimistic Update
        const conv = conversations.find(c => c._id === id);
        if (conv) {
            const newState = !conv.is_favourite;
            onConversationsUpdate(prev => prev.map(c =>
                c._id === id ? { ...c, is_favourite: newState } : c
            ));
        }

        // 🎯 Dedicated Endpoint Sync
        await InboxService.toggleFavourite(orgId, id);
    };

    const handleAddLabel = (id: string) => {
        setLabelChatId(id);
        setIsLabelModalOpen(true);
    };

    const handleCreateLabel = async (tagName: string, color: string) => {
        if (!orgId) return;
        const tagValue = `${tagName}:${color}`;

        // 🎀 Add to Persistent Pool ONLY (Max 30)
        // User request: "add akre k amlb list new add akrna... and aplly nhi hona chaiye"
        if (!poolRibbons.includes(tagValue)) {
            if (poolRibbons.length < 30) {
                const newPool = [...poolRibbons, tagValue];
                setPoolRibbons(newPool);
                await InboxService.updateRibbonPool(orgId, newPool);
                // 🔄 Background Sync (No page reload/spinner)
                refreshOrgs(true);
            }
        }
    };

    const handleApplyLabel = async (tagName: string, color: string) => {
        if (!orgId || !labelChatId) return;
        const tagValue = `${tagName}:${color}`;

        // 🚀 Optimistic Update: Single Label Policy (Replace existing)
        onConversationsUpdate(prev => prev.map(c => {
            const isMatch = (String(c._id) === labelChatId || (c.chatId && String(c.chatId) === labelChatId));
            if (!isMatch) return c;

            const existing = c.tags || [];
            // Toggle off if clicking the same tag
            if (existing.includes(tagValue)) {
                return { ...c, tags: [] };
            }
            // Replace with new tag (Keep only one)
            return { ...c, tags: [tagValue] };
        }));

        // 🎯 Background Backend Sync
        try {
            const currentChat = conversations.find(c => (String(c._id) === labelChatId || (c.chatId && String(c.chatId) === labelChatId)));
            const isTogglingOff = currentChat?.tags?.includes(tagValue);

            // 🏷️ 1. Update Chat (Replace or Clear)
            await InboxService.updateChatMetadata(orgId, labelChatId, {
                $set: { tags: isTogglingOff ? [] : [tagValue] }
            });

            // 🎀 2. Also ensure it's in the pool if not already
            if (!isTogglingOff && !poolRibbons.includes(tagValue)) {
                if (poolRibbons.length < 30) {
                    const newPool = [...poolRibbons, tagValue];
                    setPoolRibbons(newPool);
                    await InboxService.updateRibbonPool(orgId, newPool);
                    refreshOrgs(true);
                }
            }
        } catch (error) {
            console.error('❌ Failed to update label in backend:', error);
        }
    };

    const handleDeleteLabelHistory = async (tag: string) => {
        if (!orgId) return;
        try {
            console.log(`🏷️ Deleting tag globally: ${tag}`);

            // 🎯 Call Backend via Service
            const success = await InboxService.deleteTagGlobally(orgId, tag);

            if (success) {
                // 🚀 Update local pool (Remove ANY variant of this tag name)
                const tagNameBase = tag.includes(':') ? tag.split(':')[0].toLowerCase() : tag.toLowerCase();
                const newPool = poolRibbons.filter(t => {
                    const tBase = t.includes(':') ? t.split(':')[0].toLowerCase() : t.toLowerCase();
                    return tBase !== tagNameBase;
                });

                setPoolRibbons(newPool);
                await InboxService.updateRibbonPool(orgId, newPool);
                refreshOrgs(true);

                // 🚀 Update local state: remove ANY variant of this tag name
                onConversationsUpdate(prev => prev.map(c => ({
                    ...c,
                    tags: c.tags?.filter(t => {
                        const tBase = t.includes(':') ? t.split(':')[0].toLowerCase() : t.toLowerCase();
                        return tBase !== tagNameBase;
                    }) || []
                })));
                console.log(`✅ Tag ${tag} deleted globally.`);
            }
        } catch (err) {
            console.error('Failed to delete tag globally:', err);
        }
    };

    // 📸 Status Handlers
    const handleCreateStatus = async (data: any) => {
        if (!orgId) return;
        try {
            await statusService.createStatus({
                ...data,
                organizationId: orgId
            });
            onStatusCreated?.();
        } catch (error) {
            console.error('Failed to create status:', error);
        }
    };

    const handleDeleteStatus = async (statusId: string) => {
        if (!orgId) return;
        try {
            await statusService.deleteStatus(statusId, orgId);
            onStatusCreated?.(); // Refresh list
            setIsViewerOpen(false);
            setStatusContextMenu(null);
        } catch (error) {
            console.error('Failed to delete status:', error);
        }
    };

    const handleStatusClick = (clickedStatus: any, allStatuses: any[]) => {
        const statusList = allStatuses.map(s => ({
            id: s._id,
            userName: s.userName || 'You', // Fallback until backend populates
            userAvatar: s.userAvatar || undefined,
            type: s.type,
            content: s.content,
            styling: s.styling,
            timestamp: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date(s.createdAt),
            music: s.music,
            musicVolume: s.musicVolume
        }));
        const initialIndex = allStatuses.findIndex(s => s._id === clickedStatus._id);
        setViewerStatuses(statusList);
        setViewerInitialIndex(initialIndex);
        setIsViewerOpen(true);
    };

    // 🗓️ Merged Booked Dates (Local + DB)
    const bookedDates = useMemo(() => {
        const datesMap = new Map<string, Date>();
        dbBookedDates.forEach(d => datesMap.set(d.toDateString(), d));
        conversations.forEach(c => {
            if (c.last_message_at) {
                const date = new Date(c.last_message_at);
                date.setHours(0, 0, 0, 0);
                datesMap.set(date.toDateString(), date);
            }
        });
        return Array.from(datesMap.values());
    }, [conversations, dbBookedDates]);

    const filteredConversations = useMemo(() => {
        let list = conversations;

        // 🔍 Search Mode: Bypass standard filters to show ALL matches
        if (globalSearchQuery || localQuery) {
            return list;
        }

        // 🏷️ Filter by Active Tag / Filter
        if (activeFilter !== 'All') {
            if (activeFilter.startsWith('Archive')) {
                list = list.filter(c => c.status === 'archived');
            } else if (activeFilter === 'Unread') {
                list = list.filter(c => (c.unread_count || c.unreadCount || 0) > 0);
            } else if (activeFilter === 'Favourites') {
                list = list.filter(c => c.is_favourite);
            } else if (activeFilter === 'Groups') {
                list = list.filter(c => c.isGroup);
            } else if (activeFilter === 'Assistants') {
                list = list.filter(c => c.mode === 'ai');
            } else if (activeFilter === 'Online') {
                // For now, Online filter just shows active active chats
                list = list.filter(c => c.status === 'active');
            } else {
                // Dynamic Ribbon Filter
                list = list.filter(c => c.tags?.some(t => {
                    const name = t.includes(':') ? t.split(':')[0] : t;
                    return name === activeFilter;
                }));
            }
        } else {
            // Default 'All' view excludes Archived
            list = list.filter(c => c.status !== 'archived');
        }

        return list;
    }, [conversations, activeFilter, globalSearchQuery, localQuery]);

    // 🏷️ Dynamic Filter Tags Construction
    const dynamicFilterTags = useMemo(() => {
        // User Request: Remove 'Calls' and keep ribbons/archive at the end
        const baseFilters = ['All', 'Unread', 'Online', 'Favourites', 'Groups', 'Assistants'];

        // Extract unique labels from all conversations (Dynamic Ribbons)
        const uniqueLabels = new Set<string>();
        conversations.forEach(c => {
            if (c.status === 'archived') return;
            c.tags?.forEach(t => {
                const name = t.includes(':') ? t.split(':')[0] : t;
                uniqueLabels.add(name);
            });
        });

        // Archive Filter with Unread Count (ALWAYS LAST)
        const archivedChats = conversations.filter(c => c.status === 'archived');
        const archiveUnreadCount = archivedChats.reduce((sum, c) => sum + (c.unread_count || c.unreadCount || 0), 0);
        const archiveLabel = archiveUnreadCount > 0
            ? `Archive (${archiveUnreadCount > 99 ? '99+' : archiveUnreadCount})`
            : 'Archive';

        // Order: Standard -> Archive -> Dynamic Ribbons (User request: Ribbons hamesha last mein)
        return [...baseFilters, archiveLabel, ...Array.from(uniqueLabels)];
    }, [conversations]);

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-neutral-950 border-r border-black/5 dark:border-white/10 select-none relative overflow-hidden">
            {/* 1. HEADER (Collapsible) */}

            <div className=" space-y-4 ">
                <div className="flex p-2 pb-0 items-center justify-between">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Chats</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={onOpenNewChat}
                            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
                        >
                            <Plus size={20} />
                        </button>
                        <button
                            onClick={onOpenSettings}
                            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
                        >
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>

                <div className="relative mx-2 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors z-30 pointer-events-none" size={18} />
                    <div className="relative w-full">
                        <input
                            type="text"
                            value={localQuery}
                            onChange={(e) => setLocalQuery(e.target.value)}
                            className="w-full pl-10 pr-24 py-2 bg-neutral-100 dark:bg-zinc-900 border-none rounded-xl text-sm font-medium text-zinc-900 dark:text-white focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none z-0 relative bg-transparent placeholder:text-transparent"
                        />

                        {/* 🎬 Animated Placeholder */}
                        <AnimatePresence mode="wait">
                            {localQuery.length === 0 && (
                                <motion.span
                                    key={placeholderIndex}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute left-10 inset-y-0 flex items-center text-sm font-medium text-zinc-400 dark:text-zinc-500 pointer-events-none truncate pr-24 w-full"
                                >
                                    {PLACEHOLDERS[placeholderIndex]}
                                </motion.span>
                            )}
                        </AnimatePresence>

                        {/* 🔘 ACTION GROUP (Clear + Calendar) */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-30">
                            {localQuery && (
                                <button
                                    onClick={() => {
                                        setLocalQuery('');
                                        if (onSearchChange) onSearchChange('');
                                    }}
                                    className="p-1.5 text-zinc-400 hover:text-emerald-500 transition-colors rounded-lg"
                                    title="Clear search"
                                >
                                    <CloseIcon size={16} />
                                </button>
                            )}

                            {dateRange?.from && (
                                <button
                                    onClick={() => onDateRangeChange?.(undefined)}
                                    className="p-1.5 text-zinc-500 hover:text-red-500 rounded-lg transition-all"
                                    title="Reset date filter"
                                >
                                    <CloseIcon size={14} />
                                </button>
                            )}

                            {/* 🆕 Advanced Filter Button */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        className={cn(
                                            "p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                                        )}
                                        title="Advanced Filters"
                                    >
                                        <ListFilter size={16} />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-2 bg-zinc-900 border-white/10 shadow-2xl z-[100]" align="end">
                                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2 py-1 mb-1">
                                        Filter By
                                    </div>
                                    {/* Placeholder Options */}
                                    {["Unread", "Archived", "Groups", "Blocked"].map(opt => (
                                        <button key={opt} className="w-full text-left px-2 py-1.5 text-sm text-zinc-300 hover:bg-white/5 rounded-md transition-colors">
                                            {opt}
                                        </button>
                                    ))}
                                </PopoverContent>
                            </Popover>

                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <button
                                        className={cn(
                                            "p-1.5 rounded-lg transition-all",
                                            dateRange?.from
                                                ? "text-emerald-500 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                                : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                                        )}
                                    >
                                        <CalendarIcon size={16} />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-[#0f1115] border-white/10 shadow-2xl z-[100]" align="end">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange?.from}
                                        selected={dateRange}
                                        onSelect={onDateRangeChange}
                                        numberOfMonths={1}
                                        className="rounded-md border-none"
                                        modifiers={{
                                            booked: bookedDates,
                                        }}
                                        modifiersClassNames={{
                                            booked: "font-black text-emerald-500 bg-emerald-500/10 rounded-full", // Highlight dates with chats
                                        }}
                                    />
                                    {dateRange?.from && (
                                        <div className="p-3 border-t border-white/5 flex items-center justify-between gap-4">
                                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                                {format(dateRange.from, "LLL dd")} - {dateRange.to ? format(dateRange.to, "LLL dd") : "..."}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    onDateRangeChange?.(undefined);
                                                    setIsCalendarOpen(false);
                                                }}
                                                className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors"
                                            >
                                                Reset filter
                                            </button>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>

                <div className="relative mx-2 overflow-hidden group">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 group-hover/filters:pr-8 transition-all duration-300">
                        {dynamicFilterTags.map(f => {
                            const isArchive = f.startsWith('Archive');
                            const filterValue = isArchive ? 'Archive' : f;
                            const isActive = activeFilter === filterValue;

                            return (
                                <button
                                    key={f}
                                    onClick={() => onFilterChange(filterValue)}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5",
                                        isActive
                                            ? "bg-zinc-800 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                            : "bg-neutral-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-neutral-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200",
                                        isArchive && !isActive && "text-zinc-400 bg-zinc-900/40 border border-white/5"
                                    )}
                                >
                                    <span>{f}</span>
                                    {/* 🔵 Blue Dot for Archived Unread */}
                                    {isArchive && f.includes('(') && (
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse ml-0.5 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {/* 🌫️ Right Side Depth Shadow */}
                    <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white/90 dark:from-neutral-950 to-transparent pointer-events-none z-10" />
                </div>
            </div>
            <div
                className={`w-full mb-1 overflow-hidden transition-all duration-300 ease-in-out ${showStatus
                    ? 'max-h-[150px] opacity-100 mt-1'  // Dikh raha hai
                    : 'max-h-0 opacity-0 mt-0'          // Chhup gaya
                    }`}
            >
                <div className="flex  items-center overflow-x-auto no-scrollbar p-1 gap-1 w-full">
                    {/* + MY STATUS Circle */}
                    <StatusCircle
                        type="add"
                        label="MY STATUS"
                        onClick={() => setIsCreatorOpen(true)}
                    />

                    {/* Real Statuses from API */}
                    {statuses && statuses.map((status, idx) => (
                        <StatusCircle
                            key={status._id || idx}
                            type="status"
                            label={status.caption || status.userName || "Update"}
                            content={status.content}
                            statusType={status.type}
                            styling={status.styling}
                            hasUnviewed={true}
                            onClick={() => handleStatusClick(status, statuses)}
                            onContextMenu={(e) => handleStatusContextMenu(e, status)}
                        />
                    ))}

                    {/* Initial Onboarding Statuses if empty */}
                    {(!statuses || statuses.length === 0) && (
                        <>
                            <StatusCircle
                                type="status"
                                label="ARYAN"
                                hasUnviewed={true}
                                onClick={() => { }}
                            />
                            <StatusCircle
                                type="status"
                                label="DIWALI"
                                content="https://images.unsplash.com/photo-1540331547168-8b63109225b7?w=100&h=100&fit=crop"
                                statusType="image"
                                hasUnviewed={false}
                                onClick={() => { }}
                            />
                        </>
                    )}
                </div>
            </div>
            {/* 🌫️ Right Side Depth Shadow */}
            {/* <div className="absolute left-0 top-0 bottom-0 w-14 bg-gradient-to-r from-white/80 dark:from-black/80 via-white/40 dark:via-black/40 to-transparent pointer-events-none z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white/80 dark:from-black/80 via-white/40 dark:via-black/40 to-transparent pointer-events-none z-10" /> */}

            {/* 3. Live List Area */}
            {/* Added no-scrollbar to hide "loc bear" */}
            <ScrollArea ref={scrollAreaRef} onScrollCapture={onScroll} className="flex-1 bg-white dark:bg-neutral-950 relative group/list overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
                <div className="flex flex-col w-full">
                    {isLoading ? (
                        <div className="flex flex-col p-4 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="flex gap-3 animate-pulse">
                                    <div className="w-12 h-12 bg-zinc-900 rounded-full" />
                                    <div className="flex-1 space-y-3 py-1">
                                        <div className="h-2 bg-zinc-900 rounded w-1/4" />
                                        <div className="h-2 bg-zinc-900 rounded w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 pt-20 text-center opacity-60">
                            {/* 👻 Ghost / Search Empty State */}
                            <div className="w-20 h-20 bg-neutral-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4 relative">
                                <Search size={32} className="text-zinc-400 dark:text-zinc-600" />
                                <div className="absolute -bottom-1 -right-1 bg-neutral-950 rounded-full p-1 border border-zinc-800">
                                    <CloseIcon size={14} className="text-zinc-500" />
                                </div>
                            </div>
                            <h3 className="text-zinc-900 dark:text-white font-bold text-lg mb-2">
                                {dateRange?.from ? "Historical Search: Empty" : "No results found"}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[280px] leading-relaxed">
                                {dateRange?.from ? (
                                    <>
                                        We scanned your entire database but found no activity between <span className="text-emerald-500 font-bold">{format(dateRange.from, "MMM dd, yyyy")}</span>
                                        {dateRange.to ? (
                                            <> and <span className="text-emerald-500 font-bold">{format(dateRange.to, "MMM dd, yyyy")}</span></>
                                        ) : (
                                            " (Specific day)"
                                        )}
                                        . Try another date!
                                    </>
                                ) : (
                                    <>We couldn't find any chats matching <span className="text-emerald-500 font-bold">"{localQuery || globalSearchQuery || ""}"</span> in the current view.</>
                                )}
                            </p>
                            {dateRange?.from && (
                                <button
                                    onClick={() => onDateRangeChange?.(undefined)}
                                    className="mt-6 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full transition-all border border-emerald-500/20"
                                >
                                    Reset Date Filter
                                </button>
                            )}
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {filteredConversations.map((conv, idx) => (
                                <ConversationItem
                                    key={`${conv._id}-${idx}`}
                                    conv={conv}
                                    isSelected={Boolean(selectedId && String(selectedId) === String(conv._id || conv.chatId))}
                                    onClick={() => onSelect(String(conv._id || conv.chatId))}
                                    onContextMenu={handleContextMenu}
                                    searchQuery={globalSearchQuery}
                                    isSelectionMode={isSelectionMode}
                                    isChecked={selectedChatIds.has(String(conv._id || conv.chatId))}
                                    onToggleSelection={() => toggleChatSelection(String(conv._id || conv.chatId))}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </ScrollArea>

            {/* 🏁 Bulk Action Bar (Bottom Floating) */}
            <AnimatePresence>
                {isSelectionMode && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="absolute bottom-4 left-4 right-4 bg-zinc-900 border border-white/10 rounded-2xl p-3 shadow-2xl z-50 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExitSelectionMode}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={20} className="text-zinc-400" />
                            </button>
                            <span className="text-sm font-bold text-white">
                                {selectedChatIds.size} Selected
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSelectAll}
                                className="p-2 hover:bg-white/10 rounded-lg text-zinc-300 text-xs font-bold uppercase tracking-wider"
                            >
                                {selectedChatIds.size === filteredConversations.length ? "Deselect All" : "Select All"}
                            </button>
                            <div className="h-4 w-px bg-white/10 mx-1" />
                            <button
                                onClick={handleBulkArchive}
                                disabled={selectedChatIds.size === 0}
                                className="p-2 hover:bg-emerald-500/20 hover:text-emerald-500 text-zinc-400 rounded-lg transition-all disabled:opacity-50"
                                title="Archive Selected"
                            >
                                <Archive size={20} />
                            </button>
                            <button
                                onClick={handleBulkBlock}
                                disabled={selectedChatIds.size === 0}
                                className="p-2 hover:bg-red-500/20 hover:text-red-500 text-zinc-400 rounded-lg transition-all disabled:opacity-50"
                                title="Block Selected"
                            >
                                <Ban size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status Context Menu */}
            {
                statusContextMenu && (
                    <div
                        className="fixed z-[100] bg-zinc-800 border border-white/10 rounded-xl py-1 shadow-2xl min-w-[160px]"
                        style={{ left: statusContextMenu.x, top: statusContextMenu.y }}
                    >
                        <button
                            onClick={() => handleDeleteStatus(statusContextMenu.status._id)}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-white/5 transition-colors uppercase tracking-widest"
                        >
                            Delete Status
                        </button>
                        <button
                            onClick={() => setStatusContextMenu(null)}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-zinc-400 hover:bg-white/5 transition-colors uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                    </div>
                )
            }
            {/* 🏷️ Label Modal */}
            <LabelModal
                isOpen={isLabelModalOpen}
                onClose={() => setIsLabelModalOpen(false)}
                onCreate={handleCreateLabel}
                onApply={handleApplyLabel}
                onDelete={handleDeleteLabelHistory}
                existingTags={poolRibbons}
                activeTags={conversations.find(c => c._id === labelChatId)?.tags || []}
            />
            <AnimatePresence>
                {contextMenu && (
                    <ChatContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        conversation={contextMenu.conversation}
                        onClose={() => setContextMenu(null)}
                        onPin={handlePin}
                        onArchive={handleArchive}
                        onToggleFavourite={handleToggleFavourite}
                        onAddLabel={handleAddLabel}
                        isMuted={isMuted}
                        onToggleMute={toggleMute}
                        onEnterSelectionMode={() => handleEnterSelectionMode(String(contextMenu.conversation._id))} // 🆕
                    />
                )}

                {/* 📸 Status Overlays */}
                <StatusCreatorOverlay
                    key="creator"
                    open={isCreatorOpen}
                    onClose={() => setIsCreatorOpen(false)}
                    onSubmit={handleCreateStatus}
                />

                <StatusViewerOverlay
                    key="viewer"
                    open={isViewerOpen}
                    onClose={() => setIsViewerOpen(false)}
                    statuses={viewerStatuses}
                    initialIndex={viewerInitialIndex}
                    onDelete={(status) => handleDeleteStatus(status.id)}
                />
            </AnimatePresence>
        </div>
    );
};
