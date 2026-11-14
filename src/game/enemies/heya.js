// Random encounter 5 (ex5): the hikikomori's room, a fortress of manga and noodle cups. Methods of Enemies (mixed in
// like the cities').
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * The room (HEYA): life (its monitor takes the hits), where it sits, the phases' thresholds; the manga volumes
 * (speed, how long before they fly open), the noodle cups (flight time), the falling stacks (warning), the lines of
 * chat (bullets across, the gap), the gacha capsules (fall speed, one in how many is gold), the dark of night.
 */
export const HEYA = {
  hp: 2500,
  home: 68,
  phase: [0.66, 0.33],
  manga: { speed: 110, open: 0.75 },
  cup: 1.0,
  stackWarn: 0.85,
  chat: { n: 12, gap: 2, rows: 3, every: 0.7 },
  gacha: { speed: 70, gold: 5 },
  dark: 0.72,
  scale: 1.4,
};

export const heya = {
  /**
   * The room of someone who no longer goes out, and it fights back: towers of manga on one side, a pyramid of
   * noodle cups on the other, the desk and its glowing monitor in the middle (that is what to shoot), a shape in a
   * blanket behind it, only its eyes showing. Three phases:
   * 1. TWIERDZA Z MANG: manga volumes flung out spinning fly open into fans of pages; noodle cups lobbed at the
   *    player splash scalding broth; whole stacks of volumes topple down onto the player (a red outline first);
   * 2. TRYB NOCNY: the lights go off; the screen spits lines of chat that sweep down the screen (a gap in each to
   *    slip through, "www" where it is); cups and volumes between;
   * 3. GACHA: the fortress falls in; it pulls gacha capsule after capsule: they rain down and burst into rings,
   *    the gold one into a star ("SSR!"); the volumes come faster.
   */
  spawnHeya(w, base) {
    const g = { kind: 'heya', state: 'enter', t: 0, stage: 1, phase: 0, timer: 1.2, parts: [], awake: false, defeated: false, act: null, items: [], stacks: [], dark: null, darkA: 0, take: { body: 1 } };
    const body = this.pool.spawn('heya_0', 90, -60, { ...base, role: 'body', group: g, hp: HEYA.hp, maxHp: HEYA.hp, radius: 20 });
    body.setDepth(DEPTH.air - 0.12).setScale(body.base * HEYA.scale); // (the fortress fills the top of the screen)
    g.body = body;
    g.parts.push(body);
    g.maxTotal = HEYA.hp;
    // the dark of night: over the wall, under everything that moves
    g.dark = this.scene.add.rectangle(VIEW.width / 2, this.scene.H / 2, VIEW.width + 4, this.scene.H + 4, 0x04060e, 1).setDepth(DEPTH.mid + 0.5).setAlpha(0);
    this.bossGroup = g;
    return body;
  },

  updateHeya(g, dt) {
    const s = this.scene;
    const e = g.body;
    g.t += dt;
    this.heyaItems(g, dt);
    this.heyaStacks(g, dt);
    // the lights fade off at night, back on (dimly) when the room falls in
    const want = g.stage === 2 ? HEYA.dark : g.stage === 3 ? HEYA.dark * 0.35 : 0;
    g.darkA += (want - g.darkA) * Math.min(1, dt * 2);
    g.dark?.setAlpha(g.darkA);
    if (g.state === 'enter') {
      e.y += Math.max(14, (HEYA.home - e.y) * 1.4) * dt;
      if (e.y >= HEYA.home - 1) {
        e.y = HEYA.home;
        Object.assign(g, { state: 'fight', awake: true, timer: 1 });
        s.fx.text(e.x, e.y + 34, '...', 0.8, 0xd8e8f0);
      }
      return this.heyaPose(g);
    }
    const left = e.hp / e.maxHp;
    if (g.stage === 1 && left < HEYA.phase[0] && !g.act) {
      g.phase = 0;
      this.phaseBreak(g, e.x, e.y, 2, 'TRYB NOCNY');
      s.fx.text(e.x, e.y + 34, 'KLIK.', 0.9, 0xd8e8f0);
    } else if (g.stage === 2 && left < HEYA.phase[1] && !g.act) {
      g.phase = 0;
      this.phaseBreak(g, e.x, e.y, 3, 'GACHA');
      s.cameras.main.shake(500, 0.008);
      s.fx.shards(e.x - 48, e.y + 14, 10, true);
      s.fx.shards(e.x + 48, e.y + 14, 10, true);
    }
    if (g.act) this.heyaAct(g, dt);
    else if ((g.timer -= dt) <= 0 && this.canFire(e)) {
      const plan = [['manga', 'cups', 'stacks', 'manga'], ['chat', 'cups', 'manga', 'chat'], ['gacha', 'manga', 'gacha', 'chat']][g.stage - 1];
      g.act = { kind: plan[g.phase++ % plan.length], t: 0, step: 0 };
    }
    this.heyaPose(g);
  },

  heyaDone(g, rest = 0.8) {
    g.act = null;
    g.timer = rest;
  },

  /** Where on the room the things come from: the manga towers (left), the cups (right), the screen. */
  heyaFrom(g, where) {
    const e = g.body;
    const k = HEYA.scale;
    if (where === 'books') return [e.x + (-34 + Math.random() * 16) * k, e.y + (4 - Math.random() * 14) * k];
    if (where === 'cups') return [e.x + (34 - Math.random() * 10) * k, e.y + (10 - Math.random() * 10) * k];
    return [e.x, e.y + 2 * k];
  },

  heyaAct(g, dt) {
    const s = this.scene;
    const b = s.bullets;
    const a = g.act;
    const pl = s.player;
    const e = g.body;
    a.t += dt;
    switch (a.kind) {
      case 'manga': {
        // volumes flung out one after another, spinning; each flies open into a fan of pages
        const n = g.stage === 3 ? 5 : 3;
        if (a.t > a.step * (g.stage === 3 ? 0.28 : 0.42)) {
          a.step++;
          const [x, y] = this.heyaFrom(g, 'books');
          const ang = Math.atan2(pl.y - y, pl.x - x) + (Math.random() - 0.5) * 0.5;
          const v = HEYA.manga.speed * (g.stage === 3 ? 1.2 : 1);
          this.heyaItem(g, 'manga', x, y, Math.cos(ang) * v, Math.sin(ang) * v, { open: HEYA.manga.open * (0.8 + Math.random() * 0.4) });
          g.throwT = g.t + 0.25;
        }
        if (a.step >= n) this.heyaDone(g, 0.9);
        break;
      }
      case 'cups':
        // noodle cups lobbed at the player and round them: scalding broth where they land
        if (a.t > a.step * 0.35) {
          a.step++;
          const [x, y] = this.heyaFrom(g, 'cups');
          const tx = Phaser.Math.Clamp(a.step === 1 ? pl.x : pl.x + (Math.random() - 0.5) * 90, 10, VIEW.width - 10);
          const ty = Phaser.Math.Clamp(a.step === 1 ? pl.y : pl.y + (Math.random() - 0.5) * 50, s.H * 0.4, s.H - 16);
          this.heyaItem(g, 'cup', x, y, 0, 0, { x0: x, y0: y, tx, ty, time: HEYA.cup });
        }
        if (a.step >= 3) this.heyaDone(g, 1);
        break;
      case 'stacks':
        // whole stacks of volumes topple onto the player (a red outline where, first)
        if (a.t > a.step * 0.45) {
          a.step++;
          const x = Phaser.Math.Clamp(a.step === 1 ? pl.x : pl.x + (Math.random() - 0.5) * 100, 10, VIEW.width - 10);
          const y = Phaser.Math.Clamp(pl.y + (Math.random() - 0.5) * 40, s.H * 0.4, s.H - 22);
          if (e.texture.has('manga_stack')) {
            const spr = this.segPool.spawn('manga_stack', x, -50).setDepth(DEPTH.air + 0.03).setVisible(false);
            g.stacks.push({ spr: spr.setScale(spr.base * 1.2), x, y, t: 0, landed: false });
          }
        }
        if (a.step >= 3) this.heyaDone(g, 1);
        break;
      case 'chat':
        // lines of chat out of the screen sweeping down: a row of shots across, a gap in it ("www" there)
        if (a.t > a.step * HEYA.chat.every) {
          a.step++;
          const C = HEYA.chat;
          const gap = Math.floor(Math.random() * (C.n - C.gap));
          const dx = VIEW.width / C.n;
          for (let i = 0; i < C.n; i++) if (i < gap || i >= gap + C.gap) b.fire(dx * (i + 0.5), e.y + 44, DOWN, slow * 0.85);
          s.fx.text(dx * (gap + C.gap / 2), e.y + 52, 'www', 0.6, 0x9ad8ff);
          g.typeT = g.t + 0.4;
        }
        if (a.step >= HEYA.chat.rows) this.heyaDone(g, 0.9);
        break;
      case 'gacha':
        // it pulls capsules: they pop up out of the room and rain down at the player, bursting into rings
        if (a.t > a.step * 0.32) {
          a.step++;
          const gold = Math.random() * HEYA.gacha.gold < 1;
          const frame = gold ? 'gacha_gold' : ['gacha_r', 'gacha_u', 'gacha_g'][a.step % 3];
          const [x, y] = this.heyaFrom(g, 'screen');
          const tx = Phaser.Math.Clamp(pl.x + (Math.random() - 0.5) * 120, 10, VIEW.width - 10);
          this.heyaItem(g, 'gacha', x, y, (tx - x) * 0.9, -120, { frame, gold, burstY: Phaser.Math.Clamp(pl.y - 40 + Math.random() * 60, s.H * 0.35, s.H - 30) });
          if (a.step === 1) s.fx.text(e.x, e.y + 36, 'GACHA!', 0.8, 0xffe080);
        }
        if (a.step >= 5) this.heyaDone(g, 1);
        break;
      default:
        this.heyaDone(g);
    }
  },

  heyaItem(g, kind, x, y, vx, vy, more) {
    const frame = more.frame ?? (kind === 'manga' ? 'manga_0' : kind === 'cup' ? 'noodle_0' : 'gacha_r');
    if (!g.body.texture.has(frame)) return;
    const spr = this.segPool.spawn(frame, x, y).setDepth(DEPTH.air + 0.04);
    g.items.push({ kind, spr: spr.setScale(spr.base * 1.4), vx, vy, t: 0, ...more });
  },

  /** The volumes, cups and capsules in flight. */
  heyaItems(g, dt) {
    const s = this.scene;
    const b = s.bullets;
    const pl = s.player;
    let n = 0;
    for (const it of g.items) {
      it.t += dt;
      const sp = it.spr;
      let gone = false;
      if (it.kind === 'manga') {
        sp.x += it.vx * dt;
        sp.y += it.vy * dt;
        sp.setFrame(`manga_${Math.floor(it.t * 12) % 3}`);
        if (it.t > it.open) {
          // it flies open: a fan of pages at the player
          sp.setFrame('manga_3');
          if (this.canFire(sp) || sp.y < s.H * 0.7) b.fan(sp.x, sp.y, this.aimAt(sp), 5, 0.9, normal);
          s.fx.text(sp.x, sp.y - 8, 'BAM!', 0.5, 0xffffff);
          gone = true;
        }
      } else if (it.kind === 'cup') {
        // in an arc to where it lands (the spot blinks), then broth
        const k = Math.min(1, it.t / it.time);
        sp.setPosition(it.x0 + (it.tx - it.x0) * k, it.y0 + (it.ty - it.y0) * k - Math.sin(k * Math.PI) * 50);
        sp.setFrame(`noodle_${Math.floor(it.t * 8) % 2}`);
        if (Math.floor(it.t * 10) % 2) {
          this.tele.lineStyle(1, 0xffb050, 0.8);
          this.tele.strokeCircle(it.tx, it.ty, 10);
        }
        if (k >= 1) {
          b.zone(it.tx, it.ty, 13, { warn: 0.05, live: 0.9, kind: 'fire' });
          s.fx.text(it.tx, it.ty - 10, 'ZURU!', 0.5, 0xffd080);
          gone = true;
        }
      } else if (it.kind === 'gacha') {
        // up, then down under gravity; it bursts where it was meant to (once it is coming down)
        it.vy += 260 * dt;
        sp.x += it.vx * dt;
        sp.y += it.vy * dt;
        if (it.vy > 0 && sp.y >= it.burstY) {
          if (it.gold) {
            for (let i = 0; i < 5; i++) b.fan(sp.x, sp.y, (i / 5) * TAU, 3, 0.25, slow);
            s.fx.text(sp.x, sp.y - 10, 'SSR!', 1, 0xffe080);
          } else {
            b.ring(sp.x, sp.y, 9, Math.random() * TAU, slow);
            s.fx.text(sp.x, sp.y - 8, 'PON!', 0.5, 0xffffff);
          }
          s.fx.shards(sp.x, sp.y, 5, true);
          gone = true;
        }
      }
      // what is in flight hurts to touch
      if (!gone && pl.alive && Math.hypot(pl.x - sp.x, pl.y - sp.y) < 7) {
        pl.hit();
        gone = true;
      }
      if (gone || sp.y > s.H + 30 || sp.x < -30 || sp.x > VIEW.width + 30) {
        this.segPool.kill(sp);
        continue;
      }
      g.items[n++] = it;
    }
    g.items.length = n;
  },

  /** A stack of volumes: its red outline first, then it drops and scatters into a ring of volumes. */
  heyaStacks(g, dt) {
    const s = this.scene;
    const pl = s.player;
    let n = 0;
    for (const st of g.stacks) {
      st.t += dt;
      const warn = HEYA.stackWarn;
      if (st.t < warn) {
        if (Math.floor(st.t * 12) % 2) {
          this.tele.lineStyle(1, 0xff5040, 0.8);
          this.tele.strokeRect(st.x - 6, st.y - 20, 12, 40);
        }
      } else if (!st.landed) {
        const k = Math.min(1, (st.t - warn) / 0.22);
        st.spr.setVisible(true).setPosition(st.x, -50 + (st.y + 50) * k * k);
        if (k >= 1) {
          st.landed = true;
          st.left = 0.7;
          s.cameras.main.shake(100, 0.003);
          if (pl.alive && Math.abs(pl.x - st.x) < 6 && Math.abs(pl.y - st.y) < 20) pl.hit();
          s.bullets.ring(st.x, st.y, 8, Math.random() * TAU, slow * 0.9);
          s.fx.text(st.x, st.y - 24, 'DOSA!', 0.6, 0xffffff);
        }
      } else if ((st.left -= dt) <= 0) {
        this.segPool.kill(st.spr);
        continue;
      } else st.spr.setAlpha(Math.min(1, st.left * 2));
      g.stacks[n++] = st;
    }
    g.stacks.length = n;
  },

  /** The room's face: the screen scrolls when it types, goes red when it is hurt, the lights go off, it falls in. */
  heyaPose(g) {
    const e = g.body;
    let frame;
    if (g.stage === 3) frame = 'heya_ruin';
    else if (g.t < (g.hurtT ?? 0) || e.hp < e.maxHp * 0.1) frame = 'heya_angry';
    else if (g.stage === 2) frame = 'heya_night';
    else frame = g.t < (g.typeT ?? 0) || g.t < (g.throwT ?? 0) ? 'heya_1' : 'heya_0';
    if (g.stage === 2 && g.t < (g.typeT ?? 0)) frame = 'heya_1';
    if (e.texture.has(frame) && e.frame.name !== frame) e.setFrame(frame);
    // a little shake now and then, as if something in there were fidgeting
    e.x = 90 + (Math.floor(g.t * 3) % 7 === 0 ? Math.sin(g.t * 60) * 0.6 : 0);
  },

  heyaCleanup(g) {
    for (const it of g.items) this.segPool.kill(it.spr);
    for (const st of g.stacks) this.segPool.kill(st.spr);
    g.items = [];
    g.stacks = [];
    g.dark?.destroy();
    g.dark = null;
  },
};
