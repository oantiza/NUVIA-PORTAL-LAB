import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

// Local chart: no theme persistence, provider widget, account or network request.
export default function TechnicalChart({ rows, series, title, levels = [], height = 280 }) {
  const host = useRef(null), printImage = useRef(null);
  const hasValues = rows.some(row => series.some(field => field.candlestick ? !!row.candle : Number.isFinite(row[field.key])));
  useEffect(() => {
    if (!host.current || !rows.length) return;
    const el = host.current;
    const chart = createChart(el, { width: el.clientWidth, height,
      layout: { background: { color: '#ffffff' }, textColor: '#40526b', fontFamily: 'Inter, sans-serif', fontSize: 14 },
      localization: { locale: 'es-ES', priceFormatter: value => value.toLocaleString('es-ES', { minimumFractionDigits: series.some(s => s.key === 'volume') ? 0 : 2, maximumFractionDigits: series.some(s => s.key === 'volume') ? 0 : 2 }) },
      grid: { vertLines: { color: '#edf0f3' }, horzLines: { color: '#edf0f3' } },
      rightPriceScale: { borderColor: '#c8d2de', entireTextOnly: true,
        ...(series.some(field => field.key === 'rsi') ? { scaleMargins: { top: .04, bottom: .04 } } : {}) },
      timeScale: { borderColor: '#c8d2de', timeVisible: false, lockVisibleTimeRangeOnResize: true },
      handleScroll: { vertTouchDrag: false },
    });
    let reference;
    for (const field of series) {
      // Split lines at warm-up absences or large calendar gaps instead of joining them.
      let segment = [], previous;
      const flush = () => {
        if (!segment.length) return;
        const plot = field.candlestick ? chart.addCandlestickSeries({ upColor:'#102c50',downColor:'#745a9b',borderVisible:false,
          wickUpColor:'#102c50',wickDownColor:'#745a9b',lastValueVisible:false,priceLineVisible:false })
          : field.histogram ? chart.addHistogramSeries({ color: field.color, lastValueVisible: false, priceLineVisible: false,
            ...(field.key === 'volume' ? {priceFormat:{type:'volume'}} : {}) })
          : chart.addLineSeries({ color: field.color, lineWidth: 2, lastValueVisible: false, priceLineVisible: false,
            // No magnificar ruido subcéntimo en ATR prácticamente constantes.
            ...(field.key === 'atr' ? {autoscaleInfoProvider: original => {
              const info = original();
              if (info && info.priceRange.maxValue - info.priceRange.minValue < .02) {
                const center = (info.priceRange.maxValue + info.priceRange.minValue) / 2;
                return {...info,priceRange:{minValue:Math.max(0,center-.01),maxValue:center+.01}};
              } return info;
            }} : {}),
            ...(field.key === 'rsi' ? { autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }) } : {}) });
        plot.setData(segment); reference ||= plot; segment = [];
      };
      for (const row of rows) {
        if (previous && Date.parse(row.date) - Date.parse(previous) > 10 * 86400000) flush();
        if (field.candlestick && row.candle) { const {open,high,low,close} = row.candle; segment.push({time:row.date,open,high,low,close}); }
        else if (Number.isFinite(row[field.key])) segment.push({ time: row.date, value: row[field.key] });
        else flush();
        previous = row.date;
      }
      flush();
    }
    for (const price of levels) reference?.createPriceLine({ price, color: '#66778e', lineWidth: 1, lineStyle: 2, axisLabelVisible: true });
    const plottedCount = rows.filter(row => series.some(field => field.candlestick ? !!row.candle : Number.isFinite(row[field.key]))).length;
    if (plottedCount) {
      const padding = Math.max(2, plottedCount * .04);
      chart.timeScale().setVisibleLogicalRange({ from: -padding, to: plottedCount - 1 + padding });
    }
    const resize = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) chart.applyOptions({ width: Math.floor(entry.contentRect.width) });
    });
    // Captura local de la vista actual: evita recortes por la redimensión asíncrona
    // del lienzo durante la paginación. No se envía ni se guarda fuera de la página.
    const beforePrint = () => { if (printImage.current) printImage.current.src = chart.takeScreenshot().toDataURL('image/png'); };
    window.addEventListener('beforeprint', beforePrint);
    resize.observe(el);
    return () => { window.removeEventListener('beforeprint', beforePrint); resize.disconnect(); chart.remove(); };
  }, [rows, series, title, levels, height]);
  return <figure className="alpha-technical-chart">
    <figcaption>{title}</figcaption>
    <div className="chart-legend">{series.map(s => <span key={s.key}><span className="sw" style={{ background: s.color }} />{s.label}</span>)}</div>
    {hasValues ? <><div ref={host} className="screen-only" role="img" aria-label={`${title}. Valores consultables en la tabla de datos.`} />
      <img ref={printImage} className="print-only alpha-technical-print" alt={title} /></>
      : <p className="note">Sin datos suficientes para representar este indicador en el intervalo. Consulta la tabla y los métodos.</p>}
  </figure>;
}
