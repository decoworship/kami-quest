// ============================================================
//  Áudio: efeitos sintetizados + músicas chiptune
//  Hinos usados (domínio público): "Old Hundredth" (Doxologia,
//  L. Bourgeois, 1551) e "New Britain" (Amazing Grace, 1829).
// ============================================================
const Snd = {
  ctx: null, master: null, sfx: null, mus: null, noiseBuf: null, pulse: {}, last: {}, sfxOn: true,
  unlock() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain(); this.master.gain.value = 0.85; this.master.connect(this.ctx.destination);
        this.sfx = this.ctx.createGain(); this.sfx.gain.value = 0.55; this.sfx.connect(this.master);
        this.mus = this.ctx.createGain(); this.mus.gain.value = Music.on ? 0.2 : 0; this.mus.connect(this.master);
        const len = this.ctx.sampleRate;
        const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = b;
        for (const duty of [0.125, 0.25, 0.5]) this.pulse[duty] = this.makePulse(duty);
        if (Music.pending) { const p = Music.pending; Music.pending = null; Music.play(p); }
      } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  makePulse(d) {
    const n = 40, re = new Float32Array(n), im = new Float32Array(n);
    for (let i = 1; i < n; i++) re[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * d);
    return this.ctx.createPeriodicWave(re, im);
  },
  osc(type, duty) {
    const o = this.ctx.createOscillator();
    if (type === 'pulse') o.setPeriodicWave(this.pulse[duty || 0.25]); else o.type = type;
    return o;
  },
  tone(f, dur, o = {}) {
    if (!this.ctx || !this.sfxOn) return;
    const t = this.ctx.currentTime + (o.delay || 0);
    const osc = this.osc(o.type || 'square', o.duty);
    const g = this.ctx.createGain();
    osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
    const v = o.vol == null ? 0.2 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.att || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(o.dest || this.sfx);
    osc.start(t); osc.stop(t + dur + 0.03);
  },
  noise(dur, o = {}) {
    if (!this.ctx || !this.sfxOn) return;
    const t = this.ctx.currentTime + (o.delay || 0);
    const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = o.filter || 'lowpass';
    f.frequency.setValueAtTime(o.freq || 2000, t);
    if (o.slide) f.frequency.exponentialRampToValueAtTime(Math.max(30, o.slide), t + dur);
    f.Q.value = o.q || 1;
    const g = this.ctx.createGain(); const v = o.vol == null ? 0.2 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.att || 0.003));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.dest || this.sfx);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.03);
  },
  play(name, gap = 0.035) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.last[name] && now - this.last[name] < gap) return;
    this.last[name] = now;
    const f = SFX[name]; if (f) f(this);
  },
};
const mf = m => 440 * Math.pow(2, (m - 69) / 12);

const SFX = {
  jump: s => s.tone(300, 0.09, { type: 'pulse', duty: 0.25, slide: 560, vol: 0.1 }),
  djump: s => { s.tone(520, 0.1, { type: 'pulse', duty: 0.125, slide: 900, vol: 0.09 }); s.noise(0.08, { filter: 'highpass', freq: 4000, vol: 0.04 }); },
  walljump: s => s.tone(260, 0.08, { type: 'pulse', duty: 0.25, slide: 480, vol: 0.09 }),
  land: s => s.noise(0.05, { freq: 500, vol: 0.08 }),
  dash: s => { s.noise(0.16, { filter: 'bandpass', freq: 900, slide: 3500, q: 1.5, vol: 0.16 }); s.tone(180, 0.1, { type: 'sawtooth', slide: 90, vol: 0.05 }); },
  sword: s => { s.noise(0.09, { filter: 'highpass', freq: 2500, slide: 6000, vol: 0.13 }); s.tone(700, 0.06, { type: 'triangle', slide: 300, vol: 0.06 }); },
  arco: s => s.tone(950, 0.07, { type: 'triangle', slide: 280, vol: 0.12 }),
  besta: s => { s.tone(220, 0.05, { type: 'square', slide: 120, vol: 0.1 }); s.noise(0.04, { filter: 'highpass', freq: 3000, vol: 0.09 }); },
  funda: s => { s.noise(0.12, { filter: 'bandpass', freq: 600, slide: 1800, vol: 0.13 }); s.tone(330, 0.06, { type: 'triangle', slide: 160, vol: 0.06 }); },
  arcoleve: s => s.tone(1300, 0.06, { type: 'sine', slide: 500, vol: 0.12 }),
  light: s => { s.tone(1500, 0.12, { type: 'sine', slide: 2400, vol: 0.08 }); s.tone(750, 0.12, { type: 'triangle', slide: 1200, vol: 0.05 }); },
  hit: s => { s.tone(240, 0.06, { type: 'square', slide: 120, vol: 0.09 }); s.noise(0.05, { freq: 1800, vol: 0.07 }); },
  tink: s => s.tone(1800, 0.05, { type: 'triangle', slide: 1500, vol: 0.07 }),
  kill: s => { s.noise(0.28, { freq: 1600, slide: 120, vol: 0.13 }); s.tone(420, 0.25, { type: 'square', slide: 60, vol: 0.07 }); s.tone(880, 0.3, { type: 'sine', slide: 1760, vol: 0.04, delay: 0.08 }); },
  hurt: s => { s.tone(180, 0.28, { type: 'square', slide: 55, vol: 0.18 }); s.noise(0.2, { freq: 900, vol: 0.12 }); },
  shieldbreak: s => { s.tone(1400, 0.25, { type: 'triangle', slide: 300, vol: 0.12 }); s.noise(0.15, { filter: 'highpass', freq: 3000, vol: 0.06 }); },
  pickup: s => { [660, 880, 1320].forEach((f, i) => s.tone(f, 0.08, { type: 'pulse', duty: 0.25, vol: 0.08, delay: i * 0.05 })); },
  heart: s => { [523, 784, 1047].forEach((f, i) => s.tone(f, 0.12, { type: 'triangle', vol: 0.12, delay: i * 0.06 })); },
  fruit: s => { [523, 659, 784, 1047].forEach((f, i) => s.tone(f, 0.12, { type: 'pulse', duty: 0.125, vol: 0.09, delay: i * 0.05 })); },
  swap: s => s.tone(600, 0.05, { type: 'pulse', duty: 0.5, slide: 900, vol: 0.06 }),
  lose: s => { s.tone(700, 0.25, { type: 'triangle', slide: 200, vol: 0.09 }); },
  scroll: s => { s.tone(880, 1.0, { type: 'sine', vol: 0.12 }); s.tone(1320, 1.0, { type: 'sine', vol: 0.06, delay: 0.12 }); s.tone(1760, 0.8, { type: 'sine', vol: 0.05, delay: 0.24 }); },
  captive: s => { [392, 494, 587, 784].forEach((f, i) => s.tone(f, 0.25, { type: 'triangle', vol: 0.12, delay: i * 0.08 })); },
  bind: s => { s.tone(330, 0.06, { type: 'square', slide: 280, vol: 0.06 }); s.noise(0.04, { filter: 'highpass', freq: 2000, vol: 0.05 }); },
  checkpoint: s => { [523, 659, 784].forEach(f => s.tone(f, 1.2, { type: 'sine', vol: 0.08, att: 0.05 })); s.tone(1047, 1.0, { type: 'triangle', vol: 0.04, delay: 0.2 }); },
  louvor: s => {
    [392, 494, 587, 784].forEach((f, i) => { s.tone(f, 0.9, { type: 'sawtooth', vol: 0.06, att: 0.03, delay: i * 0.03 }); s.tone(f * 2, 0.7, { type: 'pulse', duty: 0.25, vol: 0.03, delay: 0.1 + i * 0.03 }); });
    s.noise(0.9, { filter: 'highpass', freq: 5000, vol: 0.05, att: 0.2 });
  },
  spring: s => s.tone(220, 0.18, { type: 'sine', slide: 900, vol: 0.15 }),
  break: s => { s.noise(0.3, { freq: 900, slide: 200, vol: 0.18 }); s.tone(120, 0.2, { type: 'square', slide: 60, vol: 0.07 }); },
  roar: s => { s.tone(90, 0.9, { type: 'sawtooth', slide: 45, vol: 0.14 }); s.noise(0.9, { freq: 600, slide: 150, vol: 0.12 }); },
  bosshit: s => { s.tone(160, 0.07, { type: 'square', slide: 90, vol: 0.09 }); s.noise(0.05, { freq: 2400, vol: 0.06 }); },
  boom: s => { s.noise(0.5, { freq: 700, slide: 60, vol: 0.22 }); s.tone(80, 0.4, { type: 'sine', slide: 35, vol: 0.2 }); },
  shoot_e: s => s.tone(500, 0.08, { type: 'pulse', duty: 0.5, slide: 250, vol: 0.05 }),
  portal: s => { for (let i = 0; i < 5; i++) s.tone(600 + i * 200, 0.3, { type: 'sine', vol: 0.05, delay: i * 0.06 }); },
  menu: s => s.tone(520, 0.04, { type: 'pulse', duty: 0.25, vol: 0.07 }),
  ok: s => { s.tone(660, 0.06, { type: 'pulse', duty: 0.25, vol: 0.08 }); s.tone(990, 0.08, { type: 'pulse', duty: 0.25, vol: 0.08, delay: 0.05 }); },
  back: s => s.tone(440, 0.08, { type: 'pulse', duty: 0.25, slide: 300, vol: 0.07 }),
  join: s => { [392, 523, 659].forEach((f, i) => s.tone(f, 0.1, { type: 'pulse', duty: 0.25, vol: 0.08, delay: i * 0.05 })); },
  revive: s => { [262, 330, 392, 523, 659].forEach((f, i) => s.tone(f, 0.18, { type: 'triangle', vol: 0.1, delay: i * 0.06 })); },
  down: s => { [523, 392, 330, 262].forEach((f, i) => s.tone(f, 0.2, { type: 'triangle', vol: 0.1, delay: i * 0.09 })); },
  warn: s => s.tone(880, 0.1, { type: 'square', vol: 0.05 }),
  slime: s => s.noise(0.08, { freq: 400, vol: 0.05 }),
  pop: s => { s.noise(0.12, { filter: 'highpass', freq: 1200, vol: 0.15 }); s.tone(900, 0.08, { type: 'square', slide: 200, vol: 0.06 }); },
};

// ------------------------------------------------------------
// Música
// ------------------------------------------------------------
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10],
};
const Music = {
  on: true, song: null, name: null, step: 0, nextT: 0, timer: null, pending: null,
  toggle() {
    this.on = !this.on;
    if (Snd.mus) Snd.mus.gain.setTargetAtTime(this.on ? 0.2 : 0, Snd.ctx.currentTime, 0.05);
  },
  play(name) {
    if (this.name === name && (this.timer || this.pending)) return;
    this.stop();
    this.name = name;
    if (!Snd.ctx) { this.pending = name; return; }
    const song = getSong(name); if (!song) return;
    this.song = song; this.step = 0; this.nextT = Snd.ctx.currentTime + 0.08;
    this.timer = setInterval(() => this.tick(), 25);
  },
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; this.song = null; this.name = null; this.pending = null; },
  tick() {
    const ctx = Snd.ctx; if (!ctx || !this.song) return;
    const s = this.song, spb = 60 / s.bpm / 4;
    while (this.nextT < ctx.currentTime + 0.15) {
      this.playStep(this.step, this.nextT, spb);
      this.step++;
      if (this.step >= s.len) { if (s.once) { this.stop(); return; } this.step = 0; }
      this.nextT += spb;
    }
  },
  playStep(st, t, spb) {
    const s = this.song;
    for (const tr of s.tracks) {
      const evs = tr.ev[st]; if (!evs) continue;
      for (const [m, d] of evs) this.note(tr, m, t, d * spb);
    }
    const dr = s.drums && s.drums[st];
    if (dr) for (const k of dr) this.drum(k, t);
  },
  note(tr, m, t, dur) {
    const ctx = Snd.ctx;
    const o = Snd.osc(tr.type, tr.duty), g = ctx.createGain();
    o.frequency.setValueAtTime(mf(m), t);
    if (tr.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.5; lg.gain.value = mf(m) * 0.006; l.connect(lg); lg.connect(o.frequency); l.start(t + 0.12); l.stop(t + dur + 0.05); }
    const v = tr.vol, rel = Math.min(0.08, dur * 0.4);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.006);
    g.gain.setValueAtTime(v * (tr.sus || 0.8), t + Math.max(0.01, dur - rel));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(Snd.mus); o.start(t); o.stop(t + dur + 0.02);
  },
  drum(k, t) {
    const ctx = Snd.ctx;
    if (k === 'k') {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g); g.connect(Snd.mus); o.start(t); o.stop(t + 0.18);
    } else {
      const src = ctx.createBufferSource(); src.buffer = Snd.noiseBuf;
      const f = ctx.createBiquadFilter(), g = ctx.createGain();
      if (k === 's') { f.type = 'bandpass'; f.frequency.value = 1800; g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); }
      else { f.type = 'highpass'; f.frequency.value = 7000; g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04); }
      src.connect(f); f.connect(g); g.connect(Snd.mus); src.start(t, Math.random() * 0.5); src.stop(t + 0.2);
    }
  },
};

function addEv(map, step, midi, dur) { (map[step] || (map[step] = [])).push([midi, dur]); }

// Harmoniza um hino simples: escolhe acorde (I, V, IV, vi, ii) que contém a nota da melodia
function buildHymn(mel, o) {
  const tonic = o.tonic; // midi da tônica (ex.: 55 = G3)
  const chords = [[0, 4, 7], [7, 11, 14], [5, 9, 12], [9, 12, 16], [2, 5, 9]];
  const lead = {}, bass = {}, arp = {};
  let s = 0;
  for (const [m, d] of mel) {
    if (m) {
      addEv(lead, s, m, d);
      if (d >= 4 || s % 8 === 0) {
        const pc = mod(m - tonic, 12);
        const ch = chords.find(c => c.some(x => mod(x, 12) === pc)) || chords[0];
        addEv(bass, s, tonic - 12 + ch[0], Math.max(4, d));
        if (o.arp) for (let i = 0; i < d; i += 2) addEv(arp, s + i, tonic + 12 + ch[(i / 2) % 3], 2);
      }
    }
    s += d;
  }
  return {
    bpm: o.bpm, len: s + (o.tail || 8), once: !!o.once,
    tracks: [
      { type: 'pulse', duty: 0.25, vol: 0.32, ev: lead, vib: true, sus: 0.85 },
      { type: 'triangle', vol: 0.5, ev: bass, sus: 0.9 },
      { type: 'pulse', duty: 0.125, vol: 0.07, ev: arp },
    ],
  };
}
// Doxologia (Old Hundredth) em Sol maior
const N = { D4: 62, E4: 64, Fs4: 66, G4: 67, A4: 69, B4: 71, C5: 72, D5: 74, E5: 76, Fs5: 78, G5: 79 };
const DOXOLOGY = [
  [N.G4, 8], [N.G4, 4], [N.Fs4, 4], [N.E4, 4], [N.D4, 4], [N.G4, 4], [N.A4, 4], [N.B4, 8], [0, 4],
  [N.B4, 8], [N.B4, 4], [N.B4, 4], [N.A4, 4], [N.G4, 4], [N.C5, 4], [N.B4, 4], [N.A4, 8], [0, 4],
  [N.G4, 8], [N.A4, 4], [N.B4, 4], [N.A4, 4], [N.G4, 4], [N.E4, 4], [N.Fs4, 4], [N.G4, 8], [0, 4],
  [N.D5, 8], [N.B4, 4], [N.G4, 4], [N.A4, 4], [N.C5, 4], [N.B4, 4], [N.A4, 4], [N.G4, 12], [0, 8],
];
// Amazing Grace (New Britain) em Sol maior, 3/4
const AMAZING = [
  [N.D4, 4],
  [N.G4, 8], [N.B4, 2], [N.G4, 2], [N.B4, 8], [N.A4, 4], [N.G4, 8], [N.E4, 4], [N.D4, 8], [N.D4, 4],
  [N.G4, 8], [N.B4, 2], [N.G4, 2], [N.B4, 8], [N.A4, 4], [N.D5, 20], [N.B4, 4],
  [N.D5, 8], [N.B4, 2], [N.D5, 2], [N.B4, 8], [N.G4, 4], [N.D4, 8], [N.E4, 4], [N.G4, 8], [N.E4, 4], [N.D4, 8], [N.D4, 4],
  [N.G4, 8], [N.B4, 2], [N.G4, 2], [N.B4, 8], [N.A4, 4], [N.G4, 12], [0, 12],
];
const VICTORY = [[N.G4, 2], [N.B4, 2], [N.D5, 2], [N.G5, 6], [N.Fs5, 2], [N.G5, 2], [N.D5, 2], [N.G5, 12]];

const RHY = [[4, 4, 4, 4], [4, 2, 2, 4, 4], [2, 2, 4, 2, 2, 4], [6, 2, 4, 4], [8, 4, 4], [4, 4, 8], [3, 3, 2, 4, 4], [2, 2, 2, 2, 4, 4], [12, 4], [4, 2, 2, 8]];
function genSong(o) {
  const rnd = mulberry32(o.seed);
  const sc = SCALES[o.mode];
  const dm = deg => o.root + sc[mod(deg, 7)] + 12 * Math.floor(deg / 7);
  const lead = {}, bass = {}, arp = {}, drums = {};
  const phrase = (chords) => {
    const notes = []; let cur = 7 + chords[0];
    for (let b = 0; b < 4; b++) {
      const ch = chords[b]; const rh = RHY[Math.floor(rnd() * RHY.length)];
      let s = 0;
      rh.forEach((d, i) => {
        let c;
        if (s % 8 === 0) {
          const tones = [ch, ch + 2, ch + 4, ch + 7, ch + 9];
          c = tones.reduce((best, t) => Math.abs(t - cur) < Math.abs(best - cur) ? t : best, tones[0]);
          if (rnd() < 0.3) c = tones[Math.floor(rnd() * tones.length)];
        } else c = cur + (rnd() < 0.5 ? -1 : 1) * (rnd() < 0.8 ? 1 : 2);
        c = clamp(c, 4, 14);
        notes.push({ s: b * 16 + s, deg: (i > 0 && rnd() < o.rest) ? null : c, d });
        cur = c; s += d;
      });
    }
    const last = notes[notes.length - 1]; last.deg = 7 + chords[3];
    return notes;
  };
  const A = phrase(o.prog), B = phrase(o.prog2 || o.prog.slice().reverse());
  const A2 = A.filter(n => n.s < 48).concat(phrase(o.prog).filter(n => n.s >= 48));
  const sections = [[A, o.prog], [A2, o.prog], [B, o.prog2 || o.prog.slice().reverse()], [A, o.prog]];
  sections.forEach(([notes, prog], si) => {
    const base = si * 64;
    for (const n of notes) if (n.deg != null) addEv(lead, base + n.s, dm(n.deg) + 12, n.d);
    for (let b = 0; b < 4; b++) {
      const root = prog[b], bs = base + b * 16;
      if (o.bass === 'drive') for (let i = 0; i < 16; i += 2) addEv(bass, bs + i, dm(root) - 12 + (i % 4 === 2 ? 12 : 0), 2);
      else if (o.bass === 'pump') for (let i = 0; i < 16; i++) addEv(bass, bs + i, dm(root) - 12 + (i % 8 === 6 ? 12 : 0), 1);
      else { addEv(bass, bs, dm(root) - 12, 8); addEv(bass, bs + 8, dm(root + 4) - 12, 8); }
      if (o.arp) for (let i = 0; i < 16; i += 2) addEv(arp, bs + i, dm(root + [0, 2, 4, 7][(i / 2) % 4]), 2);
      for (let i = 0; i < 16; i++) {
        const st = bs + i, k = [];
        if (o.drums === 'soft') { if (i === 0) k.push('k'); if (i === 8) k.push('h'); if (i === 12) k.push('h'); }
        else if (o.drums === 'rock') { if (i === 0 || i === 8 || i === 10) k.push('k'); if (i === 4 || i === 12) k.push('s'); if (i % 2 === 0) k.push('h'); }
        else if (o.drums === 'boss') { if (i % 4 === 0) k.push('k'); if (i === 4 || i === 12) k.push('s'); k.push('h'); }
        else if (o.drums === 'march') { if (i === 0 || i === 8) k.push('k'); if (i === 12 || i === 14) k.push('s'); if (i % 4 === 2) k.push('h'); }
        if (k.length) drums[st] = k;
      }
    }
  });
  return {
    bpm: o.bpm, len: 256,
    tracks: [
      { type: 'pulse', duty: o.duty || 0.25, vol: o.leadVol || 0.26, ev: lead, vib: true },
      { type: 'triangle', vol: 0.5, ev: bass, sus: 0.9 },
      { type: 'pulse', duty: 0.125, vol: o.arpVol || 0.06, ev: arp },
    ],
    drums,
  };
}
const SONG_DEFS = {
  title: () => buildHymn(DOXOLOGY, { tonic: 55, bpm: 92, arp: true, tail: 8 }),
  ending: () => buildHymn(AMAZING, { tonic: 55, bpm: 78, arp: true, tail: 16 }),
  victory: () => buildHymn(VICTORY, { tonic: 55, bpm: 140, once: true, tail: 4 }),
  map: () => genSong({ seed: 7, bpm: 88, root: 55, mode: 'major', prog: [0, 3, 4, 0], prog2: [5, 3, 4, 4], bass: 'soft', drums: 'soft', arp: true, rest: 0.15 }),
  p0: () => genSong({ seed: 11, bpm: 92, root: 57, mode: 'dorian', prog: [0, 3, 0, 4], prog2: [5, 3, 6, 4], bass: 'soft', drums: 'soft', arp: true, rest: 0.2, duty: 0.5, leadVol: 0.2 }),
  p1: () => genSong({ seed: 23, bpm: 118, root: 53, mode: 'mixolydian', prog: [0, 6, 3, 4], prog2: [3, 4, 0, 4], bass: 'drive', drums: 'rock', arp: true, rest: 0.1 }),
  p2: () => genSong({ seed: 37, bpm: 136, root: 52, mode: 'phrygian', prog: [0, 1, 0, 6], prog2: [5, 6, 1, 0], bass: 'pump', drums: 'rock', arp: false, rest: 0.08 }),
  p3: () => genSong({ seed: 41, bpm: 80, root: 50, mode: 'minor', prog: [0, 5, 3, 4], prog2: [5, 6, 3, 4], bass: 'soft', drums: 'none', arp: true, arpVol: 0.09, rest: 0.25, duty: 0.125 }),
  p4: () => genSong({ seed: 53, bpm: 98, root: 52, mode: 'harmonic', prog: [0, 5, 3, 4], prog2: [3, 0, 5, 4], bass: 'soft', drums: 'march', arp: true, rest: 0.2 }),
  boss: () => genSong({ seed: 99, bpm: 150, root: 52, mode: 'harmonic', prog: [0, 5, 6, 4], prog2: [3, 4, 0, 4], bass: 'pump', drums: 'boss', arp: true, rest: 0.05 }),
  boss5: () => genSong({ seed: 131, bpm: 140, root: 50, mode: 'harmonic', prog: [0, 3, 5, 4], prog2: [5, 3, 4, 4], bass: 'pump', drums: 'boss', arp: true, rest: 0.05 }),
};
const SONG_CACHE = {};
function getSong(n) { if (!SONG_CACHE[n] && SONG_DEFS[n]) SONG_CACHE[n] = SONG_DEFS[n](); return SONG_CACHE[n]; }
