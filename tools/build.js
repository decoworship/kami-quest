// Junta os módulos em um único HTML: dist/artifact.html (fragmento) e dist/peregrinos.html (documento completo)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const src = path.join(root, 'src');
const files = fs.readdirSync(src).filter(f => /^\d\d_.*\.js$/.test(f)).sort();
const js = files.map(f => `// ---- ${f} ----\n` + fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
const shell = fs.readFileSync(path.join(src, 'shell.html'), 'utf8');
const frag = shell.replace('/*__GAME__*/', () => js);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'artifact.html'), frag);
const full = `<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${frag.split('<div id="wrap">')[0]}</head>\n<body>\n<div id="wrap">${frag.split('<div id="wrap">')[1]}\n</body>\n</html>\n`;
fs.writeFileSync(path.join(root, 'dist', 'peregrinos.html'), full);
console.log('build ok:', files.length, 'módulos,', (full.length / 1024).toFixed(1), 'KB');
