// Every city's indestructible traps, set into its map the way Beppu's geysers are (beppu.js): a stone lantern
// breathing fox fire in Kyoto, a blowhole in Okinawa's reef, a snow cannon in Sapporo, a fumarole in Kagoshima,
// a takoyaki griddle in Osaka, a fire basket on Miyajima's shore, a fireworks mortar in Nagasaki, a transformer on a
// Tokyo pole. Shots pass them by (they cannot be destroyed); they stand on the map, wake with a warning ring on the
// ground, then burst: the ring scalds for a moment and a volley flies out. They take no notice of how strong the
// player has grown, which is the point: something to keep an eye on in every city.
// Their looks and volleys are the skins' `trap` (skins.js); their places, the stage files' "trap" waves.
import { volley, rules } from '../../difficulty.js';
import { slow, normal, TAU } from './shared.js';

/** How long the warning ring takes, how long the burst scalds (s). */
export const TRAP = { warn: 0.9, live: 0.5, easyEvery: 1.3 };

export const traps = {
  /** w: the wave ({ x, every, delay }); look: the skin's trap. Placed like a geyser: on the map where it comes in. */
  spawnTrap(w, base, look) {
    const s = this.scene;
    const e = this.pool.spawn(look.frames[0], w.x, -10, { ...base, ghost: true, look, every: (w.every ?? look.every ?? 3.4) * (rules().volley < 1 ? TRAP.easyEvery : 1), timer: w.delay ?? 1, erupt: 0, burstT: 0, wake: 0 });
    e.u = s.parallax.stripU(-10);
    return e;
  },

  trap(e, dt, b) {
    const s = this.scene;
    const L = e.look;
    e.y = s.parallax.screenY(e.u);
    // its frames: at rest; glowing (blinking) while the ring fills; bursting
    let f = 0;
    if (e.burstT > 0) {
      e.burstT -= dt;
      f = 2 + (Math.floor(e.burstT * 14) % 2);
    } else if (e.wake > 0) {
      e.wake -= dt;
      f = Math.floor(e.wake * (e.wake < 0.35 ? 16 : 7)) % 2;
    }
    const frame = L.frames[Math.min(f, L.frames.length - 1)];
    if (e.frame.name !== frame) this.pool.reframe(e, frame);
    if (e.erupt > 0 && (e.erupt -= dt) <= 0) {
      e.burstT = TRAP.live;
      if (L.puff) s.fx.puff(L.puff, e.x, e.y - 6, 0.6);
      if (L.sound && e.y > 0 && e.y < s.H) s.sfx[L.sound]?.(); // (a city's own: Kawaguchiko's bonfire crackles)
      if (e.y > 4 && e.y < s.H * 0.75 && s.bombClear <= 0 && !s.ceasefire && !s.calm) this.trapVolley(e, b, L);
    }
    e.timer -= dt;
    if (e.timer > 0 || e.y < -4 || e.y > s.H * 0.75) return;
    e.timer = e.every;
    e.erupt = b.zone(e.x, e.y + (L.dy ?? 0), L.r ?? 11, { warn: TRAP.warn, live: TRAP.live, kind: L.zone, u: e.u - (L.dy ?? 0) });
    e.wake = e.erupt;
  },

  /** The volley a trap lets out as it bursts: a ring, a fan at the player, or a ring of big slow shots. */
  trapVolley(e, b, L) {
    const v = L.volley;
    const n = volley(v.n);
    const speed = (v.speed === 'normal' ? normal : slow) * (v.k ?? 1);
    const y = e.y + (L.dy ?? 0);
    if (v.kind === 'fan') {
      const a0 = this.aimAt({ x: e.x, y });
      for (let i = 0; i < n; i++) b.fire(e.x, y, a0 + (n > 1 ? (i / (n - 1) - 0.5) * (v.arc ?? 0.9) : 0), speed, v.big);
      return;
    }
    const off = Math.random() * TAU;
    for (let i = 0; i < n; i++) b.fire(e.x, y, off + (i / n) * TAU, speed, v.big);
  },
};
