import React, { useEffect, useRef, useState } from 'react';
import { fmtDate, fmtNum, fmtPct, fmtRatio, pct100 } from '../lib/format.js';

const date = value => value ? fmtDate(value) : 'No consta';
function Value({ cell, currency }) {
  if (cell.state === 'missing') return <span title={cell.reason}>Sin dato</span>;
  if (cell.state === 'blocked') return <span title={cell.reason} aria-label={`Pendiente: ${cell.reason}`}>Pendiente</span>;
  return <span title={cell.reason}>{fmtNum(cell.value, 2)} {currency}</span>;
}

export function ReviewCompany({ company }) {
  return <>
    <div className="review-metadata">
      <p><strong>Fuente</strong><br />EODHD · copia local</p>
      <p><strong>Actualización del proveedor</strong><br />{date(company.providerUpdatedOn)}</p>
      <p><strong>Descarga de fundamentales</strong><br />{date(company.downloadedAt)}</p>
    </div>
    <aside className="review-notice" aria-label="Limitaciones de la muestra">
      <h3>Antes de interpretar los datos</h3>
      <p>«Pendiente»: existe una cifra, pero faltan metadatos para mostrarla correctamente. «Sin dato»: la fuente no proporciona esa cifra. Ninguno significa cero.</p>
      <ul>{company.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>
      <p>Esta revisión no acredita la exactitud contable ni autoriza publicación.</p>
    </aside>
    {company.statements.map(statement => <section key={statement.key} className="section review-statement" aria-labelledby={`review-${statement.key}`}>
      <h3 id={`review-${statement.key}`}>{statement.label}</h3>
      {statement.rows.length === 0 ? <p>No hay ejercicios en esta muestra.</p> : <>
        <p>{statement.rows.length} ejercicios en la muestra · Último cierre: {date(statement.rows[0].period)}. Cada columna conserva su moneda y fecha.</p>
        <div className="review-table" role="region" tabIndex={0} aria-label={`Tabla de ${statement.label}`}>
          <table className="tbl">
            <caption>{statement.label}: datos por cierre anual. Los importes habilitados se expresan en unidades de la moneda indicada.</caption>
            <thead><tr><th scope="col" className="l">Concepto</th>{statement.rows.map(row => <th scope="col" key={row.period}>{date(row.period)}</th>)}</tr></thead>
            <tbody>
              <tr><th scope="row" className="l">Moneda del ejercicio</th>{statement.rows.map(row => <td key={row.period}>{row.currency || 'No consta'}</td>)}</tr>
              <tr><th scope="row" className="l">Escala de origen</th>{statement.rows.map(row => <td key={row.period}>{({ 1: 'Unidades', 1000: 'Miles', 1000000: 'Millones' })[row.scale] || 'No acreditada'}</td>)}</tr>
              <tr><th scope="row" className="l">Presentación</th>{statement.rows.map(row => <td key={row.period}>{date(row.filedOn)}</td>)}</tr>
              {statement.fields.map(field => <tr key={field.key}><th scope="row" className="l">{field.label}</th>{statement.rows.map(row => <td key={row.period}>
                <Value cell={row.cells[field.key]} currency={row.currency} />
              </td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </>}
    </section>)}
    <section className="section review-statement" aria-labelledby="review-ratios">
      <h3 id="review-ratios">Ratios de la instantánea archivada</h3>
      {!company.ratios ? <p>Esta muestra no contiene una instantánea de ratios.</p> : <>
        <p>Lectura del archivo: {date(company.ratios.observedOn)}. No es una actualización de mercado ni una cotización de hoy. No se recalculan con precios actuales.</p>
        <p>TTM significa últimos doce meses; las variaciones interanuales corresponden al trimestre del proveedor. El periodo concreto se indica solo si consta; no se deduce del cierre anual.</p>
        <div className="review-table" role="region" tabIndex={0} aria-label="Tabla de ratios archivados"><table className="tbl">
          <caption>Métricas descriptivas del proveedor, sin interpretación sobre la conveniencia de invertir.</caption>
          <thead><tr><th scope="col" className="l">Métrica</th><th scope="col">Dato</th><th scope="col">Cierre del periodo</th></tr></thead>
          <tbody>{company.ratios.items.map(item => <tr key={item.key}><th scope="row" className="l">{item.label}</th>
            <td>{item.value === null ? 'Sin dato' : item.unit === 'fraction' ? fmtPct(pct100(item.value), 2, false) : fmtRatio(item.value, 2)}</td>
            <td>{date(item.period_end)}</td></tr>)}</tbody>
        </table></div>
      </>}
    </section>
  </>;
}

export default function ReviewApp() {
  const [data, setData] = useState(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const [symbol, setSymbol] = useState('');
  const heading = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError(''); setSymbol('');
    fetch('/__local-company__/review', { signal: controller.signal, cache: 'no-store', credentials: 'omit' })
      .then(response => { if (!response.ok) throw new Error('No se ha podido leer la muestra local.'); return response.json(); })
      .then(value => { if (!controller.signal.aborted) setData(value); })
      .catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [retry]);
  const company = data?.companies?.find(c => c.symbol === symbol);
  useEffect(() => { if (company) heading.current?.focus(); }, [company]);
  return <div className="app local-preview review-preview">
    <header className="local-hero">
      <p className="eyebrow">NUVIA · Economía y Finanzas</p>
      <h1>Fundamentales · Muestra revisada</h1>
      <p>Datos, fechas y límites antes de conectar el módulo.</p>
      <p className="local-status">Solo lectura local · Sin conexión a Firebase · Publicación bloqueada</p>
      <a href="/local.html">Volver al archivo inicial, sin normalizar</a>
    </header>
    <main className="main">
      {!data && !error && <p role="status">Leyendo la muestra verificada…</p>}
      {(error || data?.state === 'unavailable') && <section className="review-notice" role="alert"><h2>Muestra no disponible</h2>
        <p>{error || data.message}</p><button type="button" onClick={() => setRetry(n => n + 1)}>Reintentar lectura</button>
      </section>}
      {data?.state === 'ready' && <>
        <section className="local-picker" aria-labelledby="review-choose">
          <h2 id="review-choose">Elige una empresa de la muestra</h2>
          <p>{data.companies.length} empresas · {data.recordCount} registros. Selección por casos de calidad del dato, no por mérito inversor.</p>
          <p>Generada: {date(data.generatedOn)} · Catálogo observado: {date(data.catalogObservedOn)}. No se ha consultado la base de nuevo.</p>
          <div className="local-choices" aria-label="Empresas de la muestra">{data.companies.map(item => <button key={item.symbol} type="button" aria-pressed={symbol === item.symbol} onClick={() => setSymbol(item.symbol)}>
            <strong>{item.name}</strong><span>{item.symbol} · {item.assetId}</span>
          </button>)}</div>
        </section>
        {!company && <p className="local-empty">Selecciona una empresa para revisar sus estados y las limitaciones por ejercicio.</p>}
        {company && <article key={company.symbol}>
          <header className="company-summary local-company"><p className="eyebrow">Ficha de revisión · {company.symbol}</p>
            <h2 ref={heading} tabIndex={-1}>{company.name}</h2>
            <p>{company.assetId} · Moneda de cotización: {company.quoteCurrency || 'No consta'}. No determina la moneda de sus estados.</p>
          </header>
          <ReviewCompany company={company} />
        </article>}
      </>}
      <footer className="note section">NUVIA informa, explica y calcula. Tú comprendes y decides. Esta muestra no activa el módulo en la alfa. Identidad, unidades, fechas, derechos y revisiones pendientes deben resolverse antes de integrar y publicar.</footer>
    </main>
  </div>;
}
