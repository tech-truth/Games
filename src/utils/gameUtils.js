// Emoji sets for different levels
const EMOJI_POOL = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐸', '🐵', '🐔', '🐧',
  '🦋', '🐢', '🦄', '🐙', '🦑', '🦞', '🦀', '🐠',
  '🌸', '🌻', '🌹', '🍄', '🌴', '🌵', '🍁', '🌊',
];

/**
 * Generate a shuffled array of card objects for a given number of pairs.
 */
export function generateCards(numPairs) {
  const emojis = EMOJI_POOL.slice(0, numPairs);
  const cards = [...emojis, ...emojis].map((emoji, index) => ({
    id: index,
    emoji,
    isFlipped: false,
    isMatched: false,
  }));
  return shuffleArray(cards);
}

export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const INITIAL_PAIRS = 4;
export const INITIAL_TIME = 60;
export const MATCH_TIME_BONUS = 2;
export const MISS_TIME_PENALTY = 3;
export const PAIRS_INCREMENT = 2;

/**
 * Calculate score for a match including streak bonus.
 */
export function calculateMatchScore(streak) {
  const base = 10;
  const bonus = Math.min(streak, 5) * 5;
  return base + bonus;
}

/**
 * Get best scores from localStorage.
 */
export function getBestScore() {
  return parseInt(localStorage.getItem('memoryFlipBestScore') || '0', 10);
}

/**
 * Save best score to localStorage.
 */
export function saveBestScore(score) {
  const current = getBestScore();
  if (score > current) {
    localStorage.setItem('memoryFlipBestScore', score.toString());
    return true;
  }
  return false;
}

/**
 * Get leaderboard from localStorage.
 */
export function getLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem('memoryFlipLeaderboard') || '[]');
  } catch {
    return [];
  }
}

/**
 * Save a score to the leaderboard (keeps top 10).
 */
export function saveToLeaderboard(score, level) {
  const board = getLeaderboard();
  const entry = { score, level, date: new Date().toLocaleDateString() };
  board.push(entry);
  board.sort((a, b) => b.score - a.score);
  const top10 = board.slice(0, 10);
  localStorage.setItem('memoryFlipLeaderboard', JSON.stringify(top10));
  return top10;
}
