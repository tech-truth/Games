import { useGameLogic } from './hooks/useGameLogic';
import HUD from './components/HUD';
import GameBoard from './components/GameBoard';
import GameOver from './components/GameOver';
import LevelComplete from './components/LevelComplete';
import './App.css';

export default function App() {
  const {
    cards,
    level,
    score,
    streak,
    timeLeft,
    isGameOver,
    isLevelComplete,
    isLocked,
    bestScore,
    isNewBest,
    matchedPairs,
    totalPairs,
    soundEnabled,
    darkMode,
    leaderboard,
    handleCardClick,
    startGame,
    nextLevel,
    setSoundEnabled,
    setDarkMode,
  } = useGameLogic();

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <header className="app-header">
        <h1 className="app-title">🧠 Memory Flip</h1>
        <div className="header-controls">
          <button
            className="icon-btn"
            onClick={() => setSoundEnabled((s) => !s)}
            aria-label={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
            title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button
            className="icon-btn"
            onClick={() => setDarkMode((d) => !d)}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button
            className="btn-restart-header"
            onClick={startGame}
            aria-label="Restart game"
          >
            🔄 Restart
          </button>
        </div>
      </header>

      <main className="app-main">
        <HUD
          timeLeft={timeLeft}
          level={level}
          streak={streak}
          score={score}
          bestScore={bestScore}
        />

        <div className="progress-bar-wrapper" aria-label={`${matchedPairs} of ${totalPairs} pairs matched`}>
          <div
            className="progress-bar"
            style={{ width: `${(matchedPairs / totalPairs) * 100}%` }}
          />
        </div>

        <GameBoard
          cards={cards}
          onCardClick={handleCardClick}
          isLocked={isLocked}
        />
      </main>

      {isLevelComplete && !isGameOver && (
        <LevelComplete level={level} score={score} onNextLevel={nextLevel} />
      )}

      {isGameOver && (
        <GameOver
          score={score}
          level={level}
          bestScore={bestScore}
          isNewBest={isNewBest}
          leaderboard={leaderboard}
          onRestart={startGame}
        />
      )}
    </div>
  );
}
