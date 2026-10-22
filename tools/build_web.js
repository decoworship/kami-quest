// Gera site/ para o GitHub Pages: o jogo como app instalável (PWA) que funciona offline
// Rode depois de tools/build.js e tools/build_catalog.js.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist'), web = path.join(__dirname, 'web'), out = path.join(root, 'site');

let game = fs.readFileSync(path.join(dist, 'kami-quest.html'), 'utf8');
const head = [
  '<link rel="manifest" href="manifest.webmanifest">',
  '<link rel="icon" type="image/png" href="icon-192.png">',
  '<link rel="apple-touch-icon" href="icon-192.png">',
  '<meta name="theme-color" content="#14122a">',
].join('\n');
const sw = "<script>if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));</script>";
game = game.replace('</head>', () => head + '\n</head>').replace('</body>', () => sw + '\n</body>');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), game);
fs.copyFileSync(path.join(dist, 'catalogo.html'), path.join(out, 'catalogo.html'));
const icons = ['icon-192.png', 'icon-512.png'];
for (const f of icons) fs.copyFileSync(path.join(web, f), path.join(out, f));

const manifest = {
  name: 'Kami Quest — O Caminho Estreito',
  short_name: 'Kami Quest',
  description: 'Plataforma cooperativa cristã para 1 a 4 jogadores.',
  lang: 'pt-BR',
  start_url: './',
  scope: './',
  display: 'fullscreen',
  orientation: 'landscape',
  background_color: '#07060b',
  theme_color: '#14122a',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
fs.writeFileSync(path.join(out, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));

// O nome do cache muda a cada versão do jogo, então quem já instalou recebe a atualização
const version = crypto.createHash('sha1').update(game).digest('hex').slice(0, 10);
const core = ['./', 'index.html', 'catalogo.html', 'manifest.webmanifest', ...icons];
const worker = fs.readFileSync(path.join(web, 'sw.js'), 'utf8')
  .replace('__VERSION__', version)
  .replace('__CORE__', JSON.stringify(core));
fs.writeFileSync(path.join(out, 'sw.js'), worker);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('site ok:', fs.readdirSync(out).length, 'arquivos, versão', version);
