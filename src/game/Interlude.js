import { DEPTH, VIEW } from '../config.js';
import { Pool } from './Pool.js';

// A moment of silence (Hiroshima, over the Peace Memorial Park). For a stretch of the stage, set in the stage file
// ("interlude": { from, to, x, u, n, title, sub }), nobody shoots: the player's guns and bomb are held, enemy bullets
// fade into sparks, and any enemy still about folds itself into a paper crane. Paper cranes in the colours of the
// garlands at the Children's Peace Monument rise from it and dance over the park: a spiral, a ring, a figure of
// eight, a double garland; then they fly away up the screen and the fight goes on. They are scenery: no collisions,
// no score, and they swerve round the ship.
const COLORS = [0xff6a6a, 0xffa848, 0xffe068, 0x8ee878, 0x6ac0ff, 0xb898ff, 0xff94cc, 0xffffff, 0xffd878];
const FLAP = [0, 1, 2, 1];
const ease = (x) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};

export class Interlude {
  constructor(scene, cfg) {
    this.s = scene;
    this.cfg = cfg;
    this.from = cfg.from;
    this.to = cfg.to;
    this.n = cfg.n ?? 24;
    this.active = false;
    this.done = false;
    this.cranes = [];
    this.glows = new Pool(scene, DEPTH.airFx + 0.15);
    this.pool = new Pool(scene, DEPTH.airFx + 0.2);
    this.pool.warm(this.n + 12, 'orizuru_0');
    this.glows.warm(this.n + 12, 'orizuru_glow');
  }

  /** Jumped into or past the stretch (debug ?t=): play it from where we are, or not at all. */
  skipTo(t) {
    if (t >= this.to - 1) this.done = true;
  }

  update(dt, t) {
    if (!this.active && !this.done && t >= this.from && t < this.to - 1) this.begin(t);
    if (this.active && t >= this.to) this.end();
    if (this.cranes.length) this.move(dt, t);
  }

  begin(t) {
    const s = this.s;
    this.active = true;
    this.t0 = t;
    s.ceasefire = true;
    s.player.shots.clear();
    s.bullets.cancelAll(s.fx);
    if (this.cfg.title) s.hud.show(this.cfg.title, this.cfg.sub ?? '', 3.6);
    s.sfx.bell?.();
    s.music.duck?.(0.4);
    // whoever is still about folds into a crane and joins in
    const origins = [];
    for (const e of s.enemies.pool.live) {
      if (e.dead || e.type === 'boss' || e.type === 'heavy' || e.group?.kind) continue;
      if (e.y >= -10 && e.y <= s.H + 10) {
        origins.push([e.x, e.y]);
        s.fx.puff('wisp_s_0', e.x, e.y, 0.35);
      }
      s.enemies.remove(e);
    }
    s.enemies.pool.sweep();
    // the rest rise from the Children's Peace Monument (or from below, if it has gone by)
    let my = s.parallax.screenY(this.cfg.u ?? 0);
    if (!(my > 8 && my < s.H - 8)) my = s.H + 12;
    const mx = this.cfg.x ?? VIEW.width / 2;
    for (let i = 0; i < this.n; i++) {
      const [x, y] = origins[i] ?? [mx + (Math.random() - 0.5) * 6, my + Math.random() * 4];
      const c = this.pool.spawn('orizuru_0', x, y);
      c.col = this.cfg.water ? [0xe1f4f2, 0xa4cbdc, 0xffffff][i % 3] : COLORS[i % COLORS.length];
      c.setTint(c.col).setAlpha(0);
      c.px = x;
      c.py = y;
      c.vx = (Math.random() - 0.5) * 20;
      c.vy = -20 - Math.random() * 30;
      c.i = i;
      c.ph = i / this.n;
      c.delay = origins[i] ? 0 : 0.15 + i * 0.09;
      c.age = 0;
      c.head = -Math.PI / 2;
      c.spark = Math.random() * 0.2;
      c.leaving = false;
      c.glow = this.glows.spawn('orizuru_glow', x, y);
      c.glow.setTint(COLORS[i % COLORS.length]).setAlpha(0).setBlendMode(1);
      this.cranes.push(c);
    }
  }

  end() {
    const s = this.s;
    this.active = false;
    this.done = true;
    s.ceasefire = false;
    s.music.duck?.(1);
    for (const c of this.cranes) c.leaving = true;
  }

  /** Where crane c should be at dance time tau: the formations blended into one another. */
  target(c, tau, H) {
    const D = this.to - this.from;
    const cx = VIEW.width / 2;
    const cy = H * 0.42;
    const a0 = c.ph * Math.PI * 2;
    const spiral = () => {
      const r = 8 + 52 * ease(tau / 3);
      const a = a0 * 1 + tau * 1.3 + c.ph * 2;
      return [cx + Math.cos(a) * r, cy + 20 - ease(tau / 3) * 20 + Math.sin(a) * r * 0.75];
    };
    const ring = () => {
      const a = a0 + tau * 0.7;
      return [cx + Math.cos(a) * 58, cy + Math.sin(a) * 46 + Math.sin(tau * 3 + c.i) * 2];
    };
    const eight = () => {
      const p = a0 + tau * 1.05;
      const d = 1 + Math.sin(p) ** 2;
      return [cx + (66 * Math.cos(p)) / d, cy + (52 * Math.sin(p) * Math.cos(p)) / d];
    };
    const garland = () => {
      const inner = c.i % 2 === 0;
      const a = a0 + (inner ? -1 : 1) * tau * 0.8;
      const r = inner ? 28 : 64;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.78];
    };
    const away = () => [cx + Math.cos(a0) * 70, -50 - c.ph * 60];
    const plan = [
      [0, spiral],
      [3.0, ring],
      [5.6, eight],
      [8.4, garland],
      [D - 1.4, away],
    ];
    let k = 0;
    while (k < plan.length - 1 && tau >= plan[k + 1][0]) k++;
    const [x0, y0] = plan[k][1]();
    if (k === plan.length - 1) return [x0, y0];
    const [tn, fn] = plan[k + 1];
    const w = ease((tau - (tn - 0.9)) / 0.9);
    if (w <= 0) return [x0, y0];
    const [x1, y1] = fn();
    return [x0 + (x1 - x0) * w, y0 + (y1 - y0) * w];
  }

  move(dt, t) {
    const s = this.s;
    const H = s.H;
    const tau = t - this.from;
    const pl = s.player?.alive ? s.player : null;
    const fx = s.fx;
    let j = 0;
    for (const c of this.cranes) {
      c.age += dt;
      if (c.age < c.delay) {
        this.cranes[j++] = c;
        continue;
      }
      let tx;
      let ty;
      if (c.leaving) {
        tx = c.px + Math.cos(c.ph * 9) * 30;
        ty = -80;
      } else [tx, ty] = this.target(c, Math.max(0, tau - c.delay * 0.5), H);
      // a soft spring to the dance, a little lazy so the flock flows
      const k = c.leaving ? 3 : 7;
      c.vx += ((tx - c.px) * k - c.vx * 3.2) * dt;
      c.vy += ((ty - c.py) * k - c.vy * 3.2) * dt;
      if (c.leaving) c.vy -= 60 * dt;
      // out of the ship's way
      if (pl) {
        const dx = c.px - pl.x;
        const dy = c.py - pl.y;
        const d = Math.hypot(dx, dy);
        if (d < 22 && d > 0.01) {
          const push = (1 - d / 22) * 420 * dt;
          c.vx += (dx / d) * push;
          c.vy += (dy / d) * push;
        }
      }
      c.px += c.vx * dt;
      c.py += c.vy * dt;
      const sp = Math.hypot(c.vx, c.vy);
      if (sp > 6) {
        const want = Math.atan2(c.vy, c.vx);
        const diff = Math.atan2(Math.sin(want - c.head), Math.cos(want - c.head));
        c.head += diff * Math.min(1, dt * 6);
      }
      const beat = Math.floor(c.age * (5 + Math.min(6, sp * 0.05)) + c.i) % FLAP.length;
      c.setFrame(`orizuru_${FLAP[beat]}`);
      c.setRotation(c.head + Math.PI / 2);
      const a = Math.min(1, (c.age - c.delay) * 4) * (c.leaving ? Math.max(0, Math.min(1, (c.py + 30) / 60)) : 1);
      c.setAlpha(0.95 * a);
      c.glow.setPosition(Math.round(c.px), Math.round(c.py)).setAlpha(0.35 * a * (0.8 + 0.2 * Math.sin(c.age * 5 + c.i)));
      // a trail of glints in its colour
      if ((c.spark -= dt) <= 0) {
        c.spark = 0.1 + Math.random() * 0.12;
        const p = fx.part(fx.parts, 'dot_1', c.px - Math.cos(c.head) * 5, c.py - Math.sin(c.head) * 5);
        p.vx = -c.vx * 0.15 + (Math.random() - 0.5) * 8;
        p.vy = -c.vy * 0.15 + 8 + Math.random() * 8;
        p.drag = 1.5;
        p.life = p.max = 0.5 + Math.random() * 0.3;
        p.a0 = 0.7 * a;
        p.setTint(c.col);
      }
      c.setPosition(Math.round(c.px), Math.round(c.py));
      if (c.leaving && c.py < -40) {
        this.pool.kill(c);
        this.glows.kill(c.glow);
        continue;
      }
      this.cranes[j++] = c;
    }
    this.cranes.length = j;
    this.pool.sweep();
    this.glows.sweep();
  }
}
