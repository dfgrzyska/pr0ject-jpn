import { DEPTH, VIEW } from '../config.js';
import { Pool } from './Pool.js';
import { Props } from './Props.js';

// Three layers seen from above:
//   far  - the valley / open ocean far below (seamless loop, slowest; keeps moving during a boss)
//   mid  - the stage strip in 512px chunks; ground turrets ride on it
//   near - fastest, semi-transparent: sakura petals and mist (Kyoto), clouds and gulls (Okinawa),
//          falling snow blown by the wind, blizzard streaks and diamond dust (Sapporo),
//          volcanic ash, embers rising near the volcano, an ash storm with lightning (Kagoshima),
//          wisps of hot-spring steam (Beppu)
// On top of the mid layer, the parts of the strip that move (steam, wheels, boats...): see Props.js.
export class Parallax {
  constructor(scene, stage, meta) {
    this.scene = scene;
    this.speed = stage.scroll;
    this.anchor = stage.scroll.anchor;
    this.length = meta.length;
    this.chunkH = meta.chunkHeight;
    // the scroll stops at the end of the strip, or where the stage says (Kyoto: with the 大 on the screen)
    this.maxTime = ((stage.scroll.stop ?? meta.length) - this.anchor) / this.speed.mid;
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

    // the small drifting bits (ash, embers, snowflakes, petals) are blitter bobs: hundreds at once in a blizzard
    // or an ash storm, each far lighter than a sprite and the same to look at; the big ones (clouds, mist, steam
    // banks, gulls, blizzard streaks, sparkling dust) stay sprites, as they scale, turn or animate
    this.bits = scene.add.blitter(0, 0, 'sprites').setDepth(DEPTH.near);
    this.bitsLive = [];
    this.bitsFree = [];
    this.near = new Pool(scene, DEPTH.near);
    this.near.warm(this.nearKind === 'snow' ? 80 : 12); // (Sapporo's blizzard streaks come thick and fast)
    this.petalTimer = 0;
    this.mistTimer = 1;
    this.gullTimer = 4;
    this.snow = 0.3; // snowfall intensity 0..1 (set by the stage); 1 = blizzard
    this.wind = 0;
    this.windTarget = 0; // sideways push the miniboss's blizzard sets
    this.storm = 0; // ash storm (set by the stage while Raijū is here): darker sky, lightning flashes
    this.stormLevel = 0;
    this.flashT = 0;
    this.embersFrom = stage.embersFrom ?? Infinity; // stage time from which embers rise
    this.nightFrom = stage.nightFrom ?? Infinity; // Osaka: clouds and gulls by day, a clear night sky after
    this.dark = stage.dark ?? [[0, 0]]; // how dark the city is along the strip: [u, 0..1]
    // the shadows of clouds drifting over the land, fading out as night falls
    this.clouds = [0, 1].map((i) =>
      scene.add
        .image(Math.random() * VIEW.width, -40 - i * 260, 'sprites', `cshadow_${i}`)
        .setDepth(DEPTH.ground + 0.45)
        .setAlpha(0)
        .setFlipX(Math.random() < 0.5),
    );
    this.lastTop = null;
    this.props = new Props(scene, stage.id, meta, this);
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

    this.props.update(dt, H);
    this.updateNear(dt, scrolling, H);
    this.updateClouds(dt, H);
  }

  /** How dark the city is where the screen is now (0 by day .. 1 at night). */
  darkness(H) {
    const u = this.uTop - H / 2;
    const d = this.dark;
    if (u <= d[0][0]) return d[0][1];
    for (let i = 1; i < d.length; i++)
      if (u < d[i][0]) {
        const [u0, v0] = d[i - 1];
        const [u1, v1] = d[i];
        return v0 + ((v1 - v0) * (u - u0)) / (u1 - u0);
      }
    return d[d.length - 1][1];
  }

  /** Cloud shadows: carried down with the ground and a little faster (the wind), across a little. */
  updateClouds(dt, H) {
    const scroll = this.lastTop === null ? 0 : this.uTop - this.lastTop;
    this.lastTop = this.uTop;
    const a = 0.13 * (1 - this.darkness(H)) * this.props.fade;
    for (const c of this.clouds) {
      c.y += scroll + 6 * dt;
      c.x += 3 * dt;
      if (c.y - c.height / 2 > H || c.x - c.width / 2 > VIEW.width) {
        c.setPosition(-20 + Math.random() * (VIEW.width + 20), -c.height / 2 - Math.random() * 220).setFlipX(Math.random() < 0.5);
      }
      c.setAlpha(a);
    }
  }

  updateNear(dt, scrolling, H) {
    const fall = scrolling ? this.speed.near : 18;
    if (this.nearKind === 'tropic') this.spawnTropic(dt, fall, scrolling);
    else if (this.nearKind === 'snow') this.spawnSnow(dt, fall);
    else if (this.nearKind === 'ash') this.spawnAsh(dt, fall, H);
    else if (this.nearKind === 'steam') this.spawnSteam(dt, fall);
    else if (this.nearKind === 'momiji') this.spawnMomiji(dt, fall, scrolling);
    else if (this.nearKind === 'osaka') {
      if (this.time < this.nightFrom) this.spawnTropic(dt, fall, scrolling);
    }
    else this.spawnSakura(dt, fall, scrolling);
    const ship = this.scene.player?.alive ? this.scene.player : null;
    for (const p of this.near.live) {
      if (ship && this.nearKind === 'steam') {
        const dx = p.x - ship.x;
        const dy = p.y - ship.y;
        const d = Math.hypot(dx, dy);
        if (d < 52) {
          const k = 1 - d / 52;
          const sx = Math.abs(dx) > 3 ? dx / d : ship.bank >= 0 ? 1 : -1;
          p.vx += sx * k * 320 * dt;
          p.vy += (dy / (d || 1)) * k * 160 * dt;
          if (d < 30 && Math.random() < dt * 16) {
            const fx = this.scene.fx;
            const w = fx.part(fx.parts, Math.random() < 0.5 ? 'wisp_s_0' : 'wisp_s_1', ship.x + (Math.random() - 0.5) * 8, ship.y);
            w.vx = sx * (50 + Math.random() * 40);
            w.vy = 18 + Math.random() * 24;
            w.grow = 0.9;
            w.life = w.max = 0.4;
            w.a0 = 0.35;
          }
        }
        const stretch = Math.min(0.45, Math.abs(p.vx) / 130);
        const baseSc = p.big ? 1.6 : 1;
        p.setScale(baseSc + stretch, baseSc - stretch * 0.5).setRotation((p.vx / 130) * 0.22);
      }
      if (this.drift(p, dt, H)) this.near.kill(p);
    }
    this.near.sweep();
    let j = 0;
    const isLeaf = this.nearKind === 'sakura' || this.nearKind === 'momiji';
    const leafPrefix = this.nearKind === 'momiji' ? 'momiji_' : 'petal_';
    const pl = isLeaf && this.scene.player?.alive ? this.scene.player : null;
    for (const b of this.bitsLive) {
      if (pl && Math.abs(b.x - pl.x) < 46 && Math.abs(b.y - pl.y) < 46) {
        const dx = b.x - pl.x;
        const dy = b.y - pl.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 46) {
          const k = 1 - d / 46;
          const sx = Math.abs(dx) > 2 ? Math.sign(dx) : pl.bank < -0.1 ? 1 : pl.bank > 0.1 ? -1 : (b.age * 17) % 2 > 1 ? 1 : -1;
          b.vx += (sx * (320 + Math.abs(pl.vx || 0) * 1.2) + (pl.vx || 0) * 0.35) * k * dt;
          b.vy += ((dy < 0 ? -65 : 130) + (pl.vy || 0) * 0.3) * k * dt;
          if (d < 34) {
            b.flipT = 0.055;
            b.sway = Math.max(b.sway, 16);
            b.setAlpha(0.92);
          }
        }
      }
      if (this.drift(b, dt, H)) {
        b.setVisible(false);
        this.bitsFree.push(b);
      } else this.bitsLive[j++] = b;
    }
    this.bitsLive.length = j;
    if (pl && !pl.entering) {
      const spd = Math.hypot(pl.vx || 0, pl.vy || 0);
      const canopy = pl.x < 44 || pl.x > VIEW.width - 44 ? 14 : 0;
      const rate = 8 + canopy + Math.min(36, spd * 0.32 + Math.abs(pl.bank) * 20);
      if (Math.random() < dt * rate) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const b = this.bit(
          `${leafPrefix}${Math.floor(Math.random() * 4)}`,
          pl.x + side * (5 + Math.random() * 5),
          pl.y - 2 + Math.random() * 8,
          36 + Math.random() * 34,
          side * (68 + Math.random() * 55) - (pl.vx || 0) * 0.25,
          this.nearKind === 'momiji' ? 1 : 0,
          14 + Math.random() * 6,
          Math.random() * 3,
          0.055,
        );
        b.setAlpha(0.88);
        const s2 = -side;
        const wp = this.scene.fx.part(
          this.scene.fx.parts,
          `${leafPrefix}${Math.floor(Math.random() * 4)}`,
          pl.x + s2 * (6 + Math.random() * 4),
          pl.y + 2,
        );
        wp.vx = s2 * (75 + Math.random() * 60) - (pl.vx || 0) * 0.3;
        wp.vy = 28 + Math.random() * 38;
        wp.drag = 1.5;
        wp.g = 18;
        wp.spin = s2 * (9 + Math.random() * 7);
        wp.life = wp.max = 0.55 + Math.random() * 0.25;
        wp.a0 = 0.92;
        wp.setScale(1.15);
      }
    }
  }

  /** Move a drifting bit (sprite or bob) along; true once it has left the screen. */
  drift(p, dt, H) {
    p.age += dt;
    p.y += p.vy * dt;
    // snow drifts with the current wind (wf = how strongly, by flake size)
    p.x += (p.vx + (p.wf ? this.wind * p.wf : 0) + Math.sin(p.age * 3) * p.sway) * dt;
    if (Math.abs(p.vx) > 14) p.vx *= Math.max(0, 1 - 1.35 * dt);
    if (p.flipT && p.age % (p.flipT * 2) < dt) p.setFlipX(!p.flipX);
    return p.y > H + 40 || p.y < -60 || p.x < -60 || p.x > VIEW.width + 60;
  }

  /** A small drifting bit as a blitter bob (reused once it has drifted off). */
  bit(frame, x, y, vy, vx, wf, sway, age, flipT) {
    const b = this.bitsFree.pop() ?? this.bits.create(0, 0, frame);
    b.reset(x, y, frame); // (visible, opaque, unflipped)
    b.vy = vy;
    b.vx = vx;
    b.wf = wf;
    b.sway = sway;
    b.age = age;
    b.flipT = flipT;
    this.bitsLive.push(b);
    return b;
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
      const p = this.bit(`ashf_${size}`, Math.random() * 240 - 30, -4, (fall * 0.4 + 12) * wf * (0.8 + Math.random() * 0.4), 0, wf, 4 + Math.random() * 5, Math.random() * 6, 0);
      p.setAlpha(0.45 + wf * 0.25);
    }
    if (this.time >= this.embersFrom) {
      this.mistTimer -= dt;
      while (this.mistTimer <= 0) {
        this.mistTimer += 0.09;
        const p = this.bit(Math.random() < 0.6 ? 'ember_0' : 'ember_1', Math.random() * 180, H + 4, -(30 + Math.random() * 50), 0, 0.5, 8, Math.random() * 6, 0);
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

  /** Beppu: wisps and banks of hot-spring steam drifting past (faint, so bullets stay readable). */
  spawnSteam(dt, fall) {
    this.mistTimer -= dt;
    if (this.mistTimer > 0) return;
    this.mistTimer = 0.75 + Math.random() * 1.1;
    const big = Math.random() < 0.35;
    const frame = big ? `steam_${Math.floor(Math.random() * 2)}` : `wisp_s_${Math.floor(Math.random() * 2)}`;
    const m = this.near.spawn(frame, Math.random() * 180, -24, { vy: fall * (big ? 1.05 : 0.9), vx: -4 + Math.random() * 8, sway: 2, age: 0, flipT: 0, big });
    m.setAlpha(big ? 0.14 : 0.22).setScale(big ? 1.6 : 1);
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
      const p = this.bit(`flake_${size}`, Math.random() * 240 - 30, -4, (fall * 0.5 + 16) * wf * (0.8 + Math.random() * 0.4), 0, wf, 3 + Math.random() * 6, Math.random() * 6, 0);
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
      this.petalTimer += 0.09 + Math.random() * 0.14;
      const p = this.bit(
        `petal_${Math.floor(Math.random() * 4)}`,
        Math.random() * 196 - 8,
        -6,
        fall * (0.75 + Math.random() * 0.5),
        -8 + Math.random() * 16,
        0,
        Math.random() * 6,
        0,
        0.15 + Math.random() * 0.3,
      );
      p.setAlpha(0.75);
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

  /** Hiroshima & Miyajima: crimson/golden momiji leaves (swept sideways by Sankibō's gales), Seto gulls & Misen mist. */
  spawnMomiji(dt, fall, scrolling) {
    const s = this.snow;
    const breeze = Math.sin(this.farTime * 0.42) * 5;
    this.wind += (this.windTarget + breeze - this.wind) * Math.min(1, dt * 2.2);
    this.petalTimer -= dt;
    while (this.petalTimer <= 0) {
      this.petalTimer += 1 / (4 + 22 * s);
      const p = this.bit(
        `momiji_${Math.floor(Math.random() * 4)}`,
        Math.random() * 240 - 30,
        -6,
        fall * (0.68 + Math.random() * 0.45),
        -7 + Math.random() * 14,
        1,
        4 + Math.random() * 6,
        Math.random() * 4,
        0.14 + Math.random() * 0.24,
      );
      p.setAlpha(0.82);
    }
    if (scrolling && this.time >= 65 && this.time <= 150) {
      this.gullTimer -= dt;
      if (this.gullTimer <= 0) {
        this.gullTimer = 4.5 + Math.random() * 5;
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
    this.mistTimer -= dt;
    if (this.mistTimer <= 0 && scrolling) {
      this.mistTimer = this.time >= 135 ? 2.2 + Math.random() * 2.6 : 4.5 + Math.random() * 4;
      const m = this.near.spawn(`mist_${Math.floor(Math.random() * 2)}`, Math.random() * 180, -16, {
        vy: fall * 1.08,
        vx: -3 + Math.random() * 6,
        wf: 0.35,
        sway: 0,
        age: 0,
        flipT: 0,
      });
      m.setAlpha(this.time >= 135 ? 0.24 : 0.14);
    }
  }
}
