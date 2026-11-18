import { SHOP } from '../config.js';
import { Controls } from '../controls.js';
import { load as loadSave, save } from '../save.js';
import { play, toggleMute, unlockAudio } from '../sfx.js';
import { artInfo, dress } from '../art.js';

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

    // the menu panel sits to the right of the harbor picture
    const PX = 576, PW = W - PX, cx = PX + PW / 2;
    this.add.rectangle(PX, 0, PW, H, 0x0a1f33, 0.94).setOrigin(0);
    this.add.text(cx, 30, 'BRINEHAVEN PORT SHOP', { fontFamily: 'monospace', fontSize: 22, color: '#ffd76a', stroke: '#2a1405', strokeThickness: 5 }).setOrigin(0.5);
    const icons = !!artInfo(this, 'shopIcons');
    if (icons) this.add.image(cx - 40, 72, 'shopIcons', 3).setScale(2);
    else this.add.image(cx - 40, 72, 'pearl').setScale(1.6);
    this.pearlText = this.add.text(cx - 18, 72, '', { fontFamily: 'monospace', fontSize: 24, color: '#f3e9ff', stroke: '#000', strokeThickness: 4 }).setOrigin(0, 0.5);

    const ICON = { remora: 0, spear: 1, air: 2 };
    this.rowY = (i) => 140 + i * 86;
    this.rows = ROWS.map((key, i) => {
      const y = this.rowY(i), x0 = PX + 12;
      const bg = this.add.rectangle(cx, y, PW - 24, 74, 0x0b2a40, 0.9).setStrokeStyle(2, 0x3d7ea6).setInteractive({ useHandCursor: true });
      if (icons && key in ICON) this.add.image(x0 + 22, y, 'shopIcons', ICON[key]).setScale(2);
      const tx = x0 + (icons ? 48 : 12);
      const name = this.add.text(tx, y - 24, '', { fontFamily: 'monospace', fontSize: 18, color: '#ffffff' });
      const desc = this.add.text(tx, y + 6, '', { fontFamily: 'monospace', fontSize: 13, color: '#9fd0ea' });
      const cost = this.add.text(W - 22, y - 15, '', { fontFamily: 'monospace', fontSize: 16, color: '#f3e9ff' }).setOrigin(1, 0.5);
      bg.on('pointerdown', () => { unlockAudio(); if (this.left || !this.ready) return; this.sel = i; this.activate(); });
      return { key, bg, name, desc, cost };
    });
    this.note = this.add.text(cx, H - 58, '', { fontFamily: 'monospace', fontSize: 14, color: '#ffd76a', stroke: '#000', strokeThickness: 3, align: 'center', wordWrap: { width: PW - 24 } }).setOrigin(0.5);
    this.add.text(cx, H - 20, 'Up/Down choose  Enter buy  Esc back', { fontFamily: 'monospace', fontSize: 13, color: '#e8f4ff' }).setOrigin(0.5);
    this.controls = new Controls(this, { touchUI: false });
    this.refresh();
    // ignore a key still held from docking for a moment
    this.ready = false;
    this.time.delayedCall(250, () => { this.ready = true; });
  }

  drawHarbor(W, H) {
    if (artInfo(this, 'brinehaven')) {
      // Art Dev's 256x240 harbor fills the height; the shopkeeper stands behind the counter
      const k = H / 240;
      this.add.image(0, 0, 'brinehaven').setOrigin(0).setScale(k);
      if (artInfo(this, 'shopkeeper')) {
        const sk = this.add.sprite(78 * k, 111 * k, 'shopkeeper');
        dress(this, sk, 'shopkeeper');
        sk.setScale(k);
      }
      return;
    }
    // placeholder harbor until the art is there
    const g = this.add.graphics();
    g.fillGradientStyle(0xffb36b, 0xffb36b, 0x6fb6e8, 0x6fb6e8, 1).fillRect(0, 0, W, H * 0.62);
    g.fillGradientStyle(0x1b6f9e, 0x1b6f9e, 0x07304d, 0x07304d, 1).fillRect(0, H * 0.62, W, H * 0.38);
    g.fillStyle(0x4f7a5a).fillEllipse(180, H * 0.62, 520, 150);
    for (const [x, c] of [[60, 0xd9c3a0], [130, 0xb8574a], [200, 0xe9e2cf]]) { g.fillStyle(c).fillRect(x, H * 0.5, 54, 40); g.fillStyle(0x5a2e22).fillTriangle(x - 4, H * 0.5, x + 27, H * 0.5 - 22, x + 58, H * 0.5); }
    g.fillStyle(0x7a5232).fillRect(0, H * 0.6, W, 16);
    for (let x = 20; x < W; x += 80) g.fillStyle(0x5a3a22).fillRect(x, H * 0.6, 10, 70);
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
        r.name.setText(on ? '> Set out' : 'Set out');
        r.desc.setText(sv.remora ? 'Back to sea in the Remora' : 'Back out to the boat');
        r.cost.setText('');
        return;
      }
      const item = SHOP[r.key], price = this.priceOf(r.key);
      const lv = r.key === 'remora' ? '' : `  Lv ${sv[r.key]}/${item.costs.length}`;
      r.name.setText(`${on ? '> ' : ''}${item.name}`);
      r.desc.setText(item.desc + lv);
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
