"use client";

import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

const FONTS = [
    { name: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
    { name: 'Roboto', url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap' },
    { name: 'Lato', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap' },
    { name: 'Montserrat', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap' },
    { name: 'Oswald', url: 'https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap' },
    { name: 'Playfair Display', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap' },
    { name: 'Merriweather', url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap' },
    { name: 'Nunito', url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&display=swap' },
    { name: 'Raleway', url: 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap' },
    { name: 'Poppins', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap' },
    { name: 'Open Sans', url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap' },
    { name: 'Inconsolata', url: 'https://fonts.googleapis.com/css2?family=Inconsolata:wght@300;400;500;700&display=swap' },
];

export const ThemeController = () => {
    const { fontFamily, bubbleColor, aiBubbleColor, fontSize } = useThemeStore();

    // Helper: Determine text color (Black/White) based on background brightness
    const getContrastColor = (hexColor: string) => {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return yiq >= 128 ? '#000000' : '#ffffff';
    };

    // 1. Initial Load: Inject ALL fonts for previews
    useEffect(() => {
        FONTS.forEach(font => {
            if (!document.getElementById(`font-${font.name}`)) {
                const link = document.createElement('link');
                link.id = `font-${font.name}`;
                link.rel = 'stylesheet';
                link.href = font.url;
                document.head.appendChild(link);
            }
        });
    }, []);

    // 2. Apply Selected Font Globally
    useEffect(() => {
        document.body.style.fontFamily = `"${fontFamily}", sans-serif`;
    }, [fontFamily]);

    // 3. Handle Color & Size Injection
    useEffect(() => {
        // User Variables
        document.documentElement.style.setProperty('--chat-bubble-bg', bubbleColor);
        document.documentElement.style.setProperty('--chat-bubble-fg', getContrastColor(bubbleColor));

        // AI Variables
        document.documentElement.style.setProperty('--ai-bubble-bg', aiBubbleColor);
        document.documentElement.style.setProperty('--ai-bubble-fg', getContrastColor(aiBubbleColor));

        // Global Font Size
        document.documentElement.style.setProperty('--chat-font-size', `${fontSize}px`);
        document.documentElement.style.fontSize = `${fontSize}px`;
    }, [bubbleColor, aiBubbleColor, fontSize]);

    return null;
};
