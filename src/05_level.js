// ============================================================
//  Nível: montagem das salas, colisão com tiles e cache de tiles
// ============================================================
let LV = null; // nível atual

function normRow(r, i) {
  if (r.length > RCOLS) r = r.slice(0, RCOLS);
  while (r.length < RCOLS) r += (i === 0 || i >= 19) ? '#' : '.';
  return r;
}
function roomMap(name) {
  const [id, flag] = name.split(':');
  const tpl = ROOMS[id];
  let rows = tpl.map.map((r, i) => normRow(r, i));
  if (flag === 'm') rows = rows.map(r => r.split('').reverse().join(''));
  return { id, tpl, rows, mirrored: flag === 'm' };
}

function buildLevel(pi) {
  const ph = PHASES[pi];
  const rms = ph.rooms.map(roomMap);
  const cols = rms.length * RCOLS;
  const grid = new Uint8Array(cols * ROWS);
  const L = { pi, ph, cols, grid, w: cols * TS, rooms: [], spawns: [], bhp: new Map(), scrollCount: 0, captiveCount: 0 };
  let scrollK = 0;
  rms.forEach((rm, ri) => {
    const x0 = ri * RCOLS;
    const room = { i: ri, id: rm.id, type: rm.tpl.type, x0: x0 * TS, x1: (x0 + RCOLS) * TS, waves: rm.tpl.waves || null, portals: [], state: 'idle' };
    let hasE = false;
    rm.rows.forEach((row, r) => {
      for (let c = 0; c < RCOLS; c++) {
        const ch = row[c], gc = x0 + c, idx = r * cols + gc;
        let t = T_EMPTY;
        if (ch === '#') t = T_SOLID;
        else if (ch === '=') t = T_ONEWAY;
        else if (ch === '^') t = T_SPIKE;
        else if (ch === '%') { t = T_BREAK; L.bhp.set(idx, 3); }
        else if (ch === '&') t = T_FAKE;
        else if (ch === '*') room.portals.push({ x: gc * TS + 8, y: r * TS + 8 });
        else if ('SECPJHTB123'.includes(ch)) {
          const sp = { ch, c: gc, r, room: ri, id: `${pi}-${ri}-${c}-${r}` };
          if (ch === 'P') { sp.k = scrollK++; }
          if (ch === 'E') hasE = true;
          L.spawns.push(sp);
        }
        grid[idx] = t;
      }
    });
    if (room.type === 'arena' && !hasE) L.spawns.push({ ch: 'E', c: x0 + 1, r: 18, room: ri, id: `${pi}-${ri}-E` });
    L.rooms.push(room);
  });
  // Abertura no teto acima dos buracos do chão (o mundo dá a volta verticalmente)
  for (let c = 0; c < cols; c++) {
    if (grid[(ROWS - 1) * cols + c] === T_EMPTY) {
      for (let r = 0; r < 2; r++) if (grid[r * cols + c] === T_SOLID) grid[r * cols + c] = T_EMPTY;
    }
  }
  L.scrollCount = scrollK;
  L.captiveCount = L.spawns.filter(s => s.ch === 'C').length;
  return L;
}

// ------------------------------------------------------------
// Colisão
// ------------------------------------------------------------
function tileAt(c, r) {
  if (c < 0 || c >= LV.cols) return T_SOLID;
  return LV.grid[mod(r, ROWS) * LV.cols + c];
}
function tileIdx(c, r) { return mod(r, ROWS) * LV.cols + c; }
const isSolidT = t => t === T_SOLID || t === T_BREAK;
function solidRect(x, y, w, h, bnd) {
  if (bnd && (x < bnd.min || x + w > bnd.max)) return true;
  const c0 = Math.floor(x / TS), c1 = Math.floor((x + w - 1) / TS);
  const r0 = Math.floor(y / TS), r1 = Math.floor((y + h - 1) / TS);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (isSolidT(tileAt(c, r))) return true;
  return false;
}
function onewayAt(x, y, w, h) {
  const fy = y + h;
  if (mod(fy, TS) !== 0) return false;
  const r = fy / TS, c0 = Math.floor(x / TS), c1 = Math.floor((x + w - 1) / TS);
  for (let c = c0; c <= c1; c++) if (tileAt(c, r) === T_ONEWAY) return true;
  return false;
}
function pointSolid(px, py) { return isSolidT(tileAt(Math.floor(px / TS), Math.floor(py / TS))); }
function rectHasTile(x, y, w, h, type) {
  const c0 = Math.floor(x / TS), c1 = Math.floor((x + w - 1) / TS);
  const r0 = Math.floor(y / TS), r1 = Math.floor((y + h - 1) / TS);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (tileAt(c, r) === type) return true;
  return false;
}
function moveX(e, amt) {
  e.rx += amt;
  let m = Math.round(e.rx);
  if (m === 0) return false;
  e.rx -= m;
  const s = sign(m);
  while (m !== 0) {
    if (!solidRect(e.x + s, e.y, e.w, e.h, e.bnd)) { e.x += s; m -= s; }
    else { e.rx = 0; return true; }
  }
  return false;
}
function moveY(e, amt) {
  e.ry += amt;
  let m = Math.round(e.ry);
  if (m === 0) return false;
  e.ry -= m;
  const s = sign(m);
  while (m !== 0) {
    const blocked = solidRect(e.x, e.y + s, e.w, e.h, null) || (s > 0 && !e.dropT && onewayAt(e.x, e.y, e.w, e.h));
    if (!blocked) { e.y = mod(e.y + s, WORLD_H); m -= s; }
    else { e.ry = 0; return true; }
  }
  return false;
}
function onGround(e) {
  return solidRect(e.x, e.y + 1, e.w, e.h, null) || (!e.dropT && onewayAt(e.x, e.y, e.w, e.h));
}
function onOnewayOnly(e) { return !solidRect(e.x, e.y + 1, e.w, e.h, null) && onewayAt(e.x, e.y, e.w, e.h); }

// Dano em muralhas frágeis
function damageTile(c, r, d, scene) {
  const t = tileAt(c, r); if (t !== T_BREAK) return false;
  const idx = tileIdx(c, r);
  const hp = (LV.bhp.get(idx) || 3) - d;
  if (hp <= 0) {
    LV.grid[idx] = T_EMPTY; LV.bhp.delete(idx);
    renderTileRegion(LV, c - 1, c + 1);
    if (scene) {
      for (let i = 0; i < 14; i++) scene.part(c * TS + rand(0, 16), mod(r, ROWS) * TS + rand(0, 16), rand(-2, 2), rand(-3, 0.5), LV.ph.theme.tileLight, 40, 2, 0.15);
      Snd.play('break'); scene.shake(3, 8);
    }
  } else {
    LV.bhp.set(idx, hp);
    if (scene) { Snd.play('tink'); for (let i = 0; i < 4; i++) scene.part(c * TS + 8, mod(r, ROWS) * TS + 8, rand(-1.5, 1.5), rand(-2, 0), LV.ph.theme.tileLight, 20, 1, 0.1); }
  }
  return true;
}
function damageTilesInRect(x, y, w, h, d, scene) {
  const c0 = Math.floor(x / TS), c1 = Math.floor((x + w - 1) / TS);
  const r0 = Math.floor(y / TS), r1 = Math.floor((y + h - 1) / TS);
  let hit = false;
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (damageTile(c, r, d, scene)) hit = true;
  return hit;
}

// ------------------------------------------------------------
// Cache de tiles (desenhado uma vez por nível)
// ------------------------------------------------------------
function renderTiles(L) {
  L.canvas = document.createElement('canvas');
  L.canvas.width = L.w; L.canvas.height = WORLD_H;
  L.ctx = L.canvas.getContext('2d');
  renderTileRegion(L, 0, L.cols - 1);
}
function renderTileRegion(L, c0, c1) {
  c0 = Math.max(0, c0); c1 = Math.min(L.cols - 1, c1);
  const ctx = L.ctx;
  ctx.clearRect(c0 * TS, 0, (c1 - c0 + 1) * TS, WORLD_H);
  for (let r = 0; r < ROWS; r++) for (let c = c0; c <= c1; c++) {
    const t = L.grid[r * L.cols + c];
    if (t === T_SOLID) drawSolidTile(ctx, L, c, r);
    else if (t === T_ONEWAY) drawOnewayTile(ctx, L, c, r);
    else if (t === T_SPIKE) drawSpikeTile(ctx, L, c, r);
  }
}
function solidLikeAt(L, c, r) {
  if (c < 0 || c >= L.cols) return true;
  const t = L.grid[mod(r, ROWS) * L.cols + c];
  return t === T_SOLID || t === T_BREAK || t === T_FAKE;
}
function drawSolidTile(ctx, L, c, r, alpha) {
  const th = L.ph.theme, x = c * TS, y = r * TS, h = hash2(c, r), bg = th.bg;
  const f = (xx, yy, w, hh, col) => { ctx.fillStyle = col; ctx.fillRect(x + xx, y + yy, w, hh); };
  if (alpha != null) { ctx.save(); ctx.globalAlpha = alpha; }
  f(0, 0, 16, 16, th.tile);
  // textura por tema
  const rnd = mulberry32((c * 7919 + r * 104729) | 0);
  if (bg === 'towers') {
    const off = (r % 2) * 8;
    f(0, 7, 16, 1, th.tileDark); f(0, 15, 16, 1, th.tileDark);
    f(mod(off + 3, 16), 0, 1, 7, th.tileDark); f(mod(off + 11, 16), 8, 1, 7, th.tileDark);
    f(1, 1, 3, 1, th.tileLight);
  } else if (bg === 'shadow') {
    f(0, 15, 16, 1, th.tileDark); f(15, 0, 1, 16, th.tileDark);
    if (h < 0.4) { const cx = 3 + Math.floor(rnd() * 9); f(cx, 3, 1, 4, th.tileDark); f(cx + 1, 7, 1, 3, th.tileDark); }
  } else {
    for (let i = 0; i < 5; i++) f(Math.floor(rnd() * 15), Math.floor(rnd() * 15), 2, 1, rnd() < 0.5 ? th.tileDark : th.tileLight);
    if (bg === 'cave' && h < 0.22) { const cx = 2 + Math.floor(rnd() * 10); f(cx, 6, 3, 1, th.top); f(cx + 2, 7, 2, 1, th.topDark); }
    if (bg === 'abyss' && h < 0.16) f(4 + Math.floor(rnd() * 8), 5 + Math.floor(rnd() * 8), 1, 1, th.top);
  }
  const up = solidLikeAt(L, c, r - 1), dn = solidLikeAt(L, c, r + 1), lf = solidLikeAt(L, c - 1, r), rt = solidLikeAt(L, c + 1, r);
  if (!lf) f(0, 0, 1, 16, th.tileLight);
  if (!rt) f(15, 0, 1, 16, th.tileDark);
  if (!dn) { f(0, 14, 16, 2, th.tileDark); }
  if (!up) {
    if (bg === 'hills') { f(0, 0, 16, 3, th.top); f(0, 3, 16, 1, th.topDark); for (let i = 0; i < 16; i += 3) if (hash2(c * 16 + i, r) < 0.45) f(i, 4, 2, 1 + (hash2(i, c) < 0.5 ? 1 : 0), th.topDark); }
    else if (bg === 'towers') { f(0, 0, 16, 2, th.top); f(0, 2, 16, 1, th.topDark); }
    else if (bg === 'cave') { f(0, 0, 16, 1, th.top); f(0, 1, 16, 1, th.topDark); }
    else if (bg === 'abyss') { f(0, 0, 16, 1, th.top); f(0, 1, 16, 1, th.topDark); if (h < 0.5) f(Math.floor(h * 28), 2, 1, 2, th.topDark); }
    else { f(0, 0, 16, 2, th.top); f(0, 2, 16, 1, th.topDark); }
    if (!lf) f(0, 0, 1, 3, th.topDark);
  }
  if (alpha != null) ctx.restore();
}
function drawOnewayTile(ctx, L, c, r) {
  const th = L.ph.theme, x = c * TS, y = r * TS;
  ctx.fillStyle = shade(th.plat, 0.25); ctx.fillRect(x, y, 16, 1);
  ctx.fillStyle = th.plat; ctx.fillRect(x, y + 1, 16, 3);
  ctx.fillStyle = th.platDark; ctx.fillRect(x, y + 4, 16, 1);
  ctx.fillRect(x + 7, y + 1, 1, 3);
  const lft = L.grid[r * L.cols + c - 1] !== T_ONEWAY, rgt = L.grid[r * L.cols + c + 1] !== T_ONEWAY;
  if (lft) { ctx.fillStyle = th.platDark; ctx.fillRect(x + 1, y + 5, 2, 2); ctx.fillRect(x + 2, y + 7, 1, 1); }
  if (rgt) { ctx.fillStyle = th.platDark; ctx.fillRect(x + 13, y + 5, 2, 2); ctx.fillRect(x + 13, y + 7, 1, 1); }
}
function drawSpikeTile(ctx, L, c, r) {
  const th = L.ph.theme, x = c * TS, y = r * TS;
  const below = solidLikeAt(L, c, r + 1), above = solidLikeAt(L, c, r - 1);
  const dir = below ? 'up' : above ? 'down' : solidLikeAt(L, c - 1, r) ? 'right' : solidLikeAt(L, c + 1, r) ? 'left' : 'up';
  const dark = shade(th.spike, -0.35);
  for (let i = 0; i < 4; i++) {
    for (let k = 0; k < 8; k++) {
      const w = Math.max(1, 4 - Math.floor(k / 2));
      const off = Math.floor((4 - w) / 2);
      if (dir === 'up' || dir === 'down') {
        const yy = dir === 'up' ? y + 15 - k : y + k;
        ctx.fillStyle = th.spike; ctx.fillRect(x + i * 4 + off, yy, w, 1);
        ctx.fillStyle = dark; ctx.fillRect(x + i * 4 + off + w - 1, yy, 1, 1);
      } else {
        const xx = dir === 'right' ? x + k : x + 15 - k;
        ctx.fillStyle = th.spike; ctx.fillRect(xx, y + i * 4 + off, 1, w);
      }
    }
  }
}
