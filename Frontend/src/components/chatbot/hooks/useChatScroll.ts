"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types';

interface UseChatScrollProps {
    messages: ChatMessage[];
    onLoadMore?: () => void;
    hasMore?: boolean;
}

export const useChatScroll = ({ messages, onLoadMore, hasMore }: UseChatScrollProps) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const prevMsgLengthRef = useRef(messages.length);
    const prevScrollHeightRef = useRef(0); // To restore scroll position
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const [unreadCount, setUnreadCount] = useState(0);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [allowInteraction, setAllowInteraction] = useState(false);

    const scrollToBottom = useCallback((instant = false) => {
        if (!viewportRef.current) return;

        const viewport = viewportRef.current;
        const targetScroll = viewport.scrollHeight - viewport.clientHeight;

        viewport.scrollTo({
            top: targetScroll,
            behavior: instant ? 'auto' : 'smooth'
        });
    }, []);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // Check if user is within 100px of bottom
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        const isCloseToBottom = distanceFromBottom < 100;

        // 🚀 INFINITE SCROLL TRIGGER
        if (scrollTop === 0 && hasMore && onLoadMore) {
            console.log("🔼 Scrolled to Top - Loading More...");
            prevScrollHeightRef.current = scrollHeight;
            onLoadMore();
        }

        setIsAtBottom(isCloseToBottom);
        setShowScrollButton(distanceFromBottom > 300); // Only show if significantly away

        if (isCloseToBottom) {
            setUnreadCount(0);
        }
    }, [hasMore, onLoadMore]);

    // Interaction Detection
    useEffect(() => {
        const enableInteraction = () => {
            setAllowInteraction(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                setAllowInteraction(false);
            }, 30000);
        };

        window.addEventListener('wheel', enableInteraction);
        window.addEventListener('keydown', enableInteraction);
        window.addEventListener('keyup', enableInteraction);

        return () => {
            window.removeEventListener('wheel', enableInteraction);
            window.removeEventListener('keyup', enableInteraction);
            window.removeEventListener('keydown', enableInteraction);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    // Track chat switch
    const currentChatIdRef = useRef<string | null>(null);

    // Initial Scroll
    useEffect(() => {
        const timer = setTimeout(() => {
            scrollToBottom(true);
        }, 100);
        return () => clearTimeout(timer);
    }, [scrollToBottom]);

    // Handle New Messages & Chat Switching
    useEffect(() => {
        if (messages.length === 0) return;

        const firstMsg = messages[0];
        const lastMsg = messages[messages.length - 1];
        const chatId = firstMsg?.chatId || lastMsg?.chatId;

        const isChatSwitch = chatId && currentChatIdRef.current !== chatId;

        if (isChatSwitch) {
            currentChatIdRef.current = chatId || null;
            prevMsgLengthRef.current = messages.length;
            prevScrollHeightRef.current = 0;

            scrollToBottom(true);
            setUnreadCount(0);
            setIsAtBottom(true);
            return;
        }

        const isNewMessage = messages.length > prevMsgLengthRef.current;
        const msgDiff = messages.length - prevMsgLengthRef.current;
        prevMsgLengthRef.current = messages.length;

        if (!isNewMessage) return;

        if (isAtBottom) {
            // Force scroll to bottom twice to ensure layout settling
            scrollToBottom();
            setTimeout(() => scrollToBottom(), 100);
            setUnreadCount(0);
        } else if (msgDiff > 1 && viewportRef.current && prevScrollHeightRef.current > 0) {
            const newScrollHeight = viewportRef.current.scrollHeight;
            const diff = newScrollHeight - prevScrollHeightRef.current;
            viewportRef.current.scrollTop = diff;
            prevScrollHeightRef.current = 0;
        } else {
            setUnreadCount(prev => prev + 1);
        }
    }, [messages, isAtBottom, scrollToBottom]);

    // 🏗️ STICKY BOTTOM OBSERVER: Watch for size changes
    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const resizeObserver = new ResizeObserver(() => {
            if (isAtBottom) {
                // Sync with browser paint cycle for buttery smooth scrolling
                requestAnimationFrame(() => {
                    scrollToBottom(true);
                });
            }
        });

        resizeObserver.observe(viewport);
        // Also observe the inner container if needed, but viewport should pick up scrollHeight changes

        return () => resizeObserver.disconnect();
    }, [isAtBottom, scrollToBottom]);

    const scrollToMessage = useCallback((messageId: string) => {
        if (!messageId) return;

        // 🕵️‍♀️ MULTI-STRATEGY LOOKUP: Handle chaotic ID prefixes
        // 1. Try standard pattern (msg-ID)
        // 2. Try raw ID (in case global ID is passed)
        // 3. Try normalizing prefix (avoid double msg-msg-)
        let element = document.getElementById(`msg-${messageId}`) ||
            document.getElementById(messageId) ||
            document.getElementById(`msg-${messageId.replace(/^msg[-_]/, '')}`);

        let targetId = messageId;
        console.log(`📜 Scrolling to message: ${messageId}`, element ? 'FOUND' : 'NOT FOUND');

        // Only matches if we find the EXACT message in the list.
        if (!element && messages?.length > 0) {
            const foundMsg = messages.find(m =>
                m.id === messageId ||
                m._id === messageId ||
                m.originalId === messageId
            );

            if (foundMsg) {
                console.log(`✅ Smart Match: ${messageId} -> ${foundMsg.id}`);
                targetId = foundMsg.id;
                element = document.getElementById(`msg-${foundMsg.id}`);
            }
        }

        console.log(`📜 Scrolling to message: ${targetId}`, element ? 'FOUND' : 'NOT FOUND');

        if (element && viewportRef.current) {
            // 🧮 Manual Math for Precision (Bypassing scrollIntoView quirks)
            const container = viewportRef.current;
            const elementRect = element.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // Calculate relative position
            const relativeTop = elementRect.top - containerRect.top;
            const currentScroll = container.scrollTop;
            const targetScroll = currentScroll + relativeTop - (container.clientHeight / 2) + (elementRect.height / 2);

            container.scrollTo({
                top: targetScroll,
                behavior: 'smooth'
            });

            element.classList.add('transition-all', 'duration-500', 'ease-out');

            setTimeout(() => {
                element.classList.add('scale-105', 'z-20', 'brightness-125', 'saturate-150', 'shadow-[0_0_50px_rgba(0,0,0,0.3)]', 'dark:shadow-[0_0_50px_rgba(255,255,255,0.1)]');
            }, 100);

            setTimeout(() => {
                element.classList.remove('scale-105', 'z-20', 'brightness-125', 'saturate-150', 'shadow-[0_0_50px_rgba(0,0,0,0.3)]', 'dark:shadow-[0_0_50px_rgba(255,255,255,0.1)]');
            }, 2500);
        } else {
            console.warn("Element not found in DOM:", `msg-${messageId}`);
        }
    }, [viewportRef]);

    return {
        viewportRef,
        bottomRef,
        unreadCount,
        isAtBottom,
        showScrollButton,
        allowInteraction,
        handleScroll,
        scrollToBottom,
        scrollToMessage
    };
};
