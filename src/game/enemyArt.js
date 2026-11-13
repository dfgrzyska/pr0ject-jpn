// The cities' enemies redrawn at 540 px (docs/enemies-540-plan.md). A city that has them names its atlas in
// its stage file ("enemyArt": true): bg/<id>/enemies.png, loaded and released with its backgrounds, its frames
// drawn at RENDER_SCALE times the old size under the old names (and a few new ones for longer animations).
// Only the enemies' own pools look frames up here (see Pool): bullets, effects and pickups keep the shared
// atlas even where they borrow an enemy's frame name.
import { RENDER_SCALE } from '../config.js';

const where = new Map(); // frame name -> texture key of the city atlas that has it
const hi = new Set(); // frames sprites540 has: the shared sprites (effects, bullets, the ship...) at 540 px

/** sprites540 is in: its frames are taken from there (docs/graphics-540-plan.md, step 6). */
export function registerSharedHi(textures) {
  if (!textures.exists('sprites540')) return;
  for (const name of textures.get('sprites540').getFrameNames()) hi.add(name);
}

/** The texture a shared frame comes from: sprites540 when it has it, else the old sprites atlas. */
export function spriteTexture(frame) {
  return hi.has(frame) ? 'sprites540' : 'sprites';
}

/**
 * An image or sprite made on the old atlas, moved to sprites540 when its frame is drawn there: from then on its
 * setScale is in the old art's terms (the third of the 540 px art is applied under it) and setFrame takes a frame
 * from whichever atlas has it. Returns the object.
 */
export function sharedArt(obj) {
  if (obj.sharedArt) return obj;
  obj.sharedArt = true;
  const rawScale = obj.setScale;
  const rawFrame = obj.setFrame;
  let lx = obj.scaleX;
  let ly = obj.scaleY;
  const apply = () => rawScale.call(obj, lx * baseScale(obj.texture.key), ly * baseScale(obj.texture.key));
  obj.setScale = function (x, y = x) {
    lx = x;
    ly = y;
    apply();
    return this;
  };
  obj.setFrame = function (frame, ...rest) {
    const key = spriteTexture(frame);
    if (this.texture.key !== key) this.setTexture(key, frame);
    else rawFrame.call(this, frame, ...rest);
    apply();
    return this;
  };
  return obj.setFrame(obj.frame.name);
}

/** The texture for an animation of shared frames: sprites540 only when it has every one of them. */
export function spriteAnimTexture(frames) {
  return frames.every((f) => hi.has(f)) ? 'sprites540' : 'sprites';
}

/** Scale a sprite from this texture is shown at (city atlases are drawn at RENDER_SCALE). */
export function baseScale(key) {
  return key === 'sprites' ? 1 : 1 / RENDER_SCALE;
}

/** The texture an enemy frame comes from: its city's atlas when that is in, else the shared one. */
export function enemyTexture(frame) {
  return where.get(frame) ?? spriteTexture(frame);
}

/** Is this frame in a city atlas that is in now? */
export function hasEnemyFrame(frame) {
  return where.has(frame);
}

export function registerEnemyAtlas(textures, key) {
  for (const name of textures.get(key).getFrameNames()) where.set(name, key);
}

export function unregisterEnemyAtlas(key) {
  for (const [name, k] of where) if (k === key) where.delete(name);
}

/**
 * Animations whose frames come from a city atlas when it is in: { key: [frames, frameRate] }. When the atlas
 * comes in, every one of these whose frames are all in it replaces the shared-atlas one of the same key
 * (so e.play('tanuki') in the game code doesn't change); when it goes, the shared one comes back.
 */
const four = (name) => [0, 1, 2, 3].map((i) => `${name}_${i}`);
export const CITY_ANIMS = {
  // Kyoto
  popcorn: [four('popcorn'), 8],
  shooter: [four('shooter'), 6],
  diver: [four('diver'), 6],
  tanuki: [four('tanuki'), 4],
  tanuki_leaf: [four('tanuki_leaf'), 4],
  tanuki_poof: [['tanuki_poof_0', 'tanuki_poof_1', 'tanuki_poof_2'], 12, 0], // (once: a copy going back to leaves)
  ...Object.fromEntries(['red', 'blue', 'green', 'purple'].map((c) => [`carrier_${c}`, [four(`carrier_${c}`), 10]])),
  // Okinawa
  tobiuo: [four('tobiuo'), 10], hari: [four('hari'), 6], habu: [four('habu'), 7],
  manta: [[0, 1, 2, 3, 4, 5].map((i) => `manta_${i}`), 7],
  shisa_a: [four('shisa_a'), 4], shisa_un: [four('shisa_un'), 4],
  shisa_soul: [four('shisa_soul'), 12],
  ...Object.fromEntries(['red', 'blue', 'green', 'purple'].map((c) => [`glass_${c}`, [four(`glass_${c}`), 10]])),
  // Sapporo
  enaga: [four('enaga'), 11], momonga: [['momonga_0', 'momonga_1'], 5], wisp: [four('wisp'), 10],
  yukionna: [four('yukionna'), 6], kuma_heart: [['kuma_heart_0', 'kuma_heart_1'], 3],
  plow_d: [four('plow_d'), 8], plow_r: [four('plow_r'), 8],
  ...Object.fromEntries(['red', 'blue', 'green', 'purple'].map((c) => [`ramen_${c}`, [four(`ramen_${c}`), 5]])),
  // Kagoshima
  kazan: [four('kazan'), 8], kazan_s: [four('kazan_s'), 10], teppo: [four('teppo'), 10], kappa: [four('kappa'), 7],
  ripple: [['ripple_0', 'ripple_1', 'ripple_2'], 6], raiju: [four('raiju'), 10],
  vent: [['vent_0', 'vent_1'], 4], crater: [['crater_0', 'crater_1'], 3],
  crater_open: [four('crater_open'), 5, 0], // (once: the crust breaking, then 'crater')
  // Osaka
  takoyaki: [four('takoyaki'), 8], fugu: [four('fugu'), 5], kushi: [four('kushi'), 12],
  kuroko: [['kuroko_0', 'kuroko_1'], 3], tako: [['tako_0', 'tako_1'], 2],
  ...Object.fromEntries(['red', 'blue', 'green', 'purple'].map((c) => [`ame_${c}`, [four(`ame_${c}`), 8]])),
  // Beppu
  imp: [four('imp'), 8], kamado: [four('kamado'), 6], saru: [four('saru'), 10],
  boil: [['boil_0', 'boil_1'], 10], mudboil: [['mudboil_0', 'mudboil_1'], 5],
  ...Object.fromEntries(['red', 'blue', 'green', 'purple'].map((c) => [`oke_${c}`, [four(`oke_${c}`), 4]])),
  // Hiroshima
  tsuru: [four('tsuru'), 9], shamoji: [four('shamoji'), 7], heike: [four('heike'), 6],
  heike_c: [[0, 1, 2, 3].map((i) => `heike_${i}_c`), 6], // (its cracked shell in phase 2)
  sankibo: [four('sankibo'), 5], brazier: [four('brazier'), 9],
  ...Object.fromEntries(['red', 'blue', 'green', 'purple'].map((c) => [`manju_${c}`, [four(`manju_${c}`), 6]])),
  // Nagasaki
  n_lantern: [four('n_lantern'), 5], n_biidoro: [four('n_biidoro'), 5], n_hata: [four('n_hata'), 7],
  n_ja: [four('n_ja'), 6], n_oranda: [['n_oranda_0', 'n_oranda_1'], 5],
  n_cannon_smoke: [four('n_cannon_smoke'), 10, 0], // (once: gun smoke out of a port)
  ...Object.fromEntries(['red', 'blue', 'green', 'purple'].map((c) => [`n_castella_${c}`, [four(`n_castella_${c}`), 5]])),
};

/** Kyūbi's tails: how many swaying frames each one has in the atlas it comes from. */
export function tailFrames() {
  return enemyTexture('kyubi_tail_0_3') === 'sprites' ? 3 : 6;
}

/**
 * The portraits of the yōkai album and the bosses' parade (portraits.png, drawn at RENDER_SCALE): set
 * `img` to `frame` from there when it has it, else from the shared atlas. Returns the image's base scale.
 */
export function portrait(scene, img, frame) {
  const tex = scene.textures;
  const hi = Boolean(tex?.exists?.('portraits') && tex.get('portraits').has(frame));
  const key = hi ? 'portraits' : 'sprites';
  if (img.texture && img.texture.key !== key) img.setTexture(key, frame);
  else img.setFrame(frame);
  return hi ? 1 / RENDER_SCALE : 1;
}
