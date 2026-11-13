// Okinawa: the twin shisa (the boss).
// Methods of Enemies (src/game/Enemies.js mixes them in), so `this` is the enemies of the stage.
import { DEPTH } from '../../config.js';
import Phaser from 'phaser';
import { hasEnemyFrame } from '../enemyArt.js';

// Each guardian's HP; interactive roar, armor windows and spectral twin: encounters.js.
const SHISA = { hp: 850 };

export const okinawa = {
  // ---------------------------------------------------------------- boss: twin shisa
  // A aimed at Un (then vice versa) breaks their bond. The survivor absorbs its twin,
  // whose spectral roar can still be lured into the living guardian.
  spawnBoss(w, base) {
    const g = { t: 0, phase: 0, step: 0, timer: 1.2, parts: [], enraged: false, defeated: false, stage: 1, take: { a: 0.12, un: 0.12 } };
    for (const [role, x, anim] of [['a', 54, 'shisa_a'], ['un', 126, 'shisa_un']]) {
      const e = this.pool.spawn(`${anim}_0`, x, -32, { ...base, role, home: x, homeY: 66, group: g, hp: SHISA.hp, maxHp: SHISA.hp });
      e.play(anim);
      e.setDepth(DEPTH.air - 0.1);
      g.parts.push(e);
    }
    g.maxTotal = g.parts.reduce((sum, p) => sum + p.maxHp, 0);
    this.bossGroup = g;
    return g.parts[0];
  },

  /** The soul's flight to the survivor (0.9 s): how far the survivor has grown with it, 0..1. */
  shisaSoul(g, last, dt) {
    const so = g.soul;
    if (!so || !hasEnemyFrame('shisa_soul_0')) return 1;
    so.t += dt;
    const k = Math.min(1, so.t / 0.9);
    if (k >= 1) {
      if (so.sp) this.scene.fx.light(last.x, last.y, 1.2, false, 0xffd080);
      this.shisaSoulOut(g);
      return 1;
    }
    if (!so.sp) {
      so.sp = this.segPool.spawn('shisa_soul_0', so.x, so.y).setDepth(DEPTH.air - 0.05).setBlendMode(Phaser.BlendModes.ADD);
      so.sp.play('shisa_soul');
    }
    // an arc up and over to it, head first, the tail trailing
    const e = k * k * (3 - 2 * k);
    const x = so.x + (last.x - so.x) * e;
    const y = so.y + (last.y - so.y) * e - Math.sin(k * Math.PI) * 26;
    so.sp.setRotation(Math.atan2(y - so.sp.y, x - so.sp.x) + Math.PI / 2).setPosition(x, y).setScale(so.sp.base * (1.8 - 0.8 * k));
    return e;
  },

  shisaSoulOut(g) {
    if (g.soul?.sp) this.segPool.kill(g.soul.sp);
    g.soul = null;
  },

};
