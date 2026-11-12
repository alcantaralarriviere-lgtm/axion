/* AXION · Interfaz (operador, supervisor, administrador). Sin frameworks: funciona sin internet. */
(function () {
  var N = Nucleo, R = Reglas;
  var app = document.getElementById('app');
  var tmp = {};          // partes nuevos aún sin equipo elegido (no se envían todavía)
  var fotoMeta = null;   // a qué se asocia la próxima foto
  var filtroRevisar = 'POR_REVISAR';
  var diaCumpl = null;

  // ------------------------------------------------------------ utilidades
  var P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', checkc: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    alert: '<path d="M12 3 2 21h20L12 3z"/><path d="M12 10v5M12 18h.01"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cloud: '<path d="M7 18a5 5 0 1 1 1.2-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8H7z"/>',
    cloudoff: '<path d="M3 3l18 18"/><path d="M7 18a5 5 0 0 1-1.6-9.7M10 6.3A6 6 0 0 1 19 10a4 4 0 0 1 1.8 7.5"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="3.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    ojo: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    ojono: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z"/>',
    truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3"/><path d="M7 7h4"/>',
    right: '<path d="m9 6 6 6-6 6"/>', left: '<path d="m15 6-6 6 6 6"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4"/>',
    send: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>', file: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/>',
    logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>', calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    gauge: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="m12 14 4-5"/>', activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>'
  };
  function ic(n) { return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || '') + '</svg>'; }
  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fF(f) { if (!f) return '—'; var p = String(f).substring(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function fFH(iso) { if (!iso) return '—'; var l = R.enLima(Date.parse(iso)); return fF(l.fecha).substring(0, 5) + ' ' + l.hora; }
  function n1(v) { return v === '' || v === null || v === undefined ? '—' : Number(v).toLocaleString('es-PE', { maximumFractionDigits: 1 }); }
  function S() { return N.estado(); }
  function perfil() { return S().perfil || {}; }
  function rol() { return perfil().Rol; }
  function cat() { return S().cat || {}; }
  function cfg() { return cat().CONFIGURACION || {}; }
  function sinPlazo() { return cfg().PLAZO_ENTREGA === 'NO'; }
  function busca(lista, campo, id) { return (cat()[lista] || []).filter(function (x) { return x[campo] === id; })[0] || {}; }
  function equipo(id) { return busca('EQUIPOS', 'EquipoID', id); }
  function turno(id) { return busca('TURNOS', 'TurnoID', id); }
  function nombreOp(id) { return busca('OPERADORES', 'OperadorID', id).Nombre || id; }
  function nombreObra(id) { return busca('OBRAS', 'ObraID', id).Nombre || id; }
  function nombreFrente(id) { return busca('FRENTES', 'FrenteID', id).Nombre || id; }
  function catAct() { var m = {}; (cat().ACTIVIDADES_CAT || []).forEach(function (c) { m[c.ActividadCatID] = c; }); return m; }
  function hoy() { return R.enLima(Date.now()).fecha; }
  function toast(t) {
    var d = document.createElement('div');
    d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = t;
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 3500);
  }
  function getParte(id) { return N.fila('PARTES_DIARIOS', id) || tmp[id]; }
  function editable(p) {
    if (!p || p.OperadorID !== perfil().OperadorID) return false;
    if (N.estado().outbox.some(function (it) { return it.op === 'accion' && it.fila.ParteID === p.ParteID; })) return false;
    return !p.Estado || p.Estado === 'BORRADOR' || (p.Estado === 'OBSERVADO' && perfil().PuedeCorregir);
  }
  /** Un borrador propio que nunca se envió se puede eliminar (p. ej., si eligió el equipo equivocado). */
  function borrable(p) { return editable(p) && (p.Estado || 'BORRADOR') === 'BORRADOR' && !p.FechaRecepcionServidor; }
  function botonBorrarParte(p) {
    return borrable(p) ? '<button class="btn peligro ancho" data-a="borrarParte" data-id="' + p.ParteID + '">' + ic('trash') + 'Eliminar borrador</button>' : '';
  }

  var EST = {
    BORRADOR: ['file', '', 'Borrador'], PENDIENTE_REVISION: ['clock', 'acento', 'Por revisar'], OBSERVADO: ['alert', 'alerta', 'Observado'],
    CORREGIDO: ['clock', 'acento', 'Corregido'], APROBADO: ['checkc', 'ok', 'Aprobado'], ANULADO: ['x', 'anulado', 'Anulado'],
    SYNC: ['cloudoff', 'acento', ''], SYNC_EDIT: ['cloudoff', 'acento', ''], RECHAZADA: ['alert', 'peligro', 'Rechazada']
  };
  function chip(p) {
    var v = p.Estado ? N.estadoVisible(p) : { codigo: 'BORRADOR' };
    var e = EST[v.codigo] || ['file', '', v.codigo];
    var txt = e[2] || v.texto.charAt(0) + v.texto.slice(1).toLowerCase().replace(/_/g, ' ');
    return '<span class="estado ' + e[1] + '">' + ic(e[0]) + esc(txt) + '</span>';
  }
  var ESTC = { 'A TIEMPO': ['checkc', 'ok'], 'ATRASADO': ['alert', 'peligro'], 'ENVIADO A TIEMPO - SINCRONIZADO TARDE': ['cloudoff', 'acento'],
    'SIN PARTE (VENCIDO)': ['x', 'peligro'], 'SIN ENVIO (VENCIDO)': ['x', 'peligro'], 'PENDIENTE (EN PLAZO)': ['clock', ''], 'BORRADOR (EN PLAZO)': ['file', ''] };
  function chipCumpl(e) { var m = ESTC[e] || ['clock', '']; return '<span class="estado ' + m[1] + '">' + ic(m[0]) + esc(e.charAt(0) + e.slice(1).toLowerCase()) + '</span>'; }

  // ------------------------------------------------------------ marco
  function marco(titulo, cuerpo, op) {
    op = op || {};
    var s = S();
    var pend = s.outbox.length;
    var online = navigator.onLine;
    var sync = N.ocupado() ? 'Sincronizando…' : (!online ? 'Sin señal' : (pend ? pend + ' por enviar' : 'Al día'));
    var nav = '';
    if (!op.sinNav) {
      var items = rol() === 'OPERADOR'
        ? [['#/inicio', 'home', 'Inicio'], ['#/parte/nuevo', 'plus', 'Nuevo parte'], ['#/partes', 'list', 'Mis partes', obsCount()], ['#/cuenta', 'user', 'Cuenta', s.rechazados.length]]
        : [['#/revisar', 'checkc', 'Revisar', porRevisarCount()], ['#/cumplimiento', 'calendar', 'Cumplimiento'], ['#/mantto', 'wrench', 'Mantenimiento'], ['#/cuenta', 'user', 'Cuenta', s.rechazados.length]];
      var actual = location.hash.split('/').slice(0, 2).join('/');
      if (['#/fallas', '#/plan', '#/falla'].indexOf(actual) >= 0) actual = '#/mantto';
      nav = '<nav class="nav" aria-label="Navegación principal"><div class="nav-in">' + items.map(function (it) {
        var act = actual === it[0] || (it[0] === '#/parte/nuevo' && actual === '#/parte');
        return '<a href="' + it[0] + '"' + (act ? ' aria-current="page"' : '') + '>' + ic(it[1]) + '<span>' + it[2] + '</span>' +
          (it[3] ? '<span class="badge" aria-label="' + it[3] + ' avisos">' + it[3] + '</span>' : '') + '</a>';
      }).join('') + '</div></nav>';
    }
    app.innerHTML = '<div class="app"><header class="cabecera">' +
      (op.volver ? '<button class="volver" data-a="volver" data-h="' + esc(op.volver) + '" aria-label="Volver">' + ic('left') + '</button>' : '<span class="marca">AXION</span>') +
      '<span class="titulo">' + esc(titulo) + '</span>' +
      '<button class="chip-sync ' + (!online ? 'off' : (pend ? 'pend' : '')) + '" data-a="sync" aria-label="Estado de sincronización: ' + sync + '">' +
      ic(online ? (pend ? 'refresh' : 'cloud') : 'cloudoff') + '<span>' + sync + '</span></button></header>' +
      '<main class="contenido" id="main">' + cuerpo + '</main>' + (op.pie || '') + '</div>' + nav;
    hidratarFotos();
  }
  // ------------------------------------------------------------ buscador (administrador y supervisor)
  var busq = {}, busqTimer = null;
  function normBusq(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-_./]/g, ''); }
  /** Barra de búsqueda: filtra por varias palabras a la vez (ej.: "exc 001", "torres", "09/11 noche"). */
  function barraBusq(clave, ph) {
    return '<div class="campo" style="position:sticky;top:0;z-index:2;background:var(--fondo)"><input type="search" data-busq="' + clave + '" value="' + esc(busq[clave] || '') + '" placeholder="' + esc(ph) + '"' +
      ' aria-label="Buscar" autocomplete="off" style="font-size:16px;min-height:46px;padding-left:12px"></div>';
  }
  function coincide(clave, texto) {
    var q = normBusq(busq[clave]).trim();
    if (!q) return true;
    var t = normBusq(texto);
    return q.split(/\s+/).every(function (w) { return t.indexOf(w) >= 0; });
  }
  document.addEventListener('input', function (e) {
    var k = e.target.dataset && e.target.dataset.busq;
    if (!k) return;
    busq[k] = e.target.value;
    clearTimeout(busqTimer);
    busqTimer = setTimeout(function () {
      render();
      var i = document.querySelector('[data-busq="' + k + '"]');
      if (i) { i.focus(); try { i.setSelectionRange(i.value.length, i.value.length); } catch (x) { /* nada */ } }
    }, 250);
  });
  function textoParte(p) {
    var eq = equipo(p.EquipoID);
    return [p.CodigoParte, eq.CodigoInterno, eq.PlacaSerie, eq.Familia, nombreOp(p.OperadorID), fF(p.FechaTrabajo), p.FechaTrabajo, p.Turno, p.Turno === 'DIA' ? 'dia' : 'noche', p.Estado].join(' ');
  }

  function obsCount() { return N.filas('PARTES_DIARIOS', function (p) { return p.Estado === 'OBSERVADO' && p.OperadorID === perfil().OperadorID; }).length; }
  function porRevisarCount() { return N.filas('PARTES_DIARIOS', function (p) { return p.Estado === 'PENDIENTE_REVISION' || p.Estado === 'CORREGIDO'; }).length; }

  // ------------------------------------------------------------ ingreso
  function vIngreso(msg) {
    app.innerHTML = '<main class="ingreso"><div><div class="logo">AXION</div><p class="lema">Partes diarios y control de maquinaria</p></div>' +
      '<form class="tarjeta" id="fIngreso" style="display:grid;gap:14px" novalidate>' +
      '<h2>Ingresar</h2>' +
      '<label class="campo"><span>Número de celular</span><input name="email" type="text" autocomplete="username" inputmode="tel" required placeholder="9XX XXX XXX" value="' + esc(ultimoUsuario()) + '">' +
      '<span class="ayuda">El administrador ingresa con su correo.</span></label>' +
      '<label class="campo"><span>Contraseña</span><input name="codigo" type="password" autocomplete="current-password" required>' +
      '<span class="ayuda">La primera vez use la contraseña que le dio el administrador; luego creará la suya.</span></label>' +
      (msg ? '<div class="msg-error" role="alert">' + ic('alert') + '<span>' + esc(msg) + '</span></div>' : '') +
      '<button class="btn primario ancho" type="submit">Ingresar</button>' +
      '<p class="mini">La primera vez necesita señal. Después la app funciona sin internet.</p></form></main>';
    document.getElementById('fIngreso').onsubmit = function (e) {
      e.preventDefault();
      var f = new FormData(e.target);
      var b = e.target.querySelector('button');
      b.disabled = true; b.textContent = 'Ingresando…';
      var usuario = String(f.get('email')).trim();
      try { localStorage.setItem('axion_usuario', usuario); } catch (x) { /* sin almacenamiento */ }
      claveTemporal = String(f.get('codigo'));
      N.ingresar(usuario, claveTemporal).then(function (r) {
        if (!(r && r.debeCambiar)) { claveTemporal = ''; location.hash = rol() === 'OPERADOR' ? '#/inicio' : '#/revisar'; }
        render();
      }, function (err) { claveTemporal = ''; vIngreso(err.message); });
    };
  }
  function ultimoUsuario() {
    try { return localStorage.getItem('axion_usuario') || ''; } catch (x) { return ''; }
  }

  var claveTemporal = '';
  /** Primer ingreso con la contraseña común: debe crear una personal (el servidor no entrega datos antes). */
  function vCambiarClave(msg) {
    app.innerHTML = '<main class="ingreso"><div><div class="logo">AXION</div><p class="lema">Bienvenido, ' + esc(String(perfil().Nombre || '').split(' ').slice(-2).join(' ')) + '</p></div>' +
      '<form class="tarjeta" id="fClave" style="display:grid;gap:14px" novalidate>' +
      '<h2>Cree su contraseña personal</h2>' +
      '<p class="sub">Ingresó con la contraseña común. Para que sus partes queden firmados solo por usted, cree una contraseña que nadie más conozca.</p>' +
      (claveTemporal ? '' : '<label class="campo"><span>Contraseña actual (la común)</span><input name="actual" type="password" autocomplete="current-password" required></label>') +
      '<label class="campo"><span>Nueva contraseña</span><input name="nueva" type="password" autocomplete="new-password" minlength="6" required><span class="ayuda">Mínimo 6 caracteres. No la comparta.</span></label>' +
      '<label class="campo"><span>Repita la nueva contraseña</span><input name="repite" type="password" autocomplete="new-password" required></label>' +
      (msg ? '<div class="msg-error" role="alert">' + ic('alert') + '<span>' + esc(msg) + '</span></div>' : '') +
      '<button class="btn primario ancho" type="submit">Guardar y entrar</button>' +
      '<button class="btn fantasma ancho" type="button" data-a="salir">Cancelar</button></form></main>';
    document.getElementById('fClave').onsubmit = function (e) {
      e.preventDefault();
      var f = new FormData(e.target);
      var actual = claveTemporal || String(f.get('actual') || '');
      var nueva = String(f.get('nueva') || ''), repite = String(f.get('repite') || '');
      if (nueva.length < 6) { vCambiarClave('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
      if (nueva !== repite) { vCambiarClave('Las contraseñas no coinciden.'); return; }
      var b = e.target.querySelector('button[type=submit]');
      b.disabled = true; b.textContent = 'Guardando…';
      N.cambiarClave(actual, nueva).then(function () {
        claveTemporal = '';
        toast('Contraseña creada');
        location.hash = rol() === 'OPERADOR' ? '#/inicio' : '#/revisar';
        render();
      }, function (err) { vCambiarClave(err.message); });
    };
  }

  // ------------------------------------------------------------ operador: inicio
  /** Turno y fecha que eligió el operador en Inicio (se recuerdan mientras la app esté abierta). */
  function selInicio(nuevo) {
    var s = null;
    try { s = JSON.parse(sessionStorage.getItem('axion_ini') || 'null'); } catch (e) { s = null; }
    if (!s) { var pr = R.proponer(Date.now()); s = { turno: pr.turno, fecha: pr.fecha }; }
    if (nuevo) { s = Object.assign(s, nuevo); try { sessionStorage.setItem('axion_ini', JSON.stringify(s)); } catch (e) { /* nada */ } }
    return s;
  }

  /**
   * ¿Ya hay un parte en esa fecha y turno para este equipo (de cualquier operador) o para este operador?
   * Usa lo que el servidor informa (OCUPADOS) y los partes del celular. Devuelve {CodigoParte, Operador, ParteID, propio} o null.
   */
  function ocupado(equipoID, fecha, tno, excluirID) {
    var yo = perfil().OperadorID;
    var locales = N.filas('PARTES_DIARIOS', function (x) { return x.Estado !== 'ANULADO' && !x._error; }).map(function (x) {
      return { ParteID: x.ParteID, EquipoID: x.EquipoID, FechaTrabajo: x.FechaTrabajo, Turno: x.Turno, OperadorID: x.OperadorID, CodigoParte: x.CodigoParte, Estado: x.Estado };
    });
    var hit = locales.concat(cat().OCUPADOS || []).filter(function (x) {
      return x.ParteID !== excluirID && x.FechaTrabajo === fecha && x.Turno === tno && x.Estado !== 'ANULADO' &&
        (x.OperadorID === yo || (equipoID && x.EquipoID === equipoID)) && (N.fila('PARTES_DIARIOS', x.ParteID) || {}).Estado !== 'ANULADO';
    })[0];
    if (!hit) return null;
    return { ParteID: hit.ParteID, CodigoParte: hit.CodigoParte, Operador: hit.OperadorID === yo ? 'usted' : (hit.Operador || nombreOp(hit.OperadorID)), propio: hit.OperadorID === yo, EquipoID: hit.EquipoID };
  }
  function textoOcupado(o, fecha, tno) {
    return 'Ya existe el parte ' + (o.CodigoParte || '') + ' del ' + fF(fecha) + ' turno ' + (tno === 'DIA' ? 'DÍA' : 'NOCHE') + (o.propio ? ' (suyo).' : ', de ' + o.Operador + '.') +
      ' Revise la fecha y el turno; si el otro está mal, avise al administrador para que lo anule.';
  }

  /** Inicio del operador en 3 toques: 1) turno, 2) fecha, 3) equipo → foto del parte. */
  function vInicio() {
    var yo = perfil().OperadorID;
    var mis = (cat().ASIGNACIONES || []).filter(function (a) { return a.OperadorID === yo; });
    var turnosMios = ['DIA', 'NOCHE'].filter(function (t) { return mis.some(function (a) { return a.Turno === t; }); });
    var s = selInicio();
    if (turnosMios.length && turnosMios.indexOf(s.turno) < 0) s = selInicio({ turno: turnosMios[0] });
    var max = hoy(), min = R.sumarDias(hoy(), -Number(cfg().DIAS_MAX_RETRASO_REGISTRO || 2));
    if (s.fecha > max || s.fecha < min) s = selInicio({ fecha: R.proponer(Date.now()).fecha });
    var paso = function (n, t) { return '<div class="etiqueta-seccion" style="font-size:14px">' + n + '. ' + t + '</div>'; };
    var h = paso(1, '¿Qué turno trabajó?') + '<div class="dos">' + turnosMios.map(function (t) {
      return '<button type="button" class="btn enorme ' + (t === s.turno ? 'primario' : '') + '" data-a="iniTurno" data-v="' + t + '" aria-pressed="' + (t === s.turno) + '">' +
        ic(t === 'DIA' ? 'sun' : 'moon') + (t === 'DIA' ? 'DÍA' : 'NOCHE') + '</button>';
    }).join('') + '</div>' +
      paso(2, 'Fecha del parte') + '<label class="campo"><input id="iniFecha" type="date" value="' + s.fecha + '" min="' + min + '" max="' + max + '" style="font-size:18px;min-height:52px"></label>';
    var hecho = N.filas('PARTES_DIARIOS', function (x) { return x.OperadorID === yo && x.FechaTrabajo === s.fecha && x.Turno === s.turno && x.Estado !== 'ANULADO'; })[0];
    var mioSrv = hecho ? null : ocupado(null, s.fecha, s.turno);  // su parte está en el servidor pero no en este celular
    if (hecho) {
      h += paso(3, 'Su parte de ese turno') + tarjetaParte(hecho) +
        (hecho._error ? '<div class="aviso peligro">' + ic('alert') + '<div><strong>Este borrador fue rechazado:</strong> ' + esc(hecho._error) + '<div class="sub">Cambie la fecha o el turno, o elimínelo.</div></div></div>' : '') +
        (editable(hecho) ? '<a class="btn primario ancho enorme" href="' + rutaParte(hecho.ParteID, 2) + '">' + ic('camera') + 'Continuar parte</a>' : '') + botonBorrarParte(hecho);
    } else if (mioSrv && mioSrv.propio) {
      h += paso(3, 'Su parte de ese turno') + '<div class="aviso">' + ic('checkc') + '<div><strong>Ya registró el parte ' + esc(mioSrv.CodigoParte) + '.</strong><div class="sub">Si quería otro día u otro turno, cámbielos arriba.</div></div></div>';
    } else {
      var usados = {};  // equipo que más recientemente usó: primero en la lista
      N.filas('PARTES_DIARIOS', function (x) { return x.OperadorID === yo && x.Estado !== 'ANULADO'; }).forEach(function (x) {
        if (!usados[x.EquipoID] || x.FechaTrabajo > usados[x.EquipoID]) usados[x.EquipoID] = x.FechaTrabajo;
      });
      var delTurno = mis.filter(function (a) { return a.Turno === s.turno && a.FechaInicio <= s.fecha && (!a.FechaFin || a.FechaFin >= s.fecha); })
        .sort(function (a, b) { return String(usados[b.EquipoID] || '').localeCompare(String(usados[a.EquipoID] || '')) || String(equipo(a.EquipoID).CodigoInterno).localeCompare(String(equipo(b.EquipoID).CodigoInterno)); });
      h += paso(3, '¿Qué equipo operó?') + (delTurno.length ? '<div class="lista">' + delTurno.map(function (a, i) {
        var eq = equipo(a.EquipoID);
        var oc = ocupado(a.EquipoID, s.fecha, s.turno);
        if (oc) return '<div class="tarjeta fila" style="padding:12px 14px;opacity:.6"><div class="icono-caja">' + ic('checkc') + '</div><div class="crece"><h3>' + esc(eq.CodigoInterno) + '</h3>' +
          '<div class="mini">Ya tiene parte en este turno: ' + esc(oc.Operador) + '</div></div></div>';
        return '<a class="tarjeta tocable fila' + (i === 0 && usados[a.EquipoID] ? ' destacada' : '') + '" style="text-decoration:none;color:inherit;padding:12px 14px" href="#/parte/nuevo?asig=' + a.AsignacionID + '&fecha=' + s.fecha + '">' +
          '<div class="icono-caja acento">' + ic(['VOLQUETE', 'CISTERNA', 'CISTERNA DE COMBUSTIBLE', 'CAMION BARANDA', 'CAMION GRUA'].indexOf(eq.Familia) >= 0 ? 'truck' : 'gauge') + '</div>' +
          '<div class="crece"><h3>' + esc(eq.CodigoInterno) + '</h3><div class="mini">' + esc(eq.Familia) + ' · ' + esc(eq.Marca + ' ' + eq.Modelo) +
          (usados[a.EquipoID] ? ' · último uso ' + fF(usados[a.EquipoID]) : '') + '</div></div>' + ic('camera') + '</a>';
      }).join('') + '</div><p class="mini" style="text-align:center">Al tocar su equipo, tome la foto de su parte de papel.</p>'
        : '<div class="vacio">' + ic('alert') + '<p>No tiene equipos autorizados en ese turno y fecha. Avise a su supervisor.</p></div>');
    }
    var obs = N.filas('PARTES_DIARIOS', function (p) { return p.Estado === 'OBSERVADO' && p.OperadorID === yo; });
    var avisos = obs.map(function (p) {
      return '<a class="aviso acento" href="#/parte/' + p.ParteID + '" style="text-decoration:none;color:inherit">' + ic('alert') +
        '<div><strong>Parte observado: ' + esc(p.CodigoParte) + '</strong><div class="sub">' + esc(p.Observaciones || '') + '</div></div></a>';
    }).join('');
    var pend = N.filas('PARTES_DIARIOS', function (p) { return p.OperadorID === yo && p.Estado === 'BORRADOR' && !(p.FechaTrabajo === s.fecha && p.Turno === s.turno); });
    var avisoPend = pend.length ? '<div class="aviso acento">' + ic('alert') + '<div><strong>Tiene ' + pend.length + ' parte(s) guardado(s) sin enviar.</strong><div class="sub">Ábralos abajo, en "Últimos partes", y pulse ENVIAR.</div></div></div>' : '';
    var rech = S().rechazados.length ? '<a class="aviso peligro" href="#/cuenta" style="color:inherit;text-decoration:none">' + ic('alert') + '<div><strong>' + S().rechazados.length + ' cambio(s) rechazado(s) por el servidor</strong><div class="sub">Toque para ver el motivo.</div></div></a>' : '';
    marco('Inicio', '<div><div class="sub">Hola,</div><h1>' + esc(String(perfil().Nombre || '').replace('[DEMO] ', '')) + '</h1></div>' + rech + avisos + avisoPend +
      (turnosMios.length ? h : '<div class="vacio">' + ic('alert') + '<p>No tiene equipos asignados. Avise a su supervisor.</p></div>') + ultimos());
    var fi = document.getElementById('iniFecha');
    if (fi) fi.onchange = function () { if (fi.value && fi.value >= min && fi.value <= max) { selInicio({ fecha: fi.value }); render(); } else toast('Elija una fecha entre ' + fF(min) + ' y ' + fF(max)); };
  }

  function vInicioAnterior() {
    var pr = R.proponer(Date.now());
    var mis = (cat().ASIGNACIONES || []).filter(function (a) { return a.OperadorID === perfil().OperadorID; });
    var turnosMios = Array.from(new Set(mis.map(function (a) { return a.Turno; })));
    var tarjetas = turnosMios.map(function (tu) {
      var fecha = tu === pr.turno ? pr.fecha : (tu === 'DIA' ? hoy() : pr.fecha);
      var hecho = N.filas('PARTES_DIARIOS', function (x) {
        return x.OperadorID === perfil().OperadorID && x.FechaTrabajo === fecha && x.Turno === tu && x.Estado !== 'ANULADO';
      })[0];
      var delTurno = mis.filter(function (a) { return a.Turno === tu; });
      if (hecho) {
        return '<div class="etiqueta-seccion">' + esc(turno(tu).Nombre || tu) + ' · ' + fF(fecha) + '</div>' + tarjetaParte(hecho) +
          (editable(hecho) ? '<a class="btn primario ancho" href="' + rutaParte(hecho.ParteID, 2) + '">' + ic('edit') + 'Continuar parte</a>' : '') +
          botonBorrarParte(hecho);
      }
      if (delTurno.length <= 2) return delTurno.map(function (a) { return tarjetaAsignacion(a, fecha, tu === pr.turno); }).join('');
      return '<div class="etiqueta-seccion">' + esc(turno(tu).Nombre || tu) + ' · elija el equipo que opera hoy (' + delTurno.length + ')</div>' +
        '<div class="lista">' + delTurno.map(function (a) {
          var eq = equipo(a.EquipoID);
          return '<a class="tarjeta tocable fila" style="text-decoration:none;color:inherit;padding:12px 14px" href="#/parte/nuevo?asig=' + a.AsignacionID + '&fecha=' + fecha + '">' +
            '<div class="icono-caja acento">' + ic(['VOLQUETE', 'CISTERNA', 'CISTERNA DE COMBUSTIBLE', 'CAMION BARANDA', 'CAMION GRUA'].indexOf(eq.Familia) >= 0 ? 'truck' : 'gauge') + '</div>' +
            '<div class="crece"><h3>' + esc(eq.CodigoInterno) + '</h3><div class="mini">' + esc(eq.Familia) + ' · ' + esc(eq.Marca + ' ' + eq.Modelo) + '</div></div>' + ic('right') + '</a>';
        }).join('') + '</div>';
    }).join('');
    function tarjetaAsignacion(a, fecha, actual) {
      var eq = equipo(a.EquipoID);
      var p = N.filas('PARTES_DIARIOS', function (x) { return x.AsignacionID === a.AsignacionID && x.FechaTrabajo === fecha && x.Estado !== 'ANULADO'; })[0];
      return '<article class="tarjeta' + (actual && !p ? ' destacada' : '') + '"><div class="fila"><div class="icono-caja acento">' + ic(eq.Familia === 'VOLQUETE' ? 'truck' : 'gauge') + '</div>' +
        '<div class="crece"><h3>' + esc(eq.CodigoInterno) + ' · ' + esc(eq.Familia) + '</h3><div class="sub">' + esc(nombreObra(a.ObraID)) + ' · ' + esc(turno(a.Turno).Nombre || a.Turno) + '</div>' +
        '<div class="mini">Fecha de trabajo ' + fF(fecha) + '</div></div>' + (p ? chip(p) : '') + '</div>' +
        '<div class="acciones" style="margin-top:12px">' + (p
          ? '<a class="btn ' + (editable(p) ? 'primario' : '') + ' ancho" href="' + (editable(p) ? rutaParte(p.ParteID, 2) : '#/parte/' + p.ParteID) + '">' + (editable(p) ? ic('edit') + 'Continuar parte' : ic('right') + 'Ver parte') + '</a>' + botonBorrarParte(p)
          : '<a class="btn ' + (actual ? 'primario' : '') + ' ancho" href="#/parte/nuevo?asig=' + a.AsignacionID + '&fecha=' + fecha + '">' + ic('plus') + 'Iniciar parte</a>') + '</div></article>';
    }
    var obs = N.filas('PARTES_DIARIOS', function (p) { return p.Estado === 'OBSERVADO' && p.OperadorID === perfil().OperadorID; });
    var avisos = obs.map(function (p) {
      return '<a class="aviso acento" href="#/parte/' + p.ParteID + '" style="text-decoration:none;color:inherit">' + ic('alert') +
        '<div><strong>Parte observado: ' + esc(p.CodigoParte) + '</strong><div class="sub">' + esc(p.Observaciones || '') + '</div></div></a>';
    }).join('');
    var rech = S().rechazados.length ? '<a class="aviso peligro" href="#/cuenta" style="color:inherit;text-decoration:none">' + ic('alert') + '<div><strong>' + S().rechazados.length + ' cambio(s) rechazado(s) por el servidor</strong><div class="sub">Toque para ver el motivo.</div></div></a>' : '';
    marco('Inicio', '<div><div class="sub">Hola,</div><h1>' + esc(String(perfil().Nombre || '').replace('[DEMO] ', '')) + '</h1></div>' + rech + avisos +
      '<div class="etiqueta-seccion">Mis equipos autorizados</div>' +
      (tarjetas || '<div class="vacio">' + ic('alert') + '<p>No tiene equipos asignados. Avise a su supervisor.</p></div>') +
      ultimos());
  }
  function ultimos() {
    var l = N.filas('PARTES_DIARIOS', function (p) { return p.OperadorID === perfil().OperadorID && p.Estado !== 'ANULADO'; })
      .sort(function (a, b) { return (b.FechaTrabajo + b.Turno).localeCompare(a.FechaTrabajo + a.Turno); }).slice(0, 3);
    if (!l.length) return '';
    return '<div class="etiqueta-seccion">Últimos partes</div><div class="lista">' + l.map(tarjetaParte).join('') + '</div>';
  }
  function tarjetaParte(p) {
    var eq = equipo(p.EquipoID);
    var quien = rol() === 'OPERADOR' ? (eq.CodigoInterno || '') : nombreOp(p.OperadorID) + ' · ' + (eq.CodigoInterno || p.EquipoID);
    return '<a class="tarjeta tocable" href="#/parte/' + p.ParteID + '" style="text-decoration:none;color:inherit;display:block">' +
      '<div class="entre"><div style="min-width:0"><div class="codigo">' + esc(p.CodigoParte || 'Nuevo parte') + '</div><h3>' + esc(quien) + '</h3>' +
      '<div class="mini">' + fF(p.FechaTrabajo) + ' · ' + esc(p.Turno) + ' · ' + n1(p.HorasTrabajadas) + ' h</div>' +
      (p._error ? '<div class="msg-error">' + ic('alert') + esc(p._error) + '</div>' : '') + '</div>' + chip(p) + '</div></a>';
  }

  function vMisPartes() {
    // los anulados ya no se muestran al operador (el administrador los anuló: no cuentan)
    var l = N.filas('PARTES_DIARIOS', function (p) { return p.OperadorID === perfil().OperadorID && p.Estado !== 'ANULADO'; })
      .sort(function (a, b) { return (b.FechaTrabajo + b.Turno).localeCompare(a.FechaTrabajo + a.Turno); });
    var grupos = [['Para completar o corregir', function (p) { return editable(p); }],
      ['En revisión', function (p) { return !editable(p) && ['PENDIENTE_REVISION', 'CORREGIDO', 'BORRADOR', 'OBSERVADO'].indexOf(p.Estado) >= 0; }],
      ['Aprobados', function (p) { return p.Estado === 'APROBADO'; }]];
    marco('Mis partes', l.length ? grupos.map(function (g) {
      var x = l.filter(g[1]);
      return x.length ? '<div class="etiqueta-seccion">' + g[0] + ' (' + x.length + ')</div><div class="lista">' + x.map(tarjetaParte).join('') + '</div>' : '';
    }).join('') : '<div class="vacio">' + ic('file') + '<p>Aún no tiene partes.</p><a class="btn primario" href="#/parte/nuevo">' + ic('plus') + 'Nuevo parte</a></div>');
  }

  // ------------------------------------------------------------ asistente de 8 pasos
  var PASOS = ['Identificación', 'Equipo', 'Lecturas', 'Actividades', 'Viajes y combustible', 'Fallas', 'Fotos', 'Resumen y envío'];

  function nuevoParte(q) {
    var pr = R.proponer(Date.now());
    var a = q.asig ? busca('ASIGNACIONES', 'AsignacionID', q.asig) : null;
    if (a && a.AsignacionID) {  // no crear un parte que el servidor rechazaría por repetido
      var oc = ocupado(a.EquipoID, q.fecha || pr.fecha, a.Turno);
      if (oc) { toast(textoOcupado(oc, q.fecha || pr.fecha, a.Turno)); location.replace('#/inicio'); return; }
    }
    var id = N.nuevoID('PD');
    tmp[id] = { ParteID: id, OperadorID: perfil().OperadorID, FechaTrabajo: q.fecha || pr.fecha, Turno: a ? a.Turno : pr.turno,
      AsignacionID: a ? a.AsignacionID : '', FrenteID: a ? a.FrenteID : '', FechaCreacion: R.isoLima(Date.now()), Estado: '' };
    // pantalla única: al tocar su equipo en Inicio, el parte se crea al instante (sin pasos)
    if (a && modo() === 'uno') { guardarParte(Object.assign({}, tmp[id])); location.replace('#/parte/' + id + '/uno'); return; }
    location.replace(rutaParte(id, 1));
  }

  function guardarParte(p) {
    if (!p.AsignacionID) { tmp[p.ParteID] = p; return p; }
    var a = busca('ASIGNACIONES', 'AsignacionID', p.AsignacionID);
    var eq = equipo(a.EquipoID);
    var completo = Object.assign({}, p, { EquipoID: a.EquipoID, ObraID: a.ObraID, SupervisorID: a.SupervisorID,
      EmpresaID: eq.EmpresaPropietariaID, CodigoParte: R.codigoParte(eq.CodigoInterno, p.FechaTrabajo, p.Turno), Estado: p.Estado || 'BORRADOR',
      CambioPorIA: p._porIA === true });  // solo si la IA cambió la fecha: el servidor no rechaza todo si esa fecha ya está ocupada
    delete completo._porIA;
    delete tmp[p.ParteID];
    return N.guardar('PARTES_DIARIOS', completo);
  }

  function vAsistente(id, paso) {
    var p = getParte(id);
    if (!p) { location.replace('#/inicio'); return; }
    if (p.Estado && !editable(p)) { location.replace('#/parte/' + id); return; }
    modo('detallado');
    paso = Math.max(1, Math.min(8, paso));
    if (paso > 2 && !p.AsignacionID) paso = 2;
    var cuerpo = '<div class="progreso"><div class="entre"><span class="sub">Paso ' + paso + ' de 8</span><span class="codigo">' + esc(p.CodigoParte || 'Parte nuevo') + '</span></div>' +
      '<div class="barra" role="progressbar" aria-valuemin="1" aria-valuemax="8" aria-valuenow="' + paso + '"><i style="width:' + (paso * 12.5) + '%"></i></div>' +
      '<div class="pasos">' + PASOS.map(function (t, i) {
        return '<button type="button" data-a="ir" data-h="#/parte/' + id + '/paso/' + (i + 1) + '"' + (i + 1 === paso ? ' aria-current="step"' : '') + (i + 1 < paso ? ' class="hecho"' : '') + (i > 0 && !p.AsignacionID ? ' disabled' : '') + '>' + (i + 1) + '. ' + t + '</button>';
      }).join('') + '</div></div>' +
      '<h1>' + PASOS[paso - 1] + '</h1><form id="fPaso" novalidate style="display:grid;gap:16px">' + PASO[paso](p) + '</form>';
    var pie = '<div class="pie-asistente">' + (paso > 1 ? '<button class="btn" data-a="pasoAnt" data-id="' + id + '" data-p="' + paso + '">' + ic('left') + 'Atrás</button>' : '<a class="btn" href="#/inicio">Salir</a>') +
      (paso < 8 ? '<button class="btn primario" data-a="pasoSig" data-id="' + id + '" data-p="' + paso + '">Guardar y seguir' + ic('right') + '</button>'
        : '<button class="btn primario" data-a="enviar" data-id="' + id + '"' + (puedeEnviar(p).ok ? '' : ' disabled') + '>' + ic('send') + (p.Estado === 'OBSERVADO' ? 'Enviar corrección' : 'Enviar parte') + '</button>') + '</div>';
    cuerpo += p.AsignacionID ? '<p class="mini" style="text-align:center"><a href="#/parte/' + id + '/rapido/' + (paso <= 2 ? 1 : paso <= 5 ? 2 : 3) + '" data-a="rapidoModo">Volver al modo rápido (3 pasos)</a></p>' : '';
    marco(p.CodigoParte || 'Nuevo parte', cuerpo, { volver: '#/inicio', pie: pie });
    var f = document.getElementById('fPaso');
    f.oninput = function (e) { if (e.target.name) { vivo(p, paso); respaldarEscrito(); } };
    f.onchange = respaldarEscrito;
  }

  function valoresForm() {
    var o = {};
    document.querySelectorAll('#fPaso [name]').forEach(function (el) {
      if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; else if (!(el.name in o)) o[el.name] = ''; return; }
      o[el.name] = el.type === 'checkbox' ? el.checked : el.value;
    });
    return o;
  }

  var PASO = {
    1: function (p) {
      var min = R.sumarDias(hoy(), -Number(cfg().DIAS_MAX_RETRASO_REGISTRO || 2));
      var bloq = !!p.Estado && p.Estado !== 'BORRADOR';
      return '<div class="tarjeta"><dl class="datos-def"><dt>Operador</dt><dd>' + esc(perfil().Nombre) + '</dd><dt>Correo</dt><dd>' + esc(perfil().Email) + '</dd></dl></div>' +
        '<label class="campo"><span>Fecha de trabajo <span class="req">*</span></span><input name="FechaTrabajo" type="date" min="' + min + '" max="' + hoy() + '" value="' + esc(p.FechaTrabajo) + '"' + (bloq ? ' disabled' : '') + '>' +
        '<span class="ayuda">Es el día en que EMPEZÓ el turno. El turno noche del 12 termina el 13, pero su fecha es el 12.</span></label>' +
        '<div class="campo"><span>Turno <span class="req">*</span></span><div class="segmento" role="group" aria-label="Turno">' +
        (cat().TURNOS || []).map(function (t) { return '<button type="button" data-a="turno" data-v="' + t.TurnoID + '" aria-pressed="' + (p.Turno === t.TurnoID) + '"' + (bloq ? ' disabled' : '') + '>' + esc(t.Nombre) + ' · ' + t.HoraInicio + '–' + t.HoraFin + '</button>'; }).join('') +
        '</div><input type="hidden" name="Turno" value="' + esc(p.Turno) + '"></div>';
    },
    2: function (p) {
      var asig = (cat().ASIGNACIONES || []).filter(function (a) {
        return a.OperadorID === perfil().OperadorID && a.Turno === p.Turno && a.FechaInicio <= p.FechaTrabajo && (!a.FechaFin || a.FechaFin >= p.FechaTrabajo);
      });
      if (!asig.length) return '<div class="aviso peligro">' + ic('alert') + '<div><strong>No tiene equipos autorizados para el turno ' + esc(p.Turno) + ' del ' + fF(p.FechaTrabajo) + '.</strong><div class="sub">Revise el turno en el paso 1 o avise a su supervisor.</div></div></div>';
      if (asig.length === 1 && !p.AsignacionID) { p.AsignacionID = asig[0].AsignacionID; p.FrenteID = p.FrenteID || asig[0].FrenteID; }
      var a = busca('ASIGNACIONES', 'AsignacionID', p.AsignacionID);
      var bloq = !!p.Estado && p.Estado !== 'BORRADOR';
      return '<div class="campo" role="radiogroup" aria-label="Equipo autorizado"><span>Equipo autorizado <span class="req">*</span></span>' + asig.map(function (x) {
        var eq = equipo(x.EquipoID);
        return '<label class="opcion" aria-checked="' + (x.AsignacionID === p.AsignacionID) + '"><input type="radio" name="AsignacionID" value="' + x.AsignacionID + '"' + (x.AsignacionID === p.AsignacionID ? ' checked' : '') + (bloq ? ' disabled' : '') + '>' +
          '<div><strong>' + esc(eq.CodigoInterno) + '</strong> · ' + esc(eq.Familia) + '<div class="mini">' + esc(eq.Marca + ' ' + eq.Modelo) + ' · ' + esc(nombreObra(x.ObraID)) + '</div></div></label>';
      }).join('') + '<span class="ayuda">Solo aparecen los equipos que el administrador le asignó.</span></div>' +
        (a.ObraID ? '<label class="campo"><span>Frente de trabajo <span class="req">*</span></span><select name="FrenteID">' + (cat().FRENTES || []).filter(function (f) { return f.ObraID === a.ObraID; }).map(function (f) {
          return '<option value="' + f.FrenteID + '"' + (f.FrenteID === p.FrenteID ? ' selected' : '') + '>' + esc(f.Nombre) + '</option>';
        }).join('') + '</select></label>' +
        '<div class="tarjeta"><dl class="datos-def"><dt>Obra</dt><dd>' + esc(nombreObra(a.ObraID)) + '</dd><dt>Supervisor</dt><dd>' + esc(busca('SUPERVISORES', 'SupervisorID', a.SupervisorID).Nombre || '') + '</dd></dl></div>' : '');
    },
    3: function (p) {
      var eq = equipo(p.EquipoID);
      var h = '';
      var fila = function (campoI, campoF, unidad, tipoI, tipoF, etiqueta) {
        return '<div class="tarjeta" style="display:grid;gap:12px"><h3>' + etiqueta + '</h3><div class="dos">' +
          '<label class="campo"><span>Inicial <span class="req">*</span></span><input name="' + campoI + '" type="number" inputmode="decimal" step="0.1" min="0" value="' + esc(p[campoI]) + '"></label>' +
          '<label class="campo"><span>Final</span><input name="' + campoF + '" type="number" inputmode="decimal" step="0.1" min="0" value="' + esc(p[campoF]) + '"></label></div>' +
          '<div class="lista">' + botonFoto(p, tipoI, 'Foto ' + etiqueta.split(' ')[0].toLowerCase() + ' inicial') + botonFoto(p, tipoF, 'Foto ' + etiqueta.split(' ')[0].toLowerCase() + ' final') + '</div>' +
          '<div class="sub" id="calc-' + campoI + '"></div></div>';
      };
      if (eq.TieneHorometro) h += fila('HorometroInicial', 'HorometroFinal', 'h', 'HOROMETRO_INICIAL', 'HOROMETRO_FINAL', 'Horómetro (horas)');
      if (eq.TieneOdometro) h += fila('OdometroInicial', 'OdometroFinal', 'km', 'ODOMETRO_INICIAL', 'ODOMETRO_FINAL', 'Odómetro (km)');
      if (eq.UltimoHorometro !== '' && eq.UltimoHorometro !== undefined) h += '<p class="mini">Última lectura recibida del equipo: horómetro ' + n1(eq.UltimoHorometro) + (eq.UltimoOdometro !== '' && eq.UltimoOdometro !== undefined ? ' · odómetro ' + n1(eq.UltimoOdometro) : '') + '.</p>';
      h += '<div id="alertasLect"></div>' +
        '<div id="excep" class="tarjeta" style="display:grid;gap:12px"><label class="check"><input type="checkbox" name="ExcepcionLectura"' + (p.ExcepcionLectura ? ' checked' : '') + '><span>La lectura es correcta aunque no coincida (excepción)</span></label>' +
        '<label class="campo"><span>Motivo de la excepción</span><textarea name="MotivoExcepcion" placeholder="Ej.: el turno anterior no sincronizó; se cambió el horómetro…">' + esc(p.MotivoExcepcion) + '</textarea><span class="ayuda">Mínimo 15 letras. El supervisor lo revisará.</span></label></div>';
      setTimeout(function () { vivo(p, 3); }, 0);
      return h;
    },
    4: function (p) {
      var acts = N.hijos('ACTIVIDADES', p.ParteID).sort(function (a, b) { return R.relInicio(a.HoraInicio, turno(p.Turno).HoraInicio) - R.relInicio(b.HoraInicio, turno(p.Turno).HoraInicio); });
      var al = R.alertasActividades(acts, turno(p.Turno), catAct(), cfg());
      var prod = acts.filter(function (a) { var t = (catAct()[a.ActividadCatID] || {}).TipoActividad; return t === 'PRODUCTIVA' || t === 'SERVICIO'; })
        .reduce(function (s, a) { return s + Number(a.DuracionHoras || 0); }, 0);
      var lp = ultimaLecturaParte(p.ParteID);
      var bannerIA = N.iaLista() || lp ? '<a class="aviso acento" href="#/parte/' + p.ParteID + '/ia" style="text-decoration:none;color:inherit">' + ic('camera') +
        '<div class="crece"><strong>' + (lp ? (lp.Estado === 'CONFIRMADA' ? 'Parte de papel leído y confirmado' : 'La IA leyó su parte de papel: revíselo y confírmelo') : '¿Llenó el parte en papel?') + '</strong>' +
        '<div class="sub">' + (lp ? esc(lp.Resumen || '') : 'Tómele una foto y la inteligencia artificial completa lecturas, actividades y viajes. Usted revisa y confirma.') + '</div></div>' + ic('right') + '</a>' : '';
      return bannerIA + '<p class="sub">Registre cada actividad con su hora. Las horas productivas no son las del horómetro.</p>' +
        '<div class="lista">' + (acts.map(function (a) {
          var c = catAct()[a.ActividadCatID] || {};
          return '<div class="tarjeta"><div class="entre"><div><h3>' + esc(a.Descripcion || c.Nombre || 'Actividad') + '</h3><div class="mini num">' + horasAct(a) + (a.DuracionHoras ? ' · ' + n1(a.DuracionHoras) + ' h' : '') + (a.CantidadProducida !== '' && a.CantidadProducida !== undefined ? ' · ' + n1(a.CantidadProducida) + ' ' + esc(a.Unidad) : '') + '</div>' +
            (al[a.ActividadID] ? '<div class="msg-error">' + ic('alert') + esc(al[a.ActividadID]) + '</div>' : '') + (a._error ? '<div class="msg-error">' + ic('alert') + esc(a._error) + '</div>' : '') + '</div>' +
            '<div class="fila"><button type="button" class="btn chico fantasma" data-a="actForm" data-id="' + p.ParteID + '" data-k="' + a.ActividadID + '" aria-label="Editar actividad">' + ic('edit') + '</button>' +
            '<button type="button" class="btn chico fantasma" data-a="borrar" data-t="ACTIVIDADES" data-k="' + a.ActividadID + '" aria-label="Eliminar actividad">' + ic('trash') + '</button></div></div></div>';
        }).join('') || '<div class="vacio">' + ic('activity') + '<p>Sin actividades todavía.</p></div>') + '</div>' +
        '<button type="button" class="btn ancho" data-a="actForm" data-id="' + p.ParteID + '">' + ic('plus') + 'Agregar actividad</button>' +
        '<p class="mini">Horas productivas registradas: <strong class="num">' + n1(prod) + ' h</strong></p>';
    },
    5: function (p) { return seccionViajes(p, true) + seccionCombustible(p); },
    6: function (p) {
      var fs = N.filas('FALLAS', function (f) { return f.ParteID === p.ParteID; });
      var vinc = N.hijos('FALLAS_PARTES', p.ParteID).filter(function (v) { var f = N.fila('FALLAS', v.FallaID); return f && f.ParteID !== p.ParteID; });
      var abiertas = N.filas('FALLAS', function (f) { return f.EquipoID === p.EquipoID && f.Estado !== 'CERRADA' && f.ParteID !== p.ParteID && !vinc.some(function (v) { return v.FallaID === f.FallaID; }); });
      return '<div class="lista">' + fs.map(function (f) {
        return '<div class="tarjeta"><div class="entre"><div><h3>' + esc(f.Componente) + '</h3><div class="mini">' + esc(busca('SISTEMAS_FALLA', 'SistemaID', f.SistemaID).Nombre) + ' · desde ' + fFH(f.FechaHoraInicio) + '</div><div class="sub">' + esc(f.Descripcion) + '</div>' + (f._error ? '<div class="msg-error">' + esc(f._error) + '</div>' : '') + '</div>' +
          '<span class="estado alerta">' + ic('wrench') + esc(f.Estado) + '</span></div><div style="margin-top:10px">' + botonFoto(p, 'FALLA', 'Foto de la falla', { FallaID: f.FallaID }) + '</div></div>';
      }).join('') + vinc.map(function (v) {
        var f = N.fila('FALLAS', v.FallaID) || {};
        return '<div class="tarjeta"><div class="entre"><div><h3>' + ic('link') + ' ' + esc(f.Componente) + ' (continúa)</h3><div class="mini">' + n1(v.HorasParadaEnTurno) + ' h de parada en este turno</div></div>' +
          '<button type="button" class="btn chico fantasma" data-a="borrar" data-t="FALLAS_PARTES" data-k="' + v.FallaParteID + '" aria-label="Quitar vínculo">' + ic('trash') + '</button></div></div>';
      }).join('') + '</div>' +
        (!fs.length && !vinc.length ? '<div class="vacio">' + ic('checkc') + '<p>Sin fallas en este turno.</p></div>' : '') +
        '<button type="button" class="btn ancho" data-a="fallaForm" data-id="' + p.ParteID + '">' + ic('wrench') + 'Reportar falla nueva</button>' +
        (abiertas.length ? '<button type="button" class="btn ancho" data-a="vincForm" data-id="' + p.ParteID + '">' + ic('link') + 'Vincular falla que continúa (' + abiertas.length + ')</button>' : '');
    },
    7: function (p) {
      var eq = equipo(p.EquipoID);
      var req = [];
      if (cfg().FOTO_HOROMETRO_OBLIGATORIA === 'SI' && eq.TieneHorometro) req.push(['HOROMETRO_INICIAL', 'Horómetro inicial'], ['HOROMETRO_FINAL', 'Horómetro final']);
      if (cfg().FOTO_ODOMETRO_OBLIGATORIA === 'SI' && eq.TieneOdometro) req.push(['ODOMETRO_INICIAL', 'Odómetro inicial'], ['ODOMETRO_FINAL', 'Odómetro final']);
      if (cfg().FOTO_PARTE_FIRMADO_OBLIGATORIA === 'SI') req.push(['PARTE_FISICO_FIRMADO', 'Parte físico firmado']);
      var ev = N.hijos('EVIDENCIAS', p.ParteID);
      var falt = R.fotosFaltantes(p, eq, ev, N.filas('FALLAS'), N.hijos('ABASTECIMIENTOS', p.ParteID), cfg());
      return (falt.length ? '<div class="aviso acento">' + ic('camera') + '<div><strong>Faltan ' + falt.length + ' foto(s)</strong><ul>' + falt.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></div>'
        : '<div class="aviso">' + ic('checkc') + '<div>Todas las fotos obligatorias están tomadas.</div></div>') +
        '<div class="lista">' + req.map(function (r) { return botonFoto(p, r[0], r[1]); }).join('') + '</div>' +
        '<button type="button" class="btn ancho" data-a="foto" data-id="' + p.ParteID + '" data-tipo="OTRO">' + ic('camera') + 'Otra foto</button>' +
        '<div class="etiqueta-seccion">Fotos del parte (' + ev.length + ')</div>' + galeria(ev) +
        '<p class="mini">Fotografíe solo el tablero, el equipo, la falla o el parte. Evite que salgan personas.</p>';
    },
    8: function (p) {
      var eq = equipo(p.EquipoID);
      var acts = N.hijos('ACTIVIDADES', p.ParteID);
      var prod = acts.filter(function (a) { var t = (catAct()[a.ActividadCatID] || {}).TipoActividad; return t === 'PRODUCTIVA' || t === 'SERVICIO'; }).reduce(function (s, a) { return s + Number(a.DuracionHoras || 0); }, 0);
      var r = puedeEnviar(p);
      return '<div class="kpis"><div class="kpi"><div class="v num">' + n1(p.HorasTrabajadas) + '</div><div class="l">Horas horómetro</div></div>' +
        '<div class="kpi"><div class="v num">' + n1(prod) + '</div><div class="l">Horas productivas</div></div>' +
        '<div class="kpi"><div class="v num">' + (eq.TieneOdometro ? n1(p.KmRecorridos) : '—') + '</div><div class="l">Km</div></div>' +
        '<div class="kpi"><div class="v num">' + N.hijos('VIAJES', p.ParteID).length + '</div><div class="l">Viajes</div></div></div>' +
        '<div class="tarjeta"><dl class="datos-def"><dt>Equipo</dt><dd>' + esc(eq.CodigoInterno) + '</dd><dt>Fecha / turno</dt><dd>' + fF(p.FechaTrabajo) + ' · ' + esc(p.Turno) + '</dd>' +
        '<dt>Frente</dt><dd>' + esc(nombreFrente(p.FrenteID)) + '</dd><dt>Actividades</dt><dd>' + acts.length + '</dd><dt>Fallas</dt><dd>' + N.filas('FALLAS', function (f) { return f.ParteID === p.ParteID; }).length + '</dd>' +
        '<dt>Fotos</dt><dd>' + N.hijos('EVIDENCIAS', p.ParteID).length + '</dd>' + (sinPlazo() ? '' : '<dt>Plazo de entrega</dt><dd>' + fFH(p.FechaHoraLimite || R.limite(p.FechaTrabajo, turno(p.Turno))) + '</dd>') + '</dl></div>' +
        (p.Estado === 'OBSERVADO' ? '<div class="aviso acento">' + ic('alert') + '<div><strong>Observación del supervisor</strong><div>' + esc(p.Observaciones) + '</div></div></div>' : '') +
        listaHallazgos(hallazgosIA(p)) +
        (r.ok ? '<div class="aviso">' + ic('checkc') + '<div><strong>Listo para enviar.</strong> Al enviar ya no podrá modificarlo, salvo que el supervisor lo observe.</div></div>'
          : '<div class="aviso peligro">' + ic('alert') + '<div><strong>Falta completar antes de enviar:</strong><ul>' + r.faltan.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></div>') +
        '<label class="campo"><span>Comentario para el supervisor (opcional)</span><textarea name="ObservacionOperador">' + esc(p.ObservacionOperador) + '</textarea></label>' +
        '<p class="mini">Sin señal también puede enviar: quedará como "pendiente de sincronización" hasta que haya conexión. Recién entonces cuenta como recibido.</p>';
    }
  };

  /** Viajes del parte (volquetes y cisternas). conAviso: muestra la nota cuando el equipo no registra viajes. */
  function seccionViajes(p, conAviso) {
    var eq = equipo(p.EquipoID);
    var vs = N.hijos('VIAJES', p.ParteID).sort(function (a, b) { return a.NumeroViaje - b.NumeroViaje; });
    var conViajes = ['VOLQUETE', 'CISTERNA'].indexOf(eq.Familia) >= 0 || vs.length;
    if (!conViajes) return conAviso ? '<p class="sub">Este equipo no registra viajes; su producción va en Actividades.</p>' : '';
    var tot = vs.reduce(function (s, v) { return s + Number(v.Cantidad || 0); }, 0);
    return '<div class="etiqueta-seccion">Viajes (' + vs.length + ' · ' + n1(tot) + ' ' + esc((vs[0] || {}).Unidad || 'm3') + ')</div><div class="lista">' + vs.map(function (v) {
      return '<div class="tarjeta"><div class="entre"><div><h3>Viaje ' + v.NumeroViaje + '</h3><div class="mini num">' + v.HoraSalida + '–' + v.HoraLlegada + ' · ' + esc(v.Origen) + ' → ' + esc(v.Destino) + ' · ' + n1(v.Cantidad) + ' ' + esc(v.Unidad) + '</div>' + (v._error ? '<div class="msg-error">' + esc(v._error) + '</div>' : '') + '</div>' +
        '<button type="button" class="btn chico fantasma" data-a="borrar" data-t="VIAJES" data-k="' + v.ViajeID + '" aria-label="Eliminar viaje">' + ic('trash') + '</button></div></div>';
    }).join('') + '</div><button type="button" class="btn ancho" data-a="viajeForm" data-id="' + p.ParteID + '">' + ic('truck') + 'Agregar viaje</button>';
  }
  /** Abastecimientos con sus 3 fotos, o la declaración "no hubo abastecimiento". */
  function seccionCombustible(p) {
    var eq = equipo(p.EquipoID);
    var abs = N.hijos('ABASTECIMIENTOS', p.ParteID);
    return '<div class="etiqueta-seccion">Abastecimiento de combustible</div><div class="lista">' + abs.map(function (x) {
      return '<div class="tarjeta"><div class="entre"><div><h3>' + n1(x.Galones) + ' gal</h3><div class="mini">' + fFH(x.FechaHora) + (x.HorometroAbastecimiento !== '' ? ' · horómetro ' + n1(x.HorometroAbastecimiento) : '') + '</div>' + (x._error ? '<div class="msg-error">' + esc(x._error) + '</div>' : '') + '</div>' +
        '<button type="button" class="btn chico fantasma" data-a="borrar" data-t="ABASTECIMIENTOS" data-k="' + x.AbastecimientoID + '" aria-label="Eliminar abastecimiento">' + ic('trash') + '</button></div>' +
        // las fotos de combustible solo se piden si el administrador las exige (por defecto se lee del parte de papel)
        (cfg().FOTO_COMBUSTIBLE_OBLIGATORIA === 'SI' || (cfg().FOTO_ABASTECIMIENTO_OBLIGATORIA === 'SI' && eq.TieneHorometro) ? '<div class="lista" style="margin-top:10px">' +
          (cfg().FOTO_COMBUSTIBLE_OBLIGATORIA === 'SI' ? botonFoto(p, 'ABASTECIMIENTO', 'Foto del abastecimiento (que se vea el equipo)', { AbastecimientoID: x.AbastecimientoID }) +
            botonFoto(p, 'CANTIDAD_ABASTECIDA', 'Foto de la cantidad (surtidor, comprobante o medidor)', { AbastecimientoID: x.AbastecimientoID }) : '') +
          (cfg().FOTO_ABASTECIMIENTO_OBLIGATORIA === 'SI' && eq.TieneHorometro ? botonFoto(p, 'HOROMETRO_ABASTECIMIENTO', 'Foto del horómetro', { AbastecimientoID: x.AbastecimientoID }) : '') + '</div>' : '') +
        (x.Observaciones ? '<div class="mini">' + esc(x.Observaciones) + '</div>' : '') + '</div>';
    }).join('') + '</div>' +
      (!abs.length && N.iaLista() ? '<p class="mini">Si el abastecimiento está anotado en el parte de papel, la IA lo registra cuando usted confirme la lectura.</p>' : '') +
      (abs.length ? '' : '<label class="check tarjeta"><input type="checkbox" data-a="sinAbast" data-id="' + p.ParteID + '"' + (p.SinAbastecimiento === true ? ' checked' : '') + '>' +
        '<span><strong>Hoy no hubo abastecimiento</strong><span class="sub" style="display:block">Márquelo para que la falta de fotos de combustible no cuente como omisión.</span></span></label>') +
      '<button type="button" class="btn ancho" data-a="abastForm" data-id="' + p.ParteID + '">' + ic('fuel') + 'Registrar abastecimiento</button>';
  }

  // ------------------------------------------------------------ parte en 1 pantalla (predeterminado)
  // El operador toma la foto del parte de papel, la IA llena todo sola y él solo corrige lo marcado en rojo.
  function vUno(id) {
    var p = getParte(id);
    if (!p) { toast('Este borrador ya no está: el servidor lo rechazó o se eliminó. Elija de nuevo turno, fecha y equipo.'); location.replace('#/inicio'); return; }
    if (p.Estado && !editable(p)) { location.replace('#/parte/' + id); return; }
    if (!p.AsignacionID) { location.replace('#/parte/' + id + '/rapido/1'); return; }
    modo('uno');
    var eq = equipo(p.EquipoID), t = turno(p.Turno);
    var evP = N.hijos('EVIDENCIAS', id).filter(function (e) { return e.TipoEvidencia === 'PARTE_FISICO_FIRMADO' && !e._error; });
    var foto = evP[evP.length - 1];
    var est = foto ? N.estadoIA(foto.EvidenciaID) : null;
    var lp = ultimaLecturaParte(id);
    var estado = !foto ? '' : est && est.estado === 'leyendo' ? '<div class="aviso acento">' + ic('activity') + '<div><strong>La IA está leyendo su parte…</strong><div class="sub">Tarda unos segundos. Puede esperar aquí.</div></div></div>'
      : !foto._srv ? '<div class="aviso">' + ic('cloudoff') + '<div>La foto se enviará cuando haya señal; luego la IA llenará el parte.</div></div>'
      : est && est.estado === 'error' && est.codigo === 'IA_LIMITE' ? '<div class="aviso acento">' + ic('activity') + '<div><strong>La IA está llena por ahora (muchas fotos a la vez).</strong><div class="sub">La foto ya quedó guardada. El servidor la leerá solo más tarde y llenará el parte. No tiene que hacer nada más.</div><button type="button" class="btn chico" data-a="iaRepetir" data-ev="' + foto.EvidenciaID + '">' + ic('refresh') + 'Reintentar ahora</button></div></div>'
      : (est && est.estado === 'error') || (N.lecturaDe(foto.EvidenciaID) || {}).Estado === 'ERROR' ? '<div class="aviso peligro">' + ic('alert') + '<div><strong>La IA no pudo leer la foto.</strong><div class="sub">' + esc((est && est.msg) || '') + '</div><button type="button" class="btn chico" data-a="iaRepetir" data-ev="' + foto.EvidenciaID + '">' + ic('refresh') + 'Reintentar</button></div></div>'
      : lp ? '<div class="aviso">' + ic('checkc') + '<div><strong>La IA llenó el parte.</strong> Revise que esté bien. <a href="#/parte/' + id + '/ia">Ver lo que leyó</a></div></div>'
      : N.iaLista() ? '<div class="aviso acento">' + ic('activity') + '<div>La IA leerá la foto en un momento…</div></div>' : '';
    var acts = N.hijos('ACTIVIDADES', id).sort(function (a, b) { return R.relInicio(a.HoraInicio, t.HoraInicio) - R.relInicio(b.HoraInicio, t.HoraInicio); });
    var vs = N.hijos('VIAJES', id), abs = N.hijos('ABASTECIMIENTOS', id), fs = N.filas('FALLAS', function (f) { return f.ParteID === id; });
    var conViajes = ['VOLQUETE', 'CISTERNA'].indexOf(eq.Familia) >= 0 || vs.length;
    var lect = [];
    if (eq.TieneHorometro) lect.push(['HorometroInicial', 'Horómetro inicio'], ['HorometroFinal', 'Horómetro final']);
    if (eq.TieneOdometro) lect.push(['OdometroInicial', 'Km inicio'], ['OdometroFinal', 'Km final']);
    var l = R.lecturas(p, eq, cfg(), false);
    var r = puedeEnviar(p);
    var hs = hallazgosIA(p);
    // si el servidor rechazó el borrador (p. ej. ya había un parte ese día y turno), decirlo arriba y con claridad
    var h = (p._error ? '<div class="aviso peligro">' + ic('alert') + '<div><strong>El servidor no aceptó este parte:</strong> ' + esc(p._error) +
      '<div class="sub">Cambie abajo el turno o la fecha, o elimine este borrador. La foto se subirá cuando el parte sea aceptado.</div></div></div>' : '') +
      '<div class="tarjeta uno-cabecera"><div class="icono-caja acento">' + ic('gauge') + '</div><div class="crece"><h3>' + esc(eq.CodigoInterno) + ' · ' + esc(eq.Familia) + '</h3>' +
      '<div class="mini">' + fF(p.FechaTrabajo) + ' · ' + esc(t.Nombre || p.Turno) + '</div></div><a class="btn chico" href="#/parte/' + id + '/rapido/1">Cambiar equipo</a></div>' +
      // fecha y turno se corrigen aquí mismo, sin pasos
      '<div class="tarjeta" style="display:grid;gap:10px"><div class="dos">' + ['DIA', 'NOCHE'].map(function (x) {
        return '<button type="button" class="btn ' + (p.Turno === x ? 'primario' : '') + '" data-a="unoTurno" data-id="' + id + '" data-v="' + x + '" aria-pressed="' + (p.Turno === x) + '">' + ic(x === 'DIA' ? 'sun' : 'moon') + (x === 'DIA' ? 'Turno DÍA' : 'Turno NOCHE') + '</button>';
      }).join('') + '</div><label class="campo"><span>Fecha del parte</span><input id="unoFecha" type="date" value="' + esc(p.FechaTrabajo) + '" min="' + R.sumarDias(hoy(), -Number(cfg().DIAS_MAX_RETRASO_REGISTRO || 2)) + '" max="' + hoy() + '"></label></div>' +
      // 1) la foto del parte de papel
      (foto ? '<div class="uno-foto ok">' + botonFoto(p, 'PARTE_FISICO_FIRMADO', 'Foto del parte de papel') + '</div>'
        : '<div class="uno-foto"><strong style="font-size:18px">Tómele foto a su parte de papel</strong><span class="sub">La IA llenará todo por usted.</span>' +
          '<button type="button" class="btn primario enorme" data-a="foto" data-id="' + id + '" data-tipo="PARTE_FISICO_FIRMADO">' + ic('camera') + 'Tomar foto</button>' +
          '<button type="button" class="btn chico" data-a="foto" data-modo="galeria" data-id="' + id + '" data-tipo="PARTE_FISICO_FIRMADO">' + ic('image') + 'Elegir de la galería</button></div>') +
      estado +
      // 2) lo que quedó registrado (se puede corregir aquí mismo)
      '<div class="etiqueta-seccion">Datos del parte</div><div class="tarjeta uno-lista">' +
      '<div class="dos">' + lect.map(function (x) {
        return '<label class="campo"><span>' + x[1] + '</span><input name="' + x[0] + '" type="number" inputmode="decimal" step="0.1" min="0" value="' + esc(p[x[0]]) + '" data-a2="lectura"></label>';
      }).join('') + '</div>' +
      (l.alertas.length || p.ExcepcionLectura ? '<div class="aviso acento">' + ic('alert') + '<div>' + esc(l.alertas.join(' ')) + '</div></div>' +
        '<label class="check"><input type="checkbox" name="ExcepcionLectura" data-a2="lectura"' + (p.ExcepcionLectura ? ' checked' : '') + '><span>La lectura es correcta (explique)</span></label>' +
        '<label class="campo"><textarea name="MotivoExcepcion" data-a2="lectura" placeholder="Ej.: se cambió el horómetro">' + esc(p.MotivoExcepcion) + '</textarea></label>' : '') +
      '<div class="fila-dato"><span>Actividades</span><span>' + acts.length + '</span></div>' +
      acts.map(function (a) {
        return '<button type="button" class="fila-dato" style="background:none;border:0;border-bottom:1px solid var(--borde);color:inherit;text-align:left;width:100%;padding:6px 0" data-a="actForm" data-id="' + id + '" data-k="' + a.ActividadID + '">' +
          '<span class="mini">' + horasAct(a) + '</span><span class="mini">' + esc(a.Descripcion || (catAct()[a.ActividadCatID] || {}).Nombre || '') + (a.CantidadProducida !== '' && a.CantidadProducida !== undefined ? ' · ' + n1(a.CantidadProducida) + ' ' + esc(a.Unidad) : '') + '</span></button>';
      }).join('') +
      '<button type="button" class="btn chico" data-a="actForm" data-id="' + id + '">' + ic('plus') + 'Agregar actividad</button>' +
      (conViajes ? '<div class="fila-dato"><span>Viajes</span><span>' + vs.length + '</span></div><button type="button" class="btn chico" data-a="viajeForm" data-id="' + id + '">' + ic('truck') + 'Agregar viaje</button>' : '') +
      '<div class="fila-dato"><span>Combustible</span><span>' + (abs.length ? abs.map(function (x) { return n1(x.Galones) + ' gal'; }).join(' + ') : p.SinAbastecimiento === true ? 'No hubo' : '—') + '</span></div>' +
      (abs.length ? '' : '<label class="check"><input type="checkbox" data-a="sinAbast" data-id="' + id + '"' + (p.SinAbastecimiento === true ? ' checked' : '') + '><span>Hoy no hubo abastecimiento</span></label>' +
        '<button type="button" class="btn chico" data-a="abastForm" data-id="' + id + '">' + ic('fuel') + 'Registrar combustible</button>') +
      '<div class="fila-dato"><span>Fallas</span><span>' + fs.length + '</span></div>' +
      '<button type="button" class="btn chico" data-a="fallaForm" data-id="' + id + '">' + ic('wrench') + '¿Hubo una falla? Repórtela</button>' +
      (fs.length ? '<div class="lista">' + fs.map(function (f) { return botonFoto(p, 'FALLA', 'Foto de la falla: ' + f.Componente, { FallaID: f.FallaID }); }).join('') + '</div>' : '') +
      '</div>' +
      // 3) lo que falta, en rojo, y el botón de enviar
      listaHallazgos(hs.filter(function (x) { return x.estado !== 'DUDOSO'; })) +
      (r.ok ? '' : '<div class="aviso peligro">' + ic('alert') + '<div><strong>Falta para enviar:</strong><ul>' + r.faltan.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></div>') +
      '<button type="button" class="btn primario ancho enorme" data-a="enviar" data-id="' + id + '"' + (r.ok ? '' : ' disabled') + '>' + ic('send') + (p.Estado === 'OBSERVADO' ? 'Enviar corrección' : 'ENVIAR PARTE') + '</button>' +
      (p.Estado === 'OBSERVADO' ? '<div class="aviso acento">' + ic('alert') + '<div><strong>Observación del supervisor</strong><div>' + esc(p.Observaciones) + '</div></div></div>' : '') +
      '<p class="mini" style="text-align:center"><a href="#/parte/' + id + '/paso/4" data-a="detallado">Modo detallado</a> · ' + botonBorrarParte(p).replace('btn peligro ancho', 'btn chico fantasma') + '</p>';
    marco(p.CodigoParte || 'Parte', '<form id="fUno" novalidate style="display:grid;gap:14px">' + h + '</form>', { volver: '#/inicio' });
    var f = document.getElementById('fUno');
    f.onchange = function (e) {
      if (e.target.id === 'unoFecha') { var err = cambiarFechaTurno(id, e.target.value, null); if (err) { toast(err); e.target.value = getParte(id).FechaTrabajo; } else { toast('Fecha cambiada'); render(); } return; }
      if (e.target.dataset.a2 === 'lectura') guardarLecturasUno(id);
    };
    hidratarFotos();
  }
  /** Cambia fecha y/o turno de un borrador (mismo equipo). Devuelve el error o null. */
  function cambiarFechaTurno(id, fecha, tno) {
    var p = Object.assign({}, getParte(id));
    if (!editable(p)) return 'Este parte ya no se puede modificar.';
    fecha = fecha || p.FechaTrabajo; tno = tno || p.Turno;
    if (fecha === p.FechaTrabajo && tno === p.Turno) return null;
    var min = R.sumarDias(hoy(), -Number(cfg().DIAS_MAX_RETRASO_REGISTRO || 2));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha > hoy() || fecha < min) return 'Elija una fecha entre ' + fF(min) + ' y ' + fF(hoy()) + '.';
    var a = (cat().ASIGNACIONES || []).filter(function (x) {
      return x.OperadorID === p.OperadorID && x.EquipoID === p.EquipoID && x.Turno === tno && x.FechaInicio <= fecha && (!x.FechaFin || x.FechaFin >= fecha);
    })[0];
    if (!a) return 'No tiene autorizado ' + (equipo(p.EquipoID).CodigoInterno || 'este equipo') + ' en el turno ' + (tno === 'DIA' ? 'DÍA' : 'NOCHE') + '. Avise a su supervisor.';
    var oc = ocupado(p.EquipoID, fecha, tno, p.ParteID);
    if (oc) return textoOcupado(oc, fecha, tno);
    p.FechaTrabajo = fecha; p.Turno = tno; p.AsignacionID = a.AsignacionID; p.FrenteID = p.FrenteID || a.FrenteID;
    var reintentar = !!p._error;
    guardarParte(p);
    if (reintentar) N.reencolarFotos(p.ParteID);  // el parte rechazado vuelve a enviarse: sus fotos también
    return null;
  }
  /** Guarda las lecturas escritas en la pantalla única (con las mismas validaciones). */
  function guardarLecturasUno(id) {
    var p = Object.assign({}, getParte(id));
    document.querySelectorAll('#fUno [data-a2="lectura"]').forEach(function (el) {
      if (el.type === 'checkbox') p[el.name] = el.checked;
      else if (el.tagName === 'TEXTAREA') p[el.name] = el.value;
      else p[el.name] = el.value === '' ? '' : Math.round(Number(el.value) * 100) / 100;
    });
    var l = R.lecturas(p, equipo(p.EquipoID), cfg(), false);
    if (l.errores.length) { toast(l.errores[0]); return; }
    if (R.num(p.HorometroInicial) !== null && R.num(p.HorometroFinal) !== null) p.HorasTrabajadas = Math.round((p.HorometroFinal - p.HorometroInicial) * 100) / 100;
    if (R.num(p.OdometroInicial) !== null && R.num(p.OdometroFinal) !== null) p.KmRecorridos = Math.round((p.OdometroFinal - p.OdometroInicial) * 100) / 100;
    guardarParte(p);
    render();
  }

  // ------------------------------------------------------------ modo rápido (3 pasos, con IA)
  var RAPIDO = ['Equipo y turno', 'Fotos y lecturas', 'Revisar y enviar'];
  var eleccion = {};  // fecha/turno elegidos en el paso 1 antes de guardar (para redibujar los equipos)
  function modo(m) { try { if (m) sessionStorage.setItem('axion_modo', m); return sessionStorage.getItem('axion_modo') || 'uno'; } catch (x) { return 'uno'; } }
  function rutaParte(id, n) {
    if (modo() === 'detallado') return '#/parte/' + id + '/paso/' + ({ 1: 1, 2: 3, 3: 8 }[n] || 4);
    if (modo() === 'rapido') return '#/parte/' + id + '/rapido/' + n;
    return n === 1 ? '#/parte/' + id + '/rapido/1' : '#/parte/' + id + '/uno';
  }

  var RAP = {
    1: function (p) { return PASO[1](p) + PASO[2](p); },
    2: function (p) {
      return '<div class="etiqueta-seccion">Parte de papel</div><p class="sub">Tómele foto al parte de papel: la IA llenará actividades, viajes y observaciones (tarda 1 o 2 minutos; puede seguir mientras tanto).</p>' +
        '<div class="lista">' + botonFoto(p, 'PARTE_FISICO_FIRMADO', 'Foto del parte de papel') + '</div>' +
        '<div class="etiqueta-seccion">Lecturas</div>' + PASO[3](p) + seccionCombustible(p);
    },
    3: function (p) {
      return PASO[4](p) + seccionViajes(p, false) + '<div class="etiqueta-seccion">Fallas mecánicas</div>' + PASO[6](p) +
        '<div class="etiqueta-seccion">Resumen</div>' + PASO[8](p);
    }
  };

  function vRapido(id, n) {
    var p = getParte(id);
    if (!p) { location.replace('#/inicio'); return; }
    if (p.Estado && !editable(p)) { location.replace('#/parte/' + id); return; }
    if (!(n === 1 && modo() === 'uno')) modo('rapido');
    n = Math.max(1, Math.min(3, n));
    if (n > 1 && !p.AsignacionID) n = 1;
    var pv = n === 1 && eleccion[id] ? Object.assign({}, p, eleccion[id]) : p;
    var cuerpo = '<div class="progreso"><div class="entre"><span class="sub">Paso ' + n + ' de 3</span><span class="codigo">' + esc(p.CodigoParte || 'Parte nuevo') + '</span></div>' +
      '<div class="barra" role="progressbar" aria-valuemin="1" aria-valuemax="3" aria-valuenow="' + n + '"><i style="width:' + Math.round(n * 100 / 3) + '%"></i></div>' +
      '<div class="pasos">' + RAPIDO.map(function (t, i) {
        return '<button type="button" data-a="ir" data-h="#/parte/' + id + '/rapido/' + (i + 1) + '"' + (i + 1 === n ? ' aria-current="step"' : '') + (i + 1 < n ? ' class="hecho"' : '') + (i > 0 && !p.AsignacionID ? ' disabled' : '') + '>' + (i + 1) + '. ' + t + '</button>';
      }).join('') + '</div></div>' +
      '<h1>' + RAPIDO[n - 1] + '</h1><form id="fPaso" novalidate style="display:grid;gap:16px">' + RAP[n](pv) + '</form>' +
      (p.AsignacionID ? '<p class="mini" style="text-align:center"><a href="#/parte/' + id + '/paso/' + ({ 1: 1, 2: 3, 3: 4 }[n]) + '" data-a="detallado">Usar el modo detallado (8 pasos)</a></p>' : '');
    var pie = '<div class="pie-asistente">' + (n > 1 ? '<button class="btn" data-a="rapAnt" data-id="' + id + '" data-p="' + n + '">' + ic('left') + 'Atrás</button>' : '<a class="btn" href="#/inicio">Salir</a>') +
      (n < 3 ? '<button class="btn primario" data-a="rapSig" data-id="' + id + '" data-p="' + n + '">Guardar y seguir' + ic('right') + '</button>'
        : '<button class="btn primario" data-a="enviar" data-id="' + id + '"' + (puedeEnviar(p).ok ? '' : ' disabled') + '>' + ic('send') + (p.Estado === 'OBSERVADO' ? 'Enviar corrección' : 'Enviar parte') + '</button>') + '</div>';
    marco(p.CodigoParte || 'Nuevo parte', cuerpo, { volver: '#/inicio', pie: pie });
    var f = document.getElementById('fPaso');
    f.oninput = function (e) { if (e.target.name) { if (n === 2) vivo(p, 3); respaldarEscrito(); } };
    f.onchange = function (e) {
      if (n === 1 && e.target.name === 'FechaTrabajo' && !e.target.disabled) {
        eleccion[id] = Object.assign({}, eleccion[id], { FechaTrabajo: e.target.value, AsignacionID: '' });
        render();
        return;
      }
      respaldarEscrito();
    };
    if (n === 2) setTimeout(function () { vivo(p, 3); }, 0);
  }
  /** Guarda el paso del modo rápido con las mismas validaciones del modo detallado. */
  function guardarRapido(id, n) {
    if (n === 1) {
      // fecha, turno y equipo se guardan juntos (si se guardaran por separado, un borrador ya guardado volvería a su fecha anterior)
      var p = Object.assign({}, getParte(id));
      var v = valoresForm();
      if (!v.FechaTrabajo) return 'Indique la fecha de trabajo.';
      var min = R.sumarDias(hoy(), -Number(cfg().DIAS_MAX_RETRASO_REGISTRO || 2));
      if ((v.FechaTrabajo !== p.FechaTrabajo || !p.Estado) && (v.FechaTrabajo > hoy() || v.FechaTrabajo < min)) return 'Fecha fuera del rango permitido (' + fF(min) + ' a ' + fF(hoy()) + ').';
      if (!v.AsignacionID) return 'Elija el equipo autorizado.';
      var a = busca('ASIGNACIONES', 'AsignacionID', v.AsignacionID);
      if (a.Turno !== v.Turno) return 'El equipo elegido no corresponde al turno. Vuelva a elegir el equipo.';
      p.FechaTrabajo = v.FechaTrabajo; p.Turno = v.Turno; p.AsignacionID = v.AsignacionID; p.FrenteID = v.FrenteID || a.FrenteID;
      var dup = N.filas('PARTES_DIARIOS', function (x) { return x.ParteID !== p.ParteID && x.Estado !== 'ANULADO' && x.FechaTrabajo === p.FechaTrabajo && x.Turno === p.Turno && (x.EquipoID === a.EquipoID || x.OperadorID === p.OperadorID); })[0];
      if (dup) return 'Ya existe el parte ' + (dup.CodigoParte || '') + ' para esta fecha y turno. Ábralo desde Mis partes.';
      guardarParte(p);
      delete eleccion[id];
      return null;
    }
    if (n === 2) return guardarPaso(id, 3);
    return guardarPaso(id, 8);
  }

  function puedeEnviar(p) {
    if (!p.AsignacionID) return { ok: false, faltan: ['Elija el equipo.'] };
    return R.revisarEnvio(p, equipo(p.EquipoID), N.hijos('ACTIVIDADES', p.ParteID), turno(p.Turno), catAct(),
      N.hijos('EVIDENCIAS', p.ParteID), N.filas('FALLAS'), N.hijos('ABASTECIMIENTOS', p.ParteID), cfg(), N.hijos('LECTURAS_IA', p.ParteID));
  }
  /** Última lectura de IA del parte de papel (si hay). */
  function ultimaLecturaParte(parteID) {
    return N.hijos('LECTURAS_IA', parteID).filter(function (l) { return l.TipoEvidencia === 'PARTE_FISICO_FIRMADO' && (l.Estado === 'PROCESADA' || l.Estado === 'CONFIRMADA'); })
      .sort(function (a, b) { return String(a.FechaHoraServidor).localeCompare(String(b.FechaHoraServidor)); }).pop() || null;
  }
  /** Si el papel dice otra fecha o turno que el parte digital, devuelve "dd/mm/aaaa TURNO" del papel; si no, ''. */
  function fechaPapelDistinta(p) {
    if (!p || p.Estado === 'APROBADO' || p.Estado === 'ANULADO') return '';
    var l = ultimaLecturaParte(p.ParteID), r = l ? R.resultadoIA(l) : null;
    if (!r) return '';
    var f = R.fechaIA(r.fecha), t = String(R.valorIA(r.turno) || '').toUpperCase();
    f = /^\d{4}-\d{2}-\d{2}$/.test(f || '') ? f : p.FechaTrabajo;
    t = t === 'DIA' || t === 'NOCHE' ? t : p.Turno;
    return f !== p.FechaTrabajo || t !== p.Turno ? fF(f) + ' ' + t : '';
  }
  function hallazgosIA(p) {
    return R.contrastarIA(p, equipo(p.EquipoID), N.hijos('LECTURAS_IA', p.ParteID), N.hijos('ABASTECIMIENTOS', p.ParteID), cfg(), nombreOp(p.OperadorID))
      .filter(function (h) { return h.estado !== 'RECONOCIDO'; });
  }
  function listaHallazgos(hs) {
    if (!hs.length) return '';
    var orden = { INCONSISTENTE: 0, ILEGIBLE: 1, DUDOSO: 2 };
    return '<div class="aviso ' + (hs.some(function (h) { return h.estado === 'INCONSISTENTE'; }) ? 'peligro' : 'acento') + '">' + ic('alert') + '<div><strong>Revise (' + hs.length + ')</strong><ul>' +
      hs.slice().sort(function (a, b) { return orden[a.estado] - orden[b.estado]; }).map(function (h) {
        return '<li><span class="estado ' + (h.estado === 'DUDOSO' ? 'duda' : 'peligro') + ' ia-chip">' + esc(h.estado === 'INCONSISTENTE' ? 'Inconsistente' : h.estado === 'ILEGIBLE' ? 'Ilegible' : 'Dudoso') + '</span> ' + esc(h.mensaje) + '</li>';
      }).join('') + '</ul></div></div>';
  }

  function vivo(p, paso) {
    if (paso !== 3) return;
    var v = Object.assign({}, p, valoresForm());
    var eq = equipo(p.EquipoID);
    var l = R.lecturas(v, eq, cfg(), false);
    var hi = R.num(v.HorometroInicial), hf = R.num(v.HorometroFinal), oi = R.num(v.OdometroInicial), of = R.num(v.OdometroFinal);
    var c1 = document.getElementById('calc-HorometroInicial');
    if (c1) c1.innerHTML = hi !== null && hf !== null ? 'Horas trabajadas (horómetro): <strong class="num">' + n1(hf - hi) + ' h</strong>' : '';
    var c2 = document.getElementById('calc-OdometroInicial');
    if (c2) c2.innerHTML = oi !== null && of !== null ? 'Km recorridos: <strong class="num">' + n1(of - oi) + ' km</strong>' : '';
    var box = document.getElementById('alertasLect');
    box.innerHTML = l.errores.map(function (e) { return '<div class="aviso peligro" role="alert">' + ic('alert') + '<div>' + esc(e) + '</div></div>'; }).join('') +
      l.alertas.map(function (e) { return '<div class="aviso acento">' + ic('alert') + '<div>' + esc(e) + ' Si es correcto, marque la excepción y explique.</div></div>'; }).join('');
    document.getElementById('excep').style.display = l.alertas.length || v.ExcepcionLectura ? 'grid' : 'none';
  }

  function guardarPaso(id, paso) {
    var p = Object.assign({}, getParte(id));
    var v = valoresForm();
    if (paso === 1) {
      if (!v.FechaTrabajo) return 'Indique la fecha de trabajo.';
      var min = R.sumarDias(hoy(), -Number(cfg().DIAS_MAX_RETRASO_REGISTRO || 2));
      if (!p.Estado && (v.FechaTrabajo > hoy() || v.FechaTrabajo < min)) return 'Fecha fuera del rango permitido (' + fF(min) + ' a ' + fF(hoy()) + ').';
      if (v.FechaTrabajo !== p.FechaTrabajo || v.Turno !== p.Turno) { p.AsignacionID = ''; }
      p.FechaTrabajo = v.FechaTrabajo || p.FechaTrabajo; p.Turno = v.Turno;
    }
    if (paso === 2) {
      if (!v.AsignacionID) return 'Elija el equipo autorizado.';
      p.AsignacionID = v.AsignacionID; p.FrenteID = v.FrenteID;
      var a = busca('ASIGNACIONES', 'AsignacionID', p.AsignacionID);
      var dup = N.filas('PARTES_DIARIOS', function (x) { return x.ParteID !== p.ParteID && x.Estado !== 'ANULADO' && x.FechaTrabajo === p.FechaTrabajo && x.Turno === p.Turno && (x.EquipoID === a.EquipoID || x.OperadorID === p.OperadorID); })[0];
      if (dup) return 'Ya existe el parte ' + (dup.CodigoParte || '') + ' para esta fecha y turno. Ábralo desde Mis partes.';
    }
    if (paso === 3) {
      ['HorometroInicial', 'HorometroFinal', 'OdometroInicial', 'OdometroFinal'].forEach(function (k) {
        if (k in v) p[k] = v[k] === '' ? '' : Math.round(Number(v[k]) * 100) / 100;
      });
      p.ExcepcionLectura = !!v.ExcepcionLectura; p.MotivoExcepcion = v.MotivoExcepcion || '';
      var l = R.lecturas(p, equipo(p.EquipoID), cfg(), false);
      if (l.errores.length) return l.errores[0];
      if (p.HorometroInicial !== '' && p.HorometroFinal !== '' && p.HorometroInicial !== undefined && p.HorometroFinal !== undefined)
        p.HorasTrabajadas = Math.round((p.HorometroFinal - p.HorometroInicial) * 100) / 100;
      if (p.OdometroInicial !== '' && p.OdometroFinal !== '' && p.OdometroInicial !== undefined && p.OdometroFinal !== undefined)
        p.KmRecorridos = Math.round((p.OdometroFinal - p.OdometroInicial) * 100) / 100;
    }
    if (paso === 8) p.ObservacionOperador = v.ObservacionOperador || '';
    if (paso <= 3 || paso === 8) guardarParte(p);
    return null;
  }

  // ------------------------------------------------------------ fotos
  function botonFoto(p, tipo, texto, extra) {
    extra = extra || {};
    var ev = N.hijos('EVIDENCIAS', p.ParteID).filter(function (e) {
      return e.TipoEvidencia === tipo && (!extra.FallaID || e.FallaID === extra.FallaID) && (!extra.AbastecimientoID || e.AbastecimientoID === extra.AbastecimientoID);
    });
    var buenas = ev.filter(function (e) { return !e._error; });
    var malas = ev.filter(function (e) { return e._error; });
    var hecho = buenas.length > 0;
    var varias = tipo === 'FALLA' || tipo === 'OTRO';  // de estas se pueden tomar varias; las demás se reemplazan
    var puede = editable(p);
    var datos = ' data-id="' + p.ParteID + '" data-tipo="' + tipo + '"' + (hecho && !varias ? ' data-reemplazar="1"' : '') +
      (extra.FallaID ? ' data-falla="' + extra.FallaID + '"' : '') + (extra.AbastecimientoID ? ' data-abast="' + extra.AbastecimientoID + '"' : '');
    var ultima = ev[ev.length - 1];
    return '<div class="foto-req' + (hecho ? ' ok' : '') + '" style="flex-wrap:wrap">' +
      (hecho ? '<button type="button" class="miniatura" data-a="verFoto" data-k="' + buenas[buenas.length - 1].EvidenciaID + '" data-foto="' + buenas[buenas.length - 1].EvidenciaID + '" aria-label="Ver la foto">' + ic('image') + '</button>' : ic('camera')) +
      '<span class="crece">' + esc(texto) + (hecho ? ' · ' + (varias ? buenas.length + ' foto(s)' : 'lista') + (buenas.some(function (e) { return e._pend; }) ? ' (por enviar)' : '') : '') + '</span>' +
      (puede ? '<button type="button" class="btn chico ' + (hecho ? '' : 'primario') + '" data-a="foto"' + datos + '>' + ic('camera') + (hecho ? (varias ? 'Otra' : 'Cambiar') : 'Cámara') + '</button>' +
        '<button type="button" class="btn chico" data-a="foto" data-modo="galeria"' + datos + ' aria-label="Elegir foto de la galería">' + ic('image') + 'Galería</button>' +
        (ultima ? '<button type="button" class="btn chico fantasma" data-a="borrarFoto" data-k="' + ultima.EvidenciaID + '" aria-label="Borrar la foto">' + ic('trash') + '</button>' : '') : '') +
      (malas.length ? '<div class="msg-error" style="width:100%">' + ic('alert') + '<span>Foto rechazada: ' + esc(malas[0]._error) + '</span></div>' : '') +
      (buenas.length ? cajaIA(p, buenas[buenas.length - 1], extra) : '') + '</div>';
  }
  /** Contenedor que se actualiza solo cuando llega la lectura de la IA, aunque el formulario esté abierto. */
  function cajaIA(p, ev, extra) {
    return '<div class="ia-caja" data-ia-parte="' + p.ParteID + '" data-ia-ev="' + ev.EvidenciaID + '" data-ia-abast="' + esc((extra && extra.AbastecimientoID) || '') + '">' + lineaIA(p, ev, extra) + '</div>';
  }
  function refrescarIA() {
    document.querySelectorAll('.ia-caja').forEach(function (el) {
      var p = getParte(el.dataset.iaParte), ev = N.fila('EVIDENCIAS', el.dataset.iaEv);
      if (!p || !ev) return;
      el.innerHTML = lineaIA(p, ev, { AbastecimientoID: el.dataset.iaAbast });
      var t = el.parentNode.querySelector('.crece');
      if (t && ev._srv) t.textContent = t.textContent.replace(' (por enviar)', '');
    });
  }

  // ------------------------------------------------------------ lectura con IA
  var CONF_TXT = { ALTA: ['ok', 'Reconocido'], MEDIA: ['ok', 'Reconocido'], BAJA: ['duda', 'Dudoso'], ILEGIBLE: ['peligro', 'Ilegible'] };
  function chipConf(c) {
    var x = CONF_TXT[(c && c.confianza) || 'ILEGIBLE'] || CONF_TXT.ILEGIBLE;
    return '<span class="estado ' + x[0] + ' ia-chip">' + x[1] + '</span>';
  }
  var CAMPO_TIPO = { HOROMETRO_INICIAL: 'HorometroInicial', HOROMETRO_FINAL: 'HorometroFinal', ODOMETRO_INICIAL: 'OdometroInicial', ODOMETRO_FINAL: 'OdometroFinal' };
  /** Estado de la IA para una foto: leyendo, error, o lo que leyó (con botón para usar el valor). */
  function lineaIA(p, ev, extra) {
    if (N.IA_TIPOS.indexOf(ev.TipoEvidencia) < 0 || !N.iaLista() && !N.lecturaDe(ev.EvidenciaID)) return '';
    var est = N.estadoIA(ev.EvidenciaID);
    var l = N.lecturaDe(ev.EvidenciaID);
    var linea = function (cls, html) { return '<div class="ia-linea ' + cls + '">' + ic('activity') + '<span class="crece">' + html + '</span></div>'; };
    if (est && est.estado === 'leyendo') return linea('', 'IA: leyendo la foto…');
    if (!ev._srv) return linea('', 'IA: se leerá cuando la foto llegue al servidor.');
    if ((est && est.estado === 'error') || (l && l.Estado === 'ERROR')) {
      if (est && est.codigo === 'IA_LIMITE') return linea('alerta', 'IA llena por ahora (muchas fotos a la vez). <strong>La foto ya quedó guardada y el servidor la leerá solo más tarde.</strong> No tiene que hacer nada más.') +
        '<button type="button" class="btn chico" data-a="iaRepetir" data-ev="' + ev.EvidenciaID + '">' + ic('refresh') + 'Reintentar ahora</button>';
      return linea('alerta', 'IA: no se pudo leer (' + esc((est && est.msg) || l.Error) + ').') +
        (editable(p) || rol() !== 'OPERADOR' ? '<button type="button" class="btn chico" data-a="iaRepetir" data-ev="' + ev.EvidenciaID + '">' + ic('refresh') + 'Reintentar</button>' : '');
    }
    if (!l) return editable(p) || rol() !== 'OPERADOR' ? '<button type="button" class="btn chico" data-a="iaRepetir" data-ev="' + ev.EvidenciaID + '">' + ic('activity') + 'Leer con IA</button>' : '';
    var r = R.resultadoIA(l) || {};
    var t = ev.TipoEvidencia;
    if (t === 'PARTE_FISICO_FIRMADO') {
      return linea(l.Estado === 'CONFIRMADA' ? 'ok' : 'acento', 'IA leyó el parte de papel: ' + esc(l.Resumen) + (l.Estado === 'CONFIRMADA' ? ' · confirmado' : /\/ia$/.test(location.hash) ? ' · revíselo abajo' : ' · falta revisar')) +
        (/\/ia$/.test(location.hash) ? '' : '<a class="btn chico ' + (l.Estado === 'CONFIRMADA' ? '' : 'primario') + '" href="#/parte/' + p.ParteID + '/ia">' + (l.Estado === 'CONFIRMADA' ? 'Ver' : 'Revisar y confirmar') + '</a>');
    }
    if (t === 'ABASTECIMIENTO') {
      return r.muestra_abastecimiento === false ? linea('alerta', 'IA: la foto no parece mostrar el abastecimiento. Tome otra donde se vea el equipo recibiendo combustible.')
        : linea('ok', 'IA: se ve el abastecimiento' + (R.valorIA(r.codigo_equipo_visible) ? ' (equipo ' + esc(R.valorIA(r.codigo_equipo_visible)) + ')' : '') + '.');
    }
    var campo = t === 'CANTIDAD_ABASTECIDA' ? r.galones : r.lectura;
    var v = R.valorIA(campo);
    var unidad = t === 'CANTIDAD_ABASTECIDA' ? ' gal' : (t.indexOf('ODOMETRO') === 0 ? ' km' : ' h');
    if (r.es_instrumento_correcto === false) return linea('alerta', 'IA: la foto no parece mostrar el instrumento correcto. Tome otra foto.');
    if (v === null) return linea('alerta', 'IA: ' + (campo && campo.confianza === 'BAJA' ? 'lectura dudosa (' + esc(campo.texto || campo.valor) + ')' : 'no se ve con claridad') + '. Verifique el valor o tome otra foto.');
    var actual, tol, boton = '';
    if (t === 'CANTIDAD_ABASTECIDA') {
      var ab = N.fila('ABASTECIMIENTOS', extra && extra.AbastecimientoID) || {};
      actual = R.num(ab.Galones); tol = Number(cfg().TOL_IA_GALONES || 0.5);
      if (actual === null || Math.abs(actual - v) > tol) boton = editable(p) ? '<button type="button" class="btn chico" data-a="iaGalones" data-k="' + ab.AbastecimientoID + '" data-v="' + v + '">Usar ' + n1(v) + ' gal</button>' : '';
    } else if (CAMPO_TIPO[t]) {
      actual = R.num(p[CAMPO_TIPO[t]]); tol = Number(t.indexOf('ODOMETRO') === 0 ? cfg().TOL_IA_ODOMETRO_KM || 1 : cfg().TOL_IA_HOROMETRO_H || 0.2);
      if (editable(p) && /\/(paso\/3|rapido\/2)/.test(location.hash)) boton = '<button type="button" class="btn chico" data-a="iaUsar" data-campo="' + CAMPO_TIPO[t] + '" data-v="' + v + '">Usar ' + n1(v) + '</button>';
    }
    var dif = actual !== null && actual !== undefined && Math.abs(actual - v) > tol;
    return linea(dif ? 'peligro' : 'ok', 'IA leyó <strong class="num">' + n1(v) + unidad + '</strong> ' + chipConf(campo) +
      (dif ? ' · <strong>no coincide con lo registrado (' + n1(actual) + ')</strong>' : '')) + boton;
  }
  function galeria(ev) {
    if (!ev.length) return '<div class="vacio">' + ic('image') + '<p>Sin fotos.</p></div>';
    return '<div class="fotos">' + ev.map(function (e) {
      return '<button type="button" class="foto" data-a="verFoto" data-k="' + e.EvidenciaID + '" data-foto="' + e.EvidenciaID + '" aria-label="Ver foto ' + esc(e.TipoEvidencia) + '">' + ic('image') +
        '<span class="pie">' + esc(e.TipoEvidencia.replace(/_/g, ' ').toLowerCase()) + (e._pend ? ' · por enviar' : '') + '</span></button>';
    }).join('') + '</div>';
  }
  function hidratarFotos() {
    document.querySelectorAll('[data-foto]').forEach(function (el) {
      N.leerFoto(el.getAttribute('data-foto')).then(function (d) { if (d) { el.style.backgroundImage = 'url(' + d + ')'; el.querySelector('svg') && el.querySelector('svg').remove(); } });
    });
  }
  /**
   * Reduce la foto, le pone sello (AXION · parte · fecha) y la devuelve en JPEG.
   * El parte de papel y los instrumentos se guardan con más detalle para que la IA lea la letra y los dígitos.
   */
  var CALIDAD_FOTO = { PARTE_FISICO_FIRMADO: [2000, 0.82], HOROMETRO_INICIAL: [1600, 0.75], HOROMETRO_FINAL: [1600, 0.75],
    ODOMETRO_INICIAL: [1600, 0.75], ODOMETRO_FINAL: [1600, 0.75], HOROMETRO_ABASTECIMIENTO: [1600, 0.75], CANTIDAD_ABASTECIDA: [1600, 0.75] };
  function comprimir(file, sello, tipo) {
    var cal = CALIDAD_FOTO[tipo] || [1280, 0.6];
    var cargar = function () {
      // createImageBitmap respeta la orientación EXIF y lee más formatos; si no existe, se usa <img>
      if (window.createImageBitmap) {
        return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return createImageBitmap(file); });
      }
      return new Promise(function (ok, mal) {
        var img = new Image();
        img.onload = function () { ok(img); };
        img.onerror = function () { mal(new Error('x')); };
        img.src = URL.createObjectURL(file);
      });
    };
    return cargar().then(function (img) {
      var w = img.width, h = img.height;
      if (!w || !h) throw new Error('x');
      var k = Math.min(1, cal[0] / Math.max(w, h));
      var c = document.createElement('canvas');
      c.width = Math.round(w * k); c.height = Math.round(h * k);
      var g = c.getContext('2d');
      g.drawImage(img, 0, 0, c.width, c.height);
      if (img.close) img.close();
      // sello angosto en la esquina inferior para no tapar la letra del parte
      var fs = Math.max(12, Math.round(c.width / 60));
      g.font = 'bold ' + fs + 'px sans-serif';
      var ancho = Math.min(c.width, g.measureText(sello).width + fs * 1.2);
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(c.width - ancho, c.height - fs * 1.6, ancho, fs * 1.6);
      g.fillStyle = '#FF6B00';
      g.fillText(sello, c.width - ancho + fs * 0.6, c.height - fs * 0.5);
      var url = c.toDataURL('image/jpeg', cal[1]);
      if (url.indexOf('data:image/jpeg') !== 0) throw new Error('x');
      return url;
    }).catch(function () {
      throw new Error('No se pudo leer la foto (formato no compatible). Pruebe con "Galería" o configure la cámara para guardar en JPG.');
    });
  }

  // ------------------------------------------------------------ hojas (formularios emergentes)
  var dlg = document.getElementById('dlg');
  function hoja(titulo, campos, alGuardar, textoBoton) {
    dlg.innerHTML = '<form class="hoja" method="dialog" novalidate><div class="asa"></div><div class="entre"><h2>' + esc(titulo) + '</h2>' +
      '<button type="button" class="volver" data-cerrar aria-label="Cerrar">' + ic('x') + '</button></div>' + campos +
      '<div class="msg-error" role="alert" id="errHoja" hidden></div><div class="acciones dos-col"><button type="button" class="btn" data-cerrar>Cancelar</button>' +
      '<button type="submit" class="btn primario">' + esc(textoBoton || 'Guardar') + '</button></div></form>';
    var f = dlg.querySelector('form');
    f.onsubmit = function (e) {
      e.preventDefault();
      var o = {};
      f.querySelectorAll('[name]').forEach(function (el) { o[el.name] = el.type === 'checkbox' ? el.checked : el.value; });
      var err = alGuardar(o);
      if (err) { var b = document.getElementById('errHoja'); b.hidden = false; b.innerHTML = ic('alert') + '<span>' + esc(err) + '</span>'; return; }
      dlg.close();
      render();
    };
    f.querySelectorAll('[data-cerrar]').forEach(function (b) { b.onclick = function () { dlg.close(); }; });
    dlg.showModal();
    var primero = f.querySelector('input,select,textarea');
    if (primero) primero.focus();
  }
  function confirmar(titulo, texto, boton, peligro) {
    return new Promise(function (ok) {
      dlg.innerHTML = '<div class="hoja"><div class="asa"></div><h2>' + esc(titulo) + '</h2><p class="sub">' + esc(texto) + '</p><div class="acciones dos-col">' +
        '<button class="btn" id="cNo">Cancelar</button><button class="btn ' + (peligro ? 'peligro' : 'primario') + '" id="cSi">' + esc(boton) + '</button></div></div>';
      dlg.showModal();
      document.getElementById('cNo').onclick = function () { dlg.close(); ok(false); };
      document.getElementById('cSi').onclick = function () { dlg.close(); ok(true); };
    });
  }
  function opciones(lista, val, id, nom) {
    return lista.map(function (x) { return '<option value="' + esc(x[id]) + '"' + (x[id] === val ? ' selected' : '') + '>' + esc(x[nom]) + '</option>'; }).join('');
  }
  function campo(et, html, req) { return '<label class="campo"><span>' + et + (req ? ' <span class="req">*</span>' : '') + '</span>' + html + '</label>'; }

  function formActividad(parteID, actID) {
    var p = getParte(parteID);
    var t = turno(p.Turno);
    var a = actID ? N.fila('ACTIVIDADES', actID) : null;
    var otras = N.hijos('ACTIVIDADES', parteID).filter(function (x) { return x.ActividadID !== actID; });
    var ultimo = otras.slice().sort(function (x, y) { return R.relFin(y.HoraFin, t.HoraInicio) - R.relFin(x.HoraFin, t.HoraInicio); })[0];
    a = a || { ActividadCatID: '', HoraInicio: ultimo ? ultimo.HoraFin : '', HoraFin: '', CantidadProducida: '', Unidad: '' };
    var cats = (cat().ACTIVIDADES_CAT || []).slice().sort(function (x, y) { return x.Nombre.localeCompare(y.Nombre); });
    hoja(actID ? 'Editar actividad' : 'Nueva actividad',
      campo('¿Qué trabajo hizo?', '<input name="Descripcion" value="' + esc(a.Descripcion) + '" placeholder="Escríbalo como en su parte">', true) +
      campo('Tipo (opcional)', '<select name="ActividadCatID"><option value="">Otra actividad</option>' + opciones(cats, a.ActividadCatID, 'ActividadCatID', 'Nombre') + '</select>') +
      '<div class="dos">' + campo('Hora inicio', '<input name="HoraInicio" type="time" value="' + esc(a.HoraInicio) + '">') + campo('Hora fin', '<input name="HoraFin" type="time" value="' + esc(a.HoraFin) + '">') + '</div>' +
      '<div class="dos">' + campo('Cantidad producida', '<input name="CantidadProducida" type="number" inputmode="decimal" min="0" step="0.1" value="' + esc(a.CantidadProducida) + '">') +
      campo('Unidad', '<select name="Unidad"><option value=""></option>' + ['m3', 'm2', 't', 'km', 'und', 'h'].map(function (u) { return '<option' + (u === a.Unidad ? ' selected' : '') + '>' + u + '</option>'; }).join('') + '</select>') + '</div>',
      function (v) {
        var c = catAct()[v.ActividadCatID] || {};
        if (!v.Descripcion && !c.ActividadCatID) return 'Escriba qué trabajo hizo.';
        var dur = R.duracion(v.HoraInicio, v.HoraFin, t.HoraInicio);
        var fila = { ActividadID: actID || N.nuevoID('ACT'), ParteID: parteID, ActividadCatID: v.ActividadCatID, HoraInicio: v.HoraInicio, HoraFin: v.HoraFin,
          CantidadProducida: v.CantidadProducida === '' ? '' : Number(v.CantidadProducida), Unidad: v.Unidad || c.UnidadPredeterminada || '',
          Descripcion: v.Descripcion, FrenteID: p.FrenteID, DuracionHoras: dur === null ? '' : dur };
        N.guardar('ACTIVIDADES', fila);
        toast('Actividad guardada');
      });
  }

  function formViaje(parteID) {
    var p = getParte(parteID);
    var vs = N.hijos('VIAJES', parteID).sort(function (a, b) { return b.NumeroViaje - a.NumeroViaje; });
    var u = vs[0] || {};
    var mats = cat().MATERIALES || [];
    var ahora = R.enLima(Date.now()).hora;
    hoja('Viaje ' + ((u.NumeroViaje || 0) + 1),
      '<div class="dos">' + campo('Salida', '<input name="HoraSalida" type="time" value="' + ahora + '">', true) + campo('Llegada', '<input name="HoraLlegada" type="time">', true) + '</div>' +
      campo('Origen', '<input name="Origen" value="' + esc(u.Origen) + '">', true) + campo('Destino', '<input name="Destino" value="' + esc(u.Destino) + '">', true) +
      campo('Material', '<select name="MaterialID">' + opciones(mats, u.MaterialID || (mats[0] || {}).MaterialID, 'MaterialID', 'Nombre') + '</select>', true) +
      campo('Cantidad', '<input name="Cantidad" type="number" inputmode="decimal" min="0" step="0.1" value="' + esc(u.Cantidad || '') + '">', true),
      function (v) {
        var t = turno(p.Turno);
        if (!v.HoraSalida || !v.HoraLlegada) return 'Indique salida y llegada.';
        if (R.relFin(v.HoraLlegada, t.HoraInicio) <= R.relInicio(v.HoraSalida, t.HoraInicio)) return 'La llegada debe ser posterior a la salida.';
        if (!v.Origen || !v.Destino) return 'Indique origen y destino.';
        if (!(Number(v.Cantidad) > 0)) return 'La cantidad debe ser mayor que 0.';
        var m = busca('MATERIALES', 'MaterialID', v.MaterialID);
        N.guardar('VIAJES', { ViajeID: N.nuevoID('VIA'), ParteID: parteID, NumeroViaje: (u.NumeroViaje || 0) + 1, HoraSalida: v.HoraSalida, HoraLlegada: v.HoraLlegada,
          Origen: v.Origen, Destino: v.Destino, MaterialID: v.MaterialID, Cantidad: Number(v.Cantidad), Unidad: m.UnidadPredeterminada });
        toast('Viaje registrado');
      });
  }

  function formAbast(parteID) {
    var p = getParte(parteID);
    var eq = equipo(p.EquipoID);
    hoja('Abastecimiento de combustible',
      (eq.TieneHorometro ? campo('Horómetro al abastecer (si lo tiene)', '<input name="HorometroAbastecimiento" type="number" inputmode="decimal" step="0.1">') : '') +
      (eq.TieneOdometro ? campo('Odómetro al abastecer', '<input name="OdometroAbastecimiento" type="number" inputmode="decimal">') : '') +
      campo('Galones', '<input name="Galones" type="number" inputmode="decimal" min="0" step="0.1">', true) +
      '<p class="mini">Use este formulario solo si el abastecimiento no está en el parte de papel (la IA lo registra al confirmar la lectura).</p>',
      function (v) {
        var h = R.num(v.HorometroAbastecimiento), g = R.num(v.Galones);
        if (eq.TieneHorometro && h !== null && ((R.num(p.HorometroInicial) !== null && h < Number(p.HorometroInicial)) || (R.num(p.HorometroFinal) !== null && h > Number(p.HorometroFinal))))
          return 'El horómetro debe estar entre el inicial y el final del parte.';
        if (!(g > 0) || g > Number(cfg().MAX_GALONES_ABASTECIMIENTO || 300)) return 'Galones fuera de rango.';
        N.guardar('ABASTECIMIENTOS', { AbastecimientoID: N.nuevoID('ABA'), ParteID: parteID, EquipoID: p.EquipoID, FechaHora: R.isoLima(Date.now()),
          HorometroAbastecimiento: h === null ? '' : h, OdometroAbastecimiento: R.num(v.OdometroAbastecimiento) === null ? '' : R.num(v.OdometroAbastecimiento), Galones: g });
        if (p.SinAbastecimiento === true) guardarParte(Object.assign({}, p, { SinAbastecimiento: false }));
        toast('Abastecimiento guardado');
      });
  }

  function formFalla(parteID) {
    var ahora = R.enLima(Date.now());
    hoja('Reportar falla',
      campo('Sistema afectado', '<select name="SistemaID"><option value="">Elija…</option>' + opciones(cat().SISTEMAS_FALLA || [], '', 'SistemaID', 'Nombre') + '</select>', true) +
      campo('Componente', '<input name="Componente" placeholder="Ej.: manguera del brazo">', true) +
      campo('Qué pasó', '<textarea name="Descripcion"></textarea>', true) +
      '<div class="dos">' + campo('Inicio', '<input name="Inicio" type="datetime-local" value="' + ahora.fecha + 'T' + ahora.hora + '">', true) +
      campo('Horas paradas en este turno', '<input name="HorasParadaEnTurno" type="number" inputmode="decimal" min="0" step="0.5" value="0">') + '</div>',
      function (v) {
        if (!v.SistemaID || !v.Componente || !v.Descripcion || !v.Inicio) return 'Complete sistema, componente, descripción e inicio.';
        var p = getParte(parteID);
        N.guardar('FALLAS', { FallaID: N.nuevoID('FAL'), ParteID: parteID, EquipoID: p.EquipoID, SistemaID: v.SistemaID, Componente: v.Componente,
          Descripcion: v.Descripcion, FechaHoraInicio: v.Inicio + ':00-05:00', Estado: 'ABIERTA', HorasParadaEnTurno: Number(v.HorasParadaEnTurno || 0) });
        toast('Falla reportada: tome la foto');
      }, 'Reportar');
  }

  function formVinculo(parteID) {
    var p = getParte(parteID);
    var abiertas = N.filas('FALLAS', function (f) { return f.EquipoID === p.EquipoID && f.Estado !== 'CERRADA' && f.ParteID !== parteID; });
    hoja('Falla que continúa',
      campo('Falla abierta', '<select name="FallaID">' + abiertas.map(function (f) { return '<option value="' + f.FallaID + '">' + esc(f.Componente + ' · desde ' + fFH(f.FechaHoraInicio)) + '</option>'; }).join('') + '</select>', true) +
      campo('Horas paradas en este turno', '<input name="Horas" type="number" inputmode="decimal" min="0" max="' + turno(p.Turno).DuracionHoras + '" step="0.5">', true),
      function (v) {
        var h = R.num(v.Horas);
        if (h === null || h < 0 || h > Number(turno(p.Turno).DuracionHoras)) return 'Horas entre 0 y ' + turno(p.Turno).DuracionHoras + '.';
        N.guardar('FALLAS_PARTES', { FallaParteID: N.nuevoID('FP'), FallaID: v.FallaID, ParteID: parteID, HorasParadaEnTurno: h });
      }, 'Vincular');
  }

  // ------------------------------------------------------------ parte de papel leído con IA
  var iaSel = {};  // marcas del operador en la pantalla de revisión (sobreviven a los redibujos)
  function marcaIA(nombre, porDefecto) { return nombre in iaSel ? iaSel[nombre] : porDefecto; }
  var HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
  var UNIDADES = ['m3', 'm2', 't', 'km', 'viaje', 'gal', 'und', 'h'];
  /** Actividad leída lista para registrar: se guarda siempre, tal como la escribió el operador. */
  function actividadIA(a, p) {
    return { fila: R.actividadDesdeIA(a, catAct(), '', turno(p.Turno).HoraInicio, p.FrenteID) };
  }
  /** Horas de una actividad para mostrar (el parte de papel no siempre las trae). */
  function horasAct(a) { return a.HoraInicio || a.HoraFin ? (a.HoraInicio || '?') + '–' + (a.HoraFin || '?') : 'sin hora'; }
  /** Si el papel dice otra fecha o turno, manda el papel (solo en borradores y si no choca con otro parte). */
  function corregirDesdePapel(p, r) {
    if (p.Estado !== 'BORRADOR') return false;
    var f = R.fechaIA(r.fecha), tu = String(R.valorIA(r.turno) || '').toUpperCase();
    var min = R.sumarDias(hoy(), -Number(cfg().DIAS_MAX_RETRASO_REGISTRO || 2));
    var fecha = /^\d{4}-\d{2}-\d{2}$/.test(f || '') && f <= hoy() && f >= min ? f : p.FechaTrabajo;
    var tno = tu === 'DIA' || tu === 'NOCHE' ? tu : p.Turno;
    if (fecha === p.FechaTrabajo && tno === p.Turno) return false;
    var a = (cat().ASIGNACIONES || []).filter(function (x) { return x.EquipoID === p.EquipoID && x.OperadorID === p.OperadorID && x.Turno === tno && x.FechaInicio <= fecha; })[0];
    if (!a) return false;
    var choca = N.filas('PARTES_DIARIOS', function (x) { return x.ParteID !== p.ParteID && x.Estado !== 'ANULADO' && x.FechaTrabajo === fecha && x.Turno === tno && (x.EquipoID === p.EquipoID || x.OperadorID === p.OperadorID); }).length;
    if (choca) return false;
    p.FechaTrabajo = fecha; p.Turno = tno; p.AsignacionID = a.AsignacionID;
    return true;
  }
  function viajeIA(v) {
    var m = busca('MATERIALES', 'MaterialID', v.material_id);
    if (!m.MaterialID) return { falta: 'elija el material a mano' };
    if (!HORA.test(v.hora_salida || '') || !HORA.test(v.hora_llegada || '')) return { falta: 'faltan horas legibles' };
    if (!v.origen || !v.destino) return { falta: 'falta origen o destino' };
    if (!(R.num(v.cantidad) > 0)) return { falta: 'falta la cantidad' };
    return { fila: { HoraSalida: v.hora_salida, HoraLlegada: v.hora_llegada, Origen: v.origen, Destino: v.destino, MaterialID: m.MaterialID,
      Cantidad: R.num(v.cantidad), Unidad: m.UnidadPredeterminada, Observaciones: 'Leído por IA: ' + String(v.texto || '').substring(0, 200) } };
  }

  /** Abastecimiento leído del parte de papel, listo para registrar (o el motivo por el que no). */
  function abastIA(p, r) {
    var c = r.combustible;
    var g = c ? R.num(c.galones) : null;
    if (g === null) return null;
    var eq = equipo(p.EquipoID), t = turno(p.Turno);
    if (!(g > 0) || g > Number(cfg().MAX_GALONES_ABASTECIMIENTO || 300)) return { falta: 'galones fuera de rango (' + g + ')' };
    var h = eq.TieneHorometro ? R.num(c.horometro) : null;
    var nota = '';
    if (h !== null && ((R.num(p.HorometroInicial) !== null && h < Number(p.HorometroInicial)) || (R.num(p.HorometroFinal) !== null && h > Number(p.HorometroFinal)))) {
      nota = ' · horómetro anotado ' + h + ' fuera del turno: no se registra'; h = null;
    }
    // hora: la anotada; si no, la de la actividad de abastecimiento; si no, el inicio del turno
    var actAb = (r.actividades || []).filter(function (a) { return /abastec/i.test((catAct()[a.actividad_cat_id] || {}).Nombre || a.texto || ''); })[0];
    var hora = HORA.test(c.hora || '') ? c.hora : (actAb && HORA.test(actAb.hora_inicio || '') ? actAb.hora_inicio : t.HoraInicio);
    var fecha = p.Turno === 'NOCHE' && hora < t.HoraInicio ? R.sumarDias(p.FechaTrabajo, 1) : p.FechaTrabajo;
    return { fila: { ParteID: p.ParteID, EquipoID: p.EquipoID, FechaHora: fecha + 'T' + hora + ':00-05:00', Galones: g,
      HorometroAbastecimiento: h === null ? '' : h, OdometroAbastecimiento: eq.TieneOdometro && R.num(c.odometro) !== null ? R.num(c.odometro) : '',
      Observaciones: 'Leído por IA del parte de papel: ' + String(c.texto || '').substring(0, 150) + nota } };
  }
  function bloqueCombustibleIA(p, r, abierta) {
    var c = r.combustible, abs = N.hijos('ABASTECIMIENTOS', p.ParteID), x = abastIA(p, r);
    if (!c || !c.texto && R.num(c.galones) === null) {
      return '<div class="tarjeta"><h3>Combustible</h3><p class="sub">El parte de papel no anota abastecimiento.</p>' +
        (abierta && !abs.length && p.SinAbastecimiento !== true ? '<label class="check"><input type="checkbox" name="sinab"' + (marcaIA('sinab', true) ? ' checked' : '') + '><span>Marcar "Hoy no hubo abastecimiento"</span></label>' : '') + '</div>';
    }
    var f = x && x.fila;
    return '<div class="tarjeta"><div class="entre"><h3>Combustible</h3>' + chipConf(c) + '</div><p class="sub">' + esc(c.texto || '') + '</p>' +
      (f ? '<div class="mini">' + n1(f.Galones) + ' gal' + (f.HorometroAbastecimiento !== '' ? ' · horómetro ' + n1(f.HorometroAbastecimiento) : '') +
        (f.OdometroAbastecimiento !== '' ? ' · km ' + n1(f.OdometroAbastecimiento) : '') + ' · ' + fFH(f.FechaHora) + '</div>' : '') +
      (x && x.falta ? '<div class="mini">No se puede registrar: ' + esc(x.falta) + '. Regístrelo a mano.</div>' : '') +
      (abs.length ? '<div class="mini">Ya hay ' + abs.length + ' abastecimiento(s) registrado(s) en este parte.</div>' : '') +
      (abierta && f ? '<label class="check"><input type="checkbox" name="comb"' + (marcaIA('comb', !abs.length && (c.confianza === 'ALTA' || c.confianza === 'MEDIA')) ? ' checked' : '') + '><span>Registrar este abastecimiento en la app</span></label>' : '') + '</div>';
  }

  function vIA(id) {
    var p = getParte(id);
    if (!p) { location.replace('#/inicio'); return; }
    var eq = equipo(p.EquipoID);
    var puede = editable(p);
    var evs = N.hijos('EVIDENCIAS', id).filter(function (e) { return e.TipoEvidencia === 'PARTE_FISICO_FIRMADO' && !e._error; });
    var ev = evs[evs.length - 1];
    var l = ultimaLecturaParte(id);
    var r = l ? R.resultadoIA(l) : null;
    var abierta = puede && l && l.Estado === 'PROCESADA';
    var h = '<p class="sub">Tome una foto de todo el parte de papel: de frente, con buena luz, sin sombras y que se vean los bordes. ' +
      'La IA completa los datos; lo dudoso o ilegible queda marcado para que usted lo revise. Nada se registra hasta que usted confirme.</p>';
    if (puede) h += '<div class="lista">' + botonFoto(p, 'PARTE_FISICO_FIRMADO', 'Foto del parte de papel') + '</div>';
    if (ev) h += '<div class="fotos"><button type="button" class="foto" data-a="verFoto" data-k="' + ev.EvidenciaID + '" data-foto="' + ev.EvidenciaID + '" aria-label="Ver la foto del parte">' + ic('image') + '<span class="pie">Ver foto original</span></button></div>';
    if (!N.iaLista() && !l) h += '<div class="aviso">' + ic('alert') + '<div>La lectura con IA aún no está activada. Registre los datos a mano.</div></div>';
    if (r) {
      var fila = function (et, c, app) {
        var v = c ? (c.valor === null || c.valor === undefined ? '—' : c.valor) : '—';
        return '<tr><th>' + et + '</th><td><strong class="' + (typeof v === 'number' ? 'num' : '') + '">' + esc(typeof v === 'number' ? n1(v) : v) + '</strong>' +
          (c && c.texto && String(c.texto) !== String(v) ? '<div class="mini">Escrito: "' + esc(c.texto) + '"</div>' : '') +
          (app !== undefined ? '<div class="mini">En la app: ' + esc(app) + '</div>' : '') + '</td><td>' + chipConf(c) + '</td></tr>';
      };
      h += listaHallazgos(hallazgosIA(p));
      h += '<div class="etiqueta-seccion">Datos generales</div><div class="tarjeta"><table class="ia-tabla">' +
        fila('Fecha', r.fecha ? Object.assign({}, r.fecha, { valor: R.fechaIA(r.fecha) }) : r.fecha, fF(p.FechaTrabajo)) + fila('Turno', r.turno, p.Turno) + fila('Equipo', r.codigo_equipo, eq.CodigoInterno) + fila('Operador', r.operador, nombreOp(p.OperadorID)) + '</table></div>';
      var lect = [];
      if (eq.TieneHorometro) lect.push(['HorometroInicial', 'horometro_inicial', 'Horómetro inicial'], ['HorometroFinal', 'horometro_final', 'Horómetro final']);
      if (eq.TieneOdometro) lect.push(['OdometroInicial', 'odometro_inicial', 'Odómetro inicial'], ['OdometroFinal', 'odometro_final', 'Odómetro final']);
      h += '<div class="etiqueta-seccion">Lecturas del parte de papel</div><div class="tarjeta"><table class="ia-tabla">' +
        lect.map(function (x) { return fila(x[2], r[x[1]], R.num(p[x[0]]) === null ? 'vacío' : n1(p[x[0]])); }).join('') + '</table>' +
        (abierta ? lect.map(function (x) {
          var v = R.valorIA(r[x[1]]);
          if (v === null || R.num(p[x[0]]) === Number(v)) return '';
          var nom = 'lec_' + x[0];
          return '<label class="check"><input type="checkbox" name="' + nom + '"' + (marcaIA(nom, R.num(p[x[0]]) === null && r[x[1]].confianza === 'ALTA') ? ' checked' : '') + '><span>Usar ' + x[2].toLowerCase() + ' del papel: <strong class="num">' + n1(v) + '</strong></span></label>';
        }).join('') : '') + '</div>';
      var acts = r.actividades || [];
      h += '<div class="etiqueta-seccion">Actividades leídas (' + acts.length + ')</div><div class="lista">' + (acts.map(function (a, i) {
        var x = actividadIA(a, p);
        var c = catAct()[a.actividad_cat_id];
        var nom = 'act_' + i;
        var ok = !!x.fila && (a.confianza === 'ALTA' || a.confianza === 'MEDIA');
        return '<div class="tarjeta"><div class="entre"><div class="crece"><div>' + esc(a.texto || '—') + '</div><div class="mini">' + esc(c ? c.Nombre : 'Sin tipo') + ' · ' +
          esc(a.hora_inicio || '?') + '–' + esc(a.hora_fin || '?') + (a.cantidad !== null && a.cantidad !== undefined ? ' · ' + n1(a.cantidad) + ' ' + esc(a.unidad || '') : '') + (a.frente ? ' · ' + esc(a.frente) : '') + '</div>' +
          (x.falta ? '<div class="mini">Complete a mano: ' + esc(x.falta) + '.</div>' : '') + '</div>' + chipConf(a) + '</div>' +
          (abierta && x.fila ? '<label class="check"><input type="checkbox" name="' + nom + '"' + (marcaIA(nom, ok) ? ' checked' : '') + '><span>Registrar esta actividad</span></label>' : '') + '</div>';
      }).join('') || '<div class="vacio"><p>No se leyeron actividades.</p></div>') + '</div>';
      var vjs = r.viajes || [];
      if (vjs.length) h += '<div class="etiqueta-seccion">Viajes leídos (' + vjs.length + ')</div><div class="lista">' + vjs.map(function (v, i) {
        var x = viajeIA(v);
        var nom = 'via_' + i;
        return '<div class="tarjeta"><div class="entre"><div class="crece"><div>' + esc(v.texto || '—') + '</div><div class="mini">' + esc(v.hora_salida || '?') + '–' + esc(v.hora_llegada || '?') + ' · ' +
          esc(v.origen || '?') + ' → ' + esc(v.destino || '?') + ' · ' + esc(busca('MATERIALES', 'MaterialID', v.material_id).Nombre || v.material_texto || '?') + ' · ' + n1(v.cantidad) + ' ' + esc(v.unidad || '') + '</div>' +
          (x.falta ? '<div class="mini">Complete a mano: ' + esc(x.falta) + '.</div>' : '') + '</div>' + chipConf(v) + '</div>' +
          (abierta && x.fila ? '<label class="check"><input type="checkbox" name="' + nom + '"' + (marcaIA(nom, v.confianza === 'ALTA' || v.confianza === 'MEDIA') ? ' checked' : '') + '><span>Registrar este viaje</span></label>' : '') + '</div>';
      }).join('') + '</div>';
      var nota = function (t, o, extra) {
        if (!o || !o.texto) return '';
        return '<div class="tarjeta"><div class="entre"><h3>' + t + '</h3>' + chipConf(o) + '</div><p class="sub">' + esc(o.texto) + '</p>' + (extra || '') + '</div>';
      };
      h += '<div class="etiqueta-seccion">Otras anotaciones</div>' +
        nota('Volquetes', r.volquetes, r.volquetes && r.volquetes.cantidad !== null && r.volquetes.cantidad !== undefined ? '<div class="mini">Cantidad: ' + n1(r.volquetes.cantidad) + '</div>' : '') +
        bloqueCombustibleIA(p, r, abierta) +
        nota('Fallas (solo referencia)', r.fallas, puede ? '<button type="button" class="btn chico" data-a="iaFalla" data-id="' + id + '" data-l="' + l.LecturaID + '">' + ic('wrench') + 'Reportar la falla con este texto</button>' : '') +
        nota('Observaciones', r.observaciones, abierta ? '<label class="check"><input type="checkbox" name="obs"' + (marcaIA('obs', !p.ObservacionOperador) ? ' checked' : '') + '><span>Copiar a mi comentario</span></label>' : '') +
        ((r.no_reconocido || []).length ? '<div class="tarjeta"><h3>No se pudo leer</h3><ul class="sub">' + r.no_reconocido.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' : '') +
        (r.comentario ? '<p class="mini">Nota de la IA: ' + esc(r.comentario) + ' · calidad de la foto: ' + esc(r.calidad_imagen || '') + '</p>' : '');
      if (l.Estado === 'CONFIRMADA') h += '<div class="aviso">' + ic('checkc') + '<div>Confirmado por ' + esc(l.ConfirmadoPor || 'el operador') + (l.FechaConfirmacion ? ' el ' + fFH(l.FechaConfirmacion) : ' (por enviar)') + '.</div></div>';
      if (abierta) h += '<button type="button" class="btn primario ancho" data-a="iaAplicar" data-id="' + id + '" data-l="' + l.LecturaID + '">' + ic('checkc') + 'Registrar lo marcado y confirmar</button>' +
        '<button type="button" class="btn ancho" data-a="iaRepetir" data-ev="' + l.EvidenciaID + '">' + ic('refresh') + 'Volver a leer la foto</button>' +
        '<p class="mini">Lo que no marque no se registra. Revise las actividades y lecturas en sus pasos antes de enviar.</p>';
    }
    marco('Parte de papel con IA', '<form id="fIA" novalidate style="display:grid;gap:16px">' + h + '</form>', { volver: puede ? (modo() === 'detallado' ? '#/parte/' + id + '/paso/4' : '#/parte/' + id + '/rapido/3') : '#/parte/' + id });
    var f = document.getElementById('fIA');
    f.onchange = function (e) { if (e.target.name) iaSel[e.target.name] = e.target.checked; };
    hidratarFotos();
  }

  // ------------------------------------------------------------ detalle del parte (todos los roles)
  function vDetalle(id) {
    var p = getParte(id);
    if (!p) { marco('Parte', '<div class="vacio">' + ic('file') + '<p>Parte no disponible en este celular.</p></div>', { volver: '#/' + (rol() === 'OPERADOR' ? 'partes' : 'revisar') }); return; }
    var eq = equipo(p.EquipoID);
    var acts = N.hijos('ACTIVIDADES', id).sort(function (a, b) { return R.relInicio(a.HoraInicio, turno(p.Turno).HoraInicio) - R.relInicio(b.HoraInicio, turno(p.Turno).HoraInicio); });
    var al = R.alertasActividades(acts, turno(p.Turno), catAct(), cfg());
    var vs = N.hijos('VIAJES', id);
    var fs = N.filas('FALLAS', function (f) { return f.ParteID === id; });
    var ev = N.hijos('EVIDENCIAS', id);
    var revs = N.hijos('REVISIONES', id).sort(function (a, b) { return String(a.FechaHoraServidor || a.FechaHoraDispositivo).localeCompare(String(b.FechaHoraServidor || b.FechaHoraDispositivo)); });
    var lect = R.lecturas(p, eq, cfg(), true);
    var falt = R.fotosFaltantes(p, eq, ev, N.filas('FALLAS'), N.hijos('ABASTECIMIENTOS', id), cfg());
    var opPC = (busca('OPERADORES', 'OperadorID', p.OperadorID).PuedeCorregir) !== false;
    var permitidas = R.accionesPermitidas({ esAdmin: rol() === 'ADMIN', operadorID: perfil().OperadorID, supervisorID: perfil().SupervisorID,
      obras: perfil().Obras || [], puedeAprobar: perfil().PuedeAprobar }, p, opPC);
    if (N.estado().outbox.some(function (it) { return it.op === 'accion' && it.fila.ParteID === id; })) permitidas = [];
    var botones = '';
    if (editable(p)) botones += '<a class="btn primario ancho" href="' + rutaParte(id, p.Estado === 'OBSERVADO' ? 2 : 3) + '">' + ic('edit') + (p.Estado === 'OBSERVADO' ? 'Corregir parte' : 'Continuar y enviar') + '</a>';
    botones += botonBorrarParte(p);
    if (rol() === 'ADMIN' && fechaPapelDistinta(p)) {
      botones += '<button class="btn ancho primario" data-a="flujo" data-acc="FECHA_PAPEL" data-id="' + id + '">' + ic('calendar') + 'Usar la fecha y turno del papel (' + fechaPapelDistinta(p) + ')</button>';
    }
    if (rol() === 'ADMIN' && p.Estado === 'BORRADOR') {
      var pe = puedeEnviar(p);
      botones += pe.ok ? '<button class="btn ancho primario" data-a="flujo" data-acc="ENVIAR" data-id="' + id + '">' + ic('send') + 'Enviar por el operador</button>'
        : '<div class="aviso">' + ic('alert') + '<div><strong>Aún no se puede enviar por el operador.</strong><ul>' + pe.faltan.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></div>';
    }
    var etiquetas = { APROBAR: ['checkc', 'primario', 'Aprobar'], OBSERVAR: ['alert', '', 'Observar'], EXCEPCION: ['check', '', 'Aceptar excepción de lectura'], ANULAR: ['x', 'peligro', 'Anular'], REABRIR: ['refresh', '', 'Reabrir'] };
    permitidas.filter(function (a) { return etiquetas[a] && (a !== 'EXCEPCION' || (p.ExcepcionLectura && !p.ExcepcionAutorizadaPor)); }).forEach(function (a) {
      var e = etiquetas[a];
      botones += '<button class="btn ancho ' + e[1] + '" data-a="flujo" data-acc="' + a + '" data-id="' + id + '">' + ic(e[0]) + e[2] + '</button>';
    });
    var cuerpo = '<div class="entre"><div><div class="codigo">' + esc(p.CodigoParte) + '</div><h1>' + esc(eq.CodigoInterno || '') + '</h1>' +
      '<div class="sub">' + fF(p.FechaTrabajo) + ' · turno ' + esc(p.Turno) + ' · ' + esc(nombreOp(p.OperadorID)) + '</div></div>' + chip(p) + '</div>' +
      (p._error ? '<div class="aviso peligro">' + ic('alert') + '<div><strong>Rechazado por el servidor</strong><div>' + esc(p._error) + '</div></div></div>' : '') +
      (p.Estado === 'OBSERVADO' ? '<div class="aviso acento">' + ic('alert') + '<div><strong>Observación</strong><div>' + esc(p.Observaciones) + '</div></div></div>' : '') +
      (lect.alertas.length || p.ExcepcionLectura ? '<div class="aviso acento">' + ic('alert') + '<div><strong>Excepción de lectura</strong><div>' + esc(lect.alertas.join(' ')) + '</div>' +
        (p.ExcepcionLectura ? '<div class="sub">Excepción del operador: ' + esc(p.MotivoExcepcion) + (p.ExcepcionAutorizadaPor ? ' · aceptada por ' + esc(p.ExcepcionAutorizadaPor) : ' · sin aceptar') + '</div>' : '') + '</div></div>' : '') +
      (falt.length && p.Estado !== 'BORRADOR' ? '<div class="aviso peligro">' + ic('camera') + '<div>Faltan fotos: ' + esc(falt.join(', ')) + '</div></div>' : '') +
      (p.Estado !== 'BORRADOR' && !N.hijos('ABASTECIMIENTOS', id).length && p.SinAbastecimiento === true ? '<div class="aviso">' + ic('fuel') + '<div>El operador declaró que no hubo abastecimiento.</div></div>' : '') +
      seccionIA(p, ev) +
      (botones ? '<div class="acciones">' + botones + '</div>' : '') +
      '<div class="kpis"><div class="kpi"><div class="v num">' + n1(p.HorasTrabajadas) + '</div><div class="l">Horas horómetro</div></div>' +
      '<div class="kpi"><div class="v num">' + n1(acts.filter(function (a) { var t = (catAct()[a.ActividadCatID] || {}).TipoActividad; return t === 'PRODUCTIVA' || t === 'SERVICIO'; }).reduce(function (s, a) { return s + Number(a.DuracionHoras || 0); }, 0)) + '</div><div class="l">Horas productivas</div></div>' +
      '<div class="kpi"><div class="v num">' + n1(p.KmRecorridos) + '</div><div class="l">Km</div></div><div class="kpi"><div class="v num">' + vs.length + '</div><div class="l">Viajes</div></div></div>' +
      '<div class="tarjeta"><dl class="datos-def"><dt>Obra</dt><dd>' + esc(nombreObra(p.ObraID)) + '</dd><dt>Frente</dt><dd>' + esc(nombreFrente(p.FrenteID)) + '</dd>' +
      (eq.TieneHorometro ? '<dt>Horómetro</dt><dd>' + n1(p.HorometroInicial) + ' → ' + n1(p.HorometroFinal) + '</dd>' : '') +
      (eq.TieneOdometro ? '<dt>Odómetro</dt><dd>' + n1(p.OdometroInicial) + ' → ' + n1(p.OdometroFinal) + '</dd>' : '') +
      '<dt>Enviado (celular)</dt><dd>' + fFH(p.FechaEnvio) + '</dd><dt>Recibido (servidor)</dt><dd>' + fFH(p.FechaRecepcionServidor) + '</dd>' + (sinPlazo() ? '' : '<dt>Plazo</dt><dd>' + fFH(p.FechaHoraLimite) + '</dd>') + '</dl></div>' +
      '<div class="etiqueta-seccion">Actividades (' + acts.length + ')</div><div class="lista">' + (acts.map(function (a) {
        var c = catAct()[a.ActividadCatID] || {};
        return '<div class="tarjeta"><div class="entre"><div><h3>' + esc(a.Descripcion || c.Nombre || 'Actividad') + '</h3><div class="mini num">' + horasAct(a) + (a.DuracionHoras ? ' · ' + n1(a.DuracionHoras) + ' h' : '') + (a.CantidadProducida !== '' && a.CantidadProducida !== undefined ? ' · ' + n1(a.CantidadProducida) + ' ' + esc(a.Unidad) : '') + '</div></div>' +
          (al[a.ActividadID] ? '<span class="estado alerta">' + ic('alert') + esc(al[a.ActividadID]) + '</span>' : '') + '</div></div>';
      }).join('') || '<p class="mini">Sin actividades.</p>') + '</div>' +
      (vs.length ? '<div class="etiqueta-seccion">Viajes (' + vs.length + ')</div><div class="tarjeta"><div class="lista">' + vs.sort(function (a, b) { return a.NumeroViaje - b.NumeroViaje; }).map(function (v) {
        return '<div class="entre mini num"><span>#' + v.NumeroViaje + ' ' + v.HoraSalida + '–' + v.HoraLlegada + '</span><span>' + n1(v.Cantidad) + ' ' + esc(v.Unidad) + '</span></div>';
      }).join('') + '</div></div>' : '') +
      (fs.length ? '<div class="etiqueta-seccion">Fallas</div>' + fs.map(function (f) {
        return '<a class="tarjeta tocable" href="#/falla/' + f.FallaID + '" style="display:block;color:inherit;text-decoration:none"><div class="entre"><div><h3>' + esc(f.Componente) + '</h3><div class="sub">' + esc(f.Descripcion) + '</div></div><span class="estado alerta">' + ic('wrench') + esc(f.Estado) + '</span></div></a>';
      }).join('') : '') +
      '<div class="etiqueta-seccion">Fotos (' + ev.length + ')</div>' + galeria(ev) +
      '<div class="etiqueta-seccion">Historial (' + revs.length + ')</div>' + historial(revs);
    marco(p.CodigoParte || 'Parte', cuerpo, { volver: rol() === 'OPERADOR' ? '#/partes' : '#/revisar' });
  }

  /** Historial del parte: lo más reciente primero; se ven los 3 últimos y el resto queda plegado. */
  function historial(revs) {
    if (!revs.length) return '<div class="tarjeta"><p class="mini">Sin movimientos.</p></div>';
    var corto = function (t) { t = String(t || ''); return t.length > 160 ? t.substring(0, 157) + '…' : t; };
    var fila = function (r) {
      // la viñeta la dibuja el CSS (::before): un elemento vacío aquí empujaba el texto a la columna de 14 px
      return '<div class="' + (r.ResultadoServidor === 'APLICADA' ? 'ok' : '') + '"><div class="crece" style="min-width:0;overflow-wrap:anywhere"><strong>' + esc(r.Accion) + '</strong> · ' + esc(r.Usuario) +
        '<div class="mini">' + (r.FechaHoraServidor ? 'servidor ' + fFH(r.FechaHoraServidor) : 'pendiente de sincronización') +
        (r.ResultadoServidor === 'RECHAZADA' ? ' · RECHAZADA: ' + esc(corto(r.DetalleServidor)) : '') + '</div>' +
        (r.Comentario ? '<div class="sub">' + esc(corto(r.Comentario)) + '</div>' : '') + '</div></div>';
    };
    var lista = revs.slice().reverse();
    return '<div class="tarjeta linea-tiempo">' + lista.slice(0, 3).map(fila).join('') + '</div>' +
      (lista.length > 3 ? '<details class="historial-mas"><summary class="btn ancho">Ver historial completo (' + (lista.length - 3) + ' más)</summary>' +
        '<div class="tarjeta linea-tiempo">' + lista.slice(3).map(fila).join('') + '</div></details>' : '');
  }

  /** Resumen de la IA en el detalle: diferencias encontradas y lo leído en cada foto (para el revisor). */
  function seccionIA(p, ev) {
    var conIA = ev.filter(function (e) { return N.IA_TIPOS.indexOf(e.TipoEvidencia) >= 0 && !e._error; });
    if (!conIA.length) return '';
    var nombres = { PARTE_FISICO_FIRMADO: 'Parte de papel', HOROMETRO_INICIAL: 'Horómetro inicial', HOROMETRO_FINAL: 'Horómetro final', ODOMETRO_INICIAL: 'Odómetro inicial',
      ODOMETRO_FINAL: 'Odómetro final', HOROMETRO_ABASTECIMIENTO: 'Horómetro al abastecer', ABASTECIMIENTO: 'Abastecimiento', CANTIDAD_ABASTECIDA: 'Cantidad abastecida' };
    return '<div class="etiqueta-seccion">Lectura con IA</div>' + listaHallazgos(hallazgosIA(p)) +
      '<div class="tarjeta lista">' + conIA.map(function (e) {
        return '<div class="foto-req" style="flex-wrap:wrap">' + ic('image') + '<span class="crece">' + esc(nombres[e.TipoEvidencia]) + '</span>' + cajaIA(p, e, { AbastecimientoID: e.AbastecimientoID }) + '</div>';
      }).join('') + '</div>';
  }

  function flujo(id, acc) {
    var p = getParte(id);
    var nombres = { FECHA_PAPEL: 'Usar la fecha del parte de papel', ENVIAR: 'Enviar por el operador', APROBAR: 'Aprobar parte', OBSERVAR: 'Observar parte', EXCEPCION: 'Aceptar excepción de lectura', ANULAR: 'Anular parte', REABRIR: 'Reabrir parte aprobado' };
    if (R.REQUIERE_COMENTARIO.indexOf(acc) >= 0) {
      hoja(nombres[acc], '<p class="sub">' + esc(p.CodigoParte) + '</p>' + campo(acc === 'OBSERVAR' ? 'Qué debe corregir el operador' : 'Motivo', '<textarea name="c" required></textarea>', true),
        function (v) {
          if (String(v.c || '').trim().length < 5) return 'Escriba el motivo (mínimo 5 letras).';
          N.accion(p, acc, v.c.trim());
          toast(nombres[acc] + ': enviado');
        }, acc === 'ANULAR' ? 'Anular' : 'Confirmar');
    } else {
      confirmar(nombres[acc], acc === 'FECHA_PAPEL' ? 'El parte digital (' + fF(p.FechaTrabajo) + ' ' + p.Turno + ') pasará a ' + fechaPapelDistinta(p) + ', como dice el parte de papel. Si ya hay otro parte en esa fecha y turno, se le avisará y no se cambiará.'
        : acc === 'ENVIAR' ? 'Revise que la fecha (' + fF(p.FechaTrabajo) + '), el turno (' + p.Turno + ') y el equipo estén bien: después el operador ya no podrá cambiarlos. Quedará registrado que usted lo envió.'
        : '¿Confirma? Quedará registrado con su nombre y la hora del servidor.', acc === 'APROBAR' ? 'Aprobar' : acc === 'ENVIAR' ? 'Enviar' : 'Confirmar').then(function (si) {
        if (si) { N.accion(p, acc, ''); toast(acc === 'FECHA_PAPEL' ? 'Cambiando la fecha…' : 'Enviado'); render(); }
      });
    }
  }

  // ------------------------------------------------------------ supervisor / administrador
  function vRevisar() {
    var filtros = [['POR_REVISAR', 'Por revisar', function (p) { return p.Estado === 'PENDIENTE_REVISION' || p.Estado === 'CORREGIDO'; }],
      ['OBSERVADO', 'Observados', function (p) { return p.Estado === 'OBSERVADO'; }],
      ['ALERTAS', 'Excepciones', function (p) { return p.Estado !== 'ANULADO' && p.ExcepcionLectura === true && !p.ExcepcionAutorizadaPor; }],
      ['TODOS', 'Todos', function () { return true; }]];
    // borradores completos que el operador olvidó enviar (solo el administrador los puede enviar por él)
    if (rol() === 'ADMIN') filtros.splice(1, 0, ['LISTOS', 'Listos sin enviar', function (p) { return p.Estado === 'BORRADOR' && puedeEnviar(p).ok; }]);
    var f = filtros.filter(function (x) { return x[0] === filtroRevisar; })[0] || filtros[0];
    var buscando = !!String(busq.revisar || '').trim();
    var pasa = function (p) { return coincide('revisar', textoParte(p)); };
    // orden alfabético por equipo (CAM-001, CAM-002…, CV-001…, EXC-001…); en el mismo equipo, el más reciente primero
    var l = N.filas('PARTES_DIARIOS', function (p) { return f[2](p) && pasa(p); }).sort(function (a, b) {
      return String(equipo(a.EquipoID).CodigoInterno || a.EquipoID).localeCompare(String(equipo(b.EquipoID).CodigoInterno || b.EquipoID), 'es', { numeric: true }) ||
        (b.FechaTrabajo + b.Turno).localeCompare(a.FechaTrabajo + a.Turno);
    });
    var grupos = {};
    l.forEach(function (p) { (grupos[p.ObraID] = grupos[p.ObraID] || []).push(p); });
    marco(rol() === 'ADMIN' ? 'Revisión (administrador)' : 'Revisar partes',
      barraBusq('revisar', 'Buscar equipo, operador, fecha o código…') +
      '<div class="segmento" role="group" aria-label="Filtro">' + filtros.map(function (x) {
        return '<button type="button" data-a="filtro" data-v="' + x[0] + '" aria-pressed="' + (x[0] === f[0]) + '">' + x[1] + ' (' + N.filas('PARTES_DIARIOS', function (p) { return x[2](p) && pasa(p); }).length + ')</button>';
      }).join('') + '</div>' +
      (buscando ? '<p class="mini">' + l.length + ' resultado(s) en "' + esc(f[1]) + '". Para buscar en todos los partes elija "Todos".</p>' : '') +
      (l.length ? Object.keys(grupos).map(function (o) {
        return '<div class="etiqueta-seccion">' + esc(nombreObra(o)) + '</div><div class="lista">' + grupos[o].slice(0, buscando ? 400 : 150).map(function (p) {
          if (f[0] !== 'LISTOS') return tarjetaParte(p);
          // si el papel no calza con la fecha, turno, equipo u operador, se avisa antes de enviar
          var dudas = hallazgosIA(p).filter(function (h) { return h.estado === 'INCONSISTENTE'; });
          return '<div style="display:grid;gap:6px">' + tarjetaParte(p) +
            (dudas.length ? '<div class="aviso peligro">' + ic('alert') + '<div><strong>Revíselo antes de enviar:</strong><ul>' + dudas.map(function (h) { return '<li>' + esc(h.mensaje) + '</li>'; }).join('') + '</ul></div></div>' : '') +
            (fechaPapelDistinta(p) ? '<button class="btn chico" data-a="flujo" data-acc="FECHA_PAPEL" data-id="' + p.ParteID + '">' + ic('calendar') + 'Usar fecha del papel (' + fechaPapelDistinta(p) + ')</button>' : '') +
            '<button class="btn chico ' + (dudas.length ? '' : 'primario') + '" data-a="flujo" data-acc="ENVIAR" data-id="' + p.ParteID + '">' + ic('send') + 'Enviar por el operador</button></div>';
        }).join('') + '</div>';
      }).join('') : '<div class="vacio">' + ic(buscando ? 'alert' : 'checkc') + '<p>' + (buscando ? 'No se encontró nada con esa búsqueda.' : 'Nada pendiente aquí.') + '</p></div>'));
  }

  /**
   * Cumplimiento por OPERADOR: cada operador activo debe un parte por día, de día o de noche (el que trabajó).
   * Esperados = operadores en obra. Así el turno noche cuenta igual que el día.
   */
  function vCumplimiento() {
    var fechas = [];
    for (var i = 0; i < 8; i++) fechas.push(R.sumarDias(hoy(), -i));
    if (!diaCumpl || fechas.indexOf(diaCumpl) < 0) diaCumpl = R.proponer(Date.now()).fecha;
    var SIN_ENVIAR = ['BORRADOR', 'PENDIENTE_SINCRONIZACION'];
    var partes = N.filas('PARTES_DIARIOS', function (p) { return p.FechaTrabajo === diaCumpl && p.Estado !== 'ANULADO'; });
    var ops = (cat().OPERADORES || []).filter(function (o) { return !o.Estado || o.Estado === 'ACTIVO' || partes.some(function (p) { return p.OperadorID === o.OperadorID; }); });
    var filas = ops.map(function (o) {
      var mios = partes.filter(function (p) { return p.OperadorID === o.OperadorID; });
      var env = mios.filter(function (p) { return SIN_ENVIAR.indexOf(p.Estado) < 0; });
      var p = env[0] || mios[0] || null;
      return { o: o, p: p, todos: env.length ? env : mios, e: env.length ? 'ENVIADO' : p ? 'BORRADOR' : 'SIN' };
    });
    var n = function (f) { return filas.filter(f).length; };
    var env = n(function (f) { return f.e === 'ENVIADO'; });
    var dia = n(function (f) { return f.e === 'ENVIADO' && f.todos.some(function (p) { return p.Turno === 'DIA'; }); });
    var noche = n(function (f) { return f.e === 'ENVIADO' && f.todos.some(function (p) { return p.Turno === 'NOCHE'; }); });
    var pct = filas.length ? Math.round(env * 100 / filas.length) : 0;
    var chipC = function (f) {
      return f.e === 'ENVIADO' ? '<span class="estado ok">' + ic('checkc') + 'Enviado</span>'
        : f.e === 'BORRADOR' ? '<span class="estado alerta">' + ic('clock') + 'Sin enviar</span>'
        : '<span class="estado peligro">' + ic('alert') + 'Sin parte</span>';
    };
    var avisados = avisadosCumpl(diaCumpl);
    var tarjeta = function (f) {
      var det = f.todos.length ? f.todos.map(function (p) { return (equipo(p.EquipoID).CodigoInterno || p.EquipoID) + ' · ' + (p.Turno === 'DIA' ? 'Turno día' : 'Turno noche'); }).join(' / ') : 'No registró parte';
      var nombre = esc(f.o.Nombre || f.o.OperadorID);
      var inner = '<div class="entre"><div style="min-width:0"><h3>' + (f.p ? '<a href="#/parte/' + f.p.ParteID + '" style="color:inherit">' + nombre + '</a>' : nombre) + '</h3><div class="mini">' + esc(det) + '</div></div>' + chipC(f) + '</div>';
      var wa = '';
      if (f.e !== 'ENVIADO') {
        var ya = avisados[f.o.OperadorID];
        wa = f.o.Telefono
          ? '<a class="btn chico ancho" style="margin-top:10px;background:#25D366;border-color:#25D366;color:#fff;font-weight:700" target="_blank" rel="noopener" data-a="avisar" data-k="' + f.o.OperadorID + '" href="' + esc(enlaceAviso(f, diaCumpl)) + '">' +
            ic('send') + (ya ? 'Avisado ' + ya + ' · avisar otra vez' : 'Avisar por WhatsApp') + '</a>'
          : '<div class="mini" style="margin-top:8px">Sin celular registrado</div>';
      }
      return '<div class="tarjeta">' + inner + wa + '</div>';
    };
    var orden = function (a, b) { return String(a.o.Nombre).localeCompare(String(b.o.Nombre)); };
    var pasa = function (f) {
      return coincide('cumpl', [f.o.Nombre, f.o.Telefono, f.e === 'SIN' ? 'sin parte' : f.e === 'BORRADOR' ? 'sin enviar borrador' : 'enviado'].concat(f.todos.map(textoParte)).join(' '));
    };
    var seccion = function (titulo, l) { l = l.filter(pasa); return l.length ? '<div class="etiqueta-seccion">' + titulo + ' (' + l.length + ')</div><div class="lista">' + l.sort(orden).map(tarjeta).join('') + '</div>' : ''; };
    var domingo = new Date(diaCumpl + 'T12:00:00Z').getUTCDay() === 0;
    marco('Cumplimiento', '<div class="pasos">' + fechas.map(function (f) {
      return '<button type="button" data-a="dia" data-v="' + f + '"' + (f === diaCumpl ? ' aria-current="step"' : '') + '>' + fF(f).substring(0, 5) + '</button>';
    }).join('') + '</div>' +
      '<div class="kpis"><div class="kpi"><div class="v acento num">' + pct + '%</div><div class="l">Cumplimiento</div></div>' +
      '<div class="kpi"><div class="v num">' + filas.length + '</div><div class="l">Esperados (operadores)</div></div>' +
      '<div class="kpi"><div class="v num">' + dia + '</div><div class="l">Turno día</div></div>' +
      '<div class="kpi"><div class="v num">' + noche + '</div><div class="l">Turno noche</div></div>' +
      '<div class="kpi"><div class="v num">' + n(function (f) { return f.e === 'BORRADOR'; }) + '</div><div class="l">Guardados sin enviar</div></div>' +
      '<div class="kpi"><div class="v num">' + n(function (f) { return f.e === 'SIN'; }) + '</div><div class="l">Sin parte</div></div></div>' +
      (domingo ? '<div class="aviso">' + ic('calendar') + '<div>Domingo: solo hay turno día.</div></div>' : '') +
      barraBusq('cumpl', 'Buscar operador o equipo…') +
      (String(busq.cumpl || '').trim() && !filas.some(pasa) ? '<div class="vacio">' + ic('alert') + '<p>No se encontró nada con esa búsqueda.</p></div>' : '') +
      seccion('Sin parte', filas.filter(function (f) { return f.e === 'SIN'; })) +
      seccion('Guardado pero no enviado', filas.filter(function (f) { return f.e === 'BORRADOR'; })) +
      seccion('Enviados · turno día', filas.filter(function (f) { return f.e === 'ENVIADO' && f.p.Turno === 'DIA'; })) +
      seccion('Enviados · turno noche', filas.filter(function (f) { return f.e === 'ENVIADO' && f.p.Turno === 'NOCHE'; })) +
      (filas.length ? '' : '<div class="vacio">' + ic('calendar') + '<p>No hay operadores registrados.</p></div>'));
  }

  /** Mensaje de WhatsApp listo para el operador que no envió su parte (mismo texto que el correo de las 19:30/07:30). */
  function enlaceAviso(f, fecha) {
    var app = location.origin + location.pathname.replace(/index\.html$/, '');
    var dm = fF(fecha).substring(0, 5);
    var t;
    if (f.e === 'BORRADOR') {
      var p = f.p, eq = equipo(p.EquipoID).CodigoInterno || '';
      t = 'Hola ' + f.o.Nombre + ', tu parte diario del turno ' + (p.Turno === 'DIA' ? 'DÍA' : 'NOCHE') + ' del ' + dm + (eq ? ' (' + eq + ')' : '') +
        ' está GUARDADO pero NO ENVIADO. Entra a la app AXION, abre el parte y pulsa ENVIAR: ' + app + ' Gracias.';
    } else {
      t = 'Hola ' + f.o.Nombre + ', no hemos recibido tu parte diario del ' + dm + '. Por favor envíalo hoy desde la app AXION: elige tu turno, la fecha y tu equipo, y toma la foto del parte: ' + app + ' Gracias.';
    }
    return 'https://wa.me/51' + f.o.Telefono + '?text=' + encodeURIComponent(t);
  }
  /** Quiénes ya fueron avisados ese día desde este celular (solo para que el administrador no repita). */
  function avisadosCumpl(fecha, opID) {
    var m = {};
    try { m = JSON.parse(localStorage.getItem('axion_avisos') || '{}'); } catch (e) { m = {}; }
    if (opID) {
      Object.keys(m).forEach(function (k) { if (k < R.sumarDias(hoy(), -10)) delete m[k]; });
      (m[fecha] = m[fecha] || {})[opID] = R.enLima(Date.now()).hora;
      try { localStorage.setItem('axion_avisos', JSON.stringify(m)); } catch (e) { /* nada */ }
    }
    return m[fecha] || {};
  }

  function vCumplimientoEquipos() {
    var todos = N.filas('CUMPLIMIENTO');
    var fechas = Array.from(new Set(todos.map(function (c) { return c.FechaTrabajo; }))).sort().reverse();
    if (!diaCumpl || fechas.indexOf(diaCumpl) < 0) diaCumpl = fechas[0];
    var aceptar = cfg().ACEPTAR_SINCRONIZACION_TARDIA === 'SI';
    var dia = todos.filter(function (c) { return c.FechaTrabajo === diaCumpl; }).map(function (c) {
      var p = c.ParteID ? N.fila('PARTES_DIARIOS', c.ParteID) : null;
      return Object.assign({}, c, { E: p || !c.EstadoCumplimiento ? R.estadoCumplimiento(c.FechaHoraLimite, p, Date.now(), aceptar, sinPlazo()) : c.EstadoCumplimiento });
    });
    var cnt = function (f) { return dia.filter(f).length; };
    var aTiempo = cnt(function (c) { return c.E === 'A TIEMPO'; }) + (aceptar ? cnt(function (c) { return c.E === 'ENVIADO A TIEMPO - SINCRONIZADO TARDE'; }) : 0);
    var enPlazo = cnt(function (c) { return /EN PLAZO/.test(c.E); });
    var pct = dia.length - enPlazo ? Math.round(aTiempo * 100 / (dia.length - enPlazo)) : 0;
    marco('Cumplimiento', '<div class="pasos">' + fechas.slice(0, 8).map(function (f) {
      return '<button type="button" data-a="dia" data-v="' + f + '"' + (f === diaCumpl ? ' aria-current="step"' : '') + '>' + fF(f).substring(0, 5) + '</button>';
    }).join('') + '</div>' +
      '<div class="kpis"><div class="kpi"><div class="v acento num">' + pct + '%</div><div class="l">Cumplimiento</div></div>' +
      '<div class="kpi"><div class="v num">' + dia.length + '</div><div class="l">Esperados</div></div>' +
      '<div class="kpi"><div class="v num">' + cnt(function (c) { return c.E === 'ATRASADO'; }) + '</div><div class="l">Atrasados</div></div>' +
      '<div class="kpi"><div class="v num">' + cnt(function (c) { return /^SIN/.test(c.E); }) + '</div><div class="l">Sin parte</div></div></div>' +
      '<div class="lista">' + dia.sort(function (a, b) { return a.E.localeCompare(b.E); }).map(function (c) {
        var eq = equipo(c.EquipoID);
        var inner = '<div class="entre"><div><h3>' + esc(eq.CodigoInterno || c.EquipoID) + ' · ' + esc(c.Turno) + '</h3><div class="mini">' + esc(nombreOp(c.OperadorID)) + (sinPlazo() ? '' : ' · plazo ' + fFH(c.FechaHoraLimite)) + '</div></div>' + chipCumpl(c.E) + '</div>';
        return c.ParteID ? '<a class="tarjeta tocable" href="#/parte/' + c.ParteID + '" style="display:block;color:inherit;text-decoration:none">' + inner + '</a>' : '<div class="tarjeta">' + inner + '</div>';
      }).join('') + '</div>' + (dia.length ? '' : '<div class="vacio">' + ic('calendar') + '<p>Sin partes esperados.</p></div>'));
  }

  function vFallas() {
    var l = N.filas('FALLAS', function (f) {
      var eq = equipo(f.EquipoID);
      return coincide('fallas', [f.CodigoFalla, eq.CodigoInterno, eq.PlacaSerie, f.Componente, f.Descripcion, f.Estado, busca('SISTEMAS_FALLA', 'SistemaID', f.SistemaID).Nombre].join(' '));
    }).sort(function (a, b) { return (a.Estado === 'CERRADA') - (b.Estado === 'CERRADA') || String(b.FechaHoraInicio).localeCompare(String(a.FechaHoraInicio)); });
    marco('Fallas', pestanasMantto('fallas') + (rol() === 'OPERADOR' ? '' : '<button class="btn primario ancho" data-a="fallaAdmin">' + ic('plus') + 'Registrar falla / intervención</button>') +
      barraBusq('fallas', 'Buscar equipo, componente o código…') + (l.length ? '<div class="lista">' + l.map(function (f) {
      var eq = equipo(f.EquipoID);
      return '<a class="tarjeta tocable" href="#/falla/' + f.FallaID + '" style="display:block;color:inherit;text-decoration:none"><div class="entre"><div><div class="codigo">' + esc(f.CodigoFalla) + '</div><h3>' + esc(eq.CodigoInterno) + ' · ' + esc(f.Componente) + '</h3>' +
        '<div class="mini">' + esc(busca('SISTEMAS_FALLA', 'SistemaID', f.SistemaID).Nombre) + ' · desde ' + fFH(f.FechaHoraInicio) + '</div></div>' +
        '<span class="estado ' + (f.Estado === 'CERRADA' ? 'ok' : 'alerta') + '">' + ic(f.Estado === 'CERRADA' ? 'checkc' : 'wrench') + esc(f.Estado) + '</span></div></a>';
    }).join('') + '</div>' : '<div class="vacio">' + ic('wrench') + '<p>' + (String(busq.fallas || '').trim() ? 'No se encontró nada con esa búsqueda.' : 'Sin fallas registradas.') + '</p></div>'));
  }

  function vFalla(id) {
    var f = N.fila('FALLAS', id);
    if (!f) { marco('Falla', '<div class="vacio"><p>No disponible.</p></div>', { volver: '#/fallas' }); return; }
    var turnos = N.filas('FALLAS_PARTES', function (x) { return x.FallaID === id; });
    var revisor = rol() !== 'OPERADOR';
    marco(f.CodigoFalla, '<div class="entre"><h1>' + esc(f.Componente) + '</h1><span class="estado alerta">' + esc(f.Estado) + '</span></div>' +
      '<div class="tarjeta"><dl class="datos-def"><dt>Equipo</dt><dd>' + esc(equipo(f.EquipoID).CodigoInterno) + '</dd><dt>Sistema</dt><dd>' + esc(busca('SISTEMAS_FALLA', 'SistemaID', f.SistemaID).Nombre) + '</dd>' +
      '<dt>Inicio</dt><dd>' + fFH(f.FechaHoraInicio) + '</dd><dt>Término</dt><dd>' + fFH(f.FechaHoraFin) + '</dd><dt>Parada calendario</dt><dd>' + n1(f.TiempoParadaHoras) + ' h</dd>' +
      '<dt>Turnos afectados</dt><dd>' + turnos.length + '</dd><dt>Responsable</dt><dd>' + esc(f.Responsable || '—') + '</dd>' +
      '<dt>Mecánico</dt><dd>' + esc(f.Mecanico || '—') + '</dd><dt>Tipo de intervención</dt><dd>' + esc(f.TipoIntervencion || '—') + '</dd>' +
      '<dt>Falla funcional</dt><dd>' + esc(f.FallaFuncional || '—') + '</dd><dt>Repuesto pendiente</dt><dd>' + esc(f.RepuestoPendiente || '—') + '</dd>' +
      '<dt>Fecha de cierre</dt><dd>' + (f.FechaCierre ? fF(f.FechaCierre) : '—') + '</dd></dl></div>' +
      '<div class="tarjeta"><h3>Descripción</h3><p class="sub">' + esc(f.Descripcion) + '</p>' + (f.CausaHallazgo ? '<h3>Causa y hallazgo</h3><p class="sub">' + esc(f.CausaHallazgo) + '</p>' : '') +
      (f.AccionRealizada ? '<h3>Acción realizada</h3><p class="sub">' + esc(f.AccionRealizada) + '</p>' : '') + '</div>' +
      (revisor ? '<button class="btn primario ancho" data-a="fallaAdmin" data-k="' + id + '">' + ic('edit') + 'Editar falla / intervención</button>' : '') +
      (revisor && f.Estado !== 'CERRADA' ? '<button class="btn ancho" data-a="cerrarFalla" data-k="' + id + '">' + ic('check') + 'Registrar reparación / cerrar</button>' : '') +
      (f.ParteID ? '<a class="btn ancho" href="#/parte/' + f.ParteID + '">' + ic('file') + 'Ver parte de origen</a>' : '<p class="mini">Registrada por ' + esc(f.ReportadoPor || 'el administrador') + ' (sin parte diario).</p>'), { volver: '#/fallas' });
  }

  // ------------------------------------------------------------ mantenimiento (administrador y supervisores)
  var TIPOS_INT = ['CORRECTIVO', 'DIFERIDO', 'PREVENTIVO', 'INSPECCION', 'CONDICION'];
  var LINEA_FAM = {
    'LINEA AMARILLA': ['EXCAVADORA', 'CARGADOR FRONTAL', 'MOTONIVELADORA', 'RODILLO', 'TRACTOR ORUGA', 'RETROEXCAVADORA'],
    'LINEA BLANCA': ['VOLQUETE', 'CISTERNA', 'CISTERNA DE COMBUSTIBLE', 'CAMION GRUA', 'CAMION BARANDA'],
    'TRANSPORTE DE PERSONAL': ['CAMIONETA', 'MINIBUS', 'AMBULANCIA']
  };
  function lineaDe(eq) {
    var m = busca('MANTENIMIENTOS', 'EquipoID', eq.EquipoID);
    if (m.Linea) return m.Linea;
    for (var k in LINEA_FAM) if (LINEA_FAM[k].indexOf(eq.Familia) >= 0) return k;
    return 'OTROS';
  }
  function equiposObra() { return (cat().EQUIPOS || []).filter(function (e) { return e.Estado !== 'BAJA'; }); }
  function pestanasMantto(act) {
    if (rol() === 'OPERADOR') return '';
    return '<div class="segmento" role="group" aria-label="Mantenimiento">' + [['mantto', 'Indicadores'], ['fallas', 'Fallas'], ['plan', 'Plan de mantto']].map(function (x) {
      return '<button type="button" data-a="ir" data-h="#/' + x[0] + '" aria-pressed="' + (x[0] === act) + '">' + x[1] + '</button>';
    }).join('') + '</div>';
  }
  /** Formulario de falla o intervención del administrador (nueva o editar). */
  function formFallaAdmin(id) {
    var f = id ? N.fila('FALLAS', id) : {};
    var ini = f.FechaHoraInicio ? R.enLima(Date.parse(f.FechaHoraInicio)) : R.enLima(Date.now());
    var fin = f.FechaHoraFin ? R.enLima(Date.parse(f.FechaHoraFin)) : null;
    var eqs = equiposObra().slice().sort(function (a, b) { return String(a.CodigoInterno).localeCompare(String(b.CodigoInterno), 'es', { numeric: true }); });
    var sel = function (name, vals, v, vacio) { return '<select name="' + name + '">' + (vacio ? '<option value="">' + vacio + '</option>' : '') + vals.map(function (x) { var val = x[0] !== undefined ? x[0] : x, txt = x[1] !== undefined ? x[1] : x; return '<option value="' + esc(val) + '"' + (val === v ? ' selected' : '') + '>' + esc(txt) + '</option>'; }).join('') + '</select>'; };
    hoja(id ? 'Editar falla / intervención' : 'Registrar falla / intervención',
      (id ? '<p class="sub">' + esc(f.CodigoFalla) + '</p>' : campo('Equipo', sel('EquipoID', eqs.map(function (e) { return [e.EquipoID, e.CodigoInterno + ' · ' + e.Familia]; }), '', 'Elija…'), true)) +
      '<div class="dos">' + campo('Fecha', '<input name="Fecha" type="date" value="' + ini.fecha + '" max="' + hoy() + '">', true) +
      campo('Sistema', sel('SistemaID', (cat().SISTEMAS_FALLA || []).map(function (s) { return [s.SistemaID, s.Nombre]; }), f.SistemaID || '', 'Elija…'), true) + '</div>' +
      '<div class="dos">' + campo('Hora inicio', '<input name="HoraIni" type="time" value="' + ini.hora + '">', true) +
      campo('Hora fin', '<input name="HoraFin" type="time" value="' + (fin ? fin.hora : '') + '">') + '</div>' +
      '<div class="dos">' + campo('Mecánico', '<input name="Mecanico" value="' + esc(f.Mecanico || '') + '">') +
      campo('Tipo de intervención', sel('TipoIntervencion', TIPOS_INT.map(function (t) { return [t, t.charAt(0) + t.slice(1).toLowerCase().replace('inspeccion', 'inspección').replace('condicion', 'condición')]; }), f.TipoIntervencion || 'CORRECTIVO'), true) + '</div>' +
      '<div class="dos">' + campo('Falla funcional (equipo inoperativo)', sel('FallaFuncional', [['SI', 'Sí'], ['NO', 'No']], f.FallaFuncional || 'SI'), true) +
      campo('Estado', sel('Estado', [['ABIERTA', 'Abierta'], ['POR_CONFIRMAR', 'Por confirmar'], ['CERRADA', 'Cerrada']], f.Estado === 'EN_REPARACION' ? 'ABIERTA' : (f.Estado || 'ABIERTA')), true) + '</div>' +
      campo('Componente (opcional)', '<input name="Componente" value="' + esc(f.Componente || '') + '">') +
      campo('Causa y hallazgo', '<textarea name="CausaHallazgo">' + esc(f.CausaHallazgo || f.Descripcion || '') + '</textarea>', true) +
      campo('Repuesto pendiente', '<input name="RepuestoPendiente" value="' + esc(f.RepuestoPendiente || '') + '" placeholder="Ej.: filtro hidráulico (vacío si no hay)">') +
      campo('Fecha de cierre', '<input name="FechaCierre" type="date" value="' + esc(f.FechaCierre || '') + '" max="' + hoy() + '">'),
      function (v) {
        if (!id && !v.EquipoID) return 'Elija el equipo.';
        if (!v.Fecha || !v.HoraIni || !v.SistemaID) return 'Complete fecha, hora de inicio y sistema.';
        if (!String(v.CausaHallazgo || '').trim()) return 'Escriba la causa y el hallazgo.';
        var iniISO = v.Fecha + 'T' + v.HoraIni + ':00-05:00', finISO = '';
        if (v.HoraFin) {
          var fd = v.HoraFin <= v.HoraIni ? R.sumarDias(v.Fecha, 1) : v.Fecha;  // terminó pasada la medianoche
          finISO = fd + 'T' + v.HoraFin + ':00-05:00';
        }
        if (v.Estado === 'CERRADA' && !finISO) return 'Para cerrarla indique la hora de fin.';
        var fc = v.FechaCierre || (v.Estado === 'CERRADA' ? finISO.substring(0, 10) : '');
        var fila = { FallaID: id || N.nuevoID('FAL'), SistemaID: v.SistemaID, FechaHoraInicio: iniISO, FechaHoraFin: finISO, Estado: v.Estado,
          Mecanico: v.Mecanico, TipoIntervencion: v.TipoIntervencion, FallaFuncional: v.FallaFuncional, CausaHallazgo: v.CausaHallazgo,
          RepuestoPendiente: v.RepuestoPendiente, FechaCierre: fc, Componente: v.Componente || (id ? f.Componente : ''), Descripcion: id ? f.Descripcion : (v.CausaHallazgo || '') };
        if (!id) { fila.EquipoID = v.EquipoID; fila.ParteID = ''; fila.CodigoFalla = 'FA-' + equipo(v.EquipoID).CodigoInterno + '-' + v.Fecha.replace(/-/g, '') + '-' + v.HoraIni.replace(':', ''); }
        N.guardar('FALLAS', fila);
        toast(id ? 'Falla actualizada' : 'Falla registrada');
        setTimeout(render, 300);
      }, id ? 'Guardar' : 'Registrar');
  }

  /** Horas programadas de un día: 10 h por turno de lunes a sábado, 5 h el domingo. */
  function horasProgDia(fecha) { return new Date(fecha + 'T12:00:00Z').getUTCDay() === 0 ? 5 : 10; }
  var periodoMantto = '30';
  function rangoMantto() {
    var h = hoy(), d;
    if (periodoMantto === 'mes') return { desde: h.substring(0, 8) + '01', hasta: h, nombre: 'este mes' };
    if (periodoMantto === 'mesant') {
      var p = new Date(Date.UTC(+h.substring(0, 4), +h.substring(5, 7) - 2, 1));
      d = p.toISOString().substring(0, 10);
      var fin = new Date(Date.UTC(+h.substring(0, 4), +h.substring(5, 7) - 1, 0)).toISOString().substring(0, 10);
      return { desde: d, hasta: fin, nombre: 'mes anterior' };
    }
    var n = Number(periodoMantto);
    return { desde: R.sumarDias(h, -(n - 1)), hasta: h, nombre: 'últimos ' + n + ' días' };
  }
  /** Indicadores por equipo (solo línea amarilla y blanca con horómetro). */
  function indicadoresMantto(rg) {
    var dias = [];
    for (var d = rg.desde; d <= rg.hasta; d = R.sumarDias(d, 1)) dias.push(d);
    var ahoraMs = Date.now();
    var partes = N.filas('PARTES_DIARIOS', function (p) { return p.Estado !== 'ANULADO' && p.FechaTrabajo >= rg.desde && p.FechaTrabajo <= rg.hasta; });
    var fallas = N.filas('FALLAS');
    return equiposObra().filter(function (e) {
      var l = lineaDe(e);
      return e.TieneHorometro && (l === 'LINEA AMARILLA' || l === 'LINEA BLANCA');
    }).map(function (e) {
      var noches = {};
      partes.forEach(function (p) { if (p.EquipoID === e.EquipoID && p.Turno === 'NOCHE') noches[p.FechaTrabajo] = 1; });
      var hpDia = {}, hp = 0;
      dias.forEach(function (x) { hpDia[x] = horasProgDia(x) * (noches[x] ? 2 : 1); hp += hpDia[x]; });
      var paraDia = {}, nFallas = 0, porSistema = {};
      fallas.filter(function (f) { return f.EquipoID === e.EquipoID && f.FallaFuncional !== 'NO'; }).forEach(function (f) {
        var a = Date.parse(f.FechaHoraInicio), b = f.FechaHoraFin ? Date.parse(f.FechaHoraFin) : ahoraMs;
        if (isNaN(a) || b <= a) return;
        var iniF = R.enLima(a).fecha;
        if (iniF >= rg.desde && iniF <= rg.hasta && ['PREVENTIVO', 'INSPECCION'].indexOf(f.TipoIntervencion) < 0) nFallas++;
        dias.forEach(function (x) {
          var d0 = Date.parse(x + 'T00:00:00-05:00'), d1 = d0 + 86400000;
          var h = Math.max(0, Math.min(b, d1) - Math.max(a, d0)) / 3600000;
          if (h > 0) { paraDia[x] = (paraDia[x] || 0) + h; var s = busca('SISTEMAS_FALLA', 'SistemaID', f.SistemaID).Nombre || 'OTROS'; porSistema[s] = (porSistema[s] || 0) + h; }
        });
      });
      var hi = 0, hiDia = {};
      dias.forEach(function (x) { hiDia[x] = Math.min(paraDia[x] || 0, hpDia[x]); hi += hiDia[x]; });
      // si se recortó por el tope del día, el reparto por sistema se ajusta en proporción
      var totSis = Object.keys(porSistema).reduce(function (s, k) { return s + porSistema[k]; }, 0);
      if (totSis > 0) Object.keys(porSistema).forEach(function (k) { porSistema[k] = porSistema[k] * hi / totSis; });
      return { eq: e, linea: lineaDe(e), hp: hp, hi: hi, nFallas: nFallas, dm: hp ? (hp - hi) / hp : 1,
        mtbf: nFallas ? (hp - hi) / nFallas : null, mttr: nFallas ? hi / nFallas : null, hpDia: hpDia, hiDia: hiDia, porSistema: porSistema };
    });
  }
  /** Estado del plan de mantenimiento con la última lectura recibida del equipo. */
  function estadoMantto(e) {
    var m = busca('MANTENIMIENTOS', 'EquipoID', e.EquipoID);
    if (!m.EquipoID) return { m: null, estado: 'SIN PLAN' };
    var km = String(m.UM || '').toUpperCase() === 'KM';
    var actual = R.num(km ? e.UltimoOdometro : e.UltimoHorometro);
    var prox = R.num(m.LecturaProxima);
    if (actual === null || prox === null) return { m: m, actual: actual, prox: prox, estado: 'SIN LECTURA' };
    var intervalo = R.num(m.Intervalo) || (km ? 5000 : 250);
    var restante = prox - actual;
    var umbral = Math.max(intervalo * 0.15, km ? 300 : 25);
    return { m: m, actual: actual, prox: prox, restante: restante, um: km ? 'km' : 'h', estado: restante < 0 ? 'VENCIDO' : restante <= umbral ? 'POR VENCER' : 'OK' };
  }
  function barra(pct, color, txt) {
    return '<div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:12px;border-radius:6px;background:var(--sup-2);overflow:hidden">' +
      '<i style="display:block;height:100%;width:' + Math.max(0, Math.min(100, pct)).toFixed(1) + '%;background:' + color + '"></i></div><span class="mini num" style="min-width:52px;text-align:right">' + txt + '</span></div>';
  }
  function colorDM(x) { return x >= 0.9 ? 'var(--ok)' : x >= 0.8 ? 'var(--acento)' : 'var(--peligro)'; }
  function pct1(x) { return (Math.round(x * 1000) / 10).toFixed(1) + '%'; }

  function vMantto() {
    var rg = rangoMantto();
    var eqs = equiposObra();
    var porLinea = {};
    eqs.forEach(function (e) { var l = lineaDe(e); porLinea[l] = (porLinea[l] || 0) + 1; });
    var ind = indicadoresMantto(rg);
    var tot = ind.reduce(function (s, x) { s.hp += x.hp; s.hi += x.hi; s.n += x.nFallas; return s; }, { hp: 0, hi: 0, n: 0 });
    var dm = tot.hp ? (tot.hp - tot.hi) / tot.hp : 1;
    var porL = function (l) { var x = ind.filter(function (i) { return i.linea === l; }); var hp = x.reduce(function (s, i) { return s + i.hp; }, 0), hi = x.reduce(function (s, i) { return s + i.hi; }, 0); return hp ? (hp - hi) / hp : 1; };
    var est = eqs.map(function (e) { return estadoMantto(e); });
    var cuenta = function (s) { return est.filter(function (x) { return x.estado === s; }).length; };
    var venc = cuenta('VENCIDO'), porV = cuenta('POR VENCER'), okM = cuenta('OK'), sinM = eqs.length - venc - porV - okM;
    var totM = Math.max(1, eqs.length);
    var dona = 'conic-gradient(var(--peligro) 0 ' + (venc / totM * 360) + 'deg, var(--acento) 0 ' + ((venc + porV) / totM * 360) + 'deg, var(--ok) 0 ' + ((venc + porV + okM) / totM * 360) + 'deg, var(--sup-2) 0 360deg)';
    // sistemas con más horas inoperativas
    var sis = {};
    ind.forEach(function (i) { Object.keys(i.porSistema).forEach(function (k) { sis[k] = (sis[k] || 0) + i.porSistema[k]; }); });
    var sisL = Object.keys(sis).map(function (k) { return [k, sis[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
    var maxSis = sisL.length ? sisL[0][1] : 1;
    // tendencia diaria de disponibilidad
    var dias = [];
    for (var d = rg.desde; d <= rg.hasta; d = R.sumarDias(d, 1)) dias.push(d);
    var tend = dias.map(function (x) {
      var hp = 0, hi = 0;
      ind.forEach(function (i) { hp += i.hpDia[x] || 0; hi += i.hiDia[x] || 0; });
      return { d: x, dm: hp ? (hp - hi) / hp : 1 };
    });
    var kpi = function (v, l, cls) { return '<div class="kpi"><div class="v num ' + (cls || '') + '">' + v + '</div><div class="l">' + l + '</div></div>'; };
    var h = pestanasMantto('mantto') +
      '<div class="segmento" role="group" aria-label="Periodo">' + [['7', '7 días'], ['30', '30 días'], ['mes', 'Este mes'], ['mesant', 'Mes anterior']].map(function (x) {
        return '<button type="button" data-a="periodoMantto" data-v="' + x[0] + '" aria-pressed="' + (x[0] === periodoMantto) + '">' + x[1] + '</button>';
      }).join('') + '</div>' +
      '<div class="etiqueta-seccion">Equipos en obra</div><div class="kpis">' +
      kpi(eqs.length, 'Equipos en obra', 'acento') +
      kpi((porLinea['LINEA AMARILLA'] || 0) + (porLinea['LINEA BLANCA'] || 0), 'De producción (amarilla + blanca)') +
      kpi(porLinea['LINEA AMARILLA'] || 0, 'Línea amarilla') + kpi(porLinea['LINEA BLANCA'] || 0, 'Línea blanca') +
      kpi(porLinea['TRANSPORTE DE PERSONAL'] || 0, 'Transporte de personal') + kpi(porLinea.OTROS || 0, 'Otros (torres, grupos)') + '</div>' +
      '<div class="etiqueta-seccion">Indicadores · ' + esc(rg.nombre) + ' (' + fF(rg.desde).substring(0, 5) + ' a ' + fF(rg.hasta).substring(0, 5) + ')</div><div class="kpis">' +
      kpi(pct1(dm), 'Disponibilidad mecánica', dm >= 0.9 ? '' : 'acento') +
      kpi(tot.n ? n1((tot.hp - tot.hi) / tot.n) + ' h' : '—', 'MTBF (entre fallas)') +
      kpi(tot.n ? n1(tot.hi / tot.n) + ' h' : '—', 'MTTR (reparación)') +
      kpi(n1(tot.hi) + ' h', 'Horas inoperativas') + kpi(n1(tot.hp) + ' h', 'Horas programadas') + kpi(tot.n, 'Fallas correctivas') + '</div>' +
      '<div class="tarjeta" style="display:grid;gap:10px"><h3>Disponibilidad por línea</h3>' +
      '<div class="mini">Línea amarilla</div>' + barra(porL('LINEA AMARILLA') * 100, colorDM(porL('LINEA AMARILLA')), pct1(porL('LINEA AMARILLA'))) +
      '<div class="mini">Línea blanca</div>' + barra(porL('LINEA BLANCA') * 100, colorDM(porL('LINEA BLANCA')), pct1(porL('LINEA BLANCA'))) + '</div>' +
      '<div class="tarjeta"><h3>Disponibilidad día a día</h3><div style="display:flex;align-items:flex-end;gap:2px;height:120px;margin-top:10px">' + tend.map(function (t) {
        return '<div title="' + fF(t.d) + ': ' + pct1(t.dm) + '" style="flex:1;min-width:2px;height:' + Math.max(4, t.dm * 100) + '%;background:' + colorDM(t.dm) + ';border-radius:3px 3px 0 0"></div>';
      }).join('') + '</div><div class="entre mini"><span>' + fF(rg.desde).substring(0, 5) + '</span><span>' + fF(rg.hasta).substring(0, 5) + '</span></div></div>' +
      '<div class="tarjeta" style="display:grid;gap:8px"><h3>Horas inoperativas por sistema</h3>' + (sisL.length ? sisL.map(function (s) {
        return '<div class="mini">' + esc(s[0]) + '</div>' + barra(s[1] / maxSis * 100, 'var(--peligro)', n1(s[1]) + ' h');
      }).join('') : '<p class="mini">Sin horas inoperativas en el periodo.</p>') + '</div>' +
      '<div class="tarjeta" style="display:grid;gap:10px"><h3>Mantenimientos preventivos</h3><div style="display:flex;gap:16px;align-items:center">' +
      '<div style="width:110px;height:110px;border-radius:50%;background:' + dona + ';display:grid;place-items:center;flex:none"><div style="width:70px;height:70px;border-radius:50%;background:var(--sup-1);display:grid;place-items:center" class="num"><strong>' + eqs.length + '</strong></div></div>' +
      '<div style="display:grid;gap:6px" class="mini"><div><span style="color:var(--peligro)">●</span> Vencidos: <strong>' + venc + '</strong></div><div><span style="color:var(--acento)">●</span> Por vencer: <strong>' + porV + '</strong></div>' +
      '<div><span style="color:var(--ok)">●</span> Al día: <strong>' + okM + '</strong></div><div><span style="color:var(--texto-3)">●</span> Sin plan o sin lectura: <strong>' + sinM + '</strong></div></div></div>' +
      '<a class="btn chico" href="#/plan">' + ic('right') + 'Ver plan de mantenimiento</a></div>' +
      '<div class="tarjeta" style="display:grid;gap:8px"><h3>Disponibilidad por equipo</h3>' + ind.slice().sort(function (a, b) { return a.dm - b.dm; }).map(function (i) {
        return '<div class="entre mini"><span><strong>' + esc(i.eq.CodigoInterno) + '</strong> · ' + i.nFallas + ' falla(s) · ' + n1(i.hi) + ' h inop. · MTBF ' + (i.mtbf === null ? '—' : n1(i.mtbf) + ' h') + ' · MTTR ' + (i.mttr === null ? '—' : n1(i.mttr) + ' h') + '</span></span></div>' +
          barra(i.dm * 100, colorDM(i.dm), pct1(i.dm));
      }).join('') + '</div>' +
      '<p class="mini">Cálculo: 10 h programadas por turno de lunes a sábado y 5 h el domingo (el turno noche cuenta solo los días que el equipo reportó parte de noche). ' +
      'Solo línea amarilla y blanca con horómetro; no se incluyen los equipos que solo tienen kilometraje. Horas inoperativas = fallas con "falla funcional = Sí" (sin pasar de las horas programadas del día). ' +
      'MTBF y MTTR usan las fallas correctivas y diferidas (no preventivos ni inspecciones).</p>';
    marco('Mantenimiento', h);
  }

  var filtroPlan = 'TODOS';
  function vPlan() {
    var filas = equiposObra().map(function (e) { return Object.assign({ eq: e }, estadoMantto(e)); });
    var orden = { 'VENCIDO': 0, 'POR VENCER': 1, 'SIN LECTURA': 2, 'OK': 3, 'SIN PLAN': 4 };
    var l = filas.filter(function (x) { return filtroPlan === 'TODOS' || x.estado === filtroPlan; })
      .sort(function (a, b) { return orden[a.estado] - orden[b.estado] || (a.restante || 0) - (b.restante || 0); });
    var chipM = function (s) { return '<span class="estado ' + (s === 'VENCIDO' ? 'peligro' : s === 'POR VENCER' ? 'alerta' : s === 'OK' ? 'ok' : '') + '">' + esc(s) + '</span>'; };
    marco('Plan de mantenimiento', pestanasMantto('plan') +
      '<div class="segmento" role="group" aria-label="Estado">' + ['TODOS', 'VENCIDO', 'POR VENCER', 'OK', 'SIN LECTURA', 'SIN PLAN'].map(function (s) {
        var n = s === 'TODOS' ? filas.length : filas.filter(function (x) { return x.estado === s; }).length;
        return '<button type="button" data-a="filtroPlan" data-v="' + s + '" aria-pressed="' + (s === filtroPlan) + '">' + (s === 'TODOS' ? 'Todos' : s.charAt(0) + s.slice(1).toLowerCase()) + ' (' + n + ')</button>';
      }).join('') + '</div>' +
      '<div class="lista">' + l.map(function (x) {
        var m = x.m || {};
        return '<div class="tarjeta"><div class="entre"><div><h3>' + esc(x.eq.CodigoInterno) + '</h3><div class="mini">' + esc(lineaDe(x.eq)) + ' · ' + esc(x.eq.Familia) + '</div>' +
          (x.m ? '<div class="mini num">Último: ' + esc(m.ServicioUltimo || '—') + (m.FechaUltimo ? ' el ' + fF(m.FechaUltimo) : '') + (m.LecturaUltimo !== '' ? ' a ' + n1(m.LecturaUltimo) : '') + '</div>' +
            '<div class="mini num">Próximo: ' + esc(m.ServicioProximo || '—') + ' a ' + n1(x.prox) + ' ' + (x.um || '') + ' · actual ' + (x.actual === null || x.actual === undefined ? '—' : n1(x.actual)) +
            (x.restante !== undefined ? ' · faltan <strong>' + n1(x.restante) + ' ' + x.um + '</strong>' : '') + '</div>' : '<div class="mini">Sin datos en el plan de mantenimiento.</div>') +
          '</div>' + chipM(x.estado) + '</div></div>';
      }).join('') + '</div>' +
      '<p class="mini">"Por vencer" = le falta el 15 % del intervalo o menos (mínimo 25 h o 300 km). La lectura actual es la última que llegó en los partes diarios.</p>');
  }

  function formCerrarFalla(id) {
    var f = N.fila('FALLAS', id);
    var ahora = R.enLima(Date.now());
    hoja('Reparación de la falla',
      campo('Estado', '<select name="Estado"><option value="EN_REPARACION">En reparación</option><option value="CERRADA">Cerrada</option></select>', true) +
      campo('Término (si se cerró)', '<input name="Fin" type="datetime-local" value="' + ahora.fecha + 'T' + ahora.hora + '">') +
      campo('Acción realizada', '<textarea name="AccionRealizada">' + esc(f.AccionRealizada) + '</textarea>', true) +
      campo('Responsable', '<input name="Responsable" value="' + esc(f.Responsable) + '">'),
      function (v) {
        if (!v.AccionRealizada) return 'Describa la acción realizada.';
        var fin = v.Estado === 'CERRADA' ? v.Fin + ':00-05:00' : '';
        if (fin && Date.parse(fin) <= Date.parse(f.FechaHoraInicio)) return 'El término debe ser posterior al inicio.';
        N.guardar('FALLAS', { FallaID: id, Estado: v.Estado, FechaHoraFin: fin, AccionRealizada: v.AccionRealizada, Responsable: v.Responsable });
        toast('Falla actualizada');
      });
  }

  // ------------------------------------------------------------ cuenta
  function vCuenta() {
    var s = S();
    var pend = s.outbox;
    marco('Cuenta', '<div class="tarjeta"><h2>' + esc(perfil().Nombre) + '</h2><div class="sub">' + esc(perfil().Email) + '</div><div style="margin-top:8px"><span class="estado acento">' + esc(perfil().Rol) + '</span></div></div>' +
      '<div class="kpis"><div class="kpi"><div class="v num ' + (pend.length ? 'acento' : '') + '">' + pend.length + '</div><div class="l">Cambios por enviar</div></div>' +
      '<div class="kpi"><div class="v num">' + (s.ultimaSync ? fFH(Reglas.isoLima(s.ultimaSync)).substring(6) : '—') + '</div><div class="l">Última sincronización</div></div></div>' +
      (s.errorSync ? '<div class="aviso">' + ic('cloudoff') + '<div>Último intento: ' + esc(s.errorSync) + '</div></div>' : '') +
      '<button class="btn primario ancho" data-a="sync">' + ic('refresh') + 'Sincronizar ahora</button>' +
      (pend.length ? '<div class="etiqueta-seccion">Pendientes de sincronización</div><div class="tarjeta lista">' + pend.slice(0, 30).map(function (it) {
        return '<div class="entre mini"><span>' + esc(it.op === 'accion' ? 'Acción ' + it.fila.Accion : it.op === 'foto' ? 'Foto ' + it.fila.TipoEvidencia.toLowerCase().replace(/_/g, ' ') : (it.op === 'eliminar' ? 'Eliminar ' : '') + (it.tabla || '').toLowerCase().replace('_', ' ')) + '</span><span>' + ic('cloudoff') + '</span></div>';
      }).join('') + '</div>' : '') +
      (s.rechazados.length ? '<div class="etiqueta-seccion">Rechazados por el servidor</div><div class="lista">' + s.rechazados.map(function (r, i) {
        return '<div class="aviso peligro">' + ic('alert') + '<div class="crece"><strong>' + esc(r.item.op === 'accion' ? r.item.fila.Accion : (r.item.tabla || 'Foto')) + '</strong><div>' + esc(r.error) + '</div>' +
          (r.item.parte ? '<a href="#/parte/' + r.item.parte + '">Ver parte</a> · ' : '') + '<button class="btn chico fantasma" data-a="descartar" data-i="' + i + '">Entendido</button></div></div>';
      }).join('') + '</div>' : '') +
      '<button class="btn peligro ancho" data-a="salir">' + ic('logout') + 'Cerrar sesión</button>' +
      '<p class="mini">AXION · app gratuita. Sus datos viajan cifrados (HTTPS) y se guardan en la cuenta de Google de la empresa.</p>');
  }

  // ------------------------------------------------------------ eventos
  function resumenAplicado(ap) {
    return 'Registrado: ' + ap.actividades.length + ' actividad(es), ' + ap.viajes.length + ' viaje(s)' +
      (ap.abastecimiento ? ', ' + n1(ap.abastecimiento.Galones) + ' gal de combustible' : ap.sinAbastecimiento ? ', sin abastecimiento' : '') +
      (ap.omitidos.length ? ' · ' + ap.omitidos.length + ' omitido(s): revíselos' : '');
  }
  /** Lo que registraría la IA sin que nadie marque nada (modo automático): solo lo legible y coherente. */
  function marcasAuto(p, r) {
    var ok = function (c) { return c === 'ALTA' || c === 'MEDIA'; };
    var abs = N.hijos('ABASTECIMIENTOS', p.ParteID);
    return function (n) {
      var m = n.match(/^(lec|act|via)_(.+)$/);
      if (m && m[1] === 'lec') return R.valorIA(r[m[2].replace(/([a-z])([A-Z])/, '$1_$2').toLowerCase()]) !== null && R.num(p[m[2]]) === null;
      if (m && m[1] === 'act') { var a = (r.actividades || [])[Number(m[2])]; return !!(a && a.texto); }
      if (m && m[1] === 'via') { var v = (r.viajes || [])[Number(m[2])]; return !!(v && (v.texto || viajeIA(v).fila)); }
      if (n === 'obs') return !!(r.observaciones && r.observaciones.texto) && !p.ObservacionOperador;
      if (n === 'comb') { var x = abastIA(p, r); return !!(x && x.fila) && !abs.length && ok(r.combustible.confianza); }
      if (n === 'sinab') return (!r.combustible || (!r.combustible.texto && R.num(r.combustible.galones) === null)) && !abs.length && p.SinAbastecimiento !== true;
      return false;
    };
  }
  /** Borra una foto (y deshace lo que la IA registró con ella, para que la foto nueva no lo duplique). */
  function quitarFoto(evId) {
    N.filas('LECTURAS_IA', function (l) { return l.EvidenciaID === evId; }).forEach(deshacerIA);
    N.eliminar('EVIDENCIAS', evId);
  }
  /** Deshace lo que registró una lectura de la IA (al cambiar o borrar la foto del parte), para no duplicar. */
  function deshacerIA(l) {
    if (!l || l.Estado !== 'CONFIRMADA' || !l.Aplicado) return;
    var ap; try { ap = JSON.parse(l.Aplicado); } catch (e) { return; }
    (ap.actividades || []).forEach(function (a) { if (N.fila('ACTIVIDADES', a.ActividadID)) N.eliminar('ACTIVIDADES', a.ActividadID); });
    (ap.viajes || []).forEach(function (v) { if (N.fila('VIAJES', v.ViajeID)) N.eliminar('VIAJES', v.ViajeID); });
    if (ap.abastecimiento && N.fila('ABASTECIMIENTOS', ap.abastecimiento.AbastecimientoID)) N.eliminar('ABASTECIMIENTOS', ap.abastecimiento.AbastecimientoID);
    var p = Object.assign({}, getParte(l.ParteID)), cambio = false;
    Object.keys(ap.lecturas || {}).forEach(function (k) {
      if (Number(p[k]) === Number(ap.lecturas[k].ahora)) { p[k] = ap.lecturas[k].antes === undefined ? '' : ap.lecturas[k].antes; cambio = true; }
    });
    if (ap.sinAbastecimiento && p.SinAbastecimiento === true) { p.SinAbastecimiento = false; cambio = true; }
    if (cambio) guardarParte(p);
  }
  /** Modo automático: cada lectura nueva del parte de papel se registra sola en sus borradores. */
  var autoHecho = {};
  function autoAplicarIA() {
    if (cfg().IA_AUTOAPLICAR === 'NO' || !perfil() || !perfil().OperadorID) return;
    N.filas('LECTURAS_IA', function (l) { return l.TipoEvidencia === 'PARTE_FISICO_FIRMADO' && l.Estado === 'PROCESADA' && !autoHecho[l.LecturaID]; }).forEach(function (l) {
      var p = getParte(l.ParteID);
      if (!p || !editable(p) || ultimaLecturaParte(p.ParteID) !== l) return;
      autoHecho[l.LecturaID] = true;
      var ap = aplicarIA(l.ParteID, l.LecturaID, marcasAuto(Object.assign({}, p), R.resultadoIA(l) || {}), true);
      if (ap && new RegExp(l.ParteID).test(location.hash)) toast('La IA llenó el parte. ' + resumenAplicado(ap));
    });
  }

  /** Registra lo que leyó la IA según las marcas (pantalla de revisión) o solo (modo automático). Devuelve lo aplicado. */
  function aplicarIA(id, lecturaID, marca, auto) {
      var l = N.fila('LECTURAS_IA', lecturaID);
      var r = R.resultadoIA(l);
      var p = Object.assign({}, getParte(id));
      if (!r || !editable(p)) return null;
      var ap = { lecturas: {}, actividades: [], viajes: [], observaciones: false, omitidos: [], auto: !!auto };
      if (auto && corregirDesdePapel(p, r)) { ap.fechaTurno = p.FechaTrabajo + ' ' + p.Turno; p._porIA = true; }
      ['HorometroInicial', 'HorometroFinal', 'OdometroInicial', 'OdometroFinal'].forEach(function (k) {
        var c = r[k.replace(/([a-z])([A-Z])/, '$1_$2').toLowerCase()];
        if (marca('lec_' + k) && R.valorIA(c) !== null) { ap.lecturas[k] = { antes: p[k], ahora: Number(R.valorIA(c)) }; p[k] = Number(R.valorIA(c)); }
      });
      if (R.num(p.HorometroInicial) !== null && R.num(p.HorometroFinal) !== null) p.HorasTrabajadas = Math.round((p.HorometroFinal - p.HorometroInicial) * 100) / 100;
      if (R.num(p.OdometroInicial) !== null && R.num(p.OdometroFinal) !== null) p.KmRecorridos = Math.round((p.OdometroFinal - p.OdometroInicial) * 100) / 100;
      if (marca('obs') && r.observaciones && r.observaciones.texto) {
        p.ObservacionOperador = (p.ObservacionOperador ? p.ObservacionOperador + '\n' : '') + 'Parte de papel: ' + r.observaciones.texto;
        ap.observaciones = true;
      }
      var xab = abastIA(p, r);
      if (marca('comb') && xab && xab.fila) {
        var ab = Object.assign({ AbastecimientoID: N.nuevoID('ABA') }, xab.fila);
        ap.abastecimiento = { AbastecimientoID: ab.AbastecimientoID, Galones: ab.Galones };
        if (p.SinAbastecimiento === true) p.SinAbastecimiento = false;
      }
      if (marca('sinab')) { p.SinAbastecimiento = true; ap.sinAbastecimiento = true; }
      if (Object.keys(ap.lecturas).length || ap.observaciones || ap.abastecimiento || ap.sinAbastecimiento || ap.fechaTurno) guardarParte(p);
      if (ap.abastecimiento) N.guardar('ABASTECIMIENTOS', ab);
      var t = turno(p.Turno);
      var acts = N.hijos('ACTIVIDADES', id);
      (r.actividades || []).forEach(function (a, i) {
        if (!marca('act_' + i)) return;
        var x = actividadIA(a, p);
        var fila = Object.assign({ ActividadID: N.nuevoID('ACT'), ParteID: id }, x.fila);
        N.guardar('ACTIVIDADES', fila);
        acts.push(fila);
        ap.actividades.push({ indice: i, ActividadID: fila.ActividadID });
      });
      var nro = N.hijos('VIAJES', id).reduce(function (m, v) { return Math.max(m, Number(v.NumeroViaje) || 0); }, 0);
      (r.viajes || []).forEach(function (v, i) {
        if (!marca('via_' + i)) return;
        var x = viajeIA(v);
        // viaje incompleto en el papel: no se pierde, queda como actividad con su texto
        if (!x.fila || R.relFin(x.fila.HoraLlegada, t.HoraInicio) <= R.relInicio(x.fila.HoraSalida, t.HoraInicio)) {
          var fv = Object.assign({ ActividadID: N.nuevoID('ACT'), ParteID: id }, actividadIA({ texto: v.texto || ((v.origen || '') + ' → ' + (v.destino || '')), hora_inicio: v.hora_salida, hora_fin: v.hora_llegada, cantidad: v.cantidad, unidad: v.unidad, confianza: v.confianza }, p).fila);
          N.guardar('ACTIVIDADES', fv);
          ap.actividades.push({ viaje: i, ActividadID: fv.ActividadID });
          return;
        }
        var fila = Object.assign({ ViajeID: N.nuevoID('VIA'), ParteID: id, NumeroViaje: ++nro }, x.fila);
        N.guardar('VIAJES', fila);
        ap.viajes.push({ indice: i, ViajeID: fila.ViajeID });
      });
      N.guardar('LECTURAS_IA', { LecturaID: l.LecturaID, ParteID: id, Estado: 'CONFIRMADA', Aplicado: JSON.stringify(ap) });
      return ap;
  }

  var ACC = {
    volver: function (b) { location.hash = b.dataset.h; },
    ir: function (b) {
      var m = location.hash.match(/#\/parte\/([^/]+)\/paso\/(\d+)/);
      if (m) { var err = guardarPaso(m[1], Number(m[2])); if (err) { toast(err); return; } }
      var r = location.hash.match(/#\/parte\/([^/]+)\/rapido\/(\d)/);
      if (r) { var e2 = guardarRapido(r[1], Number(r[2])); if (e2) { toast(e2); return; } }
      location.hash = b.dataset.h;
    },
    sync: function () { if (!navigator.onLine) { toast('Sin señal: se enviará al reconectar.'); return; } toast('Actualizando todo desde el servidor…'); N.sincronizar(true).then(render); },
    turno: function (b) {
      document.querySelectorAll('[data-a="turno"]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      document.querySelector('[name="Turno"]').value = b.dataset.v;
      // en el modo rápido el equipo está en la misma pantalla: se muestran los equipos del turno elegido
      var m = location.hash.match(/#\/parte\/([^/]+)\/rapido\/1/);
      if (m) { eleccion[m[1]] = Object.assign({}, eleccion[m[1]], { Turno: b.dataset.v, AsignacionID: '' }); respaldarEscrito(); render(); }
    },
    rapSig: function (b) {
      var err = guardarRapido(b.dataset.id, Number(b.dataset.p));
      if (err) { toast(err); return; }
      olvidarEscrito();
      location.hash = Number(b.dataset.p) === 1 && modo() === 'uno' ? '#/parte/' + b.dataset.id + '/uno' : '#/parte/' + b.dataset.id + '/rapido/' + (Number(b.dataset.p) + 1);
    },
    rapAnt: function (b) { guardarRapido(b.dataset.id, Number(b.dataset.p)); location.hash = '#/parte/' + b.dataset.id + '/rapido/' + (Number(b.dataset.p) - 1); },
    detallado: function (b) {
      var m = location.hash.match(/#\/parte\/([^/]+)\/rapido\/(\d)/);
      if (m) { var err = guardarRapido(m[1], Number(m[2])); if (err) { toast(err); return; } }
      modo('detallado');
      location.hash = b.getAttribute('href');
    },
    rapidoModo: function (b) {
      var m = location.hash.match(/#\/parte\/([^/]+)\/paso\/(\d)/);
      if (m) { var err = guardarPaso(m[1], Number(m[2])); if (err) { toast(err); return; } }
      modo('rapido');
      location.hash = b.getAttribute('href');
    },
    pasoSig: function (b) {
      var err = guardarPaso(b.dataset.id, Number(b.dataset.p));
      if (err) { toast(err); return; }
      olvidarEscrito();
      location.hash = '#/parte/' + b.dataset.id + '/paso/' + (Number(b.dataset.p) + 1);
    },
    pasoAnt: function (b) { guardarPaso(b.dataset.id, Number(b.dataset.p)); location.hash = '#/parte/' + b.dataset.id + '/paso/' + (Number(b.dataset.p) - 1); },
    enviar: function (b) {
      // el comentario se guarda solo si está en pantalla (en la pantalla única no hay campo y no se debe borrar)
      var err = document.querySelector('#fPaso [name="ObservacionOperador"]') ? guardarPaso(b.dataset.id, 8) : null;
      if (err) { toast(err); return; }
      var p = getParte(b.dataset.id);
      var acc = p.Estado === 'OBSERVADO' ? 'CORREGIR' : 'ENVIAR';
      confirmar(acc === 'ENVIAR' ? 'Enviar parte' : 'Enviar corrección', 'Después de enviar ya no podrá modificarlo, salvo que el supervisor lo observe.', 'Enviar').then(function (si) {
        if (!si) return;
        N.accion(p, acc, '');
        toast(navigator.onLine ? 'Enviando…' : 'Guardado. Se enviará cuando haya señal.');
        location.hash = '#/parte/' + p.ParteID;
      });
    },
    actForm: function (b) { formActividad(b.dataset.id, b.dataset.k); },
    viajeForm: function (b) { formViaje(b.dataset.id); },
    abastForm: function (b) { formAbast(b.dataset.id); },
    fallaForm: function (b) { formFalla(b.dataset.id); },
    vincForm: function (b) { formVinculo(b.dataset.id); },
    borrar: function (b) {
      confirmar('Eliminar', '¿Eliminar este registro del parte?', 'Eliminar', true).then(function (si) { if (si) { N.eliminar(b.dataset.t, b.dataset.k); render(); } });
    },
    iaRepetir: function (b) {
      if (!navigator.onLine) { toast('Sin señal: la IA leerá la foto cuando haya conexión.'); return; }
      N.leerIA(b.dataset.ev, true);
      toast('La IA está leyendo la foto…');
    },
    iaUsar: function (b) {
      var el = document.querySelector('#fPaso [name="' + b.dataset.campo + '"]');
      if (!el) return;
      el.value = b.dataset.v;
      var m = location.hash.match(/#\/parte\/([^/]+)\//);
      if (m) vivo(getParte(m[1]), 3);
      respaldarEscrito();
      toast('Valor copiado. Revíselo y pulse "Guardar y seguir".');
    },
    iaGalones: function (b) {
      var ab = N.fila('ABASTECIMIENTOS', b.dataset.k);
      if (!ab) return;
      confirmar('Usar galones leídos', 'Se cambiará la cantidad de ' + n1(ab.Galones) + ' a ' + n1(b.dataset.v) + ' galones.', 'Cambiar').then(function (si) {
        if (!si) return;
        N.guardar('ABASTECIMIENTOS', { AbastecimientoID: ab.AbastecimientoID, ParteID: ab.ParteID, Galones: Number(b.dataset.v) });
        render();
      });
    },
    sinAbast: function (b) {
      var p = getParte(b.dataset.id);
      guardarParte(Object.assign({}, p, { SinAbastecimiento: p.SinAbastecimiento !== true }));
      render();
    },
    iaFalla: function (b) {
      var r = R.resultadoIA(N.fila('LECTURAS_IA', b.dataset.l)) || {};
      formFalla(b.dataset.id);
      var d = dlg.querySelector('[name="Descripcion"]');
      if (d && r.fallas) d.value = r.fallas.texto || '';
    },
    iaAplicar: function (b) {
      var marca = function (n) { var el = document.querySelector('#fIA [name="' + n + '"]'); return !!(el && el.checked); };
      var ap = aplicarIA(b.dataset.id, b.dataset.l, marca);
      if (!ap) return;
      iaSel = {};
      toast(resumenAplicado(ap));
      var id = b.dataset.id;
      location.hash = modo() === 'uno' ? '#/parte/' + id + '/uno' : modo() === 'detallado' ? '#/parte/' + id + '/paso/' + (Object.keys(ap.lecturas).length ? 3 : 4) : '#/parte/' + id + '/rapido/' + (Object.keys(ap.lecturas).length ? 2 : 3);
    },
    borrarParte: function (b) {
      var p = getParte(b.dataset.id);
      if (!borrable(p)) { toast('Este parte ya no se puede eliminar.'); return; }
      confirmar('Eliminar borrador', 'Se borrará el parte ' + (p.CodigoParte || '') + ' con todo lo registrado en él (actividades, viajes, fotos). ' +
        'Luego podrá iniciar el parte con el equipo correcto. No se puede deshacer.', 'Eliminar', true).then(function (si) {
        if (!si) return;
        olvidarEscrito();
        N.eliminarParte(p.ParteID);
        toast('Borrador eliminado');
        if (location.hash === '#/inicio') render(); else location.hash = '#/inicio';
      });
    },
    borrarFoto: function (b) {
      confirmar('Borrar foto', 'Se borrará esta foto' + (N.lecturaDe(b.dataset.k) ? ' y lo que la IA registró con ella' : '') + '.', 'Borrar', true).then(function (si) {
        if (!si) return;
        quitarFoto(b.dataset.k);
        toast('Foto borrada');
        render();
      });
    },
    foto: function (b) {
      fotoMeta = { ParteID: b.dataset.id, TipoEvidencia: b.dataset.tipo, FallaID: b.dataset.falla || '', AbastecimientoID: b.dataset.abast || '' };
      // "Cambiar": la foto anterior de ese tipo se borra recién cuando llega la nueva (si cancela la cámara, no se pierde nada)
      if (b.dataset.reemplazar) fotoMeta.reemplazar = N.hijos('EVIDENCIAS', b.dataset.id).filter(function (e) {
        return e.TipoEvidencia === b.dataset.tipo && (!b.dataset.abast || e.AbastecimientoID === b.dataset.abast);
      }).map(function (e) { return e.EvidenciaID; });
      // si el sistema cierra la app al abrir la cámara (pasa en Android con poca memoria), al volver se avisa
      try { sessionStorage.setItem('axion_foto_pend', JSON.stringify({ meta: fotoMeta, hash: location.hash, t: Date.now() })); } catch (x) { /* nada */ }
      var inp = document.getElementById(b.dataset.modo === 'galeria' ? 'galeria' : 'camara');
      inp.value = '';
      inp.click();
    },
    verFoto: function (b) {
      var id = b.dataset.k;
      N.leerFoto(id).then(function (d) {
        if (d) return d;
        if (!navigator.onLine) throw new Error('Sin señal: la foto se verá al reconectar.');
        return N.api('verFoto', { EvidenciaID: id }).then(function (r) {
          if (r.demo) throw new Error('Foto de demostración: no hay archivo.');
          var url = 'data:' + r.mime + ';base64,' + r.base64;
          N.guardarFoto(id, url);
          return url;
        });
      }).then(function (url) {
        dlg.innerHTML = '<div class="hoja visor"><div class="entre"><h2>Foto</h2><button class="volver" id="cv" aria-label="Cerrar">' + ic('x') + '</button></div><img src="' + url + '" alt="Foto de evidencia"></div>';
        dlg.showModal();
        document.getElementById('cv').onclick = function () { dlg.close(); };
      }, function (e) { toast(e.message); });
    },
    flujo: function (b) { flujo(b.dataset.id, b.dataset.acc); },
    filtro: function (b) { filtroRevisar = b.dataset.v; render(); },
    dia: function (b) { diaCumpl = b.dataset.v; render(); },
    iniTurno: function (b) { selInicio({ turno: b.dataset.v }); render(); },
    fallaAdmin: function (b) { formFallaAdmin(b.dataset.k || ''); },
    periodoMantto: function (b) { periodoMantto = b.dataset.v; render(); },
    filtroPlan: function (b) { filtroPlan = b.dataset.v; render(); },
    ojo: function (b) {
      var inp = b.parentNode.querySelector('input');
      var ver = inp.type === 'password';
      inp.type = ver ? 'text' : 'password';
      b.innerHTML = ic(ver ? 'ojono' : 'ojo');
      b.setAttribute('aria-label', ver ? 'Ocultar contraseña' : 'Mostrar contraseña');
      inp.focus();
    },
    unoTurno: function (b) { var err = cambiarFechaTurno(b.dataset.id, null, b.dataset.v); if (err) toast(err); else { toast('Turno cambiado'); render(); } },
    avisar: function (b) { avisadosCumpl(diaCumpl, b.dataset.k); setTimeout(render, 600); return true; },
    cerrarFalla: function (b) { formCerrarFalla(b.dataset.k); },
    descartar: function (b) { S().rechazados.splice(Number(b.dataset.i), 1); render(); },
    salir: function () {
      var n = S().outbox.length;
      confirmar('Cerrar sesión', n ? 'ATENCIÓN: hay ' + n + ' cambios sin enviar y se PERDERÁN. Sincronice primero si puede.' : 'Se borrarán los datos de este celular.', 'Cerrar sesión', true)
        .then(function (si) { if (si) N.salir().then(function () { location.hash = '#/login'; render(); }); });
    }
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]');
    if (!b || b.disabled) return;
    if (b.dataset.a !== 'avisar') e.preventDefault();  // el aviso es un enlace real a WhatsApp: se deja abrir
    ACC[b.dataset.a](b, e);
  });
  document.addEventListener('change', function (e) {
    if (e.target.name === 'AsignacionID') {
      var m = location.hash.match(/#\/parte\/([^/]+)\/(?:paso\/2|rapido\/1)/);
      if (m && eleccion[m[1]]) delete eleccion[m[1]].AsignacionID;
      if (m) { var p = getParte(m[1]); var a = busca('ASIGNACIONES', 'AsignacionID', e.target.value); tmp[p.ParteID] = Object.assign({}, p, { AsignacionID: a.AsignacionID, FrenteID: a.FrenteID }); if (!p.Estado) render(); else document.querySelectorAll('.opcion').forEach(function (o) { o.setAttribute('aria-checked', o.contains(e.target)); }); }
    }
  });
  function alElegirFoto(e) {
    var file = e.target.files && e.target.files[0];
    try { sessionStorage.removeItem('axion_foto_pend'); } catch (x) { /* nada */ }
    if (!file || !fotoMeta) return;
    var meta = fotoMeta;
    var p = getParte(meta.ParteID);
    if (!p) { toast('El parte ya no está en este celular. Vuelva a abrirlo y tome la foto otra vez.'); return; }
    var sello = 'AXION · ' + (p.CodigoParte || '') + ' · ' + fF(R.enLima(Date.now()).fecha) + ' ' + R.enLima(Date.now()).hora;
    toast('Procesando foto…');
    var reemplazar = meta.reemplazar || [];
    var metaFoto = Object.assign({}, meta); delete metaFoto.reemplazar;
    comprimir(file, sello, meta.TipoEvidencia).then(function (url) { return N.foto(metaFoto, url); })
      .then(function () { reemplazar.forEach(quitarFoto); toast(reemplazar.length ? 'Foto cambiada' : 'Foto guardada'); render(); }, function (err) { toast(err.message); });
  }
  document.getElementById('camara').addEventListener('change', alElegirFoto);
  document.getElementById('galeria').addEventListener('change', alElegirFoto);
  (function avisoFotoPerdida() {
    try {
      var pend = JSON.parse(sessionStorage.getItem('axion_foto_pend') || 'null');
      sessionStorage.removeItem('axion_foto_pend');
      if (pend && Date.now() - pend.t < 10 * 60000) {
        setTimeout(function () { toast('La cámara cerró la app y la foto no llegó. Lo escrito se recuperó: tome la foto de nuevo o use "Galería".'); }, 1500);
        if (pend.hash) location.hash = pend.hash;
      }
    } catch (x) { /* nada */ }
  })();

  // ------------------------------------------------------------ rutas
  /** Conserva lo escrito y aún no guardado cuando el formulario se redibuja (foto, ventana emergente, sincronización). */
  var escrito = null;
  function capturarEscrito() {
    if (document.getElementById('fPaso')) { escrito = { hash: location.hash, vals: valoresForm() }; return; }
    // la app pudo cerrarse (p. ej. al abrir la cámara): recuperar lo escrito guardado en el celular
    try { escrito = escrito || JSON.parse(sessionStorage.getItem('axion_form') || 'null'); } catch (x) { /* nada */ }
  }
  function respaldarEscrito() {
    try { sessionStorage.setItem('axion_form', JSON.stringify({ hash: location.hash, vals: valoresForm() })); } catch (x) { /* nada */ }
  }
  function olvidarEscrito() {
    try { sessionStorage.removeItem('axion_form'); } catch (x) { /* nada */ }
  }
  function restaurarEscrito() {
    if (!escrito || escrito.hash !== location.hash) { escrito = null; return; }
    document.querySelectorAll('#fPaso [name]').forEach(function (el) {
      if (!(el.name in escrito.vals) || el.disabled || el.type === 'hidden') return;
      if (el.type === 'checkbox') el.checked = !!escrito.vals[el.name];
      else if (el.type === 'radio') el.checked = el.value === escrito.vals[el.name];
      else el.value = escrito.vals[el.name];
    });
    escrito = null;
    var m = location.hash.match(/paso\/(\d)/) || (/rapido\/2/.test(location.hash) ? [0, '3'] : null);
    var p = getParte(location.hash.split('/')[2]);
    if (m && p) vivo(p, Number(m[1]));
  }

  /** Botón de "ojito" en cada contraseña para ver lo que se escribe. */
  function ojitos() {
    document.querySelectorAll('input[type="password"]:not([data-ojo])').forEach(function (inp) {
      inp.setAttribute('data-ojo', '1');
      var caja = document.createElement('span');
      caja.className = 'clave-caja';
      inp.parentNode.insertBefore(caja, inp);
      caja.appendChild(inp);
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'ojo'; b.setAttribute('data-a', 'ojo'); b.setAttribute('aria-label', 'Mostrar contraseña');
      b.innerHTML = ic('ojo');
      caja.appendChild(b);
    });
  }
  function render() {
    if (dlg.open) return;
    capturarEscrito();
    renderRuta();
    ojitos();
    restaurarEscrito();
  }

  function renderRuta() {
    var s = S();
    if (s && s.token && s.perfil && s.perfil.DebeCambiarClave) { vCambiarClave(); return; }
    if (!s || !s.token || !s.perfil || !s.cat) { vIngreso(s && s.errorSync && !s.token ? 'La sesión venció. Ingrese nuevamente (sus cambios pendientes se conservan).' : ''); return; }
    var h = location.hash || '';
    var q = {};
    (h.split('?')[1] || '').split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) q[p[0]] = decodeURIComponent(p[1] || ''); });
    var r = h.split('?')[0].split('/');
    var esOp = rol() === 'OPERADOR';
    if (r[1] === 'parte' && r[2] === 'nuevo') { if (esOp) nuevoParte(q); else location.replace('#/revisar'); return; }
    if (r[1] === 'parte' && r[3] === 'paso') return vAsistente(r[2], Number(r[4]));
    if (r[1] === 'parte' && r[3] === 'ia') return vIA(r[2]);
    if (r[1] === 'parte' && r[3] === 'rapido') return vRapido(r[2], Number(r[4]));
    if (r[1] === 'parte' && r[3] === 'uno') return vUno(r[2]);
    if (r[1] === 'parte' && r[2]) return vDetalle(r[2]);
    if (r[1] === 'falla' && r[2]) return vFalla(r[2]);
    if (r[1] === 'partes' && esOp) return vMisPartes();
    if (r[1] === 'revisar' && !esOp) return vRevisar();
    if (r[1] === 'cumplimiento' && !esOp) return vCumplimiento();
    if (r[1] === 'fallas' && !esOp) return vFallas();
    if (r[1] === 'mantto' && !esOp) return vMantto();
    if (r[1] === 'plan' && !esOp) return vPlan();
    if (r[1] === 'cuenta') return vCuenta();
    if (esOp && r[1] === 'inicio') return vInicio();
    location.replace(esOp ? '#/inicio' : '#/revisar');
  }
  var tRender = null;
  function refrescarChip() {
    var c = document.querySelector('.chip-sync');
    if (!c) return;
    var pend = S().outbox.length, online = navigator.onLine;
    var sync = N.ocupado() ? 'Sincronizando…' : (!online ? 'Sin señal' : (pend ? pend + ' por enviar' : 'Al día'));
    c.className = 'chip-sync ' + (!online ? 'off' : (pend ? 'pend' : ''));
    c.setAttribute('aria-label', 'Estado de sincronización: ' + sync);
    c.innerHTML = ic(online ? (pend ? 'refresh' : 'cloud') : 'cloudoff') + '<span>' + sync + '</span>';
  }
  N.alCambiar(function () {
    clearTimeout(tRender);
    tRender = setTimeout(function () {
      autoAplicarIA();  // lo que la IA terminó de leer se registra solo
      // en el formulario no se redibuja: se perdería lo escrito y aún no guardado
      if (document.getElementById('fPaso') || dlg.open) { refrescarChip(); refrescarIA(); return; }
      // en la pantalla única tampoco mientras se escribe una lectura
      var foco = document.activeElement;
      if (document.getElementById('fUno') && foco && /INPUT|TEXTAREA/.test(foco.tagName)) { refrescarChip(); return; }
      render();
    }, 120);
  });
  dlg.addEventListener('close', function () { setTimeout(render, 0); });
  window.addEventListener('hashchange', function () { window.scrollTo(0, 0); render(); });
  N.iniciar().then(function () { render(); if (S().token) N.sincronizar(); });
  if ('serviceWorker' in navigator) {
    // versión nueva publicada: el service worker nuevo toma el control y la app se recarga una vez (lo escrito se recupera)
    var habiaControl = !!navigator.serviceWorker.controller, recargando = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!habiaControl || recargando) { habiaControl = true; return; }
      recargando = true;
      respaldarEscrito();
      location.reload();
    });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
      document.addEventListener('visibilitychange', function () { if (!document.hidden) reg.update().catch(function () {}); });
    }).catch(function () {});
  }
})();
