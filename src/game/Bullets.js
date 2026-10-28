import { DEPTH } from '../config.js';
import { Pool } from './Pool.js';

// Enemy bullets: bright core, dark outline, slow. Angle: radians, 0 = right, PI/2 = down.
export class Bullets {
  constructor(scene) {
    this.scene = scene;
    this.pool = new Pool(scene, DEPTH.enemyBullet);
  }

  fire(x, y, angle, speed, big = false) {
    if (this.scene.bombClear > 0) return null;
    return this.pool.spawn(big ? 'eb_m' : 'eb_s', x, y, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: big ? 2.5 : 1.8,
    });
  }

  /** n bullets spread over `arc` (radians) centred on `angle`. */
  fan(x, y, angle, n, arc, speed, big) {
    for (let i = 0; i < n; i++) this.fire(x, y, angle + (n > 1 ? (i / (n - 1) - 0.5) * arc : 0), speed, big);
  }

  ring(x, y, n, offset, speed, big) {
    for (let i = 0; i < n; i++) this.fire(x, y, offset + (i / n) * Math.PI * 2, speed, big);
  }

  /** Cancel every bullet on screen (bomb, heavy destroyed). */
  cancelAll(fx) {
    for (const b of this.pool.live) {
      if (fx && Math.random() < 0.5) fx.spark(b.x, b.y);
      this.pool.kill(b);
    }
    this.pool.sweep();
  }

  update(dt, H) {
    for (const b of this.pool.live) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < -8 || b.x > 188 || b.y < -12 || b.y > H + 8) this.pool.kill(b);
    }
    this.pool.sweep();
  }
}
