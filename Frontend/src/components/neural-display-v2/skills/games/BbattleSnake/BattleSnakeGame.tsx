/**
 * BattleSnakeGame.tsx — Slim orchestrator component.
 * All logic lives in: types.ts, constants.ts, helpers.ts, aiLogic.ts, renderer.ts
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RotateCcw, Home, Play, Pause, X, ArrowLeft,
    Monitor, Cpu, Check, Map as MapIcon, Globe
} from 'lucide-react';
import TargetCursor from '@/components/BitsUI/TargetCursor';
import { LottieEmoji } from '@/components/global/LottieEmoji';
import { EmojiMeta } from '@/assets/emogy/EmojiMeta';
import { GameShellChildProps } from '../GameShell';
import { GameState, Vec2, SnakeEntity, Orb, FoodType, EffectType, ActiveEffect } from './types';
import { SPEED_BY_DIFF, INITIAL_LENGTH, AIR_TURN_RATE, AI_UPDATE_MS, WORLD_SIZE_BY_DIFF, BOT_COUNT_BY_DIFF, FOOD_DENSITY, MIN_LENGTH_FOR_BOOST, BOOST_SPEED_MULT_ULTRA, BOOST_SPEED_MULT_T0, BOOST_SPEED_MULT_T1, BOOST_SPEED_MULT_T2, BOOST_SPEED_MULT_T3, BOOST_SPEED_MULT_T4, BOOST_COST_TICKS, SNAKE_COLORS, SEGMENT_SPACING, GLOBAL_SPEED_ACCEL, MAX_GLOBAL_SPEED_MULT, ZONE_STEPS_BY_DIFF } from './constants';
import { normalize, lerp, lerpVec, makeSnake, spawnOrb, dist, mapFoodToEffect, getFoodScore, getFoodTier } from './helpers';
import { computeAIDir, killSnake } from './aiLogic';
import { computeHumanPlayerDir, resetHumanPlayerState, getDeathMessage, getWinMessage, type DeathReason } from './aiPlayer';
import { triggerReaction, type ReactionType } from './EmojiReactions';
import { initZone, updateZone, applyZoneDamage } from './zone';
import { FOOD_REGISTRY, getRandomFoodType } from './food';
import {
    drawBackground, drawSnake, drawOrb, drawParticles,
    drawKillFeed, drawCountdown, drawFogOfWar, drawFloatingTexts, isReplayButtonClick, isMenuButtonClick, drawMiniMap
} from './renderer';
import { soundManager } from './SoundManager';

const STARTS = [
    { pos: { x: 0.5, y: 0.5 }, dir: { x: 1, y: 0 } },
    { pos: { x: 0.25, y: 0.25 }, dir: normalize({ x: 1, y: 1 }) },
    { pos: { x: 0.75, y: 0.25 }, dir: normalize({ x: -1, y: 1 }) },
    { pos: { x: 0.25, y: 0.75 }, dir: normalize({ x: 1, y: -1 }) },
    { pos: { x: 0.75, y: 0.75 }, dir: normalize({ x: -1, y: -1 }) },
];

/** Sync canvas attribute size to its actual CSS pixel size (DPR-aware). */
function fitCanvas(canvas: HTMLCanvasElement, isTiny: boolean, res: string = 'FHD') {
    const dpr = window.devicePixelRatio || 1;
    let multiplier = 1;

    // Resolution scaling
    if (res === 'HD') multiplier = 0.75;
    if (res === 'FHD') multiplier = 1.0;
    if (res === 'UHD') multiplier = 1.5;
    if (res === '4K') multiplier = 2.0;

    // Fix: Restore the 3x base factor for tiny widgets to ensure perfect sharpness
    const resFactor = isTiny ? 3 : 1;
    const finalDpr = dpr * multiplier * resFactor;

    canvas.width = canvas.clientWidth * finalDpr;
    canvas.height = canvas.clientHeight * finalDpr;
}

export default function BattleSnakeGame({
    mode, difficulty, volume, scale, isTiny, dimensions,
    isZoneEnabled, zoneDurationMinutes, isPlaying,
    onScoreUpdate, onStatusUpdate, onRestart, onGameOver,
    mapSettings, graphicsSettings, isPaused, // Received from GameShell
    setFps, setResolution, setIsPaused // Destructure setters
}: GameShellChildProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef<GameState | null>(null);
    const [gameOverState, setGameOverState] = useState(false);
    const [isWinnerState, setIsWinnerState] = useState(false);
    const [aiMessage, setAiMessage] = useState<string | null>(null);
    const scoreRef = useRef(0);
    const scoreUpdateRef = useRef(onScoreUpdate);
    scoreUpdateRef.current = onScoreUpdate;

    const lastZoneStatusRef = useRef<string | null>(null);
    const lastFrameTimeRef = useRef(0); // For FPS limiting

    // Sync volume from GameShell to SoundManager
    useEffect(() => {
        soundManager.setVolume(volume);
    }, [volume]);

    const initGame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        fitCanvas(canvas, isTiny, graphicsSettings.resolution);
        const dpr = window.devicePixelRatio || 1;
        const W = canvas.clientWidth || canvas.width / dpr;
        const H = canvas.clientHeight || canvas.height / dpr;
        const speed = SPEED_BY_DIFF[difficulty];
        // Fix Tiny Mode scaling: snake was becoming too small (0.018), increase to 0.045 for tiny mode
        const radiusMultiplier = isTiny ? 0.050 : 0.015;
        const radius = Math.max(4, Math.min(10, Math.min(W, H) * radiusMultiplier));

        const worldSize = WORLD_SIZE_BY_DIFF[difficulty];
        // AI_PLAYER = same bot count as PvC (AI controls the "player" snake among full swarm)
        // CvC = all bots, no player. PvC = player + bots.
        const finalBotCount = mode === 'CvC'
            ? BOT_COUNT_BY_DIFF[difficulty]
            : BOT_COUNT_BY_DIFF[difficulty] - 1; // PvC and AI_PLAYER both get full swarm

        const snakes: SnakeEntity[] = [];

        // Player (PvC or AI_PLAYER) or first AI (CvC)
        snakes.push(makeSnake(
            0,
            { x: worldSize * 0.5, y: worldSize * 0.5 },
            { x: 1, y: 0 },
            mode === 'PvC' || mode === 'AI_PLAYER',
            speed,
            radius
        ));

        // Swarm (skipped entirely for AI_PLAYER)
        for (let i = 0; i < finalBotCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            snakes.push(makeSnake(
                i + 1,
                { x: Math.random() * worldSize, y: Math.random() * worldSize },
                { x: Math.cos(angle), y: Math.sin(angle) },
                false,
                speed,
                radius * (Math.random() * 0.4 + 0.8)
            ));
        }

        const orbCount = Math.floor(worldSize * worldSize * FOOD_DENSITY);

        // Initial zone setup (matches state allocation)
        const initialZone = isZoneEnabled ? initZone(worldSize, worldSize, zoneDurationMinutes, ZONE_STEPS_BY_DIFF[difficulty]) : undefined;

        // Spawn orbs within initial zone if it exists
        const orbs = Array.from({ length: orbCount }, () => spawnOrb(worldSize, worldSize, 40, undefined, initialZone));
        scoreRef.current = 0;

        stateRef.current = {
            snakes, orbs, killFeed: [], particles: [], floatingTexts: [],
            score: 0, frame: 0, gameOver: false,
            countdown: 3,
            countdownStartTime: performance.now(),
            orbLimit: orbCount,
            lastAIUpdate: 0,
            globalSpeedFactor: 1.0,
            nextSpecialOrbTime: performance.now() + 5000,
            mouseDir: null, touchDir: null, touchStart: null, keyDir: null,
            inputBoosting: 1 as (0 | 1 | 2 | 3 | 4 | 5),
            turboActive: false,
            lastMouseWorldPos: null,
            keyHoldStartTime: 0,
            isWinner: false,
            camera: { x: worldSize * 0.5, y: worldSize * 0.5, zoom: 1 },
            world: { width: worldSize, height: worldSize },
            zone: initialZone,
            gasParticles: [],
            miniMap: {
                show: mapSettings.show,
                opacity: mapSettings.opacity,
                position: mapSettings.position
            }
        };
    }, [difficulty, mode, isZoneEnabled, zoneDurationMinutes, isTiny]); // Removed dynamic settings to prevent resets

    // Sync Map Settings without resetting game
    useEffect(() => {
        if (stateRef.current) {
            stateRef.current.miniMap = { ...mapSettings };
        }
    }, [mapSettings]);

    // Sync Resolution/Canvas without resetting game
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            fitCanvas(canvas, isTiny, graphicsSettings.resolution);
        }
    }, [graphicsSettings.resolution, isTiny]);

    // Track last mode to detect changes mid-game
    const lastModeRef = useRef<string>(mode);

    // ── Game loop ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isPlaying) {
            stateRef.current = null;
            lastModeRef.current = mode;
            return;
        }

        // Force reinit if mode changed (e.g. Player → AI → Player)
        const modeChanged = lastModeRef.current !== mode;
        lastModeRef.current = mode;

        if (!stateRef.current || modeChanged) {
            setGameOverState(false);
            setIsWinnerState(false);
            setAiMessage(null);
            resetHumanPlayerState();
            stateRef.current = null; // Ensure clean reinit
            initGame();
        }
        const canvas = canvasRef.current;
        if (!canvas) return;
        let rafId = 0;

        // Re-fit canvas if container resizes mid-game
        const ro = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                // Store the actual layout size to avoid transform-scaled blur
                (canvas as any).layoutWidth = entry.contentRect.width;
                (canvas as any).layoutHeight = entry.contentRect.height;
                fitCanvas(canvas, isTiny, graphicsSettings.resolution);
            }
        });
        ro.observe(canvas);

        const tick = (timestamp: number) => {
            const st = stateRef.current;
            const ctx = canvas.getContext('2d');
            if (!st || !ctx) return;

            // Sync React settings to game state for renderer
            st.miniMap.show = mapSettings.show;
            st.miniMap.opacity = mapSettings.opacity;
            st.miniMap.position = mapSettings.position;
            st.miniMap.isTiny = isTiny;

            // FPS Limiting and Pause
            const now = performance.now();
            const delta = now - lastFrameTimeRef.current;
            const targetMs = 1000 / graphicsSettings.fps;

            if (delta < targetMs && !isPaused) {
                rafId = requestAnimationFrame(tick);
                return;
            }
            lastFrameTimeRef.current = now - (delta % targetMs); // Adjust for frame drops

            // DPR and Resolution Scaling sync
            const dpr = window.devicePixelRatio || 1;
            const multiplier = graphicsSettings.resolution === 'HD' ? 0.75 : graphicsSettings.resolution === 'UHD' ? 1.5 : graphicsSettings.resolution === '4K' ? 2.0 : 1.0;
            const resFactor = isTiny ? 3 : 1;
            const finalDpr = dpr * multiplier * resFactor;

            // Logical dimensions for both Logic AND Render
            let W = canvas.width / finalDpr;
            let H = canvas.height / finalDpr;
            const VW = st.world.width;
            const VH = st.world.height;
            const viewportSpeedMult = 1.0;

            // ONLY execute physics/logic if NOT paused and NOT over
            if (!isPaused && !st.gameOver) {
                // Push online status to shell header
                const onlineCount = st.snakes.filter(s => !s.isDead).length;
                onStatusUpdate(`🐍 ${onlineCount} online`);

                // Zone Sound Trigger
                if (st.zone) {
                    if (st.zone.status.includes('Started') && lastZoneStatusRef.current && !lastZoneStatusRef.current.includes('Started')) {
                        // One-shot alarm sound when shrinking starts
                        soundManager.playAlarm();
                    }
                    lastZoneStatusRef.current = st.zone.status;
                }

                st.frame++;

                // Handle Countdown
                if (st.countdown !== null) {
                    const elapsed = (timestamp - st.countdownStartTime) / 1000;
                    st.countdown = 3 - Math.floor(elapsed);
                    if (st.countdown <= 0) {
                        st.countdown = null;
                    }
                }

                if (!st.gameOver && st.countdown === null) {
                    // Shrink out-of-bounds Zone and apply tick damage
                    if (st.zone) {
                        // 1. Zone logic (Shrinking & Damage)
                        updateZone(st, 1000 / 60); // Approximate 60fps delta
                        if (applyZoneDamage(st, now)) {
                            soundManager.playAlarm();
                        }

                        // 2. Smoke/Gas Particle Spawn
                        if (!st.zone.isPaused) {
                            if (st.gasParticles && st.frame % 4 === 0) {
                                const angle = Math.random() * Math.PI * 2;
                                // Spawn around current zone radius
                                const dist = st.zone.currentRadius + (Math.random() - 0.2) * 300;

                                const colors = ['#ff3030', '#4ade80', '#ffffff', '#facc15']; // Red, Green, White, Yellow
                                const color = colors[Math.floor(Math.random() * colors.length)];

                                st.gasParticles.push({
                                    pos: {
                                        x: st.world.width / 2 + Math.cos(angle) * dist,
                                        y: st.world.height / 2 + Math.sin(angle) * dist
                                    },
                                    vel: { x: (Math.random() - 0.5) * 1, y: (Math.random() - 0.5) * 1 },
                                    size: 80 + Math.random() * 150,
                                    alpha: 0.1 + Math.random() * 0.15,
                                    life: 1.0,
                                    color: color
                                });
                            }
                        }

                        if (st.gasParticles) {
                            for (let i = st.gasParticles.length - 1; i >= 0; i--) {
                                const p = st.gasParticles[i];
                                p.pos.x += p.vel.x;
                                p.pos.y += p.vel.y;
                                p.life -= 0.003;
                                if (p.life <= 0) st.gasParticles.splice(i, 1);
                            }
                        }
                    }

                    // Determine player boost state
                    const player = st.snakes.find(s => s.isPlayer && !s.isDead);
                    if (player) {
                        const hasEffect = (t: string) => player.activeEffects.some(e => e.type === t);

                        if (mode === 'AI_PLAYER') {
                            // Human-like AI takes over player in AI_PLAYER mode
                            const { dir: humanDir, shouldBoost } = computeHumanPlayerDir(
                                st, player, st.snakes, st.orbs, VW, VH, difficulty, now
                            );
                            player.targetDir = humanDir;
                            // Human AI boost decision
                            if (shouldBoost && player.body.length > 20) {
                                st.inputBoosting = 2; // Medium boost
                            } else {
                                st.inputBoosting = 1; // Normal speed
                            }
                        } else {
                            const inp = st.mouseDir ?? st.touchDir ?? st.keyDir;
                            if (inp) player.targetDir = inp;
                        }

                        player.isBoosting = st.inputBoosting > 0 && player.body.length > MIN_LENGTH_FOR_BOOST;
                        player.boostTier = st.inputBoosting;
                        soundManager.setBoostActive(player.isBoosting);

                        // Camera tracks player
                        st.camera.x = lerp(st.camera.x, player.body[0].x, 0.1);
                        st.camera.y = lerp(st.camera.y, player.body[0].y, 0.1);
                    } else if (!st.snakes.every(s => s.isDead)) {
                        // Camera tracks highest scoring AI if player dead or CvC
                        const leader = [...st.snakes].filter(s => !s.isDead).sort((a, b) => b.kills - a.kills)[0];
                        if (leader) {
                            st.camera.x = lerp(st.camera.x, leader.body[0].x, 0.05);
                            st.camera.y = lerp(st.camera.y, leader.body[0].y, 0.05);
                        }
                    }

                    // Dynamic Camera Zoom
                    let targetZoom = isTiny ? 0.4 : 1;

                    // Zoom Out Effect: Telescope or Fog of War item
                    const playerForZoom = st.snakes.find(s => s.isPlayer && !s.isDead);
                    if (playerForZoom?.activeEffects.some(e => e.type === 'zoom_out' || e.type === 'fog_of_war')) {
                        targetZoom *= 0.5;
                    }

                    st.camera.zoom = lerp(st.camera.zoom, targetZoom, 0.05);

                    // ── Global Speed Scaling ──
                    // DISABLED: st.globalSpeedFactor = Math.min(MAX_GLOBAL_SPEED_MULT, st.globalSpeedFactor + GLOBAL_SPEED_ACCEL);

                    // Camera Clamping: Constrain camera center so it doesn't show void
                    // If viewport is larger than world, center the camera
                    const halfVW = (W / st.camera.zoom) / 2;
                    const halfVH = (H / st.camera.zoom) / 2;

                    if (halfVW * 2 >= VW) {
                        st.camera.x = VW / 2;
                    } else {
                        st.camera.x = Math.max(halfVW, Math.min(VW - halfVW, st.camera.x));
                    }

                    if (halfVH * 2 >= VH) {
                        st.camera.y = VH / 2;
                    } else {
                        st.camera.y = Math.max(halfVH, Math.min(VH - halfVH, st.camera.y));
                    }

                    // ── AI THINK: Staggered Strategy ──
                    // Instead of update ALL bots at once (lag spike), we offset them by their unique thinkOffset.
                    for (const sn of st.snakes) {
                        if (sn.isDead || sn.isPlayer) continue; // Player AI is handled above
                        if (sn.lastThinkTime + AI_UPDATE_MS + sn.thinkOffset > now) continue;
                        sn.targetDir = computeAIDir(st, sn, st.snakes, st.orbs, VW, VH, difficulty);
                        sn.lastThinkTime = now;
                    }

                    // Move & Boost Rules
                    for (const sn of st.snakes) {
                        if (sn.isDead) continue;

                        // Frozen Effect: Complete Stop
                        const isFrozen = sn.activeEffects.some(e => e.type === 'frozen');
                        if (isFrozen) {
                            sn.targetDir = { ...sn.dir }; // Lock dir
                        }

                        sn.dir = normalize(lerpVec(sn.dir, sn.targetDir, AIR_TURN_RATE));

                        // Speed tier is set exclusively by mouse/touch/keyboard input events.
                        // No per-frame proximity override: whatever tier was last set by user stays locked.

                        // Proximity-based speed system & Freeze Aura
                        let boostMult = 1.0;

                        // Freeze Aura: If ANY other snake nearby is frozen, slow down
                        const auraRadius = 200;
                        const nearFrozenSnake = st.snakes.some(other =>
                            other !== sn && !other.isDead &&
                            other.activeEffects.some(e => e.type === 'frozen') &&
                            dist(sn.body[0], other.body[0]) < auraRadius
                        );

                        if (nearFrozenSnake) {
                            boostMult = 0.5; // Slowed by nearby ice snake
                        } else if (sn.isPlayer) {
                            const tier = st.inputBoosting;
                            if (tier === 5) boostMult = BOOST_SPEED_MULT_ULTRA; // 0.2x (Body/Tail)
                            else if (tier === 0) boostMult = BOOST_SPEED_MULT_T0;    // 0.5x (Precision)
                            else if (tier === 1) boostMult = BOOST_SPEED_MULT_T1;    // 1.0x (Normal)
                            else if (tier === 2) boostMult = BOOST_SPEED_MULT_T2;    // 1.5x (Fast)
                            else if (tier === 3) boostMult = BOOST_SPEED_MULT_T3;    // 2.0x (Rush)
                            else if (tier === 4) boostMult = BOOST_SPEED_MULT_T4;    // 2.5x (Max)
                            else boostMult = BOOST_SPEED_MULT_T1;
                        } else if (sn.isBoosting) {
                            boostMult = Math.min(1.5, 1.0 + sn.boostTier * 0.25);
                        }

                        // Apply Global Speed Factor (Fixed at 1.0)
                        let currentSpeed = sn.speed * viewportSpeedMult * boostMult * st.globalSpeedFactor;

                        // Force zero speed if frozen
                        if (isFrozen) currentSpeed = 0;

                        if (sn.isBoosting) {
                            let drainAmount = 0;
                            if (sn.boostTier === 3) drainAmount = 1.1; // 2.0x speed
                            else if (sn.boostTier >= 4) drainAmount = 1.15; // 2.5x speed

                            // Only apply drain if 2.0x or higher
                            if (drainAmount > 0) {
                                const costTicks = BOOST_COST_TICKS;
                                if (st.frame % costTicks === 0) {
                                    if (sn.targetLength > MIN_LENGTH_FOR_BOOST) {
                                        sn.targetLength -= drainAmount;
                                        const tail = sn.body[sn.body.length - 1];
                                        if (tail && Math.random() < 0.2) {
                                            // Drop poop orb sometimes - cap total orbs at 1.5x limit
                                            if (st.orbs.length < st.orbLimit * 1.5) {
                                                st.orbs.push({ ...spawnOrb(VW, VH), pos: { x: tail.x, y: tail.y }, color: sn.color });
                                            }
                                        }
                                        if (sn.isPlayer) {
                                            scoreRef.current = Math.max(0, Math.floor(scoreRef.current - drainAmount * 5));
                                            st.score = scoreRef.current;
                                            scoreUpdateRef.current(scoreRef.current);
                                        }
                                        sn.score = Math.max(0, Math.floor(sn.score - drainAmount * 5));
                                    }
                                }
                            }
                        }

                        const head = sn.body[0];
                        const oldX = head.x, oldY = head.y;
                        const nextX = head.x + sn.dir.x * currentSpeed;
                        const nextY = head.y + sn.dir.y * currentSpeed;

                        // WALL COLLISION: Margin reduced to 2 for "touching" feel
                        const margin = 2;
                        if (nextX < margin || nextX > VW - margin || nextY < margin || nextY > VH - margin) {
                            const scoreDelta = killSnake(st, sn, null, 'wall', VW, VH);
                            continue;
                        }

                        head.x = nextX;
                        head.y = nextY;

                        // Robust Interpolation logic for segments
                        const moveDist = Math.max(0.1, currentSpeed); // Safeguard against zero speed hang
                        let consumed = 0;
                        while (sn.distanceAccumulator + (moveDist - consumed) >= SEGMENT_SPACING) {
                            const neededForNext = SEGMENT_SPACING - sn.distanceAccumulator;
                            const ratio = (consumed + neededForNext) / moveDist;

                            const sx = lerp(oldX, nextX, ratio);
                            const sy = lerp(oldY, nextY, ratio);

                            sn.body.splice(1, 0, { x: sx, y: sy });

                            consumed += neededForNext;
                            sn.distanceAccumulator = 0;
                        }
                        sn.distanceAccumulator += (moveDist - consumed);

                        // Maintain target length strictly — BUFFER: trim only when clearly exceeded
                        // This prevents visual shrink when speed causes rapid segment insertion
                        const targetLen = Math.floor(sn.targetLength);
                        while (sn.body.length > targetLen + 2) {
                            sn.body.pop();
                        }

                        // High-Power Radius Scaling (Boss Feel) - TIGHTENED to prevent screen-filling
                        // Fix Tiny Mode scaling: larger multiplier so it doesn't shrink into a dot
                        const radiusMultiplier = isTiny ? 0.045 : 0.018;
                        const baseR = Math.max(4, Math.min(10, Math.min(W, H) * radiusMultiplier));
                        const growthFactor = (sn.targetLength - INITIAL_LENGTH) * 0.005;
                        const targetR = Math.min(baseR * 2.5, baseR * (1 + growthFactor));
                        sn.radius = lerp(sn.radius, targetR, 0.05);
                    }

                    // Collisions (only check if nearby)
                    for (let i = 0; i < st.snakes.length; i++) {
                        const sn = st.snakes[i];
                        if (sn.isDead) continue;

                        // Cleanup expired effects
                        sn.activeEffects = sn.activeEffects.filter(e => e.endTime > timestamp);

                        const head = sn.body[0];

                        // Magnet Support: Pull orbs toward head
                        if (sn.activeEffects.some(e => e.type === 'magnet')) {
                            for (const orb of st.orbs) {
                                const d = dist(head, orb.pos);
                                if (d < 400) {
                                    orb.pos.x += (head.x - orb.pos.x) * 0.1;
                                    orb.pos.y += (head.y - orb.pos.y) * 0.1;
                                }
                            }
                        }

                        // Optimization: Only check collision if camera is somewhat near (culling swarms far away)
                        const dCamX = head.x - st.camera.x;
                        const dCamY = head.y - st.camera.y;
                        if (Math.sqrt(dCamX * dCamX + dCamY * dCamY) > 2000) continue;

                        for (let j = 0; j < st.snakes.length; j++) {
                            if (i === j) continue;
                            const other = st.snakes[j];
                            if (other.isDead || other.body.length === 0) continue;

                            // Broad phase (Camera visibility)
                            const dCamOtherX = other.body[0].x - st.camera.x;
                            const dCamOtherY = other.body[0].y - st.camera.y;
                            if (Math.sqrt(dCamOtherX * dCamOtherX + dCamOtherY * dCamOtherY) > 2000) continue;

                            // Broad phase (Entity distance optimization)
                            const dx = Math.abs(head.x - other.body[0].x);
                            const dy = Math.abs(head.y - other.body[0].y);
                            const maxReach = other.body.length * SEGMENT_SPACING + 100;
                            if (dx > maxReach || dy > maxReach) continue;

                            // Ghost Mode check: Skip body collisions if ghosting
                            if (sn.activeEffects.some(e => e.type === 'ghost')) continue;


                            // head-on-head
                            const od = dist(head, other.body[0]);
                            if (od < sn.radius + other.radius) {
                                let sd = 0;
                                if (sn.body.length <= other.body.length) {
                                    sd = killSnake(st, sn, other, 'headshot', VW, VH);
                                    if (sd >= 0) other.lastKillTime = timestamp;
                                }
                                if (other.body.length <= sn.body.length) {
                                    const sd2 = killSnake(st, other, sn, 'headshot', VW, VH);
                                    if (sd2 >= 0) sn.lastKillTime = timestamp;
                                    if (sd2 > sd) sd = sd2;
                                }
                                if (sd > 0) {
                                    sn.score += sd;
                                    triggerReaction(st, sn.body[0], 'kill', isTiny);
                                    if (sn.isPlayer) {
                                        scoreRef.current += sd;
                                        st.score = scoreRef.current;
                                        scoreUpdateRef.current(scoreRef.current);
                                    }
                                }
                                continue;
                            }

                            // head-to-body
                            const start = 1;
                            for (let k = start; k < other.body.length; k += 2) { // Skip every other segment to double perf
                                if (dist(head, other.body[k]) < sn.radius + other.radius * 0.7) {
                                    const sd = killSnake(st, sn, other, 'bite', VW, VH);
                                    if (sd >= 0) {
                                        other.lastKillTime = timestamp;
                                        sn.score += sd;
                                        triggerReaction(st, sn.body[0], 'kill', isTiny);
                                        if (sn.isPlayer) {
                                            scoreRef.current += sd;
                                            st.score = scoreRef.current;
                                            scoreUpdateRef.current(scoreRef.current);
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    }

                    // Eat orbs (Optimized: Skip distant bots to remove hitch)
                    for (const sn of st.snakes) {
                        if (sn.isDead) continue;

                        // Far-away bots don't need frame-perfect eating
                        if (!sn.isPlayer) {
                            const distToCamX = Math.abs(sn.body[0].x - st.camera.x);
                            const distToCamY = Math.abs(sn.body[0].y - st.camera.y);
                            if (distToCamX > 1500 || distToCamY > 1500) {
                                if (st.frame % 10 !== 0) continue; // Only check every 10 frames
                            }
                        }

                        const head = sn.body[0];
                        for (let i = st.orbs.length - 1; i >= 0; i--) {
                            const orb = st.orbs[i];

                            // Fast Manhattan distance check first
                            const dx = Math.abs(head.x - orb.pos.x);
                            const dy = Math.abs(head.y - orb.pos.y);
                            if (dx > sn.radius + orb.radius + 3 || dy > sn.radius + orb.radius + 3 || orb.isDissolving) continue;

                            const od = dist(head, orb.pos);
                            if (od < sn.radius + orb.radius + 3) {
                                st.orbs.splice(i, 1);
                                const growth = getFoodScore(orb.type);
                                sn.targetLength = Math.max(INITIAL_LENGTH, sn.targetLength + growth);
                                const scoreAdd = Math.round(Math.abs(growth) * 10);
                                sn.score += scoreAdd;
                                sn.lastEatTime = timestamp; // Trigger swell

                                // 💣 Bomb Hazard: Instant death
                                if (orb.type === 'bomb') {
                                    triggerReaction(st, head, 'hazard_bomb', isTiny);
                                    killSnake(st, sn, null, 'bomb', VW, VH);
                                    break;
                                }

                                // Floating text for feedback
                                st.floatingTexts.push({
                                    id: Math.random(),
                                    pos: { x: head.x, y: head.y - 20 },
                                    text: (growth > 0 ? '+' : '') + Math.round(growth * 10),
                                    color: growth >= 0 ? '#4ade80' : '#f87171',
                                    life: 1.0
                                });

                                // Spectator Audio: Track whichever snake the camera is following
                                const leader = [...st.snakes].filter(s => !s.isDead).sort((a, b) => b.kills - a.kills)[0];
                                const player = st.snakes.find(s => s.isPlayer && !s.isDead);
                                const followed = (mode === 'PvC' && player) ? player : leader;

                                if (followed && sn.id === followed.id) {
                                    // Rate limit audio to avoid hitch
                                    if (st.frame % 2 === 0) {
                                        soundManager.playEatSound(getFoodTier(orb.type));
                                    }
                                }

                                // Standard orbs are replaced immediately to maintain density
                                // Always spawn new orbs within safe zone context
                                if (orb.type === 'orb') {
                                    st.orbs.push(spawnOrb(VW, VH, 40, undefined, st.zone));
                                } else if (st.orbs.length < st.orbLimit) { // Only replace special orbs if below limit
                                    st.orbs.push(spawnOrb(VW, VH, 40, undefined, st.zone));
                                }

                                if (sn.isPlayer) {
                                    scoreRef.current += Math.abs(growth) * 10;
                                    st.score = scoreRef.current;
                                    scoreUpdateRef.current(scoreRef.current);
                                }

                                // Special logic for medkit
                                if (orb.type === 'medkit') {
                                    sn.zoneImmunityUntil = now + (30 + Math.random() * 10) * 1000; // 30-40s immunity
                                    triggerReaction(st, head, 'powerup_medkit', isTiny);
                                    st.floatingTexts.push({
                                        id: Math.random(),
                                        text: "IMMUNE! 🛡️",
                                        color: "#4ade80",
                                        pos: { ...sn.body[0] },
                                        life: 1.0
                                    });
                                }

                                // Food Effect Mapping
                                const effect = mapFoodToEffect(orb.type);
                                if (effect) {
                                    let duration = 5000 + Math.random() * 5000;
                                    // Ice effect: 5s to 8s as requested
                                    if (effect === 'frozen') duration = 5000 + Math.random() * 3000;

                                    sn.activeEffects.push({ type: effect, endTime: timestamp + duration });

                                    // Map effect type to reaction type
                                    let reaction: ReactionType | null = null;
                                    if (effect === 'magnet') reaction = 'powerup_magnet';
                                    else if (effect === 'shield') reaction = 'powerup_shield';
                                    else if (effect === 'haste') reaction = 'powerup_haste';
                                    else if (effect === 'frozen') reaction = 'powerup_freeze';
                                    else if (effect === 'zoom_out') reaction = 'powerup_zoom';

                                    if (reaction) triggerReaction(st, head, reaction, isTiny);

                                    // Rarity Engine: Schedule next special orb if we just ate one
                                    if (orb.type !== 'orb') {
                                        st.nextSpecialOrbTime = timestamp + 4000 + Math.random() * 4000;
                                    }
                                }
                            }
                        }
                    }

                    // Ecology Spawning (Dynamic count based on zone area)
                    if (st.zone) {
                        const { type, currentRadius } = st.zone;
                        const area = type === 'circle'
                            ? Math.PI * currentRadius * currentRadius
                            : (currentRadius * 2) * (currentRadius * 2);

                        // Minimum 20 orbs to keep game playable in tiny zones
                        st.orbLimit = Math.max(20, Math.floor(area * FOOD_DENSITY));

                        // CLEANUP: Remove orbs that are now in the toxic gas
                        // Every 10 frames to save CPU
                        if (st.frame % 10 === 0) {
                            const cx = st.world.width / 2;
                            const cy = st.world.height / 2;
                            for (let i = st.orbs.length - 1; i >= 0; i--) {
                                const orb = st.orbs[i];
                                let isSafe = true;
                                if (type === 'circle') {
                                    const dx = orb.pos.x - cx;
                                    const dy = orb.pos.y - cy;
                                    isSafe = Math.sqrt(dx * dx + dy * dy) <= currentRadius;
                                } else {
                                    isSafe = (
                                        orb.pos.x >= cx - currentRadius &&
                                        orb.pos.x <= cx + currentRadius &&
                                        orb.pos.y >= cy - currentRadius &&
                                        orb.pos.y <= cy + currentRadius
                                    );
                                }
                                if (!isSafe) {
                                    orb.isDissolving = true;
                                }
                            }
                        }

                        // Dissolve Logic: Shrink orbs that are marked
                        for (let i = st.orbs.length - 1; i >= 0; i--) {
                            const orb = st.orbs[i];
                            if (orb.isDissolving) {
                                orb.radius *= 0.85; // Faster exponential shrink
                                if (orb.radius < 0.5) {
                                    st.orbs.splice(i, 1);
                                }
                            }
                        }
                    }

                    if (st.orbs.length < st.orbLimit && st.frame % 2 === 0) {
                        st.orbs.push(spawnOrb(VW, VH, 40, undefined, st.zone));
                    }

                    // Respawn logic REMOVED for Battle Royale mode (Last Man Standing)

                    // Update particles & kill feed
                    // Advance particles
                    for (const p of st.particles) {
                        p.pos.x += p.vel.x;
                        p.pos.y += p.vel.y;
                        p.vel.x *= 0.95; p.vel.y *= 0.95; // Keep velocity decay
                        p.life -= 0.02; // Changed from 0.018 to 0.02
                    }
                    st.particles = st.particles.filter(p => p.life > 0);

                    // Advance floating texts (Move up + fade)
                    for (const ft of st.floatingTexts) {
                        ft.pos.y -= 0.8;
                        ft.life -= 0.02;
                    }
                    st.floatingTexts = st.floatingTexts.filter(ft => ft.life > 0);

                    for (let i = st.snakes.length - 1; i >= 0; i--) {
                        const sn = st.snakes[i];
                        if (sn.isDead) {
                            if (sn.deadFrames === undefined) sn.deadFrames = 0;
                            sn.deadFrames++;
                            if (sn.deadFrames > 200) { // Increased: give orbs time to render
                                st.snakes.splice(i, 1);
                            }
                        }
                    }

                    for (let i = st.killFeed.length - 1; i >= 0; i--) {
                        st.killFeed[i].alpha -= 0.008;
                        st.killFeed[i].y -= 0.3;
                        if (st.killFeed[i].alpha <= 0) st.killFeed.splice(i, 1);
                    }

                    // Check game over (Last Man Standing)
                    const playerSn = st.snakes.find(s => s.isPlayer);
                    const aliveSnakes = st.snakes.filter(s => !s.isDead);
                    const aliveCount = aliveSnakes.length;

                    // AI_PLAYER mode: game over as soon as the ONE AI snake dies
                    // PvC: game over when player dies OR last snake standing
                    // CvC: game over when only 1 snake remains
                    const gameOverCondition =
                        mode === 'AI_PLAYER' ? (playerSn?.isDead ?? false)
                            : mode === 'PvC' ? ((playerSn?.isDead ?? false) || aliveCount <= 1)
                                : aliveCount <= 1;

                    if (gameOverCondition) {
                        st.gameOver = true;
                        if (aliveCount === 1 && playerSn && !playerSn.isDead) {
                            st.isWinner = true;
                            setIsWinnerState(true);
                            if (playerSn && !playerSn.isDead) triggerReaction(st, playerSn.body[0], 'win', isTiny);
                            if (mode === 'AI_PLAYER') {
                                setAiMessage(getWinMessage(playerSn.kills, playerSn.score));
                            }
                        } else {
                            st.isWinner = false;
                            setIsWinnerState(false);
                            if (mode === 'AI_PLAYER' && playerSn) {
                                // Detect death reason
                                let reason: DeathReason = 'unknown';
                                if (playerSn.zoneDamage > 0.3) {
                                    // High zone damage = zone killed them
                                    reason = 'zone';
                                } else {
                                    // Check last kill feed entry for the player
                                    const lastKill = [...st.killFeed].reverse().find(
                                        kf => kf.victimName === playerSn.name
                                    );
                                    if (lastKill) {
                                        const r = lastKill.reason?.toLowerCase() ?? '';
                                        if (r.includes('wall')) reason = 'wall';
                                        else if (r.includes('headshot')) reason = 'headshot';
                                        else if (r.includes('bomb')) reason = 'bomb';
                                        else if (r.includes('bite') || r.includes('body')) reason = 'bite';
                                    }
                                }
                                triggerReaction(st, playerSn.body[0], 'lose', isTiny);
                                setAiMessage(getDeathMessage(reason));
                            }
                        }
                        setGameOverState(true);
                        onGameOver();
                        soundManager.setBoostActive(false);
                    }
                }
            }

            // ── Render ────────────────────────────────────────────────────────
            fitCanvas(canvas, isTiny, graphicsSettings.resolution);
            ctx.setTransform(finalDpr, 0, 0, finalDpr, 0, 0); 

            // Draw Mini-Map Border
            // Removed as per request for cleaner floating look

            ctx.save();
            // Camera logic follows...
            // ... camera logic ...

            st.camera.zoom = st.camera.zoom; // Already lerped above
            const zoom = st.camera.zoom;

            ctx.translate(W / 2, H / 2);
            ctx.scale(zoom, zoom);
            ctx.translate(-st.camera.x, -st.camera.y);

            drawBackground(ctx, VW, VH, st.camera, W, H, st.zone, st.frame, st.gasParticles);

            // Render Culling bounds (with buffer)
            const cullW = (W / zoom) * 0.7; // Buffer to prevent popping
            const cullH = (H / zoom) * 0.7;

            // Draw dead snakes FIRST (background layer, fading out)
            for (const sn of st.snakes) {
                if (!sn.isDead || !sn.body || sn.body.length === 0) continue;
                if (Math.abs(sn.body[0].x - st.camera.x) <= cullW + sn.radius &&
                    Math.abs(sn.body[0].y - st.camera.y) <= cullH + sn.radius) {
                    drawSnake(ctx, sn, st.frame, mode as string);
                }
            }

            // Draw orbs ON TOP of dead snakes (so food is always visible)
            for (const orb of st.orbs) {
                if (Math.abs(orb.pos.x - st.camera.x) > cullW || Math.abs(orb.pos.y - st.camera.y) > cullH) continue;
                drawOrb(ctx, orb, st.frame);
            }

            // Draw alive snakes LAST (topmost layer)
            for (const sn of st.snakes) {
                if (sn.isDead || !sn.body || sn.body.length === 0) continue;
                let isVisible = false;
                for (let i = 0; i < sn.body.length; i += 10) {
                    if (Math.abs(sn.body[i].x - st.camera.x) <= cullW + sn.radius &&
                        Math.abs(sn.body[i].y - st.camera.y) <= cullH + sn.radius) {
                        isVisible = true;
                        break;
                    }
                }
                if (!isVisible && Math.abs(sn.body[0].x - st.camera.x) <= cullW + sn.radius && Math.abs(sn.body[0].y - st.camera.y) <= cullH + sn.radius) isVisible = true;
                if (isVisible) drawSnake(ctx, sn, st.frame, mode as string);
            }
            drawParticles(ctx, st.particles);
            drawFloatingTexts(ctx, st.floatingTexts);

            // ── Mini-map (HUD Layer - no camera transform) ──────────────
            ctx.restore(); // Exit camera space BEFORE drawing minimap
            if (st.miniMap.show) {
                drawMiniMap(ctx, st);
            }

            // Screen space 
            // Screen-space UI
            drawKillFeed(ctx, st.killFeed, W);
            // drawHUD is now in the header! (Handled via onStatusUpdate)

            if (st.countdown !== null) {
                drawCountdown(ctx, st.countdown, W, H);
            }

            // Fog of War Overlay (Player only)
            const playerForFog = st.snakes.find(s => s.isPlayer && !s.isDead);
            if (playerForFog?.activeEffects.some(e => e.type === 'fog_of_war')) {
                drawFogOfWar(ctx, W, H, playerForFog, st.camera);
            }

            if (st.gameOver) {
                // drawGameOver(ctx, W, H, st.score); // Disabled canvas version
            }

            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => { cancelAnimationFrame(rafId); ro.disconnect(); };
    }, [isPlaying, initGame, difficulty, mode, onStatusUpdate, isTiny, mapSettings, graphicsSettings.fps, graphicsSettings.resolution, isPaused]);

    // ── Input: Keyboard ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isPlaying || mode === 'CvC' || isPaused) return;
        const map: Record<string, { x: number; y: number }> = {
            ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
            ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
            ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
            ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 },
        };
        const keysHeld: Record<string, boolean> = {};

        const updateBoost = (st: GameState) => {
            const hasDirKey = keysHeld['ArrowUp'] || keysHeld['w'] || keysHeld['ArrowDown'] || keysHeld['s'] || keysHeld['ArrowLeft'] || keysHeld['a'] || keysHeld['ArrowRight'] || keysHeld['d'];

            if (keysHeld[' ']) {
                st.inputBoosting = 4; // Space = Max turbo speed (2.5x)
            } else if (hasDirKey) {
                // Acceleration: Stay 1.0x for 500ms, then 1.5x for 1s, then 2.0x
                const heldMs = performance.now() - st.keyHoldStartTime;
                if (heldMs > 1500) st.inputBoosting = 3;      // 1.5s+ -> 2.0x
                else if (heldMs > 500) st.inputBoosting = 2;   // 0.5s+ -> 1.5x
                else st.inputBoosting = 1;                     // default -> 1.0x
            } else {
                st.inputBoosting = 1; // Idle keyboard = Normal speed
            }
        };

        const onDown = (e: KeyboardEvent) => {
            const st = stateRef.current;
            if (!st) return;

            const isDir = e.key.includes('Arrow') || ['w', 'a', 's', 'd'].includes(e.key.toLowerCase());
            if (isDir && !keysHeld[e.key]) {
                st.keyHoldStartTime = performance.now();
            }

            keysHeld[e.key] = true;
            if (e.key === ' ') { e.preventDefault(); st.turboActive = true; }
            const d = map[e.key];
            if (d) { st.keyDir = d; st.mouseDir = null; e.preventDefault(); }
            updateBoost(st);
        };
        const onUp = (e: KeyboardEvent) => {
            const st = stateRef.current;
            if (!st) return;
            keysHeld[e.key] = false;

            const hasDirKey = keysHeld['ArrowUp'] || keysHeld['w'] || keysHeld['ArrowDown'] || keysHeld['s'] || keysHeld['ArrowLeft'] || keysHeld['a'] || keysHeld['ArrowRight'] || keysHeld['d'];
            if (!hasDirKey) {
                st.keyHoldStartTime = 0;
            }

            if (e.key === ' ') { e.preventDefault(); st.turboActive = false; }
            updateBoost(st);
        };
        window.addEventListener('keydown', onDown);
        window.addEventListener('keyup', onUp);
        return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
    }, [isPlaying, mode, isPaused]);

    // ── Input: Mouse ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isPlaying || mode === 'CvC' || isPaused) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const onMove = (e: MouseEvent) => {
            const st = stateRef.current;
            if (!st) return;
            const rect = canvas.getBoundingClientRect();
            // Need to reverse-transform mouse position into camera world-space
            const dpr = window.devicePixelRatio || 1;
            const W = canvas.width / dpr;
            const H = canvas.height / dpr;
            const cx = W / 2, cy = H / 2;
            const zoom = st.camera.zoom;

            // Fix for Chat Window Preview Scaling: Calculate exact dynamic scale
            const scaleX = W / rect.width;
            const scaleY = H / rect.height;

            const mouseScreenX = (e.clientX - rect.left) * scaleX;
            const mouseScreenY = (e.clientY - rect.top) * scaleY;

            const mouseWorldX = (mouseScreenX - cx) / zoom + st.camera.x;
            const mouseWorldY = (mouseScreenY - cy) / zoom + st.camera.y;

            const player = st.snakes.find(s => s.isPlayer && !s.isDead);
            if (!player) return;

            // Save mouse world position for per-frame speed calculation
            st.lastMouseWorldPos = { x: mouseWorldX, y: mouseWorldY };

            let dx = mouseWorldX - player.body[0].x;
            let dy = mouseWorldY - player.body[0].y;

            // Speed Mechanic based on Distance (ONLY if holding click)
            const distVal = Math.sqrt(dx * dx + dy * dy);
            // Dynamic thresholds for 5 tiers:
            // < 50px: Tier 0 (0.5x Crawl)
            // 50-150px: Tier 1 (1.0x Normal)
            // 150-300px: Tier 2 (1.5x)
            // 300-500px: Tier 3 (2.0x)
            // > 500px: Tier 4 (2.5x)
            // Proximity-Based Speed:
            // Always active (no click required).
            // Near snake (< 5% of canvas width) = 0.5x
            // Mid distance (< 10% of canvas width) = 1.0x
            // Far = 1.5x max
            // Proximity-Based Speed System:
            // Normal: near=0.5x, mid=1x, far=1.5x
            // Turbo (click/hold): near=1x, mid=1.5x, far=2.5x
            if (st.keyDir === null) {
                const canvasW = canvas.clientWidth || (canvas.width / (window.devicePixelRatio || 1));

                // 1. "Behind Head" Detection (0.2x Speed)
                // MORE SENSITIVE: Dot product check. 
                // We calculate dot between snake's direction and the vector from head to mouse.
                const head = player.body[0];
                const dx = mouseWorldX - head.x;
                const dy = mouseWorldY - head.y;
                const dLen = Math.sqrt(dx * dx + dy * dy);

                // If mouse is very close to head, check angle strictly
                const mouseRelNorm = { x: dx / dLen, y: dy / dLen };
                const dot = mouseRelNorm.x * player.dir.x + mouseRelNorm.y * player.dir.y;

                // 2. "Body Touch" Detection (0.5x Speed)
                let minDistToBody = Infinity;
                for (let i = 2; i < player.body.length; i++) { // Include neck/body
                    const d = dist({ x: mouseWorldX, y: mouseWorldY }, player.body[i]);
                    if (d < minDistToBody) minDistToBody = d;
                }

                const touchDist = player.radius + 15;
                const isTurbo = (e.buttons >= 1) || st.turboActive;

                // TIER LOGIC
                if (dot < -0.1 && dLen < player.radius * 10) {
                    // Mouse is pulled behind the head area -> Ultra Precision (0.2x)
                    st.inputBoosting = 5;
                } else if (minDistToBody < touchDist) {
                    // Mouse is touching body -> Precision (0.5x)
                    st.inputBoosting = 0;
                } else if (isTurbo) {
                    // Turbo Scale: 1.5x (T2) -> 2.0x (T3) -> 2.5x (T4)
                    const near = canvasW * 0.10;
                    const mid = canvasW * 0.20;
                    if (distVal < near) st.inputBoosting = 2;
                    else if (distVal < mid) st.inputBoosting = 3;
                    else st.inputBoosting = 4;
                } else {
                    // Normal Scale: 1.0x (T1) -> 1.5x (T2)
                    const mid = canvasW * 0.15;
                    if (distVal < mid) st.inputBoosting = 1;
                    else st.inputBoosting = 2; // Max 1.5x for normal move
                }
            }



            // Drunk Effect: Swerving "Low Influence" control
            if (player.activeEffects.some(e => e.type === 'drunk')) {
                const sway = Math.sin(st.frame * 0.1) * 1.5;
                const influence = 0.2; // Only 20% mouse control
                const targetX = dx * influence + sway * 50;
                const targetY = dy * influence + Math.cos(st.frame * 0.1) * 50;
                const res = normalize({ x: targetX, y: targetY });
                dx = res.x;
                dy = res.y;
            }

            if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) { st.mouseDir = normalize({ x: dx, y: dy }); st.keyDir = null; }
        };
        const onDown = (e: MouseEvent) => {
            soundManager.resume();

            // Re-apply game over click logic here for high-reliability
            const st = stateRef.current;
            if (st?.gameOver) {
                return; // Stop processing further down events if game over, React overlay handles it
            }

            // Mousedown explicitly forces max override (optional flavor, or we let distance rule)
            // Let distance rule if we move, but click jumps it to max temp? 
            // Better: Mousedown doesn't force 2. We let onMove control tier based on distance.
            // But if user clicks and holds? Spacebar equivalent. Let's make physical mousedown = 2, otherwise 0.
            // Wait, the prompt says distance based: "bahut dur le jayega toh 2x". Hold slide.
            // Actually: We can just let the distance logic above rule if mousedown is happening?
            // "jab holde akre lside kange to 2x speed ho jayga ager tese kichenge to 1.5x speed ho jyga"
            // So Mousedown activates the mouse drive. We just set a flag.
            // We use standard inputBoosting = 1 or 2 based on move DISTANCE, ONLY if mouse is down.
            // Let's track if mouse is down.
            if (st) {
                st.turboActive = true;
                // Don't force speed to 1x — onMove will handle it.
                // If we're already moving, remain at current speed until mouse moves.
            }
        };

        const onUp = () => {
            const st = stateRef.current;
            if (st) {
                st.turboActive = false;
                // If we were in turbo tiers (2,3,4), drop to normal (1). 
                // BUT if we were already in crawl (0), stay in crawl.
                if (st.inputBoosting > 1) st.inputBoosting = 1;
            }
        };

        canvas.addEventListener('mousemove', onMove);
        canvas.addEventListener('mousedown', onDown);
        window.addEventListener('mouseup', onUp);
        return () => {
            canvas.removeEventListener('mousemove', onMove);
            canvas.removeEventListener('mousedown', onDown);
            window.removeEventListener('mouseup', onUp);
        };
    }, [isPlaying, mode, isPaused]);

    // ── Touch ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isPlaying || mode === 'CvC' || isPaused) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const onStart = (e: TouchEvent) => {
            const rect = canvas.getBoundingClientRect();
            soundManager.resume();

            const st = stateRef.current;
            if (st?.gameOver) {
                e.preventDefault();
                return;
            }

            if (st) {
                // Fix: Same dynamic scaling logic for touch start
                const dpr = window.devicePixelRatio || 1;
                const W = canvas.width / dpr;
                const H = canvas.height / dpr;
                const scaleX = W / rect.width;
                const scaleY = H / rect.height;

                st.touchStart = {
                    x: (e.touches[0].clientX - rect.left) * scaleX,
                    y: (e.touches[0].clientY - rect.top) * scaleY
                };
                st.inputBoosting = 1; // Start at normal speed
            }
            e.preventDefault();
        };
        const onMove = (e: TouchEvent) => {
            const st = stateRef.current;
            if (!st?.touchStart) return;
            const rect = canvas.getBoundingClientRect();

            // Fix: Apply dynamic scaling to touch move coordinates
            const dpr = window.devicePixelRatio || 1;
            const W = canvas.width / dpr;
            const H = canvas.height / dpr;
            const scaleX = W / rect.width;
            const scaleY = H / rect.height;

            const currentTouchX = (e.touches[0].clientX - rect.left) * scaleX;
            const currentTouchY = (e.touches[0].clientY - rect.top) * scaleY;

            const dx = currentTouchX - st.touchStart.x;
            const dy = currentTouchY - st.touchStart.y;

            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 150) st.inputBoosting = 4;
            else if (dist > 50) st.inputBoosting = 2;
            else st.inputBoosting = 1;

            if (Math.abs(dx) > 8 || Math.abs(dy) > 8) { st.touchDir = normalize({ x: dx, y: dy }); st.mouseDir = null; }
            e.preventDefault();
        };
        const onEnd = () => { if (stateRef.current) { stateRef.current.touchStart = null; stateRef.current.inputBoosting = 1; } };
        canvas.addEventListener('touchstart', onStart, { passive: false });
        canvas.addEventListener('touchmove', onMove, { passive: false });
        canvas.addEventListener('touchend', onEnd);
        return () => { canvas.removeEventListener('touchstart', onStart); canvas.removeEventListener('touchmove', onMove); canvas.removeEventListener('touchend', onEnd); };
    }, [isPlaying, mode]);

    // ── Click menu button on game-over (Legacy click removed, handled in mousedown/touchstart) ──
    useEffect(() => {
        // Kept empty useEffect to maintain hook order if needed, 
        // though safely we can just leave it or remove it entirely if we don't care about strict hook rules. 
        // Actually, since React complains if hook counts change, we keep an empty useEffect.
    }, [onRestart, initGame]);

    const aliveCount = useMemo(() => {
        return stateRef.current?.snakes.filter(s => !s.isDead).length || 0;
    }, [isPlaying]);

    return (
        <div className="  w-full h-full overflow-hidden flex items-center justify-center pointer-events-auto" style={{ cursor: gameOverState ? 'default' : 'none' }}>
            {!gameOverState && !isTiny && (
                <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: 100 }}>
                    <TargetCursor key="playing" targetSelector=".btn-target" baseScale={isTiny ? 1 : 1} />
                </div>
            )}
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    cursor: `${isTiny ? 'default' : 'none'}`,
                }}
            />


            <AnimatePresence>
                {(gameOverState || isPaused) && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        className={`absolute inset-0 z-[110] flex flex-col items-center justify-center ${isTiny ? 'p-0' : 'p-6'} bg-black/60 backdrop-blur-md text-center`}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                            className={`flex flex-col items-center w-full ${isTiny ? 'max-h-full overflow-y-auto scrollbar-none pb-4' : ''}`}
                        >
                            <div
                                className={`relative mb-1 ${isWinnerState ? 'drop-shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'drop-shadow-[0_0_15px_rgba(255,107,107,0.4)]'}`}
                                style={{ width: isTiny ? '24px' : '96px', height: isTiny ? '24px' : '96px' }}
                            >
                                <LottieEmoji
                                    path={isPaused ? EmojiMeta["1f40d"].path : (isWinnerState ? EmojiMeta["1f3c6"].path : EmojiMeta["1f480"].path)}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </div>
                            <h2 className={`${isTiny ? 'text-[8px]' : 'text-4xl'} font-black italic tracking-tighter mb-0 uppercase ${isWinnerState ? 'text-[#ffdb4d] drop-shadow-[0_0_10px_rgba(255,219,77,0.5)]' : isPaused ? 'text-white' : 'text-[#ff6b6b]'}`}>
                                {isPaused ? 'PAUSED' : (isWinnerState ? 'Victory!' : 'Game Over')}
                            </h2>
                            <p className={`text-white/40 font-black tracking-[0.2em] uppercase ${isTiny ? 'text-[3.5px]' : 'text-xs'} mb-2.5`}>
                                {isPaused ? 'CURRENT SCORE:' : 'FINAL SCORE:'} <span className={`text-white font-mono ${isTiny ? 'text-[6px]' : 'text-xl'} ml-1`}>{scoreRef.current}</span>
                            </p>

                            {/* AI Player Message — shows win/loss reaction from the human-like AI */}
                            {mode === 'AI_PLAYER' && aiMessage && !isPaused && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className={`${isTiny ? 'text-[5px] px-2 py-0.5' : 'text-sm px-4 py-2'} rounded-xl mb-3 font-semibold
                                        ${isWinnerState
                                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                            : 'bg-white/10 text-white/70 border border-white/10'
                                        }`}
                                >
                                    🐍 {aiMessage}
                                </motion.div>
                            )}

                            <div className={`flex items-center ${isTiny ? 'gap-1.5 flex-col' : 'gap-4'}`}>
                                {isPaused ? (
                                    <button
                                        onClick={() => setIsPaused(false)}
                                        className={`btn-target group flex items-center justify-center gap-2 bg-white text-black ${isTiny ? 'px-3 py-1.5 text-[6px]' : 'px-8 py-3.5'} rounded-2xl font-black transition-all active:scale-95 shadow-xl shadow-white/5`}
                                    >
                                        <Play size={isTiny ? 8 : 20} fill="black" />
                                        RESUME
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setGameOverState(false);
                                            setIsWinnerState(false);
                                            initGame();
                                        }}
                                        className={`btn-target group flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 ${isTiny ? 'px-3 py-1.5 text-[6px]' : 'px-8 py-3.5'} rounded-2xl text-white font-black transition-all active:scale-95`}
                                    >
                                        <RotateCcw size={isTiny ? 8 : 20} className="group-hover:rotate-[-45deg] transition-transform" />
                                        REPLAY
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setIsPaused(false);
                                        onRestart();
                                    }}
                                    className={`btn-target group flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/5 ${isTiny ? 'px-3 py-1.5 text-[6px]' : 'px-8 py-3.5'} rounded-2xl text-white/50 hover:text-white transition-all active:scale-95`}
                                >
                                    <Home size={isTiny ? 8 : 20} />
                                    MENU
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
