// Rolling for a random encounter (no stage files imported here, so the tests can use it as it is).

/**
 * After a city is cleared: is there an encounter on the way to the next one? `ids`: every encounter's id, `met`:
 * the ids met in this game already (no repeats), `chance` the odds, `forced` an id or 'any' (debug ?ex=).
 * Returns an id or null.
 */
export function rollEncounter(ids, met, chance, forced = null, random = Math.random) {
  if (forced && forced !== 'any') return ids.includes(forced) && !met.includes(forced) ? forced : null;
  const left = ids.filter((id) => !met.includes(id));
  if (!left.length || (!forced && random() >= chance)) return null;
  return left[Math.floor(random() * left.length)];
}
