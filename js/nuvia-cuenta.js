/**
 * NUVIA — cuenta con datos mínimos (paso 28) y consentimiento granular
 * (paso 29), Fase 4.
 *
 * Bloque «Tu cuenta»: crear cuenta o iniciar sesión con correo y contraseña,
 * y nada más — sin teléfono, sin datos de patrimonio, sin preguntas sobre el
 * perfil del lector (la guía lo dice tal cual: un cuestionario de perfil se
 * parecería a un test de idoneidad, que es justo lo que la norma regula).
 *
 * La sesión de lectura anónima que ya usa el laboratorio se enlaza a la
 * cuenta nueva (mismo usuario antes y después), así que nada se pierde al
 * registrarse. Los mensajes de error llegan en llano desde nuvia-datos.js.
 *
 * Consentimiento (bases §2): lo necesario para el servicio no lleva casilla
 * y se dice por qué; lo opcional —comunicaciones y análisis de uso— es
 * opt-in, nunca premarcado, y revocable al instante desde este mismo bloque.
 * Cada decisión se apunta con su fecha.
 *
 * Lenguaje: describe, nunca prescribe. Registrarse es una opción que se
 * explica; no se empuja a nadie a hacerlo ni a marcar casilla alguna.
 *
 * Derechos RGPD (paso 34): acceso, rectificación, supresión y portabilidad,
 * operativos desde el primer usuario y en autoservicio — ver todo, descargar
 * el JSON, corregir contraseña o correo, y borrar la cuenta con todo lo suyo
 * (carteras de la nube incluidas) sin intervención de nadie.
 */

import { maestra, leeSuscripcion, CLAVE_SUSCRIPCION } from './nuvia-datos.js';

export const NOTA_DATOS_MINIMOS = 'Solo pedimos correo y contraseña. '
  + 'Sin teléfono, sin datos de patrimonio y sin preguntas sobre tu manera de '
  + 'invertir: esta página describe métricas y no necesita saber nada de ti '
  + 'para hacerlo.';

export const NOTA_QUE_APORTA = 'Con la sesión iniciada, tus carteras se '
  + 'guardan en tu cuenta —sin tope y disponibles desde cualquier '
  + 'dispositivo— y el constructor añade el análisis ampliado: concentración, '
  + 'solapamiento entre fondos, ahorro por diversificar y la frontera con tu '
  + 'combinación marcada.';

/* ── Consentimiento granular (paso 29, bases §2) ── */

export const CLAVE_CONSENTIMIENTOS = 'nuvia.consentimientos.v1';

/**
 * Qué se separa y por qué. Lo necesario no lleva casilla: sin ello no hay
 * servicio, y marcarlo como elegible sería fingir una elección. Lo opcional
 * es opt-in de verdad: apagado hasta que alguien lo encienda, y con la
 * explicación delante de la casilla, no detrás de un enlace.
 */
export const CONSENTIMIENTOS = [
  {
    clave: 'servicio',
    nombre: 'Cuenta y guardado de carteras',
    necesario: true,
    explica: 'Lo imprescindible del servicio: el correo identifica la cuenta '
      + 'y guarda lo que decidas guardar. No se usa para nada más y por eso '
      + 'no lleva casilla: sin esto no hay cuenta.',
  },
  {
    clave: 'comunicaciones',
    nombre: 'Comunicaciones por correo',
    necesario: false,
    explica: 'Recibir por correo avisos y novedades del portal. Hoy no se '
      + 'envía ninguno; la casilla decide lo que pasará cuando existan.',
  },
  {
    clave: 'comportamiento',
    nombre: 'Análisis de uso',
    necesario: false,
    explica: 'Registrar con qué activos y vistas trabaja tu cuenta para '
      + 'estudiar cómo se usa el portal. Es elaboración de perfil y hoy no '
      + 'se hace: con la casilla apagada, no se registrará nunca.',
  },
];

function leeTodoConsentimiento(almacen) {
  try {
    const todo = JSON.parse(almacen.getItem(CLAVE_CONSENTIMIENTOS) || '{}');
    return todo && typeof todo === 'object' ? todo : {};
  } catch { return {}; }
}

const idDeCuenta = (correo) => String(correo || '').trim().toLowerCase();

/** Estado de los consentimientos de una cuenta. Lo opcional, si nadie lo ha
 *  tocado, está apagado: el silencio nunca cuenta como un sí. */
export function leeConsentimientos(almacen, correo) {
  const propios = leeTodoConsentimiento(almacen)[idDeCuenta(correo)] || {};
  const salida = {};
  for (const c of CONSENTIMIENTOS) {
    salida[c.clave] = c.necesario
      ? { activo: true, necesario: true }
      : {
        activo: Boolean(propios[c.clave]?.activo),
        fecha: propios[c.clave]?.fecha || null,
      };
  }
  return salida;
}

/* ── Derechos sobre tus datos (paso 34, RGPD) ──
 *  Los cuatro derechos operativos desde el primer usuario, en autoservicio:
 *  acceso (ver todo), portabilidad (descargar en un formato legible por
 *  máquina), rectificación (contraseña al momento; correo por enlace de
 *  verificación; carteras y permisos, donde están) y supresión (borrar la
 *  cuenta y todo lo suyo, sin pedir nada a nadie). */

export const NOTA_DERECHOS = 'Tus derechos sobre estos datos — acceso, '
  + 'rectificación, supresión y portabilidad— se ejercen aquí mismo, al '
  + 'momento y sin pedirlo a nadie: ver todo lo que guardamos, descargarlo, '
  + 'corregirlo o borrarlo del todo.';

/**
 * Todo lo que el servicio guarda de una cuenta, en un objeto legible por
 * máquina (portabilidad) y por personas (acceso). Solo hechos: lo que hay,
 * de dónde sale y cuándo se generó.
 */
export function datosParaPortabilidad({ correo, carteras = [], consentimientos = {}, suscripcionActiva = false, generado = null } = {}) {
  return {
    formato: 'nuvia-datos-personales',
    version: 1,
    generado,
    cuenta: { correo: idDeCuenta(correo) },
    carteras: (carteras || []).map((c) => ({
      portfolio_id: c.portfolio_id,
      nombre: c.name || '',
      base_currency: c.base_currency || 'EUR',
      actualizada: c.updated_at || null,
      posiciones: (c.positions || []).map((p) => ({
        asset_id: p.asset_id,
        weight_percent: p.weight_percent,
      })),
    })),
    consentimientos: CONSENTIMIENTOS.map((def) => ({
      clave: def.clave,
      nombre: def.nombre,
      necesario: Boolean(def.necesario),
      activo: Boolean(consentimientos[def.clave]?.activo),
      fecha: consentimientos[def.clave]?.fecha || null,
    })),
    suscripcion: { activa: Boolean(suscripcionActiva) },
  };
}

/** Supresión del rastro local de una cuenta: sus consentimientos y su
 *  marcador de suscripción. Lo de otras cuentas del mismo navegador queda. */
export function borraRastroLocal(almacen, correo) {
  if (!almacen) return;
  const id = idDeCuenta(correo);
  const todo = leeTodoConsentimiento(almacen);
  if (id in todo) {
    delete todo[id];
    try { almacen.setItem(CLAVE_CONSENTIMIENTOS, JSON.stringify(todo)); } catch { /* sin persistencia */ }
  }
  try {
    const susc = JSON.parse(almacen.getItem(CLAVE_SUSCRIPCION) || 'null');
    if (susc && typeof susc === 'object' && id in susc) {
      delete susc[id];
      almacen.setItem(CLAVE_SUSCRIPCION, JSON.stringify(susc));
    }
  } catch { /* marcador ilegible: nada que borrar */ }
}

/** Enciende o apaga un consentimiento opcional, con la fecha de la decisión.
 *  Lo necesario no se toca desde aquí: no es una elección. */
export function cambiaConsentimiento(almacen, correo, clave, activo, ahora = () => new Date().toISOString()) {
  const definicion = CONSENTIMIENTOS.find((c) => c.clave === clave);
  if (!definicion) return { motivo: 'desconocido' };
  if (definicion.necesario) return { motivo: 'necesario' };
  const todo = leeTodoConsentimiento(almacen);
  const id = idDeCuenta(correo);
  const decision = { activo: Boolean(activo), fecha: ahora() };
  todo[id] = { ...(todo[id] || {}), [clave]: decision };
  try { almacen.setItem(CLAVE_CONSENTIMIENTOS, JSON.stringify(todo)); } catch { /* sin persistencia */ }
  return decision;
}

function el(tag, attrs = {}, texto) {
  const nodo = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) nodo.setAttribute(k, v);
  if (texto != null) nodo.textContent = texto;
  return nodo;
}

export function montaCuenta(raiz, { cliente = null, almacen = null } = {}) {
  if (!raiz) return null;
  const datos = cliente || maestra();
  const memoria = almacen || (typeof localStorage !== 'undefined' ? localStorage : null);

  raiz.textContent = '';

  const estado = el('p', { id: 'cuenta-estado', class: 'nv-cuenta__estado', role: 'status' });
  const cuerpo = el('div', { class: 'nv-cuenta__cuerpo' });
  raiz.append(cuerpo, estado);

  let ocupado = false;

  function avisa(texto) { estado.textContent = texto || ''; }

  /** Avisa al resto del laboratorio (p. ej. al constructor) de que la sesión
   *  ha cambiado, para que muestre el guardado que toca (paso 30). */
  function avisaSesionCambiada() {
    try {
      document.dispatchEvent(new CustomEvent('nuvia:sesion-cambiada', { bubbles: true }));
    } catch { /* entorno sin CustomEvent: no pasa nada */ }
  }

  async function protege(boton, accion) {
    if (ocupado) return;
    ocupado = true;
    const textoOriginal = boton.textContent;
    boton.disabled = true;
    boton.textContent = 'Un momento…';
    try {
      await accion();
    } catch (e) {
      avisa(e?.message || 'No se ha podido completar la operación.');
    } finally {
      ocupado = false;
      boton.disabled = false;
      boton.textContent = textoOriginal;
    }
  }

  /** Fila de un consentimiento: casilla (si es opcional), nombre y porqué. */
  function filaConsentimiento(definicion, estado, correo) {
    const fila = el('div', { class: 'nv-cuenta__permiso' });
    const linea = el('label', { class: 'nv-cuenta__permiso-linea', for: `permiso-${definicion.clave}` });
    let casilla = null;
    if (definicion.necesario) {
      linea.append(el('span', { class: 'nv-cuenta__permiso-nombre' }, definicion.nombre));
      linea.append(el('span', { class: 'nv-tag' }, 'Necesario'));
    } else {
      casilla = el('input', { type: 'checkbox', id: `permiso-${definicion.clave}` });
      casilla.checked = Boolean(estado?.activo);
      linea.append(casilla);
      linea.append(el('span', { class: 'nv-cuenta__permiso-nombre' }, definicion.nombre));
      linea.append(el('span', { class: 'nv-tag' }, 'Opcional'));
      if (correo != null) {
        casilla.addEventListener('change', () => {
          cambiaConsentimiento(memoria, correo, definicion.clave, casilla.checked);
          avisa(casilla.checked
            ? `Activado: ${definicion.nombre.toLowerCase()}. Puedes apagarlo aquí cuando quieras.`
            : `Desactivado: ${definicion.nombre.toLowerCase()}. Apuntado con su fecha.`);
        });
      }
    }
    fila.append(linea, el('p', { class: 'nv-cuenta__permiso-explica' }, definicion.explica));
    return { fila, casilla };
  }

  function pintaConectado(sesion) {
    cuerpo.textContent = '';
    avisa('');

    const quien = el('p', { class: 'nv-cuenta__quien' });
    quien.append('Sesión iniciada como ');
    quien.append(el('strong', {}, sesion.correo || 'tu cuenta'));
    quien.append('.');

    const nota = el('p', { class: 'nv-cuenta__nota' }, NOTA_QUE_APORTA);

    const permisos = el('div', { class: 'nv-cuenta__permisos' });
    permisos.append(el('h3', {}, 'Tus permisos'));
    permisos.append(el('p', { class: 'nv-cuenta__nota' },
      'Lo opcional se decide aquí, casilla a casilla, y se puede cambiar '
      + 'cuando quieras: se aplica al momento y cada decisión queda apuntada '
      + 'con su fecha. Se guarda en este navegador, bajo tu correo.'));
    const estado29 = leeConsentimientos(memoria, sesion.correo);
    for (const definicion of CONSENTIMIENTOS) {
      permisos.append(filaConsentimiento(definicion, estado29[definicion.clave], sesion.correo).fila);
    }

    const salir = el('button', { type: 'button', class: 'nv-btn nv-btn--soft' }, 'Cerrar sesión');
    salir.addEventListener('click', () => {
      const s = datos.cierraSesion();
      pintaDesconectado();
      avisa('Sesión cerrada en este navegador.');
      avisaSesionCambiada();
      void s;
    });

    cuerpo.append(quien, nota, permisos, seccionDerechos(sesion), salir);
  }

  /* ── «Tus datos y tus derechos» (paso 34, RGPD) ── */

  async function recogeTodo(sesion) {
    const carteras = await datos.listaCarterasNube();
    return datosParaPortabilidad({
      correo: sesion.correo,
      carteras,
      consentimientos: leeConsentimientos(memoria, sesion.correo),
      suscripcionActiva: leeSuscripcion(memoria, sesion.correo),
      generado: new Date().toISOString(),
    });
  }

  function pintaAcceso(panel, d) {
    panel.textContent = '';
    const lista = el('ul', { class: 'nv-cuenta__acceso-lista' });
    lista.append(el('li', {}, `Correo de la cuenta: ${d.cuenta.correo}.`));
    if (d.carteras.length) {
      for (const c of d.carteras) {
        lista.append(el('li', {},
          `Cartera «${c.nombre || 'sin nombre'}»: ${c.posiciones.length} posición(es) — `
          + c.posiciones.map((p) => `${p.asset_id} ${Number(p.weight_percent).toFixed(1)} %`).join(', ') + '.'));
      }
    } else {
      lista.append(el('li', {}, 'Carteras guardadas en tu cuenta: ninguna.'));
    }
    for (const c of d.consentimientos) {
      lista.append(el('li', {},
        `Permiso «${c.nombre}»: ${c.necesario ? 'necesario para el servicio' : (c.activo ? 'encendido' : 'apagado')}`
        + `${c.fecha ? `, decidido el ${c.fecha.slice(0, 10)}` : ''}.`));
    }
    lista.append(el('li', {}, `Suscripción: ${d.suscripcion.activa ? 'activa' : 'no hay'}.`));
    lista.append(el('li', {}, 'Nada más: ni teléfono, ni patrimonio, ni perfil.'));
    panel.append(lista);
  }

  function seccionDerechos(sesion) {
    const bloque = el('div', { class: 'nv-cuenta__derechos' });
    bloque.append(el('h3', {}, 'Tus datos y tus derechos'));
    bloque.append(el('p', { class: 'nv-cuenta__nota' }, NOTA_DERECHOS));

    /* Acceso y portabilidad. */
    const filaVer = el('div', { class: 'nv-cuenta__derechos-fila' });
    const verBtn = el('button', { type: 'button', class: 'nv-btn nv-btn--soft' }, 'Ver todo lo que guardamos');
    const bajarBtn = el('button', { type: 'button', class: 'nv-btn nv-btn--soft' }, 'Descargar mis datos (JSON)');
    const panel = el('div', { class: 'nv-cuenta__acceso', hidden: '' });
    verBtn.addEventListener('click', () => protege(verBtn, async () => {
      pintaAcceso(panel, await recogeTodo(sesion));
      panel.hidden = false;
      avisa('');
    }));
    bajarBtn.addEventListener('click', () => protege(bajarBtn, async () => {
      const d = await recogeTodo(sesion);
      const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
      const enlace = el('a', { href: URL.createObjectURL(blob), download: `nuvia-datos-${d.cuenta.correo}.json` });
      document.body.append(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(enlace.href), 60_000);
      avisa('Descarga preparada: un fichero JSON con todo lo que guardamos.');
    }));
    filaVer.append(verBtn, bajarBtn);
    bloque.append(filaVer, panel);

    /* Rectificación: contraseña al momento; correo por enlace verificado. */
    const rect = el('div', { class: 'nv-cuenta__rectifica' });
    const campoClave = el('div', { class: 'nv-field nv-cuenta__campo' });
    campoClave.append(el('label', { for: 'derechos-contrasena' }, 'Contraseña nueva (mínimo 6 caracteres)'));
    const cajaClave = el('div', { class: 'nv-field__box' });
    const claveNueva = el('input', { id: 'derechos-contrasena', type: 'password', autocomplete: 'new-password' });
    cajaClave.append(claveNueva);
    campoClave.append(cajaClave);
    const cambiaClaveBtn = el('button', { type: 'button', class: 'nv-btn nv-btn--soft' }, 'Cambiar la contraseña');
    cambiaClaveBtn.addEventListener('click', () => protege(cambiaClaveBtn, async () => {
      await datos.cambiaContrasena(claveNueva.value);
      claveNueva.value = '';
      avisa('Contraseña cambiada al momento.');
    }));

    const campoCorreo = el('div', { class: 'nv-field nv-cuenta__campo' });
    campoCorreo.append(el('label', { for: 'derechos-correo' }, 'Correo nuevo'));
    const cajaCorreo = el('div', { class: 'nv-field__box' });
    const correoNuevo = el('input', { id: 'derechos-correo', type: 'email', autocomplete: 'email', spellcheck: 'false' });
    cajaCorreo.append(correoNuevo);
    campoCorreo.append(cajaCorreo);
    const cambiaCorreoBtn = el('button', { type: 'button', class: 'nv-btn nv-btn--soft' }, 'Cambiar el correo');
    cambiaCorreoBtn.addEventListener('click', () => protege(cambiaCorreoBtn, async () => {
      await datos.pideCambioCorreo(correoNuevo.value);
      avisa('Enviado un enlace de verificación al correo nuevo: el cambio se completa al confirmarlo, sin pedir nada a nadie.');
    }));

    rect.append(campoClave, cambiaClaveBtn, campoCorreo, cambiaCorreoBtn);
    rect.append(el('p', { class: 'nv-cuenta__nota' },
      'Las carteras se rectifican abriéndolas y volviéndolas a guardar; los permisos, con sus casillas de arriba.'));
    bloque.append(rect);

    /* Supresión: dos pasos, en la misma página, sin diálogos del navegador. */
    const borrarBtn = el('button', { type: 'button', class: 'nv-btn nv-btn--soft nv-cuenta__borrar' },
      'Borrar mi cuenta y todos mis datos');
    const confirmacion = el('div', { class: 'nv-cuenta__confirma-borrado', hidden: '' });
    confirmacion.append(el('p', {},
      'Se borrarán la cuenta, todas las carteras guardadas en ella y el rastro '
      + 'local de este navegador (permisos y marcador de suscripción). No hay '
      + 'papelera: borrado es borrado.'));
    const definitivoBtn = el('button', { type: 'button', class: 'nv-btn nv-cuenta__borrar-definitivo' }, 'Sí, borrar definitivamente');
    const conservarBtn = el('button', { type: 'button', class: 'nv-btn nv-btn--soft' }, 'No, conservar la cuenta');
    confirmacion.append(definitivoBtn, conservarBtn);
    borrarBtn.addEventListener('click', () => { confirmacion.hidden = false; });
    conservarBtn.addEventListener('click', () => { confirmacion.hidden = true; avisa(''); });
    definitivoBtn.addEventListener('click', () => protege(definitivoBtn, async () => {
      const carteras = await datos.listaCarterasNube();
      for (const c of carteras) {
        await datos.borraCarteraNube(c.portfolio_id);
      }
      borraRastroLocal(memoria, sesion.correo);
      await datos.borraCuenta();
      pintaDesconectado();
      avisa(`Hecho: cuenta borrada con sus ${carteras.length} cartera(s) y el rastro local. Nada queda.`);
      avisaSesionCambiada();
    }));
    bloque.append(borrarBtn, confirmacion);

    return bloque;
  }

  function pintaDesconectado() {
    cuerpo.textContent = '';
    avisa('');

    const minimos = el('p', { class: 'nv-cuenta__minimos' }, NOTA_DATOS_MINIMOS);
    const aporta = el('p', { class: 'nv-cuenta__nota' }, NOTA_QUE_APORTA);

    const forma = el('form', { class: 'nv-cuenta__forma', novalidate: '' });

    const campoCorreo = el('div', { class: 'nv-field nv-cuenta__campo' });
    campoCorreo.append(el('label', { for: 'cuenta-correo' }, 'Correo'));
    const cajaCorreo = el('div', { class: 'nv-field__box' });
    const correo = el('input', {
      id: 'cuenta-correo', type: 'email', autocomplete: 'email',
      spellcheck: 'false', placeholder: 'tucorreo@ejemplo.com',
    });
    cajaCorreo.append(correo);
    campoCorreo.append(cajaCorreo);

    const campoClave = el('div', { class: 'nv-field nv-cuenta__campo' });
    campoClave.append(el('label', { for: 'cuenta-contrasena' }, 'Contraseña (mínimo 6 caracteres)'));
    const cajaClave = el('div', { class: 'nv-field__box' });
    const clave = el('input', {
      id: 'cuenta-contrasena', type: 'password', autocomplete: 'current-password',
    });
    cajaClave.append(clave);
    campoClave.append(cajaClave);

    /* Consentimiento granular en el alta (paso 29): lo necesario se explica
       sin casilla; lo opcional arranca apagado y nadie lo premarca. */
    const permisos = el('fieldset', { class: 'nv-cuenta__permisos nv-cuenta__permisos--alta' });
    permisos.append(el('legend', {}, 'Al crear la cuenta'));
    const casillas = new Map();
    for (const definicion of CONSENTIMIENTOS) {
      const { fila, casilla } = filaConsentimiento(definicion, { activo: false }, null);
      permisos.append(fila);
      if (casilla) casillas.set(definicion.clave, casilla);
    }

    const botones = el('div', { class: 'nv-cuenta__botones' });
    const crear = el('button', { type: 'submit', class: 'nv-btn' }, 'Crear cuenta');
    const entrar = el('button', { type: 'button', class: 'nv-btn nv-btn--soft' }, 'Iniciar sesión');
    const olvido = el('button', { type: 'button', class: 'nv-cuenta__olvido' },
      'He olvidado la contraseña');
    botones.append(crear, entrar);

    forma.append(campoCorreo, campoClave, permisos, botones, olvido);

    forma.addEventListener('submit', (evento) => {
      evento.preventDefault();
      protege(crear, async () => {
        const s = await datos.creaCuenta(correo.value, clave.value);
        for (const [clave29, casilla] of casillas) {
          cambiaConsentimiento(memoria, s.correo, clave29, casilla.checked);
        }
        pintaConectado(s);
        avisa('Cuenta creada. Sesión iniciada en este navegador.');
        avisaSesionCambiada();
      });
    });

    entrar.addEventListener('click', () => {
      protege(entrar, async () => {
        const s = await datos.iniciaSesion(correo.value, clave.value);
        pintaConectado(s);
        avisa('Sesión iniciada.');
        avisaSesionCambiada();
      });
    });

    olvido.addEventListener('click', () => {
      protege(olvido, async () => {
        if (!correo.value.trim()) {
          avisa('Escribe tu correo arriba y vuelve a pulsar para recibir el enlace.');
          return;
        }
        await datos.recuperaContrasena(correo.value);
        avisa('Si ese correo tiene cuenta, recibirá un enlace para cambiar la contraseña.');
      });
    });

    cuerpo.append(minimos, aporta, forma);
  }

  const sesion = datos.sesionActual();
  if (sesion.tipo === 'registrada') pintaConectado(sesion);
  else pintaDesconectado();

  return { raiz };
}
