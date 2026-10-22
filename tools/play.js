const { chromium } = require('playwright');
const path = require('path');
const OUT = process.env.OUT || '/tmp/shots';
const PH = +(process.env.PH || 0);
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + e.stack));
  await page.goto('file://' + path.resolve(__dirname, '../dist/kami-quest.html'));
  await page.waitForTimeout(500);
  await page.mouse.click(640, 360);
  await page.evaluate((ph) => {
    const P = window.__kami;
    P.Save.data.started = true; P.Save.data.unlocked = 5;
    P.Game.party = [{ ci: 0, dev: 'kb1' }, { ci: 3, dev: 'kb2' }];
    P.Game.startPhase(ph);
  }, PH);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/p${PH}_a_start.png` });
  // anda para a direita pulando
  await page.keyboard.down('KeyD');
  for (let i = 0; i < 6; i++) { await page.keyboard.press('KeyJ'); await page.waitForTimeout(350); }
  await page.keyboard.press('KeyL'); await page.keyboard.press('KeyK');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/p${PH}_b_run.png` });
  await page.keyboard.up('KeyD');
  // teleporta para cada sala e tira foto
  for (let r = 1; r < 7; r++) {
    await page.evaluate((r) => {
      const P = window.__kami, sc = P.Game.scene, room = P.LV.rooms[r];
      for (const p of sc.players) { p.x = room.x0 + 40 + p.slot * 12; p.y = 18 * 16 - 12 + 4; p.vx = 0; p.vy = 0; }
      sc.cam = room.x0 - 100;
    }, r);
    await page.waitForTimeout(r === 6 ? 300 : 900);
    if (r === 2 || r === 4 || r === 6) {
      await page.evaluate((r) => { const P = window.__kami, sc = P.Game.scene, room = P.LV.rooms[r]; for (const p of sc.players) { p.x = room.x0 + 120 + p.slot * 12; } }, r);
      await page.waitForTimeout(r === 6 ? 2600 : 2500);
    }
    await page.screenshot({ path: `${OUT}/p${PH}_r${r}.png` });
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/p${PH}_boss_fight.png` });
  const info = await page.evaluate(() => { const sc = window.__kami.Game.scene; return { scene: sc.constructor.name, boss: sc.boss && sc.boss.state, hp: sc.boss && sc.boss.hp, players: sc.players.map(p => [p.state, p.hp]), enemies: sc.enemies.length, projs: sc.projs.length }; });
  console.log(JSON.stringify(info));
  console.log(errors.join('\n') || 'no errors');
  await browser.close();
})();
