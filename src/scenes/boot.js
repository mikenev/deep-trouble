import { CREATURES } from '../config.js';

// Loads any finished sprites listed in assets/manifest.json and draws a placeholder shape
// for every key that isn't there yet, so the game always runs while art is in progress.
export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  preload() {
    this.load.json('manifest', 'assets/manifest.json');
    this.load.on('filecomplete-json-manifest', (key, type, data) => {
      this.registry.set('manifest', data || {});
      for (const [k, info] of Object.entries(data?.sprites || {})) {
        const url = `assets/sprites/${info.file}`;
        if (info.frameWidth) this.load.spritesheet(k, url, { frameWidth: info.frameWidth, frameHeight: info.frameHeight || info.frameWidth });
        else this.load.image(k, url);
      }
    });
    const art = {};
    this.registry.set('art', art);
    this.load.on('filecomplete', (key) => { if (key !== 'manifest') art[key] = true; });
    // a missing manifest or sprite just means we keep the placeholder
    this.load.on('loaderror', (file) => console.warn('[deep-trouble] asset missing, using placeholder:', file.key));
  }

  create() {
    const m = this.registry.get('manifest') || {}, art = this.registry.get('art');
    for (const [k, info] of Object.entries(m.sprites || {})) {
      if (art[k] && info.frames > 1) {
        this.anims.create({ key: `${k}-anim`, frames: this.anims.generateFrameNumbers(k, { start: 0, end: info.frames - 1 }), frameRate: info.fps || 8, repeat: info.once ? 0 : -1 });
      }
    }
    const make = (key, w, h, draw) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      draw(g, w, h);
      g.generateTexture(key, w, h);
      g.destroy();
    };
    // diver, facing right: body, tank, mask and flippers
    make('diver', 56, 24, (g) => {
      g.fillStyle(0x2b2f3a).fillRoundedRect(8, 6, 34, 12, 5);
      g.fillStyle(0xffc531).fillRect(14, 2, 18, 6);
      g.fillStyle(0xf2c9a0).fillCircle(44, 12, 7);
      g.fillStyle(0x7fe3ff).fillRect(45, 8, 6, 5);
      g.fillStyle(0x1d6fd6).fillTriangle(0, 4, 10, 10, 0, 12).fillTriangle(0, 14, 10, 14, 0, 22);
    });
    make('spear', 26, 4, (g) => {
      g.fillStyle(0xd8dde6).fillRect(0, 1, 20, 2);
      g.fillStyle(0xffffff).fillTriangle(20, 0, 26, 2, 20, 4);
    });
    const [jw, jh] = CREATURES.jelly.size;
    make('jelly', jw, jh, (g, w) => {
      g.fillStyle(0xf28ad8, 0.9).fillEllipse(w / 2, 11, w, 22);
      g.lineStyle(2, 0xf7b8ea, 0.9);
      for (let i = 0; i < 4; i++) { const x = 7 + i * 7; g.lineBetween(x, 18, x + (i % 2 ? 3 : -3), jh); }
    });
    const [bw, bh] = CREATURES.barracuda.size;
    make('barracuda', bw, bh, (g) => {
      g.fillStyle(0x9fb4c4).fillEllipse(bw / 2 - 4, bh / 2, bw - 14, bh - 6);
      g.fillStyle(0x6c8496).fillTriangle(0, 2, 12, bh / 2, 0, bh - 2);
      g.fillStyle(0x222222).fillCircle(bw - 16, bh / 2 - 2, 2);
      g.fillStyle(0xffffff).fillTriangle(bw - 12, bh / 2 + 1, bw, bh / 2 + 2, bw - 12, bh / 2 + 4);
    });
    const [rw, rh] = CREATURES.ray.size;
    make('ray', rw, rh, (g) => {
      g.fillStyle(0x6e5a8a).fillTriangle(rw * 0.45, 0, rw, rh / 2, rw * 0.45, rh).fillTriangle(rw * 0.45, 0, 8, rh / 2, rw * 0.45, rh);
      g.lineStyle(3, 0x4a3c5e).lineBetween(0, rh / 2, 12, rh / 2);
      g.fillStyle(0xffe08a).fillCircle(rw * 0.7, rh / 2 - 4, 2).fillCircle(rw * 0.7, rh / 2 + 4, 2);
    });
    const [cw, ch] = CREATURES.crab.size;
    make('crab', cw, ch, (g) => {
      g.fillStyle(0xbc3424).fillEllipse(cw / 2, ch / 2 + 2, cw - 8, ch - 8);
      g.fillStyle(0xe06c40).fillCircle(5, 6, 5).fillCircle(cw - 5, 6, 5);
      g.lineStyle(2, 0x781c16);
      for (let i = 0; i < 3; i++) { g.lineBetween(8 + i * 5, ch - 6, 4 + i * 5, ch); g.lineBetween(cw - 8 - i * 5, ch - 6, cw - 4 - i * 5, ch); }
    });
    make('boat', 140, 50, (g) => {
      g.fillStyle(0xb5562e).fillPoints([{ x: 0, y: 20 }, { x: 140, y: 20 }, { x: 120, y: 50 }, { x: 18, y: 50 }], true);
      g.fillStyle(0xf1e3c6).fillRect(48, 0, 44, 20);
      g.fillStyle(0x3d6b8f).fillRect(56, 5, 10, 8).fillRect(74, 5, 10, 8);
    });
    make('bubble', 8, 8, (g) => { g.lineStyle(1, 0xcff4ff, 0.8).strokeCircle(4, 4, 3); });
    make('rock', 160, 70, (g) => {
      g.fillStyle(0x2c3b45).fillEllipse(80, 50, 160, 60);
      g.fillStyle(0x3a4d59).fillEllipse(60, 38, 80, 40);
    });
    make('weed', 20, 90, (g) => {
      g.lineStyle(4, 0x2f8f5a);
      for (let y = 0; y < 90; y += 10) g.lineBetween(10 + (y % 20 ? 4 : -4), y, 10 + (y % 20 ? -4 : 4), y + 10);
    });
    make('heart', 16, 14, (g) => {
      g.fillStyle(0xff4d5e).fillCircle(4, 4, 4).fillCircle(12, 4, 4).fillTriangle(0, 5, 16, 5, 8, 14);
    });
    // M2 placeholders: tide pearl, the Remora and its torpedo
    make('pearl', 14, 14, (g) => {
      g.fillStyle(0xf3e9ff).fillCircle(7, 7, 6);
      g.fillStyle(0xd7c4f0).fillCircle(8, 9, 3);
      g.fillStyle(0xffffff).fillCircle(5, 4, 2);
    });
    make('remora', 76, 34, (g) => {
      g.fillStyle(0xe8a92a).fillEllipse(36, 19, 64, 26);
      g.fillStyle(0xc4861a).fillRect(26, 2, 18, 10);
      g.fillStyle(0x9fe6ff).fillCircle(54, 17, 6);
      g.lineStyle(2, 0x5a3a08).strokeCircle(54, 17, 6);
      g.fillStyle(0x5a3a08).fillRect(0, 14, 6, 10);
      g.fillStyle(0x8a93a0).fillTriangle(2, 8, 8, 19, 2, 30);
      g.fillStyle(0x2b2f3a).fillRect(58, 26, 14, 4);
    });
    make('torpedo', 26, 8, (g) => {
      g.fillStyle(0x6c7a86).fillRoundedRect(2, 1, 22, 6, 3);
      g.fillStyle(0xff6a3d).fillRect(19, 1, 5, 6);
      g.fillStyle(0x3a444c).fillTriangle(0, 0, 5, 4, 0, 8);
    });
    // M3 placeholders: the seaplane, its bomb, a jellyfish floating on the surface and a splash
    make('plane', 72, 30, (g) => {
      g.fillStyle(0xe8e2d0).fillEllipse(34, 13, 58, 14);
      g.fillStyle(0xc0392b).fillRect(20, 4, 30, 5).fillTriangle(0, 4, 10, 13, 0, 17);
      g.fillStyle(0x9fe6ff).fillRect(44, 8, 8, 5);
      g.fillStyle(0x555b66).fillRect(64, 6, 3, 14);
      g.lineStyle(2, 0x555b66).lineBetween(22, 19, 18, 26).lineBetween(44, 19, 48, 26);
      g.fillStyle(0xf1e3c6).fillRoundedRect(10, 25, 50, 5, 2);
    });
    make('bomb', 12, 18, (g) => {
      g.fillStyle(0x2b2f3a).fillEllipse(6, 11, 10, 14);
      g.fillStyle(0x6c7a86).fillTriangle(1, 0, 11, 0, 6, 6);
    });
    make('jellySurface', 40, 22, (g) => {
      g.fillStyle(0xf28ad8, 0.95).fillEllipse(20, 12, 38, 20);
      g.fillStyle(0xf7b8ea).fillEllipse(14, 8, 10, 5);
    });
    make('splash', 40, 30, (g) => {
      g.fillStyle(0xe8fbff, 0.9).fillTriangle(4, 30, 12, 4, 18, 30).fillTriangle(14, 30, 20, 0, 26, 30).fillTriangle(22, 30, 30, 6, 36, 30);
    });
    // M4 placeholders: Scarback (a big scarred shark, facing right), the warning sign and the title card
    make('scarback', 150, 60, (g) => {
      g.fillStyle(0x5d6b78).fillEllipse(78, 32, 120, 40);
      g.fillStyle(0x4a5662).fillTriangle(0, 8, 26, 32, 0, 56).fillTriangle(60, 14, 82, 0, 90, 16);
      g.fillStyle(0xd9dde2).fillEllipse(90, 42, 80, 14);
      g.lineStyle(2, 0xe8c2b8).lineBetween(70, 20, 96, 30).lineBetween(76, 16, 100, 26);
      g.fillStyle(0x111111).fillCircle(122, 26, 3);
      g.fillStyle(0xffffff).fillTriangle(118, 40, 138, 38, 124, 44);
    });
    make('bossWarning', 64, 56, (g) => {
      g.fillStyle(0xffd23d).fillTriangle(32, 0, 64, 56, 0, 56);
      g.fillStyle(0x111111).fillRect(29, 16, 6, 22).fillRect(29, 43, 6, 6);
    });
    make('title', 480, 150, (g) => {
      g.fillStyle(0x031019, 0.75).fillRoundedRect(0, 0, 480, 150, 14);
      g.lineStyle(4, 0xffd76a).strokeRoundedRect(4, 4, 472, 142, 12);
    });
    make('px', 2, 2, (g) => { g.fillStyle(0xffffff).fillRect(0, 0, 2, 2); });
    this.scene.start('title');
  }
}
