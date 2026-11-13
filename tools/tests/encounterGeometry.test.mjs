import test from 'node:test';
import assert from 'node:assert/strict';
import { segmentDistance, quadratic, emberPoint } from '../../src/game/enemies/encounterGeometry.js';

test('swept collision detects crossing a fire or ship between frames, but not beyond the segment', () => {
  assert.equal(segmentDistance({ x: 90, y: 180 }, { x: 90, y: 160 }, { x: 90, y: 200 }), 0);
  assert.equal(segmentDistance({ x: 90, y: 180 }, { x: 90, y: 100 }, { x: 90, y: 150 }), 30);
  assert.equal(segmentDistance({ x: 94, y: 183 }, { x: 90, y: 180 }, { x: 90, y: 180 }), 5);
});

test('the wind telegraph and projectile share the same curve and exact landing point', () => {
  const from = { x: 32, y: 102 }, control = { x: 40, y: 250 }, end = { x: 90, y: 68 };
  assert.deepEqual(quadratic(from, control, end, 0), from);
  assert.deepEqual(quadratic(from, control, end, 1), end);
  const mid = quadratic(from, control, end, 0.5);
  assert(mid.y > from.y && mid.x > from.x && mid.x < end.x);
  assert.deepEqual(emberPoint(from, control, end, 0.5), control);
  assert.deepEqual(emberPoint(from, control, end, 1), end);
});
