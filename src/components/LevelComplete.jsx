import PropTypes from 'prop-types';
import './LevelComplete.css';

export default function LevelComplete({ level, score, onNextLevel }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Level complete">
      <div className="level-complete-panel">
        <div className="level-complete-emoji">🎉</div>
        <h2 className="level-complete-title">Level {level} Complete!</h2>
        <p className="level-complete-sub">Great memory! Ready for the next challenge?</p>
        <div className="stat-row">
          <span>Current Score</span>
          <strong>{score}</strong>
        </div>
        <button className="btn-next" onClick={onNextLevel} autoFocus>
          ➡️ Next Level
        </button>
      </div>
    </div>
  );
}

LevelComplete.propTypes = {
  level: PropTypes.number.isRequired,
  score: PropTypes.number.isRequired,
  onNextLevel: PropTypes.func.isRequired,
};
