/* Presentación y rutas locales; no abre fuentes externas ni recopila información. */
export async function checkWellbeingEntry(page, route) {
  if(!route.startsWith('temas.html')) return [];
  if(route!=='temas.html?topic=bienestar') {
    return await page.locator('.tm-wellbeing-nav,#bienestar-ambitos,#bienestar-fuentes').count() ? ['Bienestar invade una vista de Patrimonio'] : [];
  }
  const problems=[], start=page.url();
  if(await page.locator('main h1').textContent()!=='Familia, Salud y Bienestar') problems.push('Nombre incorrecto del espacio');
  if(await page.title()!=='NUVIA · Familia, Salud y Bienestar') problems.push('Título incorrecto de la pestaña');
  if(await page.locator('main input,main textarea,main form').count()) problems.push('Bienestar solicita datos');
  if(await page.locator('.tm-pillar[role="listitem"]').count()!==5) problems.push('Faltan los cinco temas semánticos');
  if(await page.locator('.tm-pillars a,.tm-pillars button,.tm-pillars [tabindex]').count()) problems.push('Los temas simulan acceso a contenidos inexistentes');
  if(await page.locator('.tm-card__tag.nv-tag--pending').count()!==3) problems.push('Las tres guías no están marcadas en preparación');
  for(const card of await page.locator('.tm-card:has(.nv-tag--pending)').all()) {
    if(await card.locator('a,button,input').count()) problems.push('Una guía pendiente ofrece una acción falsa');
  }
  if(!await page.locator('.tm-wellbeing-availability').isVisible()||!await page.locator('.tm-wellbeing-limits').isVisible()) problems.push('Falta la disponibilidad o los límites');
  const sources=page.locator('.tm-wellbeing-source__link');
  if(await sources.count()!==2) problems.push('Faltan los dos índices de consulta');
  for(const source of await sources.all()) {
    if(await source.getAttribute('target')!=='_blank'||await source.getAttribute('rel')!=='noopener noreferrer') problems.push('Enlace externo sin protección');
  }
  for(const id of ['bienestar-ambitos','bienestar-guias','bienestar-fuentes']) {
    const link=page.locator(`.tm-wellbeing-nav a[href="#${id}"]`);
    await link.focus();
    await page.keyboard.press('Enter');
    await page.waitForURL(new URL('#'+id,start).href);
    await page.waitForFunction(id=>{
      const el=document.getElementById(id), rect=el.getBoundingClientRect();
      const header=document.querySelector('header')?.getBoundingClientRect();
      return rect.top>=(header?.bottom||0)-1 && rect.top<innerHeight-40;
    },id,{timeout:5000});
    if(await page.locator('#tema').evaluate(el=>el.scrollTop!==0)) problems.push('El enlace desplaza el interior de la cabecera');
  }
  await page.locator('.tm-wellbeing-reading a').click();
  await page.waitForURL(new URL('lecturas.html',start).href);
  await page.locator('.lecturas-card').first().waitFor({state:'visible'});
  await page.locator('footer a[href="temas.html?topic=bienestar"]').click();
  await page.waitForURL(start);
  await page.locator('.tm-wellbeing-nav').waitFor({state:'visible'});
  return problems;
}
