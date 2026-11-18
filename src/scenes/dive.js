import { VIEW, WORLD, DIVER, SPEAR, CREATURES, SPAWN, PEARL, REMORA, TORPEDO, DOCK, BONUS, BOXES, BOSS, PACK } from '../config.js';
import { load as loadSave, addPearls } from '../save.js';
import { Controls } from '../controls.js';
import { play, toggleMute, isMuted, music } from '../sfx.js';
import { dress, fitBody, artInfo, plant, framePoint, setBox } from '../art.js';

const TYPES = Object.keys(CREATURES);

export class DiveScene extends Phaser.Scene {
  constructor() { super('dive'); }
  // a dive that sets out from the port shop keeps its running score
  init(data) { this.carryScore = data?.score || 0; }

  create() {
    window.DT.dive = this;
    const sv = this.save = loadSave();
    this.spearDamage = SPEAR.damage + sv.spear;
    this.airMax = DIVER.air + 50 * sv.air;
    this.score = this.carryScore;
    this.health = DIVER.health;
    this.air = this.airMax;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.fireTimer = 0;
    this.invuln = 0;
    this.drownTimer = 0;
    this.bubbleTimer = 0;
    this.paused = false;
    this.over = false;
    this.wasUnder = false;
    // the seaplane that takes you on the bonus flight
    this.planeTimer = BONUS.first;
    this.plane = null;
    this.flying = false;
    // Scarback, the boss: a warning, then the fight; after a win it comes back later, tougher
    this.boss = null;
    this.bossTimer = BOSS.at;
    this.bossLevel = 0;
    this.warnTimer = 0;
    this.victoryPending = false;
    // one bite per barracuda pack: stacked barracuda can't chain hits
    this.packCooldown = 0;

    this.buildWorld();

    this.physics.world.setBounds(0, WORLD.surface - 14, WORLD.w, WORLD.floor - (WORLD.surface - 14));
    this.diver = this.physics.add.sprite(260, WORLD.surface + 60, 'diver').setDepth(10);
    dress(this, this.diver, 'diver');
    this.diver.setCollideWorldBounds(true);
    // the prone diver fills about x 1-31, y 7-20 of its 32x32 frame; keep the box to the torso and legs
    if (artInfo(this, 'diver')) this.diver.body.setSize(26, 12).setOffset(3, 8);
    else this.diver.body.setSize(44, 16).setOffset(6, 4);
    this.diver.on('animationcomplete-diverAttack-anim', () => dress(this, this.diver.setTexture('diver'), 'diver'));
    this.facing = 1;

    this.spears = this.physics.add.group({ allowGravity: false });
    this.enemies = this.physics.add.group({ allowGravity: false });
    this.pearls = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.spears, this.enemies, (s, e) => this.spearHit(s, e));
    this.physics.add.overlap(this.diver, this.enemies, (d, e) => this.diverHit(e));
    this.physics.add.overlap(this.diver, this.pearls, (d, p) => this.collect(p));

    // the Remora, once bought: you start the dive inside it
    this.sub = null;
    this.inSub = false;
    this.subFacing = 1;
    if (sv.remora) {
      const sub = this.sub = this.physics.add.sprite(this.diver.x, this.diver.y + 20, 'remora').setDepth(10);
      dress(this, sub, 'remora');
      sub.setCollideWorldBounds(true);
      fitBody(sub, 0.85, 0.7);
      this.hull = REMORA.hull;
      this.physics.add.overlap(sub, this.enemies, (_, e) => this.subHit(e));
      this.physics.add.overlap(sub, this.pearls, (_, p) => this.inSub && this.collect(p));
      this.setInSub(true, true);
    }

    this.cameras.main.setBounds(0, 0, WORLD.w, WORLD.h).startFollow(this.pc, true, 0.12, 0.12);
    this.burst = this.add.particles(0, 0, 'px', {
      speed: { min: 40, max: 160 }, lifespan: 450, scale: { start: 2, end: 0 }, tint: [0xffffff, 0xffd76a, 0xff8ad8], emitting: false,
    }).setDepth(20);
    this.bubbles = this.add.particles(0, 0, 'bubble', {
      speedY: { min: -70, max: -40 }, speedX: { min: -10, max: 10 }, lifespan: 1600, alpha: { start: 0.9, end: 0 }, emitting: false,
    }).setDepth(9);

    this.controls = new Controls(this, { playAction: true });
    // scene events outlive a restart, so swap rather than stack the listener
    this.events.off('wake');
    this.events.on('wake', (sys, data) => (data?.victory ? this.backFromVictory() : this.backFromBonus(data?.bonus)));
    this.buildHud();
    music('dive');
    // a few creatures waiting out in the water from the start
    for (let i = 0; i < 4; i++) this.spawn(600 + i * 280);
  }

  buildWorld() {
    const g = this.add.graphics().setDepth(-10);
    g.fillGradientStyle(0x9fd8ff, 0x9fd8ff, 0xd9f1ff, 0xd9f1ff, 1).fillRect(0, 0, WORLD.w, WORLD.surface);
    g.fillGradientStyle(0x1673a8, 0x1673a8, 0x041a2c, 0x041a2c, 1).fillRect(0, WORLD.surface, WORLD.w, WORLD.h - WORLD.surface);
    g.fillStyle(0xc9b27a).fillRect(0, WORLD.floor, WORLD.w, WORLD.h - WORLD.floor);
    g.fillStyle(0xe8fbff, 0.7).fillRect(0, WORLD.surface - 2, WORLD.w, 4);
    // light shafts
    g.fillStyle(0xffffff, 0.04);
    for (let x = 100; x < WORLD.w; x += 420) g.fillPoints([{ x, y: WORLD.surface }, { x: x + 90, y: WORLD.surface }, { x: x + 260, y: WORLD.floor }, { x: x + 120, y: WORLD.floor }], true);
    const bed = artInfo(this, 'seabed');
    if (bed) this.add.tileSprite(0, WORLD.floor - 40, WORLD.w / bed.scale, 48, 'seabed').setOrigin(0).setScale(bed.scale).setDepth(-2);
    this.add.image(230, WORLD.surface - 22, 'boat').setDepth(-5);
    const rnd = new Phaser.Math.RandomDataGenerator(['brinehaven']);
    for (let x = 500; x < WORLD.w; x += rnd.between(260, 520)) {
      this.add.image(x, WORLD.floor - 20, 'rock').setScale(rnd.realInRange(0.6, 1.3)).setDepth(-4).setAlpha(0.95);
      for (let i = 0; i < 3; i++) {
        const w = this.add.image(x + rnd.between(-90, 90), WORLD.floor - 40, 'weed').setOrigin(0.5, 1).setDepth(-3);
        w.y = WORLD.floor + 4;
        this.tweens.add({ targets: w, angle: { from: -6, to: 6 }, duration: rnd.between(1400, 2400), yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
    }
  }

  buildHud() {
    const hud = this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(900);
    this.hearts = [];
    for (let i = 0; i < DIVER.health; i++) { const h = this.add.image(20 + i * 22, 22, 'heart'); this.hearts.push(h); hud.add(h); }
    hud.add(this.add.text(14, 38, 'AIR', { fontFamily: 'monospace', fontSize: 14, color: '#cff4ff', stroke: '#000', strokeThickness: 3 }));
    hud.add(this.add.rectangle(50, 46, 160, 12, 0x000000, 0.5).setOrigin(0, 0.5));
    this.airBar = this.add.rectangle(50, 46, 160, 12, 0x58d6ff).setOrigin(0, 0.5);
    hud.add(this.airBar);
    this.scoreText = this.add.text(VIEW.w / 2, 12, 'SCORE 0', { fontFamily: 'monospace', fontSize: 22, color: '#ffd76a', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5, 0);
    this.depthText = this.add.text(14, 58, 'DEPTH 0 m', { fontFamily: 'monospace', fontSize: 14, color: '#cff4ff', stroke: '#000', strokeThickness: 3 });
    hud.add(artInfo(this, 'shopIcons') ? this.add.image(VIEW.w - 170, 24, 'shopIcons', 3).setScale(1.5) : this.add.image(VIEW.w - 170, 24, 'pearl').setScale(1.4));
    this.pearlText = this.add.text(VIEW.w - 156, 13, '0', { fontFamily: 'monospace', fontSize: 20, color: '#f3e9ff', stroke: '#000', strokeThickness: 4 });
    this.hullText = this.add.text(14, 78, '', { fontFamily: 'monospace', fontSize: 14, color: '#ffd76a', stroke: '#000', strokeThickness: 3 });
    this.hint = this.add.text(VIEW.w / 2, VIEW.h - 30, '', { fontFamily: 'monospace', fontSize: 16, color: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
    hud.add([this.pearlText, this.hullText, this.hint]);
    this.msg = this.add.text(VIEW.w / 2, VIEW.h / 2, '', { fontFamily: 'monospace', fontSize: 32, color: '#fff', stroke: '#000', strokeThickness: 6, align: 'center' }).setOrigin(0.5);
    hud.add([this.scoreText, this.depthText, this.msg]);
    // Scarback's health bar, under the score while the fight is on
    const bx = VIEW.w / 2 - 160, by = 52;
    const bar = this.bossBar = this.add.container(0, 0).setVisible(false);
    const barArt = artInfo(this, 'bossBar'), fillArt = artInfo(this, 'bossBarFill');
    if (barArt && fillArt) {
      // Art Dev's metal frame, with the red fill cropped to Scarback's health inside its inset
      const frame = dress(this, this.add.image(bx, by - 6, 'bossBar'), 'bossBar');
      const [fx, fy] = barArt.fill || [14, 3];
      this.bossFill = dress(this, this.add.image(bx + fx * barArt.scale, by - 6 + fy * barArt.scale, 'bossBarFill'), 'bossBarFill');
      bar.add([frame, this.bossFill]);
      bar.add(this.add.text(VIEW.w / 2 + 8, by + 22, 'SCARBACK', { fontFamily: 'monospace', fontSize: 13, color: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 0));
    } else {
      bar.add(this.add.rectangle(bx - 4, by - 4, 328, 22, 0x000000, 0.6).setOrigin(0));
      this.bossFill = this.add.rectangle(bx, by, 320, 14, 0xd9433b).setOrigin(0);
      bar.add(this.bossFill);
      bar.add(this.add.text(VIEW.w / 2, by + 7, 'SCARBACK', { fontFamily: 'monospace', fontSize: 13, color: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5));
    }
    this.warnIcon = dress(this, this.add.sprite(VIEW.w / 2, VIEW.h / 2 - 90, 'bossWarning'), 'bossWarning').setVisible(false);
    if (artInfo(this, 'bossWarning')) this.warnIcon.setScale(this.warnIcon.scaleX * 1.5);
    hud.add([bar, this.warnIcon]);
  }

  flash(text, ms = 900) {
    this.msg.setText(text).setAlpha(1);
    this.tweens.killTweensOf(this.msg);
    if (ms) this.tweens.add({ targets: this.msg, alpha: 0, delay: ms, duration: 300 });
  }

  setPaused(p) {
    this.paused = p;
    if (p) { this.physics.pause(); this.tweens.pauseAll(); this.tweens.killTweensOf(this.msg); this.msg.setText('PAUSED\nEsc, Back, Menu or II to resume').setAlpha(1); }
    else { this.physics.resume(); this.tweens.resumeAll(); this.msg.setText('').setAlpha(0); }
  }

  // whichever body the player is driving right now
  get pc() { return this.inSub ? this.sub : this.diver; }

  spawn(x, type = Phaser.Utils.Array.GetRandom(TYPES)) {
    const d = this.pc;
    const C = CREATURES[type];
    if (x === undefined) {
      const side = Math.random() < 0.5 ? -1 : 1;
      x = d.x + side * (VIEW.w / 2 + 80 + Math.random() * 200);
      if (x < 40 || x > WORLD.w - 40) x = d.x - side * (VIEW.w / 2 + 80);
    }
    x = Phaser.Math.Clamp(x, 40, WORLD.w - 40);
    let y;
    if (type === 'ray') y = WORLD.floor - 40 - Math.random() * 80;
    else if (type === 'crab') y = WORLD.floor - 4;
    else y = WORLD.surface + 90 + Math.random() * (WORLD.floor - WORLD.surface - 180);
    if (Math.abs(x - d.x) < 200 && Math.abs(y - d.y) < 200) return null; // never on top of the diver
    const e = this.enemies.create(x, y, type);
    e.kind = type; e.hp = C.hp; e.baseY = y; e.t = Math.random() * 10; e.dir = x > d.x ? -1 : 1; e.dash = 0; e.rest = 0;
    dress(this, e, type);
    if (!setBox(this, e, type, BOXES[type])) fitBody(e);
    e.setDepth(8);
    return e;
  }

  updateEnemy(e, dt) {
    const C = CREATURES[e.kind], d = this.pc;
    e.t += dt;
    if (e.kind === 'jelly') {
      e.setVelocity(Math.sign(d.x - e.x) * C.speed * 0.4, Math.cos(e.t * 1.6) * 45);
    } else if (e.kind === 'barracuda') {
      const near = Math.abs(d.x - e.x) < 380 && Math.abs(d.y - e.y) < 90;
      if (e.dash > 0) e.dash -= dt;
      else if (e.rest > 0) e.rest -= dt;
      else if (near) { e.dir = Math.sign(d.x - e.x) || 1; e.dash = 0.9; e.rest = 1.4; }
      const sp = e.dash > 0 ? C.speed * 1.9 : C.speed * 0.6;
      e.setVelocity(e.dir * sp, (e.baseY + Math.sin(e.t) * 20 - e.y) * 1.5);
    } else if (e.kind === 'crab') {
      // scuttles along the sand toward the diver when it's close, otherwise wanders
      if (Math.abs(d.x - e.x) < 420) e.dir = Math.sign(d.x - e.x) || e.dir;
      e.setVelocity(e.dir * C.speed, 0);
      e.y = e.baseY;
    } else if (e.kind === 'ray') {
      e.setVelocity(e.dir * C.speed, (e.baseY + Math.sin(e.t * 1.2) * 30 - e.y) * 1.5);
    }
    if (e.x < 30) e.dir = 1; else if (e.x > WORLD.w - 30) e.dir = -1;
    // sprites face right; turn them toward where they swim (jellies and crabs have no front)
    if ((e.kind === 'barracuda' || e.kind === 'ray') && e.flipX !== (e.dir < 0)) {
      plant(this, e.setFlipX(e.dir < 0), e.kind);
      setBox(this, e, e.kind, BOXES[e.kind]);
    }
    if (Math.abs(e.x - d.x) > 1500) e.destroy();
  }

  fire() {
    if (this.inSub) { this.fireTorpedo(); return; }
    const d = this.diver, atk = artInfo(this, 'diverAttack');
    if (!atk) { this.launchSpear(d.x + this.facing * 30, d.y + 2); return; }
    // play the thrust and let the spear leave the muzzle on the fire frame
    d.setTexture('diverAttack'); dress(this, d, 'diverAttack');
    d.off('animationupdate', this._onAtk);
    this._onAtk = (anim, frame) => {
      if (anim.key !== 'diverAttack-anim' || frame.textureFrame !== atk.fireFrame) return;
      d.off('animationupdate', this._onAtk);
      if (this.inSub || this.over) return;
      const m = framePoint(d, atk.muzzle[0], atk.muzzle[1]);
      this.launchSpear(m.x, m.y);
    };
    d.on('animationupdate', this._onAtk);
    d.play('diverAttack-anim');
  }

  launchSpear(x, y) {
    if (this.over) return;
    const d = this.diver;
    const s = this.spears.create(x, y, 'spear');
    dress(this, s, 'spear');
    if (this.facing < 0 && artInfo(this, 'spear')) s.setOrigin(1 - s.originX, s.originY);
    s.setFlipX(this.facing < 0).setVelocityX(this.facing * SPEAR.speed + d.body.velocity.x * 0.3).setDepth(11);
    fitBody(s, 1, 0.8);
    s.life = SPEAR.life;
    s.dmg = this.spearDamage;
    play('spear');
  }

  fireTorpedo() {
    const b = this.sub, f = this.subFacing;
    // leave from the tube under the nose (the art's muzzle pixel), mirrored when the sub faces left
    const mz = artInfo(this, 'remora')?.muzzle;
    const at = mz ? framePoint(b, mz[0], mz[1]) : { x: b.x + f * 40, y: b.y + 8 };
    const t = this.spears.create(at.x, at.y, 'torpedo');
    dress(this, t.setFlipX(f < 0), 'torpedo');
    t.setDepth(11);
    fitBody(t, 1, 0.8);
    t.setVelocityX(f * TORPEDO.speed0 + b.body.velocity.x * 0.5);
    t.setAccelerationX(f * TORPEDO.accel);
    t.setMaxVelocity(TORPEDO.speed, 0);
    t.life = TORPEDO.life;
    t.dmg = TORPEDO.damage;
    t.torpedo = true;
    play('torpedo');
  }

  spearHit(s, e) {
    if (!s.active || !e.active) return;
    s.destroy();
    e.hp -= s.dmg || SPEAR.damage;
    e.setTintFill(0xffffff);
    this.pop(s.x, s.y);
    this.time.delayedCall(70, () => e.active && e.clearTint());
    if (e.hp <= 0) {
      this.score += CREATURES[e.kind].score;
      this.burst.explode(16, e.x, e.y);
      this.dropPearl(e);
      e.destroy();
      play('kill');
    } else play('hit');
  }

  dropPearl(e) {
    const [chance, value] = PEARL.drop[e.kind] || [0, 0];
    if (Math.random() >= chance) return;
    const p = this.pearls.create(e.x, e.y, 'pearl');
    dress(this, p, 'pearl');
    p.value = value; p.life = PEARL.life;
    p.setVelocity(0, PEARL.sink).setDepth(9);
    return p;
  }

  collect(p) {
    if (!p.active || this.over) return;
    const total = addPearls(p.value);
    this.burst.explode(6, p.x, p.y);
    p.destroy();
    play('pearl');
    this.pearlText.setText(String(total));
  }

  subHit(e) {
    if (!this.inSub || this.invuln > 0 || this.over || !e.active) return;
    if (this.packBite(e)) return;
    this.hull = Math.max(0, this.hull - (e.isBoss ? BOSS.hullDamage : CREATURES[e.kind].damage));
    this.invuln = REMORA.hurtInvuln;
    this.cameras.main.shake(150, 0.006);
    play('hurt');
    const away = new Phaser.Math.Vector2(this.sub.x - e.x, this.sub.y - e.y).normalize().scale(DIVER.knockback * 0.7);
    this.sub.setVelocity(away.x, away.y);
    if (this.hull <= 0) {
      // wrecked: the diver bails out and the Remora is gone for the rest of this dive
      this.burst.explode(30, this.sub.x, this.sub.y);
      this.setInSub(false);
      this.sub.destroy();
      this.sub = null;
      this.invuln = DIVER.hurtInvuln;
      this.flash('REMORA WRECKED', 1200);
    }
  }

  // climb in or out of the Remora; the empty sub stays parked where you left it
  setInSub(on, quiet = false) {
    const d = this.diver, b = this.sub;
    if (!b) return;
    this.inSub = on;
    d.setAlpha(1); b.setAlpha(1);
    d.off('animationupdate', this._onAtk);
    if (on) {
      d.setVisible(false); d.body.enable = false; d.setVelocity(0, 0);
      b.setAlpha(1);
    } else {
      d.setVisible(true); d.body.enable = true;
      d.body.reset(b.x, Math.max(WORLD.surface + 10, b.y - 30));
      d.setVelocity(0, -60);
      this.facing = this.subFacing;
      b.setVelocity(0, 0);
    }
    this.cameras.main.startFollow(this.pc, true, 0.12, 0.12);
    if (!quiet) play('board');
  }

  nearDock() { const p = this.pc; return p.y < WORLD.surface + 40 && Math.abs(p.x - DOCK.x) < DOCK.range; }
  nearSub() { return this.sub && !this.inSub && Phaser.Math.Distance.Between(this.diver.x, this.diver.y, this.sub.x, this.sub.y) < REMORA.board; }

  dock() {
    if (this.over) return;
    this.over = true;
    play('board');
    this.scene.start('shop', { score: this.score, from: 'dive' });
  }

  // the seaplane: moors at the surface near you every so often; reach it for the bonus flight
  updatePlane(dt) {
    if (this.over) return;
    const pc = this.pc;
    if (!this.plane) {
      if (this.boss || this.warnTimer > 0 || this.victoryPending) return; // no bonus flights mid-fight
      this.planeTimer -= dt;
      if (this.planeTimer <= 0) this.spawnPlane();
      return;
    }
    const p = this.plane;
    p.life -= dt;
    p.y = WORLD.surface - 10 + Math.sin(this.elapsed * 3) * 3;
    // the last few seconds: it blinks and a LEAVING SOON cue hangs over it
    const leaving = p.life < BONUS.leaving;
    if (leaving) p.setAlpha(Math.sin(this.elapsed * 16) > 0 ? 1 : 0.35);
    if (p.flag) {
      // the pennant rides the wing (it bobs with the plane) and the words float just above it
      const at = framePoint(p, ...(artInfo(this, 'planeLeaving').attach || [22, 3]));
      p.flag.setVisible(leaving).setPosition(at.x, at.y);
      p.cue.setVisible(leaving).setPosition(p.x, at.y - 40 + Math.sin(this.elapsed * 6) * 3);
    } else p.cue.setVisible(leaving).setPosition(p.x, p.y - 44 + Math.sin(this.elapsed * 6) * 3);
    if (p.life <= 0) { this.dropPlane(); this.planeTimer = BONUS.every; return; }
    if (Math.abs(pc.x - p.x) < 70 && pc.y < WORLD.surface + 60) this.startBonus();
  }

  spawnPlane(x) {
    const pc = this.pc;
    if (x === undefined) {
      const side = pc.x > WORLD.w - 700 ? -1 : pc.x < 700 ? 1 : (Math.random() < 0.5 ? -1 : 1);
      x = pc.x + side * Phaser.Math.Between(320, 520);
    }
    x = Phaser.Math.Clamp(x, DOCK.x + DOCK.range + 120, WORLD.w - 80); // never on top of the boat
    const p = this.plane = this.add.sprite(x, WORLD.surface - 10, 'plane').setDepth(6);
    dress(this, p, 'plane');
    p.life = BONUS.moored;
    p.cue = this.add.container(x, p.y - 44).setDepth(30).setVisible(false);
    const flagArt = artInfo(this, 'planeLeaving');
    if (flagArt) {
      // Art Dev's pennant stands on the wing at the plane frame's attach point
      const at = framePoint(p, ...(flagArt.attach || [22, 3]));
      p.flag = dress(this, this.add.sprite(at.x, at.y, 'planeLeaving'), 'planeLeaving').setDepth(7).setVisible(false);
      p.cue.setY(at.y - 44);
    }
    p.cue.add(this.add.text(0, 0, 'LEAVING SOON', { fontFamily: 'monospace', fontSize: 14, color: '#ffd76a', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5));
    this.flash('A SEAPLANE IS MOORED!\nReach it at the surface for a bonus flight', 1600);
    play('board');
    return p;
  }

  dropPlane() { this.plane?.cue?.destroy(); this.plane?.flag?.destroy(); this.plane?.destroy(); this.plane = null; }

  startBonus() {
    if (this.flying || this.over || this.victoryPending || this.boss || this.warnTimer > 0) return;
    this.flying = true;
    this.dropPlane();
    this.spears.clear(true, true);
    this.diver.off('animationupdate', this._onAtk);
    play('board');
    this.scene.launch('bonus', { score: this.score });
    this.scene.sleep();
  }

  backFromBonus(r) {
    this.flying = false;
    this.controls.reset();
    this.planeTimer = BONUS.every;
    // a moment's grace while you find your bearings again
    this.invuln = Math.max(this.invuln, 1.5);
    music(this.boss || this.warnTimer > 0 ? 'boss' : 'dive');
    if (!r) return;
    this.score += r.score;
    this.pearlText.setText(String(loadSave().pearls));
    this.save = loadSave();
    this.flash(`BONUS FLIGHT +${r.score}`, 1200);
  }

  // ---- Scarback, the boss shark ----
  updateBoss(dt) {
    if (this.over || this.victoryPending) return;
    if (!this.boss) {
      if (this.warnTimer > 0) {
        this.warnTimer -= dt;
        // the art blinks on its own; the stand-in triangle flashes
        this.warnIcon.setVisible(artInfo(this, 'bossWarning') ? true : Math.sin(this.elapsed * 10) > -0.2);
        if (this.warnTimer <= 0) { this.warnIcon.setVisible(false); this.spawnBoss(); }
      } else {
        this.bossTimer -= dt;
        if (this.bossTimer <= 0) this.warnBoss();
      }
      return;
    }
    const b = this.boss, p = this.pc;
    b.t += dt;
    const toP = new Phaser.Math.Vector2(p.x - b.x, p.y - b.y);
    const dist = toP.length();
    let vx = b.body.velocity.x, vy = b.body.velocity.y;
    const steer = (tx, ty, sp, k = 2.5) => {
      const d = new Phaser.Math.Vector2(tx - b.x, ty - b.y);
      if (d.length() > sp) d.setLength(sp);
      vx += (d.x * k - vx) * Math.min(1, 4 * dt); vy += (d.y * k - vy) * Math.min(1, 4 * dt);
    };
    if (b.mode === 'enter') {
      steer(p.x, p.y, BOSS.speed * 1.4, 1.2);
      if (dist < 420 || b.t > 4) this.bossMode(b.next === 'circle' ? 'circle' : 'windup');
    } else if (b.mode === 'circle') {
      // slow circle round you at arm's length, then a lunge out of it
      b.ang += dt * 1.1 * b.spin;
      steer(p.x + Math.cos(b.ang) * BOSS.radius, p.y + Math.sin(b.ang) * BOSS.radius * 0.55, BOSS.speed * 2);
      if (b.t > BOSS.circle) this.bossMode('windup');
    } else if (b.mode === 'windup') {
      // pulls back and flashes before it strikes, so you can see it coming
      vx *= Math.exp(-5 * dt); vy *= Math.exp(-5 * dt);
      b.setTint(Math.sin(b.t * 30) > 0 ? 0xff8a6a : 0xffffff);
      b.aim = toP.lengthSq() ? toP.clone().normalize() : new Phaser.Math.Vector2(b.dir, 0);
      if (b.t > BOSS.windup) { b.clearTint(); this.bossMode('lunge'); }
    } else if (b.mode === 'lunge') {
      vx = b.aim.x * BOSS.lungeSpeed; vy = b.aim.y * BOSS.lungeSpeed;
      if (b.t > BOSS.lunge) this.bossMode('rest');
    } else { // rest
      vx *= Math.exp(-2.5 * dt); vy *= Math.exp(-2.5 * dt);
      if (b.t > BOSS.rest) { b.next = b.next === 'circle' ? 'lunge' : 'circle'; this.bossMode(b.next === 'circle' ? 'circle' : 'windup'); }
    }
    // stays in the water, off the sand
    if (b.y < WORLD.surface + 50 && vy < 0) vy = Math.abs(vy) * 0.3;
    if (b.y > WORLD.floor - 40 && vy > 0) vy = -Math.abs(vy) * 0.3;
    if ((b.x < 60 && vx < 0) || (b.x > WORLD.w - 60 && vx > 0)) vx = -vx * 0.3;
    b.setVelocity(vx, vy);
    if (Math.abs(vx) > 20) b.dir = Math.sign(vx);
    if (b.flipX !== (b.dir < 0)) { plant(this, b.setFlipX(b.dir < 0), b.texture.key); setBox(this, b, 'scarback', BOSS.box); }
    b.setAngle(Phaser.Math.Clamp(Math.atan2(vy, Math.abs(vx) + 1) * 30, -20, 20) * b.dir);
  }

  bossHealth(f) {
    const fill = this.bossFill;
    if (fill.type === 'Rectangle') fill.width = 320 * f;
    else fill.setCrop(0, 0, Math.round(fill.frame.realWidth * f), fill.frame.realHeight);
  }

  // Scarback's look: swimming, jaws open on a lunge, a white flash when hit (all share one origin and body)
  bossLook(key) {
    const b = this.boss;
    if (!b || !artInfo(this, key)) return;
    b.setTexture(key, 0);
    plant(this, b, key);
    setBox(this, b, 'scarback', BOSS.box);
    if (key === 'scarback') b.play('scarback-anim');
    else if (key === 'scarbackBite') b.play('scarbackBite-anim');
  }

  bossMode(m) {
    const b = this.boss;
    if (m === 'lunge') this.bossLook('scarbackBite');
    else if (b.mode === 'lunge') this.bossLook('scarback');
    b.mode = m; b.t = 0;
    if (m === 'circle') { b.ang = Math.atan2(b.y - this.pc.y, b.x - this.pc.x); b.spin = Math.random() < 0.5 ? -1 : 1; }
  }

  warnBoss() {
    this.warnTimer = BOSS.warn;
    // a plane still moored when the warning sounds flies off: no bonus flights mid-fight
    if (this.plane) { this.dropPlane(); this.planeTimer = BONUS.every; }
    this.flash('WARNING!\nSCARBACK IS COMING', BOSS.warn * 1000);
    play('warning');
    music('boss');
  }

  spawnBoss() {
    const p = this.pc, side = p.x > WORLD.w - 900 ? -1 : p.x < 900 ? 1 : (Math.random() < 0.5 ? -1 : 1);
    const x = Phaser.Math.Clamp(p.x + side * 640, 80, WORLD.w - 80);
    const y = Phaser.Math.Clamp(p.y, WORLD.surface + 120, WORLD.floor - 100);
    const b = this.boss = this.physics.add.sprite(x, y, 'scarback').setDepth(9);
    dress(this, b, 'scarback');
    b.isBoss = true; b.kind = 'scarback';
    b.hpMax = b.hp = Math.round(BOSS.hp * BOSS.hpGrow ** this.bossLevel);
    b.dir = -side; b.t = 0; b.mode = 'enter'; b.next = 'lunge';
    if (b.dir < 0) plant(this, b.setFlipX(true), 'scarback');
    if (!setBox(this, b, 'scarback', BOSS.box)) fitBody(b, 0.7, 0.6);
    this.bossColliders = [
      this.physics.add.overlap(this.spears, b, (x, y) => this.bossHit(x === b ? y : x)),
      this.physics.add.overlap(this.diver, b, () => this.diverHit(b)),
    ];
    if (this.sub) this.bossColliders.push(this.physics.add.overlap(this.sub, b, () => this.subHit(b)));
    this.bossHealth(1);
    this.bossBar.setVisible(true);
    play('roar');
    return b;
  }

  bossHit(s) {
    const b = this.boss;
    if (!b || !s.active || b.hp <= 0) return;
    s.destroy();
    b.hp = Math.max(0, b.hp - (s.dmg || SPEAR.damage));
    this.bossHealth(b.hp / b.hpMax);
    this.pop(s.x, s.y);
    if (artInfo(this, 'scarbackHurt')) {
      if (b.texture.key !== 'scarbackHurt') {
        b.anims.stop(); b.setTexture('scarbackHurt'); plant(this, b, 'scarbackHurt');
        this.time.delayedCall(100, () => {
          // back to whatever it's doing now (a mode change meanwhile already swapped it back)
          if (this.boss !== b || b.texture.key !== 'scarbackHurt') return;
          if (b.mode === 'lunge') { b.setTexture('scarbackBite', 1); plant(this, b, 'scarbackBite'); }
          else this.bossLook('scarback');
        });
      }
    } else if (b.mode !== 'windup') { b.setTintFill(0xffffff); this.time.delayedCall(70, () => b.active && b.mode !== 'windup' && b.clearTint()); }
    play('bossHit');
    if (b.hp <= 0) this.defeatBoss();
  }

  defeatBoss() {
    const b = this.boss;
    this.bossColliders.forEach((c) => c.destroy());
    this.bossColliders = [];
    this.boss = null;
    this.victoryPending = true;
    b.body.enable = false;
    if (artInfo(this, 'scarbackDefeat')) {
      // belly-up with an X eye, then it sinks away
      b.clearTint().setAngle(0).setTexture('scarbackDefeat', 0); plant(this, b, 'scarbackDefeat');
      b.play('scarbackDefeat-anim');
      this.tweens.add({ targets: b, y: b.y + 120, alpha: 0, delay: 300, duration: 1000, onComplete: () => b.destroy() });
    } else {
      b.setTint(0x888888);
      this.tweens.add({ targets: b, y: b.y + 120, angle: 180 * b.dir, alpha: 0, duration: 1100, onComplete: () => b.destroy() });
    }
    this.burst.explode(40, b.x, b.y);
    this.cameras.main.shake(300, 0.01);
    play('bossDown');
    this.score += BOSS.score;
    this.pearlText.setText(String(addPearls(BOSS.pearls)));
    this.save = loadSave();
    this.bossBar.setVisible(false);
    this.flash('SCARBACK IS BEATEN!', 1100);
    this.time.delayedCall(1200, () => this.openVictory());
  }

  openVictory() {
    if (this.over || this.flying) return;
    this.flying = true; // the dive sleeps under the victory card, as it does under a bonus flight
    this.spears.clear(true, true);
    this.diver.off('animationupdate', this._onAtk);
    this.scene.launch('victory', { score: this.score, level: this.bossLevel + 1, pearls: BOSS.pearls, bonus: BOSS.score });
    this.scene.sleep();
  }

  backFromVictory() {
    this.flying = false;
    this.victoryPending = false;
    this.controls.reset();
    this.bossLevel += 1;
    this.bossTimer = BOSS.again;
    this.invuln = Math.max(this.invuln, 1.5);
    music('dive');
    this.flash('THE DIVE GOES ON', 1000);
  }

  pop(x, y) {
    if (!artInfo(this, 'hit')) return;
    const h = dress(this, this.add.sprite(x, y, 'hit').setDepth(21), 'hit');
    h.play('hit-anim').once('animationcomplete', () => h.destroy());
  }

  // stacked barracuda share one bite: after any of them lands one, the whole pack backs off
  packBite(e) {
    if (e.kind !== 'barracuda') return false;
    if (this.packCooldown > 0) return true;
    this.packCooldown = PACK.cooldown;
    const p = this.pc;
    for (const o of this.enemies.getChildren()) {
      if (o.kind !== 'barracuda' || Phaser.Math.Distance.Between(o.x, o.y, p.x, p.y) > 200) continue;
      o.dash = 0; o.rest = PACK.cooldown; o.dir = Math.sign(o.x - p.x) || 1;
    }
    return false;
  }

  diverHit(e) {
    if (this.inSub || this.invuln > 0 || this.over || !e.active) return;
    if (this.packBite(e)) return;
    this.hurt(e.isBoss ? BOSS.damage : CREATURES[e.kind].damage);
    const away = new Phaser.Math.Vector2(this.diver.x - e.x, this.diver.y - e.y).normalize().scale(DIVER.knockback);
    this.diver.setVelocity(away.x, away.y);
  }

  hurt(n) {
    this.health = Math.max(0, this.health - n);
    this.invuln = DIVER.hurtInvuln;
    this.cameras.main.shake(150, 0.006);
    play('hurt');
    if (this.health <= 0) this.die();
  }

  die() {
    this.over = true;
    play('over');
    this.pc.setTint(0x666666).setVelocity(0, -40);
    this.flash('OUT OF LUCK', 0);
    this.time.delayedCall(600, () => this.scene.start('over', { score: this.score }));
  }

  update(time, deltaMs) {
    const c = this.controls.update();
    if (c.mute) this.flash(toggleMute() ? 'MUTED' : 'SOUND ON', 600);
    // context action: dock at the boat, or board / leave the Remora.
    // E, Y, Fire TV Play/Pause or the touch button always act; Enter (Fire TV Select) acts at a
    // dock or board prompt and otherwise fires, so it never does both.
    let act = null;
    if (!this.over && !this.paused) {
      if (this.nearDock()) act = 'DOCK';
      else if (this.inSub) act = 'EXIT';
      else if (this.nearSub()) act = 'BOARD';
    }
    // Play/Pause acts when there's something to act on, and otherwise pauses (or resumes)
    // (at the boat it pauses too: docking is Select/Enter, E, Y or the touch button)
    const playAct = c.playPause && (act === 'BOARD' || act === 'EXIT');
    if ((c.back || (c.playPause && !playAct)) && !this.over) this.setPaused(!this.paused);
    if (this.paused) return;
    const dt = Math.min(deltaMs, 50) / 1000;
    this.elapsed += dt;
    const prompt = act === 'DOCK' || act === 'BOARD';
    this.controls.setAction(act);
    const touch = this.controls.touchUI?.visible;
    this.hint.setText(act === 'DOCK' ? `${touch ? 'tap DOCK' : 'Enter or E'}: dock at Brinehaven port`
      : act === 'BOARD' ? `${touch ? 'tap BOARD' : 'Enter'}: board the Remora`
      : act === 'EXIT' && !touch ? 'E or Play/Pause: leave the Remora' : '');
    if (act && (c.action || playAct || (prompt && c.enterPressed))) {
      if (act === 'DOCK') { this.dock(); return; }
      this.setInSub(act === 'BOARD');
    }
    if ((c.enter || c.enterPressed) && !prompt) c.fire = true;
    if (this.inSub) this.driveSub(c, dt);
    else this.swim(c, dt);
    const d = this.pc;

    // air drains underwater and refills at the surface (or slowly inside the Remora); at zero it hurts
    const under = d.y > WORLD.surface + 14;
    if (this.inSub) this.air = Math.min(this.airMax, this.air + REMORA.airRefill * dt);
    else if (under) this.air = Math.max(0, this.air - DIVER.airDrain * dt);
    else { this.air = Math.min(this.airMax, this.air + DIVER.airRefill * dt); if (this.wasUnder && !this.over) play('air'); }
    this.wasUnder = under && !this.inSub;
    // three pings once as the air bar turns red
    if (this.air < 25 && !this.lowAir && !this.over) { this.lowAir = true; play('airLow'); }
    else if (this.air > 35) this.lowAir = false;
    if (this.air <= 0 && !this.over) {
      this.drownTimer += dt;
      if (this.drownTimer >= DIVER.drownDamageEvery) { this.drownTimer = 0; this.hurt(1); }
    } else this.drownTimer = 0;

    if (this.invuln > 0) { this.invuln -= dt; d.setAlpha(Math.sin(this.elapsed * 40) > 0 ? 1 : 0.35); } else d.setAlpha(1);
    this.bubbleTimer -= dt;
    if (under && this.bubbleTimer <= 0) { this.bubbles.emitParticleAt(d.x - (this.inSub ? this.subFacing * 36 : -this.facing * 26), d.y - 8, 2); this.bubbleTimer = 0.6; }

    for (const s of this.spears.getChildren().slice()) { s.life -= dt; if (s.life <= 0) s.destroy(); }
    for (const e of this.enemies.getChildren().slice()) this.updateEnemy(e, dt);
    for (const p of this.pearls.getChildren().slice()) {
      p.life -= dt;
      if (p.y >= WORLD.floor - 8) p.setVelocity(0, 0);
      if (p.life < 3) p.setAlpha(Math.sin(this.elapsed * 20) > 0 ? 1 : 0.3);
      if (p.life <= 0) p.destroy();
    }

    this.updatePlane(dt);
    if (this.flying) return;
    this.packCooldown = Math.max(0, this.packCooldown - dt);
    this.updateBoss(dt);

    this.spawnTimer -= dt;
    const cap = this.boss || this.warnTimer > 0 ? 2 : Math.min(SPAWN.max, 4 + Math.floor(this.elapsed / 20));
    if (this.spawnTimer <= 0 && this.enemies.countActive() < cap) { this.spawn(); this.spawnTimer = SPAWN.every; }

    // HUD
    this.hearts.forEach((h, i) => h.setAlpha(i < this.health ? 1 : 0.2));
    this.airBar.width = 160 * (this.air / this.airMax);
    this.airBar.fillColor = this.air < 25 ? (Math.sin(this.elapsed * 12) > 0 ? 0xff4d5e : 0xffb34d) : 0x58d6ff;
    this.scoreText.setText(`SCORE ${this.score}`);
    this.pearlText.setText(String(this.save.pearls));
    this.hullText.setText(this.sub ? `REMORA HULL ${'#'.repeat(this.hull)}${'.'.repeat(REMORA.hull - this.hull)}${this.inSub ? '' : '  (parked)'}` : '');
    this.depthText.setText(`DEPTH ${Math.max(0, Math.round((d.y - WORLD.surface) / 12))} m${isMuted() ? '   MUTED' : ''}`);
  }

  driveSub(c, dt) {
    const b = this.sub;
    if (this.over) { b.body.velocity.scale(Math.exp(-2 * dt)); return; }
    const v = b.body.velocity, damp = Math.exp(-REMORA.water * dt);
    v.x = c.x ? v.x + c.x * REMORA.accel * dt : v.x * damp;
    v.y = c.y ? v.y + c.y * REMORA.accel * dt : v.y * damp;
    const sp = v.length();
    if (sp > REMORA.maxSpeed) v.scale(REMORA.maxSpeed / sp);
    // keep the hull in the water
    if (b.y < WORLD.surface + 22) { b.y = WORLD.surface + 22; if (v.y < 0) v.y = 0; }
    if (c.x > 0.2) this.subFacing = 1; else if (c.x < -0.2) this.subFacing = -1;
    if (b.flipX !== (this.subFacing < 0)) plant(this, b.setFlipX(this.subFacing < 0), b.texture.key);
    b.setAngle(Phaser.Math.Clamp(v.y * 0.04, -10, 10) * this.subFacing);
    this.fireTimer -= dt;
    if (c.fire && this.fireTimer <= 0) { this.fire(); this.fireTimer = TORPEDO.cooldown; }
  }

  swim(c, dt) {
    const d = this.diver;
    // a parked Remora settles and stays put
    if (this.sub && !this.inSub) this.sub.body.velocity.scale(Math.exp(-3 * dt));
    if (!this.over) {
      // our own swim physics: Arcade drag switches off while any acceleration is set,
      // which would let a gentle buoyancy keep the diver sinking forever
      const v = d.body.velocity, damp = Math.exp(-DIVER.water * dt);
      v.x = c.x ? v.x + c.x * DIVER.accel * dt : v.x * damp;
      v.y = c.y ? v.y + c.y * DIVER.accel * dt : v.y * damp - DIVER.buoyancy * dt;
      const sp = v.length();
      if (sp > DIVER.maxSpeed) v.scale(DIVER.maxSpeed / sp);
      if (c.x > 0.2) this.facing = 1; else if (c.x < -0.2) this.facing = -1;
      if (d.flipX !== (this.facing < 0)) plant(this, d.setFlipX(this.facing < 0), d.texture.key);
      d.setAngle(Phaser.Math.Clamp(d.body.velocity.y * 0.06, -14, 14) * this.facing);
      this.fireTimer -= dt;
      if (c.fire && this.fireTimer <= 0) { this.fire(); this.fireTimer = SPEAR.cooldown; }
    } else d.body.velocity.scale(Math.exp(-2 * dt));
  }
}
