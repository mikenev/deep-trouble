import { VIEW } from './config.js';
import { BootScene } from './scenes/boot.js';
import { TitleScene } from './scenes/title.js';
import { DiveScene } from './scenes/dive.js';
import { OverScene } from './scenes/over.js';
import { ShopScene } from './scenes/shop.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: VIEW.w,
  height: VIEW.h,
  backgroundColor: '#04121f',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
  input: { gamepad: true, activePointers: 4 },
  scene: [BootScene, TitleScene, DiveScene, OverScene, ShopScene],
});
// handle for automated tests
window.DT = { game };
