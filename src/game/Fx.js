import Phaser from 'phaser';
import { DEPTH, VIEW } from '../config.js';
import { tr } from '../i18n.js';
import { pixelText } from './Hud.js';
import { Pool } from './Pool.js';
import { blastSkinned } from './shipSkin.js';
import { sharedArt } from './enemyArt.js';

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
  harbor: { frames: ['dot_1', 'drop_0'], tints: [0xe8b76a, 0x8ac5d1], speed: 65, life: 0.5, drag: 2.2, g: 0 },
  sakura: { frames: ['petal_0', 'petal_1', 'petal_2', 'petal_3'], speed: 55, life: 1.1, drag: 1.8, g: 16 },
  tropic: { frames: ['drop_0', 'drop_1', 'drop_1'], speed: 75, life: 0.5, drag: 2.6, g: 0 },
  snow: { frames: ['shard_0', 'shard_1', 'shard_2'], speed: 85, life: 0.6, drag: 2.4, g: 0 },
  ash: { frames: ['ashf_1', 'ashf_2', 'ember_0', 'ember_1'], speed: 55, life: 0.9, drag: 1.8, g: 10 },
  osaka: { frames: ['dot_1', 'dot_2'], tints: [0xff4fb0, 0x4fe8ff, 0xffe04f, 0x9a7aff], speed: 95, life: 0.45, drag: 2.4, g: 0 },
  steam: { frames: ['wisp_s_0', 'wisp_s_1'], speed: 22, life: 0.8, drag: 1.2, g: -14, grow: 0.9, alpha: 0.7 },
  momiji: { frames: ['momiji_0', 'momiji_1', 'momiji_2', 'momiji_3'], speed: 62, life: 1.05, drag: 1.85, g: 15 },
};

export class Fx {
  constructor(scene) {
    this.scene = scene;
    this.air = new Pool(scene, DEPTH.airFx);
    this.ground = new Pool(scene, DEPTH.ground + 0.5);
    this.sparks = new Pool(scene, DEPTH.fx);
    this.petals = new Pool(scene, DEPTH.fx);
    this.coins = new Pool(scene, DEPTH.fx + 0.5); // a shot-down enemy's bullets turned to points, flying to the ship
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
    this.scenes = []; // a bomb's scene out of the gachapon, playing (see bombScene)
  }

  /**
   * size: 's' | 'm' | 'l'. Ground explosions keep their strip position (u) and scroll. The fireball, then smoke
   * rolling off it, debris, the city's bits, its light on the ground and (on the ground) a scorch mark; light:
   * without the smoke and debris (one blast of a long chain).
   */
  explode(x, y, size, u = null, light = false, bits = null) {
    const pool = u === null ? this.air : this.ground;
    const e = pool.spawn(`expl_${size}_0`, x, y);
    e.u = u;
    e.vx = 0;
    e.vy = 0;
    this.scene.sfx.explode(size);
    const look = this.scene.ship?.look?.blast; // (a look out of the gachapon: its colours, glow and bits)
    e.play(look?.ramp && blastSkinned() ? `expl_${size}_skin` : `expl_${size}`);
    e.once('animationcomplete', () => pool.kill(e));
    const k = BLAST[size];
    const onGround = u !== null;
    this.light(x, y, k.glow, onGround, look?.glow);
    if (!light) {
      this.smoke(x, y, k.smoke, k.speed * 4, onGround);
      this.debris(x, y, k.debris, null, k.speed, onGround);
    }
    this.cityBits(x, y, (light ? 2 : k.bits) * (look?.bits?.more ?? 1), k.speed, onGround, look?.bits ?? bits ?? this.bits); // (bits: an enemy's own, e.g. Tokyo's sets)
    if (onGround && k.scorch >= 0) {
      const s = this.scorch.spawn(`scorch_${k.scorch}`, x, y);
      s.setFlipX(Math.random() < 0.5).setFlipY(Math.random() < 0.5);
    }
    return e;
  }

  /** One moving particle: drag, a pull (g, px/s² down), spin, swelling, fading out over its life. */
  part(pool, frame, x, y, o) {
    const p = pool.spawn(frame, x, y);
    p.vx = 0;
    p.vy = 0;
    p.drag = 2;
    p.g = 0;
    p.spin = 0;
    p.grow = 0;
    p.life = 0.6;
    p.wait = 0;
    p.a0 = 1;
    p.ground = false;
    if (o) Object.assign(p, o);
    p.max = p.life;
    return p;
  }

  /** Puffs of smoke rolling off a blast, a moment after it (spread: px around the centre). */
  smoke(x, y, n, spread = 4, ground = false) {
    for (let i = 0; i < n; i++) {
      const p = this.part(this.smokes, `smoke_${Math.min(2, Math.floor(Math.random() * (n > 2 ? 3 : 2)))}`, x + (Math.random() - 0.5) * spread * 2, y + (Math.random() - 0.5) * spread * 2);
      p.vx = (Math.random() - 0.5) * 14;
      p.vy = 4 + Math.random() * 8;
      p.drag = 0.6;
      p.grow = 0.5 + Math.random() * 0.4;
      p.life = p.max = 0.8 + Math.random() * 0.6;
      p.wait = 0.08 + Math.random() * 0.14;
      p.a0 = 0.65;
      p.ground = ground;
      p.setScale(0.6 * p.base).setVisible(false).setRotation(Math.floor(Math.random() * 4) * (Math.PI / 2));
    }
  }

  /** Pieces of wreckage flying apart, spinning (tint: the colour of what broke, e.g. a ship's paint). */
  debris(x, y, n, tint = null, speed = 1, ground = false) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = (45 + Math.random() * 80) * speed;
      const hot = tint === null && speed > 1 && i % 3 === 0;
      const p = this.part(this.parts, hot ? 'debris_hot' : `debris_${i % 4}`, x, y);
      p.vx = Math.cos(a) * v;
      p.vy = Math.sin(a) * v;
      p.drag = 2.4;
      p.spin = (Math.random() - 0.5) * 16;
      p.life = p.max = 0.45 + Math.random() * 0.45;
      p.ground = ground;
      if (tint !== null) p.setTint(tint);
    }
  }

  /** The city's own bits in a blast. */
  cityBits(x, y, n, speed = 1, ground = false, b = this.bits) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = b.speed * speed * (0.4 + Math.random() * 0.8);
      const p = this.part(this.parts, b.frames[i % b.frames.length], x, y);
      p.vx = Math.cos(a) * v;
      p.vy = Math.sin(a) * v;
      p.drag = b.drag;
      p.g = b.g;
      p.grow = b.grow ?? 0;
      p.spin = b.grow ? 0 : (Math.random() - 0.5) * 6;
      p.life = p.max = b.life * (0.7 + Math.random() * 0.6);
      p.a0 = b.alpha ?? 1;
      p.ground = ground;
      if (b.tints) p.setTint(b.tints[i % b.tints.length]);
      if (b.scale) p.setScale(b.scale * p.base);
    }
  }

  /** The warm light of a blast on the ground around it, strong at night, a faint warmth by day. */
  light(x, y, size, ground = false, tint = 0xffb070) {
    const a = 0.1 + 0.55 * this.scene.parallax.darkness(this.scene.H);
    const p = this.part(this.lights, 'glow', x, y);
    p.life = p.max = 0.38;
    p.a0 = a;
    p.grow = 0.6;
    p.drag = 0;
    p.ground = ground;
    p.setScale(size * p.base).setTint(tint).setBlendMode(Phaser.BlendModes.ADD);
  }

  spark(x, y, tint = null) {
    const s = this.sparks.spawn('spark_0', x, y);
    if (tint != null) s.setTint(tint);
    s.u = null;
    s.vx = 0;
    s.vy = 0;
    s.play('spark');
    s.once('animationcomplete', () => this.sparks.kill(s));
  }

  /** A bullet turned to points (pts) where it was: it twinkles gold, drifts a moment and flies to the ship. */
  coin(x, y, pts) {
    const c = this.coins.spawn('spark_0', x, y);
    const a = Math.random() * Math.PI * 2;
    c.vx = Math.cos(a) * 30;
    c.vy = Math.sin(a) * 30 - 10;
    c.v = 60;
    c.age = 0;
    c.pts = pts;
    c.setTint(0xffd860);
  }

  flash(alpha, duration, color = 0xffffff) {
    this.flashRect.setFillStyle(color);
    this.flashA = alpha;
    this.flashDur = duration;
    this.flashT = duration;
  }

  /** color: the ring's (one of a list); the bomb's look out of the gachapon. */
  shockwave(x, y, color = null, { grow = 420, life = 0.6 } = {}) {
    this.rings.push({ x, y, r: 4, life, grow, c: Array.isArray(color) ? color[Math.floor(Math.random() * color.length)] : color });
    if (grow < 420) return; // (a small one: only its ring)
    for (const pool of [this.smokes, this.parts, this.petals]) {
      for (const p of pool.live) {
        if (p.ground) continue;
        const dx = p.x - x;
        const dy = p.y - y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 160) {
          const push = (1 - d / 160) * 140;
          p.vx += (dx / d) * push;
          p.vy += (dy / d) * push;
        }
      }
    }
    const bits = this.scene.parallax?.bitsLive;
    const near = this.scene.parallax?.near?.live;
    if (near) {
      for (const n of near) {
        const dx = n.x - x;
        const dy = n.y - y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 160) {
          const push = (1 - d / 160) * 140;
          n.vx += (dx / d) * push;
          n.vy += (dy / d) * push;
        }
      }
    }
    const propParts = this.scene.parallax?.props?.parts;
    if (propParts) {
      for (const q of propParts) {
        if (q.kind !== 'puff') continue;
        const py = this.scene.parallax.screenY(q.u) - q.rise;
        const dx = q.x + q.dx - x;
        const dy = py - y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 160) {
          const push = (1 - d / 160) * 140;
          q.vx = (q.vx || 0) + (dx / d) * push;
          q.vyPush = (q.vyPush || 0) + (dy / d) * push;
        }
      }
    }
    const enemies = this.scene.enemies?.pool?.live;
    if (enemies) {
      for (const e of enemies) {
        if (e.type !== 'steam' || e.dead) continue;
        const dx = e.x - x;
        const dy = e.y - y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 160) {
          const push = (1 - d / 160) * 150;
          e.vx = (e.vx || 0) + (dx / d) * push;
          e.vy = (e.vy || 0) + (dy / d) * push;
        }
      }
    }
    if (bits) {
      for (const b of bits) {
        const dx = b.x - x;
        const dy = b.y - y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 160) {
          const push = (1 - d / 160) * 110;
          b.vx += (dx / d) * push;
          b.vy += (dy / d) * push;
        }
      }
    }
  }

  /** look: what flies in place of the petals ({ frames, tints, scale }: the bomb's look out of the gachapon). */
  petalBurst(x, y, n, look = null) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 60 + Math.random() * 160;
      const p = this.petals.spawn(look?.frames ? look.frames[i % look.frames.length] : `petal_${i % 4}`, x, y);
      if (look?.tints) p.setTint(look.tints[i % look.tints.length]);
      if (look?.scale) p.setScale(look.scale * p.base);
      p.vx = Math.cos(a) * v;
      p.vy = Math.sin(a) * v;
      p.life = 0.8 + Math.random() * 0.8;
    }
  }

  /** A single sprite that fades out where it stands (a kappa's splash). */
  puff(frame, x, y, life = 0.3) {
    const p = this.petals.spawn(frame, x, y);
    p.vx = 0;
    p.vy = 0;
    p.life = life;
  }

  /** Blue fox-fire licking upwards (Kyūbi: its tails ablaze, a lost tail burning away, its end). */
  foxfire(x, y, n = 1, spread = 3) {
    for (let i = 0; i < n; i++) {
      const p = this.part(this.parts, `kitsunebi_${i % 2}`, x + (Math.random() - 0.5) * spread * 2, y + (Math.random() - 0.5) * spread * 2);
      p.vx = (Math.random() - 0.5) * 12;
      p.vy = -16 - Math.random() * 16;
      p.drag = 0.8;
      p.grow = -0.5;
      p.life = p.max = 0.35 + Math.random() * 0.3;
      p.a0 = 0.85;
      p.setScale((0.5 + Math.random() * 0.4) * p.base);
    }
  }

  /** Leaves scattering in a puff (the tanuki's shapeshifting). */
  leaves(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 30 + Math.random() * 90;
      const p = this.petals.spawn(`leaf_${i % 2}`, x, y);
      p.vx = Math.cos(a) * v;
      p.vy = Math.sin(a) * v - 20;
      p.life = 0.6 + Math.random() * 0.6;
    }
  }

  /** Ice shards / snow bits bursting out (shattered ice, snowball impact). */
  /** A Setsubun bean bursting on the oni: crumbs flying off and a warm flash. */
  beanPop(x, y) {
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 35 + Math.random() * 45;
      const p = this.part(this.parts, 'bean_bit', x, y);
      p.vx = Math.cos(a) * v;
      p.vy = Math.sin(a) * v - 15;
      p.g = 90;
      p.drag = 1.5;
      p.life = p.max = 0.35 + Math.random() * 0.2;
    }
    this.light(x, y, 0.5, false, 0xffd070);
  }

  shards(x, y, n, small = false) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = (small ? 30 : 60) + Math.random() * (small ? 60 : 150);
      const p = this.petals.spawn(`shard_${i % 3}`, x, y);
      p.vx = Math.cos(a) * v;
      p.vy = Math.sin(a) * v;
      p.life = 0.4 + Math.random() * (small ? 0.3 : 0.7);
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

  /** A hanko's print where an enemy went down (a seal out of the gachapon): stamped a little askew, fading. */
  seal(x, y, pic) {
    const p = this.part(this.parts, pic, x, y - 2, { drag: 0, life: 0.6, a0: 0.95 });
    p.setRotation((Math.random() - 0.5) * 0.5).setScale(1.15 * p.base);
    p.grow = -0.5; // (pressed down: it starts a little large)
  }

  /**
   * A bomb's scene out of the gachapon, across the whole screen for a second or so: a dragon flying up through
   * it, the great wave rolling over it, a parade of lanterns rising, a great fan opening from the ship, a flight
   * of cranes. Only for show: the bomb itself has done its work already.
   */
  bombScene(kind, x, y) {
    const s = this.scene;
    const H = s.H;
    const W = VIEW.width;
    const d = DEPTH.fx - 0.05;
    const img = (frame, scale = 1) => sharedArt(s.add.image(-99, -99, 'sprites', 'dot_2')).setFrame(frame).setScale(scale).setDepth(d);
    const fade = (t, dur, tail = 0.25) => Math.min(1, t / 0.12, (dur - t) / tail);
    let sc;
    if (kind === 'dragon') {
      // its head, a long body, the tail: each a little behind the one before along an S through the screen
      const parts = [img('ship_ryu_f1', 2.4), ...Array.from({ length: 11 }, (_, i) => img('ship_ryu_seg', 2.3 - i * 0.07)), img('ship_ryu_tail', 1.6)];
      parts.forEach((p, i) => p.setDepth(d - i * 0.001));
      const at = (u) => ({ x: W / 2 + Math.sin(u * 5.2) * 58, y: H + 50 - u * (H + 330) });
      sc = { dur: 1.7, items: parts, step: (t) => parts.forEach((p, i) => {
        const u = (t / 1.7) * 1.2 - i * 0.042;
        const a = at(u);
        const b = at(u + 0.01);
        p.setPosition(a.x, a.y).setRotation(Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2).setAlpha(fade(t, 1.7));
      }) };
    } else if (kind === 'lanterns') {
      const frames = ['ship_chochin', 'ship_chochin_f1', 'ship_chochin_f2', 'ship_chochin_t', 'ship_chochin_b'];
      const ls = Array.from({ length: 13 }, (_, i) => ({ o: img(frames[i % frames.length], 0.7 + (i % 3) * 0.15), x: 12 + ((i * 53) % (W - 24)), wait: i * 0.055, ph: i * 1.7 }));
      sc = { dur: 1.6, items: ls.map((l) => l.o), step: (t) => ls.forEach((l) => {
        const k = Math.max(0, t - l.wait);
        l.o.setPosition(l.x + Math.sin(k * 5 + l.ph) * 6, H + 24 - k * (H + 60) * 0.9).setRotation(Math.sin(k * 5 + l.ph) * 0.18).setAlpha(fade(t, 1.6));
      }) };
    } else if (kind === 'flock') {
      // a wedge of paper cranes, their wings beating, out of the bottom and away over the top
      const cs = Array.from({ length: 21 }, (_, i) => ({ o: img('ship_orizuru', i ? 0.9 : 1.3), row: Math.ceil(i / 2), side: i % 2 ? -1 : 1 }));
      sc = { dur: 1.5, items: cs.map((c) => c.o), step: (t) => cs.forEach((c, i) => {
        const beat = [0, 1, 2, 1][Math.floor(t * 12 + i) % 4];
        c.o.setFrame(beat ? `ship_orizuru_f${beat}` : 'ship_orizuru').setPosition(x + c.side * c.row * 15 + Math.sin(t * 4 + i) * 2, H + 30 + c.row * 13 - t * (H + 200) / 1.3).setAlpha(fade(t, 1.5));
      }) };
    } else {
      const g = s.add.graphics().setDepth(d);
      if (kind === 'wave') {
        // four rolling bands of blue, the first one's crest white with foam, up the screen
        const BLUES = [0xe8f6ff, 0x7ac0ff, 0x3a82f0, 0x1c3f9a];
        sc = { dur: 1.3, items: [g], step: (t) => {
          g.clear();
          const k = t / 1.3;
          const a = fade(t, 1.3, 0.4);
          const crest = H + 30 - k * (H + 150);
          BLUES.forEach((c, j) => {
            const top = (px) => crest + j * 13 + Math.sin(px * 0.085 + t * 7 + j * 1.3) * 7 - Math.max(0, Math.sin(px * 0.045 - t * 3)) * 10 * (j === 0 ? 1 : 0.4);
            g.fillStyle(c, a * (j === 0 ? 0.9 : 0.6));
            g.beginPath();
            g.moveTo(0, top(0));
            for (let px = 6; px <= W; px += 6) g.lineTo(px, top(px));
            g.lineTo(W, crest + 110);
            g.lineTo(0, crest + 110);
            g.closePath();
            g.fillPath();
            if (j === 0) for (let px = 4; px < W; px += 11) g.fillStyle(0xffffff, a).fillCircle(px + Math.sin(t * 9 + px) * 2, top(px) - 2, 2.5 + Math.sin(px) * 1);
          });
        } };
      } else {
        // a great folding fan opening upwards out of the ship: paper in cream and red, gold ribs, a red sun on it
        sc = { dur: 1.25, items: [g], step: (t) => {
          g.clear();
          const open = 1 - (1 - Math.min(1, t / 0.32)) ** 3;
          const a = fade(t, 1.25, 0.4) * 0.88;
          const R = 150 * (0.6 + 0.4 * open);
          const half = 1.2 * open;
          const n = 11;
          for (let i = 0; i < n; i++) {
            const a0 = -Math.PI / 2 - half + (i / n) * half * 2;
            const a1 = -Math.PI / 2 - half + ((i + 1) / n) * half * 2;
            g.fillStyle(i % 2 ? 0xfff4e0 : 0xf0e2c4, a);
            g.slice(x, y, R, a0, a1, false).fillPath();
            g.fillStyle(0xd2361f, a);
            g.slice(x, y, R, a0, a1, false).fillPath();
            g.fillStyle(i % 2 ? 0xfff4e0 : 0xf0e2c4, a);
            g.slice(x, y, R * 0.9, a0, a1, false).fillPath();
            g.lineStyle(1.5, 0xe2aa32, a).lineBetween(x, y, x + Math.cos(a0) * R, y + Math.sin(a0) * R);
          }
          g.lineStyle(1.5, 0xe2aa32, a).lineBetween(x, y, x + Math.cos(-Math.PI / 2 + half) * R, y + Math.sin(-Math.PI / 2 + half) * R);
          g.fillStyle(0xd2361f, a).fillCircle(x, y - R * 0.58, 20 * open);
          g.fillStyle(0x0a1024, a);
          g.slice(x, y, R * 0.22, -Math.PI / 2 - half, -Math.PI / 2 + half, false).fillPath();
        } };
      }
    }
    sc.t = 0;
    sc.step(0);
    this.scenes.push(sc);
  }

  update(dt, parallax) {
    // (the bombs' scenes: each played to its end, then cleared away)
    for (const sc of this.scenes) {
      sc.t += dt;
      if (sc.t < sc.dur) sc.step(sc.t);
      else for (const o of sc.items) o.destroy();
    }
    if (this.scenes.length) this.scenes = this.scenes.filter((sc) => sc.t < sc.dur);
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
        if (!p.ground && pool === this.smokes && parallax.wind) p.x += parallax.wind * 0.45 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.spin) p.rotation += p.spin * dt;
        if (p.grow) p.setScale(p.scaleX + p.grow * p.base * dt); // (base: 1/3 for a frame from sprites540)
        const k = p.life / p.max;
        p.setAlpha(p.a0 * Math.min(1, k * 2.5) * (pool === this.smokes ? calm : 1));
        if (p.life <= 0) pool.kill(p);
      }
      pool.sweep();
    }
    // the points a shot-down enemy's bullets turned into: a moment's drift, then off to the ship, faster and faster
    const ship = this.scene.player;
    for (const c of this.coins.live) {
      c.age += dt;
      if (c.age > 0.18 && ship?.alive) {
        const [dx, dy] = [ship.x - c.x, ship.y - c.y];
        const d = Math.hypot(dx, dy) || 1;
        c.v = Math.min(520, c.v + 900 * dt);
        c.vx += ((dx / d) * c.v - c.vx) * Math.min(1, 9 * dt);
        c.vy += ((dy / d) * c.v - c.vy) * Math.min(1, 9 * dt);
        if (d < 7) {
          this.scene.score.add(c.pts);
          this.scene.sfx.coin?.();
          this.coins.kill(c);
          continue;
        }
      } else if (!ship?.alive && c.age > 1.2) {
        this.coins.kill(c);
        continue;
      }
      c.vx *= c.age > 0.18 ? 1 : 1 - 4 * dt;
      c.vy *= c.age > 0.18 ? 1 : 1 - 4 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.setFrame(Math.floor(c.age * 14) % 3 ? 'spark_1' : 'spark_0'); // (a gold star, twinkling)
    }
    this.coins.sweep();
    for (const p of this.petals.live) {
      p.life -= dt;
      p.vx *= 1 - 2.2 * dt;
      p.vy = p.vy * (1 - 2.2 * dt) + 30 * dt;
      if (parallax.wind) p.x += parallax.wind * 0.35 * dt;
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
      r.r += r.grow * dt;
      this.ring.lineStyle(3, r.c ?? 0xffd6e5, Math.min(1, r.life * 2.5));
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
