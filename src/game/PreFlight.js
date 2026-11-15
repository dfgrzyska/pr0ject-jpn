import { DEPTH, VIEW } from '../config.js';
import { RARITY } from '../data/gacha.js';
import { isEasy, rules, setEasy } from '../difficulty.js';
import { pixelText } from './Hud.js';
import { parts } from './Loadout.js';
import { tr } from '../i18n.js';
import { sharedArt } from './enemyArt.js';
import { flameLook } from './shipSkin.js';

const W = VIEW.width;
const SHIP_X = 35;
const PART_LINE = 10;
const PARTS_SHOWN = 5;

// Before take-off: the ship as it was put together (its hull, what it can do, the parts fitted), and the mode:
// normal or easy (tap it, or the arrows), kept for the next game. A tap anywhere else, or Enter / Space / Z, launches.
export class PreFlight {
  constructor(scene, ship, loadout) {
    this.scene = scene;
    this.ship = ship;
    this.t = 0;
    const d = DEPTH.overlay + 1;
    const touch = scene.sys.game.device.input.touch;
    this.dim = scene.add.rectangle(0, 0, W, VIEW.maxHeight, 0x0b0a12, 0.72).setOrigin(0, 0).setDepth(DEPTH.overlay);
    this.box = scene.add.graphics().setDepth(d);
    this.back = pixelText(scene, 27, 12, '< WRÓĆ').setDepth(d);
    this.title = pixelText(scene, W / 2, 0, 'TWÓJ STATEK').setDepth(d).setTint(0xffd6e5);
    this.art = sharedArt(scene.add.image(SHIP_X, 0, 'sprites', ship.frame)).setScale(2).setDepth(d + 1);
    this.flame = sharedArt(scene.add.sprite(SHIP_X, 0, 'sprites', 'flame_0')).setOrigin(0.5, 0).setScale(2).setDepth(d).play('flame');
    this.name = pixelText(scene, SHIP_X, 0, ship.name).setDepth(d).setTint(ship.color);
    this.labels = ['PRĘDKOŚĆ', 'SIŁA OGNIA', 'ŻYCIA'].map((l) => pixelText(scene, 68, 0, l, 0).setDepth(d).setTint(0xb0aec0));
    this.pips = ship.stats.map((v) => [0, 1, 2].map((k) => sharedArt(scene.add.image(0, 0, 'sprites', k < v ? 'pip_on' : 'pip_off')).setScale(2).setDepth(d)));
    this.lifeIcons = [0, 1, 2, 3, 4].map(() => sharedArt(scene.add.image(0, 0, 'sprites', ship.life)).setDepth(d));
    // the parts at work, each in its rarity's colour (the starter ones plain)
    const fitted = parts(loadout);
    const shown = fitted.slice(0, fitted.length > PARTS_SHOWN ? PARTS_SHOWN - 1 : PARTS_SHOWN);
    this.partsHead = pixelText(scene, W / 2, 0, 'CZĘŚCI').setDepth(d).setTint(0x8a8aa8);
    this.parts = shown.map((it) => pixelText(scene, W / 2, 0, it.name).setDepth(d).setTint(it.rarity ? RARITY[it.rarity].color : 0xd8d4e4));
    if (fitted.length > shown.length) this.parts.push(pixelText(scene, W / 2, 0, `+ ${fitted.length - shown.length}`).setDepth(d).setTint(0x8a8aa8));
    this.modeLabel = pixelText(scene, 34, 0, 'TRYB', 0).setDepth(d).setTint(0xb0aec0);
    this.mode = pixelText(scene, 140, 0, '').setDepth(d);
    this.modeInfo = pixelText(scene, W / 2, 0, '').setDepth(d).setTint(0x8a8aa8);
    this.hint = pixelText(scene, W / 2, 0, touch ? 'DOTKNIJ = START' : 'STRZAŁKI - TRYB').setDepth(d).setTint(0xb0aec0);
    this.start = pixelText(scene, W / 2, 0, touch ? '' : 'ENTER - START').setDepth(d).setTint(0xffe080);
    this.layout(scene.H);
  }

  layout(H) {
    this.H = H;
    this.dim.setSize(W, H);
    this.title.y = Math.round(H * 0.1);
    this.shipY = this.title.y + 44;
    this.name.y = this.shipY + 30;
    this.labels.forEach((l, i) => (l.y = this.shipY - 22 + i * 14));
    this.pips.forEach((row, r) => row.forEach((p, i) => p.setPosition(152 + i * 7, this.shipY - 15 + r * 14)));
    this.lifeIcons.forEach((ic, i) => ic.setPosition(130 + i * 9, this.shipY + 13));
    this.box.clear();
    this.box.lineStyle(1, this.ship.color, 1).strokeRect(SHIP_X - 26.5, this.shipY - 27.5, 54, 64);
    this.partsHead.y = this.shipY + 52;
    this.parts.forEach((p, i) => (p.y = this.partsHead.y + 12 + i * PART_LINE));
    this.modeY = this.partsHead.y + 12 + PARTS_SHOWN * PART_LINE + 14;
    this.modeLabel.y = this.modeY - 7;
    this.mode.y = this.modeY;
    this.modeInfo.y = this.modeY + 14;
    this.hint.y = Math.max(Math.round(H * 0.84), this.modeY + 30);
    this.start.y = this.hint.y + 14;
    this.refresh();
  }

  refresh() {
    const easy = isEasy();
    this.lifeIcons.forEach((ic, k) => ic.setVisible(k < this.ship.lives + rules().extraLives));
    this.mode.setText(`< ${tr(easy ? 'ŁATWY' : 'NORMALNY')} >`).setTint(easy ? 0x9cf09a : 0xffffff);
    this.modeInfo.setText(tr(easy ? 'WIĘCEJ ŻYĆ I KONTYNUACJE' : 'PEŁNE WYZWANIE'));
  }

  /** Normal <-> easy. */
  toggleMode() {
    setEasy(!isEasy());
    this.refresh();
  }

  /** The pointer is on the mode switch (its line and the one under it). */
  hitMode(p) {
    return p.y > this.modeY - 10 && p.y < this.modeY + 20;
  }

  update(dt) {
    this.t += dt;
    this.art.y = this.shipY + Math.round(Math.sin(this.t * 3) * 1.5) * 2;
    this.flame.y = this.art.y + this.ship.flameY * 2;
    this.flame.setScale(2, 2 * flameLook(this.flame, this.ship));
    this.start.setVisible(Math.floor(this.t * 2.5) % 2 === 0);
  }

  destroy() {
    for (const o of [this.back, this.dim, this.box, this.title, this.art, this.flame, this.name, this.partsHead, this.hint, this.start, this.modeLabel, this.mode, this.modeInfo]) o.destroy();
    for (const o of [...this.labels, ...this.pips.flat(), ...this.lifeIcons, ...this.parts]) o.destroy();
  }
}
