// Onomichi's miniboss (docs/plan-onomichi.md, 6.1): NEKOMATA, the cat with two tails. Methods of Enemies (mixed in
// like the cities'). A heavy with "hold": the scroll stops over the roofs under Senko-ji at dusk and the fight is on
// them; everything here is in screen terms while the strip stands still (its end, kept on the map, in strip terms).
// Art: tools/art/onomichi/nekomata.mjs (frames o_neko_*, o_onibi_*).
import Phaser from 'phaser';
import { DEPTH } from '../../config.js';
import { rules, volley } from '../../difficulty.js';
import { slow, normal, TAU } from './shared.js';

/**
 * Its life, the phases' thresholds, how long it stays, how much quicker it gets as it tires (rush); the hop from roof
 * to roof (crouching, in the air, how high, how long it is open after landing) and the tile shards it kicks up; its
 * wisps (how many, how long they circle it, how far out, how fast they fly at the ship); the chorus (its copies'
 * life, how soon one comes back, how often they cry, the fan of notes, how often all four change roofs); the dance
 * (how long a figure, how often a wisp is thrown, its arms, the ring at the end; the pounce's warning and speed; how
 * long it sits spent).
 */
export const NEKO = {
  hp: 960,
  phase: [0.66, 0.33],
  time: 95,
  rush: 0.4,
  hop: { crouch: 0.5, air: 0.7, h: 30, open: 1.3 },
  guard: 0.2, // (out of its windows a shot does this much)
  shards: { n: 7, arc: 1.1 },
  wisp: { n: 3, orbit: 1.15, r: 22 },
  chorus: { hp: 45, back: 5, every: 2.6, notes: 5, arc: 0.85, swap: 3.6, real: 1.8 },
  dance: { dur: 2.8, rate: 0.13, arms: 3, ring: 14, warn: 0.9, speed: 240, tired: 2.2 },
};

// the roofs it sits on (screen terms, over the arena's houses: the strait is on the left, the town from x 76), the
// middle where it dances; where its pounce may end (on the roofs and the road, never on the water)
const SPOTS = [[86, 96], [150, 88], [118, 130], [88, 164], [152, 160], [122, 66]];
const MID = [120, 112];
const LAND = 80;
const SAFE = 0x81f3cc;
const WARN = 0xff735e;
const GOLD = 0xffd84a;
const BLUE = 0x9ad0ff;
const SAY = (s, x, y, t, c = 0xffffff, size = 0.8) => s.fx.text(x, y, t, size, c);
const easy = () => rules().volley < 1; // (easy: its copies give sooner, it rests longer)
const ease = (k) => k * k * (3 - 2 * k);

export const onomichiNekomata = {
  /**
   * An old black-and-white cat on the roofs under Senko-ji, its tail forked in two, a blue wisp burning at each tip.
   * Three phases:
   * 1. OGNIKI: it leaps from roof to roof (a red ring where it will land); landing it kicks up a fan of tile shards;
   *    sitting, it lets its wisps circle it and then sends them at the ship. It is open in the air and just after
   *    it lands (mint), else it shrugs off most of every shot;
   * 2. KOCI CHÓR: three copies of it sit on the roofs with it, each with one tail; they cry fans of notes at the ship
   *    and all four change roofs now and then. A copy shot through vanishes in smoke and comes back after a while;
   *    the real one has two tails, and they glint gold;
   * 3. TANIEC: up on its hind legs with a towel on its head it dances in the middle of the roofs, its wisps flying
   *    out in a turning spiral and a ring at the end of each figure; then it pounces at the ship along a red line and
   *    sits spent, washing a paw, panting: then (mint) it is open, else it shrugs off most of each shot.
   * The less life it has, the quicker it goes. Beaten, it yawns, curls up on the roof and falls asleep, and its
   * second tail is gone: just a cat.
   */
  spawnNeko(e) {
    const g = (e.neko = {
      t: 0, act: 'enter', at: 0, x: SPOTS[5][0], y: -60, z: 0, from: null, to: null, spot: 5, pace: 1, open: false,
      wisps: [], copies: [], swapAt: 0, glintAt: 0, glint: 0, figure: 0, spin: 0, emit: 0, line: null, said: false,
    });
    Object.assign(e, { stage: 1, radius: 13 });
    e.setDepth(DEPTH.air - 0.09);
    g.shadow = this.segPool.spawn('o_neko_shadow', g.x, g.y).setDepth(DEPTH.ground + 0.6).setVisible(false);
    this.nkHop(g, 2, { air: 0.9, h: 40, crouch: 0 });
    g.from = [SPOTS[2][0], -40];
    g.x = g.from[0];
    g.y = g.from[1];
    return e;
  },

  nekomata(e, dt) {
    const g = e.neko;
    if (!g) return;
    g.t += dt;
    g.at += dt;
    const frac = e.hp / e.maxHp;
    g.pace = 1 + NEKO.rush * (1 - frac);
    if (e.state === 'leave') this.nkLeave(e, g, dt);
    else if (e.state === 'enter') {
      if (this.nkHopStep(e, g, dt, true)) {
        e.state = 'fight';
        this.nkAct(g, 'sit');
        SAY(this.scene, g.x, g.y + 30, 'NYAAA~', 0xffe8b0, 1);
      }
    } else {
      g.fight = (g.fight ?? 0) + dt;
      if (g.fight > NEKO.time && !g.going) this.nkGiveUp(e, g);
      else if (e.stage === 1 && frac < NEKO.phase[0]) this.nkToChorus(e, g);
      else if (e.stage === 2 && frac < NEKO.phase[1]) this.nkToDance(e, g);
      if (e.state !== 'fight') {
        // (given up: on its way)
      } else if (e.stage === 1) this.nkWisps(e, g, dt);
      else if (e.stage === 2) this.nkChorus(e, g, dt);
      else this.nkDance(e, g, dt);
    }
    this.nkOrbit(e, g, dt);
    this.nkCopies(e, g, dt);
    this.nkPlace(e, g, dt);
  },

  nkAct(g, act) {
    Object.assign(g, { act, at: 0, said: false });
  },

  /** Start a hop from where it is to roof i. */
  nkHop(g, i, o = {}) {
    g.from = [g.x, g.y];
    g.spot = i;
    g.to = SPOTS[i];
    g.hop = { crouch: o.crouch ?? NEKO.hop.crouch, air: o.air ?? NEKO.hop.air, h: o.h ?? NEKO.hop.h };
    this.nkAct(g, g.hop.crouch > 0 ? 'crouch' : 'air');
  },

  /** The hop under way: crouching (its landing flagged), in the air. Returns true when it has landed. */
  nkHopStep(e, g, dt, quiet = false) {
    const h = g.hop;
    const [tx, ty] = g.to;
    if (g.act === 'crouch') {
      this.tele.lineStyle(2, WARN, 0.5 + 0.4 * Math.sin(g.at * 22)).strokeEllipse(tx, ty + 6, 34, 16);
      if (g.at > h.crouch / g.pace) this.nkAct(g, 'air');
      return false;
    }
    const k = Math.min(1, g.at / (h.air / g.pace));
    g.x = g.from[0] + (tx - g.from[0]) * ease(k);
    g.y = g.from[1] + (ty - g.from[1]) * ease(k);
    g.z = Math.sin(k * Math.PI) * h.h;
    this.tele.lineStyle(2, WARN, 0.6).strokeEllipse(tx, ty + 6, 34 - k * 8, 16 - k * 4);
    if (k < 1) return false;
    g.z = 0;
    this.nkAct(g, 'land');
    const s = this.scene;
    s.sfx.explode('s');
    if (!quiet && this.canFire(e)) {
      // the tiles it lands on fly up: a fan of shards at the ship
      s.bullets.fan(g.x, g.y + 8, this.aimAt(e, 0, 8), volley(NEKO.shards.n), NEKO.shards.arc, slow * 1.1);
    }
    for (let i = 0; i < 8; i++) s.fx.part(s.fx.parts, 'dot_1', g.x + (Math.random() - 0.5) * 20, g.y + 10, { vx: (Math.random() - 0.5) * 110, vy: -50 - Math.random() * 60, g: 260, life: 0.5 }).setTint(0x6a7078);
    return true;
  },

  // ---------------------------------------------------------------- phase 1: hopping, its wisps
  nkWisps(e, g, dt) {
    const s = this.scene;
    if (g.act === 'crouch' || g.act === 'air') {
      this.nkHopStep(e, g, dt);
      return;
    }
    if (g.act === 'land') {
      if (g.at > NEKO.hop.open / g.pace) this.nkAct(g, 'sit');
      return;
    }
    // sitting: the wisps come off its tails and circle it, then it sends them at the ship
    if (!g.said) {
      g.said = true;
      for (let i = 0; i < volley(NEKO.wisp.n); i++) g.wisps.push(this.nkWisp(g, (i / NEKO.wisp.n) * TAU));
    }
    if (g.at > NEKO.wisp.orbit / g.pace) {
      this.nkLoose(e, g);
      let next = Math.floor(Math.random() * SPOTS.length);
      if (next === g.spot) next = (next + 2) % SPOTS.length;
      this.nkHop(g, next);
      if (Math.random() < 0.3) SAY(s, g.x, g.y - 30, 'NYA!', 0xffe8b0, 0.6);
    }
  },

  nkWisp(g, a) {
    return { a, r: 6, sp: this.segPool.spawn('o_onibi_0', g.x, g.y).setDepth(DEPTH.air - 0.08).setBlendMode(Phaser.BlendModes.ADD) };
  },

  /** The wisps circling it, drawing out from its tails. */
  nkOrbit(e, g, dt) {
    for (const w of g.wisps) {
      w.a += dt * 4.2;
      w.r += (NEKO.wisp.r - w.r) * Math.min(1, dt * 3);
      w.sp.setPosition(g.x + Math.cos(w.a) * w.r, g.y - g.z + Math.sin(w.a) * w.r * 0.8 - 4).setFrame(`o_onibi_${Math.floor(g.t * 8 + w.a) & 3}`);
    }
  },

  /** Let the wisps go: each flies at the ship from where it is. */
  nkLoose(e, g) {
    const s = this.scene;
    const p = s.player;
    for (const w of g.wisps) {
      if (this.canFire(e)) s.bullets.shot('eb_fox', w.sp.x, w.sp.y, Math.atan2(p.y - w.sp.y, p.x - w.sp.x), slow * 1.05, 3);
      this.segPool.kill(w.sp);
    }
    g.wisps = [];
  },

  // ---------------------------------------------------------------- phase 2: the chorus of copies
  nkToChorus(e, g) {
    const s = this.scene;
    this.phaseBreak(e, g.x, g.y, 2, 'KOCI CHÓR');
    this.nkLoose(e, g);
    g.z = 0;
    const free = [0, 1, 2, 3, 4, 5].filter((i) => i !== g.spot).sort(() => Math.random() - 0.5);
    for (let i = 0; i < 3; i++) {
      const [x, y] = SPOTS[free[i]];
      g.copies.push({ x, y, spot: free[i], hp: NEKO.chorus.hp * (easy() ? 0.6 : 1), gone: 0, cry: 1 + i * 0.8, meow: 0, sp: this.segPool.spawn('o_neko_copy_0', x, y).setDepth(DEPTH.air - 0.091) });
      s.fx.smoke(x, y, 2, 4, true);
    }
    SAY(s, 90, 60, 'NYA NYA NYA!', 0xffe8b0, 1);
    g.swapAt = g.t + NEKO.chorus.swap;
    g.glintAt = g.t + 1;
    this.nkAct(g, 'sit');
  },

  nkChorus(e, g, dt) {
    const s = this.scene;
    if (g.act === 'crouch' || g.act === 'air') {
      this.nkHopStep(e, g, dt, true);
      return;
    }
    // now and then all four change roofs: the copies flit, the real one hops
    if (g.t > g.swapAt / 1) {
      g.swapAt = g.t + NEKO.chorus.swap / g.pace;
      const order = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
      this.nkHop(g, order[0], { crouch: 0.3, air: 0.5, h: 22 });
      g.copies.forEach((c, i) => {
        if (c.gone > 0) return;
        c.from = [c.x, c.y];
        c.spot = order[i + 1];
        c.hopT = 0;
      });
      return;
    }
    // its own wisps, two at a time, sent at the ship
    if (g.at > NEKO.chorus.real / g.pace) {
      g.at = 0;
      if (this.canFire(e)) for (const d of [-0.25, 0.25]) s.bullets.shot('eb_fox', g.x, g.y - 10, this.aimAt(e, 0, -10) + d, slow, 3);
    }
    // the gold glint on its two tails, every so often
    if (g.t > g.glintAt) {
      g.glintAt = g.t + 1.6;
      g.glint = 0.45;
    }
  },

  /** The copies: their crying, their flitting from roof to roof, coming back after they are shot through. */
  nkCopies(e, g, dt) {
    const s = this.scene;
    for (const c of g.copies) {
      if (c.gone > 0) {
        c.gone -= dt;
        c.sp.setVisible(false);
        if (c.gone <= 0 && e.stage === 2 && e.state === 'fight') {
          const taken = new Set([g.spot, ...g.copies.filter((o) => o !== c && o.gone <= 0).map((o) => o.spot)]);
          c.spot = [0, 1, 2, 3, 4, 5].find((i) => !taken.has(i)) ?? c.spot;
          [c.x, c.y] = SPOTS[c.spot];
          c.hp = NEKO.chorus.hp * (easy() ? 0.6 : 1);
          s.fx.smoke(c.x, c.y, 2, 4, true);
        }
        continue;
      }
      if (c.from) {
        c.hopT += dt;
        const k = Math.min(1, c.hopT / 0.45);
        const [tx, ty] = SPOTS[c.spot];
        c.x = c.from[0] + (tx - c.from[0]) * ease(k);
        c.y = c.from[1] + (ty - c.from[1]) * ease(k) - Math.sin(k * Math.PI) * 16;
        if (k >= 1) c.from = null;
      } else if (e.stage === 2 && e.state === 'fight') {
        c.cry -= dt * g.pace;
        if (c.cry <= 0) {
          c.cry = NEKO.chorus.every * (0.8 + Math.random() * 0.4);
          c.meow = 0.5;
          if (this.canFire({ type: 'heavy', seen: e.seen, y: c.y })) s.bullets.fan(c.x, c.y + 8, Math.atan2(s.player.y - c.y, s.player.x - c.x), volley(NEKO.chorus.notes), NEKO.chorus.arc, slow * 0.95);
          if (Math.random() < 0.35) SAY(s, c.x, c.y - 26, 'NYA~', 0xd8e4f4, 0.55);
        }
      }
      c.meow -= dt;
      c.sp.setVisible(true).setPosition(c.x, c.y).setFrame(c.meow > 0 ? `o_neko_meow_${Math.floor(g.t * 6) & 1}` : `o_neko_copy_${Math.floor(g.t * 2) & 1}`);
      c.sp.setAlpha(0.88 + Math.sin(g.t * 5 + c.spot) * 0.08);
    }
  },

  /** A copy shot through: gone in a puff of smoke, back after a while. */
  nkPoof(g, c) {
    const s = this.scene;
    c.gone = NEKO.chorus.back;
    s.fx.smoke(c.x, c.y, 3, 6, true);
    s.sfx.explode('s');
    SAY(s, c.x, c.y - 20, 'PON!', 0xd8e4f4, 0.7);
  },

  // ---------------------------------------------------------------- phase 3: the dance
  nkToDance(e, g) {
    const s = this.scene;
    this.phaseBreak(e, g.x, g.y, 3, 'TANIEC');
    for (const c of g.copies) if (c.gone <= 0) this.nkPoof(g, c);
    for (const c of g.copies) c.gone = 999;
    g.z = 0;
    g.from = [g.x, g.y];
    g.to = MID;
    g.hop = { crouch: 0.3, air: 0.6, h: 30 };
    this.nkAct(g, 'crouch');
    g.toDance = true;
    SAY(s, 90, 60, 'YOI YOI!', 0xffe8b0, 1);
  },

  nkDance(e, g, dt) {
    const s = this.scene;
    const D = NEKO.dance;
    const p = s.player;
    if (g.act === 'crouch' || g.act === 'air') {
      if (this.nkHopStep(e, g, dt, true)) this.nkAct(g, 'dance');
      return;
    }
    if (g.act === 'land') this.nkAct(g, 'dance');
    if (g.act === 'dance') {
      // turning on its hind legs, its wisps flying out in a turning spiral
      g.spin += dt * 2.4 * (g.figure % 2 ? -1 : 1) * g.pace;
      g.emit -= dt * g.pace;
      if (g.emit <= 0 && this.canFire(e)) {
        g.emit = D.rate;
        for (let i = 0; i < D.arms; i++) s.bullets.shot('eb_fox_s', g.x, g.y - 6, g.spin + (i / D.arms) * TAU, slow * 0.85, 2.4);
      }
      if (g.at > D.dur) {
        if (this.canFire(e)) s.bullets.ring(g.x, g.y - 6, volley(D.ring), g.spin, slow * 1.05);
        g.figure++;
        g.line = { from: [g.x, g.y], to: [Phaser.Math.Clamp(p.x, LAND, 162), Phaser.Math.Clamp(p.y, 50, s.H * 0.72)] };
        this.nkAct(g, 'aim');
        SAY(s, g.x, g.y - 30, 'SHAA!', 0xff9a8a, 0.8);
      }
      return;
    }
    if (g.act === 'aim') {
      // its pounce flagged: a red lane from it to where the ship was
      const [[ax, ay], [bx, by]] = [g.line.from, g.line.to];
      this.tele.lineStyle(10, WARN, 0.12 + 0.1 * Math.sin(g.at * 26)).lineBetween(ax, ay, bx, by);
      this.tele.lineStyle(2, WARN, 0.8).lineBetween(ax, ay, bx, by);
      if (g.at > D.warn / g.pace) this.nkAct(g, 'pounce');
      return;
    }
    if (g.act === 'pounce') {
      const [[ax, ay], [bx, by]] = [g.line.from, g.line.to];
      const len = Math.hypot(bx - ax, by - ay);
      const k = Math.min(1, (g.at * D.speed) / Math.max(1, len));
      g.x = ax + (bx - ax) * k;
      g.y = ay + (by - ay) * k;
      g.z = Math.sin(k * Math.PI) * 10;
      if (p.alive && !p.god && p.invulnerable <= 0 && p.entering <= 0 && Math.hypot(p.x - g.x, p.y - g.y) < 14) p.hit();
      if (k >= 1) {
        g.z = 0;
        this.nkAct(g, 'tired');
        g.rest = D.tired * (easy() ? 1.5 : 1);
        SAY(s, g.x, Phaser.Math.Clamp(g.y - 30, 20, s.H - 60), 'NYA... NYA...', SAFE, 0.6);
      }
      return;
    }
    if (g.act === 'tired' && g.at > g.rest) {
      // back to the middle of the roofs to dance again
      g.from = [g.x, g.y];
      g.to = MID;
      g.hop = { crouch: 0.25, air: 0.6, h: 30 };
      this.nkAct(g, 'crouch');
    }
  },

  // ---------------------------------------------------------------- the end, either way
  nkGiveUp(e, g) {
    g.going = true;
    e.state = 'leave';
    this.nkLoose(e, g);
    for (const c of g.copies) if (c.gone <= 0) this.nkPoof(g, c);
    this.nkAct(g, 'leave');
    SAY(this.scene, g.x, g.y - 24, 'NYAN~', 0xffffff, 0.9);
  },

  nkLeave(e, g, dt) {
    g.y -= dt * (40 + g.at * 90);
    g.z = 12;
    if (g.y < -80) this.remove(e);
  },

  /** The cat, its shadow and its wisps put together every frame; whether it can be hit now (mint). */
  nkPlace(e, g, dt) {
    let fr;
    if (g.act === 'crouch') fr = 'o_neko_crouch';
    else if (g.act === 'air' || g.act === 'leave' || g.act === 'pounce') fr = 'o_neko_leap';
    else if (g.act === 'land') fr = g.at < 0.25 ? 'o_neko_land' : `o_neko_sit_${Math.floor(g.t * 5) & 3}`;
    else if (g.act === 'dance' || g.act === 'aim') fr = `o_neko_dance_${Math.floor(g.t * 6) & 3}`;
    else if (g.act === 'tired') fr = `o_neko_wash_${Math.floor(g.t * 3) & 1}`;
    else fr = `o_neko_sit_${Math.floor(g.t * 5) & 3}`;
    if (e.frame.name !== fr) e.setFrame(fr);
    e.setPosition(g.x, g.y - g.z);
    g.shadow.setVisible(g.z > 1 || g.act === 'air').setPosition(g.x, g.y + 14).setAlpha(Math.max(0.3, 1 - g.z / 50));
    // can it be hit now? in the air and just after landing (the hops), always (the chorus: the real one), spent (the dance)
    g.open = e.state === 'fight' && (e.stage === 1 ? g.act === 'air' || g.act === 'land' : e.stage === 2 ? true : g.act === 'tired');
    if (g.open && e.stage !== 2) this.tele.lineStyle(2, SAFE, 0.55 + 0.3 * Math.sin(g.t * 12)).strokeEllipse(g.x, g.y - g.z, 40, 44);
    if (g.glint > 0) {
      g.glint -= dt;
      const k = g.glint / 0.45;
      // the two tails, gold for a moment: this is the real one
      for (const sx of [-1, 1]) this.tele.lineStyle(2, GOLD, 0.9 * k).strokeCircle(g.x + sx * 17, g.y - g.z - 8, 6 + (1 - k) * 6);
    }
    if (g.shrug && (g.shrug -= dt) > 0) this.tele.lineStyle(2, BLUE, 0.7 * (g.shrug / 0.18)).strokeEllipse(g.x, g.y - g.z, 38, 42);
  },

  /** A shot reaching it: its copies take theirs; out of its windows it shrugs off most of it. (Enemies.bossDeviceHit) */
  nekoShot(shot) {
    const e = this.heavy;
    const g = e?.neko;
    if (!g || e.dead || e.hp <= 0) return false;
    const s = this.scene;
    for (const c of g.copies) {
      if (c.gone > 0 || Math.hypot(shot.x - c.x, shot.y - c.y) > 13 + shot.radius) continue;
      c.hp -= shot.damage;
      c.sp.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL); // (a flash where it is hit)
      s.time.delayedCall(50, () => c.sp.clearTint().setTintMode(Phaser.TintModes.MULTIPLY));
      if (c.hp <= 0) this.nkPoof(g, c);
      return true;
    }
    if (!g.open && e.state === 'fight' && Math.hypot(shot.x - e.x, shot.y - e.y) < 15 + shot.radius) {
      g.shrug = 0.18;
      this.damage(e, shot.damage * NEKO.guard); // (it shrugs most of it off)
      if (s.t > (g.funAt ?? 0)) {
        g.funAt = s.t + 1.1;
        SAY(s, shot.x, shot.y - 10, 'FUN!', 0xd8e4f4, 0.5);
      }
      return true;
    }
    return false;
  },

  nkCleanup(e) {
    const g = e.neko;
    if (!g) return;
    for (const w of g.wisps) this.segPool.kill(w.sp);
    for (const c of g.copies) {
      c.sp.clearTint().setTintMode(Phaser.TintModes.MULTIPLY).setAlpha(1).setVisible(true);
      this.segPool.kill(c.sp);
    }
    this.segPool.kill(g.shadow);
    e.neko = null;
  },

  /** Going down (Enemies.goDown -> nekoEnd): where it is on the map. */
  nekoDown(e) {
    return { u: this.scene.parallax.stripU(e.y), x: e.x };
  },

  /**
   * The end: the hits land, then it yawns, curls up on the roof and falls asleep, its second tail gone; it stays
   * asleep there on the map as the town scrolls on. Returns true when it is off the screen.
   */
  nekoEnd(d, dt) {
    const s = this.scene;
    const nd = d.nk;
    const b = d.body;
    const t = d.t;
    const y = s.parallax.screenY(nd.u);
    if (t < 1.1) {
      b.setPosition(nd.x + Math.round((Math.random() - 0.5) * 3), y).setTint(Math.floor(t * 14) % 2 ? 0x707070 : 0x000000).setTintMode(Phaser.TintModes.ADD);
      if ((d.next -= dt) <= 0) {
        d.next = 0.13;
        s.fx.explode(nd.x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 24, 's', null, false);
      }
      return false;
    }
    b.clearTint().setPosition(nd.x, y);
    if (t < 2.1) {
      if (!nd.yawn) {
        nd.yawn = true;
        b.setFrame('o_neko_meow_0');
        SAY(s, nd.x, y - 30, 'FUWAAA~', 0xffe8b0, 0.9);
      }
    } else if (!nd.asleep) {
      nd.asleep = true;
      b.setFrame('o_neko_sleep');
      s.fx.smoke(nd.x + 14, y - 10, 1, 3, true); // (its second tail gone like a wisp)
    } else if (Math.floor(t) !== nd.z && t > 2.6) {
      nd.z = Math.floor(t);
      SAY(s, nd.x + 10, y - 20, 'ZZZ...', 0xd8e4f4, 0.55);
    }
    return y > s.H + 50 || t > 30;
  },
};
void normal;
