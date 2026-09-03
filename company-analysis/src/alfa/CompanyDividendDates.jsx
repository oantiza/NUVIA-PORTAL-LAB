import React, { useEffect, useState } from 'react';
import { Section } from '../components/Kpi.jsx';
import { readDividendDates } from './remote.js';

// Fechas de calendario sin desplazarlas por la zona horaria del visitante.
const dayLabel = value => value ? new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)) : 'No informada';
const timeLabel = value => new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(value)) + ' UTC';
function relation(value, asOf) {
  if (!value) return 'El proveedor no aporta esta fecha; no significa dividendo cero.';
  if (value > asOf) return 'Posterior a la consulta del proveedor; no confirma un pago futuro.';
  if (value < asOf) return 'Anterior a la consulta del proveedor.';
  return 'Coincide con el día de consulta del proveedor.';
}

export function DividendDatesContent({ reading, onRetry }) {
  const doc = reading?.dates;
  return <div className="alpha-dividend-dates">
    <Section eyebrow="Complemento independiente · Base propia" title="Fechas de dividendos">
      {(!reading || reading.state === 'loading') && <p role="status">Consultando las fechas de dividendos…</p>}
      {reading?.state === 'missing' && <p role="status">No hay un complemento de fechas cargado para esta empresa. No significa que no pague dividendos.</p>}
      {reading?.state === 'error' && <p role="alert">{reading.error}</p>}
      {doc && <>
        <p>Fechas declaradas por EODHD. No es un historial completo ni un calendario de pagos confirmado.</p>
        <dl className="alpha-dividend-grid">
          {[[doc.dividendDate, 'Fecha de pago'], [doc.exDividendDate, 'Fecha de exdividendo']].map(([value, label]) => <div key={label}>
            <dt>{label}</dt><dd>{value ? <time dateTime={value}>{dayLabel(value)}</time> : 'No informada'}</dd>
            <dd className="alpha-date-context">{relation(value, doc.source.fetchedAt.slice(0, 10))}</dd>
          </div>)}
        </dl>
        <p className="note">Las dos fechas pueden corresponder a eventos distintos. No se vinculan entre sí ni al importe TTM mostrado en otros apartados.</p>
        <p className="note alpha-dividend-source"><strong>Fuente de estas fechas: {doc.source.provider}.</strong> Actualización declarada: {dayLabel(doc.source.providerUpdated)}.<br />
          Consulta al proveedor: <time dateTime={doc.source.fetchedAt}>{timeLabel(doc.source.fetchedAt)}</time>. Carga del complemento: <time dateTime={doc.loaded_at}>{timeLabel(doc.loaded_at)}</time>.<br />
          Consultar este complemento no actualiza las cuentas anuales ni los ratios. No son datos en tiempo real.</p>
      </>}
      {reading && reading.state !== 'loading' && <button type="button" className="alpha-button screen-only" onClick={onRetry}>Volver a consultar las fechas</button>}
    </Section>
  </div>;
}

export default function CompanyDividendDates({ entry }) {
  const [reading, setReading] = useState(null), [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setReading({ state: 'loading' });
    const timeout = setTimeout(() => controller.abort(), 15000);
    readDividendDates(entry, { signal: controller.signal })
      .then(result => { if (active) setReading(result); })
      .catch(error => { if (active) setReading({ state: 'error', error: ['identity', 'format'].includes(error.code) ? error.message : 'No se han podido consultar las fechas. Puedes reintentarlo; los fundamentales siguen disponibles.' }); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [entry, retry]);
  return <DividendDatesContent reading={reading} onRetry={() => setRetry(n => n + 1)} />;
}
