/* AXION · Núcleo offline: datos en el celular (IndexedDB), cola de envío y sincronización.
 * Regla de oro: un cambio está "recibido" solo cuando el servidor responde. Hasta entonces queda
 * en la cola (outbox) y la app lo muestra como PENDIENTE DE SINCRONIZACIÓN.
 */
var Nucleo = (function () {
  var TABLAS = { PARTES_DIARIOS: 'ParteID', ACTIVIDADES: 'ActividadID', VIAJES: 'ViajeID', ABASTECIMIENTOS: 'AbastecimientoID',
    EVIDENCIAS: 'EvidenciaID', REVISIONES: 'RevisionID', FALLAS_PARTES: 'FallaParteID', FALLAS: 'FallaID', CUMPLIMIENTO: 'CumplimientoID',
    LECTURAS_IA: 'LecturaID' };
  var HIJAS = ['ACTIVIDADES', 'VIAJES', 'ABASTECIMIENTOS', 'EVIDENCIAS', 'REVISIONES', 'FALLAS_PARTES', 'LECTURAS_IA'];
  var IA_TIPOS = ['PARTE_FISICO_FIRMADO', 'HOROMETRO_INICIAL', 'HOROMETRO_FINAL', 'ODOMETRO_INICIAL', 'ODOMETRO_FINAL',
    'HOROMETRO_ABASTECIMIENTO', 'ABASTECIMIENTO', 'CANTIDAD_ABASTECIDA'];
  var ia = {};  // estado de lectura con IA por foto: {estado: 'leyendo'|'error', msg, codigo, t}
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
  // Google a veces pierde o demora la respuesta (la petición se queda colgada o llega el saludo del servidor
  // en vez de la respuesta): cada pedido tiene un tiempo máximo y se reintenta solo.
  var ESPERA_MAX = { login: 30000, datos: 50000, sincronizar: 40000, subirFoto: 90000, leerFoto: 60000 };
  var REINTENTOS = { leerFoto: 0, subirFoto: 1, login: 3 };
  function api(accion, datos) {
    var url = (window.AXION_CONFIG && AXION_CONFIG.API_URL) || '/api';
    var cuerpo = JSON.stringify({ accion: accion, datos: datos, token: S.token });
    var quedan = REINTENTOS[accion] !== undefined ? REINTENTOS[accion] : 2;
    var falla = function (msg, codigo) { var e = new Error(msg); e.codigo = codigo; return e; };
    var intento = function () {
      var ctl = window.AbortController ? new AbortController() : null;
      var reloj = setTimeout(function () { if (ctl) ctl.abort(); }, ESPERA_MAX[accion] || 45000);
      return fetch(url, { method: 'POST', body: cuerpo, signal: ctl ? ctl.signal : undefined })
        .then(function (r) {
          if (!r.ok) throw falla('El servidor respondió ' + r.status + '. Se reintentará.', 'OCUPADO');
          return r.text();
        }, function (e) {
          throw e && e.name === 'AbortError' ? falla('El servidor de Google está demorando. Se reintentará solo.', 'OCUPADO')
            : falla('Sin conexión con el servidor.', 'RED');
        })
        .then(function (txt) {
          clearTimeout(reloj);
          var j;
          try { j = JSON.parse(txt); } catch (x) { throw falla('Google devolvió una respuesta incompleta. Se reintentará solo.', 'OCUPADO'); }
          if (j.servidor) S.servidor = j.servidor;
          if (!j.ok) throw falla(j.error, j.codigo);
          return j;
        }, function (e) { clearTimeout(reloj); throw e; })
        .catch(function (e) {
          if ((e.codigo === 'OCUPADO' || e.codigo === 'RED') && quedan-- > 0 && navigator.onLine !== false) {
            return new Promise(function (ok) { setTimeout(ok, 1500); }).then(intento);
          }
          throw e;
        });
    };
    return intento();
  }

  // ------------------------------------------------------------ sesión
  /** Ingreso con celular o correo. Si debe crear su contraseña, no descarga datos hasta hacerlo. */
  function ingresar(usuario, codigo) {
    var anterior = S.perfil && S.perfil.UsuarioID;
    var nombreAnt = S.perfil && S.perfil.Nombre;
    return api('login', { usuario: usuario, codigo: codigo, dispositivo: navigator.userAgent }).then(function (r) {
      if (anterior && anterior !== r.perfil.UsuarioID) {
        if (S.outbox.length) {
          throw new Error('Este celular tiene ' + S.outbox.length + ' cambios sin enviar de ' + nombreAnt + '. Ingrese con esa cuenta y sincronice primero.');
        }
        S = vacio();
      }
      S.token = r.token;
      S.perfil = r.perfil;
      if (r.perfil.DebeCambiarClave) { avisar(); return { debeCambiar: true }; }
      return descargar(true);
    });
  }
  function cambiarClave(actual, nueva) {
    return api('cambiarClave', { actual: actual, nueva: nueva }).then(function (r) {
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
    if (tabla === 'EVIDENCIAS') {
      idb('fotos', 'readwrite', function (s) { return s.delete(id); }).catch(function () {});
      for (var k in S.t.LECTURAS_IA) if (S.t.LECTURAS_IA[k].EvidenciaID === id) delete S.t.LECTURAS_IA[k];
    }
    if (!soloLocal) encolar({ op: 'eliminar', tabla: tabla, ref: id, parte: x.ParteID, id: id });
    avisar();
    programar(1500);
  }

  /** Quita del celular un borrador y todo lo suyo; si el servidor ya lo tenía, pide borrarlo allá también. */
  function quitarParte(id) {
    delete S.t.PARTES_DIARIOS[id];
    HIJAS.concat(['FALLAS']).forEach(function (t) {
      var o = S.t[t];
      for (var k in o) if (o[k].ParteID === id) {
        if (t === 'EVIDENCIAS') idb('fotos', 'readwrite', function (s) { return s.delete(k); }).catch(function () {});
        delete o[k];
      }
    });
  }
  function eliminarParte(id) {
    var p = S.t.PARTES_DIARIOS[id];
    if (!p) return;
    var enServidor = p._srv || S.outbox.some(function (it) { return it.enviando && (it.ref === id || it.parte === id); });
    S.outbox = S.outbox.filter(function (it) { return it.enviando || !(it.ref === id || it.parte === id); });
    quitarParte(id);
    if (enServidor) encolar({ op: 'eliminar', tabla: 'PARTES_DIARIOS', ref: id, parte: '', id: id });
    avisar();
    programar(800);
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

  // ------------------------------------------------------------ lectura con IA (en el servidor)
  function iaLista() { return !!(S && S.cat && S.cat.CONFIGURACION && S.cat.CONFIGURACION.IA_LISTA === 'SI'); }
  function lecturaDe(evId) {
    return filas('LECTURAS_IA', function (l) { return l.EvidenciaID === evId; })
      .sort(function (a, b) { return String(a.FechaHoraServidor).localeCompare(String(b.FechaHoraServidor)); }).pop() || null;
  }
  /** Pide al servidor leer una foto ya recibida. La IA tarda unos segundos; el resultado queda en LECTURAS_IA. */
  function leerIA(evId, repetir) {
    if (ia[evId] && ia[evId].estado === 'leyendo') return Promise.resolve();
    ia[evId] = { estado: 'leyendo', t: Date.now() };
    avisar();
    return api('leerFoto', { EvidenciaID: evId, repetir: !!repetir }).then(function (r) {
      delete ia[evId];
      aplicarServidor('LECTURAS_IA', r.lectura);
      avisar();
    }, function (e) {
      ia[evId] = { estado: 'error', msg: e.message, codigo: e.codigo, t: Date.now() };
      if (e.codigo === 'IA_ERROR') descargar(false).catch(function () {});  // trae la fila ERROR guardada
      // la respuesta se perdió en el camino pero el servidor pudo haber leído la foto: se trae lo leído en un rato
      if (e.codigo === 'OCUPADO' || e.codigo === 'RED') setTimeout(function () { if (S && S.token) descargar(false).then(avisar, function () {}); }, 20000);
      avisar();
    });
  }
  /** Fotos propias ya recibidas que aún no se leyeron (p. ej., se tomaron sin señal). Máximo 3 por vez. */
  function leerPendientesIA() {
    if (!iaLista() || !S.perfil || !S.perfil.OperadorID) return;
    filas('EVIDENCIAS', function (e) {
      var p = S.t.PARTES_DIARIOS[e.ParteID];
      var est = ia[e.EvidenciaID];
      return e._srv && IA_TIPOS.indexOf(e.TipoEvidencia) >= 0 && p && p.OperadorID === S.perfil.OperadorID &&
        (p.Estado === 'BORRADOR' || p.Estado === 'OBSERVADO') && !lecturaDe(e.EvidenciaID) &&
        !(est && (est.estado === 'leyendo' || Date.now() - est.t < (est.codigo === 'IA_LIMITE' || est.codigo === 'IA_ERROR' ? 10 : 3) * 60000));
    }).slice(0, 3).forEach(function (e) { leerIA(e.EvidenciaID); });
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
        if (iaLista() && IA_TIPOS.indexOf(r.fila.TipoEvidencia) >= 0) leerIA(r.fila.EvidenciaID);  // en paralelo, no frena la cola
      }, function (e) {
        f.enviando = false;
        if (REINTENTABLE.indexOf(e.codigo) >= 0) throw e;
        // el parte todavía está en camino (su envío espera en la cola): la foto espera, no se descarta
        if (e.codigo === 'NO_EXISTE' && S.outbox.some(function (x) { return x.op === 'guardar' && x.tabla === 'PARTES_DIARIOS' && x.ref === f.parte; })) {
          S.outbox = S.outbox.filter(function (x) { return x !== f; }).concat([f]);
          throw e;
        }
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
          if (res.fila.eliminado) { quitarParte(it.fila.ParteID); return; }  // ya no existía en el servidor
          aplicarServidor('REVISIONES', res.fila.revision);
          aplicarServidor('PARTES_DIARIOS', res.fila.parte);
          if (res.fila.revision.ResultadoServidor === 'RECHAZADA')
            rechazar(it, { message: res.fila.revision.DetalleServidor, codigo: 'RECHAZADA' });
        } else if (it.op === 'guardar') {
          // si el borrador se eliminó mientras este cambio viajaba, no se vuelve a mostrar
          var borrado = S.outbox.some(function (x) { return x.op === 'eliminar' && x.tabla === 'PARTES_DIARIOS' && (x.id === it.ref || x.id === it.parte); });
          if (!borrado) aplicarServidor(it.tabla, res.fila);
        }
      });
      S.outbox.sort(function (a, b) { return a.seq - b.seq; });
    }, function (e) {
      lote.forEach(function (it) { it.enviando = false; });
      throw e;
    });
  }

  function sincronizar(forzarCompleta) {
    if (forzarCompleta === true && S) S.ultimaCompleta = 0;  // tocar "sincronizar" baja todo de nuevo desde el servidor
    if (sincronizando || !S || !S.token || (S.perfil && S.perfil.DebeCambiarClave)) return Promise.resolve();
    if (!navigator.onLine) { avisar(); return Promise.resolve(); }
    sincronizando = true;
    avisar();
    var vueltas = 0;
    var paso = function () {
      if (!S.outbox.length || vueltas++ > 40) return Promise.resolve();
      var antes = S.outbox.length;
      // si una vuelta no avanzó (p. ej. el servidor está ocupado), se deja para el próximo intento
      return enviarLote().then(function () { return S.outbox.length < antes ? paso() : null; });
    };
    // cada 6 h una descarga completa: quita del celular los partes que ya no existen en el servidor
    var completa = !S.ultimaCompleta || Date.now() - S.ultimaCompleta > 6 * 3600000;
    var errEnvio = null;
    // aunque una foto o un cambio no logre subir (poca señal), igual se descargan los cambios del servidor
    // (anulaciones, aprobaciones, observaciones); lo que falta se reintenta después
    return paso().catch(function (e) { errEnvio = e; if (e.codigo === 'SESION') throw e; }).then(function () { return descargar(completa); }).then(function () {
      if (completa) S.ultimaCompleta = Date.now();
      S.ultimaSync = Date.now();
      S.errorSync = errEnvio ? 'Hay cambios por enviar: ' + errEnvio.message : '';
      if (errEnvio) programar(30000);
      leerPendientesIA();
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
      (d.eliminados || []).forEach(function (id) { if (!pendiente[id] && !pendiente['P:' + id]) quitarParte(id); });
      d.PARTES_DIARIOS.forEach(function (p) {
        var pend = pendiente[p.ParteID] || pendiente['P:' + p.ParteID];
        // anulado o aprobado en el servidor: manda el servidor y se descarta lo que este celular tenía pendiente de ese parte
        if (pend && (p.Estado === 'ANULADO' || p.Estado === 'APROBADO')) {
          S.outbox = S.outbox.filter(function (it) { return it.ref !== p.ParteID && it.parte !== p.ParteID && !(it.fila && it.fila.ParteID === p.ParteID); });
          pend = false;
        }
        if (!pend) aplicarServidor('PARTES_DIARIOS', p);
      });
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
  // cada 2 min, y solo con la app a la vista (menos carga para el servidor cuando hay muchos operadores)
  setInterval(function () { if (S && S.token && navigator.onLine && !document.hidden) sincronizar(); }, 120000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && S && S.token && navigator.onLine) programar(800); });

  /** Vuelve a poner en cola las fotos de un parte que se rechazaron porque el parte aún no existía en el servidor. */
  function reencolarFotos(parteID) {
    var n = 0;
    Object.keys(S.t.EVIDENCIAS).forEach(function (k) {
      var e = S.t.EVIDENCIAS[k];
      if (e.ParteID !== parteID || e._srv || !e._error) return;
      if (S.outbox.some(function (it) { return it.op === 'foto' && it.ref === k; })) return;
      e._error = ''; e._pend = true;
      encolar({ op: 'foto', ref: k, parte: parteID, fila: limpiar(e) });
      n++;
    });
    if (n) { avisar(); programar(1500); }
    return n;
  }

  return {
    iniciar: iniciar, alCambiar: alCambiar, estado: function () { return S; }, ingresar: ingresar, salir: salir, cambiarClave: cambiarClave,
    filas: filas, fila: fila, hijos: hijos, pendientesDe: pendientesDe, estadoVisible: estadoVisible,
    nuevoID: nuevoID, guardar: guardar, eliminar: eliminar, eliminarParte: eliminarParte, accion: accion, foto: foto, leerFoto: leerFoto,
    guardarFoto: guardarFoto, sincronizar: sincronizar, reencolarFotos: reencolarFotos, api: api, ocupado: function () { return sincronizando; },
    iaLista: iaLista, leerIA: leerIA, lecturaDe: lecturaDe, estadoIA: function (evId) { return ia[evId] || null; }, IA_TIPOS: IA_TIPOS
  };
})();
