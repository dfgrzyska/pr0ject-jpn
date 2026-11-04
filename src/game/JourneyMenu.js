import { DEPTH, SHIPS, VIEW } from '../config.js';
import { STAGES } from '../data/stages.js';
import { MAP, project } from '../data/japan.js';
import { pixelText } from './Hud.js';
import { tr } from '../i18n.js';

const CITY_KEY = 'shmupjp.startCity';
const NORTH_TO_SOUTH = STAGES.map((_, i) => i).sort((a, b) => STAGES[b].map[1] - STAGES[a].map[1]);
export function lastCity() {
  try {
    const i = STAGES.findIndex((s) => s.id === localStorage.getItem(CITY_KEY));
    return i < 0 ? 0 : i;
  } catch { return 0; }
}

/** Shared title backdrop and discrete city selector. Flight retargeting never queues animations. */
export class JourneyMenu {
  constructor(scene, index = lastCity()) {
    this.scene = scene;
    this.index = index;
    this.time = 0;
    this.modeTime = 0;
    this.items = [];
    const add = (o, depth = DEPTH.overlay + 1) => { this.items.push(o); return o.setDepth(depth); };
    this.bg = add(scene.add.rectangle(0, 0, VIEW.width, VIEW.maxHeight, 0x0c1830).setOrigin(0), DEPTH.overlay);
    this.map = add(scene.add.image(0, 0, 'japan').setOrigin(0).setScale(0.8), DEPTH.overlay);
    this.clouds = [0, 1].map((i) => add(scene.add.image(30 + i * 100, 0, 'sprites', `cloud_${i}`).setAlpha(0.09), DEPTH.overlay));
    this.gfx = add(scene.add.graphics());
    this.labels = STAGES.map((s) => add(pixelText(scene, 0, 0, s.name)));
    this.ship = add(scene.add.image(0, 0, 'sprites', SHIPS[scene.shipIndex].frame), DEPTH.overlay + 2);
    this.logo = add(scene.add.image(90, 0, 'sprites', 'logo'));
    this.tagline = add(pixelText(scene, 90, 0, 'JAPONIA CZEKA').setTint(0xe6bc81));
    this.caption = add(pixelText(scene, 90, 0, 'SIEDEM MIAST. JEDNA PODRÓŻ.').setTint(0x829fb2));
    this.heading = add(pixelText(scene, 90, 50, 'WYBIERZ MIASTO'));
    this.newGame = add(pixelText(scene, 90, 0, 'NOWA GRA'));
    this.stamps = add(pixelText(scene, 90, 0, 'PIECZĄTKI'));
    this.name = add(pixelText(scene, 90, 0, ''));
    this.subtitle = add(pixelText(scene, 90, 0, ''));
    this.next = add(pixelText(scene, 90, 0, 'DALEJ >'));
    this.back = add(pixelText(scene, 27, 12, '< WRÓĆ'));
    this.hint = add(pixelText(scene, 90, 0, scene.sys.game.device.input.touch ? 'DOTKNIJ, ABY WYBRAĆ' : 'STRZAŁKI / ENTER').setTint(0x9aaec2));
    this.focus = 0;
    this.layout(scene.H);
    this.setMode('title');
  }

  city(i) {
    const [x, y] = project(...STAGES[i].map);
    return { x: Math.round(x * this.map.scaleX), y: Math.round(y * this.map.scaleY + this.map.y) };
  }

  layout(H) {
    this.H = H;
    this.bg.setSize(VIEW.width, H);
    const scale = this.mode === 'city' ? 0.8 : 1;
    this.scene.tweens.killTweensOf(this.map);
    this.map.setScale(scale);
    this.map.y = Math.round((H - MAP.h * scale) / 2);
    this.railTop = 80;
    this.railBottom = H - 100;
    this.logo.y = Math.round(H * 0.29);
    this.tagline.y = this.logo.y + 30;
    this.caption.y = H - 40;
    this.newGame.y = Math.round(H * 0.54);
    this.stamps.y = this.newGame.y + 44;
    this.name.y = H - 73;
    this.subtitle.y = H - 58;
    this.next.y = H - 30;
    this.hint.y = H - 12;
    this.layoutLabels();
    const p = this.city(this.index);
    this.ship.setPosition(p.x, p.y);
    this.flight = null;
  }

  layoutLabels() {
    this.labels.forEach((label, i) => {
      const p = this.city(i);
      const half = label.width / 2;
      const x = Math.max(half + 2, Math.min(148 - half, p.x + STAGES[i].map[2] * 0.8));
      const y = p.y + (STAGES[i].id === 'stage7' ? -26 : STAGES[i].map[3] * 0.8);
      label.setPosition(Math.round(x), Math.round(y));
    });
  }

  setMode(mode) {
    this.mode = mode;
    this.modeTime = 0;
    this.drag = null;
    const title = mode === 'title';
    const cities = mode === 'city';
    for (const o of [this.logo, this.tagline, this.caption, this.newGame, this.stamps]) o.setVisible(title);
    for (const o of [this.heading, this.name, this.subtitle, this.next, ...this.labels]) o.setVisible(cities);
    this.ship.setVisible(title || cities).setDepth(DEPTH.overlay + (title ? 0.5 : 2));
    if (cities) this.ship.setRotation(0);
    this.back.setVisible(cities);
    this.hint.setVisible(title || cities);
    this.scene.tweens.killTweensOf(this.map);
    const scale = cities ? 0.8 : 1;
    this.scene.tweens.add({ targets: this.map, scaleX: scale, scaleY: scale, y: Math.round((this.H - MAP.h * scale) / 2), alpha: title ? 0.58 : 1, duration: 450, ease: 'Sine.easeInOut' });
    this.name.setText(STAGES[this.index].name).setTint(0xffe080);
    this.subtitle.setText(tr(STAGES[this.index].subtitle));
    this.next.setTint(0xffe080);
  }

  choose(index) {
    if (index === this.index) return;
    const from = { x: this.ship.x, y: this.ship.y };
    const to = this.city(index);
    const distance = Math.hypot(to.x - from.x, to.y - from.y) || 1;
    const bend = Math.min(25, distance * 0.25);
    this.flight = { from, to, cx: (from.x + to.x) / 2 + (to.y - from.y) / distance * bend,
      cy: (from.y + to.y) / 2 - (to.x - from.x) / distance * bend, t: 0, duration: Math.min(0.7, 0.4 + distance / 500) };
    this.index = index;
    this.name.setText(STAGES[index].name);
    this.subtitle.setText(tr(STAGES[index].subtitle));
  }

  step(delta) {
    const pos = NORTH_TO_SOUTH.indexOf(this.index);
    this.choose(NORTH_TO_SOUTH[Math.max(0, Math.min(NORTH_TO_SOUTH.length - 1, pos + delta))]);
  }

  slide(y) {
    const k = Math.max(0, Math.min(1, (y - this.railTop) / (this.railBottom - this.railTop)));
    this.choose(NORTH_TO_SOUTH[Math.round(k * (NORTH_TO_SOUTH.length - 1))]);
  }

  pointerDown(p) {
    if (this.mode === 'title') {
      if (p.x < 14 || p.x > 166) return;
      if (Math.abs(p.y - this.newGame.y) <= 18) this.scene.openCities();
      else if (Math.abs(p.y - this.stamps.y) <= 18) this.scene.openBook();
      return;
    }
    if (p.y < 28 && p.x < 60) return this.scene.showTitle();
    if (Math.abs(p.y - this.next.y) < 15 && p.x > 25 && p.x < 155) return this.scene.confirmCity();
    if (p.x >= 150 && p.y >= this.railTop - 15 && p.y <= this.railBottom + 15) {
      this.drag = p.id;
      this.slide(p.y);
      return;
    }
    let nearest = null, distance = 14;
    STAGES.forEach((_, i) => {
      const c = this.city(i), d = Math.hypot(p.x - c.x, p.y - c.y);
      if (d < distance) { nearest = i; distance = d; }
    });
    if (nearest !== null) this.choose(nearest);
  }

  pointerMove(p) {
    if (this.mode === 'title' && p.x >= 14 && p.x <= 166) {
      if (Math.abs(p.y - this.newGame.y) <= 18) this.focus = 0;
      else if (Math.abs(p.y - this.stamps.y) <= 18) this.focus = 1;
    }
    if (this.drag === p.id && p.isDown) this.slide(p.y);
  }
  pointerUp(p) { if (this.drag === p.id) this.drag = null; }
  remember() { try { localStorage.setItem(CITY_KEY, STAGES[this.index].id); } catch { /* private mode */ } }

  update(dt) {
    this.time += dt;
    this.modeTime += dt;
    this.layoutLabels();
    if (!this.flight && this.mode === 'city') { const p = this.city(this.index); this.ship.setPosition(p.x, p.y); }
    this.clouds.forEach((c, i) => c.setPosition(((this.time * (2 + i) + i * 100) % 240) - 30, this.H * (0.35 + i * 0.25)));
    this.newGame.setTint(this.focus === 0 ? 0xffe080 : 0xb0aec0);
    this.stamps.setTint(this.focus === 1 ? 0xffe080 : 0xb0aec0);
    const g = this.gfx.clear();
    if (this.mode === 'backdrop') return;
    STAGES.forEach((_, i) => {
      const p = this.city(i), selected = i === this.index && this.mode === 'city';
      g.fillStyle(selected ? 0xffe080 : 0x83a9bc, this.mode === 'title' ? 0.45 : 1).fillCircle(p.x, p.y, selected ? 3 : 2);
      if (selected) g.lineStyle(1, 0xffe080, 0.7).strokeCircle(p.x, p.y, 5 + Math.sin(this.time * 5));
      this.labels[i].setTint(selected ? 0xffe080 : 0xb0c1ce);
    });
    if (this.mode === 'title') {
      const appear = Math.min(1, this.modeTime / 0.6);
      this.logo.setAlpha(appear).setY(Math.round(this.H * 0.29 + Math.sin(this.time * 1.6) * 2));
      this.tagline.setAlpha(appear * (0.85 + Math.sin(this.time * 2) * 0.15));
      // A quiet flight over the full-width atlas, behind the menu cards.
      const t = (this.time * 0.045) % 1;
      const x = -18 + t * 216, y = this.H * 0.42 - Math.sin(t * Math.PI) * 62;
      this.ship.setPosition(Math.round(x), Math.round(y)).setRotation(Math.atan2(-62 * Math.PI * Math.cos(t * Math.PI), 216) + Math.PI / 2).setAlpha(0.8);
      for (let n = 1; n <= 14; n++) {
        const u = t - n * 0.009;
        if (u < 0) continue;
        g.fillStyle(0xd8c9a4, (1 - n / 15) * 0.35).fillRect(Math.round(-18 + u * 216), Math.round(this.H * 0.42 - Math.sin(u * Math.PI) * 62), 1, 1);
      }
      for (let n = 0; n < 18; n++) {
        const x = (n * 47 + Math.sin(this.time * 0.4 + n) * 5 + 180) % 180;
        const y = (n * 71 - this.time * (2 + n % 3) + this.H * 100) % this.H;
        g.fillStyle(0xffdfb0, 0.12 + (Math.sin(this.time * 2 + n) + 1) * 0.12).fillRect(Math.round(x), Math.round(y), 1, 1);
      }
      g.lineStyle(1, 0xcba671, 0.6).lineBetween(56, this.tagline.y + 14, 124, this.tagline.y + 14);
      for (const [i, text] of [this.newGame, this.stamps].entries()) {
        const active = this.focus === i;
        const reveal = Math.max(0, Math.min(1, (this.modeTime - i * 0.1) / 0.4));
        text.setAlpha(reveal);
        g.fillStyle(0x050e1b, 0.65 * reveal).fillRoundedRect(16, text.y - 16, 152, 38, 5);
        g.fillStyle(active ? 0x253c50 : 0x102438, 0.95 * reveal).fillRoundedRect(14, text.y - 19, 152, 38, 5);
        g.lineStyle(1, active ? 0xffdf9a : 0x4d7188, reveal).strokeRoundedRect(14, text.y - 19, 152, 38, 5);
        if (active) {
          const offset = Math.round(Math.sin(this.time * 5) * 2);
          g.fillStyle(0xffdf9a, reveal).fillTriangle(24 + offset, text.y - 3, 24 + offset, text.y + 3, 28 + offset, text.y);
          g.lineStyle(1, 0xffdf9a, 0.4 + Math.sin(this.time * 3) * 0.15).lineBetween(43, text.y + 14, 137, text.y + 14);
        }
      }
      return;
    }
    this.ship.setAlpha(1);
    const railOffset = Math.round(34 * (1 - Math.min(1, this.modeTime / 0.35)) ** 2);
    g.fillStyle(0x132942).fillRoundedRect(153 + railOffset, this.railTop - 17, 25, this.railBottom - this.railTop + 34, 5);
    g.lineStyle(1, 0x66869e).lineBetween(166 + railOffset, this.railTop, 166 + railOffset, this.railBottom);
    NORTH_TO_SOUTH.forEach((i, k) => {
      const y = this.railTop + k * (this.railBottom - this.railTop) / 6;
      g.fillStyle(i === this.index ? 0xffe080 : 0x66869e).fillCircle(166 + railOffset, y, i === this.index ? 6 : 2);
      if (i === this.index) g.lineStyle(1, 0x0c1830).lineBetween(163 + railOffset, y, 169 + railOffset, y);
    });
    g.lineStyle(1, 0xffe080).strokeRoundedRect(32, this.next.y - 14, 116, 28, 3);
    const f = this.flight;
    if (!f) return;
    f.to = this.city(this.index);
    f.t += dt;
    const k = Math.min(1, f.t / f.duration), e = k * k * (3 - 2 * k);
    const at = (t) => ({ x: (1 - t) ** 2 * f.from.x + 2 * (1 - t) * t * f.cx + t * t * f.to.x,
      y: (1 - t) ** 2 * f.from.y + 2 * (1 - t) * t * f.cy + t * t * f.to.y });
    const p = at(e), ahead = at(Math.min(1, e + 0.01));
    this.ship.setPosition(Math.round(p.x), Math.round(p.y));
    if (k < 1) this.ship.setRotation(Math.atan2(ahead.y - p.y, ahead.x - p.x) + Math.PI / 2);
    for (let t = Math.max(0, e - 0.45); t < e; t += 0.035) {
      const q = at(t);
      g.fillStyle(0xffe080, Math.max(0, 1 - (e - t) / 0.45) * (1 - k)).fillRect(Math.round(q.x), Math.round(q.y), 1, 1);
    }
    if (k === 1) { this.ship.setRotation(0); this.flight = null; }
  }

  destroy() { this.scene.tweens.killTweensOf(this.map); this.items.forEach((o) => o.destroy()); }
}
