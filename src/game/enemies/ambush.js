// Every city's ambusher, hiding in its map: a white Inari fox in an azalea bush in Kyoto, a hermit crab under the sand
// in Okinawa, a mountain hare in a snowdrift in Sapporo, a little octopus under a manhole in Osaka, a mud bōzu in a
// boiling pool in Beppu, an anago eel in its hole in Hiroshima's flats, a hook-tailed cat in a crate on Nagasaki's
// quay, a rat in a Tokyo storm drain (Kagoshima has its kappa). Its hiding place comes down the screen with the map,
// where nothing can hit it or lock on to it (so homing orbs cannot pick it off as it comes on, the way they do what
// flies in from the top); some way down it stirs, jumps out, shoots at the player twice and ducks back in, and what
// is left is its hiding place, going on down with the map. Shot down while it is out, it leaves the place behind.
// Their looks are the skins' `ambush` (skins.js, drawn in tools/art/ambush.mjs); their places, the stage files'
// "ambush" waves ({ t, x, y? }: y is the line on the screen where it wakes).
import { rules } from '../../difficulty.js';
import { slow } from './shared.js';

/**
 * wake: where it stirs (the screen's y, unless the wave says); near: it waits while the player is closer than this;
 * stir, rise, up, duck: how long it stirs, comes out, stays out, goes back (s); shots: when it shoots while out (s)
 * and how: n bullets over arc at slow * k.
 */
export const AMBUSH = { wake: 84, near: 34, stir: 0.7, rise: 0.22, up: 2.0, duck: 0.22, shots: [0.25, 1.2], n: 3, arc: 0.55, k: 1 };

export const ambush = {
  /** w: the wave ({ x, y }); look: the skin's ambush. Placed like a trap: on the map where it comes in. */
  spawnAmbush(w, base, look) {
    const s = this.scene;
    const e = this.pool.spawn(look.frames[0], w.x, -10, { ...base, ghost: true, look, wreck: look.frames[0], state: 'hide', timer: 0, at: w.y ?? AMBUSH.wake, fired: 0 });
    e.u = s.parallax.stripU(-10);
    return e;
  },

  ambusher(e, dt, b) {
    const s = this.scene;
    const L = e.look;
    const p = s.player;
    e.y = s.parallax.screenY(e.u);
    e.timer -= dt;
    let f = 0;
    if (e.state === 'hide') {
      // it waits for its line, and for the player not to be on top of it; past half the screen it has missed its chance
      if (e.y >= e.at && e.y < s.H * 0.5 && !s.calm && !s.ceasefire && Math.hypot(p.x - e.x, p.y - e.y) > AMBUSH.near) {
        e.state = 'stir';
        e.timer = AMBUSH.stir;
      }
    } else if (e.state === 'stir') {
      f = Math.floor(e.timer * 12) % 2; // shaking, eyes in the dark
      if (e.timer <= 0) {
        e.state = 'rise';
        e.timer = AMBUSH.rise;
        this.ambushPop(e);
        if (e.look.sound) for (const k of e.look.sound) s.sfx[k]?.(); // (a city's own: the mole through the leaves)
      }
    } else if (e.state === 'rise') {
      f = 2;
      if (e.timer <= 0) Object.assign(e, { state: 'up', timer: AMBUSH.up, ghost: false, seen: 0, fired: 0 });
    } else if (e.state === 'up') {
      const t = AMBUSH.up - e.timer;
      f = 3;
      const next = AMBUSH.shots[e.fired];
      if (next != null && t >= next) {
        e.fired++;
        this.ambushShoot(e, b);
      }
      // the shooting look a moment either side of each shot
      if (AMBUSH.shots.some((at) => Math.abs(t - at) < 0.16)) f = 4;
      if (e.timer <= 0) Object.assign(e, { state: 'duck', timer: AMBUSH.duck, ghost: true });
    } else if (e.state === 'duck') {
      f = 2;
      if (e.timer <= 0) e.state = 'gone'; // back in its hiding place, which goes on down with the map
    }
    const frame = L.frames[f];
    if (e.frame.name !== frame) this.pool.reframe(e, frame);
  },

  /** Out it comes: a burst of whatever it was hiding in. */
  ambushPop(e) {
    const fx = this.scene.fx;
    const k = e.look.pop;
    if (k === 'leaves') fx.leaves(e.x, e.y, 8);
    else if (k === 'splash') fx.puff('splash', e.x, e.y + 3, 0.3);
    else if (k === 'steam') fx.puff('wisp_s_0', e.x, e.y - 2, 0.5);
    else if (k === 'snow') fx.shards(e.x, e.y + 2, 6, true);
    else fx.smoke(e.x, e.y + 3, 2, 3, true);
  },

  /** A short fan at the player, if it may shoot now. */
  ambushShoot(e, b) {
    const s = this.scene;
    if (e.y < 4 || e.y > s.H * rules().noFireBelow || s.bombClear > 0 || s.ceasefire || s.calm) return;
    const y = e.y + (e.look.dy ?? 2);
    b.fan(e.x, y, this.aimAt(e, 0, e.look.dy ?? 2), AMBUSH.n, AMBUSH.arc, slow * AMBUSH.k);
  },
};
