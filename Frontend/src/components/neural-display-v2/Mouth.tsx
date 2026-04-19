// src/components/neural-display-v2/Mouth.tsx
// v3 — Liquid Mesh Morphing (Consistent with Eyes)
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import {
    EmoEmotion,
    EmotionVector,
    EMOTION_TO_VECTOR,
    solveMesh,
    meshToPath,
    lerpVector,
    NEUTRAL_VECTOR
} from "./ExpressionRig";

interface MouthProps {
    emotion?: EmoEmotion;
    color?: string;
    scale?: number;
    isSpeaking?: boolean;
}

const MOUTH_SPRING = { stiffness: 400, damping: 30, mass: 1 };

export default function Mouth({
    emotion = "idle",
    color = "#00e5ff",
    scale = 1,
    isSpeaking = false,
}: MouthProps) {
    // 1. Core Emotion Vector State (for smooth interpolation)
    const [targetVector, setTargetVector] = useState<EmotionVector>(EMOTION_TO_VECTOR[emotion]);
    const [currentVector, setCurrentVector] = useState<EmotionVector>(EMOTION_TO_VECTOR[emotion]);

    // 2. Sync target when emotion prop changes
    useEffect(() => {
        setTargetVector(EMOTION_TO_VECTOR[emotion] || EMOTION_TO_VECTOR.idle);
    }, [emotion]);

    // 3. Smooth Vector Interpolation Loop
    useEffect(() => {
        let frameId: number;
        const startTime = performance.now();
        const duration = 250; // ms

        const step = () => {
            setCurrentVector(prev => {
                const diff = lerpVector(prev, targetVector, 0.15); // Simple lerp for smoothness
                return diff;
            });
            frameId = requestAnimationFrame(step);
        };

        frameId = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frameId);
    }, [targetVector]);

    // 4. Lip-Sync Logic (Speaking Deltas)
    const [speakingImpulse, setSpeakingImpulse] = useState(0);
    useEffect(() => {
        if (!isSpeaking) {
            setSpeakingImpulse(0);
            return;
        }

        let isMounted = true;
        const bark = () => {
            if (!isMounted || !isSpeaking) return;
            setSpeakingImpulse(Math.random());
            setTimeout(bark, 80 + Math.random() * 100);
        };
        bark();
        return () => { isMounted = false; };
    }, [isSpeaking]);

    // 5. Final Mesh Solve
    const path = useMemo(() => {
        // Boost "surprised" or "happiness" when speaking for movement
        const renderVec = { ...currentVector };
        if (isSpeaking) {
            renderVec.surprised = Math.max(renderVec.surprised, speakingImpulse * 0.4);
            renderVec.happiness = Math.max(renderVec.happiness, speakingImpulse * 0.2);
        }

        const mesh = solveMesh(renderVec, undefined, true);
        return meshToPath(mesh);
    }, [currentVector, isSpeaking, speakingImpulse]);

    // 6. Visual Styles
    const isSpecialShape = emotion === "surprised" || emotion === "mindblown" || emotion === "shook" || emotion === "love" || emotion === "star";
    const fillOpacity = isSpecialShape ? 0.9 : (isSpeaking ? 0.4 : 0.1);

    // Scale animation for the container
    const motionScale = useSpring(scale, MOUTH_SPRING);

    return (
        <motion.div
            className="flex items-center justify-center pointer-events-none"
            style={{
                width: 100,
                height: 100,
                scale: motionScale
            }}
        >
            <svg
                viewBox="0 0 100 100"
                width="100"
                height="100"
                className="overflow-visible"
            >
                {/* Glow Filter Definition */}
                <defs>
                    <filter id="mouth-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                <motion.path
                    animate={{ d: path }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                        mass: 0.5
                    }}
                    fill={color}
                    fillOpacity={fillOpacity}
                    stroke={color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        filter: `drop-shadow(0px 0px 10px ${color})`,
                    }}
                    className="origin-center"
                />
            </svg>
        </motion.div>
    );
}
