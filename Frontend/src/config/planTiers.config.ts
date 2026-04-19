

// PLAN_TIERS removed - Now fetched from API (Single Source of Truth)
// Frontend only maintains UI Themes below.

// --- UI THEMES (Unified Config) ---

export interface PlanTheme {
    name: string;
    bg: string;
    border: string;
    glowColor: string;
    primary: string;
    button: string;
    badge: string;
    separator: string;
    nameColor: string;
    priceColor: string;
    // New Single Source of Truth Props
    hex: string;         // Primary Color Hex (e.g. text-400)
    secondaryHex: string // Secondary Color Hex (e.g. text-600)
    colorName: string;   // Tailwind color name (e.g. 'zinc')
}

export const FREE_THEME: PlanTheme = {
    name: "Free",
    bg: "bg-slate-950",
    border: "border-slate-800",
    glowColor: "rgba(255, 255, 255, 0.5)",
    primary: "text-slate-400",
    button: "bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white",
    badge: "bg-slate-800 text-slate-400 border-slate-700",
    separator: "border-slate-800 text-slate-600",
    nameColor: "text-slate-300",
    priceColor: "text-slate-200",
    hex: "#94a3b8", // slate-400
    secondaryHex: "#475569", // slate-600
    colorName: "slate"
};

export const PAID_THEMES: PlanTheme[] = [
    { // 1. Starter (Zinc - Metallic)
        name: "Silver",
        bg: "bg-slate-950",
        border: "border-zinc-400/50",
        glowColor: "rgba(228, 228, 231, 1)",
        primary: "text-zinc-200",
        button: "bg-zinc-100/10 border border-zinc-400/50 text-zinc-100 hover:bg-zinc-100/20 hover:border-zinc-300 hover:text-white shadow-[0_0_15px_rgba(228,228,231,0.15)]",
        badge: "bg-zinc-100/10 text-zinc-200 border-zinc-400/30 shadow-[0_0_10px_rgba(228,228,231,0.2)]",
        separator: "border-zinc-800 text-zinc-500",
        nameColor: "text-zinc-100",
        priceColor: "text-white",
        hex: "#e4e4e7", // zinc-200
        secondaryHex: "#a1a1aa", // zinc-400
        colorName: "zinc"
    },
    { // 2. Basic (Lime - High Visibility)
        name: "Lime",
        bg: "bg-slate-950",
        border: "border-lime-500/50",
        glowColor: "rgba(132, 204, 22, 1)",
        primary: "text-lime-400",
        button: "bg-lime-950/30 border border-lime-500/50 text-lime-400 hover:bg-lime-900/50 hover:border-lime-400 hover:text-lime-300 shadow-[0_0_15px_rgba(132,204,22,0.1)]",
        badge: "bg-lime-500/10 text-lime-400 border-lime-500/30 shadow-[0_0_10px_rgba(132,204,22,0.2)]",
        separator: "border-lime-900 text-lime-600",
        nameColor: "text-lime-400",
        priceColor: "text-white",
        hex: "#a3e635", // lime-400
        secondaryHex: "#65a30d", // lime-600
        colorName: "lime"
    },
    { // 3. Standard (Teal)
        name: "Teal",
        bg: "bg-slate-950",
        border: "border-teal-500/50",
        glowColor: "rgba(20, 184, 166, 1)",
        primary: "text-teal-400",
        button: "bg-teal-950/30 border border-teal-500/50 text-teal-400 hover:bg-teal-900/50 hover:border-teal-400 hover:text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.1)]",
        badge: "bg-teal-500/10 text-teal-400 border-teal-500/30 shadow-[0_0_10px_rgba(20,184,166,0.2)]",
        separator: "border-teal-900 text-teal-600",
        nameColor: "text-teal-400",
        priceColor: "text-white",
        hex: "#2dd4bf", // teal-400
        secondaryHex: "#0d9488", // teal-600
        colorName: "teal"
    },
    { // 4. Pro (Sky)
        name: "Sky",
        bg: "bg-slate-950",
        border: "border-sky-500/50",
        glowColor: "rgba(14, 165, 233, 1)",
        primary: "text-sky-400",
        button: "bg-sky-950/30 border border-sky-500/50 text-sky-400 hover:bg-sky-900/50 hover:border-sky-400 hover:text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.1)]",
        badge: "bg-sky-500/10 text-sky-400 border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.2)]",
        separator: "border-sky-900 text-sky-600",
        nameColor: "text-sky-400",
        priceColor: "text-white",
        hex: "#38bdf8", // sky-400
        secondaryHex: "#0284c7", // sky-600
        colorName: "sky"
    },
    { // 5. Advanced (Blue)
        name: "Blue",
        bg: "bg-slate-950",
        border: "border-blue-600/50",
        glowColor: "rgba(37, 99, 235, 1)",
        primary: "text-blue-400",
        button: "bg-blue-950/30 border border-blue-500/50 text-blue-400 hover:bg-blue-900/50 hover:border-blue-400 hover:text-blue-300 shadow-[0_0_15px_rgba(37,99,235,0.1)]",
        badge: "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(37,99,235,0.2)]",
        separator: "border-blue-900 text-blue-600",
        nameColor: "text-blue-400",
        priceColor: "text-white",
        hex: "#60a5fa", // blue-400
        secondaryHex: "#2563eb", // blue-600
        colorName: "blue"
    },
    { // 6. Business (Indigo)
        name: "Indigo",
        bg: "bg-slate-950",
        border: "border-indigo-500/50",
        glowColor: "rgba(99, 102, 241, 1)",
        primary: "text-indigo-400",
        button: "bg-indigo-950/30 border border-indigo-500 text-indigo-400 hover:bg-indigo-950 hover:border-indigo-400 hover:text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]",
        badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]",
        separator: "border-indigo-900 text-indigo-500",
        nameColor: "text-indigo-400",
        priceColor: "text-white",
        hex: "#818cf8", // indigo-400
        secondaryHex: "#4f46e5", // indigo-600
        colorName: "indigo"
    },
    { // 7. Premium (Violet)
        name: "Violet",
        bg: "bg-slate-950",
        border: "border-violet-500/50",
        glowColor: "rgba(139, 92, 246, 1)",
        primary: "text-violet-400",
        button: "bg-violet-950/30 border border-violet-500/50 text-violet-400 hover:bg-violet-900/50 hover:border-violet-400 hover:text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.1)]",
        badge: "bg-violet-500/10 text-violet-400 border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.2)]",
        separator: "border-violet-900 text-violet-600",
        nameColor: "text-violet-400",
        priceColor: "text-white",
        hex: "#a78bfa", // violet-400
        secondaryHex: "#7c3aed", // violet-600
        colorName: "violet"
    },
    { // 8. Enterprise (Red)
        name: "Red",
        bg: "bg-slate-950",
        border: "border-red-600/50",
        glowColor: "rgba(220, 38, 38, 1)",
        primary: "text-red-500",
        button: "bg-red-950/30 border border-red-500/50 text-red-500 hover:bg-red-900/50 hover:border-red-400 hover:text-red-400 shadow-[0_0_15px_rgba(220,38,38,0.1)]",
        badge: "bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(220,38,38,0.2)]",
        separator: "border-red-900 text-red-600",
        nameColor: "text-red-500",
        priceColor: "text-white",
        hex: "#ef4444", // red-500
        secondaryHex: "#dc2626", // red-600
        colorName: "red"
    },
    { // 9. Ultimate (Gold/Amber)
        name: "Gold",
        bg: "bg-slate-950",
        border: "border-amber-400/50",
        glowColor: "rgba(251, 191, 36, 1)",
        primary: "text-amber-400",
        button: "bg-amber-950/30 border border-amber-400 text-amber-400 hover:bg-amber-950 hover:border-amber-300 hover:text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.25)]",
        badge: "bg-amber-500/10 text-amber-400 border-amber-400/30 shadow-[0_0_10px_rgba(251,191,36,0.2)]",
        separator: "border-amber-900 text-amber-500",
        nameColor: "text-amber-300",
        priceColor: "text-white",
        hex: "#fbbf24", // amber-400
        secondaryHex: "#d97706", // amber-600
        colorName: "amber"
    }
];

export function getThemeByIndex(index: number, isFree: boolean): PlanTheme {
    if (isFree) return FREE_THEME;
    // index is 0-based index in the 'activePlans' array.
    // Assuming Free is index 0. Paid starts at 1.
    // (1-1)%5 = 0 -> Emerald
    // (2-1)%5 = 1 -> Blue
    // If Free is not in list, logic might need adjustment, but usually Free is first.
    // Safe check:
    const adjustedIndex = Math.max(0, index - 1);
    return PAID_THEMES[adjustedIndex % PAID_THEMES.length];
}
