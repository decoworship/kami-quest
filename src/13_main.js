// ============================================================
//  Gerente de cenas, laço principal e inicialização
// ============================================================
const Game = {
  scene: null, party: null, captiveTotals: [],
  init() {
    Save.load();
    let lang = Save.data.lang;
    if (!lang) { try { lang = /^pt/i.test(navigator.language || '') ? 'pt' : 'en'; } catch (e) { lang = 'pt'; } }
    applyLang(lang); this.updateStartText();
    if (SPRITE_SCALES.includes(Save.data.spriteScale)) SPRITE_SCALE = Save.data.spriteScale;
    this.captiveTotals = PHASES.map((_, i) => buildLevel(i).captiveCount);
    if (Save.data.party) this.party = Save.data.party;
    this.scene = new TitleScene(this);
  },
  semelhanca() {
    let s = 0;
    for (let i = 0; i < 5; i++) {
      const ps = Save.data.phases[i], tot = this.captiveTotals[i] || 1;
      s += (ps.boss ? 4 : 0) + Math.min(3, ps.scrolls.length) * 3 + Math.min(1, ps.captives.length / tot) * 7;
    }
    return clamp(s, 0, 100);
  },
  validParty() {
    if (!this.party) return null;
    const p = this.party.filter(m => Input.devs[m.dev] && Input.devs[m.dev].connected !== false);
    return p.length ? p : null;
  },
  setLang(l) { applyLang(l); Save.data.lang = LANG; Save.write(); this.updateStartText(); },
  cycleSpriteScale(dir) {
    const i = SPRITE_SCALES.indexOf(SPRITE_SCALE);
    SPRITE_SCALE = SPRITE_SCALES[mod((i < 0 ? 2 : i) + dir, SPRITE_SCALES.length)];
    Save.data.spriteScale = SPRITE_SCALE; Save.write();
  },
  updateStartText() {
    try {
      const st = document.getElementById('start'); if (!st) return;
      st.querySelector('h1').textContent = t('gameTitle');
      st.querySelector('.sub').textContent = t('gameSub');
      st.querySelector('.go').textContent = t('startClick');
      st.querySelector('.note').textContent = t('startNote');
    } catch (e) { }
  },
  toTitle() { this.scene = new TitleScene(this); },
  toSelect(next) { this.scene = new SelectScene(this, next); },
  toDifficulty() { this.scene = new DifficultyScene(this); },
  toMap() { this.scene = new MapScene(this); },
  startPhase(i) {
    const party = this.validParty();
    if (!party) { this.toSelect('map'); return; }
    this.party = party;
    this.scene = new PlayScene(this, i, party);
  },
  toSummary(play) { this.scene = new SummaryScene(this, play); },
  toEnding() { this.scene = new EndingScene(this); },
};

(function boot() {
  const gc = document.getElementById('game'), uc = document.getElementById('ui'), stage = document.getElementById('stage');
  G = gc.getContext('2d'); U = uc.getContext('2d');
  G.imageSmoothingEnabled = false;
  let uiScale = 1;
  function resize() {
    const ww = window.innerWidth, wh = window.innerHeight;
    let s = Math.min(ww / W, wh / H);
    const fs = Math.floor(s);
    if (fs >= 2 && s - fs < 0.3) s = fs;
    const cw = Math.max(1, Math.floor(W * s)), ch = Math.max(1, Math.floor(H * s));
    for (const c of [gc, uc]) { c.style.width = cw + 'px'; c.style.height = ch + 'px'; }
    stage.style.width = cw + 'px'; stage.style.height = ch + 'px';
    const dpr = window.devicePixelRatio || 1;
    uc.width = Math.round(cw * dpr); uc.height = Math.round(ch * dpr);
    uiScale = uc.width / W;
    // resolução interna inteira próxima da tela: sprites ampliados continuam nítidos
    RES = clamp(Math.round(s * dpr), 1, 4);
    if (gc.width !== W * RES) { gc.width = W * RES; gc.height = H * RES; }
    G.imageSmoothingEnabled = false;
  }
  window.addEventListener('resize', resize); resize();
  Input.init();
  Game.init();
  const start = document.getElementById('start');
  const begin = () => { Snd.unlock(); if (start) start.hidden = true; try { window.focus(); } catch (e) { } };
  if (start) { start.addEventListener('click', begin); window.addEventListener('keydown', begin, { once: true }); }
  let acc = 0, last = performance.now();
  const STEP = 1 / 60;
  function render() {
    resetG();
    Game.scene.draw();
    U.setTransform(1, 0, 0, 1, 0, 0); U.clearRect(0, 0, uc.width, uc.height);
    U.setTransform(uiScale, 0, 0, uiScale, 0, 0);
    if (Game.scene.drawUI) Game.scene.drawUI();
  }
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000); last = now;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      Input.poll();
      try { Game.scene.update(); } catch (e) { console.error(e); }
      acc -= STEP; steps++;
    }
    if (steps >= 5) acc = 0;
    try { render(); } catch (e) { console.error(e); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // gancho para testes automatizados
  window.__peregrinos = {
    Game, Save, Input, PHASES, get LV() { return LV; },
    step(n = 1) { for (let i = 0; i < n; i++) { Input.poll(); Game.scene.update(); } render(); },
    warp(r) {
      const sc = Game.scene; if (!(sc instanceof PlayScene)) return;
      sc.lock = null; sc.lockB = null; sc.boss = null;
      for (const room of LV.rooms) if (room.i < r && (room.type === 'arena' || room.type === 'boss')) room.state = 'done';
      sc.enemies = sc.enemies.filter(e => !e.wave); sc.projs = [];
      const room = LV.rooms[r];
      for (const p of sc.players) { p.x = room.x0 + 24 + p.slot * 12; p.y = 19 * TS - p.h - 1; p.vx = 0; p.vy = 0; p.rx = 0; p.ry = 0; p.state = 'alive'; p.hp = p.maxHp; }
      sc.cam = clamp(room.x0, 0, LV.w - W);
    },
  };
})();
