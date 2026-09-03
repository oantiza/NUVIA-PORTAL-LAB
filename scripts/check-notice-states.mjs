/* Estados alcanzables sin servicios remotos. Usa los controles de la página,
   comprueba recuperación y deja de nuevo visible la vista inicial. */
export async function checkNoticeStates(page, route) {
  const problems = await page.evaluate(() => {
    const out=[];
    for (const el of document.querySelectorAll('.nv-notice')) {
      const rect=el.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      if (getComputedStyle(el).fontSize!=='14px') out.push('Aviso fuera del rol tipográfico común');
      if (el.scrollWidth>el.clientWidth+1 || el.scrollHeight>el.clientHeight+1) out.push('Aviso recortado');
    }
    for (const el of document.querySelectorAll('[data-news-update-status],.markets-lab__table-subtitle')) {
      if (el.getAttribute('role')!=='status'||el.getAttribute('aria-atomic')!=='true') out.push('Mensaje dinámico sin semántica de estado');
    }
    if (document.querySelector('.nv-notice-samples [role="status"],.nv-notice-samples [role="alert"]')) out.push('Una muestra anuncia un estado real');
    return out;
  });
  if (route==='mercados.html?vista=cotizaciones') {
    const search=page.locator('.markets-lab__search input');
    const original=await page.locator('.markets-lab__quote').allTextContents();
    const index=await page.locator('.markets-lab__index-button[aria-pressed="true"]').textContent();
    await page.getByRole('button',{name:'Banca',exact:true}).click();
    await search.fill('sin-coincidencia-nuvia');
    await page.locator('.markets-lab__empty').waitFor({state:'visible'});
    const state=await page.evaluate(()=>{
      const el=document.querySelector('.markets-lab__empty'),status=document.querySelector('.markets-lab__table-subtitle');
      const rect=el.getBoundingClientRect();
      return {inside:!!el.closest('.markets-lab__table-scroll'), count:document.querySelectorAll('.markets-lab__quote').length,
        message:status.textContent, fits:rect.left>=0&&rect.right<=innerWidth&&el.scrollWidth<=el.clientWidth+1,
        font:getComputedStyle(el).fontSize};
    });
    if(state.inside||!state.fits||state.font!=='14px')problems.push('El aviso vacío queda desplazado, cortado o fuera de escala');
    if(state.count!==0||!state.message.includes('Sin coincidencias'))problems.push('La búsqueda vacía no se identifica correctamente');
    const reset=page.getByRole('button',{name:'Limpiar búsqueda y sector',exact:true});
    await reset.focus();
    await page.keyboard.press('Enter');
    await page.locator('.markets-lab__empty').waitFor({state:'detached'});
    if(await search.inputValue()!=='')problems.push('La búsqueda no se limpia');
    if(!await search.evaluate(el=>el===document.activeElement))problems.push('El foco se pierde al limpiar');
    if(await page.getByRole('button',{name:'Todos',exact:true}).getAttribute('aria-pressed')!=='true')problems.push('El sector no se restablece');
    if(JSON.stringify(await page.locator('.markets-lab__quote').allTextContents())!==JSON.stringify(original))problems.push('Limpiar no recupera los mismos datos');
    if(await page.locator('.markets-lab__index-button[aria-pressed="true"]').textContent()!==index)problems.push('Limpiar altera el índice');
    // Los dos calendarios son referencias estáticas. Comprueba cada filtro
    // sin alterar las fechas ni visitar proveedores.
    for(const name of ['Calendario económico','Calendario de empresas']) {
      await page.getByRole('button',{name,exact:true}).click();
      const notice=page.locator('.markets-calendar-notice');
      await notice.waitFor({state:'visible'});
      if(!(await notice.textContent()).includes('agosto de 2026'))problems.push('Calendario sin referencia fechada');
      for(const period of ['11 ago 2026','Semana del 10 ago','Agosto 2026']) {
        const button=page.getByRole('button',{name:period,exact:true});
        await button.click();
        if(await button.getAttribute('aria-pressed')!=='true')problems.push('El filtro de calendario no conserva su estado');
      }
      if(await page.locator('.markets-calendar-panel').evaluate(el=>el.scrollWidth>el.clientWidth+1))problems.push('El calendario desborda tras aclarar sus fechas');
      await page.getByRole('button',{name:'11 ago 2026',exact:true}).click();
    }
    await page.getByRole('button',{name:'Cotizaciones',exact:true}).click();
    // Archivo vacío: no simula carga ni error; ofrece una salida real.
    await page.getByRole('button',{name:'Informes',exact:true}).click();
    await page.locator('.markets-archive__empty').waitFor({state:'visible'});
    if(!await page.getByRole('heading',{name:'Todavía no hay informes publicados',exact:true}).isVisible())problems.push('Archivo vacío sin explicación');
    if(await page.locator('.markets-archive__empty a').getAttribute('href')!=='mercados.html')problems.push('Archivo vacío sin salida a Mercados');
    await page.getByRole('button',{name:'Mercados y cotizaciones',exact:true}).click();
  }
  return problems;
}
