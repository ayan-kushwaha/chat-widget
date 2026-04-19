// constants.ts — All game configuration values

import { GameDifficulty } from '../GameShell';

// [color, glowColor, name]
export const SNAKE_COLORS: [string, string, string][] = [
    ['#00f5ff', '#00f5ff', 'Player'],
    ['#c026d3', '#e879f9', 'Snake 1'],
    ['#f97316', '#fba55a', 'Snake 2'],
    ['#22c55e', '#4ade80', 'Snake 3'],
    ['#ec4899', '#f472b6', 'Snake 4'],
];


export const BG_COLOR = '#050510';
export const GRID_DOT_OPACITY = 0.04;
export const GRID_SPACING = 30;

export const WORLD_SIZE_BY_DIFF: Record<GameDifficulty, number> = {
    easy: 3000,
    medium: 5000,
    hard: 7500,
};

export const BOT_COUNT_BY_DIFF: Record<GameDifficulty, number> = {
    easy: 60,
    medium: 100,
    hard: 150,
};

export const ZONE_STEPS_BY_DIFF: Record<GameDifficulty, number> = {
    easy: 4,
    medium: 8,
    hard: 12,
};

export const BASE_SPEED = 2.0;

export const SPEED_BY_DIFF: Record<GameDifficulty, number> = {
    easy: BASE_SPEED,
    medium: BASE_SPEED,
    hard: BASE_SPEED,
};

export const GLOBAL_SPEED_ACCEL = 0; // DISABLED
export const MAX_GLOBAL_SPEED_MULT = 1.0;
export const AI_UPDATE_MS = 100;        // Slightly slower base but offset by thinkDelay

export const MISTAKE_RATE: Record<GameDifficulty, number> = {
    easy: 0.25,      // Reduced from 0.45
    medium: 0.10,    // Reduced from 0.15
    hard: 0.02,      // Reduced from 0.03
};

export const KILL_SCORE = 120; // Headshot bonus — 120 points for killing another snake
export const TOTAL_FOOD = 0; // Depends on world size now, generated dynamically
export const FOOD_DENSITY = 0.00002; // food per sq px
export const INITIAL_LENGTH = 14;      // body segments at start
export const SEGMENT_SPACING = 5;      // px between body segments
export const AIR_TURN_RATE = 0.15;     // slightly faster turn but smoother interp
export const BOOST_SPEED_MULT_ULTRA = 0.2; // Ultra Precision
export const BOOST_SPEED_MULT_T0 = 0.5; // Crawl
export const BOOST_SPEED_MULT_T1 = 1.0; // Normal
export const BOOST_SPEED_MULT_T2 = 1.5; // Fast
export const BOOST_SPEED_MULT_T3 = 2.0; // Rush
export const BOOST_SPEED_MULT_T4 = 2.5; // Max
export const BOOST_COST_TICKS = 40;    // lose 1 segment every N frames (Drastically increased to keep length)
export const MIN_LENGTH_FOR_BOOST = 12; // need at least this to boost
export const ORB_SCORE = 1;
export const WALL_MARGIN = 80;         // Increased from 40 for better reaction time
export const BODY_AVOID_RADIUS_MULT = 7; // Increased from 6
