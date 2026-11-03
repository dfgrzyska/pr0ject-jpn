// The debug panel, switched on and off from the title screen, the pause screen or the G key, kept in the
// browser: the frame rate and frame times with a graph of the last frames, where a frame's time goes on
// average (the game's logic and its parts, drawing, Phaser's own work), the hitches (frames over HITCH ms)
// since the stage began with what was going on just before each one, a few counts, and how far the other
// cities' backgrounds have come in (they load while you play). It only watches: nothing in the game changes
// with it on.
import { DEPTH, VIEW } from '../config.js';
import { getLang } from '../i18n.js';
import { pixelText } from './Hud.js';

const KEY = 'shmupjp.debug';
// ms between two frames that counts as a hitch: a frame lost at 60 Hz (33 ms), not one a 120 Hz screen showed a
// tick late (25 ms). The time is the real one between frames (the game loop's raw delta): what Phaser hands the
// scenes is the average of the last ten, which smears one long stall over several frames.
const HITCH = 30;
const SLOW = 6; // ms a part of the frame may take before it is named as the cause
// The probe: a timer every few ms while the panel is on. The longest it went without firing between two frames
// tells whether the page's thread was held up then (by anything: the browser tidying memory, its own work) or
// free, the frame coming late from the screen's side. Over HELD ms counts as held.
const PROBE = 4;
const HELD = 25;
const N = 90; // frames in the graph
const X = 2;
const Y = 40;
const PITCH = 11;
const LINES = 13;

const WORDS = {
  pl: { hitches: 'PRZYCIĘCIA', bg: 'TŁO', enemies: 'WROGOWIE', bullets: 'POCISKI', render: 'RYSOWANIE', music: 'MUZYKA', paused: 'PAUZA', tex: 'TEKSTURA', foes: 'WROGÓW', scene: 'SCENA', cities: 'MIASTA', sound: 'DŹWIĘK', logic: 'LOGIKA', draw: 'RYS', en: 'WRG', bu: 'POC', mu: 'MUZ', pre: 'PHASER', ph: 'PH', rest: 'RESZTA', busy: 'ZAJĘTY', free: 'WOLNY', txt: 'TXT', probe: 'SONDA' },
  en: { hitches: 'HITCHES', bg: 'BG', enemies: 'ENEMIES', bullets: 'BULLETS', render: 'RENDER', music: 'MUSIC', paused: 'PAUSE', tex: 'TEXTURE', foes: 'ENEMIES', scene: 'SCENE', cities: 'CITIES', sound: 'AUDIO', logic: 'LOGIC', draw: 'DRAW', en: 'ENM', bu: 'BUL', mu: 'MUS', pre: 'PHASER', ph: 'PH', rest: 'REST', busy: 'BUSY', free: 'FREE', txt: 'TXT', probe: 'PROBE' },
};

// the other cities' backgrounds: counted over the whole game (the Stage scene starts over every stage)
const textures = { done: 0, recent: 0, hooked: false };
// sound sources started and not yet ended (music notes and effects): they should come and go
const audio = { live: 0 };

export class Debug {
  constructor(scene) {
    this.scene = scene;
    try {
      this.on = localStorage.getItem(KEY) === 'on';
    } catch {
      this.on = false;
    }
    this.times = new Float32Array(N);
    this.next = 0;
    // ms each part took in the frame being made; pre = Phaser's own work in it before the scene's update
    this.cur = { bg: 0, enemies: 0, bullets: 0, render: 0, logic: 0, music: 0, pre: 0 };
    this.musicMax = 0; // the longest music scheduling this second, and the last second's
    this.musicPeak = 0;
    this.musicInDraw = 0; // music scheduled after the drawing (it runs on the same event: not the drawing's time)
    this.acc = { ...this.cur }; // summed over the second, for the averages
    this.mean = { ...this.cur };
    this.frameT = 0;
    this.stepT = 0;
    this.probe = { id: 0, last: 0, gap: 0 };
    this.held = 0; // the probe's longest wait between the last frame's start and this one's
    this.heldAvg = 0;
    this.texted = false; // the words were changed in the frame just made
    this.resetCounts();
    this.wasQuiet = false;
    this.sec = { t: 0, n: 0, sum: 0, max: 0, held: 0 };
    this.fps = 0;
    this.avg = 0;
    this.max = 0;
    this.textT = 0;
    this.wrapped = false;
    this.bg = scene.add.rectangle(X - 1, Y - 2, VIEW.width - 2 * X, 17 + LINES * PITCH + 6, 0x0b0a12, 0.6).setOrigin(0, 0).setDepth(DEPTH.overlay + 4);
    this.graph = scene.add.graphics().setDepth(DEPTH.overlay + 5);
    this.lines = Array.from({ length: LINES }, () => pixelText(scene, X + 1, 0, '', 0).setDepth(DEPTH.overlay + 5));
    this.lines.forEach((l, i) => (l.y = i === 0 ? Y : Y + 17 + i * PITCH));
    this.shown = this.lines.map(() => '');
    this.hookTextures();
    const ge = scene.game.events;
    this.onStep = () => {
      // a frame begins: the probe's wait since the last one began (still waiting counts: the timer may fire after us),
      // never more than the time between the frames (a hidden page stops both: Phaser starts its count anew then)
      const now = performance.now();
      const p = this.probe;
      this.held = Math.min(Math.max(p.gap, now - p.last), scene.game.loop.rawDelta + 2);
      p.gap = 0;
      p.last = now;
      this.stepT = now;
    };
    this.onPre = () => {
      // everything since the scene's update began is the logic; drawing starts now
      this.renderT = performance.now();
      this.musicInDraw = 0;
      if (this.on && this.frameT) this.cur.logic += this.renderT - this.frameT;
    };
    this.onPost = () => this.on && (this.cur.render += performance.now() - this.renderT - this.musicInDraw);
    ge.on('prestep', this.onStep);
    ge.on('prerender', this.onPre);
    ge.on('postrender', this.onPost);
    scene.events.once('shutdown', () => {
      ge.off('prestep', this.onStep);
      ge.off('prerender', this.onPre);
      ge.off('postrender', this.onPost);
      this.stopProbe();
    });
    if (this.on) {
      this.wrap();
      this.startProbe();
    }
    this.show();
  }

  resetCounts() {
    this.hitches = 0;
    this.quiet = 0; // hitches while not playing (paused, between stages): the phone may run the screen slower then
    this.busy = 0; // hitches with the page's thread held up, with it free, and right after the words changed
    this.free = 0;
    this.afterText = 0;
    this.log = []; // the last hitches: [stage time, ms, causes]
  }

  toggle() {
    this.on = !this.on;
    try {
      localStorage.setItem(KEY, this.on ? 'on' : 'off');
    } catch {
      /* ignore */
    }
    if (this.on) {
      this.wrap();
      for (const k in this.cur) this.cur[k] = 0;
      this.resetCounts();
      this.times.fill(0);
      this.startProbe();
    } else this.stopProbe();
    this.show();
  }

  show() {
    for (const o of [this.bg, this.graph, ...this.lines]) o.setVisible(this.on);
  }

  startProbe() {
    const p = this.probe;
    if (p.id) return;
    p.last = performance.now();
    p.gap = 0;
    p.id = setInterval(() => {
      const t = performance.now();
      p.gap = Math.max(p.gap, t - p.last);
      p.last = t;
    }, PROBE);
  }

  stopProbe() {
    clearInterval(this.probe.id);
    this.probe.id = 0;
  }

  /** Time the parts of the frame: the moving background, the enemies, the bullets (the game's own calls). */
  wrap() {
    if (this.wrapped) return;
    this.wrapped = true;
    const s = this.scene;
    const timed = (obj, name, key) => {
      const f = obj[name].bind(obj);
      obj[name] = (...a) => {
        const t0 = performance.now();
        const r = f(...a);
        this.cur[key] += performance.now() - t0;
        return r;
      };
    };
    timed(s.parallax.props, 'update', 'bg');
    timed(s.enemies, 'update', 'enemies');
    timed(s.bullets, 'update', 'bullets');
    // the music's scheduling (after each frame is drawn, or from its timer between frames)
    const m = s.music;
    // and every sound source started, until it ends (the audio engine's state shows beside the count)
    const ctx = m?.ctx;
    if (ctx && !ctx.counted) {
      ctx.counted = true;
      for (const k of ['createOscillator', 'createBufferSource']) {
        const make = ctx[k].bind(ctx);
        ctx[k] = (...a) => {
          const node = make(...a);
          audio.live++;
          node.addEventListener('ended', () => audio.live--);
          return node;
        };
      }
    }
    if (m?.tick && !m.timed) {
      m.timed = true;
      const tick = m.tick.bind(m);
      m.tick = () => {
        const t0 = performance.now();
        tick();
        const d = performance.now() - t0;
        const dbg = s.sys.isActive() ? s.debug : null; // (the music outlives the stage: time it for the one on)
        if (!dbg?.on) return;
        dbg.cur.music += d;
        dbg.musicInDraw += d;
        dbg.musicMax = Math.max(dbg.musicMax, d);
      };
    }
  }

  /** The other cities' backgrounds arriving: Boot's loader keeps going while you play. */
  hookTextures() {
    if (textures.hooked) return;
    const boot = this.scene.scene.get('Boot');
    if (!boot) return;
    textures.hooked = true;
    boot.load.on('filecomplete', (key) => {
      if (!/^(far|mid|props)_/.test(key)) return;
      textures.done++;
      textures.recent++;
    });
  }

  /** Each frame, first thing in the scene's update: delta = real ms since the last one. */
  frame(delta) {
    const tex = textures.recent;
    textures.recent = 0;
    if (!this.on) return;
    const now = performance.now();
    this.times[this.next] = delta;
    this.next = (this.next + 1) % N;
    const w = WORDS[getLang()] ?? WORDS.pl;
    const s = this.scene;
    const quiet = s.paused || s.state !== 'play';
    const back = !quiet && this.wasQuiet; // the first frame back in play (the gap before it is the pause itself)
    this.wasQuiet = quiet;
    if (delta > HITCH && quiet) this.quiet++;
    else if (delta > HITCH && !back) {
      // the wait came between the last frame's start and this one's: what the last frame did (still in cur), a
      // texture made meanwhile, and whether the page's thread was held up by something else or free
      const c = this.cur;
      const why = [];
      if (tex) why.push(w.tex);
      for (const k of ['pre', 'bg', 'enemies', 'bullets', 'render']) if (c[k] > SLOW) why.push(w[k]);
      if (c.logic - c.bg - c.enemies - c.bullets > SLOW) why.push(w.rest);
      if (c.music > SLOW / 2) why.push(w.music);
      const own = c.pre + c.logic + c.render + c.music;
      if (this.held <= HELD) {
        this.free++;
        why.push(w.free);
      } else if (this.held > own * 2) {
        this.busy++;
        why.push(`${w.busy} ${Math.round(this.held)}`);
      }
      if (this.texted) {
        this.afterText++;
        why.push(w.txt);
      }
      this.hitches++;
      this.log.unshift([this.scene.t, delta, why.join(' ')]);
      this.log.length = Math.min(this.log.length, 3);
    }
    // the last frame's parts go into the second's sums; this one starts from Phaser's work before the update
    for (const k in this.cur) {
      this.acc[k] += this.cur[k];
      this.cur[k] = 0;
    }
    this.cur.pre = now - this.stepT;
    this.texted = false;
    this.frameT = performance.now();
    const sec = this.sec;
    sec.t += delta;
    sec.n++;
    sec.sum += delta;
    sec.max = Math.max(sec.max, delta);
    sec.held += this.held;
    if (sec.t >= 1000) {
      this.fps = Math.round((sec.n * 1000) / sec.t);
      this.avg = sec.sum / sec.n;
      this.max = sec.max;
      this.heldAvg = sec.held / sec.n;
      for (const k in this.acc) {
        this.mean[k] = this.acc[k] / sec.n;
        this.acc[k] = 0;
      }
      this.musicPeak = this.musicMax;
      this.musicMax = 0;
      Object.assign(sec, { t: 0, n: 0, sum: 0, max: 0, held: 0 });
    }
    this.draw(w);
  }

  draw(w) {
    // the graph: one bar a frame, 2 ms a pixel; grey on time, yellow late, red a hitch; a line at 16.7 ms
    const g = this.graph.clear();
    const gy = Y + 9;
    g.fillStyle(0xffffff, 0.15).fillRect(X, gy + 16 - 8, N, 1);
    for (let k = 0; k < N; k++) {
      const ms = this.times[(this.next + k) % N];
      if (!ms) continue;
      const h = Math.max(1, Math.min(16, Math.round(ms / 2)));
      g.fillStyle(ms > HITCH ? 0xff4a3a : ms > 20 ? 0xffd040 : 0x9a9ab0, 1).fillRect(X + k, gy + 16 - h, 1, h);
    }
    // the words, four times a second, only the lines that changed (setting text every frame costs)
    this.textT -= this.times[(this.next + N - 1) % N] || 16;
    if (this.textT > 0) return;
    this.textT = 250;
    const s = this.scene;
    const props = s.parallax.props.list;
    const boot = s.scene.get('Boot');
    const waiting = boot ? [...boot.load.list, ...boot.load.inflight].filter((f) => /^(far|mid|props)_/.test(f.key)).length : 0;
    const m = this.mean;
    const ms = (v) => (v < 10 ? v.toFixed(1) : String(Math.round(v)));
    const text = [
      `${this.fps} FPS ${Math.round(this.avg)}/${Math.round(this.max)}MS`,
      `${w.logic} ${ms(m.logic)} ${w.draw} ${ms(m.render)} ${w.ph} ${ms(m.pre)} MS`,
      `${w.bg} ${ms(m.bg)} ${w.en} ${ms(m.enemies)} ${w.bu} ${ms(m.bullets)}`,
      `${w.mu} ${ms(m.music)} MAX ${ms(this.musicPeak)} ${w.probe} ${ms(this.heldAvg)} MS`,
      `${w.hitches} ${this.hitches}${this.quiet ? ` ${w.paused} ${this.quiet}` : ''}`,
      this.hitches ? `${w.busy} ${this.busy} ${w.free} ${this.free} ${w.txt} ${this.afterText}` : '',
      ...[0, 1, 2].map((i) => (this.log[i] ? `${Math.round(this.log[i][0])}S ${Math.round(this.log[i][1])}MS ${this.log[i][2]}` : '')),
      `${w.bullets} ${s.bullets.pool.live.length} ${w.foes} ${s.enemies.pool.live.length}`,
      `${w.bg} ${props.filter((p) => p.on).length}/${props.length} ${w.scene} ${s.children.list.length}`,
      `${w.cities} ${textures.done}/${textures.done + waiting} T ${Math.round(s.t)}S`,
      `${w.sound} ${(s.music?.ctx?.state ?? '-').toUpperCase()} ${audio.live}`,
    ];
    text.forEach((str, i) => {
      if (str === this.shown[i]) return;
      this.shown[i] = str;
      this.lines[i].setText(str);
      this.texted = true;
    });
    this.lines[4].setTint(this.hitches ? 0xff8a6a : 0xb0aec0);
  }
}
