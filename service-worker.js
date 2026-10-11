const CACHE = 'oral-lab-v2.1-network-first';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './content.js',
  './alignment.js',
  './app.js',
  './manifest.webmanifest'
];

self.addEventListener('install', e => {
  // Pula a espera para ativar a versão nova imediatamente
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  // Limpa caches antigos e assume controle dos clientes
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE) {
            console.info('[ServiceWorker] Removendo cache legado:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Estratégia Network-First para assets da própria origem: sempre busca código fresco se online
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return response;
      })
      .catch(() => caches.match(req))
  );
});
