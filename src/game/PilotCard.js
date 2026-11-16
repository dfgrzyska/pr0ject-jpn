import { DEPTH, RENDER_SCALE, VIEW } from '../config.js';
import { ITEM, ITEMS, RARITIES, RARITY, DECAL_SLOTS } from '../data/gacha.js';
import { pixelText } from './Hud.js';
import { tr } from '../i18n.js';
import { flameLook } from './shipSkin.js';
import { fxTint } from './premiumFx.js';
import { sharedArt } from './enemyArt.js';

// The pilot's card, out of the hangar: the ship as it is fitted, big, with its companion; the pilot's title; how
// much of the gachapon is theirs, rarity by rarity; what they wear. A page to look at (and to keep a picture of):
// a tap or a key puts it away.
const FINE = 1 / RENDER_SCALE;
const W = VIEW.width;
const PAPER = 0x141c38; // (night blue: the game's font has a dark edge, lost on a pale card)
const INK = 0xf4ead2;
const RED = 0xb83a1a;

export class PilotCard {
  constructor(scene, loadout, ship) {
    this.scene = scene;
    this.t = 0;
    this.ship = ship;
    this.items = [];
    const d = DEPTH.overlay + 4;
    const add = (o, depth = d + 1) => {
      this.items.push(o);
      return o.setDepth(depth);
    };
    const H = scene.H;
    const top = Math.max(8, Math.round((H - 300) / 2));
    this.top = top;
    add(scene.add.rectangle(0, 0, W, VIEW.maxHeight, 0x05060e, 0.92).setOrigin(0), d);
    const g = add(scene.add.graphics(), d + 0.5);
    // the card: cream paper, a red border and a thin one inside it, a red band for the title
    g.fillStyle(RED).fillRect(8, top, W - 16, 300);
    g.fillStyle(PAPER).fillRect(11, top + 3, W - 22, 294);
    g.lineStyle(1, 0x33416a).strokeRect(14.5, top + 6.5, W - 29, 287);
    g.fillStyle(RED).fillRect(11, top + 3, W - 22, 20);
    add(pixelText(scene, W / 2, top + 13, ship.look?.title ?? 'PILOT').setTint(0xfff4e0));
    // the ship's window: night blue, the ship in it three times its size, its companion beside it
    g.fillStyle(0x0c1430).fillRect(22, top + 30, W - 44, 92);
    g.lineStyle(1, ship.color).strokeRect(22.5, top + 30.5, W - 45, 91);
    // (a dragon: twice its size, higher up, its body coiling down the window under its head)
    const body = ship.anim?.segs;
    this.k = body ? 2 : 3;
    this.shipY = body ? top + 48 : top + 70;
    this.art = add(sharedArt(scene.add.image(W / 2, this.shipY, 'sprites', 'ship')).setFrame(ship.frame).setScale(this.k), d + 1.1);
    this.segs = Array.from({ length: body?.n ?? 0 }, (_, i) => add(sharedArt(scene.add.image(W / 2, 0, 'sprites', 'ship')).setFrame(`${ship.frame}_${i === body.n - 1 ? 'tail' : 'seg'}`).setScale(this.k * (1 - i * 0.045)), d + 1.05 - i * 0.001));
    this.flame = add(sharedArt(scene.add.sprite(W / 2, 0, 'sprites', 'flame_0')).setOrigin(0.5, 0).setScale(this.k).play('flame'), d + 1);
    this.flameLong = flameLook(this.flame, ship);
    if (ship.anim?.segs) this.flame.setVisible(false);
    if (ship.look?.pal) this.pal = add(scene.add.image(W / 2 + 46, 0, 'gacha', ship.look.pal).setScale(FINE * 2), d + 1.1);
    add(pixelText(scene, W / 2, top + 132, ship.name).setTint(INK));
    // the collection: all of it, then rarity by rarity (a bar and a count each)
    const have = new Set(loadout.owned);
    const bar = (y, label, own, all, col) => {
      add(pixelText(scene, 24, y, label, 0).setOrigin(0, 0.5).setTint(col));
      add(pixelText(scene, W - 24, y, `${own}/${all}`, 1).setOrigin(1, 0.5).setTint(INK));
      g.fillStyle(0x2a3458).fillRect(24, y + 6, W - 48, 3);
      g.fillStyle(col).fillRect(24, y + 6, Math.round((W - 48) * (all ? own / all : 0)), 3);
    };
    bar(top + 150, 'KOLEKCJA', loadout.owned.length, ITEMS.length, 0xffd040);
    RARITIES.forEach((r, i) => {
      const of = ITEMS.filter((it) => it.rarity === r);
      bar(top + 168 + i * 15, RARITY[r].name, of.filter((it) => have.has(it.id)).length, of.length, RARITY[r].color);
    });
    // what is worn, as pictures: the stickers, the seal, the marker, the icon of a life
    const worn = [...DECAL_SLOTS, 'seal', 'marker', 'life_icon', 'companion'].map((k) => ITEM[loadout.look[k]]?.pic).filter(Boolean);
    worn.slice(0, 7).forEach((pic, i, all) => {
      const o = add(scene.add.image(W / 2 + (i - (all.length - 1) / 2) * 19, top + 254, 'gacha', pic));
      o.setScale(Math.min(15 / Math.max(o.width, o.height), 1));
    });
    add(pixelText(scene, 24, top + 276, `${tr('LOSOWAŃ')}: ${loadout.pulls}`, 0).setOrigin(0, 0.5).setTint(INK));
    add(pixelText(scene, W - 24, top + 276, `${tr('KUPONY')}: ${loadout.tickets}`, 1).setOrigin(1, 0.5).setTint(INK));
    this.hint = add(pixelText(scene, W / 2, top + 289, scene.sys.game.device.input.touch ? 'DOTKNIJ - WRÓĆ' : 'ENTER / ESC - WRÓĆ').setTint(0x9aaec2));
    this.update(0);
  }

  update(dt) {
    this.t += dt;
    const ship = this.ship;
    const an = ship.anim;
    // (a hull that moves does so here too; an animated paint flows over it)
    if (an) {
      const cycle = an.cycle ?? (an.n === 2 ? [0, 1] : [0, 1, 2, 1]);
      const b = cycle[Math.floor(this.t * (an.rate ?? 4)) % cycle.length];
      const frame = b ? `${ship.frame}_f${b}` : ship.frame;
      if (this.art.frame.name !== frame) this.art.setFrame(frame);
    }
    this.art.y = this.shipY + Math.round(Math.sin(this.t * 2.4) * 2);
    this.flame.y = this.art.y + ship.flameY * this.k;
    this.flame.setScale(this.k, this.k * (this.flameLong ?? 1));
    // (the dragon's body: an S down the window, flowing; each segment turned along it)
    let px = this.art.x;
    let py = this.art.y + 4;
    this.segs.forEach((g, i) => {
      const s = (i + 1) * 12.5;
      const x = W / 2 + Math.sin(s / 21 - this.t * 2.2) * 24 * Math.min(1, s / 30);
      const y = this.art.y + 8 + s * 0.62;
      g.setPosition(x, y).setRotation(Math.atan2(py - y, px - x) + Math.PI / 2);
      if (ship.look?.paintFx) g.setTint(fxTint(ship.look.paintFx, this.t));
      px = x;
      py = y;
    });
    if (ship.look?.paintFx) this.art.setTint(fxTint(ship.look.paintFx, this.t));
    this.pal?.setY(this.shipY + 26 + Math.sin(this.t * 4) * 2);
  }

  destroy() {
    for (const o of this.items) o.destroy();
  }
}
