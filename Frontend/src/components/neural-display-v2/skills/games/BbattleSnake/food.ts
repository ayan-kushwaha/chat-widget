/**
 * food.ts — Central registry for all food items in BattleSnake.
 * Every item is an emoji with a point value (score) and category.
 */

export interface FoodMetadata {
    emoji: string;
    points: number; // Growth/Score value (2 to 50)
    category: 'fruit' | 'junk' | 'animal' | 'insect' | 'special';
}

export const FOOD_REGISTRY: Record<string, FoodMetadata> = {
    // ── Low Tier (2 - 10 Points) ───────────────────────────────────────────
    'apple': { emoji: '🍎', points: 5, category: 'fruit' },
    'carrot': { emoji: '🥕', points: 4, category: 'fruit' },
    'grapes': { emoji: '🍇', points: 6, category: 'fruit' },
    'lemon': { emoji: '🍋', points: 3, category: 'fruit' },
    'orange': { emoji: '🍊', points: 5, category: 'fruit' },
    'pear': { emoji: '🍐', points: 5, category: 'fruit' },
    'strawberry': { emoji: '🍓', points: 7, category: 'fruit' },
    'tomato': { emoji: '🍅', points: 4, category: 'fruit' },
    'watermelon': { emoji: '🍉', points: 10, category: 'fruit' },
    'cherry': { emoji: '🍒', points: 6, category: 'fruit' },
    'peach': { emoji: '🍑', points: 6, category: 'fruit' },
    'pineapple': { emoji: '🍍', points: 9, category: 'fruit' },
    'mango': { emoji: '🥭', points: 8, category: 'fruit' },
    'broccoli': { emoji: '🥦', points: 2, category: 'fruit' },
    'corn': { emoji: '🌽', points: 4, category: 'fruit' },
    'kiwi': { emoji: '🥝', points: 5, category: 'fruit' },
    'eggplant': { emoji: '🍆', points: 4, category: 'fruit' },
    'potato': { emoji: '🥔', points: 3, category: 'fruit' },
    'mushroom': { emoji: '🍄', points: 5, category: 'fruit' },
    'avocado': { emoji: '🥑', points: 7, category: 'fruit' },
    'banana': { emoji: '🍌', points: 5, category: 'fruit' },
    'coconut': { emoji: '🥥', points: 8, category: 'fruit' },
    'bread': { emoji: '🍞', points: 4, category: 'fruit' },
    'honey': { emoji: '🍯', points: 10, category: 'fruit' },

    // ── Mid Tier (11 - 25 Points) ──────────────────────────────────────────
    'pizza': { emoji: '🍕', points: 15, category: 'junk' },
    'burger': { emoji: '🍔', points: 18, category: 'junk' },
    'fries': { emoji: '🍟', points: 12, category: 'junk' },
    'hotdog': { emoji: '🌭', points: 14, category: 'junk' },
    'popcorn': { emoji: '🍿', points: 11, category: 'junk' },
    'egg': { emoji: '🥚', points: 12, category: 'junk' },
    'waffle': { emoji: '🧇', points: 13, category: 'junk' },
    'pancake': { emoji: '🥞', points: 13, category: 'junk' },
    'salad': { emoji: '🥗', points: 11, category: 'junk' },
    'pita': { emoji: '🥙', points: 12, category: 'junk' },
    'sandwich': { emoji: '🥪', points: 14, category: 'junk' },
    'taco': { emoji: '🌮', points: 16, category: 'junk' },
    'burrito': { emoji: '🌯', points: 17, category: 'junk' },
    'flatbread': { emoji: '🫓', points: 12, category: 'junk' },
    'baguette': { emoji: '🥖', points: 13, category: 'junk' },
    'bagel': { emoji: '🥯', points: 12, category: 'junk' },
    'pretzel': { emoji: '🥨', points: 12, category: 'junk' },
    'croissant': { emoji: '🥐', points: 13, category: 'junk' },
    'cheese': { emoji: '🧀', points: 15, category: 'junk' },
    'tamale': { emoji: '🫔', points: 16, category: 'junk' },
    'meat': { emoji: '🍖', points: 20, category: 'junk' },
    'poultry': { emoji: '🍗', points: 19, category: 'junk' },
    'steak': { emoji: '🥩', points: 25, category: 'junk' },
    'sweet_potato': { emoji: '🍠', points: 13, category: 'junk' },
    'rice_ball': { emoji: '🍙', points: 12, category: 'junk' },
    'rice_cracker': { emoji: '🍘', points: 11, category: 'junk' },
    'bento': { emoji: '🍱', points: 22, category: 'junk' },
    'rice': { emoji: '🍚', points: 12, category: 'junk' },
    'sushi': { emoji: '🍣', points: 18, category: 'junk' },
    'falafel': { emoji: '🧆', points: 14, category: 'junk' },
    'fish_cake': { emoji: '🍥', points: 12, category: 'junk' },
    'donut': { emoji: '🍩', points: 14, category: 'junk' },
    'ice_cream': { emoji: '🍨', points: 15, category: 'junk' },
    'candy': { emoji: '🍬', points: 11, category: 'junk' },
    'lollipop': { emoji: '🍭', points: 11, category: 'junk' },
    'cupcake': { emoji: '🧁', points: 14, category: 'junk' },
    'chocolate': { emoji: '🍫', points: 15, category: 'junk' },

    // ── High Tier / Animal & Insect (26 - 50 Points) ───────────────────────
    'mosquito': { emoji: '🦟', points: 28, category: 'insect' },
    'bee': { emoji: '🐝', points: 30, category: 'insect' },
    'ladybug': { emoji: '🐞', points: 32, category: 'insect' },
    'beetle': { emoji: '🪲', points: 34, category: 'insect' },
    'microbe': { emoji: '🦠', points: 26, category: 'insect' },
    'snail': { emoji: '🐌', points: 27, category: 'insect' },
    'cricket': { emoji: '🦗', points: 31, category: 'insect' },
    'spider': { emoji: '🕷️', points: 35, category: 'insect' },
    'scorpion': { emoji: '🦂', points: 38, category: 'insect' },
    
    'rabbit': { emoji: '🐇', points: 40, category: 'animal' },
    'mouse': { emoji: '🐁', points: 35, category: 'animal' },
    'chicken': { emoji: '🐔', points: 42, category: 'animal' },
    'duck': { emoji: '🦆', points: 44, category: 'animal' },
    'pig': { emoji: '🐷', points: 46, category: 'animal' },
    'sheep': { emoji: '🐏', points: 48, category: 'animal' },
    'cow': { emoji: '🐄', points: 50, category: 'animal' },

    // ── Special Items (25 - 50 Points) ─────────────────────────────────────
    'ghost_pepper': { emoji: '🌶️', points: 30, category: 'special' },
    'magnet': { emoji: '🧲', points: 25, category: 'special' },
    'champagne_bottle': { emoji: '🍾', points: 10, category: 'special' },
    'frozen_ice': { emoji: '🧊', points: 10, category: 'special' },
    'shield_orb': { emoji: '🛡️', points: 25, category: 'special' },
    'haste_fruit': { emoji: '⚡', points: 25, category: 'special' },
    'portal_gem': { emoji: '💎', points: 30, category: 'special' },
    'shrink_bean': { emoji: '💊', points: 10, category: 'special' },
    'giant_cake': { emoji: '🎂', points: 50, category: 'special' },
    'golden_egg': { emoji: '🥚', points: 50, category: 'special' },
    'heart': { emoji: '🫀', points: 40, category: 'special' },
    'brain': { emoji: '🧠', points: 45, category: 'special' },
    'eye': { emoji: '👀', points: 35, category: 'special' },
    'gift': { emoji: '🎁', points: 40, category: 'special' },
    'king_crown': { emoji: '👑', points: 50, category: 'special' },
    'medkit': { emoji: '💊', points: 35, category: 'special' },
    'telescope': { emoji: '🔭', points: 30, category: 'special' },
};

/**
 * Returns a random food type based on requested tier.
 */
export function getRandomFoodType(): string {
    const keys = Object.keys(FOOD_REGISTRY);
    return keys[Math.floor(Math.random() * keys.length)];
}
