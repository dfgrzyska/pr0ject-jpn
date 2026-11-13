// Osaka: the manzai duos, the bunraku puppet (the miniboss) and the octopus (the boss).
// Methods of Enemies (src/game/Enemies.js mixes them in), so `this` is the enemies of the stage.
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { rules } from '../../difficulty.js';
import { slow, normal, DOWN, TAU, EXTRAS } from './shared.js';
import { baseScale, enemyTexture, hasEnemyFrame } from '../enemyArt.js';

// the bunraku puppet's three black-clad puppeteers
const KUROKO = { hp: 220, weight: 0, score: 2000, radius: 7, explosion: 'm' };
// The octopus: eight arms [dx, dy, resting angle, sway phase, front row, angle once forward], their HP, the
// head's; `take`: how much of a hit the head takes in phases 1 and 2 (the arms guard it); below `rage` of
// its life the head breaks into phase 3 even with arms left
const TAKO = {
  arms: [
    [-26, 18, 2.35, 0, true], [-9, 22, 1.95, 1.7, true], [9, 22, 1.19, 3.1, true], [26, 18, 0.79, 4.6, true],
    [-38, 4, 2.95, 0.8, false, 2.2], [-32, 12, 2.6, 2.4, false, 1.85], [32, 12, 0.54, 3.9, false, 1.29], [38, 4, 0.19, 5.4, false, 0.94],
  ],
  armHp: 140,
  headHp: 980,
  take: [0.2, 0.75],
  rage: 0.4,
  // the mooring piles: a slam aimed at a player who stands by one (within `lure` px) goes into the pile and sticks
  // there for `pin` s, taking 2.5 x every hit (Enemies.damage); cut while stuck, it bares the head for `open` s (`openTake`)
  piles: [42, 90, 138],
  lure: 24,
  pin: 4,
  open: 4.5,
  openTake: 1.2,
};

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
   * puppeteer and that part goes limp; with all three down the puppet collapses. The ones left work it
   * faster (a third faster with two of them), and the last one alone works the whole puppet: the final
   * sword dance, every attack at once.
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
    // the last puppeteer works the whole puppet
    const has = (role) => (alive.length === 1 && e.state === 'fight') || alive.some((k) => k.role === role);
    e.hp = alive.reduce((sum, k) => sum + k.hp, 0);
    if (e.state === 'fight' && alive.length && alive.length < 3 && (e.stage ?? 1) < 4 - alive.length) {
      this.phaseBreak(e, e.x, e.y, 4 - alive.length, alive.length === 1 ? 'TANIEC MIECZA' : 'SZALONE TEMPO');
    }
    const sp = alive.length < 3 ? 1.35 : 1; // fewer hands, faster
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
        if (has('omo') && (e.tOmo -= dt * sp) <= 0) {
          // head and right arm: the sword comes down, a wide aimed fan
          e.setFrame('ningyo_1');
          s.time.delayedCall(350, () => !e.dead && e.setFrame('ningyo_0'));
          b.fan(e.x - 8, e.y - 4, this.aimAt(e, -8, -4), 7, 1.1, normal);
          e.tOmo = 1.5;
        }
        if (has('hidari') && e.stream <= 0 && (e.tHidari -= dt * sp) <= 0) {
          e.stream = 14;
          e.streamT = 0;
        }
        if (e.stream > 0 && has('hidari') && (e.streamT -= dt) <= 0) {
          // left arm: an iron fan flicks a stream of shots across the stage
          b.fire(e.x + 14, e.y + 2, DOWN + (e.stream - 7) * 0.13, normal);
          e.streamT = 0.07;
          if (--e.stream <= 0) e.tHidari = 2.6;
        }
        if (has('ashi') && (e.tAshi -= dt * sp) <= 0) {
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
   * A giant octopus with a takoyaki vendor's headband rises from Osaka Bay, eight tentacles (chains of
   * segments that sway and curl) round its mantle in two rows. Three phases (TAKO):
   * 1. the full fan: the four front arms fight (rings from the tips, slams straight down after a warning,
   *    takoyaki from the head), the four side arms are held back behind the body, guarding it: only now and
   *    then they spit a ring, they can't be cut yet, and the guarded head takes a fifth of any hit;
   * 2. the four front arms cut, the side arms swing forward: slams two at a time crossing over (X), takoyaki
   *    volleys; the head takes most of a hit now;
   * 3. every arm cut (or the head hurt below `rage`): ink clouds, jet dashes across the bay, ink spirals and
   *    takoyaki barrages from the bare head.
   */
  spawnTako(w, base) {
    const g = { kind: 'tako', state: 'enter', t: 0, phase: 0, step: 0, timer: 1.2, parts: [], enraged: false, defeated: false, awake: false, head: null, home: w.x, homeY: 62, slams: [], stage: 1, take: { head: TAKO.take[0] }, dash: null };
    // [dx, dy, resting angle, sway phase, front row?]; the side arms swing to `fwd` once they come forward
    for (const [dx, dy, rest, phase, front, fwd] of TAKO.arms) {
      const t = this.pool.spawn('ttip', w.x + dx, -60, { ...base, role: 'tentacle', group: g, dx, dy, rest, rest0: rest, fwd, phase, front, hp: TAKO.armHp, maxHp: TAKO.armHp, radius: 3.5, pts: 3000, segs: [], invuln: !front });
      for (let i = 0; i < 8; i++) t.segs.push(this.segPool.spawn(`tseg_${i < 3 ? 0 : i < 6 ? 1 : 2}`, t.x, t.y, { r: i < 3 ? 5 : i < 6 ? 4 : 3 }));
      t.setDepth(DEPTH.air - (front ? 0.11 : 0.115));
      if (!front) for (const sg of t.segs) sg.setDepth(DEPTH.air - 0.125);
      g.parts.push(t);
    }
    g.head = this.pool.spawn('tako_0', w.x, -60, { ...base, role: 'head', group: g, hp: TAKO.headHp, maxHp: TAKO.headHp, radius: 18 });
    g.head.play('tako');
    g.head.setDepth(DEPTH.air - 0.1);
    g.parts.push(g.head);
    g.maxTotal = g.parts.reduce((sum, p) => sum + p.maxHp, 0);
    this.bossGroup = g;
    return g.head;
  },

  /** Its eyes follow the player and blink now and then (only to look at). */
  takoEyes(g, h) {
    if (!hasEnemyFrame('tako_eyes_0')) return;
    if (!h.fxLayer) h.fxLayer = this.segPool.spawn('tako_eyes_1', h.x, h.y).setDepth(h.depth + 0.01);
    const dx = this.scene.player.x - h.x;
    const blink = g.t % 3.3 < 0.13 || (g.t % 7.9 > 4 && g.t % 7.9 < 4.12);
    h.fxLayer.setFrame(`tako_eyes_${blink ? 3 : dx < -28 ? 0 : dx > 28 ? 2 : 1}`)
      .setPosition(h.x, h.y).setScale(h.scaleX, h.scaleY).setVisible(h.visible).setAlpha(h.alpha);
    // (it lights up with the head when hit)
    if (h.isTinted) h.fxLayer.setTint(h.tintTopLeft).setTintMode(h.tintMode);
    else h.fxLayer.clearTint();
  },

  updateTako(g, dt) {
    const s = this.scene;
    const h = g.head;
    g.t += dt;
    if (g.state === 'enter') {
      h.y += Math.max(10, (g.homeY - h.y) * 1.2) * dt;
      if (h.y >= g.homeY - 1) Object.assign(g, { state: 'fight', awake: true, timer: 0.8 });
    } else if (g.dash) this.takoDash(g, h, dt);
    else {
      h.x = g.home + 16 * Math.sin(g.t * 0.5 * (g.enraged ? 1.5 : 1));
      h.y = g.homeY + 4 * Math.sin(g.t * 1.1);
    }
    this.takoEyes(g, h);
    const arms = g.parts.filter((p) => p.role === 'tentacle' && !p.dead && p.group === g);
    this.takoPiles(g, dt);
    if (g.slams.length) this.slamStep(g, dt);
    for (const t of arms) {
      // side arms swing forward in phase 2
      if (g.stage >= 2 && !t.front) t.rest += (t.fwd - t.rest) * Math.min(1, dt * 2);
      this.layTentacle(g, t);
      if (!t.front) t.setAlpha(t.invuln ? 0.8 : 1);
    }
    if (g.state !== 'fight') return;
    // phase 3: the ink hangs in clouds over the water round it
    if (g.stage >= 3 && Math.random() < dt * 4) s.fx.smoke(h.x + (Math.random() - 0.5) * 70, h.y + 16 + Math.random() * 50, 2, 7);
    if (g.stage === 1 && !arms.some((t) => t.front)) {
      // the front row cut: the side arms come forward and can be cut, the head is open to most of a hit
      for (const t of arms) t.invuln = false;
      Object.assign(g, { phase: 0, step: 0, slams: [] });
      g.take.head = TAKO.take[1];
      this.phaseBreak(g, h.x, h.y, 2, 'KONTRATAK Z GŁĘBIN');
    } else if (g.stage === 2 && (!arms.length || h.hp < h.maxHp * TAKO.rage)) {
      // all arms gone (what is left is torn off): the bare head, in a rage
      for (const t of arms) this.tentacleDown(t);
      Object.assign(g, { phase: 0, step: 0, slams: [], enraged: true });
      g.take.head = 1;
      this.phaseBreak(g, h.x, h.y, 3, 'ZASŁONA Z ATRAMENTU');
      s.fx.text(h.x, h.y + 30, 'MACKI ODCIĘTE!', 1.6, 0xffe080);
    }
    g.timer -= dt * (g.enraged ? 1.2 : 1); // (its rage less frantic than the others': the screen fills fast)
    if (g.timer > 0 || g.dash) return;
    const live = arms.filter((t) => !t.dead);
    if (g.stage < 3 && live.length) this.takoArms(g, live);
    else this.takoHead(g, h);
  },

  /** Chain a tentacle's segments out from the head: a resting angle, a sway, a curl towards the tip. */
  layTentacle(g, t) {
    const h = g.head;
    const sl = g.slams.find((q) => q.arm === t);
    const k = sl ? sl.k : 0; // 0..1 straighten and stretch along the slam
    const len = 8.5 + k * 4.5;
    const aim = sl?.to ? Math.atan2(sl.to.y - h.y - t.dy, sl.to.x - h.x - t.dx) : sl ? sl.dir : DOWN;
    const sway = Math.sin(g.t * 1.2 + t.phase);
    let x = h.x + t.dx;
    let y = h.y + t.dy;
    const n = t.segs.length;
    for (let i = 0; i <= n; i++) {
      const f = (i + 1) / (n + 1);
      let a = t.rest + sway * 0.45 * f + Math.sin(g.t * 2.3 + t.phase + i * 0.6) * 0.18 * f;
      if (t.recoil > 0) a += Math.sin(g.t * 28 - i * 0.9) * (t.recoil * 0.18) * f;
      a += (aim - a) * k;
      x += Math.cos(a) * len;
      y += Math.sin(a) * len;
      if (sl?.to) {
        // an aimed slam reaches its mark exactly (the arm stretching or bunching up along the way)
        const f2 = (i + 1) / (n + 1);
        x += (h.x + t.dx + (sl.to.x - h.x - t.dx) * f2 - x) * k;
        y += (h.y + t.dy + (sl.to.y - h.y - t.dy) * f2 - y) * k;
      }
      if (i < n) t.segs[i].setPosition(x, y);
    }
    t.setPosition(x, y);
  },

  /** The mooring piles in the bay (phases 1 and 2): drawn, the head's guard lowered while it is bared. */
  takoPiles(g, dt) {
    const s = this.scene;
    g.open = Math.max(0, (g.open ?? 0) - dt);
    if (g.stage < 3) g.take.head = g.open > 0 ? TAKO.openTake : TAKO.take[g.stage - 1];
    const on = g.stage < 3 && g.state === 'fight';
    if (on) this.encounterHint(g, 'PALE W ZATOCE', 'STAŃ PRZY PALU, MACKA UTKNIE');
    const y = Math.round(Math.min(178, s.H * 0.52));
    g.piles = on ? TAKO.piles.map((x) => ({ x, y })) : null;
    if (!g.pileArt && hasEnemyFrame('tako_pile')) {
      g.pileArt = TAKO.piles.map(() => {
        const key = enemyTexture('tako_pile');
        return s.add.image(0, 0, key, 'tako_pile').setScale(baseScale(key)).setDepth(DEPTH.ground + 0.6).setVisible(false);
      });
    }
    TAKO.piles.forEach((x, i) => {
      const art = g.pileArt?.[i];
      const shown = g.state !== 'enter' && g.stage < 3 && !g.defeated;
      if (art) art.setVisible(shown).setPosition(x, y + Math.sin(g.t * 1.6 + i) * 0.6);
      else if (shown) this.tele.fillStyle(0x6a4a2a, 1).fillCircle(x, y, 6);
      if (shown && !g.slams.some((sl) => sl.pinned)) this.tele.lineStyle(1, 0xffd06a, 0.25 + 0.15 * Math.sin(g.t * 4 + i)).strokeCircle(x, y, TAKO.lure - 4);
    });
    for (const sl of g.slams) if (sl.pinned) this.tele.lineStyle(2, 0x81f3cc, 0.9).strokeCircle(sl.to.x, sl.to.y, 11 + Math.sin(g.t * 10));
    if (g.open > 0 && g.head) this.tele.lineStyle(2, 0x81f3cc, 0.9).strokeCircle(g.head.x, g.head.y, 24);
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
    const fighting = arms.filter((t) => !t.invuln); // (the guarding side arms only spit a ring now and then)
    switch (g.phase % 3) {
      case 0: {
        // the tips spit small rings, one arm after another
        const t = g.stage === 1 && g.step % 3 === 2 ? arms.find((q) => q.invuln) ?? fighting[0] : fighting[g.step % fighting.length];
        if (t && this.canFire(t)) b.ring(t.x, t.y, 7, g.step * 0.4, slow);
        g.timer = 0.6;
        if (++g.step >= fighting.length * 2) next();
        break;
      }
      case 1:
        // slams run in slamStep: three in a row; in phase 2 two arms at once, crossing over
        if (!g.slams.length) {
          if (g.step >= 3) next();
          else if (g.stage >= 2 && fighting.length >= 2) {
            const left = fighting.filter((t) => t.dx < 0);
            const right = fighting.filter((t) => t.dx > 0);
            const a = (left.length ? left : fighting)[Math.floor(Math.random() * (left.length || fighting.length))];
            const c = (right.length ? right : fighting.filter((t) => t !== a))[0];
            // one of the two goes for the player (and so for a pile, if they stand by one), the other crosses over
            for (const [arm, sx] of [[a, 1], [c, -1]]) if (arm) g.slams.push({ arm, t: 0, k: 0, burst: false, dir: DOWN - sx * 0.5, aimed: arm === a });
          } else if (fighting.length) g.slams.push({ arm: fighting[Math.floor(Math.random() * fighting.length)], t: 0, k: 0, burst: false, dir: DOWN, aimed: true });
          else g.step++;
        }
        g.timer = 0.1;
        break;
      default: {
        // takoyaki thrown where the player is (a volley of three in phase 2)
        const n = g.stage >= 2 ? 3 : 1;
        for (let i = 0; i < n; i++) b.lob(h.x - 12 + Math.random() * 24, h.y + 10, Phaser.Math.Clamp(pl.x + (i - (n - 1) / 2) * 46 + (Math.random() - 0.5) * 20, 10, VIEW.width - 10), pl.y, 1.15, 'takoyaki', n > 1 ? Math.max(2, rules().lobBurst - 1) : undefined);
        g.timer = n > 1 ? 1.1 : 0.55;
        if (++g.step >= (n > 1 ? 3 : 5)) next();
      }
    }
  },

  /** A slam: the arm rears and blinks (a line shows where), whips out along its line, bursts, pulls back. */
  slamStep(g, dt) {
    const s = this.scene;
    const h = g.head;
    let done = 0;
    for (const sl of g.slams) {
      if (sl.arm.dead) {
        sl.over = true;
        done++;
        continue;
      }
      sl.t += dt;
      const bx = h.x + sl.arm.dx;
      const by = h.y + sl.arm.dy;
      if (sl.t < 0.7) {
        sl.k = 0;
        sl.arm.flash = Math.floor(sl.t * 20) % 2 ? 0.02 : 0;
        // an aimed slam follows the player while it rears; by a pile, it goes for the pile
        if (sl.aimed && g.piles) {
          const pl = s.player;
          const pile = g.piles.find((q) => Math.abs(pl.x - q.x) < TAKO.lure && Math.abs(pl.y - q.y) < TAKO.lure * 1.6);
          if (pile) sl.to = { x: pile.x, y: pile.y, pile };
          else {
            sl.to = null;
            sl.dir = Phaser.Math.Clamp(Math.atan2(pl.y - by, pl.x - bx), DOWN - 0.6, DOWN + 0.6);
          }
        }
        if (Math.floor(sl.t * 14) % 2) {
          this.tele.lineStyle(2, sl.to ? 0xffd06a : 0xff7050, sl.to ? 0.8 : 0.55);
          if (sl.to) this.tele.lineBetween(bx, by, sl.to.x, sl.to.y).strokeCircle(sl.to.x, sl.to.y, 9);
          else this.tele.lineBetween(bx, by, bx + Math.cos(sl.dir) * 120, by + Math.sin(sl.dir) * 120);
        }
      } else if (sl.t < 0.95) sl.k = (sl.t - 0.7) / 0.25;
      else if (sl.to?.pile && !sl.freed) {
        // into the pile: stuck fast, the tip wound round it, open to fire
        sl.k = 1;
        if (!sl.pinned) {
          sl.pinned = true;
          sl.pinT = TAKO.pin;
          s.fx.text(sl.to.x, sl.to.y - 16, 'ZAKLINOWANA!', 1.3, 0x81f3cc);
          s.fx.shockwave(sl.to.x, sl.to.y);
          s.cameras.main.shake(160, 0.004);
          s.sfx.explode('s');
        }
        sl.pinT -= dt;
        sl.arm.flash = Math.floor(sl.pinT * 6) % 2 ? 0.02 : 0;
        if (sl.pinT <= 0) {
          sl.pinned = false;
          sl.freed = true;
          sl.t = 1.45; // (it tears free and pulls back)
        }
      } else if (sl.t < 1.45) {
        sl.k = 1;
        if (!sl.burst) {
          sl.burst = true;
          s.bullets.ring(sl.arm.x, sl.arm.y, 8, Math.random() * TAU, slow);
          s.cameras.main.shake(200, 0.004);
        }
      } else if (sl.t < 1.85) sl.k = 1 - (sl.t - 1.45) / 0.4;
      else {
        sl.over = true;
        done++;
      }
    }
    if (done === g.slams.length) {
      g.slams = [];
      g.step++;
    } else if (done) g.slams = g.slams.filter((sl) => !sl.over);
  },

  /** Phase 3: a jet dash, the head shooting across the bay towards the player's side, inking the water. */
  takoDash(g, h, dt) {
    const d = g.dash;
    d.t += dt;
    const s = this.scene;
    if (d.t < 0.5) {
      // it draws in and blinks
      h.flash = Math.floor(d.t * 20) % 2 ? 0.02 : 0;
      if (Math.floor(d.t * 14) % 2) {
        this.tele.lineStyle(2, 0x9a7ac8, 0.5);
        this.tele.lineBetween(h.x, h.y, d.x, d.y);
      }
      return;
    }
    const k = Math.min(1, (d.t - 0.5) / 0.45);
    h.x = d.x0 + (d.x - d.x0) * k;
    h.y = d.y0 + (d.y - d.y0) * Math.sin(k * Math.PI); // down towards the player and back up
    if (Math.random() < dt * 30) s.fx.puff('wisp_s_1', h.x + (Math.random() - 0.5) * 20, h.y + 10, 0.5);
    if (k >= 1 && !d.burst) {
      d.burst = true;
      if (this.canFire(h)) s.bullets.ring(h.x, h.y + 10, 12, Math.random() * TAU, slow);
      g.home = Phaser.Math.Clamp(h.x, 50, VIEW.width - 50);
      g.t = 0;
    }
    if (d.t > 1.2) {
      g.dash = null;
      g.timer = 0.6;
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
    switch (g.phase % 4) {
      case 3: {
        // a jet dash: down at the player's side of the bay and back up, a ring where it turns
        const H = this.scene.H;
        g.dash = { t: 0, x0: h.x, y0: h.y, x: Phaser.Math.Clamp(pl.x, 34, VIEW.width - 34), y: Math.min(h.y + 70, H * 0.45), burst: false };
        if (++g.step >= 1) next();
        g.timer = 0.4;
        break;
      }
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
    const g = e.group;
    if (g?.slams?.some((sl) => sl.arm === e && sl.pinned) && g.head && !g.head.dead) {
      // cut while stuck in a pile: the head is bared for a moment, its bullets swept away
      g.open = TAKO.open;
      s.fx.text(g.head.x, g.head.y + 28, 'GŁOWA ODSŁONIĘTA!', 1.4, 0x81f3cc);
      s.fx.shockwave(g.head.x, g.head.y);
      s.bullets.cancelAll(s.fx);
      s.sfx.explode('m');
    }
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
