// aiPlayer.ts — MASTER LEVEL AI Player (Priority Decision Tree)
// EXCLUSIVE priorities: only highest active priority runs each frame.
// No more force cancellation. No more freeze.

import { SnakeEntity, Orb, Vec2, GameState } from './types';
import { normalize, dist } from './helpers';
import { GameDifficulty } from '../GameShell';
import { WALL_MARGIN, MIN_LENGTH_FOR_BOOST } from './constants';

// ─── Tuning ────────────────────────────────────────────────────────────────
const THINK_MS     = 50;
const THINK_JITTER = 15;
const FOOD_RANGE   = 1400;
const HUNT_RANGE   = 800;
const TRAP_RANGE   = 500;

// ─── Situational Messages ─────────────────────────────────────────────────────
export type DeathReason = 'wall' | 'zone' | 'bite' | 'headshot' | 'bomb' | 'unknown';

const DEATH_MESSAGES: Record<DeathReason, string[]> = {
    wall: [
        "Ugh, went straight into the wall! 🧱",
        "Didn't see that wall coming.",
        "Wall 1, Me 0. That hurts. 😤",
        "Hit the boundary. Won't happen again.",
        "Classic wall mistake.",
    ],
    zone: [
        "The zone closed in too fast! 🌫️",
        "Caught outside the safe zone...",
        "Zone damage got me. Didn't escape in time.",
        "Should have moved to center sooner. Zone got me.",
        "The shrinking zone ended my run.",
    ],
    bite: [
        "Ran right into another snake's body! 😵",
        "Got bitten — crashed into a body segment.",
        "That snake's body was RIGHT there.",
        "Body collision. I was too aggressive.",
        "Outmaneuvered — hit their body.",
    ],
    headshot: [
        "Head-on collision! Equal sizes. Bad luck. 💥",
        "Headshot'd! They came from nowhere.",
        "Went head-to-head and lost. Respect.",
        "That was a duel. I lost this one.",
        "Direct headshot. Bold of them.",
    ],
    bomb: [
        "BOMB! Didn't notice it was a trap. 💣",
        "That item was a bomb! 💣 Rookie mistake.",
        "Stepped on a bomb. Oops.",
    ],
    unknown: [
        "Something ended my run. Replay!",
        "Unexpected death. That was surprising.",
        "Gone too soon.",
    ],
};

const WIN_FNS: Array<(kills: number, score: number) => string | null> = [
    (k, s) => k >= 5 ? `${k} kills, ${s} pts. Absolute domination! 👑` : null,
    (k, s) => k >= 3 ? `${k} kills, ${s} pts. Strong performance! 🔥` : null,
    (k, s) => s >= 500 ? `${s} points. Food mastery! 🍖` : null,
    () => "Last snake standing. Clean survival. ✅",
    () => "Nobody could stop me this round! 🏆",
    () => "Zone, walls, snakes — handled everything! 💎",
    () => "That's master-level play. Win secured! 🐍",
];

export function getDeathMessage(reason: DeathReason = 'unknown'): string {
    const msgs = DEATH_MESSAGES[reason] ?? DEATH_MESSAGES.unknown;
    return msgs[Math.floor(Math.random() * msgs.length)];
}

export function getWinMessage(kills = 0, score = 0): string {
    for (const fn of WIN_FNS) {
        const msg = fn(kills, score);
        if (msg) return msg;
    }
    return "Winner! 🏆";
}

const AI_PLAYER_COMMENTARY = [
    "Scanning for smaller targets...",
    "Zone closing — repositioning to center.",
    "That crown is MINE. 👑",
    "Wait for it... setting up the trap.",
    "Growing fast. Getting dangerous.",
    "Boost ready. Watching for headshot opportunity.",
    "Coiling strategy engaged.",
    "Three snakes left. Time to hunt.",
];

// Legacy compat
export const getRandomDeathMessage = () => getDeathMessage('unknown');
export const getRandomWinMessage   = () => getWinMessage(0, 0);
export const getRandomCommentary   = () => AI_PLAYER_COMMENTARY[Math.floor(Math.random() * AI_PLAYER_COMMENTARY.length)];

export const GAME_EXPLANATIONS: Record<string, string> = {
    "what is this":   "BattleSnake Battle Royale! 🐍 Control a snake — eat food to grow, avoid walls. Last snake alive wins!",
    "how to play":    "Steer with mouse. Eat food to grow. Hold left-click to boost (costs body length). Avoid the shrinking zone!",
    "what is zone":   "A shrinking circle — like PUBG. Stay inside or take damage. Forces all snakes together until one remains. 🌫️",
    "how to boost":   "Hold left-click or Spacebar. Faster but burns body length. Use for kills and zone escapes. ⚡",
    "what is food":   "🍎 Fruits 2-10pts, 🍕 Junk 11-25pts, 🐄 Animals 35-50pts. Special items give powers like 🧲 Magnet or 🛡️ Shield!",
    "how to win":     "Be the LAST snake alive. Make others crash into your body. Grow big, avoid the zone, hunt smaller snakes!",
    "what is playing":"I am your AI player! Watch me hunt snakes, set traps, and escape the zone. Ask anything about the game!",
    "default":        "I am a master-level AI controlling this snake in BattleSnake — a snake battle royale. Ask me anything!",
};

export function getGameExplanation(q: string): string {
    const lq = q.toLowerCase();
    for (const [k, v] of Object.entries(GAME_EXPLANATIONS)) {
        if (k !== 'default' && lq.includes(k)) return v;
    }
    return GAME_EXPLANATIONS['default'];
}

// ─── State ────────────────────────────────────────────────────────────────────
interface MasterState {
    lastThinkTime: number;
    delay: number;
    huntId: number | null;
    huntExpiry: number;
    wanderAngle: number;
    phase: 'survive' | 'grow' | 'hunt';
}
const masterStates = new Map<number, MasterState>();

function getMS(id: number): MasterState {
    if (!masterStates.has(id)) {
        masterStates.set(id, {
            lastThinkTime: 0,
            delay: THINK_MS,
            huntId: null,
            huntExpiry: 0,
            wanderAngle: Math.random() * Math.PI * 2,
            phase: 'survive',
        });
    }
    return masterStates.get(id)!;
}

// ─── Food Density Heatmap ─────────────────────────────────────────────────────
function getFoodDensityTarget(head: Vec2, orbs: Orb[], W: number, H: number, range: number): Vec2 | null {
    const GRID = 6;
    const cellW = W / GRID, cellH = H / GRID;
    const counts = new Array(GRID * GRID).fill(0);
    const HAZARDS = new Set(['bomb', 'stone', 'radioactive', 'frozen_ice']);
    const HIGH = ['crown', 'king_crown', 'golden_egg', 'giant_cake', 'brain', 'magnet_orb', 'shield_orb', 'medkit'];
    for (const orb of orbs) {
        if (HAZARDS.has(orb.type)) continue;
        if (dist(head, orb.pos) > range) continue;
        const gx = Math.min(GRID - 1, Math.floor(orb.pos.x / cellW));
        const gy = Math.min(GRID - 1, Math.floor(orb.pos.y / cellH));
        counts[gy * GRID + gx] += HIGH.includes(orb.type) ? 5 : 1;
    }
    let best = -1, bestCount = 0;
    for (let i = 0; i < counts.length; i++) {
        if (counts[i] > bestCount) { bestCount = counts[i]; best = i; }
    }
    if (best < 0 || bestCount < 3) return null;
    return { x: ((best % GRID) + 0.5) * cellW, y: (Math.floor(best / GRID) + 0.5) * cellH };
}

// ─── MASTER computeHumanPlayerDir — Priority Decision Tree ───────────────────
export function computeHumanPlayerDir(
    state: GameState,
    snake: SnakeEntity,
    snakes: SnakeEntity[],
    orbs: Orb[],
    W: number,
    H: number,
    _difficulty: GameDifficulty,
    now: number
): { dir: Vec2; shouldBoost: boolean } {

    const ms = getMS(snake.id);
    const head = snake.body[0];

    // Think throttle
    if (now - ms.lastThinkTime < ms.delay) {
        return { dir: snake.targetDir, shouldBoost: snake.isBoosting };
    }
    ms.lastThinkTime = now;
    ms.delay = THINK_MS + (Math.random() - 0.5) * THINK_JITTER;

    // Adaptive phase
    const len = snake.body.length;
    if (len < 35)      ms.phase = 'survive';
    else if (len < 65) ms.phase = 'grow';
    else               ms.phase = 'hunt';

    const HAZARDS  = new Set(['bomb', 'stone', 'radioactive', 'frozen_ice']);
    const ULTRA    = new Set(['crown', 'king_crown', 'golden_egg', 'giant_cake', 'brain']);
    const POWERUPS = new Set(['magnet_orb', 'shield_orb', 'haste_orb', 'ghost_pepper', 'medkit', 'telescope']);
    const BIGFOOD  = new Set(['cow', 'sheep', 'chicken', 'rabbit', 'pig']);

    const hasMagnet = snake.activeEffects.some((e: { type: string }) => e.type === 'magnet');
    const hasShield = snake.activeEffects.some((e: { type: string }) => e.type === 'shield');
    const hasHaste  = snake.activeEffects.some((e: { type: string }) => e.type === 'haste');
    const cx = W / 2, cy = H / 2;

    // ── HELPER: best food target (priority scored) ────────────────────────────
    function getBestFood(maxRange: number): { orb: Orb; d: number } | null {
        let best: Orb | null = null;
        let bestScore = Infinity;
        for (const orb of orbs) {
            if (HAZARDS.has(orb.type)) continue;
            const d = dist(head, orb.pos);
            if (d > maxRange) continue;
            let score = d;
            if (ULTRA.has(orb.type))       score *= 0.05;
            else if (POWERUPS.has(orb.type)) score *= 0.12;
            else if (BIGFOOD.has(orb.type))  score *= 0.4;
            else score *= (0.85 + Math.random() * 0.2);
            if (score < bestScore) { bestScore = score; best = orb; }
        }
        return best ? { orb: best, d: dist(head, best.pos) } : null;
    }

    // ── HELPER: nearest body threat ───────────────────────────────────────────
    function getNearestBodyThreat(): { dist: number; away: Vec2 } | null {
        const avoidR = (snake.radius + 14) * 7;
        let minD = Infinity;
        let minAway: Vec2 = { x: 0, y: 0 };
        for (const other of snakes) {
            if (other.isDead) continue;
            const segStart = other.id === snake.id ? 14 : 0;
            for (let i = segStart; i < other.body.length; i += 2) {
                const d = dist(head, other.body[i]);
                if (d < avoidR && d < minD) {
                    minD = d;
                    const raw = normalize({ x: head.x - other.body[i].x, y: head.y - other.body[i].y });
                    const dot = snake.dir.x * (-raw.x) + snake.dir.y * (-raw.y);
                    const sideMult = dot > 0.25 ? 1.8 : 1.0;
                    minAway = { x: raw.x * sideMult, y: raw.y * sideMult };
                }
            }
        }
        return minD < Infinity ? { dist: minD, away: minAway } : null;
    }

    // ════════════════════════════════════════════════════════════════════
    // PRIORITY 1: WALL PANIC
    // ════════════════════════════════════════════════════════════════════
    const HARD = WALL_MARGIN * 0.6;
    const wallPanics: Vec2[] = [];
    if (head.x < HARD)     wallPanics.push({ x: 1, y: 0 });
    if (head.x > W - HARD) wallPanics.push({ x: -1, y: 0 });
    if (head.y < HARD)     wallPanics.push({ x: 0, y: 1 });
    if (head.y > H - HARD) wallPanics.push({ x: 0, y: -1 });
    if (wallPanics.length > 0) {
        const c = wallPanics.reduce((a, v) => ({ x: a.x + v.x, y: a.y + v.y }), { x: 0, y: 0 });
        return { dir: normalize(c), shouldBoost: false };
    }

    // ════════════════════════════════════════════════════════════════════
    // PRIORITY 2: ZONE ESCAPE
    // ════════════════════════════════════════════════════════════════════
    if (state.zone && !hasShield) {
        const { currentRadius, targetRadius } = state.zone;
        const dCenter = Math.sqrt((head.x - cx) ** 2 + (head.y - cy) ** 2);

        if (dCenter > currentRadius * 0.82) {
            const toCenter = normalize({ x: cx - head.x, y: cy - head.y });
            // Grab medkit/shield if it's on the way to center
            const onTheWay = orbs.find(o => {
                if (o.type !== 'medkit' && o.type !== 'shield_orb') return false;
                const d = dist(head, o.pos);
                if (d > 280) return false;
                const toOrb = normalize({ x: o.pos.x - head.x, y: o.pos.y - head.y });
                return (toOrb.x * toCenter.x + toOrb.y * toCenter.y) > 0.15;
            });
            if (onTheWay) {
                return { dir: normalize({ x: onTheWay.pos.x - head.x, y: onTheWay.pos.y - head.y }), shouldBoost: true };
            }
            return { dir: toCenter, shouldBoost: dCenter > currentRadius * 0.92 };
        }

        if (dCenter > targetRadius * 0.78) {
            const toCenter = normalize({ x: cx - head.x, y: cy - head.y });
            const food = getBestFood(FOOD_RANGE);
            if (food) {
                const toFood = normalize({ x: food.orb.pos.x - head.x, y: food.orb.pos.y - head.y });
                return {
                    dir: normalize({ x: toCenter.x * 0.3 + toFood.x * 0.7, y: toCenter.y * 0.3 + toFood.y * 0.7 }),
                    shouldBoost: false,
                };
            }
            return { dir: toCenter, shouldBoost: false };
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // PRIORITY 3: CLOSE FOOD — if food is RIGHT THERE, eat it immediately
    // (before body dodge — we never want to skip food that's in reach)
    // ════════════════════════════════════════════════════════════════════
    const closeFood = getBestFood(snake.radius * 18); // Very close food
    if (closeFood && closeFood.d < snake.radius * 14) {
        const toFood = normalize({ x: closeFood.orb.pos.x - head.x, y: closeFood.orb.pos.y - head.y });
        const boost = (ULTRA.has(closeFood.orb.type) || POWERUPS.has(closeFood.orb.type) || hasHaste)
            && len > MIN_LENGTH_FOR_BOOST + 5;
        return { dir: toFood, shouldBoost: boost };
    }

    // ════════════════════════════════════════════════════════════════════
    // PRIORITY 4: BODY DODGE — only trigger if very close (2.8x radius)
    // ════════════════════════════════════════════════════════════════════
    const threat = getNearestBodyThreat();
    if (threat && threat.dist < (snake.radius + 14) * 2.8) {
        const dodge = normalize({
            x: threat.away.x * 2 + snake.dir.x * 0.3,
            y: threat.away.y * 2 + snake.dir.y * 0.3,
        });
        return { dir: dodge, shouldBoost: false };
    }

    // ════════════════════════════════════════════════════════════════════
    // PRIORITY 4: MAGNET MODE
    // ════════════════════════════════════════════════════════════════════
    if (hasMagnet) {
        const densityTarget = getFoodDensityTarget(head, orbs, W, H, FOOD_RANGE * 2);
        if (densityTarget) {
            const d = dist(head, densityTarget);
            if (d > 180) {
                return { dir: normalize({ x: densityTarget.x - head.x, y: densityTarget.y - head.y }), shouldBoost: false };
            }
            ms.wanderAngle += 0.14;
            return { dir: normalize({ x: Math.cos(ms.wanderAngle), y: Math.sin(ms.wanderAngle) }), shouldBoost: false };
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // PRIORITY 5: FOOD — all phases, wide range, ALWAYS eat
    // ════════════════════════════════════════════════════════════════════
    const foodTarget = getBestFood(FOOD_RANGE * 1.2);

    if (foodTarget) {
        const toFood = normalize({ x: foodTarget.orb.pos.x - head.x, y: foodTarget.orb.pos.y - head.y });
        // Soft wall nudge while chasing food
        let dx = toFood.x, dy = toFood.y;
        const SOFT = WALL_MARGIN * 1.5;
        if (head.x < SOFT)     dx += (SOFT - head.x) / SOFT * 0.6;
        if (head.x > W - SOFT) dx -= (SOFT - (W - head.x)) / SOFT * 0.6;
        if (head.y < SOFT)     dy += (SOFT - head.y) / SOFT * 0.6;
        if (head.y > H - SOFT) dy -= (SOFT - (H - head.y)) / SOFT * 0.6;

        const boost = (
            (ULTRA.has(foodTarget.orb.type) && foodTarget.d < 500) ||
            (POWERUPS.has(foodTarget.orb.type) && foodTarget.d < 280) ||
            hasHaste
        ) && len > MIN_LENGTH_FOR_BOOST + 5;

        return { dir: normalize({ x: dx, y: dy }), shouldBoost: boost };
    }

    // ════════════════════════════════════════════════════════════════════
    // PRIORITY 6: HUNT / TRAP
    // ════════════════════════════════════════════════════════════════════
    if (ms.phase !== 'survive') {
        if (ms.huntId !== null) {
            const t = snakes.find(s => s.id === ms.huntId && !s.isDead);
            if (!t || now > ms.huntExpiry || dist(head, t.body[0]) > HUNT_RANGE * 2.5) ms.huntId = null;
        }
        if (ms.huntId === null) {
            let best: SnakeEntity | null = null;
            let bestScore = Infinity;
            for (const other of snakes) {
                if (other.isDead || other.id === snake.id) continue;
                const d = dist(head, other.body[0]);
                if (d > HUNT_RANGE) continue;
                const sizeOk = ms.phase === 'hunt'
                    ? other.body.length <= snake.body.length
                    : other.body.length < snake.body.length * 0.65;
                if (!sizeOk) continue;
                const score = d * (other.body.length / Math.max(1, snake.body.length));
                if (score < bestScore) { bestScore = score; best = other; }
            }
            if (best) { ms.huntId = best.id; ms.huntExpiry = now + 5000; }
        }

        if (ms.huntId !== null) {
            const target = snakes.find(s => s.id === ms.huntId && !s.isDead);
            if (target) {
                const th = target.body[0];
                const dTarget = dist(head, th);
                const myToTarget = normalize({ x: th.x - head.x, y: th.y - head.y });
                const dotBack = myToTarget.x * target.dir.x + myToTarget.y * target.dir.y;

                if (dotBack > 0.55) {
                    // Approaching from behind — swing to front
                    const perpX = -target.dir.y, perpY = target.dir.x;
                    const toAhead = normalize({ x: th.x + target.dir.x * 300 - head.x, y: th.y + target.dir.y * 300 - head.y });
                    const dot1 = (-perpY) * toAhead.x + perpX * toAhead.y;
                    return { dir: normalize({ x: dot1 > 0 ? perpX : -perpX, y: dot1 > 0 ? perpY : -perpY }), shouldBoost: false };

                } else if (dTarget < TRAP_RANGE * 0.65 && ms.phase === 'hunt' && len > 80) {
                    // COIL MODE
                    const toT = normalize({ x: th.x - head.x, y: th.y - head.y });
                    return {
                        dir: normalize({ x: -toT.y + toT.x * 0.25, y: toT.x + toT.y * 0.25 }),
                        shouldBoost: dTarget < TRAP_RANGE * 0.35,
                    };

                } else if (dTarget < TRAP_RANGE) {
                    const pX = th.x + target.dir.x * target.speed * 25;
                    const pY = th.y + target.dir.y * target.speed * 25;
                    return {
                        dir: normalize({ x: pX - head.x, y: pY - head.y }),
                        shouldBoost: dTarget < TRAP_RANGE * 0.55 && len > MIN_LENGTH_FOR_BOOST + 15,
                    };
                } else {
                    const pX = th.x + target.dir.x * target.speed * 15;
                    const pY = th.y + target.dir.y * target.speed * 15;
                    return { dir: normalize({ x: pX - head.x, y: pY - head.y }), shouldBoost: false };
                }
            }
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // PRIORITY 7: WANDER — never stop, drift toward food density
    // ════════════════════════════════════════════════════════════════════
    const density = getFoodDensityTarget(head, orbs, W, H, FOOD_RANGE * 2);
    if (density && dist(head, density) > 150) {
        return { dir: normalize({ x: density.x - head.x, y: density.y - head.y }), shouldBoost: false };
    }
    ms.wanderAngle += 0.06 + (Math.random() - 0.5) * 0.04;
    return {
        dir: normalize({
            x: Math.cos(ms.wanderAngle) + (cx - head.x) / W * 0.5,
            y: Math.sin(ms.wanderAngle) + (cy - head.y) / H * 0.5,
        }),
        shouldBoost: false,
    };
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────
export function resetHumanPlayerState() {
    masterStates.clear();
}
