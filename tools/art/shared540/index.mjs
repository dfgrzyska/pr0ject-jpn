// The shared sprites redrawn at 540 px (docs/graphics-540-plan.md, step 6): what goes into sprites540.png,
// each frame three times its namesake in sprites.png.
import { fx540 } from './fx540.mjs';
import { bullets540 } from './bullets540.mjs';
import { ships540 } from './ships540.mjs';
import { ui540 } from './ui540.mjs';
import { pickupToken, TOKEN_FRAMES } from '../token.mjs';

export function shared540(add) {
  fx540(add); // A: explosions and effects
  bullets540(add); // B: the enemies' themed bullets, and the player's shots
  ships540(add); // C: the three ships, level and banking
  ui540(add); // C and D: the hit dot, the beans, the talismans; the HUD's buttons and icons
  // the weapon tokens, drawn at 540 px directly
  for (const col of ['red', 'blue', 'green']) {
    add(`pickup_${col}`, pickupToken(col, 0, 3));
    for (let f = 0; f < TOKEN_FRAMES; f++) add(`pickup_${col}_${f}`, pickupToken(col, f, 3));
  }
}
