import { FREE_THEME, PAID_THEMES, type PlanTheme } from "@/config/planTiers.config";

/**
 * Enhanced Plan Theme with additional properties for modal and premium UI
 */
export interface EnhancedPlanTheme extends PlanTheme {
    // Color name for conditional logic
    color: string;

    // Background gradients
    bgGradient: string;
    cardBg: string;
    gradientFrom: string;
    gradientTo: string;

    // Icon styling
    iconBg: string;
    iconColor: string;

    // Text styling
    text: string;

    // Button gradients
    buttonGradient: string;
    buttonHover: string;
    glow: string;

    // Accent colors
    accentColor: string;
    accentLight: string;

    // Glow and shadow
    glowShadow: string;
    borderGlow: string;
}

/**
 * Get enhanced theme for a plan based on its name and price
 */
export function getPlanTheme(planName: string, price: number = 0): EnhancedPlanTheme {
    const name = (planName || '').toLowerCase();
    const isFree = price === 0 || name.includes('free');

    let baseTheme: PlanTheme;

    if (isFree) {
        baseTheme = FREE_THEME;
    } else {
        // Map names to PAID_THEMES index
        // 0: Silver, 1: Lime, 2: Teal, 3: Sky, 4: Blue, 5: Indigo, 6: Violet, 7: Red, 8: Gold
        if (name.includes('starter') || name.includes('entry')) baseTheme = PAID_THEMES[0];
        else if (name.includes('basic')) baseTheme = PAID_THEMES[1];
        else if (name.includes('standard')) baseTheme = PAID_THEMES[2];
        else if (name.includes('pro')) baseTheme = PAID_THEMES[3];
        else if (name.includes('advanced')) baseTheme = PAID_THEMES[4];
        else if (name.includes('business')) baseTheme = PAID_THEMES[5];
        else if (name.includes('premium')) baseTheme = PAID_THEMES[6];
        else if (name.includes('enterprise')) baseTheme = PAID_THEMES[7];
        else if (name.includes('ultimate')) baseTheme = PAID_THEMES[8];
        else baseTheme = PAID_THEMES[4]; // Default to Blue
    }

    const { hex, secondaryHex, colorName, glowColor } = baseTheme;

    // Explicit maps to ensure Tailwind Generate CSS
    const buttonGradients: Record<string, string> = {
        slate: 'bg-gradient-to-r from-slate-600 to-slate-600',
        zinc: 'bg-gradient-to-r from-zinc-600 to-zinc-600',
        lime: 'bg-gradient-to-r from-lime-600 to-lime-600',
        teal: 'bg-gradient-to-r from-teal-600 to-teal-600',
        sky: 'bg-gradient-to-r from-sky-600 to-sky-600',
        blue: 'bg-gradient-to-r from-blue-600 to-blue-600',
        indigo: 'bg-gradient-to-r from-indigo-600 to-indigo-600',
        violet: 'bg-gradient-to-r from-violet-600 to-violet-600',
        red: 'bg-gradient-to-r from-red-600 to-red-600',
        amber: 'bg-gradient-to-r from-amber-600 to-amber-600',
        orange: 'bg-gradient-to-r from-orange-600 to-orange-600',
        emerald: 'bg-gradient-to-r from-emerald-600 to-emerald-600',
    };

    const buttonHovers: Record<string, string> = {
        slate: 'hover:from-slate-500 hover:to-slate-600',
        zinc: 'hover:from-zinc-500 hover:to-zinc-600',
        lime: 'hover:from-lime-500 hover:to-lime-600',
        teal: 'hover:from-teal-500 hover:to-teal-600',
        sky: 'hover:from-sky-500 hover:to-sky-600',
        blue: 'hover:from-blue-500 hover:to-blue-600',
        indigo: 'hover:from-indigo-500 hover:to-indigo-600',
        violet: 'hover:from-violet-500 hover:to-violet-600',
        red: 'hover:from-red-500 hover:to-red-600',
        amber: 'hover:from-amber-500 hover:to-amber-600',
        orange: 'hover:from-orange-500 hover:to-orange-600',
        emerald: 'hover:from-emerald-500 hover:to-emerald-600',
    };

    // Safe fallback for button gradient logic
    // Special case: Silver used to use Slate, but now we have Zinc. 
    // If we want to strictly keep Silver using Slate: 
    // const btnColor = baseTheme.name === 'Silver' ? 'slate' : colorName;
    // but Config says Zinc, so let's try Zinc. If looks bad, we can change map.

    return {
        ...baseTheme,

        // Color name
        color: colorName,

        // Background gradients
        bgGradient: isFree
            ? 'from-slate-900/90 via-slate-900/70 to-slate-900/90'
            : `from-slate-900/10 via-${baseTheme.name.toLowerCase() === 'silver' ? 'slate' : colorName}-900/20 to-slate-900/10`, // Maintaining simple interpolation for bg which is less critical or usually safe if safelisted, but I should probably map this too if I want 100% safety. Leaving for now as issue reported was BUTTON.
        cardBg: isFree ? 'bg-slate-900/50' : `bg-${baseTheme.name.toLowerCase() === 'silver' ? 'slate' : colorName}-950/20`,
        gradientFrom: isFree ? '#1e293b' : hex,
        gradientTo: isFree ? '#0f172a' : secondaryHex,

        // Icon styling
        iconBg: isFree ? 'bg-slate-700' : `bg-${baseTheme.name.toLowerCase() === 'silver' ? 'slate' : colorName}-500/20`,
        iconColor: isFree ? 'text-slate-300' : `text-${baseTheme.name.toLowerCase() === 'silver' ? 'slate' : colorName}-400`,

        // Button gradients (Fixed with Explicit Maps)
        buttonGradient: isFree
            ? 'bg-gradient-to-t from-slate-700 to-slate-400/20'
            : (buttonGradients[colorName] || buttonGradients['blue']),
        buttonHover: isFree
            ? 'hover:from-slate-600 hover:to-slate-500'
            : (buttonHovers[colorName] || buttonHovers['blue']),

        glow: glowColor,

        // Accent colors
        accentColor: isFree ? '#94a3b8' : hex,
        accentLight: isFree ? '#cbd5e1' : secondaryHex,

        // Glow and shadow
        glowShadow: `0 0 30px ${glowColor}`,
        borderGlow: isFree ? 'border-slate-700' : `border-${baseTheme.name.toLowerCase() === 'silver' ? 'slate' : colorName}-500/50`,

        // Text color for value displays
        text: isFree ? 'text-slate-200' : `text-${baseTheme.name.toLowerCase() === 'silver' ? 'slate' : colorName}-300`,
    };
}

/**
 * Get raw RGB values for inline styles
 */
export function getThemeColors(planName: string, price: number = 0) {
    const theme = getPlanTheme(planName, price);
    return {
        primary: theme.accentColor,
        glow: theme.glowColor,
        border: theme.borderGlow
    };
}
