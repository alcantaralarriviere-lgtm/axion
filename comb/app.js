/* AXION · Módulo Combustible (abastecedor, gerencia y administrador). Sin librerías.
 * Antes era la app aparte "AXION Combustible"; ahora usa el MISMO ingreso de AXION: la sesión se lee del celular
 * (IndexedDB "axion", la que guarda nucleo.js) y cada pedido va al servidor de AXION como { accion: 'comb', datos: { accion, datos } }.
 */
(function () {
  'use strict';
  var CFG = { API_URL: (window.AXION_CONFIG && AXION_CONFIG.API_URL) || '/api' };
  var A = window.Analisis, G = window.Graf, esc = G.esc, fmt = G.fmt;
  var app = document.getElementById('app'), dlg = document.getElementById('dlg');

  // ------------------------------------------------------------ almacenamiento local (puede fallar en modo privado)
  function lsGet(k) { try { return localStorage.getItem('comb.' + k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v === null || v === undefined) localStorage.removeItem('comb.' + k); else localStorage.setItem('comb.' + k, v); } catch (e) { /* lleno o bloqueado */ } }
  function lsJSON(k) { try { return JSON.parse(lsGet(k) || 'null'); } catch (e) { return null; } }

  var S = { token: null, perfil: lsJSON('perfil'), datos: lsJSON('datos'), obra: lsGet('obra') || 'TODAS', periodo: Number(lsGet('periodo') || 30),
    lect: null, cache: null, enLinea: navigator.onLine };

  /** Sesión de AXION guardada en el celular (la misma con la que se ingresó a AXION). */
  function sesionAxion() {
    return new Promise(function (ok) {
      try {
        var r = indexedDB.open('axion', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('kv'); r.result.createObjectStore('fotos'); };
        r.onerror = function () { ok(null); };
        r.onsuccess = function () {
          try {
            var q = r.result.transaction('kv', 'readonly').objectStore('kv').get('estado');
            q.onsuccess = function () { ok(q.result || null); };
            q.onerror = function () { ok(null); };
          } catch (e) { ok(null); }
        };
      } catch (e) { ok(null); }
    });
  }
  function aAxion(ruta) { location.href = './' + (ruta || ''); }
  function soloVer() { return !!(S.perfil && S.perfil.SoloLectura); }

  // ------------------------------------------------------------ utilidades
  function hoy() { return new Date(Date.now() - 5 * 3600000).toISOString().substring(0, 10); }
  function menosDias(n, desde) { var b = desde ? Date.parse(desde + 'T12:00:00Z') : Date.parse(hoy() + 'T12:00:00Z'); return new Date(b - n * 86400000).toISOString().substring(0, 10); }
  function fechaLarga(f) { if (!f) return '—'; var d = new Date(String(f).substring(0, 10) + 'T12:00:00Z'); return d.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function soles(n) { return n === null || n === undefined || !isFinite(n) ? '—' : 'S/ ' + Number(n).toLocaleString('es-PE', { maximumFractionDigits: 0 }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function aviso(msg, mal) {
    var a = document.getElementById('aviso'); a.textContent = msg; a.className = 'ver' + (mal ? ' mal' : '');
    clearTimeout(aviso.t); aviso.t = setTimeout(function () { a.className = ''; }, mal ? 5200 : 2800);
  }
  function ir(h) { if (location.hash === h) render(); else location.hash = h; }
  function rol() { return S.perfil ? S.perfil.Rol : ''; }
  function esJefe() { return rol() === 'SUPERVISOR' || rol() === 'ADMIN'; }

  var IC = {
    tablero: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/></svg>',
    alerta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17.5v.5"/></svg>',
    hojas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h8M9 17h8"/></svg>',
    equipo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 17h13v-5H9L7 8H3v9z"/><path d="M15 12l3-6 4 1-2 5"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/></svg>',
    admin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
    camara: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/></svg>',
    buscar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    gota: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3C9 8 6 11 6 15a6 6 0 0 0 12 0c0-4-3-7-6-12z"/></svg>',
    hoja: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h26l10 10v46H14z"/><path d="M40 4v10h10M20 24h24M20 32h24M20 40h24M20 48h14"/></svg>'
  };

  // ------------------------------------------------------------ servidor
  function api(accion, datos) {
    return fetch(CFG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow',
      body: JSON.stringify({ accion: 'comb', token: S.token, datos: { accion: accion, datos: datos || {} } }) })
      .then(function (r) { if (!r.ok) throw new Error('El servidor respondió ' + r.status); return r.json(); })
      .catch(function (e) { if (e && e.codigo) throw e; var x = new Error(navigator.onLine ? 'No se pudo conectar con el servidor.' : 'Sin señal. Intente cuando tenga conexión.'); x.codigo = 'RED'; throw x; })
      .then(function (j) {
        if (j.ok) return j;
        var e = new Error(j.error || 'Error'); e.codigo = j.codigo;
        // la sesión y la contraseña se manejan en AXION
        if (j.codigo === 'SESION' || j.codigo === 'CAMBIAR_CLAVE') { salirLocal(); setTimeout(function () { aAxion(); }, 0); }
        throw e;
      });
  }
  function salirLocal() { S.token = null; S.perfil = null; S.datos = null; S.cache = null; lsSet('perfil', null); lsSet('datos', null); }

  function cargarDatos(silencioso) {
    return api('datos').then(function (r) {
      S.datos = r; S.perfil = r.perfil; S.cache = null;
      lsSet('perfil', JSON.stringify(r.perfil));
      try { lsSet('datos', JSON.stringify(r)); } catch (e) { /* demasiado grande: solo en memoria */ }
      return r;
    }).catch(function (e) { if (!silencioso) aviso(e.message, true); throw e; });
  }

  // ------------------------------------------------------------ cálculos (con memoria mientras no cambien los datos/filtros)
  function equiposIdx() { var o = {}; (S.datos.equipos || []).forEach(function (e) { o[e.EquipoID] = e; }); return o; }
  function hojasIdx() { var o = {}; (S.datos.hojas || []).forEach(function (h) { o[h.HojaID] = h; }); return o; }
  var CUENTA = { ENVIADA: 1, APROBADA: 1, OBSERVADA: 1 };
  /** Obra elegida en el filtro; si ya no es una de las del usuario (otro usuario en el mismo celular), vuelve a "todas". */
  function obraActual() {
    var obras = (S.datos && S.datos.obras) || [];
    if (obras.length === 1) return obras[0].ObraID;
    return obras.some(function (o) { return o.ObraID === S.obra; }) ? S.obra : 'TODAS';
  }
  function tituloObra() { var o = obraActual(); return '<b class="obra-tag">' + (o === 'TODAS' ? 'Todas las obras' : esc(nombreObra(o))) + '</b>'; }
  function nombreObra(id) { var o = ((S.datos && S.datos.obras) || []).filter(function (x) { return x.ObraID === id; })[0]; return o ? o.Nombre : id; }
  function calc(obraPedida) {
    var obra = obraPedida || obraActual();
    var clave = obra + '|' + S.periodo;
    S.cache = S.cache || {};
    if (S.cache[clave]) return S.cache[clave];
    var d = S.datos, cfg = d.cfg || {};
    var hIdx = hojasIdx();
    var enObra = function (o) { return obra === 'TODAS' || o === obra; };
    // el abastecedor también ve el historial de su obra (sin hoja visible) para conocer la última lectura
    var desp = (d.despachos || []).filter(function (x) { var h = hIdx[x.HojaID]; return enObra(x.ObraID) && (!h || CUENTA[h.Estado]); });
    var an = A.analizar(desp, d.equipos || [], cfg);
    var desde = menosDias(S.periodo), desdeAnt = menosDias(S.periodo * 2);
    var per = desp.filter(function (x) { return x.Fecha >= desde; });
    var ant = desp.filter(function (x) { return x.Fecha >= desdeAnt && x.Fecha < desde; });
    var suma = function (l) { return l.reduce(function (a, x) { return a + (A.num(x.Galones) || 0); }, 0); };
    var precio = A.num(cfg.PRECIO_GALON) || 0;
    var gal = suma(per), galAnt = suma(ant);
    // alertas: las de consumo se recalculan aquí; las de cuadre vienen guardadas en cada hoja
    var alertas = an.alertas.slice();
    (d.hojas || []).forEach(function (h) {
      if (!CUENTA[h.Estado] || !enObra(h.ObraID)) return;
      try { (JSON.parse(h.Avisos || '[]') || []).forEach(function (a) { if (/^(DIFERENCIA|SALDO|CONTOMETRO|STOCK|NUMERO|TRANSFERENCIA)/.test(a.tipo)) alertas.push(Object.assign({ EquipoID: '', HojaID: h.HojaID, Fecha: h.Fecha }, a)); }); } catch (e) { /* nada */ }
    });
    var SEV = { ALTA: 3, MEDIA: 2, BAJA: 1 };
    alertas.sort(function (a, b) { return String(b.Fecha).localeCompare(String(a.Fecha)) || SEV[b.severidad] - SEV[a.severidad]; });
    var alPer = alertas.filter(function (a) { return a.Fecha >= desde; });
    // por equipo, en el periodo
    var filasEq = Object.keys(an.equipos).map(function (k) {
      var e = an.equipos[k];
      var tp = e.tramos.filter(function (t) { return t.Fecha >= desde; });
      var uso = tp.reduce(function (a, t) { return a + t.uso; }, 0), g = tp.reduce(function (a, t) { return a + t.gal; }, 0);
      var gEsp = tp.reduce(function (a, t) { return a + (t.galEsperado || 0); }, 0);
      var galPer = suma(per.filter(function (x) { return (x.EquipoID || '¿' + (x.EquipoTexto || 'SIN CÓDIGO') + '?') === k; }));
      return Object.assign({}, e, { galPer: galPer, costoPer: galPer * precio, rendPer: uso > 0 ? (e.medidor === 'ODOMETRO' ? uso / g : g / uso) : null,
        excesoPer: e.esperado && gEsp ? Math.max(0, g - gEsp) : 0, alertasPer: alPer.filter(function (a) { return a.EquipoID === k; }).length });
    });
    var orden = { DESVIO: 0, VIGILAR: 1, NORMAL: 2 };
    filasEq.sort(function (a, b) { return orden[a.estado] - orden[b.estado] || b.excesoPer - a.excesoPer || b.galPer - a.galPer; });
    var exceso = filasEq.reduce(function (a, e) { return a + e.excesoPer; }, 0);
    var serie = A.serieTiempo(per, cfg), serieTodo = A.serieTiempo(desp, cfg);
    var pendientes = (d.hojas || []).filter(function (h) { return h.Estado === 'ENVIADA' && enObra(h.ObraID) && h.UsuarioID !== S.perfil.UsuarioID; }).length;
    S.cache[clave] = { clave: clave, obra: obra, an: an, desp: desp, per: per, gal: gal, galAnt: galAnt, costo: gal * precio, precio: precio, variacion: galAnt ? (gal - galAnt) / galAnt * 100 : null,
      alertas: alertas, alPer: alPer, equipos: filasEq, exceso: exceso, serie: serie, serieTodo: serieTodo, pendientes: pendientes, desde: desde, cfg: cfg,
      hojasPer: (d.hojas || []).filter(function (h) { return CUENTA[h.Estado] && enObra(h.ObraID) && h.Fecha >= desde; }).length };
    return S.cache[clave];
  }

  // ------------------------------------------------------------ marco: cabecera con buscador + navegación
  function nav() {
    var r = rol();
    var items = r === 'ABASTECEDOR'
      ? [['inicio', 'Inicio', IC.gota], ['nueva', 'Nueva hoja', IC.camara], ['hojas', 'Mis hojas', IC.hojas], ['equipos', 'Equipos', IC.equipo]]
      : [['tablero', 'Tablero', IC.tablero], ['alertas', 'Desvíos', IC.alerta], ['hojas', 'Hojas', IC.hojas], ['equipos', 'Equipos', IC.equipo]];
    if (r === 'ADMIN') items.splice(2, 0, ['nueva', 'Leer hoja', IC.camara]), items.push(['admin', 'Admin', IC.admin]);
    var actual = (location.hash.split('/')[1] || '');
    var c = S.datos && esJefe() ? calc() : null;
    return '<nav class="barra-nav" aria-label="Secciones">' + items.map(function (i) {
      var marca = '';
      if (c && i[0] === 'alertas') { var n = c.alPer.filter(function (a) { return a.severidad === 'ALTA'; }).length; if (n) marca = '<span class="punto">' + n + '</span>'; }
      if (c && i[0] === 'hojas' && c.pendientes) marca = '<span class="punto">' + c.pendientes + '</span>';
      var activo = actual === i[0] || (i[0] === 'equipos' && actual === 'equipo') || (i[0] === 'hojas' && actual === 'hoja');
      return '<button data-ir="#/' + i[0] + '" class="' + (activo ? 'activo' : '') + '"' + (activo ? ' aria-current="page"' : '') + '>' + i[2] + '<span>' + i[1] + '</span>' + marca + '</button>';
    }).join('') + '</nav>';
  }

  /** Interruptor de modo claro/oscuro (el mismo de AXION: se guarda en axion_tema). */
  function interruptorTema() {
    var claro = document.documentElement.getAttribute('data-tema') === 'claro';
    return '<button type="button" id="temaSw" class="tema-switch" role="switch" aria-checked="' + claro + '" aria-label="Modo claro" title="Cambiar a modo ' + (claro ? 'oscuro' : 'claro') + '">' +
      '<span class="ts-txt">' + (claro ? 'Claro' : 'Oscuro') + '</span><span class="ts-pista"><span class="ts-bola">' + (claro ? '☀' : '☾') + '</span></span></button>';
  }
  function marco(html) {
    var ini = S.perfil ? S.perfil.Nombre.split(' ').map(function (p) { return p.charAt(0); }).slice(0, 2).join('') : '?';
    app.innerHTML = (S.enLinea ? '' : '<div class="sin-red">Sin señal: se muestran los últimos datos guardados</div>') +
      '<div class="marco"><header class="cabecera"><div class="cab-fila">' +
      (rol() === 'ABASTECEDOR' ? '<div class="marca">AXION<small>COMBUSTIBLE</small></div>'
        : '<a class="marca" href="./#/" title="Volver a AXION (partes, tableros, mecánica)" style="text-decoration:none;color:inherit">AXION<small>‹ COMBUSTIBLE</small></a>') +
      '<div class="buscador" role="search">' + IC.buscar + '<input id="buscar" type="search" autocomplete="off" placeholder="Buscar equipo: código, placa o nombre" aria-label="Buscar equipo"><div class="sugerencias" id="sugs" hidden></div></div>' +
      interruptorTema() +
      '<button class="perfil-btn" id="perfil" aria-label="Mi cuenta">' + esc(ini) + '</button></div></header>' +
      '<main class="contenido" id="contenido">' + html + '</main>' + nav() + '</div>';
    activarBuscador();
    $('#perfil').onclick = verPerfil;
    $('#temaSw').onclick = function () {
      var claro = document.documentElement.getAttribute('data-tema') === 'claro';
      try { localStorage.setItem('axion_tema', claro ? 'oscuro' : 'claro'); } catch (x) { /* nada */ }
      document.documentElement.setAttribute('data-tema', claro ? 'oscuro' : 'claro');
      render();
    };
    $$('.barra-nav [data-ir]').forEach(function (b) { b.onclick = function () { ir(b.getAttribute('data-ir')); }; });
  }

  // ------------------------------------------------------------ buscador por equipo
  function buscarEquipos(q) {
    var eqs = (S.datos && S.datos.equipos) || [];
    var t = A.norm(q);
    if (!t) return [];
    var directos = eqs.filter(function (e) {
      return [e.EquipoID, e.Placa, e.Descripcion, e.Alias, e.Familia, e.Marca, e.Modelo].some(function (v) { return A.norm(v).indexOf(t) >= 0; });
    });
    if (directos.length) return directos.slice(0, 8);
    var emp = A.emparejarEquipo(q, eqs);   // tolera errores de tipeo: "exc3", "ex-O3", "axk 907"
    return emp.alternativas.map(function (a) { return eqs.filter(function (e) { return e.EquipoID === a.EquipoID; })[0]; }).filter(Boolean);
  }
  function activarBuscador() {
    var inp = $('#buscar'), box = $('#sugs'), sel = -1, lista = [];
    if (!inp) return;
    var est = {};
    try { if (S.datos && esJefe()) calc().equipos.forEach(function (e) { est[e.EquipoID] = e.estado; }); } catch (e) { /* nada */ }
    function pintar() {
      lista = buscarEquipos(inp.value);
      if (!inp.value.trim()) { box.hidden = true; return; }
      box.hidden = false;
      box.innerHTML = lista.length ? lista.map(function (e, i) {
        return '<button class="sug' + (i === sel ? ' activa' : '') + '" data-eq="' + esc(e.EquipoID) + '"><b>' + esc(e.EquipoID) + '</b><span>' + esc(e.Descripcion || '') + (e.Placa ? ' · ' + esc(e.Placa) : '') + '</span>' +
          (est[e.EquipoID] ? '<i class="chip ' + est[e.EquipoID] + '">' + est[e.EquipoID] + '</i>' : '') + '</button>';
      }).join('') : '<p class="vacio">No hay equipos que coincidan.</p>';
      $$('.sug', box).forEach(function (b) { b.onmousedown = function (ev) { ev.preventDefault(); abrir(b.getAttribute('data-eq')); }; });
    }
    function abrir(id) { inp.value = ''; box.hidden = true; ir('#/equipo/' + encodeURIComponent(id)); }
    inp.oninput = function () { sel = -1; pintar(); };
    inp.onkeydown = function (ev) {
      if (ev.key === 'ArrowDown') { sel = Math.min(lista.length - 1, sel + 1); pintar(); ev.preventDefault(); }
      else if (ev.key === 'ArrowUp') { sel = Math.max(0, sel - 1); pintar(); ev.preventDefault(); }
      else if (ev.key === 'Enter' && lista.length) { abrir(lista[Math.max(0, sel)].EquipoID); }
      else if (ev.key === 'Escape') { box.hidden = true; inp.blur(); }
    };
    inp.onblur = function () { setTimeout(function () { box.hidden = true; }, 150); };
    inp.onfocus = pintar;
  }

  // ------------------------------------------------------------ ingreso: es el de AXION (misma sesión)
  function vistaIngreso() {
    app.innerHTML = '<main class="ingreso"><div class="logo">AXION<b>combustible</b></div><p class="lema">Ingrese primero a AXION…</p></main>';
    aAxion();
  }

  function verPerfil() {
    var p = S.perfil;
    var nombreRol = { ADMIN: 'Administrador', SUPERVISOR: 'Gerencia (solo ver)', ABASTECEDOR: 'Abastecedor' }[p.Rol] || p.Rol;
    dlg.className = '';
    dlg.innerHTML = '<h2>' + esc(p.Nombre) + '</h2><p class="t2">' + esc(p.Email) + '</p><p><span class="chip OK">' + esc(soloVer() ? 'Gerencia (solo ver)' : nombreRol) + '</span></p>' +
      '<p class="t3">Obras: ' + esc((S.datos ? S.datos.obras : []).map(function (o) { return o.Nombre; }).join(', ') || '—') + '</p>' +
      '<div class="acciones"><button class="btn" id="dPlantilla">Plantilla A4 para imprimir</button>' +
      (rol() === 'ABASTECEDOR' ? '' : '<button class="btn" id="dAxion">Volver a AXION</button>') +
      '<button class="btn" id="dCuenta">Mi cuenta (contraseña y salir)</button></div>' +
      '<div class="acciones"><button class="btn-texto" id="dCerrar">Cerrar</button></div>';
    dlg.showModal();
    $('#dCerrar').onclick = function () { dlg.close(); };
    $('#dPlantilla').onclick = function () { window.open('comb/plantilla.html', '_blank'); };
    $('#dCuenta').onclick = function () { aAxion('#/cuenta'); };
    var b = $('#dAxion'); if (b) b.onclick = function () { aAxion('#/'); };
  }

  // ------------------------------------------------------------ filtros comunes
  function filtros() {
    var obras = S.datos.obras || [];
    return '<div class="filtros">' + (obras.length > 1 ? '<select id="fObra" aria-label="Obra"><option value="TODAS">Todas las obras</option>' + obras.map(function (o) { return '<option value="' + esc(o.ObraID) + '"' + (obraActual() === o.ObraID ? ' selected' : '') + '>' + esc(o.Nombre) + '</option>'; }).join('') + '</select>' : '') +
      '<div class="segmento" role="group" aria-label="Periodo">' + [[7, '7 d'], [30, '30 d'], [90, '90 d'], [365, '1 año']].map(function (p) { return '<button data-per="' + p[0] + '" class="' + (S.periodo === p[0] ? 'activo' : '') + '">' + p[1] + '</button>'; }).join('') + '</div></div>';
  }
  function activarFiltros() {
    var o = $('#fObra'); if (o) o.onchange = function () { S.obra = o.value; lsSet('obra', S.obra); S.cache = null; render(); };
    $$('[data-per]').forEach(function (b) { b.onclick = function () { S.periodo = Number(b.getAttribute('data-per')); lsSet('periodo', String(S.periodo)); S.cache = null; render(); }; });
  }

  function kpi(et, val, sub, cls) { return '<div class="kpi ' + (cls || '') + '"><div class="k-et">' + et + '</div><div class="k-val num">' + val + '</div><div class="k-sub">' + (sub || '&nbsp;') + '</div></div>'; }
  function variacion(v) { if (v === null || !isFinite(v)) return 'sin periodo anterior'; return '<span class="' + (v > 0 ? 'sube' : 'baja') + '">' + (v > 0 ? '▲ ' : '▼ ') + fmt(Math.abs(v), 0) + '%</span> vs periodo anterior'; }
  var TEND = { EMPEORA: '▲ Empeora', MEJORA: '▼ Mejora', ESTABLE: '● Estable', SIN_DATOS: '· Sin datos' };

  // ------------------------------------------------------------ TABLERO (supervisor / administrador)
  function vistaTablero() {
    var c = calc();
    var enDesvio = c.equipos.filter(function (e) { return e.estado === 'DESVIO'; });
    var html = '<div class="titulo-vista"><div><h1>' + (c.obra === 'TODAS' ? 'Todas las obras' : esc(nombreObra(c.obra))) + '</h1><p class="t2">Tablero de combustible · ' + esc((S.datos.cfg || {}).EMPRESA || '') + ' · desde ' + fechaLarga(c.desde) + '</p></div>' + filtros() + '</div>' +
      '<div class="kpis">' + kpi('Consumo', fmt(c.gal, 0) + '<small>gal</small>', variacion(c.variacion)) + kpi('Gasto', soles(c.costo), 'a ' + soles(c.precio).replace('S/ ', 'S/ ') + ' por galón') +
      kpi('Exceso estimado', soles(c.exceso * c.precio), fmt(c.exceso, 0) + ' gal sobre lo esperado', c.exceso > 0 ? 'alerta' : '') +
      kpi('Equipos en desvío', enDesvio.length + '<small>de ' + c.equipos.length + '</small>', c.alPer.length + ' alertas en el periodo', enDesvio.length ? 'alerta' : '') + '</div>';
    if (c.obra === 'TODAS' && (S.datos.obras || []).length > 1) html += comparacionObras();
    if (c.pendientes) html += '<button class="item" data-ir="#/hojas" style="margin-bottom:14px"><span class="icono-al">' + c.pendientes + '</span><span class="i-principal"><b>Hojas por revisar</b><span>Enviadas por los abastecedores, esperan su aprobación</span></span><span class="i-der">Revisar ›</span></button>';
    html += '<div class="rejilla r3"><section class="tarjeta"><div class="cab-tarjeta"><h2>Consumo diario</h2><span class="t3">galones</span></div>' + G.serieDiaria(c.serie.dias) + '</section>' +
      '<section class="tarjeta"><div class="cab-tarjeta"><h2>Desvíos recientes</h2><button class="btn-texto" data-ir="#/alertas">Ver todos</button></div>' + listaAlertas(c.alPer.slice(0, 5)) + '</section></div>';
    html += '<div class="rejilla r2" style="margin-top:14px"><section class="tarjeta"><div class="cab-tarjeta"><h2>Galones por equipo</h2><span class="t3">vista 3D · toque una barra</span></div>' +
      G.barras3D(c.equipos.filter(function (e) { return e.galPer > 0; }).sort(function (a, b) { return b.galPer - a.galPer; }).slice(0, 12).map(function (e) { return { id: e.EquipoID, valor: e.galPer, estado: e.conocido ? e.estado : 'OTRO' }; })) + '</section>' +
      '<section class="tarjeta"><div class="cab-tarjeta"><h2>Consumo por mes</h2><span class="t3">% = variación del promedio diario</span></div>' + G.barrasMes(c.serieTodo.meses.slice(-8)) + '</section></div>';
    html += '<section class="tarjeta" style="margin-top:14px"><div class="cab-tarjeta"><h2>Cómo van los equipos</h2><span class="t3">rendimiento del periodo frente a lo esperado</span></div>' + tablaEquipos(c.equipos) + '</section>';
    marco(html);
    activarFiltros(); activarClicks();
    $$('[data-obra]').forEach(function (b) { b.onclick = function () { S.obra = b.getAttribute('data-obra'); lsSet('obra', S.obra); render(); }; });
  }

  /** Las obras lado a lado (solo con "Todas las obras"): consumo, gasto, variación, exceso y desvíos. Toque una para verla sola. */
  function comparacionObras() {
    var filas = (S.datos.obras || []).map(function (o) {
      var c = calc(o.ObraID);
      return { id: o.ObraID, nombre: o.Nombre, c: c, desvio: c.equipos.filter(function (e) { return e.estado === 'DESVIO'; }).length,
        vigilar: c.equipos.filter(function (e) { return e.estado === 'VIGILAR'; }).length, altas: c.alPer.filter(function (a) { return a.severidad === 'ALTA'; }).length,
        pctExceso: c.gal ? c.exceso / c.gal * 100 : 0 };
    }).sort(function (a, b) { return b.c.costo - a.c.costo; });
    var maxGasto = Math.max.apply(null, filas.map(function (f) { return f.c.costo; }).concat([1]));
    var total = filas.reduce(function (a, f) { return a + f.c.costo; }, 0) || 1;
    var tarjetas = filas.map(function (f) {
      var c = f.c;
      return '<button class="obra-card' + (f.desvio ? ' mal' : '') + '" data-obra="' + esc(f.id) + '" aria-label="Ver solo ' + esc(f.nombre) + '">' +
        '<div class="oc-cab"><b>' + esc(f.nombre) + '</b><span class="t3">' + fmt(c.costo / total * 100, 0) + '% del gasto</span></div>' +
        '<div class="oc-barra"><span style="width:' + (c.costo / maxGasto * 100).toFixed(1) + '%"></span></div>' +
        '<div class="oc-datos">' +
        '<div><span class="t3">Consumo</span><b class="num">' + fmt(c.gal, 0) + ' gal</b><small>' + (c.variacion === null ? '—' : '<span class="' + (c.variacion > 0 ? 'sube' : 'baja') + '">' + (c.variacion > 0 ? '▲' : '▼') + fmt(Math.abs(c.variacion), 0) + '%</span>') + '</small></div>' +
        '<div><span class="t3">Gasto</span><b class="num">' + soles(c.costo) + '</b><small>' + c.hojasPer + ' hojas</small></div>' +
        '<div><span class="t3">Exceso</span><b class="num ' + (c.exceso > 0.5 ? 'sube' : '') + '">' + soles(c.exceso * c.precio) + '</b><small>' + fmt(f.pctExceso, 1) + '% del consumo</small></div>' +
        '<div><span class="t3">Equipos</span><b>' + (f.desvio ? '<span class="chip DESVIO">' + f.desvio + ' desvío</span>' : f.vigilar ? '<span class="chip VIGILAR">' + f.vigilar + ' vigilar</span>' : '<span class="chip NORMAL">normal</span>') + '</b><small>' + c.equipos.length + ' equipos · ' + f.altas + ' alertas altas</small></div>' +
        '</div>' + (c.pendientes ? '<div class="t3" style="margin-top:6px">' + c.pendientes + ' hoja(s) por revisar</div>' : '') + '</button>';
    }).join('');
    return '<section class="tarjeta" style="margin-bottom:14px"><div class="cab-tarjeta"><h2>Comparación por obra</h2><span class="t3">ordenadas por gasto · toque una para verla sola</span></div><div class="obras-grid">' + tarjetas + '</div></section>';
  }

  function tablaEquipos(lista) {
    if (!lista.length) return '<p class="vacio">Sin despachos en el periodo.</p>';
    var tol = Number((S.datos.cfg || {}).TOL_DESVIO_PCT || 20);
    return '<div class="tabla-env"><table><thead><tr><th>Equipo</th><th>Estado</th><th>Rendimiento vs esperado</th><th>Tendencia</th><th class="der">Galones</th><th class="der">Gasto</th><th class="der">Exceso</th><th>Últimos</th></tr></thead><tbody>' +
      lista.map(function (e) {
        var ult = e.tramos.slice(-12).map(function (t) { return t.rend; });
        return '<tr class="clic" data-ir="#/equipo/' + encodeURIComponent(e.EquipoID) + '"><td><b>' + esc(e.EquipoID) + '</b><div class="t3">' + esc(e.descripcion || '') + '</div></td>' +
          '<td><span class="chip ' + e.estado + '">' + e.estado + '</span></td>' +
          '<td>' + G.bala(e.rendPer !== null ? e.rendPer : e.promedio, e.esperado, tol, e.medidor === 'ODOMETRO') + '<div class="t3">' + fmt(e.rendPer !== null ? e.rendPer : e.promedio, 2) + ' ' + e.unidad + (e.esperado ? ' · esp. ' + fmt(e.esperado, 2) : '') + '</div></td>' +
          '<td><span class="tend ' + e.tendencia + '">' + TEND[e.tendencia] + '</span></td>' +
          '<td class="der num">' + fmt(e.galPer, 0) + '</td><td class="der num">' + soles(e.costoPer) + '</td>' +
          '<td class="der num ' + (e.excesoPer > 0.5 ? 'sube' : '') + '">' + (e.excesoPer > 0.5 ? soles(e.excesoPer * (A.num(S.datos.cfg.PRECIO_GALON) || 0)) : '—') + '</td>' +
          '<td>' + G.mini(ult, e.estado === 'DESVIO') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function descAlerta(a) {
    var x = '';
    switch (a.tipo) {
      case 'CONSUMO_ALTO': x = fmt(a.valor, 2) + ' vs ' + fmt(a.esperado, 2) + ' esperado (+' + fmt(Math.abs(a.pct), 0) + '%)' + (a.galExceso > 0 ? ' · ~' + fmt(a.galExceso, 0) + ' gal de más' : ''); break;
      case 'CONSUMO_ATIPICO': x = fmt(a.valor, 2) + ' vs su mediana ' + fmt(a.mediana, 2); break;
      case 'CONSUMO_BAJO': x = fmt(a.valor, 2) + ' vs ' + fmt(a.esperado, 2) + ' esperado'; break;
      case 'LECTURA_RETROCEDE': x = fmt(a.valor, 1) + ' después de ' + fmt(a.anterior, 1) + (a.sugerencia ? ' · ¿era ' + fmt(a.sugerencia, 1) + '?' : ''); break;
      case 'SALTO_LECTURA': x = fmt(a.horas, 1) + ' h de motor en ' + fmt(a.horasReloj, 1) + ' h de reloj' + (a.sugerencia ? ' · ¿era ' + fmt(a.sugerencia, 1) + '?' : ''); break;
      case 'SOBRE_TANQUE': x = fmt(a.valor, 1) + ' gal en un tanque de ' + fmt(a.limite, 0); break;
      case 'DIFERENCIA_CONTOMETRO': x = 'Contómetro ' + fmt(a.contometro, 1) + ' gal · despachado ' + fmt(a.despachado, 1) + ' gal · diferencia ' + fmt(a.diferencia, 1) + ' gal'; break;
      case 'DIFERENCIA_TOTAL': case 'DIFERENCIA_SALIDA': x = 'Escrito ' + fmt(a.escrito, 1) + ' · suma de filas ' + fmt(a.suma, 1); break;
      case 'SALDO_NO_CUADRA': x = fmt(a.previo, 1) + ' + ' + fmt(a.ingreso, 1) + ' − ' + fmt(a.salida, 1) + ' = ' + fmt(a.calculado, 1) + ', pero se anotó ' + fmt(a.saldo, 1); break;
      case 'CONTOMETRO_DISCONTINUO': x = 'Hoja anterior ' + esc(a.hojaAnterior) + ' terminó en ' + fmt(a.finalAnterior, 1) + ' y esta empieza en ' + fmt(a.inicial, 1) + (a.diferencia > 0 ? ' · ' + fmt(a.diferencia, 1) + ' gal salieron sin registrarse' : ''); break;
      case 'STOCK_DISCONTINUO': x = 'Saldo de la hoja ' + esc(a.hojaAnterior) + ': ' + fmt(a.saldoAnterior, 1) + ' · previo de esta: ' + fmt(a.previo, 1) + ' (' + (a.diferencia > 0 ? '+' : '') + fmt(a.diferencia, 1) + ' gal)'; break;
      case 'TRANSFERENCIA_NO_CUADRA': x = 'Final ' + fmt(a.final, 1) + ' + transferido ' + fmt(a.transferido, 1) + ' ≠ ' + fmt(a.cierre, 1) + ' anotado'; break;
      case 'NUMERO_SALTADO': x = 'Falta' + (a.faltan > 1 ? 'n' : '') + ' la' + (a.faltan > 1 ? 's hojas Nº ' + a.desde + ' a ' + a.hasta : ' hoja Nº ' + a.desde); break;
      case 'CARGA_REPETIDA': x = 'a ' + fmt(a.horasReloj, 1) + ' h del abastecimiento anterior'; break;
      case 'EQUIPO_DESCONOCIDO': x = 'Escrito: "' + esc(a.escrito || '') + '"'; break;
    }
    return x;
  }
  function listaAlertas(l) {
    if (!l.length) return '<p class="vacio">Sin desvíos. Todo en orden ✓</p>';
    return '<div class="lista">' + l.map(function (a) {
      var destino = a.EquipoID && a.EquipoID.charAt(0) !== '¿' ? '#/equipo/' + encodeURIComponent(a.EquipoID) : '#/hoja/' + encodeURIComponent(a.HojaID);
      return '<button class="item alerta-item ' + a.severidad + '" data-ir="' + destino + '"><span class="icono-al">!</span><span class="i-principal"><b>' + esc(a.EquipoID || 'Cisterna / hoja') + ' · ' + esc(a.texto) + '</b><span>' + descAlerta(a) + '</span></span><span class="i-der t3">' + G.fechaCorta(a.Fecha) + '</span></button>';
    }).join('') + '</div>';
  }

  function activarClicks(raiz) {
    $$('[data-ir]', raiz || app).forEach(function (b) { if (!b.closest('.barra-nav')) b.onclick = function () { ir(b.getAttribute('data-ir')); }; });
    $$('.b3', raiz || app).forEach(function (g) {
      var f = function () { ir('#/equipo/' + encodeURIComponent(g.getAttribute('data-equipo'))); };
      g.onclick = f; g.onkeydown = function (e) { if (e.key === 'Enter') f(); };
    });
  }

  // ------------------------------------------------------------ DESVÍOS
  function vistaAlertas() {
    var c = calc();
    var tipos = {};
    c.alPer.forEach(function (a) { tipos[a.tipo] = (tipos[a.tipo] || 0) + 1; });
    var filtro = S.filtroAlerta || '';
    var l = c.alPer.filter(function (a) { return !filtro || a.tipo === filtro; });
    var html = '<div class="titulo-vista"><div><h1>Desvíos detectados</h1><p class="t2">' + tituloObra() + ' · ' + c.alPer.length + ' en el periodo · se recalculan con cada hoja</p></div>' + filtros() + '</div>' +
      '<div class="filtros"><select id="fTipo" aria-label="Tipo de desvío"><option value="">Todos los tipos</option>' + Object.keys(tipos).map(function (t) { return '<option value="' + t + '"' + (filtro === t ? ' selected' : '') + '>' + esc(A.TEXTOS[t] || t) + ' (' + tipos[t] + ')</option>'; }).join('') + '</select></div>' +
      '<section class="tarjeta">' + listaAlertas(l) + '</section>' +
      '<section class="tarjeta"><h3>Cómo se detectan</h3><p class="t2">Cada abastecimiento repone lo que el equipo consumió desde el anterior. Con el horómetro (o kilometraje) se calcula su rendimiento y se compara con: <b>1)</b> el consumo esperado del equipo (tolerancia ' + esc((S.datos.cfg || {}).TOL_DESVIO_PCT || 20) + '%), <b>2)</b> su propio historial (desviación robusta) y <b>3)</b> reglas físicas: lecturas que retroceden, más horas que el reloj, cargas mayores al tanque y contómetro de la cisterna que no cuadra.</p></section>';
    marco(html);
    activarFiltros(); activarClicks();
    $('#fTipo').onchange = function () { S.filtroAlerta = this.value; render(); };
  }

  // ------------------------------------------------------------ EQUIPOS y FICHA
  function vistaEquipos() {
    var c = calc();
    var conDatos = {};
    c.equipos.forEach(function (e) { conDatos[e.EquipoID] = e; });
    var sin = (S.datos.equipos || []).filter(function (e) { return !conDatos[e.EquipoID] && (obraActual() === 'TODAS' || e.ObraID === obraActual()); });
    var html = '<div class="titulo-vista"><div><h1>Equipos</h1><p class="t2">' + tituloObra() + ' · use la barra de arriba para buscar por código, placa o nombre</p></div>' + filtros() + '</div>';
    if (esJefe()) html += '<section class="tarjeta">' + tablaEquipos(c.equipos) + '</section>';
    else html += '<section class="tarjeta"><div class="lista">' + c.equipos.map(function (e) {
      return '<button class="item" data-ir="#/equipo/' + encodeURIComponent(e.EquipoID) + '"><span class="i-principal"><b>' + esc(e.EquipoID) + '</b><span>' + esc(e.descripcion || '') + '</span></span><span class="i-der"><span class="num">' + fmt(e.ultimaLectura, 1) + '</span><div class="t3">' + (e.medidor === 'ODOMETRO' ? 'km' : 'h') + ' · ' + G.fechaCorta(e.ultimaFecha) + '</div></span></button>';
    }).join('') + '</div></section>';
    if (sin.length) html += '<section class="tarjeta"><h3>Sin despachos registrados</h3><div class="lista">' + sin.map(function (e) { return '<button class="item" data-ir="#/equipo/' + encodeURIComponent(e.EquipoID) + '"><span class="i-principal"><b>' + esc(e.EquipoID) + '</b><span>' + esc(e.Descripcion || '') + '</span></span></button>'; }).join('') + '</div></section>';
    marco(html); activarFiltros(); activarClicks();
  }

  function vistaEquipo(id) {
    var c = calc();
    var eq = equiposIdx()[id] || null;
    var e = c.an.equipos[id];
    if (!eq && !e) { marco('<section class="tarjeta"><h2>No se encontró el equipo ' + esc(id) + '</h2><p class="t2">Revise el código o búsquelo arriba.</p></section>'); return; }
    var unidad = e ? e.unidad : (eq.Medidor === 'ODOMETRO' ? 'km/gal' : 'gal/h');
    var odo = (e ? e.medidor : eq.Medidor) === 'ODOMETRO';
    var tol = Number((S.datos.cfg || {}).TOL_DESVIO_PCT || 20);
    var fila = c.equipos.filter(function (x) { return x.EquipoID === id; })[0] || {};
    var pd = c.an.porDespacho;
    var tramos = e ? e.tramos.map(function (t) { return Object.assign({ alerta: (pd[t.DespachoID] && pd[t.DespachoID].alertas.length) > 0 }, t); }) : [];
    // tanque 3D: qué tan lleno está el "presupuesto" de consumo (real/esperado)
    var ratio = e && e.esperado && e.promedio ? (odo ? e.esperado / e.promedio : e.promedio / e.esperado) : null;
    var nivel = ratio ? Math.max(8, Math.min(100, ratio / (1 + 2 * tol / 100) * 100)) : 40;
    var clsNivel = ratio === null ? '' : ratio > 1 + tol / 100 ? 'mal' : ratio < 1 + tol / 200 ? 'bien' : '';
    var despEq = c.desp.filter(function (x) { return x.EquipoID === id; }).sort(function (a, b) { return (b.Fecha + b.Hora).localeCompare(a.Fecha + a.Hora); });
    var alertasEq = c.alertas.filter(function (a) { return a.EquipoID === id; });
    var html = '<div class="titulo-vista"><div class="ficha-cab"><div class="tanque" title="Consumo real frente al esperado"><div class="tapa"></div><div class="cuerpo"><div class="nivel ' + clsNivel + '" style="height:' + nivel.toFixed(0) + '%"></div></div><div class="brillo"></div></div>' +
      '<div><h1>' + esc(id) + '</h1><p class="t2">' + esc(eq ? [eq.Descripcion, eq.Marca, eq.Modelo, eq.Placa].filter(Boolean).join(' · ') : (e.descripcion || 'No está en el catálogo')) + '</p>' +
      '<p>' + (e ? '<span class="chip ' + e.estado + '">' + e.estado + '</span> <span class="tend ' + e.tendencia + '">' + TEND[e.tendencia] + (e.cambioPct ? ' (' + (e.cambioPct > 0 ? '+' : '') + fmt(e.cambioPct, 0) + '%)' : '') + '</span>' : '<span class="chip SIN_DATOS">SIN DESPACHOS</span>') + '</p></div></div>' + filtros() + '</div>';
    if (e) {
      html += '<div class="kpis">' + kpi('Rendimiento', fmt(e.promedio, 2) + '<small>' + unidad + '</small>', e.esperado ? 'esperado ' + fmt(e.esperado, 2) + ' · ' + (e.desvioPct > 0 ? '+' : '') + fmt(e.desvioPct, 0) + '%' : 'sin consumo esperado configurado', e.desvioPct > tol ? 'alerta' : '') +
        kpi('Galones del periodo', fmt(fila.galPer, 0) + '<small>gal</small>', esJefe() ? soles(fila.costoPer) : e.despachos + ' despachos en total') +
        (esJefe() ? kpi('Exceso del periodo', soles((fila.excesoPer || 0) * c.precio), fmt(fila.excesoPer || 0, 0) + ' gal sobre lo esperado', fila.excesoPer > 0.5 ? 'alerta' : '') : '') +
        kpi('Última lectura', fmt(e.ultimaLectura, 1) + '<small>' + (odo ? 'km' : 'h') + '</small>', fechaLarga(e.ultimaFecha)) + (esJefe() ? '' : kpi('Uso registrado', fmt(e.uso, 0) + '<small>' + (odo ? 'km' : 'h') + '</small>', 'entre abastecimientos')) + '</div>';
      html += '<section class="tarjeta"><div class="cab-tarjeta"><h2>Rendimiento en el tiempo</h2><span class="t3">' + unidad + (odo ? ' (más alto = mejor)' : ' (más alto = consume más)') + '</span></div>' + G.rendimiento(tramos, { esperado: e.esperado, tol: tol, unidad: unidad, odometro: odo }) + '</section>';
    }
    if (esJefe() && alertasEq.length) html += '<section class="tarjeta"><h2>Desvíos de este equipo</h2>' + listaAlertas(alertasEq.slice(0, 12)) + '</section>';
    html += '<section class="tarjeta"><div class="cab-tarjeta"><h2>Abastecimientos</h2><span class="t3">' + despEq.length + ' registrados</span></div>' + (despEq.length ? '<div class="tabla-env"><table><thead><tr><th>Fecha</th><th>Hora</th><th class="der">' + (odo ? 'Km' : 'Horómetro') + '</th><th class="der">Galones</th><th class="der">Uso</th><th class="der">' + unidad + '</th><th>Alertas</th></tr></thead><tbody>' +
      despEq.slice(0, 60).map(function (d) {
        var p = pd[d.DespachoID] || { alertas: [] }, t = p.tramo;
        return '<tr class="clic" data-ir="#/hoja/' + encodeURIComponent(d.HojaID) + '"><td>' + G.fechaCorta(d.Fecha) + '</td><td>' + esc(d.Hora || '') + '</td><td class="der num">' + fmt(A.num(odo ? d.Odometro : d.Horometro), 1) + '</td><td class="der num">' + fmt(A.num(d.Galones), 1) + '</td>' +
          '<td class="der num">' + (t ? fmt(t.uso, 1) : '—') + '</td><td class="der num">' + (t ? fmt(t.rend, 2) : '—') + '</td><td>' + p.alertas.map(function (a) { return '<span class="chip ' + a.severidad + '" title="' + esc(a.texto) + '">' + esc(a.tipo.replace(/_/g, ' ').toLowerCase()) + '</span>'; }).join(' ') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="vacio">Sin abastecimientos.</p>') + '</section>';
    if (eq && esJefe()) html += '<section class="tarjeta"><h3>Ficha técnica</h3><div class="fila-3"><div><div class="t3">Medidor</div><b>' + esc(eq.Medidor) + '</b></div><div><div class="t3">Tanque</div><b>' + fmt(A.num(eq.CapacidadTanque), 0) + ' gal</b></div><div><div class="t3">Consumo esperado</div><b>' + fmt(A.num(eq.ConsumoEsperado), 2) + ' ' + unidad + '</b></div></div>' + (eq.FichaTecnica ? '<p class="t3" style="margin-top:10px">Tanque según ficha técnica: ' + esc(eq.FichaTecnica) + '</p>' : '') + (rol() === 'ADMIN' ? '<div class="acciones"><button class="btn chico" id="editarEq">Editar equipo</button></div>' : '') + '</section>';
    marco(html); activarFiltros(); activarClicks();
    $$('.g-punto').forEach(function (p) { p.onclick = function () { var d = c.desp.filter(function (x) { return x.DespachoID === p.getAttribute('data-despacho'); })[0]; if (d) ir('#/hoja/' + encodeURIComponent(d.HojaID)); }; });
    var be = $('#editarEq'); if (be) be.onclick = function () { formEquipo(eq); };
  }

  // ------------------------------------------------------------ INICIO del abastecedor
  function vistaInicio() {
    var mias = (S.datos.hojas || []).filter(function (h) { return h.UsuarioID === S.perfil.UsuarioID; });
    var obs = mias.filter(function (h) { return h.Estado === 'OBSERVADA'; }), bor = mias.filter(function (h) { return h.Estado === 'BORRADOR'; });
    var hoyGal = (S.datos.despachos || []).filter(function (d) { return d.Fecha === hoy() && mias.some(function (h) { return h.HojaID === d.HojaID; }); }).reduce(function (a, d) { return a + (A.num(d.Galones) || 0); }, 0);
    var html = '<div class="titulo-vista"><div><h1>Hola, ' + esc(S.perfil.Nombre.split(' ')[0]) + '</h1><p class="t2">' + fechaLarga(hoy()) + '</p></div></div>' +
      '<section class="tarjeta" style="text-align:center"><div style="width:64px;height:64px;margin:0 auto;color:var(--acento)" aria-hidden="true">' + IC.hoja + '</div><h2>Registrar la hoja de combustible</h2><p class="t2">Tome una foto a la hoja A4 llena. La app la lee sola y usted solo confirma lo que salga en amarillo o rojo.</p>' +
      '<div class="acciones"><button class="btn primario ancho" data-ir="#/nueva">' + IC.camara.replace('<svg', '<svg width="22" height="22"') + ' Fotografiar hoja A4</button></div></section>' +
      '<div class="kpis" style="margin-top:14px">' + kpi('Despachado hoy', fmt(hoyGal, 0) + '<small>gal</small>', '') + kpi('Observadas', obs.length, 'por corregir', obs.length ? 'alerta' : '') + kpi('Borradores', bor.length, 'sin enviar') + kpi('Hojas enviadas', mias.filter(function (h) { return h.Estado !== 'BORRADOR'; }).length, 'últimos 45 días') + '</div>';
    if (obs.length || bor.length) html += '<section class="tarjeta"><h2>Pendientes</h2>' + listaHojas(obs.concat(bor)) + '</section>';
    marco(html); activarClicks();
  }

  // ------------------------------------------------------------ HOJAS
  function listaHojas(l) {
    if (!l.length) return '<p class="vacio">No hay hojas.</p>';
    var porHoja = {};
    (S.datos.despachos || []).forEach(function (d) { var x = porHoja[d.HojaID] = porHoja[d.HojaID] || { n: 0, g: 0 }; x.n++; x.g += A.num(d.Galones) || 0; });
    var obras = {}; (S.datos.obras || []).forEach(function (o) { obras[o.ObraID] = o.Nombre; });
    return '<div class="lista">' + l.map(function (h) {
      var x = porHoja[h.HojaID] || { n: 0, g: 0 };
      var av = []; try { av = JSON.parse(h.Avisos || '[]') || []; } catch (e) { /* nada */ }
      var altas = av.filter(function (a) { return a.severidad === 'ALTA'; }).length;
      return '<button class="item" data-ir="#/hoja/' + encodeURIComponent(h.HojaID) + '"><span class="i-principal"><b>' + (h.NumeroHoja ? 'Nº ' + esc(h.NumeroHoja) + ' · ' : '') + fechaLarga(h.Fecha) + ' · ' + esc(h.Cliente || obras[h.ObraID] || h.ObraID) + '</b><span>' + esc(h.Abastecedor || '') + ' · ' + x.n + ' despachos' + (av.length ? ' · ' + av.length + ' aviso' + (av.length > 1 ? 's' : '') : '') + '</span></span>' +
        '<span class="i-der"><span class="num"><b>' + fmt(x.g, 0) + '</b> gal</span><div>' + (altas ? '<span class="chip ALTA">' + altas + ' !</span> ' : '') + '<span class="chip ' + h.Estado + '">' + h.Estado + '</span></div></span></button>';
    }).join('') + '</div>';
  }

  function vistaHojas() {
    var f = S.filtroHoja !== undefined ? S.filtroHoja : (esJefe() ? 'ENVIADA' : '');
    var l = (S.datos.hojas || []).filter(function (h) { return (!f || h.Estado === f) && (obraActual() === 'TODAS' || h.ObraID === obraActual()); })
      .sort(function (a, b) { return (b.Fecha + b.CreadaEn).localeCompare(a.Fecha + a.CreadaEn); });
    var html = '<div class="titulo-vista"><div><h1>' + (esJefe() ? 'Hojas de combustible' : 'Mis hojas') + '</h1><p class="t2">' + tituloObra() + ' · ' + l.length + ' hojas</p></div>' + (esJefe() && (S.datos.obras || []).length > 1 ? filtros() : '') + '</div>' +
      '<div class="filtros"><div class="segmento" role="group" aria-label="Estado">' + [['', 'Todas'], ['ENVIADA', 'Por revisar'], ['OBSERVADA', 'Observadas'], ['APROBADA', 'Aprobadas'], ['BORRADOR', 'Borradores']].map(function (x) {
        return '<button data-est="' + x[0] + '" class="' + (f === x[0] ? 'activo' : '') + '">' + x[1] + '</button>'; }).join('') + '</div></div>' +
      '<section class="tarjeta">' + listaHojas(l.slice(0, 150)) + '</section>';
    marco(html); activarFiltros(); activarClicks();
    $$('[data-est]').forEach(function (b) { b.onclick = function () { S.filtroHoja = b.getAttribute('data-est') || ''; render(); }; });
  }

  function vistaHoja(id) {
    var h = hojasIdx()[id];
    if (!h) { marco('<section class="tarjeta"><h2>Hoja no encontrada</h2><p class="t2">Puede ser de otra obra o de hace más tiempo.</p></section>'); return; }
    var desp = (S.datos.despachos || []).filter(function (d) { return d.HojaID === id; }).sort(function (a, b) { return a.Fila - b.Fila; });
    var cfg = S.datos.cfg || {};
    var cu = A.cuadreHoja(h, desp, cfg, A.hojaAnterior(h, S.datos.hojas || []));
    var c = calc(), pd = c.an.porDespacho;
    var av = []; try { av = JSON.parse(h.Avisos || '[]') || []; } catch (e) { /* nada */ }
    var eqI = equiposIdx();
    var html = '<div class="titulo-vista"><div><h1>' + (h.NumeroHoja ? 'Hoja Nº ' + esc(h.NumeroHoja) : 'Hoja') + ' · ' + fechaLarga(h.Fecha) + '</h1><p class="t2">' + [h.Cliente, h.Abastecedor, h.Cisterna].filter(Boolean).map(esc).join(' · ') + '</p></div><span class="chip ' + h.Estado + '">' + h.Estado + '</span></div>';
    if (A.num(h.Previo) !== null || A.num(h.Saldo) !== null) html += '<p class="t2" style="margin:-6px 0 12px">Stock diésel: previo <b>' + fmt(A.num(h.Previo), 1) + '</b> + ingreso <b>' + fmt(A.num(h.Ingreso) || 0, 1) + '</b> − salida <b>' + fmt(A.num(h.Salida), 1) + '</b> = saldo <b>' + fmt(A.num(h.Saldo), 1) + '</b>' + (cu.saldoCalculado !== null && A.num(h.Saldo) !== null && Math.abs(cu.saldoCalculado - A.num(h.Saldo)) > 0.5 ? ' <span class="chip ALTA">no cuadra</span>' : ' ✓') + '</p>';
    if (A.num(h.TransfEntrada) || A.num(h.TransfSalida)) html += '<p class="t2" style="margin:-6px 0 12px">Transferencias con tanque estacionario: ' + (A.num(h.TransfEntrada) ? 'entraron <b>' + fmt(A.num(h.TransfEntrada), 1) + ' gal</b> ' : '') + (A.num(h.TransfSalida) ? 'salieron <b>' + fmt(A.num(h.TransfSalida), 1) + ' gal</b> ' : '') + (A.num(h.ContometroCierre) ? '· contómetro después: <b>' + fmt(A.num(h.ContometroCierre), 1) + '</b>' : '') + '</p>';
    if (h.Notas) html += '<p class="nota"><b>Notas de la hoja:</b> ' + esc(h.Notas) + '</p>';
    if (h.Observacion) html += '<p class="nota"><b>' + (h.Estado === 'OBSERVADA' ? 'Observación' : 'Nota') + ' de ' + esc(h.RevisadaPor || 'revisión') + ':</b> ' + esc(h.Observacion) + '</p>';
    html += '<div class="lectura-2col"><div class="col-foto">' + (h.TieneFoto ? '<div class="tarjeta"><div id="fotoHoja" class="cargando"><span class="girar"></span>Cargando foto…</div></div>' : '<div class="tarjeta"><p class="vacio">Hoja registrada sin foto.</p></div>') + '</div><div>' +
      '<div class="kpis">' + kpi('Despachado', fmt(cu.suma, 1) + '<small>gal</small>', desp.length + ' equipos') + kpi('Contómetro', cu.contometro === null ? '—' : fmt(cu.contometro, 1) + '<small>gal</small>', h.ContometroInicial ? fmt(A.num(h.ContometroInicial), 1) + ' → ' + fmt(A.num(h.ContometroFinal), 1) : 'no anotado') +
      kpi('Diferencia', cu.diferencia === null ? '—' : fmt(cu.diferencia, 1) + '<small>gal</small>', cu.diferencia === null ? '' : Math.abs(cu.diferencia) > Number(cfg.TOL_CONTOMETRO_GAL || 2) ? 'no cuadra' : 'cuadra ✓', cu.diferencia !== null && Math.abs(cu.diferencia) > Number(cfg.TOL_CONTOMETRO_GAL || 2) ? 'alerta' : '') +
      (esJefe() ? kpi('Gasto', soles(cu.suma * (A.num(cfg.PRECIO_GALON) || 0)), '') : kpi('Avisos', av.length, '')) + '</div>' +
      '<section class="tarjeta"><h2>Despachos</h2><div class="tabla-env"><table><thead><tr><th>#</th><th>Hora</th><th>Equipo</th><th>Operador</th><th class="der">Lectura</th><th class="der">Galones</th><th>Análisis</th></tr></thead><tbody>' +
      desp.map(function (d) {
        var p = pd[d.DespachoID] || { alertas: [] }, e = eqI[d.EquipoID];
        var lect = e && e.Medidor === 'ODOMETRO' ? d.Odometro : (d.Horometro !== '' ? d.Horometro : d.Odometro);
        return '<tr' + (d.EquipoID ? ' class="clic" data-ir="#/equipo/' + encodeURIComponent(d.EquipoID) + '"' : '') + '><td>' + d.Fila + '</td><td>' + esc(d.Hora || '') + '</td><td><b>' + esc(d.EquipoID || '¿' + d.EquipoTexto + '?') + '</b>' + (d.Corregido === 'SI' ? ' <span class="t3" title="Corregido a mano">✎</span>' : '') + '</td><td>' + esc(d.Operador || '') + '</td>' +
          '<td class="der num">' + fmt(A.num(lect), 1) + '</td><td class="der num"><b>' + fmt(A.num(d.Galones), 1) + '</b></td><td>' + (p.tramo ? '<span class="t3">' + fmt(p.tramo.rend, 2) + '</span> ' : '') +
          p.alertas.map(function (a) { return '<span class="chip ' + a.severidad + '" title="' + esc(a.texto + ': ' + descAlerta(a).replace(/<[^>]+>/g, '')) + '">' + esc(a.tipo.replace(/_/g, ' ').toLowerCase()) + '</span>'; }).join(' ') + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
    var avCuadre = cu.alertas;
    var avCons = []; desp.forEach(function (d) { (pd[d.DespachoID] || { alertas: [] }).alertas.forEach(function (a) { avCons.push(a); }); });
    if (avCuadre.length || avCons.length) html += '<section class="tarjeta"><h2>Avisos para la revisión</h2>' + listaAlertas(avCuadre.concat(avCons)) + '</section>';
    var acc = '';
    var mia = h.UsuarioID === S.perfil.UsuarioID;
    if (esJefe() && !soloVer() && h.Estado === 'ENVIADA' && !mia) acc += '<button class="btn ok" id="aprobar">Aprobar</button><button class="btn peligro" id="observar">Observar</button>';
    if ((mia || rol() === 'ADMIN') && (h.Estado === 'BORRADOR' || h.Estado === 'OBSERVADA') && rol() !== 'SUPERVISOR') acc += '<button class="btn primario" id="editar">Corregir y enviar</button>';
    if (rol() === 'ADMIN' && h.Estado !== 'ANULADA') acc += '<button class="btn" id="anular">Anular hoja</button>';
    if (rol() === 'ADMIN' && h.Estado === 'APROBADA') acc += '<button class="btn" id="reabrir">Reabrir</button>';
    if (acc) html += '<div class="acciones">' + acc + '</div>';
    html += '</div></div>';
    marco(html); activarClicks();
    if (h.TieneFoto) cargarFoto(id).then(function (url) {
      var z = $('#fotoHoja'); if (!z) return;
      z.outerHTML = '<img class="miniatura" id="imgHoja" src="' + url + '" alt="Foto de la hoja A4">';
      $('#imgHoja').onclick = function () { verFotoGrande(url); };
    }).catch(function (e) { var z = $('#fotoHoja'); if (z) z.innerHTML = '<p class="vacio">' + esc(e.message) + '</p>'; });
    var b;
    if ((b = $('#aprobar'))) b.onclick = function () { revisar(id, 'APROBAR', ''); };
    if ((b = $('#observar'))) b.onclick = function () { pedirMotivo('Observar la hoja', '¿Qué debe corregir el abastecedor?', function (m) { revisar(id, 'OBSERVAR', m); }); };
    if ((b = $('#reabrir'))) b.onclick = function () { pedirMotivo('Reabrir la hoja', 'Motivo', function (m) { revisar(id, 'REABRIR', m); }); };
    if ((b = $('#anular'))) b.onclick = function () { pedirMotivo('Anular la hoja', 'Motivo (los despachos se eliminan del análisis)', function (m) { api('admin', { op: 'anularHoja', HojaID: id, motivo: m }).then(function () { aviso('Hoja anulada'); return cargarDatos(); }).then(render).catch(function (e) { aviso(e.message, true); }); }); };
    if ((b = $('#editar'))) b.onclick = function () { editarHoja(h, desp); };
  }

  var fotos = {};
  function cargarFoto(id) {
    if (fotos[id]) return Promise.resolve(fotos[id]);
    return api('verFoto', { HojaID: id }).then(function (r) { fotos[id] = 'data:' + r.mime + ';base64,' + r.imagen; return fotos[id]; });
  }
  function verFotoGrande(url) {
    dlg.className = 'foto';
    dlg.innerHTML = '<div class="cab-tarjeta"><div class="segmento"><button id="zMenos" aria-label="Alejar">−</button><button id="zMas" aria-label="Acercar">+</button><button id="zRot" aria-label="Girar">⟳</button></div><button class="btn chico" id="zCerrar">Cerrar</button></div><div class="visor"><img src="' + url + '" alt="Hoja A4 ampliada"></div>';
    dlg.showModal();
    var img = $('.visor img', dlg), z = 1, rot = 0;
    var aplicar = function () { img.style.width = (z * 100) + '%'; img.style.transform = rot ? 'rotate(' + rot + 'deg)' : ''; img.style.transformOrigin = 'center'; };
    $('#zMas').onclick = function () { z = Math.min(5, z * 1.4); aplicar(); };
    $('#zMenos').onclick = function () { z = Math.max(1, z / 1.4); aplicar(); };
    $('#zRot').onclick = function () { rot = (rot + 90) % 360; aplicar(); };
    $('#zCerrar').onclick = function () { dlg.close(); };
  }
  function pedirMotivo(titulo, et, fn) {
    dlg.className = '';
    dlg.innerHTML = '<form method="dialog" id="fMot"><h2>' + esc(titulo) + '</h2><label for="mot">' + esc(et) + '</label><textarea id="mot" required minlength="5"></textarea><div id="err"></div><div class="acciones"><button type="button" class="btn" id="mCan">Cancelar</button><button class="btn primario" type="submit">Confirmar</button></div></form>';
    dlg.showModal();
    $('#mCan').onclick = function () { dlg.close(); };
    $('#fMot').onsubmit = function (ev) { ev.preventDefault(); var m = $('#mot').value.trim(); if (m.length < 5) { $('#err').innerHTML = '<p class="error">Escriba el motivo (mínimo 5 letras).</p>'; return; } dlg.close(); fn(m); };
  }
  function revisar(id, decision, obs) {
    api('revisarHoja', { HojaID: id, decision: decision, observacion: obs }).then(function () { aviso(decision === 'APROBAR' ? 'Hoja aprobada ✓' : 'Listo'); return cargarDatos(); }).then(render).catch(function (e) { aviso(e.message, true); });
  }

  // ------------------------------------------------------------ NUEVA HOJA: foto → lectura con IA → confirmación
  function vistaNueva() {
    var L = S.lect;
    if (L && L.fase === 'revision') return vistaRevision();
    if (L && L.fase === 'leyendo') {
      marco('<section class="tarjeta"><h2>Leyendo la hoja…</h2><div class="escaner"><img src="' + L.url + '" alt="Hoja A4"></div><p class="progreso-txt"><span class="girar"></span> <span id="pTxt">Enviando la foto</span></p><p class="t3" style="text-align:center">La inteligencia artificial transcribe cada fila, revisa dos veces lo dudoso y lo compara con el catálogo y el historial de cada equipo. Puede tardar hasta 1–2 minutos con letra difícil.</p></section>');
      return;
    }
    var obras = S.datos.obras || [];
    var html = '<div class="titulo-vista"><div><h1>Nueva hoja de combustible</h1><p class="t2">Foto de la hoja A4 de despacho</p></div></div><section class="tarjeta"><div class="zona-foto">' + IC.camara +
      '<h2>Fotografíe la hoja completa</h2><ol class="pasos-foto"><li>Póngala sobre una superficie plana, con buena luz y sin sombras.</li><li>Que entren las 4 esquinas, de frente y sin inclinar.</li><li>Acérquese lo suficiente para que se lean los números.</li></ol>' +
      (obras.length > 1 ? '<label for="obraN">Obra</label><select id="obraN">' + obras.map(function (o) { return '<option value="' + esc(o.ObraID) + '"' + (S.obra === o.ObraID ? ' selected' : '') + '>' + esc(o.Nombre) + '</option>'; }).join('') + '</select>' : '') +
      '<div class="acciones"><button class="btn primario" id="tomar">' + IC.camara.replace('<svg', '<svg width="22" height="22"') + ' Tomar foto</button><button class="btn" id="subir">Elegir de la galería</button></div>' +
      '<button class="btn-texto" id="manual">Registrar a mano, sin foto</button></div></section>';
    marco(html);
    $('#tomar').onclick = function () { $('#camara').click(); };
    $('#subir').onclick = function () { $('#galeria').click(); };
    $('#manual').onclick = function () { iniciarRevision(null, null, obraElegida()); };
  }
  function obraElegida() { var s = $('#obraN'); return s ? s.value : ((S.datos.obras || [])[0] || {}).ObraID; }

  /** Reduce la foto a 2400 px (suficiente para leer letra a mano) y la pasa a JPEG. */
  function prepararFoto(archivo) {
    return new Promise(function (ok, mal) {
      var img = new Image(), url = URL.createObjectURL(archivo);
      img.onload = function () {
        var max = 2400, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h));
        var cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
        var g = cv.getContext('2d'); g.drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        var dataURL = cv.toDataURL('image/jpeg', 0.88);
        ok({ url: dataURL, b64: dataURL.split(',')[1], ancho: cv.width, alto: cv.height });
      };
      img.onerror = function () { mal(new Error('No se pudo abrir la imagen.')); };
      img.src = url;
    });
  }

  /**
   * Pide la lectura con IA. Si la respuesta se pierde (Google corta los pedidos largos) o tarda, consulta cada 5 s
   * si la lectura ya quedó guardada en el servidor, hasta 6 minutos.
   */
  function leerConEspera(hojaID, obra) {
    var t0 = Date.now(), terminado = false;
    var consultar = function () {
      return new Promise(function (ok) { setTimeout(ok, 5000); }).then(function () {
        if (terminado) return null;
        return api('estadoLectura', { HojaID: hojaID }).catch(function () { return { listo: false }; }).then(function (s) {
          if (terminado) return null;
          if (s && s.listo) return s;
          if (Date.now() - t0 > 6 * 60000) { var e = new Error('La lectura está tardando demasiado.'); e.codigo = 'TIEMPO'; throw e; }
          return consultar();
        });
      });
    };
    var directo = api('leerHoja', { HojaID: hojaID, ObraID: obra }).then(function (r) { return r; }, function (e) {
      if (e.codigo && e.codigo !== 'RED') throw e;   // error real del servidor: se informa
      return null;                                    // respuesta perdida: se sigue consultando
    });
    // lo que llegue primero: la respuesta directa o la lectura ya guardada
    return new Promise(function (ok, mal) {
      directo.then(function (r) { if (r && !terminado) { terminado = true; ok(r); } }, function (e) { if (!terminado) { terminado = true; mal(e); } });
      setTimeout(function () { consultar().then(function (s) { if (s && !terminado) { terminado = true; ok(s); } }, function (e) { if (!terminado) { terminado = true; mal(e); } }); }, 20000);
    });
  }

  function alElegirFoto(ev) {
    var f = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!f) return;
    var obra = obraElegida();
    prepararFoto(f).then(function (foto) {
      if (foto.ancho < 900 && foto.alto < 900) aviso('La foto tiene poca resolución: la lectura puede fallar.', true);
      S.lect = { fase: 'leyendo', url: foto.url, obra: obra };
      render();
      var t0 = Date.now(), msgs = ['Enviando la foto', 'Leyendo el encabezado', 'Transcribiendo las filas', 'Revisando números dudosos', 'Comparando con el catálogo de equipos', 'Validando horómetros con el historial'];
      var tm = setInterval(function () { var p = $('#pTxt'); if (p) p.textContent = msgs[Math.min(msgs.length - 1, Math.floor((Date.now() - t0) / 6000))]; }, 1000);
      // 1) se guarda la foto (rápido) · 2) se lee con IA; si Google pierde la respuesta larga, se pregunta hasta que esté lista
      var hojaID = null;
      api('subirHoja', { imagen: foto.b64, mime: 'image/jpeg', ObraID: obra }).then(function (r) {
        hojaID = r.HojaID; fotos[hojaID] = foto.url; S.lect.HojaID = hojaID;
        return leerConEspera(hojaID, obra);
      }).then(function (r) {
        clearInterval(tm);
        if (r.aviso) aviso(r.aviso, true);
        iniciarRevision(r.HojaID, r.lectura, r.ObraID || obra, foto.url);
      }).catch(function (e) {
        clearInterval(tm);
        if (hojaID) {   // la foto ya está guardada: se puede completar a mano o volver a leer desde la hoja
          aviso(e.message + ' La foto quedó guardada: puede volver a leerla.', true);
          iniciarRevision(hojaID, null, obra, foto.url);
        } else { S.lect = null; ir('#/nueva'); aviso(e.message, true); }
      });
    }).catch(function (e) { aviso(e.message, true); });
  }

  var CAMPOS = ['Equipo', 'Hora', 'Operador', 'Horometro', 'Odometro', 'Galones'];
  var ENC = ['NumeroHoja', 'Fecha', 'Cliente', 'Cisterna', 'Abastecedor', 'Previo', 'Ingreso', 'Salida', 'Saldo', 'ContometroInicial', 'ContometroFinal', 'DiferenciaEscrita', 'TotalEscrito', 'TransfEntrada', 'TransfSalida', 'ContometroCierre', 'Notas'];
  function iniciarRevision(hojaID, prop, obra, url) {
    var enc = prop ? prop.encabezado : {};
    var val = function (c) { return c && c.valor !== null && c.valor !== undefined ? c.valor : ''; };
    var est = function (c) { return c ? { estado: c.estado || 'OK', motivo: c.motivo || '', texto: c.texto || '', sugerencia: c.sugerencia, alternativas: c.alternativas, conf: false } : { estado: 'OK' }; };
    var L = { fase: 'revision', HojaID: hojaID, url: url, obra: obra, prop: prop, version: null, enc: {}, encEst: {}, filas: [] };
    ENC.forEach(function (k) { L.enc[k] = val(enc[k]); L.encEst[k] = est(enc[k]); });
    if (!L.enc.Fecha) L.enc.Fecha = hoy();
    if (!L.enc.Cisterna) L.enc.Cisterna = lsGet('cisterna') || '';
    if (!L.enc.Abastecedor) L.enc.Abastecedor = S.perfil.Nombre;
    ((prop && prop.filas) || []).forEach(function (f) {
      var fila = { EquipoID: f.Equipo.valor || '', EquipoTexto: f.Equipo.escrito || f.Equipo.texto || '', Tipo: f.Tipo || '', Firma: f.Firma, Hora: val(f.Hora), Operador: val(f.Operador), Horometro: val(f.Horometro), Odometro: val(f.Odometro),
        Galones: val(f.Galones), Observacion: f.Observacion || '', est: {}, corregido: false };
      CAMPOS.forEach(function (k) { fila.est[k] = est(f[k]); });
      L.filas.push(fila);
    });
    if (!L.filas.length) L.filas.push(filaVacia());
    S.lect = L;
    if (location.hash !== '#/nueva') location.hash = '#/nueva'; else render();
  }
  function filaVacia() { var f = { EquipoID: '', EquipoTexto: '', Hora: '', Operador: '', Horometro: '', Odometro: '', Galones: '', Observacion: '', est: {}, corregido: true }; CAMPOS.forEach(function (k) { f.est[k] = { estado: 'OK' }; }); return f; }

  function editarHoja(h, desp) {
    var enc = {}; ENC.forEach(function (k) { enc[k] = h[k] === undefined ? '' : h[k]; });
    S.lect = { fase: 'revision', HojaID: h.HojaID, obra: h.ObraID, version: h.Version, url: fotos[h.HojaID] || null, cargarFoto: h.TieneFoto,
      enc: enc, encEst: {}, filas: desp.map(function (d) {
        var f = { EquipoID: d.EquipoID, EquipoTexto: d.EquipoTexto, Tipo: d.Tipo, Firma: d.Firma === 'SI' ? true : d.Firma === 'NO' ? false : null, Hora: d.Hora, Operador: d.Operador, Horometro: d.Horometro, Odometro: d.Odometro, Galones: d.Galones, Observacion: d.Observacion, est: {}, corregido: d.Corregido === 'SI' };
        CAMPOS.forEach(function (k) { f.est[k] = { estado: 'OK' }; }); return f;
      }) };
    ir('#/nueva');
  }

  /** Campos marcados (amarillo/rojo) que el abastecedor aún no confirmó o corrigió. */
  function pendientes(L) {
    var n = 0;
    Object.keys(L.encEst).forEach(function (k) { var e = L.encEst[k]; if (e && e.estado && e.estado !== 'OK' && !e.conf) n++; });
    L.filas.forEach(function (f) { CAMPOS.forEach(function (k) { var e = f.est[k]; if (e.estado !== 'OK' && !e.conf) n++; }); });
    return n;
  }

  function campoHTML(id, et, valor, e, tipo, extra) {
    e = e || { estado: 'OK' };
    var marcado = e.estado !== 'OK';
    var cls = 'campo ' + (marcado ? (e.conf ? 'confirmado' : e.estado) : '');
    var pista = '';
    if (marcado) {
      pista = '<div class="pista ' + (e.estado === 'DUDOSO' ? 'duda' : 'mal') + '">' + (e.estado === 'ILEGIBLE' ? 'No se pudo leer. ' : e.estado === 'DUDOSO' ? 'Dudoso. ' : '') + esc(e.motivo || '') +
        (e.texto ? ' <span class="esc">Escrito: "' + esc(e.texto) + '"</span>' : '') +
        (e.sugerencia ? ' <button type="button" class="btn-texto" data-sug="' + id + '" data-val="' + esc(e.sugerencia) + '">Usar ' + esc(fmt(e.sugerencia, 1)) + '</button>' : '') + '</div>';
    }
    var conf = marcado ? '<button type="button" class="confirmar ' + (e.conf ? 'si' : '') + '" data-conf="' + id + '">' + (e.conf ? '✓ Revisado' : 'Confirmar') + '</button>' : '';
    var control = extra || '<input id="' + id + '" data-campo="' + id + '" type="' + (tipo || 'text') + '"' + (tipo === 'number' ? ' inputmode="decimal" step="any"' : '') + ' value="' + esc(valor) + '">';
    return '<div class="' + cls + '"><label for="' + id + '"><span>' + et + '</span>' + conf + '</label>' + control + pista + '</div>';
  }

  function selectEquipo(i, f) {
    var eqs = (S.datos.equipos || []).filter(function (e) { return e.Estado !== 'INACTIVO' && (!e.ObraID || e.ObraID === S.lect.obra); });
    var alt = (f.est.Equipo.alternativas || []).map(function (a) { return a.EquipoID; });
    var opciones = '<option value="">— Elegir equipo —</option>' +
      (alt.length ? '<optgroup label="Más parecidos a lo escrito">' + alt.map(function (id) { return '<option value="' + esc(id) + '"' + (f.EquipoID === id ? ' selected' : '') + '>' + esc(id) + '</option>'; }).join('') + '</optgroup>' : '') +
      '<optgroup label="Todos">' + eqs.map(function (e) { return '<option value="' + esc(e.EquipoID) + '"' + (f.EquipoID === e.EquipoID && alt.indexOf(e.EquipoID) < 0 ? ' selected' : '') + '>' + esc(e.EquipoID) + ' · ' + esc(e.Descripcion || '') + '</option>'; }).join('') + '</optgroup>' +
      '<option value="__OTRO__"' + (!f.EquipoID && f.EquipoTexto ? ' selected' : '') + '>No está en la lista</option>';
    return '<select id="f' + i + 'Equipo" data-campo="f' + i + 'Equipo">' + opciones + '</select>';
  }

  function filaHTML(f, i) {
    var eq = equiposIdx()[f.EquipoID];
    var odo = eq && eq.Medidor === 'ODOMETRO';
    var estados = CAMPOS.map(function (k) { return f.est[k].conf ? 'OK' : f.est[k].estado; });
    var est = estados.indexOf('INCONSISTENTE') >= 0 || estados.indexOf('ILEGIBLE') >= 0 ? 'INCONSISTENTE' : estados.indexOf('DUDOSO') >= 0 ? 'DUDOSO' : 'OK';
    return '<div class="fila-desp ' + est + '" data-fila="' + i + '"><div class="fd-cab"><b>FILA ' + (i + 1) + '</b>' + (f.corregido ? '<span class="t3">✎ corregida</span>' : '') + '<span class="esp"></span><button type="button" class="btn-texto" data-quitar="' + i + '" aria-label="Quitar fila ' + (i + 1) + '">Quitar</button></div>' +
      '<div class="campos">' + campoHTML('f' + i + 'Equipo', 'Equipo', '', f.est.Equipo, '', selectEquipo(i, f)) +
      campoHTML('f' + i + (odo ? 'Odometro' : 'Horometro'), odo ? 'Kilometraje' : 'Horómetro', odo ? f.Odometro : f.Horometro, f.est[odo ? 'Odometro' : 'Horometro'], 'number') +
      campoHTML('f' + i + 'Galones', 'Galones', f.Galones, f.est.Galones, 'number') +
      campoHTML('f' + i + 'Hora', 'Hora', f.Hora, f.est.Hora, 'time') +
      campoHTML('f' + i + 'Operador', 'Operador', f.Operador, f.est.Operador, 'text') + '</div>' +
      (!f.EquipoID && f.EquipoTexto ? '<p class="pista mal">Equipo escrito: "' + esc(f.EquipoTexto) + '". Elija el correcto o avise al administrador para darlo de alta.</p>' : '') +
      '<div class="avisos-vivos" id="av' + i + '"></div></div>';
  }

  function vistaRevision() {
    var L = S.lect;
    var p = L.prop;
    var obras = {}; (S.datos.obras || []).forEach(function (o) { obras[o.ObraID] = o.Nombre; });
    var html = '<div class="titulo-vista"><div><h1>Revise y confirme</h1><p class="t2">' + esc(obras[L.obra] || L.obra || '') + (L.HojaID ? ' · ' + esc(L.HojaID) : ' · registro manual') + '</p></div></div>';
    if (p) {
      html += '<div class="resumen-ia"><span class="chip OK">' + p.conteo.reconocidos + ' datos leídos</span>' + (p.conteo.dudosos ? '<span class="chip DUDOSO">' + p.conteo.dudosos + ' dudosos</span>' : '') + (p.conteo.ilegibles ? '<span class="chip ILEGIBLE">' + p.conteo.ilegibles + ' ilegibles</span>' : '') +
        '<span class="chip ' + (p.calidad_imagen === 'BUENA' ? 'OK' : p.calidad_imagen === 'MALA' ? 'ALTA' : 'MEDIA') + '">foto ' + esc(String(p.calidad_imagen || '').toLowerCase()) + '</span></div>';
      (p.avisos || []).forEach(function (a) { html += '<p class="nota">' + esc(a) + '</p>'; });
      if (p.obraSugerida && L.HojaID && !L.version) html += '<div class="acciones" style="margin-top:0"><button class="btn primario" id="cambiarObra" data-obra-id="' + esc(p.obraSugerida.ObraID) + '">Cambiar a ' + esc(p.obraSugerida.Nombre) + ' y volver a leer</button></div>';
      if (p.comentario) html += '<p class="t3">Nota de la lectura: ' + esc(p.comentario) + '</p>';
    }
    html += '<div class="lectura-2col"><div class="col-foto">' + (L.url ? '<img class="miniatura" id="miniHoja" src="' + L.url + '" alt="Foto de la hoja: toque para ampliar"><p class="t3" style="text-align:center">Toque la foto para ampliarla y comparar.</p>' + (L.HojaID && !L.version ? '<div class="acciones"><button class="btn chico" id="releer">Volver a leer con IA</button></div>' : '') : L.cargarFoto ? '<div id="fotoRev" class="cargando"><span class="girar"></span></div>' : '<div class="tarjeta"><p class="vacio">Sin foto</p></div>') + '</div><div>' +
      '<section class="tarjeta"><h2>Encabezado</h2>' +
      '<div class="fila-2">' + campoHTML('eNumeroHoja', 'Nº de hoja', L.enc.NumeroHoja, L.encEst.NumeroHoja, 'text') + campoHTML('eFecha', 'Fecha', L.enc.Fecha, L.encEst.Fecha, 'date') + '</div>' +
      '<div class="fila-2">' + campoHTML('eCliente', 'Cliente / frente', L.enc.Cliente, L.encEst.Cliente, 'text') + campoHTML('eCisterna', 'Cisterna / surtidor', L.enc.Cisterna, L.encEst.Cisterna, 'text') + '</div>' +
      campoHTML('eAbastecedor', 'Chofer / abastecedor', L.enc.Abastecedor, L.encEst.Abastecedor, 'text') +
      '<h3 style="margin-top:14px">Stock de diésel</h3><div class="campos-4">' + campoHTML('ePrevio', 'Previo', L.enc.Previo, L.encEst.Previo, 'number') + campoHTML('eIngreso', 'Ingreso', L.enc.Ingreso, L.encEst.Ingreso, 'number') +
      campoHTML('eSalida', 'Salida', L.enc.Salida, L.encEst.Salida, 'number') + campoHTML('eSaldo', 'Saldo', L.enc.Saldo, L.encEst.Saldo, 'number') + '</div>' +
      '<h3 style="margin-top:14px">Contómetro de la cisterna</h3><div class="fila-3">' + campoHTML('eContometroInicial', 'Inicial', L.enc.ContometroInicial, L.encEst.ContometroInicial, 'number') + campoHTML('eContometroFinal', 'Final', L.enc.ContometroFinal, L.encEst.ContometroFinal, 'number') + campoHTML('eDiferenciaEscrita', 'Diferencia escrita', L.enc.DiferenciaEscrita, L.encEst.DiferenciaEscrita, 'number') + '</div>' +
      '<h3 style="margin-top:14px">Transferencias con tanque estacionario <span class="t3">(no son despachos)</span></h3><div class="fila-3">' + campoHTML('eTransfEntrada', 'Entró a la cisterna', L.enc.TransfEntrada, L.encEst.TransfEntrada, 'number') + campoHTML('eTransfSalida', 'Salió de la cisterna', L.enc.TransfSalida, L.encEst.TransfSalida, 'number') + campoHTML('eContometroCierre', 'Contómetro después', L.enc.ContometroCierre, L.encEst.ContometroCierre, 'number') + '</div>' +
      campoHTML('eNotas', 'Notas de la hoja', L.enc.Notas, L.encEst.Notas, 'text') + '</section>' +
      '<section class="tarjeta"><div class="cab-tarjeta"><h2>Despachos (' + L.filas.length + ')</h2><button class="btn chico" id="agregar">+ Agregar fila</button></div><div id="filas">' + L.filas.map(filaHTML).join('') + '</div></section>' +
      '<div class="cuadre" id="cuadre"></div>' +
      '<div class="acciones"><button class="btn" id="cancelar">Cancelar</button><button class="btn" id="guardar">Guardar borrador</button><button class="btn primario" id="enviar">Enviar</button></div></div></div>';
    marco(html);
    enlazarRevision();
    actualizarCuadre();
    if (L.cargarFoto && !L.url) cargarFoto(L.HojaID).then(function (u) { L.url = u; render(); }).catch(function () { var z = $('#fotoRev'); if (z) z.innerHTML = '<p class="vacio">Foto no disponible</p>'; });
  }

  function enlazarRevision() {
    var L = S.lect;
    var cont = $('#contenido');
    var mini = $('#miniHoja'); if (mini) mini.onclick = function () { verFotoGrande(L.url); };
    var co = $('#cambiarObra'); if (co) co.onclick = function () {
      var nueva = co.getAttribute('data-obra-id');
      co.disabled = true; co.innerHTML = '<span class="girar"></span> Leyendo con los equipos de la otra obra…';
      leerConEspera(L.HojaID, nueva).then(function (r) { if (!r.lectura) throw new Error(r.aviso || 'No se pudo leer la hoja.'); iniciarRevision(L.HojaID, r.lectura, r.ObraID || nueva, L.url); aviso('Obra cambiada y hoja leída de nuevo'); })
        .catch(function (e) { aviso(e.message, true); co.disabled = false; });
    };
    var rl = $('#releer'); if (rl) rl.onclick = function () {
      rl.disabled = true; rl.innerHTML = '<span class="girar"></span> Leyendo…';
      leerConEspera(L.HojaID, L.obra).then(function (r) { if (!r.lectura) throw new Error(r.aviso || 'No se pudo leer la hoja.'); iniciarRevision(L.HojaID, r.lectura, r.ObraID || L.obra, L.url); aviso('Lectura actualizada'); }).catch(function (e) { aviso(e.message, true); rl.disabled = false; rl.textContent = 'Volver a leer con IA'; });
    };
    function ref(id) {
      var m = /^f(\d+)(\w+)$/.exec(id);
      if (m) { var f = L.filas[Number(m[1])]; return { obj: f, k: m[2], est: f.est[m[2]], fila: Number(m[1]) }; }
      var k = id.substring(1); return { obj: L.enc, k: k, est: L.encEst[k] || (L.encEst[k] = { estado: 'OK' }) };
    }
    cont.oninput = cont.onchange = function (ev) {
      var t = ev.target, id = t.getAttribute('data-campo'); if (!id) return;
      var r = ref(id);
      if (r.k === 'Equipo') {
        if (ev.type !== 'change') return;
        if (t.value === '__OTRO__') { var txt = prompt('Código o nombre del equipo tal como está escrito:', r.obj.EquipoTexto || ''); r.obj.EquipoID = ''; r.obj.EquipoTexto = txt || r.obj.EquipoTexto; }
        else { r.obj.EquipoID = t.value; if (t.value) r.obj.EquipoTexto = r.obj.EquipoTexto || t.value; }
        r.est.conf = !!r.obj.EquipoID; r.obj.corregido = true;
        var div = $('[data-fila="' + r.fila + '"]'); div.outerHTML = filaHTML(r.obj, r.fila);
        actualizarCuadre(); return;
      }
      r.obj[r.k] = t.value;
      if (r.est && r.est.estado !== 'OK' && String(t.value).trim() !== '') { r.est.conf = true; marcarConf(t, r.est); }
      if (r.fila !== undefined) r.obj.corregido = true;
      actualizarCuadre();
    };
    cont.onclick = function (ev) {
      var t = ev.target.closest('button'); if (!t) return;
      var id;
      if ((id = t.getAttribute('data-conf'))) { var r = ref(id); r.est.conf = !r.est.conf; marcarConf($('#' + id), r.est); actualizarCuadre(); }
      else if ((id = t.getAttribute('data-sug'))) { var r2 = ref(id); r2.obj[r2.k] = t.getAttribute('data-val'); r2.est.conf = true; r2.obj.corregido = true; var inp = $('#' + id); inp.value = r2.obj[r2.k]; marcarConf(inp, r2.est); actualizarCuadre(); }
      else if (t.hasAttribute('data-quitar')) { if (confirm('¿Quitar esta fila?')) { L.filas.splice(Number(t.getAttribute('data-quitar')), 1); $('#filas').innerHTML = L.filas.map(filaHTML).join(''); actualizarCuadre(); } }
      else if (t.id === 'agregar') { L.filas.push(filaVacia()); $('#filas').innerHTML = L.filas.map(filaHTML).join(''); actualizarCuadre(); }
      else if (t.id === 'cancelar') { if (confirm('¿Salir sin enviar? Lo guardado en borrador se conserva.')) { S.lect = null; ir(esJefe() ? '#/tablero' : '#/inicio'); } }
      else if (t.id === 'guardar') enviarHoja(false);
      else if (t.id === 'enviar') enviarHoja(true);
    };
  }
  function marcarConf(inp, est) {
    var c = inp && inp.closest('.campo'); if (!c) return;
    c.className = 'campo ' + (est.conf ? 'confirmado' : est.estado);
    var b = $('.confirmar', c); if (b) { b.className = 'confirmar' + (est.conf ? ' si' : ''); b.textContent = est.conf ? '✓ Revisado' : 'Confirmar'; }
    var fd = inp.closest('.fila-desp');
    if (fd) { var f = S.lect.filas[Number(fd.getAttribute('data-fila'))]; var es = CAMPOS.map(function (k) { return f.est[k].conf ? 'OK' : f.est[k].estado; }); fd.className = 'fila-desp ' + (es.indexOf('INCONSISTENTE') >= 0 || es.indexOf('ILEGIBLE') >= 0 ? 'INCONSISTENTE' : es.indexOf('DUDOSO') >= 0 ? 'DUDOSO' : 'OK'); }
  }

  /** Cuadre en vivo + análisis de cada fila contra el historial del equipo, mientras el abastecedor corrige. */
  function actualizarCuadre() {
    var L = S.lect, cfg = S.datos.cfg || {};
    var tmp = L.filas.map(function (f, i) { return { DespachoID: 'TMP-' + i, HojaID: 'TMP', EquipoID: f.EquipoID, EquipoTexto: f.EquipoTexto, Fecha: L.enc.Fecha, Hora: f.Hora, Horometro: f.Horometro, Odometro: f.Odometro, Galones: f.Galones }; });
    var ant = A.hojaAnterior(Object.assign({ HojaID: L.HojaID || '__nueva__', UsuarioID: S.perfil.UsuarioID }, L.enc), S.datos.hojas || []);
    var cu = A.cuadreHoja(L.enc, tmp, cfg, ant);
    var eqs = {}; tmp.forEach(function (d) { if (d.EquipoID) eqs[d.EquipoID] = 1; });
    var hist = (S.datos.despachos || []).filter(function (d) { return eqs[d.EquipoID] && d.HojaID !== L.HojaID; }).concat(tmp.filter(function (d) { return d.EquipoID; }));
    var an = A.analizar(hist, S.datos.equipos || [], cfg);
    L.filas.forEach(function (f, i) {
      var box = $('#av' + i); if (!box) return;
      var p = an.porDespacho['TMP-' + i];
      var msgs = [];
      if (!f.Galones && f.Galones !== 0) msgs.push({ s: 'ALTA', t: 'Faltan los galones' });
      if (!f.EquipoID && !f.EquipoTexto) msgs.push({ s: 'ALTA', t: 'Falta el equipo' });
      if (p) p.alertas.forEach(function (a) { if (a.tipo !== 'EQUIPO_DESCONOCIDO') msgs.push({ s: a.severidad, t: a.texto + (descAlerta(a) ? ': ' + descAlerta(a).replace(/<[^>]+>/g, '') : '') }); });
      if (p && p.tramo && !p.alertas.length) msgs.push({ s: 'OK', t: 'Rendimiento ' + fmt(p.tramo.rend, 2) + ' ✓' });
      box.innerHTML = msgs.map(function (m) { return '<div class="aviso-vivo ' + m.s + '"' + (m.s === 'OK' ? ' style="background:var(--ok-suave);color:var(--ok)"' : '') + '>' + esc(m.t) + '</div>'; }).join('');
    });
    var pend = pendientes(L);
    var tolC = Number(cfg.TOL_CONTOMETRO_GAL || 2);
    var malC = cu.diferencia !== null && Math.abs(cu.diferencia) > tolC;
    var tot = A.num(L.enc.Salida) !== null ? A.num(L.enc.Salida) : A.num(L.enc.TotalEscrito);
    var malHoja = cu.alertas.filter(function (a) { return a.tipo !== 'DIFERENCIA_CONTOMETRO' && a.tipo !== 'DIFERENCIA_TOTAL' && a.tipo !== 'DIFERENCIA_SALIDA'; });
    $('#cuadre').innerHTML = '<div class="c-dato"><b class="num">' + fmt(cu.suma, 1) + ' gal</b>suma de la hoja</div>' +
      (tot !== null ? '<div class="c-dato ' + (Math.abs(tot - cu.suma) > 0.5 ? 'mal' : 'bien') + '"><b class="num">' + fmt(tot, 1) + '</b>salida escrita</div>' : '') +
      (cu.contometro !== null ? '<div class="c-dato ' + (malC ? 'mal' : 'bien') + '"><b class="num">' + (cu.diferencia > 0 ? '+' : '') + fmt(cu.diferencia, 1) + ' gal</b>vs contómetro</div>' : '') +
      '<div class="c-dato ' + (pend ? 'mal' : 'bien') + '"><b>' + (pend ? pend + ' por revisar' : 'Todo revisado ✓') + '</b>campos marcados</div>' +
      (malHoja.length ? '<div class="avisos-vivos" style="flex-basis:100%;grid-column:1/-1">' + malHoja.map(function (a) { return '<div class="aviso-vivo ' + a.severidad + '">' + esc(a.texto) + ': ' + descAlerta(a) + '</div>'; }).join('') + '</div>' : '');
    var be = $('#enviar'); if (be) { be.disabled = pend > 0; be.textContent = pend ? 'Enviar (' + pend + ' por revisar)' : 'Enviar'; }
  }

  function enviarHoja(enviar) {
    var L = S.lect;
    if (enviar && pendientes(L)) { aviso('Revise los campos en amarillo o rojo: corríjalos o toque "Confirmar".', true); return; }
    var filas = L.filas.filter(function (f) { return f.EquipoID || f.EquipoTexto || f.Galones; });
    var faltan = filas.filter(function (f) { return !(A.num(f.Galones) > 0) || (!f.EquipoID && !f.EquipoTexto); });
    if (enviar && faltan.length) { aviso('Hay filas sin equipo o sin galones.', true); return; }
    var go = function (hojaID) {
      var b = $(enviar ? '#enviar' : '#guardar'); if (b) { b.disabled = true; b.innerHTML = '<span class="girar"></span>'; }
      return api('guardarHoja', { HojaID: hojaID, version: L.version, enviar: enviar, encabezado: Object.assign({ ObraID: L.obra }, L.enc),
        filas: filas.map(function (f) {
          var conf = CAMPOS.map(function (k) { return f.est[k].estado; });
          return { EquipoID: f.EquipoID, EquipoTexto: f.EquipoTexto || f.EquipoID, Tipo: f.Tipo, Firma: f.Firma, Hora: f.Hora, Operador: f.Operador, Horometro: f.Horometro, Odometro: f.Odometro, Galones: f.Galones,
            Observacion: f.Observacion, Corregido: f.corregido, Confianza: conf.indexOf('ILEGIBLE') >= 0 || conf.indexOf('INCONSISTENTE') >= 0 ? 'BAJA' : conf.indexOf('DUDOSO') >= 0 ? 'MEDIA' : 'ALTA' };
        }) })
        .then(function (r) {
          var altas = (r.avisos || []).filter(function (a) { return a.severidad === 'ALTA'; }).length;
          aviso(enviar ? 'Hoja enviada ✓' + (altas ? ' · ' + altas + ' aviso(s) para el supervisor' : '') : 'Borrador guardado');
          S.lect = enviar ? null : Object.assign(L, { version: r.hoja.Version, HojaID: r.hoja.HojaID });
          return cargarDatos().then(function () { ir(enviar ? '#/hoja/' + encodeURIComponent(r.hoja.HojaID) : '#/nueva'); });
        }).catch(function (e) { aviso(e.message, true); if (b) { b.disabled = false; b.textContent = enviar ? 'Enviar' : 'Guardar borrador'; } });
    };
    if (L.enc.Cisterna) lsSet('cisterna', String(L.enc.Cisterna).toUpperCase());
    if (L.HojaID) go(L.HojaID);
    else api('crearHojaManual', { ObraID: L.obra }).then(function (r) { L.HojaID = r.HojaID; return go(r.HojaID); }).catch(function (e) { aviso(e.message, true); });
  }

  // ------------------------------------------------------------ ADMINISTRACIÓN
  function vistaAdmin() {
    var d = S.datos;
    var tab = S.tabAdmin || 'equipos';
    var html = '<div class="titulo-vista"><div><h1>Administración</h1><p class="t2">Equipos, parámetros y usuarios de combustible</p></div><div class="segmento">' + [['equipos', 'Equipos'], ['config', 'Parámetros'], ['usuarios', 'Usuarios']].map(function (t) { return '<button data-tab="' + t[0] + '" class="' + (tab === t[0] ? 'activo' : '') + '">' + t[1] + '</button>'; }).join('') + '</div></div>';
    if (tab === 'usuarios') {
      // los usuarios son los de AXION: se crean, dan de baja y cambian de contraseña en AXION › Administrar › Otros roles
      var NR = { ADMIN: 'Administrador', GERENCIA: 'Gerencia (solo ver)', ABASTECEDOR: 'Abastecedor' };
      html += '<section class="tarjeta"><div class="cab-tarjeta"><h2>Usuarios con acceso a Combustible</h2><a class="btn chico primario" href="./#/admin/otros">+ Agregar en AXION</a></div>' +
        '<p class="t3">Son los mismos usuarios de AXION. Para crear un abastecedor, darlo de baja o restablecer su contraseña use AXION › Administrar › Otros roles.</p>' +
        '<div class="tabla-env"><table><thead><tr><th>Nombre</th><th>Ingresa con</th><th>Rol</th><th>Estado</th></tr></thead><tbody>' +
        (d.usuarios || []).map(function (u) {
          return '<tr><td><b>' + esc(u.Nombre) + '</b></td><td>' + [u.Telefono ? 'cel. ' + esc(u.Telefono) : '', esc(u.Email || '')].filter(Boolean).join('<br>') + '</td><td>' + esc(NR[u.Rol] || u.Rol) + '</td><td><span class="chip ' + (u.Estado === 'ACTIVO' ? 'OK' : 'BAJA') + '">' + esc(u.Estado) + '</span></td></tr>';
        }).join('') + '</tbody></table></div></section>';
    } else if (tab === 'equipos') {
      html += '<section class="tarjeta"><div class="cab-tarjeta"><h2>Equipos</h2><button class="btn chico primario" id="nuevoE">+ Nuevo equipo</button></div><p class="t3">El <b>consumo esperado</b> es la base para detectar desvíos: gal/h para equipos con horómetro, km/gal para los de odómetro. Si no lo sabe, déjelo vacío unas semanas y use la mediana que calcula la app.</p><div class="tabla-env"><table><thead><tr><th>Código</th><th>Descripción</th><th>Obra</th><th>Medidor</th><th class="der">Tanque</th><th class="der">Esperado</th><th class="der">Mediana real</th><th></th></tr></thead><tbody>' +
        (d.equipos || []).map(function (e) {
          var a = calc().an.equipos[e.EquipoID];
          return '<tr><td><b>' + esc(e.EquipoID) + '</b>' + (e.Estado === 'INACTIVO' ? ' <span class="chip BAJA">inactivo</span>' : '') + '</td><td>' + esc(e.Descripcion) + '</td><td>' + esc(e.ObraID) + '</td><td>' + esc(e.Medidor) + '</td><td class="der num">' + fmt(A.num(e.CapacidadTanque), 0) + '</td><td class="der num">' + fmt(A.num(e.ConsumoEsperado), 2) + '</td><td class="der num">' + (a ? fmt(a.mediana, 2) : '—') + '</td><td><button class="btn chico" data-eq="' + esc(e.EquipoID) + '">Editar</button></td></tr>';
        }).join('') + '</tbody></table></div></section>';
    } else {
      var cfg = {}; (d.config || []).forEach(function (c) { cfg[c.Clave] = c; });
      var editables = ['EMPRESA', 'PRECIO_GALON', 'TOL_DESVIO_PCT', 'Z_DESVIO', 'TOL_CONTOMETRO_GAL', 'PREFIJO_CODIGO', 'IA_ACTIVA', 'IA_SEGUNDA_PASADA'];
      html += '<section class="tarjeta"><h2>Parámetros</h2>' + editables.map(function (k) { var c = cfg[k] || { Valor: '', Descripcion: '' }; return '<label for="cfg' + k + '">' + esc(k) + ' <span class="t3">· ' + esc(c.Descripcion || '') + '</span></label><div style="display:flex;gap:8px"><input id="cfg' + k + '" value="' + esc(c.Valor) + '"><button class="btn chico" data-cfg="' + k + '">Guardar</button></div>'; }).join('') + '</section>';
    }
    marco(html);
    $$('[data-tab]').forEach(function (b) { b.onclick = function () { S.tabAdmin = b.getAttribute('data-tab'); render(); }; });
    var b;
    if ((b = $('#nuevoE'))) b.onclick = function () { formEquipo(null); };
    $$('[data-eq]').forEach(function (x) { x.onclick = function () { formEquipo(equiposIdx()[x.getAttribute('data-eq')]); }; });
    $$('[data-cfg]').forEach(function (x) { x.onclick = function () { var k = x.getAttribute('data-cfg'); api('admin', { op: 'guardarConfig', Clave: k, Valor: $('#cfg' + k).value }).then(function () { aviso('Guardado'); return cargarDatos(); }).then(render).catch(function (e) { aviso(e.message, true); }); }; });
  }

  function formEquipo(e) {
    e = e || {};
    dlg.className = '';
    var obras = S.datos.obras || [];
    var c = function (id, et, v, t) { return '<div><label for="' + id + '">' + et + '</label><input id="' + id + '" value="' + esc(v || '') + '"' + (t ? ' type="' + t + '" step="any" inputmode="decimal"' : '') + '></div>'; };
    dlg.innerHTML = '<form id="fE"><h2>' + (e.EquipoID ? 'Editar ' + esc(e.EquipoID) : 'Nuevo equipo') + '</h2>' +
      '<div class="fila-2">' + c('qId', 'Código', e.EquipoID) + c('qPl', 'Placa / serie', e.Placa) + '</div>' + c('qDe', 'Descripción', e.Descripcion) +
      '<div class="fila-2">' + c('qMa', 'Marca', e.Marca) + c('qMo', 'Modelo', e.Modelo) + '</div>' +
      '<div class="fila-2"><div><label for="qOb">Obra</label><select id="qOb"><option value="">Todas</option>' + obras.map(function (o) { return '<option value="' + esc(o.ObraID) + '"' + (e.ObraID === o.ObraID ? ' selected' : '') + '>' + esc(o.Nombre) + '</option>'; }).join('') + '</select></div>' +
      '<div><label for="qMe">Medidor</label><select id="qMe"><option value="HOROMETRO">Horómetro (gal/h)</option><option value="ODOMETRO"' + (e.Medidor === 'ODOMETRO' ? ' selected' : '') + '>Odómetro (km/gal)</option></select></div></div>' +
      '<div class="fila-2">' + c('qTa', 'Capacidad del tanque (gal)', e.CapacidadTanque, 'number') + c('qCo', 'Consumo esperado', e.ConsumoEsperado, 'number') + '</div>' +
      c('qAl', 'Otros nombres como lo escriben en la hoja (separados por coma)', e.Alias) +
      '<label style="display:flex;gap:8px;align-items:center;font-weight:400"><input type="checkbox" id="qIn"' + (e.Estado === 'INACTIVO' ? ' checked' : '') + '> Inactivo</label>' +
      '<div id="err"></div><div class="acciones"><button type="button" class="btn" id="qC">Cancelar</button><button class="btn primario">Guardar</button></div></form>';
    dlg.showModal();
    if (e.EquipoID) $('#qId').readOnly = true;
    $('#qC').onclick = function () { dlg.close(); };
    $('#fE').onsubmit = function (ev) {
      ev.preventDefault();
      api('admin', { op: 'guardarEquipo', EquipoID: $('#qId').value, Placa: $('#qPl').value, Descripcion: $('#qDe').value, Marca: $('#qMa').value, Modelo: $('#qMo').value, ObraID: $('#qOb').value,
        Medidor: $('#qMe').value, CapacidadTanque: $('#qTa').value, ConsumoEsperado: $('#qCo').value, Alias: $('#qAl').value, Estado: $('#qIn').checked ? 'INACTIVO' : 'ACTIVO' })
        .then(function (r) { dlg.close(); aviso('Equipo guardado' + (r.reasignados ? ' · ' + r.reasignados + ' despacho(s) anteriores asignados a este equipo' : '')); return cargarDatos(); }).then(render).catch(function (x) { $('#err').innerHTML = '<p class="error">' + esc(x.message) + '</p>'; });
    };
  }

  // ------------------------------------------------------------ enrutador
  function render() {
    if (!S.token) return vistaIngreso();
    if (!S.datos || !S.perfil) {
      app.innerHTML = '<div class="cargando" style="min-height:100dvh"><span class="girar"></span>Cargando datos…</div>';
      cargarDatos().then(render).catch(function (e) { if (e.codigo !== 'SESION' && e.codigo !== 'CAMBIAR_CLAVE') app.innerHTML = '<main class="ingreso"><p class="error">' + esc(e.message) + '</p><button class="btn" onclick="location.reload()">Reintentar</button></main>'; });
      return;
    }
    var p = location.hash.replace(/^#\/?/, '').split('/');
    var v = p[0] || (esJefe() ? 'tablero' : 'inicio'), arg = p[1] ? decodeURIComponent(p[1]) : '';
    window.scrollTo(0, 0);
    try {
      if (v === 'tablero' && esJefe()) return vistaTablero();
      if (v === 'alertas' && esJefe()) return vistaAlertas();
      if (v === 'equipos') return vistaEquipos();
      if (v === 'equipo') return vistaEquipo(arg);
      if (v === 'hojas') return vistaHojas();
      if (v === 'hoja') return vistaHoja(arg);
      if (v === 'nueva' && rol() !== 'SUPERVISOR') return vistaNueva();
      if (v === 'admin' && rol() === 'ADMIN') return vistaAdmin();
      return esJefe() ? vistaTablero() : vistaInicio();
    } catch (e) { console.error(e); marco('<section class="tarjeta"><p class="error">Ocurrió un error al mostrar la pantalla: ' + esc(e.message) + '</p></section>'); }
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('online', function () { S.enLinea = true; if (S.token) cargarDatos(true).then(render).catch(function () { }); });
  window.addEventListener('offline', function () { S.enLinea = false; aviso('Sin señal', true); });
  document.getElementById('camara').addEventListener('change', alElegirFoto);
  document.getElementById('galeria').addEventListener('change', alElegirFoto);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () { });
  // la sesión es la de AXION: sin ella se vuelve al ingreso de AXION
  sesionAxion().then(function (ax) {
    if (!ax || !ax.token || !ax.perfil) return aAxion();
    if (['ADMIN', 'GERENCIA', 'ABASTECEDOR'].indexOf(ax.perfil.Rol) < 0) return aAxion('#/');
    // copia guardada de otro usuario en este mismo celular: no se usa
    if (S.perfil && S.perfil.UsuarioID !== ax.perfil.UsuarioID) { S.perfil = null; S.datos = null; lsSet('perfil', null); lsSet('datos', null); }
    S.token = ax.token;
    render();
    // datos frescos al abrir (si había copia guardada se mostró al instante)
    if (S.datos) cargarDatos(true).then(function () { if (!S.lect) render(); }).catch(function () { });
  });
})();
