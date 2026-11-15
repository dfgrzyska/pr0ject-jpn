// The gachapon: what a capsule can hold, how rare it is, and what a part does to the ship (plan-gacha.md).
// Only things that already work in the game are listed here: the machine never gives out a promise.

/** The five rarities, commonest first: the odds of a capsule, its colour (the capsule and the glow round the prize). */
export const RARITY = {
  N: { rate: 0.5, color: 0xf2f2f2, name: 'ZWYKŁY' },
  R: { rate: 0.3, color: 0x5cacf2, name: 'RZADKI' },
  SR: { rate: 0.14, color: 0xb070f0, name: 'SUPER RZADKI' },
  SSR: { rate: 0.05, color: 0xffd040, name: 'ULTRA RZADKI' },
  UR: { rate: 0.01, color: 0xff70c0, name: 'LEGENDARNY' }, // (drawn as a rainbow)
};
export const RARITIES = Object.keys(RARITY);

/** Tickets: for a miniboss, a city's boss, a random encounter's boss; and the ones handed out the first time. */
export const TICKETS = { heavy: 1, boss: 1, encounter: 2, first: 3 };

/** Every `every`th capsule in a row without one is at least `min` (while the machine still holds such). */
export const PITY = { every: 10, min: 'SR' };

/** The kinds of slot a hull can have, in the order their parts are fitted. */
export const SLOTS = ['engine', 'gun', 'bomb', 'core', 'omamori'];

// A part's `fx` is applied to the ship being put together: `set` (fields taken as they are), then `add`, then
// `mul`; `bombMul` multiplies the bomb's damage. `line`: parts of one line (the same upgrade in five rarities)
// are never fitted twice. `starter`: owned from the start, never in the machine.
const graded = (line, kind, name, info, values, fx) =>
  RARITIES.map((rarity, i) => ({ id: `${line}_${rarity.toLowerCase()}`, kind, rarity, line, name: `${name} ${rarity}`, info: info(values[i]), fx: fx(values[i]) }));
const pct = (v) => `+${Math.round(v * 100)}%`;

export const ITEMS = [
  // ---- hulls: the frame (looks, size, lives, base firepower) and its slots; `fixed` parts are built in
  {
    id: 'hull_tsuru', kind: 'hull', starter: true, name: 'TSURU', info: 'ZRÓWNOWAŻONY',
    ship: { id: 'kitsune', name: 'TSURU', role: 'STANDARD', color: 0xffb868, frame: 'ship', life: 'icon_life', lives: 3, damage: 1.05, hit: 1.4, graze: 8, pickup: 11, flameY: 8.5 },
    slots: { engine: 1, gun: 1, bomb: 1, core: 1, omamori: 1 },
  },
  {
    id: 'hull_oni', kind: 'hull', rarity: 'SR', name: 'ONI', info: 'DWA DZIAŁA, CIĘŻKI SILNIK NA STAŁE',
    ship: { id: 'oni', name: 'ONI', role: 'CIĘŻKI', color: 0x6ae486, frame: 'ship_oni', life: 'icon_life_oni', lives: 3, damage: 1.25, hit: 1.7, graze: 7, pickup: 11, flameY: 8 },
    slots: { engine: 0, gun: 2, bomb: 1, core: 1, omamori: 1 },
    fixed: { engine: 'engine_heavy' },
  },
  {
    id: 'hull_tsubame', kind: 'hull', rarity: 'SR', name: 'TSUBAME', info: 'DWA OMAMORI, LEKKA BOMBA NA STAŁE',
    ship: { id: 'tsubame', name: 'TSUBAME', role: 'SZYBKI', color: 0x5cacf2, frame: 'ship_tsubame', life: 'icon_life_tsubame', lives: 3, damage: 0.95, hit: 1.1, graze: 11, pickup: 16, flameY: 6 },
    slots: { engine: 1, gun: 1, bomb: 0, core: 1, omamori: 2 },
    fixed: { bomb: 'bomb_cut' },
  },

  // ---- engines: keyboard speed, px of travel per px of finger, how fast the ship chases the finger
  { id: 'engine_standard', kind: 'engine', starter: true, name: 'SILNIK STANDARDOWY', info: 'PEWNY I PRZEWIDYWALNY', fx: { set: { speed: 112, touchGain: 1.15, dragSpeed: 650 } } },
  { id: 'engine_heavy', kind: 'engine', rarity: 'R', name: 'SILNIK CIĘŻKI', info: 'WOLNY, PRECYZYJNY', fx: { set: { speed: 78, touchGain: 1.0, dragSpeed: 240 } } },
  { id: 'engine_swallow', kind: 'engine', rarity: 'SR', name: 'SILNIK JASKÓŁKA', info: 'BARDZO SZYBKI', fx: { set: { speed: 150, touchGain: 1.35, dragSpeed: 1400 } } },

  // ---- guns
  { id: 'gun_focus', kind: 'gun', rarity: 'R', name: 'SKUPIONA WIĄZKA', info: 'POCISKI LECĄ CIAŚNIEJ', fx: { set: { spread: 0.75 } } },
  ...graded('gun_power', 'gun', 'SIŁA OGNIA', (v) => `${pct(v)} OBRAŻEŃ`, [0.04, 0.08, 0.12, 0.18, 0.25], (v) => ({ mul: { damage: 1 + v } })),

  // ---- bombs: damage to everything on screen, s of invulnerability, s enemy bullets stay cancelled; grazes to earn it back
  { id: 'bomb_cranes', kind: 'bomb', starter: true, name: 'SENBAZURU', info: 'POCISKI ZMIENIA W ŻURAWIE', fx: { set: { bomb: { kind: 'cranes', damage: 45, invulnerable: 2.2, clear: 1.0 }, perBomb: 32 } } },
  { id: 'bomb_shock', kind: 'bomb', rarity: 'R', name: 'WSTRZĄS', info: 'NAJMOCNIEJSZA, WOLNO WRACA', fx: { set: { bomb: { kind: 'shock', damage: 75, invulnerable: 2.2, clear: 0.5 }, perBomb: 40 } } },
  { id: 'bomb_cut', kind: 'bomb', rarity: 'R', name: 'CIĘCIE WIATRU', info: 'LEKKA, WRACA DWA RAZY SZYBCIEJ', fx: { set: { bomb: { kind: 'cut', damage: 25, invulnerable: 1.2, clear: 0.6 }, perBomb: 20 } } },

  // ---- cores: what the ship does that others don't (see Player.perks)
  { id: 'core_ofuda', kind: 'core', starter: true, name: 'TALIZMANY OFUDA', info: 'GRAZING SKŁADA TALIZMANY', fx: { set: { ofuda: true } } },
  { id: 'core_rage', kind: 'core', rarity: 'SR', name: 'GNIEW SZTURMOWY', info: 'IM WYŻEJ, TYM MOCNIEJ; TARANUJE', fx: { set: { rage: 0.2, ram: true } } },
  { id: 'core_momentum', kind: 'core', rarity: 'SR', name: 'PĘD JASKÓŁKI', info: 'RUCH I GRAZING PRZYSPIESZAJĄ OGIEŃ', fx: { set: { momentum: true } } },

  // ---- omamori: small charms
  ...graded('oma_speed', 'omamori', 'DOPALACZ', (v) => `${pct(v)} PRĘDKOŚCI`, [0.04, 0.08, 0.12, 0.16, 0.2], (v) => ({ mul: { speed: 1 + v, dragSpeed: 1 + v } })),
  ...graded('oma_bomb', 'omamori', 'ŁADUNEK BOMBY', (v) => `${pct(v)} OBRAŻEŃ BOMBY`, [0.1, 0.2, 0.3, 0.45, 0.6], (v) => ({ bombMul: 1 + v })),
  ...graded('oma_magnet', 'omamori', 'MAGNES', (v) => `+${v} PX ZASIĘGU ZBIERANIA`, [2, 4, 6, 8, 10], (v) => ({ add: { pickup: v } })),
  { id: 'oma_graze', kind: 'omamori', rarity: 'R', name: 'OKO JASTRZĘBIA', info: 'WIĘKSZY ZASIĘG GRAZINGU', fx: { add: { graze: 2 } } },
  { id: 'oma_small', kind: 'omamori', rarity: 'SR', name: 'ZIARNKO RYŻU', info: 'MNIEJSZY HITBOX', fx: { add: { hit: -0.2 } } },
];

export const ITEM = Object.fromEntries(ITEMS.map((it) => [it.id, it]));

/** What a player of the three old ships starts with, by the old ship's id: its hull and the parts that made it. */
export const KITS = {
  kitsune: { hull: 'hull_tsuru', slots: { engine: ['engine_standard'], gun: [], bomb: ['bomb_cranes'], core: ['core_ofuda'], omamori: [] } },
  oni: { hull: 'hull_oni', slots: { engine: [], gun: ['gun_focus'], bomb: ['bomb_shock'], core: ['core_rage'], omamori: [] } },
  tsubame: { hull: 'hull_tsubame', slots: { engine: ['engine_swallow'], gun: [], bomb: [], core: ['core_momentum'], omamori: [] } },
};

/** A slot that may not stay empty is filled with this (a starter part). */
export const DEFAULTS = { engine: 'engine_standard', bomb: 'bomb_cranes' };
