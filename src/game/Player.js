import Phaser from 'phaser';
import { BEANS, BOMB, DEPTH, FROST, GRAZE, HEAT, MOMENTUM, OFUDA, PLAYER, SHIPS, SURGE, TURRETS, VIEW, WEAPONS } from '../config.js';
import { rules } from '../difficulty.js';
import { Pool } from './Pool.js';
import { baseScale, sharedArt, spriteTexture } from './enemyArt.js';

const WEAPON_NAMES = { basic: 'PODSTAWOWA', spread: 'ROZRZUT', laser: 'LASER', homing: 'NAPROWADZANE' };
const WEAPON_TINT = { spread: 0xff8a6a, laser: 0x8ac8ff, homing: 0x9cf09a };

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.sprite = scene.add.sprite(0, 0, 'sprites', 'ship').setDepth(DEPTH.player);
    this.flame = sharedArt(scene.add.sprite(0, 0, 'sprites', 'flame_0')).setOrigin(0.5, 0).setDepth(DEPTH.player - 0.1).play('flame');
    this.dot = sharedArt(scene.add.image(0, 0, 'sprites', 'hitbox')).setDepth(DEPTH.player + 0.1);
    this.muzzle = sharedArt(scene.add.image(0, 0, 'sprites', 'muzzle_0')).setDepth(DEPTH.player + 0.05).setVisible(false); // flash at the nose
    this.noseGlow = scene.add.image(0, 0, 'sprites', 'glow').setDepth(DEPTH.player - 0.05).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    this.bank = 0;
    this.thrust = 0;
    this.muzzleT = 0;
    this.trailT = 0;
    this.shots = new Pool(scene, DEPTH.playerShot);
    // Setsubun: two beans circling the ship while it has beans to throw (blinking as they run out)
    this.beanOrbit = [0, 1].map(() => sharedArt(scene.add.image(0, 0, 'sprites', 'ps_bean')).setDepth(DEPTH.player + 0.02).setVisible(false));
    // Sapporo: Yuki-onna's frost, the block of ice the ship is caught in when it freezes over
    this.iceBlock = sharedArt(scene.add.image(0, 0, 'sprites', 'ice_block')).setDepth(DEPTH.player + 0.08).setVisible(false);
    // Tsuru: paper talismans circling the ship (OFUDA)
    this.ofuda = Array.from({ length: OFUDA.max }, () => ({ on: false, t: 0, s: sharedArt(scene.add.image(0, 0, 'sprites', 'orizuru_0')).setScale(0.5).setTint(0xfff4e0).setDepth(DEPTH.player + 0.03).setVisible(false) }));
    this.ofudaCharge = 0; // grazes towards the next talisman
    this.momentum = 0; // Tsubame: 0..1, faster fire (MOMENTUM)
    this.rage = 0; // Oni: extra damage, higher up the screen
    this.surge = 0; // s left of a spirit surge (SURGE)
    this.surgeCharge = 0; // grazes towards it, while the bomb is ready
    // the purple power-up: turrets at the wing tips, and the bubble they keep around the ship (TURRETS)
    this.turrets = 0;
    this.turretTimer = 0;
    this.shieldT = 0; // s left in which the bubble swallows what touches it, after it took a hit
    this.turretArt = [0, 1].map(() => sharedArt(scene.add.image(0, 0, 'sprites', 'turret_wing')).setDepth(DEPTH.player + 0.01).setVisible(false));
    this.bubble = scene.add.graphics().setDepth(DEPTH.player - 0.2);

    this.setShip(SHIPS[1]);
    this.bombs = 1;
    this.weapon = 'basic';
    this.level = 1;
    this.alive = false;
    this.entering = 0;
    this.invulnerable = 0;
    this.respawnTimer = 0;
    this.fireTimer = 0;
    this.orbTimer = 0;
    this.volleys = 0;
    this.heat = 0; // Beppu: steam heats the guns (see HEAT)
    this.jam = 0; // s left with overheated, silent guns
    this.heatOn = false; // the stage has steam: the HUD shows the heat gauge
    this.beanT = 0; // s left of Setsubun beans
    this.grazeCharge = 0; // grazes towards the next bomb (while the bomb is spent)
    this.frost = 0; // Sapporo: Yuki-onna's freezing mist frosts the ship over, slowing it (see FROST)
    this.frozen = 0; // s left caught in a block of ice, unable to move
    this.pull = null; // { x, y, k }: a wind dragging the ship towards a point at k px/s (set every frame)
    this.drag = null;
    this.god = false;
    this.x = VIEW.width / 2;
    this.y = scene.H + 30;
    this.setVisible(false);
  }

  setShip(ship) {
    this.ship = ship;
    this.lives = this.fullLives();
    this.shipFrame(ship.frame);
  }

  /** The ship's lives at the start of a game (two more on easy). */
  fullLives() {
    return this.ship.lives + rules().extraLives;
  }

  setVisible(v) {
    this.sprite.setVisible(v);
    this.flame.setVisible(v);
    this.dot.setVisible(v);
    if (!v) this.muzzle.setVisible(false);
    if (!v) this.noseGlow?.setVisible(false);
    if (!v) this.beanOrbit?.forEach((b) => b.setVisible(false));
    if (!v) this.iceBlock?.setVisible(false);
    if (!v) this.ofuda?.forEach((o) => o.s.setVisible(false));
    if (!v) this.turretArt?.forEach((t) => t.setVisible(false));
    if (!v) this.bubble?.clear();
  }

  /** Fly in from the bottom edge. */
  spawn() {
    this.alive = true;
    this.entering = 0.7;
    this.x = VIEW.width / 2;
    this.y = this.scene.H + 20;
    this.invulnerable = rules().invulnerable;
    this.bombs = 1;
    this.heat = 0;
    this.jam = 0;
    this.frost = 0;
    this.frozen = 0;
    this.momentum = 0;
    this.rage = 0;
    this.surge = 0;
    for (const o of this.ofuda) o.on = false;
    this.bank = 0;
    this.thrust = 0;
    this.prevX = this.x;
    this.prevY = this.y;
    this.drag = null;
    this.setVisible(true);
  }

  // ---------------------------------------------------------------- input
  beginDrag(p) {
    if (this.drag) return;
    this.drag = { id: p.id, lx: p.x, ly: p.y };
    this.tx = this.x;
    this.ty = this.y;
  }

  dragMove(p) {
    // a finger still held down (through a death, a pause, a bomb tap) takes the ship over when it moves
    if (!this.drag && p.isDown && this.alive) this.beginDrag(p);
    if (!this.drag || this.drag.id !== p.id) return;
    const gain = this.ship.touchGain;
    const dx = (p.x - this.drag.lx) * gain;
    const dy = (p.y - this.drag.ly) * gain;
    this.drag.lx = p.x;
    this.drag.ly = p.y;
    if (this.alive && !this.entering) {
      // the finger moves a target; the ship chases it at its own top speed (see update)
      this.tx = Phaser.Math.Clamp(this.tx + dx, 6, VIEW.width - 6);
      this.ty = Phaser.Math.Clamp(this.ty + dy, 14, this.scene.H - 10);
    }
  }

  endDrag(p) {
    if (this.drag && this.drag.id === p.id) this.drag = null;
  }

  clamp() {
    this.x = Phaser.Math.Clamp(this.x, 6, VIEW.width - 6);
    this.y = Phaser.Math.Clamp(this.y, 14, this.scene.H - 10);
  }

  // ---------------------------------------------------------------- update
  update(dt, keys, firing) {
    if (this.respawnTimer > 0) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0 && this.lives > 0) this.spawn();
    }
    let bank = 0;
    // frost thaws by itself; a frozen ship breaks out of its ice after a moment
    if (this.frozen > 0) {
      this.frozen -= dt;
      if (this.frozen <= 0) {
        this.frost = FROST.after;
        this.scene.fx.shards(this.x, this.y, 10, true);
        this.scene.sfx.explode('s');
      }
    } else this.frost = Math.max(0, this.frost - FROST.thaw * dt);
    const slowK = this.frozen > 0 ? 0 : 1 - this.frost * FROST.slow;
    if (this.alive) {
      if (this.entering > 0) {
        this.entering = Math.max(0, this.entering - dt);
        const target = this.scene.H - 44;
        this.y += (target - this.y) * Math.min(1, dt * 6);
        this.tx = this.x;
        this.ty = this.y;
      } else if (keys) {
        let ax = 0;
        let ay = 0;
        if (keys.LEFT.isDown || keys.A.isDown) ax -= 1;
        if (keys.RIGHT.isDown || keys.D.isDown) ax += 1;
        if (keys.UP.isDown || keys.W.isDown) ay -= 1;
        if (keys.DOWN.isDown || keys.S.isDown) ay += 1;
        const len = Math.hypot(ax, ay) || 1;
        this.x += (ax / len) * this.ship.speed * slowK * dt;
        this.y += (ay / len) * this.ship.speed * slowK * dt;
        bank = ax;
        this.clamp();
      }
      if (this.drag && this.entering <= 0) {
        const dx = this.tx - this.x;
        const dy = this.ty - this.y;
        const d = Math.hypot(dx, dy);
        const step = this.ship.dragSpeed * slowK * dt;
        if (d <= step) {
          this.x = this.tx;
          this.y = this.ty;
        } else {
          this.x += (dx / d) * step;
          this.y += (dy / d) * step;
        }
        // bank from recent horizontal finger motion
        const vx = this.x - (this.prevX ?? this.x);
        bank = Math.abs(vx) > 0.3 ? Math.sign(vx) : 0;
      }
      // a wind dragging the ship along (Yuki-onna's whirling blizzard): the finger's target drifts with it, so
      // the ship has to be flown out against it
      if (this.pull && this.entering <= 0) {
        const { x, y, k } = this.pull;
        const ddx = x - this.x;
        const ddy = y - this.y;
        const d = Math.hypot(ddx, ddy);
        if (d > 6) {
          const mx = (ddx / d) * k * dt;
          const my = (ddy / d) * k * dt;
          this.x += mx;
          this.y += my;
          this.tx = Phaser.Math.Clamp(this.tx + mx, 6, VIEW.width - 6);
          this.ty = Phaser.Math.Clamp(this.ty + my, 14, this.scene.H - 10);
          this.clamp();
        }
      }
      const dx = this.x - (this.prevX ?? this.x);
      this.prevX = this.x;
      this.vx = dt > 0 ? dx / dt : 0;
      const dy = this.y - (this.prevY ?? this.y);
      this.prevY = this.y;
      const vy = dt > 0 ? dy / dt : 0;
      this.vy = vy;
      this.perks(dt);
      const thrustTarget = vy < -8 ? Math.min(1, -vy / this.ship.speed) : vy > 8 ? Math.max(-0.4, (-vy / this.ship.speed) * 0.45) : 0;
      this.thrust += (thrustTarget - this.thrust) * Math.min(1, 14 * dt);
      const bankRate = 13 * (this.ship.speed / 100);
      this.bank += (bank - this.bank) * Math.min(1, bankRate * dt);
      if (this.invulnerable > 0) this.invulnerable -= dt;
      if (this.shieldT > 0) this.shieldT -= dt;
      if (this.beanT > 0) this.beanT -= dt;
      if (firing && this.entering <= 0 && this.jam <= 0) this.fire(dt);
    }
    const f = this.ship.frame;
    this.shipFrame(this.bank < -0.35 ? `${f}_l` : this.bank > 0.35 ? `${f}_r` : f);
    this.sprite.setPosition(this.x, this.y).setRotation(this.bank * 0.065);
    this.flame.setPosition(this.x, this.y + this.ship.flameY).setScale(1 - this.thrust * 0.12, 1 + this.thrust * 0.45);
    this.dot.setPosition(this.x, this.y);
    const beans = this.alive && this.beanT > 0 && (this.beanT > 2 || Math.floor(this.beanT * 8) % 2 === 0);
    this.beanOrbit.forEach((b, i) => {
      const a = this.scene.t * 7 + i * Math.PI;
      b.setVisible(beans).setPosition(Math.round(this.x + Math.cos(a) * 10), Math.round(this.y + Math.sin(a) * 7));
    });
    const blink = this.invulnerable > 0 && Math.floor(this.invulnerable * 16) % 2 === 0;
    // a flash at the nose with each volley, sparks trailing from the engines
    this.muzzleT -= dt;
    this.muzzle.setVisible(this.alive && this.muzzleT > 0).setPosition(this.x, this.y - Math.ceil(this.sprite.displayHeight / 2) - 1);
    if (this.alive && (this.trailT -= dt) <= 0) {
      this.trailT = 0.035 - this.thrust * 0.014;
      const fx = this.scene.fx;
      const side = Math.random() < 0.5 ? -2.5 : 2.5;
      const p = fx.part(fx.parts, 'dot_1', this.x + side, this.y + this.ship.flameY + 3);
      p.vx = (Math.random() - 0.5) * 6;
      p.vy = 46 + this.thrust * 24 + Math.random() * 20;
      p.drag = 0;
      p.life = p.max = 0.2 + Math.random() * 0.1;
      p.a0 = blink ? 0.3 : 0.85;
      p.setTint(Math.random() < 0.5 ? 0xffb050 : 0xfff0a0);
    }
    this.sprite.setAlpha(blink ? 0.35 : 1);
    this.flame.setAlpha(blink ? 0.35 : 1);
    const hotGlow = this.alive && this.jam <= 0 && this.heat >= HEAT.boostAt;
    const laserGlow = this.alive && this.weapon === 'laser' && this.muzzleT > -0.05;
    if (hotGlow || laserGlow) {
      const noseY = this.y - Math.ceil(this.sprite.displayHeight / 2);
      const pulse = 0.9 + Math.sin(this.scene.t * 24) * 0.1;
      const sc = (hotGlow ? 0.5 + (this.heat - HEAT.boostAt) * 0.45 : 0.38 + this.level * 0.07) * pulse;
      const tint = hotGlow && laserGlow ? 0xffd8a8 : hotGlow ? 0xff9848 : 0x68c0ff;
      const a = (hotGlow ? 0.22 + (this.heat - HEAT.boostAt) * 0.25 : 0.28) * (blink ? 0.35 : 1);
      this.noseGlow.setVisible(true).setPosition(this.x, hotGlow && !laserGlow ? this.y - 2 : noseY).setScale(sc).setTint(tint).setAlpha(a);
    } else this.noseGlow.setVisible(false);
    // hot guns glow orange; jammed ones blink grey
    if (this.jam > 0) this.sprite.setTint(Math.floor(this.jam * 10) % 2 ? 0x9a9a9a : 0xffffff);
    else if (this.heat >= HEAT.boostAt) this.sprite.setTint(0xffc8a0);
    else if (this.frozen > 0) this.sprite.setTint(0xa8d8ff);
    else if (this.frost > 0.12) this.sprite.setTint(Phaser.Display.Color.GetColor(255 - this.frost * 90, 255 - this.frost * 40, 255));
    else this.sprite.clearTint();
    this.iceBlock.setVisible(this.alive && this.frozen > 0).setPosition(this.x, this.y + 1);
    if (this.alive && this.frost > 0.3 && Math.random() < dt * 30 * this.frost) {
      const fx = this.scene.fx;
      const p = fx.part(fx.parts, 'flake_1', this.x + (Math.random() - 0.5) * 14, this.y + (Math.random() - 0.5) * 12);
      p.vx = (Math.random() - 0.5) * 10;
      p.vy = 6 + Math.random() * 10;
      p.drag = 0;
      p.life = p.max = 0.4 + Math.random() * 0.3;
      p.a0 = 0.9;
      p.setTint(0xe8f6ff);
    }
    this.drawTurrets(blink);
    this.pull = null;
    this.updateShots(dt);
  }

  /** What each ship does on its own: Oni's fury up the screen, Tsubame's momentum, Tsuru's talismans. */
  perks(dt) {
    const sh = this.ship;
    const H = this.scene.H;
    this.rage = sh.rage ? sh.rage * Phaser.Math.Clamp((H * 0.7 - this.y) / (H * 0.45), 0, 1) : 0;
    if (sh.momentum) {
      const moving = Math.hypot(this.vx, this.vy) > MOMENTUM.moving;
      this.momentum = Phaser.Math.Clamp(this.momentum + (moving ? MOMENTUM.gain : -MOMENTUM.ebb) * dt, 0, 1);
      // at full momentum, the engine streams sparks
      if (this.momentum > 0.95 && Math.random() < dt * 20) this.scene.fx.spark(this.x + (Math.random() - 0.5) * 6, this.y + 8);
    }
    if (sh.ofuda) this.updateOfuda(dt);
    if (this.surge > 0) {
      // spirit surge: rings pulse out from the ship
      this.surge -= dt;
      if ((this.surgeRing = (this.surgeRing ?? 0) - dt) <= 0) {
        this.surgeRing = 0.3;
        this.scene.fx.rings.push({ x: this.x, y: this.y, r: 7, life: 0.3 });
      }
    }
  }

  /** Tsuru: a talisman folded from the grazes starts circling the ship. */
  addOfuda() {
    const o = this.ofuda.find((q) => !q.on);
    if (!o) return;
    o.on = true;
    o.t = OFUDA.life;
    this.scene.sfx.pickup();
    this.scene.fx.text(this.x, this.y - 18, 'OFUDA!', 1, 0xfff4e0);
  }

  /** The talismans circle the ship, each one cancelling a bullet it touches; in the end they fly off at an enemy. */
  updateOfuda(dt) {
    const s = this.scene;
    let i = 0;
    for (const o of this.ofuda) {
      const a = s.t * 4 + (i++ * Math.PI * 2) / this.ofuda.length;
      const x = this.x + Math.cos(a) * OFUDA.orbit;
      const y = this.y + Math.sin(a) * OFUDA.orbit * 0.8;
      o.s.setVisible(o.on && this.alive).setPosition(Math.round(x), Math.round(y)).setRotation(a + Math.PI / 2);
      if (!o.on || !this.alive) continue;
      for (const b of s.bullets.pool.live) {
        if (b.dead) continue;
        const r = OFUDA.reach + (b.radius ?? 2);
        if ((b.x - x) ** 2 + (b.y - y) ** 2 < r * r) {
          s.bullets.pool.kill(b);
          s.fx.spark(x, y);
          s.fx.spark(b.x, b.y);
          o.on = false;
          break;
        }
      }
      if (o.on && (o.t -= dt) <= 0) {
        o.on = false;
        const c = this.shot('orizuru_0', x, y, 0, -120, OFUDA.damage, 4, { homing: true, life: 1.6 });
        c.setScale(0.55 * c.base).setRotation(0);
      }
    }
  }

  // ---------------------------------------------------------------- weapons
  fire(dt) {
    const w = WEAPONS[this.weapon];
    // Tsubame's momentum: faster fire
    const k = 1 + (this.ship.momentum ? MOMENTUM.fire * this.momentum : 0);
    this.fireTimer -= dt * k;
    while (this.fireTimer <= 0) {
      this.fireTimer += w.interval;
      this.volley();
    }
    // Setsubun: a pair of roasted beans thrown at a steady rate, the same with every weapon
    if (this.beanT > 0) {
      this.beanTimer = (this.beanTimer ?? 0) - dt;
      while (this.beanTimer <= 0) {
        this.beanTimer += 1 / BEANS.rate;
        const { damage, speed, spread } = BEANS;
        for (const side of [-1, 1]) this.shot('ps_bean_0', this.x + side * 4, this.y - 6, -side * spread, -speed, damage, 3, { bean: true });
      }
    }
    if (this.turrets > 0) {
      this.turretTimer -= dt;
      while (this.turretTimer <= 0) {
        this.turretTimer += TURRETS.interval;
        for (const t of this.turretSpots()) this.shot('ps_turret', t.x, t.y - 5, 0, -TURRETS.speed, TURRETS.damage, TURRETS.radius);
      }
    }
    if (this.weapon === 'homing') {
      this.orbTimer -= dt * k;
      while (this.orbTimer <= 0) {
        this.orbTimer += WEAPONS.homing.interval;
        this.launchOrbs();
      }
    }
  }

  shot(frame, x, y, vx, vy, damage, radius, extra) {
    const hot = this.heat >= HEAT.boostAt;
    const s = this.shots.spawn(frame, x, y);
    s.vx = vx;
    s.vy = vy;
    const surge = this.surge > 0;
    s.damage = damage * this.ship.damage * (1 + this.rage) * (hot ? HEAT.boost : 1) * (surge ? SURGE.damage : 1);
    if (surge) {
      s.vx *= SURGE.speed;
      s.vy *= SURGE.speed;
    }
    s.radius = radius;
    s.homing = false;
    s.life = 2;
    s.bean = false;
    s.close = 0;
    s.pierce = 0;
    s.hitE = null;
    s.arm = 0;
    if (extra) Object.assign(s, extra);
    if (hot) s.setTint(0xffb070);
    return s;
  }

  volley() {
    const { x, y } = this;
    const lv = this.level - 1;
    this.volleys++;
    this.muzzleT = 0.04;
    this.muzzle.setFrame(this.volleys % 2 ? 'muzzle_0' : 'muzzle_1');
    this.scene.sfx.shot(this.weapon === 'homing' ? 'basic' : this.weapon);
    switch (this.weapon) {
      case 'basic': {
        const n = 1 + this.level;
        const { speed, damage } = WEAPONS.basic;
        const gap = 6 * (this.ship.spread ?? 1);
        for (let i = 0; i < n; i++) this.shot('ps_needle', x + (i - (n - 1) / 2) * gap, y - 6, 0, -speed, damage, 2);
        break;
      }
      case 'spread': {
        const { speed, damage, pellets, arc, close, closeBonus } = WEAPONS.spread;
        const n = pellets[lv];
        const a = Phaser.Math.DegToRad(arc[lv] * (this.ship.spread ?? 1));
        for (let i = 0; i < n; i++) {
          const ang = (i / (n - 1) - 0.5) * a;
          // point blank: harder while the pellet is young (see updateShots)
          this.shot('ps_spread', x, y - 7, Math.sin(ang) * speed, -Math.cos(ang) * speed, damage * closeBonus, 2.5, { close });
        }
        break;
      }
      case 'laser': {
        const { speed, damage, sprite, sideFrom, pierce } = WEAPONS.laser;
        const frame = `ps_laser_${sprite[lv]}`;
        this.shot(frame, x, y - 12, 0, -speed, damage[lv], 1.5 + sprite[lv], { pierce });
        if (this.level >= sideFrom && this.volleys % 3 === 0) {
          const s = WEAPONS.basic.speed;
          this.shot('ps_needle', x - 7, y - 2, -20, -s, 0.6, 2);
          this.shot('ps_needle', x + 7, y - 2, 20, -s, 0.6, 2);
        }
        break;
      }
      case 'homing': {
        const { speed, damage } = WEAPONS.basic;
        this.shot('ps_needle', x - 3, y - 6, 0, -speed, damage, 2);
        this.shot('ps_needle', x + 3, y - 6, 0, -speed, damage, 2);
        break;
      }
    }
  }

  /** Beppu: steam clouds heat the guns; full heat jams them until they cool down. */
  heatUpdate(dt, inSteam) {
    this.heatOn = true;
    const fx = this.scene.fx;
    if (this.jam > 0) {
      this.jam -= dt;
      this.heat = Math.max(0, this.jam / rules().heatJam);
      if (Math.random() < dt * 14) fx.puff('wisp_s_1', this.x + (Math.random() - 0.5) * 10, this.y - 4, 0.35);
      return;
    }
    if (!this.alive) return;
    const was = this.heat;
    this.heat = Phaser.Math.Clamp(this.heat + (inSteam ? HEAT.rise : -HEAT.cool) * dt, 0, 1);
    if (was < HEAT.boostAt && this.heat >= HEAT.boostAt) fx.text(this.x, this.y - 18, 'GORĄCE DZIAŁA', 1, 0xffb070);
    if (this.heat >= 1) {
      this.jam = rules().heatJam;
      fx.text(this.x, this.y - 18, 'PRZEGRZANIE!', 1.4, 0xff6a50);
      this.scene.sfx.explode('s');
    }
  }

  /** Sapporo: standing in Yuki-onna's freezing mist frosts the ship over; frosted through, it freezes solid. */
  frostUpdate(dt, inMist) {
    if (!this.alive || this.frozen > 0 || !inMist) return;
    const was = this.frost;
    this.frost = Math.min(1, this.frost + (FROST.rise + FROST.thaw) * dt);
    const fx = this.scene.fx;
    if (was < 0.5 && this.frost >= 0.5) fx.text(this.x, this.y - 18, 'SZRON!', 1, 0xc8ecff);
    if (this.frost >= 1) {
      this.frozen = FROST.frozen;
      fx.text(this.x, this.y - 18, 'ZAMARZNIĘTY!', 1.4, 0x9ad8ff);
      fx.shards(this.x, this.y, 6, true);
      this.scene.sfx.bossHit?.(true);
    }
  }

  /** A bullet brushed past the hit dot: points, and while the bomb is spent, a step towards a new one. */
  graze(b) {
    const s = this.scene;
    s.score.add(GRAZE.points * s.score.mult);
    s.fx.spark(b.x, b.y);
    s.sfx.graze();
    if (this.ship.momentum) this.momentum = Math.min(1, this.momentum + MOMENTUM.graze);
    if (this.ship.ofuda && ++this.ofudaCharge >= OFUDA.every) {
      this.ofudaCharge = 0;
      this.addOfuda();
    }
    if (this.bombs > 0) {
      // the bomb is ready: the grazes build up a spirit surge instead
      if (this.surge <= 0 && ++this.surgeCharge >= SURGE.need) {
        this.surgeCharge = 0;
        this.surge = SURGE.time;
        s.fx.text(this.x, this.y - 18, 'SKUPIENIE DUCHA!', 1.2, 0x9ad8ff);
        s.sfx.powerUp();
      }
      return;
    }
    if (++this.grazeCharge >= this.grazePerBomb()) {
      this.grazeCharge = 0;
      this.bombs = 1;
      s.fx.text(this.x, this.y - 18, 'BOMBA GOTOWA', 1.2, 0xffe080);
      s.sfx.powerUp();
    }
  }

  /** Grazes to earn the spent bomb back: the ship's own count (fewer on easy). */
  grazePerBomb() {
    return Math.round((this.ship.perBomb ?? GRAZE.perBomb) * rules().grazeBomb);
  }

  /** A macaque grabs something: a power level, else the bomb. Nothing to take: null (it bites instead). */
  steal() {
    if (this.level > 1) {
      this.level--;
      return 'power';
    }
    if (this.bombs > 0) {
      this.bombs = 0;
      return 'bomb';
    }
    return null;
  }

  launchOrbs() {
    const { speed, damage, orbs, arm } = WEAPONS.homing;
    // (the orbs' reach grows with a taller screen, by the way from the ship (H - 44) up to where the bosses
    // hover (~70): the same reach to them at 9:16 and 9:21)
    const life = WEAPONS.homing.life * Math.max(1, (this.scene.H - 114) / (VIEW.minHeight - 114));
    const n = orbs[this.level - 1];
    this.scene.sfx.shot('homing');
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      const ang = -Math.PI / 2 + side * (0.5 + Math.floor(i / 2) * 0.35);
      const s = this.shot('ps_homing_0', this.x + side * 6, this.y, Math.cos(ang) * speed, Math.sin(ang) * speed, damage, 3, {
        homing: true,
        life,
        arm,
      });
      s.play('homing');
    }
  }

  updateShots(dt) {
    const enemies = this.scene.enemies;
    const turn = WEAPONS.homing.turn;
    for (const s of this.shots.live) {
      s.life -= dt;
      if (s.close > 0 && (s.close -= dt) <= 0) s.damage /= WEAPONS.spread.closeBonus; // out of point-blank range
      if (s.homing && (s.arm -= dt) <= 0) {
        // armed: seek the nearest target in range (before that the orb flies out along its launch arc)
        const t = enemies.nearest(s.x, s.y);
        {
          // no target: curve back to flying straight up
          const want = t ? Math.atan2(t.y - s.y, t.x - s.x) : -Math.PI / 2;
          const cur = Math.atan2(s.vy, s.vx);
          const d = Phaser.Math.Angle.Wrap(want - cur);
          const ang = cur + Phaser.Math.Clamp(d, -turn * dt, turn * dt);
          const v = WEAPONS.homing.speed;
          s.vx = Math.cos(ang) * v;
          s.vy = Math.sin(ang) * v;
        }
      }
      if (s.bean) s.setFrame(Math.floor(s.life * 14) % 2 ? 'ps_bean_1' : 'ps_bean_0'); // spinning
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.y < -16 || s.y > this.scene.H + 16 || s.x < -16 || s.x > VIEW.width + 16) this.shots.kill(s);
    }
    this.shots.sweep();
  }

  // ---------------------------------------------------------------- power, bomb, death
  collect(color) {
    const fx = this.scene.fx;
    this.scene.sfx.pickup();
    if (color === 'mame') {
      this.beanT = BEANS.time;
      fx.text(this.x, this.y - 18, 'FASOLKI!', 1.2, 0xffe080);
      return;
    }
    if (color === 'purple') {
      if (this.turrets < TURRETS.max) {
        this.turrets++;
        this.turretTimer = 0;
        this.scene.sfx.powerUp();
        fx.text(this.x, this.y - 18, this.turrets === TURRETS.max ? 'ZŁOTA TARCZA' : 'WIEŻYCZKA', 1, this.turrets === TURRETS.max ? 0xffe080 : 0x8ac8ff);
      } else {
        this.scene.score.add(this.scene.score.maxPowerBonus());
        fx.text(this.x, this.y - 18, 'BONUS', 1, 0xffe080);
      }
      return;
    }
    const type = WEAPONS.colorToType[color];
    if (this.weapon === type) {
      if (this.level < PLAYER.maxPower) {
        this.level++;
        this.scene.sfx.powerUp();
        fx.text(this.x, this.y - 18, this.level === PLAYER.maxPower ? 'MOC MAX' : 'MOC +1', 1, WEAPON_TINT[type]);
      } else {
        this.scene.score.add(this.scene.score.maxPowerBonus());
        fx.text(this.x, this.y - 18, 'BONUS', 1, 0xffe080);
      }
    } else {
      this.weapon = type;
      fx.text(this.x, this.y - 18, WEAPON_NAMES[type], 1, WEAPON_TINT[type]);
    }
    this.fireTimer = 0;
  }

  bomb() {
    if (!this.alive || this.bombs <= 0 || this.entering > 0 || this.scene.ceasefire) return false;
    this.bombs = 0;
    // each ship's own bomb: Oni's shockwave hits hardest, Tsuru's turns the cancelled bullets into paper cranes,
    // Tsubame's wind cut is light and short, but back twice as soon
    const bm = this.ship.bomb ?? { kind: 'shock', damage: BOMB.damage, invulnerable: BOMB.invulnerable, clear: BOMB.clearTime };
    this.invulnerable = Math.max(this.invulnerable, bm.invulnerable);
    const s = this.scene;
    s.sfx.bomb();
    s.stampChance = false; // no stamp for this city now
    s.run.bombs++;
    s.bombClear = bm.clear;
    const cranes = bm.kind === 'cranes' ? s.bullets.pool.live.filter((b) => !b.dead).slice(0, 24).map((b) => [b.x, b.y]) : [];
    s.bullets.cancelAll(s.fx);
    s.fx.flash(bm.kind === 'cut' ? 0.45 : 0.75, bm.kind === 'cut' ? 0.3 : 0.45);
    s.fx.shockwave(this.x, this.y);
    if (bm.kind === 'shock') s.fx.shockwave(this.x, this.y - 30);
    s.fx.petalBurst(this.x, this.y, bm.kind === 'cut' ? 20 : 48);
    s.enemies.damageAll(bm.damage);
    for (const [cx, cy] of cranes) {
      const o = this.shot('orizuru_0', cx, cy, (Math.random() - 0.5) * 60, -90, 2, 4, { homing: true, life: 1.8, arm: 0.12 });
      o.setScale(0.55 * o.base);
      s.score.add(20 * s.score.mult);
    }
    s.fx.text(this.x, this.y - 24, bm.kind === 'shock' ? 'WSTRZĄS!' : bm.kind === 'cranes' ? 'SENBAZURU!' : 'CIĘCIE WIATRU!', 1.2, this.ship.color);
    return true;
  }

  hit() {
    if (!this.alive || this.invulnerable > 0 || this.entering > 0 || this.god) return;
    const s = this.scene;
    // the turrets' bubble takes the hit first: one turret goes, and for a moment the bubble swallows the rest
    if (this.shieldT > 0) return;
    if (this.turrets > 0) {
      this.loseTurret();
      return;
    }
    // easy: with the bomb ready, it goes off by itself instead
    if (rules().autoBomb && this.bomb()) {
      s.fx.text(this.x, this.y - 18, 'AUTOBOMBA!', 1.2, 0xffe080);
      return;
    }
    s.sfx.hit();
    s.stampChance = false; // no stamp for this city now
    s.run.deaths++;
    this.alive = false;
    this.lives--;
    this.drag = null;
    this.setVisible(false);
    s.fx.explode(this.x, this.y, 'm');
    s.fx.explode(this.x - 4, this.y + 3, 's');
    // the ship breaks up: pieces in its own paint, and white
    s.fx.debris(this.x, this.y, 12, this.ship.color, 1.6);
    s.fx.debris(this.x, this.y, 6, 0xffffff, 1.3);
    s.fx.flash(0.35, 0.3);
    s.score.death();
    this.beanT = 0;
    this.momentum = 0;
    this.surge = 0;
    this.surgeCharge = 0;
    for (const o of this.ofuda) o.on = false;
    // lose power; the lost level drops as a pickup that can be caught again
    const lost = Math.min(rules().deathPowerLoss, this.level - 1);
    if (lost > 0) {
      this.level -= lost;
      const color = WEAPONS.typeToColor[this.weapon];
      if (color) {
        // flung up the screen (pickups fall back at 90 px/s²), but never off its top: it tops out 30 px down
        const y = Math.min(this.y, s.H - 60);
        s.spawnPickup(color, this.x, y, -Math.min(-PLAYER.lostPowerVy, Math.sqrt(180 * Math.max(0, y - 30))));
      }
    }
    this.respawnTimer = PLAYER.respawnDelay;
    if (this.lives <= 0) s.gameOver();
  }

  /** Where the turrets sit: at the very tips of the wings (the first on the left), a little behind the nose. */
  turretSpots() {
    const half = Math.round(this.wingSpan() / 2);
    const y = this.y + 2;
    if (this.turrets >= 2) return [{ x: this.x - half, y }, { x: this.x + half, y }];
    return this.turrets === 1 ? [{ x: this.x + (this.lastSide ?? -1) * half, y }] : [];
  }

  /** The ship's width, wing tip to wing tip (from its level frame, so banking does not move the turrets). */
  wingSpan() {
    return this.ship.wing ?? Math.max(16, (this.scene.textures.getFrame(spriteTexture(this.ship.frame), this.ship.frame)?.width ?? 48) * baseScale(spriteTexture(this.ship.frame)));
  }

  /** A hit on the bubble: the turret goes up in sparks, bullets close by are wiped, and a short grace follows. */
  loseTurret() {
    const s = this.scene;
    const lost = this.turretSpots()[this.turrets - 1] ?? { x: this.x, y: this.y };
    this.turrets--;
    if (this.turrets === 1) this.lastSide = lost.x < this.x ? 1 : -1; // the one left keeps its wing
    this.shieldT = TURRETS.grace;
    s.sfx.explode('s');
    s.fx.explode(lost.x, lost.y, 's');
    s.fx.debris(lost.x, lost.y, 6, 0xc890ff, 1.1);
    s.fx.rings.push({ x: this.x, y: this.y, r: 9, life: 0.35 });
    for (const b of s.bullets.pool.live) {
      if (!b.dead && (b.x - this.x) ** 2 + (b.y - this.y) ** 2 < TURRETS.clear ** 2) {
        s.bullets.pool.kill(b);
        s.fx.spark(b.x, b.y);
      }
    }
    s.fx.text(this.x, this.y - 18, 'TARCZA!', 1, this.turrets ? 0x8ac8ff : 0xc890ff);
  }

  /** The turrets on the wings, and the bubble: blue and see-through with one, gold and shining with two. */
  drawTurrets(blink) {
    const on = this.alive && this.turrets > 0;
    const spots = on ? this.turretSpots() : [];
    this.turretArt.forEach((t, i) => {
      const p = spots[i];
      t.setVisible(!!p);
      if (p) t.setPosition(Math.round(p.x), Math.round(p.y)).setAlpha(blink ? 0.35 : 1);
    });
    const g = this.bubble;
    g.clear();
    if (!on && !(this.alive && this.shieldT > 0)) return;
    const gold = this.turrets >= 2;
    const t = this.scene.t;
    const r = this.wingSpan() / 2 + 5 + Math.sin(t * 5) * 0.6;
    const flash = this.shieldT > 0 ? this.shieldT / TURRETS.grace : 0;
    const col = gold ? 0xffd860 : 0x6ab8ff;
    g.fillStyle(col, (gold ? 0.16 : 0.12) + flash * 0.25);
    g.fillEllipse(this.x, this.y + 1, r * 2, r * 1.8);
    g.lineStyle(1, gold ? 0xfff0b0 : 0xa8dcff, (gold ? 0.75 : 0.55) + flash * 0.25);
    g.strokeEllipse(this.x, this.y + 1, r * 2, r * 1.8);
    // a highlight sliding round the bubble (a bright glint on the gold one)
    const a = t * (gold ? 2.6 : 1.4);
    g.fillStyle(0xffffff, gold ? 0.8 : 0.45);
    g.fillCircle(this.x + Math.cos(a) * r * 0.72, this.y + 1 + Math.sin(a) * r * 0.64, gold ? 1.3 : 1);
  }

  weaponName() {
    return WEAPON_NAMES[this.weapon];
  }

  /** The ship's frame, from sprites540 when it is drawn there (shown at a third), else the old atlas. */
  shipFrame(frame) {
    const key = spriteTexture(frame);
    if (this.sprite.frame?.name === frame && this.sprite.texture.key === key) return;
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key, frame);
    else this.sprite.setFrame(frame);
    this.sprite.setScale(baseScale(key));
  }
}
