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
    this.layers = names.map((n, i) => scene.add.image(0, 0, `view_stage8_${n}`).setOrigin(0).setDepth(d + i * 0.01).setVisible(false));
    this.traffic = scene.add.blitter(0, 0, 'sprites').setDepth(d + 0.055).setVisible(false);
    this.points = Array.from({ length: 24 }, () => this.traffic.create(0, 0, 'n_traffic'));
    this.ferries = Array.from({ length: 3 }, () => ({
      boat: scene.add.image(0, 0, 'sprites', 'n_view_ferry_0').setDepth(d + 0.054).setVisible(false),
      wake: scene.add.image(0, 0, 'sprites', 'n_view_wake').setDepth(d + 0.053).setVisible(false),
    }));
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
    this.traffic.setVisible(on && this.animate);
    if (!on) {
      for (const f of this.ferries) {
        f.boat.setVisible(false);
        f.wake.setVisible(false);
      }
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
      const x = Math.round(-18 - this.px * SWAY[i]);
      const y = i === 0 ? Math.min(0, baseY) : Math.round(baseY + (1 - e) * SHIFT[i]);
      const glow = isLight ? Math.min(1, 0.55 + 0.18 * Math.sin(t * (0.45 + i * 0.09) + i * 2) + 0.1 * Math.sin(t * 1.7 + i) + this.flare * 0.5) : 1;
      this.layers[i].setPosition(x, y).setAlpha(glow);
    }
    const cx = Math.round(-18 - this.px * SWAY[1]);
    const cy = Math.round(baseY + (1 - e) * SHIFT[1]);
    this.traffic.setPosition(cx, cy);
    for (let i = 0; i < this.points.length; i++) {
      const x = (i * 9 + t * (i % 2 ? 1.2 : -0.8) + 216) % 216;
      const shore = i % 4 === 0 ? hillRoad(x) : i % 3 ? farShore(x) : nearShore(x) + 14;
      this.points[i].setPosition(x, shore).setAlpha(0.4 + 0.2 * Math.sin(t + i));
    }
    for (let i = 0; i < this.ferries.length; i++) {
      const x = 22 + ((i * 57 + t * (0.65 + i * 0.15)) % 164);
      const fy = farShore(x) + (nearShore(x) - farShore(x)) * (0.32 + i * 0.19);
      const { boat, wake } = this.ferries[i];
      boat.setVisible(true).setPosition(cx + x, cy + fy).setAlpha(0.9);
      boat.setFrame(`n_view_ferry_${Math.floor(t * 0.8 + i) % 2}`);
      wake.setVisible(this.animate).setPosition(cx + x - 11, cy + fy + 3).setAlpha(0.55 + Math.sin(t * 2 + i) * 0.15);
    }
    if (s.bossDown && !this.announced && this.t > 2.6) {
      this.announced = true;
      s.hud.show('INASAYAMA · 333 M', 'ŚWIATŁA PORTU NAGASAKI', 4.5);
    }
    this.done = s.bossDown && this.t >= cfg.hold;
  }
}
