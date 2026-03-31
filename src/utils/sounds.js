// Sound effects using Web Audio API (no external files needed)
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(frequency, type, duration, volume = 0.3) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail if audio not supported
  }
}

export function playFlipSound() {
  playTone(440, 'sine', 0.1, 0.15);
}

export function playMatchSound() {
  playTone(523, 'sine', 0.1, 0.25);
  setTimeout(() => playTone(659, 'sine', 0.15, 0.25), 100);
  setTimeout(() => playTone(784, 'sine', 0.2, 0.3), 200);
}

export function playWrongSound() {
  playTone(220, 'sawtooth', 0.15, 0.2);
  setTimeout(() => playTone(196, 'sawtooth', 0.15, 0.2), 150);
}

export function playLevelUpSound() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((note, i) => {
    setTimeout(() => playTone(note, 'sine', 0.15, 0.3), i * 120);
  });
}

export function playGameOverSound() {
  const notes = [440, 370, 330, 220];
  notes.forEach((note, i) => {
    setTimeout(() => playTone(note, 'sawtooth', 0.2, 0.3), i * 150);
  });
}
