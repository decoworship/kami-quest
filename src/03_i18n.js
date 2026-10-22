// ============================================================
//  Idiomas: português (padrão) e inglês
//  Os dados do jogo ficam em português; ao trocar de idioma, os
//  campos de texto recebem a camada correspondente abaixo.
//  Versículos em inglês com base na King James (domínio público).
// ============================================================
let LANG = 'pt';

const STR = {
  gameTitle: { pt: 'PEREGRINOS', en: 'PILGRIMS' },
  gameSub: { pt: 'O Caminho Estreito', en: 'The Narrow Way' },
  titleVerse: { pt: '"Estreita é a porta, e apertado o caminho que conduz para a vida." — Mt 7:14', en: '"Strait is the gate, and narrow is the way, which leadeth unto life." — Matt 7:14' },
  continueJourney: { pt: 'Continuar jornada', en: 'Continue journey' },
  newJourney: { pt: 'Nova jornada', en: 'New journey' },
  startJourney: { pt: 'Iniciar jornada', en: 'Start journey' },
  controls: { pt: 'Controles', en: 'Controls' },
  about: { pt: 'Sobre o jogo', en: 'About the game' },
  options: { pt: 'Opções', en: 'Options' },
  language: { pt: 'Idioma: Português', en: 'Language: English' },
  spriteSize: { pt: 'Tamanho dos personagens: {0}', en: 'Character size: {0}' },
  music: { pt: 'Música: {0}', en: 'Music: {0}' },
  on: { pt: 'ligada', en: 'on' }, off: { pt: 'desligada', en: 'off' },
  back: { pt: 'Voltar', en: 'Back' },
  titleFoot1: { pt: 'Plataforma cooperativa para 1 a 4 jogadores · teclado e controles', en: 'Co-op platformer for 1 to 4 players · keyboard and gamepads' },
  titleFoot2: { pt: 'Mover: W A S D ou setas · Confirmar: J, Espaço, Enter ou A', en: 'Move: W A S D or arrows · Confirm: J, Space, Enter or A' },
  eraseWarn: { pt: 'Começar do zero apaga a jornada salva.', en: 'Starting over erases your saved journey.' },
  keepJourney: { pt: 'Manter minha jornada', en: 'Keep my journey' },
  eraseJourney: { pt: 'Apagar e recomeçar', en: 'Erase and start over' },
  aboutTitle: { pt: 'SOBRE A JORNADA', en: 'ABOUT THE JOURNEY' },
  about1: {
    pt: 'Peregrinos é uma metáfora da vida cristã. Cada fase é um terreno da alma, e cada inimigo é a caricatura sombria de um pecado ou tentação: a preguiça que adormece, a soberba que incha, a ira que queima, o engano que seduz, a culpa que acusa.',
    en: 'Pilgrims is a picture of the Christian life. Each stage is a landscape of the soul, and each enemy is a dark caricature of a sin or temptation: sloth that lulls to sleep, pride that swells, wrath that burns, deceit that seduces, guilt that accuses.',
  },
  about2: {
    pt: 'Os Frutos do Espírito (Gálatas 5) chegam em vasos de barro (2 Co 4:7) e se perdem quando você é ferido. Os dons espirituais (1 Coríntios 12) são recebidos ao vencer cada chefe e ficam com você.',
    en: 'The Fruit of the Spirit (Galatians 5) comes in clay jars (2 Cor 4:7) and is lost when you get hurt. Spiritual gifts (1 Corinthians 12) are received by defeating each boss, and they stay with you.',
  },
  about3: {
    pt: 'O objetivo não é só chegar ao fim, mas crescer em semelhança com Cristo: encontrar os pergaminhos das Escrituras e libertar quem está preso pelo caminho. E ninguém caminha sozinho: aliados caídos são levantados pelos irmãos.',
    en: 'The goal is not only to reach the end, but to grow in Christlikeness: find the scrolls of Scripture and set free those held captive along the way. And no one walks alone: fallen allies are lifted up by their brothers and sisters.',
  },
  about4: {
    pt: 'Músicas: versões chiptune da Doxologia (Old Hundredth, 1551) e de Amazing Grace (New Britain, 1829), em domínio público. Versículos citados de forma breve, a partir das traduções de Almeida.',
    en: 'Music: chiptune arrangements of the Doxology (Old Hundredth, 1551) and Amazing Grace (New Britain, 1829), both public domain. Verses are quoted briefly from the King James Version.',
  },
  backHint: { pt: 'PULAR ou Esc para voltar', en: 'JUMP or Esc to go back' },
  // seleção
  whoGoes: { pt: 'QUEM VAI NA JORNADA?', en: 'WHO JOINS THE JOURNEY?' },
  joinHint: { pt: 'Cada jogador aperta PULAR no seu teclado ou controle para entrar. Até 4 peregrinos.', en: 'Each player presses JUMP on their own keyboard or gamepad to join. Up to 4 pilgrims.' },
  pressJump: { pt: 'Pressione PULAR', en: 'Press JUMP' },
  kbHint1: { pt: 'Teclado 1: J ou Espaço', en: 'Keyboard 1: J or Space' },
  kbHint2: { pt: 'Teclado 2: Num 1 ou Z', en: 'Keyboard 2: Num 1 or Z' },
  padHint: { pt: 'Controle: A', en: 'Gamepad: A' },
  kb1: { pt: 'Teclado 1', en: 'Keyboard 1' }, kb2: { pt: 'Teclado 2', en: 'Keyboard 2' }, pad: { pt: 'Controle {0}', en: 'Gamepad {0}' },
  ready: { pt: 'PRONTO!', en: 'READY!' },
  confirmHint: { pt: 'PULAR: confirmar', en: 'JUMP: confirm' },
  starting: { pt: 'A jornada vai começar...', en: 'The journey begins...' },
  selectFoot: { pt: '← → escolhe · PULAR confirma · Esc / B volta', en: '← → choose · JUMP confirms · Esc / B back' },
  sword: { pt: 'Espada', en: 'Sword' }, staff: { pt: 'Cajado', en: 'Staff' },
  pShort: { pt: 'J', en: 'P' },
  // dificuldade
  whichFood: { pt: 'QUAL O SEU ALIMENTO?', en: 'WHAT WILL YOU EAT?' },
  diffHint: { pt: 'Escolha a dificuldade. Você pode mudar depois no mapa.', en: 'Choose a difficulty. You can change it later on the map.' },
  // mapa
  theJourney: { pt: 'A JORNADA', en: 'THE JOURNEY' },
  likeness: { pt: 'Semelhança com Cristo: {0}% · {1}', en: 'Christlikeness: {0}% · {1}' },
  likenessShort: { pt: 'Semelhança com Cristo: {0}%', en: 'Christlikeness: {0}%' },
  gifts: { pt: 'Dons', en: 'Gifts' },
  enterStage: { pt: 'Entrar na fase', en: 'Enter stage' },
  seeCity: { pt: 'Ver a Cidade Celestial', en: 'See the Celestial City' },
  codex: { pt: 'Livro dos Pergaminhos', en: 'Book of Scrolls' },
  changeChars: { pt: 'Trocar peregrinos', en: 'Change pilgrims' },
  difficulty: { pt: 'Dificuldade: {0}', en: 'Difficulty: {0}' },
  titleScreen: { pt: 'Tela inicial', en: 'Title screen' },
  stageStats: { pt: 'Pergaminhos {0}/3   ·   Cativos libertos {1}/{2}   ·   Chefe {3}', en: 'Scrolls {0}/3   ·   Captives freed {1}/{2}   ·   Boss {3}' },
  defeated: { pt: 'vencido', en: 'defeated' },
  city: { pt: 'Cidade Celestial', en: 'Celestial City' },
  cityVerse: { pt: '"Ali não haverá mais morte, nem pranto, nem clamor, nem dor." — Ap 21:4', en: '"And there shall be no more death, neither sorrow, nor crying." — Rev 21:4' },
  mapHint: { pt: '← → fase   ↑ ↓ opção   PULAR confirma', en: '← → stage   ↑ ↓ option   JUMP confirms' },
  codexTitle: { pt: 'LIVRO DOS PERGAMINHOS', en: 'BOOK OF SCROLLS' },
  hidden: { pt: '??? (ainda escondido)', en: '??? (still hidden)' },
  codexHint: { pt: '↑ ↓ rolar · PULAR ou Esc para voltar', en: '↑ ↓ scroll · JUMP or Esc to go back' },
  // resumo
  stageClear: { pt: 'FASE CONCLUÍDA', en: 'STAGE CLEAR' },
  freedOnWay: { pt: 'Pessoas libertas no caminho', en: 'People freed along the way' },
  freedBoss: { pt: 'Libertas ao vencer o chefe', en: 'Freed by defeating the boss' },
  scrollsFound: { pt: 'Pergaminhos encontrados', en: 'Scrolls found' },
  enemiesBeaten: { pt: 'Inimigos vencidos', en: 'Enemies defeated' },
  time: { pt: 'Tempo', en: 'Time' },
  grew: { pt: 'Você cresceu: {0} → {1}!', en: 'You grew: {0} → {1}!' },
  cor318: { pt: '"E todos nós... somos transformados, de glória em glória, na sua própria imagem." — 2 Co 3:18', en: '"But we all... are changed into the same image from glory to glory." — 2 Cor 3:18' },
  giftReceived: { pt: 'DOM RECEBIDO', en: 'GIFT RECEIVED' },
  pressContinue: { pt: 'Pressione PULAR para continuar', en: 'Press JUMP to continue' },
  // final
  end1: { pt: 'O acusador foi lançado fora.', en: 'The accuser has been cast down.' },
  end2: { pt: 'O escrito de dívida foi cravado na cruz.', en: 'The record of debt was nailed to the cross.' },
  end3: { pt: '"Não por força, nem por violência, mas pelo meu Espírito, diz o SENHOR." — Zc 4:6', en: '"Not by might, nor by power, but by my spirit, saith the LORD." — Zech 4:6' },
  end4: { pt: '"Pela graça sois salvos, mediante a fé; e isto não vem de vós; é dom de Deus." — Ef 2:8', en: '"For by grace are ye saved through faith; and that not of yourselves: it is the gift of God." — Eph 2:8' },
  end5full: { pt: '"Somos transformados, de glória em glória, na sua própria imagem." — 2 Co 3:18', en: '"We all... are changed into the same image from glory to glory." — 2 Cor 3:18' },
  end5part: { pt: '"Aquele que começou boa obra em vós há de completá-la até ao Dia de Cristo." — Fp 1:6', en: '"He which hath begun a good work in you will perform it until the day of Jesus Christ." — Phil 1:6' },
  end6full: { pt: 'Vocês encontraram todos os pergaminhos e não deixaram ninguém para trás.', en: 'You found every scroll and left no one behind.' },
  end6part: { pt: 'A jornada continua: volte às fases, encontre os pergaminhos e liberte quem ficou para trás.', en: 'The journey goes on: return to the stages, find the scrolls and free those left behind.' },
  end7: { pt: '"E Deus lhes enxugará dos olhos toda lágrima." — Ap 21:4', en: '"And God shall wipe away all tears from their eyes." — Rev 21:4' },
  end8: { pt: 'PEREGRINOS · O Caminho Estreito', en: 'PILGRIMS · The Narrow Way' },
  end9: { pt: 'Músicas: Doxologia (Old Hundredth, 1551) e Amazing Grace (New Britain, 1829), domínio público.', en: 'Music: Doxology (Old Hundredth, 1551) and Amazing Grace (New Britain, 1829), public domain.' },
  end10: { pt: 'Obrigado por caminhar conosco.', en: 'Thank you for walking with us.' },
  endBack: { pt: 'PULAR para voltar ao mapa', en: 'JUMP to return to the map' },
  // em jogo
  noFruit: { pt: 'Sem fruto', en: 'No fruit' },
  lostFruit: { pt: 'perdeu {0}', en: 'lost {0}' },
  plusPraise: { pt: '+1 LOUVOR', en: '+1 PRAISE' },
  praise: { pt: 'LOUVOR!', en: 'PRAISE!' },
  revived: { pt: 'DE PÉ!', en: 'BACK UP!' },
  gal62: { pt: 'Levai as cargas uns dos outros', en: 'Bear ye one another\'s burdens' },
  gal62ref: { pt: 'Gl 6:2', en: 'Gal 6:2' },
  fell: { pt: '{0} caiu! Toque na luz para levantá-lo.', en: '{0} fell! Touch the light to lift them up.' },
  gal62full: { pt: '"Levai as cargas uns dos outros." — Gl 6:2', en: '"Bear ye one another\'s burdens." — Gal 6:2' },
  ebenezer: { pt: 'Ebenézer: "Até aqui nos ajudou o SENHOR."', en: 'Ebenezer: "Hitherto hath the LORD helped us."' },
  ebenezerRef: { pt: '1 Sm 7:12', en: '1 Sam 7:12' },
  finished: { pt: 'ESTÁ CONSUMADO!', en: 'IT IS FINISHED!' },
  finishedRef: { pt: 'Jo 19:30', en: 'John 19:30' },
  col214: { pt: '"Tendo cancelado o escrito de dívida que era contra nós... encravando-o na cruz." — Cl 2:14', en: '"Blotting out the handwriting of ordinances that was against us... nailing it to his cross." — Col 2:14' },
  victory: { pt: 'VITÓRIA!', en: 'VICTORY!' },
  victory0: { pt: 'A preguiça foi vencida. Despertem!', en: 'Sloth is defeated. Wake up!' },
  victory1: { pt: 'A soberba caiu. Os humildes foram erguidos.', en: 'Pride has fallen. The humble are lifted up.' },
  victory2: { pt: 'A ira se apagou. O perdão venceu.', en: 'Wrath has burned out. Forgiveness won.' },
  victory3: { pt: 'A máscara caiu. A verdade libertou.', en: 'The mask has fallen. The truth set them free.' },
  accuserOut: { pt: 'O ACUSADOR FOI LANÇADO FORA', en: 'THE ACCUSER IS CAST DOWN' },
  noCondemn: { pt: 'Nenhuma condenação há para os que estão em Cristo Jesus.', en: 'There is now no condemnation to them which are in Christ Jesus.' },
  rom81: { pt: 'Rm 8:1', en: 'Rom 8:1' },
  doorOpen: { pt: 'A porta está aberta: entrem na luz.', en: 'The door is open: step into the light.' },
  doorVerse: { pt: '"Eu sou a porta." — Jo 10:9', en: '"I am the door." — John 10:9' },
  riseUp: { pt: 'LEVANTE-SE', en: 'RISE UP' },
  riseSub: { pt: 'Vocês voltarão ao último Ebenézer.', en: 'You will return to the last Ebenezer.' },
  mic78: { pt: '"Ainda que eu caia, me levantarei." — Mq 7:8', en: '"When I fall, I shall arise." — Mic 7:8' },
  trial: { pt: 'PROVAÇÃO', en: 'TRIAL' },
  trialSub: { pt: 'Resistam firmes até o fim.', en: 'Stand firm to the end.' },
  jas112: { pt: '"Bem-aventurado o homem que suporta a provação." — Tg 1:12', en: '"Blessed is the man that endureth temptation." — Jas 1:12' },
  victorySmall: { pt: 'VITÓRIA', en: 'VICTORY' },
  pathGoesOn: { pt: 'O caminho segue.', en: 'The path goes on.' },
  wave: { pt: 'Onda {0} de {1}', en: 'Wave {0} of {1}' },
  scrollKnown: { pt: 'PERGAMINHO (já guardado)', en: 'SCROLL (already kept)' },
  scrollFound: { pt: 'PERGAMINHO ENCONTRADO', en: 'SCROLL FOUND' },
  scrollsHere: { pt: 'Pergaminhos nesta fase: {0}/{1}', en: 'Scrolls in this stage: {0}/{1}' },
  pressJumpGo: { pt: 'Pressione PULAR para seguir', en: 'Press JUMP to go on' },
  pause: { pt: 'PAUSA', en: 'PAUSED' },
  resume: { pt: 'Continuar', en: 'Resume' },
  toMap: { pt: 'Voltar ao mapa da jornada', en: 'Back to the journey map' },
  pauseHint: { pt: 'Esc / Start: continuar', en: 'Esc / Start: resume' },
  hudDown: { pt: 'caído: um aliado pode te levantar', en: 'fallen: an ally can lift you up' },
  ctrlTitle: { pt: 'CONTROLES', en: 'CONTROLS' },
  cMove: { pt: 'Mover / mirar (8 direções)', en: 'Move / aim (8 directions)' },
  cJump: { pt: 'Pular (segure para mais alto)', en: 'Jump (hold to go higher)' },
  cSword: { pt: 'Espada / cajado (perto)', en: 'Sword / staff (close)' },
  cShoot: { pt: 'Arco · besta · funda (longe)', en: 'Bow · crossbow · sling (far)' },
  cDash: { pt: 'Dash (esquiva, 8 direções)', en: 'Dash (dodge, 8 directions)' },
  cSwap: { pt: 'Trocar fruto ativo', en: 'Swap active fruit' },
  cSpecial: { pt: 'Louvor (abala a tela)', en: 'Praise (shakes the screen)' },
  cStart: { pt: 'Pausa', en: 'Pause' },
  colKb1: { pt: 'Teclado 1', en: 'Keyboard 1' }, colKb2: { pt: 'Teclado 2', en: 'Keyboard 2' }, colPad: { pt: 'Controle', en: 'Gamepad' },
  tip1: { pt: 'Para baixo + pular sobre plataformas vazadas: descer. Golpe para baixo no ar: quicar em inimigos e espinhos.', en: 'Down + jump on thin platforms: drop through. Down attack in the air: bounce off enemies and spikes.' },
  tip2: { pt: 'Dash no chão + pular: salto longo. Pular na parede: escalar. Pular na cabeça dos inimigos também fere.', en: 'Dash on the ground + jump: long jump. Jump off walls to climb. Landing on enemies hurts them too.' },
  tip3: { pt: 'Ao levar dano você perde o fruto em uso (o outro fica guardado). Paz é um escudo que absorve um golpe.', en: 'Taking damage loses the fruit in use (the other one stays). Peace is a shield that absorbs one hit.' },
  tip4: { pt: 'M liga/desliga a música. Com 3 ou 4 jogadores, use controles.', en: 'M toggles music. With 3 or 4 players, use gamepads.' },
  // tela de abertura (HTML)
  startClick: { pt: 'Clique ou pressione uma tecla para começar', en: 'Click or press any key to start' },
  startNote: { pt: 'Jogue com teclado (até 2 pessoas) ou controles (até 4). Com som: use fones ou caixas de som.', en: 'Play with keyboard (up to 2 people) or gamepads (up to 4). Sound on: use headphones or speakers.' },
};
function t(key, ...a) {
  const e = STR[key];
  let s = e ? (e[LANG] != null ? e[LANG] : e.pt) : key;
  a.forEach((v, i) => { s = s.split('{' + i + '}').join(v); });
  return s;
}

// Camada em inglês dos dados (mesma forma dos objetos originais)
const I18N_EN = {
  CHARACTERS: [
    { cls: 'Pilgrim', title: 'Left the City of Destruction', trait: 'Nimble: the dash recharges faster.', verse: '"...strangers and pilgrims on the earth."', ref: 'Heb 11:13' },
    { cls: 'Guardian', title: 'Watchman on the walls', trait: 'Steady: +1 heart and less knockback when hurt.', verse: '"I have set watchmen upon thy walls, O Jerusalem."', ref: 'Isa 62:6' },
    { cls: 'Shepherd', title: 'Tends the flock along the way', trait: 'Light-footed: jumps higher. Wide staff swing.', verse: '"Feed the flock of God which is among you."', ref: '1 Pet 5:2' },
    { cls: 'Watcher', title: 'With her lamp always burning', trait: 'Lamp: brighter light, reveals false walls nearby.', verse: '"Watch therefore, for ye know neither the day nor the hour."', ref: 'Matt 25:13' },
  ],
  RANGED: { arco: { name: 'Bow' }, besta: { name: 'Crossbow' }, funda: { name: 'Sling' }, arcoleve: { name: 'Light Bow' } },
  FRUITS: {
    amor: { name: 'Love', effect: 'Spread', desc: 'Fires five shots in a fan.', ref: '"Charity shall cover the multitude of sins." — 1 Pet 4:8' },
    alegria: { name: 'Joy', effect: 'Rapid', desc: 'Much faster shots.', ref: '"The joy of the LORD is your strength." — Neh 8:10' },
    paz: { name: 'Peace', effect: 'Shield', desc: 'A shield absorbs the next hit.', ref: '"The peace of God... shall keep your hearts." — Phil 4:7' },
    longanimidade: { name: 'Patience', effect: 'Seeds', desc: 'Seeds of light stick and burst after a while.', ref: '"The husbandman waiteth for the precious fruit of the earth, and hath long patience." — Jas 5:7' },
    benignidade: { name: 'Kindness', effect: 'Aura', desc: 'Heals you and nearby allies from time to time.', ref: '"Be ye kind one to another." — Eph 4:32' },
    bondade: { name: 'Goodness', effect: 'Light', desc: 'A lance of light that pierces enemies.', ref: '"Let your light so shine before men." — Matt 5:16' },
    fidelidade: { name: 'Faithfulness', effect: 'Homing', desc: 'Shots seek out enemies.', ref: '"Great is thy faithfulness." — Lam 3:23' },
    mansidao: { name: 'Gentleness', effect: 'Deflect', desc: 'Melee attacks send enemy shots back.', ref: '"A soft answer turneth away wrath." — Prov 15:1' },
    dominio: { name: 'Self-Control', effect: 'Charge', desc: 'Your dash hurts enemies and breaks walls.', ref: '"He that ruleth his spirit [is better] than he that taketh a city." — Prov 16:32' },
  },
  GIFTS: {
    fe: { name: 'Gift of Faith', effect: 'Step of Faith', desc: 'You can jump once more in midair.', ref: '"And when Peter was come down out of the ship, he walked on the water." — Matt 14:29' },
    cura: { name: 'Gift of Healing', effect: 'Healing Hands', desc: '+1 max heart, and reviving allies is instant.', ref: '"Freely ye have received, freely give." — Matt 10:8' },
    sabedoria: { name: 'Word of Wisdom', effect: 'Sword of the Word', desc: 'Bigger, stronger melee attacks.', ref: '"The word of God is quick, and powerful, and sharper than any twoedged sword." — Heb 4:12' },
    discernimento: { name: 'Discernment', effect: 'Open Eyes', desc: 'Reveals false and cracked walls and widens your light in the dark.', ref: '"Believe not every spirit, but try the spirits." — 1 John 4:1' },
  },
  DIFFS: [
    { name: 'Milk', sub: 'Easy', desc: 'For those just starting: more hearts and gentler enemies.', ref: '"I have fed you with milk, and not with meat." — 1 Cor 3:2' },
    { name: 'Bread', sub: 'Normal', desc: 'The journey as it was meant to be.', ref: '"I am the bread of life." — John 6:35' },
    { name: 'Solid Food', sub: 'Hard', desc: 'For the mature in faith: fierce enemies and little room for error.', ref: '"Strong meat belongeth to them that are of full age." — Heb 5:14' },
  ],
  STAGES: [
    { name: 'Seed', ref: '"The seed is the word of God." — Luke 8:11' },
    { name: 'Sprout', ref: '"First the blade, then the ear." — Mark 4:28' },
    { name: 'Branch', ref: '"I am the vine, ye are the branches." — John 15:5' },
    { name: 'Tree', ref: '"Like a tree planted by the rivers of water." — Ps 1:3' },
    { name: 'Ripe Fruit', ref: '"Herein is my Father glorified, that ye bear much fruit." — John 15:8' },
    { name: 'In His Image', ref: '"...conformed to the image of his Son." — Rom 8:29' },
  ],
  ETYPES: {
    lesma: { name: 'Sloth Slug' }, olho: { name: 'Eye of Distraction' }, poltrona: { name: 'Armchair of Complacency' },
    caranguejo: { name: 'Crab of Greed' }, balao: { name: 'Balloon of Pride' }, pavao: { name: 'Peacock of Vanity' },
    brasa: { name: 'Ember of Wrath' }, lingua: { name: 'Sharp Tongue' }, raiz: { name: 'Root of Bitterness' },
    serpente: { name: 'Serpent of Deceit' }, isca: { name: 'Alluring Lure' }, mascara: { name: 'Mask of Lies' },
    corrente: { name: 'Chain of Guilt' }, sombra: { name: 'Shadow of Fear' }, nevoa: { name: 'Mist of Doubt' },
  },
  PHASES: [
    {
      name: 'Valley of Ease', sins: 'Sloth and Distraction',
      blurb: 'A soft, misty valley where everything invites you to sleep. Screens glow, hours slip away.',
      intro: { text: 'Awake thou that sleepest, and arise from the dead, and Christ shall give thee light.', ref: 'Eph 5:14' },
      lines: ['I slept through my whole life...', 'I\'m awake! Thank you!', 'So much time wasted...', 'Awake at last!', 'I didn\'t even see time go by.'],
      scrolls: [
        { text: 'Go to the ant, thou sluggard; consider her ways, and be wise.', ref: 'Prov 6:6' },
        { text: 'Redeeming the time, because the days are evil.', ref: 'Eph 5:16' },
        { text: 'Whatsoever ye do, do it heartily, as to the Lord.', ref: 'Col 3:23' },
      ],
      bossCard: { name: 'SLOTH', title: 'The Great Complacency', text: 'How long wilt thou sleep, O sluggard?', ref: 'Prov 6:9' },
    },
    {
      name: 'Vanity Fair', sins: 'Pride, Vanity and Greed',
      blurb: 'A golden fair that never closes. Mirrors everywhere, coins jingling, empty applause.',
      intro: { text: 'Vanity of vanities; all is vanity.', ref: 'Eccl 1:2' },
      lines: ['The cage was gold, but it was a cage.', 'I had everything and nothing.', 'Free! What a relief!', 'I don\'t need the applause anymore.', 'Thank you, friend!'],
      scrolls: [
        { text: 'Let nothing be done through strife or vainglory; but in lowliness of mind.', ref: 'Phil 2:3' },
        { text: 'What shall it profit a man, if he shall gain the whole world, and lose his own soul?', ref: 'Mark 8:36' },
        { text: 'For the love of money is the root of all evil.', ref: '1 Tim 6:10' },
      ],
      bossCard: { name: 'PRIDE', title: 'The Swollen King', text: 'Pride goeth before destruction, and an haughty spirit before a fall.', ref: 'Prov 16:18' },
    },
    {
      name: 'Caverns of Wrath', sins: 'Wrath, Bitterness and Slander',
      blurb: 'Basalt tunnels where resentment boils. Bitter roots split the rock, tongues of fire in the dark.',
      intro: { text: 'Be ye angry, and sin not: let not the sun go down upon your wrath.', ref: 'Eph 4:26' },
      lines: ['I couldn\'t forgive...', 'The fire went out. Such peace.', 'I was burning inside.', 'Forgiveness... at last.', 'Thank you for not giving up on me.'],
      scrolls: [
        { text: 'Lest any root of bitterness springing up trouble you.', ref: 'Heb 12:15' },
        { text: 'And the tongue is a fire... it defileth the whole body.', ref: 'Jas 3:6' },
        { text: 'Be ye kind one to another, tenderhearted, forgiving one another.', ref: 'Eph 4:32' },
      ],
      bossCard: { name: 'WRATH', title: 'The Ember Beast', text: 'The wrath of man worketh not the righteousness of God.', ref: 'Jas 1:20' },
    },
    {
      name: 'Abyss of Illusions', sins: 'Seduction, Lies and Deceit',
      blurb: 'Deep, dark waters. The prettiest lights are bait; truth is the only lamp.',
      intro: { text: 'For Satan himself is transformed into an angel of light.', ref: '2 Cor 11:14' },
      lines: ['It looked so beautiful...', 'I believed the lie.', 'Now I see!', 'The truth set me free.', 'It\'s good to see the light again.'],
      scrolls: [
        { text: 'Flee also youthful lusts: but follow righteousness, faith, charity, peace.', ref: '2 Tim 2:22' },
        { text: 'And ye shall know the truth, and the truth shall make you free.', ref: 'John 8:32' },
        { text: 'Thy word is a lamp unto my feet, and a light unto my path.', ref: 'Ps 119:105' },
      ],
      bossCard: { name: 'THE SERPENT', title: 'The Masked Deceiver', text: 'Now the serpent was more subtil than any beast of the field.', ref: 'Gen 3:1' },
    },
    {
      name: 'Valley of the Shadow', sins: 'Fear, Doubt and Guilt',
      blurb: 'Ash, fog and whispered accusations. Far away, on a hill, a cross.',
      intro: { text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me.', ref: 'Ps 23:4' },
      lines: ['I thought there was no forgiveness for me.', 'The guilt was so heavy...', 'I\'m not afraid anymore.', 'It is finished... I believe!', 'Thank you for coming for me.'],
      scrolls: [
        { text: 'There is no fear in love; but perfect love casteth out fear.', ref: '1 John 4:18' },
        { text: 'But let him ask in faith, nothing wavering.', ref: 'Jas 1:6' },
        { text: 'There is therefore now no condemnation to them which are in Christ Jesus.', ref: 'Rom 8:1' },
      ],
      bossCard: { name: 'THE ACCUSER', title: 'Who accuses day and night', text: 'For the accuser of our brethren is cast down.', ref: 'Rev 12:10' },
    },
  ],
  TUTORIAL_SIGNS: [
    { text: 'Run and jump. Hold JUMP to go higher. Slide down walls and jump again to climb.' },
    { text: 'DASH in any direction, even in midair. Dash + jump on the ground = long jump.' },
    { text: 'SWORD up close, BOW from afar. Aim with the directions. A down attack in the air bounces off enemies.' },
    { text: 'Break the clay jars: they hold Fruit of the Spirit. When hurt, you lose the fruit in use. SWAP switches between your two.' },
    { text: 'PRAISE shakes everything on screen, like at Jericho. Use it wisely. Free the captives and look for the scrolls.' },
  ],
  ACCUSATIONS: ['GUILTY', 'UNWORTHY', 'FAILURE', 'HYPOCRITE', 'UNFORGIVEN', 'USELESS', 'IT\'S OVER', 'DIRTY', 'NOBODY WANTS YOU'],
  CONTROL_LABELS: {
    kb1: { jump: 'J / Space', dash: '; (Ç) / L-Shift', start: 'Esc' },
    kb2: { move: 'Arrows', start: 'Num + / Esc' },
    pad: { move: 'Stick / D-pad' },
  },
};

// Aplica o idioma: guarda uma cópia do português na primeira chamada
let I18N_PT = null;
function i18nTargets() {
  return { CHARACTERS, RANGED, FRUITS, GIFTS, DIFFS, STAGES, ETYPES, PHASES, TUTORIAL_SIGNS, ACCUSATIONS, CONTROL_LABELS };
}
function i18nPick(src, shape) {
  if (Array.isArray(shape)) return shape.map((v, i) => i18nPick(src[i], v));
  if (shape && typeof shape === 'object') { const o = {}; for (const k in shape) o[k] = i18nPick(src[k], shape[k]); return o; }
  return src;
}
function i18nAssign(dst, src) {
  if (Array.isArray(src)) { src.forEach((v, i) => { if (v && typeof v === 'object') i18nAssign(dst[i], v); else dst[i] = v; }); return; }
  for (const k in src) { const v = src[k]; if (v && typeof v === 'object') i18nAssign(dst[k], v); else dst[k] = v; }
}
function applyLang(lang) {
  const tg = i18nTargets();
  if (!I18N_PT) { I18N_PT = {}; for (const k in I18N_EN) I18N_PT[k] = i18nPick(tg[k], I18N_EN[k]); }
  LANG = lang === 'en' ? 'en' : 'pt';
  const layer = LANG === 'en' ? I18N_EN : I18N_PT;
  for (const k in layer) i18nAssign(tg[k], layer[k]);
  try { document.documentElement.lang = LANG === 'en' ? 'en' : 'pt-BR'; } catch (e) { }
}
