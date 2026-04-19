import React, { useMemo } from "react";
import { motion, useMotionValue, MotionValue } from "framer-motion";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipPortal } from "@/components/ui/tooltip";
import { icon } from "./settings";
import { useIconTransform } from "./use-icon-transform";

interface ItemProps {
    app: any;
    row: number;
    col: number;
    planeX: MotionValue<number>;
    planeY: MotionValue<number>;
    setActiveSkill: (skill: string | null) => void;
    settings: {
        icon: { size: number; margin: number };
        device: { width: number; height: number };
    };
}

export function Item({ row, col, planeX, planeY, app, setActiveSkill, settings }: ItemProps) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const scale = useMotionValue(0);

    const { icon } = settings;

    if (!app.id) return null;

    const xOffset = useMemo(() =>
        col * (icon.size + icon.margin) +
        (row % 2) * ((icon.size + icon.margin) / 2)
        , [col, row, icon.size, icon.margin]);
    const yOffset = useMemo(() => row * icon.size, [row, icon.size]);

    useIconTransform({ x, y, scale, planeX, planeY, xOffset, yOffset, settings });

    const IconComponent = app.icon;

    return (
        <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
                <motion.div
                    style={{
                        position: "absolute",
                        left: xOffset,
                        top: yOffset,
                        x,
                        y,
                        scale,
                        width: icon.size,
                        height: icon.size,
                        borderRadius: "50%",
                        contain: "strict",
                        background: app.bg || `hsla(${Math.random() * 360}, 95%, 55%, 1)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 100,
                        pointerEvents: "auto",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (app.id) setActiveSkill(app.id);
                    }}
                    whileTap={{ scale: 0.85 }}
                >
                    {IconComponent ? <IconComponent size={icon.size * 0.55} color="white" strokeWidth={2.5} /> : <div className="w-1/2 h-1/2 rounded-full bg-white/20" />}
                </motion.div>
            </TooltipTrigger>
            <TooltipPortal>
                <TooltipContent 
                    side="top" 
                    sideOffset={10}
                    className="z-[300] bg-black/80 backdrop-blur-sm text-white border-white/10 px-3 py-1.5 text-xs font-medium"
                >
                    {app.label}
                </TooltipContent>
            </TooltipPortal>
        </Tooltip>
    );
}
