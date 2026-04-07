/**
 * Game registry — add entries here to appear on the selection screen.
 * Each entry describes a game card and provides the React component to render.
 */
import MemoryFlipGame from './MemoryFlipGame';
import TimeFreezeRunner from './time-freeze-runner/TimeFreezeRunner';

const GAMES = [
  {
    id: 'memory-flip',
    title: '🧠 Memory Flip',
    description: 'Match pairs of cards before time runs out. Build streaks for bonus points!',
    emoji: '🧠',
    component: MemoryFlipGame,
  },
  {
    id: 'time-freeze-runner',
    title: '❄️ Time Freeze Runner',
    description: 'Time moves only when the player moves.',
    emoji: '❄️',
    component: TimeFreezeRunner,
  },
];

export default GAMES;
