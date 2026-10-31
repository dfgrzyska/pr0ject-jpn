import { DEPTH, FAIR } from '../config.js';
import { Pool } from './Pool.js';

const TAU = Math.PI * 2;

// Optional behaviours, reset on every spawn so pooled sprites never keep old ones:
//   ax, ay   acceleration (icicles fall, the blizzard pushes bullets sideways); maxV caps the speed
//   life     seconds before the bullet disappears (snowball impact)
//   safe     seconds of harmless, motionless warning (icicles hang and blink first)
//   frz      { at, hold, turn, speed }: stop at `at` s, hang frozen for `hold` s, fly on turned by `turn`
//   wig, wf  sideways wiggle amplitude (px) and frequency (salmon)
//   spin     rotate the sprite to its flight direction
//   orb      { cx, cy, vx, vy, r, a, w }: circles a drifting centre (Raijū's orbs); link = the partner orb,
//            the electric arc between the two hurts as well
//   bounce   wall bounces left (Kamado pot: shots ricochet off the screen edges)
//   grow     { r0, r1, t, drag }: a steam puff swelling from radius r0 to r1 over t s while it slows down
// lobbed projectile looks: sprite low / high in the arc; spin = turns in flight; burst = ring bullet
const LOBS = {
  snowball: { low: 'snowball_0', high: 'snowball_1', spin: 0, burst: 'eb_s' },
  tokkuri: { low: 'tokkuri_0', high: 'tokkuri_1', spin: 9, burst: 'eb_s' },
  lava: { low: 'lavaball_0', high: 'lavaball_1', spin: 0, burst: 'eb_lava' },
  takoyaki: { low: 'tako_ball_0', high: 'tako_ball_1', spin: 5, burst: 'eb_s' },
  blood: { low: 'bloodball_0', high: 'bloodball_1', spin: 0, burst: 'bloodball_0' },
};

// scalding ground zones (geysers, mud, the blood pond): warning ring colour, then the eruption
const ZONES = {
  water: { warn: 0xbfe8ff, fill: 0xd8f0ff, core: 0xffffff },
  mud: { warn: 0xd8a870, fill: 0x7a5232, core: 0xb08458 },
  blood: { warn: 0xff6a58, fill: 0xa8141e, core: 0xf04a3a },
};

const PLAIN = { ax: 0, ay: 0, maxV: Infinity, life: Infinity, safe: 0, frz: null, wig: 0, wf: 0, spin: false, age: 0, orb: null, link: null, lead: false, bounce: 0, grow: null, grazed: false };

// Enemy bullets: bright core, dark outline, slow. Angle: radians, 0 = right, PI/2 = down.
// Lobbed snowballs fly above everything, harmless, with a ring marking where they land.
// Beams (lightning, steam) are columns that blink as a warning first and hurt only while they last.
// Zones (Beppu geysers) are circles on the ground: a tightening ring first, then a scalding eruption.
export class Bullets {
  constructor(scene) {
    this.scene = scene;
    this.pool = new Pool(scene, DEPTH.enemyBullet);
    this.lobs = new Pool(scene, DEPTH.enemyBullet + 0.5);
    this.marks = new Pool(scene, DEPTH.ground + 0.4);
    this.beams = [];
    this.zones = [];
    this.gfx = scene.add.graphics().setDepth(DEPTH.enemyBullet - 0.1);
  }

  fire(x, y, angle, speed, big = false) {
    return this.shot(big ? 'eb_m' : 'eb_s', x, y, angle, speed, big ? 2.5 : 1.8);
  }

  /** Any bullet sprite, with optional behaviour props (see PLAIN). */
  shot(frame, x, y, angle, speed, radius, extra) {
    if (this.scene.bombClear > 0) return null;
    const b = this.pool.spawn(frame, x, y, { ...PLAIN, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius, ...extra });
    if (b.wig) {
      b.bx = x;
      b.by = y;
    }
    if (b.spin) b.setRotation(angle - Math.PI / 2);
    return b;
  }

  /** n bullets spread over `arc` (radians) centred on `angle`. */
  fan(x, y, angle, n, arc, speed, big) {
    for (let i = 0; i < n; i++) this.fire(x, y, angle + (n > 1 ? (i / (n - 1) - 0.5) * arc : 0), speed, big);
  }

  ring(x, y, n, offset, speed, big) {
    for (let i = 0; i < n; i++) this.fire(x, y, offset + (i / n) * Math.PI * 2, speed, big);
  }

  /** Snowball (sake flask, lava bomb) thrown in an arc from (x, y) to (tx, ty); bursts into a small ring where it lands. */
  lob(x, y, tx, ty, time = 1.15, kind = 'snowball') {
    if (this.scene.bombClear > 0) return;
    const mark = this.marks.spawn('lob_mark_0', tx, ty);
    const look = LOBS[kind];
    this.lobs.spawn(look.low, x, y, { x0: x, y0: y, tx, ty, t: 0, time, mark, look });
  }

  /** A column from y0 down: blinks as a warning for `warn` s, then strikes for `live` s. kind: bolt | steam. */
  beam(x, { warn = 0.7, live = 0.22, w = 4, kind = 'bolt', y0 = 0 } = {}) {
    if (this.scene.bombClear > 0) return;
    this.beams.push({ x, warn, live, w, kind, y0, t: 0 });
  }

  /**
   * A scalding circle at (x, y): the ring fills as a warning for `warn` s, then it erupts for `live` s.
   * u = strip position: the zone rides on the mid layer (a geyser vent); null keeps it on the screen.
   */
  zone(x, y, r, { warn = 0.9, live = 0.45, kind = 'water', u = null } = {}) {
    if (this.scene.bombClear > 0) return;
    this.zones.push({ x, y, r, warn, live, kind, u, t: 0 });
  }

  /** Two orbs circling a centre that drifts along (vx, vy), joined by a hurting arc. */
  pair(cx, cy, vx, vy, r = 15, w = 1.8) {
    if (this.scene.bombClear > 0) return;
    const a0 = Math.random() * TAU;
    const one = this.shot('orb_0', cx, cy, 0, 0, 2.2, { orb: { cx, cy, vx, vy, r, w, a: a0 } });
    const two = this.shot('orb_0', cx, cy, 0, 0, 2.2, { orb: { cx, cy, vx, vy, r, w, a: a0 + Math.PI } });
    one.link = two;
    two.link = one;
    one.lead = true; // draws and tests the arc once per pair
  }

  /** Is a circle at (x, y) touching a striking beam or an electric arc? */
  hazardAt(x, y, r) {
    for (const bm of this.beams) if (bm.t > bm.warn && y >= bm.y0 && Math.abs(x - bm.x) < bm.w / 2 + r) return true;
    for (const z of this.zones) if (z.t > z.warn && Math.hypot(x - z.x, y - z.y) < z.r + r) return true;
    for (const b of this.pool.live) {
      const o = b.link;
      if (!b.lead || !o || o.dead || o.link !== b) continue;
      const dx = o.x - b.x;
      const dy = o.y - b.y;
      const t = Math.max(0, Math.min(1, ((x - b.x) * dx + (y - b.y) * dy) / (dx * dx + dy * dy || 1)));
      if (Math.hypot(x - (b.x + dx * t), y - (b.y + dy * t)) < 1.2 + r) return true;
    }
    return false;
  }

  /** Cancel every bullet on screen (bomb, heavy destroyed). */
  cancelAll(fx) {
    for (const b of this.pool.live) {
      if (fx && Math.random() < 0.5) fx.spark(b.x, b.y);
      this.pool.kill(b);
    }
    for (const l of this.lobs.live) {
      fx?.spark(l.x, l.y);
      this.marks.kill(l.mark);
      this.lobs.kill(l);
    }
    this.beams.length = 0;
    this.zones.length = 0;
    this.pool.sweep();
    this.lobs.sweep();
    this.marks.sweep();
  }

  update(dt, H) {
    for (const b of this.pool.live) {
      b.age += dt;
      if (b.safe > 0) {
        b.safe -= dt;
        b.setAlpha(b.safe > 0 && Math.floor(b.safe * 12) % 2 ? 0.4 : 1);
        continue;
      }
      if (b.frz) this.freeze(b, dt);
      if (b.ax || b.ay) {
        b.vx += b.ax * dt;
        b.vy += b.ay * dt;
        const v = Math.hypot(b.vx, b.vy);
        if (v > b.maxV) {
          b.vx *= b.maxV / v;
          b.vy *= b.maxV / v;
        }
      }
      if (b.orb) {
        const o = b.orb;
        o.cx += o.vx * dt;
        o.cy += o.vy * dt;
        o.a += o.w * dt;
        b.x = o.cx + Math.cos(o.a) * o.r;
        b.y = o.cy + Math.sin(o.a) * o.r;
        b.setFrame(Math.floor(b.age * 12) % 2 ? 'orb_1' : 'orb_0');
      } else if (b.wig) {
        b.bx += b.vx * dt;
        b.by += b.vy * dt;
        const v = Math.hypot(b.vx, b.vy) || 1;
        const o = Math.sin(b.age * b.wf) * b.wig;
        b.x = b.bx - (b.vy / v) * o;
        b.y = b.by + (b.vx / v) * o;
      } else {
        if (b.grow) {
          // a steam puff: swells and slows, fading out at the end
          const g = b.grow;
          const k = Math.min(1, b.age / g.t);
          b.radius = g.r0 + (g.r1 - g.r0) * k;
          b.setScale(0.45 + 0.55 * k);
          b.vx *= 1 - Math.min(1, g.drag * dt);
          b.vy *= 1 - Math.min(1, g.drag * dt);
          if (b.life < 0.4) b.setAlpha(b.life / 0.4);
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.bounce > 0 && (b.x < 3 || b.x > 177)) {
          b.bounce--;
          b.vx = -b.vx;
          b.x = b.x < 3 ? 3 : 177;
        }
      }
      const margin = b.orb ? 30 : 8;
      if ((b.life -= dt) <= 0 || b.x < -margin || b.x > 180 + margin || b.y < -12 - margin || b.y > H + margin) this.pool.kill(b);
    }
    this.pool.sweep();

    for (const l of this.lobs.live) {
      l.t += dt;
      const k = Math.min(1, l.t / l.time);
      const h = Math.sin(k * Math.PI) * 28;
      l.x = l.x0 + (l.tx - l.x0) * k;
      l.y = l.y0 + (l.ty - l.y0) * k - h;
      l.setFrame(h > 15 ? l.look.high : l.look.low);
      if (l.look.spin) l.rotation += l.look.spin * dt;
      l.mark.setFrame(`lob_mark_${k < 0.45 ? 0 : k < 0.8 ? 1 : 2}`).setAlpha(Math.floor(l.t * 10) % 2 ? 0.55 : 1);
      if (k < 1) continue;
      // impact: the splat itself hits inside the ring, then a few slow pellets spread out
      this.marks.kill(l.mark);
      this.lobs.kill(l);
      this.shot('splat', l.tx, l.ty, 0, 0, 6, { life: 0.12 });
      const off = Math.random() * TAU;
      for (let i = 0; i < 6; i++) this.shot(l.look.burst, l.tx, l.ty, off + (i / 6) * TAU, FAIR.bulletSpeed.slow * 0.85, 1.8);
      this.scene.fx.shards(l.tx, l.ty, 6, true);
    }
    this.lobs.sweep();
    this.marks.sweep();

    for (const bm of this.beams) bm.t += dt;
    this.beams = this.beams.filter((bm) => bm.t < bm.warn + bm.live);
    for (const z of this.zones) {
      z.t += dt;
      if (z.u !== null) z.y = this.scene.parallax.screenY(z.u);
    }
    this.zones = this.zones.filter((z) => z.t < z.warn + z.live);
    this.draw(H);
  }

  /** Beams (warning line, then the strike), geyser zones and the arcs between linked orbs. */
  draw(H) {
    const g = this.gfx;
    g.clear();
    for (const z of this.zones) {
      const c = ZONES[z.kind];
      if (z.t < z.warn) {
        // the ring fills up towards the eruption, blinking faster at the end
        const k = z.t / z.warn;
        g.fillStyle(c.warn, 0.12 + 0.18 * k);
        g.fillCircle(z.x, z.y, z.r * k);
        if (k < 0.7 || Math.floor(z.t * 20) % 2) {
          g.lineStyle(1, c.warn, 0.75);
          g.strokeCircle(z.x, z.y, z.r);
        }
      } else {
        // the eruption: a boiling column seen from above, with spray around it
        const k = (z.t - z.warn) / z.live;
        const fade = k > 0.75 ? (1 - k) / 0.25 : 1;
        g.fillStyle(c.fill, 0.6 * fade);
        g.fillCircle(z.x, z.y, z.r + 1);
        g.fillStyle(c.core, 0.85 * fade);
        g.fillCircle(z.x + (Math.random() - 0.5) * 2, z.y + (Math.random() - 0.5) * 2, z.r * 0.6);
        g.fillStyle(c.core, fade);
        for (let i = 0; i < 6; i++) {
          const a = Math.random() * TAU;
          const d = z.r * (0.8 + Math.random() * 0.6);
          g.fillRect(Math.round(z.x + Math.cos(a) * d), Math.round(z.y + Math.sin(a) * d), 1, 1);
        }
      }
    }
    for (const bm of this.beams) {
      if (bm.t < bm.warn) {
        // blinking warning line, faster towards the strike
        if (Math.floor(bm.t * (8 + bm.t * 14)) % 2) continue;
        g.lineStyle(1, bm.kind === 'steam' ? 0xffffff : 0x9ad8ff, 0.6);
        g.lineBetween(bm.x, bm.y0, bm.x, H);
      } else if (bm.kind === 'steam') {
        g.fillStyle(0xffffff, 0.45);
        g.fillRect(bm.x - bm.w / 2, bm.y0, bm.w, H - bm.y0);
        g.fillStyle(0xffffff, 0.75);
        g.fillRect(bm.x - bm.w / 4, bm.y0, bm.w / 2, H - bm.y0);
      } else {
        // a jagged bolt with a cyan glow
        let x = bm.x;
        g.lineStyle(bm.w, 0x6ac8ff, 0.5);
        g.lineBetween(bm.x, bm.y0, bm.x, H);
        g.lineStyle(1.5, 0xffffff, 1);
        g.beginPath();
        g.moveTo(x, bm.y0);
        for (let y = bm.y0 + 10; y < H + 10; y += 10) {
          x = bm.x + (Math.random() - 0.5) * bm.w;
          g.lineTo(x, y);
        }
        g.strokePath();
      }
    }
    for (const b of this.pool.live) {
      const o = b.link;
      if (!b.lead || !o || o.dead || o.link !== b) continue;
      g.lineStyle(1, 0xc8f4ff, 0.9);
      g.beginPath();
      g.moveTo(b.x, b.y);
      for (let k = 1; k < 5; k++) g.lineTo(b.x + ((o.x - b.x) * k) / 5 + (Math.random() - 0.5) * 3, b.y + ((o.y - b.y) * k) / 5 + (Math.random() - 0.5) * 3);
      g.lineTo(o.x, o.y);
      g.strokePath();
    }
  }

  /** Stop in mid-air, hang as an ice crystal, then fly on in a turned direction. */
  freeze(b, dt) {
    const f = b.frz;
    if (!f.frozen) {
      if (f.at - b.age < 0.18) {
        b.vx *= 1 - Math.min(1, dt * 9);
        b.vy *= 1 - Math.min(1, dt * 9);
      }
      if (b.age >= f.at) {
        f.frozen = true;
        f.ang = Math.atan2(b.vy, b.vx) + f.turn;
        b.vx = 0;
        b.vy = 0;
        b.setFrame('eb_ice');
        b.radius = 2.2;
      }
    } else if (b.age >= f.at + f.hold) {
      b.vx = Math.cos(f.ang) * f.speed;
      b.vy = Math.sin(f.ang) * f.speed;
      b.frz = null;
    }
  }
}
