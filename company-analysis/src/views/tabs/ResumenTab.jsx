import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { KpiGrid, Kpi, Section } from '../../components/Kpi.jsx';
import { Sparkline, Range52 } from '../../components/SvgCharts.jsx';
import IndicatorInfo from '../../components/IndicatorInfo.jsx';
import { fmtBig, fmtNum, fmtPct, fmtRatio, fmtPrice, clsPN, fmtDate, pct100, difPct } from '../../lib/format.js';
import { translateCompanyDescription } from '../../lib/translate.js';

export default function ResumenTab({ symbol, fund, quote }) {
  const [eod, setEod] = useState(null);
  const [tech, setTech] = useState(null);
  const [descriptionEs, setDescriptionEs] = useState('');
  const [translationState, setTranslationState] = useState('idle');

  useEffect(() => {
    let alive = true;
    api(`/eod/${symbol}?range=1y`).then((r) => alive && setEod(r)).catch(() => {});
    api(`/technicals/${symbol}`).then((r) => alive && setTech(r)).catch(() => {});
    return () => { alive = false; };
  }, [symbol]);

  const h = fund?.Highlights || {};
  const v = fund?.Valuation || {};
  const t = fund?.Technicals || {};
  const g = fund?.General || {};
  const currency = g.CurrencyCode;
  const price = quote?.price ?? null;
  const description = String(g.Description || '').trim();

  useEffect(() => {
    let alive = true;
    if (!description) {
      setDescriptionEs('');
      setTranslationState('idle');
      return () => { alive = false; };
    }
    setDescriptionEs('');
    setTranslationState('loading');
    translateCompanyDescription(description)
      .then((translated) => {
        if (!alive) return;
        setDescriptionEs(translated);
        setTranslationState('ready');
      })
      .catch(() => {
        if (!alive) return;
        setTranslationState('error');
      });
    return () => { alive = false; };
  }, [description]);

  return (
    <>
      <Section eyebrow="Claves" title="De un vistazo">
        <KpiGrid>
          <Kpi label="Capitalización" value={fmtBig(h.MarketCapitalization, currency)} />
          <Kpi label="Ingresos (ttm)" value={fmtBig(h.RevenueTTM, currency)} />
          <Kpi label="PER (ttm)" value={fmtRatio(h.PERatio)} sub={v.ForwardPE ? `Forward ${fmtRatio(v.ForwardPE)}` : null} />
          <Kpi label="EV / EBITDA" value={fmtRatio(v.EnterpriseValueEbitda)} />
          <Kpi label="Rent. por dividendo" value={fmtPct(pct100(h.DividendYield), 2, false)} />
          <Kpi label="ROE (ttm)" value={fmtPct(pct100(h.ReturnOnEquityTTM), 1, false)} />
          <Kpi label="Margen neto" value={fmtPct(pct100(h.ProfitMargin), 1, false)} />
          <Kpi label="Beta" value={t.Beta != null ? fmtNum(t.Beta, 2) : '—'} />
        </KpiGrid>
      </Section>

      <div className="grid2 section">
        <div className="card">
          <div className="eyebrow">Cotización · último año</div>
          {eod?.candles?.length ? (
            <div style={{ marginTop: 12 }}>
              <Sparkline candles={eod.candles} />
              <Range52
                low={tech?.latest?.low52 ?? t['52WeekLow']}
                high={tech?.latest?.high52 ?? t['52WeekHigh']}
                price={price}
                fmt={(x) => fmtPrice(x, currency)}
              />
            </div>
          ) : (
            <div className="loading">Cargando serie…</div>
          )}
        </div>

        <div className="card">
          <div className="eyebrow">Precio frente a sus medias</div>
          {tech?.latest?.sma200 ? (
            <table className="tbl" style={{ marginTop: 12 }}>
              <tbody>
                <tr>
                  <td className="l"><IndicatorInfo name="Precio vs SMA 200" /></td>
                  <td className="l muted" style={{ fontSize: 11 }}>
                    {fmtNum(tech.latest.close, 2)} frente a {fmtNum(tech.latest.sma200, 2)}
                  </td>
                  <td className="num">{fmtPct(difPct(tech.latest.close, tech.latest.sma200), 1)}</td>
                </tr>
                <tr>
                  <td className="l"><IndicatorInfo name="SMA 50 vs SMA 200" /></td>
                  <td className="l muted" style={{ fontSize: 11 }}>
                    {fmtNum(tech.latest.sma50, 2)} frente a {fmtNum(tech.latest.sma200, 2)}
                  </td>
                  <td className="num">{fmtPct(difPct(tech.latest.sma50, tech.latest.sma200), 1)}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="loading">Calculando…</div>
          )}
          {tech?.latest?.perf && (
            <div className="tiny" style={{ marginTop: 10 }}>
              1 mes <b className={clsPN(tech.latest.perf.m1)}>{fmtPct(tech.latest.perf.m1)}</b> ·
              YTD <b className={clsPN(tech.latest.perf.ytd)}>{fmtPct(tech.latest.perf.ytd)}</b> ·
              1 año <b className={clsPN(tech.latest.perf.y1)}>{fmtPct(tech.latest.perf.y1)}</b>
            </div>
          )}
        </div>
      </div>

      {description && (
        <Section eyebrow="La compañía" title={null}>
          {translationState === 'loading' && <p className="lead muted">Traduciendo descripción al español…</p>}
          {translationState === 'ready' && (
            <p className="lead">{descriptionEs.slice(0, 900)}{descriptionEs.length > 900 ? '…' : ''}</p>
          )}
          {translationState === 'error' && (
            <p className="lead muted">La descripción en español no está disponible temporalmente.</p>
          )}
          <div className="tiny" style={{ marginTop: 10 }}>
            {g.FullTimeEmployees ? `${fmtNum(g.FullTimeEmployees, 0)} empleados · ` : ''}
            {g.WebURL && <a href={g.WebURL} target="_blank" rel="noreferrer">{g.WebURL}</a>}
            {g.IPODate ? ` · Cotiza desde ${fmtDate(g.IPODate)}` : ''}
          </div>
        </Section>
      )}

      <p className="note section">
        Datos fundamentales de EODHD y cotización de EODHD con Yahoo Finance como respaldo. Las cifras
        describen información histórica y no incluyen precios objetivo ni recomendaciones de terceros.
      </p>
    </>
  );
}
