(function () {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  const embeddedInWeb2 = params.get('embedded') === 'web2';
  const requestedSuiteTab = params.get('suiteTab');

  const activateEmbeddedMode = () => {
    document.documentElement.classList.add('nuvia-web2-embedded');
    document.body.classList.add('nuvia-web2-embedded');

    const style = document.createElement('style');
    style.id = 'nuvia-web2-embedded-styles';
    style.textContent = `
      html.nuvia-web2-embedded,
      body.nuvia-web2-embedded {
        min-height: 0 !important;
        overflow: hidden !important;
        background: transparent !important;
      }
      body.nuvia-web2-embedded .nuvia-skip-link,
      body.nuvia-web2-embedded .nuvia-zip3-header,
      body.nuvia-web2-embedded footer,
      body.nuvia-web2-embedded main.nuvia-portfolio > :nth-child(1),
      body.nuvia-web2-embedded main.nuvia-portfolio > :nth-child(2) {
        display: none !important;
      }
      body.nuvia-web2-embedded .nuvia-app {
        min-height: 0 !important;
        overflow: visible !important;
        background: transparent !important;
      }
      body.nuvia-web2-embedded main.nuvia-portfolio {
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      body.nuvia-web2-embedded main.nuvia-portfolio > .mt-2 {
        margin-top: 0 !important;
      }

      /* Analítica NUVIA: los gráficos construyen la jerarquía de la página. */
      body.nuvia-web2-embedded [data-nuvia-suite-shell] {
        --nv-chart-series: #0b2347;
        --nv-accent: #0b2347;
        --nv-navy: #0b2347;
        border: 0 !important;
        border-radius: 24px !important;
        box-shadow: none !important;
        background: #f2f5f7 !important;
      }
      body.nuvia-web2-embedded [data-nuvia-suite-hero] {
        min-height: 390px;
        padding: 48px 54px !important;
        background:
          radial-gradient(circle at 76% 12%, rgba(167,196,105,.15), transparent 27%),
          linear-gradient(112deg, #0a2445 0%, #123d68 100%) !important;
        position: relative;
        overflow: hidden;
      }
      body.nuvia-web2-embedded [data-nuvia-suite-hero]::after {
        content: "";
        position: absolute;
        inset: auto -8% -48% 32%;
        height: 300px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 50%;
        transform: rotate(-8deg);
        pointer-events: none;
      }
      body.nuvia-web2-embedded [data-nuvia-suite-hero] > div {
        display: grid !important;
        grid-template-columns: minmax(0, 1.05fr) minmax(390px, .8fr) !important;
        align-items: center !important;
        gap: 58px !important;
        position: relative;
        z-index: 1;
      }
      body.nuvia-web2-embedded [data-nuvia-suite-hero] h1 {
        max-width: 680px;
        font-family: Figtree, system-ui, sans-serif !important;
        font-size: clamp(46px, 4.8vw, 62px) !important;
        font-weight: 400 !important;
        letter-spacing: -.035em !important;
        line-height: 1.01 !important;
      }
      body.nuvia-web2-embedded [data-nuvia-suite-hero] p:first-child {
        color: #c7dc87 !important;
      }
      body.nuvia-web2-embedded [data-nuvia-suite-hero] p:last-child {
        max-width: 650px !important;
        font-size: 17px !important;
        line-height: 1.7 !important;
      }
      body.nuvia-web2-embedded [data-nuvia-hero-visual] {
        width: 100%;
        max-width: 500px;
        justify-self: end;
        border: 1px solid rgba(255,255,255,.42);
        border-radius: 20px;
        background: rgba(249,250,247,.96);
        box-shadow: 0 28px 65px rgba(0,17,42,.25);
        color: #0b2347;
        padding: 25px 26px 23px;
        backdrop-filter: blur(10px);
      }
      body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding-bottom: 18px;
        border-bottom: 1px solid #dfe5e8;
      }
      body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-kicker {
        color: #667892;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .19em;
        text-transform: uppercase;
      }
      body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-status {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: #4a5d23;
        font-size: 11px;
        font-weight: 650;
      }
      body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-status::before {
        content: "";
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #91ad4b;
        box-shadow: 0 0 0 4px rgba(145,173,75,.13);
      }
      body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-body {
        display: grid;
        grid-template-columns: 140px minmax(0, 1fr);
        align-items: center;
        gap: 30px;
        padding: 25px 4px 20px;
      }
      body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-donut {
        width: 132px;
        height: 132px;
        border-radius: 50%;
        background: conic-gradient(#0b2347 0 35%, #657d39 35% 60%, #c5a968 60% 80%, #b8c5d4 80% 100%);
        position: relative;
        box-shadow: 0 10px 24px rgba(11,35,71,.13);
      }
      body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-donut::after {
        content: "3";
        position: absolute;
        inset: 24px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: #fbfaf6;
        color: #0b2347;
        font-size: 30px;
        font-weight: 450;
        box-shadow: inset 0 0 0 1px rgba(11,35,71,.05);
      }
      body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-bars {
        display: grid;
        gap: 15px;
      }
      body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-row {
        display: grid;
        grid-template-columns: 86px 1fr;
        align-items: center;
        gap: 12px;
        color: #334a65;
        font-size: 11px;
        font-weight: 600;
      }
      body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-track {
        height: 7px;
        overflow: hidden;
        border-radius: 999px;
        background: #e4e9ed;
      }
      body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-track i {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: #0b2347;
      }
      body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-row:nth-child(2) i { background: #657d39; }
      body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-row:nth-child(3) i { background: #c5a968; }
      body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-foot {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        border-top: 1px solid #dfe5e8;
      }
      body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-foot span {
        padding: 16px 10px 0;
        color: #60718a;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .12em;
        text-align: center;
        text-transform: uppercase;
      }
      body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-foot span + span {
        border-left: 1px solid #dfe5e8;
      }
      body.nuvia-web2-embedded [data-nuvia-suite-tabs] {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 0 !important;
        padding: 0 34px !important;
        background: #f7f8f5 !important;
        border-bottom: 1px solid #dfe5eb !important;
      }
      body.nuvia-web2-embedded [data-nuvia-suite-tabs] > button {
        min-height: 92px !important;
        padding: 22px 24px 20px 58px !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        align-items: center !important;
        position: relative;
      }
      body.nuvia-web2-embedded [data-nuvia-suite-tabs] > button + button {
        border-left: 1px solid #dfe5eb !important;
      }
      body.nuvia-web2-embedded [data-nuvia-suite-tabs] > button[aria-selected="true"]::after {
        content: "";
        position: absolute;
        left: 22px;
        right: 22px;
        bottom: -1px;
        height: 4px;
        border-radius: 4px 4px 0 0;
        background: #91ad4b;
      }
      body.nuvia-web2-embedded [data-nuvia-suite-tabs] > button::before {
        position: absolute;
        left: 24px;
        top: 28px;
        color: #91ad4b;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: .12em;
      }
      body.nuvia-web2-embedded [data-nuvia-suite-tabs] > button:nth-child(1)::before { content: "01"; }
      body.nuvia-web2-embedded [data-nuvia-suite-tabs] > button:nth-child(2)::before { content: "02"; }
      body.nuvia-web2-embedded [data-nuvia-suite-tabs] > button:nth-child(3)::before { content: "03"; }
      body.nuvia-web2-embedded [data-nuvia-suite-tabs] > button > span:first-child {
        display: none !important;
      }
      body.nuvia-web2-embedded [data-nuvia-suite-tabs] button span span:nth-child(n+3),
      body.nuvia-web2-embedded [data-nuvia-suite-tabs] button span > div {
        display: none !important;
      }
      body.nuvia-web2-embedded [data-nuvia-suite-tabs] button span span:nth-child(2) {
        margin-top: 3px !important;
        font-family: Figtree, system-ui, sans-serif !important;
        font-size: 20px !important;
        font-weight: 500 !important;
      }
      body.nuvia-web2-embedded [data-nuvia-active-summary] {
        display: none !important;
      }
      body.nuvia-web2-embedded [data-nuvia-suite-panel] {
        padding: 42px 44px 54px !important;
        background: #f2f5f7 !important;
      }
      body.nuvia-web2-embedded [data-nuvia-fundamental-loading] {
        display: grid !important;
        grid-template-columns: auto minmax(0, 1fr) !important;
        align-items: center !important;
        gap: 16px !important;
        margin: 0 0 24px !important;
        padding: 18px 20px !important;
        border: 1px solid #dbe5f2 !important;
        border-radius: 18px !important;
        background: linear-gradient(110deg, #fff 0%, #fbfaf6 100%) !important;
        box-shadow: 0 12px 30px rgba(11,35,71,.055) !important;
        color: #0b2347 !important;
      }
      body.nuvia-web2-embedded [data-nuvia-fundamental-loading]::before {
        content: "";
        width: 22px;
        height: 22px;
        border: 2px solid rgba(74,93,35,.2);
        border-top-color: #4a5d23;
        border-radius: 999px;
        animation: nv-fundamental-spin .85s linear infinite;
      }
      body.nuvia-web2-embedded [data-nuvia-fundamental-loading] strong {
        display: block;
        margin-bottom: 3px;
        font-family: Figtree, system-ui, sans-serif;
        font-size: 14px;
      }
      body.nuvia-web2-embedded [data-nuvia-fundamental-loading] span {
        color: #6b7280;
        font-size: 12px;
        line-height: 1.5;
      }
      @keyframes nv-fundamental-spin { to { transform: rotate(360deg); } }
      body.nuvia-web2-embedded [data-nuvia-portfolio-lab] {
        display: flex !important;
        flex-direction: column !important;
        gap: 28px !important;
      }
      body.nuvia-web2-embedded [data-nuvia-portfolio-notice] {
        margin: 0 !important;
        order: 3;
      }
      body.nuvia-web2-embedded [data-nuvia-portfolio-notice] p {
        background: transparent !important;
        border-color: #ded5bd !important;
        color: #786536 !important;
        font-size: 12px !important;
        font-weight: 500 !important;
      }
      body.nuvia-web2-embedded [data-nuvia-portfolio-layout] {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 30px !important;
      }
      body.nuvia-web2-embedded [data-nuvia-build-controls] {
        display: grid !important;
        grid-template-columns: minmax(0, 1.6fr) minmax(330px, .72fr) !important;
        gap: 24px !important;
        align-items: start !important;
      }
      body.nuvia-web2-embedded [data-nuvia-build-controls] > * {
        margin: 0 !important;
        border-color: #d9e0e5 !important;
        border-radius: 18px !important;
        box-shadow: 0 14px 36px rgba(11,35,71,.045) !important;
      }
      body.nuvia-web2-embedded [data-nuvia-visual-story] {
        display: flex !important;
        flex-direction: column !important;
        gap: 28px !important;
      }
      body.nuvia-web2-embedded [data-nuvia-holdings],
      body.nuvia-web2-embedded [data-nuvia-diagnostic],
      body.nuvia-web2-embedded [data-nuvia-chart-section] {
        border-color: #d9e0e5 !important;
        border-radius: 18px !important;
        box-shadow: 0 14px 40px rgba(11,35,71,.05) !important;
      }
      body.nuvia-web2-embedded [data-nuvia-holdings],
      body.nuvia-web2-embedded [data-nuvia-diagnostic],
      body.nuvia-web2-embedded [data-nuvia-chart-section] {
        padding: 30px !important;
      }
      body.nuvia-web2-embedded [data-nuvia-diagnostic] h3,
      body.nuvia-web2-embedded [data-nuvia-chart-section] h3 {
        font-family: Figtree, system-ui, sans-serif !important;
        font-size: 28px !important;
        font-weight: 500 !important;
        letter-spacing: -.025em !important;
        line-height: 1.12 !important;
        color: #0b2347 !important;
      }
      body.nuvia-web2-embedded [data-nuvia-holdings] h3,
      body.nuvia-web2-embedded [data-nuvia-build-controls] h3 {
        color: #0b2347 !important;
      }
      body.nuvia-web2-embedded [data-nuvia-diagnostic] .text-2xl,
      body.nuvia-web2-embedded [data-nuvia-diagnostic] [class*="text-2xl"],
      body.nuvia-web2-embedded [data-nuvia-chart-section="comparison"] strong,
      body.nuvia-web2-embedded [data-nuvia-chart-section="comparison"] [class*="text-2xl"] {
        color: #0b2347 !important;
      }
      body.nuvia-web2-embedded [data-nuvia-diagnostic] > div:last-child > div:nth-child(1),
      body.nuvia-web2-embedded [data-nuvia-diagnostic] > div:last-child > div:nth-child(2),
      body.nuvia-web2-embedded [data-nuvia-diagnostic] > div:last-child > div:nth-child(3),
      body.nuvia-web2-embedded [data-nuvia-diagnostic] > div:last-child > div:nth-child(4) {
        border-top: 2px solid #d8e0e6 !important;
      }
      body.nuvia-web2-embedded [data-nuvia-diagnostic] > div:last-child > div:nth-child(1) {
        border-top-color: #91ad4b !important;
      }
      body.nuvia-web2-embedded [data-nuvia-diagnostic] > div:last-child > div:nth-child(4) {
        border-top-color: #b98b8f !important;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section] {
        position: relative;
        overflow: hidden;
        padding-top: 58px !important;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section]::before {
        position: absolute;
        left: 30px;
        top: 27px;
        color: #718f37;
        font-size: 10px;
        font-weight: 750;
        letter-spacing: .2em;
        text-transform: uppercase;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="comparison"]::before { content: "01 · Comparar"; }
      body.nuvia-web2-embedded [data-nuvia-chart-section="distribution"]::before { content: "02 · Distribución"; }
      body.nuvia-web2-embedded [data-nuvia-chart-section="correlation"]::before { content: "03 · Relación entre activos"; }
      body.nuvia-web2-embedded [data-nuvia-chart-section="risk-return"]::before { content: "04 · Riesgo y rendimiento"; }
      body.nuvia-web2-embedded [data-nuvia-chart-section="frontier"]::before { content: "05 · Eficiencia"; }
      body.nuvia-web2-embedded [data-nuvia-chart-section="evolution"]::before { content: "06 · Evolución"; }
      body.nuvia-web2-embedded [data-nuvia-chart-section="monte-carlo"]::before { content: "07 · Escenarios"; }
      body.nuvia-web2-embedded [data-nuvia-diagnostic] > div:last-child {
        gap: 16px !important;
      }
      body.nuvia-web2-embedded [data-nuvia-diagnostic] > div:last-child > div {
        min-height: 154px;
        padding: 22px !important;
        border-radius: 14px !important;
        background: #f7f8f5 !important;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-story] {
        display: grid !important;
        grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
        gap: 28px !important;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-story] > * {
        grid-column: 1 / -1;
        margin: 0 !important;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="risk-return"],
      body.nuvia-web2-embedded [data-nuvia-chart-section="frontier"] {
        grid-column: 1 / -1;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="distribution"] svg[viewBox] {
        min-height: 300px !important;
        height: 340px !important;
        width: 100% !important;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="risk-return"] svg[viewBox],
      body.nuvia-web2-embedded [data-nuvia-chart-section="frontier"] svg[viewBox] {
        min-height: 390px !important;
        height: 430px !important;
        width: 100% !important;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="evolution"] svg[viewBox],
      body.nuvia-web2-embedded [data-nuvia-chart-section="monte-carlo"] svg[viewBox] {
        min-height: 430px !important;
        height: 480px !important;
        width: 100% !important;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section] svg text {
        font-family: Figtree, system-ui, sans-serif !important;
        font-size: 11.5px !important;
        fill: #53677e;
        font-weight: 500;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section] svg line {
        vector-effect: non-scaling-stroke;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="risk-return"] svg circle,
      body.nuvia-web2-embedded [data-nuvia-chart-section="frontier"] svg circle {
        stroke: #ffffff;
        stroke-width: 2.5px;
        filter: drop-shadow(0 3px 5px rgba(11,35,71,.2));
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="risk-return"] .nv-risk-primary-label {
        fill: #0b2347 !important;
        stroke: rgba(255,255,255,.98);
        stroke-width: 4px;
        stroke-linejoin: round;
        paint-order: stroke fill;
        font-size: 11px !important;
        font-weight: 750 !important;
        letter-spacing: .01em;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="risk-return"] .nv-risk-primary circle {
        stroke: #ffffff !important;
        stroke-width: 3.2px !important;
        filter: drop-shadow(0 5px 7px rgba(11,35,71,.28));
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="risk-return"] .nv-risk-benchmark-label {
        fill: #6a7b8f !important;
        font-size: 9.5px !important;
        font-weight: 600 !important;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="risk-return"] .nv-risk-benchmark circle {
        opacity: .74;
        stroke-width: 1.5px;
        filter: none;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="risk-return"] .nv-risk-legend-primary {
        min-height: 36px;
        padding: 7px 10px;
        border: 1px solid #dce3e7;
        border-radius: 10px;
        background: #f7f8f5;
        color: #0b2347;
        font-weight: 700;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="risk-return"] .nv-risk-legend-benchmark {
        color: #708096;
        font-size: 11px;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="evolution"] svg polyline,
      body.nuvia-web2-embedded [data-nuvia-chart-section="monte-carlo"] svg path {
        vector-effect: non-scaling-stroke;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="frontier"] svg polyline {
        stroke-width: 1.8px !important;
        filter: none !important;
        vector-effect: non-scaling-stroke;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="frontier"] svg circle {
        filter: drop-shadow(0 3px 5px rgba(11,35,71,.18));
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="frontier"] .nv-frontier-point-current {
        r: 5.5px;
        stroke-width: 2px !important;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="frontier"] .nv-frontier-point-optimized {
        r: 6.5px;
        stroke-width: 2.4px !important;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="frontier"] .nv-frontier-label {
        font-size: 9.5px !important;
        font-weight: 700 !important;
        paint-order: stroke fill;
        stroke: rgba(255,255,255,.98);
        stroke-width: 3px;
        stroke-linejoin: round;
      }
      body.nuvia-web2-embedded [data-nuvia-plot] {
        border-color: #d9e1e6 !important;
        border-radius: 16px !important;
        background-color: #fafbf9 !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 10px 26px rgba(11,35,71,.035) !important;
        position: relative;
        overflow: hidden;
      }
      body.nuvia-web2-embedded [data-nuvia-plot="risk-return"],
      body.nuvia-web2-embedded [data-nuvia-plot="frontier"],
      body.nuvia-web2-embedded [data-nuvia-plot="evolution"],
      body.nuvia-web2-embedded [data-nuvia-plot="monte-carlo"] {
        background-image:
          linear-gradient(rgba(11,35,71,.022) 1px, transparent 1px),
          linear-gradient(90deg, rgba(11,35,71,.022) 1px, transparent 1px) !important;
        background-size: 46px 46px !important;
      }
      body.nuvia-web2-embedded .nv-chart-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        margin: 20px 0 24px;
        padding: 14px 16px;
        border: 1px solid #dfe5e8;
        border-radius: 13px;
        background: #f7f8f5;
      }
      body.nuvia-web2-embedded .nv-chart-meta-label {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        color: #314a65;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .12em;
        text-transform: uppercase;
      }
      body.nuvia-web2-embedded .nv-chart-meta-label::before {
        content: "";
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #91ad4b;
        box-shadow: 0 0 0 4px rgba(145,173,75,.12);
      }
      body.nuvia-web2-embedded .nv-chart-meta-items {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 7px;
      }
      body.nuvia-web2-embedded .nv-chart-meta-item {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        padding: 5px 10px;
        border: 1px solid #dce3e7;
        border-radius: 999px;
        background: #ffffff;
        color: #63758a;
        font-size: 10.5px;
        font-weight: 650;
        white-space: nowrap;
      }
      body.nuvia-web2-embedded .nv-chart-reading {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 12px;
        align-items: start;
        margin-top: 20px;
        padding: 15px 17px;
        border-left: 3px solid #91ad4b;
        border-radius: 0 12px 12px 0;
        background: #f2f5e9;
        color: #40546b;
        font-size: 12px;
        line-height: 1.55;
      }
      body.nuvia-web2-embedded .nv-chart-reading strong {
        color: #526a2c;
        font-size: 10px;
        letter-spacing: .14em;
        text-transform: uppercase;
      }
      body.nuvia-web2-embedded .nv-chart-reading p {
        margin: 0;
      }
      body.nuvia-web2-embedded .nv-frontier-summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin: 0 0 24px;
      }
      body.nuvia-web2-embedded .nv-frontier-stat {
        min-height: 92px;
        padding: 16px 17px;
        border: 1px solid #dce3e7;
        border-radius: 13px;
        background: #ffffff;
        box-shadow: 0 8px 20px rgba(11,35,71,.035);
      }
      body.nuvia-web2-embedded .nv-frontier-stat:nth-child(2) {
        border-top: 3px solid #6f8d3c;
      }
      body.nuvia-web2-embedded .nv-frontier-stat:nth-child(3) {
        background: #f4f7ed;
        border-color: #dce5c7;
      }
      body.nuvia-web2-embedded .nv-frontier-stat span {
        display: block;
        margin-bottom: 9px;
        color: #718196;
        font-size: 9.5px;
        font-weight: 750;
        letter-spacing: .16em;
        text-transform: uppercase;
      }
      body.nuvia-web2-embedded .nv-frontier-stat strong {
        display: block;
        color: #0b2347;
        font-size: 17px;
        font-weight: 550;
        line-height: 1.25;
        font-variant-numeric: tabular-nums;
      }
      body.nuvia-web2-embedded .nv-frontier-stat small {
        display: block;
        margin-top: 5px;
        color: #66788e;
        font-size: 11px;
      }
      body.nuvia-web2-embedded .nv-frontier-stat:nth-child(3) strong {
        color: #526d2a;
      }
      body.nuvia-web2-embedded [data-nuvia-frontier-legend] {
        display: none !important;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="correlation"] table,
      body.nuvia-web2-embedded [data-nuvia-chart-section="correlation"] [role="table"] {
        border-collapse: separate !important;
        border-spacing: 4px !important;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="correlation"] td,
      body.nuvia-web2-embedded [data-nuvia-chart-section="correlation"] th {
        min-width: 58px;
        height: 46px;
        border-radius: 7px;
        font-variant-numeric: tabular-nums;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="distribution"] {
        border-top: 4px solid #91ad4b !important;
        background: linear-gradient(145deg, #ffffff 0%, #f8f9f5 100%) !important;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="risk-return"],
      body.nuvia-web2-embedded [data-nuvia-chart-section="frontier"],
      body.nuvia-web2-embedded [data-nuvia-chart-section="evolution"],
      body.nuvia-web2-embedded [data-nuvia-chart-section="monte-carlo"] {
        --nv-accent: #6f8d3c;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="comparison"] {
        border-top: 4px solid #0b2347 !important;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="correlation"],
      body.nuvia-web2-embedded [data-nuvia-chart-section="risk-return"],
      body.nuvia-web2-embedded [data-nuvia-chart-section="frontier"],
      body.nuvia-web2-embedded [data-nuvia-chart-section="evolution"],
      body.nuvia-web2-embedded [data-nuvia-chart-section="monte-carlo"] {
        border-top-color: #d9e0e5 !important;
      }
      body.nuvia-web2-embedded [data-nuvia-chart-section="risk-return"] {
        border-top: 4px solid #0b2347 !important;
        background: linear-gradient(180deg, #ffffff 0%, #f7f9fb 100%) !important;
      }
      @media (max-width: 1180px) {
        body.nuvia-web2-embedded [data-nuvia-suite-hero] > div {
          grid-template-columns: minmax(0, 1fr) minmax(330px, .72fr) !important;
          gap: 32px !important;
        }
        body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-body {
          grid-template-columns: 106px minmax(0, 1fr);
          gap: 18px;
        }
        body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-donut {
          width: 104px;
          height: 104px;
        }
        body.nuvia-web2-embedded [data-nuvia-hero-visual] .nv-visual-donut::after {
          inset: 20px;
        }
        body.nuvia-web2-embedded [data-nuvia-build-controls] {
          grid-template-columns: minmax(0, 1fr) !important;
        }
        body.nuvia-web2-embedded [data-nuvia-chart-section="risk-return"],
        body.nuvia-web2-embedded [data-nuvia-chart-section="frontier"] {
          grid-column: 1 / -1;
        }
        body.nuvia-web2-embedded .nv-chart-meta {
          align-items: flex-start;
          flex-direction: column;
        }
        body.nuvia-web2-embedded .nv-chart-meta-items {
          justify-content: flex-start;
        }
        body.nuvia-web2-embedded .nv-frontier-summary {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
    `;
    document.head.appendChild(style);

    const normalizedText = (element) => (element?.textContent || '').replace(/\s+/g, ' ').trim();
    const findHeading = (text) => [...document.querySelectorAll('h1, h2, h3')]
      .find((heading) => normalizedText(heading) === text);
    const closestSection = (heading) => heading?.closest('section');
    const decorateRiskMap = (section) => {
      if (!section) return;
      const primaryLabels = new Set(['Cartera actual', 'Propuesta optimizada']);
      const benchmarkOffsets = {
        Conservador: { x: 10, y: -15 },
        Moderado: { x: 12, y: 22 },
        Equilibrado: { x: 12, y: -15 },
        Dinámico: { x: 12, y: 22 },
        Agresivo: { x: 12, y: -15 },
      };
      const chart = section.querySelector('svg[aria-label="Mapa riesgo rentabilidad"]');
      if (!chart) return;

      [...chart.querySelectorAll('text')].forEach((label) => {
        const name = normalizedText(label);
        if (!primaryLabels.has(name) && !benchmarkOffsets[name]) return;
        const group = label.parentElement;
        const point = group?.querySelector('circle');
        if (!group || !point) return;
        const cx = Number(point.getAttribute('cx'));
        const cy = Number(point.getAttribute('cy'));
        if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;

        if (primaryLabels.has(name)) {
          group.classList.add('nv-risk-primary');
          label.classList.add('nv-risk-primary-label');
          point.setAttribute('r', name === 'Propuesta optimizada' ? '10' : '9.5');
          if (name === 'Propuesta optimizada') {
            label.style.fill = '#5f7d2f';
            label.setAttribute('x', cx - 15);
            label.setAttribute('y', cy - 15);
            label.setAttribute('text-anchor', 'end');
          } else {
            label.style.fill = '#0b2347';
            label.setAttribute('x', cx + 15);
            label.setAttribute('y', cy + 21);
            label.setAttribute('text-anchor', 'start');
          }
        } else {
          group.classList.add('nv-risk-benchmark');
          label.classList.add('nv-risk-benchmark-label');
          point.setAttribute('r', '5');
          const offset = benchmarkOffsets[name];
          label.setAttribute('x', cx + offset.x);
          label.setAttribute('y', cy + offset.y);
          label.setAttribute('text-anchor', 'start');
        }
      });

      [...section.querySelectorAll('span')].forEach((label) => {
        const name = normalizedText(label);
        const item = label.parentElement;
        if (!item) return;
        if (primaryLabels.has(name)) item.classList.add('nv-risk-legend-primary');
        else if (benchmarkOffsets[name]) item.classList.add('nv-risk-legend-benchmark');
      });
    };

    const decorateFrontier = (section) => {
      if (!section) return;
      const chart = section.querySelector('svg[aria-label="Frontera eficiente estimada"]');
      if (!chart) return;
      [...chart.querySelectorAll('text')].forEach((label) => {
        const name = normalizedText(label);
        if (name !== 'Actual' && name !== 'Optimizada') return;
        label.classList.add('nv-frontier-label');
        const point = label.parentElement?.querySelector('circle');
        if (point) {
          point.classList.add(name === 'Actual' ? 'nv-frontier-point-current' : 'nv-frontier-point-optimized');
          point.setAttribute('r', name === 'Actual' ? '5.5' : '6.5');
        }
      });

      const sectionText = normalizedText(section);
      const actualMatch = sectionText.match(/Actual:\s*riesgo\s*([\d.,]+)%,\s*rent\.\s*([\d.,]+)%/i);
      const optimizedMatch = sectionText.match(/Optimizada:\s*riesgo\s*([\d.,]+)%,\s*rent\.\s*([\d.,]+)%/i);
      if (!actualMatch || !optimizedMatch) return;
      const toNumber = (value) => Number(value.replace(',', '.'));
      const actualRisk = toNumber(actualMatch[1]);
      const actualReturn = toNumber(actualMatch[2]);
      const optimizedRisk = toNumber(optimizedMatch[1]);
      const optimizedReturn = toNumber(optimizedMatch[2]);
      const riskDelta = optimizedRisk - actualRisk;
      const returnDelta = optimizedReturn - actualReturn;
      const signed = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(2)} pp`;

      let summary = section.querySelector('.nv-frontier-summary');
      if (!summary) {
        summary = document.createElement('div');
        summary.className = 'nv-frontier-summary';
        const meta = section.querySelector('.nv-chart-meta');
        if (meta) meta.insertAdjacentElement('afterend', summary);
      }
      const summaryMarkup = `
        <div class="nv-frontier-stat"><span>Cartera actual</span><strong>${actualRisk.toFixed(2)}% riesgo</strong><small>${actualReturn.toFixed(2)}% de rendimiento estimado</small></div>
        <div class="nv-frontier-stat"><span>Propuesta optimizada</span><strong>${optimizedRisk.toFixed(2)}% riesgo</strong><small>${optimizedReturn.toFixed(2)}% de rendimiento estimado</small></div>
        <div class="nv-frontier-stat"><span>Cambio del escenario</span><strong>${signed(riskDelta)} de riesgo</strong><small>${signed(returnDelta)} de rendimiento estimado</small></div>
      `;
      if (summary.innerHTML !== summaryMarkup) summary.innerHTML = summaryMarkup;

      [...section.querySelectorAll('[data-nuvia-frontier-legend]')].forEach((element) => {
        if (element.querySelector('svg')) element.removeAttribute('data-nuvia-frontier-legend');
      });
      [...section.querySelectorAll('div')].forEach((element) => {
        const text = normalizedText(element);
        if (!element.querySelector('svg') && element.children.length === 2 && text.includes('Actual: riesgo') && text.includes('Optimizada: riesgo')) {
          element.dataset.nuviaFrontierLegend = '';
        }
      });
    };

    const tagPortfolioLayout = () => {
      const portfolioMain = document.querySelector('main.nuvia-portfolio');
      if (!portfolioMain) return;

      const tabs = portfolioMain.querySelector('[role="tablist"]');
      const suiteShell = tabs?.closest('section');
      if (suiteShell) suiteShell.dataset.nuviaSuiteShell = '';
      if (tabs) {
        const requestedIndex = { portfolio: 0, technical: 1, fundamental: 2 }[requestedSuiteTab];
        const tabButtons = [...tabs.querySelectorAll('[role="tab"]')];
        const requestedButton = Number.isInteger(requestedIndex) ? tabButtons[requestedIndex] : null;
        if (requestedButton && requestedButton.getAttribute('aria-selected') !== 'true') requestedButton.click();
        tabs.dataset.nuviaSuiteTabs = '';
        const hero = tabs.previousElementSibling;
        if (hero) {
          hero.dataset.nuviaSuiteHero = '';
          const heroLayout = hero.firstElementChild;
          if (heroLayout && !heroLayout.querySelector('[data-nuvia-hero-visual]')) {
            const visual = document.createElement('div');
            visual.dataset.nuviaHeroVisual = '';
            visual.setAttribute('aria-hidden', 'true');
            visual.innerHTML = `
              <div class="nv-visual-head">
                <span class="nv-visual-kicker">Lectura patrimonial</span>
                <span class="nv-visual-status">Vista conectada</span>
              </div>
              <div class="nv-visual-body">
                <div class="nv-visual-donut"></div>
                <div class="nv-visual-bars">
                  <div class="nv-visual-row"><span>Distribución</span><span class="nv-visual-track"><i style="width:82%"></i></span></div>
                  <div class="nv-visual-row"><span>Riesgo</span><span class="nv-visual-track"><i style="width:61%"></i></span></div>
                  <div class="nv-visual-row"><span>Eficiencia</span><span class="nv-visual-track"><i style="width:73%"></i></span></div>
                </div>
              </div>
              <div class="nv-visual-foot"><span>Cartera</span><span>Técnico</span><span>Fundamental</span></div>
            `;
            heroLayout.appendChild(visual);
          }
        }
        const panel = tabs.nextElementSibling;
        if (panel) {
          panel.dataset.nuviaSuitePanel = '';
          const summary = panel.firstElementChild;
          if (summary) summary.dataset.nuviaActiveSummary = '';

          const selectedTab = tabs.querySelector('[role="tab"][aria-selected="true"]');
          const fundamentalSelected = selectedTab?.id === 'analytics-tab-fundamental';
          const fundamentalModule = panel.querySelector('[data-testid="fundamental-module"]');
          const fundamentalReady = !!fundamentalModule?.querySelector('[data-testid="fundamental-chart"]');
          const fundamentalFailed = !!fundamentalModule?.querySelector('[role="alert"]');
          let loadingNotice = panel.querySelector('[data-nuvia-fundamental-loading]');
          if (fundamentalSelected && !fundamentalReady && !fundamentalFailed) {
            if (!loadingNotice) {
              loadingNotice = document.createElement('div');
              loadingNotice.dataset.nuviaFundamentalLoading = '';
              loadingNotice.setAttribute('role', 'status');
              loadingNotice.setAttribute('aria-live', 'polite');
              loadingNotice.innerHTML = '<div><strong>Preparando el análisis fundamental</strong><span>La primera consulta obtiene y ordena los datos reales de la compañía. Puede tardar unos segundos.</span></div>';
              panel.insertBefore(loadingNotice, summary?.nextSibling || panel.firstChild);
            }
          } else if (loadingNotice) {
            loadingNotice.remove();
          }
        }
      }

      const noticeText = [...portfolioMain.querySelectorAll('p')].find((paragraph) =>
        normalizedText(paragraph).startsWith('Escenario educativo con valores ilustrativos.')
      );
      const notice = noticeText?.parentElement;
      const lab = notice?.parentElement;
      const layout = notice?.nextElementSibling;
      if (notice) notice.dataset.nuviaPortfolioNotice = '';
      if (lab) lab.dataset.nuviaPortfolioLab = '';
      if (layout && layout.children.length >= 2) {
        layout.dataset.nuviaPortfolioLayout = '';
        layout.children[0].dataset.nuviaBuildControls = '';
        layout.children[1].dataset.nuviaVisualStory = '';
      }

      const holdingsHeading = findHeading('Mi cartera');
      const holdings = holdingsHeading?.parentElement?.parentElement;
      if (holdings) holdings.dataset.nuviaHoldings = '';

      const diagnostic = closestSection(findHeading('Diagnóstico rápido'));
      if (diagnostic) diagnostic.dataset.nuviaDiagnostic = '';

      const sectionMap = new Map([
        ['Propuesta optimizada', 'comparison'],
        ['Distribución patrimonial', 'distribution'],
        ['Matriz de correlaciones', 'correlation'],
        ['Mapa riesgo / rentabilidad', 'risk-return'],
        ['Frontera eficiente', 'frontier'],
        ['Evolución del escenario educativo', 'evolution'],
        ['Proyección Monte-Carlo · 3 años', 'monte-carlo'],
      ]);
      const chartDetail = {
        comparison: {
          label: 'Comparativa de cartera',
          items: ['Peso actual', 'Peso propuesto', 'Cambio neto'],
          reading: 'Compara los pesos con la misma escala para identificar de inmediato qué posiciones aumentan, se mantienen o se reducen.'
        },
        distribution: {
          label: 'Mapa de exposición',
          items: ['Activo subyacente', 'Geografía', 'Peso sobre capital'],
          reading: 'Lee primero la concentración por clase de activo y después comprueba si la exposición geográfica refuerza o reduce esa concentración.'
        },
        correlation: {
          label: 'Matriz profesional',
          items: ['Escala −1 a +1', 'Diagonal = 1', 'Color por intensidad'],
          reading: 'Los valores próximos a 1 se mueven de forma parecida; los valores más bajos aportan una mayor capacidad potencial de diversificación.'
        },
        'risk-return': {
          label: 'Plano riesgo / rendimiento',
          items: ['Eje X · volatilidad', 'Eje Y · rendimiento', 'Perfiles comparables'],
          reading: 'Las posiciones más arriba ofrecen mayor rendimiento estimado; cuanto más a la izquierda, menor es la volatilidad asumida.'
        },
        frontier: {
          label: 'Frontera eficiente',
          items: ['Actual', 'Propuesta', 'Curva eficiente'],
          reading: 'La curva muestra las combinaciones con mejor rendimiento estimado para cada nivel de riesgo dentro de este escenario educativo.'
        },
        evolution: {
          label: 'Evolución comparada',
          items: ['Base 100', 'Horizonte 5 años', 'Actual vs propuesta'],
          reading: 'La separación entre las líneas permite observar cómo pequeñas diferencias de rentabilidad y volatilidad se acumulan con el tiempo.'
        },
        'monte-carlo': {
          label: 'Escenarios probabilísticos',
          items: ['Bandas p5–p95', 'Mediana', 'Horizonte 3 años'],
          reading: 'Las bandas representan un rango de resultados posibles; no son una predicción, sino una forma de visualizar la incertidumbre.'
        }
      };
      let chartStory = null;
      sectionMap.forEach((key, title) => {
        const section = closestSection(findHeading(title));
        if (!section) return;
        section.dataset.nuviaChartSection = key;
        const detail = chartDetail[key];
        if (detail && !section.querySelector('.nv-chart-meta')) {
          const meta = document.createElement('div');
          meta.className = 'nv-chart-meta';
          meta.innerHTML = `
            <span class="nv-chart-meta-label">${detail.label}</span>
            <span class="nv-chart-meta-items">${detail.items.map((item) => `<span class="nv-chart-meta-item">${item}</span>`).join('')}</span>
          `;
          const header = section.firstElementChild;
          if (header) header.insertAdjacentElement('afterend', meta);

          const reading = document.createElement('div');
          reading.className = 'nv-chart-reading';
          reading.innerHTML = `<strong>Cómo leerlo</strong><p>${detail.reading}</p>`;
          section.appendChild(reading);
        }
        section.querySelectorAll('svg[viewBox]').forEach((svg) => {
          const plot = svg.parentElement;
          if (plot && !plot.dataset.nuviaPlot) plot.dataset.nuviaPlot = key;
        });
        chartStory ||= section.parentElement;
      });
      if (chartStory) chartStory.dataset.nuviaChartStory = '';
      decorateRiskMap(closestSection(findHeading('Mapa riesgo / rentabilidad')));
      decorateFrontier(closestSection(findHeading('Frontera eficiente')));
    };

    const layoutObserver = new MutationObserver(tagPortfolioLayout);
    layoutObserver.observe(document.body, { childList: true, subtree: true });
    tagPortfolioLayout();
    window.setTimeout(tagPortfolioLayout, 250);
    window.setTimeout(tagPortfolioLayout, 900);

    let animationFrame = 0;
    const reportHeight = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const root = document.getElementById('root');
        const height = Math.ceil(Math.max(
          root?.scrollHeight || 0,
          root?.getBoundingClientRect().height || 0,
          document.body.getBoundingClientRect().height,
        ));
        window.parent.postMessage({
          source: 'nuvia-core',
          type: 'resize',
          height,
        }, window.location.origin);
      });
    };

    const observer = new ResizeObserver(reportHeight);
    observer.observe(document.documentElement);
    observer.observe(document.body);
    const root = document.getElementById('root');
    if (root) observer.observe(root);

    window.addEventListener('load', reportHeight);
    window.addEventListener('resize', reportHeight);
    reportHeight();
    window.setTimeout(reportHeight, 300);
    window.setTimeout(reportHeight, 1200);
  };

  if (embeddedInWeb2) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', activateEmbeddedMode, { once: true });
    } else {
      activateEmbeddedMode();
    }
    return;
  }

  if (params.get('from') !== 'web2') return;

  const addBackLink = () => {
    if (document.getElementById('nuvia-web2-back')) return;
    const link = document.createElement('a');
    link.id = 'nuvia-web2-back';
    link.href = '../index.html';
    link.textContent = '← Volver a NUVIA Web 2';
    link.setAttribute('aria-label', 'Volver a la portada de NUVIA Web 2');
    link.style.cssText = [
      'position:fixed',
      'right:16px',
      'bottom:16px',
      'z-index:9999',
      'border:1px solid rgba(255,255,255,.22)',
      'border-radius:999px',
      'background:#0B2347',
      'box-shadow:0 10px 28px rgba(11,35,71,.28)',
      'color:#fff',
      'font:700 12px/1.2 system-ui,sans-serif',
      'padding:11px 16px',
      'text-decoration:none',
    ].join(';');
    document.body.appendChild(link);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addBackLink);
  else addBackLink();
})();
