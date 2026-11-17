# Deep Trouble — M1 art

Original pixel art for the M1 dive-and-combat slice. NES-arcade in spirit (limited palette, 16 px grid, 1 px outlines, no anti-aliasing). Nothing here is taken or styled from any film or commercial sprite sheet.

Game resolution used for the backdrop: **256×240**. Sprites sit on a 16 px grid and have transparent backgrounds. Sheets are horizontal strips, uniform frame size, no padding.

Drawn pixel-by-pixel with Python/Pillow. All assets face **right**; flip in code for left.

## Files

| File | Frame size | Frames | Suggested FPS | Origin (px from top-left) | Notes |
|---|---|---|---|---|---|
| `DT_Diver_Swim.png` | 32×32 | 4 | 8 | 16, 18 | Dolphin-kick swim cycle. Origin is the torso, slightly below centre so fins hang correctly. |
| `DT_Diver_Attack.png` | 32×32 | 3 | 12 | 16, 18 | Spear-gun thrust: cock, full extend, follow-through. Same origin as the swim sheet so the body stays planted. One-shot; return to swim when it ends. |
| `DT_Jellyfish.png` | 16×24 | 2 | 5 | 8, 8 | Pulse (open bell / contracted bell). Origin is the centre of the bell, not the tentacles, so it hangs from the body. |
| `DT_Crab.png` | 16×16 | 2 | 7 | 8, 13 | Seabed scuttle, 3/4 view. Origin at the feet so it sits on the sand. |
| `DT_Stingray.png` | 32×16 | 2 | 7 | 18, 8 | Wing beat, snout faces right, tail to the left. Origin is the body centre, a little toward the snout. |
| `DT_Spear.png` | 16×8 | 1 | — | 1, 4 | Spear-gun projectile, tip on the right. Origin at the rear-centre so it spawns at the muzzle and extends forward. |
| `DT_Hit.png` | 16×16 | 4 | 14 | 8, 8 | Hit / burst, play once on contact. Origin at the centre of the flash. |
| `DT_Backdrop.png` | 256×240 | 1 | — | 0, 0 | Full-screen water column: dithered depth gradient, surface shimmer, light rays. No seabed — overlay `DT_Seabed.png`. |
| `DT_Seabed.png` | 128×48 | 1 | — | 0, 0 | Seamlessly tiles on X. Use as a Phaser `tileSprite` along the bottom (suggested y = 240 − 48 = 192). |
| `preview.png` | — | — | — | — | 4× nearest-neighbour contact sheet and a mock dive scene, for review only. Not a game asset. |

Phaser 3 example:

```js
this.load.spritesheet('diverSwim', 'assets/DT_Diver_Swim.png', { frameWidth: 32, frameHeight: 32 });
this.anims.create({ key: 'diver-swim', frames: this.anims.generateFrameNumbers('diverSwim', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
// sprite origin: diver.setOrigin(16 / 32, 18 / 32);
```

## Palette

A shared 16-bit-era set. Unique colours used across these files:

**Ink and water**
- `#080C16` ink / outline
- `#081028` deepest water
- `#0B1634` deep water
- `#102248` mid-deep
- `#14305C` mid
- `#1A4270` mid-light
- `#205684` light
- `#2A6C96` upper water
- `#3A84A8` near-surface
- `#4E9EBA` surface
- `#60B0C8` / `#8CCCCC` light rays (mixed into the water)
- `#A8D8E6` foam / shimmer
- `#C8E8F0` / `#F0F8FC` bubbles

**Seabed**
- `#3A2816` `#5C401E` `#8A6630` `#B8944A` `#DCC070` `#E8D896` sand (dark → rim)
- `#1C4028` `#306C3E` `#5AA84E` seaweed
- `#4A4640` `#78746C` pebbles
- `#C8B094` `#E8D8BC` shell

**Diver**
- `#103A32` `#206E52` `#3EB078` teal wetsuit
- `#B06038` `#E0A068` skin
- `#20242C` mask frame, `#5AB0C8` / `#D0F0F8` glass
- `#3A4048` `#8C949C` `#D8DEE2` tank
- `#B06C10` `#E0AC20` `#F8E058` amber fins
- `#482814` `#BC4828` `#E8A848` rust spear
- `#483C30` hose

**Creatures and FX**
- Jellyfish rose: `#782858` `#C4508C` `#E890BC` `#F8D0E4` `#F8E8F0` `#B04888`
- Crab copper: `#781C16` `#BC3424` `#E06C40` `#F0B070` plus `#F0E0A0` / `#181010` eyes
- Stingray slate: `#282840` `#4A4A6C` `#707094` `#A8A8C4` with `#D8BC78` spots
- Hit burst: `#F8F8EC` `#70E0EC` `#F8E050` `#F07038`

## Integration notes

- Art only. No game code is included.
- The backdrop does not include the boat or a surface vessel — M1 is the dive itself.
- Light is painted as if it comes from the surface (above). The sprites read best unlit / at true colour.
- The attack sheet is 3 frames. Frame 1 is the contact / fully extended pose.
- Tails and tentacles are already inside each frame; no extra padding is required.
- If the game canvas is 16:9 (e.g. 320×180), letterbox or crop the 256×240 backdrop, or repeat the water columns and keep the 16 px grid.

## Preview

`preview.png` shows a mock scene (diver, spear, three creatures, hit burst, tiled seabed over the backdrop) and every sheet at 4× nearest-neighbour on a dark field.
