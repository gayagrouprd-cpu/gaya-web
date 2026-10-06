#!/usr/bin/env node
// Recorrido de punta a punta de los ejemplos (dist/ servido como GitHub Pages), con teclado y puntero: la sección de ejemplos de la
// portada, la galería vieja que solo redirige allí, y el visor de cada ejemplo con su salida de vuelta a la portada.
// Uso: node scripts/flow-check.mjs [--dir dist]
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPagesServer, listen } from './serve-pages.mjs';
import { launchBrowser } from './lib/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const di = process.argv.indexOf('--dir');
const dir = join(ROOT, di > -1 ? process.argv[di + 1] : 'dist');

const server = createPagesServer({ dir });
const base = `http://127.0.0.1:${await listen(server, 0)}`;
const browser = await launchBrowser();

let fails = 0;
const ok = (cond, msg) => {
  if (!cond) fails++;
  console.log(`${cond ? '  ok   ' : '  FALLA'} ${msg}`);
};
const settle = (page, ms = 700) => page.waitForTimeout(ms);
const path = (page) => new URL(page.url()).pathname;
const hash = (page) => new URL(page.url()).hash;
const SECTION = { es: { home: '/', anchor: '#ejemplos', viewer: '/referencias/' }, en: { home: '/en/', anchor: '#samples', viewer: '/en/references/' } };

async function fresh(viewport = { width: 1440, height: 900 }, extra = {}) {
  const ctx = await browser.newContext({ viewport, ...extra });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(m.text().slice(0, 160)));
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
  return { ctx, page, errors };
}

/** La sección de ejemplos está a la vista (su borde superior cerca del de la pantalla). */
const sectionInView = (page, anchor) => page.evaluate((id) => Math.abs(document.getElementById(id)?.getBoundingClientRect().top ?? 1e4) < 4, anchor.slice(1));

// ── Portada → ejemplos ─────────────────────────────────────────────────────
for (const lang of ['es', 'en']) {
  const S = SECTION[lang];
  console.log(`Portada → ejemplos (${lang})`);
  const { ctx, page, errors } = await fresh();
  await page.goto(`${base}${S.home}`, { waitUntil: 'load' });
  await settle(page);
  const old = await page.locator('a[href="/referencias/"], a[href="/en/references/"]').count();
  ok(old === 0, `ningún enlace a la galería retirada (${old})`);
  await page.locator('.px-hero .px-btn:not(.px-btn--solid)').click();
  await settle(page, 1200);
  ok(hash(page) === S.anchor && path(page) === S.home, `el botón secundario baja a ${S.anchor} (${path(page)}${hash(page)})`);
  ok(await sectionInView(page, S.anchor), 'la sección de ejemplos queda arriba de la pantalla');
  const cards = await page.locator(`${S.anchor} .px-sample`).count();
  ok(cards >= 3, `la sección muestra ${cards} ejemplos`);
  const view = page.locator(`${S.anchor} .px-sample-actions a:not(.solid)`).first();
  const href = await view.getAttribute('href');
  ok(href?.startsWith(S.viewer) && href !== S.viewer, `«Ver ejemplo» abre el visor (${href})`);
  await view.click();
  await page.waitForURL(`**${href}`);
  await page.locator('.frame.is-live').waitFor({ timeout: 8000 });
  ok(true, 'el visor carga la web en vivo');
  await page.locator('.vback').click();
  await page.waitForURL((u) => u.pathname === S.home && u.hash === S.anchor);
  await settle(page, 1200);
  ok(await sectionInView(page, S.anchor), `la salida del visor vuelve a ${S.home}${S.anchor} con la sección a la vista`);
  ok(errors.length === 0, `consola limpia (${errors.join(' | ') || 'sin mensajes'})`);
  await ctx.close();
}

// ── La galería vieja redirige ──────────────────────────────────────────────
console.log('Galería retirada');
for (const [from, lang] of [['/referencias/', 'es'], ['/en/references/', 'en']]) {
  const S = SECTION[lang];
  const { ctx, page } = await fresh();
  await page.goto(`${base}${from}`, { waitUntil: 'load' });
  await page.waitForURL((u) => u.pathname === S.home && u.hash === S.anchor, { timeout: 5000 }).catch(() => {});
  ok(path(page) === S.home && hash(page) === S.anchor, `${from} lleva a ${S.home}${S.anchor} (${path(page)}${hash(page)})`);
  await ctx.close();
}

// ── Visor con teclado ──────────────────────────────────────────────────────
console.log('Visor');
{
  const { ctx, page, errors } = await fresh();
  const slug = 'fogon';
  await page.goto(`${base}/referencias/${slug}/`, { waitUntil: 'load' });
  await page.locator('.frame.is-live').waitFor({ timeout: 8000 });

  // Orden de tabulación: el enlace de salto y luego la salida
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const focusLabel = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent?.trim());
  ok(/volver|back/i.test(focusLabel ?? '') && /ejemplos/i.test(focusLabel ?? ''), `el segundo Tab llega a la salida, que dice «ejemplos» (${focusLabel})`);

  // Conmutador de tamaño
  const w = async () => Math.round((await page.locator('.frame').boundingBox()).width);
  const full = await w();
  await page.locator('.vdevices [data-device="tablet"]').click();
  const tablet = await w();
  await page.locator('.vdevices [data-device="phone"]').click();
  const phone = await w();
  ok(full > tablet && tablet > phone && phone <= 392, `tamaños ${full} → ${tablet} → ${phone}`);
  ok((await page.locator('.vdevices [data-device="phone"]').getAttribute('aria-checked')) === 'true', 'el radio marca el tamaño activo');
  ok((await page.locator('.frame').getAttribute('aria-checked')) === null, 'el marco no recibe aria-checked');
  await page.locator('.vdevices [data-device="desktop"]').click();

  // Flechas del conmutador: cambian de tamaño, no de referencia
  await page.locator('.vdevices [data-device="desktop"]').focus();
  await page.keyboard.press('ArrowRight');
  ok(path(page).includes(slug), 'las flechas dentro del conmutador no cambian de referencia');
  await page.keyboard.press('Escape');
  await page.waitForURL((u) => u.pathname === '/' && u.hash === '#ejemplos');
  ok(true, 'Esc vuelve a los ejemplos de la portada');

  // Flechas ← → entre referencias
  await page.goto(`${base}/referencias/${slug}/`, { waitUntil: 'load' });
  await page.locator('.frame.is-live').waitFor({ timeout: 8000 });
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  await page.keyboard.press('ArrowRight');
  await page.waitForURL((u) => !u.pathname.includes(`/${slug}/`) && /\/referencias\/[^/]+\/$/.test(u.pathname));
  const next = path(page).split('/').filter(Boolean).pop();
  ok(next !== slug, `→ pasa de ${slug} a ${next}`);
  await page.keyboard.press('ArrowLeft');
  await page.waitForURL(`**/referencias/${slug}/`);
  ok(true, `← vuelve a ${slug}`);
  await page.keyboard.press('Alt+ArrowLeft');
  await settle(page, 400);
  ok(path(page) === `/referencias/${slug}/`, 'Alt+← no cambia de referencia (se deja al navegador)');

  // Favoritas y CTA: el mensaje lleva esta referencia y, si hay favoritas, también ellas
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  const cta = async () => decodeURIComponent(((await page.locator('#cta').getAttribute('href')) ?? '').split('text=')[1] ?? '');
  const solo = await cta();
  ok(solo.length > 20 && solo.includes(`/referencias/${slug}/`), 'el CTA lleva el mensaje de esta referencia');
  await page.locator('.vfav').click();
  ok((await page.locator('.vfav').getAttribute('aria-pressed')) === 'true', 'la favorita se marca');
  await page.goto(`${base}/referencias/${next}/`, { waitUntil: 'load' });
  const both = await cta();
  ok(both.includes(`/referencias/${slug}/`) && both.includes(`/referencias/${next}/`), `en ${next}, el CTA lista la favorita y la actual`);
  ok(errors.length === 0, `consola limpia (${errors.join(' | ') || 'sin mensajes'})`);
  await ctx.close();
}

// ── Esc dentro de la web de ejemplo ────────────────────────────────────────
console.log('Teclas dentro del marco');
{
  const { ctx, page } = await fresh();
  await page.goto(`${base}/referencias/nodo/`, { waitUntil: 'load' });
  await page.locator('.frame.is-live').waitFor({ timeout: 8000 });
  const fr = page.frameLocator('.frame__live');
  await fr.locator('body').click({ position: { x: 700, y: 300 } });
  await page.keyboard.press('Control+k');
  await settle(page, 500);
  const paletteOpen = await fr.locator('[role="dialog"], [role="combobox"]').first().isVisible().catch(() => false);
  ok(paletteOpen, 'Ctrl+K abre la paleta de Nodo dentro del marco');
  await page.keyboard.press('Escape');
  await settle(page, 600);
  ok(path(page) === '/referencias/nodo/', 'Esc cierra la paleta sin salir del visor');
  await page.keyboard.press('Escape');
  await page.waitForURL((u) => u.pathname === '/' && u.hash === '#ejemplos', { timeout: 4000 }).catch(() => {});
  ok(path(page) === '/' && hash(page) === '#ejemplos', 'un segundo Esc (sin nada abierto) vuelve a los ejemplos de la portada');
  await ctx.close();
}

// ── Móvil ──────────────────────────────────────────────────────────────────
console.log('Móvil');
{
  const { ctx, page, errors } = await fresh({ width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await settle(page);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(over <= 0, `portada sin desborde horizontal (${over})`);
  await page.locator('.px-hero .px-btn:not(.px-btn--solid)').tap();
  await settle(page, 1200);
  ok(hash(page) === '#ejemplos', 'el botón secundario baja a #ejemplos');
  await page.locator('#ejemplos .px-sample-actions a:not(.solid)').first().tap();
  await page.locator('.frame.is-live').waitFor({ timeout: 8000 });
  ok(await page.locator('.vdevices').isHidden(), 'el conmutador de tamaño se oculta en móvil');
  const small = await page.locator('.vbar a, .vbar button').evaluateAll((els) =>
    els.filter((e) => e.offsetParent && (e.getBoundingClientRect().width < 44 || e.getBoundingClientRect().height < 44)).map((e) => e.getAttribute('aria-label')),
  );
  ok(small.length === 0, `objetivos táctiles de la barra ≥ 44 px (${small.join(', ') || 'todos'})`);
  const overV = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(overV <= 0, `visor sin desborde horizontal (${overV})`);
  ok(errors.length === 0, `consola limpia (${errors.join(' | ') || 'sin mensajes'})`);
  await ctx.close();
}

// ── Inglés ─────────────────────────────────────────────────────────────────
console.log('Inglés');
{
  const { ctx, page } = await fresh();
  await page.goto(`${base}/en/references/cimiento/`, { waitUntil: 'load' });
  await page.locator('.frame.is-live').waitFor({ timeout: 8000 });
  ok(/samples/i.test((await page.locator('.vback').getAttribute('aria-label')) ?? ''), 'la salida del visor en inglés dice «samples»');
  await page.keyboard.press('ArrowRight');
  await page.waitForURL((u) => /^\/en\/references\/[^/]+\/$/.test(u.pathname) && !u.pathname.includes('/cimiento/'));
  ok(true, 'el visor conserva el idioma al cambiar de ejemplo');
  await page.keyboard.press('Escape');
  await page.waitForURL((u) => u.pathname === '/en/' && u.hash === '#samples');
  ok(true, 'Esc vuelve a /en/#samples');
  await ctx.close();
}

await browser.close();
server.close();
console.log(fails ? `\n✗ ${fails} fallos` : '\n✓ Recorrido completo sin fallos');
process.exit(fails ? 1 : 0);
