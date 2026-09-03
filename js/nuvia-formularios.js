/** Controles de entrada locales. No cambia fórmulas ni consulta servicios. */
export const RUTAS_FORMULARIOS = ['vivienda.html', 'jubilacion.html', 'academia.html', 'curso.html', 'guia-ahorro.html', 'guia-sucesiones.html', 'cartera.html'];
const ANIOS = /^(age|targetAge|years|fixedYears|comparisonYears|repaymentYears|seniorityYears|epsvRentYears|heirsCount)$/;
const NEGATIVOS = /^(expectedReturn|inflationRate|homeAppreciation|rentGrowth|investmentReturn)$/;
const PORCENTAJES = /Rate$|Percent$|Pct$|^(spread|annualIncrease|homeAppreciation|rentGrowth|investmentReturn|expectedReturn|incomeGrowth|repaymentFee|tae)$/;
export function reglaNumerica({ name = '', id = '', min = '', max = '' } = {}) {
  const campo = name.split('|').pop();
  return {
    opcional: /(?:^|-)importe-cartera$/.test(id),
    min: min !== '' ? Number(min) : NEGATIVOS.test(campo) ? -99.99 : campo === 'annualIncrease' ? -100 : 0,
    max: max !== '' ? Number(max) : PORCENTAJES.test(campo) ? 100 : 1e12,
    entero: ANIOS.test(campo),
    positivo: /^(purchasePrice|annualHouseholdIncome|repaymentBalance)$/.test(campo),
  };
}
export function errorNumerico(valor, regla, badInput = false) {
  if (badInput) return 'Introduce un número válido.';
  if (String(valor).trim() === '') return regla.opcional ? '' : 'Completa este campo. Si no hay importe, escribe 0.';
  const n = Number(valor);
  if (!Number.isFinite(n)) return 'Introduce un número finito.';
  if (regla.positivo && n <= 0) return 'Introduce un valor mayor que 0.';
  if (n < regla.min) return `El mínimo admitido es ${regla.min}.`;
  if (n > regla.max) return `El máximo admitido es ${regla.max}.`;
  if (regla.entero && !Number.isInteger(n)) return 'Introduce un número entero.';
  return '';
}
export function erroresRelacion(valores) {
  const errores = {};
  const compara = (campo, limite, mensaje, estricto = false) => {
    if (Number.isFinite(valores[campo]) && Number.isFinite(valores[limite])
      && (estricto ? valores[campo] <= valores[limite] : valores[campo] > valores[limite])) errores[campo] = mensaje;
  };
  compara('downPayment', 'purchasePrice', 'La entrada no puede superar el precio de la vivienda.');
  compara('fixedYears', 'years', 'El tramo fijo no puede superar el plazo total.');
  compara('repaymentAmount', 'repaymentBalance', 'La amortización no puede superar el capital pendiente.');
  compara('targetAge', 'age', 'La edad objetivo debe ser superior a la edad actual.', true);
  compara('epsvPreReturn', 'epsvPre', 'El rendimiento no puede superar el saldo de este bloque.');
  compara('epsvPostReturn', 'epsvPost', 'El rendimiento no puede superar el saldo de este bloque.');
  for (const nombre of Object.keys(valores).filter((n) => n.endsWith('|fixedYears'))) {
    if (['Fija', 'Variable'].includes(valores[nombre.replace('|fixedYears', '|kind')])) continue;
    compara(nombre, nombre.replace('|fixedYears', '|years'), 'El tramo fijo no puede superar el plazo total.');
  }
  return errores;
}

const RESULTADOS = {
  'vivienda.html': '.viv-card__aside, .viv-table, .viv-offer__result, .viv-offer__badge, .viv-offer__chips',
  'jubilacion.html': '#resultados',
  'academia.html': '.ac-x209 > .gu-stack',
  'curso.html': '.curso-tool > .curso-panel[aria-live]',
  'guia-ahorro.html': '.gt-resultado',
  'guia-sucesiones.html': '.gt-diag__salida',
  'cartera.html': '#constructor .nv-cons__resultados, #analisis-dinamico, #modelo-motor .nv-cons__resultados, #modelo-analisis-dinamico',
};

export function instalaFormularios(doc = document, ruta = location.pathname.split('/').pop()) {
  if (!RUTAS_FORMULARIOS.includes(ruta)) return { sincroniza() {} };
  let secuencia = 0;
  const tocados = new WeakSet();
  const errores = new Map();
  let aviso;
  const visible = (e) => e.getClientRects().length > 0 && !e.closest('[hidden]');
  const atributo = (e, k, v) => { if (e.getAttribute(k) !== v) e.setAttribute(k, v); };
  const texto = (e, v) => { if (e.textContent !== v) e.textContent = v; };
  function controles() { return [...doc.querySelectorAll('main input[type="number"], main input[type="range"]')].filter((c) => visible(c) && !c.getAttribute('defaultvalue')?.includes('{{') && (c.value !== '' || c.hasAttribute('value') || tocados.has(c))); }
  function basico(c) { return errorNumerico(c.value, reglaNumerica(c), c.validity?.badInput); }
  function etiqueta(c) {
    if (c.labels?.length || c.hasAttribute('aria-label') || c.hasAttribute('aria-labelledby')) return;
    let contenedor = c.parentElement;
    for (let i = 0; contenedor && i < 3; i++, contenedor = contenedor.parentElement) {
      if (contenedor.querySelectorAll('input,select,textarea').length !== 1) continue;
      const label = contenedor.querySelector('label');
      if (!label) continue;
      if (!c.id) c.id = `nv-calculo-campo-${++secuencia}`;
      label.htmlFor = c.id;
      return;
    }
  }
  function sincroniza() {
    const main = doc.querySelector('main');
    if (!main) return;
    main.querySelectorAll('input,select,textarea').forEach(etiqueta);
    const entradas = controles();
    const valores = Object.fromEntries(entradas.filter((c) => !basico(c)).map((c) => [c.name, Number(c.value)]));
    main.querySelectorAll('select[name$="|kind"]').forEach((c) => { valores[c.name] = c.value; });
    const relaciones = erroresRelacion(valores);
    for (const [c, e] of errores) if (!entradas.includes(c)) {
      atributo(c, 'aria-describedby', (c.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && id !== e.id).join(' '));
      e.remove(); c.removeAttribute('aria-invalid'); errores.delete(c);
    }
    for (const c of entradas) {
      const mensaje = basico(c) || relaciones[c.name] || '';
      let e = errores.get(c);
      if (!mensaje) {
        if (e) {
          atributo(c, 'aria-describedby', (c.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && id !== e.id).join(' '));
          e.remove(); errores.delete(c); c.removeAttribute('aria-invalid');
        }
        continue;
      }
      if (!e || !e.isConnected) {
        e = doc.createElement('p'); e.className = 'nv-form-error'; e.id = `nv-calculo-error-${++secuencia}`;
        const box = c.closest('.nv-field__box, .ac-search, .curso-campo__input') || c;
        const filaCartera = c.closest('.nv-cons__fila');
        if (filaCartera) filaCartera.append(e);
        else box.insertAdjacentElement('afterend', e);
        errores.set(c, e);
      }
      texto(e, mensaje); atributo(c, 'aria-invalid', 'true');
      const ids = new Set((c.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)); ids.add(e.id);
      atributo(c, 'aria-describedby', [...ids].join(' '));
    }
    const invalido = errores.size > 0;
    main.querySelectorAll(RESULTADOS[ruta]).forEach((e) => e.classList.toggle('nv-result-blocked', invalido));
    if (invalido) {
      if (!aviso?.isConnected) {
        aviso = doc.createElement('p'); aviso.className = 'nv-form-summary'; aviso.setAttribute('role', 'status');
        const primero = errores.keys().next().value;
        (primero.closest('section') || main).prepend(aviso);
      }
      texto(aviso, 'Revisa los campos señalados. Los resultados están ocultos hasta que todos los datos sean válidos.');
    } else if (aviso) { aviso.remove(); aviso = null; }
    return !invalido;
  }
  function entrada(event) {
    const c = event.target;
    if (!c.matches?.('main input[type="number"], main input[type="range"]')) return;
    tocados.add(c);
    if (basico(c)) event.stopImmediatePropagation();
    sincroniza();
  }
  doc.addEventListener('input', entrada, true);
  doc.addEventListener('change', entrada, true);
  doc.addEventListener('click', (event) => {
    const b = event.target.closest?.('main button');
    // Evita que un escenario incoherente quede escondido al cambiar de herramienta.
    if (!b || (!b.closest('.viv-tabs') && !/calcular|ver mi estimación|guardar|imprimir|descargar/i.test(b.textContent))) return;
    if (!sincroniza()) { event.preventDefault(); event.stopImmediatePropagation(); errores.keys().next().value?.focus(); }
  }, true);
  doc.addEventListener('submit', (event) => {
    if (!event.target.closest('main') || !event.target.querySelector('input[type="number"]')) return;
    // Estas herramientas calculan localmente; Enter no envía parámetros por URL.
    event.preventDefault();
    if (!sincroniza()) { event.stopImmediatePropagation(); errores.keys().next().value?.focus(); }
  }, true);
  return { sincroniza };
}
