// Stage 7 (Hiroshima & Sacred Miyajima):
// - Oyster shooter (kaki): armored bivalve shell (30% chip damage while shut), opens to fire lustrous Seto
//   pearls (2x critical damage while open!).
// - Heike-gani (miniboss): samurai-faced crab of Dan-no-ura; scuttles sideways, raises an iron pincer shield
//   wall (reflecting frontal fire unless flanked), snaps intersecting X-scissor blades, and breathes froth bubbles.
// - Sankibo: aim a brazier's ember into the fan's wind band to break the protective seal (encounters.js).
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { volley } from '../../difficulty.js';
import { slow, normal, DOWN, TAU } from './shared.js';
import { hasEnemyFrame } from '../enemyArt.js';

const SANKIBO = { body: 1390 };

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
  /** Phase 2 (PĘKNIĘTY PANCERZ): the same crab with its carapace split (only to look at). */
  heikeWorn(e) {
    if (!e.p2 || !hasEnemyFrame('heike_0_c')) return;
    const anim = e.anims.isPlaying ? e.anims.currentAnim?.key : null;
    if (anim === 'heike') e.play({ key: 'heike_c', startFrame: e.anims.currentFrame?.index ?? 0 });
    else if (!anim && e.frame.name === 'heike_guard') e.setFrame('heike_guard_c');
  },

  updateHeike(e, dt, b) {
    const s = this.scene;
    this.heikeWorn(e);
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
    e.x = Phaser.Math.Clamp(e.x + e.scuttleDir * spd * dt, 36, VIEW.width - 36);
    if (e.x <= 37 || e.x >= VIEW.width - 37) e.scuttleDir = -e.scuttleDir;
    e.y = 68 + Math.sin(e.fight * 2.6) * 3;
    e.setRotation(Math.sin(e.fight * 7) * (e.guarding ? 0.02 : 0.06));

    // Sea spray droplets kicked up by its scuttling legs
    if (!e.guarding && Math.floor((e.fight - dt) * 9) < Math.floor(e.fight * 9)) {
      const side = Math.floor(e.fight * 9) % 2 ? 20 : -20;
      const p = s.fx.part(s.fx.parts, 'drop_0', e.x + side, e.y + 10);
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
      const aL = Math.atan2(pl.y - (e.y + 17), pl.x - (e.x - 17));
      const aR = Math.atan2(pl.y - (e.y + 17), pl.x - (e.x + 17));
      const n = volley(4);
      for (let i = 0; i < n; i++) {
        const sp = normal * (0.82 + i * 0.11);
        b.shot('eb_pearl', e.x - 17, e.y + 17, aL + 0.14 - i * 0.05, sp, 2.2);
        b.shot('eb_pearl', e.x + 17, e.y + 17, aR - 0.14 + i * 0.05, sp, 2.2);
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
        s.fx.text(e.x, e.y - 23, 'GARDA!', 0.75, 0xd8f0ff);
        e.step = 1;
        e.timer = 1.35;
      } else {
        e.guarding = false;
        e.play('heike');
        const m = volley(12);
        for (let i = 0; i < m; i++) {
          b.shot('eb_pearl', e.x, e.y + 19, (i / m) * TAU + e.fight, slow * 1.05, 2.2);
        }
        b.fan(e.x - 16, e.y + 19, DOWN + 0.18, 3, 0.45, normal);
        b.fan(e.x + 16, e.y + 19, DOWN - 0.18, 3, 0.45, normal);
        this.nextPattern(e);
      }
    } else {
      // Pattern 2: Buoyant Seto Sea-Froth Bubbles + aimed pincer snipes
      e.guarding = false;
      if (!e.anims.isPlaying) e.play('heike');
      for (const side of [-1, 1]) {
        const ang = DOWN + side * (0.25 + Math.random() * 0.45);
        b.shot('eb_bubble_0', e.x + side * 10, e.y + 19, ang, 64, 2.2, {
          grow: { r0: 2.0, r1: 4.4, t: 1.2, drag: 0.45, frames: ['eb_bubble_0', 'eb_bubble_1'] },
          wig: 5,
          wf: 3.5,
          life: 4.2,
        });
      }
      if (e.step % 2 === 1) b.fan(e.x, e.y + 17, this.aimAt(e, 0, 17), 3, 0.44, normal);
      e.timer = 0.52;
      if (++e.step >= 5) this.nextPattern(e);
    }
  },

  // ---------------------------------------------------------------- Stage Boss: Itsukushima Sankibō (Great Tengu)
  // Permanent braziers provide the aimed embers; their destruction cannot remove the counter mechanic.
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
      take: { body: 0.08 },
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
        hp: 1,
        maxHp: 1,
        invuln: true,
        harmless: true,
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

};
