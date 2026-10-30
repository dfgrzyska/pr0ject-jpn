import { ENEMIES } from '../config.js';

const GAP = { popcorn: 0.3, diver: 0.45 };

// Plays the stage schedule from the JSON file: { t, type, x, path, count, gap, color, pattern, ... }
export class Waves {
  constructor(list) {
    this.list = [...list].sort((a, b) => a.t - b.t);
    this.next = 0;
    this.queue = [];
    this.duos = {}; // named pairs across single-enemy waves ("duo": "s1")
  }

  /** Sum of multiplier contributions if every enemy in the stage is destroyed. */
  static totalWeight(list) {
    return list.reduce((sum, w) => sum + (ENEMIES[w.type]?.weight ?? 0) * (w.count ?? 1), 0);
  }

  skipTo(t) {
    while (this.next < this.list.length && this.list[this.next].t < t) this.next++;
  }

  /** Time of the next wave of a given type within `window` seconds (for warnings). */
  upcoming(type, t, window) {
    for (let i = this.next; i < this.list.length && this.list[i].t <= t + window; i++) if (this.list[i].type === type) return this.list[i];
    return null;
  }

  get done() {
    return this.next >= this.list.length && this.queue.length === 0;
  }

  update(t, spawn) {
    while (this.next < this.list.length && this.list[this.next].t <= t) this.expand(this.list[this.next++]);
    if (!this.queue.length) return;
    this.queue = this.queue.filter((q) => {
      if (q.at > t) return true;
      spawn(q.wave);
      return false;
    });
  }

  expand(w) {
    const count = w.count ?? 1;
    // birds of one wave form a flock: shared by every bird, so the last one down can pay the bonus
    const flock = w.type === 'popcorn' && count > 1 ? { n: count, hit: 0, lost: false } : null;
    // manzai duos (Osaka): a named pair across two waves, or consecutive members of one wave in twos
    const named = w.duo ? (this.duos[w.duo] ??= { members: [], t: -1 }) : null;
    let duo = named;
    for (let k = 0; k < count; k++) {
      if (!named && count > 1) duo = k % 2 === 0 ? (k + 1 < count ? { members: [], t: -1 } : null) : duo;
      if (w.path === 'row') {
        const x = w.x + (k - (count - 1) / 2) * (w.spacing ?? 22);
        this.queue.push({ at: w.t, wave: { ...w, x, flock, duo } });
      } else {
        const gap = w.gap ?? GAP[w.type] ?? 0.8;
        const x = w.type === 'diver' && k > 0 ? w.x + (k % 2 ? 14 : -14) * Math.ceil(k / 2) : w.x;
        this.queue.push({ at: w.t + k * gap, wave: { ...w, x, flock, duo } });
      }
    }
  }
}
