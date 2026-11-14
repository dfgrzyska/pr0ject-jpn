// The random encounters: bosses met only now and then on the flight from one city to the next (ENCOUNTER in
// config.js: the odds). Each is a stage file of its own, an arena with one boss; backgrounds and enemies live in
// public/assets/bg/<id>/ like the cities' (tools/gen-art.mjs, tools/art/encounters/).
import ex1 from './ex1.json';
import { rollEncounter as roll } from './encounterRoll.js';

export const ENCOUNTERS = [ex1];

export function encounterById(id) {
  return ENCOUNTERS.find((e) => e.id === id) ?? null;
}

/** After a city is cleared: an encounter on the way to the next one, or null (see encounterRoll.js). */
export function rollEncounter(met, chance, forced = null) {
  return roll(ENCOUNTERS.map((e) => e.id), met, chance, forced);
}
