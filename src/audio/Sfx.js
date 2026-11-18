// Subtle synthesized sound effects: weapon fire, explosions, pickups, grazing, the bomb, the player's
// death, hits on bosses, and the warning (with a kakegoe shout) when a boss is coming.
// Shots fire up to 30x per second, so each sound is short, quiet and rate-limited.
import { Synth } from './synth.js';

const VOLUME = 0.9;
const SHOT_GAP = { basic: 0.075, spread: 0.075, laser: 0.09, homing: 0.15 };
const BOOM_GAP = { s: 0.035, m: 0.06, l: 0.25 };

// each weapon's blip (from Hz, to Hz, s, level): what a voice out of the gachapon is played against
const VOICED = { basic: [1250, 520, 0.045, 0.055], spread: [760, 300, 0.04, 0.06], laser: [2100, 1450, 0.035, 0.11], homing: [480, 1000, 0.09, 0.14] };

export class Sfx {
  constructor(ctx, destination) {
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = VOLUME;
    this.out.connect(destination);
    this.s = new Synth(ctx, this.out);
    this.last = {};
    this.muted = false; // the speaker switched off: no sound is built at all (Music.toggle sets it)
  }

  now() {
    return this.ctx.currentTime + 0.005;
  }

  /** True when `key` has been quiet for at least `gap` seconds (and marks it played). */
  ready(key, gap) {
    const t = this.now();
    if (this.muted || this.ctx.state !== 'running' || t - (this.last[key] ?? -1) < gap) return false;
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

  /** A temple bell (bonshō) struck once: low inharmonic partials, slightly beating, ringing out for seconds. */
  bell() {
    if (!this.ready('bell', 2)) return;
    const t = this.now();
    const s = this.s;
    for (const [f, a, len] of [[98, 0.11, 6], [98.6, 0.06, 5.5], [196.4, 0.05, 4.5], [261, 0.035, 3.6], [392.5, 0.022, 2.6], [523, 0.012, 1.8]]) {
      const o = s.osc('sine', f, t, t + len + 0.05);
      const g = s.gain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(a, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g).connect(this.out);
    }
    this.sweep(900, 200, 0.18, 0.05, t);
  }

  /** voice: a sound out of the gachapon ({ wave, pitch, len, level, up }) in place of the weapon's own. */
  shot(weapon, voice = null) {
    if (!this.ready(`shot_${weapon}`, SHOT_GAP[weapon] ?? 0.08)) return;
    const t = this.now();
    const r = 0.97 + Math.random() * 0.06; // tiny pitch variation keeps rapid fire from droning
    if (voice) {
      const [f0, f1, len, level] = VOICED[weapon] ?? VOICED.basic;
      const a = f0 * voice.pitch * r;
      const b = f1 * voice.pitch;
      this.blip(voice.wave, voice.up ? Math.min(a, b) : a, voice.up ? Math.max(a, b) : b, len * voice.len, level * voice.level, t);
      return;
    }
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

  /** A stamp pressed onto paper: a soft thump, the rustle of the page. */
  stamp() {
    if (this.muted) return;
    const t = this.now();
    this.blip('sine', 150, 45, 0.2, 0.42, t);
    this.s.noiseBurst(t, 0.07, 'lowpass', 600, 1, 0.35);
    this.s.noiseBurst(t + 0.03, 0.12, 'highpass', 3200, 1, 0.07);
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
    if (this.muted) return;
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

  /** Kagoshima's earthquake: a deep rumble swelling and dying away, with a crack of rock in it. */
  quake() {
    if (this.muted) return;
    const t = this.now();
    const s = this.s;
    const src = this.ctx.createBufferSource();
    src.buffer = s.noise;
    src.loop = true;
    const lp = s.filter('lowpass', 140, 1.5);
    const g = s.gain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.25);
    g.gain.setValueAtTime(0.5, t + 1.0);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    src.connect(lp).connect(g).connect(this.out);
    src.start(t);
    src.stop(t + 2.5);
    this.blip('sine', 46, 30, 2.2, 0.3, t);
    this.blip('square', 160, 50, 0.25, 0.05, t + 0.05, s.filter('lowpass', 600));
  }

  /** The player's ship going down: a falling squeal and a crunch. */
  hit() {
    if (this.muted) return;
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
    if (this.muted) return;
    const t = this.now();
    for (let i = 0; i < 6; i++) this.blip('square', i % 2 ? 660 : 880, i % 2 ? 655 : 875, 0.16, 0.045, t + i * 0.18, this.s.filter('lowpass', 2400));
  }

  /** A kakegoe shout, "yoo!", the way a tsuzumi player calls before the beat. */
  shout(delay = 0) {
    if (this.muted) return;
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
  // ---- the gachapon (src/game/Gacha.js)
  /** The ticket going into its slot: paper, then the machine's chirp. */
  ticketIn() {
    if (!this.ready('gticket', 0.1)) return;
    const t = this.now();
    this.sweep(5200, 1800, 0.09, 0.12, t);
    this.blip('square', 880, 1320, 0.07, 0.07, t + 0.1);
    this.blip('square', 1320, 1760, 0.09, 0.07, t + 0.18);
  }

  /** One notch of the crank. */
  crankClick() {
    if (!this.ready('gcrank', 0.05)) return;
    const t = this.now();
    this.sweep(2600, 500, 0.045, 0.2, t);
    this.blip('triangle', 190, 120, 0.06, 0.16, t);
  }

  /** The capsules knocking about under the glass. */
  capsuleRattle() {
    if (!this.ready('grattle', 0.07)) return;
    this.blip('sine', 520 + Math.random() * 380, 300, 0.035, 0.05, this.now());
  }

  /** The capsule landing: a hollow plastic knock, softer with each bounce (`k`: 1 the first). */
  capsuleBounce(k = 1) {
    if (!this.ready('gbounce', 0.05)) return;
    const t = this.now();
    this.blip('sine', 420, 170, 0.09, 0.22 / k, t);
    this.sweep(1800, 400, 0.05, 0.1 / k, t);
  }

  /** The capsule cracking open. */
  capsuleOpen() {
    if (!this.ready('gopen', 0.1)) return;
    const t = this.now();
    this.sweep(6000, 900, 0.16, 0.24, t);
    this.blip('square', 320, 1280, 0.12, 0.09, t);
  }

  /** The prize shown: a rising run of notes, longer and brighter the rarer it is (`tier`: 0 plain .. 4 legendary). */
  prize(tier) {
    if (!this.ready('gprize', 0.2)) return;
    const t = this.now();
    const scale = [523, 659, 784, 1047, 1319, 1568, 2093]; // C E G C E G C
    const n = 3 + tier;
    for (let i = 0; i < n; i++) this.blip(tier >= 3 ? 'square' : 'triangle', scale[i], scale[i] * 1.005, 0.16 + (i === n - 1 ? 0.3 : 0), 0.11, t + i * 0.075);
    if (tier >= 2) for (let i = 0; i < n; i++) this.blip('sine', scale[i] * 2, scale[i] * 2, 0.2, 0.05, t + i * 0.075);
    if (tier >= 4) for (let i = 0; i < 8; i++) this.blip('sine', 2093 + Math.random() * 2000, 3000, 0.08, 0.04, t + 0.6 + i * 0.07);
  }

  /** No ticket to put in. */
  denied() {
    if (!this.ready('gdenied', 0.2)) return;
    const t = this.now();
    this.blip('square', 220, 180, 0.09, 0.09, t);
    this.blip('square', 180, 150, 0.12, 0.09, t + 0.11);
  }

  // ---- Tokyo
  // noise through a band-pass that swells in and dies away (steam, fat, a blade through the air)
  hiss(t, len, level, f0, f1 = f0, q = 0.8, attack = 0.02) {
    const s = this.s;
    const src = this.ctx.createBufferSource();
    src.buffer = s.noise;
    const bp = s.filter('bandpass', f0, q);
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + len);
    const g = s.gain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(bp).connect(g).connect(this.out);
    src.start(t, Math.random() * 0.4, len + 0.05);
  }

  /**
   * Rain on the city, `level` 0..1 — call it every frame: a steady hiss under the music with drops ticking off the
   * umbrellas and roofs, easing up and down with the shower; 0 (paused, off the stage) fades it out and lets it go.
   */
  rain(level) {
    const want = this.muted || this.ctx.state !== 'running' ? 0 : Math.max(0, Math.min(1, level));
    let r = this.rainBed;
    if (!r) {
      if (want <= 0) return;
      const s = this.s;
      const src = this.ctx.createBufferSource();
      src.buffer = s.noise;
      src.loop = true;
      const hp = s.filter('highpass', 900, 0.5);
      const lp = s.filter('lowpass', 6500, 0.5);
      const g = s.gain(0);
      src.connect(hp).connect(lp).connect(g).connect(this.out);
      src.start();
      r = this.rainBed = { src, g, level: 0, quiet: 0 };
    }
    const now = this.ctx.currentTime;
    if (Math.abs(want - r.level) > 0.02 || (want === 0 && r.level !== 0)) {
      r.g.gain.setTargetAtTime(want * 0.045, now, 0.5);
      r.level = want;
    }
    if (want > 0) {
      r.quiet = now;
      // drops: a little pitched tick now and then, more of them the harder it rains
      if (Math.random() < want * 0.3 && this.ready('raindrop', 0.03)) {
        const f = 1800 + Math.random() * 2600;
        this.blip('sine', f, f * 0.55, 0.03, 0.012 + 0.02 * want * Math.random(), this.now());
      }
    } else if (now - r.quiet > 3) {
      r.src.stop();
      r.g.disconnect();
      this.rainBed = null;
    }
  }

  /** The pedestrian crossing's signal: 'tick' (about to go), 'go' (a two-note chirp while the green man walks), 'red'. */
  signal(kind) {
    if (!this.ready(`signal_${kind}`, 0.1)) return;
    const t = this.now();
    if (kind === 'go') {
      this.blip('sine', 2300, 3300, 0.05, 0.045, t);
      this.blip('sine', 2100, 3100, 0.06, 0.04, t + 0.1);
    } else if (kind === 'red') {
      this.blip('square', 880, 878, 0.18, 0.03, t, this.s.filter('lowpass', 2200));
    } else this.blip('square', 1180, 1170, 0.025, 0.03, t, this.s.filter('lowpass', 3000));
  }

  /** Batter in a hot iron mould: fat crackling, now and then a breath of steam. Call it every frame while it bakes. */
  sizzle() {
    if (!this.ready('sizzle', 0.045)) return;
    const t = this.now();
    for (let i = 0; i < 2; i++) this.s.noiseBurst(t + Math.random() * 0.04, 0.012 + Math.random() * 0.015, 'bandpass', 2500 + Math.random() * 5000, 4, 0.03 + Math.random() * 0.04);
    if (this.ready('sizzle_bed', 0.4)) this.hiss(t, 0.5, 0.025, 6000, 4500, 0.7, 0.08);
  }

  /** Kurogane's machinery: 'hiss' (steam out of a valve), 'servo' (a motor whining up and a joint locking). */
  actuator(kind) {
    if (kind === 'hiss') {
      if (!this.ready('hiss', 1)) return;
      this.hiss(this.now(), 0.45, 0.07, 4800, 3200, 0.6);
      return;
    }
    if (!this.ready('servo', 0.12)) return;
    const t = this.now();
    this.blip('sawtooth', 180, 520, 0.2, 0.045, t, this.s.filter('lowpass', 1600));
    this.blip('sine', 160, 60, 0.09, 0.25, t + 0.21);
    this.s.noiseBurst(t + 0.21, 0.05, 'lowpass', 900, 1, 0.18);
  }

  /** The blade: 'draw' (steel scraping out and ringing), 'swing' (a cut through the air). */
  katana(kind) {
    if (!this.ready(`katana_${kind}`, 0.08)) return;
    const t = this.now();
    if (kind === 'draw') {
      this.hiss(t, 0.28, 0.08, 2000, 7000, 3, 0.05);
      for (const [f, a] of [[2950, 0.03], [4420, 0.022], [6130, 0.014]]) this.blip('sine', f, f * 0.998, 0.9, a, t + 0.2);
      return;
    }
    this.hiss(t, 0.24, 0.16, 700, 2600, 1.2, 0.09);
    this.blip('sine', 3800, 3700, 0.2, 0.012, t + 0.06);
  }

  // ---- Kawaguchiko
  /** The hare's striker on the flint: a hard click and a spit of sparks. */
  flint() {
    if (!this.ready('flint', 0.1)) return;
    const t = this.now();
    this.s.noiseBurst(t, 0.012, 'highpass', 5000, 1, 0.14);
    this.blip('square', 3400, 2500, 0.022, 0.03, t, this.s.filter('bandpass', 3000, 2));
    for (let i = 0; i < 4; i++) this.s.noiseBurst(t + 0.02 + Math.random() * 0.09, 0.008, 'bandpass', 6000 + Math.random() * 3000, 6, 0.05);
  }

  /** An oar dipping into the lake (or a hand scooping it): a short splash and the gulp of the water. */
  oar() {
    if (!this.ready('oar', 0.18)) return;
    const t = this.now();
    this.hiss(t, 0.28, 0.05, 1300, 500, 0.8, 0.025);
    this.blip('sine', 340, 170, 0.08, 0.035, t + 0.03);
  }

  /** A bonfire of leaves: pops and crackles. Call it every frame while it burns. */
  crackle() {
    if (!this.ready('crackle', 0.07)) return;
    const t = this.now();
    for (let i = 0; i < 2; i++) this.s.noiseBurst(t + Math.random() * 0.05, 0.006 + Math.random() * 0.012, 'bandpass', 1400 + Math.random() * 2600, 3, 0.04 + Math.random() * 0.06);
    if (this.ready('crackle_bed', 0.5)) this.hiss(t, 0.45, 0.02, 900, 700, 0.6, 0.1);
  }

  /** Dry leaves stirred: a rustle swelling in and dying away. */
  rustle() {
    if (!this.ready('rustle', 0.25)) return;
    const t = this.now();
    this.hiss(t, 0.4, 0.05, 3800, 2600, 0.9, 0.08);
    for (let i = 0; i < 5; i++) this.s.noiseBurst(t + Math.random() * 0.3, 0.01, 'highpass', 4500, 1, 0.025);
  }

  /** Earth giving way: a low slide of soil, clods thudding down. */
  earth(big = false) {
    if (!this.ready(big ? 'earth_big' : 'earth', big ? 0.4 : 0.12)) return;
    const t = this.now();
    const k = big ? 1.6 : 1;
    this.sweep(900, 110, 0.55 * k, 0.16 * k, t);
    for (let i = 0; i < (big ? 7 : 4); i++) this.s.noiseBurst(t + 0.04 + Math.random() * 0.4 * k, 0.04, 'lowpass', 380, 1, 0.1 + Math.random() * 0.06);
    if (big) this.blip('sine', 90, 36, 0.6, 0.22, t);
  }

  /** An earthen crock breaking on the water: a hard clack, the shards' clatter, a splash. */
  crock() {
    if (!this.ready('crock', 0.1)) return;
    const t = this.now();
    this.s.noiseBurst(t, 0.03, 'bandpass', 2400, 2, 0.22);
    this.blip('triangle', 980, 420, 0.07, 0.07, t);
    for (let i = 0; i < 4; i++) this.s.noiseBurst(t + 0.03 + Math.random() * 0.12, 0.012, 'bandpass', 3500 + Math.random() * 2500, 5, 0.06);
    this.hiss(t + 0.04, 0.2, 0.04, 1300, 500, 0.8, 0.02);
  }

  /** A rope parting: the crack of the fibres and the slack end whipping off. */
  rope() {
    if (!this.ready('rope', 0.08)) return;
    const t = this.now();
    this.s.noiseBurst(t, 0.02, 'highpass', 2800, 1, 0.2);
    this.blip('triangle', 560, 130, 0.18, 0.06, t + 0.01);
    this.hiss(t + 0.02, 0.16, 0.04, 2000, 900, 1, 0.01);
  }

  /** A glass wind bell (fūrin) on the eaves: a thin, high ring with a clink of its clapper, dying away. */
  furin() {
    if (!this.ready('furin', 0.35)) return;
    const t = this.now();
    const s = this.s;
    const f = 2300 + Math.random() * 300;
    for (const [k, a, len] of [[1, 0.035, 1.1], [1.503, 0.018, 0.8], [2.76, 0.01, 0.5]]) {
      const o = s.osc('sine', f * k, t, t + len + 0.05);
      const g = s.gain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(a, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g).connect(this.out);
    }
    s.noiseBurst(t, 0.006, 'highpass', 6000, 1, 0.05);
  }

  /** A cat's "nyaa": a nasal tone rising and falling through a vowel's formant. */
  meow() {
    if (!this.ready('meow', 0.3)) return;
    const t = this.now();
    const s = this.s;
    const r = 0.9 + Math.random() * 0.25;
    const o = s.osc('sawtooth', 520 * r, t, t + 0.45);
    o.frequency.setValueAtTime(520 * r, t);
    o.frequency.linearRampToValueAtTime(860 * r, t + 0.12);
    o.frequency.exponentialRampToValueAtTime(430 * r, t + 0.4);
    const bp = s.filter('bandpass', 1300, 3);
    bp.frequency.setValueAtTime(900, t);
    bp.frequency.linearRampToValueAtTime(1600, t + 0.14);
    bp.frequency.linearRampToValueAtTime(800, t + 0.4);
    const g = s.gain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    o.connect(bp).connect(g).connect(this.out);
  }

  /** Water flung out of a ladle: a slap of water and its spray. */
  splash() {
    if (!this.ready('splash', 0.12)) return;
    const t = this.now();
    this.hiss(t, 0.3, 0.06, 1800, 600, 0.7, 0.01);
    this.blip('sine', 420, 180, 0.07, 0.03, t);
    for (let i = 0; i < 3; i++) this.s.noiseBurst(t + 0.05 + Math.random() * 0.15, 0.01, 'bandpass', 3000 + Math.random() * 2000, 4, 0.03);
  }

  /** A conch (horagai) blown: a hoarse, low horn swelling and breaking off. */
  conch() {
    if (!this.ready('conch', 1)) return;
    const t = this.now();
    const s = this.s;
    for (const [f, a] of [[146.8, 0.07], [147.6, 0.05], [293.6, 0.025]]) {
      const o = s.osc('sawtooth', f, t, t + 1.5);
      o.frequency.setValueAtTime(f * 0.94, t);
      o.frequency.linearRampToValueAtTime(f, t + 0.18);
      const lp = s.filter('lowpass', 400, 1.2);
      lp.frequency.setValueAtTime(300, t);
      lp.frequency.linearRampToValueAtTime(1100, t + 0.3);
      lp.frequency.linearRampToValueAtTime(600, t + 1.3);
      const g = s.gain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(a, t + 0.15);
      g.gain.setValueAtTime(a, t + 1.1);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.45);
      o.connect(lp).connect(g).connect(this.out);
    }
    this.hiss(t, 1.3, 0.02, 900, 700, 0.6, 0.1); // (the breath in it)
  }

  /** A firework shell going up: its whistle rising; `open`: the boom and the crackle of it opening. */
  hanabi(open = false) {
    if (!this.ready(open ? 'hanabi_open' : 'hanabi_up', open ? 0.18 : 0.3)) return;
    const t = this.now();
    if (!open) {
      const o = this.s.osc('sine', 900, t, t + 0.65);
      o.frequency.exponentialRampToValueAtTime(1900, t + 0.6);
      const g = this.s.gain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.012, t + 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
      o.connect(g).connect(this.out);
      return;
    }
    this.blip('sine', 110, 38, 0.5, 0.12, t);
    this.sweep(1600, 160, 0.5, 0.06, t);
    for (let i = 0; i < 6; i++) this.s.noiseBurst(t + 0.25 + Math.random() * 0.6, 0.006, 'bandpass', 2500 + Math.random() * 3000, 4, 0.025);
  }

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
