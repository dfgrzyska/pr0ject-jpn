// Gameplay tunables. Everything a designer may want to tweak without touching logic.

export const VIEW = {
  width: 180,
  minHeight: 320, // 9:16
  maxHeight: 420, // 9:21
};

export const DEPTH = {
  far: 0,
  mid: 1,
  ground: 2,
  pickup: 4,
  air: 5,
  airFx: 5.5,
  playerShot: 6,
  player: 7,
  near: 8,
  enemyBullet: 9,
  fx: 10,
  hud: 20,
  overlay: 30,
};

export const PLAYER = {
  hitRadius: 1.5, // the visible dot in the middle of the ship (same for every ship)
  pickupRadius: 11,
  invulnerable: 2.5, // s after respawn
  respawnDelay: 1.0,
  deathPowerLoss: 1, // power levels lost on death (dropped as a pickup)
  maxPower: 5,
};

// Selectable ships (liveries after Japanese convenience-store colour schemes).
//   speed      keyboard speed, px/s
//   touchGain  px of ship travel per px of finger travel
//   dragSpeed  how fast the ship can chase the finger, px/s (the heavy ship lags behind)
//   damage     multiplier for every shot
//   flameY     engine flame offset below the sprite centre
//   stats      [speed, power] shown as pips (out of 3) on the selection screen
export const SHIPS = [
  {
    id: 'oni',
    name: 'ONI',
    role: 'CIĘŻKI',
    color: 0x6ae486,
    frame: 'ship_oni',
    life: 'icon_life_oni',
    speed: 76,
    touchGain: 1.0,
    dragSpeed: 230,
    damage: 1.4,
    lives: 3,
    flameY: 8,
    stats: [1, 3],
  },
  {
    id: 'kitsune',
    name: 'KITSUNE',
    role: 'STANDARD',
    color: 0xffb868,
    frame: 'ship',
    life: 'icon_life',
    speed: 100,
    touchGain: 1.15,
    dragSpeed: 950,
    damage: 1,
    lives: 3,
    flameY: 8.5,
    stats: [2, 2],
  },
  {
    id: 'tsubame',
    name: 'TSUBAME',
    role: 'SZYBKI',
    color: 0x5cacf2,
    frame: 'ship_tsubame',
    life: 'icon_life_tsubame',
    speed: 132,
    touchGain: 1.35,
    dragSpeed: 1500,
    damage: 1,
    lives: 2,
    flameY: 6,
    stats: [3, 2],
  },
];

// Weapons: basic -> pickups switch type (keep level) or raise level (same colour).
export const WEAPONS = {
  colorToType: { red: 'spread', blue: 'laser', green: 'homing' },
  typeToColor: { spread: 'red', laser: 'blue', homing: 'green' },
  basic: { interval: 1 / 12, damage: 1, speed: 360 },
  spread: { interval: 1 / 12, damage: 0.8, speed: 300, pellets: [3, 5, 5, 7, 7], arc: [24, 40, 48, 60, 72] },
  laser: { interval: 1 / 30, damage: [0.9, 1.1, 1.35, 1.6, 1.9], speed: 480, sprite: [1, 1, 2, 2, 3], sideFrom: 2 },
  homing: { interval: 1 / 6, damage: 1.4, speed: 210, turn: 6, life: 1.6, orbs: [2, 2, 3, 3, 4] },
};

export const BOMB = {
  damage: 45,
  invulnerable: 2.2,
  clearTime: 1.0, // enemy bullets are cancelled for this long
};

export const SCORE = {
  multiplierMax: 10,
  // Contribution needed per +1 multiplier. 'auto' = sum of enemy weights in the stage / 9
  // (reaching x10 at the end of stage 1 without dying). Fallback while there are no waves.
  multiplierStep: 'auto',
  multiplierStepFallback: 25,
  maxPowerBonus: 2000, // x multiplier, for a pickup at max power
};

// Enemy archetypes: same behaviour in every city, only the look changes.
export const ENEMIES = {
  popcorn: { hp: 3, weight: 1, score: 100, radius: 5, explosion: 's' },
  shooter: { hp: 22, weight: 2, score: 300, radius: 9, explosion: 'm' },
  turret: { hp: 26, weight: 3, score: 400, radius: 7, explosion: 'm', ground: true },
  diver: { hp: 5, weight: 1, score: 150, radius: 6, explosion: 's' },
  heavy: { hp: 600, weight: 5, score: 8000, radius: 18, explosion: 'l' },
  carrier: { hp: 12, weight: 2, score: 500, radius: 7, explosion: 's' },
};

export const FAIR = {
  noFireAfterEnter: 0.7, // s: enemies never shoot right after appearing
  noFireBelow: 0.62, // fraction of screen height: no shots from the lower part
  popcornFireChance: 0.25,
  bulletSpeed: { slow: 52, normal: 66, fast: 80 },
};
