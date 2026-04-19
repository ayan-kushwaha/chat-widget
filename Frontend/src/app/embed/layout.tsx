"use client";

import React, { useLayoutEffect } from 'react';

export default function EmbedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useLayoutEffect(() => {
        // Force transparent background for clean iframe embedding
        document.documentElement.style.setProperty('background', 'transparent', 'important');
        document.body.style.setProperty('background', 'transparent', 'important');
        document.body.style.setProperty('background-color', 'transparent', 'important');
        document.body.style.setProperty('overflow', 'hidden', 'important');

        return () => {
            document.documentElement.style.removeProperty('background');
            document.body.style.removeProperty('background');
            document.body.style.removeProperty('overflow');
        };
    }, []);

    return (
        <div style={{ width: '100%', height: '100vh', background: 'transparent', overflow: 'hidden', position: 'relative' }}>
            {/* Hide global widget overlay and any navigations from root layout */}
            <style>{`
                html, body { background: transparent !important; background-color: transparent !important; overflow: hidden !important; }
                /* Hide the floating chatbot widget & call manager that root layout adds */
                #cluaiz-widget-root, .cluaiz-launcher, [class*="GlobalWidget"], [class*="CallManager"] { display: none !important; }
            `}</style>
            {children}
        </div>
    );
}
