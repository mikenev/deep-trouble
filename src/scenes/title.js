import { Controls } from '../controls.js';
import { unlockAudio, play } from '../sfx.js';
import { load as loadSave } from '../save.js';

const MENU = [['dive', 'Dive'], ['shop', 'Brinehaven port shop']];

export class TitleScene extends Phaser.Scene {
  constructor() { super('title'); }

  create() {
    this.started = false;
    this.sel = 0;
    const { width: W, height: H } = this.scale;
    const g = this.add.graphics();
    g.fillGradientStyle(0x0d4f7a, 0x0d4f7a, 0x041627, 0x041627, 1).fillRect(0, 0, W, H);
    this.add.image(W / 2, H * 0.84, 'rock').setScale(2).setAlpha(0.6);
    this.add.text(W / 2, H * 0.2, 'DEEP TROUBLE', { fontFamily: 'monospace', fontSize: 64, color: '#ffd76a', stroke: '#031019', strokeThickness: 8 }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.32, 'The waters off Brinehaven', { fontFamily: 'monospace', fontSize: 22, color: '#bfe9ff' }).setOrigin(0.5);
    const sv = loadSave();
    if (this.textures.exists('shopIcons') && this.registry.get('art')?.shopIcons) this.add.image(W / 2 - 70, H * 0.4, 'shopIcons', 3).setScale(1.6);
    else this.add.image(W / 2 - 70, H * 0.4, 'pearl').setScale(1.6);
    this.add.text(W / 2 - 54, H * 0.4, `${sv.pearls} tide pearls${sv.remora ? '   Remora owned' : ''}`, { fontFamily: 'monospace', fontSize: 18, color: '#f3e9ff' }).setOrigin(0, 0.5);
    this.items = MENU.map(([key, label], i) => {
      const t = this.add.text(W / 2, H * 0.52 + i * 46, label, { fontFamily: 'monospace', fontSize: 28, color: '#ffffff', backgroundColor: '#0008', padding: { x: 16, y: 6 } })
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => { unlockAudio(); this.sel = i; this.go(); });
      return t;
    });
    this.add.text(W / 2, H * 0.74, 'Move: arrows or WASD   Fire: Space or Z   Sub/dock: Enter   Pause: Esc   Mute: M', { fontFamily: 'monospace', fontSize: 15, color: '#8fc3dd' }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.79, 'Touch: left stick, FIRE and the SUB/DOCK button   Gamepad: stick, A fire, Y sub/dock', { fontFamily: 'monospace', fontSize: 15, color: '#8fc3dd' }).setOrigin(0.5);
    this.controls = new Controls(this, { touchUI: false });
    this.refresh();
  }

  refresh() {
    this.items.forEach((t, i) => t.setColor(i === this.sel ? '#ffd76a' : '#ffffff').setText((i === this.sel ? '> ' : '') + MENU[i][1]));
  }

  go() {
    if (this.started) return;
    this.started = true;
    this.scene.start(MENU[this.sel][0]);
  }

  update() {
    const c = this.controls.update();
    if (c.up || c.down) { this.sel = (this.sel + 1) % MENU.length; play('nav'); this.refresh(); }
    if (c.confirm) this.go();
  }
}
