// Tokyo's second miniboss (docs/plan-tokyo.md, 6.2): TAIYAKI, the school out of the iron mould. Methods of Enemies
// (mixed in like the cities'). A heavy with "hold": the city stops under the fight, the mould floats over the stall
// that bakes fish of batter in Sensō-ji's court and comes down on it at the end. Art: tools/art/tokyo/taiyaki.mjs.
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { volley } from '../../difficulty.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * Its life, the phases' thresholds, how long it stays; the mould (how high over the stall, how long it bakes); the
 * little fish (how many, their life in each phase, the figure of eight they swim, how often each one shoots, how
 * often the school forms one big fish and charges, and how fast); the great fish (its hover, the warning, the
 * charge's speed and reach, how long it lies spent, open to hits; how many runs in a row, bouncing off the screen's
 * edges, before and after it is half gone, the warning before each bounce, how far from the edge it turns).
 */
export const TAIYAKI = {
  hp: 980,
  phase: [0.66, 0.33],
  time: 95,
  hover: 40,
  bake: 1.3,
  school: { n: 6, hp: [34, 46], loop: [58, 20], gap: 64, speed: 1.05, fire: [1.5, 2.3], rebake: 9, charge: 9.5, rush: 175 },
  big: { swim: 1.4, aim: 0.8, rush: 230, reach: 0.72, tired: 2.4, back: 0.9, bounces: [2, 3], rebound: 0.55, wall: 30, under: 48 },
};

const STALL = [98, 9176]; // the stall that bakes fish of batter (tools/art/tokyo/asakusa.mjs: yatai(86, 9176, ..., true))
const KATA_OFF = [13, -6.3]; // from the mould's body to its frame's middle (the handles go off to the right)
const BIG_BELLY = [4, 6]; // the great fish's belly from its middle
const FLAVOURS = ['a', 'k', 'm'];
const SHAPE = [[24, 0], [10, -11], [10, 11], [-8, -10], [-8, 10], [-26, 0]]; // the school as one big fish: head first
const SAFE = 0x81f3cc;
const WARN = 0xff735e;
const STEAM = 'wisp_s_1';

export const tokyoTaiyaki = {
  /**
   * An iron taiyaki mould floats over the stall in front of the temple. Three phases:
   * 1. WYPIEK: shut, it bakes (sizzling, steaming) - shots ring off the iron; it opens in a cloud of steam and lets
   *    out six little fish that swim a figure of eight and spit beans: shoot the fish;
   * 2. NADZIENIA: the fish come bitten, showing what they are filled with, and each shoots its own way: sweet beans
   *    (dark balls at the player), custard (yellow blobs that stop and hang in the air), green tea (a fan of leaves);
   *    now and then the school forms one big fish and charges;
   * 3. Ō-TAIYAKI: the mould heats from grey to red and out jumps one great golden fish with wings of crisp batter. It
   *    charges two or three times in a row, bouncing off the screen's edges along announced red lines, leaving
   *    crumbs; spent after the last, it lies with its belly open to hits (mint).
   * Beaten, the great fish breaks in half in a gust of steam and the mould drops on to the stall.
   */
  spawnTaiyaki(e) {
    const s = this.scene;
    const g = (e.ty = {
      t: 0, act: 'enter', at: 0, step: 0, lid: 'shut', heat: 0, bob: 0, fish: [], big: null, ph: 0, rebakeAt: 0, chargeAt: TAIYAKI.school.charge,
      form: null, steamAt: 0, shake: 0, y: -50,
    });
    Object.assign(e, { stage: 1, pass: true, harmless: true, radius: 14, flashTint: 0x505050 });
    e.setDepth(DEPTH.air - 0.09);
    g.heatSp = this.segPool.spawn('ty_heat_shut', e.x, e.y).setDepth(DEPTH.air - 0.085).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    g.shadow = this.segPool.spawn('ty_shadow', STALL[0], s.parallax.screenY(STALL[1])).setDepth(DEPTH.ground + 0.6).setAlpha(0);
    return e;
  },

  /** The mould's body (its middle, on the screen). */
  tyKata(g) {
    const s = this.scene;
    return [90 + (g.shake ? Math.round(Math.sin(g.t * 60) * g.shake) : 0), s.parallax.screenY(STALL[1]) - TAIYAKI.hover + g.y + Math.sin(g.t * 1.8) * 2];
  },

  taiyaki(e, dt) {
    const g = e.ty;
    if (!g) return;
    g.t += dt;
    g.at += dt;
    const frac = e.hp / e.maxHp;
    if (e.state === 'enter') this.tyEnter(e, g, dt);
    else if (e.state === 'leave') this.tyLeave(e, g, dt);
    else {
      g.fight = (g.fight ?? 0) + dt;
      if (g.fight > TAIYAKI.time && !g.going) this.tyGiveUp(e, g);
      else if (e.stage === 1 && frac < TAIYAKI.phase[0]) this.tyFillings(e, g);
      else if (e.stage === 2 && frac < TAIYAKI.phase[1] && g.act !== 'heat' && g.act !== 'leap') this.tyHeatStart(e, g);
      if (e.stage < 3 || g.act === 'heat' || g.act === 'leap') this.tyBakery(e, g, dt);
      else this.tyGreat(e, g, dt);
    }
    this.tySchool(e, g, dt);
    this.tyPlace(e, g, dt);
  },

  /** Down from the sky on to its place over the stall, turning, the card's alarm still going. */
  tyEnter(e, g, dt) {
    g.y += (0 - g.y) * Math.min(1, dt * 2.2);
    g.lid = 'shut';
    if (g.at > 1.8) {
      e.state = 'fight';
      this.tyAct(g, 'bake');
      this.scene.fx.text(90, this.tyKata(g)[1] - 22, 'JUU~', 1, 0xffd080);
    }
  },

  tyAct(g, act) {
    Object.assign(g, { act, at: 0, step: 0 });
  },

  // ---------------------------------------------------------------- phases 1 and 2: the mould and its school
  tyBakery(e, g, dt) {
    const s = this.scene;
    const [kx, ky] = this.tyKata(g);
    const live = g.fish.filter((f) => !f.gone);
    if (g.act === 'bake') {
      // shut, sizzling: steam from the seam, a hiss of fat
      g.lid = 'shut';
      g.shake = 0.5;
      s.sfx.sizzle?.();
      if (Math.random() < dt * 9) s.fx.puff(STEAM, kx + (Math.random() - 0.5) * 36, ky - 6, 0.5);
      if (Math.random() < dt * 14) s.fx.part(s.fx.parts, 'dot_1', kx + (Math.random() - 0.5) * 40, ky + 4, { vx: (Math.random() - 0.5) * 40, vy: -30 - Math.random() * 30, drag: 1, life: 0.3 }).setTint(0xffd080);
      if (g.at > TAIYAKI.bake) this.tyAct(g, 'open');
    } else if (g.act === 'open') {
      // the lid comes up in a gust of steam, a ring of beans blown out with it, and the fish swim out one by one
      g.shake = 0;
      g.lid = g.at < 0.15 ? 'crack' : g.at < 0.3 ? 'half' : 'open';
      if (g.step === 0 && g.at > 0.3) {
        g.step = 1;
        for (let i = 0; i < 8; i++) s.fx.puff(STEAM, kx + (Math.random() - 0.5) * 40, ky - 10 - Math.random() * 12, 0.8);
        s.fx.text(kx - 20, ky - 24, e.stage === 1 ? 'YAKETA!' : 'NAKAMI WA?', 0.9, 0xffe080);
        if (this.canFire(e)) for (let i = 0; i < volley(10); i++) s.bullets.shot('ty_bean', kx, ky, (i / volley(10)) * TAU + g.t, slow, 1.5, { spin: true });
      }
      if (g.step >= 1 && g.at > 0.35 + (g.step - 1) * 0.16 && g.step <= TAIYAKI.school.n) {
        g.step++;
        if (live.length < TAIYAKI.school.n) this.tyFishOut(e, g, kx, ky);
      }
      if (g.at > 0.4 + TAIYAKI.school.n * 0.16 + 0.4) {
        this.tyAct(g, 'swim');
        g.rebakeAt = g.t + TAIYAKI.school.rebake;
      }
    } else if (g.act === 'swim') {
      g.lid = 'shut';
      // short of fish: bake some more
      if ((live.length <= 2 || g.t > g.rebakeAt) && live.length < TAIYAKI.school.n) this.tyAct(g, 'bake');
      // the school as one big fish, charging (from the second phase)
      else if (e.stage === 2 && live.length >= 3 && g.t > g.chargeAt) this.tyFormStart(e, g);
    } else if (g.act === 'form') this.tyForm(e, g, dt);
    else if (g.act === 'heat') this.tyHeat(e, g, dt);
    else if (g.act === 'leap') this.tyLeap(e, g, dt);
  },

  /** A fish of batter out of the mould (in the second phase, bitten, showing its filling). */
  tyFishOut(e, g, kx, ky) {
    const used = new Set(g.fish.filter((f) => !f.gone).map((f) => f.slot));
    let slot = 0;
    while (used.has(slot)) slot++;
    const fl = e.stage >= 2 ? FLAVOURS[slot % 3] : null;
    const hp = TAIYAKI.school.hp[e.stage >= 2 ? 1 : 0];
    const sp = this.segPool.spawn(fl ? `ty_fish_${fl}1_0` : 'ty_fish_0', kx, ky).setDepth(DEPTH.air - 0.05);
    g.fish = g.fish.filter((f) => !f.gone);
    g.fish.push({ sp, slot, fl, hp, max: hp, bite: fl ? 1 : 0, out: 0, x: kx, y: ky, from: [kx, ky], fireAt: g.t + 0.8 + Math.random() * 1.2, hurt: 0, ang: 0, gone: false });
  },

  /** Where a fish's place in the figure of eight is now. */
  tySlot(g, slot) {
    const S = TAIYAKI.school;
    const [, ky] = this.tyKata(g);
    const th = g.ph + (slot / S.n) * TAU;
    return [90 + S.loop[0] * Math.sin(th), ky + S.gap + S.loop[1] * Math.sin(th) * Math.cos(th)];
  },

  /** The school: out of the mould to their places, round the figure of eight, shooting each its own way. */
  tySchool(e, g, dt) {
    const s = this.scene;
    const S = TAIYAKI.school;
    const p = s.player;
    g.ph += dt * S.speed;
    for (const f of g.fish) {
      if (f.gone) continue;
      f.hurt = Math.max(0, f.hurt - dt);
      const [ox, oy] = [f.x, f.y];
      if (f.home) {
        // (sucked back into the mould: the third phase, or leaving)
        const [kx, ky] = this.tyKata(g);
        f.x += (kx - f.x) * Math.min(1, dt * 6);
        f.y += (ky - f.y) * Math.min(1, dt * 6);
        if (Math.hypot(kx - f.x, ky - f.y) < 4) this.tyFishGone(g, f, false);
      } else if (g.form && f.form != null) {
        [f.x, f.y] = g.form.at(f.form);
      } else {
        const [tx, ty] = this.tySlot(g, f.slot);
        f.out = Math.min(1, f.out + dt / 0.7);
        const k = f.out < 1 ? f.out * f.out : 1;
        if (f.out < 1) [f.x, f.y] = [f.from[0] + (tx - f.from[0]) * k, f.from[1] + (ty - f.from[1]) * k];
        else [f.x, f.y] = [f.x + (tx - f.x) * Math.min(1, dt * 8), f.y + (ty - f.y) * Math.min(1, dt * 8)];
        if (f.back) {
          // back from a charge: in from the top of the screen
          f.back = Math.max(0, f.back - dt);
        }
      }
      // turned the way it swims (its belly kept down)
      const [vx, vy] = [f.x - ox, f.y - oy];
      if (Math.hypot(vx, vy) > 0.05) f.ang += Phaser.Math.Angle.Wrap(Math.atan2(vy, vx) - f.ang) * Math.min(1, dt * 10);
      const left = Math.cos(f.ang) < 0;
      const fr = (f.fl ? `ty_fish_${f.fl}${f.bite}_` : 'ty_fish_') + (Math.floor(g.t * 8 + f.slot) % 4);
      if (f.sp.frame.name !== fr) f.sp.setFrame(fr);
      f.sp.setPosition(f.x, f.y).setRotation(f.ang).setFlipY(left);
      if (f.hurt > 0) f.sp.setTint(0x808080).setTintMode(Phaser.TintModes.ADD);
      else if (f.sp.isTinted) f.sp.clearTint();
      // its shots: beans; or by its filling
      if (e.state === 'fight' && !f.home && f.out >= 1 && !g.form && g.t > f.fireAt && this.canFire(e) && f.y < s.H * 0.6) {
        f.fireAt = g.t + S.fire[0] + Math.random() * (S.fire[1] - S.fire[0]);
        this.tyFishShot(e, f);
      }
      // touching one hurts
      if (p.alive && !p.god && p.invulnerable <= 0 && p.entering <= 0 && Math.hypot(p.x - f.x, p.y - f.y) < 6.5) p.hit();
      // a crumb now and then, a drip of filling from the bitten ones
      if (f.fl && Math.random() < dt * 1.5) s.fx.part(s.fx.parts, 'dot_1', f.x, f.y + 2, { vy: 20, g: 120, life: 0.4 }).setTint({ a: 0x4a1424, k: 0xf0cc50, m: 0x5a8a28 }[f.fl]);
    }
    if (g.form) this.tyFormDraw(g);
  },

  tyFishShot(e, f) {
    const s = this.scene;
    const b = s.bullets;
    const a = this.aimAt(f);
    if (!f.fl) {
      // a bean or two
      for (let i = 0; i < (f.slot % 2 ? 1 : 2); i++) b.shot('ty_bean', f.x, f.y, a + (i ? 0.18 : 0) - (f.slot % 2 ? 0 : 0.09), slow * 1.05, 1.5, { spin: true });
    } else if (f.fl === 'a') {
      // sweet beans: dark balls straight at the player (three once it is bitten deeper)
      for (let i = 0; i < (f.bite >= 2 ? 3 : 1); i++) b.shot('ty_anko', f.x, f.y, a + (i - (f.bite >= 2 ? 1 : 0)) * 0.2, normal, 2.4);
    } else if (f.fl === 'k') {
      // custard: blobs that stop in the air, hang there, then drift on down
      for (const i of f.bite >= 2 ? [-1, 0, 1] : [-0.5, 0.5]) b.shot('ty_cream_0', f.x, f.y, a + i * 0.45, slow * 1.2, 2.3, { frz: { at: 0.55 + Math.random() * 0.3, hold: 1.3, turn: 0, speed: 16, frame: 'ty_cream_1' } });
    } else {
      // green tea: a fan of leaves
      const n = volley(5);
      for (let i = 0; i < n; i++) b.shot('ty_matcha', f.x, f.y, a + (i / (n - 1) - 0.5) * 0.9, normal * 0.9, 1.6, { spin: true });
    }
  },

  /** A fish eaten (shot down): crumbs and its filling flying; or gone back into the mould. */
  tyFishGone(g, f, shot) {
    const s = this.scene;
    f.gone = true;
    f.sp.setRotation(0).setFlipY(false).clearTint();
    this.segPool.kill(f.sp);
    if (!shot) return;
    s.fx.debris(f.x, f.y, 5, 0xd8902a, 1);
    for (let i = 0; i < 8; i++) s.fx.part(s.fx.parts, 'dot_1', f.x, f.y, { vx: (Math.random() - 0.5) * 90, vy: -30 - Math.random() * 50, g: 160, life: 0.5 }).setTint(f.fl ? { a: 0x4a1424, k: 0xf0cc50, m: 0x5a8a28 }[f.fl] : 0xe0a040);
    s.fx.text(f.x, f.y - 10, ['MOGU', 'PAKU', 'UMA!'][Math.floor(Math.random() * 3)], 0.5, 0xffe080);
    s.sfx.explode('s');
  },

  /** The second phase: the plain fish crumble, and the mould bakes them again with something in them. */
  tyFillings(e, g) {
    this.phaseBreak(e, ...this.tyKata(g), 2, 'NADZIENIA');
    for (const f of g.fish) if (!f.gone) this.tyFishGone(g, f, true);
    g.form = null;
    g.chargeAt = g.t + 6;
    this.tyAct(g, 'bake');
  },

  // ---------------------------------------------------------------- the school as one big fish
  tyFormStart(e, g) {
    const p = this.scene.player;
    const live = g.fish.filter((f) => !f.gone && !f.home);
    const [cx, cy] = [90, this.tyKata(g)[1] + 50];
    const aim = Math.atan2(p.y - cy, p.x - cx);
    g.form = { cx, cy, aim, t: 0, k: 0, at: null };
    live.forEach((f, i) => (f.form = i));
    g.form.at = (i) => {
      const fm = g.form;
      const [px, py] = SHAPE[i % SHAPE.length];
      const [c, sn] = [Math.cos(fm.aim), Math.sin(fm.aim)];
      const tx = fm.cx + px * c - py * sn;
      const ty = fm.cy + px * sn + py * c;
      const f = live.find((q) => q.form === i);
      if (fm.t < 0.6) {
        const q = fm.t / 0.6;
        return [f.x + (tx - f.x) * q, f.y + (ty - f.y) * q];
      }
      return [tx, ty];
    };
    this.tyAct(g, 'form');
    this.scene.fx.text(cx, cy - 26, 'ŌKII SAKANA!', 0.9, 0xffe080);
  },

  tyForm(e, g, dt) {
    const s = this.scene;
    const fm = g.form;
    fm.t += dt;
    const S = TAIYAKI.school;
    if (fm.t > 0.6 && fm.t < 1.4) {
      // (aiming: the shape turns after the player, then holds)
      const p = s.player;
      if (fm.t < 1.05) fm.aim += Phaser.Math.Angle.Wrap(Math.atan2(p.y - fm.cy, p.x - fm.cx) - fm.aim) * Math.min(1, dt * 4);
    } else if (fm.t >= 1.4) {
      fm.cx += Math.cos(fm.aim) * S.rush * dt;
      fm.cy += Math.sin(fm.aim) * S.rush * dt;
      if (Math.random() < dt * 20) s.fx.puff(STEAM, fm.cx, fm.cy, 0.3);
      if (fm.cy > s.H + 30 || fm.cx < -40 || fm.cx > VIEW.width + 40 || fm.cy < -40) {
        // off the screen: back to their places, in from the top
        for (const f of g.fish) {
          if (f.gone || f.form == null) continue;
          f.form = null;
          f.from = [Phaser.Math.Clamp(f.x, 10, VIEW.width - 10), -14];
          [f.x, f.y] = f.from;
          f.out = 0;
        }
        g.form = null;
        g.chargeAt = g.t + S.charge;
        this.tyAct(g, 'swim');
      }
    }
  },

  /** The warning before the school charges: the way it will go, red. */
  tyFormDraw(g) {
    const fm = g.form;
    if (fm.t < 0.6 || fm.t >= 1.4) return;
    const k = (fm.t - 0.6) / 0.8;
    const ink = this.tele;
    const [c, sn] = [Math.cos(fm.aim), Math.sin(fm.aim)];
    ink.lineStyle(14, WARN, 0.12 + 0.18 * k).lineBetween(fm.cx, fm.cy, fm.cx + c * 400, fm.cy + sn * 400);
    ink.lineStyle(2, WARN, 0.5 + 0.4 * k).lineBetween(fm.cx + c * 26, fm.cy + sn * 26, fm.cx + c * 400, fm.cy + sn * 400);
  },

  // ---------------------------------------------------------------- phase 3: Ō-TAIYAKI
  tyHeatStart(e, g) {
    this.phaseBreak(e, ...this.tyKata(g), 3, 'Ō-TAIYAKI');
    g.form = null;
    for (const f of g.fish) if (!f.gone) f.home = true;
    this.tyAct(g, 'heat');
  },

  /** The mould heats from grey to red, shaking, hissing; then the lid flies up. */
  tyHeat(e, g, dt) {
    const s = this.scene;
    const [kx, ky] = this.tyKata(g);
    g.lid = 'shut';
    g.heat = Math.min(1, g.at / 1.8);
    g.shake = 0.5 + g.heat * 1.5;
    if (Math.random() < dt * (10 + g.heat * 30)) s.fx.puff(STEAM, kx + (Math.random() - 0.5) * 40, ky - 6, 0.6);
    if (Math.random() < dt * 30 * g.heat) s.fx.part(s.fx.parts, 'dot_1', kx + (Math.random() - 0.5) * 44, ky, { vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 40, drag: 1, life: 0.35 }).setTint(Math.random() < 0.5 ? 0xffd070 : 0xff6030).setBlendMode(Phaser.BlendModes.ADD);
    if (g.step === 0 && g.at > 0.8) {
      g.step = 1;
      s.fx.text(kx, ky - 26, 'JUWAAA!', 1, 0xff9050);
    }
    if (g.at > 1.9) {
      this.tyAct(g, 'leap');
      g.lid = 'open';
      g.shake = 0;
      s.cameras.main.shake(300, 0.008);
      s.fx.flash(0.4, 0.3, 0xfff0c0);
      for (let i = 0; i < 14; i++) s.fx.puff(STEAM, kx + (Math.random() - 0.5) * 50, ky - Math.random() * 20, 0.9);
      const sp = this.segPool.spawn('ty_big_0_0', kx, ky).setDepth(DEPTH.air - 0.04);
      g.big = { sp, x: kx, y: ky, w: 0, act: 'leap', at: 0, face: 1, ang: 0 };
    }
  },

  tyLeap(e, g, dt) {
    // out in an arc, flapping, to its place under the mould
    const b = g.big;
    const [kx, ky] = this.tyKata(g);
    const k = Math.min(1, g.at / 0.8);
    b.x = kx + 6 * k;
    b.y = ky - 40 * Math.sin(k * Math.PI) + 62 * k;
    b.ang = (1 - k) * -0.6;
    if (k >= 1) {
      this.tyAct(g, 'swim');
      b.act = 'swim';
      b.at = 0;
      g.lid = 'half';
    }
  },

  tyGreat(e, g, dt) {
    const s = this.scene;
    const B = TAIYAKI.big;
    const b = g.big;
    if (!b) return;
    const p = s.player;
    const [kx, ky] = this.tyKata(g);
    b.at += dt;
    // the mould: glowing, steaming, a ring of beans from it now and then
    g.heat = 0.75 + 0.25 * Math.sin(g.t * 3);
    g.lid = 'half';
    if (Math.random() < dt * 6) s.fx.puff(STEAM, kx + (Math.random() - 0.5) * 30, ky - 8, 0.5);
    if ((g.ringAt = (g.ringAt ?? 3) - dt) <= 0 && this.canFire(e)) {
      g.ringAt = 3.2;
      for (let i = 0; i < volley(10); i++) s.bullets.shot('ty_bean', kx, ky, (i / volley(10)) * TAU + g.t, slow, 1.5, { spin: true });
    }
    // its wings break as it weakens
    const frac = e.hp / e.maxHp;
    const w = frac > 0.22 ? 0 : frac > 0.11 ? 1 : 2;
    if (w !== b.w) {
      b.w = w;
      for (let i = 0; i < 16; i++) s.fx.part(s.fx.parts, Math.random() < 0.5 ? 'ty_crumb_0' : 'ty_crumb_1', b.x + (Math.random() - 0.5) * 50, b.y + (Math.random() - 0.5) * 20, { vx: (Math.random() - 0.5) * 120, vy: -30 - Math.random() * 60, g: 180, spin: 6, life: 0.7 });
      s.fx.text(b.x, b.y - 22, 'PARI!', 0.7, 0xfff0a0);
    }
    if (b.act === 'swim') {
      // to and fro under the mould, crumbs falling off it
      const tx = 90 + 46 * Math.sin(g.t * 1.3);
      b.face = tx > b.x ? 1 : -1;
      b.x += (tx - b.x) * Math.min(1, dt * 3);
      b.y += (ky + 62 - b.y) * Math.min(1, dt * 3);
      b.ang *= 0.9;
      if ((b.crumb = (b.crumb ?? 0) - dt) <= 0 && this.canFire(e)) {
        b.crumb = 0.32;
        s.bullets.shot(Math.random() < 0.5 ? 'ty_crumb_0' : 'ty_crumb_1', b.x + (Math.random() - 0.5) * 30, b.y + 10, DOWN, 18, 1.5, { ay: 50, maxV: 62 });
      }
      if (b.at > B.swim) {
        b.act = 'aim';
        b.at = 0;
        b.to = null;
        b.chain = frac > 0.165 ? B.bounces[0] : B.bounces[1]; // (runs in a row: one more once it is half gone)
      }
    } else if (b.act === 'aim' || b.act === 'rebound') {
      // it turns on the player, its eye wide: the way it will charge, red. A charge but the last runs on to the
      // screen's edge and it bounces off there: a moment, a new red line at the player, and off again
      const a = Math.atan2(p.y - b.y, p.x - b.x);
      const warn = b.act === 'aim' ? B.aim : B.rebound;
      if (b.at < warn * 0.7 || !b.to) {
        if (b.act === 'aim') {
          b.to = this.tyWall(b.x, b.y, a, s.H * B.reach, ky + B.under);
          b.aimA = a;
        } else [b.to, b.aimA] = this.tyBounce(b, p, s.H * B.reach, ky + B.under);
        // the last run ends by the player (or at the edge, if that comes first)
        if (b.chain <= 1) {
          const len = Math.hypot(b.to[0] - b.x, b.to[1] - b.y);
          const want = Math.hypot(p.x - b.x, p.y - b.y) + 36;
          if (want < len) b.to = [b.x + Math.cos(b.aimA) * want, b.y + Math.sin(b.aimA) * want];
        }
      }
      b.face = Math.cos(b.aimA) >= 0 ? 1 : -1;
      b.ang = b.face > 0 ? b.aimA : b.aimA - Math.PI;
      const k = b.at / warn;
      const ink = this.tele;
      ink.lineStyle(26, WARN, 0.1 + 0.16 * k).lineBetween(b.x, b.y, b.to[0], b.to[1]);
      ink.lineStyle(2, WARN, 0.5 + 0.4 * k).lineBetween(b.x, b.y, b.to[0], b.to[1]);
      if (b.at > warn) {
        b.act = 'charge';
        b.at = 0;
        b.from = [b.x, b.y];
        s.fx.text(b.x, b.y - 26, 'DOSUN!', 0.7, 0xffe080);
      }
    } else if (b.act === 'charge') {
      const d = Math.hypot(b.to[0] - b.from[0], b.to[1] - b.from[1]);
      const k = Math.min(1, (b.at * B.rush) / Math.max(1, d));
      b.x = b.from[0] + (b.to[0] - b.from[0]) * k;
      b.y = b.from[1] + (b.to[1] - b.from[1]) * k;
      // crumbs in its wake: they hang a moment, then fall
      if ((b.crumb = (b.crumb ?? 0) - dt) <= 0 && this.canFire(e)) {
        b.crumb = 0.06;
        s.bullets.shot(Math.random() < 0.5 ? 'ty_crumb_0' : 'ty_crumb_1', b.x + (Math.random() - 0.5) * 16, b.y + (Math.random() - 0.5) * 10, DOWN + (Math.random() - 0.5), 8, 1.5, { frz: { at: 0.2, hold: 0.7, turn: 0, speed: 40, frame: 'ty_crumb_1' } });
      }
      if (Math.random() < dt * 20) s.fx.puff(STEAM, b.x - Math.cos(b.aimA) * 20, b.y - Math.sin(b.aimA) * 20, 0.35);
      if (k >= 1 && b.chain > 1) {
        // off the edge of the screen: a bump, a puff of flour and crumbs, and it turns for the next run
        b.chain--;
        b.inA = b.aimA; // (the way it came in, to bounce off)
        b.act = 'rebound';
        b.at = 0;
        b.to = null;
        s.cameras.main.shake(120, 0.004);
        s.sfx.explode('s');
        s.fx.text(b.x, b.y - 24, 'BOYON!', 0.7, 0xfff0a0);
        for (let i = 0; i < 8; i++) s.fx.part(s.fx.parts, Math.random() < 0.5 ? 'ty_crumb_0' : 'ty_crumb_1', b.x, b.y, { vx: (Math.random() - 0.5) * 140, vy: (Math.random() - 0.5) * 140, g: 160, spin: 6, life: 0.5 });
        for (let i = 0; i < 3; i++) s.fx.puff(STEAM, b.x + (Math.random() - 0.5) * 20, b.y + (Math.random() - 0.5) * 10, 0.45);
      } else if (k >= 1) {
        b.act = 'tired';
        b.at = 0;
        s.cameras.main.shake(180, 0.005);
        s.fx.text(b.x, b.y - 24, 'HAA... HAA...', 0.9, 0xffffff);
      }
    } else if (b.act === 'tired') {
      // spent: it lies there panting, its belly open to hits
      b.ang *= 0.85;
      if (b.at > B.tired) {
        b.act = 'back';
        b.at = 0;
        b.from = [b.x, b.y];
      }
    } else if (b.act === 'back') {
      const k = Math.min(1, b.at / B.back);
      const e2 = k * k * (3 - 2 * k);
      b.x = b.from[0] + (90 - b.from[0]) * e2;
      b.y = b.from[1] + (ky + 62 - b.from[1]) * e2;
      b.face = 90 > b.from[0] ? 1 : -1;
      if (k >= 1) {
        b.act = 'swim';
        b.at = 0;
      }
    }
    // touching it hurts, except while it lies spent
    if (b.act !== 'tired' && p.alive && !p.god && p.invulnerable <= 0 && p.entering <= 0 && ((p.x - b.x) / 26) ** 2 + ((p.y - b.y) / 11) ** 2 < 1) p.hit();
  },

  /**
   * The next run off the edge it has just met: its way in mirrored off that edge, then turned a little (at most
   * 25 degrees) towards the player. Returns [where it meets the next edge, the angle].
   */
  tyBounce(b, p, floor, top) {
    const W = TAIYAKI.big.wall;
    let dx = Math.cos(b.inA);
    let dy = Math.sin(b.inA);
    if (b.x <= W + 1 || b.x >= VIEW.width - W - 1) dx = -dx;
    if (b.y >= floor - 1 || b.y <= top + 1) dy = -dy;
    const r = Math.atan2(dy, dx);
    const turn = Phaser.Math.Angle.Wrap(Math.atan2(p.y - b.y, p.x - b.x) - r);
    // (a run that would only graze the edge goes plainly mirrored, or else out to the middle of the screen)
    const long = (a) => Math.hypot(...this.tyWall(b.x, b.y, a, floor, top).map((v, i) => v - (i ? b.y : b.x))) >= 50;
    let a = r + Phaser.Math.Clamp(turn, -0.45, 0.45);
    if (!long(a)) a = long(r) ? r : Math.atan2(floor * 0.5 - b.y, VIEW.width / 2 - b.x);
    return [this.tyWall(b.x, b.y, a, floor, top), a];
  },

  /** Where a charge from (x, y) along angle a meets the edge of the screen (its sides, `floor` below), or `top`: a
   * little under the mould, as the iron in front of it would take the shots meant for its belly. */
  tyWall(x, y, a, floor, top) {
    const W = TAIYAKI.big.wall;
    const [c, sn] = [Math.cos(a), Math.sin(a)];
    let t = Infinity;
    if (c > 1e-3) t = Math.min(t, (VIEW.width - W - x) / c);
    if (c < -1e-3) t = Math.min(t, (W - x) / c);
    if (sn > 1e-3) t = Math.min(t, (floor - y) / sn);
    if (sn < -1e-3) t = Math.min(t, (top - y) / sn);
    t = Math.max(30, t);
    return [x + c * t, y + sn * t];
  },

  // ---------------------------------------------------------------- the end of the fight, either way
  tyGiveUp(e, g) {
    g.going = true;
    e.state = 'leave';
    g.form = null;
    for (const f of g.fish) if (!f.gone) f.home = true;
    this.tyAct(g, 'leave');
    this.scene.fx.text(90, this.tyKata(g)[1] - 24, 'URIKIRE!', 1, 0xffe080);
  },

  tyLeave(e, g, dt) {
    // everything back into the mould, and it is off over the temple roof
    const b = g.big;
    const [kx, ky] = this.tyKata(g);
    if (b) {
      b.x += (kx - b.x) * Math.min(1, dt * 5);
      b.y += (ky - b.y) * Math.min(1, dt * 5);
      if (Math.hypot(kx - b.x, ky - b.y) < 6) {
        this.segPool.kill(b.sp);
        g.big = null;
      }
      return;
    }
    if (g.fish.some((f) => !f.gone)) return;
    g.lid = 'shut';
    g.y -= dt * (40 + g.at * 80);
    if (ky < -50) this.remove(e);
  },

  // ---------------------------------------------------------------- its parts, put together every frame
  tyPlace(e, g, dt) {
    const s = this.scene;
    const [kx, ky] = this.tyKata(g);
    const fr = `ty_kata_${g.lid}`;
    if (e.frame.name !== fr) e.setFrame(fr);
    e.setPosition(kx + KATA_OFF[0], ky + KATA_OFF[1]);
    g.heatSp.setFrame(`ty_heat_${g.lid}`).setPosition(e.x, e.y).setAlpha(g.heat * (0.8 + 0.2 * Math.sin(g.t * 9)));
    const gy = s.parallax.screenY(STALL[1]);
    g.shadow.setPosition(STALL[0], gy + 2).setAlpha(Math.min(1, (g.y + 60) / 60) * 0.9);
    const b = g.big;
    if (b) {
      let frame;
      if (b.act === 'charge') frame = `ty_charge_${b.w}`;
      else if (b.act === 'tired') frame = `ty_tired_${b.w}_${Math.floor(g.t * 4) % 2}`;
      else frame = `ty_big_${b.w}_${Math.floor(g.t * 7) % 4}`;
      if (b.sp.frame.name !== frame) b.sp.setFrame(frame);
      b.sp.setPosition(b.x, b.y).setFlipX(b.face < 0).setRotation(b.ang);
      if (e.flash > 0 && b.act === 'tired') b.sp.setTint(0x808080).setTintMode(Phaser.TintModes.ADD);
      else if (b.sp.isTinted) b.sp.clearTint();
      if (b.act === 'tired') {
        // the belly, open: a mint ring round it
        const ink = this.tele;
        const r = 1 + 0.06 * Math.sin(g.t * 14);
        const [bx, by] = [b.x + BIG_BELLY[0] * b.face, b.y + BIG_BELLY[1]];
        ink.lineStyle(2, SAFE, 0.9).strokeEllipse(bx, by, 40 * r, 18 * r);
        ink.lineStyle(1, 0xffffff, 0.5).strokeEllipse(bx, by, 44 * r, 21 * r);
      }
    }
    if (e.flash > 0 && e.stage < 3) e.clearTint(); // (shots ring off the iron: it does not flash)
  },

  /**
   * A shot reaching it: the iron rings (nothing gets through); a fish takes it (and the mould with it); the great
   * fish shrugs it off its crust, except on its belly while it lies spent. (Enemies.bossDeviceHit)
   */
  taiyakiShot(shot) {
    const e = this.heavy;
    const g = e?.ty;
    if (!g || e.dead || e.hp <= 0) return false;
    const s = this.scene;
    for (const f of g.fish) {
      if (f.gone || f.home || Math.hypot(shot.x - f.x, shot.y - f.y) > 7 + shot.radius) continue;
      if (e.state !== 'fight') return true;
      this.damage(e, shot.damage);
      f.hp -= shot.damage;
      f.hurt = 0.08;
      if (Math.random() < 0.4) s.fx.spark(shot.x, shot.y - 2);
      if (f.fl) {
        const bite = f.hp < f.max * 0.33 ? 3 : f.hp < f.max * 0.66 ? 2 : 1;
        if (bite !== f.bite) {
          f.bite = bite;
          s.fx.text(f.x, f.y - 8, 'GABU', 0.4, 0xffffff);
        }
      }
      if (f.hp <= 0) this.tyFishGone(g, f, true);
      return true;
    }
    const b = g.big;
    if (b && ((shot.x - b.x) / (26 + shot.radius)) ** 2 + ((shot.y - b.y) / (13 + shot.radius)) ** 2 < 1) {
      if (b.act === 'tired' && e.state === 'fight') {
        this.damage(e, shot.damage);
        if (Math.random() < 0.5) s.fx.spark(shot.x, shot.y - 2, SAFE);
      } else {
        if (Math.random() < 0.3) s.fx.part(s.fx.parts, 'ty_crumb_0', shot.x, shot.y, { vx: (Math.random() - 0.5) * 60, vy: 20, g: 150, life: 0.3 });
        this.tyClang(0.6);
      }
      return true;
    }
    const [kx, ky] = this.tyKata(g);
    if (((shot.x - kx) / (24 + shot.radius)) ** 2 + ((shot.y - ky) / (12 + shot.radius)) ** 2 < 1) {
      s.fx.spark(shot.x, shot.y - 1, g.heat > 0.4 ? 0xffa040 : 0xd8d8e0);
      this.tyClang(1);
      return true;
    }
    return false;
  },

  tyClang(k) {
    const s = this.scene;
    if (s.t > (this.tyPingAt ?? 0)) {
      this.tyPingAt = s.t + 0.09 / k;
      s.sfx.bossHit(true);
    }
  },

  tyCleanup(e) {
    const g = e.ty;
    if (!g) return;
    const kill = (sp) => {
      if (!sp || sp.dead) return;
      sp.setRotation(0).setAlpha(1).setFlipX(false).setFlipY(false).clearTint();
      this.segPool.kill(sp);
    };
    for (const f of g.fish) if (!f.gone) kill(f.sp);
    kill(g.big?.sp);
    kill(g.heatSp);
    kill(g.shadow);
    e.ty = null;
  },

  /** Going down: what goes on for the end (Enemies.goDown -> taiyakiEnd): the mould, the great fish, the fish left. */
  taiyakiDown(e) {
    const s = this.scene;
    const g = e.ty;
    const copy = (o) => s.add.sprite(o.x, o.y, o.texture.key, o.frame.name).setDepth(o.depth).setScale(o.scaleX, o.scaleY).setRotation(o.rotation).setFlipX(o.flipX).setFlipY(o.flipY);
    const out = { extra: [], fish: [], big: null, stall: s.parallax.stripU(e.y) };
    if (!g) return out;
    const [kx, ky] = this.tyKata(g);
    out.kata = [kx, ky - s.parallax.screenY(STALL[1])]; // (its height over the stall, kept as the city moves on)
    if (g.big) out.big = { s: copy(g.big.sp), x: g.big.x, y: g.big.y, face: g.big.face };
    for (const f of g.fish) if (!f.gone && !f.home) out.fish.push({ s: copy(f.sp), x: f.x, y: f.y, vx: (Math.random() - 0.5) * 40, vy: -30 });
    return out;
  },

  /**
   * The end: the great fish breaks in half in a gust of steam, its two halves falling away; the fish left crumble;
   * the mould drops on to the stall with a clang. All of it on the map. Returns true when it is over.
   */
  taiyakiEnd(d, dt) {
    const s = this.scene;
    const td = d.ty;
    const b = d.body;
    const sy = s.parallax.screenY(STALL[1]);
    const t = d.t;
    // the mould: shaking while the blows land, then down on the stall
    const fall = Math.max(0, t - 0.9);
    const y = Math.min(sy - 8, sy + (td.kata?.[1] ?? -TAIYAKI.hover) + fall * fall * 200);
    const shake = t < 0.9 ? Math.round((Math.random() - 0.5) * 3) : 0;
    b.setPosition((td.kata?.[0] ?? 90) + KATA_OFF[0] + shake, y + KATA_OFF[1]);
    if (t < 0.9) b.setTint(Math.floor(t * 14) % 2 ? 0x707070 : 0x000000).setTintMode(Phaser.TintModes.ADD);
    else if (!td.landed && y >= sy - 8) {
      td.landed = true;
      b.clearTint();
      if (b.frame.name !== 'ty_kata_shut') b.setFrame('ty_kata_shut');
      s.cameras.main.shake(250, 0.008);
      s.fx.smoke(b.x - KATA_OFF[0], sy - 6, 6, 14);
      s.fx.text(90, sy - 30, 'GASHAN!', 0.9, 0xffffff);
      s.sfx.explode('m');
    } else if (t >= 0.9) b.clearTint();
    // the great fish, broken in half
    if (td.big) {
      const g0 = td.big;
      if (!td.split && t > 0.35) {
        td.split = true;
        g0.s.setVisible(false);
        const halves = [['ty_half_l', -1], ['ty_half_r', 1]].map(([fr, side]) => {
          const sp = s.add.sprite(g0.x + side * 18 * g0.face, g0.y, g0.s.texture.key, fr).setDepth(g0.s.depth).setScale(g0.s.scaleX, g0.s.scaleY).setFlipX(g0.face < 0);
          return { sp, vx: side * g0.face * 50, vy: -60, r: side * 1.6, u: s.parallax.stripU(g0.y) };
        });
        td.halves = halves;
        for (let i = 0; i < 16; i++) s.fx.puff(STEAM, g0.x + (Math.random() - 0.5) * 30, g0.y - Math.random() * 16, 1);
        for (let i = 0; i < 14; i++) s.fx.part(s.fx.parts, 'dot_1', g0.x, g0.y, { vx: (Math.random() - 0.5) * 140, vy: -40 - Math.random() * 80, g: 220, life: 0.7 }).setTint(0x4a1424);
        s.fx.flash(0.4, 0.3, 0xfff0c0);
        s.fx.text(g0.x, g0.y - 28, 'PAKKŪN!', 1, 0xffe080);
      } else if (!td.split) {
        g0.s.setPosition(g0.x + Math.round((Math.random() - 0.5) * 3), g0.y).setTint(Math.floor(t * 14) % 2 ? 0x707070 : 0x000000).setTintMode(Phaser.TintModes.ADD);
      }
      for (const hf of td.halves ?? []) {
        hf.vy += 260 * dt;
        hf.sp.x += hf.vx * dt;
        hf.sp.y += hf.vy * dt;
        hf.sp.rotation += hf.r * dt;
        hf.sp.setAlpha(Math.max(0, 1 - (t - 0.35) / 1.4));
      }
    }
    // the little ones left: down they go, in crumbs
    for (const f of td.fish) {
      if (f.done) continue;
      f.vy += 260 * dt;
      f.s.x += f.vx * dt;
      f.s.y += f.vy * dt;
      f.s.rotation += 4 * dt;
      if (f.s.y > sy) {
        f.done = true;
        s.fx.debris(f.s.x, f.s.y, 4, 0xd8902a, 0.8);
        f.s.destroy();
      }
    }
    if (t > 2.8) b.setAlpha(Math.max(0, 1 - (t - 2.8) / 0.6));
    if (t > 3.4) {
      for (const hf of td.halves ?? []) hf.sp.destroy();
      td.big?.s.destroy();
      for (const f of td.fish) if (!f.done) f.s.destroy();
      return true;
    }
    return false;
  },
};
