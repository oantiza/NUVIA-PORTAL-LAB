/**
 * NUVIA — cuenta con datos mínimos (paso 28, Fase 4).
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
 * Lenguaje: describe, nunca prescribe. Registrarse es una opción que se
 * explica; no se empuja a nadie a hacerlo.
 */

import { maestra } from './nuvia-datos.js';

export const NOTA_DATOS_MINIMOS = 'Solo pedimos correo y contraseña. '
  + 'Sin teléfono, sin datos de patrimonio y sin preguntas sobre tu manera de '
  + 'invertir: esta página describe métricas y no necesita saber nada de ti '
  + 'para hacerlo.';

export const NOTA_QUE_APORTA = 'La cuenta gratuita irá sumando, en los '
  + 'próximos pasos de esta fase, guardado de carteras en la nube y análisis '
  + 'más amplio. De momento, iniciar sesión no cambia lo que ves en la '
  + 'página: solo deja la cuenta preparada, y se dice tal cual.';

function el(tag, attrs = {}, texto) {
  const nodo = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) nodo.setAttribute(k, v);
  if (texto != null) nodo.textContent = texto;
  return nodo;
}

export function montaCuenta(raiz, { cliente = null } = {}) {
  if (!raiz) return null;
  const datos = cliente || maestra();

  raiz.textContent = '';

  const estado = el('p', { id: 'cuenta-estado', class: 'nv-cuenta__estado', role: 'status' });
  const cuerpo = el('div', { class: 'nv-cuenta__cuerpo' });
  raiz.append(cuerpo, estado);

  let ocupado = false;

  function avisa(texto) { estado.textContent = texto || ''; }

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

  function pintaConectado(sesion) {
    cuerpo.textContent = '';
    avisa('');

    const quien = el('p', { class: 'nv-cuenta__quien' });
    quien.append('Sesión iniciada como ');
    quien.append(el('strong', {}, sesion.correo || 'tu cuenta'));
    quien.append('.');

    const nota = el('p', { class: 'nv-cuenta__nota' }, NOTA_QUE_APORTA);

    const salir = el('button', { type: 'button', class: 'nv-btn nv-btn--soft' }, 'Cerrar sesión');
    salir.addEventListener('click', () => {
      const s = datos.cierraSesion();
      pintaDesconectado();
      avisa('Sesión cerrada en este navegador.');
      void s;
    });

    cuerpo.append(quien, nota, salir);
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

    const botones = el('div', { class: 'nv-cuenta__botones' });
    const crear = el('button', { type: 'submit', class: 'nv-btn' }, 'Crear cuenta');
    const entrar = el('button', { type: 'button', class: 'nv-btn nv-btn--soft' }, 'Iniciar sesión');
    const olvido = el('button', { type: 'button', class: 'nv-cuenta__olvido' },
      'He olvidado la contraseña');
    botones.append(crear, entrar);

    forma.append(campoCorreo, campoClave, botones, olvido);

    forma.addEventListener('submit', (evento) => {
      evento.preventDefault();
      protege(crear, async () => {
        const s = await datos.creaCuenta(correo.value, clave.value);
        pintaConectado(s);
        avisa('Cuenta creada. Sesión iniciada en este navegador.');
      });
    });

    entrar.addEventListener('click', () => {
      protege(entrar, async () => {
        const s = await datos.iniciaSesion(correo.value, clave.value);
        pintaConectado(s);
        avisa('Sesión iniciada.');
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
