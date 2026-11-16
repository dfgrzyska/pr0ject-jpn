// A look at Tokyo's whole strip for review (not part of the game's art):
//   node tools/art/tokyo/overview.mjs                 -> tools/preview/stage9_route.png: the strip at the game's
//                                                         180 px, in seven columns (the start at the bottom left),
//                                                         a ruler up each, every plot numbered; the numbers' key printed
//   node tools/art/tokyo/overview.mjs --from=3100 --to=3600  -> tools/preview/stage9_route_3100.png: that stretch at 540 px
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Raster } from '../../lib/raster.mjs';
import { buildMid } from './mid.mjs';
import { buildFar } from './far.mjs';
import { W, S, L, PLOTS, DISTRICTS, ARENAS } from './route.mjs';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'preview');
mkdirSync(dir, { recursive: true });
const arg = (k) => Number(process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? NaN);

const { strip } = buildMid();
const far = buildFar();
// the strip over the far layer's water
const full = new Raster(strip.w, strip.h);
for (let y = 0; y < strip.h; y++)
  for (let x = 0; x < strip.w; x++) {
    const i = (y * strip.w + x) * 4;
    const j = ((y % far.h) * far.w + x) * 4;
    const a = strip.data[i + 3];
    const d = a ? strip.data : far.data;
    const k = a ? i : j;
    full.setRGBA(x, y, d[k], d[k + 1], d[k + 2], 255);
  }

const from = arg('from');
if (!Number.isNaN(from)) {
  const to = Number.isNaN(arg('to')) ? from + 500 : arg('to');
  writeFileSync(join(dir, `stage9_route_${from}.png`), full.crop(0, (L - to) * S, W * S, (to - from) * S).toPNG());
  console.log(`stage9_route_${from}.png`);
} else {
  const DIGITS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
  const COLS = 7;
  const colH = Math.ceil(L / COLS);
  const PAD = 26; // (room for the ruler's numbers)
  const out = new Raster(COLS * (W + PAD), colH);
  out.rect(0, 0, out.w, out.h, 0x101018);
  const number = (x, y, n, c, bg) => {
    const s = String(n);
    if (bg !== undefined) out.rect(x - 1, y - 1, s.length * 4 + 1, 7, bg);
    [...s].forEach((ch, k) => {
      for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (DIGITS[ch][j * 3 + i] === '1') out.set(x + k * 4 + i, y + j, c);
    });
  };
  // a point of the strip on the sheet
  const at = (x, u) => {
    const col = Math.min(COLS - 1, Math.floor(u / colH));
    return [col * (W + PAD) + PAD + x, colH - 1 - (u - col * colH)];
  };
  for (let u = 0; u < L; u++)
    for (let x = 0; x < W; x++) {
      const i = (((L - 1 - u) * S + 1) * strip.w + x * S + 1) * 4;
      const [sx, sy] = at(x, u);
      out.setRGBA(sx, sy, full.data[i], full.data[i + 1], full.data[i + 2], 255);
    }
  for (let u = 0; u < L; u += 100) {
    const [sx, sy] = at(0, u);
    out.rect(sx - 4, sy, 4, 1, 0xffffff);
    if (u % 500 === 0) number(sx - PAD + 1, sy - 2, u, 0xffe080);
  }
  for (const [from] of DISTRICTS) {
    const [sx, sy] = at(0, from);
    out.rect(sx, sy, W, 1, 0xff5060);
  }
  PLOTS.forEach(([, x, u, w, h], n) => {
    const [sx, sy] = at(x + w / 2, Math.min(u + h / 2, (Math.floor(u / colH) + 1) * colH - 4));
    number(Math.round(sx - String(n + 1).length * 2), sy - 2, n + 1, 0x101018, 0xfff4c0);
  });
  writeFileSync(join(dir, 'stage9_route.png'), out.toPNG());
  console.log('stage9_route.png');
  PLOTS.forEach(([id, x, u, w, h, what], n) => console.log(`${String(n + 1).padStart(3)}  ${id.padEnd(22)} x ${x}-${x + w}  u ${u}-${u + h}  ${what}`));
  for (const [x, u, name] of ARENAS) console.log(`arena  ${name}  (${x}, ${u})`);
}
