// Step sequencer for the procedural soundtrack. Notes are scheduled slightly ahead on the
// AudioContext clock (lookahead scheduler), so timing stays tight regardless of frame rate.
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
  constructor(ctx, destination) {
    this.ctx = ctx;
    this.enabled = loadEnabled();
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
    this.out.gain.value = VOLUME;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    this.out.connect(comp).connect(this.master);
    this.synth = new Synth(ctx, this.out);
    this.sfx = new Sfx(ctx, this.master);
    this.songs = Object.fromEntries(Object.entries(SONGS).map(([k, v]) => [k, parseSong(k, v)]));
    this.current = null;
    this.pending = null;
    this.bar = 0; // global bar counter (keeps stage songs in step with each other)
    this.songBar = 0;
    this.step = 0;
    this.next = 0;
    this.paused = false;
    this.timer = setInterval(() => this.tick(), 25);
    installAudioUnlock(ctx);
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
    this.out.gain.setTargetAtTime(p ? 0 : VOLUME, this.ctx.currentTime, 0.04);
    if (!p) this.next = this.ctx.currentTime + 0.06;
  }

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem(PREF_KEY, this.enabled ? 'on' : 'off');
    } catch {
      /* ignore */
    }
    this.master.gain.setTargetAtTime(this.enabled ? 1 : 0, this.ctx.currentTime, 0.05);
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
      this.playStep(song, this.songBar * 16 + this.step, this.next + late, stepDur);
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
  instance = sound && sound.context ? new Music(sound.context, sound.destination) : SILENT;
  return instance;
}
