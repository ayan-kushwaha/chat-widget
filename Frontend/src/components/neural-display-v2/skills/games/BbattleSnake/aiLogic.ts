// aiLogic.ts — AI snake behaviour & death/kill handling

import { SnakeEntity, Orb, Vec2, DeathParticle, KillFeed, GameState } from './types';
import { normalize, dist, randIn, spawnOrb } from './helpers';
import { FOOD_REGISTRY, getRandomFoodType } from './food';
import { MISTAKE_RATE, WALL_MARGIN, BODY_AVOID_RADIUS_MULT, KILL_SCORE, MIN_LENGTH_FOR_BOOST } from './constants';
import { GameDifficulty } from '../GameShell';

let _killFeedCounter = 0;

/**
 * Recalculate the target direction for a single AI snake.
 */
export function computeAIDir(
    state: GameState,
    snake: SnakeEntity,
    snakes: SnakeEntity[],
    orbs: Orb[],
    W: number,
    H: number,
    difficulty: GameDifficulty
): Vec2 {
    const head = snake.body[0];
    const mkRate = MISTAKE_RATE[difficulty]; // Use correct difficulty rate

    // 1. Target Persistence & Selection
    let targetOrb: Orb | null = null;

    // Check if current target still exists
    if (snake.targetOrbId !== undefined) {
        targetOrb = orbs.find(o => o.id === snake.targetOrbId) || null;
    }

    // AI Traits logic
    const trait = snake.trait || 'survivor';

    // 1. Pick Target (Personality Driven)
    let bestDist = 2000;
    let newTargetOrb: Orb | null = null;
    
    // Check if current target still exists and is still desirable
    if (snake.targetOrbId !== undefined) {
        targetOrb = orbs.find(o => o.id === snake.targetOrbId) || null;
    }

    if (!targetOrb || dist(head, targetOrb.pos) > 1500 || (Math.random() < 0.03)) {
        for (const orb of orbs) {
            const d = dist(head, orb.pos);
            let weight = 1.0;

            // Hazard Avoidance: DONT target hazards unless clumsy
            if (['bomb', 'stone', 'radioactive'].includes(orb.type)) {
                if (trait !== 'clumsy') weight = 50.0; // Extremely undesirable
                else weight = 2.0; 
            }

            // Trait Influence
            if (trait === 'glutton' && ['golden_egg', 'giant_cake', 'brain'].includes(orb.type)) weight *= 0.1;
            if (trait === 'magnet' && orb.type === 'magnet_orb') weight *= 0.1;
            if (trait === 'protector' && orb.type === 'shield_orb') weight *= 0.1;
            if (trait === 'explorer' && d > 800) weight *= 0.5;
            if (trait === 'elite') weight *= 0.8; // Generally better at picking targets

            if (d * weight < bestDist) {
                bestDist = d * weight;
                newTargetOrb = orb;
            }
        }
        if (newTargetOrb) {
            targetOrb = newTargetOrb;
            snake.targetOrbId = targetOrb.id;
        }
    }

    let targetDir = { ...snake.dir };
    if (targetOrb) {
        const d = dist(head, targetOrb.pos);
        const weight = d < 80 ? 1.0 : 0.7;
        const desired = normalize({ x: targetOrb.pos.x - head.x, y: targetOrb.pos.y - head.y });
        targetDir = {
            x: targetDir.x * (1 - weight) + desired.x * weight,
            y: targetDir.y * (1 - weight) + desired.y * weight
        };
    }

    // 2. Strong Wall Avoidance (Panic Response)
    const margin = trait === 'survivor' || trait === 'elite' ? WALL_MARGIN * 1.5 : WALL_MARGIN;
    const panicDist = margin * 0.8;
    
    let wx = 0, wy = 0;
    if (head.x < margin) wx = (margin - head.x) / margin;
    else if (head.x > W - margin) wx = -(margin - (W - head.x)) / margin;
    
    if (head.y < margin) wy = (margin - head.y) / margin;
    else if (head.y > H - margin) wy = -(margin - (H - head.y)) / margin;
    
    if (wx !== 0 || wy !== 0) {
        const pushMult = 25; // High priority push
        targetDir.x += wx * pushMult;
        targetDir.y += wy * pushMult;
        
        // If really close to wall, force turn
        if (head.x < panicDist || head.x > W - panicDist || head.y < panicDist || head.y > H - panicDist) {
            targetOrb = null; // Ignore food if panicking
        }
    }
    
    // 4. Shrinking Zone Avoidance (Keep AI inside safe area)
    if (state.zone) {
        const { type, currentRadius, targetRadius } = state.zone;
        const cx = W / 2;
        const cy = H / 2;
        const dx = head.x - cx;
        const dy = head.y - cy;
        const dToCenter = Math.sqrt(dx * dx + dy * dy);
        
        let shouldSteer = false;
        // Strong steering if outside CURRENT zone
        const limitR = currentRadius * 0.9;
        if (type === 'circle') {
             if (dToCenter > limitR) shouldSteer = true;
        } else {
             if (Math.abs(dx) > limitR || Math.abs(dy) > limitR) shouldSteer = true;
        }

        // Proactive steering toward TARGET zone
        let proactiveSteer = false;
        if (type === 'circle') {
            if (dToCenter > targetRadius) proactiveSteer = true;
        } else {
            if (Math.abs(dx) > targetRadius || Math.abs(dy) > targetRadius) proactiveSteer = true;
        }

        if (shouldSteer || proactiveSteer) {
            const pullMult = shouldSteer ? 50 : 15; // Stronger if outside current
            const toCenter = normalize({ x: -dx, y: -dy });
            targetDir.x += toCenter.x * pullMult;
            targetDir.y += toCenter.y * pullMult;
            if (shouldSteer && dToCenter > currentRadius) targetOrb = null;
        }
    }

    // 5. Body avoidance & Aggression
    let avoids = false;
    for (const other of snakes) {
        if (other.isDead) continue;
        const oh = other.body[0];
        const dToOther = dist(head, oh);

        const isSelf = other.id === snake.id;
        if (dToOther > 1000 && !isSelf) continue;

        // Killer Trait: Chase leaders/player
        const isTarget = !isSelf && (trait === 'killer' || trait === 'elite') && 
                         (other.isPlayer || other.kills > 0) && 
                         dToOther < 500;

        if (isTarget) {
            const predictX = oh.x + other.dir.x * 150;
            const predictY = oh.y + other.dir.y * 150;
            targetDir = normalize({ x: predictX - head.x, y: predictY - head.y });
            if (dToOther < 300 && snake.body.length > MIN_LENGTH_FOR_BOOST) snake.isBoosting = true;
            avoids = true;
        }

        // Segment Avoidance (Crucial for not hitting others OR self)
        const avoidRScale = (trait === 'survivor' || trait === 'elite') ? 3.0 : 2.0;
        const startSeg = isSelf ? 10 : 0; // Don't avoid own head/neck
        for (let i = startSeg; i < other.body.length; i += 2) {
            const seg = other.body[i];
            const d = dist(head, seg);
            const avoidRadius = (snake.radius + (other.radius || 10)) * avoidRScale;

            if (d < avoidRadius) {
                const away = normalize({ x: head.x - seg.x, y: head.y - seg.y });
                const force = isSelf ? 12 : (trait === 'survivor' ? 10 : 6);
                targetDir.x += away.x * force;
                targetDir.y += away.y * force;
                avoids = true;
                if (!isTarget) snake.isBoosting = false;
                break;
            }
        }
        if (avoids && !isSelf) break;
    }

    // 5. Speedster Trait: Aggressive boosting
    if (trait === 'speedster' && snake.targetLength > MIN_LENGTH_FOR_BOOST + 5) {
        snake.isBoosting = true;
    }

    // 6. Mistakes
    const mistakeChance = trait === 'clumsy' ? mkRate * 3 : (trait === 'elite' ? mkRate * 0.2 : mkRate);
    if (!avoids && Math.random() < mistakeChance) {
        const scatter = trait === 'trickster' ? 1.5 : 0.5;
        const angle = (Math.random() - 0.5) * Math.PI * scatter;
        const cos = Math.cos(angle), sin = Math.sin(angle);
        targetDir = {
            x: targetDir.x * cos - targetDir.y * sin,
            y: targetDir.x * sin + targetDir.y * cos,
        };
    }

    return normalize(targetDir);
}

/**
 * Mark a snake as dead, spawn particles + orb drops, add kill feed entry.
 * Returns updated score delta for the player (to be added to total).
 */
export function killSnake(
    state: GameState,
    snake: SnakeEntity,
    killer: SnakeEntity | null,
    reason: string,
    W: number,
    H: number
): number {
    if (snake.isDead) return 0;
    snake.isDead = true;
    _killFeedCounter++;
    let scoreDelta = 0;

    // Explosion particles
    for (let i = 0; i < snake.body.length; i += 4) {
        const seg = snake.body[i];
        const angle = Math.random() * Math.PI * 2;
        const spd = randIn(0.5, 2.5);
        const particle: DeathParticle = {
            pos: { x: seg.x, y: seg.y },
            vel: { x: Math.cos(angle) * spd, y: Math.sin(angle) * spd },
            radius: snake.radius * randIn(0.4, 0.9),
            color: snake.color,
            life: randIn(0.6, 1.0),
        };
        state.particles.push(particle);
    }

    // Drop orbs from body positions (Persistent Food)
    // Optimization: Drop every 8 segments instead of 1 to prevent massive lag
    const dropEvery = 8; 
    for (let i = 0; i < snake.body.length; i += dropEvery) {
        // High limit for death bounty
        if (state.orbs.length >= state.orbLimit * 5) break;

        const seg = snake.body[i];
        
        // Pick a meat/food emoji for death drop
        const deathFoodTypes = ['meat', 'steak', 'poultry', 'bento', 'sushi'];
        const type = deathFoodTypes[Math.floor(Math.random() * deathFoodTypes.length)];

        state.orbs.push({
            id: _killFeedCounter * 10000 + i,
            pos: {
                x: Math.max(20, Math.min(W - 20, seg.x + randIn(-10, 10))),
                y: Math.max(20, Math.min(H - 20, seg.y + randIn(-10, 10))),
            },
            radius: Math.max(snake.radius * 0.8, 12), // Larger, more satisfying drops
            color: '#fff', 
            pulsePhase: 0,
            type
        });
    }

    // Kill feed + score
    const feedY = 20 + state.killFeed.length * 16;
    if (killer) {
        killer.kills++;
        killer.targetLength += Math.min(20, Math.floor(snake.body.length / 4));
        const text = `⚡ ${killer.name} eliminated ${snake.name}`;
        state.killFeed.push({
            id: _killFeedCounter++,
            text,
            killerName: killer.name,
            victimName: snake.name,
            reason,
            alpha: 1.0,
            y: feedY
        });
        if (killer.isPlayer) scoreDelta = KILL_SCORE + Math.floor(snake.body.length / 2);
    } else {
        // Suicide or Wall
        const text = `💀 ${snake.name} died`;
        state.killFeed.push({
            id: _killFeedCounter++,
            text,
            killerName: '',
            victimName: snake.name,
            reason,
            alpha: 1.0,
            y: feedY
        });
    }

    return scoreDelta;
}
