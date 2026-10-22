// ============================================================
//  Renderização: cenários em paralaxe, luz/escuridão, névoa, HUD
// ============================================================
const BGCACHE = {};
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function buildBackground(th) {
  if (BGCACHE[th.bg]) return BGCACHE[th.bg];
  const rnd = mulberry32(th.bg.length * 991 + 7);
  const sky = mkCanvas(W, H), sx = sky.getContext('2d');
  const gr = sx.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, th.sky[0]); gr.addColorStop(0.55, th.sky[1]); gr.addColorStop(1, th.sky[2]);
  sx.fillStyle = gr; sx.fillRect(0, 0, W, H);
  if (th.bg === 'hills' || th.bg === 'towers' || th.bg === 'shadow') {
    for (let i = 0; i < 90; i++) { sx.fillStyle = `rgba(255,250,235,${0.2 + rnd() * 0.6})`; sx.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * H * 0.6), 1, 1); }
  }
  if (th.bg === 'hills') { // lua sonolenta
    sx.fillStyle = 'rgba(240,232,255,0.12)'; sx.beginPath(); sx.arc(480, 70, 30, 0, 7); sx.fill();
    sx.fillStyle = '#e8e0f4'; sx.beginPath(); sx.arc(480, 70, 18, 0, 7); sx.fill();
    sx.fillStyle = '#c8bede'; sx.fillRect(472, 68, 5, 1); sx.fillRect(484, 68, 5, 1); sx.fillRect(477, 76, 6, 1);
  }
  if (th.bg === 'cave') {
    const g2 = sx.createLinearGradient(0, H * 0.6, 0, H); g2.addColorStop(0, 'rgba(255,90,30,0)'); g2.addColorStop(1, 'rgba(255,90,30,0.35)');
    sx.fillStyle = g2; sx.fillRect(0, H * 0.6, W, H * 0.4);
  }
  const LW = 1280;
  const far = mkCanvas(LW, H), fx = far.getContext('2d');
  const mid = mkCanvas(LW, H), mx = mid.getContext('2d');
  const fill = (ctx, c) => { ctx.fillStyle = c; };
  if (th.bg === 'hills') {
    fill(fx, th.far); for (let x = 0; x < LW; x++) { const y = 230 + Math.sin(x / LW * Math.PI * 4) * 22 + Math.sin(x / LW * Math.PI * 10) * 8; fx.fillRect(x, y, 1, H - y); }
    fx.fillStyle = 'rgba(220,210,255,0.06)'; fx.fillRect(0, 238, LW, 16);
    fill(mx, th.mid); for (let x = 0; x < LW; x++) { const y = 275 + Math.sin(x / LW * Math.PI * 6 + 1) * 14; mx.fillRect(x, y, 1, H - y); }
    for (let i = 0; i < 9; i++) {
      const tx = Math.floor(rnd() * LW), ty = 260 + Math.floor(rnd() * 20), r = 14 + Math.floor(rnd() * 10);
      mx.fillStyle = th.mid; mx.fillRect(tx - 2, ty - r, 4, r + 20);
      mx.beginPath(); mx.arc(tx, ty - r - 6, r, 0, 7); mx.fill();
      if (i % 3 === 0) { mx.strokeStyle = th.mid; mx.lineWidth = 2; mx.beginPath(); mx.moveTo(tx, ty - r + 4); mx.quadraticCurveTo(tx + 40, ty - r + 22, tx + 80, ty - r + 4); mx.stroke(); }
    }
  } else if (th.bg === 'towers') {
    for (let i = 0; i < 26; i++) {
      const x = Math.floor(rnd() * LW), w = 20 + Math.floor(rnd() * 30), h = 90 + Math.floor(rnd() * 160), y = H - h;
      fx.fillStyle = th.far; fx.fillRect(x, y, w, h);
      fx.beginPath(); fx.moveTo(x - 3, y); fx.lineTo(x + w / 2, y - 18 - rnd() * 20); fx.lineTo(x + w + 3, y); fx.fill();
      for (let k = 0; k < 10; k++) if (rnd() < 0.6) { fx.fillStyle = rnd() < 0.5 ? 'rgba(243,195,91,0.8)' : 'rgba(243,195,91,0.35)'; fx.fillRect(x + 3 + Math.floor(rnd() * (w - 6)), y + 8 + Math.floor(rnd() * (h - 20)), 2, 3); }
    }
    for (let i = 0; i < 12; i++) {
      const x = i * 110 + Math.floor(rnd() * 40), y = 280 + Math.floor(rnd() * 20);
      mx.fillStyle = th.mid; mx.beginPath(); mx.moveTo(x, y); mx.lineTo(x + 30, y - 30); mx.lineTo(x + 60, y); mx.fill(); mx.fillRect(x + 4, y, 52, H - y);
      mx.strokeStyle = th.mid; mx.lineWidth = 1; mx.beginPath(); mx.moveTo(x + 30, y - 30); mx.quadraticCurveTo(x + 85, y - 10, x + 140, y - 28); mx.stroke();
      for (let k = 0; k < 6; k++) { mx.fillStyle = ['#c8404a', '#f2cf5b', '#4a8ad8'][k % 3]; const fx2 = x + 38 + k * 16, fy = y - 22 + Math.sin(k) * 4; mx.beginPath(); mx.moveTo(fx2, fy); mx.lineTo(fx2 + 6, fy); mx.lineTo(fx2 + 3, fy + 7); mx.fill(); }
    }
  } else if (th.bg === 'cave') {
    fx.fillStyle = th.far;
    for (let x = 0; x < LW; x += 18 + Math.floor(rnd() * 20)) { const h = 30 + rnd() * 90; fx.beginPath(); fx.moveTo(x, 0); fx.lineTo(x + 10, h); fx.lineTo(x + 20, 0); fx.fill(); }
    for (let x = 0; x < LW; x += 22 + Math.floor(rnd() * 26)) { const h = 30 + rnd() * 80; fx.beginPath(); fx.moveTo(x, H); fx.lineTo(x + 12, H - h); fx.lineTo(x + 24, H); fx.fill(); }
    mx.fillStyle = th.mid;
    for (let i = 0; i < 10; i++) { const x = Math.floor(rnd() * LW), w = 24 + Math.floor(rnd() * 30); mx.fillRect(x, 0, w, H); mx.fillStyle = 'rgba(255,110,40,0.25)'; mx.fillRect(x + Math.floor(w / 2), 40 + Math.floor(rnd() * 200), 2, 30 + Math.floor(rnd() * 40)); mx.fillStyle = th.mid; }
  } else if (th.bg === 'abyss') {
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(rnd() * LW), h = 80 + rnd() * 200;
      fx.strokeStyle = th.far; fx.lineWidth = 3; fx.beginPath(); fx.moveTo(x, H);
      for (let y = 0; y < h; y += 8) fx.lineTo(x + Math.sin(y * 0.05 + i) * 6, H - y);
      fx.stroke();
    }
    for (let i = 0; i < 70; i++) { fx.fillStyle = `rgba(95,240,224,${0.15 + rnd() * 0.4})`; fx.fillRect(Math.floor(rnd() * LW), Math.floor(rnd() * H), 1, 1); }
    mx.fillStyle = th.mid;
    for (let i = 0; i < 8; i++) { const x = Math.floor(rnd() * LW), r = 40 + rnd() * 40; mx.beginPath(); mx.arc(x, H + 10, r, Math.PI, 0); mx.fill(); mx.beginPath(); mx.arc(x + r * 1.4, 0, r * 0.8, 0, Math.PI); mx.fill(); }
  } else if (th.bg === 'shadow') {
    fill(fx, th.far); for (let x = 0; x < LW; x++) { const y = 250 + Math.sin(x / LW * Math.PI * 3) * 26 + Math.sin(x / LW * Math.PI * 13) * 5; fx.fillRect(x, y, 1, H - y); }
    const tree = (ctx, x, y, len, a, d) => { if (d <= 0) return; const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; ctx.lineWidth = d; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); tree(ctx, x2, y2, len * 0.7, a - 0.5 - rnd() * 0.3, d - 1); tree(ctx, x2, y2, len * 0.7, a + 0.4 + rnd() * 0.3, d - 1); };
    mx.strokeStyle = th.mid; mx.fillStyle = th.mid;
    for (let x = 0; x < LW; x++) { const y = 292 + Math.sin(x / LW * Math.PI * 5 + 2) * 10; mx.fillRect(x, y, 1, H - y); }
    for (let i = 0; i < 8; i++) tree(mx, Math.floor(rnd() * LW), 290, 26 + rnd() * 16, -Math.PI / 2 + rnd() * 0.3 - 0.15, 4);
    for (let i = 0; i < 6; i++) { const x = Math.floor(rnd() * LW), h = 30 + rnd() * 50; mx.fillRect(x, 300 - h, 12, h); mx.fillRect(x - 3, 300 - h, 18, 4); }
  }
  const fog = mkCanvas(640, 200), fgx = fog.getContext('2d');
  for (let i = 0; i < 70; i++) { const x = rnd() * 640, y = 40 + rnd() * 120, r = 20 + rnd() * 40; const g3 = fgx.createRadialGradient(x, y, 0, x, y, r); g3.addColorStop(0, 'rgba(200,200,215,0.16)'); g3.addColorStop(1, 'rgba(200,200,215,0)'); fgx.fillStyle = g3; fgx.fillRect(x - r, y - r, r * 2, r * 2); }
  const res = { sky, far, mid, fog, LW };
  BGCACHE[th.bg] = res;
  return res;
}

function drawBackground(th, cam, t, o = {}) {
  const b = buildBackground(th);
  G.drawImage(b.sky, 0, 0);
  if (o.dawn) { G.globalAlpha = o.dawn; const gr = G.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3a4a8a'); gr.addColorStop(0.6, '#f0a070'); gr.addColorStop(1, '#ffe0a0'); G.fillStyle = gr; G.fillRect(0, 0, W, H); G.globalAlpha = 1; }
  if (o.cross != null) drawCrossHill(o.cross, o.dawn || 0);
  const lay = (img, k, dy) => { const off = -mod(cam * k, b.LW); G.drawImage(img, Math.floor(off), dy); G.drawImage(img, Math.floor(off) + b.LW, dy); };
  lay(b.far, 0.12, 0);
  if (th.bg === 'abyss') { G.globalAlpha = 0.06 + 0.03 * Math.sin(t * 0.02); G.fillStyle = '#8af0ff'; for (let i = 0; i < 4; i++) { const x = mod(i * 190 - cam * 0.05, 760) - 60; G.beginPath(); G.moveTo(x, 0); G.lineTo(x + 40, 0); G.lineTo(x + 140, H); G.lineTo(x + 80, H); G.fill(); } G.globalAlpha = 1; }
  lay(b.mid, 0.3, 0);
  if (th.bg === 'cave') { G.globalAlpha = 0.12 + 0.06 * Math.sin(t * 0.03); G.fillStyle = '#ff6a2a'; G.fillRect(0, H - 40, W, 40); G.globalAlpha = 1; }
}
function drawCrossHill(screenX, dawn) {
  const x = Math.round(screenX), base = 300;
  G.fillStyle = mixHex('#24232a', '#5a4040', dawn);
  G.beginPath(); G.moveTo(x - 220, H); G.quadraticCurveTo(x, base - 150, x + 220, H); G.fill();
  const cy = base - 112;
  if (dawn > 0) { const g = G.createRadialGradient(x, cy, 0, x, cy, 120); g.addColorStop(0, `rgba(255,240,190,${0.5 * dawn})`); g.addColorStop(1, 'rgba(255,240,190,0)'); G.fillStyle = g; G.fillRect(x - 120, cy - 120, 240, 240); }
  G.fillStyle = mixHex('#141318', '#3a2420', dawn);
  G.fillRect(x - 3, cy - 46, 6, 70); G.fillRect(x - 20, cy - 32, 40, 5);
}

// Partículas ambientes (espaço da tela)
function ambientParticles(sc) {
  const th = sc.th, k = th.particle;
  if (sc.t % 5 !== 0) return;
  const x = sc.cam + rand(0, W), y = rand(0, WORLD_H);
  if (k === 'fluff') sc.amb.push({ x, y, vx: rand(-0.2, 0.2), vy: rand(-0.25, -0.05), c: 'rgba(230,225,255,0.5)', l: 200, m: 200, s: 1 });
  else if (k === 'glitter') sc.amb.push({ x, y, vx: 0, vy: rand(0.1, 0.4), c: pick(['#f2cf5b', '#fff2b0', '#ffd0e8']), l: 140, m: 140, s: 1 });
  else if (k === 'embers') sc.amb.push({ x, y: WORLD_H - 10, vx: rand(-0.3, 0.3), vy: rand(-1.2, -0.4), c: pick(['#ff7a2a', '#ffb43a', '#ff4a1a']), l: 160, m: 160, s: 1 });
  else if (k === 'plankton') sc.amb.push({ x, y, vx: rand(-0.1, 0.1), vy: rand(-0.15, 0.05), c: pick(['#5ff0e0', '#9a7cff', '#c8fff8']), l: 220, m: 220, s: 1 });
  else if (k === 'ash') sc.amb.push({ x, y: 0, vx: rand(-0.2, 0.4), vy: rand(0.2, 0.6), c: pick(['#8a8890', '#5a5860', '#b0aab8']), l: 300, m: 300, s: 1 });
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
  G.drawImage(DARK, 0, 0);
}
function drawFog(sc) {
  const b = buildBackground(sc.th);
  G.globalAlpha = 0.55;
  const o1 = -mod(sc.cam * 0.6 + sc.t * 0.25, 640), o2 = -mod(sc.cam * 0.9 - sc.t * 0.15, 640);
  G.drawImage(b.fog, o1, 120); G.drawImage(b.fog, o1 + 640, 120);
  G.globalAlpha = 0.35;
  G.drawImage(b.fog, o2, 20); G.drawImage(b.fog, o2 + 640, 20);
  G.globalAlpha = 1;
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
    txt('J' + (i + 1), x + 6, y + 14, { size: 6, color: '#f4efe4', weight: 700 });
    if (p.state === 'down') txt('caído: um aliado pode te levantar', x + 50, y + 13, { size: 6, color: '#c8c0d8' });
    else if (p.fruit()) txt(FRUITS[p.fruit()].effect, x + 78, y + 13, { size: 6.5, color: FRUITS[p.fruit()].color });
  });
  const by = H - 16;
  txt(`${sc.stats.scrolls.length}/${LV.scrollCount}`, 18, by - 1, { size: 8, color: '#efe0b4', weight: 600 });
  txt(`${sc.stats.captives.length}/${LV.captiveCount}`, 60, by - 1, { size: 8, color: '#fff3c2', weight: 600 });
  if (sc.boss && !sc.boss.dead && sc.boss.state !== 'intro') txt(LV.ph.bossCard.name, W / 2, H - 25, { size: 8, align: 'center', color: '#ffd0d8', weight: 700 });
}
