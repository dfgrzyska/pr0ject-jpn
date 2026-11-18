// The festival's fireworks over Onomichi's strait (docs/plan-onomichi.md, 6.3): once the town has come to its end and
// stopped, shells go up from the two barges in the strait and open over the water, seen from above: chrysanthemums
// (stars trailing sparks), peonies (stars that change colour), willows (gold stars drooping on long trails), and
// little crackling ones; each leaves its smoke drifting on the wind and flashes on the water and the roofs. Through the
// boss's fight they are only the night's sky (they hurt nobody; its own gold shells are the fight's: onomichi-
// funayurei.js), and they go on, quicker, after it. A stage turns them on with `hanabi` in its file: the barges'
// places on the strip, how often a shell goes up during the fight and after it, the most stars there may be at once.
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../config.js';
import { Pool } from './Pool.js';
import { enemyTexture } from './enemyArt.js';

const TAU = Math.PI * 2;
// each kind's colours: [the stars', what they turn to]
const COLS = {
  kiku: [[0xffb060, 0xff6a3a], [0x8ae0ff, 0xe8f8ff], [0xff7a9a, 0xffd0e0], [0x9affa8, 0xe8ffe0]],
  botan: [[0xff5a6a, 0x9affa8], [0xc8a0ff, 0xffe070], [0x6ad8ff, 0xff9ad8], [0xffe070, 0xff6a5a]],
  yanagi: [[0xffd06a, 0xff9a40]],
  senrin: [[0xffffff, 0xfff0a0]],
};
const KINDS = ['kiku', 'kiku', 'botan', 'botan', 'yanagi', 'senrin'];
const mix = (a, b, t) => {
  const ch = (s) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

export class Hanabi {
  constructor(scene, cfg) {
    this.scene = scene;
    this.cfg = { every: [0.8, 1.6], after: [0.35, 0.8], max: 260, ...cfg };
    this.stars = new Pool(scene, DEPTH.air + 0.3, enemyTexture);
    this.smoke = new Pool(scene, DEPTH.air + 0.25, enemyTexture);
    this.list = []; // stars and sparks: { sp, vx, vy, drag, g, life, max, c0, c1, a, trail, tt, ... }
    this.shells = []; // going up: { x0, y0, x, y, tx, ty, t, time, kind }
    this.puffs = [];
    this.bursts = []; // the crackle's little bursts, each a moment after the last
    this.next = 0.6;
    this.on = false;
  }

  update(dt) {
    const s = this.scene;
    const P = s.parallax;
    if (!this.on && P.time >= P.maxTime - 1e-3) this.on = true;
    if (this.on && (this.next -= dt) <= 0) {
      const [a, b] = s.bossDown ? this.cfg.after : this.cfg.every;
      this.next = a + Math.random() * (b - a);
      this.launch();
    }
    this.updateShells(dt);
    for (const b of this.bursts) if ((b.t -= dt) <= 0) this.ring(b.x, b.y, 8, 18, 0.45, b.cols, { small: true, g: 4 });
    this.bursts = this.bursts.filter((b) => b.t > 0);
    this.updateStars(dt);
    this.updateSmoke(dt);
    this.stars.sweep();
    this.smoke.sweep();
  }

  /** A shell up from a barge's mortar: a flash at its mouth, a trail of sparks rising to where it will open. */
  launch() {
    const s = this.scene;
    const B = this.cfg.barges[Math.floor(Math.random() * this.cfg.barges.length)];
    const [x0, y0] = [B[0] + (Math.random() - 0.5) * 8, s.parallax.screenY(B[1])];
    const tx = Phaser.Math.Clamp(x0 + (Math.random() - 0.5) * 90, 18, VIEW.width - 18);
    const ty = 26 + Math.random() * s.H * 0.4;
    const kind = KINDS[Math.floor(Math.random() * KINDS.length)];
    this.shells.push({ x0, y0, x: x0, y: y0, tx, ty, t: 0, time: 0.8 + Math.random() * 0.35, kind });
    if (y0 < s.H + 8) {
      this.spark('hb_flash', x0, y0, { life: 0.22, c0: 0xfff0c0, scale: 0.9 });
      s.fx.smoke(x0, y0, 1, 2);
    }
  }

  updateShells(dt) {
    for (const sh of this.shells) {
      sh.t += dt;
      const q = Math.min(1, sh.t / sh.time);
      const e = 1 - (1 - q) * (1 - q); // (slowing as it climbs)
      sh.x = sh.x0 + (sh.tx - sh.x0) * e;
      sh.y = sh.y0 + (sh.ty - sh.y0) * e;
      if (this.list.length < this.cfg.max) this.spark('hb_star_s', sh.x + (Math.random() - 0.5), sh.y, { life: 0.35, c0: 0xffe0b0, a: 0.8 });
      if (q >= 1) {
        sh.gone = true;
        this.burst(sh.kind, sh.x, sh.y);
      }
    }
    this.shells = this.shells.filter((sh) => !sh.gone);
  }

  /** A shell opening: its kind's stars, its light over the water and the roofs, its smoke. */
  burst(kind, x, y) {
    const s = this.scene;
    const cols = COLS[kind][Math.floor(Math.random() * COLS[kind].length)];
    if (kind === 'kiku') this.ring(x, y, 34, 42, 1.3, cols, { trail: 0.05 });
    else if (kind === 'botan') {
      this.ring(x, y, 28, 40, 1.2, cols, { scale: 1.15 });
      this.ring(x, y, 12, 18, 1, [cols[1], cols[0]], { scale: 0.9 });
    } else if (kind === 'yanagi') this.ring(x, y, 24, 30, 2.6, cols, { trail: 0.07, drag: 0.8, g: 12, a: 0.85, tlife: 0.9 });
    else {
      this.ring(x, y, 10, 22, 0.5, cols, { small: true });
      for (let k = 0; k < 5; k++) this.bursts.push({ x: x + (Math.random() - 0.5) * 36, y: y + (Math.random() - 0.5) * 36, t: 0.15 + k * 0.09, cols });
    }
    // its light, and its flash on the water and the roofs under it (brighter the darker the night)
    const lit = 0.25 + 0.4 * s.parallax.darkness(s.H);
    this.spark('hb_light', x, y, { life: 0.45, c0: cols[0], a: lit, scale: kind === 'senrin' ? 1.2 : 2, steady: true });
    this.spark('hb_light', x, y + 24, { life: 0.6, c0: cols[0], a: lit * 0.6, scale: 3, steady: true });
    if (this.puffs.length < 30) for (let k = 0; k < 3; k++) this.puff(x + (Math.random() - 0.5) * 24, y + (Math.random() - 0.5) * 24);
  }

  /** n stars thrown out round (x, y) at `speed`, living `life` s, turning from one colour to the other. */
  ring(x, y, n, speed, life, cols, o = {}) {
    // (over the most there may be at once, a shell opens thinner)
    const room = this.cfg.max - this.list.length;
    if (room <= 0) return;
    n = Math.min(n, room);
    const off = Math.random() * TAU;
    for (let i = 0; i < n; i++) {
      const an = off + (i / n) * TAU;
      const v = speed * (0.9 + Math.random() * 0.2);
      this.spark(o.small ? 'hb_star_s' : 'hb_star', x, y, { vx: Math.cos(an) * v, vy: Math.sin(an) * v, drag: o.drag ?? 1.2, g: o.g ?? 6, life: life * (0.85 + Math.random() * 0.3), c0: cols[0], c1: cols[1], a: o.a ?? 1, trail: o.trail ?? 0, tlife: o.tlife ?? 0.4, scale: o.scale ?? 1 });
    }
  }

  spark(frame, x, y, o) {
    const sp = this.stars.spawn(frame, x, y).setBlendMode(Phaser.BlendModes.ADD).setTint(o.c0);
    if (o.scale) sp.setScale(sp.base * o.scale);
    this.list.push({ sp, vx: 0, vy: 0, drag: 0, g: 0, a: 1, c1: o.c0, trail: 0, tt: 0, ...o, max: o.life });
    return sp;
  }

  updateStars(dt) {
    // (through the fight they are the night's sky behind it: a little dimmer, so the shots stand out)
    const dim = this.scene.enemies.bossGroup && !this.scene.bossDown ? 0.7 : 1;
    const wind = 5;
    for (const p of this.list) {
      p.life -= dt;
      if (p.life <= 0) {
        p.gone = true;
        continue;
      }
      const k = Math.min(1, p.drag * dt);
      p.vx -= p.vx * k;
      p.vy -= p.vy * k;
      p.vy += p.g * dt;
      p.sp.x += (p.vx + wind * 0.3) * dt;
      p.sp.y += p.vy * dt;
      const q = 1 - p.life / p.max;
      // (a star burns bright, then flickers out)
      const fade = p.steady ? p.life / p.max : p.life < 0.3 ? (Math.random() < 0.5 ? 0.3 : 1) * (p.life / 0.3) : 1;
      p.sp.setAlpha(p.a * fade * dim);
      if (p.c1 !== p.c0) p.sp.setTint(mix(p.c0, p.c1, q));
      if (p.trail && (p.tt -= dt) <= 0 && this.list.length < this.cfg.max) {
        p.tt = p.trail;
        this.spark('hb_star_s', p.sp.x, p.sp.y, { life: p.tlife, c0: mix(p.c0, p.c1, q), a: 0.55 * p.a, g: 3 });
      }
    }
    for (const p of this.list) if (p.gone) this.stars.kill(p.sp);
    this.list = this.list.filter((p) => !p.gone);
  }

  puff(x, y) {
    const sp = this.smoke.spawn(`hb_smoke_${Math.floor(Math.random() * 3)}`, x, y).setAlpha(0).setRotation(Math.floor(Math.random() * 4) * (Math.PI / 2));
    this.puffs.push({ sp, t: 0, life: 4.5 + Math.random() * 2, vx: 4 + Math.random() * 3, vy: (Math.random() - 0.5) * 2 });
  }

  /** The smoke drifts off on the wind, swelling and thinning. */
  updateSmoke(dt) {
    for (const p of this.puffs) {
      p.t += dt;
      const q = p.t / p.life;
      p.sp.x += p.vx * dt;
      p.sp.y += p.vy * dt;
      p.sp.setScale(p.sp.base * (0.9 + q * 0.8)).setAlpha(Math.min(1, p.t / 0.6) * (1 - q) * 0.55);
      if (q >= 1) {
        p.gone = true;
        this.smoke.kill(p.sp);
      }
    }
    this.puffs = this.puffs.filter((p) => !p.gone);
  }
}
