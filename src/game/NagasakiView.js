import { DEPTH } from '../config.js';
import { farShore, nearShore, hillRoad } from '../data/nagasakiView.js';

// Seven pre-rendered layers (including four light masks), 24 light points and three ferries/wakes.
// No per-window objects, per-frame texture uploads or growing particle arrays.
export class NagasakiView {
  constructor(scene) {
    this.scene = scene;
    this.t = 0;
    this.done = false;
    this.animate = !new URLSearchParams(location.search).has('noprops');
    const names = ['sky', 'city', 'lights0', 'lights1', 'lights2', 'lights3', 'near'];
    this.layers = names.map((n, i) => scene.add.image(0, 0, `view_stage8_${n}`).setOrigin(0).setDepth(DEPTH.ground + .5 + i * .01).setVisible(false));
    this.traffic = scene.add.blitter(0, 0, 'sprites').setDepth(DEPTH.ground + .555).setVisible(false);
    this.points = Array.from({ length: 24 }, () => this.traffic.create(0, 0, 'n_traffic'));
    this.ferries = Array.from({ length: 3 }, () => ({
      boat: scene.add.image(0, 0, 'sprites', 'n_view_ferry_0').setDepth(DEPTH.ground + .557).setVisible(false),
      wake: scene.add.image(0, 0, 'sprites', 'n_view_wake').setDepth(DEPTH.ground + .556).setVisible(false),
    }));
  }
  update(dt) {
    const s = this.scene, cfg = s.stage.panorama;
    if (!s.bossDown || s.parallax.uTop < cfg.reveal) return;
    this.t += dt;
    const k = Math.min(1, this.t / 6), a = k * k * (3 - 2 * k);
    const t = this.animate ? this.t : 0;
    const pan = Math.sin(t * .07) * 5;
    const y = (s.H - 420) / 2 + (1 - a) * 24;
    for (let i = 0; i < this.layers.length; i++) {
      const isLight = i >= 2 && i <= 5;
      const x = -18 + pan * (i === 0 ? .2 : i === 6 ? 1.5 : .7);
      const glow = isLight ? .52 + .2 * Math.sin(t * (.45 + i * .09) + i * 2) + .12 * Math.sin(t * 1.7 + i) : 1;
      this.layers[i].setVisible(true).setPosition(x, y + (i === 6 ? Math.sin(t * .08) * 2 : 0)).setAlpha(a * glow);
    }
    this.traffic.setVisible(this.animate).setPosition(-18 + pan * .7, y);
    for (let i = 0; i < this.points.length; i++) {
      const x = (i * 9 + t * (i % 2 ? 1.2 : -.8) + 216) % 216;
      const shore = i % 4 === 0 ? hillRoad(x) : i % 3 ? farShore(x) : nearShore(x) + 14;
      this.points[i].setPosition(x, shore).setAlpha(a * (.4 + .2 * Math.sin(t + i)));
    }
    for (let i = 0; i < this.ferries.length; i++) {
      const x = 22 + (i * 57 + t * (.65 + i * .15)) % 164;
      const fy = farShore(x) + (nearShore(x) - farShore(x)) * (.32 + i * .19);
      const { boat, wake } = this.ferries[i];
      boat.setVisible(true).setPosition(-18 + pan * .7 + x, y + fy).setAlpha(a * .9);
      boat.setFrame(`n_view_ferry_${Math.floor(t * .8 + i) % 2}`);
      wake.setVisible(this.animate).setPosition(-29 + pan * .7 + x, y + fy + 3).setAlpha(a * (.55 + Math.sin(t * 2 + i) * .15));
    }
    if (!this.announced && this.t > 5) {
      this.announced = true;
      s.hud.show('INASAYAMA · 333 M', 'ŚWIATŁA PORTU NAGASAKI', 4.5);
    }
    this.done = this.t >= cfg.hold + 6;
  }
}
