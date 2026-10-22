// Verificação aproximada de alcançabilidade (BFS em células onde se pode ficar de pé)
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = { console, Math, document: {}, localStorage: null };
vm.createContext(ctx);
for (const f of ['00_core.js', '03_data.js', '04_rooms.js', '05_level.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8'), ctx, { filename: f });
const ROWS = 22;
for (let pi = 0; pi < 5; pi++) {
  const L = vm.runInContext(`buildLevel(${pi})`, ctx);
  const cols = L.cols;
  const T = (c, r) => (c < 0 || c >= cols) ? 1 : L.grid[((r % ROWS) + ROWS) % ROWS * cols + c];
  const solid = (c, r) => { const t = T(c, r); return t === 1; }; // muralha frágil (4) conta como atravessável
  const floorT = (c, r) => { const t = T(c, r); return t === 1 || t === 2 || t === 4; };
  const stand = (c, r) => { const t = T(c, r); return t !== 1 && t !== 4 && t !== 3 && floorT(c, r + 1); };
  const clearV = (c, r0, r1) => { for (let r = Math.min(r0, r1); r <= Math.max(r0, r1); r++) if (solid(c, r)) return false; return true; };
  const clearH = (r, c0, c1) => { for (let c = Math.min(c0, c1); c <= Math.max(c0, c1); c++) if (solid(c, r)) return false; return true; };
  for (const [label, UP, HZ] of [['sem dash', 3, 5], ['com dash', 6, 8]]) {
    const start = L.spawns.find(s => s.ch === 'S');
    let sc = start.c, sr = start.r; while (!stand(sc, sr) && sr < ROWS) sr++;
    const seen = new Set(), q = [[sc, sr]]; seen.add(sc + ',' + sr);
    const push = (c, r) => { const k = c + ',' + r; if (!seen.has(k) && stand(c, r)) { seen.add(k); q.push([c, r]); } };
    while (q.length) {
      const [c, r] = q.shift();
      for (let dc = -HZ - 4; dc <= HZ + 4; dc++) for (let dr = -UP; dr <= ROWS; dr++) {
        const c2 = c + dc, r2 = r + dr; if (r2 < 0 || r2 >= ROWS) continue;
        if (!stand(c2, r2)) continue;
        const lim = dr <= 0 ? HZ : HZ + Math.floor(dr / 2);
        if (Math.abs(dc) > lim) continue;
        const top = Math.min(r, r2);
        if (clearV(c, r, top) && clearH(top, c, c2) && clearV(c2, top, r2)) push(c2, r2);
      }
      // queda pelo buraco (o mundo dá a volta)
      for (let dc = -4; dc <= 4; dc++) {
        const pc = c + dc;
        if (T(pc, ROWS - 1) !== 0 || !clearH(r, c, pc)) continue;
        let ok = true; for (let rr = r; rr < ROWS; rr++) if (solid(pc, rr)) ok = false;
        if (!ok) continue;
        for (let d2 = -6; d2 <= 6; d2++) { const lc = pc + d2; for (let rr = 0; rr < ROWS; rr++) { if (solid(lc, rr)) break; if (stand(lc, rr)) { push(lc, rr); } } }
      }
    }
    const miss = [];
    for (const s of L.spawns) {
      if (s.ch !== 'P' && s.ch !== 'C' && s.ch !== 'E') continue;
      let ok = false;
      if (s.ch === 'P') { for (const k of seen) { const [c, r] = k.split(',').map(Number); if (Math.abs(c - s.c) <= 2 && r - s.r >= -1 && r - s.r <= 4 && clearV(s.c, s.r, r)) { ok = true; break; } } }
      else { let rr = s.r; while (!stand(s.c, rr) && rr < ROWS - 1) rr++; ok = seen.has(s.c + ',' + rr); }
      if (!ok) miss.push(`${s.ch}@sala${s.room}(${s.c % 40},${s.r})`);
    }
    // chegou ao fim?
    let maxC = 0; for (const k of seen) maxC = Math.max(maxC, +k.split(',')[0]);
    console.log(`fase ${pi} [${label}] alcança coluna ${maxC}/${cols - 1}`, miss.length ? 'FALTAM: ' + miss.join(' ') : 'tudo alcançável');
  }
}
