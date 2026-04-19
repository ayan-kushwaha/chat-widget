import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type BackgroundType = 'none' | 'galaxy' | 'ripple' | 'threads' | 'liquid' | 'PixelBlast';
type CursorType = 'none' | 'splash' | 'crosshair' | 'target';

interface ThemeState {
    bgType: BackgroundType;
    opacity: number; // 0.0 to 1.0 (Low to High VISIBILITY of background)
    cursorType: CursorType;
    fontFamily: string;
    fontSize: number;
    bubbleColor: string;
    aiBubbleColor: string;
    setBgType: (type: BackgroundType) => void;
    setOpacity: (opacity: number) => void;
    setCursorType: (type: CursorType) => void;
    setFontFamily: (font: string) => void;
    setFontSize: (size: number) => void;
    setBubbleColor: (color: string) => void;
    setAiBubbleColor: (color: string) => void;

    // ✨ New Toggles
    compactMode: boolean;
    modernBubbles: boolean;
    toggleCompactMode: () => void;
    toggleModernBubbles: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            bgType: 'galaxy', // Default to a cool one
            opacity: 0.2,     // Subtle default
            cursorType: 'none',
            fontFamily: 'Inter',
            fontSize: 15,
            bubbleColor: '#10b981', // Emerald-500
            aiBubbleColor: '#27272a', // Zinc-800
            compactMode: false,
            modernBubbles: true,
            setBgType: (type) => set({ bgType: type }),
            setOpacity: (opacity) => set({ opacity }),
            setCursorType: (type) => set({ cursorType: type }),
            setFontFamily: (font) => set({ fontFamily: font }),
            setFontSize: (size) => set({ fontSize: size }),
            setBubbleColor: (color) => set({ bubbleColor: color }),
            setAiBubbleColor: (color) => set({ aiBubbleColor: color }),
            toggleCompactMode: () => set((state) => ({ compactMode: !state.compactMode })),
            toggleModernBubbles: () => set((state) => ({ modernBubbles: !state.modernBubbles })),
        }),
        {
            name: 'cluaiz-theme-storage',
        }
    )
);
