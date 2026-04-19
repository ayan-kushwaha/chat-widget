/**
 * RockPaperScissors.tsx — Uses GameShell for common UI.
 * Only contains the actual game canvas logic.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameShell, { GameMode, GameDifficulty, GameShellChildProps } from './GameShell';
import { getThemeAssets } from './BusinessThemeRig';

type Choice = 'Rock' | 'Paper' | 'Scissors' | null;
const CHOICES: Choice[] = ['Rock', 'Paper', 'Scissors'];
const EMOJIS: Record<string, string> = { Rock: '✊', Paper: '🖐', Scissors: '✌️' };

function winner(a: Choice, b: Choice): 'a' | 'b' | 'draw' {
    if (a === b) return 'draw';
    if ((a === 'Rock' && b === 'Scissors') || (a === 'Paper' && b === 'Rock') || (a === 'Scissors' && b === 'Paper')) return 'a';
    return 'b';
}

// Speed of AI thinking by difficulty
const THINK_MS: Record<GameDifficulty, [number, number]> = {
    easy: [1200, 2000],
    medium: [700, 1300],
    hard: [300, 700],
};

function RPSCanvas({ mode, difficulty, scale, isPlaying, onScoreUpdate, onRestart }: GameShellChildProps) {
    const assets = getThemeAssets('ecommerce');
    const [p1, setP1] = useState<Choice>(null);
    const [p2, setP2] = useState<Choice>(null);
    const [phase, setPhase] = useState<'choosing' | 'thinking' | 'result'>('choosing');
    const [resultText, setResultText] = useState('');
    const [wins, setWins] = useState(0);

    useEffect(() => { setP1(null); setP2(null); setPhase('choosing'); setWins(0); }, [isPlaying]);

    const runRound = useCallback((choice: Choice) => {
        setP1(choice);
        setPhase('thinking');
        const [min, max] = THINK_MS[difficulty];
        const delay = min + Math.random() * (max - min);
        setTimeout(() => {
            const ai = CHOICES[Math.floor(Math.random() * 3)];
            setP2(ai);
            const out = winner(choice, ai);
            if (out === 'draw') setResultText("Draw 🤝");
            else if (out === 'a') {
                setResultText(mode === 'CvC' ? 'Bot 1 🎉' : 'You Win! 🎉');
                const newWins = wins + 1;
                setWins(newWins);
                onScoreUpdate(newWins);
            } else {
                setResultText(mode === 'CvC' ? 'Bot 2 🤖' : 'AI Wins 🤖');
            }
            setPhase('result');
        }, delay);
    }, [difficulty, mode, wins, onScoreUpdate]);

    // CvC auto-loop
    useEffect(() => {
        if (mode !== 'CvC' || phase !== 'choosing') return;
        const t = setTimeout(() => runRound(CHOICES[Math.floor(Math.random() * 3)]), 1200);
        return () => clearTimeout(t);
    }, [mode, phase, runRound]);

    const reset = () => { setP1(null); setP2(null); setPhase('choosing'); };
    const px = (n: number) => `${n * scale}px`;
    const boxSize = Math.max(60, 80 * scale);

    return (
        <div className="w-full h-full flex flex-col items-center justify-between pb-4"
            style={{ padding: `${16 * scale}px ${12 * scale}px` }}>

            {/* VS Arena */}
            <div className="flex-1 flex items-center justify-around w-full">
                {/* Player 1 */}
                <div className="flex flex-col items-center" style={{ gap: px(6) }}>
                    <motion.div className="rounded-2xl flex items-center justify-center border"
                        animate={{ borderColor: phase === 'result' && p1 && p2 ? (winner(p1, p2) === 'a' ? '#4ade80' : winner(p1, p2) === 'b' ? '#f87171' : 'rgba(255,255,255,0.2)') : 'rgba(59,130,246,0.4)' }}
                        style={{ width: boxSize, height: boxSize, background: 'rgba(59,130,246,0.08)' }}>
                        <AnimatePresence mode="wait">
                            <motion.span key={p1 || 'e1'}
                                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                                style={{ fontSize: px(34) }}>
                                {p1 ? EMOJIS[p1] : (phase === 'thinking' && mode === 'CvC' ? '🤔' : '?')}
                            </motion.span>
                        </AnimatePresence>
                    </motion.div>
                    <span className="text-blue-300 font-semibold uppercase tracking-wider" style={{ fontSize: px(9) }}>
                        {mode === 'CvC' ? 'BOT 1' : 'YOU'}
                    </span>
                </div>

                {/* Centre */}
                <div className="flex flex-col items-center" style={{ gap: px(4) }}>
                    <span className="text-white/20 font-black italic" style={{ fontSize: px(18) }}>VS</span>
                    <AnimatePresence>
                        {phase === 'result' && <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            className="text-center font-bold text-white" style={{ fontSize: px(11), maxWidth: px(60) }}>{resultText}</motion.div>}
                        {phase === 'thinking' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-white/40 animate-pulse" style={{ fontSize: px(10) }}>...</motion.div>}
                    </AnimatePresence>
                </div>

                {/* Player 2 / AI */}
                <div className="flex flex-col items-center" style={{ gap: px(6) }}>
                    <motion.div className="rounded-2xl flex items-center justify-center border"
                        animate={{ borderColor: phase === 'result' && p1 && p2 ? (winner(p1, p2) === 'b' ? '#4ade80' : winner(p1, p2) === 'a' ? '#f87171' : 'rgba(255,255,255,0.2)') : `${assets.glowColor}60` }}
                        style={{ width: boxSize, height: boxSize, background: `${assets.glowColor}0d` }}>
                        <AnimatePresence mode="wait">
                            <motion.span key={p2 || 'e2'}
                                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                                style={{ fontSize: px(34) }}>
                                {p2 ? EMOJIS[p2] : '🤖'}
                            </motion.span>
                        </AnimatePresence>
                    </motion.div>
                    <span className="font-semibold uppercase tracking-wider" style={{ fontSize: px(9), color: assets.glowColor }}>
                        {mode === 'CvC' ? 'BOT 2' : 'AI'}
                    </span>
                </div>
            </div>

            {/* Choices / Buttons */}
            <div className="w-full shrink-0">
                {phase === 'choosing' && mode === 'PvC' && (
                    <div className="flex w-full" style={{ gap: px(6) }}>
                        {CHOICES.map(c => (
                            <button key={c!} onClick={() => runRound(c)}
                                className="flex-1 rounded-xl flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
                                style={{ padding: `${10 * scale}px ${4 * scale}px`, gap: px(3) }}>
                                <span style={{ fontSize: px(24) }}>{EMOJIS[c!]}</span>
                                <span className="text-white/40 font-medium uppercase" style={{ fontSize: px(8) }}>{c}</span>
                            </button>
                        ))}
                    </div>
                )}
                {phase === 'result' && mode === 'PvC' && (
                    <button onClick={reset} className="w-full rounded-xl font-medium text-white bg-white/8 hover:bg-white/15 border border-white/10 transition-all active:scale-95"
                        style={{ padding: px(10), fontSize: px(12) }}>
                        🔄 Again
                    </button>
                )}
                {mode === 'CvC' && (
                    <button onClick={onRestart} className="w-full rounded-xl text-white/30 bg-white/4 border border-white/8 transition-all active:scale-95"
                        style={{ padding: px(8), fontSize: px(10) }}>Stop</button>
                )}
            </div>
        </div>
    );
}

export default function RockPaperScissorsSkill() {
    return (
        <GameShell gameId="game_rps" gameName="Rock Paper Scissors" gameIcon="✊" storageKey="cluaiz_rps_highscore" hasDifficulty={true} hasCvC={true}>
            {(props) => <RPSCanvas {...props} />}
        </GameShell>
    );
}
