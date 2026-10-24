// COPIA GENERADA de compartido/reglas.js por herramientas/exportar_app.py. No editar.
/* AXION · Reglas de negocio compartidas.
 * El MISMO archivo se usa en el celular (web/reglas.js) y en el servidor
 * (backend/Reglas.gs); exportar_app.py lo copia. No editar las copias.
 * Fechas: 'AAAA-MM-DD'. Horas: 'HH:mm'. Fecha-hora: ISO con -05:00 (Lima, sin horario de verano).
 */
var Reglas = (function () {
  var TZ = '-05:00';

  function num(v) { return (v === '' || v === null || v === undefined || isNaN(Number(v))) ? null : Number(v); }
  function vacio(v) { return v === '' || v === null || v === undefined; }
  function minutos(hhmm) { var p = String(hhmm).split(':'); return Number(p[0]) * 60 + Number(p[1]); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function sumarDias(fecha, dias) {
    var p = fecha.split('-');
    var d = new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]) + Number(dias || 0)));
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }

  /** Hora de Lima de un instante: {fecha:'AAAA-MM-DD', hora:'HH:mm'} */
  function enLima(ms) {
    var d = new Date(ms - 5 * 3600000);
    return { fecha: d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()),
             hora: pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) };
  }
  function isoLima(ms) {
    var d = new Date(ms - 5 * 3600000);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' +
      pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + TZ;
  }

  /** Horas desde el inicio del turno (resuelve el cruce de medianoche). */
  function relInicio(hora, inicioTurno) {
    var r = ((minutos(hora) - minutos(inicioTurno)) % 1440 + 1440) % 1440;
    return r / 60;
  }
  function relFin(hora, inicioTurno) {
    var r = relInicio(hora, inicioTurno);
    return r === 0 ? 24 : r;
  }
  function duracion(ini, fin, inicioTurno) {
    if (vacio(ini) || vacio(fin)) return null;
    return Math.round((relFin(fin, inicioTurno) - relInicio(ini, inicioTurno)) * 100) / 100;
  }

  function claveUnica(equipoID, fecha, turno) { return equipoID + '|' + fecha + '|' + turno; }
  function codigoParte(codEquipo, fecha, turno) {
    return 'PD-' + codEquipo + '-' + String(fecha).replace(/-/g, '') + '-' + String(turno).charAt(0);
  }
  /** Fecha-hora límite de entrega según TURNOS. */
  function limite(fecha, turno) {
    return sumarDias(fecha, turno.DiasDesplazamientoLimite) + 'T' + turno.HoraLimiteEntrega + ':00' + TZ;
  }
  /** Fecha de trabajo y turno propuestos para un instante (antes de 07:00 = noche de ayer). */
  function proponer(ms) {
    var l = enLima(ms);
    var m = minutos(l.hora);
    return { fecha: m < 420 ? sumarDias(l.fecha, -1) : l.fecha, turno: (m >= 420 && m < 1140) ? 'DIA' : 'NOCHE' };
  }

  /** Validación de lecturas. Devuelve {errores:[], alertas:[]}. errores bloquean; alertas exigen excepción. */
  function lecturas(p, equipo, cfg, final) {
    var e = [], a = [];
    // la comparación con la "última lectura recibida" solo vale mientras el parte aún no llegó al servidor
    if (!vacio(p.FechaRecepcionServidor)) equipo = Object.assign({}, equipo, { UltimoHorometro: '', UltimoOdometro: '' });
    var hi = num(p.HorometroInicial), hf = num(p.HorometroFinal);
    var oi = num(p.OdometroInicial), of = num(p.OdometroFinal);
    if (equipo.TieneHorometro) {
      if (hi === null) { if (final) e.push('Falta el horómetro inicial.'); }
      else if (hi < 0) e.push('El horómetro no puede ser negativo.');
      if (final && hf === null) e.push('Falta el horómetro final.');
      if (hi !== null && hf !== null) {
        if (hf < hi) e.push('El horómetro final no puede ser menor que el inicial.');
        else if (hf - hi > Number(cfg.MAX_HORAS_TURNO)) e.push('Las horas superan el máximo por turno (' + cfg.MAX_HORAS_TURNO + ' h).');
      }
      if (hi !== null && num(equipo.UltimoHorometro) !== null && equipo.UltimaLecturaParteID !== p.ParteID &&
          Math.abs(hi - Number(equipo.UltimoHorometro)) > Number(cfg.TOL_SALTO_HOROMETRO_H)) {
        a.push('El horómetro inicial (' + hi + ') no coincide con el último final recibido (' + equipo.UltimoHorometro + ').');
      }
    }
    if (equipo.TieneOdometro) {
      if (oi === null) { if (final) e.push('Falta el odómetro inicial.'); }
      else if (oi < 0) e.push('El odómetro no puede ser negativo.');
      if (final && of === null) e.push('Falta el odómetro final.');
      if (oi !== null && of !== null) {
        if (of < oi) e.push('El odómetro final no puede ser menor que el inicial.');
        else if (of - oi > Number(cfg.MAX_KM_TURNO)) e.push('Los km superan el máximo por turno (' + cfg.MAX_KM_TURNO + ' km).');
      }
      if (oi !== null && num(equipo.UltimoOdometro) !== null && equipo.UltimaLecturaParteID !== p.ParteID &&
          Math.abs(oi - Number(equipo.UltimoOdometro)) > Number(cfg.TOL_SALTO_ODOMETRO_KM)) {
        a.push('El odómetro inicial (' + oi + ') no coincide con el último final recibido (' + equipo.UltimoOdometro + ').');
      }
    }
    return { errores: e, alertas: a };
  }

  /** Alerta de cada actividad del parte: {ActividadID: texto o ''} */
  function alertasActividades(acts, turno, catalogo, cfg) {
    var out = {};
    var rel = acts.map(function (x) {
      return { id: x.ActividadID, i: vacio(x.HoraInicio) ? null : relInicio(x.HoraInicio, turno.HoraInicio),
               f: vacio(x.HoraFin) ? null : relFin(x.HoraFin, turno.HoraInicio), x: x };
    });
    rel.forEach(function (r) {
      var cat = catalogo[r.x.ActividadCatID] || {};
      var msg = '';
      if (r.i === null || r.f === null) msg = 'Faltan horas';
      else if (r.f <= r.i) msg = 'La hora final debe ser posterior a la inicial';
      else if (r.f > Number(turno.DuracionHoras) + Number(cfg.TOLERANCIA_FUERA_TURNO_H)) msg = 'Fuera del turno';
      else if (rel.some(function (o) { return o.id !== r.id && o.i !== null && o.f !== null && o.f > o.i && o.i < r.f && o.f > r.i; }))
        msg = 'Se cruza con otra actividad';
      else if (cat.RequiereCantidad && !(num(r.x.CantidadProducida) > 0)) msg = 'Falta la cantidad producida';
      out[r.id] = msg;
    });
    return out;
  }

  /** Fotos obligatorias que faltan (lista de textos). */
  function fotosFaltantes(p, equipo, evid, fallas, abast, cfg) {
    var f = [];
    function tiene(tipo) { return evid.some(function (e) { return e.ParteID === p.ParteID && e.TipoEvidencia === tipo; }); }
    if (cfg.FOTO_HOROMETRO_OBLIGATORIA === 'SI' && equipo.TieneHorometro) {
      if (!tiene('HOROMETRO_INICIAL')) f.push('Horómetro inicial');
      if (!tiene('HOROMETRO_FINAL')) f.push('Horómetro final');
    }
    if (cfg.FOTO_ODOMETRO_OBLIGATORIA === 'SI' && equipo.TieneOdometro) {
      if (!tiene('ODOMETRO_INICIAL')) f.push('Odómetro inicial');
      if (!tiene('ODOMETRO_FINAL')) f.push('Odómetro final');
    }
    if (cfg.FOTO_PARTE_FIRMADO_OBLIGATORIA === 'SI' && !tiene('PARTE_FISICO_FIRMADO')) f.push('Parte físico firmado');
    if (cfg.FOTO_FALLA_OBLIGATORIA === 'SI') fallas.forEach(function (x) {
      if (x.ParteID === p.ParteID && !evid.some(function (e) { return e.FallaID === x.FallaID; })) f.push('Falla ' + (x.Componente || ''));
    });
    if (cfg.FOTO_ABASTECIMIENTO_OBLIGATORIA === 'SI') abast.forEach(function (x) {
      if (x.ParteID === p.ParteID && !evid.some(function (e) { return e.AbastecimientoID === x.AbastecimientoID; })) f.push('Horómetro de abastecimiento');
    });
    return f;
  }

  /** ¿Se puede ENVIAR? Devuelve {ok, faltan:[textos]} */
  function revisarEnvio(p, equipo, acts, turno, catalogo, evid, fallas, abast, cfg) {
    var faltan = [];
    var l = lecturas(p, equipo, cfg, true);
    faltan = faltan.concat(l.errores);
    if (l.alertas.length && !(p.ExcepcionLectura === true && String(p.MotivoExcepcion || '').length >= 15))
      faltan.push('Hay una alerta de lectura: marque la excepción y explique el motivo (mínimo 15 letras).');
    if (vacio(p.FrenteID)) faltan.push('Falta el frente.');
    if (!acts.length) faltan.push('Registre al menos una actividad.');
    var al = alertasActividades(acts, turno, catalogo, cfg);
    Object.keys(al).forEach(function (k) { if (al[k]) faltan.push('Actividad: ' + al[k] + '.'); });
    fotosFaltantes(p, equipo, evid, fallas, abast, cfg).forEach(function (x) { faltan.push('Falta foto: ' + x + '.'); });
    return { ok: faltan.length === 0, faltan: faltan };
  }

  /** Estado de cumplimiento (misma regla que el Excel maestro). */
  function estadoCumplimiento(limiteISO, parte, ahoraMs, aceptarTardia) {
    var lim = Date.parse(limiteISO);
    if (!parte) return ahoraMs > lim ? 'SIN PARTE (VENCIDO)' : 'PENDIENTE (EN PLAZO)';
    if (vacio(parte.FechaRecepcionServidor)) return ahoraMs > lim ? 'SIN ENVIO (VENCIDO)' : 'BORRADOR (EN PLAZO)';
    var rec = Date.parse(parte.FechaRecepcionServidor);
    if (rec <= lim) return 'A TIEMPO';
    if (!vacio(parte.FechaEnvio) && Date.parse(parte.FechaEnvio) <= lim) return 'ENVIADO A TIEMPO - SINCRONIZADO TARDE';
    return 'ATRASADO';
  }

  /** Acciones de flujo permitidas. ctx = {esAdmin, operadorID, supervisorID, obras:[], puedeAprobar} */
  function accionesPermitidas(ctx, p, puedeCorregir) {
    if (!p || p.Estado === 'ANULADO') return [];
    if (ctx.esAdmin) {
      var a = [];
      if (p.Estado === 'PENDIENTE_REVISION' || p.Estado === 'CORREGIDO') a.push('APROBAR', 'OBSERVAR');
      if (p.Estado !== 'APROBADO') a.push('EXCEPCION');
      if (p.Estado === 'APROBADO') a.push('REABRIR');
      a.push('ANULAR');
      return a;
    }
    if (ctx.operadorID && p.OperadorID === ctx.operadorID) {
      if (p.Estado === 'BORRADOR') return ['ENVIAR'];
      if (p.Estado === 'OBSERVADO' && puedeCorregir) return ['CORREGIR'];
      return [];
    }
    if (ctx.supervisorID && ctx.obras.indexOf(p.ObraID) >= 0) {
      var s = [];
      if (p.Estado === 'PENDIENTE_REVISION' || p.Estado === 'CORREGIDO') {
        if (ctx.puedeAprobar) s.push('APROBAR');
        s.push('OBSERVAR');
      }
      if (p.Estado !== 'APROBADO' && p.Estado !== 'BORRADOR') s.push('EXCEPCION');
      return s;
    }
    return [];
  }

  var ESTADO_DESTINO = { ENVIAR: 'PENDIENTE_REVISION', CORREGIR: 'CORREGIDO', OBSERVAR: 'OBSERVADO',
    APROBAR: 'APROBADO', ANULAR: 'ANULADO', REABRIR: 'OBSERVADO', EXCEPCION: null };
  var REQUIERE_COMENTARIO = ['OBSERVAR', 'ANULAR', 'REABRIR', 'EXCEPCION'];

  return { num: num, vacio: vacio, sumarDias: sumarDias, enLima: enLima, isoLima: isoLima,
    relInicio: relInicio, relFin: relFin, duracion: duracion, claveUnica: claveUnica,
    codigoParte: codigoParte, limite: limite, proponer: proponer, lecturas: lecturas,
    alertasActividades: alertasActividades, fotosFaltantes: fotosFaltantes, revisarEnvio: revisarEnvio,
    estadoCumplimiento: estadoCumplimiento, accionesPermitidas: accionesPermitidas,
    ESTADO_DESTINO: ESTADO_DESTINO, REQUIERE_COMENTARIO: REQUIERE_COMENTARIO };
})();
if (typeof module !== 'undefined') module.exports = Reglas;
