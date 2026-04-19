"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const themes = [
        { name: "light", icon: Sun, label: "Light" },
        { name: "dark", icon: Moon, label: "Dark" },
        { name: "system", icon: Monitor, label: "System" },
    ];

    const currentTheme = themes.find((t) => t.name === theme) || themes[2];
    const CurrentIcon = currentTheme.icon;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 shadow-lg transition-all hover:bg-neutral-100 dark:border-white/10 dark:bg-black/40 dark:text-white dark:backdrop-blur-xl dark:hover:bg-white/10"
                aria-label="Toggle theme"
            >
                <CurrentIcon className="h-6 w-6" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full right-0 mb-2 w-36 overflow-hidden rounded-xl border border-white/10 bg-neutral-900/90 p-1 shadow-xl backdrop-blur-xl"
                    >
                        {themes.map((t) => {
                            const Icon = t.icon;
                            const isActive = theme === t.name;

                            return (
                                <button
                                    key={t.name}
                                    onClick={() => {
                                        setTheme(t.name);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                                        isActive
                                            ? "bg-white/10 text-white"
                                            : "text-neutral-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" />
                                        <span>{t.label}</span>
                                    </div>
                                    {isActive && <Check className="h-3 w-3" />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Backdrop to close on click outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
