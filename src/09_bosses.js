// ============================================================
//  Chefes
// ============================================================
const FLOOR_Y = 19 * TS; // topo do chão das salas de chefe

class Boss {
  constructor(sc, room, baseHp) {
    this.sc = sc; this.room = room; this.rx = room.x0;
    this.maxHp = Math.round(baseHp * sc.diff.boss * (1 + 0.6 * (sc.players.length - 1)));
    this.hp = this.maxHp; this.flash = 0; this.t = 0; this.state = 'intro'; this.timer = 140; this.dead = false; this.dying = 0;
    this.phase2 = false; this.hz = []; this.last = null; this.facing = -1; this.dmgMul = 1; this.light = 60;
  }
  get cx() { return this.x + this.w / 2; } get cy() { return this.y + this.h / 2; }
  hurtBox() { return [this.x, this.y, this.w, this.h]; }
  contactBoxes() { return [[this.x + 4, this.y + 4, this.w - 8, this.h - 6]]; }
  hitTest(r) { if (this.dying || this.dead) return false; const b = this.hurtBox(); return b && overlapR(r.x, r.y, r.w, r.h, b[0], b[1], b[2], b[3]); }
  hurt(d, sc) {
    if (this.dead || this.dying || this.state === 'intro') return;
    if (this.invuln) { Snd.play('tink'); return; }
    this.hp -= d * this.dmgMul; this.flash = 5; Snd.play('bosshit', 0.05);
    if (!this.phase2 && this.hp <= this.maxHp / 2) { this.phase2 = true; this.onPhase2 && this.onPhase2(sc); sc.shake(5, 20); Snd.play('roar'); }
    if (this.hp <= 0) { this.hp = 0; this.dying = 1; sc.onBossDying(this); Snd.play('roar'); }
  }
  pickAttack(list) {
    let opts = list.filter(a => a !== this.last);
    const a = pick(opts.length ? opts : list); this.last = a; return a;
  }
  update(sc) {
    this.t++; if (this.flash > 0) this.flash--;
    if (this.dying) {
      this.dying++;
      if (this.dying % 6 === 0) { const x = this.x + rand(0, this.w), y = this.y + rand(0, this.h); for (let i = 0; i < 6; i++) sc.part(x, y, rand(-2, 2), rand(-2, 2), pick(['#1a1224', '#3d2a52', '#fff3c2']), 30, 2, 0); Snd.play('boom', 0.1); sc.shake(2, 6); }
      if (this.dying > 150) { this.dead = true; sc.onBossDead(this); }
      return;
    }
    if (this.state === 'intro') { this.introUpdate && this.introUpdate(sc); if (--this.timer <= 0) this.next(sc); return; }
    this.ai(sc);
    for (const h of this.hz) h.t++;
    this.hz = this.hz.filter(h => h.t < h.end);
    for (const p of sc.players) {
      if (p.state !== 'alive') continue;
      for (const b of this.contactBoxes()) if (overlapR(p.x, p.y, p.w, p.h, b[0], b[1], b[2], b[3])) { p.hurt(sc, this.cx); break; }
      for (const h of this.hz) if (h.act && h.act(h) && overlapR(p.x, p.y, p.w, p.h, ...h.box(h))) p.hurt(sc, h.box(h)[0] + h.box(h)[2] / 2);
    }
  }
  targetPlayer() { const al = this.sc.players.filter(p => p.state === 'alive'); return al.length ? pick(al) : null; }
  fc(col) { return this.flash > 0 ? '#ffffff' : col; }
  draw(sc) {
    if (this.dying) { G.globalAlpha = Math.max(0, 1 - this.dying / 150); if (this.dying % 8 < 4) this.flash = 1; }
    this.render(sc);
    G.globalAlpha = 1;
    for (const h of this.hz) h.draw && h.draw(h);
  }
}

// ------------------------------------------------------------
// 1. PREGUIÇA — O Grande Comodismo
// ------------------------------------------------------------
class BossPreguica extends Boss {
  constructor(sc, room) {
    super(sc, room, 64);
    this.w = 64; this.h = 44; this.x = this.rx + 450; this.y = FLOOR_Y - this.h; this.roll = 0; this.mouth = 0; this.sleep = false;
  }
  next(sc) {
    const list = ['yawn', 'pillows', 'roll'];
    if (this.phase2) list.push('snore', 'yawn');
    this.state = this.pickAttack(list); this.timer = 0;
    if (this.state === 'snore' && sc.enemies.filter(e => !e.dead).length < 2) sc.spawnWaveEnemy('lesma', this.rx + 60 + rand(0, 520), 80);
  }
  ai(sc) {
    this.timer++;
    const sp = this.phase2 ? 1.25 : 1, f = this.facing;
    this.dmgMul = this.state === 'snore' ? 1.6 : 1;
    switch (this.state) {
      case 'idle': this.mouth = 0; if (this.timer > 60 / sp) this.next(sc); break;
      case 'yawn':
        this.mouth = Math.min(1, this.timer / 50);
        if (this.timer === 50 || (this.phase2 && this.timer === 80)) {
          for (const d of [-1, 1]) spawnEnemyProj(sc, 'wave', this.cx + d * 30, FLOOR_Y - 7, d > 0 ? 0 : Math.PI, { speed: 2.3 });
          Snd.play('roar'); sc.shake(3, 10);
        }
        if (this.timer > 100) { this.state = 'idle'; this.timer = 0; }
        break;
      case 'pillows': {
        this.mouth = 0.3;
        const n = this.phase2 ? 5 : 3;
        if (this.timer % 14 === 0 && this.timer <= n * 14) {
          const p = this.targetPlayer();
          if (p) { const T = 52, g = 0.16, sx = this.cx + f * 20, sy = this.y + 10, dx = ecx(p) - sx + rand(-20, 20), dy = ecy(p) - sy; spawnEnemyProj(sc, 'pillow', sx, sy, 0, { vx: clamp(dx / T, -5, 5), vy: (dy - 0.5 * g * T * T) / T }); Snd.play('funda'); }
        }
        if (this.timer > n * 14 + 40) { this.state = 'idle'; this.timer = 0; }
        break;
      }
      case 'roll':
        if (this.timer < 30) { this.roll = 0; }
        else {
          const spd = 2.8 * sp * sc.diff.espd;
          this.x += f * spd; this.roll += f * spd * 0.08;
          if (this.timer % 6 === 0) sc.part(this.cx - f * 30, FLOOR_Y - 2, -f, -0.5, '#c8c0d8', 20, 2, 0);
          if ((f < 0 && this.x <= this.rx + 24) || (f > 0 && this.x + this.w >= this.rx + W - 24)) {
            this.x = clamp(this.x, this.rx + 24, this.rx + W - 24 - this.w); this.facing = -f; this.state = 'idle'; this.timer = 0; sc.shake(4, 12); Snd.play('boom');
            for (let i = 0; i < 4; i++) spawnEnemyProj(sc, 'pillow', this.cx, this.y, 0, { vx: rand(-2.5, 2.5), vy: rand(-5, -3) });
          }
        }
        break;
      case 'snore':
        this.sleep = true; this.mouth = 0.2 + Math.sin(this.timer * 0.1) * 0.2;
        if (this.timer % 24 === 0) { const p = this.targetPlayer(); spawnEnemyProj(sc, 'zzz', this.cx + f * 22, this.y + 4, p ? angTo({ x: this.cx + f * 22, y: this.y + 4, w: 0, h: 0 }, p) : -1.2); }
        if (this.timer > 170) { this.sleep = false; this.state = 'idle'; this.timer = 0; }
        break;
    }
  }
  render() {
    const c = col => this.fc(col), x = Math.round(this.x), y = Math.round(this.y), f = this.facing, cx = x + 32;
    if (this.state === 'roll' && this.timer >= 30) {
      const cy = y + 22;
      circ(cx, cy, 22, c('#8c82a6')); circ(cx, cy, 16, c('#9d94b8'));
      for (let i = 0; i < 3; i++) { const a = this.roll + i * 2.09; line(cx, cy, cx + Math.cos(a) * 20, cy + Math.sin(a) * 20, c('#6e6690'), 2); }
      R(cx - 6, cy - 26, 12, 4, c('#7a3a8a'));
      return;
    }
    const breathe = Math.round(Math.sin(this.t * 0.05) * 1.5);
    ellipse(cx, y + 28 - breathe, 32, 16 + breathe, c('#8c82a6'));
    ellipse(cx - f * 4, y + 32, 22, 10, c('#b8b0cc'));
    R(x + 2, y + 40, 60, 4, c('#5e567a'));
    // braços com garras pendendo
    R(cx + f * 18 - 3, y + 28, 6, 14, c('#7a7098')); for (let i = 0; i < 3; i++) R(cx + f * 18 - 3 + i * 2, y + 42, 1, 2, c('#e8e0d0'));
    R(cx - f * 22 - 3, y + 30, 6, 12, c('#7a7098'));
    // cabeça
    const hx = cx + f * 20, hy = y + 10 + breathe;
    circ(hx, hy, 13, c('#9d94b8')); circ(hx + f * 2, hy + 2, 9, c('#d8d0e4'));
    // manchas de bicho-preguiça e olhos caídos
    ellipse(hx - 4 + f * 2, hy, 3, 2, c('#4a4262')); ellipse(hx + 4 + f * 2, hy, 3, 2, c('#4a4262'));
    if (this.sleep) { R(hx - 6 + f * 2, hy, 4, 1, c('#1a1424')); R(hx + 2 + f * 2, hy, 4, 1, c('#1a1424')); }
    else { R(hx - 5 + f * 2, hy, 2, 1, c('#f0ecff')); R(hx + 3 + f * 2, hy, 2, 1, c('#f0ecff')); }
    const m = this.mouth;
    if (m > 0.1) { ellipse(hx + f * 2, hy + 6, 4 + m * 3, 1 + m * 5, c('#2a0a1a')); R(hx + f * 2 - 1, hy + 4, 2, 1, c('#ffffff')); }
    else R(hx + f * 2 - 2, hy + 6, 4, 1, c('#4a4262'));
    // touca de dormir
    R(hx - 12, hy - 13, 22, 5, c('#7a3a8a')); R(hx - 10 - f * 8, hy - 17, 16, 5, c('#8e4aa0')); R(hx - 14 - f * 12, hy - 14 + Math.round(Math.sin(this.t * 0.06) * 2), 6, 5, c('#8e4aa0'));
    circ(hx - 16 - f * 14, hy - 10 + Math.round(Math.sin(this.t * 0.06) * 2), 3, c('#f4f0ff'));
    R(hx - 12, hy - 9, 24, 2, c('#f4f0ff'));
    if (this.sleep && this.t % 40 < 20) { R(hx + f * 16, hy - 16, 4, 1, '#d8d0ff'); R(hx + f * 16 + 2, hy - 15, 1, 1, '#d8d0ff'); R(hx + f * 16, hy - 14, 4, 1, '#d8d0ff'); }
  }
}

// ------------------------------------------------------------
// 2. SOBERBA — O Rei Inchado
// ------------------------------------------------------------
class BossSoberba extends Boss {
  constructor(sc, room) {
    super(sc, room, 64);
    this.r = 22; this.px = this.rx + 420; this.py = 110; this.w = 44; this.h = 44; this.vy = 0; this.ground = 0; this.crown = null;
    this.sync();
  }
  sync() { this.r = Math.round(22 + (1 - this.hp / this.maxHp) * 14); this.w = this.h = this.r * 2; this.x = this.px - this.r; this.y = this.py - this.r; }
  hurtBox() { const k = this.r * 0.8; return [this.px - k, this.py - k, k * 2, k * 2 + 6]; }
  contactBoxes() { const k = this.r * 0.75; return [[this.px - k, this.py - k, k * 2, k * 2]]; }
  onPhase2(sc) { sc.spawnWaveEnemy('balao', this.rx + 80, 80); sc.spawnWaveEnemy('balao', this.rx + 560, 80); }
  next(sc) {
    const list = ['crown', 'coins', 'slam']; if (this.phase2) list.push('slam', 'crown');
    this.state = this.pickAttack(list); this.timer = 0;
  }
  ai(sc) {
    this.timer++;
    const sp = this.phase2 ? 1.3 : 1;
    const hoverX = this.rx + 320 + Math.sin(this.t * 0.011 * sp) * 210, hoverY = 122 + Math.sin(this.t * 0.027) * 26;
    this.dmgMul = this.state === 'slam' && this.ground > 0 ? 1.5 : 1;
    if (this.state !== 'slam') { this.px = lerp(this.px, hoverX, 0.03 * sp); this.py = lerp(this.py, hoverY, 0.05); }
    switch (this.state) {
      case 'idle': if (this.timer > 70 / sp) this.next(sc); break;
      case 'crown':
        if (this.timer === 25) { const p = this.targetPlayer(); if (p) { const a = angTo({ x: this.px, y: this.py, w: 0, h: 0 }, p); const pr = spawnEnemyProj(sc, 'crown', this.px, this.py - this.r, a, { speed: 4.2 }); pr.boomer = this; Snd.play('shoot_e'); } }
        if (this.phase2 && this.timer === 70) { const p = this.targetPlayer(); if (p) { const a = angTo({ x: this.px, y: this.py, w: 0, h: 0 }, p); const pr = spawnEnemyProj(sc, 'crown', this.px, this.py - this.r, a + 0.5, { speed: 4.2 }); pr.boomer = this; } }
        if (this.timer > 150) { this.state = 'idle'; this.timer = 0; }
        break;
      case 'coins':
        if (this.timer > 30 && this.timer < 150 && this.timer % Math.round(7 / sp) === 0) {
          const pr = spawnEnemyProj(sc, 'coin', this.rx + rand(32, W - 32), 10, Math.PI / 2, { speed: 0.5 }); pr.floorKill = true; pr.vy = 0.5;
          if (this.timer % 21 === 0) Snd.play('tink');
        }
        if (this.timer > 190) { this.state = 'idle'; this.timer = 0; }
        break;
      case 'slam':
        if (this.timer < 40) { this.py -= 0.6; this.sw = this.timer / 40; }
        else if (this.ground === 0) {
          this.vy = Math.min(this.vy + 0.6, 9); this.py += this.vy;
          if (this.py + this.r >= FLOOR_Y) {
            this.py = FLOOR_Y - this.r; this.ground = 1; this.vy = 0; sc.shake(6, 16); Snd.play('boom');
            for (const d of [-1, 1]) spawnEnemyProj(sc, 'wave', this.px + d * this.r, FLOOR_Y - 7, d > 0 ? 0 : Math.PI, { speed: 2.6 });
            for (let i = 0; i < 6; i++) spawnEnemyProj(sc, 'shard', this.px, this.py - this.r, -Math.PI / 2 + (i - 2.5) * 0.35, { speed: 2.4 });
          }
        } else {
          this.ground++;
          if (this.ground > 80) { this.py -= 1.5; if (this.py < 140) { this.ground = 0; this.state = 'idle'; this.timer = 0; } }
        }
        break;
    }
    this.sync();
  }
  render() {
    const c = col => this.fc(col), x = Math.round(this.px), y = Math.round(this.py), r = this.r;
    const sq = this.ground > 0 && this.ground < 20 ? 3 : 0;
    // capa
    ellipse(x, y + 4, r + 4, r - 2 - sq, c('#4a1a5a'));
    ellipse(x, y + sq, r, r - sq, c('#8a2a9a'));
    ellipse(x - r / 3, y - r / 3, Math.max(2, r / 3), Math.max(2, r / 4), c('#b04ac0'));
    // gola de arminho
    for (let i = -r + 4; i < r - 3; i += 4) { circ(x + i, y - r * 0.45, 3, c('#f4f0f4')); R(x + i, y - r * 0.45, 1, 1, c('#1a1a1a')); }
    // faixa dourada
    R(x - r + 3, y + r * 0.25, r * 2 - 6, 3, c('#f2cf5b'));
    // cabecinha empinada
    const hy = y - r * 0.6 - 8;
    circ(x, hy, 7, c('#f1c7a0'));
    R(x - 5, hy - 1, 3, 1, c('#2a1424')); R(x + 2, hy - 1, 3, 1, c('#2a1424'));
    R(x - 5, hy - 2, 3, 1, c('#c8968a')); R(x + 2, hy - 2, 3, 1, c('#c8968a'));
    R(x - 1, hy - 1, 3, 4, c('#e8a888')); R(x - 1, hy - 3, 2, 2, c('#e8a888'));
    R(x - 3, hy + 4, 5, 1, c('#8a3a3a')); R(x + 2, hy + 3, 1, 1, c('#8a3a3a'));
    // coroa minúscula (ou ausente se atirada)
    const crownOut = this.sc.projs.some(p => p.kind === 'crown' && !p.dead);
    if (!crownOut) { R(x - 4, hy - 10, 9, 3, c('#f2cf5b')); R(x - 4, hy - 12, 1, 2, c('#f2cf5b')); R(x, hy - 13, 1, 3, c('#f2cf5b')); R(x + 4, hy - 12, 1, 2, c('#f2cf5b')); R(x - 1, hy - 9, 2, 1, c('#e8475f')); }
    // bracinhos
    const arm = this.state === 'coins' && this.timer > 20 ? -6 : 0;
    R(x - r - 3, y - 2 + arm, 5, 3, c('#8a2a9a')); R(x + r - 2, y - 2 + arm, 5, 3, c('#8a2a9a'));
    R(x - r - 4, y - 3 + arm, 2, 3, c('#f1c7a0')); R(x + r + 2, y - 3 + arm, 2, 3, c('#f1c7a0'));
    if (this.state === 'slam' && this.timer < 40) ring(x, y, r + 3 + (this.t % 4), 'rgba(255,200,240,0.6)');
  }
}

// ------------------------------------------------------------
// 3. IRA — A Fera de Brasa
// ------------------------------------------------------------
class BossIra extends Boss {
  constructor(sc, room) {
    super(sc, room, 80);
    this.w = 60; this.h = 42; this.x = this.rx + 460; this.y = FLOOR_Y - this.h; this.vx = 0; this.vy = 0; this.air = false; this.leg = 0;
  }
  contactBoxes() { return [[this.x + 4, this.y + 6, this.w - 8, this.h - 6]]; }
  next(sc) {
    const list = ['charge', 'breath', 'leap']; if (this.phase2) list.push('charge', 'leap');
    this.state = this.pickAttack(list); this.timer = 0;
    const p = this.targetPlayer(); if (p) this.facing = sign(ecx(p) - this.cx) || this.facing;
  }
  ai(sc) {
    this.timer++;
    const sp = (this.phase2 ? 1.25 : 1) * sc.diff.espd, f = this.facing;
    this.dmgMul = this.state === 'stun' ? 1.6 : 1;
    switch (this.state) {
      case 'idle': {
        const p = this.targetPlayer();
        if (p) { this.facing = sign(ecx(p) - this.cx) || f; if (Math.abs(ecx(p) - this.cx) > 90) { this.x += this.facing * 0.6 * sp; this.leg += 0.2; } }
        if (this.timer > 60 / sp) this.next(sc);
        break;
      }
      case 'charge':
        if (this.timer < 40) { if (this.timer % 5 === 0) { sc.part(this.cx - f * 28, FLOOR_Y - 2, -f * 1.5, -1, '#d8d0c0', 18, 2, 0); sc.part(this.cx + f * 30, this.y + 12, f * 0.5, -0.8, '#a0a0a0', 30, 2, 0); } }
        else {
          this.x += f * 5.2 * sp; this.leg += 0.6;
          if (this.timer % 2 === 0) sc.part(this.cx - f * 30, this.y + rand(10, 40), -f * 2, 0, '#ff7a2a', 16, 2, 0);
          if ((f < 0 && this.x <= this.rx + 18) || (f > 0 && this.x + this.w >= this.rx + W - 18)) {
            this.x = clamp(this.x, this.rx + 18, this.rx + W - 18 - this.w);
            this.state = 'stun'; this.timer = 0; sc.shake(8, 24); Snd.play('boom');
            const n = this.phase2 ? 9 : 6;
            for (let i = 0; i < n; i++) { const rx = this.rx + 40 + (i + rand(0, 1)) * (560 / n); const pr = spawnEnemyProj(sc, 'rock', rx, 10, Math.PI / 2, { speed: 0.3 }); pr.floorKill = true; pr.delay = randi(0, 50); pr.warnX = rx; }
            if (this.phase2) for (const d of [-1, 1]) spawnEnemyProj(sc, 'wave', this.cx + d * 34, FLOOR_Y - 7, d > 0 ? 0 : Math.PI, { speed: 2.6 });
          }
        }
        break;
      case 'stun': if (this.timer > 70) { this.state = 'idle'; this.timer = 0; this.facing = -f; } break;
      case 'breath':
        if (this.timer > 24 && this.timer < 84 && this.timer % 4 === 0) {
          const p = this.targetPlayer(); const base = p ? angTo({ x: this.cx + f * 30, y: this.y + 14, w: 0, h: 0 }, p) : (f > 0 ? 0 : Math.PI);
          spawnEnemyProj(sc, 'flame', this.cx + f * 30, this.y + 14, base + rand(-0.25, 0.25), { speed: 3.4 });
          Snd.play('dash', 0.1);
        }
        if (this.timer > 110) { this.state = 'idle'; this.timer = 0; }
        break;
      case 'leap':
        if (this.timer === 20) {
          const p = this.targetPlayer(); const tx = p ? clamp(ecx(p) - this.w / 2, this.rx + 20, this.rx + W - 20 - this.w) : this.x;
          this.vy = -8.5; this.vx = (tx - this.x) / 50; this.air = true;
        }
        if (this.air) {
          this.vy += 0.34; this.x += this.vx; this.y += this.vy;
          if (this.y >= FLOOR_Y - this.h && this.vy > 0) {
            this.y = FLOOR_Y - this.h; this.air = false; sc.shake(7, 18); Snd.play('boom');
            for (const d of [-1, 1]) spawnEnemyProj(sc, 'wave', this.cx + d * 32, FLOOR_Y - 7, d > 0 ? 0 : Math.PI, { speed: 2.4 * sp });
            this.state = 'idle'; this.timer = 0;
          }
        }
        break;
    }
    this.x = clamp(this.x, this.rx + 16, this.rx + W - 16 - this.w);
  }
  render() {
    const c = col => this.fc(col), x = Math.round(this.x), y = Math.round(this.y), f = this.facing;
    const glow = this.phase2 ? (this.t % 20 < 10 ? '#ff9a3a' : '#ffd86b') : (this.t % 40 < 20 ? '#e8502a' : '#ff7a3a');
    const legs = [8, 18, 40, 50];
    legs.forEach((lx, i) => { const off = Math.round(Math.sin(this.leg + i * 1.6) * 2); R(f > 0 ? x + lx : x + this.w - lx - 6, y + 32 + Math.min(0, off), 6, 10 - Math.min(0, off), c('#3a0a05')); });
    ellipse(x + 30, y + 22, 28, 15, c('#5a1208'));
    ellipse(x + 30 - f * 6, y + 12, 18, 9, c('#6a1a0c'));
    for (let i = 0; i < 5; i++) { const lx = x + 10 + i * 9; line(lx, y + 14 + (i % 2) * 4, lx + 5, y + 24 + (i % 3) * 3, c(glow)); }
    const hx = f > 0 ? x + 52 : x + 8, hy = y + 18;
    circ(hx, hy, 10, c('#4a0e06')); R(hx - 6 + f * 4, hy + 4, 8, 5, c('#3a0a05'));
    R(hx + f * 6 - 1, hy + 6, 2, 1, c('#1a0503')); R(hx + f * 3 - 1, hy + 6, 2, 1, c('#1a0503'));
    const eye = this.state === 'charge' || this.phase2 ? '#ffe08a' : '#ff5a2a';
    R(hx + f * 2 - 1, hy - 3, 3, 2, c(eye)); R(hx - f * 4 - 1, hy - 3, 3, 2, c(eye));
    R(hx + f * 2 - 2, hy - 5, 5, 1, c('#1a0503'));
    // chifres
    line(hx - 6, hy - 6, hx - 12, hy - 16, c('#e8dcc8'), 2); line(hx + 6, hy - 6, hx + 12, hy - 16, c('#e8dcc8'), 2);
    R(hx - 13, hy - 18, 2, 2, c('#fff8ec')); R(hx + 12, hy - 18, 2, 2, c('#fff8ec'));
    if (this.state === 'breath' && this.timer > 10) circ(hx + f * 8, hy + 6, 4, c('#ffb43a'));
    if (this.t % 30 < 15 && this.state !== 'charge') R(hx + f * 9, hy + 2, 2, 2, 'rgba(200,200,200,0.6)');
    if (this.state === 'stun') for (let i = 0; i < 3; i++) { const a = this.t * 0.1 + i * 2.1; R(hx + Math.cos(a) * 12, hy - 18 + Math.sin(a) * 3, 2, 2, '#ffe08a'); }
  }
}

// ------------------------------------------------------------
// 4. A SERPENTE — A Enganadora de Máscara
// ------------------------------------------------------------
class BossSerpente extends Boss {
  constructor(sc, room) {
    super(sc, room, 66);
    this.hx = this.rx + 520; this.hy = 120; this.ang = Math.PI; this.spd = 2.0; this.hist = [];
    for (let i = 0; i < 120; i++) this.hist.push([this.hx + i * 2, this.hy]);
    this.w = 24; this.h = 20; this.tgt = null; this.spitT = 90; this.diveT = 0; this.light = 70;
    this.sync();
  }
  sync() { this.hx = clamp(this.hx, this.rx + 16, this.rx + W - 16); this.x = this.hx - 12; this.y = this.hy - 10; }
  segs() { const out = []; for (let i = 1; i <= 12; i++) { const h = this.hist[Math.min(this.hist.length - 1, i * 8)]; out.push(h); } return out; }
  hurtBox() { return [this.hx - 15, this.hy - 13, 30, 26]; }
  contactBoxes() {
    const b = [[this.hx - 10, this.hy - 8, 20, 16]];
    for (const [sx, sy] of this.segs()) b.push([sx - 6, sy - 6, 12, 12]);
    return b;
  }
  onPhase2(sc) { sc.spawnWaveEnemy('mascara', this.rx + 100, 120); sc.spawnWaveEnemy('mascara', this.rx + 540, 120); for (let i = 0; i < 30; i++) sc.part(this.hx, this.hy, rand(-3, 3), rand(-3, 3), '#f2d890', 30, 2, 0.1); }
  newTarget() { this.tgt = [this.rx + rand(60, W - 60), rand(50, 290)]; }
  next(sc) { this.state = 'weave'; this.timer = 0; this.newTarget(); }
  introUpdate() { this.hist.unshift([this.hx, this.hy]); this.hist.length = 120; }
  ai(sc) {
    this.timer++;
    const sp = (this.phase2 ? 2.7 : 2.1) * sc.diff.espd;
    if (this.state === 'weave') {
      if (!this.tgt) this.newTarget();
      const want = Math.atan2(wrapDY(this.tgt[1] - this.hy), this.tgt[0] - this.hx);
      let da = mod(want - this.ang + Math.PI, Math.PI * 2) - Math.PI;
      this.ang += clamp(da, -0.055, 0.055);
      this.hx += Math.cos(this.ang) * sp; this.hy = mod(this.hy + Math.sin(this.ang) * sp, WORLD_H);
      if (Math.hypot(this.tgt[0] - this.hx, wrapDY(this.tgt[1] - this.hy)) < 26) this.newTarget();
      this.hx = clamp(this.hx, this.rx + 20, this.rx + W - 20);
      if (--this.spitT <= 0) {
        this.spitT = Math.round((this.phase2 ? 70 : 100) / sc.diff.efire);
        const p = this.targetPlayer(); if (p) { const a = Math.atan2(wrapDY(ecy(p) - this.hy), ecx(p) - this.hx); for (let i = -1; i <= 1; i++) spawnEnemyProj(sc, 'venom', this.hx, this.hy, a + i * 0.25); Snd.play('shoot_e'); }
      }
      if (this.timer > (this.phase2 ? 360 : 460)) { this.state = 'rise'; this.timer = 0; const p = this.targetPlayer(); this.diveX = p ? ecx(p) : this.rx + 320; }
    } else if (this.state === 'rise') {
      const want = Math.atan2(wrapDY(24 - this.hy), this.diveX - this.hx);
      let da = mod(want - this.ang + Math.PI, Math.PI * 2) - Math.PI; this.ang += clamp(da, -0.09, 0.09);
      this.hx += Math.cos(this.ang) * sp * 1.3; this.hy = mod(this.hy + Math.sin(this.ang) * sp * 1.3, WORLD_H);
      if (Math.hypot(this.diveX - this.hx, wrapDY(24 - this.hy)) < 18 || this.timer > 150) { this.state = 'aim'; this.timer = 0; Snd.play('warn'); }
    } else if (this.state === 'aim') {
      this.ang = approach(this.ang, Math.PI / 2, 0.15);
      if (this.timer % 10 === 0) Snd.play('warn');
      if (this.timer > 34) { this.state = 'dive'; this.timer = 0; this.ang = Math.PI / 2; }
    } else if (this.state === 'dive') {
      this.hy = mod(this.hy + 6 * sc.diff.espd, WORLD_H);
      if (this.timer % 3 === 0) sc.part(this.hx + rand(-6, 6), this.hy, 0, -1, '#5ff0e0', 20, 2, 0);
      if (this.timer > 75) { this.state = 'weave'; this.timer = 0; this.newTarget(); }
    }
    this.hist.unshift([this.hx, this.hy]); this.hist.length = 120;
    this.sync();
  }
  render() {
    const c = col => this.fc(col);
    const segs = this.segs();
    for (let i = segs.length - 1; i >= 0; i--) {
      const [sx, sy] = segs[i], r = Math.round(9 - i * 0.3);
      circ(sx, sy, r, c(i % 2 ? '#1f5a4a' : '#2a7a5a'));
      R(sx - 2, sy - r + 2, 4, 2, c('#3a9a72'));
      if (sy > WORLD_H - 12) circ(sx, sy - WORLD_H, r, c(i % 2 ? '#1f5a4a' : '#2a7a5a'));
      if (sy < 12) circ(sx, sy + WORLD_H, r, c(i % 2 ? '#1f5a4a' : '#2a7a5a'));
    }
    const drawHead = oy => {
      const x = Math.round(this.hx), y = Math.round(this.hy) + oy, f = Math.cos(this.ang) >= 0 ? 1 : -1;
      circ(x, y, 12, c('#2a7a5a'));
      if (!this.phase2) {
        ellipse(x + f * 2, y, 9, 10, c('#f2d890')); R(x + f * 2 - 9, y - 1, 2, 3, c('#d8b04a')); R(x + f * 2 + 8, y - 1, 2, 3, c('#d8b04a'));
        R(x + f * 2 - 6, y - 3, 4, 1, c('#8a6a2a')); R(x + f * 2 + 2, y - 3, 4, 1, c('#8a6a2a'));
        R(x + f * 2 - 3, y + 4, 6, 1, c('#c84a5a')); R(x + f * 2 - 1, y - 10, 2, 3, c('#ffffff'));
        R(x + f * 2 - 7, y + 1, 2, 1, c('#f0a0b0')); R(x + f * 2 + 5, y + 1, 2, 1, c('#f0a0b0'));
      } else {
        ellipse(x + f * 2 - f * 4, y, 6, 10, c('#f2d890'));
        R(x + f * 2 - f * 2, y - 10, 1, 20, c('#1a1a1a'));
        circ(x + f * 6, y - 2, 3, c('#ffd84a')); R(x + f * 6, y - 4, 1, 5, c('#000000'));
        R(x + f * 4, y + 5, 7, 2, c('#000000')); R(x + f * 5, y + 7, 1, 2, c('#ffffff')); R(x + f * 9, y + 7, 1, 2, c('#ffffff'));
      }
      if (this.t % 50 < 12) { R(x + f * 13, y + 4, 4, 1, c('#e8475f')); R(x + f * 17, y + 3, 1, 1, c('#e8475f')); R(x + f * 17, y + 5, 1, 1, c('#e8475f')); }
      if (this.state === 'aim') ring(x, y, 16 + (this.t % 6), '#ff5a7a');
    };
    drawHead(0); if (this.hy > WORLD_H - 14) drawHead(-WORLD_H); if (this.hy < 14) drawHead(WORLD_H);
    if (this.state === 'aim') { G.globalAlpha = 0.25 + 0.2 * Math.sin(this.t * 0.6); R(this.hx - 8, 0, 16, WORLD_H, '#ff5a7a'); G.globalAlpha = 1; }
  }
}

// ------------------------------------------------------------
// 5. O ACUSADOR
// ------------------------------------------------------------
const ACCUSATIONS = ['CULPADO', 'INDIGNO', 'FRACASSO', 'HIPÓCRITA', 'SEM PERDÃO', 'INÚTIL', 'ACABOU', 'SUJO', 'NINGUÉM TE QUER'];
class BossAcusador extends Boss {
  constructor(sc, room) {
    super(sc, room, 90);
    this.w = 40; this.h = 76; this.spots = [this.rx + 470, this.rx + 300, this.rx + 130]; this.spot = 0;
    this.x = this.spots[0]; this.y = 140; this.baseY = 140; this.alpha = 1; this.eyes = 0; this.light = 50;
  }
  hurtBox() { return [this.x + 2, this.y + 4, this.w - 4, this.h - 12]; }
  contactBoxes() { return [[this.x + 8, this.y + 14, this.w - 16, this.h - 30]]; }
  onPhase2(sc) { sc.spawnWaveEnemy('sombra', this.rx + 60, 60); sc.spawnWaveEnemy('sombra', this.rx + 580, 60); }
  next(sc) {
    const list = ['words', 'chains', 'sweep', 'words']; if (this.phase2) list.push('teleport', 'shadows', 'chains');
    this.state = this.pickAttack(list); this.timer = 0;
    this.targetY = pick([128, 168, 200]);
  }
  ai(sc) {
    this.timer++;
    const sp = this.phase2 ? 1.3 : 1;
    if (this.targetY) this.baseY = approach(this.baseY, this.targetY, 0.8);
    this.y = this.baseY + Math.sin(this.t * 0.03) * 8;
    this.invuln = this.alpha < 0.5;
    this.eyes = Math.max(0, this.eyes - 0.03);
    switch (this.state) {
      case 'idle': if (this.timer > 55 / sp) this.next(sc); break;
      case 'words': {
        this.eyes = 1;
        const n = this.phase2 ? 4 : 3;
        if (this.timer % 28 === 0 && this.timer <= n * 28) {
          const p = this.targetPlayer();
          if (p) {
            const ox = this.cx, oy = this.y + 20;
            if (this.phase2 && this.timer === 56) { for (let i = 0; i < 6; i++) this.word(sc, ox, oy, i / 6 * Math.PI * 2 + this.t * 0.1, 1.4); }
            else { const a = angTo({ x: ox, y: oy, w: 0, h: 0 }, p); this.word(sc, ox, oy, a, 1.8); }
            Snd.play('shoot_e');
          }
        }
        if (this.timer > n * 28 + 40) { this.state = 'idle'; this.timer = 0; }
        break;
      }
      case 'chains':
        if (this.timer === 1) {
          for (const p of sc.players) if (p.state === 'alive') this.chain(ecx(p));
          if (this.phase2) { this.chain(this.rx + rand(40, 600)); this.chain(this.rx + rand(40, 600)); }
        }
        if (this.timer > 110) { this.state = 'idle'; this.timer = 0; }
        break;
      case 'sweep':
        if (this.timer === 1) {
          const low = chance(0.5), fromLeft = this.cx > this.rx + 320;
          const y = low ? FLOOR_Y - 14 : FLOOR_Y - 42, h = low ? 12 : 22;
          const rx = this.rx;
          this.hz.push({ t: 0, end: 150, y, h, fromLeft, warn: 45,
            act: hh => hh.t > hh.warn,
            box: hh => { const k = clamp((hh.t - hh.warn) / 60, 0, 1); const w = k * (W - 32); return hh.fromLeft ? [rx + 16, hh.y, w, hh.h] : [rx + W - 16 - w, hh.y, w, hh.h]; },
            draw: hh => {
              if (hh.t <= hh.warn) { G.globalAlpha = 0.3 + 0.3 * Math.sin(hh.t * 0.5); R(rx + 16, hh.y, W - 32, hh.h, '#ff3a5a'); G.globalAlpha = 1; return; }
              const b = hh.box(hh); R(b[0], b[1], b[2], b[3], '#d8c8a0');
              for (let i = 0; i < b[2]; i += 10) { R(b[0] + i + 2, b[1] + 3, 6, 1, '#8a1a2a'); if (hh.h > 14) R(b[0] + i + 1, b[1] + 9, 7, 1, '#8a1a2a'); }
              R(b[0], b[1], b[2], 1, '#f4ead0'); R(b[0], b[1] + b[3] - 1, b[2], 1, '#a89870');
            } });
          Snd.play('warn');
        }
        if (this.timer > 150) { this.state = 'idle'; this.timer = 0; }
        break;
      case 'teleport':
        if (this.timer < 25) this.alpha = 1 - this.timer / 25;
        else if (this.timer === 25) { this.spot = (this.spot + 1 + randi(0, 1)) % 3; this.x = this.spots[this.spot]; }
        else if (this.timer < 50) this.alpha = (this.timer - 25) / 25;
        else { this.alpha = 1; this.state = 'words'; this.timer = 0; }
        break;
      case 'shadows':
        if (this.timer === 20 && sc.enemies.filter(e => !e.dead).length < 3) { sc.spawnWaveEnemy('sombra', this.rx + 60, 60); sc.spawnWaveEnemy('sombra', this.rx + 580, 60); }
        if (this.timer > 60) { this.state = 'idle'; this.timer = 0; }
        break;
    }
  }
  word(sc, x, y, a, spd) {
    const text = pick(ACCUSATIONS);
    const w = Math.max(24, text.length * 5 + 4);
    const p = spawnEnemyProj(sc, 'word', x, y, a, { speed: spd });
    p.text = text; p.w = w; p.x = x - w / 2;
  }
  chain(x) {
    const cxx = clamp(x, this.rx + 24, this.rx + W - 24);
    this.hz.push({ t: 0, end: 100, x: cxx, warn: 50,
      act: hh => hh.t > hh.warn && hh.t < hh.warn + 34,
      box: hh => [hh.x - 6, 0, 12, WORLD_H],
      draw: hh => {
        if (hh.t <= hh.warn) { G.globalAlpha = 0.25 + 0.25 * Math.sin(hh.t * 0.6); R(hh.x - 6, FLOOR_Y - 4, 12, 4, '#ff3a5a'); R(hh.x - 1, 0, 2, FLOOR_Y, '#ff3a5a'); G.globalAlpha = 1; return; }
        if (hh.t > hh.warn + 34) return;
        const k = clamp((hh.t - hh.warn) / 8, 0, 1), top = FLOOR_Y - k * FLOOR_Y;
        for (let y = FLOOR_Y; y > top; y -= 6) { R(hh.x - 3, y - 5, 6, 4, '#6a6a78'); R(hh.x - 1, y - 6, 2, 6, '#9a9aa8'); }
      } });
    Snd.play('warn');
  }
  render() {
    const c = col => this.fc(col), x = Math.round(this.x), y = Math.round(this.y), w = this.w, h = this.h;
    G.globalAlpha *= this.alpha;
    circ(x + w / 2, y + h / 2, 30, 'rgba(10,0,20,0.12)');
    // manto
    R(x + 4, y + 18, w - 8, h - 30, c('#1a1622'));
    for (let i = 0; i < 5; i++) { const off = Math.round(Math.sin(this.t * 0.1 + i) * 2); R(x + 4 + i * 7, y + h - 14 + off, 6, 14 - off, c('#1a1622')); }
    R(x + 2, y + 22, 4, 30, c('#24202e')); R(x + w - 6, y + 22, 4, 30, c('#24202e'));
    // capuz
    for (let i = 0; i < 30; i++) { const hw = Math.min(30, Math.round(3 + i * 1.15)); R(x + w / 2 - hw / 2 + Math.round(Math.sin(this.t * 0.05) * (30 - i) / 30), y - 8 + i, hw, 1, c(i < 2 ? '#2e2838' : '#221e2c')); }
    ellipse(x + w / 2, y + 17, 8, 9, c('#050308'));
    const eyeC = this.eyes > 0.5 ? '#ff3a4a' : '#d8e0ff';
    R(x + w / 2 - 5, y + 15, 3, 2, c(eyeC)); R(x + w / 2 + 2, y + 15, 3, 2, c(eyeC));
    // mão e pergaminho
    const sx = x - 14, sy = y + 30;
    R(sx + 10, sy, 8, 3, c('#c8c0b0'));
    R(sx, sy - 4, 12, 4, c('#a8784a'));
    R(sx + 1, sy, 10, 40, c('#d8c8a0'));
    for (let i = 0; i < 8; i++) R(sx + 2 + (i % 2), sy + 3 + i * 4, 6 + (i * 3) % 3, 1, c('#8a1a2a'));
    R(sx, sy + 40, 12, 4, c('#a8784a'));
    // correntes penduradas
    for (let i = 0; i < 5; i++) R(x + w - 4, y + 40 + i * 4, 2, 3, c('#7a7a88'));
  }
}

const BOSS_CLASSES = { preguica: BossPreguica, soberba: BossSoberba, ira: BossIra, serpente: BossSerpente, acusador: BossAcusador };
