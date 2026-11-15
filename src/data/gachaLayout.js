// Where things are on the gachapon's picture, in fine pixels (540 px art: three to a game unit), shared by the
// art (tools/art/gacha.mjs) and the screen (src/game/Gacha.js).
export const MACHINE = {
  w: 300,
  h: 456,
  window: { x0: 36, y0: 72, x1: 264, y1: 248 }, // the inside of the glass: where the capsules lie
  dial: { x: 150, y: 322 }, // the crank's centre
  slot: { x: 78, y: 304 }, // the ticket slot
  chute: { x: 150, y: 410 }, // where the capsule comes out
  lamps: [{ x: 34, y: 46 }, { x: 266, y: 46 }],
  neko: { x: 150, y: 6 }, // the lucky cat's feet: the middle of the sign's top
};
export const CAPSULE = 42; // a capsule's frame, square
export const BALL = 30; // ... and of one lying under the glass
export const NEKO = { w: 84, h: 90 };
