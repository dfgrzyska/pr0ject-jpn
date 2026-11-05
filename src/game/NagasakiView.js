import { DEPTH } from '../config.js';

// Seven pre-rendered layers, four grouped window masks and 24 pooled light points.
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
      const shore = i % 3 ? 228 - x * .24 + 5 * Math.sin(x * .042) : 292 - x * .42 + 7 * Math.sin(x * .04);
      this.points[i].setPosition(x, shore).setAlpha(a * (.4 + .2 * Math.sin(t + i)));
    }
    if (!this.announced && this.t > 5) {
      this.announced = true;
      s.hud.show('INASAYAMA · 333 M', 'ŚWIATŁA PORTU NAGASAKI', 4.5);
    }
    this.done = this.t >= cfg.hold + 6;
  }
}
