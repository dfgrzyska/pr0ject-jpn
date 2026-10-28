// Sprite definitions: player ship, enemies (Fushimi Inari robot designs), bullets, pickups, FX, UI.
import { Mask, renderMask } from '../lib/spritekit.mjs';
import { Raster, fbm, bayer } from '../lib/raster.mjs';

const out = [];
const add = (name, raster) => out.push({ name, raster });
const fromRows = (rows, mirror, remap) => {
  const m = Mask.fromRows(rows, mirror);
  if (remap) m.remap(remap);
  return m;
};

// ---------------------------------------------------------------- player
// "Kitsune-1": white interceptor with vermilion leading edges. Rows are left halves (mirrored).
const SHIP = [
  '.......W',
  '......WW',
  '......WW',
  '......WC',
  '.....WCc',
  '.....WCC',
  '.....WWC',
  '.....WWW',
  '....RWWW',
  '...RSWWR',
  '..RSSWWR',
  '.RSSSWWR',
  'RSSSSWWW',
  'RSSSDDWW',
  'RRS.DDWW',
  '....DD.W',
  '....DD..',
];
// Banked frames: lean the silhouette by shortening one wing.
function shipFrame(bank) {
  const m = fromRows(SHIP, true);
  if (bank) {
    // bank < 0: rolling left -> left wing foreshortened, right wing shows its underside.
    const side = bank < 0 ? 0 : 1;
    for (let y = 0; y < m.h; y++) {
      const row = m.g[y];
      if (side === 0) {
        // shift the outer left wing (cols 0..3) one step towards the body
        for (let x = 3; x >= 1; x--) row[x] = row[x - 1];
        row[0] = '.';
      } else {
        for (let x = m.w - 4; x < m.w - 1; x++) row[x] = row[x + 1];
        row[m.w - 1] = '.';
      }
    }
  }
  return renderMask(m);
}
add('ship', shipFrame(0));
add('ship_l', shipFrame(-1));
add('ship_r', shipFrame(1));

// Engine flames (no outline), drawn under the ship's two nozzles.
const FLAMES = [
  ['hh...hh', 'yy...yy', 'oo...oo'],
  ['hh...hh', 'yy...yy', 'yo...oy', '.o...o.'],
  ['hh...hh', 'hy...yh', 'yy...yy', 'oo...oo', '.o...o.'],
];
FLAMES.forEach((rows, i) => add(`flame_${i}`, renderMask(fromRows(rows), { outline: false })));

add('hitbox', renderMask(fromRows(['.kkk.', 'kwwwk', 'kwmwk', 'kwwwk', '.kkk.']), { outline: false }));

// ---------------------------------------------------------------- enemies
// Popcorn: kitsune-mask drone (Inari's fox messengers, rebuilt as cheap swarm drones).
const POPCORN = [
  '.F....',
  '.FR...',
  '.FRF..',
  '.FFFFF',
  'SFRRFF',
  'SRmmFF',
  'SFFFFF',
  '..FRFF',
  '...FFF',
  '....FK',
];
add('popcorn_0', renderMask(fromRows(POPCORN, true)));
add('popcorn_1', renderMask(fromRows(POPCORN.map((r, i) => (i === 5 ? 'SRmwFF' : r)), true)));

// Shooter: gunship hung under a torii lintel (kasagi as the wing).
const SHOOTER = [
  'K..........',
  'KKKKKKKKKKK',
  '.RRRRRRRRRR',
  '...R.....SS',
  '..RRRRRRRSS',
  '...R....SSS',
  '...R...SSDD',
  '..DDD..SDDD',
  '..DDD..SDDM',
  '..DSD..SDMM',
  '..DSD...DMM',
  '...S.....DM',
  '..........D',
];
add('shooter_0', renderMask(fromRows(SHOOTER, true)));
add('shooter_1', renderMask(fromRows(SHOOTER.map((r, i) => (i === 10 ? '..DyD...DMM' : r)), true)));

// Diver: karasu-tengu dive drone.
const DIVER_A = [
  'D.......',
  'DD......',
  'RDD...DD',
  '.RDD.DDD',
  '.RDDDDDD',
  '..RDDDDK',
  '...DDDKK',
  '....DDMK',
  '.....DKK',
  '......YY',
  '.......Y',
];
const DIVER_B = [
  '........',
  '........',
  '.R....DD',
  '.RD..DDD',
  '..RDDDDD',
  '..RDDDDK',
  '...DDDKK',
  '....DDMK',
  '.....DKK',
  '......YY',
  '.......Y',
];
add('diver_0', renderMask(fromRows(DIVER_A, true)));
add('diver_1', renderMask(fromRows(DIVER_B, true)));

// Carrier: winged hōju (wish-jewel) drone, three colours = three weapons.
const CARRIER_A = [
  '......X',
  '.....XX',
  '....XXX',
  '...YXXX',
  'SS.YXXw',
  'SSSYXXX',
  'SS.YXXX',
  '...YYXX',
  '....YYY',
  '.....YD',
  '......D',
];
const CARRIER_B = CARRIER_A.map((r, i) => (i === 4 ? '.S.YXXw' : i === 6 ? '.S.YXXX' : r));
for (const [col, mat] of [['red', 'R'], ['blue', 'B'], ['green', 'G']]) {
  add(`carrier_${col}_0`, renderMask(fromRows(CARRIER_A, true, { X: mat })));
  add(`carrier_${col}_1`, renderMask(fromRows(CARRIER_B, true, { X: mat })));
}

// Turret: armoured stone lantern (tōrō). Fixed base + 16-direction head.
function turretBase(wreck) {
  const m = new Mask(15, 15);
  m.rect(1, 1, 13, 13, 'E');
  for (const [x, y] of [[0, 2], [0, 12], [14, 2], [14, 12], [2, 0], [12, 0], [2, 14], [12, 14]]) m.set(x, y, 'E');
  m.rect(3, 3, 9, 9, 'e');
  m.rect(4, 4, 7, 7, 'E');
  for (const [x, y] of [[1, 1], [13, 1], [1, 13], [13, 13]]) m.set(x, y, 'K');
  if (wreck) {
    const pts = [[5, 5], [6, 5], [7, 6], [8, 6], [9, 7], [6, 7], [7, 7], [8, 8], [5, 8], [6, 9], [9, 9], [7, 9], [4, 7], [10, 5]];
    for (const [x, y] of pts) m.set(x, y, 'n');
    for (const [x, y] of [[7, 8], [6, 6], [8, 7]]) m.set(x, y, 'k');
    m.set(10, 9, 'Q');
    m.set(4, 6, 'Q');
  }
  return renderMask(m);
}
add('turret_base', turretBase(false));
add('turret_wreck', turretBase(true));

const TURRET_HEAD = fromRows([
  '.............',
  '....KKKKK....',
  '...KKKKKKK...',
  '..KKKKKKKKK..',
  '..KKKYYYKKK..',
  '..KKYYyYYKK..',
  '..KKKYYYKKK..',
  '..KKKKKKKKK..',
  '...KMMMMMK...',
  '....DDDDD....',
  '.....DDD.....',
  '.....DDD.....',
  '.....DDD.....',
]);
for (let i = 0; i < 16; i++) add(`turret_head_${i}`, renderMask(TURRET_HEAD.rotated((i / 16) * Math.PI * 2, 13)));

// Heavy: flying mikoshi (portable shrine) gunship with four rotor pods.
function heavyFrame(f) {
  const W = 39;
  const H = 37;
  const m = new Mask(W, H);
  const cx = 19;
  // carrying poles
  m.rect(7, 2, 2, 33, 'N');
  m.rect(30, 2, 2, 33, 'N');
  m.rect(7, 0, 2, 2, 'Y');
  m.rect(30, 0, 2, 2, 'Y');
  m.rect(7, 35, 2, 2, 'Y');
  m.rect(30, 35, 2, 2, 'Y');
  // crossbars
  m.rect(9, 9, 2, 2, 'N');
  m.rect(28, 9, 2, 2, 'N');
  m.rect(9, 26, 2, 2, 'N');
  m.rect(28, 26, 2, 2, 'N');
  // rotor pods
  for (const [px, py] of [[3, 7], [35, 7], [3, 29], [35, 29]]) {
    m.line(px, py, px < cx ? 7 : 31, py, 'S');
    m.disc(px + 0.5, py + 0.5, 3.6, 'S');
    m.disc(px + 0.5, py + 0.5, 1.6, 'D');
    if (f === 0) m.line(px - 3, py, px + 3, py, 'w');
    else m.line(px, py - 3, px, py + 3, 'w');
    m.set(px, py, 'M');
  }
  // roof (pyramid, hōgyō-zukuri) with gold ridges
  m.rect(11, 5, 17, 20, 'K');
  for (let x = 11; x < 28; x++) {
    m.set(x, 5, 'Y');
    m.set(x, 24, 'Y');
  }
  for (let y = 5; y < 25; y++) {
    m.set(11, y, 'Y');
    m.set(27, y, 'Y');
  }
  m.line(11, 5, cx, 14, 'Y');
  m.line(27, 5, cx, 14, 'Y');
  m.line(11, 24, cx, 15, 'Y');
  m.line(27, 24, cx, 15, 'Y');
  // gold phoenix (hō-ō) finial
  m.line(14, 12, cx, 15, 'Y');
  m.line(24, 12, cx, 15, 'Y');
  m.line(13, 11, 15, 11, 'Y');
  m.line(23, 11, 25, 11, 'Y');
  m.rect(cx, 10, 1, 9, 'Y');
  m.set(cx, 9, 'y');
  m.set(cx - 1, 19, 'Y');
  m.set(cx + 1, 19, 'Y');
  m.set(cx, 13, 'M');
  // front facade (seen in 3/4): vermilion walls, gold doors
  m.rect(12, 25, 15, 5, 'R');
  m.rect(16, 25, 7, 5, 'Y');
  m.rect(19, 25, 1, 5, 'K');
  m.rect(12, 25, 1, 5, 'K');
  m.rect(26, 25, 1, 5, 'K');
  // cannons
  m.rect(13, 30, 3, 4, 'D');
  m.rect(23, 30, 3, 4, 'D');
  m.set(14, 33, 'k');
  m.set(24, 33, 'k');
  // lanterns at the roof corners
  for (const [x, y] of [[12, 6], [26, 6], [12, 23], [26, 23]]) m.set(x, y, 'M');
  return renderMask(m);
}
add('heavy_0', heavyFrame(0));
add('heavy_1', heavyFrame(1));

// ---------------------------------------------------------------- pickups
const PICKUP = [
  '....X....',
  '...XXX...',
  '..XXXXX..',
  '.XXwXXXX.',
  '.XwXXXXX.',
  '.XXXXXXX.',
  '..XXXXX..',
  '...YYY...',
  '..YYYYY..',
];
for (const [col, mat] of [['red', 'R'], ['blue', 'B'], ['green', 'G']]) add(`pickup_${col}`, renderMask(fromRows(PICKUP, false, { X: mat })));

// ---------------------------------------------------------------- bullets
const raw = (rows) => renderMask(fromRows(rows), { outline: false });
add('eb_s', raw(['.kkk.', 'kxvxk', 'kvwvk', 'kxvxk', '.kkk.']));
add('eb_m', raw(['..kkk..', '.kxxxk.', 'kxvwvxk', 'kxwwwxk', 'kxvwvxk', '.kxxxk.', '..kkk..']));
add('ps_needle', raw(['.h.', 'yhy', 'yhy', 'yhy', 'oyo', '.o.', '.o.']));
add('ps_spread', raw(['.oro.', 'orhro', 'rhhhr', 'orhro', '.oro.']));
add('ps_laser_1', raw(['.c.', 'aca', 'aha', 'aha', 'aha', 'aha', 'aha', 'aha', 'aha', 'aha', 'aha', 'aca', '.a.', '.z.']));
add('ps_laser_2', raw(['..c..', '.aca.', 'zahaz', 'zahaz', 'zahaz', 'zahaz', 'zahaz', 'zahaz', 'zahaz', 'zahaz', 'zahaz', 'zahaz', 'zahaz', '.aca.', '.zaz.', '..z..']));
add('ps_laser_3', raw(['...c...', '..aca..', '.zahaz.', 'zachcaz', 'zachcaz', 'zachcaz', 'zachcaz', 'zachcaz', 'zachcaz', 'zachcaz', 'zachcaz', 'zachcaz', 'zachcaz', 'zachcaz', '.zahaz.', '..aca..', '..zaz..', '...z...']));
add('ps_homing_0', raw(['...g...', '..gjg..', '.gjhjg.', '.jhhhj.', '.gjhjg.', '..gjg..', '...l...']));
add('ps_homing_1', raw(['..g....', '..gjg..', '.gjhjg.', '.jhhhj.', '.ljhjl.', '..ljl..', '.......']));

// ---------------------------------------------------------------- FX
const FIRE = [
  [0.78, 0xffffff],
  [0.6, 0xfff3a0],
  [0.42, 0xffa040],
  [0.26, 0xe8401e],
  [0.1, 0x8a1a1e],
  [-0.12, 0x3a3448],
];
function explosion(size, frames, seed) {
  for (let f = 0; f < frames; f++) {
    const t = f / (frames - 1);
    const r = new Raster(size, size);
    const c = size / 2;
    const R = (size / 2 - 1) * (0.35 + 0.65 * (1 - (1 - t) * (1 - t)));
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const d = Math.hypot(x + 0.5 - c, y + 0.5 - c) / R;
        if (d > 1) continue;
        const n = fbm(x, y, { seed, scale: size / 4, octaves: 3 });
        if (t > 0.45 && n < (t - 0.45) * 1.4 + d * 0.3) continue; // dissipating holes
        const heat = 1.05 - t * 1.15 - d * 0.55 + (n - 0.5) * 0.6;
        const band = FIRE.find(([th]) => heat > th);
        if (band) r.set(x, y, band[1]);
      }
    add(`${size === 16 ? 'expl_s' : size === 28 ? 'expl_m' : 'expl_l'}_${f}`, r);
  }
}
explosion(16, 5, 7);
explosion(28, 6, 11);
explosion(48, 8, 23);

add('spark_0', raw(['..y..', '..h..', 'yhwhy', '..h..', '..y..']));
add('spark_1', raw(['y...y', '.o.o.', '..h..', '.o.o.', 'y...y']));
add('spark_2', raw(['o...o', '.....', '..o..', '.....', 'o...o']));

// Sakura petals (near layer + bomb).
add('petal_0', raw(['.qq', 'qpq', 'uq.']));
add('petal_1', raw(['qq.', 'qpq', '.qu']));
add('petal_2', raw(['.q.', 'qpq', 'qpq', '.u.']));
add('petal_3', raw(['qqp', 'uqq']));

// Mist puffs (near layer): dithered white with soft alpha.
function mist(w, h, seed, name) {
  const r = new Raster(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - w / 2) / (w / 2);
      const dy = (y + 0.5 - h / 2) / (h / 2);
      const d = dx * dx + dy * dy;
      const n = fbm(x, y, { seed, scale: 10, octaves: 3 });
      const v = (1 - d) * 0.9 + (n - 0.5) * 0.9;
      if (v > bayer(x, y) * 0.9) r.set(x, y, 0xf4f0ff, v > 0.55 ? 0.85 : 0.5);
    }
  add(name, r);
}
mist(48, 22, 3, 'mist_0');
mist(36, 18, 9, 'mist_1');

// ---------------------------------------------------------------- UI
function sakura(m, cx, cy, petalR, dist) {
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    m.disc(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, petalR, 'P');
  }
  m.disc(cx, cy, Math.max(1, petalR * 0.55), 'Y');
}
{
  const m = new Mask(11, 11);
  sakura(m, 5.5, 5.7, 2.1, 2.7);
  add('icon_bomb', renderMask(m));
}
{
  const m = new Mask(29, 29);
  m.disc(14.5, 14.5, 14, 'S');
  m.disc(14.5, 14.5, 12.5, 'K');
  sakura(m, 14.5, 14.8, 4, 5.2);
  add('btn_bomb', renderMask(m, { outline: false }));
}
{
  const m = new Mask(15, 15);
  m.disc(7.5, 7.5, 7, 'S');
  m.disc(7.5, 7.5, 5.8, 'K');
  m.rect(5, 4, 2, 7, 'W');
  m.rect(9, 4, 2, 7, 'W');
  add('btn_pause', renderMask(m, { outline: false }));
}
for (const on of [true, false]) {
  const m = new Mask(15, 15);
  m.disc(7.5, 7.5, 7, 'S');
  m.disc(7.5, 7.5, 5.8, 'K');
  m.rect(3, 6, 2, 3, 'W');
  m.rect(5, 5, 1, 5, 'W');
  m.rect(6, 4, 1, 7, 'W');
  if (on) {
    m.set(8, 6, 'W');
    m.set(8, 8, 'W');
    m.line(10, 4, 11, 6, 'W');
    m.line(11, 7, 11, 8, 'W');
    m.line(11, 9, 10, 11, 'W');
  } else {
    m.line(8, 5, 11, 9, 'M');
    m.line(11, 5, 8, 9, 'M');
  }
  add(on ? 'btn_sound_on' : 'btn_sound_off', renderMask(m, { outline: false }));
}
add('icon_life', renderMask(fromRows(['...W', '..WC', '..WW', '.RWW', 'RSSW', 'R..W'], true)));
add('wpn_basic', renderMask(fromRows(['.W.W.', '.W.W.', '.W.W.', '.W.W.', '.W.W.'])));
add('wpn_spread', renderMask(fromRows(['R.R.R', 'R.R.R', '.RRR.', '.RRR.', '..R..'])));
add('wpn_laser', renderMask(fromRows(['.BBB.', '.BwB.', '.BwB.', '.BwB.', '.BBB.'])));
add('wpn_homing', renderMask(fromRows(['..G..', '.GGG.', 'GGwGG', '.GGG.', '..G..'])));
add('pip_on', renderMask(fromRows(['YY', 'YY'])));
add('pip_off', renderMask(fromRows(['dd', 'dd'])));

export function buildSprites() {
  return out;
}
