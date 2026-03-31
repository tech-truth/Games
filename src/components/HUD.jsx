import PropTypes from 'prop-types';
import './HUD.css';

export default function HUD({ timeLeft, level, streak, score, bestScore }) {
  const timerClass = timeLeft < 10 ? 'timer danger' : 'timer';

  return (
    <div className="hud" aria-label="Game statistics">
      <div className={timerClass}>
        <span className="hud-label">⏱ Time</span>
        <span className="hud-value timer-value">{timeLeft}s</span>
      </div>
      <div className="hud-item">
        <span className="hud-label">🏆 Level</span>
        <span className="hud-value">{level}</span>
      </div>
      <div className="hud-item">
        <span className="hud-label">🔥 Streak</span>
        <span className="hud-value">{streak}</span>
      </div>
      <div className="hud-item">
        <span className="hud-label">⭐ Score</span>
        <span className="hud-value">{score}</span>
      </div>
      <div className="hud-item best">
        <span className="hud-label">🥇 Best</span>
        <span className="hud-value">{bestScore}</span>
      </div>
    </div>
  );
}

HUD.propTypes = {
  timeLeft: PropTypes.number.isRequired,
  level: PropTypes.number.isRequired,
  streak: PropTypes.number.isRequired,
  score: PropTypes.number.isRequired,
  bestScore: PropTypes.number.isRequired,
};
