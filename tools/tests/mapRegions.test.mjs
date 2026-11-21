// The map's regions and its camera (docs/plan-mapa.md): every city of the journey is in one region, each region's
// box and cities are covered by a close-up tile (else the camera would show them blurred), and the views fit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { REGIONS, TILES, project, regionOf } from '../../src/data/japan.js';
import { fitView, insetFocus } from '../../src/game/mapCamera.js';

const stages = Array.from({ length: 12 }, (_, i) => JSON.parse(readFileSync(new URL(`../../src/data/stage${i + 1}.json`, import.meta.url))));
const inBox = ([x0, y0, x1, y1], x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;

test('every city is in exactly one region, and the regions name only cities that exist', () => {
  for (const s of stages) assert.equal(REGIONS.filter((r) => r.stages.includes(s.id)).length, 1, s.id);
  for (const r of REGIONS) for (const id of r.stages) assert.ok(stages.some((s) => s.id === id), `${r.id}: ${id}`);
});

test("each region's box and cities lie inside one close-up tile, the cities inside their region's box", () => {
  for (const r of REGIONS) {
    const tile = TILES.find((t) => inBox(t.box, r.box[0], r.box[1]) && inBox(t.box, r.box[2], r.box[3]));
    assert.ok(tile, `${r.id}: no tile covers its box`);
    for (const id of r.stages) {
      const [x, y] = project(...stages.find((s) => s.id === id).map);
      assert.ok(inBox(r.box, x, y), `${id} outside ${r.id}'s box`);
    }
  }
});

test("the city menu's view of each region is close, and shows its cities with room for their names", () => {
  const area = { x0: 2, x1: 150, y0: 72, y1: 380 - 82 };
  for (const r of REGIONS) {
    const pts = r.stages.map((id) => project(...stages.find((s) => s.id === id).map));
    const v = fitView(pts, r.box, area);
    assert.ok(v.z >= 2, `${r.id}: zoom ${v.z.toFixed(2)}`);
    for (const [x, y] of pts) {
      const sx = (area.x0 + area.x1) / 2 + (x - v.cx) * v.z;
      const sy = (area.y0 + area.y1) / 2 + (y - v.cy) * v.z;
      assert.ok(sx >= area.x0 + 10 && sx <= area.x1 - 10 && sy >= area.y0 + 8 && sy <= area.y1 - 8, `${r.id}: a city at ${sx.toFixed(0)}, ${sy.toFixed(0)}`);
    }
  }
});

test("what each region's close-up shows of the map is drawn sharp edge to edge, in the menu and between stages", () => {
  // (the view's whole screen, cut to where the map has anything; a tile counts when it is fully in at that zoom, at
  // least three quarters as fine as the screen, and the view clear of its fading edge)
  const content = [6, 50, 174, 345];
  for (const H of [320, 420])
    for (const [scene, area] of [['menu', { x0: 2, x1: 150, y0: 72, y1: H - 82 }], ['map', { x0: 2, x1: 178, y0: 40, y1: H - 54 }]])
      for (const r of REGIONS) {
        const v = fitView(r.stages.map((id) => project(...stages.find((s) => s.id === id).map)), r.box, area);
        const [cx, cy] = [(area.x0 + area.x1) / 2, (area.y0 + area.y1) / 2];
        const seen = [Math.max(content[0], v.cx - cx / v.z), Math.max(content[1], v.cy - cy / v.z), Math.min(content[2], v.cx + (180 - cx) / v.z), Math.min(content[3], v.cy + (H - cy) / v.z)];
        const sharp = TILES.filter((t) => !t.inset && v.z >= t.fade[1] && t.S >= v.z * 3 * 0.75);
        const tile = sharp.find((t) => seen[0] >= t.box[0] + 4 && seen[1] >= t.box[1] + 4 && seen[2] <= t.box[2] - 4 && seen[3] <= t.box[3] - 4);
        assert.ok(tile, `${scene} ${H} ${r.id}: z ${v.z.toFixed(2)}, sees ${seen.map((n) => n.toFixed(0))}`);
        // Okinawa's chart shows in its own region's view, in no other
        const inset = TILES.find((t) => t.inset);
        assert.equal(insetFocus(v, area) > 0.99 && v.z >= inset.fade[1], r.id === 'okinawa', `${scene} ${H} ${r.id}: the inset`);
        if (r.id === 'okinawa') assert.ok(inset.S >= v.z * 3 * 0.75, `the inset at ${((v.z * 3) / inset.S).toFixed(2)}x`);
      }
});

test('the region of a city is found by its stage', () => {
  assert.equal(regionOf('stage1').id, 'kansai');
  assert.equal(regionOf('stage9').id, 'kanto');
  assert.equal(regionOf('nope'), undefined);
});

test("in the city menu's view of each region its cities' landmarks show, clear of each other, of the ship on its city and of the other cities", async () => {
  const { MARKS, MARK_BOX, markZoom, inInset } = await import('../../src/data/japan.js');
  const [bx0, by0, bx1, by1] = MARK_BOX;
  for (const H of [320, 380, 420]) {
    const area = { x0: 2, x1: 150, y0: 72, y1: H - 82 };
    for (const r of REGIONS) {
      const pts = r.stages.map((id) => project(...stages.find((s) => s.id === id).map));
      const v = fitView(pts, r.box, area);
      const scr = ([x, y]) => [(area.x0 + area.x1) / 2 + (x - v.cx) * v.z, (area.y0 + area.y1) / 2 + (y - v.cy) * v.z];
      const shown = MARKS.map((m, n) => ({ m, n })).filter(({ m, n }) => markZoom[n] + 0.35 <= v.z && (!inInset(...m.at) || insetFocus(v, area) > 0.99)).map(({ m }) => {
        const [x, y] = scr(project(...m.at));
        return { m, box: [x + m.off[0] + bx0, y + m.off[1] + by0, x + m.off[0] + bx1, y + m.off[1] + by1] };
      });
      const near = (b, [x, y], rad) => Math.hypot(x - Math.max(b[0], Math.min(x, b[2])), y - Math.max(b[1], Math.min(y, b[3]))) < rad;
      for (const id of r.stages) {
        const mine = shown.find((k) => k.m.stage === id);
        assert.ok(mine, `${H} ${r.id}: ${id}'s landmark does not show (zoom ${v.z.toFixed(2)})`);
        const dot = scr(project(...stages.find((s) => s.id === id).map));
        assert.ok(!near(mine.box, dot, 6.5), `${H} ${r.id}: ${id}'s landmark under the ship`);
        assert.ok(mine.box[0] >= area.x0 && mine.box[2] <= area.x1 && mine.box[1] >= area.y0 - 8 && mine.box[3] <= area.y1 + 8, `${H} ${r.id}: ${id}'s landmark off the map`);
      }
      for (const a of shown) {
        for (const b of shown) if (a !== b) assert.ok(a.box[2] <= b.box[0] || b.box[2] <= a.box[0] || a.box[3] <= b.box[1] || b.box[3] <= a.box[1], `${H} ${r.id}: ${a.m.key} over ${b.m.key}`);
        for (const s of stages) if (s.id !== a.m.stage) assert.ok(!near(a.box, scr(project(...s.map)), 3), `${H} ${r.id}: ${a.m.key} over ${s.id}`);
      }
    }
  }
});
