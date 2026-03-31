import PropTypes from 'prop-types';
import Card from './Card';
import './GameBoard.css';

export default function GameBoard({ cards, onCardClick, isLocked }) {
  // Determine grid columns based on card count
  const cols = cards.length <= 8 ? 4 : cards.length <= 12 ? 4 : cards.length <= 16 ? 4 : 5;

  return (
    <div
      className="game-board"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      aria-label="Memory game board"
    >
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          onClick={isLocked ? () => {} : onCardClick}
        />
      ))}
    </div>
  );
}

GameBoard.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      emoji: PropTypes.string.isRequired,
      isFlipped: PropTypes.bool.isRequired,
      isMatched: PropTypes.bool.isRequired,
    })
  ).isRequired,
  onCardClick: PropTypes.func.isRequired,
  isLocked: PropTypes.bool.isRequired,
};
