import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import FundamentalTab from '../views/tabs/FundamentalTab.jsx';
import { Kpi, KpiGrid, Section } from '../components/Kpi.jsx';
import { fmtBig, fmtDate, fmtPct, fmtRatio } from '../lib/format.js';
import { marginPercent } from '../lib/financial.js';
import { toFundamentalView } from './adapter.js';
import ReviewApp from './ReviewPanel.jsx';
import '../theme.css';
import '../theme-b.css';
import './preview.css';

const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const tabs = ['Resumen', 'Fundamental', 'Informe'];
async function getLocal(path, signal) {
  const response = await fetch(`/__local-company__/${path}`, { signal, cache: 'no-store', credentials: 'omit' });
  if (!response.ok) throw new Error('No se han podido leer los datos locales. Comprueba que la prueba sigue abierta y reintenta.');
  return response.json();
}

function Summary({ company }) {
  const statement = company.statements.Income_Statement;
  const latest = statement.rows.at(-1);
  return <>
    <Section eyebrow="Último ejercicio disponible" title={latest ? `Resultados a ${fmtDate(latest.period)}` : 'Sin resultados anuales'}>
      <p>Divisa del estado: {statement.currency || 'no informada'}. No son estimaciones ni una cotización actual.</p>
      <KpiGrid>
        <Kpi label="Ingresos" value={fmtBig(latest?.totalRevenue, statement.currency)} />
        <Kpi label="Beneficio neto" value={fmtBig(latest?.netIncome, statement.currency)} />
        <Kpi label="EBITDA" value={fmtBig(latest?.ebitda, statement.currency)} />
        <Kpi label="Margen neto" value={fmtPct(marginPercent(latest?.netIncome, latest?.totalRevenue), 1, false)} />
      </KpiGrid>
    </Section>
    <Section eyebrow="Datos publicados por el proveedor" title="Múltiplos descriptivos">
      <KpiGrid>
        <Kpi label="PER (ttm)" value={fmtRatio(company.metrics.PERatio)} />
        <Kpi label="EV / EBITDA" value={fmtRatio(company.multiples.EnterpriseValueEbitda)} />
        <Kpi label="Precio / Ventas" value={fmtRatio(company.multiples.PriceSalesTTM)} />
        <Kpi label="Precio / Valor contable" value={fmtRatio(company.multiples.PriceBookMRQ)} />
      </KpiGrid>
      <p className="note">TTM: últimos doce meses del proveedor. Los múltiplos pertenecen a su instantánea, no se recalculan con el precio de hoy y no indican si conviene invertir. Margen neto = beneficio neto / ingresos × 100. «—» significa dato ausente.</p>
    </Section>
    <Section eyebrow="Cobertura" title="Qué contiene esta copia">
      <div className="local-coverage">{Object.entries(company.statements).map(([key, data]) => <div className="card" key={key}>
        <h3>{{ Income_Statement: 'Cuenta de resultados', Balance_Sheet: 'Balance', Cash_Flow: 'Flujos de caja' }[key]}</h3>
        <p>{data.rows.length} ejercicios disponibles</p>
        <p>{data.rows.length ? `${fmtDate(data.rows[0].period)} — ${fmtDate(data.rows.at(-1).period)}` : 'Sin datos'}</p>
        <p>Divisa: {data.currency || 'no informada'}</p>
      </div>)}</div>
    </Section>
  </>;
}

function LocalApp() {
  const [catalog, setCatalog] = useState(null), [catalogError, setCatalogError] = useState('');
  const [query, setQuery] = useState(''), [symbol, setSymbol] = useState('');
  const [company, setCompany] = useState(null), [error, setError] = useState('');
  const [tab, setTab] = useState('Resumen'), [retry, setRetry] = useState(0);
  const heading = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    setCatalogError('');
    getLocal('catalog', controller.signal).then(setCatalog).catch(e => { if (!controller.signal.aborted) setCatalogError(e.message); });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    if (!symbol) return;
    const controller = new AbortController();
    setCompany(null); setError(''); setTab('Resumen');
    getLocal(`company/${encodeURIComponent(symbol)}`, controller.signal).then(data => {
      if (!controller.signal.aborted) setCompany(data);
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [symbol, retry]);
  useEffect(() => { if (company) heading.current?.focus(); }, [company]);
  const matches = (catalog?.items || []).filter(item => normalize(`${item.name} ${item.symbol} ${item.isin}`).includes(normalize(query.trim())));
  return <div className="app local-preview">
    <header className="local-hero">
      <p className="eyebrow">NUVIA · Economía y Finanzas</p>
      <h1>Análisis fundamental</h1>
      <p>Comprender la empresa a través de sus cifras.</p>
      <p className="local-status">Prueba local · Solo lectura · Sin conexión a Firebase</p>
      <p>Archivo inicial sin normalizar: las escalas y monedas por ejercicio no están validadas para su integración.</p>
      <a href="/local.html?revision=1">Abrir la muestra revisada con control de importes</a>
    </header>
    <main className="main">
      <section className="local-picker" aria-labelledby="choose-company">
        <h2 id="choose-company">Elige una empresa</h2>
        <p>Compañías presentes en los archivos locales, en orden alfabético. Su presencia no implica una recomendación.</p>
        <label htmlFor="local-search">Buscar por nombre, ticker o ISIN</label>
        <input id="local-search" className="search-input" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Por ejemplo, Iberdrola o IBE.MC" />
        {!catalog && !catalogError && <p role="status">Leyendo el catálogo local…</p>}
        {catalogError && <p role="alert">{catalogError} <button onClick={() => setRetry(n => n + 1)}>Reintentar</button></p>}
        {catalog && <>
          <p role="status">{matches.length} de {catalog.items.length} compañías disponibles</p>
          {matches.length > 0 ? <div className="local-choices" aria-label="Resultados de búsqueda">{matches.map(item =>
            <button type="button" key={item.symbol} aria-pressed={symbol === item.symbol} onClick={() => setSymbol(item.symbol)}>
              <strong>{item.name}</strong><span>{item.symbol} · {item.hasStatements ? 'Estados financieros disponibles' : 'Sin estados financieros'}</span>
            </button>)}</div> : <p>No hay coincidencias en esta copia. No se consultan proveedores externos.</p>}
          {catalog.issues.length > 0 && <details><summary>Incidencias de lectura ({catalog.issues.length})</summary><ul>{catalog.issues.map(issue => <li key={issue}>{issue}</li>)}</ul></details>}
        </>}
      </section>
      {!symbol && <p className="local-empty">Selecciona una compañía para abrir su ficha. Técnico, noticias y guardado en la nube quedan fuera de esta prueba.</p>}
      {symbol && !company && !error && <p role="status">Abriendo la ficha…</p>}
      {error && <p role="alert">{error} <button onClick={() => setRetry(n => n + 1)}>Reintentar ficha</button></p>}
      {company && <article key={company.symbol}>
        <header className="company-summary local-company">
          <p className="eyebrow">Ficha descriptiva · {company.symbol}</p>
          <h2 tabIndex={-1} ref={heading}>{company.identity.name}</h2>
          <p>{[company.identity.sector, company.identity.industry, company.identity.country, company.identity.isin].filter(Boolean).join(' · ')}</p>
          <p>Fuente: {company.source.provider} · Actualización declarada por el proveedor: {fmtDate(company.source.providerUpdated)}.</p>
          <p>Copia local sin actualización automática. Divisa de cotización: {company.identity.quoteCurrency || 'no informada'}; las divisas contables se indican en cada estado.</p>
        </header>
        {company.warnings.length > 0 && <aside className="note" aria-label="Limitaciones de los datos"><ul>{company.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul></aside>}
        <div className="tabs" role="tablist" aria-label="Contenido de la empresa">{tabs.map((name, index) =>
          <button id={`tab-${name}`} key={name} role="tab" className={`tab${tab === name ? ' active' : ''}`} aria-selected={tab === name}
            aria-controls="local-panel" tabIndex={tab === name ? 0 : -1} onClick={() => setTab(name)} onKeyDown={e => {
              const next = e.key === 'ArrowRight' ? (index + 1) % tabs.length : e.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
              if (next !== null) { e.preventDefault(); setTab(tabs[next]); document.getElementById(`tab-${tabs[next]}`)?.focus(); }
            }}>{name}</button>)}</div>
        <div id="local-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0}>
          {tab === 'Resumen' && <Summary company={company} />}
          {tab === 'Informe' && <><Section eyebrow="Documento de lectura" title={`Informe descriptivo · ${company.identity.name}`}>
            <p>Reúne la misma información histórica, sin añadir conclusiones de inversión. Informe en pantalla; exportación y archivo en la nube no incluidos en esta fase.</p>
          </Section><Summary company={company} /></>}
          {tab !== 'Resumen' && <FundamentalTab fund={toFundamentalView(company)} historicalOnly yearlyLimit={5} />}
        </div>
      </article>}
      <footer className="note section">NUVIA informa, explica y calcula. Tú comprendes y decides. Esta prueba no activa el módulo en la web publicada ni sustituye la validación de los datos y del cumplimiento antes de su integración.</footer>
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode>
  {new URLSearchParams(window.location.search).get('revision') === '1' ? <ReviewApp /> : <LocalApp />}
</React.StrictMode>);
