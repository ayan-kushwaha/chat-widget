"use client";

import { useEffect, useCallback, useRef } from "react";

/**
 * 🎯 SKILL 13: useUITeleporter
 * ============================
 * Frontend "Hands" of the UI Teleporter system.
 * Listens for ui_action in incoming bot messages and executes:
 *   - navigate  → SPA pushState or hard reload
 *   - click     → 3-step DOM targeting (aria-label → id → text fuzzy)
 *   - search_site → /search?q=...
 *   - scan_page → triggers live DOM context scan
 */

export type UIAction =
    | { action: "navigate"; data: { path: string; method?: "spa_push" | "hard_reload" } }
    | { action: "click"; data: { targetType: "aria-label" | "id" | "text"; targetValue: string; waitToBeClickable?: boolean } }
    | { action: "search_site"; data: { searchQuery: string } }
    | { action: "scan_page"; data: { reason: string } };

interface UseUITeleporterOptions {
    /** Delay before executing action (ms). Human-like feel. Default: 600 */
    executionDelay?: number;
    /** Custom search URL pattern. Default: /search?q={query} */
    searchUrlPattern?: string;
    /** Called when a page scan is triggered */
    onScanPage?: () => Record<string, any>;
    /** Called with live context after scan */
    onScanComplete?: (context: Record<string, any>) => void;
}

export function useUITeleporter(options: UseUITeleporterOptions = {}) {
    const {
        executionDelay = 600,
        searchUrlPattern = "/search?q={query}",
        onScanPage,
        onScanComplete,
    } = options;

    const pendingAction = useRef<UIAction | null>(null);

    /**
     * Get live screen context from current DOM.
     * Called when user sends a message — attached to outgoing payload.
     */
    const getLiveScreenContext = useCallback((): Record<string, any> => {
        if (typeof window === "undefined" || typeof document === "undefined") {
            return {};
        }

        try {
            // Visible interactive elements (buttons, links with aria-labels)
            const interactiveEls = Array.from(
                document.querySelectorAll<HTMLElement>(
                    "button, a[href], [role='button'], [aria-label]"
                )
            );

            const visibleButtons: string[] = [];
            const BLOCKED_TEXT = [".", ",", "×", "✕", "—"];

            for (const el of interactiveEls) {
                // Skip hidden elements
                const style = window.getComputedStyle(el);
                if (style.display === "none" || style.visibility === "hidden") continue;

                // Aria-label is priority
                const aria = el.getAttribute("aria-label")?.trim();
                const text = el.textContent?.trim().slice(0, 50);
                const label = aria || text;

                if (label && !BLOCKED_TEXT.includes(label) && label.length > 1) {
                    visibleButtons.push(label);
                }

                if (visibleButtons.length >= 20) break;
            }

            // Page heading
            const h1 = document.querySelector("h1")?.textContent?.trim() || "";

            return {
                current_url: window.location.pathname,
                page_title: document.title,
                h1: h1.slice(0, 80),
                visible_buttons: visibleButtons,
            };
        } catch (e) {
            return { current_url: window.location.pathname };
        }
    }, []);

    /**
     * Execute a UI action received from the AI.
     */
    const executeAction = useCallback(
        (uiAction: UIAction) => {
            if (!uiAction?.action) return;

            console.log(`🎯 [UITeleporter] Executing: ${uiAction.action}`, uiAction.data);

            setTimeout(() => {
                try {
                    switch (uiAction.action) {
                        // ── Navigate ────────────────────────────────────────────────────────
                        case "navigate": {
                            const { path, method = "spa_push" } = uiAction.data;

                            if (method === "spa_push") {
                                // SPA: React / Next.js — no full reload
                                window.history.pushState({}, "", path);
                                // Trigger React Router / Next.js to update view
                                window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
                                console.log(`🧭 [UITeleporter] SPA navigate → ${path}`);
                            } else {
                                // MPA: WordPress / PHP / classic sites
                                window.location.href = path;
                            }
                            break;
                        }

                        // ── Click ───────────────────────────────────────────────────────────
                        case "click": {
                            const { targetType, targetValue, waitToBeClickable = true } = uiAction.data;
                            const doClick = () => {
                                let element: HTMLElement | null = null;

                                // Step 1: aria-label (most semantic — best)
                                if (targetType === "aria-label") {
                                    element = document.querySelector<HTMLElement>(
                                        `[aria-label="${targetValue}"]`
                                    );
                                }
                                // Step 2: id
                                else if (targetType === "id") {
                                    element = document.getElementById(targetValue);
                                }
                                // Step 3: fuzzy text match (fallback)
                                else if (targetType === "text") {
                                    const candidates =
                                        document.querySelectorAll<HTMLElement>("button, a, [role='button']");
                                    for (const el of candidates) {
                                        if (
                                            el.textContent
                                                ?.trim()
                                                .toLowerCase()
                                                .includes(targetValue.toLowerCase())
                                        ) {
                                            element = el;
                                            break;
                                        }
                                    }
                                }

                                if (element) {
                                    // Check if element is visible
                                    const style = window.getComputedStyle(element);
                                    if (style.display === "none" || style.visibility === "hidden") {
                                        console.warn(
                                            `⚠️ [UITeleporter] Element found but hidden: ${targetValue}`
                                        );
                                        return;
                                    }

                                    // Visual feedback — blue glow
                                    const prevOutline = element.style.outline;
                                    const prevTransition = element.style.transition;
                                    element.style.transition = "outline 0.15s ease";
                                    element.style.outline = "2px solid #5C67F2";

                                    setTimeout(() => {
                                        element!.click();
                                        // Remove glow after click
                                        setTimeout(() => {
                                            if (element) {
                                                element.style.outline = prevOutline;
                                                element.style.transition = prevTransition;
                                            }
                                        }, 500);
                                    }, 300);

                                    console.log(`🖱️ [UITeleporter] Clicked: ${targetValue} (${targetType})`);
                                } else {
                                    // Retry once after 1.5s (for lazy-loaded components)
                                    if (waitToBeClickable) {
                                        console.warn(
                                            `⏳ [UITeleporter] Element not found. Retrying in 1.5s: ${targetValue}`
                                        );
                                        setTimeout(doClick, 1500);
                                    } else {
                                        console.warn(
                                            `❌ [UITeleporter] Element not found: ${targetValue} (${targetType})`
                                        );
                                    }
                                }
                            };

                            doClick();
                            break;
                        }

                        // ── Search Site ─────────────────────────────────────────────────────
                        case "search_site": {
                            const { searchQuery } = uiAction.data;
                            const encodedQuery = encodeURIComponent(searchQuery);
                            const searchUrl = searchUrlPattern.replace("{query}", encodedQuery);

                            console.log(`🔍 [UITeleporter] Search → ${searchUrl}`);
                            window.location.href = searchUrl;
                            break;
                        }

                        // ── Scan Page (trigger live context scan) ───────────────────────────
                        case "scan_page": {
                            if (onScanPage) {
                                const context = onScanPage();
                                onScanComplete?.(context);
                            } else {
                                const context = getLiveScreenContext();
                                onScanComplete?.(context);
                            }
                            console.log(`📡 [UITeleporter] Scan complete`);
                            break;
                        }
                    }
                } catch (err) {
                    console.error(`❌ [UITeleporter] Action execution failed:`, err);
                }
            }, executionDelay);
        },
        [executionDelay, searchUrlPattern, onScanPage, onScanComplete, getLiveScreenContext]
    );

    /**
     * Process a bot message — if it contains a ui_action, execute it.
     * Call this whenever a new bot message arrives.
     */
    const processMessage = useCallback(
        (message: { ui_action?: UIAction | null; sender?: string }) => {
            if (message?.sender === "bot" && message?.ui_action) {
                executeAction(message.ui_action);
            }
        },
        [executeAction]
    );

    // Route change listener — re-scan DOM when SPA navigates
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handlePopState = () => {
            // Route changed — next message will send fresh screen context
            console.log(`🔄 [UITeleporter] Route changed → ${window.location.pathname}`);
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    return {
        /** Get current page DOM context to attach to outgoing messages */
        getLiveScreenContext,
        /** Directly execute a UIAction */
        executeAction,
        /** Process an incoming bot message (auto-extracts and executes ui_action) */
        processMessage,
    };
}
