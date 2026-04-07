import PropTypes from 'prop-types';
import './GameSelectionScreen.css';

export default function GameSelectionScreen({ games, onSelectGame }) {
  return (
    <div className="gss-wrapper">
      <header className="gss-header">
        <h1 className="gss-logo">🎮 Game Arcade</h1>
        <p className="gss-subtitle">Choose a game to play</p>
      </header>

      <main className="gss-grid" aria-label="Game selection">
        {games.map((game) => (
          <button
            key={game.id}
            className="gss-card"
            onClick={() => onSelectGame(game.id)}
            aria-label={`Play ${game.title}`}
          >
            <span className="gss-card-emoji" aria-hidden="true">{game.emoji}</span>
            <h2 className="gss-card-title">{game.title}</h2>
            <p className="gss-card-desc">{game.description}</p>
            <span className="gss-card-play">Play →</span>
          </button>
        ))}
      </main>

      <footer className="gss-footer">
        <p>Built with React + Vite &nbsp;|&nbsp; More games coming soon!</p>
      </footer>
    </div>
  );
}

GameSelectionScreen.propTypes = {
  games: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      emoji: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSelectGame: PropTypes.func.isRequired,
};
