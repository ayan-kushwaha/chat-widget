/**
 * RacingGameSkill.tsx — Uses GameShell for common UI.
 * Dodge obstacles — speed scales with difficulty.
 */
import React, { useState, useEffect, useRef } from 'react';
import GameShell, { GameShellChildProps, GameDifficulty } from './GameShell';
import { getThemeAssets } from './BusinessThemeRig';

const GW = 300, GH = 380, CW = 36, CH = 50, OW = 36, OH = 48;
const SPEED: Record<GameDifficulty, number> = { easy: 3, medium: 5, hard: 8 };

function RacingCanvas({ mode, difficulty, scale, dimensions, isPlaying, onScoreUpdate, onRestart }: GameShellChildProps) {
    const assets = getThemeAssets('ecommerce');
    const [carX, setCarX] = useState(130);
    const [obstacles, setObstacles] = useState<{ x: number; y: number }[]>([{ x: 120, y: -OH }]);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const carXRef = useRef(130);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isPlaying) { setCarX(130); carXRef.current = 130; setObstacles([{ x: 80, y: -OH }]); setGameOver(false); setScore(0); }
    }, [isPlaying]);

    // Game loop
    useEffect(() => {
        if (!isPlaying || gameOver) return;
        const sp = SPEED[difficulty];
        const interval = setInterval(() => {
            setScore(s => { const ns = s + 1; onScoreUpdate(ns); return ns; });
            setObstacles(prev => {
                let next = prev.map(o => ({ ...o, y: o.y + sp })).filter(o => o.y < GH + OH);
                // Spawn new obstacles
                if (!next.length || next[next.length - 1].y > GH * 0.4) {
                    next.push({ x: 20 + Math.random() * (GW - OW - 40), y: -OH });
                }
                // Collision
                const cx = carXRef.current, cy = GH - CH - 16;
                for (const o of next) {
                    if (cx < o.x + OW && cx + CW > o.x && cy < o.y + OH && cy + CH > o.y) {
                        setGameOver(true);
                    }
                }
                return next;
            });
            // Autoplay
            if (mode === 'CvC') {
                setObstacles(obs => {
                    const nearest = obs.find(o => o.y + OH > GH * 0.55 && o.y < GH - CH - 20);
                    if (nearest) {
                        const midCar = carXRef.current + CW / 2, midObs = nearest.x + OW / 2;
                        const aiSpeed = { easy: 3, medium: 5, hard: 7 }[difficulty];
                        const nx = midCar < midObs ? Math.max(0, carXRef.current - aiSpeed) : Math.min(GW - CW, carXRef.current + aiSpeed);
                        carXRef.current = nx;
                        setCarX(nx);
                    }
                    return obs;
                });
            }
        }, 20);
        return () => clearInterval(interval);
    }, [isPlaying, gameOver, difficulty, mode, onScoreUpdate]);

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (mode === 'CvC' || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const x = (clientX - rect.left) * (GW / rect.width) - CW / 2;
        const nx = Math.max(0, Math.min(GW - CW, x));
        carXRef.current = nx; setCarX(nx);
    };

    const boardW = Math.min(dimensions.width - 16, 300);
    const boardH = Math.min(dimensions.height - 56, 380);
    const sx = boardW / GW, sy = boardH / GH;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center" style={{ padding: `${6 * scale}px` }}>
            <div ref={containerRef} className="relative rounded-xl overflow-hidden cursor-none"
                onMouseMove={handleMove} onTouchMove={handleMove}
                style={{ width: boardW, height: boardH, background: '#0a0a10', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Road lines */}
                {[0.33, 0.67].map(frac => (
                    <div key={frac} className="absolute top-0 bottom-0 w-px" style={{ left: boardW * frac, background: 'rgba(255,255,255,0.06)', borderRight: '2px dashed rgba(255,255,255,0.1)' }} />
                ))}
                {/* Car */}
                <div className="absolute flex items-center justify-center" style={{ left: carX * sx, top: (GH - CH - 16) * sy, width: CW * sx, height: CH * sy, fontSize: CH * 0.7 * sx }}>🏎️</div>
                {/* Obstacles */}
                {obstacles.map((o, i) => (
                    <div key={i} className="absolute flex items-center justify-center" style={{ left: o.x * sx, top: o.y * sy, width: OW * sx, height: OH * sy, fontSize: OH * 0.7 * sx }}>🚧</div>
                ))}
                {/* Score overlay */}
                <div className="absolute top-2 right-3">
                    <span className="text-white/30 font-mono" style={{ fontSize: 10 * sx }}>{score}</span>
                </div>
                {/* Game Over */}
                {gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}>
                        <span style={{ fontSize: `${16 * scale}px` }}>💥</span>
                        <span className="text-red-400 font-bold" style={{ fontSize: `${13 * scale}px`, margin: `${4 * scale}px 0` }}>{mode === 'Autoplay' ? 'Bot Crashed!' : 'Crashed!'}</span>
                        <button onClick={onRestart} className="rounded-xl font-medium text-white bg-white/10 border border-white/15 transition-all active:scale-95"
                            style={{ padding: `${7 * scale}px ${16 * scale}px`, fontSize: `${10 * scale}px`, marginTop: `${6 * scale}px` }}>↩ Menu</button>
                    </div>
                )}
            </div>
            {mode === 'PvC' && !gameOver && (
                <span className="text-white/20" style={{ fontSize: `${9 * scale}px`, marginTop: `${4 * scale}px` }}>Move mouse / touch to steer</span>
            )}
        </div>
    );
}

export default function RacingGameSkill() {
    return (
        <GameShell gameId="game_racing" gameName="Racing" gameIcon="🏎️" storageKey="cluaiz_racing_highscore" hasDifficulty={true} hasCvC={false}>
            {(props) => <RacingCanvas {...props} />}
        </GameShell>
    );
}
