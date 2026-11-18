import { Controls } from '../controls.js';

const BEST = 'deeptrouble.best';

export class OverScene extends Phaser.Scene {
  constructor() { super('over'); }
  init(data) { this.result = data || { score: 0 }; this.left = false; this.ready = false; }

  create() {
    const { width: W, height: H } = this.scale;
    let best = 0;
    try { best = Number(localStorage.getItem(BEST) || 0); } catch { /* private mode */ }
    const score = this.result.score || 0;
    if (score > best) { best = score; try { localStorage.setItem(BEST, String(best)); } catch { /* ignore */ } }
    this.add.graphics().fillGradientStyle(0x062238, 0x062238, 0x01070d, 0x01070d, 1).fillRect(0, 0, W, H);
    this.add.text(W / 2, H * 0.3, 'THE DEEP WINS THIS TIME', { fontFamily: 'monospace', fontSize: 40, color: '#ff8a6a', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.45, `Score ${score}    Best ${best}`, { fontFamily: 'monospace', fontSize: 26, color: '#fff' }).setOrigin(0.5);
    const again = this.add.text(W / 2, H * 0.6, 'Enter or tap: dive again     Esc: title and port shop', { fontFamily: 'monospace', fontSize: 22, color: '#bfe9ff' }).setOrigin(0.5);
    this.tweens.add({ targets: again, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
    this.controls = new Controls(this, { touchUI: false });
    // short delay so a held fire button from the dive doesn't skip this screen
    this.ready = false;
    this.time.delayedCall(700, () => { this.ready = true; this.input.once('pointerdown', () => this.go()); });
  }

  go() { if (this.ready && !this.left) { this.left = true; this.scene.start('dive'); } }

  update() {
    const c = this.controls.update();
    if (c.confirm) this.go();
    if (c.back && this.ready) { this.left = true; this.scene.start('title'); }
  }
}
