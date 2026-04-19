export interface Vec2 { x: number; y: number; }

export type EffectType =
    | 'ghost'        // Transparency, go through bodies
    | 'magnet'       // Pull food from distance
    | 'drunk'        // Inverted/Swaying controls
    | 'frozen'       // Complete stop
    | 'shield'       // Invulnerable to safe zone
    | 'haste'        // Speed boost
    | 'portal_eye'   // Vision
    | 'shrink'       // Size
    | 'zoom_out'     // Camera
    | 'stun'         // Placeholder
    | 'fog_of_war'   // Blind
    | 'fire_trail';  // Visual

export type AITrait = 'survivor' | 'killer' | 'glutton' | 'clumsy' | 'explorer' | 'magnet' | 'speedster' | 'protector' | 'trickster' | 'elite';

export interface ActiveEffect {
    type: EffectType;
    endTime: number;
}

export type FoodType = string;


export interface SnakeEntity {
    id: number;
    body: Vec2[];           // [head, ...tail] in pixel space
    dir: Vec2;              // normalized current direction
    targetDir: Vec2;        // target direction (smoothly interpolated)
    speed: number;          // px per frame
    isBoosting: boolean;    // space/mdown
    boostTier: 0 | 1 | 2 | 3 | 4 | 5;   // 0=0.5x, 1=1x, 2=1.5x, 3=2x, 4=2.5x, 5=0.2x
    color: string;
    glowColor: string;
    skinIndex: number;
    score: number;
    isPlayer: boolean;
    isDead: boolean;
    kills: number;
    name: string;
    radius: number;
    targetLength: number;
    distanceAccumulator: number; // For distance-based segment spawning
    targetOrbId?: number; // Persistence for AI
    lastThinkTime: number; // For throttle / timing
    lastEatTime: number;   // For eating swell animation
    lastKillTime: number;  // For kill vibration effect
    deadFrames?: number;   // Frames since death for fade-out
    activeEffects: ActiveEffect[];
    trait?: AITrait;      // Personality
    thinkOffset: number;  // For staggered CPU load
    zoneDamage: number;   // 0 to 1, increases when outside safe zone
    zoneImmunityUntil: number; // Timestamp until which the snake is immune to zone
}

export interface Orb {
    id: number;
    pos: Vec2;
    radius: number;
    color: string;
    pulsePhase: number;
    type: FoodType;
    isDissolving?: boolean;
}

export interface KillFeed {
    id: number;
    text: string;
    killerName: string;
    victimName: string;
    reason: string;
    alpha: number;
    y: number;
}

export interface DeathParticle {
    pos: Vec2;
    vel: Vec2;
    radius: number;
    color: string;
    life: number;  // 0..1
}

export interface FloatingText {
    pos: Vec2;
    text: string;
    color: string;
    life: number; // 1.0 down to 0
    id: number;
}

export interface GameState {
    snakes: SnakeEntity[];
    orbs: Orb[];
    killFeed: KillFeed[];
    particles: DeathParticle[];
    floatingTexts: FloatingText[];
    score: number;
    frame: number;
    orbLimit: number;
    gameOver: boolean;
    countdown: number | null;
    countdownStartTime: number;
    lastAIUpdate: number;
    globalSpeedFactor: number; // For game acceleration over time
    nextSpecialOrbTime: number; // For Rarity Engine
    mouseDir: Vec2 | null;
    touchDir: Vec2 | null;
    touchStart: Vec2 | null;
    keyDir: Vec2 | null;
    inputBoosting: 0 | 1 | 2 | 3 | 4 | 5;
    turboActive: boolean;
    keyHoldStartTime: number;
    lastMouseWorldPos: Vec2 | null;
    isWinner: boolean; // Flag for victory screen
    camera: { x: number; y: number; zoom: number };
    world: { width: number; height: number };
    zone?: {
        type: 'circle' | 'square';
        maxRadius: number;
        currentRadius: number;
        targetRadius: number; // Goal for the current shrinking step
        totalDurationMs: number;
        elapsedMs: number;
        pauseTimeRemaining: number;
        numSteps: number;
        isPaused: boolean;
        startDelayMs: number;
        status: string;
    };
    miniMap: {
        show: boolean;
        opacity: number;
        position: 'left' | 'right';
        isTiny?: boolean;
    };
    gasParticles?: { pos: { x: number, y: number }; vel: { x: number, y: number }; size: number; alpha: number; life: number; color: string }[];
    hasZoneStartedSound?: boolean;
}
