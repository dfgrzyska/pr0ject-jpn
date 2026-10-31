// Subtle synthesized sound effects: weapon fire, explosions, pickups, grazing, the bomb, the player's
// death, hits on bosses, and the warning (with a kakegoe shout) when a boss is coming.
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

  /** A bullet brushing past: a tiny bright tick. */
  graze() {
    if (!this.ready('graze', 0.05)) return;
    const t = this.now();
    this.blip('sine', 2500 + Math.random() * 300, 3400, 0.035, 0.05, t);
  }

  /** Two quick notes for a pickup. */
  pickup() {
    if (!this.ready('pickup', 0.08)) return;
    const t = this.now();
    this.blip('square', 880, 870, 0.05, 0.045, t, this.s.filter('lowpass', 3200));
    this.blip('square', 1320, 1310, 0.08, 0.045, t + 0.055, this.s.filter('lowpass', 3200));
  }

  /** A rising arpeggio: power up, a bomb earned back. */
  powerUp() {
    if (!this.ready('powerup', 0.2)) return;
    const t = this.now();
    [660, 880, 1100, 1320, 1760].forEach((f, i) => this.blip('triangle', f, f * 1.01, 0.06, 0.08, t + i * 0.045));
  }

  /** The bomb: a rising whoosh into a deep boom. */
  bomb() {
    const t = this.now();
    const s = this.s;
    const src = this.ctx.createBufferSource();
    src.buffer = s.noise;
    const bp = s.filter('bandpass', 300, 1.2);
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(3500, t + 0.3);
    const g = s.gain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    src.connect(bp).connect(g).connect(this.out);
    src.start(t, 0, 0.7);
    this.blip('sine', 110, 28, 0.9, 0.35, t + 0.22);
    this.sweep(2400, 80, 1.0, 0.18, t + 0.22);
  }

  /** The player's ship going down: a falling squeal and a crunch. */
  hit() {
    const t = this.now();
    this.blip('square', 900, 70, 0.45, 0.07, t, this.s.filter('lowpass', 2200));
    this.blip('sawtooth', 450, 40, 0.5, 0.05, t + 0.03, this.s.filter('lowpass', 1400));
    this.sweep(3200, 120, 0.6, 0.2, t);
  }

  /** A shot striking a boss: a dry metallic tick (an armoured one rings duller). */
  bossHit(armoured = false) {
    if (!this.ready('bosshit', 0.09)) return;
    const t = this.now();
    if (armoured) this.blip('triangle', 1200, 1100, 0.04, 0.035, t);
    else this.blip('triangle', 1900 + Math.random() * 200, 1500, 0.03, 0.03, t);
    this.s.noiseBurst(t, 0.02, 'highpass', 4500, 1, 0.04);
  }

  /** The warning before a boss: a two-tone alarm. */
  warning() {
    const t = this.now();
    for (let i = 0; i < 6; i++) this.blip('square', i % 2 ? 660 : 880, i % 2 ? 655 : 875, 0.16, 0.045, t + i * 0.18, this.s.filter('lowpass', 2400));
  }

  /** A kakegoe shout, "yoo!", the way a tsuzumi player calls before the beat. */
  shout(delay = 0) {
    const t = this.now() + delay;
    const s = this.s;
    const o = s.osc('sawtooth', 230, t, t + 0.6);
    o.frequency.linearRampToValueAtTime(260, t + 0.08);
    o.frequency.exponentialRampToValueAtTime(170, t + 0.55);
    const lfo = s.osc('sine', 6, t, t + 0.6);
    const depth = s.gain(6);
    lfo.connect(depth).connect(o.frequency);
    const f1 = s.filter('bandpass', 380, 5);
    f1.frequency.setValueAtTime(320, t);
    f1.frequency.linearRampToValueAtTime(560, t + 0.12); // "y" opening into "o"
    const f2 = s.filter('bandpass', 1900, 7);
    f2.frequency.setValueAtTime(2100, t);
    f2.frequency.linearRampToValueAtTime(950, t + 0.12);
    const g = s.gain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.05);
    g.gain.setValueAtTime(0.5, t + 0.32);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.58);
    o.connect(f1).connect(g);
    o.connect(f2).connect(g);
    g.connect(this.out);
    s.noiseBurst(t, 0.05, 'bandpass', 2600, 2, 0.05);
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
