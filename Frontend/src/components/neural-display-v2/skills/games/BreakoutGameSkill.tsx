/**
 * BreakoutGameSkill.tsx — Uses GameShell for common UI.
 * Classic brick-breaker with paddle + ball physics.
 */
import React, { useState, useEffect, useRef } from 'react';
import GameShell, { GameShellChildProps, GameDifficulty } from './GameShell';
import { getThemeAssets } from './BusinessThemeRig';

const PW = 60, PH = 8, BR = 5, ROWS = 5, COLS = 8, BH = 12;
const SPEED_Y: Record<GameDifficulty, number> = { easy: 2.2, medium: 3.2, hard: 4.5 };

function BreakoutCanvas({ mode, difficulty, scale, dimensions, isPlaying, onScoreUpdate, onRestart }: GameShellChildProps) {
    const assets = getThemeAssets('ecommerce');
    const GW = 300; const GH = 380;
    const [paddleX, setPaddleX] = useState(120);
    const [ball, setBall] = useState({ x: 150, y: 320 });
    const [vel, setVel] = useState({ x: 2, y: -SPEED_Y[difficulty] });
    const [bricks, setBricks] = useState<boolean[]>(Array(ROWS * COLS).fill(true));
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [score, setScore] = useState(0);
    const areaRef = useRef<HTMLDivElement>(null);

    const reset = () => {
        setPaddleX(120); setBall({ x: 150, y: 320 }); setVel({ x: 2, y: -SPEED_Y[difficulty] });
        setBricks(Array(ROWS * COLS).fill(true)); setGameOver(false); setWon(false); setScore(0);
    };
    useEffect(() => { if (isPlaying) reset(); }, [isPlaying]);

    // Autoplay: paddle tracks ball
    useEffect(() => {
        if (mode !== 'Autoplay' || !isPlaying || gameOver || won) return;
        // Add slight delay / imperfection by difficulty
        const lag = { easy: 0.2, medium: 0.5, hard: 0.85 }[difficulty];
        setPaddleX(px => px + (ball.x - BR - px - PW / 2) * lag);
    }, [ball, mode, difficulty, isPlaying, gameOver, won]);

    // Game loop
    useEffect(() => {
        if (!isPlaying || gameOver || won) return;
        const interval = setInterval(() => {
            setBall(prev => {
                let nx = prev.x + vel.x, ny = prev.y + vel.y;
                let vx = vel.x, vy = vel.y;
                if (nx <= BR || nx >= GW - BR) vx *= -1;
                if (ny <= BR) vy *= -1;
                // Paddle
                const px = mode === 'Autoplay' ? prev.x - BR - PW / 2 : paddleX;
                if (ny >= GH - PH - BR && ny <= GH && nx >= paddleX && nx <= paddleX + PW) {
                    vy = -Math.abs(vy);
                    const hit = (nx - (paddleX + PW / 2)) / (PW / 2);
                    vx = hit * 3;
                }
                // Floor
                if (ny >= GH) { setGameOver(true); return prev; }
                // Bricks
                const bW = GW / COLS;
                let hitBrick = false;
                const nb = [...bricks];
                for (let i = 0; i < bricks.length; i++) {
                    if (!bricks[i]) continue;
                    const r = Math.floor(i / COLS), c = i % COLS;
                    const bx = c * bW, by = r * BH + 40;
                    if (nx + BR > bx && nx - BR < bx + bW && ny + BR > by && ny - BR < by + BH) {
                        nb[i] = false; vy *= -1;
                        const ns = score + 10; setScore(ns); onScoreUpdate(ns);
                        hitBrick = true; break;
                    }
                }
                if (hitBrick) { setBricks(nb); if (nb.every(b => !b)) setWon(true); }
                setVel({ x: vx, y: vy });
                return { x: nx, y: ny };
            });
        }, 16);
        return () => clearInterval(interval);
    }, [isPlaying, gameOver, won, vel, bricks, paddleX, score, mode, onScoreUpdate]);

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (mode === 'Autoplay' || !areaRef.current) return;
        const rect = areaRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const x = (clientX - rect.left) * (GW / rect.width);
        setPaddleX(Math.max(0, Math.min(GW - PW, x - PW / 2)));
    };

    const boardW = Math.min(dimensions.width - 16, 300);
    const boardH = Math.min(dimensions.height - 56, 380);
    const sx = boardW / GW, sy = boardH / GH;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center" style={{ padding: `${6 * scale}px` }}>
            <div ref={areaRef} className="relative rounded-xl overflow-hidden"
                onMouseMove={handleMove} onTouchMove={handleMove}
                style={{ width: boardW, height: boardH, background: '#08080f', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Bricks */}
                {bricks.map((active, i) => {
                    const r = Math.floor(i / COLS), c = i % COLS;
                    return active ? (
                        <div key={i} className="absolute transition-opacity duration-200"
                            style={{ left: (c * GW / COLS) * sx, top: (r * BH + 40) * sy, width: (GW / COLS) * sx - 2, height: BH * sy - 1, background: assets.glowColor, borderRadius: 2, opacity: 0.7 + r * 0.06 }} />
                    ) : null;
                })}
                {/* Paddle */}
                <div className="absolute rounded-full" style={{ left: paddleX * sx, bottom: 20 * sy, width: PW * sx, height: PH * sy, background: '#ffffff', boxShadow: '0 0 12px rgba(255,255,255,0.6)' }} />
                {/* Ball */}
                <div className="absolute rounded-full" style={{ left: ball.x * sx - BR * sx, top: ball.y * sy - BR * sy, width: BR * 2 * sx, height: BR * 2 * sy, background: '#f87171', boxShadow: '0 0 8px #f87171' }} />
                {/* Overlay */}
                {(gameOver || won) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}>
                        <span style={{ fontSize: `${16 * scale}px` }}>{won ? '🏆' : '💥'}</span>
                        <span className="text-white font-bold" style={{ fontSize: `${13 * scale}px`, margin: `${4 * scale}px 0` }}>{won ? 'You Won!' : (mode === 'Autoplay' ? 'Bot Lost!' : 'Game Over')}</span>
                        <button onClick={onRestart} className="rounded-xl font-medium text-white bg-white/10 border border-white/15 transition-all active:scale-95"
                            style={{ padding: `${7 * scale}px ${16 * scale}px`, fontSize: `${10 * scale}px`, marginTop: `${6 * scale}px` }}>↩ Menu</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BreakoutGameSkill() {
    return (
        <GameShell gameId="game_breakout" gameName="Breakout" gameIcon="🧱" storageKey="cluaiz_breakout_highscore" hasDifficulty={true} hasCvC={false}>
            {(props) => <BreakoutCanvas {...props} />}
        </GameShell>
    );
}
