// The developer boss screen off the title: it lists every city's miniboss and boss and every random encounter;
// picking a city boss starts that city a few seconds before its boss, picking an encounter starts its fight, and the
// invulnerability switch carries into the game. No console warnings on the way.
import assert from 'node:assert/strict';
import { startServer, launchBrowser } from './browser-support.mjs';

const server = await startServer(5186);
let browser;
try {
  browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 540, height: 1260 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (['warning', 'error'].includes(m.type())) errors.push(m.text()); });
  await page.goto('http://127.0.0.1:5186/');
  const title = () => page.waitForFunction(() => window.game?.scene.getScene('Stage')?.state === 'title', null, { timeout: 30000 });
  await title();
  // the menu: open it from the title, look at its rows
  const menu = await page.evaluate(() => {
    const s = game.scene.getScene('Stage');
    s.openDevBosses();
    const rows = s.devMenu.rows.filter((r) => !r.head);
    return { state: s.state, labels: rows.map((r) => r.label), cities: rows.filter((r) => r.go?.index !== undefined).length, encounters: rows.filter((r) => r.go?.encounter).length };
  });
  console.log(JSON.stringify(menu));
  assert.equal(menu.state, 'dev');
  assert.equal(menu.cities, 19, "a miniboss and a boss for each of the eight cities, Tokyo's two minibosses and its boss");
  assert.equal(menu.encounters, 7, 'every random encounter');
  await page.screenshot({ path: 'tools/preview/dev-bosses.png' });
  // a random encounter, invulnerable
  const pick = (match) => page.evaluate((m) => {
    const s = game.scene.getScene('Stage');
    const i = s.devMenu.rows.findIndex((r) => r.label?.includes(m));
    s.devMenu.focus = i;
    s.devMenu.activate();
  }, match);
  const playing = (id) => page.waitForFunction((i) => { const s = game.scene.getScene('Stage'); return s?.state === 'play' && s.stage.id === i; }, id, { timeout: 30000 });
  await page.evaluate(() => { const s = game.scene.getScene('Stage'); s.devMenu.rows.find((r) => r.toggle) && (s.devMenu.god = true); });
  await pick('EX4');
  await playing('ex4');
  await page.waitForFunction(() => game.scene.getScene('Stage').enemies.bossGroup?.kind === 'nagai', null, { timeout: 20000 });
  const ex = await page.evaluate(() => { const s = game.scene.getScene('Stage'); return { god: s.player.god, encounter: Boolean(s.encounter) }; });
  assert.deepEqual(ex, { god: true, encounter: true });
  // back to the title, then a city's boss: the stage starts just before it, and the boss comes
  await page.evaluate(() => game.scene.getScene('Stage').scene.restart({}));
  await title();
  await page.evaluate(() => game.scene.getScene('Stage').openDevBosses());
  await pick('TAKO');
  await playing('stage5');
  const t0 = await page.evaluate(() => game.scene.getScene('Stage').t);
  assert(t0 > 195 && t0 < 210, `starts just before the boss (t = ${t0})`);
  await page.waitForFunction(() => game.scene.getScene('Stage').enemies.bossGroup?.kind === 'tako', null, { timeout: 30000 });
  assert.equal(await page.evaluate(() => game.scene.getScene('Stage').player.god), false, 'the switch was off this time');
  assert.deepEqual(errors, [], 'console');
  console.log('dev boss screen: ok');
} finally {
  await browser?.close();
  server.kill();
}
