// Three behaviours for a city's small fry, first made for Fukuoka (docs/plan-fukuoka.md, phase 10) and shared with
// the other cities (docs/plan-silniejsze-fale.md); Fukuoka's looks are described here, each city has its own:
//   chain - paper lanterns on a rope strung across a street between two poles, on the map. One shot down sets its
//           neighbours alight one after another along the rope, each burning paying more than the last; a burning
//           one close to another rope sets that one going too. Every third has an eye and fires.
//   split - a pair of mentaiko, two sacs of roe joined at the top, falling slowly and dropping shots. Shot apart,
//           its two sacs fly out to the sides, take aim and dive at the ship; a sac shot down spills its roe as
//           points flying to the ship.
//   cart  - the oboro-guruma, a Heian ox-cart with no ox, driving its street on the map and throwing fans of shots
//           from its wheels. It breaks up as it is hit: the blind torn off (it sees, and fires sooner), a wheel gone
//           (it limps), the roof on fire; its wreck stays on the street, and it leaves a power-up behind.
// Their looks are a skin's `chain`, `split` and `cart` (skins.js); their tuning CHAIN, SPLIT, CART (config.js). A look may
// change the colours and sounds: chain { rope, char, light, text }, split { sound }, cart { debris, light }; a rope may
// hang several things in turn (chain.frames, as Nagasaki's signal flags). A cart's
// look may have a beast pulling it that is no yokai (cart.runner): when the cart goes down it breaks free and runs off.
import { CART, CHAIN, DEPTH, SPLIT, SPLIT_ONE, VIEW } from '../../config.js';
import { volley } from '../../difficulty.js';
import { slow, DOWN, TAU, EXTRAS } from './shared.js';

/**
 * The order a rope of n lanterns burns in when the one at `from` goes: [[index, step], ...], step 1 its two
 * neighbours, step 2 the next two out, and so on (each burns `CHAIN.step` s after the one before it).
 */
export function burnOrder(n, from) {
  const out = [];
  for (let k = 1; k < n; k++) for (const i of [from - k, from + k]) if (i >= 0 && i < n) out.push([i, k]);
  return out;
}

/** The lanterns of other ropes within r px of `src` (a burning one), still hanging and not yet alight. */
export function catching(lanterns, src, r) {
  return lanterns.filter((l) => l !== src && l.rope !== src.rope && !l.dead && !(l.fuse > 0) && (l.x - src.x) ** 2 + (l.y - src.y) ** 2 <= r * r);
}

/** Which state of breaking up the cart is in at `hp` of `max`: 0 whole .. 3 the roof on fire. */
export function cartStage(hp, max, stages = CART.stages) {
  let st = 0;
  for (const k of stages) if (hp <= max * k) st++;
  return st;
}

/** Where along a rope (t 0..1 from one pole to the other) a point hangs: its x and its place on the strip (u). */
export function ropeAt(rope, t) {
  return [rope.x1 + (rope.x2 - rope.x1) * t, rope.u + rope.skew * t - rope.sag * 4 * t * (1 - t)];
}

const ROPE = 0x2a1c14; // the hemp rope
const CHAR = 0x120c0a; // and where it burnt

export const chainSplitCart = {
  // ---------------------------------------------------------------- chain
  /** w: { x, x2, n, skew }: a rope from x to x2 (by default the mirror of x), its far end `skew` px up the map. */
  spawnChain(w, base, look) {
    const s = this.scene;
    const n = w.n ?? CHAIN.n;
    const rope = { u: s.parallax.stripU(-14), x1: w.x, x2: w.x2 ?? VIEW.width - w.x, skew: w.skew ?? 0, sag: CHAIN.sag, n, burnt: new Array(n).fill(false), look };
    (this.ropes ??= []).push(rope);
    for (const t of [0, 1]) {
      const [x, u] = ropeAt(rope, t);
      this.wrecks.spawn(look.pole, x, s.parallax.screenY(u), { u });
    }
    let first = null;
    for (let i = 0; i < n; i++) {
      const [x, u] = ropeAt(rope, (i + 1) / (n + 1));
      const eye = i % 3 === 1;
      const e = this.pool.spawn(eye ? `${look.eye}0` : look.frames?.[i % look.frames.length] ?? look.frame, x, s.parallax.screenY(u), { ...base, u, rope, slot: i, eye, wreck: look.burnt, timer: CHAIN.every * (0.4 + Math.random() * 0.8) });
      e.setDepth(DEPTH.ground);
      first ??= e;
    }
    return first;
  },

  chain(e, dt, b) {
    const s = this.scene;
    const L = e.rope.look;
    e.y = s.parallax.screenY(e.u);
    e.setRotation(Math.sin(e.age * 2.1 + e.slot * 0.9) * 0.09); // swaying on the rope
    if (e.fuse > 0) {
      // alight: it glows and flickers, then burns
      this.pool.reframe(e, `${L.lit}${Math.floor(e.age * 14) % 2}`).setScale(e.base);
      if (Math.random() < dt * 20) s.fx.smoke(e.x, e.y - 4, 1, 1, true);
      if ((e.fuse -= dt) <= 0) this.destroy(e);
      return;
    }
    if (!e.eye) return;
    this.pool.reframe(e, `${L.eye}${e.timer < 0.4 ? Math.floor(e.timer * 10) % 2 : 0}`).setScale(e.base); // (blinking as it takes aim)
    if ((e.timer -= dt) > 0 || !this.canFire(e)) return;
    e.timer = CHAIN.every;
    b.fire(e.x, e.y + 3, this.aimAt(e, 0, 3), slow);
  },

  /** A lantern gone: its neighbours catch, and lanterns of another rope close by; a run of burning pays more. */
  chainDown(e) {
    const s = this.scene;
    const rope = e.rope;
    rope.burnt[e.slot] = true;
    const L = rope.look ?? {};
    s.fx.light(e.x, e.y, 0.9, true, L.light ?? 0xff9a40);
    if (e.chainK > 0) {
      const pts = CHAIN.bonus * e.chainK * s.score.mult;
      s.score.add(pts);
      s.fx.text(e.x, e.y - 9, `${pts}`, 0.7, L.text ?? 0xffc070);
      s.sfx.chain?.(e.chainK);
    }
    const k = e.chainK + 1;
    const lit = (l, delay) => {
      if (l.dead || l.fuse > 0 || l.hp <= 0) return;
      l.fuse = delay;
      l.chainK = k;
    };
    for (const l of this.pool.live) {
      if (l.type !== 'chain' || l.dead) continue;
      if (l.rope === rope && Math.abs(l.slot - e.slot) === 1) lit(l, CHAIN.step);
    }
    for (const l of catching(this.pool.live.filter((o) => o.type === 'chain'), e, CHAIN.cross)) lit(l, CHAIN.step * 2);
  },

  /** The ropes, drawn every frame between their poles through the lanterns (charred where one burnt). */
  updateRopes() {
    const s = this.scene;
    if (!this.ropes?.length) return this.ropeG?.clear();
    this.ropeG ??= s.add.graphics().setDepth(DEPTH.ground - 0.01);
    const g = this.ropeG.clear();
    const R = 1 / 3; // (a fine pixel: the rope is a third of a pixel thick at 540 px)
    this.ropes = this.ropes.filter((r) => s.parallax.screenY(r.u + Math.min(0, r.skew)) - r.sag < s.H + 30);
    for (const r of this.ropes) {
      const pt = (t) => {
        const [x, u] = ropeAt(r, t);
        return [x, s.parallax.screenY(u) - (t > 0 && t < 1 ? 5 : 8)]; // (through the lanterns' tops; the poles' heads)
      };
      // between each two things on it (a pole, a lantern): charred if a lantern beside it burnt, gone if both did
      for (let a = 0; a <= r.n; a++) {
        const left = a > 0 && r.burnt[a - 1];
        const right = a < r.n && r.burnt[a];
        if (left && right) continue;
        const burnt = left || right;
        g.lineStyle(burnt ? R * 2 : R * 3, burnt ? r.look?.char ?? CHAR : r.look?.rope ?? ROPE, burnt ? 0.85 : 1);
        for (let j = 0; j < 3; j++) {
          const [x0, y0] = pt((a + j / 3) / (r.n + 1));
          const [x1, y1] = pt((a + (j + 1) / 3) / (r.n + 1));
          g.lineBetween(x0, y0, x1, y1);
        }
      }
    }
  },

  // ---------------------------------------------------------------- split
  spawnSplit(w, base, look) {
    const e = this.pool.spawn(look.frame, w.x, -14, { ...base, timer: SPLIT.every * (0.5 + Math.random() * 0.6) });
    e.play(look.anim);
    e.look = look;
    return e;
  },

  split(e, dt, b) {
    const s = this.scene;
    if (!e.one) {
      // the pair: falling slowly, swaying, dropping a shot now and then
      e.y += SPLIT.fall * dt;
      e.x = e.x0 + Math.sin(e.age * 1.3) * SPLIT.sway;
      e.setRotation(Math.cos(e.age * 1.3) * 0.12);
      if ((e.timer -= dt) <= 0 && this.canFire(e)) {
        e.timer = SPLIT.every;
        b.fire(e.x, e.y + 8, this.aimAt(e, 0, 8), slow);
      }
      return;
    }
    // a sac on its own: flying out, taking aim (shaking), diving
    if (e.state === 'out') {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vx *= Math.max(0, 1 - 3.5 * dt);
      e.vy *= Math.max(0, 1 - 3.5 * dt);
      e.setRotation(Math.sign(e.vx) * Math.min(0.9, Math.abs(e.vx) / 80));
      if ((e.timer -= dt) <= 0) Object.assign(e, { state: 'aim', timer: SPLIT.aim });
    } else if (e.state === 'aim') {
      const a = this.aimAt(e);
      e.setRotation(a - DOWN + (Math.random() - 0.5) * 0.25);
      if ((e.timer -= dt) <= 0) {
        e.state = 'dive';
        e.vx = Math.cos(a) * SPLIT.dive;
        e.vy = Math.sin(a) * SPLIT.dive;
        e.setRotation(a - DOWN);
        s.sfx[e.look?.sound ?? 'squelch']?.();
      }
    } else {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    }
  },

  /** The pair shot apart: its two sacs fly out (a bomb takes it all at once); a sac shot down spills its roe. */
  splitDown(e, byBomb) {
    const s = this.scene;
    s.sfx[e.look?.sound ?? 'squelch']?.();
    if (e.one) {
      if (byBomb) return;
      for (let i = 0; i < SPLIT.roe; i++) s.fx.coin(e.x + (Math.random() - 0.5) * 6, e.y + (Math.random() - 0.5) * 8, SPLIT.roePts * s.score.mult);
      return;
    }
    if (byBomb) return;
    // the two sacs are part of its wave: the bonus waits for them too (one pair alone becomes a wave of three)
    const pack = e.pack ?? { n: 1, hit: 0, lost: false };
    pack.n += 2;
    const L = e.look;
    for (const side of [-1, 1]) {
      const o = this.pool.spawn(L.one, e.x + side * 5, e.y, {
        ...EXTRAS,
        type: 'split',
        def: SPLIT_ONE,
        hp: SPLIT_ONE.hp,
        maxHp: SPLIT_ONE.hp,
        radius: SPLIT_ONE.radius,
        age: 0,
        seen: 1,
        flash: 0,
        flashCool: 0,
        ground: false,
        head: null,
        u: 0,
        x0: e.x,
        bits: e.bits,
        art: L.one,
        one: true,
        look: L,
        pack,
        state: 'out',
        timer: 0.45,
        vx: side * SPLIT.flyOut,
        vy: -12,
        shots: 0,
        dir: side,
        path: 'line',
        pattern: 'aimed',
      });
      o.setDepth(DEPTH.air);
      o.play(L.oneAnim);
    }
  },

  // ---------------------------------------------------------------- cart
  /**
   * Down its street (w.x; w.up: up it, as a ferry crossing against the scroll), or across from a screen edge (w.dir
   * -1/1 at w.y), like Sapporo's snowploughs. w.stop: where its way ends (a u going up or down, an x going across):
   * it stops there, as a ferry at its pier, and fights on where it lies.
   */
  spawnCart(w, base, look) {
    const s = this.scene;
    const horiz = typeof w.dir === 'number';
    const x = horiz ? (w.dir > 0 ? -16 : VIEW.width + 16) : w.x;
    const y = horiz ? w.y : -20;
    const e = this.pool.spawn(`${look.anim}0_0`, x, y, { ...base, horiz, dir: horiz ? w.dir : w.up ? -1 : 1, stop: w.stop ?? null, docked: false, wreck: look.wreck, timer: 1.4, cartStage: 0, flee: w.flee ?? null });
    e.u = s.parallax.stripU(y);
    e.look = look;
    e.play(`${look.anim}0`);
    e.setRotation(horiz ? -e.dir * Math.PI / 2 : e.dir < 0 ? Math.PI : 0); // (it is drawn driving down the screen)
    return e;
  },

  cart(e, dt, b) {
    const s = this.scene;
    const L = e.look;
    const st = cartStage(e.hp, e.maxHp);
    if (st > e.cartStage) this.cartBreaks(e, st);
    // a wheel gone: it limps along slower, lurching
    const limp = e.cartStage >= 2;
    const v = CART.speed * (limp ? 0.6 : 1) * (limp ? 0.75 + Math.abs(Math.sin(e.age * 4)) * 0.5 : 1);
    if (!e.docked) {
      if (e.horiz) e.x += e.dir * v * dt;
      else e.u -= e.dir * v * dt;
      // (at the end of its way it stops: a ferry at its pier)
      const at = e.horiz ? e.x : e.u;
      const past = e.stop != null && (e.horiz ? e.dir * (at - e.stop) : -e.dir * (at - e.stop)) >= 0;
      if (past) {
        if (e.horiz) e.x = e.stop;
        else e.u = e.stop;
        e.docked = true;
      }
    }
    e.y = s.parallax.screenY(e.u);
    const base = e.horiz ? -e.dir * Math.PI / 2 : e.dir < 0 ? Math.PI : 0;
    e.setRotation(base + (limp && !e.docked ? Math.sin(e.age * 4) * 0.09 : 0));
    if (e.cartStage >= 3 && Math.random() < dt * 14) {
      // the roof burning
      s.fx.smoke(e.x + (Math.random() - 0.5) * 8, e.y - 6, 1, 2, true);
      if (Math.random() < 0.3) s.fx.spark(e.x + (Math.random() - 0.5) * 10, e.y - 4, 0xffa040);
    }
    if ((e.timer -= dt) > 0 || !this.canFire(e)) return;
    // the blind torn off, it sees: it fires sooner; on fire, sooner still
    e.timer = CART.every * [1, 0.85, 0.85, 0.7][e.cartStage];
    // a fan of shots off each wheel, like its spokes, turning a little each time
    const n = volley(CART.spokes);
    const off = (e.shots++ % 2) * (Math.PI / n);
    const wheels = e.cartStage >= 2 ? [1] : [-1, 1];
    for (const side of wheels) {
      const [wx, wy] = e.horiz ? [e.x, e.y + side * 8] : [e.x + side * 8, e.y + 4];
      for (let i = 0; i < n; i++) b.fire(wx, wy, off + (i / n) * TAU, slow);
    }
  },

  /** The cart breaks up a stage further: bits fly, it creaks, and it looks it. */
  cartBreaks(e, st) {
    const s = this.scene;
    e.cartStage = st;
    e.play(`${e.look.anim}${st}`);
    s.sfx.creak?.();
    s.fx.debris(e.x, e.y, st === 2 ? 10 : 6, e.look.debris ?? 0x3a2a26, 1, true);
    if (st === 2) {
      s.fx.shards(e.x + 8, e.y + 4, 4, true); // (the wheel coming off)
      s.sfx.wheel?.();
    }
    if (st === 3) s.fx.light(e.x, e.y - 4, 1.2, true, e.look.light ?? 0xff8a30);
    s.cameras.main.shake(80, 0.002);
  },

  /** The cart down: it leaves a power-up on the street; the beast pulling it (if any) breaks free and runs off. */
  cartDown(e) {
    const c = ['red', 'blue', 'green'][Math.floor(Math.random() * 3)];
    this.scene.spawnPickup(c, e.x, e.y, -40);
    const R = e.look?.runner;
    if (!R) return;
    // where it stood in the shafts, ahead of the cart; on along the cart's way, at a run
    const [fx, fu] = e.horiz ? [e.dir, 0] : [0, -e.dir];
    const r = this.runners.spawn(`${R.anim}_0`, e.x + fx * R.ahead, e.y, { u: e.u + fu * R.ahead, vx: fx * R.speed, vu: fu * R.speed, turn: e.flee });
    r.play(R.anim);
    this.scene.sfx.creak?.();
  },

  /**
   * The beasts run off: along the cart's way, then (the wave's `flee`: [[x, u], ...]) from one point of their way
   * out to the next, along the lanes and paths there, and on past the last one off the screen.
   */
  runAway(dt) {
    const s = this.scene;
    for (const r of this.runners.live) {
      const v = Math.hypot(r.vx, r.vu);
      const to = r.turn?.[0];
      if (to) {
        const [dx, du] = [to[0] - r.x, to[1] - r.u];
        const d = Math.hypot(dx, du);
        if (d < v * dt) {
          r.x = to[0];
          r.u = to[1];
          r.turn = r.turn.length > 1 ? r.turn.slice(1) : null;
          if (r.turn) {
            const [nx, nu] = [r.turn[0][0] - r.x, r.turn[0][1] - r.u];
            const n = Math.hypot(nx, nu) || 1;
            [r.vx, r.vu] = [(nx / n) * v, (nu / n) * v];
          }
        } else [r.vx, r.vu] = [(dx / d) * v, (du / d) * v];
      }
      r.x += r.vx * dt;
      r.u += r.vu * dt;
      r.setRotation(Math.atan2(-r.vx, -r.vu)); // (it is drawn running down the screen)
      r.y = s.parallax.screenY(r.u);
      if (r.y > s.H + 30 || r.y < -40 || r.x < -30 || r.x > VIEW.width + 30) this.runners.kill(r);
    }
    this.runners.sweep();
  },
};
