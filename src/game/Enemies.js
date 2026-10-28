import Phaser from 'phaser';
import { DEPTH, ENEMIES, FAIR, VIEW } from '../config.js';
import { Pool } from './Pool.js';

const { slow, normal, fast } = FAIR.bulletSpeed;
const DOWN = Math.PI / 2;
const TAU = Math.PI * 2;

// Six archetypes shared by every city; stage 1 dresses them as Fushimi Inari robots.
export class Enemies {
  constructor(scene) {
    this.scene = scene;
    this.pool = new Pool(scene, DEPTH.air);
    this.heads = new Pool(scene, DEPTH.ground + 0.2);
    this.wrecks = new Pool(scene, DEPTH.ground);
    this.heavy = null;
  }

  get live() {
    return this.pool.live;
  }

  count() {
    return this.pool.live.length;
  }

  spawn(w) {
    const def = ENEMIES[w.type];
    if (!def) {
      console.warn('unknown enemy type', w.type);
      return;
    }
    const s = this.scene;
    const base = {
      type: w.type,
      def,
      hp: w.hp ?? def.hp,
      radius: def.radius,
      age: 0,
      seen: 0, // time since it became visible
      state: 'enter',
      timer: 0,
      shots: 0,
      x0: w.x,
      path: w.path ?? 'line',
      pattern: w.pattern ?? 'aimed',
      dir: w.dir ?? (w.x < VIEW.width / 2 ? 1 : -1),
      flash: 0,
      flashCool: 0,
      ground: !!def.ground,
      head: null,
      u: 0,
    };
    let e;
    switch (w.type) {
      case 'popcorn':
        e = this.pool.spawn('popcorn_0', w.x, -8, base);
        e.play({ key: 'popcorn', startFrame: Math.floor(Math.random() * 2) });
        e.fireAt = Math.random() < FAIR.popcornFireChance ? 0.9 + Math.random() * 1.4 : Infinity;
        break;
      case 'shooter':
        e = this.pool.spawn('shooter_0', w.x, -12, base);
        e.play('shooter');
        e.stopY = w.y ?? 50 + Math.random() * 24;
        break;
      case 'diver':
        e = this.pool.spawn('diver_0', w.x, -10, base);
        e.play('diver');
        e.stopY = w.y ?? 30 + Math.random() * 18;
        break;
      case 'carrier':
        e = this.pool.spawn(`carrier_${w.color}_0`, w.x, -10, { ...base, color: w.color ?? 'red', path: w.path ?? 'zigzag' });
        e.play(`carrier_${e.color}`);
        e.zig = Math.random() < 0.5 ? -1 : 1;
        break;
      case 'heavy':
        e = this.pool.spawn('heavy_0', w.x, -26, base);
        e.play('heavy');
        this.heavy = e;
        e.patternIndex = 0;
        break;
      case 'turret': {
        // spawns just above the screen and stays glued to the mid layer
        e = this.pool.spawn('turret_base', w.x, -10, base);
        e.u = s.parallax.stripU(-10);
        e.timer = 0.9;
        e.head = this.heads.spawn('turret_head_0', w.x, -10);
        break;
      }
      default:
        return;
    }
    e.setDepth(e.ground ? DEPTH.ground : DEPTH.air + (w.type === 'heavy' ? -0.1 : 0));
    return e;
  }

  nearest(x, y) {
    let best = null;
    let bd = Infinity;
    for (const e of this.pool.live) {
      if (e.y < 0 || e.hp <= 0) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2 + (e.ground ? 900 : 0);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  canFire(e) {
    const H = this.scene.H;
    return e.seen >= FAIR.noFireAfterEnter && e.y > 4 && e.y < H * FAIR.noFireBelow && this.scene.bombClear <= 0;
  }

  aimAt(e, ox = 0, oy = 0) {
    const p = this.scene.player;
    return Math.atan2(p.y - (e.y + oy), p.x - (e.x + ox));
  }

  damage(e, amount, byBomb = false) {
    if (e.dead || e.hp <= 0) return;
    e.hp -= amount;
    // brief brighten, rate-limited so constant fire blinks instead of whiting the sprite out
    if (e.flashCool <= 0) {
      e.flash = 0.035;
      e.flashCool = 0.12;
    }
    if (e.hp <= 0) this.destroy(e, byBomb);
  }

  damageAll(amount) {
    for (const e of this.pool.live) if (e.y > -e.radius && e.y < this.scene.H + e.radius) this.damage(e, amount, true);
  }

  destroy(e) {
    const s = this.scene;
    s.score.kill(e.def);
    if (e.ground) {
      s.fx.explode(e.x, e.y, e.def.explosion, e.u);
      this.wrecks.spawn('turret_wreck', e.x, e.y, { u: e.u });
    } else s.fx.explode(e.x, e.y, e.def.explosion);
    if (e.type === 'carrier') s.spawnPickup(e.color, e.x, e.y, -40);
    if (e.type === 'heavy') {
      const { x, y } = e;
      for (let i = 0; i < 9; i++)
        s.time.delayedCall(i * 110, () => s.fx.explode(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 34, i % 3 ? 'm' : 's'));
      s.time.delayedCall(1000, () => {
        s.fx.explode(x, y, 'l');
        s.fx.flash(0.5, 0.4);
      });
      s.bullets.cancelAll(s.fx);
      s.fx.text(x, y - 24, `${e.def.score * s.score.mult}`, 1.6, 0xffe080);
      this.heavy = null;
    }
    this.remove(e);
  }

  remove(e) {
    if (e.head) this.heads.kill(e.head);
    if (e === this.heavy) this.heavy = null;
    this.pool.kill(e);
  }

  update(dt) {
    const s = this.scene;
    const H = s.H;
    const b = s.bullets;
    for (const e of this.pool.live) {
      if (e.dead) continue;
      e.age += dt;
      if (e.y > -e.radius) e.seen += dt;
      switch (e.type) {
        case 'popcorn':
          this.popcorn(e, dt);
          break;
        case 'shooter':
          this.shooter(e, dt, b);
          break;
        case 'diver':
          this.diver(e, dt);
          break;
        case 'carrier':
          this.carrier(e, dt);
          break;
        case 'heavy':
          this.heavyUpdate(e, dt, b);
          break;
        case 'turret':
          this.turret(e, dt, b);
          break;
      }
      e.flashCool -= dt;
      if (e.flash > 0) {
        e.flash -= dt;
        e.setTint(0x808080).setTintMode(Phaser.TintModes.ADD);
        e.head?.setTint(0x808080).setTintMode(Phaser.TintModes.ADD);
      } else if (e.tintMode !== Phaser.TintModes.MULTIPLY) {
        e.clearTint();
        e.head?.clearTint();
      }
      const off = e.y > H + 40 || e.y < -70 || e.x < -50 || e.x > VIEW.width + 50;
      if (off && (e.age > 2 || e.y > H)) this.remove(e);
    }
    this.pool.sweep();
    this.heads.sweep();
    for (const w of this.wrecks.live) {
      w.y = s.parallax.screenY(w.u);
      if (w.y > H + 20) this.wrecks.kill(w);
    }
    this.wrecks.sweep();
  }

  // ---------------------------------------------------------------- behaviours
  popcorn(e, dt) {
    switch (e.path) {
      case 'sine':
        e.y += 46 * dt;
        e.x = e.x0 + 26 * Math.sin(e.age * 2.4);
        break;
      case 'arc': {
        const th = DOWN - e.dir * Math.min(e.age * 0.85, 2.5);
        e.x += Math.cos(th) * 74 * dt;
        e.y += Math.sin(th) * 74 * dt;
        break;
      }
      case 'row':
        e.y += 50 * dt;
        break;
      default:
        e.y += 58 * dt;
    }
    if (e.age >= e.fireAt && this.canFire(e)) {
      e.fireAt = Infinity;
      this.scene.bullets.fire(e.x, e.y + 4, this.aimAt(e), slow);
    }
  }

  shooter(e, dt, b) {
    if (e.state === 'enter') {
      e.y += Math.max(8, (e.stopY - e.y) * 2.2) * dt;
      if (e.y >= e.stopY - 1) {
        e.state = 'attack';
        e.timer = 0.5;
        e.shots = 3;
      }
    } else if (e.state === 'attack') {
      e.x += Math.sin(e.age * 1.3) * 6 * dt;
      e.timer -= dt;
      if (e.timer <= 0) {
        if (this.canFire(e)) {
          if (e.pattern === 'fan') b.fan(e.x, e.y + 8, this.aimAt(e, 0, 8), 5, 0.9, slow);
          else b.fan(e.x, e.y + 8, this.aimAt(e, 0, 8), 3, 0.42, normal);
        }
        e.shots--;
        e.timer = 1.1;
        if (e.shots <= 0) {
          e.state = 'leave';
          e.timer = 0.5;
          e.vy = 0;
        }
      }
    } else {
      e.timer -= dt;
      if (e.timer <= 0) {
        e.vy -= 110 * dt;
        e.y += e.vy * dt;
        e.x += e.dir * -26 * dt;
      }
    }
  }

  diver(e, dt) {
    if (e.state === 'enter') {
      e.y += Math.max(10, (e.stopY - e.y) * 3) * dt;
      if (e.age > 0.75) {
        e.state = 'aim';
        e.timer = 0.35;
      }
    } else if (e.state === 'aim') {
      e.timer -= dt;
      e.flash = Math.floor(e.timer * 20) % 2 ? 0.02 : 0;
      if (e.timer <= 0) {
        e.state = 'dive';
        e.ang = this.aimAt(e);
        // never dive upwards
        if (Math.sin(e.ang) < 0.35) e.ang = e.ang < -DOWN || e.ang > DOWN ? Math.PI - 0.36 : 0.36;
        e.v = 70;
      }
    } else {
      e.v = Math.min(240, e.v + 280 * dt);
      e.x += Math.cos(e.ang) * e.v * dt;
      e.y += Math.sin(e.ang) * e.v * dt;
    }
  }

  carrier(e, dt) {
    if (e.state === 'enter') {
      if (e.path === 'zigzag') {
        e.y += 34 * dt;
        e.x += e.zig * 42 * dt;
        if (e.age % 0.9 < dt || e.x < 14 || e.x > VIEW.width - 14) {
          e.zig = e.x < 14 ? 1 : e.x > VIEW.width - 14 ? -1 : -e.zig;
        }
      } else e.y += 30 * dt;
      if (e.age > 4.6) {
        e.state = 'flee';
        e.vy = -10;
      }
    } else {
      e.vy -= 160 * dt;
      e.y += e.vy * dt;
    }
  }

  turret(e, dt, b) {
    const s = this.scene;
    e.y = s.parallax.screenY(e.u);
    const p = s.player;
    const ang = Math.atan2(p.y - e.y, p.x - e.x);
    // head frame i points along (-sin, cos) of i * 22.5deg
    const th = Math.atan2(-(p.x - e.x), p.y - e.y);
    const i = ((Math.round(th / (TAU / 16)) % 16) + 16) % 16;
    e.head.setFrame(`turret_head_${i}`).setPosition(e.x, e.y - 1);
    if (this.canFire(e)) {
      e.timer -= dt;
      if (e.timer <= 0) {
        e.timer = 2.2;
        const mx = e.x + Math.cos(ang) * 6;
        const my = e.y + Math.sin(ang) * 6;
        if (e.pattern === 'ring') {
          e.shots++;
          b.ring(mx, my, 10, e.shots * 0.31, slow);
        } else b.fan(mx, my, ang, 5, 0.84, slow);
      }
    }
  }

  heavyUpdate(e, dt, b) {
    if (e.state === 'enter') {
      e.y += Math.max(6, (72 - e.y) * 0.8) * dt;
      if (e.y >= 71) {
        e.state = 'fight';
        e.fight = 0;
        e.timer = 0.6;
        e.patternIndex = 0;
        e.step = 0;
      }
      return;
    }
    if (e.state === 'leave') {
      e.vy = (e.vy ?? 0) - 40 * dt;
      e.y += e.vy * dt;
      return;
    }
    e.fight += dt;
    e.x = 90 + 38 * Math.sin(e.fight * 0.45);
    if (e.fight > 34) {
      e.state = 'leave';
      return;
    }
    e.timer -= dt;
    if (e.timer > 0 || !this.canFire(e)) return;
    const p = e.patternIndex % 3;
    if (p === 0) {
      // three slow rings, each rotated
      b.ring(e.x, e.y + 4, 16, e.step * 0.2, slow, e.step % 2 === 0);
      e.timer = 0.7;
      if (++e.step >= 3) this.nextPattern(e);
    } else if (p === 1) {
      // aimed fans from both cannons
      b.fan(e.x - 5, e.y + 16, this.aimAt(e, -5, 16), 5, 0.6, normal);
      b.fan(e.x + 5, e.y + 16, this.aimAt(e, 5, 16), 3, 0.3, fast);
      e.timer = 0.45;
      if (++e.step >= 4) this.nextPattern(e);
    } else {
      // two-armed spiral
      const a = e.step * 0.38;
      b.fire(e.x, e.y + 4, a, slow, true);
      b.fire(e.x, e.y + 4, a + Math.PI, slow, true);
      e.timer = 0.11;
      if (++e.step >= 22) this.nextPattern(e);
    }
  }

  nextPattern(e) {
    e.patternIndex++;
    e.step = 0;
    e.timer = 1.0;
  }
}
