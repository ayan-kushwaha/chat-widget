import { useState, useEffect, useCallback, useRef } from 'react';

interface PiPWindowState {
    pipWindow: Window | null;
    isInPiP: boolean;
}

export const useDocumentPiP = (enabled: boolean = true) => {
    const [pipState, setPipState] = useState<PiPWindowState>({
        pipWindow: null,
        isInPiP: false
    });

    const hasTriggeredPiP = useRef(false);

    // Check if Document PiP is supported
    const isPiPSupported = useCallback(() => {
        return 'documentPictureInPicture' in window;
    }, []);

    // Open PiP window
    const openPiP = useCallback(async () => {
        if (!isPiPSupported()) {
            console.warn('📺 Document Picture-in-Picture not supported');
            return null;
        }

        // Don't open if already in PiP
        if (pipState.isInPiP) {
            console.log('📺 Already in PiP mode');
            return pipState.pipWindow;
        }

        try {
            console.log('📺 Opening PiP window...');

            const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
                width: 350,
                height: 600,
            });

            // Copy all stylesheets to PiP window
            [...document.styleSheets].forEach((styleSheet) => {
                try {
                    const cssRules = [...styleSheet.cssRules]
                        .map((rule) => rule.cssText)
                        .join('');
                    const style = document.createElement('style');
                    style.textContent = cssRules;
                    pipWindow.document.head.appendChild(style);
                } catch (e) {
                    // If we can't access cssRules (CORS), copy the link
                    if (styleSheet.href) {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = styleSheet.href;
                        pipWindow.document.head.appendChild(link);
                    }
                }
            });

            // Listen for when PiP window closes
            pipWindow.addEventListener('pagehide', () => {
                console.log('📺 PiP window closed');
                setPipState({ pipWindow: null, isInPiP: false });
                hasTriggeredPiP.current = false;
            });

            setPipState({ pipWindow, isInPiP: true });
            hasTriggeredPiP.current = true;
            console.log('✅ PiP window opened');

            return pipWindow;
        } catch (err) {
            console.error('❌ Failed to open PiP:', err);
            return null;
        }
    }, [isPiPSupported, pipState]);

    // Close PiP window
    const closePiP = useCallback(() => {
        if (pipState.pipWindow) {
            pipState.pipWindow.close();
            setPipState({ pipWindow: null, isInPiP: false });
            hasTriggeredPiP.current = false;
        }
    }, [pipState.pipWindow]);

    // Auto-trigger PiP on visibility change
    useEffect(() => {
        if (!enabled || !isPiPSupported()) return;

        const handleVisibilityChange = () => {
            // When tab becomes hidden (user switched tabs)
            if (document.hidden && !hasTriggeredPiP.current) {
                console.log('👁️ Tab hidden - auto-opening PiP');
                openPiP();
            }
        };

        const handleWindowBlur = () => {
            // When window loses focus (user minimized or switched apps)
            if (!hasTriggeredPiP.current) {
                console.log('💨 Window blurred - auto-opening PiP');
                // Small delay to ensure proper trigger
                setTimeout(() => {
                    if (!hasTriggeredPiP.current) {
                        openPiP();
                    }
                }, 100);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [enabled, openPiP, isPiPSupported]);

    return {
        pipWindow: pipState.pipWindow,
        isInPiP: pipState.isInPiP,
        openPiP,
        closePiP,
        isPiPSupported: isPiPSupported()
    };
};
