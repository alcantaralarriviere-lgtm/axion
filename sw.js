/* AXION · Service worker: guarda la app en el celular para abrirla sin señal.
 * Los datos NO pasan por aquí (van por la cola de nucleo.js). Cambie VERSION al publicar cambios.
 */
var VERSION = 'axion-v65';   // al publicar, cambiar también VERSION_APP en app.js (debe ser igual)
var ARCHIVOS = ['./', 'index.html', 'styles.css', 'config.js', 'reglas.js', 'nucleo.js', 'camara.js', 'app.js',
  'manifest.webmanifest', 'icono-192.png', 'icono-512.png', 'fondo-movil.webp', 'fondo-movil.jpg', 'excavadora-720.webp',
  'combustible.html', 'comb/estilos.css', 'comb/analisis.js', 'comb/graficos.js', 'comb/app.js', 'comb/plantilla.html'];

self.addEventListener('install', function (e) {
  // 'reload': baja los archivos del servidor (no la copia vieja del navegador) para guardarlos sin señal
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return c.addAll(ARCHIVOS.map(function (u) { return new Request(u, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // la copia guardada primero: la app abre AL INSTANTE aunque la señal sea mala (antes esperaba a la red cada vez).
  // En segundo plano se baja la versión nueva ('no-cache' pregunta al servidor) y queda lista para la próxima vez.
  e.respondWith(caches.open(VERSION).then(function (c) {
    return c.match(e.request, { ignoreSearch: true }).then(function (guardada) {
      var red = fetch(e.request, { cache: 'no-cache' }).then(function (r) {
        if (r && r.ok) c.put(e.request, r.clone());
        return r;
      });
      if (guardada) { e.waitUntil(red.catch(function () {})); return guardada; }
      return red.catch(function () { return c.match('index.html'); });
    });
  }));
});
