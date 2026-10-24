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
        : [['#/revisar', 'checkc', 'Revisar', porRevisarCount()], ['#/cumplimiento', 'calendar', 'Cumplimiento'], ['#/fallas', 'wrench', 'Fallas'], ['#/cuenta', 'user', 'Cuenta', s.rechazados.length]];
      var actual = location.hash.split('/').slice(0, 2).join('/');
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
  function obsCount() { return N.filas('PARTES_DIARIOS', function (p) { return p.Estado === 'OBSERVADO' && p.OperadorID === perfil().OperadorID; }).length; }
  function porRevisarCount() { return N.filas('PARTES_DIARIOS', function (p) { return p.Estado === 'PENDIENTE_REVISION' || p.Estado === 'CORREGIDO'; }).length; }

  // ------------------------------------------------------------ ingreso
  function vIngreso(msg) {
    app.innerHTML = '<main class="ingreso"><div><div class="logo">AXION</div><p class="lema">Partes diarios y control de maquinaria</p></div>' +
      '<form class="tarjeta" id="fIngreso" style="display:grid;gap:14px" novalidate>' +
      '<h2>Ingresar</h2>' +
      '<label class="campo"><span>Correo</span><input name="email" type="email" autocomplete="username" inputmode="email" required value="' + esc((S().perfil || {}).Email || '') + '"></label>' +
      '<label class="campo"><span>Código de acceso</span><input name="codigo" type="password" autocomplete="current-password" required placeholder="XXXX-XXXX"><span class="ayuda">Se lo entrega el administrador. Es personal.</span></label>' +
      (msg ? '<div class="msg-error" role="alert">' + ic('alert') + '<span>' + esc(msg) + '</span></div>' : '') +
      '<button class="btn primario ancho" type="submit">Ingresar</button>' +
      '<p class="mini">La primera vez necesita señal. Después la app funciona sin internet.</p></form></main>';
    document.getElementById('fIngreso').onsubmit = function (e) {
      e.preventDefault();
      var f = new FormData(e.target);
      var b = e.target.querySelector('button');
      b.disabled = true; b.textContent = 'Ingresando…';
      N.ingresar(String(f.get('email')), String(f.get('codigo'))).then(function () {
        location.hash = rol() === 'OPERADOR' ? '#/inicio' : '#/revisar';
        render();
      }, function (err) { vIngreso(err.message); });
    };
  }

  // ------------------------------------------------------------ operador: inicio
  function vInicio() {
    var pr = R.proponer(Date.now());
    var mis = (cat().ASIGNACIONES || []).filter(function (a) { return a.OperadorID === perfil().OperadorID; });
    var tarjetas = mis.map(function (a) {
      var eq = equipo(a.EquipoID);
      var fecha = a.Turno === pr.turno ? pr.fecha : (a.Turno === 'DIA' ? hoy() : pr.fecha);
      var p = N.filas('PARTES_DIARIOS', function (x) { return x.AsignacionID === a.AsignacionID && x.FechaTrabajo === fecha && x.Estado !== 'ANULADO'; })[0];
      var actual = a.Turno === pr.turno;
      return '<article class="tarjeta' + (actual && !p ? ' destacada' : '') + '"><div class="fila"><div class="icono-caja acento">' + ic(eq.Familia === 'VOLQUETE' ? 'truck' : 'gauge') + '</div>' +
        '<div class="crece"><h3>' + esc(eq.CodigoInterno) + ' · ' + esc(eq.Familia) + '</h3><div class="sub">' + esc(nombreObra(a.ObraID)) + ' · ' + esc(turno(a.Turno).Nombre || a.Turno) + '</div>' +
        '<div class="mini">Fecha de trabajo ' + fF(fecha) + '</div></div>' + (p ? chip(p) : '') + '</div>' +
        '<div class="acciones" style="margin-top:12px">' + (p
          ? '<a class="btn ' + (editable(p) ? 'primario' : '') + ' ancho" href="#/parte/' + p.ParteID + (editable(p) ? '/paso/3' : '') + '">' + (editable(p) ? ic('edit') + 'Continuar parte' : ic('right') + 'Ver parte') + '</a>'
          : '<a class="btn ' + (actual ? 'primario' : '') + ' ancho" href="#/parte/nuevo?asig=' + a.AsignacionID + '&fecha=' + fecha + '">' + ic('plus') + 'Iniciar parte</a>') + '</div></article>';
    }).join('');
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
    var l = N.filas('PARTES_DIARIOS', function (p) { return p.OperadorID === perfil().OperadorID; })
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
    var l = N.filas('PARTES_DIARIOS', function (p) { return p.OperadorID === perfil().OperadorID; })
      .sort(function (a, b) { return (b.FechaTrabajo + b.Turno).localeCompare(a.FechaTrabajo + a.Turno); });
    var grupos = [['Para completar o corregir', function (p) { return editable(p); }],
      ['En revisión', function (p) { return !editable(p) && ['PENDIENTE_REVISION', 'CORREGIDO', 'BORRADOR', 'OBSERVADO'].indexOf(p.Estado) >= 0; }],
      ['Aprobados y anulados', function (p) { return p.Estado === 'APROBADO' || p.Estado === 'ANULADO'; }]];
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
    var id = N.nuevoID('PD');
    tmp[id] = { ParteID: id, OperadorID: perfil().OperadorID, FechaTrabajo: q.fecha || pr.fecha, Turno: a ? a.Turno : pr.turno,
      AsignacionID: a ? a.AsignacionID : '', FrenteID: a ? a.FrenteID : '', FechaCreacion: R.isoLima(Date.now()), Estado: '' };
    location.replace('#/parte/' + id + '/paso/1');
  }

  function guardarParte(p) {
    if (!p.AsignacionID) { tmp[p.ParteID] = p; return p; }
    var a = busca('ASIGNACIONES', 'AsignacionID', p.AsignacionID);
    var eq = equipo(a.EquipoID);
    var completo = Object.assign({}, p, { EquipoID: a.EquipoID, ObraID: a.ObraID, SupervisorID: a.SupervisorID,
      EmpresaID: eq.EmpresaPropietariaID, CodigoParte: R.codigoParte(eq.CodigoInterno, p.FechaTrabajo, p.Turno), Estado: p.Estado || 'BORRADOR' });
    delete tmp[p.ParteID];
    return N.guardar('PARTES_DIARIOS', completo);
  }

  function vAsistente(id, paso) {
    var p = getParte(id);
    if (!p) { location.replace('#/inicio'); return; }
    if (p.Estado && !editable(p)) { location.replace('#/parte/' + id); return; }
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
    marco(p.CodigoParte || 'Nuevo parte', cuerpo, { volver: '#/inicio', pie: pie });
    var f = document.getElementById('fPaso');
    f.oninput = function (e) { if (e.target.name) vivo(p, paso); };
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
      return '<p class="sub">Registre cada actividad con su hora. Las horas productivas no son las del horómetro.</p>' +
        '<div class="lista">' + (acts.map(function (a) {
          var c = catAct()[a.ActividadCatID] || {};
          return '<div class="tarjeta"><div class="entre"><div><h3>' + esc(c.Nombre) + '</h3><div class="mini num">' + a.HoraInicio + '–' + a.HoraFin + ' · ' + n1(a.DuracionHoras) + ' h' + (a.CantidadProducida !== '' && a.CantidadProducida !== undefined ? ' · ' + n1(a.CantidadProducida) + ' ' + esc(a.Unidad) : '') + '</div>' +
            (al[a.ActividadID] ? '<div class="msg-error">' + ic('alert') + esc(al[a.ActividadID]) + '</div>' : '') + (a._error ? '<div class="msg-error">' + ic('alert') + esc(a._error) + '</div>' : '') + '</div>' +
            '<div class="fila"><button type="button" class="btn chico fantasma" data-a="actForm" data-id="' + p.ParteID + '" data-k="' + a.ActividadID + '" aria-label="Editar actividad">' + ic('edit') + '</button>' +
            '<button type="button" class="btn chico fantasma" data-a="borrar" data-t="ACTIVIDADES" data-k="' + a.ActividadID + '" aria-label="Eliminar actividad">' + ic('trash') + '</button></div></div></div>';
        }).join('') || '<div class="vacio">' + ic('activity') + '<p>Sin actividades todavía.</p></div>') + '</div>' +
        '<button type="button" class="btn ancho" data-a="actForm" data-id="' + p.ParteID + '">' + ic('plus') + 'Agregar actividad</button>' +
        '<p class="mini">Horas productivas registradas: <strong class="num">' + n1(prod) + ' h</strong></p>';
    },
    5: function (p) {
      var eq = equipo(p.EquipoID);
      var vs = N.hijos('VIAJES', p.ParteID).sort(function (a, b) { return a.NumeroViaje - b.NumeroViaje; });
      var abs = N.hijos('ABASTECIMIENTOS', p.ParteID);
      var conViajes = ['VOLQUETE', 'CISTERNA'].indexOf(eq.Familia) >= 0 || vs.length;
      var tot = vs.reduce(function (s, v) { return s + Number(v.Cantidad || 0); }, 0);
      return (conViajes ? '<div class="etiqueta-seccion">Viajes (' + vs.length + ' · ' + n1(tot) + ' ' + esc((vs[0] || {}).Unidad || 'm3') + ')</div><div class="lista">' + vs.map(function (v) {
        return '<div class="tarjeta"><div class="entre"><div><h3>Viaje ' + v.NumeroViaje + '</h3><div class="mini num">' + v.HoraSalida + '–' + v.HoraLlegada + ' · ' + esc(v.Origen) + ' → ' + esc(v.Destino) + ' · ' + n1(v.Cantidad) + ' ' + esc(v.Unidad) + '</div>' + (v._error ? '<div class="msg-error">' + esc(v._error) + '</div>' : '') + '</div>' +
          '<button type="button" class="btn chico fantasma" data-a="borrar" data-t="VIAJES" data-k="' + v.ViajeID + '" aria-label="Eliminar viaje">' + ic('trash') + '</button></div></div>';
      }).join('') + '</div><button type="button" class="btn ancho" data-a="viajeForm" data-id="' + p.ParteID + '">' + ic('truck') + 'Agregar viaje</button>' : '<p class="sub">Este equipo no registra viajes; su producción va en Actividades.</p>') +
        '<div class="etiqueta-seccion">Abastecimiento de combustible</div><div class="lista">' + abs.map(function (x) {
          return '<div class="tarjeta"><div class="entre"><div><h3>' + n1(x.Galones) + ' gal</h3><div class="mini">' + fFH(x.FechaHora) + (x.HorometroAbastecimiento !== '' ? ' · horómetro ' + n1(x.HorometroAbastecimiento) : '') + '</div>' + (x._error ? '<div class="msg-error">' + esc(x._error) + '</div>' : '') + '</div>' +
            '<button type="button" class="btn chico fantasma" data-a="borrar" data-t="ABASTECIMIENTOS" data-k="' + x.AbastecimientoID + '" aria-label="Eliminar abastecimiento">' + ic('trash') + '</button></div>' +
            '<div style="margin-top:10px">' + botonFoto(p, 'HOROMETRO_ABASTECIMIENTO', 'Foto del horómetro', { AbastecimientoID: x.AbastecimientoID }) + '</div></div>';
        }).join('') + '</div><button type="button" class="btn ancho" data-a="abastForm" data-id="' + p.ParteID + '">' + ic('fuel') + 'Registrar abastecimiento</button>';
    },
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
        '<dt>Fotos</dt><dd>' + N.hijos('EVIDENCIAS', p.ParteID).length + '</dd><dt>Plazo de entrega</dt><dd>' + fFH(p.FechaHoraLimite || R.limite(p.FechaTrabajo, turno(p.Turno))) + '</dd></dl></div>' +
        (p.Estado === 'OBSERVADO' ? '<div class="aviso acento">' + ic('alert') + '<div><strong>Observación del supervisor</strong><div>' + esc(p.Observaciones) + '</div></div></div>' : '') +
        (r.ok ? '<div class="aviso">' + ic('checkc') + '<div><strong>Listo para enviar.</strong> Al enviar ya no podrá modificarlo, salvo que el supervisor lo observe.</div></div>'
          : '<div class="aviso peligro">' + ic('alert') + '<div><strong>Falta completar antes de enviar:</strong><ul>' + r.faltan.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></div>') +
        '<label class="campo"><span>Comentario para el supervisor (opcional)</span><textarea name="ObservacionOperador">' + esc(p.ObservacionOperador) + '</textarea></label>' +
        '<p class="mini">Sin señal también puede enviar: quedará como "pendiente de sincronización" hasta que haya conexión. Recién entonces cuenta como recibido.</p>';
    }
  };

  function puedeEnviar(p) {
    if (!p.AsignacionID) return { ok: false, faltan: ['Elija el equipo.'] };
    return R.revisarEnvio(p, equipo(p.EquipoID), N.hijos('ACTIVIDADES', p.ParteID), turno(p.Turno), catAct(),
      N.hijos('EVIDENCIAS', p.ParteID), N.filas('FALLAS'), N.hijos('ABASTECIMIENTOS', p.ParteID), cfg());
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
    var hecho = ev.length > 0;
    return '<div class="foto-req' + (hecho ? ' ok' : '') + '">' + ic(hecho ? 'checkc' : 'camera') + '<span class="crece">' + esc(texto) + (hecho ? ' · ' + ev.length + ' foto(s)' + (ev.some(function (e) { return e._pend; }) ? ' (por enviar)' : '') : '') + '</span>' +
      '<button type="button" class="btn chico ' + (hecho ? '' : 'primario') + '" data-a="foto" data-id="' + p.ParteID + '" data-tipo="' + tipo + '"' +
      (extra.FallaID ? ' data-falla="' + extra.FallaID + '"' : '') + (extra.AbastecimientoID ? ' data-abast="' + extra.AbastecimientoID + '"' : '') + '>' + ic('camera') + (hecho ? 'Otra' : 'Tomar') + '</button></div>';
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
  function comprimir(file, sello) {
    return new Promise(function (ok, mal) {
      var img = new Image();
      img.onload = function () {
        var k = Math.min(1, 1280 / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        var g = c.getContext('2d');
        g.drawImage(img, 0, 0, c.width, c.height);
        var fs = Math.max(14, Math.round(c.width / 45));
        g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, c.height - fs * 1.8, c.width, fs * 1.8);
        g.fillStyle = '#FF6B00'; g.font = 'bold ' + fs + 'px sans-serif';
        g.fillText(sello, fs * 0.6, c.height - fs * 0.6);
        URL.revokeObjectURL(img.src);
        ok(c.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = function () { mal(new Error('No se pudo leer la imagen.')); };
      img.src = URL.createObjectURL(file);
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
    a = a || { ActividadCatID: '', HoraInicio: ultimo ? ultimo.HoraFin : t.HoraInicio, HoraFin: '', CantidadProducida: '', Unidad: '' };
    var cats = (cat().ACTIVIDADES_CAT || []).slice().sort(function (x, y) { return x.Nombre.localeCompare(y.Nombre); });
    hoja(actID ? 'Editar actividad' : 'Nueva actividad',
      campo('Tipo de actividad', '<select name="ActividadCatID" required><option value="">Elija…</option>' + opciones(cats, a.ActividadCatID, 'ActividadCatID', 'Nombre') + '</select>', true) +
      '<div class="dos">' + campo('Hora inicio', '<input name="HoraInicio" type="time" value="' + esc(a.HoraInicio) + '" required>', true) + campo('Hora fin', '<input name="HoraFin" type="time" value="' + esc(a.HoraFin) + '" required>', true) + '</div>' +
      '<div class="dos">' + campo('Cantidad producida', '<input name="CantidadProducida" type="number" inputmode="decimal" min="0" step="0.1" value="' + esc(a.CantidadProducida) + '">') +
      campo('Unidad', '<select name="Unidad"><option value=""></option>' + ['m3', 'm2', 't', 'km', 'und', 'h'].map(function (u) { return '<option' + (u === a.Unidad ? ' selected' : '') + '>' + u + '</option>'; }).join('') + '</select>') + '</div>' +
      campo('Descripción', '<input name="Descripcion" value="' + esc(a.Descripcion) + '">'),
      function (v) {
        var c = catAct()[v.ActividadCatID];
        if (!c) return 'Elija el tipo de actividad.';
        if (!v.HoraInicio || !v.HoraFin) return 'Indique hora de inicio y fin.';
        var fila = { ActividadID: actID || N.nuevoID('ACT'), ParteID: parteID, ActividadCatID: v.ActividadCatID, HoraInicio: v.HoraInicio, HoraFin: v.HoraFin,
          CantidadProducida: v.CantidadProducida === '' ? '' : Number(v.CantidadProducida), Unidad: v.Unidad || c.UnidadPredeterminada || '',
          Descripcion: v.Descripcion, FrenteID: p.FrenteID, DuracionHoras: R.duracion(v.HoraInicio, v.HoraFin, t.HoraInicio) };
        var al = R.alertasActividades(otras.concat([fila]), t, catAct(), cfg())[fila.ActividadID];
        if (al && al !== 'Falta la cantidad producida') return al + '.';
        if (c.RequiereCantidad && !(fila.CantidadProducida > 0)) return 'Esta actividad requiere la cantidad producida.';
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
      (eq.TieneHorometro ? campo('Horómetro al abastecer', '<input name="HorometroAbastecimiento" type="number" inputmode="decimal" step="0.1" value="' + esc(p.HorometroInicial) + '">', true) : '') +
      (eq.TieneOdometro ? campo('Odómetro al abastecer', '<input name="OdometroAbastecimiento" type="number" inputmode="decimal">') : '') +
      campo('Galones', '<input name="Galones" type="number" inputmode="decimal" min="0" step="0.1">', true) +
      '<p class="mini">Después tome la foto del horómetro desde la tarjeta del abastecimiento.</p>',
      function (v) {
        var h = R.num(v.HorometroAbastecimiento), g = R.num(v.Galones);
        if (eq.TieneHorometro && (h === null || h < Number(p.HorometroInicial) || (R.num(p.HorometroFinal) !== null && h > Number(p.HorometroFinal))))
          return 'El horómetro debe estar entre el inicial y el final del parte.';
        if (!(g > 0) || g > Number(cfg().MAX_GALONES_ABASTECIMIENTO || 300)) return 'Galones fuera de rango.';
        N.guardar('ABASTECIMIENTOS', { AbastecimientoID: N.nuevoID('ABA'), ParteID: parteID, EquipoID: p.EquipoID, FechaHora: R.isoLima(Date.now()),
          HorometroAbastecimiento: h === null ? '' : h, OdometroAbastecimiento: R.num(v.OdometroAbastecimiento) === null ? '' : R.num(v.OdometroAbastecimiento), Galones: g });
        toast('Abastecimiento guardado: tome la foto del horómetro');
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
    if (editable(p)) botones += '<a class="btn primario ancho" href="#/parte/' + id + '/paso/' + (p.Estado === 'OBSERVADO' ? 3 : 8) + '">' + ic('edit') + (p.Estado === 'OBSERVADO' ? 'Corregir parte' : 'Continuar y enviar') + '</a>';
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
      (botones ? '<div class="acciones">' + botones + '</div>' : '') +
      '<div class="kpis"><div class="kpi"><div class="v num">' + n1(p.HorasTrabajadas) + '</div><div class="l">Horas horómetro</div></div>' +
      '<div class="kpi"><div class="v num">' + n1(acts.filter(function (a) { var t = (catAct()[a.ActividadCatID] || {}).TipoActividad; return t === 'PRODUCTIVA' || t === 'SERVICIO'; }).reduce(function (s, a) { return s + Number(a.DuracionHoras || 0); }, 0)) + '</div><div class="l">Horas productivas</div></div>' +
      '<div class="kpi"><div class="v num">' + n1(p.KmRecorridos) + '</div><div class="l">Km</div></div><div class="kpi"><div class="v num">' + vs.length + '</div><div class="l">Viajes</div></div></div>' +
      '<div class="tarjeta"><dl class="datos-def"><dt>Obra</dt><dd>' + esc(nombreObra(p.ObraID)) + '</dd><dt>Frente</dt><dd>' + esc(nombreFrente(p.FrenteID)) + '</dd>' +
      (eq.TieneHorometro ? '<dt>Horómetro</dt><dd>' + n1(p.HorometroInicial) + ' → ' + n1(p.HorometroFinal) + '</dd>' : '') +
      (eq.TieneOdometro ? '<dt>Odómetro</dt><dd>' + n1(p.OdometroInicial) + ' → ' + n1(p.OdometroFinal) + '</dd>' : '') +
      '<dt>Enviado (celular)</dt><dd>' + fFH(p.FechaEnvio) + '</dd><dt>Recibido (servidor)</dt><dd>' + fFH(p.FechaRecepcionServidor) + '</dd><dt>Plazo</dt><dd>' + fFH(p.FechaHoraLimite) + '</dd></dl></div>' +
      '<div class="etiqueta-seccion">Actividades (' + acts.length + ')</div><div class="lista">' + (acts.map(function (a) {
        var c = catAct()[a.ActividadCatID] || {};
        return '<div class="tarjeta"><div class="entre"><div><h3>' + esc(c.Nombre) + '</h3><div class="mini num">' + a.HoraInicio + '–' + a.HoraFin + ' · ' + n1(a.DuracionHoras) + ' h' + (a.CantidadProducida !== '' && a.CantidadProducida !== undefined ? ' · ' + n1(a.CantidadProducida) + ' ' + esc(a.Unidad) : '') + '</div></div>' +
          (al[a.ActividadID] ? '<span class="estado alerta">' + ic('alert') + esc(al[a.ActividadID]) + '</span>' : '') + '</div></div>';
      }).join('') || '<p class="mini">Sin actividades.</p>') + '</div>' +
      (vs.length ? '<div class="etiqueta-seccion">Viajes (' + vs.length + ')</div><div class="tarjeta"><div class="lista">' + vs.sort(function (a, b) { return a.NumeroViaje - b.NumeroViaje; }).map(function (v) {
        return '<div class="entre mini num"><span>#' + v.NumeroViaje + ' ' + v.HoraSalida + '–' + v.HoraLlegada + '</span><span>' + n1(v.Cantidad) + ' ' + esc(v.Unidad) + '</span></div>';
      }).join('') + '</div></div>' : '') +
      (fs.length ? '<div class="etiqueta-seccion">Fallas</div>' + fs.map(function (f) {
        return '<a class="tarjeta tocable" href="#/falla/' + f.FallaID + '" style="display:block;color:inherit;text-decoration:none"><div class="entre"><div><h3>' + esc(f.Componente) + '</h3><div class="sub">' + esc(f.Descripcion) + '</div></div><span class="estado alerta">' + ic('wrench') + esc(f.Estado) + '</span></div></a>';
      }).join('') : '') +
      '<div class="etiqueta-seccion">Fotos (' + ev.length + ')</div>' + galeria(ev) +
      '<div class="etiqueta-seccion">Historial</div><div class="tarjeta linea-tiempo">' + (revs.map(function (r) {
        return '<div class="' + (r.ResultadoServidor === 'APLICADA' ? 'ok' : '') + '"><span></span><div><strong>' + esc(r.Accion) + '</strong> · ' + esc(r.Usuario) +
          '<div class="mini">' + (r.FechaHoraServidor ? 'servidor ' + fFH(r.FechaHoraServidor) : 'pendiente de sincronización') + (r.ResultadoServidor === 'RECHAZADA' ? ' · RECHAZADA: ' + esc(r.DetalleServidor) : '') + '</div>' +
          (r.Comentario ? '<div class="sub">' + esc(r.Comentario) + '</div>' : '') + '</div></div>';
      }).join('') || '<p class="mini">Sin movimientos.</p>') + '</div>';
    marco(p.CodigoParte || 'Parte', cuerpo, { volver: rol() === 'OPERADOR' ? '#/partes' : '#/revisar' });
  }

  function flujo(id, acc) {
    var p = getParte(id);
    var nombres = { APROBAR: 'Aprobar parte', OBSERVAR: 'Observar parte', EXCEPCION: 'Aceptar excepción de lectura', ANULAR: 'Anular parte', REABRIR: 'Reabrir parte aprobado' };
    if (R.REQUIERE_COMENTARIO.indexOf(acc) >= 0) {
      hoja(nombres[acc], '<p class="sub">' + esc(p.CodigoParte) + '</p>' + campo(acc === 'OBSERVAR' ? 'Qué debe corregir el operador' : 'Motivo', '<textarea name="c" required></textarea>', true),
        function (v) {
          if (String(v.c || '').trim().length < 5) return 'Escriba el motivo (mínimo 5 letras).';
          N.accion(p, acc, v.c.trim());
          toast(nombres[acc] + ': enviado');
        }, acc === 'ANULAR' ? 'Anular' : 'Confirmar');
    } else {
      confirmar(nombres[acc], '¿Confirma? Quedará registrado con su nombre y la hora del servidor.', acc === 'APROBAR' ? 'Aprobar' : 'Confirmar').then(function (si) {
        if (si) { N.accion(p, acc, ''); toast('Enviado'); render(); }
      });
    }
  }

  // ------------------------------------------------------------ supervisor / administrador
  function vRevisar() {
    var filtros = [['POR_REVISAR', 'Por revisar', function (p) { return p.Estado === 'PENDIENTE_REVISION' || p.Estado === 'CORREGIDO'; }],
      ['OBSERVADO', 'Observados', function (p) { return p.Estado === 'OBSERVADO'; }],
      ['ALERTAS', 'Excepciones', function (p) { return p.Estado !== 'ANULADO' && p.ExcepcionLectura === true && !p.ExcepcionAutorizadaPor; }],
      ['TODOS', 'Todos', function () { return true; }]];
    var f = filtros.filter(function (x) { return x[0] === filtroRevisar; })[0] || filtros[0];
    var l = N.filas('PARTES_DIARIOS', f[2]).sort(function (a, b) { return (b.FechaTrabajo + b.Turno).localeCompare(a.FechaTrabajo + a.Turno); });
    var grupos = {};
    l.forEach(function (p) { (grupos[p.ObraID] = grupos[p.ObraID] || []).push(p); });
    marco(rol() === 'ADMIN' ? 'Revisión (administrador)' : 'Revisar partes',
      '<div class="segmento" role="group" aria-label="Filtro">' + filtros.map(function (x) {
        return '<button type="button" data-a="filtro" data-v="' + x[0] + '" aria-pressed="' + (x[0] === f[0]) + '">' + x[1] + ' (' + N.filas('PARTES_DIARIOS', x[2]).length + ')</button>';
      }).join('') + '</div>' +
      (l.length ? Object.keys(grupos).map(function (o) {
        return '<div class="etiqueta-seccion">' + esc(nombreObra(o)) + '</div><div class="lista">' + grupos[o].slice(0, 150).map(tarjetaParte).join('') + '</div>';
      }).join('') : '<div class="vacio">' + ic('checkc') + '<p>Nada pendiente aquí.</p></div>'));
  }

  function vCumplimiento() {
    var todos = N.filas('CUMPLIMIENTO');
    var fechas = Array.from(new Set(todos.map(function (c) { return c.FechaTrabajo; }))).sort().reverse();
    if (!diaCumpl || fechas.indexOf(diaCumpl) < 0) diaCumpl = fechas[0];
    var aceptar = cfg().ACEPTAR_SINCRONIZACION_TARDIA === 'SI';
    var dia = todos.filter(function (c) { return c.FechaTrabajo === diaCumpl; }).map(function (c) {
      var p = c.ParteID ? N.fila('PARTES_DIARIOS', c.ParteID) : null;
      return Object.assign({}, c, { E: p || !c.EstadoCumplimiento ? R.estadoCumplimiento(c.FechaHoraLimite, p, Date.now(), aceptar) : c.EstadoCumplimiento });
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
        var inner = '<div class="entre"><div><h3>' + esc(eq.CodigoInterno || c.EquipoID) + ' · ' + esc(c.Turno) + '</h3><div class="mini">' + esc(nombreOp(c.OperadorID)) + ' · plazo ' + fFH(c.FechaHoraLimite) + '</div></div>' + chipCumpl(c.E) + '</div>';
        return c.ParteID ? '<a class="tarjeta tocable" href="#/parte/' + c.ParteID + '" style="display:block;color:inherit;text-decoration:none">' + inner + '</a>' : '<div class="tarjeta">' + inner + '</div>';
      }).join('') + '</div>' + (dia.length ? '' : '<div class="vacio">' + ic('calendar') + '<p>Sin partes esperados.</p></div>'));
  }

  function vFallas() {
    var l = N.filas('FALLAS').sort(function (a, b) { return (a.Estado === 'CERRADA') - (b.Estado === 'CERRADA') || String(b.FechaHoraInicio).localeCompare(String(a.FechaHoraInicio)); });
    marco('Fallas', l.length ? '<div class="lista">' + l.map(function (f) {
      var eq = equipo(f.EquipoID);
      return '<a class="tarjeta tocable" href="#/falla/' + f.FallaID + '" style="display:block;color:inherit;text-decoration:none"><div class="entre"><div><div class="codigo">' + esc(f.CodigoFalla) + '</div><h3>' + esc(eq.CodigoInterno) + ' · ' + esc(f.Componente) + '</h3>' +
        '<div class="mini">' + esc(busca('SISTEMAS_FALLA', 'SistemaID', f.SistemaID).Nombre) + ' · desde ' + fFH(f.FechaHoraInicio) + '</div></div>' +
        '<span class="estado ' + (f.Estado === 'CERRADA' ? 'ok' : 'alerta') + '">' + ic(f.Estado === 'CERRADA' ? 'checkc' : 'wrench') + esc(f.Estado) + '</span></div></a>';
    }).join('') + '</div>' : '<div class="vacio">' + ic('wrench') + '<p>Sin fallas registradas.</p></div>');
  }

  function vFalla(id) {
    var f = N.fila('FALLAS', id);
    if (!f) { marco('Falla', '<div class="vacio"><p>No disponible.</p></div>', { volver: '#/fallas' }); return; }
    var turnos = N.filas('FALLAS_PARTES', function (x) { return x.FallaID === id; });
    var revisor = rol() !== 'OPERADOR';
    marco(f.CodigoFalla, '<div class="entre"><h1>' + esc(f.Componente) + '</h1><span class="estado alerta">' + esc(f.Estado) + '</span></div>' +
      '<div class="tarjeta"><dl class="datos-def"><dt>Equipo</dt><dd>' + esc(equipo(f.EquipoID).CodigoInterno) + '</dd><dt>Sistema</dt><dd>' + esc(busca('SISTEMAS_FALLA', 'SistemaID', f.SistemaID).Nombre) + '</dd>' +
      '<dt>Inicio</dt><dd>' + fFH(f.FechaHoraInicio) + '</dd><dt>Término</dt><dd>' + fFH(f.FechaHoraFin) + '</dd><dt>Parada calendario</dt><dd>' + n1(f.TiempoParadaHoras) + ' h</dd>' +
      '<dt>Turnos afectados</dt><dd>' + turnos.length + '</dd><dt>Responsable</dt><dd>' + esc(f.Responsable || '—') + '</dd></dl></div>' +
      '<div class="tarjeta"><h3>Descripción</h3><p class="sub">' + esc(f.Descripcion) + '</p>' + (f.AccionRealizada ? '<h3>Acción realizada</h3><p class="sub">' + esc(f.AccionRealizada) + '</p>' : '') + '</div>' +
      (revisor && f.Estado !== 'CERRADA' ? '<button class="btn primario ancho" data-a="cerrarFalla" data-k="' + id + '">' + ic('check') + 'Registrar reparación / cerrar</button>' : '') +
      '<a class="btn ancho" href="#/parte/' + f.ParteID + '">' + ic('file') + 'Ver parte de origen</a>', { volver: '#/fallas' });
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
  var ACC = {
    volver: function (b) { location.hash = b.dataset.h; },
    ir: function (b) {
      var m = location.hash.match(/#\/parte\/([^/]+)\/paso\/(\d+)/);
      if (m) { var err = guardarPaso(m[1], Number(m[2])); if (err) { toast(err); return; } }
      location.hash = b.dataset.h;
    },
    sync: function () { if (!navigator.onLine) { toast('Sin señal: se enviará al reconectar.'); return; } N.sincronizar(); },
    turno: function (b) {
      document.querySelectorAll('[data-a="turno"]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      document.querySelector('[name="Turno"]').value = b.dataset.v;
    },
    pasoSig: function (b) {
      var err = guardarPaso(b.dataset.id, Number(b.dataset.p));
      if (err) { toast(err); return; }
      location.hash = '#/parte/' + b.dataset.id + '/paso/' + (Number(b.dataset.p) + 1);
    },
    pasoAnt: function (b) { guardarPaso(b.dataset.id, Number(b.dataset.p)); location.hash = '#/parte/' + b.dataset.id + '/paso/' + (Number(b.dataset.p) - 1); },
    enviar: function (b) {
      var err = guardarPaso(b.dataset.id, 8);
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
    foto: function (b) {
      fotoMeta = { ParteID: b.dataset.id, TipoEvidencia: b.dataset.tipo, FallaID: b.dataset.falla || '', AbastecimientoID: b.dataset.abast || '' };
      var inp = document.getElementById('camara');
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
    e.preventDefault();
    ACC[b.dataset.a](b, e);
  });
  document.addEventListener('change', function (e) {
    if (e.target.name === 'AsignacionID') {
      var m = location.hash.match(/#\/parte\/([^/]+)\/paso\/2/);
      if (m) { var p = getParte(m[1]); var a = busca('ASIGNACIONES', 'AsignacionID', e.target.value); tmp[p.ParteID] = Object.assign({}, p, { AsignacionID: a.AsignacionID, FrenteID: a.FrenteID }); if (!p.Estado) render(); else document.querySelectorAll('.opcion').forEach(function (o) { o.setAttribute('aria-checked', o.contains(e.target)); }); }
    }
  });
  document.getElementById('camara').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file || !fotoMeta) return;
    var p = getParte(fotoMeta.ParteID);
    var sello = 'AXION · ' + (p.CodigoParte || '') + ' · ' + fF(R.enLima(Date.now()).fecha) + ' ' + R.enLima(Date.now()).hora;
    comprimir(file, sello).then(function (url) { return N.foto(fotoMeta, url); }).then(function () { toast('Foto guardada'); render(); }, function (err) { toast(err.message); });
  });

  // ------------------------------------------------------------ rutas
  /** Conserva lo escrito y aún no guardado cuando el formulario se redibuja (foto, ventana emergente, sincronización). */
  var escrito = null;
  function capturarEscrito() {
    if (document.getElementById('fPaso')) escrito = { hash: location.hash, vals: valoresForm() };
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
    var m = location.hash.match(/paso\/(\d)/);
    var p = getParte(location.hash.split('/')[2]);
    if (m && p) vivo(p, Number(m[1]));
  }

  function render() {
    if (dlg.open) return;
    capturarEscrito();
    renderRuta();
    restaurarEscrito();
  }

  function renderRuta() {
    var s = S();
    if (!s || !s.token || !s.perfil || !s.cat) { vIngreso(s && s.errorSync && !s.token ? 'La sesión venció. Ingrese nuevamente (sus cambios pendientes se conservan).' : ''); return; }
    var h = location.hash || '';
    var q = {};
    (h.split('?')[1] || '').split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) q[p[0]] = decodeURIComponent(p[1] || ''); });
    var r = h.split('?')[0].split('/');
    var esOp = rol() === 'OPERADOR';
    if (r[1] === 'parte' && r[2] === 'nuevo') { if (esOp) nuevoParte(q); else location.replace('#/revisar'); return; }
    if (r[1] === 'parte' && r[3] === 'paso') return vAsistente(r[2], Number(r[4]));
    if (r[1] === 'parte' && r[2]) return vDetalle(r[2]);
    if (r[1] === 'falla' && r[2]) return vFalla(r[2]);
    if (r[1] === 'partes' && esOp) return vMisPartes();
    if (r[1] === 'revisar' && !esOp) return vRevisar();
    if (r[1] === 'cumplimiento' && !esOp) return vCumplimiento();
    if (r[1] === 'fallas' && !esOp) return vFallas();
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
      // en el formulario no se redibuja: se perdería lo escrito y aún no guardado
      if (document.getElementById('fPaso') || dlg.open) { refrescarChip(); return; }
      render();
    }, 120);
  });
  dlg.addEventListener('close', function () { setTimeout(render, 0); });
  window.addEventListener('hashchange', function () { window.scrollTo(0, 0); render(); });
  N.iniciar().then(function () { render(); if (S().token) N.sincronizar(); });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
})();
