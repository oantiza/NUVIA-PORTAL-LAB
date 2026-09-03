// The view adapter has no IO and deliberately does not import the legacy API.
export function toFundamentalView(company) {
  return {
    General: { Name: company.identity.name, CurrencyCode: company.identity.quoteCurrency },
    Highlights: company.metrics, Valuation: company.multiples, SharesStats: company.shares,
    Financials: Object.fromEntries(Object.entries(company.statements).map(([name, statement]) => [name, {
      currency_symbol: statement.currency,
      yearly: Object.fromEntries(statement.rows.map(row => [row.period, row])),
    }])),
  };
}
