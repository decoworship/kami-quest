// Entrada aleatória em todas as fases para caçar exceções e posições inválidas
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + e.stack));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../dist/peregrinos.html'));
  await page.waitForTimeout(300);
  for (let ph = 0; ph < 5; ph++) {
    const r = await page.evaluate((ph) => {
      const P = window.__peregrinos, K = P.Input.keys;
      P.Save.data.started = true; P.Save.data.diff = ph % 3;
      P.Save.data.gifts = ph >= 2 ? ['fe', 'cura', 'sabedoria', 'discernimento'] : [];
      P.Game.party = [{ ci: ph % 4, dev: 'kb1' }, { ci: (ph + 1) % 4, dev: 'kb2' }];
      P.Game.startPhase(ph);
      const keys1 = ['KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'KeyU', 'KeyI'];
      const keys2 = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad0', 'Numpad4', 'Numpad5'];
      let bad = null, arenasDone = 0, maxX = 0, deaths = 0;
      const sc0 = P.Game.scene;
      for (const p of sc0.players) p.slots = [P.PHASES && null, null];
      for (let f = 0; f < 60 * 150; f++) {
        if (f % 6 === 0) {
          for (const k of keys1.concat(keys2)) K[k] = false;
          // tendência de andar para a direita
          K[Math.random() < 0.7 ? 'KeyD' : 'KeyA'] = true; K[Math.random() < 0.7 ? 'ArrowRight' : 'ArrowLeft'] = true;
          for (let i = 0; i < 3; i++) { K[keys1[4 + Math.floor(Math.random() * 6)]] = true; K[keys2[4 + Math.floor(Math.random() * 6)]] = true; }
          if (Math.random() < 0.3) K.KeyW = true; if (Math.random() < 0.2) K.KeyS = true;
        }
        const sc = P.Game.scene;
        if (sc.constructor.name !== 'PlayScene') break;
        if (sc.modal) sc.modal.t = 999, K.KeyJ = true;
        P.step(1);
        for (const p of sc.players) {
          if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.vx) || !isFinite(p.vy)) bad = 'player NaN';
          if (p.state === 'alive' && P.LV && (function () { return false; })()) bad = 'x';
          maxX = Math.max(maxX, p.x);
        }
        for (const e of sc.enemies) if (!isFinite(e.x) || !isFinite(e.y)) bad = 'enemy NaN ' + e.type;
        if (sc.boss && (!isFinite(sc.boss.x) || !isFinite(sc.boss.y))) bad = 'boss NaN';
        if (sc.respawnT === 1) deaths++;
        // a cada 20 s, avança uma sala para cobrir o nível
        if (f % 1200 === 1199) { const cur = Math.floor(sc.players[0].x / 640); P.warp(Math.min(6, cur + 1)); }
        if (bad) break;
      }
      const sc = P.Game.scene;
      return { ph, bad, maxX: Math.round(maxX), deaths, enemies: sc.enemies ? sc.enemies.length : -1, scene: sc.constructor.name };
    }, ph);
    console.log(JSON.stringify(r));
  }
  console.log(errors.slice(0, 8).join('\n') || 'no errors');
  await browser.close();
})();
