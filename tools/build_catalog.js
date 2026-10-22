// Gera dist/catalogo.html: módulos de desenho do jogo + script do catálogo
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), src = path.join(root, 'src');
const files = fs.readdirSync(src).filter(f => /^\d\d_.*\.js$/.test(f)).sort().filter(f => +f.slice(0, 2) <= 10);
const js = files.map(f => `// ---- ${f} ----\n` + fs.readFileSync(path.join(src, f), 'utf8')).join('\n') + '\n// ---- catálogo ----\n' + fs.readFileSync(path.join(__dirname, 'catalog_page.js'), 'utf8');
const shell = fs.readFileSync(path.join(__dirname, 'catalog_shell.html'), 'utf8');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'catalogo.html'), shell.replace('/*__GAME__*/', () => js));
console.log('catálogo ok:', files.length, 'módulos');
