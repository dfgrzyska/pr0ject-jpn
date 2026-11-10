// The cities' enemies redrawn at 540 px (docs/enemies-540-plan.md). A city that has them names its atlas in
// its stage file ("enemyArt": true): bg/<id>/enemies.png, loaded and released with its backgrounds, its frames
// drawn at RENDER_SCALE times the old size under the old names (and a few new ones for longer animations).
// Only the enemies' own pools look frames up here (see Pool): bullets, effects and pickups keep the shared
// atlas even where they borrow an enemy's frame name.
import { RENDER_SCALE } from '../config.js';

const where = new Map(); // frame name -> texture key of the city atlas that has it

/** Scale a sprite from this texture is shown at (city atlases are drawn at RENDER_SCALE). */
export function baseScale(key) {
  return key === 'sprites' ? 1 : 1 / RENDER_SCALE;
}

/** The texture an enemy frame comes from: its city's atlas when that is in, else the shared one. */
export function enemyTexture(frame) {
  return where.get(frame) ?? 'sprites';
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
  ...Object.fromEntries(['red', 'blue', 'green'].map((c) => [`carrier_${c}`, [four(`carrier_${c}`), 10]])),
  // Okinawa
  tobiuo: [four('tobiuo'), 10], hari: [four('hari'), 6], habu: [four('habu'), 7],
  manta: [[0, 1, 2, 3, 4, 5].map((i) => `manta_${i}`), 7],
  shisa_a: [four('shisa_a'), 4], shisa_un: [four('shisa_un'), 4],
  ...Object.fromEntries(['red', 'blue', 'green'].map((c) => [`glass_${c}`, [four(`glass_${c}`), 10]])),
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
