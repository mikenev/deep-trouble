import { Controls } from '../controls.js';
import { music } from '../sfx.js';

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
    this.again = this.add.text(W / 2, H * 0.6, '...', { fontFamily: 'monospace', fontSize: 22, color: '#bfe9ff' }).setOrigin(0.5);
    this.controls = new Controls(this, { touchUI: false });
    // input lockout: a held fire, Space, Enter, pad A or finger from the dive must not restart it.
    // Wait a moment, then for every button to be let go, and only then take a fresh press.
    this.ready = false;
    this.waited = false;
    this.time.delayedCall(400, () => { this.waited = true; });
    this.input.on('pointerdown', () => this.go());
    music('over');
  }

  arm() {
    this.ready = true;
    this.again.setText('Enter or tap: dive again     Esc: title and port shop');
    this.tweens.add({ targets: this.again, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
  }

  go() { if (this.ready && !this.left) { this.left = true; this.scene.start('dive'); } }

  update() {
    const c = this.controls.update();
    if (!this.ready) { if (this.waited && !c.held) this.arm(); return; }
    if (c.confirm) this.go();
    if (c.back && this.ready && !this.left) { this.left = true; this.scene.start('title'); }
  }
}
