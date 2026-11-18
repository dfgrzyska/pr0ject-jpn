// Onomichi's boss (docs/plan-onomichi.md, 6.2): FUNA-YUREI, a ghost ship of the old sea lords of the Inland Sea come
// up out of the strait before the station on the night of the fireworks. Methods of Enemies (mixed in like the
// cities'). Its art comes in parts (tools/art/onomichi/funayurei.mjs: frames fy_*) that the game puts together round
// the hull's middle and turns with it: the hull with its house and rigging (three stages of wear), the banners at its
// stern, the great lantern at its bow (the weak point), the arms of the drowned with their ladles along its sides, the
// fire pots, the festival's gold shells, the whirlpool's foam.
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { rules, volley } from '../../difficulty.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * Its life, the phases' thresholds, what a hit on its hull gets through; the lantern laid bare (how long, what a hit on
 * it does); the ladles (their life, how often one is swung at the ship, its splash, the oars' strokes); the fire pots
 * (their flight, the ring they burst into), the conch's rings; the gold shells (how often, their flight, how long the
 * ship is stunned and what a hit does then); the whirl (a turn's time, its spirals, the rows of arms out of the water);
 * how long its end takes.
 */
export const FUNA = {
  hp: 1000,
  phase: [0.66, 0.33],
  armour: 0.4,
  open: { time: 3.6, take: 3 },
  ladle: { hp: 12, take: 0.6, every: 1.15, splash: 3, arc: 0.5, down: 1.4, oars: 4.6, oarN: 7 },
  pot: { fly: 1.0, r: 10, n: 8, count: 3 },
  conch: { rings: 3, n: 18, gap: 0.32 },
  shell: { every: 4.6, fly: 4.4, hp: 3, r: 6 },
  stun: { time: 3.8, take: 3.2 },
  whirl: { turn: 3.4, every: 0.1, open: 2.8, rows: 2, warn: 1.05, live: 0.7, step: 13 },
  outro: 10,
};

// Where its parts sit, logical px from the middle of the hull's frame (tools/art/onomichi/funayurei.mjs: PARTS, a third
// of its fine px; the test onomichiFunayurei checks them), as on its right side (the left mirrored): the lantern, the
// banners' poles, the hatch, the conch, the burning sail, the rings where the arms come up, the oars' blades; the hull's
// half width, its stern and its bow; an arm's ladle in its frame (ARM: the bowl when held and when swung).
export const FY = {
  lantern: [0, 56],
  banner: [29.33, -70],
  hatch: [0, -37.33],
  conch: [13.33, -49.33],
  sail: [-3.33, 12.67],
  arms: [[44.67, -41.33], [44.67, -16], [44.67, 9.33], [44.38, 34.67]],
  oars: [-41.67, -34.33, -27, -19.67, -12.33, -5, 2.33, 9.67, 17, 24.33, 31.67, 39, 46.33],
  half: 33.33,
  stern: -72,
  bow: 73.33,
  bowl: { hold: [7, -13.33], throw: [9, -2.67] },
};
// the points the small frames turn on (ARM_FRAME, LANTERN_FRAME, BANNER_FRAME in the art)
const ORIGIN = { arm: [16 / 60, 54 / 76], lantern: [0.5, 18 / 44], banner: [0.5, 68 / 72] };

const SAFE = 0x81f3cc;
const GOLD = 0xffd06a;
const WARN = 0xff735e;
const GLOW = 0x5ae6d4;
const BASE = DEPTH.air - 0.16; // its parts, back to front from here
const HOME = [62, 96]; // (the hull's middle on the screen: the strait before the station, clear of the quay)
const STOP = -1; // (where the whirl leaves it: broadside, its bow to the lower right)
const SAY = (s, x, y, t, life = 0.8, c = 0xffffff) => s.fx.text(x, y, t, life, c);
const ease = (q) => q * q * (3 - 2 * q);
// a little splash on the dark water: drops thrown up round (x, y) (the shared white puff is too stark at night)
const SPLASH = (s, x, y, n = 5, v = 30) => {
  for (let i = 0; i < n; i++) s.fx.part(s.fx.parts, i % 3 ? 'dot_1' : 'dot_2', x + (Math.random() - 0.5) * 6, y, { vx: (Math.random() - 0.5) * v * 2, vy: -v * (0.4 + Math.random() * 0.6), g: 140, life: 0.45, a0: 0.8 }).setTint(i % 2 ? 0xbfe8ff : 0x7ac8d8);
};

export const onomichiFunayurei = {
  /**
   * A ghost ship of the old sea lords risen out of the strait: a sekibune seen from above, its bow to the ship, its
   * wood gone green with age and a cold sea-green light along its seams, the great lantern at its bow. Three phases:
   * 1. CZERPAKI: the arms of the drowned rise along its sides, each with a ladle, and fling water at the ship; the oars
   *    beat the water in rows of drops. A ladle's rim is gold: shot through, its bottom goes (a ladle without a bottom
   *    can't fill a boat) and it pours away harmless; with every ladle on a side holed the lantern lies bare (mint);
   * 2. OGNIE: the house's hatch thrown open, it throws fire pots that burst into rings of flame where they land, and
   *    blows the conch in rings of shots. The festival's gold shells fly over it: shot, one bursts over the ship and
   *    stuns it, the lantern bare;
   * 3. WIR: its mast snapped and its sail burning, it turns in a whirlpool of its own making, shots streaming off it in
   *    spirals, rows of arms reaching up out of the water along lines warned beforehand; after each turn it lies
   *    broadside and the lantern is bare.
   * Beaten, its lantern goes out, it sinks, the arms let go of their ladles, little lights rise from the water and one
   * last great firework opens over the strait.
   */
  spawnFuna(w, base) {
    const g = {
      dt: 0,
      kind: 'funayurei', state: 'dormant', stage: 1, t: 0, parts: [], awake: false, defeated: false, act: null, timer: 1, plan: 0,
      outro: FUNA.outro, x: HOME[0], y: HOME[1], rot: 0, bob: 0, alpha: 0, rise: 0, wear: 0, sp: {}, arms: [], throwT: 1.5, oarT: 3,
      pots: [], shells: [], shellT: 2.5, hands: [], bits: [], foam: 0, spin: 0, open: 0, stun: 0, said: {}, lamp: 0,
    };
    for (const side of [-1, 1]) for (let row = 0; row < 4; row++) g.arms.push({ side, row, state: 'down', t: 0.3 + row * 0.25 + (side > 0 ? 0.12 : 0), hp: FUNA.ladle.hp, a: 0 });
    const body = this.pool.spawn('fy_hull_0', g.x, g.y, { ...base, role: 'body', group: g, hp: FUNA.hp, maxHp: FUNA.hp, radius: 30, pass: true, harmless: true, flashTint: 0x404040 });
    body.setAlpha(0);
    g.body = body;
    g.parts.push(body);
    g.maxTotal = FUNA.hp;
    this.bossGroup = g;
    this.fyDraw(g);
    return body;
  },

  /** A point of the ship (logical px from the hull's middle, on its right side if `side` is 1, -1 its left) on the screen. */
  fyAt(g, [dx, dy], side = 1) {
    const [c, s] = [Math.cos(g.rot), Math.sin(g.rot)];
    const x = dx * side;
    return [g.x + x * c - dy * s, g.y + g.bob + x * s + dy * c];
  },

  updateFuna(g, dt) {
    const s = this.scene;
    g.t += dt;
    g.dt = dt;
    if (g.state === 'dormant') return this.fyDormant(g, dt);
    if (g.state === 'rise') this.fyRise(g, dt);
    else this.fyFight(g, dt);
    // it rocks on the swell (still while it turns)
    if (g.stage < 3) g.rot = Math.sin(g.t * 0.9) * 0.022 + (g.stun > 0 ? Math.sin(g.t * 9) * 0.03 * Math.min(1, g.stun) : 0);
    g.bob = Math.sin(g.t * 1.3) > 0.4 ? 1 : 0;
    g.stun = Math.max(0, g.stun - dt);
    g.open = Math.max(0, g.open - dt);
    this.fyArms(g, dt);
    this.fyPots(g, dt);
    this.fyShells(g, dt);
    this.fyHands(g, dt);
    this.fyBits(g, dt);
    this.fyTele(g);
    this.fyDraw(g);
    g.body.x = g.x;
    g.body.y = g.y + g.bob;
    // the sea laps at its sides, wisps drift up off its deck
    if (g.alpha > 0.5 && Math.random() < dt * 4) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const [x, y] = this.fyAt(g, [FY.half + 2, -60 + Math.random() * 110], side);
      s.fx.part(s.fx.parts, 'dot_1', x, y, { vx: side * 8, vy: 4, life: 0.5, a0: 0.6 }).setTint(0xbfe8ff);
    }
    if (g.alpha > 0.5 && Math.random() < dt * 2.5) {
      const [x, y] = this.fyAt(g, [(Math.random() - 0.5) * 50, -50 + Math.random() * 100]);
      s.fx.part(s.fx.parts, 'dot_1', x, y, { vx: (Math.random() - 0.5) * 6, vy: -10, life: 1.1, a0: 0.8 }).setTint(GLOW).setBlendMode(Phaser.BlendModes.ADD);
    }
  },

  // ---------------------------------------------------------------- rising out of the strait
  /** Wisps gather on the water where it will come up, until the town has come to its end (the scroll stops). */
  fyDormant(g, dt) {
    const s = this.scene;
    if (Math.random() < dt * 8) {
      const a = Math.random() * TAU;
      const r = 30 + Math.random() * 40;
      s.fx.part(s.fx.parts, 'dot_1', g.x + Math.cos(a) * r * 0.6, g.y + Math.sin(a) * r, { vx: -Math.cos(a) * 14, vy: -Math.sin(a) * 20, life: 0.9, a0: 0.7 }).setTint(GLOW).setBlendMode(Phaser.BlendModes.ADD);
    }
    if (s.parallax.time < s.parallax.maxTime - 1e-3) return;
    Object.assign(g, { state: 'rise', rise: 0 });
    // the water heaves: whatever is left of the waves goes under
    for (const o of this.pool.live) if (!o.dead && o.group !== g && o.def.weight > 0) this.destroy(o);
    s.bullets.cancelAll(s.fx);
    s.cameras.main.shake(2400, 0.003);
    SAY(s, g.x, g.y + 40, 'ZAZAZAZA...', 1.4, 0xbfe8ff);
  },

  /** It comes up out of the strait, the sea pouring off it, and the drowned ask for a ladle. */
  fyRise(g, dt) {
    const s = this.scene;
    const was = g.rise;
    g.rise = Math.min(1, g.rise + dt / 3.2);
    g.alpha = ease(g.rise);
    if (Math.random() < dt * 26) {
      // the sea pouring off its sides
      const side = Math.random() < 0.5 ? -1 : 1;
      const [x, y] = this.fyAt(g, [FY.half, FY.stern + Math.random() * (FY.bow - FY.stern)], side);
      s.fx.part(s.fx.parts, 'drop_0', x, y, { vx: side * (20 + Math.random() * 30), vy: (Math.random() - 0.5) * 20, g: 0, drag: 2, life: 0.5 }).setTint(0xd8f0ff);
      if (Math.random() < 0.3) SPLASH(s, x + side * 4, y, 3);
    }
    if (was < 0.4 && g.rise >= 0.4) {
      SAY(s, g.x, g.y + 78, 'HISHAKU O KASE...', 1.8, 0xc0fff0);
      s.sfx.explode('m');
    }
    if (g.rise >= 1) Object.assign(g, { state: 'fight', awake: true, timer: 1, act: null });
  },

  // ---------------------------------------------------------------- the fight
  fyFight(g, dt) {
    const e = g.body;
    const frac = e.hp / e.maxHp;
    if (g.stage === 1 && frac < FUNA.phase[0]) return this.fyToFire(g);
    if (g.stage === 2 && !g.act && g.stun <= 0 && frac < FUNA.phase[1]) return this.fyToWhirl(g);
    if (g.stage === 1) return this.fyLadles(g, dt);
    if (g.stun > 0) return; // (stunned by a firework: nothing from it)
    if (g.act) return this.fyAct(g, dt);
    if ((g.timer -= dt) > 0 || !this.canFire(e)) return;
    const P = g.stage === 2 ? ['pots', 'conch', 'pots', 'pots', 'conch'] : ['spin', 'rest', 'hands'];
    g.act = { kind: P[g.plan++ % P.length], t: 0, done: {} };
  },

  fyDone(g, rest) {
    g.act = null;
    g.timer = rest;
  },

  fyAct(g, dt) {
    const a = g.act;
    a.t += dt;
    a.dt = dt;
    const once = (k, at) => (a.t >= at && !a.done[k] ? (a.done[k] = true) : false);
    if (a.kind === 'drift') this.fyDrift(g, a);
    else if (a.kind === 'pots') this.fyThrowPots(g, a, once);
    else if (a.kind === 'conch') this.fyConch(g, a, once);
    else if (a.kind === 'spin') this.fySpin(g, a, once);
    else if (a.kind === 'rest') this.fyRest(g, a, once);
    else if (a.kind === 'hands') this.fyRows(g, a, once);
  },

  /** How much quicker it goes, the less life it has (1 .. 1.3). */
  fyHaste(g) {
    return 1 + 0.3 * (1 - Math.max(0, g.body.hp / g.body.maxHp));
  },

  // ---------------------------------------------------------------- phase 1: the ladles
  /** The arms with full ladles fling water at the ship one after another; the oars beat the water now and then. */
  fyLadles(g, dt) {
    const s = this.scene;
    const L = FUNA.ladle;
    if ((g.throwT -= dt * this.fyHaste(g)) <= 0) {
      g.throwT = L.every * (0.8 + Math.random() * 0.4);
      const ready = g.arms.filter((A) => A.state === 'hold' && A.hp > 0);
      if (ready.length && this.canFire(g.body)) {
        const A = ready[Math.floor(Math.random() * ready.length)];
        Object.assign(A, { state: 'throw', t: 0, fired: false });
      }
    }
    if ((g.oarT -= dt) <= 0) {
      g.oarT = L.oars;
      if (this.canFire(g.body)) {
        // the oars dig in all along both sides: drops thrown out from their blades
        const n = volley(L.oarN);
        for (const side of [-1, 1])
          for (let i = 0; i < n; i++) {
            const k = Math.round((i / Math.max(1, n - 1)) * (FY.oars.length - 1));
            const [x, y] = this.fyAt(g, [FY.half + 16, FY.oars[k]], side);
            s.bullets.shot('eb_pearl', x, y, DOWN - side * 0.45, slow * 0.85, 2);
            if (i % 2 === 0) SPLASH(s, x, y, 3, 20);
          }
        SAY(s, g.x, g.y + 84, 'ZAPPAN!', 0.7, 0xbfe8ff);
        s.sfx.oar?.();
      }
    }
    // a side whose every ladle is holed lays the lantern bare; then its arms go under and come up with new ladles
    for (const side of [-1, 1]) {
      const own = g.arms.filter((A) => A.side === side);
      if (own.every((A) => A.hp <= 0 && (A.state === 'hold' || A.state === 'throw')) && g.open <= 0 && !g.said[`side${side}`]) {
        g.said[`side${side}`] = true;
        g.open = FUNA.open.time;
        if ((g.said.open = (g.said.open ?? 0) + 1) <= 2) SAY(s, g.x, g.y + 88, 'LATARNIA ODSŁONIĘTA!', 1.3, SAFE);
        SAY(s, ...this.fyAt(g, [FY.half + 14, 0], side), 'NUKETA...', 1, 0xc0fff0);
        for (const A of own) A.after = FUNA.open.time;
      }
    }
  },

  /** Each arm: under the water, rising, holding its ladle, swinging it, holed; going under. */
  fyArms(g, dt) {
    const s = this.scene;
    const L = FUNA.ladle;
    for (const A of g.arms) {
      A.t -= dt;
      if (A.after != null && (A.after -= dt) <= 0) {
        A.after = null;
        Object.assign(A, { state: 'sink', t: 0.45 });
      }
      if (A.state === 'down') {
        A.a = 0;
        if (A.t <= 0 && g.stage === 1 && g.state === 'fight') Object.assign(A, { state: 'rise', t: 0.55, hp: L.hp });
      } else if (A.state === 'rise') {
        A.a = Math.min(1, A.a + dt / 0.4);
        if (A.t <= 0) {
          Object.assign(A, { state: 'hold', t: 0 });
          const [x, y] = this.fyAt(g, FY.arms[A.row], A.side);
          SPLASH(s, x, y, 6);
          if (g.said[`side${A.side}`] && g.arms.filter((B) => B.side === A.side).every((B) => B.state === 'hold')) g.said[`side${A.side}`] = false;
        }
      } else if (A.state === 'throw') {
        A.t += 2 * dt; // (counts up)
        if (A.t > 0.18 && !A.fired) {
          A.fired = true;
          this.fySplash(g, A);
        }
        if (A.t > 0.55) Object.assign(A, { state: 'hold', t: 0 });
      } else if (A.state === 'sink') {
        A.a = Math.max(0, A.t / 0.45);
        if (A.t <= 0) {
          Object.assign(A, { state: 'down', t: L.down + Math.random() * 0.4 });
          if (A.hp <= 0) {
            // the holed ladle let go of, left floating
            const [x, y] = this.fyBowl(g, A);
            this.fyBit(g, 'fy_ladle', x, y, { vx: A.side * 6, vy: 3, vr: A.side * 0.4, life: 3.2, flip: A.side < 0 });
          }
        }
      }
      // a holed ladle pours away through itself
      if (A.hp <= 0 && (A.state === 'hold' || A.state === 'throw') && Math.random() < dt * 6) {
        const [x, y] = this.fyBowl(g, A);
        s.fx.part(s.fx.parts, 'drop_0', x, y + 2, { vy: 26, g: 120, life: 0.35 }).setTint(0x9ad8ff);
      }
    }
  },

  /** The bowl of an arm's ladle on the screen (where it is shot through). */
  fyBowl(g, A) {
    const [rx, ry] = FY.arms[A.row];
    const [bx, by] = FY.bowl[A.state === 'throw' ? 'throw' : 'hold'];
    return this.fyAt(g, [rx + bx, ry + by], A.side);
  },

  /** A ladle flung at the ship: a splash of water, a few drops spread. */
  fySplash(g, A) {
    const s = this.scene;
    if (!this.canFire(g.body) || A.hp <= 0) return;
    const L = FUNA.ladle;
    const [x, y] = this.fyBowl(g, A);
    const ang = Math.atan2(s.player.y - y, s.player.x - x);
    const n = volley(L.splash);
    for (let i = 0; i < n; i++) s.bullets.shot('eb_bubble_0', x, y, ang + (n > 1 ? (i / (n - 1) - 0.5) * L.arc : 0), normal * (0.85 + (i % 2) * 0.15), 2.2, { grow: { r0: 2, r1: 3, t: 0.5, drag: 0, frames: ['eb_bubble_0', 'eb_bubble_1'] } });
    for (let i = 0; i < 6; i++) s.fx.part(s.fx.parts, 'drop_0', x, y, { vx: Math.cos(ang) * 70 + (Math.random() - 0.5) * 50, vy: Math.sin(ang) * 70, g: 120, life: 0.4 }).setTint(0xbfe8ff);
    if (Math.random() < 0.35) SAY(s, x, y - 8, 'ZABA!', 0.6, 0xbfe8ff);
    s.sfx.splash?.();
  },

  /** A ladle shot: its bottom knocked out at the last hit. */
  fyLadleHit(g, A, dmg) {
    const s = this.scene;
    A.hp -= dmg;
    this.damage(g.body, dmg * FUNA.ladle.take); // (the drowned's grip is the ship's own: a share of it hurts it)
    const [x, y] = this.fyBowl(g, A);
    if (Math.random() < 0.4) s.fx.spark(x, y, GOLD);
    if (A.hp > 0) return;
    SAY(s, x, y - 10, 'SUPON!', 0.7, GOLD);
    for (let i = 0; i < 6; i++) s.fx.part(s.fx.parts, 'dot_1', x, y, { vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, g: 80, life: 0.4 }).setTint(0x9a7a52);
    s.score.add(200 * s.score.mult);
    s.sfx.rope?.();
  },

  // ---------------------------------------------------------------- phase 2: fire
  fyToFire(g) {
    const s = this.scene;
    this.phaseBreak(g, g.x, g.y, 2, 'OGNISTE GARNKI');
    g.wear = 1;
    g.timer = 1.6;
    g.plan = 0;
    g.shellT = 2.2;
    g.open = 0;
    // the arms let go of their ladles and go under
    for (const A of g.arms) {
      if (A.state !== 'down') {
        const [x, y] = this.fyBowl(g, A);
        this.fyBit(g, 'fy_ladle', x, y, { vx: A.side * 8, vy: 4, vr: A.side * 0.5, life: 3, flip: A.side < 0 });
      }
      Object.assign(A, { state: 'sink', t: 0.45, after: null });
    }
    // the hatch thrown open on the fire inside
    const [hx, hy] = this.fyAt(g, FY.hatch);
    for (let i = 0; i < 10; i++) s.fx.part(s.fx.parts, 'dot_1', hx, hy, { vx: (Math.random() - 0.5) * 70, vy: -20 - Math.random() * 40, g: 60, life: 0.7 }).setTint(i % 2 ? 0xffa040 : 0xffe08a);
    SAY(s, hx, hy - 12, 'GOOO!', 1, 0xffa040);
  },

  /** Fire pots thrown from the house in arcs at the ship: a ring of fire warns where each lands. */
  fyThrowPots(g, a, once) {
    const P = FUNA.pot;
    const n = rules().volley < 1 ? P.count - 1 : P.count;
    for (let i = 0; i < n; i++) if (once(`p${i}`, 0.15 + i * 0.32)) this.fyPot(g, i === 0 ? 0 : (i % 2 ? -1 : 1) * (22 + Math.random() * 16));
    if (a.t > 0.15 + n * 0.32 + 0.8) this.fyDone(g, 0.9 / this.fyHaste(g));
  },

  fyPot(g, off) {
    const s = this.scene;
    if (!this.canFire(g.body) || s.bombClear > 0) return;
    const P = FUNA.pot;
    const p = s.player;
    const [hx, hy] = this.fyAt(g, FY.hatch);
    const tx = Phaser.Math.Clamp(p.x + off + (Math.random() - 0.5) * 16, 12, VIEW.width - 12);
    const ty = Phaser.Math.Clamp(p.y - 6 - Math.random() * 24, g.y + 90, s.H - 20);
    s.bullets.zone(tx, ty, P.r, { warn: P.fly, live: 0.35, kind: 'fire' });
    const sp = this.segPool.spawn('fy_pot_0', hx, hy).setDepth(DEPTH.air - 0.06);
    g.pots.push({ sp, x0: hx, y0: hy, tx, ty, t: 0, spin: (Math.random() < 0.5 ? -1 : 1) * 7 });
    s.fx.part(s.fx.parts, 'dot_1', hx, hy, { vy: -20, life: 0.3 }).setTint(0xffa040);
  },

  fyPots(g, dt) {
    const s = this.scene;
    const P = FUNA.pot;
    for (const k of g.pots) {
      k.t += dt;
      const q = Math.min(1, k.t / P.fly);
      const lift = Math.sin(q * Math.PI);
      k.sp.setPosition(k.x0 + (k.tx - k.x0) * q, k.y0 + (k.ty - k.y0) * q - lift * 40).setFrame(`fy_pot_${Math.floor(k.t * 10) % 2}`).setScale(k.sp.base * (1 + lift * 0.5));
      k.sp.rotation += k.spin * dt;
      if (Math.random() < dt * 20) s.fx.part(s.fx.parts, 'dot_1', k.sp.x, k.sp.y - 3, { vx: (Math.random() - 0.5) * 10, vy: -8, life: 0.25 }).setTint(Math.random() < 0.5 ? 0xffa040 : 0xffe08a);
      if (q < 1) continue;
      // it bursts on the water into a ring of flame
      k.gone = true;
      k.sp.setRotation(0);
      this.segPool.kill(k.sp);
      SAY(s, k.tx, k.ty - 14, 'BAAN!', 0.6, 0xffa040);
      s.sfx.crock?.();
      s.sfx.explode('s');
      s.fx.light(k.tx, k.ty, 1, false, 0xff8a3a);
      for (let i = 0; i < 8; i++) s.fx.part(s.fx.parts, 'dot_1', k.tx, k.ty, { vx: (Math.random() - 0.5) * 90, vy: -30 - Math.random() * 40, g: 160, life: 0.5 }).setTint(i % 2 ? 0x86583a : 0xffa040);
      if (g.state === 'fight' && !g.defeated && s.bombClear <= 0) {
        const n = volley(P.n);
        const off = Math.random() * TAU;
        for (let i = 0; i < n; i++) s.bullets.shot('eb_lava', k.tx, k.ty, off + (i / n) * TAU, slow * 0.9, 2);
      }
    }
    g.pots = g.pots.filter((k) => !k.gone);
  },

  /** The conch blown on the house's roof: rings of shots go out over the water, each turned a little from the last. */
  fyConch(g, a, once) {
    const s = this.scene;
    const C = FUNA.conch;
    const [cx, cy] = this.fyAt(g, FY.conch);
    if (once('blow', 0)) {
      SAY(s, cx, cy - 10, 'BUOOOO~', 1.4, 0xfff4ea);
      s.sfx.conch?.();
    }
    if (a.t < C.rings * C.gap + 0.2 && Math.random() < 0.5) s.fx.part(s.fx.parts, 'dot_1', cx, cy, { vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, life: 0.4 }).setTint(0xfff4ea);
    for (let r = 0; r < C.rings; r++) {
      if (!once(`r${r}`, 0.25 + r * C.gap) || !this.canFire(g.body)) continue;
      const n = volley(C.n);
      const off = (r % 2) * (Math.PI / n);
      s.fx.shockwave(cx, cy, 0xfff4ea);
      for (let i = 0; i < n; i++) {
        const ang = off + (i / n) * TAU;
        if (Math.sin(ang) < -0.3) continue; // (out over the water ahead of it, none back over its stern)
        s.bullets.shot('eb_m', cx, cy, ang, slow * (1 + r * 0.1), 2.5);
      }
    }
    if (a.t > 0.25 + C.rings * C.gap + 0.4) this.fyDone(g, 1.1 / this.fyHaste(g));
  },

  /** The festival's gold shells: one now and then flies over the ship from a barge; shot, it bursts over it. */
  fyShells(g, dt) {
    const s = this.scene;
    const S = FUNA.shell;
    if (g.stage === 2 && g.state === 'fight' && g.stun <= 0 && !g.shells.length && (g.shellT -= dt) <= 0) {
      g.shellT = S.every;
      const dir = Math.random() < 0.5 ? 1 : -1;
      const [x0, x1] = dir > 0 ? [-8, VIEW.width + 8] : [VIEW.width + 8, -8];
      const sp = this.segPool.spawn('fy_shell_0', x0, g.y + 70).setDepth(DEPTH.air + 0.05);
      g.shells.push({ sp, x0, x1, y0: g.y + 74, y1: g.y - 30, t: 0, hp: S.hp });
      SAY(s, dir > 0 ? 24 : VIEW.width - 24, g.y + 92, 'HYURURU...', 1, GOLD);
      s.sfx.hanabi?.();
    }
    for (const sh of g.shells) {
      sh.t += dt;
      const q = sh.t / S.fly;
      // across the strait over the ship, rising
      const x = sh.x0 + (sh.x1 - sh.x0) * q;
      const y = sh.y0 + (sh.y1 - sh.y0) * q - Math.sin(q * Math.PI) * 26;
      sh.sp.setPosition(x, y).setFrame(`fy_shell_${Math.floor(sh.t * 12) % 2}`);
      if (Math.random() < dt * 30) s.fx.part(s.fx.parts, 'dot_1', x, y, { vx: (Math.random() - 0.5) * 8, vy: 6, life: 0.35, a0: 0.9 }).setTint(Math.random() < 0.5 ? GOLD : 0xffffff);
      if (q >= 1 || g.stage !== 2 || g.state !== 'fight') {
        // flown on unshot: it bursts high over the town, harmless
        this.fyBurst(x, Math.min(y, 20), [GOLD, 0xffffff], 0.6);
        sh.gone = true;
      }
    }
    for (const sh of g.shells) if (sh.gone) this.segPool.kill(sh.sp);
    g.shells = g.shells.filter((sh) => !sh.gone);
  },

  /** A gold shell shot through: it bursts over the ship, the ship reels, stunned, its lantern bare. */
  fyShellHit(g, sh, dmg) {
    const s = this.scene;
    sh.hp -= dmg;
    if (Math.random() < 0.5) s.fx.spark(sh.sp.x, sh.sp.y, GOLD);
    if (sh.hp > 0) return;
    sh.gone = true;
    this.fyBurst(sh.sp.x, sh.sp.y, [GOLD, 0xffe8a0, 0xffffff], 1.4);
    SAY(s, sh.sp.x, sh.sp.y - 16, 'TAMAYA~!', 1.4, GOLD);
    s.cameras.main.shake(400, 0.008);
    g.stun = FUNA.stun.time;
    g.act = null;
    g.timer = 0.6;
    if ((g.said.stun = (g.said.stun ?? 0) + 1) <= 2) SAY(s, g.x, g.y + 88, 'LATARNIA ODSŁONIĘTA!', 1.3, SAFE);
    s.score.add(1000 * s.score.mult);
    // sparks rain down over its deck
    for (let i = 0; i < 24; i++) {
      const [x, y] = this.fyAt(g, [(Math.random() - 0.5) * 60, -60 + Math.random() * 110]);
      s.fx.part(s.fx.parts, 'dot_1', x, y - 30, { vx: (Math.random() - 0.5) * 20, vy: 30 + Math.random() * 30, g: 40, life: 0.9 }).setTint(GOLD).setBlendMode(Phaser.BlendModes.ADD);
    }
  },

  /** A firework opening at (x, y): a ring of sparks, an inner one, a light. */
  fyBurst(x, y, cols, size = 1) {
    const s = this.scene;
    const fx = s.fx;
    // (rings of stars, each a little slower than the last and of its own colour; a white heart; a flash of light)
    const n = Math.round(30 * Math.sqrt(size));
    for (const [k, sp] of [[0, 1], [1, 0.72], [2, 0.45]]) {
      for (let i = 0; i < n; i++) {
        const an = (i / n) * TAU + k * 0.11;
        const v = (44 + Math.random() * 8) * sp * Math.sqrt(size) * 1.2;
        fx.part(fx.parts, 'dot_2', x, y, { vx: Math.cos(an) * v, vy: Math.sin(an) * v, g: 22, drag: 1.0, life: 1.1 + k * 0.1, a0: 1 }).setTint(cols[(i + k) % cols.length]).setBlendMode(Phaser.BlendModes.ADD);
      }
    }
    for (let i = 0; i < n / 2; i++) {
      const an = (i / (n / 2)) * TAU + 0.1;
      fx.part(fx.parts, 'dot_1', x, y, { vx: Math.cos(an) * 14 * size, vy: Math.sin(an) * 14 * size, g: 20, drag: 1.1, life: 0.8 }).setTint(0xffffff).setBlendMode(Phaser.BlendModes.ADD);
    }
    fx.light(x, y, Math.min(1.4, 0.7 * size), false, cols[0]);
    s.sfx.hanabi?.(true);
    if (size > 1) s.sfx.explode('m');
  },

  // ---------------------------------------------------------------- phase 3: the whirl
  fyToWhirl(g) {
    const s = this.scene;
    this.phaseBreak(g, g.x, g.y, 3, 'WIR');
    g.wear = 2;
    g.timer = 2;
    g.plan = 0;
    g.act = { kind: 'drift', t: 0, done: {}, x0: g.x, r0: g.rot };
    for (const sh of g.shells) sh.gone = true;
    // the mast snaps, the sail comes down on the deck burning
    const [mx, my] = this.fyAt(g, [0, -0.67]);
    for (let i = 0; i < 12; i++) s.fx.part(s.fx.parts, 'dot_1', mx + (Math.random() - 0.5) * 60, my, { vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 60, g: 60, life: 0.6 }).setTint(0x9a7a52);
    SAY(s, mx, my - 16, 'BAKIII!', 1, 0xd8c8b0);
    s.cameras.main.shake(500, 0.01);
  },

  /** Into the whirl: it drifts out a little from the quay as it turns broadside, the foam gathering round it. */
  fyDrift(g, a) {
    const q = ease(Math.min(1, a.t / 1.6));
    g.x = a.x0 + (HOME[0] - 14 - a.x0) * q;
    g.rot = a.r0 + (STOP - a.r0) * q;
    if (a.t > 1.6) this.fyDone(g, 0.8);
  },

  /** A whole turn in the whirl, shots streaming off both its sides in spirals; it comes round broadside again. */
  fySpin(g, a, once) {
    const s = this.scene;
    const W = FUNA.whirl;
    const T = W.turn / this.fyHaste(g);
    if (once('go', 0)) {
      SAY(s, g.x, g.y + 84, 'GURUGURU...', 1, 0xbfe8ff);
      a.next = 0.3;
    }
    const q = Math.min(1, a.t / T);
    g.rot = STOP - TAU * ease(q);
    g.spin = 1 - Math.abs(1 - 2 * q); // (the foam turns faster at the turn's height)
    if (q > 0.08 && q < 0.92 && (a.next -= a.dt) <= 0 && this.canFire(g.body)) {
      a.next = W.every / Math.max(0.5, volley(10) / 10);
      for (const side of [-1, 1]) {
        const [x, y] = this.fyAt(g, [FY.half + 4, 6], side);
        const ang = g.rot + (side > 0 ? 0 : Math.PI);
        s.bullets.shot('eb_pearl', x, y, ang, slow * 1.05, 2);
      }
    }
    if (q >= 1) {
      g.rot = STOP;
      g.spin = 0;
      this.fyDone(g, 0);
    }
  },

  /** Broadside, spent, rocking: the lantern bare. */
  fyRest(g, a, once) {
    const s = this.scene;
    if (once('open', 0)) {
      g.open = FUNA.whirl.open;
      if ((g.said.whirl = (g.said.whirl ?? 0) + 1) <= 2) SAY(s, g.x + 20, g.y + 70, 'LATARNIA ODSŁONIĘTA!', 1.3, SAFE);
    }
    g.rot = STOP + Math.sin(a.t * 6) * 0.04 * Math.max(0, 1 - a.t / 1.5);
    if (a.t > FUNA.whirl.open) this.fyDone(g, 0.3);
  },

  /** Lines warned across the water; then along each a row of arms reaches up out of it. */
  fyRows(g, a, once) {
    const s = this.scene;
    const W = FUNA.whirl;
    const rows = rules().volley < 1 ? 1 : W.rows;
    if (once('warn', 0)) {
      SAY(s, g.x, g.y + 84, 'OIDE... OIDE...', 1.2, 0xc0fff0);
      const p = s.player;
      a.lines = [];
      for (let r = 0; r < rows; r++) {
        // from the whirl's edge out across the water, one near the ship and one cutting across its way
        const ang = r === 0 ? Math.atan2(p.y - g.y, p.x - g.x) + (Math.random() - 0.5) * 0.3 : DOWN + (p.x < g.x + 20 ? -0.9 : 0.9);
        const [x0, y0] = [g.x + Math.cos(ang) * 50, g.y + Math.sin(ang) * 50];
        a.lines.push([x0, y0, ang]);
        for (let d = 0; ; d += W.step) {
          const [x, y] = [x0 + Math.cos(ang) * d, y0 + Math.sin(ang) * d];
          if (x < 4 || x > VIEW.width - 4 || y > s.H - 4) break;
          const warn = s.bullets.zone(x, y, 6, { warn: W.warn + d * 0.004, live: W.live, kind: 'ghost' });
          if (s.bombClear <= 0) g.hands.push({ x, y, t: -warn, flip: Math.random() < 0.5 });
        }
      }
    }
    if (a.t > W.warn * rules().warn + 1.2) this.fyDone(g, 0.4);
  },

  /** The arms out of the water along a warned line: up, reaching, and under again. */
  fyHands(g, dt) {
    const s = this.scene;
    const live = FUNA.whirl.live;
    for (const h of g.hands) {
      h.t += dt;
      if (h.t < 0) continue;
      if (!h.sp) {
        h.sp = this.segPool.spawn('fy_arm_rise', h.x, h.y).setDepth(DEPTH.enemyBullet - 0.05).setOrigin(...ORIGIN.arm).setFlipX(h.flip);
        SPLASH(s, h.x, h.y, 5);
      }
      h.sp.setAlpha(Math.min(1, h.t / 0.12, (live + 0.2 - h.t) / 0.25));
      if (h.t > live + 0.2) h.gone = true;
    }
    for (const h of g.hands) if (h.gone && h.sp) this.fyKill(h.sp);
    g.hands = g.hands.filter((h) => !h.gone);
  },

  // ---------------------------------------------------------------- what falls off it
  fyBit(g, frame, x, y, o = {}) {
    const sp = this.segPool.spawn(frame, x, y).setDepth(BASE - 0.02).setFlipX(!!o.flip);
    g.bits.push({ sp, vx: o.vx ?? 0, vy: o.vy ?? 0, vr: o.vr ?? 0, t: 0, life: o.life ?? 2.5 });
  },

  /** Ladles let go of, floating off on the current and going under. */
  fyBits(g, dt) {
    for (const b of g.bits) {
      b.t += dt;
      b.vx *= 1 - dt * 0.6;
      b.vy *= 1 - dt * 0.6;
      b.sp.x += b.vx * dt;
      b.sp.y += b.vy * dt;
      b.sp.rotation += b.vr * dt;
      b.sp.setAlpha(Math.max(0, Math.min(1, (b.life - b.t) / 0.8)));
      if (b.t > b.life) {
        b.gone = true;
        this.fyKill(b.sp);
      }
    }
    g.bits = g.bits.filter((b) => !b.gone);
  },

  // ---------------------------------------------------------------- touch, warnings
  /** Is (px, py) on its hull (its middle, its sides, tapering to the bow), r round it? */
  fyHullAt(g, px, py, r = 0) {
    const [dx, dy] = [px - g.x, py - g.y - g.bob];
    const [c, s] = [Math.cos(-g.rot), Math.sin(-g.rot)];
    const [lx, ly] = [dx * c - dy * s, dx * s + dy * c];
    if (ly < FY.stern - r || ly > FY.bow + r) return false;
    const w = ly < 30 ? FY.half : FY.half * Math.max(0, 1 - ((ly - 30) / (FY.bow - 30)) ** 1.7);
    return Math.abs(lx) < w + r;
  },

  /** The lantern bare (mint), the ladles' gold rims, the gold shells. */
  fyTele(g) {
    const ink = this.tele;
    if (g.state !== 'fight') return;
    if (g.open > 0 || g.stun > 0) {
      const [lx, ly] = this.fyAt(g, FY.lantern);
      const r = 8 + Math.sin(g.t * 10) * 1.2;
      ink.lineStyle(2, SAFE, 0.9).strokeCircle(lx, ly, r);
      ink.lineStyle(1, 0xffffff, 0.5).strokeCircle(lx, ly, r + 4);
    }
    for (const A of g.arms) {
      if (A.hp <= 0 || (A.state !== 'hold' && A.state !== 'throw')) continue;
      const [x, y] = this.fyBowl(g, A);
      ink.lineStyle(1, GOLD, 0.4 + Math.sin(g.t * 8 + A.row) * 0.25).strokeCircle(x, y, 4.5);
    }
    for (const sh of g.shells) ink.lineStyle(1, GOLD, 0.6 + Math.sin(g.t * 14) * 0.3).strokeCircle(sh.sp.x, sh.sp.y, FUNA.shell.r + 3);
    // the rows' lines across the water while they are warned
    const a = g.act;
    if (a?.kind === 'hands' && a.lines && a.t < FUNA.whirl.warn * rules().warn && Math.floor(a.t * 10) % 2) {
      for (const [x0, y0, ang] of a.lines) ink.lineStyle(1, WARN, 0.5).lineBetween(x0, y0, x0 + Math.cos(ang) * 400, y0 + Math.sin(ang) * 400);
    }
  },

  // ---------------------------------------------------------------- putting it together
  /** The list of parts, back to front, and the sprites put there (fySync). */
  fyDraw(g) {
    const L = [];
    const put = (key, frame, [x, y], o) => L.push({ key, frame, x, y, o });
    const al = g.alpha;
    // the whirl's foam on the water round it, turning (faster at a turn's height)
    if (g.stage === 3) {
      g.foam = Math.min(1, g.foam + g.dt / 1.5);
      g.foamA = (g.foamA ?? 0) - (0.5 + g.spin * 2.6) * g.dt;
      for (let k = 0; k < 5; k++) put(`foam${k}`, `fy_foam_${k % 2}`, [g.x, g.y], { rot: g.foamA + (k / 5) * TAU, a: 0.85 * g.foam, ox: 0, oy: 0 });
    }
    // the arms along its sides
    for (const A of g.arms) {
      if (A.state === 'down' || A.a <= 0) continue;
      const pose = A.state === 'rise' || A.state === 'sink' ? 'rise' : A.hp <= 0 ? 'holed' : A.state === 'throw' ? 'throw' : 'hold';
      put(`arm${A.side}_${A.row}`, `fy_arm_${pose}`, this.fyAt(g, FY.arms[A.row], A.side), { rot: g.rot, flip: A.side < 0, ox: A.side < 0 ? 1 - ORIGIN.arm[0] : ORIGIN.arm[0], oy: ORIGIN.arm[1], a: A.a * al });
    }
    put('body', `fy_hull_${g.wear}`, [g.x, g.y + g.bob], { rot: g.rot, a: al });
    // the hatch's fire, the sail burning
    if (g.wear === 1 && g.state === 'fight') put('fire', 'glow', this.fyAt(g, FY.hatch), { add: true, tint: 0xff8a3a, a: (0.5 + Math.sin(g.t * 17) * 0.15) * al, sx: 1.2 });
    if (g.wear === 2) put('fire', 'glow', this.fyAt(g, FY.sail), { add: true, tint: 0xff7a2a, a: (0.55 + Math.sin(g.t * 13) * 0.2) * al, sx: 2.2 });
    const torn = g.wear === 2 ? 'torn_' : '';
    const f = Math.floor(g.t * 6);
    put('bannerL', `fy_banner_${torn}${f % 3}`, this.fyAt(g, FY.banner, -1), { rot: g.rot, flip: true, ox: 0.5, oy: ORIGIN.banner[1], a: al });
    put('bannerR', `fy_banner_${torn}${(f + 1) % 3}`, this.fyAt(g, FY.banner, 1), { rot: g.rot, ox: 0.5, oy: ORIGIN.banner[1], a: al });
    const open = (g.open > 0 || g.stun > 0) && g.state === 'fight';
    if (Math.random() < 0.08) g.lamp = 1 - g.lamp;
    put('lantern', open ? 'fy_lantern_open' : `fy_lantern_${g.lamp}`, this.fyAt(g, FY.lantern), { rot: g.rot, ox: 0.5, oy: ORIGIN.lantern[1], a: al });
    put('halo', 'glow', this.fyAt(g, FY.lantern), { add: true, tint: open ? SAFE : GLOW, a: (open ? 0.6 : 0.3) * al, sx: open ? 1.3 : 0.9 });
    this.fySync(g, L);
  },

  /** Puts each part's sprite where the list says, in its order; parts no longer listed go back to the pool. */
  fySync(g, L) {
    const seen = new Set();
    L.forEach((it, i) => {
      const o = it.o ?? {};
      const body = it.key === 'body';
      let sp = body ? g.body : g.sp[it.key];
      if (!sp) sp = g.sp[it.key] = this.segPool.spawn(it.frame, it.x, it.y);
      else if (sp.frame.name !== it.frame && sp.texture.has(it.frame)) sp.setFrame(it.frame);
      const z = (it.key.startsWith('foam') ? BASE - 0.04 : BASE) + i * 0.0002;
      if (sp.depth !== z) sp.setDepth(z);
      const [ox, oy] = [o.ox ?? 0.5, o.oy ?? 0.5];
      if (sp.originX !== ox || sp.originY !== oy) sp.setOrigin(ox, oy);
      sp.setPosition(it.x, it.y).setScale(sp.base * (o.sx ?? 1)).setRotation(o.rot ?? 0).setAlpha(o.a ?? 1).setFlipX(!!o.flip).setVisible(true);
      const blend = o.add ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL;
      if (sp.blendMode !== blend) sp.setBlendMode(blend);
      if (o.tint != null) sp.setTint(o.tint);
      else if (sp.isTinted && !body) sp.clearTint();
      seen.add(it.key);
    });
    for (const k of Object.keys(g.sp)) {
      if (seen.has(k)) continue;
      this.fyKill(g.sp[k]);
      delete g.sp[k];
    }
  },

  fyKill(sp) {
    if (!sp || sp.dead) return;
    sp.setRotation(0).setOrigin(0.5, 0.5).setAlpha(1).setFlipX(false).clearTint().setBlendMode(Phaser.BlendModes.NORMAL);
    this.segPool.kill(sp);
  },

  // ---------------------------------------------------------------- shots
  /** What it lays open, for the homing orbs (Enemies.nearest): the gold shells, the ladles' bowls, the bare lantern. */
  fyMarks(g) {
    if (g.state !== 'fight') return [];
    const out = g.shells.map((sh) => ({ x: sh.sp.x, y: sh.sp.y }));
    for (const A of g.arms) {
      if (A.hp <= 0 || (A.state !== 'hold' && A.state !== 'throw')) continue;
      const [x, y] = this.fyBowl(g, A);
      out.push({ x, y });
    }
    if (g.open > 0 || g.stun > 0) {
      const [x, y] = this.fyAt(g, FY.lantern);
      out.push({ x, y });
    }
    return out;
  },

  /**
   * A shot reaching it: a gold shell (it bursts), a ladle with its rim gold (its bottom goes), the lantern while it is
   * bare (mint: it hurts a lot), its hull (a little gets through). (Enemies.bossDeviceHit)
   */
  fyShot(shot) {
    const g = this.bossGroup;
    if (!g || g.kind !== 'funayurei' || g.defeated) return false;
    const e = g.body;
    if (e.dead || e.hp <= 0 || g.state === 'dormant') return false;
    const s = this.scene;
    const r = shot.radius;
    if (g.state === 'fight') {
      for (const sh of g.shells) {
        if (!sh.gone && Math.hypot(shot.x - sh.sp.x, shot.y - sh.sp.y) < FUNA.shell.r + r) {
          this.fyShellHit(g, sh, shot.damage);
          return true;
        }
      }
      for (const A of g.arms) {
        if (A.hp <= 0 || (A.state !== 'hold' && A.state !== 'throw')) continue;
        const [x, y] = this.fyBowl(g, A);
        if (Math.hypot(shot.x - x, shot.y - y) < 3.5 + r) {
          this.fyLadleHit(g, A, shot.damage);
          return true;
        }
      }
    }
    const [lx, ly] = this.fyAt(g, FY.lantern);
    const lantern = Math.hypot(shot.x - lx, shot.y - ly) < 6 + r;
    if (!lantern && !this.fyHullAt(g, shot.x, shot.y, r)) return false;
    if (g.state !== 'fight') {
      if (Math.random() < 0.3) s.fx.spark(shot.x, shot.y - 2, GLOW);
      return true;
    }
    const open = lantern && (g.open > 0 || g.stun > 0);
    this.damage(e, shot.damage * (open ? (g.stun > 0 ? FUNA.stun.take : FUNA.open.take) : FUNA.armour));
    if (open) {
      if (Math.random() < 0.5) s.fx.spark(shot.x, shot.y - 2, SAFE);
    } else if (Math.random() < 0.25) s.fx.part(s.fx.parts, 'dot_1', shot.x, shot.y - 2, { vx: (Math.random() - 0.5) * 40, vy: 20, g: 160, life: 0.3 }).setTint(0x5e6e66);
    return true;
  },

  /** No hit, nor a bomb, takes it past the next phase's threshold before that phase has begun (Enemies.damage). */
  fyCap(e, amount) {
    const g = e.group;
    if (e.role !== 'body' || g.stage >= 3) return amount;
    return Math.min(amount, Math.max(0, e.hp - (e.maxHp * FUNA.phase[g.stage - 1] - 0.5)));
  },

  // ---------------------------------------------------------------- the end
  fyCleanup(g) {
    for (const sp of Object.values(g.sp)) this.fyKill(sp);
    g.sp = {};
    for (const k of g.pots) this.segPool.kill(k.sp);
    for (const sh of g.shells) this.segPool.kill(sh.sp);
    for (const h of g.hands) if (h.sp) this.fyKill(h.sp);
    for (const b of g.bits) this.fyKill(b.sp);
    Object.assign(g, { pots: [], shells: [], hands: [], bits: [] });
  },

  /** Going down (Enemies.goDown): its parts stay on as they are for the end (fyEnd), and where the arms were. */
  fyDown(e) {
    const g = e.group;
    const parts = [];
    for (const [k, sp] of Object.entries(g.sp)) parts.push({ k, sp, ox: sp.x - g.x, oy: sp.y - g.y, rot0: sp.rotation, a0: sp.alpha, lantern: k === 'lantern', glow: k === 'halo' || k === 'fire', foam: k.startsWith('foam'), arm: k.startsWith('arm') });
    g.sp = {};
    const ladles = g.arms.filter((A) => A.state !== 'down').map((A) => this.fyBowl(g, A));
    return { parts, x: g.x, y: g.y, rot: g.rot, ladles, next: 0, lights: 0, fw: null, said: {} };
  },

  /**
   * The end: green flashes run over it, its lantern goes out, it sinks into the strait, the arms let go of their
   * ladles (they float off) and go under, little lights rise from the water, and one last great firework opens over
   * the strait. Returns true when it is over.
   */
  fyEnd(d, dt) {
    const s = this.scene;
    const fx = s.fx;
    const F = d.fy;
    const b = d.body;
    const t = d.t;
    if (!F.withBody) {
      F.withBody = true;
      F.parts.unshift({ k: 'body', sp: b, ox: 0, oy: 0, rot0: b.rotation, a0: 1 });
      // the arms let go of their ladles
      for (const [x, y] of F.ladles) {
        const sp = this.segPool.spawn('fy_ladle', x, y).setDepth(BASE - 0.02).setFlipX(x < F.x);
        F.parts.push({ k: 'ladle', sp, ox: x - F.x, oy: y - F.y, rot0: 0, a0: 1, ladle: true, vx: (x < F.x ? -1 : 1) * (4 + Math.random() * 4) });
      }
    }
    let [mx, my] = [F.x, F.y];
    if (t < 1.2) {
      mx += Math.round((Math.random() - 0.5) * 3);
      my += Math.round((Math.random() - 0.5) * 3);
      if ((F.next -= dt) <= 0) {
        F.next = 0.13;
        const [x, y] = [F.x + (Math.random() - 0.5) * 60, F.y + (Math.random() - 0.5) * 120];
        fx.explode(x, y, 's', null, true);
        fx.part(fx.parts, 'glow', x, y, { life: 0.3, a0: 0.7 }).setTint(GLOW).setBlendMode(Phaser.BlendModes.ADD);
      }
    }
    if (t >= 1.2 && !F.said.out) {
      F.said.out = true;
      fx.text(F.x, F.y + 70, 'FUSSU...', 1.2, 0xc0fff0);
      s.cameras.main.shake(2600, 0.004);
    }
    // it sinks: fading into the dark water, settling, bubbles and the sea closing over it
    const q = Phaser.Math.Clamp((t - 1.2) / 3.6, 0, 1);
    const fade = 1 - ease(q);
    if (q > 0 && q < 1) {
      if (Math.random() < dt * 30) {
        const [x, y] = [F.x + (Math.random() - 0.5) * 70, F.y + (Math.random() - 0.5) * 140];
        fx.part(fx.parts, 'dot_1', x, y, { vy: -6, life: 0.6, a0: 0.8 }).setTint(0xd8f0ff);
        if (Math.random() < 0.3) SPLASH(s, x, y, 3);
      }
      if (!F.said.sink) {
        F.said.sink = true;
        fx.text(F.x, F.y + 84, 'ZUBUZUBU...', 1.6, 0xbfe8ff);
        s.sfx.explode('m');
      }
    }
    const flash = t < 1.2 && Math.floor(t * 14) % 2;
    for (const p of F.parts) {
      const sp = p.sp;
      if (p.ladle) {
        // a ladle let go of, floating off and under
        p.ox += p.vx * dt;
        p.vx *= 1 - dt * 0.4;
        sp.setPosition(F.x + p.ox, F.y + p.oy).setRotation(sp.rotation + dt * 0.2 * Math.sign(p.vx)).setAlpha(Math.max(0, Math.min(1, (6.5 - t) / 1.2)));
        continue;
      }
      if (p.lantern) sp.setFrame(t < 1.2 ? sp.frame.name : 'fy_lantern_out');
      const a = p.glow ? (t < 1.2 ? p.a0 : 0) : p.arm ? p.a0 * Math.max(0, 1 - t / 1.4) : p.a0 * fade;
      sp.setPosition(mx + p.ox, my + p.oy + q * 4).setAlpha(a).setRotation(p.rot0 + (p.foam ? t * 0.3 : q * 0.05));
      if (flash && !p.glow) sp.setTint(0x406a60).setTintMode(Phaser.TintModes.ADD);
      else if (sp.isTinted && !p.glow) sp.clearTint();
    }
    // little lights rise off the water where it went down
    if (t > 2.2 && t < 7.5 && (F.lights -= dt) <= 0) {
      F.lights = 0.05;
      const [x, y] = [F.x + (Math.random() - 0.5) * 80, F.y + (Math.random() - 0.5) * 120];
      fx.part(fx.parts, Math.random() < 0.4 ? 'dot_2' : 'dot_1', x, y, { vx: (Math.random() - 0.5) * 6, vy: -14 - Math.random() * 12, drag: 0.2, life: 2.2, a0: 0.9 }).setTint(Math.random() < 0.6 ? 0xe0fff8 : GLOW).setBlendMode(Phaser.BlendModes.ADD);
    }
    // one last great firework: up from the barge, opening over the strait, a willow of gold falling from it
    if (t > 5 && !F.fw) F.fw = { x: 84, y: s.H * 0.72, ty: 64, t: 0 };
    const fw = F.fw;
    if (fw) {
      fw.t += dt;
      if (!fw.burst) {
        const y = fw.y + (fw.ty - fw.y) * Math.min(1, fw.t / 0.9);
        fx.part(fx.parts, 'dot_1', fw.x + (Math.random() - 0.5), y, { vy: 14, life: 0.3, a0: 0.9 }).setTint(0xffe8c0);
        if (fw.t >= 0.9) {
          fw.burst = true;
          this.fyBurst(fw.x, fw.ty, [GOLD, 0xff7a8a, 0x8ae0ff, 0xffffff], 2.4);
          for (let i = 0; i < 48; i++) {
            const an = (i / 48) * TAU;
            fx.part(fx.parts, 'dot_2', fw.x, fw.ty, { vx: Math.cos(an) * 64, vy: Math.sin(an) * 52, g: 34, drag: 0.7, life: 2.6, a0: 1 }).setTint(i % 3 ? GOLD : 0xffe8a0).setBlendMode(Phaser.BlendModes.ADD);
          }
          fx.flash(0.4, 0.6, 0xfff0c0);
          fx.text(fw.x, fw.ty + 50, 'DOOON!', 1.4, GOLD);
          fx.text(fw.x, fw.ty + 64, 'TAMAYA~!', 1.8, 0xffffff);
          s.sfx.explode('l');
        }
      } else if (fw.t < 3.8) {
        // the willow: gold trails falling slowly from where it opened, thinning out
        for (let i = 0; i < 3; i++) {
          if (Math.random() > dt * 40 * (1 - (fw.t - 0.9) / 3)) continue;
          const an = Math.random() * TAU;
          const r = (fw.t - 0.9) * 26 + Math.random() * 30;
          fx.part(fx.parts, 'dot_1', fw.x + Math.cos(an) * r, fw.ty + Math.sin(an) * r * 0.8 + (fw.t - 0.9) * 14, { vy: 10, g: 12, life: 1.3, a0: 0.9 }).setTint(Math.random() < 0.7 ? GOLD : 0xff9a40).setBlendMode(Phaser.BlendModes.ADD);
        }
      }
    }
    if (t < FUNA.outro) return false;
    for (const p of F.parts) if (p.sp !== b) this.fyKill(p.sp);
    return true;
  },
};
