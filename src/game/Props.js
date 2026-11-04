import { DEPTH } from '../config.js';
import { pathAt } from './pathTime.js';

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
// filled in place every frame (where a mover is, the point on its route), so moving them makes no garbage
const WHEN = { s: 0, dir: 1, moving: true };
const AT = [0, 0, 0, 0];

export class Props {
  constructor(scene, id, meta, parallax) {
    this.scene = scene;
    this.key = `props_${id}`;
    this.dispersePuffs = id === 'stage6'; // Only Beppu's hot-spring steam reacts to the ship.
    this.px = parallax;
    const off = new URLSearchParams(location.search).has('noprops') || !scene.textures.exists(this.key);
    this.list = off ? [] : (meta.props ?? []).map((p) => this.prepare(p));
    this.tints = meta.tint ?? null;
    this.time = 0;
    this.calm = 0; // 0..1: how much the layer steps back for the bullets
    this.calmTarget = 0;
    this.fade = 1;
    this.wind = 0; // px/s the steam and smoke lean with
    this.free = new Map(); // spare images by depth (a changed depth re-sorts the whole scene)
    this.parts = []; // puffs, wakes and one-shot spots
    this.warm();
  }

  /**
   * Make the images ahead, as many at each depth as can be out at once anywhere on the strip (a screen's
   * height of movers, puffs and wakes, counted from the list), so the steam of Kannawa or a street full of cars
   * never has to stop and make them in the middle of play.
   */
  warm() {
    if (!this.list.length) return;
    const H = 420 + 48;
    const need = (p) => {
      const n = { loop: 1, wave: p.parts?.length ?? 0, path: p.n, orbit: p.n, wander: p.n }[p.k] ?? 0;
      if (p.k === 'emit') return [[p.depth, Math.ceil(p.rate * p.life[1] * (p.burst ? 1.6 : 1))]];
      if (p.k === 'spot') return [[p.depth, Math.ceil(p.rate * (p.f.length / p.fps) + 1)]];
      const out = [[p.depth, n]];
      if (p.k === 'path' && p.wake) out.push([p.depth - 0.01, Math.ceil((p.n * p.sp * (p.wake.life ?? 1.5)) / p.wake.every)]);
      return out;
    };
    const peak = new Map();
    for (const top of this.list) {
      // a screen whose top edge is where this one comes in: everything overlapping it is out at once
      const lo = top.e[1] - H;
      const sum = new Map();
      for (const p of this.list) {
        if (p.e[1] < lo || p.e[0] > top.e[1]) continue;
        for (const [d, n] of need(p)) sum.set(d, (sum.get(d) ?? 0) + n);
      }
      for (const [d, n] of sum) peak.set(d, Math.max(peak.get(d) ?? 0, n));
    }
    const frame = this.scene.textures.get(this.key).getFrameNames()[0];
    for (const [d, n] of peak) {
      const spare = [];
      for (let i = 0; i < Math.min(n, 320); i++) spare.push(this.scene.add.image(0, 0, this.key, frame).setDepth(d).setVisible(false));
      this.free.set(d, spare);
    }
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
      p.s = 0;
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

  /** Set the clock to stage time t (start of play, a debug jump): the movers go where they'd be by then. */
  sync(t) {
    this.time = t;
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

  img(p, frame, ox = 0.5, oy = 0.5, depth = p.depth) {
    const o = this.free.get(depth)?.pop() ?? this.scene.add.image(0, 0, this.key, frame).setDepth(depth);
    o.setTexture(this.key, frame).setOrigin(ox, oy).setAlpha(1).setRotation(0).setFlipX(false).setVisible(true);
    if (p.tint && this.tints) o.setTint(this.tintAt(p.u ?? p.pts?.[0][1] ?? 0));
    else o.clearTint();
    return o;
  }

  release(o) {
    o.setVisible(false);
    if (!this.free.has(o.depth)) this.free.set(o.depth, []);
    this.free.get(o.depth).push(o);
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
    for (let i = 0; i < n; i++) {
      const f = p.f[p.k === 'wave' ? p.parts[i][0] : i % p.f.length];
      p.objs.push(this.img(p, Array.isArray(f) ? f[0] : f, corner ? 0 : 0.5, corner ? 0 : 0.5));
    }
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

  /** Point at distance s along a route: [x, u, dx, du] (direction of the segment), in the shared AT. */
  at(p, s) {
    s = Math.max(0, Math.min(p.total, s));
    let i = 1;
    while (i < p.len.length - 1 && p.len[i] < s) i++;
    const a = p.pts[i - 1];
    const b = p.pts[i];
    const x0 = a[0];
    const u0 = a[1];
    const x1 = b[0];
    const u1 = b[1];
    const seg = p.len[i] - p.len[i - 1] || 1;
    const k = (s - p.len[i - 1]) / seg;
    AT[0] = x0 + (x1 - x0) * k;
    AT[1] = u0 + (u1 - u0) * k;
    AT[2] = (x1 - x0) / seg;
    AT[3] = (u1 - u0) / seg;
    return AT;
  }

  path(p) {
    // (from the stage clock, not stepped along, so movers that crossed off screen are where they should be when
    // they come back, and the traffic the generator planned never drives through itself)
    const at = pathAt(p, this.time, WHEN);
    p.s = at.s;
    p.dir = at.dir;
    const moving = at.moving;
    for (let i = 0; i < p.n; i++) {
      let s = p.s - i * p.gap;
      if (p.mode !== 'pp') s = ((s % p.total) + p.total) % p.total;
      const pt = this.at(p, s);
      const x = pt[0];
      const u = pt[1];
      const dx0 = pt[2];
      const du0 = pt[3];
      const dx = dx0 * p.dir;
      const du = du0 * p.dir;
      const o = p.objs[i];
      let frames = p.f;
      if (p.turn === 'rot') o.setRotation(Math.atan2(-du, dx));
      else if (Math.abs(du) > Math.abs(dx) && (p.fu || p.fd)) frames = du > 0 ? p.fu ?? p.f : p.fd ?? p.f;
      else if (p.turn === 'flip') o.setFlipX(dx < 0);
      const step = moving ? Math.floor(this.time * p.fps + i) : 0;
      if (p.cars) {
        // mover i has its own frame, or its own frames to cycle through (a dancer in a parade)
        const own = frames[i % frames.length];
        this.setFrame(o, Array.isArray(own) ? own[step % own.length] : own);
      } else this.setFrame(o, frames[step % frames.length]);
      o.setPosition(Math.round(x), this.px.screenY(Math.round(u))).setAlpha(this.alphaOf(p));
      if (p.wake && moving) {
        const tr = (p.trail[i] ??= { x, u });
        if (Math.hypot(x - tr.x, u - tr.u) >= p.wake.every) {
          tr.x = x;
          tr.u = u;
          const w = this.img(p, p.wake.f[0], 0.5, 0.5, p.depth - 0.01).setRotation(Math.atan2(-du, dx));
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
    const pl = this.dispersePuffs && this.scene.player?.alive ? this.scene.player : null;
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
        if (pl) {
          const rx = q.x + q.dx - pl.x;
          const ry = y - q.rise - pl.y;
          const d = Math.hypot(rx, ry);
          if (d < 48) {
            const k = 1 - d / 48;
            const push = k * 480 * dt;
            const sx = Math.abs(rx) > 2 ? rx / (d || 1) : pl.bank >= 0 ? 1 : -1;
            q.vx = (q.vx || 0) + sx * push;
            q.vyPush = (q.vyPush || 0) + (ry / (d || 1)) * push * 0.55;
            if (d < 30 && Math.random() < dt * 28) {
              const fx = this.scene.fx;
              for (const side of [-1, 1]) {
                const bigWisp = Math.random() < 0.5;
                const w = fx.part(fx.parts, bigWisp ? 'steam_0' : 'wisp_s_0', pl.x + side * 6, pl.y);
                w.vx = side * (65 + Math.random() * 50);
                w.vy = 18 + Math.random() * 28;
                w.grow = bigWisp ? 0.5 : 1.3;
                w.life = w.max = 0.42;
                w.a0 = bigWisp ? 0.5 : 0.75;
                w.setScale(bigWisp ? 0.45 : 1.0);
              }
            }
          }
        }
        if (q.vx || q.vyPush) {
          q.dx += q.vx * dt;
          q.rise -= q.vyPush * dt;
          const damp = Math.max(0, 1 - 1.5 * dt);
          q.vx *= damp;
          q.vyPush *= damp;
        }
        const stage = p.f[Math.min(p.f.length - 1, Math.floor(k * p.f.length * 1.2))];
        this.setFrame(o, stage[q.v % stage.length]);
        const a = Math.min(1, k * 8) * (k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5) * p.a * this.fade;
        o.setPosition(Math.round(q.x + q.dx), Math.round(y - q.rise)).setAlpha(a);
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
