import { DEPTH, VIEW } from '../config.js';
import { farShore, nearShore, hillRoad } from '../data/nagasakiView.js';

// The night view from Mount Inasa, behind the mid strip: the strip is clear above the summit ridge, so as the climb
// crests the view rises from behind the trees, its layers sliding into place at their own speeds (the sky still,
// the far hills and the city across the harbour slower than the near wooded slope), and shifting a little with
// the ship from side to side. The dragon is fought over it, dimmed; when it falls the city's lights flare up.
// Seven pre-rendered layers (including four light masks), 24 light points, three ferries with wakes and one
// dimming sheet: nothing is made per window or per frame.
const SHIFT = [0, 150, 150, 150, 150, 150, 330]; // px each layer starts below its place, sky to near slope
const SWAY = [0.03, 0.09, 0.09, 0.09, 0.09, 0.09, 0.17]; // how far each layer follows the ship sideways

export class NagasakiView {
  constructor(scene) {
    this.scene = scene;
    this.t = 0; // since the boss went down
    this.done = false;
    this.px = 0;
    this.dim = 0;
    this.flare = 0;
    this.animate = !new URLSearchParams(location.search).has('noprops');
    const names = ['sky', 'city', 'lights0', 'lights1', 'lights2', 'lights3', 'near'];
    const d = DEPTH.mid - 0.5;
    // (the layers are painted at 3x the game's resolution)
    this.layers = names.map((n, i) => scene.add.image(0, 0, `view_stage8_${n}`).setOrigin(0).setScale(1 / 3).setDepth(d + i * 0.01).setVisible(false));
    this.points = Array.from({ length: 36 }, (_, i) => scene.add.image(0, 0, 'props_stage8', `view_car_${i % 2}`).setScale(1 / 3).setDepth(d + 0.055).setVisible(false));
    this.ferries = Array.from({ length: 3 }, () => ({
      boat: scene.add.image(0, 0, 'props_stage8', 'view_ferry_0').setScale(1 / 3).setDepth(d + 0.054).setVisible(false),
      wake: scene.add.image(0, 0, 'props_stage8', 'view_wake').setScale(1 / 3).setDepth(d + 0.053).setVisible(false),
    }));
    // when the dragon falls: fireworks over the harbour; before that, now and then, a shooting star
    this.bursts = Array.from({ length: 6 }, (_, i) => ({
      im: scene.add.image(0, 0, 'props_stage8', 'view_fw_0').setScale(1 / 3).setDepth(d + 0.056).setVisible(false).setBlendMode('ADD'),
      t: -0.7 - i * 0.95,
      x: 0,
      y: 0,
    }));
    this.star = scene.add.image(0, 0, 'props_stage8', 'view_star').setScale(1 / 3).setDepth(d + 0.005).setVisible(false).setBlendMode('ADD');
    this.starT = 4;
    this.shade = scene.add.rectangle(0, 0, VIEW.width, VIEW.maxHeight, 0x020610, 1).setOrigin(0).setDepth(d + 0.07).setAlpha(0).setVisible(false);
  }

  /** How far the view has risen: 0 with the ridge at the top of the screen, 1 when the climb has stopped. */
  progress() {
    const s = this.scene;
    const ridge = s.stage.panorama.ridge;
    const stop = s.parallax.length;
    const p = Math.max(0, Math.min(1, (s.parallax.uTop - ridge) / (stop - ridge)));
    return p * p * (3 - 2 * p);
  }

  update(dt) {
    const s = this.scene;
    const cfg = s.stage.panorama;
    const on = s.parallax.uTop > cfg.ridge;
    for (const l of this.layers) l.setVisible(on);
    this.shade.setVisible(on);
    if (!on) {
      for (const f of this.ferries) {
        f.boat.setVisible(false);
        f.wake.setVisible(false);
      }
      for (const p of this.points) p.setVisible(false);
      for (const b of this.bursts) b.im.setVisible(false);
      this.star.setVisible(false);
      return;
    }
    const e = this.progress();
    const clock = s.t;
    const t = this.animate ? clock : 0;
    // the dragon's fight dims the view (bullets must read over the lights); its fall makes the city flare up
    const g = s.enemies.bossGroup;
    const fighting = g && !g.defeated;
    if (s.bossDown) {
      this.t += dt;
      this.flare = Math.max(0, 1 - this.t / 3.5);
    }
    this.dim += ((fighting ? 0.36 : 0) - this.dim) * Math.min(1, dt * (fighting ? 1.2 : 2.5));
    this.shade.setAlpha(this.dim);
    const ship = s.player?.alive ? s.player.x - VIEW.width / 2 : 0;
    this.px += (ship - this.px) * Math.min(1, dt * 1.5);
    const baseY = (s.H - 420) / 2;
    for (let i = 0; i < this.layers.length; i++) {
      const isLight = i >= 2 && i <= 5;
      const x = Math.round((-18 - this.px * SWAY[i]) * 3) / 3;
      const y = i === 0 ? Math.min(0, baseY) : Math.round((baseY + (1 - e) * SHIFT[i]) * 3) / 3;
      const glow = isLight ? Math.min(1, 0.55 + 0.18 * Math.sin(t * (0.45 + i * 0.09) + i * 2) + 0.1 * Math.sin(t * 1.7 + i) + this.flare * 0.5) : 1;
      this.layers[i].setPosition(x, y).setAlpha(glow);
    }
    const cx = Math.round((-18 - this.px * SWAY[1]) * 3) / 3;
    const cy = Math.round((baseY + (1 - e) * SHIFT[1]) * 3) / 3;
    // headlights one way, tail lights the other, along the waterfront and Inasa's hill road
    for (let i = 0; i < this.points.length; i++) {
      const dir = i % 2 ? 1 : -1;
      const x = (((i * 29) % 216) + (t * dir * (i % 3 === 0 ? 1.6 : 2.4)) + 432) % 216;
      const hill = i % 3 === 0;
      const y = hill ? hillRoad(x) + dir * 0.4 : farShore(x) - 2 + dir * 0.4;
      this.points[i].setVisible(this.animate).setPosition(cx + x, cy + y).setAlpha(0.9);
    }
    for (let i = 0; i < this.ferries.length; i++) {
      const x = 22 + ((i * 57 + t * (0.65 + i * 0.15)) % 108);
      const fy = farShore(x) + (nearShore(x) - farShore(x)) * (0.32 + i * 0.19);
      const { boat, wake } = this.ferries[i];
      boat.setVisible(true).setPosition(cx + x, cy + fy).setAlpha(1);
      boat.setFrame(`view_ferry_${Math.floor(t * 0.8 + i) % 2}`);
      wake.setVisible(this.animate).setPosition(cx + x - 8, cy + fy + 1.5).setAlpha(0.55 + Math.sin(t * 2 + i) * 0.15);
    }
    // a shooting star across the upper sky every so often
    if (this.animate) {
      this.starT -= dt;
      if (this.starT < 0) {
        const age = -this.starT;
        if (age > 0.7) {
          this.starT = 7 + ((clock * 13) % 9);
          this.star.setVisible(false);
        } else {
          const k = age / 0.7;
          const sx = 20 + ((clock * 37) % 110);
          this.star.setVisible(true).setPosition(sx + k * 60, 24 + ((clock * 11) % 26) + k * 22).setAlpha(Math.sin(k * Math.PI) * 0.9);
        }
      }
    }
    // the fireworks: bursts rising over the far shore one after another, their colour flickering on the water's lights
    if (s.bossDown && this.animate) {
      const COLS = [0xff7a8a, 0xffd868, 0x8ae0ff, 0xc8a0ff, 0x9affa8, 0xffb060];
      for (let i = 0; i < this.bursts.length; i++) {
        const b = this.bursts[i];
        b.t += dt;
        if (b.t < 0) continue;
        if (b.t < dt * 1.5) {
          const q = (i * 2.399 + Math.floor(this.t)) % 1;
          b.x = 34 + ((i * 67) % 104) + q * 8;
          b.y = 52 + (i * 29) % 52;
          b.im.setTint(COLS[(i + Math.floor(this.t * 2)) % COLS.length]);
        }
        const life = 1.5;
        if (b.t > life) {
          b.t = this.t > 8.4 ? -999 : -0.5 - (i % 3) * 0.5;
          b.im.setVisible(false);
          continue;
        }
        const fr = Math.min(5, Math.floor((b.t / life) * 6));
        b.im.setVisible(true).setFrame(`view_fw_${fr}`).setPosition(b.x, Math.round(cy) + b.y).setAlpha(b.t > life * 0.6 ? 1 - (b.t - life * 0.6) / (life * 0.4) : 1);
        if (fr === 0) this.flare = Math.max(this.flare, 0.55);
      }
    }
    if (s.bossDown && !this.announced && this.t > 2.6) {
      this.announced = true;
      s.hud.show('INASAYAMA · 333 M', 'ŚWIATŁA PORTU NAGASAKI', 4.5);
    }
    this.done = s.bossDown && this.t >= cfg.hold;
  }
}
