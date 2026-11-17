# Deep Trouble

An original side-view diving action game for the browser, built with Phaser 3 as a plain static site (no build step).

## Run it

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000/ in a browser.

## Controls

- Move: arrow keys or WASD, the on-screen stick on touch screens, or a gamepad stick or D-pad
- Fire spear: Space or Z, the FIRE button, or gamepad A
- Start / confirm: Enter or a tap
- Pause / back: Esc or Backspace (Fire TV Back and Menu work too)
- Mute: M (saved between visits)

Surface to refill your air before it runs out.

## Credits

- [Phaser 3](https://phaser.io/) 3.90.0, vendored under `vendor/phaser/` (MIT license, see `vendor/phaser/LICENSE.md`)
- Sprites in `assets/sprites/` are original pixel art by Art Dev for this game; any sprite that's missing falls back to a built-in placeholder shape
