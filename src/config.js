// Gameplay tunables. Everything a designer may want to tweak without touching logic.

export const VIEW = {
  width: 180,
  minHeight: 320, // 9:16
  maxHeight: 420, // 9:21
};

// Render pixels per gameplay unit; VIEW and all gameplay coordinates stay unchanged.
export const RENDER_SCALE = 3;

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
  hitRadius: 1.5, // the visible dot in the middle of the ship (a ship's own `hit` stands in for it)
  pickupRadius: 11,
  invulnerable: 2.5, // s after respawn
  respawnDelay: 1.0,
  deathPowerLoss: 1, // power levels lost on death (dropped as a pickup)
  lostPowerVy: -140, // the lost level is flung up the screen: it has to be chased, not caught on respawning
  maxPower: 5,
};

// Selectable ships (liveries after Japanese convenience-store colour schemes).
//   speed      keyboard speed, px/s
//   touchGain  px of ship travel per px of finger travel
//   dragSpeed  how fast the ship can chase the finger, px/s (the heavy ship lags behind)
//   damage     multiplier for every shot
//   hit        radius of the hit dot, px; graze: how close a bullet must pass to graze; pickup: reach for pickups
//   perBomb    grazes to earn the spent bomb back
//   perk       what the ship does that the others don't (shown on the selection screen; see Player)
//   bomb       its bomb: damage to everything on screen, s of invulnerability, s enemy bullets stay cancelled
//   flameY     engine flame offset below the sprite centre
//   stats      [speed, power] shown as pips (out of 3) on the selection screen
// (ids stay as they were: the last ship picked is kept in the browser by id; Tsuru was called Kitsune)
export const SHIPS = [
  {
    id: 'oni',
    name: 'ONI',
    role: 'CIĘŻKI',
    perk: 'GNIEW SZTURMOWY',
    color: 0x6ae486,
    frame: 'ship_oni',
    life: 'icon_life_oni',
    speed: 78,
    touchGain: 1.0,
    dragSpeed: 240,
    damage: 1.25,
    lives: 3,
    hit: 1.7,
    graze: 7,
    pickup: 11,
    perBomb: 40,
    spread: 0.75, // its shots fly closer together
    rage: 0.2, // up to this much more damage the higher up the screen it flies
    ram: true, // while invulnerable it rams small fry to bits
    bomb: { kind: 'shock', damage: 75, invulnerable: 2.2, clear: 0.5 },
    flameY: 8,
    stats: [1, 3],
  },
  {
    id: 'kitsune',
    name: 'TSURU',
    role: 'STANDARD',
    perk: 'TALIZMANY OFUDA',
    color: 0xffb868,
    frame: 'ship',
    life: 'icon_life',
    speed: 112,
    touchGain: 1.15,
    dragSpeed: 650,
    damage: 1.05,
    lives: 3,
    hit: 1.4,
    graze: 8,
    pickup: 11,
    perBomb: 32,
    ofuda: true, // grazes fold paper talismans that circle the ship (OFUDA)
    bomb: { kind: 'cranes', damage: 45, invulnerable: 2.2, clear: 1.0 },
    flameY: 8.5,
    stats: [2, 2],
  },
  {
    id: 'tsubame',
    name: 'TSUBAME',
    role: 'SZYBKI',
    perk: 'PĘD JASKÓŁKI',
    color: 0x5cacf2,
    frame: 'ship_tsubame',
    life: 'icon_life_tsubame',
    speed: 150,
    touchGain: 1.35,
    dragSpeed: 1400,
    damage: 0.95,
    lives: 3,
    hit: 1.1,
    graze: 11,
    pickup: 16,
    perBomb: 20, // a lighter bomb, back twice as often
    momentum: true, // flying and grazing build up speed: faster fire (MOMENTUM)
    bomb: { kind: 'cut', damage: 25, invulnerable: 1.2, clear: 0.6 },
    flameY: 6,
    stats: [3, 1],
  },
];

// Tsuru: every `every` grazes a paper talisman starts circling the ship (at most `max`); it cancels an enemy
// bullet that touches it, or after `life` s flies off at the nearest enemy
export const OFUDA = { every: 12, max: 2, life: 7, damage: 12, orbit: 13, reach: 5 };

// Tsubame: momentum builds while the ship flies (faster than `moving` px/s) and with every graze, ebbs while it
// hovers; full momentum fires `fire` faster
export const MOMENTUM = { moving: 40, gain: 0.3, graze: 0.07, ebb: 0.2, fire: 0.3 };

// Weapons: basic -> pickups switch type (keep level) or raise level (same colour).
export const WEAPONS = {
  colorToType: { red: 'spread', blue: 'laser', green: 'homing' },
  typeToColor: { spread: 'red', laser: 'blue', homing: 'green' },
  basic: { interval: 1 / 12, damage: 1, speed: 360 },
  // close: pellets hit harder for their first `close` s of flight (point blank)
  spread: { interval: 1 / 12, damage: 0.8, speed: 300, pellets: [3, 5, 5, 7, 7], arc: [20, 32, 38, 46, 52], close: 0.22, closeBonus: 1.35 },
  // pierce: the beam goes on through this many small fry (popcorn, divers), keeping `pierceKeep` of its damage
  laser: { interval: 1 / 30, damage: [0.9, 1.1, 1.35, 1.6, 1.9], speed: 480, sprite: [1, 1, 2, 2, 3], sideFrom: 2, pierce: 1, pierceKeep: 0.6 },
  // arm: s flying straight before the orb starts seeking; range: px it looks for a target in; lockY / lockSeen:
  // an enemy is only sought once it is this far down the screen and has been on it this long (waves get to come in)
  homing: { interval: 1 / 6, damage: 1.4, speed: 210, turn: 3.8, life: 1.15, orbs: [2, 2, 3, 3, 4], arm: 0.18, range: 170, lockY: 18, lockSeen: 0.25 },
};

// Nagasaki boss Ja-odori: fought mostly with the festival's fireworks. Holding fire on a launcher charges it for
// `charge` s; a rocket that meets the dragon on its announced path takes `firework` of its life (whatever is open) and
// bares its head for `open` s, taking `openTake` of shot damage (`shut` the rest of the time). A launcher that fired
// rests `cool` s; after any launch every launcher rests `lock` s.
export const JAODORI = { charge: 1, firework: 0.18, open: 3, openTake: 0.7, shut: 0.06, cool: 6, lock: 2 };

// Purple power-up: turrets at the wing tips (up to `max`), each firing a single slow bullet straight up every
// `interval` s. Together they make a shield: a hit takes a turret instead of the ship, then `grace` s in which the
// bubble swallows anything else that touches it (bullets within `clear` px are wiped), so one spray cannot take both.
// `share`: the chance a power-up carrier brings the purple token rather than a weapon colour.
export const TURRETS = { max: 2, interval: 0.3, speed: 230, damage: 1.1, radius: 2.5, grace: 1.0, clear: 20, share: 0.16 };

// Grazing: a bullet passing within `radius` px of the hit dot (without hitting) scores and, while the bomb
// is spent, charges a new one
export const GRAZE = {
  radius: 8,
  points: 30, // x multiplier
  perBomb: 40, // grazes to earn the bomb back
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
  popcorn: { hp: 5, weight: 1, score: 100, radius: 5, explosion: 's' },
  shooter: { hp: 32, weight: 2, score: 300, radius: 9, explosion: 'm' },
  turret: { hp: 38, weight: 3, score: 400, radius: 7, explosion: 'm', ground: true },
  diver: { hp: 9, weight: 1, score: 150, radius: 6, explosion: 's' },
  heavy: { hp: 600, weight: 5, score: 8000, radius: 19, explosion: 'l' }, // Kyūbi / tanuki (Kyoto), manta (Okinawa), Yuki-onna (Sapporo), Raijū (Kagoshima), bunraku puppet (Osaka)
  // stage boss, one entry per part (Okinawa: two shisa sharing one HP bar; Sapporo: the bear, parts set their own HP)
  boss: { hp: 572, weight: 6, score: 15000, radius: 15, explosion: 'l' },
  carrier: { hp: 18, weight: 2, score: 500, radius: 7, explosion: 's' },
  // Sapporo: rotary snowplough driving along the streets, sweeping a stream of snow
  plow: { hp: 30, weight: 3, score: 600, radius: 8, explosion: 'm', ground: true },
  // Beppu environment (no score, no multiplier): a hot-spring vent that erupts, a drifting steam cloud
  geyser: { hp: 1, weight: 0, score: 0, radius: 8, explosion: 's', ground: true },
  steam: { hp: 1, weight: 0, score: 0, radius: 17, explosion: 's' },
};

// Minibosses' HP (the wave's own `hp` wins); below `phase2` of its life each one breaks into its second phase
export const HEAVY = { hp: { tanuki: 750, manta: 780, raiju: 800, wani: 820, heikegani: 820 }, phase2: 0.5 };

// The journey gets harder city by city: from the second city on, small fry have `hp` more HP for each city
// already flown (at most `hpMax`), and shooters and turrets reload up to `react` faster by the last one
export const CAMPAIGN = { hp: 0.06, hpMax: 0.4, react: 0.1 };

// A miniboss gone (shot down or flown off) with the next wave more than `gap` s away: the city's own small
// fry keep coming every `every` s until `lead` s before it
export const FILL = { gap: 4, every: 2.6, lead: 1.5 };

// Spirit surge: with the bomb ready, `need` grazes put the ship in a surge for `time` s: its shots fly `speed`
// times as fast and hit `damage` times as hard
export const SURGE = { need: 25, time: 5, speed: 1.25, damage: 1.25 };

// Beppu: flying through steam heats the guns (stronger shots); too long and they jam until they cool
export const HEAT = {
  rise: 0.34, // per second inside a steam cloud
  cool: 0.1, // per second outside
  boostAt: 0.4, // from this heat on, shots are hot
  boost: 1.5, // damage multiplier of hot shots
  jam: 1.8, // s without firing after overheating
};

// Sapporo miniboss: Yuki-onna's freezing mist frosts the ship over (it slows), frosted through it freezes solid
export const FROST = {
  rise: 0.55, // per second inside the mist
  thaw: 0.3, // per second outside it
  slow: 0.55, // speed lost at full frost
  frozen: 0.9, // s caught in the ice
  after: 0.35, // frost left on breaking out
};

// Beppu boss: Setsubun beans thrown alongside the normal weapon (only beans really hurt the oni)
export const BEANS = {
  time: 9, // s of beans per masu box
  damage: 2,
  speed: 260,
  rate: 10, // pairs thrown a second, whatever the weapon
  spread: 8, // px/s sideways: the pair closes in a little on the oni
  armor: 0.12, // fraction of normal damage the oni takes (before his phases crack it: see beppu.js)
  masuHit: 60, // a box shot down bursts over the oni
  stagger: 1.0, // s he reels and holds his attacks after that
};

// A boss (or heavy) breaking into its next phase: a moment it shrugs most damage off (`take` gets through, for
// `gate` s, so a high-powered ship can't burn through a phase before it shows), enemy bullets round it are
// cancelled, the player scores `bonus` x multiplier and `charge` grazes towards a spent bomb
export const PHASE = { gate: 0.9, take: 0.2, clear: 64, bonus: 5000, charge: 10 };

export const FAIR = {
  noFireAfterEnter: 0.4, // s: enemies never shoot right after appearing
  speed: 1.05, // every enemy bullet
  noFireBelow: 0.62, // fraction of screen height: no shots from the lower part
  popcornFireChance: 0.25,
  bulletSpeed: { slow: 52, normal: 66, fast: 80 },
};

// Easy mode (ŁATWY, picked on the ship screen): the same cities, waves, bosses and attacks with gentler
// numbers, one more life, a bomb that goes off by itself when you're hit, and three continues. Each entry
// stands in for the normal value named beside it (src/difficulty.js).
export const EASY = {
  extraLives: 1, // on top of the ship's own
  autoBomb: true, // hit with the bomb ready: it goes off instead
  continues: 3, // game over: carry on where you fell, score from zero (this many times in a game)
  invulnerable: 3.5, // s after respawn (PLAYER.invulnerable)
  grazeBomb: 0.75, // of the ship's grazes per bomb
  bulletSpeed: 0.88, // every enemy bullet (FAIR.speed)
  volley: 0.8, // bullets in fans and rings, keeping odd counts odd (the aimed bullet in the middle stays)
  lobBurst: 3, // pellets where a lobbed snowball lands (4)
  noFireAfterEnter: 0.65, // (FAIR)
  noFireBelow: 0.55, // (FAIR; bosses keep the normal line)
  popcornFireChance: 0.12, // (FAIR)
  warn: 1.3, // warning time of beams and scalding zones
  bossHp: 0.8, // bosses, heavies and their parts
  heatJam: 1.0, // s (HEAT.jam)
  enemyHp: { popcorn: 3, shooter: 22, turret: 26, diver: 5, carrier: 12 }, // small fry as tough as they used to be
  carrierShare: 1, // every power-up carrier comes (normal: a quarter fewer)
};
