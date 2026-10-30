import { DEPTH, VIEW } from '../config.js';
import { Pool } from './Pool.js';

// Three layers seen from above:
//   far  - the valley / open ocean far below (seamless loop, slowest; keeps moving during a boss)
//   mid  - the stage strip in 512px chunks; ground turrets ride on it
//   near - fastest, semi-transparent: sakura petals and mist (Kyoto), clouds and gulls (Okinawa),
//          falling snow blown by the wind, blizzard streaks and diamond dust (Sapporo),
//          volcanic ash, embers rising near the volcano, an ash storm with lightning (Kagoshima)
export class Parallax {
  constructor(scene, stage, meta) {
    this.scene = scene;
    this.speed = stage.scroll;
    this.anchor = stage.scroll.anchor;
    this.length = meta.length;
    this.chunkH = meta.chunkHeight;
    this.maxTime = (meta.length - this.anchor) / this.speed.mid;
    this.time = 0;
    this.farTime = 0;
    this.uTop = this.anchor;
    this.nearKind = stage.near ?? 'sakura';
    const farKey = `far_${stage.id}`;

    this.far = scene.add
      .tileSprite(0, 0, VIEW.width, VIEW.maxHeight, farKey)
      .setOrigin(0, 0)
      .setDepth(DEPTH.far);
    this.farH = scene.textures.get(farKey).getSourceImage().height;
    this.chunks = [];
    for (let i = 0; i < meta.chunks; i++)
      this.chunks.push(scene.add.image(0, 0, `mid_${stage.id}_${i}`).setOrigin(0, 0).setDepth(DEPTH.mid).setVisible(false));

    this.near = new Pool(scene, DEPTH.near);
    this.petalTimer = 0;
    this.mistTimer = 1;
    this.snow = 0.3; // snowfall intensity 0..1 (set by the stage); 1 = blizzard
    this.wind = 0;
    this.windTarget = 0; // sideways push the miniboss's blizzard sets
    this.storm = 0; // ash storm (set by the stage while Raijū is here): darker sky, lightning flashes
    this.stormLevel = 0;
    this.flashT = 0;
    this.embersFrom = stage.embersFrom ?? Infinity; // stage time from which embers rise
    if (this.nearKind === 'ash')
      this.stormRect = scene.add.rectangle(0, 0, VIEW.width, VIEW.maxHeight, 0x14141e, 1).setOrigin(0, 0).setDepth(DEPTH.near - 0.05).setAlpha(0);
  }

  /** Jump to a point in the stage (debug / restart). */
  setTime(t) {
    this.time = Math.min(t, this.maxTime);
    this.farTime = t;
  }

  /** Screen y of a strip position u (distance from the start of the strip). */
  screenY(u) {
    return this.uTop - u;
  }

  /** Strip position under a screen y. */
  stripU(y) {
    return this.uTop - y;
  }

  update(dt, scrolling, H) {
    if (scrolling) {
      this.time = Math.min(this.time + dt, this.maxTime);
      this.farTime += dt;
    }
    this.uTop = Math.round(this.anchor + this.time * this.speed.mid);

    const top = this.length - this.uTop; // strip y at the top of the screen
    for (let i = 0; i < this.chunks.length; i++) {
      const y = i * this.chunkH - top;
      const img = this.chunks[i];
      const vis = y < H && y + this.chunkH > 0;
      img.setVisible(vis);
      if (vis) img.y = y;
    }
    this.far.tilePositionY = -(Math.round(this.farTime * this.speed.far) % this.farH);

    this.updateNear(dt, scrolling, H);
  }

  updateNear(dt, scrolling, H) {
    const fall = scrolling ? this.speed.near : 18;
    if (this.nearKind === 'tropic') this.spawnTropic(dt, fall, scrolling);
    else if (this.nearKind === 'snow') this.spawnSnow(dt, fall);
    else if (this.nearKind === 'ash') this.spawnAsh(dt, fall, H);
    else this.spawnSakura(dt, fall, scrolling);
    for (const p of this.near.live) {
      p.age += dt;
      p.y += p.vy * dt;
      // snow drifts with the current wind (wf = how strongly, by flake size)
      p.x += ((p.wf ? this.wind * p.wf : p.vx) + Math.sin(p.age * 3) * p.sway) * dt;
      if (p.flipT && p.age % (p.flipT * 2) < dt) p.setFlipX(!p.flipX);
      if (p.y > H + 40 || p.y < -60 || p.x < -60 || p.x > VIEW.width + 60) this.near.kill(p);
    }
    this.near.sweep();
  }

  /** Kagoshima: ash drifting down, embers rising on the volcano, and Raijū's ash storm with lightning. */
  spawnAsh(dt, fall, H) {
    const s = this.snow;
    this.wind += (Math.sin(this.farTime * 0.3) * 8 + this.windTarget - this.wind) * Math.min(1, dt);
    this.petalTimer -= dt;
    while (this.petalTimer <= 0) {
      this.petalTimer += 1 / (8 + 50 * s);
      const size = Math.random() < 0.6 ? 0 : Math.random() < 0.75 ? 1 : 2;
      const wf = [0.6, 0.9, 1.2][size];
      const p = this.near.spawn(`ashf_${size}`, Math.random() * 240 - 30, -4, { vy: (fall * 0.4 + 12) * wf * (0.8 + Math.random() * 0.4), vx: 0, wf, sway: 4 + Math.random() * 5, age: Math.random() * 6, flipT: 0 });
      p.setAlpha(0.45 + wf * 0.25);
    }
    if (this.time >= this.embersFrom) {
      this.mistTimer -= dt;
      while (this.mistTimer <= 0) {
        this.mistTimer += 0.09;
        const p = this.near.spawn(Math.random() < 0.6 ? 'ember_0' : 'ember_1', Math.random() * 180, H + 4, { vy: -(30 + Math.random() * 50), vx: 0, wf: 0.5, sway: 8, age: Math.random() * 6, flipT: 0 });
        p.setAlpha(0.85);
      }
    }
    // the storm darkens the sky; lightning lights it up now and then
    this.stormLevel += (this.storm - this.stormLevel) * Math.min(1, dt * 1.5);
    if (this.stormLevel > 0.5 && this.flashT <= 0 && Math.random() < dt * 0.5) this.flashT = 0.18;
    if (this.flashT > 0) {
      this.flashT -= dt;
      this.stormRect.setFillStyle(0xd8e8ff).setAlpha(Math.max(0, this.flashT / 0.18) * 0.22);
    } else this.stormRect.setFillStyle(0x14141e).setAlpha(this.stormLevel * 0.3);
  }

  /** Okinawa: big soft clouds drifting past and the odd seagull. */
  spawnTropic(dt, fall, scrolling) {
    this.mistTimer -= dt;
    if (this.mistTimer <= 0) {
      this.mistTimer = 2.2 + Math.random() * 3;
      const c = this.near.spawn(`cloud_${Math.floor(Math.random() * 2)}`, Math.random() * 180, -30, {
        vy: fall * 1.15,
        vx: -4 + Math.random() * 8,
        sway: 0,
        age: 0,
        flipT: 0,
      });
      c.setAlpha(0.3);
    }
    this.petalTimer -= dt;
    if (this.petalTimer <= 0 && scrolling) {
      this.petalTimer = 5 + Math.random() * 6;
      const left = Math.random() < 0.5;
      const g = this.near.spawn('gull_0', left ? -8 : VIEW.width + 8, -10 + Math.random() * 60, {
        vy: fall * 0.55,
        vx: (left ? 1 : -1) * (26 + Math.random() * 14),
        sway: 4,
        age: 0,
        flipT: 0,
      });
      g.setFlipX(!left).setAlpha(0.85).play('gull');
    }
  }

  /** Sapporo: snowflakes in three sizes, wind gusts; streaks in a blizzard, sparkling diamond dust in calm air. */
  spawnSnow(dt, fall) {
    const s = this.snow;
    const gust = Math.sin(this.farTime * 0.37) * 10 + Math.sin(this.farTime * 1.3) * 4 * s;
    this.wind += (this.windTarget + gust * (0.4 + s) - this.wind) * Math.min(1, dt * 1.5);
    this.petalTimer -= dt;
    while (this.petalTimer <= 0) {
      this.petalTimer += 1 / (10 + 80 * s * s);
      const r = Math.random();
      const size = r < 0.55 ? 0 : r < 0.88 ? 1 : 2;
      const wf = [0.7, 1, 1.4][size];
      const p = this.near.spawn(`flake_${size}`, Math.random() * 240 - 30, -4, { vy: (fall * 0.5 + 16) * wf * (0.8 + Math.random() * 0.4), vx: 0, wf, sway: 3 + Math.random() * 6, age: Math.random() * 6, flipT: 0 });
      p.setAlpha(0.45 + wf * 0.3);
    }
    this.mistTimer -= dt;
    if (this.mistTimer <= 0) {
      if (s > 0.8) {
        // blizzard streaks along the wind
        this.mistTimer = 0.03;
        const vy = 170 + Math.random() * 60;
        const p = this.near.spawn('streak', Math.random() * 260 - 40, -6, { vy, vx: 0, wf: 2.6, sway: 0, age: 0, flipT: 0 });
        p.setAlpha(0.35).setRotation(-Math.atan2(this.wind * 2.6, vy));
      } else if (s < 0.5) {
        // diamond dust: tiny ice crystals sparkling in still, cold air
        this.mistTimer = 0.35 + Math.random() * 0.5;
        const p = this.near.spawn('dust_0', Math.random() * 180, Math.random() * 200, { vy: fall * 0.3, vx: 0, wf: 0.3, sway: 2, age: 0, flipT: 0 });
        p.setAlpha(0.7).play('dust');
      } else this.mistTimer = 0.2;
    }
  }

  spawnSakura(dt, fall, scrolling) {
    this.petalTimer -= dt;
    if (this.petalTimer <= 0) {
      this.petalTimer = 0.25 + Math.random() * 0.4;
      const p = this.near.spawn(`petal_${Math.floor(Math.random() * 4)}`, Math.random() * 196 - 8, -6, {
        vy: fall * (0.75 + Math.random() * 0.5),
        vx: -8 + Math.random() * 16,
        sway: Math.random() * 6,
        age: 0,
        flipT: 0.15 + Math.random() * 0.3,
      });
      p.setAlpha(0.65);
    }
    this.mistTimer -= dt;
    if (this.mistTimer <= 0 && scrolling) {
      this.mistTimer = 3 + Math.random() * 4;
      const m = this.near.spawn(`mist_${Math.floor(Math.random() * 2)}`, Math.random() * 180, -16, {
        vy: fall * 1.1,
        vx: -3 + Math.random() * 6,
        sway: 0,
        age: 0,
        flipT: 0,
      });
      m.setAlpha(0.22);
    }
  }
}
