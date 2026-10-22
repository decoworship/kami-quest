// ============================================================
//  Cena de jogo: uma fase da jornada
// ============================================================
class PlayScene {
  constructor(game, pi, party) {
    this.game = game; this.pi = pi; this.ph = PHASES[pi]; this.th = this.ph.theme; this.diff = DIFFS[Save.data.diff];
    LV = buildLevel(pi); renderTiles(LV); buildBackground(this.th);
    this.players = party.map((m, i) => new Player(i, m.ci, Input.devs[m.dev], this));
    this.enemies = []; this.projs = []; this.pickups = []; this.parts = []; this.amb = []; this.objs = []; this.texts = []; this.rings = [];
    this.cam = 0; this.lock = null; this.lockB = null; this.pBounds = { min: 0, max: LV.w }; this.boss = null;
    this.t = 0; this.freezeT = 0; this.shakeT = 0; this.shakeM = 0; this.invulnAll = 0; this.flashT = 0;
    this.stats = { scrolls: [], captives: [], saved: 0, kills: 0, time: 0, boss: false };
    this.banners = []; this.toasts = []; this.modal = null; this.paused = false; this.pauseSel = 0; this.pauseView = null;
    this.respawnT = 0; this.done = false; this.endT = 0; this.dawn = 0; this.dawnTarget = 0; this.jarT = 900 + randi(0, 600);
    this.glow = clamp(game.semelhanca() / 100, 0, 1);
    const ps = Save.data.phases[pi];
    let start = { x: 48, feet: 304 };
    let tutorial = pi === 0;
    for (const sp of LV.spawns) {
      const x = sp.c * TS, y = sp.r * TS;
      switch (sp.ch) {
        case 'S': start = { x: x + 4, feet: y + TS }; break;
        case 'E': this.objs.push(new Ebenezer(x + 1, y, sp.id)); break;
        case 'C': this.objs.push(new Captive(sp, this.ph.captive, this.ph.lines, ps.captives.includes(sp.id))); break;
        case 'P': this.objs.push(new ScrollPick(sp, ps.scrolls.includes(sp.k))); break;
        case 'J': this.objs.push(new Jar(x + 2, y + 2)); break;
        case 'H': this.pickups.push(new Pickup('heart', x + 8, y + 8, { float: true })); break;
        case 'T': this.pickups.push(new Pickup('shofar', x + 8, y + 8, { float: true })); break;
        case 'B': this.objs.push(new Spring(x + 1, y + 10)); break;
        default: {
          const type = this.ph.enemies[+sp.ch - 1];
          if (type) this.enemies.push(new Enemy(type, x + 8, y + 16, this));
        }
      }
    }
    if (tutorial) for (const s of TUTORIAL_SIGNS) this.objs.push(new Sign(s.col * TS + 2, 18 * TS + 2, s.text));
    this.checkpoint = { x: start.x, feet: start.feet };
    this.players.forEach((p, i) => { p.x = start.x + i * 10; p.y = start.feet - p.h; p.facing = 1; });
    this.banner(`${pi + 1}. ${this.ph.name}`, this.ph.sins, `"${this.ph.intro.text}" — ${this.ph.intro.ref}`, 300);
    Music.play(this.ph.music);
  }

  // ---------------- utilidades usadas pelas entidades ----------------
  part(x, y, vx, vy, c, l, s = 1, g = 0, a = 1) { if (this.parts.length < 900) this.parts.push({ x, y, vx, vy, c, l, m: l, s, g, a, fr: 1 }); }
  shake(m, d) { if (REDUCED_MOTION) m = Math.min(1, m * 0.3); this.shakeM = Math.max(this.shakeM, m); this.shakeT = Math.max(this.shakeT, d); }
  freeze(n) { this.freezeT = Math.max(this.freezeT, n); }
  ftext(text, x, y, color = '#fff', life = 60, size = 7) { this.texts.push({ text, x, y, color, life, max: life, size }); }
  toast(text, sub, dur = 220) { this.toasts.push({ text, sub, t: 0, dur }); if (this.toasts.length > 2) this.toasts.shift(); }
  banner(title, sub, ref, dur = 180, big = true) { this.banners.push({ title, sub, ref, t: 0, dur, big }); }
  flashRing(x, y, r, col) { this.rings.push({ x, y, r: 0, max: r, col, t: 0 }); }
  nearestPlayer(e) { return nearestPlayer(this, e); }
  nearestTarget(x, y, range) {
    let best = null, bd = range;
    for (const e of this.enemies) if (!e.dead && e.active && e.spawnT <= 0) { const d = Math.hypot(ecx(e) - x, wrapDY(ecy(e) - y)); if (d < bd) { bd = d; best = e; } }
    if (this.boss && !this.boss.dead && !this.boss.dying && this.boss.state !== 'intro') {
      const b = this.boss.hurtBox(); const bx = b[0] + b[2] / 2, by = b[1] + b[3] / 2;
      const d = Math.hypot(bx - x, wrapDY(by - y)); if (d < bd + 60) best = { cx: bx, cy: by, dead: false };
    }
    return best;
  }
  spawnWaveEnemy(type, x, y) {
    const e = new Enemy(type, x, y + ETYPES[type].h * SPRITE_SCALE / 2, this, { wave: true, spawnT: 40, bnd: this.lockB });
    this.enemies.push(e); return e;
  }

  // ---------------- eventos ----------------
  onEnemyDie(e) {
    this.stats.kills++;
    const d = this.diff.drop, r = Math.random();
    if (r < 0.07 * d) this.pickups.push(new Pickup('heart', ecx(e), ecy(e), { vy: -2.2, life: 720 }));
    else if (r < 0.105 * d) this.pickups.push(new Pickup('fruit', ecx(e), ecy(e), { fruit: randomFruit(), vy: -2.2, life: 720 }));
    else if (r < 0.12 * d) this.pickups.push(new Pickup('shofar', ecx(e), ecy(e), { vy: -2.2, life: 720 }));
  }
  onScroll(s) {
    if (!this.stats.scrolls.includes(s.k)) this.stats.scrolls.push(s.k);
    const sc = this.ph.scrolls[s.k];
    this.modal = { type: 'scroll', text: sc.text, ref: sc.ref, known: s.known, t: 0, n: this.stats.scrolls.length };
    Snd.play('scroll');
  }
  onCaptive(c) {
    if (!this.stats.captives.includes(c.id)) this.stats.captives.push(c.id);
    this.stats.saved++;
    this.ftext(c.line, c.x + c.w / 2, c.y - 10, '#fff3c2', 170, 7);
    Snd.play('captive');
  }
  onFruit(f) {
    if (!Save.data.fruitsSeen.includes(f)) {
      Save.data.fruitsSeen.push(f); Save.write();
      this.toast(`${FRUITS[f].name}: ${FRUITS[f].desc}`, FRUITS[f].ref, 300);
    }
  }
  onCheckpoint(eb) {
    this.checkpoint = { x: eb.x, feet: eb.y + eb.h };
    Snd.play('checkpoint');
    for (const p of this.players) {
      if (p.state === 'down') { p.state = 'alive'; p.hp = Math.min(p.maxHp, this.diff.revive); p.x = eb.x; p.y = eb.y + eb.h - p.h; p.iframes = 90; p.rx = 0; p.ry = 0; }
      else if (p.hp < p.maxHp) p.hp++;
      p.louvor = Math.max(p.louvor, this.diff.louvor);
    }
    this.toast(t('ebenezer'), t('ebenezerRef'), 200);
    for (let i = 0; i < 20; i++) this.part(eb.x + 7, eb.y + 4, rand(-1.5, 1.5), rand(-3, -0.5), '#ffd86b', 40, 1, 0.05);
  }
  onPlayerDown(p) {
    this.shake(5, 14);
    if (this.players.some(o => o.state === 'alive')) this.toast(t('fell', p.ch.name), t('gal62full'), 200);
  }
  onBossDying(b) {
    for (const pr of this.projs) if (pr.owner === 'e') pr.dead = true;
    for (const e of this.enemies) if (!e.dead && e.x > b.room.x0 - 16 && e.x < b.room.x1 + 16) e.die(this, null);
    this.invulnAll = 400; Music.stop(); this.shake(6, 40);
    if (this.pi === 4) this.banner(t('finished'), t('finishedRef'), t('col214'), 360);
  }
  onBossDead(b) {
    this.stats.boss = true;
    const rx = b.room.x0;
    for (let i = 0; i < 5; i++) {
      const c = new Captive({ id: 'final' + i, c: Math.floor((b.cx - 40 + i * 20) / TS), r: 17 }, this.ph.captive, this.ph.lines, false);
      c.x = Math.round(clamp(b.cx - 40 + i * 20, rx + 40, rx + W - 60)); c.y = FLOOR_Y - c.h; c.freed = true; c.hittable = false; c.baseY = c.y; c.ft = -i * 10;
      this.objs.push(c);
    }
    this.stats.saved += 5;
    Music.play('victory');
    Snd.play('captive');
    if (this.pi < 4) this.banner(t('victory'), t('victory' + this.pi), `"${this.ph.bossCard.text}" — ${this.ph.bossCard.ref}`, 260);
    else { this.dawnTarget = 1; this.banner(t('accuserOut'), t('noCondemn'), t('rom81'), 300); }
    this.exitT = 150;
  }
  louvor(p) {
    this.flashT = 14; p.iframes = Math.max(p.iframes, 70);
    this.rings.push({ x: p.cx, y: p.cy, r: 0, max: 420, col: '#fff3c2', t: 0 });
    for (const e of this.enemies) if (!e.dead && e.x > this.cam - 30 && e.x < this.cam + W + 30) { e.active = true; e.hurt(6, p, this, 'louvor'); }
    if (this.boss && !this.boss.dead && !this.boss.dying && this.boss.state !== 'intro') this.boss.hurt(10, this);
    for (const pr of this.projs) if (pr.owner === 'e') pr.dead = true;
    const c0 = Math.floor(this.cam / TS), c1 = Math.floor((this.cam + W) / TS);
    for (let r = 0; r < ROWS; r++) for (let c = c0; c <= c1; c++) if (tileAt(c, r) === T_BREAK) damageTile(c, r, 99, this);
    Snd.play('louvor'); this.shake(6, 22);
    this.ftext(t('praise'), p.cx, p.y - 16, '#fff3c2', 70, 10);
    for (let i = 0; i < 30; i++) { const a = rand(0, 6.28); this.part(p.cx, p.cy, Math.cos(a) * rand(1, 4), Math.sin(a) * rand(1, 4), pick(['#fff3c2', '#f2cf5b', '#ffffff']), 50, 2, 0); }
  }
  completePhase() {
    if (this.done) return;
    this.done = true; this.endT = 0; Snd.play('portal');
  }

  // ---------------- atualização ----------------
  update() {
    if (this.modal) {
      this.modal.t++;
      if (this.modal.t > 45 && (Input.anyPressed('ok') || Input.anyPressed('jump') || Input.anyPressed('sword') || Input.anyPressed('shoot'))) { this.modal = null; Snd.play('ok'); }
      return;
    }
    if (Input.anyPressed('start')) { this.paused = !this.paused; this.pauseSel = 0; this.pauseView = null; Snd.play('menu'); return; }
    if (this.paused) { this.updatePause(); return; }
    if (this.done) { this.endT++; if (this.endT > 70) this.game.toSummary(this); return; }
    this.t++; this.stats.time++;
    if (this.invulnAll > 0) this.invulnAll--;
    if (this.flashT > 0) this.flashT--;
    for (const b of this.banners) b.t++; this.banners = this.banners.filter(b => b.t < b.dur);
    for (const t of this.toasts) t.t++; this.toasts = this.toasts.filter(t => t.t < t.dur);
    if (this.freezeT > 0) { this.freezeT--; return; }
    if (this.shakeT > 0) this.shakeT--; else this.shakeM = 0;
    this.dawn = approach(this.dawn, this.dawnTarget, 0.004);

    this.updateCamera();
    for (const p of this.players) {
      p.bnd = this.pBounds;
      if (p.state === 'alive' && (p.x < this.pBounds.min || p.x + p.w > this.pBounds.max)) {
        const nx = clamp(p.x, this.pBounds.min, this.pBounds.max - p.w);
        if (!solidRect(nx, p.y, p.w, p.h, null)) p.x = nx;
      }
      p.update(this);
    }
    this.updateRooms();
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (!e.active && e.x > this.cam - 30 && e.x < this.cam + W + 30) e.active = true;
      if (e.active && e.x > this.cam - 220 && e.x < this.cam + W + 220) e.update(this);
    }
    this.enemies = this.enemies.filter(e => !e.dead);
    if (this.boss) { this.boss.update(this); if (this.boss.dead) this.boss = null; }
    for (const p of this.projs) updateProj(p, this);
    this.projs = this.projs.filter(p => !p.dead);
    for (const p of this.pickups) p.update(this);
    this.pickups = this.pickups.filter(p => !p.dead);
    for (const o of this.objs) if (o.x > this.cam - 120 && o.x < this.cam + W + 120) o.update(this);
    this.objs = this.objs.filter(o => !o.dead);
    updateParts(this.parts);
    ambientParticles(this); updateParts(this.amb);
    for (const t of this.texts) { t.life--; t.y -= 0.25; } this.texts = this.texts.filter(t => t.life > 0);
    for (const r of this.rings) { r.t++; r.r += (r.max - r.r) * 0.12 + 2; } this.rings = this.rings.filter(r => r.r < r.max - 2 && r.t < 60);

    if (this.exitT > 0 && --this.exitT === 0) {
      const room = LV.rooms[LV.rooms.length - 1];
      this.objs.push(new ExitPortal(room.x0 + 35 * TS, FLOOR_Y - 40));
      this.toast(t('doorOpen'), t('doorVerse'), 260);
      Snd.play('portal');
    }
    // vasos voadores (como as cápsulas de Contra)
    if (!this.lock && --this.jarT <= 0) {
      this.jarT = randi(1500, 2400);
      const dir = chance(0.5) ? 1 : -1;
      this.objs.push(new Jar(dir > 0 ? this.cam - 30 : this.cam + W + 20, randi(50, 150), { flying: true, vx: dir * 1.1 }));
    }
    // todos caídos
    if (this.respawnT === 0 && this.players.every(p => p.state === 'down')) {
      this.respawnT = 170;
      this.banner(t('riseUp'), t('riseSub'), t('mic78'), 170);
    }
    if (this.respawnT > 0 && --this.respawnT === 0) this.respawn();
  }
  updateCamera() {
    const alive = this.players.filter(p => p.state === 'alive');
    const maxCam = LV.w - W, M = 8;
    if (this.lock) {
      this.cam = lerp(this.cam, this.lock.x0, 0.14); if (Math.abs(this.cam - this.lock.x0) < 0.6) this.cam = this.lock.x0;
      this.pBounds = { min: this.lock.x0 + 16, max: this.lock.x1 - 16 };
      return;
    }
    if (!alive.length) return;
    let mn = Infinity, mx = -Infinity;
    for (const p of alive) { mn = Math.min(mn, p.x); mx = Math.max(mx, p.x + p.w); }
    const target = clamp((mn + mx) / 2 - W / 2, 0, maxCam);
    this.cam = lerp(this.cam, target, 0.12);
    const lo = mx + M - W, hi = mn - M;
    if (lo <= hi) this.cam = clamp(this.cam, lo, hi); else this.cam = (lo + hi) / 2;
    this.cam = clamp(this.cam, 0, maxCam);
    this.pBounds = { min: Math.max(0, this.cam + M), max: Math.min(LV.w, this.cam + W - M) };
  }
  updateRooms() {
    const alive = this.players.filter(p => p.state === 'alive');
    for (const room of LV.rooms) {
      if ((room.type === 'arena' || room.type === 'boss') && room.state === 'idle' && !this.lock) {
        const trig = alive.find(p => p.x > room.x0 + 5 * TS && p.x < room.x1 - 24);
        if (trig) this.activateRoom(room, trig);
      }
      if (room.state === 'active' && room.type === 'arena') this.updateArena(room);
    }
  }
  activateRoom(room, trig) {
    room.state = 'active';
    this.lock = { x0: room.x0, x1: room.x1, room };
    this.lockB = { min: room.x0 + 16, max: room.x1 - 16 };
    for (const p of this.players) {
      if (p.x < room.x0 + 16 || p.x > room.x1 - 24) {
        p.x = clamp(trig.x - 10, room.x0 + 20, room.x1 - 30); p.y = trig.y; p.rx = 0; p.ry = 0;
        if (p.state === 'alive' && solidRect(p.x, p.y, p.w, p.h, null)) { p.x = trig.x; }
      }
    }
    for (const e of this.enemies) if (e.x >= room.x0 && e.x <= room.x1) e.bnd = this.lockB;
    Snd.play('warn');
    if (room.type === 'arena') {
      room.wave = 0; room.waveT = 60; room.spawnQ = null; room.pi = 0;
      this.banner(t('trial'), t('trialSub'), t('jas112'), 150, false);
    } else {
      const Cls = BOSS_CLASSES[this.ph.boss];
      this.boss = new Cls(this, room);
      const bc = this.ph.bossCard;
      this.bossCard = { t: 0, dur: 170 };
      Music.play(this.pi === 4 ? 'boss5' : 'boss');
      Snd.play('roar'); this.shake(4, 30);
    }
  }
  updateArena(room) {
    const aliveE = this.enemies.filter(e => !e.dead && e.wave).length;
    if (room.spawnQ && room.spawnQ.length) {
      if (--room.spawnT <= 0) {
        const slot = room.spawnQ.shift();
        const portal = room.portals[room.pi % room.portals.length]; room.pi++;
        const type = this.ph.enemies[slot - 1];
        this.enemies.push(new Enemy(type, portal.x, portal.y + ETYPES[type].h * SPRITE_SCALE / 2, this, { wave: true, spawnT: 40, bnd: this.lockB }));
        room.spawnT = 26;
      }
      return;
    }
    if (aliveE > 0) return;
    if (room.waveT > 0) { room.waveT--; return; }
    if (room.wave >= room.waves.length) {
      room.state = 'done'; this.lock = null; this.lockB = null;
      for (const e of this.enemies) e.bnd = null;
      this.banner(t('victorySmall'), t('pathGoesOn'), null, 120, false);
      Snd.play('checkpoint');
      const cx = room.x0 + W / 2;
      this.objs.push(new Jar(cx - 6, 140));
      this.pickups.push(new Pickup('heart', cx + 30, 140, { float: true }));
      return;
    }
    const base = room.waves[room.wave];
    const n = Math.max(2, Math.round(base.length * this.diff.count * (1 + 0.35 * (this.players.length - 1))));
    room.spawnQ = []; for (let i = 0; i < n; i++) room.spawnQ.push(base[i % base.length]);
    room.wave++; room.waveT = 80; room.spawnT = 10;
    this.ftext(t('wave', room.wave, room.waves.length), room.x0 + W / 2, 60, '#ffd8a8', 90, 9);
  }
  respawn() {
    if (this.lock) {
      const room = this.lock.room;
      room.state = 'idle'; room.spawnQ = null; room.wave = 0;
      this.lock = null; this.lockB = null;
      this.enemies = this.enemies.filter(e => !e.wave);
      this.boss = null; this.bossCard = null;
      Music.play(this.ph.music);
    }
    this.projs = [];
    const cp = this.checkpoint;
    this.players.forEach((p, i) => {
      p.state = 'alive'; p.hp = p.maxHp; p.x = cp.x + i * 6; p.y = cp.feet - p.h; p.vx = 0; p.vy = 0; p.rx = 0; p.ry = 0; p.iframes = 120;
      p.louvor = Math.max(p.louvor, this.diff.louvor); p.dashT = 0;
      if (solidRect(p.x, p.y, p.w, p.h, null)) p.x = cp.x;
    });
    this.cam = clamp(cp.x - W / 2, 0, LV.w - W);
  }
  updatePause() {
    const nv = Input.nav();
    if (this.pauseView) { if (nv.ok || nv.cancel) { this.pauseView = null; Snd.play('back'); } return; }
    const items = this.pauseItems();
    if (nv.up) { this.pauseSel = mod(this.pauseSel - 1, items.length); Snd.play('menu'); }
    if (nv.down) { this.pauseSel = mod(this.pauseSel + 1, items.length); Snd.play('menu'); }
    if (nv.cancel) { this.paused = false; return; }
    if (nv.ok) {
      const it = items[this.pauseSel]; Snd.play('ok');
      if (it.id === 'cont') this.paused = false;
      else if (it.id === 'ctrl') this.pauseView = 'ctrl';
      else if (it.id === 'mus') Music.toggle();
      else if (it.id === 'lang') { this.game.setLang(LANG === 'pt' ? 'en' : 'pt'); }
      else if (it.id === 'map') { this.paused = false; this.game.toMap(); }
    }
  }
  pauseItems() {
    return [{ id: 'cont', label: t('resume') }, { id: 'ctrl', label: t('controls') }, { id: 'mus', label: t('music', Music.on ? t('on') : t('off')) }, { id: 'lang', label: t('language') }, { id: 'map', label: t('toMap') }];
  }

  // ---------------- desenho ----------------
  revealAt(x, y) {
    if (Save.hasGift('discernimento')) return true;
    for (const p of this.players) if (p.state === 'alive' && p.ch.id === 'vigia' && Math.hypot(p.cx - x, wrapDY(p.cy - y)) < 100) return true;
    return false;
  }
  drawDynamicTiles() {
    const c0 = Math.max(0, Math.floor(this.cam / TS) - 1), c1 = Math.min(LV.cols - 1, Math.floor((this.cam + W) / TS) + 1);
    for (let r = 0; r < ROWS; r++) for (let c = c0; c <= c1; c++) {
      const t = LV.grid[r * LV.cols + c];
      if (t !== T_BREAK && t !== T_FAKE) continue;
      const x = c * TS, y = r * TS, rev = this.revealAt(x + 8, y + 8);
      if (t === T_BREAK) {
        drawSolidTile(G, LV, c, r);
        const hp = LV.bhp.get(r * LV.cols + c) || 3;
        const cr = shade(LV.ph.theme.tileDark, -0.4);
        R(x + 4, y + 3, 1, 5, cr); R(x + 5, y + 7, 3, 1, cr); R(x + 8, y + 8, 1, 4, cr); R(x + 10, y + 4, 3, 1, cr);
        if (hp < 3) { R(x + 2, y + 10, 4, 1, cr); R(x + 11, y + 9, 1, 4, cr); }
        if (hp < 2) { R(x + 6, y + 1, 1, 3, cr); R(x + 12, y + 12, 3, 1, cr); }
        if (rev) { G.globalAlpha = 0.4 + 0.3 * Math.sin(this.t * 0.1); G.strokeStyle = '#ffe08a'; G.lineWidth = 1; G.strokeRect(x + 0.5, y + 0.5, 15, 15); G.globalAlpha = 1; }
      } else {
        let near = false;
        for (const p of this.players) if (p.state === 'alive' && overlapR(p.x - 6, p.y - 6, p.w + 12, p.h + 12, x, y, 16, 16)) near = true;
        drawSolidTile(G, LV, c, r, near ? 0.3 : 1);
        if (rev) { G.globalAlpha = 0.35 + 0.3 * Math.sin(this.t * 0.12 + c); G.fillStyle = '#c9a2ff'; G.fillRect(x, y + (this.t >> 2) % 16, 16, 1); G.strokeStyle = '#c9a2ff'; G.strokeRect(x + 0.5, y + 0.5, 15, 15); G.globalAlpha = 1; }
      }
    }
  }
  lights() {
    const L = [], disc = Save.hasGift('discernimento') ? 36 : 0;
    for (const p of this.players) {
      if (p.state === 'alive') L.push({ x: p.cx, y: p.cy, r: (p.ch.id === 'vigia' ? 124 : 76) + disc });
      else L.push({ x: p.cx, y: p.cy, r: 34 });
    }
    for (const p of this.projs) L.push({ x: p.cx, y: p.cy, r: p.owner === 'p' ? 22 : 16 });
    for (const e of this.enemies) if (e.light) L.push({ x: e.cx + e.facing * 11 * e.S, y: e.y - 4 * e.S, r: e.light });
    for (const o of this.objs) if (o.light) L.push({ x: o.x + o.w / 2, y: o.y + o.h / 2, r: o.light });
    for (const p of this.pickups) L.push({ x: p.x + 5, y: p.y + 5, r: 20 });
    if (this.boss && this.boss.light) L.push({ x: this.boss.cx, y: this.boss.cy, r: this.boss.light });
    for (const r of this.rings) L.push({ x: r.x, y: r.y, r: r.r + 30 });
    return L;
  }
  draw() {
    resetG();
    const bossRoom = LV.rooms[LV.rooms.length - 1];
    const crossX = this.pi === 4 ? (bossRoom.x0 + 470 - this.cam) * 0.35 + 300 : null;
    drawBackground(this.th, this.cam, this.t, { dawn: this.dawn, cross: crossX });
    const sx = this.shakeT > 0 ? Math.round(rand(-this.shakeM, this.shakeM)) : 0, sy = this.shakeT > 0 ? Math.round(rand(-this.shakeM, this.shakeM)) : 0;
    this.sx = sx; this.sy = sy;
    G.save();
    G.beginPath(); G.rect(0, OY, W, WORLD_H); G.clip();
    G.translate(-Math.round(this.cam) + sx, OY + sy);
    drawParts(this.amb);
    const cx0 = Math.floor(this.cam);
    G.drawImage(LV.canvas, cx0, 0, Math.min(W + 2, LV.w - cx0), WORLD_H, cx0, 0, Math.min(W + 2, LV.w - cx0), WORLD_H);
    this.drawDynamicTiles();
    if (this.lock) {
      for (const gx of [this.lock.x0, this.lock.x1 - 16]) {
        for (let y = 16; y < 19 * TS; y += 4) { G.globalAlpha = 0.55 + 0.25 * Math.sin(this.t * 0.2 + y * 0.1); R(gx + 6, y, 4, 3, this.boss ? '#ff4a6a' : '#ffd36b'); }
        G.globalAlpha = 0.15; R(gx, 16, 16, 19 * TS - 16, this.boss ? '#ff4a6a' : '#ffd36b'); G.globalAlpha = 1;
      }
    }
    for (const o of this.objs) if (o.x > this.cam - 60 && o.x < this.cam + W + 60) o.draw(this);
    for (const p of this.pickups) p.draw(this);
    for (const e of this.enemies) if (e.x > this.cam - 60 && e.x < this.cam + W + 60) e.draw(this);
    if (this.boss) this.boss.draw(this);
    for (const p of this.players) p.draw(this);
    for (const p of this.projs) drawProj(p, this);
    drawParts(this.parts);
    for (const r of this.rings) { G.globalAlpha = Math.max(0, 1 - r.t / 60); ring(r.x, r.y, r.r, r.col, 2); G.globalAlpha = 1; }
    G.restore();
    if (this.ph.dark) { drawDarkness(this, this.lights(), this.stats.boss ? 0.6 : 0.93); this.drawEmissive(sx, sy); }
    if (this.ph.fog) drawFog(this);
    if (this.flashT > 0) { G.globalAlpha = this.flashT / 14 * 0.7; R(0, 0, W, H, '#fff8e0'); G.globalAlpha = 1; }
    drawHUD(this);
    if (this.done) { G.globalAlpha = Math.min(1, this.endT / 60); R(0, 0, W, H, '#fff8ec'); G.globalAlpha = 1; }
    if (this.respawnT > 0 && this.respawnT < 50) { G.globalAlpha = 1 - this.respawnT / 50; R(0, 0, W, H, '#05040a'); G.globalAlpha = 1; }
  }
  drawEmissive(sx, sy) {
    // bordas bioluminescentes: as plataformas continuam legíveis no escuro
    G.save(); G.translate(-Math.round(this.cam) + sx, OY + sy);
    const th = this.th, c0 = Math.max(0, Math.floor(this.cam / TS)), c1 = Math.min(LV.cols - 1, Math.floor((this.cam + W) / TS) + 1);
    const pulse = 0.45 + 0.12 * Math.sin(this.t * 0.04);
    for (let r = 0; r < ROWS; r++) for (let c = c0; c <= c1; c++) {
      const t = LV.grid[r * LV.cols + c], x = c * TS, y = r * TS;
      if ((t === T_SOLID || t === T_FAKE || t === T_BREAK) && !solidLikeAt(LV, c, r - 1)) { G.globalAlpha = pulse; G.fillStyle = th.top; G.fillRect(x, y, 16, 1); if (hash2(c, r) < 0.35) G.fillRect(x + Math.floor(hash2(r, c) * 14), y + 1, 1, 2); }
      else if (t === T_ONEWAY) { G.globalAlpha = pulse * 0.6; G.fillStyle = th.top; G.fillRect(x, y, 16, 1); }
      else if (t === T_SPIKE) { G.globalAlpha = pulse; G.fillStyle = th.spike; for (let i = 0; i < 4; i++) G.fillRect(x + i * 4 + 1, y + 8, 1, 1); }
    }
    G.globalAlpha = 1; G.restore();
  }
  w2s(x, y) { return [x - this.cam + this.sx, mod(y, WORLD_H) + OY + this.sy]; }
  drawUI() {
    drawHUDText(this);
    for (const p of this.projs) if (p.kind === 'word' && p.text) { const [x, y] = this.w2s(p.x, p.y); txt(p.text, x + p.w / 2, y + 1, { size: 7, align: 'center', color: '#ffb0bc', weight: 700, stroke: '#2a0008' }); }
    for (const o of this.objs) if (o instanceof Sign && o.near > 0 && o.x > this.cam - 20 && o.x < this.cam + W + 20) {
      const [x, y] = this.w2s(o.x + 6, o.y);
      const lines = wrapText(o.text, 190, 7);
      const h = lines.length * 9 + 8, w = 200, px = clamp(x - w / 2, 4, W - w - 4), py = y - h - 8;
      panel(px, py, w, h, { alpha: o.near, fill: 'rgba(30,22,16,0.92)', border: 'rgba(216,178,106,0.8)' });
      lines.forEach((l, i) => txt(l, px + 6, py + 4 + i * 9, { size: 7, alpha: o.near, color: '#f4e8cc' }));
    }
    for (const t of this.texts) {
      const [x, y] = this.w2s(t.x, t.y);
      txt(t.text, x, y, { size: t.size, align: 'center', color: t.color, alpha: Math.min(1, t.life / 20), weight: 700 });
    }
    if (this.bossCard && this.boss && this.boss.state === 'intro') {
      const bc = this.ph.bossCard, a = Math.min(1, this.boss.t / 20, (this.boss.timer) / 20);
      txt(bc.name, W / 2, 70, { size: 30, align: 'center', font: FONT_TITLE, weight: 700, color: '#ffd0d8', alpha: a, glow: '#ff3a5a' });
      txt(bc.title, W / 2, 106, { size: 10, align: 'center', color: '#f4efe4', alpha: a });
      txt(`"${bc.text}" — ${bc.ref}`, W / 2, 122, { size: 8, align: 'center', color: '#c8c0d8', alpha: a });
    }
    let by = 120;
    for (const b of this.banners) {
      const a = Math.min(1, b.t / 20, (b.dur - b.t) / 25);
      if (b.big) {
        txt(b.title, W / 2, by, { size: 24, align: 'center', font: FONT_TITLE, weight: 700, color: '#fff3d6', alpha: a, glow: 'rgba(255,220,150,0.8)' });
        if (b.sub) txt(b.sub, W / 2, by + 32, { size: 10, align: 'center', color: '#e8dcff', alpha: a });
        if (b.ref) { const ls = wrapText(b.ref, 420, 8); ls.forEach((l, i) => txt(l, W / 2, by + 50 + i * 11, { size: 8, align: 'center', color: '#c8c0d8', alpha: a })); }
        by += 90;
      } else {
        txt(b.title, W / 2, 70, { size: 16, align: 'center', font: FONT_TITLE, weight: 700, color: '#ffe0a8', alpha: a });
        if (b.sub) txt(b.sub, W / 2, 92, { size: 8, align: 'center', color: '#e8dcff', alpha: a });
        if (b.ref) txt(b.ref, W / 2, 104, { size: 7, align: 'center', color: '#b8b0c8', alpha: a });
      }
    }
    this.toasts.forEach((t, i) => {
      const a = Math.min(1, t.t / 15, (t.dur - t.t) / 20);
      const y = H - 52 - i * 30;
      const w = Math.min(460, Math.max(txtW(t.text, 8), t.sub ? txtW(t.sub, 7) : 0) + 20);
      panel(W / 2 - w / 2, y, w, t.sub ? 25 : 15, { alpha: a * 0.95 });
      txt(t.text, W / 2, y + 3, { size: 8, align: 'center', alpha: a });
      if (t.sub) txt(t.sub, W / 2, y + 14, { size: 7, align: 'center', color: '#d8c890', alpha: a });
    });
    if (this.modal) this.drawModal();
    if (this.paused) this.drawPause();
  }
  drawModal() {
    const m = this.modal, a = Math.min(1, m.t / 15);
    U.save(); U.globalAlpha = a * 0.6; U.fillStyle = '#05040a'; U.fillRect(0, 0, W, H); U.restore();
    const w = 400, h = 150, x = (W - w) / 2, y = (H - h) / 2;
    panel(x, y, w, h, { alpha: a, fill: 'rgba(38,30,20,0.97)', border: 'rgba(233,208,140,0.9)', r: 4 });
    txt(m.known ? t('scrollKnown') : t('scrollFound'), W / 2, y + 12, { size: 9, align: 'center', color: '#d8b26a', weight: 700, alpha: a });
    const lines = wrapText(`"${m.text}"`, w - 50, 12, FONT_TITLE, 600);
    lines.forEach((l, i) => txt(l, W / 2, y + 34 + i * 17, { size: 12, align: 'center', font: FONT_TITLE, weight: 600, color: '#fff3d6', alpha: a }));
    txt(m.ref, W / 2, y + 40 + lines.length * 17, { size: 10, align: 'center', color: '#e8c070', weight: 700, alpha: a });
    txt(t('scrollsHere', m.n, LV.scrollCount), W / 2, y + h - 30, { size: 7, align: 'center', color: '#b8a888', alpha: a });
    if (m.t > 45) txt(t('pressJumpGo'), W / 2, y + h - 16, { size: 7, align: 'center', color: '#f4efe4', alpha: 0.6 + 0.4 * Math.sin(m.t * 0.1) });
  }
  drawPause() {
    U.save(); U.fillStyle = 'rgba(5,4,10,0.75)'; U.fillRect(0, 0, W, H); U.restore();
    if (this.pauseView === 'ctrl') { drawControlsTable(); return; }
    txt(t('pause'), W / 2, 80, { size: 26, align: 'center', font: FONT_TITLE, weight: 700, color: '#fff3d6' });
    txt(this.ph.name + ' · ' + DIFFS[Save.data.diff].name, W / 2, 114, { size: 8, align: 'center', color: '#c8c0d8' });
    this.pauseItems().forEach((it, i) => {
      const sel = i === this.pauseSel;
      txt((sel ? '› ' : '') + it.label + (sel ? ' ‹' : ''), W / 2, 145 + i * 20, { size: 11, align: 'center', color: sel ? '#ffe08a' : '#d8d0e8', weight: sel ? 700 : 500 });
    });
    txt(t('pauseHint'), W / 2, H - 30, { size: 7, align: 'center', color: '#8a84a0' });
  }
}

function drawControlsTable() {
  const x0 = 40, y0 = 36;
  txt(t('ctrlTitle'), W / 2, 14, { size: 16, align: 'center', font: FONT_TITLE, weight: 700, color: '#fff3d6' });
  const rows = [['move', 'cMove'], ['jump', 'cJump'], ['sword', 'cSword'], ['shoot', 'cShoot'], ['dash', 'cDash'], ['swap', 'cSwap'], ['special', 'cSpecial'], ['start', 'cStart']];
  const cols = [['kb1', 'colKb1'], ['kb2', 'colKb2'], ['pad', 'colPad']];
  const cw = 118;
  cols.forEach(([k, n], i) => txt(t(n), x0 + 170 + i * cw, y0, { size: 8, color: '#e8c070', weight: 700 }));
  rows.forEach(([k, n], j) => {
    const y = y0 + 16 + j * 17;
    if (j % 2 === 0) { U.save(); U.fillStyle = 'rgba(255,255,255,0.04)'; U.fillRect(x0 - 6, y - 3, W - 2 * x0 + 12, 16); U.restore(); }
    txt(t(n), x0, y, { size: 8, color: '#f4efe4' });
    cols.forEach(([c], i) => txt(CONTROL_LABELS[c][k], x0 + 170 + i * cw, y, { size: 8, color: '#c8c0d8' }));
  });
  ['tip1', 'tip2', 'tip3', 'tip4'].forEach((k, i) => txt(t(k), W / 2, y0 + 165 + i * 12, { size: 7, align: 'center', color: '#a8a0bc' }));
  txt(t('backHint'), W / 2, H - 22, { size: 7, align: 'center', color: '#8a84a0' });
}
