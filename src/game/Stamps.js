import { DEPTH, VIEW } from '../config.js';
import { STAGES } from '../data/stages.js';
import { pixelText } from './Hud.js';
import { getLang } from '../i18n.js';

// The stamp book (a stamp rally, like the rubber stamps at Japanese stations): one stamp per city, pressed
// when its stage is cleared without losing a life and without setting off a bomb. Kept in the browser with
// the date it was pressed. The stamps themselves are drawn by tools/art/stamps.mjs, in white, and inked here.
const KEY = 'shmupjp.stamps';
const W = VIEW.width;

/** Each city's ink. */
export const INK = { stage1: 0xd8402a, stage2: 0x1a8a9a, stage3: 0x2a5aa8, stage4: 0x2a7a4a, stage5: 0x8a2a8a, stage6: 0xd8582a };

/** The stamp's frame in the atlas (Kyoto's band reads KYOTO in English). */
export function stampFrame(id) {
  return getLang() === 'en' && id === 'stage1' ? 'stamp_stage1_en' : `stamp_${id}`;
}

/** { stageId: 'YYYY.MM.DD' } */
export function loadStamps() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

export function hasStamp(id) {
  return Boolean(loadStamps()[id]);
}

/** Press a city's stamp into the book; false if it was already there. */
export function pressStamp(id) {
  const all = loadStamps();
  if (all[id]) return false;
  const d = new Date();
  const two = (n) => String(n).padStart(2, '0');
  all[id] = `${d.getFullYear()}.${two(d.getMonth() + 1)}.${two(d.getDate())}`;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
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
    this.shade = scene.add.rectangle(0, 0, W, VIEW.maxHeight, 0x0b0a12, 0.9).setOrigin(0, 0).setDepth(d);
    this.page = scene.add.graphics().setDepth(d);
    this.title = pixelText(scene, W / 2, 0, t('book.title')).setDepth(d + 2).setTint(0x5a2a1a);
    this.slots = STAGES.map((st) => {
      const date = stamps[st.id];
      const stamp = scene.add.image(0, 0, 'sprites', stampFrame(st.id)).setDepth(d + 1);
      if (date) stamp.setTint(INK[st.id]).setAlpha(0.95);
      else stamp.setTint(0x8a7a60).setAlpha(0.14);
      const name = pixelText(scene, 0, 0, st.name).setDepth(d + 2).setTint(date ? 0x3a2a20 : 0x9a8a70);
      const when = pixelText(scene, 0, 0, date ?? '-').setDepth(d + 2).setTint(0x8a7a60);
      return { stamp, name, when, date };
    });
    const n = this.slots.filter((s) => s.date).length;
    this.rule = pixelText(scene, W / 2, 0, t('book.rule')).setDepth(d + 2).setTint(0x5a4a3a);
    this.count = pixelText(scene, W / 2, 0, n === STAGES.length ? t('book.full') : `${n} / ${STAGES.length}`).setDepth(d + 2).setTint(n === STAGES.length ? 0xb83a1a : 0x3a2a20);
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
    this.title.setPosition(W / 2, top + 13);
    g.fillStyle(0xb83a1a, 1).fillRect(30, top + 21, W - 60, 1);
    const rows = 3;
    const pitch = Math.floor((bottom - top - 76) / rows);
    this.slots.forEach((s, i) => {
      const cx = i % 2 ? 132 : 48;
      const cy = top + 30 + Math.floor(i / 2) * pitch + 30;
      // the frame printed on the page for each stamp: a dashed square
      g.fillStyle(0xc4b28c, 1);
      for (let k = -31; k < 31; k += 3) {
        g.fillRect(cx + k, cy - 31, 2, 1);
        g.fillRect(cx + k, cy + 30, 2, 1);
        g.fillRect(cx - 31, cy + k, 1, 2);
        g.fillRect(cx + 30, cy + k, 1, 2);
      }
      s.stamp.setPosition(cx, cy);
      s.name.setPosition(cx, cy + 38);
      s.when.setPosition(cx, cy + 47);
    });
    this.rule.setPosition(W / 2, bottom - 26);
    this.count.setPosition(W / 2, bottom - 14);
    this.hint.setPosition(W / 2, H - 9);
  }

  destroy() {
    for (const o of [this.shade, this.page, this.title, this.rule, this.count, this.hint]) o.destroy();
    for (const s of this.slots) for (const o of [s.stamp, s.name, s.when]) o.destroy();
  }
}
