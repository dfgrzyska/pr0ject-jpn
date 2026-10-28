// Subtle synthesized sound effects: weapon fire and enemy destruction.
// Shots fire up to 30x per second, so each sound is short, quiet and rate-limited.
import { Synth } from './synth.js';

const VOLUME = 0.9;
const SHOT_GAP = { basic: 0.075, spread: 0.075, laser: 0.09, homing: 0.15 };
const BOOM_GAP = { s: 0.035, m: 0.06, l: 0.25 };

export class Sfx {
  constructor(ctx, destination) {
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = VOLUME;
    this.out.connect(destination);
    this.s = new Synth(ctx, this.out);
    this.last = {};
  }

  now() {
    return this.ctx.currentTime + 0.005;
  }

  /** True when `key` has been quiet for at least `gap` seconds (and marks it played). */
  ready(key, gap) {
    const t = this.now();
    if (this.ctx.state !== 'running' || t - (this.last[key] ?? -1) < gap) return false;
    this.last[key] = t;
    return true;
  }

  // pitch-swept oscillator blip
  blip(type, f0, f1, len, level, t, filter = null) {
    const s = this.s;
    const o = s.osc(type, f0, t, t + len + 0.02);
    o.frequency.exponentialRampToValueAtTime(f1, t + len);
    const g = s.gain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    (filter ? o.connect(filter) : o).connect(g).connect(this.out);
  }

  // noise through a low-pass that closes over `len`
  sweep(f0, f1, len, level, t) {
    const s = this.s;
    const src = this.ctx.createBufferSource();
    src.buffer = s.noise;
    const lp = s.filter('lowpass', f0, 0.9);
    lp.frequency.setValueAtTime(f0, t);
    lp.frequency.exponentialRampToValueAtTime(f1, t + len);
    const g = s.gain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(lp).connect(g).connect(this.out);
    src.start(t, Math.random() * 0.4, len + 0.05);
  }

  shot(weapon) {
    if (!this.ready(`shot_${weapon}`, SHOT_GAP[weapon] ?? 0.08)) return;
    const t = this.now();
    const r = 0.97 + Math.random() * 0.06; // tiny pitch variation keeps rapid fire from droning
    switch (weapon) {
      case 'spread':
        this.s.noiseBurst(t, 0.03, 'bandpass', 2800 * r, 0.9, 0.13);
        this.blip('square', 760 * r, 300, 0.04, 0.045, t, this.s.filter('highpass', 300));
        break;
      case 'laser':
        this.blip('triangle', 2100 * r, 1450, 0.035, 0.11, t);
        break;
      case 'homing':
        this.blip('sine', 480 * r, 1000, 0.09, 0.14, t);
        break;
      default:
        this.blip('square', 1250 * r, 520, 0.045, 0.055, t, this.s.filter('highpass', 400));
    }
  }

  /** size: 's' popcorn/diver/carrier, 'm' shooter/turret/player, 'l' heavy. */
  explode(size) {
    if (!this.ready(`boom_${size}`, BOOM_GAP[size] ?? 0.05)) return;
    const t = this.now();
    const r = 0.92 + Math.random() * 0.16;
    if (size === 's') {
      this.sweep(3800 * r, 260, 0.22, 0.24, t);
      this.blip('square', 240 * r, 55, 0.14, 0.06, t, this.s.filter('lowpass', 900));
    } else if (size === 'm') {
      this.sweep(2600 * r, 160, 0.45, 0.21, t);
      this.blip('sine', 130 * r, 38, 0.32, 0.28, t);
    } else {
      this.sweep(1800, 90, 1.3, 0.2, t);
      this.blip('sine', 90, 28, 1.0, 0.3, t);
      this.sweep(5000, 400, 0.3, 0.1, t + 0.02);
    }
  }
}
