// Osaka: the manzai duos, the bunraku puppet (the miniboss) and the octopus (the boss).
// Methods of Enemies (src/game/Enemies.js mixes them in), so `this` is the enemies of the stage.
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { rules } from '../../difficulty.js';
import { slow, normal, DOWN, TAU, EXTRAS } from './shared.js';

// the bunraku puppet's three black-clad puppeteers
const KUROKO = { hp: 140, weight: 0, score: 2000, radius: 7, explosion: 'm' };

export const osaka = {
  // ---------------------------------------------------------------- Osaka: manzai duos
  /**
   * Every regular enemy in Osaka comes as a comedy pair (boke and tsukkomi). Shoot one and the other
   * flies into a rage and fires back at once; take both within 1.2 s for the "NANDE YANEN!" bonus.
   */
  duoDown(e) {
    const s = this.scene;
    const d = e.duo;
    const partner = d.members.find((m) => m !== e && !m.dead && m.duo === d && m.hp > 0);
    if (d.t < 0) {
      d.t = s.t;
      if (!partner) return;
      partner.rage = true;
      partner.recoil = 3.2;
      s.fx.text(partner.x, partner.y - 12, '!?', 0.7, 0xff7060);
      if (this.canFire(partner)) s.bullets.fan(partner.x, partner.y + 4, this.aimAt(partner, 0, 4), 3, 0.5, normal);
    } else if (s.t - d.t <= 1.2) {
      s.score.add(400 * s.score.mult);
      s.fx.text(e.x, e.y - 14, 'NANDE YANEN!', 1.0, 0xffe080);
    }
  },

  /** A faint line ties the two halves of each duo together. */
  drawDuos() {
    this.tele.lineStyle(1, 0xffe0a0, 0.25);
    for (const e of this.pool.live) {
      const d = e.duo;
      if (!d || e.dead || e.y < -6) continue;
      const o = d.members.find((m) => m !== e && !m.dead && m.duo === d);
      if (o && d.members.indexOf(e) < d.members.indexOf(o) && o.y > -6) this.tele.lineBetween(e.x, e.y, o.x, o.y);
    }
  },

  // ---------------------------------------------------------------- Osaka miniboss: the bunraku puppet
  /**
   * A samurai puppet worked by three black-clad puppeteers, as in Osaka's bunraku theatre. The puppet
   * itself can't be hurt (shots pass through it); each puppeteer drives one attack — the head and right
   * arm (the sword), the left arm (a sweeping stream), the legs (stamps and the dance). Shoot a
   * puppeteer and that part goes limp; with all three down the puppet collapses.
   */
  spawnKuroko(e, base) {
    Object.assign(e, { invuln: true, pass: true, kuroko: [] });
    for (const [role, dx, dy] of [['omo', -17, -18], ['hidari', 23, -2], ['ashi', -9, 27]]) {
      const k = this.pool.spawn('kuroko_0', e.x + dx, e.y + dy, { ...base, ...EXTRAS, type: 'kuroko', def: KUROKO, hp: KUROKO.hp, maxHp: KUROKO.hp, radius: KUROKO.radius, role, dx, dy, master: e, state: 'fight' });
      k.play('kuroko');
      k.setDepth(DEPTH.air - 0.05);
      e.kuroko.push(k);
    }
    e.hp = e.maxHp = KUROKO.hp * 3;
  },

  bunraku(e, dt, b) {
    const s = this.scene;
    const alive = e.kuroko.filter((k) => !k.dead && k.master === e && k.hp > 0);
    const has = (role) => alive.some((k) => k.role === role);
    e.hp = alive.reduce((sum, k) => sum + k.hp, 0);
    if (e.state === 'enter') {
      e.y += Math.max(6, (70 - e.y) * 0.8) * dt;
      if (e.y >= 69) Object.assign(e, { state: 'fight', fight: 0, tOmo: 1.2, tHidari: 2.2, tAshi: 1.6, stream: 0, streamT: 0 });
    } else if (e.state === 'leave') {
      e.vy = (e.vy ?? 0) - 40 * dt;
      e.y += e.vy * dt;
    } else {
      e.fight += dt;
      if (e.fight > 34) e.state = 'leave';
      // the foot puppeteer makes it dance; without him it just stands there
      if (has('ashi')) e.x += (90 + 36 * Math.sin(e.fight * 0.8) - e.x) * Math.min(1, dt * 2);
      e.setRotation((has('omo') ? 0 : 0.12) + (has('hidari') ? 0 : -0.1)); // limp parts tilt it
      if (this.canFire(e)) {
        if (has('omo') && (e.tOmo -= dt) <= 0) {
          // head and right arm: the sword comes down, a wide aimed fan
          e.setFrame('ningyo_1');
          s.time.delayedCall(350, () => !e.dead && e.setFrame('ningyo_0'));
          b.fan(e.x - 8, e.y - 4, this.aimAt(e, -8, -4), 7, 1.1, normal);
          e.tOmo = 1.5;
        }
        if (has('hidari') && e.stream <= 0 && (e.tHidari -= dt) <= 0) {
          e.stream = 14;
          e.streamT = 0;
        }
        if (e.stream > 0 && has('hidari') && (e.streamT -= dt) <= 0) {
          // left arm: an iron fan flicks a stream of shots across the stage
          b.fire(e.x + 14, e.y + 2, DOWN + (e.stream - 7) * 0.13, normal);
          e.streamT = 0.07;
          if (--e.stream <= 0) e.tHidari = 2.6;
        }
        if (has('ashi') && (e.tAshi -= dt) <= 0) {
          // the feet stamp: a ring from the floor of the stage
          b.ring(e.x, e.y + 22, 14, Math.random() * TAU, slow, true);
          s.cameras.main.shake(150, 0.003);
          e.tAshi = 2.4;
        }
      }
    }
    // the puppeteers keep to their posts, half-seen in the dark
    for (const k of alive) {
      k.x = e.x + k.dx + Math.sin(e.age * 2 + k.dx) * 1.5;
      k.y = e.y + k.dy;
      k.setAlpha(0.75 + 0.15 * Math.sin(e.age * 3 + k.dy));
      const ax = k.role === 'omo' ? e.x - 6 : k.role === 'hidari' ? e.x + 12 : e.x - 3;
      const ay = k.role === 'omo' ? e.y - 6 : k.role === 'hidari' ? e.y : e.y + 14;
      this.tele.lineStyle(1, 0xd8d0c0, 0.28);
      this.tele.lineBetween(k.x, k.y, ax, ay);
    }
    if (e.state !== 'enter' && !alive.length && !e.dead) this.destroy(e);
  },

  // ---------------------------------------------------------------- Osaka boss: the octopus
  /**
   * A giant octopus with a takoyaki vendor's headband rises from Osaka Bay. Four tentacles (chains of
   * segments that sway and curl) shoot rings from their tips, slam straight down after a warning, and
   * the head lobs takoyaki. Cut every tentacle and the head can be hit: ink spirals, ink blobs,
   * takoyaki barrages; below 35% it goes into a rage.
   */
  spawnTako(w, base) {
    const g = { kind: 'tako', state: 'enter', t: 0, phase: 0, step: 0, timer: 1.2, parts: [], enraged: false, defeated: false, awake: false, head: null, home: w.x, homeY: 62, slam: null };
    for (const [dx, dy, rest, phase] of [[-24, 14, 2.35, 0], [-9, 20, 1.95, 1.7], [9, 20, 1.19, 3.1], [24, 14, 0.79, 4.6]]) {
      const t = this.pool.spawn('ttip', w.x + dx, -60, { ...base, role: 'tentacle', group: g, dx, dy, rest, phase, hp: 187, maxHp: 187, radius: 3.5, pts: 3000, segs: [] });
      for (let i = 0; i < 8; i++) t.segs.push(this.segPool.spawn(`tseg_${i < 3 ? 0 : i < 6 ? 1 : 2}`, t.x, t.y, { r: i < 3 ? 5 : i < 6 ? 4 : 3 }));
      t.setDepth(DEPTH.air - 0.11);
      g.parts.push(t);
    }
    g.head = this.pool.spawn('tako_0', w.x, -60, { ...base, role: 'head', group: g, hp: 880, maxHp: 880, radius: 18, invuln: true });
    g.head.play('tako');
    g.head.setDepth(DEPTH.air - 0.1);
    g.parts.push(g.head);
    g.maxTotal = g.parts.reduce((sum, p) => sum + p.maxHp, 0);
    this.bossGroup = g;
    return g.head;
  },

  updateTako(g, dt) {
    const s = this.scene;
    const h = g.head;
    g.t += dt;
    if (g.state === 'enter') {
      h.y += Math.max(10, (g.homeY - h.y) * 1.2) * dt;
      if (h.y >= g.homeY - 1) Object.assign(g, { state: 'fight', awake: true, timer: 0.8 });
    } else {
      h.x = g.home + 16 * Math.sin(g.t * 0.5 * (g.enraged ? 1.5 : 1));
      h.y = g.homeY + 4 * Math.sin(g.t * 1.1);
    }
    const arms = g.parts.filter((p) => p.role === 'tentacle' && !p.dead && p.group === g);
    if (g.slam) this.slamStep(g, dt);
    for (const t of arms) this.layTentacle(g, t);
    if (g.state !== 'fight') return;
    if (!arms.length && h.invuln) {
      h.invuln = false;
      Object.assign(g, { phase: 0, step: 0, timer: 1.4, slam: null });
      s.bullets.cancelAll(s.fx);
      s.fx.flash(0.4, 0.3);
      s.hud.show('MACKI ODCIĘTE!', '', 2);
    }
    if (!h.invuln && !g.enraged && h.hp < h.maxHp * 0.35) {
      g.enraged = true;
      g.timer = 0.5;
      s.hud.show('', 'OŚMIORNICA WŚCIEKŁA!', 1.6, true);
    }
    g.timer -= dt * (g.enraged ? 1.2 : 1); // (its rage less frantic than the others': the screen fills fast)
    if (g.timer > 0) return;
    if (arms.length) this.takoArms(g, arms);
    else this.takoHead(g, h);
  },

  /** Chain a tentacle's segments out from the head: a resting angle, a sway, a curl towards the tip. */
  layTentacle(g, t) {
    const h = g.head;
    const k = g.slam?.arm === t ? g.slam.k : 0; // 0..1 straighten and stretch straight down
    const len = 8.5 + k * 4.5;
    const sway = Math.sin(g.t * 1.2 + t.phase);
    let x = h.x + t.dx;
    let y = h.y + t.dy;
    const n = t.segs.length;
    for (let i = 0; i <= n; i++) {
      const f = (i + 1) / (n + 1);
      let a = t.rest + sway * 0.45 * f + Math.sin(g.t * 2.3 + t.phase + i * 0.6) * 0.18 * f;
      if (t.recoil > 0) a += Math.sin(g.t * 28 - i * 0.9) * (t.recoil * 0.18) * f;
      a += (DOWN - a) * k;
      x += Math.cos(a) * len;
      y += Math.sin(a) * len;
      if (i < n) t.segs[i].setPosition(x, y);
    }
    t.setPosition(x, y);
  },

  takoArms(g, arms) {
    const s = this.scene;
    const b = s.bullets;
    const pl = s.player;
    const h = g.head;
    const next = () => {
      g.phase++;
      g.step = 0;
      g.timer = 1;
    };
    switch (g.phase % 3) {
      case 0: {
        // the tips spit small rings, one arm after another
        const t = arms[g.step % arms.length];
        if (this.canFire(t)) b.ring(t.x, t.y, 7, g.step * 0.4, slow);
        g.timer = 0.6;
        if (++g.step >= arms.length * 2) next();
        break;
      }
      case 1:
        // slams run in slamStep; three in a row
        if (!g.slam) {
          if (g.step >= 3) next();
          else g.slam = { arm: arms[Math.floor(Math.random() * arms.length)], t: 0, k: 0, burst: false };
        }
        g.timer = 0.1;
        break;
      default:
        // takoyaki thrown where the player is
        b.lob(h.x - 12 + Math.random() * 24, h.y + 10, Phaser.Math.Clamp(pl.x + (Math.random() - 0.5) * 40, 10, VIEW.width - 10), pl.y, 1.15, 'takoyaki');
        g.timer = 0.55;
        if (++g.step >= 5) next();
    }
  },

  /** A slam: the arm rears and blinks (a line shows where), whips straight down, bursts, pulls back. */
  slamStep(g, dt) {
    const s = this.scene;
    const sl = g.slam;
    if (sl.arm.dead) {
      g.slam = null;
      g.step++;
      return;
    }
    sl.t += dt;
    const h = g.head;
    const bx = h.x + sl.arm.dx;
    if (sl.t < 0.7) {
      sl.k = 0;
      sl.arm.flash = Math.floor(sl.t * 20) % 2 ? 0.02 : 0;
      if (Math.floor(sl.t * 14) % 2) {
        this.tele.lineStyle(2, 0xff7050, 0.55);
        this.tele.lineBetween(bx, h.y + sl.arm.dy, bx, h.y + sl.arm.dy + 120);
      }
    } else if (sl.t < 0.95) sl.k = (sl.t - 0.7) / 0.25;
    else if (sl.t < 1.45) {
      sl.k = 1;
      if (!sl.burst) {
        sl.burst = true;
        s.bullets.ring(sl.arm.x, sl.arm.y, 8, Math.random() * TAU, slow);
        s.cameras.main.shake(200, 0.004);
      }
    } else if (sl.t < 1.85) sl.k = 1 - (sl.t - 1.45) / 0.4;
    else {
      g.slam = null;
      g.step++;
    }
  },

  takoHead(g, h) {
    const b = this.scene.bullets;
    const pl = this.scene.player;
    if (!this.canFire(h)) {
      g.timer = 0.2;
      return;
    }
    const next = () => {
      g.phase++;
      g.step = 0;
      g.timer = 1;
    };
    switch (g.phase % 3) {
      case 0: {
        // ink spiral from the siphon: three arms in a rage, but sparser, so no more ink at once
        const n = g.enraged ? 3 : 2;
        const a = g.step * (g.enraged ? 0.5 : 0.4);
        for (let k = 0; k < n; k++) b.shot('eb_ink', h.x, h.y + 16, a + (k * TAU) / n, slow, 2);
        g.timer = g.enraged ? 0.3 : 0.14;
        if (++g.step >= (g.enraged ? 18 : 26)) next();
        break;
      }
      case 1: {
        // big ink blobs at the player, then a ring, by turns (never both at once)
        if (g.step % 2 === 0) {
          const a = this.aimAt(h, 0, 16);
          for (let i = 0; i < 3; i++) b.shot('eb_ink_m', h.x, h.y + 16, a + (i - 1) * 0.42, normal, 3);
        } else b.ring(h.x, h.y + 16, 10, g.step * 0.3, slow);
        g.timer = 0.85;
        if (++g.step >= 4) next();
        break;
      }
      default: {
        // a takoyaki barrage: one lands where the player is, the others well to the side (room to step between),
        // a volley a second so the last one's pellets have spread out before the next lands, smaller bursts
        const side = g.step % 2 ? 1 : -1;
        const spots = g.enraged ? [0, side * 52, -side * 52] : [0, side * 52];
        const burst = Math.max(2, rules().lobBurst - 1);
        spots.forEach((dx, i) => b.lob(h.x - 16 + i * 16, h.y + 10, Phaser.Math.Clamp(pl.x + dx, 10, VIEW.width - 10), pl.y, 1.15, 'takoyaki', burst));
        g.timer = 1;
        if (++g.step >= 4) next();
      }
    }
  },

  /** A tentacle is cut off: a chain of explosions runs along it. */
  tentacleDown(e) {
    const s = this.scene;
    const pts = e.pts * s.score.mult;
    s.score.add(pts);
    s.fx.text(e.x, e.y - 10, `${pts}`, 1.2, 0xffe080);
    s.fx.explode(e.x, e.y, 'm');
    const segs = e.segs;
    segs.forEach((sg, i) =>
      s.time.delayedCall((segs.length - i) * 60, () => {
        s.fx.explode(sg.x, sg.y, 's');
        this.segPool.kill(sg);
      }),
    );
    e.segs = null;
    this.remove(e);
  },
};
