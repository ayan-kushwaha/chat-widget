// EmojiReactions.ts — Logic for triggering visual emoji feedback
import { GameState, Vec2 } from './types';

/** Supported reaction types for the game */
export type ReactionType = 
    | 'kill' | 'powerup_magnet' | 'powerup_shield' | 'powerup_haste' 
    | 'powerup_medkit' | 'powerup_freeze' | 'powerup_zoom' 
    | 'win' | 'lose' | 'hazard_bomb';

const EMOJI_MAP: Record<ReactionType, string[]> = {
    kill: ['💀', '🔪', '💥', '🔥'],
    powerup_magnet: ['🧲', '✨'],
    powerup_shield: ['🛡️', '💎'],
    powerup_haste: ['⚡', '🚀'],
    powerup_medkit: ['💊', '❤️'],
    powerup_freeze: ['🧊', '❄️'],
    powerup_zoom: ['🔭', '👁️'],
    win: ['🏆', '👑', '🎉', '🌟'],
    lose: ['💀', '🥀', '💥'],
    hazard_bomb: ['💣', '🔥']
};

/**
 * Spawns a floating emoji reaction at a specific position.
 * Optimized for isTiny/Widget mode to follow eyes/head.
 */
export function triggerReaction(
    state: GameState, 
    pos: Vec2, 
    type: ReactionType, 
    isTiny: boolean = false
) {
    const emojis = EMOJI_MAP[type];
    const text = emojis[Math.floor(Math.random() * emojis.length)];
    
    // Position offset - slightly above head/eyes
    const yOffset = isTiny ? -15 : -35;
    
    state.floatingTexts.push({
        id: Math.random(),
        pos: { x: pos.x, y: pos.y + yOffset },
        text: text,
        color: '#ffffff', // Emojis are colorful themselves
        life: 1.0
    });
}
