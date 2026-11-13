// Run against real Phaser: phase changes must work on every animation frame.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from '../preview/browser-runtime/node_modules/playwright/index.mjs';

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5178', '--strictPort'], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
let browser;
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Vite startup timed out')), 15000);
    server.stdout.on('data', chunk => {
      if (chunk.toString().includes('Local:')) { clearTimeout(timeout); resolve(); }
    });
    server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Vite exited: ${code}`)); });
    server.once('error', reject);
  });
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5178/?stage=7&t=102&god');
  await page.waitForFunction(() => window.game?.scene.getScene('Stage')?.state === 'title');
  const results = await page.evaluate(() => {
    const s = game.scene.getScene('Stage');
    s.startGame(); game.loop.stop();
    const e = s.enemies.spawn({ type: 'heavy', x: 90 });
    e.p2 = true;
    const results = [];
    for (let i = 0; i < 4; i++) {
      e.play({ key: 'heike', startFrame: i });
      try {
        s.enemies.heikeWorn(e);
        results.push({ frame: i, actual: e.anims.currentFrame.index - 1, key: e.anims.currentAnim.key });
      } catch (error) { results.push({ frame: i, error: error.message }); }
    }
    if (results.some(r => r.error)) return results;
    e.anims.stop(); e.setFrame('heike_guard');
    s.enemies.heikeWorn(e);
    results.push({ guard: e.frame.name });
    return results;
  });
  console.log(JSON.stringify(results));
  assert.deepEqual(results, [
    ...Array.from({ length: 4 }, (_, i) => ({ frame: i, actual: i, key: 'heike_c' })),
    { guard: 'heike_guard_c' },
  ]);
  assert.deepEqual(errors, []);
} finally {
  await browser?.close(); server.kill();
}
