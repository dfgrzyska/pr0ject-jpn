import Phaser from 'phaser';
import { BEANS, BOMB, DEPTH, HEAT, PLAYER, SHIPS, VIEW, WEAPONS } from '../config.js';
import { Pool } from './Pool.js';

const WEAPON_NAMES = { basic: 'PODSTAWOWA', spread: 'ROZRZUT', laser: 'LASER', homing: 'NAPROWADZANE' };
const WEAPON_TINT = { spread: 0xff8a6a, laser: 0x8ac8ff, homing: 0x9cf09a };

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.sprite = scene.add.sprite(0, 0, 'sprites', 'ship').setDepth(DEPTH.player);
    this.flame = scene.add.sprite(0, 0, 'sprites', 'flame_0').setOrigin(0.5, 0).setDepth(DEPTH.player - 0.1).play('flame');
    this.dot = scene.add.image(0, 0, 'sprites', 'hitbox').setDepth(DEPTH.player + 0.1);
    this.shots = new Pool(scene, DEPTH.playerShot);

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
    this.drag = null;
    this.god = false;
    this.x = VIEW.width / 2;
    this.y = scene.H + 30;
    this.setVisible(false);
  }

  setShip(ship) {
    this.ship = ship;
    this.lives = ship.lives;
    this.sprite.setFrame(ship.frame);
  }

  setVisible(v) {
    this.sprite.setVisible(v);
    this.flame.setVisible(v);
    this.dot.setVisible(v);
  }

  /** Fly in from the bottom edge. */
  spawn() {
    this.alive = true;
    this.entering = 0.7;
    this.x = VIEW.width / 2;
    this.y = this.scene.H + 20;
    this.invulnerable = PLAYER.invulnerable;
    this.bombs = 1;
    this.heat = 0;
    this.jam = 0;
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
        this.x += (ax / len) * this.ship.speed * dt;
        this.y += (ay / len) * this.ship.speed * dt;
        bank = ax;
        this.clamp();
      }
      if (this.drag && this.entering <= 0) {
        const dx = this.tx - this.x;
        const dy = this.ty - this.y;
        const d = Math.hypot(dx, dy);
        const step = this.ship.dragSpeed * dt;
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
      this.prevX = this.x;
      if (this.invulnerable > 0) this.invulnerable -= dt;
      if (this.beanT > 0) this.beanT -= dt;
      if (firing && this.entering <= 0 && this.jam <= 0) this.fire(dt);
    }
    const f = this.ship.frame;
    this.sprite.setFrame(bank < 0 ? `${f}_l` : bank > 0 ? `${f}_r` : f);
    this.sprite.setPosition(this.x, this.y);
    this.flame.setPosition(this.x, this.y + this.ship.flameY);
    this.dot.setPosition(this.x, this.y);
    const blink = this.invulnerable > 0 && Math.floor(this.invulnerable * 16) % 2 === 0;
    this.sprite.setAlpha(blink ? 0.35 : 1);
    this.flame.setAlpha(blink ? 0.35 : 1);
    // hot guns glow orange; jammed ones blink grey
    if (this.jam > 0) this.sprite.setTint(Math.floor(this.jam * 10) % 2 ? 0x9a9a9a : 0xffffff);
    else if (this.heat >= HEAT.boostAt) this.sprite.setTint(0xffc8a0);
    else this.sprite.clearTint();
    this.updateShots(dt);
  }

  // ---------------------------------------------------------------- weapons
  fire(dt) {
    const w = WEAPONS[this.weapon];
    this.fireTimer -= dt;
    while (this.fireTimer <= 0) {
      this.fireTimer += w.interval;
      this.volley();
    }
    if (this.weapon === 'homing') {
      this.orbTimer -= dt;
      while (this.orbTimer <= 0) {
        this.orbTimer += WEAPONS.homing.interval;
        this.launchOrbs();
      }
    }
  }

  shot(frame, x, y, vx, vy, damage, radius, extra) {
    const hot = this.heat >= HEAT.boostAt;
    const s = this.shots.spawn(frame, x, y, { vx, vy, damage: damage * this.ship.damage * (hot ? HEAT.boost : 1), radius, homing: false, life: 2, bean: false, ...extra });
    if (hot) s.setTint(0xffb070);
    return s;
  }

  volley() {
    const { x, y } = this;
    const lv = this.level - 1;
    this.volleys++;
    this.scene.sfx.shot(this.weapon === 'homing' ? 'basic' : this.weapon);
    switch (this.weapon) {
      case 'basic': {
        const n = 1 + this.level;
        const { speed, damage } = WEAPONS.basic;
        for (let i = 0; i < n; i++) this.shot('ps_needle', x + (i - (n - 1) / 2) * 6, y - 6, 0, -speed, damage, 2);
        break;
      }
      case 'spread': {
        const { speed, damage, pellets, arc } = WEAPONS.spread;
        const n = pellets[lv];
        const a = Phaser.Math.DegToRad(arc[lv]);
        for (let i = 0; i < n; i++) {
          const ang = (i / (n - 1) - 0.5) * a;
          this.shot('ps_spread', x, y - 7, Math.sin(ang) * speed, -Math.cos(ang) * speed, damage, 2.5);
        }
        break;
      }
      case 'laser': {
        const { speed, damage, sprite, sideFrom } = WEAPONS.laser;
        const frame = `ps_laser_${sprite[lv]}`;
        this.shot(frame, x, y - 12, 0, -speed, damage[lv], 1.5 + sprite[lv]);
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
    // Setsubun: a pair of roasted beans thrown with every other volley
    if (this.beanT > 0 && this.volleys % 2 === 0) {
      const { damage, speed } = BEANS;
      for (const side of [-1, 1]) this.shot('ps_bean', x + side * 4, y - 6, side * 30, -speed, damage, 2, { bean: true });
    }
  }

  /** Beppu: steam clouds heat the guns; full heat jams them until they cool down. */
  heatUpdate(dt, inSteam) {
    this.heatOn = true;
    const fx = this.scene.fx;
    if (this.jam > 0) {
      this.jam -= dt;
      this.heat = Math.max(0, this.jam / HEAT.jam);
      if (Math.random() < dt * 14) fx.puff('wisp_s_1', this.x + (Math.random() - 0.5) * 10, this.y - 4, 0.35);
      return;
    }
    if (!this.alive) return;
    const was = this.heat;
    this.heat = Phaser.Math.Clamp(this.heat + (inSteam ? HEAT.rise : -HEAT.cool) * dt, 0, 1);
    if (was < HEAT.boostAt && this.heat >= HEAT.boostAt) fx.text(this.x, this.y - 18, 'GORĄCE DZIAŁA', 1, 0xffb070);
    if (this.heat >= 1) {
      this.jam = HEAT.jam;
      fx.text(this.x, this.y - 18, 'PRZEGRZANIE!', 1.4, 0xff6a50);
      this.scene.sfx.explode('s');
    }
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
    const { speed, damage, orbs, life } = WEAPONS.homing;
    const n = orbs[this.level - 1];
    this.scene.sfx.shot('homing');
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      const ang = -Math.PI / 2 + side * (0.5 + Math.floor(i / 2) * 0.35);
      const s = this.shot('ps_homing_0', this.x + side * 6, this.y, Math.cos(ang) * speed, Math.sin(ang) * speed, damage, 3, {
        homing: true,
        life,
      });
      s.play('homing');
    }
  }

  updateShots(dt) {
    const enemies = this.scene.enemies;
    const turn = WEAPONS.homing.turn;
    for (const s of this.shots.live) {
      s.life -= dt;
      if (s.homing) {
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
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.y < -16 || s.y > this.scene.H + 16 || s.x < -16 || s.x > VIEW.width + 16) this.shots.kill(s);
    }
    this.shots.sweep();
  }

  // ---------------------------------------------------------------- power, bomb, death
  collect(color) {
    const fx = this.scene.fx;
    if (color === 'mame') {
      this.beanT = BEANS.time;
      fx.text(this.x, this.y - 18, 'FASOLKI!', 1.2, 0xffe080);
      return;
    }
    const type = WEAPONS.colorToType[color];
    if (this.weapon === type) {
      if (this.level < PLAYER.maxPower) {
        this.level++;
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
    if (!this.alive || this.bombs <= 0 || this.entering > 0) return false;
    this.bombs = 0;
    this.invulnerable = Math.max(this.invulnerable, BOMB.invulnerable);
    const s = this.scene;
    s.bombClear = BOMB.clearTime;
    s.bullets.cancelAll(s.fx);
    s.fx.flash(0.75, 0.45);
    s.fx.shockwave(this.x, this.y);
    s.fx.petalBurst(this.x, this.y, 48);
    s.enemies.damageAll(BOMB.damage);
    return true;
  }

  hit() {
    if (!this.alive || this.invulnerable > 0 || this.entering > 0 || this.god) return;
    const s = this.scene;
    this.alive = false;
    this.lives--;
    this.drag = null;
    this.setVisible(false);
    s.fx.explode(this.x, this.y, 'm');
    s.fx.explode(this.x - 4, this.y + 3, 's');
    s.fx.flash(0.35, 0.3);
    s.score.death();
    this.beanT = 0;
    // lose power; the lost level drops as a pickup that can be caught again
    const lost = Math.min(PLAYER.deathPowerLoss, this.level - 1);
    if (lost > 0) {
      this.level -= lost;
      const color = WEAPONS.typeToColor[this.weapon];
      if (color) s.spawnPickup(color, this.x, Math.min(this.y, s.H - 60), -70);
    }
    this.respawnTimer = PLAYER.respawnDelay;
    if (this.lives <= 0) s.gameOver();
  }

  weaponName() {
    return WEAPON_NAMES[this.weapon];
  }
}
