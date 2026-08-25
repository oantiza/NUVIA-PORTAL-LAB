import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { api } from '../api.js';
import { PhaseHeader, Section } from '../components/Kpi.jsx';
import SearchBox from '../components/SearchBox.jsx';
import AnalysisBanner from '../components/AnalysisBanner.jsx';
import { fmtPrice, fmtPct, clsPN } from '../lib/format.js';

export default function Dashboard() {
  const [items, setItems] = useState(null);
  const [quotes, setQuotes] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'av_watchlist'), orderBy('addedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error(err);
      setItems([]);
    });
  }, []);

  useEffect(() => {
    if (!items?.length) return;
    let alive = true;
    (async () => {
      const qr = await Promise.allSettled(items.map((it) => api(`/quote/${it.symbol}`)));
      if (!alive) return;
      const qMap = {};
      qr.forEach((r, i) => { if (r.status === 'fulfilled') qMap[items[i].symbol] = r.value; });
      setQuotes(qMap);
    })();
    return () => { alive = false; };
  }, [items]);

  async function quitar(e, symbol) {
    e.stopPropagation();
    await deleteDoc(doc(db, 'av_watchlist', symbol));
  }

  return (
    <>
      <AnalysisBanner />

      <PhaseHeader number="01" eyebrow="¿Qué compañía quieres estudiar?" title="Elige una empresa" />
      <section className="watchlist-search" aria-label="Buscar una empresa">
          <label>Compañía · nombre, ticker o ISIN</label>
          <SearchBox onPick={(item) => navigate(`/empresa/${item.symbol}`)} placeholder="Apple, SAN.MC, AIR.PA…" />
          <p>Abre una ficha para consultar datos históricos, fundamentales, indicadores técnicos y noticias atribuidas.</p>
      </section>

      <PhaseHeader number="02" eyebrow="Archivo personal" title="Compañías guardadas" />

      {items === null && <div className="loading">Cargando…</div>}

      {items?.length === 0 && (
        <div className="empty">
          <div className="big">Todavía no has guardado ninguna compañía</div>
          Busca una empresa por nombre, ticker o ISIN y añádela a tu lista desde su ficha.
        </div>
      )}

      {items?.length > 0 && (
        <Section>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th className="l">Valor</th>
                  <th>Último</th>
                  <th>Var. día</th>
                  <th>Mercado</th>
                  <th>Divisa</th>
                  <th>Fuente</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const q = quotes[it.symbol];
                  return (
                    <tr key={it.symbol} className="click" onClick={() => navigate(`/empresa/${it.symbol}`)}>
                      <td className="l">
                        <strong>{it.name || it.symbol}</strong>
                        <div className="tiny">{it.symbol} · {it.exchange || '—'}</div>
                      </td>
                      <td className="num">{q ? fmtPrice(q.price, it.currency) : '…'}</td>
                      <td className={`num ${q ? clsPN(q.changePct) : ''}`}>{q ? fmtPct(q.changePct) : '…'}</td>
                      <td className="num">{it.exchange || '—'}</td>
                      <td className="num">{it.currency || '—'}</td>
                      <td className="num tiny">{q?.source === 'yahoo' ? 'Yahoo' : q ? 'EODHD' : '…'}</td>
                      <td>
                        <button className="mini-btn" aria-label={`Quitar ${it.name || it.symbol} de la lista`} onClick={(e) => quitar(e, it.symbol)}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="tiny" style={{ marginTop: 10 }}>
            Lista organizativa personal. Cotizaciones vía EODHD con Yahoo Finance como respaldo; no ordena ni califica las compañías.
          </p>
        </Section>
      )}
    </>
  );
}
