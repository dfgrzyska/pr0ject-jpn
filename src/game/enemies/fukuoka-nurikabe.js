// Fukuoka's boss (docs/plan-fukuoka.md, 6.2): NURIKABE, the wall that bars the way. Methods of Enemies (mixed in like
// the cities'). The strip has come to its end: the field of the old government's ruins under the Mizuki earthwork at
// sunset, and a stretch of the earthwork comes alive. Everything here is in screen terms (the strip stands still).
// Art: tools/art/fukuoka/nurikabe.mjs (frames nu_*; its parts' places: PARTS there, NURI here, a third of them).
import Phaser from 'phaser';
import { DEPTH } from '../../config.js';
import { rules, volley } from '../../difficulty.js';
import { slow, DOWN, TAU } from './shared.js';

/**
 * Its life and the phases' thresholds; how much of a shot it takes in its windows (its footing bared as it lifts, its
 * core's face laid bare in the alley); the wall (a stream of water off its mouth, the lift and how long it hangs, the
 * leap, the rows of clods it sheds landing); the alley (its stretches' cornerstones, how long a stretch lies crumbled
 * and the face is bare, the corridor's width, the water off their slots; every how long one of its tricks: the alley
 * squeezed shut and the water forced down it, water swept out of the slots, a stretch toppled across it); the night (how soon the
 * dark comes, its eyes flashing, how fast it follows the ship, how far it leaps, the petals settling); how long its end
 * takes. Where it stands: nuPlaces.
 */
export const NURIKABE = {
  hp: 1200,
  phase: [0.66, 0.33],
  take: { foot: 1.0, face: 1.3 },
  spray: { time: 1.7, every: 0.085, sweep: 0.55, speed: 1.25 },
  lift: { up: 0.5, hang: 1.0, h: 9 },
  leap: { time: 0.6, h: 14 },
  clods: { n: 9, rows: 2, gap: 0.32, speed: 0.95 },
  alley: {
    gold: 8, down: 7, open: 3.2, gap: [46, 96], every: 2.3, fan: 5, fanEvery: 2.7, moveEvery: 4.2,
    squeeze: { warn: 0.9, hold: 1.3, gap: 26, slide: 70, every: 0.07, speed: 1.45, wide: 0.1 },
    cross: { warn: 0.7, n: 9, every: 0.05, speed: 1.2, rows: [0, 1, 0], step: 0.6, end: 0.25 },
    topple: { warn: 0.9, fall: 0.35, down: 2.4 },
  },
  night: { dark: 0.62, glide: 2.4, flash: 0.9, follow: 24, reach: 46, fill: 0.22 },
  outro: 9,
};

// its parts' places, logical px from the middle of the wall's frame (the art's PARTS, a third of them)
export const NURI = {
  w: 180,
  h: 65.33,
  eyes: [[-32, -4], [32, -4]],
  eyesCore: [[-21.33, -4], [21.33, -4]],
  mouth: [0, 15.33],
  slot: [0, 13.33],
  gold: [0, 26.33],
  foot: [22.67, 30],
  ridge: [-30.67, -14],
  core: 80,
  stretch: 41.33,
};
const MOUTH_O = 30 / 84; // (the mouth frame's origin: its conduit's mouth)
const HOME = 96; // (the middle of the earthwork on the screen, where it comes out of it)
const SAFE = 0x81f3cc;
const GOLD = 0xffd84a;
const WARN = 0xff735e;
const BASE = DEPTH.ground + 0.7;
const SAY = (s, x, y, t, life = 0.8, c = 0xffffff) => s.fx.text(x, Phaser.Math.Clamp(y, 14, s.H - 40), t, life, c);
const ease = (q) => q * q * (3 - 2 * q);
const easy = () => rules().volley < 1;

/** The corridor's two sides (their middles' x) for a corridor centred at cx, gap wide, kept on the screen. */
export function corridor(cx, gap) {
  const half = NURI.stretch / 2;
  const c = Phaser.Math.Clamp(cx, half * 2 + gap / 2, 180 - half * 2 - gap / 2);
  return [c - gap / 2 - half, c + gap / 2 + half];
}

/**
 * Where it stands on a screen H tall (they run 320 to 420 px; on a short one it keeps further from the ship): the
 * wall's two rows in the first phase (just off the earthwork, then out on the field), the core and the stretches' two
 * rows in the alley, how far down it follows the ship at night and how far down it leaps.
 */
export function nuPlaces(H) {
  const low = Math.min(240, H - 100);
  return { rows: [136, Math.round(136 + 0.11 * H)], core: low - 130, alley: [low - 64, low], glide: Math.round(H * 0.5), hop: Math.round(H * 0.55) };
}

/** Where a stretch tipping over on its inner foot (by rot) has its middle. */
export function tipped(st, rot) {
  const half = NURI.stretch / 2;
  const [px, py] = [st.x - st.side * half, st.y + NURI.h / 2];
  const [vx, vy] = [st.side * half, -NURI.h / 2];
  return [px + vx * Math.cos(rot) - vy * Math.sin(rot), py + vx * Math.sin(rot) + vy * Math.cos(rot)];
}

export const fukuokaNurikabe = {
  /**
   * A stretch of the Mizuki earthwork come alive: its ridge under grass with young plums, its face of rammed earth in
   * courses, its mouth the old wooden conduit, its eyes of fired clay. Three phases:
   * 1. ŚCIANA: across the field the whole width of the screen, it stops every shot (DON!); water gushes off its mouth
   *    at the ship; it lifts and leaps forward on to a band flagged red, and landing it sheds rows of clods. As it
   *    lifts its footing shows, glowing mint: it can be hit there;
   * 2. ZAUŁEK: it breaks into its core and four stretches that make a corridor round the ship and close in; water from
   *    their slots and its mouth. A gold cornerstone in each stretch's footing: shot, the stretch crumbles and the
   *    core's face is laid bare for a while (mint);
   * 3. NOC: the sun goes down and it goes invisible, as in the tale: only its shadow, its eyes flashing and the plum
   *    petals settling on its ridge give it away. It follows the ship and leaps at it; as it lifts its footing glows.
   * Beaten, it sighs, settles back into the earthwork and grows over; a young plum flowers on the ridge, and the first
   * stars come out over the field.
   */
  spawnNuri(w, base) {
    const g = {
      kind: 'nurikabe', state: 'dormant', stage: 1, t: 0, dt: 0, parts: [], awake: false, defeated: false, act: null, plan: 0,
      outro: NURIKABE.outro, x: 90, y: HOME, z: 0, alpha: 0, rise: 0, look: 'shut', blink: 1.5, mouth: 0, sp: {}, stretches: [],
      open: 0, dark: 0, fill: 0, flash: 0, said: {}, row: 0, band: null, cx: 90,
    };
    const body = this.pool.spawn('nu_wall_0', g.x, g.y, { ...base, role: 'body', group: g, hp: NURIKABE.hp, maxHp: NURIKABE.hp, radius: 30, pass: true, harmless: true, flashTint: 0x404040 });
    body.setAlpha(0).setDepth(BASE);
    g.body = body;
    g.parts.push(body);
    g.maxTotal = NURIKABE.hp;
    g.night = this.scene.add.rectangle(90, this.scene.H / 2, 180, this.scene.H, 0x0a1030, 0).setDepth(DEPTH.ground + 0.6);
    this.bossGroup = g;
    this.nuDraw(g);
    return body;
  },

  updateNuri(g, dt) {
    g.t += dt;
    g.dt = dt;
    if (g.state === 'dormant') return this.nuDormant(g, dt);
    if (g.state === 'rise') this.nuRise(g, dt);
    else this.nuFight(g, dt);
    g.open = Math.max(0, g.open - dt);
    g.flash = Math.max(0, g.flash - dt);
    this.nuStretches(g, dt);
    this.nuTele(g);
    this.nuDraw(g);
  },

  // ---------------------------------------------------------------- out of the earthwork
  /** Dust off the earthwork where it will come out, until the strip has come to its end. */
  nuDormant(g, dt) {
    const s = this.scene;
    if (Math.random() < dt * 6) s.fx.part(s.fx.parts, 'dot_1', 10 + Math.random() * 160, HOME + 30, { vx: (Math.random() - 0.5) * 20, vy: -12, life: 0.7, a0: 0.6 }).setTint(0x9a8a6a);
    if (s.parallax.time < s.parallax.maxTime - 1e-3) return;
    Object.assign(g, { state: 'rise', rise: 0 });
    for (const o of this.pool.live) if (!o.dead && o.group !== g && o.def.weight > 0) this.destroy(o);
    s.bullets.cancelAll(s.fx);
    s.cameras.main.shake(2600, 0.004);
    SAY(s, 90, HOME + 50, 'GOGOGOGO...', 1.4, 0xd8c8a0);
  },

  /** A stretch of the earthwork wakes: dust off its face, its eyes open, then it steps out on to the field. */
  nuRise(g, dt) {
    const s = this.scene;
    const was = g.rise;
    g.rise = Math.min(1, g.rise + dt / 3);
    g.alpha = ease(Math.min(1, g.rise * 1.6));
    if (Math.random() < dt * 30) s.fx.part(s.fx.parts, 'dot_1', 4 + Math.random() * 172, g.y + 20 + Math.random() * 12, { vx: (Math.random() - 0.5) * 30, vy: -10 - Math.random() * 20, g: 30, life: 0.8, a0: 0.8 }).setTint(Math.random() < 0.5 ? 0x9a8a6a : 0xb09a70);
    if (was < 0.6 && g.rise >= 0.6) {
      g.look = 'open';
      SAY(s, 90, g.y + 46, 'NURIIII...', 1.6, 0xe0d0a0);
      s.sfx.quake?.();
    }
    if (g.rise >= 1) {
      Object.assign(g, { state: 'fight', awake: true });
      this.nuHop(g, nuPlaces(this.scene.H).rows[0]);
    }
  },

  // ---------------------------------------------------------------- the fight
  nuFight(g, dt) {
    const e = g.body;
    const frac = e.hp / e.maxHp;
    if (g.stage === 1 && frac < NURIKABE.phase[0] && !g.act?.air) return this.nuToAlley(g);
    if (g.stage === 2 && frac < NURIKABE.phase[1]) return this.nuToNight(g);
    this.nuBlink(g, dt);
    if (g.stage === 2) return this.nuAlley(g, dt);
    if (g.stage === 3) {
      g.dark = Math.min(1, g.dark + dt / 2.5);
      g.fill = Math.min(1, g.fill + dt * NURIKABE.night.fill);
    }
    if (!g.act) {
      const P = g.stage === 1 ? ['spray', 'hop', 'spray', 'hop'] : ['glide', 'hop'];
      const kind = P[g.plan++ % P.length];
      if (kind === 'hop') {
        const p = this.scene.player;
        const at = nuPlaces(this.scene.H);
        const to = g.stage === 1 ? at.rows[(g.row = 1 - g.row)] : Phaser.Math.Clamp(Math.min(g.y + NURIKABE.night.reach, p.y - 95), 120, at.hop);
        this.nuHop(g, to);
      } else g.act = { kind, t: 0, done: {} };
    }
    const a = g.act;
    a.t += dt * this.nuHaste(g);
    if (a.kind === 'spray') this.nuSpray(g, a, dt);
    else if (a.kind === 'glide') this.nuGlide(g, a, dt);
    else if (a.kind === 'hop') this.nuHopStep(g, a, dt);
  },

  /** How much quicker it goes, the less life it has (1 .. 1.3). */
  nuHaste(g) {
    return 1 + 0.3 * (1 - Math.max(0, g.body.hp / g.body.maxHp));
  },

  nuBlink(g, dt) {
    if ((g.blink -= dt) > 0) return;
    if (g.look === 'shut') {
      g.look = g.stage === 2 ? 'glare' : 'open';
      g.blink = 2 + Math.random() * 2.5;
    } else {
      g.look = 'shut';
      g.blink = 0.14;
    }
  },

  /** Water gushing off its mouth at the ship, sweeping a little to and fro. */
  nuSpray(g, a, dt) {
    const s = this.scene;
    const S = NURIKABE.spray;
    g.mouth = a.t < S.time ? 2 : 0;
    if (a.t < S.time && this.canFire(g.body)) {
      a.next = (a.next ?? 0) - dt;
      if (a.next <= 0) {
        a.next = S.every;
        const [mx, my] = [g.x + NURI.mouth[0], g.y - g.z + NURI.mouth[1] + 6];
        const aim = Math.atan2(s.player.y - my, s.player.x - mx) + Math.sin(a.t * 3.4) * S.sweep;
        s.bullets.shot(`nu_gout_${Math.floor(a.t * 10) & 1}`, mx, my, aim, slow * S.speed, 2.2);
      }
    }
    if (a.t > S.time + 0.5) g.act = null;
  },

  /** Lift, hang there (its footing bared, mint), leap to row y, land. */
  nuHop(g, to) {
    g.act = { kind: 'hop', t: 0, from: g.y, to, done: {} };
    g.band = { y: to, t: 0 };
  },

  nuHopStep(g, a, dt) {
    const s = this.scene;
    const L = NURIKABE.lift;
    const J = NURIKABE.leap;
    const hang = L.hang * (easy() ? 1.3 : 1);
    if (a.t < L.up + hang) {
      g.z = L.h * ease(Math.min(1, a.t / L.up)) + Math.sin(a.t * 9) * 0.6;
      g.mouth = 1;
      if (!a.done.creak) {
        a.done.creak = true;
        s.sfx.quake?.();
        for (let i = 0; i < 18; i++) s.fx.part(s.fx.parts, 'dot_1', 4 + Math.random() * 172, g.y + NURI.foot[1], { vx: (Math.random() - 0.5) * 30, vy: 6 + Math.random() * 10, life: 0.5, a0: 0.7 }).setTint(0x9a8a6a);
      }
      return;
    }
    a.air = true;
    const k = Math.min(1, (a.t - L.up - hang) / J.time);
    g.y = a.from + (a.to - a.from) * ease(k);
    g.z = L.h * (1 - k) + Math.sin(k * Math.PI) * J.h;
    if (k < 1) return;
    // landing: the ground shakes, dust, the band is struck, rows of clods shed at the ship
    g.z = 0;
    g.act = null;
    g.band = null;
    g.mouth = 0;
    s.cameras.main.shake(260, 0.008);
    s.sfx.explode('m');
    s.sfx.earth?.(true);
    SAY(s, 90, g.y + 40, 'DOSUN!', 1, 0xe0d0a0);
    const p = s.player;
    if (p.alive && !p.god && p.invulnerable <= 0 && p.entering <= 0 && Math.abs(p.y - g.y) < NURI.h / 2) p.hit();
    for (let i = 0; i < 30; i++) s.fx.part(s.fx.parts, 'dot_1', 2 + Math.random() * 176, g.y + NURI.foot[1] + Math.random() * 4, { vx: (Math.random() - 0.5) * 60, vy: 10 + Math.random() * 30, drag: 1.5, life: 0.7, a0: 0.8 }).setTint(Math.random() < 0.5 ? 0x9a8a6a : 0x7a6a4a);
    if (g.stage === 3) {
      // the petals shaken off its ridge
      g.fill = 0.15;
      for (let i = 0; i < 26; i++) s.fx.part(s.fx.parts, `nu_petal_${i & 3}`, 4 + Math.random() * 172, g.y + NURI.ridge[0] + Math.random() * 16, { vx: (Math.random() - 0.5) * 40, vy: -20 - Math.random() * 30, g: 40, drag: 1, life: 1.4, a0: 0.9 });
    }
    if (this.canFire(g.body)) this.nuClods(g, g.stage === 3 ? 1 : NURIKABE.clods.rows);
  },

  /** Rows of clods across the field from its foot, a gap in each where the ship can slip through. */
  nuClods(g, rows) {
    const s = this.scene;
    const C = NURIKABE.clods;
    for (let r = 0; r < rows; r++) {
      s.time.delayedCall(r * C.gap * 1000, () => {
        if (!g.awake || g.defeated) return;
        const n = volley(C.n);
        const hole = Math.floor(Math.random() * (n - 1));
        for (let i = 0; i < n; i++) {
          if (i === hole || i === hole + 1) continue;
          const x = 10 + (i + 0.5) * (160 / n) + (r % 2) * (80 / n);
          s.bullets.shot(`nu_clod_${(i + r) & 3}`, x, g.y + NURI.foot[1], DOWN + (Math.random() - 0.5) * 0.12, slow * C.speed, 2.6);
        }
      });
    }
  },

  // ---------------------------------------------------------------- phase 2: the alley
  nuToAlley(g) {
    const s = this.scene;
    this.phaseBreak(g, 90, g.y, 2, 'ZAUŁEK');
    Object.assign(g, { act: null, band: null, z: 0, mouth: 0, look: 'glare', cx: s.player.x });
    // its wings break off and rise again as four stretches round the ship
    for (let i = 0; i < 40; i++) s.fx.part(s.fx.parts, 'dot_1', Math.random() * 180, g.y + (Math.random() - 0.5) * 50, { vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 60, drag: 1.2, life: 0.8, a0: 0.9 }).setTint(Math.random() < 0.5 ? 0x9a8a6a : 0x8c5434);
    const at = nuPlaces(s.H);
    g.y = at.core;
    g.stretches = [0, 1, 2, 3].map((n) => ({ n, side: n % 2 ? 1 : -1, row: n < 2 ? 0 : 1, x: n % 2 ? 160 : 20, y: at.alley[n < 2 ? 0 : 1], gold: NURIKABE.alley.gold, state: 'rise', t: 0, a: 0, rot: 0, wob: 0, cry: 1 + n * 0.55 }));
    Object.assign(g, { move: null, moveT: 3, moveN: 0 });
    SAY(s, 90, g.y + 46, 'ZUZUZUZU...', 1.4, 0xe0d0a0);
    s.sfx.quake?.();
    g.fanT = 1.5;
  },

  nuAlley(g, dt) {
    const s = this.scene;
    const A = NURIKABE.alley;
    // the corridor closes in round the ship, then opens a little, and follows it slowly (not while it squeezes)
    if (g.move?.kind !== 'squeeze') g.cx += (s.player.x - g.cx) * Math.min(1, dt * 0.45);
    // now and then one of its tricks, in turn: the alley squeezed shut, water across it, a stretch toppled across it
    if (!g.move && (g.moveT -= dt * this.nuHaste(g)) <= 0) {
      const up = g.stretches.filter((st) => st.state === 'up');
      let kind = ['squeeze', 'cross', 'topple'][g.moveN++ % 3];
      if (kind !== 'cross' && up.length < 2) kind = 'cross';
      if (up.length) this.nuMove(g, kind, up);
      else g.moveT = 1;
    }
    if (g.move) this.nuMoveStep(g, dt);
    // its mouth: a fan of water at the ship now and then
    g.mouth = g.open > 0 ? 1 : (g.fanT ?? 0) < 0.5 ? 2 : 0;
    if ((g.fanT -= dt * this.nuHaste(g)) <= 0) {
      g.fanT = A.fanEvery;
      if (this.canFire(g.body)) {
        const [mx, my] = [g.x, g.y + NURI.mouth[1] + 6];
        const n = volley(A.fan);
        const aim = Math.atan2(s.player.y - my, s.player.x - mx);
        for (let i = 0; i < n; i++) s.bullets.shot(`nu_gout_${i & 1}`, mx, my, aim + (i / (n - 1) - 0.5) * 0.9, slow * 1.1, 2.2);
      }
    }
  },

  /** One of its tricks begins: how long its warning lasts; the stretch to topple (the one whose fall covers the ship). */
  nuMove(g, kind, up) {
    const s = this.scene;
    const A = NURIKABE.alley;
    const m = (g.move = { kind, t: 0, warn: A[kind].warn * rules().warn * (easy() ? 1.3 : 1) });
    if (kind === 'squeeze') {
      SAY(s, g.x, g.y + 40, 'GIGIGI...', 0.9, 0xe0d0a0);
      s.sfx.quake?.();
    } else if (kind === 'cross') m.rows = A.cross.rows.map((row, i) => ({ row, at: m.warn + i * A.cross.step, left: A.cross.n, next: 0 }));
    else {
      const p = s.player;
      m.st = up.map((st) => [st, Math.abs(tipped(st, -st.side * Math.PI / 2)[1] - p.y) + Math.random() * 8]).sort((a, b) => a[1] - b[1])[0][0];
      Object.assign(m.st, { state: 'topple', t: 0 });
      SAY(s, m.st.x, m.st.y - 34, 'GURA...', 0.8, 0xe0d0a0);
    }
  },

  nuMoveStep(g, dt) {
    const s = this.scene;
    const A = NURIKABE.alley;
    const m = g.move;
    m.t += dt;
    let over = false;
    if (m.kind === 'squeeze') {
      // the alley shut round the ship: what is caught between the stretches is crushed
      const on = m.t > m.warn && m.t < m.warn + A.squeeze.hold + 0.3;
      const p = s.player;
      if (on && p.alive && !p.god && p.invulnerable <= 0 && p.entering <= 0) {
        for (const st of g.stretches) if (st.state === 'up' && Math.abs(p.x - st.x) < NURI.stretch / 2 - 2 && Math.abs(p.y - st.y) < NURI.h / 2 - 4) p.hit();
      }
      if (m.t > m.warn && !m.shut) {
        m.shut = true;
        s.cameras.main.shake(200, 0.004);
        s.sfx.earth?.();
        SAY(s, g.cx, g.y + 44, 'DOBAA!', 0.8, 0xc8e8ff);
      }
      // the water forced down the shut alley, out of its end at the ship's side of the field
      if (on && m.t > m.warn + 0.25) {
        g.mouth = 2;
        m.next = (m.next ?? 0) - dt;
        while (m.next <= 0) {
          m.next += A.squeeze.every;
          const [mx, my] = [g.cx, g.y + NURI.mouth[1] + 8];
          if (this.canFire(g.body)) s.bullets.shot(`nu_gout_${Math.floor(m.t * 10) & 1}`, mx, my, DOWN + (Math.random() - 0.5) * A.squeeze.wide, slow * A.squeeze.speed, 2.2);
        }
      }
      over = m.t > m.warn + A.squeeze.hold + 0.8;
    } else if (m.kind === 'cross') {
      // a row's stretches in turn (the near row, the far one, the near again), a stream off each slot swept from across
      // the alley down over the field
      const C = A.cross;
      for (const r of m.rows) {
        if (m.t < r.at || r.left <= 0) continue;
        r.next -= dt;
        while (r.next <= 0 && r.left > 0) {
          r.next += C.every;
          r.left--;
          for (const st of g.stretches) {
            if (st.state !== 'up' || st.row !== r.row) continue;
            const [sx, sy] = [st.x + NURI.slot[0], st.y + NURI.slot[1] + 2];
            const k = 1 - r.left / (C.n - 1);
            const a0 = st.side < 0 ? 0 : Math.PI;
            const a1 = DOWN + st.side * C.end;
            if (this.canFire({ type: 'boss', seen: g.body.seen, y: sy })) s.bullets.shot(`nu_gout_${r.left & 1}`, sx, sy, a0 + (a1 - a0) * k, slow * C.speed, 2.2);
          }
          if (r.left === C.n - 1) s.sfx.splash?.();
        }
      }
      over = m.rows.every((r) => r.left <= 0);
    } else over = m.st.state === 'gone' || m.st.state === 'sink' || m.st.state === 'rise';
    if (over) Object.assign(g, { move: null, moveT: A.moveEvery });
  },

  /** A toppled stretch lands across the alley: what is under it is crushed, clods off it, and the core's face bares. */
  nuLand(g, st) {
    const s = this.scene;
    const [cx, cy] = tipped(st, st.rot);
    Object.assign(st, { state: 'down', t: 0 });
    g.open = Math.max(g.open, NURIKABE.alley.topple.down * (easy() ? 1.3 : 1));
    g.look = 'half';
    g.blink = g.open;
    s.cameras.main.shake(240, 0.007);
    s.sfx.explode('m');
    s.sfx.earth?.(true);
    SAY(s, cx, cy - 24, 'DOSUN!', 1, 0xe0d0a0);
    const p = s.player;
    if (p.alive && !p.god && p.invulnerable <= 0 && p.entering <= 0 && Math.abs(p.x - cx) < NURI.h / 2 - 2 && Math.abs(p.y - cy) < NURI.stretch / 2 - 2) p.hit();
    for (let i = 0; i < 24; i++) s.fx.part(s.fx.parts, 'dot_1', cx + (Math.random() - 0.5) * NURI.h, cy + NURI.stretch / 2 - Math.random() * 6, { vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 40, drag: 1.5, life: 0.7, a0: 0.8 }).setTint(Math.random() < 0.5 ? 0x9a8a6a : 0x7a6a4a);
    if (this.canFire({ type: 'boss', seen: g.body.seen, y: cy })) {
      const n = volley(5);
      for (let i = 0; i < n; i++) s.bullets.shot(`nu_clod_${i & 3}`, cx + (i - (n - 1) / 2) * 12, cy + 14, DOWN + (i - (n - 1) / 2) * 0.14, slow * 0.9, 2.6);
    }
  },

  /** The stretches: rising, sliding to their places in the corridor, water off their slots, crumbling, rising again. */
  nuStretches(g, dt) {
    const s = this.scene;
    const A = NURIKABE.alley;
    if (!g.stretches.length) return;
    const m = g.move;
    const squeeze = m?.kind === 'squeeze' && m.t > m.warn && m.t < m.warn + A.squeeze.hold;
    const gap = squeeze ? A.squeeze.gap : A.gap[0] + (A.gap[1] - A.gap[0]) * (0.5 + 0.5 * Math.cos(g.t * 0.55));
    const slide = m?.kind === 'squeeze' && m.t > m.warn ? A.squeeze.slide : 18;
    const [lx, rx] = corridor(g.cx, gap);
    for (const st of g.stretches) {
      st.t += dt;
      if (st.state === 'sink') {
        st.a = Math.max(0, st.a - dt * 1.5);
        continue;
      }
      if (st.state === 'topple') {
        // it rocks on its foot, then tips over across the alley
        const warn = m?.st === st ? m.warn : A.topple.warn;
        if (st.t < warn) st.wob = Math.sin(st.t * 30) * 0.05 * (st.t / warn);
        else {
          const k = Math.min(1, (st.t - warn) / A.topple.fall);
          st.wob = 0;
          st.rot = -st.side * (Math.PI / 2) * k * k;
          if (k >= 1) this.nuLand(g, st);
        }
        continue;
      }
      if (st.state === 'down') {
        // lying across the alley, then it crumbles away (to rise again later)
        if (st.t > A.topple.down * (easy() ? 1.3 : 1)) {
          const [cx, cy] = tipped(st, st.rot);
          for (let i = 0; i < 20; i++) s.fx.part(s.fx.parts, `nu_clod_${i & 3}`, cx + (Math.random() - 0.5) * NURI.h, cy + (Math.random() - 0.5) * NURI.stretch * 0.8, { vx: (Math.random() - 0.5) * 60, vy: -20 - Math.random() * 30, g: 160, life: 0.7, a0: 1 });
          s.fx.smoke(cx, cy, 3, 6, true);
          SAY(s, cx, cy - 10, 'BORO BORO...', 0.9, 0xe0d0a0);
          Object.assign(st, { state: 'gone', t: 0, rot: 0, gold: A.gold });
        }
        continue;
      }
      if (st.state === 'gone') {
        st.a = 0;
        st.rot = 0;
        if (st.t > A.down * (easy() ? 0.8 : 1) && g.stage === 2) Object.assign(st, { state: 'rise', t: 0, gold: A.gold });
        continue;
      }
      if (st.state === 'rise') {
        st.a = Math.min(1, st.t / 1.1);
        if (Math.random() < dt * 20) s.fx.part(s.fx.parts, 'dot_1', st.x + (Math.random() - 0.5) * NURI.stretch, st.y + NURI.foot[1], { vx: (Math.random() - 0.5) * 20, vy: -8, life: 0.5, a0: 0.7 }).setTint(0x9a8a6a);
        if (st.t > 1.1) Object.assign(st, { state: 'up', t: 0 });
      }
      // sliding to its side of the corridor (its footing scraping)
      const tx = st.side < 0 ? lx - (st.row ? 6 : 0) : rx + (st.row ? 6 : 0);
      st.x += Phaser.Math.Clamp(tx - st.x, -dt * slide, dt * slide);
      if (st.state === 'up' && g.stage === 2 && g.awake) {
        st.cry -= dt * this.nuHaste(g);
        if (st.cry <= 0) {
          st.cry = A.every * (0.85 + Math.random() * 0.3);
          const [sx, sy] = [st.x, st.y + NURI.slot[1] + 4];
          if (this.canFire({ type: 'boss', seen: g.body.seen, y: sy })) s.bullets.shot('nu_gout_0', sx, sy, Math.atan2(s.player.y - sy, s.player.x - sx), slow * 1.15, 2.2);
        }
      }
    }
    if (g.stage !== 2 && g.stretches.every((st) => st.a <= 0)) g.stretches = [];
  },

  /** A cornerstone shot through: its stretch crumbles into clods, and the core's face lies bare for a while. */
  nuCrumble(g, st) {
    const s = this.scene;
    Object.assign(st, { state: 'gone', t: 0, rot: 0, wob: 0 });
    g.open = NURIKABE.alley.open * (easy() ? 1.3 : 1);
    g.look = 'half';
    g.blink = g.open;
    s.sfx.earth?.();
    SAY(s, st.x, st.y - 10, 'BORO BORO...', 0.9, 0xe0d0a0);
    for (let i = 0; i < 26; i++) s.fx.part(s.fx.parts, `nu_clod_${i & 3}`, st.x + (Math.random() - 0.5) * NURI.stretch, st.y + (Math.random() - 0.5) * NURI.h * 0.8, { vx: (Math.random() - 0.5) * 70, vy: -20 - Math.random() * 40, g: 160, life: 0.8, a0: 1 });
    s.fx.smoke(st.x, st.y, 3, 6, true);
    if (this.canFire({ type: 'boss', seen: g.body.seen, y: st.y })) s.bullets.ring(st.x, st.y + 10, volley(6), Math.random() * TAU, slow * 0.8);
  },

  // ---------------------------------------------------------------- phase 3: the night
  nuToNight(g) {
    const s = this.scene;
    this.phaseBreak(g, 90, g.y, 3, 'NOC');
    for (const st of g.stretches) if (st.state !== 'gone') Object.assign(st, { state: 'sink', t: 0, wob: 0 });
    Object.assign(g, { act: null, open: 0, y: 140, z: 0, look: 'open', fill: 0, mouth: 0, move: null, song: 's12_boss_night' }); // (its theme falls almost silent)
    g.plan = 0;
    SAY(s, 90, g.y + 46, 'NURI... NURI...', 1.6, 0xb8c8ff);
  },

  /** It slides after the ship, unseen, its eyes flashing (two shots off them each time). */
  nuGlide(g, a, dt) {
    const s = this.scene;
    const N = NURIKABE.night;
    const p = s.player;
    const to = Phaser.Math.Clamp(p.y - 140, 120, nuPlaces(s.H).glide);
    g.y += Phaser.Math.Clamp(to - g.y, -dt * N.follow, dt * N.follow);
    a.next = (a.next ?? 0.4) - dt * this.nuHaste(g);
    if (a.next <= 0) {
      a.next = N.flash;
      g.flash = 0.35;
      if (this.canFire(g.body)) for (const [ex, ey] of NURI.eyes) s.bullets.fan(g.x + ex, g.y + ey, Math.atan2(p.y - g.y - ey, p.x - g.x - ex), 3, 0.35, slow * 1.1);
    }
    if (a.t > N.glide) g.act = null;
  },

  // ---------------------------------------------------------------- telegraphs and drawing
  nuTele(g) {
    const t = this.tele;
    if (g.band && g.state === 'fight') {
      // where it will land: a red band across the field
      g.band.t += g.dt;
      const [y0, y1] = [g.band.y + NURI.ridge[0], g.band.y + NURI.foot[1]];
      t.fillStyle(WARN, 0.08 + 0.06 * Math.sin(g.band.t * 18)).fillRect(0, y0, 180, y1 - y0);
      t.lineStyle(2, WARN, 0.8).lineBetween(0, y0, 180, y0).lineBetween(0, y1, 180, y1);
    }
    if (g.stage === 2 && g.state === 'fight') {
      for (const st of g.stretches) {
        if (st.state !== 'up') continue;
        const [gx, gy] = [st.x + NURI.gold[0], st.y + NURI.gold[1]];
        t.lineStyle(1.5, GOLD, 0.45 + 0.35 * Math.sin(g.t * 9 + st.n)).strokeCircle(gx, gy, 6);
      }
      if (g.open > 0) t.lineStyle(2, SAFE, 0.5 + 0.3 * Math.sin(g.t * 12)).strokeRect(g.x - NURI.core / 2, g.y - NURI.h / 2, NURI.core, NURI.h);
      this.nuMoveTele(g);
    }
  },

  /** Its tricks flagged: where the stretches will shut round the ship, the rows the water will cross, where one falls. */
  nuMoveTele(g) {
    const t = this.tele;
    const m = g.move;
    if (!m) return;
    const A = NURIKABE.alley;
    const pulse = 0.08 + 0.06 * Math.sin(g.t * 18);
    const half = NURI.stretch / 2;
    if (m.kind === 'squeeze' && m.t < m.warn) {
      const [lx, rx] = corridor(g.cx, A.squeeze.gap);
      for (const st of g.stretches) {
        if (st.state !== 'up') continue;
        const x = st.side < 0 ? lx - (st.row ? 6 : 0) : rx + (st.row ? 6 : 0);
        t.fillStyle(WARN, pulse).fillRect(x - half, st.y - NURI.h / 2, half * 2, NURI.h);
        t.lineStyle(2, WARN, 0.8).lineBetween(x - st.side * half, st.y - NURI.h / 2, x - st.side * half, st.y + NURI.h / 2);
      }
      // and the lane the water will come down
      const y0 = g.y + NURI.mouth[1] + 8;
      t.fillStyle(WARN, pulse).fillRect(g.cx - 7, y0, 14, this.scene.H - y0);
      t.lineStyle(1.5, WARN, 0.8).lineBetween(g.cx - 7, y0, g.cx - 7, this.scene.H).lineBetween(g.cx + 7, y0, g.cx + 7, this.scene.H);
    } else if (m.kind === 'cross') {
      for (const r of m.rows) {
        if (m.t > r.at || m.t < r.at - m.warn) continue;
        for (const st of g.stretches) {
          if (st.state !== 'up' || st.row !== r.row) continue;
          // the sweep: from across the alley to down over the field
          const [x, y] = [st.x + NURI.slot[0], st.y + NURI.slot[1] + 2];
          const a1 = DOWN + st.side * A.cross.end;
          t.lineStyle(1.5, WARN, 0.8).lineBetween(x, y, x - st.side * 40, y);
          t.lineStyle(1.5, WARN, 0.8).lineBetween(x, y, x + Math.cos(a1) * 160, y + Math.sin(a1) * 160);
          t.fillStyle(WARN, pulse).slice(x, y, 60, Math.min(st.side < 0 ? 0 : Math.PI, a1), Math.max(st.side < 0 ? 0 : Math.PI, a1), false).fillPath();
        }
      }
    } else if (m.kind === 'topple' && m.st.state === 'topple' && !m.st.rot) {
      const [cx, cy] = tipped(m.st, -m.st.side * Math.PI / 2);
      t.fillStyle(WARN, pulse + 0.04).fillRect(cx - NURI.h / 2, cy - half, NURI.h, half * 2);
      t.lineStyle(2, WARN, 0.8).strokeRect(cx - NURI.h / 2, cy - half, NURI.h, half * 2);
    }
  },

  /** Is the wall lifted enough that its footing shows (mint: it can be hit)? */
  nuLifted(g) {
    return g.state === 'fight' && g.stage !== 2 && g.z > 3;
  },

  nuDraw(g) {
    const L = [];
    const put = (key, frame, x, y, o = {}) => L.push({ key, frame, x, y, o });
    const night = g.dark;
    const y = g.y - g.z;
    const k = Math.floor(g.t * 1.6) & 3;
    const wide = g.stage !== 2;
    // its shadow on the field (all that shows of it at night, with the petals and its eyes)
    if (wide) put('shadow', 'nu_shadow', g.x + 3, g.y + NURI.foot[1] + 5, { a: g.alpha * (0.55 + Math.min(0.35, g.z / 30)), z: -0.05 });
    else put('shadow', 'nu_shadow_m', g.x + 3, g.y + NURI.foot[1] + 5, { a: g.alpha * 0.6, z: -0.05 });
    put('body', wide ? `nu_wall_${k}` : `nu_core_${k & 1}`, g.x, y, { a: g.alpha * (1 - night) });
    if (this.nuLifted(g)) put('foot', 'nu_foot', g.x, y, { a: (0.7 + Math.sin(g.t * 14) * 0.25) * Math.min(1, (g.z - 3) / 3) });
    const eyes = wide ? NURI.eyes : NURI.eyesCore;
    const look = night > 0.5 ? 'glow' : g.look;
    eyes.forEach(([ex, ey], i) => put(`eye${i}`, `nu_eye_${look}_${i ? 'r' : 'l'}`, g.x + ex, y + ey, { a: night > 0.5 ? (g.flash > 0 ? 1 : 0.35 + 0.15 * Math.sin(g.t * 3 + i)) : g.alpha }));
    if (night < 1) put('mouth', `nu_mouth_${g.mouth === 2 ? 2 + (Math.floor(g.t * 10) & 1) : g.mouth}`, g.x + NURI.mouth[0], y + NURI.mouth[1], { oy: MOUTH_O, a: g.alpha * (1 - night) });
    if (night > 0) put('night', 'nu_night', g.x, y, { a: night * (0.2 + 0.8 * g.fill) });
    for (const st of g.stretches) {
      if (st.a <= 0) continue;
      const sink = st.state === 'rise' ? (1 - st.a) * 10 : st.state === 'sink' ? (1 - st.a) * 10 : 0;
      const rot = (st.rot ?? 0) + (st.wob ?? 0);
      if (rot) {
        // tipping over on its inner foot, or lying across the alley
        const [x, y1] = tipped(st, rot);
        put(`st${st.n}`, `nu_stretch_${st.n}`, x, y1 + sink, { a: st.a, z: st.row * 0.01 + 0.02, rot });
        continue;
      }
      put(`stsh${st.n}`, 'nu_shadow_s', st.x + 2, st.y + NURI.foot[1] + 5, { a: st.a * 0.6, z: -0.05 });
      put(`st${st.n}`, `nu_stretch_${st.n}`, st.x, st.y + sink, { a: st.a, z: st.row * 0.01 });
    }
    g.night.setFillStyle(0x0a1030, NURIKABE.night.dark * night);
    this.nuSync(g, L);
  },

  /** Puts each part's sprite where the list says; parts no longer listed go back to the pool. */
  nuSync(g, L) {
    const seen = new Set();
    L.forEach((it, i) => {
      const o = it.o;
      const body = it.key === 'body';
      let sp = body ? g.body : g.sp[it.key];
      if (!sp) sp = g.sp[it.key] = this.segPool.spawn(it.frame, it.x, it.y);
      else if (sp.frame.name !== it.frame && sp.texture.has(it.frame)) sp.setFrame(it.frame);
      const z = BASE + (o.z ?? 0) + i * 0.0002;
      if (sp.depth !== z) sp.setDepth(z);
      const oy = o.oy ?? 0.5;
      if (sp.originY !== oy) sp.setOrigin(0.5, oy);
      if (sp.rotation !== (o.rot ?? 0)) sp.setRotation(o.rot ?? 0);
      sp.setPosition(it.x, it.y).setAlpha(o.a ?? 1).setVisible(true);
      seen.add(it.key);
    });
    for (const k of Object.keys(g.sp)) {
      if (seen.has(k)) continue;
      this.nuKill(g.sp[k]);
      delete g.sp[k];
    }
  },

  nuKill(sp) {
    if (!sp || sp.dead) return;
    sp.setOrigin(0.5, 0.5).setAlpha(1).setRotation(0).clearTint();
    this.segPool.kill(sp);
  },

  // ---------------------------------------------------------------- shots
  /** What it lays open, for the homing orbs (Enemies.nearest): the cornerstones, the bare face, the bared footing. */
  nuMarks(g) {
    if (g.state !== 'fight') return [];
    const out = [];
    if (g.stage === 2) {
      for (const st of g.stretches) if (st.state === 'up' || (st.state === 'topple' && !st.rot)) out.push({ x: st.x + NURI.gold[0], y: st.y + NURI.gold[1] });
      if (g.open > 0) out.push({ x: g.x, y: g.y + 8 });
    } else if (this.nuLifted(g)) out.push({ x: this.scene.player.x, y: g.y - g.z + NURI.foot[1] });
    return out;
  },

  /**
   * A shot reaching it: a stretch's cornerstone (it crumbles), a stretch (stopped), the core's face while bare (mint),
   * the wall's footing while it lifts (mint); anything else of it stops the shot with a spark: DON! (Enemies.bossDeviceHit)
   */
  nuShot(shot) {
    const g = this.bossGroup;
    if (!g || g.kind !== 'nurikabe' || g.defeated || g.state === 'dormant') return false;
    const e = g.body;
    if (e.dead || e.hp <= 0) return false;
    const s = this.scene;
    const r = shot.radius;
    for (const st of g.stretches) {
      const rocking = st.state === 'topple' && !st.rot;
      if (st.state !== 'up' && st.state !== 'rise' && !rocking) continue;
      if (Math.abs(shot.x - st.x) > NURI.stretch / 2 + r || shot.y < st.y - NURI.h / 2 - r || shot.y > st.y + NURI.h / 2 + r) continue;
      if ((st.state === 'up' || rocking) && g.state === 'fight' && Math.hypot(shot.x - (st.x + NURI.gold[0]), shot.y - (st.y + NURI.gold[1])) < 5 + r) {
        st.gold -= shot.damage;
        s.fx.spark(shot.x, shot.y - 2, GOLD);
        if (st.gold <= 0) this.nuCrumble(g, st);
        return true;
      }
      this.nuDon(g, shot);
      return true;
    }
    const w = g.stage === 2 ? NURI.core : NURI.w;
    const y = g.y - g.z;
    if (Math.abs(shot.x - g.x) > w / 2 + r || shot.y < y + NURI.ridge[0] - r || shot.y > y + NURI.foot[1] + r) return false;
    if (g.state === 'fight' && g.stage === 2 && g.open > 0) {
      this.damage(e, shot.damage * NURIKABE.take.face);
      if (Math.random() < 0.5) s.fx.spark(shot.x, shot.y - 2, SAFE);
      return true;
    }
    if (this.nuLifted(g)) {
      this.damage(e, shot.damage * NURIKABE.take.foot);
      if (Math.random() < 0.5) s.fx.spark(shot.x, shot.y - 2, SAFE);
      return true;
    }
    this.nuDon(g, shot);
    return true;
  },

  /** A shot stopped dead by the wall: a spark, a clod of dust, now and then DON! (and at night a glimpse of it). */
  nuDon(g, shot) {
    const s = this.scene;
    if (Math.random() < 0.4) s.fx.spark(shot.x, shot.y - 2, 0xe0d0a0);
    if (g.dark > 0.5) g.fill = Math.min(1, g.fill + 0.004);
    if (s.t > (g.donAt ?? 0)) {
      g.donAt = s.t + 1.2;
      SAY(s, shot.x, shot.y - 8, 'DON!', 0.5, 0xe0d0a0);
    }
    if (s.t > (g.thudAt ?? 0)) {
      g.thudAt = s.t + 0.14;
      s.sfx.don?.();
    }
  },

  /** No hit, nor a bomb, takes it past the next phase's threshold before that phase has begun (Enemies.damage). */
  nuCap(e, amount) {
    const g = e.group;
    if (e.role !== 'body' || g.stage >= 3) return amount;
    return Math.min(amount, Math.max(0, e.hp - (e.maxHp * NURIKABE.phase[g.stage - 1] - 0.5)));
  },

  // ---------------------------------------------------------------- the end
  nuCleanup(g) {
    for (const sp of Object.values(g.sp)) this.nuKill(sp);
    g.sp = {};
    g.stretches = [];
    if (g.night && !g.nightKept) g.night.destroy();
  },

  /** Going down (Enemies.goDown): its parts stay on as they are for the end (nuEnd), and the dark. */
  nuDown(e) {
    const g = e.group;
    const parts = [];
    if (g.sp.foot) this.nuKill(g.sp.foot);
    delete g.sp.foot;
    for (const [k, sp] of Object.entries(g.sp)) parts.push({ k, sp, ox: sp.x - g.x, oy: sp.y - g.y, a0: sp.alpha, eye: k.startsWith('eye'), stretch: k.startsWith('st') });
    g.sp = {};
    g.nightKept = true;
    return { bodyA: e.alpha, parts, x: g.x, y: g.y - g.z, wide: g.stage !== 2, dark: g.dark, night: g.night, next: 0, said: {}, stars: 0 };
  },

  /**
   * The end: the blasts run along it; it sighs, its eyes close, and it settles back into the earthwork (back up to its
   * place in the bank, sinking into it); the dark thins to an evening; a young plum flowers on the ridge, and the first
   * stars come out over the field. Returns true when it is over.
   */
  nuEnd(d, dt) {
    const s = this.scene;
    const fx = s.fx;
    const N = d.nu;
    const b = d.body;
    const t = d.t;
    if (!N.withBody) {
      N.withBody = true;
      N.parts.unshift({ k: 'body', sp: b, ox: 0, oy: 0, a0: N.bodyA });
      b.setAlpha(N.bodyA);
    }
    let [mx, my] = [N.x, N.y];
    if (t < 1.2) {
      mx += Math.round((Math.random() - 0.5) * 3);
      if ((N.next -= dt) <= 0) {
        N.next = 0.12;
        fx.explode(10 + Math.random() * 160, N.y + (Math.random() - 0.5) * 50, 's', null, false);
      }
    }
    if (t >= 1.2 && !N.said.sigh) {
      N.said.sigh = true;
      fx.text(90, N.y + 44, 'FUUUU...', 1.4, 0xe0d0a0);
      s.sfx.earth?.(true);
      s.cameras.main.shake(2400, 0.003);
    }
    // back into the earthwork: up to its place in the bank, sinking into it, the dust settling
    const q = Phaser.Math.Clamp((t - 1.3) / 3.4, 0, 1);
    my = N.y + (HOME - N.y) * ease(q);
    const fade = 1 - ease(Math.max(0, (q - 0.35) / 0.65));
    if (q > 0 && q < 1 && Math.random() < dt * 24) fx.part(fx.parts, 'dot_1', 4 + Math.random() * 172, my + 26, { vx: (Math.random() - 0.5) * 24, vy: -8, life: 0.7, a0: 0.7 }).setTint(0x9a8a6a);
    for (const p of N.parts) {
      if (p.eye && p.sp.texture.has(p.sp.frame.name.replace(/_(open|glare|half|glow)_/, '_shut_'))) p.sp.setFrame(p.sp.frame.name.replace(/_(open|glare|half|glow)_/, '_shut_'));
      const a = p.stretch ? p.a0 * Math.max(0, 1 - t / 1.2) : p.a0 * fade;
      p.sp.setPosition(mx + p.ox, my + p.oy).setAlpha(a);
      if (t < 1.2 && Math.floor(t * 14) % 2 && p.k === 'body') p.sp.setTint(0x605040).setTintMode(Phaser.TintModes.ADD);
      else if (p.sp.isTinted) p.sp.clearTint();
    }
    // the dark thins to an evening
    N.night?.setFillStyle(0x0a1030, NURIKABE.night.dark * Math.max(N.dark * (1 - q), 0.7 * Math.min(1, t / 4)));
    // a young plum flowers on the ridge of the earthwork
    if (t > 4.6 && !N.plum) {
      N.plum = this.segPool.spawn('nu_plum', 120, HOME - 18).setDepth(BASE + 0.1).setAlpha(0);
      fx.text(120, HOME + 8, 'PON!', 0.9, 0xffc8d8);
      for (let i = 0; i < 14; i++) fx.part(fx.parts, `nu_petal_${i & 3}`, 120, HOME - 18, { vx: (Math.random() - 0.5) * 50, vy: -10 - Math.random() * 30, g: 30, drag: 0.8, life: 1.8, a0: 1 });
    }
    if (N.plum) N.plum.setAlpha(Math.min(1, (t - 4.6) / 0.8)).setScale(N.plum.base * (0.6 + 0.4 * ease(Math.min(1, (t - 4.6) / 0.8))));
    // the first stars over the field
    if (t > 5.4 && (N.stars -= dt) <= 0) {
      N.stars = 0.22;
      fx.part(fx.parts, 'dot_1', 8 + Math.random() * 164, 8 + Math.random() * 46, { life: 1.6, a0: 0.9 }).setTint(Math.random() < 0.7 ? 0xfff8e0 : 0xc8d8ff).setBlendMode(Phaser.BlendModes.ADD);
    }
    if (t < NURIKABE.outro) return false;
    for (const p of N.parts) if (p.sp !== b) this.nuKill(p.sp);
    if (N.plum) this.nuKill(N.plum);
    return true;
  },
};
