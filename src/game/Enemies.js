import Phaser from 'phaser';
import { BEANS, DEPTH, ENEMIES, FAIR, VIEW, WEAPONS } from '../config.js';
import { rules } from '../difficulty.js';
import { Pool } from './Pool.js';
import { SKINS } from './skins.js';
import { slow, normal, fast, DOWN, TAU, EXTRAS } from './enemies/shared.js';
import { DAIMONJI, kyoto } from './enemies/kyoto.js';
import { okinawa } from './enemies/okinawa.js';
import { sapporo, YUKI } from './enemies/sapporo.js';
import { kagoshima } from './enemies/kagoshima.js';
import { osaka } from './enemies/osaka.js';
import { beppu } from './enemies/beppu.js';
import { nagasaki } from './enemies/nagasaki.js';
import { hiroshima } from './enemies/hiroshima.js';
// the two halves of a burst volcanic bomb
const FRAG = { hp: 1, weight: 0, score: 50, radius: 3, explosion: 's' };

// How a boss or heavy goes out once its chain of blasts is over (see goDown), and the colour of what a
// crumbling one breaks into.
const CLAY = 0xd8784a; // the shisa's glazed clay
const WOOD = 0xa8683a; // the bunraku puppet

// Six archetypes shared by every city (each stage picks a skin), plus stage bosses.
export class Enemies {
  constructor(scene, skin = 'kyoto') {
    this.scene = scene;
    this.skin = SKINS[skin] ?? SKINS.kyoto;
    this.pool = new Pool(scene, DEPTH.air);
    this.heads = new Pool(scene, DEPTH.ground + 0.2);
    this.wrecks = new Pool(scene, DEPTH.ground);
    this.segPool = new Pool(scene, DEPTH.air - 0.12); // the octopus's tentacle segments
    this.tailPool = new Pool(scene, DEPTH.air - 0.13); // Kyūbi's tails
    this.heavy = null;
    this.bossGroup = null;
    this.dying = []; // bosses and heavies going down (goDown)
    this.woundPool = new Pool(scene, DEPTH.air + 0.02);
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
        e.fireAt = Math.random() < rules().popcornFireChance ? 0.9 + Math.random() * 1.4 : Infinity;
        if (look.flock && w.flock) e.flock = w.flock;
        e.split = !!look.split;
        e.crane = !!look.crane;
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
        } else if (look.oyster) {
          // Seto oyster: armored bivalve shell while shut, lustrous pearl exposed when open
          e.oyster = true;
          e.shellOpen = false;
          e.opening = false;
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
        e.scoop = !!look.scoop;
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
        if (look.kind === 'oranda') this.spawnOranda(e, base);
        if (look.kind === 'wani') Object.assign(e, { y: -40, radius: 11, segs: [{ x: 0, y: 0, r: 9 }, { x: 0, y: 0, r: 8 }] });
        if (look.kind === 'yukionna') Object.assign(e, { hp: YUKI.hp, maxHp: YUKI.hp, kuroko: [], mists: [], seeds: [] });
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
        e.setScale(1.3 / 3).setAlpha(0.8); // (its frames are drawn at 3x) tinted warm every frame: this steam is hot (the background plumes are white)
        break;
      case 'boss':
        if (w.boss === 'jaodori') return this.spawnJaodori(w, base);
        if (w.boss === 'oni') return this.spawnOni(w, base);
        if (w.boss === 'volcano') return this.spawnVolcano(w, base);
        if (w.boss === 'tako') return this.spawnTako(w, base);
        if (w.boss === 'kyubi') return this.spawnKyubi(w, base);
        if (w.boss === 'sankibo') return this.spawnSankibo(w, base);
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

  /** The target a homing orb at (x, y) seeks: within its range, never one that has only just come on screen. */
  nearest(x, y) {
    const { range, lockY, lockSeen } = WEAPONS.homing;
    let best = null;
    let bd = range * range;
    for (const e of this.pool.live) {
      if (e.y < lockY || e.seen < lockSeen || e.hp <= 0 || e.ghost || e.invuln) continue;
      // a Setsubun masu box comes first: its beans are what hurt the oni
      const d = (e.x - x) ** 2 + (e.y - y) ** 2 + (e.ground ? 900 : 0) - (e.type === 'masu' ? 6400 : 0);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  canFire(e) {
    const H = this.scene.H;
    const r = rules();
    // (bosses keep the normal line on easy too: their attacks wait for it)
    const below = e.type === 'boss' || e.type === 'heavy' ? FAIR.noFireBelow : r.noFireBelow;
    return e.seen >= r.noFireAfterEnter && e.y > 4 && e.y < H * below && this.scene.bombClear <= 0 && !this.scene.ceasefire;
  }

  aimAt(e, ox = 0, oy = 0) {
    const p = this.scene.player;
    return Math.atan2(p.y - (e.y + oy), p.x - (e.x + ox));
  }

  damage(e, amount, byBomb = false, bean = false) {
    // a bomb blows the lid off a vinegar jar; otherwise invulnerable things shrug it off
    if (e.dead || e.hp <= 0 || e.ghost || (e.invuln && !(byBomb && e.lidded))) return;
    const crabBlock = e.kind === 'heikegani' && e.guarding && !byBomb && Math.abs(this.scene.player.x - e.x) < 22;
    const boss = e.type === 'heavy' || e.type === 'boss' || e.type === 'kuroko';
    if (boss) {
      this.scene.sfx.bossHit((e.oni && !bean) || crabBlock);
      amount /= rules().bossHp; // easy: they give in sooner
    }
    if (crabBlock) {
      // Heike-gani's iron pincers deflect frontal shots unless flanked from the sides
      if (Math.random() < 0.45) this.scene.fx.spark(e.x, e.y + 14);
      e.hp -= amount * 0.15;
      if (e.hp <= 0) this.destroy(e, byBomb);
      return;
    }
    if (e.oni && !bean) {
      // the oni's hide: normal shots barely chip it (no flash), a bomb does half
      e.hp -= amount * (byBomb ? 0.5 : BEANS.armor);
      if (e.hp <= 0) this.destroy(e, byBomb);
      return;
    }
    if (e.oyster && !byBomb) {
      if (!e.shellOpen) {
        amount *= 0.3;
        if (Math.random() < 0.35) this.scene.fx.spark(e.x, e.y);
      } else amount *= 2.0;
    }
    if (e.oni) this.oniHurt(e);
    // brief brighten, rate-limited so constant fire blinks instead of whiting the sprite out
    if (e.flashCool <= 0) {
      e.flash = 0.035;
      e.flashCool = 0.12;
    }
    if (!e.ground && !e.oni && e.group?.kind !== 'volcano') {
      const cap = e.type === 'boss' ? 1.0 : e.type === 'heavy' ? 1.6 : 2.2;
      const step = e.type === 'boss' ? 0.5 : e.type === 'heavy' ? 0.9 : 1.4;
      e.recoil = Math.min(cap, (e.recoil || 0) + step);
    }
    if (e.armor > 0) {
      // ice shell first (a bomb shatters it outright), the rest goes through to the flame
      e.armor -= byBomb ? Infinity : amount;
      if (e.armor > 0) {
        if (e.flash === 0.035) {
          e.setRotation((Math.random() < 0.5 ? -1 : 1) * 0.22);
          this.scene.fx.shards(e.x, e.y, 2, true);
        }
        return;
      }
      amount = byBomb ? amount : -e.armor;
      this.shatter(e);
    }
    e.hp -= amount;
    if (e.hp <= 0) this.destroy(e, byBomb);
  }

  damageAll(amount) {
    for (const e of this.pool.live) if (e.y > -e.radius && e.y < this.scene.H + e.radius) this.damage(e, amount, true);
  }

  destroy(e, byBomb = false) {
    const s = this.scene;
    if (e.kind === 'yukimirror') {
      this.mirrorDown(e);
      return;
    }
    if (e.type === 'crystal') {
      this.crystalDown(e, byBomb);
      return;
    }
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
    if (e.group?.kind === 'sankibo' && e.role === 'brazier') {
      this.brazierDown(e);
      return;
    }
    if (e.group?.kind === 'sankibo' && e.role === 'body') {
      for (const br of e.group.braziers) {
        if (!br.dead && br.group === e.group) {
          s.fx.explode(br.x, br.y, 's');
          this.remove(br);
        }
      }
    }
    if (e.duo) this.duoDown(e);
    if (e.type === 'kuroko' && e.master && !e.master.dead) e.master.recoil = 2.0;
    if (e.loot) this.returnLoot(e);
    if (e.split && !byBomb) {
      // a volcanic bomb bursts into two smaller halves flying apart
      for (const side of [-1, 1]) {
        const f = this.pool.spawn('kazan_s_0', e.x, e.y, { ...EXTRAS, type: 'frag', def: FRAG, hp: 1, maxHp: 1, radius: FRAG.radius, age: 0, seen: 1, state: 'fly', flash: 0, flashCool: 0, ground: false, head: null, vx: side * (40 + Math.random() * 20), vy: -30 });
        f.play('kazan_s');
      }
    }
    s.score.kill(e.def);
    s.discoverEnemy(e);
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
    const big = e.type === 'heavy' || e.type === 'boss';
    if (e.ground) {
      s.fx.explode(e.x, e.y, e.def.explosion, e.u);
      const wr = this.wrecks.spawn(e.wreck ?? this.skin.turret.wreck, e.x, e.y, { u: e.u });
      if (e.horiz) wr.setRotation(-e.dir * Math.PI / 2);
    } else s.fx.explode(e.x, e.y, big ? 'm' : e.def.explosion); // (a boss's body stays a moment: goDown)
    if (e.type === 'carrier') s.spawnPickup(e.color, e.x, e.y, -40);
    if (e.type === 'masu') s.spawnPickup('mame', e.x, e.y, -40);
    if (big) {
      const { x, y } = e;
      this.goDown(e);
      s.bullets.cancelAll(s.fx);
      s.fx.text(x, y - 24, `${e.def.score * s.score.mult}`, 1.6, 0xffe080);
      if (e.type === 'heavy') {
        this.heavy = null;
        s.freeze(0.3);
      }
    }
    this.remove(e);
    const g = this.bossGroup;
    if (e.type === 'boss' && g && !g.defeated && g.parts.every((p) => p.dead || p.hp <= 0 || p.group !== g)) {
      g.defeated = true;
      s.onBossDefeated();
    }
  }

  /** HP shown in the top bar: the mid-stage heavy or the whole boss pair. */
  bossBar() {
    const g = this.bossGroup;
    if (g && !g.defeated && (g.kind === 'kuma' || g.kind === 'volcano' || g.kind === 'tako' || g.kind === 'oni' || g.kind === 'kyubi' || g.kind === 'sankibo' ? g.awake : g.parts.some((p) => !p.dead && p.group === g && p.y > 0))) {
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
    if (g.kind === 'jaodori') return this.updateJaodori(g, dt);
    if (g.kind === 'kuma') return this.updateKuma(g, dt);
    if (g.kind === 'volcano') return this.updateVolcano(g, dt);
    if (g.kind === 'tako') return this.updateTako(g, dt);
    if (g.kind === 'oni') return this.updateOni(g, dt);
    if (g.kind === 'kyubi') return this.updateKyubi(g, dt);
    if (g.kind === 'sankibo') return this.updateSankibo(g, dt);
    this.updateShisa(g, dt);
  }

  /**
   * A boss or a heavy going down: its body stays on, shaking and flashing in a chain of blasts, then goes out
   * its own way: the oni sinks into the blood pond, the octopus into the canal, the crocodile into its pool
   * and the manta into the sea; Yuki-onna shatters into ice, the clay shisa and the wooden puppet crumble,
   * the tanuki scatters into leaves, Sakurajima cools down, Kyūbi burns away in fox-fire (and the 大 on the
   * slope flares up), the rest blow up.
   */
  goDown(e) {
    const s = this.scene;
    const copy = (o) => s.add.sprite(o.x, o.y, o.texture.key, o.frame.name).setDepth(o.depth).setFlipX(o.flipX).setRotation(o.rotation).setScale(o.scaleX, o.scaleY);
    const body = copy(e);
    if (e.oni) body.setCrop(0, 0, 63, 60); // standing in the pond
    const kind = e.group?.kind ?? e.kind;
    const end =
      e.oni || kind === 'tako' || kind === 'wani' || kind === 'heikegani' || e.frame.name.startsWith('manta')
        ? 'sink'
        : kind === 'yukionna'
          ? 'shatter'
          : kind === 'tanuki'
            ? 'leaves'
            : kind === 'sankibo'
              ? 'momiji'
              : kind === 'bunraku' || (e.type === 'boss' && !kind)
                ? 'crumble'
                : kind === 'volcano'
                  ? 'cool'
                  : kind === 'kyubi'
                    ? 'foxfire'
                    : 'burst';
    const color = kind === 'bunraku' ? WOOD : CLAY;
    // what goes down with the body (the fox's last tail), kept where it was on it
    const extra = kind === 'kyubi' ? e.group.tails.filter((tl) => !tl.lost && !tl.dead).map((tl) => ({ s: copy(tl), ox: tl.x - e.x, oy: tl.y - e.y })) : [];
    this.dying.push({ body, extra, t: 0, x: e.x, y: e.y, r: Math.max(10, e.radius), end, color, oni: !!e.oni, liquid: e.oni ? 'bloodball_1' : 'splash', next: 0, ended: false });
  }

  /** The bodies going down: the chain of blasts (1.1 s), then each one's own end. */
  updateDying(dt) {
    const s = this.scene;
    const fx = s.fx;
    let n = 0;
    for (const d of this.dying) {
      d.t += dt;
      const b = d.body;
      let done = false;
      if (d.t < 1.1) {
        b.setPosition(d.x + Math.round((Math.random() - 0.5) * 3), d.y + Math.round((Math.random() - 0.5) * 3));
        b.setTint(Math.floor(d.t * 14) % 2 ? 0x707070 : 0x000000).setTintMode(Phaser.TintModes.ADD);
        for (const x of d.extra) x.s.setPosition(b.x + x.ox, b.y + x.oy).setTint(Math.floor(d.t * 14) % 2 ? 0x707070 : 0x000000).setTintMode(Phaser.TintModes.ADD);
        if ((d.next -= dt) <= 0) {
          d.next = 0.11;
          fx.explode(d.x + (Math.random() - 0.5) * d.r * 2.2, d.y + (Math.random() - 0.5) * d.r * 1.8, Math.random() < 0.3 ? 'm' : 's', null, (d.n = (d.n ?? 0) + 1) % 3 !== 0);
        }
      } else {
        const k = d.t - 1.1;
        if (!d.ended) {
          d.ended = true;
          b.setPosition(d.x, d.y).clearTint();
          for (const x of d.extra) x.s.setPosition(d.x + x.ox, d.y + x.oy).clearTint();
          s.cameras.main.shake(400, 0.007);
          if (d.end === 'burst' || d.end === 'cool') {
            fx.explode(d.x, d.y, 'l');
            fx.debris(d.x, d.y, 16, null, 1.9);
            fx.flash(0.5, 0.4);
            fx.shockwave(d.x, d.y);
          } else if (d.end === 'sink') {
            fx.explode(d.x, d.y, 'm');
            fx.flash(0.3, 0.3);
          } else if (d.end === 'shatter') {
            fx.shards(d.x, d.y, 44);
            fx.cityBits(d.x, d.y, 10, 1.6);
            fx.flash(0.6, 0.4);
          } else if (d.end === 'crumble') {
            fx.debris(d.x, d.y, 26, d.color, 1.5);
            fx.debris(d.x, d.y, 8, null, 1.2);
            fx.smoke(d.x, d.y, 6, d.r * 0.6);
            fx.flash(0.35, 0.3);
          } else if (d.end === 'leaves') {
            fx.leaves(d.x, d.y, 34);
            fx.smoke(d.x, d.y, 4, d.r * 0.5);
            fx.flash(0.3, 0.3);
          } else if (d.end === 'momiji') {
            fx.cityBits(d.x, d.y, 36, 2.0);
            fx.light(d.x, d.y, 2.0, false, 0xff8a30);
            fx.shockwave(d.x, d.y);
            fx.flash(0.5, 0.45);
          } else if (d.end === 'foxfire') {
            fx.foxfire(d.x, d.y, 26, 14);
            fx.light(d.x, d.y, 2, false, 0x80b0ff);
            fx.shockwave(d.x, d.y);
            fx.flash(0.5, 0.5);
          }
        }
        if (d.end === 'burst') done = true;
        else if (d.end === 'foxfire') {
          // the fox burns away in blue flame, while the 大 on the slope behind it flares up
          const f = Math.min(1, k / 1.4);
          const blue = Phaser.Display.Color.GetColor(30 * f, 60 * f, 140 * f);
          for (const o of [b, ...d.extra.map((x) => x.s)]) o.setAlpha(1 - f).setTint(blue).setTintMode(Phaser.TintModes.ADD);
          if (Math.random() < dt * 40 * (1 - f)) fx.foxfire(d.x + (Math.random() - 0.5) * 24, d.y + (Math.random() - 0.5) * 30, 1, 2);
          for (let i = 0; i < 3 && k < 1.2; i++) {
            const st = DAIMONJI[Math.floor(Math.random() * DAIMONJI.length)];
            const j = Math.floor(Math.random() * (st.length - 1));
            const q = Math.random();
            const x = st[j][0] + (st[j + 1][0] - st[j][0]) * q;
            const y = s.parallax.screenY(st[j][1] + (st[j + 1][1] - st[j][1]) * q);
            if (y > -10 && y < s.H + 10) fx.light(x, y, 0.5 + Math.random() * 0.5, true, 0xff8a30);
            if (Math.random() < 0.08) fx.spark(x, y);
          }
          done = f >= 1;
        }
        else if (d.end === 'sink') {
          // down into the water, splashing round the edge (the oni the way he rose: his feet stay under the surface)
          const f = Math.min(1, k / 1.5);
          if (d.oni) {
            const vh = Math.max(0, Math.round(60 * (1 - f)));
            b.setCrop(0, 0, 63, vh).setY(d.y + 60 - vh);
          } else b.setAlpha(1 - f).setY(d.y + f * 16);
          if (Math.random() < dt * 18) fx.puff(d.liquid, d.x + (Math.random() - 0.5) * d.r * 2.2, d.y + d.r * 0.5 + f * 10, 0.35);
          done = f >= 1;
        } else if (d.end === 'cool') {
          // the crater goes dark and still, smoke drifting off it
          const f = Math.min(1, k / 1.8);
          b.setTint(Phaser.Display.Color.GetColor(255 - 150 * f, 255 - 160 * f, 255 - 160 * f)).setTintMode(Phaser.TintModes.MULTIPLY).setAlpha(1 - f * f);
          if (Math.random() < dt * 10) fx.smoke(d.x + (Math.random() - 0.5) * d.r * 2, d.y, 1, 2);
          done = f >= 1;
        } else {
          // shatter, crumble, leaves: gone in a blink
          const f = Math.min(1, k / 0.25);
          b.setAlpha(1 - f).setY(d.y + f * 3);
          if (d.end === 'shatter') b.setTint(0xffffff).setTintMode(Phaser.TintModes.ADD);
          done = f >= 1;
        }
      }
      if (done) {
        b.destroy();
        for (const x of d.extra) x.s.destroy();
      } else this.dying[n++] = d;
    }
    this.dying.length = n;
  }

  /**
   * A boss weakening: cracks open on it (two at 2/3 of its life, two more at 1/3), smoke curls from them and,
   * near the end, sparks; bosses and heavies also breathe (a pixel up and down).
   */
  wounds(e, dt) {
    const s = this.scene;
    const breathe = Math.floor(e.age * 1.25) % 2 ? 1 : 0;
    const rec = e.recoil || 0;
    if (e.group?.kind !== 'volcano' && !e.oni) e.setOrigin(0.5, 0.5 + (rec - breathe) / e.height);
    if (e.group?.kind === 'kyubi') return; // (the fox shows its wounds by losing its tails)
    const frac = e.hp / e.maxHp;
    const lvl = frac < 1 / 3 ? 2 : frac < 2 / 3 ? 1 : 0;
    if (!lvl && !e.wounds) return;
    e.wounds ??= [];
    while (e.wounds.length < lvl * 2) e.wounds.push(this.newWound(e));
    const sx = e.flipX ? -1 : 1;
    for (const w of e.wounds) {
      w.setPosition(Math.round(e.x + w.ox * sx), Math.round(e.y + w.oy - rec)).setFlipX(e.flipX !== w.flip).setVisible(e.visible && e.alpha > 0.5);
      w.setAlpha(e.alpha);
    }
    if (e.visible && Math.random() < dt * lvl * 1.6) {
      const w = e.wounds[Math.floor(Math.random() * e.wounds.length)];
      s.fx.smoke(w.x, w.y - 1, 1, 1);
      if (lvl > 1 && Math.random() < 0.5) s.fx.spark(w.x, w.y);
    }
  }

  /** A crack somewhere on the body (a solid spot of the sprite, away from its edge and the other cracks). */
  newWound(e) {
    const tex = this.scene.textures;
    const f = e.frame;
    const h = e.oni ? Math.min(60, f.height) : f.height; // (the oni stands in the pond up to there)
    let ox = 0;
    let oy = 0;
    for (let i = 0; i < 40; i++) {
      const x = 4 + Math.floor(Math.random() * (f.width - 8));
      const y = 4 + Math.floor(Math.random() * (h - 8));
      const near = e.wounds.some((w) => Math.abs(w.ox - (x - f.width / 2)) + Math.abs(w.oy - (y - f.height / 2)) < 12);
      if (!near && [[0, 0], [-3, 0], [3, 0], [0, -3], [0, 3]].every(([dx, dy]) => (tex.getPixelAlpha(x + dx, y + dy, e.texture.key, f.name) ?? 0) > 200)) {
        ox = x - f.width / 2;
        oy = y - f.height / 2;
        break;
      }
    }
    const w = this.woundPool.spawn(`crack_${Math.floor(Math.random() * 3)}`, e.x, e.y, { ox, oy, flip: Math.random() < 0.5 });
    return w;
  }

  remove(e) {
    if (e.group?.kind === 'jaodori') {
      for (const p of e.group.body) this.segPool.kill(p);
      this.segPool.kill(e.group.pearl);
    }
    if (e.wounds) for (const w of e.wounds) this.woundPool.kill(w);
    e.wounds = null;
    if (e.head) this.heads.kill(e.head);
    if (e.kuroko) for (const k of e.kuroko) if (!k.dead && k.master === e) this.pool.kill(k);
    if (e.burnt) for (const bt of e.burnt) if (bt) this.woundPool.kill(bt);
    e.burnt = null;
    if (e.decoys) this.dropDecoys(e);
    if (e.kind === 'yukionna' || (e.group?.kind === 'sankibo' && e.role === 'body')) this.scene.parallax.windTarget = 0; // blizzard / Tengu gale dies down
    if (e.kind === 'yukionna') this.yukiCleanup(e); // her mist, the whiteout, the whirlwind's drag
    if (e.group?.kind === 'kyubi' && e.role === 'body') for (const tl of e.group.tails) this.tailPool.kill(tl);
    if (e === this.heavy) this.heavy = null;
    if (e.oni) e.setCrop(); // pooled: the next enemy must not come out cropped
    e.setOrigin(0.5, 0.5); // (breathing)
    this.pool.kill(e);
  }

  update(dt) {
    const s = this.scene;
    const H = s.H;
    const b = s.bullets;
    this.tele.clear();
    this.updateBossGroup(dt);
    this.updateDying(dt);
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
          if (this.skin.nagasaki) this.hata(e, dt);
          else if (e.path === 'glide') this.glide(e, dt);
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
          else if (e.kind === 'oranda') this.oranda(e, dt, b);
          else if (e.kind === 'heikegani') this.updateHeike(e, dt, b);
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
          if (Math.floor((e.age - dt) * 11) < Math.floor(e.age * 11)) s.fx.smoke(e.x, e.y - 2, 1, 1);
          break;
        case 'geyser':
          this.geyser(e, dt, b);
          break;
        case 'steam': {
          e.y += (22 + (e.vy || 0)) * dt;
          e.x += (Math.sin(e.age * 0.7 + e.x0) * 7 + (e.vx || 0)) * dt;
          const damp = Math.max(0, 1 - 2.6 * dt);
          e.vx = (e.vx || 0) * damp;
          e.vy = (e.vy || 0) * damp;
          let sq = 0;
          if (s.player.alive) {
            const dx = e.x - s.player.x;
            const dy = e.y - s.player.y;
            const d = Math.hypot(dx, dy);
            if (d < 36) {
              const k = 1 - d / 36;
              e.vx += s.player.bank * 55 * k * dt;
              sq = k * 0.65;
              if (Math.random() < dt * 60) {
                for (const side of [-1, 1]) {
                  const bigWisp = Math.random() < 0.6;
                  const frame = bigWisp ? (Math.random() < 0.5 ? 'steam_0' : 'steam_1') : Math.random() < 0.5 ? 'wisp_s_0' : 'wisp_s_1';
                  const w = s.fx.part(s.fx.parts, frame, s.player.x + side * 7, s.player.y + (Math.random() - 0.5) * 6);
                  w.vx = side * (75 + Math.random() * 60);
                  w.vy = 20 + Math.random() * 35;
                  w.drag = 2.2;
                  w.grow = bigWisp ? 0.55 : 1.5;
                  w.life = w.max = 0.45 + Math.random() * 0.15;
                  w.a0 = bigWisp ? 0.65 : 0.9;
                  w.setScale(bigWisp ? 0.5 : 1.1).setTint(0xffd2b8);
                }
              }
            }
          }
          const stretch = Math.min(0.45, Math.abs(e.vx) / 110);
          const sc = 1.3 + Math.sin(e.age * 3) * 0.06;
          e.setFrame(Math.floor(e.age * 1.2) % 2 ? 'steamf_1' : 'steamf_0');
          e.setScale((sc + Math.max(sq, stretch)) / 3, (sc - Math.max(sq, stretch) * 0.55) / 3)
            .setRotation((e.vx / 100) * 0.22)
            .setAlpha(0.8 - sq * 0.75)
            .setTint(0xffd2b8)
            .setTintMode(Phaser.TintModes.MULTIPLY);
          break;
        }
        case 'masu':
          e.x += e.dir * 40 * dt;
          e.y = e.y0 + Math.sin(e.age * 3) * 6;
          e.setRotation(Math.sin(e.age * 5) * 0.2);
          break;
      }
      if (e.dead) continue;
      if (e.recoil > 0) {
        e.recoil *= Math.max(0, 1 - 18 * dt);
        if (e.recoil < 0.04) e.recoil = 0;
        if (!e.ground && e.type !== 'heavy' && e.type !== 'boss') {
          e.setOrigin(0.5, e.recoil > 0 ? 0.5 + e.recoil / e.height : 0.5);
        }
      }
      if (e.type === 'heavy' || e.type === 'boss') this.wounds(e, dt);
      e.flashCool -= dt;
      if (e.flash > 0) {
        e.flash -= dt;
        e.setTint(0x808080).setTintMode(Phaser.TintModes.ADD);
        e.head?.setTint(0x808080).setTintMode(Phaser.TintModes.ADD);
        if (e.segs) for (const sg of e.segs) sg.setTint?.(0x808080).setTintMode(Phaser.TintModes.ADD);
      } else if ((e.type === 'boss' && e.group.enraged && e.group.kind !== 'kyubi') || e.rage) {
        e.setTint(0xffa8a0).setTintMode(Phaser.TintModes.MULTIPLY);
        if (e.segs) for (const sg of e.segs) sg.setTint?.(0xffa8a0).setTintMode(Phaser.TintModes.MULTIPLY);
      } else if (e.tintMode !== Phaser.TintModes.MULTIPLY) {
        e.clearTint();
        e.head?.clearTint();
        if (e.segs) for (const sg of e.segs) sg.clearTint?.();
      }
      if (e.heat && !(e.flash > 0)) {
        e.head?.setTint(Math.floor(e.age * 16) % 2 ? 0xff3a2a : 0xff9a80).setTintMode(Phaser.TintModes.MULTIPLY); // a steam nozzle heating up
        e.hot = true;
      } else if (e.hot && !(e.flash > 0)) {
        e.head?.clearTint();
        e.hot = false;
      }
      const off = e.y > H + 40 || e.y < -70 || e.x < -50 || e.x > VIEW.width + 50;
      if (e.wounds) for (const w of e.wounds) if (e.flash > 0) w.setVisible(false);
      if (off && e.type !== 'boss' && (e.age > 2 || e.y > H)) {
        if (e.flock) e.flock.lost = true; // a bird got away: no flock bonus
        if (e.loot) s.fx.text(Phaser.Math.Clamp(e.x, 40, VIEW.width - 40), 40, 'UKRADZIONE!', 1.4, 0xff8a6a);
        this.remove(e);
      }
    }
    this.pool.sweep();
    this.woundPool.sweep();
    this.heads.sweep();
    this.segPool.sweep();
    this.tailPool.sweep();
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
        if (Math.floor((e.age - dt) * 10) < Math.floor(e.age * 10)) this.scene.fx.smoke(e.x, e.y - 3, 1, 1);
        break;
      case 'imp':
        // hatched: edges towards the player while dropping
        e.y += 36 * dt;
        e.x += Phaser.Math.Clamp(this.scene.player.x - e.x, -28 * dt, 28 * dt);
        break;
      default:
        e.y += 58 * dt;
    }
    if (e.crane) e.setRotation(e.path === 'sine' ? Math.cos(e.age * 2.4) * 0.22 : e.path === 'arc' ? -e.dir * 0.25 : 0);
    if (e.split && Math.floor((e.age - dt) * 10) < Math.floor(e.age * 10)) {
      this.scene.fx.smoke(e.x, e.y - 3, 1, 1);
    }
    if (this.skin === SKINS.okinawa && e.y >= 16) {
      if (!e.leapt) {
        e.leapt = true;
        this.scene.fx.puff('splash', e.x, e.y + 2, 0.38);
        for (const side of [-1, 1]) {
          const p = this.scene.fx.part(this.scene.fx.parts, 'drop_0', e.x + side * 3, e.y + 2);
          p.vx = side * (24 + Math.random() * 18);
          p.vy = -12 + Math.random() * 14;
          p.life = p.max = 0.32;
        }
      } else if (Math.floor((e.age - dt) * 6) < Math.floor(e.age * 6)) {
        const p = this.scene.fx.part(this.scene.fx.parts, 'drop_1', e.x, e.y - 4);
        p.vx = (Math.random() - 0.5) * 12;
        p.vy = 18;
        p.life = p.max = 0.25;
      }
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

  shooter(e, dt, b) {
    if (this.skin.nagasaki) return this.biidoro(e, dt, b);
    if (e.oyster) return this.oysterShooter(e, dt, b);
    if (e.lantern && e.armor > 0) {
      // the ice cracks as it takes hits, the candle flickers inside
      const crack = e.armor > e.maxArmor * 0.6 ? 0 : e.armor > e.maxArmor * 0.25 ? 1 : 2;
      e.setFrame(`tourou_${crack}_${Math.floor(e.age * 7) % 2}`);
      if (e.rotation) e.rotation *= Math.max(0, 1 - 14 * dt);
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
        if (this.skin.diver.spin || e.scoop) e.setRotation(e.ang - DOWN);
        if (e.scoop && this.canFire(e)) this.scene.bullets.fan(e.x, e.y + 6, e.ang, 3, 0.52, slow);
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
      if (this.scene.parallax.nearKind === 'sakura' || this.scene.parallax.nearKind === 'momiji') {
        const px = this.scene.parallax;
        const leaf = px.nearKind === 'momiji' ? 'momiji_' : 'petal_';
        for (const bit of px.bitsLive) {
          const dx = bit.x - e.x;
          const dy = bit.y - e.y;
          if (Math.abs(dx) < 38 && Math.abs(dy) < 38) {
            const d = Math.hypot(dx, dy) || 1;
            if (d < 38) {
              const k = 1 - d / 38;
              bit.vx += (dx >= 0 ? 1 : -1) * 320 * k * dt;
              bit.vy += (dy >= 0 ? 90 : -50) * k * dt;
              bit.flipT = 0.055;
              bit.sway = Math.max(bit.sway, 16);
              bit.setAlpha(0.92);
            }
          }
        }
        // Kyoto only: diving lanterns trail petals (Miyajima's shamoji just part the falling leaves)
        if (px.nearKind === 'sakura' && Math.random() < dt * 28) {
          const nx = -Math.sin(e.ang);
          const ny = Math.cos(e.ang);
          const bx = e.x - Math.cos(e.ang) * 6;
          const by = e.y - Math.sin(e.ang) * 6;
          const side = Math.random() < 0.5 ? -1 : 1;
          const b = px.bit(
            `${leaf}${Math.floor(Math.random() * 4)}`,
            bx + nx * side * 4,
            by + ny * side * 4,
            28 + Math.random() * 26,
            nx * side * (65 + Math.random() * 45),
            px.nearKind === 'momiji' ? 1 : 0,
            14,
            Math.random() * 3,
            0.055,
          );
          b.setAlpha(0.88);
          const s2 = -side;
          const wp = this.scene.fx.part(
            this.scene.fx.parts,
            `${leaf}${Math.floor(Math.random() * 4)}`,
            bx + nx * s2 * 4,
            by + ny * s2 * 4,
          );
          wp.vx = nx * s2 * (70 + Math.random() * 55);
          wp.vy = ny * s2 * (45 + Math.random() * 35) + 18;
          wp.drag = 1.6;
          wp.g = 18;
          wp.spin = s2 * (10 + Math.random() * 6);
          wp.life = wp.max = 0.5 + Math.random() * 0.2;
          wp.a0 = 0.92;
          wp.setScale(1.1);
        }
      }
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
    if (this.skin === SKINS.hiroshima) e.setRotation(Math.sin(e.age * 4) * 0.14);
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
    e.heat = e.pattern === 'puff' && this.canFire(e) && e.timer < 0.55; // a steam nozzle glows red before it fires
    if (this.canFire(e)) {
      e.timer -= dt;
      if (e.timer <= 0) {
        e.timer = e.pattern === 'lob' ? 2.5 : 2.2;
        const mx = e.x + Math.cos(ang) * 6;
        const my = e.y + Math.sin(ang) * 6;
        if (e.pattern === 'lob') b.lob(e.x, e.y - 3, p.x, p.y); // snowman: a snowball where you are now
        else if (e.pattern === 'puff') {
          // steam nozzle: scalding puffs (pink-red, boiling: not the white steam around) that swell, slow down
          // and hang in the air for a while
          for (const d of [-0.38, 0, 0.38]) b.shot('eb_steam_0', mx, my, ang + d, 90, 2, { grow: { r0: 2, r1: 5.5, t: 1.3, drag: 0.7, frames: ['eb_steam_0', 'eb_steam_1'] }, life: 2.8 });
          e.timer = 2.6;
        } else if (e.pattern === 'tide') {
          // Miyajima stone lantern: double Seto tidal wave (tight brisk crest + wider slow undertow)
          b.fan(mx, my, ang, 3, 0.36, normal * 0.92);
          b.fan(mx, my, ang, 4, 0.92, slow * 0.88);
          e.timer = 2.4;
        } else if (e.pattern === 'ring') {
          e.shots++;
          b.ring(mx, my, 10, e.shots * 0.31, slow);
        } else b.fan(mx, my, ang, 5, 0.84, slow);
      }
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
    if (Math.floor((e.fight - dt) * 11) < Math.floor(e.fight * 11)) {
      const fx = this.scene.fx;
      const side = Math.floor(e.fight * 11) % 2 ? 14 : -14;
      const p = fx.part(fx.parts, 'drop_0', e.x + side, e.y + 8);
      p.vx = side * 2.2;
      p.vy = 32;
      p.life = p.max = 0.3;
    }
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

// each city's enemies and bosses live in its own module (src/game/enemies/): their methods join the class here
Object.assign(Enemies.prototype, kyoto, okinawa, sapporo, kagoshima, osaka, beppu, hiroshima, nagasaki);
