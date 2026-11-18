// Tiny synthesized blips until Audio Dev's real SFX arrive. Audio starts on the first input
// (browsers require it) and the mute choice is remembered.
const KEY = 'deeptrouble.mute';
let ctx = null;
let muted = (() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } })();

export function unlockAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) ctx = new AC();
}
export const isMuted = () => muted;
export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch { /* private mode */ }
  return muted;
}

const VOICES = {
  spear: { type: 'square', f0: 880, f1: 440, dur: 0.08, vol: 0.05 },
  hit: { type: 'square', f0: 300, f1: 120, dur: 0.1, vol: 0.06 },
  kill: { type: 'triangle', f0: 520, f1: 1040, dur: 0.15, vol: 0.08 },
  hurt: { type: 'sawtooth', f0: 200, f1: 70, dur: 0.25, vol: 0.07 },
  air: { type: 'sine', f0: 660, f1: 660, dur: 0.06, vol: 0.05 },
  over: { type: 'triangle', f0: 330, f1: 110, dur: 0.7, vol: 0.08 },
  pearl: { type: 'sine', f0: 1320, f1: 1980, dur: 0.12, vol: 0.06 },
  buy: { type: 'triangle', f0: 660, f1: 1320, dur: 0.22, vol: 0.08 },
  deny: { type: 'square', f0: 160, f1: 120, dur: 0.18, vol: 0.05 },
  torpedo: { type: 'sawtooth', f0: 140, f1: 60, dur: 0.3, vol: 0.06 },
  board: { type: 'sine', f0: 440, f1: 880, dur: 0.12, vol: 0.06 },
  nav: { type: 'sine', f0: 900, f1: 900, dur: 0.04, vol: 0.04 },
};
export function play(name) {
  const v = VOICES[name];
  if (!v || muted || !ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = v.type;
  o.frequency.setValueAtTime(v.f0, t);
  o.frequency.exponentialRampToValueAtTime(v.f1, t + v.dur);
  g.gain.setValueAtTime(v.vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + v.dur);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + v.dur + 0.02);
}
