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
- Pause / back: Esc or Backspace (Fire TV Back and Menu work too; in the dive, Play/Pause pauses when there's nothing to board, leave or dock)
- Mute: M (saved between visits)

Surface to refill your air before it runs out.

## Tide pearls, the port shop and the Remora (M2)

Defeated creatures sometimes drop tide pearls. They sink, so swim over them to collect them. Pearls and upgrades save in your browser.

- Spend pearls at the Brinehaven port shop. Pick it from the title menu, or surface by the boat and press the dock button.
- Upgrades: Barbed spear tip (+1 spear damage), Bigger air tank (+50 air), and the Remora mini sub (60 pearls).
- Once you own the Remora you start each dive in it. It is faster, fires torpedoes, has an armored hull, and refills your air. If the hull breaks, you bail out and the sub is gone for that dive.
- Sub and dock button (leave, board or dock): E, gamepad Y or X, the Fire TV Play/Pause button, or the touch button above FIRE. Enter (Fire TV Select) also docks or boards when that prompt is showing, and fires otherwise, so it never does both at once.
- In the shop, use Up/Down (or the D-pad or stick) to choose and Enter, Space or A to buy, or tap a row. Esc, B or the Fire TV Back button returns to the title.

## Credits

- [Phaser 3](https://phaser.io/) 3.90.0, vendored under `vendor/phaser/` (MIT license, see `vendor/phaser/LICENSE.md`)
- Sprites in `assets/sprites/` are original pixel art by Art Dev for this game; any sprite that's missing falls back to a built-in placeholder shape

## M3: the seaplane bonus flight

- Every so often (first after about 40 s of a dive, then every 70 s) a seaplane moors at the surface near you and waits about 22 s. Swim or drive the Remora up to it at the surface to take off.
- The bonus flight is one screen over the shipping lane: fly left and right and drop bombs on the jellyfish floating on the water. It lasts 35 s. Each jelly is worth 30 points, every second one earns a tide pearl, and bombing 10 or more adds 3 more pearls.
- Controls: move left/right, fire (Space, Z, Enter / Fire TV Select, gamepad A or the touch FIRE button) drops a bomb, up to three in the air. Esc, Back, Menu or the touch II button pauses.
- When time runs out a flight log card shows the tally; Enter, a tap or Back returns you to the dive where you left it, with the score added and the pearls saved.
- The stingray's physics box covers its body only, never the long tail (the manifest's `body` box for real art, a fitted box for the placeholder), and it mirrors when the ray turns.
- Fire TV: Menu pauses again; Play/Pause boards or leaves the Remora (and docks) when that's possible, and pauses otherwise.
- After the diver is lost, the game-over screen ignores input for a second and then waits for every fire button to be released, so holding fire doesn't restart straight away.
- Art keys (placeholders until Art Dev's art lands): `plane`, `bomb`, `jellySurface`, `splash`, `skysea` (its `sea` field is the waterline row in source pixels).
