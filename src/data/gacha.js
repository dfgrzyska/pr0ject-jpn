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

/** What changes only the looks, one of each worn at a time on any hull. */
export const LOOKS = ['paint', 'flame', 'dye', 'wake'];

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
    id: 'hull_oni', kind: 'hull', rarity: 'SR', name: 'ONI', info: 'DWA DZIAŁA, CIĘŻKI SILNIK',
    ship: { id: 'oni', name: 'ONI', role: 'CIĘŻKI', color: 0x6ae486, frame: 'ship_oni', life: 'icon_life_oni', lives: 3, damage: 1.25, hit: 1.7, graze: 7, pickup: 11, flameY: 8 },
    slots: { engine: 0, gun: 2, bomb: 1, core: 1, omamori: 1 },
    fixed: { engine: 'engine_heavy' },
  },
  {
    id: 'hull_tsubame', kind: 'hull', rarity: 'SR', name: 'TSUBAME', info: 'DWA OMAMORI, LEKKA BOMBA',
    ship: { id: 'tsubame', name: 'TSUBAME', role: 'SZYBKI', color: 0x5cacf2, frame: 'ship_tsubame', life: 'icon_life_tsubame', lives: 3, damage: 0.95, hit: 1.1, graze: 11, pickup: 16, flameY: 6 },
    slots: { engine: 1, gun: 1, bomb: 0, core: 1, omamori: 2 },
    fixed: { bomb: 'bomb_cut' },
  },
  // the premium one: every slot there is, nothing built in
  {
    id: 'hull_houou', kind: 'hull', rarity: 'UR', name: 'HOUOU', info: 'FENIKS: WSZYSTKIE SLOTY',
    ship: { id: 'houou', name: 'HOUOU', role: 'PREMIUM', color: 0xffd040, frame: 'ship_houou', life: 'icon_life_houou', lives: 3, damage: 1.1, hit: 1.3, graze: 9, pickup: 13, flameY: 8.5 },
    slots: { engine: 1, gun: 2, bomb: 1, core: 2, omamori: 3 },
  },

  // ---- engines: keyboard speed, px of travel per px of finger, how fast the ship chases the finger
  { id: 'engine_standard', kind: 'engine', starter: true, name: 'SILNIK STANDARDOWY', info: 'PEWNY I PRZEWIDYWALNY', fx: { set: { speed: 112, touchGain: 1.15, dragSpeed: 650 } } },
  { id: 'engine_heavy', kind: 'engine', rarity: 'R', name: 'SILNIK CIĘŻKI', info: 'WOLNY, PRECYZYJNY', fx: { set: { speed: 78, touchGain: 1.0, dragSpeed: 240 } } },
  { id: 'engine_swallow', kind: 'engine', rarity: 'SR', name: 'SILNIK JASKÓŁKA', info: 'BARDZO SZYBKI', fx: { set: { speed: 150, touchGain: 1.35, dragSpeed: 1400 } } },

  { id: 'engine_turbo', kind: 'engine', rarity: 'N', name: 'SILNIK TURBO', info: 'SZYBSZY OD STANDARDOWEGO', fx: { set: { speed: 128, touchGain: 1.22, dragSpeed: 850 } } },
  { id: 'engine_hover', kind: 'engine', rarity: 'N', name: 'SILNIK ZAWIS', info: 'SPOKOJNY, UŁATWIA GRAZING', fx: { set: { speed: 100, touchGain: 1.1, dragSpeed: 520 }, add: { graze: 3 } } },
  // (fireSlow: the speed kept while the guns fire)
  { id: 'engine_focus', kind: 'engine', rarity: 'R', name: 'SILNIK SKUPIENIE', info: 'SZYBKI, GDY NIE STRZELASZ', fx: { set: { speed: 160, touchGain: 1.3, dragSpeed: 1200, fireSlow: 0.55 } } },
  // (inertia: how fast it picks up and loses speed on the keys, 1/s)
  { id: 'engine_drift', kind: 'engine', rarity: 'R', name: 'SILNIK DRYF', info: 'SZYBKI, Z BEZWŁADNOŚCIĄ', fx: { set: { speed: 140, touchGain: 1.25, dragSpeed: 480, inertia: 6 } } },
  // (dodge: s between the hits it throws the ship clear of by itself)
  { id: 'engine_dash', kind: 'engine', rarity: 'SSR', name: 'SILNIK ZRYW', info: 'SAM UNIKA CIOSU CO 15 S', fx: { set: { speed: 118, touchGain: 1.18, dragSpeed: 700, dodge: 15 } } },

  // ---- guns
  { id: 'gun_focus', kind: 'gun', rarity: 'R', name: 'SKUPIONA WIĄZKA', info: 'POCISKI LECĄ CIAŚNIEJ', fx: { set: { spread: 0.75 } } },
  ...graded('gun_power', 'gun', 'SIŁA OGNIA', (v) => `${pct(v)} OBRAŻEŃ`, [0.04, 0.08, 0.12, 0.18, 0.25], (v) => ({ mul: { damage: 1 + v } })),

  ...graded('gun_rate', 'gun', 'SZYBKOSTRZELNOŚĆ', (v) => `${pct(v)} SZYBKOSTRZELNOŚCI`, [0.04, 0.08, 0.12, 0.16, 0.2], (v) => ({ mul: { fireRate: 1 + v } })),
  { id: 'gun_tail', kind: 'gun', rarity: 'N', name: 'DZIAŁKO OGONOWE', info: 'STRZELA TEŻ DO TYŁU', fx: { set: { tail: true } } },
  { id: 'gun_wide', kind: 'gun', rarity: 'R', name: 'SZEROKI WACHLARZ', info: 'POCISKI LECĄ SZERZEJ', fx: { set: { spread: 1.3 } } },
  { id: 'gun_rapid', kind: 'gun', rarity: 'R', name: 'LEKKIE LUFY', info: '+25% TEMPA, -15% OBRAŻEŃ', fx: { mul: { fireRate: 1.25, damage: 0.85 } } },
  { id: 'gun_close', kind: 'gun', rarity: 'R', name: 'Z PRZYŁOŻENIA', info: '+25% OBRAŻEŃ Z BLISKA', fx: { set: { pointBlank: 1.25 } } },
  { id: 'gun_start_spread', kind: 'gun', rarity: 'R', name: 'START: ROZRZUT', info: 'ZACZYNASZ Z ROZRZUTEM', fx: { set: { startWeapon: 'spread' } } },
  { id: 'gun_start_laser', kind: 'gun', rarity: 'R', name: 'START: LASER', info: 'ZACZYNASZ Z LASEREM', fx: { set: { startWeapon: 'laser' } } },
  { id: 'gun_start_homing', kind: 'gun', rarity: 'R', name: 'START: NAPROWADZANE', info: 'ZACZYNASZ Z NAPROWADZANYMI', fx: { set: { startWeapon: 'homing' } } },
  { id: 'gun_heavy', kind: 'gun', rarity: 'SR', name: 'CIĘŻKIE LUFY', info: '+20% OBRAŻEŃ, -15% TEMPA', fx: { mul: { damage: 1.2, fireRate: 0.85 } } },
  { id: 'gun_pierce', kind: 'gun', rarity: 'SR', name: 'PRZEBIJAJĄCE IGŁY', info: 'IGŁY PRZEBIJAJĄ DROBNICĘ', fx: { set: { needlePierce: 1 } } },

  // ---- bombs: damage to everything on screen, s of invulnerability, s enemy bullets stay cancelled; grazes to earn it back
  { id: 'bomb_cranes', kind: 'bomb', starter: true, name: 'SENBAZURU', info: 'POCISKI ZMIENIA W ŻURAWIE', fx: { set: { bomb: { kind: 'cranes', damage: 45, invulnerable: 2.2, clear: 1.0 }, perBomb: 32 } } },
  { id: 'bomb_shock', kind: 'bomb', rarity: 'R', name: 'WSTRZĄS', info: 'NAJMOCNIEJSZA, WOLNO WRACA', fx: { set: { bomb: { kind: 'shock', damage: 75, invulnerable: 2.2, clear: 0.5 }, perBomb: 40 } } },
  { id: 'bomb_cut', kind: 'bomb', rarity: 'R', name: 'CIĘCIE WIATRU', info: 'LEKKA, SZYBKO WRACA', fx: { set: { bomb: { kind: 'cut', damage: 25, invulnerable: 1.2, clear: 0.6 }, perBomb: 20 } } },

  { id: 'bomb_quick', kind: 'bomb', rarity: 'R', name: 'SZYBKIE ŁADOWANIE', info: 'SŁABA, WRACA BŁYSKAWICZNIE', fx: { set: { bomb: { kind: 'cut', damage: 30, invulnerable: 1.0, clear: 0.5 }, perBomb: 14 } } },
  { id: 'bomb_guard', kind: 'bomb', rarity: 'R', name: 'DŁUGA OSŁONA', info: 'DŁUGA NIETYKALNOŚĆ', fx: { set: { bomb: { kind: 'shock', damage: 40, invulnerable: 4.0, clear: 1.5, shout: 'OSŁONA!' }, perBomb: 46 } } },
  { id: 'bomb_magnet', kind: 'bomb', rarity: 'R', name: 'MAGNES NA POCISKI', info: 'POCISKI ZMIENIA W PUNKTY', fx: { set: { bomb: { kind: 'magnet', damage: 10, invulnerable: 1.8, clear: 1.2, shout: 'MAGNES!' }, perBomb: 30 } } },
  // (bombMax: charges held; each graze count earns one back)
  { id: 'bomb_twin', kind: 'bomb', rarity: 'SR', name: 'DWIE MAŁE', info: 'DWA ŁADUNKI, KAŻDY SŁABSZY', fx: { set: { bomb: { kind: 'cut', damage: 28, invulnerable: 1.4, clear: 0.6, shout: 'RAZ, DWA!' }, perBomb: 30, bombMax: 2 } } },
  // (bursts: fireworks after the first blast, each doing `burst` to everything)
  { id: 'bomb_hanabi', kind: 'bomb', rarity: 'SR', name: 'HANABI', info: 'SERIA WYBUCHÓW NA BOSSA', fx: { set: { bomb: { kind: 'hanabi', damage: 30, invulnerable: 2.0, clear: 0.4, bursts: 5, burst: 20, shout: 'HANABI!' }, perBomb: 38 } } },
  // (slow: s the bullets crawl instead of being cancelled)
  { id: 'bomb_slow', kind: 'bomb', rarity: 'SSR', name: 'ZWOLNIENIE CZASU', info: 'POCISKI PEŁZNĄ PRZEZ 4 S', fx: { set: { bomb: { kind: 'slow', damage: 20, invulnerable: 1.0, clear: 0, slow: 4, shout: 'CZAS STOP!' }, perBomb: 34 } } },

  // ---- cores: what the ship does that others don't (see Player.perks)
  { id: 'core_ofuda', kind: 'core', starter: true, name: 'TALIZMANY OFUDA', info: 'GRAZING SKŁADA TALIZMANY', fx: { set: { ofuda: true } } },
  { id: 'core_rage', kind: 'core', rarity: 'SR', name: 'GNIEW SZTURMOWY', info: 'IM WYŻEJ, TYM MOCNIEJ', fx: { set: { rage: 0.2, ram: true } } },
  { id: 'core_momentum', kind: 'core', rarity: 'SR', name: 'PĘD JASKÓŁKI', info: 'RUCH PRZYSPIESZA OGIEŃ', fx: { set: { momentum: true } } },

  { id: 'core_graze', kind: 'core', rarity: 'R', name: 'ŁOWCA GRAZINGU', info: 'GRAZING DAJE 2× PUNKTÓW', fx: { set: { grazePoints: 2 } } },
  { id: 'core_bastion', kind: 'core', rarity: 'R', name: 'OSTATNI BASTION', info: '+30% NA OSTATNIM ŻYCIU', fx: { set: { lastStand: 0.3 } } },
  { id: 'core_surge', kind: 'core', rarity: 'R', name: 'DŁUGI PRZYPŁYW', info: 'SKUPIENIE DUCHA TRWA 9 S', fx: { set: { surgeTime: 9, surgeNeed: 30 } } },
  { id: 'core_turret', kind: 'core', rarity: 'SR', name: 'WIEŻYCZKA NA START', info: 'KAŻDE MIASTO Z WIEŻYCZKĄ', fx: { set: { startTurrets: 1 } } },
  { id: 'core_will', kind: 'core', rarity: 'SR', name: 'ŻELAZNA WOLA', info: 'ŚMIERĆ NIE ZABIERA MOCY', fx: { set: { keepPower: true } } },
  { id: 'core_second', kind: 'core', rarity: 'SSR', name: 'DRUGA SZANSA', info: 'RAZ NA MIASTO CHRONI', fx: { set: { secondChance: true } } },

  // ---- omamori: small charms
  ...graded('oma_speed', 'omamori', 'DOPALACZ', (v) => `${pct(v)} PRĘDKOŚCI`, [0.04, 0.08, 0.12, 0.16, 0.2], (v) => ({ mul: { speed: 1 + v, dragSpeed: 1 + v } })),
  ...graded('oma_bomb', 'omamori', 'ŁADUNEK BOMBY', (v) => `${pct(v)} OBRAŻEŃ BOMBY`, [0.1, 0.2, 0.3, 0.45, 0.6], (v) => ({ bombMul: 1 + v })),
  ...graded('oma_magnet', 'omamori', 'MAGNES', (v) => `+${v} PX ZASIĘGU ZBIERANIA`, [2, 4, 6, 8, 10], (v) => ({ add: { pickup: v } })),
  { id: 'oma_graze', kind: 'omamori', rarity: 'R', name: 'OKO JASTRZĘBIA', info: 'WIĘKSZY ZASIĘG GRAZINGU', fx: { add: { graze: 2 } } },
  { id: 'oma_small', kind: 'omamori', rarity: 'SR', name: 'ZIARNKO RYŻU', info: 'MNIEJSZY HITBOX', fx: { add: { hit: -0.2 } } },
  { id: 'oma_bonus', kind: 'omamori', rarity: 'N', name: 'SAKIEWKA', info: '2× PREMIA ZA MOC MAX', fx: { set: { maxBonus: 2 } } },
  { id: 'oma_invuln', kind: 'omamori', rarity: 'R', name: 'PAPIEROWY PARASOL', info: '+1 S OSŁONY PO ODRODZENIU', fx: { set: { respawnInvuln: 1 } } },
  { id: 'oma_purple', kind: 'omamori', rarity: 'R', name: 'FIOLETOWA WSTĄŻKA', info: 'CZĘŚCIEJ WYPADA WIEŻYCZKA', fx: { set: { purpleShare: 0.16 } } },
  { id: 'oma_life', kind: 'omamori', rarity: 'SSR', name: 'DARUMA', info: '+1 ŻYCIE', fx: { add: { lives: 1 } } },
  // ---- paint jobs: the hull's livery recoloured (its main colour, then up to three more)
  { id: 'paint_konbini_green', kind: 'paint', rarity: 'N', name: 'KONBINI ZIELONE', info: 'MALOWANIE: KONBINI', colors: [0xf4f4f4, 0x00a73c, 0x00589e, 0xe2aa32] },
  { id: 'paint_konbini_orange', kind: 'paint', rarity: 'N', name: 'KONBINI POMARAŃCZOWE', info: 'MALOWANIE: KONBINI', colors: [0xf4f4f4, 0xf58220, 0x008061, 0xee2526] },
  { id: 'paint_konbini_blue', kind: 'paint', rarity: 'N', name: 'KONBINI NIEBIESKIE', info: 'MALOWANIE: KONBINI', colors: [0xf4f4f4, 0x0068b7, 0x5cacf2, 0xe8e8f0] },
  { id: 'paint_sakura', kind: 'paint', rarity: 'N', name: 'SAKURA', info: 'MALOWANIE: SMAKI', colors: [0xffe6ee, 0xf08bb0, 0xc85a85, 0xffffff] },
  { id: 'paint_matcha', kind: 'paint', rarity: 'N', name: 'MATCHA', info: 'MALOWANIE: SMAKI', colors: [0xe9f0d0, 0x7a9a3a, 0x4a6a20, 0xf4ead2] },
  { id: 'paint_mikan', kind: 'paint', rarity: 'N', name: 'MIKAN', info: 'MALOWANIE: SMAKI', colors: [0xfff0d8, 0xf58a1c, 0xd05a10, 0x3a8a3a] },
  { id: 'paint_ramune', kind: 'paint', rarity: 'N', name: 'RAMUNE', info: 'MALOWANIE: SMAKI', colors: [0xe4f8ff, 0x3fc8e8, 0x1d8ab8, 0xffffff] },
  { id: 'paint_wasabi', kind: 'paint', rarity: 'N', name: 'WASABI', info: 'MALOWANIE: SMAKI', colors: [0xf0f4dc, 0x9ac83a, 0x5a8a20, 0x2a2a2a] },
  { id: 'paint_yuzu', kind: 'paint', rarity: 'N', name: 'YUZU', info: 'MALOWANIE: SMAKI', colors: [0xfffbe0, 0xf2d030, 0xc8a010, 0x6a9a30] },
  { id: 'paint_azuki', kind: 'paint', rarity: 'R', name: 'AZUKI', info: 'MALOWANIE: SMAKI', colors: [0xf0dcd8, 0x8a2a3a, 0x5a1a28, 0xe8c8a0] },
  { id: 'paint_kinako', kind: 'paint', rarity: 'R', name: 'KINAKO', info: 'MALOWANIE: SMAKI', colors: [0xf8ecd0, 0xc8a060, 0x8a6a3a, 0x5a3a20] },
  { id: 'paint_aizome', kind: 'paint', rarity: 'R', name: 'AIZOME', info: 'MALOWANIE: RZEMIOSŁO', colors: [0x1f3a6e, 0xe8eef8, 0x5c8ad0, 0xffffff] },
  { id: 'paint_asanoha', kind: 'paint', rarity: 'R', name: 'ASANOHA', info: 'MALOWANIE: RZEMIOSŁO', colors: [0xe8f4ec, 0x2a9a7a, 0x1a6a5a, 0xf0c040] },
  { id: 'paint_urushi', kind: 'paint', rarity: 'SR', name: 'URUSHI', info: 'MALOWANIE: RZEMIOSŁO', colors: [0x1c1a24, 0xe2aa32, 0x8a1a1e, 0xfff0a0] },
  { id: 'paint_kintsugi', kind: 'paint', rarity: 'SR', name: 'KINTSUGI', info: 'MALOWANIE: RZEMIOSŁO', colors: [0x2a3440, 0xf0c040, 0x5a6a7a, 0xfff4a8] },
  { id: 'paint_shibori', kind: 'paint', rarity: 'R', name: 'SHIBORI', info: 'MALOWANIE: RZEMIOSŁO', colors: [0xf0f0fa, 0x3a4ab0, 0x6a7ad8, 0x20286a] },
  { id: 'paint_washi', kind: 'paint', rarity: 'N', name: 'WASHI', info: 'MALOWANIE: RZEMIOSŁO', colors: [0xf4ead2, 0xc8b48c, 0xa8321a, 0x76624d] },
  { id: 'paint_koi', kind: 'paint', rarity: 'R', name: 'KOI', info: 'MALOWANIE: ZWIERZĘTA', colors: [0xffffff, 0xf04a20, 0x1a1a22, 0xf0c040] },
  { id: 'paint_tancho', kind: 'paint', rarity: 'R', name: 'TANCHŌ', info: 'MALOWANIE: ZWIERZĘTA', colors: [0xffffff, 0x1a1a22, 0xd8201a, 0xe8e8f0] },
  { id: 'paint_daruma', kind: 'paint', rarity: 'R', name: 'DARUMA', info: 'MALOWANIE: FIGURKI', colors: [0xd8201a, 0xffffff, 0x1a1a22, 0xf0c040] },
  { id: 'paint_maneki', kind: 'paint', rarity: 'R', name: 'MANEKI-NEKO', info: 'MALOWANIE: FIGURKI', colors: [0xffffff, 0xd8201a, 0xf0c040, 0x1a1a22] },
  { id: 'paint_kokeshi', kind: 'paint', rarity: 'N', name: 'KOKESHI', info: 'MALOWANIE: FIGURKI', colors: [0xf4d8b0, 0xd8402a, 0x2a2a2a, 0x3a8a4a] },
  { id: 'paint_shiba', kind: 'paint', rarity: 'N', name: 'SHIBA', info: 'MALOWANIE: ZWIERZĘTA', colors: [0xe8a050, 0xfff4e0, 0x8a5a2a, 0x1a1a22] },
  { id: 'paint_torii', kind: 'paint', rarity: 'R', name: 'TORII', info: 'MALOWANIE: SZTUKA', colors: [0xd8402a, 0x1a1a22, 0xf0c040, 0xffffff] },
  { id: 'paint_kabuki', kind: 'paint', rarity: 'SR', name: 'KABUKI', info: 'MALOWANIE: SZTUKA', colors: [0xffffff, 0xd8201a, 0x1a1a22, 0x2a7a4a] },
  { id: 'paint_sumie', kind: 'paint', rarity: 'R', name: 'SUMI-E', info: 'MALOWANIE: SZTUKA', colors: [0xf0f0f0, 0x2a2a30, 0x7a7a84, 0xb0b0b8] },
  { id: 'paint_wave', kind: 'paint', rarity: 'SR', name: 'WIELKA FALA', info: 'MALOWANIE: SZTUKA', colors: [0xf4ead2, 0x1f4a8a, 0x6aa0d0, 0xffffff] },
  { id: 'paint_noh', kind: 'paint', rarity: 'R', name: 'NŌ', info: 'MALOWANIE: SZTUKA', colors: [0xf4ecd8, 0x8a6a3a, 0x1a1a22, 0xa8321a] },
  { id: 'paint_shinkansen', kind: 'paint', rarity: 'R', name: 'SHINKANSEN', info: 'MALOWANIE: KOLEJ', colors: [0xffffff, 0x1a4ab0, 0x8ab0e8, 0xe8e8f0] },
  { id: 'paint_doctor', kind: 'paint', rarity: 'SR', name: 'ŻÓŁTY DOKTOR', info: 'MALOWANIE: KOLEJ', colors: [0xf8d020, 0x1a4ab0, 0xffffff, 0x2a2a2a] },
  { id: 'paint_taxi', kind: 'paint', rarity: 'N', name: 'TAKSÓWKA', info: 'MALOWANIE: MIASTO', colors: [0x1a1a22, 0xf0c040, 0x2a8a4a, 0xffffff] },
  { id: 'paint_neon', kind: 'paint', rarity: 'SR', name: 'NEON SHINJUKU', info: 'MALOWANIE: MIASTO', colors: [0x1a1430, 0xff3ac0, 0x3ae0ff, 0xf8f040] },
  { id: 'paint_famicom', kind: 'paint', rarity: 'R', name: 'FAMICOM', info: 'MALOWANIE: RETRO', colors: [0xf0e8d8, 0xa82030, 0xd0b070, 0x2a2a2a] },
  { id: 'paint_pocket', kind: 'paint', rarity: 'N', name: 'KIESZONKOWA KONSOLA', info: 'MALOWANIE: RETRO', colors: [0xc4cfa1, 0x6b7353, 0x414141, 0x8b956d] },
  { id: 'paint_arcade', kind: 'paint', rarity: 'SR', name: 'ARCADE', info: 'MALOWANIE: RETRO', colors: [0x1a1a2a, 0xff2a6a, 0x2affea, 0xffe02a] },
  { id: 'paint_city_kyoto', kind: 'paint', rarity: 'R', name: 'BARWY KIOTO', info: 'MALOWANIE: MIASTA', colors: [0xa8321a, 0xf0c040, 0x2a2a2a, 0xf4ead2] },
  { id: 'paint_city_okinawa', kind: 'paint', rarity: 'R', name: 'BARWY OKINAWY', info: 'MALOWANIE: MIASTA', colors: [0x2ac8d8, 0xfff4d0, 0xf04a6a, 0xffffff] },
  { id: 'paint_city_sapporo', kind: 'paint', rarity: 'R', name: 'BARWY SAPPORO', info: 'MALOWANIE: MIASTA', colors: [0xe8f4ff, 0x5c8ad0, 0x2a4a8a, 0xffffff] },
  { id: 'paint_city_kagoshima', kind: 'paint', rarity: 'R', name: 'BARWY KAGOSHIMY', info: 'MALOWANIE: MIASTA', colors: [0x4a4a52, 0xf0601a, 0xf8c020, 0x2a2a2a] },
  { id: 'paint_city_osaka', kind: 'paint', rarity: 'R', name: 'BARWY OSAKI', info: 'MALOWANIE: MIASTA', colors: [0xf8d020, 0xd8201a, 0x1a1a22, 0xffffff] },
  { id: 'paint_city_beppu', kind: 'paint', rarity: 'R', name: 'BARWY BEPPU', info: 'MALOWANIE: MIASTA', colors: [0xf4e8e0, 0xe87a5a, 0x6ab0c8, 0xffffff] },
  { id: 'paint_city_hiroshima', kind: 'paint', rarity: 'R', name: 'BARWY HIROSZIMY', info: 'MALOWANIE: MIASTA', colors: [0xf4f4f4, 0xd8201a, 0x2a7a4a, 0xf0c040] },
  { id: 'paint_city_nagasaki', kind: 'paint', rarity: 'R', name: 'BARWY NAGASAKI', info: 'MALOWANIE: MIASTA', colors: [0x2a3a7a, 0xf0c040, 0xd8402a, 0xffffff] },
  { id: 'paint_hanami', kind: 'paint', rarity: 'SR', name: 'HANAMI', info: 'MALOWANIE: PORY ROKU', colors: [0xffd8e6, 0xf08bb0, 0x7ab85a, 0xffffff] },
  { id: 'paint_hanabi', kind: 'paint', rarity: 'SR', name: 'LETNIE FAJERWERKI', info: 'MALOWANIE: PORY ROKU', colors: [0x14183a, 0xff5a3a, 0xf8d020, 0x3ac8ff] },
  { id: 'paint_momiji', kind: 'paint', rarity: 'SR', name: 'MOMIJI', info: 'MALOWANIE: PORY ROKU', colors: [0xf4e0c0, 0xd8401a, 0xf09a1a, 0x7a2a10] },
  { id: 'paint_snow', kind: 'paint', rarity: 'SR', name: 'ŚNIEG', info: 'MALOWANIE: PORY ROKU', colors: [0xffffff, 0xc8e0f8, 0x8ab0d8, 0xe8f4ff] },
  { id: 'paint_kyubi', kind: 'paint', rarity: 'SR', name: 'KYŪBI', info: 'MALOWANIE: YŌKAI', colors: [0xffffff, 0xf0c040, 0xd8402a, 0x3a2a20] },
  { id: 'paint_kappa', kind: 'paint', rarity: 'SR', name: 'KAPPA', info: 'MALOWANIE: YŌKAI', colors: [0x4a9a4a, 0xe8d890, 0x2a6a3a, 0xf0f0d0] },
  { id: 'paint_tengu', kind: 'paint', rarity: 'SR', name: 'TENGU', info: 'MALOWANIE: YŌKAI', colors: [0xd8201a, 0x1a1a22, 0xffffff, 0xf0c040] },
  { id: 'paint_akaoni', kind: 'paint', rarity: 'SR', name: 'CZERWONY ONI', info: 'MALOWANIE: YŌKAI', colors: [0xc8201a, 0xf0c040, 0x1a1a22, 0xf4e8d0] },
  { id: 'paint_yukionna', kind: 'paint', rarity: 'SR', name: 'YUKI-ONNA', info: 'MALOWANIE: YŌKAI', colors: [0xf0f8ff, 0xa8d0f0, 0x6a8ac8, 0xffffff] },
  { id: 'paint_kitsunebi', kind: 'paint', rarity: 'SR', name: 'KITSUNEBI', info: 'MALOWANIE: YŌKAI', colors: [0x1a2a5a, 0x3ae0b0, 0x8af8d8, 0xffffff] },
  { id: 'paint_tanuki', kind: 'paint', rarity: 'SR', name: 'TANUKI', info: 'MALOWANIE: YŌKAI', colors: [0x8a6a4a, 0xf0e0c0, 0x3a2a20, 0x2a8a4a] },
  { id: 'paint_nekomata', kind: 'paint', rarity: 'SR', name: 'NEKOMATA', info: 'MALOWANIE: YŌKAI', colors: [0x2a2a34, 0xf0c040, 0xe84a8a, 0xffffff] },
  { id: 'paint_bronze', kind: 'paint', rarity: 'SR', name: 'BRĄZ', info: 'MALOWANIE: METALE', colors: [0xb07a4a, 0xd09a6a, 0x7a4a2a, 0xf0c8a0] },
  { id: 'paint_copper', kind: 'paint', rarity: 'SR', name: 'MIEDŹ Z PATYNĄ', info: 'MALOWANIE: METALE', colors: [0xc86a3a, 0xe89a6a, 0x8a3a1a, 0x5ac8a0] },
  { id: 'paint_silver', kind: 'paint', rarity: 'SR', name: 'SREBRO', info: 'MALOWANIE: METALE', colors: [0xd0d4dc, 0xf4f6fa, 0x8a90a0, 0xffffff] },
  { id: 'paint_gold', kind: 'paint', rarity: 'SSR', name: 'ZŁOTO', info: 'MALOWANIE: METALE', colors: [0xf0c040, 0xfff0a0, 0xb88a1a, 0xffffff] },
  { id: 'paint_chrome', kind: 'paint', rarity: 'SSR', name: 'CZARNY CHROM', info: 'MALOWANIE: METALE', colors: [0x2a2c34, 0x5a5e6c, 0x14141a, 0xa0a8b8] },

  // ---- engine flames: a colour (two: from the nozzle to the tip), `long` stretches it
  { id: 'flame_blue', kind: 'flame', rarity: 'N', name: 'PŁOMIEŃ: BŁĘKITNY', info: 'KOLOR PŁOMIENIA SILNIKA', flame: { top: 0x5cc8ff } },
  { id: 'flame_green', kind: 'flame', rarity: 'N', name: 'PŁOMIEŃ: ZIELONY', info: 'KOLOR PŁOMIENIA SILNIKA', flame: { top: 0x6ae486 } },
  { id: 'flame_pink', kind: 'flame', rarity: 'N', name: 'PŁOMIEŃ: RÓŻOWY', info: 'KOLOR PŁOMIENIA SILNIKA', flame: { top: 0xff8ac0 } },
  { id: 'flame_violet', kind: 'flame', rarity: 'N', name: 'PŁOMIEŃ: FIOLETOWY', info: 'KOLOR PŁOMIENIA SILNIKA', flame: { top: 0xb070f0 } },
  { id: 'flame_white', kind: 'flame', rarity: 'N', name: 'PŁOMIEŃ: BIAŁY', info: 'KOLOR PŁOMIENIA SILNIKA', flame: { top: 0xffffff } },
  { id: 'flame_red', kind: 'flame', rarity: 'N', name: 'PŁOMIEŃ: CZERWONY', info: 'KOLOR PŁOMIENIA SILNIKA', flame: { top: 0xff4a3a } },
  { id: 'flame_teal', kind: 'flame', rarity: 'R', name: 'PŁOMIEŃ: TURKUSOWY', info: 'KOLOR PŁOMIENIA SILNIKA', flame: { top: 0x3ae0c8 } },
  { id: 'flame_gold', kind: 'flame', rarity: 'R', name: 'PŁOMIEŃ: ZŁOTY', info: 'KOLOR PŁOMIENIA SILNIKA', flame: { top: 0xffd040 } },
  { id: 'flame_ice', kind: 'flame', rarity: 'R', name: 'PŁOMIEŃ: LODOWY', info: 'KOLOR PŁOMIENIA SILNIKA', flame: { top: 0xc8f0ff } },
  { id: 'flame_lime', kind: 'flame', rarity: 'R', name: 'PŁOMIEŃ: LIMONKOWY', info: 'KOLOR PŁOMIENIA SILNIKA', flame: { top: 0xc8f040 } },
  { id: 'flame_indigo', kind: 'flame', rarity: 'R', name: 'PŁOMIEŃ: INDYGO', info: 'KOLOR PŁOMIENIA SILNIKA', flame: { top: 0x6a7af0 } },
  { id: 'flame_sakura', kind: 'flame', rarity: 'R', name: 'PŁOMIEŃ: SAKURA', info: 'KOLOR PŁOMIENIA SILNIKA', flame: { top: 0xffc8dc } },
  { id: 'flame_aurora', kind: 'flame', rarity: 'SR', name: 'PŁOMIEŃ: ZORZA', info: 'DWUBARWNY PŁOMIEŃ SILNIKA', flame: { top: 0x6ae486, bottom: 0xb070f0 } },
  { id: 'flame_sunset', kind: 'flame', rarity: 'SR', name: 'PŁOMIEŃ: ZACHÓD SŁOŃCA', info: 'DWUBARWNY PŁOMIEŃ SILNIKA', flame: { top: 0xffd040, bottom: 0xff4a8a } },
  { id: 'flame_fox', kind: 'flame', rarity: 'SR', name: 'PŁOMIEŃ: LISI OGIEŃ', info: 'DWUBARWNY PŁOMIEŃ SILNIKA', flame: { top: 0xc8fff0, bottom: 0x3a8aff } },
  { id: 'flame_lava', kind: 'flame', rarity: 'SR', name: 'PŁOMIEŃ: LAWA', info: 'DWUBARWNY PŁOMIEŃ SILNIKA', flame: { top: 0xfff0a0, bottom: 0xd8201a } },
  { id: 'flame_neon', kind: 'flame', rarity: 'SR', name: 'PŁOMIEŃ: NEON', info: 'DWUBARWNY PŁOMIEŃ SILNIKA', flame: { top: 0xff3ac0, bottom: 0x3ae0ff } },
  { id: 'flame_ramune', kind: 'flame', rarity: 'SR', name: 'PŁOMIEŃ: RAMUNE', info: 'DWUBARWNY PŁOMIEŃ SILNIKA', flame: { top: 0xffffff, bottom: 0x3fc8e8 } },
  { id: 'flame_burner', kind: 'flame', rarity: 'SSR', name: 'PŁOMIEŃ: DOPALACZ', info: 'DŁUGI PŁOMIEŃ SILNIKA', flame: { top: 0xc8f0ff, bottom: 0x5c8aff, long: 1.5 } },
  { id: 'flame_dragon', kind: 'flame', rarity: 'SSR', name: 'PŁOMIEŃ: SMOCZY ODDECH', info: 'DŁUGI PŁOMIEŃ SILNIKA', flame: { top: 0xfff0a0, bottom: 0xff5a1a, long: 1.6 } },

  // ---- dyes: a colour over the ship's shots, whatever the weapon
  { id: 'dye_red', kind: 'dye', rarity: 'N', name: 'BARWNIK: CZERWIEŃ', info: 'KOLOR TWOICH POCISKÓW', tint: 0xff6a5a },
  { id: 'dye_orange', kind: 'dye', rarity: 'N', name: 'BARWNIK: POMARAŃCZ', info: 'KOLOR TWOICH POCISKÓW', tint: 0xffa040 },
  { id: 'dye_gold', kind: 'dye', rarity: 'N', name: 'BARWNIK: ZŁOTO', info: 'KOLOR TWOICH POCISKÓW', tint: 0xffe060 },
  { id: 'dye_green', kind: 'dye', rarity: 'N', name: 'BARWNIK: ZIELEŃ', info: 'KOLOR TWOICH POCISKÓW', tint: 0x8af09a },
  { id: 'dye_mint', kind: 'dye', rarity: 'N', name: 'BARWNIK: MIĘTA', info: 'KOLOR TWOICH POCISKÓW', tint: 0x8af0d8 },
  { id: 'dye_blue', kind: 'dye', rarity: 'N', name: 'BARWNIK: BŁĘKIT', info: 'KOLOR TWOICH POCISKÓW', tint: 0x8ad0ff },
  { id: 'dye_indigo', kind: 'dye', rarity: 'R', name: 'BARWNIK: INDYGO', info: 'KOLOR TWOICH POCISKÓW', tint: 0x9a9aff },
  { id: 'dye_violet', kind: 'dye', rarity: 'R', name: 'BARWNIK: FIOLET', info: 'KOLOR TWOICH POCISKÓW', tint: 0xd08aff },
  { id: 'dye_pink', kind: 'dye', rarity: 'R', name: 'BARWNIK: RÓŻ', info: 'KOLOR TWOICH POCISKÓW', tint: 0xff9ad0 },
  { id: 'dye_lime', kind: 'dye', rarity: 'R', name: 'BARWNIK: LIMONKA', info: 'KOLOR TWOICH POCISKÓW', tint: 0xd8f060 },
  { id: 'dye_apricot', kind: 'dye', rarity: 'R', name: 'BARWNIK: MORELA', info: 'KOLOR TWOICH POCISKÓW', tint: 0xffc8a0 },
  { id: 'dye_ice', kind: 'dye', rarity: 'R', name: 'BARWNIK: LÓD', info: 'KOLOR TWOICH POCISKÓW', tint: 0xd0f4ff },
  // ---- wakes: what the ship scatters behind it when it moves (frames of the shared sprites; tints, a scale,
  // gravity `g`, growth, alpha, life in s and spin as the particle takes them)
  { id: 'wake_sakura', kind: 'wake', rarity: 'N', name: 'ŚLAD: PŁATKI SAKURY', info: 'SYPIE SIĘ ZA STATKIEM', wake: { frames: ['petal_0', 'petal_1', 'petal_2', 'petal_3'] } },
  { id: 'wake_momiji', kind: 'wake', rarity: 'N', name: 'ŚLAD: LIŚCIE KLONU', info: 'SYPIE SIĘ ZA STATKIEM', wake: { frames: ['momiji_0', 'momiji_1', 'momiji_2', 'momiji_3'] } },
  { id: 'wake_drops', kind: 'wake', rarity: 'N', name: 'ŚLAD: KROPLE', info: 'SYPIE SIĘ ZA STATKIEM', wake: { frames: ['drop_0', 'drop_1'], g: 30, spin: 0 } },
  { id: 'wake_snow', kind: 'wake', rarity: 'R', name: 'ŚLAD: LODOWE ODŁAMKI', info: 'SYPIE SIĘ ZA STATKIEM', wake: { frames: ['shard_0', 'shard_1', 'shard_2'] } },
  { id: 'wake_embers', kind: 'wake', rarity: 'R', name: 'ŚLAD: ŻAR', info: 'SYPIE SIĘ ZA STATKIEM', wake: { frames: ['ember_0', 'ember_1'], g: -10, spin: 0 } },
  { id: 'wake_sparks', kind: 'wake', rarity: 'R', name: 'ŚLAD: ISKRY', info: 'SYPIE SIĘ ZA STATKIEM', wake: { frames: ['spark_0', 'spark_1', 'spark_2'], life: 0.3, spin: 0 } },
  { id: 'wake_neon', kind: 'wake', rarity: 'R', name: 'ŚLAD: NEONOWE ISKRY', info: 'SYPIE SIĘ ZA STATKIEM', wake: { frames: ['dot_1', 'dot_2'], tints: [0xff4fb0, 0x4fe8ff, 0xffe04f, 0x9a7aff], spin: 0 } },
  { id: 'wake_steam', kind: 'wake', rarity: 'R', name: 'ŚLAD: PARA', info: 'SYPIE SIĘ ZA STATKIEM', wake: { frames: ['wisp_s_0', 'wisp_s_1'], g: -14, grow: 0.9, alpha: 0.5, spin: 0 } },
  { id: 'wake_gold', kind: 'wake', rarity: 'SR', name: 'ŚLAD: ZŁOTY PYŁ', info: 'SYPIE SIĘ ZA STATKIEM', wake: { frames: ['dot_1', 'dot_2'], tints: [0xffd040, 0xfff4a8, 0xf0a020], life: 0.7, spin: 0 } },
  { id: 'wake_foxfire', kind: 'wake', rarity: 'SR', name: 'ŚLAD: LISIE OGNIKI', info: 'SYPIE SIĘ ZA STATKIEM', wake: { frames: ['kitsunebi_0', 'kitsunebi_1'], g: -24, scale: 0.5, spin: 0 } },
  { id: 'wake_rainbow', kind: 'wake', rarity: 'SSR', name: 'ŚLAD: TĘCZOWY PYŁ', info: 'SYPIE SIĘ ZA STATKIEM', wake: { frames: ['dot_2'], tints: [0xff5a5a, 0xffa040, 0xffe04f, 0x6ae486, 0x4fc8ff, 0xb070f0], life: 0.8, spin: 0 } },
  { id: 'wake_cranes', kind: 'wake', rarity: 'SSR', name: 'ŚLAD: PAPIEROWE ŻURAWIE', info: 'SYPIE SIĘ ZA STATKIEM', wake: { frames: ['orizuru_0', 'orizuru_1', 'orizuru_2'], scale: 0.45, life: 0.8, spin: 0 } },
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
