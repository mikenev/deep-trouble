import { SHOP } from '../config.js';
import { Controls } from '../controls.js';
import { load as loadSave, save } from '../save.js';
import { play, toggleMute, unlockAudio } from '../sfx.js';

// Brinehaven port shop: spend tide pearls on upgrades and the Remora, then set out again.
// Keyboard/remote/gamepad move a highlight up and down; touch taps a row directly.
const ROWS = ['spear', 'air', 'remora', 'setout'];

export class ShopScene extends Phaser.Scene {
  constructor() { super('shop'); }
  init(data) { this.carryScore = data?.score || 0; this.left = false; }

  create() {
    window.DT.shop = this;
    const { width: W, height: H } = this.scale;
    this.sel = 0;
    this.drawHarbor(W, H);

    this.add.text(W / 2, 40, 'BRINEHAVEN PORT SHOP', { fontFamily: 'monospace', fontSize: 36, color: '#ffd76a', stroke: '#2a1405', strokeThickness: 7 }).setOrigin(0.5);
    this.add.image(W / 2 - 60, 92, 'pearl').setScale(2);
    this.pearlText = this.add.text(W / 2 - 42, 78, '', { fontFamily: 'monospace', fontSize: 26, color: '#f3e9ff', stroke: '#000', strokeThickness: 5 });

    this.rows = ROWS.map((key, i) => {
      const y = 150 + i * 72;
      const bg = this.add.rectangle(W / 2, y, 620, 60, 0x0b2a40, 0.88).setStrokeStyle(2, 0x3d7ea6).setInteractive({ useHandCursor: true });
      const name = this.add.text(W / 2 - 290, y - 20, '', { fontFamily: 'monospace', fontSize: 22, color: '#ffffff' });
      const desc = this.add.text(W / 2 - 290, y + 6, '', { fontFamily: 'monospace', fontSize: 15, color: '#9fd0ea' });
      const cost = this.add.text(W / 2 + 290, y, '', { fontFamily: 'monospace', fontSize: 22, color: '#f3e9ff' }).setOrigin(1, 0.5);
      bg.on('pointerdown', () => { unlockAudio(); if (this.left || !this.ready) return; this.sel = i; this.activate(); });
      return { key, bg, name, desc, cost };
    });
    this.add.text(W / 2, H - 22, 'Up/Down choose   Enter buy   Esc back to title   M mute', { fontFamily: 'monospace', fontSize: 15, color: '#e8f4ff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
    this.note = this.add.text(W / 2, H - 52, '', { fontFamily: 'monospace', fontSize: 18, color: '#ffd76a', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
    this.controls = new Controls(this, { touchUI: false });
    this.refresh();
    // ignore a key still held from docking for a moment
    this.ready = false;
    this.time.delayedCall(250, () => { this.ready = true; });
  }

  drawHarbor(W, H) {
    const g = this.add.graphics();
    g.fillGradientStyle(0xffb36b, 0xffb36b, 0x6fb6e8, 0x6fb6e8, 1).fillRect(0, 0, W, H * 0.62);
    g.fillGradientStyle(0x1b6f9e, 0x1b6f9e, 0x07304d, 0x07304d, 1).fillRect(0, H * 0.62, W, H * 0.38);
    // far hills and harbor houses
    g.fillStyle(0x4f7a5a).fillEllipse(180, H * 0.62, 520, 150).fillEllipse(760, H * 0.63, 640, 120);
    const houses = [[60, 0xd9c3a0], [130, 0xb8574a], [200, 0xe9e2cf], [700, 0x6b8fb3], [780, 0xd9c3a0], [860, 0xb8574a]];
    for (const [x, c] of houses) { g.fillStyle(c).fillRect(x, H * 0.5, 54, 40); g.fillStyle(0x5a2e22).fillTriangle(x - 4, H * 0.5, x + 27, H * 0.5 - 22, x + 58, H * 0.5); }
    // the dock
    g.fillStyle(0x7a5232).fillRect(0, H * 0.6, W, 16);
    for (let x = 20; x < W; x += 80) g.fillStyle(0x5a3a22).fillRect(x, H * 0.6, 10, 70);
    this.add.image(W - 140, H * 0.6 - 18, 'boat').setAlpha(0.95);
  }

  priceOf(key) {
    const sv = loadSave();
    if (key === 'remora') return sv.remora ? null : SHOP.remora.costs[0];
    if (key === 'setout') return null;
    return SHOP[key].costs[sv[key]] ?? null; // null once maxed
  }

  refresh() {
    const sv = loadSave();
    this.pearlText.setText(String(sv.pearls));
    this.rows.forEach((r, i) => {
      const on = i === this.sel;
      r.bg.setFillStyle(on ? 0x1f5f86 : 0x0b2a40, 0.9).setStrokeStyle(on ? 3 : 2, on ? 0xffd76a : 0x3d7ea6);
      if (r.key === 'setout') {
        r.name.setText(on ? '> Set out for the dive' : 'Set out for the dive');
        r.desc.setText(sv.remora ? 'You start in the Remora (Enter to leave or board it)' : 'Back out to the boat');
        r.cost.setText('');
        return;
      }
      const item = SHOP[r.key], price = this.priceOf(r.key);
      const lv = r.key === 'remora' ? '' : `  Lv ${sv[r.key]}/${item.costs.length}`;
      r.name.setText(`${on ? '> ' : ''}${item.name}${lv}`);
      r.desc.setText(item.desc);
      r.cost.setText(price == null ? (r.key === 'remora' ? 'OWNED' : 'MAX') : `${price} pearls`)
        .setColor(price != null && price > sv.pearls ? '#ff8a6a' : '#f3e9ff');
    });
  }

  activate() {
    const key = ROWS[this.sel];
    if (key === 'setout') { this.leave('dive'); return; }
    const sv = loadSave(), price = this.priceOf(key);
    if (price == null) { play('deny'); this.say(key === 'remora' ? 'The Remora is already yours.' : 'Fully upgraded.'); }
    else if (price > sv.pearls) { play('deny'); this.say(`Need ${price - sv.pearls} more tide pearls.`); }
    else {
      sv.pearls -= price;
      if (key === 'remora') sv.remora = true; else sv[key] += 1;
      save();
      play('buy');
      this.say(key === 'remora' ? 'The Remora is yours! You start the next dive in it.' : `Bought: ${SHOP[key].name}`);
    }
    this.refresh();
  }

  say(t) { this.note.setText(t); }

  leave(to) {
    if (this.left) return;
    this.left = true;
    this.scene.start(to, to === 'dive' ? { score: this.carryScore } : undefined);
  }

  update() {
    const c = this.controls.update();
    if (!this.ready || this.left) return;
    if (c.mute) this.say(toggleMute() ? 'Sound off' : 'Sound on');
    if (c.up || c.down) {
      this.sel = (this.sel + (c.down ? 1 : -1) + ROWS.length) % ROWS.length;
      play('nav');
      this.refresh();
    }
    if (c.confirm) this.activate();
    else if (c.back) this.leave('title');
  }
}
