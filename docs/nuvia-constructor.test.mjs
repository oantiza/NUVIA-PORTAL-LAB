/**
 * Batería de verificación de la lógica pura de js/nuvia-constructor.js (paso 20).
 *
 *   node docs/nuvia-constructor.test.mjs
 */
import {
  MAX_POSICIONES, agregaPosicion, quitaPosicion, cambiaPeso,
  pesosNormalizados, serieCartera, fechaCorta, textoContador, NOTA_NIVEL,
  lecturasDeMetricas, fechaDelMinimo, repartoPorClase, claseVisual,
  MAX_CARTERAS, AVISO_GUARDADO, carteraParaGuardar, agregaCartera, borraCartera,
  AVISO_GUARDADO_NUBE, carteraNubeParaGuardar, posicionesDesdeNube,
  carterasLocalesParaNube,
  MAX_POSICIONES_SUSCRIPTOR, maxPosiciones, NOTA_NIVEL_SUSCRIPTOR,
  puntosEvolucion, trazadoLinea, serieSemanalTresAnos,
} from '../js/nuvia-constructor.js';
import { metricasDesdeSerie } from '../js/nuvia-cartera.js';

let fallos = 0;
function comprueba(nombre, condicion, detalle = '') {
  const ok = Boolean(condicion);
  console.log(`${ok ? 'OK  ' : 'FALLO'} ${nombre}${detalle ? '  · ' + detalle : ''}`);
  if (!ok) fallos += 1;
}

const activo = (id, nombre = id) => ({ asset_id: id, display_name: nombre, instrument_type: 'STOCK' });

console.log('— Posiciones —');
{
  let pos = [];
  for (const id of ['A', 'B', 'C', 'D', 'E']) pos = agregaPosicion(pos, activo(id)).posiciones;
  comprueba('Se admiten 5 posiciones', pos.length === 5);
  const sexto = agregaPosicion(pos, activo('F'));
  comprueba('La sexta se rechaza con motivo «limite»', sexto.posiciones.length === MAX_POSICIONES && sexto.motivo === 'limite');
  const repe = agregaPosicion(pos, activo('A'));
  comprueba('Un activo repetido se rechaza con motivo «repetido»', repe.posiciones.length === 5 && repe.motivo === 'repetido');
  pos = quitaPosicion(pos, 'C');
  comprueba('Quitar una posición deja las otras cuatro', pos.length === 4 && !pos.some((p) => p.activo.asset_id === 'C'));
  pos = cambiaPeso(pos, 'A', 60);
  comprueba('Cambiar un peso solo toca esa posición', pos.find((p) => p.activo.asset_id === 'A').bruto === 60
    && pos.find((p) => p.activo.asset_id === 'B').bruto !== 60);
}

console.log('\n— Normalización de pesos —');
{
  const pos = [
    { activo: activo('A'), bruto: 60 },
    { activo: activo('B'), bruto: 20 },
    { activo: activo('C'), bruto: 20 },
  ];
  const w = pesosNormalizados(pos);
  comprueba('60/20/20 → 0,6/0,2/0,2', Math.abs(w.A - 0.6) < 1e-12 && Math.abs(w.B - 0.2) < 1e-12);
  const w2 = pesosNormalizados(pos, ['A', 'B']);
  comprueba('Excluido un activo sin datos, el resto se renormaliza (60/20 → 75/25)',
    Math.abs(w2.A - 0.75) < 1e-12 && Math.abs(w2.B - 0.25) < 1e-12 && w2.C === undefined);
  comprueba('Todos los pesos a cero → null, nunca un reparto inventado',
    pesosNormalizados([{ activo: activo('A'), bruto: 0 }]) === null);
}

console.log('\n— Serie de la cartera —');
{
  const series = [
    { asset_id: 'A', values: [100, 110, 120] },
    { asset_id: 'B', values: [100, 90, 80] },
  ];
  const niveles = serieCartera(series, { A: 0.5, B: 0.5 });
  comprueba('Mitad sube +10, mitad baja −10 → cartera plana', niveles.every((v) => Math.abs(v - 1) < 1e-12),
    niveles.join(', '));
  const soloA = serieCartera(series, { A: 1 });
  comprueba('Peso 100 % en un activo reproduce su serie', Math.abs(soloA[2] - 1.2) < 1e-12);
  comprueba('Series de longitudes distintas → null, no un cálculo a medias',
    serieCartera([{ asset_id: 'A', values: [100, 110] }, { asset_id: 'B', values: [100] }], { A: 0.5, B: 0.5 }) === null);
  comprueba('Sin ninguna serie de los pesos pedidos → null', serieCartera(series, { Z: 1 }) === null);
}

console.log('\n— Enlace con las métricas del visitante —');
{
  // 3 años de subida diaria constante hasta duplicar: rentabilidad total 100 %.
  const n = 756;
  const factor = 2 ** (1 / (n - 1));
  const values = Array.from({ length: n }, (_, t) => 100 * factor ** t);
  const niveles = serieCartera([{ asset_id: 'A', values }], { A: 1 });
  const m = metricasDesdeSerie(niveles, { periodosPorAno: 252 });
  comprueba('Serie que duplica en 3 años → rentabilidad total 100 %', Math.abs(m.rentabilidadTotal - 1) < 1e-9);
  comprueba('…y anualizada ≈ 26 % (2^(1/3) − 1)', Math.abs(m.rentabilidadAnualizada - (2 ** (1 / 3) - 1)) < 1e-3,
    `anualizada=${m.rentabilidadAnualizada}`);
  comprueba('Subida monótona → máxima caída 0', m.maximaCaida === 0);
}

console.log('\n— Límite comunicado (paso 21) —');
comprueba('El contador dice cuántas posiciones hay y cuál es el tope', textoContador(3) === 'Posiciones: 3 de 5');
comprueba('La nota de nivel explica el porqué del tope', NOTA_NIVEL.includes('se lee con claridad'));
comprueba('…y qué añade la cuenta gratuita', NOTA_NIVEL.includes('cuenta gratuita')
  && NOTA_NIVEL.includes('en la nube') && NOTA_NIVEL.includes('sin tope de carteras'));
comprueba('…y hasta dónde llega la suscripción', NOTA_NIVEL.includes('20 posiciones'));
comprueba('Dice que el registro está abierto y dónde (paso 28)',
  NOTA_NIVEL.includes('está abierto') && NOTA_NIVEL.includes('«Tu cuenta»'));
comprueba('La nota describe sin aconsejar (sin «mejor/recomendado/óptimo/conviene/deberías/ideal»)',
  !/mejor|recomendad|óptim|conviene|deberías|ideal/i.test(NOTA_NIVEL));

console.log('\n— Lecturas en lenguaje llano (paso 22) —');
{
  const niveles = [1, 1.1, 0.935, 1.2];
  const fechas = ['2023-09-01', '2024-03-01', '2025-03-15', '2026-08-14'];
  const m = { rentabilidadTotal: 0.2, rentabilidadAnualizada: 0.0627, volatilidad: 0.124, maximaCaida: -0.15 };
  const l = lecturasDeMetricas(m, { niveles, fechas });
  comprueba('La rentabilidad se traduce a euros: 10.000 € → 12.000 €', l.rentabilidad.includes('12.000'),
    l.rentabilidad);
  comprueba('…y recuerda que el pasado no asegura el futuro', l.rentabilidad.includes('El pasado no asegura el futuro'));
  comprueba('La volatilidad lleva su cifra dentro de la frase («en torno a un 12,4 %»)',
    l.volatilidad.includes('en torno a un 12,4 %'));
  comprueba('La caída lleva su cifra y la fecha del punto más bajo', l.caida.includes('15,0 %')
    && l.caida.includes('punto más bajo: 15-03-2025'), l.caida);
  comprueba('fechaDelMinimo encuentra el valle correcto', fechaDelMinimo(niveles, fechas) === '15-03-2025');
  comprueba('Longitudes descuadradas → sin fecha, nunca una inventada', fechaDelMinimo(niveles, fechas.slice(1)) === null);

  const sinCaida = lecturasDeMetricas({ ...m, maximaCaida: 0 }, { niveles: [1, 1.1, 1.2], fechas: fechas.slice(1) });
  comprueba('Sin caídas → se dice, sin cifra forzada', sinCaida.caida.includes('no llegó a caer'));
  const vacio = lecturasDeMetricas(undefined);
  comprueba('Sin métricas → «no hay datos suficientes» en las tres lecturas',
    [vacio.rentabilidad, vacio.volatilidad, vacio.caida].every((t) => t.includes('No hay datos suficientes')));
  comprueba('Las lecturas describen sin aconsejar (filtro de lenguaje de bases §2)',
    ![l.rentabilidad, l.volatilidad, l.caida].some((t) => /mejor|recomendad|óptim|conviene|deberías|ideal/i.test(t)));
}

console.log('\n— Reparto por clase (paso 23) —');
{
  const conClase = (id, clase, bruto) => ({ activo: { asset_id: id, economic_asset_class: clase }, bruto });
  const posiciones = [
    conClase('A', 'EQUITY', 40),
    conClase('B', 'EQUITY', 20),
    conClase('C', 'FIXED_INCOME', 30),
    conClase('D', 'raro', 10),
  ];
  const pesos = { A: 0.4, B: 0.2, C: 0.3, D: 0.1 };
  const r = repartoPorClase(posiciones, pesos);
  comprueba('Dos acciones del 40 y el 20 → Renta variable 60 %', r[0].etiqueta === 'Renta variable'
    && Math.abs(r[0].peso - 0.6) < 1e-12);
  comprueba('Ordenado de mayor a menor', r[0].peso >= r[1].peso && r[1].peso >= r[2].peso);
  comprueba('Una clase desconocida se enseña como «Sin clasificar», no se adivina',
    r.some((x) => x.etiqueta === 'Sin clasificar' && Math.abs(x.peso - 0.1) < 1e-12));
  comprueba('Los pesos del reparto suman 1', Math.abs(r.reduce((s, x) => s + x.peso, 0) - 1) < 1e-12);
  const soloConSerie = repartoPorClase(posiciones, { A: 0.5, C: 0.5 });
  comprueba('Un activo fuera del cálculo no entra en el reparto', soloConSerie.length === 2
    && soloConSerie.every((x) => ['Renta variable', 'Renta fija'].includes(x.etiqueta)));
  comprueba('Sin pesos → null, nunca un gráfico vacío inventado', repartoPorClase(posiciones, null) === null);
  comprueba('claseVisual da color del sistema para cada clase', claseVisual('EQUITY').color.startsWith('var(--nv-cat-')
    && claseVisual('lo-que-sea').etiqueta === 'Sin clasificar');
}

console.log('\n— Guardado local (paso 24) —');
{
  const posiciones = [{
    activo: { asset_id: 'ES0178430E18', display_name: 'Telefonica', instrument_type: 'STOCK', economic_asset_class: 'EQUITY', metrics: { volatility_3y: 0.2 }, _basura: true },
    bruto: 60,
    _salida: { value: 'x' },
  }];
  const cartera = carteraParaGuardar('  Mi prueba  ', posiciones);
  comprueba('Se guarda solo lo necesario (sin métricas ni referencias de pantalla)',
    cartera.posiciones[0].activo.metrics === undefined && cartera.posiciones[0]._salida === undefined
    && cartera.posiciones[0].activo.asset_id === 'ES0178430E18' && cartera.posiciones[0].bruto === 60);
  comprueba('El nombre se limpia de espacios', cartera.nombre === 'Mi prueba');

  let lista = [];
  ({ lista } = agregaCartera(lista, cartera));
  comprueba('Guardar añade la cartera', lista.length === 1 && lista[0].nombre === 'Mi prueba');
  const sinNombre = agregaCartera(lista, carteraParaGuardar('', posiciones));
  comprueba('Sin nombre → nombre automático «Cartera 2»', sinNombre.lista[1].nombre === 'Cartera 2');
  const repetida = agregaCartera(sinNombre.lista, carteraParaGuardar('Mi prueba', [{ ...posiciones[0], bruto: 30 }]));
  comprueba('Mismo nombre → se actualiza, no se duplica', repetida.motivo === 'reemplazada'
    && repetida.lista.length === 2 && repetida.lista[0].posiciones[0].bruto === 30);
  let llena = repetida.lista;
  while (llena.length < MAX_CARTERAS) ({ lista: llena } = agregaCartera(llena, carteraParaGuardar('', posiciones)));
  const quinta = agregaCartera(llena, carteraParaGuardar('Una más', posiciones));
  comprueba(`La cartera ${MAX_CARTERAS + 1} se rechaza con motivo «limite»`,
    quinta.motivo === 'limite' && quinta.lista.length === MAX_CARTERAS);
  comprueba('Guardar sin posiciones se rechaza con explicación',
    agregaCartera([], carteraParaGuardar('Vacía', [])).motivo === 'sin-posiciones');
  comprueba('Borrar quita solo la elegida', borraCartera(llena, 0).length === MAX_CARTERAS - 1
    && !borraCartera(llena, 0).some((c) => c.nombre === 'Mi prueba'));
  comprueba('El aviso se entiende sin jerga: navegador y dispositivo, sin tecnicismos',
    AVISO_GUARDADO.includes('este navegador') && AVISO_GUARDADO.includes('se pierden')
    && AVISO_GUARDADO.includes('otro ordenador')
    && !/localStorage|caché|cookie|sesión|almacenamiento/i.test(AVISO_GUARDADO));
}

console.log('\n— Guardado en la nube: solo ids y pesos (paso 30) —');
{
  const posiciones = [
    { activo: { asset_id: 'A', display_name: 'Alfa', instrument_type: 'STOCK', economic_asset_class: 'EQUITY' }, bruto: 30 },
    { activo: { asset_id: 'B', display_name: 'Beta', instrument_type: 'FUND', economic_asset_class: 'FIXED_INCOME' }, bruto: 10 },
  ];
  const carga = carteraNubeParaGuardar('  Mi nube  ', posiciones);
  comprueba('El nombre se recorta y hay moneda base EUR', carga.name === 'Mi nube' && carga.base_currency === 'EUR');
  comprueba('Cada posición lleva SOLO asset_id y weight_percent (nada maestro)',
    carga.positions.every((p) => Object.keys(p).sort().join(',') === 'asset_id,weight_percent'));
  comprueba('Los pesos van normalizados a 0–100 y suman 100',
    Math.abs(carga.positions[0].weight_percent - 75) < 1e-6
    && Math.abs(carga.positions[1].weight_percent - 25) < 1e-6);
  comprueba('Sin nombre → «Cartera»', carteraNubeParaGuardar('', posiciones).name === 'Cartera');
  comprueba('Con portfolio_id se reenvía para reemplazar',
    carteraNubeParaGuardar('x', posiciones, 'pid-1').portfolio_id === 'pid-1'
    && !('portfolio_id' in carteraNubeParaGuardar('x', posiciones)));

  const reconstruidas = posicionesDesdeNube(
    [{ asset_id: 'A', weight_percent: 75 }, { asset_id: 'B', weight_percent: 25 }],
    { A: { display_name: 'Alfa', instrument_type: 'STOCK', economic_asset_class: 'EQUITY' } });
  comprueba('Al abrir, la ficha conocida reconstruye nombre y clase',
    reconstruidas[0].activo.display_name === 'Alfa' && reconstruidas[0].activo.economic_asset_class === 'EQUITY'
    && reconstruidas[0].bruto === 75);
  comprueba('Sin ficha, se muestra el identificador y sin clase (nunca se inventa)',
    reconstruidas[1].activo.display_name === 'B' && reconstruidas[1].activo.economic_asset_class === undefined);
  comprueba('Nunca se cargan más de las posiciones del nivel',
    posicionesDesdeNube(Array.from({ length: 9 }, (_, i) => ({ asset_id: `X${i}`, weight_percent: 10 }))).length === MAX_POSICIONES);
  comprueba('El aviso de la nube dice que solo se guardan activos y pesos, sin jerga',
    AVISO_GUARDADO_NUBE.includes('tu cuenta') && AVISO_GUARDADO_NUBE.includes('qué activos y con qué peso')
    && AVISO_GUARDADO_NUBE.includes('base de datos NUVIA')
    && !/localStorage|caché|cookie|token|endpoint/i.test(AVISO_GUARDADO_NUBE));
}

console.log('\n— Migración de lo local a la cuenta (paso 31) —');
{
  const locales = [
    { nombre: 'Una', posiciones: [
      { activo: { asset_id: 'A', display_name: 'Alfa' }, bruto: 30 },
      { activo: { asset_id: 'B', display_name: 'Beta' }, bruto: 10 },
    ] },
    { nombre: 'Vacía', posiciones: [] },
    { nombre: 'Solo ceros', posiciones: [{ activo: { asset_id: 'C' }, bruto: 0 }] },
  ];
  const paraNube = carterasLocalesParaNube(locales);
  comprueba('Solo se suben las carteras con posiciones válidas (se descartan vacías o a cero)',
    paraNube.length === 1 && paraNube[0].nombre === 'Una');
  comprueba('Cada carga conserva el nombre y va en formato nube (solo ids+pesos)',
    paraNube[0].carga.name === 'Una'
    && paraNube[0].carga.positions.every((p) => Object.keys(p).sort().join(',') === 'asset_id,weight_percent'));
  comprueba('Los pesos suben ya normalizados (30/10 → 75/25)',
    Math.abs(paraNube[0].carga.positions[0].weight_percent - 75) < 1e-6
    && Math.abs(paraNube[0].carga.positions[1].weight_percent - 25) < 1e-6);
  comprueba('Sin carteras locales, no hay nada que migrar', carterasLocalesParaNube([]).length === 0);
}

console.log('\n— Límite por nivel (paso 33) —');
{
  comprueba('El suscriptor trabaja con 20 posiciones; el resto con 5',
    maxPosiciones('suscriptor') === MAX_POSICIONES_SUSCRIPTOR
    && maxPosiciones('registrada') === MAX_POSICIONES && maxPosiciones('visitante') === MAX_POSICIONES
    && MAX_POSICIONES_SUSCRIPTOR === 20);

  let lista = [];
  for (let i = 0; i < 6; i += 1) {
    lista = agregaPosicion(lista, { asset_id: `A${i}`, display_name: `Activo ${i}` }, maxPosiciones('suscriptor')).posiciones;
  }
  comprueba('Con límite de suscriptor, la sexta posición entra', lista.length === 6);
  comprueba('Con el límite normal, la sexta se rechaza con motivo «limite»',
    agregaPosicion(lista.slice(0, 5), { asset_id: 'A9' }).motivo === 'limite');

  comprueba('El contador enseña el límite del nivel',
    textoContador(6, 20) === 'Posiciones: 6 de 20' && textoContador(2) === 'Posiciones: 2 de 5');

  const nube = Array.from({ length: 22 }, (_, i) => ({ asset_id: `N${i}`, weight_percent: 1 }));
  comprueba('Al abrir de la nube, el corte respeta el límite del nivel',
    posicionesDesdeNube(nube, {}, 20).length === 20 && posicionesDesdeNube(nube, {}).length === 5);

  comprueba('La nota del tope del suscriptor explica el porqué, sin aconsejar',
    NOTA_NIVEL_SUSCRIPTOR.includes('20') && NOTA_NIVEL_SUSCRIPTOR.includes('gráficos')
    && !/mejor|recomendad|óptim|conviene|deberías/i.test(NOTA_NIVEL_SUSCRIPTOR));
}

console.log('\n— Fechas —');
comprueba('2026-08-15 → 15-08-2026', fechaCorta('2026-08-15') === '15-08-2026');
comprueba('Fecha ilegible → null, no una fecha inventada', fechaCorta('ayer') === null && fechaCorta(null) === null);

console.log('\n— Evolución de la combinación (gráfico, encargo 20-08) —');
{
  const niveles = [1, 1.1, 0.99, 1.2];
  const fechas = ['2023-08-18', '2024-08-18', '2025-08-18', '2026-08-18'];
  const p = puntosEvolucion(niveles, fechas);
  comprueba('Los niveles se rebasan a base 100 con su mínimo y su máximo',
    p && p.base[0] === 100 && p.base[3] === 120 && p.min === 99 && p.max === 120);
  comprueba('Sin fechas casadas con los niveles no hay gráfico, nada se inventa',
    puntosEvolucion(niveles, fechas.slice(0, 3)) === null
    && puntosEvolucion([1], ['2026-01-01']) === null
    && puntosEvolucion([NaN, NaN], fechas.slice(0, 2)) === null);

  const escala = { W: 560, H: 220, izq: 56, der: 14, arriba: 12, abajo: 26, min: 99, max: 120 };
  const d = trazadoLinea(p.base, escala);
  comprueba('El trazado es un camino SVG que arranca en M y avanza con L',
    /^M[\d.]+,[\d.]+( L[\d.]+,[\d.]+){3}$/.test(d));
  const xs = [...d.matchAll(/[ML]([\d.]+),/g)].map((m2) => Number(m2[1]));
  comprueba('La x avanza de izquierda a derecha, un punto por sesión',
    xs.length === 4 && xs.every((x, i) => i === 0 || x > xs[i - 1])
    && xs[0] === 56 && xs[3] === 546);
  const ys = [...d.matchAll(/,([\d.]+)/g)].map((m2) => Number(m2[1]));
  comprueba('El máximo toca el borde de arriba y el mínimo el de abajo',
    Math.min(...ys) === 12 && Math.max(...ys) === 194);
  comprueba('Un hueco no numérico se salta sin romper el camino',
    /^M[\d.]+,[\d.]+ L[\d.]+,[\d.]+$/.test(trazadoLinea([100, NaN, 110], { ...escala, min: 100, max: 110 })));

  const fechasDiarias = ['2022-08-14', '2023-08-14', '2023-08-15', '2023-08-21', '2026-08-14'];
  const semanal = serieSemanalTresAnos([0.8, 1, 1.02, 1.05, 1.4], fechasDiarias);
  comprueba('El gráfico conserva solo los últimos 3 años y un cierre por semana',
    semanal.fechas.length === 3 && semanal.fechas[0] === '2023-08-15'
    && semanal.fechas[1] === '2023-08-21' && semanal.fechas[2] === '2026-08-14');
  comprueba('La serie semanal se rebasa para arrancar en 100',
    semanal.niveles[0] === 1 && Math.abs(semanal.niveles[1] - (1.05 / 1.02)) < 1e-12);
  comprueba('Sin fechas alineadas no se construye una serie semanal',
    serieSemanalTresAnos([1, 1.1], ['2026-01-01']) === null);
}

if (fallos) {
  console.error(`\n${fallos} comprobación(es) fallida(s).`);
  process.exit(1);
}
console.log('\nBatería completa: todo en orden.');
