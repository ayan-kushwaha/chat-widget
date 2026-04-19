"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────
//  EMOTION TYPES + CONFIG
// ─────────────────────────────────────────────────────────
export type EmotionState =
    | "idle" | "happy" | "sad" | "thinking" | "listening"
    | "speaking" | "reading" | "error" | "sleep"
    | "surprised" | "angry" | "love" | "wink" | "confused" | "cool";

export type SkillState = "none" | "music" | "search" | "code" | "hacker" | "dizzy";

export type HoloCoreProps = {
    emotion?: EmotionState;
    activeSkill?: SkillState;
    isSpeaking?: boolean;
    speakingIntensity?: number;
    hideFeatures?: boolean;
    hideFace?: boolean;
};

type EyeType = "trap" | "arc" | "flat" | "x" | "ring" | "slant" | "glasses" | "spiral";
type MouthType = "smile" | "bigSmile" | "sad" | "flat" | "wave" | "open" | "dots" | "none";

type EmotionConfig = {
    leftEye: EyeType;
    rightEye: EyeType;
    mouth: MouthType;
    glowColor: string;
    eyeUp?: number;
    tiltLeft?: number;
    tiltRight?: number;
    glowPulse?: boolean;
};

export const EMOTIONS: Record<EmotionState, EmotionConfig> = {
    idle: { leftEye: "trap", rightEye: "trap", mouth: "smile", glowColor: "#00e5ff" },
    happy: { leftEye: "arc", rightEye: "arc", mouth: "bigSmile", glowColor: "#00ff99", glowPulse: true },
    sad: { leftEye: "trap", rightEye: "trap", mouth: "sad", glowColor: "#4488ff", eyeUp: -0.05 },
    thinking: { leftEye: "trap", rightEye: "trap", mouth: "dots", glowColor: "#aa88ff", eyeUp: 0.04 },
    listening: { leftEye: "flat", rightEye: "flat", mouth: "flat", glowColor: "#00e5ff" },
    speaking: { leftEye: "trap", rightEye: "trap", mouth: "wave", glowColor: "#00e5ff" },
    reading: { leftEye: "trap", rightEye: "trap", mouth: "flat", glowColor: "#88ccff", eyeUp: -0.14 },
    error: { leftEye: "x", rightEye: "x", mouth: "sad", glowColor: "#ff3344", glowPulse: true },
    sleep: { leftEye: "flat", rightEye: "flat", mouth: "smile", glowColor: "#223355" },
    surprised: { leftEye: "ring", rightEye: "ring", mouth: "open", glowColor: "#ffaa00", glowPulse: true },
    angry: { leftEye: "slant", rightEye: "slant", mouth: "sad", glowColor: "#ff4400", tiltLeft: -0.25, tiltRight: 0.25 },
    love: { leftEye: "arc", rightEye: "arc", mouth: "bigSmile", glowColor: "#ff44aa", glowPulse: true },
    wink: { leftEye: "flat", rightEye: "trap", mouth: "smile", glowColor: "#00e5ff" },
    confused: { leftEye: "arc", rightEye: "trap", mouth: "sad", glowColor: "#ffcc00" },
    cool: { leftEye: "glasses", rightEye: "glasses", mouth: "smile", glowColor: "#00e5ff" },
};

export const SKILL_CONFIGS: Record<SkillState, Partial<EmotionConfig>> = {
    none: {},
    music: { leftEye: "arc", rightEye: "arc", mouth: "wave", glowColor: "#ff007f", glowPulse: true },
    search: { leftEye: "ring", rightEye: "ring", mouth: "dots", glowColor: "#00ffaa" },
    code: { leftEye: "glasses", rightEye: "glasses", mouth: "flat", glowColor: "#aaff00" },
    hacker: { leftEye: "x", rightEye: "x", mouth: "wave", glowColor: "#ff0033", glowPulse: true },
    dizzy: { leftEye: "spiral", rightEye: "spiral", mouth: "open", glowColor: "#ffcc00" },
};

// ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────
//  MORPHING EYE COMPONENT (Mo-Core Logic)
// ─────────────────────────────────────────────────────────
function MorphingEye({ eyeType, glowColor, tilt = 0, isLeft = true }: { eyeType: EyeType; glowColor: string; tilt?: number; isLeft?: boolean }) {
    const trapGeo = useMemo(() => {
        const shape = new THREE.Shape();
        const wT = 0.30, wB = 0.24, hh = 0.10, r = 0.04;
        const t = wT / 2, b = wB / 2;
        shape.moveTo(-b + r, -hh); shape.lineTo(b - r, -hh);
        shape.quadraticCurveTo(b, -hh, b, -hh + r);
        shape.lineTo(t, hh - r * .3); shape.quadraticCurveTo(t, hh, t - r, hh);
        shape.lineTo(-t + r, hh); shape.quadraticCurveTo(-t, hh, -t, hh - r * .3);
        shape.lineTo(-b, -hh + r); shape.quadraticCurveTo(-b, -hh, -b + r, -hh);
        return new THREE.ShapeGeometry(shape, 32);
    }, []);

    const arcGeo = useMemo(() => {
        const shape = new THREE.Shape();
        const r = 0.14, thick = 0.055;
        // The '◡' shape
        shape.absarc(0, 0.03, r, Math.PI, 0, false);
        shape.absarc(0, 0.03, r - thick, 0, Math.PI, true);
        return new THREE.ShapeGeometry(shape, 48);
    }, []);

    const ringGeo = useMemo(() => new THREE.RingGeometry(0.075, 0.125, 32), []);

    const glassesGeo = useMemo(() => {
        const shape = new THREE.Shape();
        const w = 0.20, h = 0.12, r = 0.04, thick = 0.04;

        // Outer boundary
        shape.moveTo(-w + r, -h); shape.lineTo(w - r, -h);
        shape.quadraticCurveTo(w, -h, w, -h + r);
        shape.lineTo(w, h - r); shape.quadraticCurveTo(w, h, w - r, h);
        shape.lineTo(-w + r, h); shape.quadraticCurveTo(-w, h, -w, h - r);
        shape.lineTo(-w, -h + r); shape.quadraticCurveTo(-w, -h, -w + r, -h);

        // Inner boundary (cutout) to make it a frame
        const iw = w - thick, ih = h - thick, ir = Math.max(0, r - thick);
        const hole = new THREE.Path();
        hole.moveTo(-iw + ir, -ih); hole.lineTo(iw - ir, -ih);
        hole.quadraticCurveTo(iw, -ih, iw, -ih + ir);
        hole.lineTo(iw, ih - ir); hole.quadraticCurveTo(iw, ih, iw - ir, ih);
        hole.lineTo(-iw + ir, ih); hole.quadraticCurveTo(-iw, ih, -iw, ih - ir);
        hole.lineTo(-iw, -ih + ir); hole.quadraticCurveTo(-iw, -ih, -iw + ir, -ih);
        shape.holes.push(hole);

        // Glasses Bridge
        const bridgeShape = new THREE.Shape();
        const bx = isLeft ? w : -w;
        const bWidth = 0.08;
        bridgeShape.moveTo(bx, -0.02);
        bridgeShape.lineTo(bx + (isLeft ? bWidth : -bWidth), -0.02);
        bridgeShape.lineTo(bx + (isLeft ? bWidth : -bWidth), 0.02);
        bridgeShape.lineTo(bx, 0.02);

        // We can pass multiple shapes to ShapeGeometry
        return new THREE.ShapeGeometry([shape, bridgeShape], 48);
    }, [isLeft]);

    const spiralGeo = useMemo(() => {
        const shape = new THREE.Shape();
        shape.absarc(0, 0, 0.14, 0, Math.PI * 1.5, false);
        shape.absarc(0, 0, 0.07, Math.PI * 1.5, 0, true);
        return new THREE.ShapeGeometry(shape, 32);
    }, []);

    // Spring variants for different eye shapes
    const variants = {
        trap: { scaleX: 1.0, scaleY: 1.0, rotateZ: tilt, opacity: 1 },
        arc: { scaleX: 1.1, scaleY: 0.9, rotateZ: tilt, opacity: 1 },
        flat: { scaleX: 1.0, scaleY: 0.2, rotateZ: tilt, opacity: 1 },
        ring: { scaleX: 0.8, scaleY: 0.8, rotateZ: tilt, opacity: 1 },
        x: { scaleX: 0.0, scaleY: 0.0, rotateZ: tilt, opacity: 0 }, // Handled by sub-elements
        slant: { scaleX: 0.9, scaleY: 1.0, rotateZ: tilt + (tilt > 0 ? 0.35 : -0.35), opacity: 1 },
        glasses: { scaleX: 1.1, scaleY: 1.1, rotateZ: tilt, opacity: 1 },
        spiral: { scaleX: 0.8, scaleY: 0.8, rotateZ: tilt, opacity: 1 },
    };

    const current = variants[eyeType] || variants.trap;

    const groupRef = useRef<THREE.Group>(null);
    const mainMesh = useRef<THREE.Mesh>(null);
    const xGroup = useRef<THREE.Group>(null);
    const glintMesh = useRef<THREE.Mesh>(null);

    // Physics state
    const phys = useRef({
        scaleX: current.scaleX, scaleY: current.scaleY,
        rotateZ: current.rotateZ, opacity: current.opacity,
        xScale: eyeType === "x" ? 1 : 0,
        xOpacity: eyeType === "x" ? 1 : 0,
        glintOp: (eyeType === "trap" || eyeType === "slant") ? 0.9 : 0
    });

    const timeObj = useRef({ t: 0 });

    useFrame((_, delta) => {
        const p = phys.current;
        const dt = Math.min(delta, 0.1);
        timeObj.current.t += dt;

        // Custom stiff spring / damp (Mo-Core style)
        p.scaleX = THREE.MathUtils.damp(p.scaleX, current.scaleX, 16, dt);
        p.scaleY = THREE.MathUtils.damp(p.scaleY, current.scaleY, 16, dt);
        p.rotateZ = THREE.MathUtils.damp(p.rotateZ, current.rotateZ, 14, dt);
        p.opacity = THREE.MathUtils.damp(p.opacity, current.opacity, 18, dt);

        const targetX = eyeType === "x" ? 1 : 0;
        p.xScale = THREE.MathUtils.damp(p.xScale, targetX, 22, dt);
        p.xOpacity = THREE.MathUtils.damp(p.xOpacity, targetX, 22, dt);

        const targetGlint = (eyeType === "trap" || eyeType === "slant" || eyeType === "glasses") ? 0.9 : (eyeType === "arc" ? 0.4 : 0);
        p.glintOp = THREE.MathUtils.damp(p.glintOp, targetGlint, 12, dt);

        if (groupRef.current) {
            let extraRot = 0;
            if (eyeType === "spiral") extraRot = timeObj.current.t * -6.0; // Fast spin for dizzy
            else if (eyeType === "ring" && glowColor === "#00ffaa") extraRot = timeObj.current.t * 3.0; // Radar spin for search skill
            groupRef.current.rotation.z = p.rotateZ + extraRot;
        }

        if (mainMesh.current) {
            mainMesh.current.scale.set(p.scaleX, p.scaleY, 1);
            if (mainMesh.current.material) (mainMesh.current.material as THREE.Material).opacity = Math.max(0, p.opacity);
        }
        if (xGroup.current) {
            xGroup.current.scale.setScalar(p.xScale);
            xGroup.current.children.forEach(c => {
                const m = c as THREE.Mesh;
                if (m.material) (m.material as THREE.Material).opacity = Math.max(0, p.xOpacity);
            });
        }
        if (glintMesh.current && glintMesh.current.material) {
            (glintMesh.current.material as THREE.Material).opacity = Math.max(0, p.glintOp);
        }
    });

    const activeGeo = eyeType === "arc" ? arcGeo : eyeType === "ring" ? ringGeo : eyeType === "glasses" ? glassesGeo : eyeType === "spiral" ? spiralGeo : trapGeo;

    return (
        <group ref={groupRef}>
            {/* Primary Morphing Mesh */}
            <mesh ref={mainMesh} geometry={activeGeo}>
                <meshBasicMaterial color={glowColor} toneMapped={false} transparent />
            </mesh>

            {/* Cross 'X' sub-elements (only if type is X) */}
            <group ref={xGroup}>
                <mesh rotation={[0, 0, Math.PI / 4]}>
                    <boxGeometry args={[0.24, 0.045, 0.008]} />
                    <meshBasicMaterial color={glowColor} toneMapped={false} transparent />
                </mesh>
                <mesh rotation={[0, 0, -Math.PI / 4]}>
                    <boxGeometry args={[0.24, 0.045, 0.008]} />
                    <meshBasicMaterial color={glowColor} toneMapped={false} transparent />
                </mesh>
            </group>

            {/* Premium Glint (only for trap/arc/slant) */}
            <mesh ref={glintMesh} position={[-0.07, 0.04, 0.012]}>
                <planeGeometry args={[0.065, 0.045]} />
                <meshBasicMaterial color="#fff" transparent toneMapped={false} />
            </mesh>
        </group>
    );
}
function makeFrameGeo() {
    // Widescreen ratio (approx 5:3) to match /eyes page (500x300)
    const w = 1.0, h = 0.6, r = 0.2, thick = 0.05;
    const outer = new THREE.Shape();
    outer.moveTo(-w + r, -h); outer.lineTo(w - r, -h);
    outer.quadraticCurveTo(w, -h, w, -h + r);
    outer.lineTo(w, h - r); outer.quadraticCurveTo(w, h, w - r, h);
    outer.lineTo(-w + r, h); outer.quadraticCurveTo(-w, h, -w, h - r);
    outer.lineTo(-w, -h + r); outer.quadraticCurveTo(-w, -h, -w + r, -h);

    const iw = w - thick, ih = h - thick, ir = r - 0.02;
    const inner = new THREE.Path();
    inner.moveTo(-iw + ir, -ih); inner.lineTo(iw - ir, -ih);
    inner.quadraticCurveTo(iw, -ih, iw, -ih + ir);
    inner.lineTo(iw, ih - ir); inner.quadraticCurveTo(iw, ih, iw - ir, ih);
    inner.lineTo(-iw + ir, ih); inner.quadraticCurveTo(-iw, ih, -iw, ih - ir);
    inner.lineTo(-iw, -ih + ir); inner.quadraticCurveTo(-iw, -ih, -iw + ir, -ih);
    outer.holes.push(inner);

    return new THREE.ExtrudeGeometry(outer, {
        depth: 0.045,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.008,
        bevelSegments: 5
    });
}

// ─────────────────────────────────────────────────────────
//  EMO-STYLE READING BOOK MESH
// ─────────────────────────────────────────────────────────
function ReadingBook({ color }: { color: string }) {
    const bookRef = useRef<THREE.Group>(null);
    // Page geometry — two angled planes like an open book
    const leftPage = useMemo(() => {
        const geo = new THREE.PlaneGeometry(0.22, 0.16, 1, 1);
        // Tilt left page inward
        const pos = geo.attributes.position as THREE.BufferAttribute;
        // Right edge (x > 0) pushed back slightly for 3D feel
        for (let i = 0; i < pos.count; i++) {
            if (pos.getX(i) > 0) pos.setZ(i, -0.01);
        }
        pos.needsUpdate = true;
        return geo;
    }, []);
    const rightPage = useMemo(() => {
        const geo = new THREE.PlaneGeometry(0.22, 0.16, 1, 1);
        const pos = geo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
            if (pos.getX(i) < 0) pos.setZ(i, -0.01);
        }
        pos.needsUpdate = true;
        return geo;
    }, []);

    useFrame(state => {
        if (!bookRef.current) return;
        const t = state.clock.getElapsedTime();
        // Subtle page-turn shimmer + floating
        bookRef.current.position.y = -0.315 + Math.sin(t * 1.3) * 0.006;
        bookRef.current.rotation.z = Math.sin(t * 0.8) * 0.012;
    });

    return (
        <group ref={bookRef} position={[0, -0.315, 0.02]}>
            {/* Left page */}
            <mesh geometry={leftPage} position={[-0.115, 0, 0]} rotation={[0, 0.18, 0]}>
                <meshPhysicalMaterial color="#e8f4ff" emissive={color} emissiveIntensity={0.22} roughness={0.4} toneMapped={false} />
            </mesh>
            {/* Right page */}
            <mesh geometry={rightPage} position={[0.115, 0, 0]} rotation={[0, -0.18, 0]}>
                <meshPhysicalMaterial color="#e8f4ff" emissive={color} emissiveIntensity={0.22} roughness={0.4} toneMapped={false} />
            </mesh>
            {/* Spine glow */}
            <mesh position={[0, 0, 0.002]}>
                <planeGeometry args={[0.012, 0.16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} toneMapped={false} />
            </mesh>
            {/* Page lines (left) */}
            {[-0.04, -0.01, 0.02, 0.05].map((y, i) => (
                <mesh key={i} position={[-0.115, y, 0.005]} rotation={[0, 0.18, 0]}>
                    <planeGeometry args={[0.16, 0.007]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.0} transparent opacity={0.35} toneMapped={false} />
                </mesh>
            ))}
            {/* Page lines (right) */}
            {[-0.04, -0.01, 0.02, 0.05].map((y, i) => (
                <mesh key={i} position={[0.115, y, 0.005]} rotation={[0, -0.18, 0]}>
                    <planeGeometry args={[0.16, 0.007]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.0} transparent opacity={0.35} toneMapped={false} />
                </mesh>
            ))}
            {/* Bottom glow underline */}
            <mesh position={[0, -0.09, 0.004]}>
                <planeGeometry args={[0.38, 0.006]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.0} transparent opacity={0.7} toneMapped={false} />
            </mesh>
        </group>
    );
}

// ─────────────────────────────────────────────────────────
//  THINKING DOTS
// ─────────────────────────────────────────────────────────
function ThinkingDots({ color }: { color: string }) {
    const dotsRef = useRef<THREE.Group>(null);
    const geoRef = useMemo(() => new THREE.CircleGeometry(0.028, 12), []);
    useFrame(state => {
        if (!dotsRef.current) return;
        const t = state.clock.getElapsedTime();
        dotsRef.current.children.forEach((child, i) => {
            (child as THREE.Mesh).scale.setScalar(0.6 + Math.sin(t * 3 + i * 1.5) * 0.4);
        });
    });
    return (
        <group ref={dotsRef} position={[0, -0.28, 0.018]}>
            {[-0.095, 0, 0.095].map((x, i) => (
                <mesh key={i} geometry={geoRef} position={[x, 0, 0]}>
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
                </mesh>
            ))}
        </group>
    );
}

// Open mouth O (surprised)
function OpenMouth({ color }: { color: string }) {
    const geoO = useMemo(() => new THREE.RingGeometry(0.045, 0.075, 24), []);
    const geoI = useMemo(() => new THREE.CircleGeometry(0.045, 24), []);
    return (
        <group position={[0, -0.29, 0.018]}>
            <mesh geometry={geoO}><meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} /></mesh>
            <mesh geometry={geoI}><meshStandardMaterial color="#010a14" transparent opacity={0.92} /></mesh>
        </group>
    );
}

// ─────────────────────────────────────────────────────────
//  MAIN HoloCore
// ─────────────────────────────────────────────────────────
export default function HoloCore({
    emotion = "idle",
    activeSkill = "none",
    isSpeaking = false,
    speakingIntensity = 0.5,
    hideFeatures = false,
    hideFace = false,
}: HoloCoreProps) {
    const { pointer } = useThree();

    const rootRef = useRef<THREE.Group>(null);
    const leftEyeRef = useRef<THREE.Group>(null);
    const rightEyeRef = useRef<THREE.Group>(null);
    const frameRef = useRef<THREE.Mesh>(null);
    const screenRef = useRef<THREE.Mesh>(null);

    const frameGeo = useMemo(() => makeFrameGeo(), []);

    // Mouth line (THREE.Line avoids JSX <line> SVG conflict)
    const mouthLine = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const mat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.85, linewidth: 2, toneMapped: false });
        const ln = new THREE.Line(geo, mat);
        ln.position.set(0, -0.245, 0.018);
        return ln;
    }, []);

    // Spring physics state
    const spring = useRef({
        scale: 1,        // current eye scale
        velocity: 0,     // spring velocity
    });
    const prevEmotion = useRef(emotion);

    // Blink
    const blink = useRef({ progress: 0, timer: 2.5, phase: "waiting" as "waiting" | "closing" | "opening" });

    // Smooth mouse look with inertia (feels like physical hardware)
    const look = useRef(new THREE.Vector2(0, 0));
    const lookTarget = useRef(new THREE.Vector2(0, 0));

    // Color lerp
    const colorRef = useRef(new THREE.Color("#00e5ff"));

    const baseCfg = EMOTIONS[emotion] || EMOTIONS.idle;
    const skillCfg = activeSkill !== "none" ? SKILL_CONFIGS[activeSkill] : {};
    const cfg = { ...baseCfg, ...skillCfg }; // Skill overrides emotion

    const glowColor = cfg.glowColor || "#00e5ff";
    const eyeUp = cfg.eyeUp ?? 0;
    const mouthType: MouthType = isSpeaking ? "wave" : (cfg.mouth as MouthType || "smile");

    // ── Mo-Core Reflex State ──
    const lastMoveTime = useRef(Date.now());
    const pressStartTime = useRef<number | null>(null);
    const [reflexEmotion, setReflexEmotion] = useState<EmotionState | null>(null);

    // ── Random Jitter (Mo-Core Logic) ──
    const jitter = useRef(new THREE.Vector2(0, 0));
    const jitterTarget = useRef(new THREE.Vector2(0, 0));
    const jitterTimer = useRef(0);

    useFrame((state, delta) => {
        const time = state.clock.getElapsedTime();
        const now = Date.now();

        // ── Reflex Engine: Inactivity Sleep (60s) ──
        if (pointer.x !== 0 || pointer.y !== 0) {
            lastMoveTime.current = now;
            if (reflexEmotion === "sleep") setReflexEmotion(null);
        } else if (now - lastMoveTime.current > 60000 && emotion === "idle" && !reflexEmotion) {
            setReflexEmotion("sleep");
        }

        // ── Reflex Engine: Magnet Zone (Close Proximity) ──
        const dist = Math.sqrt(pointer.x ** 2 + pointer.y ** 2);
        const inMagnetZone = dist < 0.15; // Normalized coords

        // ── Reflex Engine: Dizzy Drag (>5s) ──
        // Note: Presuming 'mousedown' state can be detected via custom event or state.pointer.button
        // For now, we use a simplified version based on interaction

        // ── Mo-Core Random Jitter Logic (Refined 5px) ──
        jitterTimer.current -= delta;
        if (jitterTimer.current <= 0) {
            // Random jitter within slightly larger range for 5px feel
            jitterTarget.current.set(
                (Math.random() - 0.5) * 0.08,
                (Math.random() - 0.5) * 0.06
            );
            jitterTimer.current = 0.8 + Math.random() * 1.5;
        }
        jitter.current.lerp(jitterTarget.current, 0.08);

        // Calculate final active emotion
        const activeEmotion = reflexEmotion || emotion;

        // ── Breathing float ──
        if (rootRef.current) {
            rootRef.current.position.y = Math.sin(time * 1.1) * 0.018;
            // Dizzy vibration if dragging (simulated)
            if (activeEmotion === "confused") {
                rootRef.current.position.x += (Math.random() - 0.5) * 0.01;
            }
        }

        // ── Color lerp ──
        colorRef.current.lerp(new THREE.Color(glowColor), 0.06);

        // ── Emotion change → spring impulse (squash-stretch) ──
        if (prevEmotion.current !== activeEmotion) {
            spring.current.velocity = -14; // Stronger impulse for Mo-Core
            prevEmotion.current = activeEmotion;
        }
        // Spring physics: stiffness=180, damping=0.72
        spring.current.velocity += (1 - spring.current.scale) * 180 * delta;
        spring.current.velocity *= Math.pow(0.65, delta * 60);
        spring.current.scale += spring.current.velocity * delta;
        spring.current.scale = Math.max(0.01, spring.current.scale);

        // ── Mouse look — inertia (physical hardware feel) ──
        const lookStrength = activeEmotion === "sleep" ? 0 : activeEmotion === "reading" ? 0.025 : 0.09;
        lookTarget.current.set(pointer.x * lookStrength, pointer.y * 0.055 * (lookStrength > 0 ? 1 : 0));
        look.current.lerp(lookTarget.current, 0.04); // Slightly slower for more inertia

        // ── Eye positions + spring scale + Mo-Core Jitter ──
        // Magnet Zone influence on scale (Pupil Dilation feel)
        const magnetScale = inMagnetZone ? 1.15 : 1.0;

        if (leftEyeRef.current) {
            leftEyeRef.current.position.x = -0.235 + look.current.x + jitter.current.x;
            leftEyeRef.current.position.y = 0.065 + eyeUp + look.current.y + jitter.current.y;
            leftEyeRef.current.scale.setScalar(spring.current.scale * magnetScale);
            if (cfg.tiltLeft !== undefined) leftEyeRef.current.rotation.z = cfg.tiltLeft;
        }
        if (rightEyeRef.current) {
            rightEyeRef.current.position.x = 0.235 + look.current.x + jitter.current.x;
            rightEyeRef.current.position.y = 0.065 + eyeUp + look.current.y + jitter.current.y;
            rightEyeRef.current.scale.setScalar(spring.current.scale * magnetScale);
            if (cfg.tiltRight !== undefined) rightEyeRef.current.rotation.z = cfg.tiltRight;
        }

        // ── Blink (with eased lid) ──
        const blinkEnabled = activeEmotion !== "error" && activeEmotion !== "sleep" && activeEmotion !== "surprised";
        if (blinkEnabled) {
            const b = blink.current;
            b.timer -= delta;
            if (b.phase === "waiting" && b.timer <= 0) b.phase = "closing";
            if (b.phase === "closing") {
                b.progress = Math.min(b.progress + delta * 11, 1);
                if (b.progress >= 1) b.phase = "opening";
            }
            if (b.phase === "opening") {
                b.progress = Math.max(b.progress - delta * 7, 0);
                if (b.progress <= 0) { b.phase = "waiting"; b.timer = 2 + Math.random() * 4.5; }
            }
            const eased = b.phase === "closing" ? b.progress * b.progress : 1 - Math.pow(1 - b.progress, 2);
            const s = Math.max(spring.current.scale * magnetScale * (1 - eased), 0.02);
            if (leftEyeRef.current) leftEyeRef.current.scale.y = s;
            if (rightEyeRef.current) rightEyeRef.current.scale.y = s;
        } else if (activeEmotion === "sleep") {
            if (leftEyeRef.current) leftEyeRef.current.scale.y = 0.05;
            if (rightEyeRef.current) rightEyeRef.current.scale.y = 0.05;
        }

        // ── Mouth ──
        if (mouthLine) {
            (mouthLine.material as THREE.LineBasicMaterial).color.copy(colorRef.current);
            (mouthLine.material as THREE.LineBasicMaterial).opacity = (hideFeatures || hideFace) ? 0 : 0.85;

            if (!hideFeatures && !hideFace) {
                let amp = 0, midY = -0.042, sideY = 0;
                const curveW = mouthType === "bigSmile" ? 0.22 : 0.17;
                if (mouthType === "wave") { amp = speakingIntensity * 0.10; midY = -0.03 + Math.sin(time * 7) * amp; sideY = amp * 0.25; }
                else if (mouthType === "bigSmile") { midY = -0.095; sideY = -0.018; }
                else if (mouthType === "sad") { midY = 0.058; sideY = 0.025; }
                else if (mouthType === "flat") { midY = 0; sideY = 0; }
                mouthLine.geometry.setFromPoints(
                    new THREE.QuadraticBezierCurve3(
                        new THREE.Vector3(-curveW, sideY, 0),
                        new THREE.Vector3(0, midY, 0),
                        new THREE.Vector3(curveW, sideY, 0),
                    ).getPoints(36)
                );
            }
        }

        // ── Frame glow & Screen ──
        if (!hideFeatures) {
            if (frameRef.current) {
                const mat = frameRef.current.material as THREE.MeshPhysicalMaterial;
                const extra = cfg.glowPulse ? Math.sin(time * 2.5) * 0.05 : Math.sin(time * 1.4) * 0.02;
                mat.emissive.copy(colorRef.current);
                mat.emissiveIntensity = 0.07 + extra;
            }
            // Ensure screen stays pure black instead of glowing with the eye colors
            if (screenRef.current) {
                const mat = screenRef.current.material as THREE.MeshPhysicalMaterial;
                mat.color.setHex(0x000000);
            }
        }
    });

    const showMouth = !hideFeatures && !hideFace && mouthType !== "dots" && mouthType !== "open" && mouthType !== "none";
    const showDots = !hideFeatures && !hideFace && mouthType === "dots";
    const showOpen = !hideFeatures && !hideFace && mouthType === "open";
    const showBook = !hideFeatures && !hideFace && emotion === "reading";
    const showEyes = !hideFeatures && !hideFace;
    const showHUD = !hideFeatures && !hideFace;

    return (
        <group ref={rootRef}>

            {/* Dark OLED screen */}
            {!hideFeatures && (
                <mesh ref={screenRef} position={[0, 0, -0.055]}>
                    <planeGeometry args={[2.0, 1.2]} />
                    <meshPhysicalMaterial color="#000000" roughness={0} metalness={0} transparent opacity={1.0} />
                </mesh>
            )}

            {/* Chrome frame */}
            {!hideFeatures && (
                <mesh ref={frameRef} geometry={frameGeo} position={[0, 0, -0.042]}>
                    <meshPhysicalMaterial color="#1a1a20" roughness={0.15} metalness={0.9} clearcoat={1} clearcoatRoughness={0.05} emissive="#000000" emissiveIntensity={0} reflectivity={0.8} />
                </mesh>
            )}

            {/* HUD decorations */}
            {showHUD && <>
                {[-0.62, -0.505, -0.39].map((x, i) => (
                    <mesh key={i} position={[x, 0.645, 0.005]}>
                        <planeGeometry args={[0.07, 0.009]} />
                        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.8} transparent opacity={0.72} toneMapped={false} />
                    </mesh>
                ))}
                {[0.36, 0.435, 0.505, 0.57].map((x, i) => (
                    <mesh key={i} position={[x, 0.648, 0.005]}>
                        <planeGeometry args={[0.009, 0.014 + i * 0.009]} />
                        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2.2} transparent opacity={0.82} toneMapped={false} />
                    </mesh>
                ))}
                <mesh position={[0.64, 0.641, 0.005]}>
                    <ringGeometry args={[0.015, 0.022, 12]} />
                    <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2.2} transparent opacity={0.75} toneMapped={false} />
                </mesh>
                <mesh position={[-0.50, -0.626, 0.005]}>
                    <planeGeometry args={[0.24, 0.006]} />
                    <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.5} transparent opacity={0.5} toneMapped={false} />
                </mesh>
                {[0.395, 0.475, 0.555].map((x, i) => (
                    <mesh key={i} position={[x, -0.632, 0.005]}>
                        <circleGeometry args={[0.012, 8]} />
                        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2.5} transparent opacity={0.65} toneMapped={false} />
                    </mesh>
                ))}
            </>}

            {/* Left Eye */}
            {showEyes && (
                <group ref={leftEyeRef} position={[-0.235, 0.065 + eyeUp, 0.018]}>
                    <MorphingEye eyeType={cfg.leftEye as EyeType} glowColor={glowColor} tilt={cfg.tiltLeft} isLeft={true} />
                </group>
            )}

            {/* Right Eye */}
            {showEyes && (
                <group ref={rightEyeRef} position={[0.235, 0.065 + eyeUp, 0.018]}>
                    <MorphingEye eyeType={cfg.rightEye as EyeType} glowColor={glowColor} tilt={cfg.tiltRight} isLeft={false} />
                </group>
            )}

            {/* EMO-style Reading Book */}
            {showBook && <ReadingBook color={glowColor} />}

            {/* Mouth */}
            {/* {showMouth && <primitive object={mouthLine} />}
            {showDots && <ThinkingDots color={glowColor} />}
            {showOpen && <OpenMouth color={glowColor} />} */}

        </group>
    );
}