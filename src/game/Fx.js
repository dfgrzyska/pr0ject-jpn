import { DEPTH, VIEW } from '../config.js';
import { pixelText } from './Hud.js';
import { Pool } from './Pool.js';

export class Fx {
  constructor(scene) {
    this.scene = scene;
    this.air = new Pool(scene, DEPTH.airFx);
    this.ground = new Pool(scene, DEPTH.ground + 0.5);
    this.sparks = new Pool(scene, DEPTH.fx);
    this.petals = new Pool(scene, DEPTH.fx);
    this.texts = [];
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

  /** size: 's' | 'm' | 'l'. Ground explosions keep their strip position (u) and scroll. */
  explode(x, y, size, u = null) {
    const pool = u === null ? this.air : this.ground;
    const e = pool.spawn(`expl_${size}_0`, x, y, { u, vx: 0, vy: 0 });
    this.scene.sfx.explode(size);
    e.play(`expl_${size}`);
    e.once('animationcomplete', () => pool.kill(e));
    return e;
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
    const t = pixelText(this.scene, x, y, str).setDepth(DEPTH.fx + 2).setTint(tint);
    // keep long labels on screen near the edges
    const half = Math.ceil(t.width / 2) + 2;
    t.x = Math.round(Math.min(Math.max(t.x, half), VIEW.width - half));
    this.texts.push({ t, life, max: life, fy: t.y });
  }

  update(dt, parallax) {
    for (const pool of [this.air, this.sparks]) pool.sweep();
    for (const e of this.ground.live) e.y = parallax.screenY(e.u);
    this.ground.sweep();
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
    this.rings = this.rings.filter((r) => (r.life -= dt) > 0);
    for (const r of this.rings) {
      r.r += 420 * dt;
      this.ring.lineStyle(3, 0xffd6e5, Math.min(1, r.life * 2.5));
      this.ring.strokeCircle(r.x, r.y, r.r);
      this.ring.lineStyle(1, 0xffffff, Math.min(1, r.life * 2.5));
      this.ring.strokeCircle(r.x, r.y, r.r * 0.8);
    }

    this.texts = this.texts.filter(({ t, life, max }) => {
      if (life <= 0) {
        t.destroy();
        return false;
      }
      return true;
    });
    for (const tx of this.texts) {
      tx.life -= dt;
      tx.fy -= 14 * dt;
      tx.t.y = Math.round(tx.fy); // whole pixels only, or the glyphs smear on some phones
      tx.t.setAlpha(Math.min(1, (tx.life / tx.max) * 3));
    }
  }
}
