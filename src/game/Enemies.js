import Phaser from 'phaser';
import { BEANS, DEPTH, ENEMIES, FAIR, PLAYER, VIEW } from '../config.js';
import { Pool } from './Pool.js';
import { SKINS } from './skins.js';

const { slow, normal, fast } = FAIR.bulletSpeed;
const DOWN = Math.PI / 2;
const TAU = Math.PI * 2;
// the tanuki's shapeshifted copies: one hit and they turn back into leaves
const DECOY = { hp: 1, weight: 0, score: 300, radius: 13, explosion: 's' };
// the two halves of a burst volcanic bomb
const FRAG = { hp: 1, weight: 0, score: 50, radius: 3, explosion: 's' };
// the bunraku puppet's three black-clad puppeteers
const KUROKO = { hp: 140, weight: 0, score: 2000, radius: 7, explosion: 'm' };
// a little oni hatched from a hot-spring egg
const IMP = { hp: 4, weight: 1, score: 200, radius: 5, explosion: 's' };
// a wooden masu of Setsubun beans flying across the oni fight
const MASU = { hp: 5, weight: 0, score: 300, radius: 7, explosion: 's' };
// per-skin extras, listed so a pooled sprite never keeps a previous enemy's state
const EXTRAS = {
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
  split: false, // volcanic bomb: bursts into two fragments
  sniper: false, // matchlock: aims a line, then one fast shot
  lidded: false, // vinegar jar: armoured while the lid is on
  melt: 0, // shirokuma: seconds until it melts away with its pickup
  duo: null, // Osaka manzai pair
  rage: false, // its partner fell: furious
  segs: null, // tentacle segments (extra hit circles)
  kuroko: null, // the puppet's puppeteers
  master: null,
  hatch: 0, // hot-spring egg: seconds on screen before it hatches
  hatched: false,
  bounce: false, // Kamado pot: its shots ricochet off the walls
  thief: false, // macaque: grabs power instead of ramming
  loot: null, // what the macaque is running away with: 'power' | 'bomb'
  harmless: false, // no contact damage (bean boxes)
  oni: false, // only Setsubun beans really hurt it
};

// Six archetypes shared by every city (each stage picks a skin), plus stage bosses.
export class Enemies {
  constructor(scene, skin = 'kyoto') {
    this.scene = scene;
    this.skin = SKINS[skin] ?? SKINS.kyoto;
    this.pool = new Pool(scene, DEPTH.air);
    this.heads = new Pool(scene, DEPTH.ground + 0.2);
    this.wrecks = new Pool(scene, DEPTH.ground);
    this.segPool = new Pool(scene, DEPTH.air - 0.12); // the octopus's tentacle segments
    this.heavy = null;
    this.bossGroup = null;
    // telegraph lines (matchlock aim, Raijū's charge), redrawn every frame
    this.tele = scene.add.graphics().setDepth(DEPTH.airFx);
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
      ...EXTRAS,
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
        e.split = !!look.split;
        e.hatch = look.hatch ?? 0;
        if (e.hatch) e.fireAt = Infinity; // eggs never shoot; what hatches does
        e.tossV = (w.x < VIEW.width / 2 ? 1 : -1) * (26 + Math.random() * 18);
        break;
      case 'shooter':
        e = this.pool.spawn(look.frame, w.x, -12, base);
        if (look.armor) {
          // ice lantern: the shell soaks up damage first, the flame inside is weak
          e.lantern = true;
          e.armor = e.maxArmor = look.armor;
          e.hp = e.maxHp = look.hp;
        } else e.play(look.anim);
        e.sniper = !!look.sniper;
        e.bounce = !!look.bounce;
        e.aimT = 0;
        e.stopY = w.y ?? 50 + Math.random() * 24;
        break;
      case 'diver':
        if ((w.path ?? look.path) === 'submerge') {
          // kappa: only ripples on the surface (shots pass), then it surfaces and leaps
          e = this.pool.spawn('ripple_0', w.x, w.y ?? 120, { ...base, path: 'submerge', ghost: true, state: 'lurk', timer: 1.4 });
          e.play('ripple');
          e.look = look;
          break;
        }
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
        e.thief = !!look.thief;
        break;
      case 'carrier':
        e = this.pool.spawn(look.frame.replace('{c}', w.color ?? 'red'), w.x, -10, { ...base, color: w.color ?? 'red', path: w.path ?? (look.melt ? 'drift' : 'zigzag'), melt: look.melt ?? 0 });
        if (look.anim) e.play(look.anim.replace('{c}', e.color));
        e.zig = Math.random() < 0.5 ? -1 : 1;
        break;
      case 'heavy':
        e = this.pool.spawn(look.frame, w.x, -30, { ...base, kind: look.kind ?? null, song: w.music ?? null });
        if (look.anim) e.play(look.anim);
        this.heavy = e;
        e.patternIndex = 0;
        if (look.kind === 'bunraku') this.spawnKuroko(e, base);
        if (look.kind === 'wani') Object.assign(e, { y: -40, radius: 11, segs: [{ x: 0, y: 0, r: 9 }, { x: 0, y: 0, r: 8 }] });
        break;
      case 'turret': {
        // spawns just above the screen and stays glued to the mid layer
        e = this.pool.spawn(look.base, w.x, -10, base);
        e.u = s.parallax.stripU(-10);
        e.timer = 0.9;
        e.head = this.heads.spawn(`${look.head}0`, w.x, -10);
        if (look.lid) Object.assign(e, { lidded: true, invuln: true, lid: 'shut', timer: 1 + Math.random() * 0.8 });
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
      case 'geyser':
        // a hot-spring vent on the mid layer (the background draws the hole); only seen while it boils
        e = this.pool.spawn(w.kind === 'mud' ? look.mud : look.frame, w.x, -10, { ...base, ghost: true, mud: w.kind === 'mud', every: w.every ?? 3, timer: w.delay ?? 1, erupt: 0, showT: 0 });
        e.u = s.parallax.stripU(-10);
        e.setAlpha(0);
        break;
      case 'steam':
        // a cloud of hot-spring steam drifting down the screen: hides what is under it, heats the guns
        e = this.pool.spawn(look.frame, w.x, -24, { ...base, ghost: true });
        e.setScale(1.3).setAlpha(0.72);
        break;
      case 'boss':
        if (w.boss === 'oni') return this.spawnOni(w, base);
        if (w.boss === 'volcano') return this.spawnVolcano(w, base);
        if (w.boss === 'tako') return this.spawnTako(w, base);
        return w.boss === 'kuma' ? this.spawnKuma(w, base) : this.spawnBoss(w, base);
      default:
        return;
    }
    e.setDepth(e.ground ? DEPTH.ground : DEPTH.air + (w.type === 'heavy' ? -0.1 : 0));
    if (w.type === 'steam') e.setDepth(DEPTH.player - 0.2); // over enemies and shots, under the ship and bullets
    if (this.skin.duos && w.duo) {
      e.duo = w.duo;
      w.duo.members.push(e);
    }
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

  damage(e, amount, byBomb = false, bean = false) {
    // a bomb blows the lid off a vinegar jar; otherwise invulnerable things shrug it off
    if (e.dead || e.hp <= 0 || e.ghost || (e.invuln && !(byBomb && e.lidded))) return;
    if (e.oni && !bean) {
      // the oni's hide: normal shots barely chip it (no flash), a bomb does half
      e.hp -= amount * (byBomb ? 0.5 : BEANS.armor);
      if (e.hp <= 0) this.destroy(e, byBomb);
      return;
    }
    if (e.oni) this.oniHurt(e);
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

  destroy(e, byBomb = false) {
    const s = this.scene;
    if (e.group?.kind === 'kuma' && e.role !== 'body') {
      this.kumaPartDown(e);
      return;
    }
    if (e.group?.kind === 'volcano' && e.role === 'vent') {
      this.ventDown(e);
      return;
    }
    if (e.group?.kind === 'tako' && e.role === 'tentacle') {
      this.tentacleDown(e);
      return;
    }
    if (e.duo) this.duoDown(e);
    if (e.loot) this.returnLoot(e);
    if (e.split && !byBomb) {
      // a volcanic bomb bursts into two smaller halves flying apart
      for (const side of [-1, 1]) {
        const f = this.pool.spawn('kazan_s_0', e.x, e.y, { ...EXTRAS, type: 'frag', def: FRAG, hp: 1, maxHp: 1, radius: FRAG.radius, age: 0, seen: 1, state: 'fly', flash: 0, flashCool: 0, ground: false, head: null, vx: side * (40 + Math.random() * 20), vy: -30 });
        f.play('kazan_s');
      }
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
    if (e.type === 'masu') s.spawnPickup('mame', e.x, e.y, -40);
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
    if (e.type === 'boss' && g && !g.defeated && g.parts.every((p) => p.dead || p.hp <= 0 || p.group !== g)) {
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
    g.maxTotal = g.parts.reduce((sum, p) => sum + p.maxHp, 0);
    this.bossGroup = g;
    return g.parts[0];
  }

  /** HP shown in the top bar: the mid-stage heavy or the whole boss pair. */
  bossBar() {
    const g = this.bossGroup;
    if (g && !g.defeated && (g.kind === 'kuma' || g.kind === 'volcano' || g.kind === 'tako' || g.kind === 'oni' ? g.awake : g.parts.some((p) => !p.dead && p.group === g && p.y > 0))) {
      // parts are pooled sprites: once dead they may come back as other enemies, so check the group
      let hp = 0;
      for (const p of g.parts) if (!p.dead && p.group === g) hp += Math.max(0, p.hp);
      return { hp, max: g.maxTotal };
    }
    const hv = this.heavy;
    return hv && hv.y > 0 ? { hp: hv.hp, max: hv.maxHp } : null;
  }

  updateBossGroup(dt) {
    const g = this.bossGroup;
    if (!g || g.defeated) return;
    if (g.kind === 'kuma') return this.updateKuma(g, dt);
    if (g.kind === 'volcano') return this.updateVolcano(g, dt);
    if (g.kind === 'tako') return this.updateTako(g, dt);
    if (g.kind === 'oni') return this.updateOni(g, dt);
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
    g.maxTotal = g.parts.reduce((sum, p) => sum + p.maxHp, 0);
    this.bossGroup = g;
    return g.body;
  }

  updateKuma(g, dt) {
    const s = this.scene;
    const alive = g.parts.filter((p) => !p.dead && p.group === g && p.hp > 0);
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
      if (!p.dead && p.group === g && p.role === 'paw') {
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
    if (e.kuroko) for (const k of e.kuroko) if (!k.dead && k.master === e) this.pool.kill(k);
    if (e.decoys) this.dropDecoys(e);
    if (e.kind === 'yukionna') this.scene.parallax.windTarget = 0; // her blizzard dies down with her
    if (e === this.heavy) this.heavy = null;
    if (e.oni) e.setCrop(); // pooled: the next enemy must not come out cropped
    this.pool.kill(e);
  }

  /** Beppu: is (x, y) inside a steam cloud? */
  steamAt(x, y) {
    for (const e of this.pool.live) if (e.type === 'steam' && !e.dead && ((x - e.x) / 26) ** 2 + ((y - e.y) / 17) ** 2 < 1) return true;
    return false;
  }

  update(dt) {
    const s = this.scene;
    const H = s.H;
    const b = s.bullets;
    this.tele.clear();
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
          else if (e.path === 'submerge') this.kappa(e, dt);
          else this.diver(e, dt);
          break;
        case 'carrier':
          this.carrier(e, dt);
          break;
        case 'heavy':
          if (e.kind === 'yukionna') this.yukiOnna(e, dt, b);
          else if (e.kind === 'tanuki') this.tanuki(e, dt, b);
          else if (e.kind === 'raiju') this.raiju(e, dt, b);
          else if (e.kind === 'bunraku') this.bunraku(e, dt, b);
          else if (e.kind === 'wani') this.wani(e, dt, b);
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
        case 'frag':
          e.vy += 70 * dt;
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          break;
        case 'geyser':
          this.geyser(e, dt, b);
          break;
        case 'steam':
          e.y += 22 * dt;
          e.x += Math.sin(e.age * 0.7 + e.x0) * 7 * dt;
          e.setFrame(Math.floor(e.age * 1.2) % 2 ? 'steam_1' : 'steam_0');
          break;
        case 'masu':
          e.x += e.dir * 40 * dt;
          e.y = e.y0 + Math.sin(e.age * 3) * 6;
          e.setRotation(Math.sin(e.age * 5) * 0.2);
          break;
      }
      if (e.dead) continue;
      e.flashCool -= dt;
      if (e.flash > 0) {
        e.flash -= dt;
        e.setTint(0x808080).setTintMode(Phaser.TintModes.ADD);
        e.head?.setTint(0x808080).setTintMode(Phaser.TintModes.ADD);
        if (e.segs) for (const sg of e.segs) sg.setTint?.(0x808080).setTintMode(Phaser.TintModes.ADD);
      } else if ((e.type === 'boss' && e.group.enraged) || e.rage) {
        e.setTint(0xffa8a0).setTintMode(Phaser.TintModes.MULTIPLY);
        if (e.segs) for (const sg of e.segs) sg.setTint?.(0xffa8a0).setTintMode(Phaser.TintModes.MULTIPLY);
      } else if (e.tintMode !== Phaser.TintModes.MULTIPLY) {
        e.clearTint();
        e.head?.clearTint();
        if (e.segs) for (const sg of e.segs) sg.clearTint?.();
      }
      const off = e.y > H + 40 || e.y < -70 || e.x < -50 || e.x > VIEW.width + 50;
      if (off && e.type !== 'boss' && (e.age > 2 || e.y > H)) {
        if (e.flock) e.flock.lost = true; // a bird got away: no flock bonus
        if (e.loot) s.fx.text(Phaser.Math.Clamp(e.x, 40, VIEW.width - 40), 40, 'UKRADZIONE!', 1.4, 0xff8a6a);
        this.remove(e);
      }
    }
    this.pool.sweep();
    this.heads.sweep();
    this.segPool.sweep();
    if (this.skin.duos) this.drawDuos();
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
      case 'toss':
        // flung by the volcano: drifting sideways, falling faster and faster
        e.x += e.tossV * dt;
        e.y += (30 + e.age * 28) * dt;
        break;
      case 'imp':
        // hatched: edges towards the player while dropping
        e.y += 36 * dt;
        e.x += Phaser.Math.Clamp(this.scene.player.x - e.x, -28 * dt, 28 * dt);
        break;
      default:
        e.y += 58 * dt;
    }
    if (e.hatch && !e.hatched) {
      // a boiled egg: wobbles harder and harder, cracks, and a little oni pops out
      const k = e.seen / e.hatch;
      e.setRotation(Math.sin(e.age * (8 + k * 16)) * 0.3 * k);
      if (k > 0.75) e.setFrame('tamago_1');
      if (k >= 1) this.hatchEgg(e);
    }
    if (e.age >= e.fireAt && this.canFire(e)) {
      e.fireAt = e.hatched ? e.age + 1.8 : Infinity;
      this.scene.bullets.fire(e.x, e.y + 4, this.aimAt(e), slow);
    }
  }

  hatchEgg(e) {
    Object.assign(e, { hatched: true, def: IMP, hp: IMP.hp, maxHp: IMP.hp, radius: IMP.radius, path: 'imp', fireAt: e.age + 0.45 });
    e.setRotation(0).play('imp');
    this.scene.fx.shards(e.x, e.y, 6, true);
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
      if (e.sniper) return this.snipe(e, dt, b);
      e.timer -= dt;
      if (e.timer <= 0) {
        if (this.canFire(e) && e.bounce) {
          // the Kamado pot boils over: a wide spray that ricochets off the screen edges
          const n = e.pattern === 'fan' ? 5 : 3;
          const arc = e.pattern === 'fan' ? 1.7 : 1.2;
          const a = this.aimAt(e, 0, 8);
          for (let i = 0; i < n; i++) b.shot('eb_s', e.x, e.y + 8, a + (i / (n - 1) - 0.5) * arc, normal * 0.9, 1.8, { bounce: 1 });
        } else if (this.canFire(e)) {
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
        if (this.skin.diver.spin) e.setRotation(e.ang - DOWN);
      }
    } else if (e.loot) {
      // off up and away with the loot, zigzagging
      e.vy = Math.max(-150, e.vy - 220 * dt);
      e.y += e.vy * dt;
      e.x = Phaser.Math.Clamp(e.x + Math.sin(e.age * 8) * 70 * dt, 8, VIEW.width - 8);
      e.head?.setPosition(e.x, e.y + 8);
    } else {
      if (e.thief) {
        // the macaque keeps its eyes on the player and swerves after them, but runs slower
        const p = this.scene.player;
        if (p.alive && e.y < p.y - 8) e.ang += Phaser.Math.Clamp(Phaser.Math.Angle.Wrap(this.aimAt(e) - e.ang), -1.8 * dt, 1.8 * dt);
        e.v = Math.min(150, e.v + 200 * dt);
        e.setFlipX(Math.cos(e.ang) < 0);
      } else e.v = Math.min(240, e.v + 280 * dt);
      e.x += Math.cos(e.ang) * e.v * dt;
      e.y += Math.sin(e.ang) * e.v * dt;
    }
  }

  /** A macaque got its paws on the player's power (or bomb): it runs off with it; shoot it to get it back. */
  thieve(e, loot) {
    const s = this.scene;
    Object.assign(e, { loot, state: 'flee', vy: 30 });
    e.head = this.heads.spawn(loot === 'bomb' ? 'icon_bomb' : `wpn_${s.player.weapon}`, e.x, e.y + 8);
    e.head.setDepth(DEPTH.air + 0.05);
    s.fx.text(e.x, e.y - 12, loot === 'bomb' ? 'KRADZIEŻ BOMBY!' : 'KRADZIEŻ MOCY!', 1.2, 0xff8a6a);
    s.sfx.explode('s');
  }

  returnLoot(e) {
    const s = this.scene;
    const p = s.player;
    if (e.loot === 'bomb') p.bombs = 1;
    else p.level = Math.min(PLAYER.maxPower, p.level + 1);
    s.fx.text(e.x, e.y - 12, e.loot === 'bomb' ? 'BOMBA ODZYSKANA' : 'MOC ODZYSKANA', 1.2, 0x9cf09a);
    e.loot = null;
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
    if (e.melt) {
      // shirokuma: drifts down melting in the heat; shoot it before it is gone, pickup and all
      e.y += 20 * dt;
      e.x = e.x0 + 10 * Math.sin(e.age * 1.4);
      const k = e.age / e.melt;
      e.setFrame(`shirokuma_${e.color}_${k < 0.45 ? 0 : k < 0.8 ? 1 : 2}`);
      e.setAlpha(k > 0.82 && Math.floor(e.age * 10) % 2 ? 0.5 : 1);
      if (k >= 1) {
        this.scene.fx.text(e.x, e.y - 10, 'ROZTOPIONA', 0.9, 0xe8f4ff);
        this.remove(e);
      }
      return;
    }
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
    if (e.lidded) return this.jar(e, dt, b);
    const p = s.player;
    const ang = Math.atan2(p.y - e.y, p.x - e.x);
    if (this.skin.turret.beckon) {
      // maneki-neko: the raised paw beckons, faster and faster as the shot comes
      const rate = this.canFire(e) && e.timer < 0.7 ? 12 : 3;
      e.head.setFrame(`${this.skin.turret.head}${Math.floor(e.age * rate) % 2}`).setPosition(e.x - 5, e.y - 7);
    } else {
      // head frame i points along (-sin, cos) of i * 22.5deg
      const th = Math.atan2(-(p.x - e.x), p.y - e.y);
      const i = ((Math.round(th / (TAU / 16)) % 16) + 16) % 16;
      e.head.setFrame(`${this.skin.turret.head}${i}`).setPosition(e.x, e.y - 1);
    }
    if (this.canFire(e)) {
      e.timer -= dt;
      if (e.timer <= 0) {
        e.timer = e.pattern === 'lob' ? 2.5 : 2.2;
        const mx = e.x + Math.cos(ang) * 6;
        const my = e.y + Math.sin(ang) * 6;
        if (e.pattern === 'lob') b.lob(e.x, e.y - 3, p.x, p.y); // snowman: a snowball where you are now
        else if (e.pattern === 'puff') {
          // steam nozzle: puffs that swell, slow down and hang in the air for a while
          for (const d of [-0.38, 0, 0.38]) b.shot('wisp_s_1', mx, my, ang + d, 90, 2, { grow: { r0: 2, r1: 5.5, t: 1.3, drag: 0.7 }, life: 2.8 });
          e.timer = 2.6;
        } else if (e.pattern === 'ring') {
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
          ...EXTRAS, type: 'decoy', def: DECOY, hp: 1, maxHp: 1, radius: DECOY.radius, age: 0, seen: 1, state: 'fight', timer: 1.1 + i * 0.5, flash: 0, flashCool: 0,
          ground: false, head: null, master: e, tx: e.x,
        });
        d.play('tanuki_leaf').setDepth(DEPTH.air - 0.1);
        e.decoys.push(d);
      }
      lineup();
      e.timer = 0.9;
    } else if (e.step < 9) {
      // shuffle once halfway, like the cup game; the real one fires a fan meanwhile
      e.decoys = e.decoys.filter((d) => !d.dead && d.master === e);
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
      if (d.dead || d.master !== e) continue;
      this.scene.fx.leaves(d.x, d.y, 10);
      this.pool.kill(d);
    }
    e.decoys = [];
  }

  /** Tanegashima matchlock: a red aim line follows the player, locks and blinks, then one fast shot along it. */
  snipe(e, dt, b) {
    if (!this.canFire(e)) {
      e.aimT = 0;
      return;
    }
    e.aimT += dt;
    if (e.aimT < 0) return; // reloading
    const ox = e.x;
    const oy = e.y + 9;
    const locked = e.aimT >= 0.9;
    if (!locked) e.aimA = this.aimAt(e, 0, 9);
    if (!locked || Math.floor(e.aimT * 16) % 2) {
      this.tele.lineStyle(1, 0xff3a2a, locked ? 0.95 : 0.45);
      this.tele.lineBetween(ox, oy, ox + Math.cos(e.aimA) * 420, oy + Math.sin(e.aimA) * 420);
    }
    if (e.aimT < 1.25) return;
    b.shot('eb_s', ox, oy, e.aimA, 150, 1.8);
    this.scene.fx.spark(ox, oy + 2);
    e.aimT = -0.5;
    if (--e.shots <= 0) {
      e.state = 'leave';
      e.timer = 0.5;
      e.vy = 0;
    }
  }

  /**
   * Kappa (garappa): only ripples on the water or ash while it lurks (shots pass through), edging
   * towards the player; then it surfaces with a splash, blinks, and leaps at the player.
   */
  kappa(e, dt) {
    const s = this.scene;
    const scroll = s.parallax.time < s.parallax.maxTime ? s.parallax.speed.mid : 0;
    if (e.state === 'lurk') {
      e.y += scroll * dt;
      e.x += Phaser.Math.Clamp(s.player.x - e.x, -22 * dt, 22 * dt);
      if ((e.timer -= dt) <= 0) {
        e.state = 'surface';
        e.timer = 0.45;
        e.ghost = false;
        e.play(e.look.anim);
        s.fx.puff('splash', e.x, e.y, 0.3);
      }
    } else if (e.state === 'surface') {
      e.y += scroll * dt;
      e.flash = Math.floor(e.timer * 20) % 2 ? 0.02 : 0;
      if ((e.timer -= dt) <= 0) {
        e.state = 'leap';
        e.ang = this.aimAt(e);
        e.v = 60;
      }
    } else {
      e.v = Math.min(220, e.v + 260 * dt);
      e.x += Math.cos(e.ang) * e.v * dt;
      e.y += Math.sin(e.ang) * e.v * dt;
    }
  }

  /** Black-vinegar jar: armoured with the lid on; the lid rattles, lifts (eyes glow inside), it fires, and shuts. */
  jar(e, dt, b) {
    const lid = this.skin.turret.head;
    const p = this.scene.player;
    let ox = 0;
    e.timer -= dt;
    if (e.lid === 'shut') {
      if (e.timer <= 0 && this.canFire(e)) {
        e.lid = 'rattle';
        e.timer = 0.5;
      }
    } else if (e.lid === 'rattle') {
      ox = Math.floor(e.timer * 30) % 2 ? 1 : -1;
      if (e.timer <= 0) Object.assign(e, { lid: 'open', timer: 1.3, invuln: false, fired: false });
    } else {
      if (!e.fired && e.timer < 1.0 && this.canFire(e)) {
        e.fired = true;
        if (e.pattern === 'ring') b.ring(e.x, e.y, 12, Math.random() * TAU, slow);
        else b.fan(e.x, e.y, Math.atan2(p.y - e.y, p.x - e.x), 5, 0.8, slow);
      }
      if (e.timer <= 0) Object.assign(e, { lid: 'shut', timer: 1.6, invuln: true });
    }
    e.head.setFrame(`${lid}${e.lid === 'open' ? 1 : 0}`).setPosition(e.x + ox, e.y - 1);
  }

  /**
   * Raijū, the thunder beast of the ash storm: lightning columns (a blinking line first), pairs of orbs
   * joined by a live arc, and a charge along a shown line that leaves a trail of sparks.
   */
  raiju(e, dt, b) {
    const s = this.scene;
    if (e.state === 'enter') {
      e.y += Math.max(6, (64 - e.y) * 0.8) * dt;
      if (e.y >= 63) Object.assign(e, { state: 'fight', fight: 0, timer: 0.8, patternIndex: 0, step: 0, dash: null });
      return;
    }
    if (e.state === 'leave') {
      e.vy = (e.vy ?? 0) - 40 * dt;
      e.y += e.vy * dt;
      return;
    }
    e.fight += dt;
    if (e.dash) return this.raijuDash(e, dt, b);
    if (e.fight > 34) {
      e.state = 'leave';
      return;
    }
    e.x += (90 + 40 * Math.sin(e.fight * 0.7) - e.x) * Math.min(1, dt * 2);
    e.y += (64 + 6 * Math.sin(e.fight * 1.7) - e.y) * Math.min(1, dt * 3);
    e.timer -= dt;
    if (e.timer > 0 || !this.canFire(e)) return;
    const pl = s.player;
    switch (e.patternIndex % 3) {
      case 0: {
        // lightning: one column on the player, one or two elsewhere
        const xs = [pl.x, 14 + Math.random() * 152];
        if (e.step % 2) xs.push(14 + Math.random() * 152);
        for (const x of xs) b.beam(Phaser.Math.Clamp(x, 6, VIEW.width - 6), { warn: 0.75, live: 0.22, w: 5 });
        s.time.delayedCall(750, () => s.fx.flash(0.12, 0.12));
        e.timer = 0.85;
        if (++e.step >= 5) this.nextPattern(e);
        break;
      }
      case 1: {
        // orbs joined by an arc, drifting at the player and turning
        const a = this.aimAt(e, 0, 10);
        b.pair(e.x, e.y + 10, Math.cos(a) * 30, Math.sin(a) * 30 + 10, 14, e.step % 2 ? 1.9 : -1.9);
        b.fan(e.x, e.y + 10, a, 3, 0.6, slow);
        e.timer = 1.1;
        if (++e.step >= 4) this.nextPattern(e);
        break;
      }
      default:
        // charge: the line shows where, then it dashes there and back
        e.dash = { t: 0, x0: e.x, y0: e.y, tx: Phaser.Math.Clamp(pl.x, 16, VIEW.width - 16), ty: Math.min(pl.y, s.H * 0.68), back: false, spark: 0 };
        e.timer = 0.6;
        if (++e.step >= 2) this.nextPattern(e);
    }
  }

  raijuDash(e, dt, b) {
    const d = e.dash;
    d.t += dt;
    if (d.t < 0.8) {
      if (Math.floor(d.t * 14) % 2) {
        this.tele.lineStyle(2, 0x9ad8ff, 0.7);
        this.tele.lineBetween(e.x, e.y, d.tx, d.ty);
      }
      e.flash = Math.floor(d.t * 20) % 2 ? 0.02 : 0;
      return;
    }
    const tx = d.back ? d.x0 : d.tx;
    const ty = d.back ? d.y0 : d.ty;
    const dx = tx - e.x;
    const dy = ty - e.y;
    const dist = Math.hypot(dx, dy);
    const step = (d.back ? 140 : 300) * dt;
    if (!d.back && (d.spark -= dt) <= 0 && e.y < this.scene.H * FAIR.noFireBelow) {
      d.spark = 0.05;
      b.fire(e.x, e.y, Math.atan2(dy, dx) + (Math.random() < 0.5 ? 1.6 : -1.6), slow * 0.6);
    }
    if (dist <= step) {
      e.x = tx;
      e.y = ty;
      if (d.back) e.dash = null;
      else d.back = true;
    } else {
      e.x += (dx / dist) * step;
      e.y += (dy / dist) * step;
    }
  }

  // ---------------------------------------------------------------- boss: Sakurajima
  /**
   * The volcano is the summit itself and never moves (all parts are ground targets). Two side vents
   * first: lava bombs thrown in arcs, steam columns, ember sprays. With both vents gone the crater opens:
   * eruption rings, rivers of lava rolling down with one gap, volcanic lightning. Below 30% it erupts.
   * Positions come from the boss wave (the background generator reads the same numbers).
   */
  spawnVolcano(w, base) {
    const s = this.scene;
    const g = { kind: 'volcano', state: 'dormant', t: 0, phase: 0, step: 0, timer: 1, parts: [], enraged: false, defeated: false, awake: false, stage: 1, crater: null };
    const part = (frame, role, [x, u], hp, radius, pts) => {
      const wreck = role === 'vent' ? 'vent_dead' : 'crater_cold';
      const e = this.pool.spawn(frame, x, s.parallax.screenY(u), { ...base, role, u, hp, maxHp: hp, radius, pts, group: g, invuln: true, ground: true, wreck });
      e.setDepth(DEPTH.ground + 0.3);
      g.parts.push(e);
      return e;
    };
    for (const v of w.vents) part('vent_0', 'vent', v, 260, 9, 5000).play('vent');
    g.crater = part('crater_shut', 'crater', w.crater, 900, 15, 0);
    g.maxTotal = g.parts.reduce((sum, p) => sum + p.maxHp, 0);
    this.bossGroup = g;
    return g.crater;
  }

  updateVolcano(g, dt) {
    const s = this.scene;
    const alive = g.parts.filter((p) => !p.dead && p.group === g && p.hp > 0);
    for (const p of alive) p.y = s.parallax.screenY(p.u);
    if (g.state === 'dormant') {
      if (s.parallax.time >= s.parallax.maxTime - 1e-3) {
        g.state = 'wake';
        g.t = 0;
        s.cameras.main.shake(1500, 0.006);
      }
      return;
    }
    g.t += dt;
    if (g.state === 'wake') {
      if (Math.random() < dt * 12) s.fx.spark(g.crater.x + (Math.random() - 0.5) * 40, g.crater.y + (Math.random() - 0.5) * 24);
      if (g.t >= 1.6) {
        Object.assign(g, { state: 'fight', awake: true, t: 0, timer: 0.6 });
        for (const p of alive) if (p.role === 'vent') p.invuln = false;
      }
      return;
    }
    const c = g.crater;
    if (g.stage === 2 && !g.enraged && c.hp < c.maxHp * 0.3) {
      g.enraged = true;
      g.timer = 0.6;
      s.hud.show('', 'SAKURAJIMA WYBUCHA!', 1.6, true);
      s.cameras.main.shake(800, 0.006);
    }
    g.timer -= dt * (g.enraged ? 1.4 : 1);
    if (g.timer > 0) return;
    if (g.stage === 1) this.volcanoVents(g, alive.filter((p) => p.role === 'vent'));
    else this.volcanoCrater(g, c);
  }

  volcanoVents(g, vents) {
    const s = this.scene;
    const b = s.bullets;
    const pl = s.player;
    const next = () => {
      g.phase++;
      g.step = 0;
      g.timer = 1;
    };
    switch (g.phase % 3) {
      case 0:
        // lava bombs thrown in an arc where the player is, and beside
        for (const v of vents) if (this.canFire(v)) b.lob(v.x, v.y - 4, Phaser.Math.Clamp(pl.x + (Math.random() - 0.5) * 50, 10, VIEW.width - 10), pl.y + (Math.random() - 0.5) * 20, 1.2, 'lava');
        g.timer = 0.75;
        if (++g.step >= 5) next();
        break;
      case 1: {
        // steam columns down the slope, the vents taking turns, plus a fan of embers
        const v = vents[g.step % vents.length];
        if (v && this.canFire(v)) {
          b.beam(v.x, { warn: 0.8, live: 0.5, w: 12, kind: 'steam', y0: v.y + 8 });
          b.fan(v.x, v.y + 6, this.aimAt(v, 0, 6), 5, 0.9, slow);
        }
        g.timer = 1.0;
        if (++g.step >= 4) next();
        break;
      }
      default:
        // ember sprays sweeping back and forth
        for (const v of vents) if (this.canFire(v)) b.shot('eb_lava', v.x, v.y + 6, DOWN + Math.sin(g.step * 0.3 + (v.x < 90 ? 0 : Math.PI)) * 1.1, normal, 1.8);
        g.timer = 0.08;
        if (++g.step >= 36) next();
    }
  }

  volcanoCrater(g, c) {
    const s = this.scene;
    const b = s.bullets;
    const pl = s.player;
    if (!this.canFire(c)) {
      g.timer = 0.2;
      return;
    }
    const next = () => {
      g.phase++;
      g.step = 0;
      g.timer = 1;
    };
    switch (g.phase % 3) {
      case 0:
        // eruption rings
        if (g.step === 0) s.cameras.main.shake(400, 0.004);
        b.ring(c.x, c.y + 4, g.enraged ? 22 : 18, g.step * 0.19, g.step % 2 ? normal : slow, g.step % 2 === 0);
        g.timer = 0.5;
        if (++g.step >= 4) next();
        break;
      case 1: {
        // rivers of lava: rows rolling down with one gap, the gap moving each time
        g.gap = g.step === 0 ? 30 + Math.random() * 120 : Phaser.Math.Clamp(g.gap + (Math.random() < 0.5 ? -1 : 1) * (26 + Math.random() * 20), 22, VIEW.width - 22);
        const gw = g.enraged ? 30 : 36;
        for (let x = 4; x < VIEW.width; x += 9) if (Math.abs(x - g.gap) > gw / 2) b.shot('eb_lava', x, c.y + 18, DOWN, 40, 1.8);
        g.timer = 1.0;
        if (++g.step >= 4) next();
        break;
      }
      default: {
        // volcanic lightning in the ash cloud and a fan of glowing rocks
        const xs = [pl.x, 14 + Math.random() * 152, 14 + Math.random() * 152].slice(0, g.enraged ? 3 : 2);
        for (const x of xs) b.beam(Phaser.Math.Clamp(x, 6, VIEW.width - 6), { warn: 0.75, live: 0.22, w: 5, y0: c.y + 14 });
        s.time.delayedCall(750, () => s.fx.flash(0.12, 0.12));
        b.fan(c.x, c.y + 10, this.aimAt(c, 0, 10), g.enraged ? 7 : 5, 0.9, slow, true);
        g.timer = 0.95;
        if (++g.step >= 4) next();
      }
    }
  }

  /** A side vent is plugged; with both gone the crater bursts open. */
  ventDown(e) {
    const s = this.scene;
    const g = e.group;
    const pts = e.pts * s.score.mult;
    s.score.add(pts);
    s.fx.explode(e.x, e.y, 'm', e.u);
    s.fx.text(e.x, e.y - 12, `${pts}`, 1.2, 0xffe080);
    this.wrecks.spawn('vent_dead', e.x, e.y, { u: e.u });
    this.remove(e);
    if (g.parts.some((p) => p.role === 'vent' && !p.dead && p.group === g)) return;
    Object.assign(g, { stage: 2, phase: 0, step: 0, timer: 1.4 });
    g.crater.invuln = false;
    g.crater.play('crater');
    s.bullets.cancelAll(s.fx);
    s.fx.flash(0.5, 0.4);
    s.cameras.main.shake(700, 0.006);
    s.hud.show('KRATER SIĘ OTWIERA!', '', 2);
  }

  // ---------------------------------------------------------------- Osaka: manzai duos
  /**
   * Every regular enemy in Osaka comes as a comedy pair (boke and tsukkomi). Shoot one and the other
   * flies into a rage and fires back at once; take both within 1.2 s for the "NANDE YANEN!" bonus.
   */
  duoDown(e) {
    const s = this.scene;
    const d = e.duo;
    const partner = d.members.find((m) => m !== e && !m.dead && m.duo === d && m.hp > 0);
    if (d.t < 0) {
      d.t = s.t;
      if (!partner) return;
      partner.rage = true;
      s.fx.text(partner.x, partner.y - 12, '!?', 0.7, 0xff7060);
      if (this.canFire(partner)) s.bullets.fan(partner.x, partner.y + 4, this.aimAt(partner, 0, 4), 3, 0.5, normal);
    } else if (s.t - d.t <= 1.2) {
      s.score.add(400 * s.score.mult);
      s.fx.text(e.x, e.y - 14, 'NANDE YANEN!', 1.0, 0xffe080);
    }
  }

  /** A faint line ties the two halves of each duo together. */
  drawDuos() {
    this.tele.lineStyle(1, 0xffe0a0, 0.25);
    for (const e of this.pool.live) {
      const d = e.duo;
      if (!d || e.dead || e.y < -6) continue;
      const o = d.members.find((m) => m !== e && !m.dead && m.duo === d);
      if (o && d.members.indexOf(e) < d.members.indexOf(o) && o.y > -6) this.tele.lineBetween(e.x, e.y, o.x, o.y);
    }
  }

  // ---------------------------------------------------------------- Osaka miniboss: the bunraku puppet
  /**
   * A samurai puppet worked by three black-clad puppeteers, as in Osaka's bunraku theatre. The puppet
   * itself can't be hurt (shots pass through it); each puppeteer drives one attack — the head and right
   * arm (the sword), the left arm (a sweeping stream), the legs (stamps and the dance). Shoot a
   * puppeteer and that part goes limp; with all three down the puppet collapses.
   */
  spawnKuroko(e, base) {
    Object.assign(e, { invuln: true, pass: true, kuroko: [] });
    for (const [role, dx, dy] of [['omo', -17, -18], ['hidari', 23, -2], ['ashi', -9, 27]]) {
      const k = this.pool.spawn('kuroko_0', e.x + dx, e.y + dy, { ...base, ...EXTRAS, type: 'kuroko', def: KUROKO, hp: KUROKO.hp, maxHp: KUROKO.hp, radius: KUROKO.radius, role, dx, dy, master: e, state: 'fight' });
      k.play('kuroko');
      k.setDepth(DEPTH.air - 0.05);
      e.kuroko.push(k);
    }
    e.hp = e.maxHp = KUROKO.hp * 3;
  }

  bunraku(e, dt, b) {
    const s = this.scene;
    const alive = e.kuroko.filter((k) => !k.dead && k.master === e && k.hp > 0);
    const has = (role) => alive.some((k) => k.role === role);
    e.hp = alive.reduce((sum, k) => sum + k.hp, 0);
    if (e.state === 'enter') {
      e.y += Math.max(6, (70 - e.y) * 0.8) * dt;
      if (e.y >= 69) Object.assign(e, { state: 'fight', fight: 0, tOmo: 1.2, tHidari: 2.2, tAshi: 1.6, stream: 0, streamT: 0 });
    } else if (e.state === 'leave') {
      e.vy = (e.vy ?? 0) - 40 * dt;
      e.y += e.vy * dt;
    } else {
      e.fight += dt;
      if (e.fight > 34) e.state = 'leave';
      // the foot puppeteer makes it dance; without him it just stands there
      if (has('ashi')) e.x += (90 + 36 * Math.sin(e.fight * 0.8) - e.x) * Math.min(1, dt * 2);
      e.setRotation((has('omo') ? 0 : 0.12) + (has('hidari') ? 0 : -0.1)); // limp parts tilt it
      if (this.canFire(e)) {
        if (has('omo') && (e.tOmo -= dt) <= 0) {
          // head and right arm: the sword comes down, a wide aimed fan
          e.setFrame('ningyo_1');
          s.time.delayedCall(350, () => !e.dead && e.setFrame('ningyo_0'));
          b.fan(e.x - 8, e.y - 4, this.aimAt(e, -8, -4), 7, 1.1, normal);
          e.tOmo = 1.5;
        }
        if (has('hidari') && e.stream <= 0 && (e.tHidari -= dt) <= 0) {
          e.stream = 14;
          e.streamT = 0;
        }
        if (e.stream > 0 && has('hidari') && (e.streamT -= dt) <= 0) {
          // left arm: an iron fan flicks a stream of shots across the stage
          b.fire(e.x + 14, e.y + 2, DOWN + (e.stream - 7) * 0.13, normal);
          e.streamT = 0.07;
          if (--e.stream <= 0) e.tHidari = 2.6;
        }
        if (has('ashi') && (e.tAshi -= dt) <= 0) {
          // the feet stamp: a ring from the floor of the stage
          b.ring(e.x, e.y + 22, 14, Math.random() * TAU, slow, true);
          s.cameras.main.shake(150, 0.003);
          e.tAshi = 2.4;
        }
      }
    }
    // the puppeteers keep to their posts, half-seen in the dark
    for (const k of alive) {
      k.x = e.x + k.dx + Math.sin(e.age * 2 + k.dx) * 1.5;
      k.y = e.y + k.dy;
      k.setAlpha(0.75 + 0.15 * Math.sin(e.age * 3 + k.dy));
    }
    if (e.state !== 'enter' && !alive.length && !e.dead) this.destroy(e);
  }

  // ---------------------------------------------------------------- Osaka boss: the octopus
  /**
   * A giant octopus with a takoyaki vendor's headband rises from Osaka Bay. Four tentacles (chains of
   * segments that sway and curl) shoot rings from their tips, slam straight down after a warning, and
   * the head lobs takoyaki. Cut every tentacle and the head can be hit: ink spirals, ink blobs,
   * takoyaki barrages; below 35% it goes into a rage.
   */
  spawnTako(w, base) {
    const g = { kind: 'tako', state: 'enter', t: 0, phase: 0, step: 0, timer: 1.2, parts: [], enraged: false, defeated: false, awake: false, head: null, home: w.x, homeY: 62, slam: null };
    for (const [dx, dy, rest, phase] of [[-24, 14, 2.35, 0], [-9, 20, 1.95, 1.7], [9, 20, 1.19, 3.1], [24, 14, 0.79, 4.6]]) {
      const t = this.pool.spawn('ttip', w.x + dx, -60, { ...base, role: 'tentacle', group: g, dx, dy, rest, phase, hp: 170, maxHp: 170, radius: 3.5, pts: 3000, segs: [] });
      for (let i = 0; i < 8; i++) t.segs.push(this.segPool.spawn(`tseg_${i < 3 ? 0 : i < 6 ? 1 : 2}`, t.x, t.y, { r: i < 3 ? 5 : i < 6 ? 4 : 3 }));
      t.setDepth(DEPTH.air - 0.11);
      g.parts.push(t);
    }
    g.head = this.pool.spawn('tako_0', w.x, -60, { ...base, role: 'head', group: g, hp: 800, maxHp: 800, radius: 18, invuln: true });
    g.head.play('tako');
    g.head.setDepth(DEPTH.air - 0.1);
    g.parts.push(g.head);
    g.maxTotal = g.parts.reduce((sum, p) => sum + p.maxHp, 0);
    this.bossGroup = g;
    return g.head;
  }

  updateTako(g, dt) {
    const s = this.scene;
    const h = g.head;
    g.t += dt;
    if (g.state === 'enter') {
      h.y += Math.max(10, (g.homeY - h.y) * 1.2) * dt;
      if (h.y >= g.homeY - 1) Object.assign(g, { state: 'fight', awake: true, timer: 0.8 });
    } else {
      h.x = g.home + 16 * Math.sin(g.t * 0.5 * (g.enraged ? 1.5 : 1));
      h.y = g.homeY + 4 * Math.sin(g.t * 1.1);
    }
    const arms = g.parts.filter((p) => p.role === 'tentacle' && !p.dead && p.group === g);
    if (g.slam) this.slamStep(g, dt);
    for (const t of arms) this.layTentacle(g, t);
    if (g.state !== 'fight') return;
    if (!arms.length && h.invuln) {
      h.invuln = false;
      Object.assign(g, { phase: 0, step: 0, timer: 1.4, slam: null });
      s.bullets.cancelAll(s.fx);
      s.fx.flash(0.4, 0.3);
      s.hud.show('MACKI ODCIĘTE!', '', 2);
    }
    if (!h.invuln && !g.enraged && h.hp < h.maxHp * 0.35) {
      g.enraged = true;
      g.timer = 0.5;
      s.hud.show('', 'OŚMIORNICA WŚCIEKŁA!', 1.6, true);
    }
    g.timer -= dt * (g.enraged ? 1.4 : 1);
    if (g.timer > 0) return;
    if (arms.length) this.takoArms(g, arms);
    else this.takoHead(g, h);
  }

  /** Chain a tentacle's segments out from the head: a resting angle, a sway, a curl towards the tip. */
  layTentacle(g, t) {
    const h = g.head;
    const k = g.slam?.arm === t ? g.slam.k : 0; // 0..1 straighten and stretch straight down
    const len = 8.5 + k * 4.5;
    const sway = Math.sin(g.t * 1.2 + t.phase);
    let x = h.x + t.dx;
    let y = h.y + t.dy;
    const n = t.segs.length;
    for (let i = 0; i <= n; i++) {
      const f = (i + 1) / (n + 1);
      let a = t.rest + sway * 0.45 * f + Math.sin(g.t * 2.3 + t.phase + i * 0.6) * 0.18 * f;
      a += (DOWN - a) * k;
      x += Math.cos(a) * len;
      y += Math.sin(a) * len;
      if (i < n) t.segs[i].setPosition(x, y);
    }
    t.setPosition(x, y);
  }

  takoArms(g, arms) {
    const s = this.scene;
    const b = s.bullets;
    const pl = s.player;
    const h = g.head;
    const next = () => {
      g.phase++;
      g.step = 0;
      g.timer = 1;
    };
    switch (g.phase % 3) {
      case 0: {
        // the tips spit small rings, one arm after another
        const t = arms[g.step % arms.length];
        if (this.canFire(t)) b.ring(t.x, t.y, 8, g.step * 0.4, slow);
        g.timer = 0.45;
        if (++g.step >= arms.length * 2) next();
        break;
      }
      case 1:
        // slams run in slamStep; three in a row
        if (!g.slam) {
          if (g.step >= 3) next();
          else g.slam = { arm: arms[Math.floor(Math.random() * arms.length)], t: 0, k: 0, burst: false };
        }
        g.timer = 0.1;
        break;
      default:
        // takoyaki thrown where the player is
        b.lob(h.x - 12 + Math.random() * 24, h.y + 10, Phaser.Math.Clamp(pl.x + (Math.random() - 0.5) * 40, 10, VIEW.width - 10), pl.y, 1.15, 'takoyaki');
        g.timer = 0.55;
        if (++g.step >= 5) next();
    }
  }

  /** A slam: the arm rears and blinks (a line shows where), whips straight down, bursts, pulls back. */
  slamStep(g, dt) {
    const s = this.scene;
    const sl = g.slam;
    if (sl.arm.dead) {
      g.slam = null;
      g.step++;
      return;
    }
    sl.t += dt;
    const h = g.head;
    const bx = h.x + sl.arm.dx;
    if (sl.t < 0.7) {
      sl.k = 0;
      sl.arm.flash = Math.floor(sl.t * 20) % 2 ? 0.02 : 0;
      if (Math.floor(sl.t * 14) % 2) {
        this.tele.lineStyle(2, 0xff7050, 0.55);
        this.tele.lineBetween(bx, h.y + sl.arm.dy, bx, h.y + sl.arm.dy + 120);
      }
    } else if (sl.t < 0.95) sl.k = (sl.t - 0.7) / 0.25;
    else if (sl.t < 1.45) {
      sl.k = 1;
      if (!sl.burst) {
        sl.burst = true;
        s.bullets.ring(sl.arm.x, sl.arm.y, 10, Math.random() * TAU, normal);
        s.cameras.main.shake(200, 0.004);
      }
    } else if (sl.t < 1.85) sl.k = 1 - (sl.t - 1.45) / 0.4;
    else {
      g.slam = null;
      g.step++;
    }
  }

  takoHead(g, h) {
    const b = this.scene.bullets;
    const pl = this.scene.player;
    if (!this.canFire(h)) {
      g.timer = 0.2;
      return;
    }
    const next = () => {
      g.phase++;
      g.step = 0;
      g.timer = 1;
    };
    switch (g.phase % 3) {
      case 0: {
        // ink spiral from the siphon
        const a = g.step * 0.33;
        for (let k = 0; k < (g.enraged ? 3 : 2); k++) b.shot('eb_ink', h.x, h.y + 16, a + (k * TAU) / (g.enraged ? 3 : 2), slow, 2);
        g.timer = 0.1;
        if (++g.step >= 34) next();
        break;
      }
      case 1: {
        // big ink blobs at the player, a ring behind them
        const a = this.aimAt(h, 0, 16);
        for (let i = 0; i < 5; i++) b.shot('eb_ink_m', h.x, h.y + 16, a + (i / 4 - 0.5) * 0.9, normal, 3);
        b.ring(h.x, h.y + 16, 14, g.step * 0.3, slow);
        g.timer = 0.9;
        if (++g.step >= 4) next();
        break;
      }
      default:
        for (let i = 0; i < (g.enraged ? 3 : 2); i++) b.lob(h.x - 16 + i * 16, h.y + 10, Phaser.Math.Clamp(pl.x + (Math.random() - 0.5) * 50, 10, VIEW.width - 10), pl.y + (Math.random() - 0.5) * 20, 1.15, 'takoyaki');
        g.timer = 0.6;
        if (++g.step >= 5) next();
    }
  }

  /** A tentacle is cut off: a chain of explosions runs along it. */
  tentacleDown(e) {
    const s = this.scene;
    const pts = e.pts * s.score.mult;
    s.score.add(pts);
    s.fx.text(e.x, e.y - 10, `${pts}`, 1.2, 0xffe080);
    s.fx.explode(e.x, e.y, 'm');
    const segs = e.segs;
    segs.forEach((sg, i) =>
      s.time.delayedCall((segs.length - i) * 60, () => {
        s.fx.explode(sg.x, sg.y, 's');
        this.segPool.kill(sg);
      }),
    );
    e.segs = null;
    this.remove(e);
  }

  // ---------------------------------------------------------------- Beppu: geysers
  /**
   * A hot-spring vent riding on the mid layer, erupting every few seconds: it boils while a ring on the
   * ground fills up (the warning), then a scalding column bursts out and throws droplets around.
   * Mud vents (Oniishibozu Jigoku) erupt wider and longer and throw heavy blobs instead.
   */
  geyser(e, dt, b) {
    const s = this.scene;
    e.y = s.parallax.screenY(e.u);
    if (e.erupt > 0 && (e.erupt -= dt) <= 0) {
      s.fx.puff('wisp_s_0', e.x, e.y - 6, 0.6);
      if (e.y > 4 && e.y < s.H * 0.75 && s.bombClear <= 0) {
        const off = Math.random() * TAU;
        if (e.mud) for (let i = 0; i < 5; i++) b.fire(e.x, e.y, off + (i / 5) * TAU, slow * 0.7, true);
        else for (let i = 0; i < 8; i++) b.fire(e.x, e.y, off + (i / 8) * TAU, slow * 0.9);
      }
    }
    if (e.showT > 0 && (e.showT -= dt) <= 0) {
      e.anims.stop();
      e.setAlpha(0);
    }
    e.timer -= dt;
    if (e.timer > 0 || e.y < -4) return;
    e.timer = e.every;
    const warn = 0.9;
    const live = e.mud ? 1.1 : 0.55;
    b.zone(e.x, e.y, e.mud ? 16 : 12, { warn, live, kind: e.mud ? 'mud' : 'water', u: e.u });
    e.erupt = warn;
    e.showT = warn + live;
    e.setAlpha(1).play(e.mud ? this.skin.geyser.mudAnim : this.skin.geyser.anim);
  }

  // ---------------------------------------------------------------- Beppu miniboss: the Oniyama crocodile
  /**
   * A crocodile from the Oniyama hot pools. It sinks (only its eyes and ripples show, shots pass) and
   * swims under the player, then surfaces with a spray; it snaps its jaws, firing two rows of teeth that
   * close on the player; and it death-rolls, spinning out a spiral while the pool erupts around the player.
   */
  wani(e, dt, b) {
    const s = this.scene;
    const pl = s.player;
    if (e.state === 'enter') {
      e.y += Math.max(8, (78 - e.y) * 0.9) * dt;
      if (e.y >= 77) Object.assign(e, { state: 'fight', fight: 0, timer: 0.8, patternIndex: 0, step: 0, sub: null, roll: 0, snapT: 0 });
      return this.waniSegs(e);
    }
    if (e.state === 'leave') {
      e.vy = (e.vy ?? 0) - 40 * dt;
      e.y += e.vy * dt;
      return this.waniSegs(e);
    }
    e.fight += dt;
    if (e.snapT > 0 && (e.snapT -= dt) <= 0 && !e.sub) e.setFrame('wani_0');
    if (e.sub) return this.waniDive(e, dt, b);
    if (e.roll > 0) {
      // death roll: the whole body spins, a spiral of scalding water flies out of the jaws
      e.roll -= dt;
      e.setRotation(e.rotation + dt * TAU / 1.2);
      if ((e.spin -= dt) <= 0 && this.canFire(e)) {
        e.spin = 0.07;
        for (let k = 0; k < 2; k++) b.fire(e.x, e.y, e.rotation + DOWN + k * Math.PI, slow);
      }
      if (e.roll <= 0) e.setRotation(0);
      return this.waniSegs(e);
    }
    if (e.fight > 38) {
      e.state = 'leave';
      return;
    }
    e.x += (90 + 34 * Math.sin(e.fight * 0.6) - e.x) * Math.min(1, dt * 2);
    e.y += (78 + 5 * Math.sin(e.fight * 1.3) - e.y) * Math.min(1, dt * 3);
    this.waniSegs(e);
    e.timer -= dt;
    if (e.timer > 0 || !this.canFire(e)) return;
    const mouth = { x: e.x, y: e.y + 30 };
    switch (e.patternIndex % 3) {
      case 0:
        // sink and swim under the player
        e.sub = { phase: 'swim', t: 0, ripple: 0 };
        e.anims.stop();
        e.setFrame('wani_sub');
        e.ghost = true;
        s.fx.puff('splash', e.x, e.y + 10, 0.4);
        break;
      case 1: {
        // the jaws: two rows of teeth closing on where the player is now
        const a = this.aimAt(e, 0, 30);
        const d = Math.max(60, Math.hypot(pl.x - mouth.x, pl.y - mouth.y));
        for (const side of [-1, 1])
          for (let i = 0; i < 6; i++) {
            const th = 0.42 + i * 0.07;
            const v = 88;
            const t = d / (v * Math.cos(th));
            const acc = (2 * v * Math.sin(th)) / t;
            const n = a - side * DOWN; // across the aim line, towards it
            b.shot('eb_s', mouth.x, mouth.y, a + side * th, v, 1.8, { ax: Math.cos(n) * acc, ay: Math.sin(n) * acc });
          }
        e.setFrame('wani_1');
        e.snapT = 0.3;
        s.sfx.explode('s');
        e.timer = 0.95;
        if (++e.step >= 3) this.nextPattern(e);
        break;
      }
      default:
        // death roll, and the pool erupts under and around the player
        e.roll = 1.2;
        e.spin = 0;
        b.zone(pl.x, pl.y, 12, { warn: 1.0, live: 0.5 });
        for (const [dx, dy] of [[-34, -14], [34, -14], [0, 30]]) b.zone(Phaser.Math.Clamp(pl.x + dx, 12, VIEW.width - 12), Phaser.Math.Clamp(pl.y + dy, 30, s.H - 16), 11, { warn: 1.2, live: 0.5 });
        e.timer = 0.6;
        if (++e.step >= 2) this.nextPattern(e);
    }
  }

  /** Under the surface: ripples heading for the player, then it bursts out with a spray. */
  waniDive(e, dt, b) {
    const s = this.scene;
    const d = e.sub;
    d.t += dt;
    if (d.phase === 'swim') {
      const tx = Phaser.Math.Clamp(s.player.x, 24, VIEW.width - 24);
      e.x += Phaser.Math.Clamp(tx - e.x, -60 * dt, 60 * dt);
      e.y += (96 - e.y) * Math.min(1, dt * 1.5);
      if ((d.ripple -= dt) <= 0) {
        d.ripple = 0.18;
        s.fx.puff('splash', e.x + (Math.random() - 0.5) * 8, e.y - 6, 0.3);
      }
      if (d.t > 1.4) Object.assign(d, { phase: 'rise', t: 0 });
    } else if (d.phase === 'rise') {
      e.flash = Math.floor(d.t * 20) % 2 ? 0.02 : 0;
      if (d.t > 0.35) {
        e.ghost = false;
        e.setFrame('wani_1');
        e.snapT = 0.5;
        s.fx.puff('splash', e.x, e.y + 20, 0.4);
        s.fx.puff('splash', e.x, e.y - 10, 0.4);
        if (this.canFire(e)) {
          b.ring(e.x, e.y + 10, 14, Math.random() * TAU, slow);
          b.fan(e.x, e.y + 30, this.aimAt(e, 0, 30), 5, 0.7, normal);
        }
        e.sub = null;
        e.timer = 0.8;
        this.nextPattern(e);
      }
    }
    this.waniSegs(e);
  }

  /** Hit circles for the long body: the snout and the tail, following the rotation. */
  waniSegs(e) {
    const [head, tail] = e.segs;
    const sn = Math.sin(e.rotation);
    const cs = Math.cos(e.rotation);
    Object.assign(head, { x: e.x - sn * 22, y: e.y + cs * 22 });
    Object.assign(tail, { x: e.x + sn * 21, y: e.y - cs * 21 });
  }

  // ---------------------------------------------------------------- Beppu boss: the red oni of Chinoike
  /**
   * The oni sleeps in the blood pond and rises when the scroll stops. Normal shots barely chip his hide:
   * Setsubun beans do the damage ("Oni wa soto!"). Masu boxes of beans fly across the screen; shoot one
   * and catch the beans. Attacks: the kanabō smash (a marked spot, then a fissure of eruptions running
   * at the player), blood lobbed from the pond, stomps that set off geysers, roaring fans; enraged
   * below 35% he also swings the club round in a spiral. The pond position comes from the boss wave.
   */
  spawnOni(w, base) {
    const s = this.scene;
    const [x, u] = w.pond;
    const g = { kind: 'oni', state: 'dormant', t: 0, phase: 0, step: 0, timer: 1, parts: [], enraged: false, defeated: false, awake: false };
    Object.assign(g, { home: x, u, sway: 0, masuT: 0, masuSide: 1, act: null, poseT: 0 });
    const e = this.pool.spawn('oni_0', x, s.parallax.screenY(u), { ...base, role: 'body', hp: 1000, maxHp: 1000, radius: 18, group: g, invuln: true, oni: true, pose: 0, hurtT: 0, shoutT: 0 });
    e.segs = [{ x, y: 0, r: 12 }]; // the head
    e.setDepth(DEPTH.air - 0.1).setAlpha(0);
    g.body = e;
    g.parts.push(e);
    g.maxTotal = e.maxHp;
    this.bossGroup = g;
    return e;
  }

  /** Stand in the pond with `vh` px of the sprite above the surface (rising from the blood). */
  oniStand(e, surf, vh) {
    e.setCrop(0, 0, 63, vh);
    e.y = surf + 42 - vh;
    Object.assign(e.segs[0], { x: e.x, y: e.y - 20 });
  }

  oniHurt(e) {
    e.hurtT = 0.12;
    if (e.shoutT > 0) return;
    e.shoutT = 2.6;
    this.scene.fx.text(e.x, e.y - 42, 'ONI WA SOTO!', 0.9, 0xffe080);
  }

  spawnMasu(g) {
    const s = this.scene;
    g.masuSide = -g.masuSide;
    const y = 130 + Math.random() * Math.max(10, s.H * 0.58 - 130);
    const x = g.masuSide < 0 ? -10 : VIEW.width + 10;
    this.pool.spawn('masu', x, y, { ...EXTRAS, type: 'masu', def: MASU, hp: MASU.hp, maxHp: MASU.hp, radius: MASU.radius, age: 0, seen: 0, state: 'fly', flash: 0, flashCool: 0, ground: false, head: null, dir: -g.masuSide, y0: y, harmless: true });
  }

  updateOni(g, dt) {
    const s = this.scene;
    const e = g.body;
    if (e.dead || e.group !== g) return;
    const surf = s.parallax.screenY(g.u);
    g.t += dt;
    if (g.state === 'dormant') {
      e.setPosition(g.home, surf);
      // bubbles rising in the blood pond
      if (surf > 0 && surf < s.H && Math.random() < dt * 4) s.fx.puff('bloodball_1', g.home + (Math.random() - 0.5) * 50, surf + (Math.random() - 0.5) * 14, 0.4);
      if (s.parallax.time >= s.parallax.maxTime - 1e-3) {
        Object.assign(g, { state: 'rise', t: 0 });
        e.setAlpha(1);
        s.cameras.main.shake(2400, 0.005);
      }
      return;
    }
    if (g.state === 'rise') {
      const k = Math.min(1, g.t / 2.4);
      this.oniStand(e, surf, Math.max(1, Math.round(60 * k)));
      if (Math.random() < dt * 14) s.fx.puff('bloodball_1', e.x + (Math.random() - 0.5) * 50, surf + 6, 0.3);
      if (k >= 1) {
        Object.assign(g, { state: 'fight', awake: true, t: 0, timer: 1.4, masuT: 0.3 });
        e.invuln = false;
        s.hud.show('RZUCAJ FASOLKI!', 'ZESTRZEL MASU I ZŁAP FASOLKI', 2.8);
      }
      return;
    }
    e.hurtT -= dt;
    e.shoutT -= dt;
    if (g.poseT > 0 && (g.poseT -= dt) <= 0) e.pose = 0;
    if (!g.act) g.sway += dt * (g.enraged ? 0.7 : 0.45);
    e.x = g.home + 22 * Math.sin(g.sway);
    this.oniStand(e, surf, 60);
    e.setFrame(e.hurtT > 0 && e.pose === 0 ? 'oni_hurt' : `oni_${e.pose}`);
    // a fresh masu of beans every few seconds (at most two in the air)
    if ((g.masuT -= dt) <= 0) {
      g.masuT = g.enraged ? 5 : 6.5;
      if (this.pool.live.filter((m) => m.type === 'masu' && !m.dead).length < 2) this.spawnMasu(g);
    }
    if (!g.enraged && e.hp < e.maxHp * 0.35) {
      Object.assign(g, { enraged: true, timer: 0.8, phase: 0, step: 0 });
      s.hud.show('', 'ONI WPADA W SZAŁ!', 1.6, true);
    }
    if (g.act) return this.oniSmash(g, e, dt);
    g.timer -= dt * (g.enraged ? 1.35 : 1);
    if (g.timer > 0 || !this.canFire(e)) return;
    this.oniAttack(g, e);
  }

  oniAttack(g, e) {
    const s = this.scene;
    const b = s.bullets;
    const pl = s.player;
    const list = g.enraged ? ['smash', 'spin', 'blood', 'stomp', 'spin', 'roar'] : ['smash', 'blood', 'stomp', 'roar'];
    const next = () => {
      g.phase++;
      g.step = 0;
      g.timer = 1.0;
    };
    switch (list[g.phase % list.length]) {
      case 'smash': {
        // raise the kanabō on the player's side; the impact spot and the fissure towards the player are marked
        const side = pl.x > e.x ? 1 : -1;
        e.setFlipX(side > 0);
        const ix = e.x + side * 26;
        const iy = e.y + 30;
        const dx = pl.x - ix;
        const dy = pl.y - iy;
        const d = Math.hypot(dx, dy) || 1;
        const warn = 0.8;
        b.zone(ix, iy, 14, { warn, live: 0.3, kind: 'blood' });
        const n = Math.min(14, Math.ceil(d / 17) + 1);
        for (let i = 1; i <= n; i++) b.zone(ix + (dx / d) * 17 * i, iy + (dy / d) * 17 * i, 8, { warn: warn + 0.06 * i, live: 0.3, kind: 'blood' });
        g.act = { t: 0, warn, ix, iy };
        e.pose = 1;
        if (++g.step >= (g.enraged ? 3 : 2)) next();
        break;
      }
      case 'blood': {
        // scoops the pond and throws blood at the player and around
        const n = g.enraged ? 4 : 3;
        for (let i = 0; i < n; i++) {
          const tx = i === 0 ? pl.x : 14 + Math.random() * (VIEW.width - 28);
          const ty = i === 0 ? pl.y : pl.y + (Math.random() - 0.5) * 70;
          b.lob(e.x, e.y + 22, Phaser.Math.Clamp(tx, 10, VIEW.width - 10), Phaser.Math.Clamp(ty, 40, s.H - 14), 1.1 + i * 0.1, 'blood');
        }
        e.pose = 2;
        g.poseT = 0.35;
        g.timer = 0.9;
        if (++g.step >= 3) next();
        break;
      }
      case 'stomp': {
        // a stomp sets off the hot springs: eruptions all over, one under the player
        s.cameras.main.shake(300, 0.005);
        b.zone(pl.x, pl.y, 13, { warn: 1.0, live: 0.5 });
        for (let i = 0; i < 4; i++) b.zone(16 + Math.random() * (VIEW.width - 32), s.H * 0.4 + Math.random() * (s.H * 0.6 - 24), 13, { warn: 1.0, live: 0.5 });
        b.ring(e.x, e.y + 28, g.enraged ? 14 : 10, g.step * 0.3, slow);
        g.timer = 1.4;
        if (++g.step >= 3) next();
        break;
      }
      case 'spin': {
        // the club swung round and round: a three-armed spiral
        e.pose = g.step % 4 < 2 ? 1 : 2;
        e.setFlipX(g.step % 8 < 4);
        g.poseT = 0.2;
        for (let k = 0; k < 3; k++) b.fire(e.x, e.y + 6, g.step * 0.23 + (k * TAU) / 3, normal);
        g.timer = 0.07;
        if (++g.step >= 44) next();
        break;
      }
      default: {
        // a roar: wide aimed fans, then heavy shots
        const a = this.aimAt(e, 0, 10);
        if (g.step % 2 === 0) b.fan(e.x, e.y + 10, a, g.enraged ? 9 : 7, 1.1, slow);
        else b.fan(e.x, e.y + 10, a, 3, 0.4, normal, true);
        g.timer = 0.5;
        if (++g.step >= 6) next();
      }
    }
  }

  /** The kanabō comes down: impact, a burst of shards, then the club goes back up. */
  oniSmash(g, e, dt) {
    const s = this.scene;
    const a = g.act;
    a.t += dt;
    if (e.pose === 1 && a.t >= a.warn) {
      e.pose = 2;
      s.cameras.main.shake(350, 0.008);
      s.sfx.explode('m');
      s.fx.shards(a.ix, a.iy, 10, true);
      if (s.bombClear <= 0) s.bullets.ring(a.ix, a.iy, 12, Math.random() * TAU, slow);
    }
    if (a.t >= a.warn + 0.55) {
      e.pose = 0;
      g.act = null;
      g.timer = 0.35;
    }
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
