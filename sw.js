/* AXION · Service worker: guarda la app en el celular para abrirla sin señal.
 * Los datos NO pasan por aquí (van por la cola de nucleo.js). Cambie VERSION al publicar cambios.
 */
var VERSION = 'axion-v7';
var ARCHIVOS = ['./', 'index.html', 'styles.css', 'config.js', 'reglas.js', 'nucleo.js', 'app.js',
  'manifest.webmanifest', 'icono-192.png', 'icono-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // red primero (para recibir actualizaciones); sin señal, la copia guardada
  e.respondWith(fetch(e.request).then(function (r) {
    var copia = r.clone();
    caches.open(VERSION).then(function (c) { c.put(e.request, copia); });
    return r;
  }).catch(function () {
    return caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || caches.match('index.html'); });
  }));
});
