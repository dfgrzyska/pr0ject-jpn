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
// lobbed projectile looks: sprite low / high in the arc; spin = turns in flight
const LOBS = {
  snowball: { low: 'snowball_0', high: 'snowball_1', spin: 0 },
  tokkuri: { low: 'tokkuri_0', high: 'tokkuri_1', spin: 9 },
};

const PLAIN = { ax: 0, ay: 0, maxV: Infinity, life: Infinity, safe: 0, frz: null, wig: 0, wf: 0, spin: false, age: 0 };

// Enemy bullets: bright core, dark outline, slow. Angle: radians, 0 = right, PI/2 = down.
// Lobbed snowballs fly above everything, harmless, with a ring marking where they land.
export class Bullets {
  constructor(scene) {
    this.scene = scene;
    this.pool = new Pool(scene, DEPTH.enemyBullet);
    this.lobs = new Pool(scene, DEPTH.enemyBullet + 0.5);
    this.marks = new Pool(scene, DEPTH.ground + 0.4);
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

  /** Snowball (or sake flask) thrown in an arc from (x, y) to (tx, ty); bursts into a small ring where it lands. */
  lob(x, y, tx, ty, time = 1.15, kind = 'snowball') {
    if (this.scene.bombClear > 0) return;
    const mark = this.marks.spawn('lob_mark_0', tx, ty);
    const look = LOBS[kind];
    this.lobs.spawn(look.low, x, y, { x0: x, y0: y, tx, ty, t: 0, time, mark, look });
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
      if (b.wig) {
        b.bx += b.vx * dt;
        b.by += b.vy * dt;
        const v = Math.hypot(b.vx, b.vy) || 1;
        const o = Math.sin(b.age * b.wf) * b.wig;
        b.x = b.bx - (b.vy / v) * o;
        b.y = b.by + (b.vx / v) * o;
      } else {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }
      if ((b.life -= dt) <= 0 || b.x < -8 || b.x > 188 || b.y < -12 || b.y > H + 8) this.pool.kill(b);
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
      this.ring(l.tx, l.ty, 6, Math.random() * TAU, FAIR.bulletSpeed.slow * 0.85);
      this.scene.fx.shards(l.tx, l.ty, 6, true);
    }
    this.lobs.sweep();
    this.marks.sweep();
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
