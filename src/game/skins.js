// Per-city looks for the six archetypes: behaviour is shared, only the sprites change.
// '{c}' in carrier names is replaced by the carrier colour (red / blue / green).
// Sapporo adds mechanics on top: flocks with a bonus, ice armour, gliding divers, lobbing turrets,
// snowploughs and its own miniboss patterns (kind).
export const SKINS = {
  kyoto: {
    popcorn: { frame: 'popcorn_0', anim: 'popcorn' },
    shooter: { frame: 'shooter_0', anim: 'shooter' },
    diver: { frame: 'diver_0', anim: 'diver' },
    carrier: { frame: 'carrier_{c}_0', anim: 'carrier_{c}' },
    heavy: { frame: 'kyubi_0', anim: 'kyubi' },
    tanuki: { frame: 'tanuki_0', anim: 'tanuki', kind: 'tanuki' }, // second heavy: waves with look: 'tanuki'
    turret: { base: 'turret_base', head: 'turret_head_', wreck: 'turret_wreck' },
  },
  okinawa: {
    popcorn: { frame: 'tobiuo_0', anim: 'tobiuo' },
    shooter: { frame: 'hari_0', anim: 'hari' },
    diver: { frame: 'habu_0', anim: 'habu' },
    carrier: { frame: 'glass_{c}_0', anim: 'glass_{c}' },
    heavy: { frame: 'manta_0', anim: 'manta' },
    turret: { base: 'coral_base', head: 'coral_head_', wreck: 'coral_wreck' },
  },
  sapporo: {
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
    popcorn: { frame: 'kazan_0', anim: 'kazan', split: true },
    shooter: { frame: 'teppo_0', anim: 'teppo', sniper: true },
    diver: { frame: 'kappa_0', anim: 'kappa', path: 'submerge' },
    carrier: { frame: 'shirokuma_{c}_0', melt: 5.5 },
    heavy: { frame: 'raiju_0', anim: 'raiju', kind: 'raiju' },
    turret: { base: 'tsubo_base', head: 'tsubo_lid_', wreck: 'tsubo_wreck', lid: true },
  },
  // Osaka: every regular enemy comes as a manzai duo (see Enemies.duoDown)
  osaka: {
    duos: true,
    popcorn: { frame: 'takoyaki_0', anim: 'takoyaki' },
    shooter: { frame: 'fugu_0', anim: 'fugu' },
    diver: { frame: 'kushi_0', anim: 'kushi', spin: true },
    carrier: { frame: 'ame_{c}_0', anim: 'ame_{c}' },
    heavy: { frame: 'ningyo_0', kind: 'bunraku' },
    turret: { base: 'neko_base', head: 'neko_paw_', wreck: 'neko_wreck', beckon: true },
  },
};
