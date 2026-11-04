// Okinawa: the twin shisa (the boss).
// Methods of Enemies (src/game/Enemies.js mixes them in), so `this` is the enemies of the stage.
import { DEPTH } from '../../config.js';
import { slow, normal, DOWN } from './shared.js';

export const okinawa = {
  // ---------------------------------------------------------------- boss: twin shisa
  /** The pair: "A" (open mouth) on the left, "Un" (closed mouth) on the right. */
  spawnBoss(w, base) {
    const g = { t: 0, phase: 0, step: 0, timer: 1.2, parts: [], enraged: false, defeated: false };
    for (const [role, x, anim] of [['a', 54, 'shisa_a'], ['un', 126, 'shisa_un']]) {
      const e = this.pool.spawn(`${anim}_0`, x, -32, { ...base, role, home: x, homeY: 66, group: g });
      e.play(anim);
      e.setDepth(DEPTH.air - 0.1);
      g.parts.push(e);
    }
    g.maxTotal = g.parts.reduce((sum, p) => sum + p.maxHp, 0);
    this.bossGroup = g;
    return g.parts[0];
  },

  /** The twin shisa's fight: swaying, the survivor's rage, fans, crossfire rings, a stream and orbs. */
  updateShisa(g, dt) {
    const alive = g.parts.filter((p) => !p.dead && p.group === g && p.hp > 0);
    if (!alive.length) return;
    g.t += dt;
    const sp = g.enraged ? 1.6 : 1;
    for (const p of alive) {
      if (p.state === 'enter') {
        p.y += Math.max(10, (p.homeY - p.y) * 1.4) * dt;
        if (p.y >= p.homeY - 1) p.state = 'fight';
      } else {
        const off = p.role === 'a' ? 0 : Math.PI;
        p.x = p.home + 22 * Math.sin(g.t * 0.55 * sp + off);
        p.y = p.homeY + 6 * Math.sin(g.t * 0.9 * sp + off * 0.5);
      }
    }
    if (alive.some((p) => p.state === 'enter')) return;
    if (alive.length === 1 && !g.enraged) {
      // the survivor goes berserk: faster sway, faster patterns, red glow
      g.enraged = true;
      g.timer = 0.6;
      g.step = 0;
      this.scene.fx.shockwave(alive[0].x, alive[0].y);
      this.scene.hud.show('', 'SHISA WPADA W SZAŁ!', 1.6, true);
    }
    g.timer -= dt * (g.enraged ? 1.4 : 1);
    if (g.timer > 0) return;
    const b = this.scene.bullets;
    const a = alive.find((p) => p.role === 'a');
    const un = alive.find((p) => p.role === 'un');
    const can = (p) => p && this.canFire(p);
    const next = () => {
      g.phase++;
      g.step = 0;
      g.timer = 0.9;
    };
    switch (g.phase % 3) {
      case 0: {
        // alternating aimed fans, A then Un
        const p = g.step % 2 === 0 ? (a ?? un) : (un ?? a);
        if (can(p)) b.fan(p.x, p.y + 12, this.aimAt(p, 0, 12), g.enraged ? 7 : 5, 0.8, normal);
        g.timer = 0.55;
        if (++g.step >= 6) next();
        break;
      }
      case 1:
        // crossfire rings whose gaps interleave
        for (const p of alive) if (can(p)) b.ring(p.x, p.y + 4, g.enraged ? 16 : 12, g.step * 0.26 + (p.role === 'a' ? 0 : Math.PI / 12), slow, p.role === 'un');
        if (a && un && can(a) && can(un)) {
          const mx = (a.x + un.x) * 0.5;
          const my = (a.y + un.y) * 0.5 + 8;
          this.scene.fx.spark(mx, my);
          this.scene.fx.light(mx, my, 0.55);
        }
        g.timer = 0.8;
        if (++g.step >= 4) next();
        break;
      default:
        // A roars a sweeping stream, Un lobs big orbs at the player
        if (can(a)) b.fire(a.x, a.y + 12, DOWN + Math.sin(g.step * 0.35) * 0.95, normal);
        if (can(un) && g.step % 6 === 0) b.fan(un.x, un.y + 10, this.aimAt(un, 0, 10), 3, 0.5, slow, true);
        g.timer = 0.09;
        if (++g.step >= 30) next();
    }
  },
};
