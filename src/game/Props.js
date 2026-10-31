import { DEPTH } from '../config.js';

// The living background: the parts of the stage strip that move, listed in meta.props by the art
// generator (tools/art/props.mjs) with their frames in bg/<id>/props.png.
//   loop   frames cycling in place: flags, neon, bubbling pools, fire, a turning wheel
//   wave   parts whose alpha follows a sine: gusts sweeping a field, glints, glowing lava
//   path   boats, trams and trains along a route, with a wake behind boats
//   orbit  gondolas going round a Ferris wheel
//   emit   puffs of steam or smoke rising, swelling and bending with the wind
//   wander koi, swans, crocodiles, skaters roaming inside an ellipse
//   spot   one-shot animations at random places: splashes, bursting bubbles, a dolphin jumping
//
// Bullets stay readable: everything sits under the enemies (and far under their bullets), moves slowly
// or in place, and nothing small and bright flies about. When the screen fills with bullets (calm, set
// by the stage) the effects fade back: steam, bubbles, glints, blinking neon (fx); solid things that
// stand in for part of the strip (wheels, boats, trains, animals) stay as they are.
const BASE = DEPTH.mid + 0.5;
const TAU = Math.PI * 2;

export class Props {
  constructor(scene, id, meta, parallax) {
    this.scene = scene;
    this.key = `props_${id}`;
    this.px = parallax;
    const off = new URLSearchParams(location.search).has('noprops') || !scene.textures.exists(this.key);
    this.list = off ? [] : (meta.props ?? []).map((p) => this.prepare(p));
    this.tints = meta.tint ?? null;
    this.time = 0;
    this.calm = 0; // 0..1: how much the layer steps back for the bullets
    this.calmTarget = 0;
    this.fade = 1;
    this.wind = 0; // px/s the steam and smoke lean with
    this.free = [];
    this.parts = []; // puffs, wakes and one-shot spots
  }

  prepare(src) {
    const p = { ...src, on: false, objs: [], acc: Math.random() };
    p.depth = BASE + (p.d ?? 0);
    p.alpha = p.a ?? 1;
    p.fx ??= p.k === 'emit' || p.k === 'spot' || p.k === 'wave' ? 1 : 0;
    if (p.k === 'path') {
      p.len = [0];
      for (let i = 1; i < p.pts.length; i++) p.len.push(p.len[i - 1] + Math.hypot(p.pts[i][0] - p.pts[i - 1][0], p.pts[i][1] - p.pts[i - 1][1]));
      p.total = p.len[p.len.length - 1];
      p.dir = 1;
      p.wait = 0;
      p.s = p.mode === 'pp' ? (p.n - 1) * p.gap + p.s0 * (p.total - (p.n - 1) * p.gap) : p.s0 * p.total;
      p.trail = [];
    }
    if (p.k === 'wander')
      p.ag = Array.from({ length: p.n }, () => {
        const a = Math.random() * TAU;
        const r = Math.sqrt(Math.random()) * 0.7;
        return { x: p.x + Math.cos(a) * r * p.rx, u: p.u + Math.sin(a) * r * p.ry, h: Math.random() * TAU, turn: 0, wait: 0 };
      });
    return p;
  }

  /** Set the clock to stage time t (start of play, a debug jump): movers that loop go where they'd be by then. */
  sync(t) {
    this.time = t;
    for (const p of this.list) if (p.k === 'path' && p.mode !== 'pp') p.s = (p.s0 * p.total + p.sp * t) % p.total;
  }

  /** What white turns into at strip position u (for frames drawn ungraded). */
  tintAt(u) {
    const t = this.tints;
    let i = 0;
    while (i < t.length - 2 && u >= t[i + 1][0]) i++;
    const k = Math.max(0, Math.min(1, (u - t[i][0]) / (t[i + 1][0] - t[i][0])));
    const a = t[i][1];
    const b = t[i + 1][1];
    const ch = (s) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * k);
    return (ch(16) << 16) | (ch(8) << 8) | ch(0);
  }

  img(p, frame, ox = 0.5, oy = 0.5) {
    const o = this.free.pop() ?? this.scene.add.image(0, 0, this.key, frame);
    o.setTexture(this.key, frame).setOrigin(ox, oy).setDepth(p.depth).setAlpha(1).setRotation(0).setFlipX(false).setVisible(true);
    if (p.tint && this.tints) o.setTint(this.tintAt(p.u ?? p.pts?.[0][1] ?? 0));
    else o.clearTint();
    return o;
  }

  release(o) {
    o.setVisible(false);
    this.free.push(o);
  }

  update(dt, H) {
    this.time += dt;
    const t = this.time;
    this.calm += (this.calmTarget - this.calm) * Math.min(1, dt * 2);
    this.fade = 1 - 0.45 * this.calm;
    this.wind = 4 + 5 * Math.sin(t * 0.21) + 3 * Math.sin(t * 0.67 + 1);
    const top = this.px.uTop + 24;
    const bottom = this.px.uTop - H - 24;
    for (const p of this.list) {
      const vis = p.e[1] >= bottom && p.e[0] <= top;
      if (vis !== p.on) (vis ? this.enter : this.leave).call(this, p);
      if (vis) this[p.k](p, dt);
    }
    this.updateParts(dt, H);
  }

  enter(p) {
    p.on = true;
    const n = { loop: 1, wave: p.parts?.length, path: p.n, orbit: p.n, wander: p.n }[p.k] ?? 0;
    const corner = p.k === 'loop' || p.k === 'wave';
    for (let i = 0; i < n; i++) p.objs.push(this.img(p, p.f[p.k === 'wave' ? p.parts[i][0] : i % p.f.length], corner ? 0 : 0.5, corner ? 0 : 0.5));
  }

  leave(p) {
    p.on = false;
    for (const o of p.objs) this.release(o);
    p.objs.length = 0;
  }

  setFrame(o, name) {
    if (o.frame.name !== name) o.setFrame(name);
  }

  // ------------------------------------------------------------ kinds

  loop(p) {
    const o = p.objs[0];
    const step = Math.floor(this.time * p.fps + p.ph * 97);
    const i = p.seq ? p.seq[step % p.seq.length] : step % p.f.length;
    o.setVisible(i >= 0);
    if (i >= 0) this.setFrame(o, p.f[i]);
    o.setPosition(p.x, this.px.screenY(p.u)).setAlpha(this.alphaOf(p));
  }

  /** Base alpha, faded back for the bullets if it is an effect. */
  alphaOf(p) {
    return p.fx ? p.alpha * this.fade : p.alpha;
  }

  wave(p) {
    const top = this.px.uTop;
    for (let j = 0; j < p.parts.length; j++) {
      const [, x, u, ph] = p.parts[j];
      const s = (1 + Math.sin(this.time * p.w + ph)) / 2;
      const a = (p.a0 + (p.a1 - p.a0) * s ** p.pw) * this.fade;
      p.objs[j].setPosition(x, top - u).setAlpha(a).setVisible(a > 0.01);
    }
  }

  /** Point at distance s along a route: [x, u, dx, du] (direction of the segment). */
  at(p, s) {
    s = Math.max(0, Math.min(p.total, s));
    let i = 1;
    while (i < p.len.length - 1 && p.len[i] < s) i++;
    const [x0, u0] = p.pts[i - 1];
    const [x1, u1] = p.pts[i];
    const seg = p.len[i] - p.len[i - 1] || 1;
    const k = (s - p.len[i - 1]) / seg;
    return [x0 + (x1 - x0) * k, u0 + (u1 - u0) * k, (x1 - x0) / seg, (u1 - u0) / seg];
  }

  path(p, dt) {
    const minS = p.mode === 'pp' ? (p.n - 1) * p.gap : 0;
    if (p.wait > 0) p.wait -= dt;
    else p.s += p.sp * dt * p.dir;
    if (p.mode === 'pp') {
      if (p.s > p.total || p.s < minS) {
        p.s = Math.max(minS, Math.min(p.total, p.s));
        p.dir = -p.dir;
        p.wait = p.hold;
      }
    } else if (p.s > p.total) p.s -= p.total;
    const moving = p.wait <= 0;
    for (let i = 0; i < p.n; i++) {
      let s = p.s - i * p.gap;
      if (p.mode !== 'pp') s = ((s % p.total) + p.total) % p.total;
      const [x, u, dx0, du0] = this.at(p, s);
      const dx = dx0 * p.dir;
      const du = du0 * p.dir;
      const o = p.objs[i];
      let frames = p.f;
      if (p.turn === 'rot') o.setRotation(Math.atan2(-du, dx));
      else if (Math.abs(du) > Math.abs(dx) && (p.fu || p.fd)) frames = du > 0 ? p.fu ?? p.f : p.fd ?? p.f;
      else if (p.turn === 'flip') o.setFlipX(dx < 0);
      this.setFrame(o, frames[p.cars ? i % frames.length : moving ? Math.floor(this.time * p.fps + i) % frames.length : 0]);
      o.setPosition(Math.round(x), this.px.screenY(Math.round(u))).setAlpha(this.alphaOf(p));
      if (p.wake && moving) {
        const tr = (p.trail[i] ??= { x, u });
        if (Math.hypot(x - tr.x, u - tr.u) >= p.wake.every) {
          tr.x = x;
          tr.u = u;
          const w = this.img(p, p.wake.f[0]);
          w.setDepth(p.depth - 0.01).setRotation(Math.atan2(-du, dx));
          this.parts.push({ o: w, kind: 'once', p, f: p.wake.f, x: Math.round(x), u: Math.round(u), t: 0, dur: p.wake.life ?? 1.5, a: 0.8 });
        }
      }
    }
  }

  orbit(p) {
    const cy = this.px.screenY(p.u);
    for (let i = 0; i < p.n; i++) {
      const a = this.time * p.w + (i * TAU) / p.n;
      const o = p.objs[i];
      o.setPosition(Math.round(p.x + Math.cos(a) * p.r), Math.round(cy + Math.sin(a) * p.ry)).setAlpha(this.alphaOf(p));
      if (p.tc) o.setTint(p.tc[(Math.floor(this.time * p.tw) + i) % p.tc.length]);
    }
  }

  emit(p, dt) {
    if (p.burst && Math.random() < p.burst * dt) p.gush = 0.5 + Math.random() * 0.7;
    const gush = p.gush > 0;
    if (gush) p.gush -= dt;
    p.acc -= dt * p.rate * (gush ? 3 : 1) * (1 - 0.5 * this.calm);
    while (p.acc <= 0) {
      p.acc += 0.6 + Math.random() * 0.8;
      const o = this.img(p, p.f[0][0]);
      this.parts.push({
        o,
        kind: 'puff',
        p,
        x: p.x + (Math.random() - 0.5) * 2 * p.sx,
        u: p.u,
        rise: 0,
        dx: 0,
        t: 0,
        dur: p.life[0] + Math.random() * (p.life[1] - p.life[0]),
        vy: p.vy * (0.8 + Math.random() * 0.4) * (gush ? 1.5 : 1),
        v: Math.floor(Math.random() * 8),
      });
    }
  }

  wander(p, dt) {
    for (let i = 0; i < p.n; i++) {
      const a = p.ag[i];
      const o = p.objs[i];
      if (a.wait > 0) a.wait -= dt;
      else {
        a.turn = Math.max(-1.2, Math.min(1.2, a.turn + (Math.random() - 0.5) * dt * 4));
        a.h += a.turn * dt;
        // turn back towards the middle near the edge of the pond
        const ex = (a.x - p.x) / p.rx;
        const eu = (a.u - p.u) / p.ry;
        if (ex * ex + eu * eu > 0.65) {
          const want = Math.atan2(p.u - a.u, p.x - a.x);
          const diff = Math.atan2(Math.sin(want - a.h), Math.cos(want - a.h));
          a.h += diff * Math.min(1, dt * 2.5);
        }
        a.x += Math.cos(a.h) * p.sp * dt;
        a.u += Math.sin(a.h) * p.sp * dt;
        if (Math.random() < p.idle * dt) a.wait = 1 + Math.random() * 2.5;
      }
      if (p.turn === 'rot') o.setRotation(-a.h);
      else if (p.turn === 'flip') o.setFlipX(Math.cos(a.h) < 0);
      this.setFrame(o, p.f[a.wait > 0 ? 0 : Math.floor(this.time * p.fps + i) % p.f.length]);
      o.setPosition(Math.round(a.x), this.px.screenY(Math.round(a.u))).setAlpha(this.alphaOf(p));
    }
  }

  spot(p, dt) {
    p.acc -= dt * (1 - 0.5 * this.calm);
    while (p.acc <= 0) {
      p.acc += (0.5 + Math.random()) / p.rate;
      let pick = Math.random() * p.rects.reduce((s, r) => s + r[2] * r[3], 0);
      let r = p.rects[0];
      for (const q of p.rects) if ((pick -= q[2] * q[3]) <= 0) {
        r = q;
        break;
      }
      const x = Math.round(r[0] + Math.random() * r[2]);
      const u = Math.round(r[1] - Math.random() * r[3]);
      this.parts.push({ o: this.img(p, p.f[0]), kind: 'once', p, f: p.f, x, u, t: 0, dur: p.f.length / p.fps, a: p.a ?? 1, fixed: true });
    }
  }

  // ------------------------------------------------------------ particles

  updateParts(dt, H) {
    let j = 0;
    for (const q of this.parts) {
      q.t += dt;
      const k = q.t / q.dur;
      const y = this.px.screenY(q.u);
      if (k >= 1 || y > H + 60) {
        this.release(q.o);
        continue;
      }
      this.parts[j++] = q;
      const o = q.o;
      if (q.kind === 'puff') {
        const p = q.p;
        q.rise += q.vy * (1 - 0.55 * k) * dt;
        q.dx += this.wind * p.wf * (0.25 + k) * dt;
        const stage = p.f[Math.min(p.f.length - 1, Math.floor(k * p.f.length * 1.2))];
        this.setFrame(o, stage[q.v % stage.length]);
        const a = Math.min(1, k * 8) * (k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5) * p.a * this.fade;
        o.setPosition(Math.round(q.x + q.dx), Math.round(y - q.rise)).setAlpha(a).setDepth(p.depth + k * 0.01);
      } else {
        // a wake or a one-shot animation, fixed to the ground
        const i = Math.min(q.f.length - 1, Math.floor(k * q.f.length));
        this.setFrame(o, q.f[i]);
        const a = q.fixed ? q.a : q.a * (1 - k);
        o.setPosition(q.x, y).setAlpha(a * this.fade);
      }
    }
    this.parts.length = j;
  }
}
