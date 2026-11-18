// Sound: Audio Dev's music loops and SFX (listed in assets/audio/audio.json), with tiny synthesized
// blips for any effect that has no file yet. Nothing is created or played until the first key press,
// tap or click (browsers block audio before that), and the mute choice is remembered.
const KEY = 'deeptrouble.mute';
let ctx = null, master = null;
let muted = (() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } })();
let list = { music: {}, sfx: {} };
const buffers = {};          // 'music:dive' / 'sfx:spear' -> AudioBuffer once decoded
let wanted = null;           // the music the current scene asked for
let current = null;          // { name, src, gain } playing now

// read the list early (it's tiny); the sound files themselves load after the first input
export async function loadAudioList(url = 'assets/audio/audio.json') {
  try {
    const r = await fetch(url);
    if (r.ok) { const j = await r.json(); list = { music: j.music || {}, sfx: j.sfx || {} }; }
  } catch { /* no list: synth blips only */ }
  if (ctx) fetchAll();
  pickMusic();
}

const ext = () => {
  const a = document.createElement('audio');
  return a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3';
};
const entry = (v) => (typeof v === 'string' ? { file: v } : v || {});

function fetchAll() {
  const e = ext();
  for (const kind of ['music', 'sfx']) {
    for (const [name, v] of Object.entries(list[kind])) {
      const id = `${kind}:${name}`, f = entry(v).file;
      if (!f || buffers[id] !== undefined) continue;
      buffers[id] = null; // loading
      fetch(`assets/audio/${f}.${e}`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status))))
        .then((b) => new Promise((ok, no) => ctx.decodeAudioData(b, ok, no)))
        .then((buf) => { buffers[id] = buf; if (kind === 'music' && name === wanted && current?.name !== name) startMusic(); })
        .catch(() => { buffers[id] = false; console.info(`[deep-trouble] no sound for ${id}, using the fallback`); if (kind === 'music' && name === wanted) startMusic(); });
    }
  }
}

export function unlockAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume().then(startMusic); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ctx.destination);
  fetchAll();
  if (ctx.state === 'running') startMusic(); else ctx.resume().then(startMusic);
}
export const isMuted = () => muted;
export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch { /* private mode */ }
  if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.02);
  return muted;
}

// ask for a music loop (null for silence); it starts once audio is unlocked and the file is in
// a scene whose own loop isn't listed borrows a close one
// (game over and the victory card are quiet apart from their stings, which play as SFX)
const BORROW = { title: 'dive', shop: 'title', boss: 'dive', bonus: 'dive' };
let asked = null;
export function music(name) { asked = name; pickMusic(); }
function pickMusic() {
  let name = asked;
  while (name && !list.music[name] && BORROW[name]) name = BORROW[name];
  wanted = name && list.music[name] ? name : null;
  startMusic();
}
function startMusic() {
  if (!ctx || ctx.state !== 'running') return;
  if (current && current.name === wanted) return;
  const buf = wanted && buffers[`music:${wanted}`];
  if (wanted && buf == null) return; // still loading: keep what's playing until it's in (a failed file means silence)
  const t = ctx.currentTime;
  if (current) { const old = current; old.gain.gain.setTargetAtTime(0, t, 0.15); old.src.stop(t + 0.8); current = null; }
  if (!buf) return;
  const src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = buf; src.loop = true;
  const vol = entry(list.music[wanted]).vol ?? 0.6;
  g.gain.setValueAtTime(0, t); g.gain.setTargetAtTime(vol, t, 0.2);
  src.connect(g).connect(master);
  src.start(t);
  current = { name: wanted, src, gain: g };
}

const VOICES = {
  spear: { type: 'square', f0: 880, f1: 440, dur: 0.08, vol: 0.05 },
  hit: { type: 'square', f0: 300, f1: 120, dur: 0.1, vol: 0.06 },
  kill: { type: 'triangle', f0: 520, f1: 1040, dur: 0.15, vol: 0.08 },
  hurt: { type: 'sawtooth', f0: 200, f1: 70, dur: 0.25, vol: 0.07 },
  air: { type: 'sine', f0: 660, f1: 660, dur: 0.06, vol: 0.05 },
  airLow: { type: 'sine', f0: 990, f1: 660, dur: 0.18, vol: 0.05 },
  roar: { type: 'sawtooth', f0: 140, f1: 60, dur: 0.5, vol: 0.08 },
  over: { type: 'triangle', f0: 330, f1: 110, dur: 0.7, vol: 0.08 },
  pearl: { type: 'sine', f0: 1320, f1: 1980, dur: 0.12, vol: 0.06 },
  buy: { type: 'triangle', f0: 660, f1: 1320, dur: 0.22, vol: 0.08 },
  deny: { type: 'square', f0: 160, f1: 120, dur: 0.18, vol: 0.05 },
  torpedo: { type: 'sawtooth', f0: 140, f1: 60, dur: 0.3, vol: 0.06 },
  board: { type: 'sine', f0: 440, f1: 880, dur: 0.12, vol: 0.06 },
  nav: { type: 'sine', f0: 900, f1: 900, dur: 0.04, vol: 0.04 },
  bomb: { type: 'sine', f0: 700, f1: 200, dur: 0.3, vol: 0.05 },
  splash: { type: 'sawtooth', f0: 220, f1: 90, dur: 0.18, vol: 0.04 },
  warning: { type: 'square', f0: 440, f1: 330, dur: 0.4, vol: 0.06 },
  bossHit: { type: 'square', f0: 220, f1: 110, dur: 0.12, vol: 0.07 },
  bossDown: { type: 'triangle', f0: 180, f1: 720, dur: 0.9, vol: 0.09 },
  victory: { type: 'triangle', f0: 523, f1: 1046, dur: 0.6, vol: 0.08 },
};
export function play(name) {
  if (!ctx || ctx.state !== 'running') return;
  const buf = buffers[`sfx:${name}`];
  if (buf) {
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf; g.gain.value = entry(list.sfx[name]).vol ?? 1;
    src.connect(g).connect(master); src.start();
    return;
  }
  const v = VOICES[name];
  if (!v) return;
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = v.type;
  o.frequency.setValueAtTime(v.f0, t);
  o.frequency.exponentialRampToValueAtTime(v.f1, t + v.dur);
  g.gain.setValueAtTime(v.vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + v.dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + v.dur + 0.02);
}

// a looping effect (the seaplane's engine) under the music; returns something to stop it with
export function loopSfx(name) {
  const buf = ctx?.state === 'running' && buffers[`sfx:${name}`];
  if (!buf) return { stop() {} };
  const src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = buf; src.loop = true; g.gain.value = entry(list.sfx[name]).vol ?? 1;
  src.connect(g).connect(master); src.start();
  let on = true;
  return { stop() { if (on) { on = false; g.gain.setTargetAtTime(0, ctx.currentTime, 0.05); src.stop(ctx.currentTime + 0.3); } } };
}

// for tests and debugging
export const audioState = () => ({
  unlocked: !!ctx, running: ctx?.state === 'running', muted, gain: master ? master.gain.value : null,
  asked, wanted, playing: current?.name || null,
  loaded: Object.entries(buffers).filter(([, b]) => b).map(([k]) => k),
});
