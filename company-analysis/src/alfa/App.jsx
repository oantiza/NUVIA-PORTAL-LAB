import React, { useEffect, useRef, useState } from 'react';
import { searchCompanies } from './client.js';
import { readCompanyIndex } from './catalog.js';
import { loadCompany } from './remote.js';
import { entradaActual, cambioIdentidad } from '../../../js/nuvia-identidades.js';
import { CompanySummary, CompanyRatios, CompanyStatements, CompanyOwnership, CompanySnapshot } from './CompanyReport.jsx';
import { fmtDate } from '../lib/format.js';
import CompanyDividendDates from './CompanyDividendDates.jsx';
import CompanyTechnical from './CompanyTechnical.jsx';
import { displayWarnings } from '../../alfa/metadata.mjs';
import { companyDisplayName } from '../../alfa/display-name.mjs';

const tabs = ['Resumen', 'Fundamentales', 'Técnico', 'Informe'];
export default function AlphaApp() {
  const [snapshot, setSnapshot] = useState(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const [query, setQuery] = useState(''), [symbol, setSymbol] = useState(() => new URLSearchParams(location.search).get('symbol') || '');
  const [tab, setTab] = useState('Resumen'), [limit, setLimit] = useState(5);
  const [reading, setReading] = useState(null), [companyRetry, setCompanyRetry] = useState(0);
  const heading = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error('La lectura está tardando demasiado. Reintenta.')), 15000);
    let active = true;
    setError('');
    readCompanyIndex({ signal: controller.signal }).then(data => { if (active) setSnapshot({ ...data, entries: data.entries.map(entradaActual) }); })
      .catch(e => { if (active) setError(e.message); }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [retry]);
  useEffect(() => { if (symbol) heading.current?.focus(); }, [symbol, snapshot]);
  const entry = snapshot?.entries.find(item => item.symbol === symbol);
  useEffect(() => {
    if (!entry) return;
    const controller = new AbortController();
    let active = true;
    setReading({ symbol: entry.symbol, state: 'loading' });
    const timeout = setTimeout(() => controller.abort(new Error('La lectura está tardando demasiado. Reintenta.')), 15000);
    loadCompany(entry, { signal: controller.signal })
      .then(result => { if (active) setReading({ ...result, symbol: entry.symbol }); })
      .catch(e => { if (active) setReading({ symbol: entry.symbol, state: 'error', error: (e.code || controller.signal.aborted) ? e.message : 'No se ha podido consultar la base propia. Puedes reintentar.' }); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [entry, companyRetry]);
  // No conservar cifras de otra selección mientras llega su respuesta.
  const current = reading?.symbol === entry?.symbol ? reading : null;
  const company = current?.company;
  const warnings = company ? displayWarnings(company).map(warning => companyDisplayName(entry) !== entry.name && warning.startsWith('El nombre del proveedor contiene')
    ? 'El nombre mostrado corrige la codificación con la grafía del aviso legal del emisor (grupotsk.com/aviso-legal). El texto original del proveedor se conserva intacto en la fuente; no cambian la identidad ni las cifras.' : warning) : [];
  const identityChange = entry && cambioIdentidad(entry.assetId);
  const matches = searchCompanies(snapshot?.entries || [], query);
  function select(item) {
    setSymbol(item.symbol); setTab('Resumen');
    const url = new URL(location.href); url.searchParams.set('symbol', item.symbol); history.replaceState(null, '', url);
  }
  return <div className="alpha-root">
    <header className="alpha-hero">
      <p className="eyebrow">NUVIA · Economía y Finanzas</p>
      <h1>Análisis de empresas</h1><p>Comprender una empresa a través de sus cifras y su historial de precios.</p>
      <p className="alpha-source">Alfa · Sin cuentas · Fundamentales y precios históricos de EODHD en la base propia de NUVIA. Se consulta la última carga disponible; no son datos en tiempo real.</p>
    </header>
    <main className="main">
      <section className="alpha-picker screen-only" aria-labelledby="alpha-search-title">
        <h2 id="alpha-search-title">Busca una empresa</h2>
        <label htmlFor="alpha-query">Nombre, ticker o ISIN</label>
        <input type="search" id="alpha-query" className="search-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Por ejemplo, Iberdrola, IBE.MC o su ISIN" />
        {!snapshot && !error && <p role="status">Cargando el catálogo…</p>}
        {error && <p role="alert">{error} <button className="alpha-button" onClick={() => setRetry(n => n + 1)}>Reintentar</button></p>}
        {snapshot && <>
          <p role="status">{matches.length} de {snapshot.entries.length} empresas en el índice local · Los fundamentales se consultan en la base propia al elegir una empresa.</p>
          <div className="alpha-choices" aria-label="Empresas en orden alfabético">{matches.map(item => <button key={item.assetId} type="button" aria-pressed={symbol === item.symbol} onClick={() => select(item)}>
            <strong>{companyDisplayName(item)}</strong><span>{item.symbol} · Consultar ficha</span>
          </button>)}</div>
          {!matches.length && <p>No hay coincidencias. Prueba con el nombre, ticker o ISIN.</p>}
        </>}
      </section>
      {!symbol && <p className="alpha-empty">Elige una empresa para consultar su identidad, ratios, cuentas anuales y gráficos. No se selecciona ninguna por defecto.</p>}
      {symbol && snapshot && !entry && <p role="status">El símbolo solicitado no figura en este catálogo. Puedes buscar otra empresa.</p>}
      {entry && <article>
        <header className="alpha-company">
          <p className="eyebrow">{entry.symbol} · Ficha descriptiva</p>
          <h2 tabIndex={-1} ref={heading}>{companyDisplayName(entry)}</h2>
          <p>ISIN: {entry.isin} · Mercado: {company?.identity.exchange || entry.symbol.split('.').at(-1)} · Divisa de cotización: {entry.quoteCurrency}</p>
          {company && <p>{[company.identity.sector, company.identity.industry, company.identity.country].filter(Boolean).join(' · ')}</p>}
          {identityChange && <p>{identityChange.note} <a href={identityChange.source} target="_blank" rel="noopener noreferrer">Aviso oficial</a></p>}
        </header>
        {(!current || current.state === 'loading') && <p role="status">Consultando los fundamentales en la base propia…</p>}
        {current?.state === 'error' && <div className="alpha-notice" role="alert"><p>{current.error}</p><button className="alpha-button" onClick={() => setCompanyRetry(n => n + 1)}>Reintentar consulta</button></div>}
        {current?.state === 'missing' && <div className="alpha-notice" role="status">
          <h3>{entry.state === 'isin_conflict' ? 'Los identificadores del catálogo y del archivo no coinciden' : 'No hay fundamentales cargados para esta identidad en la base propia'}</h3>
          <p>{entry.state === 'isin_conflict' ? `ISIN del catálogo: ${entry.isin}. Archivo: ${entry.identityCandidates.map(c => `${c.symbol} · ${c.isin || 'sin ISIN'}`).join('; ')}. La decisión sobre esta identidad está pendiente de consulta al fundador; no se cambia el universo.` : 'Esto no demuestra que el proveedor no tenga cobertura. Puede haber una carga o revisión de identidad pendiente. No se sustituyen las cifras por ceros ni por las de otra empresa.'}</p>
          <button className="alpha-button" onClick={() => setCompanyRetry(n => n + 1)}>Reintentar consulta</button>
        </div>}
        <div className="alpha-toolbar screen-only">
          <div className="tabs" role="tablist" aria-label="Contenido de la empresa">{tabs.map((name, index) => <button role="tab" id={`alpha-tab-${index}`} key={name} className={`tab${tab === name ? ' active' : ''}`} aria-selected={tab === name} aria-controls="alpha-panel" tabIndex={tab === name ? 0 : -1} onClick={() => setTab(name)} onKeyDown={e => {
            const next = e.key === 'ArrowRight' ? (index + 1) % tabs.length : e.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
            if (next !== null) { e.preventDefault(); setTab(tabs[next]); document.getElementById(`alpha-tab-${next}`)?.focus(); }
          }}>{name}</button>)}</div>
          {tab !== 'Técnico' && <label>Ejercicios <select value={limit} onChange={e => setLimit(e.target.value)}><option value="5">Últimos 5</option><option value="10">Últimos 10</option><option value="all">Todos los disponibles</option></select></label>}
          <button type="button" className="alpha-button" onClick={() => window.print()}>Imprimir / guardar PDF</button>
        </div>
        <div id="alpha-panel" role="tabpanel" aria-labelledby={`alpha-tab-${tabs.indexOf(tab)}`} tabIndex={0}>
        {tab === 'Técnico' && <CompanyTechnical key={entry.assetId} entry={entry} />}
        {company && <div className={tab === 'Técnico' ? 'print-only' : ''}>
          <aside className="alpha-notice" aria-label="Procedencia y límites">
            <p><strong>{current.origin === 'database' ? 'Consulta desde la base propia.' : 'Respaldo local · Sin verificar en la base.'}</strong></p>
            {current.notice && <p role="status">{current.notice}</p>}
            <p><strong>Fuente: {company.source.provider}.</strong> Actualización declarada por el proveedor: {fmtDate(company.source.providerUpdated)}. Fecha de descarga del fundamental: {company.source.downloadedAt ? fmtDate(company.source.downloadedAt) : 'no disponible'}.</p>
            <p>{current.origin === 'database' ? `Carga en la base: ${fmtDate(current.loadedAt)}.` : `Respaldo preparado: ${fmtDate(snapshot.preparedAt)}.`} Índice local de empresas observado: {fmtDate(snapshot.catalogObservedAt)}. Estas fechas no equivalen a una actualización en tiempo real.</p>
            <button className="alpha-button screen-only" onClick={() => setCompanyRetry(n => n + 1)}>Volver a consultar la base</button>
            <details className="screen-only"><summary>Monedas, escalas y otras limitaciones ({warnings.length})</summary><ul>{warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></details>
            <ul className="print-only">{warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
          </aside>
          <div>
            <div className={tab === 'Fundamentales' ? 'print-only' : ''}><CompanySummary company={company} /></div>
            <CompanyRatios company={company} />
            <CompanyDividendDates key={entry.assetId} entry={entry} />
            <div className={tab === 'Resumen' ? 'print-only' : ''}><CompanyStatements company={company} limit={limit} /><CompanySnapshot company={company} limit={limit} /><CompanyOwnership company={company} /></div>
          </div>
        </div>}
        </div>
      </article>}
      <footer className="note section">NUVIA informa, explica y calcula. Tú comprendes y decides. «—» = dato ausente. k = mil; M = millón; mm = mil millones; B = billón. Estas abreviaturas describen el número recibido. No son una acreditación de su escala contable ni una recomendación de inversión.</footer>
    </main>
  </div>;
}
