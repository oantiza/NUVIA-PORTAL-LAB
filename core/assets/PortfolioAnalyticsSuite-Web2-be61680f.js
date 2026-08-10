import { r as React, a as jsxRuntime } from './index-Bar5NDm1.js';
import PortfolioAnalyticsSuite from './PortfolioAnalyticsSuite-Q5uiZ5Xr.js?original=1';

const SUITE_TABS = new Set(['portfolio', 'technical', 'fundamental']);

function PortfolioAnalyticsSuiteWeb2() {
  const requested = new URLSearchParams(window.location.search).get('suiteTab');
  const selectedTab = SUITE_TABS.has(requested) ? requested : 'portfolio';

  React.useEffect(() => {
    const button = document.getElementById(`analytics-tab-${selectedTab}`);
    if (button && button.getAttribute('aria-selected') !== 'true') button.click();
  }, [selectedTab]);

  return jsxRuntime.jsx(PortfolioAnalyticsSuite, {});
}

export default PortfolioAnalyticsSuiteWeb2;
