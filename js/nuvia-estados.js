/** Estado editorial, no disponibilidad de mercado ni autorización de funciones. */
export function destinoPendiente(_url) {
  // Bienestar y Planificación están disponibles por decisión del fundador.
  // Fundamentales ya carga la copia local alfa; technical y fundamental son
  // alias de companies, no módulos independientes pendientes. No hay destinos
  // editoriales pendientes en este conjunto; esto no acredita cobertura de datos.
  return false;
}
export function senalaDestinosPendientes(root, base = location.href) {
  const origen = new URL(base);
  root.querySelectorAll('a[href]').forEach((a) => {
    const destino = new URL(a.getAttribute('href'), base);
    if (destino.origin !== origen.origin) return;
    if (!destinoPendiente(destino)) {
      a.querySelector('.nv-link-pending')?.remove();
      return;
    }
    if (!a.querySelector('.nv-link-pending')) {
      const estado = root.ownerDocument.createElement('small');
      estado.className = 'nv-link-pending'; estado.textContent = ' · En preparación'; a.append(estado);
    }
  });
}

export function sincronizaAtajos(root) {
  root.querySelectorAll('a[data-result-anchor]').forEach((a) => {
    const target = root.ownerDocument.getElementById(a.getAttribute('href').slice(1));
    const pendiente = !target || !!target.closest('.nv-result-blocked');
    if (pendiente) {
      a.setAttribute('aria-disabled', 'true');
      if (!a.querySelector('.nv-link-wait')) {
        const estado = root.ownerDocument.createElement('small');
        estado.className = 'nv-link-wait'; estado.textContent = ' · Tras calcular'; a.append(estado);
      }
    } else {
      a.removeAttribute('aria-disabled');
      a.querySelector('.nv-link-wait')?.remove();
    }
  });
}
