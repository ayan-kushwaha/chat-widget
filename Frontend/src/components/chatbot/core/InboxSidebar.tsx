"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DateRange } from "react-day-picker";
import { useRouter } from 'next/navigation'; // Added useRouter
import { Conversation } from '../types';
import { ChatContextMenu } from '../messaging/ChatContextMenu';
import { InboxService } from '@/services/inbox.service';
import { useOrg } from '@/context/OrgContext';
import { StatusViewerOverlay, StatusCreatorOverlay } from '@/components/status';
import { statusService } from '@/services/statusService';
import { LabelModal } from '../messaging/LabelModal';
import { motion, AnimatePresence } from 'framer-motion';

import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarSearch } from './sidebar/SidebarSearch';
import { SidebarFilters } from './sidebar/SidebarFilters';
import { SidebarStatus } from './sidebar/SidebarStatus';
import { SidebarList } from './sidebar/SidebarList';
import { GroupService, Group } from '@/services/group.service';
import { NewGroupSlideover } from '../slideovers/NewGroupSlideover';
import { CreatorSelectionSlideover } from '../slideovers/CreatorSelectionSlideover';
import { NewAgentSlideover } from '../slideovers/NewAgentSlideover';
import { NewContactSlideover } from '../slideovers/NewContactSlideover';


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
    groups: Group[];
    onGroupsUpdate: (groups: Group[]) => void;
    onArchiveGroup?: (groupId: string) => void;
    onDeleteGroup?: (groupId: string) => void;
    onOpenMarketplace: () => void;
}

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
    isLoading,
    groups,
    onGroupsUpdate,
    onArchiveGroup,
    onDeleteGroup,
    onOpenMarketplace
}) => {
    const { activeOrg, refreshOrgs } = useOrg();
    const orgId = activeOrg?._id || activeOrg?.id;

    // 🔍 Local search state
    const [localQuery, setLocalQuery] = useState(globalSearchQuery);
    useEffect(() => {
        setLocalQuery(globalSearchQuery);
    }, [globalSearchQuery]);

    // 🔍 Debounced Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (onSearchChange) onSearchChange(localQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [localQuery, onSearchChange]);


    // 🎢 Scroll State
    const [showStatus, setShowStatus] = useState(true);
    const lastScrollY = useRef(0);

    const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = event.currentTarget.scrollTop;
        const diff = currentScrollY - lastScrollY.current;
        if (currentScrollY < 50) {
            setShowStatus(true);
            lastScrollY.current = currentScrollY;
            return;
        }
        if (diff > 10) setShowStatus(false);
        else if (diff < -10) setShowStatus(true);
        lastScrollY.current = currentScrollY;
    };

    // 📸 Status & Modals
    const [isCreatorOpen, setIsCreatorOpen] = useState(false); // For Status Creator (Existing) - Wait, let's rename or check usage. 
    // actually isCreatorOpen was used for StatusCreatorOverlay.
    // Let's add separate state for the "Add Menu"
    const [isSelectionMenuOpen, setIsSelectionMenuOpen] = useState(false);
    const [isContactSlideoverOpen, setIsContactSlideoverOpen] = useState(false);
    const [isTalentPoolOpen, setIsTalentPoolOpen] = useState(false);

    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewerStatuses, setViewerStatuses] = useState<any[]>([]);
    const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

    // 👥 Removed local groups state (now lifted to parent)

    // Context Menus
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, conversation: Conversation } | null>(null);
    const [statusContextMenu, setStatusContextMenu] = useState<{ x: number, y: number, status: any } | null>(null);
    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
    const [labelChatId, setLabelChatId] = useState<string | null>(null);

    // 🎁 Ribbon Pool
    const [poolRibbons, setPoolRibbons] = useState<string[]>(activeOrg?.available_ribbons || []);
    useEffect(() => {
        if (activeOrg?.available_ribbons) setPoolRibbons(activeOrg.available_ribbons);
    }, [activeOrg?.available_ribbons]);

    // 📦 Bulk Selection Mode
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
    const [isGroupSlideoverOpen, setIsGroupSlideoverOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);

    // 🏗️ View Mode: 'chats' (User list) | 'groups' (Group list)
    const [viewMode, setViewMode] = useState<'chats' | 'groups'>('chats');
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [groupMemberFilter, setGroupMemberFilter] = useState<'active' | 'archived'>('active');

    // 📊 Group Member Counts (Move hooks to top level)
    const activeGroupMemberCount = useMemo(() => {
        const activeGroup = groups.find(g => g.name === activeFilter);
        if (!activeGroup) return 0;
        return conversations.filter(c => {
            const cid = String(c._id || c.chatId);
            const isMember = activeGroup.members.some(mid => String(mid) === cid);
            return isMember && c.status !== 'archived';
        }).length;
    }, [groups, activeFilter, conversations]);

    const archivedGroupMemberCount = useMemo(() => {
        const activeGroup = groups.find(g => g.name === activeFilter);
        if (!activeGroup) return 0;
        return conversations.filter(c => {
            const cid = String(c._id || c.chatId);
            const isMember = activeGroup.members.some(mid => String(mid) === cid);
            return isMember && c.status === 'archived';
        }).length;
    }, [groups, activeFilter, conversations]);

    // 📂 Archive State
    const [showArchived, setShowArchived] = useState(false);

    // 🔍 Filter Groups based on Archive State
    const visibleGroups = useMemo(() => {
        return groups.filter(g => !!g.isArchived === showArchived);
    }, [groups, showArchived]);

    // 🔄 Reset internal group filter when changing any main filter
    useEffect(() => {
        setGroupMemberFilter('active');
    }, [activeFilter]);

    // Reset view mode if filter changes to something else
    useEffect(() => {
        if (activeFilter !== 'Groups' && !groups.some(g => g.name === activeFilter)) {
            setViewMode('chats');
            setSelectedGroupId(null);
        }
    }, [activeFilter, groups]);

    const handleFilterChangeInternal = (f: string) => {
        if (f === 'Groups') setViewMode('groups');
        else setViewMode('chats');
        onFilterChange(f);
    };

    // 🔄 Sync viewMode with activeFilter for programmatic updates
    useEffect(() => {
        if (activeFilter === 'Groups') {
            setViewMode('groups');
        }
    }, [activeFilter]);

    // 🗓️ Active Dates Cache
    const [dbBookedDates, setDbBookedDates] = useState<Date[]>([]);
    useEffect(() => {
        const fetchActiveDates = async () => {
            if (!orgId) return;
            try {
                const dates = await InboxService.getActiveDates(orgId as string);
                setDbBookedDates(dates.map((dStr: string) => {
                    const [year, month, day] = dStr.split('-').map(Number);
                    return new Date(year, month - 1, day);
                }));
            } catch (error) { console.error("Failed to fetch active dates:", error); }
        };
        fetchActiveDates();
    }, [orgId]);

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

    // 🎬 Animated Placeholder
    const PLACEHOLDERS = ["Search User", "Search Email", "Search Phone...", "Search Everything", "Search by Date..."];
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setPlaceholderIndex((p) => (p + 1) % PLACEHOLDERS.length), 3000);
        return () => clearInterval(interval);
    }, []);

    // 🏗️ FILTER LOGIC 🏗️
    const filteredConversations = useMemo(() => {
        // 🛡️ Deduplicate input list first
        const uniqueConversations = Array.from(new Map(conversations.map(c => [c._id || c.chatId, c])).values());
        let list = uniqueConversations;

        if (globalSearchQuery || localQuery) return list;

        if (activeFilter !== 'All') {
            if (activeFilter.startsWith('Archive')) {
                list = list.filter(c => c.status === 'archived');
            } else if (activeFilter === 'Unread') {
                list = list.filter(c => (c.unread_count || c.unreadCount || 0) > 0);
            } else if (activeFilter === 'Favourites') {
                list = list.filter(c => c.is_favourite);
            } else if (activeFilter === 'Groups') {
                // If we are in 'Groups' filter, and no specific group selected yet, we might show empty list 
                // because SidebarList will handle generic 'groups' viewMode separately.
                if (viewMode === 'groups') return [];
                list = list.filter(c => c.isGroup);
            } else if (activeFilter === 'Assistants') {
                list = list.filter(c => c.mode === 'ai');
            } else if (activeFilter === 'Online') {
                list = list.filter(c => c.status === 'active');
            } else if (activeFilter === 'Blocked') {
                list = list.filter(c => c.tags?.includes('blocked'));
            } else if (activeFilter === 'New User') {
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                list = list.filter(c => {
                    const created = new Date((c as any).createdAt || (c as any).updatedAt || Date.now());
                    return created > oneDayAgo;
                });
            } else if (activeFilter === 'Old User') {
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                list = list.filter(c => {
                    const created = new Date((c as any).createdAt || (c as any).updatedAt || c.last_message_at || Date.now());
                    return created < thirtyDaysAgo;
                });
            } else if (activeFilter === 'Unknown User') {
                list = list.filter(c => {
                    const name = (c.userName || '').toLowerCase();
                    const isGeneric = name.includes('visitor') || name.includes('user') || name.includes('guest') || !c.userName;
                    const isPhone = /^\+?[\d\s-]{10,}$/.test(name);
                    return isGeneric || isPhone;
                });
            } else {
                // 👥 Check if it's a Group Segment
                const activeGroup = groups.find(g => g.name === activeFilter);
                if (activeGroup) {
                    list = list.filter(c => {
                        const cid = String(c._id || c.chatId);
                        const isMember = activeGroup.members.some(mid => String(mid) === cid);

                        if (!isMember) return false;

                        // Internal Group Filtering: Active vs Archived
                        if (groupMemberFilter === 'archived') return c.status === 'archived';
                        return c.status !== 'archived';
                    });
                } else {
                    // 🏷️ Default Tag Filter
                    list = list.filter(c => c.tags?.some(t => {
                        const name = t.includes(':') ? t.split(':')[0] : t;
                        return name === activeFilter;
                    }));
                }
            }
        }
        return list;
    }, [conversations, activeFilter, globalSearchQuery, localQuery, viewMode, groups, groupMemberFilter]);

    const dynamicFilterTags = useMemo(() => {
        const baseFilters = ['All', 'Online', 'Favourites']; // Removed 'Unread' and 'Groups'
        const uniqueLabels = new Set<string>();
        conversations.forEach(c => {
            if (c.status === 'archived') return;
            c.tags?.forEach(t => {
                const name = t.includes(':') ? t.split(':')[0] : t;
                if (name !== 'blocked') uniqueLabels.add(name);
            });
        });
        return [...baseFilters, ...Array.from(uniqueLabels)];
    }, [conversations]);


    // 🖱️ HANDLERS 🖱️
    const handleContextMenu = (e: React.MouseEvent, conversation: Conversation) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, conversation });
    };

    const handleStatusContextMenu = (e: React.MouseEvent, status: any) => {
        e.preventDefault();
        setStatusContextMenu({ x: e.clientX, y: e.clientY, status });
    };

    const handlePin = async (id: string, isPinned: boolean) => {
        if (!orgId) return;
        onConversationsUpdate(prev => prev.map(c => c._id === id ? { ...c, is_pinned: isPinned } : c));
        await InboxService.togglePin(orgId, id);
    };

    const handleArchive = async (id: string) => {
        if (!orgId) return;
        const c = conversations.find(x => x._id === id);
        // Toggle Logic for Context Menu
        const isArchived = c?.status === 'archived';
        onConversationsUpdate(prev => prev.map(c => c._id === id ? { ...c, status: isArchived ? 'active' : 'archived' } : c));
        if (isArchived) await InboxService.unarchiveChat(orgId, id);
        else await InboxService.archiveChat(orgId, id);
    };

    const handleToggleFavourite = async (id: string, isFav: boolean) => {
        if (!orgId) return;
        onConversationsUpdate(prev => prev.map(c => c._id === id ? { ...c, is_favourite: isFav } : c));
        await InboxService.toggleFavourite(orgId, id);
    };

    const handleToggleGroupMembership = async (groupId: string, conversationId: string) => {
        const group = groups.find(g => g._id === groupId);
        if (!group) return;

        const isMember = group.members.includes(conversationId);
        const action = isMember ? 'remove' : 'add';

        // Optimistic update
        onGroupsUpdate(groups.map((g: Group) => {
            if (g._id === groupId) {
                const members = new Set(g.members);
                if (isMember) members.delete(conversationId);
                else members.add(conversationId);
                return { ...g, members: Array.from(members) };
            }
            return g;
        }));

        try {
            const response = await GroupService.manageMembers(groupId, [conversationId], action);
            if (response.success) {
                console.log(`✅ successfully ${action}ed ${conversationId} ${action === 'add' ? 'to' : 'from'} group ${groupId}`);
            } else {
                // Rollback on failure (simplified)
                refreshOrgs(true);
            }
        } catch (err) {
            console.error(`Failed to toggle group membership:`, err);
            refreshOrgs(true);
        }
    };

    const handleBulkAddToGroup = async (groupId: string) => {
        if (!orgId || selectedChatIds.size === 0) return;
        const ids = Array.from(selectedChatIds);

        // Optimistic update
        onGroupsUpdate(groups.map((g: Group) => {
            if (g._id === groupId) {
                const members = new Set(g.members);
                ids.forEach(id => members.add(id));
                return { ...g, members: Array.from(members) };
            }
            return g;
        }));

        try {
            await GroupService.manageMembers(groupId, ids, 'add');
            console.log(`✅ Bulk added ${ids.length} chats to group ${groupId}`);
            setIsSelectionMode(false);
            setSelectedChatIds(new Set());
        } catch (err) {
            console.error("Failed bulk add to group:", err);
        }
    };

    // 🔇 Mute State Management - Use Global Audio Manager
    const [isMuted, setIsMuted] = useState(() => {
        if (typeof window !== 'undefined') {
            // Import audioManager dynamically to avoid SSR issues
            const { audioManager } = require('@/utils/audioManager');
            return audioManager.getMuteState();
        }
        return false;
    });

    const toggleMute = () => {
        if (typeof window !== 'undefined') {
            const { audioManager } = require('@/utils/audioManager');
            const newState = audioManager.toggleMute();
            setIsMuted(newState);
            console.log(`🔔 Notifications ${newState ? 'MUTED ❌' : 'UNMUTED ✅'}`);
        }
    };

    const handleAddLabel = (id?: string) => {
        const targetId = id || contextMenu?.conversation._id;
        if (targetId) {
            setLabelChatId(targetId);
            setIsLabelModalOpen(true);
            setContextMenu(null);
        }
    };

    const handleStatusClick = (status: any, allStatuses: any[]) => {
        const formatted = allStatuses.map(s => ({
            id: s._id,
            userName: s.userName || 'You',
            userAvatar: s.userAvatar,
            type: s.type,
            content: s.content,
            styling: s.styling,
            timestamp: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date(s.createdAt),
            music: s.music,
            musicVolume: s.musicVolume
        }));
        setViewerStatuses(formatted);
        setViewerInitialIndex(allStatuses.findIndex(s => s._id === status._id));
        setIsViewerOpen(true);
    };

    const handleCreateStatus = async (data: any) => {
        if (!orgId) return;
        await statusService.createStatus({ ...data, organizationId: orgId });
        onStatusCreated?.();
        setIsCreatorOpen(false);
    };

    const handleDeleteStatus = async (statusId: string) => {
        if (!orgId) return;
        await statusService.deleteStatus(statusId, orgId);
        onStatusCreated?.();
        setIsViewerOpen(false);
        setStatusContextMenu(null);
    };

    // Label Logic
    const handleCreateLabel = async (tagName: string, color: string) => {
        if (!orgId) return;
        const tagValue = `${tagName}:${color}`;

        // 🎀 Add to Persistent Pool ONLY (Max 30)
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
                tags: isTogglingOff ? [] : [tagValue]
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
            setIsLabelModalOpen(false);
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

    // Bulk Actions
    const toggleChatSelection = (id: string) => {
        const newSet = new Set(selectedChatIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedChatIds(newSet);
    };

    const handleBulkArchive = async () => {
        if (!orgId) return;
        const ids = Array.from(selectedChatIds);
        onConversationsUpdate(prev => prev.map(c => ids.includes(String(c._id)) ? { ...c, status: 'archived' } : c));
        setIsSelectionMode(false);
        setSelectedChatIds(new Set());
        await Promise.all(ids.map(id => InboxService.archiveChat(orgId, id)));
    };

    const handleBulkBlock = () => {
        console.log("Blocking", selectedChatIds);
        setIsSelectionMode(false);
        setSelectedChatIds(new Set());
    };

    const handleEnterSelectionMode = (id?: string) => {
        setIsSelectionMode(true);
        if (id) setSelectedChatIds(new Set([id]));
        setContextMenu(null);
    };

    const router = useRouter();

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-neutral-950 border-r border-black/5 dark:border-white/10 select-none relative overflow-hidden">

            {/* 1. Header */}
            <SidebarHeader
                onOpenNewChat={onOpenNewChat}
                onOpenSettings={onOpenSettings}
                onOpenCreateGroup={() => {
                    setEditingGroup(null);
                    setIsGroupSlideoverOpen(true);
                }}
            />

            {/* 2. Search & Filters */}
            <SidebarSearch
                localQuery={localQuery}
                setLocalQuery={setLocalQuery}
                onSearchChange={onSearchChange}
                placeholderIndex={placeholderIndex}
                PLACEHOLDERS={PLACEHOLDERS}
                dateRange={dateRange}
                onDateRangeChange={onDateRangeChange}
                bookedDates={bookedDates}
                activeFilter={activeFilter}
                onFilterChange={handleFilterChangeInternal}
                groups={groups}
            />

            {/* 3. Horizontal Ribbons */}
            <SidebarFilters
                dynamicFilterTags={dynamicFilterTags}
                activeFilter={activeFilter}
                onFilterChange={handleFilterChangeInternal}
            />

            {/* 4. Status Bar (Collapsible) - Only show on 'All' filter */}
            {activeFilter === 'All' && (
                <SidebarStatus
                    showStatus={showStatus}
                    statuses={statuses}
                    setIsCreatorOpen={setIsCreatorOpen}
                    handleStatusClick={handleStatusClick}
                    handleStatusContextMenu={handleStatusContextMenu}
                />
            )}

            {/* 5. Main Conversation List */}
            <SidebarList
                isLoading={isLoading}
                filteredConversations={filteredConversations}
                dateRange={dateRange}
                selectedId={selectedId}
                isSelectionMode={isSelectionMode}
                selectedChatIds={selectedChatIds}
                onSelect={onSelect}
                handleContextMenu={handleContextMenu}
                toggleChatSelection={toggleChatSelection}
                handleBulkArchive={handleBulkArchive}
                handleBulkBlock={handleBulkBlock}
                handleSelectAll={() => {
                    if (selectedChatIds.size === filteredConversations.length) setSelectedChatIds(new Set());
                    else setSelectedChatIds(new Set(filteredConversations.map(c => String(c._id || c.chatId))));
                }}
                handleExitSelectionMode={() => {
                    setIsSelectionMode(false);
                    setSelectedChatIds(new Set());
                }}
                onScroll={onScroll}
                globalSearchQuery={globalSearchQuery}
                groups={visibleGroups}
                activeGroup={groups.find(g => g.name === activeFilter)}
                handleBulkAddToGroup={handleBulkAddToGroup}
                viewMode={viewMode}
                onGroupSelect={(groupName: string) => {
                    setViewMode('chats');
                    onFilterChange(groupName);
                }}
                onOpenCreateGroup={() => {
                    setEditingGroup(null);
                    setIsGroupSlideoverOpen(true);
                }}
                onEditGroup={(group) => {
                    setEditingGroup(group);
                    setIsGroupSlideoverOpen(true);
                }}
                onToggleGroupMembership={handleToggleGroupMembership}
                onDeleteGroup={onDeleteGroup}
                onArchiveGroup={onArchiveGroup}
                showArchived={showArchived}
                onToggleArchived={() => setShowArchived(!showArchived)}
                archivedCount={groups.filter(g => g.isArchived).length}
                onBackToGroups={() => handleFilterChangeInternal('Groups')}
                activeGroupMemberCount={activeGroupMemberCount}
                archivedGroupMemberCount={archivedGroupMemberCount}
                groupFilter={groupMemberFilter}
                onGroupFilterChange={setGroupMemberFilter}
            />

            {/* 🧩 Modals & Overlays (Keep them here as they are global to sidebar) */}
            <StatusCreatorOverlay
                open={isCreatorOpen}
                onClose={() => setIsCreatorOpen(false)}
                onSubmit={handleCreateStatus}
            />

            <NewGroupSlideover
                isOpen={isGroupSlideoverOpen}
                onClose={() => {
                    setIsGroupSlideoverOpen(false);
                    setEditingGroup(null);
                }}
                editGroup={editingGroup}
                onGroupCreated={(group: Group) => {
                    const exists = groups.find((g: Group) => g._id === group._id);
                    if (exists) {
                        onGroupsUpdate(groups.map((g: Group) => g._id === group._id ? group : g));
                    } else {
                        onGroupsUpdate([...groups, group]);
                    }
                    refreshOrgs(true);
                }}
                onBack={() => {
                    setIsGroupSlideoverOpen(false);
                    setIsSelectionMenuOpen(true);
                }}
            />

            <CreatorSelectionSlideover
                isOpen={isSelectionMenuOpen}
                onClose={() => setIsSelectionMenuOpen(false)}
                onSelectMode={(mode: 'new_group' | 'new_contact' | 'booking_settings' | 'support' | 'hire_ai') => {
                    console.log("Selected mode:", mode);
                    setIsSelectionMenuOpen(false);
                    if (mode === 'new_group') setIsGroupSlideoverOpen(true);
                    if (mode === 'new_contact') setIsContactSlideoverOpen(true);
                    if (mode === 'hire_ai') {
                        console.log("Navigating to AI Workforce...");
                        // Navigate to Full Page Marketplace (List Folder)
                        setTimeout(() => {
                            router.push('/dashboard/communication/ai-employees/list');
                        }, 100);
                    }
                }}
            />

            <NewContactSlideover
                isOpen={isContactSlideoverOpen}
                onClose={() => setIsContactSlideoverOpen(false)}
                onContactCreated={() => { }} // Placeholder
                onBack={() => {
                    setIsContactSlideoverOpen(false);
                    setIsSelectionMenuOpen(true);
                }}
            />

            <AnimatePresence>
                {isViewerOpen && (
                    <StatusViewerOverlay
                        key="viewer"
                        open={isViewerOpen}
                        onClose={() => setIsViewerOpen(false)}
                        statuses={viewerStatuses}
                        initialIndex={viewerInitialIndex}
                        onDelete={(status) => handleDeleteStatus(status.id)}
                    />
                )}
            </AnimatePresence>

            <LabelModal
                isOpen={isLabelModalOpen}
                onClose={() => setIsLabelModalOpen(false)}
                onCreate={handleCreateLabel}
                onApply={handleApplyLabel}
                onDelete={handleDeleteLabelHistory}
                existingTags={poolRibbons}
                activeTags={conversations.find(c => c._id === labelChatId)?.tags || []}
            />

            {/* Context Menu Render */}
            <AnimatePresence>
                {contextMenu && (
                    <ChatContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        conversation={contextMenu.conversation}
                        onClose={() => setContextMenu(null)}
                        onPin={(id) => handlePin(id, !contextMenu.conversation.is_pinned)}
                        onArchive={(id) => handleArchive(id)}
                        onToggleFavourite={(id) => handleToggleFavourite(id, !contextMenu.conversation.is_favourite)}
                        onAddLabel={(id) => handleAddLabel(id)}
                        isMuted={false}
                        onToggleMute={toggleMute}
                        onEnterSelectionMode={() => handleEnterSelectionMode(String(contextMenu.conversation._id))}
                        groups={groups}
                        onAddToGroup={(groupId) => handleToggleGroupMembership(groupId, String(contextMenu.conversation._id))}
                        activeGroupId={groups.find(g => g.name === activeFilter)?._id}
                    />
                )}
            </AnimatePresence>

            {/* Status Context Menu */}
            {statusContextMenu && (
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
            )}
        </div>
    );
};
