"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ThinkingStep {
    id: string;
    message: string;
    status: "live" | "done";
    data?: Record<string, unknown>;
}

interface ThinkingPanelProps {
    steps: ThinkingStep[];
    isActive: boolean;       // SSE stream is still ongoing
    elapsedMs?: number;      // Timer in ms (passed from parent)
    className?: string;
}

// ─── Utility: Animated "Thinking. / Thinking.. / Thinking..." dot loop ────────
function AnimatedDots() {
    const [dots, setDots] = useState(1);
    useEffect(() => {
        const id = setInterval(() => setDots((d) => (d >= 3 ? 1 : d + 1)), 500);
        return () => clearInterval(id);
    }, []);
    return (
        <span className="inline-flex items-end h-[1em] leading-none">
            {Array.from({ length: 3 }).map((_, i) => (
                <motion.span
                    key={i}
                    animate={{ opacity: i < dots ? 1 : 0.15 }}
                    transition={{ duration: 0.15 }}
                    className="select-none"
                >
                    .
                </motion.span>
            ))}
        </span>
    );
}

// ─── Animated Sparkle Icon (CSS + SVG — no extra library needed) ──────────────
function SparkleIcon({ active }: { active: boolean }) {
    return (
        <motion.div
            animate={active ? { rotate: [0, 15, -15, 0], scale: [1, 1.2, 0.9, 1] } : { rotate: 0, scale: 1 }}
            transition={active ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : {}}
            className="flex items-center justify-center w-5 h-5 text-blue-400"
        >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 drop-shadow-[0_0_6px_rgba(96,165,250,0.8)]">
                <path d="M12 2 L13.5 9.5 L21 11 L13.5 12.5 L12 20 L10.5 12.5 L3 11 L10.5 9.5 Z" />
                <path d="M18 1 L18.7 4.3 L22 5 L18.7 5.7 L18 9 L17.3 5.7 L14 5 L17.3 4.3 Z" opacity="0.6" />
                <path d="M5 16 L5.5 18.5 L8 19 L5.5 19.5 L5 22 L4.5 19.5 L2 19 L4.5 18.5 Z" opacity="0.4" />
            </svg>
        </motion.div>
    );
}

// ─── Single Step Row ──────────────────────────────────────────────────────────
function StepRow({ step, index }: { step: ThinkingStep; index: number }) {
    return (
        <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -10, y: 4 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            className="flex items-start gap-2.5 py-1"
        >
            {/* Status indicator */}
            <div className="flex items-center justify-center w-4 h-4 mt-0.5 shrink-0">
                {step.status === "done" ? (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12, stiffness: 300 }}
                    >
                        <Check size={13} className="text-emerald-400" strokeWidth={2.5} />
                    </motion.div>
                ) : (
                    /* Pulsing live dot */
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                    </span>
                )}
            </div>

            {/* Step text */}
            <span
                className={cn(
                    "text-[12px] leading-relaxed",
                    step.status === "done"
                        ? "text-zinc-400"
                        : "text-zinc-200 font-medium"
                )}
            >
                {step.message}
            </span>
        </motion.div>
    );
}

// ─── Main ThinkingPanel ───────────────────────────────────────────────────────
export function ThinkingPanel({ steps, isActive, elapsedMs = 0, className }: ThinkingPanelProps) {
    const [expanded, setExpanded] = useState(true);
    const elapsedSec = (elapsedMs / 1000).toFixed(1);

    // Auto-collapse when done
    useEffect(() => {
        if (!isActive && steps.length > 0) {
            const t = setTimeout(() => setExpanded(false), 2000);
            return () => clearTimeout(t);
        }
    }, [isActive, steps.length]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "rounded-2xl    overflow-hidden",
                className
            )}
        >
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <button
                onClick={() => setExpanded((p) => !p)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors group"
            >
                <SparkleIcon active={isActive} />

                <span className="flex-1 text-left text-[13px] font-semibold text-zinc-200 tracking-tight">
                    {isActive ? (
                        <>
                            Thinking<AnimatedDots />
                        </>
                    ) : (
                        <span className="text-zinc-400">
                            Thought for {elapsedSec}s
                        </span>
                    )}
                </span>

                <motion.div
                    animate={{ rotate: expanded ? 0 : 180 }}
                    transition={{ duration: 0.2 }}
                    className="text-zinc-500 group-hover:text-zinc-300 transition-colors"
                >
                    <ChevronUp size={14} />
                </motion.div>
            </button>

            {/* ── Expandable Steps List ───────────────────────────────────────── */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                    >
                        <div className="px-3 pb-3 pt-0.5   border-white/5">
                            {/* Thin left accent line */}
                            <div className="ml-2 pl-2 border-l border-white/10 space-y-0.5">
                                {steps.map((step, i) => (
                                    <StepRow key={step.id} step={step} index={i} />
                                ))}

                                {/* Empty state while waiting for first event */}
                                {steps.length === 0 && isActive && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-2 py-1 text-zinc-500 text-[11px]"
                                    >
                                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-40" />
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-zinc-500" />
                                        </span>
                                        Initializing...
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
