/** Persistencia local comprobada. No usa red, no migra ni repara datos a ciegas. */
export const CLAVE_GUARDADO_LOCAL = 'nuvia.carteras-visitante.v1';

function formatoValido(lista) {
  return Array.isArray(lista) && lista.every((c) => c && typeof c.nombre === 'string' && c.nombre.trim()
    && Array.isArray(c.posiciones) && c.posiciones.length > 0
    && c.posiciones.every((p) => p && typeof p.activo?.asset_id === 'string' && p.activo.asset_id.trim()
      && typeof p.bruto === 'number' && Number.isFinite(p.bruto) && p.bruto >= 0));
}
const fallo = (motivo) => ({ ok: false, motivo });

/** obtenerStorage es inyectable para pruebas; el acceso puede lanzar por permisos. */
export function creaGuardadoLocal(obtenerStorage = () => localStorage) {
  function lee() {
    let crudo;
    try { crudo = obtenerStorage().getItem(CLAVE_GUARDADO_LOCAL); }
    catch { return fallo('acceso'); }
    if (crudo === null) return { ok: true, lista: [], crudo };
    try {
      const lista = JSON.parse(crudo);
      return formatoValido(lista) ? { ok: true, lista, crudo } : fallo('formato');
    } catch { return fallo('formato'); }
  }
  function comprueba(esperado) {
    const actual = lee();
    if (!actual.ok) return actual;
    return esperado?.ok && actual.crudo === esperado.crudo ? actual : fallo('cambio');
  }
  function escribe(lista, esperado) {
    const actual = comprueba(esperado);
    if (!actual.ok) return actual;
    if (!formatoValido(lista)) return fallo('formato');
    let crudo;
    try { crudo = JSON.stringify(lista); obtenerStorage().setItem(CLAVE_GUARDADO_LOCAL, crudo); }
    catch { return fallo('escritura'); }
    const comprobacion = lee();
    // No se restaura una versión previa: podría pisar una escritura de otra pestaña.
    if (!comprobacion.ok || comprobacion.crudo !== crudo) return fallo('sin-confirmar');
    return comprobacion;
  }
  return { lee, comprueba, escribe };
}

export function mensajeGuardadoLocal(motivo, accion = 'guardar') {
  if (motivo === 'acceso') return 'No se puede acceder a las carteras de este navegador. Revisa los permisos del navegador y vuelve a comprobar. No se ha realizado ningún cambio.';
  if (motivo === 'formato') return 'Las carteras guardadas no se pueden interpretar. No se han sobrescrito ni borrado. No borres los datos de navegación; conserva una copia antes de intentar recuperarlos.';
  if (motivo === 'cambio') return 'Las carteras guardadas han cambiado, posiblemente en otra pestaña. Revisa la lista actualizada y repite la acción. Esta operación no se ha aplicado.';
  if (motivo === 'sin-confirmar') return 'No se ha podido confirmar el resultado de la operación. Vuelve a comprobar las carteras guardadas antes de repetirla.';
  return `No se ha podido ${accion} en este navegador. Puede faltar espacio o permiso. No se ha confirmado ningún cambio; puedes volver a intentarlo.`;
}
