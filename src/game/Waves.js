import { CHAIN, ENEMIES, FILL, VIEW } from '../config.js';

const GAP = { popcorn: 0.3, diver: 0.45 };
// what forms a wave worth a bonus when shot down to the last one (docs/plan-fukuoka.md, 5.2): the small fry, not the
// traps, the ambushes nor the fights; waves of one type within PACK_WINDOW s of each other are one wave
export const PACKED = new Set(['popcorn', 'diver', 'shooter', 'carrier', 'turret', 'chain', 'split', 'cart']);
const PACK_WINDOW = 1.0;
/** How many enemies a wave entry brings: its count, times the lanterns on each rope for Fukuoka's chains. */
export const sizeOf = (w) => (w.count ?? 1) * (w.type === 'chain' ? (w.n ?? CHAIN.n) : 1);

// Plays the stage schedule from the JSON file: { t, type, x, path, count, gap, color, pattern, ... }
export class Waves {
  constructor(list) {
    this.list = [...list].sort((a, b) => a.t - b.t);
    this.next = 0;
    this.queue = [];
    this.duos = {}; // named pairs across single-enemy waves ("duo": "s1")
    this.packs = new Map(); // a list entry -> its wave's shared tally (Enemies: the bonus for a whole wave)
  }

  /** The tally shared by the enemies of the wave the entry i opens (with the entries of its type close after it). */
  packOf(i) {
    const w = this.list[i];
    if (this.packs.has(w)) return this.packs.get(w);
    if (!PACKED.has(w.type) || w.card) return null;
    const pack = { n: 0, hit: 0, lost: false };
    for (let j = i; j < this.list.length && this.list[j].t - w.t <= PACK_WINDOW; j++) {
      const o = this.list[j];
      if (o.type !== w.type || this.packs.has(o)) continue;
      pack.n += sizeOf(o);
      this.packs.set(o, pack);
    }
    return pack.n > 1 ? pack : null;
  }

  /** Sum of multiplier contributions if every enemy in the stage is destroyed. */
  static totalWeight(list) {
    return list.reduce((sum, w) => sum + (ENEMIES[w.type]?.weight ?? 0) * sizeOf(w), 0);
  }

  skipTo(t) {
    while (this.next < this.list.length && this.list[this.next].t < t) this.next++;
  }

  /** Time of the next wave of a given type within `window` seconds (for warnings). */
  upcoming(type, t, window) {
    for (let i = this.next; i < this.list.length && this.list[i].t <= t + window; i++) if (this.list[i].type === type) return this.list[i];
    return null;
  }

  /**
   * A miniboss is gone (shot down or flown off): if the next wave is a while away, the city's own small fry
   * (its popcorn, divers and shooters, taken in turn and mirrored now and then) keep coming until just before it.
   */
  fillGap(t) {
    const next = this.list[this.next];
    if (!next || next.t - t < FILL.gap) return;
    const from = this.list.filter((w) => (w.type === 'popcorn' || w.type === 'diver' || w.type === 'shooter') && !w.card && !w.duo);
    if (!from.length) return;
    let k = this.fillK ?? 0;
    for (let at = t + 1; at <= next.t - FILL.lead; at += FILL.every) {
      const w = from[(k * 7) % from.length];
      this.expand({ ...w, t: at, x: k % 2 ? VIEW.width - w.x : w.x });
      k++;
    }
    this.fillK = k;
  }

  get done() {
    return this.next >= this.list.length && this.queue.length === 0;
  }

  update(t, spawn) {
    while (this.next < this.list.length && this.list[this.next].t <= t) {
      const i = this.next++;
      this.expand(this.list[i], this.packOf(i));
    }
    if (!this.queue.length) return;
    let j = 0;
    for (const q of this.queue) {
      if (q.at > t) this.queue[j++] = q;
      else spawn(q.wave);
    }
    this.queue.length = j;
  }

  expand(w, pack = null) {
    const count = w.count ?? 1;
    // the enemies of one wave share a tally, so the last one down can pay the bonus (popcorn of one wave: a flock)
    pack ??= PACKED.has(w.type) && sizeOf(w) > 1 ? { n: sizeOf(w), hit: 0, lost: false } : null;
    // manzai duos (Osaka): a named pair across two waves, or consecutive members of one wave in twos
    const named = w.duo ? (this.duos[w.duo] ??= { members: [], t: -1 }) : null;
    let duo = named;
    for (let k = 0; k < count; k++) {
      if (!named && count > 1) duo = k % 2 === 0 ? (k + 1 < count ? { members: [], t: -1 } : null) : duo;
      if (w.path === 'row') {
        const x = w.x + (k - (count - 1) / 2) * (w.spacing ?? 22);
        this.queue.push({ at: w.t, wave: { ...w, x, pack, duo } });
      } else {
        const gap = w.gap ?? GAP[w.type] ?? 0.8;
        const x = w.type === 'diver' && k > 0 ? w.x + (k % 2 ? 14 : -14) * Math.ceil(k / 2) : w.x;
        this.queue.push({ at: w.t + k * gap, wave: { ...w, x, pack, duo } });
      }
    }
  }
}
