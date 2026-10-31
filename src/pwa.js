// The game as an app on the phone: offline play through the service worker (public/sw.js), and installing
// it to the home screen — Android offers a prompt the game can show from its own button; on iPhone it's
// Share -> Add to Home Screen, which the title screen explains. Installed, it opens full screen.
let prompt = null;

if (import.meta.env.PROD && 'serviceWorker' in navigator)
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // keep it for the game's own button
  prompt = e;
});
window.addEventListener('appinstalled', () => {
  prompt = null;
});

/**
 * Keep everything the game has loaded for playing offline. The service worker caches what comes in while it
 * is in charge, but on the very first visit it only takes over halfway through, so once the game has
 * finished loading (Boot) the files fetched before that are put in its cache too.
 */
export function keepForOffline() {
  if (!import.meta.env.PROD || !('caches' in window)) return;
  const urls = [location.href.split('#')[0], ...performance.getEntriesByType('resource').map((e) => e.name)].filter((u) => u.startsWith(location.origin));
  caches
    .open('shmupjp-v1') // the service worker's cache (public/sw.js)
    .then((c) => Promise.all([...new Set(urls)].map((u) => c.match(u).then((hit) => hit || c.add(u).catch(() => {})))))
    .catch(() => {});
}

/** Running as an installed app (from the home screen). */
export function installed() {
  return window.matchMedia?.('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
}

/** The browser has an install prompt ready (Chrome on Android, desktop Chrome / Edge). */
export function canInstall() {
  return Boolean(prompt) && !installed();
}

export async function install() {
  if (!prompt) return;
  const p = prompt;
  prompt = null;
  p.prompt();
  await p.userChoice.catch(() => {});
}

/** Safari on iPhone / iPad, not installed yet: there the way in is Share -> Add to Home Screen. */
export function iosHint() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios && !installed();
}
