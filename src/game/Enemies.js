import Phaser from 'phaser';
import { DEPTH, ENEMIES, FAIR, VIEW } from '../config.js';
import { Pool } from './Pool.js';
import { SKINS } from './skins.js';

const { slow, normal, fast } = FAIR.bulletSpeed;
const DOWN = Math.PI / 2;
const TAU = Math.PI * 2;
// the tanuki's shapeshifted copies: one hit and they turn back into leaves
const DECOY = { hp: 1, weight: 0, score: 300, radius: 13, explosion: 's' };

// Six archetypes shared by every city (each stage picks a skin), plus stage bosses.
export class Enemies {
  constructor(scene, skin = 'kyoto') {
    this.scene = scene;
    this.skin = SKINS[skin] ?? SKINS.kyoto;
    this.pool = new Pool(scene, DEPTH.air);
    this.heads = new Pool(scene, DEPTH.ground + 0.2);
    this.wrecks = new Pool(scene, DEPTH.ground);
    this.heavy = null;
    this.bossGroup = null;
  }

  get live() {
    return this.pool.live;
  }

  count() {
    return this.pool.live.length;
  }

  spawn(w) {
    const def = ENEMIES[w.type];
    if (!def) {
      console.warn('unknown enemy type', w.type);
      return;
    }
    const s = this.scene;
    const base = {
      type: w.type,
      def,
      hp: w.hp ?? def.hp,
      radius: def.radius,
      age: 0,
      seen: 0, // time since it became visible
      state: 'enter',
      timer: 0,
      shots: 0,
      x0: w.x,
      path: w.path ?? 'line',
      pattern: w.pattern ?? 'aimed',
      dir: w.dir ?? (w.x < VIEW.width / 2 ? 1 : -1),
      flash: 0,
      flashCool: 0,
      ground: !!def.ground,
      head: null,
      u: 0,
      // per-skin extras, listed so a pooled sprite never keeps a previous enemy's state
      armor: 0,
      maxArmor: 0,
      lantern: false,
      flock: null,
      ghost: false, // faded out: shots pass through, no contact
      invuln: false, // shots are absorbed without damage
      pass: false, // shots fly through (still solid to touch)
      group: null,
      role: null,
      wreck: null,
      kind: null,
      song: null, // heavy with its own theme
      decoys: null,
    };
    base.maxHp = base.hp;
    const look = this.skin[w.look ?? w.type]; // look: an alternative skin entry, e.g. the Kyoto tanuki
    if (!look && w.type !== 'boss') return; // e.g. snowploughs exist only in Sapporo
    if (w.type === 'turret' && !w.pattern && look.pattern) base.pattern = look.pattern;
    let e;
    switch (w.type) {
      case 'popcorn':
        e = this.pool.spawn(look.frame, w.x, -8, base);
        e.play({ key: look.anim, startFrame: Math.floor(Math.random() * 2) });
        e.fireAt = Math.random() < FAIR.popcornFireChance ? 0.9 + Math.random() * 1.4 : Infinity;
        if (look.flock && w.flock) e.flock = w.flock;
        break;
      case 'shooter':
        e = this.pool.spawn(look.frame, w.x, -12, base);
        if (look.armor) {
          // ice lantern: the shell soaks up damage first, the flame inside is weak
          e.lantern = true;
          e.armor = e.maxArmor = look.armor;
          e.hp = e.maxHp = look.hp;
        } else e.play(look.anim);
        e.stopY = w.y ?? 50 + Math.random() * 24;
        break;
      case 'diver':
        if ((w.path ?? look.path) === 'glide') {
          // flying squirrel: clings to the trees at a screen edge, then glides across
          const side = w.x < VIEW.width / 2 ? -1 : 1;
          e = this.pool.spawn(look.frame, side < 0 ? -8 : VIEW.width + 8, w.y ?? 50, { ...base, path: 'glide', dir: -side, leaps: 0 });
          e.y0 = e.y;
          e.timer = 0.35;
          break;
        }
        e = this.pool.spawn(look.frame, w.x, -10, base);
        e.play(look.anim);
        e.stopY = w.y ?? 30 + Math.random() * 18;
        break;
      case 'carrier':
        e = this.pool.spawn(look.frame.replace('{c}', w.color ?? 'red'), w.x, -10, { ...base, color: w.color ?? 'red', path: w.path ?? 'zigzag' });
        e.play(look.anim.replace('{c}', e.color));
        e.zig = Math.random() < 0.5 ? -1 : 1;
        break;
      case 'heavy':
        e = this.pool.spawn(look.frame, w.x, -30, { ...base, kind: look.kind ?? null, song: w.music ?? null });
        e.play(look.anim);
        this.heavy = e;
        e.patternIndex = 0;
        break;
      case 'turret': {
        // spawns just above the screen and stays glued to the mid layer
        e = this.pool.spawn(look.base, w.x, -10, base);
        e.u = s.parallax.stripU(-10);
        e.timer = 0.9;
        e.head = this.heads.spawn(`${look.head}0`, w.x, -10);
        break;
      }
      case 'plow': {
        // drives along a street of the mid layer: down an avenue, or across from a screen edge
        const horiz = typeof w.dir === 'number';
        const x = horiz ? (w.dir > 0 ? -14 : VIEW.width + 14) : w.x;
        const y = horiz ? w.y : -16;
        e = this.pool.spawn(horiz ? look.side : look.frame, x, y, { ...base, horiz, dir: horiz ? w.dir : 1, wreck: look.wreck });
        e.play(horiz ? look.sideAnim : look.anim);
        e.setFlipX(horiz && w.dir < 0);
        e.u = s.parallax.stripU(y);
        e.head = this.heads.spawn(`${look.chute}0`, x, y);
        e.timer = 1.2;
        e.spray = 0;
        e.cool = 0;
        break;
      }
      case 'boss':
        return w.boss === 'kuma' ? this.spawnKuma(w, base) : this.spawnBoss(w, base);
      default:
        return;
    }
    e.setDepth(e.ground ? DEPTH.ground : DEPTH.air + (w.type === 'heavy' ? -0.1 : 0));
    return e;
  }

  nearest(x, y) {
    let best = null;
    let bd = Infinity;
    for (const e of this.pool.live) {
      if (e.y < 0 || e.hp <= 0 || e.ghost || e.invuln) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2 + (e.ground ? 900 : 0);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  canFire(e) {
    const H = this.scene.H;
    return e.seen >= FAIR.noFireAfterEnter && e.y > 4 && e.y < H * FAIR.noFireBelow && this.scene.bombClear <= 0;
  }

  aimAt(e, ox = 0, oy = 0) {
    const p = this.scene.player;
    return Math.atan2(p.y - (e.y + oy), p.x - (e.x + ox));
  }

  damage(e, amount, byBomb = false) {
    if (e.dead || e.hp <= 0 || e.ghost || e.invuln) return;
    // brief brighten, rate-limited so constant fire blinks instead of whiting the sprite out
    if (e.flashCool <= 0) {
      e.flash = 0.035;
      e.flashCool = 0.12;
    }
    if (e.armor > 0) {
      // ice shell first (a bomb shatters it outright), the rest goes through to the flame
      e.armor -= byBomb ? Infinity : amount;
      if (e.armor > 0) return;
      amount = byBomb ? amount : -e.armor;
      this.shatter(e);
    }
    e.hp -= amount;
    if (e.hp <= 0) this.destroy(e, byBomb);
  }

  /** The ice lantern's shell breaks: the bare flame flares up and fires faster. */
  shatter(e) {
    const s = this.scene;
    e.armor = 0;
    e.radius = 6;
    e.play('wisp');
    s.fx.shards(e.x, e.y, 12);
    s.sfx.explode('s');
    if (e.state === 'leave') {
      e.state = 'attack';
      e.shots = 0;
    }
    e.shots += 2;
    e.timer = Math.max(e.timer, 0.45);
  }

  damageAll(amount) {
    for (const e of this.pool.live) if (e.y > -e.radius && e.y < this.scene.H + e.radius) this.damage(e, amount, true);
  }

  destroy(e) {
    const s = this.scene;
    if (e.group?.kind === 'kuma' && e.role !== 'body') {
      this.kumaPartDown(e);
      return;
    }
    s.score.kill(e.def);
    if (e.type === 'decoy') {
      // a fake tanuki turns back into leaves
      s.fx.leaves(e.x, e.y, 16);
      s.sfx.explode('s');
      s.fx.text(e.x, e.y - 14, `${e.def.score * s.score.mult}`, 0.9, 0x9cf09a);
      this.remove(e);
      return;
    }
    if (e.flock && !e.flock.lost && ++e.flock.hit >= e.flock.n) {
      // the whole flock shot down: bonus
      const pts = 200 * e.flock.n * s.score.mult;
      s.score.add(pts);
      s.fx.text(e.x, e.y - 12, `STADO! +${pts}`, 1.5, 0xd8f0ff);
    }
    if (e.ground) {
      s.fx.explode(e.x, e.y, e.def.explosion, e.u);
      const wr = this.wrecks.spawn(e.wreck ?? this.skin.turret.wreck, e.x, e.y, { u: e.u });
      if (e.horiz) wr.setRotation(-e.dir * Math.PI / 2);
    } else s.fx.explode(e.x, e.y, e.def.explosion);
    if (e.type === 'carrier') s.spawnPickup(e.color, e.x, e.y, -40);
    if (e.type === 'heavy' || e.type === 'boss') {
      const { x, y } = e;
      for (let i = 0; i < 9; i++)
        s.time.delayedCall(i * 110, () => s.fx.explode(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 34, i % 3 ? 'm' : 's'));
      s.time.delayedCall(1000, () => {
        s.fx.explode(x, y, 'l');
        s.fx.flash(0.5, 0.4);
      });
      s.bullets.cancelAll(s.fx);
      s.fx.text(x, y - 24, `${e.def.score * s.score.mult}`, 1.6, 0xffe080);
      if (e.type === 'heavy') this.heavy = null;
    }
    this.remove(e);
    const g = this.bossGroup;
    if (e.type === 'boss' && g && !g.defeated && g.parts.every((p) => p.dead || p.hp <= 0)) {
      g.defeated = true;
      s.onBossDefeated();
    }
  }

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
    this.bossGroup = g;
    return g.parts[0];
  }

  /** HP shown in the top bar: the mid-stage heavy or the whole boss pair. */
  bossBar() {
    const g = this.bossGroup;
    if (g && !g.defeated && (g.kind === 'kuma' ? g.awake : g.parts.some((p) => !p.dead && p.y > 0))) {
      let hp = 0;
      let max = 0;
      for (const p of g.parts) {
        hp += p.dead ? 0 : Math.max(0, p.hp);
        max += p.maxHp;
      }
      return { hp, max };
    }
    const hv = this.heavy;
    return hv && hv.y > 0 ? { hp: hv.hp, max: hv.maxHp } : null;
  }

  updateBossGroup(dt) {
    const g = this.bossGroup;
    if (!g || g.defeated) return;
    if (g.kind === 'kuma') return this.updateKuma(g, dt);
    const alive = g.parts.filter((p) => !p.dead && p.hp > 0);
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
  }

  // ---------------------------------------------------------------- boss: the Snow Festival bear
  /**
   * Phase 1: an ice sculpture of a rearing bear rides in on its pedestal and wakes when the scroll stops.
   * Both paws and the ice heart are separate targets; the sculpture's body is solid ice. Breaking the
   * heart shatters the sculpture: phase 2 is the brown higuma that was inside.
   */
  spawnKuma(w, base) {
    const s = this.scene;
    const y = -36;
    const u = s.parallax.stripU(y);
    const g = { kind: 'kuma', state: 'dormant', t: 0, phase: 0, step: 0, timer: 1, parts: [], enraged: false, defeated: false };
    Object.assign(g, { awake: false, stage: 1, home: w.x, homeY: 76, restY: 0, roar: 0, body: null });
    const part = (frame, role, dx, dy, hp, radius, pts) => {
      const e = this.pool.spawn(frame, w.x + dx, y + dy, { ...base, role, dx, dy, u, hp, maxHp: hp, radius, pts, group: g, invuln: true, ground: true });
      e.setDepth(DEPTH.ground + (role === 'body' ? 0.3 : 0.35));
      g.parts.push(e);
      return e;
    };
    // parts before the body, so shots reach them first
    part('kuma_heart_0', 'heart', 0, 4, 300, 6, 6000).play('kuma_heart');
    part('kuma_paw', 'paw', -22, -13, 150, 7, 3000).setFlipX(true);
    part('kuma_paw', 'paw', 22, -13, 150, 7, 3000);
    g.body = part('kuma_ice', 'body', 0, 0, 700, 20, 0);
    g.body.pass = true; // shots go through the ice to reach the paws and the heart
    this.bossGroup = g;
    return g.body;
  }

  updateKuma(g, dt) {
    const s = this.scene;
    const alive = g.parts.filter((p) => !p.dead && p.hp > 0);
    const body = g.body;
    const place = (x, y) => {
      for (const p of alive) {
        p.x = x + p.dx;
        p.y = y + p.dy;
      }
    };
    if (g.state === 'dormant') {
      place(g.home, s.parallax.screenY(body.u));
      if (s.parallax.time >= s.parallax.maxTime - 1e-3) {
        g.state = 'wake';
        g.t = 0;
        g.restY = body.y;
        s.cameras.main.shake(1300, 0.005);
      }
      return;
    }
    g.t += dt;
    g.roar -= dt;
    if (g.stage === 2) body.setFrame(g.roar > 0 ? 'kuma_1' : 'kuma_0');
    if (g.state === 'wake') {
      // shakes off the snow, then rises from the pedestal into the air
      const k = Math.max(0, Math.min(1, (g.t - 1.3) / 1.2));
      place(g.home + (g.t < 1.3 ? Math.round(Math.random() * 2 - 1) : 0), g.restY + (g.homeY - g.restY) * k * k * (3 - 2 * k));
      if (Math.random() < dt * 14) s.fx.shards(body.x + (Math.random() - 0.5) * 50, body.y + (Math.random() - 0.5) * 44, 2, true);
      if (g.t >= 1.3 && body.ground)
        for (const p of alive) {
          p.ground = false;
          p.setDepth(DEPTH.air - (p.role === 'body' ? 0.2 : 0.1));
        }
      if (g.t >= 2.5) {
        g.state = 'fight';
        g.awake = true;
        g.t = 0;
        g.timer = 0.6;
        for (const p of alive) if (p.role !== 'body') p.invuln = false;
      }
      return;
    }
    if (g.state === 'break') {
      // the ice falls away and the real bear roars
      place(g.home + Math.round(Math.random() * 2 - 1), g.homeY);
      if (g.t >= 1.4) {
        g.state = 'fight';
        g.t = 0;
        g.timer = 0.5;
        body.invuln = false;
        body.pass = false;
      }
      return;
    }
    const sp = g.enraged ? 1.5 : 1;
    place(g.home + (g.stage === 1 ? 12 : 26) * Math.sin(g.t * 0.5 * sp), g.homeY + 4 * Math.sin(g.t * 0.9 * sp));
    if (g.stage === 2 && !g.enraged && body.hp < body.maxHp * 0.35) {
      g.enraged = true;
      g.timer = 0.5;
      g.roar = 1;
      s.hud.show('', 'NIEDŹWIEDŹ WPADA W SZAŁ!', 1.6, true);
    }
    g.timer -= dt * (g.enraged ? 1.4 : 1);
    if (g.timer > 0) return;
    if (g.stage === 1) this.kumaIce(g, alive);
    else this.kumaBear(g, body);
  }

  /** Phase 1: paw swipes, heart pulses, a frozen snowflake from the heart while the paws lob snowballs. */
  kumaIce(g, alive) {
    const b = this.scene.bullets;
    const pl = this.scene.player;
    const heart = alive.find((e) => e.role === 'heart');
    const paws = alive.filter((e) => e.role === 'paw');
    const can = (e) => e && this.canFire(e);
    const next = () => {
      g.phase++;
      g.step = 0;
      g.timer = 1;
    };
    switch (g.phase % 3) {
      case 0: {
        const paw = paws[g.step % Math.max(1, paws.length)];
        if (can(paw)) b.fan(paw.x, paw.y + 5, this.aimAt(paw, 0, 5), 7, 1.0, normal);
        else if (can(heart)) b.fan(heart.x, heart.y, this.aimAt(heart), 5, 0.7, normal);
        g.timer = 0.6;
        if (++g.step >= 6) next();
        break;
      }
      case 1:
        if (can(heart)) b.ring(heart.x, heart.y, 14, g.step * 0.22, slow, g.step % 2 === 1);
        g.timer = 0.85;
        if (++g.step >= 4) next();
        break;
      default:
        if (can(heart))
          for (let arm = 0; arm < 6; arm++)
            for (let k = 0; k < 3; k++)
              b.shot('eb_s', heart.x, heart.y, g.step * 0.5 + (arm / 6) * TAU, 34 + k * 22, 1.8, { frz: { at: 0.55, hold: 0.6, turn: 0.4, speed: slow } });
        for (const paw of paws) if (can(paw)) b.lob(paw.x, paw.y, Phaser.Math.Clamp(pl.x + (Math.random() - 0.5) * 40, 10, VIEW.width - 10), pl.y, 1.1);
        g.timer = 1.3;
        if (++g.step >= 3) next();
    }
  }

  /** Phase 2: roaring rings, alternating paw swipes, thrown salmon with icicles falling from above. */
  kumaBear(g, body) {
    const s = this.scene;
    const b = s.bullets;
    if (!this.canFire(body)) {
      g.timer = 0.2;
      return;
    }
    const next = () => {
      g.phase++;
      g.step = 0;
      g.timer = 0.9;
    };
    switch (g.phase % 3) {
      case 0:
        if (g.step === 0) {
          g.roar = 1.4;
          s.cameras.main.shake(500, 0.004);
        }
        b.ring(body.x, body.y + 14, g.enraged ? 22 : 18, g.step * 0.17, g.step % 2 ? normal : slow, g.step === 1);
        g.timer = 0.45;
        if (++g.step >= 3) next();
        break;
      case 1: {
        const side = g.step % 2 ? 1 : -1;
        b.fan(body.x + side * 24, body.y - 15, this.aimAt(body, side * 24, -15), g.enraged ? 13 : 11, 1.4, normal);
        g.timer = 0.5;
        if (++g.step >= 6) next();
        break;
      }
      default: {
        const a = this.aimAt(body, 0, 14);
        const n = g.enraged ? 5 : 3;
        for (let i = 0; i < n; i++) b.shot('salmon', body.x, body.y + 14, a + (i / (n - 1) - 0.5) * 0.7, 64, 2.2, { wig: 5, wf: 8, spin: true });
        for (let k = 0; k < 4; k++) b.shot('icicle', 12 + Math.random() * (VIEW.width - 24), 8, DOWN, 0, 1.8, { ay: 150, maxV: 150, safe: 0.7 });
        g.timer = 0.85;
        if (++g.step >= 4) next();
      }
    }
  }

  /** A paw or the heart of the sculpture breaks off. The heart takes the whole sculpture with it. */
  kumaPartDown(e) {
    const s = this.scene;
    const g = e.group;
    const pts = e.pts * s.score.mult;
    s.score.add(pts);
    s.fx.explode(e.x, e.y, 'm');
    s.fx.shards(e.x, e.y, 16);
    s.fx.text(e.x, e.y - 12, `${pts}`, 1.2, 0xffe080);
    this.remove(e);
    if (e.role !== 'heart') return;
    for (const p of g.parts)
      if (!p.dead && p.role === 'paw') {
        s.fx.explode(p.x, p.y, 's');
        s.fx.shards(p.x, p.y, 10);
        p.hp = 0;
        this.remove(p);
      }
    Object.assign(g, { stage: 2, state: 'break', t: 0, phase: 0, step: 0, roar: 1.6 });
    g.body.radius = 20;
    s.bullets.cancelAll(s.fx);
    s.fx.flash(0.7, 0.5);
    s.fx.shards(g.body.x, g.body.y, 40);
    s.cameras.main.shake(700, 0.006);
    s.hud.show('LÓD PĘKA!', 'TO PRAWDZIWY NIEDŹWIEDŹ!', 2.2);
  }


  remove(e) {
    if (e.head) this.heads.kill(e.head);
    if (e.decoys) this.dropDecoys(e);
    if (e.kind === 'yukionna') this.scene.parallax.windTarget = 0; // her blizzard dies down with her
    if (e === this.heavy) this.heavy = null;
    this.pool.kill(e);
  }

  update(dt) {
    const s = this.scene;
    const H = s.H;
    const b = s.bullets;
    this.updateBossGroup(dt);
    for (const e of this.pool.live) {
      if (e.dead) continue;
      e.age += dt;
      if (e.y > -e.radius) e.seen += dt;
      switch (e.type) {
        case 'popcorn':
          this.popcorn(e, dt);
          break;
        case 'shooter':
          this.shooter(e, dt, b);
          break;
        case 'diver':
          if (e.path === 'glide') this.glide(e, dt);
          else this.diver(e, dt);
          break;
        case 'carrier':
          this.carrier(e, dt);
          break;
        case 'heavy':
          if (e.kind === 'yukionna') this.yukiOnna(e, dt, b);
          else if (e.kind === 'tanuki') this.tanuki(e, dt, b);
          else this.heavyUpdate(e, dt, b);
          break;
        case 'turret':
          this.turret(e, dt, b);
          break;
        case 'plow':
          this.plow(e, dt, b);
          break;
        case 'decoy':
          this.decoy(e, dt, b);
          break;
      }
      if (e.dead) continue;
      e.flashCool -= dt;
      if (e.flash > 0) {
        e.flash -= dt;
        e.setTint(0x808080).setTintMode(Phaser.TintModes.ADD);
        e.head?.setTint(0x808080).setTintMode(Phaser.TintModes.ADD);
      } else if (e.type === 'boss' && e.group.enraged) {
        e.setTint(0xffa8a0).setTintMode(Phaser.TintModes.MULTIPLY);
      } else if (e.tintMode !== Phaser.TintModes.MULTIPLY) {
        e.clearTint();
        e.head?.clearTint();
      }
      const off = e.y > H + 40 || e.y < -70 || e.x < -50 || e.x > VIEW.width + 50;
      if (off && e.type !== 'boss' && (e.age > 2 || e.y > H)) {
        if (e.flock) e.flock.lost = true; // a bird got away: no flock bonus
        this.remove(e);
      }
    }
    this.pool.sweep();
    this.heads.sweep();
    for (const w of this.wrecks.live) {
      w.y = s.parallax.screenY(w.u);
      if (w.y > H + 20) this.wrecks.kill(w);
    }
    this.wrecks.sweep();
  }

  // ---------------------------------------------------------------- behaviours
  popcorn(e, dt) {
    switch (e.path) {
      case 'sine':
        e.y += 46 * dt;
        e.x = e.x0 + 26 * Math.sin(e.age * 2.4);
        break;
      case 'arc': {
        const th = DOWN - e.dir * Math.min(e.age * 0.85, 2.5);
        e.x += Math.cos(th) * 74 * dt;
        e.y += Math.sin(th) * 74 * dt;
        break;
      }
      case 'row':
        e.y += 50 * dt;
        break;
      default:
        e.y += 58 * dt;
    }
    if (e.age >= e.fireAt && this.canFire(e)) {
      e.fireAt = Infinity;
      this.scene.bullets.fire(e.x, e.y + 4, this.aimAt(e), slow);
    }
  }

  shooter(e, dt, b) {
    if (e.lantern && e.armor > 0) {
      // the ice cracks as it takes hits, the candle flickers inside
      const crack = e.armor > e.maxArmor * 0.6 ? 0 : e.armor > e.maxArmor * 0.25 ? 1 : 2;
      e.setFrame(`tourou_${crack}_${Math.floor(e.age * 7) % 2}`);
    }
    if (e.state === 'enter') {
      e.y += Math.max(8, (e.stopY - e.y) * 2.2) * dt;
      if (e.y >= e.stopY - 1) {
        e.state = 'attack';
        e.timer = 0.5;
        e.shots = 3;
      }
    } else if (e.state === 'attack') {
      e.x += Math.sin(e.age * 1.3) * 6 * dt;
      e.timer -= dt;
      if (e.timer <= 0) {
        if (this.canFire(e)) {
          if (e.pattern === 'fan') b.fan(e.x, e.y + 8, this.aimAt(e, 0, 8), 5, 0.9, slow);
          else b.fan(e.x, e.y + 8, this.aimAt(e, 0, 8), 3, 0.42, normal);
        }
        e.shots--;
        e.timer = e.lantern && e.armor <= 0 ? 0.55 : 1.1; // a bare flame fires twice as fast
        if (e.shots <= 0) {
          e.state = 'leave';
          e.timer = 0.5;
          e.vy = 0;
        }
      }
    } else {
      e.timer -= dt;
      if (e.timer <= 0) {
        e.vy -= 110 * dt;
        e.y += e.vy * dt;
        e.x += e.dir * -26 * dt;
      }
    }
  }

  diver(e, dt) {
    if (e.state === 'enter') {
      e.y += Math.max(10, (e.stopY - e.y) * 3) * dt;
      if (e.age > 0.75) {
        e.state = 'aim';
        e.timer = 0.35;
      }
    } else if (e.state === 'aim') {
      e.timer -= dt;
      e.flash = Math.floor(e.timer * 20) % 2 ? 0.02 : 0;
      if (e.timer <= 0) {
        e.state = 'dive';
        e.ang = this.aimAt(e);
        // never dive upwards
        if (Math.sin(e.ang) < 0.35) e.ang = e.ang < -DOWN || e.ang > DOWN ? Math.PI - 0.36 : 0.36;
        e.v = 70;
      }
    } else {
      e.v = Math.min(240, e.v + 280 * dt);
      e.x += Math.cos(e.ang) * e.v * dt;
      e.y += Math.sin(e.ang) * e.v * dt;
    }
  }

  /**
   * Flying squirrel: hops in from the trees at a screen edge, blinks, then glides across in a swoop
   * that dips towards the player's height (never into the bottom quarter), and does it once more.
   */
  glide(e, dt) {
    const W = VIEW.width;
    const s = this.scene;
    if (e.state === 'enter') {
      const edge = e.dir > 0 ? 8 : W - 8;
      e.x += (edge - e.x) * Math.min(1, dt * 8);
      e.setFlipX(e.dir < 0);
      e.timer -= dt;
      if (e.timer <= 0) {
        e.state = 'cling';
        e.timer = 0.45;
      }
    } else if (e.state === 'cling') {
      e.timer -= dt;
      e.flash = Math.floor(e.timer * 20) % 2 ? 0.02 : 0;
      if (e.timer <= 0) {
        e.state = 'leap';
        e.k = 0;
        e.xs = e.x;
        e.ys = e.y;
        e.yt = Phaser.Math.Clamp(s.player.y, e.ys + 30, s.H * 0.72);
        e.play('momonga');
      }
    } else if (e.state === 'leap') {
      e.k += dt / 1.7;
      const k = Math.min(1, e.k);
      const xe = e.dir > 0 ? W - 8 : 8;
      e.x = e.xs + (xe - e.xs) * k;
      e.y = e.ys + (e.yt - e.ys) * Math.sin(Math.PI * k) + 16 * k;
      if (k >= 1) {
        e.leaps++;
        e.dir = -e.dir;
        if (e.leaps >= 2) {
          e.state = 'leave';
          e.vy = 30;
        } else {
          e.state = 'cling';
          e.timer = 0.5;
          e.anims.stop();
          e.setFrame('momonga_2').setFlipX(e.dir < 0);
        }
      }
    } else {
      // last glide: off the far side and down
      e.x += -e.dir * 90 * dt;
      e.y += e.vy * dt;
    }
  }

  carrier(e, dt) {
    if (e.state === 'enter') {
      if (e.path === 'zigzag') {
        e.y += 34 * dt;
        e.x += e.zig * 42 * dt;
        if (e.age % 0.9 < dt || e.x < 14 || e.x > VIEW.width - 14) {
          e.zig = e.x < 14 ? 1 : e.x > VIEW.width - 14 ? -1 : -e.zig;
        }
      } else e.y += 30 * dt;
      if (e.age > 4.6) {
        e.state = 'flee';
        e.vy = -10;
      }
    } else {
      e.vy -= 160 * dt;
      e.y += e.vy * dt;
    }
  }

  turret(e, dt, b) {
    const s = this.scene;
    e.y = s.parallax.screenY(e.u);
    const p = s.player;
    const ang = Math.atan2(p.y - e.y, p.x - e.x);
    // head frame i points along (-sin, cos) of i * 22.5deg
    const th = Math.atan2(-(p.x - e.x), p.y - e.y);
    const i = ((Math.round(th / (TAU / 16)) % 16) + 16) % 16;
    e.head.setFrame(`${this.skin.turret.head}${i}`).setPosition(e.x, e.y - 1);
    if (this.canFire(e)) {
      e.timer -= dt;
      if (e.timer <= 0) {
        e.timer = e.pattern === 'lob' ? 2.5 : 2.2;
        const mx = e.x + Math.cos(ang) * 6;
        const my = e.y + Math.sin(ang) * 6;
        if (e.pattern === 'lob') b.lob(e.x, e.y - 3, p.x, p.y); // snowman: a snowball where you are now
        else if (e.pattern === 'ring') {
          e.shots++;
          b.ring(mx, my, 10, e.shots * 0.31, slow);
        } else b.fan(mx, my, ang, 5, 0.84, slow);
      }
    }
  }

  /**
   * Rotary snowplough: drives along its street (down an avenue faster than the scroll, or across)
   * and sweeps its chute back and forth, throwing a stream of snow pellets. The chute shows the aim.
   */
  plow(e, dt, b) {
    const s = this.scene;
    if (e.horiz) e.x += e.dir * 22 * dt;
    else e.u -= 16 * dt;
    e.y = s.parallax.screenY(e.u);
    const ang = DOWN + Math.sin(e.age * 1.3) * 1.0;
    const th = Math.atan2(-Math.cos(ang), Math.sin(ang));
    const i = ((Math.round(th / (TAU / 16)) % 16) + 16) % 16;
    const hx = e.horiz ? e.x + e.dir * 5 : e.x;
    const hy = e.horiz ? e.y : e.y + 4;
    e.head.setFrame(`${this.skin.plow.chute}${i}`).setPosition(hx, hy);
    if (!this.canFire(e)) return;
    if (e.spray > 0) {
      e.spray -= dt;
      e.cool -= dt;
      if (e.cool <= 0) {
        e.cool = 0.11;
        b.fire(hx + Math.cos(ang) * 4, hy + Math.sin(ang) * 4, ang, slow);
      }
    } else if ((e.timer -= dt) <= 0) {
      e.spray = 1.6;
      e.timer = 1.4;
    }
  }

  /**
   * Yuki-onna: appears in the blizzard, fades out and back in somewhere else between attacks
   * (shots pass through her while she is mist). Freezing snowflakes, wind-blown fans, falling icicles.
   */
  yukiOnna(e, dt, b) {
    const s = this.scene;
    if (e.state === 'enter') {
      e.y += Math.max(6, (70 - e.y) * 0.8) * dt;
      if (e.y >= 69) Object.assign(e, { state: 'fight', fight: 0, timer: 0.8, patternIndex: 0, step: 0, homeX: e.x, blink: null });
      return;
    }
    if (e.state === 'leave') {
      e.setAlpha(Math.max(0, e.alpha - dt * 0.8));
      e.ghost = e.alpha < 0.5;
      s.parallax.windTarget = 0;
      if (e.alpha <= 0) this.remove(e);
      return;
    }
    e.fight += dt;
    if (e.fight > 34) {
      e.state = 'leave';
      return;
    }
    if (e.blink) {
      const k = (e.blink.t += dt);
      if (k < 0.35) e.setAlpha(1 - k / 0.35);
      else if (k < 0.7) {
        e.x = e.homeX = e.blink.x;
        e.y = e.blink.y;
        e.setAlpha((k - 0.35) / 0.35);
      } else {
        e.setAlpha(1);
        e.blink = null;
      }
      e.ghost = !!e.blink && e.alpha < 0.6;
      return;
    }
    e.x = e.homeX + 6 * Math.sin(e.fight * 1.1);
    e.timer -= dt;
    if (e.timer > 0 || !this.canFire(e)) return;
    const next = (n) => {
      if (++e.step < n) return;
      e.patternIndex++;
      e.step = 0;
      e.timer = 1.1;
      s.parallax.windTarget = 0;
      e.blink = { t: 0, x: 40 + Math.random() * 100, y: 58 + Math.random() * 30 };
    };
    switch (e.patternIndex % 3) {
      case 0: {
        // six arms of bullets stop into a snowflake, hang, then drift on with a twist
        const rot = e.step * 0.3 + Math.random() * 0.3;
        for (let arm = 0; arm < 6; arm++)
          for (let k = 0; k < 4; k++)
            b.shot('eb_s', e.x, e.y + 6, rot + (arm / 6) * TAU, 40 + k * 22, 1.8, { frz: { at: 0.55, hold: 0.7, turn: e.step % 2 ? -0.45 : 0.45, speed: slow } });
        e.timer = 1.6;
        next(3);
        break;
      }
      case 1: {
        // blizzard: aimed bursts blown sideways by the wind (the snow shows which way it blows)
        const wind = Math.floor(e.step / 6) % 2 ? 36 : -36;
        s.parallax.windTarget = wind * 1.4;
        const a = this.aimAt(e, 0, 8);
        for (const d of [-0.25, 0, 0.25]) b.shot('eb_s', e.x, e.y + 8, a + d - wind * 0.006, normal, 1.8, { ax: wind, maxV: 95 });
        e.timer = 0.24;
        next(12);
        break;
      }
      default:
        // icicles appear along the top, blink, then fall
        for (let k = 0; k < 5; k++) b.shot('icicle', 10 + ((k + Math.random() * 0.8) / 5) * (VIEW.width - 20), 8, DOWN, 0, 1.8, { ay: 150, maxV: 150, safe: 0.7 });
        b.ring(e.x, e.y + 4, 10, e.step * 0.3, slow);
        e.timer = 0.8;
        next(4);
    }
  }

  /**
   * Tanuki (Shigaraki figurine): waddles about, drums its belly (a ring of bullets on every "pon"),
   * lobs sake flasks at the player, and shapeshifts — a leaf on its hat, a puff of leaves, and two
   * copies that keep the leaf on. The real one has no leaf. Copies burst into leaves at one hit.
   */
  tanuki(e, dt, b) {
    const s = this.scene;
    if (e.state === 'enter') {
      e.y += Math.max(6, (72 - e.y) * 0.8) * dt;
      if (e.y >= 71) Object.assign(e, { state: 'fight', fight: 0, timer: 0.8, patternIndex: 0, step: 0, tx: null, decoys: [] });
      return;
    }
    if (e.state === 'leave') {
      e.vy = (e.vy ?? 0) - 40 * dt;
      e.y += e.vy * dt;
      return;
    }
    e.fight += dt;
    if (e.fight > 34) {
      this.dropDecoys(e);
      e.play('tanuki');
      e.state = 'leave';
      return;
    }
    // waddle; while shapeshifted, walk to its place in the line-up instead
    const goal = e.tx ?? 90 + 30 * Math.sin(e.fight * 0.6);
    e.x += (goal - e.x) * Math.min(1, dt * (e.tx === null ? 2 : 4));
    e.timer -= dt;
    if (e.timer > 0 || !this.canFire(e)) return;
    switch (e.patternIndex % 3) {
      case 0:
        // hara-tsuzumi: paws up, paws down on the belly — pon, poko
        e.anims.stop();
        e.setFrame(e.step % 2 ? 'tanuki_drum_1' : 'tanuki_drum_0');
        if (e.step % 2) {
          const pon = e.step % 4 === 1;
          b.ring(e.x, e.y + 8, pon ? 14 : 10, e.step * 0.21, pon ? slow : normal, !pon);
          s.fx.text(e.x + (pon ? -14 : 14), e.y + 4, pon ? 'PON' : 'POKO', 0.5, 0xffe0b0);
        }
        e.timer = 0.24;
        if (++e.step >= 16) {
          e.play('tanuki');
          this.nextPattern(e);
        }
        break;
      case 1: {
        // sake flasks thrown where the player is (and to both sides), plus a small aimed fan
        const pl = s.player;
        for (const dx of e.step % 2 ? [-36, 36] : [0]) b.lob(e.x + (dx > 0 ? 18 : -20), e.y + 12, Phaser.Math.Clamp(pl.x + dx, 10, VIEW.width - 10), pl.y, 1.2, 'tokkuri');
        b.fan(e.x, e.y + 12, this.aimAt(e, 0, 12), 3, 0.5, slow);
        e.timer = 0.95;
        if (++e.step >= 5) this.nextPattern(e);
        break;
      }
      default:
        this.tanukiTrick(e, b);
    }
  }

  tanukiTrick(e, b) {
    const s = this.scene;
    const lineup = () => {
      const slots = Phaser.Utils.Array.Shuffle([40, 90, 140]);
      e.tx = slots[0];
      e.decoys.forEach((d, i) => (d.tx = slots[i + 1]));
    };
    if (e.step === 0) {
      // the tell: a leaf on its hat
      e.play('tanuki_leaf');
      e.timer = 0.9;
    } else if (e.step === 1) {
      s.fx.leaves(e.x, e.y, 24);
      s.fx.flash(0.25, 0.25);
      s.sfx.explode('s');
      e.play('tanuki');
      for (let i = 0; i < 2; i++) {
        const d = this.pool.spawn('tanuki_leaf_0', e.x, e.y, {
          type: 'decoy', def: DECOY, hp: 1, maxHp: 1, radius: DECOY.radius, age: 0, seen: 1, state: 'fight', timer: 1.1 + i * 0.5, flash: 0, flashCool: 0,
          ground: false, head: null, armor: 0, maxArmor: 0, lantern: false, flock: null, ghost: false, invuln: false, pass: false,
          group: null, role: null, wreck: null, kind: null, song: null, decoys: null, master: e, tx: e.x,
        });
        d.play('tanuki_leaf').setDepth(DEPTH.air - 0.1);
        e.decoys.push(d);
      }
      lineup();
      e.timer = 0.9;
    } else if (e.step < 9) {
      // shuffle once halfway, like the cup game; the real one fires a fan meanwhile
      e.decoys = e.decoys.filter((d) => !d.dead);
      if (e.step === 5) lineup();
      b.fan(e.x, e.y + 12, this.aimAt(e, 0, 12), 5, 0.8, slow);
      e.timer = 1.0;
    } else {
      this.dropDecoys(e);
      e.tx = null;
      this.nextPattern(e);
      return;
    }
    e.step++;
  }

  decoy(e, dt, b) {
    const m = e.master;
    e.x += (e.tx - e.x) * Math.min(1, dt * 4);
    e.y = m.y;
    if ((e.timer -= dt) <= 0) {
      e.timer = 1.4;
      if (this.canFire(e)) b.fire(e.x, e.y + 12, this.aimAt(e, 0, 12), slow);
    }
  }

  /** The copies turn back into leaves (trick over, or the tanuki is gone). */
  dropDecoys(e) {
    for (const d of e.decoys ?? []) {
      if (d.dead) continue;
      this.scene.fx.leaves(d.x, d.y, 10);
      this.pool.kill(d);
    }
    e.decoys = [];
  }

  heavyUpdate(e, dt, b) {
    if (e.state === 'enter') {
      e.y += Math.max(6, (72 - e.y) * 0.8) * dt;
      if (e.y >= 71) {
        e.state = 'fight';
        e.fight = 0;
        e.timer = 0.6;
        e.patternIndex = 0;
        e.step = 0;
      }
      return;
    }
    if (e.state === 'leave') {
      e.vy = (e.vy ?? 0) - 40 * dt;
      e.y += e.vy * dt;
      return;
    }
    e.fight += dt;
    e.x = 90 + 38 * Math.sin(e.fight * 0.45);
    if (e.fight > 34) {
      e.state = 'leave';
      return;
    }
    e.timer -= dt;
    if (e.timer > 0 || !this.canFire(e)) return;
    const p = e.patternIndex % 3;
    if (p === 0) {
      // three slow rings, each rotated
      b.ring(e.x, e.y + 4, 16, e.step * 0.2, slow, e.step % 2 === 0);
      e.timer = 0.7;
      if (++e.step >= 3) this.nextPattern(e);
    } else if (p === 1) {
      // aimed fans from both cannons
      b.fan(e.x - 5, e.y + 16, this.aimAt(e, -5, 16), 5, 0.6, normal);
      b.fan(e.x + 5, e.y + 16, this.aimAt(e, 5, 16), 3, 0.3, fast);
      e.timer = 0.45;
      if (++e.step >= 4) this.nextPattern(e);
    } else {
      // two-armed spiral
      const a = e.step * 0.38;
      b.fire(e.x, e.y + 4, a, slow, true);
      b.fire(e.x, e.y + 4, a + Math.PI, slow, true);
      e.timer = 0.11;
      if (++e.step >= 22) this.nextPattern(e);
    }
  }

  nextPattern(e) {
    e.patternIndex++;
    e.step = 0;
    e.timer = 1.0;
  }
}
