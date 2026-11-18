import { Controls } from '../controls.js';
import { music, play } from '../sfx.js';
import { artInfo, dress } from '../art.js';

const BEST = 'deeptrouble.best';

// The card after Scarback goes down: the run's score so far, then back into the same dive
// (Scarback returns later, tougher) or, with Back, end the run at the title.
export class VictoryScene extends Phaser.Scene {
  constructor() { super('victory'); }
  init(data) { this.result = data || {}; this.left = false; this.ready = false; this.waited = false; }

  create() {
    window.DT.victory = this;
    const { width: W, height: H } = this.scale, r = this.result;
    this.add.graphics().fillGradientStyle(0x0b3a5c, 0x0b3a5c, 0x02101c, 0x02101c, 1).fillRect(0, 0, W, H);
    const shark = this.add.sprite(W / 2, H * 0.24, 'scarback').setAngle(180).setAlpha(0.85);
    // belly-up with its X eye (Art Dev's defeat frame), or the swim frame turned over
    if (artInfo(this, 'scarbackDefeat')) { shark.setTexture('scarbackDefeat', 1).setAngle(0); dress(this, shark, 'scarbackDefeat'); shark.setFrame(1); }
    else if (artInfo(this, 'scarback')) dress(this, shark, 'scarback').setFlipY(true).setAngle(0);
    else shark.setScale(1.4);
    this.add.text(W / 2, H * 0.42, 'SCARBACK IS BEATEN!', { fontFamily: 'monospace', fontSize: 42, color: '#ffd76a', stroke: '#000', strokeThickness: 7 }).setOrigin(0.5);
    const times = r.level > 1 ? `  (${r.level} times this run)` : '';
    this.add.text(W / 2, H * 0.54, `+${r.bonus || 0} score   +${r.pearls || 0} tide pearls${times}`, { fontFamily: 'monospace', fontSize: 20, color: '#f3e9ff' }).setOrigin(0.5);
    this.scoreText = this.add.text(W / 2, H * 0.64, `Run score ${r.score || 0}`, { fontFamily: 'monospace', fontSize: 30, color: '#fff', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);
    this.again = this.add.text(W / 2, H * 0.8, '...', { fontFamily: 'monospace', fontSize: 20, color: '#bfe9ff' }).setOrigin(0.5);
    try { if ((r.score || 0) > Number(localStorage.getItem(BEST) || 0)) localStorage.setItem(BEST, String(r.score)); } catch { /* private mode */ }
    this.controls = new Controls(this, { touchUI: false });
    // same lockout as game over: a held fire button from the fight mustn't skip the card
    this.time.delayedCall(700, () => { this.waited = true; });
    this.input.on('pointerdown', () => this.cont());
    music('victory');
    play('victory');
  }

  arm() {
    this.ready = true;
    this.again.setText('Enter or tap: keep diving     Esc: end the run');
    this.tweens.add({ targets: this.again, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
  }

  cont() {
    if (!this.ready || this.left) return;
    this.left = true;
    this.scene.wake('dive', { victory: true });
    this.scene.stop();
  }

  quit() {
    if (!this.ready || this.left) return;
    this.left = true;
    this.scene.stop('dive');
    this.scene.start('title');
  }

  update() {
    const c = this.controls.update();
    if (!this.ready) { if (this.waited && !c.held) this.arm(); return; }
    if (c.confirm) this.cont();
    else if (c.back) this.quit();
  }
}
