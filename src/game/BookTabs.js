import { DEPTH } from '../config.js';
import { getLang } from '../i18n.js';
import { pixelText } from './Hud.js';
import { INK_FONT } from '../scenes/Boot.js';

/** The collection's three books, in the order of their tabs. */
export const BOOK_TABS = ['stamps', 'yokai', 'food'];
const NAMES = { pl: ['PIECZĄTKI', 'YOKAI', 'SMAKI'], en: ['STAMPS', 'YOKAI', 'FOOD'] };
const EDGE = [10, 74, 122, 170]; // where each tab starts and the last one ends (the first name is the long one)
const X = [0, 1, 2].map((i) => (EDGE[i] + EDGE[i + 1]) / 2);
const Y = 18;

/** The tabs printed across the top of the collection's page, where each book's own title used to be. */
export class BookTabs {
  constructor(scene) {
    const d = DEPTH.overlay + 6.5;
    const names = NAMES[getLang() === 'en' ? 'en' : 'pl'];
    this.gfx = scene.add.graphics().setDepth(d);
    this.labels = names.map((name, i) => pixelText(scene, X[i], Y, name, 0.5, INK_FONT).setDepth(d));
  }

  set(tab) {
    const at = BOOK_TABS.indexOf(tab);
    const g = this.gfx.clear();
    this.labels.forEach((label, i) => label.setTint(i === at ? 0xa8321a : 0x8a7a60));
    g.fillStyle(0xc4b28c).fillRect(EDGE[1], Y - 5, 1, 10).fillRect(EDGE[2], Y - 5, 1, 10);
    g.fillStyle(0xb83a1a).fillRect(EDGE[at] + 4, Y + 7, EDGE[at + 1] - EDGE[at] - 8, 2);
  }

  /** The tab under the pointer, else null. */
  hit(p) {
    if (p.y > Y + 12) return null;
    const i = BOOK_TABS.findIndex((_, n) => p.x >= EDGE[n] && p.x < EDGE[n + 1]);
    return i < 0 ? null : BOOK_TABS[i];
  }

  destroy() {
    this.gfx.destroy();
    for (const o of this.labels) o.destroy();
  }
}
