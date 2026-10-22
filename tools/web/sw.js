// Service worker do Kami Quest: guarda o jogo e as fontes para jogar sem internet
const CACHE = 'kami-quest-__VERSION__';
const CORE = __CORE__;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('kami-quest-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Responde do cache na hora e atualiza em segundo plano (as fontes do Google entram no cache na primeira visita)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: e.request.mode === 'navigate' });
    const net = fetch(e.request)
      .then(res => { if (res.ok || res.type === 'opaque') c.put(e.request, res.clone()); return res; })
      .catch(() => hit || Response.error());
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net;
  }));
});
