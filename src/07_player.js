// ============================================================
//  Jogador: movimento fluido (coyote, buffer, dash, wall-jump)
// ============================================================
const PH = {
  grav: 0.34, fall: 4.4, fastFall: 6.4, fastGrav: 0.6, run: 2.3, acc: 0.44, dec: 0.52, airAcc: 0.32, airDec: 0.1, overDec: 0.035,
  jump: -5.6, cut: 0.45, apex: 0.55, coyote: 6, buf: 7, slide: 1.2, wjx: 2.7, wjy: -5.3, wlock: 10,
  dashS: 5.1, dashF: 9, dashCd: 16,
};

class Player {
  constructor(slot, ci, dev, sc) {
    this.slot = slot; this.ci = ci; this.ch = CHARACTERS[ci]; this.dev = dev;
    this.w = 8; this.h = 12; this.x = 0; this.y = 0; this.rx = 0; this.ry = 0; this.vx = 0; this.vy = 0; this.bnd = null;
    this.facing = 1; this.grounded = false; this.coyote = 0; this.jumpBuf = 0; this.jumpCut = false;
    const d = sc.diff;
    this.maxHp = d.hearts + (this.ch.id === 'guardiao' ? 1 : 0) + (Save.hasGift('cura') ? 1 : 0);
    this.hp = this.maxHp;
    this.maxDashes = 1; this.dashes = 1; this.dashT = 0; this.dashCd = 0; this.dashDir = { x: 1, y: 0 }; this.dashHits = new Set();
    this.maxAirJumps = Save.hasGift('fe') ? 1 : 0; this.airJumps = this.maxAirJumps;
    this.wallDir = 0; this.wallLock = 0; this.sliding = false;
    this.iframes = 0; this.state = 'alive'; this.downT = 0; this.reviveP = 0;
    this.slots = [null, null]; this.active = 0; this.shield = false;
    this.louvor = d.louvor; this.maxLouvor = 3;
    this.swordT = 0; this.swordCd = 0; this.swordDir = 'f'; this.swordHits = new Set(); this.swordTile = false;
    this.shootCd = 0; this.shootAnim = 0; this.aimA = 0;
    this.runT = 0; this.landT = 0; this.after = []; this.slowT = 0; this.benT = 0; this.dropT = 0; this.springT = 0; this.fruitFlash = 0; this.t = 0;
  }
  get cx() { return this.x + this.w / 2; } get cy() { return this.y + this.h / 2; }
  fruit() { return this.slots[this.active]; }
  jumpV() { return this.ch.id === 'pastora' ? -6.1 : PH.jump; }

  update(sc) {
    this.t++;
    if (this.state === 'down') { this.updateDown(sc); return; }
    const I = this.dev, held = k => Input.held(I, k), pr = k => Input.pressed(I, k);
    for (const k of ['iframes', 'dashCd', 'swordCd', 'shootCd', 'shootAnim', 'wallLock', 'slowT', 'dropT', 'fruitFlash', 'springT', 'landT']) if (this[k] > 0) this[k]--;
    const mx = (held('r') ? 1 : 0) - (held('l') ? 1 : 0);
    const my = (held('d') ? 1 : 0) - (held('u') ? 1 : 0);

    if (pr('swap')) { this.active = 1 - this.active; Snd.play('swap'); this.fruitFlash = 50; const f = this.fruit(); sc.ftext(f ? FRUITS[f].name : 'Sem fruto', this.cx, this.y - 8, f ? FRUITS[f].color : '#aaa'); }
    if (pr('special')) this.useLouvor(sc);

    const was = this.grounded;
    this.grounded = this.dropT > 0 ? solidRect(this.x, this.y + 1, this.w, this.h, null) : onGround(this);
    if (this.grounded) {
      this.coyote = PH.coyote; this.dashes = this.maxDashes; this.airJumps = this.maxAirJumps;
      if (!was && this.vy >= 0) { this.landT = 5; Snd.play('land', 0.1); for (let i = 0; i < 4; i++) sc.part(this.cx + rand(-4, 4), this.y + this.h - 1, rand(-1, 1), rand(-0.6, 0), '#d8d0c0', 16, 1, 0.02); }
    } else if (this.coyote > 0) this.coyote--;

    this.wallDir = 0;
    if (!this.grounded) {
      if (solidRect(this.x - 1, this.y, this.w, this.h, null)) this.wallDir = -1;
      else if (solidRect(this.x + 1, this.y, this.w, this.h, null)) this.wallDir = 1;
    }
    if (pr('jump')) this.jumpBuf = PH.buf; else if (this.jumpBuf > 0) this.jumpBuf--;

    if (this.dashT > 0) this.updateDash(sc);
    else {
      const maxRun = PH.run * (this.slowT > 0 ? 0.55 : 1);
      let acc = this.grounded ? PH.acc : PH.airAcc;
      if (this.wallLock > 0) acc *= 0.2;
      if (mx !== 0) {
        if (Math.abs(this.vx) > maxRun && sign(this.vx) === mx) this.vx = approach(this.vx, mx * maxRun, this.grounded ? PH.dec * 0.4 : PH.overDec);
        else this.vx = approach(this.vx, mx * maxRun, acc);
        if (this.swordT <= 0) this.facing = mx;
      } else this.vx = approach(this.vx, 0, this.grounded ? PH.dec : PH.airDec);

      let g = PH.grav;
      if (!this.grounded) {
        if (held('jump') && Math.abs(this.vy) < 1.1) g *= PH.apex;
        if (my > 0 && this.vy > 0) g = PH.fastGrav;
      }
      this.vy += g;
      let maxF = my > 0 ? PH.fastFall : PH.fall;
      this.sliding = false;
      if (this.wallDir && mx === this.wallDir && this.vy > 0) {
        maxF = PH.slide; this.sliding = true;
        if (this.t % 6 === 0) sc.part(this.wallDir > 0 ? this.x + this.w : this.x, this.y + rand(2, 10), -this.wallDir * 0.4, 0.3, '#d8d0c0', 14, 1, 0);
      }
      if (this.vy > maxF) this.vy = approach(this.vy, maxF, 0.7);
      if (this.jumpCut && !held('jump') && this.vy < 0) { this.vy *= PH.cut; this.jumpCut = false; }
      if (this.vy >= 0) this.jumpCut = false;

      if (this.jumpBuf > 0) {
        if (this.grounded || this.coyote > 0) {
          if (my > 0 && this.grounded && onOnewayOnly(this)) { this.dropT = 12; this.y = mod(this.y + 1, WORLD_H); this.jumpBuf = 0; this.grounded = false; this.coyote = 0; }
          else this.doJump(sc, 'ground');
        } else if (this.wallDir) this.doJump(sc, 'wall');
        else if (this.airJumps > 0) this.doJump(sc, 'air');
      }
      if (pr('dash') && this.dashes > 0 && this.dashCd <= 0) this.startDash(sc, mx, my);
    }

    if (moveX(this, this.vx)) { if (this.dashT > 0 && this.dashDir.y === 0) this.dashT = 1; this.vx = 0; }
    if (moveY(this, this.vy)) {
      if (this.vy < 0) { if (!this.cornerCorrect()) this.vy = 0; }
      else this.vy = 0;
    }
    this.runT += Math.abs(this.vx) * 0.7;

    this.updateSword(sc, mx, my);
    this.updateShoot(sc, mx, my);

    if (rectHasTile(this.x + 2, this.y + 4, this.w - 4, this.h - 5, T_SPIKE)) { if (this.hurt(sc, null)) this.vy = -4.6; }
    if (this.fruit() === 'benignidade') {
      if (++this.benT >= 480) {
        this.benT = 0;
        for (const p of sc.players) if (p.state === 'alive' && edist(p, this) < 110 && p.hp < p.maxHp) { p.hp++; sc.ftext('+1', p.cx, p.y - 6, '#f5a3d6'); }
        for (let i = 0; i < 16; i++) { const a = rand(0, 6.28); sc.part(this.cx + Math.cos(a) * 16, this.cy + Math.sin(a) * 16, 0, -0.5, '#f5a3d6', 30, 1, 0); }
        Snd.play('heart');
      }
    }
    if (this.after.length) { for (const a of this.after) a.l--; this.after = this.after.filter(a => a.l > 0); }
  }

  cornerCorrect() {
    for (const off of [1, -1, 2, -2, 3, -3, 4, -4]) {
      if (!solidRect(this.x + off, this.y - 1, this.w, this.h, this.bnd)) { this.x += off; return true; }
    }
    return false;
  }
  doJump(sc, type) {
    const jv = this.jumpV();
    if (type === 'ground') { this.vy = jv; this.coyote = 0; Snd.play('jump'); for (let i = 0; i < 3; i++) sc.part(this.cx, this.y + this.h, rand(-1, 1), rand(-0.5, 0), '#d8d0c0', 14, 1, 0); }
    else if (type === 'wall') {
      this.vy = PH.wjy; this.vx = -this.wallDir * PH.wjx; this.wallLock = PH.wlock; this.facing = -this.wallDir; Snd.play('walljump');
      for (let i = 0; i < 5; i++) sc.part(this.wallDir > 0 ? this.x + this.w : this.x, this.cy, -this.wallDir * rand(0.5, 1.5), rand(-1, 1), '#d8d0c0', 16, 1, 0);
    } else {
      this.vy = jv * 0.92; this.airJumps--; Snd.play('djump');
      for (let i = 0; i < 8; i++) sc.part(this.cx + rand(-6, 6), this.y + this.h, rand(-1.2, 1.2), rand(0.3, 1.2), '#f4f2ff', 22, 1, 0.02);
    }
    this.jumpBuf = 0; this.jumpCut = true; this.grounded = false;
  }
  startDash(sc, mx, my) {
    let dx = mx, dy = my;
    if (!dx && !dy) dx = this.facing;
    if (this.grounded && dy > 0) dy = 0;
    if (!dx && !dy) dx = this.facing;
    const n = Math.hypot(dx, dy);
    this.dashDir = { x: dx / n, y: dy / n };
    this.dashT = PH.dashF; this.dashCd = this.ch.id === 'peregrino' ? 9 : PH.dashCd;
    if (!this.grounded) this.dashes--;
    this.dashHits.clear(); this.jumpCut = false;
    if (dx) this.facing = sign(dx);
    Snd.play('dash');
  }
  updateDash(sc) {
    this.dashT--;
    this.vx = this.dashDir.x * PH.dashS; this.vy = this.dashDir.y * PH.dashS;
    this.after.push({ x: this.x, y: this.y, f: this.facing, l: 14 });
    if (this.fruit() === 'dominio') {
      const hb = { x: this.x - 3, y: this.y - 3, w: this.w + 6, h: this.h + 6 };
      for (const e of sc.enemies) if (!e.dead && e.active && !this.dashHits.has(e) && overlap(hb, e)) { this.dashHits.add(e); e.hurt(2, this, sc, 'dash'); }
      if (sc.boss && !sc.boss.dead && !this.dashHits.has(sc.boss) && sc.boss.hitTest(hb)) { this.dashHits.add(sc.boss); sc.boss.hurt(2, sc); }
      damageTilesInRect(hb.x + this.dashDir.x * 4, hb.y + this.dashDir.y * 4, hb.w, hb.h, 3, sc);
      if (this.t % 2 === 0) sc.part(this.cx, this.cy, -this.dashDir.x, -this.dashDir.y, '#f5913f', 16, 2, 0);
    }
    const canGround = this.grounded || this.coyote > 0;
    if (this.jumpBuf > 0 && canGround) {
      const dxs = this.dashDir.x;
      this.dashT = 0; this.doJump(sc, 'ground');
      if (dxs !== 0) { this.vx = sign(dxs) * 4.0; this.vy = this.jumpV() * 0.92; sc.part(this.cx, this.y + this.h, 0, 0, '#ffffff', 10, 2, 0); }
      return;
    }
    if (this.jumpBuf > 0 && this.wallDir && !this.grounded) { this.dashT = 0; this.doJump(sc, 'wall'); return; }
    if (this.dashT <= 0) {
      this.vx = this.dashDir.x * PH.run * 1.15;
      this.vy = this.dashDir.y < 0 ? this.dashDir.y * 2.8 : this.dashDir.y * 2;
    }
  }

  // ---------------- Espada / cajado ----------------
  swordBox() {
    const big = Save.hasGift('sabedoria'), caj = this.ch.melee === 'cajado';
    const reach = (caj ? 22 : 19) + (big ? 6 : 0), thick = (caj ? 22 : 17) + (big ? 5 : 0);
    if (this.swordDir === 'u') return { x: this.x + 4 - thick / 2, y: this.y - reach + 3, w: thick, h: reach };
    if (this.swordDir === 'd') return { x: this.x + 4 - thick / 2, y: this.y + this.h - 3, w: thick, h: reach };
    return { x: this.facing > 0 ? this.x + this.w - 3 : this.x - reach + 3, y: this.y + 6 - thick / 2, w: reach, h: thick };
  }
  pogo() { this.vy = -5.2; this.dashes = this.maxDashes; this.airJumps = this.maxAirJumps; this.jumpCut = false; this.dashT = 0; }
  updateSword(sc, mx, my) {
    if (Input.pressed(this.dev, 'sword') && this.swordCd <= 0) {
      this.swordT = 12; this.swordCd = this.ch.melee === 'cajado' ? 20 : 17; this.swordHits.clear(); this.swordTile = false; this.pogoDone = false;
      this.swordDir = my < 0 ? 'u' : (my > 0 && !this.grounded) ? 'd' : 'f';
      Snd.play('sword');
    }
    if (this.swordT <= 0) return;
    this.swordT--;
    const age = 12 - this.swordT;
    if (age < 2 || age > 8) return;
    const hb = this.swordBox();
    const dmg = 2 + (Save.hasGift('sabedoria') ? 1 : 0);
    let pogo = false;
    for (const e of sc.enemies) {
      if (e.dead || !e.active || this.swordHits.has(e) || !overlap(hb, e)) continue;
      this.swordHits.add(e);
      const r = e.hurt(dmg, this, sc, 'melee');
      if (r !== 'immune') { e.knock(this.swordDir === 'f' ? this.facing * 2.2 : 0, this.swordDir === 'u' ? -2.5 : this.swordDir === 'd' ? 2 : -1); sc.freeze(2); }
      pogo = true;
    }
    if (sc.boss && !sc.boss.dead && !this.swordHits.has(sc.boss) && sc.boss.hitTest(hb)) { this.swordHits.add(sc.boss); sc.boss.hurt(dmg, sc); sc.freeze(2); pogo = true; }
    for (const o of sc.objs) if (!o.dead && o.hittable && !this.swordHits.has(o) && overlap(hb, o)) { this.swordHits.add(o); o.hit(sc, this); }
    const reflect = this.fruit() === 'mansidao';
    for (const p of sc.projs) {
      if (p.owner !== 'e' || p.dead || !overlap(hb, p)) continue;
      if (reflect && p.kind !== 'wave' && p.kind !== 'word') {
        p.owner = 'p'; p.player = this; p.dmg = 2; p.hitSet = new Set(); p.ghost = true; p.grav = 0;
        const a = this.swordDir === 'u' ? -Math.PI / 2 : this.swordDir === 'd' ? Math.PI / 2 : (this.facing > 0 ? 0 : Math.PI);
        const s = Math.max(3.5, Math.hypot(p.vx, p.vy) * 1.4); p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s; p.life = p.t + 90; p.fruitColor = '#5fdcbc';
        Snd.play('tink'); sc.part(p.cx, p.cy, 0, 0, '#5fdcbc', 12, 3, 0);
      } else if (!p.hard) {
        p.dead = true; for (let i = 0; i < 4; i++) sc.part(p.cx, p.cy, rand(-1.5, 1.5), rand(-1.5, 1.5), '#ffffff', 12, 1, 0);
        Snd.play('tink');
      }
    }
    if (!this.swordTile && damageTilesInRect(hb.x, hb.y, hb.w, hb.h, 1, sc)) { this.swordTile = true; pogo = true; }
    if (this.swordDir === 'd' && !this.grounded && !this.pogoDone && (pogo || rectHasTile(hb.x, hb.y, hb.w, hb.h, T_SPIKE))) { this.pogo(); this.pogoDone = true; }
  }

  // ---------------- Arma de longo alcance ----------------
  updateShoot(sc, mx, my) {
    if (!Input.held(this.dev, 'shoot') || this.shootCd > 0) return;
    let ax = mx, ay = my;
    if (ay > 0 && this.grounded) ay = 0;
    if (!ax && !ay) ax = this.facing;
    this.fire(sc, Math.atan2(ay, ax));
  }
  fire(sc, a) {
    const wp = RANGED[this.ch.ranged], fr = this.fruit();
    let kind = wp.kind, speed = wp.speed, grav = wp.grav, dmg = wp.dmg, pierce = wp.pierce || 0, bounce = wp.bounce || 0, life = wp.life || 100;
    if (fr === 'bondade') { kind = 'light'; speed = 9; grav = 0; pierce = 99; life = 55; dmg = Math.max(1, dmg); }
    if (fr === 'longanimidade') { kind = 'seed'; speed = Math.min(speed, 6); grav = 0.06; dmg = 1; pierce = 0; bounce = 0; life = 170; }
    const angles = fr === 'amor' ? [-0.3, -0.15, 0, 0.15, 0.3] : [0];
    const cx = this.x + 4, cy = this.y + 5;
    for (const da of angles) {
      const aa = a + da;
      sc.projs.push(new Proj({
        owner: 'p', player: this, kind, x: cx - 2 + Math.cos(aa) * 4, y: mod(cy - 2 + Math.sin(aa) * 4, WORLD_H), w: 4, h: 4,
        vx: Math.cos(aa) * speed, vy: Math.sin(aa) * speed, grav, dmg, pierce, bounce, life, homing: fr === 'fidelidade',
        fruitColor: fr && fr !== 'bondade' ? FRUITS[fr].color : null, color: this.ch.color,
      }));
    }
    let cd = wp.cd;
    if (fr === 'alegria') cd *= 0.4; if (fr === 'amor') cd *= 1.3; if (fr === 'bondade') cd *= 1.15; if (fr === 'longanimidade') cd *= 1.25;
    this.shootCd = Math.max(4, Math.round(cd)); this.shootAnim = 12; this.aimA = a;
    if (Math.abs(Math.cos(a)) > 0.3) this.facing = sign(Math.cos(a));
    Snd.play(fr === 'bondade' ? 'light' : wp.sfx, 0.05);
  }

  // ---------------- Itens, dano, queda ----------------
  collect(pk, sc) {
    if (pk.kind === 'fruit') {
      const f = pk.fruit;
      if (f === 'paz') this.shield = true;
      else if (this.slots.includes(f)) this.active = this.slots.indexOf(f);
      else if (!this.slots[this.active]) this.slots[this.active] = f;
      else if (!this.slots[1 - this.active]) this.slots[1 - this.active] = f;
      else this.slots[this.active] = f;
      Snd.play('fruit'); this.fruitFlash = 60;
      sc.ftext(FRUITS[f].name.toUpperCase() + ' · ' + FRUITS[f].effect, this.cx, this.y - 10, FRUITS[f].color);
      sc.onFruit(f);
      return true;
    }
    if (pk.kind === 'heart') {
      if (this.hp >= this.maxHp) return false;
      this.hp++; Snd.play('heart'); sc.ftext('+1', this.cx, this.y - 8, '#ff7a8a'); return true;
    }
    if (pk.kind === 'shofar') {
      if (this.louvor >= this.maxLouvor) return false;
      this.louvor++; Snd.play('pickup'); sc.ftext('+1 LOUVOR', this.cx, this.y - 8, '#f2cf5b'); return true;
    }
    return false;
  }
  hurt(sc, srcX) {
    if (this.state !== 'alive' || this.iframes > 0 || this.dashT > 0 || sc.invulnAll > 0) return false;
    if (this.shield) {
      this.shield = false; this.iframes = 60; Snd.play('shieldbreak'); sc.freeze(3);
      for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; sc.part(this.cx + Math.cos(a) * 9, this.cy + Math.sin(a) * 9, Math.cos(a), Math.sin(a), '#86dcf7', 20, 1, 0); }
      sc.ftext('PAZ', this.cx, this.y - 8, '#86dcf7');
      return true;
    }
    this.hp--;
    const lost = this.slots[this.active];
    if (lost) {
      this.slots[this.active] = null;
      sc.ftext('perdeu ' + FRUITS[lost].name, this.cx, this.y - 12, FRUITS[lost].color);
      for (let i = 0; i < 10; i++) sc.part(this.cx, this.cy, rand(-2, 2), rand(-3, -1), FRUITS[lost].color, 34, 2, 0.12);
      Snd.play('lose');
    }
    this.iframes = sc.diff.iframes;
    const kd = srcX == null ? -this.facing : (sign(this.cx - srcX) || -this.facing);
    this.vx = kd * (this.ch.id === 'guardiao' ? 1.6 : 2.5); this.vy = -3.2; this.dashT = 0; this.swordT = 0;
    Snd.play('hurt'); sc.shake(4, 10); sc.freeze(4);
    for (let i = 0; i < 8; i++) sc.part(this.cx, this.cy, rand(-2, 2), rand(-2, 0.5), '#ff5a72', 22, 1, 0.08);
    if (this.hp <= 0) this.goDown(sc);
    return true;
  }
  goDown(sc) {
    this.state = 'down'; this.hp = 0; this.slots = [null, null]; this.shield = false; this.downT = 0; this.reviveP = 0; this.swordT = 0; this.shootAnim = 0;
    Snd.play('down');
    sc.onPlayerDown(this);
  }
  updateDown(sc) {
    this.downT++;
    const alive = sc.players.filter(p => p.state === 'alive');
    if (!alive.length) return;
    let t = alive[0], bd = 1e9;
    for (const p of alive) { const d = edist(p, this); if (d < bd) { bd = d; t = p; } }
    if (bd > 22) { const a = angTo(this, t); this.x += Math.cos(a) * 0.7; this.y = mod(this.y + Math.sin(a) * 0.7, WORLD_H); }
    this.x = clamp(this.x, sc.cam + 6, sc.cam + W - 14);
    const touching = alive.some(p => overlapR(p.x - 5, p.y - 5, p.w + 10, p.h + 10, this.x, this.y, this.w, this.h));
    if (touching && this.downT > 30) { this.reviveP += Save.hasGift('cura') ? 1 : 1 / 75; if (this.reviveP >= 1) this.revive(sc, t); }
    else this.reviveP = Math.max(0, this.reviveP - 0.008);
  }
  revive(sc, by) {
    this.state = 'alive'; this.hp = Math.min(this.maxHp, sc.diff.revive + (Save.hasGift('cura') ? 1 : 0));
    this.iframes = 100; this.vx = 0; this.vy = -2; this.rx = 0; this.ry = 0;
    this.x = Math.round(this.x); this.y = Math.round(this.y);
    if (solidRect(this.x, this.y, this.w, this.h, null) && by) { this.x = by.x; this.y = by.y; }
    Snd.play('revive');
    sc.ftext('DE PÉ!', this.cx, this.y - 10, '#fff3c2');
    sc.toast('Levai as cargas uns dos outros', 'Gl 6:2');
    for (let i = 0; i < 20; i++) { const a = rand(0, 6.28); sc.part(this.cx, this.cy, Math.cos(a) * 2, Math.sin(a) * 2, '#fff3c2', 30, 1, 0); }
  }
  useLouvor(sc) {
    if (this.louvor <= 0) { Snd.play('back'); return; }
    this.louvor--; sc.louvor(this);
  }

  // ---------------- Desenho ----------------
  draw(sc) {
    if (this.state === 'down') { this.drawOrb(sc); return; }
    const bx = Math.round(this.x + 4), by = Math.round(this.y + this.h);
    for (const a of this.after) { G.globalAlpha = a.l / 14 * 0.45; this.drawBody(Math.round(a.x + 4), Math.round(a.y + this.h), a.f, this.ch.color); }
    G.globalAlpha = 1;
    const glow = sc.glow;
    if (glow > 0) circ(bx, by - 7, 9 + Math.round(glow * 5), `rgba(255,240,200,${0.05 + glow * 0.09})`);
    const flick = this.iframes > 0 && this.iframes % 6 < 3;
    if (flick) G.globalAlpha = 0.35;
    wrapDraw(this.y, this.h, oy => {
      const ol = '#0b0912';
      this.drawBody(bx - 1, by + oy, this.facing, ol); this.drawBody(bx + 1, by + oy, this.facing, ol);
      this.drawBody(bx, by + oy - 1, this.facing, ol); this.drawBody(bx, by + oy + 1, this.facing, ol);
      this.drawBody(bx, by + oy, this.facing, null); this.drawWeapons(bx, by + oy);
    });
    G.globalAlpha = 1;
    if (this.shield) ring(bx, by - 7, 10 + (this.t % 30 < 15 ? 0 : 1), 'rgba(134,220,247,0.85)');
    if (this.fruit() && this.fruitFlash > 0) { const f = this.fruit(); drawIcon(f, bx - 3, by - 26 - (this.fruitFlash > 40 ? 60 - this.fruitFlash : 0) * 0.3, FRUITS[f].color); }
    // indicador do jogador
    if (sc.players.length > 1) { R(bx - 1, by - 21, 3, 1, this.ch.color); R(bx, by - 20, 1, 1, this.ch.color); }
  }
  drawBody(bx, by, f, sil) {
    const pal = this.ch.pal, id = this.ch.id;
    const C = k => sil || pal[k];
    const P = (lx, ly, w, h, col) => { G.fillStyle = col; G.fillRect(f > 0 ? bx + lx : bx - lx - w, by + ly, w, h); };
    const running = this.grounded && Math.abs(this.vx) > 0.4;
    const ph = Math.floor(this.runT / 4) % 4;
    let fl = 0, bl = 0, fly = 0, bly = 0, bob = 0;
    if (running) { fl = [1, 0, -1, 0][ph]; bl = -fl; fly = [0, -1, 0, 0][ph]; bly = [0, 0, 0, -1][ph]; bob = ph % 2 ? -1 : 0; }
    else if (!this.grounded) { fl = 1; bl = -1; if (this.vy < 0) fly = -1; else bly = -1; }
    if (this.sliding) { fl = 0; bl = 0; fly = 0; bly = 0; }
    const hy = bob + (this.landT > 2 ? 1 : 0) - (this.springT > 10 ? 1 : 0);
    const flap = Math.floor(this.t / 6) % 2;
    // capa
    if (id !== 'pastora') {
      const trail = Math.abs(this.vx) > 0.6 || !this.grounded ? 1 + flap : 0;
      P(-4, -9 + hy, 2, 6, C('cape'));
      if (trail) P(-4 - trail, -8 + hy + (this.vy < -1 ? 1 : 0), 2, 4, C('cape'));
    } else {
      P(-4, -13 + hy, 1, 5, C('hood'));
    }
    // perna de trás
    P(-2 + bl, -4 + bly, 2, 2, C('pants')); P(-2 + bl, -2 + bly, 2, 2, C('boots'));
    // tronco
    P(-3, -9 + hy, 6, 5, C('tunic')); P(-3, -9 + hy, 1, 5, C('dark')); P(-3, -5 + hy, 6, 1, C('belt'));
    // perna da frente
    P(0 + fl, -4 + fly, 2, 2, C('pants')); P(0 + fl, -2 + fly, 2, 2, C('boots'));
    // cabeça
    P(-2, -14 + hy, 5, 5, C('skin'));
    if (id === 'peregrino') { P(-3, -15 + hy, 6, 2, C('hood')); P(-3, -13 + hy, 2, 3, C('hood')); P(-4, -14 + hy, 1, 2, C('hood')); P(-1, -9 + hy, 1, 4, C('belt')); }
    else if (id === 'guardiao') {
      P(-3, -15 + hy, 6, 3, C('hood')); P(-3, -12 + hy, 1, 2, C('hood')); P(2, -12 + hy, 1, 2, sil || shade(pal.hood, -0.35));
      P(-1, -18 + hy, 2, 3, C('acc')); P(-2 - flap, -17 + hy, 1, 2, C('tunic')); P(-3, -9 + hy, 2, 2, C('hood'));
    } else if (id === 'pastora') { P(-3, -15 + hy, 6, 2, C('hood')); P(-3, -13 + hy, 2, 4, C('hood')); P(-3, -15 + hy, 6, 1, C('acc')); }
    else if (id === 'vigia') {
      P(-3, -15 + hy, 6, 2, C('hood')); P(-3, -13 + hy, 1, 4, C('hood')); P(-3, -15 + hy, 6, 1, C('acc'));
      if (!sil) { P(-6, -7 + hy, 3, 3, '#ffd86b'); P(-5, -8 + hy, 1, 1, '#8a6a2a'); P(-5, -6 + hy, 1, 1, '#fff6c8'); }
    }
    if (!sil) {
      const blink = this.t % 180 < 6;
      P(1, -12 + hy, 1, blink ? 0 : 1, '#1d1420');
      if (this.swordT <= 0 && this.shootAnim <= 0) P(1, -8 + hy, 1, 3, pal.skin);
    }
  }
  drawWeapons(bx, by) {
    const sx = bx, sy = by - 8;
    if (this.swordT > 0) {
      const prog = (12 - this.swordT) / 12;
      let base = this.swordDir === 'u' ? -Math.PI / 2 : this.swordDir === 'd' ? Math.PI / 2 : (this.facing > 0 ? 0 : Math.PI);
      const sweep = 2.3, dir = this.swordDir === 'f' ? this.facing : (this.swordDir === 'u' ? this.facing : -this.facing);
      const a0 = base - sweep / 2 * dir, cur = a0 + sweep * Math.min(1, prog * 1.7) * dir;
      const big = Save.hasGift('sabedoria'), caj = this.ch.melee === 'cajado';
      const len = (caj ? 16 : 13) + (big ? 5 : 0);
      if (prog < 0.8) {
        for (let i = 0; i < 12; i++) {
          const aa = a0 + (cur - a0) * (i / 11);
          G.globalAlpha = 0.25 + 0.6 * (i / 11);
          R(sx + Math.cos(aa) * (len - 1) - 1, sy + Math.sin(aa) * (len - 1) - 1, 2, 2, i > 8 ? '#ffffff' : (big ? '#ffe08a' : this.ch.color));
        }
        G.globalAlpha = 1;
      }
      const tx = sx + Math.cos(cur) * len, ty = sy + Math.sin(cur) * len;
      if (caj) { line(sx - Math.cos(cur) * 4, sy - Math.sin(cur) * 4, tx, ty, '#8b5a2b', 2); R(tx - 1, ty - 1, 3, 3, '#a8743a'); }
      else { line(sx + Math.cos(cur) * 3, sy + Math.sin(cur) * 3, tx, ty, big ? '#fff3c2' : '#e4e8f0'); R(sx + Math.cos(cur) * 3 - 1, sy + Math.sin(cur) * 3 - 1, 3, 3, '#c9933f'); }
      line(sx, sy, sx + Math.cos(cur) * 3, sy + Math.sin(cur) * 3, this.ch.pal.skin);
    } else if (this.shootAnim > 0) {
      const a = this.aimA, ca = Math.cos(a), sa = Math.sin(a);
      const hx = sx + ca * 4, hy = sy + sa * 4, k = this.ch.ranged;
      if (k === 'arco' || k === 'arcoleve') {
        const col = k === 'arco' ? '#8b5a2b' : '#d9b26a';
        for (let i = -5; i <= 5; i++) { const t = i / 5, off = (1 - t * t) * 3; R(hx - sa * i + ca * off, hy + ca * i + sa * off, 1, 1, col); }
        const pull = this.shootAnim > 7 ? 0 : 2;
        line(hx + sa * 5, hy - ca * 5, hx - ca * pull, hy - sa * pull, '#e8e0d0');
        line(hx - ca * pull, hy - sa * pull, hx - sa * 5, hy + ca * 5, '#e8e0d0');
      } else if (k === 'besta') {
        line(hx - ca * 3, hy - sa * 3, hx + ca * 5, hy + sa * 5, '#6b4426', 2);
        line(hx + ca * 3 - sa * 5, hy + sa * 3 + ca * 5, hx + ca * 3 + sa * 5, hy + sa * 3 - ca * 5, '#9aa0aa');
      } else {
        const sp = this.shootAnim * 0.9;
        line(hx, hy, hx + Math.cos(sp) * 5, hy + Math.sin(sp) * 5, '#c8a878');
        R(hx + Math.cos(sp) * 5 - 1, hy + Math.sin(sp) * 5 - 1, 2, 2, '#9a948a');
      }
      line(sx, sy, hx, hy, this.ch.pal.skin);
    }
  }
  drawOrb(sc) {
    const x = this.x + 4, y = this.y + 6, t = this.downT;
    const p = 1 + Math.sin(t * 0.12) * 0.15;
    wrapDraw(this.y, 12, oy => {
      circ(x, y + oy, 9 * p, rgba(this.ch.color, 0.18));
      circ(x, y + oy, 5, rgba(this.ch.color, 0.55));
      circ(x, y + oy, 3, '#fff6e8');
      if (this.reviveP > 0) {
        const n = Math.floor(this.reviveP * 20);
        for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i / 20 * Math.PI * 2; R(x + Math.cos(a) * 11, y + oy + Math.sin(a) * 11, 2, 2, '#fff3c2'); }
      }
    });
  }
}
