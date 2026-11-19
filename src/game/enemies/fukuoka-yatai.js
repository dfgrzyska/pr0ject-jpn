// Fukuoka's miniboss (docs/plan-fukuoka.md, 6.1): YATAI-OBAKE, the food stall that will not close. Methods of
// Enemies (mixed in like the cities'). A heavy with "hold": the scroll stops over Nakasu's bank of the Naka at night
// and the fight is there. The stall keeps its place in strip terms (u) and is drawn where that is on the screen, so
// it stays on its streets while the scroll eases to a stop, and after it.
// Art: tools/art/fukuoka/yatai.mjs (frames yt_*).
import Phaser from 'phaser';
import { DEPTH } from '../../config.js';
import { rules, volley } from '../../difficulty.js';
import { slow, TAU } from './shared.js';

/**
 * Its life, the phases' thresholds, how long it stays, how much quicker it gets as it tires (rush), how much of a
 * shot out of its windows it feels (guard). Ramen: the ladle (how long, its strands of noodles, their links, the gap
 * between them, their wave, the spread), its bowls (how many, how fast, how hard they come back), every how many
 * rounds the noodle ball; the noodle ball (up, hanging, falling into the pot, how long it is stunned). Gyoza: its
 * griddles (how many, how big, the warning, how long they burn), the dumplings (how many, their flight, the patch
 * they burn), the gas valve (how long it shows, how long the stall has its back turned), every how many rounds, how
 * fast it rolls along the bank as it cooks; the hanetsuki flipped out of its pan (its flight, how far short of the
 * ship it breaks up, its dumplings and flakes of crust); the oil off its griddle (how long, how often, its sweep).
 * Shime: the warning of its run, its speed, how many legs a run, a stool every so often, the stool's fuse and burst,
 * how long it pants.
 */
export const YATAI = {
  hp: 960,
  phase: [0.66, 0.33],
  time: 110,
  rush: 0.45,
  guard: [0.25, 0.4, 0.25], // (by phase: at its griddles it is busy, and feels more of what comes in)
  ramen: { ladle: 1.3, strands: 3, links: 9, gap: 0.05, wig: 4.5, wf: 8, spread: 0.42, bowls: 2, bowl: 105, back: 125, every: 3 },
  kaedama: { up: 0.6, hang: 2.1, drop: 0.35, stun: 2.2 },
  gyoza: { griddles: 2, r: 13, warn: 1, live: 0.9, n: 4, fly: 0.95, land: 10, valve: 3.4, back: 3, every: 2, drift: 24 },
  hane: { fly: 0.9, short: 55, n: 7, lace: 8 },
  oil: { time: 1.2, every: 0.055, sweep: 0.75, wf: 5, speed: 1.3 },
  shime: { warn: 1, speed: 120, legs: 2, stool: 0.12, fuse: 0.55, burst: 4, pant: 1.6 },
};

// where it stands on Nakasu's bank (x, u: the row of stalls between the bank road and the houses), the second place
// it rolls to; the streets it runs along at dawn (the bank, Nakasu-dori, the cross streets, the two bridges' ends)
const HOME = [[58, 2745], [58, 2685]];
const DRIFT = [2745, 2795]; // (how far along the bank it rolls as it cooks: from its place up, away from the ship)
export const NODES = { A: [60, 2830], M: [60, 2690], B: [60, 2550], C: [86, 2830], N: [86, 2690], D: [86, 2550], E: [24, 2830], G: [108, 2830], H: [108, 2550], F: [130, 2550] };
export const EDGES = ['AM', 'MB', 'CN', 'ND', 'AC', 'CG', 'BD', 'DH', 'HF', 'AE'];
const NEXT = {};
for (const [a, b] of EDGES) {
  (NEXT[a] ??= []).push(b);
  (NEXT[b] ??= []).push(a);
}
const POT = [-14, -10]; // (its pot of broth, on the roof's corner)
const MOUTH = [0, 8];
const VALVE = [23, 7]; // (beside its right wheel, out from under its armour)
const BODY = [15, 17]; // (the half-size of what shrugs shots off)
const SAFE = 0x81f3cc;
const WARN = 0xff735e;
const GOLD = 0xffd84a;
const BLUE = 0x9ad0ff;
const SAY = (s, x, y, t, c = 0xffffff, size = 0.8) => s.fx.text(x, Phaser.Math.Clamp(y, 16, s.H - 40), t, size, c);
const easy = () => rules().volley < 1;
const ease = (k) => k * k * (3 - 2 * k);

/** The distance from (px, py) to the segment a-b. */
const segDist = ([ax, ay], [bx, by], px, py) => {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Phaser.Math.Clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(px - ax - dx * t, py - ay - dy * t);
};

/**
 * A run along the streets from node `from`: `legs` legs, never straight back, each leg the one that passes nearest
 * the ship (in strip terms: px, pu) give or take a little chance. Returns the nodes' names, `from` first.
 */
export function runPath(from, legs, px, pu, rnd = Math.random) {
  const path = [from];
  let prev = null;
  let at = from;
  for (let i = 0; i < legs; i++) {
    const ways = NEXT[at].filter((n) => n !== prev);
    const pick = (ways.length ? ways : NEXT[at]).map((n) => [n, segDist(NODES[at], NODES[n], px, pu) + rnd() * 24]).sort((a, b) => a[1] - b[1])[0][0];
    path.push(pick);
    prev = at;
    at = pick;
  }
  return path;
}

/** Which way the tow truck comes for it on a street: down from the top (a street along the strip), from the left
 * (the cross street to the Nishi-Nakashima bridge) or from the right (the one to the Gion bridge). */
export function towSide(x, u) {
  const vertical = EDGES.some(([a, b]) => NODES[a][0] === NODES[b][0] && Math.abs(x - NODES[a][0]) < 2 && u <= Math.max(NODES[a][1], NODES[b][1]) + 1 && u >= Math.min(NODES[a][1], NODES[b][1]) - 1);
  if (vertical || !EDGES.some(([a, b]) => NODES[a][1] === NODES[b][1] && Math.abs(u - NODES[a][1]) < 2)) return 'top';
  return Math.abs(u - NODES.A[1]) < 2 ? 'left' : 'right';
}

export const fukuokaYatai = {
  /**
   * A wooden food stall come alive on Nakasu's bank: its noren its fringe and lids, its two red lanterns its eyes,
   * its counter its lip, its stools its teeth; steam off its chimney, a pot of broth boiling on its roof's corner.
   * Three phases:
   * 1. RAMEN: its ladle flings long wavy strands of noodles, its bowls fly out like boomerangs and come back. Now and
   *    then it cries KAEDAMA! and tosses a gold ball of noodles up: shot, it drops into the pot, the broth splashes
   *    over it and it is stunned (mint), else it catches it;
   * 2. GYOZA: rolling to and fro along the bank as it cooks, in turn: it heats griddles on the bank (red zones that
   *    sizzle) and flings dumplings that land as burning patches; it flips a whole pan of hanetsuki gyoza out at the
   *    ship, the ring breaking up short of it into dumplings and flakes of crust; its griddle spits hot oil in a
   *    sweeping fan. Every other round a gold gas valve shows at its side: shot, it flares and the stall turns its back
   *    (mint);
   * 3. SHIME (closing): dawn. It runs off along the streets and bridges on lanes flagged red, its stools dragged
   *    behind it bursting into shots; after each run it stands panting, its noren lifted (mint).
   * Out of its windows it feels a fifth of every shot. The less life it has, the quicker it goes. Beaten: it gets
   * light, it dozes off CLOSED, and a little truck backs up to it and tows it home, steam still rising off its pot.
   */
  spawnYatai(e) {
    const s = this.scene;
    const g = (e.yatai = {
      t: 0, act: 'enter', at: 0, x: HOME[0][0], u: s.parallax.stripU(-34), home: 0, pace: 1, open: false, round: 0,
      strands: [], ball: null, valve: null, gyoza: [], hane: [], stools: [], path: null, leg: 0, node: null, said: false, dawn: 0,
    });
    Object.assign(e, { stage: 1, radius: 16 });
    e.setDepth(DEPTH.air - 0.09);
    g.shadow = this.segPool.spawn('yt_shadow', g.x, -20).setDepth(DEPTH.ground + 0.6);
    g.light = s.add.rectangle(90, s.H / 2, 180, s.H, 0xffb070, 0).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.ground + 0.9);
    return e;
  },

  yatai(e, dt) {
    const g = e.yatai;
    if (!g) return;
    const s = this.scene;
    g.t += dt;
    g.at += dt;
    const frac = e.hp / e.maxHp;
    g.pace = 1 + YATAI.rush * (1 - frac);
    if (e.state === 'leave') this.ytLeave(e, g, dt);
    else if (e.state === 'enter') {
      // it rolls down the bank to its place
      const [, hu] = HOME[0];
      g.u = Math.max(hu, g.u - dt * 60);
      if (g.u <= hu) {
        e.state = 'fight';
        this.ytAct(g, 'idle');
        SAY(s, g.x, s.parallax.screenY(g.u) - 30, 'IRASSHAI!', 0xffe0a0, 1);
        s.sfx.shout?.();
      }
    } else {
      g.fight = (g.fight ?? 0) + dt;
      if (g.fight > YATAI.time && !g.going) this.ytGiveUp(e, g);
      else if (e.stage === 1 && frac < YATAI.phase[0]) this.ytToGyoza(e, g);
      else if (e.stage === 2 && frac < YATAI.phase[1]) this.ytToShime(e, g);
      if (e.state !== 'fight') {
        // (given up: on its way)
      } else if (e.stage === 1) this.ytRamen(e, g, dt);
      else if (e.stage === 2) this.ytGyoza(e, g, dt);
      else this.ytShime(e, g, dt);
    }
    this.ytStrands(e, g, dt);
    this.ytBall(e, g, dt);
    this.ytValve(e, g, dt);
    this.ytFlights(e, g, dt);
    this.ytHanes(e, g, dt);
    this.ytStools(e, g, dt);
    this.ytPlace(e, g, dt);
  },

  ytAct(g, act) {
    Object.assign(g, { act, at: 0, said: false });
  },

  /** Where it is on the screen now. */
  ytY(g) {
    return this.scene.parallax.screenY(g.u);
  },

  // ---------------------------------------------------------------- phase 1: ramen
  ytRamen(e, g, dt) {
    const s = this.scene;
    const R = YATAI.ramen;
    if (g.act === 'stun') {
      if (g.at > YATAI.kaedama.stun * (easy() ? 1.3 : 1)) this.ytAct(g, 'idle');
      return;
    }
    if (g.act === 'roll') {
      if (this.ytRoll(g, dt)) this.ytAct(g, 'idle');
      return;
    }
    if (g.act === 'idle') {
      if (g.at > 0.6 / g.pace) {
        g.round++;
        if (g.round % 3 === 0) {
          g.home = 1 - g.home;
          this.ytAct(g, 'roll');
        } else this.ytAct(g, 'ladle');
      }
      return;
    }
    if (g.act === 'ladle') {
      // two flicks of the ladle, a fan of wavy strands each
      for (const at of [0.2, 0.75]) {
        if (g.at >= at / g.pace && (g.flick ?? -1) < at) {
          g.flick = at;
          if (this.canFire(e)) this.ytStrands0(e, g, at > 0.5 ? R.spread / 2 : 0);
          s.sfx.creak?.();
        }
      }
      if (g.at > R.ladle / g.pace) {
        g.flick = -1;
        this.ytAct(g, 'bowls');
      }
      return;
    }
    if (g.act === 'bowls') {
      if (!g.said) {
        g.said = true;
        if (this.canFire(e)) this.ytBowls(e, g);
      }
      if (g.at > 0.9 / g.pace) {
        if (g.round % R.every === 2 && !g.ball) this.ytToss(e, g); // (the round before it rolls)
        this.ytAct(g, 'idle');
      }
    }
  },

  /** Roll along the bank to its other place. Returns true when it is there. */
  ytRoll(g, dt) {
    const [, tu] = HOME[g.home];
    const d = tu - g.u;
    g.u += Math.sign(d) * Math.min(Math.abs(d), dt * 40 * g.pace);
    return Math.abs(tu - g.u) < 0.5;
  },

  /** A fan of noodle strands from its mouth at the ship, turned by `off`. */
  ytStrands0(e, g, off) {
    const R = YATAI.ramen;
    const y = this.ytY(g);
    const a = this.aimAt(e, MOUTH[0], MOUTH[1]) + off;
    const n = volley(R.strands);
    for (let i = 0; i < n; i++) g.strands.push({ x: g.x + MOUTH[0], y: y + MOUTH[1], a: a + (n > 1 ? (i / (n - 1) - 0.5) * 2 * R.spread : 0), left: R.links, next: 0, side: i % 2 ? -1 : 1 });
  },

  /** The strands going out, a link of noodle at a time: each a stationary wave moving out from its mouth. */
  ytStrands(e, g, dt) {
    const s = this.scene;
    const R = YATAI.ramen;
    for (const st of g.strands) {
      st.next -= dt;
      while (st.next <= 0 && st.left > 0) {
        st.next += R.gap;
        st.left--;
        if (this.canFire(e)) s.bullets.shot('yt_noodle', st.x, st.y, st.a, slow * 1.15, 1.6, { wig: R.wig * st.side, wf: R.wf });
      }
    }
    g.strands = g.strands.filter((st) => st.left > 0);
  },

  /** Its bowls out like boomerangs, one to each side, curving round and back to it. */
  ytBowls(e, g) {
    const s = this.scene;
    const R = YATAI.ramen;
    const y = this.ytY(g);
    const n = volley(R.bowls);
    const a0 = this.aimAt(e, 0, 4);
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? -1 : 1;
      const a = a0 + side * (0.35 + Math.floor(i / 2) * 0.3);
      const v = R.bowl;
      const back = R.back;
      const turn = v / back;
      s.bullets.shot(`yt_bowl_${i & 1}`, g.x + side * 10, y + 4, a, v, 4, {
        ax: -Math.cos(a) * back - Math.sin(a) * side * 40, ay: -Math.sin(a) * back + Math.cos(a) * side * 40, life: (turn * 2 + 0.15) / rules().bulletSpeed,
      });
    }
    s.sfx.crock?.();
  },

  /** KAEDAMA!: the gold noodle ball tossed up over its pot. */
  ytToss(e, g) {
    const s = this.scene;
    const y = this.ytY(g);
    g.ball = { act: 'up', at: 0, x: g.x + POT[0], y: y + POT[1], from: [g.x + POT[0], y + POT[1]], sp: this.segPool.spawn('yt_kaedama_0', g.x + POT[0], y + POT[1]).setDepth(DEPTH.air - 0.08) };
    SAY(s, g.x, y - 34, 'KAEDAMA!', GOLD, 1);
    s.sfx.kaedama?.();
  },

  /** The noodle ball: up, hanging there turning gold, then back into the pot (caught; or, shot, splashing). */
  ytBall(e, g, dt) {
    const b = g.ball;
    if (!b) return;
    const s = this.scene;
    const K = YATAI.kaedama;
    b.at += dt;
    const y = this.ytY(g);
    const pot = [g.x + POT[0], y + POT[1]];
    const top = [g.x - 27, y - 26]; // (out to its side, where a shot can get at it past the stall)
    if (b.act === 'up') {
      const k = Math.min(1, b.at / K.up);
      b.x = b.from[0] + (top[0] - b.from[0]) * k;
      b.y = b.from[1] + (top[1] - b.from[1]) * (1 - (1 - k) ** 2);
      if (k >= 1) Object.assign(b, { act: 'hang', at: 0 });
    } else if (b.act === 'hang') {
      b.x = top[0] + Math.sin(b.at * 3) * 2;
      b.y = top[1] + Math.sin(b.at * 5) * 1.5;
      this.tele.lineStyle(2, GOLD, 0.45 + 0.35 * Math.sin(b.at * 14)).strokeCircle(b.x, b.y, 8);
      if (b.at > K.hang * (easy() ? 1.3 : 1) || e.stage !== 1 || e.state !== 'fight') Object.assign(b, { act: 'fall', at: 0, from: [b.x, b.y], hit: false });
    } else {
      const k = Math.min(1, b.at / (b.hit ? K.drop : 0.5));
      b.x = b.from[0] + (pot[0] - b.from[0]) * k;
      b.y = b.from[1] + (pot[1] - b.from[1]) * k * k;
      if (k >= 1) {
        this.segPool.kill(b.sp);
        g.ball = null;
        if (b.hit && e.stage === 1 && e.state === 'fight') {
          // into the pot: the broth splashes over it
          this.ytAct(g, 'stun');
          s.sfx.splash?.();
          SAY(s, pot[0], pot[1] - 18, 'BASHA!', 0xfff0d0, 0.9);
          for (let i = 0; i < 14; i++) s.fx.part(s.fx.parts, 'dot_1', pot[0] + (Math.random() - 0.5) * 8, pot[1], { vx: (Math.random() - 0.5) * 140, vy: -60 - Math.random() * 90, g: 300, life: 0.6 }).setTint(i % 3 ? 0xf0d8a0 : 0xfff8e8);
          s.fx.smoke(pot[0], pot[1] - 4, 2, 4, true);
        } else if (e.state === 'fight') SAY(s, pot[0], pot[1] - 16, 'ZURURU~', 0xffe0a0, 0.6);
        return;
      }
    }
    b.sp.setPosition(b.x, b.y).setFrame(`yt_kaedama_${Math.floor(g.t * 8) & 1}`);
  },

  // ---------------------------------------------------------------- phase 2: gyoza
  ytToGyoza(e, g) {
    const s = this.scene;
    this.phaseBreak(e, g.x, this.ytY(g), 2, 'GYOZA');
    g.strands = [];
    if (g.ball) Object.assign(g.ball, { act: 'fall', at: 0, from: [g.ball.x, g.ball.y], hit: false });
    g.round = 0;
    this.ytAct(g, 'idle');
    SAY(s, g.x, this.ytY(g) - 34, 'JUU JUU!', 0xffb070, 1);
  },

  ytGyoza(e, g, dt) {
    const s = this.scene;
    const G = YATAI.gyoza;
    if (g.act === 'back') {
      if (g.at > G.back * (easy() ? 1.3 : 1)) this.ytAct(g, 'idle');
      return;
    }
    // it rolls along the bank as it cooks, up from its place and back
    if (g.act !== 'idle') {
      g.drift ??= 1;
      const tu = DRIFT[g.drift];
      const d = tu - g.u;
      g.u += Math.sign(d) * Math.min(Math.abs(d), dt * G.drift * g.pace);
      if (Math.abs(tu - g.u) < 0.5) g.drift = 1 - g.drift;
    }
    if (g.act === 'idle') {
      if (g.at > 0.5 / g.pace) {
        g.round++;
        this.ytAct(g, ['grill', 'hane', 'oil'][(g.round - 1) % 3]);
        if (g.round % G.every === 1 && !g.valve) this.ytShowValve(g);
      }
      return;
    }
    if (g.act === 'hane') {
      // its iron pan turned over: the whole ring of gyoza flipped out at the ship
      if (!g.said && g.at > 0.45 / g.pace) {
        g.said = true;
        if (this.canFire(e)) this.ytHane(g);
        SAY(s, g.x, this.ytY(g) - 34, 'HANETSUKI!', GOLD, 0.8);
        s.sfx.sizzle?.();
      }
      if (g.at > 1.2 / g.pace) this.ytAct(g, 'idle');
      return;
    }
    if (g.act === 'oil') {
      // the griddle spits: hot oil in a fan sweeping to and fro over the ship
      const O = YATAI.oil;
      if (!g.said) {
        g.said = true;
        g.oilAt = 0.3;
        g.oilAim = this.aimAt(e, 6, 6);
        SAY(s, g.x, this.ytY(g) - 34, 'JUWAAA!', 0xffd070, 0.7);
        s.sfx.sizzle?.();
      }
      while (g.at >= g.oilAt / g.pace && g.oilAt < O.time + 0.3) {
        const a = g.oilAim + Math.sin((g.oilAt - 0.3) * O.wf) * O.sweep;
        g.oilAt += O.every;
        if (this.canFire(e)) s.bullets.shot('yt_oil', g.x + 6, this.ytY(g) + 8, a, slow * O.speed, 1.4);
      }
      if (g.at > (O.time + 0.8) / g.pace) this.ytAct(g, 'idle');
      return;
    }
    if (g.act === 'grill') {
      if (!g.said) {
        g.said = true;
        // its griddles heat up on the bank round the ship
        const p = s.player;
        if (this.canFire(e)) {
          const n = volley(G.griddles);
          for (let i = 0; i < n; i++) {
            const x = Phaser.Math.Clamp(p.x + (i - (n - 1) / 2) * 42 + (Math.random() - 0.5) * 10, 14, 166);
            const y = Phaser.Math.Clamp(p.y - (i % 2 ? 26 : 0), 60, s.H - 30);
            s.bullets.zone(x, y, G.r, { warn: G.warn, live: G.live, kind: 'fire', u: s.parallax.stripU(y) });
          }
          s.sfx.sizzle?.();
        }
      }
      if (g.at > 1.2 / g.pace) this.ytAct(g, 'gyoza');
      return;
    }
    if (g.act === 'gyoza') {
      // dumplings flung one by one in arcs, burning where they land
      const n = volley(G.n);
      const each = 0.8 / n;
      const due = Math.min(n, Math.floor(g.at / (each / g.pace)) + 1);
      g.thrown ??= 0;
      while (g.thrown < due) {
        g.thrown++;
        if (this.canFire(e)) this.ytFling(g, g.thrown - 1, n);
      }
      if (g.at > 1.3 / g.pace) {
        g.thrown = 0;
        // and a strand of noodles between
        if (this.canFire(e)) this.ytStrands0(e, g, (Math.random() - 0.5) * 0.4);
        this.ytAct(g, 'idle');
      }
    }
  },

  /** A dumpling flung from its griddle to land near the ship. */
  ytFling(g, i, n) {
    const s = this.scene;
    const p = s.player;
    const y = this.ytY(g);
    const tx = Phaser.Math.Clamp(p.x + (i - (n - 1) / 2) * 30 + (Math.random() - 0.5) * 16, 12, 168);
    const ty = Phaser.Math.Clamp(p.y + (Math.random() - 0.5) * 30 - 6, 70, s.H - 24);
    g.gyoza.push({ x0: g.x + 6, y0: y + 2, tx, ty, t: 0, sp: this.segPool.spawn('yt_gyoza_0', g.x, y).setDepth(DEPTH.air - 0.08) });
  },

  ytFlights(e, g, dt) {
    const s = this.scene;
    const G = YATAI.gyoza;
    for (const f of g.gyoza) {
      f.t += dt;
      const time = G.fly / rules().bulletSpeed;
      const k = Math.min(1, f.t / time);
      const x = f.x0 + (f.tx - f.x0) * k;
      const y = f.y0 + (f.ty - f.y0) * k - Math.sin(k * Math.PI) * 34;
      f.sp.setPosition(x, y).setFrame(`yt_gyoza_${Math.floor(f.t * 10) & 1}`).setRotation(f.t * 7);
      this.tele.lineStyle(1.5, WARN, 0.5 + 0.4 * k).strokeEllipse(f.tx, f.ty, 22 - k * 10, 12 - k * 5);
      if (k >= 1) {
        f.done = true;
        this.segPool.kill(f.sp);
        s.bullets.zone(f.tx, f.ty, G.land, { warn: 0.12, live: 0.8, kind: 'fire', u: s.parallax.stripU(f.ty) });
        s.fx.shards(f.tx, f.ty, 4, true);
      }
    }
    g.gyoza = g.gyoza.filter((f) => !f.done);
  },

  /** The hanetsuki out of its pan: it flies at the ship, spinning, to break up short of it. */
  ytHane(g) {
    const s = this.scene;
    const p = s.player;
    const H = YATAI.hane;
    const y = this.ytY(g);
    const [x0, y0] = [g.x + 6, y + 4];
    const d = Math.hypot(p.x - x0, p.y - y0) || 1;
    const k = Math.max(0.3, (d - H.short) / d);
    const tx = Phaser.Math.Clamp(x0 + (p.x - x0) * k, 24, 156);
    const ty = Phaser.Math.Clamp(y0 + (p.y - y0) * k, 50, s.H - 70);
    g.hane.push({ x0, y0, tx, ty, t: 0, sp: this.segPool.spawn('yt_hane_0', x0, y0).setDepth(DEPTH.air - 0.08) });
  },

  ytHanes(e, g, dt) {
    const s = this.scene;
    const H = YATAI.hane;
    const p = s.player;
    for (const f of g.hane) {
      f.t += dt;
      const time = H.fly / rules().bulletSpeed;
      const k = Math.min(1, f.t / time);
      const q = 1 - (1 - k) ** 2;
      const x = f.x0 + (f.tx - f.x0) * q;
      const y = f.y0 + (f.ty - f.y0) * q - Math.sin(k * Math.PI) * 18;
      f.sp.setPosition(x, y).setFrame(`yt_hane_${Math.floor(f.t * 8) & 1}`).setRotation(f.t * 9).setScale(f.sp.base * (1 + Math.sin(k * Math.PI) * 0.25));
      this.tele.lineStyle(1.5, WARN, 0.5 + 0.4 * k).strokeCircle(f.tx, f.ty, 20 - k * 8);
      if (p.alive && !p.god && p.invulnerable <= 0 && p.entering <= 0 && Math.hypot(p.x - x, p.y - y) < 9) p.hit();
      if (k < 1) continue;
      // it breaks up: the dumplings out in a ring, the flakes of crust slower between them
      f.done = true;
      this.segPool.kill(f.sp);
      s.sfx.crock?.();
      s.fx.shards(f.tx, f.ty, 6, true);
      SAY(s, f.tx, f.ty - 12, 'PARI!', 0xffe0a0, 0.6);
      if (e.state === 'fight' && this.canFire({ type: 'heavy', seen: e.seen, y: f.ty })) {
        const a0 = Math.random() * TAU;
        const n = volley(H.n);
        for (let i = 0; i < n; i++) s.bullets.shot(`yt_gyoza_${i & 1}`, f.tx, f.ty, a0 + (i / n) * TAU, slow * 0.95, 2.6);
        const m = volley(H.lace);
        for (let i = 0; i < m; i++) s.bullets.shot('yt_lace', f.tx, f.ty, a0 + ((i + 0.5) / m) * TAU, slow * 0.7, 1.6);
      }
    }
    g.hane = g.hane.filter((f) => !f.done);
  },

  /** The gold valve on its gas bottle, showing at its side for a while. */
  ytShowValve(g) {
    g.valve = { at: 0, sp: this.segPool.spawn('yt_valve_0', g.x + VALVE[0], this.ytY(g) + VALVE[1]).setDepth(DEPTH.air - 0.085) };
  },

  ytValve(e, g, dt) {
    const v = g.valve;
    if (!v) return;
    v.at += dt;
    const x = g.x + VALVE[0];
    const y = this.ytY(g) + VALVE[1];
    v.sp.setPosition(x, y).setFrame(`yt_valve_${Math.floor(g.t * 6) & 1}`);
    if (!v.shot) this.tele.lineStyle(2, GOLD, 0.45 + 0.35 * Math.sin(v.at * 14)).strokeCircle(x, y, 7);
    if (v.at > YATAI.gyoza.valve * (easy() ? 1.3 : 1) || e.stage !== 2 || e.state !== 'fight' || g.act === 'back') {
      this.segPool.kill(v.sp);
      g.valve = null;
    }
  },

  /** The valve shot: the gas flares and it turns its back. */
  ytFlare(e, g) {
    const s = this.scene;
    const x = g.x + VALVE[0];
    const y = this.ytY(g) + VALVE[1];
    s.sfx.explode('s');
    s.sfx.sizzle?.();
    s.fx.explode(x + 4, y, 's', null, false);
    for (let i = 0; i < 10; i++) s.fx.part(s.fx.parts, 'dot_1', x + 3, y, { vx: 60 + Math.random() * 90, vy: (Math.random() - 0.5) * 70, g: -40, life: 0.45 }).setTint(i % 2 ? 0xffb050 : 0x6ab4ff);
    SAY(s, x + 6, y - 14, 'BOWA!', 0xffb050, 0.8);
    g.valve.shot = true;
    this.ytAct(g, 'back');
  },

  // ---------------------------------------------------------------- phase 3: shime, closing at dawn
  ytToShime(e, g) {
    const s = this.scene;
    this.phaseBreak(e, g.x, this.ytY(g), 3, 'SHIME: ZAMYKANIE');
    g.strands = [];
    // first to the bank road above it, then the runs
    g.path = ['_', 'M'];
    g.pathPts = [[g.x, g.u], NODES.M];
    g.leg = 0;
    g.node = 'M';
    this.ytAct(g, 'aim');
    SAY(s, g.x, this.ytY(g) - 34, 'MOU ASA!?', 0xffe0a0, 1);
  },

  ytShime(e, g, dt) {
    const s = this.scene;
    const S = YATAI.shime;
    const p = s.player;
    g.dawn = Math.min(1, g.dawn + dt / 8);
    if (g.act === 'aim') {
      if (!g.path) {
        const pts = runPath(g.node, S.legs, p.x, s.parallax.stripU(p.y));
        g.path = pts;
        g.pathPts = pts.map((n) => NODES[n]);
        g.leg = 0;
      }
      // its run flagged: red lanes along the streets
      const pts = g.pathPts.map(([x, u]) => [x, s.parallax.screenY(u)]);
      for (let i = 0; i + 1 < pts.length; i++) {
        const [[ax, ay], [bx, by]] = [pts[i], pts[i + 1]];
        this.tele.lineStyle(14, WARN, 0.1 + 0.08 * Math.sin(g.at * 24)).lineBetween(ax, ay, bx, by);
        this.tele.lineStyle(2, WARN, 0.8).lineBetween(ax, ay, bx, by);
      }
      if (g.at > (S.warn * rules().warn) / g.pace) {
        this.ytAct(g, 'run');
        g.dropAt = 0;
        s.sfx.creak?.();
      }
      return;
    }
    if (g.act === 'run') {
      const [tx, tu] = g.pathPts[g.leg + 1];
      const d = Math.hypot(tx - g.x, tu - g.u);
      const step = dt * S.speed * g.pace * rules().bulletSpeed;
      if (d <= step) {
        [g.x, g.u] = [tx, tu];
        g.leg++;
        if (g.leg + 1 >= g.pathPts.length) {
          g.node = g.path.at(-1);
          g.path = null;
          this.ytAct(g, 'pant');
          SAY(s, g.x, this.ytY(g) - 30, 'HAA... HAA...', SAFE, 0.6);
        }
      } else {
        g.x += ((tx - g.x) / d) * step;
        g.u += ((tu - g.u) / d) * step;
      }
      const y = this.ytY(g);
      if (p.alive && !p.god && p.invulnerable <= 0 && p.entering <= 0 && Math.abs(p.x - g.x) < 15 && Math.abs(p.y - y) < 14) p.hit();
      // its stools, dragged behind it, left on the street to burst
      g.dropAt -= dt;
      if (g.dropAt <= 0) {
        g.dropAt = S.stool;
        g.stools.push({ x: g.x + (Math.random() - 0.5) * 16, u: g.u + (Math.random() - 0.5) * 6, t: 0, sp: this.segPool.spawn('yt_stool', g.x, y).setDepth(DEPTH.ground + 0.7) });
      }
      for (let i = 0; i < 2; i++) s.fx.part(s.fx.parts, 'dot_1', g.x + (i ? 16 : -16), y + 14, { vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, life: 0.4 }).setTint(0x8a8078);
      return;
    }
    if (g.act === 'pant' && g.at > S.pant * (easy() ? 1.4 : 1)) this.ytAct(g, 'aim');
  },

  /** The stools left behind: a moment, then each bursts into a little ring of shots. */
  ytStools(e, g, dt) {
    const s = this.scene;
    const S = YATAI.shime;
    for (const st of g.stools) {
      st.t += dt;
      const y = s.parallax.screenY(st.u);
      st.sp.setPosition(st.x, y).setAlpha(Math.floor(st.t * 14) % 2 && st.t > S.fuse * 0.5 ? 0.6 : 1);
      if (st.t > S.fuse) {
        st.done = true;
        this.segPool.kill(st.sp);
        if (e.state === 'fight' && this.canFire({ type: 'heavy', seen: e.seen, y })) s.bullets.ring(st.x, y, S.burst, Math.random() * TAU, slow * 0.9);
        s.fx.shards(st.x, y, 3, true);
      }
    }
    g.stools = g.stools.filter((st) => !st.done);
  },

  // ---------------------------------------------------------------- the end, either way
  ytGiveUp(e, g) {
    g.going = true;
    e.state = 'leave';
    g.strands = [];
    this.ytAct(g, 'leave');
    SAY(this.scene, g.x, this.ytY(g) - 26, 'MATA DOZO!', 0xffffff, 0.9);
  },

  ytLeave(e, g, dt) {
    g.u += dt * (40 + g.at * 80);
    if (this.ytY(g) < -60) this.remove(e);
  },

  /** The stall, its shadow and its light put together every frame; whether it can be hit now (mint). */
  ytPlace(e, g, dt) {
    const y = this.ytY(g);
    let fr;
    const k = Math.floor(g.t * 5);
    if (g.act === 'stun') fr = `yt_stun_${Math.floor(g.t * 4) & 1}`;
    else if (g.act === 'back') fr = `yt_back_${Math.floor(g.t * 6) & 1}`;
    else if (g.act === 'ladle') fr = `yt_ladle_${g.at > 0.5 / g.pace ? 1 : 0}`;
    else if (g.act === 'grill' || g.act === 'oil' || g.act === 'hane') fr = `yt_grill_${Math.floor(g.t * 6) & 1}`;
    else if (g.act === 'run' || g.act === 'leave' || g.act === 'roll' || g.act === 'enter') fr = `yt_run_${Math.floor(g.t * 8) & 1}`;
    else if (g.act === 'pant') fr = `yt_pant_${Math.floor(g.t * 3) & 1}`;
    else if (g.act === 'bowls' || g.act === 'gyoza' || (g.ball && g.ball.act === 'up')) fr = 'yt_shout';
    else fr = k % 23 === 0 ? 'yt_blink' : `yt_idle_${k & 3}`;
    if (e.frame.name !== fr) e.setFrame(fr);
    e.setPosition(g.x, y);
    g.shadow.setPosition(g.x, y + 14).setAlpha(0.35);
    g.light.setAlpha(0.2 * g.dawn);
    g.open = e.state === 'fight' && (g.act === 'stun' || g.act === 'back' || g.act === 'pant');
    if (g.open) this.tele.lineStyle(2, SAFE, 0.55 + 0.3 * Math.sin(g.t * 12)).strokeEllipse(g.x, y, 44, 42);
    if (g.shrug && (g.shrug -= dt) > 0) this.tele.lineStyle(2, BLUE, 0.7 * (g.shrug / 0.18)).strokeEllipse(g.x, y, 42, 40);
  },

  /** A shot reaching it: the noodle ball, the valve; out of its windows it feels little. (Enemies.bossDeviceHit) */
  yataiShot(shot) {
    const e = this.heavy;
    const g = e?.yatai;
    if (!g || e.dead || e.hp <= 0) return false;
    const s = this.scene;
    const b = g.ball;
    if (b && b.act !== 'fall' && Math.hypot(shot.x - b.x, shot.y - b.y) < 6 + shot.radius) {
      Object.assign(b, { act: 'fall', at: 0, from: [b.x, b.y], hit: true });
      s.fx.spark(b.x, b.y);
      return true;
    }
    const v = g.valve;
    if (v && !v.shot && e.state === 'fight' && Math.hypot(shot.x - v.sp.x, shot.y - v.sp.y) < 5 + shot.radius) {
      this.ytFlare(e, g);
      return true;
    }
    if (!g.open && (e.state === 'fight' || e.state === 'enter') && Math.abs(shot.x - e.x) < BODY[0] + shot.radius && Math.abs(shot.y - e.y) < BODY[1] + shot.radius) {
      g.shrug = 0.18;
      this.damage(e, shot.damage * YATAI.guard[e.stage - 1]);
      if (s.t > (g.funAt ?? 0)) {
        g.funAt = s.t + 1.1;
        SAY(s, shot.x, shot.y - 10, 'KON!', 0xd8e4f4, 0.5);
      }
      return true;
    }
    return false;
  },

  ytCleanup(e) {
    const g = e.yatai;
    if (!g) return;
    if (g.ball) this.segPool.kill(g.ball.sp);
    if (g.valve) this.segPool.kill(g.valve.sp);
    for (const f of g.gyoza) this.segPool.kill(f.sp);
    for (const f of g.hane) this.segPool.kill(f.sp.setRotation(0).setScale(f.sp.base));
    for (const st of g.stools) this.segPool.kill(st.sp);
    this.segPool.kill(g.shadow);
    g.light?.destroy();
    e.yatai = null;
  },

  /** Going down (Enemies.goDown -> yataiEnd): where it is on its street, its light handed on to the end. */
  yataiDown(e) {
    const g = e.yatai;
    const light = g.light;
    g.light = null;
    return { u: g.u, x: g.x, side: towSide(g.x, g.u), light, dawn: g.dawn };
  },

  /**
   * The end: the hits land; then it gets light, it dozes off CLOSED, steam still rising off its pot, and a little
   * truck backs up to it along its street, hitches it and tows it off home. All of it on the map. Returns true when
   * both are off the screen.
   */
  yataiEnd(d, dt) {
    const s = this.scene;
    const nd = d.yt;
    const b = d.body;
    const t = d.t;
    let y = s.parallax.screenY(nd.u);
    nd.light.setAlpha(0.2 * Math.max(nd.dawn, Math.min(1, t / 3)) * (t > 8 ? Math.max(0, 1 - (t - 8) / 3) : 1));
    if (t < 1.1) {
      b.setPosition(nd.x + Math.round((Math.random() - 0.5) * 3), y).setTint(Math.floor(t * 14) % 2 ? 0x707070 : 0x000000).setTintMode(Phaser.TintModes.ADD);
      if ((d.next -= dt) <= 0) {
        d.next = 0.13;
        s.fx.explode(nd.x + (Math.random() - 0.5) * 24, y + (Math.random() - 0.5) * 24, 's', null, false);
      }
      return false;
    }
    if (!nd.asleep) {
      nd.asleep = true;
      b.clearTint().setFrame('yt_sleep');
      SAY(s, nd.x, y - 26, 'ZAMKNIĘTE', 0xffffff, 1);
      nd.steam = 0;
    }
    // the truck: it backs up along the street to the stall, hitches it, and drives off with it in tow
    const [dx, du] = nd.side === 'top' ? [0, 1] : nd.side === 'left' ? [-1, 0] : [1, 0];
    const gap = nd.side === 'top' ? 29 : 31; // (from the stall's middle to the truck's)
    if (!nd.truck && t > 1.8) {
      nd.truck = this.segPool.spawn('yt_truck', 0, 0).setDepth(DEPTH.air - 0.095).setRotation(nd.side === 'top' ? Math.PI / 2 : nd.side === 'left' ? 0 : Math.PI);
      nd.far = nd.side === 'top' ? y + 40 : nd.side === 'left' ? nd.x + 30 : 210 - nd.x;
      nd.go = 0;
    }
    if (nd.truck) {
      const tt = t - 1.8;
      let off;
      if (tt < 1.8) off = gap + nd.far * (1 - ease(tt / 1.8)); // (backing up)
      else {
        if (!nd.hitched) {
          nd.hitched = true;
          s.sfx.creak?.();
          SAY(s, nd.x + dx * gap, s.parallax.screenY(nd.u + du * gap) - 12, 'GACHAN', 0xd8e4f4, 0.6);
        }
        off = gap;
        if (tt > 2.4) {
          nd.go = Math.min(70, nd.go + dt * 40);
          nd.x += dx * nd.go * dt;
          nd.u += du * nd.go * dt;
        }
      }
      y = s.parallax.screenY(nd.u);
      nd.truck.setPosition(nd.x + dx * off, s.parallax.screenY(nd.u + du * off));
    }
    b.setPosition(nd.x, y);
    nd.steam -= dt;
    if (nd.steam <= 0) {
      nd.steam = 0.4;
      s.fx.smoke(nd.x + POT[0], y + POT[1] - 4, 1, 2, true);
    }
    if (t > 1.4 && Math.floor(t * 0.8) !== nd.z && !nd.hitched) {
      nd.z = Math.floor(t * 0.8);
      SAY(s, nd.x + 10, y - 22, 'ZZZ...', 0xd8e4f4, 0.55);
    }
    const gone = y > s.H + 60 || y < -70 || nd.x < -40 || nd.x > 220;
    if (gone || t > 30) {
      if (nd.truck) this.segPool.kill(nd.truck);
      nd.light.destroy();
      return true;
    }
    return false;
  },
};
