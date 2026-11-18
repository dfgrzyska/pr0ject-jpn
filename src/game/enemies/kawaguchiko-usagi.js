// Kawaguchiko's miniboss (docs/plan-kawaguchiko.md, 6.1): KACHI-KACHI USAGI, the hare with the flint. Methods of
// Enemies (mixed in like the cities'). A heavy with "hold": the scroll stops over open water by Unoshima and the
// fight is on the lake. Art: tools/art/kawaguchiko/usagi.mjs (frames k_usagi_*, k_dorobune_*, k_shiba_*, k_gondola_*).
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { rules, volley } from '../../difficulty.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * Its life, the phases' thresholds, how long it stays, where it sits; the sparks it strikes; the burning bundles it
 * throws (how often, the ring's size, how long they burn); the boats of mud (how many, their life, how often they
 * shoot, how often the boats change places, how often the real one glints gold); the charges across the lake (the
 * warning, the speed, how long the hare lies spent after one, the lanes, how thick its wake of shots).
 */
export const USAGI = {
  hp: 860,
  phase: [0.66, 0.33],
  time: 95,
  home: 96,
  strike: { every: 2.5, n: 7, arc: 1.25 },
  bundle: { every: 4.4, r: 13, live: 3.2, fly: 0.95 },
  mud: { n: 3, hp: 70, fire: [1.8, 2.8], shuffle: 5.5, move: 1.2, back: 5 },
  dash: { warn: 1.05, speed: 210, tired: 2.4, lanes: [72, 158], wake: 15 },
};

const SAFE = 0x81f3cc;
const WARN = 0xff735e;
const GOLD = 0xffd84a;
const SLOTS = [28, 68, 112, 152];
const BOAT = [9, 17]; // the boat's half width and half length, for what hits it
const SAY = (s, x, y, t, c = 0xffffff, size = 0.8) => s.fx.text(x, y, t, size, c);
const easy = () => rules().volley < 1; // (easy: the mud boats soak through sooner, the hare rests longer)

export const kawaguchikoUsagi = {
  /**
   * The white hare in his red headband rows out on to the lake in his wooden boat. Three phases:
   * 1. KRZESIWO: he knocks striker and flint together ("KACHI KACHI!") and fans of sparks fly; now and then he throws
   *    a bundle of brushwood alight, which lands on the water and burns there in a ring that scalds;
   * 2. ŁODZIE Z BŁOTA: three boats of mud come up, each with a clay hare in it, all four shuffle round, the mud ones
   *    spitting mud; the real boat glints gold at each stroke of its oars. Shot, a mud boat soaks, crumbles and sinks
   *    with a gurgle; only the real one gives;
   * 3. WIOSŁO: he rows like mad, ramming across the whole lake along a lane flagged red, leaving a wake of shots; at
   *    the far side he stops, spent, panting: then (mint) he can be hit, and only then.
   * Beaten, he leaps out of his boat into the ropeway's gondola as it passes over the lake and is carried off to
   * Mt Tenjo, waving.
   */
  spawnUsagi(e) {
    const g = (e.us = {
      t: 0, act: 'enter', at: 0, x: 90, y: -70, strikeAt: 1.2, throwAt: 3, glintAt: 0, glint: 0, row: 0,
      bundles: [], muds: [], slots: null, shuffleAt: 0, moving: 0, from: null, to: null, lane: 0, side: -1, dashes: 0,
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
    if (e.state === 'enter') this.usEnter(e, g, dt);
    else if (e.state === 'leave') this.usLeave(e, g, dt);
    else {
      g.fight = (g.fight ?? 0) + dt;
      if (g.fight > USAGI.time && !g.going) this.usGiveUp(e, g);
      else if (e.stage === 1 && frac < USAGI.phase[0]) this.usToMud(e, g);
      else if (e.stage === 2 && frac < USAGI.phase[1]) this.usToOar(e, g);
      if (e.stage === 1) this.usFlint(e, g, dt);
      else if (e.stage === 2) this.usMud(e, g, dt);
      else this.usOar(e, g, dt);
    }
    this.usBundles(e, g, dt);
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

  // ---------------------------------------------------------------- phase 1: the flint and the bundles
  usFlint(e, g, dt) {
    const s = this.scene;
    // drifting about the open water, a lazy stroke now and then
    const tx = 90 + Math.sin(g.t * 0.45) * 46;
    g.x += (tx - g.x) * Math.min(1, dt * 1.2);
    g.y += (USAGI.home + Math.sin(g.t * 0.7) * 8 - g.y) * Math.min(1, dt * 2);
    if (g.act === 'rest') {
      if (g.t > g.throwAt) this.usAct(g, 'throw');
      else if (g.t > g.strikeAt) this.usAct(g, 'strike');
    } else if (g.act === 'strike') {
      // three knocks: sparks fly at the third
      if (g.at > 0.55) {
        if (this.canFire(e)) {
          const a = this.aimAt(e, 0, 20);
          const n = volley(USAGI.strike.n);
          for (let i = 0; i < n; i++) s.bullets.shot('eb_lava', g.x, g.y + 22, a + (n > 1 ? (i / (n - 1) - 0.5) * USAGI.strike.arc : 0), normal * (0.85 + (i % 2) * 0.15), 1.8);
          for (let i = 0; i < 6; i++) s.fx.part(s.fx.parts, 'dot_1', g.x, g.y + 22, { vx: (Math.random() - 0.5) * 120, vy: Math.random() * 90, drag: 2, life: 0.35 }).setTint(0xffd060);
        }
        SAY(s, g.x + (Math.random() - 0.5) * 20, g.y + 34, 'KACHI!', 0xffd080, 0.6);
        s.sfx.flint?.();
        g.strikeAt = g.t + USAGI.strike.every * (0.8 + Math.random() * 0.4);
        this.usAct(g, 'rest');
      }
    } else if (g.act === 'throw') {
      if (g.at > 0.4) {
        this.usThrow(e, g);
        g.throwAt = g.t + USAGI.bundle.every * (0.85 + Math.random() * 0.3);
        g.strikeAt = Math.max(g.strikeAt, g.t + 0.8);
        this.usAct(g, 'rest');
      }
    }
  },

  /** A burning bundle of brushwood thrown in an arc on to the water near the ship: its ring warns where it lands. */
  usThrow(e, g) {
    const s = this.scene;
    if (!this.canFire(e) || s.bombClear > 0) return;
    const p = s.player;
    const tx = Phaser.Math.Clamp(p.x + (Math.random() - 0.5) * 50, 20, VIEW.width - 20);
    const ty = Phaser.Math.Clamp(p.y - 20 - Math.random() * 40, g.y + 40, s.H - 30);
    const B = USAGI.bundle;
    s.bullets.zone(tx, ty, B.r, { warn: B.fly, live: B.live, kind: 'fire' });
    const sp = this.segPool.spawn('k_shiba_0', g.x + 12, g.y - 14).setDepth(DEPTH.air - 0.06);
    g.bundles.push({ sp, x0: g.x + 12, y0: g.y - 14, tx, ty, t: 0, landed: false });
  },

  usBundles(e, g, dt) {
    const s = this.scene;
    const B = USAGI.bundle;
    for (const k of g.bundles) {
      k.t += dt;
      if (!k.landed) {
        const q = Math.min(1, k.t / B.fly);
        k.sp.setPosition(k.x0 + (k.tx - k.x0) * q, k.y0 + (k.ty - k.y0) * q - Math.sin(q * Math.PI) * 34).setRotation(k.t * 9).setScale((1 + Math.sin(q * Math.PI) * 0.5) / 3);
        if (Math.random() < dt * 20) s.fx.part(s.fx.parts, 'dot_1', k.sp.x, k.sp.y, { vy: 20, life: 0.3 }).setTint(0xffa040);
        if (q >= 1) {
          k.landed = true;
          k.sp.setRotation(0).setScale(1 / 3);
          s.fx.text(k.tx, k.ty - 14, 'JUU!', 0.5, 0xffb060);
          for (let i = 0; i < 6; i++) s.fx.part(s.fx.parts, 'dot_1', k.tx, k.ty, { vx: (Math.random() - 0.5) * 70, vy: -30 - Math.random() * 30, g: 140, life: 0.45 }).setTint(0xd8f0ff);
        }
      } else {
        // burning on the water, then gone out in a puff of steam
        k.sp.setFrame(`k_shiba_${Math.floor(k.t * 6) % 2}`).setPosition(k.tx + Math.sin(k.t * 2) * 0.6, k.ty);
        s.sfx.crackle?.();
        if (k.t > B.fly + B.live) {
          s.fx.puff('wisp_s_1', k.tx, k.ty - 4, 0.6);
          this.segPool.kill(k.sp);
          k.gone = true;
        }
      }
    }
    g.bundles = g.bundles.filter((k) => !k.gone);
  },

  // ---------------------------------------------------------------- phase 2: the boats of mud
  usToMud(e, g) {
    const s = this.scene;
    this.phaseBreak(e, g.x, g.y, 2, 'ŁODZIE Z BŁOTA');
    SAY(s, 90, g.y - 30, 'PON!', 0xd8b080, 1);
    this.usMudUp(e, g);
    this.usAct(g, 'rest');
  },

  /** Three boats of mud come up out of the lake, each with a clay hare in it; all four take their places. */
  usMudUp(e, g) {
    const s = this.scene;
    const real = Math.floor(Math.random() * SLOTS.length);
    g.slots = [];
    let m = 0;
    for (let i = 0; i < SLOTS.length; i++) {
      if (i === real) {
        g.slots[i] = 'real';
        continue;
      }
      const sp = this.segPool.spawn('k_dorobune_0', SLOTS[i], USAGI.home + 40).setDepth(DEPTH.air - 0.095).setAlpha(0);
      const mud = { sp, x: SLOTS[i], y: USAGI.home + 40, hp: USAGI.mud.hp * (easy() ? 0.6 : 1), fireAt: g.t + 1.2 + m * 0.5, hurt: 0, sink: 0, up: 0 };
      g.muds.push(mud);
      g.slots[i] = mud;
      m++;
      for (let k = 0; k < 5; k++) s.fx.part(s.fx.parts, 'dot_1', SLOTS[i], USAGI.home + 20, { vx: (Math.random() - 0.5) * 50, vy: -20 - Math.random() * 30, g: 120, life: 0.5 }).setTint(0x6a4a2a);
    }
    g.to = SLOTS[real];
    g.from = g.x;
    g.moving = USAGI.mud.move;
    g.shuffleAt = g.t + USAGI.mud.shuffle;
  },

  usMud(e, g, dt) {
    const s = this.scene;
    const M = USAGI.mud;
    // the boats shuffle round: each to another place, the real one among them
    if (g.t > g.shuffleAt && g.moving <= 0 && g.muds.some((m) => !m.sink)) {
      const order = Phaser.Utils.Array.Shuffle([0, 1, 2, 3]);
      const live = g.muds.filter((m) => !m.sink);
      g.from = g.x;
      g.to = SLOTS[order[0]];
      live.forEach((m, i) => Object.assign(m, { from: m.x, to: SLOTS[order[i + 1]] }));
      g.moving = M.move;
      g.shuffleAt = g.t + M.shuffle;
    }
    if (g.moving > 0) {
      g.moving -= dt;
      const k = 1 - Math.max(0, g.moving) / M.move;
      const q = k * k * (3 - 2 * k);
      g.x = g.from + (g.to - g.from) * q;
      for (const m of g.muds) if (m.to != null && !m.sink) m.x = m.from + (m.to - m.from) * q;
      g.row += dt * 10;
      // the real boat's oars dip: a glint of gold each stroke
      if (Math.floor(g.row) !== g.rowStroke) {
        g.rowStroke = Math.floor(g.row);
        if (g.rowStroke % 2 === 0) g.glint = 0.3;
      }
    } else if (g.t > g.glintAt) {
      g.glintAt = g.t + 1.6;
      g.glint = 0.3;
    }
    g.y += (USAGI.home + Math.sin(g.t * 0.8) * 4 - g.y) * Math.min(1, dt * 3);
    // all of them sunk: he calls up more
    if (!g.muds.length && g.moving <= 0) {
      g.backAt ??= g.t + M.back;
      if (g.t > g.backAt) {
        g.backAt = null;
        this.usMudUp(e, g);
      }
    }
    // he strikes sparks now and then from among them
    if (g.t > g.strikeAt && this.canFire(e)) {
      g.strikeAt = g.t + USAGI.strike.every * 1.4;
      const a = this.aimAt(e, 0, 20);
      for (let i = 0; i < volley(3); i++) s.bullets.shot('eb_lava', g.x, g.y + 22, a + (i - 1) * 0.22, normal, 1.8);
    }
  },

  usMuds(e, g, dt) {
    const s = this.scene;
    const p = s.player;
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
      m.y = USAGI.home + Math.sin(g.t * 0.8 + m.x) * 4 + (1 - m.up) * 30;
      const k = m.hp < USAGI.mud.hp * (easy() ? 0.3 : 0.5) ? 1 : 0;
      m.sp.setFrame(`k_dorobune_${k}`).setPosition(m.x, m.y).setAlpha(m.up);
      if (m.hurt > 0) m.sp.setTint(0x808080).setTintMode(Phaser.TintModes.ADD);
      else if (m.sp.isTinted) m.sp.clearTint();
      // a gob of mud from each, at the ship
      if (e.state === 'fight' && m.up >= 1 && g.t > m.fireAt && this.canFire(e)) {
        m.fireAt = g.t + USAGI.mud.fire[0] + Math.random() * (USAGI.mud.fire[1] - USAGI.mud.fire[0]);
        const a = Math.atan2(p.y - m.y, p.x - m.x);
        for (const da of volley(3) >= 3 ? [-0.2, 0, 0.2] : [0]) s.bullets.shot('eb_ink', m.x, m.y + 18, a + da, slow * 1.15, 2.2);
      }
      // ramming one hurts
      if (p.alive && !p.god && p.invulnerable <= 0 && p.entering <= 0 && Math.abs(p.x - m.x) < BOAT[0] && Math.abs(p.y - m.y) < BOAT[1]) p.hit();
    }
    g.muds = g.muds.filter((m) => !m.gone);
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
    this.usLine(g);
    SAY(s, g.x, g.y + 30, 'YOSHA!', 0xffffff, 1);
  },

  /** A lane across the lake flagged red; he gets into place at its end. */
  usLine(g) {
    const D = USAGI.dash;
    g.lane = D.lanes[0] + Math.random() * (D.lanes[1] - D.lanes[0]);
    g.from = [g.x, g.y];
    this.usAct(g, 'line');
  },

  usOar(e, g, dt) {
    const s = this.scene;
    const D = USAGI.dash;
    const startX = g.side < 0 ? 16 : VIEW.width - 16;
    if (g.act === 'line') {
      const k = Math.min(1, g.at / (D.warn * 0.6));
      const q = k * k * (3 - 2 * k);
      g.x = g.from[0] + (startX - g.from[0]) * q;
      g.y = g.from[1] + (g.lane - g.from[1]) * q;
      g.row += dt * 8;
      this.tele.fillStyle(WARN, 0.12 + 0.1 * Math.sin(g.at * 20)).fillRect(0, g.lane - BOAT[0] - 3, VIEW.width, (BOAT[0] + 3) * 2);
      this.tele.lineStyle(1, WARN, 0.9).lineBetween(0, g.lane - BOAT[0] - 3, VIEW.width, g.lane - BOAT[0] - 3).lineBetween(0, g.lane + BOAT[0] + 3, VIEW.width, g.lane + BOAT[0] + 3);
      if (g.at > D.warn) {
        this.usAct(g, 'dash');
        g.wakeX = g.x;
        SAY(s, g.x, g.y - 22, 'ORYAAA!', 0xffffff, 0.8);
      }
    } else if (g.act === 'dash') {
      g.x -= g.side * D.speed * dt;
      g.row += dt * 22;
      // the wake: rows of shots left in it, drifting down
      if (Math.abs(g.x - g.wakeX) > D.wake) {
        g.wakeX = g.x;
        g.wakeN = (g.wakeN ?? 0) + 1;
        const sy = g.wakeN % 2 ? -1 : 1; // (one side of the wake, then the other)
        if (this.canFire(e)) s.bullets.shot('eb_s', g.x, g.lane + sy * 7, DOWN + sy * 0.3, slow * 0.75, 1.8);
      }
      const p = s.player;
      if (p.alive && !p.god && p.invulnerable <= 0 && p.entering <= 0 && Math.abs(p.y - g.y) < BOAT[0] + 3 && Math.abs(p.x - g.x) < BOAT[1]) p.hit();
      const end = g.side < 0 ? VIEW.width - 16 : 16;
      if ((g.side < 0 && g.x >= end) || (g.side > 0 && g.x <= end)) {
        g.x = end;
        g.side = -g.side;
        this.usAct(g, 'tired');
        g.dashes++;
        SAY(s, g.x, g.y - 24, 'HAA... HAA...', SAFE, 0.6);
      }
    } else if (g.act === 'tired') {
      // spent: open to hits, a mint ring round him
      const r = 1 + 0.06 * Math.sin(g.t * 14);
      this.tele.lineStyle(2, SAFE, 0.9).strokeEllipse(g.x, g.y, 44 * r, 30 * r); // (the boat lies across)
      this.tele.lineStyle(1, 0xffffff, 0.5).strokeEllipse(g.x, g.y, 48 * r, 34 * r);
      if (g.at > D.tired * (easy() ? 1.5 : 1)) this.usLine(g);
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
    if (e.state === 'enter' || e.state === 'leave' || g.moving > 0 || g.act === 'dash' || g.act === 'line') fr = `k_usagi_row_${Math.floor(g.row) % 4}`;
    else if (g.act === 'strike') fr = `k_usagi_strike_${Math.floor(g.at * 10) % 2}`;
    else if (g.act === 'throw') fr = 'k_usagi_throw';
    else if (g.act === 'tired') fr = `k_usagi_tired_${Math.floor(g.t * 4) % 2}`;
    else fr = `k_usagi_rest_${Math.floor(g.t * 0.7) % 3 === 2 ? 1 : 0}`;
    if (e.frame.name !== fr) e.setFrame(fr);
    // charging: the boat lies across the lane, its bow the way it goes
    const across = g.act === 'dash' || (g.act === 'line' && g.at > D_TURN) || g.act === 'tired';
    e.setRotation(across ? (g.side < 0 ? -Math.PI / 2 : Math.PI / 2) * (g.act === 'tired' ? -1 : 1) : 0);
    e.setPosition(g.x, g.y);
    // the gold glint of the real boat among the mud ones
    if (g.glint > 0) {
      g.glint -= dt;
      const k = g.glint / 0.3;
      this.tele.lineStyle(2, GOLD, 0.9 * k).strokeEllipse(g.x, g.y, 26 + (1 - k) * 10, 40 + (1 - k) * 10);
      if (Math.random() < 0.5) s.fx.part(s.fx.parts, 'dot_1', g.x + (Math.random() - 0.5) * 18, g.y + (Math.random() - 0.5) * 30, { vy: -10, life: 0.3 }).setTint(GOLD);
    }
    if (g.shrug && (g.shrug -= dt) > 0) this.tele.lineStyle(2, 0xd8e4f4, 0.75 * (g.shrug / 0.18)).strokeEllipse(g.x, g.y, 34, 48);
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
    for (const m of g.muds) {
      if (m.sink || m.up < 1 || Math.abs(shot.x - m.x) > BOAT[0] + shot.radius || Math.abs(shot.y - m.y) > BOAT[1] + shot.radius) continue;
      m.hp -= shot.damage;
      m.hurt = 0.08;
      if (Math.random() < 0.4) s.fx.part(s.fx.parts, 'dot_1', shot.x, shot.y, { vx: (Math.random() - 0.5) * 60, vy: -20, g: 120, life: 0.3 }).setTint(0x6a4a2a);
      if (m.hp <= 0) this.usSink(g, m);
      return true;
    }
    if (e.stage === 3 && g.act !== 'tired') {
      const [hx, hy] = g.act === 'dash' || g.act === 'line' ? [BOAT[1], BOAT[0]] : BOAT;
      if (Math.abs(shot.x - g.x) < hx + shot.radius && Math.abs(shot.y - g.y) < hy + shot.radius) {
        g.shrug = 0.18;
        if (Math.random() < 0.3) s.fx.part(s.fx.parts, 'dot_1', shot.x, shot.y, { vx: (Math.random() - 0.5) * 100, vy: 60, drag: 1.5, life: 0.25 }).setTint(0xe8eef8);
        if (s.t > (g.kinAt ?? 0)) {
          g.kinAt = s.t + 0.9;
          SAY(s, shot.x, shot.y - 10, 'SUKA!', 0xd8e4f4, 0.5);
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
    for (const m of g.muds) {
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

const D_TURN = USAGI.dash.warn * 0.5; // (part way into getting in place, the boat turns across its lane)
void TAU;
