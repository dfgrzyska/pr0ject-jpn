// What the enemies' core and the cities' modules share: bullet speeds, angles, the per-enemy extras.
import { FAIR } from '../../config.js';

export const { slow, normal, fast } = FAIR.bulletSpeed;
export const DOWN = Math.PI / 2;
export const TAU = Math.PI * 2;
// per-skin extras, listed so a pooled sprite never keeps a previous enemy's state
export const EXTRAS = {
  armor: 0,
  maxArmor: 0,
  lantern: false,
  flock: null,
  ghost: false, // faded out: shots pass through, no contact
  invuln: false, // shots are absorbed without damage
  pass: false, // shots fly through (still solid to touch)
  group: null,
  role: null,
  wreck: null,
  kind: null,
  song: null, // heavy with its own theme
  decoys: null,
  split: false, // volcanic bomb: bursts into two fragments
  sniper: false, // matchlock: aims a line, then one fast shot
  lidded: false, // vinegar jar: armoured while the lid is on
  melt: 0, // shirokuma: seconds until it melts away with its pickup
  duo: null, // Osaka manzai pair
  rage: false, // its partner fell: furious
  segs: null, // tentacle segments (extra hit circles)
  kuroko: null, // the puppet's puppeteers
  master: null,
  hatch: 0, // hot-spring egg: seconds on screen before it hatches
  hatched: false,
  bounce: false, // Kamado pot: its shots ricochet off the walls
  thief: false, // macaque: grabs power instead of ramming
  loot: null, // what the macaque is running away with: 'power' | 'bomb'
  harmless: false, // no contact damage (bean boxes)
  oni: false, // only Setsubun beans really hurt it
  wounds: null, // a weakened boss's cracks (sprites riding on it)
  recoil: 0, // brief upward visual jolt on hit
  vx: 0,
  vy: 0,
  leapt: false,
  oyster: false,
  shellOpen: false,
  opening: false,
  scoop: false,
  crane: false,
  guarding: false,
};
