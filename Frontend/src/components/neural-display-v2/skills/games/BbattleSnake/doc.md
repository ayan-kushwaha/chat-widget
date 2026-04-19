# BattleSnake: The Definitive Battle Royale Technical & Gameplay Manual 🐍💎

## 1. Project Overview
**BattleSnake** is a next-generation Battle Royale adaptation of the classic Snake genre. featuring dynamic world scaling, advanced AI behavior, a PUBG-inspired "Staccato" zone system, and a tactical HUD with mini-map support.

### 🌎 Difficulty Scaling
The game environment and population scale based on the selected difficulty:
| Difficulty | World Size | Snake Count | Zone Phases |
| :--- | :--- | :--- | :--- |
| **Easy** | 3000 x 3000 | 60 | 4 |
| **Medium** | 5000 x 5000 | 100 | 8 |
| **Hard** | 7500 x 7500 | 150 | 12 |

---

## 2. Core Control Mechanics
The game utilizes a physics-based interpolation system for smooth movement.

### 🎮 Player Input
-   **Mouse/Touch Lead**: The snake head follows the cursor position using a linear interpolation (`lerp`) toward the target vector.
-   **Multi-Tier Speed System**:
    -   **Precision Mode (0.5x)**: Triggered when the cursor is hovering directly over the snake's body.
    -   **Normal (1.0x)**: Standard patrol speed.
    -   **Turbo Boost (1.5x - 2.5x)**: Activated by holding Left-Click or Spacebar.
        -   *Cost*: Drains body segments over time.
        -   *Visual*: Tail drops "poop" orbs that others can eat.
    -   **Ultra-Precision (0.2x)**: Triggered by pulling the mouse behind the snake's head (reversing direction).

---

## 3. The Zone (PUBG-Style Red Gas) 🏔️
The Battle Royale zone is the primary game master, forcing interactions and tension.

### 🕒 Phase Management
1.  **Waiting Phase (40-60s)**: No shrinking occurs. This allows players to farm initial food and find items.
    -   *Visual*: A thin, **dashed white circle** shows you exactly where the Phase 1 safe zone will be.
2.  **Staccato Shrinking (Difficulty Dependent)**:
    -   **Active Shrink (60%)**: The zone radius contracts linearly toward the next target size.
    -   **Pause/Rest (40%)**: The zone remains static.
3.  **Final Phase**: The zone continues until the safe area is minimized, ensuring a final confrontation.

### 🧨 Interaction
-   **Red Gas Damage**: Being outside the zone applies progressive "Tick Damage" directly to the snake's length.
-   **AI Strategy**: Bots are programmed to detect the zone's edge and will prioritize steering back into the safe circle.

### 🗺️ Mini-map & HUD Refinement
- **Global Controls**: The Mini-map toggle (🗺️) and Settings (⚙️) have been moved to the top header (`GameShell`) for a cleaner look.
- **Tactical Copy**: The Mini-map is now a full tactical mirror, including tiny dots for food/orbs.
- **Dynamic Audio**: The bulky "ZONE SHRINKING" overlay has been replaced by a sharp "Alarm" SFX that triggers at the start of each shrinking phase.
- **HUD Cleanup**: Persistent timers and large overlays were removed to prioritize the game's dark, immersive atmosphere.

### Controls
- **Toggle Mini-map (🗺️)**: Located in the top header.
- **Map Settings (⚙️)**: Change position and transparency from the header menu.

### HUD & Audio
- **Zone Alarm**: A sharp alarm sounds when the zone begins to shrink.
- **Online Players**: Track the remaining snakes in the header status.
- **Tactical Mini-map**: A high-fidelity copy of the world showing snakes, zones, and food orbs.

---

## 4. Comprehensive Food & Item Registry 🍎🍕🐄
Every item in the world is registered in the [Food Registry](file:///c:/Users/Aryan/my/cluaiz/Frontend/src/components/neural-display-v2/skills/games/BbattleSnake/food.ts).

### 🍎 Tier 1: Natural & Junk Food (2 - 25 Points)
Small items for steady growth.
-   **Fruits (🍎🍇🍋🍓🍉)**: Low points (2-10), high spawn density.
-   **Junk Food (🍕🍔🍟🌮🍩)**: Mid-tier points (11-25), providing a faster growth spike.
-   **Combat Drops (🍖🥩🍣)**: Only dropped when a snake is killed. High density "Meat" segments for rapid recovery.

### 🐝 Tier 2: Moving & High-Value Targets (26 - 50 Points)
Larger items that signify elite growth.
-   **Insects (🦟🐝🐞🪲🦂)**: 26-38 points.
-   **Animals (🐇🐁🐔🦆🐷🐏🐄)**: 35-50 points. The **Cow (🐄)** is the highest point value common food.

### 🌟 Special Items: Power-Ups & Effects
| Item | Emoji | Points | Technical Effect |
| :--- | :--- | :--- | :--- |
| **Magnet** | 🧲 | 25 | Pulls all orbs within 400px radius to the head at 10% speed. |
| **Shield Orb** | 🛡️ | 25 | Grants immunity to safe-zone damage. |
| **Haste Fruit** | ⚡ | 25 | Enables Turbo speed without segment consumption. |
| **Ghost Pepper** | 🌶️ | 30 | Disables collision with other snakes' bodies. |
| **Portal Gem** | 💎 | 30 | Permanent map-wide vision (removes fog). |
| **Telescope** | 🔭 | 30 | Scales the camera viewport by 0.5x for wider visibility. |
| **Medkit** | 💊 | 35 | **Critical**: Grants 30-40s of absolute Zone Immunity. |
| **Frozen Ice** | 🧊 | 10 | **Crowd Control**: Immobilizes the snake for 5-8s. |
| **Champagne** | 🍾 | 10 | **Drunk Effect**: Controls sway and swerve for 5s. |
| **King Crown** | 👑 | 50 | Max growth + Speed Multiplier + Boss Glow. |

---

## 5. Evolutionary Tiers 👹🦖
Snakes evolve visually as their score increases.
-   **Tiers 1-3 (0-100 pts)**: Scout/Juvenile stage.
-   **Tiers 4-6 (200-500 pts)**: Predator/Adult stage. Specialized head features appear.
-   **Tier 10 (1500+ pts)**: **King Tier**. Pulsing halos, increased radius, and global boss status.

---

## 6. Combat Logic
-   **Head-on-Head**: The larger snake survives. Ties result in both snakes being killed.
-   **Head-to-Body**: If your head touches any body segment, you die instantly.
-   **Wall Collision**: Touching the world border results in an instant kill.

---

## 7. AI Logic (The Brain) 🧠
The AI uses a reactive weight-based steering system:
-   **Priority 1**: Zone avoidance.
-   **Priority 2**: Collision avoidance (Snakes and Walls).
-   **Priority 3**: Item Seeking (Special items > Large food > Small food).
-   **Priority 4**: Aggression (Trailing smaller snakes to force a crash).

---
*Manual compiled for the BattleSnake v2.5 update. Designed for both Human Players and AI Knowledge Retrieval.* 🚀