// Kawaguchiko's miniboss (docs/plan-kawaguchiko.md, 6.1): KACHI-KACHI USAGI, the hare with the flint. Methods of
// Enemies (mixed in like the cities'). A heavy with "hold": the scroll stops over open water by Unoshima and the
// fight is on the lake. Art: tools/art/kawaguchiko/usagi.mjs (frames k_usagi_*, k_dorobune_*, k_shiba_*, k_gondola_*).
import Phaser from 'phaser';
import { DEPTH, FAIR, VIEW } from '../../config.js';
import { rules, volley } from '../../difficulty.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * Its life, the phases' thresholds, how long it stays, where it sits, how much quicker it gets as it tires (rush);
 * the sparks it strikes (every how long a run of three knocks, the gap between them, the fans and the star at the
 * third); the burning bundles it throws (how often, the size of their fire, how long they burn, how fast the lake
 * carries them down, their life, the sparks they burst into); the crocks of red pepper (every how many throws, the
 * flight, the spiral's turn and arms, how long and how fast it sprays); the boats of mud (their life, how often they
 * spit, the carousel's ellipse and its speeds calm and in a swirl, how often it swirls, how soon he calls up more,
 * the mud boats' charges at the ship); the charges across the lake (the warning, from below longer, the speed, how
 * long he lies spent, the lanes, the wake); the oar beaten on the water; the whirl at the end.
 */
export const USAGI = {
  hp: 860,
  phase: [0.66, 0.33],
  time: 95,
  home: 96,
  rush: 0.45,
  strike: { every: 2.4, gap: 0.34, n: 7, arc: 1.25, star: 10 },
  bundle: { every: 3.6, r: 7, live: 6.5, fly: 0.95, drift: 15, hp: 8, burst: 8 },
  pot: { each: 3, fly: 1.1, turn: 5.5, arms: 2, spray: 0.9, rate: 0.085 },
  mud: { n: 3, hp: 70, fire: [2.2, 3.4], rx: 64, ry: 20, ride: [0.55, 1.6], swirl: 1.3, flip: 6, back: 4, ram: { every: 4.4, warn: 0.85, speed: 150, ring: 8 } },
  dash: { warn: 1.05, warnUp: 1.45, speed: 210, tired: 2.4, lanes: [72, 158], wake: 15 },
  slam: { raise: 0.6, after: 0.45, n: 11, arc: 1.15 },
  whirl: { at: 0.15, cx: 90, cy: 128, r: 26, time: 3.6, w: 3.6, rate: 0.1, every: 3, rest: 1.8 },
};

const SAFE = 0x81f3cc;
const WARN = 0xff735e;
const GOLD = 0xffd84a;
const BOAT = [9, 17]; // the boat's half width and half length, for what hits it
const KINDS = ['h', 'd', 'u']; // the charges in turn: across, slantwise, up from below behind the ship
const SAY = (s, x, y, t, c = 0xffffff, size = 0.8) => s.fx.text(x, y, t, size, c);
const easy = () => rules().volley < 1; // (easy: the mud boats soak through sooner, the hare rests longer)
const ease = (k) => k * k * (3 - 2 * k);
/** Is (px, py) on a boat at (x, y) lying along `rot` (0: its bow down the screen)? pad: a margin round it. */
const onBoat = (px, py, x, y, rot, pad = 0) => {
  const [c, sn] = [Math.cos(rot), Math.sin(rot)];
  const [dx, dy] = [px - x, py - y];
  return Math.abs(dx * c + dy * sn) < BOAT[0] + pad && Math.abs(-dx * sn + dy * c) < BOAT[1] + pad;
};

export const kawaguchikoUsagi = {
  /**
   * The white hare in his red headband rows out on to the lake in his wooden boat. Three phases:
   * 1. KRZESIWO: he knocks striker and flint together in runs of three ("KACHI KACHI!"): a fan of sparks, a fan
   *    between its lines, a star; he throws bundles of brushwood alight, which the lake carries down burning at the
   *    ship (shot, one bursts into sparks), and every third throw a crock of red pepper paste (the tale's "medicine"
   *    for the burnt tanuki), which breaks on the water and sprays its flakes out in a spiral;
   * 2. ŁODZIE Z BŁOTA: three boats of mud come up, each with a clay hare in it, and all four go round in a ring, now
   *    and then swirling the other way, fast; the mud ones spit mud and one at a time charges straight at the ship
   *    and bursts into gobs; the real boat glints gold while the ring is calm. Shot, a mud boat soaks, crumbles and
   *    sinks with a gurgle; only the real one gives;
   * 3. WIOSŁO: he rows like mad, ramming along a lane flagged red: across the lake, slantwise, then up from below
   *    behind the ship, leaving a wake of shots; between charges he beats the water with his oar ("PACHAN!") and a
   *    wave of drops flies at the ship; near the end he rows round in a whirl, its wake a spiral. After each run
   *    he lies spent, panting: then (mint) he can be hit, and only then.
   * The less life he has, the quicker he goes about it all. Beaten, he leaps out of his boat into the ropeway's
   * gondola as it passes over the lake and is carried off to Mt Tenjo, waving.
   */
  spawnUsagi(e) {
    const g = (e.us = {
      t: 0, act: 'enter', at: 0, x: 90, y: -70, rot: 0, pace: 1, strikeAt: 1.2, throwAt: 3, throws: 0, knock: 0, glintAt: 0, glint: 0, row: 0,
      bundles: [], pots: [], stains: [], muds: [], ring: null, slot: 0, swirl: 0, flipAt: 0, ramAt: 0,
      kind: 'h', side: -1, dashes: 0, cycle: 0, whirled: -99,
    });
    Object.assign(e, { stage: 1, radius: 13 });
    e.setDepth(DEPTH.air - 0.09);
    e.u = this.scene.parallax.stripU(USAGI.home);
    return e;
  },

  usagi(e, dt) {
    const g = e.us;
    if (!g) return;
    g.t += dt;
    g.at += dt;
    const frac = e.hp / e.maxHp;
    // quicker the more worn he is: 1 at full life, 1 + rush at none
    g.pace = 1 + USAGI.rush * (1 - frac);
    if (e.state === 'enter') this.usEnter(e, g, dt);
    else if (e.state === 'leave') this.usLeave(e, g, dt);
    else {
      g.fight = (g.fight ?? 0) + dt;
      if (g.fight > USAGI.time && !g.going) this.usGiveUp(e, g);
      else if (e.stage === 1 && frac < USAGI.phase[0]) this.usToMud(e, g);
      else if (e.stage === 2 && frac < USAGI.phase[1]) this.usToOar(e, g);
      if (e.state !== 'fight') {
        // (given up: on his way)
      } else if (e.stage === 1) this.usFlint(e, g, dt);
      else if (e.stage === 2) this.usMud(e, g, dt);
      else this.usOar(e, g, dt, frac);
    }
    this.usBundles(e, g, dt);
    this.usPots(e, g, dt);
    // a splash at every other stroke of the oars
    const stroke = Math.floor(g.row / 2);
    if (stroke !== g.oarStroke) {
      g.oarStroke = stroke;
      this.scene.sfx.oar?.();
    }
    this.usMuds(e, g, dt);
    this.usPlace(e, g, dt);
  },

  usAct(g, act) {
    Object.assign(g, { act, at: 0 });
  },

  /** Rowing in from the top of the lake to his place. */
  usEnter(e, g, dt) {
    g.y += (USAGI.home - g.y) * Math.min(1, dt * 1.6);
    g.row += dt * 6;
    if (g.at > 2.2) {
      e.state = 'fight';
      this.usAct(g, 'rest');
      SAY(this.scene, g.x, g.y + 30, 'KACHI KACHI!', 0xffd080, 1);
    }
  },

  // ---------------------------------------------------------------- phase 1: the flint, the bundles, the pepper
  usFlint(e, g, dt) {
    const S = USAGI.strike;
    // about the open water, a lazy stroke now and then, coming down the lake and back
    const tx = 90 + Math.sin(g.t * 0.45) * 50;
    const ty = USAGI.home + 12 + Math.sin(g.t * 0.31) * 22;
    g.x += (tx - g.x) * Math.min(1, dt * 1.2);
    g.y += (ty - g.y) * Math.min(1, dt * 1.6);
    if (g.act === 'rest') {
      if (g.t > g.throwAt) this.usAct(g, 'throw');
      else if (g.t > g.strikeAt) {
        this.usAct(g, 'strike');
        g.knock = 0;
      }
    } else if (g.act === 'strike') {
      // a run of three knocks, in time: a fan of sparks, a fan between its lines, then a star
      if (g.at > (S.gap * (g.knock + 1)) / g.pace) {
        this.usKnock(e, g, g.knock);
        if (++g.knock >= 3) {
          g.strikeAt = g.t + (S.every * (0.85 + Math.random() * 0.3)) / g.pace;
          g.throwAt = Math.max(g.throwAt, g.t + 0.6);
          this.usAct(g, 'rest');
        }
      }
    } else if (g.act === 'throw') {
      if (g.at > 0.4) {
        if (++g.throws % USAGI.pot.each === 0) this.usPot(e, g);
        else this.usThrow(e, g);
        g.throwAt = g.t + (USAGI.bundle.every * (0.85 + Math.random() * 0.3)) / g.pace;
        g.strikeAt = Math.max(g.strikeAt, g.t + 0.7);
        this.usAct(g, 'rest');
      }
    }
  },

  /** One knock of the flint: k 0 a fan aimed at the ship, k 1 the same fan turned half a line, k 2 a star. */
  usKnock(e, g, k) {
    const s = this.scene;
    const S = USAGI.strike;
    const [x, y] = [g.x, g.y + 22];
    if (this.canFire(e)) {
      if (k < 2) {
        if (k === 0) g.aim = this.aimAt(e, 0, 20);
        const n = volley(S.n);
        const step = n > 1 ? S.arc / (n - 1) : 0.2;
        const m = k ? n + 1 : n; // (the second between the first's lines and out past its ends)
        for (let i = 0; i < m; i++) s.bullets.shot('eb_lava', x, y, g.aim + (i - (m - 1) / 2) * step, normal * (0.85 + (i % 2) * 0.15), 1.8);
      } else {
        const n = volley(S.star);
        const off = Math.random() * TAU;
        for (let i = 0; i < n; i++) s.bullets.shot('eb_lava', x, y, off + (i / n) * TAU, slow * 1.05, 1.8);
      }
      for (let i = 0; i < 6; i++) s.fx.part(s.fx.parts, 'dot_1', x, y, { vx: (Math.random() - 0.5) * 120, vy: Math.random() * 90, drag: 2, life: 0.35 }).setTint(0xffd060);
    }
    SAY(s, g.x + (Math.random() - 0.5) * 20, g.y + 34, k === 2 ? 'KACHI KACHI!' : 'KACHI!', 0xffd080, k === 2 ? 0.75 : 0.6);
    s.sfx.flint?.();
  },

  /** A burning bundle of brushwood thrown in an arc on to the water above the ship: a ring warns where it lands. */
  usThrow(e, g) {
    const s = this.scene;
    if (!this.canFire(e)) return;
    const p = s.player;
    const tx = Phaser.Math.Clamp(p.x + (Math.random() - 0.5) * 60, 20, VIEW.width - 20);
    const ty = Phaser.Math.Clamp(p.y - 70 - Math.random() * 40, g.y + 36, s.H * 0.5);
    const sp = this.segPool.spawn('k_shiba_0', g.x + 12, g.y - 14).setDepth(DEPTH.air - 0.06);
    g.bundles.push({ sp, x0: g.x + 12, y0: g.y - 14, x: tx, y: ty, t: 0, landed: false, hp: USAGI.bundle.hp, seed: Math.random() * 6 });
  },

  /** The bundles: flying, then burning on the water, carried down the lake at the ship; they scald to touch. */
  usBundles(e, g, dt) {
    const s = this.scene;
    const B = USAGI.bundle;
    const p = s.player;
    for (const k of g.bundles) {
      k.t += dt;
      if (!k.landed) {
        const q = Math.min(1, k.t / B.fly);
        k.sp.setPosition(k.x0 + (k.x - k.x0) * q, k.y0 + (k.y - k.y0) * q - Math.sin(q * Math.PI) * 34).setRotation(k.t * 9).setScale((1 + Math.sin(q * Math.PI) * 0.5) / 3);
        this.tele.lineStyle(1, WARN, 0.8).strokeCircle(k.x, k.y, B.r + 2 + (1 - q) * 8);
        if (Math.random() < dt * 20) s.fx.part(s.fx.parts, 'dot_1', k.sp.x, k.sp.y, { vy: 20, life: 0.3 }).setTint(0xffa040);
        if (q >= 1) {
          k.landed = true;
          k.sp.setRotation(0).setScale(1 / 3);
          s.fx.text(k.x, k.y - 14, 'JUU!', 0.5, 0xffb060);
          for (let i = 0; i < 6; i++) s.fx.part(s.fx.parts, 'dot_1', k.x, k.y, { vx: (Math.random() - 0.5) * 70, vy: -30 - Math.random() * 30, g: 140, life: 0.45 }).setTint(0xd8f0ff);
        }
        continue;
      }
      // burning, drifting down with the lake, swaying
      k.x += Math.sin(k.t * 1.3 + k.seed) * 5 * dt;
      k.y += B.drift * dt;
      k.sp.setFrame(`k_shiba_${Math.floor(k.t * 6) % 2}`).setPosition(k.x, k.y);
      s.sfx.crackle?.();
      if (Math.random() < dt * 6) s.fx.part(s.fx.parts, 'dot_1', k.x + (Math.random() - 0.5) * 6, k.y - 4, { vy: -18, life: 0.35 }).setTint(0xffa040);
      if (p.alive && !p.god && p.invulnerable <= 0 && p.entering <= 0 && Math.hypot(p.x - k.x, p.y - k.y) < B.r) p.hit();
      if (k.t > B.fly + B.live || k.y > s.H + 10) this.usPutOut(k);
    }
    g.bundles = g.bundles.filter((k) => !k.gone);
  },

  usPutOut(k) {
    this.scene.fx.puff('wisp_s_1', k.x, k.y - 4, 0.6);
    this.segPool.kill(k.sp);
    k.gone = true;
  },

  /** A bundle shot to pieces: up the lake it bursts into a ring of sparks; low, near the ship, it only hisses out. */
  usBurst(k) {
    const s = this.scene;
    if (k.y < s.H * FAIR.noFireBelow && s.bombClear <= 0) {
      const n = volley(USAGI.bundle.burst);
      const off = Math.random() * TAU;
      for (let i = 0; i < n; i++) s.bullets.shot('eb_lava', k.x, k.y, off + (i / n) * TAU, slow * 0.9, 1.8);
      SAY(s, k.x, k.y - 12, 'PACHI!', 0xffb060, 0.5);
    }
    for (let i = 0; i < 8; i++) s.fx.part(s.fx.parts, 'dot_1', k.x, k.y, { vx: (Math.random() - 0.5) * 90, vy: (Math.random() - 0.5) * 90, drag: 2, life: 0.4 }).setTint(0xffa040);
    s.sfx.crackle?.();
    this.usPutOut(k);
  },

  /** A crock of red pepper paste lobbed at the water above the ship; a ring warns where it breaks. */
  usPot(e, g) {
    const s = this.scene;
    if (!this.canFire(e)) return;
    const p = s.player;
    const tx = Phaser.Math.Clamp(p.x + (Math.random() - 0.5) * 40, 28, VIEW.width - 28);
    const ty = Phaser.Math.Clamp(p.y - 95, g.y + 44, s.H * 0.48);
    const sp = this.segPool.spawn('k_tsubo', g.x + 12, g.y - 14).setDepth(DEPTH.air - 0.06);
    g.pots.push({ sp, x0: g.x + 12, y0: g.y - 14, x: tx, y: ty, t: 0, burst: -1, emit: 0, off: Math.random() * TAU });
    SAY(s, g.x, g.y + 30, 'KUSURI DA YO~', 0xff9a80, 0.6);
  },

  usPots(e, g, dt) {
    const s = this.scene;
    const P = USAGI.pot;
    for (const k of g.pots) {
      k.t += dt;
      if (k.burst < 0) {
        const q = Math.min(1, k.t / P.fly);
        k.sp.setPosition(k.x0 + (k.x - k.x0) * q, k.y0 + (k.y - k.y0) * q - Math.sin(q * Math.PI) * 44).setRotation(k.t * 7).setScale((1 + Math.sin(q * Math.PI) * 0.6) / 3);
        const r = 14 + (1 - q) * 10;
        this.tele.lineStyle(1, WARN, 0.85).strokeCircle(k.x, k.y, r);
        this.tele.fillStyle(WARN, 0.1 + 0.08 * Math.sin(k.t * 24)).fillCircle(k.x, k.y, r);
        if (q >= 1) {
          // it breaks on the water: shards, a red stain, and the flakes start to spray
          k.burst = 0;
          this.segPool.kill(k.sp);
          k.sp = null;
          SAY(s, k.x, k.y - 16, 'PAKAN!', 0xff7a5a, 0.7);
          s.sfx.crock?.();
          s.fx.debris(k.x, k.y, 5, 0x6a3a22, 1);
          for (let i = 0; i < 10; i++) s.fx.part(s.fx.parts, 'dot_1', k.x, k.y, { vx: (Math.random() - 0.5) * 100, vy: (Math.random() - 0.5) * 100, drag: 3, life: 0.5 }).setTint(i % 2 ? 0xe0301a : 0xff8a4a);
          g.stains.push({ x: k.x, y: k.y, t: 0 });
        }
        continue;
      }
      // the spray: flakes thrown out along turning arms, a spiral
      k.burst += dt;
      k.emit -= dt;
      if (k.burst < P.spray && k.emit <= 0 && s.bombClear <= 0) {
        k.emit = P.rate / Math.min(1.3, g.pace);
        const arms = Math.max(1, Math.round(volley(P.arms)));
        for (let j = 0; j < arms; j++) {
          const a = k.off + k.burst * P.turn + (j / arms) * TAU;
          s.bullets.shot(`k_flake_${(j + Math.floor(k.burst * 20)) % 2}`, k.x, k.y, a, slow * 0.95, 1.8, { spin: true });
        }
      }
      if (k.burst >= P.spray) k.gone = true;
    }
    g.pots = g.pots.filter((k) => !k.gone);
    // the red stains on the water, fading
    for (const st of g.stains) {
      st.t += dt;
      this.tele.fillStyle(0xc02a18, 0.35 * (1 - st.t / 2.4)).fillEllipse(st.x, st.y, 22 + st.t * 6, 12 + st.t * 3);
    }
    g.stains = g.stains.filter((st) => st.t < 2.4);
  },

  // ---------------------------------------------------------------- phase 2: the boats of mud
  usToMud(e, g) {
    const s = this.scene;
    this.phaseBreak(e, g.x, g.y, 2, 'ŁODZIE Z BŁOTA');
    SAY(s, 90, g.y - 30, 'PON!', 0xd8b080, 1);
    g.ring = { a: Math.random() * TAU, w: USAGI.mud.ride[0], dir: 1 };
    g.slot = Math.floor(Math.random() * 4);
    g.flipAt = g.t + USAGI.mud.flip;
    g.ramAt = g.t + 3;
    this.usMudUp(e, g);
    this.usAct(g, 'rest');
  },

  /** Where place i of the ring is now. */
  usRingAt(g, i) {
    const M = USAGI.mud;
    const a = g.ring.a + (i / 4) * TAU;
    return [90 + Math.cos(a) * M.rx, USAGI.home + 14 + Math.sin(a) * M.ry];
  },

  /** Three boats of mud come up out of the lake, each with a clay hare in it, in the ring's empty places. */
  usMudUp(e, g) {
    const s = this.scene;
    const taken = new Set(g.muds.map((m) => m.slot));
    let m = 0;
    for (let i = 0; i < 4; i++) {
      if (i === g.slot || taken.has(i)) continue;
      const [x, y] = this.usRingAt(g, i);
      const sp = this.segPool.spawn('k_dorobune_0', x, y).setDepth(DEPTH.air - 0.095).setAlpha(0);
      g.muds.push({ sp, slot: i, x, y, hp: USAGI.mud.hp * (easy() ? 0.6 : 1), fireAt: g.t + 1.4 + m * 0.6, hurt: 0, sink: 0, up: 0, ram: null });
      m++;
      for (let k = 0; k < 5; k++) s.fx.part(s.fx.parts, 'dot_1', x, y - 20, { vx: (Math.random() - 0.5) * 50, vy: -20 - Math.random() * 30, g: 120, life: 0.5 }).setTint(0x6a4a2a);
    }
  },

  usMud(e, g, dt) {
    const s = this.scene;
    const M = USAGI.mud;
    const R = g.ring;
    // the ring turns; now and then it swirls the other way, fast, and he cannot be told from the mud ones
    if (g.t > g.flipAt && g.muds.some((m) => !m.sink && !m.ram)) {
      g.flipAt = g.t + (M.flip * (0.8 + Math.random() * 0.4)) / g.pace;
      g.swirl = M.swirl;
      R.dir = -R.dir;
      SAY(s, 90, USAGI.home - 20, 'GURU GURU!', 0xd8b080, 0.7);
    }
    if (g.swirl > 0) g.swirl -= dt;
    const w = (g.swirl > 0 ? M.ride[1] : M.ride[0]) * g.pace;
    R.w += (w - R.w) * Math.min(1, dt * 3);
    R.a += R.w * R.dir * dt;
    const [tx, ty] = this.usRingAt(g, g.slot);
    g.x += (tx - g.x) * Math.min(1, dt * 5);
    g.y += (ty - g.y) * Math.min(1, dt * 5);
    g.row += dt * (6 + R.w * 6);
    // the real boat glints gold, now and then, while the ring is calm
    if (g.swirl <= 0 && g.t > g.glintAt) {
      g.glintAt = g.t + 1.7;
      g.glint = 0.3;
    }
    // a mud boat charges at the ship
    if (g.t > g.ramAt) {
      const ready = g.muds.filter((m) => !m.sink && !m.ram && m.up >= 1);
      if (ready.length && this.canFire(e)) {
        const m = ready[Math.floor(Math.random() * ready.length)];
        const p = s.player;
        const ang = Phaser.Math.Clamp(Math.atan2(p.y - m.y, p.x - m.x), DOWN - 1, DOWN + 1);
        m.ram = { t: 0, ang, go: false };
        SAY(s, m.x, m.y - 22, 'DOSHIN!', 0xd8b080, 0.6);
      }
      g.ramAt = g.t + (M.ram.every * (0.85 + Math.random() * 0.3)) / g.pace;
    }
    // all of them gone: he calls up more
    if (!g.muds.length) {
      g.backAt ??= g.t + M.back;
      if (g.t > g.backAt) {
        g.backAt = null;
        this.usMudUp(e, g);
      }
    }
    // he strikes sparks now and then from among them
    if (g.t > g.strikeAt && this.canFire(e)) {
      g.strikeAt = g.t + (USAGI.strike.every * 1.4) / g.pace;
      const a = this.aimAt(e, 0, 20);
      for (let i = 0; i < volley(3); i++) s.bullets.shot('eb_lava', g.x, g.y + 22, a + (i - 1) * 0.22, normal, 1.8);
    }
  },

  usMuds(e, g, dt) {
    const s = this.scene;
    const p = s.player;
    const M = USAGI.mud;
    for (const m of g.muds) {
      m.up = Math.min(1, m.up + dt * 1.5);
      m.hurt = Math.max(0, m.hurt - dt);
      if (m.sink) {
        // soaking, crumbling, down with a gurgle
        m.sink += dt;
        m.sp.setFrame('k_dorobune_2').setPosition(m.x, m.y + m.sink * 6).setAlpha(Math.max(0, 1 - m.sink / 0.9));
        if (Math.random() < dt * 14) s.fx.part(s.fx.parts, 'dot_1', m.x + (Math.random() - 0.5) * 16, m.y + (Math.random() - 0.5) * 24, { vy: -20, life: 0.4 }).setTint(0xd8f0ff);
        if (m.sink > 0.9) {
          this.segPool.kill(m.sp);
          m.gone = true;
        }
        continue;
      }
      let rot = 0;
      let shake = 0;
      if (m.ram) {
        // its lane flagged red, a shudder, then straight at the ship until it falls apart into gobs
        const r = m.ram;
        r.t += dt;
        rot = r.ang - DOWN;
        if (!r.go) {
          const [c, sn] = [Math.cos(r.ang), Math.sin(r.ang)];
          this.tele.lineStyle(BOAT[0] * 2, WARN, 0.12 + 0.1 * Math.sin(r.t * 20)).lineBetween(m.x, m.y, m.x + c * 400, m.y + sn * 400);
          shake = (Math.random() - 0.5) * 2;
          if (r.t > M.ram.warn) r.go = true;
        } else {
          m.x += Math.cos(r.ang) * M.ram.speed * dt;
          m.y += Math.sin(r.ang) * M.ram.speed * dt;
          if (m.y > s.H * 0.6 || m.x < 10 || m.x > VIEW.width - 10) this.usRamEnd(g, m);
        }
      } else if (e.stage === 2) {
        [m.x, m.y] = this.usRingAt(g, m.slot);
        m.y += (1 - m.up) * 30;
      }
      const k = m.sink ? 2 : m.hp < M.hp * (easy() ? 0.3 : 0.5) ? 1 : 0;
      m.sp.setFrame(`k_dorobune_${k}`).setPosition(m.x + shake, m.y).setAlpha(m.up).setRotation(rot).setDepth(DEPTH.air - 0.095 + m.y * 1e-4);
      if (m.hurt > 0) m.sp.setTint(0x808080).setTintMode(Phaser.TintModes.ADD);
      else if (m.sp.isTinted) m.sp.clearTint();
      // a gob of mud from each still in the ring, at the ship
      if (!m.ram && !m.sink && e.state === 'fight' && m.up >= 1 && g.t > m.fireAt && this.canFire(e)) {
        m.fireAt = g.t + M.fire[0] + Math.random() * (M.fire[1] - M.fire[0]);
        const a = Math.atan2(p.y - m.y, p.x - m.x);
        for (const da of volley(3) >= 3 ? [-0.2, 0, 0.2] : [0]) s.bullets.shot('eb_ink', m.x, m.y + 18, a + da, slow * 1.15, 2.2);
      }
      // ramming one hurts
      if (!m.sink && p.alive && !p.god && p.invulnerable <= 0 && p.entering <= 0 && onBoat(p.x, p.y, m.x, m.y, rot)) p.hit();
    }
    g.muds = g.muds.filter((m) => !m.gone);
  },

  /** A charging mud boat at the end of its run: it bursts into a ring of gobs and sinks. */
  usRamEnd(g, m) {
    const s = this.scene;
    if (m.y < s.H * FAIR.noFireBelow && s.bombClear <= 0) {
      const n = volley(USAGI.mud.ram.ring);
      const off = Math.random() * TAU;
      for (let i = 0; i < n; i++) s.bullets.shot('eb_ink', m.x, m.y, off + (i / n) * TAU, slow * 0.9, 2.2);
    }
    SAY(s, m.x, m.y - 18, 'BOCHA!', 0xb89870, 0.6);
    this.usSink(g, m);
  },

  usSink(g, m) {
    const s = this.scene;
    m.sink = 0.001;
    SAY(s, m.x, m.y - 20, 'BUKU BUKU...', 0xb89870, 0.6);
    s.fx.debris(m.x, m.y, 6, 0x6a4a2a, 1);
    s.sfx.explode('s');
  },

  // ---------------------------------------------------------------- phase 3: the oars
  usToOar(e, g) {
    const s = this.scene;
    this.phaseBreak(e, g.x, g.y, 3, 'WIOSŁO');
    for (const m of g.muds) if (!m.sink) this.usSink(g, m);
    g.side = g.x < 90 ? -1 : 1;
    this.usLine(e, g);
    SAY(s, g.x, g.y + 30, 'YOSHA!', 0xffffff, 1);
  },

  /** The next charge's lane, flagged red: across the lake, slantwise down or up it, or up from below behind the ship. */
  usLine(e, g) {
    const s = this.scene;
    const D = USAGI.dash;
    g.kind = KINDS[g.dashes % KINDS.length];
    const [l0, l1] = D.lanes;
    const near = g.side < 0 ? 16 : VIEW.width - 16;
    const far = VIEW.width - near;
    if (g.kind === 'h') {
      const y = l0 + Math.random() * (l1 - l0);
      [g.p0, g.p1] = [[near, y], [far, y]];
    } else if (g.kind === 'd') {
      const [ya, yb] = Math.random() < 0.5 ? [l0 - 6, l1 + 10] : [l1 + 10, l0 - 6];
      [g.p0, g.p1] = [[near, ya], [far, yb]];
    } else {
      const x = Phaser.Math.Clamp(s.player.x, 26, VIEW.width - 26);
      [g.p0, g.p1] = [[x, s.H + 26], [x, USAGI.home]];
    }
    g.ang = Math.atan2(g.p1[1] - g.p0[1], g.p1[0] - g.p0[0]);
    g.from = [g.x, g.y];
    this.usAct(g, 'line');
  },

  usOar(e, g, dt, frac) {
    const s = this.scene;
    const D = USAGI.dash;
    const p = s.player;
    if (g.act === 'line') {
      const warn = g.kind === 'u' ? D.warnUp : D.warn;
      const hw = BOAT[0] + 3;
      if (g.kind === 'u') {
        // off the side of the lake, and round under it out of sight
        const k = ease(Math.min(1, g.at / (warn * 0.5)));
        const off = g.side < 0 ? -26 : VIEW.width + 26;
        if (k < 1) [g.x, g.y] = [g.from[0] + (off - g.from[0]) * k, g.from[1]];
        else [g.x, g.y] = g.p0;
        g.rot = k < 1 ? (g.side < 0 ? Math.PI / 2 : -Math.PI / 2) : Math.PI;
        // the column flagged, and arrows climbing from its foot: he comes from below
        const x = g.p0[0];
        this.tele.fillStyle(WARN, 0.12 + 0.1 * Math.sin(g.at * 20)).fillRect(x - hw, 0, hw * 2, s.H);
        this.tele.lineStyle(1, WARN, 0.9).lineBetween(x - hw, 0, x - hw, s.H).lineBetween(x + hw, 0, x + hw, s.H);
        for (let i = 0; i < 3; i++) {
          const y = s.H - 12 - i * 9 - ((g.at * 30) % 9);
          this.tele.lineStyle(2, WARN, 0.9).lineBetween(x - 6, y + 4, x, y - 2).lineBetween(x, y - 2, x + 6, y + 4);
        }
      } else {
        const k = ease(Math.min(1, g.at / (warn * 0.6)));
        g.x = g.from[0] + (g.p0[0] - g.from[0]) * k;
        g.y = g.from[1] + (g.p0[1] - g.from[1]) * k;
        if (g.at > warn * 0.5) g.rot = g.ang - DOWN;
        // the lane: a band along the line, from one side of the lake to the other
        const [c, sn] = [Math.cos(g.ang), Math.sin(g.ang)];
        const [ax, ay, bx, by] = [g.p0[0] - c * 30, g.p0[1] - sn * 30, g.p1[0] + c * 30, g.p1[1] + sn * 30];
        this.tele.lineStyle(hw * 2, WARN, 0.12 + 0.1 * Math.sin(g.at * 20)).lineBetween(ax, ay, bx, by);
        this.tele.lineStyle(1, WARN, 0.9).lineBetween(ax - sn * hw, ay + c * hw, bx - sn * hw, by + c * hw).lineBetween(ax + sn * hw, ay - c * hw, bx + sn * hw, by - c * hw);
      }
      g.row += dt * 8;
      if (g.at > warn) {
        [g.x, g.y] = g.p0;
        g.rot = g.ang - DOWN;
        g.went = 0;
        g.wakeAt = 0;
        this.usAct(g, 'dash');
        SAY(s, g.x, Phaser.Math.Clamp(g.y - 22, 20, s.H - 40), g.kind === 'u' ? 'URYAAA!' : 'ORYAAA!', 0xffffff, 0.8);
      }
    } else if (g.act === 'dash') {
      const speed = D.speed * (1 + 0.5 * USAGI.rush * (1 - frac / USAGI.phase[1]));
      const len = Math.hypot(g.p1[0] - g.p0[0], g.p1[1] - g.p0[1]);
      g.went += speed * dt;
      const k = Math.min(1, g.went / len);
      g.x = g.p0[0] + (g.p1[0] - g.p0[0]) * k;
      g.y = g.p0[1] + (g.p1[1] - g.p0[1]) * k;
      g.row += dt * 22;
      // the wake: shots left in it either side by turns, drifting off (none from low on the screen: canFire)
      if (g.went - g.wakeAt > D.wake) {
        g.wakeAt = g.went;
        g.wakeN = (g.wakeN ?? 0) + 1;
        const sy = g.wakeN % 2 ? -1 : 1;
        const out = g.ang + (sy * Math.PI) / 2;
        const dir = g.kind === 'u' ? out : DOWN + sy * 0.3;
        if (this.canFire(e)) s.bullets.shot('eb_s', g.x + Math.cos(out) * 7, g.y + Math.sin(out) * 7, dir, slow * 0.75, 1.8);
      }
      if (p.alive && !p.god && p.invulnerable <= 0 && p.entering <= 0 && onBoat(p.x, p.y, g.x, g.y, g.rot, 2)) p.hit();
      if (k >= 1) {
        g.side = g.kind === 'u' ? (g.x < 90 ? -1 : 1) : -g.side;
        g.dashes++;
        g.cycle++;
        this.usTired(g, D.tired);
      }
    } else if (g.act === 'tired') {
      // spent: open to hits, a mint ring round him (the boat lying the way it came to rest)
      const r = 1 + 0.06 * Math.sin(g.t * 14);
      const [w, h] = Math.abs(Math.sin(g.rot)) > 0.7 ? [44, 30] : [30, 44];
      this.tele.lineStyle(2, SAFE, 0.9).strokeEllipse(g.x, g.y, w * r, h * r);
      this.tele.lineStyle(1, 0xffffff, 0.5).strokeEllipse(g.x, g.y, (w + 4) * r, (h + 4) * r);
      if (g.at > g.rest) {
        if (frac < USAGI.whirl.at && g.cycle - g.whirled >= USAGI.whirl.every) this.usWhirlIn(g);
        else if (g.cycle % 2 === 1) this.usAct(g, 'slam');
        else this.usLine(e, g);
      }
    } else if (g.act === 'slam') this.usSlam(e, g);
    else this.usWhirl(e, g, dt);
  },

  usTired(g, rest) {
    g.rest = rest * (easy() ? 1.5 : 1);
    g.rot += Math.PI; // (the boat swung round at the end of its run, the hare turned back to the lake)
    this.usAct(g, 'tired');
    SAY(this.scene, g.x, Phaser.Math.Clamp(g.y - 24, 20, this.scene.H - 60), 'HAA... HAA...', SAFE, 0.6);
  },

  /** He swings his oar up and beats the water with it ("PACHAN!"): a wave of drops at the ship, in two rows. */
  usSlam(e, g) {
    const s = this.scene;
    const S = USAGI.slam;
    const p = s.player;
    if (g.at < S.raise) {
      if (!g.said) {
        g.said = true;
        SAY(s, g.x, Phaser.Math.Clamp(g.y - 24, 20, s.H - 60), 'EI!', 0xffffff, 0.7);
      }
      g.slamA = Math.atan2(p.y - g.y, p.x - g.x);
      // its reach flagged: a red fan towards the ship, growing
      const r = 60 + g.at * 60;
      this.tele.fillStyle(WARN, 0.1 + 0.08 * Math.sin(g.at * 24)).slice(g.x, g.y, r, g.slamA - S.arc / 2, g.slamA + S.arc / 2).fillPath();
      return;
    }
    if (!g.slammed) {
      g.slammed = true;
      if (this.canFire(e)) {
        const n = volley(S.n);
        // two rows: the fast one, then a slower one between its drops
        for (let i = 0; i < n; i++) s.bullets.shot('eb_bubble_0', g.x, g.y, g.slamA + (n > 1 ? (i / (n - 1) - 0.5) * S.arc : 0), normal * 0.95, 2.2);
        for (let i = 0; i < n - 1; i++) s.bullets.shot('eb_bubble_1', g.x, g.y, g.slamA + (n > 1 ? ((i + 0.5) / (n - 1) - 0.5) * S.arc : 0), slow * 0.85, 2.2);
      }
      SAY(s, g.x, g.y + 26, 'PACHAN!', 0xd8f0ff, 0.9);
      s.sfx.oar?.();
      s.sfx.explode('s');
      for (let i = 0; i < 14; i++) s.fx.part(s.fx.parts, 'dot_1', g.x + Math.cos(g.slamA) * 16, g.y + Math.sin(g.slamA) * 16, { vx: (Math.random() - 0.5) * 120, vy: -40 - Math.random() * 60, g: 220, life: 0.6 }).setTint(0xd8f0ff);
    }
    if (g.at > S.raise + S.after / g.pace) {
      g.said = g.slammed = false;
      this.usLine(e, g);
    }
  },

  /** Near the end: into the middle of the lake, then round and round in a whirl, its wake a spiral; spent after. */
  usWhirlIn(g) {
    const W = USAGI.whirl;
    g.from = [g.x, g.y];
    g.whirled = g.cycle;
    g.wa = Math.atan2((g.y - W.cy) / 0.8, g.x - W.cx);
    this.usAct(g, 'whirlIn');
    SAY(this.scene, g.x, Phaser.Math.Clamp(g.y - 24, 20, this.scene.H - 60), 'UZU UZU!', 0xffffff, 0.8);
  },

  usWhirl(e, g, dt) {
    const s = this.scene;
    const W = USAGI.whirl;
    const p = s.player;
    const ring = (a) => [W.cx + Math.cos(a) * W.r, W.cy + Math.sin(a) * W.r * 0.8];
    if (g.act === 'whirlIn') {
      const k = ease(Math.min(1, g.at / 0.9));
      const [tx, ty] = ring(g.wa);
      g.x = g.from[0] + (tx - g.from[0]) * k;
      g.y = g.from[1] + (ty - g.from[1]) * k;
      if (Math.hypot(tx - g.from[0], ty - g.from[1]) > 1) g.rot = Math.atan2(ty - g.from[1], tx - g.from[0]) - DOWN;
      g.row += dt * 10;
      this.tele.lineStyle(2, WARN, 0.6 + 0.3 * Math.sin(g.at * 20)).strokeEllipse(W.cx, W.cy, (W.r + 14) * 2, (W.r * 0.8 + 14) * 2);
      if (g.at > 0.9) {
        g.emit = 0;
        this.usAct(g, 'whirl');
      }
      return;
    }
    g.wa += W.w * dt;
    [g.x, g.y] = ring(g.wa);
    g.rot = g.wa; // (going round: the bow along the ring)
    g.row += dt * 22;
    g.emit -= dt;
    if (g.emit <= 0 && this.canFire(e)) {
      g.emit = W.rate;
      // the wake thrown outward and a little back: the spiral's arm
      s.bullets.shot('eb_s', g.x, g.y, g.wa + 0.45, slow * 0.8, 1.8);
    }
    if (p.alive && !p.god && p.invulnerable <= 0 && p.entering <= 0 && onBoat(p.x, p.y, g.x, g.y, g.rot, 2)) p.hit();
    if (g.at > W.time) {
      g.cycle++;
      this.usTired(g, USAGI.dash.tired * W.rest);
    }
  },

  // ---------------------------------------------------------------- the end, either way
  usGiveUp(e, g) {
    g.going = true;
    e.state = 'leave';
    for (const m of g.muds) if (!m.sink) this.usSink(g, m);
    this.usAct(g, 'leave');
    SAY(this.scene, g.x, g.y - 24, 'SAYONARA~', 0xffffff, 0.9);
  },

  usLeave(e, g, dt) {
    g.y -= dt * (30 + g.at * 70);
    g.row += dt * 14;
    if (g.y < -70) this.remove(e);
  },

  /** The boat and the hare in it, put together every frame. */
  usPlace(e, g, dt) {
    const s = this.scene;
    let fr;
    const rowing = e.state === 'enter' || e.state === 'leave' || (e.stage === 2 && e.state === 'fight') || ['dash', 'line', 'whirl', 'whirlIn'].includes(g.act);
    if (rowing) fr = `k_usagi_row_${Math.floor(g.row) % 4}`;
    else if (g.act === 'slam') fr = `k_usagi_slam_${g.slammed ? 1 : 0}`;
    else if (g.act === 'strike') fr = `k_usagi_strike_${Math.floor(g.at * 10) % 2}`;
    else if (g.act === 'throw') fr = 'k_usagi_throw';
    else if (g.act === 'tired') fr = `k_usagi_tired_${Math.floor(g.t * 4) % 2}`;
    else fr = `k_usagi_rest_${Math.floor(g.t * 0.7) % 3 === 2 ? 1 : 0}`;
    if (e.frame.name !== fr) e.setFrame(fr);
    // the last phase: the boat lies along its run, its bow the way it goes (spent, swung round)
    e.setRotation(e.stage === 3 && e.state === 'fight' ? g.rot : 0);
    e.setPosition(g.x, g.y);
    // (in the ring of mud boats: the nearer the lower on the screen, in front)
    e.setDepth(e.stage === 2 ? DEPTH.air - 0.095 + g.y * 1e-4 + 5e-5 : DEPTH.air - 0.09);
    // the gold glint of the real boat among the mud ones
    if (g.glint > 0) {
      g.glint -= dt;
      const k = g.glint / 0.3;
      this.tele.lineStyle(2, GOLD, 0.9 * k).strokeEllipse(g.x, g.y, 26 + (1 - k) * 10, 40 + (1 - k) * 10);
      if (Math.random() < 0.5) s.fx.part(s.fx.parts, 'dot_1', g.x + (Math.random() - 0.5) * 18, g.y + (Math.random() - 0.5) * 30, { vy: -10, life: 0.3 }).setTint(GOLD);
    }
    if (g.shrug && (g.shrug -= dt) > 0) {
      const across = e.stage === 3 && Math.abs(Math.sin(g.rot)) > 0.7; // (the boat lying across its run)
      this.tele.lineStyle(2, 0xd8e4f4, 0.75 * (g.shrug / 0.18)).strokeEllipse(g.x, g.y, across ? 48 : 34, across ? 34 : 48);
    }
  },

  /**
   * A shot reaching it: a boat of mud takes it (and sinks when soaked through); in the last phase the hare shrugs
   * off everything but while he lies spent. (Enemies.bossDeviceHit)
   */
  usagiShot(shot) {
    const e = this.heavy;
    const g = e?.us;
    if (!g || e.dead || e.hp <= 0) return false;
    const s = this.scene;
    // a burning bundle on the water takes the shot, and bursts when shot through
    for (const k of g.bundles) {
      if (!k.landed || k.gone || Math.hypot(shot.x - k.x, shot.y - k.y) > USAGI.bundle.r + 2 + shot.radius) continue;
      k.hp -= shot.damage;
      if (k.hp <= 0) this.usBurst(k);
      return true;
    }
    for (const m of g.muds) {
      if (m.sink || m.up < 1 || !onBoat(shot.x, shot.y, m.x, m.y, m.ram ? m.ram.ang - DOWN : 0, shot.radius)) continue;
      m.hp -= shot.damage;
      m.hurt = 0.08;
      if (Math.random() < 0.4) s.fx.part(s.fx.parts, 'dot_1', shot.x, shot.y, { vx: (Math.random() - 0.5) * 60, vy: -20, g: 120, life: 0.3 }).setTint(0x6a4a2a);
      if (m.hp <= 0) this.usSink(g, m);
      return true;
    }
    if (e.stage === 3 && g.act !== 'tired') {
      if (onBoat(shot.x, shot.y, g.x, g.y, g.rot, shot.radius)) {
        g.shrug = 0.18;
        if (Math.random() < 0.3) s.fx.part(s.fx.parts, 'dot_1', shot.x, shot.y, { vx: (Math.random() - 0.5) * 100, vy: 60, drag: 1.5, life: 0.25 }).setTint(0xe8eef8);
        if (s.t > (g.kinAt ?? 0)) {
          g.kinAt = s.t + 0.9;
          SAY(s, shot.x, shot.y - 10, 'KIN!', 0xd8e4f4, 0.5);
        }
        return true;
      }
    }
    return false;
  },

  usCleanup(e) {
    const g = e.us;
    if (!g) return;
    for (const k of g.bundles) this.segPool.kill(k.sp);
    for (const k of g.pots) if (k.sp) this.segPool.kill(k.sp);
    for (const m of g.muds) {
      m.sp.setRotation(0);
      m.sp.clearTint().setAlpha(1);
      this.segPool.kill(m.sp);
    }
    e.setRotation(0);
    e.us = null;
  },

  /** Going down (Enemies.goDown -> usagiEnd): where the boat is on the map. */
  usagiDown(e) {
    return { u: this.scene.parallax.stripU(e.y), x: e.x };
  },

  /**
   * The end: the hits land on the boat; the hare leaps out of it into the ropeway's gondola as it glides over the
   * lake on its cable, and is carried off to Mt Tenjo, waving; the empty boat drifts. Returns true when it is over.
   */
  usagiEnd(d, dt) {
    const s = this.scene;
    const ud = d.us;
    const b = d.body;
    const t = d.t;
    const y = s.parallax.screenY(ud.u);
    if (!ud.gondola) {
      ud.gondola = s.add.sprite(-40, 0, b.texture.key, 'k_gondola_0').setDepth(DEPTH.air + 0.2).setScale(b.scaleX, b.scaleY);
      ud.leap = s.add.sprite(ud.x, y, b.texture.key, 'k_usagi_leap').setDepth(DEPTH.air + 0.1).setScale(b.scaleX, b.scaleY).setVisible(false);
    }
    const cable = (x) => 26 - x * 0.1;
    // the gondola along its cable, to be over the boat when he jumps, then on to Tenjo
    const gx = -40 + (t - 0.2) * 62;
    ud.gondola.setPosition(gx, cable(gx) + 16).setFrame(`k_gondola_${t > 2.3 && Math.floor(t * 4) % 2 ? 1 : 0}`);
    this.tele.lineStyle(1, 0x2a2a30, 0.9).lineBetween(-10, cable(-10), VIEW.width + 10, cable(VIEW.width + 10));
    this.tele.lineStyle(1, 0x2a2a30, 0.6).lineBetween(-10, cable(-10) + 3, VIEW.width + 10, cable(VIEW.width + 10) + 3);
    b.setRotation(0);
    if (t < 1.1) {
      b.setPosition(ud.x + Math.round((Math.random() - 0.5) * 3), y).setTint(Math.floor(t * 14) % 2 ? 0x707070 : 0x000000).setTintMode(Phaser.TintModes.ADD);
      if ((d.next -= dt) <= 0) {
        d.next = 0.13;
        s.fx.explode(ud.x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 30, 's', null, false);
      }
    } else {
      b.clearTint().setPosition(ud.x + Math.sin(t * 1.5) * 1.5, y);
      if (b.frame.name !== 'k_usagi_empty') {
        b.setFrame('k_usagi_empty');
        ud.leap.setVisible(true);
        SAY(s, ud.x, y + 20, 'PYON!', 0xffffff, 0.9);
      }
      // the leap: up from the boat to the gondola over it
      const k = Math.min(1, (t - 1.1) / 1.1);
      const [tx, ty] = [ud.gondola.x, ud.gondola.y + 4];
      if (k < 1) ud.leap.setPosition(ud.x + (tx - ud.x) * k, y + (ty - y) * k - Math.sin(k * Math.PI) * 30).setScale(b.scaleX * (1 + Math.sin(k * Math.PI) * 0.4), b.scaleY * (1 + Math.sin(k * Math.PI) * 0.4));
      else if (ud.leap.visible) {
        ud.leap.setVisible(false);
        SAY(s, tx, ty + 24, 'MATA NE~!', 0xffe080, 1);
      }
    }
    if (t > 4.6) b.setAlpha(Math.max(0, 1 - (t - 4.6) / 0.8));
    if (t > 5.4 && gx > VIEW.width + 40) {
      ud.gondola.destroy();
      ud.leap.destroy();
      return true;
    }
    return false;
  },
};

