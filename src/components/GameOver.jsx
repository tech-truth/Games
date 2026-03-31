import PropTypes from 'prop-types';
import './GameOver.css';

export default function GameOver({ score, level, bestScore, isNewBest, leaderboard, onRestart }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Game over">
      <div className="game-over-panel">
        <h2 className="game-over-title">⏰ Time&apos;s Up!</h2>
        {isNewBest && (
          <div className="new-best-badge">🎉 New High Score!</div>
        )}
        <div className="game-over-stats">
          <div className="stat-row">
            <span>Final Score</span>
            <strong>{score}</strong>
          </div>
          <div className="stat-row">
            <span>Level Reached</span>
            <strong>{level}</strong>
          </div>
          <div className="stat-row">
            <span>Best Score</span>
            <strong>{bestScore}</strong>
          </div>
        </div>

        {leaderboard.length > 0 && (
          <div className="leaderboard">
            <h3>🏅 Leaderboard</h3>
            <ol className="leaderboard-list">
              {leaderboard.map((entry, i) => (
                <li key={i} className={i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}>
                  <span>{entry.score} pts</span>
                  <span className="lb-meta">Lvl {entry.level} · {entry.date}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <button className="btn-restart" onClick={onRestart} autoFocus>
          🔄 Play Again
        </button>
      </div>
    </div>
  );
}

GameOver.propTypes = {
  score: PropTypes.number.isRequired,
  level: PropTypes.number.isRequired,
  bestScore: PropTypes.number.isRequired,
  isNewBest: PropTypes.bool.isRequired,
  leaderboard: PropTypes.array.isRequired,
  onRestart: PropTypes.func.isRequired,
};
