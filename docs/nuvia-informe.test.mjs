/**
 * Batería del informe genérico de compañía (paso 37, bases §5).
 *
 * Sin red ni DOM: se prueban los helpers puros de js/nuvia-informe.js con la
 * ficha REAL de Telefónica servida por get_asset_detail en producción
 * (19-08-2026, recortada a lo que usa el informe) y con fichas vacías.
 * También se pasa la propia prueba de la sección 5 de las bases: del texto
 * generado no debe poder deducirse qué hacer con el dinero.
 *
 *   node docs/nuvia-informe.test.mjs
 */
import {
  veces, enMillones, porAccion,
  seccionesInforme, riesgosInforme, datosAusentes, pieInforme,
  NOTA_INFORME_CERRADO,
} from '../js/nuvia-informe.js';

let fallos = 0;
function comprueba(nombre, condicion, detalle = '') {
  const ok = Boolean(condicion);
  console.log(`${ok ? 'OK  ' : 'FALLO'} ${nombre}${detalle ? '  · ' + detalle : ''}`);
  if (!ok) fallos += 1;
}

/* Ficha real de producción (Telefónica, ES0178430E18), recortada. */
const TEF = {
  asset_id: 'ES0178430E18',
  instrument_type: 'STOCK',
  identity: { display_name: 'Telefonica', isin: 'ES0178430E18', ticker: 'TEF', currency: 'EUR', region: 'Iberia' },
  fundamentals_summary: {
    as_of_date: '2026-03-31', source: 'eodhd', currency: 'EUR',
    profile: { sector: 'Communication Services', industry: 'Telecom Services', country: 'ES' },
    valuation: { market_cap: 20397987840, enterprise_value: 20495592304, pe_forward: 11.9904, peg: 0.3783, price_book_mrq: 1.3966, price_sales_ttm: 0.5681, ev_ebitda: 2.4771 },
    profitability: { operating_margin_ttm: 0.1329, profit_margin: -0.0954, return_on_assets_ttm: 0.0097, return_on_equity_ttm: -0.089 },
    per_share: { eps: -0.42, book_value: 2.581, revenue_ttm: 6.373 },
    dividends: { yield_ratio: 0.0, payout_ratio: 1.1111, ex_dividend_date: '2026-06-16' },
  },
  metrics: {
    annualized_return_1y: -0.161536, annualized_return_3y: 0.052713, annualized_return_5y: 0.047023,
    volatility_1y: 0.256675, volatility_3y: 0.207783, volatility_5y: 0.211614,
    sharpe_3y: 0.1148, max_drawdown_hist: -0.760572, max_drawdown_hist_date: '2020-11-06',
  },
  performance_preview: { latest_value: 3.693, latest_value_date: '2026-06-19' },
};

console.log('— Formato —');
comprueba('Múltiplos con una decimal y aspa', veces(11.9904) === '12,0×' && veces(null) === '—');
comprueba('Millones con separador es-ES y la divisa detrás',
  enMillones(20397987840, 'EUR') === '20.398 M€'
  && enMillones(1500000, 'USD') === '2 M USD' && enMillones(null) === '—');
comprueba('Por acción con divisa', porAccion(-0.42) === '−0,42 €' && porAccion(null) === '—');

console.log('\n— Plantilla fija (bases §5: misma estructura para todas) —');
{
  const secciones = seccionesInforme(TEF);
  comprueba('Cinco secciones fijas, en el mismo orden siempre',
    secciones.map((s) => s.titulo).join(' | ')
    === 'Qué es | Tamaño y valoración | Cómo gana dinero | Dividendo | Comportamiento en mercado');
  const vacia = seccionesInforme({});
  comprueba('Una ficha vacía produce LA MISMA plantilla (solo cambian los valores a «—»)',
    vacia.map((s) => s.titulo).join('|') === secciones.map((s) => s.titulo).join('|')
    && vacia.every((s, i) => s.filas.length === secciones[i].filas.length));
  const plano = secciones.flatMap((s) => s.filas.map((filaS) => `${filaS.etiqueta}: ${filaS.valor}`)).join('\n');
  comprueba('Capitalización y múltiplos reales bien formateados',
    plano.includes('Capitalización bursátil: 20.398 M€') && plano.includes('PER adelantado (estimación del consenso): 12,0×'));
  comprueba('El PER sobre beneficios pasados falta y se muestra como «—», no se rellena',
    plano.includes('PER (beneficios de los últimos 12 meses): —'));
  comprueba('Márgenes con su signo (la pérdida se enseña igual que la ganancia)',
    plano.includes('Margen neto (12 meses): −9,5 %') && plano.includes('Margen operativo (12 meses): 13,3 %'));
  comprueba('La máxima caída lleva su fecha (un dato sin fechar envejece a recomendación)',
    /Máxima caída de su historial: −76,1 % \(fondo el 06-11-2020\)/.test(plano));
  comprueba('El último precio lleva su fecha', /Último precio cargado: 3,69 € \(19-06-2026\)/.test(plano));
  comprueba('Contador de ausencias: al menos el PER pasado falta en TEF', datosAusentes(secciones) >= 1);
}

console.log('\n— Riesgos por reglas fijas (simetría obligatoria) —');
{
  const riesgos = riesgosInforme(TEF);
  comprueba('Siempre está el riesgo de concentración, con sector y país',
    riesgos[0].includes('Concentración') && riesgos[0].includes('Communication Services') && riesgos[0].includes('ES'));
  comprueba('La volatilidad medida y la peor caída del historial, con cifras',
    riesgos.some((r) => r.includes('20,8 %')) && riesgos.some((r) => r.includes('−76,1 %')));
  comprueba('La pérdida reciente se dice con su cifra', riesgos.some((r) => r.includes('perdió dinero') && r.includes('−9,5 %')));
  comprueba('El BPA negativo explica el PER ausente', riesgos.some((r) => r.includes('−0,42 €')));
  comprueba('El payout por encima del beneficio se señala', riesgos.some((r) => r.includes('payout del 111 %')));
  comprueba('En euros no se añade riesgo de divisa; en USD sí',
    !riesgos.some((r) => r.includes('tipo de cambio'))
    && riesgosInforme({ identity: { currency: 'USD' } }).some((r) => r.includes('tipo de cambio')));
  comprueba('Ficha vacía → aun así declara la concentración (sin dato, dicho tal cual)',
    riesgosInforme({})[0].includes('sin dato'));
}

console.log('\n— Pie y nota, con la prueba de la sección 5 —');
{
  const pie = pieInforme(TEF);
  comprueba('El pie declara plantilla idéntica, fuente y fecha, y la falta de firma',
    pie.includes('idéntico para cualquiera') && pie.includes('sin firma')
    && pie.includes('31-03-2026') && pie.includes('eodhd') && pie.includes('no emite recomendaciones'));
  comprueba('Sin fundamentales, el pie declara la fuente ausente',
    pieInforme({}).includes('sin fuente declarada'));

  const todo = [
    NOTA_INFORME_CERRADO, pie,
    ...seccionesInforme(TEF).flatMap((s) => [s.titulo, ...s.filas.map((filaS) => `${filaS.etiqueta} ${filaS.valor}`)]),
    ...riesgosInforme(TEF),
  ].join('\n');
  const prohibido = [
    /\bmejor(?:es)?\b/iu, /recomendad|recomendamos|recomiend[oae]|recomendable/iu,
    /óptim/iu, /\bconviene\b/iu, /\bdeberías?\b/iu, /ideal para/iu, /adecuad[oa]s? para/iu,
    /\bpara ti\b|\bpara usted\b/iu, /sugerimos/iu, /garantiz/iu,
    /\bcompra\b|\bvende\b|\bmantén\b/iu, /atractiv/iu, /infravalorad|sobrevalorad/iu,
    /oportunidad/iu, /precio objetivo propio/iu, /momento de entrar/iu,
  ];
  const cruces = prohibido.filter((p) => p.test(todo));
  comprueba('Del texto completo no se deduce qué hacer con el dinero (cero giros prohibidos)',
    cruces.length === 0, cruces.map(String).join(' '));
}

if (fallos) {
  console.error(`\n${fallos} comprobación(es) en rojo.`);
  process.exit(1);
}
console.log('\nTodo en verde: informe genérico de compañía (paso 37).');
