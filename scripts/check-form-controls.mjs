/* Presentación de controles existentes. No envía formularios ni toca datos. */
import { inspectFieldAlignment } from './check-field-alignment.mjs';
export const BUTTONS = '.nv-btn, .curso-btn-outline, .curso-btn-calcular, .curso-btn-marcar, .curso-btn-quiz, .curso-btn-reset';
export const FIELDS = '.nv-field__box, .nv-select, .curso-campo__input input, .gt-campo select, .gt-campo input';

export async function checkFormControls(page, route) {
  const problems = await page.evaluate(({ buttons, fields }) => {
    const out = [];
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
    };
    const identify = (el) => el.id || el.getAttribute('name') || el.textContent.trim().slice(0, 55) || el.className;
    const luminance = (rgb) => rgb.map(v=>v / 255).map(v=>v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum,v,i)=>sum + v * [.2126,.7152,.0722][i],0);
    const contrast = (a,b) => {const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
    for (const el of [...document.querySelectorAll(buttons)].filter(visible)) {
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      if (r.height < 43.5 || s.fontSize !== '14px' || s.borderRadius !== '6px') out.push(`${identify(el)}: acción fuera de la base 44/14/6`);
      if (el.disabled && (s.cursor !== 'not-allowed' || s.transform !== 'none' || s.opacity !== '1')) out.push(`${identify(el)}: estado desactivado inconsistente`);
    }
    for (const el of [...document.querySelectorAll(fields)].filter(visible)) {
      // Un select compuesto usa el borde y el tamaño de la caja exterior.
      if (el.matches('.nv-select') && el.closest('.nv-field__box')) {
        if (getComputedStyle(el).borderTopWidth !== '0px') out.push(`${identify(el)}: doble borde en el campo compuesto`);
        continue;
      }
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      const text=el.matches('.nv-field__box') ? el.querySelector('input,select') : el;
      if (r.height < 43.5 || s.borderRadius !== '12px' || (text && getComputedStyle(text).fontSize !== '14px')) out.push(`${identify(el)}: campo fuera de la base 44/14/12`);
      const border=s.borderTopColor.match(/[\d.]+/g)?.map(Number),bg=s.backgroundColor.match(/[\d.]+/g)?.map(Number);
      if (!border || !bg || (border.length===4 && border[3]!==1) || (bg.length===4 && bg[3]!==1) || contrast(border.slice(0,3),bg.slice(0,3)) < 3) out.push(`${identify(el)}: borde del campo por debajo de 3:1 o no opaco`);
    }
    return out;
  }, { buttons: BUTTONS, fields: FIELDS });

  if (route === 'sistema-visual.html') {
    const disabled=page.locator('.nv-control-samples button:disabled');
    if (await disabled.count() !== 5) problems.push('Faltan muestras de estados desactivados');
    for (let i=0;i<await disabled.count();i++) {
      const button=disabled.nth(i);
      const before=await button.evaluate(el=>{const s=getComputedStyle(el);return [s.backgroundColor,s.color,s.borderColor,s.transform];});
      await button.hover();
      // Espera a que terminen las transiciones de presentación, no una red.
      await page.waitForTimeout(250);
      const after=await button.evaluate(el=>{const s=getComputedStyle(el);return [s.backgroundColor,s.color,s.borderColor,s.transform];});
      if (JSON.stringify(before)!==JSON.stringify(after)) problems.push('Un botón desactivado reacciona al puntero');
    }
    for (const id of ['sample-amount','sample-select','sample-invalid','sample-readonly']) {
      const field=page.locator(`#${id}`);
      await field.focus();
      if (!await field.evaluate(el=>getComputedStyle(el.closest('.nv-field__box')).boxShadow !== 'none')) problems.push(`${id}: foco no visible en la caja`);
    }
    const invalid=page.locator('#sample-invalid');
    await invalid.hover();
    await page.waitForTimeout(250);
    if (!await invalid.evaluate(el=>getComputedStyle(el.closest('.nv-field__box')).borderColor === getComputedStyle(document.querySelector('#sample-error')).color)) problems.push('El error pierde su borde al recibir foco/puntero');
  }
  const alignment = await inspectFieldAlignment(page);
  problems.push(...alignment.problems.map(row => `Campos desalineados: ${row.fields.map(f=>f.id || f.label).join(', ')}`));
  return problems;
}
