// src/components/neural-display-v2/LiquidEyes.tsx
import React from "react";
import { motion, Transition } from "framer-motion";
import { EmotionVector } from "./ExpressionRig";
import { useLiquidEyes } from "./useLiquidEyes";

interface LiquidEyesProps {
    emotionVector: EmotionVector;
    color?: string;
    scale?: number;
    externalMouseOffset?: { x: number; y: number };
}

// Spring config for SVG path morphing — Snappy and high-speed
const PATH_SPRING: Transition = {
    type: "spring",
    stiffness: 450,
    damping: 30,
    mass: 0.5,
};

export default function LiquidEyes({
    emotionVector,
    color = "#00e5ff",
    scale = 1,
    externalMouseOffset,
}: LiquidEyesProps) {
    const {
        leftPath,
        rightPath,
        blinkScaleY,
        breathingScale,
        gazeX,
        gazeY
    } = useLiquidEyes({
        emotionVector,
        externalMouseOffset,
        mirrorRight: true,
    });

    // Final fallback path (Safe muscular oval)
    const FALLBACK_PATH = "M 50 25 Q 85 25 85 50 Q 85 75 50 75 Q 15 75 15 50 Q 15 25 50 25 Z";

    return (
        <div
            id="liquid-eyes-container"
            style={{
                display: "flex",
                gap: "32px",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${scale})`,
                transformOrigin: "center",
            }}
        >
            {/* ── LEFT EYE ─────────────────────────────────────────────────── */}
            <motion.div
                id="eye-left"
                style={{
                    transformOrigin: "center",
                    originY: "50%",
                    scaleY: blinkScaleY * breathingScale,
                    x: gazeX,
                    y: gazeY,
                }}
                transition={{
                    scaleY: PATH_SPRING,
                    x: PATH_SPRING,
                    y: PATH_SPRING
                }}
            >
                <svg
                    width={100}
                    height={100}
                    viewBox="0 0 100 100"
                    style={{ overflow: "visible" }}
                >
                    <defs>
                        <filter id="liquid-glow-L" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    <motion.path
                        d={leftPath || FALLBACK_PATH}
                        fill={color}
                        filter="url(#liquid-glow-L)"
                        animate={{ d: leftPath || FALLBACK_PATH }}
                        transition={PATH_SPRING}
                    />
                </svg>
            </motion.div>

            {/* ── RIGHT EYE ────────────────────────────────────────────────── */}
            <motion.div
                id="eye-right"
                style={{
                    transformOrigin: "center",
                    originY: "50%",
                    scaleY: blinkScaleY * breathingScale,
                    x: gazeX,
                    y: gazeY,
                }}
                transition={{
                    scaleY: PATH_SPRING,
                    x: PATH_SPRING,
                    y: PATH_SPRING
                }}
            >
                <svg
                    width={100}
                    height={100}
                    viewBox="0 0 100 100"
                    style={{ overflow: "visible", transform: "scaleX(-1)" }}
                >
                    <defs>
                        <filter id="liquid-glow-R" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    <motion.path
                        d={rightPath || FALLBACK_PATH}
                        fill={color}
                        filter="url(#liquid-glow-R)"
                        animate={{ d: rightPath || FALLBACK_PATH }}
                        transition={PATH_SPRING}
                    />
                </svg>
            </motion.div>
        </div>
    );
}
