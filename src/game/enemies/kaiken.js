// Random encounter 7 (ex7): the press conference. Methods of Enemies (mixed in like the cities'). A nod to the
// behaviour at a famous press conference (the hand cupped to the ear, the wailing, the table banged, the arm waved,
// the train tickets), with no name, no likeness and no office: the boss is an invented man in a suit behind a
// conference table.
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * The man at the table (KAIKEN, a press conference): life, where he sits, how much bigger than drawn he is shown
 * (a big figure: his head alone is 40 px across), the phases' thresholds; how long he holds
 * his hand to his ear, how wide the hush round him is then, and how often a shot comes back; the tickets (how many
 * to a throw, one in how many stamped, how fast they flutter down); the cameras' flashes (seconds between them).
 */
export const KAIKEN = {
  hp: 2400,
  home: 64,
  scale: 1.35,
  phase: [0.66, 0.33],
  deaf: { dur: 1.6, r: 64, dy: 24, echo: 0.06 },
  tickets: { n: 9, stamped: 5, fall: 55 },
  flash: [0.5, 1.6],
};

// where the parts sit, in logical px from the man (his frame's centre), and how deep (from DEPTH.air)
const LAYOUT = {
  table: [0, 61, -0.14],
  puddle: [-4, 58.7, -0.135],
  tissues: [46, 46, -0.13],
  mics: [0, 27, -0.08, 1.2],
  glass: [-57, 42, -0.08, 1.2],
};
const MAN = -0.1;
const TEAR = 0x9ad8ff;
// his eyes, his mouth and his waving hand, from his frame's centre
const at = (x, y) => [x * KAIKEN.scale, y * KAIKEN.scale];
const EYES = [at(-6, -14), at(6, -14)];
const MOUTH = at(0, -4);
const HAND = { kk_wave0: at(43, -15), kk_wave1: at(35, -26), kk_wave2: at(22, -26), kk_throw1: at(43, -17) };

export const kaiken = {
  /**
   * A man in a suit behind a conference table, a bunch of microphones in front of him, sniffling. Three phases:
   * 1. HA? NANI?: he mumbles answers at the player (fans); now and then he cups a hand to his ear and hears
   *    nothing: a hush falls round the table (drawn: rings of sound stopping short of him), no shot hurts him
   *    and some come back as echoes ("HA?"); a sniffle sends a few tears flying;
   * 2. UAAA!: he wails: sobs of tears out of both eyes in arcs, the table banged with both fists (a ring, the
   *    screen shakes, the microphones and the glass jump), an arm waved about (a sweeping stream);
   * 3. ZMIENIĘ ŚWIAT!: he throws his train tickets about, numbered up and up; one in five is stamped for a day
   *    no train ran, and bursts.
   * It shows on him: tears pool on the tablecloth and run off its front, used tissues pile up, the press's cameras
   * flash; beaten, he slumps with his forehead on the table.
   */
  spawnKaiken(w, base) {
    const g = { kind: 'kaiken', state: 'enter', t: 0, stage: 1, phase: 0, timer: 1.2, parts: [], awake: false, defeated: false, act: null, items: [], flashes: [], deco: {}, tickets: 0, deafT: 0, hop: 0, wipes: 0, flashAt: 1.5, take: { body: 1 } };
    const body = this.pool.spawn('kk_idle0', VIEW.width / 2, -60, { ...base, role: 'body', group: g, hp: KAIKEN.hp, maxHp: KAIKEN.hp, radius: 22, flashTint: 0x303030 });
    body.setDepth(DEPTH.air + MAN).setScale(body.base * KAIKEN.scale);
    g.body = body;
    g.parts.push(body);
    g.maxTotal = KAIKEN.hp;
    for (const [k, frame] of [['table', 'kk_table'], ['mics', 'kk_mics_0'], ['glass', 'kk_glass']]) {
      this.kaikenDeco(g, k, frame);
    }
    this.kaikenParts(g);
    this.bossGroup = g;
    return body;
  },

  /** A part that turns up during the fight (the pool of tears, the tissues): shown at this frame from now on. */
  kaikenDeco(g, k, frame) {
    const e = g.body;
    if (!e.texture.has(frame)) return;
    if (g.deco[k]) {
      if (g.deco[k].frame.name !== frame) g.deco[k].setFrame(frame);
    } else {
      const sp = (g.deco[k] = this.segPool.spawn(frame, e.x, e.y).setDepth(DEPTH.air + LAYOUT[k][2]));
      sp.setScale(sp.base * (LAYOUT[k][3] ?? 1));
    }
  },

  /** The table and what stands on it, kept with him; what a fist on the table threw into the air comes down. */
  kaikenParts(g) {
    const e = g.body;
    const d = g.deco;
    const x = VIEW.width / 2; // (the table does not shake with his sobs)
    const hop = g.hop > 0 ? Math.sin(g.hop * Math.PI) : 0;
    for (const k of Object.keys(d)) d[k].setPosition(x + LAYOUT[k][0], e.y + LAYOUT[k][1]);
    if (d.mics) {
      d.mics.y -= hop * 5;
      const frame = g.hop > 0.25 ? 'kk_mics_1' : 'kk_mics_0';
      if (d.mics.frame.name !== frame) d.mics.setFrame(frame);
    }
    if (d.glass) {
      d.glass.y -= hop * 8;
      d.glass.setRotation(hop * 0.35);
    }
  },

  updateKaiken(g, dt) {
    const s = this.scene;
    const e = g.body;
    g.t += dt;
    g.hop = Math.max(0, g.hop - dt * 2.6);
    this.kaikenItems(g, dt);
    this.kaikenFlashes(g, dt);
    g.deafT = Math.max(0, g.deafT - dt);
    g.take.body = g.deafT > 0 ? 0 : 1;
    if (g.state === 'enter') {
      e.y += Math.max(14, (KAIKEN.home - e.y) * 1.4) * dt;
      if (e.y >= KAIKEN.home - 1) {
        e.y = KAIKEN.home;
        Object.assign(g, { state: 'fight', awake: true, timer: 1 });
        this.kaikenSay(g, '*SNIFF*', 0.8, TEAR);
      }
      this.kaikenParts(g);
      return this.kaikenPose(g);
    }
    const left = e.hp / e.maxHp;
    if (g.stage === 1 && left < KAIKEN.phase[0] && !g.act) {
      g.phase = 0;
      g.deafT = 0;
      this.phaseBreak(g, e.x, e.y, 2, 'UAAA!');
      this.kaikenDeco(g, 'puddle', 'kk_puddle_1');
      this.kaikenBurst(g, 6);
    } else if (g.stage === 2 && left < KAIKEN.phase[1] && !g.act) {
      g.phase = 0;
      this.phaseBreak(g, e.x, e.y, 3, 'ZMIENIĘ ŚWIAT!');
      this.kaikenDeco(g, 'puddle', 'kk_puddle_2');
      this.kaikenBurst(g, 8);
    }
    if (g.act) this.kaikenAct(g, dt);
    else if ((g.timer -= dt) <= 0 && this.canFire(e)) {
      const plan = [['answers', 'ear', 'answers', 'sniffle'], ['sob', 'bang', 'wave', 'sob'], ['tickets', 'bang', 'tickets', 'wave', 'sob']][g.stage - 1];
      g.act = { kind: plan[g.phase++ % plan.length], t: 0, step: 0 };
    }
    // a sob shakes him now and then
    e.x = VIEW.width / 2 + (g.stage >= 2 ? Math.round(Math.sin(g.t * 30)) * (Math.sin(g.t * 2) > 0.6 ? 1 : 0) : 0);
    this.kaikenTears(g, dt);
    this.kaikenHush(g);
    this.kaikenParts(g);
    this.kaikenPose(g);
  },

  kaikenDone(g, rest = 0.9) {
    g.act = null;
    g.timer = rest;
    // between two outbursts, a tissue to the nose; the used ones pile up by the box
    if (g.stage >= 2 && rest >= 0.8 && g.wipes < 6 && Math.random() < 0.6) {
      g.wipeT = g.t + Math.min(0.7, rest);
      g.wipes++;
      this.kaikenDeco(g, 'tissues', `kk_tissues_${Math.min(3, Math.ceil(g.wipes / 2))}`);
    }
  },

  /** What he says, over his head (under the life bar). */
  kaikenSay(g, str, life = 0.8, tint = 0xffffff, dx = 0) {
    const e = g.body;
    this.scene.fx.text(e.x + dx, Math.max(22, e.y - 44), str, life, tint);
  },

  /** His eyes, on the screen. */
  kaikenEyes(g) {
    const e = g.body;
    const low = e.frame.name === 'kk_sob1' || e.frame.name === 'kk_bang1' ? 4 : 0;
    return EYES.map(([x, y]) => [e.x + x, e.y + y + low]);
  },

  kaikenAct(g, dt) {
    const s = this.scene;
    const b = s.bullets;
    const a = g.act;
    const pl = s.player;
    const e = g.body;
    a.t += dt;
    switch (a.kind) {
      case 'answers':
        // a fan of answers, three times; none of them answers anything
        if (a.t > a.step * 0.6) {
          a.step++;
          g.talkT = g.t + 0.28;
          b.fan(e.x + MOUTH[0], e.y + MOUTH[1], this.aimAt(e, ...MOUTH), 5, 0.9, normal);
          if (a.step === 2) this.kaikenSay(g, ['...', 'IE...', 'TO...'][Math.floor(Math.random() * 3)], 0.7, 0xd8e8f0);
        }
        if (a.step >= 3) this.kaikenDone(g, 0.8);
        break;
      case 'ear':
        // the hand to the ear: he hears nothing, and some shots come back
        if (a.step === 0) {
          a.step = 1;
          g.deafT = KAIKEN.deaf.dur;
          this.kaikenSay(g, ['HA?', 'NANI?', 'HAA?'][Math.floor(Math.random() * 3)], 1, 0xffe080, -46);
          this.kaikenBurst(g, 2);
        }
        if (a.t > KAIKEN.deaf.dur) this.kaikenDone(g, 0.6);
        break;
      case 'sniffle':
        // a sniffle: a few tears shaken off, either side
        if (a.step < 2 && a.t > 0.3 + a.step * 0.45) {
          a.step++;
          g.cryT = g.t + 0.3;
          for (const [i, [x, y]] of this.kaikenEyes(g).entries()) {
            const out = i ? 1 : -1;
            for (let k = 0; k < 3; k++) b.fire(x, y, DOWN + out * (0.3 + k * 0.3), slow * (0.9 + k * 0.08));
          }
        }
        if (a.t > 1.3) this.kaikenDone(g, 0.7);
        break;
      case 'sob': {
        // sobs: arcs of tears out of both eyes, in bursts, as he gulps for breath
        const n = g.stage === 3 ? 3 : 4;
        if (a.step < n && a.t > 0.2 + a.step * 0.5) {
          a.step++;
          g.cryT = g.t + 0.32;
          for (const [i, [x, y]] of this.kaikenEyes(g).entries()) {
            const out = i ? 1 : -1;
            for (let k = 0; k < 4; k++) b.fire(x, y, DOWN + out * (0.25 + k * 0.22) + (Math.random() - 0.5) * 0.08, slow * (0.9 + k * 0.1));
          }
          if (a.step % 2) this.kaikenSay(g, a.step === 1 ? 'UAAA...' : 'UAAAAA!', 0.8, TEAR, (Math.random() - 0.5) * 30);
        }
        if (a.t > 0.2 + n * 0.5) this.kaikenDone(g, 0.8);
        break;
      }
      case 'bang':
        // both fists up... and down on the table: a ring, the screen shakes, everything on the table jumps
        if (a.step === 0 && a.t > 0.55) {
          a.step = 1;
          g.hop = 1;
          const ty = e.y + LAYOUT.table[1] - 6;
          b.ring(e.x, ty, 16, Math.random() * TAU, normal);
          b.ring(e.x, ty, 8, Math.random() * TAU, slow);
          s.cameras.main.shake(250, 0.008);
          s.fx.text(e.x, ty + 30, 'DON!', 1, 0xffffff);
          s.fx.shockwave(e.x, ty);
          // the pool of tears splashes up
          for (let k = 0; k < 10; k++) {
            const p = s.fx.part(s.fx.parts, 'drop_0', e.x + (Math.random() - 0.5) * 70, ty, { vx: (Math.random() - 0.5) * 70, vy: -50 - Math.random() * 50, g: 260, drag: 0.4, life: 0.5 + Math.random() * 0.2 });
            p.setTint(TEAR);
          }
          this.kaikenBurst(g, 3);
        }
        if (a.t > 1.35) this.kaikenDone(g, 0.8);
        break;
      case 'wave': {
        // an arm flung about: a stream of shots swept back and forth, from the hand
        const k = Math.sin(a.t * 3.2);
        a.frame = k > 0.33 ? 'kk_wave0' : k < -0.33 ? 'kk_wave2' : 'kk_wave1';
        if (a.t > a.step * 0.07) {
          a.step++;
          const [hx, hy] = HAND[a.frame];
          b.fire(e.x + hx, e.y + hy, DOWN + k * 0.9, normal);
        }
        if (a.t > 2) this.kaikenDone(g, 0.9);
        break;
      }
      case 'tickets':
        // the tickets, numbered up and up, fluttering down; the stamped ones burst
        if (a.t > 0.35 + a.step * 0.18) {
          a.step++;
          g.tickets++;
          const stamped = g.tickets % KAIKEN.tickets.stamped === 0;
          const tx = Phaser.Math.Clamp(pl.x + (Math.random() - 0.5) * 150, 10, VIEW.width - 10);
          this.kaikenTicket(g, e.x + HAND.kk_throw1[0], e.y + HAND.kk_throw1[1], tx, stamped);
          if (a.step === 1 || stamped) this.kaikenSay(g, `#${Math.min(195, g.tickets)}`, 0.7, stamped ? 0xff8a6a : 0xffffff, (Math.random() - 0.5) * 40);
        }
        if (a.step >= KAIKEN.tickets.n) this.kaikenDone(g, 1);
        break;
      default:
        this.kaikenDone(g);
    }
  },

  kaikenTicket(g, x, y, tx, stamped) {
    const frame = stamped ? 'ticket_x' : 'ticket_0';
    if (!g.body.texture.has(frame)) return;
    const spr = this.segPool.spawn(frame, x, y).setDepth(DEPTH.air + 0.04);
    g.items.push({ spr, stamped, vx: (tx - x) * 1.2, vy: -60, t: 0, burstY: this.scene.H * (0.45 + Math.random() * 0.3), ph: Math.random() * TAU });
  },

  /** The tickets: thrown up, then fluttering down side to side; the stamped ones burst into a ring. */
  kaikenItems(g, dt) {
    const s = this.scene;
    const pl = s.player;
    let n = 0;
    for (const it of g.items) {
      it.t += dt;
      const sp = it.spr;
      it.vx *= Math.max(0, 1 - dt * 1.5);
      it.vy = Math.min(KAIKEN.tickets.fall, it.vy + 160 * dt);
      sp.x += (it.vx + Math.sin(it.t * 4 + it.ph) * 40) * dt;
      sp.y += it.vy * dt;
      // turning over as it falls: flat, tipped, edge on, tipped (the stamped ones stay flat: the cross must be read)
      if (!it.stamped) sp.setFrame(['ticket_0', 'ticket_1', 'ticket_2', 'ticket_1'][Math.floor(it.t * 7 + it.ph) % 4]);
      else sp.setRotation(Math.sin(it.t * 4 + it.ph) * 0.25);
      let gone = false;
      if (it.stamped && it.vy > 0 && sp.y > it.burstY) {
        s.bullets.ring(sp.x, sp.y, 10, Math.random() * TAU, slow);
        s.fx.text(sp.x, sp.y - 10, 'UNKYŪ!', 0.6, 0xff8a6a);
        gone = true;
      } else if (pl.alive && Math.abs(pl.x - sp.x) < 7 && Math.abs(pl.y - sp.y) < 5) {
        pl.hit();
        gone = true;
      }
      if (gone || sp.y > s.H + 20) {
        sp.setRotation(0);
        this.segPool.kill(sp);
        continue;
      }
      g.items[n++] = it;
    }
    g.items.length = n;
  },

  /** Tears flying off his face while he cries (only to look at: the ones that hurt are bullets). */
  kaikenTears(g, dt) {
    const fx = this.scene.fx;
    const wail = g.t < (g.cryT ?? 0) || g.gate > 0;
    const rate = wail ? 26 : g.stage >= 2 ? 5 : 0;
    if (!rate || Math.random() > dt * rate) return;
    const eyes = this.kaikenEyes(g);
    const i = Math.random() < 0.5 ? 0 : 1;
    const out = i ? 1 : -1;
    const p = fx.part(fx.parts, 'drop_0', eyes[i][0] + out * 3, eyes[i][1], { vx: out * (20 + Math.random() * (wail ? 60 : 25)), vy: -20 - Math.random() * (wail ? 50 : 20), g: 240, drag: 0.3, life: 0.45 + Math.random() * 0.25, a0: 0.9 });
    p.setTint(TEAR);
  },

  /** A burst of the press's cameras: n flashes, one after another. */
  kaikenBurst(g, n) {
    for (let k = 0; k < n; k++) g.flashes.push({ wait: k * 0.07 + Math.random() * 0.05, t: 0, spr: null });
  },

  /** The cameras' flashes: at the edges of the screen, low, where the press sits (never where bullets are read). */
  kaikenFlashes(g, dt) {
    const s = this.scene;
    if (g.state === 'fight' && (g.flashAt -= dt) <= 0) {
      g.flashAt = KAIKEN.flash[0] + Math.random() * (KAIKEN.flash[1] - KAIKEN.flash[0]);
      this.kaikenBurst(g, 1);
    }
    let n = 0;
    for (const f of g.flashes) {
      if (f.wait > 0) {
        f.wait -= dt;
        g.flashes[n++] = f;
        continue;
      }
      if (!f.spr) {
        if (!g.body.texture.has('kk_flash_0')) continue;
        const side = Math.random() < 0.5 ? -1 : 1;
        const x = VIEW.width / 2 + side * (VIEW.width / 2 - 3 - Math.random() * 10);
        f.spr = this.segPool.spawn('kk_flash_0', x, s.H * (0.5 + Math.random() * 0.48)).setDepth(DEPTH.air - 0.2).setBlendMode(Phaser.BlendModes.ADD);
        f.spr.setScale(f.spr.base * (0.7 + Math.random() * 0.5)).setRotation(Math.random() * 0.5);
      }
      f.t += dt;
      if (f.t > 0.06 && f.spr.frame.name !== 'kk_flash_1') f.spr.setFrame('kk_flash_1');
      if (f.t > 0.14) {
        f.spr.setRotation(0);
        this.segPool.kill(f.spr);
        continue;
      }
      g.flashes[n++] = f;
    }
    g.flashes.length = n;
  },

  /**
   * The hush while his hand is at his ear, drawn so it can be read: an arc in front of the table that the shots stop
   * at, and rings of sound closing in on his ear without reaching it.
   */
  kaikenHush(g) {
    if (g.deafT <= 0) return;
    const e = g.body;
    const ink = this.tele;
    const k = Math.min(1, g.deafT / 0.25, (KAIKEN.deaf.dur - g.deafT) / 0.15); // in and out
    const r = KAIKEN.deaf.r;
    const cy = e.y + KAIKEN.deaf.dy;
    ink.lineStyle(2, 0xffe080, 0.75 * k).beginPath().arc(e.x, cy, r, 0.08 * Math.PI, 0.92 * Math.PI).strokePath();
    ink.lineStyle(1, 0xffffff, 0.35 * k).beginPath().arc(e.x, cy, r + 3, 0.12 * Math.PI, 0.88 * Math.PI).strokePath();
    // dashes running along the arc
    for (let i = 0; i < 9; i++) {
      const a = 0.1 * Math.PI + ((i / 9 + g.t * 0.25) % 1) * 0.8 * Math.PI;
      ink.fillStyle(0xffe080, 0.9 * k).fillRect(Math.round(e.x + Math.cos(a) * (r - 4)) - 1, Math.round(cy + Math.sin(a) * (r - 4)) - 1, 2, 2);
    }
    // the sound that does not get through: arcs closing in on the cupped hand, fading before they reach it
    const ex = e.x - 42;
    const ey = e.y - 12;
    for (let i = 0; i < 3; i++) {
      const q = (g.t * 1.4 + i / 3) % 1;
      ink.lineStyle(1.5, 0xffe080, (1 - q) * 0.9 * k).beginPath().arc(ex, ey, 22 - q * 14, 0.75 * Math.PI, 1.25 * Math.PI).strokePath();
    }
  },

  /** While his hand is at his ear the player's shots stop at the hush, and now and then one comes back as an echo. */
  kaikenDeaf(shot) {
    const g = this.bossGroup;
    if (!g || g.kind !== 'kaiken' || g.defeated || g.deafT <= 0) return false;
    const e = g.body;
    if (shot.y < e.y + KAIKEN.deaf.dy || Math.hypot(shot.x - e.x, shot.y - e.y - KAIKEN.deaf.dy) > KAIKEN.deaf.r) return false;
    // it glances off, to one side
    const fx = this.scene.fx;
    const out = shot.x < e.x ? -1 : 1;
    const p = fx.part(fx.parts, 'dot_1', shot.x, shot.y, { vx: out * (50 + Math.random() * 50), vy: 40 + Math.random() * 40, drag: 1.5, life: 0.3, a0: 0.9 });
    p.setTint(0xffe080);
    if (Math.random() < KAIKEN.deaf.echo && this.canFire(e)) this.scene.bullets.fire(shot.x, shot.y + 4, this.aimAt({ x: shot.x, y: shot.y }), slow);
    return true;
  },

  kaikenPose(g) {
    const e = g.body;
    const a = g.act;
    const t = g.t;
    let frame;
    if (g.gate > 0 && g.stage >= 2) frame = Math.floor(t * 12) % 2 ? 'kk_sob2' : 'kk_sob3'; // the break: he howls, shaking his head
    else if (a?.kind === 'ear') frame = a.t < 0.18 ? 'kk_ear0' : Math.floor(a.t * 2.5) % 2 ? 'kk_ear2' : 'kk_ear1';
    else if (a?.kind === 'bang') frame = a.step === 0 ? 'kk_bang0' : a.t < 1 ? 'kk_bang1' : 'kk_sob1';
    else if (a?.kind === 'wave') frame = a.frame ?? 'kk_wave1';
    else if (a?.kind === 'tickets') frame = a.t < 0.35 || (a.t - 0.35) % 0.18 > 0.09 ? 'kk_throw0' : 'kk_throw1';
    else if (a?.kind === 'sob') {
      const q = (a.t - 0.2) % 0.5; // a gulp of breath, the wail, the head shaken
      frame = a.t < 0.2 || q > 0.4 ? 'kk_sob0' : q < 0.2 ? 'kk_sob1' : Math.floor(t * 14) % 2 ? 'kk_sob2' : 'kk_sob3';
    } else if (a?.kind === 'sniffle') frame = t < (g.cryT ?? 0) ? 'kk_sob0' : 'kk_sniff';
    else if (t < (g.talkT ?? 0)) frame = 'kk_talk';
    else if (t < (g.wipeT ?? 0)) frame = Math.floor(t * 5) % 2 ? 'kk_wipe1' : 'kk_wipe0';
    else if (g.stage >= 2) frame = Math.floor(t * 2.2) % 2 ? 'kk_sob0' : 'kk_sniff'; // still crying between outbursts
    else frame = t % 3.3 < 0.12 ? 'kk_blink' : t % 5.1 > 4.6 ? 'kk_sniff' : Math.floor(t * 1.6) % 2 ? 'kk_idle1' : 'kk_idle0';
    // (a fist raised jitters)
    if (frame === 'kk_bang0') e.x += Math.round(Math.sin(t * 50));
    if (e.texture.has(frame) && e.frame.name !== frame) e.setFrame(frame);
  },

  kaikenCleanup(g) {
    const s = this.scene;
    const won = g.body && g.body.hp <= 0;
    for (const it of g.items) {
      it.spr.setRotation(0);
      this.segPool.kill(it.spr);
    }
    for (const f of g.flashes) {
      if (!f.spr) continue;
      f.spr.setRotation(0);
      this.segPool.kill(f.spr);
    }
    // the table stays while he slumps on to it (the end 'weep' in Enemies.updateDying), then it all fades
    const stay = Object.values(g.deco).filter(Boolean);
    if (g.deco.glass) g.deco.glass.setRotation(0);
    if (won && stay.length) {
      this.kaikenDeco(g, 'puddle', 'kk_puddle_2');
      g.deco.mics?.setFrame('kk_mics_1').setDepth(DEPTH.air + MAN - 0.01); // knocked apart, his head down among them
      if (g.deco.glass?.texture.has('kk_glass_dry')) g.deco.glass.setFrame('kk_glass_dry');
      const all = Object.values(g.deco);
      s.tweens.add({ targets: all, alpha: 0, delay: 2500, duration: 700, onComplete: () => all.forEach((sp) => this.segPool.kill(sp)) });
    } else for (const sp of stay) this.segPool.kill(sp);
    g.items = [];
    g.flashes = [];
    g.deco = {};
  },
};
