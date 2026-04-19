/**
 * FlappyBirdSkill.tsx — Uses GameShell for common UI.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import GameShell, { GameShellChildProps, GameDifficulty } from './GameShell';

const GRAVITY = 0.55;
const JUMP = -8;
const PW = 48, PG_BASE = 130;
const PIPE_SPEED: Record<GameDifficulty, number> = { easy: 2, medium: 3, hard: 4.5 };
const PG_BY_DIFF: Record<GameDifficulty, number> = { easy: 140, medium: 115, hard: 85 };

function FlappyCanvas({ mode, difficulty, scale, dimensions, isPlaying, onScoreUpdate, onRestart }: GameShellChildProps) {
    const GH = 380, GW = 300;
    const PIPE_GAP = PG_BY_DIFF[difficulty];
    const [birdY, setBirdY] = useState(190);
    const [birdVel, setBirdVel] = useState(0);
    const [pipes, setPipes] = useState<{ x: number; top: number }[]>([{ x: GW, top: 110 }]);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const birdYRef = useRef(190);
    const birdVelRef = useRef(0);

    useEffect(() => { if (isPlaying) { setBirdY(190); setBirdVel(0); birdYRef.current = 190; birdVelRef.current = 0; setPipes([{ x: GW, top: 110 }]); setGameOver(false); setScore(0); } }, [isPlaying]);

    const jump = useCallback(() => {
        if (gameOver) return;
        setBirdVel(JUMP); birdVelRef.current = JUMP;
    }, [gameOver]);

    useEffect(() => {
        if (!isPlaying || gameOver) return;
        const interval = setInterval(() => {
            // Bird physics
            const newVel = birdVelRef.current + GRAVITY;
            const newY = birdYRef.current + newVel;
            birdVelRef.current = newVel;
            birdYRef.current = newY;
            if (newY <= 0 || newY >= GH - 24) { setGameOver(true); return; }
            setBirdY(newY); setBirdVel(newVel);

            // Pipes
            setPipes(prev => {
                let next = prev.map(p => ({ ...p, x: p.x - PIPE_SPEED[difficulty] }));
                if (next[0]?.x < -PW) { next.shift(); setScore(s => { const ns = s + 1; onScoreUpdate(ns); return ns; }); }
                if (!next.length || next[next.length - 1].x < GW - 180) {
                    next.push({ x: GW, top: 60 + Math.random() * (GH - PIPE_GAP - 100) });
                }
                // Collision
                for (const p of next) {
                    if (50 + 20 > p.x && 50 < p.x + PW) {
                        if (newY < p.top || newY + 24 > p.top + PIPE_GAP) { setGameOver(true); }
                    }
                }
                return next;
            });

            // Autoplay
            if (mode === 'CvC') {
                const np = pipes.find(p => p.x + PW > 50);
                if (np) {
                    const targetY = np.top + PIPE_GAP / 2 - 12;
                    if (birdYRef.current > targetY + 8) { setBirdVel(JUMP); birdVelRef.current = JUMP; }
                }
            }
        }, 20);
        return () => clearInterval(interval);
    }, [isPlaying, gameOver, difficulty, mode, pipes, onScoreUpdate]);

    const boardW = Math.min(dimensions.width - 16, 300);
    const boardH = Math.min(dimensions.height - 56, 380);
    const sx = boardW / GW, sy = boardH / GH;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center" style={{ padding: `${6 * scale}px` }}>
            <div className="relative rounded-xl overflow-hidden cursor-pointer select-none"
                onClick={mode === 'PvC' ? jump : undefined}
                style={{ width: boardW, height: boardH, background: 'linear-gradient(180deg, #0a0a18 0%, #0d1a0d 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Bird */}
                <motion.div className="absolute z-10" animate={{ rotate: Math.max(-25, Math.min(25, birdVel * 3)) }}
                    style={{ left: 50 * sx, top: birdY * sy, width: 24 * sx, height: 24 * sy, fontSize: 20 * sx, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    🐦
                </motion.div>
                {/* Pipes */}
                {pipes.map((p, i) => (
                    <React.Fragment key={i}>
                        <div className="absolute" style={{ left: p.x * sx, top: 0, width: PW * sx, height: p.top * sy, background: 'rgba(34,197,94,0.5)', borderRight: '1px solid rgba(255,255,255,0.1)' }} />
                        <div className="absolute" style={{ left: p.x * sx, top: (p.top + PIPE_GAP) * sy, width: PW * sx, bottom: 0, height: (GH - p.top - PIPE_GAP) * sy, background: 'rgba(34,197,94,0.5)', borderRight: '1px solid rgba(255,255,255,0.1)' }} />
                    </React.Fragment>
                ))}
                {/* Score */}
                <div className="absolute top-2 left-0 right-0 flex justify-center">
                    <span className="text-white/40 font-mono" style={{ fontSize: 11 * sx }}>{score}</span>
                </div>
                {/* Overlay */}
                {gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}>
                        <span style={{ fontSize: `${16 * scale}px` }}>💥</span>
                        <span className="text-white font-bold" style={{ fontSize: `${13 * scale}px`, margin: `${4 * scale}px 0` }}>{mode === 'Autoplay' ? 'Bot Crashed!' : 'Game Over'}</span>
                        <button onClick={onRestart} className="rounded-xl font-medium text-white bg-white/10 border border-white/15 transition-all active:scale-95"
                            style={{ padding: `${7 * scale}px ${16 * scale}px`, fontSize: `${10 * scale}px`, marginTop: `${6 * scale}px` }}>↩ Menu</button>
                    </div>
                )}
            </div>
            {mode === 'PvC' && !gameOver && (
                <span className="text-white/20" style={{ fontSize: `${9 * scale}px`, marginTop: `${4 * scale}px` }}>Tap to flap</span>
            )}
        </div>
    );
}

export default function FlappyBirdSkill() {
    return (
        <GameShell gameId="game_flappy" gameName="Flappy Bird" gameIcon="🐦" storageKey="cluaiz_flappy_highscore" hasDifficulty={true} hasCvC={false}>
            {(props) => <FlappyCanvas {...props} />}
        </GameShell>
    );
}
