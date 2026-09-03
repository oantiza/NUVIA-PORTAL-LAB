# Consulta técnica a EODHD · Logista y Pernod Ricard

Estado: preparada, no enviada. No contiene credenciales, respuestas completas,
datos personales del usuario ni recomendaciones financieras.

**Asunto:** Field mapping questions for LOG.MC FY2024/FY2025 and RI.PA FY2026

Hello EODHD Support,

We are validating a small set of historical Fundamentals API fields for two
European issuers. We use the original `/api/fundamentals/{ticker}` endpoint with
filtered retrieval. Could you please clarify the field-level mapping below?

**LOG.MC - FY ended 2024-09-30 and 2025-09-30**

1. `grossProfit` reconciles exactly to `totalRevenue - costOfRevenue`. For FY2025,
   EODHD reports EUR 906.898m, while the issuer labels EUR 1,808.711m as gross
   profit immediately after purchases. Our reconstruction indicates that EODHD's
   `costOfRevenue` also includes staff, transport, and provincial sales-office
   costs from the logistics network. Is that the intended mapping for this issuer?
2. Please identify the source components and adjustments used for `ebit` and
   `depreciationAndAmortization`. The API computes EBITDA exactly as 311.928m +
   91.046m = 402.974m for FY2025, while the issuer's cash-flow statement reports
   total depreciation and amortisation of EUR 168.043m. FY2024 shows the same
   distinction: EODHD uses 91.794m, versus 165.467m in the issuer cash flow.
3. Which items are included in `capitalExpenditures` for each year? FY2024's
   EUR 47.085m matches tangible plus intangible investment; FY2025's EUR 44.838m
   matches tangible investment only. `freeCashFlow` correctly reconciles within
   the API as operating cash flow minus that field in both periods.

**RI.PA - FY ended 2026-06-30**

4. Please provide the components of `shortLongTermDebtTotal` (EUR 12,678m).
   EODHD's `netDebt` is internally consistent at 12,678m - 1,993m = 10,685m.
   The issuer reports EUR 10,662m after hedging and including EUR 449m of lease
   debt. Which leases, derivatives, and hedge adjustments are included in the
   EODHD total, and what explains the EUR 23m net difference?
5. Are FY2026 annual Income Statement and Cash Flow records expected for RI.PA
   in this endpoint? At 2026-09-03 17:06 UTC, the latest records returned were
   FY2025, while the Balance Sheet already included FY2026.

**Metadata for the same rows**

6. Could you confirm why `currency_symbol`/row currency is absent for LOG.MC
   FY2025 Income Statement and Cash Flow, and RI.PA FY2026 Balance Sheet?
7. What does `filing_date` represent when it is identical to the fiscal period
   end for these rows? The public glossary describes it as the official filing
   date, but the issuer documents were formulated/published later.

Identifiers: LOG.MC / ISIN ES0105027009; RI.PA / ISIN FR0000120693.

We are not asking for estimates or investment opinions. We only need the source
line mapping, transformation rules, unit/currency metadata, and coverage status
for these historical fields.

Thank you.

## Control de envío

Enviar una sola vez por el canal de soporte de la cuenta EODHD. Añadir únicamente
el nombre y correo que el fundador decida utilizar. No adjuntar claves, JSON crudo,
documentos con datos ajenos ni información bancaria. Conservar el número de caso
y la respuesta textual en el expediente antes de proponer cambios en la base.
