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
 */

import { maestra } from './nuvia-datos.js';

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
      + 'con su fecha. De momento se guarda en este navegador; pasará a tu '
      + 'cuenta en la nube con la persistencia de los próximos pasos.'));
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

    cuerpo.append(quien, nota, permisos, salir);
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
