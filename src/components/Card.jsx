import PropTypes from 'prop-types';
import './Card.css';

export default function Card({ card, onClick }) {
  const { emoji, isFlipped, isMatched } = card;

  const handleClick = () => {
    if (!isFlipped && !isMatched) {
      onClick(card.id);
    }
  };

  return (
    <div
      className={`card-container ${isFlipped || isMatched ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
      onClick={handleClick}
      role="button"
      aria-label={isFlipped || isMatched ? `Card showing ${emoji}` : 'Hidden card'}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="card-inner">
        <div className="card-front">
          <span className="card-emoji">{emoji}</span>
        </div>
        <div className="card-back">
          <span className="card-back-icon">❓</span>
        </div>
      </div>
    </div>
  );
}

Card.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.number.isRequired,
    emoji: PropTypes.string.isRequired,
    isFlipped: PropTypes.bool.isRequired,
    isMatched: PropTypes.bool.isRequired,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};
