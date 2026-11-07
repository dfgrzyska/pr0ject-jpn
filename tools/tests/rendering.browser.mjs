// Optional Chrome integration regression: same runtime setup as nagasaki.browser.mjs.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from '../preview/browser-runtime/node_modules/playwright/index.mjs';

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5176'], { windowsHide: true, stdio: 'ignore' });
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:5176/?stage=1&god');
  await page.waitForFunction(() => window.game?.scene.getScene('Stage')?.state === 'title');
  async function clickLogical(x, y) {
    const box = await page.locator('canvas').boundingBox();
    const H = await page.evaluate(() => game.scene.getScene('Stage').H);
    await page.mouse.click(box.x + x * box.width / 180, box.y + y * box.height / H);
  }
  assert.deepEqual(await page.evaluate(() => [game.canvas.width, game.canvas.height, game.scene.getScene('Stage').H, game.scene.getScene('Stage').cameras.main.zoom]), [540, 960, 320, 3]);
  await clickLogical(90, await page.evaluate(() => game.scene.getScene('Stage').journey.newGame.y));
  await page.waitForFunction(() => game.scene.getScene('Stage').state === 'city');
  await clickLogical(90, await page.evaluate(() => game.scene.getScene('Stage').journey.next.y));
  await page.waitForFunction(() => game.scene.getScene('Stage').state === 'select');
  await page.keyboard.press('Enter', { delay: 100 });
  await page.waitForFunction(() => game.scene.getScene('Stage').state === 'play');
  await page.evaluate(() => { const p = game.scene.getScene('Stage').player; p.entering = 0; p.x = p.tx = 90; p.y = p.ty = 200; });
  await page.mouse.move(270, 600);
  await page.mouse.down();
  await page.mouse.move(300, 630);
  const target = await page.evaluate(() => { const p = game.scene.getScene('Stage').player; return [p.tx, p.ty, p.ship.touchGain]; });
  assert(Math.abs(target[0] - (90 + 10 * target[2])) < 0.01);
  assert(Math.abs(target[1] - (200 + 10 * target[2])) < 0.01);
  await page.mouse.up();
  const pause = await page.evaluate(() => { const b = game.scene.getScene('Stage').hud.pauseBtn; return [b.x, b.y]; });
  await clickLogical(...pause);
  assert(await page.evaluate(() => game.scene.getScene('Stage').paused));
  for (const height of [1260, 1113, 960]) {
    await page.setViewportSize({ width: 540, height });
    await page.waitForFunction(h => game.canvas.height === h, height);
    assert.equal(await page.evaluate(() => game.scene.getScene('Stage').H), height / 3);
    assert.deepEqual(await page.evaluate(() => { const c = game.scene.getScene('Stage').cameras.main; c.preRender(); const p = c.getWorldPoint(270, 300); return [p.x, p.y]; }), [90, 100]);
  }
  await page.screenshot({ path: 'tools/preview/rendering-pause.png' });

  // Check actual raster output around half-pixel positions: identical shape, moving monotonically
  // on the old pixel grid. This catches zoom disabling Phaser's safeAuto vertex rounding.
  await page.evaluate(() => {
    game.loop.stop(); const s = game.scene.getScene('Stage');
    s.children.list.forEach(o => o.setVisible(false));
    s.testSprite = s.add.image(80, 100, 'sprites', 'ship');
    s.cameras.main.setBackgroundColor('#000000');
  });
  const samples = [];
  for (const x of [80, 80.24, 80.49, 80.5, 80.51, 80.75, 81]) {
    await page.evaluate(x => {
      game.scene.getScene('Stage').testSprite.x = x;
      game.renderer.preRender(); game.scene.render(game.renderer); game.renderer.postRender();
    }, x);
    const png = await page.locator('canvas').screenshot();
    samples.push(await page.evaluate(async data => {
      const img = new Image(); img.src = data; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
      const { data: pixels, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let left = width, right = 0, top = height, bottom = 0;
      for (let y = 220; y < 380; y++) for (let x = 180; x < 300; x++) {
        const i = (y * width + x) * 4;
        if (pixels[i] || pixels[i + 1] || pixels[i + 2]) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
      }
      const shape = Array.from(ctx.getImageData(left, top, right - left + 1, bottom - top + 1).data);
      return { left, top, width: right - left + 1, height: bottom - top + 1, shape };
    }, `data:image/png;base64,${png.toString('base64')}`));
  }
  for (let i = 0; i < samples.length; i++) {
    assert.deepEqual(samples[i].shape, samples[0].shape, 'sprite pixels must not shimmer');
    assert.equal(samples[i].left % 3, 0);
    if (i) assert(samples[i].left >= samples[i - 1].left);
  }
  assert.equal(samples.at(-1).left - samples[0].left, 3);

  await page.evaluate(() => { game.scene.getScene('Stage').scene.restart({ order: [0,1,2,3,4,5,6,7] }); game.loop.start(game.step.bind(game)); });
  for (let pos = 0; pos < 8; pos++) {
    await page.waitForFunction(pos => { const s = game.scene.getScene('Stage'); return s.pos === pos && s.state === 'title' && !s.scene.get('Boot').load.isLoading(); }, pos);
    const cities = await page.evaluate(() => [...new Set(game.textures.getTextureKeys().map(k => /^(?:far|mid|props|view)_(stage\d+)(?:_|$)/.exec(k)?.[1]).filter(Boolean))].sort());
    assert.deepEqual(cities, [`stage${pos + 1}`, ...(pos < 7 ? [`stage${pos + 2}`] : [])]);
    if (pos < 7) await page.evaluate(pos => game.scene.getScene('Stage').scene.restart({ order: [0,1,2,3,4,5,6,7], pos: pos + 1 }), pos);
  }
  // A released city must load again.
  await page.evaluate(() => game.scene.getScene('Stage').scene.restart({ order: [0,1,2,3,4,5,6,7] }));
  await page.waitForFunction(() => { const s = game.scene.getScene('Stage'); return s.stage.id === 'stage1' && s.state === 'title' && !s.scene.get('Boot').load.isLoading(); });
  assert(await page.evaluate(() => game.textures.exists('sprites') && game.textures.exists('font') && game.textures.exists('far_stage1') && !game.textures.exists('far_stage8')));
  // Late downloads from an abandoned city must also be released.
  await page.route('**/assets/bg/stage1/**', async route => { await new Promise(r => setTimeout(r, 400)); await route.continue(); });
  await page.reload();
  await page.waitForFunction(() => window.game?.scene.getScene('Stage')?.state === 'loading');
  await page.evaluate(() => game.scene.getScene('Stage').scene.restart({ order: [5,6,7,0,1,2,3,4] }));
  await page.waitForFunction(() => { const s = game.scene.getScene('Stage'); return s.stage.id === 'stage6' && s.state === 'title' && !s.scene.get('Boot').load.isLoading(); });
  assert(await page.evaluate(() => !game.textures.exists('far_stage1') && game.textures.exists('far_stage6')));
  assert.deepEqual(errors, []);
  console.log('540px: pointer menus, drag gain, pause, resize, half-pixel raster stability, eight city transitions and texture reload passed.');
} finally {
  await browser?.close();
  server.kill();
}
