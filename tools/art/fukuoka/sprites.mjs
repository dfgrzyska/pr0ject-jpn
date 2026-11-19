// Stage 12 (Fukuoka) sprites for the near layer: plum petals (ume_0..3) drifting over Dazaifu - round, not notched as
// the cherry's are, in the groves' three colours: white touched with pink at the heart, pink, and deep red.
import { MATERIALS, Mask, renderMask } from '../../lib/spritekit.mjs';

const MAT = {
  ...MATERIALS,
  a: [0xe4d6dc, 0xf6f2ee, 0xffffff], // white petal (materials are ramps: shade, middle, light)
  b: [0xd8b8c4, 0xe8d0d8, 0xf4e4ea], // its blush at the heart
  c: [0xe08aa8, 0xf6b8cc, 0xffd8e4], // pink
  d: [0xc86a8c, 0xe08aa8, 0xf0a8c0],
  e: [0xa8204a, 0xe0486e, 0xf07890], // deep red
  f: [0x8a1a3c, 0xb02a50, 0xd04a6a],
};
const raw = (rows) => renderMask(Mask.fromRows(rows), { outline: false, materials: MAT });

export function fukuokaSprites(add) {
  add('ume_0', raw(['.aa', 'aab', '.b.']));
  add('ume_1', raw(['aa.', 'abb', '.a.']));
  add('ume_2', raw(['.cc', 'ccd', '.d.']));
  add('ume_3', raw(['ee', 'ef']));
}
