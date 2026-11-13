import { DEPTH, PLAYER, VIEW } from '../config.js';
import { YOKAI, FOODS, createDiscoveryStore } from '../data/discoveries.js';
import { STAGES } from '../data/stages.js';
import { getLang } from '../i18n.js';
import { pixelText } from './Hud.js';
import { INK_FONT } from '../scenes/Boot.js';
import { portrait, sharedArt } from './enemyArt.js';

let storage;
try { storage = globalThis.localStorage; } catch { /* private mode */ }
export const discoveries = createDiscoveryStore(storage);
const en = () => getLang() === 'en';
const words = (pl, english) => en() ? english : pl;

export function wrapJournal(text, width = 25) {
  const lines = [''];
  for (const word of text.toUpperCase().split(/\s+/)) {
    const i = lines.length - 1;
    if (lines[i] && lines[i].length + word.length + 1 > width) lines.push(word);
    else lines[i] += (lines[i] ? ' ' : '') + word;
  }
  return lines.join('\n');
}

/** One reusable notice, with a short queue so simultaneous kills never overwrite discoveries. */
export class DiscoveryNotice {
  constructor(scene) {
    this.scene = scene;
    this.queue = [];
    this.time = 0;
    this.band = scene.add.rectangle(90, 49, 174, 27, 0x0b0a12, 0.85).setDepth(DEPTH.hud + 1).setVisible(false);
    this.label = pixelText(scene, 90, 43, '').setDepth(DEPTH.hud + 2).setTint(0xffe080).setVisible(false);
    this.name = pixelText(scene, 90, 56, '').setDepth(DEPTH.hud + 2).setVisible(false);
  }
  add(entry, food = false) { this.queue.push({ entry, food }); }
  update(dt) {
    const s = this.scene;
    const visible = s.state === 'play' && !s.paused && s.hud.cardT <= 0 && s.hud.sealT <= 0 && s.hud.bannerT <= 0;
    if (visible) {
      this.time = Math.max(0, this.time - dt);
      if (!this.time && this.queue.length) {
        const { entry, food } = this.queue.shift();
        this.label.setText(food ? words('ZEBRANO PRZYSMAK!', 'LOCAL DISH COLLECTED!') : words('POKONANO · NOWY WPIS', 'DEFEATED · NEW ENTRY'));
        this.name.setText(entry.name);
        this.time = 2.8;
      }
    }
    for (const o of [this.band, this.label, this.name]) o.setVisible(visible && this.time > 0);
  }
}

/** Fixed local food stops; each can release exactly once during this stage attempt. */
export class FoodTrail {
  constructor(scene) {
    this.scene = scene;
    this.stops = FOODS.filter((f) => f.stage === scene.stage.id).map((entry) => ({
      entry, state: 'waiting', age: 0,
      sprite: sharedArt(scene.add.image(0, 0, 'sprites', entry.frame)).setDepth(DEPTH.pickup).setVisible(false),
    }));
    this.halo = scene.add.graphics().setDepth(DEPTH.pickup - 0.01);
  }
  update(dt) {
    const s = this.scene;
    if (s.paused) return;
    const g = this.halo.clear();
    if (s.state !== 'play') {
      for (const stop of this.stops) stop.sprite.setVisible(false);
      return;
    }
    for (const stop of this.stops) {
      const { entry, sprite } = stop;
      const y = s.parallax.screenY(entry.u);
      if (stop.state === 'waiting' && y >= 36) {
        stop.state = y > s.H - 20 ? 'missed' : 'falling';
        sprite.setPosition(entry.x, y).setVisible(stop.state === 'falling');
      }
      if (stop.state !== 'falling') continue;
      sprite.setVisible(true); // an easy-mode continue can return from the game-over screen
      stop.age += dt;
      sprite.y += 34 * dt; // (a quarter faster than the old 27 px/s: gone sooner)
      // A gentle inward drift gives a food stand at the bank a reachable pickup.
      sprite.x = entry.x + Math.sin(stop.age * 2) * 3 + (90 - entry.x) * Math.min(1, stop.age / 8) * 0.45;
      g.lineStyle(1, 0xffdf80, 0.65 + Math.sin(stop.age * 5) * 0.25).strokeCircle(sprite.x, sprite.y, 11);
      g.fillStyle(0xffdf80, 0.9).fillRect(Math.round(sprite.x) - 1, Math.round(sprite.y) - 16, 2, 3);
      const p = s.player;
      if (p.alive && Math.hypot(p.x - sprite.x, p.y - sprite.y) < PLAYER.pickupRadius + 4) {
        stop.state = 'collected';
        sprite.setVisible(false);
        const fresh = discoveries.discover(entry.id);
        if (fresh) s.discoveryNotice.add(entry, true);
        const points = (fresh ? 1000 : 250) * s.score.mult;
        s.score.add(points);
        s.fx.text(sprite.x, sprite.y - 14, `+${points}`, 1.2, 0xffe080);
        s.sfx.pickup();
      } else if (sprite.y > s.H + 16) {
        stop.state = 'missed';
        sprite.setVisible(false);
      }
    }
  }
}

/**
 * The illustrated journal: first a grid of 4 x 4 tiles (a question mark where nothing is found yet, more pages of
 * the grid when there are more than 16 entries), then the chosen entry's own page; locked pages keep a location
 * hint but hide the story.
 */
const GRID = 4;
const PER_PAGE = GRID * GRID;
const TILE = 36;
const PITCH = 38;

export class DiscoveryBook {
  constructor(scene, kind) {
    this.scene = scene;
    this.kind = kind;
    this.entries = kind === 'food' ? FOODS : YOKAI;
    this.index = 0;
    this.mode = 'grid';
    this.items = [];
    const d = DEPTH.overlay + 4;
    const add = (o, z = d + 2) => { this.items.push(o); return o.setDepth(z); };
    this.shade = add(scene.add.rectangle(0, 0, VIEW.width, VIEW.maxHeight, 0x0b0a12, 0.95).setOrigin(0), d);
    this.sheet = add(scene.add.tileSprite(5, 6, 170, 100, 'menu_washi').setOrigin(0).setTileScale(1 / 3, 1 / 3), d + 1);
    this.paper = add(scene.add.graphics(), d + 1);
    const print = (color = 0x392d28) => add(pixelText(scene, 90, 0, '', 0.5, INK_FONT).setTint(color));
    this.title = print(0xa8321a);
    this.count = print();
    // the grid
    this.tiles = Array.from({ length: PER_PAGE }, () => ({
      art: add(scene.add.image(0, 0, 'sprites', this.entries[0].frame)),
      mark: print(0xa8321a).setText('?').setScale(2),
    }));
    this.gridName = print(0xa8321a);
    this.gridCity = print(0x76624d);
    this.open = print(0x76624d);
    // the entry's page
    this.art = add(scene.add.image(90, 104, 'sprites', this.entries[0].frame));
    this.secret = print(0xa8321a).setText('?').setScale(3);
    this.name = print(0xa8321a);
    this.city = print(0x76624d);
    this.story = print().setOrigin(0, 0).setLineSpacing(1);
    this.hint = print(0x76624d).setOrigin(0, 0).setLineSpacing(1);
    this.page = print();
    this.prev = print(0xa8321a).setText('<');
    this.next = print(0xa8321a).setText('>');
    this.back = add(pixelText(scene, 90, 0, '').setTint(0xffe080));
    this.layout(scene.H);
  }

  get pages() {
    return Math.ceil(this.entries.length / PER_PAGE);
  }

  tileXY(slot) {
    return { x: 90 + ((slot % GRID) - (GRID - 1) / 2) * PITCH, y: 72 + Math.floor(slot / GRID) * PITCH };
  }

  /** Keys: left / right / up / down, confirm, back. Returns 'close' when the journal should shut. */
  key(k) {
    if (this.mode === 'page') {
      if (k === 'left') return this.turn(-1);
      if (k === 'right') return this.turn(1);
      if (k === 'confirm' || k === 'back') return this.show('grid');
      return true;
    }
    const n = this.entries.length;
    const col = this.index % GRID;
    // (left and right wrap round the row; up and down run on to the next page of the grid, and round)
    if (k === 'left') this.focus(col === 0 ? Math.min(this.index - 1 + GRID, n - 1) : this.index - 1);
    else if (k === 'right') this.focus(col === GRID - 1 || this.index === n - 1 ? this.index - col : this.index + 1);
    else if (k === 'up') this.focus(this.index - GRID < 0 ? col + GRID * Math.floor((n - 1 - col) / GRID) : this.index - GRID);
    else if (k === 'down') this.focus(this.index + GRID >= n ? col : this.index + GRID);
    else if (k === 'confirm') this.show('page');
    else if (k === 'back') return 'close';
    return true;
  }

  /** Move the grid's focus (wrapping within the entries; across a page when it runs off one). */
  focus(i) {
    const n = this.entries.length;
    this.index = ((i % n) + n) % n;
    this.scene.sfx.tick?.();
    this.layout(this.H);
    return true;
  }

  show(mode) {
    this.mode = mode;
    this.scene.sfx.tick?.();
    this.layout(this.H);
    return true;
  }

  turn(dir) {
    this.index = (this.index + dir + this.entries.length) % this.entries.length;
    this.scene.sfx.tick?.();
    this.layout(this.H);
    return true;
  }

  pointer(p) {
    if (p.y >= this.H - 28) {
      if (this.mode === 'page') return this.show('grid');
      return this.scene.closeBook();
    }
    if (this.mode === 'page') {
      if (p.y >= this.H - 63) {
        if (p.x < 65) this.turn(-1);
        else if (p.x > 115) this.turn(1);
      }
      return true;
    }
    if (this.pages > 1 && p.y >= this.H - 54) {
      const page = Math.floor(this.index / PER_PAGE);
      if (p.x < 65) return this.focus(((page + this.pages - 1) % this.pages) * PER_PAGE);
      if (p.x > 115) return this.focus(((page + 1) % this.pages) * PER_PAGE);
    }
    const first = Math.floor(this.index / PER_PAGE) * PER_PAGE;
    for (let slot = 0; slot < PER_PAGE && first + slot < this.entries.length; slot++) {
      const { x, y } = this.tileXY(slot);
      if (Math.abs(p.x - x) <= TILE / 2 && Math.abs(p.y - y) <= TILE / 2) {
        if (first + slot === this.index) return this.show('page');
        return this.focus(first + slot);
      }
    }
    return true;
  }

  layout(H) {
    this.H = H;
    const grid = this.mode === 'grid';
    const food = this.kind === 'food';
    const g = this.paper.clear();
    this.sheet.setSize(170, H - 36);
    g.lineStyle(1, 0xa8321a).strokeRect(9, 10, 162, H - 44);
    this.title.setText(food ? words('SMAKI JAPONII', 'TASTES OF JAPAN') : words('ALBUM YOKAI', 'YOKAI ALBUM')).setPosition(90, 24);
    this.count.setText(`${this.entries.filter((entry) => discoveries.has(entry.id)).length} / ${this.entries.length}`).setPosition(90, 39);
    for (const o of [this.art, this.secret, this.name, this.city, this.story, this.hint]) o.setVisible(!grid);
    for (const o of [this.gridName, this.gridCity, this.open]) o.setVisible(grid);
    for (const t of this.tiles) {
      t.art.setVisible(false);
      t.mark.setVisible(false);
    }
    const e = this.entries[this.index];
    const known = discoveries.has(e.id);
    const city = STAGES.find((s) => s.id === e.stage);
    if (grid) this.layoutGrid(H, g);
    else this.layoutPage(H, g, e, known, city, food);
    if (grid) {
      this.gridName.setText(known ? e.name : '???').setPosition(90, 72 + GRID * PITCH - 6);
      this.gridCity.setText(`${city.name}${food ? ` / ${e.place}` : ''}`).setPosition(90, 72 + GRID * PITCH + 8);
      if (this.gridCity.width > 152) this.gridCity.setText(city.name);
      this.open.setText(words('ENTER: OTWÓRZ', 'ENTER: OPEN')).setPosition(90, H - 63);
      const pages = this.pages;
      const page = Math.floor(this.index / PER_PAGE);
      this.page.setText(`${page + 1} / ${pages}`).setPosition(90, H - 44).setVisible(pages > 1);
      this.prev.setPosition(30, H - 44).setVisible(pages > 1);
      this.next.setPosition(150, H - 44).setVisible(pages > 1);
      this.back.setText(words('WRÓĆ / ESC', 'BACK / ESC'));
    } else {
      this.page.setText(`${this.index + 1} / ${this.entries.length}`).setPosition(90, H - 44).setVisible(true);
      this.prev.setPosition(30, H - 44).setVisible(true);
      this.next.setPosition(150, H - 44).setVisible(true);
      this.back.setText(words('DO SIATKI / ESC', 'TO THE GRID / ESC'));
    }
    this.back.setPosition(90, H - 13);
  }

  layoutGrid(H, g) {
    const first = Math.floor(this.index / PER_PAGE) * PER_PAGE;
    for (let slot = 0; slot < PER_PAGE; slot++) {
      const e = this.entries[first + slot];
      const { x, y } = this.tileXY(slot);
      if (!e) continue;
      const known = discoveries.has(e.id);
      const focused = first + slot === this.index;
      g.fillStyle(known ? 0xf4ead2 : 0xe2d6b8, 0.85).fillRect(x - TILE / 2, y - TILE / 2, TILE, TILE);
      g.lineStyle(1, focused ? 0xa8321a : 0xbba782).strokeRect(x - TILE / 2, y - TILE / 2, TILE, TILE);
      if (focused) g.lineStyle(1, 0xa8321a).strokeRect(x - TILE / 2 + 2, y - TILE / 2 + 2, TILE - 4, TILE - 4);
      const t = this.tiles[slot];
      if (known) {
        const base = portrait(this.scene, t.art, e.frame);
        t.art.setScale(base);
        const fit = Math.min((TILE - 6) / (t.art.width * base), (TILE - 6) / (t.art.height * base));
        t.art.setScale(base * (fit < 1 ? fit : Math.min(2, Math.floor(fit)))).setPosition(x, y).setVisible(true);
      } else t.mark.setPosition(x, y).setVisible(true);
    }
  }

  layoutPage(H, g, e, known, city, food) {
    g.lineStyle(1, 0xbba782).strokeRect(51, 55, 78, 63);
    // (a yōkai's portrait drawn at 540 px when there is one: fitted in logical pixels, then shown at its own scale)
    const base = portrait(this.scene, this.art, e.frame);
    this.art.setPosition(90, 87).setVisible(known).setScale(base);
    const fit = Math.min(70 / (this.art.width * base), 55 / (this.art.height * base));
    this.art.setScale(base * (fit < 1 ? fit : Math.min(3, Math.floor(fit))));
    this.secret.setPosition(90, 87).setVisible(!known);
    this.name.setText(known ? e.name : '???').setPosition(90, 128);
    this.city.setText(`${city.name}${food ? ` / ${e.place}` : ''}`).setPosition(90, 143);
    // Long location names get their own wrapped hint below; the city header stays compact.
    if (this.city.width > 152) this.city.setText(city.name);
    const target = e.type === 'boss' ? words('BOSSA', 'THE BOSS') : e.type === 'heavy' ? words('MINIBOSSA', 'THE MINIBOSS')
      : e.id === 'kitsune' ? words('DRONA Z LISIĄ MASKĄ', 'A FOX-MASK DRONE') : e.id === 'chochin' ? words('CZERWONY LAMPION', 'A RED LANTERN')
        : e.id === 'kappa' ? words('WODNĄ KAPPĘ', 'A WATER KAPPA') : words('KOCIĄ WIEŻYCZKĘ', 'A CAT TURRET');
    const copy = known ? (en() ? e.en : e.pl) : food
      ? words(`Szukaj złotej ikonki jedzenia w okolicy: ${e.place}. Zbierz ją statkiem.`, `Look for a golden food icon near ${e.place}. Collect it with your ship.`)
      : words(`Pokonaj ${target} w tym mieście, aby odkryć ilustrację i opowieść.`, `Defeat ${target} in this city to reveal the illustration and story.`);
    this.story.setText(wrapJournal(copy)).setPosition(15, 158);
    const category = e.category?.split(' / ');
    this.hint.setText(known ? (food ? words('ZAPISANO W DZIENNIKU', 'SAVED IN YOUR JOURNAL') : category[en() ? 1 : 0] ?? category[0]) : words('JESZCZE NIEODKRYTE', 'NOT DISCOVERED YET')).setPosition(15, H - 63);
  }

  destroy() { for (const o of this.items) o.destroy(); }
}
