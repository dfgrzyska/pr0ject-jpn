// Two difficulties: normal, the game as designed, and easy (config EASY). Picked on the ship screen and kept in
// the browser; it stays the same through a whole game.
import { EASY, FAIR, HEAT, PLAYER } from './config.js';

const KEY = 'shmupjp.difficulty';

const NORMAL = {
  extraLives: 0,
  autoBomb: false,
  continues: 0,
  invulnerable: PLAYER.invulnerable,
  deathPowerLoss: PLAYER.deathPowerLoss,
  grazeBomb: 1,
  bulletSpeed: FAIR.speed,
  volley: 1,
  lobBurst: 4,
  noFireAfterEnter: FAIR.noFireAfterEnter,
  noFireBelow: FAIR.noFireBelow,
  popcornFireChance: FAIR.popcornFireChance,
  warn: 1,
  bossHp: 1,
  heatJam: HEAT.jam,
  enemyHp: null, // (ENEMIES)
};
const EASY_RULES = { ...NORMAL, ...EASY };

let easy = false;
try {
  easy = localStorage.getItem(KEY) === 'easy';
} catch {
  /* ignore */
}

export function isEasy() {
  return easy;
}

export function setEasy(on) {
  easy = on;
  try {
    localStorage.setItem(KEY, on ? 'easy' : 'normal');
  } catch {
    /* ignore */
  }
}

/** The numbers of the difficulty being played. */
export function rules() {
  return easy ? EASY_RULES : NORMAL;
}

/** Bullets in a fan or ring: fewer on easy, an odd count staying odd (a fan's aimed middle bullet stays). */
export function volley(n) {
  const k = rules().volley;
  return k === 1 || n <= 3 ? n : n - 2 * Math.round((n * (1 - k)) / 2);
}
