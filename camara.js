/* AXION · Cámara inteligente para el parte de papel.
 * Abre la cámara dentro de la app con un marco. Revisa ~6 veces por segundo, sobre una copia diminuta de la imagen
 * (barato incluso en celulares de gama baja): 1) que el papel llene el marco, 2) que haya luz, 3) que el celular
 * esté quieto y 4) que la letra esté enfocada. Si todo se cumple casi 1 segundo seguido, toma la foto sola y la
 * recorta al marco. También se puede tomar a mano. Si el navegador no deja usar la cámara, la app usa la del celular.
 *
 * Camara.abrir({ titulo }) → Promise<Blob | null>  (null: canceló; error codigo 'NATIVA': usar la cámara del celular)
 */
(function () {
  'use strict';
  var ANCHO_A = 96, ALTO_A = 136;          // tamaño de la copia que se analiza (proporción A4)
  var TICK = 160;                           // ms entre análisis
  var NECESARIOS = 4;                       // análisis buenos seguidos para disparar (~0,65 s)

  function disponible() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.isSecureContext !== false);
  }
  function err(msg, codigo) { var e = new Error(msg); e.codigo = codigo; return e; }
  function guardado(k, def) { try { var v = localStorage.getItem(k); return v === null ? def : v === '1'; } catch (e) { return def; } }
  function guardar(k, v) { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) { /* nada */ } }

  function abrir(op) {
    op = op || {};
    if (!disponible()) return Promise.reject(err('Cámara no disponible', 'NATIVA'));
    var ligero = document.documentElement.classList.contains('ligero');
    var pedido = { audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: ligero ? 1600 : 1920 }, height: { ideal: ligero ? 1200 : 1080 } } };
    return navigator.mediaDevices.getUserMedia(pedido).catch(function () {
      return navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'environment' } });
    }).then(function (flujo) { return sesion(flujo, op); }, function () {
      throw err('No se pudo abrir la cámara', 'NATIVA');
    });
  }

  function sesion(flujo, op) {
    return new Promise(function (resolver) {
      var pista = flujo.getVideoTracks()[0];
      var auto = guardado('axion_cam_auto', true);
      var raiz = document.createElement('div');
      raiz.className = 'cam';
      raiz.setAttribute('role', 'dialog');
      raiz.setAttribute('aria-modal', 'true');
      raiz.setAttribute('aria-label', op.titulo || 'Foto del parte');
      raiz.innerHTML =
        '<video class="cam-video" playsinline muted autoplay></video>' +
        '<div class="cam-guia" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
        '<div class="cam-arriba"><b>' + (op.titulo || 'Foto del parte') + '</b><span class="cam-pista" aria-live="polite">Abriendo la cámara…</span></div>' +
        '<div class="cam-flash" aria-hidden="true"></div>' +
        '<div class="cam-abajo">' +
          '<button type="button" class="cam-btn" data-c="cerrar" aria-label="Cerrar la cámara"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
          '<button type="button" class="cam-disparo" data-c="foto" aria-label="Tomar la foto ahora"><span></span></button>' +
          '<button type="button" class="cam-btn" data-c="luz" aria-label="Encender la linterna" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6l-1 7h4l-8 13 2-9H8z"/></svg></button>' +
        '</div>' +
        '<div class="cam-opciones"><button type="button" class="cam-auto" data-c="auto" aria-pressed="' + auto + '"></button>' +
        '<button type="button" class="cam-nativa" data-c="nativa">Usar la cámara del celular</button></div>';
      document.body.appendChild(raiz);
      document.body.classList.add('cam-abierta');
      var video = raiz.querySelector('video'), guia = raiz.querySelector('.cam-guia'), pistaTxt = raiz.querySelector('.cam-pista'),
          anillo = raiz.querySelector('.cam-disparo'), btnAuto = raiz.querySelector('.cam-auto'), btnLuz = raiz.querySelector('[data-c="luz"]');
      var c = document.createElement('canvas'); c.width = ANCHO_A; c.height = ALTO_A;
      var g = c.getContext('2d', { willReadFrequently: true });
      var anterior = null, buenos = 0, maxNit = 0, reloj = 0, inicio = Date.now(), terminado = false, luz = false;

      function textoAuto() { btnAuto.textContent = auto ? 'Foto automática: SÍ' : 'Foto automática: NO'; btnAuto.setAttribute('aria-pressed', String(auto)); }
      textoAuto();
      // enfoque continuo y linterna, si la cámara los tiene
      try {
        var cap = pista.getCapabilities ? pista.getCapabilities() : {};
        if (cap.focusMode && cap.focusMode.indexOf('continuous') >= 0) pista.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(function () {});
        if (cap.torch) btnLuz.hidden = false;
      } catch (e) { /* nada */ }

      video.srcObject = flujo;
      video.play().catch(function () {});

      function fin(valor) {
        if (terminado) return;
        terminado = true;
        clearTimeout(reloj);
        flujo.getTracks().forEach(function (t) { t.stop(); });
        window.removeEventListener('hashchange', alNavegar);
        document.removeEventListener('keydown', alTecla);
        document.body.classList.remove('cam-abierta');
        raiz.remove();
        resolver(valor);
      }
      function alNavegar() { fin(null); }
      function alTecla(e) { if (e.key === 'Escape') fin(null); }
      window.addEventListener('hashchange', alNavegar);
      document.addEventListener('keydown', alTecla);

      // rectángulo del marco en coordenadas del video (el video se muestra recortado para llenar la pantalla)
      function marcoEnVideo(margen) {
        var vw = video.videoWidth, vh = video.videoHeight;
        var r = guia.getBoundingClientRect(), e = video.getBoundingClientRect();
        var k = Math.max(e.width / vw, e.height / vh);
        var ox = (e.width - vw * k) / 2, oy = (e.height - vh * k) / 2;
        var mx = r.width * (margen || 0), my = r.height * (margen || 0);
        var x = (r.left - e.left - ox - mx) / k, y = (r.top - e.top - oy - my) / k;
        var w = (r.width + 2 * mx) / k, h = (r.height + 2 * my) / k;
        x = Math.max(0, x); y = Math.max(0, y);
        return { x: x, y: y, w: Math.min(w, vw - x), h: Math.min(h, vh - y) };
      }

      function analizar() {
        if (terminado) return;
        reloj = setTimeout(analizar, TICK);
        if (!video.videoWidth || document.hidden) return;
        var m = marcoEnVideo(0);
        g.drawImage(video, m.x, m.y, m.w, m.h, 0, 0, ANCHO_A, ALTO_A);
        var d = g.getImageData(0, 0, ANCHO_A, ALTO_A).data, n = ANCHO_A * ALTO_A;
        var lum = new Uint8Array(n), hist = new Uint32Array(256), i, j;
        for (i = 0, j = 0; i < n; i++, j += 4) { var l = (d[j] * 77 + d[j + 1] * 150 + d[j + 2] * 29) >> 8; lum[i] = l; hist[l]++; }
        // brillo del papel (percentil 90) y cuánto del marco es papel (claro)
        var acum = 0, p90 = 0;
        for (i = 0; i < 256; i++) { acum += hist[i]; if (acum >= n * 0.9) { p90 = i; break; } }
        var umbral = p90 * 0.55, claros = 0;
        for (i = 0; i < 256; i++) if (i > umbral) claros += hist[i];
        var cobertura = claros / n;
        // nitidez: varianza del laplaciano (bordes de la letra)
        var s = 0, s2 = 0, cnt = 0;
        for (var y = 1; y < ALTO_A - 1; y++) {
          for (var x = 1; x < ANCHO_A - 1; x++) {
            var p = y * ANCHO_A + x;
            var lap = 4 * lum[p] - lum[p - 1] - lum[p + 1] - lum[p - ANCHO_A] - lum[p + ANCHO_A];
            s += lap; s2 += lap * lap; cnt++;
          }
        }
        var nit = s2 / cnt - (s / cnt) * (s / cnt);
        maxNit = Math.max(nit, maxNit * 0.985);
        // movimiento: diferencia media con el análisis anterior
        var mov = 0;
        if (anterior) { var sd = 0; for (i = 0; i < n; i += 3) sd += Math.abs(lum[i] - anterior[i]); mov = sd / (n / 3); } else mov = 99;
        anterior = lum;

        var pista2, ok = false;
        if (p90 < 70) pista2 = 'Falta luz: acérquese a una luz' + (btnLuz.hidden ? '' : ' o encienda la linterna');
        else if (cobertura < 0.78) pista2 = 'Acerque el parte hasta que llene el marco';
        else if (mov > 6) pista2 = 'Mantenga el celular quieto';
        else if (nit < 40 || nit < maxNit * 0.8) pista2 = 'Enfocando…';
        else { ok = true; pista2 = auto ? '¡Quieto! Tomando la foto…' : 'Listo: toque el botón para tomar la foto'; }
        if (Date.now() - inicio < 900 && ok) { ok = false; pista2 = 'Enfocando…'; }  // la cámara recién abrió
        buenos = ok ? buenos + 1 : 0;
        raiz.dataset.medida = 'luz ' + p90 + ' · papel ' + Math.round(cobertura * 100) + '% · mov ' + mov.toFixed(1) + ' · nitidez ' + Math.round(nit) + '/' + Math.round(maxNit);  // diagnóstico
        raiz.classList.toggle('cam-ok', ok);
        raiz.classList.toggle('cam-casi', !ok && cobertura >= 0.78 && p90 >= 70);
        if (pistaTxt.textContent !== pista2) pistaTxt.textContent = pista2;
        anillo.style.setProperty('--avance', auto ? String(Math.min(1, buenos / NECESARIOS)) : '0');
        if (auto && buenos >= NECESARIOS) disparar();
      }

      function disparar() {
        if (terminado || !video.videoWidth) return;
        clearTimeout(reloj);
        // recorta al marco con un pequeño margen y guarda en buena calidad (luego la app la achica y le pone el sello)
        var m = marcoEnVideo(0.04);
        var lado = Math.max(m.w, m.h), k = Math.min(1, 2400 / lado);
        var f = document.createElement('canvas');
        f.width = Math.round(m.w * k); f.height = Math.round(m.h * k);
        f.getContext('2d').drawImage(video, m.x, m.y, m.w, m.h, 0, 0, f.width, f.height);
        raiz.classList.add('cam-disparo-ok');
        try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) { /* nada */ }
        f.toBlob(function (b) { setTimeout(function () { fin(b); }, 180); }, 'image/jpeg', 0.92);
      }

      raiz.addEventListener('click', function (e) {
        var b = e.target.closest('[data-c]');
        if (!b) return;
        var a = b.dataset.c;
        if (a === 'cerrar') fin(null);
        else if (a === 'foto') disparar();
        else if (a === 'auto') { auto = !auto; guardar('axion_cam_auto', auto); textoAuto(); buenos = 0; }
        else if (a === 'nativa') fin('NATIVA');
        else if (a === 'luz') {
          luz = !luz;
          pista.applyConstraints({ advanced: [{ torch: luz }] }).catch(function () { luz = false; });
          b.setAttribute('aria-pressed', String(luz));
          b.setAttribute('aria-label', luz ? 'Apagar la linterna' : 'Encender la linterna');
        }
      });
      video.addEventListener('loadedmetadata', function () { pistaTxt.textContent = 'Encuadre el parte dentro del marco'; });
      reloj = setTimeout(analizar, 400);
      raiz.querySelector('.cam-disparo').focus();
    });
  }

  window.Camara = { abrir: abrir, disponible: disponible };
})();
