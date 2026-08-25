import React from 'react';

export default function AnalysisBanner() {
  return (
    <section className="analysis-intro" aria-labelledby="analysis-intro-title">
      <div className="analysis-intro-copy">
        <p className="analysis-intro-eyebrow">Análisis y valoración de empresas</p>
        <h1 id="analysis-intro-title">Entiende el negocio antes de mirar el precio</h1>
        <p>
          Una lectura ordenada de lo que hace la compañía, cómo han evolucionado sus cifras y cómo
          se sitúan sus múltiplos, siempre con fecha, fuente y límites visibles.
        </p>
        <i aria-hidden="true" />
      </div>
    </section>
  );
}
