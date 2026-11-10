// Stage 7 (Hiroshima & Sacred Miyajima):
// - Oyster shooter (kaki): armored bivalve shell (30% chip damage while shut), opens to fire lustrous Seto
//   pearls (2x critical damage while open!).
// - Heike-gani (miniboss): samurai-faced crab of Dan-no-ura; scuttles sideways, raises an iron pincer shield
//   wall (reflecting frontal fire unless flanked), snaps intersecting X-scissor blades, and breathes froth bubbles.
// - Itsukushima Sankibō (stage boss): Great Tengu of Mount Misen flanked by two orbiting Eternal Flame braziers
//   (Kiezu-no-hi); swings his feathered hauchiwa fan to summon lateral gales that blow both falling momiji leaves
//   and crimson feather-blades sideways, cracks hyōshigi wind-slash corridors, and conjures sacred Misen fire zones.
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { volley } from '../../difficulty.js';
import { slow, normal, fast, DOWN, TAU } from './shared.js';

// Sankibō: the Tengu's HP and each brazier's; `barrier`: what gets through its barrier of fire while both
// braziers burn; below `wrath` of its life, phase 3; `gale`: px/s its fan's wind pushes the ship
const SANKIBO = { body: 1390, brazier: 280, barrier: 0.35, wrath: 0.35, gale: 20 };

export const hiroshima = {
  // ---------------------------------------------------------------- Armored Seto Oyster (shooter)
  oysterShooter(e, dt, b) {
    if (e.state === 'enter') {
      e.shellOpen = false;
      e.setFrame('kaki_0');
      e.y += Math.max(8, (e.stopY - e.y) * 2.2) * dt;
      if (e.y >= e.stopY - 1) {
        e.state = 'attack';
        e.phaseT = 0.45;
        e.shots = 3;
      }
      return;
    }
    if (e.state === 'leave') {
      e.shellOpen = false;
      e.setFrame('kaki_0');
      e.timer -= dt;
      if (e.timer <= 0) {
        e.vy -= 110 * dt;
        e.y += e.vy * dt;
        e.x += e.dir * -24 * dt;
      }
      return;
    }
    e.x += Math.sin(e.age * 1.5) * 7 * dt;
    e.phaseT -= dt;
    // Cycle per volley: shut (0..0.45) -> cracking open (0.22s) -> wide open exposing pearl & firing (0.75s)
    if (!e.opening && !e.shellOpen) {
      e.setFrame('kaki_0');
      if (e.phaseT <= 0) {
        e.opening = true;
        e.phaseT = 0.22;
        e.setFrame('kaki_1');
      }
    } else if (e.opening) {
      if (e.phaseT <= 0) {
        e.opening = false;
        e.shellOpen = true;
        e.firedVolley = false;
        e.phaseT = 0.78;
        e.setFrame('kaki_2');
      }
    } else {
      if (!e.firedVolley && e.phaseT <= 0.55) {
        e.firedVolley = true;
        if (this.canFire(e)) {
          const n = volley(e.pattern === 'fan' ? 5 : 3);
          const arc = e.pattern === 'fan' ? 0.96 : 0.48;
          const a = this.aimAt(e, 0, 4);
          for (let i = 0; i < n; i++) {
            const ang = a + (n > 1 ? (i / (n - 1) - 0.5) * arc : 0);
            b.shot('eb_pearl', e.x, e.y + 4, ang, e.pattern === 'fan' ? slow * 1.08 : normal * 0.92, 2.2);
          }
        }
      }
      if (e.phaseT <= 0) {
        e.shellOpen = false;
        e.setFrame('kaki_0');
        e.shots--;
        if (e.shots <= 0) {
          e.state = 'leave';
          e.timer = 0.45;
          e.vy = 0;
        } else {
          e.phaseT = 0.65;
        }
      }
    }
  },

  // ---------------------------------------------------------------- Heike-gani (Samurai Crab Miniboss)
  updateHeike(e, dt, b) {
    const s = this.scene;
    if (e.state === 'enter') {
      e.y += Math.max(8, (68 - e.y) * 0.9) * dt;
      if (e.y >= 67) {
        Object.assign(e, {
          state: 'fight',
          fight: 0,
          timer: 0.7,
          patternIndex: 0,
          step: 0,
          guarding: false,
          scuttleDir: 1,
          scuttleT: 1.4,
        });
      }
      return;
    }
    if (e.state === 'leave') {
      e.guarding = false;
      if (!e.anims.isPlaying) e.play('heike');
      e.vy = (e.vy ?? 0) - 42 * dt;
      e.y += e.vy * dt;
      return;
    }
    e.fight += dt;
    if (e.fight > 35) {
      e.guarding = false;
      e.state = 'leave';
      return;
    }

    // Brisk sideways crab scuttle (slower while locked in pincer guard)
    e.scuttleT -= dt;
    if (e.scuttleT <= 0) {
      e.scuttleDir = e.x > 122 ? -1 : e.x < 58 ? 1 : -e.scuttleDir;
      e.scuttleT = 1.0 + Math.random() * 0.9;
    }
    const spd = e.guarding ? 18 : 54;
    e.x = Phaser.Math.Clamp(e.x + e.scuttleDir * spd * dt, 32, VIEW.width - 32);
    if (e.x <= 33 || e.x >= VIEW.width - 33) e.scuttleDir = -e.scuttleDir;
    e.y = 68 + Math.sin(e.fight * 2.6) * 3;
    e.setRotation(Math.sin(e.fight * 7) * (e.guarding ? 0.02 : 0.06));

    // Sea spray droplets kicked up by its scuttling legs
    if (!e.guarding && Math.floor((e.fight - dt) * 9) < Math.floor(e.fight * 9)) {
      const side = Math.floor(e.fight * 9) % 2 ? 16 : -16;
      const p = s.fx.part(s.fx.parts, 'drop_0', e.x + side, e.y + 8);
      p.vx = side * 2.1;
      p.vy = 26;
      p.life = p.max = 0.28;
    }

    e.timer -= dt;
    if (e.timer > 0 || !this.canFire(e)) return;

    const pat = e.patternIndex % 3;
    if (pat === 0) {
      // Pattern 0: Crossing Samurai Scissor X-Slash from left & right claws!
      e.guarding = false;
      if (!e.anims.isPlaying) e.play('heike');
      const pl = s.player;
      const aL = Math.atan2(pl.y - (e.y + 14), pl.x - (e.x - 14));
      const aR = Math.atan2(pl.y - (e.y + 14), pl.x - (e.x + 14));
      const n = volley(4);
      for (let i = 0; i < n; i++) {
        const sp = normal * (0.82 + i * 0.11);
        b.shot('eb_pearl', e.x - 14, e.y + 14, aL + 0.14 - i * 0.05, sp, 2.2);
        b.shot('eb_pearl', e.x + 14, e.y + 14, aR - 0.14 + i * 0.05, sp, 2.2);
      }
      s.music.synth?.hyoshigi?.(s.music.ctx.currentTime + 0.01, 0.55);
      e.timer = e.p2 ? 0.46 : 0.62; // (its samurai fury: the scissors snap faster)
      if (++e.step >= 4) this.nextPattern(e);
    } else if (pat === 1) {
      // Pattern 1: Iron Pincer Shield Wall — blocks frontal fire (flank from sides!), then counter-snaps!
      if (e.step === 0) {
        e.guarding = true;
        e.anims.stop();
        e.setFrame('heike_guard');
        s.fx.text(e.x, e.y - 18, 'GARDA!', 0.75, 0xd8f0ff);
        e.step = 1;
        e.timer = 1.35;
      } else {
        e.guarding = false;
        e.play('heike');
        const m = volley(12);
        for (let i = 0; i < m; i++) {
          b.shot('eb_pearl', e.x, e.y + 12, (i / m) * TAU + e.fight, slow * 1.05, 2.2);
        }
        b.fan(e.x - 13, e.y + 15, DOWN + 0.18, 3, 0.45, normal);
        b.fan(e.x + 13, e.y + 15, DOWN - 0.18, 3, 0.45, normal);
        this.nextPattern(e);
      }
    } else {
      // Pattern 2: Buoyant Seto Sea-Froth Bubbles + aimed pincer snipes
      e.guarding = false;
      if (!e.anims.isPlaying) e.play('heike');
      for (const side of [-1, 1]) {
        const ang = DOWN + side * (0.25 + Math.random() * 0.45);
        b.shot('eb_bubble_0', e.x + side * 8, e.y + 12, ang, 64, 2.2, {
          grow: { r0: 2.0, r1: 4.4, t: 1.2, drag: 0.45, frames: ['eb_bubble_0', 'eb_bubble_1'] },
          wig: 5,
          wf: 3.5,
          life: 4.2,
        });
      }
      if (e.step % 2 === 1) b.fan(e.x, e.y + 14, this.aimAt(e, 0, 14), 3, 0.44, normal);
      e.timer = 0.52;
      if (++e.step >= 5) this.nextPattern(e);
    }
  },

  // ---------------------------------------------------------------- Stage Boss: Itsukushima Sankibō (Great Tengu)
  /**
   * Three phases: the guardian of the eternal flame (while both Kiezu-no-hi braziers burn, a barrier of fire
   * round the Tengu lets only SANKIBO.barrier of a hit through); with the braziers out, the Hauchiwa fan, its
   * gale blowing the ship sideways; below SANKIBO.wrath of its life the wrath of Misen: phantom braziers,
   * untouchable, circle it faster and fire, and its feather storm turns both ways.
   */
  spawnSankibo(w, base) {
    const g = {
      kind: 'sankibo',
      state: 'enter',
      t: 0,
      step: 0,
      patternIndex: 0,
      timer: 1.0,
      parts: [],
      braziers: [],
      enraged: false,
      defeated: false,
      awake: false,
      body: null,
      home: w.x,
      homeY: 64,
      galeDir: 1,
      slashes: null,
      stage: 1,
      take: { body: SANKIBO.barrier },
      sats: [],
    };
    const body = this.pool.spawn('sankibo_0', w.x, -46, {
      ...base,
      role: 'body',
      group: g,
      hp: SANKIBO.body,
      maxHp: SANKIBO.body,
      radius: 17,
    });
    body.play('sankibo');
    body.setDepth(DEPTH.air - 0.1);
    g.body = body;
    g.parts.push(body);

    for (const [idx, ph] of [[0, 0], [1, Math.PI]]) {
      const br = this.pool.spawn('brazier_0', w.x + (idx ? 32 : -32), -46, {
        ...base,
        role: 'brazier',
        group: g,
        orbitPhase: ph,
        hp: SANKIBO.brazier,
        maxHp: SANKIBO.brazier,
        radius: 7.5,
        pts: 4000,
      });
      br.play('brazier');
      br.setDepth(DEPTH.air - 0.08);
      g.parts.push(br);
      g.braziers.push(br);
    }
    g.maxTotal = g.parts.reduce((sum, p) => sum + p.maxHp, 0);
    this.bossGroup = g;
    return body;
  },

  brazierDown(e) {
    const s = this.scene;
    const g = e.group;
    const pts = (e.pts ?? 4000) * s.score.mult;
    s.score.add(pts);
    s.fx.explode(e.x, e.y, 'm');
    s.fx.text(e.x, e.y - 12, `+${pts}`, 1.2, 0xffb868);
    this.remove(e);
    const liveBr = g.braziers.filter((br) => !br.dead && br.hp > 0 && br.group === g);
    if (!liveBr.length && g.stage === 1 && g.body && !g.body.dead) {
      // the eternal flame is out: the barrier falls, the fan comes out
      g.take = null;
      this.phaseBreak(g, g.body.x, g.body.y, 2, 'WACHLARZ HAUCHIWA');
    }
  },

  enrageSankibo(g) {
    if (g.enraged) return;
    g.enraged = true;
    g.take = null;
    const s = this.scene;
    s.sfx.shout?.();
    this.phaseBreak(g, g.body.x, g.body.y, 3, 'GNIEW GÓRY MISEN');
    // the braziers burn again, phantoms out of reach
    for (const ph of [0, Math.PI]) g.sats.push(this.segPool.spawn('brazier_0', g.body.x, g.body.y, { orbitPhase: ph }).setDepth(DEPTH.air - 0.08).setAlpha(0.7).setTint(0x9ad0ff));
    for (const sp of g.sats) sp.play('brazier');
  },

  updateSankibo(g, dt) {
    const s = this.scene;
    const b = s.bullets;
    const body = g.body;
    if (!body || body.dead) return;
    g.t += dt;

    if (g.state === 'enter') {
      body.y += Math.max(10, (g.homeY - body.y) * 1.3) * dt;
      if (body.y >= g.homeY - 1) {
        Object.assign(g, { state: 'fight', awake: true, timer: 0.75 });
      }
    } else {
      const swaySpd = g.enraged ? 1.35 : 0.85;
      body.x = g.home + 30 * Math.sin(g.t * swaySpd);
      body.y = g.homeY + 6 * Math.sin(g.t * 1.9);
      if (!g.enraged && body.hp / body.maxHp < SANKIBO.wrath) this.enrageSankibo(g);
    }
    // phase 1: the barrier of fire round it while the braziers burn
    if (g.take && g.state === 'fight') {
      this.tele.lineStyle(1, 0xff9a48, 0.35 + 0.2 * Math.sin(g.t * 9));
      this.tele.strokeCircle(body.x, body.y, 21 + Math.sin(g.t * 5));
    }
    // phase 3: the phantom braziers circle faster and fire now and then
    g.sats.forEach((sp, i) => {
      const ang = g.t * 2.9 + sp.orbitPhase;
      sp.setPosition(body.x + Math.cos(ang) * 40, body.y + Math.sin(ang) * 20 + 4);
      if (g.state === 'fight' && !g.slashes && g.patternIndex % 3 !== 0 && this.canFire(body) && Math.floor((g.t - dt) * 0.6 + i * 0.5) < Math.floor(g.t * 0.6 + i * 0.5)) {
        b.fan(sp.x, sp.y + 4, Math.atan2(s.player.y - sp.y, s.player.x - sp.x), 2, 0.4, normal * 0.9);
      }
    });
    // phase 2 on: the Hauchiwa gale blows the ship sideways while the fan is out
    if (g.stage >= 2 && s.parallax.windTarget !== 0 && s.player.alive) s.player.pull = { x: g.galeDir > 0 ? VIEW.width + 400 : -400, y: s.player.y, k: SANKIBO.gale };

    // Update orbiting Sacred Eternal Flame Braziers + golden spiritual tether lines
    const liveBr = g.braziers.filter((br) => !br.dead && br.hp > 0 && br.group === g);
    for (const br of liveBr) {
      const ang = g.t * (g.enraged ? 2.4 : 1.55) + br.orbitPhase;
      br.x = body.x + Math.cos(ang) * 34;
      br.y = body.y + Math.sin(ang) * 16 + 4;
      this.tele.lineStyle(1, 0xffae48, 0.35);
      this.tele.lineBetween(body.x, body.y + 2, br.x, br.y);
    }

    // Draw & resolve active Hyōshigi phantom wind-slash corridors!
    if (g.slashes) {
      let allDone = true;
      for (const sl of g.slashes) {
        sl.t += dt;
        if (sl.t < sl.warn) {
          allDone = false;
          if (Math.floor(sl.t * 18) % 2 === 0) {
            this.tele.lineStyle(1.5, 0xff7058, 0.8);
            this.tele.lineBetween(sl.x0, sl.y0, sl.x1, sl.y1);
          }
        } else if (!sl.fired) {
          sl.fired = true;
          const ang = Math.atan2(sl.y1 - sl.y0, sl.x1 - sl.x0);
          const count = volley(g.enraged ? 7 : 5);
          for (let k = 0; k < count; k++) {
            b.shot('eb_feather_0', sl.x0, sl.y0, ang, fast * (0.72 + k * 0.08), 2.0, { spin: true });
          }
        }
      }
      if (allDone) g.slashes = null;
    }

    if (g.state !== 'fight' || !this.canFire(body)) return;

    g.timer -= dt;
    if (g.timer > 0) return;

    const pat = g.patternIndex % 3;
    if (pat === 0) {
      // Pattern 0: Hauchiwa Gale Fan! Blows falling momiji leaves AND curved Tengu feather-blades sideways!
      if (g.step === 0) {
        g.galeDir = -g.galeDir;
        body.anims.stop();
        body.setFrame(g.galeDir > 0 ? 'sankibo_fan_r' : 'sankibo_fan_l');
        s.parallax.windTarget = g.galeDir * (g.enraged ? 78 : 58);
        s.fx.text(body.x, body.y - 22, 'KAZE YO!', 0.8, 0xffd898);
      }
      const cols = volley(g.enraged ? 6 : 4);
      for (let i = 0; i < cols; i++) {
        const sx = 20 + ((i + (g.step % 2) * 0.5) / cols) * (VIEW.width - 40);
        const fFrame = (i + g.step) % 2 ? 'eb_feather_1' : 'eb_feather_0';
        b.shot(fFrame, sx, body.y + 10, DOWN - g.galeDir * 0.28, slow * 0.95, 2.0, {
          ax: g.galeDir * (g.enraged ? 58 : 44),
          maxV: g.enraged ? 115 : 96,
          spin: true,
        });
      }
      g.timer = g.enraged ? 0.42 : 0.55;
      if (++g.step >= (g.enraged ? 6 : 5)) {
        body.play('sankibo');
        s.parallax.windTarget = 0;
        g.patternIndex++;
        g.step = 0;
        g.timer = 0.85;
      }
    } else if (pat === 1) {
      // Pattern 1: Seven Wonders of Misen — Hyōshigi Clappers & Crosswind Corridors!
      s.music.synth?.hyoshigi?.(s.music.ctx.currentTime + 0.01, 0.8);
      const pl = s.player;
      const px = Phaser.Math.Clamp(pl.x, 24, VIEW.width - 24);
      const py = Phaser.Math.Clamp(pl.y, 120, s.H - 24);
      g.slashes = [
        { x0: 6, y0: body.y + 18, x1: VIEW.width - 6, y1: py + 12, t: 0, warn: 0.68, fired: false },
        { x0: VIEW.width - 6, y0: body.y + 18, x1: 6, y1: py + 12, t: 0, warn: 0.68, fired: false },
        { x0: body.x, y0: body.y + 14, x1: px, y1: s.H + 10, t: 0, warn: 0.68, fired: false },
      ];
      b.ring(body.x, body.y + 12, g.enraged ? 14 : 10, g.step * 0.25, slow);
      g.timer = g.enraged ? 0.95 : 1.15;
      if (++g.step >= 3) {
        g.patternIndex++;
        g.step = 0;
        g.timer = 0.8;
      }
    } else {
      // Pattern 2: Kiezu-no-hi Sacred Eternal Flame Zones + Braziers Pearl/Fire Spirals!
      const pl = s.player;
      const tx = Phaser.Math.Clamp(pl.x + (g.step % 2 ? 22 : -22), 22, VIEW.width - 22);
      const ty = Phaser.Math.Clamp(pl.y, 130, s.H - 26);
      b.zone(tx, ty, 15, { warn: 0.95, live: 0.5, kind: 'fire' });
      if (liveBr.length) {
        for (const br of liveBr) {
          b.fan(br.x, br.y + 4, Math.atan2(pl.y - br.y, pl.x - br.x), g.enraged ? 4 : 3, 0.55, normal * 0.92);
        }
      } else {
        // without braziers: the Tengu storm ring (in its wrath it turns back and forth, the phantoms fire with it)
        const n = volley(12);
        const turn = g.enraged && g.step % 2 ? -0.3 : 0.3;
        for (let i = 0; i < n; i++) {
          b.shot('eb_feather_0', body.x, body.y + 10, (i / n) * TAU + g.step * turn, normal * 0.95, 2.0, { spin: true });
        }
      }
      g.timer = g.enraged ? 0.68 : 0.85;
      if (++g.step >= 4) {
        g.patternIndex++;
        g.step = 0;
        g.timer = 0.9;
      }
    }
  },
};
