import { useEffect, useRef, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import './TimeFreezeRunner.css';

// ─── Constants ───────────────────────────────────────────────────────────────
const W = 800;
const H = 550;
const PLAYER_SPEED = 180; // px/s
const ENEMY_SPEED = 90; // px/s
const BULLET_SPEED = 220; // px/s
const PLAYER_R = 14;
const ENEMY_SIZE = 22;
const BULLET_R = 5;
const GOAL_W = 60;
const GOAL_H = 60;
const BOSS_SPREAD_OFFSET = 0.35;
const BOSS_SPEED_VARIATION = 0.2;
const BOSS_RING_ANGLE_JITTER = 0.45;
const BOSS_PATTERN_COUNT = 3;

const LEVELS = [
  { id: 1, speed: 1, spawnRate: 1000, targetScore: 20 },
  { id: 2, speed: 1.25, spawnRate: 900, targetScore: 40 },
  { id: 3, speed: 1.5, spawnRate: 700, targetScore: 60 },
  { id: 4, speed: 2, spawnRate: 500, bossMode: true, survivalSeconds: 60 },
];

// ─── Level layout ────────────────────────────────────────────────────────────
const WALLS = [
  { x: 180, y: 60, w: 16, h: 180 },
  { x: 320, y: 180, w: 200, h: 16 },
  { x: 520, y: 80, w: 16, h: 180 },
  { x: 100, y: 340, w: 200, h: 16 },
  { x: 400, y: 340, w: 16, h: 160 },
  { x: 580, y: 280, w: 180, h: 16 },
  { x: 260, y: 430, w: 16, h: 120 },
];

const GOAL = { x: 700, y: 460, w: GOAL_W, h: GOAL_H };

function getLevelConfig(levelId) {
  const level = LEVELS.find((item) => item.id === levelId);
  if (!level) {
    console.warn(`Invalid level id: ${levelId}, defaulting to level 1.`);
    return LEVELS[0];
  }
  return level;
}

function createEnemies() {
  return [
    { id: 0, x: 360, y: 130, w: ENEMY_SIZE, h: ENEMY_SIZE, type: 'patrol-h', dir: 1, bound0: 220, bound1: 600 },
    { id: 1, x: 140, y: 220, w: ENEMY_SIZE, h: ENEMY_SIZE, type: 'patrol-v', dir: 1, bound0: 100, bound1: 480 },
    { id: 2, x: 600, y: 150, w: ENEMY_SIZE, h: ENEMY_SIZE, type: 'shooter', shootCooldown: 0 },
  ];
}

function createState(levelId = 1) {
  const level = getLevelConfig(levelId);

  return {
    phase: 'playing', // 'playing' | 'lost' | 'level-complete' | 'won'
    timeFrozen: true,
    elapsed: 0,
    currentLevel: level.id,
    gameWon: false,
    levelComplete: false,
    survivalTimer: level.bossMode ? level.survivalSeconds : null,
    score: 0,
    player: { x: 60, y: 60, r: PLAYER_R },
    enemies: createEnemies(),
    bullets: [],
    nextBulletId: 0,
  };
}

function getUiSnapshot(state) {
  return {
    currentLevel: state.currentLevel,
    score: Math.floor(state.score),
    survivalTimer: state.survivalTimer === null ? null : Math.ceil(state.survivalTimer),
    gameWon: state.gameWon,
    levelComplete: state.levelComplete,
    phase: state.phase,
  };
}

function addBullet(state, x, y, angle, speed) {
  state.bullets.push({
    id: state.nextBulletId++,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: BULLET_R,
  });
}

function spawnBossPattern(state, enemy, level, dx, dy, dist) {
  const bulletSpeed = BULLET_SPEED * level.speed;
  const bx = enemy.x + enemy.w / 2;
  const by = enemy.y + enemy.h / 2;
  const baseAngle = Math.atan2(dy, dx);
  const pattern = Math.floor(Math.random() * BOSS_PATTERN_COUNT);

  if (pattern === 0) {
    addBullet(state, bx, by, baseAngle, bulletSpeed);
    return;
  }

  if (pattern === 1) {
    [-BOSS_SPREAD_OFFSET, 0, BOSS_SPREAD_OFFSET].forEach((offset) => {
      addBullet(
        state,
        bx,
        by,
        baseAngle + offset,
        bulletSpeed * (1 + Math.random() * BOSS_SPEED_VARIATION),
      );
    });
    return;
  }

  const burstCount = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < burstCount; i += 1) {
    const randomAngle = (Math.PI * 2 * i) / burstCount
      + (Math.random() - 0.5) * BOSS_RING_ANGLE_JITTER;
    addBullet(state, bx, by, randomAngle, bulletSpeed * (0.8 + Math.random() * 0.5));
  }

  if (dist < 180) {
    addBullet(state, bx, by, baseAngle, bulletSpeed * 1.3);
  }
}

// ─── Collision helpers ────────────────────────────────────────────────────────
function circleRect(cx, cy, cr, rx, ry, rw, rh) {
  const nearX = Math.max(rx, Math.min(cx, rx + rw));
  const nearY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nearX;
  const dy = cy - nearY;
  return dx * dx + dy * dy < cr * cr;
}

function circleCircle(ax, ay, ar, bx, by, br) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy < (ar + br) * (ar + br);
}

// ─── Update ───────────────────────────────────────────────────────────────────
function update(state, keys, dt) {
  if (state.phase !== 'playing') return;

  const level = getLevelConfig(state.currentLevel);
  const MOVE_KEYS = new Set([
    'w',
    'W',
    'a',
    'A',
    's',
    'S',
    'd',
    'D',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
  ]);
  const isMoving = [...keys].some((k) => MOVE_KEYS.has(k));

  state.timeFrozen = !isMoving;
  if (!isMoving) return;

  state.elapsed += dt;
  state.score += dt * 10;

  if (level.bossMode && state.survivalTimer !== null) {
    state.survivalTimer = Math.max(0, state.survivalTimer - dt);
    if (state.survivalTimer <= 0) {
      state.gameWon = true;
      state.phase = 'won';
      return;
    }
  }

  const speed = PLAYER_SPEED * dt;
  let { x, y } = state.player;
  const r = state.player.r;

  if (keys.has('w') || keys.has('W') || keys.has('ArrowUp')) y -= speed;
  if (keys.has('s') || keys.has('S') || keys.has('ArrowDown')) y += speed;
  if (keys.has('a') || keys.has('A') || keys.has('ArrowLeft')) x -= speed;
  if (keys.has('d') || keys.has('D') || keys.has('ArrowRight')) x += speed;

  x = Math.max(r, Math.min(W - r, x));
  y = Math.max(r, Math.min(H - r, y));

  for (const w of WALLS) {
    if (circleRect(x, y, r, w.x, w.y, w.w, w.h)) {
      const overlapLeft = x + r - w.x;
      const overlapRight = w.x + w.w - (x - r);
      const overlapTop = y + r - w.y;
      const overlapBot = w.y + w.h - (y - r);
      const minH = Math.min(overlapLeft, overlapRight);
      const minV = Math.min(overlapTop, overlapBot);
      if (minH < minV) {
        x = overlapLeft < overlapRight ? w.x - r : w.x + w.w + r;
      } else {
        y = overlapTop < overlapBot ? w.y - r : w.y + w.h + r;
      }
    }
  }

  state.player.x = x;
  state.player.y = y;

  for (const e of state.enemies) {
    const enemyStep = ENEMY_SPEED * level.speed * dt;
    if (e.type === 'patrol-h') {
      e.x += e.dir * enemyStep;
      if (e.x <= e.bound0 || e.x + e.w >= e.bound1) e.dir *= -1;
    } else if (e.type === 'patrol-v') {
      e.y += e.dir * enemyStep;
      if (e.y <= e.bound0 || e.y + e.h >= e.bound1) e.dir *= -1;
    } else if (e.type === 'shooter') {
      const dx = state.player.x - (e.x + e.w / 2);
      const dy = state.player.y - (e.y + e.h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      e.x += (dx / dist) * enemyStep * 0.55;
      e.y += (dy / dist) * enemyStep * 0.55;
      e.x = Math.max(0, Math.min(W - e.w, e.x));
      e.y = Math.max(0, Math.min(H - e.h, e.y));

      e.shootCooldown = (e.shootCooldown || 0) - dt;
      const shootInterval = level.spawnRate / 1000;
      if (e.shootCooldown <= 0) {
        e.shootCooldown = shootInterval;
        if (level.bossMode) {
          spawnBossPattern(state, e, level, dx, dy, dist);
        } else {
          const angle = Math.atan2(dy, dx);
          addBullet(state, e.x + e.w / 2, e.y + e.h / 2, angle, BULLET_SPEED * level.speed);
        }
      }
    }
  }

  state.bullets = state.bullets.filter((b) => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) return false;
    for (const w of WALLS) {
      if (circleRect(b.x, b.y, b.r, w.x, w.y, w.w, w.h)) return false;
    }
    return true;
  });

  for (const e of state.enemies) {
    if (circleRect(state.player.x, state.player.y, r, e.x, e.y, e.w, e.h)) {
      state.phase = 'lost';
      return;
    }
  }

  for (const b of state.bullets) {
    if (circleCircle(state.player.x, state.player.y, r, b.x, b.y, b.r)) {
      state.phase = 'lost';
      return;
    }
  }

  if (!level.bossMode) {
    const reachedGoal = circleRect(state.player.x, state.player.y, r, GOAL.x, GOAL.y, GOAL.w, GOAL.h);
    const reachedTargetScore = typeof level.targetScore === 'number' && state.score >= level.targetScore;
    if (reachedGoal || reachedTargetScore) {
      state.levelComplete = true;
      state.phase = 'level-complete';
    }
  }
}

// ─── Render ───────────────────────────────────────────────────────────────────
function render(ctx, state, ts) {
  const level = getLevelConfig(state.currentLevel);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#334155';
  for (const w of WALLS) {
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  }

  if (!level.bossMode) {
    const goalPulse = 0.7 + 0.3 * Math.sin(ts / 400);
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 16 * goalPulse;
    ctx.fillStyle = `rgba(34,197,94,${0.4 + 0.2 * goalPulse})`;
    ctx.fillRect(GOAL.x, GOAL.y, GOAL.w, GOAL.h);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.strokeRect(GOAL.x, GOAL.y, GOAL.w, GOAL.h);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#86efac';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', GOAL.x + GOAL.w / 2, GOAL.y + GOAL.h / 2 + 5);
  }

  for (const e of state.enemies) {
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = state.timeFrozen ? 6 : 14;
    ctx.fillStyle = state.timeFrozen ? '#7f1d1d' : '#ef4444';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.strokeStyle = state.timeFrozen ? '#991b1b' : '#fca5a5';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(e.x, e.y, e.w, e.h);
    ctx.shadowBlur = 0;
  }

  for (const b of state.bullets) {
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = state.timeFrozen ? 4 : 10;
    ctx.fillStyle = state.timeFrozen ? '#7c2d12' : '#f97316';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  const px = state.player.x;
  const py = state.player.y;
  const pr = state.player.r;
  ctx.shadowColor = '#60a5fa';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#93c5fd';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (state.timeFrozen) {
    ctx.fillStyle = 'rgba(96,165,250,0.06)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(147,197,253,0.85)';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('❄ TIME FROZEN — move to resume', W / 2, 28);
  } else {
    ctx.fillStyle = 'rgba(34,197,94,0.75)';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('▶ TIME RUNNING', W / 2, 28);
  }

  if (state.phase === 'lost') {
    drawOverlay(ctx, '#7f1d1d', 'rgba(127,29,29,0.92)', '💀 CAUGHT!', 'Press R to restart', '#fca5a5');
  } else if (state.levelComplete) {
    drawOverlay(
      ctx,
      '#14532d',
      'rgba(20,83,45,0.92)',
      'LEVEL COMPLETE',
      'Start Next Level',
      '#86efac',
    );
  } else if (state.gameWon) {
    drawOverlay(ctx, '#14532d', 'rgba(20,83,45,0.92)', 'YOU WIN', 'Play Again', '#86efac');
  }
}

function drawOverlay(ctx, borderColor, bgColor, title, sub, textColor) {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, W - 20, H - 20);

  ctx.fillStyle = textColor;
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, W / 2, H / 2 - 24);

  ctx.font = '22px monospace';
  ctx.fillText(sub, W / 2, H / 2 + 28);

  ctx.font = '16px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('Press R to restart  •  ESC / ← Games to go back', W / 2, H / 2 + 72);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TimeFreezeRunner({ onBack }) {
  const initialState = createState(1);
  const initialHud = getUiSnapshot(initialState);
  const canvasRef = useRef(null);
  const stateRef = useRef(initialState);
  const keysRef = useRef(new Set());
  const rafRef = useRef(null);
  const lastRef = useRef(null);
  const hudRef = useRef(initialHud);
  const [hud, setHud] = useState(initialHud);

  const syncHud = useCallback(() => {
    const next = getUiSnapshot(stateRef.current);
    const prev = hudRef.current;

    if (
      prev.currentLevel !== next.currentLevel
      || prev.score !== next.score
      || prev.survivalTimer !== next.survivalTimer
      || prev.gameWon !== next.gameWon
      || prev.levelComplete !== next.levelComplete
      || prev.phase !== next.phase
    ) {
      hudRef.current = next;
      setHud(next);
    }
  }, []);

  const startLevel = useCallback((levelId) => {
    stateRef.current = createState(levelId);
    keysRef.current.clear();
    lastRef.current = null;
    syncHud();
  }, [syncHud]);

  const restart = useCallback(() => {
    startLevel(stateRef.current.currentLevel);
  }, [startLevel]);

  const startNextLevel = useCallback(() => {
    const currentIndex = LEVELS.findIndex((level) => level.id === stateRef.current.currentLevel);
    if (currentIndex < 0 || currentIndex >= LEVELS.length - 1) {
      return;
    }

    const nextLevel = LEVELS[currentIndex + 1];
    startLevel(nextLevel.id);
  }, [startLevel]);

  const playAgain = useCallback(() => {
    startLevel(1);
  }, [startLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    function handleKeyDown(e) {
      keysRef.current.add(e.key);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'r' || e.key === 'R') restart();
      if (e.key === 'Escape') onBack();
    }

    function handleKeyUp(e) {
      keysRef.current.delete(e.key);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    function loop(ts) {
      if (lastRef.current === null) lastRef.current = ts;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;

      update(stateRef.current, keysRef.current, dt);
      render(ctx, stateRef.current, ts);
      syncHud();

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onBack, restart, syncHud]);

  return (
    <div className="tfr-wrapper">
      <div className="tfr-header">
        <button className="tfr-back-btn" onClick={onBack} aria-label="Back to game selection">
          ← Games
        </button>
        <span className="tfr-title">❄️ Time Freeze Runner</span>
        <button className="tfr-restart-btn" onClick={restart} aria-label="Restart game">
          🔄 Restart
        </button>
      </div>

      <div className="tfr-stats">
        <span>Level: {hud.currentLevel}</span>
        <span>Score: {hud.score}</span>
        {hud.survivalTimer !== null && <span>Survival: {hud.survivalTimer}s</span>}
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="tfr-canvas"
        aria-label="Time Freeze Runner game canvas"
      />

      {hud.levelComplete && !hud.gameWon && (
        <div className="tfr-progress-panel">
          <p>Level Complete</p>
          <button className="tfr-progress-btn" onClick={startNextLevel}>
            Start Next Level
          </button>
        </div>
      )}

      {hud.gameWon && (
        <div className="tfr-progress-panel">
          <p>You Win</p>
          <button className="tfr-progress-btn" onClick={playAgain}>
            Play Again
          </button>
        </div>
      )}

      <p className="tfr-controls">
        <strong>Controls:</strong> WASD / Arrow keys to move &nbsp;|&nbsp;
        Stop moving → time freezes ❄️ &nbsp;|&nbsp; Reach the <span style={{ color: '#22c55e' }}>green EXIT</span> (Lv 1-3) &nbsp;|&nbsp;
        <kbd>R</kbd> restart &nbsp;|&nbsp; <kbd>ESC</kbd> back
      </p>
    </div>
  );
}

TimeFreezeRunner.propTypes = {
  onBack: PropTypes.func.isRequired,
};
