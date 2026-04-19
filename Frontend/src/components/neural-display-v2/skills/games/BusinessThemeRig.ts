import { EmoEmotion } from '../../ExpressionRig';

export type GameCategory =
    | 'ecommerce' | 'saas' | 'real_estate' | 'healthcare'
    | 'education' | 'agencies' | 'food' | 'finance'
    | 'fitness' | 'manufacturing' | 'hospitality'
    | 'consulting' | 'creators' | 'automotive' | 'other';

export interface ThemeAssets {
    snakeFood: string[];
    rpsIcons: { rock: string, paper: string, scissors: string };
    winEmotion: EmoEmotion;
    loseEmotion: EmoEmotion;
    glowColor: string;
}

export const DYNAMIC_THEMES: Record<GameCategory, ThemeAssets> = {
    ecommerce: {
        snakeFood: ['🛍️', '📦', '🏷️'],
        rpsIcons: { rock: '📦', paper: '🧾', scissors: '✂️' },
        winEmotion: 'star' as EmoEmotion,
        loseEmotion: 'sad',
        glowColor: '#a855f7'
    },
    saas: {
        snakeFood: ['💻', '💾', '🔋'],
        rpsIcons: { rock: '🖥️', paper: '📄', scissors: '✂️' },
        winEmotion: 'cool' as EmoEmotion,
        loseEmotion: 'error' as EmoEmotion,
        glowColor: '#3b82f6'
    },
    real_estate: {
        snakeFood: ['🏠', '🔑', '🧱'],
        rpsIcons: { rock: '🧱', paper: '📄', scissors: '✂️' },
        winEmotion: 'happy',
        loseEmotion: 'sad',
        glowColor: '#10b981'
    },
    healthcare: {
        snakeFood: ['💊', '🍎', '🧪'],
        rpsIcons: { rock: '💊', paper: '📄', scissors: '✂️' },
        winEmotion: 'love' as EmoEmotion,
        loseEmotion: 'dizzy' as EmoEmotion,
        glowColor: '#06b6d4'
    },
    education: {
        snakeFood: ['📚', '🎓', '✏️'],
        rpsIcons: { rock: '📚', paper: '📄', scissors: '✂️' },
        winEmotion: 'curious',
        loseEmotion: 'sad',
        glowColor: '#8b5cf6'
    },
    agencies: {
        snakeFood: ['🎨', '📈', '💡'],
        rpsIcons: { rock: '🎨', paper: '📄', scissors: '✂️' },
        winEmotion: 'star' as EmoEmotion,
        loseEmotion: 'bored' as EmoEmotion,
        glowColor: '#ec4899'
    },
    food: {
        snakeFood: ['🍔', '🍕', '🍩'],
        rpsIcons: { rock: '🍔', paper: '📄', scissors: '✂️' },
        winEmotion: 'happy',
        loseEmotion: 'sad',
        glowColor: '#f59e0b'
    },
    finance: {
        snakeFood: ['💰', '📈', '💎'],
        rpsIcons: { rock: '💎', paper: '📄', scissors: '✂️' },
        winEmotion: 'star' as EmoEmotion,
        loseEmotion: 'sad',
        glowColor: '#059669'
    },
    fitness: {
        snakeFood: ['🏋️', '💪', '🍎'],
        rpsIcons: { rock: '🏋️', paper: '📄', scissors: '✂️' },
        winEmotion: 'happy',
        loseEmotion: 'weary' as EmoEmotion,
        glowColor: '#ef4444'
    },
    manufacturing: {
        snakeFood: ['🏭', '⚙️', '📦'],
        rpsIcons: { rock: '⚙️', paper: '📄', scissors: '✂️' },
        winEmotion: 'cool' as EmoEmotion,
        loseEmotion: 'sad',
        glowColor: '#64748b'
    },
    hospitality: {
        snakeFood: ['🏨', '✈️', '🏝️'],
        rpsIcons: { rock: '🏨', paper: '📄', scissors: '✂️' },
        winEmotion: 'love' as EmoEmotion,
        loseEmotion: 'sad',
        glowColor: '#14b8a6'
    },
    consulting: {
        snakeFood: ['💼', '📈', '🤝'],
        rpsIcons: { rock: '💼', paper: '📄', scissors: '✂️' },
        winEmotion: 'happy',
        loseEmotion: 'reading' as EmoEmotion,
        glowColor: '#334155'
    },
    creators: {
        snakeFood: ['🎥', '📸', '✨'],
        rpsIcons: { rock: '🎥', paper: '📄', scissors: '✂️' },
        winEmotion: 'star' as EmoEmotion,
        loseEmotion: 'angry',
        glowColor: '#d946ef'
    },
    automotive: {
        snakeFood: ['🚗', '🔧', '⛽'],
        rpsIcons: { rock: '🚗', paper: '📄', scissors: '✂️' },
        winEmotion: 'cool' as EmoEmotion,
        loseEmotion: 'sad',
        glowColor: '#ef4444'
    },
    other: {
        snakeFood: ['🍎', '🍒', '🍇'],
        rpsIcons: { rock: '✊', paper: '✋', scissors: '✌️' },
        winEmotion: 'happy',
        loseEmotion: 'sad',
        glowColor: '#3b82f6'
    }
};

export const getThemeAssets = (category: string = 'other'): ThemeAssets => {
    return DYNAMIC_THEMES[category as GameCategory] || DYNAMIC_THEMES['other'];
};
