import { DEFAULTS, ITEM, ITEMS, KITS, LOOKS, PITY, RARITIES, RARITY, SHOT_FRAMES, SLOTS, TICKETS } from '../data/gacha.js';

// The player's side of the gachapon: tickets, what came out of the machine so far, and the ship put together
// from it (a hull and the parts in its slots). Kept in the browser. Every function here takes the state as
// plain data, so the rules run in tests without a browser.
const KEY = 'shmupjp.gacha';
const VERSION = 1;

const emptySlots = () => Object.fromEntries(SLOTS.map((k) => [k, []]));
const clone = (kit) => ({ hull: kit.hull, slots: Object.fromEntries(SLOTS.map((k) => [k, [...kit.slots[k]]])) });

/** A new player: the starter parts and the first tickets. `legacyShip`: the ship last picked on the old ship
 * screen (its id); its hull and parts are theirs from the start, fitted. */
export function newState(legacyShip = 'kitsune') {
  const kit = KITS[legacyShip] ?? KITS.kitsune;
  const owned = new Set(ITEMS.filter((it) => it.starter).map((it) => it.id));
  owned.add(kit.hull);
  for (const id of Object.values(ITEM[kit.hull].fixed ?? {})) owned.add(id);
  for (const k of SLOTS) for (const id of kit.slots[k]) owned.add(id);
  return normalize({ v: VERSION, tickets: TICKETS.first, pulls: 0, dry: 0, owned: [...owned], ...clone(kit) });
}

/** How many slots of each kind the fitted hull has. */
export function layout(state) {
  return ITEM[state.hull].slots;
}

/** Make a state sound whatever was saved: only known parts, owned, of the right kind, as many as the hull has
 * slots for, one of a line; an engine and a bomb always fitted. Each kind's slots are an array as long as the
 * hull has slots of it, null where one is empty: a part stays in the slot it was put in. */
function normalize(state) {
  state.owned = [...new Set(state.owned)].filter((id) => ITEM[id]);
  if (!state.owned.includes(state.hull) || ITEM[state.hull]?.kind !== 'hull') state.hull = 'hull_tsuru';
  const have = new Set(state.owned);
  const slots = emptySlots();
  const count = layout(state);
  for (const k of SLOTS) slots[k] = Array(count[k]).fill(null);
  for (const k of SLOTS) {
    (state.slots?.[k] ?? []).forEach((id, i) => {
      const it = ITEM[id];
      if (!it || it.kind !== k || !have.has(id)) return;
      if (slots[k].includes(id) || (it.line && fittedLine(slots, it.line))) return;
      // (its own slot; on a hull with fewer, the first one free)
      const at = i < count[k] && slots[k][i] == null ? i : slots[k].indexOf(null);
      if (at >= 0) slots[k][at] = id;
    });
    if (DEFAULTS[k] && count[k] > 0 && !slots[k].some(Boolean)) slots[k][0] = DEFAULTS[k];
  }
  state.slots = slots;
  // the looks: one of each kind at most, owned
  state.look = Object.fromEntries(LOOKS.map((k) => [k, ITEM[state.look?.[k]]?.kind === k && have.has(state.look[k]) ? state.look[k] : null]));
  return state;
}

/** Wear a paint job, a flame colour or a dye (null: take it off). False if it is not the player's. */
export function wear(state, kind, id) {
  if (!LOOKS.includes(kind)) return false;
  if (id != null && (ITEM[id]?.kind !== kind || !state.owned.includes(id))) return false;
  state.look[kind] = id;
  return true;
}

const fittedLine = (slots, line) => SLOTS.some((k) => slots[k].some((id) => id && ITEM[id].line === line));

export function loadState(storage, legacyShip) {
  try {
    const saved = JSON.parse(storage.getItem(KEY));
    if (saved?.v === VERSION && Array.isArray(saved.owned)) {
      // (starter parts added in a later version are theirs too)
      for (const it of ITEMS) if (it.starter) saved.owned.push(it.id);
      return normalize(saved);
    }
  } catch {
    /* private mode, or a broken save: start afresh */
  }
  return newState(legacyShip);
}

export function saveState(storage, state) {
  try {
    storage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode: it lasts this game */
  }
}

/** The capsules still in the machine. */
export function pool(state) {
  const have = new Set(state.owned);
  return ITEMS.filter((it) => !it.starter && !have.has(it.id));
}

/** Tickets won (see TICKETS). */
export function grant(state, n) {
  state.tickets += n;
  return state.tickets;
}

/**
 * One ticket, one capsule: a rarity by the odds (of those the machine still holds), then one of its capsules;
 * it is the player's from now on and gone from the machine. Null with no ticket or an empty machine.
 */
export function pull(state, rnd = Math.random) {
  const left = pool(state);
  if (state.tickets <= 0 || !left.length) return null;
  const from = RARITIES.indexOf(PITY.min);
  let tiers = RARITIES.filter((r) => left.some((it) => it.rarity === r));
  // the guarantee: after a run of plain capsules, a good one (if any is left)
  if (state.dry >= PITY.every - 1 && tiers.some((r) => RARITIES.indexOf(r) >= from)) tiers = tiers.filter((r) => RARITIES.indexOf(r) >= from);
  let roll = rnd() * tiers.reduce((sum, r) => sum + RARITY[r].rate, 0);
  const rarity = tiers.find((r) => (roll -= RARITY[r].rate) < 0) ?? tiers[tiers.length - 1];
  const of = left.filter((it) => it.rarity === rarity);
  const item = of[Math.min(of.length - 1, Math.floor(rnd() * of.length))];
  state.tickets--;
  state.pulls++;
  state.dry = RARITIES.indexOf(rarity) >= from ? 0 : state.dry + 1;
  state.owned.push(item.id);
  return item;
}

/** Fit another hull: parts that have no slot on it come off. */
export function setHull(state, id) {
  if (ITEM[id]?.kind !== 'hull' || !state.owned.includes(id)) return false;
  state.hull = id;
  normalize(state);
  return true;
}

/** Fit a part into slot `index` of its kind (null: take out what is there). False if it cannot go there. */
export function equip(state, kind, index, id) {
  const count = layout(state)[kind] ?? 0;
  if (index < 0 || index >= count) return false;
  const slots = state.slots[kind];
  if (id == null) {
    slots[index] = null;
    normalize(state);
    return true;
  }
  const it = ITEM[id];
  if (!it || it.kind !== kind || !state.owned.includes(id)) return false;
  // the part moves if it is fitted already; a part of the same line makes way for it
  for (const k of SLOTS) state.slots[k] = state.slots[k].map((q) => (q === id || (q && it.line && ITEM[q].line === it.line) ? null : q));
  state.slots[kind][index] = id;
  normalize(state);
  return true;
}

/** The parts at work: the hull's built-in ones, then the slots in order. */
export function parts(state) {
  const hull = ITEM[state.hull];
  return SLOTS.flatMap((k) => [...(hull.fixed?.[k] ? [hull.fixed[k]] : []), ...state.slots[k].filter(Boolean)]).map((id) => ITEM[id]);
}

/** The ship the game flies: the same shape the three old ships had in config.js (see Player). */
export function buildShip(state) {
  const ship = { ...ITEM[state.hull].ship };
  const fitted = parts(state);
  for (const { fx } of fitted) Object.assign(ship, structuredClone(fx.set ?? {}));
  for (const { fx } of fitted) for (const [k, v] of Object.entries(fx.add ?? {})) ship[k] += v;
  for (const { fx } of fitted) {
    for (const [k, v] of Object.entries(fx.mul ?? {})) ship[k] *= v;
    if (fx.bombMul) ship.bomb.damage *= fx.bombMul;
  }
  // the looks (see shipSkin.js): the paint's colours, the flame, the shots' tint
  const look = state.look ?? {};
  ship.look = { paint: ITEM[look.paint]?.colors ?? null, flame: ITEM[look.flame]?.flame ?? null, dye: ITEM[look.dye]?.tint ?? null, wake: ITEM[look.wake]?.wake ?? null, shots: {}, marker: ITEM[look.marker]?.pic ?? null, ebColor: ITEM[look.eb_color]?.body ?? null, ebShape: ITEM[look.eb_shape]?.shape ?? null };
  // (the shots' skins: the frame a shot is fired with -> the frame it is shown with)
  for (const [kind, frames] of Object.entries(SHOT_FRAMES)) if (ITEM[look[kind]]) for (const f of frames) ship.look.shots[f] = `${f}_${ITEM[look[kind]].skin}`;
  ship.perk = fitted.filter((it) => it.kind === 'core').map((it) => it.name).join(' + ');
  // pips out of 3 for the summary: speed, firepower
  ship.stats = [ship.speed < 95 ? 1 : ship.speed < 130 ? 2 : 3, ship.damage < 1 ? 1 : ship.damage < 1.2 ? 2 : 3];
  return ship;
}
