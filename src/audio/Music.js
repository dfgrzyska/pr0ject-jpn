// Step sequencer for the procedural soundtrack. Notes are scheduled slightly ahead on the
// AudioContext clock (lookahead scheduler), so timing stays tight regardless of frame rate. The scheduling
// (building the notes' nodes) runs right after each frame is drawn, when there's the most time before the
// next one: run from a timer it would now and then land just before a frame and make it late (a stutter
// on phones). The timer only takes over when no frames come (a hidden tab, a long load).
import { PERCUSSION, SONGS, parseSong } from './score.js';
import { Sfx } from './Sfx.js';
import { Synth } from './synth.js';
import { installAudioUnlock } from './unlock.js';

const VOLUME = 0.6;
const LOOKAHEAD = 0.12; // s
const PREF_KEY = 'shmupjp.music';

function loadEnabled() {
  try {
    return localStorage.getItem(PREF_KEY) !== 'off';
  } catch {
    return true;
  }
}

export class Music {
  constructor(ctx, destination, game) {
    this.enabled = loadEnabled();
    this.wire(ctx, destination);
    this.sfx = new Sfx(ctx, this.master);
    this.sfx.muted = !this.enabled;
    this.songs = Object.fromEntries(Object.entries(SONGS).map(([k, v]) => [k, parseSong(k, v)]));
    this.current = null;
    this.pending = null;
    this.bar = 0; // global bar counter (keeps stage songs in step with each other)
    this.songBar = 0;
    this.step = 0;
    this.next = 0;
    this.paused = false;
    this.duckK = 1; // the music held down for a quiet moment (the Peace Park)
    this.lastFrame = 0;
    // (the sound's health, see watch)
    this.clock = { t: -1, at: 0, stuck: false, failed: false, rebuilt: 0 };
    game?.events.on('postrender', () => {
      this.lastFrame = performance.now();
      this.watch();
      this.tick();
    });
    this.timer = setInterval(() => performance.now() - this.lastFrame > 60 && (this.watch(), this.tick()), 25);
    // (put away and back here, not by Phaser: it would keep at a context this may have replaced)
    if (game?.sound) game.sound.pauseOnBlur = false;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.ctx.suspend?.().catch(() => {});
      else {
        this.clock.t = -1;
        this.ctx.resume?.().catch(() => {});
      }
    });
    installAudioUnlock(() => this.ctx, () => this.wake());
  }

  /** The nodes everything plays through, on ctx: the speaker switch, the limiter, the music's own volume. */
  wire(ctx, destination) {
    this.ctx = ctx;
    // master = the speaker toggle (music + effects); out = music only (ducked on pause)
    this.master = ctx.createGain();
    this.master.gain.value = this.enabled ? 1 : 0;
    // safety limiter: music peaks + a big explosion must never clip
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -4;
    limiter.knee.value = 2;
    limiter.ratio.value = 16;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.12;
    this.master.connect(limiter).connect(destination);
    this.out = ctx.createGain();
    this.out.gain.value = this.paused ? 0 : VOLUME * (this.duckK ?? 1);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    this.out.connect(comp).connect(this.master);
    this.synth = new Synth(ctx, this.out);
  }

  /**
   * Is the sound alive? Back from the background (an app switch, the phone locked) iOS may leave the context
   * interrupted for good, or running with its clock stopped: nothing plays and nothing says so. A clock that
   * stands still for a second while the page shows counts as stuck; the next touch (wake) builds the sound anew.
   */
  watch() {
    const c = this.clock;
    if (document.hidden || this.ctx.state !== 'running') {
      c.t = -1;
      return;
    }
    const now = performance.now();
    const t = this.ctx.currentTime;
    if (t !== c.t) {
      c.t = t;
      c.at = now;
      c.stuck = false;
    } else if (now - c.at > 1000) c.stuck = true;
  }

  /** A touch, a click, a key (unlock.js, after its own attempt to start the context): mend the sound if it is broken. */
  wake() {
    const c = this.clock;
    if (document.hidden) return;
    if (this.ctx.state === 'running' && !c.stuck) {
      c.failed = false;
      return;
    }
    // (a context that wouldn't start on the touch before this one, or a stopped clock: a new one, in this touch)
    if (c.stuck || c.failed) {
      if (performance.now() - c.rebuilt > 2000) this.rebuild();
      return;
    }
    const ctx = this.ctx;
    setTimeout(() => {
      if (ctx === this.ctx && ctx.state !== 'running' && !document.hidden) c.failed = true;
    }, 600);
  }

  /** A new context in place of the broken one, the music carrying on in it where it was. */
  rebuild() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    let ctx;
    try {
      ctx = new Ctx();
    } catch {
      return;
    }
    const old = this.ctx;
    this.wire(ctx, ctx.destination);
    this.sfx.attach(ctx, this.master);
    // (started inside the touch: a one-sample sound is what wakes older WebKit)
    const src = ctx.createBufferSource();
    src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    src.connect(ctx.destination);
    src.start(0);
    ctx.resume?.().catch(() => {});
    old.close?.().catch(() => {});
    this.next = ctx.currentTime + 0.05;
    Object.assign(this.clock, { t: -1, stuck: false, failed: false, rebuilt: performance.now() });
  }

  /** Switch song on the next bar line (or right away with now / when nothing plays). */
  play(name, now = false) {
    const song = this.songs[name];
    if (!song) return;
    if (this.current === song) {
      this.pending = null;
      return;
    }
    if (this.pending === song && !now) return;
    if (!this.current || now) this.begin(song, true);
    else this.pending = song;
  }

  begin(song, immediate) {
    this.current = song;
    this.pending = null;
    this.songBar = song.sync ? this.bar % song.bars : 0;
    if (immediate) {
      this.step = 0;
      this.next = this.ctx.currentTime + 0.05;
    }
  }

  stop() {
    this.current = null;
    this.pending = null;
  }

  /** Called from a user gesture: browsers (iOS especially) only start audio after one. */
  unlock() {
    if (this.ctx.state !== 'running') this.ctx.resume?.().catch(() => {});
  }

  setPaused(p) {
    this.paused = p;
    this.out.gain.setTargetAtTime(p ? 0 : VOLUME * this.duckK, this.ctx.currentTime, 0.04);
    if (!p) this.next = this.ctx.currentTime + 0.06;
  }

  /** Hold the music down to k of its volume (1 = back to normal), easing over a second or so. */
  duck(k) {
    if (this.duckK === k) return;
    this.duckK = k;
    if (!this.paused) this.out.gain.setTargetAtTime(VOLUME * k, this.ctx.currentTime, 0.5);
  }

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem(PREF_KEY, this.enabled ? 'on' : 'off');
    } catch {
      /* ignore */
    }
    this.master.gain.setTargetAtTime(this.enabled ? 1 : 0, this.ctx.currentTime, 0.05);
    this.sfx.muted = !this.enabled;
    return this.enabled;
  }

  tick() {
    if (!this.current || this.paused || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (this.next < now - 0.25) this.next = now + 0.02; // resumed after a stall: don't burst-play the backlog
    while (this.current && this.next < now + LOOKAHEAD) {
      if (this.step === 0 && this.pending) this.begin(this.pending, false);
      const song = this.current;
      const stepDur = 60 / song.bpm / 4;
      // swing: every second 16th lands late (shuffle feel for the Okinawan songs)
      const late = this.step % 2 ? (song.swing ?? 0) * stepDur : 0;
      // switched off, the song still moves on (to come back in step) but no notes are built
      if (this.enabled) this.playStep(song, this.songBar * 16 + this.step, this.next + late, stepDur);
      this.next += stepDur;
      if (++this.step === 16) {
        this.step = 0;
        this.bar++;
        if (++this.songBar >= song.bars) {
          this.songBar = 0;
          if (!song.loop) {
            const next = this.pending;
            this.current = null;
            if (next) this.begin(next, false);
          }
        }
      }
    }
  }

  playStep(song, pos, t, stepDur) {
    const events = song.events[pos];
    if (!events) return;
    const s = this.synth;
    for (const e of events) {
      const v = song.mix[e.track] ?? 1;
      if (PERCUSSION.has(e.track)) {
        if (e.hit === 'K') s.taiko(t, true, v);
        else if (e.hit === 'k') s.taiko(t, false, v);
        else if (e.hit === 'x') s.ka(t, v);
        else if (e.hit === 's' || e.hit === 'S') s.shaker(t, e.hit === 'S', v);
        else if (e.hit === 'p') s.paranku(t, v);
        else if (e.hit === 'c') s.sanba(t, v);
        else if (e.hit === 'n') s.naruko(t, v);
        else if (e.hit === 'j') s.suzu(t, v);
        else if (e.hit === 'g') s.kane(t, v);
        else if (e.hit === 'h') s.hyoshigi(t, v);
        else if (e.hit === 'z' || e.hit === 'Z') s.tsuzumi(t, e.hit === 'Z', v);
        else if (e.hit === 'b') s.kick(t, v);
        else if (e.hit === 'r') s.snare(t, v);
        else if (e.hit === 'i' || e.hit === 'o') s.hat(t, e.hit === 'o', v);
        else if (e.hit === 'q') s.clap(t, v);
      } else for (const m of e.notes) s[e.track](t, m, e.len * stepDur, v);
    }
  }
}

const SILENT = {
  sfx: { shot() {}, explode() {} },
  play() {},
  stop() {},
  unlock() {},
  setPaused() {},
  duck() {},
  toggle() {
    return false;
  },
  enabled: false,
};

let instance = null;

/** One shared audio player (music + effects) for the whole game; survives scene restarts. */
export function getMusic(scene) {
  if (instance) return instance;
  const sound = scene.sound;
  instance = sound && sound.context ? new Music(sound.context, sound.destination, scene.game) : SILENT;
  return instance;
}
