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
const PAPER = 0xf4ead2;
const INK = 0x2a2030;
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
    g.lineStyle(1, 0xd8c8a0).strokeRect(14.5, top + 6.5, W - 29, 287);
    g.fillStyle(RED).fillRect(11, top + 3, W - 22, 20);
    add(pixelText(scene, W / 2, top + 13, ship.look?.title ?? 'PILOT').setTint(0xfff4e0));
    // the ship's window: night blue, the ship in it three times its size, its companion beside it
    g.fillStyle(0x0c1430).fillRect(22, top + 30, W - 44, 92);
    g.lineStyle(1, ship.color).strokeRect(22.5, top + 30.5, W - 45, 91);
    this.shipY = top + 70;
    this.art = add(sharedArt(scene.add.image(W / 2, this.shipY, 'sprites', 'ship')).setFrame(ship.frame).setScale(3), d + 1.1);
    this.flame = add(sharedArt(scene.add.sprite(W / 2, 0, 'sprites', 'flame_0')).setOrigin(0.5, 0).setScale(3).play('flame'), d + 1);
    this.flameLong = flameLook(this.flame, ship);
    if (ship.anim?.segs) this.flame.setVisible(false);
    if (ship.look?.pal) this.pal = add(scene.add.image(W / 2 + 46, 0, 'gacha', ship.look.pal).setScale(FINE * 2), d + 1.1);
    add(pixelText(scene, W / 2, top + 132, ship.name).setTint(INK));
    // the collection: all of it, then rarity by rarity (a bar and a count each)
    const have = new Set(loadout.owned);
    const bar = (y, label, own, all, col) => {
      add(pixelText(scene, 24, y, label, 0).setOrigin(0, 0.5).setTint(INK));
      add(pixelText(scene, W - 24, y, `${own}/${all}`, 1).setOrigin(1, 0.5).setTint(INK));
      g.fillStyle(0xd8c8a0).fillRect(24, y + 6, W - 48, 3);
      g.fillStyle(col).fillRect(24, y + 6, Math.round((W - 48) * (all ? own / all : 0)), 3);
      g.lineStyle(1, INK, 0.35).strokeRect(23.5, y + 5.5, W - 47, 4);
    };
    bar(top + 150, 'KOLEKCJA', loadout.owned.length, ITEMS.length, RED);
    RARITIES.forEach((r, i) => {
      const of = ITEMS.filter((it) => it.rarity === r);
      bar(top + 168 + i * 15, RARITY[r].name, of.filter((it) => have.has(it.id)).length, of.length, [0x8e96b0, 0x3a82f0, 0xa050f0, 0xe0a020, 0xf05a9a][i]);
    });
    // what is worn, as pictures: the stickers, the seal, the marker, the icon of a life
    const worn = [...DECAL_SLOTS, 'seal', 'marker', 'life_icon', 'companion'].map((k) => ITEM[loadout.look[k]]?.pic).filter(Boolean);
    worn.slice(0, 7).forEach((pic, i, all) => {
      const o = add(scene.add.image(W / 2 + (i - (all.length - 1) / 2) * 19, top + 254, 'gacha', pic));
      o.setScale(Math.min(15 / Math.max(o.width, o.height), 1));
    });
    add(pixelText(scene, 24, top + 276, `${tr('LOSOWAŃ')}: ${loadout.pulls}`, 0).setOrigin(0, 0.5).setTint(INK));
    add(pixelText(scene, W - 24, top + 276, `${tr('KUPONY')}: ${loadout.tickets}`, 1).setOrigin(1, 0.5).setTint(INK));
    this.hint = add(pixelText(scene, W / 2, top + 289, scene.sys.game.device.input.touch ? 'DOTKNIJ - WRÓĆ' : 'ENTER / ESC - WRÓĆ').setTint(0x8a7a5a));
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
    this.flame.y = this.art.y + ship.flameY * 3;
    this.flame.setScale(3, 3 * (this.flameLong ?? 1));
    if (ship.look?.paintFx) this.art.setTint(fxTint(ship.look.paintFx, this.t));
    this.pal?.setY(this.shipY + 26 + Math.sin(this.t * 4) * 2);
  }

  destroy() {
    for (const o of this.items) o.destroy();
  }
}
