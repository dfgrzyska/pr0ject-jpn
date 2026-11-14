// Sapporo: the lanterns' ice shells, flying squirrels, snowplows, Yuki-onna (the miniboss) and the Snow Festival bear (the boss).
// Methods of Enemies (src/game/Enemies.js mixes them in), so `this` is the enemies of the stage.
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { slow, normal, DOWN, TAU, EXTRAS } from './shared.js';
import { hasEnemyFrame } from '../enemyArt.js';

// Yuki-onna: her strength, how long she stays, her crystals (how many at once, how long they last), the mist,
// the whirlwind's drag (px/s) and the whiteout (s); her mirrors and the crystals as enemies
export const YUKI = { hp: 860, time: 52, crystals: 5, crystalLife: 6.5, mist: 4.6, pull: 26, whiteout: 4.4 };
const MIRROR = { hp: 45, weight: 0, score: 1500, radius: 11, explosion: 'm' };
const CRYSTAL = { hp: 12, weight: 0, score: 100, radius: 6, explosion: 's' };
// Three furnace charges melt the shell (encounters.js); the exposed bear brings a blizzard below `storm` HP.
const KUMA = { bear: 1060, storm: 0.45 };

export const sapporo = {
  /** The ice lantern's shell breaks: the bare flame flares up and fires faster. */
  shatter(e) {
    const s = this.scene;
    e.armor = 0;
    e.radius = 6;
    e.setRotation(0);
    e.play('wisp');
    s.fx.shards(e.x, e.y, 12);
    s.sfx.explode('s');
    if (e.state === 'leave') {
      e.state = 'attack';
      e.shots = 0;
    }
    e.shots += 2;
    e.timer = Math.max(e.timer, 0.45);
  },

  /**
   * Flying squirrel: hops in from the trees at a screen edge, blinks, then glides across in a swoop
   * that dips towards the player's height (never into the bottom quarter), and does it once more.
   */
  glide(e, dt) {
    const W = VIEW.width;
    const s = this.scene;
    if (e.state === 'enter') {
      const edge = e.dir > 0 ? 8 : W - 8;
      e.x += (edge - e.x) * Math.min(1, dt * 8);
      e.setFlipX(e.dir < 0);
      e.timer -= dt;
      if (e.timer <= 0) {
        e.state = 'cling';
        e.timer = 0.45;
      }
    } else if (e.state === 'cling') {
      e.timer -= dt;
      e.flash = Math.floor(e.timer * 20) % 2 ? 0.02 : 0;
      if (e.timer <= 0) {
        e.state = 'leap';
        e.k = 0;
        e.xs = e.x;
        e.ys = e.y;
        e.yt = Phaser.Math.Clamp(s.player.y, e.ys + 30, s.H * 0.72);
        e.play('momonga');
      }
    } else if (e.state === 'leap') {
      e.k += dt / 1.7;
      const k = Math.min(1, e.k);
      const xe = e.dir > 0 ? W - 8 : 8;
      e.x = e.xs + (xe - e.xs) * k;
      e.y = e.ys + (e.yt - e.ys) * Math.sin(Math.PI * k) + 16 * k;
      if (k >= 1) {
        e.leaps++;
        e.dir = -e.dir;
        if (e.leaps >= 2) {
          e.state = 'leave';
          e.vy = 30;
        } else {
          e.state = 'cling';
          e.timer = 0.5;
          e.anims.stop();
          e.setFrame('momonga_2').setFlipX(e.dir < 0);
        }
      }
    } else {
      // last glide: off the far side and down
      e.x += -e.dir * 90 * dt;
      e.y += e.vy * dt;
    }
  },

  /**
   * Rotary snowplough: drives along its street (down an avenue faster than the scroll, or across)
   * and sweeps its chute back and forth, throwing a stream of snow pellets. The chute shows the aim.
   */
  plow(e, dt, b) {
    const s = this.scene;
    if (e.horiz) e.x += e.dir * 22 * dt;
    else e.u -= 16 * dt;
    e.y = s.parallax.screenY(e.u);
    const ang = DOWN + Math.sin(e.age * 1.3) * 1.0;
    const th = Math.atan2(-Math.cos(ang), Math.sin(ang));
    const i = ((Math.round(th / (TAU / 16)) % 16) + 16) % 16;
    const hx = e.horiz ? e.x + e.dir * 5 : e.x;
    const hy = e.horiz ? e.y : e.y + 4;
    e.head.setFrame(`${this.skin.plow.chute}${i}`).setPosition(hx, hy);
    if (!this.canFire(e)) return;
    if (e.spray > 0) {
      e.spray -= dt;
      e.cool -= dt;
      if (Math.random() < dt * 45) {
        const sa = ang + (Math.random() - 0.5) * 0.65;
        const v = 36 + Math.random() * 34;
        const p = s.parallax.bit(`flake_${Math.floor(Math.random() * 3)}`, hx + Math.cos(ang) * 5, hy + Math.sin(ang) * 5, Math.sin(sa) * v, Math.cos(sa) * v, 0.5, 4, Math.random() * 6, 0);
        p.setAlpha(0.8);
      }
      if (e.cool <= 0) {
        e.cool = 0.11;
        b.fire(hx + Math.cos(ang) * 4, hy + Math.sin(ang) * 4, ang, slow);
      }
    } else if ((e.timer -= dt) <= 0) {
      e.spray = 1.6;
      e.timer = 1.4;
    }
  },

  /**
   * Yuki-onna, the snow woman: three phases as she weakens.
   *   1 (ice): her snowflakes freeze into crystals that hang in the air for a few seconds and stop shots both
   *     ways: cover to hide behind, or shoot them and they burst into shards. Freezing snowflakes, the blizzard
   *     blowing her shots sideways, falling icicles.
   *   2 (mirrors and frost): she splits into three figures of ice, only the real one breathes (a puff of
   *     breath every so often); the mirrors fire too, and shatter into a ring of shards when shot. She throws
   *     clouds of freezing mist that frost the ship over and slow it; frosted through, it freezes solid.
   *   3 (blizzard): a whirling storm drags the ship towards her while her shots spiral out; then a whiteout
   *     hides everything but a circle round the ship, her glowing eyes and the shots.
   * Between attacks she fades out and back in somewhere else (shots pass through her while she is mist).
   */
  yukiOnna(e, dt, b) {
    const s = this.scene;
    if (e.state === 'enter') {
      e.y += Math.max(6, (70 - e.y) * 0.8) * dt;
      if (e.y >= 69) Object.assign(e, { state: 'fight', fight: 0, timer: 0.8, patternIndex: 0, step: 0, homeX: e.x, blink: null, phase: 1, mists: [], seeds: [], white: 0, breathT: 0, whirl: 0 });
      return;
    }
    if (e.state === 'leave') {
      e.setAlpha(Math.max(0, e.alpha - dt * 0.8));
      e.ghost = e.alpha < 0.5;
      s.parallax.windTarget = 0;
      this.yukiIce(e, dt, b);
      if (e.alpha <= 0) this.remove(e);
      return;
    }
    e.fight += dt;
    if (e.fight > YUKI.time) {
      e.state = 'leave';
      e.white = Math.min(e.white, 0.6);
      for (const m of this.yukiMirrors(e)) this.mirrorDown(m, true);
      return;
    }
    // the phase follows her strength
    const phase = e.hp > e.maxHp * 0.66 ? 1 : e.hp > e.maxHp * 0.33 ? 2 : 3;
    if (phase !== e.phase) this.yukiPhase(e, phase);
    this.yukiIce(e, dt, b);
    const mirrors = this.yukiMirrors(e);
    if (e.blink) {
      const k = (e.blink.t += dt);
      const a = k < 0.35 ? 1 - k / 0.35 : k < 0.7 ? (k - 0.35) / 0.35 : 1;
      if (k >= 0.35 && !e.blink.moved) {
        e.blink.moved = true;
        e.x = e.homeX = e.blink.x;
        e.y = e.blink.y;
        mirrors.forEach((m, i) => {
          const [x, y] = e.blink.spots[i] ?? [m.homeX, m.y];
          m.homeX = m.x = x;
          m.y = y;
        });
        if (e.phase === 2) this.yukiReform(e, e.blink.spots);
      }
      e.setAlpha(a);
      e.ghost = k < 0.7 && e.alpha < 0.6;
      for (const m of this.yukiMirrors(e)) {
        m.setAlpha(a);
        m.ghost = e.ghost;
      }
      if (k >= 0.7) e.blink = null;
      return;
    }
    e.x = e.homeX + 6 * Math.sin(e.fight * 1.1);
    for (const m of mirrors) m.x = m.homeX + 6 * Math.sin(e.fight * 1.1 + m.role);
    e.timer -= dt;
    if (e.timer > 0 || !this.canFire(e)) return;
    const next = (n, after = 1.1) => {
      if (++e.step < n) return;
      e.patternIndex++;
      e.step = 0;
      e.timer = after;
      s.parallax.windTarget = 0;
      this.yukiBlink(e);
    };
    const flake = (x, y, arms, rings, rot, turn) => {
      for (let arm = 0; arm < arms; arm++)
        for (let k = 0; k < rings; k++) b.shot('eb_s', x, y + 6, rot + (arm / arms) * TAU, 40 + k * 22, 1.8, { frz: { at: 0.55, hold: 0.7, turn, speed: slow } });
    };
    if (e.phase === 1) {
      switch (e.patternIndex % 3) {
        case 0: {
          // snowflakes, and seeds of ice flying out to freeze into crystals in the air
          if (e.step === 0) this.yukiSeeds(e, b, 3);
          flake(e.x, e.y, 6, 4, e.step * 0.3 + Math.random() * 0.3, e.step % 2 ? -0.45 : 0.45);
          e.timer = 1.6;
          next(3);
          break;
        }
        case 1: {
          // blizzard: aimed bursts blown sideways by the wind (the snow shows which way it blows)
          const wind = Math.floor(e.step / 6) % 2 ? 36 : -36;
          s.parallax.windTarget = wind * 1.4;
          if (e.step === 0) this.yukiSeeds(e, b, 2);
          const a = this.aimAt(e, 0, 8);
          for (const d of [-0.25, 0, 0.25]) b.shot('eb_s', e.x, e.y + 8, a + d - wind * 0.006, normal, 1.8, { ax: wind, maxV: 95 });
          e.timer = 0.24;
          next(12);
          break;
        }
        default:
          // icicles appear along the top, blink, then fall
          for (let k = 0; k < 5; k++) b.shot('icicle', 10 + ((k + Math.random() * 0.8) / 5) * (VIEW.width - 20), 8, DOWN, 0, 1.8, { ay: 150, maxV: 150, safe: 0.7 });
          b.ring(e.x, e.y + 4, 10, e.step * 0.3, slow);
          e.timer = 0.8;
          next(4);
      }
    } else if (e.phase === 2) {
      const all = [e, ...mirrors];
      switch (e.patternIndex % 3) {
        case 0:
          // all three figures fan out at the ship; the mirrors' fans are thinner
          for (const f of all) if (this.canFire(f)) b.fan(f.x, f.y + 8, this.aimAt(f, 0, 8), f === e ? 5 : 3, f === e ? 0.7 : 0.5, normal);
          e.timer = 0.7;
          next(4);
          break;
        case 1:
          // clouds of freezing mist settle where the ship is and beside it
          if (e.step === 0) {
            const p = s.player;
            this.yukiMist(e, p.x, p.y);
            this.yukiMist(e, Phaser.Math.Clamp(p.x + (p.x < 90 ? 46 : -46), 24, VIEW.width - 24), p.y - 30 + Math.random() * 30);
          }
          flake(e.x, e.y, 5, 3, e.step * 0.4, 0.4);
          e.timer = 1.3;
          next(3);
          break;
        default:
          for (let k = 0; k < 4; k++) b.shot('icicle', 12 + ((k + Math.random() * 0.8) / 4) * (VIEW.width - 24), 8, DOWN, 0, 1.8, { ay: 150, maxV: 150, safe: 0.7 });
          for (const f of all) if (this.canFire(f)) b.ring(f.x, f.y + 4, f === e ? 10 : 6, e.step * 0.3, slow);
          e.timer = 0.9;
          next(3);
      }
    } else {
      switch (e.patternIndex % 3) {
        case 0: {
          // the whirling blizzard: the wind drags the ship towards her while her shots spiral out
          if (e.step === 0) {
            e.whirl = 4.6;
            s.hud.show('', 'WIR ŚNIEŻNY!', 1.2);
          }
          const a = e.step * 0.33;
          for (const d of [0, Math.PI]) b.shot('eb_s', e.x, e.y + 4, a + d, slow * 1.1, 1.8);
          if (e.step % 6 === 5) b.fan(e.x, e.y + 8, this.aimAt(e, 0, 8), 3, 0.4, normal);
          e.timer = 0.13;
          next(34, 1.2);
          break;
        }
        case 1: {
          // whiteout: the snow closes in round the ship; her eyes, the shots and a circle of clear air show
          if (e.step === 0) {
            e.white = YUKI.whiteout;
            s.hud.show('', 'BIAŁA ZAMIEĆ!', 1.2, true);
          }
          if (e.step > 1) {
            const a = this.aimAt(e, 0, 8);
            for (const d of [-0.18, 0, 0.18]) b.shot('eb_s', e.x, e.y + 8, a + d, normal * 0.9, 1.8);
          }
          if (e.step === 4) for (let k = 0; k < 4; k++) b.shot('icicle', 12 + ((k + Math.random() * 0.8) / 4) * (VIEW.width - 24), 8, DOWN, 0, 1.8, { ay: 150, maxV: 150, safe: 0.7 });
          e.timer = 0.5;
          next(9, 0.9);
          break;
        }
        default:
          if (e.step === 0) this.yukiMist(e, s.player.x, s.player.y);
          if (e.step === 1) this.yukiSeeds(e, b, 2);
          flake(e.x, e.y, 6, 4, e.step * 0.35, e.step % 2 ? -0.5 : 0.5);
          e.timer = 1.3;
          next(3);
      }
    }
  },

  /** A new phase: a banner, the mirrors come or go, a fresh blink. */
  yukiPhase(e, phase) {
    const s = this.scene;
    e.phase = phase;
    e.patternIndex = 0;
    e.step = 0;
    e.timer = 1.3;
    s.parallax.windTarget = 0;
    if (phase === 2) s.hud.show('LUSTRA LODU', 'TYLKO PRAWDZIWA ODDYCHA', 2);
    if (phase === 3) {
      s.hud.show('ZAMIEĆ!', 'YUKI-ONNA WPADA W GNIEW', 2, true);
      for (const m of this.yukiMirrors(e)) this.mirrorDown(m, true);
      for (const m of e.mists) m.t = Math.max(m.t, m.life - 0.8);
    }
    s.cameras.main.shake(400, 0.004);
    this.yukiBlink(e);
  },

  /** Fade out and back in somewhere else; in phase 2 the mirrors take the other places. */
  yukiBlink(e) {
    const slots = [[40, 62], [90, 58], [140, 62]].map(([x, y]) => [x + (Math.random() - 0.5) * 16, y + Math.random() * 24]);
    if (e.phase === 2) {
      Phaser.Utils.Array.Shuffle(slots);
      const [x, y] = slots.pop();
      e.blink = { t: 0, x, y, spots: slots };
    } else e.blink = { t: 0, x: 40 + Math.random() * 100, y: 58 + Math.random() * 30, spots: [] };
  },

  yukiMirrors(e) {
    return (e.kuroko ?? []).filter((k) => !k.dead && k.master === e && k.kind === 'yukimirror' && k.hp > 0);
  },

  /** Her mirrors and crystals are pooled sprites: drop the ones gone (and maybe reused) before adding one. */
  yukiAdopt(e, k) {
    e.kuroko = e.kuroko.filter((o) => o !== k && !o.dead && o.master === e);
    e.kuroko.push(k);
  },

  yukiCrystals(e) {
    return (e.kuroko ?? []).filter((k) => !k.dead && k.master === e && k.type === 'crystal');
  },

  /** Phase 2: the mirrors (re)form in the free places. */
  yukiReform(e, spots) {
    const have = this.yukiMirrors(e);
    for (let i = have.length; i < 2 && i < spots.length; i++) {
      const [x, y] = spots[i];
      const m = this.pool.spawn('yukionna_0', x, y, {
        ...EXTRAS, type: 'kuroko', def: MIRROR, hp: MIRROR.hp, maxHp: MIRROR.hp, radius: MIRROR.radius, kind: 'yukimirror', master: e,
        role: i * 2.1 + 1, homeX: x, age: 0, seen: 5, state: 'fight', flash: 0, flashCool: 0, ground: false, head: null, u: 0,
      });
      m.setDepth(DEPTH.air - 0.12).setAlpha(e.alpha);
      m.play({ key: 'yukionna', startFrame: (i + 1) % 4 });
      this.yukiAdopt(e, m);
    }
  },

  /** A mirror shot to pieces: a ring of ice shards (none when she takes it back herself). */
  mirrorDown(m, quiet = false) {
    const s = this.scene;
    s.fx.shards(m.x, m.y, quiet ? 14 : 24);
    s.sfx.explode(quiet ? 's' : 'm');
    if (!quiet) {
      const pts = m.def.score * s.score.mult;
      s.score.add(pts);
      s.fx.text(m.x, m.y - 18, `${pts}`, 1, 0xd8f0ff);
      if (this.canFire(m)) s.bullets.ring(m.x, m.y + 4, 8, Math.random(), slow);
    }
    m.hp = 0;
    this.remove(m);
  },

  /** Seeds of ice flying out to places in the middle of the screen, where they freeze into crystals. */
  yukiSeeds(e, b, n) {
    if (this.yukiCrystals(e).length + e.seeds.length >= YUKI.crystals) return;
    for (let i = 0; i < n; i++) {
      const tx = 26 + ((i + 0.2 + Math.random() * 0.6) / n) * (VIEW.width - 52);
      const ty = 118 + Math.random() * 70;
      const d = Math.hypot(tx - e.x, ty - e.y);
      const at = 0.9;
      const shot = b.shot('eb_ice', e.x, e.y + 6, Math.atan2(ty - e.y, tx - e.x), d / at, 2.5);
      if (shot) e.seeds.push({ b: shot, t: 0, at });
    }
  },

  /** A cloud of freezing mist settling at (x, y): it shows first, then frosts whatever stays in it. */
  yukiMist(e, x, y) {
    if (e.mists.length >= 3) return;
    const s = this.scene;
    const img = s.add.image(x, y, 'sprites', Math.random() < 0.5 ? 'mist_0' : 'mist_1').setDepth(DEPTH.airFx).setTint(0xd8f0ff).setAlpha(0).setScale(1.1, 1.3);
    e.mists.push({ img, x, y, r: 17, t: 0, life: YUKI.mist });
  },

  /**
   * Every frame of the fight: the seeds freezing into crystals, the crystals stopping bullets and melting
   * away, the mist frosting the ship, her breath, the whirlwind's drag and the whiteout.
   */
  yukiIce(e, dt, b) {
    const s = this.scene;
    const p = s.player;
    // seeds become crystals where they stop
    e.seeds = e.seeds.filter((sd) => {
      if (sd.b.dead) return false;
      if ((sd.t += dt) < sd.at) return true;
      const { x, y } = sd.b;
      b.pool.kill(sd.b);
      const c = this.pool.spawn('ice_crystal_0', x, y, {
        ...EXTRAS, type: 'crystal', def: CRYSTAL, hp: CRYSTAL.hp, maxHp: CRYSTAL.hp, radius: CRYSTAL.radius, master: e, harmless: true,
        life: YUKI.crystalLife, age: 0, seen: 5, state: 'hang', flash: 0, flashCool: 0, ground: false, head: null, u: 0,
      });
      c.setDepth(DEPTH.air - 0.05);
      this.yukiAdopt(e, c);
      s.fx.shards(x, y, 6, true);
      return false;
    });
    // crystals: they stop every bullet that flies into them, crack, and melt away
    for (const c of this.yukiCrystals(e)) {
      c.life -= dt;
      c.y += 3 * dt;
      if (c.life <= 0) {
        s.fx.shards(c.x, c.y, 5, true);
        this.remove(c);
        continue;
      }
      c.setFrame(c.life < 2 || c.hp < c.maxHp * 0.5 ? 'ice_crystal_1' : 'ice_crystal_0').setAlpha(Math.min(1, c.life / 0.8));
      for (const bl of b.pool.live) {
        if (bl.dead) continue;
        const r = c.radius + bl.radius;
        if ((bl.x - c.x) ** 2 + (bl.y - c.y) ** 2 < r * r) {
          b.pool.kill(bl);
          if (Math.random() < 0.5) s.fx.spark(bl.x, bl.y);
        }
      }
    }
    // mist: shows for a moment, then frosts the ship while it stays inside; drifts down and thins away
    let inMist = false;
    e.mists = e.mists.filter((m) => {
      m.t += dt;
      m.y += 4 * dt;
      const a = m.t < 0.7 ? (m.t / 0.7) * 0.45 : m.t > m.life - 0.8 ? Math.max(0, (m.life - m.t) / 0.8) * 0.75 : 0.75;
      m.img.setPosition(m.x + Math.sin(m.t * 1.3) * 2, m.y).setAlpha(a);
      if (m.t > 0.7 && m.t < m.life - 0.4 && Math.hypot(p.x - m.x, (p.y - m.y) * 1.3) < m.r) inMist = true;
      if (Math.random() < dt * 8) {
        const f = s.fx.part(s.fx.parts, 'flake_1', m.x + (Math.random() - 0.5) * 34, m.y + (Math.random() - 0.5) * 18);
        f.vx = (Math.random() - 0.5) * 6;
        f.vy = 4 + Math.random() * 6;
        f.drag = 0;
        f.life = f.max = 0.6 + Math.random() * 0.4;
        f.a0 = 0.8;
        f.setTint(0xe8f6ff);
      }
      if (m.t >= m.life) {
        m.img.destroy();
        return false;
      }
      return true;
    });
    p.frostUpdate(dt, inMist);
    // only the real one breathes
    if (e.state === 'fight' && (e.breathT -= dt) <= 0 && e.alpha > 0.8) {
      e.breathT = 0.55 + Math.random() * 0.25;
      const w = s.fx.part(s.fx.parts, 'wisp_s_0', e.x - 1, e.y - 11);
      w.vx = -4 + Math.random() * 8;
      w.vy = -10 - Math.random() * 6;
      w.drag = 1.5;
      w.grow = 1.2;
      w.life = w.max = 0.7;
      w.a0 = 0.85;
      w.setScale(0.6).setTint(0xf4fbff);
    }
    // the whirlwind drags the ship in; the snow streams towards her
    if (e.whirl > 0) {
      e.whirl -= dt;
      if (e.state === 'fight') p.pull = { x: e.x, y: e.y, k: YUKI.pull };
      if (Math.random() < dt * 50) {
        const ang = Math.random() * TAU;
        const R = 70 + Math.random() * 40;
        const f = s.fx.part(s.fx.parts, 'flake_1', e.x + Math.cos(ang) * R, e.y + Math.sin(ang) * R);
        f.vx = -Math.cos(ang) * 60 - Math.sin(ang) * 40;
        f.vy = -Math.sin(ang) * 60 + Math.cos(ang) * 40;
        f.drag = 0;
        f.life = f.max = 0.9;
        f.a0 = 0.9;
        f.setTint(0xffffff);
      }
    }
    // the whiteout
    if (e.white > 0 || this.yukiFog) {
      e.white = Math.max(0, e.white - dt);
      const fog = this.yukiFogFx();
      const t = e.white;
      const a = t > YUKI.whiteout - 0.8 ? (YUKI.whiteout - t) / 0.8 : Math.min(1, t / 0.6);
      fog.img.setPosition(Math.round(p.alive ? p.x : 90), Math.round(p.alive ? p.y : s.H - 60)).setAlpha(a);
      const eyes = e.alpha > 0.3 && a > 0.05;
      fog.eyes.forEach((g, i) => g.setVisible(eyes).setPosition(e.x + (i ? 2 : -1), e.y - 14).setAlpha(a * (0.7 + 0.3 * Math.sin(s.t * 9))));
      if (a <= 0 && t <= 0) this.yukiCleanup(e, true);
    }
  },

  /** The whiteout's snow (a sheet round a clear circle, dithered like the art) and her eyes in it, made once. */
  yukiFogFx() {
    if (this.yukiFog) return this.yukiFog;
    const s = this.scene;
    if (!s.textures.exists('yuki_fog')) {
      const W = 360;
      const H = 860;
      const tex = s.textures.createCanvas('yuki_fog', W, H);
      const ctx = tex.getContext();
      const img = ctx.createImageData(W, H);
      const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const d = Math.hypot(x - W / 2, y - H / 2);
          const raw = Math.max(0, Math.min(1, (d - 22) / 26));
          const q = Math.min(1, Math.floor(raw * 4 + BAYER[(y % 4) * 4 + (x % 4)] / 16) / 4);
          const i = (y * W + x) * 4;
          const n = (x * 7 + y * 13) % 17 === 0 ? 255 : 236;
          img.data[i] = n - 6;
          img.data[i + 1] = n;
          img.data[i + 2] = 255;
          img.data[i + 3] = Math.round(q * 238);
        }
      ctx.putImageData(img, 0, 0);
      tex.refresh();
    }
    const img = s.add.image(0, 0, 'yuki_fog').setDepth(DEPTH.near + 0.5).setAlpha(0);
    const eyes = [0, 1].map(() => s.add.image(0, 0, 'sprites', 'glow').setDepth(DEPTH.near + 0.6).setBlendMode(Phaser.BlendModes.ADD).setTint(0x8ae8ff).setScale(0.18).setVisible(false));
    this.yukiFog = { img, eyes };
    return this.yukiFog;
  },

  /** She is gone (or the whiteout is over): the mist, the fog and the drag go with her. */
  yukiCleanup(e, fogOnly = false) {
    if (this.yukiFog) {
      this.yukiFog.img.destroy();
      for (const g of this.yukiFog.eyes) g.destroy();
      this.yukiFog = null;
    }
    if (fogOnly) return;
    for (const m of e.mists ?? []) m.img.destroy();
    e.mists = [];
    e.seeds = [];
    e.white = 0;
    e.whirl = 0;
    this.scene.player.pull = null;
  },

  /** A crystal shot through: it bursts into shards that fly out (a bomb just melts it). */
  crystalDown(c, byBomb) {
    const s = this.scene;
    s.fx.shards(c.x, c.y, 12);
    s.sfx.explode('s');
    const pts = c.def.score * s.score.mult;
    s.score.add(pts);
    if (!byBomb && s.bombClear <= 0) for (let k = 0; k < 5; k++) s.bullets.shot('eb_s', c.x, c.y, (k / 5) * TAU + Math.random() * 0.4, slow * 0.9, 1.8);
    c.hp = 0;
    this.remove(c);
  },

  // ---------------------------------------------------------------- boss: the Snow Festival bear
  // One damageable body: three permanent melts, the exposed higuma, then its Hokkaido blizzard.
  spawnKuma(w, base) {
    const s = this.scene;
    const y = -36;
    const u = s.parallax.stripU(y);
    const g = { kind: 'kuma', state: 'dormant', t: 0, phase: 0, step: 0, timer: 1, parts: [], enraged: false, defeated: false };
    Object.assign(g, { awake: false, stage: 1, home: w.x, homeY: 76, restY: 0, roar: 0, roarLen: 1, body: null, sats: [] });
    const part = (frame, role, dx, dy, hp, radius, pts) => {
      const e = this.pool.spawn(frame, w.x + dx, y + dy, { ...base, role, dx, dy, u, hp, maxHp: hp, radius, pts, group: g, invuln: true, ground: true });
      e.setDepth(DEPTH.ground + (role === 'body' ? 0.3 : 0.35));
      g.parts.push(e);
      return e;
    };
    g.body = part('kuma_ice', 'body', 0, 0, KUMA.bear, 20, 0);
    g.melts = 0;
    g.take = { body: 0.02 };
    Object.assign(g, { icT: 1 });
    g.maxTotal = g.body.maxHp;
    this.bossGroup = g;
    return g.body;
  },

  updateKuma(g, dt) {
    const s = this.scene;
    const alive = g.parts.filter((p) => !p.dead && p.group === g && p.hp > 0);
    const body = g.body;
    const place = (x, y) => {
      for (const p of alive) {
        p.x = x + p.dx;
        p.y = y + p.dy;
      }
    };
    if (g.state === 'dormant') {
      place(g.home, s.parallax.screenY(body.u));
      if (s.parallax.time >= s.parallax.maxTime - 1e-3) {
        g.state = 'wake';
        g.t = 0;
        g.restY = body.y;
        s.cameras.main.shake(1300, 0.005);
      }
      return;
    }
    g.t += dt;
    g.roar -= dt;
    if (g.stage >= 2) body.setFrame(`kuma_${g.roar > 0 ? 1 : 0}${g.stage >= 3 && hasEnemyFrame('kuma_0f') ? 'f' : ''}`); // (rimed in the blizzard)
    this.kumaBreath(g, body);
    if (g.state === 'wake') {
      // shakes off the snow, then rises from the pedestal into the air
      const k = Math.max(0, Math.min(1, (g.t - 1.3) / 1.2));
      place(g.home + (g.t < 1.3 ? Math.round(Math.random() * 2 - 1) : 0), g.restY + (g.homeY - g.restY) * k * k * (3 - 2 * k));
      if (Math.random() < dt * 14) s.fx.shards(body.x + (Math.random() - 0.5) * 50, body.y + (Math.random() - 0.5) * 44, 2, true);
      if (g.t >= 1.3 && body.ground)
        for (const p of alive) {
          p.ground = false;
          p.setDepth(DEPTH.air - (p.role === 'body' ? 0.2 : 0.1));
        }
      if (g.t >= 2.5) {
        g.state = 'fight';
        g.awake = true;
        g.t = 0;
        g.timer = 0.6;
        for (const p of alive) p.invuln = false;
      }
      return;
    }
    if (g.state === 'break') {
      // the ice falls away and the real bear roars
      place(g.home + Math.round(Math.random() * 2 - 1), g.homeY);
      const thaw = Math.floor((g.t / 1.4) * 5); // chunks of the sculpture falling off, then the bear itself
      if (thaw < 4 && hasEnemyFrame('kuma_thaw_0')) body.setFrame(`kuma_thaw_${thaw}`);
      if (g.t >= 1.4) {
        g.state = 'fight';
        g.t = 0;
        g.timer = 0.5;
        body.invuln = false;
        body.pass = false;
        body.harmless = false;
      }
      return;
    }
    if (g.stage === 1) return this.kumaFurnace(g, dt);
    const sp = g.enraged ? 1.5 : 1;
    place(g.home + (g.stage === 1 ? 12 : 26) * Math.sin(g.t * 0.5 * sp), g.homeY + 4 * Math.sin(g.t * 0.9 * sp));
    if (g.stage === 2 && body.hp < body.maxHp * KUMA.storm) {
      // the roar brings the blizzard
      Object.assign(g, { enraged: true, roar: 1.2, phase: 0, step: 0 });
      this.phaseBreak(g, body.x, body.y, 3, 'ZAMIEĆ HOKKAIDO');
    }
    if (g.stage >= 3) this.kumaBlizzard(g, dt);
    g.timer -= dt * (g.enraged ? 1.4 : 1);
    if (g.timer > 0) return;
    this.kumaBear(g, body);
  },

  /** The roar's breath: a cloud of steam rolling out of the jaws while it roars (only to look at). */
  kumaBreath(g, body) {
    if (!hasEnemyFrame('kuma_breath_0')) return;
    if (g.roar > g.roarLen || g.roar <= 0) g.roarLen = Math.max(1, g.roar); // a new roar: how long this one lasts
    let sp = g.sats[0];
    if (g.roar <= 0) {
      sp?.setVisible(false);
      return;
    }
    if (!sp) {
      sp = this.segPool.spawn('kuma_breath_0', body.x, body.y).setDepth(DEPTH.air - 0.15);
      g.sats.push(sp);
    }
    const k = 1 - g.roar / g.roarLen;
    sp.setFrame(`kuma_breath_${Math.min(3, Math.floor(k * 4))}`)
      .setPosition(body.x, body.y + 4.5)
      .setVisible(body.visible)
      .setAlpha(body.alpha * Math.min(1, g.roar * 3));
  },

  /** Phase 2: roaring rings, alternating paw swipes, thrown salmon with icicles falling from above. */
  kumaBear(g, body) {
    const s = this.scene;
    const b = s.bullets;
    if (!this.canFire(body)) {
      g.timer = 0.2;
      return;
    }
    const next = () => {
      g.phase++;
      g.step = 0;
      g.timer = 0.9;
    };
    switch (g.phase % 3) {
      case 0:
        if (g.step === 0) {
          g.roar = 1.4;
          s.cameras.main.shake(500, 0.004);
        }
        b.ring(body.x, body.y + 14, g.stage >= 3 ? 16 : 18, g.step * 0.17, g.step % 2 ? normal : slow, g.step === 1);
        g.timer = 0.45;
        if (++g.step >= 3) next();
        break;
      case 1: {
        const side = g.step % 2 ? 1 : -1;
        b.fan(body.x + side * 24, body.y - 15, this.aimAt(body, side * 24, -15), g.stage >= 3 ? 9 : 11, 1.4, normal);
        g.timer = 0.5;
        if (++g.step >= 6) next();
        break;
      }
      default: {
        const a = this.aimAt(body, 0, 14);
        const n = g.enraged ? 5 : 3;
        for (let i = 0; i < n; i++) b.shot('salmon', body.x, body.y + 14, a + (i / (n - 1) - 0.5) * 0.7, 64, 2.2, { wig: 5, wf: 8, spin: true });
        for (let k = 0; k < 4; k++) b.shot('icicle', 12 + Math.random() * (VIEW.width - 24), 8, DOWN, 0, 1.8, { ay: 150, maxV: 150, safe: 0.7 });
        g.timer = 0.85;
        if (++g.step >= 4) next();
      }
    }
  },

  /** Phase 3: falling icicles, without wind moving the ship or its shots. */
  kumaBlizzard(g, dt) {
    const s = this.scene;
    if ((g.icT -= dt) <= 0 && s.bombClear <= 0) {
      g.icT = 1.7;
      for (let k = 0; k < 2; k++) s.bullets.shot('icicle', 12 + Math.random() * (VIEW.width - 24), 8, DOWN, 0, 1.8, { ay: 150, maxV: 150, safe: 0.7 });
    }
  },

};
