// The map's regions and its camera (docs/plan-mapa.md): every city of the journey is in one region, each region's
// box and cities are covered by a close-up tile (else the camera would show them blurred), and the views fit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { REGIONS, TILES, project, regionOf } from '../../src/data/japan.js';
import { fitView } from '../../src/game/mapCamera.js';

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
    // (the tile is never stretched more than twice over)
    const tile = TILES.find((t) => inBox(t.box, r.box[0], r.box[1]) && inBox(t.box, r.box[2], r.box[3]));
    assert.ok((v.z * 3) / tile.S <= 2, `${r.id}: the tile at ${((v.z * 3) / tile.S).toFixed(2)}x`);
  }
});

test('the region of a city is found by its stage', () => {
  assert.equal(regionOf('stage1').id, 'kansai');
  assert.equal(regionOf('stage9').id, 'kanto');
  assert.equal(regionOf('nope'), undefined);
});
