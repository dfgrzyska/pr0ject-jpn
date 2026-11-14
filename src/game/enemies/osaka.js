// Osaka: the manzai duos, the bunraku puppets (the miniboss) and the octopus (the boss).
// Methods of Enemies (src/game/Enemies.js mixes them in), so `this` is the enemies of the stage.
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { rules } from '../../difficulty.js';
import { slow, normal, DOWN, TAU, EXTRAS } from './shared.js';
import { hasEnemyFrame } from '../enemyArt.js';

// the bunraku puppets' three black-clad puppeteers
const KUROKO = { hp: 220, weight: 0, score: 2000, radius: 7, explosion: 'm' };
// the three puppets: their places on the stage, the order they are sent in, the rest between them, how much
// faster they go with 3, 2, 1 kuroko left, how closely a kuroko keeps up with its puppet, the geisha's dance
const BUNRAKU = {
  homes: { samurai: [90, 64], geisha: [40, 80], gabu: [140, 80] },
  order: ['samurai', 'geisha', 'gabu'],
  gap: 1.1,
  pace: [1, 1.25, 1.5],
  follow: 3.2,
  dance: 4.6,
};
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
  // slams: how many in a set (phase 1 single, phase 2 crossing pairs), and between the sets, while the rings
  // and the takoyaki fly, a loose arm lashes out at the player on its own every `lash` seconds (phase 1, 2)
  slams: [4, 3],
  lash: [2.6, 2],

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

  // ---------------------------------------------------------------- Osaka miniboss: the bunraku puppets
  /**
   * Three puppets on the stage, each worked by its own black-clad kuroko, as in Osaka's bunraku theatre: the
   * samurai, the geisha with her iron fan and the gabu, a maiden whose face splits into a demon's (BUNRAKU).
   * The puppets can't be hurt (shots pass through them; they hurt to touch); a kuroko can, and it goes with its
   * puppet wherever it is sent, a little behind, on its strings. One puppet at a time goes for the player:
   * - the samurai draws its sword, a red line shows where, and charges down it (twice in a row, later), cutting
   *   a fan of steel at the end; then it stands a moment before going back, its kuroko catching up;
   * - the geisha dances in an arc above the player, scattering petals; her open fan turns the shots that hit
   *   it (some come back as petals), and her kuroko keeps behind her: shoot round the fan, from the side;
   * - the gabu drifts down to the player, sweet and slow, shivers, then turns into the demon and spits a wide
   *   fan point-blank, lunging, before it flees back to its place.
   * Shoot a kuroko and its puppet drops (the samurai, the stage's own, just hangs there limp); with all three
   * down the puppets crumble. The fewer kuroko are left, the faster the rest work (SZALONE TEMPO, OSTATNI AKT).
   */
  spawnKuroko(e, base) {
    Object.assign(e, { invuln: true, pass: true, kuroko: [], puppets: [], role: 'samurai', act: null, limp: false, home: BUNRAKU.homes.samurai });
    for (const role of ['geisha', 'gabu']) {
      const frame = `${role}_0`;
      const art = e.texture.has(frame);
      const [hx, hy] = BUNRAKU.homes[role];
      const p = this.pool.spawn(art ? frame : 'ningyo_0', hx, e.y - 10, { ...base, ...EXTRAS, type: 'puppet', def: KUROKO, hp: 1, maxHp: 1, radius: 10, role, master: e, invuln: true, pass: true, state: 'fight', home: [hx, hy], act: null, limp: false });
      if (!art) p.setScale(p.scaleX * 0.7);
      p.setDepth(DEPTH.air - 0.06);
      e.puppets.push(p);
    }
    for (const pup of [e, ...e.puppets]) {
      const k = this.pool.spawn('kuroko_0', pup.x, pup.y - 24, { ...base, ...EXTRAS, type: 'kuroko', def: KUROKO, hp: KUROKO.hp, maxHp: KUROKO.hp, radius: KUROKO.radius, role: pup.role, puppet: pup, master: e, state: 'fight' });
      k.play('kuroko');
      k.setDepth(DEPTH.air - 0.07); // (behind all three puppets, as in the theatre)
      e.kuroko.push(k);
    }
    e.hp = e.maxHp = KUROKO.hp * 3;
  },

  bunraku(e, dt, b) {
    const s = this.scene;
    const alive = e.kuroko.filter((k) => !k.dead && k.master === e && k.hp > 0);
    const pups = [e, ...e.puppets.filter((p) => !p.dead && p.master === e)];
    e.hp = alive.reduce((sum, k) => sum + k.hp, 0);
    if (e.state === 'fight' && alive.length && alive.length < 3 && (e.stage ?? 1) < 4 - alive.length) {
      this.phaseBreak(e, e.x, e.y, 4 - alive.length, alive.length === 1 ? 'OSTATNI AKT' : 'SZALONE TEMPO');
    }
    const sp = BUNRAKU.pace[3 - Math.max(1, alive.length)]; // fewer hands, faster
    // a puppet whose kuroko has gone: it drops (the samurai just hangs there)
    for (const p of pups) if (!p.limp && !alive.some((k) => k.puppet === p)) this.puppetLimp(p);
    if (e.state === 'enter') {
      e.y += Math.max(6, (e.home[1] - e.y) * 0.8) * dt;
      if (e.y >= e.home[1] - 1) Object.assign(e, { state: 'fight', fight: 0, sendT: 1.2, next: 0 });
      for (const p of e.puppets) this.puppetHome(p, dt, 2);
    } else if (e.state === 'leave') {
      for (const p of pups) {
        p.vy = (p.vy ?? 0) - 40 * dt;
        p.y += p.vy * dt;
      }
    } else {
      e.fight += dt;
      if (e.fight > 40) {
        e.state = 'leave';
        for (const p of pups) Object.assign(p, { act: null, vy: 0 });
      }
      // send the next puppet whose kuroko is still working it, one at a time
      if (!pups.some((p) => p.act) && (e.sendT -= dt * sp) <= 0) {
        for (let i = 0; i < 3; i++) {
          const role = BUNRAKU.order[(e.next + i) % 3];
          const p = pups.find((q) => q.role === role && !q.limp);
          if (!p) continue;
          e.next = (e.next + i + 1) % 3;
          p.act = { kind: role, t: 0, n: 0 };
          break;
        }
        e.sendT = BUNRAKU.gap;
      }
      for (const p of pups) {
        if (p.limp) this.puppetDrop(p, dt);
        else if (p.act?.kind === 'samurai') this.puppetSamurai(p, dt * sp, b, alive.length);
        else if (p.act?.kind === 'geisha') this.puppetGeisha(p, dt * sp, b);
        else if (p.act?.kind === 'gabu') this.puppetGabu(p, dt * sp, b);
        else {
          this.puppetHome(p, dt, 1);
          // waiting at its place, now and then a little fan of three at the player
          if ((p.idleT = (p.idleT ?? 1 + Math.random() * 2) - dt * sp) <= 0) {
            p.idleT = 1.8 + Math.random() * 0.8;
            if (this.canFire(p)) b.fan(p.x, p.y + 10, this.aimAt(p, 0, 10), 3, 0.5, slow);
          }
        }
      }
    }
    // the kuroko go with their puppets, a little behind, on their strings
    for (const k of alive) {
      const p = k.puppet;
      if (!p) continue;
      const pl = s.player;
      let ox = 0;
      let oy = -26;
      if (p.act?.kind === 'geisha' && p.act.dance) {
        // behind the geisha, away from the player: her fan between them
        const a = Math.atan2(p.y - pl.y, p.x - pl.x);
        ox = Math.cos(a) * 26;
        oy = Math.sin(a) * 26;
      }
      const f = Math.min(1, dt * BUNRAKU.follow);
      k.x += (p.x + ox + Math.sin(e.age * 2 + k.radius) * 1.5 - k.x) * f;
      k.y += (p.y + oy - k.y) * f;
      k.setAlpha(0.8 + 0.15 * Math.sin(e.age * 3 + p.home[0]));
      // the strings: from the kuroko's hands to the puppet's head and hands
      this.tele.lineStyle(1, 0xd8d0c0, 0.32);
      for (const [hx, ax, ay] of [[-6, -8, -2], [6, 8, -2], [0, 0, -16]]) this.tele.lineBetween(k.x + hx, k.y - 4, p.x + ax, p.y + ay);
    }
    if (e.state !== 'enter' && !alive.length && !e.dead) {
      for (const p of e.puppets) if (!p.dead && p.master === e) this.puppetBreak(p);
      this.destroy(e);
    }
  },

  /** At its place on the stage: back there, bobbing and swaying as a puppet does when it waits. */
  puppetHome(p, dt, k) {
    const [hx, hy] = p.home;
    const t = p.master?.age ?? p.age;
    p.x += (hx + Math.sin(t * 0.8 + hx) * 6 - p.x) * Math.min(1, dt * 2 * k);
    p.y += (hy + Math.sin(t * 1.6 + hx) * 2 - p.y) * Math.min(1, dt * 2 * k);
    p.setRotation(p.rotation + (Math.sin(t * 1.2 + hx) * 0.06 - p.rotation) * Math.min(1, dt * 4));
    const idle = p.role === 'samurai' ? 'ningyo_0' : `${p.role}_0`;
    if (p.texture.has(idle) && p.frame.name !== idle) p.setFrame(idle);
  },

  /** The samurai: sword drawn, a red line to where it will go, the charge, a fan of steel, a breath, back. */
  puppetSamurai(p, dt, b, left) {
    const s = this.scene;
    const a = p.act;
    a.t += dt;
    if (a.phase === undefined) Object.assign(a, { phase: 'aim', t: 0 });
    if (a.phase === 'aim') {
      p.setFrame('ningyo_1');
      p.flash = Math.floor(a.t * 18) % 2 ? 0.02 : 0;
      if (a.t < 0.55) {
        // it follows the player with the sword's point, then commits
        const pl = s.player;
        a.dir = Math.atan2(pl.y - p.y, pl.x - p.x);
        const reach = Math.hypot(pl.x - p.x, pl.y - p.y) + 30;
        a.tx = Phaser.Math.Clamp(p.x + Math.cos(a.dir) * reach, 20, VIEW.width - 20);
        a.ty = Phaser.Math.Clamp(p.y + Math.sin(a.dir) * reach, 30, s.H - 26);
      }
      if (Math.floor(a.t * 14) % 2) {
        this.tele.lineStyle(2, 0xff5040, 0.6);
        this.tele.lineBetween(p.x, p.y, a.tx, a.ty);
      }
      p.setRotation((a.dir - DOWN) * 0.35);
      if (a.t > 0.85) {
        // the sword swung as it sets off throws a fan of steel ahead of it (from up here, where enemies may fire)
        if (this.canFire(p)) b.fan(p.x, p.y + 6, a.dir, 7, 1.1, normal);
        Object.assign(a, { phase: 'charge', t: 0, x0: p.x, y0: p.y });
      }
    } else if (a.phase === 'charge') {
      p.flash = 0;
      const d = Math.hypot(a.tx - a.x0, a.ty - a.y0);
      const k = Math.min(1, (a.t * 300) / Math.max(1, d));
      p.x = a.x0 + (a.tx - a.x0) * k;
      p.y = a.y0 + (a.ty - a.y0) * k;
      if (Math.random() < 0.6) s.fx.puff('wisp_s_0', p.x + (Math.random() - 0.5) * 10, p.y - 10, 0.3);
      if (k >= 1) {
        s.cameras.main.shake(120, 0.003);
        p.setFrame('ningyo_0');
        a.n++;
        Object.assign(a, { phase: 'stand', t: 0 });
      }
    } else if (a.phase === 'stand') {
      // a breath where it stopped (the kuroko catching up: the moment to hit it), then again or back
      if (a.t > 0.5) {
        if (left < 3 && a.n < 2) Object.assign(a, { phase: 'aim', t: 0.15 });
        else Object.assign(a, { phase: 'back', t: 0 });
      }
    } else {
      const [hx, hy] = p.home;
      p.x += Phaser.Math.Clamp(hx - p.x, -110 * dt, 110 * dt);
      p.y += Phaser.Math.Clamp(hy - p.y, -110 * dt, 110 * dt);
      p.setRotation(p.rotation * Math.max(0, 1 - dt * 5));
      if (Math.hypot(hx - p.x, hy - p.y) < 3 || a.t > 3) p.act = null;
    }
  },

  /** The geisha: an arc of a dance above the player, petals scattered, the iron fan held up as a guard. */
  puppetGeisha(p, dt, b) {
    const s = this.scene;
    const a = p.act;
    const pl = s.player;
    a.t += dt;
    const D = BUNRAKU.dance;
    if (a.t < D) {
      a.dance = true;
      // (kept above the line below which enemies don't fire, however low the player flies)
      const th = -DOWN + 0.8 * Math.sin(a.t * 1.25);
      const tx = Phaser.Math.Clamp(pl.x + Math.cos(th) * 64, 18, VIEW.width - 18);
      const ty = Phaser.Math.Clamp(pl.y + Math.sin(th) * 64, 26, s.H * rules().noFireBelow - 10);
      p.x += (tx - p.x) * Math.min(1, dt * 2.6);
      p.y += (ty - p.y) * Math.min(1, dt * 2.6);
      p.setRotation((Math.atan2(pl.y - p.y, pl.x - p.x) - DOWN) * 0.5);
      if (p.texture.has('geisha_1')) p.setFrame('geisha_1');
      if ((a.petal = (a.petal ?? 0.6) - dt) <= 0 && this.canFire(p)) {
        a.petal = 0.6;
        if (++a.n % 3 === 0) b.ring(p.x, p.y + 6, 10, a.n * 0.3, slow);
        else b.fan(p.x, p.y + 6, this.aimAt(p, 0, 6), 5, 1.0, slow);
      }
    } else {
      a.dance = false;
      this.puppetHome(p, dt, 2);
      if (Math.hypot(p.home[0] - p.x, p.home[1] - p.y) < 4 || a.t > D + 3) p.act = null;
    }
  },

  /** The gabu: down to the player, sweet and slow; a shiver; the demon's face, a point-blank fan, a lunge; away. */
  puppetGabu(p, dt, b) {
    const s = this.scene;
    const a = p.act;
    const pl = s.player;
    a.t += dt;
    if (a.phase === undefined) Object.assign(a, { phase: 'drift', t: 0 });
    const art = p.texture.has('gabu_1');
    if (a.phase === 'drift') {
      const tx = Phaser.Math.Clamp(pl.x, 20, VIEW.width - 20);
      const ty = Phaser.Math.Clamp(pl.y - 54, 30, s.H * rules().noFireBelow - 26); // (the lunge stays above the fire line)
      p.x += Phaser.Math.Clamp(tx - p.x, -55 * dt, 55 * dt);
      p.y += Phaser.Math.Clamp(ty - p.y, -55 * dt, 55 * dt);
      p.setRotation(Math.sin(a.t * 2.2) * 0.12);
      if (a.t > 1.8 || Math.hypot(tx - p.x, ty - p.y) < 4) Object.assign(a, { phase: 'shiver', t: 0, x0: p.x });
    } else if (a.phase === 'shiver') {
      p.x = a.x0 + Math.sin(a.t * 70) * 1.6;
      p.flash = Math.floor(a.t * 20) % 2 ? 0.02 : 0;
      if (a.t > 0.5) {
        p.flash = 0;
        if (art) p.setFrame('gabu_1');
        s.fx.text(p.x, p.y - 22, 'GABU!', 0.8, 0xff6a5a);
        s.sfx.shout?.(0.8);
        if (this.canFire(p)) b.fan(p.x, p.y + 10, this.aimAt(p, 0, 10), 9, 1.6, normal);
        Object.assign(a, { phase: 'lunge', t: 0, x0: p.x, y0: p.y, dir: this.aimAt(p, 0, 0) });
      }
    } else if (a.phase === 'lunge') {
      const k = Math.min(1, a.t / 0.18);
      p.x = a.x0 + Math.cos(a.dir) * 18 * k;
      p.y = a.y0 + Math.sin(a.dir) * 18 * k;
      if (a.t > 0.28 && !a.second) {
        a.second = true;
        if (this.canFire(p)) b.fan(p.x, p.y + 10, this.aimAt(p, 0, 10) + 0.09, 8, 1.4, slow);
      }
      if (a.t > 0.7) Object.assign(a, { phase: 'back', t: 0 });
    } else {
      const [hx, hy] = p.home;
      p.x += Phaser.Math.Clamp(hx - p.x, -120 * dt, 120 * dt);
      p.y += Phaser.Math.Clamp(hy - p.y, -120 * dt, 120 * dt);
      p.setRotation(p.rotation * Math.max(0, 1 - dt * 5));
      if (Math.hypot(hx - p.x, hy - p.y) < 3 || a.t > 3) {
        p.act = null;
        if (art) p.setFrame('gabu_0');
      }
    }
  },

  /** Its kuroko is down: the strings go slack. The samurai hangs where it is; the others fall to the stage. */
  puppetLimp(p) {
    Object.assign(p, { limp: true, act: null, harmless: true, flash: 0, vy: -20, limpT: 0 });
    if (p.role === 'samurai') p.setFrame('ningyo_0');
    this.scene.fx.text(p.x, p.y - 20, '!', 0.6, 0xffe0a0);
  },

  puppetDrop(p, dt) {
    p.limpT += dt;
    if (p.role === 'samurai') {
      // it sags, its head lolling, drifting back to its place, half seen
      this.puppetHome(p, dt, 0.5);
      p.setRotation(0.35 + Math.sin(p.limpT * 1.3) * 0.05).setAlpha(Math.max(0.5, 1 - p.limpT));
      return;
    }
    p.vy += 160 * dt;
    p.y += p.vy * dt;
    p.setRotation(p.rotation + dt * 2.5).setAlpha(Math.max(0, 1 - p.limpT * 1.4));
    if (p.limpT > 0.7) this.puppetBreak(p);
  },

  /** A puppet clatters apart: splinters of painted wood. */
  puppetBreak(p) {
    const s = this.scene;
    s.fx.explode(p.x, p.y, 'm');
    for (let i = 0; i < 6; i++) s.fx.puff('wisp_s_1', p.x + (Math.random() - 0.5) * 20, p.y + (Math.random() - 0.5) * 24, 0.4);
    this.remove(p);
  },

  /** The geisha's fan turns the player's shots that hit it (one in five comes back as a petal). */
  fanGuard(shot) {
    const e = this.heavy;
    const g = e?.puppets?.find((p) => p.role === 'geisha' && !p.dead && !p.limp && p.act?.dance);
    if (!g) return false;
    const pl = this.scene.player;
    const a = Math.atan2(pl.y - g.y, pl.x - g.x);
    const fx = g.x + Math.cos(a) * 8;
    const fy = g.y + Math.sin(a) * 8;
    if ((shot.x - fx) ** 2 + (shot.y - fy) ** 2 > (15 + shot.radius) ** 2) return false;
    this.scene.fx.spark(shot.x, shot.y);
    if (Math.random() < 0.2 && this.scene.t > (g.reflT ?? 0) && this.canFire(g)) {
      g.reflT = this.scene.t + 0.3;
      this.scene.bullets.fire(fx, fy, this.aimAt(g, 0, 0), slow);
    }
    return true;
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
    // between the slam sets an arm that is free lashes out at the player now and then
    if (g.stage < 3 && g.phase % 4 % 2 === 1) this.takoLash(g, arms, dt);
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
    const aim = sl ? sl.dir : DOWN;
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
    const fighting = arms.filter((t) => !t.invuln); // (the guarding side arms only spit a ring now and then)
    // the arms are the octopus's main weapon: a slam set, rings, another slam set, the takoyaki, round again
    switch (g.phase % 4) {
      case 1: {
        // the tips spit small rings, one arm after another
        const t = g.stage === 1 && g.step % 3 === 2 ? arms.find((q) => q.invuln) ?? fighting[0] : fighting[g.step % fighting.length];
        if (t && this.canFire(t)) b.ring(t.x, t.y, 7, g.step * 0.4, slow);
        g.timer = 0.6;
        if (++g.step >= fighting.length + 1) next();
        break;
      }
      case 0:
      case 2: {
        // slams run in slamStep: four in a row; in phase 2 three times two arms at once, crossing over
        const ready = fighting.filter((t) => !g.slams.some((q) => q.arm === t)); // (not an arm already lashing out)
        if (!g.slams.some((q) => !q.lash)) {
          if (g.step >= TAKO.slams[g.stage >= 2 ? 1 : 0]) next();
          else if (g.stage >= 2 && ready.length >= 2) {
            const left = ready.filter((t) => t.dx < 0);
            const right = ready.filter((t) => t.dx > 0);
            const a = (left.length ? left : ready)[Math.floor(Math.random() * (left.length || ready.length))];
            const c = (right.length ? right : ready.filter((t) => t !== a))[0];
            // one of the two goes for the player, the other crosses over
            for (const [arm, sx] of [[a, 1], [c, -1]]) if (arm) g.slams.push({ arm, t: 0, k: 0, burst: false, dir: DOWN - sx * 0.5, aimed: arm === a });
          } else if (ready.length) g.slams.push({ arm: ready[Math.floor(Math.random() * ready.length)], t: 0, k: 0, burst: false, dir: DOWN, aimed: true });
          else if (!fighting.length) g.step++; // (with an arm still lashing out, wait for it)
        }
        g.timer = 0.1;
        break;
      }
      default: {
        // takoyaki thrown where the player is (a volley of three in phase 2)
        const n = g.stage >= 2 ? 3 : 1;
        for (let i = 0; i < n; i++) b.lob(h.x - 12 + Math.random() * 24, h.y + 10, Phaser.Math.Clamp(pl.x + (i - (n - 1) / 2) * 46 + (Math.random() - 0.5) * 20, 10, VIEW.width - 10), pl.y, 1.15, 'takoyaki', n > 1 ? Math.max(2, rules().lobBurst - 1) : undefined);
        g.timer = n > 1 ? 1.1 : 0.55;
        if (++g.step >= 3) next();
      }
    }
  },

  /** A lash: between the slam sets, a free arm whips out at the player on its own (doesn't count in a set). */
  takoLash(g, arms, dt) {
    if ((g.lashT = (g.lashT ?? 1.4) - dt) > 0 || g.slams.some((q) => q.lash)) return;
    const busy = new Set(g.slams.map((q) => q.arm));
    const pl = this.scene.player;
    // the free arm nearest to the player's side
    const free = arms.filter((t) => !t.invuln && !busy.has(t) && this.canFire(t)).sort((a, c) => Math.abs(a.x - pl.x) - Math.abs(c.x - pl.x));
    g.lashT = TAKO.lash[g.stage >= 2 ? 1 : 0];
    if (free.length) g.slams.push({ arm: free[0], t: 0, k: 0, burst: false, dir: DOWN, aimed: true, lash: true });
  },

  /** A slam: the arm rears and blinks (a line shows where), whips out along its line, bursts, pulls back. */
  slamStep(g, dt) {
    const s = this.scene;
    const h = g.head;
    // (a set counts as done when its own slams are over; a lash runs alongside and doesn't count)
    const set = g.slams.filter((sl) => !sl.lash);
    for (const sl of g.slams) {
      if (sl.arm.dead) {
        sl.over = true;
        continue;
      }
      sl.t += dt;
      const bx = h.x + sl.arm.dx;
      const by = h.y + sl.arm.dy;
      if (sl.t < 0.7) {
        sl.k = 0;
        sl.arm.flash = Math.floor(sl.t * 20) % 2 ? 0.02 : 0;
        // Aim while winding up, then commit to that direction.
        if (sl.aimed) {
          const pl = s.player;
          sl.dir = Phaser.Math.Clamp(Math.atan2(pl.y - by, pl.x - bx), DOWN - 0.6, DOWN + 0.6);
        }
        if (Math.floor(sl.t * 14) % 2) {
          this.tele.lineStyle(2, 0xff7050, 0.55);
          this.tele.lineBetween(bx, by, bx + Math.cos(sl.dir) * 120, by + Math.sin(sl.dir) * 120);
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
      else sl.over = true;
    }
    if (set.length && set.every((sl) => sl.over)) g.step++;
    g.slams = g.slams.filter((sl) => !sl.over);
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
