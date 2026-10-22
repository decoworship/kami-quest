'use strict';
// ============================================================
//  PEREGRINOS — O Caminho Estreito
//  Núcleo: constantes, utilidades, desenho em pixel, save
// ============================================================

const W = 640, H = 360;          // resolução interna
const TS = 16;                    // tamanho do tile
const ROWS = 22;                  // altura do mundo em tiles
const WORLD_H = ROWS * TS;        // 352 px (o mundo "dá a volta" verticalmente)
const OY = 4;                     // deslocamento vertical do mundo na tela
const RCOLS = 40;                 // largura de uma sala em tiles
const ROOM_W = RCOLS * TS;        // 640 px

let REDUCED_MOTION = false;
try { REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { }
const T_EMPTY = 0, T_SOLID = 1, T_ONEWAY = 2, T_SPIKE = 3, T_BREAK = 4, T_FAKE = 5;

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sign = v => v < 0 ? -1 : v > 0 ? 1 : 0;
const approach = (v, t, d) => v < t ? Math.min(v + d, t) : Math.max(v - d, t);
const mod = (a, n) => ((a % n) + n) % n;
const wrapDY = dy => mod(dy + WORLD_H / 2, WORLD_H) - WORLD_H / 2;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177 | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// sobreposição de retângulos considerando a volta vertical do mundo
function overlapR(ax, ay, aw, ah, bx, by, bw, bh) {
  if (ax + aw <= bx || bx + bw <= ax) return false;
  const dy = wrapDY((ay + ah / 2) - (by + bh / 2));
  return Math.abs(dy) < (ah + bh) / 2;
}
function overlap(a, b) { return overlapR(a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h); }
const ecx = e => e.x + e.w / 2;
const ecy = e => e.y + e.h / 2;
function edist(a, b) { return Math.hypot(ecx(b) - ecx(a), wrapDY(ecy(b) - ecy(a))); }
function angTo(a, b) { return Math.atan2(wrapDY(ecy(b) - ecy(a)), ecx(b) - ecx(a)); }

// ------------------------------------------------------------
// Desenho em pixel (contexto global G = jogo, U = interface)
// ------------------------------------------------------------
let G = null, U = null;

function R(x, y, w, h, c) { G.fillStyle = c; G.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function circ(x, y, r, c) {
  x = Math.round(x); y = Math.round(y); r = Math.max(0, Math.round(r));
  G.fillStyle = c;
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy) + 0.5);
    G.fillRect(x - w, y + dy, 2 * w + 1, 1);
  }
}
function ellipse(x, y, rx, ry, c) {
  x = Math.round(x); y = Math.round(y); rx = Math.max(0, Math.round(rx)); ry = Math.max(1, Math.round(ry));
  G.fillStyle = c;
  for (let dy = -ry; dy <= ry; dy++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
    G.fillRect(x - w, y + dy, 2 * w + 1, 1);
  }
}
function ring(x, y, r, c, th = 1) {
  x = Math.round(x); y = Math.round(y);
  G.fillStyle = c;
  const steps = Math.max(12, Math.floor(r * 6));
  for (let i = 0; i < steps; i++) {
    const a = i / steps * Math.PI * 2;
    G.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), th, th);
  }
}
function line(x0, y0, x1, y1, c, th = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  G.fillStyle = c;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, n = 0;
  while (n++ < 400) {
    G.fillRect(x0, y0, th, th);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(hex, amt) { // amt -1..1
  const [r, g, b] = hexToRgb(hex);
  const f = v => clamp(Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt)), 0, 255);
  return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join('');
}

// Ícones em pixel (padrões de texto)
const ICONS = {
  heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
  heartE: ['.##.##.', '#..#..#', '#.....#', '.#...#.', '..#.#..', '...#...'],
  amor: ['.##.##.', '#######', '#######', '#######', '.#####.', '..###..', '...#...'],
  alegria: ['...#...', '.#.#.#.', '..###..', '#######', '..###..', '.#.#.#.', '...#...'],
  paz: ['#######', '#.....#', '#..#..#', '#.###.#', '.#.#.#.', '..#.#..', '...#...'],
  longanimidade: ['.##.##.', '#..#..#', '...#...', '...#...', '..###..', '.#####.', '.#####.'],
  benignidade: ['.#...#.', '###.###', '.#####.', '..#.#..', '.#####.', '###.###', '.#...#.'],
  bondade: ['...#...', '...#...', '.#####.', '#######', '.#####.', '...#...', '...#...'],
  fidelidade: ['..###..', '...#...', '.#####.', '...#...', '#..#..#', '##.#.##', '.#####.'],
  mansidao: ['...#...', '..###..', '.#####.', '#######', '#######', '.#####.', '..###..'],
  dominio: ['...###.', '..###..', '.###...', '#######', '...###.', '..###..', '.###...'],
  shofar: ['......#', '.....##', '######.', '.....##', '......#'],
  scroll: ['.#####.', '#.....#', '.#####.', '.#...#.', '.#####.', '#.....#', '.#####.'],
  person: ['..##..', '..##..', '.####.', '#.##.#', '..##..', '.#..#.'],
  star: ['..#..', '.###.', '#####', '.###.', '..#..'],
  fe: ['#.....#', '##...##', '.##.##.', '..###..', '...#...', '...#...', '..###..'],
  cura: ['..###..', '..###..', '#######', '#######', '#######', '..###..', '..###..'],
  sabedoria: ['......#', '.....#.', '....#..', '...#...', '#.#....', '.#.....', '#.#....'],
  discernimento: ['..###..', '.#...#.', '#..#..#', '#.###.#', '#..#..#', '.#...#.', '..###..'],
};
function drawIcon(name, x, y, color, s = 1) {
  const p = ICONS[name]; if (!p) return;
  G.fillStyle = color;
  for (let j = 0; j < p.length; j++) for (let i = 0; i < p[j].length; i++)
    if (p[j][i] === '#') G.fillRect(Math.round(x) + i * s, Math.round(y) + j * s, s, s);
}

// ------------------------------------------------------------
// Texto nítido na camada de interface (coordenadas do jogo)
// ------------------------------------------------------------
const FONT_UI = '"Pixelify Sans", "Trebuchet MS", system-ui, sans-serif';
const FONT_TITLE = '"Cinzel", "Palatino Linotype", Georgia, serif';
function txt(s, x, y, o = {}) {
  const size = o.size || 8;
  U.save();
  U.globalAlpha = o.alpha == null ? 1 : o.alpha;
  U.font = `${o.weight || 500} ${size}px ${o.font || FONT_UI}`;
  U.textAlign = o.align || 'left';
  U.textBaseline = o.base || 'top';
  if (o.shadow !== false) {
    U.lineJoin = 'round';
    U.strokeStyle = o.stroke || 'rgba(8,6,14,0.9)';
    U.lineWidth = o.lw || Math.max(1.5, size / 5);
    U.strokeText(s, x, y);
  }
  if (o.glow) { U.shadowColor = o.glow; U.shadowBlur = o.glowSize || 8; }
  U.fillStyle = o.color || '#f4efe4';
  U.fillText(s, x, y);
  U.restore();
}
function txtW(s, size = 8, font = FONT_UI, weight = 500) {
  U.save(); U.font = `${weight} ${size}px ${font}`; const w = U.measureText(s).width; U.restore(); return w;
}
function wrapText(s, maxW, size = 8, font = FONT_UI, weight = 500) {
  const words = s.split(' '); const lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (txtW(t, size, font, weight) > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
function panel(x, y, w, h, o = {}) {
  U.save();
  U.globalAlpha = o.alpha == null ? 1 : o.alpha;
  U.fillStyle = o.fill || 'rgba(14,11,24,0.88)';
  U.strokeStyle = o.border || 'rgba(233,208,140,0.7)';
  U.lineWidth = o.lw || 1;
  U.beginPath();
  const r = o.r == null ? 3 : o.r;
  U.moveTo(x + r, y); U.arcTo(x + w, y, x + w, y + h, r); U.arcTo(x + w, y + h, x, y + h, r);
  U.arcTo(x, y + h, x, y, r); U.arcTo(x, y, x + w, y, r); U.closePath();
  U.fill(); if (o.border !== 'none') U.stroke();
  U.restore();
}

// ------------------------------------------------------------
// Salvamento (localStorage, sempre protegido)
// ------------------------------------------------------------
const SAVE_KEY = 'peregrinos_caminho_estreito_v1';
const Save = {
  data: null,
  fresh() {
    return {
      v: 1, started: false, diff: 1, unlocked: 1,
      phases: [0, 1, 2, 3, 4].map(() => ({ done: false, boss: false, scrolls: [], captives: [], best: 0 })),
      gifts: [], fruitsSeen: [], party: null, ending: false,
    };
  },
  load() {
    this.data = this.fresh();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && d.v === 1) this.data = Object.assign(this.fresh(), d);
      }
    } catch (e) { /* sem armazenamento: segue sem salvar */ }
  },
  write() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { } },
  reset() { this.data = this.fresh(); this.write(); },
  hasGift(g) { return this.data.gifts.includes(g); },
};
