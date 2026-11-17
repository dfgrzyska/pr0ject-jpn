// The lake's boats, seen from above, drawn by painters put(a, b, colour): a along the boat from its stern (0) to its
// bow, b across it from its port side, in fine pixels. Laid as they sail (bow to the right: the moving frames, turned
// to their heading) or moored with the bow up the strip (upright()).
import { shade } from '../tokyo/kit.mjs';

const oval = (a, b, len, wid, bowSharp = 0.6) => {
  const t = a / (len - 1);
  const half = (wid / 2) * (t > 0.6 ? Math.sqrt(Math.max(0, (1 - t) / 0.4)) ** bowSharp : t < 0.08 ? 0.8 + t * 2.5 : 1);
  return Math.abs(b - (wid - 1) / 2) <= half;
};

/** A swan pedal boat: a white body, the neck curving up from its bow with an orange beak, a canopy over the seats. */
export function swan(put) {
  const [len, wid] = [12, 9];
  for (let a = 0; a < len; a++)
    for (let b = 0; b < wid; b++) {
      if (!oval(a, b, len, wid, 0.8)) continue;
      const edge = !oval(a, b - 1, len, wid, 0.8) || !oval(a, b + 1, len, wid, 0.8);
      put(a, b, edge ? 0xb8c0c8 : b < 3 ? 0xffffff : 0xe8ecf0);
    }
  for (let a = 3; a < 8; a++) for (let b = 2; b < 7; b++) put(a, b, a === 3 || a === 7 ? 0xc04a6a : 0xe86a8a); // the canopy
  for (const [a, b] of [[9, 4], [10, 4], [11, 3], [12, 3], [13, 3]]) put(a, b, 0xffffff); // the neck
  put(14, 3, 0xf0a030); // the beak
  put(12, 2, 0x2a2a30); // the eye
}

/** A rowing boat for hire: wooden, two thwarts, the oars out. */
export function rowboat(put) {
  const [len, wid] = [14, 6];
  for (let a = 0; a < len; a++)
    for (let b = 0; b < wid; b++) {
      if (!oval(a, b, len, wid)) continue;
      const edge = !oval(a, b - 1, len, wid) || !oval(a, b + 1, len, wid);
      put(a, b, edge ? 0x5a3a20 : a === 4 || a === 9 ? 0x6a4a2c : (a + b) % 3 ? 0xa8784a : 0x986a40);
    }
}

/** A small fishing boat with its angler: the outboard at the stern, a rod out over the side. */
export function anglerBoat(put, c = 0x2a6aa0) {
  const [len, wid] = [16, 7];
  for (let a = 0; a < len; a++)
    for (let b = 0; b < wid; b++) {
      if (!oval(a, b, len, wid)) continue;
      const edge = !oval(a, b - 1, len, wid) || !oval(a, b + 1, len, wid);
      put(a, b, edge ? shade(c, 0.7) : a < 3 ? 0xd8dce0 : 0xf0f2f4);
    }
  put(0, 3, 0x3a3a40); // the motor
  put(0, 2, 0x3a3a40);
  put(5, 3, 0x2a2a30); // the angler: a cap, a jacket
  put(6, 3, 0xd8b890);
  put(5, 2, c);
  for (let k = 1; k < 9; k++) put(6 + Math.round(k * 0.4), 3 - k, 0x4a4a50); // the rod, out over the water
}

/** A motorboat: a white hull with a stripe, its windscreen and seats. */
export function motorboat(put) {
  const [len, wid] = [20, 8];
  for (let a = 0; a < len; a++)
    for (let b = 0; b < wid; b++) {
      if (!oval(a, b, len, wid, 0.5)) continue;
      const edge = !oval(a, b - 1, len, wid, 0.5) || !oval(a, b + 1, len, wid, 0.5);
      put(a, b, edge ? 0x2a4a8a : a >= 9 && a <= 10 ? 0x3a4a5a : a < 9 && b > 1 && b < 6 ? 0xd8c8a8 : 0xf4f6f8);
    }
}

/** The sightseeing boat: a long white hull, a covered lower deck with windows, the open upper deck, a flag astern. */
export function sightseer(put) {
  const [len, wid] = [60, 18];
  for (let a = 0; a < len; a++)
    for (let b = 0; b < wid; b++) {
      if (!oval(a, b, len, wid, 0.55)) continue;
      const edge = !oval(a, b - 1, len, wid, 0.55) || !oval(a, b + 1, len, wid, 0.55);
      let c = edge ? 0x2a3a5a : 0xf4f6f8;
      if (!edge && a > 6 && a < 46 && b > 2 && b < wid - 3) {
        c = a < 10 || a > 42 || b === 3 || b === wid - 4 ? 0x3a6aa8 : (a + b) % 9 === 0 ? 0xe8e0d0 : 0xd8d0c0; // the upper deck, its rail
        if ((a * 7 + b * 3) % 23 === 0) c = [0xd04848, 0x4870c8, 0xe8c040, 0x48a868][(a + b) % 4]; // passengers
      }
      put(a, b, c);
    }
  for (const b of [2, 15]) for (let a = 8; a < 46; a += 4) put(a, b, 0x2c3a4c); // the lower deck's windows
  for (let k = 0; k < 4; k++) put(1 + k, 8 + (k % 2), 0xd04040); // the flag
}

/** A painter turned to lie with the bow up the strip: put(x, y) with y down the strip. */
export const upright = (painter, len) => (put) => painter((a, b, c) => put(b, len - 1 - a, c));
export const swanFrame = upright(swan, 15);
export const rowboatFrame = upright(rowboat, 14);
