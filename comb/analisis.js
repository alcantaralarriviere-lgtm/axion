/* COMBUSTIBLE · Motor de análisis (el mismo archivo corre en el celular y en el servidor: backend/Analisis.gs es una copia).
 *
 * Método "lleno a lleno": cada abastecimiento repone lo que el equipo consumió desde el abastecimiento anterior.
 *   - Equipos con HORÓMETRO: rendimiento = galones / horas trabajadas  (gal/h, más alto = consume más)
 *   - Equipos con ODÓMETRO:  rendimiento = km recorridos / galones      (km/gal, más bajo = consume más)
 * Con eso se calcula consumo, costo, exceso frente a lo esperado, tendencia en el tiempo y desvíos.
 */
var Analisis = (function () {
  'use strict';

  var SEV = { ALTA: 3, MEDIA: 2, BAJA: 1 };
  var TEXTOS = {
    LECTURA_RETROCEDE: 'El horómetro/kilometraje es menor o igual al anterior',
    SALTO_LECTURA: 'Más horas de motor que el tiempo transcurrido',
    SOBRE_TANQUE: 'Se despachó más que la capacidad del tanque',
    CONSUMO_ALTO: 'Consumo por encima de lo esperado',
    CONSUMO_ATIPICO: 'Consumo fuera de su propio historial',
    CONSUMO_BAJO: 'Consumo muy bajo (posible lectura mal anotada o tanque no llenado)',
    SIN_LECTURA: 'Despacho sin horómetro ni kilometraje',
    EQUIPO_DESCONOCIDO: 'Equipo que no está en el catálogo',
    DIFERENCIA_CONTOMETRO: 'Lo despachado no cuadra con el contómetro de la cisterna',
    DIFERENCIA_TOTAL: 'La suma de la hoja no cuadra con el total escrito',
    DIFERENCIA_SALIDA: 'La suma de la hoja no cuadra con la SALIDA anotada',
    SALDO_NO_CUADRA: 'Previo + ingreso − salida no da el saldo anotado',
    CONTOMETRO_DISCONTINUO: 'El contómetro no continúa desde la hoja anterior',
    STOCK_DISCONTINUO: 'El stock previo no coincide con el saldo de la hoja anterior',
    NUMERO_SALTADO: 'Faltan hojas en la numeración',
    TIPO_EQUIPO: 'El tipo de equipo escrito no coincide con el catálogo',
    TRANSFERENCIA_NO_CUADRA: 'El contómetro después de la transferencia no cuadra',
    CARGA_REPETIDA: 'Dos abastecimientos muy seguidos del mismo equipo'
  };

  function num(v) {
    if (v === null || v === undefined || v === '') return null;
    var n = typeof v === 'number' ? v : Number(String(v).replace(/\s/g, '').replace(',', '.'));
    return isFinite(n) ? n : null;
  }
  function r(n, d) { if (n === null || !isFinite(n)) return null; var f = Math.pow(10, d === undefined ? 2 : d); return Math.round(n * f) / f; }
  function msDe(fecha, hora) {
    if (!fecha) return null;
    var h = /^\d{1,2}:\d{2}$/.test(String(hora || '')) ? String(hora) : '12:00';
    if (h.length === 4) h = '0' + h;
    var t = Date.parse(String(fecha).substring(0, 10) + 'T' + h + ':00-05:00');
    return isFinite(t) ? t : null;
  }
  function mediana(a) {
    if (!a.length) return null;
    var s = a.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function mad(a, med) { return mediana(a.map(function (x) { return Math.abs(x - med); })); }
  /** Pendiente de la recta (mínimos cuadrados) de y en función del índice. */
  function pendiente(ys) {
    var n = ys.length; if (n < 3) return 0;
    var sx = 0, sy = 0, sxy = 0, sxx = 0;
    for (var i = 0; i < n; i++) { sx += i; sy += ys[i]; sxy += i * ys[i]; sxx += i * i; }
    var d = n * sxx - sx * sx;
    return d ? (n * sxy - sx * sy) / d : 0;
  }

  // ------------------------------------------------------------ emparejar texto escrito a mano con el catálogo
  function norm(s) {
    return String(s || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[OQ]/g, '0').replace(/[IL|]/g, '1').replace(/S/g, '5').replace(/B/g, '8').replace(/Z/g, '2')
      .replace(/[^A-Z0-9]/g, '');
  }
  function lev(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    // distancia con transposición (dos caracteres vecinos cambiados de lugar cuentan como 1 error: "020" ~ "002")
    var d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 0; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[m][n];
  }
  /**
   * Busca el equipo del catálogo que mejor coincide con lo escrito (código, placa o alias),
   * tolerando confusiones típicas de letra a mano (O/0, I/1, S/5, B/8, Z/2) y guiones o espacios.
   * Devuelve { equipo, puntaje 0–1, alternativas[] }.
   */
  function emparejarEquipo(texto, equipos) {
    var t = norm(texto);
    if (!t) return { equipo: null, puntaje: 0, alternativas: [] };
    var res = [];
    (equipos || []).forEach(function (e) {
      var claves = [e.EquipoID, e.Placa].concat(String(e.Alias || '').split(/[,;]/));
      var mejor = 0;
      claves.forEach(function (k) {
        var kn = norm(k); if (!kn) return;
        var p;
        if (kn === t) p = 1;
        else {
          var d = lev(t, kn);
          p = 1 - d / Math.max(t.length, kn.length);
          // solo los dígitos (p. ej. "EXC 03" ~ "EX-03")
          var dt = t.replace(/\D/g, ''), dk = kn.replace(/\D/g, '');
          if (dt && dt === dk && t.charAt(0) === kn.charAt(0)) p = Math.max(p, 0.85);
          if (kn.indexOf(t) >= 0 || t.indexOf(kn) >= 0) p = Math.max(p, 0.8);
        }
        if (p > mejor) mejor = p;
      });
      if (mejor >= 0.5) res.push({ equipo: e, puntaje: r(mejor, 2) });
    });
    res.sort(function (a, b) { return b.puntaje - a.puntaje; });
    var top = res[0];
    var ambiguo = top && res[1] && top.puntaje - res[1].puntaje < 0.1 && top.puntaje < 1;
    return { equipo: top && top.puntaje >= 0.7 && !ambiguo ? top.equipo : null, puntaje: top ? top.puntaje : 0,
      ambiguo: !!ambiguo, alternativas: res.slice(0, 4).map(function (x) { return { EquipoID: x.equipo.EquipoID, puntaje: x.puntaje }; }) };
  }

  /**
   * Revisa si una lectura de horómetro es coherente con la anterior del equipo y sugiere la corrección
   * más probable cuando parece un dígito mal leído (p. ej. 5230 → 5320, o 1 confundido con 7).
   */
  function revisarLectura(valor, anterior, horasMax) {
    var v = num(valor), a = num(anterior);
    if (v === null || a === null) return { ok: true };
    var d = v - a;
    if (d > 0 && d <= horasMax) return { ok: true, delta: r(d, 1) };
    var s = String(v).replace('.', ','), cand = [];
    // dígitos que se confunden a mano (medido con hojas reales: un "2" leído como "3" en el horómetro)
    var conf = { '1': '74', '7': '12', '0': '68', '6': '058', '3': '825', '8': '3069', '5': '639', '4': '91', '9': '478', '2': '731' };
    var digs = String(v).split('');
    digs.forEach(function (ch, i) {
      String(conf[ch] || '').split('').forEach(function (alt) { var x = digs.slice(); x[i] = alt; cand.push(Number(x.join(''))); });
      if (i < digs.length - 1 && digs[i + 1] !== '.' && ch !== '.') { var y = digs.slice(); y[i] = digs[i + 1]; y[i + 1] = ch; cand.push(Number(y.join(''))); }
    });
    var buenas = cand.filter(function (c) { return isFinite(c) && c - a > 0 && c - a <= horasMax; })
      .sort(function (p, q) { return (p - a) - (q - a); });
    return { ok: false, delta: r(d, 1), sugerencia: buenas.length ? buenas[0] : null, texto: s };
  }

  function alerta(tipo, sev, extra) {
    var o = { tipo: tipo, severidad: sev, texto: TEXTOS[tipo] || tipo };
    for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) o[k] = extra[k];
    return o;
  }

  // ------------------------------------------------------------ análisis por equipo
  /**
   * despachos: [{DespachoID, HojaID, EquipoID, Fecha, Hora, Horometro, Odometro, Galones}]
   * equipos:   [{EquipoID, Descripcion, Medidor: HOROMETRO|ODOMETRO, CapacidadTanque, ConsumoEsperado}]
   * cfg:       {PRECIO_GALON, TOL_DESVIO_PCT, Z_DESVIO}
   */
  function analizar(despachos, equipos, cfg) {
    cfg = cfg || {};
    var precio = num(cfg.PRECIO_GALON) || 0;
    var tol = (num(cfg.TOL_DESVIO_PCT) || 20) / 100;
    var zMax = num(cfg.Z_DESVIO) || 3;
    var idxEq = {};
    (equipos || []).forEach(function (e) { idxEq[e.EquipoID] = e; });

    var porEq = {};
    (despachos || []).forEach(function (d) {
      var k = d.EquipoID || '¿' + (d.EquipoTexto || 'SIN CÓDIGO') + '?';
      (porEq[k] = porEq[k] || []).push(d);
    });

    var resultado = { equipos: {}, alertas: [], porDespacho: {} };
    Object.keys(porEq).forEach(function (k) {
      var eq = idxEq[k];
      var lista = porEq[k].map(function (d) {
        return { d: d, t: msDe(d.Fecha, d.Hora), h: num(d.Horometro), km: num(d.Odometro), gal: num(d.Galones) || 0 };
      });
      var odo = eq ? String(eq.Medidor).toUpperCase() === 'ODOMETRO' : lista.some(function (x) { return x.km !== null && x.h === null; });
      lista.sort(function (a, b) {
        var la = odo ? a.km : a.h, lb = odo ? b.km : b.h;
        if (a.t !== null && b.t !== null && a.t !== b.t) return a.t - b.t;
        return (la || 0) - (lb || 0);
      });
      var esperado = eq ? num(eq.ConsumoEsperado) : null;
      var cap = eq ? num(eq.CapacidadTanque) : null;
      var tramos = [], galTot = 0, uso = 0, galTramos = 0, galEspTot = 0, ant = null, galArrastre = 0;

      lista.forEach(function (x) {
        var al = [];
        galTot += x.gal;
        var lect = odo ? x.km : x.h;
        if (!eq) al.push(alerta('EQUIPO_DESCONOCIDO', 'MEDIA', { escrito: x.d.EquipoTexto }));
        if (cap && x.gal > cap * 1.05) al.push(alerta('SOBRE_TANQUE', 'ALTA', { valor: x.gal, limite: cap }));
        if (lect === null) al.push(alerta('SIN_LECTURA', 'MEDIA'));
        var tramo = null, descartar = false;
        if (ant && lect !== null && ant.lect !== null) {
          var delta = lect - ant.lect;
          var horasReloj = x.t !== null && ant.t !== null ? (x.t - ant.t) / 3600000 : null;
          var galTramo = x.gal + galArrastre;
          if (delta <= 0) {
            // lectura mal anotada: no se usa como referencia y sus galones pasan al siguiente tramo
            var rev = odo ? { ok: false } : revisarLectura(lect, ant.lect, Math.max(24, (horasReloj || 24) * 1.05));
            al.push(alerta('LECTURA_RETROCEDE', 'ALTA', { valor: lect, anterior: ant.lect, sugerencia: rev.sugerencia || null }));
            descartar = true; galArrastre += x.gal;
          } else if (!odo && horasReloj !== null && horasReloj >= 0 && delta > horasReloj * 1.05 + 1) {
            // físicamente imposible: la lectura está mal anotada; no se usa como referencia
            var rev2 = revisarLectura(lect, ant.lect, horasReloj * 1.05 + 1);
            al.push(alerta('SALTO_LECTURA', 'ALTA', { horas: r(delta, 1), horasReloj: r(horasReloj, 1), valor: lect, anterior: ant.lect, sugerencia: rev2.sugerencia || null }));
            descartar = true; galArrastre += x.gal;
          } else {
            galArrastre = 0;
            var rend = odo ? (galTramo > 0 ? delta / galTramo : null) : galTramo / delta;
            if (horasReloj !== null && horasReloj < 3 && x.gal > 0 && (!cap || x.gal > cap * 0.3))
              al.push(alerta('CARGA_REPETIDA', 'MEDIA', { horasReloj: r(horasReloj, 1) }));
            if (rend !== null) {
              tramo = { DespachoID: x.d.DespachoID, Fecha: x.d.Fecha, Hora: x.d.Hora, uso: r(delta, 1), gal: r(galTramo, 1), rend: r(rend, 3) };
              tramos.push(tramo);
              uso += delta; galTramos += galTramo;
              if (esperado) {
                var galEsp = odo ? delta / esperado : esperado * delta;
                tramo.galEsperado = r(galEsp, 1);
                galEspTot += galEsp;
                var desv = odo ? (esperado - rend) / esperado : (rend - esperado) / esperado;
                tramo.desvio = r(desv * 100, 1);
                if (desv > tol) al.push(alerta('CONSUMO_ALTO', desv > tol * 2 ? 'ALTA' : 'MEDIA',
                  { valor: r(rend, 2), esperado: esperado, pct: r(desv * 100, 0), galExceso: r(galTramo - galEsp, 1) }));
                else if (desv < -Math.max(0.5, tol * 2.5)) al.push(alerta('CONSUMO_BAJO', 'BAJA', { valor: r(rend, 2), esperado: esperado, pct: r(desv * 100, 0) }));
              }
            }
          }
        }
        if (lect !== null && !descartar) ant = { lect: lect, t: x.t };
        al.forEach(function (a) {
          a.DespachoID = x.d.DespachoID; a.HojaID = x.d.HojaID; a.EquipoID = k; a.Fecha = x.d.Fecha;
          resultado.alertas.push(a);
        });
        resultado.porDespacho[x.d.DespachoID] = { alertas: al, tramo: tramo };
      });

      // historial propio: desvío estadístico robusto (no depende del valor esperado configurado)
      var rends = tramos.map(function (t) { return t.rend; });
      var med = mediana(rends), dm = med !== null ? mad(rends, med) : null;
      if (rends.length >= 6 && dm) {
        tramos.forEach(function (t) {
          var z = 0.6745 * (t.rend - med) / dm;
          t.z = r(z, 2);
          var malo = odo ? z < -zMax : z > zMax;
          var pd = resultado.porDespacho[t.DespachoID];
          if (malo && !pd.alertas.some(function (a) { return a.tipo === 'CONSUMO_ALTO'; })) {
            var a = alerta('CONSUMO_ATIPICO', Math.abs(z) > zMax * 2 ? 'ALTA' : 'MEDIA',
              { valor: t.rend, mediana: r(med, 2), z: r(z, 1), DespachoID: t.DespachoID, EquipoID: k, Fecha: t.Fecha,
                HojaID: (lista.filter(function (x) { return x.d.DespachoID === t.DespachoID; })[0] || { d: {} }).d.HojaID });
            pd.alertas.push(a); resultado.alertas.push(a);
          }
        });
      }

      var promedio = uso > 0 ? (odo ? uso / galTramos : galTramos / uso) : null;
      // tendencia robusta: mediana de los últimos 6 tramos contra la de los 6 anteriores (un pico aislado no la mueve)
      // y solo cuenta un cambio mayor al 10 % (la variación normal entre cargas es de ±8 %)
      var ult = tramos.slice(-12).map(function (t) { return t.rend; });
      var mitad = Math.floor(ult.length / 2);
      var mA = mediana(ult.slice(0, mitad)), mB = mediana(ult.slice(mitad));
      var cambio = ult.length >= 6 && mA ? (mB - mA) / mA : 0;
      if (odo) cambio = -cambio;                                                 // km/gal que baja = empeora
      var tendencia = ult.length < 6 ? 'SIN_DATOS' : cambio > 0.1 ? 'EMPEORA' : cambio < -0.1 ? 'MEJORA' : 'ESTABLE';
      var desvioProm = promedio !== null && esperado ? (odo ? (esperado - promedio) / esperado : (promedio - esperado) / esperado) : null;
      var alEq = resultado.alertas.filter(function (a) { return a.EquipoID === k; });
      var altas = alEq.filter(function (a) { return a.severidad === 'ALTA'; }).length;
      // lo reciente pesa más: alertas de los últimos 30 días del propio equipo
      var ultFecha = lista.length ? String(lista[lista.length - 1].d.Fecha) : '';
      var hace30 = ultFecha ? new Date(Date.parse(ultFecha + 'T12:00:00Z') - 30 * 86400000).toISOString().substring(0, 10) : '';
      var recientes = alEq.filter(function (a) { return a.severidad !== 'BAJA' && String(a.Fecha) >= hace30; }).length;
      var exceso = Math.max(0, galTramos - galEspTot);
      var estado = altas >= 2 || recientes >= 3 || (desvioProm !== null && desvioProm > tol) ? 'DESVIO'
        : altas || recientes >= 1 || tendencia === 'EMPEORA' ? 'VIGILAR' : 'NORMAL';
      var ultimo = lista[lista.length - 1];
      resultado.equipos[k] = {
        EquipoID: k, conocido: !!eq, descripcion: eq ? eq.Descripcion : (porEq[k][0].EquipoTexto || ''), unidad: odo ? 'km/gal' : 'gal/h',
        medidor: odo ? 'ODOMETRO' : 'HOROMETRO', despachos: lista.length, galones: r(galTot, 1), costo: r(galTot * precio, 2),
        uso: r(uso, 1), promedio: r(promedio, 3), esperado: esperado, desvioPct: desvioProm === null ? null : r(desvioProm * 100, 1),
        galExceso: esperado ? r(exceso, 1) : null, costoExceso: esperado ? r(exceso * precio, 2) : null, tendencia: tendencia, cambioPct: r(cambio * 100, 1),
        estado: estado, alertas: alEq.length, alertasAltas: altas, alertasRecientes: recientes, tramos: tramos,
        ultimaLectura: ultimo ? (odo ? ultimo.km : ultimo.h) : null, ultimaFecha: ultimo ? ultimo.d.Fecha : null,
        mediana: r(med, 3)
      };
    });
    resultado.alertas.sort(function (a, b) { return (SEV[b.severidad] - SEV[a.severidad]) || String(b.Fecha).localeCompare(String(a.Fecha)); });
    return resultado;
  }

  /**
   * Cuadre de una hoja:
   *  - suma de despachos vs contómetro de la cisterna, vs SALIDA y vs total escrito;
   *  - stock: PREVIO + INGRESO − SALIDA = SALDO;
   *  - continuidad con la hoja anterior de la misma cisterna: contómetro inicial = final anterior, previo = saldo anterior
   *    y número correlativo sin saltos. Una discontinuidad = combustible que salió sin registrarse en ninguna hoja.
   */
  function cuadreHoja(hoja, despachos, cfg, anterior) {
    var tolGal = num(cfg && cfg.TOL_CONTOMETRO_GAL);
    if (tolGal === null) tolGal = 2;
    var suma = 0;
    (despachos || []).forEach(function (d) { suma += num(d.Galones) || 0; });
    var ini = num(hoja.ContometroInicial), fin = num(hoja.ContometroFinal), tot = num(hoja.TotalEscrito), sal = num(hoja.Salida);
    var prev = num(hoja.Previo), ing = num(hoja.Ingreso) || 0, saldo = num(hoja.Saldo);
    var al = [];
    var dif = null;
    if (ini !== null && fin !== null) {
      dif = r((fin - ini) - suma, 1);
      if (fin < ini) al.push(alerta('DIFERENCIA_CONTOMETRO', 'ALTA', { contometro: r(fin - ini, 1), despachado: r(suma, 1), diferencia: dif }));
      else if (Math.abs(dif) > tolGal) al.push(alerta('DIFERENCIA_CONTOMETRO', Math.abs(dif) > tolGal * 5 ? 'ALTA' : 'MEDIA',
        { contometro: r(fin - ini, 1), despachado: r(suma, 1), diferencia: dif }));
    }
    if (sal !== null && Math.abs(sal - suma) > 0.5) al.push(alerta('DIFERENCIA_SALIDA', 'MEDIA', { escrito: sal, suma: r(suma, 1) }));
    if (tot !== null && Math.abs(tot - suma) > 0.5) al.push(alerta('DIFERENCIA_TOTAL', 'MEDIA', { escrito: tot, suma: r(suma, 1) }));
    if (prev !== null && saldo !== null) {
      var calc = prev + ing - (sal !== null ? sal : suma);
      if (Math.abs(calc - saldo) > 0.5) al.push(alerta('SALDO_NO_CUADRA', 'MEDIA', { previo: prev, ingreso: ing, salida: sal !== null ? sal : r(suma, 1), saldo: saldo, calculado: r(calc, 1) }));
    }
    // transferencias entre la cisterna y un tanque estacionario: pasan por el contómetro pero no son despachos a equipos
    var tEnt = num(hoja.TransfEntrada) || 0, tSal = num(hoja.TransfSalida) || 0, cierre = num(hoja.ContometroCierre);
    if (cierre !== null && fin !== null && Math.abs(cierre - (fin + tEnt + tSal)) > tolGal)
      al.push(alerta('TRANSFERENCIA_NO_CUADRA', 'MEDIA', { final: fin, transferido: r(tEnt + tSal, 1), cierre: cierre, diferencia: r(cierre - (fin + tEnt + tSal), 1) }));
    if (anterior) {
      var cierreAnt = num(anterior.ContometroCierre);
      var finAnt = cierreAnt !== null ? cierreAnt : num(anterior.ContometroFinal);
      var saldoAnt = num(anterior.Saldo);
      if (saldoAnt !== null) saldoAnt = saldoAnt + (num(anterior.TransfEntrada) || 0) - (num(anterior.TransfSalida) || 0);
      if (finAnt !== null && ini !== null && Math.abs(ini - finAnt) > tolGal)
        al.push(alerta('CONTOMETRO_DISCONTINUO', ini > finAnt ? 'ALTA' : 'MEDIA', { finalAnterior: finAnt, inicial: ini, diferencia: r(ini - finAnt, 1), hojaAnterior: anterior.NumeroHoja || anterior.HojaID }));
      if (saldoAnt !== null && prev !== null && Math.abs(prev - saldoAnt) > tolGal)
        al.push(alerta('STOCK_DISCONTINUO', prev < saldoAnt ? 'ALTA' : 'MEDIA', { saldoAnterior: saldoAnt, previo: prev, diferencia: r(prev - saldoAnt, 1), hojaAnterior: anterior.NumeroHoja || anterior.HojaID }));
      var nA = num(anterior.NumeroHoja), nH = num(hoja.NumeroHoja);
      // un salto grande es otro talonario, no hojas perdidas
      if (nA !== null && nH !== null && nH - nA > 1 && nH - nA <= 30)
        al.push(alerta('NUMERO_SALTADO', 'MEDIA', { desde: nA + 1, hasta: nH - 1, faltan: nH - nA - 1 }));
    }
    al.forEach(function (a) { a.HojaID = hoja.HojaID; a.Fecha = hoja.Fecha; });
    return { suma: r(suma, 1), contometro: ini !== null && fin !== null ? r(fin - ini, 1) : null, diferencia: dif,
      saldoCalculado: prev !== null ? r(prev + ing - (sal !== null ? sal : suma), 1) : null, alertas: al };
  }

  /** La hoja anterior de la misma cisterna (o del mismo abastecedor si no se anotó la cisterna). */
  function hojaAnterior(hoja, hojas) {
    var clave = function (h) { return String(h.Cisterna || '').trim().toUpperCase() || ('U:' + h.UsuarioID); };
    var k = clave(hoja);
    // orden: fecha, luego número de hoja (mismo día), luego hora de registro. Sirve aunque haya varios talonarios.
    var orden = function (h) { return String(h.Fecha || '') + '|' + ('0000000000' + (num(h.NumeroHoja) || 0)).slice(-10) + '|' + String(h.CreadaEn || ''); };
    var o = orden(hoja);
    var cands = (hojas || []).filter(function (h) {
      return h.HojaID !== hoja.HojaID && h.Estado !== 'ANULADA' && h.Estado !== 'BORRADOR' && clave(h) === k && orden(h) < o;
    });
    cands.sort(function (a, b) { return orden(b).localeCompare(orden(a)); });
    return cands[0] || null;
  }

  /** Totales en el tiempo (por día y por mes) y variación contra el periodo anterior. */
  function serieTiempo(despachos, cfg) {
    var precio = num(cfg && cfg.PRECIO_GALON) || 0;
    var dia = {}, mes = {}, diasMes = {};
    (despachos || []).forEach(function (d) {
      var g = num(d.Galones) || 0, f = String(d.Fecha || '').substring(0, 10); if (!f) return;
      if (!dia[f]) (diasMes[f.substring(0, 7)] = diasMes[f.substring(0, 7)] || {})[f] = 1;
      dia[f] = (dia[f] || 0) + g;
      mes[f.substring(0, 7)] = (mes[f.substring(0, 7)] || 0) + g;
    });
    var dias = Object.keys(dia).sort().map(function (f) { return { fecha: f, galones: r(dia[f], 1), costo: r(dia[f] * precio, 2) }; });
    // la variación se compara por promedio diario: así un mes incompleto (el actual) no aparenta una caída
    var porDia = function (m) { return mes[m] / Math.max(1, Object.keys(diasMes[m] || {}).length); };
    var meses = Object.keys(mes).sort().map(function (m, i, arr) {
      var prev = i ? porDia(arr[i - 1]) : null;
      return { mes: m, galones: r(mes[m], 1), costo: r(mes[m] * precio, 2), diasConDatos: Object.keys(diasMes[m] || {}).length,
        promedioDia: r(porDia(m), 1), variacionPct: prev ? r((porDia(m) - prev) / prev * 100, 1) : null };
    });
    return { dias: dias, meses: meses };
  }

  /**
   * Cuando la suma de la hoja no cuadra con la SALIDA o el contómetro, busca qué fila de galones pudo estar mal leída:
   * la que, cambiando UN dígito (o con un dígito de más/menos), haría cuadrar exacto. Ej.: suma 1071 y salida 1001 → la fila con 93 era 23.
   * filas: [{galones, capacidad?, tipico?}]  diferencia = suma − objetivo. Devuelve hasta 3 candidatas, la más probable primero.
   */
  function filasSospechosas(filas, diferencia) {
    if (!diferencia || Math.abs(diferencia) < 0.9) return [];
    var cand = [];
    (filas || []).forEach(function (f, i) {
      var g = num(f.galones); if (g === null) return;
      var s = String(g), objetivo = r(g - diferencia, 1);
      if (objetivo <= 0) return;
      var alts = [];
      for (var k = 0; k < s.length; k++) {
        if (s[k] === '.') continue;
        for (var d = 0; d <= 9; d++) alts.push(s.substring(0, k) + d + s.substring(k + 1));   // un dígito cambiado
        alts.push(s.substring(0, k) + s.substring(k + 1));                                     // un dígito de más
      }
      for (var d2 = 1; d2 <= 9; d2++) alts.push(d2 + s);                                      // falta el primer dígito
      if (!alts.some(function (a) { return a !== '' && Math.abs(Number(a) - objetivo) < 0.05; })) return;
      // más probable: si el valor leído supera el tanque, o si el corregido se parece a lo que suele cargar ese equipo
      var puntos = 1;
      if (f.capacidad && g > f.capacidad * 1.05 && objetivo <= f.capacidad * 1.05) puntos += 3;
      if (f.tipico) puntos += Math.max(0, 2 - Math.abs(objetivo - f.tipico) / f.tipico * 2) - Math.max(0, 2 - Math.abs(g - f.tipico) / f.tipico * 2);
      cand.push({ fila: i, leido: g, sugerido: objetivo, puntos: puntos });
    });
    cand.sort(function (a, b) { return b.puntos - a.puntos; });
    return cand.slice(0, 3);
  }

  /** ¿El tipo escrito ("CA=002 CAMIONETA", "EXCAVADORA") corresponde a la familia del catálogo? null = no se puede saber. */
  function tipoCoincide(tipo, familia) {
    var t = norm(tipo), palabras = String(familia || '').split(/[\s\/]+/).map(norm).filter(function (w) { return w.length >= 4; });
    if (!t || !palabras.length || t.replace(/[0-9]/g, '').length < 4) return null;
    return palabras.some(function (w) { return t.indexOf(w.substring(0, 5)) >= 0; });
  }

  /** Quita el prefijo de la empresa que se escribe delante del código ("ICN EXC-008" → "EXC-008"). */
  function sinPrefijo(texto, prefijos) {
    var s = String(texto || '').trim();
    String(prefijos || '').split(/[,;]/).map(function (p) { return p.trim(); }).filter(String).forEach(function (p) {
      s = s.replace(new RegExp('^' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\-:.]*', 'i'), '');
    });
    return s.trim();
  }

  return { analizar: analizar, cuadreHoja: cuadreHoja, hojaAnterior: hojaAnterior, sinPrefijo: sinPrefijo, tipoCoincide: tipoCoincide, filasSospechosas: filasSospechosas, serieTiempo: serieTiempo, emparejarEquipo: emparejarEquipo,
    revisarLectura: revisarLectura, num: num, msDe: msDe, mediana: mediana, TEXTOS: TEXTOS, norm: norm };
})();
if (typeof module !== 'undefined') module.exports = Analisis;
