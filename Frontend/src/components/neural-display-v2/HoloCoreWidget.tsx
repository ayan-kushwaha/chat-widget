"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LottieEmoji } from "@/components/global/LottieEmoji";
import { EmojiMeta } from "@/assets/emogy/EmojiMeta";
import { HoloCoreProps, EMOTIONS, EmotionState, SkillState } from "./HoloCore";
import EmoEyes from "./EmoEyes";
import { EmoEmotion } from "./ExpressionRig";
// import Mouth from "./Mouth";
import { BatterySkill } from "./skills/BatterySkill";
import { useBrowserVoice } from "../browser-voice/useBrowserVoice";
import { useSkillManager, SkillManagerProvider } from "./skills/SkillManagerContext";
import ActionMenuSkill from "./skills/menu/ActionMenuSkill";
import TicTacToeSkill from "./skills/games/TicTacToe";
import RockPaperScissorsSkill from "./skills/games/RockPaperScissors";
import SnakeGameSkill from "./skills/games/SnakeGameSkill";
import BreakoutGameSkill from "./skills/games/BreakoutGameSkill";
import FlappyBirdSkill from "./skills/games/FlappyBirdSkill";
import RacingGameSkill from "./skills/games/RacingGameSkill";
import TTSGameSkill from "./skills/games/TTSGameSkill";
import LiveVoiceCaptionSkill from "./skills/LiveVoiceCaptionSkill";
import TtsReaderSkill from "./skills/TtsReaderSkill";
import AppSettingsSkill from "./skills/AppSettingsSkill";

// ─────────────────────────────────────────────────────────
//  Behavior mapping (Dashboard -> EmotionState)
// ─────────────────────────────────────────────────────────
const BEHAVIOR_MAP: Record<string, EmotionState> = {
    giggle: "happy",
    wink: "wink",
    nod: "listening",
    jump: "surprised",
    surprise: "surprised",
    wave: "speaking",
    "close-eyes": "sleep"
};

const MAP_TO_EMO: Record<string, EmoEmotion> = {
    idle: "idle",
    happy: "happy",
    sad: "sad",
    thinking: "curious",
    listening: "cute",
    speaking: "idle",
    error: "error",
    sleep: "sleep",
    surprised: "surprised",
    angry: "angry",
    love: "love",
    wink: "wink",
    confused: "curious",
    reading: "idle",
    cool: "cute"
};

// ─────────────────────────────────────────────────────────
//  Emotion → EmojiMeta codepoint mapping
// ─────────────────────────────────────────────────────────
const EMOTION_EMOJI_CODE: Partial<Record<EmotionState, string>> = {
    idle: "1f60a",  // 😊 blush
    happy: "1f929",  // 🤩 starstruck
    sad: "1f622",  // 😢 cry
    thinking: "1f914",  // 🤔 thinkingface
    listening: "1fae1",  // 🫡 salute
    error: "1f480",  // 💀 skull
    sleep: "1f634",  // 😴 sleep
    surprised: "1f632",  // 😲 astonished
    angry: "1f620",  // 😠 angry
    love: "1f970",  // 🥰 heartface
    wink: "1f609",  // 😉 wink
    confused: "1f627",  // 😧 anguished
};

function getEmojiPath(emotion: EmotionState): string | null {
    const code = EMOTION_EMOJI_CODE[emotion];
    if (!code) return null;
    const meta = EmojiMeta[code];
    return meta ? meta.path : null;
}

// ─────────────────────────────────────────────────────────
//  HoloCoreWidget Content
// ─────────────────────────────────────────────────────────
function HoloCoreWidgetInner(props: HoloCoreProps) {
    const baseEmotion = (props.emotion ?? "idle") as EmotionState;
    const baseSkill = (props.activeSkill ?? "none") as SkillState;

    const [overrideEmotion, setOverrideEmotion] = useState<EmotionState | null>(null);
    const [behaviorEmotion, setBehaviorEmotion] = useState<EmoEmotion | null>(null);
    const [showBatteryMode, setShowBatteryMode] = useState(false);
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
    const [activeEffect, setActiveEffect] = useState<"shock" | "flash" | null>(null);

    // ── Magnet State ──
    const [isMagnetHovered, setIsMagnetHovered] = useState(false);
    const [magnetFace, setMagnetFace] = useState<EmoEmotion | null>(null);
    const magnetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [overrideSkill, setOverrideSkill] = useState<SkillState | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Skill Manager Hooks
    const { activeSkill, setActiveSkill, isMagneticDisabled, baseScale, setBaseScale } = useSkillManager();
    const effectiveScale = baseScale; // Let Launcher.ts handle scale via iframe size. Active skills now zoom naturally via ResizeObserver.

    // ── Behavioral Tracker Refs ──
    const lastMouseMove = useRef(Date.now());
    const clickCount = useRef(0);
    const lastClickTime = useRef(0);
    const dragStartTime = useRef<number | null>(null);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const mouseVelocity = useRef(0);
    const prevMagnetHoverRef = useRef(false);

    const [externalMouse, setExternalMouse] = useState({ x: 0, y: 0 });

    // ── Voice Architecture Hook ──
    const { isListening, isSpeaking, isProcessing, startInteraction, stopInteraction, forceSpeak, greetAndListen, botReply, interimTranscript, transcript, activeWordIndex } = useBrowserVoice();

    // Prevent stale closures in global message event listeners without breaking intervals
    const stateRefs = useRef({ activeSkill, isListening, isSpeaking, isMagneticDisabled });
    useEffect(() => {
        stateRefs.current = { activeSkill, isListening, isSpeaking, isMagneticDisabled };
    }, [activeSkill, isListening, isSpeaking, isMagneticDisabled]);

    // Dynamic responsive scaling
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                const idealScale = Math.min(width / 320, height / 180);
                setBaseScale(Math.max(0.2, idealScale));
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // ── Interaction Engine & Listener ──
    useEffect(() => {
        const handleExternalMouse = (event: MessageEvent) => {
            if (event.data?.type === 'CLUAIZ_EXTERNAL_MOUSE') {
                const { x, y, r } = event.data;
                const now = Date.now();
                lastMouseMove.current = now;

                const dx = x - lastMousePos.current.x;
                const dy = y - lastMousePos.current.y;
                mouseVelocity.current = Math.sqrt(dx * dx + dy * dy);
                lastMousePos.current = { x, y };

                const maxRange = 25;
                const winW = window.parent.innerWidth || 1920;
                const winH = window.parent.innerHeight || 1080;

                const mappedX = Math.max(-maxRange, Math.min(maxRange, (x / (winW / 4)) * maxRange));
                const mappedY = Math.max(-maxRange, Math.min(maxRange, (y / (winH / 4)) * maxRange));

                setExternalMouse({ x: mappedX, y: mappedY });

                const distThreshold = 150;
                setBehaviorEmotion((prev: EmoEmotion | null) => {
                    if (r < distThreshold) return "peeking";
                    if (r < distThreshold * 2.5) return "rolling";
                    if (prev === "peeking" || prev === "rolling") return null;
                    return prev;
                });
            }

            if (event.data?.type === 'CLUAIZ_DRAG_STATE') {
                if (event.data.dragging) {
                    dragStartTime.current = Date.now();
                } else {
                    dragStartTime.current = null;
                    setBehaviorEmotion((prev: EmoEmotion | null) => (prev === "dizzy" ? null : prev));
                }
            }

            if (event.data?.type === 'CLUAIZ_READING') {
                if (event.data.isReading) {
                    setBehaviorEmotion("reading");
                } else {
                    setBehaviorEmotion((prev: EmoEmotion | null) => (prev === "reading" ? null : prev));
                }
            }



            if (event.data?.type === 'CLUAIZ_MAGNET_HOVER') {
                const isNowHovered = event.data.isHovered;
                if (prevMagnetHoverRef.current !== isNowHovered) {
                    prevMagnetHoverRef.current = isNowHovered;
                    setIsMagnetHovered(isNowHovered); // Pure state update without internal side-effects
                    
                    const currentStates = stateRefs.current;
                    
                    if (isNowHovered && !currentStates.isMagneticDisabled) {
                        if (magnetTimeoutRef.current) clearTimeout(magnetTimeoutRef.current);
                        setMagnetFace(Math.random() > 0.5 ? 'cute' : 'happy');
                        
                        // 🔥 TRIGGER VOICE ON HOVER
                        // Only trigger if no skill is active, or if we're not currently talking/listening
                        if ((!currentStates.activeSkill || currentStates.activeSkill === 'live_voice') && !currentStates.isListening && !currentStates.isSpeaking) {
                            setActiveSkill('live_voice');
                            greetAndListen("Hi! I am Cluaiz. How can I assist you today?", "happy");
                            // We do NOT call setOverrideEmotion("happy") here anymore, to avoid the massive Lottie Emoji overlay
                            // which was causing the <path> SVG rendering errors and breaking the sleek design.
                        }
                    } else if (!currentStates.isMagneticDisabled) {
                        if (magnetTimeoutRef.current) clearTimeout(magnetTimeoutRef.current);
                        setMagnetFace(Math.random() > 0.5 ? 'sad' : 'angry');
                        magnetTimeoutRef.current = setTimeout(() => {
                            setMagnetFace(null);
                        }, 3000);
                    }
                }
            }
        };

        const engine = setInterval(() => {
            const now = Date.now();
            const idleTime = now - lastMouseMove.current;

            if (idleTime > 2000) {
                setExternalMouse((prev: { x: number; y: number }) => ({
                    x: prev.x * 0.8,
                    y: prev.y * 0.8
                }));
            }

            let nextEmo: EmoEmotion | null = null;
            if (mouseVelocity.current > 80) nextEmo = "tornado";
            else if (dragStartTime.current && (now - dragStartTime.current > 5000)) nextEmo = "dizzy";
            else if (clickCount.current > 10) nextEmo = "weary";
            else if (idleTime > 60000) nextEmo = "sleep";
            else if (idleTime > 20000) nextEmo = "bored";

            setBehaviorEmotion((prev: EmoEmotion | null) => {
                if (prev === "cool" || prev === "reading") return prev;
                if (nextEmo) return nextEmo;
                if ((prev === "sleep" && idleTime < 60000) || (prev === "bored" && idleTime < 20000)) {
                    return null;
                }
                return prev;
            });

            if (now - lastClickTime.current > 2000) clickCount.current = Math.max(0, clickCount.current - 1);
            mouseVelocity.current *= 0.8;
        }, 100);

        window.addEventListener('message', handleExternalMouse);
        return () => {
            clearInterval(engine);
            window.removeEventListener('message', handleExternalMouse);
        };
    }, []);

    const handleMouseMove = () => { lastMouseMove.current = Date.now(); };
    const handleMouseDown = () => { dragStartTime.current = Date.now(); };
    const handleMouseUp = () => { dragStartTime.current = null; };
    const handleClick = () => {
        clickCount.current += 1;
        lastClickTime.current = Date.now();
    };
    const handleDoubleClick = (e: React.MouseEvent) => {
        // Stop event from bubbling to parent to prevent rapid toggles
        e.stopPropagation();

        // Toggle action menu on double click
        if (activeSkill) {
            setActiveSkill(null);
        } else {
            setActiveSkill('menu');
        }
    };

    // Context Menu (Right Click) triggers action menu too
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setActiveSkill(prev => prev ? null : 'menu');
    };

    // ── Interaction Engine & Listener ──
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'CLUAIZ_DOUBLE_CLICK') {
                const forceState = event.data.forceState;
                if (typeof forceState === 'boolean') {
                    setActiveSkill(forceState ? 'menu' : null);
                } else {
                    setActiveSkill(prev => prev ? null : 'menu');
                }

                // Removed 5s "cool" state to allow immediate reversion to normal eyes
            }

            if (event.data?.type === 'CLUAIZ_TRIGGER_BEHAVIOR') {
                const action = event.data.action;
                const emotionToTrigger = BEHAVIOR_MAP[action];
                if (emotionToTrigger) {
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    setOverrideEmotion(emotionToTrigger);
                    timeoutRef.current = setTimeout(() => { setOverrideEmotion(null); }, 2000);
                }
            }

            if (event.data?.type === 'CLUAIZ_START_VOICE') {
                setActiveSkill('live_voice');
                startInteraction();
            }
            if (event.data?.type === 'CLUAIZ_FORCE_SPEAK') {
                forceSpeak(event.data.text, event.data.emotion || 'happy');
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [setActiveSkill]);

    // Sync menu state back to parent container (Launcher.ts)
    // Avoid triggering full widget menu zoom (4.5x scale) for live_voice
    useEffect(() => {
        if (typeof window !== 'undefined' && window.parent) {
            const isMenuOpen = !!activeSkill && activeSkill !== 'live_voice';
            window.parent.postMessage({ type: 'CLUAIZ_MENU_STATE', isOpen: isMenuOpen }, '*');
        }
    }, [activeSkill]);

    const currentEmotion = overrideEmotion || baseEmotion;
    const currentSkill = overrideSkill || baseSkill;
    const emojiPath = overrideEmotion ? getEmojiPath(currentEmotion) : null;
    const glowColor = EMOTIONS[currentEmotion]?.glowColor ?? "#00e5ff";

    let mappedEmo: EmoEmotion = magnetFace || behaviorEmotion || (MAP_TO_EMO[currentEmotion as keyof typeof MAP_TO_EMO] as EmoEmotion) || "idle";

    // Voice overrides take highest priority over standard behavior
    if (isListening) {
        mappedEmo = "cute";
    } else if (behaviorEmotion === "cool") {
        mappedEmo = "cool";
    } else {
        if (currentSkill === "dizzy") mappedEmo = "dizzy";
        if (currentSkill === "search") mappedEmo = "curious";
        if (currentSkill === "code") mappedEmo = "loading";
        if (currentSkill === "music") mappedEmo = "star";
        if (behaviorEmotion === "reading") mappedEmo = "reading";
    }

    if (activeEffect === "shock") mappedEmo = "dizzy";

    // Reset behavior when menu closes or navigation happens to ensure normal eyes return
    useEffect(() => {
        const navIds = ['exit_menu', 'home', 'profile', 'faq', 'contact', 'feedback'];
        if (activeSkill && navIds.includes(activeSkill)) {
            // It's a navigation command. For the robot, this means "Close Menu"
            setActiveSkill(null);
        }

        if (!activeSkill) {
            setBehaviorEmotion((prev: EmoEmotion | null) => (prev === "cool" ? null : prev));
        }
    }, [activeSkill, setActiveSkill]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isMagnetHovered) {
            interval = setInterval(() => {
                setMagnetFace(prev => (prev === 'cute' ? 'happy' : 'cute'));
            }, 3500);
        }
        return () => clearInterval(interval);
    }, [isMagnetHovered]);

    return (
        <div className="relative w-full h-full rounded-[2rem] flex flex-col items-center justify-end">
            <div
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleContextMenu}
                style={{
                    isolation: "isolate",
                    backgroundColor: "#0a0a0c",
                    boxShadow: "inset 0 0 80px rgba(0,0,0,0.9)",
                    transformOrigin: "bottom center",
                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    zIndex: (activeSkill && activeSkill !== 'live_voice') ? 9999 : 1
                }}
                className={`relative overflow-hidden w-full h-[70%] mt-5 transition-all duration-500 ${activeSkill ? 'rounded-[10%] border-[3px]' : 'rounded-[17%] border-[5px]'} flex items-center justify-center border-[#1a1a20] shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_0_80px_rgba(0,0,0,0.9)] cursor-pointer`}
            >
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.3]"
                    style={{
                        zIndex: 0,
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)'
                    }}
                />

                <div className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-center z-10 pointer-events-none">
                    {!showBatteryMode && activeEffect !== "shock" && (
                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* Eyes - Only visible when NO skills are active, in navigation transition states, or voice is active */}
                            {(!activeSkill || ['exit_menu', 'home', 'profile', 'faq', 'contact', 'feedback', 'live_voice'].includes(activeSkill)) && (
                                <EmoEyes emotion={mappedEmo as any} color={glowColor} scale={effectiveScale} externalMouseOffset={externalMouse} />
                            )}

                            {/* Render active module UI via SkillManager logic */}
                            <ActionMenuSkill />
                            <AppSettingsSkill />
                            <TicTacToeSkill />
                            <RockPaperScissorsSkill />
                            <SnakeGameSkill />
                            <BreakoutGameSkill />
                            <FlappyBirdSkill />
                            <RacingGameSkill />
                            <TTSGameSkill />
                            <LiveVoiceCaptionSkill 
                                isSpeaking={isSpeaking}
                                isProcessing={isProcessing}
                                botReply={botReply} 
                                interimTranscript={interimTranscript}
                                transcript={transcript}
                                activeWordIndex={activeWordIndex}
                            />
                            <TtsReaderSkill />

                            {/* Fixed absolute tracking for the mouth */}
                            {/* <div className="absolute top-[60%] left-1/2 -translate-x-1/2" style={{ transform: `scale(${scale * 0.8})` }}>
                                 <Mouth emotion={mappedEmo as any} color={glowColor} scale={1} isSpeaking={isSpeaking} />
                             </div> */}
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {activeEffect === "shock" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: [0, 0.8, 0.2, 1, 0],
                                backgroundColor: ["rgba(255,255,255,0)", "rgba(0,229,255,0.4)", "rgba(255,255,255,0.2)", "rgba(0,229,255,0.5)", "rgba(255,255,255,0)"]
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, times: [0, 0.2, 0.4, 0.6, 1] }}
                            className="absolute inset-0 z-[150] pointer-events-none flex items-center justify-center"
                        >
                            <div className="w-full h-full filter drop-shadow-[0_0_20px_#00e5ff]">
                                <LottieEmoji
                                    path="/emojis/electricity_26a1.json"
                                    style={{ width: "100%", height: "100%" }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent z-20" />

                <BatterySkill
                    onBatteryDisplayTrigger={setShowBatteryMode}
                    onBatteryLevelChange={setBatteryLevel}
                    onSpecialEffect={setActiveEffect}
                    scale={effectiveScale}
                />

                <AnimatePresence mode="wait">
                    {overrideEmotion && emojiPath && (
                        <motion.div
                            key={overrideEmotion}
                            initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 1.2, rotate: 10 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                pointerEvents: "none",
                                zIndex: 100,
                                filter: "drop-shadow(0 0 15px rgba(0,229,255,0.4))",
                            }}
                        >
                            <div style={{
                                width: "70%",
                                aspectRatio: "1",
                                filter: "hue-rotate(135deg) saturate(1.1) brightness(1.2)",
                            }}>
                                <LottieEmoji
                                    path={emojiPath as string}
                                    style={{ width: "100%", height: "100%" }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
//  Export default wrapped with Provider
// ─────────────────────────────────────────────────────────
export default function HoloCoreWidget(props: HoloCoreProps) {
    return (
        <SkillManagerProvider>
            <HoloCoreWidgetInner {...props} />
        </SkillManagerProvider>
    );
}
