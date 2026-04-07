import { useState, useEffect, useCallback, useRef } from 'react';
import {
  generateCards,
  INITIAL_PAIRS,
  INITIAL_TIME,
  MATCH_TIME_BONUS,
  MISS_TIME_PENALTY,
  PAIRS_INCREMENT,
  calculateMatchScore,
  getBestScore,
  saveBestScore,
  saveToLeaderboard,
} from '../utils/gameUtils';
import {
  playFlipSound,
  playMatchSound,
  playWrongSound,
  playLevelUpSound,
  playGameOverSound,
} from '../utils/sounds';

export function useGameLogic() {
  const [cards, setCards] = useState([]);
  const [flippedIds, setFlippedIds] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [totalPairs, setTotalPairs] = useState(INITIAL_PAIRS);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [bestScore, setBestScore] = useState(getBestScore());
  const [isNewBest, setIsNewBest] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  const playSound = useCallback((fn) => {
    if (soundRef.current) fn();
  }, []);

  // Initialize board
  const initBoard = useCallback((pairs) => {
    setCards(generateCards(pairs));
    setFlippedIds([]);
    setMatchedPairs(0);
    setIsLocked(false);
    setIsLevelComplete(false);
  }, []);

  // Start / restart game
  const startGame = useCallback(() => {
    setLevel(1);
    setScore(0);
    setStreak(0);
    setTimeLeft(INITIAL_TIME);
    setTotalPairs(INITIAL_PAIRS);
    setIsGameOver(false);
    setIsNewBest(false);
    initBoard(INITIAL_PAIRS);
  }, [initBoard]);

  // Initialize on mount
  useEffect(() => {
    initBoard(INITIAL_PAIRS);
  }, [initBoard]);

  // Timer countdown
  useEffect(() => {
    if (isGameOver || isLevelComplete) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameOver, isLevelComplete, level]);

  const handleGameOver = useCallback(() => {
    setIsGameOver(true);
    playSound(playGameOverSound);

    setScore((currentScore) => {
      const isNew = saveBestScore(currentScore);
      if (isNew) {
        setBestScore(currentScore);
        setIsNewBest(true);
      }
      const board = saveToLeaderboard(currentScore, level);
      setLeaderboard(board);
      return currentScore;
    });
  }, [level, playSound]);

  // Detect level complete
  useEffect(() => {
    if (cards.length > 0 && matchedPairs === totalPairs) {
      setIsLevelComplete(true);
      playSound(playLevelUpSound);
    }
  }, [matchedPairs, totalPairs, cards.length, playSound]);

  // Advance to next level
  const nextLevel = useCallback(() => {
    const newPairs = totalPairs + PAIRS_INCREMENT;
    const newLevel = level + 1;
    setLevel(newLevel);
    setTotalPairs(newPairs);
    setTimeLeft(INITIAL_TIME);
    setStreak(0);
    initBoard(newPairs);
  }, [level, totalPairs, initBoard]);

  // Handle card click
  const handleCardClick = useCallback(
    (id) => {
      if (isLocked || isGameOver || isLevelComplete) return;

      const card = cards.find((c) => c.id === id);
      if (!card || card.isFlipped || card.isMatched) return;
      if (flippedIds.length >= 2) return;

      playSound(playFlipSound);

      const newFlipped = [...flippedIds, id];
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c))
      );
      setFlippedIds(newFlipped);

      if (newFlipped.length === 2) {
        setIsLocked(true);
        const [firstId, secondId] = newFlipped;
        const firstCard = cards.find((c) => c.id === firstId);
        const secondCard = cards.find((c) => c.id === secondId);

        if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
          // Match!
          playSound(playMatchSound);
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, isMatched: true }
                  : c
              )
            );
            setMatchedPairs((prev) => prev + 1);
            setStreak((prev) => prev + 1);
            setScore((prev) => prev + calculateMatchScore(streak + 1));
            setTimeLeft((prev) => Math.min(prev + MATCH_TIME_BONUS, 99));
            setFlippedIds([]);
            setIsLocked(false);
          }, 400);
        } else {
          // No match
          playSound(playWrongSound);
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, isFlipped: false }
                  : c
              )
            );
            setStreak(0);
            setTimeLeft((prev) => Math.max(prev - MISS_TIME_PENALTY, 0));
            setFlippedIds([]);
            setIsLocked(false);
          }, 1000);
        }
      }
    },
    [cards, flippedIds, isLocked, isGameOver, isLevelComplete, streak, playSound]
  );

  return {
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
  };
}
