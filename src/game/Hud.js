import { DEPTH, PLAYER, SCORE, VIEW } from '../config.js';
import { FONT } from '../scenes/Boot.js';

const W = VIEW.width;
// Line pitch for panels: 7px glyphs + raised Polish accents need 14px to never touch the line above.
const LINE = 14;
const WEAPON_ICON = { basic: 'wpn_basic', spread: 'wpn_spread', laser: 'wpn_laser', homing: 'wpn_homing' };

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
    this.overlay = scene.add.rectangle(0, 0, W, VIEW.maxHeight, 0x0b0a12, 0.6).setOrigin(0, 0).setDepth(DEPTH.overlay).setVisible(false);
    this.overlayItems = [];
    this.layout(scene.H);
  }

  text(x, y, str, origin = 0.5) {
    // 'full' snaps glyph quads to whole pixels even when centred on a half pixel or scaled x2,
    // otherwise some GPUs (iPhone) sample the font texture at texel edges and mangle thin accents
    return this.scene.add
      .bitmapText(x, y, FONT, str)
      .setOrigin(origin, origin === 0 ? 0 : 0.5)
      .setLetterSpacing(-1)
      .setVertexRoundMode('full');
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
    this.lives.forEach((img, i) => img.setVisible(i < p.lives));
    this.weapon.setFrame(WEAPON_ICON[p.weapon]);
    this.pips.forEach((pip, i) => pip.setFrame(i < p.level ? 'pip_on' : 'pip_off'));
    this.bombBtn.setAlpha(p.bombs > 0 ? 0.8 : 0.22);
    this.soundBtn.setFrame(s.music.enabled ? 'btn_sound_on' : 'btn_sound_off');

    this.boss.clear();
    const hv = s.enemies.heavy;
    if (hv && hv.y > 0) {
      const w = 100;
      const x = Math.round(W / 2 - w / 2);
      this.boss.fillStyle(0x120e1a, 1).fillRect(x - 1, 27, w + 2, 4);
      this.boss.fillStyle(0xe2421f, 1).fillRect(x, 28, Math.max(0, Math.round((w * hv.hp) / hv.def.hp)), 2);
    }

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
