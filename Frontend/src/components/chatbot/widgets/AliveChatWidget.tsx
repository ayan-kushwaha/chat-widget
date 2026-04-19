import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Search, Phone, MoreVertical, Sparkles, Send, Paperclip, Smile, Mic, Maximize2, Minimize2 } from 'lucide-react';
import { X as AnimatedX } from '@/components/animate-ui/icons/x';
import { Bot } from '@/components/animate-ui/icons/bot';
import { BotOff } from '@/components/animate-ui/icons/bot-off';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from "next-themes";
import { useSocket, Message } from '@/hooks/useSocket';
import { MiniForm } from '../utils/MiniForm';
import { UniversalRenderer } from '@/components/sdui/UniversalRenderer';
import { VoicePlayer } from '../utils/VoicePlayer';
import { MessageActions } from '../messaging/MessageActions';
import { ContextMenu } from '../ui/ContextMenu';
import { audioManager } from '@/utils/audioManager';
import { playSendSound } from '@/utils/sendSound';
import { SDUIAction } from '@/components/sdui/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useThemeStore } from '@/store/themeStore';
import { QuotedMessage } from '../messaging/QuotedMessage';
import { TypingIndicator } from '../messaging/TypingIndicator';
import { MessageStream } from '../messaging/MessageStream';
import { ChatInput } from '../core/ChatInput';
import { useChatLogic } from '../hooks/useChatLogic';
import { ChatHeader } from '../core/ChatHeader';
import { useCallStore } from '@/store/useCallStore';
import { useCallLogger } from '../hooks/useCallLogger';

const Typewriter = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
    const [displayedText, setDisplayedText] = useState('');
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        const trimmedText = text.trimStart();
        setDisplayedText('');
        let index = 0;
        let isCancelled = false;

        const interval = setInterval(() => {
            if (isCancelled) return;

            if (index < trimmedText.length) {
                setDisplayedText(trimmedText.substring(0, index + 1));
                index++;
            } else {
                clearInterval(interval);
                if (onCompleteRef.current) {
                    onCompleteRef.current();
                }
            }
        }, 15);

        return () => {
            isCancelled = true;
            clearInterval(interval);
        };
    }, [text]);

    return (
        <div className="prose prose-sm max-w-none transition-colors
            prose-p:text-inherit prose-li:text-inherit prose-blockquote:text-inherit prose-td:text-inherit prose-th:text-inherit
            prose-headings:text-emerald-400 prose-headings:font-bold
            prose-strong:text-emerald-400 prose-strong:font-bold
            prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-a:underline
            prose-code:text-amber-300 prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-p:leading-relaxed prose-p:mb-2
            prose-li:my-0.5
            prose-table:border-collapse prose-table:my-4 prose-table:w-full
            prose-th:border prose-th:border-[rgba(255,255,255,0.2)] dark:prose-th:border-[rgba(255,255,255,0.1)] prose-th:px-3 prose-th:py-2 prose-th:bg-black/5 dark:prose-th:bg-white/5
            prose-td:border prose-td:border-[rgba(255,255,255,0.2)] dark:prose-td:border-[rgba(255,255,255,0.1)] prose-td:px-3 prose-td:py-2"
        >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayedText}
            </ReactMarkdown>
        </div>
    );
};

interface AliveChatWidgetProps {
    primaryColor?: string;
    isEmbed?: boolean;
    orgId?: string | null;
    hideHeader?: boolean;
    initialMessage?: string;
    commandId?: number;
}

export const AliveChatWidget: React.FC<AliveChatWidgetProps> = ({
    primaryColor = '#2563eb',
    isEmbed = false,
    orgId = null,
    hideHeader = false,
    initialMessage,
    commandId
}) => {

    const { fontFamily, fontSize } = useThemeStore();


    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const plusButtonRef = useRef<HTMLButtonElement>(null);



    // ... (inside component)

    const logic = useChatLogic({
        orgId: orgId || '',
        userName: 'Guest',
        textareaRef,
        viewMode: 'widget'
    });

    const {
        socketMessages: messages,
        messagesVersion,
        sendMessage,
        isThinking,
        thinkingMessage,
        thinkingSteps,
        thinkingElapsedMs,
        isConnected,
        inputValue,
        setInputValue,
        mode,
        setMode,
        isMaximized,
        setIsMaximized,
        showMaximize,
        handleSend,
        handleInput,
        handleKeyDown,
        isTyping,
        setTypingStatus,
        initialMode,
        toggleMode,
        aiDisabledUntil,
        deleteMessage,
        toggleReaction,
        // search/filter
        isSearchActive,
        setIsSearchActive,
        searchQuery,
        setSearchQuery,
        filterType,
        setFilterType,
        isFilterOpen,
        setIsFilterOpen,
        // History
        loadMoreHistory,
        hasMoreHistory,
        isLoadingHistory,
        availableDates,
        jumpToDate,
        // File handling
        selectedFile,
        setSelectedFile,
        filePreviewUrl,
        setFilePreviewUrl,
        sendFileToAI,
        setSendFileToAI,
        linkPreviewData,
        setLinkPreviewData,
        isFetchingLink,
        // Builders
        isInputGridOpen,
        setIsInputGridOpen,
        handleGridSelect,
        isPollBuilderOpen,
        setIsPollBuilderOpen,
        handlePollSend,
        isProductPickerOpen,
        setIsProductPickerOpen,
        handleProductSend,
        isSlotPickerOpen,
        setIsSlotPickerOpen,
        handleSlotSelect,
        isQuickReplyOpen,
        setIsQuickReplyOpen,
        handleQuickReplySend,
        isOfferOpen,
        setIsOfferOpen,
        handleOfferSend,
        isLocationOpen,
        setIsLocationOpen,
        handleLocationSend,
        isFormOpen,
        setIsFormOpen,
        handleFormSend,
        isNoteBuilderOpen,
        setIsNoteBuilderOpen,
        handleNoteSend,
        reschedulingMsgId,
        setReschedulingMsgId,
        setMessages,
        replyingTo,
        setReplyingTo
    } = logic;

    // Call Store
    const { status: callStatus, startCall, incomingCall, callerNumber } = useCallStore();

    // 📞 Call Logger
    useCallLogger({ logCall: logic.logCall });

    // 🔥 CRITICAL FIX: Track messages reference changes
    const messagesRef = useRef(messages);
    const renderCountRef = useRef(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 🔥 Track messagesVersion to force re-render
    useEffect(() => {
        // console.log('🔥 [Widget] messagesVersion changed to:', messagesVersion);
    }, [messagesVersion]);

    useEffect(() => {
        renderCountRef.current++;
        messagesRef.current = messages;
    }, [messages, messagesVersion]);


    const setBotState = (state: 'idle' | 'listening' | 'excited' | 'sad' | 'thinking') => {
        if (typeof window !== 'undefined') window.parent.postMessage({ type: 'CLUAIZ_BOT_STATE', state }, '*');
    };

    const scrollToBottom = () => {
        // Use logic's handleScroll or manual scroll?
        // logic doesn't export scrollToBottom directly, but useChatScroll does inside logic.
        // Actually, MessageStream handles scrolling now with useChatScroll!
        // So we might NOT need manual scrollToBottom here if MessageStream does it.
        // But let's keep it for safety if we have messagesEndRef.
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // We can rely on MessageStream's scroll logic mostly now.

    useEffect(() => {
        if (isThinking) setBotState('thinking');
        else if (messages.length > 0) setBotState('idle');
    }, [isThinking, messages]);

    const handleSDUIAction = (action: SDUIAction) => {
        switch (action.type) {
            case 'navigate':
            case 'link':
                if (action.endpoint) window.open(action.endpoint, '_blank');
                break;
            case 'send_message':
                if (action.payload) {
                    setInputValue(action.payload);
                    setTimeout(() => handleSend(), 0);
                }
                break;
            case 'submit_form':
                sendMessage(`[SYSTEM: Form Submitted] ${JSON.stringify(action.payload)}`, undefined, { hidden: true });
                break;
            default:
                console.warn("Unknown Action Type:", action.type);
        }
    };

    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    const closeChat = () => { setBotState('sad'); setTimeout(() => window.parent.postMessage('CLUAIZ_CLOSE', '*'), 500); };

    return (
        <div
            className={`flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden cluaiz-widget-root ${hideHeader
                ? ''
                : 'shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800'
                }`}
            style={{ fontFamily: fontFamily, fontSize: `${fontSize}px` }}
        >
            {!hideHeader && (
                <ChatHeader
                    isAssistantMode={false}
                    userName="Guest"
                    isConnected={isConnected}
                    isSearchActive={isSearchActive}
                    setIsSearchActive={setIsSearchActive}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filterType={filterType}
                    setFilterType={setFilterType}
                    isFilterOpen={isFilterOpen}
                    setIsFilterOpen={setIsFilterOpen}
                    viewMode="widget"
                    callStatus={callStatus}
                    callerNumber={callerNumber}
                    orgId={orgId || ''}
                    startCall={startCall}
                    incomingCall={incomingCall}
                    mode={mode}
                    onToggleMode={toggleMode}
                    onClose={isEmbed ? closeChat : undefined}
                    businessName="Cluaiz AI"
                    agentName="Aryan"
                />
            )}

            <div className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-slate-900/50">
                <MessageStream
                    key="stream"
                    messages={messages as any}
                    isThinking={isThinking}
                    thinkingMessage={thinkingMessage}
                    thinkingSteps={thinkingSteps}
                    thinkingElapsedMs={thinkingElapsedMs}
                    theme={isDarkMode ? 'dark' : 'light'}
                    orgId={orgId || ''}
                    viewMode="widget"
                    mode={mode}
                    isTyping={isTyping}
                    onSDUIAction={handleSDUIAction}
                    deleteMessage={deleteMessage}
                    toggleReaction={toggleReaction}
                    searchQuery={searchQuery} // 🔍 NEW
                    // History Loading
                    onLoadMore={loadMoreHistory}
                    hasMore={hasMoreHistory}
                    isLoadingHistory={isLoadingHistory}
                    // 📅 Date Navigation
                    availableDates={availableDates}
                    onJumpToDate={(date) => jumpToDate(date)}
                    onReply={(messageId, content) => {
                        const msg = messages.find(m => m.id === messageId);
                        setReplyingTo({
                            id: messageId,
                            sender: msg?.senderName || msg?.sender || 'Unknown',
                            content: content
                        });
                        textareaRef.current?.focus();
                    }}
                    activeWordIndex={logic.activeWordIndex} // 🎙️
                    isVoiceSpeaking={logic.isSpeaking} // 🎙️
                    voiceBotReply={logic.voiceBotReply} // 🎙️
                />
            </div >

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
                isAssistantMode={false} // Widget is user mode usually
                isWidget={true}
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
                isInputGridOpen={isInputGridOpen}
                setIsInputGridOpen={setIsInputGridOpen}
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
                disabled={false} // Widget users can always type to AI
            />

        </div >
    );
};


