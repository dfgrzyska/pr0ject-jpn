// Tokyo's first miniboss (docs/plan-tokyo.md, 6.1): KASA-OBAKE, the umbrella of the scramble. Methods of Enemies
// (mixed in like the cities'). A heavy with "hold": the city stops under the fight, so everything here stands on the
// crossing's own ground (strip positions, u) and stays put on the map while the scroll eases to a stop and back.
// Art: tools/art/tokyo/kasa.mjs (the anchors below come from there).
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { volley } from '../../difficulty.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * Its life, the phases' thresholds, how long it stays before it gives up and hops off; the hop (crouch, flight,
 * landing, how high); the drizzle off its rim; the spin (closing, spinning, a ring every so often, opening); the
 * signal's three steps; the little ones (their hit circle); the top's wires; the tongue (the warning, the shot
 * out, the sweep, the pull back, how far it reaches, how much more a hit on the eye takes then).
 */
export const KASA = {
  hp: 820,
  phase: [0.66, 0.33],
  time: 95,
  hop: { crouch: 0.3, air: 0.58, h: 22, land: 0.3 },
  drizzle: 0.17,
  spin: { close: 0.3, dur: 1.7, ring: 12, every: 0.42, open: 0.32 },
  signal: { warn: 0.95, cross: 1.3, stop: 3.2 },
  mini: { r: 8, take: 1.3 }, // (small targets: each hit at the red man counts a little more)
  top: { dur: 2.6, every: 0.15, turn: 0.55 },
  lash: { settle: 0.35, warn: 0.6, out: 0.18, sweep: 1.0, back: 0.3, reach: 82, take: 1.4 },
};

// the crossing (tools/art/tokyo/shibuya.mjs): the middles of its four zebras, its middle, the corners where people wait
const SPOTS = [[90, 3366], [66, 3346], [114, 3346], [90, 3326], [90, 3346], [72, 3334], [108, 3334]];
const CORNERS = [[61, 3379], [119, 3379], [119, 3321], [61, 3321]]; // NW, NE, SE, SW: round the clock
const ENTRY = [[30, 3446], [48, 3420], [66, 3398], [82, 3378], [90, 3364]]; // in from Center-gai's crowd, hop by hop
const SIGNAL = [128, 3393]; // the walk signal hung over the north crossing

// where the parts sit on each canopy frame (tools/art/tokyo/kasa.mjs KASA_ANCHORS), logical px from its middle:
// [eye x, eye y, eye seen 0-1, eye's width 0-1, mouth x, mouth y, mouth seen, foot x, foot y]
const A = {
  shut: [0, 5.1, 1, 1, 0, 9.1, 1, 0, 9.5],
  half: [0, 5.7, 1, 1, 0, 10.5, 1, 0, 9.5],
  wide: [0, 3.3, 1, 1, 0, 8.1, 1, 0, 9.5],
  open: [0, 0.8, 1, 1, 0, 5, 1, 0, 9.5],
  air: [0, 4.1, 1, 1, 0, 8.9, 1, 0, 11.9],
  squash: [0, 0.2, 1, 1, 0, 3.9, 1, 0, 10.8],
  spin: [0, 5.1, 1, 1, 0, 9.1, 1, 0, 9.5],
  top_0: [1, 3.2, 1, 0.99, 1.4, 8.1, 1, 2.8, 9.3],
  top_1: [7.9, 1.9, 1, 0.75, 10, 6.3, 1, 0.9, 8.2],
  top_2: [12.5, -0.1, 0.92, 0.25, 15.5, 3.9, 0.87, -2.8, 9.3],
  top_3: [11.9, -4.1, 0.2, 0.24, 14.8, -1.1, 0.1, -0.9, 10.3],
  bow_0: [0, 4.8, 1, 1, 0, 7.8, 1, 0, 7.3],
  bow_1: [0, 1.3, 0.68, 1, 0, 2.9, 0.56, 0, 1.6],
  split: [0, 0, 1, 1, 0, 3, 1, 0, 12.1],
};
const LEG_FOOT = { stand: 29.7, crouch1: 26.3, crouch2: 23, stretch: 33, air: 28.9, land: 25 }; // the sole below the leg's top
const LEG_TOP = -13.33; // the leg frame's top (where the handle meets the canopy) from its middle
const MINI_FOOT = 10.8; // a little one's sole below its frame's middle
// how big the eye is on each shape of canopy, and the box its canopy takes (rx, ry, dy) for shots
const EYE_K = { shut: 0.55, spin: 0.55, half: 0.78, air: 0.78, wide: 0.92, top: 0.88, open: 1, squash: 1, split: 1, bow: 0.55 };
const BODY = { shut: [10, 19, 0], spin: [10, 19, 0], half: [15, 15, 2], air: [15, 15, 2], wide: [21, 13, 0], top: [21, 13, 0], open: [25, 13, -1], squash: [26, 12, -1], split: [24, 14, 0], bow: [7, 14, 0] };
const GOLD = 0xffd06a;
const SAFE = 0x81f3cc;
const WARN = 0xff735e;
const DROP = 0x9ad8ff;

const shapeOf = (frame) => {
  const m = /^ko_([a-z]+)(?:_(\d))?/.exec(frame);
  return m ? m[1] : 'open';
};
const anchorOf = (frame) => {
  const shape = shapeOf(frame);
  if (shape === 'top' || shape === 'bow') return A[`${shape}_${frame.split('_')[2]}`] ?? A.open;
  return A[shape] ?? A.open;
};
const ease = (k) => k * k * (3 - 2 * k);

export const tokyoKasa = {
  /**
   * An old oil-paper umbrella come to life on Shibuya's crossing in the rain: one eye, a long tongue, its handle a
   * single leg in a geta. Three phases:
   * 1. DESZCZ: it hops from crossing to crossing (a splash and a ring of drops where it lands), the rain running
   *    off its open canopy - which stops every shot; closed, it spins and throws rings of drops. It is hurt only
   *    while shut or in the air;
   * 2. SCRAMBLE: it bursts into three little ones. A walk signal comes down over the crossing: the lanes about to
   *    go show red, the green man walks and all three cross at once, every which way, dropping rain; at the red
   *    man they stand where they are, open to hits (mint), and shoot;
   * 3. ULEWA: they come back together, torn, the ribs showing: it spins like a top throwing splinters of rib in a
   *    spiral, then stops, glares, and lashes out with its tongue at the player: its eye can be hit only then.
   * It wears down: holes, broken ribs, the canopy hanging off; beaten, it folds, bows, and hops off into the crowd
   * as a plain clear umbrella.
   */
  spawnKasa(e) {
    const g = (e.kasa = {
      t: 0, act: 'enter', at: 0, step: 0, hops: 0, z: 0, foot: { x: ENTRY[0][0], u: ENTRY[0][1] }, hop: null,
      frame: 'ko_half_0', leg: 'air', eye: null, blinkAt: 1.8, blink: -1, wear: 0, spinA: 0, last: 0, minis: [], fx: [],
      sig: null, sigY: -60, sigState: 'off', lanes: null, lash: null, exposed: false, guard: true, said: 0,
    });
    Object.assign(e, { stage: 1, pass: true, radius: 12, flashTint: 0x606060 });
    e.setDepth(DEPTH.air - 0.06);
    const part = (frame, depth) => this.segPool.spawn(frame, e.x, e.y).setDepth(depth);
    g.shadow = part('ko_shadow', DEPTH.ground + 0.6);
    g.legSp = part('ko_leg_air', DEPTH.air - 0.07);
    g.eyeSp = part('ko_eye_c', DEPTH.air - 0.05);
    g.ring = part('ko_eye_ring', DEPTH.air - 0.049).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    g.tongue = Array.from({ length: 24 }, () => part('ko_tongue', DEPTH.air - 0.046).setVisible(false));
    g.tip = part('ko_tongue_tip_0', DEPTH.air - 0.045).setVisible(false);
    this.kasaHop(g, ENTRY[1], { air: 0.5, h: 18 });
    return e;
  },

  /** Start a hop from where it stands to (x, u). */
  kasaHop(g, [x, u], o = {}) {
    g.hop = { from: [g.foot.x, g.foot.u], to: [x, u], t: 0, crouch: o.crouch ?? KASA.hop.crouch, air: o.air ?? KASA.hop.air, land: o.land ?? KASA.hop.land, h: o.h ?? KASA.hop.h, quiet: !!o.quiet };
  },

  /** The hop under way: crouching, in the air, landing. Returns true when it is over. */
  kasaHopStep(e, g, dt) {
    const h = g.hop;
    h.t += dt;
    const w = g.wear;
    if (h.t < h.crouch) {
      // the spring: the leg gives, the canopy gathers in
      const k = h.t / h.crouch;
      g.leg = k < 0.45 ? 'crouch1' : 'crouch2';
      g.frame = `ko_${k < 0.5 ? 'squash' : 'wide'}_${w}`;
      return false;
    }
    const ta = h.t - h.crouch;
    if (ta < h.air) {
      const k = ta / h.air;
      if (!h.up) {
        h.up = true;
        this.kasaSplash(g, h.from[0], h.from[1], 0.5); // (water kicked off the asphalt)
      }
      g.foot.x = h.from[0] + (h.to[0] - h.from[0]) * k;
      g.foot.u = h.from[1] + (h.to[1] - h.from[1]) * k;
      g.z = h.h * 4 * k * (1 - k);
      g.leg = k < 0.18 ? 'stretch' : 'air';
      g.frame = `ko_${k < 0.18 ? 'half' : 'air'}_${w}`;
      return false;
    }
    const tl = ta - h.air;
    if (!h.down) {
      h.down = true;
      g.z = 0;
      [g.foot.x, g.foot.u] = h.to;
      this.kasaSplash(g, g.foot.x, g.foot.u, 1);
      if (!h.quiet && this.canFire(e)) this.kasaRing(e.x, this.scene.parallax.screenY(g.foot.u) - 2, 10, Math.random() * TAU, slow * 0.85);
    }
    const k = tl / h.land;
    g.leg = k < 0.35 ? 'land' : k < 0.7 ? 'crouch1' : 'stand';
    g.frame = `ko_${k < 0.4 ? 'squash' : 'open'}_${w}`;
    if (k >= 1) {
      g.hop = null;
      g.leg = 'stand';
      return true;
    }
    return false;
  },

  /** Where it lands: a ring of water on the asphalt, a splash of drops, the puddle's ripple. */
  kasaSplash(g, x, u, k) {
    const s = this.scene;
    const y = s.parallax.screenY(u);
    const sp = this.segPool.spawn('ko_ripple_0', x, y).setDepth(DEPTH.ground + 0.65);
    sp.setScale(sp.base * (0.6 + 0.5 * k));
    g.fx.push({ sp, x, u, t: 0, life: 0.5 });
    for (let i = 0; i < 6 + k * 8; i++) {
      const p = s.fx.part(s.fx.parts, 'drop_0', x + (Math.random() - 0.5) * 14, y - 1, { vx: (Math.random() - 0.5) * 90 * k, vy: -30 - Math.random() * 60 * k, g: 260, drag: 0.4, life: 0.35 + Math.random() * 0.25, a0: 0.9 });
      p.setTint(DROP);
    }
    if (k >= 1) s.sfx.explode('s');
  },

  /** n rain drops round (x, y) (the difficulty's number). */
  kasaRing(x, y, n, off, speed) {
    n = volley(n);
    for (let i = 0; i < n; i++) this.scene.bullets.shot('ko_drop', x, y, off + (i / n) * TAU, speed, 1.8, { spin: true });
  },

  kasaDrop(x, y, a, speed) {
    return this.scene.bullets.shot('ko_drop', x, y, a, speed, 1.8, { spin: true });
  },

  kasa(e, dt) {
    const s = this.scene;
    const g = e.kasa;
    if (!g) return;
    g.t += dt;
    const frac = e.hp / e.maxHp;
    if (e.state === 'enter') this.kasaEnter(e, g, dt);
    else if (e.state === 'leave') this.kasaLeave(e, g, dt);
    else {
      g.fight = (g.fight ?? 0) + dt;
      if (g.fight > KASA.time && !g.going) this.kasaGiveUp(e, g);
      else if (e.stage === 1 && frac < KASA.phase[0] && g.act !== 'split') this.kasaSplitStart(e, g);
      else if (e.stage === 2 && frac < KASA.phase[1] && g.act !== 'merge') this.kasaMergeStart(e, g);
      if (e.stage === 1) this.kasaRain(e, g, dt);
      else if (e.stage === 2) this.kasaScramble(e, g, dt);
      else this.kasaDownpour(e, g, dt);
    }
    // its wear: holes as it weakens, then (torn back together) broken ribs and the canopy hanging off
    const wear = e.stage === 1 ? (frac > 0.83 ? 0 : 1) : e.stage === 3 ? (frac > 0.15 ? 2 : 3) : g.wear;
    if (wear !== g.wear) {
      g.wear = wear;
      g.frame = g.frame.replace(/_\d$/, `_${wear}`);
      this.kasaTear(e);
    }
    this.kasaPlace(e, g, dt);
    this.kasaFx(g, dt);
  },

  /** In from the crowd at the top left, hop by hop, the card's alarm still going. */
  kasaEnter(e, g, dt) {
    if (g.hop && !this.kasaHopStep(e, g, dt)) return;
    g.step++;
    if (g.step < ENTRY.length - 1) return this.kasaHop(g, ENTRY[g.step + 1], { air: 0.5, h: 18, quiet: true });
    e.state = 'fight';
    Object.assign(g, { act: 'look', at: 0, step: 0 });
    g.eye = 'wide';
    this.scene.fx.text(e.x + 18, e.y - 26, 'BERO~', 1, 0xff8aa4);
  },

  // ---------------------------------------------------------------- phase 1: DESZCZ
  kasaRain(e, g, dt) {
    const s = this.scene;
    g.at += dt;
    g.guard = true;
    switch (g.act) {
      case 'look':
        // a look round, the tongue out, the rain running off its rim
        g.frame = `ko_open_${g.wear}`;
        g.leg = 'stand';
        if (g.at > 0.7) g.eye = null;
        this.kasaDrizzle(e, g, dt);
        if (g.at > 1.1) this.kasaNext(e, g, 'hop');
        break;
      case 'hop':
        if (!g.hop) {
          const here = SPOTS.findIndex(([x, u]) => x === g.foot.x && u === g.foot.u);
          let pick;
          do pick = Math.floor(Math.random() * SPOTS.length);
          while (pick === here || (pick === g.last && Math.random() < 0.7));
          g.last = here;
          this.kasaHop(g, SPOTS[pick]);
        }
        g.guard = !(g.hop.t > g.hop.crouch && g.hop.t < g.hop.crouch + g.hop.air); // (in the air: open to hits)
        if (this.kasaHopStep(e, g, dt)) this.kasaNext(e, g, ++g.hops % 2 === 0 ? 'spin' : 'look');
        break;
      case 'spin': {
        const { close, dur, every, ring, open } = KASA.spin;
        const order = ['open', 'wide', 'half', 'shut'];
        if (g.at < close) {
          g.frame = `ko_${order[Math.min(3, Math.floor((g.at / close) * 4))]}_${g.wear}`;
          g.eye = 'angry';
          g.guard = g.at < close * 0.5;
        } else if (g.at < close + dur) {
          // shut and spinning: drops flung off it, a ring every so often; open to hits
          g.guard = false;
          g.spinA += dt * TAU * 1.7;
          g.frame = `ko_spin_${Math.floor(g.spinA / (TAU / 20)) % 4}_${Math.min(1, g.wear)}`;
          if (Math.random() < dt * 30) {
            const a = Math.random() * TAU;
            const p = s.fx.part(s.fx.parts, 'drop_0', e.x + Math.cos(a) * 5, e.y + Math.sin(a) * 8, { vx: Math.cos(a) * 110, vy: Math.sin(a) * 50 - 10, g: 140, drag: 0.8, life: 0.4 });
            p.setTint(DROP);
          }
          if (g.at - close > g.step * every && this.canFire(e)) {
            g.step++;
            this.kasaRing(e.x, e.y + 4, ring, g.spinA + g.step * 0.25, g.step % 2 ? slow : normal);
            if (g.step === 1) s.fx.text(e.x, e.y - 30, 'KURU KURU', 0.8, DROP);
          }
        } else if (g.at < close + dur + open) {
          const k = (g.at - close - dur) / open;
          g.frame = `ko_${order[3 - Math.min(3, Math.floor(k * 4))]}_${g.wear}`;
          g.guard = k > 0.5;
          if (!g.flung && k > 0.7) {
            // it opens with a snap, and the water on it flies off in a fan at the player
            g.flung = true;
            if (this.canFire(e)) for (let i = 0; i < volley(7); i++) this.kasaDrop(e.x, e.y + 6, this.aimAt(e, 0, 6) + (i / (volley(7) - 1) - 0.5) * 1.1, normal);
            s.fx.text(e.x, e.y - 30, 'BASA!', 0.8, 0xffffff);
          }
        } else {
          g.flung = false;
          this.kasaNext(e, g, 'look');
        }
        break;
      }
      default:
        this.kasaNext(e, g, 'look');
    }
  },

  /** The rain running off its rim while it stands open: a drop now and then off a rib's tip. */
  kasaDrizzle(e, g, dt) {
    g.drip = (g.drip ?? 0) - dt;
    if (g.drip > 0 || !this.canFire(e)) return;
    g.drip = KASA.drizzle * (0.7 + Math.random() * 0.6);
    const k = Math.floor(Math.random() * 7) - 3;
    this.kasaDrop(e.x + k * 7, e.y + 9 - Math.abs(k) * 1.5, DOWN + k * 0.07, slow * (0.7 + Math.random() * 0.25));
  },

  kasaNext(e, g, act) {
    Object.assign(g, { act, at: 0, step: 0 });
  },

  // ---------------------------------------------------------------- phase 2: SCRAMBLE
  kasaSplitStart(e, g) {
    this.phaseBreak(e, e.x, e.y, 2, 'SCRAMBLE');
    Object.assign(g, { act: 'split', at: 0, step: 0, hop: null, z: 0 });
    g.eye = 'hurt';
    g.leg = 'land';
  },

  kasaScramble(e, g, dt) {
    const s = this.scene;
    const sg = KASA.signal;
    g.at += dt;
    // the signal coming down on its arm, swinging a little as it stops
    g.sigY += (0 - g.sigY) * Math.min(1, dt * 5);
    if (g.act === 'split') {
      // the canopy bursting along three ribs, then three little ones flying out of it to three corners
      g.frame = 'ko_split';
      g.jit = Math.round(Math.sin(g.t * 60));
      if (g.at > 0.55 && !g.minis.length) {
        e.setAlpha(0);
        e.harmless = true;
        g.eye = null;
        s.fx.smoke(e.x, e.y, 6, 10);
        s.fx.flash(0.3, 0.25);
        for (let i = 0; i < 26; i++) {
          const p = s.fx.part(s.fx.parts, Math.random() < 0.5 ? 't_paper_0' : 't_paper_1', e.x + (Math.random() - 0.5) * 30, e.y + (Math.random() - 0.5) * 16, { vx: (Math.random() - 0.5) * 160, vy: -30 - Math.random() * 90, g: 120, drag: 1.2, spin: (Math.random() - 0.5) * 12, life: 0.9 });
          p.setTint(Math.random() < 0.7 ? 0xc42430 : 0xeee4d0);
        }
        for (let i = 0; i < 3; i++) {
          const sp = this.segPool.spawn('ko_mini_0', e.x, e.y).setDepth(DEPTH.air - 0.06);
          const sh = this.segPool.spawn('ko_shadow', e.x, e.y).setDepth(DEPTH.ground + 0.6);
          sh.setScale(sh.base * 0.5);
          g.minis.push({ sp, sh, ci: i, x: g.foot.x, u: g.foot.u, from: [g.foot.x, g.foot.u], to: CORNERS[i], t: 0, z: 0, hurt: 0, f: 2 });
        }
        g.sig ??= this.segPool.spawn('ko_sig_off', SIGNAL[0], -40).setDepth(DEPTH.air - 0.2);
        g.sigY = -70;
      }
      if (g.minis.length) {
        const k = Math.min(1, (g.at - 0.55) / 0.6);
        for (const m of g.minis) {
          m.x = m.from[0] + (m.to[0] - m.from[0]) * k;
          m.u = m.from[1] + (m.to[1] - m.from[1]) * k;
          m.z = 26 * 4 * k * (1 - k);
          m.f = k < 1 ? 2 + (Math.floor(g.t * 10) % 2) : 4;
        }
        if (k >= 1) {
          for (const m of g.minis) m.from = m.to;
          this.kasaNext(e, g, 'warn');
          this.kasaLanes(g);
        }
      }
    } else if (g.act === 'warn') {
      // the lanes about to go, red on the asphalt; the green man about to walk
      g.sigState = Math.floor(g.at * 8) % 2 ? 'go0' : 'off';
      for (const m of g.minis) m.f = Math.floor(g.at * 6) % 2 ? 1 : 0; // (bouncing on the spot, raring to go)
      if (g.at > sg.warn) this.kasaNext(e, g, 'cross');
    } else if (g.act === 'cross') {
      // all three at once, hopping across, rain falling off them
      g.sigState = Math.floor(g.at * 5) % 2 ? 'go1' : 'go0';
      const k = Math.min(1, g.at / sg.cross);
      for (const m of g.minis) {
        const e2 = ease(k);
        m.x = m.from[0] + (m.to[0] - m.from[0]) * e2;
        m.u = m.from[1] + (m.to[1] - m.from[1]) * e2;
        m.z = Math.abs(Math.sin(k * Math.PI * 4)) * 6;
        m.f = 2 + (Math.floor(k * 8) % 2);
        m.drip = (m.drip ?? 0) - dt;
        if (m.drip <= 0 && this.canFire(e)) {
          m.drip = 0.17;
          this.kasaDrop(m.x, s.parallax.screenY(m.u) - MINI_FOOT - 4, DOWN + (Math.random() - 0.5) * 0.3, slow * 0.75);
        }
      }
      if (k >= 1) {
        for (const m of g.minis) {
          m.from = m.to;
          m.z = 0;
          this.kasaSplash(g, m.x, m.u, 0.5);
        }
        g.lanes = null;
        this.kasaNext(e, g, 'stop');
      }
    } else if (g.act === 'stop') {
      // the red man: they stand where they are, open to hits, and shoot
      g.sigState = 'red';
      for (const m of g.minis) m.f = m.hurt > 0 ? 6 : (g.t + m.ci) % 2.4 < 0.12 ? 5 : 0;
      if (g.step === 0 && g.at > 0.6) {
        g.step = 1;
        if (this.canFire(e)) for (const m of g.minis) for (let i = -1; i <= 1; i++) this.kasaDrop(m.x, this.kasaMiniY(m), this.aimAt({ x: m.x, y: this.kasaMiniY(m) }) + i * 0.22, normal);
      }
      if (g.step === 1 && g.at > 1.5) {
        g.step = 2;
        if (this.canFire(e)) for (const m of g.minis) this.kasaRing(m.x, this.kasaMiniY(m), 8, m.ci * 0.4 + g.t, slow);
      }
      if (g.at > sg.stop) {
        this.kasaNext(e, g, 'warn');
        this.kasaLanes(g);
      }
    } else if (g.act === 'merge') this.kasaMerge(e, g, dt);
    if (g.sig) {
      const was = g.sig.frame.name.slice(7);
      if (was !== g.sigState) {
        g.sig.setFrame(`ko_sig_${g.sigState}`);
        // the crossing's sounds: a tick as the green man blinks, a chirp with each of his steps, a beep at the red one
        if (g.sigState === 'red') s.sfx.signal?.('red');
        else if (g.sigState === 'go1') s.sfx.signal?.('go');
        else if (g.sigState === 'go0' && was === 'off') s.sfx.signal?.('tick');
      }
      g.sig.setPosition(SIGNAL[0] + Math.sin(g.t * 2.2) * 0.4, s.parallax.screenY(SIGNAL[1]) + g.sigY);
      this.kasaCountdown(g);
    }
    // the little ones: touching them hurts; drawn on their corners of the map
    const p = s.player;
    for (const m of g.minis) {
      m.hurt = Math.max(0, m.hurt - dt);
      const y = s.parallax.screenY(m.u);
      m.sp.setPosition(m.x, y - MINI_FOOT - m.z);
      const fr = `ko_mini_${m.f}`;
      if (m.sp.frame.name !== fr) m.sp.setFrame(fr);
      m.sp.setFlipX(m.to[0] < m.from[0] && g.act === 'cross');
      if (m.hurt > 0) m.sp.setTint(0x808080).setTintMode(Phaser.TintModes.ADD);
      else m.sp.clearTint();
      m.sh.setPosition(m.x, y).setAlpha(Math.max(0.3, 1 - m.z / 30));
      if (g.act === 'stop') {
        const r = 11 + Math.sin(g.t * 12 + m.ci) * 1.2;
        this.tele.lineStyle(1.5, SAFE, 0.85).strokeCircle(m.x, y - MINI_FOOT - 3, r);
        this.tele.lineStyle(1, 0xffffff, 0.5).strokeCircle(m.x, y - MINI_FOOT - 3, r + 2);
      }
      if (p.alive && g.act !== 'split' && g.act !== 'merge' && Math.hypot(p.x - m.x, p.y - (y - MINI_FOOT - m.z)) < 7 && !p.god && p.invulnerable <= 0 && p.entering <= 0) p.hit();
    }
  },

  kasaMiniY(m) {
    return this.scene.parallax.screenY(m.u) - MINI_FOOT - m.z - 3;
  },

  /** Where each little one goes next: round the clock, against it, or across the middle - all at once. */
  kasaLanes(g) {
    const r = Math.random();
    const taken = g.minis.map((m) => CORNERS.findIndex(([x, u]) => x === m.from[0] && u === m.from[1]));
    let to;
    if (r < 0.35) to = taken.map((c) => (c + 1) % 4);
    else if (r < 0.7) to = taken.map((c) => (c + 3) % 4);
    else to = taken.map((c) => (c + 2) % 4);
    g.minis.forEach((m, i) => (m.to = CORNERS[to[i]]));
    g.lanes = g.minis.map((m) => [m.from, m.to]);
  },

  /** The signal's countdown, a column of lamps down its left side; the red lanes on the crossing. */
  kasaCountdown(g) {
    const s = this.scene;
    const ink = this.tele;
    const x = g.sig.x - 16;
    const y0 = g.sig.y - 9;
    const sg = KASA.signal;
    const left = g.act === 'stop' ? 1 - g.at / sg.stop : g.act === 'warn' ? 1 - g.at / sg.warn : g.act === 'cross' ? 1 - g.at / sg.cross : 0;
    const col = g.act === 'stop' ? 0xff5040 : 0x50f0a0;
    for (let i = 0; i < 8; i++) {
      const on = i < Math.ceil(left * 8);
      ink.fillStyle(on ? col : 0x2a2a30, on ? 0.95 : 0.8).fillRect(x, y0 + (7 - i) * 3, 2, 2);
    }
    if (!g.lanes || g.act !== 'warn') return;
    // the lanes about to move: red, dashed, the dashes running the way they will go
    const k = Math.min(1, g.at / 0.25);
    for (const [[ax, au], [bx, bu]] of g.lanes) {
      const [ay, by] = [s.parallax.screenY(au), s.parallax.screenY(bu)];
      const len = Math.hypot(bx - ax, by - ay);
      const n = Math.floor(len / 6);
      for (let i = 0; i < n; i++) {
        const q = (i + ((g.at * 6) % 1)) / n;
        const [x1, y1] = [ax + (bx - ax) * q, ay + (by - ay) * q];
        ink.fillStyle(WARN, 0.85 * k).fillRect(x1 - 1.5, y1 - 1.5, 3, 3);
      }
      const a = Math.atan2(by - ay, bx - ax);
      ink.fillStyle(WARN, 0.95 * k).fillTriangle(bx + Math.cos(a) * 4, by + Math.sin(a) * 4, bx + Math.cos(a + 2.5) * 5, by + Math.sin(a + 2.5) * 5, bx + Math.cos(a - 2.5) * 5, by + Math.sin(a - 2.5) * 5);
    }
  },

  // ---------------------------------------------------------------- phase 3: ULEWA
  kasaMergeStart(e, g) {
    Object.assign(g, { act: 'merge', at: 0, step: 0, lanes: null });
    for (const m of g.minis) m.from = [m.x, m.u];
  },

  kasaMerge(e, g, dt) {
    const s = this.scene;
    g.sigState = 'off';
    const k = Math.min(1, g.at / 0.6);
    for (const m of g.minis) {
      m.x = m.from[0] + (90 - m.from[0]) * k;
      m.u = m.from[1] + (3348 - m.from[1]) * k;
      m.z = 20 * 4 * k * (1 - k);
      m.f = 2 + (Math.floor(g.t * 10) % 2);
    }
    if (k < 1) return;
    // together again, torn: the big one back, in a spray of water and paper
    for (const m of g.minis) {
      this.segPool.kill(m.sp);
      this.segPool.kill(m.sh);
    }
    g.minis = [];
    Object.assign(g.foot, { x: 90, u: 3348 });
    e.setAlpha(1);
    e.harmless = false;
    g.eye = 'angry';
    g.wear = 2;
    s.fx.smoke(e.x, e.y, 6, 10);
    this.kasaSplash(g, 90, 3348, 1.4);
    this.phaseBreak(e, e.x, e.y, 3, 'ULEWA');
    this.kasaNext(e, g, 'top');
    e.stage = 3;
  },

  kasaDownpour(e, g, dt) {
    const s = this.scene;
    const L = KASA.lash;
    g.at += dt;
    g.exposed = false;
    // the signal, its job done, goes back up out of the way
    if (g.sig) {
      g.sigY -= dt * 90;
      g.sig.setPosition(SIGNAL[0], s.parallax.screenY(SIGNAL[1]) + g.sigY);
      if (g.sigY < -90) {
        this.segPool.kill(g.sig);
        g.sig = null;
      }
    }
    if (g.act === 'top') {
      // spinning like a top across the north of the crossing, splinters of rib flying out in a spiral
      const T = KASA.top;
      g.spinA += dt * TAU * 1.6;
      const a = g.spinA;
      g.frame = `ko_top_${Math.floor(a / (TAU / 20)) % 4}_${g.wear}`;
      g.leg = 'stand';
      g.foot.x = 90 + 24 * Math.sin(g.t * 0.9);
      g.foot.u = 3348 + 9 * Math.sin(g.t * 1.6);
      g.eye = null;
      if (g.at > g.step * T.every && g.at > 0.3 && this.canFire(e)) {
        g.step++;
        for (const off of [0, Math.PI]) s.bullets.shot('ko_rib', e.x, e.y + 4, g.step * T.turn + off, normal, 1.6, { spin: true });
      }
      if (Math.random() < dt * 40) {
        const q = Math.random() * TAU;
        s.fx.part(s.fx.parts, 'drop_0', e.x + Math.cos(q) * 20, e.y + 4 + Math.sin(q) * 8, { vx: -Math.sin(q) * 120, vy: Math.cos(q) * 40, g: 120, drag: 0.8, life: 0.35 }).setTint(DROP);
      }
      if (g.at > T.dur) {
        this.kasaNext(e, g, 'lash');
        g.lash = null;
      }
    } else if (g.act === 'lash') this.kasaLash(e, g, dt);
    else if (g.act === 'shake') {
      // shaking the water off before it spins again
      g.frame = `ko_open_${g.wear}`;
      g.eye = null;
      g.jit = Math.round(Math.sin(g.t * 50));
      if (g.step < 2 && g.at > 0.15 + g.step * 0.35 && this.canFire(e)) {
        g.step++;
        this.kasaRing(e.x, e.y + 6, 14, g.step * 0.22, g.step % 2 ? slow : normal);
      }
      if (g.at > 0.9) this.kasaNext(e, g, 'top');
    } else this.kasaNext(e, g, 'top');
  },

  /** It stops, glares, and its tongue shoots out at the player and sweeps: the eye can be hit while it is out. */
  kasaLash(e, g, dt) {
    const s = this.scene;
    const L = KASA.lash;
    const p = s.player;
    g.frame = `ko_${g.at < L.settle * 0.5 ? 'wide' : 'open'}_${g.wear}`;
    g.leg = g.at < L.settle ? 'land' : 'stand';
    const t = g.at - L.settle;
    if (t < 0) {
      g.eye = 'angry';
      return;
    }
    const an = anchorOf(g.frame);
    const mx = e.x + an[4];
    const my = e.y + an[5];
    if (!g.lash) {
      g.lash = { aim: Math.atan2(p.y - my, p.x - mx), len: 0, said: false };
      g.lash.reach = Math.min(L.reach, Math.hypot(p.x - mx, p.y - my) + 12);
    }
    const lh = g.lash;
    g.eye = 'wide';
    if (t < L.warn) {
      // the warning: a red line where it will strike, the eye staring
      const k = t / L.warn;
      const ink = this.tele;
      ink.lineStyle(2, WARN, 0.4 + 0.5 * k).lineBetween(mx, my, mx + Math.cos(lh.aim) * lh.reach, my + Math.sin(lh.aim) * lh.reach);
      return;
    }
    const tt = t - L.warn;
    let ang = lh.aim;
    if (tt < L.out) lh.len = lh.reach * (tt / L.out);
    else if (tt < L.out + L.sweep) {
      lh.len = lh.reach;
      ang = lh.aim + Math.sin(((tt - L.out) / L.sweep) * TAU) * 0.55;
      if (!lh.said) {
        lh.said = true;
        s.fx.text(e.x - 22, e.y - 26, 'BEROOON!', 0.9, 0xff8aa4);
      }
    } else if (tt < L.out + L.sweep + L.back) lh.len = lh.reach * (1 - (tt - L.out - L.sweep) / L.back);
    else {
      g.lash = null;
      this.kasaNext(e, g, 'shake');
      return;
    }
    lh.ang = ang;
    g.exposed = tt < L.out + L.sweep + L.back * 0.5;
    // the tongue hurts where it is (drawn in kasaPlace)
    if (p.alive && !p.god && p.invulnerable <= 0 && p.entering <= 0)
      for (let d = 6; d <= lh.len; d += 4) {
        const q = d / Math.max(1, lh.len);
        const a = ang + Math.sin(q * 3 + g.t * 14) * 0.08 * q;
        if (Math.hypot(p.x - (mx + Math.cos(a) * d), p.y - (my + Math.sin(a) * d)) < 4.5) {
          p.hit();
          break;
        }
      }
  },

  // ---------------------------------------------------------------- the end of the fight, either way
  /** Time's up: it closes, and hops off the way it came, over the crowd. */
  kasaGiveUp(e, g) {
    g.going = true;
    e.state = 'leave';
    for (const m of g.minis) m.from = [m.x, m.u];
    this.kasaNext(e, g, 'leave');
    this.scene.fx.text(e.x, e.y - 28, 'BAI BAI~', 1, 0xff8aa4);
  },

  kasaLeave(e, g, dt) {
    g.at += dt;
    g.eye = 'happy';
    if (g.minis.length) {
      const k = Math.min(1, g.at / 1.2);
      for (const m of g.minis) {
        m.u = m.from[1] + 140 * k;
        m.x = m.from[0] - 60 * k;
        m.z = Math.abs(Math.sin(k * Math.PI * 3)) * 16;
        m.sp.setPosition(m.x, this.scene.parallax.screenY(m.u) - MINI_FOOT - m.z);
        m.sh.setPosition(m.x, this.scene.parallax.screenY(m.u));
      }
      if (k >= 1) this.remove(e);
      return;
    }
    if (!g.hop) this.kasaHop(g, [g.foot.x - 40, g.foot.u + 70], { air: 0.6, h: 24, quiet: true });
    if (this.kasaHopStep(e, g, dt) || e.y < -40) this.remove(e);
  },

  // ---------------------------------------------------------------- its parts, put together every frame
  kasaPlace(e, g, dt) {
    const s = this.scene;
    const fy = s.parallax.screenY(g.foot.u);
    const fx = g.foot.x;
    const visible = e.alpha > 0;
    const an = anchorOf(g.frame);
    const attach = fy - g.z - LEG_FOOT[g.leg];
    if (e.frame.name !== g.frame && e.texture.has(g.frame)) e.setFrame(g.frame);
    e.setPosition(fx - an[7] + (g.jit ?? 0), attach - an[8]);
    g.jit = 0;
    const shape = shapeOf(g.frame);
    const body = BODY[shape] ?? BODY.open;
    e.radius = Math.max(7, Math.min(13, body[0] * 0.5));
    // the leg under it, the shadow on the ground (smaller, paler, the higher it is)
    g.legSp.setVisible(visible);
    if (g.legSp.frame.name !== `ko_leg_${g.leg}`) g.legSp.setFrame(`ko_leg_${g.leg}`);
    g.legSp.setPosition(fx, attach - LEG_TOP);
    const sk = Math.max(0.35, 1 - g.z / 45);
    g.shadow.setVisible(visible).setPosition(fx, fy).setScale(g.shadow.base * sk * (shape === 'shut' || shape === 'spin' ? 0.55 : 1)).setAlpha(sk);
    // the eye: on the canopy where the frame has it; through a spin it goes round with it
    let [ex, ey, seen, wk] = an;
    if (shape === 'spin' || shape === 'top') {
      const a = g.spinA % TAU;
      const r = shape === 'spin' ? 3.4 : 20;
      seen = Math.cos(a);
      ex = Math.sin(a) * r;
      ey = an[1] - (1 - Math.cos(a)) * (shape === 'spin' ? 1 : 17);
      wk = Math.abs(Math.cos(a));
    }
    const eyeOn = visible && seen > 0.3 && g.act !== 'split';
    g.eyeSp.setVisible(eyeOn);
    if (eyeOn) {
      const kind = this.kasaEyeKind(e, g, dt);
      if (g.eyeSp.frame.name !== `ko_eye_${kind}`) g.eyeSp.setFrame(`ko_eye_${kind}`);
      const k = (EYE_K[shape] ?? 1) * 0.36; // (the eye's frame is drawn at 3x)
      g.eyeSp.setPosition(e.x + ex, e.y + ey).setScale(k * Math.max(0.15, wk), k);
    }
    // the mint ring while it can be hit there
    const ring = g.exposed && eyeOn;
    g.ring.setVisible(ring);
    if (ring) {
      const k = (EYE_K[shape] ?? 1) * 0.36;
      g.ring.setPosition(e.x + ex, e.y + ey).setScale(k * (1 + 0.06 * Math.sin(g.t * 16)), k * (1 + 0.06 * Math.sin(g.t * 16))).setAlpha(0.75 + 0.25 * Math.sin(g.t * 20));
    }
    this.kasaTongue(e, g, an, visible && an[6] > 0.4 && shape !== 'spin' && g.act !== 'split');
    // the hit flash on every part
    const lit = e.flash > 0;
    for (const sp of [g.legSp, g.eyeSp, g.tip, ...g.tongue]) {
      if (lit) sp.setTint(0x808080).setTintMode(Phaser.TintModes.ADD);
      else if (sp.isTinted) sp.clearTint();
    }
  },

  /** Which eye: what it is doing, else looking at the player, blinking now and then. */
  kasaEyeKind(e, g, dt) {
    if (g.blink < 0 && g.t > g.blinkAt) g.blink = 0;
    if (g.blink >= 0) {
      g.blink += dt;
      if (g.blink > 0.18) {
        g.blink = -1;
        g.blinkAt = g.t + 1.6 + Math.random() * 2.6;
      } else if (!g.eye || g.eye === 'angry') return g.blink < 0.05 || g.blink > 0.13 ? 'half' : 'shut';
    }
    if (g.eye) return g.eye;
    const dx = this.scene.player.x - e.x;
    return dx < -44 ? 'l2' : dx < -16 ? 'l1' : dx < 16 ? 'c' : dx < 44 ? 'r1' : 'r2';
  },

  /** The tongue: lolling out of the grin, swaying; or shot out along the lash. */
  kasaTongue(e, g, an, show) {
    const segs = g.tongue;
    const mx = e.x + an[4];
    const my = e.y + an[5];
    let n = 0;
    let tipX = mx;
    let tipY = my;
    let tipA = DOWN;
    if (show && g.lash?.len > 0) {
      const lh = g.lash;
      const ang = lh.ang ?? lh.aim;
      const count = Math.min(segs.length, Math.floor(lh.len / 3.6) - 1);
      for (; n < count; n++) {
        const d = (n + 1) * 3.6;
        const q = d / Math.max(1, lh.len);
        const a = ang + Math.sin(q * 3 + g.t * 14) * 0.08 * q;
        segs[n].setVisible(true).setPosition(mx + Math.cos(a) * d * 0.98, my + Math.sin(a) * d * 0.98);
      }
      const a = ang + Math.sin(3 + g.t * 14) * 0.08;
      [tipX, tipY, tipA] = [mx + Math.cos(a) * lh.len, my + Math.sin(a) * lh.len, a];
    } else if (show) {
      const shut = shapeOf(g.frame) === 'shut';
      const count = shut ? 1 : 3;
      let [x, y] = [mx, my];
      for (; n < count; n++) {
        const a = DOWN + Math.sin(g.t * 2.3 + n * 0.7) * 0.22 * (n + 1);
        x += Math.cos(a) * 3.2;
        y += Math.sin(a) * 3.2;
        segs[n].setVisible(true).setPosition(x, y);
      }
      tipA = DOWN + Math.sin(g.t * 2.3 + n * 0.7) * 0.3;
      [tipX, tipY] = [x + Math.cos(tipA) * 3, y + Math.sin(tipA) * 3];
    }
    for (let i = n; i < segs.length; i++) segs[i].setVisible(false);
    for (let i = 0; i < n; i++) segs[i].setScale(segs[i].base * (1 - (i / Math.max(1, n)) * 0.2));
    g.tip.setVisible(show);
    if (show) {
      g.tip.setPosition(tipX, tipY).setRotation(tipA - DOWN);
      const fr = Math.floor(g.t * 3) % 2 ? 'ko_tongue_tip_1' : 'ko_tongue_tip_0';
      if (g.tip.frame.name !== fr) g.tip.setFrame(fr);
    }
  },

  /** Torn some more: scraps of paper and a splinter fly off. */
  kasaTear(e) {
    const fx = this.scene.fx;
    for (let i = 0; i < 12; i++) {
      const p = fx.part(fx.parts, Math.random() < 0.5 ? 't_paper_0' : 't_paper_1', e.x + (Math.random() - 0.5) * 34, e.y + (Math.random() - 0.5) * 18, { vx: (Math.random() - 0.5) * 120, vy: -20 - Math.random() * 70, g: 110, drag: 1.2, spin: (Math.random() - 0.5) * 14, life: 0.9 });
      p.setTint(Math.random() < 0.75 ? 0xc42430 : 0xeee4d0);
    }
    fx.text(e.x + 20, e.y - 20, 'BIRI!', 0.6, 0xffffff);
  },

  /** The ripples where it landed, on the ground (they keep to the map). */
  kasaFx(g, dt) {
    const s = this.scene;
    let n = 0;
    for (const f of g.fx) {
      f.t += dt;
      const k = f.t / f.life;
      if (k >= 1) {
        this.segPool.kill(f.sp);
        continue;
      }
      const fr = `ko_ripple_${Math.min(2, Math.floor(k * 3))}`;
      if (f.sp.frame.name !== fr) f.sp.setFrame(fr);
      f.sp.setPosition(f.x, s.parallax.screenY(f.u)).setAlpha(1 - k * 0.8);
      g.fx[n++] = f;
    }
    g.fx.length = n;
  },

  /**
   * A shot reaching it: the open canopy stops it (a plink, a spray); shut, in the air, or a little one at the red
   * man, it hurts; in the last phase only the eye does, while the tongue is out. (Enemies.bossDeviceHit)
   */
  kasaShot(shot) {
    const e = this.heavy;
    const g = e?.kasa;
    if (!g || e.dead || e.hp <= 0 || e.state === 'enter') return false;
    const s = this.scene;
    if (e.stage === 2 && g.minis.length) {
      for (const m of g.minis) {
        const my = this.kasaMiniY(m);
        if (Math.hypot(shot.x - m.x, shot.y - my) > KASA.mini.r + shot.radius) continue;
        if (g.act === 'stop') {
          this.damage(e, shot.damage * KASA.mini.take);
          m.hurt = 0.1;
          if (Math.random() < 0.5) s.fx.spark(shot.x, shot.y - 2);
        } else this.kasaPlink(shot.x, shot.y, 0.4);
        return true;
      }
      return false;
    }
    if (e.alpha <= 0) return false;
    const shape = shapeOf(g.frame);
    const [rx, ry, dy] = BODY[shape] ?? BODY.open;
    if (((shot.x - e.x) / (rx + shot.radius)) ** 2 + ((shot.y - e.y - dy) / (ry + shot.radius)) ** 2 > 1) return false;
    if (e.stage === 3) {
      const an = anchorOf(g.frame);
      const [ex, ey] = [e.x + an[0], e.y + an[1]];
      if (g.exposed && Math.hypot(shot.x - ex, shot.y - ey) < 8 + shot.radius) {
        this.damage(e, shot.damage * KASA.lash.take);
        s.fx.spark(shot.x, shot.y - 2, SAFE);
        return true;
      }
      // (the eye open: a shot coming up under it flies on to it, not stopped by the canopy's rim on the way)
      if (g.exposed && shot.y > ey && Math.abs(shot.x - ex) < 8 + shot.radius) return false;
      this.kasaPlink(shot.x, shot.y, 0.25);
      return true;
    }
    if (g.guard) {
      this.kasaPlink(shot.x, shot.y, 0.3);
      return true;
    }
    this.damage(e, shot.damage);
    if (Math.random() < 0.5) s.fx.spark(shot.x, shot.y - 2);
    return true;
  },

  /** A shot off the oiled paper: a ping, a fleck of water thrown back. */
  kasaPlink(x, y, k) {
    const s = this.scene;
    if (Math.random() < k) {
      const p = s.fx.part(s.fx.parts, 'drop_0', x, y - 2, { vx: (Math.random() - 0.5) * 70, vy: 20 + Math.random() * 40, g: 200, drag: 0.6, life: 0.3, a0: 0.9 });
      p.setTint(DROP);
    }
    if (Math.random() < k * 0.6) s.fx.spark(x, y - 1, 0xd8f0ff);
    if (s.t > (this.kasaPing ?? 0)) {
      this.kasaPing = s.t + 0.09;
      s.sfx.bossHit(true);
    }
  },

  kasaCleanup(e) {
    const g = e.kasa;
    if (!g) return;
    const kill = (sp) => {
      if (!sp || sp.dead) return;
      sp.setRotation(0).setAlpha(1).clearTint();
      this.segPool.kill(sp);
    };
    for (const sp of [g.shadow, g.legSp, g.eyeSp, g.ring, g.tip, g.sig, ...g.tongue]) kill(sp);
    for (const m of g.minis) {
      kill(m.sp);
      kill(m.sh);
    }
    for (const f of g.fx) kill(f.sp);
    e.setAlpha(1);
    e.kasa = null;
  },

  /** Going down: the body and its leg and eye go on (Enemies.goDown) for the bow at the end (kasaEnd). */
  kasaDown(e) {
    const g = e.kasa;
    const s = this.scene;
    const out = { extra: [], foot: g ? [g.foot.x, g.foot.u] : [e.x, s.parallax.stripU(e.y + 20)] };
    if (!g) return out;
    // (in the middle of the scramble: it pulls itself together first)
    if (e.alpha <= 0) {
      Object.assign(g.foot, { x: 90, u: 3348 });
      g.z = 0;
      g.leg = 'stand';
      g.frame = 'ko_open_2';
      e.setAlpha(1);
      this.kasaPlace(e, g, 0);
    }
    const copy = (o) => s.add.sprite(o.x, o.y, o.texture.key, o.frame.name).setDepth(o.depth).setScale(o.scaleX, o.scaleY);
    out.leg = copy(g.legSp);
    out.eye = copy(g.eyeSp);
    out.extra = [{ s: out.leg, ox: g.legSp.x - e.x, oy: g.legSp.y - e.y }, { s: out.eye, ox: g.eyeSp.x - e.x, oy: g.eyeSp.y - e.y }];
    out.shadow = copy(g.shadow);
    out.shadow.setAlpha(g.shadow.alpha);
    out.wear = g.wear;
    return out;
  },

  /**
   * The end: it folds itself up, bows twice to the crossing, and with a puff hops off into the crowd as an ordinary
   * clear umbrella. Its feet stay on the map (the city starts moving again under it). Returns true when it is gone.
   */
  kasaEnd(d, dt) {
    const s = this.scene;
    const b = d.body;
    const kd = d.kasa;
    const [fx, fu] = kd.foot;
    const fy = s.parallax.screenY(fu);
    if (d.t < 1.1) {
      // the blow that finished it: shaking, flashing, water bursting off it (where it stands on the map)
      const an = anchorOf(b.frame.name);
      const [jx, jy] = [Math.round((Math.random() - 0.5) * 3), Math.round((Math.random() - 0.5) * 3)];
      b.setPosition(fx - an[7] + jx, fy - LEG_FOOT.stand - an[8] + jy);
      const flash = Math.floor(d.t * 14) % 2 ? 0x707070 : 0x000000;
      for (const sp of [b, kd.leg, kd.eye]) sp?.setTint(flash).setTintMode(Phaser.TintModes.ADD);
      kd.leg?.setPosition(fx + jx, fy - LEG_FOOT.stand - LEG_TOP + jy);
      if (kd.eye) {
        if (kd.eye.frame.name !== 'ko_eye_hurt') kd.eye.setFrame('ko_eye_hurt');
        kd.eye.setPosition(b.x + an[0], b.y + an[1]);
      }
      kd.shadow?.setPosition(fx, fy);
      if ((d.next -= dt) <= 0) {
        d.next = 0.12;
        for (let i = 0; i < 6; i++) s.fx.part(s.fx.parts, 'drop_0', b.x + (Math.random() - 0.5) * 30, b.y + (Math.random() - 0.5) * 16, { vx: (Math.random() - 0.5) * 160, vy: -40 - Math.random() * 80, g: 260, drag: 0.3, life: 0.55 }).setTint(DROP);
        const p = s.fx.part(s.fx.parts, 't_paper_0', b.x + (Math.random() - 0.5) * 30, b.y, { vx: (Math.random() - 0.5) * 120, vy: -50, g: 110, drag: 1.2, spin: 8, life: 0.8 });
        p.setTint(0xc42430);
      }
      return false;
    }
    const k = d.t - 1.1;
    if (!kd.calm) {
      kd.calm = true;
      for (const sp of [b, kd.leg, kd.eye]) sp?.clearTint();
      s.fx.text(fx, fy - 60, 'PASA...', 0.8, DROP);
    }
    const set = (sp, fr) => sp && sp.frame.name !== fr && sp.texture.has(fr) && sp.setFrame(fr);
    const place = (frame, leg, eye, z = 0) => {
      const an = anchorOf(frame);
      set(b, frame);
      const attach = fy - z - LEG_FOOT[leg];
      b.setPosition(fx - an[7], attach - an[8]);
      if (kd.leg) {
        set(kd.leg, `ko_leg_${leg}`);
        kd.leg.setPosition(fx, attach - LEG_TOP);
      }
      if (kd.eye) {
        kd.eye.setVisible(!!eye && an[2] > 0.3);
        if (eye) set(kd.eye, `ko_eye_${eye}`);
        const ek = (EYE_K[shapeOf(frame)] ?? 1) * 0.36;
        kd.eye.setPosition(b.x + an[0], b.y + an[1]).setScale(ek, ek);
      }
      kd.shadow?.setPosition(fx, fy);
    };
    const w = kd.wear ?? 3;
    if (k < 0.45) {
      // folding up: open, wide, half, shut
      const order = ['open', 'wide', 'half', 'shut'];
      place(`ko_${order[Math.min(3, Math.floor((k / 0.45) * 4))]}_${w}`, 'stand', 'shut');
    } else if (k < 1.65) {
      // two bows to the crossing
      const q = (k - 0.45) / 0.6;
      const ph = q % 1;
      const fr = ph < 0.2 || ph > 0.85 ? `ko_shut_${w}` : ph < 0.4 || ph > 0.7 ? 'ko_bow_0' : 'ko_bow_1';
      place(fr, ph > 0.3 && ph < 0.75 ? 'crouch1' : 'stand', 'happy');
      if (!kd.said) {
        kd.said = true;
        s.fx.text(fx, fy - 54, 'ARIGATŌ', 1.2, 0xffe080);
      }
    } else {
      // a puff, and only an ordinary clear umbrella is left, hopping away over the crowd
      if (!kd.puffed) {
        kd.puffed = true;
        s.fx.smoke(b.x, b.y, 5, 9);
        s.fx.flash(0.25, 0.25);
        kd.leg?.setVisible(false);
        kd.eye?.setVisible(false);
        kd.shadow?.setScale(kd.shadow.scaleX * 0.5, kd.shadow.scaleY * 0.5);
        b.setAlpha(0.9);
      }
      const q = k - 1.65;
      const hopK = (q * 2.2) % 1;
      const x = fx + q * 46;
      const u = fu + q * 30;
      const z = Math.sin(hopK * Math.PI) * 9;
      const y = s.parallax.screenY(u);
      set(b, Math.floor(q * 4.4) % 2 ? 'ko_clear_1' : 'ko_clear_0');
      b.setPosition(x, y - 13 - z);
      kd.shadow?.setPosition(x, y);
      if (hopK < kd.lastHop) for (let i = 0; i < 4; i++) s.fx.part(s.fx.parts, 'drop_0', x + (Math.random() - 0.5) * 8, y, { vx: (Math.random() - 0.5) * 50, vy: -20 - Math.random() * 30, g: 200, life: 0.3 }).setTint(DROP);
      kd.lastHop = hopK;
      if (q > 1.2) b.setAlpha(Math.max(0, 0.9 - (q - 1.2) * 1.5));
      if (q > 1.8) {
        kd.shadow?.destroy();
        return true;
      }
    }
    return false;
  },
};
