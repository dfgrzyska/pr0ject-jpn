// Okinawa: the twin shisa (the boss).
// Methods of Enemies (src/game/Enemies.js mixes them in), so `this` is the enemies of the stage.
import { DEPTH, VIEW } from '../../config.js';
import { slow, normal, DOWN } from './shared.js';

// The twin shisa: each one's HP; in phase 1 Un guards A (A takes `guard` of a hit while Un stands); phase 2
// comes once the pair is down to `bond` of their life together (the bond between them hurts, they change
// places across it every `swap` s); when one falls the other takes in its soul (`soul` HP back) and grows
const SHISA = { hp: 850, guard: 0.6, bond: 0.55, swap: 6, soul: 200 };

export const okinawa = {
  // ---------------------------------------------------------------- boss: twin shisa
  /**
   * The pair: "A" (open mouth) on the left, "Un" (closed mouth) on the right. Three phases: A-Un in harmony
   * (A attacks, Un guards it and rings the player with resonance); the guardians' bond, a beam of spirit between
   * them that hurts to cross while they change places diagonally; the last guardian of Ryūkyū, the survivor
   * grown with its twin's soul, firing both their attacks.
   */
  spawnBoss(w, base) {
    const g = { t: 0, phase: 0, step: 0, timer: 1.2, parts: [], enraged: false, defeated: false, stage: 1, take: { a: SHISA.guard }, swapT: 0, swap: null, resT: 3 };
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

  /** The twin shisa's fight: swaying, the survivor's rage, fans, crossfire rings, a stream and orbs. */
  updateShisa(g, dt) {
    const alive = g.parts.filter((p) => !p.dead && p.group === g && p.hp > 0);
    if (!alive.length) return;
    const s = this.scene;
    g.t += dt;
    const sp = g.enraged ? 1.6 : 1;
    // phase 2: every few seconds they change places diagonally (A down-right, Un up-left, and back)
    if (g.stage === 2 && alive.length === 2 && !g.swap && (g.swapT += dt) >= SHISA.swap) {
      g.swapT = 0;
      g.swap = { t: 0, from: alive.map((p) => [p.home, p.homeY]) };
    }
    if (g.swap) {
      const k = Math.min(1, (g.swap.t += dt) / 1.4);
      const ease = k * k * (3 - 2 * k);
      alive.forEach((p, i) => {
        const [hx, hy] = g.swap.from[i];
        const [ox] = g.swap.from[1 - i] ?? [hx, hy];
        p.home = hx + (ox - hx) * ease;
        p.homeY = 66 + (i === 0 ? 1 : -1) * 24 * Math.sin(ease * Math.PI); // one dips down, the other up: across
      });
      if (k >= 1) {
        alive.forEach((p, i) => {
          p.home = (g.swap.from[1 - i] ?? g.swap.from[i])[0];
          p.homeY = 66;
        });
        g.swap = null;
      }
    }
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
    const total = alive.reduce((sum, p) => sum + p.hp, 0);
    if (g.stage === 1 && (total < g.maxTotal * SHISA.bond || alive.length === 1)) {
      // the bond: Un no longer shields A, a beam of spirit joins them
      g.take = null;
      Object.assign(g, { phase: 0, step: 0, swapT: SHISA.swap - 1.5 });
      const mx = alive.reduce((sum, p) => sum + p.x, 0) / alive.length;
      this.phaseBreak(g, mx, alive[0].y, 2, 'WIĘŹ STRAŻNIKÓW');
    }
    if (g.stage === 2 && alive.length === 1) {
      // the survivor takes in its twin's soul: some life back, bigger, both attacks at once
      const last = alive[0];
      last.hp = Math.min(last.maxHp, last.hp + SHISA.soul);
      last.setScale(1.2 * last.base);
      last.radius *= 1.2;
      Object.assign(g, { enraged: true, phase: 0, step: 0, swap: null });
      last.home = Math.round(VIEW.width / 2);
      last.homeY = 66;
      this.phaseBreak(g, last.x, last.y, 3, 'OSTATNI STRAŻNIK RYUKYU');
      s.fx.light(last.x, last.y, 1.4, false, 0xffd080);
    }
    if (g.stage >= 3) alive[0].setScale(1.2 * alive[0].base);
    // phase 2: the bond between them, blinking on before it hurts
    if (g.stage === 2 && alive.length === 2) {
      const [p, q] = alive;
      const cyc = g.t % 4;
      const on = cyc > 1.2;
      if (on || Math.floor(cyc * 14) % 2) {
        this.tele.lineStyle(on ? 3 : 1, on ? 0xffe8a0 : 0xffb050, on ? 0.75 : 0.5);
        this.tele.lineBetween(p.x, p.y + 6, q.x, q.y + 6);
      }
      const pl = s.player;
      if (on && pl.alive && this.canFire(p)) {
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const k = Math.max(0, Math.min(1, ((pl.x - p.x) * dx + (pl.y - p.y - 6) * dy) / (dx * dx + dy * dy || 1)));
        if (Math.hypot(p.x + dx * k - pl.x, p.y + 6 + dy * k - pl.y) < 2.5) pl.hit();
      }
    }
    // phase 1: Un rings the player with resonance (a zone where they are now)
    const unNow = alive.find((p) => p.role === 'un');
    if (g.stage === 1 && unNow && (g.resT -= dt) <= 0 && this.canFire(unNow)) {
      g.resT = 3.2;
      s.bullets.zone(s.player.x, s.player.y, 13, { warn: 1.0, live: 0.45 });
    }
    g.timer -= dt * (g.enraged ? 1.4 : 1);
    if (g.timer > 0) return;
    const b = this.scene.bullets;
    // the last guardian fires both their attacks
    const a = g.stage >= 3 ? alive[0] : alive.find((p) => p.role === 'a');
    const un = g.stage >= 3 ? alive[0] : alive.find((p) => p.role === 'un');
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
        if (can(p)) b.fan(p.x, p.y + 12, this.aimAt(p, 0, 12), 5, 0.8, normal);
        g.timer = 0.55;
        if (++g.step >= 6) next();
        break;
      }
      case 1:
        // crossfire rings whose gaps interleave
        for (const p of alive) if (can(p)) b.ring(p.x, p.y + 4, g.enraged ? 14 : 12, g.step * 0.26 + (p.role === 'a' ? 0 : Math.PI / 12), slow, p.role === 'un');
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
