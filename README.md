# 🧠 Memory Flip Game

A browser-based Memory Card Matching Game built with React + Vite.

![Memory Flip Game](https://github.com/user-attachments/assets/92e6432a-f935-4eca-aef5-493b787db20a)

## Features

- **Card Flip Animation** — Smooth 3D CSS `rotateY` flip on click
- **Match Detection** — Two matching cards stay revealed with a green pulse
- **Timer** — 60-second countdown; +2s on match, −3s on miss; red pulse warning below 10s
- **Levels** — Start with 4 pairs; each completed level adds 2 more pairs
- **Streak Counter** — Consecutive matches boost your score bonus
- **Scoring** — Base 10 pts per match + up to 25 bonus pts for streaks
- **Best Score** — Saved in `localStorage`, persists across sessions
- **Leaderboard** — Top-10 all-time scores stored in `localStorage`
- **Sound Effects** — Web Audio API tones for flip, match, wrong, level-up, game-over
- **Dark Mode** — Full dark theme toggle
- **Responsive** — Works on desktop and mobile

## Game Rules

| Event | Effect |
|---|---|
| Two cards match | Keep open · +1 streak · +10–35 pts · **+2s** added |
| Two cards don't match | Flip back after 1s · streak reset to 0 · **−3s** removed |
| All pairs matched | Level complete screen → next level with 2 more pairs |
| Timer hits 0 | Game over screen with final score + leaderboard |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── components/
│   ├── Card.jsx / Card.css          # Individual card with 3D flip animation
│   ├── GameBoard.jsx / GameBoard.css # Responsive grid of cards
│   ├── HUD.jsx / HUD.css            # Timer, level, streak, score display
│   ├── GameOver.jsx / GameOver.css  # Game over overlay + leaderboard
│   └── LevelComplete.jsx / LevelComplete.css  # Level transition overlay
├── hooks/
│   └── useGameLogic.js              # All game state & logic (useState/useEffect)
├── utils/
│   ├── gameUtils.js                 # Card generation, shuffle, scoring, localStorage
│   └── sounds.js                   # Web Audio API sound effects
├── App.jsx / App.css                # Root component & theme variables
└── main.jsx                         # React entry point
```

## Tech Stack

- **React 19** with functional components and hooks (`useState`, `useEffect`, `useCallback`, `useRef`)
- **Vite** for fast development and production builds
- **Pure CSS** for animations (no animation libraries)
- **Web Audio API** for sound effects (no external audio files)
- **localStorage** for score persistence
