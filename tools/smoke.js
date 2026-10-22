const { chromium } = require('playwright');
const path = require('path');
const OUT = process.env.OUT || '/tmp/shots';
(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + e.stack));
  await page.goto('file://' + path.resolve(__dirname, '../dist/kami-quest.html'));
  await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + '/00_overlay.png' });
  await page.mouse.click(640, 360);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: OUT + '/01_title.png' });
  // seleção de personagens
  await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  await page.keyboard.press('KeyJ'); await page.waitForTimeout(200);
  await page.keyboard.press('KeyD'); await page.waitForTimeout(200);
  await page.keyboard.press('KeyZ'); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + '/02_select.png' });
  console.log('scene:', await page.evaluate(() => window.__kami.Game.scene.constructor.name));
  console.log(errors.join('\n') || 'no errors');
  await browser.close();
})();
