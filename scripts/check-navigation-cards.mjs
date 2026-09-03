/* Pruebas locales de interacción: no siguen enlaces ni activan servicios externos. */
export async function checkNavigationAndCards(page, route) {
  const problems = [];
  if (route === 'index.html' || route === 'lecturas.html') {
    const groups = page.locator('.nuvia-site-nav > details');
    for (let i = 0; i < await groups.count(); i++) {
      const group = groups.nth(i);
      const summary = group.locator('summary');
      await summary.focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction((index) => document.querySelectorAll('.nuvia-site-nav > details')[index]?.open, i);
      const errors = await group.evaluate((el) => {
        const menu = el.querySelector('.nuvia-site-nav__menu');
        const box = menu.getBoundingClientRect();
        const out = [];
        if (box.left < -1 || box.right > document.documentElement.clientWidth + 1) out.push('desplegable fuera del ancho visible');
        if (document.querySelectorAll('.nuvia-site-nav > details[open]').length !== 1) out.push('más de un desplegable abierto');
        return out.map((message) => `${el.querySelector('summary').textContent.trim()}: ${message}`);
      });
      problems.push(...errors);
      await page.keyboard.press('Tab');
      if (!await group.evaluate((el) => el.querySelector('a') === document.activeElement)) problems.push('Tab no entra en el primer enlace del menú');
      await page.keyboard.press('Escape');
      if (!await group.evaluate((el) => !el.open && el.querySelector('summary') === document.activeElement)) problems.push('Escape no cierra el menú y devuelve el foco');
    }
  }
  if (route === 'lecturas.html') {
    const cards = page.locator('.lecturas-card');
    for (let i = 0; i < await cards.count(); i++) {
      const card = cards.nth(i);
      const img = card.locator('.lecturas-card__cover img');
      await img.scrollIntoViewIfNeeded();
      await img.evaluate((el) => el.decode());
      problems.push(...await card.evaluate((el) => {
        const image = el.querySelector('.lecturas-card__cover img');
        const cover = image.parentElement;
        const a = image.getBoundingClientRect(), b = cover.getBoundingClientRect();
        const out = [];
        if (!image.naturalWidth || !a.width || !a.height) out.push('portada sin imagen o sin tamaño');
        if (a.left < b.left - 1 || a.right > b.right + 1 || a.top < b.top - 1 || a.bottom > b.bottom + 1) out.push('portada recortada por su contenedor');
        if (getComputedStyle(image).objectFit !== 'contain') out.push('la portada no conserva su contenido completo');
        if (el.getAttribute('role') === 'button' || el.hasAttribute('tabindex')) out.push('tarjeta interactiva con controles anidados');
        return out.map((message) => `${el.dataset.bookId}: ${message}`);
      }));
      const button = card.locator('.lecturas-summary-button');
      const title = await card.locator('.lecturas-card__title').textContent();
      await button.focus();
      await page.keyboard.press(i % 2 ? 'Space' : 'Enter');
      await page.locator('#lecturas-book-dialog').waitFor({ state: 'visible' });
      if ((await page.locator('#lecturas-dialog-title').textContent()).trim() !== title.trim()) problems.push('la ficha abierta no corresponde al libro');
      await page.locator('#lecturas-dialog-image').evaluate((el) => el.decode());
      if (i % 2) await page.locator('.lecturas-dialog-close').click();
      else await page.keyboard.press('Escape');
      await page.locator('#lecturas-book-dialog').waitFor({ state: 'hidden' });
      if (!await button.evaluate((el) => el === document.activeElement)) problems.push(`${title}: no se devuelve el foco al botón de apertura`);
    }
  }
  return problems;
}
