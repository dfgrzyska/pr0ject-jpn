// Sprite definitions: player ship, enemies (Fushimi Inari robot designs), bullets, pickups, FX, UI.
import { Mask, renderMask } from '../lib/spritekit.mjs';
import { Raster, fbm, bayer } from '../lib/raster.mjs';
import { okinawaSprites } from './okinawa/sprites.mjs';
import { sapporoSprites } from './sapporo/sprites.mjs';
import { tanukiSprites } from './kyoto/tanuki.mjs';
import { kagoshimaSprites } from './kagoshima/sprites.mjs';
import { osakaSprites } from './osaka/sprites.mjs';
import { beppuSprites } from './beppu/sprites.mjs';

const out = [];
const add = (name, raster) => out.push({ name, raster });
const fromRows = (rows, mirror, remap) => {
  const m = Mask.fromRows(rows, mirror);
  if (remap) m.remap(remap);
  return m;
};

// ---------------------------------------------------------------- player
// Three selectable ships, painted in Japanese convenience-store liveries. Rows are left halves (mirrored).
// All engines sit 5px apart so they share the flame sprite.
// KITSUNE (standard): white with orange / green / red bands.
const SHIP = [
  '.......W',
  '......WW',
  '......WW',
  '......WC',
  '.....WCc',
  '.....WCC',
  '.....WWC',
  '.....WWW',
  '....OWWW',
  '...OJWWT',
  '..OJTWWT',
  '.OJTWWWT',
  'OJTWWWWW',
  'OJTWDDWW',
  'OOJ.DDWW',
  '....DD.W',
  '....DD..',
];
// ONI (heavy): armoured white hull, green bow, blue stern, gold horns.
const SHIP_ONI = [
  '...Y....A',
  '...YY..AA',
  '....Y.AWA',
  '....YAWCC',
  '.....AWCc',
  '.....AWCC',
  '....AAWWW',
  '...AAWWWW',
  '..AAWWWWW',
  '.AAWWWWWU',
  'AAWWWWWWU',
  'AWWWWUUWU',
  'AUUUUDDWU',
  '.UUU.DDWU',
  '.....DD.U',
  '.....DD..',
];
// TSUBAME (fast): slim blue swallow with white wing stripes and a forked tail.
const SHIP_TSUBAME = [
  '.......L',
  '.......L',
  '......LW',
  '......LC',
  '......LC',
  '......WC',
  '......LW',
  '.....LLW',
  '....LLWL',
  '..LLWWLL',
  'LLWWLLLL',
  'LW..DDLL',
  'L...DDLW',
  '....DD.L',
  '......L.',
  '.....L..',
];
// Banked frames: lean the silhouette by shortening one wing.
function shipFrame(bank, rows = SHIP) {
  const m = fromRows(rows, true);
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
for (const [name, rows] of [['ship', SHIP], ['ship_oni', SHIP_ONI], ['ship_tsubame', SHIP_TSUBAME]]) {
  add(name, shipFrame(0, rows));
  add(`${name}_l`, shipFrame(-1, rows));
  add(`${name}_r`, shipFrame(1, rows));
}

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

// Diver: a chōchin-obake, the paper-lantern yōkai of the night parade of a hundred demons that the
// legends send down Kyoto's streets: a red Gion lantern torn open into a toothy mouth, one big eye,
// its tongue lolling out and swinging as it swoops at the player. Full rows (it is not symmetric).
const DIVER_A = [
  '.....NNN.....',
  '....KKKKK....',
  '...KKYYYKK...',
  '..RRRRRRRRR..',
  '.RRRWWWRRRRR.',
  '.RRWWWKWRRRR.',
  'RRRWWKKWRRRRR',
  'RRRRWWWRRRRRR',
  'RRRRRRRRRRRRR',
  'RKWKWKWKWKRRR',
  'RRKKKKKKKKRRR',
  '.RRRKPPKRRRR.',
  '.RRRRPPRRRRR.',
  '..KKKPPKKKK..',
  '...KYPPYKK...',
  '.....PP......',
  '.....P.......',
];
const DIVER_B = [
  '.....NNN.....',
  '....KKKKK....',
  '...KKYYYKK...',
  '..RRRRRRRRR..',
  '.RRRRRRRRRRR.',
  '.RRWWWWWRRRR.',
  'RRRWWKKWRRRRR',
  'RRRRRRRRRRRRR',
  'RKWKWKWKWKRRR',
  'RKKKKKKKKKRRR',
  'RRKKKKKKKRRRR',
  '.RRRKKPPKRRR.',
  '.RRRRRPPRRRR.',
  '..KKKKPPKKK..',
  '...KYYPPYK...',
  '.......PP....',
  '........P....',
];
add('diver_0', renderMask(fromRows(DIVER_A, false)));
add('diver_1', renderMask(fromRows(DIVER_B, false)));

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

// Heavy (stage 1 miniboss): Kyūbi — a red nine-tailed fox spirit (Fushimi Inari is the fox shrine).
// Faces the player; nine tails fan out behind it and sway; a glowing hōju jewel on the chest;
// two wisps of fox-fire (kitsune-bi) float at its sides.
function ellipse(m, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++)
    for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++)
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) m.set(x, y, c);
}
function triangle(m, a, b, c, ch) {
  const side = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  for (let y = Math.floor(Math.min(a[1], b[1], c[1])); y <= Math.max(a[1], b[1], c[1]); y++)
    for (let x = Math.floor(Math.min(a[0], b[0], c[0])); x <= Math.max(a[0], b[0], c[0]); x++) {
      const pt = [x + 0.5, y + 0.5];
      const d1 = side(a, b, pt);
      const d2 = side(b, c, pt);
      const d3 = side(c, a, pt);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) m.set(x, y, ch);
    }
}
const KYUBI_FRAMES = 4;
function kyubiFrame(f) {
  const W = 57;
  const H = 50;
  const C = 28; // centre pixel column
  const cx = C + 0.5;
  const m = new Mask(W, H);
  const phase = (f / KYUBI_FRAMES) * Math.PI * 2;

  // nine fluffy tails, drawn outer to centre, each with a dark rim so overlaps stay readable
  const order = [0, 8, 1, 7, 2, 6, 3, 5, 4];
  for (const i of order) {
    const a = -Math.PI + (i + 0.5) * (Math.PI / 9) + Math.sin(phase + i * 0.8) * 0.07;
    const len = 21 - Math.abs(i - 4) * 0.7;
    const nx = -Math.sin(a);
    const ny = Math.cos(a);
    const pts = [];
    for (let k = 0; k <= 40; k++) {
      const t = k / 40;
      const curl = Math.sin(phase + i * 0.8) * 2.4 * t * t;
      const d = 6 + t * len;
      const r = Math.max(0.8, 3.6 * Math.sin(Math.PI * Math.min(1, 0.2 + t * 0.86)));
      pts.push([cx + Math.cos(a) * d + nx * curl, 30 + Math.sin(a) * d + ny * curl, r, t]);
    }
    for (const [x, y, r] of pts) m.disc(x, y, r + 1, 'k');
    for (const [x, y, r, t] of pts) m.disc(x, y, r, t > 0.76 ? 'F' : 'R');
  }

  // body, white chest ruff, front paws
  m.disc(cx, 34, 9.5, 'k');
  m.disc(cx, 34, 8.5, 'R');
  ellipse(m, cx, 37, 5, 6, 'F');
  for (const dx of [-4.5, 4.5]) {
    m.disc(cx + dx, 43, 3.2, 'k');
    m.disc(cx + dx, 43, 2.3, 'F');
  }

  // tall ears: red outside, pale fluff inside, black tips
  for (const sx of [-1, 1]) {
    const P = (dx, y) => [cx + sx * dx, y];
    triangle(m, P(-12.5, 0.5), P(-11.5, 19), P(-1.5, 14.5), 'k');
    triangle(m, P(-11.5, 2), P(-10.5, 18), P(-2.5, 15), 'R');
    triangle(m, P(-9.5, 7), P(-9, 17), P(-4.5, 15.5), 'F');
    triangle(m, P(-11.5, 2), P(-11, 6.5), P(-8.5, 5.5), 'K');
  }
  // head
  ellipse(m, cx, 22.5, 10.5, 9, 'k');
  ellipse(m, cx, 22.5, 9.5, 8, 'R');
  ellipse(m, cx - 6, 26, 3, 2.2, 'F');
  ellipse(m, cx + 6, 26, 3, 2.2, 'F');
  ellipse(m, cx, 27.5, 3.8, 3.2, 'F');
  m.rect(C - 1, 28, 3, 1, 'k');
  m.set(C, 29, 'k');
  m.set(C - 2, 30, 'k');
  m.set(C + 2, 30, 'k');
  // narrow glowing eyes under slanted dark brows
  for (const sx of [-1, 1]) {
    const X = (dx) => C + sx * dx;
    for (const [dx, y] of [[-8, 21], [-7, 21], [-6, 20], [-5, 20], [-4, 20]]) m.set(X(dx), y, 'k');
    for (const [dx, y] of [[-7, 22], [-6, 22], [-5, 21], [-4, 21]]) m.set(X(dx), y, 'y');
    m.set(X(-5), 22, 'k');
  }
  // gold flame mark on the forehead
  m.rect(C, 15, 1, 3, 'Y');
  m.set(C - 1, 17, 'Y');
  m.set(C + 1, 17, 'Y');
  // hōju jewel on the chest
  m.disc(cx, 37.5, 2.6, 'k');
  m.disc(cx, 37.5, 2, 'M');
  m.set(C - 1, 36, 'w');
  m.rect(C - 1, 40, 3, 1, 'Y');

  // fox-fire wisps (no outline), bobbing
  for (const sx of [-1, 1]) {
    const fx = cx + sx * 25;
    const fy = 31 + Math.sin(phase + (sx > 0 ? Math.PI : 0)) * 1.5;
    m.disc(fx, fy, 2.4, 'b');
    m.set(Math.floor(fx), Math.floor(fy) - 3, 'b');
    m.disc(fx, fy + 0.3, 1.2, 'c');
  }
  return renderMask(m, { glow: 'bc' });
}
for (let f = 0; f < KYUBI_FRAMES; f++) add(`kyubi_${f}`, kyubiFrame(f));
tanukiSprites(add);

// ---------------------------------------------------------------- stage 2 and 3 skins
okinawaSprites(add);
sapporoSprites(add);
kagoshimaSprites(add);
osakaSprites(add);
beppuSprites(add);

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
// life icons in each ship's livery
const LIFE = ['...W', '..WC', '..WW', '.RWW', 'RSSW', 'R..W'];
add('icon_life', renderMask(fromRows(LIFE, true, { R: 'O', S: 'J' })));
add('icon_life_oni', renderMask(fromRows(LIFE, true, { R: 'A', S: 'U' })));
add('icon_life_tsubame', renderMask(fromRows(LIFE, true, { W: 'L', R: 'L', S: 'W' })));
add('wpn_basic', renderMask(fromRows(['.W.W.', '.W.W.', '.W.W.', '.W.W.', '.W.W.'])));
add('wpn_spread', renderMask(fromRows(['R.R.R', 'R.R.R', '.RRR.', '.RRR.', '..R..'])));
add('wpn_laser', renderMask(fromRows(['.BBB.', '.BwB.', '.BwB.', '.BwB.', '.BBB.'])));
add('wpn_homing', renderMask(fromRows(['..G..', '.GGG.', 'GGwGG', '.GGG.', '..G..'])));
add('pip_on', renderMask(fromRows(['YY', 'YY'])));
add('pip_off', renderMask(fromRows(['dd', 'dd'])));

export function buildSprites() {
  return out;
}
