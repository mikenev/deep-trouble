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

## Tide pearls, the port shop and the Remora (M2)

Defeated creatures sometimes drop tide pearls. They sink, so swim over them to collect them. Pearls and upgrades save in your browser.

- Spend pearls at the Brinehaven port shop. Pick it from the title menu, or surface by the boat and press the dock button.
- Upgrades: Barbed spear tip (+1 spear damage), Bigger air tank (+50 air), and the Remora mini sub (60 pearls).
- Once you own the Remora you start each dive in it. It is faster, fires torpedoes, has an armored hull, and refills your air. If the hull breaks, you bail out and the sub is gone for that dive.
- Sub and dock button (leave, board or dock): Enter or E, gamepad Y or X, Fire TV Select, or the touch button above FIRE. Enter no longer fires the spear.
- In the shop, use Up/Down (or the D-pad or stick) to choose and Enter, Space or A to buy, or tap a row. Esc, B or the Fire TV Back button returns to the title.

## Credits

- [Phaser 3](https://phaser.io/) 3.90.0, vendored under `vendor/phaser/` (MIT license, see `vendor/phaser/LICENSE.md`)
- Sprites in `assets/sprites/` are original pixel art by Art Dev for this game; any sprite that's missing falls back to a built-in placeholder shape
