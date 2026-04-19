/**
 * TicTacToe.tsx — Uses GameShell for common UI.
 * Only contains game board logic.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameShell, { GameMode, GameDifficulty, GameShellChildProps } from './GameShell';
import { getThemeAssets } from './BusinessThemeRig';

type Player = 'X' | 'O' | null;
const WINS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

function checkWin(b: Player[]): Player {
    for (const [a, c, d] of WINS) { if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a]; }
    return null;
}

function minimax(b: Player[], isMax: boolean, depth = 0): number {
    const w = checkWin(b);
    if (w === 'O') return 10 - depth;
    if (w === 'X') return depth - 10;
    if (b.every(Boolean)) return 0;
    const scores: number[] = [];
    b.forEach((v, i) => {
        if (v) return;
        b[i] = isMax ? 'O' : 'X';
        scores.push(minimax(b, !isMax, depth + 1));
        b[i] = null;
    });
    return isMax ? Math.max(...scores) : Math.min(...scores);
}

function getBest(b: Player[], symbol: 'O' | 'X'): number {
    const isMax = symbol === 'O';
    let bestScore = isMax ? -Infinity : Infinity;
    let move = -1;
    b.forEach((v, i) => {
        if (v) return;
        b[i] = symbol;
        const s = minimax(b, !isMax);
        b[i] = null;
        if (isMax ? s > bestScore : s < bestScore) { bestScore = s; move = i; }
    });
    return move;
}

// Mistake rate by difficulty
const MISTAKE_RATE: Record<GameDifficulty, number> = { easy: 0.5, medium: 0.2, hard: 0.02 };
// Think delay by difficulty
const THINK_MS: Record<GameDifficulty, [number, number]> = { easy: [1000, 2000], medium: [600, 1200], hard: [300, 700] };

function TTTCanvas({ mode, difficulty, scale, isPlaying, onScoreUpdate, onRestart }: GameShellChildProps) {
    const assets = getThemeAssets('ecommerce');
    const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [status, setStatus] = useState('');
    const [thinking, setThinking] = useState(false);
    const [wins, setWins] = useState(0);

    useEffect(() => { if (isPlaying) { setBoard(Array(9).fill(null)); setIsXNext(true); setStatus(''); setWins(0); } }, [isPlaying]);

    const getStatus = useCallback((b: Player[]): string => {
        const w = checkWin(b);
        if (w) return w === 'X' ? (mode === 'CvC' ? 'Bot X 🎉' : 'You Win! 🎉') : (mode === 'CvC' ? 'Bot O 🤖' : 'AI Wins 🤖');
        if (b.every(Boolean)) return "Draw 🤝";
        return '';
    }, [mode]);

    const makeAIMove = useCallback((b: Player[], sym: 'X' | 'O') => {
        setThinking(true);
        const [min, max] = THINK_MS[difficulty];
        setTimeout(() => {
            const nb = [...b];
            const empty = nb.map((v, i) => v ? -1 : i).filter(i => i !== -1);
            let move: number;
            if (Math.random() < MISTAKE_RATE[difficulty]) {
                move = empty[Math.floor(Math.random() * empty.length)];
            } else {
                move = getBest(nb, sym);
            }
            if (move === -1) { setThinking(false); return; }
            nb[move] = sym;
            const s = getStatus(nb);
            setBoard(nb);
            setIsXNext(sym === 'X');
            setStatus(s);
            setThinking(false);
            if (s && mode === 'PvC' && s.includes('You Win')) {
                const w = wins + 1; setWins(w); onScoreUpdate(w);
            }
        }, min + Math.random() * (max - min));
    }, [difficulty, wins, onScoreUpdate, getStatus, mode]);

    // After player clicks → AI responds; for CvC → loop
    useEffect(() => {
        if (!isPlaying || status || thinking) return;
        if (mode === 'CvC') {
            const sym: 'X' | 'O' = isXNext ? 'X' : 'O';
            makeAIMove(board, sym);
        } else if (!isXNext) {
            makeAIMove(board, 'O');
        }
    }, [board, isXNext, status, isPlaying, mode, thinking, makeAIMove]);

    const handleClick = (i: number) => {
        if (board[i] || status || thinking || mode === 'CvC' || !isXNext) return;
        const nb = [...board]; nb[i] = 'X';
        const s = getStatus(nb);
        setBoard(nb); setIsXNext(false); setStatus(s);
        if (s && s.includes('AI Wins')) { /* loss */ }
    };

    const reset = () => { setBoard(Array(9).fill(null)); setIsXNext(true); setStatus(''); };
    const px = (n: number) => `${n * scale}px`;
    const cellSize = Math.max(40, Math.min(80, (200 * scale) / 3));
    const winner = checkWin(board);
    const winLine = WINS.find(([a, c, d]) => board[a] && board[a] === board[c] && board[a] === board[d]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center" style={{ gap: px(12), padding: px(12) }}>
            {/* Board */}
            <div className="grid grid-cols-3" style={{ gap: px(4) }}>
                {board.map((cell, i) => (
                    <motion.button key={i} onClick={() => handleClick(i)}
                        whileTap={!cell && !status ? { scale: 0.92 } : {}}
                        className="rounded-xl flex items-center justify-center border transition-colors"
                        style={{
                            width: cellSize, height: cellSize,
                            background: winLine?.includes(i) ? (winner === 'X' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)') : 'rgba(255,255,255,0.04)',
                            borderColor: winLine?.includes(i) ? (winner === 'X' ? '#4ade8040' : '#f8717140') : 'rgba(255,255,255,0.07)',
                            cursor: !cell && !status && mode === 'PvC' && isXNext ? 'pointer' : 'default',
                        }}>
                        <AnimatePresence mode="wait">
                            {cell && (
                                <motion.span key={cell + i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                    style={{ fontSize: cellSize * 0.44, color: cell === 'X' ? '#93c5fd' : assets.glowColor, fontWeight: 800, lineHeight: 1 }}>
                                    {cell}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>
                ))}
            </div>

            {/* Status / Thinking */}
            <div className="flex items-center justify-center" style={{ height: px(24) }}>
                {thinking && !status && (
                    <div className="flex items-center" style={{ gap: px(3) }}>
                        {[0, 1, 2].map(j => (
                            <motion.div key={j} animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 0.7, repeat: Infinity, delay: j * 0.13 }}
                                className="rounded-full bg-white/30" style={{ width: px(4), height: px(4) }} />
                        ))}
                    </div>
                )}
                {status && (
                    <motion.span initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="text-white font-bold" style={{ fontSize: px(14) }}>{status}</motion.span>
                )}
                {!thinking && !status && (
                    <span className="text-white/30" style={{ fontSize: px(10) }}>
                        {mode === 'PvC' ? (isXNext ? 'Your turn' : "AI's turn") : 'Watching...'}
                    </span>
                )}
            </div>

            {status && (
                <button onClick={() => { reset(); if (mode === 'CvC') setIsXNext(true); }}
                    className="rounded-xl font-medium text-white bg-white/8 hover:bg-white/15 border border-white/10 transition-all active:scale-95"
                    style={{ padding: `${9 * scale}px ${20 * scale}px`, fontSize: px(12) }}>
                    🔄 Again
                </button>
            )}
        </div>
    );
}

export default function TicTacToeSkill() {
    return (
        <GameShell gameId="game_ttt" gameName="Tic-Tac-Toe" gameIcon="⚔️" storageKey="cluaiz_ttt_highscore" hasDifficulty={true} hasCvC={true}>
            {(props) => <TTTCanvas {...props} />}
        </GameShell>
    );
}
