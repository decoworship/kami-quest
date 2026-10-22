const { chromium } = require('playwright');
const path = require('path');
const OUT = process.env.OUT || '/tmp/shots';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + e.stack));
  await page.goto('file://' + path.resolve(__dirname, '../dist/peregrinos.html'));
  await page.waitForTimeout(300);
  await page.mouse.click(640, 360);
  await page.evaluate(() => {
    const P = window.__peregrinos;
    P.Save.data.started = true;
    P.Game.party = [{ ci: 0, dev: 'kb1' }, { ci: 1, dev: 'kb2' }, { ci: 2, dev: 'pad0' }, { ci: 3, dev: 'pad1' }];
    P.Input.devs.pad0 = { id: 'pad0', label: 'Controle 1', cur: {}, prev: {}, connected: true };
    P.Input.devs.pad1 = { id: 'pad1', label: 'Controle 2', cur: {}, prev: {}, connected: true };
    P.Game.startPhase(1); P.warp(1);
    const sc = P.Game.scene; sc.banners = []; sc.invulnAll = 1e9;
    const [a, b, c, d] = sc.players;
    a.slots = ['amor', 'alegria']; b.slots = ['fidelidade', null]; c.slots = ['longanimidade', null]; d.slots = ['bondade', null]; d.shield = true;
    sc.players.forEach((p, i) => { p.x = sc.cam + 60 + i * 30; });
  });
  await page.keyboard.down('KeyL'); await page.keyboard.down('Numpad3');
  await page.evaluate(() => { const sc = window.__peregrinos.Game.scene; for (const p of sc.players.slice(2)) p.dev.cur.shoot = true; });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/fx_fruits.png` });
  await page.keyboard.up('KeyL'); await page.keyboard.up('Numpad3');
  // louvor
  await page.keyboard.press('KeyI'); await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/fx_louvor.png` });
  // queda e reviver
  await page.evaluate(() => { const sc = window.__peregrinos.Game.scene; sc.invulnAll = 0; const p = sc.players[1]; p.iframes = 0; p.shield = false; p.hp = 1; p.hurt(sc, p.x + 10); });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/fx_down.png` });
  // vaso voador
  await page.evaluate(() => { const sc = window.__peregrinos.Game.scene; sc.jarT = 1; });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/fx_jar.png` });
  // pergaminho modal
  await page.evaluate(() => { const sc = window.__peregrinos.Game.scene; const s = sc.objs.find(o => o.constructor.name === 'ScrollPick'); if (s) sc.onScroll(s); });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/fx_scroll.png` });
  console.log(errors.join('\n') || 'no errors');
  await browser.close();
})();
