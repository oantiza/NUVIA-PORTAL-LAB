/* Vistas secundarias: lectura de gráficos y navegación local, sin servicios remotos. */
export async function checkFamilyReview(page, route) {
  const contracts = {
    'academia.html?tab=calculadora': ['.ac-compound-chart__plot', 2, 5],
    'academia.html?tab=fundamentos': ['.nv-chart-scroll', 6, 18],
    'jubilacion.html#resultados': ['.jub-chart-wrap__plot', 4, 5],
  };
  const problems = [];
  const contract = contracts[route];
  if (contract) {
    problems.push(...await page.evaluate(([selector, curves, labels]) => {
      const out=[], root=document.querySelector(selector);
      if (!root) return [`Gráfico ausente: ${selector}`];
      const svg=root.querySelector('svg'), lines=[...root.querySelectorAll('polyline')];
      if (!svg || svg.getAttribute('role')!=='img' || !svg.getAttribute('aria-label')) out.push('Gráfico sin nombre accesible');
      if (lines.length!==curves) out.push('Faltan series del gráfico');
      for (const line of lines) {
        const points=(line.getAttribute('points')||'').trim().split(/[\s,]+/);
        if (points.length<4 || points.some(n=>n==='' || !Number.isFinite(Number(n)))) out.push('Serie vacía o con coordenadas no numéricas');
      }
      const texts=[...root.querySelectorAll(':scope > span, svg text')];
      if (texts.length!==labels) out.push(`Faltan rótulos: ${texts.length}/${labels}`);
      const area=root.getBoundingClientRect();
      for (const el of texts) {
        const box=el.getBoundingClientRect(), style=getComputedStyle(el);
        const ctm=el instanceof SVGGraphicsElement ? el.getScreenCTM() : null;
        const size=parseFloat(style.fontSize)*(ctm ? Math.hypot(ctm.a,ctm.b) : 1);
        if (!box.width || !box.height || !el.textContent.trim() || el.textContent.includes('{{')) out.push('Rótulo invisible o sin resolver');
        if (size<11.99) out.push('Rótulo por debajo de 12 px efectivos');
        // El gráfico histórico tiene desplazamiento propio; los otros deben caber completos.
        if (!root.matches('.nv-chart-scroll') && (box.left<area.left-1 || box.right>area.right+1 || box.top<area.top-18 || box.bottom>area.bottom+1)) out.push('Rótulo fuera de su gráfico');
      }
      if (root.matches('.ac-compound-chart__plot')) {
        if (getComputedStyle(lines[0]).strokeDasharray!=='none' || getComputedStyle(lines[1]).strokeDasharray==='none') out.push('Las curvas no se distinguen por trazo');
      }
      if (root.matches('.nv-chart-scroll')) {
        const axis=svg.querySelector('line').getBoundingClientRect();
        for (const el of svg.querySelectorAll('text')) if(el.textContent.startsWith('$') && el.getBoundingClientRect().right>axis.left-3) out.push('La cifra histórica invade la zona de trazado');
      }
      return [...new Set(out)];
    }, contract));
  }
  if (route==='academia.html?tab=fundamentos') {
    if (await page.locator('.ac-x71 > div').count()!==7) problems.push('Tabla histórica incompleta');
    for (const selector of ['.nv-chart-scroll','.ac-x71']) {
      const region=page.locator(selector);
      if (!await region.count()) { problems.push(`Región ausente: ${selector}`); continue; }
      const state=await region.evaluate(el=>({overflow:el.scrollWidth>el.clientWidth+1,tab:el.tabIndex,role:el.getAttribute('role'),label:el.getAttribute('aria-label'),help:document.getElementById(el.getAttribute('aria-describedby'))?.textContent}));
      if(state.tab!==0 || state.role!=='region' || !state.label || !state.help) problems.push('Gráfico/tabla sin acceso o ayuda de teclado');
      if (!state.overflow) continue;
      await region.focus();
      const before=await region.evaluate(el=>({x:el.scrollLeft,content:el.textContent,points:[...el.querySelectorAll('polyline')].map(p=>p.getAttribute('points')).join('|')}));
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(({selector,x})=>document.querySelector(selector).scrollLeft>x,{selector,x:before.x},{timeout:3000});
      if (!await region.evaluate((el,b)=>el.textContent===b.content && [...el.querySelectorAll('polyline')].map(p=>p.getAttribute('points')).join('|')===b.points,before)) problems.push('El desplazamiento altera datos históricos');
    }
  }
  if (route==='academia.html?tab=calculadora') {
    const capital=page.getByLabel('Capital inicial',{exact:true}), original=await capital.inputValue();
    const max=page.locator('.ac-compound-chart__y--max'), before=await max.textContent();
    const curves=await page.locator('.ac-compound-chart polyline').evaluateAll(els=>els.map(el=>el.getAttribute('points')));
    await capital.fill(String(Number(original)+1000));
    await page.waitForFunction(text=>document.querySelector('.ac-compound-chart__y--max').textContent!==text,before,{timeout:3000});
    await capital.fill(original);
    await page.waitForFunction(text=>document.querySelector('.ac-compound-chart__y--max').textContent===text,before,{timeout:3000});
    const restored=await page.locator('.ac-compound-chart polyline').evaluateAll(els=>els.map(el=>el.getAttribute('points')));
    if(JSON.stringify(curves)!==JSON.stringify(restored)) problems.push('Restaurar los parámetros no recupera las mismas curvas');
  }
  if (route==='curso.html') {
    const tabs=page.locator('.curso-tab');
    if(await tabs.count()!==5) return [...problems,'Faltan capítulos del curso'];
    for(let i=0;i<5;i++) {
      const title=await tabs.nth(i).locator('strong').textContent();
      await tabs.nth(i).click();
      await page.waitForFunction(title=>document.querySelector('.curso-cap h2')?.textContent===title,title,{timeout:3000});
      // La capa común normaliza este programa como grupo de botones de selección.
      // Esperar esa normalización posterior al render, no medir el estado intermedio.
      await page.waitForFunction(index=>document.querySelectorAll('.curso-tab[aria-pressed="true"]').length===1 && document.querySelectorAll('.curso-tab')[index]?.getAttribute('aria-pressed')==='true',i,{timeout:3000});
      if(!await page.locator(`a[href$=".pdf"]`).count()) problems.push('El capítulo no ofrece sus apuntes');
    }
    await tabs.first().click();
  }
  return [...new Set(problems)];
}
