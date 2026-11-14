// Random encounter 1 (ex1): the vending machine that has had enough. Methods of Enemies (mixed in like the cities').
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * The vending machine (JIHANKI): life, where it stands, the phases' thresholds (share of life left), its cans'
 * puddles (radius, seconds), how long it shakes, the lottery's odds of a win and how long a win stuns it, how much
 * more of a hit it takes then. Its body: three hit circles down the cabinet.
 */
export const JIHANKI = {
  hp: 2600,
  home: 86,
  scale: 1.3, // shown bigger than drawn (its art is 56 x 82)
  phase: [0.66, 0.33],
  puddle: { r: 15, life: 5.5 },
  shake: 2.4,
  jackpot: 0.35,
  stun: 3.5,
  stunTake: 1.6,
  gift: 3000, // points for a free (golden) can caught
};
// places on the machine, from its art (fine px of the 168 x 246 frame) to logical px off its centre, as shown
const at = (fx, fy) => [((fx - 84) / 3) * JIHANKI.scale, ((fy - 123) / 3) * JIHANKI.scale];
const DIGITS = [48, 62, 76, 90].map((fx) => at(fx, 185)); // the lottery display's four digits
const MOUTH = at(69, 206); // the flap the cans come out of
const COINS = at(134, 140); // the change cup
const FEET = at(84, 244)[1]; // where it stands

export const jihanki = {
  /**
   * A street vending machine hops onto the screen, its red header glaring with two angry eyes. Three phases:
   * 1. it dispenses: hot cans (red) and cold cans (blue) lobbed at the player; where they land they spill, a
   *    puddle of hot coffee (overheats the guns, as the steam does in Beppu) or of icy slush (frosts the ship
   *    over, slows it, freezes it solid if it stays); coins flung in fans; the buttons light up one by one along
   *    its front, a curtain of shots with a gap somewhere;
   * 2. WSTRZĄŚNIĘTY: it shakes itself, and the whole screen with it, the carbonation building, then two jets of
   *    foam sweep out of the flap; its shaken cans burst into spirals where they land;
   * 3. ATARI!: the lottery display spins; four of a kind and it is stunned, spitting out free golden cans (catch
   *    them for points, or a bomb if yours is spent), and takes more of a hit for a while; a miss and it rages,
   *    cans raining down from the top of the screen. Between draws it hops after the player.
   */
  spawnJihanki(w, base) {
    const g = {
      kind: 'jihanki', state: 'enter', t: 0, stage: 1, phase: 0, step: 0, timer: 1.4, parts: [], awake: false, defeated: false,
      x: w.x, cans: [], puddles: [], digits: [], bits: [], lottery: null, shakeT: 0, jet: null, stun: 0, rage: 0, hop: null, hopT: 1.6, openT: 0, take: { body: 1 },
    };
    const body = this.pool.spawn('jihanki_0', w.x, -80, { ...base, role: 'body', group: g, hp: JIHANKI.hp, maxHp: JIHANKI.hp, radius: 26, flashTint: 0x1c1c1c, segs: [{ x: 0, y: 0, r: 25 }, { x: 0, y: 0, r: 25 }] });
    body.setDepth(DEPTH.air - 0.1).setScale(body.base * JIHANKI.scale);
    g.body = body;
    g.parts.push(body);
    g.maxTotal = JIHANKI.hp;
    if (body.texture.has('led_off'))
      for (let i = 0; i < 4; i++) {
        const d = this.segPool.spawn('led_off', body.x, body.y).setDepth(DEPTH.air - 0.09);
        g.digits.push(d.setScale(d.base * JIHANKI.scale));
      }
    // its shadow on the ground: it stays down while the machine hops
    if (body.texture.has('jihanki_shadow')) g.shadow = this.segPool.spawn('jihanki_shadow', w.x, -80).setDepth(DEPTH.ground + 0.4).setAlpha(0);
    this.bossGroup = g;
    return body;
  },

  updateJihanki(g, dt) {
    const s = this.scene;
    const e = g.body;
    g.t += dt;
    this.jihankiCans(g, dt);
    this.jihankiPuddles(g, dt);
    this.jihankiBits(g, dt);
    if (g.state === 'enter') {
      e.y += Math.max(10, (JIHANKI.home - e.y) * 1.4) * dt;
      if (e.y >= JIHANKI.home - 1) {
        Object.assign(g, { state: 'fight', awake: true, timer: 1 });
        s.cameras.main.shake(260, 0.007);
        s.sfx.explode('m');
      }
      return this.jihankiPose(g, dt);
    }
    // the phases
    const left = e.hp / e.maxHp;
    if (g.stage === 1 && left < JIHANKI.phase[0]) {
      Object.assign(g, { phase: 0, step: 0 });
      this.phaseBreak(g, e.x, e.y, 2, 'WSTRZĄŚNIĘTY, NIE ZMIESZANY');
    } else if (g.stage === 2 && left < JIHANKI.phase[1]) {
      Object.assign(g, { phase: 0, step: 0, shakeT: 0, jet: null });
      this.phaseBreak(g, e.x, e.y, 3, 'LOTERIA');
    }
    g.take.body = g.stun > 0 ? JIHANKI.stunTake : 1;
    if (g.stun > 0) g.stun -= dt;
    if (g.rage > 0) this.jihankiRage(g, dt);
    if (g.shakeT > 0) this.jihankiShake(g, dt);
    if (g.jet) this.jihankiJet(g, dt);
    if (g.lottery) this.jihankiLottery(g, dt);
    this.jihankiHop(g, dt);
    this.jihankiPose(g, dt);
    g.timer -= dt;
    if (g.timer > 0 || g.lottery || g.stun > 0 || g.shakeT > 0 || g.jet || g.rage > 0 || !this.canFire(e)) return;
    if (g.stage === 1) this.jihankiOne(g);
    else if (g.stage === 2) this.jihankiTwo(g);
    else this.jihankiThree(g);
  },

  jihankiNext(g) {
    g.phase++;
    g.step = 0;
    g.timer = 1;
  },

  /** Phase 1: cans, coins, the curtain of its buttons. */
  jihankiOne(g) {
    switch (g.phase % 3) {
      case 0:
        this.jihankiDispense(g, g.step % 2 ? 'cold' : 'hot', 'ring');
        g.timer = 0.6;
        if (++g.step >= 3) this.jihankiNext(g);
        break;
      case 1:
        // the change: a fan of coins at the player
        this.jihankiCoins(g, 7, 1.1);
        g.timer = 0.55;
        if (++g.step >= 2) this.jihankiNext(g);
        break;
      default:
        this.jihankiCurtain(g);
        g.timer = 1.2;
        if (++g.step >= 2) this.jihankiNext(g);
    }
  },

  /** Phase 2: shaking itself up, then the foam; shaken cans; heavier change. */
  jihankiTwo(g) {
    const e = g.body;
    switch (g.phase % 3) {
      case 0:
        g.shakeT = JIHANKI.shake;
        this.scene.fx.text(e.x, e.y - 60, 'SZURU SZURU!', 1, 0x9ad8ff);
        this.jihankiNext(g);
        break;
      case 1:
        this.jihankiDispense(g, g.step % 2 ? 'cold' : 'hot', 'spiral');
        g.timer = 0.55;
        if (++g.step >= 4) this.jihankiNext(g);
        break;
      default:
        this.jihankiCoins(g, 9, 1.4);
        g.timer = 0.6;
        if (++g.step >= 3) this.jihankiNext(g);
    }
  },

  /** Phase 3: the lottery, a quick round of cans, a short shake. */
  jihankiThree(g) {
    switch (g.phase % 3) {
      case 0:
        // the first draw in this phase always misses (the machines are like that)
        g.draws = (g.draws ?? 0) + 1;
        g.lottery = { t: 0, win: g.draws > 1 && Math.random() < JIHANKI.jackpot, vals: [0, 0, 0, 0] };
        this.jihankiNext(g);
        break;
      case 1:
        this.jihankiDispense(g, g.step % 2 ? 'cold' : 'hot', g.step % 2 ? 'spiral' : 'ring');
        g.timer = 0.45;
        if (++g.step >= 5) this.jihankiNext(g);
        break;
      default:
        g.shakeT = JIHANKI.shake * 0.6;
        this.jihankiNext(g);
    }
  },

  /** The change: a fan of 5-yen coins out of the change cup, at the player. */
  jihankiCoins(g, n, arc) {
    const e = g.body;
    const [ox, oy] = COINS;
    const aim = this.aimAt(e, ox, oy);
    for (let i = 0; i < n; i++) this.scene.bullets.shot('jb_coin', e.x + ox, e.y + oy, aim + (i / (n - 1) - 0.5) * arc, normal, 2);
    this.scene.fx.text(e.x + ox + 4, e.y + oy - 10, 'CHARIN!', 0.5, 0xffe080);
  },

  /** Out of the flap and in an arc at the player: a can, which spills where it lands. */
  jihankiDispense(g, kind, burst) {
    const s = this.scene;
    const e = g.body;
    const pl = s.player;
    const tx = Phaser.Math.Clamp(pl.x + (Math.random() - 0.5) * 50, 14, VIEW.width - 14);
    const ty = Phaser.Math.Clamp(pl.y + (Math.random() - 0.5) * 30, s.H * 0.45, s.H - 16);
    this.jihankiCan(g, kind, e.x + MOUTH[0], e.y + MOUTH[1], tx, ty, 1.05, 'lob', burst);
    g.openT = 0.25;
    s.sfx.explode('s');
  },

  jihankiCan(g, kind, x, y, tx, ty, dur, mode, burst) {
    const frame = `can_${kind}`;
    if (!g.body.texture.has(frame)) return;
    const spr = this.segPool.spawn(frame, x, y).setDepth(DEPTH.air + 0.05);
    spr.setScale(spr.base * 1.25);
    g.cans.push({ spr, kind, x0: x, y0: y, tx, ty, t: 0, dur, mode, burst, spin: (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 4) });
  },

  /** The buttons light up along the front, one shot falling from each, with a gap of three somewhere. */
  jihankiCurtain(g) {
    const b = this.scene.bullets;
    const n = 15;
    const gap = 2 + Math.floor(Math.random() * (n - 5));
    for (let i = 0; i < n; i++) {
      if (i >= gap && i < gap + 3) continue;
      const x = 8 + (i / (n - 1)) * (VIEW.width - 16);
      this.scene.time.delayedCall(i * 45, () => {
        if (!g.defeated && this.canFire(g.body)) b.fire(x, g.body.y + 40, DOWN, slow);
      });
    }
  },

  /** It shakes itself and the screen; the carbonation builds; at the end the foam bursts out. */
  jihankiShake(g, dt) {
    const s = this.scene;
    g.shakeT -= dt;
    const e = g.body;
    s.cameras.main.shake(60, 0.004 + (g.stage >= 3 ? 0.002 : 0));
    // the pressure building: caps popping off the top, foam squeezing out of its seams
    if (Math.random() < dt * 4) {
      const side = Math.random() < 0.5 ? -1 : 1;
      this.jihankiBit(g, 'cap', e.x + side * 20, e.y - 46, side * (30 + Math.random() * 40), -110 - Math.random() * 60, { ay: 320, life: 1.2, frames: ['cap_0', 'cap_1'], rate: 14 });
      s.fx.text(e.x + side * 26, e.y - 52, 'PON!', 0.4, 0xffffff);
    }
    if (Math.random() < dt * 14) {
      const side = Math.random() < 0.5 ? -1 : 1;
      this.jihankiBit(g, 'foam', e.x + side * 36, e.y + (Math.random() - 0.3) * 60, side * (8 + Math.random() * 14), 10 + Math.random() * 20, { size: Math.random() < 0.7 ? 0 : 1, life: 0.9, grow: 0.8 });
    }
    if (g.shakeT <= 0) {
      g.jet = { t: 0, dur: g.stage >= 3 ? 1.1 : 1.6, fire: 0, cloud: 0 };
      s.fx.text(e.x, e.y + 56, 'PSSSHHH!', 1, 0xd8f0ff);
      s.sfx.explode('m');
      // the burst: a cloud of foam out of the mouth
      for (let i = 0; i < 10; i++) {
        const a = DOWN + (Math.random() - 0.5) * 2.4;
        const v = 40 + Math.random() * 70;
        this.jihankiBit(g, 'foam', e.x + MOUTH[0], e.y + MOUTH[1], Math.cos(a) * v, Math.sin(a) * v, { size: 2 + (i % 2), life: 0.9, grow: 0.6, drag: 2 });
      }
    }
  },

  /** Two jets of foam sweeping out of the flap, crossing. */
  jihankiJet(g, dt) {
    const j = g.jet;
    const e = g.body;
    j.t += dt;
    if ((j.fire -= dt) <= 0 && this.canFire(e)) {
      j.fire = 0.055;
      const sweep = Math.sin(j.t * 3.2) * 1.05;
      for (const sx of [-1, 1]) this.scene.bullets.shot('jb_bubble', e.x + MOUTH[0] + sx * 10, e.y + MOUTH[1], DOWN + sx * sweep, normal * 0.9, 2);
    }
    // the jets themselves: billows of foam streaming out along them, swelling and thinning away
    if ((j.cloud -= dt) <= 0) {
      j.cloud = 0.03;
      const sweep = Math.sin(j.t * 3.2) * 1.05;
      for (const sx of [-1, 1]) {
        const a = DOWN + sx * sweep + (Math.random() - 0.5) * 0.25;
        const v = 120 + Math.random() * 60;
        this.jihankiBit(g, 'foam', e.x + MOUTH[0] + sx * 10, e.y + MOUTH[1] + 4, Math.cos(a) * v, Math.sin(a) * v, { size: 1 + Math.floor(Math.random() * 3), life: 0.45 + Math.random() * 0.2, grow: 1.2, drag: 1.6 });
      }
    }
    if (j.t > j.dur) {
      g.jet = null;
      g.timer = 0.8;
    }
  },

  /** The lottery: the digits spin and stop one by one; four of a kind and it pays out (and reels), else it rages. */
  jihankiLottery(g, dt) {
    const s = this.scene;
    const L = g.lottery;
    L.t += dt;
    const win = L.win;
    const lucky = Math.floor(Math.random() * 10);
    L.lucky ??= win ? 7 : lucky;
    for (let i = 0; i < 4; i++) {
      const stopAt = 0.9 + i * 0.45;
      if (L.t < stopAt) L.vals[i] = Math.floor(L.t * 24 + i * 3) % 10;
      else if (!L[`s${i}`]) {
        L[`s${i}`] = true;
        // a miss: the last digit lands one off, of course
        L.vals[i] = win || i < 3 ? L.lucky : (L.lucky + 1 + Math.floor(Math.random() * 8)) % 10;
        s.sfx.pickup?.();
      }
    }
    if (L.t > 0.9 + 3 * 0.45 + 0.5 && !L.done) {
      L.done = true;
      const e = g.body;
      if (win) {
        s.fx.text(e.x, e.y - 64, 'ATARI!', 1.6, 0xffe080);
        s.fx.text(e.x, e.y - 52, 'DARMOWY NAPÓJ!', 1.4, 0xffe080);
        g.stun = JIHANKI.stun;
        // free golden cans tumble out towards the player
        for (let i = 0; i < 3; i++) {
          const tx = Phaser.Math.Clamp(s.player.x + (i - 1) * 34, 14, VIEW.width - 14);
          this.jihankiCan(g, 'gold', e.x + MOUTH[0], e.y + MOUTH[1], tx, Phaser.Math.Clamp(s.player.y - 10, s.H * 0.5, s.H - 20), 1.0 + i * 0.12, 'lob', 'gift');
        }
      } else {
        s.fx.text(e.x, e.y - 64, 'HAZURE...', 1.4, 0xb0aec0);
        g.rage = 2.6;
      }
    }
    if (L.t > 0.9 + 3 * 0.45 + 1.2) {
      g.lottery = null;
      g.timer = 0.6;
    }
  },

  /** A miss: it rages, and cans rain down from the top of the screen (a ring marks where each will land). */
  jihankiRage(g, dt) {
    const s = this.scene;
    g.rage -= dt;
    s.cameras.main.shake(40, 0.002);
    if ((g.rain = (g.rain ?? 0) - dt) <= 0) {
      g.rain = 0.26;
      const pl = s.player;
      const tx = Phaser.Math.Clamp(Math.random() < 0.5 ? pl.x + (Math.random() - 0.5) * 40 : 14 + Math.random() * (VIEW.width - 28), 12, VIEW.width - 12);
      const ty = s.H * (0.5 + Math.random() * 0.42);
      this.jihankiCan(g, Math.random() < 0.5 ? 'hot' : 'cold', tx, -12, tx, ty, 1.0, 'drop', 'ring');
    }
  },

  /** Between attacks it hops: across its row in phase 1-2, after the player in phase 3. */
  jihankiHop(g, dt) {
    const s = this.scene;
    const e = g.body;
    if (g.hop) {
      const h = g.hop;
      h.t += dt;
      const k = Math.min(1, h.t / 0.42);
      g.x = h.x0 + (h.x1 - h.x0) * k;
      h.lift = Math.sin(k * Math.PI) * 10;
      if (k >= 1) {
        g.hop = null;
        s.cameras.main.shake(110, 0.004);
        s.fx.puff('wisp_s_1', e.x - 14, e.y + 36, 0.4);
        s.fx.puff('wisp_s_1', e.x + 14, e.y + 36, 0.4);
      }
      return;
    }
    if (g.shakeT > 0 || g.jet || g.lottery || g.stun > 0) return;
    if ((g.hopT -= dt) <= 0) {
      g.hopT = g.stage >= 3 ? 1.3 : 2.2;
      const want = g.stage >= 3 ? s.player.x : 30 + Math.random() * (VIEW.width - 60);
      const x1 = Phaser.Math.Clamp(g.x + Phaser.Math.Clamp(want - g.x, -40, 40), 30, VIEW.width - 30);
      g.hop = { t: 0, x0: g.x, x1, lift: 0 };
    }
  },

  /** Where and how it stands: hopping, shaking, reeling; its face; the lottery's digits on it; its shadow. */
  jihankiPose(g, dt) {
    const e = g.body;
    const shake = g.shakeT > 0 ? 2.5 : g.rage > 0 ? 1.2 : g.stun > 0 ? 0.8 : 0;
    e.x = g.x + (shake ? (Math.random() - 0.5) * 2 * shake : 0);
    if (g.state === 'fight') e.y = JIHANKI.home - (g.hop?.lift ?? 0) + Math.sin(g.t * 1.7) * 1.2;
    // (it rattles and hops upright: turned even a little, the big cabinet drew broken into triangles in testing)
    if (e.rotation) e.setRotation(0);
    if (g.openT > 0) g.openT -= dt;
    const open = g.openT > 0;
    let frame;
    if (g.stage === 1) frame = open ? 'jihanki_open' : g.t % 3.4 < 0.13 ? 'jihanki_blink' : Math.floor(g.t * 2) % 2 ? 'jihanki_1' : 'jihanki_0';
    else if (g.stage === 2) frame = g.shakeT > 0 ? `jihanki_fizz_${Math.floor(g.t * 9) % 2}` : open ? 'jihanki_2_open' : 'jihanki_2';
    else frame = g.stun > 0 ? 'jihanki_dizzy' : g.shakeT > 0 ? `jihanki_fizz_${Math.floor(g.t * 9) % 2}` : open ? 'jihanki_3_open' : 'jihanki_3';
    if (e.texture.has(frame) && e.frame.name !== frame) e.setFrame(frame);
    e.flash = g.stun > 0 && Math.floor(g.t * 10) % 2 ? 0.02 : e.flash;
    g.digits.forEach((d, i) => {
      const [dx, dy] = DIGITS[i];
      const v = g.lottery ? g.lottery.vals[i] : null;
      d.setFrame(v === null ? 'led_off' : `led_${v}`).setPosition(e.x + dx, e.y + dy).setAlpha(e.alpha).setVisible(e.visible);
    });
    // the shadow stays on the ground, smaller and fainter the higher it hops
    if (g.shadow) {
      const lift = g.state === 'fight' ? JIHANKI.home - e.y : 0;
      const k = Math.max(0.5, 1 - lift / 40);
      g.shadow.setPosition(e.x, (g.state === 'fight' ? JIHANKI.home : e.y) + FEET - 2).setScale(g.shadow.base * JIHANKI.scale * k).setAlpha(g.state === 'fight' ? k : 0);
    }
    const [top, bot] = e.segs;
    Object.assign(top, { x: e.x, y: e.y - 24 });
    Object.assign(bot, { x: e.x, y: e.y + 24 });
  },

  /** The cans in flight: lobbed in an arc, or dropped from the top; where they land, a puddle and a burst. */
  jihankiCans(g, dt) {
    const s = this.scene;
    const b = s.bullets;
    const pl = s.player;
    let n = 0;
    for (const c of g.cans) {
      c.t += dt;
      const k = Math.min(1, c.t / c.dur);
      if (c.mode === 'gift-wait') {
        // a free can on the ground, bobbing, waiting to be caught (a few seconds)
        c.spr.y = c.ty + Math.sin(c.t * 6) * 1.5;
        c.spr.setAlpha(c.t > 2.6 && Math.floor(c.t * 10) % 2 ? 0.4 : 1);
        if (pl.alive && Math.hypot(pl.x - c.spr.x, pl.y - c.spr.y) < 10) {
          const pts = JIHANKI.gift * s.score.mult;
          s.score.add(pts);
          s.fx.text(c.spr.x, c.spr.y - 10, `+${pts}`, 1.1, 0xffe080);
          if (pl.bombs === 0) {
            pl.bombs = 1;
            s.fx.text(c.spr.x, c.spr.y - 20, 'BOMBA!', 1.1, 0xffe080);
          }
          s.sfx.pickup?.();
          this.segPool.kill(c.spr);
          continue;
        }
        if (c.t > 3.4) {
          this.segPool.kill(c.spr);
          continue;
        }
        g.cans[n++] = c;
        continue;
      }
      if (c.mode === 'drop') {
        c.spr.x = c.tx;
        c.spr.y = c.y0 + (c.ty - c.y0) * k * k;
      } else {
        c.spr.x = c.x0 + (c.tx - c.x0) * k;
        c.spr.y = c.y0 + (c.ty - c.y0) * k - Math.sin(k * Math.PI) * 30;
      }
      c.spr.rotation += c.spin * dt;
      // a hot can trails steam, a cold one glints with frost
      if ((c.trail = (c.trail ?? 0) - dt) <= 0 && c.kind !== 'gold') {
        c.trail = 0.07;
        if (c.kind === 'hot') this.jihankiBit(g, 'steam', c.spr.x, c.spr.y - 4, (Math.random() - 0.5) * 10, -18, { life: 0.5 });
        else this.jihankiBit(g, 'frost', c.spr.x + (Math.random() - 0.5) * 6, c.spr.y + (Math.random() - 0.5) * 6, 0, 8, { life: 0.35 });
      }
      // where it will land: a blinking ring, red for hot, blue for cold, gold for a gift
      const col = c.kind === 'hot' ? 0xff7050 : c.kind === 'cold' ? 0x8ad0ff : 0xffe080;
      if (Math.floor(c.t * 12) % 2) {
        this.tele.lineStyle(1, col, 0.8);
        this.tele.strokeEllipse(c.tx, c.ty, 22 * (1 - k * 0.5), 12 * (1 - k * 0.5));
      }
      if (k < 1) {
        g.cans[n++] = c;
        continue;
      }
      if (c.burst === 'gift') {
        c.mode = 'gift-wait';
        c.t = 0;
        c.spr.setRotation(0);
        g.cans[n++] = c;
        continue;
      }
      // the splash: the splat hurts right there, a crown of drink, a puddle, drops (or ice) flying out
      this.segPool.kill(c.spr);
      b.shot('splat', c.tx, c.ty, 0, 0, 6, { life: 0.12 });
      const hot = c.kind === 'hot';
      this.jihankiBit(g, 'splash', c.tx, c.ty - 6, 0, 0, { life: 0.24, frames: [0, 1, 2].map((f) => `splash_${hot ? 'hot' : 'cold'}_${f}`), rate: 12.5, scale: 1.3 });
      s.fx.text(c.tx, c.ty - 20, hot ? 'ACHI!' : 'HIYA!', 0.5, hot ? 0xffb080 : 0xc0ecff);
      this.jihankiPuddle(g, hot, c.tx, c.ty);
      if (this.canFire(g.body) || c.mode === 'drop') {
        const frame = hot ? 'jb_coffee' : 'jb_ice';
        const off = Math.random() * TAU;
        if (c.burst === 'spiral') for (let i = 0; i < 10; i++) b.shot(frame, c.tx, c.ty, off + (i / 10) * TAU, slow * (0.7 + (i % 2) * 0.35), 2, { spin: true });
        else for (let i = 0; i < 6; i++) b.shot(frame, c.tx, c.ty, off + (i / 6) * TAU, slow * 0.85, 2, { spin: true });
      }
    }
    g.cans.length = n;
  },

  jihankiPuddle(g, hot, x, y) {
    const frame = `puddle_${hot ? 'hot' : 'cold'}_0`;
    if (!g.body.texture.has(frame)) return;
    const spr = this.segPool.spawn(frame, x, y).setDepth(DEPTH.ground + 0.5).setAlpha(0);
    spr.setScale(spr.base * 1.1);
    g.puddles.push({ spr, hot, x, y, t: 0, life: JIHANKI.puddle.life, r: JIHANKI.puddle.r });
  },

  /** The puddles: hot coffee heats the guns, icy slush frosts the ship over; they soak away after a while. */
  jihankiPuddles(g, dt) {
    const s = this.scene;
    const pl = s.player;
    let hot = false;
    let cold = false;
    let n = 0;
    for (const p of g.puddles) {
      p.t += dt;
      const a = Math.min(1, p.t * 4) * Math.min(1, (p.life - p.t) / 0.8);
      p.spr.setAlpha(0.9 * a).setFrame(`puddle_${p.hot ? 'hot' : 'cold'}_${Math.floor(p.t * 3) % 2}`);
      if (pl.alive && a > 0.5 && ((pl.x - p.x) / p.r) ** 2 + ((pl.y - p.y) / (p.r * 0.62)) ** 2 < 1) {
        if (p.hot) hot = true;
        else cold = true;
      }
      // coffee steams, slush glints
      if (a > 0.5 && Math.random() < dt * (p.hot ? 5 : 3)) {
        const x = p.x + (Math.random() - 0.5) * p.r * 1.6;
        const y = p.y + (Math.random() - 0.5) * p.r * 0.6;
        if (p.hot) this.jihankiBit(g, 'steam', x, y - 4, (Math.random() - 0.5) * 6, -16, { life: 0.8 });
        else this.jihankiBit(g, 'frost', x, y, 0, 0, { life: 0.5 });
      }
      if (p.t >= p.life) {
        this.segPool.kill(p.spr);
        continue;
      }
      g.puddles[n++] = p;
    }
    g.puddles.length = n;
    if (g.state === 'fight' || g.puddles.length) pl.heatUpdate(dt, hot);
    if (cold) pl.frostUpdate(dt, true);
  },

  /**
   * Its little bits of show: popping caps, foam billowing and thinning, splashes, steam off hot coffee, frost glints.
   * kind: 'foam' (o.size 0-3; grows by o.grow over its life, slows by o.drag) | 'cap' | 'splash' (o.frames, o.rate) |
   * 'steam' | 'frost'.
   */
  jihankiBit(g, kind, x, y, vx, vy, o = {}) {
    const e = g.body;
    let spr = null;
    if (kind === 'foam' || kind === 'cap' || kind === 'splash') {
      const frame = kind === 'foam' ? `foam_${o.size ?? 1}` : o.frames?.[0];
      if (!frame || !e.texture.has(frame)) return;
      spr = this.segPool.spawn(frame, x, y).setDepth(kind === 'splash' ? DEPTH.air + 0.04 : DEPTH.air + 0.02);
      spr.setScale(spr.base * (o.scale ?? 1));
    } else if (kind === 'steam') {
      if (!e.texture.has('steam_0')) return;
      spr = this.segPool.spawn('steam_0', x, y).setDepth(DEPTH.air + 0.01);
      o = { ...o, frames: ['steam_0', 'steam_1', 'steam_2'], rate: 3 / (o.life ?? 0.6), grow: 0.5 };
    }
    g.bits.push({ kind, spr, x, y, vx, vy, t: 0, life: o.life ?? 0.6, ay: o.ay ?? 0, drag: o.drag ?? 0, grow: o.grow ?? 0, frames: o.frames, rate: o.rate ?? 10, s0: spr?.scaleX ?? 1 });
  },

  jihankiBits(g, dt) {
    let n = 0;
    for (const b of g.bits) {
      b.t += dt;
      const k = b.t / b.life;
      if (k >= 1) {
        if (b.spr) this.segPool.kill(b.spr);
        continue;
      }
      b.vy += b.ay * dt;
      if (b.drag) {
        b.vx *= Math.max(0, 1 - b.drag * dt);
        b.vy *= Math.max(0, 1 - b.drag * dt);
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.spr) {
        b.spr.setPosition(b.x, b.y);
        if (b.frames) b.spr.setFrame(b.frames[Math.min(b.frames.length - 1, Math.floor(b.t * b.rate)) % b.frames.length]);
        if (b.kind === 'cap') b.spr.setFrame(b.frames[Math.floor(b.t * b.rate) % 2]);
        if (b.grow) b.spr.setScale(b.s0 * (1 + b.grow * k));
        if (b.kind === 'foam') b.spr.setAlpha(1 - k * k);
        if (b.kind === 'steam') b.spr.setAlpha(Math.sin(k * Math.PI) * 0.8);
        if (b.kind === 'splash') b.spr.setAlpha(k > 0.7 ? (1 - k) / 0.3 : 1);
      } else if (b.kind === 'frost') {
        // a glint: a little white cross, twinkling
        const a = Math.sin(k * Math.PI);
        this.tele.lineStyle(1, 0xffffff, a);
        this.tele.lineBetween(b.x - 2, b.y, b.x + 2, b.y);
        this.tele.lineBetween(b.x, b.y - 2, b.x, b.y + 2);
      }
      g.bits[n++] = b;
    }
    g.bits.length = n;
  },

  /** It's over: its cans, puddles, digits, shadow and bits go with it. */
  jihankiCleanup(g) {
    for (const c of g.cans) this.segPool.kill(c.spr);
    for (const p of g.puddles) this.segPool.kill(p.spr);
    for (const d of g.digits) this.segPool.kill(d);
    for (const b of g.bits) if (b.spr) this.segPool.kill(b.spr);
    if (g.shadow) this.segPool.kill(g.shadow);
    g.cans = [];
    g.puddles = [];
    g.digits = [];
    g.bits = [];
    g.shadow = null;
  },
};
