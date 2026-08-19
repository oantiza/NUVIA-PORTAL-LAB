/**
 * Batería de las carteras modelo temáticas (paso 38).
 *
 * Sin red ni DOM: se valida que TODAS las modelo cumplen la misma regla
 * (criterio declarado con fecha, pesos a partes iguales que suman 100, sin
 * activos repetidos), que el formato casa con el motor del constructor, y
 * que ningún texto del bloque —nombres, temas, criterios, nota— aconseja
 * ni personaliza (prueba de la sección 5 de las bases).
 *
 *   node docs/nuvia-modelos.test.mjs
 */
import {
  CARTERAS_MODELO, NOTA_MODELOS, validaModelo, posicionesDeModelo,
} from '../js/nuvia-modelos.js';

let fallos = 0;
function comprueba(nombre, condicion, detalle = '') {
  const ok = Boolean(condicion);
  console.log(`${ok ? 'OK  ' : 'FALLO'} ${nombre}${detalle ? '  · ' + detalle : ''}`);
  if (!ok) fallos += 1;
}

console.log('— La regla única de todas las modelo —');
comprueba('Hay al menos tres carteras modelo publicadas', CARTERAS_MODELO.length >= 3);
for (const modelo of CARTERAS_MODELO) {
  const problemas = validaModelo(modelo);
  comprueba(`«${modelo.nombre}» cumple la regla (fecha, criterio, partes iguales, suma 100, sin repetidos)`,
    problemas.length === 0, problemas.join('; '));
}
comprueba('Las claves de las modelo son únicas',
  new Set(CARTERAS_MODELO.map((m) => m.clave)).size === CARTERAS_MODELO.length);

console.log('\n— La regla rota se detecta —');
{
  const rota = {
    nombre: 'X', tema: 'y', criterio: 'sin fecha',
    posiciones: [{ asset_id: 'A', peso: 60 }, { asset_id: 'A', peso: 30 }],
  };
  const problemas = validaModelo(rota);
  comprueba('Una modelo mal construida acumula sus problemas, uno a uno',
    problemas.includes('criterio sin fecha de fijación')
    && problemas.includes('menos de 3 posiciones')
    && problemas.some((p) => p.includes('suman 90'))
    && problemas.includes('los pesos no van a partes iguales')
    && problemas.includes('activos repetidos'));
}

console.log('\n— Formato para el motor del constructor —');
{
  const posiciones = posicionesDeModelo(CARTERAS_MODELO[0]);
  comprueba('posicionesDeModelo produce {activo:{asset_id, display_name}, bruto}',
    posiciones.length === CARTERAS_MODELO[0].posiciones.length
    && posiciones.every((p) => p.activo.asset_id && p.activo.display_name && Number.isFinite(p.bruto)));
  comprueba('Un modelo vacío no rompe', posicionesDeModelo(null).length === 0);
}

console.log('\n— Prueba de la sección 5 sobre todos los textos del bloque —');
{
  const contenido = CARTERAS_MODELO
    .flatMap((m) => [m.nombre, m.tema, m.criterio, ...m.posiciones.map((p) => p.nombre)]).join('\n');
  const todo = `${NOTA_MODELOS}\n${contenido}`;
  const prohibido = [
    /\bmejor(?:es)?\b/iu, /recomendad|recomendamos|recomiend[oae]|recomendable/iu,
    /óptim/iu, /\bconviene\b/iu, /\bdeberías?\b/iu, /ideal para/iu, /adecuad[oa]s? para/iu,
    /\bpara ti\b|\bpara usted\b/iu, /sugerimos/iu, /garantiz/iu,
    /\bcompra\b|\bvende\b|\bmantén\b/iu, /atractiv/iu, /oportunidad/iu,
    /equilibrad/iu, /prudente/iu, /perfil (?:conservador|moderado|agresivo)/iu,
  ];
  const cruces = prohibido.filter((rx) => rx.test(todo));
  comprueba('Ningún texto aconseja ni personaliza', cruces.length === 0, cruces.map(String).join(' '));
  /* La invitación a copiar o contratar se busca en el CONTENIDO de las
     modelo; la nota del bloque queda fuera porque su papel es justo negarla. */
  const invita = [/copiar|copia esta|añádela|contrátala|contratar/iu].filter((rx) => rx.test(contenido));
  comprueba('Ninguna modelo invita a copiarla ni a contratarla', invita.length === 0, invita.map(String).join(' '));
  comprueba('La nota dice qué NO hay: ni copiar ni enlace para contratarla',
    NOTA_MODELOS.includes('no hay botón') && NOTA_MODELOS.includes('ni enlace para contratarla'));
  comprueba('La nota declara la identidad y la fuente',
    NOTA_MODELOS.includes('la misma para cualquiera') && NOTA_MODELOS.includes('base de datos NUVIA'));
}

if (fallos) {
  console.error(`\n${fallos} comprobación(es) en rojo.`);
  process.exit(1);
}
console.log('\nTodo en verde: carteras modelo temáticas (paso 38).');
