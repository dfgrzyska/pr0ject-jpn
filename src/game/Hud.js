import { BEANS, DEPTH, GRAZE, HEAT, PLAYER, SCORE, VIEW } from '../config.js';
import { FONT } from '../scenes/Boot.js';

const W = VIEW.width;
// Line pitch for panels: 7px glyphs + raised Polish accents need 14px to never touch the line above.
const LINE = 14;
const WEAPON_ICON = { basic: 'wpn_basic', spread: 'wpn_spread', laser: 'wpn_laser', homing: 'wpn_homing' };

/**
 * Bitmap text that always lands on whole pixels. Phaser's bitmap text ignores vertex rounding, and an
 * origin of 0.5 on an odd width (or the 13 px line) puts every glyph on a half pixel; some GPUs (iPhone)
 * then sample the font a texel off and letters lose their top row (O turns into U, A into H). So the
 * display origin is floored whenever the text is measured; callers pass whole-pixel positions.
 */
export function pixelText(scene, x, y, str, origin = 0.5) {
  const t = scene.add.bitmapText(Math.round(x), Math.round(y), FONT, str).setLetterSpacing(-1);
  const measure = t.getTextBounds;
  t.getTextBounds = function (round) {
    const bounds = measure.call(this, round);
    this._displayOriginX = Math.floor(this._displayOriginX);
    this._displayOriginY = Math.floor(this._displayOriginY);
    return bounds;
  };
  return t.setOrigin(origin, origin === 0 ? 0 : 0.5);
}

export class Hud {
  constructor(scene) {
    this.scene = scene;
    const d = DEPTH.hud;
    this.score = this.text(3, 2, '00000000', 0).setDepth(d);
    this.mult = this.text(57, 2, '×1', 0).setDepth(d);
    this.bar = scene.add.graphics().setDepth(d);
    this.lives = [];
    for (let i = 0; i < 6; i++) this.lives.push(scene.add.image(7 + i * 9, 20, 'sprites', 'icon_life').setDepth(d));
    this.weapon = scene.add.image(7, 0, 'sprites', 'wpn_basic').setDepth(d);
    this.pips = [];
    for (let i = 0; i < PLAYER.maxPower; i++) this.pips.push(scene.add.image(15 + i * 5, 0, 'sprites', 'pip_off').setDepth(d));
    this.bombBtn = scene.add.image(0, 0, 'sprites', 'btn_bomb').setDepth(d);
    this.pauseBtn = scene.add.image(W - 10, 10, 'sprites', 'btn_pause').setDepth(d).setAlpha(0.7);
    this.soundBtn = scene.add.image(W - 28, 10, 'sprites', 'btn_sound_on').setDepth(d).setAlpha(0.7);
    this.boss = scene.add.graphics().setDepth(d);
    this.banner = this.text(W / 2, 0, '', 0.5).setDepth(d + 1);
    this.bannerSub = this.text(W / 2, 0, '', 0.5).setDepth(d + 1);
    this.bannerT = 0;
    this.blinkBanner = false;
    // the boss card: a band sliding across with the boss's name
    this.cardBand = scene.add.rectangle(0, 0, W, 34, 0x0b0a12, 0.96).setOrigin(0, 0.5).setDepth(d + 2).setVisible(false);
    this.cardLines = scene.add.graphics().setDepth(d + 2);
    this.cardWarn = this.text(W / 2, 0, 'UWAGA!', 0.5).setDepth(d + 3).setTint(0xff6a50).setVisible(false);
    this.cardName = this.text(W / 2, 0, '', 0.5).setDepth(d + 3).setScale(2).setVisible(false);
    this.cardSub = this.text(W / 2, 0, '', 0.5).setDepth(d + 3).setTint(0xf08bb0).setVisible(false);
    this.cardT = 0;
    this.cardMax = 1;
    this.overlay = scene.add.rectangle(0, 0, W, VIEW.maxHeight, 0x0b0a12, 0.6).setOrigin(0, 0).setDepth(DEPTH.overlay).setVisible(false);
    this.overlayItems = [];
    this.layout(scene.H);
  }

  text(x, y, str, origin = 0.5) {
    return pixelText(this.scene, x, y, str, origin);
  }

  layout(H) {
    this.H = H;
    this.weapon.setPosition(8, H - 8);
    this.pips.forEach((p, i) => p.setPosition(18 + i * 5, H - 8));
    this.bombBtn.setPosition(W - 18, H - 18);
    this.banner.y = Math.round(H * 0.36);
    this.bannerSub.y = Math.round(H * 0.36) + LINE;
  }

  hitPause(p) {
    return Math.hypot(p.x - this.pauseBtn.x, p.y - this.pauseBtn.y) < 13;
  }

  hitSound(p) {
    return Math.hypot(p.x - this.soundBtn.x, p.y - this.soundBtn.y) < 10;
  }

  hitBomb(p) {
    return Math.hypot(p.x - this.bombBtn.x, p.y - this.bombBtn.y) < 20;
  }

  show(title, sub = '', time = 2, blink = false) {
    this.banner.setText(title).setVisible(true);
    this.bannerSub.setText(sub).setVisible(true);
    this.bannerT = time;
    this.blinkBanner = blink;
  }

  /** The boss card: name and title slide in on a dark band, hold, and slide away. */
  card(name, sub, time = 2.8) {
    this.cardName.setText(name);
    this.cardSub.setText(sub);
    this.cardT = time;
    this.cardMax = time;
  }

  updateCard(dt) {
    const on = this.cardT > 0;
    for (const o of [this.cardBand, this.cardWarn, this.cardName, this.cardSub]) o.setVisible(on);
    this.cardLines.clear();
    if (!on) return;
    this.cardT -= dt;
    const el = this.cardMax - this.cardT;
    const slide = 0.25;
    const ox = el < slide ? -W * (1 - el / slide) ** 2 : this.cardT < slide ? W * (1 - this.cardT / slide) ** 2 : 0;
    const y = Math.round(this.H * 0.34);
    this.cardBand.setPosition(Math.round(ox), y);
    this.cardLines.fillStyle(0xe2421f, 1).fillRect(Math.round(ox), y - 18, W, 2);
    this.cardLines.fillStyle(0xe2421f, 1).fillRect(Math.round(ox), y + 16, W, 2);
    this.cardLines.fillStyle(0xffe080, 1).fillRect(Math.round(ox), y - 16, W, 1);
    this.cardWarn.setPosition(Math.round(W / 2 + ox), y - 26).setVisible(Math.floor(el * 6) % 2 === 0);
    this.cardName.setPosition(Math.round(W / 2 + ox), y - 4);
    this.cardSub.setPosition(Math.round(W / 2 + ox), y + 10);
  }

  /** Full-screen panel (title, pause, results). lines: [text, tint?] or {sprite, x, y}. */
  panel(lines) {
    this.closePanel();
    this.overlay.setVisible(true).setSize(W, this.H);
    const height = (l) => (!l ? LINE / 2 : Array.isArray(l) ? LINE * (l[2] ?? 1) : LINE);
    const total = lines.reduce((sum, l) => sum + height(l), 0);
    let y = Math.round(this.H / 2 - total / 2);
    for (const line of lines) {
      if (line && line.sprite) {
        // legend row: icon + left-aligned label
        this.overlayItems.push(this.scene.add.image(line.x, y + 7, 'sprites', line.sprite).setDepth(DEPTH.overlay + 1));
        const t = this.text(line.x + 9, y, line.text, 0).setDepth(DEPTH.overlay + 1).setTint(line.tint ?? 0xffffff);
        this.overlayItems.push(t);
        y += LINE;
        continue;
      }
      const [str, tint = 0xffffff, scale = 1, blink = false] = Array.isArray(line) ? line : [line];
      if (str) {
        const t = this.text(W / 2, y + 7 * scale, str).setDepth(DEPTH.overlay + 1).setTint(tint).setScale(scale);
        t.blink = blink;
        this.overlayItems.push(t);
      }
      y += height(line);
    }
  }

  closePanel() {
    this.overlay.setVisible(false);
    for (const t of this.overlayItems) t.destroy();
    this.overlayItems = [];
  }

  update(dt) {
    const s = this.scene;
    const p = s.player;
    this.score.setText(String(Math.min(99999999, s.score.score)).padStart(8, '0'));
    this.mult.setText(`×${s.score.mult}`).setTint(s.score.mult >= SCORE.multiplierMax ? 0xffd060 : 0xffffff);
    this.bar.clear();
    this.bar.fillStyle(0x120e1a, 1).fillRect(57, 13, 22, 3);
    this.bar.fillStyle(s.score.mult >= SCORE.multiplierMax ? 0xffd060 : 0xf08bb0, 1).fillRect(58, 14, Math.round(20 * s.score.fraction), 1);
    if (p.heatOn) {
      // Beppu gun heat: grey, orange from the hot mark on (tick), blinking red while jammed
      const y = this.H - 10;
      const c = p.jam > 0 ? (Math.floor(p.jam * 8) % 2 ? 0xff4a3a : 0x6a1a14) : p.heat >= HEAT.boostAt ? 0xffa040 : 0x9ab4c4;
      this.bar.fillStyle(0x120e1a, 1).fillRect(44, y, 24, 4);
      this.bar.fillStyle(c, 1).fillRect(45, y + 1, Math.round(22 * p.heat), 2);
      this.bar.fillStyle(0xffffff, 0.55).fillRect(45 + Math.round(22 * HEAT.boostAt), y, 1, 4);
    }
    if (p.beanT > 0) {
      // Setsubun beans left
      const y = this.H - 16;
      this.bar.fillStyle(0x120e1a, 1).fillRect(44, y, 24, 4);
      this.bar.fillStyle(0xf0c878, 1).fillRect(45, y + 1, Math.round((22 * p.beanT) / BEANS.time), 2);
    }
    this.lives.forEach((img, i) => img.setVisible(i < p.lives).setFrame(p.ship.life));
    this.weapon.setFrame(WEAPON_ICON[p.weapon]);
    this.pips.forEach((pip, i) => pip.setFrame(i < p.level ? 'pip_on' : 'pip_off'));
    this.bombBtn.setAlpha(p.bombs > 0 ? 0.8 : 0.22);
    if (p.bombs === 0 && p.grazeCharge > 0) {
      // the ring round the bomb button fills with every graze
      const a = -Math.PI / 2;
      this.bar.lineStyle(2, 0xffe080, 0.85);
      this.bar.beginPath();
      this.bar.arc(this.bombBtn.x, this.bombBtn.y, 15, a, a + (Math.PI * 2 * p.grazeCharge) / GRAZE.perBomb);
      this.bar.strokePath();
    }
    this.soundBtn.setFrame(s.music.enabled ? 'btn_sound_on' : 'btn_sound_off');

    this.boss.clear();
    const bar = s.enemies.bossBar();
    if (bar) {
      const w = 100;
      const x = Math.round(W / 2 - w / 2);
      this.boss.fillStyle(0x120e1a, 1).fillRect(x - 1, 27, w + 2, 4);
      this.boss.fillStyle(0xe2421f, 1).fillRect(x, 28, Math.max(0, Math.round((w * bar.hp) / bar.max)), 2);
    }

    this.updateCard(dt);
    if (this.bannerT > 0) {
      this.bannerT -= dt;
      const vis = this.bannerT > 0 && (!this.blinkBanner || Math.floor(this.bannerT * 6) % 2 === 0);
      this.banner.setVisible(vis);
      this.bannerSub.setVisible(vis);
    }
    const blinkOn = Math.floor(s.time.now / 400) % 2 === 0;
    for (const t of this.overlayItems) if (t.blink) t.setVisible(blinkOn);
  }
}
