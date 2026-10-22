// ============================================================
//  Inimigos: comportamentos (IA) e desenhos
// ============================================================
class Enemy {
  constructor(type, x, y, sc, o = {}) {
    const t = ETYPES[type];
    this.type = type; this.t = t; this.w = t.w; this.h = t.h;
    this.x = Math.round(x - t.w / 2); this.y = Math.round(mod(y - t.h, WORLD_H));
    this.rx = 0; this.ry = 0; this.vx = 0; this.vy = 0; this.kx = 0; this.ky = 0;
    this.facing = chance(0.5) ? 1 : -1;
    this.maxHp = Math.max(1, Math.round(t.hp * sc.diff.ehp)); this.hp = this.maxHp;
    this.state = 'idle'; this.timer = randi(40, 110); this.flash = 0; this.dead = false; this.active = !!o.wave; this.anim = randi(0, 999);
    this.bnd = o.bnd || null; this.home = { x: this.x, y: this.y }; this.grounded = false; this.spawnT = o.spawnT || 0; this.wave = !!o.wave;
    this.light = t.light || 0; this.swell = 0; this.scale = 1; this.alpha = 1; this.open = 0; this.faced = false;
  }
  get cx() { return this.x + this.w / 2; } get cy() { return this.y + this.h / 2; }
  update(sc) {
    this.anim++; if (this.flash > 0) this.flash--; if (this.open > 0) this.open--;
    if (this.spawnT > 0) { this.spawnT--; if (this.spawnT % 3 === 0) sc.part(this.cx + rand(-8, 8), this.cy + rand(-8, 8), 0, -0.4, '#2a1438', 20, 2, 0); return; }
    AI[this.t.ai](this, sc);
    if (this.dead) return;
    if (this.alpha < 0.5) return;
    for (const p of sc.players) {
      if (p.state !== 'alive' || !overlapR(this.x + 1, this.y + 1, this.w - 2, this.h - 2, p.x, p.y, p.w, p.h)) continue;
      const feet = p.y + p.h, top = this.y;
      const fromAbove = p.vy > 0.5 && wrapDY(feet - top) <= 7 && wrapDY(feet - top) >= -2;
      if (fromAbove && !this.t.spiky && p.dashT <= 0) {
        this.hurt(1, p, sc, 'stomp');
        p.vy = Input.held(p.dev, 'jump') ? -6.2 : -4.6; p.jumpCut = Input.held(p.dev, 'jump');
        p.dashes = p.maxDashes; p.airJumps = p.maxAirJumps;
        Snd.play('jump'); sc.part(p.cx, feet, 0, 0, '#ffffff', 8, 3, 0);
      } else if (p.hurt(sc, this.cx)) {
        if (this.type === 'balao') this.die(sc, p);
      }
    }
  }
  physics(sc, grav = true) {
    if (grav) this.vy = Math.min(this.vy + 0.3, 4.5);
    const hx = moveX(this, this.vx + this.kx); this.kx *= 0.8;
    const hy = moveY(this, this.vy + this.ky); this.ky *= 0.8;
    if (hy) { this.vy = 0; this.ky = 0; }
    this.grounded = onGround(this);
    return hx;
  }
  fly(sc) {
    const hx = moveX(this, this.vx + this.kx); this.kx *= 0.85;
    const hy = moveY(this, this.vy + this.ky); this.ky *= 0.85;
    if (hx) this.vx = -this.vx * 0.3; if (hy) this.vy = -this.vy * 0.3;
  }
  groundAhead() {
    const ax = this.facing > 0 ? this.x + this.w + 1 : this.x - 2, ay = this.y + this.h + 2;
    const t = tileAt(Math.floor(ax / TS), Math.floor(ay / TS));
    return isSolidT(t) || t === T_ONEWAY;
  }
  walk(sc, spd) {
    if (this.grounded) {
      this.vx = this.facing * spd * sc.diff.espd;
      if (solidRect(this.x + this.facing * 2, this.y, this.w, this.h, this.bnd) || !this.groundAhead()) { this.facing = -this.facing; this.vx = 0; }
    } else this.vx *= 0.95;
  }
  hurt(d, src, sc, how) {
    if (this.dead) return 'dead';
    if (this.immune && this.immune(how, src)) { Snd.play('tink'); sc.part(this.cx, this.cy, 0, -1, '#ffffff', 10, 2, 0); return 'immune'; }
    if (this.reflects && this.reflects(how, src)) { Snd.play('tink'); return 'reflect'; }
    this.hp -= d; this.flash = 7; Snd.play('hit');
    for (let i = 0; i < 4; i++) sc.part(this.cx, this.cy, rand(-1.5, 1.5), rand(-2, 0.5), '#ffffff', 12, 1, 0.05);
    if (this.hp <= 0) this.die(sc, src);
    return 'hit';
  }
  knock(kx, ky) { if (!this.t.heavy && !this.t.fly) { this.kx = kx; this.ky = ky * 0.4; } else if (this.t.fly) { this.kx = kx * 0.6; this.ky = ky * 0.4; } }
  die(sc, src) {
    if (this.dead) return;
    this.dead = true; Snd.play('kill'); sc.freeze(2);
    for (let i = 0; i < 16; i++) { const a = rand(0, 6.28), s = rand(0.5, 2.2); sc.part(this.cx, this.cy, Math.cos(a) * s, Math.sin(a) * s, pick(['#1a1224', '#2e2040', '#3d2a52']), randi(20, 34), 2, -0.02); }
    for (let i = 0; i < 6; i++) sc.part(this.cx + rand(-4, 4), this.cy + rand(-4, 4), rand(-0.3, 0.3), -rand(0.6, 1.4), '#fff3c2', randi(30, 50), 1, 0);
    if (this.type === 'balao') { for (let i = 0; i < 8; i++) spawnEnemyProj(sc, 'shard', this.cx, this.cy, i / 8 * Math.PI * 2); Snd.play('pop'); }
    sc.onEnemyDie(this);
  }
  draw(sc) {
    if (this.spawnT > 0) {
      const k = 1 - this.spawnT / 40;
      circ(this.cx, this.cy, 4 + k * 8, 'rgba(30,10,40,0.85)'); ring(this.cx, this.cy, 5 + k * 9, '#7a3aa8');
      return;
    }
    const c = col => this.flash > 0 ? '#ffffff' : col;
    const ol = () => '#0b0912';
    const ghost = this.type === 'sombra' || this.type === 'nevoa';
    G.globalAlpha = this.alpha;
    wrapDraw(this.y, this.h, oy => {
      const x = Math.round(this.x), y = Math.round(this.y) + oy;
      if (!ghost) { G.globalAlpha = this.alpha * 0.85; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) EDRAW[this.type](this, x + dx, y + dy, ol); G.globalAlpha = this.alpha; }
      EDRAW[this.type](this, x, y, c);
    });
    G.globalAlpha = 1;
  }
}

function nearestPlayer(sc, e) {
  let best = null, bd = 1e9;
  for (const p of sc.players) if (p.state === 'alive') { const d = edist(p, e); if (d < bd) { bd = d; best = p; } }
  return best;
}

const AI = {
  walker(e, sc) {
    e.walk(sc, e.t.speed);
    if (e.t.slime && e.grounded && e.anim % 36 === 0) sc.objs.push(new Slime(e.x + 2, e.y + e.h - 3));
    e.physics(sc);
  },
  hover(e, sc) {
    const p = nearestPlayer(sc, e);
    if (!p) { e.fly(sc); return; }
    const side = ecx(p) < e.cx ? 1 : -1;
    const tx = ecx(p) + side * 72, ty = ecy(p) - 50 + Math.sin(e.anim * 0.04) * 12;
    const dx = tx - e.cx, dy = wrapDY(ty - e.cy), sp = sc.diff.espd;
    e.vx = approach(e.vx, clamp(dx * 0.02, -1, 1) * sp, 0.05);
    e.vy = approach(e.vy, clamp(dy * 0.02, -1, 1) * sp, 0.05);
    e.facing = ecx(p) > e.cx ? 1 : -1;
    e.fly(sc);
    if (--e.timer <= 0) {
      e.timer = Math.round(e.t.fire / sc.diff.efire) + randi(-25, 25);
      const a = angTo(e, p), n = e.t.burst || 1;
      for (let i = 0; i < n; i++) spawnEnemyProj(sc, e.t.proj, e.cx, e.cy, a + (i - (n - 1) / 2) * 0.28);
      Snd.play('shoot_e'); e.open = 14;
    }
  },
  hopper(e, sc) {
    const was = e.grounded;
    if (e.grounded) {
      e.vx = approach(e.vx, 0, 0.25);
      if (--e.timer <= 0) {
        const p = nearestPlayer(sc, e);
        const dir = p ? (sign(ecx(p) - e.cx) || e.facing) : e.facing;
        e.facing = dir; e.vy = -5.2; e.vx = dir * 1.9 * sc.diff.espd; e.timer = randi(50, 90); e.open = 30;
      }
    }
    if (e.physics(sc)) e.vx = -e.vx * 0.5;
    if (!was && e.grounded) { sc.shake(1, 4); for (let i = 0; i < 5; i++) sc.part(e.cx + rand(-8, 8), e.y + e.h, rand(-1, 1), -0.4, '#c8b8d8', 18, 1, 0); }
  },
  charger(e, sc) {
    const p = nearestPlayer(sc, e);
    if (e.state === 'idle') {
      e.walk(sc, e.t.speed);
      if (p && e.grounded && Math.abs(wrapDY(ecy(p) - e.cy)) < 26 && Math.abs(ecx(p) - e.cx) < 170) {
        e.facing = sign(ecx(p) - e.cx) || e.facing; e.state = 'wind'; e.timer = 32; e.vx = 0;
      }
    } else if (e.state === 'wind') {
      e.vx = 0; if (e.anim % 4 === 0) sc.part(e.cx - e.facing * 6, e.y + e.h, -e.facing, -0.5, '#d8d0c0', 14, 1, 0);
      if (--e.timer <= 0) { e.state = 'charge'; e.timer = 80; }
    } else if (e.state === 'charge') {
      e.vx = e.facing * e.t.chargeSpd * sc.diff.espd;
      if (e.anim % 2 === 0) sc.part(e.cx, e.cy, -e.facing, 0, e.type === 'brasa' ? '#ff7a2a' : '#f2cf5b', 14, 2, 0);
      const ga = e.groundAhead();
      const hit = e.physics(sc);
      if (hit || --e.timer <= 0 || !ga) { e.state = 'stun'; e.timer = 45; e.vx = 0; if (hit) { sc.shake(2, 6); Snd.play('land'); } }
      return;
    } else if (e.state === 'stun') {
      e.vx = 0; if (--e.timer <= 0) { e.state = 'idle'; if (p) e.facing = sign(ecx(p) - e.cx) || e.facing; }
    }
    e.physics(sc);
  },
  floater(e, sc) {
    const p = nearestPlayer(sc, e);
    if (p) {
      const a = angTo(e, p), sp = 0.5 * sc.diff.espd;
      e.vx = approach(e.vx, Math.cos(a) * sp, 0.02); e.vy = approach(e.vy, Math.sin(a) * sp + Math.sin(e.anim * 0.05) * 0.25, 0.02);
    }
    e.swell = Math.min(1, e.swell + 0.0025);
    e.fly(sc);
  },
  pavao(e, sc) {
    const p = nearestPlayer(sc, e);
    if (e.state === 'idle') {
      e.walk(sc, e.t.speed);
      if (--e.timer <= 0 && e.grounded) { e.state = 'fan'; e.timer = 110; e.vx = 0; if (p) e.facing = sign(ecx(p) - e.cx) || e.facing; }
    } else {
      e.vx = 0; e.timer--;
      if ((e.timer === 70 || e.timer === 35) && p) { const a = angTo(e, p); for (let i = -1; i <= 1; i++) spawnEnemyProj(sc, 'shard', e.cx, e.y + 4, a + i * 0.3); Snd.play('shoot_e'); }
      if (e.timer <= 0) { e.state = 'idle'; e.timer = randi(120, 190); }
    }
    e.physics(sc);
  },
  turret(e, sc) {
    e.physics(sc);
    const p = nearestPlayer(sc, e); if (!p) return;
    e.facing = sign(ecx(p) - e.cx) || 1;
    if (Math.abs(ecx(p) - e.cx) > 280) return;
    if (--e.timer <= 0) {
      e.timer = Math.round(e.t.fire / sc.diff.efire) + randi(-20, 20);
      const T = 46, g = 0.15, dx = ecx(p) - e.cx, dy = wrapDY(ecy(p) - (e.y + 2));
      spawnEnemyProj(sc, 'thorn', e.cx, e.y + 2, 0, { vx: clamp(dx / T, -3.6, 3.6), vy: clamp((dy - 0.5 * g * T * T) / T, -6.5, 2) });
      e.open = 16; Snd.play('shoot_e');
    }
  },
  lunger(e, sc) {
    const p = nearestPlayer(sc, e);
    if (e.state === 'idle') {
      e.walk(sc, e.t.speed);
      if (--e.timer < 0 && p && e.grounded && Math.abs(ecx(p) - e.cx) < 100 && Math.abs(wrapDY(ecy(p) - e.cy)) < 44) {
        e.state = 'coil'; e.timer = 22; e.facing = sign(ecx(p) - e.cx) || e.facing; e.vx = 0;
      }
    } else if (e.state === 'coil') {
      e.vx = 0; if (--e.timer <= 0) { e.state = 'leap'; e.vy = -3.8; e.vx = e.facing * 3.3 * sc.diff.espd; e.grounded = false; }
    } else if (e.state === 'leap') {
      if (e.grounded && e.vy >= 0) { e.state = 'idle'; e.timer = 50; }
    }
    e.physics(sc);
  },
  lure(e, sc) {
    const p = nearestPlayer(sc, e);
    if (e.state === 'idle') {
      const ty = e.home.y + Math.sin(e.anim * 0.03) * 6, tx = e.home.x + Math.sin(e.anim * 0.013) * 10;
      e.vx = approach(e.vx, clamp((tx - e.x) * 0.03, -0.6, 0.6), 0.03); e.vy = approach(e.vy, clamp(wrapDY(ty - e.y) * 0.03, -0.6, 0.6), 0.03);
      if (p) e.facing = sign(ecx(p) - e.cx) || e.facing;
      if (e.timer > 0) e.timer--;
      if (p && e.timer <= 0 && edist(e, p) < 100) { e.state = 'reveal'; e.timer = 24; }
      e.light = 46;
    } else if (e.state === 'reveal') {
      e.vx *= 0.8; e.vy *= 0.8; e.light = 22;
      if (--e.timer <= 0) { e.state = 'dive'; e.timer = 44; const a = p ? angTo(e, p) : 0; const s = 3.1 * sc.diff.espd; e.vx = Math.cos(a) * s; e.vy = Math.sin(a) * s; Snd.play('dash'); }
    } else if (e.state === 'dive') {
      if (--e.timer <= 0) e.state = 'return';
    } else {
      const a = Math.atan2(wrapDY(e.home.y - e.y), e.home.x - e.x);
      e.vx = approach(e.vx, Math.cos(a), 0.06); e.vy = approach(e.vy, Math.sin(a), 0.06);
      if (Math.hypot(e.home.x - e.x, wrapDY(e.home.y - e.y)) < 6) { e.state = 'idle'; e.timer = 70; }
    }
    e.fly(sc);
  },
  mask(e, sc) {
    const p = nearestPlayer(sc, e);
    const ty = e.home.y + Math.sin(e.anim * 0.04) * 5;
    e.vy = approach(e.vy, clamp(wrapDY(ty - e.y) * 0.05, -0.5, 0.5), 0.05); e.vx = approach(e.vx, clamp((e.home.x - e.x) * 0.03, -0.5, 0.5), 0.05);
    if (p) e.facing = sign(ecx(p) - e.cx) || e.facing;
    e.fly(sc);
    e.timer--;
    if (e.state === 'idle') { if (e.timer <= 0) { e.state = 'turn'; e.timer = 22; } }
    else if (e.state === 'turn') { if (e.timer <= 0) { e.state = 'angry'; e.timer = 100; } }
    else if (e.state === 'angry') {
      if ((e.timer === 78 || e.timer === 40) && p) { const a = angTo(e, p); for (let i = -1; i <= 1; i++) spawnEnemyProj(sc, 'lie', e.cx, e.cy, a + i * 0.26); Snd.play('shoot_e'); }
      if (e.timer <= 0) { e.state = 'idle'; e.timer = Math.round(randi(90, 140) / sc.diff.efire); }
    }
  },
  thrower(e, sc) {
    const p = nearestPlayer(sc, e);
    if (e.state === 'idle') {
      e.walk(sc, e.t.speed);
      if (--e.timer <= 0 && p && Math.abs(ecx(p) - e.cx) < 250 && e.grounded) { e.state = 'throw'; e.timer = 30; e.facing = sign(ecx(p) - e.cx) || 1; }
    } else {
      e.vx = 0;
      if (--e.timer === 10 && p) {
        const T = 42, g = 0.2, dx = ecx(p) - e.cx, dy = wrapDY(ecy(p) - (e.y + 2));
        spawnEnemyProj(sc, 'ball', e.cx, e.y + 2, 0, { vx: clamp(dx / T, -3.4, 3.4), vy: clamp((dy - 0.5 * g * T * T) / T, -7, 2) });
        Snd.play('funda');
      }
      if (e.timer <= 0) { e.state = 'idle'; e.timer = Math.round(e.t.fire / sc.diff.efire) + randi(-20, 30); }
    }
    e.physics(sc);
  },
  fear(e, sc) {
    const p = nearestPlayer(sc, e); if (!p) return;
    const faced = sign(e.cx - ecx(p)) === p.facing;
    e.faced = faced;
    if (faced) { e.vx *= 0.85; e.vy *= 0.85; e.scale = approach(e.scale, 0.7, 0.02); }
    else {
      const a = angTo(e, p), sp = 1.15 * sc.diff.espd;
      e.vx = approach(e.vx, Math.cos(a) * sp, 0.06); e.vy = approach(e.vy, Math.sin(a) * sp, 0.06);
      e.scale = approach(e.scale, 1.3, 0.01);
    }
    e.x += e.vx + e.kx; e.y = mod(e.y + e.vy + e.ky, WORLD_H); e.kx *= 0.85; e.ky *= 0.85;
    if (e.bnd) e.x = clamp(e.x, e.bnd.min, e.bnd.max - e.w);
  },
  blinker(e, sc) {
    const p = nearestPlayer(sc, e);
    e.timer--;
    if (e.state === 'idle') {
      e.y = mod(e.y + Math.sin(e.anim * 0.06) * 0.3, WORLD_H);
      if (e.timer <= 0) { e.state = 'fade'; e.timer = 20; }
    } else if (e.state === 'fade') {
      e.alpha = e.timer / 20;
      if (e.timer <= 0) {
        if (p) for (let k = 0; k < 12; k++) {
          const a = rand(0, 6.28), d = rand(70, 130);
          const nx = Math.round(ecx(p) + Math.cos(a) * d - e.w / 2), ny = Math.round(mod(ecy(p) + Math.sin(a) * d - e.h / 2, WORLD_H));
          if (nx > sc.cam + 10 && nx < sc.cam + W - 24 && (!e.bnd || (nx > e.bnd.min && nx < e.bnd.max - e.w)) && !solidRect(nx, ny, e.w, e.h, null)) { e.x = nx; e.y = ny; break; }
        }
        e.state = 'appear'; e.timer = 20;
      }
    } else if (e.state === 'appear') {
      e.alpha = 1 - e.timer / 20;
      if (e.timer <= 0) {
        e.state = 'idle'; e.alpha = 1; e.timer = Math.round(150 / sc.diff.efire) + randi(-20, 20);
        if (p) { spawnEnemyProj(sc, 'doubt', e.cx, e.cy, angTo(e, p)); Snd.play('shoot_e'); }
      }
    }
  },
};
// imunidades/reflexos específicos
ETYPES.pavao.reflect = true;
Enemy.prototype.reflects = function (how, src) {
  return this.type === 'pavao' && this.state === 'fan' && how == null && src && src.vx != null && sign(src.vx) === -this.facing;
};
Enemy.prototype.immune = function (how) {
  if (this.type === 'mascara') return this.state === 'idle' && how !== 'melee' && how !== 'dash' && how !== 'louvor' && how !== 'stomp';
  if (this.type === 'nevoa') return this.alpha < 0.45 && how !== 'louvor';
  return false;
};
ETYPES.corrente.heavy = true; ETYPES.poltrona.heavy = true;

// ------------------------------------------------------------
// Desenhos dos inimigos
// ------------------------------------------------------------
const EDRAW = {
  lesma(e, x, y, c) {
    const f = e.facing, k = Math.sin(e.anim * 0.15) > 0 ? 1 : 0;
    R(x, y + 4, 14, 5, c('#8a80a8')); R(x + 1 + k, y + 3, 11 - k, 1, c('#8a80a8')); R(x + 3, y + 2, 7, 1, c('#9d94bd'));
    R(x, y + 8, 14, 1, c('#5e567a')); R(x + 4, y + 5, 2, 1, c('#6e6690')); R(x + 8, y + 6, 2, 1, c('#6e6690'));
    const hx = f > 0 ? x + 10 : x + 1;
    R(hx, y + 1, 3, 4, c('#9d94bd'));
    const ex1 = f > 0 ? hx + 1 : hx, ex2 = f > 0 ? hx + 3 : hx - 2;
    R(ex1, y - 1, 1, 2, c('#9d94bd')); R(ex2, y, 1, 2, c('#9d94bd'));
    R(ex1 - 1, y - 3, 2, 2, c('#f0ecff')); R(ex1 - 1, y - 3, 2, 1, c('#5e567a'));
    R(ex2 - 1, y - 2, 2, 2, c('#f0ecff')); R(ex2 - 1, y - 2, 2, 1, c('#5e567a'));
  },
  olho(e, x, y, c) {
    const warn = e.timer < 24 && e.anim % 6 < 3;
    R(x + 3, y - 2, 1, 2, c('#3a4058')); R(x + 10, y - 3, 1, 3, c('#3a4058'));
    R(x, y, 14, 11, c('#232838'));
    R(x + 1, y + 1, 12, 9, c(warn ? '#ff5a6a' : (e.anim % 40 < 2 ? '#c8fbff' : '#4fc8e8')));
    for (let i = 0; i < 4; i++) R(x + 1, y + 2 + i * 2, 12, 1, c(warn ? '#e04050' : '#3ab0d0'));
    const p = e.lastP;
    ellipse(x + 7, y + 5, 4, 3, c('#f4fbff'));
    const ox = e.facing, oy = 0;
    R(x + 6 + ox, y + 4 + oy, 2, 2, c('#14182a'));
    R(x + 5, y + 11, 4, 1, c('#232838')); R(x + 3, y + 12, 8, 1, c('#232838'));
  },
  poltrona(e, x, y, c) {
    const air = !e.grounded;
    R(x + 2, y + 14, 2, 2, c('#4a2a20')); R(x + 14, y + 14, 2, 2, c('#4a2a20'));
    R(x + 2, y, 14, 10, c('#8e5a80')); R(x + 2, y, 14, 1, c('#a8749a'));
    R(x + 1, y + 9, 16, 5, c('#7d4a6e')); R(x + 3, y + 9, 12, 1, c('#a86a94'));
    R(x, y + 5, 3, 9, c('#6a3a5c')); R(x + 15, y + 5, 3, 9, c('#6a3a5c')); R(x, y + 5, 3, 1, c('#8e5a80')); R(x + 15, y + 5, 3, 1, c('#8e5a80'));
    for (const bx of [5, 9, 13]) R(x + bx, y + 2, 1, 1, c('#5a2a4a'));
    R(x + 5, y + 5, 3, 2, c('#f0e0ea')); R(x + 10, y + 5, 3, 2, c('#f0e0ea'));
    R(x + 5, y + 5, 3, 1, c('#6a3a5c')); R(x + 10, y + 5, 3, 1, c('#6a3a5c'));
    R(x + 6 + (e.facing > 0 ? 1 : 0), y + 6, 1, 1, c('#2a0a1a')); R(x + 11 + (e.facing > 0 ? 1 : 0), y + 6, 1, 1, c('#2a0a1a'));
    if (air || e.open > 0) { R(x + 5, y + 10, 8, 3, c('#2a0a1a')); R(x + 6, y + 10, 1, 1, c('#ffffff')); R(x + 11, y + 10, 1, 1, c('#ffffff')); }
  },
  caranguejo(e, x, y, c) {
    const f = e.facing, wind = e.state === 'wind', walk = Math.floor(e.anim / 6) % 2;
    for (let i = 0; i < 3; i++) { R(x + 3 + i * 2, y + 10 + (walk ^ (i % 2)), 1, 2, c('#a8822a')); R(x + 14 + i * 2, y + 10 + (walk ^ (i % 2)), 1, 2, c('#a8822a')); }
    ellipse(x + 10, y + 7, 9, 4, c('#d8b04a')); R(x + 3, y + 6, 14, 1, c('#f2d47a'));
    circ(x + 7, y + 7, 2, c('#f2cf5b')); R(x + 7, y + 6, 1, 2, c('#a8822a')); circ(x + 13, y + 8, 2, c('#f2cf5b')); R(x + 13, y + 7, 1, 2, c('#a8822a'));
    R(x + 7, y + 1, 1, 3, c('#a8822a')); R(x + 12, y + 1, 1, 3, c('#a8822a'));
    R(x + 6, y - 1, 3, 2, c(wind ? '#ff4a3a' : '#ffffff')); R(x + 11, y - 1, 3, 2, c(wind ? '#ff4a3a' : '#ffffff'));
    R(x + 7, y - 1, 1, 1, c('#f2cf5b')); R(x + 12, y - 1, 1, 1, c('#f2cf5b'));
    const cx = f > 0 ? x + 18 : x - 2;
    circ(cx + 1, y + 5, 3, c('#c89a3a')); R(cx, y + 4, 3, 1, c('#8a6a1a'));
    circ(cx + 1 + f * 3, y + 2, 2, c('#f2cf5b'));
  },
  balao(e, x, y, c) {
    const s = 7 + e.swell * 4, cx = x + 8, cy = y + 8 + Math.sin(e.anim * 0.08);
    line(cx, cy + s, cx + Math.sin(e.anim * 0.1) * 2, cy + s + 6, c('#c8b8c8'));
    circ(cx, cy, s, c('#d8508e')); circ(cx - s / 3, cy - s / 3, Math.max(1, s / 3), c('#f08ac0'));
    R(cx - 3, cy - s - 2, 7, 2, c('#f2cf5b')); R(cx - 3, cy - s - 4, 1, 2, c('#f2cf5b')); R(cx, cy - s - 4, 1, 2, c('#f2cf5b')); R(cx + 3, cy - s - 4, 1, 2, c('#f2cf5b'));
    R(cx - 4, cy - 1, 3, 1, c('#2a0a1a')); R(cx + 2, cy - 1, 3, 1, c('#2a0a1a'));
    R(cx - 4, cy - 2, 3, 1, c('#a02a60')); R(cx + 2, cy - 2, 3, 1, c('#a02a60'));
    R(cx - 1, cy + 3, 4, 1, c('#2a0a1a')); R(cx + 3, cy + 2, 1, 1, c('#2a0a1a'));
  },
  pavao(e, x, y, c) {
    const f = e.facing, fan = e.state === 'fan';
    const bx = x + 9, by = y + 10;
    if (fan) {
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.36;
        const mx = bx + Math.cos(a) * 11 * (1) - f * 2, my = by + Math.sin(a) * 11;
        line(bx - f * 2, by, mx, my, c('#2a7a5a'));
        circ(mx, my, 3, c('#d8f0ff')); R(mx - 1, my - 1, 2, 2, c((e.anim + i * 5) % 30 < 4 ? '#ffffff' : '#5aa8e8'));
      }
    } else {
      R(f > 0 ? x - 4 : x + 16, y + 9, 6, 2, c('#2a7a5a')); R(f > 0 ? x - 6 : x + 20, y + 10, 3, 2, c('#5aa8e8'));
    }
    ellipse(bx + f, by, 5, 4, c('#2a8a9a'));
    const hx = bx + f * 4;
    R(hx, y + 2, 2, 7, c('#2a6ab0')); circ(hx + 1, y + 2, 2, c('#3a7ac8'));
    R(hx + f * 3, y + 2, 2, 1, c('#e8c84a')); R(hx + (f > 0 ? 1 : 0), y + 1, 1, 1, c('#ffffff'));
    R(hx, y - 2, 1, 2, c('#3a7ac8')); R(hx + 1, y - 3, 1, 2, c('#3a7ac8')); R(hx - 1 + 2 * (f > 0 ? 1 : 0), y - 3, 1, 1, c('#5aa8e8'));
    R(bx - 1, y + 14, 1, 2, c('#c8a84a')); R(bx + 2, y + 14, 1, 2, c('#c8a84a'));
  },
  brasa(e, x, y, c) {
    const fl = Math.floor(e.anim / 4) % 3;
    R(x + 3, y - 1 - fl, 2, 4, c('#ff7a2a')); R(x + 6, y - 2 + fl % 2, 2, 4, c('#ffb43a')); R(x + 8, y - fl % 2, 2, 3, c('#ff7a2a'));
    circ(x + 6, y + 7, 5, c('#8a1a0a')); circ(x + 6, y + 7, 3, c('#d8401a'));
    R(x + 1, y + 1, 1, 3, c('#2a0a05')); R(x + 10, y + 1, 1, 3, c('#2a0a05'));
    const ang = e.state === 'wind' || e.state === 'charge';
    R(x + 3, y + 5, 2, 1, c('#ffe08a')); R(x + 7, y + 5, 2, 1, c('#ffe08a'));
    R(x + 2, y + 4, 3, 1, c('#2a0a05')); R(x + 7, y + 4, 3, 1, c('#2a0a05'));
    R(x + 4, y + 9, 4, 1, c(ang ? '#ffe08a' : '#2a0a05'));
    R(x + 3, y + 11, 2, 1, c('#5a0a05')); R(x + 7, y + 11, 2, 1, c('#5a0a05'));
  },
  lingua(e, x, y, c) {
    const flap = Math.floor(e.anim / 5) % 2, open = e.anim % 12 < 6 || e.open > 0;
    R(x + 1, y - 1 + flap, 4, 2, c('#5a1a2a')); R(x + 11, y - 1 + flap, 4, 2, c('#5a1a2a'));
    ellipse(x + 8, y + 6, 8, 5, c('#c2324a')); R(x + 2, y + 3, 12, 1, c('#e05a70'));
    R(x + 2, y + 5, 12, open ? 3 : 1, c('#3a0a10'));
    for (let i = 0; i < 5; i++) { R(x + 3 + i * 2, y + 5, 1, 1, c('#ffffff')); if (open) R(x + 4 + i * 2, y + 7, 1, 1, c('#ffffff')); }
    const tx = e.facing > 0 ? x + 14 : x - 3;
    R(tx, y + 6, 4, 1, c('#ff7a2a')); R(tx + (e.facing > 0 ? 3 : 0), y + 5, 1, 1, c('#ffb43a')); R(tx + (e.facing > 0 ? 3 : 0), y + 7, 1, 1, c('#ffb43a'));
  },
  raiz(e, x, y, c) {
    R(x + 1, y + 15, 12, 1, c('#3a2a12')); R(x + 3, y + 14, 2, 1, c('#3a2a12')); R(x + 9, y + 14, 3, 1, c('#3a2a12'));
    R(x + 6, y + 5, 3, 10, c('#4a5a22')); R(x + 6, y + 5, 1, 10, c('#5f7030'));
    R(x + 4, y + 8, 2, 1, c('#c8e06a')); R(x + 9, y + 10, 2, 1, c('#c8e06a')); R(x + 4, y + 12, 2, 1, c('#c8e06a'));
    circ(x + 7, y + 4, 4, c('#5a6b2a'));
    if (e.open > 0) { R(x + 4, y + 3, 7, 3, c('#2a1a0a')); R(x + 5, y + 3, 1, 1, c('#e8e0a0')); R(x + 9, y + 3, 1, 1, c('#e8e0a0')); }
    R(x + 5, y + 1, 1, 1, c('#ff5a3a')); R(x + 9, y + 1, 1, 1, c('#ff5a3a'));
    R(x + 2, y + 2, 2, 1, c('#c8e06a')); R(x + 11, y + 3, 2, 1, c('#c8e06a'));
  },
  serpente(e, x, y, c) {
    const f = e.facing, coil = e.state === 'coil' ? 0.6 : 1;
    for (let i = 4; i >= 0; i--) {
      const sx = f > 0 ? x + 3 + i * 3 * coil : x + 15 - i * 3 * coil;
      circ(sx, y + 5 + Math.round(Math.sin(e.anim * 0.2 + i) * 1), 3, c(i % 2 ? '#2f6b4a' : '#3a8a5a'));
    }
    const hx = f > 0 ? x + 3 + 15 * coil : x + 15 - 15 * coil;
    circ(hx, y + 4, 3, c('#4a9a6a')); R(hx + f, y + 3, 1, 1, c('#ffd84a'));
    if (e.anim % 40 < 10 || e.state !== 'idle') { R(f > 0 ? hx + 3 : hx - 5, y + 5, 3, 1, c('#e8475f')); R(f > 0 ? hx + 6 : hx - 6, y + 4, 1, 1, c('#e8475f')); R(f > 0 ? hx + 6 : hx - 6, y + 6, 1, 1, c('#e8475f')); }
  },
  isca(e, x, y, c) {
    const f = e.facing, open = e.state === 'reveal' || e.state === 'dive';
    ellipse(x + 8, y + 8, 8, 6, c('#0b1c2c')); R(x + 2, y + 4, 12, 1, c('#16324a'));
    R(f > 0 ? x + 11 : x + 4, y + 6, 1, 1, c(open ? '#ff4a6a' : '#5a8aa8'));
    if (open) {
      const jx = f > 0 ? x + 11 : x - 1;
      R(jx, y + 7, 6, 6, c('#000000'));
      for (let i = 0; i < 3; i++) { R(jx + i * 2, y + 7, 1, 2, c('#ffffff')); R(jx + 1 + i * 2, y + 11, 1, 2, c('#ffffff')); }
    }
    const lx = x + 8 + f * 11, ly = y - 4 + Math.round(Math.sin(e.anim * 0.07) * 2);
    line(x + 8 + f * 3, y + 2, lx, ly, c('#2a4a5a'));
    const bright = e.state === 'idle';
    circ(lx, ly, bright ? 3 : 2, c(bright ? (e.anim % 30 < 15 ? '#ffb8e8' : '#ffe08a') : '#6a4a5a'));
    if (bright) R(lx - 1, ly - 1, 2, 2, c('#ffffff'));
  },
  mascara(e, x, y, c) {
    const st = e.state, cx = x + 8, cy = y + 8;
    if (st === 'idle') {
      ellipse(cx, cy, 7, 8, c('#f4ead0')); R(cx - 7, cy - 1, 1, 3, c('#d8b04a')); R(cx + 7, cy - 1, 1, 3, c('#d8b04a'));
      R(cx - 5, cy - 3, 3, 1, c('#3a2a1a')); R(cx + 2, cy - 3, 3, 1, c('#3a2a1a')); R(cx - 6, cy - 4, 1, 1, c('#3a2a1a')); R(cx + 5, cy - 4, 1, 1, c('#3a2a1a'));
      R(cx - 6, cy + 1, 2, 1, c('#f0a0b0')); R(cx + 4, cy + 1, 2, 1, c('#f0a0b0'));
      R(cx - 3, cy + 3, 6, 1, c('#3a2a1a')); R(cx - 4, cy + 2, 1, 1, c('#3a2a1a')); R(cx + 3, cy + 2, 1, 1, c('#3a2a1a'));
      R(cx - 1, cy - 9, 2, 2, c('#d8b04a'));
    } else if (st === 'turn') {
      const k = Math.abs(Math.cos(e.timer / 22 * Math.PI));
      ellipse(cx, cy, Math.max(1, 7 * k), 8, c(e.timer > 11 ? '#f4ead0' : '#6a1020'));
    } else {
      ellipse(cx, cy, 7, 8, c('#6a1020')); R(cx - 7, cy - 1, 1, 3, c('#2a0008')); R(cx + 7, cy - 1, 1, 3, c('#2a0008'));
      R(cx - 5, cy - 3, 3, 2, c('#ffd84a')); R(cx + 2, cy - 3, 3, 2, c('#ffd84a'));
      R(cx - 6, cy - 5, 4, 1, c('#1a0004')); R(cx + 2, cy - 5, 4, 1, c('#1a0004'));
      R(cx - 4, cy + 2, 8, 3, c('#0a0002'));
      for (let i = 0; i < 4; i++) R(cx - 4 + i * 2, cy + 2 + (i % 2), 1, 1, c('#ffffff'));
      R(cx - 1, cy - 10, 1, 3, c('#2a0008')); R(cx + 1, cy - 9, 1, 2, c('#2a0008'));
    }
  },
  corrente(e, x, y, c) {
    const f = e.facing, thr = e.state === 'throw';
    circ(x + 8, y + 11, 6, c('#3a3a45')); circ(x + 8 + f * 2, y + 5, 3, c('#2a2a33'));
    R(x + 7 + f * 3, y + 4, 1, 1, c('#ff4a4a')); R(x + 9 + f * 2, y + 4, 1, 1, c('#ff4a4a'));
    for (let i = 0; i < 6; i++) R(x + 3 + i * 2, y + 9 + (i % 2), 2, 1, c('#8a8a99'));
    for (let i = 0; i < 5; i++) R(x + 4 + i * 2, y + 13 - (i % 2), 2, 1, c('#8a8a99'));
    R(x + 5, y + 16, 2, 2, c('#2a2a33')); R(x + 10, y + 16, 2, 2, c('#2a2a33'));
    if (!thr) { line(x + 8 + f * 5, y + 10, x + 8 + f * 9, y + 15, c('#8a8a99')); circ(x + 8 + f * 10, y + 15, 3, c('#4a4a55')); }
    else { line(x + 8 + f * 3, y + 6, x + 8 + f * 6, y - 2, c('#8a8a99')); circ(x + 8 + f * 6, y - 3, 3, c('#4a4a55')); }
  },
  sombra(e, x, y, c) {
    const s = e.scale, cx = x + 7, cy = y + 7;
    G.globalAlpha = e.faced ? 0.55 : 0.92;
    circ(cx, cy - 1, Math.round(6 * s), c('#16121e'));
    for (let i = 0; i < 3; i++) R(cx - 5 * s + i * 4 * s, cy + 3 * s + Math.sin(e.anim * 0.2 + i) * 2, 2, Math.round(5 * s), c('#16121e'));
    if (e.faced) { R(cx - 5, cy - 3, 4, 3, c('#2e2640')); R(cx + 1, cy - 3, 4, 3, c('#2e2640')); }
    else { R(cx - 3, cy - 3, 2, 2, c('#ffffff')); R(cx + 2, cy - 3, 2, 2, c('#ffffff')); R(cx - 2, cy + 1, 4, 1, c('#ffffff')); }
    G.globalAlpha = 1;
  },
  nevoa(e, x, y, c) {
    const a = e.alpha;
    G.globalAlpha = a * 0.8;
    circ(x + 4, y + 8, 4, c('#b8b8cc')); circ(x + 9, y + 6, 5, c('#c8c8dc')); circ(x + 7, y + 10, 4, c('#a8a8bc'));
    G.globalAlpha = a;
    R(x + 5, y + 3, 4, 1, c('#2a2a3a')); R(x + 9, y + 4, 1, 2, c('#2a2a3a')); R(x + 7, y + 6, 2, 1, c('#2a2a3a')); R(x + 7, y + 7, 1, 1, c('#2a2a3a')); R(x + 7, y + 9, 1, 1, c('#2a2a3a'));
    G.globalAlpha = 1;
  },
};
