import { RENDER_SCALE } from '../config.js';
import { INSET, MAP, MARKS, MARK_BOX, TILES, inInset, markZoom, project } from '../data/japan.js';

// The map of Japan seen through a camera (docs/plan-mapa.md): a view is the map point (cx, cy) put in the middle
// of the screen's area and z screen units to a map unit. Close up, the finer tiles of the cities' stretches are laid
// over the whole map.

/** The whole of Japan, as the map was always shown. */
export const WHOLE = { cx: MAP.w / 2, cy: MAP.h / 2, z: 1 };

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const ease = (t) => t * t * (3 - 2 * t);

/** Between two views: the centre in a straight line, the zoom evenly in its ratio. */
export function lerpView(a, b, t) {
  return { cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t, z: a.z * (b.z / a.z) ** t };
}

/**
 * The view that shows the box (map units) whole and the points with room round them for their names
 * (padX, padY screen units), as close as zMax.
 */
export function fitView(points, box, area, { padX = 30, padY = 16, zMax = 6, zMin = 0.5 } = {}) {
  const aw = area.x1 - area.x0;
  const ah = area.y1 - area.y0;
  let [x0, y0, x1, y1] = box ?? [Infinity, Infinity, -Infinity, -Infinity];
  let z = zMax;
  if (box) z = Math.min(z, aw / (box[2] - box[0]), ah / (box[3] - box[1]));
  if (points.length) {
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const [px0, px1, py0, py1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    if (px1 > px0) z = Math.min(z, (aw - 2 * padX) / (px1 - px0));
    if (py1 > py0) z = Math.min(z, (ah - 2 * padY) / (py1 - py0));
    [x0, y0, x1, y1] = [Math.min(x0, px0), Math.min(y0, py0), Math.max(x1, px1), Math.max(y1, py1)];
  }
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, z: Math.max(zMin, z) };
}

/**
 * How much Okinawa's chart shows close up (0 to 1): only when the camera is on it, its middle well inside the area,
 * not when another region's view brushes its corner (Kantō's).
 */
export function insetFocus(view, area) {
  const hw = (area.x1 - area.x0) / 2 / view.z;
  const hh = (area.y1 - area.y0) / 2 / view.z;
  const [ix, iy] = [INSET.x + INSET.w / 2, INSET.y + INSET.h / 2];
  return smooth(-4, 8, Math.min(ix - (view.cx - hw), view.cx + hw - ix, iy - (view.cy - hh), view.cy + hh - iy));
}

/** The whole map and its close-up tiles, placed by a view. */
export class MapCamera {
  constructor(scene, depth, area) {
    this.base = scene.add.image(0, 0, 'japan').setOrigin(0).setDepth(depth);
    this.tiles = TILES.map((t, n) => ({ t, img: scene.add.image(0, 0, t.key).setOrigin(0).setDepth(depth + 0.01 + n * 0.001) }));
    // the landmarks, standing on their places (their foot on the frame's row 44 of 48), the same size at any zoom
    this.marks = MARKS.map((m, n) => ({
      m,
      from: markZoom[n],
      inset: inInset(...m.at),
      img: scene.add.image(0, 0, 'map_marks', m.key).setOrigin(0.5, 44 / 48).setScale(1 / RENDER_SCALE).setDepth(depth + 0.02),
    }));
    this.area = area;
    this.view = WHOLE;
    this.alpha = 1;
    this.visible = true;
    this.apply();
  }

  /** Map units to the screen. */
  toScreen(mx, my, view = this.view) {
    const { x0, x1, y0, y1 } = this.area;
    return [(x0 + x1) / 2 + (mx - view.cx) * view.z, (y0 + y1) / 2 + (my - view.cy) * view.z];
  }

  /** A city (its [lon, lat]) on the screen, rounded to the screen's units. */
  city(lonLat, view = this.view) {
    return this.toScreen(...project(lonLat[0], lonLat[1]), view).map(Math.round);
  }

  set(view) {
    this.view = view;
    this.apply();
    return this;
  }

  setArea(area) {
    this.area = area;
    this.apply();
    return this;
  }

  setVisible(on) {
    this.visible = on;
    this.apply();
    return this;
  }

  setAlpha(a) {
    this.alpha = a;
    this.apply();
    return this;
  }

  apply() {
    const { z } = this.view;
    // (placed on the 540 px grid, so the map doesn't shimmer as it moves)
    const snap = (v) => Math.round(v * RENDER_SCALE) / RENDER_SCALE;
    const [bx, by] = this.toScreen(0, 0);
    this.base.setScale(z / RENDER_SCALE).setPosition(snap(bx), snap(by)).setAlpha(this.alpha).setVisible(this.visible);
    // the tiles come in as the camera closes in, each between its zooms
    const { x0, x1, y0, y1 } = this.area;
    const onInset = insetFocus(this.view, this.area);
    for (const { t, img } of this.tiles) {
      const a = smooth(t.fade[0], t.fade[1], z) * this.alpha * (t.inset ? onInset : 1);
      const [tx, ty] = this.toScreen(t.box[0], t.box[1]);
      const w = (t.box[2] - t.box[0]) * z;
      const h = (t.box[3] - t.box[1]) * z;
      // (only those in view: off the area by a whole screen they are not drawn)
      const on = this.visible && a > 0 && tx < x1 + 180 && tx + w > x0 - 180 && ty < y1 + 420 && ty + h > y0 - 420;
      img.setVisible(on);
      if (on) img.setScale(z / t.S).setPosition(snap(tx), snap(ty)).setAlpha(a);
    }
    for (const k of this.marks) {
      const a = smooth(k.from, k.from + 0.35, z) * this.alpha * (k.inset ? onInset : 1);
      const [mx, my] = this.toScreen(...project(...k.m.at));
      k.x = mx + k.m.off[0];
      k.y = my + k.m.off[1];
      k.a = a;
      const on = this.visible && a > 0.01 && k.x > x0 - 10 && k.x < x1 + 10 && k.y > y0 - 2 && k.y < y1 + 16;
      k.img.setVisible(on);
      if (on) k.img.setPosition(snap(k.x), snap(k.y)).setAlpha(a);
    }
  }

  /** The landmarks showing, as obstacles for the names ({ x, y, r } on the screen: two circles each, over the frame). */
  markSpots() {
    const [x0, y0, x1, y1] = MARK_BOX;
    const r = (x1 - x0) / 2;
    return this.marks.filter((k) => k.img.visible && k.a > 0.3).flatMap((k) => [
      { x: k.x, y: k.y + y1 - r, r },
      { x: k.x, y: k.y + y0 + r, r },
    ]);
  }

  setDepth(d) {
    this.base.setDepth(d);
    this.tiles.forEach(({ img }, n) => img.setDepth(d + 0.01 + n * 0.001));
    for (const k of this.marks) k.img.setDepth(d + 0.02);
    return this;
  }

  destroy() {
    this.base.destroy();
    for (const { img } of this.tiles) img.destroy();
    for (const k of this.marks) k.img.destroy();
  }
}

/**
 * Where the names of the cities in view go, so that none covers another, a city's dot or the ship: each tries its own
 * place first (its stage's [dx, dy]), then above, below, to the sides. items: { x, y, w, h, prefer } (the city on the
 * screen, the name's size); obstacles: { x, y, r }. Returns the names' centres.
 */
export function placeNames(items, obstacles, bounds) {
  const placed = [];
  return items.map((it) => {
    const [hw, hh] = [it.w / 2, it.h / 2];
    const tries = [it.prefer, [0, -12], [0, 12], [hw + 6, 0], [-hw - 6, 0], [hw + 4, -10], [-hw - 4, -10], [hw + 4, 10], [-hw - 4, 10], [0, -20], [0, 20]];
    let best = null;
    for (const [dx, dy] of tries) {
      const x = Math.max(bounds.x0 + hw + 1, Math.min(bounds.x1 - hw - 1, it.x + dx));
      const y = it.y + dy;
      const r = [x - hw - 1, y - hh - 1, x + hw + 1, y + hh + 1];
      let cost = 0;
      for (const p of placed) cost += Math.max(0, Math.min(r[2], p[2]) - Math.max(r[0], p[0])) * Math.max(0, Math.min(r[3], p[3]) - Math.max(r[1], p[1]));
      for (const o of obstacles) {
        const qx = Math.max(r[0], Math.min(o.x, r[2]));
        const qy = Math.max(r[1], Math.min(o.y, r[3]));
        if (Math.hypot(o.x - qx, o.y - qy) < o.r) cost += 40;
      }
      if (!best || cost < best.cost) best = { x, y, r, cost };
      if (!cost) break;
    }
    placed.push(best.r);
    return [Math.round(best.x), Math.round(best.y)];
  });
}

/** Dark bands over the map at the top (solid to a, fading out by b) and the bottom (fading in from c, solid from d). */
export function shadeBands(g, H, a, b, c, d, color = 0x0c1830) {
  g.fillStyle(color, 0.92).fillRect(0, 0, 180, a);
  g.fillGradientStyle(color, color, color, color, 0.92, 0.92, 0, 0).fillRect(0, a, 180, b - a);
  g.fillGradientStyle(color, color, color, color, 0, 0, 0.92, 0.92).fillRect(0, c, 180, d - c);
  g.fillStyle(color, 0.92).fillRect(0, d, 180, H - d);
  return g;
}
