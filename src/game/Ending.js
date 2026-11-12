import { DEPTH, RENDER_SCALE, SHIPS, VIEW } from '../config.js';
import { STAGES } from '../data/stages.js';
import { isEasy } from '../difficulty.js';
import { INK_FONT } from '../scenes/Boot.js';
import { pixelText } from './Hud.js';
import { JapanMap } from './JapanMap.js';
import { INK } from './Stamps.js';
import { portrait } from './enemyArt.js';
import { sharedArt } from './enemyArt.js';

const W = VIEW.width;
const D = DEPTH.overlay + 2;
const FINE = 1 / RENDER_SCALE; // its art is drawn at 540 px
// the bosses as they stand in the parade: [frame, dx, dy, flip] round their centre (Kyūbi's tails fan out from
// 7 px under its body, outer ones first, the right-hand ones mirrored)
const KYUBI = [0, 8, 1, 7, 2, 6, 3, 5, 4].map((i) => [`kyubi_tail_${Math.min(i, 8 - i)}_${i % 3}`, 0, 7, i > 4]);
const BOSSES = {
  stage8: [['n_segment', -22, 4], ['n_segment', 22, 4], ['n_ja_0', 0, 0]],
  stage1: [...KYUBI, ['kyubi_idle', 0, 0]],
  stage2: [['shisa_a_0', -24, 0], ['shisa_un_0', 24, 0]],
  stage3: [['kuma_0', 0, 0]],
  stage4: [['vent_0', -36, 8], ['vent_0', 36, 8], ['crater_0', 0, 0]],
  stage5: [['tako_0', 0, 0]],
  stage6: [['oni_0', 0, 0]],
  stage7: [['brazier_0', -30, 4], ['brazier_0', 30, 4], ['sankibo_0', 0, 0]],
};

/**
 * The end of the journey, after the last city's results, in five scenes (a tap or Enter skips to the next):
 * the map with the whole route and the ship flying away; the six cities' seals pressed in turn; the summary
 * of the game; the bosses passing by like the credits; and Mt Fuji at sunrise, the logo pressed on, thanks
 * for playing, then back to the title.
 */
export class Ending {
  constructor(scene) {
    this.scene = scene;
    this.run = scene.run;
    this.order = scene.order;
    this.H = scene.H;
    this.items = [];
    this.scenes = ['map', 'seals', 'stats', 'parade', 'fuji'];
    this.k = -1;
    scene.music.play('ending', true);
    this.next();
  }

  add(o) {
    this.items.push(o);
    return o;
  }

  text(x, y, str, tint = 0xffffff, font) {
    return this.add(pixelText(this.scene, x, y, str, 0.5, font).setDepth(D + 4).setTint(tint));
  }

  clear() {
    for (const o of this.items) o.destroy();
    this.items = [];
    this.japan?.destroy();
    this.japan = null;
    this.scene.hud.closePanel();
  }

  /** On to the next scene (the last one leaves for the title once it has been up a moment). */
  next() {
    if (this.scenes[this.k] === 'fuji') {
      if (this.t > 1.5) this.scene.scene.restart({});
      return;
    }
    this.clear();
    this.k++;
    this.t = 0;
    this[this.scenes[this.k]]();
  }

  tap() {
    this.next();
  }

  layout(H) {
    this.H = H;
    if (this.japan) return this.japan.layout(H);
    // the other scenes are simply set up again for the new height
    this.k--;
    this.next();
  }

  // ---------------------------------------------------------------- 1. the map: the whole route, the ship flies off
  map() {
    this.japan = new JapanMap(this.scene, STAGES, this.order, this.order.length - 1, true);
  }

  // ---------------------------------------------------------------- 2. the cities' seals pressed in turn
  seals() {
    const s = this.scene;
    const H = this.H;
    // a sheet of washi, ruled in red, a gilt corner in each of its corners
    this.add(s.add.tileSprite(0, 0, W, H, 'menu_washi').setTileScale(FINE, FINE).setOrigin(0, 0).setDepth(D));
    const g = this.add(s.add.graphics().setDepth(D + 0.5));
    g.lineStyle(0.67, 0xa8321a, 0.9).strokeRect(5, 5, W - 10, H - 10);
    g.lineStyle(0.34, 0xa8321a, 0.7).strokeRect(7.33, 7.33, W - 14.66, H - 14.66);
    g.lineStyle(0.34, 0xa8321a, 0.8).lineBetween(36, 25, W - 36, 25);
    this.text(W / 2, 16, 'PIECZĘCIE PODRÓŻY', 0x5a2a20, INK_FONT);
    const n = this.order.length;
    const rows = Math.ceil(n / 2);
    const step = rows > 3 ? Math.min(64, Math.floor((H - 88) / rows)) : 66;
    const labelDy = rows > 3 ? 26 : 28;
    const top = Math.round((H - 12 - (rows - 1) * step - labelDy) / 2) + 8;
    this.sealing = this.order.map((i, k) => {
      const id = STAGES[i].id;
      const x = k === n - 1 && k % 2 === 0 ? W / 2 : k % 2 ? 134 : 46;
      const y = top + Math.floor(k / 2) * step;
      const img = this.add(s.add.image(x, y, 'menu', `seal_${id}`).setDepth(D + 2).setTint(INK[id]).setAlpha(0));
      const size = img.width / 6 > 40 ? 1.5 / 6 : 2 / 6; // (Kagoshima's three kanji: a smaller seal, so it fits its column)
      const label = this.text(x, y + labelDy, STAGES[i].name, 0x3a2a24, INK_FONT).setVisible(false);
      const won = this.run.stamps.includes(id);
      const mark = won ? this.add(s.add.image(x + Math.ceil(label.width / 2) + 7, y + labelDy, 'menu', 'icon_stamp').setScale(FINE * 0.62).setDepth(D + 3).setVisible(false)) : null;
      return { img, label, mark, size, at: 0.6 + k * 0.5, done: false };
    });
    const got = this.run.stamps.length;
    this.tally = this.text(W / 2, H - 30, `PIECZĄTKI: ${got} / ${n}`, 0x5a2a20, INK_FONT).setVisible(false);
    this.full = got >= n ? this.text(W / 2, H - 16, 'KOMPLET W JEDNEJ GRZE!', 0xb83018, INK_FONT).setVisible(false) : null;
  }

  // ---------------------------------------------------------------- 3. the summary of the game
  stats() {
    const s = this.scene;
    const r = this.run;
    const n = this.order.length;
    this.add(s.add.tileSprite(0, 0, W, this.H, 'ending_night').setTileScale(FINE, FINE).setOrigin(0, 0).setDepth(DEPTH.overlay - 0.5));
    this.add(s.add.image(0, this.H, 'menu', 'night_ridge').setOrigin(0, 1).setScale(FINE).setDepth(DEPTH.overlay + 0.2));
    const hi = s.lastHi ?? { isNew: false, value: s.score.score };
    const min = Math.floor(r.time / 60);
    const sec = Math.floor(r.time % 60);
    const got = r.stamps.length;
    s.hud.panel([
      ['PODRÓŻ', 0xffd6e5, 2],
      ['UKOŃCZONA', 0xffd6e5, 2],
      ...s.modeLines(),
      '',
      ['WYNIK', 0xb0aec0],
      [String(s.score.score).padStart(8, '0'), 0xffffff, 2],
      hi.isNew ? ['NOWY REKORD!', 0xffe080, 1, true] : [`REKORD ${String(hi.value).padStart(8, '0')}`, 0xb0aec0],
      '',
      [`STATEK: ${SHIPS[s.shipIndex].name}`, 0xffffff],
      [`STRACONE STATKI: ${r.deaths}`, 0xffffff],
      [`UŻYTE BOMBY: ${r.bombs}`, 0xffffff],
      [`CZAS GRY: ${min}:${String(sec).padStart(2, '0')}`, 0xffffff],
      [`PIECZĄTKI: ${got} / ${n}`, 0xffe080],
      '',
      got >= n ? ['KOMPLET W JEDNEJ GRZE!', 0xffe080, 1, true] : r.deaths === 0 ? ['BEZ ANI JEDNEJ STRATY!', 0xffe080, 1, true] : isEasy() ? ['SPRÓBUJ NA NORMALNYM', 0x9cf09a] : '',
    ]);
    s.hud.framePanel();
  }

  // ---------------------------------------------------------------- 4. the bosses passing by, like the credits
  parade() {
    const s = this.scene;
    const H = this.H;
    this.night = this.add(s.add.tileSprite(0, 0, W, H, 'ending_night').setTileScale(FINE, FINE).setOrigin(0, 0).setDepth(D));
    this.add(s.add.rectangle(0, 0, W, 28, 0x0a0c20, 0.92).setOrigin(0, 0).setDepth(D + 5));
    const rule = this.add(s.add.graphics().setDepth(D + 5.5));
    rule.lineStyle(0.67, 0xd8b878, 0.9).lineBetween(0, 28, W, 28);
    rule.lineStyle(0.34, 0x8a7240, 0.9).lineBetween(0, 30, W, 30);
    this.add(pixelText(s, W / 2, 14, 'BOSSOWIE PODRÓŻY').setDepth(D + 6).setTint(0xffd6e5));
    this.groups = this.order.map((i, k) => {
      const st = STAGES[i];
      const card = st.waves.find((w) => w.type === 'boss')?.card ?? [st.name, ''];
      // (their portraits drawn at 540 px where there are any)
      const kids = (BOSSES[st.id] ?? []).map(([f, dx, dy, flip]) => {
        const img = s.add.image(dx, dy, 'sprites', f).setFlipX(!!flip);
        return img.setScale(portrait(s, img, f));
      });
      const c = this.add(s.add.container(W / 2, H + 60 + k * 128, kids).setDepth(D + 2));
      const name = this.text(W / 2, 0, card[0], 0xffe080);
      const sub = this.text(W / 2, 0, card[1], 0xb0aec0);
      const city = this.text(W / 2, 0, st.name, 0xf08bb0);
      return { c, name, sub, city };
    });
  }

  // ---------------------------------------------------------------- 5. Fuji at sunrise, thanks for playing
  fuji() {
    const s = this.scene;
    const H = this.H;
    const top = Math.round((H - 420) / 2);
    this.add(s.add.rectangle(0, 0, W, H, 0x0c0e2c).setOrigin(0, 0).setDepth(D));
    this.add(s.add.image(0, top, 'ending').setOrigin(0, 0).setScale(FINE).setDepth(D + 0.5));
    this.clouds = this.add(s.add.tileSprite(0, top + 236, W, 34, 'ending_clouds').setTileScale(FINE, FINE).setOrigin(0, 0).setDepth(D + 0.6).setAlpha(0.85));
    // the ship flying past the mountain towards the sun, its engine burning
    const ship = SHIPS[s.shipIndex];
    this.ship = this.add(sharedArt(s.add.sprite(-20, H + 20, 'sprites', ship.frame)).setDepth(D + 1));
    this.flame = this.add(sharedArt(s.add.sprite(0, 0, 'sprites', 'flame_0')).setDepth(D + 0.9).play('flame'));
    this.flameY = ship.flameY;
    // petals drifting off the branch and the trees
    this.petals = [];
    for (let i = 0; i < 22; i++) this.petals.push(this.add(s.add.image(0, 0, 'menu', `petal_${i % 2}`).setScale(FINE).setDepth(D + 1.5)));
    for (const p of this.petals) this.petal(p, true);
    this.logo = this.add(s.add.image(W / 2, 26, 'menu', 'logo').setDepth(D + 3).setAlpha(0));
    this.ribbon = this.add(s.add.image(W / 2, 46, 'menu', 'ribbon').setScale(FINE).setDepth(D + 3).setAlpha(0));
    this.thanks = this.text(W / 2, 46, 'DZIĘKUJEMY ZA GRĘ', 0xffe8f0).setAlpha(0);
    this.hint = this.text(W / 2, H - 14, 'DOTKNIJ / ENTER', 0xffe080).setVisible(false);
    this.pressed = false;
  }

  petal(p, anywhere = false) {
    p.x = anywhere ? Math.random() * W : -4 - Math.random() * 30;
    p.y = anywhere ? Math.random() * this.H : Math.random() * this.H * 0.6;
    p.vx = 10 + Math.random() * 12;
    p.vy = 8 + Math.random() * 10;
    p.ph = Math.random() * 6;
    p.setAlpha(0.7 + Math.random() * 0.3);
  }

  update(dt) {
    this.t += dt;
    const s = this.scene;
    const scene = this.scenes[this.k];
    if (scene === 'map') {
      this.japan.update(dt);
      if (this.japan.ready && (this.doneT = (this.doneT ?? 0) + dt) > 1.2) {
        this.doneT = 0;
        this.next();
      }
    } else if (scene === 'seals') {
      let all = true;
      for (const q of this.sealing) {
        const k = Math.max(0, Math.min(1, (this.t - q.at) / 0.22));
        q.img.setScale(q.size * (1 + (1 - k * k) * 1.3)).setAlpha(this.t < q.at ? 0 : Math.min(1, k * 2) * 0.95);
        if (k >= 1 && !q.done) {
          q.done = true;
          q.label.setVisible(true);
          q.mark?.setVisible(true);
          s.sfx.stamp();
          s.cameras.main.shake(120, 0.005);
        }
        all &&= q.done;
      }
      if (all) {
        this.tally.setVisible(true);
        this.full?.setVisible(Math.floor(this.t * 3) % 2 === 0);
        if ((this.doneT = (this.doneT ?? 0) + dt) > 2.6) {
          this.doneT = 0;
          this.next();
        }
      }
    } else if (scene === 'stats') {
      if (this.t > 9) this.next();
    } else if (scene === 'parade') {
      const y0 = this.H + 60 - this.t * 34;
      this.night.tilePositionY = -this.t * 12 * RENDER_SCALE; // (the sky further off than the bosses)
      this.groups.forEach((gr, k) => {
        const y = Math.round(y0 + k * 128);
        gr.c.y = y;
        gr.name.y = y + 40;
        gr.sub.y = y + 52;
        gr.city.y = y + 64;
      });
      if (y0 + (this.groups.length - 1) * 128 + 70 < 20) this.next();
    } else if (scene === 'fuji') {
      const H = this.H;
      this.clouds.tilePositionX += dt * 4 * RENDER_SCALE;
      // the ship's flight: up from the bottom left, past the mountain, away into the sunrise
      const f = Math.min(1, this.t / 7);
      const e = f * f * (3 - 2 * f);
      const x = -20 + e * 230;
      const y = H + 20 - e * (H * 0.62);
      const dx = 230;
      const dy = -H * 0.62;
      const a = Math.atan2(dy, dx) + Math.PI / 2;
      this.ship.setPosition(Math.round(x), Math.round(y)).setRotation(a).setScale(1 - e * 0.45);
      this.flame.setPosition(Math.round(x - Math.sin(a) * this.flameY * (1 - e * 0.45)), Math.round(y + Math.cos(a) * this.flameY * (1 - e * 0.45))).setRotation(a).setScale(1 - e * 0.45);
      for (const p of this.petals) {
        p.x += (p.vx + Math.sin(this.t * 2 + p.ph) * 8) * dt;
        p.y += p.vy * dt;
        p.rotation += dt * 2;
        if (p.x > W + 6 || p.y > H + 6) this.petal(p);
      }
      // the logo pressed on like a stamp, then the thanks, then the way back
      const k = Math.max(0, Math.min(1, (this.t - 1.2) / 0.22));
      this.logo.setScale((1 + (1 - k * k) * 1.6) / 3).setAlpha(this.t < 1.2 ? 0 : Math.min(1, k * 2));
      if (k >= 1 && !this.pressed) {
        this.pressed = true;
        s.sfx.stamp();
        s.cameras.main.shake(140, 0.006);
      }
      this.thanks.setAlpha(Math.max(0, Math.min(1, (this.t - 2) / 0.8)));
      this.ribbon.setAlpha(this.thanks.alpha);
      this.hint.setVisible(this.t > 3 && Math.floor(this.t * 2.5) % 2 === 0);
    }
  }
}
