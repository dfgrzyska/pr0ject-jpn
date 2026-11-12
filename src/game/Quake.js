// Kagoshima: now and then Sakurajima shakes the ground. Only to see and hear: the screen shudders, a deep
// rumble, ash and grit shaken loose falling. Never during a heavy or the boss (they have shakes of their own),
// and with its own random numbers so the game's (the waves, the bullets) are not touched.
import { VIEW } from '../config.js';

const LEN = 2.4; // seconds

export class Quake {
  constructor(scene, times) {
    this.s = scene;
    this.times = [...times].sort((a, b) => a - b);
    this.t = -1;
    this.seed = 0x5a3c1;
    this.grit = 0;
  }

  rnd() {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  /** 0..1: a quick jolt, the shaking at its worst, then dying away. */
  level() {
    const t = this.t;
    if (t < 0.25) return 0.35 + 2.6 * t;
    if (t < 1.1) return 1;
    return Math.max(0, 1 - (t - 1.1) / (LEN - 1.1)) ** 1.5;
  }

  update(dt) {
    const s = this.s;
    if (this.t < 0) {
      while (this.times.length && s.t > this.times[0] + 0.5) this.times.shift(); // (long gone: started further on)
      if (!this.times.length || s.t < this.times[0]) return;
      this.times.shift();
      if (s.enemies.heavy || s.enemies.bossGroup || !s.player.alive) return;
      this.t = 0;
      s.sfx.quake?.();
      s.fx.text(VIEW.width / 2, 64, 'TRZĘSIENIE ZIEMI!', 1.4, 0xffb070);
    }
    this.t += dt;
    const k = this.level();
    // the shake, its strength following the curve: the camera jolted about by a few pixels (by sines, not the
    // camera's own shake, which would draw on the game's random numbers)
    const t = this.t;
    const a = 0.3 + 1.2 * k;
    s.cameras.main.setScroll((a * (Math.sin(t * 67) + 0.6 * Math.sin(t * 151 + 1))) / 1.6, (a * (Math.sin(t * 59 + 2) + 0.6 * Math.sin(t * 137))) / 1.6);
    // ash and grit shaken off, falling fast
    const px = s.parallax;
    this.grit += dt * 70 * k;
    while (this.grit >= 1) {
      this.grit -= 1;
      const size = this.rnd() < 0.5 ? 1 : 2;
      const b = px.bit(`ashf_${size}`, this.rnd() * VIEW.width, -4 - this.rnd() * 20, 140 + this.rnd() * 120, (this.rnd() - 0.5) * 30, 0, 2, this.rnd() * 6, 0);
      b.setAlpha(0.6 + 0.3 * this.rnd());
    }
    if (this.t >= LEN) this.stop();
  }

  /** Still again (the end of the shaking, or the game leaving play in the middle of it). */
  stop() {
    if (this.t < 0) return;
    this.t = -1;
    this.s.cameras.main.setScroll(0, 0);
  }
}
