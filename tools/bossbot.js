// Robô simples que luta contra cada chefe (invulnerável) para medir duração da luta
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + e.stack));
  await page.goto('file://' + path.resolve(__dirname, '../dist/kami-quest.html'));
  await page.waitForTimeout(300);
  for (const ph of (process.env.PHS || "0,1,2,3,4").split(",").map(Number)) {
    const r = await page.evaluate((ph) => {
      const P = window.__kami, K = P.Input.keys;
      P.Save.data.started = true; P.Save.data.diff = 1;
      P.Game.party = [{ ci: 0, dev: 'kb1' }];
      P.Game.startPhase(ph); P.warp(6);
      const sc = P.Game.scene, p = sc.players[0];
      p.x += 100; sc.invulnAll = 1e9;
      let frames = 0, hits = 0;
      for (; frames < 60 * 240; frames++) {
        for (const k in K) K[k] = false;
        const b = sc.boss;
        if (!b) { if (frames > 200) break; P.step(1); continue; }
        if (b.dying) break;
        const hb = b.hurtBox(); const bx = hb[0] + hb[2] / 2, by = hb[1] + hb[3] / 2;
        const dx = bx - p.cx, dy = by - p.cy;
        const want = Math.abs(dx) > 110 ? Math.sign(dx) : (Math.abs(dx) < 70 ? -Math.sign(dx) : 0);
        if (want > 0) K.KeyD = true; if (want < 0) K.KeyA = true;
        // mira
        const ang = Math.atan2(dy, dx);
        if (ang < -0.4 && ang > -2.7) K.KeyW = true;
        if (Math.abs(dx) > 8 && !K.KeyD && !K.KeyA) { if (dx > 0) K.KeyD = true; else K.KeyA = true; }
        K.KeyL = true;
        if (frames % 50 === 0) K.KeyJ = true;
        P.step(1);
      }
      return { ph, seconds: +(frames / 60).toFixed(1), dying: !!(sc.boss && sc.boss.dying) || !sc.boss, hp: sc.boss ? Math.round(sc.boss.hp) : 0, max: sc.boss ? sc.boss.maxHp : 0 };
    }, ph);
    console.log(JSON.stringify(r));
  }
  console.log(errors.slice(0, 5).join('\n') || 'no errors');
  await browser.close();
})();
