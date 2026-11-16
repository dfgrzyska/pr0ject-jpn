import Phaser from 'phaser';
import { BEANS, BOMB, DEPTH, FROST, GRAZE, HEAT, MOMENTUM, OFUDA, PLAYER, SURGE, TURRETS, VIEW, WEAPONS } from '../config.js';
import { rules } from '../difficulty.js';
import { Pool } from './Pool.js';
import { baseScale, sharedArt, spriteTexture } from './enemyArt.js';
import { flameLook } from './shipSkin.js';
import { fxTint } from './premiumFx.js';
import { drawBubble } from './bubble.js';

const WEAPON_NAMES = { basic: 'PODSTAWOWA', spread: 'ROZRZUT', laser: 'LASER', homing: 'NAPROWADZANE' };
const WEAPON_TINT = { spread: 0xff8a6a, laser: 0x8ac8ff, homing: 0x9cf09a };

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.sprite = scene.add.sprite(0, 0, 'sprites', 'ship').setDepth(DEPTH.player);
    this.flame = sharedArt(scene.add.sprite(0, 0, 'sprites', 'flame_0')).setOrigin(0.5, 0).setDepth(DEPTH.player - 0.1).play('flame');
    this.dot = sharedArt(scene.add.image(0, 0, 'sprites', 'hitbox')).setDepth(DEPTH.player + 0.1);
    this.pal = sharedArt(scene.add.image(0, 0, 'sprites', 'hitbox')).setDepth(DEPTH.player - 0.2).setVisible(false); // a companion out of the gachapon
    this.aura = Array.from({ length: 6 }, () => sharedArt(scene.add.image(0, 0, 'sprites', 'dot_2')).setDepth(DEPTH.player + 0.04).setVisible(false)); // an aura out of the gachapon
    this.segs = []; // a dragon's body (ship.anim.segs): made when such a hull is fitted
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

    this.setShip(scene.ship);
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
    this.dot.setFrame(ship.look?.marker ?? 'hitbox'); // (a marker out of the gachapon)
    this.pal.setFrame(ship.look?.pal ?? 'hitbox');
    this.palAt = null;
    // (a dragon's body: its segments, the tail last, each a little smaller than the one before)
    for (const g of this.segs) g.img.destroy();
    const body = ship.anim?.segs;
    this.segs = Array.from({ length: body?.n ?? 0 }, (_, i) => ({ x: 0, y: 0, img: sharedArt(this.scene.add.image(0, 0, 'sprites', i === body.n - 1 ? `${ship.frame}_tail` : `${ship.frame}_seg`)).setScale(1 - i * 0.045).setDepth(DEPTH.player - 0.15 - i * 0.001).setVisible(false) }));
    this.segsAt = null;
    this.lives = this.fullLives();
    this.shipFrame(ship.frame);
  }

  /** Bombs the ship can hold (two with the twin bomb). */
  bombMax() {
    return this.ship.bombMax ?? 1;
  }

  /** The ship's lives at the start of a game (two more on easy). */
  fullLives() {
    return this.ship.lives + rules().extraLives;
  }

  setVisible(v) {
    this.sprite.setVisible(v);
    this.flame.setVisible(v);
    this.dot.setVisible(v);
    if (!v) this.pal?.setVisible(false);
    if (!v) this.aura?.forEach((a) => a.setVisible(false));
    if (!v) this.segs?.forEach((g) => g.img.setVisible(false));
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
    this.invulnerable = rules().invulnerable + (this.ship.respawnInvuln ?? 0);
    this.bombs = this.bombMax();
    this.hanabi = null;
    this.ix = this.iy = 0;
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
    // (an engine that gives way to the guns: slower while they fire)
    const slowK = (this.frozen > 0 ? 0 : 1 - this.frost * FROST.slow) * (firing && this.ship.fireSlow ? this.ship.fireSlow : 1);
    if (this.dodgeCool > 0) this.dodgeCool -= dt;
    if (this.hanabi && this.alive) this.hanabiUpdate(dt);
    if (this.alive) {
      if (this.entering > 0) {
        this.entering = Math.max(0, this.entering - dt);
        const target = this.scene.H - 44;
        this.y += (target - this.y) * Math.min(1, dt * 6);
        this.tx = this.x;
        this.ty = this.y;
        // (an entrance out of the gachapon: its bits streaming off the ship, a burst where it stops)
        const en = this.ship.look?.entry;
        if (en) {
          this.emit({ rate: 70, vy: 70, spread: 40, life: 0.5, ...en }, this.x, this.y + 6, 14, 8, dt);
          if (this.entering <= 0) this.burst(en, this.x, this.y);
        }
      } else if (keys) {
        let ax = 0;
        let ay = 0;
        if (keys.LEFT.isDown || keys.A.isDown) ax -= 1;
        if (keys.RIGHT.isDown || keys.D.isDown) ax += 1;
        if (keys.UP.isDown || keys.W.isDown) ay -= 1;
        if (keys.DOWN.isDown || keys.S.isDown) ay += 1;
        const len = Math.hypot(ax, ay) || 1;
        let mx = ax / len;
        let my = ay / len;
        if (this.ship.inertia) {
          // a drifting engine: the ship takes a moment to get going, and to stop
          const k = Math.min(1, this.ship.inertia * dt);
          mx = this.ix += (mx - this.ix) * k;
          my = this.iy += (my - this.iy) * k;
        }
        this.x += mx * this.ship.speed * slowK * dt;
        this.y += my * this.ship.speed * slowK * dt;
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
    const an = this.ship.anim; // (a hull that moves, see hullFrame)
    const folding = an?.fold && this.alive && this.entering > 0 ? 1 - this.entering / 0.7 : 1;
    if (folding < 0.8) {
      // flying in, the paper crane folds itself out of a sheet, turning as it does
      this.shipFrame(`${f}_o${folding < 0.3 ? 0 : folding < 0.55 ? 1 : 2}`);
      this.sprite.setPosition(this.x, this.y).setRotation((0.8 - folding) ** 2 * 9);
    } else {
      this.shipFrame(an ? this.hullFrame(dt) : this.bank < -0.35 ? `${f}_l` : this.bank > 0.35 ? `${f}_r` : f);
      this.sprite.setPosition(this.x, this.y).setRotation(this.bank * 0.065);
    }
    // a dragon's body: each segment drawn along behind the one before it (the first behind the head), sinking a
    // little so that it hangs below a ship at rest; the engine's flame burns at the tail's end
    if (this.segs.length) {
      const on = this.alive && this.sprite.visible;
      const gap = an.segs.gap;
      if (!this.segsAt || !on) {
        this.segs.forEach((g, i) => Object.assign(g, { x: this.x, y: this.y + (i + 1) * gap }));
        this.segsAt = on;
      }
      let px = this.x;
      let py = this.y + 3;
      let rot = 0;
      for (const g of this.segs) {
        g.y += 26 * dt;
        const dx = px - g.x;
        const dy = py - g.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > gap) {
          g.x += dx * (1 - gap / d);
          g.y += dy * (1 - gap / d);
        }
        rot = Math.atan2(py - g.y, px - g.x) + Math.PI / 2;
        g.img.setVisible(on).setPosition(g.x, g.y).setRotation(rot).setAlpha(this.sprite.alpha);
        px = g.x;
        py = g.y;
      }
      this.flameAt = { x: px - Math.sin(rot) * 7, y: py + Math.cos(rot) * 7, rot };
    }
    if (an?.shed && this.alive && this.sprite.visible) this.emit(an.shed, this.x, this.y, 22, 12, dt); // (embers off its wings)
    // (rising again: a burst of what it is made of, where it stops)
    if (an?.rise && this.alive && this.wasEntering && this.entering <= 0) this.burst(an.rise, this.x, this.y);
    this.wasEntering = this.entering > 0;
    this.flame.setPosition(this.x, this.y + this.ship.flameY).setScale(1 - this.thrust * 0.12, (1 + this.thrust * 0.45) * flameLook(this.flame, this.ship));
    if (this.segs.length && this.flameAt) this.flame.setPosition(this.flameAt.x, this.flameAt.y).setRotation(this.flameAt.rot);
    else if (this.flame.rotation) this.flame.setRotation(0);
    this.dot.setPosition(this.x, this.y);
    // the companion: behind the left wing, catching up with the ship, bobbing as it flies
    const palOn = Boolean(this.ship.look?.pal) && this.alive && this.sprite.visible;
    this.pal.setVisible(palOn);
    if (palOn) {
      const tx = this.x - 12;
      const ty = this.y + 10;
      if (!this.palAt || Math.hypot(tx - this.palAt.x, ty - this.palAt.y) > 60) this.palAt = { x: tx, y: ty };
      const k = Math.min(1, dt * 7);
      this.palAt.x += (tx - this.palAt.x) * k;
      this.palAt.y += (ty - this.palAt.y) * k;
      // (each in its own manner: trotting, hopping, rocking, swinging, flickering, fluttering, swimming)
      const t = this.scene.t;
      const mv = this.ship.look.palMove;
      let ox = 0;
      let oy = Math.sin(t * 5) * 1.2;
      let rot = 0;
      let sx = 1;
      let sy = 1;
      let alpha = 1;
      if (mv === 'trot') { oy = -Math.abs(Math.sin(t * 9)) * 1.6; rot = Math.sin(t * 9) * 0.09; }
      else if (mv === 'hop') { const h = Math.abs(Math.sin(t * 4.5)); oy = -h * 4.5; sy = 0.86 + h * 0.2; sx = 1.1 - h * 0.12; }
      else if (mv === 'rock') rot = Math.sin(t * 4) * 0.32;
      else if (mv === 'swing') { rot = Math.sin(t * 3) * 0.45; ox = Math.sin(t * 3) * 1.5; }
      else if (mv === 'flicker') { oy = Math.sin(t * 3) * 2.6; sx = sy = 1 + Math.sin(t * 11) * 0.1; alpha = 0.78 + Math.sin(t * 7) * 0.22; }
      else if (mv === 'flutter') { sx = 0.62 + Math.abs(Math.sin(t * 10)) * 0.38; oy = Math.sin(t * 5) * 2; }
      else if (mv === 'swim') { rot = Math.sin(t * 6) * 0.26; ox = Math.sin(t * 6 + 1) * 1.6; }
      this.pal.setPosition(this.palAt.x + ox, this.palAt.y + oy).setFlipX(tx - this.palAt.x > 1.5).setRotation(rot).setScale(sx, sy).setAlpha(alpha * this.sprite.alpha);
    }
    // an aura out of the gachapon: its sprites circling the ship, behind it on the far half of the turn
    const au = this.ship.look?.aura;
    const auOn = Boolean(au) && this.alive && this.sprite.visible;
    this.aura.forEach((a, i) => {
      a.setVisible(auOn && i < au.n);
      if (!a.visible) return;
      const t = this.scene.t;
      const ang = t * au.speed + (i * Math.PI * 2) / au.n;
      const depth = DEPTH.player + (Math.sin(ang) < 0 ? -0.04 : 0.04);
      if (a.depth !== depth) a.setDepth(depth);
      a.setFrame(au.frames[(i + Math.floor(t * (au.anim ?? 0))) % au.frames.length]);
      a.setPosition(this.x + Math.cos(ang) * au.r, this.y + 1 + Math.sin(ang) * au.r * 0.62).setScale(au.scale ?? 1).setRotation(au.turn ? ang : 0);
      a.setAlpha(au.twinkle ? 0.55 + 0.45 * Math.sin(t * 9 + i * 2.1) : 1);
      if (au.tints) a.setTint(au.tints[i % au.tints.length]);
      else a.clearTint();
    });
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
    // a wake out of the gachapon: scattered to the sides while the ship is moving (the faster, the more)
    const wake = this.ship.look?.wake;
    if (wake && this.alive && this.entering <= 0) {
      const spd = Math.hypot(this.vx || 0, this.vy || 0);
      const rate = 8 + Math.min(36, spd * 0.32 + Math.abs(this.bank) * 20);
      if (spd >= 32 && Math.random() < Math.min(1, dt * rate) * 0.8) {
        const fx = this.scene.fx;
        const side = Math.random() < 0.5 ? -1 : 1;
        const wp = fx.part(fx.parts, wake.frames[Math.floor(Math.random() * wake.frames.length)], this.x + side * (6 + Math.random() * 4), this.y + 2);
        wp.vx = side * (40 + Math.random() * 28) - (this.vx || 0) * 0.15;
        wp.vy = 20 + Math.random() * 22;
        wp.drag = 2;
        wp.g = wake.g ?? 12;
        wp.grow = wake.grow ?? 0;
        wp.spin = (wake.spin ?? 1) * side * (4 + Math.random() * 4);
        wp.life = wp.max = (wake.life ?? 0.5) * (0.8 + Math.random() * 0.4);
        wp.a0 = wake.alpha ?? 0.65;
        wp.setScale((wake.scale ?? 1) * wp.base);
        if (wake.tints) wp.setTint(wake.tints[Math.floor(Math.random() * wake.tints.length)]);
      }
    }
    // an animated paint job and a trail out of the gachapon: the bits the hull sheds, the stream from the engine
    const pf = this.ship.look?.paintFx;
    const shown = this.alive && this.sprite.visible;
    if (pf?.bits && shown) this.emit(pf.bits, this.x, this.y, 14, 16, dt);
    if (this.ship.look?.trail && shown && this.entering <= 0) this.emit(this.ship.look.trail, this.x, this.y + this.ship.flameY + 4, 3, 2, dt);
    this.sprite.setAlpha((blink ? 0.35 : 1) * (pf?.flicker && Math.sin(this.scene.t * 37) > 0.4 ? 1 - pf.flicker : 1));
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
    else if (pf) this.sprite.setTint(fxTint(pf, this.scene.t));
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
    const k = (1 + (this.ship.momentum ? MOMENTUM.fire * this.momentum : 0)) * (this.ship.fireRate ?? 1);
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
        for (const t of this.turretSpots()) this.shot('ps_turret', t.x, t.y - 4, 0, -TURRETS.speed, TURRETS.damage, TURRETS.radius);
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
    const s = this.shots.spawn(this.ship.look?.shots?.[frame] ?? frame, x, y); // (in its skin out of the gachapon)
    s.move = this.ship.look?.shotMove?.[frame] ?? null; // (and stirring as that skin does)
    s.rot0 = null;
    s.vx = vx;
    s.vy = vy;
    const surge = this.surge > 0;
    s.damage = damage * this.ship.damage * (1 + this.rage) * (hot ? HEAT.boost : 1) * (surge ? SURGE.damage : 1) * (this.lives <= 1 ? 1 + (this.ship.lastStand ?? 0) : 1);
    s.flipY = false;
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
    // point blank: a shot hits harder while it is young (the pellets of the spread, and every shot with that gun part)
    s.closeK = s.close > 0 ? WEAPONS.spread.closeBonus : 1;
    if (this.ship.pointBlank) {
      s.close ||= 0.18;
      s.closeK *= this.ship.pointBlank;
      s.damage *= this.ship.pointBlank;
    }
    if (hot) s.setTint(0xffb070);
    else if (this.ship.look?.dye) s.setTint(this.ship.look.dye); // (a dye out of the gachapon)
    return s;
  }

  volley() {
    const { x, y } = this;
    const lv = this.level - 1;
    this.volleys++;
    this.muzzleT = 0.04;
    this.muzzle.setFrame(this.volleys % 2 ? 'muzzle_0' : 'muzzle_1');
    this.volleyAt = this.scene.t; // (a hull that moves may answer a volley, see hullFrame)
    this.scene.sfx.shot(this.weapon === 'homing' ? 'basic' : this.weapon, this.ship.look?.sound);
    // a tail gun: a needle astern with every third volley
    if (this.ship.tail && this.volleys % 3 === 0) this.shot('ps_needle', x, y + 8, 0, WEAPONS.basic.speed, 1, 2).flipY = true;
    switch (this.weapon) {
      case 'basic': {
        const n = 1 + this.level;
        const { speed, damage } = WEAPONS.basic;
        const gap = 6 * (this.ship.spread ?? 1);
        // (piercing needles go on through small fry, hitting a little softer)
        const pierce = this.ship.needlePierce ?? 0;
        for (let i = 0; i < n; i++) this.shot('ps_needle', x + (i - (n - 1) / 2) * gap, y - 6, 0, -speed, damage * (pierce ? 0.85 : 1), 2, pierce ? { pierce } : null);
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
    s.score.add(GRAZE.points * s.score.mult * (this.ship.grazePoints ?? 1));
    this.grazeT = 0.3; // (a hull that moves may answer a graze, see hullFrame)
    const gl = this.ship.look?.graze; // (the spark's look out of the gachapon)
    s.fx.spark(b.x, b.y, gl ? gl.tints[Math.floor(Math.random() * gl.tints.length)] : null);
    if (gl?.bits) s.fx.cityBits(b.x, b.y, 1, 1, false, gl.bits);
    s.sfx.graze();
    if (this.ship.momentum) this.momentum = Math.min(1, this.momentum + MOMENTUM.graze);
    if (this.ship.ofuda && ++this.ofudaCharge >= OFUDA.every) {
      this.ofudaCharge = 0;
      this.addOfuda();
    }
    if (this.bombs >= this.bombMax()) {
      // the bomb is ready: the grazes build up a spirit surge instead
      if (this.surge <= 0 && ++this.surgeCharge >= (this.ship.surgeNeed ?? SURGE.need)) {
        this.surgeCharge = 0;
        this.surge = this.ship.surgeTime ?? SURGE.time;
        s.fx.text(this.x, this.y - 18, 'SKUPIENIE DUCHA!', 1.2, 0x9ad8ff);
        s.sfx.powerUp();
      }
      return;
    }
    if (++this.grazeCharge >= this.grazePerBomb()) {
      this.grazeCharge = 0;
      this.bombs++;
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
    this.scene.sfx.shot('homing', this.ship.look?.sound);
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      const ang = -Math.PI / 2 + side * (0.5 + Math.floor(i / 2) * 0.35);
      const s = this.shot('ps_homing_0', this.x + side * 6, this.y, Math.cos(ang) * speed, Math.sin(ang) * speed, damage, 3, {
        homing: true,
        life,
        arm,
      });
      // (a skin out of the gachapon is one frame: it does not flicker between the orb's two)
      if (this.ship.look?.shots?.ps_homing_0) s.anims.stop();
      else s.play('homing');
    }
  }

  updateShots(dt) {
    const enemies = this.scene.enemies;
    const turn = WEAPONS.homing.turn;
    for (const s of this.shots.live) {
      s.life -= dt;
      if (s.close > 0 && (s.close -= dt) <= 0) s.damage /= s.closeK; // out of point-blank range
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
      // a skin out of the gachapon that stirs as it flies: spinning, turning like a coin, beating its wings,
      // wagging round the way it was fired, breathing
      const m = s.move;
      if (m) {
        const t = this.scene.t;
        if (m.spin) s.rotation += m.spin * dt;
        else if (m.flip) s.scaleX = s.base * Math.cos(t * m.flip + s.x * 0.2);
        else if (m.flap) s.scaleX = s.base * (0.5 + 0.5 * Math.abs(Math.sin(t * m.flap + s.x * 0.3)));
        else if (m.wag) s.rotation = (s.rot0 ??= s.rotation) + Math.sin(t * m.rate + s.y * 0.12) * m.wag;
        else if (m.pulse) s.setScale(s.base * (0.85 + 0.3 * Math.abs(Math.sin(t * m.pulse + s.x * 0.3))));
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
    this.scene.sfx.pickup();
    // (a hull that catches: into its paw, with a glint of gold and a few coins shaken loose; see hullFrame)
    const paw = this.ship.anim?.catch;
    if (paw) {
      this.catchT = 0.5;
      fx.spark(this.x + paw[0], this.y + paw[1], 0xffd040);
      fx.rings.push({ x: this.x + paw[0], y: this.y + paw[1], r: 2, life: 0.3, c: 0xffe080 });
      fx.debris(this.x + paw[0], this.y + paw[1], 4, 0xffd040, 0.7);
    }
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
        this.scene.score.add(this.scene.score.maxPowerBonus() * (this.ship.maxBonus ?? 1));
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
        this.scene.score.add(this.scene.score.maxPowerBonus() * (this.ship.maxBonus ?? 1));
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
    this.bombs--;
    // each ship's own bomb: Oni's shockwave hits hardest, Tsuru's turns the cancelled bullets into paper cranes,
    // Tsubame's wind cut is light and short, but back twice as soon
    const bm = this.ship.bomb ?? { kind: 'shock', damage: BOMB.damage, invulnerable: BOMB.invulnerable, clear: BOMB.clearTime };
    this.invulnerable = Math.max(this.invulnerable, bm.invulnerable);
    const s = this.scene;
    s.sfx.bomb();
    s.stampChance = false; // no stamp for this city now
    s.run.bombs++;
    s.bombClear = bm.clear;
    const caught = s.bullets.pool.live.filter((b) => !b.dead).length;
    if (bm.kind === 'slow') {
      // time slowed: the bullets stay, crawling, for the ship to thread
      s.bombClear = 0;
      s.bulletSlow = bm.slow;
    }
    const cranes = bm.kind === 'cranes' ? s.bullets.pool.live.filter((b) => !b.dead).slice(0, 24).map((b) => [b.x, b.y]) : [];
    if (bm.kind !== 'slow') s.bullets.cancelAll(s.fx);
    if (bm.kind === 'magnet' && caught) {
      // every bullet caught is worth points
      const pts = caught * 100 * s.score.mult;
      s.score.add(pts);
      s.fx.text(this.x, this.y - 36, `+${pts}`, 1.4, 0x9cf09a);
    }
    if (bm.kind === 'hanabi') this.hanabi = { n: bm.bursts, t: 0.3, damage: bm.burst };
    const bl = this.ship.look?.bombLook; // (its look out of the gachapon: the ring, the flash, what it scatters)
    s.fx.flash(bm.kind === 'cut' ? 0.45 : 0.75, bm.kind === 'cut' ? 0.3 : 0.45, bl?.flash);
    s.fx.shockwave(this.x, this.y, bl?.ring);
    if (bm.kind === 'shock') s.fx.shockwave(this.x, this.y - 30, bl?.ring);
    s.fx.petalBurst(this.x, this.y, bm.kind === 'cut' ? 20 : 48, bl);
    if (bl?.scene) s.fx.bombScene(bl.scene, this.x, this.y); // (a scene of its own across the screen)
    s.enemies.damageAll(bm.damage);
    for (const [cx, cy] of cranes) {
      const o = this.shot('orizuru_0', cx, cy, (Math.random() - 0.5) * 60, -90, 2, 4, { homing: true, life: 1.8, arm: 0.12 });
      o.setScale(0.55 * o.base);
      s.score.add(20 * s.score.mult);
    }
    s.fx.text(this.x, this.y - 24, bm.shout ?? (bm.kind === 'shock' ? 'WSTRZĄS!' : bm.kind === 'cranes' ? 'SENBAZURU!' : 'CIĘCIE WIATRU!'), 1.2, this.ship.color);
    return true;
  }

  /** The fireworks of the hanabi bomb: one burst after another over the enemies. */
  hanabiUpdate(dt) {
    const h = this.hanabi;
    if ((h.t -= dt) > 0) return;
    h.t = 0.32;
    const s = this.scene;
    const x = 30 + Math.random() * (VIEW.width - 60);
    const y = 40 + Math.random() * (s.H * 0.4);
    s.enemies.damageAll(h.damage);
    const bl = this.ship.look?.bombLook;
    s.fx.shockwave(x, y, bl?.ring);
    s.fx.petalBurst(x, y, 22, bl);
    s.fx.flash(0.25, 0.2, bl?.flash);
    s.sfx.explode('m');
    if (--h.n <= 0) this.hanabi = null;
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
    // the dash engine: it throws the ship clear by itself, then needs a while
    if (this.ship.dodge && !(this.dodgeCool > 0)) {
      this.dodgeCool = this.ship.dodge;
      this.invulnerable = 0.7;
      s.fx.rings.push({ x: this.x, y: this.y, r: 8, life: 0.3 });
      s.fx.text(this.x, this.y - 18, 'ZRYW!', 1, 0x9ad8ff);
      s.sfx.graze();
      return;
    }
    // a second chance: once a city, the hit is shrugged off
    if (this.ship.secondChance && !this.chanceUsed) {
      this.chanceUsed = true;
      this.invulnerable = 2;
      s.bullets.cancelAll(s.fx);
      s.fx.flash(0.4, 0.3);
      s.fx.text(this.x, this.y - 18, 'DRUGA SZANSA!', 1.4, 0xffe080);
      s.sfx.powerUp();
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
    for (const g of this.segs) s.fx.explode(g.x, g.y, 's', null, true); // (a dragon's body goes with its head)
    if (this.ship.anim?.fold) {
      // (the paper crane comes apart into the sheet it was folded from, drifting down)
      const sheet = s.fx.part(s.fx.parts, `${this.ship.frame}_o0`, this.x, this.y, { vy: 26, drag: 0.3, g: 14, spin: 2.5, life: 1.6, a0: 0.95 });
      sheet.setScale(0.8 * sheet.base);
    }
    if (this.ship.look?.death) this.burst(this.ship.look.death, this.x, this.y); // (a last flourish out of the gachapon)
    s.score.death();
    this.beanT = 0;
    this.momentum = 0;
    this.surge = 0;
    this.surgeCharge = 0;
    for (const o of this.ofuda) o.on = false;
    // lose power; the lost level drops as a pickup that can be caught again
    const lost = this.ship.keepPower ? 0 : Math.min(rules().deathPowerLoss, this.level - 1);
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

  /**
   * The frame of a hull that moves (ship.anim), as <frame>[_fN][_l|_r]. Which N: by time, through `cycle` at
   * `rate` a second, faster as the ship climbs (by: 'time', wings beating); by the guns, opening as they fire and
   * closing as they rest (by: 'fire', frames 0..n-1); or for a moment after each volley (by: 'volley'). On top of
   * that a frame of its own for a moment after a graze (_t) and for a blink now and then (_b). bank: false for a
   * hull with no frames of its own for a bank.
   */
  hullFrame(dt) {
    const an = this.ship.anim;
    const f = this.ship.frame;
    const t = this.scene.t;
    this.grazeT = Math.max(0, (this.grazeT ?? 0) - dt);
    let n = 0;
    if (an.by === 'fire') {
      const firing = t - (this.volleyAt ?? -9) < 0.25;
      this.open = Math.max(0, Math.min(1, (this.open ?? 0) + (firing ? dt * 7 : -dt * 3.5)));
      n = Math.round(this.open * (an.n - 1));
    } else if (an.by === 'volley') {
      const since = t - (this.volleyAt ?? -9);
      n = since < 0.07 ? 1 : since < 0.16 ? 2 : since < 0.24 ? 1 : 0;
    } else {
      const cycle = an.cycle ?? [0, 1, 2, 1];
      n = cycle[Math.floor(t * an.rate * (1 + Math.max(0, this.thrust) * 0.5)) % cycle.length];
    }
    // (catching: the paw beckons twice, whatever the guns do)
    this.catchT = Math.max(0, (this.catchT ?? 0) - dt);
    if (an.catch && this.catchT > 0) n = [2, 1, 0, 1, 2, 1, 0][Math.floor((0.5 - this.catchT) / 0.072)] ?? 0;
    let name = n ? `${f}_f${n}` : f;
    if (an.graze && this.grazeT > 0) name = `${f}_t`;
    else if (an.blink && t % an.blink < 0.13) name = `${f}_b`;
    if (an.bank === false || name.endsWith('_t') || name.endsWith('_b')) return name;
    return this.bank < -0.35 ? `${name}_l` : this.bank > 0.35 ? `${name}_r` : name;
  }

  /** One bit of a premium look, now and then (b.rate a second): around (x, y) within sx by sy px, drifting down. */
  emit(b, x, y, sx, sy, dt) {
    if (Math.random() >= dt * b.rate) return;
    const fx = this.scene.fx;
    const p = fx.part(fx.parts, b.frames[Math.floor(Math.random() * b.frames.length)], x + (Math.random() - 0.5) * sx, y + (Math.random() - 0.5) * sy);
    p.vx = (Math.random() - 0.5) * (b.spread ?? 10);
    p.vy = b.vy ?? 30;
    p.drag = b.drag ?? 0.4;
    p.g = b.g ?? 0;
    p.grow = b.grow ?? 0;
    p.spin = (Math.random() - 0.5) * (b.spin ?? 0);
    p.life = p.max = (b.life ?? 0.5) * (0.8 + Math.random() * 0.4);
    p.a0 = b.alpha ?? 0.9;
    if (b.scale) p.setScale(b.scale * p.base);
    // (seq: the colours in turn, that many a second: a ribbon; else any of them)
    if (b.tints) p.setTint(b.tints[b.seq ? Math.floor(this.scene.t * b.seq) % b.tints.length : Math.floor(Math.random() * b.tints.length)]);
  }

  /** A premium burst (the ship flying in, a boss beaten, the ship lost): a ring, a flash, its bits thrown out. */
  burst(l, x, y, quiet = false) {
    const fx = this.scene.fx;
    if (l.flash != null && !quiet) fx.flash(0.3, 0.35, l.flash);
    fx.rings.push({ x, y, r: 4, life: 0.6, c: Array.isArray(l.ring) ? l.ring[Math.floor(Math.random() * l.ring.length)] : l.ring });
    fx.petalBurst(x, y, l.n ?? 30, l);
  }

  /** A boss is beaten: the victory look out of the gachapon, at the ship and then three more over the field. */
  celebrate() {
    const l = this.ship.look?.victory;
    if (!l || !this.alive) return;
    this.burst(l, this.x, this.y - 10);
    for (let i = 1; i <= 3; i++) this.scene.time.delayedCall(i * 380, () => this.burst(l, 30 + Math.random() * (VIEW.width - 60), 50 + Math.random() * this.scene.H * 0.4, true));
  }

  /** Where the turrets sit: at the very tips of the wings (the first on the left), a little behind the nose. */
  turretSpots() {
    const half = Math.round(this.wingSpan() / 2) - 1; // (the pod sits on the tip, not beyond it)
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
    const pod = this.ship.look?.pod ?? 'turret_wing'; // (its look out of the gachapon)
    this.turretArt.forEach((t, i) => {
      const p = spots[i];
      t.setVisible(!!p);
      if (p && t.frame.name !== pod) t.setFrame(pod);
      if (p) t.setPosition(Math.round(p.x), Math.round(p.y)).setAlpha(blink ? 0.35 : 1);
    });
    const g = this.bubble;
    g.clear();
    if (!on && !(this.alive && this.shieldT > 0)) return;
    // (its colours and its shape out of the gachapon: see bubble.js)
    const t = this.scene.t;
    const look = this.ship.look;
    drawBubble(g, this.x, this.y + 1, this.wingSpan() / 2 + 4 + Math.sin(t * 5) * 0.6, t, { gold: this.turrets >= 2, flash: this.shieldT > 0 ? this.shieldT / TURRETS.grace : 0, shield: look?.shield, shape: look?.shieldShape });
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
