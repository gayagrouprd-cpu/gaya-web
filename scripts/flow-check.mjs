#!/usr/bin/env node
// Recorrido de punta a punta de la galería y el visor (dist/ servido como GitHub Pages), con teclado y puntero.
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

async function fresh(viewport = { width: 1440, height: 900 }, extra = {}) {
  const ctx = await browser.newContext({ viewport, ...extra });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(m.text().slice(0, 160)));
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
  return { ctx, page, errors };
}

// ── Galería ────────────────────────────────────────────────────────────────
console.log('Galería');
{
  const { ctx, page, errors } = await fresh();
  await page.goto(`${base}/referencias/`, { waitUntil: 'load' });
  await settle(page);
  const total = await page.locator('.card:visible').count();
  ok(total >= 3, `muestra ${total} tarjetas`);
  ok((await page.locator('h1').textContent())?.trim() === 'Ejemplos', 'título de la galería: «Ejemplos» (la URL sigue siendo /referencias/)');

  const firstType = await page.locator('[data-filter]:not([data-filter="all"])').first().getAttribute('data-filter');
  await page.locator(`[data-filter="${firstType}"]`).click();
  const filtered = await page.locator('.card:visible').count();
  ok(filtered > 0 && filtered < total, `filtro «${firstType}» deja ${filtered} de ${total}`);
  ok((await page.locator(`[data-filter="${firstType}"]`).getAttribute('aria-pressed')) === 'true', 'el filtro activo marca aria-pressed');
  await page.locator('[data-filter="all"]').click();
  ok((await page.locator('.card:visible').count()) === total, '«Todas» restaura la lista');

  const favs = page.locator('[data-fav]');
  await favs.nth(0).click();
  ok(await page.locator('#tray').isVisible(), 'la bandeja aparece con la primera favorita');
  await favs.nth(1).click();
  const n = await page.locator('#tray-n').textContent();
  const href = await page.locator('#tray-cta').getAttribute('href');
  ok(n === '2', `la bandeja cuenta ${n}`);
  ok(/^https:\/\/wa\.me\/\d+\?text=/.test(href ?? ''), 'la bandeja abre WhatsApp con texto');
  const text = decodeURIComponent((href ?? '').split('text=')[1] ?? '');
  const names = await page.locator('[data-fav]').evaluateAll((els) => els.slice(0, 2).map((e) => e.getAttribute('data-fav')));
  ok(names.length === 2 && text.split('«').length - 1 === 2, 'el mensaje de WhatsApp lista las 2 elegidas');
  await page.reload({ waitUntil: 'load' });
  ok((await page.locator('#tray-n').textContent()) === '2', 'las favoritas sobreviven a recargar');
  ok(errors.length === 0, `consola limpia (${errors.join(' | ') || 'sin mensajes'})`);
  await ctx.close();
}

// ── Visor con teclado ──────────────────────────────────────────────────────
console.log('Visor');
{
  const { ctx, page, errors } = await fresh();
  await page.goto(`${base}/referencias/`, { waitUntil: 'load' });
  await settle(page);
  const firstHref = await page.locator('[data-ref-link]').first().getAttribute('href');
  await page.locator('[data-ref-link]').first().click();
  await page.waitForURL(`**${firstHref}`);
  const slug = path(page).split('/').filter(Boolean).pop();
  await page.locator('.frame.is-live').waitFor({ timeout: 8000 });
  ok(true, `abre ${slug} y la web en vivo reemplaza la captura`);

  // Orden de tabulación: el enlace de salto y luego la salida
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const focusLabel = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent?.trim());
  ok(/galer|gallery|volver|back/i.test(focusLabel ?? ''), `el segundo Tab llega a la salida (${focusLabel})`);
  ok(/ejemplos/i.test(focusLabel ?? ''), `la salida del visor dice «ejemplos» (${focusLabel})`);

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
  await page.waitForURL(/\/referencias\/$/);
  ok(true, 'Esc desde el conmutador vuelve a la galería');

  // Flechas ← → entre referencias
  await page.goto(`${base}/referencias/${slug}/`, { waitUntil: 'load' });
  await page.locator('.frame.is-live').waitFor({ timeout: 8000 });
  await page.locator('.vname').click({ trial: true }).catch(() => {});
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

  // Favorita y CTA
  await page.goto(`${base}/referencias/${slug}/`, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  const cta = () => page.locator('#cta').getAttribute('href');
  const solo = decodeURIComponent(((await cta()) ?? '').split('text=')[1] ?? '');
  ok(solo.length > 20 && solo.includes('/referencias/'), 'el CTA lleva el mensaje de esta referencia');
  await page.locator('.vfav').click();
  ok((await page.locator('.vfav').getAttribute('aria-pressed')) === 'true', 'la favorita se marca');
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
  await page.waitForURL(/\/referencias\/$/, { timeout: 4000 }).catch(() => {});
  ok(path(page) === '/referencias/', 'un segundo Esc (sin nada abierto) vuelve a la galería');
  await ctx.close();
}

// ── Móvil ──────────────────────────────────────────────────────────────────
console.log('Móvil');
{
  const { ctx, page, errors } = await fresh({ width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(`${base}/referencias/`, { waitUntil: 'load' });
  await settle(page);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(over <= 0, `galería sin desborde horizontal (${over})`);
  await page.locator('[data-ref-link]').first().tap();
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
  await page.goto(`${base}/en/references/`, { waitUntil: 'load' });
  ok((await page.locator('h1').textContent())?.trim() === 'Samples', 'título de la galería en inglés');
  await page.locator('[data-ref-link]').first().click();
  await page.locator('.frame.is-live').waitFor({ timeout: 8000 });
  ok(path(page).startsWith('/en/references/'), 'el visor conserva el idioma');
  ok(/samples/i.test((await page.locator('.vback').getAttribute('aria-label')) ?? ''), 'la salida del visor en inglés dice «samples»');
  await page.keyboard.press('Escape');
  await page.waitForURL(/\/en\/references\/$/);
  ok(true, 'Esc vuelve a la galería en inglés');
  await ctx.close();
}

await browser.close();
server.close();
console.log(fails ? `\n✗ ${fails} fallos` : '\n✓ Recorrido completo sin fallos');
process.exit(fails ? 1 : 0);
