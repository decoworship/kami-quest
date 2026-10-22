// ============================================================
//  Renderização: cenários em paralaxe, luz/escuridão, névoa, HUD
// ============================================================
const BGCACHE = {};
const BG_LW = 1280; // largura das camadas (repetem sem emenda)
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---------- ajudantes de desenho das camadas ----------
// repete o desenho nas bordas para a camada emendar sem costura
function seam(fn) { fn(0); fn(BG_LW); fn(-BG_LW); }
function ridge(ctx, col, base, waves, rnd, jag = 0) {
  ctx.fillStyle = col;
  const ph = waves.map(() => rnd() * Math.PI * 2);
  for (let x = 0; x < BG_LW; x++) {
    let y = base;
    waves.forEach(([amp, n], i) => { y += Math.sin(x / BG_LW * Math.PI * 2 * n + ph[i]) * amp; });
    if (jag) y += (hash2(x >> 1, base) - 0.5) * jag;
    ctx.fillRect(x, Math.round(y), 1, H - Math.round(y));
  }
}
function roundTree(ctx, x, y, h, r, col, light) {
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x - 1.5), Math.round(y - h), 3, h);
  ctx.beginPath(); ctx.arc(x, y - h - r * 0.6, r, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x - r * 0.7, y - h - r * 0.1, r * 0.7, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.7, y - h - r * 0.2, r * 0.75, 0, 7); ctx.fill();
  if (light) { ctx.fillStyle = light; ctx.beginPath(); ctx.arc(x - r * 0.3, y - h - r * 1.05, r * 0.45, Math.PI, 0); ctx.fill(); }
}
function poplar(ctx, x, y, h, w, col) {
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x - 1), Math.round(y - h * 0.25), 2, Math.round(h * 0.25));
  ctx.beginPath(); ctx.ellipse(x, y - h * 0.6, w, h * 0.45, 0, 0, 7); ctx.fill();
}
function house(ctx, x, y, w, h, col, win) {
  ctx.fillStyle = col;
  ctx.fillRect(x, y - h, w, h);
  ctx.beginPath(); ctx.moveTo(x - 2, y - h); ctx.lineTo(x + w / 2, y - h - w * 0.55); ctx.lineTo(x + w + 2, y - h); ctx.fill();
  ctx.fillRect(x + w - 5, y - h - w * 0.5, 3, w * 0.35);
  if (win) { ctx.fillStyle = win; ctx.fillRect(x + 3, y - h + 3, 2, 3); if (w > 12) ctx.fillRect(x + w - 6, y - h + 3, 2, 3); }
}
function deadTree(ctx, rnd, x, y, len, a, d, col) {
  if (d <= 0) return;
  const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
  ctx.strokeStyle = col; ctx.lineWidth = d; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
  deadTree(ctx, rnd, x2, y2, len * 0.7, a - 0.45 - rnd() * 0.3, d - 1, col);
  deadTree(ctx, rnd, x2, y2, len * 0.7, a + 0.35 + rnd() * 0.3, d - 1, col);
}
function dots(ctx, rnd, n, col, y0, y1, size = 1) {
  ctx.fillStyle = col;
  for (let i = 0; i < n; i++) ctx.fillRect(Math.floor(rnd() * BG_LW), Math.floor(y0 + rnd() * (y1 - y0)), size, size);
}

function buildBackground(th) {
  if (BGCACHE[th.bg]) return BGCACHE[th.bg];
  const rnd = mulberry32(th.bg.length * 991 + 7);
  const sky = mkCanvas(W, H), sx = sky.getContext('2d');
  const gr = sx.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, th.sky[0]); gr.addColorStop(0.55, th.sky[1]); gr.addColorStop(1, th.sky[2]);
  sx.fillStyle = gr; sx.fillRect(0, 0, W, H);
  // tons das camadas: quanto mais longe, mais perto da cor do céu (perspectiva atmosférica)
  const C = [mixHex(th.sky[1], th.far, 0.3), mixHex(th.sky[1], th.far, 0.62), th.far, th.mid, th.near];
  const hi = k => mixHex(C[k], th.sky[2], 0.18); // realce discreto
  const warm = a => `rgba(255,214,150,${a})`;
  if (th.bg === 'hills' || th.bg === 'towers' || th.bg === 'shadow') {
    for (let i = 0; i < 110; i++) { sx.fillStyle = `rgba(255,250,235,${(0.15 + rnd() * 0.5) * (th.bg === 'shadow' ? 0.5 : 1)})`; sx.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * H * 0.55), 1, 1); }
  }
  if (th.bg === 'hills') {
    sx.fillStyle = 'rgba(240,232,255,0.1)'; sx.beginPath(); sx.arc(480, 70, 32, 0, 7); sx.fill();
    sx.fillStyle = '#e4dcf0'; sx.beginPath(); sx.arc(480, 70, 18, 0, 7); sx.fill();
    sx.fillStyle = '#cfc6e0'; sx.beginPath(); sx.arc(486, 76, 5, 0, 7); sx.fill(); sx.beginPath(); sx.arc(474, 64, 3, 0, 7); sx.fill();
    sx.fillStyle = '#bdb3d2'; sx.fillRect(472, 68, 5, 1); sx.fillRect(484, 68, 5, 1); sx.fillRect(477, 77, 6, 1);
  }
  if (th.bg === 'cave') {
    const g2 = sx.createLinearGradient(0, H * 0.55, 0, H); g2.addColorStop(0, 'rgba(255,90,30,0)'); g2.addColorStop(1, 'rgba(255,90,30,0.28)');
    sx.fillStyle = g2; sx.fillRect(0, H * 0.55, W, H * 0.45);
  }
  if (th.bg === 'shadow') {
    const g2 = sx.createRadialGradient(430, 236, 4, 430, 236, 140); g2.addColorStop(0, 'rgba(230,120,80,0.32)'); g2.addColorStop(1, 'rgba(230,120,80,0)');
    sx.fillStyle = g2; sx.fillRect(0, 0, W, H);
    sx.fillStyle = 'rgba(170,80,55,0.55)'; sx.beginPath(); sx.arc(430, 236, 22, 0, 7); sx.fill();
  }
  if (th.bg === 'towers') {
    const g2 = sx.createRadialGradient(W * 0.5, H * 0.95, 10, W * 0.5, H * 0.95, 360); g2.addColorStop(0, 'rgba(255,200,120,0.18)'); g2.addColorStop(1, 'rgba(255,200,120,0)');
    sx.fillStyle = g2; sx.fillRect(0, 0, W, H);
  }
  // nuvens suaves (camada própria, desliza devagar)
  const clouds = mkCanvas(BG_LW, H), cx = clouds.getContext('2d');
  const cloudCol = th.bg === 'cave' ? 'rgba(255,140,90,0.05)' : th.bg === 'abyss' ? 'rgba(120,220,255,0.04)' : 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 16; i++) {
    const x = rnd() * BG_LW, y = 30 + rnd() * 150, w = 50 + rnd() * 110;
    seam(d => { cx.fillStyle = cloudCol; for (let k = 0; k < 4; k++) { cx.beginPath(); cx.ellipse(x + d + (k - 1.5) * w * 0.22, y + Math.sin(k * 1.7) * 3, w * 0.28, 6 + rnd() * 4, 0, 0, 7); cx.fill(); } });
  }
  const L = [0, 1, 2, 3].map(() => mkCanvas(BG_LW, H));
  const X = L.map(c => c.getContext('2d'));

  if (th.bg === 'hills') {
    // 0: cordilheira distante
    ridge(X[0], C[0], 200, [[26, 3], [12, 7], [5, 17]], rnd, 2);
    // 1: colinas com vilarejo adormecido
    ridge(X[1], C[1], 238, [[14, 4], [7, 9]], rnd);
    for (let i = 0; i < 9; i++) { const x = Math.floor(rnd() * BG_LW), y = 236 + Math.floor(rnd() * 10); seam(d => house(X[1], x + d, y, 10 + Math.floor(rnd() * 6), 7 + Math.floor(rnd() * 4), C[1], rnd() < 0.5 ? warm(0.22) : null)); }
    for (let i = 0; i < 26; i++) { const x = rnd() * BG_LW; seam(d => poplar(X[1], x + d, 246, 20 + rnd() * 10, 4, C[1])); }
    // 2: árvores redondas, rede de dormir, cercas
    ridge(X[2], C[2], 268, [[10, 5], [5, 11]], rnd);
    for (let i = 0; i < 14; i++) {
      const x = rnd() * BG_LW, y = 268 + rnd() * 6, h = 14 + rnd() * 12, r = 12 + rnd() * 9;
      seam(d => roundTree(X[2], x + d, y, h, r, C[2], hi(2)));
      if (i % 4 === 0) seam(d => { X[2].strokeStyle = C[2]; X[2].lineWidth = 2; X[2].beginPath(); X[2].moveTo(x + d, y - h + 4); X[2].quadraticCurveTo(x + d + 34, y - h + 20, x + d + 68, y - h + 4); X[2].stroke(); });
    }
    for (let i = 0; i < 10; i++) { const x = Math.floor(rnd() * BG_LW); seam(d => { X[2].fillStyle = C[2]; for (let k = 0; k < 6; k++) X[2].fillRect(x + d + k * 6, 262, 2, 12); X[2].fillRect(x + d, 265, 32, 1); }); }
    // 3: arbustos e capim próximos
    ridge(X[3], C[3], 300, [[6, 6], [3, 15]], rnd, 3);
    for (let i = 0; i < 40; i++) { const x = rnd() * BG_LW, r = 5 + rnd() * 8; seam(d => { X[3].fillStyle = C[3]; X[3].beginPath(); X[3].arc(x + d, 298, r, Math.PI, 0); X[3].fill(); X[3].fillStyle = hi(3); X[3].fillRect(Math.round(x + d - 1), Math.round(298 - r), 3, 1); }); }
  } else if (th.bg === 'towers') {
    // 0: horizonte de cúpulas e torres
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(rnd() * BG_LW), w = 14 + Math.floor(rnd() * 26), h = 50 + Math.floor(rnd() * 90), y = 250 - h, dome = rnd() < 0.35;
      seam(d => { X[0].fillStyle = C[0]; X[0].fillRect(x + d, y, w, H - y); if (dome) { X[0].beginPath(); X[0].arc(x + d + w / 2, y, w / 2, Math.PI, 0); X[0].fill(); X[0].fillRect(x + d + w / 2 - 1, y - w / 2 - 8, 2, 8); } else { X[0].beginPath(); X[0].moveTo(x + d - 2, y); X[0].lineTo(x + d + w / 2, y - 14 - rnd() * 16); X[0].lineTo(x + d + w + 2, y); X[0].fill(); } });
    }
    dots(X[0], rnd, 120, warm(0.18), 140, 250, 1);
    // 1: torres altas, roda-gigante, estandartes
    for (let i = 0; i < 16; i++) {
      const x = Math.floor(rnd() * BG_LW), w = 18 + Math.floor(rnd() * 22), h = 120 + Math.floor(rnd() * 110), y = H - h;
      seam(d => {
        X[1].fillStyle = C[1]; X[1].fillRect(x + d, y, w, h);
        X[1].beginPath(); X[1].moveTo(x + d - 3, y); X[1].lineTo(x + d + w / 2, y - 16 - rnd() * 18); X[1].lineTo(x + d + w + 3, y); X[1].fill();
        X[1].fillStyle = hi(1); X[1].fillRect(x + d, y, 1, h);
        for (let k = 0; k < 8; k++) if (rnd() < 0.55) { X[1].fillStyle = warm(0.16 + rnd() * 0.16); X[1].fillRect(x + d + 3 + Math.floor(rnd() * (w - 6)), y + 10 + Math.floor(rnd() * (h - 30)), 2, 3); }
        if (rnd() < 0.5) { X[1].fillStyle = mixHex(C[1], '#a04060', 0.25); X[1].fillRect(x + d + w, y + 14, 8, 14); X[1].fillRect(x + d + w, y + 28, 4, 3); }
      });
    }
    const wx = 900, wy = 190, wr = 62;
    seam(d => {
      const c = X[1]; c.strokeStyle = C[1]; c.lineWidth = 2; c.beginPath(); c.arc(wx + d, wy, wr, 0, 7); c.stroke();
      c.lineWidth = 1; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; c.beginPath(); c.moveTo(wx + d, wy); c.lineTo(wx + d + Math.cos(a) * wr, wy + Math.sin(a) * wr); c.stroke(); c.fillStyle = C[1]; c.fillRect(Math.round(wx + d + Math.cos(a) * wr - 3), Math.round(wy + Math.sin(a) * wr), 6, 5); }
      c.lineWidth = 3; c.beginPath(); c.moveTo(wx + d - 30, H); c.lineTo(wx + d, wy); c.lineTo(wx + d + 30, H); c.stroke();
    });
    // 2: barracas com toldos listrados, bandeirolas, lanternas
    for (let i = 0; i < 13; i++) {
      const x = i * 98 + Math.floor(rnd() * 30), y = 292, w = 56 + Math.floor(rnd() * 20);
      seam(d => {
        const c = X[2]; c.fillStyle = C[2]; c.fillRect(x + d + 4, y - 24, w - 8, 60);
        for (let k = 0; k < w; k += 8) { c.fillStyle = (k / 8) % 2 ? C[2] : mixHex(C[2], th.sky[2], 0.12); c.beginPath(); c.moveTo(x + d + k, y - 30); c.lineTo(x + d + k + 8, y - 30); c.lineTo(x + d + k + 8, y - 22); c.arc(x + d + k + 4, y - 22, 4, 0, Math.PI); c.fill(); }
        c.fillStyle = C[2]; c.beginPath(); c.moveTo(x + d - 2, y - 30); c.lineTo(x + d + w / 2, y - 44); c.lineTo(x + d + w + 2, y - 30); c.fill();
        c.fillStyle = warm(0.14); c.fillRect(x + d + 10, y - 18, w - 20, 6);
      });
    }
    for (let i = 0; i < 10; i++) {
      const x = i * 128 + rnd() * 40, y = 214 + rnd() * 20;
      seam(d => { const c = X[2]; c.strokeStyle = C[2]; c.lineWidth = 1; c.beginPath(); c.moveTo(x + d, y); c.quadraticCurveTo(x + d + 60, y + 18, x + d + 120, y); c.stroke(); for (let k = 1; k < 8; k++) { const u = k / 8, fx = x + d + u * 120, fy = y + Math.sin(u * Math.PI) * 9; c.fillStyle = [mixHex(C[2], '#c84050', 0.35), mixHex(C[2], '#e8c050', 0.3), mixHex(C[2], '#4a80c8', 0.3)][k % 3]; c.beginPath(); c.moveTo(fx - 3, fy); c.lineTo(fx + 3, fy); c.lineTo(fx, fy + 6); c.fill(); } c.fillStyle = warm(0.35); c.fillRect(Math.round(x + d + 60), Math.round(y + 10), 2, 3); });
    }
    // 3: caixotes, barris e postes
    for (let i = 0; i < 30; i++) {
      const x = Math.floor(rnd() * BG_LW), k = rnd();
      seam(d => { const c = X[3]; c.fillStyle = C[3]; if (k < 0.4) { c.fillRect(x + d, 290, 14, 14); c.fillStyle = hi(3); c.fillRect(x + d, 290, 14, 1); } else if (k < 0.75) { c.beginPath(); c.ellipse(x + d + 6, 296, 6, 9, 0, 0, 7); c.fill(); } else { c.fillRect(x + d, 250, 2, 60); c.fillStyle = warm(0.3); c.fillRect(x + d - 2, 248, 6, 4); } });
    }
    ridge(X[3], C[3], 304, [[2, 9]], rnd);
  } else if (th.bg === 'cave') {
    // 0: parede funda com cortinas de estalactites
    X[0].fillStyle = C[0];
    for (let x = 0; x < BG_LW; x += 10 + Math.floor(rnd() * 14)) { const h = 40 + rnd() * 120, xx = x; seam(d => { X[0].beginPath(); X[0].moveTo(xx + d - 2, 0); X[0].lineTo(xx + d + 7, h); X[0].lineTo(xx + d + 16, 0); X[0].fill(); }); }
    ridge(X[0], C[0], 250, [[18, 3], [8, 8]], rnd, 6);
    // 1: colunas de rocha com rachaduras que brilham fraco
    for (let i = 0; i < 12; i++) {
      const x = Math.floor(rnd() * BG_LW), w = 20 + Math.floor(rnd() * 24);
      seam(d => { const c = X[1]; c.fillStyle = C[1]; c.fillRect(x + d, 0, w, H); c.beginPath(); c.moveTo(x + d - 10, 0); c.lineTo(x + d + w / 2, 40); c.lineTo(x + d + w + 10, 0); c.fill(); c.beginPath(); c.moveTo(x + d - 12, H); c.lineTo(x + d + w / 2, H - 50); c.lineTo(x + d + w + 12, H); c.fill(); c.fillStyle = hi(1); c.fillRect(x + d, 0, 1, H); for (let k = 0; k < 3; k++) { c.fillStyle = 'rgba(255,120,50,0.14)'; let yy = 60 + rnd() * 220, xx = x + d + w * 0.3 + rnd() * w * 0.4; for (let s = 0; s < 6; s++) { c.fillRect(Math.round(xx), Math.round(yy), 1, 4); xx += rnd() * 2 - 1; yy += 4; } } });
    }
    // 2: rochas recortadas e raízes amargas
    ridge(X[2], C[2], 280, [[16, 5], [6, 13]], rnd, 8);
    for (let i = 0; i < 18; i++) { const x = rnd() * BG_LW, h = 30 + rnd() * 70; seam(d => { X[2].fillStyle = C[2]; X[2].beginPath(); X[2].moveTo(x + d - 8, 0); X[2].lineTo(x + d, h); X[2].lineTo(x + d + 8, 0); X[2].fill(); }); }
    for (let i = 0; i < 8; i++) { const x = rnd() * BG_LW; seam(d => { const c = X[2]; c.strokeStyle = C[2]; c.lineWidth = 2; c.beginPath(); c.moveTo(x + d, 0); let yy = 0, xx = x + d; for (let s = 0; s < 8; s++) { xx += rnd() * 16 - 8; yy += 12; c.lineTo(xx, yy); } c.stroke(); }); }
    // 3: estalagmites e entulho próximos
    for (let i = 0; i < 30; i++) { const x = rnd() * BG_LW, h = 16 + rnd() * 40, w = 6 + rnd() * 8; seam(d => { X[3].fillStyle = C[3]; X[3].beginPath(); X[3].moveTo(x + d - w, 312); X[3].lineTo(x + d, 312 - h); X[3].lineTo(x + d + w, 312); X[3].fill(); X[3].fillStyle = 'rgba(255,110,40,0.12)'; X[3].fillRect(Math.round(x + d), Math.round(312 - h + 6), 1, Math.round(h - 8)); }); }
    ridge(X[3], C[3], 306, [[3, 11]], rnd, 4);
  } else if (th.bg === 'abyss') {
    // 0: arcos de rocha distantes e plâncton
    for (let i = 0; i < 6; i++) { const x = rnd() * BG_LW, r = 50 + rnd() * 50; seam(d => { const c = X[0]; c.strokeStyle = C[0]; c.lineWidth = 12; c.beginPath(); c.arc(x + d, 300, r, Math.PI, 0); c.stroke(); }); }
    ridge(X[0], C[0], 290, [[14, 4], [6, 11]], rnd);
    dots(X[0], rnd, 90, 'rgba(95,240,224,0.25)', 20, 340);
    // 1: floresta de algas
    for (let i = 0; i < 46; i++) {
      const x = rnd() * BG_LW, h = 90 + rnd() * 190, ph = rnd() * 6;
      seam(d => { const c = X[1]; c.strokeStyle = C[1]; c.lineWidth = 3; c.beginPath(); c.moveTo(x + d, H); for (let y = 0; y < h; y += 8) c.lineTo(x + d + Math.sin(y * 0.05 + ph) * 6, H - y); c.stroke(); for (let y = 20; y < h; y += 22) { c.fillStyle = C[1]; c.beginPath(); c.ellipse(x + d + Math.sin(y * 0.05 + ph) * 6 + 5, H - y, 5, 2, 0.5, 0, 7); c.fill(); } });
    }
    // 2: corais e rochas
    ridge(X[2], C[2], 300, [[10, 5], [5, 13]], rnd, 5);
    for (let i = 0; i < 16; i++) { const x = rnd() * BG_LW; seam(d => { const c = X[2]; c.fillStyle = C[2]; for (let k = 0; k < 4; k++) c.fillRect(Math.round(x + d + k * 5), Math.round(300 - 12 - rnd() * 22), 3, 40); c.fillStyle = 'rgba(95,240,224,0.12)'; c.fillRect(Math.round(x + d), 276, 1, 1); }); }
    for (let i = 0; i < 8; i++) { const x = rnd() * BG_LW, r = 30 + rnd() * 30; seam(d => { X[2].fillStyle = C[2]; X[2].beginPath(); X[2].arc(x + d, 0, r, 0, Math.PI); X[2].fill(); }); }
    // 3: folhas de alga próximas
    for (let i = 0; i < 20; i++) { const x = rnd() * BG_LW, h = 40 + rnd() * 60, ph = rnd() * 6; seam(d => { const c = X[3]; c.strokeStyle = C[3]; c.lineWidth = 4; c.beginPath(); c.moveTo(x + d, H); for (let y = 0; y < h; y += 6) c.lineTo(x + d + Math.sin(y * 0.08 + ph) * 5, H - y); c.stroke(); }); }
  } else if (th.bg === 'shadow') {
    // 0: penhascos recortados na névoa
    ridge(X[0], C[0], 206, [[30, 2], [16, 5], [8, 13]], rnd, 18);
    // 1: cidade em ruínas
    for (let i = 0; i < 18; i++) {
      const x = Math.floor(rnd() * BG_LW), w = 16 + Math.floor(rnd() * 26), h = 40 + Math.floor(rnd() * 90), y = 262 - h, broken = rnd();
      seam(d => { const c = X[1]; c.fillStyle = C[1]; c.fillRect(x + d, y, w, H - y); c.beginPath(); c.moveTo(x + d, y); c.lineTo(x + d + w * broken, y - 10 - broken * 10); c.lineTo(x + d + w, y + 6); c.fill(); c.fillStyle = mixHex(C[1], th.sky[0], 0.4); for (let k = 0; k < 3; k++) c.fillRect(x + d + 4 + k * 6, y + 12, 3, 6); });
    }
    for (let i = 0; i < 5; i++) { const x = Math.floor(rnd() * BG_LW); seam(d => { const c = X[1]; c.strokeStyle = C[1]; c.lineWidth = 5; c.beginPath(); c.arc(x + d + 20, 262, 20, Math.PI, 0); c.stroke(); }); }
    ridge(X[1], C[1], 262, [[4, 7]], rnd);
    // 2: árvores secas e colunas partidas
    ridge(X[2], C[2], 290, [[10, 5], [4, 12]], rnd);
    for (let i = 0; i < 10; i++) { const x = rnd() * BG_LW, l = 24 + rnd() * 16, a = -Math.PI / 2 + rnd() * 0.3 - 0.15; seam(d => deadTree(X[2], mulberry32(i * 31 + 5), x + d, 290, l, a, 4, C[2])); }
    for (let i = 0; i < 7; i++) { const x = Math.floor(rnd() * BG_LW), h = 30 + Math.floor(rnd() * 50); seam(d => { const c = X[2]; c.fillStyle = C[2]; c.fillRect(x + d, 292 - h, 12, h); c.fillRect(x + d - 3, 292 - h, 18, 4); c.fillStyle = hi(2); c.fillRect(x + d, 292 - h + 4, 1, h - 4); }); }
    // 3: espinheiros e estacas tortas
    ridge(X[3], C[3], 306, [[4, 9]], rnd, 4);
    for (let i = 0; i < 24; i++) { const x = rnd() * BG_LW; seam(d => { const c = X[3]; c.strokeStyle = C[3]; c.lineWidth = 1; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(x + d, 306); c.lineTo(x + d + (rnd() - 0.5) * 22, 306 - 6 - rnd() * 14); c.stroke(); } }); }
    for (let i = 0; i < 10; i++) { const x = Math.floor(rnd() * BG_LW); seam(d => { X[3].fillStyle = C[3]; X[3].fillRect(x + d, 284, 2, 24); X[3].fillRect(x + d - 3, 288, 8, 1); }); }
  }
  const fog = mkCanvas(640, 200), fgx = fog.getContext('2d');
  for (let i = 0; i < 70; i++) { const x = rnd() * 640, y = 40 + rnd() * 120, r = 20 + rnd() * 40; const g3 = fgx.createRadialGradient(x, y, 0, x, y, r); const fc = th.fog || '200,200,215'; g3.addColorStop(0, `rgba(${fc},0.16)`); g3.addColorStop(1, `rgba(${fc},0)`); fgx.fillStyle = g3; fgx.fillRect(x - r, y - r, r * 2, r * 2); }
  // névoa de profundidade entre as camadas
  const haze = mkCanvas(W, H), hz = haze.getContext('2d');
  const hg = hz.createLinearGradient(0, 150, 0, 320);
  hg.addColorStop(0, rgba(th.sky[1], 0)); hg.addColorStop(0.6, rgba(th.sky[2], 0.22)); hg.addColorStop(1, rgba(th.sky[2], 0));
  hz.fillStyle = hg; hz.fillRect(0, 0, W, H);
  const res = { sky, clouds, layers: L, fog, haze };
  BGCACHE[th.bg] = res;
  return res;
}

const BG_PARALLAX = [0.05, 0.12, 0.22, 0.36];
function drawBackground(th, cam, t, o = {}) {
  const b = buildBackground(th);
  G.drawImage(b.sky, 0, 0);
  if (o.dawn) { G.globalAlpha = o.dawn; const gr = G.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3a4a8a'); gr.addColorStop(0.6, '#f0a070'); gr.addColorStop(1, '#ffe0a0'); G.fillStyle = gr; G.fillRect(0, 0, W, H); G.globalAlpha = 1; }
  const lay = (img, k, extra = 0) => { const off = Math.floor(-mod(cam * k + extra, BG_LW)); G.drawImage(img, off, 0); G.drawImage(img, off + BG_LW, 0); };
  lay(b.clouds, 0.02, t * 0.06);
  lay(b.layers[0], BG_PARALLAX[0]);
  if (o.cross != null) drawCrossHill(o.cross, o.dawn || 0);
  G.drawImage(b.haze, 0, 0);
  lay(b.layers[1], BG_PARALLAX[1]);
  if (th.bg === 'hills') { G.globalAlpha = 0.07 + 0.02 * Math.sin(t * 0.01); G.fillStyle = '#e8e0ff'; const y = 250 + Math.sin(t * 0.004) * 4; G.fillRect(0, y, W, 10); G.fillRect(0, y + 4, W, 4); G.globalAlpha = 1; }
  if (th.bg === 'abyss') { G.globalAlpha = 0.05 + 0.03 * Math.sin(t * 0.02); G.fillStyle = '#8af0ff'; for (let i = 0; i < 4; i++) { const x = mod(i * 190 - cam * 0.05, 760) - 60; G.beginPath(); G.moveTo(x, 0); G.lineTo(x + 40, 0); G.lineTo(x + 140, H); G.lineTo(x + 80, H); G.fill(); } G.globalAlpha = 1; }
  G.globalAlpha = 0.6; G.drawImage(b.haze, 0, 0); G.globalAlpha = 1;
  lay(b.layers[2], BG_PARALLAX[2]);
  lay(b.layers[3], BG_PARALLAX[3]);
  if (th.bg === 'cave') { G.globalAlpha = 0.1 + 0.05 * Math.sin(t * 0.03); G.fillStyle = '#ff6a2a'; G.fillRect(0, H - 40, W, 40); G.globalAlpha = 1; }
}
function drawCrossHill(screenX, dawn) {
  const x = Math.round(screenX), base = 300;
  G.fillStyle = mixHex('#2a2930', '#5a4040', dawn);
  G.beginPath(); G.moveTo(x - 220, H); G.quadraticCurveTo(x, base - 150, x + 220, H); G.fill();
  const cy = base - 112;
  if (dawn > 0) { const g = G.createRadialGradient(x, cy, 0, x, cy, 120); g.addColorStop(0, `rgba(255,240,190,${0.5 * dawn})`); g.addColorStop(1, 'rgba(255,240,190,0)'); G.fillStyle = g; G.fillRect(x - 120, cy - 120, 240, 240); }
  G.fillStyle = mixHex('#1c1b21', '#3a2420', dawn);
  G.fillRect(x - 3, cy - 46, 6, 70); G.fillRect(x - 20, cy - 32, 40, 5);
}

// Partículas ambientes (espaço da tela)
function ambientParticles(sc) {
  const th = sc.th, k = th.particle;
  if (sc.t % 5 !== 0) return;
  const x = sc.cam + rand(0, W), y = rand(0, WORLD_H);
  if (k === 'fluff') sc.amb.push({ x, y, vx: rand(-0.2, 0.2), vy: rand(-0.25, -0.05), c: 'rgba(230,225,255,0.5)', l: 200, m: 200, s: 1, a: 1, g: 0, fr: 1 });
  else if (k === 'glitter') sc.amb.push({ x, y, vx: 0, vy: rand(0.1, 0.4), c: pick(['#f2cf5b', '#fff2b0', '#ffd0e8']), l: 140, m: 140, s: 1, a: 1, g: 0, fr: 1 });
  else if (k === 'embers') sc.amb.push({ x, y: WORLD_H - 10, vx: rand(-0.3, 0.3), vy: rand(-1.2, -0.4), c: pick(['#ff7a2a', '#ffb43a', '#ff4a1a']), l: 160, m: 160, s: 1, a: 1, g: 0, fr: 1 });
  else if (k === 'plankton') sc.amb.push({ x, y, vx: rand(-0.1, 0.1), vy: rand(-0.15, 0.05), c: pick(['#5ff0e0', '#9a7cff', '#c8fff8']), l: 220, m: 220, s: 1, a: 1, g: 0, fr: 1 });
  else if (k === 'ash') sc.amb.push({ x, y: 0, vx: rand(-0.2, 0.4), vy: rand(0.2, 0.6), c: pick(['#8a8890', '#5a5860', '#b0aab8']), l: 300, m: 300, s: 1, a: 1, g: 0, fr: 1 });
}

// ------------------------------------------------------------
// Escuridão (Abismo das Ilusões)
// ------------------------------------------------------------
let DARK = null;
function drawDarkness(sc, lights, level) {
  if (!DARK) DARK = mkCanvas(W, H);
  const d = DARK.getContext('2d');
  d.globalCompositeOperation = 'source-over';
  d.clearRect(0, 0, W, H);
  d.fillStyle = `rgba(1,3,12,${level})`; d.fillRect(0, 0, W, H);
  d.globalCompositeOperation = 'destination-out';
  for (const L of lights) {
    const x = L.x - sc.cam, y = L.y + OY, r = L.r * (1 + Math.sin(sc.t * 0.07 + L.x) * 0.03);
    if (x < -r || x > W + r) continue;
    for (const oy of [0, WORLD_H, -WORLD_H]) {
      const yy = y + oy; if (yy < -r || yy > H + r) continue;
      const g = d.createRadialGradient(x, yy, 0, x, yy, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = g; d.fillRect(x - r, yy - r, r * 2, r * 2);
    }
  }
  d.globalCompositeOperation = 'source-over';
  G.imageSmoothingEnabled = true; G.drawImage(DARK, 0, 0); G.imageSmoothingEnabled = false;
}
function drawFog(sc) {
  const b = buildBackground(sc.th);
  G.imageSmoothingEnabled = true;
  G.globalAlpha = 0.55;
  const o1 = -mod(sc.cam * 0.6 + sc.t * 0.25, 640), o2 = -mod(sc.cam * 0.9 - sc.t * 0.15, 640);
  G.drawImage(b.fog, o1, 120); G.drawImage(b.fog, o1 + 640, 120);
  G.globalAlpha = 0.35;
  G.drawImage(b.fog, o2, 20); G.drawImage(b.fog, o2 + 640, 20);
  G.globalAlpha = 1; G.imageSmoothingEnabled = false;
}

// ------------------------------------------------------------
// HUD
// ------------------------------------------------------------
function hudLayout(n) { return [0, 1, 2, 3].slice(0, n).map(i => ({ x: 6 + i * 158, y: 4 })); }
function drawHUD(sc) {
  const lay = hudLayout(sc.players.length);
  sc.players.forEach((p, i) => {
    const { x, y } = lay[i];
    G.fillStyle = 'rgba(8,6,16,0.62)'; G.fillRect(x, y, 150, 24);
    G.fillStyle = p.ch.color; G.fillRect(x, y, 2, 24);
    // retrato
    G.fillStyle = p.ch.pal.hood; G.fillRect(x + 5, y + 4, 14, 16);
    G.fillStyle = p.ch.pal.skin; G.fillRect(x + 8, y + 8, 9, 9);
    G.fillStyle = '#1d1420'; G.fillRect(x + 14, y + 11, 1, 2);
    if (p.ch.pal.beard) { G.fillStyle = p.ch.pal.beard; G.fillRect(x + 11, y + 15, 6, 2); }
    if (p.state === 'down') { G.fillStyle = 'rgba(10,8,20,0.7)'; G.fillRect(x + 5, y + 4, 14, 16); }
    for (let h = 0; h < p.maxHp; h++) drawIcon(h < p.hp ? 'heart' : 'heartE', x + 23 + h * 8, y + 3, h < p.hp ? '#ff5a72' : '#5a4a5a');
    if (p.shield) ring(x + 12, y + 12, 9, '#86dcf7');
    for (let s = 0; s < 2; s++) {
      const bx = x + 23 + s * 12, by = y + 12, act = s === p.active;
      G.fillStyle = act ? '#f4efe4' : '#4a4458'; G.fillRect(bx - 1, by - 1, 11, 11);
      G.fillStyle = '#0c0a16'; G.fillRect(bx, by, 9, 9);
      const f = p.slots[s]; if (f) drawIcon(f, bx + 1, by + 1, FRUITS[f].color);
    }
    for (let l = 0; l < p.louvor; l++) drawIcon('shofar', x + 50 + l * 9, y + 14, '#f2cf5b');
  });
  // contadores da fase
  const by = H - 16;
  G.fillStyle = 'rgba(8,6,16,0.55)'; G.fillRect(4, by - 2, 92, 14);
  drawIcon('scroll', 8, by, '#efe0b4');
  drawIcon('person', 52, by, '#fff3c2');
  if (sc.boss && !sc.boss.dead && sc.boss.state !== 'intro') {
    const bw = 300, bx = (W - bw) / 2, yy = H - 14;
    G.fillStyle = 'rgba(8,6,16,0.7)'; G.fillRect(bx - 2, yy - 2, bw + 4, 9);
    G.fillStyle = '#3a1a2a'; G.fillRect(bx, yy, bw, 5);
    G.fillStyle = sc.boss.phase2 ? '#ff4a5a' : '#c8304a'; G.fillRect(bx, yy, Math.round(bw * sc.boss.hp / sc.boss.maxHp), 5);
    G.fillStyle = 'rgba(255,255,255,0.25)'; G.fillRect(bx, yy, Math.round(bw * sc.boss.hp / sc.boss.maxHp), 1);
  }
}
function drawHUDText(sc) {
  const lay = hudLayout(sc.players.length);
  sc.players.forEach((p, i) => {
    const { x, y } = lay[i];
    txt(t('pShort') + (i + 1), x + 6, y + 14, { size: 6, color: '#f4efe4', weight: 700 });
    if (p.state === 'down') txt(t('hudDown'), x + 50, y + 13, { size: 6, color: '#c8c0d8' });
    else if (p.fruit()) txt(FRUITS[p.fruit()].effect, x + 78, y + 13, { size: 6.5, color: FRUITS[p.fruit()].color });
  });
  const by = H - 16;
  txt(`${sc.stats.scrolls.length}/${LV.scrollCount}`, 18, by - 1, { size: 8, color: '#efe0b4', weight: 600 });
  txt(`${sc.stats.captives.length}/${LV.captiveCount}`, 60, by - 1, { size: 8, color: '#fff3c2', weight: 600 });
  if (sc.boss && !sc.boss.dead && sc.boss.state !== 'intro') txt(LV.ph.bossCard.name, W / 2, H - 25, { size: 8, align: 'center', color: '#ffd0d8', weight: 700 });
}
