// Mobile audio unlock.
//
// iOS only lets audio start inside a real activation gesture (touchend / click / key), not touchstart,
// and plays Web Audio through the "ambient" session, which the ring/silent switch mutes.
// Phaser's own unlock tries touchstart first and gives up for good when that fails, so we keep
// our own listeners for the whole session (this also wakes audio after a call or app switch).

const GESTURES = ['touchend', 'click', 'pointerup', 'keydown', 'mousedown'];
const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** 0.1 s of 8-bit silence as a WAV blob URL. */
function silentWav() {
  const rate = 8000;
  const n = 800;
  const buf = new ArrayBuffer(44 + n);
  const v = new DataView(buf);
  const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + n, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  str(36, 'data');
  v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

export function installAudioUnlock(ctx) {
  let media = null;

  const onGesture = () => {
    // Play through the "playback" session so the silent switch does not mute the game
    // (Safari 16.4+; the in-game speaker button still mutes everything).
    if (navigator.audioSession && navigator.audioSession.type !== 'playback') {
      try {
        navigator.audioSession.type = 'playback';
      } catch {
        /* unsupported value */
      }
    }
    // Older iOS: a playing <audio> element switches the session to playback as well.
    if (IOS && !document.hidden) {
      if (!media) {
        media = new Audio(silentWav());
        media.loop = true;
        media.setAttribute('playsinline', '');
        media.setAttribute('x-webkit-airplay', 'deny');
      }
      if (media.paused) media.play().catch(() => {});
    }
    if (ctx.state !== 'running') {
      // starting a 1-sample buffer inside the gesture is what wakes older WebKit
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      src.connect(ctx.destination);
      src.start(0);
      ctx.resume?.().catch(() => {});
    }
  };

  for (const ev of GESTURES) document.addEventListener(ev, onGesture, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) media?.pause();
  });
}
