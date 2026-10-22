// ============================================================
//  Entrada: até 2 jogadores no teclado + até 4 controles
// ============================================================
const KEYMAP = {
  kb1: {
    l: ['KeyA'], r: ['KeyD'], u: ['KeyW'], d: ['KeyS'],
    jump: ['KeyJ', 'Space'], sword: ['KeyK'], shoot: ['KeyL'], dash: ['Semicolon', 'ShiftLeft'],
    swap: ['KeyU', 'KeyQ'], special: ['KeyI', 'KeyE'],
    start: ['Escape'], ok: ['KeyJ', 'Space', 'Enter'], cancel: ['Escape', 'Backspace'],
  },
  kb2: {
    l: ['ArrowLeft'], r: ['ArrowRight'], u: ['ArrowUp'], d: ['ArrowDown'],
    jump: ['Numpad1', 'KeyZ'], sword: ['Numpad2', 'KeyX'], shoot: ['Numpad3', 'KeyC'], dash: ['Numpad0', 'KeyV'],
    swap: ['Numpad4', 'KeyB'], special: ['Numpad5', 'KeyN'],
    start: ['NumpadAdd'], ok: ['Numpad1', 'KeyZ', 'NumpadEnter'], cancel: ['NumpadDecimal'],
  },
};
const PREVENT_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Backspace']);
const ACTIONS = ['l', 'r', 'u', 'd', 'jump', 'sword', 'shoot', 'dash', 'swap', 'special', 'start', 'ok', 'cancel'];

const Input = {
  keys: {}, jd: {}, devs: {}, anyKeyHook: null,
  init() {
    addEventListener('keydown', e => {
      if (e.repeat) { if (PREVENT_KEYS.has(e.code)) e.preventDefault(); return; }
      this.jd[e.code] = true; this.keys[e.code] = true;
      if (PREVENT_KEYS.has(e.code)) e.preventDefault();
      if (e.code === 'KeyM') { Music.toggle(); }
      Snd.unlock();
    });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; });
    addEventListener('gamepadconnected', () => Snd.unlock());
    this.devs.kb1 = { id: 'kb1', label: 'Teclado 1', kind: 'kb', cur: {}, prev: {} };
    this.devs.kb2 = { id: 'kb2', label: 'Teclado 2', kind: 'kb', cur: {}, prev: {} };
  },
  poll() {
    for (const id of ['kb1', 'kb2']) {
      const d = this.devs[id], m = KEYMAP[id];
      d.prev = d.cur; const c = {};
      for (const a in m) c[a] = m[a].some(k => this.keys[k] || this.jd[k]);
      d.cur = c;
    }
    this.jd = {};
    let pads = [];
    try { pads = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { pads = []; }
    for (let i = 0; i < 4; i++) {
      const gp = pads[i]; const id = 'pad' + i;
      if (!gp || !gp.connected) { if (this.devs[id]) this.devs[id].connected = false; continue; }
      let d = this.devs[id];
      if (!d) d = this.devs[id] = { id, label: 'Controle ' + (i + 1), kind: 'pad', cur: {}, prev: {} };
      d.connected = true; d.prev = d.cur;
      const b = k => !!(gp.buttons[k] && (gp.buttons[k].pressed || gp.buttons[k].value > 0.5));
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      d.cur = {
        l: b(14) || ax < -0.4, r: b(15) || ax > 0.4, u: b(12) || ay < -0.5, d: b(13) || ay > 0.5,
        jump: b(0), shoot: b(1), sword: b(2), swap: b(3), special: b(4) || b(6), dash: b(5) || b(7),
        start: b(9), ok: b(0) || b(9), cancel: b(1) || b(8),
      };
    }
  },
  held(d, a) { return !!(d && d.cur[a]); },
  pressed(d, a) { return !!(d && d.cur[a] && !d.prev[a]); },
  list() { return Object.values(this.devs).filter(d => d.connected !== false); },
  anyPressed(a) {
    for (const d of this.list()) if (this.pressed(d, a)) return d;
    return null;
  },
  anyHeld(a) { for (const d of this.list()) if (this.held(d, a)) return d; return null; },
  // navegação de menu: qualquer dispositivo
  nav() {
    return {
      up: !!this.anyPressed('u'), down: !!this.anyPressed('d'),
      left: !!this.anyPressed('l'), right: !!this.anyPressed('r'),
      ok: !!this.anyPressed('ok'), cancel: !!this.anyPressed('cancel'),
    };
  },
};

// Rótulos de controle mostrados nas telas
const CONTROL_LABELS = {
  kb1: { move: 'W A S D', jump: 'J / Espaço', sword: 'K', shoot: 'L', dash: 'Ç / Shift esq.', swap: 'U / Q', special: 'I / E', start: 'Esc' },
  kb2: { move: 'Setas', jump: 'Num 1 / Z', sword: 'Num 2 / X', shoot: 'Num 3 / C', dash: 'Num 0 / V', swap: 'Num 4 / B', special: 'Num 5 / N', start: 'Num + / Esc' },
  pad: { move: 'Analógico / D-pad', jump: 'A', sword: 'X', shoot: 'B', dash: 'RB / RT', swap: 'Y', special: 'LB / LT', start: 'Start' },
};
