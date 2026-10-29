// Small Web Audio instrument set: koto pluck, shakuhachi-like lead, chip bass, taiko, ka (rim), shaker, pad.
// Every note builds a few short-lived nodes scheduled at an exact AudioContext time.

export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function noiseBuffer(ctx) {
  const len = ctx.sampleRate;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

export class Synth {
  constructor(ctx, out) {
    this.ctx = ctx;
    this.out = out;
    this.noise = noiseBuffer(ctx);
  }

  osc(type, freq, t, stop) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.start(t);
    o.stop(stop);
    return o;
  }

  gain(value = 0) {
    const g = this.ctx.createGain();
    g.gain.value = value;
    return g;
  }

  filter(type, freq, q = 1) {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  noiseBurst(t, dur, filterType, freq, q, level) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.filter(filterType, freq, q);
    const g = this.gain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.out);
    src.start(t, Math.random() * 0.5, dur + 0.02);
  }

  /** Plucked string: bright saw through a closing low-pass, fast exponential decay. */
  koto(t, m, dur, v = 1) {
    const f = mtof(m);
    const end = t + 1.1;
    const o = this.osc('sawtooth', f * 1.015, t, end);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.03);
    const o2 = this.osc('triangle', f * 2, t, end);
    const lp = this.filter('lowpass', 5200, 2.5);
    lp.frequency.setValueAtTime(5200, t);
    lp.frequency.exponentialRampToValueAtTime(650, t + 0.4);
    const g = this.gain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.13 * v, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(1.05, 0.35 + dur));
    const g2 = this.gain(0.22);
    o.connect(lp);
    o2.connect(g2).connect(lp);
    lp.connect(g).connect(this.out);
  }

  /** Breathy lead with delayed vibrato (shakuhachi flavour, chiptune body). */
  lead(t, m, dur, v = 1) {
    const f = mtof(m);
    const end = t + dur + 0.15;
    const sq = this.osc('square', f, t, end);
    const tri = this.osc('triangle', f, t, end);
    const lfo = this.osc('sine', 5.6, t, end);
    const depth = this.gain();
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(f * 0.007, t + Math.min(0.3, dur * 0.6));
    lfo.connect(depth);
    depth.connect(sq.frequency);
    depth.connect(tri.frequency);
    const lp = this.filter('lowpass', 2600, 0.7);
    const mixSq = this.gain(0.35);
    const g = this.gain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.085 * v, t + 0.03);
    g.gain.setValueAtTime(0.085 * v, t + Math.max(0.03, dur - 0.03));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
    sq.connect(mixSq).connect(lp);
    tri.connect(lp);
    lp.connect(g).connect(this.out);
    this.noiseBurst(t, 0.09, 'bandpass', 1900, 1.2, 0.035 * v);
  }

  bass(t, m, dur, v = 1) {
    const f = mtof(m);
    const end = t + dur + 0.08;
    const o = this.osc('square', f, t, end);
    const lp = this.filter('lowpass', 1800, 5);
    lp.frequency.setValueAtTime(1800, t);
    lp.frequency.exponentialRampToValueAtTime(500, t + 0.12);
    const g = this.gain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12 * v, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.06 * v, t + Math.max(0.01, dur * 0.8));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
    o.connect(lp).connect(g).connect(this.out);
  }

  /** Taiko: pitched-down sine body + low noise thump. big = ō-daiko "don", small = "don" on the rim side. */
  taiko(t, big, v = 1) {
    const f0 = big ? 120 : 175;
    const f1 = big ? 42 : 68;
    const len = big ? 0.5 : 0.22;
    const o = this.osc('sine', f0, t, t + len + 0.05);
    o.frequency.exponentialRampToValueAtTime(f1, t + len * 0.6);
    const g = this.gain();
    g.gain.setValueAtTime((big ? 0.75 : 0.42) * v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(this.out);
    this.noiseBurst(t, 0.06, 'lowpass', big ? 380 : 700, 0.8, (big ? 0.35 : 0.2) * v);
  }

  /** "Ka": hit on the taiko's wooden rim. */
  ka(t, v = 1) {
    this.noiseBurst(t, 0.035, 'bandpass', 3300, 4, 0.22 * v);
    const o = this.osc('square', 950, t, t + 0.03);
    const g = this.gain();
    g.gain.setValueAtTime(0.035 * v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
    o.connect(g).connect(this.out);
  }

  /** Sanshin: Okinawan three-string lute; square + octave saw through a resonant, closing filter. */
  sanshin(t, m, dur, v = 1) {
    const f = mtof(m);
    const end = t + 0.75;
    const o = this.osc('square', f * 1.012, t, end);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.025);
    const o2 = this.osc('sawtooth', f * 2, t, end);
    const lp = this.filter('lowpass', 4200, 3.2);
    lp.frequency.setValueAtTime(4200, t);
    lp.frequency.exponentialRampToValueAtTime(1100, t + 0.28);
    const g = this.gain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.085 * v, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.7, 0.28 + dur));
    const g2 = this.gain(0.3);
    o.connect(lp);
    o2.connect(g2).connect(lp);
    lp.connect(g).connect(this.out);
  }

  /** Paranku: small single-headed hand drum of eisa dancers. */
  paranku(t, v = 1) {
    const o = this.osc('sine', 430, t, t + 0.15);
    o.frequency.exponentialRampToValueAtTime(250, t + 0.08);
    const g = this.gain();
    g.gain.setValueAtTime(0.32 * v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    o.connect(g).connect(this.out);
    this.noiseBurst(t, 0.03, 'bandpass', 2100, 1.5, 0.12 * v);
  }

  /** Sanba: wooden castanet clack. */
  sanba(t, v = 1) {
    this.noiseBurst(t, 0.022, 'bandpass', 5200, 6, 0.24 * v);
    const o = this.osc('square', 2600, t, t + 0.015);
    const g = this.gain();
    g.gain.setValueAtTime(0.025 * v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
    o.connect(g).connect(this.out);
  }

  shaker(t, accent, v = 1) {
    this.noiseBurst(t, accent ? 0.05 : 0.03, 'highpass', 7200, 0.7, (accent ? 0.07 : 0.04) * v);
  }

  pad(t, m, dur, v = 1) {
    const f = mtof(m);
    const end = t + dur + 0.8;
    const a = this.osc('sawtooth', f * 1.004, t, end);
    const b = this.osc('sawtooth', f * 0.996, t, end);
    const lp = this.filter('lowpass', 850, 0.5);
    const g = this.gain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.03 * v, t + Math.min(0.5, dur * 0.4));
    g.gain.setValueAtTime(0.03 * v, t + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.7);
    a.connect(lp);
    b.connect(lp);
    lp.connect(g).connect(this.out);
  }
}
