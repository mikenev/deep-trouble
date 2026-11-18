import { VIEW, BONUS } from '../config.js';
import { addPearls } from '../save.js';
import { Controls } from '../controls.js';
import { play, toggleMute, isMuted } from '../sfx.js';
import { dress, artInfo, framePoint, plant } from '../art.js';

// The seaplane bonus flight: fly over the shipping lane and bomb the jellyfish floating on it.
// Runs on top of the sleeping dive and wakes it with the result when the card is dismissed.
export class BonusScene extends Phaser.Scene {
  constructor() { super('bonus'); }
  init() { this.left = false; }

  create() {
    window.DT.bonus = this;
    const W = VIEW.w, H = VIEW.h;
    this.timeLeft = BONUS.time;
    this.bombed = 0;
    this.score = 0;
    this.pearls = 0;
    this.dropTimer = 0;
    this.paused = false;
    this.done = false;
    this.armed = false;
    this.facing = 1;
    this.elapsed = 0;
    this.vx = 0;
    // the physics world and tweens outlive a stopped scene, and end() paused them last time
    this.physics.resume();
    this.tweens.resumeAll();

    // sky and sea: Art Dev's backdrop scaled to the screen height and tiled across, or a drawn one
    const bg = artInfo(this, 'skysea');
    if (bg) {
      const src = this.textures.get('skysea').getSourceImage();
      const k = H / src.height;
      this.sky = this.add.tileSprite(0, 0, W / k, src.height, 'skysea').setOrigin(0).setScale(k);
      this.sea = Math.round((bg.sea ?? src.height * 0.62) * k);
    } else {
      this.sea = 360;
      const g = this.add.graphics();
      g.fillGradientStyle(0x7cc6ff, 0x7cc6ff, 0xd8f0ff, 0xd8f0ff, 1).fillRect(0, 0, W, this.sea);
      g.fillGradientStyle(0x1d86c2, 0x1d86c2, 0x0a3557, 0x0a3557, 1).fillRect(0, this.sea, W, H - this.sea);
      g.fillStyle(0xe8fbff, 0.8).fillRect(0, this.sea - 2, W, 4);
      g.fillStyle(0xffffff, 0.9);
      for (const [x, y, r] of [[140, 70, 26], [176, 62, 32], [212, 72, 24], [640, 120, 22], [672, 112, 30], [704, 122, 20]]) g.fillCircle(x, y, r);
    }

    this.plane = this.add.sprite(W / 2, BONUS.planeY, 'plane').setDepth(10);
    dress(this, this.plane, 'plane');
    this.bombs = this.physics.add.group({ allowGravity: false });
    this.jellies = this.physics.add.group({ allowGravity: false });
    for (let i = 0; i < BONUS.jellies; i++) this.addJelly(80 + i * ((W - 160) / (BONUS.jellies - 1)));
    this.physics.add.overlap(this.bombs, this.jellies, (b, j) => this.bombHit(b, j));

    const st = { fontFamily: 'monospace', color: '#fff', stroke: '#000', strokeThickness: 4 };
    this.add.text(W / 2, 12, 'BONUS FLIGHT', { ...st, fontSize: 22, color: '#ffd76a' }).setOrigin(0.5, 0).setDepth(900);
    this.timeText = this.add.text(14, 12, '', { ...st, fontSize: 20 }).setDepth(900);
    this.countText = this.add.text(14, 40, '', { ...st, fontSize: 16, color: '#f3e9ff' }).setDepth(900);
    this.hint = this.add.text(W / 2, H - 28, 'Fire drops a bomb: hit the jellyfish on the water', { ...st, fontSize: 16 }).setOrigin(0.5).setDepth(900);
    this.msg = this.add.text(W / 2, H / 2 - 40, '', { ...st, fontSize: 30, strokeThickness: 6, align: 'center' }).setOrigin(0.5).setDepth(950);
    this.controls = new Controls(this);
    this.input.on('pointerdown', () => { if (this.armed) this.finish(); });
  }

  addJelly(x) {
    const j = this.jellies.create(x ?? Phaser.Math.Between(60, VIEW.w - 60), this.sea, 'jellySurface');
    dress(this, j, 'jellySurface');
    const a = artInfo(this, 'jellySurface');
    // the hit box is the bell floating on the water
    if (a?.body) j.body.setSize(a.body[2], a.body[3], false).setOffset(a.body[0], a.body[1]);
    else j.body.setSize(j.frame.realWidth * 0.85, j.frame.realHeight * 0.7);
    j.vx = (Math.random() < 0.5 ? -1 : 1) * Phaser.Math.Between(25, 70);
    j.t = Math.random() * 6;
    j.setDepth(6);
    j.body.moves = false; // we float it ourselves; the body follows the sprite
    return j;
  }

  dropBomb() {
    if (this.bombs.countActive() >= BONUS.maxBombs) return false;
    const p = this.plane, a = artInfo(this, 'plane');
    const at = a?.drop ? framePoint(p, a.drop[0], a.drop[1]) : { x: p.x, y: p.y + 14 };
    const b = this.bombs.create(at.x, at.y, 'bomb');
    dress(this, b, 'bomb');
    b.setDepth(9);
    b.body.setSize(b.frame.realWidth * 0.8, b.frame.realHeight * 0.8);
    b.setVelocity(this.vx * 0.55, 40);
    b.setAccelerationY(BONUS.bombGravity);
    play('torpedo');
    return b;
  }

  splash(x, y) {
    if (artInfo(this, 'splash') && this.anims.exists('splash-anim')) {
      const s = dress(this, this.add.sprite(x, y, 'splash').setDepth(12), 'splash');
      s.play('splash-anim').once('animationcomplete', () => s.destroy());
    } else {
      const s = this.add.image(x, y, 'splash').setDepth(12);
      this.tweens.add({ targets: s, scaleY: 1.6, alpha: 0, duration: 420, onComplete: () => s.destroy() });
    }
  }

  bombHit(b, j) {
    if (!b.active || !j.active || this.done) return;
    this.splash(j.x, this.sea);
    b.destroy();
    j.destroy();
    this.bombed++;
    this.score += BONUS.jellyScore;
    if (this.bombed % BONUS.pearlEvery === 0) this.pearls++;
    play('kill');
    // another one drifts in from the edge so the lane never runs dry
    this.time.delayedCall(700, () => { if (!this.done) this.addJelly(Math.random() < 0.5 ? 30 : VIEW.w - 30); });
  }

  setPaused(p) {
    this.paused = p;
    if (p) { this.physics.pause(); this.tweens.pauseAll(); this.msg.setText('PAUSED\nEsc, Back, Menu or II to resume'); }
    else { this.physics.resume(); this.tweens.resumeAll(); this.msg.setText(''); }
  }

  // time's up: tally the run on a results card
  end() {
    this.done = true;
    if (this.bombed >= BONUS.sharp) this.pearls += BONUS.sharpPearls;
    this.physics.pause();
    this.bombs.clear(true, true);
    this.hint.setText('');
    const W = VIEW.w, H = VIEW.h;
    const card = this.card = this.add.container(W / 2, H / 2).setDepth(960);
    card.add(this.add.rectangle(0, 0, 520, 280, 0x04121f, 0.92).setStrokeStyle(3, 0xffd76a));
    const st = { fontFamily: 'monospace', color: '#fff', align: 'center' };
    card.add(this.add.text(0, -100, 'FLIGHT LOG', { ...st, fontSize: 30, color: '#ffd76a' }).setOrigin(0.5));
    const sharp = this.bombed >= BONUS.sharp ? `\nSharp shooting! +${BONUS.sharpPearls} pearls` : '';
    this.resultText = this.add.text(0, -10, `Jellyfish bombed  ${this.bombed}\nTide pearls  +${this.pearls}\nScore  +${this.score}${sharp}`, { ...st, fontSize: 22, lineSpacing: 8 }).setOrigin(0.5);
    card.add(this.resultText);
    this.backText = this.add.text(0, 104, '...', { ...st, fontSize: 18, color: '#bfe9ff' }).setOrigin(0.5);
    card.add(this.backText);
    if (this.pearls) addPearls(this.pearls);
    play('buy');
    // a held fire button mustn't skip the card: wait a moment, then for every button to be let go
    this.waited = false;
    this.time.delayedCall(900, () => { this.waited = true; });
  }

  finish() {
    if (!this.done || !this.armed || this.left) return;
    this.left = true;
    this.scene.wake('dive', { bonus: { score: this.score, pearls: this.pearls, bombed: this.bombed } });
    this.scene.stop();
  }

  update(time, deltaMs) {
    const c = this.controls.update();
    if (c.mute) this.hint.setText(toggleMute() ? 'MUTED' : 'SOUND ON');
    if (this.done) {
      if (!this.armed && this.waited && !c.held) { this.armed = true; this.backText.setText('Enter or tap: back to the dive'); }
      if (this.armed && (c.confirm || c.back)) this.finish();
      return;
    }
    if (c.back) this.setPaused(!this.paused);
    if (this.paused) return;
    const dt = Math.min(deltaMs, 50) / 1000;
    this.elapsed += dt;
    this.timeLeft = Math.max(0, this.timeLeft - dt);

    // fly: left and right across the lane, with a little bob
    const p = this.plane;
    this.vx = c.x * BONUS.planeSpeed;
    p.x = Phaser.Math.Clamp(p.x + this.vx * dt, 40, VIEW.w - 40);
    p.y = BONUS.planeY + Math.sin(this.elapsed * 2.4) * 6;
    if (c.x > 0.2) this.facing = 1; else if (c.x < -0.2) this.facing = -1;
    if (p.flipX !== (this.facing < 0)) plant(this, p.setFlipX(this.facing < 0), 'plane');
    p.setAngle(c.x * 6);
    if (this.sky) this.sky.tilePositionX += (12 + this.vx * 0.05) * dt;

    this.dropTimer -= dt;
    if ((c.firePressed || c.enterPressed || c.fire || c.enter) && this.dropTimer <= 0) { if (this.dropBomb()) this.dropTimer = BONUS.bombCooldown; }

    for (const b of this.bombs.getChildren().slice()) {
      if (b.y >= this.sea + 8) { this.splash(b.x, this.sea); b.destroy(); play('hit'); }
    }
    for (const j of this.jellies.getChildren()) {
      j.t += dt;
      j.x += j.vx * dt;
      if (j.x < 30) j.vx = Math.abs(j.vx); else if (j.x > VIEW.w - 30) j.vx = -Math.abs(j.vx);
      j.y = this.sea + Math.sin(j.t * 2) * 3;
    }

    this.timeText.setText(`TIME ${Math.ceil(this.timeLeft)}${isMuted() ? '   MUTED' : ''}`);
    this.countText.setText(`JELLIES ${this.bombed}   PEARLS +${this.pearls}`);
    if (this.timeLeft <= 0) this.end();
  }
}
