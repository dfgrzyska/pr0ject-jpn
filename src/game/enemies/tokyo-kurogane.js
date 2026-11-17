// Tokyo's boss (docs/plan-tokyo.md, 6.3): KUROGANE, the mech of Tokyo Bay. Methods of Enemies (mixed in like the
// cities'). A mech of our own, built like a samurai's armour out of a container port's iron, docked in a crane of the
// terminal at Odaiba (the strip has stopped under it). Its art comes in parts (tools/art/tokyo/kurogane.mjs) that the
// game puts together and moves: KG says where they sit (the parts on the body share its middle: trimmed frames).
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { rules, volley } from '../../difficulty.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * Its life, where it stands on the map (screen y ~ 72 once the strip has stopped), the phases' thresholds, what a hit
 * on its armour gets through in each phase; the fists on their chains (the raw damage that tears one off, how much more
 * a hit on a fist coming back does to its life, the warning, the speed, how long it sticks in the ground, how long it
 * is reeled in, how far it reaches); the rockets; the lantern drones (their life, orbit, fire, how long it is stunned
 * when all are down); the blade (warning, swing, the crescent's shots and spread); the charge; the beam with its safe
 * lanes; the spiral; the grab; the reactor open after each big attack; how long the end takes.
 */
export const KURO = {
  hp: 3000,
  u: 12470,
  phase: [0.6, 0.25],
  armour: [0.2, 0.4, 0.2],
  fist: { hp: 150, take: 3.5, aim: 0.8, speed: 420, stuck: 0.6, reel: 2.4, reach: 330, r: 11 },
  rockets: { n: 6, speed: 190, turn: 5 },
  drones: { n: 4, hp: 26, r: [60, 24], speed: 0.9, fire: [2.1, 3.1], stun: 3 },
  slash: { warn: 0.85, swing: 0.26, n: 9, arc: 1.7 },
  dash: { warn: 0.95, speed: 440, w: 30 },
  beam: { warn: 1.15, live: 1.3, lane: 18 },
  spiral: { dur: 2.8, every: 0.1 },
  grab: { warn: 0.75, out: 0.2, hold: 0.35, back: 0.5 },
  open: { take: 1.6, time: 2.2, chest: 2.2 },
  outro: 7.8,
};

// Where the parts sit, logical px from the body's middle (a copy of KURO_LAYOUT in tools/art/tokyo/kurogane.mjs, which
// the test tokyoKurogane checks), and the change from the crane to flight (KURO_TRANSFORM).
export const KG = {
  kg_gantry_l: [-64.3, 0], kg_gantry_r: [64.3, 0], kg_gantry_top: [0, -50.7], kg_clamp_l: [-44, -20], kg_clamp_r: [44, -20],
  fist_l: [-31.3, 13.3], chain_l: [-50, -54], fist_r: [31.3, 13.3], chain_r: [50, -54], muzzle: [0, -2.7],
  pods: { l: [-32, -21.3], r: [32, -21.3] }, hand_0: [41.3, -29.3], hand_1: [40, 6.7], hand_2: [19.3, 14], katanaOrigin: [0.5, 0.828],
  fan_l: [-17.3, -21.3], fan_r: [17.3, -21.3], core: [0, -4], grab: [-22, -20.7], eyes: [0, -30.7],
};
export const KG_CHANGE = [
  { t: 0, legs: 0, eyes: 'hot', clamp: 0, crane: 0, beam: 0, fans: -1, jet: 0, arms: 'stump', blade: 0 },
  { t: 0.15, clamp: 35 },
  { t: 0.3, clamp: 70, crane: 6, beam: -6 },
  { t: 0.45, crane: 22, beam: -20, legs: 1 },
  { t: 0.6, crane: 48, beam: -40, legs: 2 },
  { t: 0.75, crane: 80, beam: -70, legs: 3, jet: 0.45 },
  { t: 0.9, jet: 1, fans: 0, eyes: 'scan' },
  { t: 1.05, fans: 1, arms: 'bare' },
  { t: 1.2, fans: 2, blade: 0.5 },
  { t: 1.35, fans: 3, blade: 1 },
  { t: 1.5 },
];
const CHANGE = (() => {
  let st = {};
  return KG_CHANGE.map((k) => (st = { ...st, ...k }));
})();

/** The change at time t: numbers eased between key frames, frames (legs, fans, eyes, arms) held. */
export function changeAt(t) {
  let i = 0;
  while (i < CHANGE.length - 2 && CHANGE[i + 1].t <= t) i++;
  const [a, b] = [CHANGE[i], CHANGE[i + 1]];
  const q = Phaser.Math.Clamp((t - a.t) / (b.t - a.t), 0, 1);
  const k = q >= 1 ? b : a;
  const lerp = (n) => a[n] + (b[n] - a[n]) * q;
  return { legs: k.legs, fans: k.fans, eyes: k.eyes, arms: k.arms, clamp: lerp('clamp'), crane: lerp('crane'), beam: lerp('beam'), jet: lerp('jet'), blade: lerp('blade') };
}

const WARN = 0xff735e;
const SAFE = 0x81f3cc;
const GOLD = 0xffd06a;
const BLADE = 0xbff6ff;
const HEAT = 0xffb060;
const STEEL = 0x5a5e6c;
const DEG = Math.PI / 180;
const BASE = DEPTH.air - 0.16; // the mech's parts, back to front from here
const BLADE_ROT = [-0.6, 2.0, 3.9]; // the katana (drawn pointing up) raised over the shoulder, held out, across the body
const SEA_Y = 24; // the open bay at the top of the screen, where it falls

export const tokyoKurogane = {
  /**
   * A mech in the colours of a samurai's armour (black steel, vermilion lacquer, gold) docked in a gantry crane of the
   * container terminal. Three phases:
   * 1. SUWNICA: in the crane's frame. Its fists fly out on chains along red lanes and stick in the apron; the shoulder
   *    plates open and loose rockets in arcs; the chest cannon sprays fans. A fist being reeled back glows mint: hit,
   *    it loses its armour and then comes off, and with both arms gone the mech breaks out of the crane;
   * 2. PRZEMIANA: the clamps let go, the crane topples away, the legs fold into nozzles, fans open from its back and it
   *    draws a blade of light: wide cuts along announced arcs (a crescent of light flies out), charges down the whole
   *    screen; four lantern drones circle it and shoot. With all of them down it is stunned and its chest open;
   * 3. RDZEŃ: its armour blown off, the frame and the reactor bare, one eye flickering: a beam over the whole width
   *    with narrow safe lanes, spirals out of the reactor, a desperate grab with the frame's arm. After each the
   *    reactor vents steam and is open (mint).
   * Beaten, its lights go out one by one, it drops to the apron, kneels and falls on its back into the bay; the bay
   * glows in the colours of the bridge and fireworks go up.
   */
  spawnKurogane(w, base) {
    const s = this.scene;
    const y = s.parallax.screenY(KURO.u);
    const g = {
      kind: 'kurogane', state: 'enter', form: 'gantry', stage: 1, t: 0, parts: [], awake: false, defeated: false, act: null, timer: 1, plan: 0,
      take: { body: 1 }, outro: KURO.outro, x: 90, y, by: y, home: y + 4, bob: 0, kick: 0, sp: {}, fists: {}, pod: { l: 0, r: 0 },
      rockets: [], drones: [], bits: [], trail: [], stun: 0, open: 0, swing: 0, fanK: 3, flashT: 0, flashF: 0, eyes: null, ct: 0, said: {},
      claw: { dir: DOWN + 0.2, len: 24, k: 0 },
    };
    const body = this.pool.spawn('kg_body_0', 90, y, { ...base, role: 'body', group: g, hp: KURO.hp, maxHp: KURO.hp, radius: 24, pass: true, harmless: true, flashTint: 0x404040 });
    g.body = body;
    g.parts.push(body);
    g.maxTotal = KURO.hp;
    for (const [side, sx] of [['l', -1], ['r', 1]]) g.fists[side] = { side, sx, hp: KURO.fist.hp, w: 0, state: 'dock', x: 0, y: 0, at: 0, d: 0, hurt: 0, ang: DOWN, lane: null };
    this.bossGroup = g;
    this.kuroFists(g, 0);
    this.kuroDraw(g);
    return body;
  },

  updateKurogane(g, dt) {
    g.t += dt;
    g.kick = Math.max(0, g.kick - dt * 7);
    g.flashT = Math.max(0, g.flashT - dt);
    if (g.state === 'enter') this.kuroEnter(g, dt);
    else if (g.state === 'change') this.kuroChange(g, dt);
    else this.kuroFight(g, dt);
    // where its body is drawn: the crane holds still on the map; the mech breathes a pixel, the cannon kicks it back
    if (g.form === 'gantry') g.by = g.y + (Math.sin(g.t * 1.7) > 0.4 ? 1 : 0) - Math.round(g.kick * 2);
    else if (g.form !== 'change') g.by = g.y + Math.round(Math.sin(g.t * 2.3) * 1.5);
    this.kuroEyes(g, dt);
    this.kuroFists(g, dt);
    this.kuroRockets(g, dt);
    this.kuroDrones(g, dt);
    this.kuroBits(g, dt);
    this.kuroTouch(g);
    this.kuroTele(g);
    this.kuroDraw(g);
    g.body.x = g.x;
    g.body.y = g.by;
    g.open = Math.max(0, g.open - dt);
  },

  // ---------------------------------------------------------------- coming in
  /** It rides in with the map, dark; once the strip has stopped it powers up: steam, the eyes flicker on, a roar. */
  kuroEnter(g, dt) {
    const s = this.scene;
    const y = s.parallax.screenY(KURO.u);
    g.still = Math.abs(y - g.y) < 0.01 ? (g.still ?? 0) + dt : 0;
    g.y = y;
    g.home = y + 4;
    if (g.still > 0.25 && g.boot == null) {
      g.boot = 0;
      s.fx.text(90, y + 52, 'KIDŌ...', 1, HEAT);
    }
    if (g.boot == null) return;
    const was = g.boot;
    g.boot += dt;
    const at = (k) => was < k && g.boot >= k;
    // steam from the clamps and the knees, the actuators taking the weight
    if (Math.random() < dt * 10) this.kuroSteam(g.x + (Math.random() < 0.5 ? -44 : 44), g.y - 20);
    if (at(0.5)) s.cameras.main.shake(200, 0.004);
    if (at(0.9)) {
      s.fx.text(90, y + 60, 'GOGOGO!', 1.1, 0xffffff);
      s.fx.light(g.x, g.y + KG.eyes[1], 1.5, false, HEAT);
      s.cameras.main.shake(350, 0.007);
    }
    if (g.boot > 1.4) Object.assign(g, { state: 'fight', awake: true, timer: 0.6, act: null });
  },

  // ---------------------------------------------------------------- the fight
  kuroFight(g, dt) {
    const e = g.body;
    const frac = e.hp / e.maxHp;
    if (g.stage === 1 && !g.act && (!this.kuroArmed(g).length || frac < KURO.phase[0])) return this.kuroChangeStart(g);
    if (g.stage === 2 && !g.act && frac < KURO.phase[1]) return this.kuroBare(g);
    if (g.stage >= 2) this.kuroHover(g, dt);
    if (g.stage === 2) this.kuroStunned(g, dt);
    if (g.act) this.kuroAct(g, dt);
    else if ((g.timer -= dt) <= 0 && this.canFire(e) && !(g.stun > 0)) {
      const P = [['punch', 'cannon', 'punch', 'rockets', 'double', 'punch'], ['slash', 'dash', 'slash2', 'slash', 'dash', 'slash2'], ['beam', 'spiral', 'grab', 'beam', 'grab', 'spiral']][g.stage - 1];
      let kind = P[g.plan++ % P.length];
      if (kind === 'double' && this.kuroArmed(g).length < 2) kind = 'punch';
      if (kind === 'slash' && g.stage === 2 && frac < 0.42) kind = 'slash2';
      g.act = { kind, t: 0, step: 0 };
    }
  },

  kuroDone(g, rest) {
    g.act = null;
    g.timer = rest;
    if (g.stage === 3) {
      // after each big attack the reactor vents and stands open
      g.open = KURO.open.time;
      g.timer = KURO.open.time + rest;
      const s = this.scene;
      if ((g.said.open = (g.said.open ?? 0) + 1) <= 2) s.fx.text(g.x, g.by + 34, 'RDZEŃ ODSŁONIĘTY!', 1.2, SAFE);
      s.fx.text(g.x, g.by - 4, 'PSHUUU', 0.8, 0xffffff);
    }
  },

  kuroAct(g, dt) {
    const a = g.act;
    a.t += dt;
    switch (a.kind) {
      case 'punch':
      case 'double':
        return this.kuroPunch(g, a);
      case 'cannon':
        return this.kuroCannon(g, a);
      case 'rockets':
        return this.kuroRocketVolley(g, a);
      case 'slash':
      case 'slash2':
        return this.kuroSlash(g, a, dt);
      case 'dash':
        return this.kuroDash(g, a, dt);
      case 'beam':
        return this.kuroBeam(g, a);
      case 'spiral':
        return this.kuroSpiral(g, a);
      case 'grab':
        return this.kuroGrab(g, a, dt);
      default:
        this.kuroDone(g, 0.5);
    }
  },

  // ---------------------------------------------------------------- phase 1: the fists on their chains
  kuroArmed(g) {
    return Object.values(g.fists).filter((f) => f.state !== 'gone');
  },

  /** Where a fist sits on its arm. */
  kuroDock(g, f) {
    return [g.x + KG[`fist_${f.side}`][0], g.by + KG[`fist_${f.side}`][1]];
  },

  /** A fist sent along a lane at (tx, ty): red, a moment, then it flies to the lane's end (the apron, the screen's edge). */
  kuroLaunch(g, f, tx, ty) {
    const s = this.scene;
    const [fx, fy] = this.kuroDock(g, f);
    const ang = Phaser.Math.Clamp(Math.atan2(ty - fy, tx - fx), 0.3, Math.PI - 0.3);
    const [c, sn] = [Math.cos(ang), Math.sin(ang)];
    // (it slams down a little past where the player was, not at the screen's edge)
    let len = Math.min(KURO.fist.reach, (s.H - 14 - fy) / sn, Math.hypot(tx - fx, ty - fy) + 18);
    if (Math.abs(c) > 0.01) len = Math.min(len, ((c > 0 ? VIEW.width - 8 : 8) - fx) / c);
    Object.assign(f, { state: 'aim', at: 0, d: 0, warn: KURO.fist.aim * rules().warn, lane: { x0: fx, y0: fy, ang, len: Math.max(40, len) } });
  },

  kuroPunch(g, a) {
    const p = this.scene.player;
    if (a.step === 0) {
      a.step = 1;
      const arms = this.kuroArmed(g);
      if (!arms.length) return this.kuroDone(g, 0.3);
      const first = arms.length === 2 ? g.fists[g.nextFist ?? 'l'] : arms[0];
      g.nextFist = first.side === 'l' ? 'r' : 'l';
      this.kuroLaunch(g, first, p.x, p.y);
      a.list = [first];
      if (a.kind === 'double' && arms.length === 2) a.second = arms.find((f) => f !== first);
    }
    if (a.second && a.t > 0.5) {
      // the other one a beat later, to the side the player would dodge to
      this.kuroLaunch(g, a.second, p.x + (p.x < 90 ? 46 : -46), p.y);
      a.list.push(a.second);
      a.second = null;
    }
    if (!a.second && a.list.every((f) => f.state === 'dock' || f.state === 'gone')) this.kuroDone(g, 0.6);
  },

  /** The fists: aiming (pulled back, trembling), flying, stuck in the apron, reeled back (open to hits: mint). */
  kuroFists(g, dt) {
    const s = this.scene;
    const p = s.player;
    const F = KURO.fist;
    for (const f of Object.values(g.fists)) {
      if (f.state === 'gone') continue;
      f.hurt = Math.max(0, f.hurt - dt);
      f.at += dt;
      if (f.state === 'dock' || !f.lane) {
        [f.x, f.y] = this.kuroDock(g, f);
        f.ang = DOWN;
        continue;
      }
      const L = f.lane;
      let shake = 0;
      if (f.state === 'aim') {
        f.d = -Math.min(1, f.at / 0.3) * 5;
        shake = Math.round(Math.sin(f.at * 70));
        if (f.at > f.warn) Object.assign(f, { state: 'fly', at: 0 });
      } else if (f.state === 'fly') {
        f.d += F.speed * dt;
        if (Math.random() < dt * 30) s.fx.puff('wisp_s_1', f.x, f.y - 6, 0.3);
        if (f.d >= L.len) {
          f.d = L.len;
          Object.assign(f, { state: 'stuck', at: 0 });
          this.kuroImpact(g, L.x0 + Math.cos(L.ang) * L.len, L.y0 + Math.sin(L.ang) * L.len);
          if ((g.said.reel = (g.said.reel ?? 0) + 1) <= 2) s.fx.text(f.x, f.y - 22, 'TERAZ!', 0.9, SAFE);
        }
      } else if (f.state === 'stuck') {
        if (f.at > F.stuck) Object.assign(f, { state: 'reel', at: 0 });
      } else if (f.state === 'reel') {
        // (the chain takes the strain first: slow off the ground, faster as it comes home)
        const q = Math.min(1, f.at / F.reel);
        f.d = L.len * (1 - q * q);
        if (q >= 1) {
          Object.assign(f, { state: 'dock', d: 0, lane: null });
          s.fx.spark(f.x, f.y - 4);
          this.kuroClang(0.8);
          continue;
        }
      }
      f.x = L.x0 + Math.cos(L.ang) * f.d + shake;
      f.y = L.y0 + Math.sin(L.ang) * f.d;
      f.ang = L.ang;
      if ((f.state === 'fly' || f.state === 'stuck') && Math.hypot(p.x - f.x, p.y - f.y) < 8 && s.bombClear <= 0) p.hit();
    }
  },

  /** A fist slamming into the apron: the ground shakes, chips fly, a ring of shot. */
  kuroImpact(g, x, y) {
    const s = this.scene;
    s.cameras.main.shake(150, 0.006);
    s.fx.shockwave(x, y);
    s.fx.debris(x, y, 7, 0x6a6a78, 1);
    s.fx.smoke(x, y, 3, 6);
    s.fx.text(x, y - 16, 'DOGON!', 0.7, 0xffffff);
    s.sfx.explode('s');
    if (this.canFire(g.body)) s.bullets.ring(x, y, g.body.hp / g.body.maxHp < 0.75 ? 10 : 8, Math.random() * TAU, slow);
  },

  /** A shot on a fist: coming back, it hurts it (and the mech, more); otherwise it rings off the iron. */
  kuroFistHit(g, f, shot) {
    const s = this.scene;
    this.damage(g.body, shot.damage * KURO.fist.take);
    f.hp -= shot.damage;
    f.hurt = 0.07;
    if (Math.random() < 0.5) s.fx.spark(shot.x, shot.y - 2, SAFE);
    const w = f.hp < KURO.fist.hp / 3 ? 2 : f.hp < (KURO.fist.hp * 2) / 3 ? 1 : 0;
    if (w !== f.w) {
      f.w = w;
      s.fx.debris(f.x, f.y, 5, 0xc23a2a, 1);
      s.fx.text(f.x, f.y - 14, w === 1 ? 'GAN!' : 'BAKIN!', 0.6, 0xffffff);
    }
    if (f.hp <= 0) this.kuroTear(g, f);
  },

  /** An arm torn off at the shoulder: it falls away with its fist, the chain goes slack and drops, sparks. */
  kuroTear(g, f) {
    const s = this.scene;
    const sx = f.sx;
    const [shx, shy] = [g.x + sx * 26, g.by - 18];
    // (the arm turns about its shoulder as it falls: its frame is the whole mech's size, trimmed)
    this.kuroBit(`kg_arm_${f.side}_2`, shx, shy, { ox: (216 + sx * 78) / 432, oy: 138 / 384, vx: sx * 30, vy: 20, vr: sx * 1.6, g: 260, life: 1.1 });
    this.kuroBit(`kg_fist_${f.side}_2`, f.x, f.y, { vx: sx * 40, vy: -20, vr: sx * 4, g: 280, life: 1.1 });
    // (the chain, slack, drops in pieces: city frames go through the boss's own pool, not the effects')
    for (let i = 0; i < 8; i++) this.kuroBit(i % 2 ? 'kg_link_1' : 'kg_link_0', g.x + KG[`chain_${f.side}`][0] + (Math.random() - 0.5) * 14, g.y - 40 + i * 9, { vx: (Math.random() - 0.5) * 60, vy: 10 + Math.random() * 30, vr: (Math.random() - 0.5) * 12, g: 240, life: 0.8 });
    s.fx.explode(shx, shy, 'm');
    for (let i = 0; i < 6; i++) s.fx.spark(shx + (Math.random() - 0.5) * 10, shy + (Math.random() - 0.5) * 10, GOLD);
    s.fx.text(shx, shy - 18, 'GASHAN!', 1, 0xffe080);
    s.cameras.main.shake(260, 0.008);
    s.sfx.explode('m');
    Object.assign(f, { state: 'gone', lane: null });
  },

  // ---------------------------------------------------------------- phase 1: the cannon, the rockets
  kuroCannon(g, a) {
    const s = this.scene;
    const p = s.player;
    const [mx, my] = [g.x + KG.muzzle[0], g.by + KG.muzzle[1] + 3];
    const n = g.body.hp / g.body.maxHp < 0.75 ? 4 : 3;
    a.hot = a.t < 0.45;
    if (a.hot && Math.random() < 0.5) s.fx.light(mx, my, 0.5 + a.t, false, HEAT);
    if (a.step < n && a.t > 0.45 + a.step * 0.32) {
      a.step++;
      g.flashT = 0.09;
      g.flashF = a.step % 2;
      g.kick = 1;
      if (this.canFire(g.body)) s.bullets.fan(mx, my, Math.atan2(p.y - my, p.x - mx), a.step % 2 ? 7 : 6, a.step % 2 ? 0.9 : 1.05, normal);
      s.fx.smoke(mx, my + 2, 1, 2);
      s.sfx.explode('s');
    }
    if (a.t > 0.45 + n * 0.32 + 0.3) this.kuroDone(g, 0.7);
  },

  kuroRocketVolley(g, a) {
    const s = this.scene;
    const p = s.player;
    // the hatches in the shoulder plates: opening, open, shutting
    const hatch = a.t < 0.1 ? 0 : a.t < 0.2 ? 1 : a.t < 1.6 ? 2 : a.t < 1.75 ? 1 : 0;
    g.pod.l = g.pod.r = hatch;
    const n = volley(KURO.rockets.n);
    if (a.step < n && a.t > 0.3 + a.step * 0.17) {
      const side = a.step % 2 ? 'r' : 'l';
      a.step++;
      const sx = side === 'l' ? -1 : 1;
      const [x, y] = [g.x + KG.pods[side][0], g.by + KG.pods[side][1]];
      const tx = Phaser.Math.Clamp(p.x + (Math.random() - 0.5) * 100, 12, VIEW.width - 12);
      const ty = Phaser.Math.Clamp(p.y + (Math.random() - 0.5) * 60, s.H * 0.45, s.H - 16);
      const sp = this.segPool.spawn('kg_rocket_0', x, y).setDepth(DEPTH.air - 0.1);
      g.rockets.push({ sp, x, y, vx: sx * (30 + Math.random() * 40), vy: -120 - Math.random() * 30, tx, ty, t: 0, gone: false });
      s.fx.puff('wisp_s_1', x, y - 4, 0.4);
    }
    if (a.t > 1.95) this.kuroDone(g, 0.7);
  },

  /** The rockets: up out of the hatch, then curving down on to the spot marked for them; a ring of shot there. */
  kuroRockets(g, dt) {
    if (!g.rockets.length) return;
    const s = this.scene;
    const R = KURO.rockets;
    const p = s.player;
    for (const k of g.rockets) {
      if (k.gone) continue;
      k.t += dt;
      if (k.t > 0.25) {
        const want = Math.atan2(k.ty - k.y, k.tx - k.x);
        let ang = Math.atan2(k.vy, k.vx);
        ang += Phaser.Math.Clamp(Phaser.Math.Angle.Wrap(want - ang), -R.turn * dt, R.turn * dt);
        const v = Math.min(R.speed, Math.hypot(k.vx, k.vy) + 260 * dt);
        k.vx = Math.cos(ang) * v;
        k.vy = Math.sin(ang) * v;
      } else k.vy += 60 * dt;
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      k.sp.setPosition(k.x, k.y).setRotation(Math.atan2(k.vy, k.vx) + DOWN).setFrame(`kg_rocket_${Math.floor(k.t * 14) % 2}`);
      if (Math.random() < dt * 25) s.fx.puff('wisp_s_1', k.x - k.vx * 0.03, k.y - k.vy * 0.03, 0.3);
      if (Math.hypot(p.x - k.x, p.y - k.y) < 5 && s.bombClear <= 0) {
        p.hit();
        this.kuroRocketBoom(g, k, false);
      } else if (Math.hypot(k.tx - k.x, k.ty - k.y) < 7 || k.t > 2.6 || s.bombClear > 0) this.kuroRocketBoom(g, k, s.bombClear <= 0);
    }
    g.rockets = g.rockets.filter((k) => !k.gone);
  },

  kuroRocketBoom(g, k, ring) {
    const s = this.scene;
    k.gone = true;
    this.kuroKill(k.sp);
    s.fx.explode(k.x, k.y, 's');
    if (!ring) return;
    if (this.canFire(g.body)) s.bullets.ring(k.x, k.y, 6, Math.random() * TAU, slow);
    const p = s.player;
    if (Math.hypot(p.x - k.x, p.y - k.y) < 12) p.hit();
  },

  // ---------------------------------------------------------------- the change (1.5 s, KG_CHANGE)
  kuroChangeStart(g) {
    const s = this.scene;
    for (const f of this.kuroArmed(g)) this.kuroTear(g, f);
    for (const k of g.rockets) if (!k.gone) this.kuroRocketBoom(g, k, false);
    g.pod.l = g.pod.r = 0;
    this.phaseBreak(g, g.x, g.by, 2, 'PRZEMIANA');
    Object.assign(g, { state: 'change', form: 'change', ct: 0, act: null, plan: 0, gx: g.x, gy: g.y, home: g.y + 2 });
    s.sfx.explode('m');
  },

  kuroChange(g, dt) {
    const s = this.scene;
    const was = g.ct;
    g.ct += dt;
    const at = (k) => was < k && g.ct >= k;
    const c = changeAt(g.ct);
    // the clamps let go in a hiss of steam, the crane's legs topple outward and crash at the screen's edges
    if (at(0.05)) for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) this.kuroSteam(g.gx + sx * (30 + i * 9), g.gy - 20);
    if (at(0.3)) for (const sx of [-1, 1]) s.fx.spark(g.gx + sx * 60, g.gy - 20, GOLD);
    if (at(0.75)) {
      s.cameras.main.shake(380, 0.011);
      s.sfx.explode('l');
      for (const x of [6, VIEW.width - 6]) {
        s.fx.smoke(x, g.gy + 40, 6, 14);
        s.fx.debris(x, g.gy + 30, 8, 0xc23a2a, 1.2);
      }
    }
    if (at(0.9)) {
      s.fx.flash(0.25, 0.25, HEAT);
      s.sfx.explode('m');
    }
    if (at(1.35)) s.fx.text(g.x + 40, g.gy - 40, 'SHAKIN!', 0.9, BLADE);
    // the thrust kicks up dust off the apron and lifts it out
    if (c.jet > 0 && Math.random() < dt * 30) s.fx.smoke(g.x + (Math.random() < 0.5 ? -10 : 10), g.y + 50, 1, 6);
    const lift = Phaser.Math.Clamp((g.ct - 0.75) / 0.75, 0, 1);
    g.y = g.gy - 8 * lift * lift * (3 - 2 * lift);
    g.by = g.y;
    g.home = g.gy + 6; // (in flight it hangs a little lower: its fans clear the screen's top)
    if (g.ct >= 1.5) {
      Object.assign(g, { state: 'fight', form: 'flight', timer: 0.5, fanK: 3 });
      this.kuroDronesOut(g);
    }
  },

  // ---------------------------------------------------------------- phase 2: in flight
  /** Hovering, drifting from side to side (not while an attack holds it), sagging while stunned. */
  kuroHover(g, dt) {
    if (g.act?.hold) return;
    const k = g.stage === 3;
    const tx = 90 + Math.sin(g.t * (k ? 0.6 : 0.45)) * (k ? 18 : 26);
    const ty = g.home + (k ? 6 : 0) + Math.sin(g.t * (k ? 1.9 : 1.3)) * (k ? 4 : 3) + (g.stun > 0 ? 12 : 0);
    g.x += (tx - g.x) * Math.min(1, dt * 1.8);
    g.y += (ty - g.y) * Math.min(1, dt * 2.2);
    // (the frame's thrust sputters now and then: it dips)
    if (k && Math.sin(g.t * 3.1) > 0.97) g.y += 10 * dt;
  },

  /** The katana's hand and angle for the swing (0 raised over the shoulder, 0.5 held out, 1 across the body). */
  kuroBlade(g) {
    const q = Phaser.Math.Clamp(g.swing, 0, 1);
    const [i, j, k] = q < 0.5 ? [0, 1, q / 0.5] : [1, 2, (q - 0.5) / 0.5];
    const [h0, h1] = [KG[`hand_${i}`], KG[`hand_${j}`]];
    const rot = BLADE_ROT[i] + (BLADE_ROT[j] - BLADE_ROT[i]) * k;
    return { hx: g.x + h0[0] + (h1[0] - h0[0]) * k, hy: g.by + h0[1] + (h1[1] - h0[1]) * k, rot, frame: `kg_barm_r_${q < 0.25 ? 0 : q < 0.75 ? 1 : 2}` };
  },

  /** A wide cut along an announced arc: the blade raised, a swing with a smear of light, a crescent of light flies out. */
  kuroSlash(g, a, dt) {
    const s = this.scene;
    const S = KURO.slash;
    const p = s.player;
    const warn = S.warn * rules().warn;
    if (a.step === 0) {
      a.step = 1;
      a.hold = true;
      const [hx, hy] = [g.x + KG.hand_1[0], g.by + KG.hand_1[1]];
      a.aim = Phaser.Math.Clamp(Math.atan2(p.y - hy, p.x - hx), 0.45, Math.PI - 0.45);
      a.cuts = a.kind === 'slash2' ? 2 : 1;
    }
    const swing = S.swing;
    const t = a.t - warn;
    let q = 0;
    if (t < 0) {
      // the blade raised, glinting
      q = 0;
      if (Math.random() < dt * 6) {
        const b = this.kuroBlade(g);
        const d = b.rot - DOWN;
        s.fx.spark(b.hx + Math.cos(d) * 50, b.hy + Math.sin(d) * 50, BLADE);
      }
    } else if (t < swing) q = t / swing;
    else if (a.cuts === 2 && t < swing + 0.22) q = 1;
    else if (a.cuts === 2 && t < swing * 2 + 0.22) q = 1 - (t - swing - 0.22) / swing; // the backhand
    else {
      const r = t - (a.cuts === 2 ? swing * 2 + 0.22 : swing);
      q = a.cuts === 2 ? 0 : Math.max(0, 1 - Math.max(0, r - 0.3) / 0.3);
      if (r > 0.65) {
        g.swing = 0;
        return this.kuroDone(g, 0.55);
      }
    }
    const before = g.swing;
    g.swing = q;
    if (t >= 0 && t < (a.cuts === 2 ? swing * 2 + 0.22 : swing)) {
      const b = this.kuroBlade(g);
      const d = b.rot - DOWN;
      g.trail.push({ x0: b.hx + Math.cos(d) * 8, y0: b.hy + Math.sin(d) * 8, x1: b.hx + Math.cos(d) * 56, y1: b.hy + Math.sin(d) * 56, life: 1 });
    }
    // the crescent goes out as the blade passes the middle
    if ((before < 0.5 && q >= 0.5) || (before > 0.5 && q <= 0.5 && t > swing)) {
      const back = before > 0.5;
      const [hx, hy] = [g.x + KG.hand_1[0], g.by + KG.hand_1[1]];
      const n = volley(S.n);
      const off = back ? 0.5 / Math.max(1, n - 1) : 0;
      if (this.canFire(g.body)) for (let i = 0; i < n; i++) s.bullets.fire(hx, hy, a.aim + ((i + off) / Math.max(1, n - 1) - 0.5) * S.arc, normal * 1.1, true);
      s.fx.text(hx, hy - 14, back ? 'ZAN!' : 'ZAN!', 0.5, BLADE);
      s.sfx.explode('s');
    }
    if (t < 0) this.kuroArc(g, a, warn);
  },

  /** The announced arc of a cut: a red fan from the hand where the crescent will fly, its rings running outward. */
  kuroArc(g, a, warn) {
    const ink = this.tele;
    const [hx, hy] = [g.x + KG.hand_1[0], g.by + KG.hand_1[1]];
    const h = KURO.slash.arc / 2 + 0.06;
    const k = Math.min(1, a.t / 0.2);
    const R = 260;
    ink.fillStyle(WARN, 0.14 * k).beginPath().moveTo(hx, hy);
    for (let i = 0; i <= 16; i++) ink.lineTo(hx + Math.cos(a.aim - h + (i / 16) * 2 * h) * R, hy + Math.sin(a.aim - h + (i / 16) * 2 * h) * R);
    ink.closePath().fillPath();
    ink.lineStyle(1.5, WARN, 0.85 * k);
    for (const e of [-h, h]) ink.lineBetween(hx + Math.cos(a.aim + e) * 14, hy + Math.sin(a.aim + e) * 14, hx + Math.cos(a.aim + e) * R, hy + Math.sin(a.aim + e) * R);
    for (let i = 0; i < 3; i++) {
      const r = 20 + ((a.t * 140 + i * 60) % 180);
      ink.lineStyle(2, WARN, (1 - r / 200) * 0.9 * k).beginPath().arc(hx, hy, r, a.aim - h, a.aim + h).strokePath();
    }
    if (a.cuts === 2) ink.lineStyle(1, WARN, 0.6 * k).beginPath().arc(hx, hy, 16, a.aim - h, a.aim + h).strokePath();
  },

  /** A charge down the whole screen: it rises over a red lane, folds its fans, dives through and comes back in from the top. */
  kuroDash(g, a, dt) {
    const s = this.scene;
    const D = KURO.dash;
    const p = s.player;
    const warn = D.warn * rules().warn;
    a.hold = true;
    if (a.step === 0) {
      a.step = 1;
      a.lx = Phaser.Math.Clamp(p.x, 34, VIEW.width - 34);
      s.fx.text(a.lx, g.y + 40, 'TOTSUGEKI!', 0.9, WARN);
    }
    if (a.step === 1) {
      g.x += (a.lx - g.x) * Math.min(1, dt * 6);
      g.y += (g.home - 14 - g.y) * Math.min(1, dt * 5);
      g.fanK = a.t < 0.2 ? 2 : 1;
      this.kuroLane(a.lx, g.y + 34, D.w, a.t);
      if (a.t > warn) Object.assign(a, { step: 2, v: 80 });
    } else if (a.step === 2) {
      g.fanK = 0;
      a.v = Math.min(D.speed, a.v + 1500 * dt);
      g.y += a.v * dt;
      g.x += (a.lx - g.x) * Math.min(1, dt * 10);
      this.kuroLane(a.lx, g.y + 34, D.w, a.t, true);
      if (g.y > g.home && (a.ghost = (a.ghost ?? 0) - dt) <= 0) {
        a.ghost = 0.035;
        this.kuroBit(`kg_body_${this.kuroWear(g)}`, g.x, g.by, { a: 0.4, life: 0.25, tint: 0x6ab8ff, add: true });
      }
      if (Math.random() < dt * 20) s.fx.puff('wisp_s_1', g.x + (Math.random() - 0.5) * 30, g.y - 50, 0.4);
      if (g.y > s.H + 90) {
        Object.assign(a, { step: 3 });
        g.y = -80;
        g.x = 90 + (Math.random() - 0.5) * 40;
      }
    } else {
      g.fanK = g.y < g.home - 30 ? 1 : g.y < g.home - 10 ? 2 : 3;
      g.y += (g.home - g.y) * Math.min(1, dt * 3.2);
      if (Math.abs(g.y - g.home) < 2.5) {
        g.fanK = 3;
        this.kuroDone(g, 0.6);
      }
    }
  },

  /** The red lane a charge will run down (bright while it does). */
  kuroLane(x, y0, w, t, live = false) {
    const s = this.scene;
    const ink = this.tele;
    const H = s.H;
    const top = Math.max(0, y0);
    ink.fillStyle(WARN, live ? 0.22 : 0.1 + 0.06 * (Math.floor(t * 8) % 2)).fillRect(x - w, top, w * 2, H - top);
    ink.lineStyle(1.5, WARN, 0.9).lineBetween(x - w, top, x - w, H).lineBetween(x + w, top, x + w, H);
    for (let y = top + ((t * 160) % 22); y < H; y += 22) {
      ink.lineBetween(x - 10, y, x, y + 7);
      ink.lineBetween(x + 10, y, x, y + 7);
    }
  },

  // ---------------------------------------------------------------- phase 2: the lantern drones, the stun
  kuroDronesOut(g) {
    const D = KURO.drones;
    for (const d of g.drones) if (!d.gone) this.kuroKill(d.sp);
    g.drones = [];
    g.ox = g.x;
    g.oy = g.y + 22;
    for (let i = 0; i < D.n; i++) {
      const sp = this.segPool.spawn('kg_drone_0', g.x, g.y);
      g.drones.push({ sp, i, hp: D.hp, a: (i / D.n) * TAU + Math.PI / 4, out: 0, fireAt: g.t + 1.4 + i * 0.55, hurt: 0, x: g.x, y: g.y, gone: false });
    }
    const s = this.scene;
    s.fx.text(g.x, g.y + 96, (g.said.drones = (g.said.drones ?? 0) + 1) === 1 ? 'DRONY-LAMPIONY!' : 'DRONY!', 1, GOLD);
  },

  /** The drones circle it (in front of it on the lower half of their ring, behind on the upper) and shoot. */
  kuroDrones(g, dt) {
    if (!g.drones.length) return;
    const s = this.scene;
    const D = KURO.drones;
    const p = s.player;
    g.ox += (g.x - g.ox) * Math.min(1, dt * 2.5);
    g.oy += (Math.min(g.y, g.home + 4) + 22 - g.oy) * Math.min(1, dt * 2.5);
    for (const d of g.drones) {
      if (d.gone) continue;
      d.hurt = Math.max(0, d.hurt - dt);
      d.a += D.speed * dt;
      d.out = Math.min(1, d.out + dt / 0.8);
      const k = d.out * d.out * (3 - 2 * d.out);
      const [tx, ty] = [g.ox + Math.cos(d.a) * D.r[0], g.oy + Math.sin(d.a) * D.r[1] + Math.sin(g.t * 3 + d.i) * 2];
      d.x = g.x + (tx - g.x) * k;
      d.y = g.y - 12 + (ty - g.y + 12) * k;
      const front = Math.sin(d.a) > 0;
      const z = front ? DEPTH.air - 0.11 : BASE - 0.01;
      if (d.sp.depth !== z) d.sp.setDepth(z);
      d.sp.setPosition(d.x, d.y).setFrame(`kg_drone_${(Math.floor(g.t * 8) + d.i) % 4}`);
      if (d.hurt > 0) d.sp.setTint(0x808080).setTintMode(Phaser.TintModes.ADD);
      else if (d.sp.isTinted) d.sp.clearTint();
      if (d.out >= 1 && g.t > d.fireAt && g.state === 'fight' && this.canFire(g.body) && d.y < s.H * 0.6) {
        d.fireAt = g.t + D.fire[0] + Math.random() * (D.fire[1] - D.fire[0]);
        const a = Math.atan2(p.y - d.y, p.x - d.x);
        const n = g.body.hp / g.body.maxHp < 0.42 ? 3 : 2;
        for (let i = 0; i < n; i++) s.bullets.fire(d.x, d.y + 4, a + (i - (n - 1) / 2) * 0.16, slow * 1.15);
        s.fx.light(d.x, d.y + 3, 0.5, false, HEAT);
      }
      if (Math.hypot(p.x - d.x, p.y - d.y) < 7 && s.bombClear <= 0) p.hit();
    }
  },

  kuroDroneHit(g, d, dmg) {
    const s = this.scene;
    d.hp -= dmg;
    d.hurt = 0.07;
    if (Math.random() < 0.4) s.fx.spark(d.x, d.y);
    if (d.hp > 0) return;
    // a paper lantern bursting: its paper and its flame
    d.gone = true;
    this.kuroKill(d.sp);
    s.fx.explode(d.x, d.y, 's');
    s.fx.light(d.x, d.y, 1.2, false, HEAT);
    for (let i = 0; i < 6; i++) s.fx.part(s.fx.parts, 't_paper_0', d.x, d.y, { vx: (Math.random() - 0.5) * 120, vy: -40 - Math.random() * 40, g: 120, drag: 1.2, spin: 8, life: 0.8 }).setTint(i % 2 ? 0xd8402c : 0xf0d8a0);
    const pts = 500 * s.score.mult;
    s.score.add(pts);
    s.fx.text(d.x, d.y - 10, `PON! ${pts}`, 0.7, GOLD);
    s.sfx.explode('s');
    if (g.stage === 2 && g.drones.every((x) => x.gone)) g.stunWait = true;
  },

  /** All the drones down: (once a charge is over) it sags, its thrust sputters, its chest open for a few seconds. */
  kuroStunned(g, dt) {
    const s = this.scene;
    if (g.stunWait && g.act?.kind !== 'dash') {
      g.stunWait = false;
      g.stun = KURO.drones.stun;
      if (g.act) {
        g.act = null;
        g.swing = 0;
      }
      g.fanK = 2;
      s.fx.text(g.x, g.by + 40, 'PIERŚ OTWARTA!', 1.3, SAFE);
      s.fx.shockwave(g.x, g.by);
      s.cameras.main.shake(250, 0.006);
      s.sfx.explode('m');
    }
    if (g.stun > 0) {
      g.stun -= dt;
      g.fanK = 2;
      if (Math.random() < dt * 14) s.fx.spark(g.x + (Math.random() - 0.5) * 40, g.by + (Math.random() - 0.5) * 50);
      if (Math.random() < dt * 6) s.fx.smoke(g.x + (Math.random() - 0.5) * 30, g.by - 10, 1, 3);
      if (g.stun <= 0) {
        g.fanK = 3;
        g.relaunch = g.t + 0.6;
        g.timer = Math.max(g.timer, 0.8);
      }
    }
    if (g.relaunch && g.t > g.relaunch) {
      g.relaunch = 0;
      this.kuroDronesOut(g);
    }
  },

  // ---------------------------------------------------------------- phase 3: the frame and its reactor
  /** The armour blown off: the shoulder plates fly, the fans tear, the blade drops, the crescent falls off the helmet. */
  kuroBare(g) {
    const s = this.scene;
    const [x, y] = [g.x, g.by];
    this.phaseBreak(g, x, y, 3, 'RDZEŃ');
    for (const [side, sx] of [['l', -1], ['r', 1]]) {
      this.kuroBit(`kg_sode_${side}_0_2`, x + sx * 32, y - 25.3, { ox: (216 + sx * 96) / 432, oy: 116 / 384, vx: sx * 70, vy: -50, vr: sx * 3, g: 170, life: 1.3 });
    }
    const b = this.kuroBlade(g);
    this.kuroBit('kg_katana', b.hx, b.hy, { ox: KG.katanaOrigin[0], oy: KG.katanaOrigin[1], rot: b.rot, vx: 50, vy: -60, vr: 7, g: 220, life: 1.3 });
    for (let i = 0; i < 18; i++) s.fx.part(s.fx.parts, 't_paper_0', x + (i % 2 ? -1 : 1) * (20 + Math.random() * 40), y - 20 - Math.random() * 30, { vx: (i % 2 ? -1 : 1) * (40 + Math.random() * 80), vy: -30 - Math.random() * 60, g: 120, drag: 1, spin: 9, life: 1 }).setTint(i % 3 ? 0xc23a2a : GOLD);
    s.fx.debris(x, y - 52, 8, GOLD, 1.2);
    s.fx.debris(x, y, 18, 0x2a2a34, 1.6);
    for (let i = 0; i < 4; i++) s.fx.explode(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60, i ? 's' : 'm');
    s.cameras.main.shake(450, 0.01);
    for (const d of g.drones) if (!d.gone) this.kuroDroneHit(g, d, 999);
    Object.assign(g, { form: 'frame', act: null, plan: 0, timer: 1.4, stun: 0, stunWait: false, relaunch: 0, open: 0, swing: 0 });
  },

  /** The beam over the whole width: red everywhere but two narrow lanes (mint), then the reactor's light pours down. */
  kuroBeam(g, a) {
    const s = this.scene;
    const p = s.player;
    const B = KURO.beam;
    const warn = B.warn * rules().warn;
    a.hold = true;
    if (a.step === 0) {
      a.step = 1;
      const one = Phaser.Math.Clamp(p.x + (Math.random() < 0.5 ? -1 : 1) * (22 + Math.random() * 22), 14, VIEW.width - 14);
      let two = one;
      for (let i = 0; i < 20 && Math.abs(two - one) < 52; i++) two = 14 + Math.random() * (VIEW.width - 28);
      a.lanes = [one, two].sort((u, v) => u - v);
      s.fx.text(g.x, g.by + 36, 'HASSHA...', 0.9, WARN);
    }
    a.y0 = g.by + 30;
    g.hot = Math.min(1, a.t / warn);
    const live = a.t > warn && a.t < warn + B.live;
    this.kuroBeamDraw(g, a, live);
    if (live) {
      if (!a.fired) {
        a.fired = true;
        s.cameras.main.shake(B.live * 1000, 0.006);
        s.fx.flash(0.3, 0.2, 0xffe0b0);
        s.sfx.explode('l');
      }
      const safe = a.lanes.some((lx) => Math.abs(p.x - lx) < B.lane / 2 - 1.5);
      if (!safe && p.y > a.y0 - 2 && s.bombClear <= 0) p.hit();
      if (Math.random() < 0.6) s.fx.light(Math.random() * VIEW.width, a.y0 + Math.random() * (s.H - a.y0), 1, false, HEAT);
    }
    if (a.t > warn + B.live + 0.2) {
      g.hot = 0;
      this.kuroDone(g, 0.5);
    }
  },

  kuroBeamDraw(g, a, live) {
    const s = this.scene;
    const ink = this.tele;
    const H = s.H;
    const w = KURO.beam.lane;
    const y0 = a.y0;
    const segs = [];
    let x0 = 0;
    for (const lx of a.lanes) {
      segs.push([x0, lx - w / 2]);
      x0 = lx + w / 2;
    }
    segs.push([x0, VIEW.width]);
    const [cx, cy] = [g.x + KG.core[0], g.by + KG.core[1]];
    if (!live) {
      const k = Math.min(1, a.t / 0.25);
      const blink = (0.09 + 0.07 * (Math.floor(a.t * 8) % 2)) * k;
      for (const [u, v] of segs) {
        if (v - u < 1) continue;
        ink.fillStyle(WARN, blink).fillRect(u, y0, v - u, H - y0);
        ink.lineStyle(1, WARN, 0.45 * k);
        for (let y = y0 + ((a.t * 70) % 14); y < H; y += 14) ink.lineBetween(u + 2, y, v - 2, y);
      }
      ink.lineStyle(1, WARN, 0.5 * k).lineBetween(cx, cy, 0, y0).lineBetween(cx, cy, VIEW.width, y0);
    } else {
      const fl = 0.55 + Math.random() * 0.2;
      ink.fillStyle(0xffd8a0, 0.35 * fl).fillTriangle(cx - 6, cy, cx + 6, cy, VIEW.width / 2, y0).fillTriangle(cx - 6, cy, 0, y0, VIEW.width, y0);
      for (const [u, v] of segs) {
        if (v - u < 1) continue;
        ink.fillStyle(0xff8a3a, 0.8 * fl).fillRect(u, y0, v - u, H - y0);
        if (v - u > 8) ink.fillStyle(0xffe8b0, 0.85 * fl).fillRect(u + 4, y0, v - u - 8, H - y0);
        if (v - u > 16) ink.fillStyle(0xffffff, 0.8 * fl).fillRect(u + 8, y0, v - u - 16, H - y0);
        // streaks pouring down it
        ink.lineStyle(1, 0xffffff, 0.9);
        for (let x = u + 3 + ((g.t * 37) % 7); x < v - 2; x += 7) {
          const y = y0 + ((g.t * 600 + x * 37) % (H - y0));
          ink.lineBetween(x, y, x, Math.min(H, y + 18));
        }
        ink.lineStyle(2, 0xff6020, 1).lineBetween(u, y0, u, H).lineBetween(v, y0, v, H);
      }
    }
    // the safe lanes: mint, with arrows down them
    for (const lx of a.lanes) {
      ink.lineStyle(1.5, SAFE, 0.95).lineBetween(lx - w / 2, y0, lx - w / 2, H).lineBetween(lx + w / 2, y0, lx + w / 2, H);
      if (!live) for (let y = y0 + 10 + ((a.t * 60) % 26); y < H; y += 26) ink.lineBetween(lx - 4, y, lx, y + 4).lineBetween(lx + 4, y, lx, y + 4);
    }
  },

  /** Arms of shot wound out of the reactor, turning, then turning back. */
  kuroSpiral(g, a) {
    const s = this.scene;
    const S = KURO.spiral;
    a.hold = a.t < S.dur;
    g.hot = Math.min(1, a.t / 0.4);
    const [cx, cy] = [g.x + KG.core[0], g.by + KG.core[1]];
    if (a.t > 0.4 && a.t < S.dur && a.t > 0.4 + a.step * S.every) {
      a.step++;
      const arms = volley(4);
      const turn = (a.t < S.dur / 2 + 0.2 ? 1 : -1) * 0.21;
      a.base = (a.base ?? Math.random() * TAU) + turn;
      if (this.canFire(g.body)) for (let i = 0; i < arms; i++) s.bullets.fire(cx, cy, a.base + (i / arms) * TAU, slow * 1.2);
    }
    if (a.t > S.dur + 0.3) {
      g.hot = 0;
      this.kuroDone(g, 0.5);
    }
  },

  /** The frame's arm lunging at the player: red line, a strut-arm thrown out, the claw snapping shut, a ring of shot. */
  kuroGrab(g, a, dt) {
    const s = this.scene;
    const G = KURO.grab;
    const p = s.player;
    const c = g.claw;
    const warn = G.warn * rules().warn;
    a.hold = true;
    const [sx, sy] = [g.x + KG.grab[0], g.by + KG.grab[1]];
    if (a.step === 0 || a.step === 4) {
      a.step = 1;
      a.t = 0;
      a.n = (a.n ?? 0) + 1;
      a.tx = p.x;
      a.ty = p.y;
      s.fx.text(sx, sy - 10, a.n === 1 ? 'GAAA!' : 'GA!', 0.6, WARN);
    }
    const dir = Math.atan2(a.ty - sy, a.tx - sx);
    const reach = Math.max(30, Math.hypot(a.tx - sx, a.ty - sy) - 9);
    if (a.step === 1) {
      c.dir += Phaser.Math.Angle.Wrap(dir - c.dir) * Math.min(1, dt * 10);
      c.len = 18;
      c.k = 0;
      const ink = this.tele;
      const k = Math.min(1, a.t / 0.2);
      ink.lineStyle(1.5, WARN, 0.8 * k).lineBetween(sx, sy, a.tx, a.ty);
      ink.lineStyle(2, WARN, 0.9 * k).strokeCircle(a.tx, a.ty, 12 + Math.sin(a.t * 20) * 1.5);
      if (a.t > warn) Object.assign(a, { step: 2, t: 0 });
    } else if (a.step === 2) {
      c.dir = dir;
      c.len = 18 + (reach - 18) * Math.min(1, a.t / G.out);
      if (a.t > G.out) {
        Object.assign(a, { step: 3, t: 0 });
        const [cx, cy] = [sx + Math.cos(dir) * (reach + 9), sy + Math.sin(dir) * (reach + 9)];
        if (Math.hypot(p.x - cx, p.y - cy) < 13 && s.bombClear <= 0) p.hit();
        if (this.canFire(g.body)) s.bullets.ring(cx, cy, 10, Math.random() * TAU, slow);
        s.fx.text(cx, cy - 16, 'GASHI!', 0.6, 0xffffff);
        s.sfx.explode('s');
        s.cameras.main.shake(120, 0.005);
      }
    } else if (a.step === 3) {
      c.k = a.t < 0.05 ? 1 : 2;
      if (a.t > G.hold) c.len = Math.max(24, reach - (reach - 24) * Math.min(1, (a.t - G.hold) / G.back));
      if (a.t > G.hold + G.back) {
        if (a.n < 2) a.step = 4;
        else {
          c.k = 0;
          this.kuroDone(g, 0.5);
        }
      }
    }
  },

  // ---------------------------------------------------------------- looks: eyes, steam, bits, warnings
  kuroWear(g) {
    const frac = g.body.hp / g.body.maxHp;
    return frac > 0.8 ? 0 : frac > 0.45 ? 1 : 2;
  },

  /** The eyes' light: dark before it starts, flaring on when it aims, a light sliding across them; one eye left at the end. */
  kuroEyes(g, dt) {
    const a = g.act;
    if (g.state === 'enter') {
      g.eyes = g.boot == null ? null : g.boot < 0.9 ? (Math.random() < 0.4 ? 'kg_eyes_hot' : null) : 'kg_eyes_hot';
      return;
    }
    if (g.form === 'frame') {
      if ((g.eyeT = (g.eyeT ?? 0) - dt) <= 0) {
        g.eyeT = 0.05 + Math.random() * 0.1;
        const r = Math.random();
        g.eyes = r < 0.12 ? null : r < 0.4 ? 'kg_eye_flicker_0' : 'kg_eye_flicker_1';
      }
      return;
    }
    if (g.stun > 0) {
      g.eyes = Math.random() < 0.5 ? null : 'kg_eye_flicker_0';
      return;
    }
    const aiming = Object.values(g.fists).some((f) => f.state === 'aim') || a?.hot || ((a?.kind === 'slash' || a?.kind === 'slash2') && a.t < KURO.slash.warn) || (a?.kind === 'dash' && a.step === 1);
    g.eyes = aiming ? 'kg_eyes_hot' : `kg_eyes_${Math.floor(g.t * 5) % 4}`;
  },

  kuroSteam(x, y) {
    this.scene.fx.puff('wisp_s_1', x + (Math.random() - 0.5) * 6, y + (Math.random() - 0.5) * 4, 0.5);
  },

  /** A piece flying off (an arm, a fist, a plate, the blade) or an after-image: a sprite of its own that fades. */
  kuroBit(frame, x, y, o) {
    const g = this.bossGroup;
    if (!g || !g.body.texture.has(frame)) return;
    const sp = this.segPool.spawn(frame, x, y).setDepth(DEPTH.air - 0.1).setOrigin(o.ox ?? 0.5, o.oy ?? 0.5).setRotation(o.rot ?? 0).setAlpha(o.a ?? 1);
    if (o.tint != null) sp.setTint(o.tint).setTintMode(Phaser.TintModes.ADD);
    if (o.add) sp.setBlendMode(Phaser.BlendModes.ADD);
    g.bits.push({ sp, x, y, vx: o.vx ?? 0, vy: o.vy ?? 0, vr: o.vr ?? 0, g: o.g ?? 0, life: o.life ?? 1, t: 0, a: o.a ?? 1 });
  },

  kuroBits(g, dt) {
    const s = this.scene;
    for (const b of g.bits) {
      b.t += dt;
      b.vy += b.g * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.sp.setPosition(b.x, b.y).setRotation(b.sp.rotation + b.vr * dt).setAlpha(b.a * Math.max(0, 1 - Math.max(0, b.t - b.life * 0.5) / (b.life * 0.5)));
      if (b.t >= b.life) this.kuroKill(b.sp);
    }
    g.bits = g.bits.filter((b) => b.t < b.life);
    for (const tr of g.trail) tr.life -= dt * 4;
    g.trail = g.trail.filter((tr) => tr.life > 0);
    if (g.state !== 'fight') return;
    // sparks out of a torn shoulder, steam off the actuators, the reactor venting
    if (g.form === 'gantry') {
      for (const f of Object.values(g.fists)) if (f.state === 'gone' && Math.random() < dt * 5) s.fx.spark(g.x + f.sx * 26 + (Math.random() - 0.5) * 6, g.by - 18 + Math.random() * 6, GOLD);
      if (Math.random() < dt * 2) this.kuroSteam(g.x + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.5 ? 44 : 22), g.by + (Math.random() < 0.5 ? -20 : 36));
    }
    if (g.form === 'frame') {
      if (Math.random() < dt * 4) s.fx.spark(g.x + (Math.random() - 0.5) * 40, g.by + (Math.random() - 0.5) * 50);
      if (g.open > 0 && Math.random() < dt * 22) {
        const [cx, cy] = [g.x + KG.core[0], g.by + KG.core[1]];
        s.fx.puff('wisp_s_1', cx + (Math.random() - 0.5) * 20, cy + (Math.random() - 0.5) * 16, 0.55);
      }
    }
  },

  /** Touching the mech hurts. */
  kuroTouch(g) {
    const s = this.scene;
    const p = s.player;
    if (g.state === 'enter' || !p.alive || s.bombClear > 0) return;
    if (this.kuroBodyAt(g, p.x, p.y, 1)) p.hit();
  },

  /** Is (px, py) on the mech's body (the shots' and the ship's test; the fans let both through)? */
  kuroBodyAt(g, px, py, r = 0) {
    const [x, y] = [g.x, g.by];
    const ell = (cx, cy, rx, ry) => ((px - x - cx) / (rx + r)) ** 2 + ((py - y - cy) / (ry + r)) ** 2 < 1;
    if (g.form === 'frame') return ell(0, -10, 20, 40);
    if (ell(0, -10, 22, 42) || ell(-36, -24, 13, 14) || ell(36, -24, 13, 14)) return true;
    if (g.form !== 'gantry') return false;
    return ell(-10, 36, 12, 12) || ell(10, 36, 12, 12) || (g.fists.l.state !== 'gone' && ell(-33, 2, 9, 20)) || (g.fists.r.state !== 'gone' && ell(33, 2, 9, 20));
  },

  /** The warnings of the fists' lanes and the rockets' landings, the blade's smear, the open reactor's ring. */
  kuroTele(g) {
    const ink = this.tele;
    for (const f of Object.values(g.fists)) {
      if (!f.lane || f.state === 'gone') continue;
      const L = f.lane;
      const [c, sn] = [Math.cos(L.ang), Math.sin(L.ang)];
      const [nx, ny] = [-sn, c];
      const [x1, y1] = [L.x0 + c * L.len, L.y0 + sn * L.len];
      const w = 9;
      if (f.state === 'aim') {
        const k = Math.min(1, f.at / 0.2);
        ink.fillStyle(WARN, (0.12 + 0.06 * (Math.floor(f.at * 10) % 2)) * k);
        ink.fillPoints([{ x: L.x0 + nx * w, y: L.y0 + ny * w }, { x: x1 + nx * w, y: y1 + ny * w }, { x: x1 - nx * w, y: y1 - ny * w }, { x: L.x0 - nx * w, y: L.y0 - ny * w }], true);
        ink.lineStyle(1.5, WARN, 0.9 * k).lineBetween(L.x0 + nx * w, L.y0 + ny * w, x1 + nx * w, y1 + ny * w).lineBetween(L.x0 - nx * w, L.y0 - ny * w, x1 - nx * w, y1 - ny * w);
        for (let d = (f.at * 150) % 20; d < L.len - 6; d += 20) {
          const [x, y] = [L.x0 + c * d, L.y0 + sn * d];
          ink.lineBetween(x - c * 5 + nx * 6, y - sn * 5 + ny * 6, x, y).lineBetween(x - c * 5 - nx * 6, y - sn * 5 - ny * 6, x, y);
        }
        ink.lineStyle(2, WARN, k).strokeCircle(x1, y1, 10);
      } else if (f.state === 'reel') {
        // a mint ring round the fist coming back (its sprite: kg_fist_ring), and a faint line home
        ink.lineStyle(1, SAFE, 0.35).lineBetween(f.x, f.y, L.x0, L.y0);
      }
    }
    for (const k of g.rockets) {
      const r = 9 + Math.sin(g.t * 18) * 1.5;
      ink.lineStyle(1.5, WARN, 0.85).strokeCircle(k.tx, k.ty, r).lineBetween(k.tx - r - 3, k.ty, k.tx - r + 4, k.ty).lineBetween(k.tx + r - 4, k.ty, k.tx + r + 3, k.ty).lineBetween(k.tx, k.ty - r - 3, k.tx, k.ty - r + 4).lineBetween(k.tx, k.ty + r - 4, k.tx, k.ty + r + 3);
    }
    // the blade's smear: a sheet of pale light over the swing
    for (let i = 1; i < g.trail.length; i++) {
      const [u, v] = [g.trail[i - 1], g.trail[i]];
      ink.fillStyle(BLADE, 0.45 * v.life).fillPoints([{ x: u.x0, y: u.y0 }, { x: u.x1, y: u.y1 }, { x: v.x1, y: v.y1 }, { x: v.x0, y: v.y0 }], true);
      ink.lineStyle(1.5, 0xffffff, 0.8 * v.life).lineBetween(u.x1, u.y1, v.x1, v.y1);
    }
    // the open chest / reactor: a mint ring, pulsing
    const open = (g.stage === 2 && g.stun > 0) || (g.stage === 3 && g.open > 0);
    if (open && g.state === 'fight') {
      const [cx, cy] = [g.x + KG.core[0], g.by + KG.core[1]];
      const r = (g.stage === 2 ? 17 : 13) + Math.sin(g.t * 10) * 1.5;
      ink.lineStyle(2, SAFE, 0.9).strokeCircle(cx, cy, r);
      ink.lineStyle(1, 0xffffff, 0.5).strokeCircle(cx, cy, r + 3);
    }
  },

  // ---------------------------------------------------------------- putting the parts together
  /** Builds the list of parts, back to front, for the form it is in, and puts the sprites there (kuroSync). */
  kuroDraw(g) {
    const L = [];
    const put = (key, frame, x, y, o) => L.push({ key, frame, x, y, o });
    const [x, y] = [g.x, g.by];
    const f4 = Math.floor(g.t * 14) % 4;
    const bw = this.kuroWear(g);
    if (g.form === 'gantry') {
      const gy = g.y;
      put('gtop', 'kg_gantry_top', x + KG.kg_gantry_top[0], gy + KG.kg_gantry_top[1]);
      put('gl', 'kg_gantry_l', x + KG.kg_gantry_l[0], gy);
      put('gr', 'kg_gantry_r', x + KG.kg_gantry_r[0], gy);
      this.kuroChains(g, put);
      put('legs', 'kg_legs_0', x, y);
      for (const f of Object.values(g.fists)) put(`arm_${f.side}`, f.state === 'gone' ? `kg_stump_${f.side}` : `kg_arm_${f.side}_${f.w}`, x, y);
      for (const f of Object.values(g.fists)) if (f.state === 'dock') put(`fist_${f.side}`, `kg_fist_${f.side}_${f.w}`, f.x, f.y, { tint: f.hurt > 0 ? 0x606060 : null });
      put('body', `kg_body_${bw}`, x, y);
      if (g.flashT > 0) put('flash', `kg_flash_${g.flashF}`, x, y);
      if (g.eyes) put('eyes', g.eyes, x, y);
      for (const f of Object.values(g.fists)) put(`sode_${f.side}`, `kg_sode_${f.side}_${g.pod[f.side]}_${f.state === 'gone' ? 2 : Math.max(bw, f.w)}`, x, y);
      put('clamp_l', 'kg_clamp_l', x + KG.kg_clamp_l[0], gy + KG.kg_clamp_l[1]);
      put('clamp_r', 'kg_clamp_r', x + KG.kg_clamp_r[0], gy + KG.kg_clamp_r[1]);
      for (const f of Object.values(g.fists)) {
        if (f.state === 'dock' || f.state === 'gone') continue;
        const open = f.state === 'reel' || f.state === 'stuck';
        put(`fist_${f.side}`, `kg_fist_${f.side}_${f.w}`, f.x, f.y, { rot: f.ang - DOWN, tint: f.hurt > 0 ? 0x606060 : open ? 0x103828 : null });
        if (open) put(`ring_${f.side}`, 'kg_fist_ring', f.x, f.y, { a: 0.7 + Math.sin(g.t * 14) * 0.3, sx: 0.9 + Math.sin(g.t * 7) * 0.08 });
      }
    } else if (g.form === 'change') {
      const c = changeAt(g.ct);
      const [gx, gy] = [g.gx, g.gy];
      if (c.crane < 80) {
        put('gtop', 'kg_gantry_top', gx, gy + KG.kg_gantry_top[1] + c.beam, { a: Phaser.Math.Clamp(1 + (c.beam + 40) / 30, 0, 1) });
        // the crane's legs topple outward about their feet
        put('gl', 'kg_gantry_l', gx + KG.kg_gantry_l[0], gy + 64, { oy: 1, rot: -c.crane * DEG });
        put('gr', 'kg_gantry_r', gx + KG.kg_gantry_r[0], gy + 64, { oy: 1, rot: c.crane * DEG });
      }
      if (c.fans >= 0) {
        put('fan_l', `kg_fan_l_${c.fans}`, x, y);
        put('fan_r', `kg_fan_r_${c.fans}`, x, y);
      }
      if (c.jet > 0) put('jet', c.jet < 1 ? `kg_jetw_${f4}` : `kg_jet_${f4}`, x, y);
      put('legs', `kg_legs_${c.legs}`, x, y);
      put('barm_l', c.arms === 'bare' ? 'kg_barm_l' : 'kg_stump_l', x, y);
      put('body', `kg_body_${bw}`, x, y);
      put('eyes', c.eyes === 'hot' ? 'kg_eyes_hot' : `kg_eyes_${Math.floor(g.t * 5) % 4}`, x, y);
      put('sode_l', `kg_sode_l_0_${Math.max(1, bw)}`, x, y);
      put('sode_r', `kg_sode_r_0_${Math.max(1, bw)}`, x, y);
      put('barm_r', c.arms === 'bare' ? 'kg_barm_r_0' : 'kg_stump_r', x, y);
      if (c.blade > 0) put('katana', 'kg_katana', x + KG.hand_0[0], y + KG.hand_0[1], { ox: KG.katanaOrigin[0], oy: KG.katanaOrigin[1], rot: BLADE_ROT[0], sy: c.blade, sx: 1, a: Math.min(1, c.blade * 2) });
      if (c.crane < 30) {
        // the clamps swing back about their outer ends
        const a = 1 - c.crane / 30;
        put('clamp_l', 'kg_clamp_l', gx - 64, gy + KG.kg_clamp_l[1], { ox: 0, rot: -c.clamp * DEG, a });
        put('clamp_r', 'kg_clamp_r', gx + 64, gy + KG.kg_clamp_r[1], { ox: 1, rot: c.clamp * DEG, a });
      }
    } else if (g.form === 'flight') {
      const fk = g.fanK === 3 && Math.sin(g.t * 2.6) > 0.93 ? 2 : g.fanK; // (a beat of the fans now and then)
      put('fan_l', `kg_fan_l_${fk}`, x, y);
      put('fan_r', `kg_fan_r_${fk}`, x, y);
      put('jet', g.stun > 0 ? `kg_jetw_${f4}` : `kg_jet_${f4}`, x, y);
      put('legs', 'kg_legs_3', x, y);
      put('barm_l', 'kg_barm_l', x, y);
      put('body', `kg_body_${bw}`, x, y);
      if (g.stun > 0) put('core', `kg_core_${f4}`, x, y, { a: 0.5 + Math.sin(g.t * 12) * 0.25 });
      if (g.eyes) put('eyes', g.eyes, x, y);
      put('sode_l', `kg_sode_l_0_${Math.max(1, bw)}`, x, y);
      put('sode_r', `kg_sode_r_0_${Math.max(1, bw)}`, x, y);
      const b = this.kuroBlade(g);
      put('barm_r', b.frame, x, y);
      put('katana', 'kg_katana', b.hx, b.hy, { ox: KG.katanaOrigin[0], oy: KG.katanaOrigin[1], rot: b.rot });
    } else {
      put('fan_l', 'kg_fan_l_x', x, y);
      put('fan_r', 'kg_fan_r_x', x, y);
      put('jet', `kg_jetw_${f4}`, x, y, { a: Math.sin(g.t * 3.1) > 0.97 ? 0.3 : 1 });
      put('legs', 'kg_legs_3', x, y);
      this.kuroArm(g, put);
      put('body', 'kg_frame', x, y);
      const hot = g.hot ?? 0;
      put('core', `kg_core_${Math.floor(g.t * (8 + hot * 16)) % 4}`, x, y, { a: 0.75 + hot * 0.25, tint: hot > 0.3 ? 0x302010 : null });
      if (g.eyes) put('eyes', g.eyes, x, y);
    }
    this.kuroSync(g, L);
  },

  /** The chains from the crane's beam to the fists: slack while a fist is home, taut while it flies. */
  kuroChains(g, put) {
    for (const f of Object.values(g.fists)) {
      if (f.state === 'gone') continue;
      const [ax, ay] = [g.x + KG[`chain_${f.side}`][0], g.y + KG[`chain_${f.side}`][1]];
      const r = f.ang - DOWN;
      const [hx, hy] = [f.x + Math.sin(r) * 8, f.y - Math.cos(r) * 8];
      const len = Math.hypot(hx - ax, hy - ay);
      const sag = f.state === 'dock' ? 7 : f.state === 'aim' ? 5 : f.state === 'reel' ? 4 : 0.5;
      const n = Math.max(2, Math.round(len / 5.2));
      const at = (u) => [ax + (hx - ax) * u, ay + (hy - ay) * u + Math.sin(u * Math.PI) * sag];
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n;
        const [px, py] = at(u);
        const [qx, qy] = at(Math.min(1, u + 0.02));
        put(`c${f.side}${i}`, i % 2 ? 'kg_link_1' : 'kg_link_0', px, py, { rot: Math.atan2(qy - py, qx - px) - DOWN });
      }
    }
  },

  /** The frame's grabbing arm: struts from its shoulder, the claw at the end. */
  kuroArm(g, put) {
    const c = g.claw;
    if (g.act?.kind !== 'grab') {
      c.dir += (DOWN + 0.2 + Math.sin(g.t * 1.3) * 0.1 - c.dir) * 0.1;
      c.len = 24;
      c.k = 0;
    }
    const [sx, sy] = [g.x + KG.grab[0], g.by + KG.grab[1]];
    const n = Math.max(1, Math.ceil(c.len / 22));
    const step = c.len / n;
    for (let i = 0; i < n; i++) {
      const d = (i + 0.5) * step;
      put(`st${i}`, 'kg_strut', sx + Math.cos(c.dir) * d, sy + Math.sin(c.dir) * d, { rot: c.dir - DOWN, sy: Math.max(0.7, step / 22) });
    }
    put('claw', `kg_claw_${c.k}`, sx + Math.cos(c.dir) * (c.len + 9), sy + Math.sin(c.dir) * (c.len + 9), { rot: c.dir - DOWN });
  },

  /** Puts each part's sprite where the list says, in its order; parts no longer listed go back to the pool. */
  kuroSync(g, L) {
    const seen = new Set();
    L.forEach((it, i) => {
      const o = it.o ?? {};
      const body = it.key === 'body';
      let sp = body ? g.body : g.sp[it.key];
      if (!sp) sp = g.sp[it.key] = this.segPool.spawn(it.frame, it.x, it.y);
      else if (sp.frame.name !== it.frame && sp.texture.has(it.frame)) sp.setFrame(it.frame);
      const z = BASE + i * 0.0002;
      if (sp.depth !== z) sp.setDepth(z);
      const [ox, oy] = [o.ox ?? 0.5, o.oy ?? 0.5];
      if (sp.originX !== ox || sp.originY !== oy) sp.setOrigin(ox, oy);
      const sx = o.sx ?? 1;
      sp.setPosition(it.x, it.y).setScale(sp.base * sx, sp.base * (o.sy ?? sx)).setRotation(o.rot ?? 0).setAlpha(o.a ?? 1).setVisible(true);
      if (!body) {
        if (o.tint != null) sp.setTint(o.tint).setTintMode(Phaser.TintModes.ADD);
        else if (sp.isTinted) sp.clearTint();
      }
      seen.add(it.key);
    });
    for (const k of Object.keys(g.sp)) {
      if (seen.has(k)) continue;
      this.kuroKill(g.sp[k]);
      delete g.sp[k];
    }
    if (!seen.has('body')) g.body.setVisible(false);
  },

  kuroKill(sp) {
    if (!sp || sp.dead) return;
    sp.setRotation(0).setOrigin(0.5, 0.5).setAlpha(1).setFlipX(false).setFlipY(false).clearTint().setBlendMode(Phaser.BlendModes.NORMAL);
    this.segPool.kill(sp);
  },

  kuroClang(k = 1) {
    const s = this.scene;
    if (s.t > (this.kuroPingAt ?? 0)) {
      this.kuroPingAt = s.t + 0.09 / k;
      s.sfx.bossHit(true);
    }
  },

  // ---------------------------------------------------------------- shots
  /** What it lays open, for the homing orbs (Enemies.nearest): a fist coming back, the drones, the open reactor. */
  kuroMarks(g) {
    if (g.state !== 'fight') return [];
    const out = Object.values(g.fists).filter((f) => f.state === 'reel' || f.state === 'stuck');
    for (const d of g.drones) if (!d.gone && d.out >= 1) out.push(d);
    if ((g.stage === 2 && g.stun > 0) || (g.stage === 3 && g.open > 0)) out.push({ x: g.x + KG.core[0], y: g.by + KG.core[1] });
    return out;
  },

  /**
   * A shot reaching it: a drone, a rocket, a fist (coming back: it hurts it; otherwise it rings off), the crane's iron
   * (it stops there), the body: its armour lets a little through, the chest or the reactor while open a lot (mint).
   * (Enemies.bossDeviceHit)
   */
  kuroShot(shot) {
    const g = this.bossGroup;
    if (!g || g.kind !== 'kurogane' || g.defeated) return false;
    const e = g.body;
    if (e.dead || e.hp <= 0) return false;
    const s = this.scene;
    const r = shot.radius;
    for (const d of g.drones) {
      if (d.gone || d.out < 0.5 || Math.hypot(shot.x - d.x, shot.y - d.y) > 8 + r) continue;
      this.kuroDroneHit(g, d, shot.damage);
      return true;
    }
    for (const k of g.rockets) {
      if (k.gone || Math.hypot(shot.x - k.x, shot.y - k.y) > 4 + r) continue;
      this.kuroRocketBoom(g, k, false);
      s.score.add(100 * s.score.mult);
      return true;
    }
    for (const f of Object.values(g.fists)) {
      if (f.state === 'gone' || Math.hypot(shot.x - f.x, shot.y - f.y) > KURO.fist.r + r) continue;
      if ((f.state === 'reel' || f.state === 'stuck') && g.state === 'fight') this.kuroFistHit(g, f, shot);
      else {
        if (Math.random() < 0.4) s.fx.spark(shot.x, shot.y - 2, 0xd8d8e0);
        this.kuroClang(0.7);
      }
      return true;
    }
    if (g.form === 'gantry') {
      const [x, y] = [g.x, g.y];
      const leg = Math.abs(Math.abs(shot.x - x) - 64.3) < 5 + r && Math.abs(shot.y - y) < 64;
      const beam = Math.abs(shot.y - (y - 50.7)) < 8 + r && Math.abs(shot.x - x) < 72;
      if (leg || beam) {
        if (Math.random() < 0.3) s.fx.spark(shot.x, shot.y - 1, 0xd8d8e0);
        return true;
      }
    }
    if (!this.kuroBodyAt(g, shot.x, shot.y, r)) return false;
    if (g.state !== 'fight') {
      if (Math.random() < 0.4) s.fx.spark(shot.x, shot.y - 2, 0xd8d8e0);
      this.kuroClang(0.6);
      return true;
    }
    // (shots come up from below and meet the skirt first: one in the reactor's column goes on into it while it is open)
    const nearCore = Math.abs(shot.x - (g.x + KG.core[0])) < (g.stage === 2 ? 14 : 11) + r;
    const open = nearCore && ((g.stage === 2 && g.stun > 0) || (g.stage === 3 && g.open > 0));
    this.damage(e, shot.damage * (open ? (g.stage === 2 ? KURO.open.chest : KURO.open.take) : KURO.armour[g.stage - 1]));
    if (open) {
      if (Math.random() < 0.5) s.fx.spark(shot.x, shot.y - 2, SAFE);
    } else if (Math.random() < 0.3) s.fx.spark(shot.x, shot.y - 2);
    return true;
  },

  // ---------------------------------------------------------------- the end
  kuroCleanup(g) {
    for (const sp of Object.values(g.sp)) this.kuroKill(sp);
    g.sp = {};
    for (const k of g.rockets) this.kuroKill(k.sp);
    for (const d of g.drones) if (!d.gone) this.kuroKill(d.sp);
    for (const b of g.bits) this.kuroKill(b.sp);
    Object.assign(g, { rockets: [], drones: [], bits: [], trail: [] });
  },

  /** Going down (Enemies.goDown): its parts stay on as they are for the end (kuroEnd). */
  kuroDown(e) {
    const g = e.group;
    const parts = [];
    for (const [k, sp] of Object.entries(g.sp)) parts.push({ k, sp, ox: sp.x - g.x, oy: sp.y - g.by, sx: sp.scaleX, sy: sp.scaleY, light: /eyes|eye_|core|jet|flash|ring/.test(sp.frame.name) });
    g.sp = {};
    for (const d of g.drones) if (!d.gone) this.kuroDroneHit(g, d, 999);
    return { parts, x: g.x, y: g.by, my: g.by, fw: [], next: 0, frame: g.form };
  },

  /**
   * The end: a chain of blasts over it, its lights going out one by one (the eyes, the reactor, the thrust), it drops on
   * to the apron, kneels and falls on its back into the bay in a great splash; the bay glows in the bridge's colours
   * and fireworks go up. Returns true when it is over.
   */
  kuroEnd(d, dt) {
    const s = this.scene;
    const fx = s.fx;
    const K = d.kg;
    const b = d.body;
    const t = d.t;
    let [mx, my, sy, rot, alpha] = [K.x, K.y, 1, 0, 1];
    if (t < 1.4) {
      mx += Math.round((Math.random() - 0.5) * 3);
      my += Math.round((Math.random() - 0.5) * 3);
      if ((K.next -= dt) <= 0) {
        K.next = 0.1;
        fx.explode(K.x + (Math.random() - 0.5) * 70, K.y + (Math.random() - 0.5) * 80, Math.random() < 0.3 ? 'm' : 's', null, (K.n = (K.n ?? 0) + 1) % 3 !== 0);
      }
    } else if (t < 2.5) {
      // the lights going out: the eyes, the reactor, the thrust
      for (const p of K.parts) {
        if (!p.light) continue;
        const when = /eye/.test(p.sp.frame.name) ? 1.5 : /core|flash|ring/.test(p.sp.frame.name) ? 1.8 : 2.1;
        if (t > when && !p.out) {
          p.out = true;
          fx.smoke(K.x + p.ox * 0.2, K.y + (when > 2 ? 46 : when > 1.7 ? -4 : -30), 2, 3);
        }
      }
    } else if (t < 3.0) {
      // it drops on to the apron
      const q = (t - 2.5) / 0.5;
      my += 10 * q * q;
      if (!K.landed && q > 0.95) {
        K.landed = true;
        s.cameras.main.shake(300, 0.01);
        fx.smoke(K.x - 12, K.y + 50, 4, 10);
        fx.smoke(K.x + 12, K.y + 50, 4, 10);
        fx.text(K.x, K.y + 64, 'DOSUN!', 0.8, 0xffffff);
        s.sfx.explode('m');
      }
    } else if (t < 3.6) {
      // kneeling
      const q = (t - 3.0) / 0.6;
      my += 10 + 4 * q;
      sy = 1 - 0.06 * q;
    } else if (t < 4.8) {
      // on its back, into the bay
      const q = (t - 3.6) / 1.2;
      const e2 = q * q;
      my = K.y + 14 + (SEA_Y - K.y - 14) * e2;
      sy = 0.94 - 0.6 * e2;
      rot = -0.08 * e2;
    } else {
      my = SEA_Y;
      sy = 0.34;
      alpha = Math.max(0, 1 - (t - 4.8) / 0.6);
      if (!K.splash) {
        K.splash = true;
        s.cameras.main.shake(700, 0.016);
        fx.flash(0.6, 0.5);
        fx.shockwave(K.x, SEA_Y);
        for (let i = 0; i < 16; i++) fx.puff('splash', K.x + (Math.random() - 0.5) * 120, SEA_Y + (Math.random() - 0.5) * 14, 0.6);
        for (let i = 0; i < 30; i++) fx.part(fx.parts, 'drop_0', K.x + (Math.random() - 0.5) * 100, SEA_Y, { vx: (Math.random() - 0.5) * 220, vy: -60 - Math.random() * 120, g: 260, drag: 0.3, life: 0.9 }).setTint(0xd8f0ff);
        fx.text(K.x, SEA_Y + 50, 'ZABBOOON!', 1.4, 0xd8f0ff);
        s.sfx.explode('l');
      }
    }
    // (the body's copy from goDown joins its parts, once)
    if (!K.withBody) {
      K.withBody = true;
      K.parts.unshift({ sp: b, ox: 0, oy: 0, sx: b.scaleX, sy: b.scaleY, light: false });
      for (const p of K.parts) p.rot0 = p.sp.rotation;
    }
    const flash = t < 1.4 && Math.floor(t * 14) % 2;
    // (with its lights out the whole mech goes dark: the reactor drawn in its frame too)
    const dim = Phaser.Math.Clamp((t - 1.7) / 0.8, 0, 1);
    const dark = Phaser.Display.Color.GetColor(255 - 120 * dim, 255 - 115 * dim, 255 - 100 * dim);
    const [c, sn] = [Math.cos(rot), Math.sin(rot)];
    for (const p of K.parts) {
      const sp = p.sp;
      const [px, py] = [p.ox, p.oy * sy];
      sp.setPosition(mx + px * c - py * sn, my + px * sn + py * c);
      sp.setScale(p.sx, p.sy * sy).setRotation(p.rot0 + rot);
      sp.setAlpha(p.out ? 0 : alpha);
      if (flash) sp.setTint(0x707070).setTintMode(Phaser.TintModes.ADD);
      else if (dim > 0) sp.setTint(dark).setTintMode(Phaser.TintModes.MULTIPLY);
      else if (sp.isTinted) sp.clearTint();
    }
    // the bay in the colours of the bridge's lights, fireworks going up over it
    if (t > 4.9) {
      if (Math.random() < 0.45) {
        const x = Math.random() * VIEW.width;
        fx.light(x, 6 + Math.random() * 28, 0.6, false, Phaser.Display.Color.HSVToRGB(((x / VIEW.width + t * 0.3) % 1), 0.55, 1).color);
      }
      if ((K.next -= dt) <= 0 && t < KURO.outro - 1) {
        K.next = 0.3 + Math.random() * 0.25;
        K.fw.push({ x: 24 + Math.random() * (VIEW.width - 48), y: s.H * 0.55, ty: 30 + Math.random() * s.H * 0.3, t: 0, col: [0xff7a8a, 0xffd868, 0x8ae0ff, 0xc8a0ff, 0x9affa8, 0xffb060][Math.floor(Math.random() * 6)] });
      }
    }
    for (const f of K.fw) {
      f.t += dt;
      if (!f.burst) {
        const y = f.y + (f.ty - f.y) * Math.min(1, f.t / 0.55);
        if (Math.random() < 0.8) fx.part(fx.parts, 'dot_1', f.x + (Math.random() - 0.5), y, { vy: 12, life: 0.25, a0: 0.8 }).setTint(0xffe8c0);
        if (f.t >= 0.55) {
          f.burst = true;
          for (let i = 0; i < 40; i++) {
            const an = (i / 28) * TAU + (i >= 28 ? 0.1 : 0);
            const v = i < 28 ? 52 + Math.random() * 12 : 24 + Math.random() * 8; // (an outer ring and an inner one)
            fx.part(fx.parts, i < 28 ? 'dot_2' : 'dot_1', f.x, f.ty, { vx: Math.cos(an) * v, vy: Math.sin(an) * v, g: 26, drag: 1.1, life: 1.05, a0: 1 }).setTint(i < 28 ? f.col : 0xffffff).setBlendMode(Phaser.BlendModes.ADD);
          }
          fx.light(f.x, f.ty, 1.6, false, f.col);
          s.sfx.explode('s');
        }
      }
    }
    K.fw = K.fw.filter((f) => !f.burst || f.t < 1);
    if (t < KURO.outro) return false;
    for (const p of K.parts) if (p.sp !== b) this.kuroKill(p.sp);
    return true;
  },
};
