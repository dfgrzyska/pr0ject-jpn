// Local Chrome integration: actual scene, player movement, weapons, collisions and renderer.
// God mode isolates boss progression from the bot's bullet dodging; it does not bypass boss armor.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { chromium } from '../preview/browser-runtime/node_modules/playwright/index.mjs';

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5177'], { windowsHide: true, stdio: 'ignore' });
let browser;
try {
  await new Promise(r => setTimeout(r, 1200));
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const H of (process.env.BOSS_HEIGHT ? [Number(process.env.BOSS_HEIGHT)] : [320, 420])) for (const city of (process.env.BOSS_CITY ? [Number(process.env.BOSS_CITY)] : [3, 5, 8])) {
    const stage = JSON.parse(readFileSync(`src/data/stage${city}.json`, 'utf8'));
    const at = stage.waves.find(w => w.type === 'boss').t;
    const page = await browser.newPage({ viewport: { width: 540, height: H * 3 }, hasTouch: H === 420 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) errors.push(m.text()); });
    const weapon = process.env.BOSS_WEAPON ?? (H === 320 ? 'laser' : 'homing');
    const ship = process.env.BOSS_SHIP ?? (H === 320 ? 'oni' : 'tsubame');
    await page.goto(`http://127.0.0.1:5177/?stage=${city}&t=${at - 2}&god&weapon=${weapon}&ship=${ship}&power=3`);
    await page.waitForFunction(() => window.game?.scene.getScene('Stage')?.state === 'title');
    await page.evaluate(city => {
      const s = game.scene.getScene('Stage'); s.startGame(); game.loop.stop(); s.music.play = () => {};
      window.audit = { phases: [], opens: 0, lastOpen: false, failures: 0, city, frames: 0, maxMelts: 0, captured: [] };
      window.drive = (frames, fail = false) => {
        const p = s.player;
        p.drag = true;
        for (let i = 0; i < frames && !s.bossDown; i++) {
          const g = s.enemies.bossGroup;
          p.tx = 90; p.ty = s.H - 44;
          if (g) {
            const alive = g.parts.filter(e => !e.dead && e.hp > 0 && e.group === g);
            if (city === 3) {
              if (g.stage === 1 && g.fire) {
                const c = g.charge;
                const from = c?.from ?? g.body;
                p.ty = g.fire.y + 65;
                p.tx = from.x + (g.fire.x - from.x) * (p.ty - from.y) / (g.fire.y - from.y);
                if (c?.t >= 1.4) { p.tx = 166; p.ty = s.H - 30; }
              } else { p.tx = g.body.x; }
              audit.maxMelts = Math.max(audit.maxMelts, g.melts ?? 0);
            } else if (city === 5) {
              const pin = g.slams.find(q => q.pinned);
              const pile = g.piles?.[Math.floor(audit.frames / 600) % 3];
              if (pin) { p.tx = pin.to.x; p.ty = pin.to.y + 40; }
              else if (g.open > 0 || !pile) { p.tx = g.head.x; }
              else { p.tx = pile.x + 8; p.ty = pile.y + 14; }
            } else if (city === 8 && g.launchers) {
              if (g.open) p.tx = alive[0]?.x ?? 90;
              else {
                let pad = g.launchers.find(a => a.charge > .05 && !a.rocket && !a.cool);
                if (!pad) {
                  const x = 90 + Math.sin((g.ft + 2.95 * (g.stage >= 3 ? 1.4 : 1)) * .65) * 52;
                  pad = g.launchers.filter(a => !a.rocket && !a.cool).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
                }
                p.tx = pad?.x ?? alive[0]?.x ?? 90;
              }
            }
            if (fail) { p.tx = 15; p.ty = s.H - 30; }
            p.tx = Math.max(10, Math.min(170, p.tx));
            p.ty = Math.max(160, Math.min(s.H - 20, p.ty));
            if (!audit.phases.includes(g.stage)) audit.phases.push(g.stage);
            if (g.open > 0 && !audit.lastOpen) audit.opens++;
            audit.lastOpen = g.open > 0;
          }
          s.update(0, 1000 / 60); audit.frames++;
        }
        const g = s.enemies.bossGroup;
        return { won: s.bossDown, phase: g?.stage, phases: audit.phases, opens: audit.opens, melts: audit.maxMelts,
          hp: g?.parts.filter(e => !e.dead && e.group === g).map(e => Math.round(e.hp)), t: g?.t,
          charge: g?.charge?.t, slams: g?.slams?.map(a => [a.t, a.pinned]), fireworks: g?.fireworkHits ?? 0,
          ...(s.bossDown || !g ? {} : { debug: { state: s.state, parts: g.parts.map(e => [e.role, e.hp, e.dead, e.group === g]), errors: [] } }) };
      };
    }, city);
    // Deliberately miss first, to prove the opportunity recurs without resetting progress.
    let state = await page.evaluate(() => drive(60 * 14, true));
    assert(!state.won, `stage ${city}: passive shooting must not end the encounter`);
    // Also run the real browser loop and real input, not just accelerated scene stepping.
    await page.evaluate(() => { game.scene.getScene('Stage').player.drag = false; game.loop.start(game.step.bind(game)); });
    const beforeInput = await page.evaluate(() => game.scene.getScene('Stage').player.x);
    if (H === 320) {
      await page.keyboard.down('ArrowRight'); await page.waitForTimeout(180); await page.keyboard.up('ArrowRight');
    } else {
      const box = await page.locator('canvas').boundingBox();
      const cdp = await page.context().newCDPSession(page);
      const x = box.x + box.width * .3, y = box.y + box.height * .75;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 45, y }] });
      await page.waitForTimeout(180);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
    }
    assert(await page.evaluate(x => game.scene.getScene('Stage').player.x > x, beforeInput), 'real keyboard/touch input moves the ship');
    await page.evaluate(() => game.loop.stop());
    if (city === 3) {
      const armor = await page.evaluate(() => {
        const s = game.scene.getScene('Stage'), g = s.enemies.bossGroup;
        const before = g.body.hp;
        s.enemies.damage(g.body, 1e9, true);
        const after = g.body.hp;
        g.body.hp = before;
        return { alive: !g.body.dead, stage: g.stage, melts: g.melts, after, floor: g.body.maxHp * .75 };
      });
      assert(armor.alive && armor.stage === 1 && armor.melts < 3 && armor.after >= armor.floor);
    }
    const paused = await page.evaluate(() => {
      const s = game.scene.getScene('Stage'), before = s.enemies.bossGroup.t;
      s.paused = true; for (let i = 0; i < 60; i++) s.update(0, 1000 / 60);
      s.paused = false; return s.enemies.bossGroup.t === before;
    });
    assert(paused);
    if (process.env.BOSS_RECOVERY) {
      const recovered = await page.evaluate(() => {
        const s = game.scene.getScene('Stage'), p = s.player, lives = p.lives;
        p.bombs = 0; p.god = false; p.invulnerable = 0; p.entering = 0;
        p.hit(); p.god = true;
        drive(300, true);
        const respawned = p.alive && p.lives === lives - 1;
        p.bombs = 1;
        const bombed = p.bomb();
        drive(300, true);
        return respawned && bombed;
      });
      assert(recovered, 'death, respawn and bomb leave the encounter playable');
    }
    const seen = new Set();
    for (let chunk = 0; chunk < 75 && !state.won; chunk++) {
      state = await page.evaluate(() => drive(240));
      if (!seen.has(state.phase)) {
        seen.add(state.phase);
        await page.evaluate(() => { game.renderer.preRender(); game.scene.render(game.renderer); game.renderer.postRender(); });
        await page.screenshot({ path: `tools/preview/boss-${city}-${H}-phase-${state.phase}.png` });
      }
    }
    console.log(`stage ${city}, H=${H}: ${JSON.stringify(state)}`);
    assert(state.won, `stage ${city} H=${H}: bot must win using the mechanic and normal shots`);
    assert.deepEqual(state.phases.filter(Boolean).sort(), [1, 2, 3]);
    if (city === 3) assert.equal(state.melts, 3);
    else if (city === 8) assert(state.fireworks > 0);
    else assert(state.opens > 0);
    const cleared = await page.evaluate(() => {
      const s = game.scene.getScene('Stage');
      for (let i = 0; i < 2400 && s.state === 'play'; i++) s.update(0, 1000 / 60);
      return s.state === 'clear' && s.enemies.bossGroup.defeated;
    });
    assert(cleared, 'victory reaches the results without a dangling mechanism');
    if (city === 3) {
      const overflow = await page.evaluate(async () => {
        const { setLang } = await import('/src/i18n.js');
        const s = game.scene.getScene('Stage'), bad = [];
        const labels = [
          ['STOP LODOWĄ SKORUPĘ', 'ZWAB 3 SZARŻE PRZEZ OGIEŃ'],
          ['PALE W ZATOCE', 'STAŃ PRZY PALU, MACKA UTKNIE'],
          ['FAJERWERKI', 'ŁADUJ WYRZUTNIĘ POD SMOKIEM'],
        ];
        for (const lang of ['pl', 'en']) {
          setLang(lang);
          for (const [title, sub] of labels) {
            s.enemies.encounterHint({}, title, sub);
            for (const label of [s.hud.banner, s.hud.bannerSub]) {
              const b = label.getBounds();
              if (b.left < 2 || b.right > 178) bad.push([lang, title, b.left, b.right]);
            }
          }
        }
        setLang('pl'); return bad;
      });
      assert.deepEqual(overflow, [], 'PL/EN mechanic instructions fit the playfield');
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser?.close(); server.kill();
}
