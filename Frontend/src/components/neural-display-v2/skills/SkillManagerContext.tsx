"use client";

import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from "react";

export type ActiveSkillType = null | "menu" | "exit_menu" | "home" | "profile" | "faq" | "contact" | "feedback" | "tts" | "game_rps" | "game_ttt" | "live_voice" | "game_snake" | "app_settings" | "settings" | "docs" | "app_docs" | "app_chat" | "app_info" | "game_breakout" | "game_flappy" | "game_racing" | "game_tts";

interface SkillManagerContextProps {
    activeSkill: ActiveSkillType;
    setActiveSkill: Dispatch<SetStateAction<ActiveSkillType>>;
    isMagneticDisabled: boolean;
    setMagneticDisabled: Dispatch<SetStateAction<boolean>>;
    baseScale: number;
    setBaseScale: Dispatch<SetStateAction<number>>;
    menuStyle: "classic" | "modern";
    setMenuStyle: Dispatch<SetStateAction<"classic" | "modern">>;
}

const SkillManagerContext = createContext<SkillManagerContextProps | undefined>(undefined);

export function SkillManagerProvider({ children }: { children: ReactNode }) {
    const [activeSkill, setActiveSkill] = useState<ActiveSkillType>(null);
    const [isMagneticDisabled, setMagneticDisabled] = useState(false);
    const [baseScale, setBaseScale] = useState(1);
    const [menuStyle, setMenuStyle] = useState<"classic" | "modern">("modern");

    return (
        <SkillManagerContext.Provider
            value={{
                activeSkill,
                setActiveSkill,
                isMagneticDisabled,
                setMagneticDisabled,
                baseScale,
                setBaseScale,
                menuStyle,
                setMenuStyle
            }}
        >
            {children}
        </SkillManagerContext.Provider>
    );
}

export function useSkillManager() {
    const context = useContext(SkillManagerContext);
    if (!context) {
        throw new Error("useSkillManager must be used within a SkillManagerProvider");
    }
    return context;
}
