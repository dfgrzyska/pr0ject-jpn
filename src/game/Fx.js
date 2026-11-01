import Phaser from 'phaser';
import { DEPTH, VIEW } from '../config.js';
import { tr } from '../i18n.js';
import { pixelText } from './Hud.js';
import { Pool } from './Pool.js';

// What an explosion of each size throws out besides its fireball: puffs of smoke rolling off it, pieces of
// debris, the city's own bits (below), the light it casts on the ground (how far, in glow sprites) and, on
// the ground, the scorch mark it leaves (scorch_N, or -1 for none).
const BLAST = {
  s: { smoke: 1, debris: 2, bits: 3, glow: 0.45, scorch: -1, speed: 1 },
  m: { smoke: 3, debris: 5, bits: 5, glow: 0.8, scorch: 1, speed: 1.3 },
  l: { smoke: 6, debris: 10, bits: 9, glow: 1.5, scorch: 2, speed: 1.7 },
};

// Each city's bits in an explosion (by the stage's near layer): sakura petals in Kyoto, spray over Okinawa,
// ice in Sapporo, ash and embers at Sakurajima, neon sparks in Osaka, steam in Beppu.
const BITS = {
  sakura: { frames: ['petal_0', 'petal_1', 'petal_2', 'petal_3'], speed: 55, life: 1.1, drag: 1.8, g: 16 },
  tropic: { frames: ['drop_0', 'drop_1', 'drop_1'], speed: 75, life: 0.5, drag: 2.6, g: 0 },
  snow: { frames: ['shard_0', 'shard_1', 'shard_2'], speed: 85, life: 0.6, drag: 2.4, g: 0 },
  ash: { frames: ['ashf_1', 'ashf_2', 'ember_0', 'ember_1'], speed: 55, life: 0.9, drag: 1.8, g: 10 },
  osaka: { frames: ['dot_1', 'dot_2'], tints: [0xff4fb0, 0x4fe8ff, 0xffe04f, 0x9a7aff], speed: 95, life: 0.45, drag: 2.4, g: 0 },
  steam: { frames: ['wisp_s_0', 'wisp_s_1'], speed: 22, life: 0.8, drag: 1.2, g: -14, grow: 0.9, alpha: 0.7 },
};

export class Fx {
  constructor(scene) {
    this.scene = scene;
    this.air = new Pool(scene, DEPTH.airFx);
    this.ground = new Pool(scene, DEPTH.ground + 0.5);
    this.sparks = new Pool(scene, DEPTH.fx);
    this.petals = new Pool(scene, DEPTH.fx);
    this.parts = new Pool(scene, DEPTH.airFx + 0.05); // debris and the city's bits
    this.smokes = new Pool(scene, DEPTH.airFx + 0.1);
    this.scorch = new Pool(scene, DEPTH.ground - 0.1); // under the wrecks, riding on the ground
    this.lights = new Pool(scene, DEPTH.ground + 0.6); // the glow of explosions on the ground
    this.bits = BITS[scene.stage.near] ?? BITS.sakura;
    this.lastTop = null;
    this.texts = [];
    this.textFree = []; // floating texts are reused, not made and destroyed
    this.flashRect = scene.add
      .rectangle(0, 0, VIEW.width, VIEW.maxHeight, 0xffffff, 1)
      .setOrigin(0, 0)
      .setDepth(DEPTH.fx + 1)
      .setAlpha(0);
    this.flashT = 0;
    this.flashDur = 1;
    this.flashA = 0;
    this.ring = scene.add.graphics().setDepth(DEPTH.fx);
    this.rings = [];
  }

  /**
   * size: 's' | 'm' | 'l'. Ground explosions keep their strip position (u) and scroll. The fireball, then smoke
   * rolling off it, debris, the city's bits, its light on the ground and (on the ground) a scorch mark; light:
   * without the smoke and debris (one blast of a long chain).
   */
  explode(x, y, size, u = null, light = false) {
    const pool = u === null ? this.air : this.ground;
    const e = pool.spawn(`expl_${size}_0`, x, y, { u, vx: 0, vy: 0 });
    this.scene.sfx.explode(size);
    e.play(`expl_${size}`);
    e.once('animationcomplete', () => pool.kill(e));
    const k = BLAST[size];
    const onGround = u !== null;
    this.light(x, y, k.glow, onGround);
    if (!light) {
      this.smoke(x, y, k.smoke, k.speed * 4, onGround);
      this.debris(x, y, k.debris, null, k.speed, onGround);
    }
    this.cityBits(x, y, light ? 2 : k.bits, k.speed, onGround);
    if (onGround && k.scorch >= 0) {
      const s = this.scorch.spawn(`scorch_${k.scorch}`, x, y, {});
      s.setFlipX(Math.random() < 0.5).setFlipY(Math.random() < 0.5);
    }
    return e;
  }

  /** One moving particle: drag, a pull (g, px/s² down), spin, swelling, fading out over its life. */
  part(pool, frame, x, y, o) {
    return pool.spawn(frame, x, y, { vx: 0, vy: 0, drag: 2, g: 0, spin: 0, grow: 0, life: 0.6, wait: 0, a0: 1, ground: false, ...o, max: o.life ?? 0.6 });
  }

  /** Puffs of smoke rolling off a blast, a moment after it (spread: px around the centre). */
  smoke(x, y, n, spread = 4, ground = false) {
    for (let i = 0; i < n; i++) {
      const p = this.part(this.smokes, `smoke_${Math.min(2, Math.floor(Math.random() * (n > 2 ? 3 : 2)))}`, x + (Math.random() - 0.5) * spread * 2, y + (Math.random() - 0.5) * spread * 2, {
        vx: (Math.random() - 0.5) * 14,
        vy: 4 + Math.random() * 8,
        drag: 0.6,
        grow: 0.5 + Math.random() * 0.4,
        life: 0.8 + Math.random() * 0.6,
        wait: 0.08 + Math.random() * 0.14,
        a0: 0.65,
        ground,
      });
      p.setScale(0.6).setVisible(false).setRotation(Math.floor(Math.random() * 4) * (Math.PI / 2));
    }
  }

  /** Pieces of wreckage flying apart, spinning (tint: the colour of what broke, e.g. a ship's paint). */
  debris(x, y, n, tint = null, speed = 1, ground = false) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = (45 + Math.random() * 80) * speed;
      const hot = tint === null && speed > 1 && i % 3 === 0;
      const p = this.part(this.parts, hot ? 'debris_hot' : `debris_${i % 4}`, x, y, {
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        drag: 2.4,
        spin: (Math.random() - 0.5) * 16,
        life: 0.45 + Math.random() * 0.45,
        ground,
      });
      if (tint !== null) p.setTint(tint);
    }
  }

  /** The city's own bits in a blast. */
  cityBits(x, y, n, speed = 1, ground = false) {
    const b = this.bits;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = b.speed * speed * (0.4 + Math.random() * 0.8);
      const p = this.part(this.parts, b.frames[i % b.frames.length], x, y, {
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        drag: b.drag,
        g: b.g,
        grow: b.grow ?? 0,
        spin: b.grow ? 0 : (Math.random() - 0.5) * 6,
        life: b.life * (0.7 + Math.random() * 0.6),
        a0: b.alpha ?? 1,
        ground,
      });
      if (b.tints) p.setTint(b.tints[i % b.tints.length]);
    }
  }

  /** The warm light of a blast on the ground around it, strong at night, a faint warmth by day. */
  light(x, y, size, ground = false, tint = 0xffb070) {
    const a = 0.1 + 0.55 * this.scene.parallax.darkness(this.scene.H);
    const p = this.part(this.lights, 'glow', x, y, { life: 0.38, a0: a, grow: 0.6, drag: 0, ground });
    p.setScale(size).setTint(tint).setBlendMode(Phaser.BlendModes.ADD);
  }

  spark(x, y) {
    const s = this.sparks.spawn('spark_0', x, y, { u: null, vx: 0, vy: 0 });
    s.play('spark');
    s.once('animationcomplete', () => this.sparks.kill(s));
  }

  flash(alpha, duration) {
    this.flashA = alpha;
    this.flashDur = duration;
    this.flashT = duration;
  }

  shockwave(x, y) {
    this.rings.push({ x, y, r: 4, life: 0.6 });
  }

  petalBurst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 60 + Math.random() * 160;
      this.petals.spawn(`petal_${i % 4}`, x, y, {
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.8 + Math.random() * 0.8,
      });
    }
  }

  /** A single sprite that fades out where it stands (a kappa's splash). */
  puff(frame, x, y, life = 0.3) {
    this.petals.spawn(frame, x, y, { vx: 0, vy: 0, life });
  }

  /** Leaves scattering in a puff (the tanuki's shapeshifting). */
  leaves(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 30 + Math.random() * 90;
      this.petals.spawn(`leaf_${i % 2}`, x, y, { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: 0.6 + Math.random() * 0.6 });
    }
  }

  /** Ice shards / snow bits bursting out (shattered ice, snowball impact). */
  shards(x, y, n, small = false) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = (small ? 30 : 60) + Math.random() * (small ? 60 : 150);
      this.petals.spawn(`shard_${i % 3}`, x, y, { vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.4 + Math.random() * (small ? 0.3 : 0.7) });
    }
  }

  text(x, y, str, life = 1.2, tint = 0xffffff) {
    let t = this.textFree.pop();
    if (t) t.setText(tr(str)).setPosition(Math.round(x), Math.round(y)).setAlpha(1).setVisible(true);
    else t = pixelText(this.scene, x, y, str).setDepth(DEPTH.fx + 2);
    t.setTint(tint);
    // keep long labels on screen near the edges
    const half = Math.ceil(t.width / 2) + 2;
    t.x = Math.round(Math.min(Math.max(t.x, half), VIEW.width - half));
    this.texts.push({ t, life, max: life, fy: t.y });
  }

  update(dt, parallax) {
    for (const pool of [this.air, this.sparks]) pool.sweep();
    for (const e of this.ground.live) e.y = parallax.screenY(e.u);
    this.ground.sweep();
    // what lies on the ground moves down with it as the stage scrolls
    const scroll = this.lastTop === null ? 0 : parallax.uTop - this.lastTop;
    this.lastTop = parallax.uTop;
    const H = this.scene.H;
    for (const s of this.scorch.live) if ((s.y += scroll) > H + 30) this.scorch.kill(s);
    this.scorch.sweep();
    // smoke thins out while the screen is full of bullets, like the moving background
    const calm = parallax.props.fade;
    for (const pool of [this.parts, this.smokes, this.lights]) {
      for (const p of pool.live) {
        if (p.ground) p.y += scroll;
        if (p.wait > 0) {
          if ((p.wait -= dt) <= 0) p.setVisible(true);
          continue;
        }
        p.life -= dt;
        const drag = Math.min(1, p.drag * dt);
        p.vx -= p.vx * drag;
        p.vy -= p.vy * drag;
        p.vy += p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.spin) p.rotation += p.spin * dt;
        if (p.grow) p.setScale(p.scaleX + p.grow * dt);
        const k = p.life / p.max;
        p.setAlpha(p.a0 * Math.min(1, k * 2.5) * (pool === this.smokes ? calm : 1));
        if (p.life <= 0) pool.kill(p);
      }
      pool.sweep();
    }
    for (const p of this.petals.live) {
      p.life -= dt;
      p.vx *= 1 - 2.2 * dt;
      p.vy = p.vy * (1 - 2.2 * dt) + 30 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.setAlpha(Math.min(1, p.life * 2));
      if (p.life <= 0) this.petals.kill(p);
    }
    this.petals.sweep();

    if (this.flashT > 0) {
      this.flashT -= dt;
      this.flashRect.setAlpha(Math.max(0, (this.flashT / this.flashDur) * this.flashA));
    }

    this.ring.clear();
    let n = 0;
    for (const r of this.rings) if ((r.life -= dt) > 0) this.rings[n++] = r;
    this.rings.length = n;
    for (const r of this.rings) {
      r.r += 420 * dt;
      this.ring.lineStyle(3, 0xffd6e5, Math.min(1, r.life * 2.5));
      this.ring.strokeCircle(r.x, r.y, r.r);
      this.ring.lineStyle(1, 0xffffff, Math.min(1, r.life * 2.5));
      this.ring.strokeCircle(r.x, r.y, r.r * 0.8);
    }

    n = 0;
    for (const tx of this.texts) {
      if (tx.life > 0) this.texts[n++] = tx;
      else {
        tx.t.setVisible(false);
        this.textFree.push(tx.t);
      }
    }
    this.texts.length = n;
    for (const tx of this.texts) {
      tx.life -= dt;
      tx.fy -= 14 * dt;
      tx.t.y = Math.round(tx.fy); // whole pixels only, or the glyphs smear on some phones
      tx.t.setAlpha(Math.min(1, (tx.life / tx.max) * 3));
    }
  }
}
