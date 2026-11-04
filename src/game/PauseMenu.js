import { DEPTH, VIEW } from '../config.js';
import { pixelText } from './Hud.js';
import { tr } from '../i18n.js';

/** Pause and exit confirmation share the same large keyboard/touch targets. */
export class PauseMenu {
  constructor(scene) {
    this.scene = scene;
    this.confirming = false;
    this.focus = 0;
    const d = DEPTH.overlay + 4;
    this.shade = scene.add.rectangle(0, 0, VIEW.width, scene.H, 0x071221, 0.9).setOrigin(0).setDepth(d);
    this.gfx = scene.add.graphics().setDepth(d + 1);
    this.title = pixelText(scene, 90, 0, '').setDepth(d + 2).setTint(0xffe080);
    this.note = pixelText(scene, 90, 0, '').setDepth(d + 2).setTint(0x9aaec2);
    this.buttons = [0, 1].map(() => pixelText(scene, 90, 0, '').setDepth(d + 2));
    this.hint = pixelText(scene, 90, 0, 'ESC - POWRÓT').setDepth(d + 2).setTint(0x9aaec2);
    this.layout(scene.H);
  }

  layout(H) {
    this.shade.setSize(VIEW.width, H);
    this.title.y = Math.round(H / 2 - 72);
    this.note.y = this.title.y + 22;
    this.buttons.forEach((b, i) => b.y = Math.round(H / 2 + i * 42));
    this.hint.y = Math.round(H / 2 + 80);
    this.draw();
  }

  draw() {
    this.title.setText(tr(this.confirming ? 'WRÓCIĆ DO MENU?' : 'PAUZA'));
    this.note.setText(tr(this.confirming ? 'ZAKOŃCZYSZ TĘ ROZGRYWKĘ' : 'PODRÓŻ MOŻE POCZEKAĆ'));
    const labels = this.confirming ? ['NIE, ZOSTAJĘ', 'TAK, WRÓĆ DO MENU'] : ['KONTYNUUJ', 'MENU GŁÓWNE'];
    const g = this.gfx.clear();
    g.lineStyle(1, 0x365168).lineBetween(30, this.title.y - 20, 150, this.title.y - 20);
    this.buttons.forEach((b, i) => {
      const color = this.focus === i ? (this.confirming && i === 1 ? 0xff977c : 0xffe080) : 0x8ca6bc;
      b.setText(tr(labels[i])).setTint(color);
      g.fillStyle(this.focus === i ? 0x21364a : 0x101e30).fillRoundedRect(12, b.y - 17, 156, 34, 4);
      g.lineStyle(1, color).strokeRoundedRect(12, b.y - 17, 156, 34, 4);
    });
  }

  move() { this.focus = 1 - this.focus; this.draw(); }
  back() {
    if (!this.confirming) return this.scene.togglePause();
    this.confirming = false;
    this.focus = 0;
    this.draw();
  }
  activate() {
    if (this.confirming) {
      if (this.focus === 1) this.scene.returnToTitle();
      else this.back();
    } else if (this.focus === 0) this.scene.togglePause();
    else { this.confirming = true; this.focus = 0; this.draw(); }
  }
  pointer(p) {
    if (p.x < 12 || p.x > 168) return;
    const i = this.buttons.findIndex((b) => Math.abs(p.y - b.y) <= 17);
    if (i < 0) return;
    this.focus = i;
    this.activate();
  }
  destroy() { for (const o of [this.shade, this.gfx, this.title, this.note, this.hint, ...this.buttons]) o.destroy(); }
}
