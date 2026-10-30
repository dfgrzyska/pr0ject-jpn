import Phaser from 'phaser';
import { getMusic } from '../audio/Music.js';
import { DEPTH, PLAYER, SCORE, SHIPS, VIEW, WEAPONS } from '../config.js';
import { STAGES } from '../data/stages.js';
import { Bullets } from '../game/Bullets.js';
import { Enemies } from '../game/Enemies.js';
import { Fx } from '../game/Fx.js';
import { Hud } from '../game/Hud.js';
import { Parallax } from '../game/Parallax.js';
import { Player } from '../game/Player.js';
import { Pool } from '../game/Pool.js';
import { Score } from '../game/Score.js';
import { ShipSelect } from '../game/ShipSelect.js';
import { Waves } from '../game/Waves.js';

const HI_KEY = 'shmupjp.hiscore';
const SHIP_KEY = 'shmupjp.ship';

function loadShipIndex() {
  try {
    const i = SHIPS.findIndex((s) => s.id === localStorage.getItem(SHIP_KEY));
    return i >= 0 ? i : 1;
  } catch {
    return 1;
  }
}

/** All stage indices shuffled; `first` (debug ?stage=) goes to the front. */
function randomOrder(first) {
  const order = Phaser.Utils.Array.Shuffle(STAGES.map((_, i) => i));
  if (first !== null) order.unshift(...order.splice(order.indexOf(first), 1));
  return order;
}

function loadHi() {
  try {
    return Number(localStorage.getItem(HI_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveHi(v) {
  try {
    localStorage.setItem(HI_KEY, String(v));
  } catch {
    /* private mode etc. */
  }
}

export class Stage extends Phaser.Scene {
  constructor() {
    super('Stage');
  }

  create(data = {}) {
    // debug: ?stage=2 puts stage 2 (Okinawa) first, ?t=120 starts at 120 s, ?god = invulnerable,
    // ?weapon=laser&power=5, ?ship=oni
    const q = new URLSearchParams(window.location.search);
    const qStage = Number(q.get('stage')) - 1;
    // every new game plays all the cities in a fresh random order; "ETAP n" is the place in that order
    this.order = data.order ?? randomOrder(qStage >= 0 && qStage < STAGES.length ? qStage : null);
    this.pos = data.pos ?? 0;
    this.stageIndex = this.order[this.pos];
    this.stage = STAGES[this.stageIndex];
    this.stageTitle = `ETAP ${this.pos + 1}`;
    this.carry = data.carry ?? null;
    this.bossDown = false;
    this.bossClearT = 0;
    this.H = this.scale.height;
    this.state = 'title';
    this.paused = false;
    this.bombClear = 0;
    this.t = 0;
    this.endTimer = 0;
    this.clearT = 0;
    this.warned = new Set();

    this.parallax = new Parallax(this, this.stage, this.cache.json.get(`bg_${this.stage.id}`));
    this.fx = new Fx(this);
    this.bullets = new Bullets(this);
    this.enemies = new Enemies(this, this.stage.skin);
    this.pickups = new Pool(this, DEPTH.pickup);
    this.player = new Player(this);
    // N comes from stage 1 (x10 by the end of stage 1 without dying); the multiplier carries over
    const step =
      SCORE.multiplierStep === 'auto'
        ? Math.max(1, Math.round(Waves.totalWeight(STAGES[0].waves) / 9)) || SCORE.multiplierStepFallback
        : SCORE.multiplierStep;
    this.score = new Score(step);
    this.waves = new Waves(this.stage.waves);
    this.music = getMusic(this);
    this.sfx = this.music.sfx;
    this.hud = new Hud(this);

    const qShip = SHIPS.findIndex((sh) => sh.id === q.get('ship'));
    this.shipIndex = qShip >= 0 ? qShip : loadShipIndex();
    this.select = null;
    this.debugStart = Number(q.get('t')) || 0;
    this.player.god = q.has('god');
    if (WEAPONS[q.get('weapon')]) this.player.weapon = q.get('weapon');
    if (q.get('power')) this.player.level = Phaser.Math.Clamp(Number(q.get('power')), 1, PLAYER.maxPower);

    this.keys = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D,Z,M,ESC,P,ENTER,SPACE');
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', (p) => this.state === 'play' && !this.paused && this.player.dragMove(p));
    this.input.on('pointerup', (p) => this.player.endDrag(p));
    this.input.on('pointerupoutside', (p) => this.player.endDrag(p));
    this.scale.on('resize', this.onResize, this);
    this.game.events.on('hidden', this.onHidden, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize, this);
      this.game.events.off('hidden', this.onHidden, this);
    });

    if (this.carry) {
      this.startGame(); // straight on from the previous stage
      return;
    }
    this.music.play('title'); // audible once the browser allows audio (first tap / key)
    if (data.select) this.openSelect();
    else this.showTitle();
  }

  // ---------------------------------------------------------------- flow
  showTitle() {
    const touch = this.sys.game.device.input.touch;
    this.hud.panel([
      ['SHMUP', 0xffd6e5, 2],
      ['JAPONIA', 0xffd6e5, 2],
      '',
      [this.stageTitle, 0xffffff],
      [this.stage.subtitle, 0xf08bb0],
      '',
      { sprite: 'pickup_red', x: 52, text: 'ROZRZUT', tint: 0xff8a6a },
      { sprite: 'pickup_blue', x: 52, text: 'LASER', tint: 0x8ac8ff },
      { sprite: 'pickup_green', x: 52, text: 'NAPROWADZANE', tint: 0x9cf09a },
      '',
      [touch ? 'PRZESUWAJ PALCEM' : 'STRZAŁKI / WASD - RUCH', 0xb0aec0],
      [touch ? 'BOMBA - PRZYCISK W ROGU' : 'Z - BOMBA   ESC - PAUZA', 0xb0aec0],
      [touch ? 'DŹWIĘK - GŁOŚNIK U GÓRY' : 'M - DŹWIĘK', 0xb0aec0],
      '',
      [touch ? 'DOTKNIJ, ABY ZACZĄĆ' : 'ENTER - START', 0xffe080, 1, true],
    ]);
  }

  openSelect() {
    this.hud.closePanel();
    this.state = 'select';
    this.select = new ShipSelect(this, this.shipIndex);
  }

  startGame() {
    this.music.unlock();
    this.hud.closePanel();
    if (this.select) {
      this.shipIndex = this.select.index;
      try {
        localStorage.setItem(SHIP_KEY, this.select.ship.id);
      } catch {
        /* ignore */
      }
      this.select.destroy();
      this.select = null;
    } else if (this.carry) this.shipIndex = this.carry.ship;
    this.player.setShip(SHIPS[this.shipIndex]);
    if (this.carry) {
      const c = this.carry;
      Object.assign(this.score, { score: c.score, mult: c.mult, progress: c.progress });
      Object.assign(this.player, { lives: c.lives, weapon: c.weapon, level: c.level });
    }
    this.state = 'play';
    if (this.debugStart && !this.carry) {
      this.t = this.debugStart;
      this.parallax.setTime(this.debugStart);
      this.waves.skipTo(this.debugStart);
    }
    this.player.spawn();
    this.music.play(this.stageSong(), true);
    this.hud.show(this.stageTitle, this.stage.subtitle, 2.6);
  }

  /** After game over: a new game in a new random order (ship selection, fresh lives and score). */
  restart() {
    this.scene.restart({ select: true });
  }

  /** After a cleared stage: carry everything into the next city of this game's order, or start a new game. */
  advance() {
    const pos = this.pos + 1;
    if (pos >= this.order.length) return this.scene.restart({ select: true });
    const p = this.player;
    const s = this.score;
    this.scene.restart({
      order: this.order,
      pos,
      carry: { ship: this.shipIndex, lives: p.lives, weapon: p.weapon, level: p.level, score: s.score, mult: s.mult, progress: s.progress },
    });
  }

  /** Called by Enemies when every part of the stage boss is destroyed. */
  onBossDefeated() {
    this.bossDown = true;
    this.bossClearT = 3;
    this.player.bombs = 1; // the bomb refills after a boss
    this.bullets.cancelAll(this.fx);
    this.fx.flash(0.6, 0.6);
    if (this.stage.warnings?.bossDown) this.hud.show(this.stage.warnings.bossDown, '', 2.4);
  }

  gameOver() {
    this.state = 'over';
    this.music.play('over', true);
    this.endTimer = 1.8;
    const hi = this.recordHi();
    this.time.delayedCall(1300, () =>
      this.hud.panel([
        ['KONIEC GRY', 0xff7448, 2],
        '',
        ['WYNIK', 0xb0aec0],
        [String(this.score.score).padStart(8, '0'), 0xffffff, 2],
        hi.isNew ? ['NOWY REKORD!', 0xffe080, 1, true] : [`REKORD ${String(hi.value).padStart(8, '0')}`, 0xb0aec0],
        '',
        ['DOTKNIJ / ENTER - JESZCZE RAZ', 0xffe080, 1, true],
      ]),
    );
  }

  stageClear() {
    this.state = 'clear';
    this.music.play('clear', true);
    this.clearT = 0;
    this.endTimer = 3;
    this.player.bombs = 1; // stages without a boss refill the bomb at the end
    this.player.drag = null;
    const next = STAGES[this.order[this.pos + 1]];
    this.bullets.cancelAll(this.fx);
    const hi = this.recordHi();
    this.time.delayedCall(2000, () =>
      this.hud.panel([
        [this.stageTitle, 0xffd6e5, 2],
        ['UKOŃCZONY', 0xffd6e5, 2],
        '',
        ['WYNIK', 0xb0aec0],
        [String(this.score.score).padStart(8, '0'), 0xffffff, 2],
        [`MNOŻNIK ×${this.score.mult}`, 0xf08bb0],
        hi.isNew ? ['NOWY REKORD!', 0xffe080, 1, true] : [`REKORD ${String(hi.value).padStart(8, '0')}`, 0xb0aec0],
        ['BOMBA UZUPEŁNIONA', 0xb0aec0],
        '',
        next ? [`DALEJ: ETAP ${this.pos + 2} - ${next.name}`, 0xffffff] : ['GRATULACJE!', 0xffe080],
        [next ? 'DOTKNIJ / ENTER' : 'DOTKNIJ / ENTER - JESZCZE RAZ', 0xffe080, 1, true],
      ]),
    );
  }

  recordHi() {
    const prev = loadHi();
    if (this.score.score > prev) {
      saveHi(this.score.score);
      return { isNew: true, value: this.score.score };
    }
    return { isNew: false, value: prev };
  }

  togglePause() {
    if (this.state !== 'play') return;
    this.paused = !this.paused;
    this.player.drag = null;
    this.music.setPaused(this.paused);
    if (this.paused) {
      const touch = this.sys.game.device.input.touch;
      this.hud.panel([['PAUZA', 0xffffff, 2], '', [touch ? 'DOTKNIJ, ABY WRÓCIĆ' : 'ESC - POWRÓT', 0xffe080, 1, true]]);
      this.anims.pauseAll();
      this.time.paused = true;
    } else {
      this.hud.closePanel();
      this.anims.resumeAll();
      this.time.paused = false;
    }
  }

  // ---------------------------------------------------------------- input
  onPointerDown(p) {
    if (this.hud.hitSound(p)) {
      this.music.unlock();
      this.music.toggle();
      return;
    }
    if (this.state === 'title') return this.openSelect();
    if (this.state === 'select') {
      const i = this.select.hit(p);
      if (i === null || i === this.select.index) this.startGame();
      else this.select.select(i);
      return;
    }
    if (this.state === 'over' || this.state === 'clear') {
      if (this.endTimer <= 0) (this.state === 'clear' ? this.advance() : this.restart());
      return;
    }
    if (this.paused || this.hud.hitPause(p)) return this.togglePause();
    if (this.hud.hitBomb(p)) return this.player.bomb();
    this.player.beginDrag(p);
  }

  handleKeys() {
    const k = this.keys;
    const down = Phaser.Input.Keyboard.JustDown;
    const confirm = down(k.ENTER) || down(k.SPACE);
    const bomb = down(k.Z);
    if (down(k.ESC) || down(k.P)) this.togglePause();
    if (down(k.M)) this.music.toggle();
    if (this.state === 'title') {
      if (confirm || bomb) this.openSelect();
    } else if (this.state === 'select') {
      if (down(k.LEFT) || down(k.A)) this.select.select(this.select.index - 1);
      if (down(k.RIGHT) || down(k.D)) this.select.select(this.select.index + 1);
      if (confirm || bomb) this.startGame();
    } else if (this.state === 'over' || this.state === 'clear') {
      if (confirm && this.endTimer <= 0) (this.state === 'clear' ? this.advance() : this.restart());
    } else if (this.paused) {
      if (confirm) this.togglePause();
    } else if (bomb) this.player.bomb();
  }

  onResize(size) {
    this.H = size.height;
    this.cameras.resize(VIEW.width, this.H);
    this.hud.layout(this.H);
    this.select?.layout(this.H);
    this.player.clamp();
  }

  onHidden() {
    if (this.state === 'play' && !this.paused) this.togglePause();
  }

  // ---------------------------------------------------------------- loop
  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 20);
    this.handleKeys();
    this.hud.update(dt);
    if (this.paused) return;
    if (this.endTimer > 0) this.endTimer -= dt;

    const playing = this.state === 'play';
    this.parallax.update(dt, this.state !== 'title' && this.state !== 'select', this.H);
    this.select?.update(dt);
    if (playing) {
      this.t += dt;
      this.waves.update(this.t, (w) => this.enemies.spawn(w));
      for (const type of ['heavy', 'boss']) {
        const w = this.waves.upcoming(type, this.t, 3);
        if (w && !this.warned.has(w)) {
          this.warned.add(w);
          this.hud.show('UWAGA!', w.warning ?? this.stage.warnings?.[type] ?? 'CIĘŻKI CEL', 2.6, true);
        }
      }
      this.music.play(this.stageSong());
      this.parallax.snow = this.weather();
    }
    if (this.bombClear > 0) {
      this.bombClear -= dt;
      this.bullets.cancelAll(null);
    }

    if (this.state === 'clear') {
      this.clearT += dt;
      if (this.clearT > 0.8 && this.player.alive && this.player.y > -40) this.player.y -= Math.min(220, (this.clearT - 0.8) * 260) * dt;
    }
    this.player.update(dt, playing ? this.keys : null, playing);
    this.enemies.update(dt);
    this.bullets.update(dt, this.H);
    this.updatePickups(dt);
    this.fx.update(dt, this.parallax);
    if (playing) this.collide();

    if (playing && this.stage.boss) {
      if (this.bossDown && (this.bossClearT -= dt) <= 0) this.stageClear();
    } else if (playing && this.t >= this.stage.end && this.waves.done && (this.enemies.count() === 0 || this.t > this.stage.end + 12))
      this.stageClear();
  }

  /** Snowfall / ashfall intensity 0..1 from the stage's weather schedule; a storm while Yuki-onna or Raijū is here. */
  weather() {
    const w = this.stage.weather;
    const h = this.enemies.heavy;
    const storm = (h?.kind === 'yukionna' || h?.kind === 'raiju') && h.state !== 'leave';
    this.parallax.storm = storm && h.kind === 'raiju' ? 1 : 0;
    if (!w) return 0;
    if (storm) return 1;
    let v = w[0][1];
    for (const [t, s] of w) if (this.t >= t) v = s;
    return v;
  }

  /** Music follows the stage: its time schedule, switching to the heavy / boss themes when they come. */
  stageSong() {
    const m = this.stage.music;
    const g = this.enemies.bossGroup;
    if ((g && !g.defeated) || this.waves.upcoming('boss', this.t, 3)) return m.boss ?? m.heavy;
    // a heavy may bring its own theme (wave field music), otherwise the stage's heavy theme
    const h = this.enemies.heavy;
    if (h) return h.song ?? m.heavy;
    const hw = this.waves.upcoming('heavy', this.t, 3);
    if (hw) return hw.music ?? m.heavy;
    let song = m.schedule[0][1];
    for (const [t, name] of m.schedule) if (this.t >= t) song = name;
    return song;
  }

  spawnPickup(color, x, y, vy) {
    this.pickups.spawn(`pickup_${color}`, Phaser.Math.Clamp(x, 10, VIEW.width - 10), y, { color, vy, age: 0, x0: x });
  }

  updatePickups(dt) {
    for (const p of this.pickups.live) {
      p.age += dt;
      p.vy = Math.min(p.vy + 90 * dt, 24);
      p.y += p.vy * dt;
      p.x = Phaser.Math.Clamp(p.x0 + Math.sin(p.age * 2) * 6, 8, VIEW.width - 8);
      p.setAlpha(p.age > 7 && Math.floor(p.age * 8) % 2 ? 0.4 : 1);
      if (p.y > this.H + 12) this.pickups.kill(p);
    }
    this.pickups.sweep();
  }

  collide() {
    const p = this.player;
    const enemies = this.enemies.live;

    // player shots -> enemies (air and ground)
    for (const s of p.shots.live) {
      if (s.dead) continue;
      for (const e of enemies) {
        if (e.dead || e.hp <= 0 || e.ghost || e.pass || e.y < -e.radius + 2) continue;
        const r = e.radius + s.radius;
        const dx = e.x - s.x;
        const dy = e.y - s.y;
        if (dx * dx + dy * dy < r * r) {
          this.enemies.damage(e, s.damage);
          if (Math.random() < 0.5) this.fx.spark(s.x, s.y - 2);
          p.shots.kill(s);
          break;
        }
      }
    }

    if (!p.alive) return;

    // pickups
    const pr2 = PLAYER.pickupRadius ** 2;
    for (const k of this.pickups.live) {
      if ((k.x - p.x) ** 2 + (k.y - p.y) ** 2 < pr2) {
        this.pickups.kill(k);
        p.collect(k.color);
      }
    }

    if (p.invulnerable > 0 || p.entering > 0 || p.god) return;
    const hr = PLAYER.hitRadius;
    for (const b of this.bullets.pool.live) {
      if (b.safe > 0) continue; // icicles blinking before they fall
      const r = b.radius + hr;
      if ((b.x - p.x) ** 2 + (b.y - p.y) ** 2 < r * r) {
        this.bullets.pool.kill(b);
        p.hit();
        return;
      }
    }
    // lightning and steam columns, the arcs between Raijū's orbs
    if (this.bullets.hazardAt(p.x, p.y, hr)) {
      p.hit();
      return;
    }
    for (const e of enemies) {
      if (e.ground || e.dead || e.ghost) continue;
      const r = e.radius * 0.7 + hr;
      if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < r * r) {
        p.hit();
        if (e.type !== 'heavy' && e.type !== 'boss') this.enemies.damage(e, 999);
        return;
      }
    }
  }
}
