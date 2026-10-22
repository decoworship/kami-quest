// ============================================================
//  Catálogo: desenha cada elemento do jogo com o próprio código
//  de renderização (sprites em pixels originais, ampliados).
// ============================================================
(function () {
  SPRITE_SCALE = 1;
  Save.data = Save.fresh();
  applyLang('pt');
  const EN = I18N_EN;
  const mock = { diff: DIFFS[1], glow: 0, players: [], projs: [], enemies: [], objs: [], part() { }, shake() { }, freeze() { }, ftext() { }, toast() { }, t: 0 };
  const items = [];
  const OL = () => '#0b0912';

  function section(id, title, lead) {
    const s = document.createElement('section'); s.id = id;
    s.innerHTML = `<header class="sec-head"><h2>${title}</h2>${lead ? `<p>${lead}</p>` : ''}</header><div class="grid"></div>`;
    document.getElementById('content').appendChild(s);
    return s.querySelector('.grid');
  }
  function card(grid, o) {
    const el = document.createElement('article');
    el.className = 'card' + (o.wide ? ' wide' : '');
    const cv = document.createElement('canvas');
    cv.width = o.w * o.scale; cv.height = o.h * o.scale;
    cv.style.aspectRatio = `${o.w} / ${o.h}`;
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', o.name);
    const stage = document.createElement('div'); stage.className = 'stage' + (o.bg ? ' bg-' + o.bg : ''); stage.appendChild(cv);
    el.appendChild(stage);
    const body = document.createElement('div'); body.className = 'body';
    body.innerHTML = `<div class="names"><h3>${o.name}</h3>${o.en ? `<span class="en" lang="en">${o.en}</span>` : ''}</div>`
      + (o.tag ? `<p class="tag">${o.tag}</p>` : '')
      + (o.text ? `<p class="desc">${o.text}</p>` : '')
      + (o.ref ? `<p class="ref">${o.ref}</p>` : '');
    el.appendChild(body);
    grid.appendChild(el);
    const it = { ctx: cv.getContext('2d'), w: o.w, h: o.h, scale: o.scale, draw: o.draw, t: 0, visible: true, still: !!o.still, painted: false };
    items.push(it);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { for (const e of es) it.visible = e.isIntersecting; }).observe(cv);
    return it;
  }
  function paint(it) {
    G = it.ctx;
    G.setTransform(it.scale, 0, 0, it.scale, 0, 0); G.imageSmoothingEnabled = false; G.globalAlpha = 1;
    G.clearRect(0, 0, it.w, it.h);
    try { it.draw(it.t); } catch (e) { console.error(e); }
    it.t++;
  }
  const floor = (w, y, col = 'rgba(255,255,255,0.08)') => { G.fillStyle = col; G.fillRect(0, y, w, 1); };

  // ---------------- Personagens ----------------
  const gChars = section('personagens', 'Personagens', 'Quatro classes jogáveis. Os sprites aparecem no tamanho original de pixel; no jogo o padrão é 125% (ajustável em Tamanho dos personagens).');
  CHARACTERS.forEach((ch, ci) => {
    const p = new Player(0, ci, null, mock);
    p.grounded = true;
    card(gChars, {
      w: 40, h: 32, scale: 6, bg: 'night',
      name: ch.name, en: EN.CHARACTERS[ci].cls, tag: `${ch.cls} · ${ch.melee === 'cajado' ? 'Cajado' : 'Espada'} + ${RANGED[ch.ranged].name}`,
      text: `${ch.title}. ${ch.trait}`, ref: `${ch.verse} — ${ch.ref}`,
      draw(t) {
        const pose = Math.floor(t / 110) % 5, k = t % 110;
        p.t = t; p.vx = 0; p.vy = 0; p.grounded = true; p.swordT = 0; p.shootAnim = 0; p.sliding = false; p.landT = 0;
        if (pose === 1) { p.vx = 2; p.runT += 1.6; }
        if (pose === 2) { p.grounded = false; p.vy = k < 55 ? -2 : 2; }
        if (pose === 3) { p.swordDir = 'f'; p.swordT = 12 - (k % 24) / 2; if (p.swordT <= 0) p.swordT = 0; }
        if (pose === 4) { p.shootAnim = 12 - (k % 20) * 0.6; p.aimA = -0.45; }
        p.facing = 1;
        const bx = 18, by = 28 - (pose === 2 ? 6 : 0);
        floor(40, 28);
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) p.drawBody(bx + dx, by + dy, 1, '#0b0912');
        p.drawBody(bx, by, 1, null); p.drawWeapons(bx, by);
      },
    });
  });

  {
    const p1 = new Player(0, 0, null, mock), p2 = new Player(0, 0, null, mock);
    p1.grounded = p2.grounded = true;
    card(gChars, {
      w: 56, h: 36, scale: 4, bg: 'night', name: 'Escala no jogo', tag: '100% · 125% (padrão)',
      text: 'Comparação do mesmo personagem no tamanho original e no tamanho ampliado que o jogo usa por padrão. A caixa de colisão acompanha a escala.',
      draw(t) {
        p1.t = p2.t = t; floor(56, 32);
        const ol = '#0b0912';
        const body = (p, bx, by) => { for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) p.drawBody(bx + dx, by + dy, 1, ol); p.drawBody(bx, by, 1, null); };
        body(p1, 16, 32);
        const sS = SPRITE_SCALE, sR = RES; SPRITE_SCALE = 1.25; RES = 4;
        spriteDraw(38, 32, (bx, by) => body(p2, bx, by));
        SPRITE_SCALE = sS; RES = sR;
      },
    });
  }

  // ---------------- Inimigos ----------------
  const DESC = {
    lesma: 'A preguiça se arrasta e deixa um rastro grudento que deixa você lento.',
    olho: 'Tela flutuante que não pisca: hipnotiza com anéis de distração que atravessam paredes.',
    poltrona: 'O conforto que engole: espera parada e salta em cima de quem se aproxima.',
    caranguejo: 'Agarra moedas com as garras e investe quando alguém chega perto do seu tesouro.',
    balao: 'Incha com o tempo e, quando estoura, espalha estilhaços em todas as direções.',
    pavao: 'Abre a cauda de espelhos e devolve os tiros que chegam pela frente. Ataque por trás ou de espada.',
    brasa: 'Pequena e explosiva: esquenta, investe e não dá para pisar nela.',
    lingua: 'Boca que fala mal e cospe fogo em rajadas de três (Tg 3:6).',
    raiz: 'Brota do chão e dispara espinhos em arco (Hb 12:15). Espinhosa: não dá para pisar.',
    serpente: 'Rasteja disfarçada e dá o bote quando você chega perto.',
    isca: 'A luz bonita no escuro é a isca; atrás dela, a boca. Ilumina o caminho até o perigo.',
    mascara: 'Sorri e parece inofensiva (tiros não a ferem); depois vira a cara e ataca. Golpeie de perto.',
    corrente: 'Arrasta o peso da culpa e o arremessa em arco. Pesada: quase não recua.',
    sombra: 'Cresce e avança quando você dá as costas. Encare o medo e ele para.',
    nevoa: 'Some e reaparece onde você não espera, soltando dúvidas que flutuam.',
  };
  PHASES.forEach((ph, pi) => {
    const g = section('inimigos-' + (pi + 1), `Inimigos · ${pi + 1}. ${ph.name}`, ph.sins + '.');
    ph.enemies.forEach(type => {
      const e = new Enemy(type, 22, 30, mock);
      e.active = true; e.timer = 200;
      card(g, {
        w: 40, h: 32, scale: 5, bg: 'p' + pi,
        name: ETYPES[type].name, en: EN.ETYPES[type].name, tag: `${ETYPES[type].hp} de vida · ${ETYPES[type].fly ? 'voa' : 'terrestre'}${ETYPES[type].spiky ? ' · espinhoso' : ''}`,
        text: DESC[type],
        draw(t) {
          e.anim = t; const k = t % 240;
          if (type === 'pavao') e.state = k < 120 ? 'idle' : 'fan';
          if (type === 'mascara') e.state = k < 100 ? 'idle' : k < 122 ? 'turn' : 'angry', e.timer = 122 - k;
          if (type === 'isca') e.state = k < 140 ? 'idle' : 'reveal';
          if (type === 'serpente') e.state = k < 160 ? 'idle' : 'coil';
          if (type === 'caranguejo' || type === 'brasa') e.state = k < 150 ? 'idle' : 'wind';
          if (type === 'corrente') e.state = k < 170 ? 'idle' : 'throw';
          if (type === 'sombra') { e.faced = k >= 140; e.scale = e.faced ? 0.75 : 1 + Math.sin(t * 0.03) * 0.15; }
          if (type === 'nevoa') e.alpha = 0.55 + 0.45 * Math.sin(t * 0.04);
          if (type === 'balao') e.swell = (t % 300) / 300;
          if (type === 'raiz') e.open = k > 200 ? 10 : 0;
          if (type === 'poltrona') { e.grounded = k < 200; e.open = k > 200 ? 10 : 0; }
          if (type === 'olho') e.timer = k > 210 ? 10 : 200;
          e.facing = Math.floor(t / 240) % 2 ? -1 : 1;
          const x = Math.round(20 - e.bw / 2), y = (e.t.fly ? 23 : 28) - e.bh;
          floor(40, 28);
          const ghost = type === 'sombra' || type === 'nevoa';
          if (!ghost) { G.globalAlpha = 0.85; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) EDRAW[type](e, x + dx, y + dy, OL); G.globalAlpha = 1; }
          EDRAW[type](e, x, y, c => c);
        },
      });
    });
  });

  // ---------------- Chefes ----------------
  const gBoss = section('chefes', 'Chefes', 'Um por fase. Na metade da vida cada chefe muda de comportamento e fica mais agressivo.');
  const BOSS_INFO = {
    preguica: 'De touca de dormir. Bocejos viram ondas pelo chão, joga travesseiros, rola pela arena e, quando ronca, fica mais vulnerável.',
    soberba: 'O rei inchado cresce conforme apanha. Coroa bumerangue, chuva de moedas e uma queda que faz o chão tremer.',
    ira: 'Fera de brasa: investidas que derrubam pedras do teto, sopro de fogo e saltos com onda de choque.',
    serpente: 'Serpenteia pela arena, cospe veneno e mergulha atravessando a tela. Na metade da luta, a máscara dourada se quebra.',
    acusador: 'Lança palavras de acusação, faz correntes brotarem do chão e varre a arena com o pergaminho de dívidas.',
  };
  const room = { x0: 0, x1: 640 };
  PHASES.forEach((ph, pi) => {
    const b = new BOSS_CLASSES[ph.boss](Object.assign({}, mock, { players: [] }), room);
    const bc = ph.bossCard;
    const size = { preguica: [96, 60], soberba: [96, 88], ira: [96, 64], serpente: [150, 70], acusador: [90, 96] }[ph.boss];
    card(gBoss, {
      w: size[0], h: size[1], scale: 3, bg: 'p' + pi, wide: ph.boss === 'serpente',
      name: bc.name.charAt(0) + bc.name.slice(1).toLowerCase(), en: EN.PHASES[pi].bossCard.name, tag: `${bc.title} · ${ph.name}`,
      text: BOSS_INFO[ph.boss], ref: `"${bc.text}" — ${bc.ref}`,
      draw(t) {
        b.t = t; b.flash = 0; const k = t % 480;
        if (ph.boss === 'preguica') {
          b.x = 16; b.y = size[1] - 2 - b.h; b.facing = -1;
          b.state = k < 120 ? 'idle' : k < 240 ? 'yawn' : k < 360 ? 'snore' : 'roll'; b.timer = b.state === 'roll' ? 40 : (k % 120);
          b.mouth = b.state === 'yawn' ? Math.min(1, (k - 120) / 50) : b.state === 'snore' ? 0.3 : 0; b.sleep = b.state === 'snore'; b.roll = t * 0.08;
          if (b.state === 'roll') b.x = 16;
        } else if (ph.boss === 'soberba') {
          b.hp = b.maxHp * (1 - (k / 480) * 0.9); b.px = 48; b.py = 50; b.ground = 0; b.state = k % 160 > 110 ? 'coins' : 'idle'; b.timer = 40; b.sync();
        } else if (ph.boss === 'ira') {
          b.x = 18; b.y = size[1] - 2 - b.h; b.facing = 1; b.phase2 = k >= 240; b.state = ['idle', 'charge', 'breath', 'stun'][Math.floor(k / 120)]; b.timer = 30; b.leg = t * 0.2;
        } else if (ph.boss === 'serpente') {
          b.phase2 = k >= 240; b.state = 'weave';
          b.hx = 132; b.hy = 34 + Math.sin(t * 0.05) * 14; b.ang = Math.PI * 0.95;
          b.hist = []; for (let i = 0; i < 120; i++) b.hist.push([132 - i * 1.05, 34 + Math.sin((t - i * 1.6) * 0.05) * 14]);
        } else if (ph.boss === 'acusador') {
          b.x = 36; b.y = 16 + Math.sin(t * 0.03) * 3; b.alpha = 1; b.eyes = k > 300 ? 1 : 0;
        }
        floor(size[0], size[1] - 2);
        b.render(mock);
      },
    });
  });

  // ---------------- Frutos e dons ----------------
  const gFr = section('frutos', 'Frutos do Espírito', 'Power-ups temporários (Gálatas 5:22-23). Cada jogador carrega dois e perde o fruto em uso ao levar dano.');
  FRUIT_IDS.forEach(f => {
    const F = FRUITS[f];
    card(gFr, {
      w: 24, h: 24, scale: 5, bg: 'night', name: F.name, en: EN.FRUITS[f].name, tag: F.effect + (F.passive ? ' · passivo' : ''), text: F.desc, ref: F.ref,
      draw(t) { circ(12, 12, 8, 'rgba(10,8,20,0.75)'); ring(12, 12, 8 + (t % 30 < 15 ? 0 : 1), F.color); drawIcon(f, 9, 9, F.color); },
    });
  });
  const gGift = section('dons', 'Dons espirituais', 'Permanentes (1 Coríntios 12). Um é recebido ao vencer cada chefe pela primeira vez.');
  GIFT_ORDER.forEach(g => {
    const D = GIFTS[g];
    card(gGift, {
      w: 24, h: 24, scale: 5, bg: 'night', name: D.name, en: EN.GIFTS[g].name, tag: D.effect, text: D.desc, ref: D.ref, still: true,
      draw() { circ(12, 12, 9, '#2a2240'); ring(12, 12, 9, D.color); drawIcon(g, 9, 9, D.color); },
    });
  });

  // ---------------- Elementos ----------------
  const gEl = section('elementos', 'Elementos do cenário', 'Itens, pontos de retorno e passagens que aparecem nas fases.');
  const jar = new Jar(10, 10, { fruit: 'amor' }), fly = new Jar(18, 12, { fruit: 'alegria', flying: true });
  const scroll = new ScrollPick({ k: 0, c: 0, r: 0 }, false);
  const heart = new Pickup('heart', 16, 14, { float: true }), shofar = new Pickup('shofar', 16, 14, { float: true });
  const ebOff = new Ebenezer(9, 8, 'a'), ebOn = new Ebenezer(9, 8, 'b'); ebOn.lit = true;
  const spring = new Spring(9, 22), portal = new ExitPortal(12, 4), sign = new Sign(10, 12, '');
  portal.t = 60;
  const EL = [
    ['Vaso de barro', 'Clay Jar', 'Guarda um Fruto do Espírito (2 Co 4:7). Quebre com espada ou tiro.', 32, 30, () => { jar.t++; jar.x = 10; jar.baseY = 10; jar.y = 10 + Math.round(Math.sin(jar.t * 0.04) * 1.5); jar.draw(); }],
    ['Vaso voador', 'Flying Jar', 'Atravessa a tela de tempos em tempos, como as cápsulas de Contra 3.', 48, 34, () => { fly.t++; fly.x = 18; fly.y = 12 + Math.round(Math.sin(fly.t * 0.05) * 4); fly.draw(); }],
    ['Pergaminho', 'Scroll', 'Três por fase, escondidos. Mostra um versículo e conta para a Semelhança com Cristo.', 32, 30, () => { scroll.t++; scroll.x = 11; scroll.y = 10 + Math.round(Math.sin(scroll.t * 0.05) * 2); scroll.draw(); }],
    ['Maná', 'Manna', 'Recupera um coração.', 32, 30, () => { heart.t++; heart.x = 11; heart.y = 10 + Math.round(Math.sin(heart.t * 0.06) * 2); heart.draw(mock); }],
    ['Shofar', 'Shofar', '+1 Louvor: a "bomba" que abala a tela, como em Jericó (Js 6).', 32, 30, () => { shofar.t++; shofar.x = 11; shofar.y = 10 + Math.round(Math.sin(shofar.t * 0.06) * 2); shofar.draw(mock); }],
    ['Ebenézer apagado', 'Ebenezer (unlit)', 'Ponto de retorno ainda não alcançado.', 32, 30, () => { ebOff.t++; ebOff.draw(); floor(32, 24); }],
    ['Ebenézer aceso', 'Ebenezer (lit)', '"Até aqui nos ajudou o SENHOR" (1 Sm 7:12). Ao acender: ponto de retorno, cura e levanta aliados.', 32, 30, (t) => { ebOn.t++; ebOn.draw(); if (t % 4 === 0) { } floor(32, 24); for (let i = 0; i < 3; i++) R(15 + Math.sin(t * 0.2 + i) * 2, 6 - ((t + i * 7) % 10), 1, 1, '#ffd86b'); }],
    ['Fonte', 'Spring', 'Mola de água viva (Jo 7:38) que lança para o alto.', 32, 30, (t) => { spring.t = (t % 60) < 12 ? 12 - (t % 60) : 0; spring.draw(); floor(32, 28); }],
    ['Porta de luz', 'Door of Light', 'Aparece depois do chefe: entrem para concluir a fase ("Eu sou a porta", Jo 10:9).', 48, 48, () => { portal.t++; portal.draw(); }],
    ['Placa', 'Sign', 'Dicas de tutorial na primeira fase.', 32, 30, () => { sign.draw(); floor(32, 26); }],
  ];
  EL.forEach(([n, en, d, w, h, fn]) => card(gEl, { w, h, scale: 4, bg: 'night', name: n, en, text: d, draw: fn }));

  // terreno especial (tema da fase 1)
  const miniL = (pi, rows) => {
    const cols = rows[0].length, grid = new Uint8Array(cols * rows.length);
    rows.forEach((r, y) => { for (let x = 0; x < cols; x++) grid[y * cols + x] = { '#': 1, '=': 2, '^': 3, '%': 4, '&': 5 }[r[x]] || 0; });
    return { grid, cols, rows: rows.length, ph: PHASES[pi] };
  };
  const drawMini = (L, opts = {}) => {
    for (let r = 0; r < L.rows; r++) for (let c = 0; c < L.cols; c++) {
      const tt = L.grid[r * L.cols + c];
      if (tt === 1) drawSolidTile(G, L, c, r); else if (tt === 2) drawOnewayTile(G, L, c, r); else if (tt === 3) drawSpikeTile(G, L, c, r);
      else if (tt === 4 || tt === 5) {
        drawSolidTile(G, L, c, r, tt === 5 && opts.ghost ? 0.35 : 1);
        const x = c * TS, y = r * TS, cr = shade(L.ph.theme.tileDark, -0.4);
        if (tt === 4) { R(x + 4, y + 3, 1, 5, cr); R(x + 5, y + 7, 3, 1, cr); R(x + 8, y + 8, 1, 4, cr); R(x + 10, y + 4, 3, 1, cr); R(x + 2, y + 10, 4, 1, cr); }
        if (opts.reveal) { G.globalAlpha = 0.5 + 0.3 * Math.sin(opts.t * 0.1); G.strokeStyle = tt === 4 ? '#ffe08a' : '#c9a2ff'; G.lineWidth = 1; G.strokeRect(x + 0.5, y + 0.5, 15, 15); G.globalAlpha = 1; }
      }
    }
  };
  const Lw = miniL(0, ['###', '#%#', '###']), Lf = miniL(0, ['###', '#&#', '###']), Ls = miniL(0, ['^^^', '###']);
  card(gEl, { w: 48, h: 48, scale: 3, bg: 'p0', name: 'Muralha frágil', en: 'Cracked Wall', text: 'Rachada: quebra com golpes, tiros, Louvor ou dash com Domínio Próprio. Costuma esconder pergaminhos.', draw: t => drawMini(Lw, { reveal: t % 160 > 80, t }) });
  card(gEl, { w: 48, h: 48, scale: 3, bg: 'p0', name: 'Parede falsa', en: 'False Wall', text: 'Parece sólida, mas dá para atravessar. A lâmpada da Vigia e o dom de Discernimento a revelam.', draw: t => drawMini(Lf, { reveal: t % 160 > 80, ghost: t % 160 > 80, t }) });
  card(gEl, { w: 48, h: 32, scale: 3, bg: 'p0', name: 'Espinhos', en: 'Spikes', text: 'Ferem ao tocar. O golpe para baixo no ar quica neles.', still: true, draw: () => drawMini(Ls) });

  // cativos
  const gCap = section('cativos', 'Cativos', 'Pessoas presas pelo pecado de cada fase. Golpeie as amarras três vezes para libertá-las; ao vencer o chefe, mais cinco são libertas.');
  const capInfo = [['casulo', 'Casulo de sono', 'Vale da Comodidade: "Desperta, ó tu que dormes" (Ef 5:14).'], ['gaiola', 'Gaiola de ouro', 'Feira das Vaidades: a gaiola era de ouro, mas era gaiola.'], ['correntes', 'Correntes em brasa', 'Cavernas da Ira: presos pelo rancor.'], ['bolha', 'Bolha de ilusão', 'Abismo das Ilusões: encantados por uma mentira bonita.'], ['sombra', 'Sombra e correntes', 'Vale da Sombra: o peso da culpa e do medo.']];
  capInfo.forEach(([style, n, d], pi) => {
    const c = new Captive({ id: 'x', c: 0, r: 0 }, style, [''], false);
    const f = new Captive({ id: 'y', c: 0, r: 0 }, style, [''], false); f.freed = true; f.baseY = 0;
    card(gCap, {
      w: 56, h: 36, scale: 4, bg: 'p' + pi, name: n, tag: 'Preso → liberto', text: d,
      draw(t) { c.t = t; c.hp = 3 - (Math.floor(t / 90) % 3); c.render(16, 30); f.ft = 40 + (t % 60); f.render(40, 30); floor(56, 30); },
    });
  });

  // ---------------- Cenários ----------------
  const gScn = section('cenarios', 'Cenários', 'Fundo em camadas com perspectiva atmosférica: quanto mais distante, mais próximo da cor do céu. Prévia de uma sala de cada fase.');
  PHASES.forEach((ph, pi) => {
    const L = buildLevel(pi); renderTiles(L);
    const roomIdx = [1, 3, 1, 3, 1][pi], cam = L.rooms[roomIdx].x0;
    card(gScn, {
      w: 640, h: 360, scale: 1, wide: true, name: `${pi + 1}. ${ph.name}`, en: EN.PHASES[pi].name, tag: ph.sins, text: ph.blurb,
      draw(t) {
        drawBackground(ph.theme, cam + t * 0.4, t, {});
        G.drawImage(L.canvas, cam, 0, W, WORLD_H, 0, OY, W, WORLD_H);
        if (ph.dark) { G.fillStyle = 'rgba(1,3,12,0.35)'; G.fillRect(0, 0, W, H); }
        if (ph.fog) { G.imageSmoothingEnabled = true; const b = buildBackground(ph.theme); G.globalAlpha = 0.5; G.drawImage(b.fog, -mod(t * 0.3, 640), 120); G.drawImage(b.fog, 640 - mod(t * 0.3, 640), 120); G.globalAlpha = 1; G.imageSmoothingEnabled = false; }
      },
    });
  });

  // ---------------- laço ----------------
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = 0;
  function loop(now) {
    if (now - last > 1000 / 30) {
      last = now;
      for (const it of items) if ((it.visible || !it.painted) && !(it.still && it.painted) && !(reduce && it.painted)) { paint(it); it.painted = true; }
    }
    requestAnimationFrame(loop);
  }
  for (const it of items) { paint(it); it.painted = true; }
  requestAnimationFrame(loop);
  const n = items.length;
  document.getElementById('count').textContent = `${n} itens`;
})();
