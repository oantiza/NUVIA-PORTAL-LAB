/**
 * Batería de las etiquetas y escalas de los gráficos (Fase 7).
 *
 * Sin red ni DOM: los sectores y regiones de la base salen en castellano y
 * una clave desconocida se enseña aseada en vez de esconderse; los nombres
 * largos se acortan por palabra entera; las marcas de eje son redondas y
 * cubren el dato; y la separación de etiquetas nunca deja dos pisándose.
 *
 *   node docs/nuvia-etiquetas.test.mjs
 */
import {
  SECTORES_ES, REGIONES_ES, etiquetaSector, etiquetaRegion,
  nombreCorto, marcasEje, separaVerticalmente,
} from '../js/nuvia-etiquetas.js';

let fallos = 0;
function comprueba(nombre, condicion, detalle = '') {
  const ok = Boolean(condicion);
  console.log(`${ok ? 'OK  ' : 'FALLO'} ${nombre}${detalle ? '  · ' + detalle : ''}`);
  if (!ok) fallos += 1;
}

console.log('— Sectores y regiones en castellano (bases §4: cero jerga sin traducir) —');
comprueba('financial_services → Servicios financieros', etiquetaSector('financial_services') === 'Servicios financieros');
comprueba('Da igual mayúsculas o minúsculas', etiquetaSector('Technology') === 'Tecnología');
comprueba('Sector desconocido → aseado, nunca escondido', etiquetaSector('space_mining') === 'Space mining');
comprueba('eurozone → Zona euro', etiquetaRegion('eurozone') === 'Zona euro');
comprueba('iberia → España y Portugal', etiquetaRegion('iberia') === 'España y Portugal');
comprueba('europe_emerging y emerging_europe dicen lo mismo',
  etiquetaRegion('europe_emerging') === 'Europa emergente' && etiquetaRegion('emerging_europe') === 'Europa emergente');
comprueba('other → Otras regiones (declarado, no inventado)', etiquetaRegion('other') === 'Otras regiones');
comprueba('Clave vacía → «—»', etiquetaRegion('') === '—' && etiquetaSector(null) === '—');
comprueba('Ninguna traducción aconseja ni personaliza',
  ![...Object.values(SECTORES_ES), ...Object.values(REGIONES_ES)]
    .some((t) => /mejor|recomend|óptim|conviene|deberías|ideal para|para ti/i.test(t)));

console.log('\n— Nombres cortos —');
comprueba('Un nombre corto pasa tal cual', nombreCorto('Iberdrola S.A.') === 'Iberdrola S.A.');
{
  const corto = nombreCorto('JPMorgan Funds - Europe Strategic Value Fund A (acc) EUR', 28);
  comprueba('El largo se corta con puntos suspensivos y sin pasarse',
    corto.endsWith('…') && corto.length <= 29, corto);
  comprueba('No termina en guion ni espacio antes de los puntos', !/[\s\-·,]…$/.test(corto), corto);
}
comprueba('Nulo → cadena vacía', nombreCorto(null) === '');

console.log('\n— Marcas de eje redondas —');
{
  const eje = marcasEje(0.042, 0.172, 6);
  comprueba('El dominio se amplía a marcas redondas que cubren el dato',
    eje.min <= 0.042 && eje.max >= 0.172 && eje.marcas.length >= 3);
  const mantisa = eje.paso / 10 ** Math.floor(Math.log10(eje.paso));
  comprueba('El paso es redondo (1, 2 o 5 por potencia de diez)',
    [1, 2, 5].some((b) => Math.abs(mantisa - b) < 1e-9), String(eje.paso));
  comprueba('Las marcas van del borde al borde sin salirse',
    Math.abs(eje.marcas[0] - eje.min) < 1e-9 && Math.abs(eje.marcas[eje.marcas.length - 1] - eje.max) < 1e-9);
  comprueba('Un dominio plano no revienta', marcasEje(5, 5).marcas.length >= 2);
  comprueba('Sin dato no hay eje', marcasEje(NaN, 3) === null);
}

console.log('\n— Separación de etiquetas —');
{
  const sep = separaVerticalmente([100, 104, 106, 300], 20, 20, 380);
  comprueba('Ningún par queda a menos de la distancia mínima',
    [...sep].sort((a, b) => a - b).every((v, i, a) => i === 0 || v - a[i - 1] >= 20 - 1e-9), sep.join(', '));
  comprueba('La etiqueta aislada no se mueve', Math.abs(sep[3] - 300) < 1e-9);
  comprueba('Se conserva el orden de entrada', sep[0] < sep[1] && sep[1] < sep[2]);
  const arriba = separaVerticalmente([25, 26], 20, 20, 380);
  comprueba('El borde superior se respeta', arriba.every((v) => v >= 20 - 1e-9));
}

if (fallos) {
  console.error(`\n${fallos} comprobación(es) en rojo.`);
  process.exit(1);
}
console.log('\nTodo en verde: etiquetas y escalas de los gráficos (Fase 7).');
