/**
 * TTSGameSkill.tsx — Uses GameShell for common UI.
 * Fast-typing game with difficulty-based time limits.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameShell, { GameShellChildProps, GameDifficulty } from './GameShell';
import { getThemeAssets } from './BusinessThemeRig';

const WORDS = ["Cluaiz", "Robot", "Dynamic", "Future", "Smart", "Design", "Market", "Scale", "Logic", "Engine", "Global", "Prompt", "Skill", "Action", "Neural", "Vision", "Brand", "Launch", "Pixel", "Cloud"];
const TIME_BY_DIFF: Record<GameDifficulty, number> = { easy: 45, medium: 30, hard: 20 };
const TYPE_SPEED: Record<GameDifficulty, number> = { easy: 300, medium: 180, hard: 80 }; // autoplay

function TTSCanvas({ mode, difficulty, scale, isPlaying, onScoreUpdate, onRestart }: GameShellChildProps) {
    const assets = getThemeAssets('ecommerce');
    const [word, setWord] = useState('');
    const [input, setInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(TIME_BY_DIFF[difficulty]);
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const nextWord = useCallback(() => {
        setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
        setInput('');
    }, []);

    useEffect(() => {
        if (isPlaying) { setScore(0); setTimeLeft(TIME_BY_DIFF[difficulty]); setDone(false); nextWord(); setTimeout(() => inputRef.current?.focus(), 100); }
    }, [isPlaying, difficulty, nextWord]);

    // Timer
    useEffect(() => {
        if (!isPlaying || done) return;
        const t = setInterval(() => setTimeLeft(t => { if (t <= 1) { setDone(true); return 0; } return t - 1; }), 1000);
        return () => clearInterval(t);
    }, [isPlaying, done]);

    // Autoplay: type character by character
    useEffect(() => {
        if (!isPlaying || done || mode !== 'Autoplay') return;
        const t = setInterval(() => {
            setInput(prev => {
                if (prev.length < word.length) return word.substring(0, prev.length + 1);
                const ns = score + 10; setScore(ns); onScoreUpdate(ns); nextWord(); return '';
            });
        }, TYPE_SPEED[difficulty]);
        return () => clearInterval(t);
    }, [isPlaying, done, mode, difficulty, word, score, nextWord, onScoreUpdate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (mode === 'Autoplay') return;
        const v = e.target.value;
        setInput(v);
        if (v.toLowerCase() === word.toLowerCase()) {
            const ns = score + 10; setScore(ns); onScoreUpdate(ns);
            setTimeLeft(t => t + 2); nextWord();
        }
    };

    const px = (n: number) => `${n * scale}px`;
    const progress = (timeLeft / TIME_BY_DIFF[difficulty]) * 100;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center" style={{ gap: px(12), padding: px(16) }}>
            {/* Timer bar */}
            <div className="w-full rounded-full overflow-hidden" style={{ height: px(4), background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, background: progress > 50 ? assets.glowColor : progress > 25 ? '#fbbf24' : '#f87171' }} />
            </div>

            {/* Word display */}
            <div className="w-full flex flex-col items-center rounded-2xl relative overflow-hidden" style={{ padding: px(20), background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', gap: px(14) }}>
                <span className="text-white font-bold tracking-widest text-center" style={{ fontSize: px(28), textShadow: `0 0 20px ${assets.glowColor}40` }}>
                    {word}
                </span>
                {/* Input */}
                {!done && (
                    <input ref={inputRef} type="text" value={input} onChange={handleChange}
                        disabled={done || mode === 'Autoplay'}
                        placeholder="Type here..."
                        className="w-full bg-transparent border-b text-center text-white focus:outline-none caret-green-400"
                        style={{ fontSize: px(16), padding: `${4 * scale}px`, borderColor: input && word.startsWith(input.toLowerCase()) ? assets.glowColor : 'rgba(255,255,255,0.15)' }}
                        autoComplete="off" autoCorrect="off" spellCheck={false} />
                )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between w-full">
                <span className="text-white/40" style={{ fontSize: px(10) }}>⏱ {timeLeft}s</span>
                <span className="font-mono" style={{ fontSize: px(11), color: assets.glowColor }}>Score: {score}</span>
            </div>

            {done && (
                <div className="flex flex-col items-center" style={{ gap: px(8) }}>
                    <span className="text-white font-bold" style={{ fontSize: px(14) }}>⏱ Time's Up!</span>
                    <button onClick={onRestart} className="rounded-xl font-medium text-white bg-white/10 border border-white/15 transition-all active:scale-95"
                        style={{ padding: `${9 * scale}px ${20 * scale}px`, fontSize: px(12) }}>↩ Menu</button>
                </div>
            )}
        </div>
    );
}

export default function TTSGameSkill() {
    return (
        <GameShell gameId="game_tts" gameName="Type Master" gameIcon="⌨️" storageKey="cluaiz_tts_highscore" hasDifficulty={true} hasCvC={false}>
            {(props) => <TTSCanvas {...props} />}
        </GameShell>
    );
}
