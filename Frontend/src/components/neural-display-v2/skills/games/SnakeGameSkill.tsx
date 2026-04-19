/**
 * SnakeGameSkill.tsx — BattleSnake entry point.
 * Uses GameShell for menus/scoring/navigation.
 * Canvas engine lives in BbattleSnake/BattleSnakeGame.tsx
 */
import React from 'react';
import GameShell from './GameShell';
import BattleSnakeGame from './BbattleSnake/BattleSnakeGame';

export default function SnakeGameSkill() {
    return (
        <GameShell
            gameId="game_snake"
            gameName="Battle Snake"
            gameIcon="🐍"
            lottieCode="1f40d"
            storageKey="cluaiz_battlesnake_hs"
            hasDifficulty={true}
            hasCvC={true}
        >
            {(props) => <BattleSnakeGame {...props} />}
        </GameShell>
    );
}
