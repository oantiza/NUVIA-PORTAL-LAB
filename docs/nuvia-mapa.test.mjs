/**
 * Batería del mapa de distribución geográfica (paso 42, Fase 6).
 *
 * Sin red ni DOM: la agregación por continentes es fiel a las filas de la
 * concentración, la región desconocida se declara en vez de perderse, la
 * escala de color tiene sus tramos, las siluetas del laboratorio clásico
 * están completas y ningún texto aconseja (bases §5).
 *
 *   node docs/nuvia-mapa.test.mjs
 */
import {
  REGIONES_CONTINENTE, ETIQUETAS_CONTINENTE, NOTA_MAPA,
  exposicionPorContinente, tramoDeColor,
} from '../js/nuvia-mapa.js';
import { SILUETAS, VIEWBOX_MAPA } from '../js/nuvia-mapa-siluetas.js';

let fallos = 0;
function comprueba(nombre, condicion, detalle = '') {
  const ok = Boolean(condicion);
  console.log(`${ok ? 'OK  ' : 'FALLO'} ${nombre}${detalle ? '  · ' + detalle : ''}`);
  if (!ok) fallos += 1;
}

console.log('— Agregación por continentes —');
{
  const filas = [
    { clave: 'united_states', peso: 40 },
    { clave: 'eurozone', peso: 25 },
    { clave: 'united_kingdom', peso: 5 },
    { clave: 'japan', peso: 10 },
    { clave: 'asia_emerging', peso: 8 },
    { clave: 'latin_america', peso: 7 },
    { clave: 'marte', peso: 5 },
  ];
  const a = exposicionPorContinente(filas);
  comprueba('América suma Estados Unidos y Latinoamérica', Math.abs(a.pesos.america - 47) < 1e-9);
  comprueba('Europa suma eurozona y Reino Unido', Math.abs(a.pesos.europa - 30) < 1e-9);
  comprueba('Asia suma Japón y emergentes', Math.abs(a.pesos.asia - 18) < 1e-9);
  comprueba('La región desconocida se declara, no se pierde en silencio',
    a.sinContinente.length === 1 && a.sinContinente[0].clave === 'marte');
  comprueba('La clave se normaliza a minúsculas',
    exposicionPorContinente([{ clave: 'Japan', peso: 10 }]).pesos.asia === 10);
  comprueba('Sin filas no hay mapa, nada se inventa',
    exposicionPorContinente([]) === null && exposicionPorContinente(null) === null);
}

console.log('\n— La escala de color —');
comprueba('Cinco tramos, del cero al peso dominante',
  tramoDeColor(0) === 0 && tramoDeColor(5) === 1 && tramoDeColor(15) === 2
  && tramoDeColor(30) === 3 && tramoDeColor(60) === 4 && tramoDeColor(-1) === 0);

console.log('\n— Las siluetas del laboratorio clásico —');
{
  const claves = ['america', 'europa', 'africa', 'asia', 'oceania'];
  comprueba('Las cinco siluetas están y son caminos SVG',
    claves.every((c) => typeof SILUETAS[c] === 'string' && SILUETAS[c].startsWith('M') && SILUETAS[c].length > 1000));
  comprueba('El viewBox es el del mapa clásico', VIEWBOX_MAPA === '0 -220 1000 680');
  comprueba('Cada continente del mapa tiene su etiqueta en castellano',
    claves.every((c) => typeof ETIQUETAS_CONTINENTE[c] === 'string' && ETIQUETAS_CONTINENTE[c].length > 3));
  comprueba('Toda región del diccionario apunta a un continente del mapa',
    Object.values(REGIONES_CONTINENTE).every((c) => claves.includes(c)));
}

console.log('\n— Prueba de la sección 5 —');
{
  const textos = [NOTA_MAPA, ...Object.values(ETIQUETAS_CONTINENTE)].join('\n');
  const prohibido = [
    /\bmejor(?:es)?\b/iu, /recomendad|recomendamos|recomiend[oae]|recomendable/iu,
    /óptim/iu, /\bconviene\b/iu, /\bdeberías?\b/iu, /ideal para/iu, /adecuad[oa]s? para/iu,
    /\bpara ti\b|\bpara usted\b/iu, /sugerimos/iu, /garantiz/iu,
    /\bcompra\b|\bvende\b|\bmantén\b/iu, /atractiv/iu, /oportunidad/iu, /equilibrad/iu, /prudente/iu,
  ];
  const cruces = prohibido.filter((rx) => rx.test(textos));
  comprueba('Ningún texto del mapa aconseja ni personaliza', cruces.length === 0, cruces.map(String).join(' '));
  comprueba('La nota dice qué describe y qué no',
    NOTA_MAPA.includes('renta variable') && NOTA_MAPA.includes('describe dónde está hoy') && NOTA_MAPA.includes('nada más'));
}

if (fallos) {
  console.error(`\n${fallos} comprobación(es) en rojo.`);
  process.exit(1);
}
console.log('\nTodo en verde: distribución geográfica con mapa (paso 42).');
