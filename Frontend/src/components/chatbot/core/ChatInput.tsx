import React, { RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Maximize2,
    Minimize2,
    Smile,
    Send,
    Mic,
    StopCircle
} from 'lucide-react';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { InputGrid, GridOptionType } from '../utils/InputGrid';
import { FilePreview } from '../utils/FilePreview';
import { PollBuilder, PollData } from '../builders/PollBuilder';
import { ProductPicker } from '../pickers/ProductPicker';
import { SlotPicker } from '../pickers/SlotPicker';
import { QuickReplyBuilder } from '../builders/QuickReplyBuilder';
import { OfferBuilder } from '../builders/OfferBuilder';
import { LocationPicker } from '../pickers/LocationPicker';
import { FormBuilder } from '../builders/FormBuilder';
import { NoteBuilder } from '../builders/NoteBuilder';
import { ReplyContextBar } from '../messaging/ReplyContextBar';
import { LinkPreview } from '../utils/LinkPreview';

const PlusIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

interface ChatInputProps {
    inputValue: string;
    setInputValue: (val: string | ((prev: string) => string)) => void;
    handleSend: () => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    handleInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    isMaximized: boolean;
    setIsMaximized: (max: boolean) => void;
    showMaximize: boolean;
    isAssistantMode: boolean;
    isWidget: boolean;
    isDarkMode: boolean;
    replyingTo: { id: string; sender: string; content: string } | null;
    setReplyingTo: (reply: { id: string; sender: string; content: string } | null) => void;
    linkPreviewData: any;
    setLinkPreviewData: (data: any) => void;
    isFetchingLink: boolean;
    selectedFile: File | null;
    setSelectedFile: (file: File | null) => void;
    filePreviewUrl: string | null;
    setFilePreviewUrl: (url: string | null) => void;
    sendFileToAI: boolean;
    setSendFileToAI: (send: boolean) => void;
    isInputGridOpen: boolean;
    setIsInputGridOpen: (open: boolean) => void;
    handleGridSelect: (type: GridOptionType) => void;
    isPollBuilderOpen: boolean;
    setIsPollBuilderOpen: (open: boolean) => void;
    handlePollSend: (data: PollData) => void;
    isProductPickerOpen: boolean;
    setIsProductPickerOpen: (open: boolean) => void;
    handleProductSend: (product: any) => void;
    isSlotPickerOpen: boolean;
    setIsSlotPickerOpen: (open: boolean) => void;
    handleSlotSelect: (slot: any) => void;
    isQuickReplyOpen: boolean;
    setIsQuickReplyOpen: (open: boolean) => void;
    handleQuickReplySend: (data: any) => void;
    isOfferOpen: boolean;
    setIsOfferOpen: (open: boolean) => void;
    handleOfferSend: (data: any) => void;
    isLocationOpen: boolean;
    setIsLocationOpen: (open: boolean) => void;
    handleLocationSend: (data: any) => void;
    isFormOpen: boolean;
    setIsFormOpen: (open: boolean) => void;
    handleFormSend: (data: any) => void;
    isNoteBuilderOpen: boolean;
    setIsNoteBuilderOpen: (open: boolean) => void;
    handleNoteSend: (note: string) => void;
    plusButtonRef: RefObject<HTMLButtonElement | null>;
    disabled?: boolean;
}



export const ChatInput: React.FC<ChatInputProps> = ({
    inputValue,
    setInputValue,
    handleSend,
    handleKeyDown,
    handleInput,
    textareaRef,
    isMaximized,
    setIsMaximized,
    showMaximize,
    isAssistantMode,
    isWidget,
    isDarkMode,
    replyingTo,
    setReplyingTo,
    linkPreviewData,
    setLinkPreviewData,
    isFetchingLink,
    selectedFile,
    setSelectedFile,
    filePreviewUrl,
    setFilePreviewUrl,
    sendFileToAI,
    setSendFileToAI,
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
    plusButtonRef,
    disabled = false
}) => {
    React.useEffect(() => {
        if (!inputValue) {
            window.parent.postMessage({ type: 'CLUAIZ_READING', isReading: false }, '*');
            return;
        }
        window.parent.postMessage({ type: 'CLUAIZ_READING', isReading: true }, '*');
        const timeout = setTimeout(() => {
            window.parent.postMessage({ type: 'CLUAIZ_READING', isReading: false }, '*');
        }, 2000); // 2 seconds after last character typed

        return () => clearTimeout(timeout);
    }, [inputValue]);

    return (
        <div className={cn("bg-white dark:bg-[#121212] bg-transparent p-2 z-50 transition-colors duration-300", disabled && "opacity-60 pointer-events-none grayscale")}>
            {/* ↩️ Reply Context Bar */}

            <AnimatePresence>
                {replyingTo && (
                    <div className="mb-2">
                        <ReplyContextBar
                            replyingTo={replyingTo}
                            onCancel={() => setReplyingTo(null)}
                            className="bg-[#f2f2f7] dark:bg-[#1c242c] border-l-4 border-emerald-500 rounded-lg p-3 transition-colors"
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* 🔗 Link Preview */}
            <AnimatePresence>
                {(linkPreviewData || isFetchingLink) && (
                    <div className="mb-2">
                        <LinkPreview
                            {...linkPreviewData}
                            isLoading={isFetchingLink}
                            onRemove={() => setLinkPreviewData(null)}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* 📎 File Preview */}
            <AnimatePresence>
                {selectedFile && (
                    <FilePreview
                        file={selectedFile}
                        previewUrl={filePreviewUrl || ""}
                        sendToAI={sendFileToAI}
                        onToggleAI={() => setSendFileToAI(!sendFileToAI)}
                        onRemove={() => {
                            setSelectedFile(null);
                            setFilePreviewUrl(null);
                        }}
                    />
                )}
            </AnimatePresence>

            <div className="flex items-end gap-3 w-full p-2 rounded-2xl focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all">

                {/* 🔥 INPUT GRID (Command Center) */}
                <InputGrid
                    isOpen={isInputGridOpen}
                    onClose={() => setIsInputGridOpen(false)}
                    onSelect={handleGridSelect}
                    triggerRef={plusButtonRef}
                />

                {/* 📊 POLL BUILDER */}
                <PollBuilder
                    isOpen={isPollBuilderOpen}
                    onClose={() => setIsPollBuilderOpen(false)}
                    onSend={handlePollSend}
                />

                {/* 📦 PRODUCT PICKER */}
                <ProductPicker
                    isOpen={isProductPickerOpen}
                    onClose={() => setIsProductPickerOpen(false)}
                    onSelect={handleProductSend}
                />

                {/* 📅 SLOT PICKER */}
                <SlotPicker
                    isOpen={isSlotPickerOpen}
                    onClose={() => setIsSlotPickerOpen(false)}
                    onSelect={handleSlotSelect}
                />

                <QuickReplyBuilder
                    isOpen={isQuickReplyOpen}
                    onClose={() => setIsQuickReplyOpen(false)}
                    onSend={handleQuickReplySend}
                />

                <OfferBuilder
                    isOpen={isOfferOpen}
                    onClose={() => setIsOfferOpen(false)}
                    onSend={handleOfferSend}
                />

                <LocationPicker
                    isOpen={isLocationOpen}
                    onClose={() => setIsLocationOpen(false)}
                    onSend={handleLocationSend}
                />

                <FormBuilder
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSend={handleFormSend}
                />

                <NoteBuilder
                    isOpen={isNoteBuilderOpen}
                    onClose={() => setIsNoteBuilderOpen(false)}
                    onSend={handleNoteSend}
                />


                <div className={cn(
                    "flex gap-0.5 pb-0.5 transition-all duration-300",
                    showMaximize ? "flex-col" : "flex-row mb-1.5"
                )}>
                    <button
                        ref={plusButtonRef}
                        disabled={disabled}
                        onClick={() => setIsInputGridOpen(!isInputGridOpen)}
                        className={cn(
                            "p-1.5 transition-all duration-200 relative z-20 rounded-full",
                            isInputGridOpen ? "text-emerald-400 rotate-45 scale-110 bg-emerald-500/10" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5",
                            disabled && "cursor-not-allowed opacity-50"
                        )}
                    >
                        <PlusIcon size={isWidget ? 18 : 20} />
                    </button>

                    <Popover>
                        <PopoverTrigger asChild>
                            <button disabled={disabled} className={cn("p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all relative z-20", disabled && "cursor-not-allowed opacity-50")}>
                                <Smile size={isWidget ? 18 : 20} />
                            </button>
                        </PopoverTrigger>
                        {!disabled && (
                            <PopoverContent side="top" align="start" collisionPadding={20} className="w-auto p-0 border-none bg-transparent shadow-none z-[999999]">
                                <div className="rounded-[1rem] overflow-hidden shadow-2xl border border-black/5 dark:border-white/10">
                                    <EmojiPicker
                                        theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                                        emojiStyle={EmojiStyle.APPLE}
                                        onEmojiClick={(e) => setInputValue(prev => prev + e.emoji)}
                                        width={isWidget ? 280 : 300}
                                        height={350}
                                        searchDisabled={isWidget}
                                        skinTonesDisabled
                                        previewConfig={{ showPreview: false }}
                                    />
                                </div>
                            </PopoverContent>
                        )}
                    </Popover>
                </div>

                <div className="flex-1 relative min-w-0">
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        placeholder={disabled ? "AI is active. Switch to Human mode to reply." : (isAssistantMode ? "Ask about your business..." : "Message user...")}
                        className={cn(
                            "w-full ml-1 bg-transparent border-none outline-none text-[#1d1d1f] dark:text-white py-2 resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-medium no-scrollbar transition-all duration-300 pr-10",
                            // 🌟 Responsive Font Size: 13px on mobile, 15px on desktop
                            "text-[0.9em] md:text-[0.95em]",
                            isMaximized ? "min-h-[250px] max-h-[500px]" : "min-h-[38px] max-h-[150px]",
                            disabled && "cursor-not-allowed text-zinc-500"
                        )}
                        rows={1}
                        style={isMaximized ? { height: '250px' } : { minHeight: '38px' }}
                    />
                    <AnimatePresence>
                        {showMaximize && !selectedFile && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                type="button"
                                onClick={() => {
                                    const next = !isMaximized;
                                    setIsMaximized(next);
                                    if (textareaRef.current) {
                                        if (next) {
                                            textareaRef.current.style.height = '250px';
                                        } else {
                                            textareaRef.current.style.height = '38px'; // Default to 1 line immediately
                                            setTimeout(() => {
                                                if (textareaRef.current) {
                                                    textareaRef.current.style.height = 'auto';
                                                    const sh = textareaRef.current.scrollHeight;
                                                    textareaRef.current.style.height = `${Math.max(38, Math.min(sh, 120))}px`;
                                                }
                                            }, 0);
                                        }
                                    }
                                }}
                                className={cn(
                                    "absolute top-1 -right-12 w-7 h-7 flex items-center justify-center rounded-lg transition-all z-30 shadow-2xl",
                                    !isMaximized ? "text-emerald-500 bg-emerald-500/20 border border-emerald-500/30" : "text-zinc-500 hover:text-white bg-zinc-900/40 hover:bg-zinc-800 border border-white/5"
                                )}
                                title={isMaximized ? "Minimize" : "Maximize Input"}
                            >
                                {!isMaximized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex flex-col items-center self-end mb-1">
                    <div className="flex items-center gap-1">
                        <AnimatePresence mode="wait">
                            {!inputValue.trim() && !selectedFile ? (
                                <motion.button
                                    key="mic-button"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => (window as any).toggleVoiceMode?.()}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={cn(
                                        "w-[40px] h-[40px] flex items-center justify-center transition-all rounded-full overflow-hidden",
                                        (window as any).isVoiceMode ? "bg-emerald-500/10 border border-emerald-500/20" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                    )}
                                    title="Voice Mode"
                                >
                                    {(window as any).isVoiceMode ? (
                                        <StopCircle size={22} className="text-red-500 animate-pulse" />
                                    ) : (
                                        <Mic size={22} />
                                    )}
                                </motion.button>
                            ) : (
                                <motion.button
                                    key="send-button"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={handleSend}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-[40px] h-[40px] flex items-center justify-center text-emerald-500 transition-all bg-transparent"
                                >
                                    <Send size={22} />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};
