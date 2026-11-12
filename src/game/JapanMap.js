import { DEPTH, RENDER_SCALE, VIEW } from '../config.js';
import { MAP, project } from '../data/japan.js';
import { pixelText } from './Hud.js';
import { INK, PALE, hasStamp } from './Stamps.js';
import { sharedArt } from './enemyArt.js';

const FLIGHT = 2.6; // s for the ship to fly to the next city
const W = VIEW.width;

/**
 * The map of Japan between two stages: every city of this run (cleared ones in gold, the next one
 * pulsing, the rest dim), the route flown so far, and the player's ship flying on to the next city
 * along an arc. Built inside the Stage scene as an overlay; `ready` once the ship has landed.
 * finale (the ending): the whole route drawn in from city to city, then the ship flies away off the map.
 */
export class JapanMap {
  constructor(scene, stages, order, pos, finale = false) {
    this.scene = scene;
    this.finale = finale;
    this.stages = stages;
    this.order = order;
    this.pos = pos; // the city just cleared
    this.t = 0;
    this.ready = false;
    const d = DEPTH.overlay + 2;
    this.bg = scene.add.rectangle(0, 0, W, VIEW.maxHeight, 0x0c1830).setOrigin(0, 0).setDepth(d);
    this.img = scene.add.image(0, 0, 'japan').setOrigin(0, 0).setScale(1 / RENDER_SCALE).setDepth(d);
    this.gfx = scene.add.graphics().setDepth(d + 1);
    this.ship = sharedArt(scene.add.sprite(0, 0, 'sprites', scene.player.ship.frame)).setDepth(d + 3);
    this.labels = order.map((i, k) => {
      const shadow = pixelText(scene, 0, 0, stages[i].name).setDepth(d + 2).setTint(0x0b0a12);
      const text = pixelText(scene, 0, 0, stages[i].name).setDepth(d + 2).setTint(k <= pos ? 0xffe080 : k === pos + 1 ? 0xffffff : 0x8a8aa8);
      return { k, shadow, text };
    });
    // the cities whose stamp is in the book wear a little seal
    // (a pale seal for a stamp won on easy only)
    this.seals = order.map((i) =>
      hasStamp(stages[i].id, true) ? sharedArt(scene.add.image(0, 0, 'sprites', 'stamp_icon')).setDepth(d + 2).setTint(INK[stages[i].id]).setAlpha(hasStamp(stages[i].id) ? 1 : PALE + 0.2) : null,
    );
    const next = stages[order[pos + 1]];
    this.title = pixelText(scene, W / 2, 0, finale ? 'PODRÓŻ UKOŃCZONA' : 'PODRÓŻ PO JAPONII').setDepth(d + 2).setTint(0xffd6e5);
    this.count = pixelText(scene, W / 2, 0, `MIASTA: ${pos + 1} / ${order.length}`).setDepth(d + 2).setTint(0xb0aec0);
    this.dest = pixelText(scene, W / 2, 0, finale ? 'ARIGATŌ!' : `DALEJ: ETAP ${pos + 2}`).setDepth(d + 2).setTint(0xffffff).setVisible(!finale);
    this.destSub = pixelText(scene, W / 2, 0, finale ? '' : next.subtitle).setDepth(d + 2).setTint(0xf08bb0);
    this.hint = pixelText(scene, W / 2, 0, scene.sys.game.device.input.touch ? 'DOTKNIJ, ABY LECIEĆ' : 'ENTER - LECIMY').setDepth(d + 2).setTint(0xffe080).setVisible(false);
    this.layout(scene.H);
  }

  /** Screen position of the k-th city of the run. */
  city(k) {
    const [lon, lat] = this.stages[this.order[k]].map;
    const [x, y] = project(lon, lat);
    return [Math.round(x), Math.round(y) + this.top];
  }

  /** A point along the arc from city a to city b (t in 0..1): the flight bends away from the straight line. */
  arc(a, b, t) {
    const [x0, y0] = this.city(a);
    const [x1, y1] = this.city(b);
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const bend = Math.min(30, len * 0.25);
    const cx = (x0 + x1) / 2 + ((y1 - y0) / len) * bend;
    const cy = (y0 + y1) / 2 - ((x1 - x0) / len) * bend;
    const u = 1 - t;
    return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
  }

  layout(H) {
    this.H = H;
    this.top = Math.round((H - MAP.h) / 2);
    this.img.y = this.top;
    this.bg.setSize(W, H);
    this.title.y = 12;
    this.count.y = 26;
    this.dest.y = H - 44;
    this.destSub.y = H - 30;
    this.hint.y = H - 14;
    for (const l of this.labels) {
      const [x, y] = this.city(l.k);
      const [, , dx, dy] = this.stages[this.order[l.k]].map;
      // (kept on the screen whole: a city at the edge of the map must not lose half its name)
      const half = Math.ceil(l.text.width / 2);
      const tx = Math.max(half + 1, Math.min(W - half - 2, x + dx));
      l.text.setPosition(tx, y + dy);
      l.shadow.setPosition(tx + 1, y + dy + 1);
      this.seals[l.k]?.setPosition(x + (dx < 0 ? 7 : -7), y - 6);
    }
  }

  /** Skip the rest of the flight (an impatient tap). */
  finish() {
    this.t = FLIGHT;
  }

  update(dt) {
    this.t += dt;
    if (this.finale) return this.finaleUpdate();
    const k = Math.min(1, this.t / FLIGHT);
    const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2; // ease in and out
    const g = this.gfx;
    g.clear();
    // the route flown so far, a dotted gold line from city to city
    g.fillStyle(0xe8c060, 1);
    for (let i = 0; i < this.pos; i++) for (let s = 0; s <= 1; s += 0.03) g.fillRect(...this.arc(i, i + 1, s).map(Math.round), 1, 1);
    // tonight's flight, drawn behind the ship as it goes
    g.fillStyle(0xffffff, 0.9);
    for (let s = 0; s <= e; s += 0.04) g.fillRect(...this.arc(this.pos, this.pos + 1, s).map(Math.round), 1, 1);
    // the cities
    const blink = Math.floor(this.t * 4) % 2 === 0;
    this.order.forEach((_, i) => {
      const [x, y] = this.city(i);
      if (i <= this.pos) {
        g.fillStyle(0x2a1a10, 1).fillCircle(x, y, 3.5);
        g.fillStyle(0xe8b830, 1).fillCircle(x, y, 2.5);
        g.fillStyle(0xfff0a0, 1).fillRect(x - 1, y - 1, 1, 1);
      } else if (i === this.pos + 1) {
        const r = 3 + Math.sin(this.t * 6) * 1;
        g.lineStyle(1, blink ? 0xff5a40 : 0xffffff, 1).strokeCircle(x, y, r + 2);
        g.fillStyle(0x8a1a14, 1).fillCircle(x, y, 2.5);
      } else {
        g.fillStyle(0x0b0a12, 1).fillCircle(x, y, 2.5);
        g.fillStyle(0x8a8aa8, 1).fillCircle(x, y, 1.5);
      }
    });
    for (const l of this.labels) if (l.k === this.pos + 1) l.text.setTint(blink ? 0xffffff : 0xff8a70);
    // the ship, nose along its course
    const [sx, sy] = this.arc(this.pos, this.pos + 1, e);
    const [ax, ay] = this.arc(this.pos, this.pos + 1, Math.min(1, e + 0.02));
    this.ship.setPosition(Math.round(sx), Math.round(sy));
    if (k < 1) this.ship.setRotation(Math.atan2(ay - sy, ax - sx) + Math.PI / 2);
    else this.ship.setRotation(0);
    if (k >= 1 && !this.ready) {
      this.ready = true;
      this.scene.sfx.pickup?.();
    }
    this.hint.setVisible(this.ready && Math.floor(this.t * 2.5) % 2 === 0);
  }

  /** The ending: the route drawn in city by city, all the cities lighting up gold, the ship flying away north. */
  finaleUpdate() {
    const g = this.gfx;
    g.clear();
    const n = this.order.length;
    const drawn = Math.min(1, this.t / 2.4) * (n - 1);
    g.fillStyle(0xe8c060, 1);
    for (let i = 0; i < n - 1; i++) for (let s = 0; s <= Math.min(1, drawn - i); s += 0.03) g.fillRect(...this.arc(i, i + 1, s).map(Math.round), 1, 1);
    this.order.forEach((_, i) => {
      const [x, y] = this.city(i);
      if (i <= drawn + 0.001) {
        g.fillStyle(0x2a1a10, 1).fillCircle(x, y, 3.5);
        g.fillStyle(0xe8b830, 1).fillCircle(x, y, 2.5);
        g.fillStyle(0xfff0a0, 1).fillRect(x - 1, y - 1, 1, 1);
      } else {
        g.fillStyle(0x0b0a12, 1).fillCircle(x, y, 2.5);
        g.fillStyle(0x8a8aa8, 1).fillCircle(x, y, 1.5);
      }
    });
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
    for (const o of [this.bg, this.img, this.gfx, this.ship, this.title, this.count, this.dest, this.destSub, this.hint]) o.destroy();
    for (const l of this.labels) {
      l.text.destroy();
      l.shadow.destroy();
    }
    for (const s of this.seals) s?.destroy();
  }
}
