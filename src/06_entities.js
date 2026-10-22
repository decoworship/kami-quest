// ============================================================
//  Entidades do mundo: projéteis, itens, cativos, Ebenézer...
// ============================================================

// Desenha algo considerando a volta vertical do mundo
function wrapDraw(y, h, fn) {
  fn(0);
  if (y + h > WORLD_H - 2) fn(-WORLD_H);
  if (y < 24) fn(WORLD_H);
}

// ------------------------------------------------------------
// Projéteis
// ------------------------------------------------------------
const EPROJ = {
  ring: { w: 8, h: 8, speed: 1.5, ghost: true, life: 260 },
  fire: { w: 6, h: 6, speed: 2.4, life: 120 },
  thorn: { w: 6, h: 6, life: 220, grav: 0.15 },
  shard: { w: 5, h: 5, speed: 1.7, life: 90 },
  lie: { w: 7, h: 7, speed: 2.1, life: 160 },
  ball: { w: 9, h: 9, life: 220, grav: 0.2, hard: true },
  doubt: { w: 8, h: 8, speed: 1.25, life: 240, ghost: true, wobble: true },
  venom: { w: 6, h: 6, speed: 2.6, life: 150 },
  wave: { w: 14, h: 14, life: 400, hard: true, ground: true },
  pillow: { w: 12, h: 10, life: 260, grav: 0.16 },
  crown: { w: 14, h: 9, life: 420, hard: true, ghost: true },
  coin: { w: 7, h: 7, life: 260, grav: 0.1, ghost: true },
  rock: { w: 10, h: 10, life: 240, grav: 0.22, hard: true, ghost: true },
  zzz: { w: 8, h: 8, speed: 0.9, life: 280, ghost: true },
  word: { w: 36, h: 9, speed: 1.7, life: 330, hard: true },
  flame: { w: 8, h: 8, speed: 3, life: 42 },
};

class Proj {
  constructor(o) {
    this.x = 0; this.y = 0; this.w = 4; this.h = 4; this.vx = 0; this.vy = 0; this.grav = 0; this.life = 120; this.t = 0;
    this.dmg = 1; this.owner = 'p'; this.kind = 'arrow'; this.pierce = 0; this.bounce = 0; this.homing = false;
    this.ghost = false; this.hard = false; this.dead = false; this.stuck = 0; this.hitSet = new Set(); this.color = '#fff';
    Object.assign(this, o);
  }
  get cx() { return this.x + this.w / 2; } get cy() { return this.y + this.h / 2; }
}

function spawnEnemyProj(scene, kind, x, y, ang, o = {}) {
  const d = EPROJ[kind];
  const spd = (o.speed || d.speed || 2) * (scene.diff.espd);
  const p = new Proj({
    owner: 'e', kind, w: d.w, h: d.h, x: x - d.w / 2, y: mod(y - d.h / 2, WORLD_H), vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
    grav: d.grav || 0, life: d.life, ghost: !!d.ghost, hard: !!d.hard, wobble: !!d.wobble, ground: !!d.ground, dmg: 1,
  });
  Object.assign(p, o.extra || {});
  if (o.vx != null) p.vx = o.vx; if (o.vy != null) p.vy = o.vy;
  scene.projs.push(p);
  return p;
}

function updateProj(p, sc) {
  if (p.delay > 0) { p.delay--; return; }
  p.t++;
  if (p.t > p.life) { p.dead = true; return; }
  if (p.stuck > 0) {
    if (p.stuckTo) {
      if (p.stuckTo.dead) p.stuckTo = null; else { p.x = p.stuckTo.x + p.sox; p.y = mod(p.stuckTo.y + p.soy, WORLD_H); }
    }
    p.stuck--;
    if (p.kind === 'seed' && p.stuck <= 0) seedExplode(p, sc);
    if (p.stuck <= 0) p.dead = true;
    return;
  }
  if (p.owner === 'p' && p.homing && p.t > 3) {
    if (!p.target || p.target.dead || p.t % 8 === 0) p.target = sc.nearestTarget(p.cx, p.cy, 260);
    if (p.target) {
      const tx = p.target.cx != null ? p.target.cx : ecx(p.target), ty = p.target.cy != null ? p.target.cy : ecy(p.target);
      const want = Math.atan2(wrapDY(ty - p.cy), tx - p.cx);
      const cur = Math.atan2(p.vy, p.vx), spd = Math.hypot(p.vx, p.vy);
      let da = mod(want - cur + Math.PI, Math.PI * 2) - Math.PI;
      const na = cur + clamp(da, -0.14, 0.14);
      p.vx = Math.cos(na) * spd; p.vy = Math.sin(na) * spd; p.grav = 0;
    }
  }
  if (p.wobble) { p.vy += Math.sin(p.t * 0.15) * 0.06; }
  if (p.kind === 'crown' && p.boomer) {
    // coroa bumerangue: desacelera e retorna ao dono
    const o = p.boomer; if (o.dead) { p.dead = true; return; }
    if (p.t > 40) { const a = Math.atan2(wrapDY(o.cy - p.cy), o.cx - p.cx); p.vx = lerp(p.vx, Math.cos(a) * 4, 0.06); p.vy = lerp(p.vy, Math.sin(a) * 4, 0.06); if (Math.hypot(o.cx - p.cx, wrapDY(o.cy - p.cy)) < 20) p.dead = true; }
  }
  p.vy += p.grav;
  if (p.ground) { // onda que corre pelo chão
    p.x += p.vx;
    if (pointSolid(p.x + p.w / 2 + sign(p.vx) * 8, p.y + p.h / 2) || !pointSolid(p.x + p.w / 2, p.y + p.h + 2)) p.dead = true;
  } else {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(p.vx), Math.abs(p.vy)) / 4));
    for (let s = 0; s < steps && !p.dead && !p.stuck; s++) {
      const px = p.x, py = p.y;
      p.x += p.vx / steps; p.y = mod(p.y + p.vy / steps, WORLD_H);
      if (!p.ghost && pointSolid(p.cx, p.cy)) projHitWall(p, sc, px, py);
      if (p.dead || p.stuck) break;
      if (p.owner === 'p') projHitEnemies(p, sc); else projHitPlayers(p, sc);
    }
  }
  if (p.floorKill && p.y + p.h >= FLOOR_Y && p.y < FLOOR_Y + 10) {
    p.dead = true; for (let i = 0; i < 5; i++) sc.part(p.cx, FLOOR_Y - 2, rand(-1.5, 1.5), rand(-2, -0.5), p.kind === 'coin' ? '#f2cf5b' : '#7a5448', 18, 2, 0.1);
  }
  if (p.x < sc.cam - 80 || p.x > sc.cam + W + 80) p.dead = true;
  // rastro
  if (p.owner === 'p' && p.t % 2 === 0) {
    const col = p.fruitColor || p.color;
    if (p.kind !== 'arrow' || p.fruitColor) sc.part(p.cx, p.cy, 0, 0, col, 12, 1, 0, 0.6);
  }
}
function projHitWall(p, sc, px, py) {
  const c = Math.floor(p.cx / TS), r = Math.floor(p.cy / TS);
  if (p.owner === 'p' && tileAt(c, r) === T_BREAK) { damageTile(c, r, 1, sc); if (p.kind !== 'light') { p.dead = true; return; } }
  if (p.owner === 'p') {
    if (p.kind === 'stone' && p.bounce > 0) {
      p.bounce--;
      const hitX = pointSolid(p.cx, py + p.h / 2), hitY = pointSolid(px + p.w / 2, p.cy);
      p.x = px; p.y = py;
      if (hitX || !hitY) p.vx = -p.vx * 0.7;
      if (hitY) p.vy = -p.vy * 0.55;
      Snd.play('tink');
      return;
    }
    if (p.kind === 'arrow' || p.kind === 'lightarrow' || p.kind === 'bolt') { p.x = px; p.y = py; p.stuck = 36; p.stuckWall = true; Snd.play('tink', 0.08); return; }
    if (p.kind === 'seed') { p.x = px; p.y = py; p.stuck = 48; return; }
  }
  for (let i = 0; i < 4; i++) sc.part(p.cx, p.cy, rand(-1.5, 1.5), rand(-1.5, 1.5), p.color, 14, 1, 0.05);
  p.dead = true;
}
function projHitEnemies(p, sc) {
  const r = { x: p.x, y: p.y, w: p.w, h: p.h };
  for (const e of sc.enemies) {
    if (e.dead || !e.active || p.hitSet.has(e)) continue;
    if (overlap(r, e)) {
      if (p.kind === 'seed') { p.stuck = 48; p.stuckTo = e; p.sox = p.x - e.x; p.soy = p.y - e.y; e.hurt(1, p, sc); p.hitSet.add(e); return; }
      const res = e.hurt(p.dmg, p, sc);
      if (res === 'reflect') { p.owner = 'e'; p.vx = -p.vx * 0.8; p.vy = -Math.abs(p.vy) - 1; p.hitSet.clear(); p.homing = false; p.dmg = 1; return; }
      p.hitSet.add(e);
      if (p.pierce > 0) p.pierce--; else { p.dead = true; return; }
    }
  }
  if (sc.boss && !sc.boss.dead && !p.hitSet.has(sc.boss) && sc.boss.hitTest(r)) {
    if (p.kind === 'seed') { p.stuck = 48; p.stuckTo = null; p.hitSet.add(sc.boss); sc.boss.hurt(1, sc); return; }
    sc.boss.hurt(p.dmg, sc);
    p.hitSet.add(sc.boss);
    if (p.pierce > 0) p.pierce--; else { p.dead = true; return; }
  }
  for (const o of sc.objs) {
    if (o.dead || !o.hittable || p.hitSet.has(o)) continue;
    if (overlap(r, o)) { o.hit(sc, p); p.hitSet.add(o); if (p.kind !== 'light') { p.dead = true; return; } }
  }
}
function projHitPlayers(p, sc) {
  for (const pl of sc.players) {
    if (pl.state !== 'alive') continue;
    if (overlapR(p.x, p.y, p.w, p.h, pl.x + 1, pl.y + 1, pl.w - 2, pl.h - 2)) {
      if (pl.hurt(sc, p.cx)) { if (!p.hard) p.dead = true; }
      else if (pl.dashT > 0 && !p.hard) { /* atravessou no dash */ }
    }
  }
}
function seedExplode(p, sc) {
  const cx = p.cx, cy = p.cy, R = 30;
  for (const e of sc.enemies) if (!e.dead && e.active && Math.hypot(ecx(e) - cx, wrapDY(ecy(e) - cy)) < R + e.w / 2) e.hurt(3, p, sc);
  if (sc.boss && !sc.boss.dead && sc.boss.hitTest({ x: cx - R, y: cy - R, w: R * 2, h: R * 2 })) sc.boss.hurt(3, sc);
  damageTilesInRect(cx - 12, cy - 12, 24, 24, 1, sc);
  for (let i = 0; i < 18; i++) { const a = rand(0, 6.28), s = rand(0.5, 2.5); sc.part(cx, cy, Math.cos(a) * s, Math.sin(a) * s, i % 2 ? '#c8ff9a' : '#fff6c8', 26, 2, 0); }
  sc.flashRing(cx, cy, R, '#d9ffb0');
  Snd.play('pop');
}

function drawProj(p, sc) {
  if (p.warnX != null && !p.dead) { G.globalAlpha = 0.5 + 0.3 * Math.sin(sc.t * 0.5); R(p.warnX - 5, FLOOR_Y - 2, 10, 2, '#ff5a3a'); G.globalAlpha = 1; }
  if (p.delay > 0) return;
  const x = Math.round(p.x), y = Math.round(p.y), k = p.kind;
  wrapDraw(y, p.h, oy => {
    const Y = y + oy, cx = x + p.w / 2, cy = Y + p.h / 2;
    const a = Math.atan2(p.vy, p.vx), ca = Math.cos(a), sa = Math.sin(a);
    if (p.owner === 'p') {
      const fc = p.fruitColor;
      if (k === 'arrow' || k === 'lightarrow') {
        const len = k === 'arrow' ? 9 : 8;
        const col = k === 'arrow' ? '#d9c39a' : '#fff1b0';
        const ax = p.stuckWall ? p.sa : a; if (!p.stuckWall) p.sa = a;
        const c2 = Math.cos(ax), s2 = Math.sin(ax);
        if (fc) line(cx - c2 * len, cy - s2 * len, cx, cy, fc);
        line(cx - c2 * len, cy - s2 * len, cx + c2 * 1, cy + s2 * 1, col);
        R(cx + c2 * 2 - 1, cy + s2 * 2 - 1, 2, 2, k === 'arrow' ? '#e8e8f0' : '#ffffff');
        R(cx - c2 * len - 1, cy - s2 * len - 1, 2, 2, k === 'arrow' ? '#c84a4a' : '#ffd86b');
      } else if (k === 'bolt') {
        line(cx - ca * 8, cy - sa * 8, cx + ca * 2, cy + sa * 2, '#8a5a2b', 2);
        R(cx + ca * 3 - 1, cy + sa * 3 - 1, 3, 3, '#dfe6ee');
        if (fc) R(cx - ca * 8 - 1, cy - sa * 8 - 1, 2, 2, fc);
      } else if (k === 'stone') {
        circ(cx, cy, 3, '#9a948a'); R(cx - 1, cy - 2, 2, 1, '#cfc9bd'); if (fc) R(cx, cy, 1, 1, fc);
      } else if (k === 'light') {
        line(cx - ca * 14, cy - sa * 14, cx + ca * 4, cy + sa * 4, '#fff3c2', 3);
        line(cx - ca * 12, cy - sa * 12, cx + ca * 4, cy + sa * 4, '#ffffff', 1);
      } else if (k === 'seed') {
        const blink = p.stuck > 0 && (p.stuck < 16 ? p.t % 4 < 2 : p.t % 12 < 6);
        circ(cx, cy, 3, blink ? '#fff6c8' : '#5ab84a'); R(cx - 1, cy - 4, 1, 2, '#8ee06e');
      } else {
        circ(cx, cy, 3, '#9ff0ff'); R(cx - 1, cy - 1, 2, 2, '#ffffff');
      }
    } else drawEnemyProj(p, x, Y, cx, cy);
  });
}
function drawEnemyProj(p, x, y, cx, cy) {
  const k = p.kind, t = p.t;
  switch (k) {
    case 'ring': ring(cx, cy, 3 + Math.sin(t * 0.3), '#6ff2ff'); R(cx - 1, cy - 1, 2, 2, '#c8fbff'); break;
    case 'fire': case 'flame': circ(cx, cy, 3, '#ff6a1a'); circ(cx, cy, 2, '#ffb43a'); R(cx - 1, cy - 1, 1, 1, '#fff2b0'); break;
    case 'thorn': R(cx - 1, cy - 3, 2, 6, '#7a5a2a'); R(cx - 3, cy - 1, 6, 2, '#7a5a2a'); R(cx - 1, cy - 1, 2, 2, '#c8e06a'); break;
    case 'shard': R(cx - 2, cy - 2, 4, 4, '#ff7ab8'); R(cx - 1, cy - 1, 1, 1, '#fff'); break;
    case 'lie': circ(cx, cy, 3, '#c43a5a'); R(cx - 1, cy - 2, 1, 4, '#ffd0dc'); break;
    case 'ball': circ(cx, cy, 4, '#4a4a55'); R(cx - 2, cy - 3, 2, 1, '#8a8a99'); line(cx, cy, cx - p.vx * 3, cy - p.vy * 3, '#6a6a78'); break;
    case 'doubt': circ(cx, cy, 4, 'rgba(210,210,230,0.55)'); R(cx - 1, cy - 3, 2, 1, '#ffffff'); R(cx + 1, cy - 2, 1, 2, '#ffffff'); R(cx, cy, 1, 1, '#ffffff'); R(cx, cy + 2, 1, 1, '#ffffff'); break;
    case 'venom': circ(cx, cy, 3, '#8ae04a'); R(cx - 1, cy - 1, 1, 1, '#e8ffd0'); break;
    case 'wave': {
      const hh = p.h; for (let i = 0; i < 4; i++) R(x + i * 3 + (t % 3), y + hh - 4 - i * 3, 3, 4 + i * 3, i % 2 ? '#b8a8e8' : '#e4dcff');
      break;
    }
    case 'pillow': R(x, y + 1, 12, 8, '#e9b8d0'); R(x + 1, y, 10, 10, '#e9b8d0'); R(x + 2, y + 2, 8, 2, '#f8dcea'); R(x, y + 1, 1, 1, '#c88aa8'); R(x + 11, y + 8, 1, 1, '#c88aa8'); break;
    case 'crown': {
      const g = '#f2cf5b';
      R(x + 1, y + 4, 12, 5, g); R(x + 1, y, 2, 4, g); R(x + 6, y, 2, 4, g); R(x + 11, y, 2, 4, g);
      R(x + 3, y + 6, 2, 2, '#e8475f'); R(x + 9, y + 6, 2, 2, '#5bbcf0'); R(x + 1, y + 8, 12, 1, '#a8822a'); break;
    }
    case 'coin': circ(cx, cy, 3, '#f2cf5b'); R(cx - 1, cy - 2, 1, 4, '#b38b2c'); R(cx + 1, cy - 2, 1, 1, '#fff2b0'); break;
    case 'rock': circ(cx, cy, 5, '#5a3a32'); R(cx - 3, cy - 3, 3, 2, '#7a5448'); R(cx + 1, cy + 1, 2, 2, '#ff7a3a'); break;
    case 'zzz': {
      const c = '#d8d0ff'; R(x, y, 6, 1, c); R(x + 4, y + 1, 1, 1, c); R(x + 3, y + 2, 1, 1, c); R(x + 2, y + 3, 1, 1, c); R(x + 1, y + 4, 1, 1, c); R(x, y + 5, 6, 1, c); break;
    }
    case 'word': {
      const pulse = t % 20 < 10;
      R(x - 1, y - 1, p.w + 2, p.h + 2, pulse ? 'rgba(120,0,20,0.55)' : 'rgba(60,0,10,0.55)');
      break; // o texto é desenhado na camada de interface
    }
    default: circ(cx, cy, 3, '#ff4a6a');
  }
}

// ------------------------------------------------------------
// Partículas e textos flutuantes
// ------------------------------------------------------------
function updateParts(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= p.fr; p.vy *= p.fr; p.l--;
    if (p.l <= 0) { arr[i] = arr[arr.length - 1]; arr.pop(); }
  }
}
function drawParts(arr) {
  for (const p of arr) {
    G.globalAlpha = Math.min(1, (p.l / p.m) * p.a * 1.6);
    const y = mod(p.y, WORLD_H);
    G.fillStyle = p.c; G.fillRect(Math.round(p.x), Math.round(y), p.s, p.s);
  }
  G.globalAlpha = 1;
}

// ------------------------------------------------------------
// Objetos do mundo
// ------------------------------------------------------------
class Pickup {
  constructor(kind, x, y, o = {}) {
    this.kind = kind; this.fruit = o.fruit || null; this.w = 10; this.h = 10;
    this.x = Math.round(x - 5); this.y = Math.round(y - 5); this.vx = o.vx || 0; this.vy = o.vy || 0;
    this.rx = 0; this.ry = 0; this.float = !!o.float; this.life = o.life || Infinity; this.t = 0; this.dead = false; this.baseY = this.y;
  }
  update(sc) {
    this.t++;
    if (this.t > this.life) { this.dead = true; return; }
    if (this.float) { this.y = mod(this.baseY + Math.round(Math.sin(this.t * 0.06) * 2), WORLD_H); }
    else {
      this.vy = Math.min(this.vy + 0.18, 3.2);
      if (moveX(this, this.vx)) this.vx = -this.vx * 0.5;
      if (moveY(this, this.vy)) { if (this.vy > 0.8) this.vy = -this.vy * 0.4; else this.vy = 0; this.vx *= 0.7; }
    }
    if (this.t < 12) return;
    for (const p of sc.players) {
      if (p.state === 'alive' && overlap(this, p)) { if (p.collect(this, sc)) { this.dead = true; break; } }
    }
  }
  draw(sc) {
    if (this.life - this.t < 120 && this.t % 8 < 4) return;
    const x = this.x, y = this.y;
    wrapDraw(y, this.h, oy => {
      const Y = y + oy, cx = x + 5, cy = Y + 5;
      if (this.kind === 'fruit') {
        const f = FRUITS[this.fruit];
        circ(cx, cy, 6, 'rgba(10,8,20,0.75)');
        ring(cx, cy, 6 + (this.t % 30 < 15 ? 0 : 1), f.color);
        drawIcon(this.fruit, cx - 3, cy - 3, f.color);
      } else if (this.kind === 'heart') {
        circ(cx, cy, 6, 'rgba(255,120,140,0.18)');
        drawIcon('heart', cx - 3, cy - 3, '#ff5a72'); R(cx - 2, cy - 2, 1, 1, '#ffd0d8');
      } else if (this.kind === 'shofar') {
        circ(cx, cy, 6, 'rgba(255,220,120,0.18)');
        drawIcon('shofar', cx - 3, cy - 2, '#f2cf5b');
      }
    });
  }
}

class ScrollPick {
  constructor(sp, known) { this.k = sp.k; this.x = sp.c * TS + 3; this.y = sp.r * TS + 3; this.w = 10; this.h = 10; this.t = 0; this.known = known; this.dead = false; this.baseY = this.y; this.light = 34; }
  update(sc) {
    this.t++; this.y = mod(this.baseY + Math.round(Math.sin(this.t * 0.05) * 2), WORLD_H);
    if (this.t % 10 === 0) sc.part(this.x + rand(0, 10), this.y + rand(0, 10), 0, -0.3, '#ffe9a8', 30, 1, 0);
    for (const p of sc.players) if (p.state === 'alive' && overlap(this, p)) { this.dead = true; sc.onScroll(this, p); break; }
  }
  draw() {
    const x = this.x, y = this.y, a = this.known ? 0.5 : 1;
    G.globalAlpha = a;
    wrapDraw(y, 10, oy => {
      const Y = y + oy;
      circ(x + 5, Y + 5, 8, 'rgba(255,230,150,0.16)');
      R(x + 1, Y + 2, 8, 6, '#efe0b4'); R(x + 1, Y + 3, 8, 1, '#d4c08a'); R(x + 1, Y + 6, 8, 1, '#d4c08a');
      R(x, Y + 1, 2, 8, '#8a5a2b'); R(x + 8, Y + 1, 2, 8, '#8a5a2b'); R(x + 4, Y + 4, 2, 2, '#c8402e');
    });
    G.globalAlpha = 1;
  }
}

class Jar {
  constructor(x, y, o = {}) {
    this.x = Math.round(x); this.y = Math.round(y); this.w = 12; this.h = 13; this.t = randi(0, 100); this.dead = false; this.hittable = true;
    this.fruit = o.fruit || randomFruit(); this.flying = !!o.flying; this.vx = o.vx || 0; this.baseY = this.y; this.light = 22;
  }
  update(sc) {
    this.t++;
    if (this.flying) {
      this.x += this.vx; this.y = mod(this.baseY + Math.round(Math.sin(this.t * 0.05) * 18), WORLD_H);
      if (this.x < sc.cam - 60 || this.x > sc.cam + W + 60) this.dead = true;
    } else this.y = mod(this.baseY + Math.round(Math.sin(this.t * 0.04) * 1.5), WORLD_H);
  }
  hit(sc) {
    if (this.dead) return;
    this.dead = true;
    for (let i = 0; i < 12; i++) sc.part(this.x + 6, this.y + 7, rand(-2, 2), rand(-3, 0), i % 3 ? '#b86a3a' : '#e6a06a', 36, 2, 0.15);
    sc.pickups.push(new Pickup('fruit', this.x + 6, this.y + 6, { fruit: this.fruit, vy: -2.4, life: 900 }));
    Snd.play('pop');
  }
  draw() {
    const x = this.x, y = this.y, t = this.t;
    wrapDraw(y, this.h, oy => {
      const Y = y + oy;
      if (this.flying) {
        const fl = Math.floor(t / 6) % 2;
        R(x - 5, Y + 3 - fl * 2, 5, 2, '#f4f2ff'); R(x - 3, Y + 5 - fl * 2, 3, 1, '#d8d4f0');
        R(x + 12, Y + 3 - fl * 2, 5, 2, '#f4f2ff'); R(x + 12, Y + 5 - fl * 2, 3, 1, '#d8d4f0');
      }
      circ(x + 6, Y + 1, 3, rgba(FRUITS[this.fruit].color, 0.35 + 0.2 * Math.sin(t * 0.1)));
      ellipse(x + 6, Y + 8, 6, 5, '#b8693a');
      R(x + 3, Y + 1, 6, 3, '#b8693a'); R(x + 2, Y, 8, 2, '#d88a52');
      R(x + 2, Y + 6, 2, 4, '#e6a06a'); R(x + 1, Y + 9, 10, 1, '#8a4a28'); R(x + 4, Y + 12, 4, 1, '#8a4a28');
    });
  }
}

const SKIN = ['#f1c7a0', '#d9a37a', '#a8744f', '#7a4f33', '#f5d0b5', '#c98e62'];
const HAIR = ['#2a1c14', '#5a3a22', '#d8b060', '#1a1a1a', '#8a4a2a', '#e0e0e0'];
const CLOTH = ['#8a6fb0', '#c8a84a', '#5a9ac8', '#c85a6a', '#6ab87a', '#d08a4a', '#7a8a9a'];
function drawPerson(x, y, look, o = {}) { // x = centro, y = pés
  const f = o.facing || 1, arms = o.arms || 0;
  const P = (lx, ly, w, h, c) => R(f > 0 ? x + lx : x - lx - w, y + ly, w, h, c);
  P(-2, -3, 2, 3, '#3a3030'); P(1, -3, 2, 3, '#3a3030');
  P(-3, -9, 6, 6, look.cloth); P(-3, -9, 1, 6, shade(look.cloth, -0.3));
  P(-2, -14, 5, 5, look.skin); P(-2, -15, 5, 2, look.hair); P(-3, -14, 1, 3, look.hair);
  if (o.eyesClosed) P(1, -12, 2, 1, '#2a1c14'); else P(1, -12, 1, 1, '#2a1c14');
  if (arms > 0) { P(-4, -13, 1, 4, look.skin); P(3, -13, 1, 4, look.skin); }
}

class Captive {
  constructor(sp, style, lines, known) {
    this.id = sp.id; this.x = sp.c * TS + 3; this.y = sp.r * TS + 2; this.w = 10; this.h = 14; this.style = style;
    this.hp = 3; this.freed = false; this.ft = 0; this.t = randi(0, 100); this.shakeT = 0; this.dead = false; this.hittable = true; this.known = known;
    this.look = { skin: pick(SKIN), hair: pick(HAIR), cloth: pick(CLOTH) }; this.line = pick(lines); this.light = 26; this.vy = 0;
  }
  update(sc) {
    this.t++; if (this.shakeT > 0) this.shakeT--;
    if (this.freed) {
      this.ft++;
      if (this.ft === 30 || this.ft === 60) this.vy = -3;
      this.vy += 0.25; this.y += this.vy;
      if (this.y > this.baseY) { this.y = this.baseY; this.vy = 0; }
      if (this.ft > 40 && this.ft % 4 === 0) sc.part(this.x + rand(0, 10), this.y + rand(0, 14), 0, -0.6, '#fff3c2', 30, 1, 0);
      if (this.ft > 150) this.dead = true;
    }
  }
  hit(sc) {
    if (this.freed) return;
    this.hp--; this.shakeT = 10; Snd.play('bind');
    for (let i = 0; i < 5; i++) sc.part(this.x + 5, this.y + 7, rand(-1.5, 1.5), rand(-2, 0), this.bindColor(), 24, 1, 0.1);
    if (this.hp <= 0) {
      this.freed = true; this.hittable = false; this.baseY = this.y;
      for (let i = 0; i < 24; i++) { const a = rand(0, 6.28); sc.part(this.x + 5, this.y + 7, Math.cos(a) * rand(1, 3), Math.sin(a) * rand(1, 3), this.bindColor(), 40, 2, 0.05); }
      sc.onCaptive(this);
    }
  }
  bindColor() { return { casulo: '#d8d4e8', gaiola: '#f2cf5b', correntes: '#ff7a3a', bolha: '#9ff0ff', sombra: '#4a4458' }[this.style]; }
  draw(sc) {
    const sx = this.shakeT > 0 ? ((this.shakeT % 2) * 2 - 1) : 0;
    const x = this.x + 5 + sx, y = this.y + 14, t = this.t;
    if (this.freed) {
      const a = this.ft > 110 ? (150 - this.ft) / 40 : 1;
      G.globalAlpha = clamp(a, 0, 1);
      circ(x, y - 8, 10 + Math.sin(this.ft * 0.2) * 2, 'rgba(255,240,180,0.18)');
      drawPerson(x, y, this.look, { arms: 1 });
      G.globalAlpha = 1;
      return;
    }
    const st = this.style;
    if (st === 'bolha') { circ(x, y - 8, 10, 'rgba(120,230,255,0.12)'); }
    drawPerson(x, y, this.look, { eyesClosed: st === 'casulo' || st === 'sombra' });
    const k = 3 - this.hp;
    if (st === 'casulo') {
      for (let i = 0; i < 5 - k; i++) R(x - 4, y - 13 + i * 3 + (t >> 4) % 2, 9, 2, i % 2 ? '#bfbad2' : '#e2def0');
      if (t % 60 < 30) { R(x + 5, y - 19, 3, 1, '#d8d0ff'); R(x + 7, y - 18, 1, 1, '#d8d0ff'); R(x + 5, y - 17, 3, 1, '#d8d0ff'); }
    } else if (st === 'gaiola') {
      const c = '#e6c35a';
      R(x - 7, y - 20, 15, 2, c); R(x - 7, y, 15, 2, '#b38b2c');
      for (let i = 0; i < 5 - k; i++) R(x - 7 + i * 3.5, y - 18, 1, 18, c);
      R(x - 1, y - 23, 3, 3, c);
    } else if (st === 'correntes') {
      for (let i = 0; i < 3 - k; i++) { const yy = y - 12 + i * 4; for (let j = -5; j < 6; j += 2) R(x + j, yy + ((j + i) % 2), 2, 2, (t + j * 3) % 20 < 10 ? '#ff7a3a' : '#c84a1a'); }
    } else if (st === 'bolha') {
      ring(x, y - 8, 10, (t % 40 < 20) ? '#9ff0ff' : '#c9a2ff');
      if (k < 2) ring(x, y - 8, 8, 'rgba(160,240,255,0.5)');
      R(x - 5, y - 15, 2, 2, '#ffffff');
    } else if (st === 'sombra') {
      G.globalAlpha = 0.75 - k * 0.2;
      circ(x, y - 8, 9, '#1a1822'); circ(x - 4, y - 12, 5, '#24202e');
      G.globalAlpha = 1;
      for (let i = 0; i < 3 - k; i++) R(x - 6 + i * 4, y - 6 - i * 3, 12 - i * 2, 2, '#5a5468');
    }
  }
}

class Ebenezer {
  constructor(x, y, id) { this.id = id; this.x = Math.round(x); this.y = Math.round(y); this.w = 14; this.h = 16; this.lit = false; this.t = 0; this.dead = false; this.light = 0; }
  update(sc) {
    this.t++; this.light = this.lit ? 70 : 18;
    if (!this.lit) for (const p of sc.players) if (p.state === 'alive' && overlap(this, p)) { this.lit = true; sc.onCheckpoint(this); break; }
    if (this.lit && this.t % 3 === 0) sc.part(this.x + 7 + rand(-2, 2), this.y + 1, rand(-0.2, 0.2), -rand(0.4, 1), pick(['#ffd86b', '#ff9a3a', '#fff2b0']), 22, 1, 0);
  }
  draw() {
    const x = this.x, y = this.y;
    if (this.lit) circ(x + 7, y + 6, 14 + Math.sin(this.t * 0.1), 'rgba(255,210,120,0.12)');
    ellipse(x + 7, y + 13, 7, 3, '#77737e'); ellipse(x + 7, y + 9, 6, 3, '#8b8793'); ellipse(x + 7, y + 5, 5, 2, '#9d99a5');
    R(x + 3, y + 12, 3, 1, '#5a5662'); R(x + 9, y + 8, 2, 1, '#6a6672');
    if (this.lit) { R(x + 5, y, 4, 3, '#ff9a3a'); R(x + 6, y - 2, 2, 3, '#ffd86b'); R(x + 6, y + 1, 2, 1, '#fff2b0'); }
    else R(x + 6, y + 2, 2, 1, '#4a4652');
  }
}

class Spring {
  constructor(x, y) { this.x = x; this.y = y; this.w = 14; this.h = 6; this.t = 0; this.dead = false; }
  update(sc) {
    if (this.t > 0) this.t--;
    for (const p of sc.players) {
      if (p.state !== 'alive' || p.vy < 0) continue;
      if (overlapR(p.x, p.y + p.h - 4, p.w, 4, this.x, this.y, this.w, this.h)) {
        p.vy = p.ch.id === 'pastora' ? -10.4 : -9.8; p.ry = 0; p.dashes = p.maxDashes; p.airJumps = p.maxAirJumps; p.jumpCut = false; p.grounded = false; p.coyote = 0; p.springT = 20;
        this.t = 12; Snd.play('spring');
        for (let i = 0; i < 8; i++) sc.part(this.x + 7, this.y, rand(-1.5, 1.5), rand(-2.5, -0.5), '#9fe8ff', 26, 2, 0.08);
      }
    }
  }
  draw() {
    const x = this.x, y = this.y, sq = this.t > 6 ? 2 : 0;
    R(x + 1, y + 4, 12, 2, '#5a6a7a');
    R(x + 3, y + 1 + sq, 8, 3 - sq, '#4fa8d8');
    R(x + 2, y + sq, 10, 1, '#9fe8ff');
    if (this.t > 0) for (let i = 0; i < 3; i++) R(x + 3 + i * 3, y - 3 - (12 - this.t), 1, 2, '#c8f4ff');
  }
}

class Sign {
  constructor(x, y, text) { this.x = x; this.y = y; this.w = 12; this.h = 14; this.text = text; this.near = 0; this.dead = false; }
  update(sc) {
    let n = false;
    for (const p of sc.players) if (p.state === 'alive' && Math.abs(ecx(p) - (this.x + 6)) < 44 && Math.abs(wrapDY(ecy(p) - (this.y + 7))) < 60) n = true;
    this.near = clamp(this.near + (n ? 0.12 : -0.08), 0, 1);
  }
  draw() {
    const x = this.x, y = this.y;
    R(x + 5, y + 5, 2, 9, '#6b4426'); R(x, y, 12, 7, '#a8784a'); R(x, y + 6, 12, 1, '#6b4426'); R(x + 2, y + 2, 8, 1, '#5a3a22'); R(x + 2, y + 4, 6, 1, '#5a3a22');
  }
}

class ExitPortal {
  constructor(x, y) { this.x = x; this.y = y; this.w = 24; this.h = 40; this.t = 0; this.dead = false; this.light = 80; }
  update(sc) {
    this.t++;
    if (this.t % 2 === 0) sc.part(this.x + rand(0, 24), this.y + 40, 0, -rand(0.5, 1.5), pick(['#fff3c2', '#ffffff', '#ffe08a']), 40, 1, 0);
    if (this.t > 40) for (const p of sc.players) if (p.state === 'alive' && overlap(this, p)) { sc.completePhase(); break; }
  }
  draw() {
    const x = this.x, y = this.y, t = this.t, g = Math.min(1, t / 40);
    G.globalAlpha = g;
    circ(x + 12, y + 18, 30 + Math.sin(t * 0.05) * 3, 'rgba(255,240,190,0.12)');
    R(x, y + 6, 24, 34, '#fff3c2'); circ(x + 12, y + 8, 12, '#fff3c2');
    R(x + 3, y + 8, 18, 32, '#ffffff'); circ(x + 12, y + 9, 9, '#ffffff');
    R(x - 2, y + 38, 28, 2, '#e8c96a');
    G.globalAlpha = 1;
  }
}

class Slime {
  constructor(x, y) { this.x = Math.round(x); this.y = Math.round(y); this.w = 10; this.h = 3; this.l = 200; this.dead = false; }
  update(sc) {
    if (--this.l <= 0) this.dead = true;
    for (const p of sc.players) if (p.state === 'alive' && p.grounded && overlap(this, p)) p.slowT = 12;
  }
  draw() { G.globalAlpha = Math.min(1, this.l / 60) * 0.8; R(this.x, this.y + 1, 10, 2, '#9b8fc0'); R(this.x + 2, this.y, 6, 1, '#b8aedc'); G.globalAlpha = 1; }
}
