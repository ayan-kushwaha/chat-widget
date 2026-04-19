"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOrg } from '@/context/OrgContext';
import { useSocket } from '@/hooks/useSocket';
import { InboxService } from '@/services/inbox.service';
import { InboxSidebar } from '@/components/chatbot/core/InboxSidebar';
import { ChatWindow } from '@/components/chatbot/core/ChatWindow';

import { MissionControl } from '@/components/chatbot/core/MissionControl';
import { DateRange } from "react-day-picker";
import { NewContactSlideover } from '@/components/chatbot/slideovers/NewContactSlideover';
import { NewGroupSlideover } from '@/components/chatbot/slideovers/NewGroupSlideover';
import { CreatorSelectionSlideover } from '@/components/chatbot/slideovers/CreatorSelectionSlideover';
import { ProfileDetailPage } from '@/components/chatbot/profile-details/ProfileDetailPage';
import { SupportHelixSlideover } from '@/components/chatbot/slideovers/SupportHelixSlideover';
import { BookingSettingsSlideover } from '@/components/chatbot/slideovers/BookingSettingsSlideover';
import { NeuralLogsSlideover } from '@/components/chatbot/slideovers/NeuralLogsSlideover';
import { SettingsOverlay } from '@/components/chatbot/overlays/SettingsOverlay';
import { Conversation as IConversation } from '@/components/chatbot/types';
import { GroupService, Group } from '@/services/group.service';
import { MessageSquare, Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from '@/components/theme-provider';
import { useThemeStore } from '@/store/themeStore';
import SplashCursor from '@/components/BitsUI/SplashCursor';
import Crosshair from '@/components/BitsUI/Crosshair';
import TargetCursor from '@/components/BitsUI/TargetCursor';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { TalentPool } from '@/components/workforce/TalentPool';
import { MarketplaceHeader } from '@/components/chatbot/ai-employees-workforce/marketplace/MarketplaceHeader';
import { MarketplaceFilters } from '@/components/chatbot/ai-employees-workforce/marketplace/MarketplaceFilters';
import { MarketplaceGrid } from '@/components/chatbot/ai-employees-workforce/marketplace/MarketplaceGrid';

interface InboxPageProps {
    defaultView?: 'chat' | 'dossier' | 'marketplace';
}

export default function InboxPage({ defaultView = 'chat' }: InboxPageProps) {
    const { activeOrg, isLoading: isOrgLoading } = useOrg();
    const { cursorType } = useThemeStore();
    const orgId = activeOrg?._id || activeOrg?.id || null;

    // State
    const [conversations, setConversations] = useState<IConversation[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);



    // View Mode State: 'chat' | 'dossier' | 'marketplace'
    const [viewMode, setViewMode] = useState<'chat' | 'dossier' | 'marketplace'>(defaultView);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isAssistantActive, setIsAssistantActive] = useState(false);
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [isSelectionOpen, setIsSelectionOpen] = useState(false);
    const [isNewContactOpen, setIsNewContactOpen] = useState(false);
    const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [isBookingSettingsOpen, setIsBookingSettingsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNeuralLogsOpen, setIsNeuralLogsOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');
    const [activeFilterType, setActiveFilterType] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastReadTimestamp, setLastReadTimestamp] = useState<Record<string, number>>({});

    // 🟢 Ref to track selectedId without stale closures
    const selectedIdRef = React.useRef(selectedId);
    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

    // 🛠️ Stable Sort Logic (Pinned > Date)
    const sortConversations = useCallback((list: IConversation[], query: string = '') => {
        return [...list].sort((a, b) => {
            // 1. Pin Priority (Highest, unless searching)
            if (!query) {
                if (a.is_pinned && !b.is_pinned) return -1;
                if (!a.is_pinned && b.is_pinned) return 1;
            }

            // 2. Date Priority (Last Message > Updated At)
            // 🛡️ Fix for "Jumping": Use last_message_at preferentially to avoid bumps on silent updates
            const timeA = new Date(a.last_message_at || 0).getTime();
            const timeB = new Date(b.last_message_at || 0).getTime();

            // Fallback to updatedAt only if last_message_at is missing (new chats)
            const finalTimeA = timeA > 0 ? timeA : new Date(a.updatedAt || 0).getTime();
            const finalTimeB = timeB > 0 ? timeB : new Date(b.updatedAt || 0).getTime();

            return finalTimeB - finalTimeA;
        });
    }, []);

    // 🚀 STABLE DATA FETCHING
    const loadConversations = useCallback(async () => {
        if (!orgId) return;

        // Show loader only if NOT searching (smooth real-time search)
        if (!searchQuery) setIsLoading(true);

        try {
            let startDate = dateRange?.from ? new Date(dateRange.from) : undefined;
            let endDate = dateRange?.to ? new Date(dateRange.to) : dateRange?.from ? new Date(dateRange.from) : undefined;

            if (startDate) startDate.setHours(0, 0, 0, 0);
            if (endDate) endDate.setHours(23, 59, 59, 999);

            // 🎯 Phase 0: Status Strategy
            const isArchive = activeFilter.startsWith('Archive');
            const isGroupName = groups.some(g => g.name === activeFilter);

            // 🛡️ [Deep Fix] If we are in a group, we MUST explicitly ask for archived chats
            // otherwise the backend defaults to { status: { $ne: 'archived' } }
            const fetchStatus = isGroupName
                ? 'active,resolved,archived'
                : (searchQuery || dateRange || activeFilter === 'All')
                    ? undefined
                    : (isArchive ? 'archived' : 'active,resolved');

            // Fetch from backend
            const data = await InboxService.getActiveChats(orgId, searchQuery || undefined, startDate?.toISOString(), endDate?.toISOString(), fetchStatus);

            console.log(`📡 [Page] Backend returned ${data.length} chats for status: ${fetchStatus}`);

            // 🏷️ Category Filter Logic (Permanent & Robust)
            const systemFilters: Record<string, (c: IConversation) => boolean> = {
                'Unread': (c) => (c.unread_count || c.unreadCount || 0) > 0,
                'Online': (c) => c.status === 'active',
                'Favourites': (c) => !!c.is_favourite,
                'Groups': (c) => !!(c.isGroup || c.chatId?.includes('group')),
                'Calls': (c) => !!c.last_message_preview?.toLowerCase().match(/call|voice|missed|ringing/),
                'SMS': (c) => !!(c.mode === 'human' && !c.isGroup && !c.chatId?.includes('group')),
                'Assistants': (c) => c.mode === 'ai',
            };

            // 🎯 Phase 2: Category & Dynamic Tag Filtering (HANDLED IN SIDEBAR)
            // We keep the full list here and let Sidebar handle system filters (Unread, Groups, etc.)
            let filtered = data.filter((c: IConversation) => {
                if (searchQuery) return true; // Global search should show everything
                const isArchiveFilter = activeFilter.startsWith('Archive');
                if (isArchiveFilter) return c.status === 'archived';

                // 👥 If in a specific group, allow archived members to pass through 
                // so Sidebar can filter them internally
                const isGroupName = groups.some(g => g.name === activeFilter);
                if (isGroupName) return true;

                return c.status !== 'archived'; // Hide archives in active tabs
            });

            // 🎯 Phase 3: Conditional Sorting (The Relationship Priority)
            // Uses shared sort logic
            setConversations(sortConversations(filtered, searchQuery));

        } catch (error) {
            console.error("Failed to load conversations:", error);
        } finally {
            setIsLoading(false);
        }
    }, [orgId, searchQuery, dateRange, activeFilter, sortConversations, groups]); // 🟢 Sync on all filter inputs

    const loadStatuses = useCallback(async () => {
        if (!orgId) return;
        const data = await InboxService.getStatuses(orgId);
        setStatuses(data);
    }, [orgId]);

    const loadGroups = useCallback(async () => {
        if (!orgId) return;
        try {
            const res = await GroupService.getGroups(orgId);
            if (res.success) setGroups(res.groups);
        } catch (err) { console.error("Failed to fetch groups:", err); }
    }, [orgId]);

    // 1. Unified Filter Sync (Triggers whenever any filter input changes)
    useEffect(() => {
        loadConversations();
        loadStatuses();
    }, [loadConversations, loadStatuses]);

    // 2. Separate Group Load Sync
    useEffect(() => {
        loadGroups();
    }, [loadGroups]);

    const handleSearch = useCallback((query: string) => {
        // setSearchQuery is already called in InboxSidebar via onSearchChange
        // so loadConversations will trigger automatically via dependency array.
        // We can explicitly call it here too if needed, but the effect handles it.
    }, []);

    const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
        setDateRange(range);
    }, []);

    // Socket for Real-time Updates (The Nervous System)
    const { socket } = useSocket(orgId, 'agent'); // 🟢 CRITICAL: Dashboard must connect as 'agent' role

    // 2. Stable Handlers (WhatsApp-style Top Jumping)
    const handleNewChat = useCallback((newConv: any) => {
        setConversations(prev => {
            const exists = prev.some(c =>
                (c._id && newConv._id && String(c._id) === String(newConv._id)) ||
                (c.chatId && newConv.chatId && String(c.chatId) === String(newConv.chatId))
            );

            let newList;
            if (exists) {
                newList = prev.map(c => (String(c._id) === String(newConv._id) || String(c.chatId) === String(newConv.chatId)) ? { ...c, ...newConv } : c);
            } else {
                newList = [newConv, ...prev];
            }
            return sortConversations(newList, searchQuery);
        });
    }, [searchQuery, sortConversations]);

    const handleChatUpdated = useCallback((updatedConv: any) => {
        if (!updatedConv) return;

        console.log('🔄 [INBOX] Chat Update Received:', updatedConv.chatId || updatedConv._id, {
            preview: updatedConv.last_message_preview,
            sender: updatedConv.last_message_sender
        });

        setConversations(prev => {
            // 🔍 FIND MATCH (by any ID variant)
            const targetIdx = prev.findIndex(c =>
                (c._id && updatedConv._id && String(c._id) === String(updatedConv._id)) ||
                (c.chatId && updatedConv.chatId && String(c.chatId) === String(updatedConv.chatId)) ||
                (c._id && updatedConv.chatId && String(c._id) === String(updatedConv.chatId)) ||
                (c.chatId && updatedConv._id && String(c.chatId) === String(updatedConv._id))
            );

            const currentSelectedId = selectedIdRef.current;
            const target = targetIdx !== -1 ? prev[targetIdx] : null;

            // Check if this update corresponds to the currently open chat
            const isChatOpen = (String(currentSelectedId) === String(updatedConv.chatId)) ||
                (String(currentSelectedId) === String(updatedConv._id)) ||
                (target && String(currentSelectedId) === String(target._id));

            if (targetIdx === -1) {
                console.log('🆕 [INBOX] New conversation detected via update, adding and sorting.');
                const newList = [updatedConv, ...prev];
                return sortConversations(newList, searchQuery);
            }

            const updatedList = [...prev];
            // Don't splice and unshift! Just update in place, then sort.

            // 🛡️ [Snake 5] Verification: If we just read this, ignore stale server count
            const lastReadAt = lastReadTimestamp[String(updatedConv.chatId || updatedConv._id)] || 0;
            const isStaleUpdate = (Date.now() - lastReadAt) < 2000;

            const merged = {
                ...target,
                ...updatedConv,
                _id: target?._id || updatedConv._id,
                chatId: target?.chatId || updatedConv.chatId,
                // Only update time if it's explicitly newer or provided. 
                // Don't default to new Date() if missing, to prevent artificial bumping.
                last_message_at: updatedConv.last_message_at || target?.last_message_at || new Date().toISOString(),
                unreadCount: (isChatOpen || isStaleUpdate) ? 0 : (updatedConv.unreadCount ?? updatedConv.unread_count ?? target?.unreadCount ?? 0),
                unread_count: (isChatOpen || isStaleUpdate) ? 0 : (updatedConv.unread_count ?? updatedConv.unreadCount ?? target?.unread_count ?? 0)
            };

            // Auto-update lock if open
            if (isChatOpen && (updatedConv.unread_count > 0 || updatedConv.unreadCount > 0)) {
                setLastReadTimestamp(prevTs => ({ ...prevTs, [String(merged.chatId || merged._id)]: Date.now() }));
                socket?.emit('mark_read', { chatId: String(merged.chatId || merged._id), orgId });
            }

            updatedList[targetIdx] = merged;

            // 🔄 Re-sort to maintain order (Pins top, then Date)
            // This prevents "Jumping" on non-message updates if date didn't change
            return sortConversations(updatedList, searchQuery);
        });
    }, [lastReadTimestamp, socket, orgId, searchQuery, sortConversations]);

    useEffect(() => {
        if (!socket) return;

        socket.on('chat_started', handleNewChat);
        socket.on('chat_updated', handleChatUpdated);

        socket.on('conversation_updated', ({ conversationId, tags }) => {
            setConversations(prev => prev.map(c =>
                (String(c._id) === String(conversationId) || (c.chatId && String(c.chatId) === String(conversationId)))
                    ? { ...c, tags }
                    : c
            ));
        });

        return () => {
            socket.off('chat_started', handleNewChat);
            socket.off('chat_updated', handleChatUpdated);
            socket.off('conversation_updated');
        };
    }, [socket, handleNewChat, handleChatUpdated]);

    // Derived State
    const activeConversation = useMemo(() => {
        if (!selectedId) return null;
        const target = conversations.find(c =>
            String(c._id) === String(selectedId) ||
            (c.chatId && String(c.chatId) === String(selectedId))
        );
        return target;
    }, [conversations, selectedId]);

    // 🎭 PREMIUM INITIALIZATION
    if (isOrgLoading) {
        return (
            <div className="flex-1 w-full flex flex-col items-center justify-center dark:bg-neutral-950 font-sans p-10">
                <div className="relative -ml-20 mb-20">
                    <Loader2 className="absolute top-0 left-0 w-16 h-16 text-emerald-500 animate-spin" />
                </div>
                <h2 className="text-sm font-black text-zinc-500 uppercase tracking-[0.4em] animate-pulse">Initializing OS</h2>
                <p className="text-[10px] text-zinc-700 mt-2 font-bold uppercase tracking-widest">Bridging secure endpoints...</p>
            </div>
        );
    }

    if (!orgId) return null;

    return (
        <div className="flex-1 min-h-0 w-full flex bg-white dark:bg-neutral-950 overflow-hidden relative h-[calc(100vh-52px)]">
            {/* COLUMN A: Relationship Live List (#000000) */}
            {cursorType === 'splash' && <SplashCursor />}
            {cursorType === 'crosshair' && <Crosshair />}
            {cursorType === 'target' && (
                <TargetCursor
                    spinDuration={2}
                    hideDefaultCursor
                    parallaxOn
                    hoverDuration={0.2}
                />
            )}

            <ResizablePanelGroup direction="horizontal" className="flex-1">
                <ResizablePanel
                    defaultSize={25}
                    minSize={15}
                    maxSize={40}
                >
                    <InboxSidebar
                        conversations={conversations}
                        onConversationsUpdate={(action) => {
                            setConversations(prev => {
                                // 🛠️ Auto-Sort Wrapper: Ensure list is ALWAYS sorted after any update
                                const updatedList = typeof action === 'function' ? action(prev) : action;
                                return sortConversations(updatedList, searchQuery);
                            });
                        }}
                        statuses={statuses}
                        selectedId={selectedId}
                        activeFilter={activeFilter}
                        onFilterChange={setActiveFilter}
                        onSelect={(id) => {
                            const stringId = String(id);
                            setSelectedId(stringId);
                            setViewMode('chat');
                            setIsAssistantActive(false);
                            setActiveFilterType(null);

                            // 🟢 Optimistic Update: Clear Unread Count
                            setConversations(prev => prev.map(c =>
                                (String(c._id) === stringId || (c.chatId && String(c.chatId) === stringId))
                                    ? { ...c, unreadCount: 0, unread_count: 0 }
                                    : c
                            ));

                            // 🟢 Persistent Signal: Mark as Read in DB
                            if (orgId && socket) {
                                // 🛡️ [Snake 5] Set local lock before emitting
                                setLastReadTimestamp(prev => ({ ...prev, [String(id)]: Date.now() }));
                                socket.emit('mark_read', { chatId: id, orgId });
                            }
                        }}
                        onOpenNewChat={() => setIsSelectionOpen(true)}
                        onOpenSettings={() => setIsSettingsOpen(true)} // ⚙️ Trigger Settings
                        onStatusCreated={loadStatuses}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onSearch={handleSearch}
                        onDateRangeChange={setDateRange}
                        isLoading={isLoading}
                        groups={groups}
                        onGroupsUpdate={setGroups}
                        onArchiveGroup={async (groupId: string) => {
                            const group = groups.find(g => g._id === groupId);
                            if (!group) return;
                            try {
                                const isArchived = !group.isArchived;
                                const res = await GroupService.archiveGroup(groupId, isArchived);
                                if (res.success) {
                                    setGroups(prev => prev.map(g => g._id === groupId ? { ...g, isArchived } : g));
                                    if (activeFilter === group.name) setActiveFilter('Groups');
                                }
                            } catch (e) { console.error(e); }
                        }}
                        onDeleteGroup={async (groupId: string) => {
                            try {
                                const res = await GroupService.deleteGroup(groupId);
                                if (res.success) {
                                    setGroups(prev => prev.filter(g => g._id !== groupId));
                                    if (groups.find(g => g._id === groupId)?.name === activeFilter) setActiveFilter('Groups');
                                }
                            } catch (e) { console.error(e); }
                        }}
                        onOpenMarketplace={() => setViewMode('marketplace')}
                    />
                </ResizablePanel>

                <ResizableHandle withHandle className="relative z-40 bg-zinc-900 border-x border-white/5 hover:bg-emerald-500/20 transition-colors w-1.5" />

                <ResizablePanel defaultSize={75} className="flex flex-col z-10">
                    <div className="flex-1 flex flex-col overflow-hidden relative">
                        {isAssistantActive ? (
                            <ChatWindow
                                key="internal-assistant"
                                orgId={orgId}
                                viewMode="dashboard"
                                userName="Cluaiz Assistant"
                                userLocation="Global Intelligence"
                                conversationId="internal-assistant"
                                isAssistantMode={true}
                                onClose={() => setIsAssistantActive(false)}
                            />
                        ) : viewMode === 'marketplace' ? (
                            <>
                                <TalentPool />
                            </>
                        ) : selectedId && activeConversation ? (
                            viewMode === 'dossier' ? (
                                <ProfileDetailPage
                                    conversation={activeConversation}
                                    onClose={() => setViewMode('chat')}
                                    onFilterRequest={(type) => {
                                        setActiveFilterType(type);
                                        setViewMode('chat');
                                    }}
                                />
                            ) : (
                                <>
                                    <ChatWindow
                                        key={selectedId} // Force remount for fresh socket/state
                                        orgId={orgId}
                                        viewMode="dashboard"
                                        userName={activeConversation.userName}
                                        userLocation={activeConversation.userName}
                                        userEmail={activeConversation.userEmail}
                                        userPhone={activeConversation.userPhone || activeConversation.userMobile}
                                        conversationId={selectedId as string}
                                        onClose={() => setSelectedId(null)} // 🟢 Fix: Close Chat Button Action
                                        onToggleContext={() => setViewMode('dossier')} // 🟢 Direct Route to Profile Page
                                        isContextOpen={false} // Always false as drawer is gone
                                        onToggleAssistant={() => setIsAssistantActive(true)}
                                        externalFilterType={activeFilterType}
                                        onClearExternalFilter={() => setActiveFilterType(null)}
                                        globalSearchQuery={searchQuery}
                                    />
                                </>
                            )
                        ) : (
                            <>
                                <MissionControl
                                    onStartAI={() => setIsAssistantActive(true)}
                                    onPostStatus={() => { }} // TODO: Implement status upload
                                    onFilter={(mode) => {
                                        if (mode === 'AI') {
                                            setIsNeuralLogsOpen(true);
                                        } else {
                                            setActiveFilter(mode);
                                        }
                                    }}
                                />
                            </>
                        )}
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>



            {/* 🛡️ THE GATEKEEPER (Selector) */}
            <CreatorSelectionSlideover
                isOpen={isSelectionOpen}
                onClose={() => setIsSelectionOpen(false)}
                onSelectMode={(mode) => {
                    setIsSelectionOpen(false);
                    if (mode === 'new_contact') setIsNewContactOpen(true);
                    if (mode === 'new_group') setIsNewGroupOpen(true);
                    if (mode === 'support') setIsSupportOpen(true);
                    if (mode === 'booking_settings') setIsBookingSettingsOpen(true);
                    if (mode === 'hire_ai') {
                        setViewMode('marketplace');
                    }
                }}
            />

            {/* 👤 THE IDENTITY FORGE (Contacts) */}
            <NewContactSlideover
                isOpen={isNewContactOpen}
                onClose={() => setIsNewContactOpen(false)}
                onBack={() => {
                    setIsNewContactOpen(false);
                    setIsSelectionOpen(true);
                }}
                onContactCreated={(contact) => {
                    setConversations(prev => [contact, ...prev]);
                    setSelectedId(contact._id);
                    setIsAssistantActive(false);
                }}
            />

            {/* 🏢 THE COLLECTIVE NEXUS (Groups) */}
            <NewGroupSlideover
                isOpen={isNewGroupOpen}
                onClose={() => setIsNewGroupOpen(false)}
                onBack={() => {
                    setIsNewGroupOpen(false);
                    setIsSelectionOpen(true);
                }}
                onGroupCreated={(group) => {
                    setConversations(prev => [group, ...prev]);
                    setSelectedId(group._id);
                    setIsAssistantActive(false);
                }}
            />

            {/* 🎧 THE SUPPORT HELIX (Contact Us) */}
            <SupportHelixSlideover
                isOpen={isSupportOpen}
                onClose={() => setIsSupportOpen(false)}
                onBack={() => {
                    setIsSupportOpen(false);
                    setIsSelectionOpen(true);
                }}
            />

            {/* 🗓️ THE CHRONOS ENGINE (Booking Admin) */}
            <BookingSettingsSlideover
                isOpen={isBookingSettingsOpen}
                onClose={() => setIsBookingSettingsOpen(false)}
            />

            {/* 🏢 BUSINESS SETTINGS SUITE */}
            <SettingsOverlay
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            {/* 🧠 NEURAL LOGS (AI Memory) */}
            <NeuralLogsSlideover
                isOpen={isNeuralLogsOpen}
                onClose={() => setIsNeuralLogsOpen(false)}
                orgId={orgId}
            />
        </div>
    );
}
