# Kami Quest — O Caminho Estreito

**Kami** é "Deus" em japonês e **quest** é jornada: o nome resume o jogo, uma jornada em direção a Deus.

Plataforma cooperativa local (1 a 4 jogadores) no espírito de TowerFall Ascension, com power-ups no estilo Contra 3. O jogo é uma metáfora da vida cristã: os peregrinos atravessam terrenos da alma, enfrentam caricaturas sombrias de pecados e tentações, libertam pessoas presas pelo caminho e crescem em **semelhança com Cristo** (Rm 8:29; 2 Co 3:18).

> "Estreita é a porta, e apertado o caminho que conduz para a vida." — Mt 7:14

## Como jogar

Abra `dist/kami-quest.html` num navegador (Chrome, Edge ou Firefox). Não precisa de instalação nem de internet, exceto para as fontes.

### Jogar online, instalar e compartilhar

O jogo é publicado no GitHub Pages: **https://decoworship.github.io/kami-quest/** (catálogo em `/catalogo.html`). Basta mandar o link para os amigos.

- **Ativar (uma vez só):** no GitHub, abra *Settings → Pages* e em *Source* escolha **GitHub Actions**. A partir daí, cada push no `main` publica a versão nova sozinho (`.github/workflows/pages.yml`). Na aba *Actions*, o botão *Run workflow* publica na hora.
- **Instalar como app:** no Chrome ou Edge, abra o link e clique no ícone de instalar na barra de endereço (ou menu ⋮ → *Instalar Kami Quest*). O jogo ganha ícone próprio, abre em tela cheia e funciona sem internet depois da primeira visita. Quando sai versão nova, ela chega sozinha na próxima vez que o jogo abre com internet.
- **Sem internet nenhuma:** mande o arquivo `dist/kami-quest.html`. Ele roda com dois cliques, só com a fonte do sistema no lugar da fonte do jogo.
- **Celular e tablet:** o jogo ainda não tem controles na tela, então precisa de um controle Bluetooth (ou teclado).
- **Cooperativo à distância:** o modo cooperativo é local (todos no mesmo computador). Para jogar com quem está longe, quem hospeda pode usar um programa de jogo remoto como o Parsec, que transmite a tela e recebe os controles dos amigos.

O site é gerado por `node tools/build_web.js` (depois de `build.js` e `build_catalog.js`) na pasta `site/`, com o jogo como `index.html`, o manifesto, os ícones de `tools/web/` e o *service worker* que guarda tudo para jogar offline.

| Ação | Teclado 1 | Teclado 2 | Controle |
|---|---|---|---|
| Mover / mirar (8 direções) | W A S D | Setas | Analógico / D-pad |
| Pular (segure para ir mais alto) | J / Espaço | Num 1 / Z | A |
| Espada / cajado (perto) | K | Num 2 / X | X |
| Arco · besta · funda (longe) | L | Num 3 / C | B |
| Dash (esquiva em 8 direções) | Ç / Shift esq. | Num 0 / V | RB / RT |
| Trocar fruto ativo | U / Q | Num 4 / B | Y |
| Louvor (abala a tela) | I / E | Num 5 / N | LB / LT |
| Pausa | Esc | Num + / Esc | Start |

`M` liga e desliga a música. Para 3 ou 4 jogadores, use controles. Na tela de personagens, cada pessoa aperta PULAR no próprio teclado ou controle para entrar.

### Opções

- **Idioma**: português ou inglês (tela inicial, mapa ou pausa). Na primeira vez, o jogo segue o idioma do navegador. Os versículos em inglês seguem a King James (domínio público).
- **Tamanho dos personagens**: 100%, 120%, 125% (padrão) ou 130%. Vale para jogadores, inimigos e cativos, e a caixa de colisão acompanha a escala. Os chefes mantêm o tamanho.

### Catálogo

`dist/catalogo.html` mostra cada personagem, inimigo, chefe, fruto, dom, elemento, cativo e cenário, desenhados ao vivo pelo próprio código do jogo. Gere de novo com `node tools/build_catalog.js`.

### Movimento

O movimento foi feito para ser fluido: aceleração rápida, salto variável (segurar = mais alto), *coyote time* e *buffer* de pulo, correção de quinas, deslizar e pular nas paredes, queda rápida (segurar para baixo), dash em 8 direções com invulnerabilidade, salto longo (dash no chão + pulo), golpe para baixo que quica em inimigos e espinhos e pisão na cabeça dos inimigos. Como em TowerFall, o mundo dá a volta na vertical: quem cai num buraco reaparece pelo alto.

## A metáfora

### Personagens

Cada personagem tem um nome próprio e uma classe.

| Nome | Classe (inglês) | Armas | Traço | Versículo |
|---|---|---|---|---|
| **Rowan** | Peregrino (Pilgrim) | Espada + Arco | Dash recarrega mais rápido | Hb 11:13 |
| **Garrett** | Guardião (Guardian) | Espada + Besta (virotes perfurantes) | +1 coração, recua menos | Is 62:6 |
| **Wesley** | Pastor (Shepherd) | Cajado (golpe amplo) + Funda (pedras que quicam) | Salta mais alto | 1 Pe 5:2 |
| **Lucy** | Vigia (Watcher) | Espada + Arco Leve (rápido) | Lâmpada: mais luz, revela paredes falsas | Mt 25:13 |

### Fases, pecados e chefes

| Fase | Cenário | Inimigos | Chefe | Cativos presos em |
|---|---|---|---|---|
| 1. Vale da Comodidade | Morros lilás enevoados, lua sonolenta | Lesma da Preguiça (deixa rastro que deixa lento), Olho da Distração (tela flutuante), Poltrona do Comodismo | **Preguiça**, de touca de dormir: bocejos que viram ondas, travesseiros, rola pela arena e ronca | Casulos de sono (Ef 5:14) |
| 2. Feira das Vaidades | Cidade azul de noite, com torres e bandeirolas; muros de ouro | Caranguejo da Avareza (investida), Balão da Soberba (incha e estoura), Pavão da Vaidade (cauda de espelhos rebate tiros) | **Soberba**, o Rei Inchado: cresce conforme apanha, coroa bumerangue, chuva de moedas, queda que faz tremer | Gaiolas de ouro (Mc 8:36) |
| 3. Cavernas da Ira | Basalto, brasas e raízes amargas | Brasa da Ira (investida em fogo), Língua Ferina (Tg 3:6), Raiz de Amargura (Hb 12:15) | **Ira**, a Fera de Brasa: investidas que derrubam pedras, sopro de fogo, saltos com onda de choque | Correntes em brasa |
| 4. Abismo das Ilusões | Escuridão profunda; só se vê o que a luz alcança | Serpente do Engano, Isca Sedutora (luz bonita que esconde a boca), Máscara da Mentira (sorri e depois ataca) | **A Serpente** de máscara dourada (2 Co 11:14): serpenteia, cospe veneno, mergulha atravessando a tela; a máscara se quebra | Bolhas de ilusão |
| 5. Vale da Sombra | Penhascos e ruínas cor de cinza, sol baixo atrás da névoa; uma cruz num monte ao longe | Corrente da Culpa, Sombra do Medo (avança quando você dá as costas; encare-a), Névoa da Dúvida (some e reaparece) | **O Acusador** (Ap 12:10): palavras de acusação, correntes que brotam do chão, o pergaminho de dívidas varrendo a arena | Sombras e correntes |

Cada fase tem salas próprias (sete por fase, contando a arena e o chefe), então nenhum trecho se repete entre as fases.

Ao vencer o Acusador, o escrito de dívida é cravado na cruz (Cl 2:14), o céu amanhece e aparece "Está consumado" (Jo 19:30).

### Frutos do Espírito (power-ups temporários, Gl 5:22-23)

Os frutos vêm em **vasos de barro** (2 Co 4:7): parados no cenário ou voando com asas pela tela, como as cápsulas de Contra. Quebre o vaso e pegue o fruto. Cada jogador carrega **dois frutos**, alterna com TROCAR e **perde o fruto ativo ao levar dano**, como em Contra 3.

| Fruto | Efeito |
|---|---|
| Amor | Leque de cinco projéteis (1 Pe 4:8) |
| Alegria | Rajada: disparos muito mais rápidos (Ne 8:10) |
| Paz | Escudo que absorve um golpe (Fp 4:7) |
| Longanimidade | Sementes de luz que se fixam e explodem depois de um tempo (Tg 5:7) |
| Benignidade | Aura que cura você e aliados próximos (Ef 4:32) |
| Bondade | Lança de luz que atravessa inimigos (Mt 5:16) |
| Fidelidade | Projéteis teleguiados (Lm 3:23) |
| Mansidão | A espada rebate projéteis inimigos (Pv 15:1) |
| Domínio Próprio | O dash fere inimigos e quebra muralhas (Pv 16:32) |

### Dons espirituais (permanentes, 1 Co 12)

Recebidos ao vencer cada chefe pela primeira vez:

1. **Dom da Fé** — Passo de Fé: salto duplo (Mt 14:29).
2. **Dom de Curar** — +1 coração máximo e reviver aliados instantaneamente (Mt 10:8).
3. **Palavra da Sabedoria** — Espada da Palavra: golpes maiores e mais fortes (Hb 4:12).
4. **Discernimento** — revela paredes falsas e frágeis e amplia a luz no escuro (1 Jo 4:1).

O **Louvor** é a "bomba" de tela: como em Jericó (Js 6) e com Paulo e Silas (At 16:25-26), fere todos os inimigos visíveis, apaga os projéteis e derruba muralhas frágeis. Shofares recarregam.

### Colecionáveis e a jornada

- **Pergaminhos**: três por fase, escondidos (atrás de muralhas frágeis, paredes falsas, lugares altos, e um que flutua no alto do abismo, ao alcance de quem se joga no buraco). Cada um mostra um versículo e fica guardado no **Livro dos Pergaminhos**.
- **Cativos**: seis por fase, presos pelo pecado daquela fase. Golpeie as amarras para libertá-los. Ao vencer o chefe, mais cinco são libertos.
- **Ebenézer** ("Até aqui nos ajudou o SENHOR", 1 Sm 7:12): pilhas de pedras que servem de ponto de retorno, curam e levantam aliados caídos.
- **Semelhança com Cristo**: de 0% a 100%. Cada fase vale 20% (chefe 4%, pergaminhos 9%, cativos 7%). Os estágios são Semente, Broto, Ramo, Árvore, Fruto Maduro e À Imagem de Cristo. O final muda conforme a porcentagem e lembra que o crescimento é obra da graça (Ef 2:8; Fp 1:6).
- **Cooperação**: quem cai vira uma luz; um aliado encosta nela para levantá-lo (Gl 6:2). Se todos caírem, voltam ao último Ebenézer ("Ainda que eu caia, me levantarei", Mq 7:8).

### Dificuldades

| Nível | Para quem | Diferença |
|---|---|---|
| **Leite** (1 Co 3:2) | Fácil | 5 corações, inimigos mais fracos e lentos, mais itens |
| **Pão** (Jo 6:35) | Normal | 3 corações |
| **Alimento Sólido** (Hb 5:14) | Difícil | 2 corações, inimigos mais fortes e rápidos, mais inimigos por onda |

Inimigos das arenas e a vida dos chefes também crescem com o número de jogadores.

## Estrutura do código

Tudo é JavaScript puro em canvas, sem dependências. A arte é desenhada por código (pixel art), e os cenários têm quatro camadas de paralaxe com perspectiva atmosférica e a música é sintetizada na hora, incluindo versões chiptune de hinos em domínio público (Doxologia/Old Hundredth, 1551, e Amazing Grace/New Britain, 1829).

```
src/
  00_core.js      constantes, desenho em pixel, texto, salvamento
  01_input.js     teclado (2 jogadores) e controles (4)
  02_audio.js     efeitos e músicas
  03_data.js      personagens, frutos, dons, dificuldades, fases, versículos
  03_i18n.js      textos da interface e camada em inglês dos dados
  04_rooms.js     salas desenhadas em texto (40 x 22 tiles)
  05_level.js     montagem das fases, colisão, cache dos tiles
  06_entities.js  projéteis, itens, vasos, cativos, Ebenézer, molas
  07_player.js    jogador (física, espada, arma, frutos)
  08_enemies.js   inimigos (comportamentos e desenhos)
  09_bosses.js    os cinco chefes
  10_render.js    cenários em paralaxe, escuridão, névoa, HUD
  11_play.js      a cena de jogo (câmera, arenas, eventos)
  12_scenes.js    título, personagens, dificuldade, mapa, resumo, final
  13_main.js      laço principal
  shell.html      página base
tools/
  build.js        gera dist/kami-quest.html (arquivo único)
  build_catalog.js gera dist/catalogo.html (catálogo visual)
  build_web.js    gera site/ para o GitHub Pages (app instalável, offline)
  web/            ícones e service worker do site
  check_rooms.js  valida as salas
  reach.js        verifica se itens e saídas são alcançáveis
```

Para gerar o jogo depois de editar: `node tools/build.js`.

### Editando salas

Cada sala é uma grade de texto em `src/04_rooms.js`. Legenda: `#` sólido, `=` plataforma vazada, `^` espinhos, `%` muralha frágil, `&` parede falsa, `S` início, `E` Ebenézer, `C` cativo, `P` pergaminho, `J` vaso de barro, `H` maná (coração), `T` shofar, `B` fonte (mola), `1` `2` `3` inimigos da fase, `*` portal das ondas. A ordem das salas de cada fase fica em `PHASES[i].rooms` (`:m` espelha a sala). Os versículos dos pergaminhos ficam em `PHASES[i].scrolls`; troque o texto pela tradução que preferir.
