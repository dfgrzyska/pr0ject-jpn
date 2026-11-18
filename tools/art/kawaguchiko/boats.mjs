// The lake's boats, seen from above, drawn by painters put(a, b, colour): a along the boat from its stern (0) to its
// bow, b across it from its port side, in fine pixels. Laid as they sail (bow to the right: the moving frames, turned
// to their heading) or moored with the bow up the strip (upright()).
import { shade } from '../tokyo/kit.mjs';

const oval = (a, b, len, wid, bowSharp = 0.6) => {
  const t = a / (len - 1);
  const half = (wid / 2) * (t > 0.6 ? Math.sqrt(Math.max(0, (1 - t) / 0.4)) ** bowSharp : t < 0.08 ? 0.8 + t * 2.5 : 1);
  return Math.abs(b - (wid - 1) / 2) <= half;
};

/** A swan pedal boat (25 x 12 fine pixels): a broad white body, its raised wings feathered along the sides with grey
 * tips at the stern and the tail between them, the open cockpit with its two seats (`seat`: their colour; the fleet
 * has a few), the neck rising from the broad chest at the bow, the head with two eyes, the black knob and the orange
 * beak out in front. */
export function swan(put, seat = 0xe86a8a) {
  const [len, wid] = [19, 12];
  // the body round like a bird's: widest behind the middle, rounding into the tail and into the chest
  const body = (a, b) => {
    const t = (a + 0.5) / len;
    const half = (wid / 2) * Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.06)) ** 0.55 * (t > 0.55 ? 1 - (t - 0.55) * 0.55 : 1);
    return Math.abs(b + 0.5 - wid / 2) <= half;
  };
  for (let a = 0; a < len; a++)
    for (let b = 0; b < wid; b++) {
      if (!body(a, b)) continue;
      const edge = !body(a, b - 1) || !body(a, b + 1) || !body(a - 1, b) || !body(a + 1, b);
      const side = b < 3 || b > wid - 4;
      const feather = side && a > 1 && a < 15 && (a + b) % 3 === 0; // the wings' rows of feathers
      const tip = side && a < 4; // their grey tips at the stern
      put(a, b, edge ? 0x8e98a6 : tip ? 0xb4bcc8 : feather ? 0xccd4de : b < wid / 2 ? 0xffffff : 0xe4eaf0);
    }
  for (const [a, b] of [[0, 5], [0, 6], [1, 5], [1, 6]]) put(a, b, 0xe8ecf0); // the tail
  // the open cockpit: dark inside, two seats one behind the other
  for (let a = 5; a < 13; a++)
    for (let b = 3; b < wid - 3; b++) {
      if ((a === 5 || a === 12) && (b === 3 || b === wid - 4)) continue; // (its corners rounded)
      const rim = a === 5 || a === 12 || b === 3 || b === wid - 4;
      put(a, b, rim ? 0x6a7280 : (a === 6 || a === 7 || a === 10 || a === 11) && b > 3 && b < wid - 4 ? (a % 2 ? shade(seat, 0.8) : seat) : 0x3a4250);
    }
  // the neck from the chest, the head, the knob and the beak
  // (the neck bows a little to one side and back, as a swan's does)
  for (const [a, b] of [[16, 4], [16, 5], [16, 6], [16, 7], [17, 4], [17, 5], [17, 6], [18, 4], [18, 5], [19, 4], [19, 5], [20, 5], [20, 6], [21, 5], [21, 6], [21, 7], [22, 5], [22, 6], [22, 7], [23, 6]]) put(a, b, (b === 6 && a < 20) || (a === 16 && b === 7) ? 0xdde3ea : 0xffffff);
  put(22, 4, 0x8e98a6); // the head's edge
  put(22, 7, 0x1a1a22); // the eye
  put(23, 5, 0x1a1a20); // the knob
  put(24, 6, 0xf09a28); // the beak
  put(24, 7, 0xd0781a);
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
export const swanFrame = upright(swan, 25);
export const rowboatFrame = upright(rowboat, 14);
