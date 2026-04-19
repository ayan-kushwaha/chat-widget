"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LottieEmoji } from "@/components/global/LottieEmoji";

interface BatterySkillProps {
    onBatteryDisplayTrigger?: (show: boolean) => void;
    onBatteryLevelChange?: (level: number | null) => void;
    onSpecialEffect?: (effect: "shock" | "flash" | null) => void;
    scale?: number;
}

export const BatterySkill: React.FC<BatterySkillProps> = ({
    onBatteryDisplayTrigger,
    onBatteryLevelChange,
    onSpecialEffect,
    scale = 1
}) => {
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
    const [isCharging, setIsCharging] = useState<boolean | null>(null);
    const [showOverlay, setShowOverlay] = useState<boolean>(false);

    useEffect(() => {
        let mounted = true;

        const initBattery = async () => {
            try {
                if (typeof window !== "undefined" && 'getBattery' in navigator) {
                    const battery: any = await (navigator as any).getBattery();

                    if (mounted) {
                        const lvl = Math.round(battery.level * 100);
                        setBatteryLevel(lvl);
                        onBatteryLevelChange?.(lvl);
                        setIsCharging(battery.charging);
                    }

                    const updateLevel = () => {
                        if (mounted) {
                            const lvl = Math.round(battery.level * 100);
                            setBatteryLevel(lvl);
                            onBatteryLevelChange?.(lvl);
                        }
                    };

                    const updateCharging = () => {
                        if (mounted) {
                            setIsCharging(battery.charging);

                            // ── STAGGERED ANIMATION SEQUENCE (11s Total) ──
                            onSpecialEffect?.("shock");

                            setTimeout(() => {
                                if (mounted) {
                                    onSpecialEffect?.(null);
                                    onBatteryDisplayTrigger?.(true);
                                    setShowOverlay(true);

                                    setTimeout(() => {
                                        if (mounted) {
                                            onBatteryDisplayTrigger?.(false);
                                            setShowOverlay(false);
                                        }
                                    }, 3000);
                                }
                            }, 1000);
                        }
                    };

                    battery.addEventListener('levelchange', updateLevel);
                    battery.addEventListener('chargingchange', updateCharging);

                    return () => {
                        battery.removeEventListener('levelchange', updateLevel);
                        battery.removeEventListener('chargingchange', updateCharging);
                    };
                }
            } catch (err) {
                console.error("Battery API error: ", err);
            }
        };

        const cleanupPromise = initBattery();

        return () => {
            mounted = false;
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, [onBatteryDisplayTrigger, onBatteryLevelChange, onSpecialEffect]);

    const getBatteryColor = (level: number | null) => {
        if (level === null) return "#00e5ff";
        if (level <= 30) return "#ff3333";
        if (level <= 60) return "#ffaa00";
        return "#33ff33";
    };

    const batteryColor = getBatteryColor(batteryLevel);

    return (
        <AnimatePresence>
            {showOverlay && batteryLevel !== null && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 * scale }}
                    animate={{ opacity: 1, scale: scale }}
                    exit={{ opacity: 0, scale: 0.5 * scale }}
                    className="absolute inset-0 z-[200] flex flex-col items-center justify-center pointer-events-none"
                    style={{
                        width: "100%",
                        height: "100%",
                        // No dark background here to keep it integrated with the face
                    }}
                >
                    <div className="flex flex-col items-center gap-6">
                        {/* Premium Scaled Battery Icon */}
                        <svg width="180" height="80" viewBox="0 0 200 80" className="drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] overflow-visible">
                            {/* Outer Frame */}
                            <rect x="10" y="10" width="160" height="60" rx="14" fill="transparent" stroke={batteryColor} strokeWidth="5" />
                            {/* Tip */}
                            <rect x="175" y="25" width="10" height="30" rx="4" fill={batteryColor} />

                            {/* Decorative Grid Lines */}
                            <line x1="50" y1="15" x2="50" y2="65" stroke={batteryColor} strokeWidth="1" strokeOpacity="0.2" />
                            <line x1="90" y1="15" x2="90" y2="65" stroke={batteryColor} strokeWidth="1" strokeOpacity="0.2" />
                            <line x1="130" y1="15" x2="130" y2="65" stroke={batteryColor} strokeWidth="1" strokeOpacity="0.2" />

                            {/* Animated Fill */}
                            <motion.rect
                                x="16" y="16"
                                height="48" rx="8" fill={batteryColor}
                                initial={{ width: 0 }}
                                animate={{ width: Math.max(10, (batteryLevel / 100) * 148) }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </svg>

                        {/* Centered Percentage with Glow */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-2"
                        >
                            {isCharging ? (
                                <div className="w-10 h-10">
                                    <LottieEmoji path="/emojis/electricity_26a1.json" style={{ width: "100%", height: "100%" }} />
                                </div>
                            ) : (
                                <span className="text-white text-3xl">🔋</span>
                            )}
                            <span
                                className="text-white font-black text-4xl tracking-tighter font-mono"
                                style={{
                                    color: batteryColor,
                                    textShadow: `0 0 15px ${batteryColor}, 0 0 30px ${batteryColor}44`
                                }}
                            >
                                {batteryLevel}%
                            </span>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
