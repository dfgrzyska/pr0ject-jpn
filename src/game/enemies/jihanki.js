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
  home: 82,
  phase: [0.66, 0.33],
  puddle: { r: 15, life: 5.5 },
  shake: 2.4,
  jackpot: 0.35,
  stun: 3.5,
  stunTake: 1.6,
  gift: 3000, // points for a free (golden) can caught
};
// the lottery display's four digits, relative to the machine's centre (logical px)
const DIGITS = [-8.5, -4.5, -0.5, 3.5].map((dx) => [dx, 14.3]);

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
      x: w.x, cans: [], puddles: [], digits: [], lottery: null, shakeT: 0, jet: null, stun: 0, rage: 0, hop: null, hopT: 1.6, openT: 0, take: { body: 1 },
    };
    const body = this.pool.spawn('jihanki_0', w.x, -80, { ...base, role: 'body', group: g, hp: JIHANKI.hp, maxHp: JIHANKI.hp, radius: 20, segs: [{ x: 0, y: 0, r: 19 }, { x: 0, y: 0, r: 19 }] });
    body.setDepth(DEPTH.air - 0.1);
    g.body = body;
    g.parts.push(body);
    g.maxTotal = JIHANKI.hp;
    if (body.texture.has('led_off')) for (let i = 0; i < 4; i++) g.digits.push(this.segPool.spawn('led_off', body.x, body.y).setDepth(DEPTH.air - 0.09));
    this.bossGroup = g;
    return body;
  },

  updateJihanki(g, dt) {
    const s = this.scene;
    const e = g.body;
    g.t += dt;
    this.jihankiCans(g, dt);
    this.jihankiPuddles(g, dt);
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
    const e = g.body;
    const b = this.scene.bullets;
    switch (g.phase % 3) {
      case 0:
        this.jihankiDispense(g, g.step % 2 ? 'cold' : 'hot', 'ring');
        g.timer = 0.6;
        if (++g.step >= 3) this.jihankiNext(g);
        break;
      case 1:
        // the change: a fan of coins at the player
        for (let i = 0; i < 7; i++) b.shot('eb_pearl', e.x + 15, e.y - 4, this.aimAt(e, 15, -4) + (i / 6 - 0.5) * 1.1, normal, 2);
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
    const b = this.scene.bullets;
    switch (g.phase % 3) {
      case 0:
        g.shakeT = JIHANKI.shake;
        this.scene.fx.text(e.x, e.y - 44, 'SZURU SZURU!', 1, 0x9ad8ff);
        this.jihankiNext(g);
        break;
      case 1:
        this.jihankiDispense(g, g.step % 2 ? 'cold' : 'hot', 'spiral');
        g.timer = 0.55;
        if (++g.step >= 4) this.jihankiNext(g);
        break;
      default:
        for (let i = 0; i < 9; i++) b.shot('eb_pearl', e.x + 15, e.y - 4, this.aimAt(e, 15, -4) + (i / 8 - 0.5) * 1.4, normal, 2);
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

  /** Out of the flap and in an arc at the player: a can, which spills where it lands. */
  jihankiDispense(g, kind, burst) {
    const s = this.scene;
    const e = g.body;
    const pl = s.player;
    const tx = Phaser.Math.Clamp(pl.x + (Math.random() - 0.5) * 50, 14, VIEW.width - 14);
    const ty = Phaser.Math.Clamp(pl.y + (Math.random() - 0.5) * 30, s.H * 0.45, s.H - 16);
    this.jihankiCan(g, kind, e.x, e.y + 26, tx, ty, 1.05, 'lob', burst);
    g.openT = 0.25;
    s.sfx.explode('s');
  },

  jihankiCan(g, kind, x, y, tx, ty, dur, mode, burst) {
    const frame = `can_${kind}`;
    if (!g.body.texture.has(frame)) return;
    const spr = this.segPool.spawn(frame, x, y).setDepth(DEPTH.air + 0.05);
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
        if (!g.defeated && this.canFire(g.body)) b.fire(x, g.body.y + 30, DOWN, slow);
      });
    }
  },

  /** It shakes itself and the screen; the carbonation builds; at the end the foam bursts out. */
  jihankiShake(g, dt) {
    const s = this.scene;
    g.shakeT -= dt;
    s.cameras.main.shake(60, 0.004 + (g.stage >= 3 ? 0.002 : 0));
    if (Math.random() < dt * 8) s.fx.puff('wisp_s_1', g.body.x + (Math.random() - 0.5) * 40, g.body.y + 30, 0.3);
    if (g.shakeT <= 0) {
      g.jet = { t: 0, dur: g.stage >= 3 ? 1.1 : 1.6, fire: 0 };
      s.fx.text(g.body.x, g.body.y + 40, 'PSSSHHH!', 1, 0xd8f0ff);
      s.sfx.explode('m');
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
      for (const sx of [-1, 1]) this.scene.bullets.shot('eb_ice', e.x + sx * 8, e.y + 28, DOWN + sx * sweep, normal * 0.9, 1.8);
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
        s.fx.text(e.x, e.y - 46, 'ATARI!', 1.6, 0xffe080);
        s.fx.text(e.x, e.y - 34, 'DARMOWY NAPÓJ!', 1.4, 0xffe080);
        g.stun = JIHANKI.stun;
        // free golden cans tumble out towards the player
        for (let i = 0; i < 3; i++) {
          const tx = Phaser.Math.Clamp(s.player.x + (i - 1) * 34, 14, VIEW.width - 14);
          this.jihankiCan(g, 'gold', e.x, e.y + 26, tx, Phaser.Math.Clamp(s.player.y - 10, s.H * 0.5, s.H - 20), 1.0 + i * 0.12, 'lob', 'gift');
        }
      } else {
        s.fx.text(e.x, e.y - 46, 'HAZURE...', 1.4, 0xb0aec0);
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

  /** Where and how it stands: hopping, shaking, reeling; its frame; the lottery's digits on it; its hit circles. */
  jihankiPose(g, dt) {
    const e = g.body;
    const shake = g.shakeT > 0 ? 2.5 : g.rage > 0 ? 1.2 : g.stun > 0 ? 0.8 : 0;
    e.x = g.x + (shake ? (Math.random() - 0.5) * 2 * shake : 0);
    if (g.state === 'fight') e.y = JIHANKI.home - (g.hop?.lift ?? 0) + Math.sin(g.t * 1.7) * 1.2;
    // (it rattles and hops upright: turned even a little, the big cabinet drew broken into triangles in testing)
    if (e.rotation) e.setRotation(0);
    if (g.openT > 0) g.openT -= dt;
    const frame = g.openT > 0 && g.stage === 1 ? 'jihanki_open' : g.stage >= 3 ? 'jihanki_3' : g.stage === 2 ? 'jihanki_2' : Math.floor(g.t * 2) % 2 ? 'jihanki_1' : 'jihanki_0';
    if (e.texture.has(frame) && e.frame.name !== frame) e.setFrame(frame);
    e.flash = g.stun > 0 && Math.floor(g.t * 10) % 2 ? 0.02 : e.flash;
    const sn = Math.sin(e.rotation);
    const cs = Math.cos(e.rotation);
    g.digits.forEach((d, i) => {
      const [dx, dy] = DIGITS[i];
      const v = g.lottery ? g.lottery.vals[i] : null;
      d.setFrame(v === null ? 'led_off' : `led_${v}`).setPosition(e.x + dx * cs - dy * sn, e.y + dx * sn + dy * cs).setRotation(e.rotation).setAlpha(e.alpha).setVisible(e.visible);
    });
    const [top, bot] = e.segs;
    Object.assign(top, { x: e.x + 18 * sn, y: e.y - 18 * cs });
    Object.assign(bot, { x: e.x - 18 * sn, y: e.y + 18 * cs });
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
      // the splash: the splat hurts right there, the can's drink spills into a puddle, drops fly out
      this.segPool.kill(c.spr);
      b.shot('splat', c.tx, c.ty, 0, 0, 6, { life: 0.12 });
      s.fx.shards(c.tx, c.ty, 6, true);
      this.jihankiPuddle(g, c.kind === 'hot', c.tx, c.ty);
      if (this.canFire(g.body) || c.mode === 'drop') {
        const frame = c.kind === 'hot' ? 'eb_lava' : 'eb_ice';
        const off = Math.random() * TAU;
        if (c.burst === 'spiral') for (let i = 0; i < 10; i++) b.shot(frame, c.tx, c.ty, off + (i / 10) * TAU, slow * (0.7 + (i % 2) * 0.35), 1.8);
        else for (let i = 0; i < 6; i++) b.shot(frame, c.tx, c.ty, off + (i / 6) * TAU, slow * 0.85, 1.8);
      }
    }
    g.cans.length = n;
  },

  jihankiPuddle(g, hot, x, y) {
    const frame = `puddle_${hot ? 'hot' : 'cold'}_0`;
    if (!g.body.texture.has(frame)) return;
    const spr = this.segPool.spawn(frame, x, y).setDepth(DEPTH.ground + 0.5).setAlpha(0);
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

  /** It's over: its cans, puddles and digits go with it. */
  jihankiCleanup(g) {
    for (const c of g.cans) this.segPool.kill(c.spr);
    for (const p of g.puddles) this.segPool.kill(p.spr);
    for (const d of g.digits) this.segPool.kill(d);
    g.cans = [];
    g.puddles = [];
    g.digits = [];
  },
};
