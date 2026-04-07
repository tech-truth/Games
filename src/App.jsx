import { useState } from 'react';
import GAMES from './games';
import GameSelectionScreen from './components/GameSelectionScreen';

export default function App() {
  const [activeGameId, setActiveGameId] = useState(null);

  const handleBack = () => setActiveGameId(null);

  if (activeGameId) {
    const game = GAMES.find((g) => g.id === activeGameId);
    if (game) {
      const GameComponent = game.component;
      return <GameComponent onBack={handleBack} />;
    }
  }

  return <GameSelectionScreen games={GAMES} onSelectGame={setActiveGameId} />;
}
