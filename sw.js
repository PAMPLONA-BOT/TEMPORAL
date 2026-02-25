const CACHE_NAME = 'pamplona-v10'; // Cambia este número solo cuando hagas cambios grandes
const ASSETS = [
  './',
  'index.html',
  'inicio.html',
  'manifest.json',
  'config.xlsx',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Segoe+UI&display=swap'
];

// 1. Instalación: Guarda todo en el dispositivo
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Instalando archivos en caché...');
        return cache.addAll(ASSETS);
      })
  );
  self.skipWaiting(); // Obliga al nuevo SW a tomar el control
});

// 2. Activación: Borra versiones viejas automáticamente
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Borrando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Interceptación (Fetch): El secreto para que no falle al recargar
self.addEventListener('fetch', (e) => {
  // Solo manejamos peticiones HTTP/HTTPS (evita errores con extensiones)
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // Si está en caché, lo entrega de inmediato (Funciona sin red)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Si no está en caché, intenta buscarlo en internet
      return fetch(e.request).then((networkResponse) => {
        // Opcional: guardar nuevas peticiones en caché dinámicamente
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // Si no hay red Y no está en caché, muestra el index (o página offline)
        if (e.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );

});
