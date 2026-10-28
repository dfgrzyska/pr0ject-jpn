import { SCORE } from '../config.js';

// Score x multiplier. The multiplier climbs +1 every `step` points of contribution
// (enemy multiplierWeight), halves on death and carries over between stages.
export class Score {
  constructor(step) {
    this.step = step;
    this.score = 0;
    this.mult = 1;
    this.progress = 0;
  }

  kill(def) {
    this.score += def.score * this.mult;
    if (this.mult >= SCORE.multiplierMax) return;
    this.progress += def.weight;
    while (this.progress >= this.step && this.mult < SCORE.multiplierMax) {
      this.progress -= this.step;
      this.mult++;
    }
    if (this.mult >= SCORE.multiplierMax) this.progress = 0;
  }

  add(points) {
    this.score += points;
  }

  maxPowerBonus() {
    return SCORE.maxPowerBonus * this.mult;
  }

  death() {
    this.mult = Math.max(1, Math.floor(this.mult / 2));
    this.progress = 0;
  }

  /** 0..1 progress towards the next multiplier step. */
  get fraction() {
    return this.mult >= SCORE.multiplierMax ? 1 : this.progress / this.step;
  }
}
