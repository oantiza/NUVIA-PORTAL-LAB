// Read-only geometry audit. Compares controls in fields sharing a visual row.
export async function inspectFieldAlignment(page) {
  return page.evaluate(() => {
    const visible = el => el.checkVisibility({checkVisibilityCSS:true}) && el.getBoundingClientRect().height > 0;
    const groups = new Map();
    for (const label of document.querySelectorAll('label, .nv-field__label')) {
      if (!visible(label)) continue;
      const field = label.parentElement;
      const control = [...field.children].find(el => el.matches('.nv-field__box, .nv-select, input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea'));
      if (!control || !visible(control)) continue;
      let parent = field.parentElement;
      while (parent && getComputedStyle(parent).display === 'contents') parent = parent.parentElement;
      if (!parent || !['grid','flex'].includes(getComputedStyle(parent).display)) continue;
      const rowTop = field.getBoundingClientRect().top;
      const rows = groups.get(parent) || [];
      let row = rows.find(r => Math.abs(r.top-rowTop)<2);
      if (!row) { row={top:rowTop,fields:[]}; rows.push(row); }
      row.fields.push({label:label.textContent.trim(),id:control.id || control.querySelector('input,select')?.id || control.querySelector('input,select')?.name,
        top:control.getBoundingClientRect().top,bottom:control.getBoundingClientRect().bottom});
      groups.set(parent,rows);
    }
    const rows=[...groups].flatMap(([parent,rows]) => rows.filter(r=>r.fields.length>1).map(row=>({parent:parent.className,...row})));
    return {rows,problems:rows.filter(row=>Math.max(...row.fields.map(f=>f.top))-Math.min(...row.fields.map(f=>f.top))>2
      || Math.max(...row.fields.map(f=>f.bottom))-Math.min(...row.fields.map(f=>f.bottom))>2)};
  });
}
