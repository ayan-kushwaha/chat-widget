
import React from 'react';
import { Conversation } from '../../types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from "date-fns";
import { motion, AnimatePresence } from 'framer-motion';
import { DateRange } from "react-day-picker";
import { Group } from '@/services/group.service';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, X as CloseIcon, Check, CheckCheck, MoreVertical, Pin, Heart, CheckSquare, Archive, Ban, Users, Plus, ChevronRight, PlusCircle, Sparkles, LogOut, ArrowLeft } from 'lucide-react';
import { GroupHeader } from './GroupHeader';

// ----------------------------------------------------------------------
// 🔦 Highlight Component
// ----------------------------------------------------------------------
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

// ----------------------------------------------------------------------
// 🎀 ChatRibbon Component
// ----------------------------------------------------------------------
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
    const activeTag = Array.isArray(tags) ? tags[0] : tags;
    if (!activeTag) return null;

    const [name, colorName] = activeTag.includes(':') ? activeTag.split(':') : [activeTag, 'success'];
    const style = TAG_STYLES[colorName.toLowerCase()] || TAG_STYLES.green;

    return (
        <div className="absolute left-0 top-0 z-[15] flex flex-col items-start shrink-0 pointer-events-none">
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
        </div>
    );
};

// ----------------------------------------------------------------------
// 💬 ConversationItem Component
// ----------------------------------------------------------------------
const ConversationItem = ({
    conv,
    isSelected,
    onClick,
    onContextMenu,
    searchQuery,
    isSelectionMode,
    isChecked,
    onToggleSelection,
    allGroups,
    onGroupSelect,
    onToggleGroupMembership
}: {
    conv: Conversation;
    isSelected: boolean;
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent, conversation: Conversation) => void;
    searchQuery?: string;
    isSelectionMode?: boolean;
    isChecked?: boolean;
    onToggleSelection?: () => void;
    allGroups?: Group[];
    onGroupSelect?: (groupName: string) => void;
    onToggleGroupMembership?: (groupId: string, conversationId: string) => void;
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

            {/* 🎀 Ribbon Tag */}
            {conv.tags && conv.tags.length > 0 && (
                <ChatRibbon tags={conv.tags} />
            )}

            <div className="relative flex-shrink-0 pointer-events-none">
                <Avatar className="w-12 h-12 border border-white/10 shadow-lg group-hover:border-emerald-500/30 transition-colors">
                    <AvatarImage src={conv.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.userName}`} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold">{conv.userName?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                {/* 🟢 Pulsing Online Indicator */}
                <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full z-10 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                    <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40"></div>
                </div>

                {/* 👥 Membership Indicators (Relocated to bottom-left) */}
                {allGroups && (
                    <div className="absolute -bottom-3.5 -left-5 flex items-center -space-x-1.5 pointer-events-auto">
                        {(() => {
                            const memberGroups = allGroups.filter(g => g.members.includes(String(conv._id)) || (conv.chatId && g.members.includes(String(conv.chatId))));
                            if (memberGroups.length === 0) return null;

                            return (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <div className="flex -space-x-1.5 cursor-pointer">
                                            {memberGroups.slice(0, 2).map(g => (
                                                <div
                                                    key={g._id}
                                                    title={g.name}
                                                    className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-white/20 flex items-center justify-center text-[10px] shadow-lg ring-1 ring-black/5 hover:scale-110 transition-transform hover:z-20"
                                                >
                                                    {g.emoji || '👥'}
                                                </div>
                                            ))}
                                            {memberGroups.length > 2 && (
                                                <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-white/20 flex items-center justify-center text-[8px] text-zinc-500 font-bold shadow-lg ring-1 ring-black/5 hover:scale-110 transition-transform">
                                                    +{memberGroups.length - 2}
                                                </div>
                                            )}
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        side="top"
                                        align="start"
                                        className="w-48 p-1 bg-zinc-900 border-white/10 rounded-xl shadow-2xl backdrop-blur-xl z-[60]"
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <div className="px-2 py-1 mb-1">
                                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">In Segments</span>
                                            </div>
                                            {memberGroups.map(group => (
                                                <div key={group._id} className="group/item flex items-center p-1 rounded-lg hover:bg-white/5 transition-colors">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onGroupSelect?.(group.name);
                                                        }}
                                                        className="flex-1 flex items-center gap-2 px-1 text-left"
                                                    >
                                                        <span className="text-sm">{group.emoji || '👥'}</span>
                                                        <span className="text-[12px] font-bold text-zinc-300 truncate group-hover/item:text-white transition-colors">
                                                            {group.name}
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onToggleGroupMembership?.(group._id, String(conv._id));
                                                        }}
                                                        className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover/item:opacity-100"
                                                        title="Exit Group"
                                                    >
                                                        <LogOut size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            );
                        })()}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 grid grid-rows-[auto_auto] gap-0.5 self-center">
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

                <div className="grid grid-cols-[1fr_auto] items-center min-w-0 mt-0.5">
                    <div className="flex flex-col gap-1 min-w-0">
                        {!searchQuery && (
                            <div className="flex items-center gap-1.5 min-w-0">
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

                        {searchQuery && conv.matchCount !== undefined && conv.matchCount > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 w-fit px-2 py-0.5 rounded-full uppercase tracking-tighter border border-emerald-500/20 shadow-sm animate-in fade-in zoom-in duration-300">
                                <Search size={10} strokeWidth={3} className="shrink-0" />
                                <span>{conv.matchCount} {conv.matchCount === 1 ? 'match' : 'matches'} found</span>
                            </div>
                        )}
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
                            onClick={(e: React.MouseEvent) => {
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

// ----------------------------------------------------------------------
// 👥 GroupItem Component
// ----------------------------------------------------------------------
const GroupItem = ({
    group,
    onClick
}: {
    group: Group;
    onClick: () => void;
}) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onClick}
            className="flex items-center gap-3 p-4 pl-6 cursor-pointer hover:bg-neutral-50 dark:hover:bg-zinc-900/50 transition-all border-b border-black/5 dark:border-white/5 group relative"
        >
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-2xl group-hover:border-emerald-500/30 transition-colors shadow-lg">
                {group.emoji || '👥'}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-zinc-900 dark:text-white truncate uppercase tracking-wider">
                    {group.name}
                </h3>
                <p className="text-sm text-zinc-500 truncate">
                    {group.members?.length || 0} Members • AI Optimized
                </p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 text-zinc-400">
                <ChevronRight size={18} />
            </div>
        </motion.div>
    );
};

// ----------------------------------------------------------------------
// 📜 SidebarList Component
// ----------------------------------------------------------------------
interface SidebarListProps {
    isLoading?: boolean;
    filteredConversations: Conversation[];
    dateRange?: DateRange;
    selectedId: string | null;
    isSelectionMode: boolean;
    selectedChatIds: Set<string>;
    onSelect: (id: string) => void;
    handleContextMenu: (e: React.MouseEvent, conversation: Conversation) => void;
    toggleChatSelection: (id: string) => void;
    handleBulkArchive: () => void;
    handleBulkBlock: () => void;
    handleSelectAll: () => void;
    handleExitSelectionMode: () => void;
    onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
    globalSearchQuery: string;
    groups?: Group[];
    activeGroup?: Group | null;
    handleBulkAddToGroup?: (groupId: string) => void;
    viewMode: 'chats' | 'groups';
    onGroupSelect: (groupName: string) => void;
    onOpenCreateGroup: () => void;
    onEditGroup?: (group: Group) => void;
    onToggleGroupMembership?: (groupId: string, conversationId: string) => void;
    onDeleteGroup?: (groupId: string) => void;
    onArchiveGroup?: (groupId: string) => void;
    showArchived?: boolean;
    onToggleArchived?: () => void;
    archivedCount?: number;
    onBackToGroups?: () => void;
    activeGroupMemberCount?: number;
    archivedGroupMemberCount?: number;
    groupFilter?: 'active' | 'archived';
    onGroupFilterChange?: (filter: 'active' | 'archived') => void;
}

export const SidebarList: React.FC<SidebarListProps> = ({
    isLoading,
    filteredConversations,
    dateRange,
    selectedId,
    isSelectionMode,
    selectedChatIds,
    onSelect,
    handleContextMenu,
    toggleChatSelection,
    handleBulkArchive,
    handleBulkBlock,
    handleSelectAll,
    handleExitSelectionMode,
    onScroll,
    globalSearchQuery,
    groups = [],
    activeGroup,
    handleBulkAddToGroup,
    viewMode,
    onGroupSelect,
    onOpenCreateGroup,
    onEditGroup,
    onToggleGroupMembership,
    onDeleteGroup,
    onArchiveGroup,
    showArchived = false,
    onToggleArchived,
    archivedCount,
    onBackToGroups,
    activeGroupMemberCount,
    archivedGroupMemberCount,
    groupFilter,
    onGroupFilterChange
}) => {
    const [scrollTop, setScrollTop] = React.useState(0);
    const isShrunk = scrollTop > 250;

    return (
        <div className="flex-1 relative overflow-hidden flex flex-col">
            {/* 🏷️ Sticky Compact Header (Only when shrunk & activeGroup is present) */}
            <AnimatePresence>
                {activeGroup && isShrunk && (
                    <GroupHeader
                        group={activeGroup}
                        onEdit={() => onEditGroup?.(activeGroup)}
                        onDelete={() => onDeleteGroup?.(activeGroup._id)}
                        onArchive={() => onArchiveGroup?.(activeGroup._id)}
                        onBack={onBackToGroups}
                        activeCount={activeGroupMemberCount}
                        archivedCount={archivedGroupMemberCount}
                        groupFilter={groupFilter}
                        onGroupFilterChange={onGroupFilterChange}
                        isShrunk={true}
                    />
                )}
            </AnimatePresence>

            <ScrollArea
                key={viewMode + (activeGroup?._id || '')}
                onScrollCapture={(e) => {
                    setScrollTop(e.currentTarget.scrollTop);
                    onScroll(e);
                }}
                className="flex-1 bg-white dark:bg-neutral-950 relative group/list overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]"
            >
                <div className="flex flex-col w-full">
                    {/* 🏗️ Full Group Header (Initial View) */}
                    {activeGroup && (
                        <GroupHeader
                            group={activeGroup}
                            onEdit={() => onEditGroup?.(activeGroup)}
                            onDelete={() => onDeleteGroup?.(activeGroup._id)}
                            onArchive={() => onArchiveGroup?.(activeGroup._id)}
                            onBack={onBackToGroups}
                            activeCount={activeGroupMemberCount}
                            archivedCount={archivedGroupMemberCount}
                            groupFilter={groupFilter}
                            onGroupFilterChange={onGroupFilterChange}
                        />
                    )}

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
                    ) : viewMode === 'groups' ? (
                        <div className="flex flex-col w-full">
                            {/* ➕ Create Group Action - Hidden in Archive View */}


                            {/*  статистика & Archive Toggle (Top of list, scrolls away) - ALWAYS VISIBLE */}
                            <div className="px-6 py-2 flex items-center justify-between min-h-[40px]">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                        {showArchived ? 'Total Groups: 0' : `Total Groups: ${groups.length}`}
                                    </span>
                                    {showArchived && (
                                        <span className="text-[14px] font-black text-emerald-500 uppercase tracking-tight mt-1">
                                            Archive Groups
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={onToggleArchived}
                                    className={cn(
                                        "p-1.5 rounded-md transition-all duration-200 flex items-center justify-center border border-white/5 relative",
                                        showArchived
                                            ? "bg-white/5 text-emerald-500 hover:bg-white/10 hover:text-emerald-400 border-white/10"
                                            : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                                    )}
                                    title={showArchived ? "Show Active Groups" : "Show Archived Groups"}
                                >
                                    {showArchived ? <ArrowLeft size={16} /> : <Archive size={14} />}

                                    {/* 🔴 Tiny Archive Count Badge */}
                                    {!showArchived && (archivedCount ?? 0) > 0 && (
                                        <div className="absolute -top-1 -right-1 bg-amber-500 text-[8px] font-black text-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-zinc-950">
                                            {archivedCount}
                                        </div>
                                    )}
                                </button>
                            </div>

                            {groups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 pt-10 text-center opacity-60">
                                    <div className="w-16 h-16 bg-neutral-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                                        <Users size={28} className="text-zinc-500" />
                                    </div>
                                    <h3 className="text-zinc-900 dark:text-white font-bold text-sm mb-1 uppercase tracking-wider">
                                        {showArchived ? 'No Archived Groups' : 'No Groups Yet'}
                                    </h3>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-tighter max-w-[200px]">
                                        {showArchived ? 'Archived groups will appear here.' : 'Create your first group to manage users more effectively.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {groups.map(group => (
                                        <GroupItem
                                            key={group._id}
                                            group={group}
                                            onClick={() => onGroupSelect(group.name)}
                                        />
                                    ))}
                                </div>
                            )}
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
                                    "Try adjusting your filters or search for something else."
                                )}
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {filteredConversations.map((conv) => (
                                <ConversationItem
                                    key={conv._id}
                                    conv={conv}
                                    isSelected={selectedId === conv._id}
                                    onClick={() => onSelect(String(conv._id))}
                                    onContextMenu={handleContextMenu}
                                    searchQuery={globalSearchQuery}
                                    isSelectionMode={isSelectionMode}
                                    isChecked={selectedChatIds.has(String(conv._id || conv.chatId))}
                                    onToggleSelection={() => toggleChatSelection(String(conv._id || conv.chatId))}
                                    allGroups={groups}
                                    onGroupSelect={onGroupSelect}
                                    onToggleGroupMembership={onToggleGroupMembership}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </ScrollArea>

            {/* 🗳️ Bulk Selection Floating Bar */}
            <AnimatePresence>
                {isSelectionMode && (
                    <motion.div
                        initial={{ y: 200 }}
                        animate={{ y: 0 }}
                        exit={{ y: 200 }}
                        className="absolute bottom-4 left-4 right-4 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-xl p-3 z-50 shadow-2xl flex flex-col gap-2"
                    >
                        <div className="flex items-center justify-between px-1">
                            <span className="text-sm font-bold text-white px-2">
                                {selectedChatIds.size} Selected
                            </span>
                            <div className="flex gap-2">
                                <button onClick={handleSelectAll} className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all uppercase">
                                    {selectedChatIds.size === filteredConversations.length ? "Deselect All" : "Select All"}
                                </button>
                                <button onClick={handleExitSelectionMode} className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors">
                                    <CloseIcon size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 h-10">
                            <button
                                onClick={handleBulkArchive}
                                disabled={selectedChatIds.size === 0}
                                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
                            >
                                <Archive size={14} /> Archive
                            </button>
                            <button
                                onClick={handleBulkBlock}
                                disabled={selectedChatIds.size === 0}
                                className="bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-red-500 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-wider border border-red-500/20"
                            >
                                <Ban size={14} /> Block
                            </button>
                        </div>

                        {/* 👥 Bulk Group Assignment */}
                        {groups.length > 0 && handleBulkAddToGroup && selectedChatIds.size > 0 && (
                            <div className="border-t border-white/5 pt-2 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Add to Segment:</span>
                                {groups.map(group => (
                                    <button
                                        key={group._id}
                                        onClick={() => handleBulkAddToGroup(group._id)}
                                        className="px-2 py-1 bg-white/5 hover:bg-emerald-500/20 border border-white/5 hover:border-emerald-500/30 rounded-full text-[11px] font-bold text-zinc-400 hover:text-emerald-500 transition-all flex items-center gap-1.5 whitespace-nowrap"
                                    >
                                        <span>{group.emoji || '👥'}</span>
                                        {group.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
