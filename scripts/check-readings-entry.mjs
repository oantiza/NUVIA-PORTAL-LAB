/* Catálogo local: no abre las editoriales, tiendas ni servicios externos. */
export async function checkReadingsEntry(page, route) {
  if(route!=='lecturas.html') return [];
  const problems=[], start=page.url();
  if(await page.title()!=='NUVIA · Lecturas con Criterio') problems.push('Título de Lecturas no canónico');
  const expected={comportamiento:['psicologia-dinero','pensar-rapido'],inversion:['inversor-inteligente','wall-street'],todos:['psicologia-dinero','inversor-inteligente','wall-street','pensar-rapido']};
  for(const [theme,ids] of Object.entries(expected)) {
    const button=page.locator(`[data-reading-filter="${theme}"]`);
    await button.focus();
    await page.keyboard.press(theme==='inversion'?'Space':'Enter');
    await page.waitForFunction(theme=>document.querySelector(`[data-reading-filter="${theme}"]`)?.getAttribute('aria-pressed')==='true',theme,{timeout:3000});
    const visible=await page.locator('.lecturas-card:not([hidden])').evaluateAll(cards=>cards.map(c=>c.dataset.bookId));
    if(JSON.stringify(visible)!==JSON.stringify(ids)) problems.push(`Filtro ${theme}: selección u orden incorrectos`);
    if(await page.locator('[data-reading-filter][aria-pressed="true"]').count()!==1) problems.push('Más de un tema activo');
    if(!(await page.locator('#lecturas-result-count').textContent()).startsWith(`Mostrando ${ids.length} de 4 libros`)) problems.push('Contador incorrecto');
    for(const hidden of await page.locator('.lecturas-card[hidden]').all()) if(await hidden.isVisible()) problems.push('Libro filtrado sigue visible');
    for(const id of ids) {
      const open=page.locator(`[data-book-id="${id}"] .lecturas-summary-button`);
      await open.focus();
      await page.keyboard.press('Enter');
      await page.locator('#lecturas-book-dialog').waitFor({state:'visible'});
      for(const selector of ['#lecturas-dialog-reason','#lecturas-dialog-limit']) if((await page.locator(selector).textContent()).trim().length<30) problems.push(`${id}: ficha editorial incompleta`);
      const source=page.locator('#lecturas-dialog-source');
      if(!/^https:\/\/www\.(planetadelibros|penguinlibros)\.com\//.test(await source.getAttribute('href'))) problems.push(`${id}: fuente incorrecta`);
      if(await source.getAttribute('rel')!=='noopener noreferrer') problems.push('Fuente externa sin protección');
      await source.focus();
      const overflow=await page.locator('#lecturas-book-dialog').evaluate(el=>el.scrollWidth>el.clientWidth+1 || el.getBoundingClientRect().right>innerWidth+1);
      if(overflow) problems.push('La ficha ampliada desborda');
      await page.keyboard.press('Escape');
      await page.locator('#lecturas-book-dialog').waitFor({state:'hidden'});
      if(!await open.evaluate(el=>el===document.activeElement)) problems.push('La ficha no devuelve el foco');
    }
  }
  // Reproduce el cierre diferido seguido de otro control, sin depender de la
  // velocidad del equipo: el evento close no debe robar el foco del filtro.
  await page.locator('.lecturas-summary-button').first().click();
  await page.locator('#lecturas-book-dialog').waitFor({state:'visible'});
  const focusPreserved=await page.evaluate(()=>new Promise(resolve=>{
    const dialog=document.getElementById('lecturas-book-dialog');
    const filter=document.querySelector('[data-reading-filter="inversion"]');
    dialog.addEventListener('close',()=>resolve(document.activeElement===filter),{once:true});
    dialog.querySelector('.lecturas-dialog-close').click();
    filter.focus();
  }));
  if(!focusPreserved) problems.push('El cierre diferido roba el foco del siguiente control');
  await page.locator('[data-reading-filter="inversion"]').click();
  await page.reload();
  await page.locator('.lecturas-card').last().waitFor({state:'visible'});
  if(await page.locator('.lecturas-card[hidden]').count()) problems.push('El filtro persiste tras recargar');
  if(await page.locator('[data-reading-filter="todos"]').getAttribute('aria-pressed')!=='true') problems.push('La recarga no restaura Todos');
  if(await page.locator('#comunidad-lecturas button,#comunidad-lecturas input,#comunidad-lecturas textarea,#comunidad-lecturas form').count()) problems.push('Comunidad futura con controles activos');
  for(const id of ['criterios-lecturas','comunidad-lecturas','seleccion-lecturas']) {
    await page.locator(`main a[href="#${id}"]`).focus();
    await page.keyboard.press('Enter');
    await page.waitForURL(new URL('#'+id,start).href);
    await page.waitForFunction(id=>{
      const r=document.getElementById(id).getBoundingClientRect();
      return r.top>=document.querySelector('header').getBoundingClientRect().bottom-1 && r.top<innerHeight-40;
    },id,{timeout:5000}).catch(async error=>{
      const position=await page.evaluate(id=>({target:document.getElementById(id).getBoundingClientRect().top,header:document.querySelector('header').getBoundingClientRect().bottom,height:innerHeight,scroll:scrollY}),id);
      throw new Error(`Ancla ${id}: ${JSON.stringify(position)}; ${error.message}`);
    });
  }
  return problems;
}
