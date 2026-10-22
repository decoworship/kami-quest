// Fluxo completo com 4 jogadores (2 teclados + 2 controles simulados)
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.env.OUT || '/tmp/shots';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => {
    const mk = i => ({ index: i, id: 'Fake pad ' + i, connected: true, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) });
    window.__pads = [mk(0), mk(1), null, null];
    navigator.getGamepads = () => window.__pads;
  });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + e.stack));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../dist/peregrinos.html'));
  await page.waitForTimeout(400);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { } window.__peregrinos.Save.reset(); window.__peregrinos.Game.toTitle(); });
  await page.mouse.click(640, 360);
  await page.waitForTimeout(500);
  const padPress = async (i, b) => { await page.evaluate(([i, b]) => { window.__pads[i].buttons[b].pressed = true; }, [i, b]); await page.waitForTimeout(80); await page.evaluate(([i, b]) => { window.__pads[i].buttons[b].pressed = false; }, [i, b]); await page.waitForTimeout(80); };
  const scene = () => page.evaluate(() => window.__peregrinos.Game.scene.constructor.name);
  await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  console.log('after title:', await scene());
  await page.keyboard.press('KeyJ'); await page.waitForTimeout(150);
  await page.keyboard.press('KeyZ'); await page.waitForTimeout(150);
  await padPress(0, 0); await padPress(1, 0);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/f_select4.png` });
  await page.keyboard.press('KeyJ'); await page.keyboard.press('KeyZ'); await padPress(0, 0); await padPress(1, 0);
  await page.waitForTimeout(1800);
  console.log('after select:', await scene());
  await page.screenshot({ path: `${OUT}/f_diff.png` });
  await page.keyboard.press('KeyS'); await page.waitForTimeout(100); await page.keyboard.press('KeyJ'); await page.waitForTimeout(500);
  console.log('after diff:', await scene(), 'diff=', await page.evaluate(() => window.__peregrinos.Save.data.diff));
  await page.screenshot({ path: `${OUT}/f_map.png` });
  await page.keyboard.press('KeyJ'); await page.waitForTimeout(1500);
  console.log('after map:', await scene());
  await page.screenshot({ path: `${OUT}/f_play4.png` });
  // vence o chefe e entra na luz
  await page.evaluate(() => { const P = window.__peregrinos; P.warp(6); const sc = P.Game.scene; sc.invulnAll = 1e9; for (const p of sc.players) p.x += 120; });
  await page.waitForTimeout(3000);
  await page.evaluate(() => { const sc = window.__peregrinos.Game.scene; sc.stats.scrolls = [0, 2]; sc.stats.captives = ['0-1-23-16', '0-2-19-12']; sc.boss.hurt(99999, sc); });
  await page.waitForTimeout(6000);
  await page.evaluate(() => { const sc = window.__peregrinos.Game.scene; const portal = sc.objs.find(o => o.constructor.name === 'ExitPortal'); if (portal) { sc.players[0].x = portal.x + 8; sc.players[0].y = portal.y + 20; } });
  await page.waitForTimeout(2500);
  console.log('after portal:', await scene());
  await page.waitForTimeout(4500);
  await page.screenshot({ path: `${OUT}/f_summary.png` });
  await page.keyboard.press('KeyJ'); await page.waitForTimeout(800);
  console.log('after summary:', await scene(), JSON.stringify(await page.evaluate(() => ({ gifts: window.__peregrinos.Save.data.gifts, unlocked: window.__peregrinos.Save.data.unlocked, sem: window.__peregrinos.Game.semelhanca() }))));
  await page.screenshot({ path: `${OUT}/f_map2.png` });
  // códice
  await page.keyboard.press('KeyS'); await page.waitForTimeout(100); await page.keyboard.press('KeyJ'); await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/f_codex.png` });
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  // pausa
  await page.evaluate(() => window.__peregrinos.Game.startPhase(1)); await page.waitForTimeout(800);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/f_pause.png` });
  await page.keyboard.press('KeyS'); await page.waitForTimeout(100); await page.keyboard.press('KeyJ'); await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/f_controls.png` });
  await page.evaluate(() => window.__peregrinos.Game.toEnding()); await page.waitForTimeout(9000);
  await page.screenshot({ path: `${OUT}/f_ending.png` });
  console.log(errors.slice(0, 10).join('\n') || 'no errors');
  await browser.close();
})();
