import React from 'react';
import { Kpi, KpiGrid, Section } from '../components/Kpi.jsx';
import { DualBars } from '../components/SvgCharts.jsx';
import { fmtBig, fmtNum, fmtDate, fmtPct, fmtRatio, pct100 } from '../lib/format.js';
import { marginPercent } from '../lib/financial.js';
import IndicatorInfo from '../components/IndicatorInfo.jsx';
import { chartCaption, statementNotes, filingMatchesClose } from '../../alfa/metadata.mjs';
import { earningsWindow } from '../../alfa/earnings-window.mjs';

// Magnitud del número original, sin atribuir una unidad monetaria no acreditada.
export const originalNumber = value => fmtBig(value);
const definitions = {
  Income_Statement: { title: 'Cuenta de resultados', fields: [['totalRevenue', 'Ingresos'], ['grossProfit', 'Beneficio bruto'], ['ebitda', 'EBITDA'], ['operatingIncome', 'Bº operativo'], ['netIncome', 'Beneficio neto']], bars: ['totalRevenue', 'netIncome'], labels: ['Ingresos', 'Beneficio neto'] },
  Balance_Sheet: { title: 'Balance', fields: [['totalAssets', 'Activos'], ['totalLiab', 'Pasivos'], ['totalStockholderEquity', 'Patrimonio'], ['cash', 'Caja'], ['netDebt', 'Deuda neta'], ['shortLongTermDebtTotal', 'Deuda total']], bars: ['totalAssets', 'totalStockholderEquity'], labels: ['Activos', 'Patrimonio'] },
  Cash_Flow: { title: 'Flujos de caja', fields: [['totalCashFromOperatingActivities', 'Flujo operativo'], ['capitalExpenditures', 'Capex'], ['freeCashFlow', 'FCF'], ['dividendsPaid', 'Dividendos']], bars: ['totalCashFromOperatingActivities', 'freeCashFlow'], labels: ['Flujo operativo', 'FCF'] },
};

export function CompanySummary({ company }) {
  const rows = company.statements.Income_Statement.rows;
  const latest = rows.at(-1);
  return <Section eyebrow="Último cierre de resultados disponible" title={latest ? fmtDate(latest.period) : 'Sin resultados anuales'}>
    <p>Cifras originales de la fuente, sin conversión. Moneda declarada para este ejercicio: {latest?.currency || 'no informada'}. Escala contable no indicada.</p>
    <KpiGrid>
      <Kpi label="Ingresos" value={originalNumber(latest?.totalRevenue)} />
      <Kpi label="Beneficio neto" value={originalNumber(latest?.netIncome)} />
      <Kpi label="EBITDA" value={originalNumber(latest?.ebitda)} />
      <Kpi label="Margen neto" value={fmtPct(marginPercent(latest?.netIncome, latest?.totalRevenue), 1, false)} />
    </KpiGrid>
    <p className="note">Margen neto = beneficio neto / ingresos × 100, del mismo ejercicio. No se calcula si falta un dato o el ingreso es cero.</p>
  </Section>;
}

export function CompanyRatios({ company }) {
  const h = company.metrics, v = company.multiples;
  return <>
    <Section eyebrow="Ratios históricos del proveedor" title="Múltiplos">
      <KpiGrid>
        <Kpi label="PER (ttm)" value={fmtRatio(h.PERatio)} />
        <Kpi label="Precio / Ventas" value={fmtRatio(v.PriceSalesTTM)} />
        <Kpi label="Precio / Valor contable" value={fmtRatio(v.PriceBookMRQ)} />
        <Kpi label="EV / Ventas" value={fmtRatio(v.EnterpriseValueRevenue)} />
        <Kpi label="EV / EBITDA" value={fmtRatio(v.EnterpriseValueEbitda)} />
      </KpiGrid>
    </Section>
    <Section eyebrow="Márgenes, rentabilidad contable y crecimiento" title="Resultados y ratios">
      <KpiGrid>
        <Kpi label="Margen bruto (ttm)" value={fmtPct(marginPercent(h.GrossProfitTTM, h.RevenueTTM), 1, false)} />
        {[['OperatingMarginTTM', 'Margen operativo'], ['ProfitMargin', 'Margen neto'], ['ReturnOnEquityTTM', 'ROE'], ['ReturnOnAssetsTTM', 'ROA'], ['QuarterlyRevenueGrowthYOY', 'Crec. ingresos (a/a)'], ['QuarterlyEarningsGrowthYOY', 'Crec. beneficio (a/a)']].map(([key, label]) => <Kpi key={key} label={label} value={fmtPct(pct100(h[key]), 1, false)} />)}
      </KpiGrid>
      <p className="note">TTM significa últimos doce meses; a/a compara con el mismo periodo del año anterior. Son ratios de la instantánea del proveedor, no recalculados con el precio actual. El cierre exacto de cada ratio no consta en estos archivos. Margen bruto = beneficio bruto TTM / ingresos TTM × 100.</p>
    </Section>
  </>;
}

export function CompanyStatements({ company, limit = 5 }) {
  return <>{Object.entries(definitions).map(([key, definition]) => {
    const all = company.statements[key].rows;
    const rows = limit === 'all' ? all : all.slice(-Number(limit));
    const notes = statementNotes({ ...company.statements[key], rows });
    const groups = new Map();
    for (const row of rows) {
      const key = row.currency || null;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    return <Section key={key} eyebrow={`${rows.length} de ${all.length} ejercicios disponibles`} title={definition.title}>
      <p>Se conservan los números recibidos. Moneda por ejercicio; escala contable no indicada. Las abreviaturas k, M, mm y B reducen el número mostrado, no acreditan una unidad monetaria. Presentación: fecha declarada por el proveedor, sin verificación documental individual.</p>
      {notes.map(note => <p className="note" key={note}>{note}</p>)}
      {!rows.length ? <p>La fuente no aporta ejercicios para este estado.</p> : <>
        <div className="alpha-table" tabIndex={0} role="region" aria-label={`Tabla de ${definition.title}`}>
          <table className="tbl">
            <caption>{definition.title} · Cifras originales sin conversión. «—» significa dato ausente, no cero.</caption>
            <thead><tr><th scope="col">Cierre</th><th scope="col">Moneda declarada</th>{definition.fields.map(([field, label]) => <th scope="col" key={field}><IndicatorInfo name={label} className="screen-only" /><span className="print-only">{label}</span></th>)}{key === 'Income_Statement' && <th scope="col"><IndicatorInfo name="Margen neto" className="screen-only" /><span className="print-only">Margen neto</span></th>}<th scope="col">Presentación declarada</th></tr></thead>
            <tbody>{[...rows].reverse().map(row => <tr key={row.period}>
              <th scope="row">{fmtDate(row.period)}</th><td>{row.currency || 'No informada'}</td>
              {definition.fields.map(([field]) => <td className="num" key={field} title={row[field] == null ? 'Dato ausente' : `${row[field].toLocaleString('es-ES', { maximumFractionDigits: 8 })} · cifra original, escala no indicada`}>{originalNumber(row[field])}</td>)}
              {key === 'Income_Statement' && <td className="num">{fmtPct(marginPercent(row.netIncome, row.totalRevenue), 1, false)}</td>}
              <td>{fmtDate(row.reportedAt)}{filingMatchesClose(row) ? ' *' : ''}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="alpha-charts">{[...groups].map(([currency, subset]) => <figure className="card" key={currency || 'not-reported'}>
          <figcaption>{definition.labels.join(' y ')} · {chartCaption(currency)}</figcaption>
          <DualBars rows={subset.map(row => ({ label: row.period, a: row[definition.bars[0]], b: row[definition.bars[1]] }))} aLabel={definition.labels[0]} bLabel={definition.labels[1]} compactLabels />
        </figure>)}</div>
      </>}
    </Section>;
  })}</>;
}

export function CompanyOwnership({ company }) {
  return <Section eyebrow="Información agregada" title="Accionariado">
    <KpiGrid>
      <Kpi label="Acciones en circulación" value={fmtBig(company.shares.SharesOutstanding)} />
      <Kpi label="% institucionales" value={fmtPct(company.shares.PercentInstitutions, 2, false)} />
      <Kpi label="% insiders" value={fmtPct(company.shares.PercentInsiders, 2, false)} />
    </KpiGrid>
    <p className="note">Datos agregados del proveedor. No se incorporan nombres de personas ni transacciones personales.</p>
  </Section>;
}

export function CompanySnapshot({ company, limit = 5 }) {
  const data = company.snapshotMetrics || {};
  const window = earningsWindow(company.earnings, limit);
  const earnings = window.rows;
  return <>
    <Section eyebrow="Instantánea del proveedor" title="Capital, beneficio por acción y dividendos">
      <p>Cifras originales: su moneda específica y escala no están acreditadas en esta copia. No se convierten a la moneda de cotización. No son estimaciones futuras.</p>
      <KpiGrid>
        <Kpi label="Capitalización" value={originalNumber(data.MarketCapitalization)} />
        <Kpi label="EV" value={originalNumber(data.EnterpriseValue)} />
        <Kpi label="BPA diluido (ttm)" value={fmtNum(data.EarningsShare, 2)} />
        <Kpi label="Valor contable por acción (MRQ)" value={fmtNum(data.BookValue, 2)} />
        <Kpi label="Dividendo por acción (ttm)" value={fmtNum(data.DividendShare, 2)} />
        <Kpi label="Rent. por dividendo (ttm)" value={fmtPct(pct100(data.DividendYield), 2, false)} />
        <Kpi label="Pay-out (ttm)" value={fmtPct(pct100(data.PayoutRatio), 2, false)} />
      </KpiGrid>
      <p className="note">TTM: últimos doce meses. MRQ: último trimestre disponible. Son definiciones del proveedor; el cierre concreto de cada magnitud no está acreditado en esta copia.</p>
    </Section>
    <Section eyebrow="Beneficio por acción publicado" title="Historial de resultados (BPA)">
      <p className="note">BPA comunicado en el historial del proveedor (definido como no GAAP): puede diferir del BPA contable o diluido de otros apartados. No se ha acreditado un ajuste homogéneo de este historial por desdoblamientos de acciones; no se aplican ajustes adicionales.</p>
      {earnings.length > 0 && <p className="note">Se muestran {earnings.length} de {window.total} comunicados disponibles.
        {window.after && ` BPA: periodos posteriores a ${fmtDate(window.after)} y hasta ${fmtDate(window.through)}, una ventana de ${limit} años desde el último periodo disponible; no garantiza ${limit} años completos. Las cuentas anuales seleccionan ejercicios, no número de comunicados.`}
        {window.undated > 0 && ` Se conservan al final ${window.undated} comunicados sin periodo informado, fuera del cómputo temporal.`}
      </p>}
      {!earnings.length ? <p>La fuente no aporta un historial de BPA real en esta copia.</p> : <div className="alpha-table" tabIndex={0} role="region" aria-label="Tabla de BPA publicado"><table className="tbl alpha-earnings">
        <caption>BPA real comunicado por el proveedor, sin columnas de consenso ni sorpresas estimadas.</caption>
        <thead><tr><th scope="col">Periodo</th><th scope="col">Publicación</th><th scope="col">Moneda declarada</th><th scope="col">BPA real</th></tr></thead>
        <tbody>{earnings.map((e, i) => <tr key={`${e.period}-${e.reportedAt}-${i}`}><th scope="row">{fmtDate(e.period)}</th><td>{fmtDate(e.reportedAt)}</td><td>{e.currency || 'No informada'}</td><td className="num">{fmtNum(e.actual, 2)}</td></tr>)}</tbody>
      </table></div>}
    </Section>
  </>;
}
