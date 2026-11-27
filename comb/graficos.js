/* COMBUSTIBLE · Gráficos en SVG propio (sin librerías: abre al instante y funciona sin señal). */
var Graf = (function () {
  'use strict';
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n, d) { if (n === null || n === undefined || n === '' || !isFinite(n)) return '—'; n = Number(n); if (Math.abs(n) < Math.pow(10, -(d === undefined ? 1 : d)) / 2) n = 0; return Number(n).toLocaleString('es-PE', { maximumFractionDigits: d === undefined ? 1 : d, minimumFractionDigits: 0 }); }
  function escala(min, max, a, b) { var k = max === min ? 0 : (b - a) / (max - min); return function (v) { return a + (v - min) * k; }; }
  function bonito(max) {
    if (max <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(max))), m = max / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  }
  function fechaCorta(f) { var p = String(f).split('-'); return p.length === 3 ? p[2] + '/' + p[1] : f; }
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function mesCorto(m) { var p = String(m).split('-'); return MESES[Number(p[1]) - 1] + ' ' + String(p[0]).substring(2); }

  /** Área + línea de galones por día con media móvil de 7 días. puntos: [{fecha, galones}] */
  function serieDiaria(puntos, o) {
    o = o || {};
    var W = 640, H = 220, ml = 44, mr = 12, mt = 14, mb = 26;
    if (!puntos.length) return '<p class="vacio">Sin datos en el periodo.</p>';
    var max = bonito(Math.max.apply(null, puntos.map(function (p) { return p.galones; })) * 1.1);
    var x = escala(0, Math.max(1, puntos.length - 1), ml, W - mr), y = escala(0, max, H - mb, mt);
    var linea = puntos.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.galones).toFixed(1); }).join(' ');
    var area = linea + ' L' + x(puntos.length - 1).toFixed(1) + ' ' + (H - mb) + ' L' + ml + ' ' + (H - mb) + ' Z';
    var mm = puntos.map(function (p, i) { var s = puntos.slice(Math.max(0, i - 6), i + 1); return s.reduce(function (a, q) { return a + q.galones; }, 0) / s.length; });
    var lineaMM = mm.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
    var ejes = '';
    for (var k = 0; k <= 4; k++) { var v = max * k / 4; ejes += '<line class="g-rejilla" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="g-eje" x="' + (ml - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + fmt(v, 0) + '</text>'; }
    var paso = Math.max(1, Math.ceil(puntos.length / 7));
    puntos.forEach(function (p, i) { if (i % paso === 0 || i === puntos.length - 1) ejes += '<text class="g-eje" x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + fechaCorta(p.fecha) + '</text>'; });
    var toques = puntos.map(function (p, i) { return '<rect class="g-toque" x="' + (x(i) - (W - ml - mr) / puntos.length / 2) + '" y="' + mt + '" width="' + ((W - ml - mr) / puntos.length) + '" height="' + (H - mt - mb) + '"><title>' + fechaCorta(p.fecha) + ': ' + fmt(p.galones) + ' gal</title></rect>'; }).join('');
    return '<svg class="graf" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.titulo || 'Galones por día') + '">' +
      '<defs><linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--acento)" stop-opacity=".45"/><stop offset="1" stop-color="var(--acento)" stop-opacity="0"/></linearGradient></defs>' +
      ejes + '<path d="' + area + '" fill="url(#gArea)"/><path d="' + linea + '" class="g-linea"/><path d="' + lineaMM + '" class="g-linea-2"/>' + toques + '</svg>' +
      '<div class="leyenda"><span><i class="l-acento"></i>Galones del día</span><span><i class="l-2"></i>Promedio 7 días</span></div>';
  }

  /** Barras por mes con variación contra el mes anterior. meses: [{mes, galones, costo, variacionPct}] */
  function barrasMes(meses, o) {
    o = o || {};
    if (!meses.length) return '<p class="vacio">Sin datos.</p>';
    var W = 640, H = 220, ml = 44, mr = 10, mt = 26, mb = 26;
    var campo = o.campo || 'galones';
    var max = bonito(Math.max.apply(null, meses.map(function (m) { return m[campo]; })) * 1.12);
    var y = escala(0, max, H - mb, mt), ancho = (W - ml - mr) / meses.length;
    var s = '';
    for (var k = 0; k <= 4; k++) { var v = max * k / 4; s += '<line class="g-rejilla" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="g-eje" x="' + (ml - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + fmt(v, 0) + '</text>'; }
    meses.forEach(function (m, i) {
      var bx = ml + i * ancho + ancho * 0.18, bw = ancho * 0.64, by = y(m[campo]);
      s += '<rect class="g-barra" x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + (H - mb - by) + '" rx="5"><title>' + mesCorto(m.mes) + ': ' + fmt(m[campo], 0) + '</title></rect>';
      s += '<text class="g-eje" x="' + (bx + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + mesCorto(m.mes) + '</text>';
      if (m.variacionPct !== null && m.variacionPct !== undefined)
        s += '<text class="g-var ' + (m.variacionPct > 0 ? 'sube' : 'baja') + '" x="' + (bx + bw / 2) + '" y="' + (by - 7) + '" text-anchor="middle">' + (m.variacionPct > 0 ? '▲' : '▼') + fmt(Math.abs(m.variacionPct), 0) + '%</text>';
    });
    return '<svg class="graf" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.titulo || 'Consumo por mes') + '">' + s + '</svg>';
  }

  /**
   * Barras isométricas 3D: altura = galones del periodo, color = estado del equipo.
   * items: [{id, valor, estado}]
   */
  function barras3D(items, o) {
    o = o || {};
    if (!items.length) return '<p class="vacio">Sin datos.</p>';
    var n = items.length, W = 660, H = 300;
    var paso = Math.min(70, (W - 80) / n), lado = paso * 0.62, prof = lado * 0.5;
    var max = Math.max.apply(null, items.map(function (i) { return i.valor; })) || 1;
    var base = H - 58, alto = H - 120;
    var s = '<defs>' + ['NORMAL', 'VIGILAR', 'DESVIO', 'OTRO'].map(function (e) {
      return '<linearGradient id="c3' + e + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="c3-' + e + '-a"/><stop offset="1" class="c3-' + e + '-b"/></linearGradient>';
    }).join('') + '</defs>';
    // piso en perspectiva
    var x0 = 40, x1 = 40 + n * paso + prof;
    s += '<path class="g-piso" d="M' + x0 + ' ' + base + ' L' + (x1 - prof) + ' ' + base + ' L' + x1 + ' ' + (base - prof) + ' L' + (x0 + prof) + ' ' + (base - prof) + ' Z"/>';
    items.forEach(function (it, i) {
      var h = Math.max(3, it.valor / max * alto);
      var x = 40 + i * paso + (paso - lado) / 2, y = base;
      var e = it.estado in { NORMAL: 1, VIGILAR: 1, DESVIO: 1 } ? it.estado : 'OTRO';
      var frente = 'M' + x + ' ' + y + ' L' + (x + lado) + ' ' + y + ' L' + (x + lado) + ' ' + (y - h) + ' L' + x + ' ' + (y - h) + ' Z';
      var lateral = 'M' + (x + lado) + ' ' + y + ' L' + (x + lado + prof) + ' ' + (y - prof) + ' L' + (x + lado + prof) + ' ' + (y - prof - h) + ' L' + (x + lado) + ' ' + (y - h) + ' Z';
      var tapa = 'M' + x + ' ' + (y - h) + ' L' + (x + lado) + ' ' + (y - h) + ' L' + (x + lado + prof) + ' ' + (y - h - prof) + ' L' + (x + prof) + ' ' + (y - h - prof) + ' Z';
      s += '<g class="b3" data-equipo="' + esc(it.id) + '" tabindex="0" role="button" aria-label="' + esc(it.id) + ': ' + fmt(it.valor, 0) + ' galones">' +
        '<title>' + esc(it.id) + ' · ' + fmt(it.valor, 0) + ' gal</title>' +
        '<path d="' + frente + '" fill="url(#c3' + e + ')"/><path class="b3-lado c3-' + e + '-l" d="' + lateral + '"/><path class="b3-tapa c3-' + e + '-t" d="' + tapa + '"/>' +
        '<text class="g-eje b3-val" x="' + (x + lado / 2 + prof / 2) + '" y="' + (y - h - prof - 6) + '" text-anchor="middle">' + fmt(it.valor, 0) + '</text>' +
        '<text class="g-eje b3-id" transform="translate(' + (x + lado / 2) + ' ' + (y + 14) + ') rotate(35)">' + esc(it.id) + '</text></g>';
    });
    return '<svg class="graf graf-3d" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.titulo || 'Galones por equipo') + '">' + s + '</svg>' +
      '<div class="leyenda"><span><i class="l-ok"></i>Normal</span><span><i class="l-vig"></i>Vigilar</span><span><i class="l-des"></i>Desvío</span></div>';
  }

  /** Rendimiento de cada tramo en el tiempo con la banda esperada ± tolerancia. */
  function rendimiento(tramos, o) {
    o = o || {};
    if (tramos.length < 2) return '<p class="vacio">Se necesitan al menos 2 abastecimientos con lectura para calcular el rendimiento.</p>';
    var W = 640, H = 240, ml = 44, mr = 12, mt = 14, mb = 26;
    var vals = tramos.map(function (t) { return t.rend; });
    var esp = o.esperado, tol = (o.tol || 20) / 100;
    var lo = Math.min.apply(null, vals.concat(esp ? [esp * (1 - tol)] : [])), hi = Math.max.apply(null, vals.concat(esp ? [esp * (1 + tol)] : []));
    var pad = (hi - lo) * 0.15 || 1; lo = Math.max(0, lo - pad); hi += pad;
    var x = escala(0, tramos.length - 1, ml, W - mr), y = escala(lo, hi, H - mb, mt);
    var s = '';
    for (var k = 0; k <= 4; k++) { var v = lo + (hi - lo) * k / 4; s += '<line class="g-rejilla" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="g-eje" x="' + (ml - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + fmt(v, 2) + '</text>'; }
    if (esp) {
      var malo = o.odometro ? esp * (1 - tol) : esp * (1 + tol);
      s += '<rect class="g-banda" x="' + ml + '" width="' + (W - ml - mr) + '" y="' + y(esp * (1 + tol)) + '" height="' + (y(esp * (1 - tol)) - y(esp * (1 + tol))) + '"/>';
      s += '<line class="g-esperado" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + y(esp) + '" y2="' + y(esp) + '"/>';
      s += '<line class="g-limite" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + y(malo) + '" y2="' + y(malo) + '"/>';
    }
    var d = tramos.map(function (t, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(t.rend).toFixed(1); }).join(' ');
    s += '<path d="' + d + '" class="g-linea"/>';
    var paso = Math.max(1, Math.ceil(tramos.length / 6));
    tramos.forEach(function (t, i) {
      var cls = t.alerta ? 'g-punto mal' : 'g-punto';
      s += '<circle class="' + cls + '" cx="' + x(i) + '" cy="' + y(t.rend) + '" r="' + (t.alerta ? 5.5 : 3.5) + '" data-despacho="' + esc(t.DespachoID) + '"><title>' + fechaCorta(t.Fecha) + ': ' + fmt(t.rend, 2) + ' ' + esc(o.unidad || '') + (t.desvio !== undefined ? ' (' + (t.desvio > 0 ? '+' : '') + fmt(t.desvio, 0) + '%)' : '') + '</title></circle>';
      if (i % paso === 0 || i === tramos.length - 1) s += '<text class="g-eje" x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + fechaCorta(t.Fecha) + '</text>';
    });
    return '<svg class="graf" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Rendimiento en el tiempo">' + s + '</svg>' +
      '<div class="leyenda"><span><i class="l-acento"></i>' + esc(o.unidad || '') + ' por abastecimiento</span>' + (esp ? '<span><i class="l-esp"></i>Esperado ' + fmt(esp, 2) + '</span><span><i class="l-lim"></i>Límite de desvío</span>' : '') + '<span><i class="l-des"></i>Con alerta</span></div>';
  }

  /** Barra de comparación real vs esperado (bullet). */
  function bala(real, esperado, tolPct, odometro) {
    if (real === null || real === undefined) return '<span class="bala vacia">sin datos</span>';
    if (!esperado) return '<span class="bala-num">' + fmt(real, 2) + '</span>';
    var max = Math.max(real, esperado * (1 + tolPct / 100)) * 1.15;
    var pr = real / max * 100, pe = esperado / max * 100;
    var desv = odometro ? (esperado - real) / esperado * 100 : (real - esperado) / esperado * 100;
    var cls = desv > tolPct ? 'des' : desv > tolPct / 2 ? 'vig' : 'ok';
    return '<span class="bala" title="Real ' + fmt(real, 2) + ' · esperado ' + fmt(esperado, 2) + '"><span class="bala-pista"><span class="bala-real ' + cls + '" style="width:' + pr.toFixed(1) + '%"></span><span class="bala-esp" style="left:' + pe.toFixed(1) + '%"></span></span><span class="bala-num ' + cls + '">' + (desv > 0 ? '+' : '') + fmt(desv, 0) + '%</span></span>';
  }

  /** Medidor circular (gauge) para un porcentaje. */
  function anillo(pct, texto, cls) {
    var p = Math.max(0, Math.min(100, pct || 0)), R = 42, C = 2 * Math.PI * R;
    return '<svg class="anillo ' + (cls || '') + '" viewBox="0 0 100 100" role="img" aria-label="' + esc(texto) + '"><circle class="anillo-pista" cx="50" cy="50" r="' + R + '"/>' +
      '<circle class="anillo-valor" cx="50" cy="50" r="' + R + '" stroke-dasharray="' + (C * p / 100).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 50 50)"/>' +
      '<text x="50" y="55" text-anchor="middle" class="anillo-texto">' + esc(texto) + '</text></svg>';
  }

  /** Mini línea para tablas. */
  function mini(vals, malo) {
    if (!vals || vals.length < 2) return '';
    var W = 90, H = 26, lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var x = escala(0, vals.length - 1, 2, W - 2), y = escala(lo, hi === lo ? lo + 1 : hi, H - 3, 3);
    return '<svg class="mini ' + (malo ? 'mal' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><path d="' + vals.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ') + '"/></svg>';
  }

  return { serieDiaria: serieDiaria, barrasMes: barrasMes, barras3D: barras3D, rendimiento: rendimiento, bala: bala, anillo: anillo, mini: mini, fmt: fmt, esc: esc, fechaCorta: fechaCorta, mesCorto: mesCorto };
})();
