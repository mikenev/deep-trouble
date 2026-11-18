import { unlockAudio } from './sfx.js';

// Fire and confirm keys held right now, tracked for the whole page: a new scene's own key objects
// never saw a key that went down in the previous scene, so they can't tell it's still held.
const heldKeys = new Set();
const HOLD = new Set(['Space', 'KeyZ', 'Enter', 'NumpadEnter']);
window.addEventListener('keydown', (e) => { if (HOLD.has(e.code) || e.keyCode === 23) heldKeys.add(e.code || e.keyCode); });
window.addEventListener('keyup', (e) => heldKeys.delete(e.code || e.keyCode));
window.addEventListener('blur', () => heldKeys.clear());

// One input state built from keyboard, touch, gamepad and the Fire TV remote.
// Each frame: x and y in -1..1, fire held, and one-frame presses for fire, confirm, action
// (board or leave the Remora, dock), menu up/down, back and mute.
export class Controls {
  constructor(scene, { touchUI = true, playAction = false } = {}) {
    this.scene = scene;
    // in the dive, Fire TV Play/Pause is the context key (board, leave, dock) and pauses only when
    // there's nothing to do; everywhere else it simply means back
    this.playAction = playAction;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = scene.input.keyboard.addKeys({
      up: K.UP, down: K.DOWN, left: K.LEFT, right: K.RIGHT,
      w: K.W, a: K.A, s: K.S, d: K.D,
      space: K.SPACE, z: K.Z, enter: K.ENTER, esc: K.ESC, back: K.BACKSPACE, m: K.M, e: K.E,
    }, true, false);
    this.state = { x: 0, y: 0, fire: false, firePressed: false, confirm: false, action: false, enter: false, enterPressed: false, playPause: false, held: false, up: false, down: false, back: false, mute: false };
    this._prev = {};
    this._queued = { back: false, mute: false, action: false, play: false };
    this.touch = { x: 0, y: 0, fire: false, back: false, mute: false, action: false, stickId: -1, fireId: -1 };

    // Fire TV remote keys that Phaser has no names for: Back (4), Menu (82), Play/Pause (179)
    this._onKey = (e) => {
      unlockAudio();
      if (e.keyCode === 4) { this._queued.back = true; e.preventDefault(); }
      if (e.keyCode === 179) { this._queued.play = true; e.preventDefault(); } // Play/Pause: sub / dock in the dive
      if (e.keyCode === 82) { this._queued.back = true; e.preventDefault(); } // Menu: pause
    };
    window.addEventListener('keydown', this._onKey);
    this._jd = {};
    const names = { Space: 'space', KeyZ: 'z', Enter: 'enter', NumpadEnter: 'enter', Escape: 'esc', Backspace: 'back', KeyM: 'm', KeyE: 'e',
      ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' };
    scene.input.keyboard.on('keydown', (e) => { const n = names[e.code]; if (n && !e.repeat) this._jd[n] = true; });
    scene.input.on('pointerdown', unlockAudio);
    scene.events.once('shutdown', () => window.removeEventListener('keydown', this._onKey));

    if (touchUI) this._buildTouch();
  }

  _buildTouch() {
    const s = this.scene, W = s.scale.width, H = s.scale.height;
    const show = s.sys.game.device.input.touch;
    const ui = this.touchUI = s.add.container(0, 0).setScrollFactor(0).setDepth(1000).setVisible(show);
    const R = 62, cx = 96, cy = H - 96;
    const base = s.add.circle(cx, cy, R, 0xffffff, 0.12).setStrokeStyle(2, 0xffffff, 0.35);
    const knob = s.add.circle(cx, cy, 26, 0xffffff, 0.3);
    const fire = s.add.circle(W - 92, H - 92, 46, 0xff7a3d, 0.35).setStrokeStyle(2, 0xffffff, 0.5);
    const fireTxt = s.add.text(W - 92, H - 92, 'FIRE', { fontFamily: 'monospace', fontSize: 16, color: '#fff' }).setOrigin(0.5);
    const pause = s.add.text(W - 120, 14, 'II', { fontFamily: 'monospace', fontSize: 20, color: '#fff', backgroundColor: '#0008', padding: { x: 10, y: 4 } });
    const mute = s.add.text(W - 64, 14, 'M', { fontFamily: 'monospace', fontSize: 20, color: '#fff', backgroundColor: '#0008', padding: { x: 10, y: 4 } });
    // context button above FIRE: board or leave the Remora, or dock at the boat; hidden when it does nothing
    const act = s.add.circle(W - 92, H - 196, 34, 0x58d6ff, 0.35).setStrokeStyle(2, 0xffffff, 0.5).setVisible(false);
    const actTxt = s.add.text(W - 92, H - 196, '', { fontFamily: 'monospace', fontSize: 14, color: '#fff' }).setOrigin(0.5).setVisible(false);
    this._act = [act, actTxt];
    ui.add([base, knob, fire, fireTxt, pause, mute, act, actTxt]);
    this._knob = knob;
    const t = this.touch;
    const inRect = (o, p) => o.getBounds().contains(p.x, p.y);
    s.input.on('pointerdown', (p) => {
      if (!p.wasTouch) return;
      ui.setVisible(true);
      if (inRect(pause, p)) { t.back = true; return; }
      if (inRect(mute, p)) { t.mute = true; return; }
      if (act.visible && Phaser.Math.Distance.Between(p.x, p.y, act.x, act.y) <= 40) { t.action = true; return; }
      if (p.x < W / 2 && t.stickId < 0) { t.stickId = p.id; this._stick(p, cx, cy, R); }
      else if (p.x >= W / 2) { t.fireId = p.id; t.fire = true; t.firePress = true; }
    });
    s.input.on('pointermove', (p) => { if (p.id === t.stickId) this._stick(p, cx, cy, R); });
    const up = (p) => {
      if (p.id === t.stickId) { t.stickId = -1; t.x = t.y = 0; knob.setPosition(cx, cy); }
      if (p.id === t.fireId) { t.fireId = -1; t.fire = false; }
    };
    s.input.on('pointerup', up);
    s.input.on('pointerupoutside', up);
  }

  // label the touch context button, or hide it with null
  setAction(label) {
    if (!this._act || this._actLabel === label) return;
    this._actLabel = label;
    this._act[0].setVisible(!!label);
    this._act[1].setVisible(!!label).setText(label || '');
  }

  // forget presses that piled up while the scene was asleep (the bonus flight runs on top of the dive)
  reset() {
    this._jd = {};
    this._queued = { back: false, mute: false, action: false, play: false };
    Object.assign(this.touch, { x: 0, y: 0, fire: false, firePress: false, back: false, mute: false, action: false, stickId: -1, fireId: -1 });
    this._knob?.setPosition(96, this.scene.scale.height - 96);
    this.scene.input.keyboard?.resetKeys();
  }

  _stick(p, cx, cy, R) {
    let dx = p.x - cx, dy = p.y - cy;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    this._knob.setPosition(cx + dx, cy + dy);
    const dead = 0.2;
    this.touch.x = Math.abs(dx / R) > dead ? dx / R : 0;
    this.touch.y = Math.abs(dy / R) > dead ? dy / R : 0;
  }

  update() {
    const k = this.keys, t = this.touch, st = this.state;
    let x = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
    let y = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
    let fire = k.space.isDown || k.z.isDown || t.fire;
    if (t.x || t.y) { x = t.x; y = t.y; }
    const pad = this.scene.input.gamepad?.total ? this.scene.input.gamepad.pad1 : null;
    if (pad) {
      const ax = pad.axes.length > 1 ? pad.axes[0].getValue() : 0, ay = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;
      if (Math.abs(ax) > 0.25) x = ax;
      if (Math.abs(ay) > 0.25) y = ay;
      if (pad.left) x = -1; if (pad.right) x = 1; if (pad.up) y = -1; if (pad.down) y = 1;
      if (pad.A) fire = true;
    }
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    // key presses come from key events, so a tap shorter than a frame still counts
    const jd = this._jd;
    this._jd = {};
    const edge = (name, now) => { const e = now && !this._prev[name]; this._prev[name] = now; return e; };
    const padFire = edge('padFire', !!pad?.A), padBack = edge('padBack', !!(pad && (pad.B || pad.buttons[9]?.pressed)));
    const padAct = edge('padAct', !!(pad && (pad.Y || pad.X)));
    // menu steps: arrow/WASD key events, or the stick/D-pad crossing the halfway mark
    const padUp = edge('padUp', !!pad && y < -0.5), padDown = edge('padDown', !!pad && y > 0.5);
    st.x = x; st.y = y; st.fire = fire || jd.space || jd.z;
    st.firePressed = jd.space || jd.z || padFire || !!t.firePress;
    st.confirm = jd.enter || jd.space || padFire || !!t.firePress;
    // Enter (Fire TV Select) fires in the dive unless a dock or board prompt is up; the dive scene decides
    st.enter = k.enter.isDown; st.enterPressed = !!jd.enter;
    st.action = jd.e || padAct || !!t.action || this._queued.action;
    st.playPause = this.playAction && this._queued.play;
    st.up = jd.up || padUp; st.down = jd.down || padDown;
    st.back = jd.esc || jd.back || padBack || t.back || this._queued.back || (!this.playAction && this._queued.play);
    st.mute = jd.m || t.mute;
    // anything that fires or confirms still held down (used to make a fresh press count after death)
    st.held = !!(heldKeys.size || st.fire || k.enter.isDown || (pad && pad.A) || this.scene.input.activePointer?.isDown);
    t.firePress = false; t.back = false; t.mute = false; t.action = false;
    this._queued.back = false; this._queued.action = false; this._queued.play = false;
    if (st.firePressed || x || y) unlockAudio();
    return st;
  }
}
