import { DEPTH, VIEW } from '../config.js';

// Fuji over the lake at sunset, behind the mid strip (docs/plan-kawaguchiko.md, phase 5): the strip is clear above the
// quay at its end, so as the scroll runs out the view rises from behind it, its layers sliding into place at their
// own speeds (the sky still, the mountain slower than the hills and the water) and shifting a little with the ship
// from side to side. The giant is fought over it, the view dimmed a little; when he falls the sun has gone: the pink
// leaves the snow (the sunlit mountain and its reflection fade into their dusk versions), the sky and hills darken,
// the far shore's windows light up and lay their streaks on the water. Painted by tools/art/kawaguchiko/view.mjs.
const NAMES = ['sky', 'fuji', 'fujiSun', 'hills', 'water', 'waterSun', 'lights'];
const SHIFT = { sky: 0, fuji: 110, fujiSun: 110, hills: 170, water: 260, waterSun: 260, lights: 170 }; // px each starts below its place
const SWAY = { sky: 0.03, fuji: 0.06, fujiSun: 0.06, hills: 0.1, water: 0.1, waterSun: 0.1, lights: 0.1 }; // how far it follows the ship
const SKY_DUSK = [0.5, 0.52, 0.78]; // (view.mjs: SKY_DUSK, HILLS_DUSK)
const HILLS_DUSK = [0.44, 0.42, 0.64];
const WATERLINE = 257;
const tintOf = (m, k) => (Math.round(255 * (1 - k + k * m[0])) << 16) | (Math.round(255 * (1 - k + k * m[1])) << 8) | Math.round(255 * (1 - k + k * m[2]));
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export class FujiView {
  constructor(scene) {
    this.scene = scene;
    this.t = 0; // since the boss went down
    this.done = false;
    this.px = 0;
    this.dim = 0;
    this.animate = !new URLSearchParams(location.search).has('noprops');
    const d = DEPTH.mid - 0.5;
    const top = scene.cache?.json?.get('bg_stage10')?.panoramaTop ?? {};
    this.tops = Object.fromEntries(NAMES.map((n) => [n, (top[n] ?? 0) / 3]));
    // (the layers are painted at 3x the game's resolution)
    this.layers = Object.fromEntries(NAMES.map((n, i) => [n, scene.add.image(0, 0, `view_stage10_${n}`).setOrigin(0).setScale(1 / 3).setDepth(d + i * 0.01).setVisible(false)]));
    // above the painted sky on a screen taller than the view: the sky's own top colour
    this.skyTop = scene.add.rectangle(0, 0, VIEW.width, 1, 0x262a62).setOrigin(0).setDepth(d - 0.005).setVisible(false);
    this.boats = [0, 1].map((i) => ({
      boat: scene.add.image(0, 0, 'props_stage10', 'view_boat_0').setDepth(d + 0.055).setVisible(false),
      wake: scene.add.image(0, 0, 'props_stage10', 'view_wake').setDepth(d + 0.054).setVisible(false),
      y: 296 + i * 52, // (on the water: the nearer, the bigger and the faster it goes by)
      dir: i ? -1 : 1,
      x0: i ? 160 : 30,
    }));
    this.geese = scene.add.image(0, 0, 'props_stage10', 'view_geese_0').setScale(1 / 3).setDepth(d + 0.005).setVisible(false);
    this.geeseT = 3;
    this.shade = scene.add.rectangle(0, 0, VIEW.width, VIEW.maxHeight, 0x0a0a1a, 1).setOrigin(0).setDepth(d + 0.07).setAlpha(0).setVisible(false);
  }

  /** How far the view has risen: 0 with the quay at the top of the screen, 1 when the scroll has stopped. */
  progress() {
    const s = this.scene;
    const ridge = s.stage.panorama.ridge;
    const p = Math.max(0, Math.min(1, (s.parallax.uTop - ridge) / (s.parallax.length - ridge)));
    return p * p * (3 - 2 * p);
  }

  update(dt) {
    const s = this.scene;
    const on = s.parallax.uTop > s.stage.panorama.ridge;
    for (const l of Object.values(this.layers)) l.setVisible(on);
    for (const o of [this.skyTop, this.shade, this.geese]) o.setVisible(on);
    for (const b of this.boats) {
      b.boat.setVisible(on);
      b.wake.setVisible(on && this.animate);
    }
    if (!on) return;
    const e = this.progress();
    const t = this.animate ? s.t : 0;
    // the giant's fight dims the view a little (bullets must read over it); his fall brings the dusk on
    const g = s.enemies.bossGroup;
    const fighting = g && !g.defeated;
    if (s.bossDown) this.t += dt;
    this.dim += ((fighting ? 0.26 : 0) - this.dim) * Math.min(1, dt * (fighting ? 1.2 : 2.5));
    this.shade.setAlpha(this.dim);
    const dusk = smooth(0.4, 6.5, this.t);
    const lit = smooth(2.5, 7, this.t);
    const ship = s.player?.alive ? s.player.x - VIEW.width / 2 : 0;
    this.px += (ship - this.px) * Math.min(1, dt * 1.5);
    const baseY = (s.H - 420) / 2;
    const at = (n) => [Math.round((-18 - this.px * SWAY[n]) * 3) / 3, Math.round((baseY + (1 - e) * SHIFT[n]) * 3) / 3];
    for (const n of NAMES) {
      const [x, y] = at(n);
      this.layers[n].setPosition(x, y + this.tops[n]);
    }
    this.layers.fujiSun.setAlpha(1 - dusk);
    this.layers.waterSun.setAlpha(1 - dusk);
    this.layers.sky.setTint(tintOf(SKY_DUSK, dusk));
    this.layers.hills.setTint(tintOf(HILLS_DUSK, dusk));
    this.layers.lights.setAlpha(lit * (0.88 + 0.12 * Math.sin(t * 1.3)));
    this.skyTop.setFillStyle(tintOf([0x26 / 255, 0x2a / 255, 0x62 / 255].map((v, i) => v * (1 - dusk + dusk * SKY_DUSK[i])), 1));
    this.skyTop.setSize(VIEW.width, Math.max(0, at('sky')[1] + 1));
    // the boats: an angler drifting across, his wake behind him, rocking
    const [wx, wy] = at('water');
    for (const b of this.boats) {
      const k = (b.y - WATERLINE) / (420 - WATERLINE);
      const size = (0.55 + k * 0.7) / 3;
      const span = 260;
      const x = ((b.x0 + b.dir * t * (1.2 + k * 1.6)) % span + span) % span - 22;
      b.boat.setPosition(wx + x, wy + b.y).setScale(size * -b.dir, size).setFrame(`view_boat_${Math.floor(t * 1.2 + b.x0) % 2}`);
      b.wake.setPosition(wx + x - b.dir * 26 * size, wy + b.y + 1.2 * size * 3).setScale(size * -b.dir, size).setAlpha(0.5 + 0.2 * Math.sin(t * 2 + b.x0));
    }
    // now and then a skein of geese crosses the sky, right to left
    const [sx, sy] = at('sky');
    if (this.animate) this.geeseT -= dt;
    const fly = this.geeseT < 0 ? -this.geeseT : -1;
    if (fly > 24) this.geeseT = 14 + ((s.t * 7) % 10);
    this.geese.setVisible(fly >= 0).setPosition(sx + 236 - fly * 11, sy + 70 + fly * 1.6).setFrame(`view_geese_${Math.floor(t * 3) % 2}`);
    if (s.bossDown && !this.announced && this.t > 2.6) {
      this.announced = true;
      s.hud.show('FUJI-SAN · 3776 M', 'KAWAGUCHIKO O ZMIERZCHU', 4.5);
    }
    this.done = s.bossDown && this.t >= s.stage.panorama.hold;
  }
}
