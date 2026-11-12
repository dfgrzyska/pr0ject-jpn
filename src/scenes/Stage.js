import Phaser from 'phaser';
import { NagasakiView } from '../game/NagasakiView.js';
import { getMusic } from '../audio/Music.js';
import { DEPTH, GRAZE, PLAYER, RENDER_SCALE, SCORE, SHIPS, VIEW, WEAPONS } from '../config.js';
import { STAGES } from '../data/stages.js';
import { Bullets } from '../game/Bullets.js';
import { Enemies } from '../game/Enemies.js';
import { Fx } from '../game/Fx.js';
import { Hud, pixelText } from '../game/Hud.js';
import { JourneyMenu, lastCity } from '../game/JourneyMenu.js';
import { JapanMap } from '../game/JapanMap.js';
import { Debug } from '../game/Debug.js';
import { Interlude } from '../game/Interlude.js';
import { Ending } from '../game/Ending.js';
import { PauseMenu } from '../game/PauseMenu.js';
import { Shadows } from '../game/Shadows.js';
import { Parallax } from '../game/Parallax.js';
import { Player } from '../game/Player.js';
import { Pool } from '../game/Pool.js';
import { Score } from '../game/Score.js';
import { ShipSelect } from '../game/ShipSelect.js';
import { INK, PALE, StampBook, hasStamp, pressStamp, stampFrame } from '../game/Stamps.js';
import { Waves } from '../game/Waves.js';
import { DiscoveryBook, DiscoveryNotice, FoodTrail, discoveries } from '../game/Discoveries.js';
import { yokaiForEnemy } from '../data/discoveries.js';
import { isEasy, rules } from '../difficulty.js';
import { getLang, setLang, t } from '../i18n.js';
import { canInstall, install } from '../pwa.js';
import { stageReady } from './Boot.js';
import { configureCamera } from '../rendering.js';

const HI_KEY = 'shmupjp.hiscore'; // (easy keeps its own record, .easy)
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

function hiKey() {
  return isEasy() ? `${HI_KEY}.easy` : HI_KEY;
}

function loadHi() {
  try {
    return Number(localStorage.getItem(hiKey())) || 0;
  } catch {
    return 0;
  }
}

function saveHi(v) {
  try {
    localStorage.setItem(hiKey(), String(v));
  } catch {
    /* private mode etc. */
  }
}

export class Stage extends Phaser.Scene {
  constructor() {
    super('Stage');
  }

  init(data = {}) {
    // every new game plays all the cities in a fresh random order; "ETAP n" is the place in that order
    // (debug: ?stage=2 puts stage 2, Okinawa, first)
    const qStage = Number(new URLSearchParams(window.location.search).get('stage')) - 1;
    this.order = data.order ?? randomOrder(qStage >= 0 && qStage < STAGES.length ? qStage : lastCity());
    this.pos = data.pos ?? 0;
    this.stageIndex = this.order[this.pos];
    this.stage = STAGES[this.stageIndex];
  }

  create(data = {}) {
    this.H = this.scale.height / RENDER_SCALE;
    configureCamera(this.cameras.main);
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
    // The previous scene's objects have been destroyed before create runs.
    this.scene.get('Boot').retainStages(this.order.slice(this.pos, this.pos + 2).map(i => STAGES[i].id));
    if (!stageReady(this, this.stage.id)) {
      // this city's backgrounds are still on their way: wait for them (update), then begin again
      this.state = 'loading';
      this.loadingData = data;
      this.scene.get('Boot').fetch([this.stage.id]);
      this.loadingLabel = pixelText(this, VIEW.width / 2, Math.round(this.H / 2), 'WCZYTYWANIE...').setTint(0xb0aec0);
      return;
    }
    // debug: ?t=120 starts at 120 s, ?god = invulnerable, ?weapon=laser&power=5, ?ship=oni
    const q = new URLSearchParams(window.location.search);
    this.stageTitle = `ETAP ${this.pos + 1}`;
    this.carry = data.carry ?? null;
    this.continues = this.carry?.continues ?? 0; // easy: continues used in this game
    // the whole journey so far, for the ending: ships lost, bombs used, time flown, stamps won, cities cleared
    this.run = this.carry?.run ?? { deaths: 0, bombs: 0, time: 0, stamps: [], cities: [] };
    this.ending = null;
    this.contT = 0; // easy: the continue countdown after a game over
    this.bossDown = false;
    this.bossClearT = 0;
    this.state = 'title';
    this.paused = false;
    this.pauseMenu = null;
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
    this.shadows = this.stage.shadows ? new Shadows(this) : null;
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
    this.discoveryNotice = new DiscoveryNotice(this);
    this.foodTrail = new FoodTrail(this);
    this.debug = new Debug(this);
    // Hiroshima: the moment of silence over the Peace Park (no shooting, the paper cranes dance)
    this.ceasefire = false;
    this.scenicView = this.stage.panorama ? new NagasakiView(this) : null;
    this.interlude = this.stage.interlude ? new Interlude(this, this.stage.interlude) : null;
    this.music.duck?.(1);
    // the sprite pools made ahead (the most the busiest stages need, with some to spare), so a fight never has
    // to stop and make them: on a phone that tends to come back as a stutter a moment later
    const b = this.bullets;
    const f = this.fx;
    const e = this.enemies;
    for (const [pool, n] of [[b.pool, 90], [b.lobs, 8], [b.marks, 8], [this.player.shots, 50], [f.parts, 80], [f.petals, 60], [f.sparks, 30], [f.smokes, 30], [f.air, 12], [f.lights, 12], [f.scorch, 10], [f.ground, 6], [e.pool, 30], [e.heads, 8], [e.wrecks, 8], [e.woundPool, 8]])
      pool.warm(n);

    const qShip = SHIPS.findIndex((sh) => sh.id === q.get('ship') || sh.name.toLowerCase() === q.get('ship')); // (?ship=tsuru too)
    this.shipIndex = qShip >= 0 ? qShip : loadShipIndex();
    this.select = null;
    this.journey = null;
    this.map = null; // the map of Japan between stages
    this.book = null; // the stamp book
    this.stampLand = null; // the stamp coming down onto the results
    this.freezeT = 0; // hit-stop
    // this city's stamp: won by clearing the stage without a death or a bomb (not with debug help); on easy a
    // pale one, which a win on normal inks in full
    this.stampInk = INK[this.stage.id];
    this.stampOwned = hasStamp(this.stage.id, isEasy());
    this.stampEligible = false;
    this.stampChance = false;
    this.debugStart = Number(q.get('t')) || 0;
    this.player.god = q.has('god');
    // debug: ?hitbox outlines what can be hit (green: shots, red: ramming, blue: the extra circles of tentacles and coils,
    // magenta: enemy bullets, yellow: the player's shots, white: the ship)
    this.hitboxes = q.has('hitbox') ? this.add.graphics().setDepth(DEPTH.overlay + 3) : null;
    if (WEAPONS[q.get('weapon')]) this.player.weapon = q.get('weapon');
    if (q.get('power')) this.player.level = Phaser.Math.Clamp(Number(q.get('power')), 1, PLAYER.maxPower);

    this.keys = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D,Z,M,K,L,I,G,Y,F,ESC,P,ENTER,SPACE');
    this.input.on('pointerdown', (p) => this.onPointerDown(this.logicalPointer(p)));
    this.input.on('pointermove', (p) => {
      p = this.logicalPointer(p);
      if (this.state === 'city' || this.state === 'title') this.journey.pointerMove(p);
      else if (this.state === 'play' && !this.paused) this.player.dragMove(p);
    });
    this.input.on('pointerup', (p) => { this.player.endDrag(p); this.journey?.pointerUp(p); });
    this.input.on('pointerupoutside', (p) => { this.player.endDrag(p); this.journey?.pointerUp(p); });
    this.game.events.on('hidden', this.onHidden, this);
    this.events.once('shutdown', () => {
      this.game.events.off('hidden', this.onHidden, this);
    });

    this.loadAhead();
    // debug: ?ending goes straight to the ending, after a made-up journey
    if (q.has('ending')) {
      this.run = { deaths: 2, bombs: 3, time: 1294, stamps: this.order.slice(0, 4).map((i) => STAGES[i].id), cities: this.order.map((i) => STAGES[i].id) };
      this.score.score = 1234560;
      this.player.setShip(SHIPS[this.shipIndex]);
      this.openEnding();
      return;
    }
    if (this.carry) {
      this.startGame(); // straight on from the previous stage
      return;
    }
    this.music.play('title'); // audible once the browser allows audio (first tap / key)
    if (data.select) {
      this.journey = new JourneyMenu(this, this.stageIndex);
      this.openSelect();
    } else this.showTitle();
  }

  /** Keep only the next city's backgrounds ready in advance. */
  loadAhead() {
    this.scene.get('Boot').fetch(this.order.slice(this.pos + 1, this.pos + 2).map((i) => STAGES[i].id));
  }

  // ---------------------------------------------------------------- flow
  showTitle() {
    this.hud.closePanel();
    this.state = 'title';
    const index = this.journey?.index ?? this.stageIndex;
    this.journey?.destroy();
    this.journey = new JourneyMenu(this, index);
  }

  openCities() {
    this.select?.destroy();
    this.select = null;
    this.state = 'city';
    this.journey.setMode('city');
  }

  confirmCity() {
    this.journey.remember();
    this.scene.restart({ order: randomOrder(this.journey.index), pos: 0, select: true });
  }

  /** Polish / English, from the title screen. */
  toggleLang() {
    setLang(getLang() === 'pl' ? 'en' : 'pl');
    this.showTitle();
  }

  /** The stamp book, opened from the title screen. */
  openBook() {
    this.hud.closePanel();
    this.journey.setMode('backdrop');
    this.state = 'book';
    this.book = new StampBook(this, t);
  }

  closeBook() {
    this.book.destroy();
    this.book = null;
    this.state = 'title';
    this.showTitle();
  }

  openCollection(kind) {
    this.hud.closePanel();
    this.journey.setMode('backdrop');
    this.state = 'book';
    this.book = new DiscoveryBook(this, kind);
  }

  discoverEnemy(enemy, bossDefeated = false) {
    if (this.state !== 'play') return;
    const entry = yokaiForEnemy(this.stage.id, enemy, bossDefeated);
    if (entry && discoveries.discover(entry.id)) this.discoveryNotice.add(entry);
  }

  openSelect() {
    this.hud.closePanel();
    this.journey?.setMode('backdrop');
    this.state = 'select';
    this.select = new ShipSelect(this, this.shipIndex);
  }

  startGame() {
    this.journey?.destroy();
    this.journey = null;
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
    this.stampEligible = !this.player.god && !(this.debugStart && !this.carry);
    this.stampChance = this.stampEligible; // lost with a life or a bomb (Player)
    if (this.debugStart && !this.carry) {
      this.t = this.debugStart;
      this.parallax.setTime(this.debugStart);
      this.waves.skipTo(this.debugStart);
      this.interlude?.skipTo(this.debugStart);
    }
    this.parallax.props.sync(this.t);
    this.player.spawn();
    this.music.play(this.stageSong(), true);
    this.hud.cityCard(`seal_${this.stage.id}`, this.stampInk, this.stageTitle, this.stage.subtitle);
  }

  /** After game over: return to the menu for a fresh journey. */
  restart() {
    this.scene.restart({});
  }

  /** After the results of a cleared stage: the map of Japan, the ship flying on to the next city. */
  openMap() {
    this.hud.closePanel();
    this.state = 'map';
    this.map = new JapanMap(this, STAGES, this.order, this.pos);
    this.music.play('title', true);
  }

  /** Tap / Enter on the results or the game over: on, carry on (easy, once the countdown shows), or again. */
  leaveEnd() {
    if (this.state === 'clear') this.leaveClear();
    else if (this.contT > 0) {
      if (this.contShown) this.continueGame();
    } else this.restart();
  }

  /** Tap / Enter on the results: on to the map, or (after the last city) the ending. */
  leaveClear() {
    if (this.order[this.pos + 1] === undefined) this.openEnding();
    else this.openMap();
  }

  /** Tap / Enter on the map: skip the flight, or once landed, go. */
  leaveMap() {
    if (this.map.ready) this.advance();
    else this.map.finish();
  }

  /** After a cleared stage: carry everything into the next city of this game's order, or start a new game. */
  advance() {
    const pos = this.pos + 1;
    if (pos >= this.order.length) return this.scene.restart({});
    const p = this.player;
    const s = this.score;
    this.scene.restart({
      order: this.order,
      pos,
      carry: { ship: this.shipIndex, lives: p.lives, weapon: p.weapon, level: p.level, score: s.score, mult: s.mult, progress: s.progress, continues: this.continues, run: this.run },
    });
  }

  /** After the last city's results: the ending (the journey's map, the seals, the summary, the bosses, Fuji). */
  openEnding() {
    this.hud.closePanel();
    this.state = 'ending';
    this.ending = new Ending(this);
  }

  /** A moment's hit-stop when a boss or miniboss goes down: everything holds still, then the explosions. */
  freeze(sec) {
    if (this.freezeT > 0) return;
    this.freezeT = sec;
    this.anims.pauseAll();
    this.time.paused = true;
    this.fx.flash(0.55, sec + 0.15);
  }

  /** Called by Enemies when every part of the stage boss is destroyed. */
  onBossDefeated() {
    this.discoverEnemy({ type: 'boss' }, true);
    this.freeze(0.45);
    this.bossDown = true;
    this.bossClearT = 3;
    if (this.scenicView) {
      this.ceasefire = true;
      for (const e of this.enemies.live) if (!e.dead && e.type !== 'boss') this.enemies.remove(e);
      this.enemies.pool.sweep();
    }
    this.player.bombs = 1; // the bomb refills after a boss
    this.bullets.cancelAll(this.fx);
    this.fx.flash(0.6, 0.6);
    if (this.stage.warnings?.bossDown) this.hud.show(this.stage.warnings.bossDown, this.stage.warnings.bossDownSub ?? '', 2.4);
  }

  gameOver() {
    this.state = 'over';
    this.music.play('over', true);
    this.endTimer = 1.8;
    if (this.continues < rules().continues) {
      // easy: a countdown to carry on (see update); its panel comes up once the explosion is over
      this.contT = 11.3;
      this.contShown = 0;
      return;
    }
    this.finalOver(1300);
  }

  /** The game is over for good: the score, the record, and a new game. */
  finalOver(delay) {
    const hi = this.recordHi();
    this.time.delayedCall(delay, () =>
      this.hud.panel([
        ['KONIEC GRY', 0xff7448, 2],
        ...this.modeLines(),
        '',
        ['WYNIK', 0xb0aec0],
        [String(this.score.score).padStart(8, '0'), 0xffffff, 2],
        hi.isNew ? ['NOWY REKORD!', 0xffe080, 1, true] : [`REKORD ${String(hi.value).padStart(8, '0')}`, 0xb0aec0],
        '',
        ['DOTKNIJ / ENTER - JESZCZE RAZ', 0xffe080, 1, true],
      ]),
    );
  }

  /** Easy, after a game over: the countdown to carry on. */
  showContinue(n) {
    this.hud.panel([
      ['KONTYNUOWAĆ?', 0xffd6e5, 2],
      '',
      [String(n), 0xffffff, 3],
      '',
      ['WYNIK', 0xb0aec0],
      [String(this.score.score).padStart(8, '0'), 0xffffff, 2],
      '',
      [`POZOSTAŁO KONTYNUACJI: ${rules().continues - this.continues}`, 0xb0aec0],
      ['PEŁNE ŻYCIA, WYNIK OD ZERA', 0xb0aec0],
      ['DOTKNIJ / ENTER - TAK', 0xffe080, 1, true],
    ]);
  }

  /** Easy: carry on where the ship fell, with full lives and the score from zero. */
  continueGame() {
    this.recordHi();
    this.hud.closePanel();
    this.contT = 0;
    this.continues++;
    this.endTimer = 0;
    Object.assign(this.score, { score: 0, mult: 1, progress: 0 });
    const p = this.player;
    p.lives = p.fullLives();
    p.respawnTimer = 0;
    this.bullets.cancelAll(this.fx);
    this.state = 'play';
    p.spawn();
    this.music.play(this.stageSong(), true);
  }

  /** Easy: a line saying so on the results, and the continues used. */
  modeLines() {
    if (!isEasy()) return [];
    return [['TRYB ŁATWY', 0x9cf09a], ...(this.continues ? [[`KONTYNUACJE: ${this.continues}`, 0xb0aec0]] : [])];
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
    this.lastHi = hi; // (the ending shows it again)
    const won = this.stampChance && pressStamp(this.stage.id, isEasy());
    if (this.stampChance) this.run.stamps.push(this.stage.id); // earned in this game (even if the book had it)
    this.run.cities.push(this.stage.id);
    const stamp = !this.stampEligible ? null : won ? [t(isEasy() ? 'stamp.newEasy' : 'stamp.new'), 0xffe080, 1, true] : [t(this.stampOwned ? 'stamp.have' : 'stamp.missed'), 0x8a8aa8];
    this.time.delayedCall(2000, () => {
      this.hud.panel([
        [this.stageTitle, 0xffd6e5, 2],
        ['UKOŃCZONY', 0xffd6e5, 2],
        ...this.modeLines(),
        '',
        ['WYNIK', 0xb0aec0],
        [String(this.score.score).padStart(8, '0'), 0xffffff, 2],
        [`MNOŻNIK ×${this.score.mult}`, 0xf08bb0],
        hi.isNew ? ['NOWY REKORD!', 0xffe080, 1, true] : [`REKORD ${String(hi.value).padStart(8, '0')}`, 0xb0aec0],
        ['BOMBA UZUPEŁNIONA', 0xb0aec0],
        ...(stamp ? [stamp] : []),
        '',
        next ? [`DALEJ: ETAP ${this.pos + 2} - ${next.name}`, 0xffffff] : ['PODRÓŻ UKOŃCZONA!', 0xffe080],
        ['DOTKNIJ / ENTER', 0xffe080, 1, true],
      ]);
      this.hud.framePanel();
      if (won) this.landStamp();
    });
  }

  /** The city's stamp pressed onto the results: it comes down big and lands with a thump (see update). */
  landStamp() {
    const img = this.add.image(VIEW.width / 2, this.H - 38, 'sprites', stampFrame(this.stage.id)).setDepth(DEPTH.overlay + 2).setTint(this.stampInk).setScale(2.6).setAlpha(0);
    this.hud.overlayItems.push(img);
    this.stampLand = { img, t: -0.35, ink: isEasy() ? PALE + 0.2 : 0.95 }; // pale on easy (on the dark results a little less so)
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
      this.pauseMenu = new PauseMenu(this);
      this.anims.pauseAll();
      this.time.paused = true;
    } else {
      this.pauseMenu?.destroy();
      this.pauseMenu = null;
      this.hud.closePanel();
      this.anims.resumeAll();
      this.time.paused = false;
    }
  }

  returnToTitle() {
    this.pauseMenu?.destroy();
    this.pauseMenu = null;
    this.paused = false;
    this.anims.resumeAll();
    this.time.paused = false;
    this.music.setPaused(false);
    this.scene.restart({});
  }

  // ---------------------------------------------------------------- input
  logicalPointer(p) {
    // Screen coordinates, independent of camera shake; never mutate Phaser's pointer.
    return { x: p.x / RENDER_SCALE, y: p.y / RENDER_SCALE, id: p.id, isDown: p.isDown };
  }

  onPointerDown(p) {
    if (this.paused) return this.pauseMenu?.pointer(p);
    if (this.state === 'select' && p.x < 60 && p.y < 28) return this.openCities();
    if (this.hud.hitSound(p)) {
      this.music.unlock();
      this.music.toggle();
      return;
    }
    if (this.hud.hitDebug(p)) return this.debug.toggle();
    if (this.state === 'city') return this.journey.pointerDown(p);
    if (this.state === 'title') {
      if (this.hud.hitLang(p)) return this.toggleLang();
      if (this.hud.hitInstall(p)) return install().then(() => this.state === 'title' && this.showTitle());
      return this.journey.pointerDown(p);
    }
    if (this.state === 'book') {
      if (this.book.pointer) return this.book.pointer(p);
      return this.book.hitTurn(p) || this.closeBook();
    }
    if (this.state === 'select') {
      if (this.select.hitMode(p)) return this.select.toggleMode();
      const i = this.select.hit(p);
      if (i === null || i === this.select.index) this.startGame();
      else this.select.select(i);
      return;
    }
    if (this.state === 'map') return this.leaveMap();
    if (this.state === 'ending') return this.ending.tap();
    if (this.state === 'over' || this.state === 'clear') {
      if (this.endTimer <= 0) this.leaveEnd();
      return;
    }
    if (this.hud.hitPause(p)) return this.togglePause();
    // the bomb corner only takes the touch when a bomb actually goes off; otherwise it steers like anywhere else
    if (this.hud.hitBomb(p) && this.player.bomb()) return;
    this.player.beginDrag(p);
  }

  handleKeys() {
    const k = this.keys;
    const down = Phaser.Input.Keyboard.JustDown;
    const confirm = down(k.ENTER) || down(k.SPACE);
    const bomb = down(k.Z);
    const escape = down(k.ESC);
    if (this.paused) {
      if (escape || down(k.P)) this.pauseMenu.back();
      else if (down(k.UP) || down(k.DOWN) || down(k.W) || down(k.S)) this.pauseMenu.move();
      else if (confirm || bomb) this.pauseMenu.activate();
      if (down(k.M)) this.music.toggle();
      return;
    }
    if (escape && this.state === 'city') return this.showTitle();
    if (escape && this.state === 'select') return this.openCities();
    if (escape || down(k.P)) { this.togglePause(); if (this.paused) return; }
    if (down(k.M)) this.music.toggle();
    if (down(k.G)) this.debug.toggle();
    if (this.state === 'title') {
      if (down(k.K)) this.openBook();
      else if (down(k.Y)) this.openCollection('yokai');
      else if (down(k.F)) this.openCollection('food');
      else if (down(k.L)) this.toggleLang();
      else if (down(k.I) && canInstall()) install().then(() => this.state === 'title' && this.showTitle());
      else if (down(k.UP) || down(k.W)) this.journey.focus = (this.journey.focus + 3) % 4;
      else if (down(k.DOWN) || down(k.S)) this.journey.focus = (this.journey.focus + 1) % 4;
      else if (confirm || bomb) this.journey.activate();
    } else if (this.state === 'city') {
      if (down(k.UP) || down(k.W) || down(k.LEFT) || down(k.A)) this.journey.step(-1);
      if (down(k.DOWN) || down(k.S) || down(k.RIGHT) || down(k.D)) this.journey.step(1);
      if (confirm || bomb) this.confirmCity();
    } else if (this.state === 'book') {
      if (down(k.LEFT) || down(k.A)) this.book.turn(-1);
      else if (down(k.RIGHT) || down(k.D)) this.book.turn(1);
      else if (confirm || bomb || down(k.K) || escape) this.closeBook();
    } else if (this.state === 'select') {
      if (down(k.LEFT) || down(k.A)) this.select.select(this.select.index - 1);
      if (down(k.RIGHT) || down(k.D)) this.select.select(this.select.index + 1);
      if (down(k.UP) || down(k.W) || down(k.DOWN) || down(k.S)) this.select.toggleMode();
      if (confirm || bomb) this.startGame();
    } else if (this.state === 'map') {
      if (confirm) this.leaveMap();
    } else if (this.state === 'ending') {
      if (confirm || bomb) this.ending.tap();
    } else if (this.state === 'over' || this.state === 'clear') {
      if (confirm && this.endTimer <= 0) this.leaveEnd();
    } else if (bomb) this.player.bomb();
  }

  onResize(size) {
    this.H = size.height / RENDER_SCALE;
    this.cameras.resize(size.width, size.height);
    if (this.state === 'loading') {
      this.loadingLabel.setY(Math.round(this.H / 2));
      return;
    }
    this.hud.layout(this.H);
    this.journey?.layout(this.H);
    this.pauseMenu?.layout(this.H);
    this.select?.layout(this.H);
    this.map?.layout(this.H);
    this.ending?.layout(this.H);
    this.book?.layout(this.H);
    this.player.clamp();
  }

  onHidden() {
    if (this.state === 'play' && !this.paused) this.togglePause();
  }

  // ---------------------------------------------------------------- loop
  update(time, delta) {
    if (this.state === 'loading') {
      if (stageReady(this, this.stage.id)) this.scene.restart(this.loadingData);
      return;
    }
    this.debug.frame(this.game.loop.rawDelta); // (the real time between frames, not Phaser's ten-frame average)
    const dt = Math.min(delta / 1000, 1 / 20);
    this.handleKeys();
    this.hud.update(dt);
    this.discoveryNotice.update(dt);
    if (this.paused) return;
    if (this.freezeT > 0) {
      if ((this.freezeT -= dt) <= 0) {
        this.anims.resumeAll();
        this.time.paused = false;
      }
      return;
    }
    if (this.endTimer > 0) this.endTimer -= dt;
    if (this.state === 'over' && this.contT > 0) {
      // easy: the continue countdown, then the game is over for good
      this.contT -= dt;
      const n = Math.ceil(this.contT);
      if (this.contT <= 0) {
        this.endTimer = 0.6;
        this.finalOver(0);
      } else if (n <= 10 && n !== this.contShown) {
        this.contShown = n;
        this.showContinue(n);
      }
    }

    const playing = this.state === 'play';
    // the moving background steps back when the screen fills with bullets
    this.parallax.props.calmTarget = Math.max(0, Math.min(1, (this.bullets.pool.live.length - 10) / 30));
    this.parallax.update(dt, !['title', 'city', 'book', 'select'].includes(this.state), this.H);
    this.journey?.update(dt);
    this.select?.update(dt);
    if (playing) {
      this.t += dt;
      this.waves.update(this.t, (w) => this.enemies.spawn(w));
      this.interlude?.update(dt, this.t);
      for (const type of ['heavy', 'boss']) {
        const w = this.waves.upcoming(type, this.t, 3);
        if (w && !this.warned.has(w)) {
          this.warned.add(w);
          // the boss card: its name sliding across the screen, an alarm, a shout
          if (w.card) this.hud.card(w.card[0], w.card[1]);
          else this.hud.show('UWAGA!', w.warning ?? this.stage.warnings?.[type] ?? 'CIĘŻKI CEL', 2.6, true);
          this.sfx.warning();
          this.sfx.shout(1.1);
        }
      }
      this.music.play(this.stageSong());
      this.parallax.snow = this.weather();
    }
    if (this.bombClear > 0) {
      this.bombClear -= dt;
      this.bullets.cancelAll(null);
    }

    if (this.state === 'map') this.map.update(dt);
    if (this.state === 'ending') this.ending.update(dt);
    if (playing) this.run.time += dt;
    if (this.state === 'clear') {
      this.clearT += dt;
      if (this.clearT > 0.8 && this.player.alive && this.player.y > -40) this.player.y -= Math.min(220, (this.clearT - 0.8) * 260) * dt;
      const land = this.stampLand;
      if (land && land.img.active) {
        land.t += dt;
        const k = Math.max(0, Math.min(1, land.t / 0.22));
        land.img.setScale(2.6 - 1.6 * k * k).setAlpha(land.t < 0 ? 0 : land.ink * Math.min(1, k * 2));
        if (k >= 1 && !land.done) {
          land.done = true;
          this.sfx.stamp();
          this.cameras.main.shake(140, 0.006);
        }
      }
    }
    // Beppu: steam clouds heat the guns
    if (playing && this.stage.near === 'steam') this.player.heatUpdate(dt, this.player.alive && this.enemies.steamAt(this.player.x, this.player.y));
    this.player.update(dt, playing ? this.keys : null, playing && !this.ceasefire);
    this.enemies.update(dt);
    this.shadows?.update(this.H);
    this.bullets.update(dt, this.H);
    this.updatePickups(dt);
    this.foodTrail.update(dt);
    this.fx.update(dt, this.parallax);
    if (playing) this.scenicView?.update(dt);
    if (playing) this.collide();
    if (this.hitboxes) this.drawHitboxes();

    if (playing && this.stage.boss) {
      if (this.bossDown && (this.scenicView ? this.scenicView.done : (this.bossClearT -= dt) <= 0)) this.stageClear();
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
    if (this.bossDown && m.night) return m.night;
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
        if (e.dead || e.hp <= 0 || e.ghost || e.pass || e.y < -e.radius + 2 || e === s.hitE) continue;
        const r = e.radius + s.radius;
        const dx = e.x - s.x;
        const dy = e.y - s.y;
        // (shotSegs: circles only shots hit, each taking `take` of the damage: the dragon's body)
        const part = dx * dx + dy * dy < r * r || this.hitSegs(e.segs, s.x, s.y, s.radius, 1) ? 1 : this.hitShotSegs(e.shotSegs, s.x, s.y, s.radius);
        if (part) {
          this.enemies.damage(e, s.damage * part, false, s.bean);
          if (s.bean) this.fx.beanPop(s.x, s.y - 2);
          else if (Math.random() < 0.5) this.fx.spark(s.x, s.y - 2);
          if (s.pierce > 0 && (e.type === 'popcorn' || e.type === 'diver')) {
            // the laser burns on through small fry, weaker
            s.pierce--;
            s.hitE = e;
            s.damage *= WEAPONS.laser.pierceKeep;
          } else p.shots.kill(s);
          break;
        }
      }
    }

    if (!p.alive) return;

    // pickups
    const pr2 = (p.ship.pickup ?? PLAYER.pickupRadius) ** 2;
    for (const k of this.pickups.live) {
      if ((k.x - p.x) ** 2 + (k.y - p.y) ** 2 < pr2) {
        this.pickups.kill(k);
        p.collect(k.color);
      }
    }

    if (p.entering > 0) return;
    const vulnerable = p.invulnerable <= 0 && !p.god;
    const hr = p.ship.hit ?? PLAYER.hitRadius;
    const gr = p.ship.graze ?? GRAZE.radius;
    for (const b of this.bullets.pool.live) {
      if (b.safe > 0 || b.dead) continue; // icicles blinking before they fall
      const r = b.radius + hr;
      const d2 = (b.x - p.x) ** 2 + (b.y - p.y) ** 2;
      if (vulnerable && d2 < r * r) {
        this.bullets.pool.kill(b);
        p.hit();
        return;
      }
      // grazing: close enough to feel the heat (not while blinking after a respawn)
      if (!b.grazed && p.invulnerable <= 0 && d2 < (r + gr) ** 2) {
        b.grazed = true;
        p.graze(b);
      }
    }
    if (!vulnerable) {
      // Oni, invulnerable (just back, or bombing): rams small fry to bits
      if (p.ship.ram) {
        for (const e of enemies) {
          if (e.dead || e.ghost || e.ground || (e.type !== 'popcorn' && e.type !== 'diver')) continue;
          const r = e.radius * 0.7 + 4;
          if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < r * r) this.enemies.damage(e, 999);
        }
      }
      return;
    }
    // lightning and steam columns, the arcs between Raijū's orbs
    if (this.bullets.hazardAt(p.x, p.y, hr)) {
      p.hit();
      return;
    }
    for (const e of enemies) {
      if (e.ground || e.dead || e.ghost || e.harmless || e.loot) continue;
      // a macaque reaches out further: it grabs rather than rams
      const r = (e.thief ? e.radius + 3 : e.radius * 0.7) + hr;
      const touch = (e.x - p.x) ** 2 + (e.y - p.y) ** 2 < r * r || this.hitSegs(e.segs, p.x, p.y, hr, 0.8);
      if (touch) {
        const loot = e.thief && p.steal();
        if (loot) {
          this.enemies.thieve(e, loot);
          return;
        }
        p.hit();
        // ramming kills small fry, not bosses or the puppeteers
        if (e.type !== 'heavy' && e.type !== 'boss' && e.type !== 'kuroko') this.enemies.damage(e, 999);
        return;
      }
    }
  }

  /** ?hitbox: the circles collide() tests, drawn over the sprites they belong to (only watches, changes nothing). */
  drawHitboxes() {
    const g = this.hitboxes.clear();
    const w = 1 / RENDER_SCALE; // one buffer pixel wide
    for (const e of this.enemies.live) {
      if (e.dead) continue;
      g.lineStyle(w, 0x40ff60, e.ghost || e.pass ? 0.35 : 0.9).strokeCircle(e.x, e.y, e.radius);
      if (!e.ground && !e.harmless) g.lineStyle(w, 0xff4040, 0.8).strokeCircle(e.x, e.y, e.thief ? e.radius + 3 : e.radius * 0.7);
      if (e.segs) for (const sg of e.segs) g.lineStyle(w, 0x40c0ff, 0.9).strokeCircle(sg.x, sg.y, sg.r);
      if (e.shotSegs) for (const sg of e.shotSegs) g.lineStyle(w, 0x40ff60, 0.5).strokeCircle(sg.x, sg.y, sg.r); // (shots only)
    }
    // enemy bullets (magenta) and the player's shots (yellow)
    for (const b of this.bullets.pool.live) if (!b.dead) g.lineStyle(w, 0xff40ff, 0.9).strokeCircle(b.x, b.y, b.radius);
    for (const sh of this.player.shots.live) if (!sh.dead) g.lineStyle(w, 0xffe040, 0.8).strokeCircle(sh.x, sh.y, sh.radius);
    const p = this.player;
    g.lineStyle(w, 0xffffff, 0.9).strokeCircle(p.x, p.y, p.ship.hit ?? PLAYER.hitRadius);
  }

  /** The share of a hit the first shot-only circle under (x, y) takes, or 0. */
  hitShotSegs(segs, x, y, r) {
    if (!segs) return 0;
    for (const sg of segs) if ((sg.x - x) ** 2 + (sg.y - y) ** 2 < (sg.r + r) ** 2) return sg.take;
    return 0;
  }

  hitSegs(segs, x, y, r, scale) {
    if (!segs) return false;
    for (const sg of segs) {
      const sr = sg.r * scale + r;
      const dx = sg.x - x;
      const dy = sg.y - y;
      if (dx * dx + dy * dy < sr * sr) return true;
    }
    return false;
  }
}
