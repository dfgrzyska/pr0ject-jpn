import Phaser from 'phaser';
import { BOMB, DEPTH, PLAYER, VIEW, WEAPONS } from '../config.js';
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

    this.lives = PLAYER.lives;
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
    this.drag = null;
    this.god = false;
    this.x = VIEW.width / 2;
    this.y = scene.H + 30;
    this.setVisible(false);
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
    this.drag = null;
    this.setVisible(true);
  }

  // ---------------------------------------------------------------- input
  beginDrag(p) {
    if (this.drag) return;
    this.drag = { id: p.id, lx: p.x, ly: p.y };
  }

  dragMove(p) {
    if (!this.drag || this.drag.id !== p.id) return;
    const dx = (p.x - this.drag.lx) * PLAYER.touchGain;
    const dy = (p.y - this.drag.ly) * PLAYER.touchGain;
    this.drag.lx = p.x;
    this.drag.ly = p.y;
    if (this.alive && !this.entering) {
      this.x += dx;
      this.y += dy;
      this.clamp();
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
      } else if (keys) {
        let ax = 0;
        let ay = 0;
        if (keys.LEFT.isDown || keys.A.isDown) ax -= 1;
        if (keys.RIGHT.isDown || keys.D.isDown) ax += 1;
        if (keys.UP.isDown || keys.W.isDown) ay -= 1;
        if (keys.DOWN.isDown || keys.S.isDown) ay += 1;
        const len = Math.hypot(ax, ay) || 1;
        this.x += (ax / len) * PLAYER.speed * dt;
        this.y += (ay / len) * PLAYER.speed * dt;
        bank = ax;
        this.clamp();
      }
      if (this.drag) {
        // bank from recent horizontal finger motion
        const vx = this.x - (this.prevX ?? this.x);
        bank = Math.abs(vx) > 0.3 ? Math.sign(vx) : 0;
      }
      this.prevX = this.x;
      if (this.invulnerable > 0) this.invulnerable -= dt;
      if (firing && this.entering <= 0) this.fire(dt);
    }
    this.sprite.setFrame(bank < 0 ? 'ship_l' : bank > 0 ? 'ship_r' : 'ship');
    this.sprite.setPosition(this.x, this.y);
    this.flame.setPosition(this.x, this.y + 8.5);
    this.dot.setPosition(this.x, this.y);
    const blink = this.invulnerable > 0 && Math.floor(this.invulnerable * 16) % 2 === 0;
    this.sprite.setAlpha(blink ? 0.35 : 1);
    this.flame.setAlpha(blink ? 0.35 : 1);
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
    return this.shots.spawn(frame, x, y, { vx, vy, damage, radius, homing: false, life: 2, ...extra });
  }

  volley() {
    const { x, y } = this;
    const lv = this.level - 1;
    this.volleys++;
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
  }

  launchOrbs() {
    const { speed, damage, orbs, life } = WEAPONS.homing;
    const n = orbs[this.level - 1];
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
    const type = WEAPONS.colorToType[color];
    const fx = this.scene.fx;
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
