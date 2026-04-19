"use client";

import React, { useEffect } from 'react';
import ActionMenuSkill from '@/components/neural-display-v2/skills/menu/ActionMenuSkill';
import { useSkillManager, SkillManagerProvider } from '@/components/neural-display-v2/skills/SkillManagerContext';

function MenuPageContent() {
    const { setActiveSkill } = useSkillManager();

    useEffect(() => {
        // Auto-open menu on this page
        setActiveSkill('menu');
    }, [setActiveSkill]);

    return (
        <div className="w-full h-screen bg-neutral-950 flex items-center justify-center p-10 overflow-hidden">
            <div className="relative w-full h-full flex items-center justify-center bg-zinc-900/50 rounded-3xl border border-white/10 overflow-hidden">
                <ActionMenuSkill />

                <div className="absolute top-8 left-8 text-white/40 font-mono text-sm z-[300] pointer-events-none">
                    Apple Watch Menu Preview (100% Parity Mode)<br />
                    URL: /menu
                </div>
            </div>
        </div>
    );
}

export default function MenuPreviewPage() {
    return (
        <SkillManagerProvider>
            <MenuPageContent />
        </SkillManagerProvider>
    );
}
