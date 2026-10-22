const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = process.env.OUT || '/tmp/shots';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '../dist/kami-quest.html'));
  await page.waitForTimeout(300);
  for (let ph = 0; ph < 5; ph++) {
    const data = await page.evaluate((ph) => {
      const P = window.__kami;
      P.Game.party = [{ ci: 0, dev: 'kb1' }]; P.Game.startPhase(ph);
      const L = P.LV, c = document.createElement('canvas'); c.width = L.w; c.height = 352;
      const x = c.getContext('2d'); x.fillStyle = '#2a2440'; x.fillRect(0, 0, c.width, c.height); x.drawImage(L.canvas, 0, 0);
      const col = { S: '#00ff00', E: '#ffd86b', C: '#ffffff', P: '#ff00ff', J: '#ff8a3a', B: '#3ad8ff', '1': '#ff3a3a', '2': '#ff7a7a', '3': '#ffaaaa' };
      for (const s of L.spawns) { x.fillStyle = col[s.ch] || '#fff'; x.fillRect(s.c * 16 + 4, s.r * 16 + 4, 8, 8); }
      for (let r = 0; r < 22; r++) for (let cc = 0; cc < L.cols; cc++) { const t = L.grid[r * L.cols + cc]; if (t === 4) { x.fillStyle = '#ffcc00'; x.fillRect(cc * 16 + 2, r * 16 + 2, 12, 12); } if (t === 5) { x.fillStyle = '#aa66ff'; x.fillRect(cc * 16 + 2, r * 16 + 2, 12, 12); } }
      for (const room of L.rooms) { x.fillStyle = 'rgba(255,255,255,0.4)'; x.fillRect(room.x0, 0, 1, 352); for (const p of room.portals) { x.fillStyle = '#8a3aff'; x.fillRect(p.x - 4, p.y - 4, 8, 8); } }
      return c.toDataURL('image/png');
    }, ph);
    fs.writeFileSync(`${OUT}/level${ph}.png`, Buffer.from(data.split(',')[1], 'base64'));
  }
  await browser.close();
  console.log('ok');
})();
