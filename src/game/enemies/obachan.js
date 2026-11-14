// Random encounter 6 (ex6): the grandma with the purple perm and the tiger on her blouse. Methods of Enemies (mixed
// in like the cities').
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * The grandma (OBACHAN): life, where she stands and how far she trots about, the phases' thresholds, how much bigger
 * she is shown; her sweets (speed, how long before they unwrap), the trolley (warning, speed), the tiger off her
 * blouse (aim, speed, rest between leaps).
 */
export const OBACHAN = {
  hp: 2400,
  home: 92,
  trot: 40,
  phase: [0.66, 0.33],
  scale: 1.5,
  ame: { speed: 95, unwrap: 0.8 },
  cart: { warn: 0.9, speed: 260 },
  tora: { aim: 0.8, speed: 290, rest: 1.1 },
};

const SWEETS = ['r', 'y', 'g', 'p'];

export const obachan = {
  /**
   * A grandma with a tight purple perm and a tiger's face on her black blouse, a handbag on her arm, sweets in her
   * pockets for everyone. Three phases:
   * 1. AME-CHAN: she hands out sweets: wrapped sweets flung in fans that unwrap into rings; she rams across the
   *    screen with her shopping trolley (a red line across first); she whirls her handbag (rings in a spiral);
   * 2. MAKETE!: she haggles: shouts that fire fans of big shots ("-50%"), the trolley from both sides;
   * 3. TYGRYS!: the tiger jumps off her blouse and hunts the player on its own: it crouches (a line shows where),
   *    leaps, lands with a roar (a ring); she keeps handing out sweets and haggling.
   */
  spawnObachan(w, base) {
    const g = { kind: 'obachan', state: 'enter', t: 0, stage: 1, phase: 0, timer: 1.2, parts: [], awake: false, defeated: false, act: null, items: [], carts: [], tiger: null, take: { body: 1 } };
    const body = this.pool.spawn('baba_0', 90, -50, { ...base, role: 'body', group: g, hp: OBACHAN.hp, maxHp: OBACHAN.hp, radius: 16 });
    body.setDepth(DEPTH.air - 0.1).setScale(body.base * OBACHAN.scale);
    g.body = body;
    g.parts.push(body);
    g.maxTotal = OBACHAN.hp;
    this.bossGroup = g;
    return body;
  },

  updateObachan(g, dt) {
    const s = this.scene;
    const e = g.body;
    g.t += dt;
    this.obachanItems(g, dt);
    this.obachanCarts(g, dt);
    if (g.tiger) this.obachanTiger(g, dt);
    if (g.state === 'enter') {
      e.y += Math.max(14, (OBACHAN.home - e.y) * 1.4) * dt;
      if (e.y >= OBACHAN.home - 1) {
        Object.assign(g, { state: 'fight', awake: true, timer: 1 });
        s.fx.text(e.x, e.y - 40, 'ARA~!', 1, 0xd09af0);
      }
      return this.obachanPose(g);
    }
    const left = e.hp / e.maxHp;
    if (g.stage === 1 && left < OBACHAN.phase[0] && !g.act) {
      g.phase = 0;
      this.phaseBreak(g, e.x, e.y, 2, 'MAKETE!');
    } else if (g.stage === 2 && left < OBACHAN.phase[1] && !g.act) {
      g.phase = 0;
      this.phaseBreak(g, e.x, e.y, 3, 'TYGRYS!');
      this.obachanReleaseTiger(g);
    }
    // she trots about a little
    e.x += (90 + Math.sin(g.t * 0.7) * OBACHAN.trot - e.x) * Math.min(1, dt * 2);
    e.y += (OBACHAN.home + Math.abs(Math.sin(g.t * 5)) * -2 - e.y) * Math.min(1, dt * 6);
    if (g.act) this.obachanAct(g, dt);
    else if ((g.timer -= dt) <= 0 && this.canFire(e)) {
      const plan = [['ame', 'cart', 'ame', 'bag'], ['haggle', 'ame', 'cart', 'haggle'], ['ame', 'bag', 'haggle', 'ame']][g.stage - 1];
      g.act = { kind: plan[g.phase++ % plan.length], t: 0, step: 0 };
    }
    this.obachanPose(g);
  },

  obachanDone(g, rest = 0.9) {
    g.act = null;
    g.timer = rest;
  },

  obachanAct(g, dt) {
    const s = this.scene;
    const b = s.bullets;
    const a = g.act;
    const pl = s.player;
    const e = g.body;
    a.t += dt;
    switch (a.kind) {
      case 'ame':
        // sweets for everyone: a fan of wrapped sweets at the player, three times
        if (a.t > a.step * 0.55) {
          a.step++;
          g.throwT = g.t + 0.3;
          const aim = this.aimAt(e, 18, -30);
          for (let i = -1; i <= 1; i++) {
            const ang = aim + i * 0.4 + (Math.random() - 0.5) * 0.1;
            const v = OBACHAN.ame.speed * (0.85 + Math.random() * 0.3);
            this.obachanItem(g, e.x + 18, e.y - 30, Math.cos(ang) * v, Math.sin(ang) * v, SWEETS[(a.step + i + 3) % 4]);
          }
          if (a.step === 1) s.fx.text(e.x, e.y - 50, 'AME, IRU?', 0.8, 0xffe080);
        }
        if (a.step >= 3) this.obachanDone(g, 0.9);
        break;
      case 'cart': {
        // the trolley across the screen at the player's height (both sides at once, haggling)
        if (a.step === 0) {
          a.step = 1;
          const y = Phaser.Math.Clamp(pl.y, s.H * 0.45, s.H - 20);
          const side = Math.random() < 0.5 ? -1 : 1;
          this.obachanCart(g, side, y);
          if (g.stage >= 2) this.obachanCart(g, -side, Phaser.Math.Clamp(y + (Math.random() < 0.5 ? -46 : 46), s.H * 0.4, s.H - 16), 0.5);
          s.fx.text(e.x, e.y - 50, 'DOITE DOITE!', 0.8, 0xffe080);
        }
        if (a.t > 2.2) this.obachanDone(g, 0.6);
        break;
      }
      case 'bag':
        // the handbag whirled: rings in a spiral
        if (a.t > a.step * 0.18) {
          const off = a.step * 0.22;
          a.step++;
          b.ring(e.x - 20, e.y + 10, 10, off, slow);
        }
        if (a.step >= 5) this.obachanDone(g, 1);
        break;
      case 'haggle':
        // MAKETE!: a shout, a fan of big shots, the price slashed
        if (a.t > a.step * 0.7) {
          a.step++;
          g.shoutT = g.t + 0.45;
          b.fan(e.x, e.y - 20, this.aimAt(e, 0, -20), 5, 1.1, normal, true);
          s.fx.text(e.x + (Math.random() - 0.5) * 40, e.y + 20, ['MAKETE!', '-50%', '-80%!'][a.step % 3], 0.9, 0xff8a6a);
          s.cameras.main.shake(120, 0.003);
        }
        if (a.step >= 3) this.obachanDone(g, 1);
        break;
      default:
        this.obachanDone(g);
    }
  },

  obachanItem(g, x, y, vx, vy, col) {
    const frame = `ame_${col}_0`;
    if (!g.body.texture.has(frame)) return;
    const spr = this.segPool.spawn(frame, x, y).setDepth(DEPTH.air + 0.04);
    g.items.push({ spr: spr.setScale(spr.base * 1.3), col, vx, vy, t: 0, unwrap: OBACHAN.ame.unwrap * (0.85 + Math.random() * 0.3) });
  },

  /** The sweets in flight: they slow, then unwrap into a little ring. */
  obachanItems(g, dt) {
    const s = this.scene;
    const pl = s.player;
    let n = 0;
    for (const it of g.items) {
      it.t += dt;
      const sp = it.spr;
      const k = Math.max(0.35, 1 - it.t / (it.unwrap * 1.6));
      sp.x += it.vx * dt * k;
      sp.y += it.vy * dt * k;
      sp.setFrame(`ame_${it.col}_${Math.floor(it.t * 10) % 2}`);
      let gone = false;
      if (it.t > it.unwrap) {
        if (sp.y < s.H * 0.8) s.bullets.ring(sp.x, sp.y, 6, Math.random() * TAU, slow);
        s.fx.shards(sp.x, sp.y, 4, true);
        gone = true;
      } else if (pl.alive && Math.hypot(pl.x - sp.x, pl.y - sp.y) < 6) {
        pl.hit();
        gone = true;
      }
      if (gone) {
        this.segPool.kill(sp);
        continue;
      }
      g.items[n++] = it;
    }
    g.items.length = n;
  },

  obachanCart(g, side, y, delay = 0) {
    if (!g.body.texture.has('cart_0')) return;
    const spr = this.segPool.spawn('cart_0', side < 0 ? -40 : VIEW.width + 40, y).setDepth(DEPTH.air + 0.03).setFlipX(side > 0);
    g.carts.push({ spr: spr.setScale(spr.base * 1.3), side, y, t: -delay, dropped: 0 });
  },

  /** The trolleys: a red line across where one will come, then it rattles across, shedding sweets. */
  obachanCarts(g, dt) {
    const s = this.scene;
    const pl = s.player;
    let n = 0;
    for (const c of g.carts) {
      c.t += dt;
      const warn = OBACHAN.cart.warn;
      if (c.t < warn) {
        if (c.t > 0 && Math.floor(c.t * 12) % 2) {
          this.tele.lineStyle(2, 0xff5040, 0.6);
          this.tele.lineBetween(0, c.y, VIEW.width, c.y);
          this.tele.strokeTriangle(c.side < 0 ? 8 : VIEW.width - 8, c.y - 5, c.side < 0 ? 8 : VIEW.width - 8, c.y + 5, c.side < 0 ? 16 : VIEW.width - 16, c.y);
        }
      } else {
        c.spr.x -= c.side * OBACHAN.cart.speed * dt;
        c.spr.setFrame(`cart_${Math.floor(c.t * 14) % 2}`);
        // a sweet or two falls out of the basket as it goes
        if (c.dropped < 3 && Math.abs(c.spr.x - VIEW.width * (0.25 + c.dropped * 0.25)) < 6) {
          c.dropped++;
          s.bullets.fire(c.spr.x, c.spr.y - 8, DOWN + (Math.random() - 0.5) * 0.6, slow);
        }
        if (pl.alive && Math.abs(pl.x - c.spr.x) < 14 && Math.abs(pl.y - c.spr.y) < 9) pl.hit();
        if ((c.side < 0 && c.spr.x > VIEW.width + 50) || (c.side > 0 && c.spr.x < -50)) {
          this.segPool.kill(c.spr);
          continue;
        }
      }
      g.carts[n++] = c;
    }
    g.carts.length = n;
  },

  /** Phase 3: the tiger comes off her blouse. */
  obachanReleaseTiger(g) {
    const e = g.body;
    if (!e.texture.has('tora_crouch')) return;
    const spr = this.segPool.spawn('tora_crouch', e.x, e.y + 4).setDepth(DEPTH.air + 0.02);
    g.tiger = { spr: spr.setScale(spr.base * 1.4), phase: 'rest', t: 0.4 };
    this.scene.fx.text(e.x, e.y - 40, 'GAOOO!', 1.2, 0xffb050);
    this.scene.cameras.main.shake(300, 0.006);
  },

  /** The tiger hunts on its own: crouch and aim (a line), leap, land with a roar, rest. It hurts to touch. */
  obachanTiger(g, dt) {
    const s = this.scene;
    const pl = s.player;
    const T = OBACHAN.tora;
    const tg = g.tiger;
    const sp = tg.spr;
    tg.t -= dt;
    if (tg.phase === 'rest') {
      sp.setFrame('tora_crouch');
      if (tg.t <= 0 && this.canFire(g.body)) Object.assign(tg, { phase: 'aim', t: T.aim });
    } else if (tg.phase === 'aim') {
      sp.setFrame('tora_crouch');
      sp.x += (Math.random() - 0.5) * 1.2;
      if (tg.t > T.aim * 0.3) Object.assign(tg, { tx: Phaser.Math.Clamp(pl.x, 14, VIEW.width - 14), ty: Phaser.Math.Clamp(pl.y, s.H * 0.3, s.H - 24) });
      if (Math.floor(tg.t * 14) % 2) {
        this.tele.lineStyle(2, 0xff5040, 0.6);
        this.tele.lineBetween(sp.x, sp.y, tg.tx, tg.ty);
      }
      if (tg.t <= 0) Object.assign(tg, { phase: 'leap', x0: sp.x, y0: sp.y, k: 0, d: Math.max(1, Math.hypot(tg.tx - sp.x, tg.ty - sp.y)) });
    } else if (tg.phase === 'leap') {
      sp.setFrame('tora_leap');
      tg.k = Math.min(1, tg.k + (T.speed * dt) / tg.d);
      sp.setPosition(tg.x0 + (tg.tx - tg.x0) * tg.k, tg.y0 + (tg.ty - tg.y0) * tg.k - Math.sin(tg.k * Math.PI) * 14);
      if (tg.k >= 1) {
        s.bullets.ring(sp.x, sp.y, 10, Math.random() * TAU, slow);
        s.fx.text(sp.x, sp.y - 16, 'GAO!', 0.8, 0xffb050);
        s.cameras.main.shake(120, 0.004);
        Object.assign(tg, { phase: 'roar', t: 0.5 });
      }
    } else if (tg.phase === 'roar') {
      sp.setFrame('tora_roar');
      if (tg.t <= 0) Object.assign(tg, { phase: 'rest', t: T.rest });
    }
    // after a few leaps low down it goes back up the screen to start again from near her
    if (tg.phase === 'rest' && sp.y > s.H * 0.55) {
      sp.y -= 60 * dt;
      tg.t = Math.max(tg.t, 0.1);
    }
    if (pl.alive && Math.abs(pl.x - sp.x) < 12 && Math.abs(pl.y - sp.y) < 11) pl.hit();
  },

  /** Her face: throwing, haggling (fist up, mouth wide), the blouse empty once the tiger is off it. */
  obachanPose(g) {
    const e = g.body;
    const bare = g.tiger ? '_bare' : '';
    const pose = g.t < (g.shoutT ?? 0) ? '_shout' : g.t < (g.throwT ?? 0) ? '_1' : bare ? '' : '_0';
    const frame = `baba${bare}${pose}`;
    if (e.texture.has(frame) && e.frame.name !== frame) e.setFrame(frame);
  },

  obachanCleanup(g) {
    for (const it of g.items) this.segPool.kill(it.spr);
    for (const c of g.carts) this.segPool.kill(c.spr);
    if (g.tiger) this.segPool.kill(g.tiger.spr);
    g.items = [];
    g.carts = [];
    g.tiger = null;
  },
};
