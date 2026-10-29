import { DEPTH, SHIPS, VIEW } from '../config.js';
import { pixelText } from './Hud.js';

const W = VIEW.width;
const SLOT_X = [32, 90, 148];

// Ship selection: tap a ship to pick it, tap it again (or the bottom half) to launch.
// Keyboard: left/right to pick, Enter / Space / Z to launch.
export class ShipSelect {
  constructor(scene, index) {
    this.scene = scene;
    this.index = index;
    this.t = 0;
    const d = DEPTH.overlay + 1;
    const touch = scene.sys.game.device.input.touch;
    this.dim = scene.add.rectangle(0, 0, W, VIEW.maxHeight, 0x0b0a12, 0.72).setOrigin(0, 0).setDepth(DEPTH.overlay);
    this.box = scene.add.graphics().setDepth(d);
    this.title = pixelText(scene, W / 2, 0, 'WYBIERZ STATEK').setDepth(d).setTint(0xffd6e5);
    this.ships = SHIPS.map((s, i) => scene.add.image(SLOT_X[i], 0, 'sprites', s.frame).setScale(2).setDepth(d + 1));
    this.flames = SHIPS.map((s, i) =>
      scene.add.sprite(SLOT_X[i], 0, 'sprites', 'flame_0').setOrigin(0.5, 0).setScale(2).setDepth(d).play('flame'),
    );
    this.names = SHIPS.map((s, i) => pixelText(scene, SLOT_X[i], 0, s.name).setDepth(d));
    this.role = pixelText(scene, W / 2, 0, '').setDepth(d);
    this.labels = ['PRĘDKOŚĆ', 'SIŁA OGNIA', 'ŻYCIA'].map((l) => pixelText(scene, 34, 0, l, 0).setDepth(d).setTint(0xb0aec0));
    this.pips = [0, 1].map(() => [0, 1, 2].map(() => scene.add.image(0, 0, 'sprites', 'pip_off').setScale(2).setDepth(d)));
    this.lifeIcons = [0, 1, 2].map(() => scene.add.image(0, 0, 'sprites', 'icon_life').setDepth(d));
    this.hint = pixelText(scene, W / 2, 0, touch ? 'DOTKNIJ PONOWNIE = START' : 'STRZAŁKI - WYBÓR').setDepth(d).setTint(0xb0aec0);
    this.start = pixelText(scene, W / 2, 0, touch ? '' : 'ENTER - START').setDepth(d).setTint(0xffe080);
    this.layout(scene.H);
    this.select(index);
  }

  layout(H) {
    this.H = H;
    this.dim.setSize(W, H);
    this.title.y = Math.round(H * 0.13);
    this.shipY = Math.round(H * 0.32);
    this.nameY = this.shipY + 30;
    this.detailY = Math.round(H * 0.5);
    this.names.forEach((n) => (n.y = this.nameY));
    this.role.y = this.detailY;
    this.labels.forEach((l, i) => (l.y = this.detailY + 14 + i * 14));
    this.pips.forEach((row, r) => row.forEach((p, i) => p.setPosition(124 + i * 7, this.detailY + 21 + r * 14)));
    this.lifeIcons.forEach((ic, i) => ic.setPosition(126 + i * 10, this.detailY + 49));
    this.hint.y = Math.round(H * 0.8);
    this.start.y = this.hint.y + 14;
    this.select(this.index);
  }

  select(i) {
    this.index = (i + SHIPS.length) % SHIPS.length;
    const ship = SHIPS[this.index];
    this.ships.forEach((s, k) => s.setAlpha(k === this.index ? 1 : 0.45));
    this.flames.forEach((f, k) => f.setVisible(k === this.index));
    this.names.forEach((n, k) => n.setTint(k === this.index ? ship.color : 0x6a6880));
    this.role.setText(ship.role).setTint(ship.color);
    ship.stats.forEach((v, r) => this.pips[r].forEach((p, k) => p.setFrame(k < v ? 'pip_on' : 'pip_off')));
    this.lifeIcons.forEach((ic, k) => ic.setFrame(ship.life).setVisible(k < ship.lives));
    const x = SLOT_X[this.index];
    this.box.clear();
    this.box.lineStyle(1, ship.color, 1).strokeRect(x - 26.5, this.shipY - 27.5, 54, 64);
    return ship;
  }

  get ship() {
    return SHIPS[this.index];
  }

  /** Index of the ship column under the pointer (upper part of the screen), else null. */
  hit(p) {
    if (p.y > this.detailY - 8) return null;
    return Math.max(0, Math.min(SHIPS.length - 1, Math.floor(p.x / (W / SHIPS.length))));
  }

  update(dt) {
    this.t += dt;
    this.ships.forEach((s, k) => {
      const bob = k === this.index ? Math.round(Math.sin(this.t * 3) * 1.5) : 0;
      s.y = this.shipY + bob * 2;
      this.flames[k].y = s.y + SHIPS[k].flameY * 2;
    });
    this.start.setVisible(Math.floor(this.t * 2.5) % 2 === 0);
  }

  destroy() {
    for (const o of [this.dim, this.box, this.title, this.role, this.hint, this.start]) o.destroy();
    for (const o of [...this.ships, ...this.flames, ...this.names, ...this.labels, ...this.pips.flat(), ...this.lifeIcons]) o.destroy();
  }
}
