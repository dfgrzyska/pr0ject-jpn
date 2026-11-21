import { DEPTH, VIEW } from '../config.js';
import { REGIONS, project, regionOf } from '../data/japan.js';
import { pixelText } from './Hud.js';
import { INK, PALE, hasStamp } from './Stamps.js';
import { sharedArt } from './enemyArt.js';
import { MapCamera, WHOLE, ease, fitView, lerpView, placeNames, shadeBands } from './mapCamera.js';

const FLIGHT = 2.6; // s for the ship to fly to the next city
const ACROSS = 3.0; // (to a city of another region: the camera draws back and closes in again)
const W = VIEW.width;

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/**
 * The map of Japan between two stages: every city of this run (cleared ones in gold, the next one
 * pulsing, the rest dim), the route flown so far, and the player's ship flying on to the next city
 * along an arc. Built inside the Stage scene as an overlay; `ready` once the ship has landed.
 * The camera (docs/plan-mapa.md) is close on the region of the city just cleared; to a city of another region
 * it draws back to show both and closes in on the new one. Close up the cities have their names; drawn back,
 * the regions have theirs.
 * finale (the ending): the whole of Japan, the route drawn in from city to city, then the ship flies away off the map.
 */
export class JapanMap {
  constructor(scene, stages, order, pos, finale = false, { encounter = false, resume = false } = {}) {
    this.scene = scene;
    this.finale = finale;
    // encounter: the flight stops halfway, an alarm: something is in the way; resume: on from halfway after it
    this.encounter = encounter;
    this.resume = resume;
    this.stages = stages;
    this.order = order;
    this.pos = pos; // the city just cleared
    this.t = 0;
    this.ready = false;
    const d = DEPTH.overlay + 2;
    this.bg = scene.add.rectangle(0, 0, W, VIEW.maxHeight, 0x0c1830).setOrigin(0, 0).setDepth(d);
    this.cam = new MapCamera(scene, d, { x0: 0, x1: W, y0: 0, y1: scene.H });
    this.gfx = scene.add.graphics().setDepth(d + 1);
    this.shade = scene.add.graphics().setDepth(d + 0.5); // (the night over the map behind the lines of text)
    this.ship = sharedArt(scene.add.sprite(0, 0, 'sprites'), scene.player.ship.frame).setDepth(d + 3);
    this.labels = order.map((i, k) => {
      const shadow = pixelText(scene, 0, 0, stages[i].name).setDepth(d + 2).setTint(0x0b0a12);
      const text = pixelText(scene, 0, 0, stages[i].name).setDepth(d + 2).setTint(k <= pos ? 0xffe080 : k === pos + 1 ? 0xffffff : 0x8a8aa8);
      return { k, shadow, text, region: regionOf(stages[i].id)?.id ?? stages[i].id };
    });
    // the regions of this run's cities, named when the camera is drawn back
    this.regions = REGIONS.filter((r) => order.some((i) => r.stages.includes(stages[i].id))).map((r) => ({
      r,
      shadow: pixelText(scene, 0, 0, r.name).setDepth(d + 2).setTint(0x0b0a12),
      text: pixelText(scene, 0, 0, r.name).setDepth(d + 2).setTint(0xb8cce0),
    }));
    // the cities whose stamp is in the book wear a little seal
    // (a pale seal for a stamp won on easy only)
    this.seals = order.map((i) =>
      hasStamp(stages[i].id, true) ? sharedArt(scene.add.image(0, 0, 'sprites'), 'stamp_icon').setDepth(d + 2).setTint(INK[stages[i].id]).setAlpha(hasStamp(stages[i].id) ? 1 : PALE + 0.2) : null,
    );
    const next = stages[order[pos + 1]];
    this.title = pixelText(scene, W / 2, 0, finale ? 'PODRÓŻ UKOŃCZONA' : 'PODRÓŻ PO JAPONII').setDepth(d + 2).setTint(0xffd6e5);
    this.count = pixelText(scene, W / 2, 0, `MIASTA: ${pos + 1} / ${order.length}`).setDepth(d + 2).setTint(0xb0aec0);
    this.dest = pixelText(scene, W / 2, 0, finale ? 'ARIGATŌ!' : `DALEJ: ETAP ${pos + 2}`).setDepth(d + 2).setTint(0xffffff).setVisible(!finale);
    this.destSub = pixelText(scene, W / 2, 0, finale ? '' : next.subtitle).setDepth(d + 2).setTint(0xf08bb0);
    this.hint = pixelText(scene, W / 2, 0, encounter ? (scene.sys.game.device.input.touch ? 'DOTKNIJ - DO WALKI!' : 'ENTER - DO WALKI!') : scene.sys.game.device.input.touch ? 'DOTKNIJ, ABY LECIEĆ' : 'ENTER - LECIMY').setDepth(d + 2).setTint(0xffe080).setVisible(false);
    // the alarm: a red "!" over the ship, a line of text
    this.alarm = pixelText(scene, W / 2, 0, '!!').setDepth(d + 4).setTint(0xff4a3a).setScale(2).setVisible(false);
    this.alarmText = pixelText(scene, W / 2, 0, 'NIESPODZIEWANY GOŚĆ!').setDepth(d + 4).setTint(0xff8a70).setVisible(false);
    const region = (k) => regionOf(stages[order[k]]?.id ?? '')?.id;
    this.across = !finale && region(pos) !== region(pos + 1);
    this.flight = this.across ? ACROSS : FLIGHT;
    if (resume) this.t = this.flight * 0.5;
    this.layout(scene.H);
  }

  /** The k-th city of the run, in map units. */
  spot(k) {
    const [lon, lat] = this.stages[this.order[k]].map;
    return project(lon, lat);
  }

  /** Screen position of the k-th city of the run. */
  city(k) {
    return this.cam.city(this.stages[this.order[k]].map);
  }

  /** A point along the arc from city a to city b (t in 0..1, map units): the flight bends away from the straight line. */
  arc(a, b, t) {
    const [x0, y0] = this.spot(a);
    const [x1, y1] = this.spot(b);
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const bend = Math.min(30, len * 0.25);
    const cx = (x0 + x1) / 2 + ((y1 - y0) / len) * bend;
    const cy = (y0 + y1) / 2 - ((x1 - x0) / len) * bend;
    const u = 1 - t;
    return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
  }

  /** The same on the screen. */
  arcAt(a, b, t) {
    return this.cam.toScreen(...this.arc(a, b, t));
  }

  /** The view close on the region of the k-th city: the region whole, its cities of this run with room for their names. */
  regionView(k) {
    const id = this.stages[this.order[k]].id;
    const r = regionOf(id);
    const pts = this.order.map((i, n) => [i, n]).filter(([i]) => (r ? r.stages.includes(this.stages[i].id) : this.stages[i].id === id)).map(([, n]) => this.spot(n));
    return fitView(pts, r?.box, this.area);
  }

  layout(H) {
    this.H = H;
    this.bg.setSize(W, H);
    this.title.y = 12;
    this.count.y = 26;
    this.dest.y = H - 44;
    this.destSub.y = H - 30;
    this.hint.y = H - 14;
    shadeBands(this.shade.clear(), H, 30, 46, H - 62, H - 50);
    // (the map framed between the title and the line about the next stage; in the finale the whole screen)
    this.area = this.finale ? { x0: 0, x1: W, y0: 0, y1: H } : { x0: 2, x1: W - 2, y0: 40, y1: H - 54 };
    this.cam.setArea(this.area);
    if (this.finale) this.views = null;
    else {
      const from = this.regionView(this.pos);
      const to = this.regionView(this.pos + 1);
      const z = Math.min(from.z, to.z);
      this.views = { from, to, mid: this.across ? fitView([this.spot(this.pos), this.spot(this.pos + 1)], null, this.area, { zMax: z, padX: 24, padY: 24 }) : null };
    }
    this.placeCamera();
  }

  /** The camera at this moment of the flight (k: 0..1 of the flight's time). */
  placeCamera() {
    if (!this.views) return this.cam.set(WHOLE);
    const k = Math.min(this.encounter ? 0.5 : 1, this.t / this.flight);
    const { from, to, mid } = this.views;
    if (!mid) return this.cam.set(lerpView(from, to, ease(k)));
    // (drawn back in the first part of the flight, held there over the middle, closing in at the end)
    if (k < 0.4) this.cam.set(lerpView(from, mid, ease(k / 0.4)));
    else if (k < 0.6) this.cam.set(mid);
    else this.cam.set(lerpView(mid, to, ease((k - 0.6) / 0.4)));
  }

  /** The names: the cities' close up (of the region in view), the regions' drawn back. */
  placeLabels() {
    const k = this.t / this.flight;
    const focus = this.finale ? null : this.labels[k < 0.5 ? this.pos : this.pos + 1].region;
    const target = this.views ? (k < 0.5 ? this.views.from : this.views.to) : WHOLE;
    const close = this.finale ? 0 : clamp01((this.cam.view.z / target.z - 0.7) / 0.25);
    // (kept on the screen whole and clear of each other, of the dots and of the seals: the next city's name first)
    const dots = this.order.map((_, k) => this.city(k));
    const seals = this.labels.map((l) => [dots[l.k][0] + (this.stages[this.order[l.k]].map[2] < 0 ? 7 : -7), dots[l.k][1] - 6]);
    const shown = this.labels.filter((l) => l.region === focus).sort((a, b) => (b.k === this.pos + 1) - (a.k === this.pos + 1));
    const spots = placeNames(
      shown.map((l) => ({ x: dots[l.k][0], y: dots[l.k][1], w: l.text.width, h: l.text.height, prefer: this.stages[this.order[l.k]].map.slice(2) })),
      [...dots.map(([x, y]) => ({ x, y, r: 4 })), ...seals.filter((_, k) => this.seals[k]).map(([x, y]) => ({ x, y, r: 4 })), ...this.cam.markSpots()],
      { x0: 0, x1: W - 1 },
    );
    for (const l of this.labels) {
      const n = shown.indexOf(l);
      const on = n >= 0 && close > 0;
      if (on) {
        l.text.setPosition(...spots[n]);
        l.shadow.setPosition(spots[n][0] + 1, spots[n][1] + 1);
      }
      l.text.setVisible(on).setAlpha(close);
      l.shadow.setVisible(on).setAlpha(close);
      this.seals[l.k]?.setPosition(...seals[l.k]).setVisible(this.finale || on);
    }
    const far = this.finale ? 1 : 1 - close;
    for (const g of this.regions) {
      const [x, y] = this.cam.toScreen(...g.r.at).map(Math.round);
      const half = Math.ceil(g.text.width / 2);
      const tx = Math.max(half + 1, Math.min(W - half - 2, x));
      g.text.setPosition(tx, y).setVisible(far > 0).setAlpha(far);
      g.shadow.setPosition(tx + 1, y + 1).setVisible(far > 0).setAlpha(far);
    }
  }

  /** Skip the rest of the flight (an impatient tap). */
  finish() {
    this.t = this.encounter ? Math.max(this.t, this.flight * 0.5 + 1.4) : this.flight;
  }

  /** A dotted arc between two cities, as far as `upto` (0..1), a dot every couple of screen units. */
  dots(a, b, upto, color, alpha = 1) {
    const g = this.gfx;
    const [x0, y0] = this.arcAt(a, b, 0);
    const [x1, y1] = this.arcAt(a, b, 1);
    const step = 1 / Math.max(12, Math.hypot(x1 - x0, y1 - y0) / 2.4);
    g.fillStyle(color, alpha);
    for (let s = 0; s <= upto; s += step) g.fillRect(...this.arcAt(a, b, s).map(Math.round), 1, 1);
  }

  /** A city's mark: cleared ones in gold, the next one pulsing, the rest dim. */
  mark(i, state, blink) {
    const g = this.gfx;
    const [x, y] = this.city(i);
    if (state === 'done') {
      g.fillStyle(0x2a1a10, 1).fillCircle(x, y, 3.5);
      g.fillStyle(0xe8b830, 1).fillCircle(x, y, 2.5);
      g.fillStyle(0xfff0a0, 1).fillRect(x - 1, y - 1, 1, 1);
    } else if (state === 'next') {
      const r = 3 + Math.sin(this.t * 6) * 1;
      g.lineStyle(1, blink ? 0xff5a40 : 0xffffff, 1).strokeCircle(x, y, r + 2);
      g.fillStyle(0x8a1a14, 1).fillCircle(x, y, 2.5);
    } else {
      g.fillStyle(0x0b0a12, 1).fillCircle(x, y, 2.5);
      g.fillStyle(0x8a8aa8, 1).fillCircle(x, y, 1.5);
    }
  }

  update(dt) {
    this.t += dt;
    this.cam.tick(dt);
    if (this.finale) return this.finaleUpdate();
    this.placeCamera();
    this.placeLabels();
    const k = Math.min(this.encounter ? 0.5 : 1, this.t / this.flight);
    const e = ease(k); // ease in and out
    this.gfx.clear();
    // the route flown so far, a dotted gold line from city to city
    for (let i = 0; i < this.pos; i++) this.dots(i, i + 1, 1, 0xe8c060);
    // tonight's flight, drawn behind the ship as it goes
    this.dots(this.pos, this.pos + 1, e, 0xffffff, 0.9);
    // the cities
    const blink = Math.floor(this.t * 4) % 2 === 0;
    this.order.forEach((_, i) => this.mark(i, i <= this.pos ? 'done' : i === this.pos + 1 ? 'next' : 'dim', blink));
    for (const l of this.labels) if (l.k === this.pos + 1) l.text.setTint(blink ? 0xffffff : 0xff8a70);
    // the ship, nose along its course
    const [sx, sy] = this.arcAt(this.pos, this.pos + 1, e);
    const [ax, ay] = this.arcAt(this.pos, this.pos + 1, Math.min(1, e + 0.02));
    this.ship.setPosition(Math.round(sx), Math.round(sy));
    if (k < 1) this.ship.setRotation(Math.atan2(ay - sy, ax - sx) + Math.PI / 2);
    else this.ship.setRotation(0);
    if (this.encounter && this.t >= this.flight * 0.5) {
      // stopped short: the ship shudders, the alarm blinks
      const a = this.t - this.flight * 0.5;
      this.ship.x += Math.sin(a * 60) * 1.2;
      const on = Math.floor(a * 6) % 2 === 0;
      this.alarm.setPosition(Math.round(this.ship.x), Math.round(this.ship.y) - 16).setVisible(on);
      this.alarmText.setPosition(W / 2, this.H - 58).setVisible(true).setTint(on ? 0xff4a3a : 0xffe080);
      if (!this.alarmed) {
        this.alarmed = true;
        this.scene.sfx.warning?.();
        this.scene.cameras.main.shake(300, 0.006);
      }
      if (a > 1.4 && !this.ready) this.ready = true;
    } else if (k >= 1 && !this.ready) {
      this.ready = true;
      this.scene.sfx.pickup?.();
    }
    this.hint.setVisible(this.ready && Math.floor(this.t * 2.5) % 2 === 0);
  }

  /** The ending: the route drawn in city by city, all the cities lighting up gold, the ship flying away north. */
  finaleUpdate() {
    this.placeLabels();
    this.gfx.clear();
    const n = this.order.length;
    const drawn = Math.min(1, this.t / 2.4) * (n - 1);
    for (let i = 0; i < n - 1; i++) if (drawn > i) this.dots(i, i + 1, Math.min(1, drawn - i), 0xe8c060);
    this.order.forEach((_, i) => this.mark(i, i <= drawn + 0.001 ? 'done' : 'dim'));
    // from the last city the ship climbs away in a curve and leaves the map at the top
    const f = Math.max(0, Math.min(1, (this.t - 2.8) / 2.6));
    const e = f * f;
    const [x0, y0] = this.city(n - 1);
    const [cx, cy] = [x0 + 50, y0 - 30];
    const [x1, y1] = [W / 2 + 40, -24];
    const at = (t) => [(1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1];
    const [sx, sy] = at(e);
    const [ax, ay] = at(Math.min(1, e + 0.02));
    this.ship.setPosition(Math.round(sx), Math.round(sy)).setVisible(this.t > 2.4);
    this.ship.setRotation(f > 0 ? Math.atan2(ay - sy, ax - sx) + Math.PI / 2 : 0);
    this.dest.setVisible(this.t > 2.4);
    if (f >= 1 && !this.ready) this.ready = true;
  }

  destroy() {
    for (const o of [this.bg, this.cam, this.gfx, this.shade, this.ship, this.title, this.count, this.dest, this.destSub, this.hint, this.alarm, this.alarmText]) o.destroy();
    for (const l of [...this.labels, ...this.regions]) {
      l.text.destroy();
      l.shadow.destroy();
    }
    for (const s of this.seals) s?.destroy();
  }
}
