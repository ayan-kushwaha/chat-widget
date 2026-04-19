// renderer.ts — All canvas drawing functions for BattleSnake

import { SnakeEntity, Orb, KillFeed, DeathParticle, GameState } from './types';
import { BG_COLOR, GRID_DOT_OPACITY, GRID_SPACING } from './constants';
import { FOOD_REGISTRY } from './food';
import { roundRect } from './helpers';

// ── Background ────────────────────────────────────────────────────────────────

export function drawBackground(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    camera?: { x: number; y: number; zoom: number },
    screenW?: number,
    screenH?: number,
    zone?: { type: 'circle' | 'square', currentRadius: number, targetRadius: number, isPaused: boolean },
    frame?: number,
    gasParticles?: { pos: { x: number, y: number }; alpha: number; life: number; size: number }[]
) {
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = `rgba(255,255,255,${GRID_DOT_OPACITY})`;

    let startX = GRID_SPACING / 2;
    let endX = W;
    let startY = GRID_SPACING / 2;
    let endY = H;

    if (camera && screenW && screenH) {
        const marginX = (screenW / camera.zoom) / 2 + 100;
        const marginY = (screenH / camera.zoom) / 2 + 100;
        startX = Math.max(0, camera.x - marginX);
        endX = Math.min(W, camera.x + marginX);
        startY = Math.max(0, camera.y - marginY);
        endY = Math.min(H, camera.y + marginY);

        // Snap to grid
        startX = Math.floor(startX / GRID_SPACING) * GRID_SPACING + GRID_SPACING / 2;
        startY = Math.floor(startY / GRID_SPACING) * GRID_SPACING + GRID_SPACING / 2;
    }

    ctx.beginPath();
    for (let x = startX; x < endX; x += GRID_SPACING) {
        for (let y = startY; y < endY; y += GRID_SPACING) {
            ctx.moveTo(x, y);
            ctx.arc(x, y, 1, 0, Math.PI * 2);
        }
    }
    ctx.fill();

    // ── World Border ──────────────────────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = '#3b82f6'; // Bright blue border
    ctx.lineWidth = 15;
    // Removed glow for HD sharpness
    ctx.strokeRect(0, 0, W, H);

    // Outer "danger" stroke removed
    ctx.restore();

    // ── Shrinking Zone (Battle Royale Red Gas) ───────────────────────────────
    if (zone) {
        ctx.save();
        const { type, currentRadius } = zone;
        const cx = W / 2;
        const cy = H / 2;

        // Create a masking effect: Fill everything BUT the safe zone
        ctx.beginPath();
        // Outer bounds: Make it huge so gas feels all-encompassing (not just the map)
        const margin = 10000;
        ctx.rect(-margin, -margin, W + margin * 2, H + margin * 2);

        // Inner bounds (the safe hole) - use counter-clockwise to "punch out"
        if (type === 'circle') {
            ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2, true);
        } else {
            ctx.rect(cx + currentRadius, cy - currentRadius, -currentRadius * 2, currentRadius * 2);
        }

        // Fill the area outside currentRadius with Red Gas
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.fill();

        // 💨 Smoke Effect (Floating Gas Clouds)
        if (gasParticles && gasParticles.length > 0) {
            ctx.save();

            // Masking: Only draw smoke in the danger area
            ctx.beginPath();
            ctx.rect(-margin, -margin, W + margin * 2, H + margin * 2);
            if (type === 'circle') {
                ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2, true);
            } else {
                ctx.rect(cx + currentRadius, cy - currentRadius, -currentRadius * 2, currentRadius * 2);
            }
            ctx.clip(); // 🛡️ Ensure smoke stays INSIDE danger zone

            ctx.filter = 'blur(40px)';
            for (const p of gasParticles) {
                const opacity = p.alpha * p.life * 0.6;
                ctx.fillStyle = (p as any).color ? (p as any).color : `rgba(255, 30, 30, ${opacity})`;
                // If it has a hex/string color, we need to apply alpha
                if ((p as any).color) {
                    ctx.globalAlpha = opacity;
                }
                ctx.beginPath();
                ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
            ctx.restore();
        }

        // 🟢 Pulsing Border Animation (Only when shrinking)
        if (zone && !zone.isPaused && frame) {
            const pulse = (Math.sin(frame * 0.1) + 1) * 0.5; // 0 to 1
            ctx.strokeStyle = `rgba(255, 50, 50, ${0.4 + pulse * 0.4})`;
            ctx.lineWidth = 2 + pulse * 4;
            ctx.beginPath();
            if (type === 'circle') {
                ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
            } else {
                ctx.strokeRect(cx - currentRadius, cy - currentRadius, currentRadius * 2, currentRadius * 2);
            }
            ctx.stroke();
        }

        // Safe border lines removed

        // 🟢 NEXT SAFE ZONE GUIDE (White dashed line)
        const { targetRadius } = zone;
        if (targetRadius > 0 && targetRadius < currentRadius) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            if (type === 'circle') {
                ctx.arc(cx, cy, targetRadius, 0, Math.PI * 2);
            } else {
                ctx.strokeRect(cx - targetRadius, cy - targetRadius, targetRadius * 2, targetRadius * 2);
            }
            ctx.stroke();
        }

        ctx.restore();
    }
}

// ── Mini-map ───────────────────────────────────────────────────────────────

export function drawMiniMap(ctx: CanvasRenderingContext2D, state: GameState) {
    const { miniMap, world, zone, snakes } = state;
    if (!miniMap.show) return;

    const canvasW = ctx.canvas.width / (ctx.getTransform().a || 1);
    const canvasH = ctx.canvas.height / (ctx.getTransform().d || 1);

    const isTiny = !!miniMap.isTiny;
    const miniSize = isTiny ? 45 : Math.max(70, Math.min(canvasW * 0.35, 220));
    const padding = 0; // Stick to edges in all modes

    // Calculate position
    const x = miniMap.position === 'right' ? (canvasW - miniSize - padding) : padding;
    const y = canvasH - miniSize - padding;

    ctx.save();
    ctx.globalAlpha = miniMap.opacity;
    ctx.translate(x, y);

    // Background box removed as requested

    // 1px White Border (Restored as requested)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, miniSize, miniSize);

    // ── Zone Status Text (Outside Map) ──────────────────────────────────────────
    if (state.zone) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `600 ${isTiny ? 5.5 : 8}px Inter, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(state.zone.status, 2, -5); // Moved outside as requested
    }

    // Scaling Factor
    const scale = miniSize / Math.max(world.width, world.height);

    // ── 1. Draw Zone ──────────────────────────────────────────────────────────
    if (zone) {
        ctx.save();
        const cx = (world.width / 2) * scale;
        const cy = (world.height / 2) * scale;
        const curR = zone.currentRadius * scale;

        // Match the "Gas" look but for the mini-map
        ctx.beginPath();
        ctx.rect(0, 0, miniSize, miniSize);
        if (zone.type === 'circle') {
            ctx.arc(cx, cy, curR, 0, Math.PI * 2, true);
        } else {
            ctx.rect(cx + curR, cy - curR, -curR * 2, curR * 2);
        }
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'; // Faint red on map
        ctx.fill();
        ctx.restore();
    }

    // 2. Draw Orbs (Food Dots) - White
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (const orb of state.orbs) {
        const dotX = orb.pos.x * scale;
        const dotY = orb.pos.y * scale;
        ctx.fillRect(dotX, dotY, 1, 1);
    }

    // 3. Draw Snakes
    for (const s of snakes) {
        if (s.isDead) continue;
        const h = s.body[0];
        const dotX = h.x * scale;
        const dotY = h.y * scale;

        // Dynamic size based on length
        const baseSize = isTiny ? 0.8 : 1.5;
        const lengthFactor = Math.min(3, 1 + s.body.length / 50);
        const dotRadius = baseSize * lengthFactor;

        if (s.isPlayer) {
            // ❤️ Heart for player
            ctx.font = `${isTiny ? 10 : 14}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('❤️', dotX, dotY);
        } else {
            // Color dot for others
            ctx.fillStyle = s.color || '#aaaaaa';
            ctx.beginPath();
            ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

// ── Orb ───────────────────────────────────────────────────────────────────────

export function drawOrb(ctx: CanvasRenderingContext2D, orb: Orb, frame: number) {
    const r = orb.radius;
    const type = orb.type as string;
    const meta = FOOD_REGISTRY[type];

    if (!meta) return;

    ctx.save();

    // Static scale
    const scale = 1.0;

    const icon = meta.emoji;
    // Special font for emojis to ensure cross-platform consistency
    ctx.font = `${r * 2.2 * scale}px "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(icon, orb.pos.x, orb.pos.y);

    ctx.restore();
}

// ── Snake ─────────────────────────────────────────────────────────────────────

export function drawSnake(
    ctx: CanvasRenderingContext2D,
    snake: SnakeEntity,
    frame: number,
    mode: string
) {
    if (snake.body.length < 2) return;
    let r = snake.radius;

    ctx.save();

    if (snake.isDead) {
        const deadAlpha = Math.max(0, 0.4 - (snake.deadFrames || 0) * 0.004);
        ctx.globalAlpha = deadAlpha;
        if (deadAlpha <= 0) { ctx.restore(); return; }
    }

    const hasEffect = (t: string) => snake.activeEffects.some(e => e.type === t);

    let offX = 0, offY = 0, dmgTint = 0;
    if (snake.zoneDamage > 0) {
        ctx.globalAlpha *= (1 - snake.zoneDamage * 0.7);
        const intensity = snake.zoneDamage * 10;
        offX = (Math.random() - 0.5) * intensity;
        offY = (Math.random() - 0.5) * intensity;
        dmgTint = snake.zoneDamage;
    }

    ctx.save();
    ctx.translate(offX, offY);

    if (dmgTint > 0 && frame % 4 < 2) {
        ctx.filter = `sepia(1) saturate(5) hue-rotate(-50deg) brightness(${1 + dmgTint})`;
    } else if (hasEffect('drunk')) {
        ctx.filter = `hue-rotate(${(frame * 5) % 360}deg)`;
    } else if (hasEffect('frozen')) {
        ctx.filter = 'brightness(1.5) saturate(0.5) sepia(0.2) hue-rotate(180deg)';
    }

    // Aura
    if (snake.activeEffects.length > 0) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        for (const eff of snake.activeEffects) {
            let color = '';
            if (eff.type === 'shield') color = '#facc15';
            if (eff.type === 'haste') color = '#f87171';

            if (color) {
                ctx.fillStyle = color;
                for (let i = 0; i < snake.body.length; i += 8) {
                    const seg = snake.body[i];
                    ctx.beginPath(); ctx.arc(seg.x, seg.y, r * 1.8, 0, Math.PI * 2); ctx.fill();
                }
            }
        }
        ctx.restore();
    }

    // Ice Effect Visual (Barf zm jayga)
    const isFrozen = snake.activeEffects.some(e => e.type === 'frozen');
    if (isFrozen) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#cdf3ff'; // Frosty light blue
        // Draw blocks along the body
        for (let i = 0; i < snake.body.length; i += 2) {
            const seg = snake.body[i];
            const size = r * 2.2;
            ctx.fillRect(seg.x - size / 2, seg.y - size / 2, size, size);
        }
        ctx.restore();

        // 🧊 icon above head
        const head = snake.body[0];
        ctx.save();
        ctx.font = `${r * 2.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('🧊', head.x, head.y - r * 3);
        ctx.restore();
    }

    if (snake.activeEffects.some(e => e.type === 'shrink')) r *= 0.65;

    // Zone Immunity Aura
    const now = performance.now();
    if (snake.zoneImmunityUntil > now) {
        ctx.save();
        ctx.globalAlpha = Math.sin(frame * 0.2) * 0.2 + 0.4;
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(snake.body[0].x, snake.body[0].y, r * 2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    _drawBodySkin(ctx, snake, frame);
    _drawEvoHead(ctx, snake, r, frame, mode);

    if (snake.isPlayer && (mode === 'PvC' || mode === 'AI_PLAYER') && snake.boostTier > 0 && !snake.isDead) {
        _drawSpeedIndicator(ctx, snake, r, frame, mode);
    }

    if (snake.isPlayer && (mode === 'PvC' || mode === 'AI_PLAYER')) {
        const head = snake.body[0];
        ctx.save();
        ctx.font = `${Math.max(8, r * 1.2)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('❤️', head.x, head.y - r * 1.8);
        if (snake.zoneImmunityUntil > now) {
            ctx.fillText('🛡️', head.x + r * 1.5, head.y - r * 1.5);
        }
        ctx.restore();
    }

    ctx.restore(); // Jitter restore
    ctx.restore(); // Main restore
}

function _getTier(s: number) {
    if (s >= 1500) return 10;
    if (s >= 1200) return 9;
    if (s >= 900) return 8;
    if (s >= 700) return 7;
    if (s >= 500) return 6;
    if (s >= 350) return 5;
    if (s >= 200) return 4;
    if (s >= 100) return 3;
    if (s >= 50) return 2;
    return 1;
}

function _drawBodySkin(ctx: CanvasRenderingContext2D, snake: SnakeEntity, frame: number) {
    const r = snake.radius;
    const skin = snake.skinIndex;

    const path = new Path2D();
    if (snake.body.length > 0) {
        path.moveTo(snake.body[0].x, snake.body[0].y);
        for (let i = 1; i < snake.body.length; i++) {
            const prev = snake.body[i - 1];
            const curr = snake.body[i];
            const mx = (prev.x + curr.x) / 2;
            const my = (prev.y + curr.y) / 2;
            path.quadraticCurveTo(prev.x, prev.y, mx, my);
        }
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Layer 1: Bio-Aura (Fluid Glow)
    ctx.strokeStyle = snake.color;
    ctx.lineWidth = r * 2.6;
    ctx.globalAlpha = 0.12;
    ctx.stroke(path);

    // Layer 2: Primary Organic Mass
    ctx.lineWidth = r * 2.0;
    ctx.globalAlpha = 1.0;
    ctx.stroke(path);

    // Layer 3: Central Highlight Core
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = r * 0.4;
    ctx.stroke(path);

    // Layer 3.5: Digest Flow (Traveling pulse for organic "Body Flow")
    const now = performance.now();
    const eatDt = now - snake.lastEatTime;
    if (eatDt < 800) {
        ctx.save();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = r * 2.5;
        ctx.globalAlpha = (1 - eatDt / 800) * 0.3;
        ctx.setLineDash([r * 4, r * 20]);
        ctx.lineDashOffset = -eatDt * 0.8;
        ctx.stroke(path);
        ctx.restore();
    }

    // Layer 4: Procedural Skin Patterns
    ctx.save();
    switch (skin) {
        case 0: // Skull Skin
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = r * 2.1;
            ctx.stroke(path);
            break;
        case 1: // Rage Spines
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.setLineDash([r * 0.5, r * 2]);
            ctx.lineWidth = r * 2.2;
            ctx.stroke(path);
            break;
        case 3: // Zebra / Exotic
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.setLineDash([r * 2, r * 2.5]);
            ctx.lineWidth = r * 1.8;
            ctx.stroke(path);
            break;
        case 4: // Alien Bio-Lum
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = r * 0.2;
            ctx.setLineDash([5, 15]);
            ctx.globalAlpha = 0.8;
            ctx.stroke(path);
            break;
        case 9: // Fire Core
            const hue = (frame * 5) % 360;
            ctx.strokeStyle = `hsla(${hue}, 90%, 50%, 0.3)`;
            ctx.lineWidth = r * 1.5;
            ctx.stroke(path);
            break;
        case 14: // Electro Spark
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 1;
            ctx.setLineDash([r, r * 4]);
            ctx.lineDashOffset = frame * 10;
            ctx.stroke(path);
            break;
        case 19: // Matrix Flux
            ctx.strokeStyle = '#00ff41';
            ctx.lineWidth = 2;
            ctx.setLineDash([2, 30]);
            ctx.lineDashOffset = -frame * 4;
            ctx.stroke(path);
            break;
        default:
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = r * 0.8;
            ctx.stroke(path);
    }
    ctx.restore();
    ctx.restore();
}

function _drawEvoHead(ctx: CanvasRenderingContext2D, snake: SnakeEntity, r: number, frame: number, mode: string) {
    const head = snake.body[0];
    const s = snake.score;
    const tier = _getTier(s);
    const family = snake.skinIndex; // Skin maps to Beast Family

    const now = performance.now();
    const eatDt = now - snake.lastEatTime;
    const killDt = now - snake.lastKillTime;

    // Eating Swell: Head grows 50% bigger for 200ms
    const swellFactor = eatDt < 200 ? 1.5 - (eatDt / 200) * 0.5 : 1.0;

    // Boss Pulse for King (Tier 10)
    const bossPulse = (tier === 10) ? 1.0 + Math.sin(frame * 0.1) * 0.08 : 1.0;
    const currentR = r * swellFactor * bossPulse;

    // Kill Vibration: Head shakes if killed recently (600ms)
    let vibX = 0;
    let vibY = 0;
    if (killDt < 600) {
        const intensity = (1 - killDt / 600) * r * 0.8;
        vibX = (Math.random() - 0.5) * intensity;
        vibY = (Math.random() - 0.5) * intensity;
    }

    ctx.save();
    ctx.translate(head.x + vibX, head.y + vibY);
    const angle = Math.atan2(snake.dir.y, snake.dir.x);
    ctx.rotate(angle);

    ctx.fillStyle = snake.color;

    // Victory Glow on Head
    if (killDt < 600) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fff';
    }

    // Router for Family Specific Drawing
    _drawBeastFamily(ctx, family, tier, currentR, snake.color, frame);

    ctx.restore();

    // Eyes
    const isEvil = family === 1 || family === 3 || family === 17;
    const eyeColor = tier >= 5 || isEvil ? '#ff0000' : '#ffffff';
    _drawEyes(ctx, snake, eyeColor, tier >= 6, currentR);
}

function _drawBeastFamily(ctx: CanvasRenderingContext2D, family: number, tier: number, r: number, color: string, frame: number) {
    ctx.beginPath();
    switch (family) {
        case 0: // Skull Family (Bio-Bone Structure)
            ctx.arc(r * 0.4, 0, r * 1.2, 0, Math.PI * 2); // Cranium
            if (tier >= 3) { // Mandible / Jaw
                ctx.roundRect(-r * 0.8, r * 0.4, r * 1.6, r * 1.2, r * 0.3);
            }
            break;
        case 1: // Rage Family (Aggressive Diamond-Snout)
            ctx.moveTo(r * 2.5, 0);
            ctx.lineTo(r * 0.5, r * 1.5);
            ctx.lineTo(-r * 1.2, r * 0.8);
            ctx.lineTo(-r * 1.2, -r * 0.8);
            ctx.lineTo(r * 0.5, -r * 1.5);
            ctx.closePath();
            break;
        case 2: // Ghost Family (Wavy)
            const wave = Math.sin(frame * 0.2) * r * 0.2;
            ctx.moveTo(r * 1.5, wave);
            ctx.quadraticCurveTo(0, r * 2, -r * 1.5, wave);
            ctx.quadraticCurveTo(0, -r * 2, r * 1.5, wave);
            break;
        case 3: // Oni/Demon Family
            ctx.moveTo(r * 1.8, 0);
            ctx.lineTo(-r * 0.5, r * 1.6);
            ctx.lineTo(-r * 1.2, 0);
            ctx.lineTo(-r * 0.5, -r * 1.6);
            ctx.closePath();
            break;
        case 4: // Alien Family
            ctx.moveTo(r * 2.2, 0);
            ctx.quadraticCurveTo(r * 0.5, r * 1.8, -r * 1.4, r * 1.2);
            ctx.lineTo(-r * 1.4, -r * 1.2);
            ctx.quadraticCurveTo(r * 0.5, -r * 1.8, r * 2.2, 0);
            break;
        case 5: // Lion/Apex Family
            ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
            // Mane crest
            for (let i = 0; i < 5; i++) {
                const a = i * 0.5 - 1;
                ctx.moveTo(-r, a * r);
                ctx.lineTo(-r * 2.5, a * r * 1.5);
            }
            break;
        case 6: // Wolf Family
            ctx.moveTo(r * 2.5, 0); // Snout
            ctx.lineTo(-r * 0.5, r * 1.4);
            ctx.lineTo(-r * 1.5, r * 0.8);
            ctx.lineTo(-r * 1.5, -r * 0.8);
            ctx.lineTo(-r * 0.5, -r * 1.4);
            ctx.closePath();
            break;
        case 7: // Robot/Tech Family (Armored Visor)
            ctx.moveTo(r * 2, r * 0.6);
            ctx.lineTo(r * 2, -r * 0.6);
            ctx.lineTo(r * 1.2, -r * 1.6);
            ctx.lineTo(-r * 1.5, -r * 1.6);
            ctx.lineTo(-r * 1.5, r * 1.6);
            ctx.lineTo(r * 1.2, r * 1.6);
            ctx.closePath();
            break;
        case 8: // Toxic Family
            ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
            const bub = Math.sin(frame * 0.1) * r * 0.3;
            ctx.arc(-r, -r, r * 0.5 + bub, 0, Math.PI * 2);
            ctx.arc(-r, r, r * 0.5 + bub, 0, Math.PI * 2);
            break;
        case 9: // Fire/Lava Family
            ctx.moveTo(r * 2.5, 0);
            for (let i = 0; i < 6; i++) {
                const pulse = Math.sin(frame * 0.3 + i) * r * 0.5;
                ctx.lineTo(-r * (1 + i % 2), (i - 2.5) * r + pulse);
            }
            ctx.closePath();
            break;
        case 10: // Shadow/Moon Family
            ctx.arc(0, 0, r * 1.5, Math.PI * 0.2, Math.PI * 1.8);
            ctx.lineTo(r, 0); ctx.closePath();
            break;
        case 11: // Bone/Undead Family
            ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
            // Sunken orbits
            ctx.rect(r * 0.2, -r * 0.5, r * 0.5, r * 0.5);
            ctx.rect(r * 0.2, r * 0.1, r * 0.5, r * 0.5);
            break;
        case 12: // Hornet/Insect
            ctx.moveTo(r * 3, 0); // Stinger
            ctx.lineTo(r * 0.5, r * 1.8);
            ctx.lineTo(-r * 1.5, 0);
            ctx.lineTo(r * 0.5, -r * 1.8);
            ctx.closePath();
            break;
        case 13: // Kraken/Abyssal
            ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
            for (let i = 0; i < 4; i++) {
                const a = (i - 1.5) * 0.8;
                ctx.moveTo(-r, a * r);
                ctx.lineTo(-r * 3, a * r * 1.2);
            }
            break;
        case 14: // Electro/Storm
            ctx.moveTo(r * 2, 0);
            ctx.lineTo(0, r * 1.5);
            ctx.lineTo(-r, r * 0.5);
            ctx.lineTo(-r * 2, r * 1.5);
            ctx.lineTo(-r * 2, -r * 1.5);
            ctx.lineTo(-r, -r * 0.5);
            ctx.lineTo(0, -r * 1.5);
            ctx.closePath();
            break;
        case 15: // Thorn/Cactus Family
            ctx.moveTo(r * 1.5, 0);
            for (let i = 0; i < 12; i++) {
                const angle = (i / 6) * Math.PI;
                const d = r * (i % 2 === 0 ? 1.8 : 1.2);
                ctx.lineTo(Math.cos(angle) * d, Math.sin(angle) * d);
            }
            ctx.closePath();
            break;
        case 16: // Royal/King Family
            ctx.moveTo(r * 1.8, 0);
            ctx.lineTo(r, r * 1.2);
            ctx.lineTo(-r * 1.5, r * 1.2);
            ctx.lineTo(-r * 1.5, -r * 1.2);
            ctx.lineTo(r, -r * 1.2);
            ctx.closePath();
            break;
        case 17: // Psycho Family
            const shp = Math.sin(frame * 0.5) * 0.2;
            ctx.ellipse(0, 0, r * (1.5 + shp), r * (1.2 - shp), 0, 0, Math.PI * 2);
            break;
        case 18: // Alarm/Danger Family
            ctx.moveTo(r * 2, 0);
            ctx.lineTo(-r, r * 1.8);
            ctx.lineTo(-r, -r * 1.8);
            ctx.closePath();
            break;
        case 19: // Matrix/System (Visor-Frame)
            ctx.moveTo(r * 2, r * 0.5);
            ctx.lineTo(r * 2, -r * 0.5);
            ctx.lineTo(r * 1.5, -r * 1.2);
            ctx.lineTo(-r * 1.5, -r * 1.2);
            ctx.lineTo(-r * 1.5, r * 1.2);
            ctx.lineTo(r * 1.5, r * 1.2);
            ctx.closePath();
            // Lens detail
            if (tier >= 3) {
                ctx.rect(r * 0.8, -r * 0.4, r * 0.8, r * 0.8);
            }
            break;
        default: // Mutant Beast
            if (tier <= 3) {
                ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
            } else {
                ctx.moveTo(r * 2.2, 0);
                ctx.lineTo(-r * 0.8, r * 1.8);
                ctx.lineTo(-r * 1.2, 0);
                ctx.lineTo(-r * 0.8, -r * 1.8);
                ctx.closePath();
            }
    }
    ctx.fill();
}

function _drawSpeedIndicator(ctx: CanvasRenderingContext2D, snake: SnakeEntity, r: number, frame: number, mode: string) {
    const head = snake.body[0];
    const offset = r * 3.5; // Distance in front of head

    // Animate forward motion of the arrows
    const animOffset = (frame * 1.5) % 15;
    const fwdX = head.x + snake.dir.x * (offset + animOffset);
    const fwdY = head.y + snake.dir.y * (offset + animOffset);

    ctx.save();
    ctx.translate(fwdX, fwdY);
    ctx.rotate(Math.atan2(snake.dir.y, snake.dir.x));

    const drawArrow = (x: number) => {
        ctx.beginPath();
        ctx.moveTo(x - r * 0.8, -r * 0.8);
        ctx.lineTo(x + r * 0.2, 0);
        ctx.lineTo(x - r * 0.8, r * 0.8);
        ctx.lineTo(x - r * 0.4, 0);
        ctx.closePath();
        ctx.fill();
    };

    // SPEED INDICATOR LOGIC
    // Tier 1 (1.0x) -> No arrows
    // Tier 2 (1.5x) -> 2 Blue Arrows
    // Tier 3 (2.0x) -> 3 Blue Arrows
    // Tier 4 (2.5x) -> 3 RED Arrows (Max Turbo)
    // Tier 5 (0.5x) -> No arrows

    if (snake.boostTier === 2) {
        // Tier 2 (1.5x) - 2 Blue
        ctx.fillStyle = '#4dffff';
        drawArrow(0);
        drawArrow(r * 1.3);
    } else if (snake.boostTier === 3) {
        // Tier 3 (2.0x) - 3 Blue
        ctx.fillStyle = '#4dffff';
        drawArrow(0);
        drawArrow(r * 1.3);
        drawArrow(r * 2.6);
    } else if (snake.boostTier === 4) {
        // Tier 4 (2.5x) - 3 RED (Ultra Turbo)
        ctx.fillStyle = '#ff4d4d';
        ctx.shadowColor = '#ff4d4d';
        ctx.shadowBlur = 15;
        drawArrow(0);
        drawArrow(r * 1.3);
        drawArrow(r * 2.6);
    }

    ctx.restore();
}

function _drawEyes(ctx: CanvasRenderingContext2D, snake: SnakeEntity, color: string, isRage: boolean, overrideRadius?: number) {
    const r = overrideRadius || snake.radius;
    const head = snake.body[0];
    const eyeOffset = r * 0.55;
    const perpX = -snake.dir.y * eyeOffset;
    const perpY = snake.dir.x * eyeOffset;
    const fwdX = snake.dir.x * r * 0.55;
    const fwdY = snake.dir.y * r * 0.55;
    const eyeR = Math.max(2, r * 0.28);

    for (const side of [1, -1]) {
        const ex = head.x + fwdX + perpX * side;
        const ey = head.y + fwdY + perpY * side;
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        if (isRage) {
            // Slit pupil for rage
            const sx = ex - snake.dir.x * eyeR * 0.2;
            const sy = ey - snake.dir.y * eyeR * 0.2;
            ctx.ellipse(sx + snake.dir.x * eyeR * 0.4, sy + snake.dir.y * eyeR * 0.4, eyeR * 0.6, eyeR * 0.2, Math.atan2(snake.dir.y, snake.dir.x), 0, Math.PI * 2);
        } else {
            ctx.arc(ex + snake.dir.x * eyeR * 0.4, ey + snake.dir.y * eyeR * 0.4, eyeR * 0.55, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
    }
}

function _drawAlphaAura(ctx: CanvasRenderingContext2D, head: { x: number, y: number }, r: number, color: string, frame: number) {
    ctx.save();
    const pulse = Math.sin(frame * 0.1) * 2;
    const ringR = r * 2.5 + pulse;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -frame * 0.5;

    ctx.beginPath();
    ctx.arc(head.x, head.y, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Outer glow
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 6;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(head.x, head.y, ringR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

// ── Particles ─────────────────────────────────────────────────────────────────

export function drawParticles(ctx: CanvasRenderingContext2D, particles: DeathParticle[]) {
    for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        // Removed glow for sharpness
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.radius * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: any[]) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of texts) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, t.life);
        ctx.fillStyle = t.color;

        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;

        // Compensate for camera zoom to keep text size constant in screen space
        const zoom = (ctx.getTransform().a) / (window.devicePixelRatio || 1); // Extract zoom from transform
        const baseSize = 22; 
        const lifeScale = (1.0 - t.life) * 12;
        const size = (baseSize + lifeScale) / (zoom || 1); // Inverse scale by zoom
        
        ctx.font = `bold ${size}px 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', 'Inter', sans-serif`;
        ctx.fillText(t.text, t.pos.x, t.pos.y);
        ctx.restore();
    }
    ctx.restore();
}

// ── Kill Feed ─────────────────────────────────────────────────────────────────

export function drawKillFeed(ctx: CanvasRenderingContext2D, killFeed: KillFeed[], W: number) {
    const isSmall = W < 400;
    if (isSmall) return; // Hide kill feed in widget for minimalism
    const fontSize = Math.max(9, Math.min(11, W * 0.024));

    ctx.save();
    ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
    ctx.textAlign = 'right';

    // clip so text never overflows left edge
    const clipX = 0;
    ctx.beginPath();
    ctx.rect(clipX, 0, W - clipX, 200);
    ctx.clip();

    for (const kf of killFeed) {
        ctx.save();
        ctx.globalAlpha = kf.alpha;
        ctx.fillStyle = '#ff6b6b';
        // Removed glow for sharpness

        // Responsive text: concise for small screens
        const displayName = (name: string) => {
            return name;
        };

        const drawText = kf.text + ` (${kf.reason})`;

        ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
        ctx.fillText(drawText, W - 4, kf.y);
        ctx.restore();
    }
    ctx.restore();
}

// ── HUD ───────────────────────────────────────────────────────────────────────

// HUD removed - now handled via GameShell header status updates
export function drawHUD() { }

/** Draws a radial mask that obscures the map except for the snake's immediate area. */
export function drawFogOfWar(ctx: CanvasRenderingContext2D, W: number, H: number, snake: SnakeEntity, camera: { x: number; y: number; zoom: number }) {
    ctx.save();

    // Transform head to screen space
    const head = snake.body[0];
    const screenX = (head.x - camera.x) * camera.zoom + W / 2;
    const screenY = (head.y - camera.y) * camera.zoom + H / 2;
    const radius = 250 * camera.zoom;

    // Create a softening cinematic overlay
    const grad = ctx.createRadialGradient(screenX, screenY, radius * 0.3, screenX, screenY, radius * 1.5);
    grad.addColorStop(0, 'rgba(2,2,5,0)');
    grad.addColorStop(0.5, 'rgba(2,2,5,0.4)');
    grad.addColorStop(1, 'rgba(2,2,5,0.85)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle edge blur without solid void
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(screenX, screenY, radius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// ── Game Over overlay ─────────────────────────────────────────────────────────

export function drawGameOver(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    score: number
) {
    ctx.save();
    ctx.fillStyle = 'rgba(5,5,16,0.85)';
    ctx.fillRect(0, 0, W, H);

    const isSmall = W < 400;
    const titleSize = Math.max(14, Math.min(24, W * 0.06));
    const subSize = Math.max(10, Math.min(14, W * 0.038));
    const centerY = isSmall ? H * 0.38 : H * 0.45;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 14;
    ctx.font = `bold ${titleSize}px 'Inter', sans-serif`;
    ctx.fillText('💀 GAME OVER', W / 2, centerY);

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `${subSize}px 'Inter', sans-serif`;
    ctx.fillText(`Score: ${score}`, W / 2, centerY + titleSize * 0.8);

    // Button Layout: Two side-by-side buttons
    const spacing = 12;
    const btnW = isSmall ? Math.min(80, W * 0.38) : Math.min(120, W * 0.25);
    const btnH = Math.max(32, H * 0.08);

    // Position buttons horizontally centered with spacing
    const totalW = btnW * 2 + spacing;
    const startX = W / 2 - totalW / 2;
    const btnY = centerY + titleSize * 1.5;

    // 1. Replay Button (Left)
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, startX, btnY, btnW, btnH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${subSize * 0.9}px 'Inter', sans-serif`;
    ctx.fillText('↻ Replay', startX + btnW / 2, btnY + btnH / 2 + subSize * 0.35);

    // 2. Menu Button (Right)
    const menuX = startX + btnW + spacing;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, menuX, btnY, btnW, btnH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `bold ${subSize * 0.9}px 'Inter', sans-serif`;
    ctx.fillText('↩ Menu', menuX + btnW / 2, btnY + btnH / 2 + subSize * 0.35);

    ctx.restore();
}

/** Internal helper to get shared button dimensions */
function getButtonLayout(W: number, H: number) {
    const isSmall = W < 400;
    const titleSize = Math.max(14, Math.min(24, W * 0.06));
    const centerY = isSmall ? H * 0.38 : H * 0.45;
    const spacing = 12;
    const btnW = isSmall ? Math.min(80, W * 0.38) : Math.min(120, W * 0.25);
    const btnH = Math.max(32, H * 0.08);
    const totalW = btnW * 2 + spacing;
    const startX = W / 2 - totalW / 2;
    const btnY = centerY + titleSize * 1.5;
    return { btnW, btnH, startX, btnY, spacing };
}

/** Checks if a click hits the game-over "Replay" button. */
export function isReplayButtonClick(W: number, H: number, mx: number, my: number): boolean {
    const { btnW, btnH, startX, btnY } = getButtonLayout(W, H);
    // Liberal hit-box (+15px) for high reliability
    return mx >= startX - 15 && mx <= startX + btnW + 15 && my >= btnY - 15 && my <= btnY + btnH + 15;
}

/** Checks if a click hits the game-over "Menu" button. */
export function isMenuButtonClick(W: number, H: number, mx: number, my: number): boolean {
    const { btnW, btnH, startX, btnY, spacing } = getButtonLayout(W, H);
    const menuX = startX + btnW + spacing;
    // Liberal hit-box (+15px) for high reliability
    return mx >= menuX - 15 && mx <= menuX + btnW + 15 && my >= btnY - 15 && my <= btnY + btnH + 15;
}

/** Draws a large countdown number in the center. */
export function drawCountdown(ctx: CanvasRenderingContext2D, value: number, W: number, H: number) {
    if (value <= 0) return;
    const isSmall = W < 400;
    const size = isSmall ? Math.min(50, W * 0.2) : Math.min(100, W * 0.15);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${size}px 'Inter', sans-serif`;

    // Glow effect
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = isSmall ? 10 : 20;
    ctx.fillStyle = '#fff';

    ctx.fillText(value.toString(), W / 2, H / 2);
    ctx.restore();
}
