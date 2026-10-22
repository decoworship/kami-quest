const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + e.stack));
  await page.goto('file://' + path.resolve(__dirname, '../dist/kami-quest.html'));
  await page.waitForTimeout(300);
  const res = await page.evaluate(() => {
    const P = window.__kami, I = P.Input;
    P.Save.data.started = true;
    P.Game.party = [{ ci: 0, dev: 'kb1' }];
    P.Game.startPhase(0);
    const sc = P.Game.scene, p = sc.players[0];
    const keys = I.keys;
    const reset = (x = 200) => { for (const k in keys) keys[k] = false; p.x = x; p.y = 18 * 16 - 12 + 4; p.vx = 0; p.vy = 0; p.rx = 0; p.ry = 0; p.dashT = 0; p.dashCd = 0; p.swordT = 0; sc.enemies = []; P.step(20); };
    const out = {};
    // salto segurando
    reset(); const y0 = p.y; let minY = p.y;
    keys.KeyJ = true; for (let i = 0; i < 60; i++) { P.step(1); minY = Math.min(minY, p.y); } keys.KeyJ = false;
    out.jumpHold = y0 - minY;
    // salto curto (toque)
    reset(); minY = p.y; keys.KeyJ = true; P.step(2); keys.KeyJ = false; for (let i = 0; i < 60; i++) { P.step(1); minY = Math.min(minY, p.y); }
    out.jumpTap = y0 - minY;
    // corrida
    reset(); keys.KeyD = true; let maxV = 0, f = 0; for (let i = 0; i < 40; i++) { P.step(1); maxV = Math.max(maxV, p.vx); if (p.vx >= 2.2 && !f) f = i; } keys.KeyD = false;
    out.runMax = maxV; out.framesToMax = f;
    // distância de salto correndo
    reset(80); keys.KeyD = true; P.step(25); const x0 = p.x; keys.KeyJ = true; P.step(1); let landed = false, t = 0; while (!landed && t < 120) { P.step(1); t++; if (t > 5 && p.grounded) landed = true; } keys.KeyJ = false; keys.KeyD = false;
    out.runJumpDist = p.x - x0; out.airFrames = t;
    // dash
    reset(); const dx0 = p.x; keys.Semicolon = true; P.step(1); keys.Semicolon = false; P.step(20);
    out.dashDist = p.x - dx0;
    // salto longo (dash + pulo)
    reset(80); const lx0 = p.x; keys.KeyD = true; keys.Semicolon = true; P.step(2); keys.Semicolon = false; keys.KeyJ = true; P.step(1); t = 0; landed = false; while (!landed && t < 120) { P.step(1); t++; if (t > 5 && p.grounded) landed = true; } keys.KeyJ = false; keys.KeyD = false;
    out.dashJumpDist = p.x - lx0;
    // dash para cima no ar
    reset(); minY = p.y; keys.KeyJ = true; P.step(14); keys.KeyW = true; keys.Semicolon = true; P.step(1); keys.Semicolon = false; for (let i = 0; i < 40; i++) { P.step(1); minY = Math.min(minY, p.y); } keys.KeyW = false; keys.KeyJ = false;
    out.jumpPlusUpDash = y0 - minY;
    // parede: escorregar e pular (parede esquerda do nível em x=32)
    reset(40); keys.KeyJ = true; keys.KeyA = true; P.step(3); keys.KeyJ = false; P.step(30);
    out.wallSlide = { wallDir: p.wallDir, sliding: p.sliding, vy: +p.vy.toFixed(2) };
    keys.KeyJ = true; P.step(1); out.wallJump = { vx: +p.vx.toFixed(2), vy: +p.vy.toFixed(2) }; keys.KeyJ = false; keys.KeyA = false;
    // tiro e espada
    reset(); keys.KeyL = true; P.step(30); keys.KeyL = false; out.projs = sc.projs.length;
    keys.KeyK = true; P.step(1); keys.KeyK = false; out.swordT = p.swordT;
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  console.log(errors.join('\n') || 'no errors');
  await browser.close();
})();
