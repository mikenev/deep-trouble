import { Controls } from '../controls.js';
import { unlockAudio } from '../sfx.js';

export class TitleScene extends Phaser.Scene {
  constructor() { super('title'); }

  create() {
    this.started = false;
    const { width: W, height: H } = this.scale;
    const g = this.add.graphics();
    g.fillGradientStyle(0x0d4f7a, 0x0d4f7a, 0x041627, 0x041627, 1).fillRect(0, 0, W, H);
    this.add.image(W / 2, H * 0.78, 'rock').setScale(2).setAlpha(0.6);
    this.add.text(W / 2, H * 0.26, 'DEEP TROUBLE', { fontFamily: 'monospace', fontSize: 64, color: '#ffd76a', stroke: '#031019', strokeThickness: 8 }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.38, 'The waters off Brinehaven', { fontFamily: 'monospace', fontSize: 22, color: '#bfe9ff' }).setOrigin(0.5);
    const start = this.add.text(W / 2, H * 0.56, 'Press Enter or tap to dive', { fontFamily: 'monospace', fontSize: 24, color: '#ffffff' }).setOrigin(0.5);
    this.tweens.add({ targets: start, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
    this.add.text(W / 2, H * 0.68, 'Move: arrows or WASD   Fire: Space or Z   Pause: Esc   Mute: M', { fontFamily: 'monospace', fontSize: 15, color: '#8fc3dd' }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.73, 'Touch: left stick and FIRE button   Gamepad: stick and A', { fontFamily: 'monospace', fontSize: 15, color: '#8fc3dd' }).setOrigin(0.5);
    this.controls = new Controls(this, { touchUI: false });
    this.input.once('pointerdown', () => { unlockAudio(); this.go(); });
  }

  go() { if (!this.started) { this.started = true; this.scene.start('dive'); } }

  update() {
    if (this.controls.update().confirm) this.go();
  }
}
