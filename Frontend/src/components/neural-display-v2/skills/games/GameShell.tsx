/**
 * GameShell.tsx — Common reusable wrapper for ALL games.
 * Simplified scaling inspired by ActionMenuSkill.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSkillManager, ActiveSkillType } from '../SkillManagerContext';
import { 
    Settings, Gamepad2, Trophy, Clock, Target, Rocket, 
    ChevronLeft, RotateCcw, Home, Play, Pause, X,
    ArrowLeft, Monitor, Cpu, Check
} from 'lucide-react';
import { LottieEmoji } from '@/components/global/LottieEmoji';
import { EmojiMeta } from '@/assets/emogy/EmojiMeta';

export type GameMode = 'PvC' | 'CvC' | 'AI_PLAYER';
export type GameDifficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'start' | 'settings' | 'mode' | 'difficulty' | 'playing';

export interface GameShellChildProps {
    mode: GameMode;
    difficulty: GameDifficulty;
    volume: number; // 0 to 1
    scale: number;
    isTiny: boolean;
    dimensions: { width: number; height: number };
    isZoneEnabled: boolean;
    zoneDurationMinutes: number; // Add zone duration
    isPlaying: boolean;
    onScoreUpdate: (score: number) => void;
    onStatusUpdate: (text: string) => void;
    onGameOver: () => void;
    onRestart: () => void;
    mapSettings: { show: boolean; opacity: number; position: 'left' | 'right' };
    graphicsSettings: { fps: number, resolution: string };
    setFps: (f: number) => void;
    setResolution: (r: string) => void;
    isPaused: boolean;
    setIsPaused: (p: boolean) => void;
}

interface GameShellProps {
    gameId: ActiveSkillType;
    gameName: string;
    gameIcon: string;
    lottieCode?: string;
    storageKey: string;
    hasDifficulty?: boolean;
    hasCvC?: boolean;
    children: (props: GameShellChildProps) => React.ReactNode;
}

const DIFFICULTY_LABELS: Record<GameDifficulty, string> = {
    easy: '🟢 Easy',
    medium: '🟡 Medium',
    hard: '🔴 Hard',
};

export default function GameShell({
    gameId,
    gameName,
    gameIcon,
    lottieCode,
    storageKey,
    hasDifficulty = true,
    hasCvC = true,
    children,
}: GameShellProps) {
    const { activeSkill, setActiveSkill } = useSkillManager();
    const isVisible = activeSkill === gameId;
    const containerRef = useRef<HTMLDivElement>(null);

    // Dynamic Sizing
    const [dimensions, setDimensions] = useState({ width: 300, height: 420 });

    useEffect(() => {
        if (!containerRef.current) return;
        const update = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth || 300,
                    height: containerRef.current.clientHeight || 420,
                });
            }
        };
        const obs = new ResizeObserver(update);
        obs.observe(containerRef.current);
        update();
        return () => obs.disconnect();
    }, [isVisible]);

    // Simplified Two-Mode Scaling
    const { scaleFactor, isLandscape, isTiny } = useMemo(() => {
        const { width, height } = dimensions;
        const portrait = height > width;

        // Check if it's a very small widget
        const tiny = width < 250 || height < 280;

        // Portrait floor: 0.4, Landscape floor: 0.3
        const factor = portrait
            ? Math.max(0.4, Math.min(1.2, width / 320))
            : Math.max(0.3, Math.min(1.1, height / 400));

        return { scaleFactor: factor, isLandscape: !portrait, isTiny: tiny };
    }, [dimensions]);

    const s = (n: number) => n * scaleFactor;

    // Phase state
    const [phase, setPhase] = useState<GamePhase>('start');
    const [mode, setMode] = useState<GameMode>(() => (localStorage.getItem(`${storageKey}_mode`) as GameMode) || 'PvC');
    const [difficulty, setDifficulty] = useState<GameDifficulty>(() => (localStorage.getItem(`${storageKey}_diff`) as GameDifficulty) || 'medium');

    // Zone Settings
    const [isZoneEnabled, setIsZoneEnabled] = useState<boolean>(() => {
        const stored = localStorage.getItem(`${storageKey}_zone_on`);
        return stored ? stored === 'true' : true; // Default ON
    });
    const [zoneDurationMinutes, setZoneDurationMinutes] = useState<number>(() => {
        const stored = localStorage.getItem(`${storageKey}_zone_duration`);
        return stored ? parseInt(stored, 10) : 30; // Default 30 mins
    });

    const [volume, setVolume] = useState(() => {
        const stored = localStorage.getItem('game_volume');
        return stored ? parseFloat(stored) : 0.8;
    });
    const [mapSettings, setMapSettings] = useState(() => {
        const stored = localStorage.getItem(`${storageKey}_map`);
        return stored ? JSON.parse(stored) : { show: true, opacity: 0.6, position: 'right' };
    });

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState('');

    // Graphics Settings
    const [fps, setFps] = useState(() => {
        const saved = localStorage.getItem('gs_fps');
        return saved ? parseInt(saved) : 60;
    });
    const [resolution, setResolution] = useState(() => {
        const saved = localStorage.getItem('gs_resolution');
        return saved || 'FHD';
    });

    useEffect(() => localStorage.setItem('gs_fps', fps.toString()), [fps]);
    useEffect(() => localStorage.setItem('gs_resolution', resolution), [resolution]);

    // Shortcuts
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                setMapSettings((prev: any) => ({ ...prev, show: !prev.show }));
            }
            if (e.key === 'Escape' && phase === 'playing') {
                setIsPaused(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [phase]);

    const [highScore, setHighScore] = useState(() => {
        const stored = localStorage.getItem(storageKey);
        return stored ? parseInt(stored, 10) : 0;
    });
    const [statusText, setStatusText] = useState('');

    // Auto-save settings
    useEffect(() => { localStorage.setItem(`${storageKey}_mode`, mode); }, [mode, storageKey]);
    useEffect(() => { localStorage.setItem(`${storageKey}_diff`, difficulty); }, [difficulty, storageKey]);
    useEffect(() => { localStorage.setItem(`${storageKey}_zone_on`, isZoneEnabled.toString()); }, [isZoneEnabled, storageKey]);
    useEffect(() => { localStorage.setItem(`${storageKey}_zone_duration`, zoneDurationMinutes.toString()); }, [zoneDurationMinutes, storageKey]);
    useEffect(() => { localStorage.setItem('game_volume', volume.toString()); }, [volume]);
    useEffect(() => { localStorage.setItem(`${storageKey}_map`, JSON.stringify(mapSettings)); }, [mapSettings, storageKey]);

    const handleScoreUpdate = (newScore: number) => {
        setScore(newScore);
        if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem(storageKey, newScore.toString());
        }
    };

    useEffect(() => {
        if (!isVisible) {
            setPhase('start');
            setScore(0);
            setStatusText('');
        }
    }, [isVisible]);

    const handleRestart = () => {
        setScore(0);
        setStatusText('');
        setIsGameOver(false);
        setIsPaused(false);
        setPhase('start');
    };

    const handleGameOver = () => { 
        setIsGameOver(true);
    };

    if (!isVisible) return null;

    return (
        <motion.div
            ref={containerRef}
            key={gameId as string}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[9999] flex flex-col overflow-hidden pointer-events-auto backdrop-blur-[40px]"
            style={{
                background: 'linear-gradient(145deg, rgba(8,8,16,0.96), rgba(15,15,35,0.92))',
                boxShadow: 'inset 0 0 120px rgba(0,0,0,0.7)',
            }}
            onClick={e => e.stopPropagation()}
            onContextMenu={e => e.preventDefault()}
        >
            {/* ── HEADER ── */}
            <div
                className="flex items-center justify-between shrink-0 bg-transparent"
                style={{
                    padding: `${s(isTiny ? 2 : 5)}px ${s(isTiny ? 5 : 20)}px`,
                    height: s(isTiny ? 32 : 56),
                }}
            >
                <div className={`flex items-center ${isTiny ? 'gap-1' : 'gap-4'} z-10`}>
                    {phase === 'playing' ? (
                        <button
                            onClick={() => (isPaused || isGameOver) ? handleRestart() : setIsPaused(true)}
                            className="flex items-center justify-center transition-all active:scale-95 group"
                            title={(isPaused || isGameOver) ? "Back to Menu" : "Pause Game (ESC)"}
                        >
                            {(isPaused || isGameOver) ? (
                                <ArrowLeft size={s(isTiny ? 14 : 20)} className="text-white/60 hover:text-white" />
                            ) : (
                                <Pause size={s(isTiny ? 12 : 18)} className="text-white/40 group-hover:text-white" fill="currentColor" />
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                if (phase === 'start') {
                                    setActiveSkill('menu');
                                } else {
                                    setPhase('start');
                                }
                            }}
                            className="p-1 rounded-lg transition-all active:scale-90"
                        >
                            <ArrowLeft size={s(isTiny ? 14 : 20)} className="text-white/60 hover:text-white" />
                        </button>
                    )}
                </div>

                {/* Center Status */}
                <div className="flex-1 flex justify-center px-4 pointer-events-none">
                    {statusText && (
                        <div className={`flex items-center ${isTiny ? 'gap-[1px]' : 'gap-2'} text-white/50 font-black uppercase tracking-[0.15em] leading-none`} style={{ fontSize: s(10) }}>
                            {statusText.split(/(\d+)/).map((part, i) => (
                                <span
                                    key={i}
                                    className={/\d+/.test(part) ? "font-mono tabular-nums text-cyan-300 drop-shadow-[0_0_8px_#67e8f9]" : ""}
                                >
                                    {part}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`flex items-center ${isTiny ? 'gap-0' : 'gap-2'} leading-none shrink-0 min-w-[s(60)]`}>
                    {phase === 'playing' && activeSkill?.includes('snake') && (
                        <button
                            onClick={() => setMapSettings((prev: any) => ({ ...prev, show: !prev.show }))}
                            className="p-1 rounded-lg transition-all active:scale-90 opacity-40 hover:opacity-100"
                            title="Toggle Mini-map"
                        >
                            <span style={{ fontSize: s(isTiny ? 12 : 18) }}>🗺️</span>
                        </button>
                    )}
                    {phase !== 'playing' && (phase === 'start' || (phase === 'settings' && activeSkill && !activeSkill.includes('snake'))) && (
                        <button
                            onClick={() => setPhase(phase === 'settings' ? 'start' : 'settings')}
                            className="p-1 rounded-lg transition-all active:scale-90 group"
                        >
                            <Settings size={s(isTiny ? 14 : 18)} className={`transition-all duration-500 ${phase === 'settings' ? 'rotate-180 text-white' : 'text-white/20 group-hover:text-white/70'}`} />
                        </button>
                    )}
                    <div className={`flex flex-col gap-0 items-center justify-center min-w-[s(40)] ${isTiny ? '' : 'gap-1'}`}>
                        {score > 0 && (
                            <span className="text-white pt-1 font-mono tabular-nums font-black leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" style={{ fontSize: s(12) }}>
                                {score}
                            </span>
                        )}
                        {/* Only show HI if PLAYING */}
                        {highScore > 0 && phase === 'playing' && (
                            <span className="text-white/20 tracking-[0.2em] font-black leading-none pb-1" style={{ fontSize: s(7) }}>
                                HI {highScore}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden scrollbar-none pointer-events-auto">
                <style dangerouslySetInnerHTML={{
                    __html: `
            .scrollbar-none::-webkit-scrollbar { display: none !important; }
            .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />

                <div className={`min-h-full flex flex-col items-center justify-center  relative ${isTiny ? "scale-[0.9]" : "p-1"}`}>
                    <AnimatePresence mode="wait">
                        {phase === 'start' && (
                            <motion.div
                                key="start"
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 1.1, y: -20 }}
                                className="flex flex-col items-center justify-center text-center pointer-events-auto"
                                style={{
                                    gap: s(isTiny ? 8 : (isLandscape ? 0 : 24)),
                                    transform: `scale(${isTiny ? 0 : 1})`,
                                    transformOrigin: 'center'
                                }}
                            >
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-white/10 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700" />
                                    {lottieCode && EmojiMeta[lottieCode] ? (
                                        <div style={{ width: s(isLandscape ? 60 : 120), height: s(isLandscape ? 60 : 120) }} className="relative z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-transform duration-500 group-hover:scale-110">
                                            <LottieEmoji
                                                path={EmojiMeta[lottieCode].path}
                                                style={{ width: '100%', height: '100%' }}
                                            />
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: s(isLandscape ? 72 : 92), lineHeight: 1 }} className="relative z-10 drop-shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-transform duration-500 group-hover:scale-110 block">
                                            {gameIcon}
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-white font-black tracking-[-0.05em] leading-tight" style={{ fontSize: s(isLandscape ? 20 : 36) }}>
                                    {gameName}
                                </h2>

                                <button
                                    onClick={() => setPhase('playing')}
                                    className="relative font-black rounded-full text-white
  border border-white/15
  active:scale-95 transition-all duration-200
  group overflow-hidden"
                                    style={{
                                        padding: `${s(isTiny ? 12 : 16)}px ${s(isTiny ? 36 : 64)}px`,
                                        fontSize: s(isTiny ? 13 : 15),
                                        letterSpacing: '0.18em',
                                        backdropFilter: 'blur(15px)',
                                        background:
                                            'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 100%)'
                                    }}
                                >

                                    {/* hover energy line */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    </div>

                                    {/* text */}
                                    <span className="relative z-10 tracking-widest transition-all group-hover:tracking-[0.24em]">
                                        PLAY
                                    </span>
                                </button>
                            </motion.div>
                        )}

                        {phase === "settings" && (
                            <motion.div
                                key="settings"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`w-full mx-auto flex flex-col ${isTiny ? "gap-1" : "gap-5 max-w-[480px] p-4"}`}
                            >

                                {/* MODE */}
                                <div className={`flex flex-col  ${isTiny ? "" : "gap-2"}`}>

                                    <p className={`text-white/30 font-black uppercase tracking-[0.2em]  ${isTiny ? "text-[5px]" : "text-[10px]"}`}>
                                        MODE
                                    </p>

                                    <div className={`relative flex bg-white/[0.04] rounded-full border border-white/[0.06] ${isTiny ? "p-1" : "p-1 "}`}    >

                                        <motion.div
                                            layout
                                            transition={{ type: "spring", stiffness: 250, damping: 25 }}
                                            className={`absolute top-1 bottom-1 bg-white rounded-full ${mode === "PvC" ? "left-1 w-[32%]" :
                                                mode === "AI_PLAYER" ? "left-[34%] w-[32%]" :
                                                    "right-1 w-[32%]"
                                                }`}
                                        />

                                        <button
                                            onClick={() => setMode("PvC")}
                                            className={`flex-1 z-10 font-bold text-center ${mode === "PvC" ? "text-black" : "text-white/50"
                                                } ${isTiny ? "text-[5px] py-0" : "text-xs py-2"}`}
                                        >
                                            PLAYER
                                        </button>

                                        <button
                                            onClick={() => setMode("AI_PLAYER")}
                                            className={`flex-1 z-10 font-bold text-center ${mode === "AI_PLAYER" ? "text-black" : "text-white/50"
                                                } ${isTiny ? "text-[5px] py-0" : "text-xs py-2"}`}
                                        >
                                            AI
                                        </button>

                                        <button
                                            onClick={() => setMode("CvC")}
                                            className={`flex-1 z-10 font-bold text-center ${mode === "CvC" ? "text-black" : "text-white/50"
                                                } ${isTiny ? "text-[5px] py-0" : "text-xs py-2"}`}
                                        >
                                            AUTO
                                        </button>

                                    </div>
                                </div>


                                {/* DIFFICULTY */}

                                <div className="flex flex-col gap-2">

                                    <p className={`text-white/30 font-black uppercase tracking-[0.2em]  ${isTiny ? "text-[5px]" : "text-[10px]"}`}>
                                        DIFFICULTY
                                    </p>

                                    <div className={`grid ${isTiny ? "grid-cols-1 gap-1" : "grid-cols-3 gap-3"} `}>

                                        {(["easy", "medium", "hard"] as GameDifficulty[]).map(d => (

                                            <motion.button
                                                key={d}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setDifficulty(d)}
                                                className={`rounded-xl p-1 border flex gap-1 items-center justify-center transition-all ${difficulty === d
                                                    ?
                                                    "bg-white/10 border-white/30 text-white"
                                                    :
                                                    "bg-white/[0.02] border-white/[0.05] text-white/40 hover:text-white/70"
                                                    }${isTiny ? "py- text-[5px]" : "py-3 text-[11px]"}`}
                                            >

                                                <div
                                                    className={`rounded-full ${d === "easy" ? "bg-emerald-500" :
                                                        d === "medium" ? "bg-amber-500" :
                                                            "bg-red-500"
                                                        } ${isTiny ? "w-2 h-2" : "w-2.5 h-2.5"}`}
                                                />

                                                {d.toUpperCase()}

                                            </motion.button>

                                        ))}

                                    </div>

                                </div>


                                {/* ZONE DURATION */}
                                <div className={`flex items-center flex-col ${isTiny ? "py-0 gap-1" : "gap-2"}`}>
                                    <div className="flex items-center justify-between w-full">
                                        <p className={`text-white/30 font-black uppercase tracking-[0.2em] ${isTiny ? "text-[5px]" : "text-[10px]"}`}>
                                            BATTLE ZONE
                                        </p>
                                        {/* Simple ON/OFF Toggle */}
                                        <button
                                            onClick={() => setIsZoneEnabled(!isZoneEnabled)}
                                            className={`relative ${isTiny ? "w-6 h-3" : "w-8 h-4"} rounded-full transition-colors duration-300 ${isZoneEnabled ? "bg-red-500" : "bg-white/10"}`}
                                        >
                                            <motion.div
                                                layout
                                                className={`absolute top-[2px] bottom-[2px] bg-white rounded-full ${isTiny ? "w-[8px]" : "w-[12px]"} ${isZoneEnabled ? "right-[2px]" : "left-[2px]"}`}
                                            />
                                        </button>



                                    </div>

                                    <AnimatePresence>
                                        {isZoneEnabled && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className={`flex gap-3 w-full items-center ${isTiny ? "py-0" : "py-1"}`}
                                            >
                                                <input
                                                    type="range"
                                                    min="10"
                                                    max="60"
                                                    step="10"
                                                    value={zoneDurationMinutes}
                                                    onChange={(e) => setZoneDurationMinutes(parseInt(e.target.value, 10))}
                                                    style={{
                                                        background: `linear-gradient( to right, #ef4444 ${((zoneDurationMinutes - 10) / 50) * 100}%, rgba(255,255,255,0.1) ${((zoneDurationMinutes - 10) / 50) * 100}% )`
                                                    }}
                                                    className={`flex-1 min-w-0 ${isTiny ? "h-[2px]" : "h-[3px]"} rounded-full appearance-none cursor-pointer`}
                                                />
                                                <p className={`text-red-400 font-mono font-black shrink-0 ${isTiny ? "text-[7px] w-6 text-right" : "text-[11px] w-12 text-right"}`}>
                                                    {zoneDurationMinutes} 
                                                    <span className="text-[10px] text-white/50 ml-[1px]">MIn</span>
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>


                                {/* VOLUME */}
                                <div className={`flex flex-col ${isTiny ? "py-0 gap-1" : "py-1 gap-2"}`}>

                                    <p className={`text-white/30 font-black uppercase tracking-[0.2em]  ${isTiny ? "text-[5px]" : "text-[10px]"}`}>
                                        VOLUME
                                    </p>
                                    <div className={`flex items-center ${isTiny ? "py-0" : "py-2 gap-2"}`}>

                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={volume}
                                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                                            style={{
                                                background: `linear-gradient( to right,   white ${volume * 100}%,      rgba(255,255,255,0.1) ${volume * 100}%    )`
                                            }}
                                            className={`flex-1 ${isTiny ? "h-[2px]" : "h-[3px]"} rounded-full appearance-none cursor-pointer w-full`}
                                        />

                                        <span className="text-white/40 font-mono text-[9px] w-6 text-right">
                                            {Math.round(volume * 100)} 
                                            <span className="text-[10px] text-white/50 ml-[1px]">%</span>
                                        </span>

                                    </div>
                                </div>

                                {/* MAP SETTINGS (Only for BattleSnake) */}
                                {activeSkill?.includes('snake') && (
                                    <div className={`flex flex-col ${isTiny ? "py-0 gap-1" : "py-1 gap-4 border-t border-white/5 pt-4"}`}>
                                         <p className={`text-white/30 font-black uppercase tracking-[0.2em]  ${isTiny ? "text-[5px]" : "text-[10px]"}`}>
                                            MINI-MAP SETTINGS
                                        </p>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/50 text-xs font-bold">Position</span>
                                            <div className="flex bg-white/5 p-1 rounded-lg">
                                                <button 
                                                    onClick={() => setMapSettings((s: any) => ({ ...s, position: 'left' }))}
                                                    className={`px-3 py-1 rounded-md text-[10px] font-bold ${mapSettings.position === 'left' ? 'bg-white/20 text-white' : 'text-white/30 hover:text-white/50'}`}
                                                >LEFT</button>
                                                <button 
                                                    onClick={() => setMapSettings((s: any) => ({ ...s, position: 'right' }))}
                                                    className={`px-3 py-1 rounded-md text-[10px] font-bold ${mapSettings.position === 'right' ? 'bg-white/20 text-white' : 'text-white/30 hover:text-white/50'}`}
                                                >RIGHT</button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <span className="text-white/50 text-[10px] font-bold flex justify-between">
                                                OPACITY <span>{Math.round(mapSettings.opacity * 100)}%</span>
                                            </span>
                                            <input 
                                                type="range" min="0.1" max="1" step="0.1"
                                                value={mapSettings.opacity}
                                                onChange={e => setMapSettings((s: any) => ({ ...s, opacity: parseFloat(e.target.value) }))}
                                                style={{ background: `linear-gradient(to right, white ${mapSettings.opacity * 100}%, rgba(255,255,255,0.1) ${mapSettings.opacity * 100}%)` }}
                                                className="w-full h-[2px] rounded-full appearance-none cursor-pointer"
                                            />
                                        </div>

                                        {/* GRAPHICS SETTINGS INSIDE MAIN SETTINGS */}
                                        <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-white/30 tracking-widest uppercase flex items-center gap-2">
                                                    <Cpu size={12} /> FRAME RATE
                                                </p>
                                                <div className="flex gap-2">
                                                    {[30, 60, 90].map(f => (
                                                        <button
                                                            key={f}
                                                            onClick={() => setFps(f)}
                                                            className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all border ${fps === f ? 'bg-blue-500/20 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'}`}
                                                        >
                                                            {f} FPS
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-white/30 tracking-widest uppercase flex items-center gap-2">
                                                    <Monitor size={12} /> RESOLUTION
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {['HD', 'FHD', 'UHD', '4K'].map(r => (
                                                        <button
                                                            key={r}
                                                            onClick={() => setResolution(r)}
                                                            className={`py-2 rounded-xl font-bold text-xs transition-all border ${resolution === r ? 'bg-purple-500/20 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'}`}
                                                        >
                                                            {r}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                        {phase === 'playing' && (
                            <motion.div
                                key="playing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-auto"
                            >
                                {children({
                                    mode,
                                    difficulty,
                                    volume,
                                    scale: scaleFactor,
                                    isTiny,
                                    dimensions,
                                    isZoneEnabled,
                                    zoneDurationMinutes,
                                    isPlaying: phase === 'playing',
                                    onScoreUpdate: handleScoreUpdate,
                                    onStatusUpdate: setStatusText,
                                    onGameOver: handleGameOver,
                                    onRestart: () => { setPhase('start'); setScore(0); },
                                    mapSettings: mapSettings,
                                    graphicsSettings: { fps, resolution },
                                    setFps: setFps,
                                    setResolution: setResolution,
                                    isPaused: isPaused,
                                    setIsPaused: setIsPaused,
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
