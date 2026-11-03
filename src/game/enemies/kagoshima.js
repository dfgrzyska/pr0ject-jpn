// Kagoshima: the matchlock sniper, the kappa, the vinegar jar, Raijū (the miniboss) and Sakurajima (the boss).
// Methods of Enemies (src/game/Enemies.js mixes them in), so `this` is the enemies of the stage.
import Phaser from 'phaser';
import { DEPTH, FAIR, VIEW } from '../../config.js';
import { slow, normal, DOWN, TAU } from './shared.js';

export const kagoshima = {
  /** Tanegashima matchlock: a red aim line follows the player, locks and blinks, then one fast shot along it. */
  snipe(e, dt, b) {
    if (!this.canFire(e)) {
      e.aimT = 0;
      return;
    }
    e.aimT += dt;
    if (e.aimT < 0) return; // reloading
    const ox = e.x;
    const oy = e.y + 9;
    const locked = e.aimT >= 0.9;
    if (!locked) e.aimA = this.aimAt(e, 0, 9);
    if (!locked || Math.floor(e.aimT * 16) % 2) {
      this.tele.lineStyle(1, 0xff3a2a, locked ? 0.95 : 0.45);
      this.tele.lineBetween(ox, oy, ox + Math.cos(e.aimA) * 420, oy + Math.sin(e.aimA) * 420);
    }
    if (e.aimT < 1.25) return;
    b.shot('eb_s', ox, oy, e.aimA, 150, 1.8);
    this.scene.fx.spark(ox, oy + 2);
    e.aimT = -0.5;
    if (--e.shots <= 0) {
      e.state = 'leave';
      e.timer = 0.5;
      e.vy = 0;
    }
  },

  /**
   * Kappa (garappa): only ripples on the water or ash while it lurks (shots pass through), edging
   * towards the player; then it surfaces with a splash, blinks, and leaps at the player.
   */
  kappa(e, dt) {
    const s = this.scene;
    const scroll = s.parallax.time < s.parallax.maxTime ? s.parallax.speed.mid : 0;
    if (e.state === 'lurk') {
      e.y += scroll * dt;
      e.x += Phaser.Math.Clamp(s.player.x - e.x, -22 * dt, 22 * dt);
      if ((e.timer -= dt) <= 0) {
        e.state = 'surface';
        e.timer = 0.45;
        e.ghost = false;
        e.play(e.look.anim);
        s.fx.puff('splash', e.x, e.y, 0.3);
      }
    } else if (e.state === 'surface') {
      e.y += scroll * dt;
      e.flash = Math.floor(e.timer * 20) % 2 ? 0.02 : 0;
      if ((e.timer -= dt) <= 0) {
        e.state = 'leap';
        e.ang = this.aimAt(e);
        e.v = 60;
      }
    } else {
      e.v = Math.min(220, e.v + 260 * dt);
      e.x += Math.cos(e.ang) * e.v * dt;
      e.y += Math.sin(e.ang) * e.v * dt;
    }
  },

  /** Black-vinegar jar: armoured with the lid on; the lid rattles, lifts (eyes glow inside), it fires, and shuts. */
  jar(e, dt, b) {
    const lid = this.skin.turret.head;
    const p = this.scene.player;
    let ox = 0;
    e.timer -= dt;
    if (e.lid === 'shut') {
      if (e.timer <= 0 && this.canFire(e)) {
        e.lid = 'rattle';
        e.timer = 0.5;
      }
    } else if (e.lid === 'rattle') {
      ox = Math.floor(e.timer * 30) % 2 ? 1 : -1;
      if (e.timer <= 0) Object.assign(e, { lid: 'open', timer: 1.3, invuln: false, fired: false });
    } else {
      if (!e.fired && e.timer < 1.0 && this.canFire(e)) {
        e.fired = true;
        if (e.pattern === 'ring') b.ring(e.x, e.y, 12, Math.random() * TAU, slow);
        else b.fan(e.x, e.y, Math.atan2(p.y - e.y, p.x - e.x), 5, 0.8, slow);
      }
      if (e.timer <= 0) Object.assign(e, { lid: 'shut', timer: 1.6, invuln: true });
    }
    e.head.setFrame(`${lid}${e.lid === 'open' ? 1 : 0}`).setPosition(e.x + ox, e.y - 1);
  },

  /**
   * Raijū, the thunder beast of the ash storm: lightning columns (a blinking line first), pairs of orbs
   * joined by a live arc, and a charge along a shown line that leaves a trail of sparks.
   */
  raiju(e, dt, b) {
    const s = this.scene;
    if (e.state === 'enter') {
      e.y += Math.max(6, (64 - e.y) * 0.8) * dt;
      if (e.y >= 63) Object.assign(e, { state: 'fight', fight: 0, timer: 0.8, patternIndex: 0, step: 0, dash: null });
      return;
    }
    if (e.state === 'leave') {
      e.vy = (e.vy ?? 0) - 40 * dt;
      e.y += e.vy * dt;
      return;
    }
    e.fight += dt;
    if (e.dash) return this.raijuDash(e, dt, b);
    if (e.fight > 34) {
      e.state = 'leave';
      return;
    }
    e.x += (90 + 40 * Math.sin(e.fight * 0.7) - e.x) * Math.min(1, dt * 2);
    e.y += (64 + 6 * Math.sin(e.fight * 1.7) - e.y) * Math.min(1, dt * 3);
    e.timer -= dt;
    if (e.timer > 0 || !this.canFire(e)) return;
    const pl = s.player;
    switch (e.patternIndex % 3) {
      case 0: {
        // lightning: one column on the player, one or two elsewhere
        const xs = [pl.x, 14 + Math.random() * 152];
        if (e.step % 2) xs.push(14 + Math.random() * 152);
        let warn = 0;
        for (const x of xs) warn = b.beam(Phaser.Math.Clamp(x, 6, VIEW.width - 6), { warn: 0.75, live: 0.22, w: 5 });
        s.time.delayedCall(warn * 1000, () => s.fx.flash(0.12, 0.12));
        e.timer = 0.85;
        if (++e.step >= 5) this.nextPattern(e);
        break;
      }
      case 1: {
        // orbs joined by an arc, drifting at the player and turning
        const a = this.aimAt(e, 0, 10);
        b.pair(e.x, e.y + 10, Math.cos(a) * 30, Math.sin(a) * 30 + 10, 14, e.step % 2 ? 1.9 : -1.9);
        b.fan(e.x, e.y + 10, a, 3, 0.6, slow);
        e.timer = 1.1;
        if (++e.step >= 4) this.nextPattern(e);
        break;
      }
      default:
        // charge: the line shows where, then it dashes there and back
        e.dash = { t: 0, x0: e.x, y0: e.y, tx: Phaser.Math.Clamp(pl.x, 16, VIEW.width - 16), ty: Math.min(pl.y, s.H * 0.68), back: false, spark: 0 };
        e.timer = 0.6;
        if (++e.step >= 2) this.nextPattern(e);
    }
  },

  raijuDash(e, dt, b) {
    const d = e.dash;
    d.t += dt;
    if (d.t < 0.8) {
      if (Math.floor(d.t * 14) % 2) {
        this.tele.lineStyle(2, 0x9ad8ff, 0.7);
        this.tele.lineBetween(e.x, e.y, d.tx, d.ty);
      }
      e.flash = Math.floor(d.t * 20) % 2 ? 0.02 : 0;
      return;
    }
    const tx = d.back ? d.x0 : d.tx;
    const ty = d.back ? d.y0 : d.ty;
    const dx = tx - e.x;
    const dy = ty - e.y;
    const dist = Math.hypot(dx, dy);
    const step = (d.back ? 140 : 300) * dt;
    if (!d.back && (d.spark -= dt) <= 0 && e.y < this.scene.H * FAIR.noFireBelow) {
      d.spark = 0.05;
      b.fire(e.x, e.y, Math.atan2(dy, dx) + (Math.random() < 0.5 ? 1.6 : -1.6), slow * 0.6);
    }
    if (dist <= step) {
      e.x = tx;
      e.y = ty;
      if (d.back) e.dash = null;
      else d.back = true;
    } else {
      e.x += (dx / dist) * step;
      e.y += (dy / dist) * step;
    }
  },

  // ---------------------------------------------------------------- boss: Sakurajima
  /**
   * The volcano is the summit itself and never moves (all parts are ground targets). Two side vents
   * first: lava bombs thrown in arcs, steam columns, ember sprays. With both vents gone the crater opens:
   * eruption rings, rivers of lava rolling down with one gap, volcanic lightning. Below 30% it erupts.
   * Positions come from the boss wave (the background generator reads the same numbers).
   */
  spawnVolcano(w, base) {
    const s = this.scene;
    const g = { kind: 'volcano', state: 'dormant', t: 0, phase: 0, step: 0, timer: 1, parts: [], enraged: false, defeated: false, awake: false, stage: 1, crater: null };
    const part = (frame, role, [x, u], hp, radius, pts) => {
      const wreck = role === 'vent' ? 'vent_dead' : 'crater_cold';
      const e = this.pool.spawn(frame, x, s.parallax.screenY(u), { ...base, role, u, hp, maxHp: hp, radius, pts, group: g, invuln: true, ground: true, wreck });
      e.setDepth(DEPTH.ground + 0.3);
      g.parts.push(e);
      return e;
    };
    for (const v of w.vents) part('vent_0', 'vent', v, 286, 9, 5000).play('vent');
    g.crater = part('crater_shut', 'crater', w.crater, 990, 15, 0);
    g.maxTotal = g.parts.reduce((sum, p) => sum + p.maxHp, 0);
    this.bossGroup = g;
    return g.crater;
  },

  updateVolcano(g, dt) {
    const s = this.scene;
    const alive = g.parts.filter((p) => !p.dead && p.group === g && p.hp > 0);
    for (const p of alive) p.y = s.parallax.screenY(p.u);
    if (g.state === 'dormant') {
      if (s.parallax.time >= s.parallax.maxTime - 1e-3) {
        g.state = 'wake';
        g.t = 0;
        s.cameras.main.shake(1500, 0.006);
      }
      return;
    }
    g.t += dt;
    if (g.state === 'wake') {
      if (Math.random() < dt * 12) s.fx.spark(g.crater.x + (Math.random() - 0.5) * 40, g.crater.y + (Math.random() - 0.5) * 24);
      if (g.t >= 1.6) {
        Object.assign(g, { state: 'fight', awake: true, t: 0, timer: 0.6 });
        for (const p of alive) if (p.role === 'vent') p.invuln = false;
      }
      return;
    }
    const c = g.crater;
    if (g.stage === 2 && !g.enraged && c.hp < c.maxHp * 0.3) {
      g.enraged = true;
      g.timer = 0.6;
      s.hud.show('', 'SAKURAJIMA WYBUCHA!', 1.6, true);
      s.cameras.main.shake(800, 0.006);
    }
    g.timer -= dt * (g.enraged ? 1.4 : 1);
    if (g.timer > 0) return;
    if (g.stage === 1) this.volcanoVents(g, alive.filter((p) => p.role === 'vent'));
    else this.volcanoCrater(g, c);
  },

  volcanoVents(g, vents) {
    const s = this.scene;
    const b = s.bullets;
    const pl = s.player;
    const next = () => {
      g.phase++;
      g.step = 0;
      g.timer = 1;
    };
    switch (g.phase % 3) {
      case 0:
        // lava bombs thrown in an arc where the player is, and beside
        for (const v of vents) if (this.canFire(v)) b.lob(v.x, v.y - 4, Phaser.Math.Clamp(pl.x + (Math.random() - 0.5) * 50, 10, VIEW.width - 10), pl.y + (Math.random() - 0.5) * 20, 1.2, 'lava');
        g.timer = 0.75;
        if (++g.step >= 5) next();
        break;
      case 1: {
        // steam columns down the slope, the vents taking turns, plus a fan of embers
        const v = vents[g.step % vents.length];
        if (v && this.canFire(v)) {
          b.beam(v.x, { warn: 0.8, live: 0.5, w: 12, kind: 'steam', y0: v.y + 8 });
          b.fan(v.x, v.y + 6, this.aimAt(v, 0, 6), 5, 0.9, slow);
        }
        g.timer = 1.0;
        if (++g.step >= 4) next();
        break;
      }
      default:
        // ember sprays sweeping back and forth
        for (const v of vents) if (this.canFire(v)) b.shot('eb_lava', v.x, v.y + 6, DOWN + Math.sin(g.step * 0.3 + (v.x < 90 ? 0 : Math.PI)) * 1.1, normal, 1.8);
        g.timer = 0.08;
        if (++g.step >= 36) next();
    }
  },

  volcanoCrater(g, c) {
    const s = this.scene;
    const b = s.bullets;
    const pl = s.player;
    if (!this.canFire(c)) {
      g.timer = 0.2;
      return;
    }
    const next = () => {
      g.phase++;
      g.step = 0;
      g.timer = 1;
    };
    switch (g.phase % 3) {
      case 0:
        // eruption rings
        if (g.step === 0) s.cameras.main.shake(400, 0.004);
        b.ring(c.x, c.y + 4, g.enraged ? 22 : 18, g.step * 0.19, g.step % 2 ? normal : slow, g.step % 2 === 0);
        g.timer = 0.5;
        if (++g.step >= 4) next();
        break;
      case 1: {
        // rivers of lava: rows rolling down with one gap, the gap moving each time
        g.gap = g.step === 0 ? 30 + Math.random() * 120 : Phaser.Math.Clamp(g.gap + (Math.random() < 0.5 ? -1 : 1) * (26 + Math.random() * 20), 22, VIEW.width - 22);
        const gw = g.enraged ? 30 : 36;
        for (let x = 4; x < VIEW.width; x += 9) if (Math.abs(x - g.gap) > gw / 2) b.shot('eb_lava', x, c.y + 18, DOWN, 40, 1.8);
        g.timer = 1.0;
        if (++g.step >= 4) next();
        break;
      }
      default: {
        // volcanic lightning in the ash cloud and a fan of glowing rocks
        const xs = [pl.x, 14 + Math.random() * 152, 14 + Math.random() * 152].slice(0, g.enraged ? 3 : 2);
        let warn = 0;
        for (const x of xs) warn = b.beam(Phaser.Math.Clamp(x, 6, VIEW.width - 6), { warn: 0.75, live: 0.22, w: 5, y0: c.y + 14 });
        s.time.delayedCall(warn * 1000, () => s.fx.flash(0.12, 0.12));
        b.fan(c.x, c.y + 10, this.aimAt(c, 0, 10), g.enraged ? 7 : 5, 0.9, slow, true);
        g.timer = 0.95;
        if (++g.step >= 4) next();
      }
    }
  },

  /** A side vent is plugged; with both gone the crater bursts open. */
  ventDown(e) {
    const s = this.scene;
    const g = e.group;
    const pts = e.pts * s.score.mult;
    s.score.add(pts);
    s.fx.explode(e.x, e.y, 'm', e.u);
    s.fx.text(e.x, e.y - 12, `${pts}`, 1.2, 0xffe080);
    this.wrecks.spawn('vent_dead', e.x, e.y, { u: e.u });
    this.remove(e);
    if (g.parts.some((p) => p.role === 'vent' && !p.dead && p.group === g)) return;
    Object.assign(g, { stage: 2, phase: 0, step: 0, timer: 1.4 });
    g.crater.invuln = false;
    g.crater.play('crater');
    s.bullets.cancelAll(s.fx);
    s.fx.flash(0.5, 0.4);
    s.cameras.main.shake(700, 0.006);
    s.hud.show('KRATER SIĘ OTWIERA!', '', 2);
  },
};
