import { DEPTH, VIEW } from '../../config.js';
import { volley } from '../../difficulty.js';
import { DOWN, TAU, slow, normal, fast, EXTRAS } from './shared.js';
import { hasEnemyFrame } from '../enemyArt.js';

// the Dutch-ship float's two broadside batteries: separate targets riding on its sides
const BATTERY = { hp: 85, weight: 0, score: 2500, radius: 6, explosion: 'm' };

export const nagasaki = {
  biidoro(e, dt, b) {
    if (e.state === 'enter') {
      e.y += Math.max(10, (e.stopY - e.y) * 2) * dt;
      if (e.y >= e.stopY - 1) { e.state = 'attack'; e.timer = .8; }
    } else if (e.state === 'attack') {
      e.timer -= dt;
      if (e.timer < 0 && this.canFire(e)) {
        const n = volley(5);
        for (let i = 0; i < n; i++) b.shot('eb_s', e.x, e.y + 7, DOWN + (i - (n - 1) / 2) * .28, slow, 1.8,
          { frz: { at: .65, hold: .35, turn: e.dir * .45, speed: normal } });
        e.timer = 1.8;
        if (++e.shots === 3) e.state = 'leave';
      }
    } else { e.y -= 45 * dt; e.x += e.dir * 12 * dt; }
  },
  hata(e, dt) {
    if (e.state === 'enter') {
      e.y += 38 * dt;
      if (e.age > 1) { e.state = 'hook'; e.timer = .7; }
    } else if (e.state === 'hook') {
      e.timer -= dt; e.x = Math.max(12, Math.min(168, e.x + e.dir * 58 * dt));
      e.rotation = e.dir * .4;
      if (e.timer <= 0) { e.state = 'aim'; e.timer = .55; }
    } else this.diver(e, dt);
  },
  // ---------------------------------------------------------------- Nagasaki miniboss: Oranda-bune
  /**
   * The Dutch-ship float of Nagasaki Kunchi, come to Dejima. A battery on each side is a target of its own:
   * shoot one off and that side falls silent (its planking burns). Three moods as the hull gives way:
   *   broadsides — sailing a figure of eight, each side fires a rolling salvo port by port down its length
   *     (announced along the ports), the bow chaser between them;
   *   mawashi — as the bearers spin the float at the festival: it stops, a ring warns, and it turns twice on
   *     the spot with both batteries firing out of its sides, a spiral that reverses next time (a burst of
   *     rings from the deck if no battery is left);
   *   full sail — it turns its bow on you, a lane lights up, it charges down that lane and backs off throwing
   *     powder kegs that burst where they land.
   */
  spawnOranda(e, base) {
    Object.assign(e, { y: -60, radius: 12, segs: [{ x: 0, y: 0, r: 10 }, { x: 0, y: 0, r: 10 }], kuroko: [], burnt: [null, null] });
    for (const side of [-1, 1]) {
      const k = this.pool.spawn('n_oranda_gun_0', e.x + side * 24, e.y, {
        ...base, ...EXTRAS, type: 'kuroko', def: BATTERY, hp: BATTERY.hp, maxHp: BATTERY.hp, radius: BATTERY.radius,
        role: side, master: e, state: 'fight', segs: [{ x: 0, y: 0, r: 5 }, { x: 0, y: 0, r: 5 }],
      });
      k.setDepth(DEPTH.air - 0.05).setFlipX(side > 0);
      e.kuroko.push(k);
    }
  },

  /** A point of the ship (lx across to its right, ly towards its bow) on the screen. */
  orandaAt(e, lx, ly) {
    const c = Math.cos(e.rotation);
    const s = Math.sin(e.rotation);
    // the sprite's bow points down: local +y is the bow, +x its starboard (the screen's left when unturned)
    return [e.x + lx * c - ly * s, e.y + lx * s + ly * c];
  },

  oranda(e, dt, b) {
    const s = this.scene;
    const H = s.H;
    const alive = e.kuroko.filter((k) => !k.dead && k.master === e && k.hp > 0);
    const has = (side) => alive.some((k) => k.role === side);
    // the batteries ride on the sides, the hull's hit circles fore and aft
    for (const k of alive) {
      const [x, y] = this.orandaAt(e, k.role * 24, -3);
      k.setPosition(x, y).setRotation(e.rotation);
      k.setFrame(e.flashSide === k.role && e.flashT > 0 ? 'n_oranda_gun_1' : 'n_oranda_gun_0');
      [k.segs[0].x, k.segs[0].y] = this.orandaAt(e, k.role * 24, -12);
      [k.segs[1].x, k.segs[1].y] = this.orandaAt(e, k.role * 24, 6);
    }
    [e.segs[0].x, e.segs[0].y] = this.orandaAt(e, 0, 28);
    [e.segs[1].x, e.segs[1].y] = this.orandaAt(e, 0, -30);
    e.flashT = Math.max(0, (e.flashT ?? 0) - dt);
    // a battery gone: its side burns
    for (const side of [-1, 1]) {
      const i = side < 0 ? 0 : 1;
      if (e.state !== 'enter' && !has(side) && !e.burnt[i]) {
        e.burnt[i] = this.woundPool.spawn('n_oranda_burnt', e.x, e.y);
        e.burnt[i].setFlipX(side > 0);
        s.fx.text(e.x + side * 26, e.y - 10, 'BURTA!', 1, 0xffc070);
      }
      const bt = e.burnt[i];
      if (bt) {
        const [x, y] = this.orandaAt(e, side * 24, -3);
        bt.setPosition(x, y).setRotation(e.rotation);
        if (Math.random() < dt * 5) s.fx.smoke(x, y - 4, 1, 1);
      }
    }

    if (e.state === 'enter') {
      e.y += Math.max(14, (74 - e.y) * 1.3) * dt;
      if (e.y >= 73) Object.assign(e, { state: 'fight', fight: 0, phase: 1, mode: 'sail', timer: 1.2, salvos: 0, side: 1, spins: 0 });
      return;
    }
    if (e.state === 'leave') {
      e.y -= 48 * dt;
      e.rotation *= Math.max(0, 1 - dt * 3);
      return;
    }
    e.fight += dt;
    if (e.fight > 52 && e.mode === 'sail') {
      e.state = 'leave';
      return;
    }
    const frac = e.hp / e.maxHp;
    const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
    if (phase > e.phase) {
      e.phase = phase;
      if (e.mode === 'sail' || e.mode === 'salvo') {
        e.mode = phase === 2 ? 'spinPrep' : 'chargePrep';
        e.timer = phase === 2 ? 1.1 : 0.9;
        e.salvo = null;
      }
      s.fx.text(e.x, e.y - 40, phase === 2 ? 'MAWASHI!' : 'PEŁNE ŻAGLE!', 1.4, 0xffd070);
      s.sfx.shout?.(0.8);
    }
    const fire = this.canFire(e);
    const p = s.player;

    if (e.mode === 'sail' || e.mode === 'salvo') {
      // a figure of eight over the upper screen, heeling into the turns
      const tx = 90 + Math.sin(e.fight * 0.5) * 46;
      const ty = 72 + Math.sin(e.fight) * 13;
      const vx = (tx - e.x) * Math.min(1, dt * 2);
      e.x += vx;
      e.y += (ty - e.y) * Math.min(1, dt * 2);
      e.rotation += (Math.max(-0.28, Math.min(0.28, (vx / dt) * 0.012)) - e.rotation) * Math.min(1, dt * 3);
    }
    if (e.mode === 'sail') {
      e.timer -= dt;
      // the next side to fire, a live one if there is any
      if (!has(e.side) && has(-e.side)) e.side = -e.side;
      const any = alive.length > 0;
      if (any && e.timer < 0.7) {
        // the warning: a gold line out of every port of that side
        this.tele.lineStyle(1, 0xf2c35e, 0.35 + 0.3 * Math.sin(e.timer * 30));
        for (let q = 0; q < 5; q++) {
          const [x, y] = this.orandaAt(e, e.side * 22, -20 + q * 10);
          const a = this.orandaAngle(e, e.side);
          this.tele.lineBetween(x, y, x + Math.cos(a) * 26, y + Math.sin(a) * 26);
        }
      }
      if (e.timer <= 0 && fire) {
        if (any) {
          e.mode = 'salvo';
          e.salvo = { side: e.side, port: 0, t: 0 };
        } else {
          // no batteries left: the deck guns ring out instead
          b.ring(e.x, e.y, 12, Math.random() * TAU, slow, true);
          e.timer = 1.3;
          if (++e.salvos % 2 === 0) e.mode = e.phase === 2 ? 'spinPrep' : e.phase === 3 ? 'chargePrep' : 'sail';
        }
      }
    } else if (e.mode === 'salvo') {
      // a rolling broadside, stern to bow, every port a little fan of three
      const v = e.salvo;
      v.t -= dt;
      if (v.t <= 0 && fire) {
        const [x, y] = this.orandaAt(e, v.side * 23, -20 + v.port * 10);
        const a = this.orandaAngle(e, v.side);
        const n = volley(3);
        for (let i = 0; i < n; i++) b.fire(x, y, a + (i - (n - 1) / 2) * 0.16, v.port % 2 ? normal : slow + 6);
        e.flashSide = v.side;
        e.flashT = 0.08;
        s.fx.smoke(x, y, 1, 1);
        v.port++;
        v.t = 0.1;
        if (v.port >= 5) {
          e.salvos++;
          e.side = -v.side;
          e.mode = 'sail';
          e.timer = e.phase === 1 ? 1.5 : 1.0;
          // the bow chaser answers every other salvo: three aimed shots from the lion's mouth
          if (e.salvos % 2 === 0) e.chaser = 3;
          if (e.phase === 2 && e.salvos % 2 === 0) Object.assign(e, { mode: 'spinPrep', timer: 1.1 });
          if (e.phase === 3) Object.assign(e, { mode: 'chargePrep', timer: 0.9 });
        }
      }
    } else if (e.mode === 'spinPrep') {
      // to the middle, bow down; a ring warns of the spin
      e.x += (90 - e.x) * Math.min(1, dt * 2.5);
      e.y += (80 - e.y) * Math.min(1, dt * 2.5);
      e.rotation += (Math.round(e.rotation / TAU) * TAU - e.rotation) * Math.min(1, dt * 4);
      e.timer -= dt;
      this.tele.lineStyle(1, 0xf2c35e, 0.3 + 0.4 * Math.abs(Math.sin(e.timer * 9)));
      this.tele.strokeCircle(e.x, e.y, 44 + e.timer * 18);
      if (e.timer <= 0) Object.assign(e, { mode: 'spin', spin: 0, turned: 0, spinDir: (e.spins++ % 2 ? -1 : 1), shotT: 0, ringT: 0.3 });
    } else if (e.mode === 'spin') {
      // mawashi: twice round on the spot, both sides firing as they come round
      e.spin += dt;
      const w = Math.min(3.0, 0.8 + e.spin * 1.4) * e.spinDir;
      e.rotation += w * dt;
      e.turned += Math.abs(w * dt);
      e.shotT -= dt;
      if (e.shotT <= 0 && fire) {
        for (const k of alive) {
          const [x, y] = this.orandaAt(e, k.role * 24, -3);
          b.fire(x, y, this.orandaAngle(e, k.role), normal);
          e.flashSide = k.role;
          e.flashT = 0.06;
        }
        e.shotT = 0.11;
      }
      if (!alive.length && (e.ringT -= dt) <= 0 && fire) {
        b.ring(e.x, e.y, 10, e.rotation, slow);
        e.ringT = 0.55;
      }
      if (Math.random() < dt * 12) s.fx.smoke(e.x + (Math.random() - 0.5) * 40, e.y + 30, 1, 1);
      if (e.turned >= TAU * 2) {
        e.rotation %= TAU;
        Object.assign(e, { mode: 'sail', timer: 1.4 });
      }
    } else if (e.mode === 'chargePrep') {
      // bow on to the player: a lane lights up, the float lines up at its head
      if (e.lane == null) e.lane = Math.max(34, Math.min(146, p.x));
      e.x += (e.lane - e.x) * Math.min(1, dt * 3);
      e.y += (66 - e.y) * Math.min(1, dt * 3);
      e.rotation += (Math.round(e.rotation / TAU) * TAU - e.rotation) * Math.min(1, dt * 5);
      e.timer -= dt;
      const a = 0.3 + 0.4 * Math.abs(Math.sin(e.timer * 14));
      this.tele.lineStyle(2, 0xff8a5a, a);
      this.tele.lineBetween(e.lane - 20, e.y + 46, e.lane - 20, H);
      this.tele.lineBetween(e.lane + 20, e.y + 46, e.lane + 20, H);
      if (e.timer <= 0) Object.assign(e, { mode: 'charge', x: e.lane });
    } else if (e.mode === 'charge') {
      e.y += 170 * dt;
      e.rotation = 0;
      if (Math.random() < dt * 30) s.fx.puff('splash', e.x + (Math.random() - 0.5) * 30, e.y - 40, 0.3);
      if (e.y >= H * 0.74) {
        s.cameras.main.shake(180, 0.005);
        Object.assign(e, { mode: 'return', kegs: 0, kegT: 0.2, lane: null });
      }
    } else if (e.mode === 'return') {
      // backing off up the screen, it lobs powder kegs over its sides
      e.y -= 62 * dt;
      e.kegT -= dt;
      if (e.kegT <= 0 && e.kegs < 3 && fire) {
        const side = e.kegs % 2 ? 1 : -1;
        const tx = Math.max(16, Math.min(164, e.x + side * (28 + e.kegs * 12)));
        const ty = Math.min(H - 30, e.y + 70 + e.kegs * 20);
        b.lob(e.x + side * 20, e.y, tx, ty, 1.1, 'keg', volley(6));
        e.kegs++;
        e.kegT = 0.55;
      }
      if (e.y <= 74) Object.assign(e, { mode: 'sail', timer: 0.8 });
    }
    // the bow chaser: aimed shots spaced apart
    if (e.chaser > 0 && fire && e.mode !== 'spin') {
      e.chaserT = (e.chaserT ?? 0) - dt;
      if (e.chaserT <= 0) {
        const [x, y] = this.orandaAt(e, 0, 42);
        b.fire(x, y, Math.atan2(p.y - y, p.x - x), fast);
        e.chaser--;
        e.chaserT = 0.16;
      }
    }
  },

  /** Which way the guns of one side point: straight out of that side, angled a little towards the bow. */
  orandaAngle(e, side) {
    // local (side, 0.5) turned with the ship: out of the side and slightly forward (down the screen)
    return Math.atan2(side * Math.sin(e.rotation) + 0.5 * Math.cos(e.rotation), side * Math.cos(e.rotation) - 0.5 * Math.sin(e.rotation));
  },

  /**
   * The festival dragon chasing its pearl, in three phases: the dance over the docks (fans from the mouth,
   * paired curling streams, a lantern procession with an announced safe lane); below 65% it coils round the
   * middle of the screen, fireworks bursting from its body; below 30% the golden rain over Inasa: it dances
   * 40% faster, its pearl splits into two orbs that fire at the player, and fireworks cross the sky.
   */
  spawnJaodori(w, base) {
    const g = { kind: 'jaodori', t: 0, ft: 0, phase: 0, step: 0, timer: 1.3, parts: [], defeated: false, stage: 1, coil: 0, fwT: 1, orbT: 1, xT: 2 };
    // over the night view from Inasa it rises out of the city's lights, small and far at first; elsewhere it
    // comes down from the top of the screen
    const rise = !!this.scene.stage.panorama;
    const y0 = rise ? Math.round(this.scene.H * 0.56) : -30;
    const e = this.pool.spawn('n_ja_0', 90, y0, { ...base, group: g, radius: 15, state: rise ? 'rise' : 'enter', pass: rise, harmless: rise });
    e.play('n_ja'); g.parts.push(e); g.maxTotal = e.maxHp;
    if (rise) e.setScale(0.3 * e.base).setAlpha(0);
    // Decorative puppet body has no collision: the clearly exposed head is the target.
    // the body: plain lengths, the ones with legs, the tail's end (the 540 px art has them; the old one only plain)
    const segFrame = (i) => {
      const name = i === 8 ? 'n_segment_tail' : i % 3 === 1 ? 'n_segment_leg' : 'n_segment';
      return hasEnemyFrame(name) ? name : 'n_segment';
    };
    g.body = Array.from({ length: 9 }, (_, i) => this.segPool.spawn(segFrame(i), 90, rise ? y0 + 6 : -60)
      .setDepth(DEPTH.air - .1 - i * .001).setAlpha(rise ? 0 : 1));
    g.pearl = this.segPool.spawn('n_pearl', 90, rise ? y0 + 4 : -40).setDepth(DEPTH.air - .05).setAlpha(rise ? 0 : 1);
    g.y0 = y0;
    this.bossGroup = g;
    return e;
  },
  updateJaodori(g, dt) {
    const e = g.parts[0];
    if (e.dead || e.hp <= 0) return;
    g.t += dt;
    let size = 1;
    if (e.state === 'rise') {
      // up out of the harbour lights, growing as it comes near; untouchable until it is here
      const k = Math.min(1, g.t / 2.8);
      const ease = k * k * (3 - 2 * k);
      e.y = g.y0 + (72 - g.y0) * ease;
      e.x = 90 + Math.sin(k * Math.PI) * 18;
      size = 0.3 + 0.7 * ease;
      e.setScale(size * e.base).setAlpha(Math.min(1, k * 2.5));
      if (k >= 1) Object.assign(e, { state: 'fight', pass: false, harmless: false });
    } else if (e.state === 'enter') {
      e.y += 32 * dt;
      if (e.y >= 72) e.state = 'fight';
    } else {
      g.ft += dt * (g.stage >= 3 ? 1.4 : 1);
      // phase 2 on: it coils round the middle of the screen (eased in), still swaying
      g.coil = Math.min(1, g.coil + (g.stage >= 2 ? dt / 1.5 : 0));
      const wx = 90 + Math.sin(g.ft * .65) * 39;
      const wy = 72 + Math.sin(g.ft * 1.1) * 9;
      const cx = 90 + Math.cos(g.ft * .9) * 48;
      const cy = 100 + Math.sin(g.ft * .9) * 30;
      e.x = wx + (cx - wx) * g.coil;
      e.y = wy + (cy - wy) * g.coil;
    }
    e.setRotation(Math.cos(g.ft * .65) * .22 * Math.min(1, g.ft));
    g.pearl.setPosition(e.x + Math.cos(g.ft * .65) * 20 * size, e.y + 29 * size).setScale(size * g.pearl.base).setAlpha(e.alpha);
    for (let i = 0; i < g.body.length; i++) {
      // Delayed head trajectory and a travelling ripple keep the puppet long and articulated.
      // Analytic offsets also keep its shape stable at different frame rates and during the rise.
      const p = g.body[i], lag = g.ft - (i + 1) * .16;
      const dx = (Math.sin(lag * .65) - Math.sin(g.ft * .65)) * 39 + Math.sin(g.t * 2 - i * .55) * 7;
      const dy = -12 - i * 7 + (Math.sin(lag * 1.1) - Math.sin(g.ft * 1.1)) * 9;
      p.setPosition(e.x + dx * size, e.y + dy * size);
      p.setScale((1 - i * .035) * size * p.base).setAlpha(e.alpha);
      // Each scale section points along the chain (local +y toward the tail) so the body reads as one coil.
      const prev = i === 0 ? e : g.body[i - 1];
      p.setRotation(Math.atan2(p.y - prev.y, p.x - prev.x) - Math.PI / 2);
    }
    if (g.pearl2) {
      // phase 3: the pearl split into two orbs circling the head
      const a = g.t * 2.2;
      g.pearl.setPosition(e.x + Math.cos(a) * 26, e.y + 10 + Math.sin(a) * 16);
      g.pearl2.setPosition(e.x - Math.cos(a) * 26, e.y + 10 - Math.sin(a) * 16).setAlpha(e.alpha);
    }
    if (e.state !== 'fight') return;
    if (g.stage === 1 && e.hp < e.maxHp * 0.65) {
      Object.assign(g, { phase: 0, step: 0, lane: null });
      this.phaseBreak(g, e.x, e.y, 2, 'SPIRALNY KORYTARZ');
    } else if (g.stage === 2 && e.hp < e.maxHp * 0.3) {
      Object.assign(g, { phase: 0, step: 0, lane: null, enraged: true });
      g.pearl2 = this.segPool.spawn('n_pearl', g.pearl.x, g.pearl.y).setDepth(DEPTH.air - .05);
      this.phaseBreak(g, e.x, e.y, 3, 'ZŁOTY DESZCZ NAD INASĄ');
    }
    if (!this.canFire(e)) return;
    this.jaodoriFireworks(g, e, dt);
    g.timer -= dt;
    const b = this.scene.bullets;
    const mx = e.x - Math.sin(e.rotation) * 18;
    const my = e.y + Math.cos(e.rotation) * 18;
    if (g.phase % 3 !== 2 && g.step === 0) {
      this.tele.lineStyle(1, 0xf2c35e, .35 + .25 * Math.sin(g.t * 12) ** 2);
      this.tele.strokeCircle(mx, my, 8 + Math.max(0, g.timer) * 4);
    }
    if (g.phase % 3 === 2 && g.step === 0) {
      const lane = 30 + (Math.floor(g.t / 2) % 3) * 60;
      if (g.lane == null) g.lane = lane;
      this.tele.lineStyle(2, 0x92d8b5, .5);
      this.tele.lineBetween(g.lane - 22, 100, g.lane - 22, this.scene.H);
      this.tele.lineBetween(g.lane + 22, 100, g.lane + 22, this.scene.H);
    }
    if (g.timer > 0) return;
    if (g.phase % 3 === 0) {
      b.fan(mx, my, this.aimAt(e, mx - e.x, my - e.y), 5, .76, slow);
      g.timer = .65;
      if (++g.step >= 3) { g.phase++; g.step = 0; g.timer = 1.2; }
    } else if (g.phase % 3 === 1) {
      for (const side of [-1, 1]) b.shot('eb_s', mx + side * 8, my,
        DOWN + side * (.25 + Math.sin(g.step * .5) * .2), normal, 1.8);
      g.timer = .2;
      if (++g.step >= 12) { g.phase++; g.step = 0; g.timer = 1.4; g.lane = null; }
    } else {
      // Fixed wide safe lane, announced before the first row. No aiming after commitment.
      const n = volley(11);
      for (let i = 0; i < n; i++) {
        const x = 10 + i * 160 / (n - 1);
        if (Math.abs(x - g.lane) > 22) b.shot('eb_s', x, 10, DOWN, slow, 1.8);
      }
      g.timer = .75;
      if (++g.step >= 3) { g.phase++; g.step = 0; g.timer = 1.5; }
    }
  },
  /** Phases 2 and 3: fireworks bursting from the body, the split pearl's orbs firing, crossed salvos. */
  jaodoriFireworks(g, e, dt) {
    if (g.stage < 2 || g.gate > 0) return;
    const s = this.scene;
    const b = s.bullets;
    if ((g.fwT -= dt) <= 0) {
      // a segment bursts into a small ring of sparks
      const seg = g.body[1 + Math.floor(Math.random() * (g.body.length - 1))];
      b.ring(seg.x, seg.y, g.stage >= 3 ? 7 : 6, Math.random() * TAU, slow);
      s.fx.light(seg.x, seg.y, 0.6, false, 0xf2c35e);
      g.fwT = g.stage >= 3 ? 1.1 : 0.9;
    }
    if (g.stage < 3) return;
    if ((g.orbT -= dt) <= 0) {
      // the orbs of the split pearl, by turns
      const o = (g.orbN = (g.orbN ?? 0) + 1) % 2 ? g.pearl : g.pearl2;
      b.fire(o.x, o.y, Math.atan2(s.player.y - o.y, s.player.x - o.x), normal);
      g.orbT = 0.7;
    }
    if ((g.xT -= dt) <= 0) {
      // fireworks crossing the sky: two lines of sparks from the top corners
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? 4 : VIEW.width - 4;
        for (let k = 0; k < 4; k++) b.shot('eb_s', x0, 6 + k * 9, DOWN + side * 0.62, slow, 1.8);
      }
      g.xT = 3.2;
    }
  },
};
