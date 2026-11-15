// Random encounter 6 (ex6): the grandma with the purple perm and the tiger on her blouse. Methods of Enemies (mixed
// in like the cities').
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * The grandma (OBACHAN): life, where she stands and how far she trots about, the phases' thresholds, how much bigger
 * than drawn she is shown; her sweets (speed, how long before they unwrap, how long the wrapper shows coming open,
 * how many shots in the ring); the trolley (how long its ruts are drawn in first, speed); the handbag (rings, shots
 * in each); the tiger off her blouse (how long it gathers itself, speed, rest between leaps, shots where it lands).
 */
export const OBACHAN = {
  hp: 2400,
  home: 82,
  trot: 38,
  phase: [0.66, 0.33],
  scale: 1.15,
  ame: { speed: 95, unwrap: 0.85, open: 0.28, ring: 5 },
  cart: { warn: 1.0, speed: 250, scale: 1.1 },
  bag: { rings: 4, n: 9 },
  tora: { aim: 0.95, lock: 0.3, speed: 290, rest: 1.1, ring: 8, scale: 1.1 },
};

const SWEETS = ['r', 'y', 'g', 'p'];
const SNOW = DEPTH.mid + 0.7; // prints and ruts: on the snow, under everything that moves
const at = (x, y) => [x * OBACHAN.scale, y * OBACHAN.scale];
// her throwing hand, her mouth and the whirling handbag, from her frame's centre
const HAND = at(22, -10);
const MOUTH = at(0, -8);
const BAG = at(-15, -24);

export const obachan = {
  /**
   * A stout grandma with a tight purple perm and a tiger's face on her black blouse, a handbag on her arm, sweets in
   * her pockets for everyone; she trots about the top of the screen. Three phases:
   * 1. AME-CHAN: she hands out sweets: wrapped sweets flung in fans, whose wrappers come open before they burst into
   *    rings; she calls her shopping trolley in (she points, its ruts are drawn across the snow from the side it
   *    will come, its nose rattles at the edge), and it rams across; she whirls her handbag (rings in a spiral);
   * 2. MAKETE!: she haggles: shouts that fire fans of big shots ("-50%"), trolleys from both sides;
   * 3. TYGRYS!: the tiger jumps off her blouse (a gap is left on it) and hunts the player on its own: it crouches,
   *    its haunches wiggling, paw prints run out across the snow to a ring where it will land; it leaps, lands
   *    with a roar (a ring), rests. She keeps handing out sweets and haggling.
   * Beaten, she sits down in the snow, puffing, and holds out one last sweet.
   */
  spawnObachan(w, base) {
    const g = { kind: 'obachan', state: 'enter', t: 0, stage: 1, phase: 0, timer: 1.2, parts: [], awake: false, defeated: false, act: null, items: [], carts: [], marks: [], tiger: null, face: 1, take: { body: 1 } };
    const body = this.pool.spawn('baba_walk1', 90, -56, { ...base, role: 'body', group: g, hp: OBACHAN.hp, maxHp: OBACHAN.hp, radius: 20 });
    body.setDepth(DEPTH.air - 0.1).setScale(body.base * OBACHAN.scale);
    g.body = body;
    g.parts.push(body);
    g.maxTotal = OBACHAN.hp;
    this.bossGroup = g;
    return body;
  },

  updateObachan(g, dt) {
    const e = g.body;
    g.t += dt;
    this.obachanItems(g, dt);
    this.obachanCarts(g, dt);
    this.obachanMarks(g, dt);
    if (g.tiger) this.obachanTiger(g, dt);
    if (g.state === 'enter') {
      e.y += Math.max(14, (OBACHAN.home - e.y) * 1.4) * dt;
      if (e.y >= OBACHAN.home - 1) {
        Object.assign(g, { state: 'fight', awake: true, timer: 1, laughT: g.t + 0.8 });
        this.obachanSay(g, 'ARA~!', 1, 0xd09af0);
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
    // she trots about (and stands still to whirl her bag or shout)
    const still = g.act && (g.act.kind === 'bag' || g.act.kind === 'haggle' || g.act.kind === 'cart');
    const tx = still ? e.x : 90 + Math.sin(g.t * 0.7) * OBACHAN.trot;
    g.moving = Math.abs(tx - e.x) > 0.6;
    e.x += (tx - e.x) * Math.min(1, dt * 2);
    e.y += (OBACHAN.home - e.y) * Math.min(1, dt * 6);
    if (g.act) this.obachanAct(g, dt);
    else if ((g.timer -= dt) <= 0 && this.canFire(e)) {
      const plan = [['ame', 'cart', 'ame', 'bag'], ['haggle', 'cart', 'ame', 'bag'], ['ame', 'haggle', 'bag', 'ame']][g.stage - 1];
      g.act = { kind: plan[g.phase++ % plan.length], t: 0, step: 0 };
    }
    this.obachanPose(g);
  },

  obachanDone(g, rest = 0.9) {
    g.act = null;
    g.timer = rest;
    if (rest >= 0.9 && Math.random() < 0.5) {
      g.laughT = g.t + 0.7;
      this.obachanSay(g, 'OHOHO!', 0.7, 0xd09af0);
    }
  },

  /** What she says, over her perm (under the life bar). */
  obachanSay(g, str, life = 0.8, tint = 0xffe080) {
    const e = g.body;
    this.scene.fx.text(e.x, Math.max(22, e.y - 54), str, life, tint);
  },

  obachanAct(g, dt) {
    const s = this.scene;
    const b = s.bullets;
    const a = g.act;
    const pl = s.player;
    const e = g.body;
    a.t += dt;
    switch (a.kind) {
      case 'ame': {
        // sweets for everyone: one drawn back over her shoulder, then a fan of them at the player; three times
        const n = g.stage === 3 ? 2 : 3;
        if (a.step < n && a.t > 0.3 + a.step * 0.6) {
          a.step++;
          g.throwT = g.t + 0.28;
          const [hx, hy] = HAND;
          const aim = this.aimAt(e, hx, hy);
          for (let i = -1; i <= 1; i++) {
            const ang = aim + i * 0.4 + (Math.random() - 0.5) * 0.1;
            const v = OBACHAN.ame.speed * (0.85 + Math.random() * 0.3);
            this.obachanItem(g, e.x + hx, e.y + hy, Math.cos(ang) * v, Math.sin(ang) * v, SWEETS[(a.step + i + 3) % 4]);
          }
          if (a.step === 1) this.obachanSay(g, 'AME, IRU?');
        }
        if (a.t > 0.3 + n * 0.6) this.obachanDone(g, 0.9);
        break;
      }
      case 'cart': {
        // the trolley across the screen at the player's height (both sides at once, haggling); she points it in
        if (a.step === 0) {
          a.step = 1;
          const y = Phaser.Math.Clamp(pl.y, s.H * 0.45, s.H - 20);
          const side = Math.random() < 0.5 ? -1 : 1;
          a.side = side;
          this.obachanCart(g, side, y);
          if (g.stage >= 2) this.obachanCart(g, -side, Phaser.Math.Clamp(y + (Math.random() < 0.5 ? -46 : 46), s.H * 0.4, s.H - 16), 0.5);
          this.obachanSay(g, 'DOITE DOITE!');
        }
        if (a.t > 2.3) this.obachanDone(g, 0.6);
        break;
      }
      case 'bag':
        // the handbag whirled over her head: rings in a spiral, after a turn or two to wind it up
        if (a.step < OBACHAN.bag.rings && a.t > 0.45 + a.step * 0.22) {
          const off = a.step * 0.24;
          a.step++;
          b.ring(e.x + BAG[0], e.y + BAG[1], OBACHAN.bag.n, off, slow);
        }
        if (a.t > 0.6 + OBACHAN.bag.rings * 0.22) this.obachanDone(g, 1);
        break;
      case 'haggle':
        // MAKETE!: a breath, a shout, a fan of big shots, the price slashed
        if (a.step < 3 && a.t > 0.3 + a.step * 0.7) {
          a.step++;
          g.shoutT = g.t + 0.4;
          b.fan(e.x + MOUTH[0], e.y + MOUTH[1], this.aimAt(e, ...MOUTH), 5, 1.1, normal, true);
          s.fx.text(e.x + (Math.random() - 0.5) * 40, e.y + 54, ['MAKETE!', '-50%', '-80%!'][a.step % 3], 0.9, 0xff8a6a);
          s.cameras.main.shake(120, 0.003);
        }
        if (a.t > 0.5 + 3 * 0.7) this.obachanDone(g, 1);
        break;
      default:
        this.obachanDone(g);
    }
  },

  obachanItem(g, x, y, vx, vy, col) {
    const frame = `ame_${col}_0`;
    if (!g.body.texture.has(frame)) return;
    const spr = this.segPool.spawn(frame, x, y).setDepth(DEPTH.air + 0.04);
    g.items.push({ spr, col, vx, vy, t: 0, unwrap: OBACHAN.ame.unwrap * (0.85 + Math.random() * 0.3) });
  },

  /** The sweets in flight: they tumble and slow; the wrapper comes open, shaking; then they burst into a little ring. */
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
      const opening = it.t > it.unwrap - OBACHAN.ame.open;
      sp.setFrame(`ame_${it.col}_${opening ? 2 : Math.floor(it.t * 10) % 2}`);
      sp.setRotation(opening ? Math.sin(it.t * 60) * 0.2 : it.t * 3);
      sp.setScale(sp.base * (opening ? 1.25 : 1));
      let gone = false;
      if (it.t > it.unwrap) {
        if (sp.y < s.H * 0.8) s.bullets.ring(sp.x, sp.y, OBACHAN.ame.ring, Math.random() * TAU, slow);
        s.fx.shards(sp.x, sp.y, 4, true);
        gone = true;
      } else if (pl.alive && Math.hypot(pl.x - sp.x, pl.y - sp.y) < 6) {
        pl.hit();
        gone = true;
      }
      if (gone) {
        sp.setRotation(0);
        this.segPool.kill(sp);
        continue;
      }
      g.items[n++] = it;
    }
    g.items.length = n;
  },

  /** A print or a rut in the snow: it comes up at `wait`, lies there, and fades when its time is over. */
  obachanMark(g, frame, x, y, { wait = 0, life = 1, rot = 0, pulse = false, scale = 1 } = {}) {
    if (!g.body.texture.has(frame)) return null;
    const spr = this.segPool.spawn(frame, x, y).setDepth(SNOW).setRotation(rot).setAlpha(0);
    spr.setScale(spr.base * scale);
    const m = { spr, wait, life, t: 0, pulse, frame, scale };
    g.marks.push(m);
    return m;
  },

  obachanMarks(g, dt) {
    let n = 0;
    for (const m of g.marks) {
      if (m.wait > 0) m.wait -= dt;
      else {
        m.t += dt;
        const left = m.life - m.t;
        m.spr.setAlpha(Math.min(1, m.t / 0.08, left / 0.25));
        if (m.pulse) {
          // the ring where the tiger will land: turning, tightening as the leap comes
          m.spr.setFrame(`pounce_${Math.floor(m.t * 10) % 2}`);
          m.spr.setScale(m.spr.base * m.scale * (1.25 - 0.25 * Math.min(1, m.t / m.pulse)));
        }
        if (left <= 0) {
          m.spr.setRotation(0);
          this.segPool.kill(m.spr);
          continue;
        }
      }
      g.marks[n++] = m;
    }
    g.marks.length = n;
  },

  obachanCart(g, side, y, delay = 0) {
    if (!g.body.texture.has('cart_0')) return;
    const x0 = side < 0 ? -24 : VIEW.width + 24;
    const spr = this.segPool.spawn('cart_0', x0, y).setDepth(DEPTH.air + 0.03).setFlipX(side < 0);
    spr.setScale(spr.base * OBACHAN.cart.scale);
    g.carts.push({ spr, side, y, x0, t: -delay, dropped: 0 });
    // its ruts, drawn across the snow from the side it will come, one stretch after another
    const W = OBACHAN.cart.warn;
    for (let i = 0; i < 12; i++) {
      const x = side < 0 ? 8 + i * 16 : VIEW.width - 8 - i * 16;
      this.obachanMark(g, 'rut', x, y + 9, { wait: delay + 0.1 + (i / 12) * W * 0.6, life: W * 0.9 - (i / 12) * W * 0.6 + 0.55 + i * 0.04 });
    }
  },

  /** The trolleys: ruts across the snow where one will come, its nose rattling at the edge; then it rams across. */
  obachanCarts(g, dt) {
    const s = this.scene;
    const pl = s.player;
    let n = 0;
    for (const c of g.carts) {
      c.t += dt;
      const sp = c.spr;
      if (c.t < OBACHAN.cart.warn) {
        // (waiting at the edge, half in, rattling; a bell now and then)
        sp.x = c.x0 - c.side * (c.t > 0 ? 12 : 0) + Math.round(Math.sin(c.t * 50));
        sp.setFrame(`cart_${Math.floor(Math.max(0, c.t) * 10) % 2}`);
        if (c.t > 0 && !c.rang) {
          c.rang = true;
          s.fx.text(c.side < 0 ? 18 : VIEW.width - 18, c.y - 16, 'CHIRIN!', 0.7, 0xffe080);
        }
      } else {
        sp.x -= c.side * OBACHAN.cart.speed * dt;
        sp.setFrame(`cart_${Math.floor(c.t * 16) % 4}`);
        // a sweet or two falls out of the basket as it goes; snow flies from its wheels
        if (c.dropped < 3 && Math.abs(sp.x - VIEW.width * (0.25 + c.dropped * 0.25)) < 6) {
          c.dropped++;
          s.bullets.fire(sp.x, sp.y - 8, DOWN + (Math.random() - 0.5) * 0.6, slow);
        }
        if (Math.random() < dt * 40) s.fx.part(s.fx.parts, 'flake_1', sp.x + c.side * 12, sp.y + 12, { vx: c.side * (20 + Math.random() * 40), vy: -10 - Math.random() * 20, drag: 3, life: 0.4, a0: 0.9 });
        if (pl.alive && Math.abs(pl.x - sp.x) < 16 && Math.abs(pl.y - sp.y) < 11) pl.hit();
        if ((c.side < 0 && sp.x > VIEW.width + 50) || (c.side > 0 && sp.x < -50)) {
          this.segPool.kill(sp);
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
    if (!e.texture.has('tora_sit')) return;
    const spr = this.segPool.spawn('tora_roar1', e.x, e.y + 8).setDepth(DEPTH.air + 0.02);
    spr.setScale(spr.base * OBACHAN.tora.scale);
    g.tiger = { spr, phase: 'roar', t: 0.7, age: 0 };
    this.obachanSay(g, 'GAOOO!', 1.2, 0xffb050);
    this.scene.cameras.main.shake(300, 0.006);
    this.scene.fx.shards(e.x, e.y, 12, true); // the print tearing off the cloth
  },

  /**
   * The tiger hunts on its own: it gathers itself (paw prints run out over the snow to the ring where it will land;
   * the place is fixed for the last third of the wait), leaps, lands with a roar, rests. It hurts to touch.
   */
  obachanTiger(g, dt) {
    const s = this.scene;
    const pl = s.player;
    const T = OBACHAN.tora;
    const tg = g.tiger;
    const sp = tg.spr;
    tg.t -= dt;
    tg.age += dt;
    let frame = 'tora_sit';
    if (tg.phase === 'rest') {
      frame = tg.age % 2.6 < 0.12 ? 'tora_blink' : tg.age % 4 > 3.4 ? 'tora_lick' : 'tora_sit';
      // after a leap low down it pads back up the screen to start again from nearer her
      if (sp.y > s.H * 0.55) {
        sp.y -= 60 * dt;
        tg.t = Math.max(tg.t, 0.1);
        frame = `tora_walk${Math.floor(tg.age * 7) % 2}`;
      } else if (tg.t <= 0 && this.canFire(g.body)) Object.assign(tg, { phase: 'aim', t: T.aim, marked: false });
    } else if (tg.phase === 'aim') {
      frame = `tora_crouch${Math.floor(tg.age * 9) % 2}`;
      if (!tg.marked) {
        // where it is going: fixed now, shown at once: the prints run out to it, the ring closes on it
        tg.marked = true;
        Object.assign(tg, { tx: Phaser.Math.Clamp(pl.x, 16, VIEW.width - 16), ty: Phaser.Math.Clamp(pl.y, s.H * 0.3, s.H - 24) });
        const dx = tg.tx - sp.x;
        const dy = tg.ty - sp.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        const rot = Math.atan2(dy, dx) + Math.PI / 2;
        const steps = Math.max(2, Math.floor(d / 13));
        for (let i = 1; i < steps; i++) {
          const k = i / steps;
          const off = i % 2 ? 4 : -4; // left paw, right paw
          this.obachanMark(g, 'paw', sp.x + dx * k + (-dy / d) * off, sp.y + dy * k + (dx / d) * off, { wait: k * T.aim * 0.5, life: T.aim * (1 - k * 0.5) + 0.5, rot });
        }
        this.obachanMark(g, 'pounce_0', tg.tx, tg.ty, { life: T.aim + d / T.speed + 0.1, pulse: T.aim });
        this.obachanMark(g, 'paw_big', tg.tx, tg.ty, { wait: T.aim * 0.3, life: T.aim * 0.7 + d / T.speed + 0.5, rot });
      }
      if (tg.t <= 0) Object.assign(tg, { phase: 'leap', x0: sp.x, y0: sp.y, k: 0, d: Math.max(1, Math.hypot(tg.tx - sp.x, tg.ty - sp.y)) });
    } else if (tg.phase === 'leap') {
      frame = 'tora_leap';
      tg.k = Math.min(1, tg.k + (T.speed * dt) / tg.d);
      sp.setPosition(tg.x0 + (tg.tx - tg.x0) * tg.k, tg.y0 + (tg.ty - tg.y0) * tg.k - Math.sin(tg.k * Math.PI) * 14);
      if (tg.k >= 1) {
        s.bullets.ring(sp.x, sp.y, T.ring, Math.random() * TAU, slow);
        s.fx.text(sp.x, sp.y - 24, 'GAO!', 0.8, 0xffb050);
        s.cameras.main.shake(120, 0.004);
        for (let i = 0; i < 10; i++) s.fx.part(s.fx.parts, 'flake_1', sp.x, sp.y + 14, { vx: (Math.random() - 0.5) * 120, vy: -20 - Math.random() * 40, drag: 3, life: 0.5, a0: 0.9 });
        Object.assign(tg, { phase: 'roar', t: 0.6 });
      }
    } else if (tg.phase === 'roar') {
      frame = tg.t > 0.48 ? 'tora_land' : Math.floor(tg.age * 12) % 2 ? 'tora_roar1' : 'tora_roar0';
      if (tg.t <= 0) Object.assign(tg, { phase: 'rest', t: T.rest });
    }
    if (sp.frame.name !== frame) sp.setFrame(frame);
    if (pl.alive && Math.abs(pl.x - sp.x) < 13 && Math.abs(pl.y - sp.y) < 12) pl.hit();
  },

  /** What she is doing, on her: throwing, haggling, whirling the bag, pointing the trolley in, laughing, trotting. */
  obachanPose(g) {
    const e = g.body;
    const a = g.act;
    const t = g.t;
    let pose;
    let flip = false;
    if (a?.kind === 'bag') pose = `bag${Math.floor(a.t * 14) % 4}`;
    else if (a?.kind === 'haggle') pose = t < (g.shoutT ?? 0) ? 'shout1' : 'shout0';
    else if (a?.kind === 'cart' && a.t < OBACHAN.cart.warn + 0.3) {
      pose = 'point';
      flip = a.side < 0; // (she points right as drawn)
    } else if (a?.kind === 'ame') pose = t < (g.throwT ?? 0) ? 'throw1' : 'throw0';
    else if (t < (g.laughT ?? 0)) pose = Math.floor(t * 9) % 2 ? 'laugh1' : 'laugh0';
    else if (g.moving || g.state === 'enter') pose = ['walk0', 'walk1', 'walk2', 'walk1'][Math.floor(t * 7) % 4];
    else pose = t % 3.7 < 0.5 ? 'peek' : 'walk1';
    const frame = `baba_${g.tiger ? 'bare_' : ''}${pose}`;
    if (e.texture.has(frame) && e.frame.name !== frame) e.setFrame(frame);
    if (e.flipX !== flip) e.setFlipX(flip);
  },

  obachanCleanup(g) {
    const s = this.scene;
    const won = g.body && g.body.hp <= 0;
    for (const it of g.items) {
      it.spr.setRotation(0);
      this.segPool.kill(it.spr);
    }
    for (const c of g.carts) this.segPool.kill(c.spr);
    for (const m of g.marks) {
      m.spr.setRotation(0);
      this.segPool.kill(m.spr);
    }
    if (g.tiger) {
      // the tiger sits down by her while she gets her breath back (the end 'sit' in Enemies.updateDying), and fades
      const sp = g.tiger.spr;
      if (won) {
        sp.setFrame('tora_sit');
        s.tweens.add({ targets: sp, x: g.body.x - 44, y: g.body.y + 22, duration: 700, ease: 'Sine.easeOut' });
        s.tweens.add({ targets: sp, alpha: 0, delay: 2500, duration: 700, onComplete: () => this.segPool.kill(sp) });
      } else this.segPool.kill(sp);
    }
    g.items = [];
    g.carts = [];
    g.marks = [];
    g.tiger = null;
  },
};
