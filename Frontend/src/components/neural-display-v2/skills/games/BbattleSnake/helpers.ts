// helpers.ts — Math utilities & entity factories

import { Vec2, SnakeEntity, Orb, FoodType, EffectType, ActiveEffect, GameState } from './types';
import { SNAKE_COLORS, INITIAL_LENGTH, SEGMENT_SPACING } from './constants';
import { FOOD_REGISTRY, getRandomFoodType } from './food';

let _orbCounter = 0;

export function mapFoodToEffect(food: FoodType): EffectType | null {
    switch (food) {
        case 'ghost_pepper': return 'ghost';
        case 'magnet': return 'magnet';
        case 'champagne_bottle': return 'drunk';
        case 'frozen_ice': case 'snail': return 'frozen';
        case 'shield_orb': case 'heart': case 'giant_cake': return 'shield';
        case 'haste_fruit': case 'mosquito': case 'bee': case 'ladybug': case 'beetle': return 'haste';
        case 'portal_gem': return 'portal_eye';
        case 'shrink_bean': return 'shrink';
        case 'telescope': return 'zoom_out';
        case 'eye': return 'fog_of_war';
        case 'king_crown': return 'haste'; // King speed
        default: return null;
    }
}

/** 
 * Growth score for different food items.
 * Points range from 2 to 50.
 */
export function getFoodScore(food: FoodType): number {
    const meta = FOOD_REGISTRY[food];
    if (meta) return meta.points / 10; // Convert points to internal growth units
    
    // Fallbacks for special logic not in registry
    if (food === 'bomb') return 0;
    if (food === 'radioactive') return -12.0; 
    if (food === 'stone') return -4.0;
    
    return 0.5; // Default minimal growth
}

/** 
 * Maps a FoodType to its corresponding SFX/Rarity tier (0-7)
 */
export function getFoodTier(food: FoodType): number {
    const meta = FOOD_REGISTRY[food];
    if (!meta) return 0;
    if (meta.points >= 40) return 4;
    if (meta.points >= 25) return 3;
    if (meta.points >= 15) return 2;
    return 1;
}

// ── Math ──────────────────────────────────────────────────────────────────────

export function normalize(v: Vec2): Vec2 {
    const len = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
    return { x: v.x / len, y: v.y / len };
}

export function dist(a: Vec2, b: Vec2): number {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export function lerpVec(a: Vec2, b: Vec2, t: number): Vec2 {
    return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export function randIn(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

// ── Factory functions ─────────────────────────────────────────────────────────

export function makeSnake(
    id: number,
    startPos: Vec2,
    startDir: Vec2,
    isPlayer: boolean,
    speed: number,
    radius: number
): SnakeEntity {
    const [color, glowColor, name] = SNAKE_COLORS[id % SNAKE_COLORS.length];
    const body: Vec2[] = [];
    for (let i = 0; i < INITIAL_LENGTH; i++) {
        body.push({
            x: startPos.x - startDir.x * i * SEGMENT_SPACING,
            y: startPos.y - startDir.y * i * SEGMENT_SPACING,
        });
    }
    return {
        id, body,
        dir: { ...startDir },
        targetDir: { ...startDir },
        speed, color, glowColor,
        isPlayer, isDead: false,
        isBoosting: false,
        score: 0,
        skinIndex: Math.floor(Math.random() * 20),
        kills: 0, name, radius,
        targetLength: INITIAL_LENGTH,
        distanceAccumulator: 0,
        lastThinkTime: 0,
        lastEatTime: 0,
        lastKillTime: 0,
        activeEffects: [],
        trait: isPlayer ? undefined : ([
            'survivor', 'killer', 'glutton', 'clumsy', 'explorer',
            'magnet', 'speedster', 'protector', 'trickster', 'elite'
        ][Math.floor(Math.random() * 10)] as any),
        thinkOffset: Math.random() * 100, // Random ms offset
        boostTier: 0,
        zoneDamage: 0,
        zoneImmunityUntil: 0,
    };
}

export function spawnOrb(W: number, H: number, padding = 40, forceType?: FoodType, zone?: GameState['zone']): Orb {
    const type: FoodType = forceType || getRandomFoodType();
    const meta = FOOD_REGISTRY[type];

    // Visual size based on points (2 to 50)
    const minR = 8;
    const maxR = 24;
    const points = meta ? meta.points : 5;
    const r = minR + (points / 50) * (maxR - minR);

    let x = 0;
    let y = 0;

    if (zone) {
        const cx = W / 2;
        const cy = H / 2;
        // Ensure radius doesn't shrink below padding to avoid negative ranges
        const radius = Math.max(padding + 20, zone.currentRadius);

        if (zone.type === 'circle') {
            // Polar coordinates for uniform distribution in circle
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.sqrt(Math.random()) * (radius - padding);
            x = cx + Math.cos(angle) * dist;
            y = cy + Math.sin(angle) * dist;
        } else {
            // Square logic
            const halfSize = radius - padding;
            x = cx + randIn(-halfSize, halfSize);
            y = cy + randIn(-halfSize, halfSize);
        }
    } else {
        x = randIn(padding, W - padding);
        y = randIn(padding, H - padding);
    }

    return {
        id: _orbCounter++,
        pos: { x, y },
        radius: r,
        color: '#fff',
        pulsePhase: Math.random() * Math.PI * 2,
        type
    };
}

// ── Canvas util ───────────────────────────────────────────────────────────────

export function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
