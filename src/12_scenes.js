// ============================================================
//  Telas: título, personagens, dificuldade, mapa, resumo, final
// ============================================================

// Fundo noturno com a Cidade Celestial ao longe (título e final)
function drawJourneyBackdrop(t, dawn = 0, walkers = null) {
  const gr = G.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, mixHex('#0b0a1a', '#3a4a8a', dawn)); gr.addColorStop(0.6, mixHex('#1f1a3a', '#f0a070', dawn)); gr.addColorStop(1, mixHex('#2e2546', '#ffe0a0', dawn));
  G.fillStyle = gr; G.fillRect(0, 0, W, H);
  const rnd = mulberry32(77);
  for (let i = 0; i < 120; i++) { const x = rnd() * W, y = rnd() * 220, tw = Math.sin(t * 0.05 + i) * 0.3 + 0.7; G.fillStyle = `rgba(255,250,235,${(0.15 + rnd() * 0.6) * tw * (1 - dawn)})`; G.fillRect(Math.floor(x), Math.floor(y), 1, 1); }
  // cidade celestial
  const cx = 500, cy = 170;
  const halo = G.createRadialGradient(cx, cy, 0, cx, cy, 120);
  halo.addColorStop(0, 'rgba(255,236,180,0.55)'); halo.addColorStop(1, 'rgba(255,236,180,0)');
  G.fillStyle = halo; G.fillRect(cx - 120, cy - 120, 240, 240);
  G.fillStyle = '#ffe9b0';
  const towers = [[-40, 26], [-28, 40], [-14, 32], [0, 52], [14, 34], [28, 42], [40, 24]];
  for (const [dx, h] of towers) { G.fillRect(cx + dx - 5, cy + 10 - h, 10, h); G.fillRect(cx + dx - 2, cy + 6 - h, 4, 4); }
  G.fillStyle = '#fff8e0'; G.fillRect(cx - 48, cy + 6, 96, 6);
  for (let i = 0; i < 12; i++) { G.fillStyle = 'rgba(255,200,120,0.9)'; G.fillRect(cx - 40 + i * 7, cy - 6 - (i % 3) * 8, 2, 3); }
  // colinas
  G.fillStyle = mixHex('#1a1630', '#5a3a3a', dawn);
  G.beginPath(); G.moveTo(0, 250); G.quadraticCurveTo(160, 200, 330, 238); G.quadraticCurveTo(470, 182, 640, 214); G.lineTo(640, H); G.lineTo(0, H); G.fill();
  G.fillStyle = mixHex('#120f22', '#3a2828', dawn);
  G.beginPath(); G.moveTo(0, 300); G.quadraticCurveTo(200, 262, 380, 296); G.quadraticCurveTo(520, 270, 640, 288); G.lineTo(640, H); G.lineTo(0, H); G.fill();
  // caminho estreito
  const path = [];
  for (let i = 0; i <= 60; i++) { const k = i / 60; path.push([lerp(30, cx, k) + Math.sin(k * 9) * 30 * (1 - k), lerp(352, cy + 12, Math.pow(k, 0.8))]); }
  for (let i = 0; i < path.length; i++) { const [x, y] = path[i]; const w = Math.max(1, Math.round(6 * (1 - i / 60))); G.fillStyle = `rgba(255,236,180,${0.25 + 0.5 * (i / 60)})`; G.fillRect(Math.round(x - w / 2), Math.round(y), w, 2); }
  if (walkers) {
    walkers.forEach((ci, j) => {
      const k = mod(t * 0.0012 + j * 0.035, 0.5) + 0.05; const idx = Math.floor(k * 60); const [x, y] = path[idx];
      const ch = CHARACTERS[ci]; const s = 1 - k * 0.8;
      const hgt = Math.max(3, Math.round(14 * s));
      G.fillStyle = ch.pal.tunic; G.fillRect(Math.round(x), Math.round(y - hgt), Math.max(2, Math.round(5 * s)), hgt);
      G.fillStyle = ch.pal.skin; G.fillRect(Math.round(x), Math.round(y - hgt - Math.max(2, 4 * s)), Math.max(2, Math.round(4 * s)), Math.max(2, Math.round(4 * s)));
    });
  }
}

const SPRITE_SCALES = [1, 1.2, 1.25, 1.3];
class TitleScene {
  constructor(game) { this.game = game; this.t = 0; this.sel = 0; this.view = null; this.confirm = false; Music.play('title'); }
  items() {
    const it = [];
    if (Save.data.started) it.push({ id: 'cont', label: t('continueJourney') }, { id: 'new', label: t('newJourney') });
    else it.push({ id: 'new', label: t('startJourney') });
    it.push({ id: 'lang', label: t('language') });
    it.push({ id: 'size', label: t('spriteSize', Math.round(SPRITE_SCALE * 100) + '%') });
    it.push({ id: 'ctrl', label: t('controls') }, { id: 'about', label: t('about') });
    return it;
  }
  update() {
    this.t++;
    const nv = Input.nav();
    if (this.view) { if (nv.ok || nv.cancel) { this.view = null; Snd.play('back'); } return; }
    if (this.confirm) {
      if (nv.left || nv.right || nv.up || nv.down) { this.cSel = 1 - (this.cSel || 0); Snd.play('menu'); }
      if (nv.cancel) { this.confirm = false; Snd.play('back'); }
      if (nv.ok) { if (this.cSel === 1) { Save.reset(); this.game.toSelect('diff'); } this.confirm = false; Snd.play('ok'); }
      return;
    }
    const items = this.items();
    if (nv.up) { this.sel = mod(this.sel - 1, items.length); Snd.play('menu'); }
    if (nv.down) { this.sel = mod(this.sel + 1, items.length); Snd.play('menu'); }
    const it = items[this.sel];
    if (it.id === 'lang' && (nv.left || nv.right)) { this.game.setLang(LANG === 'pt' ? 'en' : 'pt'); Snd.play('menu'); return; }
    if (it.id === 'size' && (nv.left || nv.right)) { this.game.cycleSpriteScale(nv.left ? -1 : 1); Snd.play('menu'); return; }
    if (nv.ok) {
      Snd.play('ok');
      if (it.id === 'cont') this.game.toSelect('map');
      else if (it.id === 'new') { if (Save.data.started) { this.confirm = true; this.cSel = 0; } else { Save.reset(); this.game.toSelect('diff'); } }
      else if (it.id === 'lang') this.game.setLang(LANG === 'pt' ? 'en' : 'pt');
      else if (it.id === 'size') this.game.cycleSpriteScale(1);
      else this.view = it.id;
    }
  }
  draw() { resetG(); drawJourneyBackdrop(this.t, 0, [0, 1, 2, 3]); }
  drawUI() {
    if (this.view === 'ctrl') { U.save(); U.fillStyle = 'rgba(5,4,10,0.85)'; U.fillRect(0, 0, W, H); U.restore(); drawControlsTable(); return; }
    if (this.view === 'about') { drawAbout(); return; }
    const a = Math.min(1, this.t / 60);
    txt(t('gameTitle'), 40, 46, { size: 46, font: FONT_TITLE, weight: 700, color: '#fff3d6', alpha: a, glow: 'rgba(255,214,140,0.7)', glowSize: 14 });
    txt(t('gameSub'), 44, 98, { size: 15, font: FONT_TITLE, weight: 600, color: '#e8c070', alpha: a });
    txt(t('titleVerse'), 44, 120, { size: 7.5, color: '#c8c0d8', alpha: a });
    const items = this.items();
    items.forEach((it, i) => {
      const sel = i === this.sel, arrows = sel && (it.id === 'lang' || it.id === 'size');
      txt((sel ? '› ' : '  ') + it.label + (arrows ? '  ‹ ›' : ''), 48, 150 + i * 18, { size: 11, color: sel ? '#ffe08a' : '#d8d0e8', weight: sel ? 700 : 500, alpha: a });
    });
    txt(t('titleFoot1'), 44, H - 30, { size: 7, color: '#8a84a0', alpha: a });
    txt(t('titleFoot2'), 44, H - 19, { size: 7, color: '#8a84a0', alpha: a });
    if (this.confirm) {
      panel(W / 2 - 150, H / 2 - 40, 300, 80, { fill: 'rgba(20,14,30,0.97)' });
      txt(t('eraseWarn'), W / 2, H / 2 - 28, { size: 9, align: 'center' });
      [t('keepJourney'), t('eraseJourney')].forEach((l, i) => txt((this.cSel === i ? '› ' : '') + l, W / 2, H / 2 - 4 + i * 18, { size: 10, align: 'center', color: this.cSel === i ? '#ffe08a' : '#d8d0e8', weight: 600 }));
    }
  }
}
function drawAbout() {
  U.save(); U.fillStyle = 'rgba(5,4,10,0.9)'; U.fillRect(0, 0, W, H); U.restore();
  txt(t('aboutTitle'), W / 2, 22, { size: 16, align: 'center', font: FONT_TITLE, weight: 700, color: '#fff3d6' });
  let y = 50;
  for (const k of ['about1', 'about2', 'about3', 'about4']) { const ls = wrapText(t(k), 520, 8); ls.forEach(l => { txt(l, 60, y, { size: 8, color: '#e4dcf0' }); y += 11; }); y += 7; }
  txt(t('backHint'), W / 2, H - 22, { size: 7, align: 'center', color: '#8a84a0' });
}
function devLabel(id) {
  if (id === 'kb1') return t('kb1');
  if (id === 'kb2') return t('kb2');
  return t('pad', (+id.replace('pad', '')) + 1);
}

// ------------------------------------------------------------
class SelectScene {
  constructor(game, next) {
    this.game = game; this.next = next; this.t = 0; this.slots = []; this.count = 0;
    this.dummies = CHARACTERS.map((c, i) => { const d = new Player(0, i, null, { diff: DIFFS[1] }); d.grounded = true; return d; });
    if (game.party) for (const m of game.party) { if (Input.devs[m.dev] && Input.devs[m.dev].connected !== false && m.ci < CHARACTERS.length) this.slots.push({ dev: m.dev, ci: m.ci, ready: false, t: 0 }); }
    Music.play('title');
  }
  taken(ci, except) { return this.slots.some(s => s !== except && s.ci === ci); }
  update() {
    this.t++;
    for (const d of Input.list()) {
      const s = this.slots.find(s => s.dev === d.id);
      if (!s) {
        if ((Input.pressed(d, 'ok') || Input.pressed(d, 'jump')) && this.slots.length < 4) {
          let ci = 0; while (this.taken(ci)) ci++;
          this.slots.push({ dev: d.id, ci, ready: false, t: 0 }); Snd.play('join'); this.count = 0;
        } else if (Input.pressed(d, 'cancel') && !this.slots.length) { Snd.play('back'); this.game.toTitle(); return; }
        continue;
      }
      s.t++;
      if (!s.ready) {
        let dir = 0;
        if (Input.pressed(d, 'l')) dir = -1; if (Input.pressed(d, 'r')) dir = 1;
        if (dir) { let ci = s.ci; for (let k = 0; k < 4; k++) { ci = mod(ci + dir, 4); if (!this.taken(ci, s)) break; } s.ci = ci; Snd.play('menu'); }
        if (s.t > 8 && (Input.pressed(d, 'ok') || Input.pressed(d, 'jump'))) { s.ready = true; Snd.play('ok'); }
        if (Input.pressed(d, 'cancel')) { this.slots.splice(this.slots.indexOf(s), 1); Snd.play('back'); }
      } else if (Input.pressed(d, 'cancel') || Input.pressed(d, 'dash')) { s.ready = false; this.count = 0; Snd.play('back'); }
    }
    if (this.slots.length && this.slots.every(s => s.ready)) {
      if (++this.count > 70) {
        this.game.party = this.slots.map(s => ({ ci: s.ci, dev: s.dev }));
        Save.data.party = this.game.party; Save.write();
        if (this.next === 'diff') this.game.toDifficulty(); else this.game.toMap();
      }
    } else this.count = 0;
    for (const d of this.dummies) { d.t++; }
  }
  draw() {
    resetG();
    const gr = G.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#120f22'); gr.addColorStop(1, '#2a2240'); G.fillStyle = gr; G.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) {
      const x = 14 + i * 156, y = 44, s = this.slots[i];
      G.fillStyle = s ? rgba(CHARACTERS[s.ci].color, 0.16) : 'rgba(255,255,255,0.04)'; G.fillRect(x, y, 148, 290);
      G.fillStyle = s ? CHARACTERS[s.ci].color : '#3a3450'; G.fillRect(x, y, 148, 2);
      if (s) {
        const d = this.dummies[s.ci];
        circ(x + 74, y + 92, 38, rgba(CHARACTERS[s.ci].color, 0.15));
        G.save(); G.translate(x + 74, y + 122); G.scale(5, 5);
        d.drawBody(0, 0, 1, null);
        G.restore();
        G.fillStyle = 'rgba(0,0,0,0.3)'; G.fillRect(x + 50, y + 122, 48, 3);
      }
    }
  }
  drawUI() {
    txt(t('whoGoes'), W / 2, 12, { size: 16, align: 'center', font: FONT_TITLE, weight: 700, color: '#fff3d6' });
    txt(t('joinHint'), W / 2, 32, { size: 7, align: 'center', color: '#a8a0bc' });
    for (let i = 0; i < 4; i++) {
      const x = 14 + i * 156, y = 44, s = this.slots[i];
      if (!s) {
        txt(t('pShort') + (i + 1), x + 74, y + 100, { size: 20, align: 'center', font: FONT_TITLE, color: '#4a4462', weight: 700 });
        txt(t('pressJump'), x + 74, y + 132, { size: 9, align: 'center', color: this.t % 60 < 40 ? '#c8c0d8' : '#6a6480' });
        txt(t('kbHint1'), x + 74, y + 156, { size: 7, align: 'center', color: '#7a7490' });
        txt(t('kbHint2'), x + 74, y + 167, { size: 7, align: 'center', color: '#7a7490' });
        txt(t('padHint'), x + 74, y + 178, { size: 7, align: 'center', color: '#7a7490' });
        continue;
      }
      const ch = CHARACTERS[s.ci];
      txt(`${t('pShort')}${i + 1} · ${devLabel(s.dev)}`, x + 6, y + 6, { size: 7, color: '#c8c0d8' });
      txt('‹', x + 14, y + 84, { size: 18, color: s.ready ? '#3a3450' : '#e8dcff' }); txt('›', x + 126, y + 84, { size: 18, color: s.ready ? '#3a3450' : '#e8dcff' });
      txt(ch.name, x + 74, y + 134, { size: 16, align: 'center', font: FONT_TITLE, weight: 700, color: '#fff3d6' });
      txt(ch.cls.toUpperCase(), x + 74, y + 156, { size: 8, align: 'center', color: ch.color, weight: 700 });
      txt(ch.title, x + 74, y + 168, { size: 7, align: 'center', color: '#c8c0d8' });
      txt(`${ch.melee === 'cajado' ? t('staff') : t('sword')} + ${RANGED[ch.ranged].name}`, x + 74, y + 182, { size: 8, align: 'center', color: '#f4efe4', weight: 600 });
      wrapText(ch.trait, 134, 7).forEach((l, k) => txt(l, x + 74, y + 198 + k * 10, { size: 7, align: 'center', color: '#e4dcf0' }));
      wrapText(ch.verse + ' ' + ch.ref, 134, 6.5).forEach((l, k) => txt(l, x + 74, y + 228 + k * 9, { size: 6.5, align: 'center', color: '#a8a0bc' }));
      txt(s.ready ? t('ready') : t('confirmHint'), x + 74, y + 270, { size: s.ready ? 11 : 8, align: 'center', color: s.ready ? '#9cf08a' : '#e8c070', weight: 700 });
    }
    if (this.slots.length && this.slots.every(s => s.ready)) txt(t('starting'), W / 2, H - 20, { size: 9, align: 'center', color: '#ffe08a' });
    else txt(t('selectFoot'), W / 2, H - 20, { size: 7, align: 'center', color: '#8a84a0' });
  }
}

class DifficultyScene {
  constructor(game) { this.game = game; this.t = 0; this.sel = Save.data.diff; }
  update() {
    this.t++;
    const nv = Input.nav();
    if (nv.up) { this.sel = mod(this.sel - 1, 3); Snd.play('menu'); }
    if (nv.down) { this.sel = mod(this.sel + 1, 3); Snd.play('menu'); }
    if (nv.cancel) { this.game.toSelect('diff'); Snd.play('back'); return; }
    if (nv.ok && this.t > 10) { Save.data.diff = this.sel; Save.data.started = true; Save.write(); Snd.play('ok'); this.game.toMap(); }
  }
  draw() { resetG(); drawJourneyBackdrop(this.t); G.fillStyle = 'rgba(5,4,10,0.55)'; G.fillRect(0, 0, W, H); }
  drawUI() {
    txt(t('whichFood'), W / 2, 30, { size: 18, align: 'center', font: FONT_TITLE, weight: 700, color: '#fff3d6' });
    txt(t('diffHint'), W / 2, 56, { size: 8, align: 'center', color: '#a8a0bc' });
    DIFFS.forEach((d, i) => {
      const y = 84 + i * 76, sel = i === this.sel;
      panel(110, y, 420, 64, { fill: sel ? 'rgba(60,44,30,0.92)' : 'rgba(20,16,30,0.8)', border: sel ? 'rgba(255,224,138,0.9)' : 'rgba(120,110,150,0.5)' });
      txt(d.name, 128, y + 8, { size: 16, font: FONT_TITLE, weight: 700, color: sel ? '#ffe08a' : '#e4dcf0' });
      txt(d.sub.toUpperCase(), 512, y + 12, { size: 8, align: 'right', color: '#c8c0d8', weight: 700 });
      txt(d.desc, 128, y + 32, { size: 8, color: '#e4dcf0' });
      txt(d.ref, 128, y + 46, { size: 7, color: '#a8a0bc' });
    });
  }
}

// ------------------------------------------------------------
const MAP_NODES = [[70, 236], [180, 170], [292, 236], [404, 160], [516, 222], [596, 120]];
class MapScene {
  constructor(game) {
    this.game = game; this.t = 0;
    this.sel = clamp(Save.data.unlocked - 1, 0, 4); this.menu = 0; this.view = null;
    Music.play('map');
  }
  nodeCount() { return Save.data.ending ? 6 : 5; }
  items() {
    return [
      { id: 'go', label: this.sel === 5 ? t('seeCity') : t('enterStage') },
      { id: 'codex', label: t('codex') }, { id: 'chars', label: t('changeChars') },
      { id: 'diff', label: t('difficulty', DIFFS[Save.data.diff].name) }, { id: 'lang', label: t('language') },
      { id: 'title', label: t('titleScreen') },
    ];
  }
  update() {
    this.t++;
    const nv = Input.nav();
    if (this.view === 'codex') { if (nv.up) this.scroll = Math.max(0, (this.scroll || 0) - 1); if (nv.down) this.scroll = Math.min(4, (this.scroll || 0) + 1); if (nv.ok || nv.cancel) { this.view = null; Snd.play('back'); } return; }
    const maxSel = Math.min(this.nodeCount() - 1, Save.data.ending ? 5 : Save.data.unlocked - 1);
    if (nv.left) { this.sel = clamp(this.sel - 1, 0, maxSel); Snd.play('menu'); }
    if (nv.right) { this.sel = clamp(this.sel + 1, 0, maxSel); Snd.play('menu'); }
    const items = this.items();
    if (nv.up) { this.menu = mod(this.menu - 1, items.length); Snd.play('menu'); }
    if (nv.down) { this.menu = mod(this.menu + 1, items.length); Snd.play('menu'); }
    if (nv.cancel) { this.game.toTitle(); Snd.play('back'); return; }
    if (nv.ok && this.t > 10) {
      const it = items[this.menu]; Snd.play('ok');
      if (it.id === 'go') { if (this.sel === 5) this.game.toEnding(); else this.game.startPhase(this.sel); }
      else if (it.id === 'codex') { this.view = 'codex'; this.scroll = 0; }
      else if (it.id === 'chars') this.game.toSelect('map');
      else if (it.id === 'diff') { Save.data.diff = (Save.data.diff + 1) % 3; Save.write(); }
      else if (it.id === 'lang') this.game.setLang(LANG === 'pt' ? 'en' : 'pt');
      else if (it.id === 'title') this.game.toTitle();
    }
  }
  draw() {
    resetG();
    const gr = G.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0e0c1c'); gr.addColorStop(1, '#2a2340'); G.fillStyle = gr; G.fillRect(0, 0, W, H);
    G.fillStyle = '#2b2236'; G.fillRect(20, 56, 600, 222);
    G.fillStyle = '#3a2e44'; G.fillRect(22, 58, 596, 218);
    const rnd = mulberry32(5);
    for (let i = 0; i < 160; i++) { G.fillStyle = `rgba(255,240,210,${rnd() * 0.06})`; G.fillRect(22 + rnd() * 596, 58 + rnd() * 218, 2 + rnd() * 6, 1); }
    for (let i = 0; i < MAP_NODES.length - 1; i++) {
      const [x1, y1] = MAP_NODES[i], [x2, y2] = MAP_NODES[i + 1];
      const open = i < Save.data.unlocked - 1 || (i === 4 && Save.data.ending);
      for (let k = 0; k <= 20; k++) { const u = k / 20; const x = lerp(x1, x2, u), y = lerp(y1, y2, u) - Math.sin(u * Math.PI) * 18; if (k % 2 === 0) R(x, y, 2, 2, open ? '#e8c070' : '#5a4e6a'); }
    }
    const icons = ['hills', 'towers', 'cave', 'abyss', 'shadow', 'city'];
    for (let i = 0; i < this.nodeCount(); i++) {
      const [x, y] = MAP_NODES[i], open = i === 5 ? Save.data.ending : i < Save.data.unlocked, sel = i === this.sel;
      const done = i < 5 && Save.data.phases[i].done;
      if (sel) circ(x, y, 22 + Math.sin(this.t * 0.1) * 1.5, 'rgba(255,224,138,0.18)');
      circ(x, y, 16, open ? (i < 5 ? PHASES[i].theme.sky[1] : '#7a6a40') : '#262033');
      ring(x, y, 16, sel ? '#ffe08a' : open ? '#a89878' : '#4a4060');
      drawMapIcon(icons[i], x, y, open);
      if (done) { circ(x + 12, y - 12, 5, '#3a7a3a'); R(x + 10, y - 12, 2, 2, '#e8ffe0'); R(x + 12, y - 13, 2, 2, '#e8ffe0'); R(x + 13, y - 15, 1, 2, '#e8ffe0'); }
    }
    const party = this.game.party || [{ ci: 0 }];
    const [nx, ny] = MAP_NODES[this.sel];
    party.forEach((m, j) => {
      const ch = CHARACTERS[m.ci] || CHARACTERS[0], bx = nx - 12 + j * 8, by = ny + 30 + (Math.floor(this.t / 10 + j) % 2);
      R(bx, by - 8, 5, 6, ch.pal.tunic); R(bx + 1, by - 12, 4, 4, ch.pal.skin); R(bx, by - 13, 5, 2, ch.pal.hood); R(bx + 1, by - 2, 1, 2, ch.pal.boots); R(bx + 3, by - 2, 1, 2, ch.pal.boots);
    });
    const pct = this.game.semelhanca();
    R(160, 30, 320, 8, '#1a1428'); R(160, 30, Math.round(320 * pct / 100), 8, '#f2cf5b'); R(160, 30, Math.round(320 * pct / 100), 2, '#fff3c2');
    for (let i = 1; i < 5; i++) R(160 + i * 64, 30, 1, 8, '#3a3050');
    GIFT_ORDER.forEach((g, i) => { const has = Save.hasGift(g); circ(520 + i * 22, 34, 8, has ? '#2a2240' : '#18141f'); drawIcon(g, 517 + i * 22, 31, has ? GIFTS[g].color : '#3a3448'); });
  }
  drawUI() {
    if (this.view === 'codex') { drawCodex(this.scroll || 0); return; }
    const pct = this.game.semelhanca(), st = stageFor(pct);
    txt(t('theJourney'), 28, 14, { size: 16, font: FONT_TITLE, weight: 700, color: '#fff3d6' });
    txt(t('likeness', Math.round(pct), st.name), 160, 14, { size: 8, color: '#f2cf5b', weight: 700 });
    txt(st.ref, 160, 41, { size: 6.5, color: '#a8a0bc' });
    txt(t('gifts'), 520, 14, { size: 7, color: '#a8a0bc' });
    const i = this.sel, y0 = 286;
    if (i < 5) {
      const ph = PHASES[i], ps = Save.data.phases[i], tot = this.game.captiveTotals[i];
      txt(`${i + 1}. ${ph.name}`, 28, y0, { size: 13, font: FONT_TITLE, weight: 700, color: '#fff3d6' });
      txt(ph.sins, 28, y0 + 18, { size: 8, color: ph.theme.accent, weight: 700 });
      wrapText(ph.blurb, 330, 7).forEach((l, k) => txt(l, 28, y0 + 31 + k * 9, { size: 7, color: '#c8c0d8' }));
      txt(t('stageStats', ps.scrolls.length, ps.captives.length, tot, ps.boss ? t('defeated') : '—'), 28, y0 + 56, { size: 7, color: '#e8c070' });
    } else {
      txt(t('city'), 28, y0, { size: 13, font: FONT_TITLE, weight: 700, color: '#fff3d6' });
      txt(t('cityVerse'), 28, y0 + 20, { size: 7, color: '#c8c0d8' });
    }
    this.items().forEach((it, k) => {
      const sel = k === this.menu;
      txt((sel ? '› ' : '') + it.label, 612, y0 - 4 + k * 12, { size: 8, align: 'right', color: sel ? '#ffe08a' : '#c8c0d8', weight: sel ? 700 : 500 });
    });
    txt(t('mapHint'), 28, 62, { size: 6.5, color: '#8a84a0' });
  }
}
function drawMapIcon(k, x, y, open) {
  const c = open ? '#f4efe4' : '#4a4060';
  if (k === 'hills') { ellipse(x, y + 5, 10, 4, c); circ(x + 4, y - 5, 3, c); }
  else if (k === 'towers') { R(x - 7, y - 4, 4, 10, c); R(x - 1, y - 9, 4, 15, c); R(x + 5, y - 2, 4, 8, c); }
  else if (k === 'cave') { for (let i = 0; i < 5; i++) R(x - 8 + i * 4, y - 7, 2, 4 + (i % 2) * 3, c); R(x - 8, y + 4, 16, 3, c); }
  else if (k === 'abyss') { for (let i = 0; i < 3; i++) R(x - 8, y - 4 + i * 5, 16, 1, c); circ(x + 4, y - 7, 2, open ? '#ffb8e8' : c); }
  else if (k === 'shadow') { R(x - 1, y - 9, 3, 16, c); R(x - 6, y - 5, 13, 3, c); }
  else { for (const [dx, h] of [[-7, 8], [-3, 12], [1, 15], [5, 10]]) R(x + dx, y + 6 - h, 3, h, open ? '#ffe9b0' : c); }
}
function drawCodex(scroll) {
  U.save(); U.fillStyle = 'rgba(12,9,6,0.96)'; U.fillRect(0, 0, W, H); U.restore();
  txt(t('codexTitle'), W / 2, 14, { size: 16, align: 'center', font: FONT_TITLE, weight: 700, color: '#fff3d6' });
  let y = 42;
  for (let i = scroll; i < 5 && y < H - 40; i++) {
    const ph = PHASES[i], ps = Save.data.phases[i];
    txt(`${i + 1}. ${ph.name}`, 40, y, { size: 10, font: FONT_TITLE, weight: 700, color: ph.theme.accent }); y += 15;
    ph.scrolls.forEach((s, k) => {
      const has = ps.scrolls.includes(k);
      const ls = wrapText(has ? `"${s.text}" — ${s.ref}` : t('hidden'), 540, 7.5);
      ls.forEach(l => { txt(l, 56, y, { size: 7.5, color: has ? '#efe0b4' : '#5a5060' }); y += 10; });
      y += 2;
    });
    y += 6;
  }
  txt(t('codexHint'), W / 2, H - 16, { size: 7, align: 'center', color: '#8a84a0' });
}

// ------------------------------------------------------------
class SummaryScene {
  constructor(game, play) {
    this.game = game; this.t = 0; this.pi = play.pi; this.play = play;
    const ps = Save.data.phases[play.pi];
    this.before = game.semelhanca(); this.stageBefore = stageFor(this.before).name;
    for (const k of play.stats.scrolls) if (!ps.scrolls.includes(k)) ps.scrolls.push(k);
    for (const id of play.stats.captives) if (!ps.captives.includes(id)) ps.captives.push(id);
    ps.boss = true; ps.done = true;
    Save.data.unlocked = Math.max(Save.data.unlocked, Math.min(5, play.pi + 2));
    const gift = PHASES[play.pi].gift;
    this.newGift = gift && !Save.hasGift(gift) ? gift : null;
    if (this.newGift) Save.data.gifts.push(gift);
    if (play.pi === 4) Save.data.ending = true;
    this.after = game.semelhanca(); this.stageAfter = stageFor(this.after).name;
    ps.best = Math.max(ps.best || 0, this.after);
    Save.write();
    Music.play('map');
  }
  update() {
    this.t++;
    if (this.t > 90 && (Input.anyPressed('ok') || Input.anyPressed('jump'))) {
      Snd.play('ok');
      if (this.pi === 4) this.game.toEnding(); else this.game.toMap();
    }
  }
  draw() { resetG(); drawJourneyBackdrop(this.t, this.pi === 4 ? 0.6 : 0.15); G.fillStyle = 'rgba(5,4,10,0.6)'; G.fillRect(0, 0, W, H); }
  drawUI() {
    const ph = PHASES[this.pi], st = this.play.stats, tot = LV.captiveCount;
    const a = k => clamp((this.t - k * 15) / 20, 0, 1);
    txt(t('stageClear'), W / 2, 18, { size: 10, align: 'center', color: '#e8c070', weight: 700, alpha: a(0) });
    txt(ph.name, W / 2, 32, { size: 20, align: 'center', font: FONT_TITLE, weight: 700, color: '#fff3d6', alpha: a(0) });
    const mm = Math.floor(st.time / 3600), ss = Math.floor(st.time / 60) % 60;
    const rows = [
      [t('freedOnWay'), `${st.captives.length} / ${tot}`],
      [t('freedBoss'), '5'],
      [t('scrollsFound'), `${st.scrolls.length} / ${LV.scrollCount}`],
      [t('enemiesBeaten'), `${st.kills}`],
      [t('time'), `${mm}:${String(ss).padStart(2, '0')}`],
    ];
    rows.forEach(([k, v], i) => { const y = 66 + i * 15; txt(k, 150, y, { size: 8.5, color: '#e4dcf0', alpha: a(1 + i) }); txt(v, 490, y, { size: 8.5, align: 'right', color: '#ffe08a', weight: 700, alpha: a(1 + i) }); });
    const k2 = clamp((this.t - 110) / 60, 0, 1), pct = lerp(this.before, this.after, k2);
    U.save(); U.globalAlpha = a(7);
    U.fillStyle = '#1a1428'; U.fillRect(150, 160, 340, 8); U.fillStyle = '#f2cf5b'; U.fillRect(150, 160, 340 * pct / 100, 8);
    U.restore();
    txt(t('likenessShort', Math.round(pct)), 150, 146, { size: 9, color: '#f2cf5b', weight: 700, alpha: a(7) });
    if (this.stageAfter !== this.stageBefore && k2 >= 1) txt(t('grew', this.stageBefore, this.stageAfter), 490, 146, { size: 8, align: 'right', color: '#9cf08a', weight: 700 });
    else txt(this.stageAfter, 490, 146, { size: 8, align: 'right', color: '#c8c0d8', alpha: a(7) });
    txt(t('cor318'), W / 2, 176, { size: 7, align: 'center', color: '#a8a0bc', alpha: a(8) });
    if (this.newGift) {
      const g = GIFTS[this.newGift], al = clamp((this.t - 180) / 30, 0, 1);
      panel(130, 200, 380, 98, { alpha: al, fill: 'rgba(40,30,20,0.95)' });
      txt(t('giftReceived'), W / 2, 210, { size: 8, align: 'center', color: '#e8c070', weight: 700, alpha: al });
      txt(`${g.name} · ${g.effect}`, W / 2, 224, { size: 14, align: 'center', font: FONT_TITLE, weight: 700, color: g.color, alpha: al });
      txt(g.desc, W / 2, 248, { size: 8.5, align: 'center', color: '#f4efe4', alpha: al });
      wrapText(g.ref, 350, 7).forEach((l, i) => txt(l, W / 2, 266 + i * 10, { size: 7, align: 'center', color: '#c8b890', alpha: al }));
    }
    if (this.t > 90) txt(t('pressContinue'), W / 2, H - 22, { size: 8, align: 'center', color: '#f4efe4', alpha: 0.6 + 0.4 * Math.sin(this.t * 0.08) });
  }
}

class EndingScene {
  constructor(game) {
    this.game = game; this.t = 0; Music.play('ending');
    const pct = game.semelhanca(), st = stageFor(pct), full = pct >= 100;
    this.lines = [
      [t('end1'), 'h'], [t('end2'), 'n'], ['', 'n'],
      [t('end3'), 'v'], [t('end4'), 'v'], ['', 'n'],
      [t('likeness', Math.round(pct), st.name), 'h'],
      [full ? t('end5full') : t('end5part'), 'v'],
      [full ? t('end6full') : t('end6part'), 'n'],
      ['', 'n'], [t('end7'), 'v'], ['', 'n'], ['', 'n'],
      [t('end8'), 'h'], [t('end9'), 'n'], [t('end10'), 'n'],
    ];
  }
  update() {
    this.t++;
    if (this.t > 120 && (Input.anyPressed('ok') || Input.anyPressed('cancel'))) { Snd.play('ok'); this.game.toMap(); }
  }
  draw() {
    resetG();
    const party = (this.game.party || [{ ci: 0 }]).map(m => m.ci);
    drawJourneyBackdrop(this.t * 2, clamp(this.t / 400, 0, 1), party);
  }
  drawUI() {
    let y = H + 10 - this.t * 0.35;
    for (const [l, k] of this.lines) {
      if (y > -20 && y < H + 10) {
        const a = clamp(Math.min((H - y) / 40, (y + 10) / 40), 0, 1);
        if (k === 'h') txt(l, W / 2, y, { size: 14, align: 'center', font: FONT_TITLE, weight: 700, color: '#fff3d6', alpha: a, glow: 'rgba(255,220,160,0.6)' });
        else if (k === 'v') txt(l, W / 2, y, { size: 8, align: 'center', color: '#ffe8b8', alpha: a });
        else txt(l, W / 2, y, { size: 8, align: 'center', color: '#e4dcf0', alpha: a });
      }
      y += k === 'h' ? 26 : 16;
    }
    if (this.t > 120) txt(t('endBack'), W - 14, H - 14, { size: 7, align: 'right', color: '#c8c0d8', alpha: 0.7 });
  }
}
