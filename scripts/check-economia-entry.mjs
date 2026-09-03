/* Entrada informativa: solo rutas locales. No activa cuentas ni el módulo de empresas. */
export async function checkEconomiaEntry(page, route) {
  const problems=[];
  if(route.startsWith('cartera.html')) {
    if(await page.locator('main a[href="mercados.html"]').count()!==1) problems.push('Cartera no identifica su espacio de origen');
    if(!await page.locator('.nuvia-analysis-availability').isVisible()) problems.push('Falta la aclaración de disponibilidad');
    if(await page.locator('.nuvia-analysis-tabs a').count()!==3) problems.push('Cartera pierde una de sus tres vistas');
  }
  if(!route.startsWith('mercados.html')) return problems;
  const start=page.url();
  if(await page.locator('main h1').textContent()!=='Economía y Finanzas') problems.push('La cabecera no identifica el espacio');
  if(await page.title()!=='NUVIA · Economía y Finanzas') problems.push('El título cambia al iniciar el controlador');
  if(await page.locator('[data-economia-area]').count()!==2) return [...problems,'La entrada no tiene sus dos ámbitos'];
  problems.push(...await page.locator('.markets-space-nav').evaluate(nav=>{
    const out=[];
    for(const el of [nav,...nav.querySelectorAll('a,strong,span')]) {
      const rect=el.getBoundingClientRect();
      if(!rect.width||!rect.height||rect.left<0||rect.right>innerWidth+1||el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1) out.push('Un ámbito de Economía está oculto o recortado');
    }
    const cards=[...nav.querySelectorAll('a')].map(a=>a.getBoundingClientRect());
    if(Math.abs(cards[0].width-cards[1].width)>1||Math.abs(cards[0].top-cards[1].top)>1) out.push('Los dos ámbitos no tienen igual jerarquía');
    return out;
  }));
  if(route==='mercados.html') {
    const originalDate=await page.locator('[data-macro-updated]').textContent();
    await page.locator('[data-economia-area="cartera"]').focus();
    await page.keyboard.press('Enter');
    await page.waitForURL(new URL('cartera.html',start).href);
    await page.locator('#analysis-title').waitFor({state:'visible'});
    await page.locator('main a[href="mercados.html"]').click();
    await page.waitForURL(start);
    await page.locator('.markets-secondary-card').first().waitFor({state:'visible'});
    // Cambiar de pestaña no cambia la URL. El enlace debe recuperar noticias
    // también cuando solo navega a un ancla de la página ya cargada.
    for(const name of ['Informes','Mercados y cotizaciones']) {
      await page.getByRole('button',{name,exact:true}).click();
      const view=name==='Informes'?'.markets-archive__empty':'.markets-lab__quote';
      await page.locator(view).first().waitFor({state:'visible'});
      await page.waitForFunction(name=>{
        const pressed=document.querySelectorAll('.markets-viewnav [aria-pressed="true"]');
        return pressed.length===1 && pressed[0].textContent.trim()===name;
      },name,{timeout:5000});
      await page.locator('[data-economia-area="mercados"]').click();
      await page.locator('.markets-secondary-card').first().waitFor({state:'visible'});
      await page.waitForFunction(date=>document.querySelector('[data-macro-updated]')?.textContent===date,originalDate);
    }
    await page.getByRole('button',{name:'Informes',exact:true}).click();
    await page.locator('.markets-archive__empty').waitFor({state:'visible'});
    await page.getByRole('button',{name:'Noticias y contexto',exact:true}).click();
    await page.locator('.markets-secondary-card').first().waitFor({state:'visible'});
    await page.waitForFunction(date=>document.querySelector('[data-macro-updated]')?.textContent===date,originalDate);
  }
  // Desde Informes o Cotizaciones el enlace debe recuperar la vista de noticias.
  await page.locator('[data-economia-area="mercados"]').click();
  await page.waitForURL(new URL('mercados.html#actualidad',start).href);
  await page.locator('.markets-secondary-card').first().waitFor({state:'visible'});
  if(await page.locator('.markets-macro__item').count()!==5) problems.push('El acceso a noticias no conserva sus indicadores');
  if(await page.getByRole('button',{name:'Noticias y contexto',exact:true}).getAttribute('aria-pressed')!=='true') problems.push('El acceso a noticias abre otra vista');
  if(await page.locator('#mercados').evaluate(el=>el.scrollTop!==0)) problems.push('El ancla desplaza el interior del hero y deja un hueco vacío');
  await page.goto(start);
  const ready=route.includes('cotizaciones')?'.markets-lab__quote':route.includes('informes')?'.markets-archive__empty':'.markets-secondary-card';
  await page.locator(ready).first().waitFor({state:'visible'});
  return problems;
}
