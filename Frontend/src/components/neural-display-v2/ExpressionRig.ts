/**
 * ExpressionRig.ts
 * ─────────────────────────────────────────────────────────────────────────
 * The mathematical core of the Liquid Morph Eye system.
 *
 * PHILOSOPHY:
 *   Instead of swapping SVG paths (choppy), we represent each eye as 8
 *   control points on a cubic bezier hull. Emotions are "deltas" — small
 *   displacements added to a neutral base. The interpolation engine blends
 *   these deltas in real time, producing infinitely smooth transitions.
 *
 * COORDINATE SPACE:
 *   SVG viewBox 0 0 100 100. Centre of eye = (50, 50).
 *
 * POINT LAYOUT (12 points, clockwise from top-left):
 *
 *      0 ── 1 ── 2 ── 3    (top edge)
 *    11                4
 *    10                5    (sides)
 *      9 ── 8 ── 7 ── 6    (bottom edge)
 * ─────────────────────────────────────────────────────────────────────────
 */

/** A 2-D point [x, y] in the SVG coordinate space */
export type Pt = readonly [number, number];

/** A 12-point neural mesh representing one eye */
export type EyeMesh = readonly [
    Pt, Pt, Pt, Pt, // Top
    Pt, Pt,         // Right
    Pt, Pt, Pt, Pt, // Bottom
    Pt, Pt          // Left
];

// ─────────────────────────────────────────────────────────────────────────
//  Emotion Vector
// ─────────────────────────────────────────────────────────────────────────

/**
 * A normalised emotion vector.
 * All values are in [0, 1]. Multiple can be non-zero simultaneously
 * (e.g. curious = thinking 0.7 + surprised 0.3).
 */
export interface EmotionVector {
    sadness: number;
    happiness: number;
    anger: number;
    thinking: number;
    surprised: number;
    sleepy: number;
    love: number;   // NEW: Liquid Heart Mesh
    star: number;   // NEW: Liquid Star Mesh
    cross: number;  // NEW: Liquid Cross Mesh
    dizzy: number;  // NEW: Shrunken Dizzy Mesh
}

export const NEUTRAL_VECTOR: EmotionVector = {
    sadness: 0,
    happiness: 0,
    anger: 0,
    thinking: 0,
    surprised: 0,
    sleepy: 0,
    love: 0,
    star: 0,
    cross: 0,
    dizzy: 0,
};

// ─────────────────────────────────────────────────────────────────────────
//  Base (Neutral) Mesh (12-Point Universal)
// ─────────────────────────────────────────────────────────────────────────
//
//  A high-fidelity rounded shape. Points are listed clockwise:
//  0,1,2,3 (Top) -> 4,5 (Right) -> 6,7,8,9 (Bottom) -> 10,11 (Left)
//
export const NEUTRAL_EYE: EyeMesh = [
    [20, 30], [40, 24], [60, 24], [80, 30], // Top edge
    [85, 42], [85, 58],                     // Right edge
    [80, 70], [60, 76], [40, 76], [20, 70], // Bottom edge
    [15, 58], [15, 42],                     // Left edge
];

/** A smaller, more compact mesh for the mouth. */
export const NEUTRAL_MOUTH: EyeMesh = [
    [32, 45], [42, 43], [58, 43], [68, 45], // Top
    [72, 48], [72, 52],                     // Right
    [68, 55], [58, 57], [42, 57], [32, 55], // Bottom
    [28, 52], [28, 48],                     // Left
];

// ─────────────────────────────────────────────────────────────────────────
//  Emotion Deltas  (displacement per point when emotion intensity = 1.0)
// ─────────────────────────────────────────────────────────────────────────

/** Each delta is a displacement added to NEUTRAL_EYE points */
export const EMOTION_DELTAS: Record<keyof EmotionVector, EyeMesh> = {

    // ── SAD: corners droop, inner-top lifts slightly ──────────────────────
    sadness: [
        [0, 15], [0, 2], [0, 2], [0, 15],  // Top: corners down
        [0, 5], [0, 2],                    // Right: slight sag
        [0, 5], [0, 2], [0, 2], [0, 5],    // Bottom: corners down
        [0, 2], [0, 5],                    // Left: slight sag
    ] as const,

    // ── HAPPY (MASCOT SMILE: ^ ^) ──────────────────────────────────────────
    // Bottom points lift UP past the center to form the arch
    happiness: [
        [0, -15], [0, -22], [0, -22], [0, -15], // Top: arch up
        [5, -5], [5, 5],                       // Right: push out
        [-5, -45], [-20, -55], [-20, -55], [-5, -45], // Bottom: BIG LIFT ⬆️
        [-5, 5], [-5, -5],                     // Left: push out
    ] as const,

    // ── ANGER: inner corners tilt down (V-shape) ──────────────────────────
    anger: [
        [5, 12], [0, 5], [0, 5], [-5, 12],  // Top: slant down
        [0, 5], [0, 0],                     // Right
        [0, 0], [0, 2], [0, 2], [0, 0],     // Bottom
        [0, 0], [0, 5],                     // Left
    ] as const,

    // ── THINKING: squint (narrows vertically) + look up ───────────────────
    thinking: [
        [0, 12], [0, 15], [0, 15], [0, 12], // Top: move down (squint)
        [0, -2], [0, -2],                   // Right
        [0, -12], [0, -15], [0, -15], [0, -12], // Bottom: move up (squint)
        [0, -2], [0, -2],                   // Left (Combined with look-at logic)
    ] as const,

    // ── SURPRISED: Tilted Egg-Shaped Vertical Ovals (Ghost Mascot Style) ──
    surprised: [
        [6, -14], [0, -18], [0, -18], [-6, -14],   // top narrow

        [-10, -4], [-10, 4],                       // sides smooth

        [-6, 16], [0, 20], [0, 20], [6, 16],       // bottom round

        [10, 4], [10, -4],                         // left balance
    ] as const,

    // skull: [
    //     [12, -8], [0, -12], [0, -12], [-12, -8],   // top flat

    // [-22, -4], [-22, 4],                       // right wide

    // [-12, 16], [0, 20], [0, 20], [12, 16],     // bottom round

    // [22, 4], [22, -4],                      // left balance
    // ] as const,

    

    // ── SLEEPY (DOTS / LINES: — —) ─────────────────────────────────────────
    // Top and bottom collapse towards the middle
    sleepy: [
        [0, 22], [0, 26], [0, 26], [0, 22], // Top: down to line
        [0, 0], [0, 0],
        [0, -18], [0, -22], [0, -22], [0, -18], // Bottom: up to line
        [0, 0], [0, 0],
    ] as const,

    // ── LOVE (HI-DEF HEART) ────────────────────────────────────────────────
    love: [
        [8, -15], [0, 25], [0, 25], [-8, -15], // Top: Character dip at 1,2
        [15, -10], [5, 5],                    // Right
        [-5, 8], [0, 22], [0, 22], [5, 8],    // Bottom: Sharp point at 7,8
        [-5, 5], [-15, -10],                  // Left
    ] as const,

    // ── STAR (MASCOT STARS) ────────────────────────────────────────────────
    star: [
        [22, 15], [0, -25], [0, -25], [-22, 15], // Peak at Top
        [30, 0], [30, 0],                        // Peak at Right
        [-22, -15], [0, 25], [0, 25], [22, -15], // Peak at Bottom
        [-30, 0], [-30, 0],                      // Peak at Left
    ] as const,

    // ── CROSS (MASCOT CROSSES: X X) ────────────────────────────────────────
    // Points shift to form two intersecting diagonal lines
    cross: [
        [-5, -15], [0, 25], [0, 25], [5, -15], // Top corners out, mids to center
        [-35, 0], [-35, 0],                   // Right mids to center
        [5, 15], [0, -25], [0, -25], [-5, 15], // Bottom corners out, mids to center
        [35, 0], [35, 0],                     // Left mids to center
    ] as const,

    // ── DIZZY (SPIRAL DOT) ─────────────────────────────────────────────────
    dizzy: [
        [20, 15], [0, 20], [0, 20], [-20, 15],
        [-25, 0], [-25, 0],
        [-20, -15], [0, -20], [0, -20], [20, -15],
        [25, 0], [25, 0],
    ] as const,
};

/** Specialized deltas for the Mouth component. */
export const MOUTH_EMOTION_DELTAS: Record<keyof EmotionVector, EyeMesh> = {
    sadness: [
        [0, 8], [0, -4], [0, -4], [0, 8],
        [0, 5], [0, 0],
        [0, -1], [0, -3], [0, -3], [0, -1],
        [0, 0], [0, 5],
    ] as const,
    happiness: [
        [0, 2], [0, 15], [0, 15], [0, 2],
        [5, 5], [5, 5],
        [-5, -8], [-15, -12], [-15, -12], [-5, -8],
        [-5, 5], [-5, 5],
    ] as const,
    anger: [
        [5, 8], [0, 2], [0, 2], [-5, 8],
        [0, 2], [0, 0],
        [0, -4], [0, -6], [0, -6], [0, -4],
        [0, 0], [0, 2],
    ] as const,
    thinking: [
        [0, 3], [0, 5], [0, 5], [0, 3],
        [0, 0], [0, 0],
        [0, -3], [0, -5], [0, -5], [0, -3],
        [0, 0], [0, 0],
    ] as const,
    surprised: EMOTION_DELTAS.surprised, // Reuse the tall oval logic
    sleepy: [
        [0, 5], [0, 7], [0, 7], [0, 5],
        [0, 0], [0, 0],
        [0, -5], [0, -7], [0, -7], [0, -5],
        [0, 0], [0, 0],
    ] as const,
    love: EMOTION_DELTAS.love,
    star: EMOTION_DELTAS.star,
    cross: EMOTION_DELTAS.cross,
    dizzy: EMOTION_DELTAS.dizzy,
};

// ─────────────────────────────────────────────────────────────────────────
//  Emotion → Vector adapter  (string-API backwards compatibility)
// ─────────────────────────────────────────────────────────────────────────

export type EmoEmotion =
    | "idle" | "happy" | "sad" | "angry" | "surprised"
    | "sleep" | "wink" | "curious" | "loading" | "thinking"
    | "love" | "star" | "dizzy" | "error" | "cute"
    | "peeking" | "rolling" | "weary" | "tornado" | "reading" | "cool" | "bored"
    | "excited" | "smug" | "mindblown" | "blank" | "frustrated"
    | "shook" | "melting" | "glitch";

export const EMOTION_TO_VECTOR: Record<EmoEmotion, EmotionVector> = {
    idle: { sadness: 0, happiness: 0.05, anger: 0, thinking: 0, surprised: 0, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    happy: { sadness: 0, happiness: 1.0, anger: 0, thinking: 0, surprised: 0, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    sad: { sadness: 1.0, happiness: 0, anger: 0, thinking: 0, surprised: 0, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    angry: { sadness: 0.1, happiness: 0, anger: 1.0, thinking: 0, surprised: 0, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    thinking: { sadness: 0, happiness: 0, anger: 0, thinking: 1.0, surprised: 0, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    curious: { sadness: 0, happiness: 0.1, anger: 0, thinking: 0.7, surprised: 0.3, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    surprised: { sadness: 0, happiness: 0, anger: 0, thinking: 0, surprised: 1.0, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    sleep: { sadness: 0.2, happiness: 0, anger: 0, thinking: 0, surprised: 0, sleepy: 1.0, love: 0, star: 0, cross: 0, dizzy: 0 },
    excited: { sadness: 0, happiness: 0.85, anger: 0, thinking: 0, surprised: 0.5, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    love: { sadness: 0, happiness: 0, anger: 0, thinking: 0, surprised: 0, sleepy: 0, love: 1.0, star: 0, cross: 0, dizzy: 0 },
    wink: { sadness: 0, happiness: 0.5, anger: 0, thinking: 0, surprised: 0, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    cute: { sadness: 0, happiness: 0.6, anger: 0, thinking: 0, surprised: 0.1, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    loading: { sadness: 0, happiness: 0, anger: 0, thinking: 0.5, surprised: 0, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    peeking: { sadness: 0, happiness: 0, anger: 0, thinking: 0.3, surprised: 0, sleepy: 0.4, love: 0, star: 0, cross: 0, dizzy: 0 },
    rolling: { sadness: 0, happiness: 0.2, anger: 0, thinking: 0, surprised: 0.2, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    weary: { sadness: 0.5, happiness: 0, anger: 0.2, thinking: 0, surprised: 0, sleepy: 0.4, love: 0, star: 0, cross: 0, dizzy: 0 },
    tornado: { sadness: 0, happiness: 0.1, anger: 0.2, thinking: 0, surprised: 0.8, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    reading: { sadness: 0, happiness: 0, anger: 0, thinking: 0.8, surprised: 0, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    cool: { sadness: 0, happiness: 0.4, anger: 0, thinking: 0, surprised: 0, sleepy: 0.2, love: 0, star: 0, cross: 0, dizzy: 0 },
    bored: { sadness: 0.3, happiness: 0, anger: 0, thinking: 0.2, surprised: 0, sleepy: 0.4, love: 0, star: 0, cross: 0, dizzy: 0 },
    smug: { sadness: 0, happiness: 0.5, anger: 0.2, thinking: 0, surprised: 0, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    star: { sadness: 0, happiness: 0, anger: 0, thinking: 0, surprised: 0, sleepy: 0, love: 0, star: 1.0, cross: 0, dizzy: 0 },
    mindblown: { sadness: 0, happiness: 0, anger: 0, thinking: 0, surprised: 1.0, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    blank: { sadness: 0, happiness: 0, anger: 0, thinking: 0.1, surprised: 0, sleepy: 0.1, love: 0, star: 0, cross: 0, dizzy: 0 },
    frustrated: { sadness: 0.3, happiness: 0, anger: 0.8, thinking: 1.0, surprised: 0, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    shook: { sadness: 0, happiness: 0, anger: 0.1, thinking: 0, surprised: 0.9, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    melting: { sadness: 0.7, happiness: 0, anger: 0, thinking: 0, surprised: 0, sleepy: 0.5, love: 0, star: 0, cross: 0, dizzy: 0 },
    glitch: { sadness: 0, happiness: 0, anger: 0.3, thinking: 0.3, surprised: 0.4, sleepy: 0, love: 0, star: 0, cross: 0, dizzy: 0 },
    dizzy: { sadness: 0.1, happiness: 0, anger: 0, thinking: 0, surprised: 0.7, sleepy: 0.2, love: 0, star: 0, cross: 0, dizzy: 1.0 },
    error: { sadness: 0, happiness: 0, anger: 0, thinking: 0, surprised: 0, sleepy: 0, love: 0, star: 0, cross: 1.0, dizzy: 0 },
};

// ─────────────────────────────────────────────────────────────────────────
//  Core math: solve final mesh from emotion vector
// ─────────────────────────────────────────────────────────────────────────

/**
 * solveMesh
 * ---------
 * Given an EmotionVector, compute the final 12-point mesh by adding each
 * emotion's weighted delta to the neutral base.
 */
export function solveMesh(vec: EmotionVector, jitter?: [number, number][], isMouth = false): EyeMesh {
    // 1. Initialise with safe neutral base (isolated copy)
    const base = isMouth ? NEUTRAL_MOUTH : NEUTRAL_EYE;
    const pts: [number, number][] = base.map((p) => [p[0], p[1]]);

    // 2. Additive blending (Isolated target keys)
    const EMOTION_KEYS: (keyof EmotionVector)[] = [
        "sadness", "happiness", "anger", "thinking", "surprised",
        "sleepy", "love", "star", "cross", "dizzy"
    ];

    const deltas = isMouth ? MOUTH_EMOTION_DELTAS : EMOTION_DELTAS;

    for (const emo of EMOTION_KEYS) {
        const val = (vec as any)[emo];
        const w = (typeof val === 'number' && !isNaN(val)) ? val : 0;
        if (w <= 0) continue;

        const delta = deltas[emo];
        if (!delta) {
            console.warn(`solveMesh: Missing delta for emotion "${emo}"`);
            continue;
        }

        // Apply 12-point translation
        for (let i = 0; i < 12; i++) {
            if (pts[i] && delta[i]) {
                pts[i][0] += delta[i][0] * w;
                pts[i][1] += delta[i][1] * w;
            }
        }
    }

    // 3. Soul Reflex (jitter/breathing) - Check for NaN
    if (jitter && jitter.length === 12) {
        for (let i = 0; i < 12; i++) {
            if (pts[i] && jitter[i]) {
                pts[i][0] += (isNaN(jitter[i][0]) ? 0 : jitter[i][0]);
                pts[i][1] += (isNaN(jitter[i][1]) ? 0 : jitter[i][1]);
            }
        }
    }

    // 4. Final Final Safety: No NaNs allowed in the path string
    for (let i = 0; i < 12; i++) {
        if (isNaN(pts[i][0]) || !isFinite(pts[i][0])) pts[i][0] = base[i][0];
        if (isNaN(pts[i][1]) || !isFinite(pts[i][1])) pts[i][1] = base[i][1];
    }

    return pts as unknown as EyeMesh;
}

/**
 * meshToPath
 * ----------
 * Convert 12-point mesh to a smooth closed quadratic spline.
 * Knots are midpoints of edges. Vertices are control points.
 */
export function meshToPath(mesh: EyeMesh): string {
    if (!mesh || mesh.length < 3) return "M 50 50 Z";
    const N = mesh.length;

    // Safety check for points
    for (let i = 0; i < N; i++) {
        if (!mesh[i] || typeof mesh[i][0] !== 'number' || isNaN(mesh[i][0])) return "M 50 50 Z";
    }

    const mid = (a: Pt, b: Pt): Pt => [
        (a[0] + b[0]) / 2,
        (a[1] + b[1]) / 2
    ];

    const start = mid(mesh[N - 1], mesh[0]);
    let d = `M ${start[0].toFixed(2)} ${start[1].toFixed(2)}`;

    for (let i = 0; i < N; i++) {
        const ctrl = mesh[i];
        const next = mesh[(i + 1) % N];
        const end = mid(ctrl, next);
        d += ` Q ${ctrl[0].toFixed(2)} ${ctrl[1].toFixed(2)} ${end[0].toFixed(2)} ${end[1].toFixed(2)}`;
    }

    d += " Z";
    return d;
}

/**
 * lerpVector
 * ----------
 * Linearly interpolate between two EmotionVectors (for manual blending).
 */
export function lerpVector(a: EmotionVector, b: EmotionVector, t: number): EmotionVector {
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    return {
        sadness: clamp(a.sadness + (b.sadness - a.sadness) * t),
        happiness: clamp(a.happiness + (b.happiness - a.happiness) * t),
        anger: clamp(a.anger + (b.anger - a.anger) * t),
        thinking: clamp(a.thinking + (b.thinking - a.thinking) * t),
        surprised: clamp(a.surprised + (b.surprised - a.surprised) * t),
        sleepy: clamp(a.sleepy + (b.sleepy - a.sleepy) * t),
        love: clamp(a.love + (b.love - a.love) * t),
        star: clamp(a.star + (b.star - a.star) * t),
        cross: clamp(a.cross + (b.cross - a.cross) * t),
        dizzy: clamp(a.dizzy + (b.dizzy - a.dizzy) * t),
    };
}
