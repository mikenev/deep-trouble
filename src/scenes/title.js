import { Controls } from '../controls.js';
import { unlockAudio, play, music } from '../sfx.js';
import { artInfo, dress } from '../art.js';
import { load as loadSave } from '../save.js';

const MENU = [['dive', 'Dive'], ['shop', 'Brinehaven port shop']];

export class TitleScene extends Phaser.Scene {
  constructor() { super('title'); }

  create() {
    this.started = false;
    this.sel = 0;
    const { width: W, height: H } = this.scale;
    const art = artInfo(this, 'title');
    const help = { fontFamily: 'monospace', fontSize: 15, color: '#8fc3dd' };
    let helpY = [0.72, 0.77, 0.82, 0.88];
    if (art) {
      // Art Dev's full-screen title card: logo, Scarback's shadow, the diver and the seabed
      this.logo = dress(this, this.add.image(0, 0, 'title'), 'title').setOrigin(0, 0);
      this.logo.setScale(W / this.logo.width, H / this.logo.height);
      const k = W / this.logo.width, ps = art.pressStart || [240, 203];
      if (artInfo(this, 'pressStart')) this.press = dress(this, this.add.sprite(ps[0] * k, ps[1] * k, 'pressStart'), 'pressStart');
      // the help sits on a dark strip over the seabed
      this.add.rectangle(0, H * 0.8, W, H * 0.2, 0x02080f, 0.62).setOrigin(0, 0);
      helpY = [0.83, 0.87, 0.91, 0.955];
      help.fontSize = 14;
    } else {
      const g = this.add.graphics();
      g.fillGradientStyle(0x0d4f7a, 0x0d4f7a, 0x041627, 0x041627, 1).fillRect(0, 0, W, H);
      this.add.image(W / 2, H * 0.84, 'rock').setScale(2).setAlpha(0.6);
      // the drawn stand-in card with the name on it
      const card = this.logo = this.add.image(W / 2, H * 0.19, 'title').setScale(1.1, 0.9);
      this.add.text(W / 2, H * 0.165, 'DEEP TROUBLE', { fontFamily: 'monospace', fontSize: 58, color: '#ffd76a', stroke: '#031019', strokeThickness: 8 }).setOrigin(0.5);
      this.add.text(W / 2, H * 0.255, 'The waters off Brinehaven', { fontFamily: 'monospace', fontSize: 20, color: '#bfe9ff' }).setOrigin(0.5);
      this.tweens.add({ targets: card, y: card.y + 4, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    const sv = loadSave(), py = art ? H * 0.455 : H * 0.4;
    if (this.textures.exists('shopIcons') && this.registry.get('art')?.shopIcons) this.add.image(W / 2 - 70, py, 'shopIcons', 3).setScale(1.6);
    else this.add.image(W / 2 - 70, py, 'pearl').setScale(1.6);
    this.add.text(W / 2 - 54, py, `${sv.pearls} tide pearls${sv.remora ? '   Remora owned' : ''}`, { fontFamily: 'monospace', fontSize: 18, color: '#f3e9ff', stroke: '#02080f', strokeThickness: 4 }).setOrigin(0, 0.5);
    this.items = MENU.map(([key, label], i) => {
      const t = this.add.text(W / 2, H * 0.52 + i * 46, label, { fontFamily: 'monospace', fontSize: 28, color: '#ffffff', backgroundColor: '#000a', padding: { x: 16, y: 6 } })
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => { unlockAudio(); this.sel = i; this.go(); });
      return t;
    });
    this.add.text(W / 2, H * helpY[0], 'Move: arrows or WASD   Fire: Space or Z   Sub/dock: E (Enter at a prompt)   Pause: Esc   Mute: M', help).setOrigin(0.5);
    this.add.text(W / 2, H * helpY[1], 'Touch: left stick, FIRE and the SUB/DOCK button   Gamepad: stick, A fire, Y sub/dock', help).setOrigin(0.5);
    this.add.text(W / 2, H * helpY[2], 'Fire TV: Select fires, docks or boards at a prompt   Play/Pause: sub in or out, else pause   Menu: pause', help).setOrigin(0.5);
    this.add.text(W / 2, H * helpY[3], 'Reach a moored seaplane for a bonus flight. Stay down long enough and Scarback comes for you.', { ...help, color: '#ffd76a' }).setOrigin(0.5);
    this.controls = new Controls(this, { touchUI: false });
    music('title');
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
