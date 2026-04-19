/**
 * @deprecated For widget use, please use AliveChatWidget instead.
 * This component may still be used for dashboard-specific chat views.
 */
"use client";

import React, { useRef, useMemo } from 'react';
import { FilterX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from "next-themes";
import { useThemeStore } from '@/store/themeStore';
import dynamic from 'next/dynamic';
import GradualBlur from '@/components/BitsUI/GradualBlur';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { StatusViewerOverlay } from '@/components/status/viewer/StatusViewerOverlay'; // 🟢 NEW
import { useOrg } from '@/context/OrgContext';
import { useCallStore } from '@/store/useCallStore';
import { useCallLogger } from '../hooks/useCallLogger';
import { useChatLogic } from '../hooks/useChatLogic';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { MessageStream } from '../messaging/MessageStream';
import { ChatMessage } from '../types';
import { SecurityGatekeeperModal } from '../overlays/SecurityGatekeeperModal';

// ✨ Dynamic Import to prevent hydration issues and reduce bundle size
const DynamicBackground = dynamic(() => import('@/components/layout/DynamicBackground'), {
    ssr: false,
});

interface ChatWindowProps {
    orgId: string;
    viewMode: 'widget' | 'dashboard';
    conversationId?: string;
    userName?: string;
    userLocation?: string;
    isAssistantMode?: boolean;
    onClose?: () => void;
    onToggleContext?: () => void;
    onToggleAssistant?: () => void;
    onOpenDossier?: () => void;
    isContextOpen?: boolean;
    externalFilterType?: string | null;
    onClearExternalFilter?: () => void;
    userEmail?: string;
    userPhone?: string;
    globalSearchQuery?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    orgId,
    viewMode,
    conversationId,
    userName = "Unknown User",
    userLocation = "Unknown Location",
    isAssistantMode = false,
    onClose,
    onToggleContext,
    onToggleAssistant,
    onOpenDossier,
    isContextOpen = false,
    externalFilterType = null,
    onClearExternalFilter,
    userEmail,
    userPhone,
    globalSearchQuery
}) => {
    const { activeOrgName } = useOrg();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    const { fontFamily, fontSize } = useThemeStore();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const plusButtonRef = useRef<HTMLButtonElement>(null);

    const logic = useChatLogic({
        orgId,
        conversationId,
        externalFilterType,
        userName,
        textareaRef,
        viewMode // ✅ Pass View Mode for Role Determination
    });

    const {
        socketMessages,
        isThinking,
        thinkingMessage,
        thinkingSteps,
        thinkingElapsedMs,
        isConnected,
        inputValue,
        setInputValue,
        mode,
        isMaximized,
        setIsMaximized,
        showMaximize,
        isSearchActive,
        setIsSearchActive,
        searchQuery,
        setSearchQuery,
        filterType,
        setFilterType,
        isFilterOpen,
        setIsFilterOpen,
        replyingTo,
        setReplyingTo,
        selectedFile,
        setSelectedFile,
        filePreviewUrl,
        setFilePreviewUrl,
        sendFileToAI,
        setSendFileToAI,
        linkPreviewData,
        setLinkPreviewData,
        isFetchingLink,
        isPollBuilderOpen,
        setIsPollBuilderOpen,
        isProductPickerOpen,
        setIsProductPickerOpen,
        isSlotPickerOpen,
        setIsSlotPickerOpen,
        isQuickReplyOpen,
        setIsQuickReplyOpen,
        isOfferOpen,
        setIsOfferOpen,
        isLocationOpen,
        setIsLocationOpen,
        isFormOpen,
        setIsFormOpen,
        isNoteBuilderOpen,
        setIsNoteBuilderOpen,
        reschedulingMsgId,
        setReschedulingMsgId,
        setMessages,
        messages,
        sendMessage,

        // Handlers
        handleSend,
        handleInput,
        handleKeyDown,
        handleGridSelect,
        handlePollSend,
        handleProductSend,
        handleSlotSelect,
        handleQuickReplySend,
        handleOfferSend,
        handleLocationSend,
        handleFormSend,
        handleNoteSend,
        toggleFullScreen,
        isLoadingHistory,
        availableDates,
        jumpToDate,
        statuses,
        markStatusViewed,
        isTyping,
        typingChatId,
        initialMode,
        deleteMessage,
        toggleReaction,
        activeWordIndex, // 🎙️
        isSpeaking // 🎙️
    } = logic;

    if (isTyping) {
        console.log('✍️ [Dashboard] Typing Status:', { isTyping, typingChatId, conversationId });
    }

    // 🟢 Status Viewer State
    const [showStatusViewer, setShowStatusViewer] = React.useState(false);

    // 🟢 Expand Iframe Logic (Widget Mode)
    React.useEffect(() => {
        if (viewMode === 'widget') {
            if (showStatusViewer) {
                window.parent.postMessage('CLUAIZ_EXPAND_FULLSCREEN', '*');
            } else {
                window.parent.postMessage('CLUAIZ_COLLAPSE_FULLSCREEN', '*');
            }
        }
    }, [showStatusViewer, viewMode]);

    const { status: callStatus, startCall, incomingCall, callerNumber } = useCallStore();

    // 📞 BRIDGE: Sync Call Store -> Backend Logging using Hook
    useCallLogger({ logCall: logic.logCall });


    // ♾️ ACTION STREAM (The Core Thread)
    // socketMessages from logic is already filtered and mapped!
    const allMessages = useMemo(() => {
        return [...socketMessages].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    }, [socketMessages]);

    const isWidget = viewMode === 'widget';

    return (
        <div className={cn(
            "flex-1 flex flex-col h-full transition-all duration-300 overflow-hidden relative",
            isWidget
                ? "bg-white dark:bg-slate-950 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800"
                : "bg-transparent"
        )}
            style={{ fontFamily: fontFamily, fontSize: `${fontSize}px` }}
        >
            <ChatHeader
                isAssistantMode={isAssistantMode}
                userName={userName === "Unknown User" ? "Visitor" : userName}
                businessName={activeOrgName || "Cluaiz"}
                agentName="Aryan"
                isConnected={isConnected}
                isSearchActive={isSearchActive}
                setIsSearchActive={setIsSearchActive}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterType={filterType}
                setFilterType={setFilterType}
                isFilterOpen={isFilterOpen}
                setIsFilterOpen={setIsFilterOpen}
                viewMode={viewMode}
                isTyping={isTyping}
                userEmail={userEmail}
                userPhone={userPhone}
                callStatus={callStatus}
                callerNumber={callerNumber}
                conversationId={conversationId}
                orgId={orgId}
                startCall={startCall}
                incomingCall={incomingCall}
                mode={mode}
                onToggleMode={logic.toggleMode}
                onClose={onClose}
                onToggleContext={onToggleContext}
                onToggleAssistant={onToggleAssistant}
                onOpenDossier={onOpenDossier}
                hasActiveStatus={statuses.length > 0}
                statusCount={statuses.length}
                onAvatarClick={() => {
                    if (viewMode === 'dashboard') {
                        (onOpenDossier || onToggleContext)?.();
                    } else if (statuses.length > 0) {
                        setShowStatusViewer(true);
                    } else if (!isAssistantMode) {
                        (onOpenDossier || onToggleContext)?.();
                    }
                }}
            />

            {/* ♾️ ACTION STREAM (The Core Thread) */}
            <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col" onDoubleClick={toggleFullScreen}>
                {/* 🛑 Removed: Redundant Premium Filter Banner (Banner looked "bad" to user) */}


                <div className="absolute inset-0 z-[100]  pointer-events-none">
                    <GradualBlur
                        target="parent"
                        position="bottom"
                        height="1rem"
                        strength={4}
                        divCount={10}
                        curve="bezier"
                        exponential
                        opacity={1}
                        zIndex={0}
                    />
                </div>

                <div className="flex-1 min-h-0 z-50 w-full relative">
                    <MessageStream
                        messages={(() => {
                            console.log('🧪 [ChatWindow] Rendering MessageStream with messages:', {
                                count: allMessages.length,
                                sampleWithReactions: allMessages.find(m => m.reactions && Object.keys(m.reactions).length > 0)
                            });
                            return allMessages;
                        })()}
                        isThinking={isThinking}
                        thinkingMessage={thinkingMessage}
                        thinkingSteps={thinkingSteps}
                        thinkingElapsedMs={thinkingElapsedMs}
                        theme={isDarkMode ? 'dark' : 'light'}
                        orgId={orgId}
                        searchQuery={globalSearchQuery}
                        viewMode={viewMode}
                        mode={mode} // 🟢 Pass Mode for Typing Logic
                        isTyping={isTyping && (!typingChatId || typingChatId === conversationId)} // ✍️ Match Chat ID
                        onEditInfo={!isAssistantMode ? onToggleContext : undefined}
                        onArchive={() => {
                            toast.success('Conversation archived successfully');
                        }}
                        onViewHistory={!isAssistantMode ? onToggleContext : undefined}
                        onCloseChat={onClose}
                        onReply={(messageId, content) => {
                            const msg = allMessages.find(m => m.id === messageId);
                            setReplyingTo({
                                id: messageId,
                                sender: msg?.senderName || msg?.sender || 'Unknown',
                                content: content
                            });
                            textareaRef.current?.focus();
                        }}
                        onReschedule={(msgId) => {
                            toast.info("Opening protocol re-scheduler...");
                            setReschedulingMsgId(msgId);
                            setIsSlotPickerOpen(true);
                        }}
                        onCancel={(msgId) => {
                            toast.error("Protocol termination initiated.");
                            const updatedMessages = (messages as any[]).map((m, i) => {
                                const currentId = (m as any)._id || `msg-${i}`;
                                if (currentId === msgId) {
                                    return {
                                        ...m,
                                        metadata: { ...m.metadata, slot: { ...m.metadata.slot, status: 'cancelled' } }
                                    };
                                }
                                return m;
                            });
                            setMessages(updatedMessages as any);
                            sendMessage("I have cancelled this booking.", undefined, {
                                hidden: true,
                                metadata: { type: 'system_alert', action: 'cancel_booking', targetId: msgId }
                            });
                        }}
                        // 📜 Pagination Props (Wired)
                        onLoadMore={logic.loadMoreHistory}
                        hasMore={logic.hasMoreHistory}
                        isLoadingHistory={isLoadingHistory}
                        // 📅 Date Navigation
                        availableDates={availableDates}
                        onJumpToDate={(date) => jumpToDate(date)}
                        deleteMessage={deleteMessage}
                        toggleReaction={toggleReaction} // ❤️ Wire it up
                        activeWordIndex={activeWordIndex} // 🎙️
                        isVoiceSpeaking={isSpeaking} // 🎙️
                        voiceBotReply={logic.voiceBotReply} // 🎙️
                    />
                </div>
            </div>

            <ChatInput
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleSend={handleSend}
                handleKeyDown={handleKeyDown}
                handleInput={handleInput}
                textareaRef={textareaRef}
                isMaximized={isMaximized}
                setIsMaximized={setIsMaximized}
                showMaximize={showMaximize}
                isAssistantMode={isAssistantMode}
                isWidget={isWidget}
                isDarkMode={isDarkMode}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                linkPreviewData={linkPreviewData}
                setLinkPreviewData={setLinkPreviewData}
                isFetchingLink={isFetchingLink}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                filePreviewUrl={filePreviewUrl}
                setFilePreviewUrl={setFilePreviewUrl}
                sendFileToAI={sendFileToAI}
                setSendFileToAI={setSendFileToAI}
                isInputGridOpen={logic.isInputGridOpen}
                setIsInputGridOpen={logic.setIsInputGridOpen}
                handleGridSelect={handleGridSelect}
                isPollBuilderOpen={isPollBuilderOpen}
                setIsPollBuilderOpen={setIsPollBuilderOpen}
                handlePollSend={handlePollSend}
                isProductPickerOpen={isProductPickerOpen}
                setIsProductPickerOpen={setIsProductPickerOpen}
                handleProductSend={handleProductSend}
                isSlotPickerOpen={isSlotPickerOpen}
                setIsSlotPickerOpen={setIsSlotPickerOpen}
                handleSlotSelect={handleSlotSelect}
                isQuickReplyOpen={isQuickReplyOpen}
                setIsQuickReplyOpen={setIsQuickReplyOpen}
                handleQuickReplySend={handleQuickReplySend}
                isOfferOpen={isOfferOpen}
                setIsOfferOpen={setIsOfferOpen}
                handleOfferSend={handleOfferSend}
                isLocationOpen={isLocationOpen}
                setIsLocationOpen={setIsLocationOpen}
                handleLocationSend={handleLocationSend}
                isFormOpen={isFormOpen}
                setIsFormOpen={setIsFormOpen}
                handleFormSend={handleFormSend}
                isNoteBuilderOpen={isNoteBuilderOpen}
                setIsNoteBuilderOpen={setIsNoteBuilderOpen}
                handleNoteSend={handleNoteSend}
                plusButtonRef={plusButtonRef}
                disabled={!isWidget && mode === 'ai'}
            />
            {/* 🟢 Status Viewer Overlay */}
            <StatusViewerOverlay
                open={showStatusViewer}
                onClose={() => setShowStatusViewer(false)}
                statuses={statuses}
                initialIndex={0}
                onEdit={() => { }} // Read only for widget
                onDelete={() => { }} // Read only for widget
                isWidgetMode={isWidget} // 🔒 Hide View Count for Users
                onViewStatus={logic.markStatusViewed} // 👁️ Track Views
            />
            {/* 🔐 Security Gatekeeper Modal (Global) */}
            <SecurityGatekeeperModal />
        </div >
    );
};
