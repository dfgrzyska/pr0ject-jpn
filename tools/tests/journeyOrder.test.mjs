import test from 'node:test';
import assert from 'node:assert/strict';
import { journeyOrder } from '../../src/data/journeyOrder.js';

const reverse = (list) => [...list].reverse();

test('a city marked last ends the journey, whatever the shuffle', () => {
  const stages = [{}, {}, { last: true }, {}];
  assert.deepEqual(journeyOrder(stages, null, reverse), [3, 1, 0, 2]);
  assert.deepEqual(journeyOrder(stages, 1, reverse), [1, 3, 0, 2]);
});

test('a city in the works is left out, unless it is asked for', () => {
  const stages = [{}, {}, { wip: true, last: true }];
  assert.deepEqual(journeyOrder(stages, null, reverse), [1, 0]);
  assert.deepEqual(journeyOrder(stages, 2, reverse), [2, 1, 0]);
});

test('the city picked goes first, even one marked last', () => {
  const stages = [{}, { last: true }, {}];
  assert.deepEqual(journeyOrder(stages, 1, reverse), [1, 2, 0]);
});
