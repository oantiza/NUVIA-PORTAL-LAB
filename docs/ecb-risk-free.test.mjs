/** Verificación del adaptador CSV oficial del ECB Data Portal. */
import { observacionesDesdeCsv, SERIE_ESTR } from '../scripts/update-ecb-risk-free.mjs';

const csv = [
  'KEY,FREQ,BENCHMARK_ITEM,DATA_TYPE_EST,TIME_PERIOD,OBS_VALUE,COMMENT_OBS',
  `${SERIE_ESTR},B,EU000A2X2A25,WT,2026-08-19,2.188,"texto, con coma"`,
  `${SERIE_ESTR},B,EU000A2X2A25,WT,2026-08-20,2.191,`,
].join('\n');

const observaciones = observacionesDesdeCsv(csv);
if (observaciones.length !== 2
  || observaciones[0][0] !== '2026-08-19'
  || observaciones[1][1] !== 2.191) {
  console.error('FALLO El CSV del BCE no se ha interpretado correctamente.', observaciones);
  process.exit(1);
}
console.log('OK  El adaptador conserva fecha y valor de la serie oficial €STR.');
