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
