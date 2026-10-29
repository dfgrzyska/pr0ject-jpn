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
};
