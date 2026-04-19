import { GameState, SnakeEntity, Vec2 } from './types';

// How fast the snake loses health/opacity when in the red gas.
// 1.0 means dead. E.g., 0.002 = ~8 seconds to die at 60fps
const OOB_DAMAGE_RATE = 0.0025; 
// How fast it recovers when returning to the safe zone
const OOB_HEAL_RATE = 0.005;

/**
 * Initializes the zone with a randomized start delay (40-60s).
 */
export function initZone(
    worldW: number, 
    worldH: number, 
    durationMinutes: number,
    numSteps: number
): GameState['zone'] {
    const maxRadius = Math.max(worldW, worldH) * 0.5;
    const type = Math.random() > 0.5 ? 'circle' : 'square';
    const startDelayMs = (40 + Math.random() * 20) * 1000;

    return {
        type,
        maxRadius,
        currentRadius: maxRadius,
        targetRadius: maxRadius * (1 - 1 / numSteps),
        totalDurationMs: durationMinutes * 60 * 1000,
        elapsedMs: 0,
        pauseTimeRemaining: startDelayMs,
        isPaused: true,
        startDelayMs,
        numSteps,
        status: `Zone 1/${numSteps} Starting ${Math.ceil(startDelayMs / 1000)}s`
    };
}

/**
 * Updates the zone with PUBG-style stepped shrinking.
 */
export function updateZone(state: GameState, deltaTime: number) {
    if (!state.zone) return;
    const z = state.zone;
    z.elapsedMs += deltaTime;

    const usableTime = z.totalDurationMs - z.startDelayMs;
    // 2. Stepped Logic
    // Divide usable time into steps based on difficulty
    const numSteps = z.numSteps || 4; // Use numSteps from zone state, fallback to 4
    const stepDuration = usableTime / numSteps;
    const shrinkRatio = 0.6; // 60% shrink, 40% pause per step

    // 1. Start Delay Handling
    if (z.elapsedMs < z.startDelayMs) {
        z.status = `Zone 1/${numSteps} Starting ${Math.ceil((z.startDelayMs - z.elapsedMs) / 1000)}s`;
        z.pauseTimeRemaining = z.startDelayMs - z.elapsedMs;
        z.isPaused = true;
        // Target is the end of the first step
        z.targetRadius = z.maxRadius * (1 - 1 / numSteps);
        return;
    }

    const activeTime = z.elapsedMs - z.startDelayMs;

    if (activeTime >= usableTime) {
        z.currentRadius = 0;
        z.targetRadius = 0;
        z.status = 'Final Phase';
        z.isPaused = false;
        return;
    }

    const currentStepIndex = Math.floor(activeTime / stepDuration);
    const timeInStep = activeTime % stepDuration;
    const shrinkTimeInStep = stepDuration * shrinkRatio;
    
    // Radius targets per step
    const startRadiusOfStep = z.maxRadius * (1 - currentStepIndex / numSteps);
    const endRadiusOfStep = z.maxRadius * (1 - (currentStepIndex + 1) / numSteps);
    z.targetRadius = endRadiusOfStep;

    if (timeInStep < shrinkTimeInStep) {
        // Shrinking phase
        const stepProgress = timeInStep / shrinkTimeInStep;
        z.currentRadius = Math.max(0, startRadiusOfStep + (endRadiusOfStep - startRadiusOfStep) * stepProgress);
        z.status = `Zone ${currentStepIndex + 1}/${numSteps} Started`;
        z.isPaused = false;
        z.pauseTimeRemaining = 0;
    } else {
        // Pause phase
        z.currentRadius = Math.max(0, endRadiusOfStep);
        z.isPaused = true;
        z.pauseTimeRemaining = stepDuration - timeInStep;
        
        // Show countdown for NEXT zone if available
        if (currentStepIndex + 1 < numSteps) {
            z.status = `Zone ${currentStepIndex + 2}/${numSteps} Starting ${Math.ceil(z.pauseTimeRemaining / 1000)}s`;
        } else {
            z.status = `Zone ${currentStepIndex + 1}/${numSteps} Stop`;
        }
    }
}

/**
 * Checks all snakes against safe zone and applies penalties.
 */
export function applyZoneDamage(state: GameState, now: number) {
    if (!state.zone) return false; // Changed return type to match original
    const z = state.zone;
    const { type, currentRadius } = z;
    const cx = state.world.width / 2;
    const cy = state.world.height / 2;

    let playerJustEnteredGas = false; // Re-added for original function signature

    for (const sn of state.snakes) {
        if (sn.isDead || sn.body.length === 0) continue; // Added body.length check

        // Check for Medkit Immunity
        const isImmune = sn.zoneImmunityUntil > now;

        const head = sn.body[0];
        let isSafe = true;

        if (type === 'circle') {
            const dx = head.x - cx;
            const dy = head.y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            isSafe = dist <= currentRadius;
        } else {
            // Square logic
            isSafe = (
                head.x >= cx - currentRadius &&
                head.x <= cx + currentRadius &&
                head.y >= cy - currentRadius &&
                head.y <= cy + currentRadius
            );
        }

        if (!isSafe && !isImmune) {
            // OUT OF BOUNDS & NO IMMUNITY
            // Player specific check for alarm trigger (re-added)
            if (sn.isPlayer && sn.zoneDamage === 0) {
                playerJustEnteredGas = true;
            }

            // 1. Drain length aggressively (1.1 units as requested)
            // We drain constantly but ensure they don't go below a certain minimum (re-added original logic)
            if (state.frame % 3 === 0) { // Drain every 3 frames (~20 per sec)
                if (sn.targetLength > 10) { // Minimum length guard
                    sn.targetLength -= 1.1; 
                }
            }
            
            // 2. Increase Damage opacity meter
            sn.zoneDamage = Math.min(1, (sn.zoneDamage || 0) + OOB_DAMAGE_RATE);

            // 3. Death check
            if (sn.zoneDamage >= 1.0) {
                sn.isDead = true;
                sn.deadFrames = 0;
            }
        } else {
            if (sn.zoneDamage > 0) {
                sn.zoneDamage = Math.max(0, sn.zoneDamage - OOB_HEAL_RATE);
            }
        }
    }

    return playerJustEnteredGas;
}
