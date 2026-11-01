import { BEANS, DEPTH, HEAT, PLAYER, SCORE, VIEW } from '../config.js';
import { isEasy, rules } from '../difficulty.js';
import { FONT } from '../scenes/Boot.js';
import { getLang, tr } from '../i18n.js';
import { canInstall } from '../pwa.js';

const W = VIEW.width;
// Line pitch for panels: 7px glyphs + raised Polish accents need 14px to never touch the line above.
const LINE = 14;
const WEAPON_ICON = { basic: 'wpn_basic', spread: 'wpn_spread', laser: 'wpn_laser', homing: 'wpn_homing' };

/**
 * Bitmap text that always lands on whole pixels. Phaser's bitmap text ignores vertex rounding, and an
 * origin of 0.5 on an odd width (or the 13 px line) puts every glyph on a half pixel; some GPUs (iPhone)
 * then sample the font a texel off and letters lose their top row (O turns into U, A into H). So the
 * display origin is floored whenever the text is measured; callers pass whole-pixel positions.
 * The text comes out in the language chosen (see i18n.js). font: FONT, or INK_FONT on light paper.
 */
export function pixelText(scene, x, y, str, origin = 0.5, font = FONT) {
  const t = scene.add.bitmapText(Math.round(x), Math.round(y), font, tr(str)).setLetterSpacing(-1);
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
    this.easy = this.text(84, 2, 'ŁATWY', 0).setDepth(d).setTint(0x9cf09a).setAlpha(0.7).setVisible(false); // easy mode, in play
    this.bar = scene.add.graphics().setDepth(d);
    this.lives = [];
    for (let i = 0; i < 6; i++) this.lives.push(scene.add.image(7 + i * 9, 20, 'sprites', 'icon_life').setDepth(d));
    this.weapon = scene.add.image(7, 0, 'sprites', 'wpn_basic').setDepth(d);
    this.pips = [];
    for (let i = 0; i < PLAYER.maxPower; i++) this.pips.push(scene.add.image(15 + i * 5, 0, 'sprites', 'pip_off').setDepth(d));
    this.bombBtn = scene.add.image(0, 0, 'sprites', 'btn_bomb').setDepth(d);
    this.pauseBtn = scene.add.image(W - 10, 10, 'sprites', 'btn_pause').setDepth(d).setAlpha(0.7);
    this.soundBtn = scene.add.image(W - 28, 10, 'sprites', 'btn_sound_on').setDepth(d).setAlpha(0.7);
    this.bookBtn = scene.add.image(12, 12, 'sprites', 'btn_book').setDepth(DEPTH.overlay + 3).setVisible(false); // on the title screen
    // the language switch, under it: PL EN, the one in use lit
    this.langPl = pixelText(scene, 8, 29, 'PL').setDepth(DEPTH.overlay + 3).setVisible(false);
    this.langEn = pixelText(scene, 22, 29, 'EN').setDepth(DEPTH.overlay + 3).setVisible(false);
    this.installBtn = scene.add.image(12, 46, 'sprites', 'btn_install').setDepth(DEPTH.overlay + 3).setAlpha(0.85).setVisible(false);
    // the stamp still to be won in this city: its seal under the lives, fading away after a death or a bomb
    this.stampIcon = scene.add.image(7, 30, 'sprites', 'stamp_icon').setDepth(d).setVisible(false);
    this.stampFade = 0;
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
    // the city card at the start of a stage: the city's seal pressed on a slip of paper above its name (the
    // paper shows through the kanji cut out of it)
    this.sealPaper = scene.add.rectangle(W / 2, 0, 1, 1, 0xf0e4c8).setDepth(d + 1).setVisible(false);
    this.seal = scene.add.image(W / 2, 0, 'sprites', 'seal_stage1').setDepth(d + 1).setVisible(false);
    this.sealT = 0;
    this.sealMax = 1;
    this.sealLanded = false;
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

  hitBook(p) {
    return this.bookBtn.visible && Math.hypot(p.x - this.bookBtn.x, p.y - this.bookBtn.y) < 12;
  }

  hitInstall(p) {
    return this.installBtn.visible && Math.hypot(p.x - this.installBtn.x, p.y - this.installBtn.y) < 10;
  }

  hitLang(p) {
    return this.langPl.visible && p.x < 34 && p.y > 21 && p.y < 38;
  }

  hitBomb(p) {
    return Math.hypot(p.x - this.bombBtn.x, p.y - this.bombBtn.y) < 20;
  }

  show(title, sub = '', time = 2, blink = false) {
    this.banner.setText(tr(title)).setVisible(true);
    this.bannerSub.setText(tr(sub)).setVisible(true);
    this.bannerT = time;
    this.blinkBanner = blink;
  }

  /** The city card: its seal (the kanji of its name, in its ink) comes down with a thump over the stage's title. */
  cityCard(frame, tint, title, sub, time = 2.8) {
    this.seal.setFrame(frame).setTint(tint).setVisible(true).setAlpha(0);
    this.sealPaper.setSize(this.seal.width - 2, this.seal.height - 2).setVisible(true).setAlpha(0);
    this.sealT = time;
    this.sealMax = time;
    this.sealLanded = false;
    this.show(title, sub, time);
  }

  updateSeal(dt) {
    if (this.sealT <= 0) return;
    this.sealT -= dt;
    const el = this.sealMax - this.sealT;
    const k = Math.max(0, Math.min(1, (el - 0.1) / 0.2));
    const y = Math.round(this.H * 0.36) - 34;
    const scale = 2 + 2.4 * (1 - k) ** 2;
    const a = el < 0.1 ? 0 : Math.min(1, k * 3, this.sealT / 0.4);
    this.seal.setY(y).setScale(scale).setAlpha(a);
    this.sealPaper.setPosition(W / 2, y).setScale(scale).setAlpha(a * 0.95);
    if (k >= 1 && !this.sealLanded) {
      this.sealLanded = true;
      this.scene.sfx.stamp();
      this.scene.cameras.main.shake(120, 0.005);
    }
    if (this.sealT <= 0) {
      this.seal.setVisible(false);
      this.sealPaper.setVisible(false);
    }
  }

  /** The boss card: name and title slide in on a dark band, hold, and slide away. */
  card(name, sub, time = 2.8) {
    this.cardWarn.setText(tr('UWAGA!'));
    this.cardName.setText(tr(name));
    this.cardSub.setText(tr(sub));
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

  /** Full-screen panel (title, pause, results). lines: [text, tint?], {sprite, x, text} or {image, h} (centred). */
  panel(lines) {
    this.closePanel();
    this.overlay.setVisible(true).setSize(W, this.H);
    const height = (l) => (!l ? LINE / 2 : l.image ? l.h : Array.isArray(l) ? LINE * (l[2] ?? 1) : LINE);
    const total = lines.reduce((sum, l) => sum + height(l), 0);
    let y = Math.round(this.H / 2 - total / 2);
    for (const line of lines) {
      if (line && line.image) {
        this.overlayItems.push(this.scene.add.image(W / 2, y + line.h / 2, 'sprites', line.image).setDepth(DEPTH.overlay + 1));
        y += line.h;
        continue;
      }
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
    const maxed = s.score.mult >= SCORE.multiplierMax;
    this.mult.setText(`×${s.score.mult}`).setTint(maxed ? 0xffd060 : 0xffffff);
    // the bars are drawn again only when something on them changes
    const heatC = p.heatOn ? (p.jam > 0 ? (Math.floor(p.jam * 8) % 2 ? 0xff4a3a : 0x6a1a14) : p.heat >= HEAT.boostAt ? 0xffa040 : 0x9ab4c4) : 0;
    const key = [Math.round(20 * s.score.fraction), maxed, heatC, p.heatOn ? Math.round(22 * p.heat) : -1, p.beanT > 0 ? Math.round((22 * p.beanT) / BEANS.time) : -1, p.bombs === 0 ? p.grazeCharge : 0, this.H].join();
    if (key !== this.barKey) {
      this.barKey = key;
      this.bar.clear();
      this.bar.fillStyle(0x120e1a, 1).fillRect(57, 13, 22, 3);
      this.bar.fillStyle(maxed ? 0xffd060 : 0xf08bb0, 1).fillRect(58, 14, Math.round(20 * s.score.fraction), 1);
      if (p.heatOn) {
        // Beppu gun heat: grey, orange from the hot mark on (tick), blinking red while jammed
        const y = this.H - 10;
        this.bar.fillStyle(0x120e1a, 1).fillRect(44, y, 24, 4);
        this.bar.fillStyle(heatC, 1).fillRect(45, y + 1, Math.round(22 * p.heat), 2);
        this.bar.fillStyle(0xffffff, 0.55).fillRect(45 + Math.round(22 * HEAT.boostAt), y, 1, 4);
      }
      if (p.beanT > 0) {
        // Setsubun beans left
        const y = this.H - 16;
        this.bar.fillStyle(0x120e1a, 1).fillRect(44, y, 24, 4);
        this.bar.fillStyle(0xf0c878, 1).fillRect(45, y + 1, Math.round((22 * p.beanT) / BEANS.time), 2);
      }
      if (p.bombs === 0 && p.grazeCharge > 0) {
        // the ring round the bomb button fills with every graze
        const a = -Math.PI / 2;
        this.bar.lineStyle(2, 0xffe080, 0.85);
        this.bar.beginPath();
        this.bar.arc(this.bombBtn.x, this.bombBtn.y, 15, a, a + (Math.PI * 2 * p.grazeCharge) / rules().grazePerBomb);
        this.bar.strokePath();
      }
    }
    this.lives.forEach((img, i) => img.setVisible(i < p.lives).setFrame(p.ship.life));
    this.weapon.setFrame(WEAPON_ICON[p.weapon]);
    this.pips.forEach((pip, i) => pip.setFrame(i < p.level ? 'pip_on' : 'pip_off'));
    this.bombBtn.setAlpha(p.bombs > 0 ? 0.8 : 0.22);
    this.soundBtn.setFrame(s.music.enabled ? 'btn_sound_on' : 'btn_sound_off');
    this.bookBtn.setVisible(s.state === 'title');
    this.installBtn.setVisible(s.state === 'title' && canInstall());
    const en = getLang() === 'en';
    this.langPl.setVisible(s.state === 'title').setTint(en ? 0x6a6a80 : 0xffe080);
    this.langEn.setVisible(s.state === 'title').setTint(en ? 0xffe080 : 0x6a6a80);
    if (this.easy.visible !== (s.state === 'play' && isEasy())) this.easy.setText(tr('ŁATWY')).setVisible(!this.easy.visible);
    const seal = s.state === 'play' && s.stampEligible && !s.stampOwned;
    if (seal && s.stampChance) {
      this.stampIcon.setVisible(true).setTint(s.stampInk).setAlpha(isEasy() ? 0.6 : 0.95).setX(7); // paler on easy
      this.stampFade = 1.2;
    } else if (seal && this.stampFade > 0) {
      this.stampFade -= dt;
      this.stampIcon.setVisible(true).setTint(0x8a8aa8).setAlpha((this.stampFade / 1.2) * 0.8).setX(7 + (Math.floor(this.stampFade * 24) % 2));
    } else this.stampIcon.setVisible(false);

    const bar = s.enemies.bossBar();
    const fill = bar ? Math.max(0, Math.round((100 * bar.hp) / bar.max)) : -1;
    if (fill !== this.bossFill) {
      this.bossFill = fill;
      this.boss.clear();
      if (bar) {
        const x = Math.round(W / 2 - 50);
        this.boss.fillStyle(0x120e1a, 1).fillRect(x - 1, 27, 102, 4);
        this.boss.fillStyle(0xe2421f, 1).fillRect(x, 28, fill, 2);
      }
    }

    this.updateCard(dt);
    this.updateSeal(dt);
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
