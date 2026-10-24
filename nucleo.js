/* AXION · Núcleo offline: datos en el celular (IndexedDB), cola de envío y sincronización.
 * Regla de oro: un cambio está "recibido" solo cuando el servidor responde. Hasta entonces queda
 * en la cola (outbox) y la app lo muestra como PENDIENTE DE SINCRONIZACIÓN.
 */
var Nucleo = (function () {
  var TABLAS = { PARTES_DIARIOS: 'ParteID', ACTIVIDADES: 'ActividadID', VIAJES: 'ViajeID', ABASTECIMIENTOS: 'AbastecimientoID',
    EVIDENCIAS: 'EvidenciaID', REVISIONES: 'RevisionID', FALLAS_PARTES: 'FallaParteID', FALLAS: 'FallaID', CUMPLIMIENTO: 'CumplimientoID' };
  var HIJAS = ['ACTIVIDADES', 'VIAJES', 'ABASTECIMIENTOS', 'EVIDENCIAS', 'REVISIONES', 'FALLAS_PARTES'];
  var REINTENTABLE = ['RED', 'OCUPADO', 'SESION'];
  var S = null;
  var oyentes = [];
  var db = null;
  var sincronizando = false;

  function vacio() {
    var t = {};
    Object.keys(TABLAS).forEach(function (k) { t[k] = {}; });
    return { token: null, perfil: null, cat: null, t: t, outbox: [], rechazados: [], servidor: null, ultimaSync: null, seq: 0 };
  }

  // ------------------------------------------------------------ IndexedDB
  function abrir() {
    return new Promise(function (ok, mal) {
      var r = indexedDB.open('axion', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); r.result.createObjectStore('fotos'); };
      r.onsuccess = function () { db = r.result; ok(); };
      r.onerror = function () { mal(r.error); };
    });
  }
  function idb(store, modo, fn) {
    return new Promise(function (ok, mal) {
      var tx = db.transaction(store, modo);
      var req = fn(tx.objectStore(store));
      tx.oncomplete = function () { ok(req && req.result); };
      tx.onerror = function () { mal(tx.error); };
    });
  }
  var tGuardar = null;
  function persistir() {
    clearTimeout(tGuardar);
    tGuardar = setTimeout(function () { idb('kv', 'readwrite', function (s) { return s.put(S, 'estado'); }); }, 250);
  }
  function guardarFoto(id, dataURL) { return idb('fotos', 'readwrite', function (s) { return s.put(dataURL, id); }); }
  function leerFoto(id) { return idb('fotos', 'readonly', function (s) { return s.get(id); }); }

  function iniciar() {
    return abrir().then(function () { return idb('kv', 'readonly', function (s) { return s.get('estado'); }); })
      .then(function (e) { S = e || vacio(); return S; });
  }

  function avisar() { persistir(); oyentes.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }
  function alCambiar(f) { oyentes.push(f); }

  // ------------------------------------------------------------ red
  function api(accion, datos) {
    var url = (window.AXION_CONFIG && AXION_CONFIG.API_URL) || '/api';
    return fetch(url, { method: 'POST', body: JSON.stringify({ accion: accion, datos: datos, token: S.token }) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); },
            function () { var e = new Error('Sin conexión con el servidor.'); e.codigo = 'RED'; throw e; })
      .then(function (j) {
        if (j.servidor) S.servidor = j.servidor;
        if (!j.ok) { var e = new Error(j.error); e.codigo = j.codigo; throw e; }
        return j;
      });
  }

  // ------------------------------------------------------------ sesión
  function ingresar(email, codigo) {
    var anterior = S.perfil && S.perfil.Email;
    if (anterior && anterior !== email.trim().toLowerCase() && S.outbox.length)
      return Promise.reject(new Error('Este celular tiene ' + S.outbox.length + ' cambios sin enviar de ' + anterior + '. Ingrese con esa cuenta y sincronice primero.'));
    return api('login', { email: email, codigo: codigo, dispositivo: navigator.userAgent }).then(function (r) {
      if (anterior && anterior !== r.perfil.Email) { var tok = r.token; S = vacio(); S.token = tok; }
      S.token = r.token;
      S.perfil = r.perfil;
      return descargar(true);
    });
  }
  function salir() {
    var p = S.token ? api('logout', {}).catch(function () {}) : Promise.resolve();
    return p.then(function () {
      S = vacio();
      return idb('fotos', 'readwrite', function (s) { return s.clear(); });
    }).then(avisar);
  }

  // ------------------------------------------------------------ lectura local
  function filas(tabla, filtro) {
    var o = S.t[tabla], out = [];
    for (var k in o) if (!filtro || filtro(o[k])) out.push(o[k]);
    return out;
  }
  function fila(tabla, id) { return S.t[tabla][id]; }
  function hijos(tabla, parteID) { return filas(tabla, function (x) { return x.ParteID === parteID; }); }
  function pendientesDe(id) { return S.outbox.filter(function (it) { return it.ref === id; }); }
  /** Estado que ve el usuario: distingue lo guardado en el celular de lo recibido por el servidor. */
  function estadoVisible(p) {
    var acc = S.outbox.filter(function (it) { return it.op === 'accion' && it.fila.ParteID === p.ParteID; });
    if (acc.length) {
      var a = acc[acc.length - 1].fila.Accion;
      var txt = { ENVIAR: 'ENVIADO', CORREGIR: 'CORREGIDO', APROBAR: 'APROBADO', OBSERVAR: 'OBSERVADO', ANULAR: 'ANULADO', REABRIR: 'REABIERTO', EXCEPCION: 'EXCEPCIÓN' }[a] || a;
      return { codigo: 'SYNC', texto: txt + ' · pendiente de sincronización' };
    }
    if (S.outbox.some(function (it) { return it.parte === p.ParteID; })) return { codigo: 'SYNC_EDIT', texto: p.Estado + ' · cambios sin sincronizar' };
    return { codigo: p.Estado, texto: p.Estado };
  }

  // ------------------------------------------------------------ cambios locales
  function nuevoID(pref) {
    var u = (crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2)));
    return pref + '-' + u.replace(/-/g, '').slice(0, 12).toUpperCase();
  }
  function encolar(item) {
    item.seq = ++S.seq;
    item.creado = Date.now();
    S.outbox.push(item);
  }
  function limpiar(f) {
    var o = {};
    for (var k in f) if (k.charAt(0) !== '_') o[k] = f[k];
    return o;
  }

  /** Guarda una fila en el celular y la deja en cola. Reemplaza un envío anterior aún no enviado. */
  function guardar(tabla, f) {
    var clave = TABLAS[tabla];
    var prev = S.t[tabla][f[clave]];
    var nueva = Object.assign({}, prev || {}, f, { _pend: true, _error: '' });
    S.t[tabla][f[clave]] = nueva;
    var parte = tabla === 'PARTES_DIARIOS' ? f.ParteID : (nueva.ParteID || '');
    var cola = S.outbox.filter(function (it) { return it.op === 'guardar' && it.tabla === tabla && it.ref === f[clave] && !it.enviando; })[0];
    if (cola) cola.fila = limpiar(nueva);
    else encolar({ op: 'guardar', tabla: tabla, ref: f[clave], parte: parte, fila: limpiar(nueva) });
    avisar();
    programar(1500);
    return nueva;
  }

  function eliminar(tabla, id) {
    var x = S.t[tabla][id];
    if (!x) return;
    var soloLocal = !x._srv;
    S.outbox = S.outbox.filter(function (it) { return !(it.ref === id && !it.enviando); });
    delete S.t[tabla][id];
    if (!soloLocal) encolar({ op: 'eliminar', tabla: tabla, ref: id, parte: x.ParteID, id: id });
    avisar();
    programar(1500);
  }

  function accion(parte, acc, comentario) {
    var r = { RevisionID: nuevoID('REV'), ParteID: parte.ParteID, Accion: acc, Comentario: comentario || '',
      VersionParte: Number(parte.Version || 0), FechaHoraDispositivo: Reglas.isoLima(Date.now()),
      Usuario: S.perfil.Email, Rol: S.perfil.Rol, EstadoAnterior: parte.Estado, _pend: true };
    S.t.REVISIONES[r.RevisionID] = r;
    encolar({ op: 'accion', ref: r.RevisionID, parte: parte.ParteID, fila: limpiar(r) });
    avisar();
    programar(300);
  }

  function foto(meta, dataURL) {
    var ev = Object.assign({ EvidenciaID: nuevoID('EVI'), FechaHoraDispositivo: Reglas.isoLima(Date.now()),
      SubidoPor: S.perfil.Email, _pend: true, _local: true }, meta);
    S.t.EVIDENCIAS[ev.EvidenciaID] = ev;
    return guardarFoto(ev.EvidenciaID, dataURL).then(function () {
      encolar({ op: 'foto', ref: ev.EvidenciaID, parte: ev.ParteID, fila: limpiar(ev) });
      avisar();
      programar(800);
      return ev;
    });
  }

  // ------------------------------------------------------------ sincronización
  var tProg = null;
  function programar(ms) { clearTimeout(tProg); tProg = setTimeout(sincronizar, ms); }

  function aplicarServidor(tabla, f) {
    var clave = TABLAS[tabla];
    var quedan = S.outbox.some(function (it) { return it.ref === f[clave]; });
    S.t[tabla][f[clave]] = Object.assign({}, quedan ? S.t[tabla][f[clave]] : {}, f, { _srv: true, _pend: quedan });
  }

  function rechazar(it, err) {
    S.rechazados.unshift({ item: it, error: err.message, codigo: err.codigo, fecha: Date.now() });
    S.rechazados = S.rechazados.slice(0, 50);
    var tabla = it.op === 'accion' ? 'REVISIONES' : (it.op === 'foto' ? 'EVIDENCIAS' : it.tabla);
    var x = tabla && S.t[tabla][it.ref];
    if (x) { x._error = err.message; x._pend = false; }
  }

  function enviarLote() {
    var lote = [];
    for (var i = 0; i < S.outbox.length && lote.length < 20; i++) {
      var it = S.outbox[i];
      if (it.op === 'foto') break;
      lote.push(it);
    }
    if (!lote.length) {
      var f = S.outbox[0];
      f.enviando = true;
      return leerFoto(f.ref).then(function (dataURL) {
        var b64 = String(dataURL || '').split(',')[1] || '';
        return api('subirFoto', Object.assign({}, f.fila, { base64: b64, mime: 'image/jpeg' }));
      }).then(function (r) {
        S.outbox = S.outbox.filter(function (x) { return x !== f; });
        aplicarServidor('EVIDENCIAS', r.fila);
      }, function (e) {
        f.enviando = false;
        if (REINTENTABLE.indexOf(e.codigo) >= 0) throw e;
        S.outbox = S.outbox.filter(function (x) { return x !== f; });
        rechazar(f, e);
      });
    }
    lote.forEach(function (it) { it.enviando = true; });
    var cambios = lote.map(function (it) {
      return it.op === 'accion' ? { id: String(it.seq), op: 'accion', fila: it.fila }
        : it.op === 'eliminar' ? { id: String(it.seq), op: 'eliminar', tabla: it.tabla, id: it.id }
        : { id: String(it.seq), op: 'guardar', tabla: it.tabla, fila: it.fila };
    });
    return api('sincronizar', { cambios: cambios }).then(function (r) {
      r.resultados.forEach(function (res, i) {
        var it = lote[i];
        S.outbox = S.outbox.filter(function (x) { return x !== it; });
        if (!res.ok) {
          if (REINTENTABLE.indexOf(res.codigo) >= 0) { it.enviando = false; S.outbox.unshift(it); return; }
          rechazar(it, { message: res.error, codigo: res.codigo });
          return;
        }
        if (it.op === 'accion') {
          aplicarServidor('REVISIONES', res.fila.revision);
          aplicarServidor('PARTES_DIARIOS', res.fila.parte);
          if (res.fila.revision.ResultadoServidor === 'RECHAZADA')
            rechazar(it, { message: res.fila.revision.DetalleServidor, codigo: 'RECHAZADA' });
        } else if (it.op === 'guardar') {
          aplicarServidor(it.tabla, res.fila);
        }
      });
      S.outbox.sort(function (a, b) { return a.seq - b.seq; });
    }, function (e) {
      lote.forEach(function (it) { it.enviando = false; });
      throw e;
    });
  }

  function sincronizar() {
    if (sincronizando || !S || !S.token) return Promise.resolve();
    if (!navigator.onLine) { avisar(); return Promise.resolve(); }
    sincronizando = true;
    avisar();
    var paso = function () {
      if (!S.outbox.length) return Promise.resolve();
      return enviarLote().then(paso);
    };
    return paso().then(function () { return descargar(false); }).then(function () {
      S.ultimaSync = Date.now();
      S.errorSync = '';
    }, function (e) {
      S.errorSync = e.message;
      if (e.codigo === 'SESION') { S.token = null; }
      programar(30000);
    }).then(function () { sincronizando = false; avisar(); });
  }

  /** Descarga datos del servidor y los mezcla sin pisar lo pendiente de envío. */
  function descargar(completo) {
    return api('datos', { desde: completo ? null : S.marca }).then(function (d) {
      S.perfil = d.perfil;
      S.cat = d.catalogos;
      var pendiente = {};
      S.outbox.forEach(function (it) { pendiente[it.ref] = true; if (it.parte) pendiente['P:' + it.parte] = true; });
      var partesNuevas = {};
      d.PARTES_DIARIOS.forEach(function (p) { partesNuevas[p.ParteID] = true; });
      if (!d.incremental) {
        Object.keys(TABLAS).forEach(function (t) {
          var o = S.t[t];
          for (var k in o) if (!pendiente[k] && !(o[k].ParteID && pendiente['P:' + o[k].ParteID] && o[k]._pend)) delete o[k];
        });
      } else {
        HIJAS.forEach(function (t) {
          var o = S.t[t];
          for (var k in o) if (partesNuevas[o[k].ParteID] && !pendiente[k]) delete o[k];
        });
      }
      d.PARTES_DIARIOS.forEach(function (p) { if (!pendiente[p.ParteID] && !pendiente['P:' + p.ParteID]) aplicarServidor('PARTES_DIARIOS', p); });
      HIJAS.forEach(function (t) { d[t].forEach(function (f) { if (!pendiente[f[TABLAS[t]]]) aplicarServidor(t, f); }); });
      ['FALLAS', 'CUMPLIMIENTO'].forEach(function (t) {
        var o = S.t[t];
        for (var k in o) if (!pendiente[k]) delete o[k];
        d[t].forEach(function (f) { if (!pendiente[f[TABLAS[t]]]) aplicarServidor(t, f); });
      });
      S.marca = S.servidor;
      avisar();
    });
  }

  window.addEventListener('online', function () { programar(500); });
  window.addEventListener('offline', avisar);
  setInterval(function () { if (S && S.token && navigator.onLine) sincronizar(); }, 90000);

  return {
    iniciar: iniciar, alCambiar: alCambiar, estado: function () { return S; }, ingresar: ingresar, salir: salir,
    filas: filas, fila: fila, hijos: hijos, pendientesDe: pendientesDe, estadoVisible: estadoVisible,
    nuevoID: nuevoID, guardar: guardar, eliminar: eliminar, accion: accion, foto: foto, leerFoto: leerFoto,
    guardarFoto: guardarFoto, sincronizar: sincronizar, api: api, ocupado: function () { return sincronizando; }
  };
})();
