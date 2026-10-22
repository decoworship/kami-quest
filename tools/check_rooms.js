const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = { console, Math, document: {}, localStorage: null };
vm.createContext(ctx);
for (const f of ['00_core.js', '03_data.js', '04_rooms.js', '05_level.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8'), ctx, { filename: f });
vm.runInContext(`
for (const [id, r] of Object.entries(ROOMS)) {
  if (r.map.length !== 22) console.log('ROOM', id, 'rows', r.map.length);
  r.map.forEach((row, i) => { if (row.length !== 40) console.log('ROOM', id, 'row', i, 'len', row.length); });
  // bordas: passagem nas linhas 14-18 e chão nas 19-21
  const edgeL = [14,15,16,17,18].every(i => r.map[i][0] !== '#' && r.map[i][1] !== '#');
  const edgeR = [14,15,16,17,18].every(i => r.map[i][38] !== '#' && r.map[i][39] !== '#');
  if (r.type !== 'start' && !edgeL) console.log('ROOM', id, 'left edge blocked');
  if (!edgeR) console.log('ROOM', id, 'right edge blocked');
  if (r.type === 'arena' && r.map.join('').split('*').length - 1 < 2) console.log('ROOM', id, 'few portals');
}
PHASES.forEach((ph, i) => { const L = buildLevel(i); console.log(i, ph.name, 'cols', L.cols, 'scrolls', L.scrollCount, 'captives', L.captiveCount, 'enemies', L.spawns.filter(s => '123'.includes(s.ch)).length, 'E', L.spawns.filter(s=>s.ch==='E').length); });
`, ctx);
