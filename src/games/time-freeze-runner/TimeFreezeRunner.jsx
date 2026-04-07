import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import './TimeFreezeRunner.css';

// ─── Constants ───────────────────────────────────────────────────────────────
const W = 800;
const H = 550;
const PLAYER_SPEED = 180;   // px/s
const ENEMY_SPEED = 90;     // px/s
const BULLET_SPEED = 220;   // px/s
const SHOOT_INTERVAL = 2.5; // seconds between shots
const PLAYER_R = 14;
const ENEMY_SIZE = 22;
const BULLET_R = 5;
const GOAL_W = 60;
const GOAL_H = 60;

// ─── Level layout ────────────────────────────────────────────────────────────
const WALLS = [
  { x: 180, y:  60, w: 16, h: 180 },
  { x: 320, y: 180, w: 200, h: 16 },
  { x: 520, y:  80, w: 16, h: 180 },
  { x: 100, y: 340, w: 200, h: 16 },
  { x: 400, y: 340, w: 16, h: 160 },
  { x: 580, y: 280, w: 180, h: 16 },
  { x: 260, y: 430, w: 16, h: 120 },
];

const GOAL = { x: 700, y: 460, w: GOAL_W, h: GOAL_H };

function createState() {
  return {
    phase: 'playing', // 'playing' | 'won' | 'lost'
    timeFrozen: true,
    elapsed: 0,       // total active (unfrozen) time
    player: { x: 60, y: 60, r: PLAYER_R },
    enemies: [
      // horizontal patrol
      { id: 0, x: 360, y: 130, w: ENEMY_SIZE, h: ENEMY_SIZE, type: 'patrol-h', dir: 1, bound0: 220, bound1: 600 },
      // vertical patrol
      { id: 1, x: 140, y: 220, w: ENEMY_SIZE, h: ENEMY_SIZE, type: 'patrol-v', dir: 1, bound0: 100, bound1: 480 },
      // shooter that chases slowly
      { id: 2, x: 600, y: 150, w: ENEMY_SIZE, h: ENEMY_SIZE, type: 'shooter', shootCooldown: 0 },
    ],
    bullets: [],
    nextBulletId: 0,
  };
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

  const MOVE_KEYS = new Set(['w', 'W', 'a', 'A', 's', 'S', 'd', 'D',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
  const isMoving = [...keys].some((k) => MOVE_KEYS.has(k));

  state.timeFrozen = !isMoving;
  if (!isMoving) return; // time frozen — nothing moves

  state.elapsed += dt;

  const speed = PLAYER_SPEED * dt;
  let { x, y } = state.player;
  const r = state.player.r;

  if (keys.has('w') || keys.has('W') || keys.has('ArrowUp'))    y -= speed;
  if (keys.has('s') || keys.has('S') || keys.has('ArrowDown'))  y += speed;
  if (keys.has('a') || keys.has('A') || keys.has('ArrowLeft'))  x -= speed;
  if (keys.has('d') || keys.has('D') || keys.has('ArrowRight')) x += speed;

  // Clamp to canvas
  x = Math.max(r, Math.min(W - r, x));
  y = Math.max(r, Math.min(H - r, y));

  // Push player out of walls
  for (const w of WALLS) {
    if (circleRect(x, y, r, w.x, w.y, w.w, w.h)) {
      // Resolve on axis of least overlap
      const overlapLeft  = (x + r) - w.x;
      const overlapRight = (w.x + w.w) - (x - r);
      const overlapTop   = (y + r) - w.y;
      const overlapBot   = (w.y + w.h) - (y - r);
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

  // ── Enemies ──────────────────────────────────────────────────────────────
  for (const e of state.enemies) {
    const es = ENEMY_SPEED * dt;
    if (e.type === 'patrol-h') {
      e.x += e.dir * es;
      if (e.x <= e.bound0 || e.x + e.w >= e.bound1) e.dir *= -1;
    } else if (e.type === 'patrol-v') {
      e.y += e.dir * es;
      if (e.y <= e.bound0 || e.y + e.h >= e.bound1) e.dir *= -1;
    } else if (e.type === 'shooter') {
      // Slow chase
      const dx = state.player.x - (e.x + e.w / 2);
      const dy = state.player.y - (e.y + e.h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      e.x += (dx / dist) * es * 0.55;
      e.y += (dy / dist) * es * 0.55;
      e.x = Math.max(0, Math.min(W - e.w, e.x));
      e.y = Math.max(0, Math.min(H - e.h, e.y));

      // Shoot
      e.shootCooldown = (e.shootCooldown || 0) - dt;
      if (e.shootCooldown <= 0) {
        e.shootCooldown = SHOOT_INTERVAL;
        const bx = e.x + e.w / 2;
        const by = e.y + e.h / 2;
        const bdx = dx / dist;
        const bdy = dy / dist;
        state.bullets.push({
          id: state.nextBulletId++,
          x: bx, y: by, vx: bdx * BULLET_SPEED, vy: bdy * BULLET_SPEED, r: BULLET_R,
        });
      }
    }
  }

  // ── Bullets ───────────────────────────────────────────────────────────────
  state.bullets = state.bullets.filter((b) => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // Remove if off-screen
    if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) return false;
    // Remove if hits a wall
    for (const w of WALLS) {
      if (circleRect(b.x, b.y, b.r, w.x, w.y, w.w, w.h)) return false;
    }
    return true;
  });

  // ── Collision: player vs enemies ─────────────────────────────────────────
  for (const e of state.enemies) {
    if (circleRect(state.player.x, state.player.y, r, e.x, e.y, e.w, e.h)) {
      state.phase = 'lost';
      return;
    }
  }

  // ── Collision: player vs bullets ─────────────────────────────────────────
  for (const b of state.bullets) {
    if (circleCircle(state.player.x, state.player.y, r, b.x, b.y, b.r)) {
      state.phase = 'lost';
      return;
    }
  }

  // ── Win condition ─────────────────────────────────────────────────────────
  if (circleRect(state.player.x, state.player.y, r, GOAL.x, GOAL.y, GOAL.w, GOAL.h)) {
    state.phase = 'won';
  }
}

// ─── Render ───────────────────────────────────────────────────────────────────
function render(ctx, state, ts) {
  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);

  // Walls
  ctx.fillStyle = '#334155';
  for (const w of WALLS) {
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  }

  // Goal
  const goalPulse = 0.7 + 0.3 * Math.sin(ts / 400);
  ctx.shadowColor = '#22c55e';
  ctx.shadowBlur = 16 * goalPulse;
  ctx.fillStyle = `rgba(34,197,94,${0.4 + 0.2 * goalPulse})`;
  ctx.fillRect(GOAL.x, GOAL.y, GOAL.w, GOAL.h);
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.strokeRect(GOAL.x, GOAL.y, GOAL.w, GOAL.h);
  ctx.shadowBlur = 0;

  // Goal label
  ctx.fillStyle = '#86efac';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', GOAL.x + GOAL.w / 2, GOAL.y + GOAL.h / 2 + 5);

  // Enemies
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

  // Bullets
  for (const b of state.bullets) {
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = state.timeFrozen ? 4 : 10;
    ctx.fillStyle = state.timeFrozen ? '#7c2d12' : '#f97316';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Player
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

  // ── Freeze overlay ─────────────────────────────────────────────────────────
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

  // ── Overlay screens ────────────────────────────────────────────────────────
  if (state.phase === 'won') {
    drawOverlay(ctx, '#14532d', 'rgba(20,83,45,0.92)', '🏆 YOU ESCAPED!',
      `Active time: ${state.elapsed.toFixed(1)}s`, '#86efac');
  } else if (state.phase === 'lost') {
    drawOverlay(ctx, '#7f1d1d', 'rgba(127,29,29,0.92)', '💀 CAUGHT!',
      'Press R to restart', '#fca5a5');
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
  const canvasRef = useRef(null);
  const stateRef = useRef(createState());
  const keysRef  = useRef(new Set());
  const rafRef   = useRef(null);
  const lastRef  = useRef(null);

  const restart = useCallback(() => {
    stateRef.current = createState();
  }, []);

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

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onBack, restart]);

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
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="tfr-canvas"
        aria-label="Time Freeze Runner game canvas"
      />
      <p className="tfr-controls">
        <strong>Controls:</strong> WASD / Arrow keys to move &nbsp;|&nbsp;
        Stop moving → time freezes ❄️ &nbsp;|&nbsp; Reach the <span style={{ color: '#22c55e' }}>green EXIT</span> to win &nbsp;|&nbsp;
        <kbd>R</kbd> restart &nbsp;|&nbsp; <kbd>ESC</kbd> back
      </p>
    </div>
  );
}

TimeFreezeRunner.propTypes = {
  onBack: PropTypes.func.isRequired,
};
