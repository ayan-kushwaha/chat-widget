"use client";

import { useEffect } from "react";
import { useNavigationStore } from "@/store/navigationStore";

/**
 * Global keyboard listener for Ctrl+B / Mod+B to toggle sidebar
 * Add this to root layout
 */
export function KeyboardShortcuts() {
    const { toggleSecondarySidebar } = useNavigationStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+B / Mod+B to toggle sidebar
            if ((e.metaKey || e.ctrlKey) && e.key === "b") {
                e.preventDefault();
                toggleSecondarySidebar();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSecondarySidebar]);

    return null;
}
