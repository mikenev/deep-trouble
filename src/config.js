// Game-wide numbers in one place so tuning doesn't mean hunting through scenes.
export const VIEW = { w: 960, h: 540 };
export const WORLD = { w: 4800, h: 1200, surface: 120, floor: 1140 };

export const DIVER = {
  accel: 900, maxSpeed: 230, water: 4, buoyancy: 20,
  health: 5, air: 100, airDrain: 3.2, airRefill: 45, drownDamageEvery: 1.5,
  hurtInvuln: 1.2, knockback: 260,
};
export const SPEAR = { speed: 620, cooldown: 0.32, life: 0.9, damage: 1 };

// Original sea creatures for the waters off Brinehaven.
export const CREATURES = {
  jelly:     { hp: 1, score: 10, speed: 40,  damage: 1, size: [34, 40] },
  barracuda: { hp: 2, score: 25, speed: 170, damage: 1, size: [70, 22] },
  ray:       { hp: 3, score: 40, speed: 90,  damage: 1, size: [80, 34] },
  crab:      { hp: 2, score: 20, speed: 55,  damage: 1, size: [34, 26] },
};
export const SPAWN = { max: 9, every: 1.4, minDist: 520 };

// M2: tide pearls, the port shop and the Remora mini sub.
// Chance a defeated creature drops a pearl, and what it's worth.
export const PEARL = { drop: { jelly: [0.4, 1], crab: [0.5, 1], barracuda: [0.6, 2], ray: [0.7, 3] }, sink: 55, life: 14 };
export const SHOP = {
  spear:  { name: 'Barbed spear tip', desc: '+1 spear damage', costs: [12, 25] },
  air:    { name: 'Bigger air tank',  desc: '+50 air',         costs: [8, 18] },
  remora: { name: 'The Remora',       desc: 'Mini sub with torpedoes and an armored hull', costs: [60] },
};
export const REMORA = {
  accel: 520, maxSpeed: 300, water: 1.6, hull: 6, hurtInvuln: 1.0, airRefill: 12,
  board: 90, // how close the diver must be to climb back in
};
export const TORPEDO = { speed0: 180, speed: 560, accel: 900, cooldown: 0.55, life: 1.6, damage: 3 };
export const DOCK = { x: 230, range: 120 };
