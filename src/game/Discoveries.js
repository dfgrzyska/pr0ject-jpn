import { DEPTH, PLAYER, VIEW } from '../config.js';
import { YOKAI, FOODS, createDiscoveryStore } from '../data/discoveries.js';
import { STAGES } from '../data/stages.js';
import { getLang } from '../i18n.js';
import { pixelText } from './Hud.js';
import { INK_FONT } from '../scenes/Boot.js';
import { portrait } from './enemyArt.js';

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
      sprite: scene.add.image(0, 0, 'sprites', entry.frame).setDepth(DEPTH.pickup).setVisible(false),
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
      sprite.y += 27 * dt;
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

/** Illustrated, paged journal. Locked pages retain a location hint, but conceal the story. */
export class DiscoveryBook {
  constructor(scene, kind) {
    this.scene = scene;
    this.kind = kind;
    this.entries = kind === 'food' ? FOODS : YOKAI;
    this.index = 0;
    this.items = [];
    const d = DEPTH.overlay + 4;
    const add = (o, z = d + 2) => { this.items.push(o); return o.setDepth(z); };
    this.shade = add(scene.add.rectangle(0, 0, VIEW.width, VIEW.maxHeight, 0x0b0a12, 0.95).setOrigin(0), d);
    this.sheet = add(scene.add.tileSprite(5, 6, 170, 100, 'menu_washi').setOrigin(0).setTileScale(1 / 3, 1 / 3), d + 1);
    this.paper = add(scene.add.graphics(), d + 1);
    const print = (color = 0x392d28) => add(pixelText(scene, 90, 0, '', 0.5, INK_FONT).setTint(color));
    this.title = print(0xa8321a);
    this.count = print();
    this.art = add(scene.add.image(90, 104, 'sprites', this.entries[0].frame));
    this.secret = print(0xa8321a).setText('?').setScale(3);
    this.name = print(0xa8321a);
    this.city = print(0x76624d);
    this.story = print().setOrigin(0, 0).setLineSpacing(1);
    this.hint = print(0x76624d).setOrigin(0, 0).setLineSpacing(1);
    this.page = print();
    this.prev = print(0xa8321a).setText('<');
    this.next = print(0xa8321a).setText('>');
    this.back = add(pixelText(scene, 90, 0, words('WRÓĆ / ESC', 'BACK / ESC')).setTint(0xffe080));
    this.layout(scene.H);
  }
  turn(dir) {
    this.index = (this.index + dir + this.entries.length) % this.entries.length;
    this.scene.sfx.tick?.();
    this.layout(this.H);
    return true;
  }
  pointer(p) {
    if (p.y >= this.H - 28) this.scene.closeBook();
    else if (p.y >= this.H - 63) {
      if (p.x < 65) this.turn(-1);
      else if (p.x > 115) this.turn(1);
    }
  }
  layout(H) {
    this.H = H;
    const e = this.entries[this.index];
    const known = discoveries.has(e.id);
    const city = STAGES.find((s) => s.id === e.stage);
    const food = this.kind === 'food';
    const g = this.paper.clear();
    this.sheet.setSize(170, H - 36);
    g.lineStyle(1, 0xa8321a).strokeRect(9, 10, 162, H - 44);
    g.lineStyle(1, 0xbba782).strokeRect(51, 55, 78, 63);
    this.title.setText(food ? words('SMAKI JAPONII', 'TASTES OF JAPAN') : words('ALBUM YOKAI', 'YOKAI ALBUM')).setPosition(90, 24);
    this.count.setText(`${this.entries.filter((entry) => discoveries.has(entry.id)).length} / ${this.entries.length}`).setPosition(90, 43);
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
    this.page.setText(`${this.index + 1} / ${this.entries.length}`).setPosition(90, H - 44);
    this.prev.setPosition(30, H - 44);
    this.next.setPosition(150, H - 44);
    this.back.setPosition(90, H - 13);
  }
  destroy() { for (const o of this.items) o.destroy(); }
}
