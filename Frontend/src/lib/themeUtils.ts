
// ----------------------------------------------------------------------
// 🎨 Centralized Theme Utilities
// Single Source of Truth for UI Colors & Gradients
// ----------------------------------------------------------------------

type ColorTheme = string;

export const getThemeColorClasses = (color: string): string => {
    // Normalize input
    const key = color?.toLowerCase() || 'indigo';

    const colors: Record<string, string> = {
        amber: "text-amber-400 border-amber-500/20 bg-amber-500/10 from-amber-500/20 to-transparent",
        green: "text-green-400 border-green-500/20 bg-green-500/10 from-green-500/20 to-transparent",
        rose: "text-rose-400 border-rose-500/20 bg-rose-500/10 from-rose-500/20 to-transparent",
        purple: "text-purple-400 border-purple-500/20 bg-purple-500/10 from-purple-500/20 to-transparent",
        indigo: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10 from-indigo-500/20 to-transparent",
        pink: "text-pink-400 border-pink-500/20 bg-pink-500/10 from-pink-500/20 to-transparent",
        blue: "text-blue-400 border-blue-500/20 bg-blue-500/10 from-blue-500/20 to-transparent",
        cyan: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10 from-cyan-500/20 to-transparent",
        slate: "text-slate-400 border-slate-500/20 bg-slate-500/10 from-slate-500/20 to-transparent",
        red: "text-red-400 border-red-500/20 bg-red-500/10 from-red-500/20 to-transparent",
        orange: "text-orange-400 border-orange-500/20 bg-orange-500/10 from-orange-500/20 to-transparent",
        emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 from-emerald-500/20 to-transparent",
    };

    return colors[key] || colors.indigo;
};
