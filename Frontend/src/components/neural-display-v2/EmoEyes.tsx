/**
 * EmoEyes.tsx  (v3 — Liquid Morph Engine)
 * ─────────────────────────────────────────────────────────────────────────
 * PUBLIC API IS UNCHANGED:
 *   <EmoEyes emotion="sad" color="#00e5ff" scale={1} externalMouseOffset={...} />
 *
 * INTERNALS CHANGED:
 *   The old "blink-swap" trick (scaleY→0, path swap, scaleY→1) is GONE.
 *   Instead, we convert the emotion string to an EmotionVector via an adapter
 *   and hand off to LiquidEyes, which morphs the geometry continuously.
 * ─────────────────────────────────────────────────────────────────────────
 */
"use client";

import { EMOTION_TO_VECTOR, EmotionVector, EmoEmotion } from "./ExpressionRig";
import LiquidEyes from "./LiquidEyes";

// ── Public types (kept intact for backwards-compat) ──────────────────────
// (Moved EmoEmotion to ExpressionRig.ts to break circular dependency)

interface EmoEyesProps {
    /** Preset emotion string (idle, happy, etc.) */
    emotion?: EmoEmotion;
    /** Optional manual vector for blending/lab testing (overrides preset) */
    manualVector?: EmotionVector;
    color?: string;
    scale?: number;
    externalMouseOffset?: { x: number; y: number };
    /** Kept for API compat — signals speaking state */
    isSpeaking?: boolean;
}

// ── Colour overrides for specific emotions (kept for parity) ─────────────
const EMOTION_COLOR_OVERRIDE: Partial<Record<EmoEmotion, string>> = {
    love: "#ff3366",
    star: "#ffda00",
    frustrated: "#ff4444",
    shook: "#00ffee",
    melting: "#44ffaa",
    excited: "#ffda00",
    mindblown: "#ff6600",
};

// ── EmoEyes — public wrapper (adapter) ───────────────────────────────────
export default function EmoEyes({
    emotion = "idle",
    manualVector,
    color = "#00e5ff",
    scale = 1,
    externalMouseOffset,
    isSpeaking = false,
}: EmoEyesProps) {
    // 1. Convert string emotion → EmotionVector OR use manual override (Cloned to prevent mutation)
    const baseVector = manualVector
        ? { ...manualVector }
        : { ...(EMOTION_TO_VECTOR[emotion] || EMOTION_TO_VECTOR.idle) };

    // 2. Resolve final color (some emotions have a colour override)
    // Only apply override if NOT in manual mode
    const finalColor = manualVector ? color : (EMOTION_COLOR_OVERRIDE[emotion] ?? color);

    // 3. Slight thinking-intensity boost when speaking
    const activeVector = isSpeaking
        ? { ...baseVector, thinking: Math.min(1, baseVector.thinking + 0.15) }
        : baseVector;

    // 4. Hand off to LiquidEyes — all animation lives there
    return (
        <LiquidEyes
            emotionVector={activeVector}
            color={finalColor}
            scale={scale}
            externalMouseOffset={externalMouseOffset}
        />
    );
}
