"use client";

import { useState, useEffect } from "react";
// OLD: import NeuralWidget from "@/components/neural-display-v2/NeuralWidget";
import HoloCoreWidget from "@/components/neural-display-v2/HoloCoreWidget";
import type { EmotionState } from "@/components/neural-display-v2/HoloCore";

// Cycle through emotions in demo mode
const DEMO_EMOTIONS: EmotionState[] = [
    "idle", "happy", "thinking", "speaking", "sad",
    "angry", "surprised", "love", "reading", "wink",
    "confused", "error", "sleep", "listening",
];

export default function AvatarEmbedPreview() {
    const [speaking, setSpeaking] = useState(false);
    const currentEmotion: EmotionState = "idle";

    return (
        <div style={{ width: "100vw", height: "100vh", background: "transparent", overflow: "hidden", position: "relative" }}>
            <HoloCoreWidget
                emotion={currentEmotion}
                isSpeaking={speaking}
                speakingIntensity={0.65}
            />
        </div>
    );
}
