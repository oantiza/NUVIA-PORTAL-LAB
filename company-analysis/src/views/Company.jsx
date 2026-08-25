import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { api } from '../api.js';
import { fmtPrice, fmtPct, clsPN } from '../lib/format.js';
import ResumenTab from './tabs/ResumenTab.jsx';
import FundamentalTab from './tabs/FundamentalTab.jsx';
import TecnicoTab from './tabs/TecnicoTab.jsx';
import NoticiasTab from './tabs/NoticiasTab.jsx';
import InformeTab from './tabs/InformeTab.jsx';
import AnalysisBanner from '../components/AnalysisBanner.jsx';
import SearchBox from '../components/SearchBox.jsx';
import { PhaseHeader } from '../components/Kpi.jsx';

const TABS = [
  { name: 'Resumen', number: '01', eyebrow: 'La compañía, de un vistazo', title: 'Qué empresa estás mirando' },
  { name: 'Fundamental', number: '02', eyebrow: 'Análisis fundamental completo', title: 'Qué cuentan sus estados financieros' },
  { name: 'Técnico', number: '03', eyebrow: 'Lectura histórica del precio', title: 'Análisis técnico, sin señales' },
  { name: 'Noticias', number: '04', eyebrow: 'Actualidad atribuida', title: 'Noticias, con fecha y medio' },
  { name: 'Informe', number: '05', eyebrow: 'La misma información, ordenada', title: 'Informe descriptivo' }
];

function logoUrl(fund) {
  const u = fund?.General?.LogoURL;
  if (!u) return null;
  return u.startsWith('http') ? u : `https://eodhd.com${u}`;
}

export default function Company() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Resumen');
  const [fund, setFund] = useState(null);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  const [enLista, setEnLista] = useState(false);

  useEffect(() => {
    setTab('Resumen'); setFund(null); setQuote(null); setError(null);
    let alive = true;
    api(`/fundamentals/${symbol}`)
      .then((r) => alive && setFund(r.data))
      .catch((e) => alive && setError(e.message));
    api(`/quote/${symbol}`)
      .then((r) => alive && setQuote(r))
      .catch(() => {});
    return () => { alive = false; };
  }, [symbol]);

  useEffect(() => {
    return onSnapshot(doc(db, 'av_watchlist', symbol), (snap) => setEnLista(snap.exists()));
  }, [symbol]);

  async function toggleLista() {
    const ref = doc(db, 'av_watchlist', symbol);
    if (enLista) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, {
        symbol,
        name: fund?.General?.Name || symbol,
        exchange: fund?.General?.Exchange || symbol.split('.').pop(),
        currency: fund?.General?.CurrencyCode || null,
        addedAt: serverTimestamp()
      });
    }
  }

  const g = fund?.General;
  const currency = g?.CurrencyCode;
  const logo = logoUrl(fund);
  const tabMeta = TABS.find((item) => item.name === tab) || TABS[0];

  if (error) {
    return (
      <>
        <div className="eyebrow">Ficha de valor</div>
        <h1 className="page-title">{symbol}</h1>
        <hr className="rule" />
        <div className="error-box">No se han podido cargar los datos: {error}</div>
      </>
    );
  }

  return (
    <>
      <AnalysisBanner />

      <section className="company-switcher" aria-label="Cambiar de compañía">
        <div>
          <label>Compañía · nombre, ticker o ISIN</label>
          <SearchBox onPick={(item) => navigate(`/empresa/${item.symbol}`)} placeholder="Buscar otra compañía…" />
        </div>
        <button className="btn-ghost" type="button" onClick={() => navigate('/')}>Volver a mi lista</button>
      </section>

      <section className="company-summary" aria-label="Cabecera de la compañía">
        <div className="co-head">
          {logo && <img className="co-logo" src={logo} alt="" onError={(e) => { e.target.style.display = 'none'; }} />}
          <div className="co-title">
            <div className="eyebrow">Ficha descriptiva</div>
            <h1>{g?.Name || symbol}</h1>
            <div className="co-meta">
              <span><strong>{symbol}</strong></span>
              <span className="sep">·</span>
              <span>{g?.Exchange || '—'}</span>
              <span className="sep">·</span>
              <span>{g?.Sector || '—'}{g?.Industry ? ` — ${g.Industry}` : ''}</span>
              <span className="sep">·</span>
              <span>{g?.CountryName || '—'}</span>
              {g?.ISIN && (<><span className="sep">·</span><span>ISIN {g.ISIN}</span></>)}
            </div>
          </div>
          <div className="co-price">
            <div className="p">{quote ? fmtPrice(quote.price, currency) : '…'}</div>
            {quote && (
              <div className={`c ${clsPN(quote.changePct)}`}>
                {fmtPrice(quote.change, currency)} · {fmtPct(quote.changePct)} hoy
              </div>
            )}
            <div className="src">{quote?.source === 'yahoo' ? 'Fuente: Yahoo Finance · respaldo' : quote ? 'Fuente: EODHD' : ''}</div>
            <div className="company-save">
              <button className={enLista ? 'btn-ghost' : 'btn-solid'} onClick={toggleLista} disabled={!fund}>
                {enLista ? 'Quitar de mi lista' : 'Guardar en mi lista'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="tabs no-print" role="tablist" aria-label="Contenido de la ficha">
        {TABS.map((item) => (
          <button
            key={item.name}
            role="tab"
            aria-selected={tab === item.name}
            className={`tab${tab === item.name ? ' active' : ''}`}
            onClick={() => setTab(item.name)}
          >
            {item.name}
          </button>
        ))}
      </div>

      <PhaseHeader number={tabMeta.number} eyebrow={tabMeta.eyebrow} title={tabMeta.title} />

      {!fund && <div className="loading">Cargando datos de la compañía…</div>}

      {fund && tab === 'Resumen' && <ResumenTab symbol={symbol} fund={fund} quote={quote} />}
      {fund && tab === 'Fundamental' && <FundamentalTab fund={fund} />}
      {fund && tab === 'Técnico' && <TecnicoTab symbol={symbol} currency={currency} />}
      {fund && tab === 'Noticias' && <NoticiasTab symbol={symbol} name={g?.Name} />}
      {fund && tab === 'Informe' && <InformeTab symbol={symbol} fund={fund} quote={quote} />}
    </>
  );
}
