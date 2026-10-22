// ============================================================
//  Dados do jogo: personagens, frutos, dons, dificuldades, fases
// ============================================================
const CHARACTERS = [
  {
    id: 'peregrino', name: 'Rowan', cls: 'Peregrino', title: 'Deixou a Cidade da Destruição',
    ranged: 'arco', melee: 'espada', color: '#5b8ff0',
    trait: 'Ágil: o dash recarrega mais rápido.',
    verse: '"...estrangeiros e peregrinos sobre a terra."', ref: 'Hb 11:13',
    pal: { tunic: '#4f86e0', dark: '#2c4f9e', cape: '#24407f', hood: '#2a3f78', skin: '#f1c7a0', pants: '#3b3330', boots: '#6b4426', belt: '#c9933f', acc: '#d9b26a' },
  },
  {
    id: 'guardiao', name: 'Garrett', cls: 'Guardião', title: 'Sentinela sobre os muros',
    ranged: 'besta', melee: 'espada', color: '#e0523f',
    trait: 'Firme: +1 coração e recua menos ao ser ferido.',
    verse: '"Sobre os teus muros, ó Jerusalém, pus guardas."', ref: 'Is 62:6',
    pal: { tunic: '#c43d2e', dark: '#7f2219', cape: '#8f2a1e', hood: '#c9ced6', skin: '#c98e62', pants: '#3a2c2c', boots: '#4a3a30', belt: '#e8b83a', acc: '#e8b83a' },
  },
  {
    id: 'pastor', name: 'Wesley', cls: 'Pastor', title: 'Cuida do rebanho pelo caminho',
    ranged: 'funda', melee: 'cajado', color: '#4fb85c',
    trait: 'Leve: salta mais alto. Cajado de golpe amplo.',
    verse: '"Pastoreai o rebanho de Deus que há entre vós."', ref: '1 Pe 5:2',
    pal: { tunic: '#3f9e4d', dark: '#23682f', cape: '#2d7a3a', hood: '#e6dcc0', skin: '#b07a52', pants: '#5a4630', boots: '#6b4a2b', belt: '#8b5a2b', acc: '#8b5a2b', beard: '#4a3020' },
  },
  {
    id: 'vigia', name: 'Lucy', cls: 'Vigia', title: 'Com a lâmpada sempre acesa',
    ranged: 'arcoleve', melee: 'espada', color: '#a57cf0',
    trait: 'Lâmpada: ilumina mais e revela paredes falsas por perto.',
    verse: '"Vigiai, pois, porque não sabeis o dia nem a hora."', ref: 'Mt 25:13',
    pal: { tunic: '#7c4fc9', dark: '#4b2c86', cape: '#5a3a9e', hood: '#5f3fa6', skin: '#f5d0b5', pants: '#3a2f48', boots: '#4d3b5e', belt: '#e7d48a', acc: '#ffd86b' },
  },
];

const RANGED = {
  arco: { name: 'Arco', speed: 6.6, grav: 0.10, dmg: 1, cd: 13, kind: 'arrow', sfx: 'arco' },
  besta: { name: 'Besta', speed: 8.6, grav: 0.0, dmg: 2, cd: 26, kind: 'bolt', pierce: 1, sfx: 'besta' },
  funda: { name: 'Funda', speed: 5.8, grav: 0.24, dmg: 2, cd: 23, kind: 'stone', bounce: 1, sfx: 'funda' },
  arcoleve: { name: 'Arco Leve', speed: 7.0, grav: 0.13, dmg: 1, cd: 12, kind: 'lightarrow', sfx: 'arcoleve', life: 46 },
};

// Frutos do Espírito (Gl 5:22-23) — power-ups temporários, perdidos ao levar dano
const FRUITS = {
  amor: { name: 'Amor', effect: 'Leque', desc: 'Dispara cinco projéteis em leque.', color: '#ef4f6a', ref: '"O amor cobre multidão de pecados." — 1 Pe 4:8', w: 10 },
  alegria: { name: 'Alegria', effect: 'Rajada', desc: 'Disparos muito mais rápidos.', color: '#f7c948', ref: '"A alegria do SENHOR é a vossa força." — Ne 8:10', w: 10 },
  paz: { name: 'Paz', effect: 'Escudo', desc: 'Um escudo absorve o próximo golpe.', color: '#86dcf7', ref: '"A paz de Deus... guardará o vosso coração." — Fp 4:7', w: 9, passive: true },
  longanimidade: { name: 'Longanimidade', effect: 'Sementes', desc: 'Sementes de luz se fixam e explodem após um tempo.', color: '#74cc5f', ref: '"O lavrador aguarda com paciência o precioso fruto." — Tg 5:7', w: 6 },
  benignidade: { name: 'Benignidade', effect: 'Aura', desc: 'Cura você e aliados próximos de tempos em tempos.', color: '#f5a3d6', ref: '"Sede uns para com os outros benignos." — Ef 4:32', w: 5 },
  bondade: { name: 'Bondade', effect: 'Luz', desc: 'Lança de luz que atravessa inimigos.', color: '#fff3c2', ref: '"Assim brilhe a vossa luz diante dos homens." — Mt 5:16', w: 7 },
  fidelidade: { name: 'Fidelidade', effect: 'Teleguiado', desc: 'Projéteis perseguem os inimigos.', color: '#b48af5', ref: '"Grande é a tua fidelidade." — Lm 3:23', w: 8 },
  mansidao: { name: 'Mansidão', effect: 'Rebater', desc: 'Golpes corpo a corpo rebatem projéteis inimigos.', color: '#5fdcbc', ref: '"A resposta branda desvia o furor." — Pv 15:1', w: 6 },
  dominio: { name: 'Domínio Próprio', effect: 'Investida', desc: 'O dash fere inimigos e quebra muralhas.', color: '#f5913f', ref: '"Melhor é o que domina o seu espírito do que o que toma uma cidade." — Pv 16:32', w: 6 },
};
const FRUIT_IDS = Object.keys(FRUITS);
function randomFruit(exclude) {
  const ids = FRUIT_IDS.filter(f => f !== exclude);
  let tot = ids.reduce((s, f) => s + FRUITS[f].w, 0), r = Math.random() * tot;
  for (const f of ids) { r -= FRUITS[f].w; if (r <= 0) return f; }
  return ids[0];
}

// Dons espirituais (1 Co 12) — permanentes, recebidos ao vencer cada chefe
const GIFTS = {
  fe: { name: 'Dom da Fé', effect: 'Passo de Fé', desc: 'Você pode saltar mais uma vez no ar.', ref: '"E Pedro, descendo do barco, andou sobre as águas." — Mt 14:29', color: '#9fd3ff' },
  cura: { name: 'Dom de Curar', effect: 'Mãos que Curam', desc: '+1 coração máximo, e reviver aliados é instantâneo.', ref: '"De graça recebestes, de graça dai." — Mt 10:8', color: '#ff9fb4' },
  sabedoria: { name: 'Palavra da Sabedoria', effect: 'Espada da Palavra', desc: 'Golpes corpo a corpo maiores e mais fortes.', ref: '"A palavra de Deus é viva e eficaz, e mais cortante do que espada de dois gumes." — Hb 4:12', color: '#ffe08a' },
  discernimento: { name: 'Discernimento', effect: 'Olhos Abertos', desc: 'Revela paredes falsas e frágeis e amplia a luz na escuridão.', ref: '"Não deis crédito a qualquer espírito; antes, provai os espíritos." — 1 Jo 4:1', color: '#c9a2ff' },
};
const GIFT_ORDER = ['fe', 'cura', 'sabedoria', 'discernimento'];

const DIFFS = [
  { id: 'leite', name: 'Leite', sub: 'Fácil', desc: 'Para quem está começando: mais corações e inimigos mais brandos.', ref: '"Leite vos dei a beber, não alimento sólido." — 1 Co 3:2', hearts: 5, ehp: 0.7, espd: 0.8, efire: 0.65, count: 0.75, iframes: 110, drop: 1.7, louvor: 2, revive: 2, boss: 0.7 },
  { id: 'pao', name: 'Pão', sub: 'Normal', desc: 'A jornada como foi pensada.', ref: '"Eu sou o pão da vida." — Jo 6:35', hearts: 3, ehp: 1, espd: 1, efire: 1, count: 1, iframes: 90, drop: 1, louvor: 1, revive: 2, boss: 1 },
  { id: 'solido', name: 'Alimento Sólido', sub: 'Difícil', desc: 'Para os maduros na fé: inimigos ferozes e pouca margem de erro.', ref: '"O alimento sólido é para os adultos." — Hb 5:14', hearts: 2, ehp: 1.4, espd: 1.15, efire: 1.35, count: 1.3, iframes: 75, drop: 0.7, louvor: 1, revive: 1, boss: 1.35 },
];

const STAGES = [
  { min: 0, name: 'Semente', ref: '"A semente é a palavra de Deus." — Lc 8:11' },
  { min: 20, name: 'Broto', ref: '"Primeiro a erva, depois a espiga." — Mc 4:28' },
  { min: 40, name: 'Ramo', ref: '"Eu sou a videira, vós, os ramos." — Jo 15:5' },
  { min: 60, name: 'Árvore', ref: '"Será como árvore plantada junto a ribeiros de águas." — Sl 1:3' },
  { min: 80, name: 'Fruto Maduro', ref: '"Nisto é glorificado meu Pai: em que deis muito fruto." — Jo 15:8' },
  { min: 100, name: 'À Imagem de Cristo', ref: '"...conformes à imagem de seu Filho." — Rm 8:29' },
];
function stageFor(p) { let s = STAGES[0]; for (const st of STAGES) if (p >= st.min) s = st; return s; }

// Inimigos: caricaturas sombrias de pecados e tentações
const ETYPES = {
  lesma: { name: 'Lesma da Preguiça', hp: 3, w: 14, h: 9, ai: 'walker', speed: 0.32, slime: true },
  olho: { name: 'Olho da Distração', hp: 2, w: 14, h: 13, ai: 'hover', fly: true, fire: 160, proj: 'ring' },
  poltrona: { name: 'Poltrona do Comodismo', hp: 6, w: 18, h: 16, ai: 'hopper' },
  caranguejo: { name: 'Caranguejo da Avareza', hp: 5, w: 20, h: 12, ai: 'charger', speed: 0.45, chargeSpd: 3.4 },
  balao: { name: 'Balão da Soberba', hp: 2, w: 16, h: 16, ai: 'floater', fly: true },
  pavao: { name: 'Pavão da Vaidade', hp: 5, w: 18, h: 16, ai: 'pavao', speed: 0.4 },
  brasa: { name: 'Brasa da Ira', hp: 3, w: 12, h: 12, ai: 'charger', speed: 0.6, chargeSpd: 4.0, spiky: true },
  lingua: { name: 'Língua Ferina', hp: 3, w: 16, h: 12, ai: 'hover', fly: true, fire: 140, proj: 'fire', burst: 3 },
  raiz: { name: 'Raiz de Amargura', hp: 4, w: 14, h: 16, ai: 'turret', fire: 130, proj: 'thorn', spiky: true },
  serpente: { name: 'Serpente do Engano', hp: 3, w: 18, h: 8, ai: 'lunger', speed: 0.55 },
  isca: { name: 'Isca Sedutora', hp: 3, w: 16, h: 14, ai: 'lure', fly: true, light: 46 },
  mascara: { name: 'Máscara da Mentira', hp: 4, w: 16, h: 16, ai: 'mask', fly: true, proj: 'lie' },
  corrente: { name: 'Corrente da Culpa', hp: 6, w: 16, h: 18, ai: 'thrower', speed: 0.25, fire: 150, proj: 'ball' },
  sombra: { name: 'Sombra do Medo', hp: 3, w: 14, h: 16, ai: 'fear', fly: true },
  nevoa: { name: 'Névoa da Dúvida', hp: 3, w: 14, h: 14, ai: 'blinker', fly: true, proj: 'doubt' },
};

const PHASES = [
  {
    id: 'comodidade', name: 'Vale da Comodidade', sins: 'Preguiça e Distração',
    blurb: 'Um vale macio e enevoado onde tudo convida a dormir. As telas brilham, as horas escorrem.',
    intro: { text: 'Desperta, ó tu que dormes, levanta-te dentre os mortos, e Cristo te iluminará.', ref: 'Ef 5:14' },
    enemies: ['lesma', 'olho', 'poltrona'], boss: 'preguica', music: 'p0',
    rooms: ['SA', 'EA', 'AR1', 'EE', 'AR2', 'ED', 'BOSS'],
    captive: 'casulo',
    lines: ['Eu dormi a vida inteira...', 'Acordei! Obrigado!', 'Quanto tempo eu perdi...', 'Desperto, enfim!', 'Eu nem via o tempo passar.'],
    scrolls: [
      { text: 'Vai ter com a formiga, ó preguiçoso; considera os seus caminhos e sê sábio.', ref: 'Pv 6:6' },
      { text: 'Remindo o tempo, porque os dias são maus.', ref: 'Ef 5:16' },
      { text: 'Tudo quanto fizerdes, fazei-o de todo o coração, como para o Senhor.', ref: 'Cl 3:23' },
    ],
    bossCard: { name: 'PREGUIÇA', title: 'O Grande Comodismo', text: 'Ó preguiçoso, até quando ficarás deitado?', ref: 'Pv 6:9' },
    gift: 'fe',
    theme: {
      sky: ['#17142a', '#2f2850', '#5d4f82'], far: '#2b2645', mid: '#211d37', near: '#1a172c',
      tile: '#6a6386', tileDark: '#48415f', tileLight: '#857fa3', top: '#9cc487', topDark: '#5f8c58',
      plat: '#9e8768', platDark: '#665540', spike: '#c8c1de', particle: 'fluff', bg: 'hills', accent: '#c9b8ff',
    },
  },
  {
    id: 'vaidades', name: 'Feira das Vaidades', sins: 'Soberba, Vaidade e Avareza',
    blurb: 'Uma feira dourada que nunca fecha. Espelhos por toda parte, moedas tilintando, aplausos vazios.',
    intro: { text: 'Vaidade de vaidades, tudo é vaidade.', ref: 'Ec 1:2' },
    enemies: ['caranguejo', 'balao', 'pavao'], boss: 'soberba', music: 'p1',
    rooms: ['SB', 'EB', 'AR3', 'EC', 'AR4', 'EF:m', 'BOSS'],
    captive: 'gaiola',
    lines: ['A gaiola era de ouro, mas era gaiola.', 'Eu tinha tudo e não tinha nada.', 'Livre! Que alívio!', 'Não preciso mais de aplausos.', 'Obrigado, irmão!'],
    scrolls: [
      { text: 'Nada façais por contenda ou por vanglória, mas por humildade.', ref: 'Fp 2:3' },
      { text: 'Que aproveita ao homem ganhar o mundo inteiro e perder a sua alma?', ref: 'Mc 8:36' },
      { text: 'O amor do dinheiro é raiz de todos os males.', ref: '1 Tm 6:10' },
    ],
    bossCard: { name: 'SOBERBA', title: 'O Rei Inchado', text: 'A soberba precede a ruína, e a altivez do espírito, a queda.', ref: 'Pv 16:18' },
    gift: 'cura',
    theme: {
      sky: ['#1a0920', '#46153f', '#86355a'], far: '#3a1436', mid: '#2b0f29', near: '#200b1e',
      tile: '#c2a86f', tileDark: '#86703f', tileLight: '#e2d09a', top: '#f2cf5b', topDark: '#b38b2c',
      plat: '#b9875a', platDark: '#7a5536', spike: '#f2cf5b', particle: 'glitter', bg: 'towers', accent: '#ffd36b',
    },
  },
  {
    id: 'ira', name: 'Cavernas da Ira', sins: 'Ira, Amargura e Maledicência',
    blurb: 'Túneis de basalto onde o rancor ferve. Raízes amargas rachando a rocha, línguas de fogo no escuro.',
    intro: { text: 'Irai-vos e não pequeis; não se ponha o sol sobre a vossa ira.', ref: 'Ef 4:26' },
    enemies: ['brasa', 'lingua', 'raiz'], boss: 'ira', music: 'p2',
    rooms: ['SA', 'EC:m', 'AR2', 'EA:m', 'AR1', 'EB', 'BOSS'],
    captive: 'correntes',
    lines: ['Eu não conseguia perdoar...', 'O fogo apagou. Que paz.', 'Eu me queimava por dentro.', 'Perdão... finalmente.', 'Obrigado por não desistir de mim.'],
    scrolls: [
      { text: 'Atentando para que nenhuma raiz de amargura, brotando, vos perturbe.', ref: 'Hb 12:15' },
      { text: 'A língua também é fogo; ...contamina o corpo inteiro.', ref: 'Tg 3:6' },
      { text: 'Sede uns para com os outros benignos, compassivos, perdoando-vos uns aos outros.', ref: 'Ef 4:32' },
    ],
    bossCard: { name: 'IRA', title: 'A Fera de Brasa', text: 'A ira do homem não produz a justiça de Deus.', ref: 'Tg 1:20' },
    gift: 'sabedoria',
    theme: {
      sky: ['#100303', '#2c0906', '#561a0c'], far: '#240806', mid: '#1a0504', near: '#130303',
      tile: '#4c2f2b', tileDark: '#2f1c1a', tileLight: '#6c4642', top: '#d8582a', topDark: '#8a2a14',
      plat: '#5e3d32', platDark: '#3a241d', spike: '#ff7a3a', particle: 'embers', bg: 'cave', accent: '#ff8a4a',
    },
  },
  {
    id: 'ilusoes', name: 'Abismo das Ilusões', sins: 'Sedução, Mentira e Engano',
    blurb: 'Águas escuras e profundas. As luzes mais bonitas são iscas; a verdade é a única lâmpada.',
    intro: { text: 'O próprio Satanás se transforma em anjo de luz.', ref: '2 Co 11:14' },
    enemies: ['serpente', 'isca', 'mascara'], boss: 'serpente', music: 'p3',
    rooms: ['SB', 'EF', 'AR4', 'ED:m', 'AR3', 'EE:m', 'BOSS'],
    captive: 'bolha', dark: true,
    lines: ['Parecia tão bonito...', 'Eu acreditei na mentira.', 'Agora eu vejo!', 'A verdade me libertou.', 'Que bom ver a luz de novo.'],
    scrolls: [
      { text: 'Foge, outrossim, das paixões da mocidade. Segue a justiça, a fé, o amor e a paz.', ref: '2 Tm 2:22' },
      { text: 'Conhecereis a verdade, e a verdade vos libertará.', ref: 'Jo 8:32' },
      { text: 'Lâmpada para os meus pés é a tua palavra e, luz para os meus caminhos.', ref: 'Sl 119:105' },
    ],
    bossCard: { name: 'A SERPENTE', title: 'A Enganadora de Máscara', text: 'A serpente era mais astuta que todos os animais do campo.', ref: 'Gn 3:1' },
    gift: 'discernimento',
    theme: {
      sky: ['#01030a', '#041027', '#0a2346'], far: '#061a33', mid: '#04122a', near: '#030d1f',
      tile: '#1f4a5a', tileDark: '#12303d', tileLight: '#2f6b7d', top: '#4fe0d0', topDark: '#2a9a90',
      plat: '#2a5560', platDark: '#173640', spike: '#9a7cff', particle: 'plankton', bg: 'abyss', accent: '#5ff0e0',
    },
  },
  {
    id: 'sombra', name: 'Vale da Sombra', sins: 'Medo, Dúvida e Culpa',
    blurb: 'Cinzas, névoa e acusações sussurradas. Ao longe, sobre um monte, uma cruz.',
    intro: { text: 'Ainda que eu ande pelo vale da sombra da morte, não temerei mal nenhum, porque tu estás comigo.', ref: 'Sl 23:4' },
    enemies: ['corrente', 'sombra', 'nevoa'], boss: 'acusador', music: 'p4',
    rooms: ['SA', 'EA', 'AR1', 'EF:m', 'AR4', 'ED', 'BOSS'],
    captive: 'sombra', fog: true,
    lines: ['Eu achei que não tinha perdão.', 'A culpa pesava tanto...', 'Não tenho mais medo.', 'Está consumado... eu creio!', 'Obrigado por vir me buscar.'],
    scrolls: [
      { text: 'No amor não existe medo; antes, o perfeito amor lança fora o medo.', ref: '1 Jo 4:18' },
      { text: 'Peça-a, porém, com fé, em nada duvidando.', ref: 'Tg 1:6' },
      { text: 'Agora, pois, já nenhuma condenação há para os que estão em Cristo Jesus.', ref: 'Rm 8:1' },
    ],
    bossCard: { name: 'O ACUSADOR', title: 'Aquele que acusa dia e noite', text: 'Foi expulso o acusador de nossos irmãos.', ref: 'Ap 12:10' },
    gift: null,
    theme: {
      sky: ['#111115', '#27272f', '#46444e'], far: '#2a2930', mid: '#1f1e24', near: '#17161b',
      tile: '#67636d', tileDark: '#43404a', tileLight: '#88848e', top: '#a29d95', topDark: '#6a665f',
      plat: '#5f5a52', platDark: '#3d3a35', spike: '#b0aab8', particle: 'ash', bg: 'shadow', accent: '#e8e0ff',
    },
  },
];

// Placas de tutorial (fase 1, primeira sala)
const TUTORIAL_SIGNS = [
  { col: 6, text: 'Corra e pule. Segure PULAR para ir mais alto. Deslize nas paredes e pule de novo para escalar.' },
  { col: 14, text: 'DASH em qualquer direção, até no ar. Dash + pulo no chão = salto longo.' },
  { col: 22, text: 'ESPADA de perto, ARCO de longe. Mire com as direções. Golpe para baixo no ar quica nos inimigos.' },
  { col: 30, text: 'Quebre os vasos de barro: guardam Frutos do Espírito. Ao levar dano, você perde o fruto em uso. TROCAR alterna entre os dois.' },
  { col: 36, text: 'LOUVOR abala tudo na tela, como em Jericó. Use com sabedoria. Liberte os cativos e procure os pergaminhos.' },
];
