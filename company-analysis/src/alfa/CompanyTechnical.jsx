import React, { useEffect, useMemo, useRef, useState } from 'react';
import { readPrices } from './prices.js';
import { readOhlcv } from './ohlcv.js';
import { technicalOhlcv } from '../../alfa/ohlcv.mjs';
import { technicalAnalysis, yearsBefore, daysBefore } from '../../alfa/technical.mjs';
import TechnicalChart from './TechnicalChart.jsx';
import { Section, Kpi, KpiGrid } from '../components/Kpi.jsx';
import { fmtNum, fmtPct, fmtDate } from '../lib/format.js';

const RANGES = [['6m', '6 meses'], ['1y', '1 año'], ['3y', '3 años'], ['5y', '5 años']];
const PRICE = [{ key: 'value', label: 'Cierre ajustado', color: '#102c50' }, { key: 'sma50', label: 'SMA 50', color: '#2b7284' }, { key: 'sma200', label: 'SMA 200', color: '#946822' }];
const BANDS = [{ key: 'upper', label: 'Banda superior', color: '#745a9b' }, { key: 'lower', label: 'Banda inferior', color: '#745a9b' }];
const RSI = [{ key: 'rsi', label: 'RSI (14)', color: '#946822' }];
const MACD = [{ key: 'macd', label: 'MACD (12, 26)', color: '#2b7284' }, { key: 'signal', label: 'Media de referencia (9)', color: '#946822' }, { key: 'histogram', label: 'Diferencia', color: '#a7b6c6', histogram: true }];
const CANDLE = {key:'candle',label:'Velas ajustadas · serie derivada',color:'#102c50',candlestick:true};
const VOLUME = [{key:'volume',label:'Volumen del proveedor · ajustado por splits',color:'#2b7284',histogram:true}];
const ATR = [{key:'atr',label:'ATR de Wilder (14)',color:'#745a9b'}];
const LEVELS = [30, 70], NONE = [];
const number = v => Number.isFinite(v) ? fmtNum(v, 2) : '—';
// El motor devuelve fracciones; fmtPct recibe puntos porcentuales.
const pct = v => Number.isFinite(v) ? fmtPct(v * 100, 1) : '—';
const difference = (a, b) => Number.isFinite(a) && Number.isFinite(b) && b !== 0 ? a / b - 1 : null;

export default function CompanyTechnical({ entry }) {
  const [reading, setReading] = useState(null), [retry, setRetry] = useState(0);
  const [range, setRange] = useState('1y'), [bands, setBands] = useState(false);
  const [basis,setBasis] = useState('ohlcv'), [style,setStyle] = useState('candles');
  const methods = useRef(null);
  useEffect(() => {
    let wasOpen = null;
    const before = () => { if (methods.current && wasOpen === null) { wasOpen = methods.current.open; methods.current.open = true; } };
    const after = () => { if (methods.current && wasOpen !== null) methods.current.open = wasOpen; wasOpen = null; };
    window.addEventListener('beforeprint', before); window.addEventListener('afterprint', after);
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); };
  }, []);
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    setReading({ state: 'loading', basis });
    const timeout = setTimeout(() => controller.abort(), 20000);
    (basis === 'ohlcv' ? readOhlcv : readPrices)(entry, { signal: controller.signal })
      .then(data => { if (active) setReading({ state: 'ready', data, basis }); })
      .catch(error => { if (active) setReading({ state: 'error', basis, error: ['prices','ohlcv'].includes(error.code) ? error.message : 'No se han podido consultar los precios. Puedes reintentar; los fundamentales y la otra serie siguen disponibles.' }); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [entry, retry, basis]);
  const current = reading?.basis === basis ? reading : null;
  const data = current?.data, isOhlcv = !!data?.raw;
  const analysis = useMemo(() => data ? data.raw ? technicalOhlcv(data.raw) : technicalAnalysis(data.points) : null, [data]);
  const latest = analysis?.latest;
  const target = latest ? range === '6m' ? daysBefore(latest.date, 183) : yearsBefore(latest.date, Number(range[0])) : null;
  const rows = useMemo(() => analysis?.rows.filter(p => p.date >= target) || [], [analysis, target]);
  const priceSeries = useMemo(() => [...(isOhlcv && style === 'candles' ? [CANDLE,...PRICE.slice(1)] : PRICE),...(bands ? BANDS : [])], [bands,isOhlcv,style]);
  return <section className="alpha-technical" aria-label="Análisis técnico">
    <Section eyebrow="Lectura histórica · Sin señales" title="Análisis técnico">
      <label className="alpha-technical-source screen-only">Serie de datos
        <select aria-label="Serie de datos" value={basis} onChange={e => setBasis(e.target.value)}>
          <option value="ohlcv">Histórico OHLCV · velas, cierres y volumen</option>
          <option value="legacy">Cierres anteriores · serie independiente</option>
        </select>
      </label>
      {(!current || current.state === 'loading') && <p role="status">Consultando los precios de la empresa…</p>}
      {current?.state === 'error' && <p role="alert">{current.error}</p>}
      {current && current.state !== 'loading' && <button className="alpha-button screen-only" onClick={() => setRetry(n => n + 1)}>Volver a consultar los precios</button>}
      {data && latest && <>
        <p className="note" data-testid="technical-source">Fuente: EODHD, {isOhlcv ? 'histórico OHLCV' : 'serie de cierres anteriores'} guardado en la base propia. Último dato: <time dateTime={latest.date}>{fmtDate(latest.date)}</time>.
          {' '}Consulta al proveedor: {fmtDate(data.fetchedAt)}.{!isOhlcv && <> Actualización de la ficha: {fmtDate(data.loadedAt)}.</>} No son cotizaciones en tiempo real.</p>
        {isOhlcv ? <p className="alpha-notice">Velas ajustadas: serie derivada de los precios originales mediante el factor cierre ajustado / cierre original. No son precios negociados. Línea, medias, RSI, MACD, Bollinger y ATR usan esta misma descarga; no se mezclan con la serie de cierres anteriores.</p>
          : <p className="alpha-notice">Serie de cierres anteriores: conserva su propia fecha y sus datos originales. Para consultar velas, volumen y ATR, elige «Histórico OHLCV» en el selector.</p>}
        {isOhlcv && <div className="alpha-technical-controls screen-only" role="group" aria-label="Representación del precio">
          <button className="alpha-button" aria-pressed={style === 'candles'} onClick={() => setStyle('candles')}>Velas ajustadas</button>
          <button className="alpha-button" aria-pressed={style === 'line'} onClick={() => setStyle('line')}>Línea de cierre</button>
        </div>}
        <div className="alpha-technical-controls screen-only" role="group" aria-label="Periodo del análisis técnico">
          {RANGES.map(([key, label]) => <button type="button" className="alpha-button" key={key} aria-pressed={range === key} onClick={() => setRange(key)}>{label}</button>)}
          <button type="button" className="alpha-button" aria-pressed={bands} onClick={() => setBands(v => !v)}>Bandas de Bollinger</button>
        </div>
        <p>Intervalo solicitado: {RANGES.find(([key]) => key === range)[1]}. Datos mostrados: {fmtDate(rows[0]?.date)} — {fmtDate(latest.date)} · {rows.length} observaciones · {data.currency}.
          {data.points[0].date > target && ' El historial disponible es más corto que el intervalo solicitado.'}</p>
        {analysis.gaps.length > 0 && <p className="alpha-notice">Se observan {analysis.gaps.length} saltos de más de diez días naturales en el historial. Los indicadores se reinician después de cada salto; no se imputan sesiones ni se conectan los tramos del gráfico.</p>}
        <TechnicalChart rows={rows} series={priceSeries} title={`${isOhlcv && style === 'candles' ? 'Velas ajustadas · serie derivada' : 'Evolución del cierre ajustado'} · ${data.currency}`} levels={NONE} height={360} />
        {isOhlcv && style === 'candles' && <p className="note">Vela azul: cierre igual o superior a la apertura; violeta: cierre inferior a la apertura. Los colores describen la sesión, no una señal.</p>}
        <p className="note screen-only">Arrastra para desplazarte y usa la rueda o el gesto de ampliación para examinar el gráfico. La tabla inferior ofrece los mismos datos.</p>
        <div className="alpha-technical-grid">
          {isOhlcv && <TechnicalChart rows={rows} series={VOLUME} title="Volumen diario · acciones, ajustado por splits" levels={NONE} />}
          {isOhlcv && <TechnicalChart rows={rows} series={ATR} title={`ATR (14) · rango de velas ajustadas · ${data.currency}`} levels={NONE} />}
          <TechnicalChart rows={rows} series={RSI} title="RSI (14) · Referencias de escala 30 y 70" levels={LEVELS} />
          <TechnicalChart rows={rows} series={MACD} title="MACD · Medias exponenciales 12, 26 y 9" levels={NONE} />
        </div>
        <Section eyebrow={`Última observación · ${fmtDate(latest.date)}`} title="Indicadores históricos">
          <KpiGrid>
            <Kpi label="Cierre ajustado" value={number(latest.value)} sub={data.currency} />
            {isOhlcv && <Kpi label="ATR (14)" value={number(latest.atr)} sub={`${data.currency} · serie derivada`} />}
            {isOhlcv && <Kpi label="Volumen de la sesión" value={Number.isFinite(latest.volume) ? fmtNum(latest.volume,0) : '—'} sub="Acciones · ajustado por splits" />}
            <Kpi label="RSI (14)" value={number(latest.rsi)} />
            <Kpi label="SMA 50 / 200" value={`${number(latest.sma50)} / ${number(latest.sma200)}`} />
            <Kpi label="Precio vs SMA 200" value={pct(difference(latest.value, latest.sma200))} />
            <Kpi label="SMA 50 vs SMA 200" value={pct(difference(latest.sma50, latest.sma200))} />
            <Kpi label="Volatilidad 30d (anual.)" value={pct(analysis.volatility)} sub="30 rendimientos diarios · √252" />
            <Kpi label="Máximo de cierres · 12 meses" value={number(analysis.high)} sub={data.currency} />
            <Kpi label="Mínimo de cierres · 12 meses" value={number(analysis.low)} sub={data.currency} />
            <Kpi label="Caída máxima (1a)" value={pct(analysis.drawdown)} />
            <Kpi label="Bollinger" value={`${number(latest.lower)} — ${number(latest.upper)}`} />
            <Kpi label="Distancia al máximo de cierres" value={pct(difference(latest.value, analysis.high))} />
            <Kpi label="Distancia al mínimo de cierres" value={pct(difference(latest.value, analysis.low))} />
          </KpiGrid>
        </Section>
        <Section eyebrow="Cambios en el cierre ajustado" title="Por periodos">
          <KpiGrid>{analysis.performance.map(p => <Kpi key={p.label} label={p.label} value={pct(p.value)} sub={p.from ? `${fmtDate(p.from)} — ${fmtDate(p.to)}` : 'Historial insuficiente para esta ventana'} />)}</KpiGrid>
        </Section>
        <details ref={methods} className="alpha-technical-methods"><summary>Métodos, ajustes y límites</summary>
          <p>Los indicadores se calculan en este navegador a partir de la serie elegida. Las medias, RSI, MACD y Bollinger utilizan su cierre ajustado, sin mezclar descargas. Un cierre ajustado puede incorporar ajustes del proveedor por operaciones corporativas y dividendos; no es el precio efectivo al que se operó ese día.</p>
          {isOhlcv && <><p>Velas: apertura, máximo y mínimo originales multiplicados por cierre ajustado / cierre original; el cierre de la vela es el cierre ajustado. Los originales se conservan en la tabla. El volumen ya viene ajustado por splits del proveedor: no se aplica de nuevo el factor. Volumen ausente = «—», distinto de cero.</p>
            <p>ATR (14): rango verdadero = máximo de (máximo − mínimo, valor absoluto de máximo − cierre previo, valor absoluto de mínimo − cierre previo), usando siempre velas ajustadas. Primer rango = máximo − mínimo; semilla = media de 14 rangos; después ATR = (ATR previo × 13 + rango actual) / 14. Se reinicia tras más de diez días naturales sin datos; menos de 14 observaciones = «—».</p>
            <p>Integridad: identidad, moneda, cobertura, huellas SHA-256 por año y revisión conjunta comprobadas al leer. Revisión de esta descarga: <code className="alpha-technical-revision">{data.revision}</code>.</p></>}
          <p>SMA: media aritmética de 50 o 200 observaciones. EMA: semilla de media simple y factor 2/(n+1). RSI: medias de Wilder de ganancias y pérdidas de 14 cambios; serie plana = 50. MACD: EMA12 − EMA26; referencia EMA9 del MACD; histograma = diferencia. Bollinger: media de 20 cierres ± dos desviaciones típicas poblacionales.</p>
          <p>Volatilidad: desviación típica muestral de 30 rendimientos logarítmicos × √252. Caída máxima: mínimo de cierre/máximo previo − 1 en los últimos doce meses. Máximos y mínimos son de cierres ajustados, no de precios intradiarios. Los cambios por periodo usan el último cierre en o antes de la fecha objetivo, con tolerancia de diez días. Mes, trimestre y semestre usan 30, 90 y 183 días; las fechas reales se muestran en cada tarjeta.</p>
          <p>Los intervalos terminan en el último dato disponible, no en la fecha de consulta. Las medias se calculan antes de recortar el intervalo visible, con hasta un año adicional de preparación. Si no hay observaciones suficientes aparece «—». Los valores extremos del RSI y los cruces de medias no generan señales, alertas ni recomendaciones.</p>
        </details>
        <details className="alpha-technical-data screen-only"><summary>Tabla de datos del intervalo ({rows.length} observaciones)</summary>
          <div className="alpha-table" tabIndex={0} role="region" aria-label="Datos del análisis técnico">
            <table className="tbl"><caption>Cierres ajustados e indicadores locales · {data.currency}. «—» significa historial insuficiente.</caption>
              <thead><tr>{['Fecha', 'Cierre ajustado', 'SMA 50', 'SMA 200', 'RSI', 'MACD', 'Referencia', 'Histograma', 'Banda inferior', 'Banda superior',...(isOhlcv ? ['Apertura original','Máximo original','Mínimo original','Cierre original','Factor de ajuste','Apertura ajustada','Máximo ajustado','Mínimo ajustado','Volumen (acciones)','ATR (14)'] : [])].map(t => <th scope="col" key={t}>{t}</th>)}</tr></thead>
              <tbody>{rows.map(p => <tr key={p.date}><th scope="row">{p.date}</th>{['value', 'sma50', 'sma200', 'rsi', 'macd', 'signal', 'histogram', 'lower', 'upper',...(isOhlcv ? ['rawOpen','rawHigh','rawLow','rawClose'] : [])].map(k => <td key={k}>{number(p[k])}</td>)}
                {isOhlcv && <><td>{fmtNum(p.factor,6)}</td>{['open','high','low'].map(k => <td key={k}>{number(p.candle[k])}</td>)}<td>{Number.isFinite(p.volume) ? fmtNum(p.volume,0) : '—'}</td><td>{number(p.atr)}</td></>}
              </tr>)}</tbody>
            </table>
          </div>
        </details>
      </>}
    </Section>
  </section>;
}
