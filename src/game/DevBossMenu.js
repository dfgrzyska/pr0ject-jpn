import { DEPTH, VIEW } from '../config.js';
import { ALL_STAGES as STAGES } from '../data/stages.js';
import { ENCOUNTERS } from '../data/encounters.js';
import { pixelText } from './Hud.js';
import { tr } from '../i18n.js';

const LINE = 12; // logical px per row
const LEAD = 6; // seconds before a wave the jump lands (its warning still plays)

/**
 * Developer screen, off the title: every boss in the game, to fight straight away. Each city's miniboss and
 * boss (the stage starts a few seconds before its wave), then every random encounter. A switch for invulnerability.
 */
export class DevBossMenu {
  constructor(scene) {
    this.scene = scene;
    this.god = false;
    // the rows: headers (not selectable) and entries
    this.rows = [{ head: 'MIASTA' }];
    STAGES.forEach((stage, index) => {
      for (const w of stage.waves.filter((w) => w.type === 'heavy' || w.type === 'boss'))
        this.rows.push({ label: `${tr(stage.name)} - ${tr(w.card?.[0] ?? w.type)}`, mini: w.type === 'heavy', go: { index, t: Math.max(0, w.t - LEAD) } });
    });
    this.rows.push({ head: 'SPOTKANIA' });
    for (const ex of ENCOUNTERS) this.rows.push({ label: `${ex.id.toUpperCase()} - ${tr(ex.name)}`, go: { encounter: ex.id } });
    this.rows.push({ head: 'OPCJE' });
    this.rows.push({ label: '', toggle: true });
    this.focus = this.rows.findIndex((r) => !r.head);
    this.scroll = 0;
    const d = DEPTH.overlay + 4;
    this.shade = scene.add.rectangle(0, 0, VIEW.width, scene.H, 0x071221, 0.94).setOrigin(0).setDepth(d);
    this.gfx = scene.add.graphics().setDepth(d + 1);
    this.title = pixelText(scene, 90, 14, 'DEV: WYBÓR BOSSA').setDepth(d + 2).setTint(0xffe080);
    this.back = pixelText(scene, 4, 14, '<', 0).setDepth(d + 2).setTint(0x9aaec2);
    this.hint = pixelText(scene, 90, 0, scene.sys.game.device.input.touch ? 'DOTKNIJ, ABY WALCZYĆ' : 'STRZAŁKI / ENTER / ESC').setDepth(d + 2).setTint(0x9aaec2);
    this.texts = this.rows.map((r) => pixelText(scene, r.head ? 90 : 12, 0, r.head ?? r.label, r.head ? 0.5 : 0).setOrigin(r.head ? 0.5 : 0, 0.5).setDepth(d + 2));
    this.layout(scene.H);
  }

  layout(H) {
    this.H = H;
    this.shade.setSize(VIEW.width, H);
    this.top = 32;
    this.bottom = H - 22;
    this.hint.y = H - 10;
    this.draw();
  }

  /** How many rows fit, and the first one shown (the focus kept in view). */
  view() {
    const fit = Math.floor((this.bottom - this.top) / LINE);
    if (!this.free) {
      if (this.focus - this.scroll >= fit) this.scroll = this.focus - fit + 1;
      if (this.focus < this.scroll + 1) this.scroll = Math.max(0, this.focus - 1);
    }
    this.scroll = Math.max(0, Math.min(this.scroll, this.rows.length - fit));
    return fit;
  }

  draw() {
    const fit = this.view();
    const g = this.gfx.clear();
    g.lineStyle(1, 0x365168).lineBetween(10, 24, 170, 24);
    this.rows.forEach((r, i) => {
      const t = this.texts[i];
      const k = i - this.scroll;
      const shown = k >= 0 && k < fit;
      t.setVisible(shown);
      if (!shown) return;
      t.y = this.top + k * LINE + LINE / 2;
      if (r.toggle) t.setText(`${tr('NIEŚMIERTELNOŚĆ')}: ${tr(this.god ? 'WŁ' : 'WYŁ')}`);
      if (r.head) return t.setTint(0x6a8aa8);
      const on = i === this.focus;
      t.setTint(on ? 0xffe080 : r.mini ? 0x9ab0c4 : 0xd8e4ee);
      if (on) {
        g.fillStyle(0x21364a).fillRect(6, t.y - LINE / 2, 168, LINE);
        g.fillStyle(0xffe080).fillTriangle(7, t.y - 3, 7, t.y + 3, 10, t.y);
      }
    });
    // a scroll bar when the list runs past the screen
    if (this.rows.length > fit) {
      const h = Math.max(10, ((this.bottom - this.top) * fit) / this.rows.length);
      const y = this.top + ((this.bottom - this.top - h) * this.scroll) / Math.max(1, this.rows.length - fit);
      g.fillStyle(0x365168).fillRect(176, y, 2, h);
    }
  }

  move(delta) {
    let i = this.focus;
    do i = (i + delta + this.rows.length) % this.rows.length;
    while (this.rows[i].head);
    this.focus = i;
    this.free = false; // the keys bring the focus back into view
    this.draw();
  }

  activate() {
    const r = this.rows[this.focus];
    if (r.toggle) {
      this.god = !this.god;
      return this.draw();
    }
    this.scene.devStartBoss(r.go, this.god);
  }

  /** A press: the back arrow at once; on the list it may become a drag (scroll) or, on release, a tap. */
  pointer(p) {
    if (p.y < 26 && p.x < 40) return this.scene.closeDevBosses();
    if (p.y < this.top || p.y > this.bottom) return;
    this.drag = { y: p.y, scroll: this.scroll, moved: false };
  }

  /** Dragging a finger (or the mouse) along the list scrolls it, the focus may go off screen meanwhile. */
  pointerMove(p) {
    if (!this.drag || !p.isDown) return;
    const dy = p.y - this.drag.y;
    if (!this.drag.moved && Math.abs(dy) < 4) return;
    this.drag.moved = true;
    this.free = true;
    this.scroll = this.drag.scroll - Math.round(dy / LINE);
    this.draw();
  }

  /** A release without a drag is a tap: a row (a second tap on the focused row starts it). */
  pointerUp(p) {
    const drag = this.drag;
    this.drag = null;
    if (!drag || drag.moved) return;
    const i = this.scroll + Math.floor((drag.y - this.top) / LINE);
    if (!this.rows[i] || this.rows[i].head) return;
    if (i === this.focus) return this.activate();
    this.focus = i;
    this.draw();
  }

  /** The wheel moves the focus. */
  wheel(dy) {
    this.move(dy > 0 ? 1 : -1);
  }

  destroy() {
    for (const o of [this.shade, this.gfx, this.title, this.back, this.hint, ...this.texts]) o.destroy();
  }
}
