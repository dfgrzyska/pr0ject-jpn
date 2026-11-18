// Per-city looks for the six archetypes: behaviour is shared, only the sprites change.
// '{c}' in carrier names is replaced by the carrier colour (red / blue / green). scale: shown smaller than drawn
// (Nagasaki's lanterns, kites, glass and castella came out bigger than the other cities' enemies).
// Sapporo adds mechanics on top: flocks with a bonus, ice armour, gliding divers, lobbing turrets,
// snowploughs and its own miniboss patterns (kind).
// a city's indestructible trap (enemies/traps.js): its four frames (at rest, glowing, bursting x2) drawn at 540 px
// in the shared atlas (tools/art/traps.mjs), the ground ring's colours, its size, its volley, how often it goes off
const trap = (city, zone, r, volley, every) => ({ frames: [0, 1, 2, 3].map((k) => `trap_${city}_${k}`), zone, r, volley, every });
// a city's ambusher (enemies/ambush.js): its five frames (hidden, stirring, half out, out, shooting) drawn at 540 px in
// the shared atlas (tools/art/ambush.mjs), and what bursts out with it
const ambush = (city, pop) => ({ frames: [0, 1, 2, 3, 4].map((k) => `amb_${city}_${k}`), pop });

export const SKINS = {
  nagasaki: {
    trap: trap('nagasaki', 'spark', 12, { kind: 'ring', n: 10 }, 4), // a fireworks mortar on the quay (enemies/traps.js)
    ambush: ambush('nagasaki', 'dust'), // a hook-tailed cat in a crate on the quay (enemies/ambush.js)
    nagasaki: true,
    popcorn: { frame: 'n_lantern_0', anim: 'n_lantern', scale: 0.75 },
    shooter: { frame: 'n_biidoro_0', anim: 'n_biidoro', scale: 0.8 },
    diver: { frame: 'n_hata_0', anim: 'n_hata', scale: 0.7 },
    carrier: { frame: 'n_castella_{c}_0', anim: 'n_castella_{c}', scale: 0.75 },
    heavy: { frame: 'n_oranda_0', anim: 'n_oranda', kind: 'oranda' },
    turret: { base: 'n_winch_base', head: 'n_winch_', wreck: 'n_winch_wreck', pattern: 'tide' },
  },
  kyoto: {
    trap: trap('kyoto', 'foxfire', 10, { kind: 'ring', n: 6 }, 3.6), // a stone lantern breathing fox fire (enemies/traps.js)
    ambush: ambush('kyoto', 'leaves'), // a white Inari fox in an azalea bush (enemies/ambush.js)
    popcorn: { frame: 'popcorn_0', anim: 'popcorn' },
    shooter: { frame: 'shooter_0', anim: 'shooter' },
    diver: { frame: 'diver_0', anim: 'diver' },
    carrier: { frame: 'carrier_{c}_0', anim: 'carrier_{c}' },
    heavy: { frame: 'tanuki_0', anim: 'tanuki', kind: 'tanuki' },
    tanuki: { frame: 'tanuki_0', anim: 'tanuki', kind: 'tanuki' }, // (the waves name it: look: 'tanuki')
    turret: { base: 'turret_base', head: 'turret_head_', wreck: 'turret_wreck' },
  },
  okinawa: {
    trap: trap('okinawa', 'water', 13, { kind: 'ring', n: 8 }, 3.4), // a blowhole in the reef (enemies/traps.js)
    ambush: ambush('okinawa', 'splash'), // a hermit crab under the sand (enemies/ambush.js)
    popcorn: { frame: 'tobiuo_0', anim: 'tobiuo' },
    shooter: { frame: 'hari_0', anim: 'hari' },
    diver: { frame: 'habu_0', anim: 'habu' },
    carrier: { frame: 'glass_{c}_0', anim: 'glass_{c}' },
    heavy: { frame: 'manta_0', anim: 'manta' },
    turret: { base: 'coral_base', head: 'coral_head_', wreck: 'coral_wreck' },
  },
  sapporo: {
    trap: trap('sapporo', 'snow', 10, { kind: 'fan', n: 5, speed: 'normal', arc: 0.8 }, 3.8), // a snow cannon (enemies/traps.js)
    ambush: ambush('sapporo', 'snow'), // a mountain hare in a snowdrift (enemies/ambush.js)
    popcorn: { frame: 'enaga_0', anim: 'enaga', flock: true },
    shooter: { frame: 'tourou_0_0', armor: 16, hp: 8 },
    diver: { frame: 'momonga_2', anim: 'momonga', path: 'glide' },
    carrier: { frame: 'ramen_{c}_0', anim: 'ramen_{c}' },
    heavy: { frame: 'yukionna_0', anim: 'yukionna', kind: 'yukionna' },
    turret: { base: 'yuki_base', head: 'yuki_head_', wreck: 'yuki_wreck', pattern: 'lob' },
    plow: { frame: 'plow_d_0', anim: 'plow_d', side: 'plow_r_0', sideAnim: 'plow_r', chute: 'plow_chute_', wreck: 'plow_wreck' },
  },
  // Kagoshima: bombs that split, aim-line snipers, lidded jars, surfacing kappa, melting shirokuma
  kagoshima: {
    trap: trap('kagoshima', 'ash', 14, { kind: 'ring', n: 5, big: true }, 3.4), // a fumarole breathing ash (enemies/traps.js)
    popcorn: { frame: 'kazan_0', anim: 'kazan', split: true },
    shooter: { frame: 'teppo_0', anim: 'teppo', sniper: true },
    diver: { frame: 'kappa_0', anim: 'kappa', path: 'submerge' },
    carrier: { frame: 'shirokuma_{c}_0', melt: 5.5 },
    heavy: { frame: 'raiju_0', anim: 'raiju', kind: 'raiju' },
    turret: { base: 'tsubo_base', head: 'tsubo_lid_', wreck: 'tsubo_wreck', lid: true },
  },
  // Osaka: every regular enemy comes as a manzai duo (see Enemies.duoDown)
  osaka: {
    trap: trap('osaka', 'fire', 11, { kind: 'ring', n: 8, k: 0.9 }, 3.6), // a takoyaki griddle on a stall (enemies/traps.js)
    ambush: ambush('osaka', 'dust'), // a little octopus under a manhole (enemies/ambush.js)
    duos: true,
    popcorn: { frame: 'takoyaki_0', anim: 'takoyaki' },
    shooter: { frame: 'fugu_0', anim: 'fugu' },
    diver: { frame: 'kushi_0', anim: 'kushi', spin: true },
    carrier: { frame: 'ame_{c}_0', anim: 'ame_{c}' },
    heavy: { frame: 'ningyo_0', kind: 'bunraku' },
    turret: { base: 'neko_base', head: 'neko_paw_', wreck: 'neko_wreck', beckon: true },
  },
  // Beppu: eggs that hatch into little oni, pots whose shots bounce off the walls, monkeys that steal
  // power, steam nozzles puffing clouds that swell, plus geysers and steam clouds as the environment
  beppu: {
    popcorn: { frame: 'tamago_0', hatch: 2.1 },
    shooter: { frame: 'kamado_0', anim: 'kamado', bounce: true },
    diver: { frame: 'saru_0', anim: 'saru', thief: true },
    carrier: { frame: 'oke_{c}_0', anim: 'oke_{c}' },
    heavy: { frame: 'wani_0', kind: 'wani' },
    turret: { base: 'yuzutsu_base', head: 'nozzle_', wreck: 'yuzutsu_wreck', pattern: 'puff' },
    geyser: { frame: 'boil_0', anim: 'boil', mud: 'mudboil_0', mudAnim: 'mudboil' },
    ambush: ambush('beppu', 'steam'), // a mud bozu in a boiling pool (enemies/ambush.js)
    steam: { frame: 'steamf_0' },
  },
  // Tokyo (docs/plan-tokyo.md): the longest city, its enemies in five sets, one per stretch of the flight (the
  // stage file's "sets"), drawn at 540 px (tools/art/tokyo/enemies.mjs). bits: what each set breaks into.
  tokyo: {
    trap: trap('tokyo', 'spark', 10, { kind: 'ring', n: 6, speed: 'normal', k: 0.85 }, 3.4), // a transformer on a pole (enemies/traps.js)
    ambush: ambush('tokyo', 'dust'), // a rat in a storm drain (enemies/ambush.js)
    popcorn: { frame: 't_karasu_0', anim: 't_karasu', flock: true },
    shooter: { frame: 't_kanban_0', anim: 't_kanban' },
    diver: { frame: 't_koma_0', anim: 't_koma' },
    carrier: { frame: 't_truck_{c}_0', anim: 't_truck_{c}' },
    heavy: { frame: 'manta_0', anim: 'manta' },
    kasa: { frame: 'ko_open_0', kind: 'kasa' }, // the first miniboss: KASA-OBAKE (tokyo-kasa.js)
    taiyaki: { frame: 'ty_kata_shut', kind: 'taiyaki' }, // the second miniboss: TAIYAKI (tokyo-taiyaki.js)
    turret: { base: 't_ac_base', head: 't_ac_', wreck: 't_ac_wreck' },
    bits: { frames: ['t_feather_0', 't_feather_1', 'dot_2'], tints: [0x2a2a34, 0x3a3e4c, 0x5a6070], speed: 60, life: 0.9, drag: 1.9, g: 14 },
    sets: {
      west: {},
      centre: {
        popcorn: { frame: 't_kasa_0', anim: 't_kasa' },
        shooter: { frame: 't_camera_0', anim: 't_camera' },
        diver: { frame: 't_kkasa_0', anim: 't_kkasa' },
        carrier: { frame: 't_rickshaw_{c}_0', anim: 't_rickshaw_{c}' },
        turret: { base: 't_yagura_base', head: 't_yagura_', wreck: 't_yagura_wreck' },
        bits: { frames: ['drop_0', 'drop_1', 't_paper_1'], tints: [0xc8e0f0, 0xe8f4ff, 0x8aa8c8], speed: 75, life: 0.5, drag: 2.4, g: 30 },
      },
      akiba: {
        popcorn: { frame: 't_pix_0', anim: 't_pix' },
        shooter: { frame: 't_capsule_0', anim: 't_capsule' },
        diver: { frame: 't_cart_0', anim: 't_cart' },
        carrier: { frame: 't_van_{c}_0', anim: 't_van_{c}' },
        turret: { base: 't_arcade_base', head: 't_arcade_', wreck: 't_arcade_wreck' },
        bits: { frames: ['dot_2', 'dot_2', 'dot_1'], tints: [0x60f0a0, 0xff70c0, 0x50d8f0, 0xf8e060], speed: 95, life: 0.45, drag: 2.4, g: 0 },
      },
      asakusa: {
        popcorn: { frame: 't_chochin_0', anim: 't_chochin' },
        shooter: { frame: 't_komainu_0', anim: 't_komainu' },
        diver: { frame: 't_uchiwa_0', anim: 't_uchiwa' },
        carrier: { frame: 't_mikoshi_{c}_0', anim: 't_mikoshi_{c}' },
        turret: { base: 't_censer_base', head: 't_censer_', wreck: 't_censer_wreck' },
        bits: { frames: ['t_paper_0', 't_paper_1', 'ember_0', 'ember_1'], tints: [0xe04030, 0xf4e8d8, 0xffc060, 0xff8040], speed: 58, life: 1, drag: 1.8, g: 12 },
      },
      bay: {
        popcorn: { frame: 't_kamome_0', anim: 't_kamome', flock: true },
        shooter: { frame: 't_buoy_0', anim: 't_buoy' },
        diver: { frame: 't_parcel_0', anim: 't_parcel' },
        carrier: { frame: 't_barge_{c}_0', anim: 't_barge_{c}' },
        turret: { base: 't_box_base', head: 't_box_', wreck: 't_box_wreck' },
        bits: { frames: ['t_feather_0', 't_feather_1', 'drop_0'], tints: [0xffffff, 0xe0e4ec, 0xb8ccdc], speed: 62, life: 0.9, drag: 1.9, g: 12 },
      },
    },
  },
  // Kawaguchiko (docs/plan-kawaguchiko.md): swarms of red dragonflies, the lake's bass leaping, the cap cloud off
  // Fuji spitting drops, strings of persimmons drying, the pilgrims' shrine with its mirror; the miniboss Kyoto's
  // stand-in until KACHI-KACHI USAGI is drawn (phase 11)
  kawaguchiko: {
    trap: trap('kawaguchiko', 'fire', 10, { kind: 'ring', n: 7 }, 3.8), // a bonfire of fallen leaves (enemies/traps.js)
    ambush: ambush('kawaguchiko', 'dust'), // a mole out of its hill in a garden (enemies/ambush.js)
    popcorn: { frame: 'k_tombo_0', anim: 'k_tombo', flock: true },
    shooter: { frame: 'k_kasagumo_0', anim: 'k_kasagumo' },
    diver: { frame: 'k_bass_0', anim: 'k_bass' },
    carrier: { frame: 'k_hoshigaki_{c}_0', anim: 'k_hoshigaki_{c}' },
    heavy: { frame: 'tanuki_0', anim: 'tanuki', kind: 'tanuki' }, // (the miniboss's place: KACHI-KACHI USAGI, phase 9)
    turret: { base: 'k_hokora_base', head: 'k_hokora_head_', wreck: 'k_hokora_wreck' },
  },
  // Hiroshima & Miyajima: maple-leaf spirit flocks, armored Seto oysters with pearl crits, scooping shamoji paddles,
  // tidal stone lanterns, Heike-gani samurai crab, and Sankibō the Great Tengu of Mount Misen
  hiroshima: {
    trap: trap('hiroshima', 'fire', 10, { kind: 'fan', n: 3, speed: 'normal', arc: 0.5 }, 3.4), // a fire basket on the shore (enemies/traps.js)
    ambush: ambush('hiroshima', 'splash'), // an anago eel in its hole in the flats (enemies/ambush.js)
    popcorn: { frame: 'tsuru_0', anim: 'tsuru', flock: true, crane: true },
    shooter: { frame: 'kaki_0', oyster: true, hp: 9 },
    diver: { frame: 'shamoji_0', anim: 'shamoji', scoop: true },
    carrier: { frame: 'manju_{c}_0', anim: 'manju_{c}' },
    heavy: { frame: 'heike_0', anim: 'heike', kind: 'heikegani', scale: 1.25 },
    turret: { base: 'hidoro_base', head: 'hidoro_head_', wreck: 'hidoro_wreck', pattern: 'tide' },
  },
};
