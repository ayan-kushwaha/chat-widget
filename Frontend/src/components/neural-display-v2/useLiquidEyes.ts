// src/components/neural-display-v2/useLiquidEyes.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { animate } from "framer-motion";
import {
    EmotionVector,
    NEUTRAL_EYE,
    solveMesh,
    meshToPath
} from "./ExpressionRig";

interface UseLiquidEyesProps {
    emotionVector: EmotionVector;
    externalMouseOffset?: { x: number; y: number };
    mirrorRight?: boolean;
}

const LERP_FACTOR = 0.08;
const MOUSE_MAX_DELTA = 15;

export function useLiquidEyes({
    emotionVector,
    externalMouseOffset
}: UseLiquidEyesProps) {
    // 1. Core Vector State (Cloned to isolate animation memory)
    const [vector, setVector] = useState<EmotionVector>({ ...emotionVector });
    const vectorRef = useRef<EmotionVector>({ ...emotionVector });

    // 2. Gaze Inertia State
    const [gaze, setGaze] = useState({ x: 0, y: 0 });
    const gazeTargetRef = useRef({ x: 0, y: 0 });
    const gazeCurrentRef = useRef({ x: 0, y: 0 });

    // 3. Reflexive States (Blink & Breathing)
    const [blinkScaleY, setBlinkScaleY] = useState(1);
    const [breathingScale, setBreathingScale] = useState(1);
    const [jitter, setJitter] = useState<[number, number][]>(() =>
        Array.from({ length: 12 }, () => [0, 0])
    );

    // Simplified Emotion Update (Removing redundant vector animation)
    useEffect(() => {
        if (!emotionVector) return;
        setVector({ ...emotionVector });
    }, [emotionVector]);

    // Dependent Blink Scheduler
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const scheduleBlink = () => {
            const delay = 3000 + Math.random() * 5000;
            timeout = setTimeout(() => {
                animate(1, 0, {
                    duration: 0.08,
                    onUpdate: (v) => setBlinkScaleY(v),
                    onComplete: () => {
                        animate(0, 1, {
                            duration: 0.12,
                            onUpdate: (v) => setBlinkScaleY(v),
                            onComplete: scheduleBlink
                        });
                    }
                });
            }, delay);
        };
        scheduleBlink();
        return () => clearTimeout(timeout);
    }, []);

    // Gaze and Oscillations Loop
    useEffect(() => {
        let frame: number;
        const loop = (time: number) => {
            const cur = gazeCurrentRef.current;
            const tgt = gazeTargetRef.current;
            const nx = cur.x + (tgt.x - cur.x) * LERP_FACTOR;
            const ny = cur.y + (tgt.y - cur.y) * LERP_FACTOR;
            gazeCurrentRef.current = { x: nx, y: ny };
            setGaze({ x: nx, y: ny });

            setBreathingScale(1.0 + Math.sin(time * 0.002) * 0.015);

            // High-fidelity micro-jitter (subtle ±0.3px)
            setJitter(Array.from({ length: 12 }, () => [
                (Math.random() - 0.5) * 0.6,
                (Math.random() - 0.5) * 0.6
            ]));

            frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frame);
    }, []);

    // Update Gaze Target
    useEffect(() => {
        if (externalMouseOffset) {
            gazeTargetRef.current = {
                x: (externalMouseOffset.x / 25) * MOUSE_MAX_DELTA,
                y: (externalMouseOffset.y / 25) * MOUSE_MAX_DELTA,
            };
        }
    }, [externalMouseOffset]);

    // 4. Solve Final Paths with robust safety
    let leftPath = "M 50 50 m -30 0 a 30 30 0 1 0 60 0 a 30 30 0 1 0 -60 0";
    let rightPath = "M 50 50 m -30 0 a 30 30 0 1 0 60 0 a 30 30 0 1 0 -60 0";

    try {
        const currentMesh = solveMesh(vector, jitter);
        const generatedPath = meshToPath(currentMesh);

        if (generatedPath && generatedPath.length > 5 && !generatedPath.includes("undefined") && !generatedPath.includes("NaN")) {
            leftPath = generatedPath;
            rightPath = generatedPath;
        } else {
            console.warn("LiquidEyes: Generated path invalid, using fallback", { generatedPath, vector });
        }
    } catch (e) {
        console.error("LiquidEyes: Mesh solver failed", e);
    }

    return {
        leftPath,
        rightPath,
        blinkScaleY,
        breathingScale,
        gazeX: gaze.x,
        gazeY: gaze.y,
    };
}
