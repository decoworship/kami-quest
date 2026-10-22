// Percorre todas as fases: salas, arena e chefe (jogadores invulneráveis e atirando)
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.env.OUT || '/tmp/shots';
const PHS = (process.env.PHS || '0,1,2,3,4').split(',').map(Number);
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + e.stack));
  await page.goto('file://' + path.resolve(__dirname, '../dist/peregrinos.html'));
  await page.waitForTimeout(400);
  await page.mouse.click(640, 360);
  for (const PH of PHS) {
    await page.evaluate((ph) => {
      const P = window.__peregrinos;
      P.Save.data.started = true; P.Save.data.unlocked = 5;
      P.Game.party = [{ ci: 1, dev: 'kb1' }, { ci: 2, dev: 'kb2' }];
      P.Game.startPhase(ph);
    }, PH);
    await page.waitForTimeout(700);
    for (const r of [1, 3, 5]) {
      await page.evaluate((r) => window.__peregrinos.warp(r), r);
      await page.waitForTimeout(500);
      await page.evaluate((r) => { const P = window.__peregrinos, sc = P.Game.scene, room = P.LV.rooms[r]; sc.cam = room.x0; for (const p of sc.players) p.x = room.x0 + 200 + p.slot * 20; }, r);
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${OUT}/t${PH}_room${r}.png` });
    }
    // arena
    await page.evaluate(() => { window.__peregrinos.warp(2); const sc = window.__peregrinos.Game.scene; sc.invulnAll = 1e9; for (const p of sc.players) p.x += 100; });
    await page.keyboard.down('KeyL'); await page.keyboard.down('Numpad3');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${OUT}/t${PH}_arena.png` });
    // chefe
    await page.evaluate(() => { window.__peregrinos.warp(6); const sc = window.__peregrinos.Game.scene; sc.invulnAll = 1e9; for (const p of sc.players) p.x += 100; });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: `${OUT}/t${PH}_boss_intro.png` });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${OUT}/t${PH}_boss_a.png` });
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${OUT}/t${PH}_boss_b.png` });
    await page.keyboard.up('KeyW');
    const info = await page.evaluate(() => { const sc = window.__peregrinos.Game.scene; return { boss: sc.boss && sc.boss.state, hp: sc.boss && Math.round(sc.boss.hp), max: sc.boss && sc.boss.maxHp, enemies: sc.enemies.length, projs: sc.projs.length }; });
    console.log('phase', PH, JSON.stringify(info));
    // força a derrota do chefe para ver a sequência final
    await page.evaluate(() => { const sc = window.__peregrinos.Game.scene; if (sc.boss) sc.boss.hurt(99999, sc); });
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `${OUT}/t${PH}_boss_dead.png` });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${OUT}/t${PH}_portal.png` });
    await page.keyboard.up('KeyL'); await page.keyboard.up('Numpad3');
  }
  console.log(errors.slice(0, 20).join('\n') || 'no errors');
  await browser.close();
})();
