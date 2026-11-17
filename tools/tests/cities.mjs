// The journey's cities for the tests: every stage file not marked "wip", in the order of their numbers (stages.js
// itself needs the browser: its JSON imports). A city in the works (Kawaguchiko, docs/plan-kawaguchiko.md) joins
// them once its flag comes off.
import { readFileSync, readdirSync } from 'node:fs';

const dir = new URL('../../src/data/', import.meta.url);

/** Every stage file, in the order of their numbers. */
export function allStages() {
  return readdirSync(dir)
    .map((f) => f.match(/^stage(\d+)\.json$/))
    .filter(Boolean)
    .sort((a, b) => a[1] - b[1])
    .map((m) => JSON.parse(readFileSync(new URL(m[0], dir))));
}

/** The journey's cities. */
export function cities() {
  return allStages().filter((s) => !s.wip);
}
