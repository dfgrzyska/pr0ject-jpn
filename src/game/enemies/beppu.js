// Beppu: steam clouds, hatching eggs, the thieving macaques, geysers, the Oniyama crocodile (the miniboss) and the red oni (the boss).
// Methods of Enemies (src/game/Enemies.js mixes them in), so `this` is the enemies of the stage.
import Phaser from 'phaser';
import { DEPTH, PLAYER, VIEW } from '../../config.js';
import { slow, normal, DOWN, TAU, EXTRAS } from './shared.js';

// a little oni hatched from a hot-spring egg
const IMP = { hp: 4, weight: 1, score: 200, radius: 5, explosion: 's' };
// a wooden masu of Setsubun beans flying across the oni fight
const MASU = { hp: 5, weight: 0, score: 300, radius: 7, explosion: 's' };
// The red oni's three phases: his hide lets `armor` of normal damage through, more as it cracks (a horn breaks
// at `at[0]` of his life, the club at `at[1]`); in the last phase beans hit `beanK` times as hard
const ONI = { hp: 1350, armor: [0.25, 0.45, 0.7], at: [0.65, 0.3], beanK: 1.5 };

export const beppu = {
  /** Beppu: is (x, y) inside a steam cloud? */
  steamAt(x, y) {
    for (const e of this.pool.live) if (e.type === 'steam' && !e.dead && ((x - e.x) / 26) ** 2 + ((y - e.y) / 17) ** 2 < 1) return true;
    return false;
  },

  hatchEgg(e) {
    Object.assign(e, { hatched: true, def: IMP, hp: IMP.hp, maxHp: IMP.hp, radius: IMP.radius, path: 'imp', fireAt: e.age + 0.45 });
    e.setRotation(0).play('imp');
    this.scene.fx.shards(e.x, e.y, 6, true);
  },

  /** A macaque got its paws on the player's power (or bomb): it runs off with it; shoot it to get it back. */
  thieve(e, loot) {
    const s = this.scene;
    Object.assign(e, { loot, state: 'flee', vy: 30 });
    e.head = this.heads.spawn(loot === 'bomb' ? 'icon_bomb' : `wpn_${s.player.weapon}`, e.x, e.y + 8);
    e.head.setDepth(DEPTH.air + 0.05);
    s.fx.text(e.x, e.y - 12, loot === 'bomb' ? 'KRADZIEŻ BOMBY!' : 'KRADZIEŻ MOCY!', 1.2, 0xff8a6a);
    s.sfx.explode('s');
  },

  returnLoot(e) {
    const s = this.scene;
    const p = s.player;
    if (e.loot === 'bomb') p.bombs = 1;
    else p.level = Math.min(PLAYER.maxPower, p.level + 1);
    s.fx.text(e.x, e.y - 12, e.loot === 'bomb' ? 'BOMBA ODZYSKANA' : 'MOC ODZYSKANA', 1.2, 0x9cf09a);
    e.loot = null;
  },

  // ---------------------------------------------------------------- Beppu: geysers
  /**
   * A hot-spring vent riding on the mid layer, erupting every few seconds: it boils while a ring on the
   * ground fills up (the warning), then a scalding column bursts out and throws droplets around.
   * Mud vents (Oniishibozu Jigoku) erupt wider and longer and throw heavy blobs instead.
   */
  geyser(e, dt, b) {
    const s = this.scene;
    e.y = s.parallax.screenY(e.u);
    if (e.erupt > 0 && (e.erupt -= dt) <= 0) {
      s.fx.puff('wisp_s_0', e.x, e.y - 6, 0.6);
      if (e.y > 4 && e.y < s.H * 0.75 && s.bombClear <= 0) {
        const off = Math.random() * TAU;
        if (e.mud) for (let i = 0; i < 5; i++) b.fire(e.x, e.y, off + (i / 5) * TAU, slow * 0.7, true);
        else for (let i = 0; i < 8; i++) b.fire(e.x, e.y, off + (i / 8) * TAU, slow * 0.9);
      }
    }
    if (e.showT > 0 && (e.showT -= dt) <= 0) {
      e.anims.stop();
      e.setAlpha(0);
    }
    e.timer -= dt;
    if (e.timer > 0 || e.y < -4) return;
    e.timer = e.every;
    const live = e.mud ? 1.1 : 0.55;
    const warn = b.zone(e.x, e.y, e.mud ? 16 : 12, { warn: 0.9, live, kind: e.mud ? 'mud' : 'water', u: e.u });
    e.erupt = warn;
    e.showT = warn + live;
    e.setAlpha(1).play(e.mud ? this.skin.geyser.mudAnim : this.skin.geyser.anim);
  },

  // ---------------------------------------------------------------- Beppu miniboss: the Oniyama crocodile
  /**
   * A crocodile from the Oniyama hot pools. It sinks (only its eyes and ripples show, shots pass) and
   * swims under the player, then surfaces with a spray; it snaps its jaws, firing two rows of teeth that
   * close on the player; and it death-rolls, spinning out a spiral while the pool erupts around the player.
   */
  wani(e, dt, b) {
    const s = this.scene;
    const pl = s.player;
    if (e.state === 'enter') {
      e.y += Math.max(8, (78 - e.y) * 0.9) * dt;
      if (e.y >= 77) Object.assign(e, { state: 'fight', fight: 0, timer: 0.8, patternIndex: 0, step: 0, sub: null, roll: 0, snapT: 0 });
      return this.waniSegs(e);
    }
    if (e.state === 'leave') {
      e.vy = (e.vy ?? 0) - 40 * dt;
      e.y += e.vy * dt;
      return this.waniSegs(e);
    }
    e.fight += dt;
    if (e.snapT > 0 && (e.snapT -= dt) <= 0 && !e.sub) e.setFrame('wani_0');
    if (e.sub) return this.waniDive(e, dt, b);
    if (e.roll > 0) {
      // death roll: the whole body spins, a spiral of scalding water flies out of the jaws
      e.roll -= dt;
      e.setRotation(e.rotation + dt * TAU / 1.2);
      if ((e.spin -= dt) <= 0 && this.canFire(e)) {
        e.spin = 0.07;
        for (let k = 0; k < 2; k++) b.fire(e.x, e.y, e.rotation + DOWN + k * Math.PI, slow);
      }
      if (e.roll <= 0) e.setRotation(0);
      return this.waniSegs(e);
    }
    if (e.fight > 38) {
      e.state = 'leave';
      return;
    }
    e.x += (90 + 34 * Math.sin(e.fight * 0.6) - e.x) * Math.min(1, dt * 2);
    e.y += (78 + 5 * Math.sin(e.fight * 1.3) - e.y) * Math.min(1, dt * 3);
    this.waniSegs(e);
    e.timer -= dt;
    if (e.timer > 0 || !this.canFire(e)) return;
    const mouth = { x: e.x, y: e.y + 30 };
    switch (e.patternIndex % 3) {
      case 0:
        // sink and swim under the player
        e.sub = { phase: 'swim', t: 0, ripple: 0 };
        e.anims.stop();
        e.setFrame('wani_sub');
        e.ghost = true;
        s.fx.puff('splash', e.x, e.y + 10, 0.4);
        break;
      case 1: {
        // the jaws: two rows of teeth closing on where the player is now
        const a = this.aimAt(e, 0, 30);
        const d = Math.max(60, Math.hypot(pl.x - mouth.x, pl.y - mouth.y));
        for (const side of [-1, 1])
          for (let i = 0; i < 6; i++) {
            const th = 0.42 + i * 0.07;
            const v = 88;
            const t = d / (v * Math.cos(th));
            const acc = (2 * v * Math.sin(th)) / t;
            const n = a - side * DOWN; // across the aim line, towards it
            b.shot('eb_s', mouth.x, mouth.y, a + side * th, v, 1.8, { ax: Math.cos(n) * acc, ay: Math.sin(n) * acc });
          }
        e.setFrame('wani_1');
        e.snapT = 0.3;
        s.sfx.explode('s');
        e.timer = 0.95;
        if (++e.step >= 3) this.nextPattern(e);
        break;
      }
      default:
        // death roll, and the pool erupts under and around the player
        e.roll = 1.2;
        e.spin = 0;
        b.zone(pl.x, pl.y, 12, { warn: 1.0, live: 0.5 });
        for (const [dx, dy] of [[-34, -14], [34, -14], [0, 30]]) b.zone(Phaser.Math.Clamp(pl.x + dx, 12, VIEW.width - 12), Phaser.Math.Clamp(pl.y + dy, 30, s.H - 16), 11, { warn: 1.2, live: 0.5 });
        // second phase: geysers along both banks as well
        if (e.p2) for (const x of [12, VIEW.width - 12]) for (const k of [0.5, 0.75]) b.zone(x, s.H * k, 11, { warn: 1.3, live: 0.5 });
        e.timer = 0.6;
        if (++e.step >= 2) this.nextPattern(e);
    }
  },

  /** Under the surface: ripples heading for the player, then it bursts out with a spray. */
  waniDive(e, dt, b) {
    const s = this.scene;
    const d = e.sub;
    d.t += dt;
    if (d.phase === 'swim') {
      const tx = Phaser.Math.Clamp(s.player.x, 24, VIEW.width - 24);
      e.x += Phaser.Math.Clamp(tx - e.x, -60 * dt, 60 * dt);
      e.y += (96 - e.y) * Math.min(1, dt * 1.5);
      if ((d.ripple -= dt) <= 0) {
        d.ripple = 0.18;
        s.fx.puff('splash', e.x + (Math.random() - 0.5) * 8, e.y - 6, 0.3);
        // second phase: two false shadows ripple along beside it
        if (e.p2) for (const side of [-1, 1]) s.fx.puff('splash', Phaser.Math.Clamp(e.x + side * 46, 10, VIEW.width - 10) + (Math.random() - 0.5) * 8, e.y - 6, 0.3);
      }
      if (d.t > 1.4) Object.assign(d, { phase: 'rise', t: 0 });
    } else if (d.phase === 'rise') {
      e.flash = Math.floor(d.t * 20) % 2 ? 0.02 : 0;
      if (d.t > 0.35) {
        e.ghost = false;
        e.setFrame('wani_1');
        e.snapT = 0.5;
        s.fx.puff('splash', e.x, e.y + 20, 0.4);
        s.fx.puff('splash', e.x, e.y - 10, 0.4);
        // the false shadows burst up too, as scalding spouts
        if (e.p2) for (const side of [-1, 1]) b.zone(Phaser.Math.Clamp(e.x + side * 46, 12, VIEW.width - 12), e.y + 6, 11, { warn: 0.3, live: 0.45 });
        if (this.canFire(e)) {
          b.ring(e.x, e.y + 10, 14, Math.random() * TAU, slow);
          b.fan(e.x, e.y + 30, this.aimAt(e, 0, 30), 5, 0.7, normal);
        }
        e.sub = null;
        e.timer = 0.8;
        this.nextPattern(e);
      }
    }
    this.waniSegs(e);
  },

  /** Hit circles for the long body: the snout and the tail, following the rotation. */
  waniSegs(e) {
    const [head, tail] = e.segs;
    const sn = Math.sin(e.rotation);
    const cs = Math.cos(e.rotation);
    Object.assign(head, { x: e.x - sn * 22, y: e.y + cs * 22 });
    Object.assign(tail, { x: e.x + sn * 21, y: e.y - cs * 21 });
  },

  // ---------------------------------------------------------------- Beppu boss: the red oni of Chinoike
  /**
   * The oni sleeps in the blood pond and rises when the scroll stops. Normal shots barely chip his hide:
   * Setsubun beans do the damage ("Oni wa soto!"). Masu boxes of beans fly across the screen; shoot one
   * and catch the beans. Attacks: the kanabō smash (a marked spot, then a fissure of eruptions running
   * at the player), stomps that set off geysers, roaring fans. Three phases, his hide cracking with each (ONI):
   * the iron kanabō; a broken horn, with columns of scalding steam across the pond; Chinoike's blood hell,
   * the club swung round in a spiral and the pond boiling up from below. A masu shot down bursts over him and
   * makes him stagger. The pond position comes from the boss wave.
   */
  spawnOni(w, base) {
    const s = this.scene;
    const [x, u] = w.pond;
    const g = { kind: 'oni', state: 'dormant', t: 0, phase: 0, step: 0, timer: 1, parts: [], enraged: false, defeated: false, awake: false };
    Object.assign(g, { home: x, u, sway: 0, masuT: 0, masuSide: 1, act: null, poseT: 0, stage: 1, armor: ONI.armor[0], beanK: 1, stagger: 0 });
    const e = this.pool.spawn('oni_0', x, s.parallax.screenY(u), { ...base, role: 'body', hp: ONI.hp, maxHp: ONI.hp, radius: 18, group: g, invuln: true, oni: true, pose: 0, hurtT: 0, shoutT: 0 });
    e.segs = [{ x, y: 0, r: 12 }]; // the head
    e.setDepth(DEPTH.air - 0.1).setAlpha(0);
    g.body = e;
    g.parts.push(e);
    g.maxTotal = e.maxHp;
    this.bossGroup = g;
    return e;
  },

  /** Stand in the pond with `vh` px of the sprite above the surface (rising from the blood). */
  oniStand(e, surf, vh) {
    e.setCrop(0, 0, 63, vh);
    e.y = surf + 42 - vh;
    Object.assign(e.segs[0], { x: e.x, y: e.y - 20 });
  },

  oniHurt(e) {
    e.hurtT = 0.12;
    if (e.shoutT > 0) return;
    e.shoutT = 2.6;
    this.scene.fx.text(e.x, e.y - 42, 'ONI WA SOTO!', 0.9, 0xffe080);
  },

  spawnMasu(g) {
    const s = this.scene;
    g.masuSide = -g.masuSide;
    const y = 130 + Math.random() * Math.max(10, s.H * 0.58 - 130);
    const x = g.masuSide < 0 ? -10 : VIEW.width + 10;
    this.pool.spawn('masu', x, y, { ...EXTRAS, type: 'masu', def: MASU, hp: MASU.hp, maxHp: MASU.hp, radius: MASU.radius, age: 0, seen: 0, state: 'fly', flash: 0, flashCool: 0, ground: false, head: null, dir: -g.masuSide, y0: y, harmless: true });
  },

  updateOni(g, dt) {
    const s = this.scene;
    const e = g.body;
    if (e.dead || e.group !== g) return;
    const surf = s.parallax.screenY(g.u);
    g.t += dt;
    if (g.state === 'dormant') {
      e.setPosition(g.home, surf);
      // bubbles rising in the blood pond
      if (surf > 0 && surf < s.H && Math.random() < dt * 4) s.fx.puff('bloodball_1', g.home + (Math.random() - 0.5) * 50, surf + (Math.random() - 0.5) * 14, 0.4);
      if (s.parallax.time >= s.parallax.maxTime - 1e-3) {
        Object.assign(g, { state: 'rise', t: 0 });
        e.setAlpha(1);
        s.cameras.main.shake(2400, 0.005);
      }
      return;
    }
    if (g.state === 'rise') {
      const k = Math.min(1, g.t / 2.4);
      this.oniStand(e, surf, Math.max(1, Math.round(60 * k)));
      if (Math.random() < dt * 14) s.fx.puff('bloodball_1', e.x + (Math.random() - 0.5) * 50, surf + 6, 0.3);
      if (k >= 1) {
        Object.assign(g, { state: 'fight', awake: true, t: 0, timer: 1.4, masuT: 0.3 });
        e.invuln = false;
        s.hud.show('RZUCAJ FASOLKI!', 'ZESTRZEL MASU I ZŁAP FASOLKI', 2.8);
      }
      return;
    }
    e.hurtT -= dt;
    e.shoutT -= dt;
    if (g.poseT > 0 && (g.poseT -= dt) <= 0) e.pose = 0;
    if (!g.act) g.sway += dt * (g.enraged ? 0.7 : 0.45);
    e.x = g.home + 22 * Math.sin(g.sway);
    this.oniStand(e, surf, 60);
    e.setFrame(e.hurtT > 0 && e.pose === 0 ? 'oni_hurt' : `oni_${e.pose}`);
    // a fresh masu of beans every few seconds (at most two in the air)
    if ((g.masuT -= dt) <= 0) {
      g.masuT = g.enraged ? 5 : 6.5;
      if (this.pool.live.filter((m) => m.type === 'masu' && !m.dead).length < 2) this.spawnMasu(g);
    }
    if (g.stage === 1 && e.hp < e.maxHp * ONI.at[0]) {
      // a horn snaps off: his hide gives way more
      Object.assign(g, { armor: ONI.armor[1], phase: 0, step: 0, act: null });
      e.pose = 0;
      this.phaseBreak(g, e.x, e.y - 20, 2, 'ZŁAMANY RÓG');
      s.fx.shards(e.x + 10, e.y - 34, 12);
    } else if (g.stage === 2 && e.hp < e.maxHp * ONI.at[1]) {
      // the club breaks, the pond boils: Chinoike's blood hell
      Object.assign(g, { armor: ONI.armor[2], beanK: ONI.beanK, enraged: true, phase: 0, step: 0, act: null });
      e.pose = 0;
      this.phaseBreak(g, e.x, e.y - 20, 3, 'KRWAWE PIEKŁO CHINOIKE');
      s.fx.debris(e.x, e.y, 14, 0x6a4a3a, 1.4);
    }
    if (g.stagger > 0) {
      // reeling from a masu of beans: no attacks for a moment
      g.stagger -= dt;
      e.hurtT = Math.max(e.hurtT, 0.05);
      if (!g.act) return;
    }
    if (g.act) return this.oniSmash(g, e, dt);
    g.timer -= dt * (g.enraged ? 1.35 : 1);
    if (g.timer > 0 || !this.canFire(e)) return;
    this.oniAttack(g, e);
  },

  oniAttack(g, e) {
    const s = this.scene;
    const b = s.bullets;
    const pl = s.player;
    const list = g.stage >= 3 ? ['smash', 'spin', 'boil', 'stomp', 'spin', 'roar'] : g.stage === 2 ? ['smash', 'geysers', 'stomp', 'roar'] : ['smash', 'stomp', 'roar'];
    const next = () => {
      g.phase++;
      g.step = 0;
      g.timer = 1.0;
    };
    switch (list[g.phase % list.length]) {
      case 'smash': {
        // raise the kanabō on the player's side; the impact spot and the fissure towards the player are marked
        const side = pl.x > e.x ? 1 : -1;
        e.setFlipX(side > 0);
        const ix = e.x + side * 26;
        const iy = e.y + 30;
        const dx = pl.x - ix;
        const dy = pl.y - iy;
        const d = Math.hypot(dx, dy) || 1;
        const warn = b.zone(ix, iy, 14, { warn: 0.8, live: 0.3, kind: 'blood' });
        const n = Math.min(14, Math.ceil(d / 17) + 1);
        for (let i = 1; i <= n; i++) b.zone(ix + (dx / d) * 17 * i, iy + (dy / d) * 17 * i, 8, { warn: 0.8 + 0.06 * i, live: 0.3, kind: 'blood' });
        g.act = { t: 0, warn, ix, iy };
        e.pose = 1;
        if (++g.step >= (g.enraged ? 3 : 2)) next();
        break;
      }
      case 'stomp': {
        // a stomp sets off the hot springs: eruptions all over, one under the player
        s.cameras.main.shake(300, 0.005);
        for (let i = 0; i < 6; i++) {
          const ang = -Math.PI * (0.15 + 0.7 * (i / 5));
          const p = s.fx.part(s.fx.parts, 'drop_0', e.x + (i - 2.5) * 8, e.y + 24);
          p.vx = Math.cos(ang) * 55;
          p.vy = Math.sin(ang) * 55;
          p.g = 110;
          p.life = p.max = 0.4;
          p.setTint(0xff4a3a);
        }
        b.zone(pl.x, pl.y, 13, { warn: 1.0, live: 0.5 });
        for (let i = 0; i < 4; i++) b.zone(16 + Math.random() * (VIEW.width - 32), s.H * 0.4 + Math.random() * (s.H * 0.6 - 24), 13, { warn: 1.0, live: 0.5 });
        b.ring(e.x, e.y + 28, g.enraged ? 14 : 10, g.step * 0.3, slow);
        g.timer = 1.4;
        if (++g.step >= 3) next();
        break;
      }
      case 'geysers': {
        // the broken horn: columns of scalding steam burst up the pond, one after another, with gaps to stand in
        const cols = [22, 58, 94, 130, 166];
        const safe = Math.floor(Math.random() * cols.length);
        cols.forEach((x, i) => {
          if (i === safe || (g.step % 2 === 1 && i === (safe + 2) % cols.length)) return;
          for (let y = s.H * 0.36, j = 0; y < s.H - 6; y += 30, j++) b.zone(x, y, 11, { warn: 1.05 + j * 0.05, live: 0.45 });
        });
        s.cameras.main.shake(250, 0.004);
        g.timer = 1.9;
        if (++g.step >= 2) next();
        break;
      }
      case 'boil': {
        // the pond boils over: bubbles rise from the bottom of the screen in rows with gaps, fire rings from him
        const gap = Math.floor(Math.random() * 6);
        for (let i = 0; i < 7; i++) {
          if (i === gap) continue;
          s.bullets.shot('eb_s', 12 + i * 26 + (Math.random() - 0.5) * 6, s.H - 2, -Math.PI / 2 + (Math.random() - 0.5) * 0.1, slow * 0.9, 1.8);
        }
        if (g.step % 2 === 0) b.ring(e.x, e.y + 20, 12, g.step * 0.4, slow);
        g.timer = 0.9;
        if (++g.step >= 6) next();
        break;
      }
      case 'spin': {
        // the club swung round and round: a three-armed spiral
        e.pose = g.step % 4 < 2 ? 1 : 2;
        e.setFlipX(g.step % 8 < 4);
        g.poseT = 0.2;
        for (let k = 0; k < 3; k++) b.fire(e.x, e.y + 6, g.step * 0.23 + (k * TAU) / 3, normal);
        g.timer = 0.07;
        if (++g.step >= 44) next();
        break;
      }
      default: {
        // a roar: wide aimed fans, then heavy shots
        const a = this.aimAt(e, 0, 10);
        if (g.step % 2 === 0) b.fan(e.x, e.y + 10, a, g.enraged ? 9 : 7, 1.1, slow);
        else b.fan(e.x, e.y + 10, a, 3, 0.4, normal, true);
        g.timer = 0.5;
        if (++g.step >= 6) next();
      }
    }
  },

  /** The kanabō comes down: impact, a burst of shards, then the club goes back up. */
  oniSmash(g, e, dt) {
    const s = this.scene;
    const a = g.act;
    a.t += dt;
    if (e.pose === 1 && a.t >= a.warn) {
      e.pose = 2;
      s.cameras.main.shake(350, 0.008);
      s.sfx.explode('m');
      s.fx.shards(a.ix, a.iy, 10, true);
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * TAU;
        const p = s.fx.part(s.fx.parts, 'drop_0', a.ix, a.iy);
        p.vx = Math.cos(ang) * 65;
        p.vy = Math.sin(ang) * 65 - 20;
        p.g = 110;
        p.life = p.max = 0.45;
        p.setTint(0xff4a3a);
      }
      if (s.bombClear <= 0) s.bullets.ring(a.ix, a.iy, 12, Math.random() * TAU, slow);
    }
    if (a.t >= a.warn + 0.55) {
      e.pose = 0;
      g.act = null;
      g.timer = 0.35;
    }
  },
};
