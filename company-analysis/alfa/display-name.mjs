// Corrección de presentación, no de identidad ni de la fuente almacenada.
// Grafía contrastada el 03-09-2026: https://www.grupotsk.com/aviso-legal/
// Solo sustituye esta cadena dañada, para el ISIN y símbolo ya autorizados.
export function companyDisplayName(entry) {
  return entry?.assetId === 'ES0105394003' && entry.isin === 'ES0105394003'
    && entry.symbol === 'TSK.MC' && entry.name === 'TSK ElectrÃ³nica y Electricidad, S.A.'
    ? 'TSK Electrónica y Electricidad, S.A.' : entry?.name;
}
