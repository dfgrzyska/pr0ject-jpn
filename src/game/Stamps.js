import { DEPTH, VIEW } from '../config.js';
import { STAGES } from '../data/stages.js';
import { pixelText } from './Hud.js';
import { getLang } from '../i18n.js';
import { INK_FONT } from '../scenes/Boot.js';

// The stamp book (a stamp rally, like the rubber stamps at Japanese stations): one stamp per city, pressed
// when its stage is cleared without losing a life and without setting off a bomb. Kept in the browser with
// the date it was pressed. The stamps themselves are drawn by tools/art/stamps.mjs, in white, and inked here.
// Won on easy, a stamp is pressed pale (a book of its own); the same city won on normal inks it in full.
const KEY = 'shmupjp.stamps';
const EASY_KEY = 'shmupjp.stamps.easy';
/** How strongly a pale (easy) stamp is inked. */
export const PALE = 0.4;
const W = VIEW.width;
// the page: a dashed frame round each stamp (56 px), its city and date printed under it
const FRAME = 60;
const SLOT = FRAME + 16;

/** Each city's ink. */
export const INK = { stage1: 0xd8402a, stage2: 0x1a8a9a, stage3: 0x2a5aa8, stage4: 0x2a7a4a, stage5: 0x8a2a8a, stage6: 0xd8582a };

/** The stamp's frame in the atlas (Kyoto's band reads KYOTO in English). */
export function stampFrame(id) {
  return getLang() === 'en' && id === 'stage1' ? 'stamp_stage1_en' : `stamp_${id}`;
}

/** { stageId: 'YYYY.MM.DD' }: the stamps won on normal, or (easy) the pale ones won on easy. */
export function loadStamps(easy = false) {
  try {
    return JSON.parse(localStorage.getItem(easy ? EASY_KEY : KEY)) ?? {};
  } catch {
    return {};
  }
}

/** The city's full stamp is in the book (easy: or its pale one). */
export function hasStamp(id, easy = false) {
  return Boolean(loadStamps()[id] || (easy && loadStamps(true)[id]));
}

/** Press a city's stamp into the book (easy: a pale one); false if it was already there. */
export function pressStamp(id, easy = false) {
  if (hasStamp(id, easy)) return false;
  const all = loadStamps(easy);
  const d = new Date();
  const two = (n) => String(n).padStart(2, '0');
  all[id] = `${d.getFullYear()}.${two(d.getMonth() + 1)}.${two(d.getDate())}`;
  try {
    localStorage.setItem(easy ? EASY_KEY : KEY, JSON.stringify(all));
  } catch {
    /* private mode: the stamp still shows this time */
  }
  return true;
}

/** The book opened from the title screen: a page of six frames, a stamp in each one already earned. */
export class StampBook {
  constructor(scene, t) {
    this.scene = scene;
    const d = DEPTH.overlay + 4;
    const stamps = loadStamps();
    const pale = loadStamps(true);
    this.shade = scene.add.rectangle(0, 0, W, VIEW.maxHeight, 0x0b0a12, 0.9).setOrigin(0, 0).setDepth(d);
    this.page = scene.add.graphics().setDepth(d);
    // everything on the paper is printed in the ink font (the outlined one blots on a light page)
    const print = (str, tint) => pixelText(scene, W / 2, 0, str, 0.5, INK_FONT).setDepth(d + 2).setTint(tint);
    this.title = print(t('book.title'), 0xa8321a);
    this.slots = STAGES.map((st) => {
      const date = stamps[st.id];
      const easy = !date && pale[st.id]; // won on easy only: pale, marked so instead of the date
      const stamp = scene.add.image(0, 0, 'sprites', stampFrame(st.id)).setDepth(d + 1);
      if (date) stamp.setTint(INK[st.id]).setAlpha(0.95);
      else if (easy) stamp.setTint(INK[st.id]).setAlpha(PALE);
      else stamp.setTint(0x8a7a60).setAlpha(0.14);
      const name = print(st.name, date || easy ? 0x3a2a20 : 0x9a8a70);
      const when = print(date ?? (easy ? t('book.easy') : '-'), easy ? INK[st.id] : 0x7a6a50);
      return { stamp, name, when, date };
    });
    const n = this.slots.filter((s) => s.date).length;
    this.rule = print(t('book.rule'), 0x5a4a3a);
    this.count = print(n === STAGES.length ? t('book.full') : `${n} / ${STAGES.length}`, n === STAGES.length ? 0xb83a1a : 0x3a2a20);
    this.hint = pixelText(scene, W / 2, 0, t(scene.sys.game.device.input.touch ? 'book.backTouch' : 'book.backKeys')).setDepth(d + 2).setTint(0xffe080);
    this.layout(scene.H);
  }

  layout(H) {
    const top = 6;
    const bottom = H - 20;
    const g = this.page;
    g.clear();
    // the page: cream paper with a printed border
    g.fillStyle(0xe8dcc0, 1).fillRect(5, top, W - 10, bottom - top);
    g.fillStyle(0xd8c8a4, 1).fillRect(5, bottom - 3, W - 10, 3);
    g.lineStyle(1, 0xb83a1a, 1).strokeRect(8.5, top + 3.5, W - 17, bottom - top - 8);
    this.title.setPosition(W / 2, top + 12);
    g.fillStyle(0xb83a1a, 1).fillRect(30, top + 20, W - 60, 1);
    // three rows of two between the title and the rule at the foot, the spare height shared out between them
    const a0 = top + 24;
    const a1 = bottom - 30;
    const gap = Math.max(0, (a1 - a0 - 3 * SLOT) / 3);
    const half = FRAME / 2;
    this.slots.forEach((s, i) => {
      const cx = i % 2 ? 132 : 48;
      const cy = Math.round(a0 + gap / 2 + Math.floor(i / 2) * (SLOT + gap)) + half;
      // the frame printed on the page for each stamp: a dashed square
      g.fillStyle(0xc4b28c, 1);
      for (let k = -half; k < half; k += 3) {
        g.fillRect(cx + k, cy - half, 2, 1);
        g.fillRect(cx + k, cy + half - 1, 2, 1);
        g.fillRect(cx - half, cy + k, 1, 2);
        g.fillRect(cx + half - 1, cy + k, 1, 2);
      }
      s.stamp.setPosition(cx, cy);
      s.name.setPosition(cx, cy + half + 5);
      s.when.setPosition(cx, cy + half + 13);
    });
    this.rule.setPosition(W / 2, bottom - 22);
    this.count.setPosition(W / 2, bottom - 11);
    this.hint.setPosition(W / 2, H - 9);
  }

  destroy() {
    for (const o of [this.shade, this.page, this.title, this.rule, this.count, this.hint]) o.destroy();
    for (const s of this.slots) for (const o of [s.stamp, s.name, s.when]) o.destroy();
  }
}
