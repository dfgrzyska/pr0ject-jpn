// Kawaguchiko's boss (docs/plan-kawaguchiko.md, 6.2): DAIDARABOTCHI, the giant who heaped up the mountain. Methods of
// Enemies (mixed in like the cities'). He stands waist-deep in the lake before Fuji, over the panorama (FujiView): his
// waist on the view's waterline. His art comes in parts (tools/art/kawaguchiko/daidara.mjs: frames dd_*) that the game
// puts together and moves: the body and what his face does over it, two arms on pivots at the shoulders (the right one
// the left one flipped), the carrying pole and the basket, the fissure in his chest, the sun going down behind him.
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { rules, volley } from '../../difficulty.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * His life, the phases' thresholds, what a hit on his earth gets through; the hand cupped in the lake (what a hit on it
 * does, its size); the clods (their flight, the ring they burst into); the waves from his hands; the spray of lake water;
 * the basket (its ropes' life, how long he holds it on a side, how long he takes to shift it over his head, the lanes
 * of a row of rocks and its gap, how fast they roll); stunned with the basket dropped; the walls of mist; the slam; the
 * fissure open after a slam; how long his end takes.
 */
export const DAIDARA = {
  hp: 2200,
  phase: [0.68, 0.38],
  armour: 0.55,
  hand: { take: 2, r: 12 },
  clod: { fly: 1.05, r: 12, n: 10 },
  wave: { n: 4, step: 24, r: 10, warn: 0.75, gap: 0.16, live: 0.35 },
  spray: { n: 5, arc: 0.8 },
  basket: { rope: 40, dwell: 3, swap: 1.5, lanes: 9, gap: 2, roll: 60, rows: [0.7, 1.9] },
  stun: { time: 3.6, take: 2.6 },
  mist: { walls: 3, sweep: 0.75, every: 1.15, gap: 30, speed: 48, step: 9 },
  slam: { warn: 0.95, n: 18, rings: 2 },
  open: { time: 2.4, take: 2.2 },
  outro: 14,
};

// Where his parts sit, logical px from the middle of his body's frame (tools/art/kawaguchiko/daidara.mjs: SHOULDER, CORE,
// the arms' pivot and hand; the test kawaguchikoDaidara checks them): the arms' pivots (each 20 fine px out from the
// shoulder), how far the hand is from the pivot, the fissure, the mouth, the neck the pole rests on, half his height.
export const DD = { shoulder: 37.33, hand: 36, pivot: 18 / 170, core: [0, 14], mouth: [0, -7], neck: [0, -34], half: 50 };

const WARN = 0xff735e;
const SAFE = 0x81f3cc;
const GOLD = 0xffd06a;
const BASE = DEPTH.air - 0.16; // his parts, back to front from here
const POLE = { L: -Math.PI + 0.15, R: -0.15, len: 70, mid: 22, rope: 20 }; // the pole's angle on each side, its tip, its middle, the ropes
const GRIP = 2.75; // the arm raised to hold the pole on its shoulder
const SAY = (s, x, y, t, life = 0.8, c = 0xffffff) => s.fx.text(x, y, t, life, c);
const ease = (q) => q * q * (3 - 2 * q);

export const kawaguchikoDaidara = {
  /**
   * A giant of earth and stone, autumn's grass and moss on him, maples aflame and a pine on his shoulders, eyes two
   * little lakes, a cave of a mouth. He rises out of the lake before Fuji. Three phases:
   * 1. KOPANIE: he digs the lake: a hand scoops earth and water (cupped in the lake it is open: mint), throws a spray
   *    of lake water, and waves run from it over the water; the other flings clods of earth in an arc that burst
   *    into rings where they land;
   * 2. KOSZ: he carries the great basket on his pole, on one shoulder and then, swung over his head, on the other; it
   *    pours rows of rolling rocks with a gap in each. The basket hangs on two ropes lit gold: shot through, it drops
   *    into the lake on his foot, he howls, stunned, and the fissure in his chest is open;
   * 3. ZACHÓD: his left arm breaks off; the sun goes down behind him and he is a silhouette with a burning rim. He
   *    sweeps the mist off the water and throws it in walls with a narrow gap; he slams hand and stump on the lake
   *    and rings of waves go out; after each slam the fissure shines (mint).
   * Beaten, he sits down in the water and crumbles into an islet with one red maple; dusk falls (FujiView).
   */
  spawnDaidara(w, base) {
    const s = this.scene;
    const W = this.ddWater();
    const g = {
      kind: 'daidara', state: 'enter', stage: 1, t: 0, parts: [], awake: false, defeated: false, act: null, timer: 1, plan: 0,
      outro: DAIDARA.outro, x: w.x ?? 90, W, by: W - DD.half, sink: DD.half * 2, rise: 0, sp: {}, wear: 0,
      arms: { l: { side: 'l', sx: -1, a: 0, ta: 0, k: 5, hand: 'open', gone: false }, r: { side: 'r', sx: 1, a: 0, ta: 0, k: 5, hand: 'open', gone: false } },
      face: null, faceT: 0, blinkAt: 2.5, clods: [], rocks: [], bits: [], pole: null, stun: 0, open: 0, hand: null, sun: 0, shake: 0, said: {},
    };
    const body = this.pool.spawn('dd_body_0', g.x, g.by, { ...base, role: 'body', group: g, hp: DAIDARA.hp, maxHp: DAIDARA.hp, radius: 30, pass: true, harmless: true, flashTint: 0x404040 });
    g.body = body;
    g.parts.push(body);
    g.maxTotal = DAIDARA.hp;
    this.bossGroup = g;
    this.ddDraw(g);
    s.cameras.main.shake(600, 0.004);
    return body;
  },

  /** The screen y of the lake's waterline in the view behind (FujiView), where his waist is. */
  ddWater() {
    const s = this.scene;
    return s.scenicView?.waterY ?? Math.round(s.H * 0.61);
  },

  updateDaidara(g, dt) {
    const s = this.scene;
    g.t += dt;
    g.W = this.ddWater();
    if (g.state === 'enter') this.ddEnter(g, dt);
    else this.ddFight(g, dt);
    // he breathes, slowly; a slam or a howl shakes him
    g.shake = Math.max(0, g.shake - dt);
    const breathe = Math.sin(g.t * 1.1) > 0.3 ? 1 : 0;
    g.by = g.W - DD.half + g.sink + breathe + (g.shake > 0 ? Math.round((Math.random() - 0.5) * 2) : 0);
    for (const A of Object.values(g.arms)) A.a += (A.ta - A.a) * Math.min(1, dt * A.k);
    // now and then he blinks his lids of earth down over the lake-eyes
    if (g.faceT > 0) g.faceT -= dt;
    else g.face = null;
    if (g.t > g.blinkAt && !g.face) {
      this.ddFace(g, 'blink', 0.16);
      g.blinkAt = g.t + 2.5 + Math.random() * 2.5;
    }
    g.stun = Math.max(0, g.stun - dt);
    g.open = Math.max(0, g.open - dt);
    this.ddClods(g, dt);
    this.ddRocks(g, dt);
    this.ddPole(g, dt);
    this.ddBits(g, dt);
    this.ddTouch(g);
    this.ddTele(g);
    this.ddDraw(g);
    g.body.x = g.x;
    g.body.y = g.by;
    if (g.state === 'fight' && Math.random() < dt * 3) {
      // the lake laps round his waist
      s.fx.part(s.fx.parts, 'dot_1', g.x + (Math.random() - 0.5) * 80, g.W + 1, { vx: (Math.random() - 0.5) * 12, vy: -6, life: 0.5, a0: 0.6 }).setTint(0xd8ecff);
    }
  },

  ddFace(g, kind, time) {
    g.face = kind;
    g.faceT = time;
  },

  // ---------------------------------------------------------------- rising out of the lake
  /** The water boils before Fuji, then he rises out of it, the lake pouring off him, and roars. */
  ddEnter(g, dt) {
    const s = this.scene;
    // (the view rises from behind the quay first: he comes up only once it is in its place)
    if (!g.rise && (s.scenicView?.progress?.() ?? 1) < 0.995) return;
    const was = g.rise;
    g.rise = Math.min(1, g.rise + dt / 3.4);
    g.sink = DD.half * 2 * (1 - ease(g.rise));
    if (Math.random() < dt * 30) {
      const x = g.x + (Math.random() - 0.5) * 120;
      s.fx.part(s.fx.parts, 'drop_0', x, g.W, { vx: (Math.random() - 0.5) * 40, vy: -30 - Math.random() * 60, g: 200, life: 0.6 }).setTint(0xd8f0ff);
    }
    if (was < 0.05 && g.rise >= 0.05) SAY(s, g.x, g.W + 26, 'GOGOGOGO...', 1.4, 0xd8f0ff);
    if (Math.random() < dt * 4) s.cameras.main.shake(200, 0.003);
    if (was < 1 && g.rise >= 1) {
      this.ddFace(g, 'roar', 1.1);
      SAY(s, g.x, g.by + 18, 'UOOOOO!', 1.3, 0xffd8a0);
      s.cameras.main.shake(500, 0.008);
      s.sfx.explode('m');
    }
    if (g.rise >= 1 && g.faceT <= 0) Object.assign(g, { state: 'fight', awake: true, timer: 0.8, act: null });
  },

  // ---------------------------------------------------------------- the fight
  ddFight(g, dt) {
    const e = g.body;
    const frac = e.hp / e.maxHp;
    if (g.stage === 1 && !g.act && frac < DAIDARA.phase[0]) return this.ddToBasket(g);
    if (g.stage === 2 && !g.act && g.stun <= 0 && g.pole?.mode !== 'drop' && frac < DAIDARA.phase[1]) return this.ddToDusk(g);
    if (g.stage === 3) g.sun = Math.min(1, g.sun + dt / 1.6);
    if (g.act) this.ddAct(g, dt);
    else if (g.stage !== 2 && (g.timer -= dt) <= 0 && this.canFire(e)) {
      const P = g.stage === 1 ? ['scoop:l', 'throw:r', 'scoop:r', 'throw:l', 'both'] : ['mist', 'slam', 'mist', 'slam'];
      const [kind, side] = P[g.plan++ % P.length].split(':');
      g.act = { kind, side, t: 0, done: {} };
    }
  },

  ddDone(g, rest) {
    g.act = null;
    g.timer = rest;
  },

  ddAct(g, dt) {
    const a = g.act;
    a.t += dt;
    const once = (k, at) => (a.t >= at && !a.done[k] ? (a.done[k] = true) : false);
    if (a.kind === 'scoop') this.ddScoop(g, a, once);
    else if (a.kind === 'throw') this.ddThrowAct(g, a, once, [a.side]);
    else if (a.kind === 'both') this.ddThrowAct(g, a, once, ['l', 'r']);
    else if (a.kind === 'mist') this.ddMist(g, a, once);
    else if (a.kind === 'slam') this.ddSlam(g, a, once);
  },

  /** The hand in his frame and where it is: its pivot at the shoulder, turned out by its angle. */
  ddHand(g, side) {
    const A = g.arms[side];
    return [g.x + A.sx * (DD.shoulder + DD.hand * Math.sin(A.a)), g.by + DD.hand * Math.cos(A.a)];
  },

  arm(g, side, ta, k, hand) {
    const A = g.arms[side];
    Object.assign(A, { ta, k }, hand ? { hand } : {});
  },

  // ---------------------------------------------------------------- phase 1: digging
  /** A hand into the lake beside him, cupped (open to shots), waves running out from it; then a spray of lake water. */
  ddScoop(g, a, once) {
    const s = this.scene;
    const D = DAIDARA;
    const side = a.side;
    if (once('down', 0)) this.arm(g, side, 0.5, 5, 'open');
    if (once('in', 0.45)) {
      this.arm(g, side, 0.42, 5, 'cup');
      g.hand = side;
      const [hx] = this.ddHand(g, side);
      for (let i = 0; i < 8; i++) s.fx.puff('splash', hx + (Math.random() - 0.5) * 20, g.W + 2, 0.4);
      SAY(s, hx, g.W + 18, 'ZABU!', 0.7, 0xd8f0ff);
    }
    if (a.t > 0.45 && a.t < 1.75 && Math.random() < 0.3) {
      const [hx, hy] = this.ddHand(g, side);
      s.fx.part(s.fx.parts, 'drop_0', hx + (Math.random() - 0.5) * 14, hy + 6, { vy: 30, g: 200, life: 0.35 }).setTint(0xbfe8ff);
    }
    if (once('waves', 0.8) && this.canFire(g.body)) {
      // waves from the hand run over the water towards the ship
      const [hx] = this.ddHand(g, side);
      const p = s.player;
      const [x0, y0] = [hx, g.W + 16];
      const ang = Math.atan2(p.y - y0, p.x - x0);
      const W = D.wave;
      for (let i = 0; i < W.n; i++) {
        const [x, y] = [x0 + Math.cos(ang) * i * W.step, y0 + Math.sin(ang) * i * W.step];
        if (y < s.H - 6 && x > 4 && x < VIEW.width - 4) s.bullets.zone(x, y, W.r, { warn: W.warn + i * W.gap, live: W.live, kind: 'water' });
      }
    }
    if (once('lift', 1.75)) {
      this.arm(g, side, 1.05, 7);
      g.hand = null;
    }
    if (once('spray', 1.95)) {
      this.arm(g, side, 1.05, 7, 'open');
      if (this.canFire(g.body)) {
        const [hx, hy] = this.ddHand(g, side);
        const ang = Math.atan2(s.player.y - hy, s.player.x - hx);
        const n = volley(D.spray.n);
        for (let i = 0; i < n; i++) s.bullets.shot('eb_bubble_0', hx, hy, ang + (n > 1 ? (i / (n - 1) - 0.5) * D.spray.arc : 0), normal * (0.9 + (i % 2) * 0.15), 2.2, { grow: { r0: 2, r1: 3.2, t: 0.6, drag: 0, frames: ['eb_bubble_0', 'eb_bubble_1'] } });
        for (let i = 0; i < 8; i++) s.fx.part(s.fx.parts, 'drop_0', hx, hy, { vx: Math.cos(ang) * 80 + (Math.random() - 0.5) * 60, vy: Math.sin(ang) * 80, g: 120, life: 0.4 }).setTint(0xbfe8ff);
      }
    }
    if (once('back', 2.3)) this.arm(g, side, 0, 4);
    if (a.t > 2.6) this.ddDone(g, 0.6);
  },

  /** A hand down for a clod of earth, swung up over his shoulder and flung at the ship (both at once now and then). */
  ddThrowAct(g, a, once, sides) {
    const s = this.scene;
    if (once('reach', 0)) {
      for (const side of sides) this.arm(g, side, 0.35, 5, 'open');
      if (sides.length > 1) {
        this.ddFace(g, 'roar', 0.9);
        SAY(s, g.x, g.by + 10, 'NUUN!', 1, 0xffd8a0);
      }
    }
    if (once('grab', 0.5))
      for (const side of sides) {
        this.arm(g, side, 0.35, 5, 'clod');
        const [hx] = this.ddHand(g, side);
        for (let i = 0; i < 5; i++) s.fx.part(s.fx.parts, 'dot_1', hx + (Math.random() - 0.5) * 12, g.W, { vx: (Math.random() - 0.5) * 40, vy: -20 - Math.random() * 30, g: 160, life: 0.4 }).setTint(0x8a6a44);
      }
    if (once('swing', 0.6)) for (const side of sides) this.arm(g, side, 2.4, 6);
    if (once('fling', 1.15)) {
      sides.forEach((side, i) => {
        this.arm(g, side, 2.4, 6, 'open');
        this.ddThrow(g, side, sides.length > 1 ? (i ? 34 : -34) : 0);
      });
    }
    if (once('back', 1.5)) for (const side of sides) this.arm(g, side, 0, 4);
    if (a.t > 1.9) this.ddDone(g, sides.length > 1 ? 1 : 0.6);
  },

  /** A clod of earth thrown in an arc on to the water near the ship: a ring of mud warns where it lands. */
  ddThrow(g, side, off) {
    const s = this.scene;
    if (!this.canFire(g.body) || s.bombClear > 0) return;
    const p = s.player;
    const C = DAIDARA.clod;
    const [hx, hy] = this.ddHand(g, side);
    const tx = Phaser.Math.Clamp(p.x + off + (Math.random() - 0.5) * 30, 16, VIEW.width - 16);
    const ty = Phaser.Math.Clamp(p.y - 10 - Math.random() * 30, g.W + 30, s.H - 24);
    s.bullets.zone(tx, ty, C.r, { warn: C.fly, live: 0.3, kind: 'mud' });
    const sp = this.segPool.spawn('dd_clod_0', hx, hy).setDepth(DEPTH.air - 0.06);
    g.clods.push({ sp, x0: hx, y0: hy, tx, ty, t: 0 });
  },

  ddClods(g, dt) {
    const s = this.scene;
    const C = DAIDARA.clod;
    for (const k of g.clods) {
      k.t += dt;
      const q = Math.min(1, k.t / C.fly);
      const lift = Math.sin(q * Math.PI);
      k.sp.setPosition(k.x0 + (k.tx - k.x0) * q, k.y0 + (k.ty - k.y0) * q - lift * 46).setFrame(`dd_clod_${Math.floor(k.t * 8) % 2}`).setScale(k.sp.base * (1 + lift * 0.6));
      if (Math.random() < dt * 14) s.fx.part(s.fx.parts, 'dot_1', k.sp.x, k.sp.y, { vy: 24, life: 0.3 }).setTint(0x8a6a44);
      if (q < 1) continue;
      // it bursts on the water into a ring of mud
      k.gone = true;
      this.segPool.kill(k.sp);
      SAY(s, k.tx, k.ty - 14, 'DOSU!', 0.6, 0xd8b080);
      for (let i = 0; i < 8; i++) s.fx.part(s.fx.parts, 'dot_1', k.tx, k.ty, { vx: (Math.random() - 0.5) * 90, vy: -30 - Math.random() * 40, g: 160, life: 0.5 }).setTint(i % 2 ? 0x8a6a44 : 0xd8f0ff);
      if (g.state === 'fight' && !g.defeated && s.bombClear <= 0) {
        const n = volley(C.n);
        const off = Math.random() * TAU;
        for (let i = 0; i < n; i++) s.bullets.shot('eb_s', k.tx, k.ty, off + (i / n) * TAU, slow * 0.95, 1.8);
      }
    }
    g.clods = g.clods.filter((k) => !k.gone);
  },

  // ---------------------------------------------------------------- phase 2: the basket
  ddToBasket(g) {
    const s = this.scene;
    this.phaseBreak(g, g.x, g.by, 2, 'KOSZ NA DRĄGU');
    g.wear = 1;
    g.hand = null;
    this.ddFace(g, 'roar', 0.9);
    // he hoists the pole on to his left shoulder, the basket heaped with earth hanging from its end
    g.pole = { side: -1, phi: POLE.L, q: 0, mode: 'tie', mt: 0, psi: 0, dpsi: 0, tip: null, tv: null, ropes: [DAIDARA.basket.rope, DAIDARA.basket.rope], full: true, tilt: 0, alpha: 0, drop: null, rows: 0 };
    this.arm(g, 'l', GRIP, 4, 'grip');
    this.arm(g, 'r', 0, 4, 'open');
    for (let i = 0; i < 10; i++) s.fx.puff('splash', 20 + Math.random() * 30, g.W + 2, 0.5);
    SAY(s, g.x, g.by + 30, 'YOISHO!', 1, 0xffd8a0);
  },

  /** The tip of the pole, where the ropes hang from. */
  ddTip(g, P) {
    const [nx, ny] = [g.x + DD.neck[0], g.by + DD.neck[1]];
    return [nx + Math.cos(P.phi) * POLE.len, ny + Math.sin(P.phi) * POLE.len];
  },

  /** Where the basket hangs (its middle) and the two rings its ropes are tied to. */
  ddBasketAt(g, P) {
    const [tx, ty] = P.tip ?? this.ddTip(g, P);
    const [c, sn] = [Math.cos(P.psi), Math.sin(P.psi)];
    const [bx, by] = [tx - sn * POLE.rope, ty + c * POLE.rope];
    const rot = -P.psi + P.tilt;
    const ring = (dx) => [bx + dx * Math.cos(rot) + 5.3 * Math.sin(rot), by + dx * Math.sin(rot) - 5.3 * Math.cos(rot)];
    return { bx, by, rot, rings: [ring(-13.3), ring(13.3)] };
  },

  /** The pole and the basket: held on a side (rows of rocks poured), shifted over his head, dropped, tied again. */
  ddPole(g, dt) {
    const P = g.pole;
    if (!P) return;
    const s = this.scene;
    const B = DAIDARA.basket;
    P.mt += dt;
    // the pole's angle
    if (P.mode === 'swap') {
      P.q = Math.min(1, P.mt / B.swap);
      const [from, to] = P.side < 0 ? [POLE.R, POLE.L] : [POLE.L, POLE.R]; // (P.side is where it is going)
      P.phi = from + (to - from) * ease(P.q);
      const [old, now] = P.side < 0 ? ['r', 'l'] : ['l', 'r'];
      if (P.q < 0.5) {
        this.arm(g, old, 3, 6, 'grip');
        this.arm(g, now, 2.1, 5, 'open');
      } else {
        this.arm(g, now, GRIP, 6, 'grip');
        this.arm(g, old, 0.1, 4, 'open');
      }
      if (P.q > 0.45 && !P.spilt) {
        // over his head a few rocks spill out at the ship
        P.spilt = true;
        if (this.canFire(g.body) && P.full) {
          const { bx, by } = this.ddBasketAt(g, P);
          const ang = Math.atan2(s.player.y - by, s.player.x - bx);
          const n = volley(3);
          for (let i = 0; i < n; i++) this.ddRock(g, bx, by, ang + (i - (n - 1) / 2) * 0.28, normal);
        }
      }
      if (P.q >= 1) Object.assign(P, { mode: 'hold', mt: 0, rows: 0 });
    }
    // the tip's motion swings the basket like a pendulum
    const tip = this.ddTip(g, P);
    const tv = P.tip ? [(tip[0] - P.tip[0]) / dt, (tip[1] - P.tip[1]) / dt] : [0, 0];
    const ta = P.tv ? [(tv[0] - P.tv[0]) / dt, (tv[1] - P.tv[1]) / dt] : [0, 0];
    P.tip = tip;
    P.tv = tv;
    if (P.mode !== 'drop') {
      const acc = (-(300 + Phaser.Math.Clamp(ta[1], -900, 900)) * Math.sin(P.psi) - Phaser.Math.Clamp(ta[0], -900, 900) * Math.cos(P.psi)) / POLE.rope;
      P.dpsi += (acc - P.dpsi * 1.6) * dt;
      P.psi = Phaser.Math.Clamp(P.psi + P.dpsi * dt, -1.3, 1.3);
    }
    P.tilt += (0 - P.tilt) * Math.min(1, dt * 3);
    if (P.mode === 'tie') {
      // the basket comes up out of the lake, heaped, tied on again
      P.alpha = Math.min(1, P.mt / 0.8);
      if (P.mt > 1.1) Object.assign(P, { mode: 'hold', mt: 0, rows: 0, ropes: [B.rope, B.rope], full: true });
    } else if (P.mode === 'hold') {
      const side = P.side < 0 ? 'l' : 'r';
      this.arm(g, side, GRIP, 5, 'grip');
      if (P.rows < B.rows.length && P.mt > B.rows[P.rows] && g.state === 'fight') {
        P.rows++;
        this.ddPour(g, P);
      }
      if (P.mt > B.dwell && g.stage === 2) Object.assign(P, { mode: 'swap', mt: 0, side: -P.side, spilt: false });
    } else if (P.mode === 'drop') {
      // the basket falls into the lake, on his foot
      const d = P.drop;
      d.vy += 520 * dt;
      d.y += d.vy * dt;
      d.rot += dt * 2;
      if (d.y > g.W + 4 && !d.splash) {
        d.splash = true;
        s.cameras.main.shake(500, 0.01);
        for (let i = 0; i < 14; i++) s.fx.puff('splash', d.x + (Math.random() - 0.5) * 40, g.W + 4 + Math.random() * 6, 0.6);
        for (let i = 0; i < 16; i++) s.fx.part(s.fx.parts, 'drop_0', d.x, g.W, { vx: (Math.random() - 0.5) * 160, vy: -60 - Math.random() * 100, g: 260, life: 0.8 }).setTint(0xd8f0ff);
        SAY(s, d.x, g.W - 10, 'DOBOON!', 1, 0xd8f0ff);
        SAY(s, g.x, g.by - 30, 'ITAAA!', 1.3, 0xffd8a0);
        this.ddFace(g, 'roar', 1.2);
        g.stun = DAIDARA.stun.time;
        g.shake = 0.8;
        this.arm(g, 'l', 0.15, 3, 'open');
        this.arm(g, 'r', 0.15, 3, 'open');
        if ((g.said.stun = (g.said.stun ?? 0) + 1) <= 2) SAY(s, g.x, g.by + 28, 'SZCZELINA ODSŁONIĘTA!', 1.3, SAFE);
        s.sfx.explode('m');
      }
      if (d.splash && g.stun <= 0) {
        // he fishes the basket out with the pole and ties it on again
        const side = P.side < 0 ? 'l' : 'r';
        this.arm(g, side, GRIP, 4, 'grip');
        Object.assign(P, { mode: 'tie', mt: 0, drop: null, psi: 0, dpsi: 0, alpha: 0 });
      }
    }
  },

  /** He tips the basket: rocks pour out and land in a row across the lake before him, a gap in it, then roll at the ship. */
  ddPour(g, P) {
    const s = this.scene;
    if (!this.canFire(g.body) || s.bombClear > 0) return;
    const B = DAIDARA.basket;
    P.tilt = P.side * -0.7;
    P.dpsi += P.side * 1.5;
    const { bx, by } = this.ddBasketAt(g, P);
    const lanes = B.lanes;
    // the gap: two lanes side by side, somewhere the ship can reach
    const near = Math.round(((s.player.x - 12) / 156) * (lanes - 1) + (Math.random() - 0.5) * 5);
    const gap = Phaser.Math.Clamp(near, 0, lanes - B.gap);
    const y = g.W + 10;
    for (let i = 0; i < lanes; i++) {
      if (i >= gap && i < gap + B.gap) continue;
      const x = 12 + (i * 156) / (lanes - 1);
      const d = Math.hypot(x - bx, y - by);
      const ang = Math.atan2(y - by, x - bx);
      const fly = 0.5 + i * 0.02;
      this.ddRock(g, bx, by, ang, (d / fly) * 1.15, { frz: { at: fly, hold: 0.25, turn: DOWN - ang, speed: B.roll, frame: `dd_rock_${i % 2}` } });
    }
    SAY(s, bx, by + 18, 'GARA GARA!', 0.7, 0xd8c8b0);
    for (let i = 0; i < 8; i++) s.fx.part(s.fx.parts, 'dot_1', bx, by + 6, { vx: (Math.random() - 0.5) * 50, vy: 20 + Math.random() * 40, g: 200, life: 0.5 }).setTint(0x8a6a44);
  },

  /** A rock (a bullet of his atlas), turning as it rolls. */
  ddRock(g, x, y, ang, speed, extra) {
    const b = this.scene.bullets.shot('dd_rock_0', x, y, ang, speed, 3.2, extra);
    if (b) g.rocks.push({ b, spin: (Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 3) });
  },

  ddRocks(g, dt) {
    for (const r of g.rocks) {
      if (r.b.dead || !r.b.frame.name.startsWith('dd_rock_')) r.gone = true;
      else r.b.rotation += r.spin * dt;
    }
    g.rocks = g.rocks.filter((r) => !r.gone);
  },

  /** A rope shot through: the last one and the basket drops. */
  ddRopeHit(g, i, dmg) {
    const s = this.scene;
    const P = g.pole;
    P.ropes[i] -= dmg;
    const { rings } = this.ddBasketAt(g, P);
    if (Math.random() < 0.4) s.fx.spark(rings[i][0], rings[i][1] - 6, GOLD);
    if (P.ropes[i] > 0) return;
    s.fx.text(rings[i][0], rings[i][1] - 12, 'PURIT!', 0.6, GOLD);
    s.sfx.bossHit(true);
    if (P.ropes.some((r) => r > 0)) {
      P.dpsi += i ? -2.5 : 2.5; // (hanging by one rope it lurches)
      return;
    }
    const { bx, by, rot } = this.ddBasketAt(g, P);
    P.mode = 'drop';
    P.mt = 0;
    P.drop = { x: bx, y: by, vy: -20, rot, splash: false };
    s.score.add(1000 * s.score.mult);
  },

  // ---------------------------------------------------------------- phase 3: sunset
  ddToDusk(g) {
    const s = this.scene;
    this.phaseBreak(g, g.x, g.by, 3, 'ZACHÓD SŁOŃCA');
    g.wear = 2;
    g.act = null;
    g.timer = 1.6;
    g.plan = 0;
    // the pole, the basket and his left arm go into the lake
    const P = g.pole;
    if (P) {
      const mid = [g.x + DD.neck[0] + Math.cos(P.phi) * POLE.mid, g.by + DD.neck[1] + Math.sin(P.phi) * POLE.mid];
      this.ddBit(g, 'dd_pole', mid[0], mid[1], { rot: P.phi, vr: P.side * 0.8 });
      if (P.mode !== 'drop') {
        const { bx, by, rot } = this.ddBasketAt(g, P);
        this.ddBit(g, P.full ? 'dd_basket_full' : 'dd_basket_empty', bx, by, { rot, vr: 1.2 });
      }
      g.pole = null;
    }
    const L = g.arms.l;
    const [px, py] = [g.x - DD.shoulder, g.by];
    this.ddBit(g, `dd_arm_${L.hand}_1`, px, py, { rot: L.a, oy: DD.pivot, vr: 1.4, vy: -30 });
    L.gone = true;
    this.arm(g, 'l', 0, 4, 'open');
    this.arm(g, 'r', 0, 4, 'open');
    this.ddFace(g, 'roar', 1.4);
    SAY(s, g.x - 40, g.by + 4, 'GARAGARA...', 0.9, 0xd8c8b0);
    s.cameras.main.shake(600, 0.01);
  },

  /** He sweeps the mist off the water with his hand and throws it at the ship: walls of it, a narrow gap in each. */
  ddMist(g, a, once) {
    const s = this.scene;
    const M = DAIDARA.mist;
    const walls = rules().volley < 1 ? 2 : M.walls;
    const k = Math.floor(a.t / M.every);
    const at = a.t - k * M.every;
    if (k >= walls) {
      this.arm(g, 'r', 0, 4, 'open');
      if (a.t > walls * M.every + 0.4) this.ddDone(g, 0.8);
      return;
    }
    const dir = k % 2 ? 1 : -1; // (right to left, then back)
    if (once(`w${k}`, 0)) {
      a.gap = Phaser.Math.Clamp(s.player.x + (Math.random() - 0.5) * 70, 24, VIEW.width - 24);
      a.next = 0;
      SAY(s, g.x + 30, g.W + 12, 'FUUU...', 0.7, 0xe8e8ff);
    }
    const q = Math.min(1, at / M.sweep);
    this.arm(g, 'r', dir < 0 ? 1.5 - q * 1.5 : q * 1.5, 9, 'open');
    if (!this.canFire(g.body) || q >= 1) return;
    // along the water, from one edge to the other as the hand goes
    while (a.next <= q) {
      const x = dir < 0 ? VIEW.width - 4 - a.next * (VIEW.width - 8) : 4 + a.next * (VIEW.width - 8);
      a.next += M.step / (VIEW.width - 8);
      if (Math.abs(x - a.gap) < M.gap / 2) continue;
      s.bullets.shot('eb_steam_0', x, g.W + 8, DOWN, M.speed, 2.2, { grow: { r0: 2.2, r1: 5, t: 0.9, drag: 0, frames: ['eb_steam_0', 'eb_steam_1'] } });
    }
  },

  /** Hand and stump raised over the lake (red rings where they will come down), slammed on the water: rings of waves. */
  ddSlam(g, a, once) {
    const s = this.scene;
    const S = DAIDARA.slam;
    const warn = S.warn * rules().warn;
    a.points ??= [g.x - 46, g.x + 46];
    if (once('up', 0)) {
      this.arm(g, 'l', 2.6, 3);
      this.arm(g, 'r', 2.6, 3, 'grip');
      this.ddFace(g, 'roar', warn);
      SAY(s, g.x, g.by - 40, 'NUOOO!', 1, 0xffd8a0);
    }
    if (once('down', warn)) {
      this.arm(g, 'l', 0.6, 16);
      this.arm(g, 'r', 0.6, 16, 'grip');
    }
    if (once('hit', warn + 0.12)) {
      g.shake = 0.6;
      s.cameras.main.shake(450, 0.012);
      s.sfx.explode('m');
      for (const x of a.points) {
        for (let i = 0; i < 10; i++) s.fx.puff('splash', x + (Math.random() - 0.5) * 30, g.W + 4 + Math.random() * 8, 0.5);
        s.fx.shockwave(x, g.W + 6, 0xd8f0ff);
      }
      SAY(s, g.x, g.W + 20, 'ZBAAN!', 1.2, 0xd8f0ff);
    }
    for (let r = 0; r < S.rings; r++) {
      if (!once(`ring${r}`, warn + 0.12 + r * 0.35) || !this.canFire(g.body)) continue;
      const n = volley(S.n);
      for (const [j, x] of a.points.entries()) {
        const off = (r * 0.5 + j * 0.25) * (TAU / n);
        for (let i = 0; i < n; i++) {
          const ang = off + (i / n) * TAU;
          if (Math.sin(ang) < -0.2) continue; // (waves on the water: none back up into him)
          s.bullets.shot('eb_pearl', x, g.W + 6, ang, slow * (1 + r * 0.12), 2);
        }
      }
    }
    if (once('open', warn + 0.6)) {
      // spent: the fissure in his chest shines
      this.arm(g, 'l', 0.2, 3);
      this.arm(g, 'r', 0.2, 3, 'open');
      g.open = DAIDARA.open.time;
      this.ddFace(g, 'blink', 0.5);
      if ((g.said.open = (g.said.open ?? 0) + 1) <= 2) SAY(s, g.x, g.by + 28, 'SZCZELINA ODSŁONIĘTA!', 1.3, SAFE);
      SAY(s, g.x, g.by - 30, 'HAA... HAA...', 0.8, 0xffffff);
    }
    if (a.t > warn + 0.6) this.ddDone(g, DAIDARA.open.time + 0.4);
  },

  // ---------------------------------------------------------------- what falls off him
  ddBit(g, frame, x, y, o = {}) {
    const sp = this.segPool.spawn(frame, x, y).setDepth(BASE + 0.02).setRotation(o.rot ?? 0).setOrigin(0.5, o.oy ?? 0.5);
    g.bits.push({ sp, vx: o.vx ?? (Math.random() - 0.5) * 20, vy: o.vy ?? -10, vr: o.vr ?? 0, t: 0 });
  },

  ddBits(g, dt) {
    const s = this.scene;
    for (const b of g.bits) {
      b.t += dt;
      b.vy += 300 * dt;
      b.sp.x += b.vx * dt;
      b.sp.y += b.vy * dt;
      b.sp.rotation += b.vr * dt;
      if (b.sp.y > g.W + 6 && !b.splash) {
        b.splash = true;
        b.vy = 12; // (it goes under, not on down the screen)
        b.vx *= 0.2;
        for (let i = 0; i < 8; i++) s.fx.puff('splash', b.sp.x + (Math.random() - 0.5) * 30, g.W + 4, 0.5);
        SAY(s, b.sp.x, g.W - 6, 'ZABUN!', 0.8, 0xd8f0ff);
      }
      // (into the lake: the water hides it)
      if (b.splash) {
        b.vy = Math.min(b.vy, 12);
        b.sp.setAlpha(Math.max(0, b.sp.alpha - dt * 5));
      }
      if (b.sp.alpha <= 0) {
        b.gone = true;
        this.ddKill(b.sp);
      }
    }
    g.bits = g.bits.filter((b) => !b.gone);
  },

  // ---------------------------------------------------------------- touch, warnings
  /** Is (px, py) on him (the shots' and the ship's test)? His trunk, his shoulders and head, above the water. */
  ddBodyAt(g, px, py, r = 0) {
    if (py > g.W + r) return false;
    const [x, y] = [g.x, g.by];
    const ell = (cx, cy, rx, ry) => ((px - x - cx) / (rx + r)) ** 2 + ((py - y - cy) / (ry + r)) ** 2 < 1;
    return ell(0, 18, 38, 40) || ell(0, -10, 50, 18) || ell(0, -30, 16, 18);
  },

  ddTouch(g) {
    const s = this.scene;
    const p = s.player;
    if (g.state !== 'fight' || !p.alive || s.bombClear > 0) return;
    if (this.ddBodyAt(g, p.x, p.y, 1)) p.hit();
  },

  /** The open hand's and the open fissure's mint rings, the ropes lit gold. */
  ddTele(g) {
    const ink = this.tele;
    if (g.hand && g.state === 'fight') {
      const [hx, hy] = this.ddHand(g, g.hand);
      const r = DAIDARA.hand.r + Math.sin(g.t * 12) * 1.2;
      ink.lineStyle(2, SAFE, 0.9).strokeCircle(hx, hy + 4, r);
    }
    const open = g.stun > 0 || g.open > 0;
    if (open && g.state === 'fight') {
      const [cx, cy] = [g.x + DD.core[0], g.by + DD.core[1]];
      const r = 14 + Math.sin(g.t * 10) * 1.5;
      ink.lineStyle(2, SAFE, 0.9).strokeEllipse(cx, cy, r * 1.3, r * 2.6);
      ink.lineStyle(1, 0xffffff, 0.5).strokeEllipse(cx, cy, r * 1.3 + 6, r * 2.6 + 6);
    }
    const P = g.pole;
    if (P && P.mode !== 'drop' && P.alpha > 0) {
      const [tx, ty] = P.tip ?? this.ddTip(g, P);
      const { rings } = this.ddBasketAt(g, P);
      P.ropes.forEach((hp, i) => {
        if (hp <= 0) return;
        const k = hp / DAIDARA.basket.rope;
        const lit = P.mode === 'hold' ? 0.7 + Math.sin(g.t * 8 + i) * 0.3 : 0.45;
        ink.lineStyle(2.5, GOLD, 0.35 * lit * P.alpha).lineBetween(tx, ty, rings[i][0], rings[i][1]);
        ink.lineStyle(1, k > 0.4 ? 0xfff0b0 : 0xffa060, lit * P.alpha).lineBetween(tx, ty, rings[i][0], rings[i][1]);
      });
    }
  },

  // ---------------------------------------------------------------- putting him together
  /** The list of parts, back to front, and the sprites put there (ddSync). */
  ddDraw(g) {
    const L = [];
    const put = (key, frame, x, y, o) => L.push({ key, frame, x, y, o });
    const [x, y] = [g.x, g.by];
    const dusk = g.stage === 3;
    const w = dusk ? 'dusk' : Math.min(1, g.wear);
    const crop = g.sink > 0 ? g.W : null;
    if (dusk) {
      // the sun going down behind him: lower as he weakens
      const frac = Math.max(0, g.body.hp / g.body.maxHp);
      const sy = y - 84 + (1 - frac / DAIDARA.phase[1]) * 84; // (over his head at first, behind his chest at the end)
      put('glow', 'glow', x, sy, { a: 0.45 * g.sun, sx: 2.6, add: true, tint: 0xff8a3a });
      put('sun', 'dd_sun', x, sy, { a: g.sun });
    }
    for (const A of Object.values(g.arms)) {
      const frame = A.gone ? (dusk ? 'dd_stump_dusk' : 'dd_stump') : `dd_arm_${A.hand}_${w}`;
      put(`arm_${A.side}`, frame, x + A.sx * DD.shoulder, y, { oy: DD.pivot, rot: -A.sx * A.a, flip: A.sx > 0, crop });
    }
    put('body', dusk ? 'dd_body_dusk' : `dd_body_${g.wear}`, x, y, { crop });
    if (g.face) put('face', dusk ? `dd_face_${g.face}_dusk` : `dd_face_${g.face}`, x, y, { crop });
    if ((g.stun > 0 || g.open > 0) && g.state === 'fight') put('core', `dd_core_${Math.floor(g.t * 6) % 2}`, x, y, { a: 0.7 + Math.sin(g.t * 10) * 0.3, add: true });
    const P = g.pole;
    if (P) {
      const [nx, ny] = [x + DD.neck[0], y + DD.neck[1]];
      put('pole', 'dd_pole', nx + Math.cos(P.phi) * POLE.mid, ny + Math.sin(P.phi) * POLE.mid, { rot: P.phi + (Math.abs(P.phi) > Math.PI / 2 ? Math.PI : 0) });
      if (P.mode === 'drop') put('basket', 'dd_basket_empty', P.drop.x, P.drop.y, { rot: P.drop.rot, a: P.drop.splash ? 0 : 1 });
      else {
        const { bx, by, rot } = this.ddBasketAt(g, P);
        put('basket', P.full ? 'dd_basket_full' : 'dd_basket_empty', bx, by, { rot, a: P.alpha });
      }
    }
    this.ddSync(g, L);
  },

  /** Puts each part's sprite where the list says, in its order; parts no longer listed go back to the pool. */
  ddSync(g, L) {
    const seen = new Set();
    L.forEach((it, i) => {
      const o = it.o ?? {};
      const body = it.key === 'body';
      let sp = body ? g.body : g.sp[it.key];
      if (!sp) sp = g.sp[it.key] = this.segPool.spawn(it.frame, it.x, it.y);
      else if (sp.frame.name !== it.frame && sp.texture.has(it.frame)) sp.setFrame(it.frame);
      const z = BASE + i * 0.0002;
      if (sp.depth !== z) sp.setDepth(z);
      const oy = o.oy ?? 0.5;
      if (sp.originX !== 0.5 || sp.originY !== oy) sp.setOrigin(0.5, oy);
      const sx = o.sx ?? 1;
      sp.setPosition(it.x, it.y).setScale(sp.base * sx).setRotation(o.rot ?? 0).setAlpha(o.a ?? 1).setFlipX(!!o.flip).setVisible(true);
      const blend = o.add ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL;
      if (sp.blendMode !== blend) sp.setBlendMode(blend);
      if (o.tint != null) sp.setTint(o.tint);
      else if (sp.isTinted) sp.clearTint();
      this.ddCrop(sp, o.crop ?? null);
      seen.add(it.key);
    });
    for (const k of Object.keys(g.sp)) {
      if (seen.has(k)) continue;
      this.ddKill(g.sp[k]);
      delete g.sp[k];
    }
  },

  /** Hides what of a sprite is under the waterline `cut` (rising out of the lake, sinking into it); null shows it all. */
  ddCrop(sp, cut) {
    const f = sp.frame;
    const [fw, fh] = [f.realWidth, f.realHeight];
    if (cut == null) {
      if (sp.isCropped) sp.setCrop();
      return;
    }
    const k = Math.abs(sp.scaleY); // (the body's copy going down is a plain sprite: no pool's base)
    const top = sp.y - sp.originY * fh * k;
    const h = Phaser.Math.Clamp(Math.round((cut - top) / k), 0, fh);
    if (h >= fh) {
      if (sp.isCropped) sp.setCrop();
    } else sp.setCrop(0, 0, fw, h);
  },

  ddKill(sp) {
    if (!sp || sp.dead) return;
    if (sp.isCropped) sp.setCrop();
    sp.setRotation(0).setOrigin(0.5, 0.5).setAlpha(1).setFlipX(false).setFlipY(false).clearTint().setBlendMode(Phaser.BlendModes.NORMAL);
    this.segPool.kill(sp);
  },

  // ---------------------------------------------------------------- shots
  /** What he lays open, for the homing orbs (Enemies.nearest): the cupped hand, the ropes, the open fissure. */
  ddMarks(g) {
    if (g.state !== 'fight') return [];
    const out = [];
    if (g.hand) {
      const [hx, hy] = this.ddHand(g, g.hand);
      out.push({ x: hx, y: hy + 4 });
    }
    const P = g.pole;
    if (P && P.mode === 'hold') {
      const [tx, ty] = P.tip ?? this.ddTip(g, P);
      const { rings } = this.ddBasketAt(g, P);
      P.ropes.forEach((hp, i) => hp > 0 && out.push({ x: (tx + rings[i][0]) / 2, y: (ty + rings[i][1]) / 2 }));
    }
    if (g.stun > 0 || g.open > 0) out.push({ x: g.x + DD.core[0], y: g.by + DD.core[1] });
    return out;
  },

  /**
   * A shot reaching him: a rope of the basket (it frays and parts; the basket lets shots by), the hand cupped in the lake
   * (mint: it hurts him), his body: his earth lets a little through, the fissure while open a lot (mint); what is
   * under the water is out of reach. (Enemies.bossDeviceHit)
   */
  ddShot(shot) {
    const g = this.bossGroup;
    if (!g || g.kind !== 'daidara' || g.defeated) return false;
    const e = g.body;
    if (e.dead || e.hp <= 0) return false;
    const s = this.scene;
    const r = shot.radius;
    const P = g.pole;
    if (P && P.mode !== 'drop' && P.alpha >= 1 && g.state === 'fight') {
      const [tx, ty] = P.tip ?? this.ddTip(g, P);
      const { rings } = this.ddBasketAt(g, P);
      for (let i = 0; i < 2; i++) {
        if (P.ropes[i] <= 0) continue;
        const [x1, y1] = rings[i];
        const [dx, dy] = [x1 - tx, y1 - ty];
        const q = Phaser.Math.Clamp(((shot.x - tx) * dx + (shot.y - ty) * dy) / (dx * dx + dy * dy || 1), 0, 1);
        // (a shot flies several px a frame: the rope is hit within a little more than its width)
        if (Math.hypot(shot.x - (tx + dx * q), shot.y - (ty + dy * q)) < 2.5 + r) {
          this.ddRopeHit(g, i, shot.damage);
          return true;
        }
      }
    }
    if (g.hand && g.state === 'fight') {
      const [hx, hy] = this.ddHand(g, g.hand);
      if (Math.hypot(shot.x - hx, shot.y - hy - 4) < DAIDARA.hand.r + r) {
        this.damage(e, shot.damage * DAIDARA.hand.take);
        if (Math.random() < 0.5) s.fx.spark(shot.x, shot.y - 2, SAFE);
        return true;
      }
    }
    if (!this.ddBodyAt(g, shot.x, shot.y, r)) return false;
    if (g.state !== 'fight') {
      if (Math.random() < 0.3) s.fx.spark(shot.x, shot.y - 2, 0xd8c8b0);
      return true;
    }
    // (shots come up from below and meet his belly first: one in the fissure's column goes into it while it is open)
    const open = (g.stun > 0 || g.open > 0) && Math.abs(shot.x - (g.x + DD.core[0])) < 11 + r;
    this.damage(e, shot.damage * (open ? (g.stun > 0 ? DAIDARA.stun.take : DAIDARA.open.take) : DAIDARA.armour));
    if (open) {
      if (Math.random() < 0.5) s.fx.spark(shot.x, shot.y - 2, SAFE);
    } else if (Math.random() < 0.25) s.fx.part(s.fx.parts, 'dot_1', shot.x, shot.y - 2, { vx: (Math.random() - 0.5) * 40, vy: 20, g: 160, life: 0.3 }).setTint(0x8a6a44);
    return true;
  },

  /** No hit, nor a bomb, takes him past the next phase's threshold before that phase has begun (Enemies.damage). */
  ddCap(e, amount) {
    const g = e.group;
    if (e.role !== 'body' || g.stage >= 3) return amount;
    return Math.min(amount, Math.max(0, e.hp - (e.maxHp * DAIDARA.phase[g.stage - 1] - 0.5)));
  },

  // ---------------------------------------------------------------- the end
  ddCleanup(g) {
    for (const sp of Object.values(g.sp)) this.ddKill(sp);
    g.sp = {};
    for (const k of g.clods) this.segPool.kill(k.sp);
    for (const b of g.bits) this.ddKill(b.sp);
    Object.assign(g, { clods: [], bits: [], rocks: [], pole: null });
  },

  /** Going down (Enemies.goDown): his parts stay on as they are for the end (ddEnd). */
  ddDown(e) {
    const g = e.group;
    const parts = [];
    for (const [k, sp] of Object.entries(g.sp)) parts.push({ k, sp, ox: sp.x - g.x, oy: sp.y - g.by, rot0: sp.rotation, a0: sp.alpha, sun: k === 'sun' || k === 'glow', core: k === 'core' });
    g.sp = {};
    return { parts, x: g.x, y: g.by, W: g.W, next: 0, islet: null };
  },

  /**
   * The end: a chain of blasts of earth over him, he goes still, his arms fall, he sits down in the lake and sinks,
   * crumbling, the water closing over him; where he was an islet comes up with one red maple on it, and stays while
   * the dusk falls. Returns true when it is over.
   */
  ddEnd(d, dt) {
    const s = this.scene;
    const fx = s.fx;
    const D = d.dd;
    const b = d.body;
    const t = d.t;
    if (!D.withBody) {
      D.withBody = true;
      D.parts.unshift({ k: 'body', sp: b, ox: 0, oy: 0, rot0: 0, a0: 1 });
    }
    const W = this.ddWater();
    let [mx, my] = [D.x, D.y];
    if (t < 1.3) {
      mx += Math.round((Math.random() - 0.5) * 3);
      my += Math.round((Math.random() - 0.5) * 3);
      if ((D.next -= dt) <= 0) {
        D.next = 0.12;
        fx.explode(D.x + (Math.random() - 0.5) * 90, D.y + (Math.random() - 0.5) * 80, Math.random() < 0.3 ? 'm' : 's', null, (D.n = (D.n ?? 0) + 1) % 3 !== 0);
        for (let i = 0; i < 4; i++) fx.part(fx.parts, 'dot_1', D.x + (Math.random() - 0.5) * 80, D.y + (Math.random() - 0.5) * 60, { vx: (Math.random() - 0.5) * 80, vy: -40 - Math.random() * 40, g: 200, life: 0.6 }).setTint(0x8a6a44);
      }
    }
    // he sits down in the lake and sinks, the water closing over him
    const q = Phaser.Math.Clamp((t - 1.3) / 3.4, 0, 1);
    my += ease(q) * 104;
    if (q > 0 && q < 1) {
      if (Math.random() < dt * 24) fx.puff('splash', D.x + (Math.random() - 0.5) * 110, W + 3, 0.5);
      if (Math.random() < dt * 10) fx.smoke(D.x + (Math.random() - 0.5) * 80, W - 6, 1, 4);
      if (!D.said) {
        D.said = true;
        fx.text(D.x, W + 24, 'ZUZUZUZU...', 1.6, 0xd8c8b0);
        s.cameras.main.shake(1800, 0.005);
      }
    }
    const flash = t < 1.3 && Math.floor(t * 14) % 2;
    const limp = Math.min(1, t / 1.3);
    for (const p of D.parts) {
      const sp = p.sp;
      if (p.sun) {
        // the sun goes on down behind the hills
        sp.setPosition(mx + p.ox, D.y + p.oy + t * 16).setAlpha(p.a0 * Math.max(0, 1 - t / 3));
        continue;
      }
      if (p.core) {
        sp.setAlpha(Math.max(0, 1 - t / 0.6));
        continue;
      }
      // (the arms fall to his sides first, so they can be hidden under the water upright)
      sp.setPosition(mx + p.ox, my + p.oy).setRotation(p.rot0 * (1 - limp));
      this.ddCrop(sp, q > 0 ? W : null);
      if (flash) sp.setTint(0x707070).setTintMode(Phaser.TintModes.ADD);
      else if (sp.isTinted) sp.clearTint();
    }
    // the islet he becomes, one red maple on it
    if (t > 3.4 && !D.islet) {
      D.islet = this.segPool.spawn('dd_islet', D.x, W - 10.8).setDepth(BASE - 0.01).setAlpha(0);
      fx.text(D.x, W - 40, '...', 1.2, 0xffffff);
    }
    if (D.islet) {
      D.islet.setPosition(D.x, W - 10.8).setAlpha(Math.min(1, (t - 3.4) / 1.4));
      if (t < 5.5 && Math.random() < dt * 8) fx.part(fx.parts, 'dot_1', D.x + 2 + (Math.random() - 0.5) * 20, W - 26, { vx: (Math.random() - 0.5) * 30, vy: -10, g: 30, drag: 0.5, life: 1.4 }).setTint(Math.random() < 0.5 ? 0xe8402a : 0xffa040);
    }
    if (t < DAIDARA.outro) return false;
    for (const p of D.parts) if (p.sp !== b) this.ddKill(p.sp);
    if (b.isCropped) b.setCrop();
    if (D.islet) this.ddKill(D.islet);
    return true;
  },
};
