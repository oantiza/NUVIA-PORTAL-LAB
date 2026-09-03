/* Contrato de lectura de tablas. Solo desplaza regiones y mide su contenido. */
export async function checkTablesAndResults(page, route) {
  // No aprobar por ausencia: la prueba debe encontrar la tabla que promete revisar.
  if (route==='mercados.html?vista=cotizaciones' && !await page.locator('.markets-lab table').count()) return ['No está visible la vista de cotizaciones que debe comprobarse'];
  if (route==='vivienda.html' && !await page.locator('.viv-table__data').count()) return ['No está presente la tabla de amortización que debe comprobarse'];
  const problems = await page.evaluate(() => {
    const out=[];
    const visible=el=>el.getBoundingClientRect().width>0 && el.getBoundingClientRect().height>0 && getComputedStyle(el).visibility!=='hidden';
    const heads=[...document.querySelectorAll('.viv-table__head > span')];
    const rows=[...document.querySelectorAll('.viv-table__row')];
    if (heads.length) {
      if (heads.length!==6 || !rows.length) out.push('Amortización: faltan cabeceras o filas');
      if (!document.querySelector('.viv-table__data[role="table"]')) out.push('Amortización sin semántica de tabla');
      for (const row of rows) {
        if (row.children.length!==6 || row.getAttribute('role')!=='row') out.push('Amortización: fila incompleta');
        [...row.children].forEach((cell,i)=>{
          const a=heads[i]?.getBoundingClientRect(),b=cell.getBoundingClientRect();
          if (a && (Math.abs(a.left-b.left)>1 || Math.abs(a.right-b.right)>1)) out.push('Amortización: cabecera y columna desalineadas');
          if (getComputedStyle(cell).fontSize!=='14px') out.push('Amortización: dato fuera de la escala de tabla');
          if (cell.scrollWidth>cell.clientWidth+1) out.push('Amortización: cifra cortada en una celda');
        });
      }
    }
    for (const table of [...document.querySelectorAll('.nv-table,.gt-tabla,.markets-lab table')].filter(visible)) {
      if (!table.caption?.textContent.trim()) out.push('Tabla sin nombre descriptivo');
      if (getComputedStyle(table).fontSize!=='14px') out.push('Tabla fuera del tamaño común');
      if ([...table.querySelectorAll('thead th')].some(th=>th.scope!=='col')) out.push('Encabezado sin relación de columna');
      if (table.closest('.markets-lab')) {
        if ([...table.querySelectorAll('thead th')].filter(visible).length!==7) out.push('Mercados oculta columnas');
        for (const row of table.querySelectorAll('tbody tr')) {
          if ([...row.children].filter(visible).length!==7) out.push('Mercados: fila incompleta');
          [...row.children].slice(1,6).forEach(cell=>{if(getComputedStyle(cell).textAlign!=='right')out.push('Mercados: cifra sin alinear a la derecha');});
        }
      }
      if (table.matches('.nv-sim-tabla')) {
        for(const cell of table.querySelectorAll('tr > :nth-child(3)')) if(getComputedStyle(cell).textAlign!=='left')out.push('La explicación del laboratorio se alinea como una cifra');
      }
    }
    for(const value of [...document.querySelectorAll('.curso-resultado strong,.nv-lab-resumen__valor')].filter(visible)) {
      const s=getComputedStyle(value);
      if(s.fontSize!=='28px'||!s.fontVariantNumeric.includes('tabular-nums'))out.push('Resultado fuera del rol tipográfico común');
      if(value.scrollWidth>value.clientWidth+1)out.push('Resultado recortado');
    }
    return [...new Set(out)];
  });
  const regions=page.locator('.nv-table-scroll,.markets-lab__table-scroll,.gt-tabla-envoltorio,.nv-sim-tabla-scroll');
  for(let i=0;i<await regions.count();i++) {
    const region=regions.nth(i);
    if(!await region.isVisible())continue;
    const state=await region.evaluate(el=>({x:el.scrollWidth>el.clientWidth+1,y:el.scrollHeight>el.clientHeight+1,tab:el.tabIndex,name:el.getAttribute('aria-label')||document.getElementById(el.getAttribute('aria-labelledby'))?.textContent,role:el.getAttribute('role')}));
    if(state.tab!==0||state.role!=='region'||!state.name)problems.push('Región de tabla sin acceso o nombre para teclado');
    if(!state.x&&!state.y)continue;
    await region.focus();
    const before=await region.evaluate(el=>({x:el.scrollLeft,y:el.scrollTop,content:el.textContent}));
    await page.keyboard.press(state.x?'ArrowRight':'ArrowDown');
    await page.waitForFunction(({selector,index,x,before})=>{const el=document.querySelectorAll(selector)[index];return x?el.scrollLeft>before.x:el.scrollTop>before.y;},{selector:'.nv-table-scroll,.markets-lab__table-scroll,.gt-tabla-envoltorio,.nv-sim-tabla-scroll',index:i,x:state.x,before},{timeout:3000});
    if(!await region.evaluate((el,content)=>el.textContent===content,before.content))problems.push('Desplazar la tabla cambia sus datos');
    if(route==='vivienda.html') {
      // También al desplazarse, la cabecera y los datos deben compartir columnas.
      if(!await region.evaluate(el=>{const h=el.querySelector('.viv-table__head').children,r=el.querySelector('.viv-table__row').children;return [...h].every((cell,j)=>Math.abs(cell.getBoundingClientRect().right-r[j].getBoundingClientRect().right)<1);}))problems.push('Amortización se desalinea al desplazar');
    }
  }
  return problems;
}
