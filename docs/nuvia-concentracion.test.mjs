/**
 * Verificación del módulo de concentración · NUVIA
 * ---------------------------------------------------------------------------
 * Ejecutar:  node docs/nuvia-concentracion.test.mjs
 *
 * Cubre la verificación del paso 14 de la guía: una cartera de cuatro bancos
 * españoles debe salir ~100 % financiero y ~100 % España; un fondo global no
 * es «internacional», son sus posiciones repartidas. Los activos son
 * sintéticos con la estructura real de `get_asset_detail`.
 */

import {
  concentracionSectorial,
  concentracionGeografica,
  clasificaSectorEstimado,
  distribucionRegionalEstimada,
} from '../js/nuvia-concentracion.js';

let fallos = 0;
const comprueba = (nombre, condicion, detalle = '') => {
  const ok = Boolean(condicion);
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK ' : 'FALLO'}  ${nombre}${detalle ? `  · ${detalle}` : ''}`);
};

const banco = (id) => ({
  asset_id: id,
  display_name: id,
  pms_exposure: { equity: 1 },
  exposure_detail: {
    sectors: { financial_services: 100 },
    equity_regions: { espana: 100 },
  },
});

/* ── Paso 14 · Cuatro bancos españoles ──────────────────────────────────── */

const bancos = ['SAN', 'BBVA', 'CABK', 'SAB'].map(banco);
const posBancos = bancos.map((a) => ({ asset_id: a.asset_id, weight_percent: 25 }));

const sectores = concentracionSectorial(posBancos, bancos);
const regiones = concentracionGeografica(posBancos, bancos);

comprueba('Cuatro bancos → 100 % financiero',
  sectores.filas.length === 1 && sectores.filas[0].clave === 'financial_services'
  && Math.abs(sectores.filas[0].peso - 100) < 1e-9,
  `${sectores.filas[0]?.peso} % ${sectores.filas[0]?.clave}`);
comprueba('Cuatro bancos → 100 % España',
  regiones.filas.length === 1 && regiones.filas[0].clave === 'espana'
  && Math.abs(regiones.filas[0].peso - 100) < 1e-9);
comprueba('Calidad: look-through puro, sin estimaciones',
  sectores.calidad === 'lookthrough' && sectores.pesoEstimado === 0);

/* ── Un fondo global no es «internacional»: son sus posiciones ──────────── */

const fondoGlobal = {
  asset_id: 'GLOBAL',
  display_name: 'Fondo Global',
  pms_exposure: { equity: 1 },
  exposure_detail: {
    sectors: { technology: 30, financial_services: 20, healthcare: 15, industrials: 15, energy: 10, utilities: 10 },
    equity_regions: { united_states: 60, eurozone: 20, japan: 10, asia_emerging: 10 },
  },
};
const ltGlobal = concentracionGeografica(
  [{ asset_id: 'GLOBAL', weight_percent: 100 }], [fondoGlobal]
);
comprueba('Fondo global → repartido por regiones, no un bloque «global»',
  ltGlobal.filas.length === 4 && ltGlobal.filas[0].clave === 'united_states'
  && Math.abs(ltGlobal.filas[0].peso - 60) < 1e-9);

// Mezcla banco + fondo global al 50/50: España debe pesar 50 + 0 = 50 %
// y EE. UU. 30 % (60 % del 50 % del fondo).
const mezcla = concentracionGeografica(
  [{ asset_id: 'SAN', weight_percent: 50 }, { asset_id: 'GLOBAL', weight_percent: 50 }],
  [banco('SAN'), fondoGlobal]
);
const porClave = Object.fromEntries(mezcla.filas.map((f) => [f.clave, f.peso]));
comprueba('Mezcla 50/50: España 50 % y EE. UU. 30 %, con look-through',
  Math.abs(porClave.espana - 50) < 1e-9 && Math.abs(porClave.united_states - 30) < 1e-9,
  `España ${porClave.espana} · EE. UU. ${porClave.united_states}`);

/* ── La exposición a RV pondera: un fondo de bonos no aporta sectores ───── */

const fondoBonos = {
  asset_id: 'BONOS',
  display_name: 'Fondo Renta Fija',
  pms_exposure: { equity: 0 },
  exposure_detail: { sectors: { financial_services: 100 }, equity_regions: { eurozone: 100 } },
};
const conBonos = concentracionSectorial(
  [{ asset_id: 'SAN', weight_percent: 50 }, { asset_id: 'BONOS', weight_percent: 50 }],
  [banco('SAN'), fondoBonos]
);
comprueba('Un fondo de bonos (equity = 0) no entra en la concentración de RV',
  conBonos.filas.length === 1 && Math.abs(conBonos.filas[0].peso - 100) < 1e-9);

/* ── Estimaciones: declaradas, nunca en silencio ────────────────────────── */

const sinDatos = {
  asset_id: 'TECH',
  display_name: 'Amundi MSCI Technology UCITS',
  category: 'Technology',
  pms_exposure: { equity: 1 },
};
const mixto = concentracionSectorial(
  [{ asset_id: 'SAN', weight_percent: 60 }, { asset_id: 'TECH', weight_percent: 40 }],
  [banco('SAN'), sinDatos]
);
comprueba('Activo sin distribución → sector estimado por heurística',
  clasificaSectorEstimado(sinDatos) === 'technology');
comprueba('Calidad «mixed» y peso estimado declarado (40 %)',
  mixto.calidad === 'mixed' && Math.abs(mixto.pesoEstimado - 40) < 1e-9,
  `calidad ${mixto.calidad} · estimado ${mixto.pesoEstimado} %`);

const soloDivisa = { asset_id: 'X', pms_exposure: { equity: 1 }, currency: 'JPY' };
comprueba('Respaldo por divisa: JPY → Japón',
  JSON.stringify(distribucionRegionalEstimada(soloDivisa)) === '{"japan":100}');

const sinNada = concentracionSectorial(
  [{ asset_id: 'Y', weight_percent: 100 }],
  [{ asset_id: 'Y', display_name: 'ZZZ', pms_exposure: { equity: 1 } }]
);
comprueba('Sin distribución NI heurística → calidad «none», nada inventado',
  sinNada.calidad === 'none' && sinNada.filas.length === 0);

/* ── Robustez ───────────────────────────────────────────────────────────── */

const noNormalizada = concentracionSectorial(
  [{ asset_id: 'Z', weight_percent: 100 }],
  [{ asset_id: 'Z', pms_exposure: { equity: 1 }, exposure_detail: { sectors: { technology: 3, energy: 1 } } }]
);
comprueba('Distribución que no suma 100 se normaliza (75/25)',
  Math.abs(noNormalizada.filas[0].peso - 75) < 1e-9 && Math.abs(noNormalizada.filas[1].peso - 25) < 1e-9);

comprueba('Cartera vacía → «none»',
  concentracionSectorial([], []).calidad === 'none');

/* ───────────────────────────────────────────────────────────────────────── */

/* ── Alfa (base propia) · null explícito = sin datos, nunca estimado ─────── */
{
  const fondoSinDatos = { asset_id: 'F1', display_name: 'Fondo Global EUR', currency: 'EUR', region: null,
    economic_asset_class: 'EQUITY', pms_exposure: { equity: 1 }, exposure_detail: null };
  const mixtoSinDatos = { asset_id: 'F2', display_name: 'Fondo Mixto', currency: 'EUR',
    economic_asset_class: 'MIXED', pms_exposure: null, exposure_detail: null };
  const etf = { asset_id: 'E1', display_name: 'ETF Mundo', pms_exposure: { equity: 0.99 },
    exposure_detail: { sectors: { technology: 60, financial_services: 40 }, equity_regions: { north_america: 70, europe_developed: 30 } } };
  const pos = [
    { asset_id: 'F1', weight_percent: 40 }, { asset_id: 'F2', weight_percent: 20 }, { asset_id: 'E1', weight_percent: 40 },
  ];
  const sec = concentracionSectorial(pos, [fondoSinDatos, mixtoSinDatos, etf]);
  comprueba('Alfa: un fondo con exposure_detail null no se estima por el nombre (ni «global» ni «multi_sector»)',
    !sec.filas.some((f) => f.clave === 'multi_sector') && sec.calidad === 'lookthrough');
  comprueba('Alfa: pesoSinDatos declara el 60 % de la cartera (40 + 20)', Math.abs(sec.pesoSinDatos - 60) < 1e-9, String(sec.pesoSinDatos));
  comprueba('Alfa: lo mostrado corresponde solo al ETF (tecnología 60 %)',
    Math.abs(sec.filas.find((f) => f.clave === 'technology').peso - 60) < 1e-9);
  const geo = concentracionGeografica(pos, [fondoSinDatos, mixtoSinDatos, etf]);
  comprueba('Alfa: un fondo en euros sin datos NO sale como «eurozona 100 %»',
    !geo.filas.some((f) => f.clave === 'eurozone') && Math.abs(geo.pesoSinDatos - 60) < 1e-9);
  const soloFondos = concentracionSectorial(pos.slice(0, 2), [fondoSinDatos, mixtoSinDatos]);
  comprueba('Alfa: cartera solo de fondos sin datos → «none» con pesoSinDatos 100',
    soloFondos.calidad === 'none' && soloFondos.filas.length === 0 && Math.abs(soloFondos.pesoSinDatos - 100) < 1e-9);
  const heredado = concentracionSectorial([{ asset_id: 'X', weight_percent: 100 }],
    [{ asset_id: 'X', display_name: 'Tech Fund', pms_exposure: { equity: 1 } }]);
  comprueba('Sin cambios: exposure_detail undefined sigue estimándose (comportamiento anterior)',
    heredado.calidad === 'estimated' && heredado.filas[0]?.clave === 'technology' && heredado.pesoSinDatos === 0);
}

console.log(fallos === 0 ? '\nBatería completa: todo en orden.' : `\n${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);
