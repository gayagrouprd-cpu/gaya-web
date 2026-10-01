#!/usr/bin/env node
// Comprobaciones de la base visual de los carteles (DIRECTION §5.1, §5.2, §5.9, §10): lo que hace src/styles/ascii.css + base.css.
// Sirve dist/ como GitHub Pages y abre en Chrome real una página de prueba (fixture) que usa las clases reales
// (.art, .plate, .btn, [data-well], canvas.field, póster) enlazando el CSS construido. Hay que haber hecho `npm run build`.
//  1. Fuentes: los .woff2 de dist (solo latin y symbols2) y los que pide cada página real.
//  2. Arte: línea = --ch, ancho = columnas × --cw exactas, sin costuras (DPR × cuerpo de 10/15/20 px, umbral 40/255).
//  3. Botones «cartel»: objetivo ≥ 48 px, sombra en bloque, hover/pulsado, sin parpadeo en el borde, foco visible ≥ 3:1.
//  4. Placa y pozo: colores, sombra, tapan al lienzo fijo, contraste del texto.
//  5. forced-colors, prefers-contrast: more e impresión (con PDF en --out).
//  6. CLS de las páginas reales, con la fuente cargada y con la fuente retrasada (respaldo métrico en acción).
// Uso: node scripts/base-check.mjs [--dir dist] [--out reports/ascii/wp1] [--delay 700] [--compare http://127.0.0.1:4342]
//   --compare  otra copia servida del sitio (p. ej. el build anterior) para medir el CLS de las dos y compararlas
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrastRgb255 } from '../src/lib/color.mjs';
import { createPagesServer, listen } from './serve-pages.mjs';
import { launchBrowser, scrollThrough } from './lib/browser.mjs';

const sharp = createRequire(import.meta.url)('sharp');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const DIST = resolve(ROOT, arg('dir', 'dist'));
const OUT = resolve(ROOT, arg('out', 'reports/ascii/wp1'));
const DELAY = Number(arg('delay', 700));
const COMPARE = arg('compare', null);
mkdirSync(OUT, { recursive: true });

let fails = 0;
const ok = (cond, msg) => {
  if (!cond) fails++;
  console.log(`${cond ? '  ok   ' : '  FALLA'} ${msg}`);
};
const section = (t) => console.log(`\n${t}`);
const rgb = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);
const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const near = (a, b, e = 0.6) => Math.abs(a - b) <= e;

// ── Fixture: el CSS real de dist + una página con las clases reales ───────────────────────────────
const astro = join(DIST, '_astro');
const cssFile = readdirSync(astro).find((f) => /^Base\..*\.css$/.test(f) && readFileSync(join(astro, f), 'utf8').includes('.plate'));
if (!cssFile) {
  console.error('No encuentro el CSS construido (dist/_astro/Base.*.css con .plate). Ejecuta `npm run build`.');
  process.exit(2);
}
const COLS = 24;
const ROWS = 10;
const solid = Array.from({ length: ROWS }, () => '█'.repeat(COLS)).join('&#10;');
const tmp = mkdtempSync(join(tmpdir(), 'gaya-base-'));
cpSync(astro, join(tmp, '_astro'), { recursive: true });
writeFileSync(
  join(tmp, 'index.html'),
  `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>base</title><link rel="stylesheet" href="/_astro/${cssFile}">
<style>
  body{padding:24px 16px 120px}
  .row{display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start;margin-block:40px}
  #seam{display:inline-block;background:#000;padding:12px} #seam .art{color:#fff}
  .well{background:var(--t6);padding:24px;display:inline-block}
  canvas.field{position:fixed;inset:0;width:100%;height:100lvh;z-index:0;pointer-events:none}
</style></head>
<body data-ui="cartel"><main>
  <div id="seam"><span class="art" id="seam-art" aria-hidden="true" translate="no" data-art="${solid}"></span></div>
  <span class="art" id="tone-art" aria-hidden="true" translate="no" data-art="▄▄▄▄"></span>
  <div class="row">
    <a class="btn btn--primary" id="b1" href="#x">Escríbenos por WhatsApp</a>
    <a class="btn btn--ghost" id="b2" href="#x">Ver ejemplos</a>
    <button class="btn btn--primary" id="b3" disabled>Sin acción</button>
  </div>
  <div class="well" data-well="ink" id="well"><a class="btn btn--ghost" id="b4" href="#y">Sobre un pozo</a></div>
  <article class="plate" id="plate"><h2>Placa</h2><dl><dt>clave</dt><dd>valor</dd></dl><p>Texto con <a href="#z" id="lnk">un enlace</a> y <a href="https://example.com/ruta" id="ext">uno externo</a>.</p></article>
  <div data-nosnippet aria-hidden="true" translate="no" id="poster"><span class="art" data-art="▄▄▄▄"></span></div>
</main><canvas class="field" id="cv" width="8" height="8"></canvas></body></html>`,
);
const server = createPagesServer({ dir: tmp });
const fixture = `http://127.0.0.1:${await listen(server, 0)}/`;
const siteServer = createPagesServer({ dir: DIST });
const site = `http://127.0.0.1:${await listen(siteServer, 0)}`;
const browser = await launchBrowser();

const open = async (ctxOpts = {}, url = fixture) => {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 }, serviceWorkers: 'block', ...ctxOpts });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page };
};
const cs = (page, sel, props, pseudo = null) =>
  page.evaluate(([sel, props, pseudo]) => {
    const s = getComputedStyle(document.querySelector(sel), pseudo);
    return Object.fromEntries(props.map((p) => [p, s.getPropertyValue(p)]));
  }, [sel, props, pseudo]);
// Color CSS (oklch, hex, rgb) → [r, g, b] tal como lo pinta Chrome.
const toRgb = (page, color) =>
  page.evaluate((c) => {
    const k = document.createElement('canvas').getContext('2d');
    k.fillStyle = c;
    k.fillRect(0, 0, 1, 1);
    return [...k.getImageData(0, 0, 1, 1).data].slice(0, 3);
  }, color);
const CELLS = { 400: { fs: 10, cw: 6, ch: 12 }, 1000: { fs: 15, cw: 9, ch: 18 }, 1700: { fs: 20, cw: 12, ch: 25 } };

// ── 1. Fuentes ─────────────────────────────────────────────────────────────────────────────────
section('1. Fuentes');
{
  const woff = readdirSync(astro).filter((f) => f.endsWith('.woff2'));
  const total = woff.reduce((a, f) => a + readFileSync(join(astro, f)).length, 0);
  ok(woff.length === 3 && woff.every((f) => /(bricolage-grotesque-latin|geist-mono-latin|geist-mono-symbols2)-wght-normal/.test(f)), `dist/_astro solo trae latin y symbols2: ${woff.join(', ')}`);
  ok(total <= 72000, `peso de las fuentes ${total} B (${(total / 1000).toFixed(1)} KB) ≤ 72 KB`);
  const css = readFileSync(join(astro, cssFile), 'utf8');
  ok(css.includes('U+2500-259F'), 'el CSS declara U+2500-259F para Geist Mono (cajas y bloques)');
  const htmlAll =
    readdirSync(DIST, { recursive: true })
      .filter((f) => String(f).endsWith('.html') && !/^ref(-shared)?[\\/]/.test(String(f)))
      .map((f) => readFileSync(join(DIST, String(f)), 'utf8'))
      .join('\n') + css;
  ok(!/85\.986|132\.57/.test(htmlAll), 'sin el respaldo roto de Astro Fonts (size-adjust 85,986 % / 132,57 %)');
  for (const p of ['/', '/en/', '/referencias/', '/en/references/', '/404.html']) {
    const { ctx, page } = await (async () => {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
      const page = await ctx.newPage();
      const got = [];
      page.on('response', (r) => {
        if (!/\.woff2$/.test(r.url())) return;
        const name = basename(new URL(r.url()).pathname);
        got.push(`${name.replace(/\.[\w-]{8}\.woff2/, '')} ${(readFileSync(join(astro, name)).length / 1000).toFixed(1)} KB`);
      });
      page.got = got;
      await page.goto(site + p, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      return { ctx, page };
    })();
    console.log(`         ${p.padEnd(16)} pide: ${page.got.join(' · ') || '(ninguna)'}`);
    await ctx.close();
  }
}

// ── 2. Arte: celda exacta y sin costuras ───────────────────────────────────────────────────────
section('2. Arte (.art): celda exacta y sin costuras');
for (const [width, cell] of Object.entries(CELLS)) {
  const { ctx, page } = await open({ viewport: { width: Number(width), height: 900 } });
  const c = await cs(page, '#seam-art', ['font-size', 'line-height', 'white-space', 'user-select', 'pointer-events', 'letter-spacing', 'display', 'font-family']);
  const box = await page.evaluate(() => {
    const e = document.querySelector('#seam-art');
    const r = e.getBoundingClientRect();
    return { w: r.width, h: r.height, padTop: parseFloat(getComputedStyle(e).paddingTop), ok: document.fonts.check('10px "Geist Mono Variable"', '█') };
  });
  const tag = `a ${width} px (${cell.fs}/${cell.cw}×${cell.ch})`;
  ok(parseFloat(c['font-size']) === cell.fs && parseFloat(c['line-height']) === cell.ch, `${tag}: font-size ${c['font-size']} · line-height ${c['line-height']}`);
  ok(near(box.w, COLS * cell.cw, 0.01), `${tag}: ancho ${box.w.toFixed(2)} px = ${COLS} × ${cell.cw}`);
  ok(near(box.h - 2 * box.padTop, ROWS * cell.ch, 0.01), `${tag}: alto útil ${(box.h - 2 * box.padTop).toFixed(2)} px = ${ROWS} × ${cell.ch}`);
  ok(c['white-space'] === 'pre' && c['user-select'] === 'none' && c['pointer-events'] === 'none' && c.display === 'block', `${tag}: white-space pre · user-select none · pointer-events none · display block`);
  ok(/Geist Mono Variable/.test(c['font-family']) && box.ok, `${tag}: Geist Mono Variable cargada para █`);
  ok((await cs(page, '#seam-art', ['content'], '::before')).content.startsWith('"█'), `${tag}: el arte sale de ::before con attr(data-art)`);
  await ctx.close();
}
{
  let worstRow = 0;
  let worstCol = 0;
  for (const dpr of [1, 1.5, 2, 2.625, 3]) {
    const line = [];
    for (const [width, cell] of Object.entries(CELLS)) {
      const { ctx, page } = await open({ viewport: { width: Number(width), height: 900 }, deviceScaleFactor: dpr });
      const shot = await page.locator('#seam-art').screenshot();
      const { data, info } = await sharp(shot).greyscale().raw().toBuffer({ resolveWithObject: true });
      const m = Math.ceil(2 * cell.cw * dpr);
      const mr = Math.ceil(2 * cell.ch * dpr);
      let minRow = 255;
      let minCol = 255;
      const cx = info.width >> 1;
      const cy = info.height >> 1;
      for (let y = mr; y < info.height - mr; y++) for (let x = cx - 3; x <= cx + 3; x++) minRow = Math.min(minRow, data[y * info.width + x]);
      for (let x = m; x < info.width - m; x++) for (let y = cy - 3; y <= cy + 3; y++) minCol = Math.min(minCol, data[y * info.width + x]);
      worstRow = Math.max(worstRow, 255 - minRow);
      worstCol = Math.max(worstCol, 255 - minCol);
      line.push(`${cell.cw}×${cell.ch}: filas ${255 - minRow} · columnas ${255 - minCol}`);
      await ctx.close();
    }
    console.log(`         DPR ${String(dpr).padEnd(5)} ${line.join('   ')}`);
  }
  ok(worstRow <= 40 && worstCol <= 40, `costuras de █ a DPR 1 · 1,5 · 2 · 2,625 · 3 con celdas 6×12, 9×18 y 12×25: entre filas ≤ ${worstRow}/255, entre columnas ≤ ${worstCol}/255 (umbral 40)`);
}

// ── 3. Botones «cartel» ────────────────────────────────────────────────────────────────────────
section('3. Botones cartel (.btn .btn--primary / .btn--ghost)');
for (const [width, cell] of Object.entries(CELLS)) {
  const { ctx, page } = await open({ viewport: { width: Number(width), height: 900 } });
  const tag = `a ${width} px`;
  for (const id of ['b1', 'b2', 'b4']) {
    const r = await page.locator(`#${id}`).boundingBox();
    ok(r.height >= 48 && r.width >= 48, `${tag}: #${id} mide ${r.width.toFixed(0)}×${r.height.toFixed(0)} px (≥ 48)`);
  }
  const b1 = await cs(page, '#b1', ['border-top-left-radius', 'box-shadow', 'font-weight', 'font-family', 'background-color', 'color']);
  const sh = b1['box-shadow'].match(/-?[\d.]+px/g).map(parseFloat);
  ok(b1['border-top-left-radius'] === '2px', `${tag}: radio 2 px`);
  ok(rgb(b1['box-shadow']).join() === '11,27,108' && near(sh[0], cell.cw * 1.5, 0.01) && near(sh[1], cell.ch * 0.5, 0.01) && sh[2] === 0, `${tag}: sombra en bloque ${sh[0]}px ${sh[1]}px en T3 (#0b1b6c)`);
  // Tipografía mixta (30-sep-2026): el rótulo de todo botón va en Geist Mono 700 (antes Bricolage 600).
  ok(b1['font-weight'] === '700' && /Geist Mono Variable/.test(b1['font-family']), `${tag}: Geist Mono 700 (tipografía mixta)`);
  ok((await toRgb(page, b1['background-color'])).join() === '60,117,255', `${tag}: primario con fondo --accent (${b1['background-color']})`);
  // hover: el rótulo se acerca a su sombra
  const box = await page.locator('#b1').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(350);
  const hv = await cs(page, '#b1', ['transform', 'box-shadow']);
  const t = hv.transform.match(/-?[\d.]+/g).map(Number);
  ok(near(t[4], cell.cw * 0.75, 0.05) && near(t[5], cell.ch * 0.25, 0.05), `${tag}: hover → translate(${t[4]}px, ${t[5]}px) = (0,75·cw, 0,25·ch)`);
  ok(near(parseFloat(hv['box-shadow'].match(/-?[\d.]+px/g)[0]), cell.cw * 0.75, 0.05), `${tag}: hover → sombra ${hv['box-shadow'].match(/-?[\d.]+px/g).slice(0, 2).join(' ')}`);
  // pulsado
  await page.mouse.down();
  await page.waitForTimeout(250);
  const ac = await cs(page, '#b1', ['transform', 'box-shadow']);
  const ta = ac.transform.match(/-?[\d.]+/g).map(Number);
  ok(near(ta[4], cell.cw * 1.5, 0.05) && near(ta[5], cell.ch * 0.5, 0.05) && /0px 0px 0px/.test(ac['box-shadow']), `${tag}: pulsado → asentado sobre la sombra (translate ${ta[4]}, ${ta[5]}; sombra 0)`);
  await page.mouse.up();
  await page.mouse.move(2, 2);
  await ctx.close();
}
{
  // Parpadeo del borde superior izquierdo: con el puntero a 2 px de la esquina, al moverse el botón el puntero queda fuera.
  const flicker = async (killPseudo) => {
    const { ctx, page } = await open({ viewport: { width: 1000, height: 900 } });
    if (killPseudo) await page.addStyleTag({ content: '.btn::before{content:none!important}' });
    const box = await page.locator('#b2').boundingBox();
    const seen = [];
    await page.mouse.move(box.x + 2, box.y + 2);
    for (let i = 0; i < 24; i++) {
      // el puntero se mueve a la deriva (1 px) sobre la esquina: cada movimiento reevalúa :hover
      await page.mouse.move(box.x + 2 + (i % 2), box.y + 2 + (i % 2));
      await page.waitForTimeout(60);
      seen.push(await page.evaluate(() => document.querySelector('#b2').matches(':hover')));
    }
    await ctx.close();
    return seen.reduce((n, v, i) => n + (i && v !== seen[i - 1] ? 1 : 0), 0);
  };
  const withFix = await flicker(false);
  const without = await flicker(true);
  ok(withFix === 0, `puntero a 2 px de la esquina superior izquierda: ${withFix} cambios de :hover con la zona ampliada (::before)`);
  console.log(`         (control negativo sin ::before: ${without} cambios de :hover en 24 movimientos de 1 px)`);
}
{
  // Foco visible: 3 px de --accent-text, ≥ 3:1 frente al fondo de la página y frente a T6 (el tono más claro bajo un pozo)
  const { ctx, page } = await open({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1 });
  for (const id of ['b1', 'b4']) {
    await page.evaluate((id) => document.getElementById(id).focus({ focusVisible: true }), id);
    const f = await cs(page, `#${id}`, ['outline-width', 'outline-style', 'outline-color', 'outline-offset']);
    ok(f['outline-width'] === '3px' && f['outline-style'] === 'solid' && f['outline-offset'] === '3px', `#${id}: outline 3px solid, separación 3 px`);
    const r = await page.locator(`#${id}`).boundingBox();
    await page.mouse.move(2, 2);
    const shot = await page.screenshot({ clip: { x: Math.max(0, r.x - 14), y: r.y + r.height / 2 - 2, width: 14, height: 4 } });
    const { data, info } = await sharp(shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const px = (x) => [data[x * 3], data[x * 3 + 1], data[x * 3 + 2]];
    const xRing = Math.min(info.width - 1, info.width - 5); // a 4–5 px del borde: dentro del anillo (3–6 px)
    const ring = px(xRing);
    const bg = px(Math.max(0, info.width - 11)); // a 10–11 px: fuera del anillo
    const ratio = contrastRgb255(ring, bg);
    ok(ratio >= 3, `#${id}: el anillo de foco ${hex(ring)} sobre ${hex(bg)} da ${ratio.toFixed(2)}:1 (≥ 3)`);
  }
  await ctx.close();
}

// ── 4. Placa y pozo ────────────────────────────────────────────────────────────────────────────
section('4. Placa (.plate) y pozo ([data-well])');
for (const [width, cell] of Object.entries(CELLS)) {
  const { ctx, page } = await open({ viewport: { width: Number(width), height: 900 } });
  const tag = `a ${width} px`;
  const p = await cs(page, '#plate', ['background-color', 'border-top-color', 'border-top-width', 'box-shadow', 'padding-top', 'padding-left', 'color', 'position', 'z-index']);
  const sh = p['box-shadow'].match(/-?[\d.]+px/g).map(parseFloat);
  ok(hex(rgb(p['background-color'])) === '#040c34' && hex(rgb(p['border-top-color'])) === '#1753d4' && p['border-top-width'] === '1px', `${tag}: fondo T1 ${hex(rgb(p['background-color']))} · borde 1 px T7 ${hex(rgb(p['border-top-color']))}`);
  ok(rgb(p['box-shadow']).join() === '7,19,79' && near(sh[0], cell.cw * 2, 0.01) && near(sh[1], cell.ch, 0.01), `${tag}: sombra ${sh[0]}px ${sh[1]}px en T2 (#07134f)`);
  ok(near(parseFloat(p['padding-top']), cell.ch * 2, 0.01) && near(parseFloat(p['padding-left']), cell.cw * 4, 0.01), `${tag}: relleno ${p['padding-top']} × ${p['padding-left']} = (2·ch, 4·cw)`);
  const ink = await toRgb(page, p.color);
  const ratio = contrastRgb255(ink, rgb(p['background-color']));
  ok(ratio >= 16, `${tag}: texto ${hex(ink)} sobre la placa = ${ratio.toFixed(2)}:1 (≥ 16)`);
  if (width === '1000') {
    // la placa y el pozo tapan al lienzo fijo aunque este vaya después en el DOM
    const top = await page.evaluate(() => {
      document.querySelector('#cv').style.pointerEvents = 'auto'; // el lienzo real no recibe el puntero; aquí se quiere ver quién queda encima
      const hit = (sel) => {
        const r = document.querySelector(sel).getBoundingClientRect();
        const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return e?.tagName.toLowerCase() + (e?.id ? '#' + e.id : '');
      };
      document.querySelector('#plate').scrollIntoView({ block: 'center' });
      const plate = hit('#plate');
      document.querySelector('#well').scrollIntoView({ block: 'center' });
      return { plate, well: hit('#well') };
    });
    ok(!/canvas/.test(top.plate) && !/canvas/.test(top.well), `placa y pozo quedan por encima del lienzo fijo (elementFromPoint: ${top.plate}, ${top.well})`);
    const w = await cs(page, '#well', ['color', 'position', 'z-index']);
    const wink = hex(await toRgb(page, w.color));
    ok(wink === '#edf2f8' && w.position === 'relative', `pozo «ink»: color ${wink} (--ink), position relative`);
    const lnk = await cs(page, '#lnk', ['color', 'text-decoration-line', 'text-decoration-thickness']);
    ok(lnk['text-decoration-line'] === 'underline' && lnk['text-decoration-thickness'] === '1px', `enlace en texto subrayado de 1 px (${lnk.color})`);
    await page.screenshot({ path: join(OUT, 'fixture-cartel.png') });
  }
  await ctx.close();
}

// ── 5. forced-colors · prefers-contrast: more · impresión ──────────────────────────────────────
section('5. forced-colors, prefers-contrast: more, impresión');
{
  const { ctx, page } = await open({ forcedColors: 'active' });
  const probe = await page.evaluate(() => {
    const d = document.createElement('i');
    d.style.cssText = 'color:CanvasText;border-color:ButtonText';
    document.body.append(d);
    const s = getComputedStyle(d);
    return { canvasText: s.color, buttonText: s.borderTopColor };
  });
  const art = await cs(page, '#tone-art', ['color', '-webkit-text-fill-color']);
  const plate = await cs(page, '#plate', ['border-top-color', 'border-top-width', 'box-shadow']);
  const btn = await cs(page, '#b1', ['border-top-style', 'border-top-width', 'border-top-color', 'box-shadow']);
  const hidden = await page.evaluate(() => ['#cv', '#poster'].map((s) => getComputedStyle(document.querySelector(s)).display));
  ok(hidden.join() === 'none,none', 'forced-colors: lienzo y póster ocultos');
  ok(art.color === probe.canvasText, `forced-colors: arte en CanvasText (${art.color})`);
  ok(plate['border-top-width'] === '1px' && plate['border-top-color'] === probe.canvasText && plate['box-shadow'] === 'none', 'forced-colors: placa con borde real de 1 px y sin sombra');
  ok(btn['border-top-style'] === 'solid' && btn['border-top-width'] === '1px' && btn['border-top-color'] === probe.buttonText && btn['box-shadow'] === 'none', 'forced-colors: botón con borde real de 1 px en ButtonText y sin sombra');
  await page.screenshot({ path: join(OUT, 'fixture-forced-colors.png') });
  await ctx.close();
}
{
  const { ctx, page } = await open({ contrast: 'more' });
  const art = await cs(page, '#tone-art', ['color', 'font-weight']);
  const plate = await cs(page, '#plate', ['box-shadow', 'border-top-color']);
  const btn = await cs(page, '#b2', ['box-shadow', 'border-top-color']);
  const artInk = hex(await toRgb(page, art.color));
  ok(artInk === '#edf2f8' && art['font-weight'] === '500', `prefers-contrast: more → arte en --ink (${artInk}) con peso 500`);
  ok(plate['box-shadow'] === 'none' && btn['box-shadow'] === 'none', 'prefers-contrast: more → placa y botón sin sombra');
  ok(hex(await toRgb(page, plate['border-top-color'])) === '#edf2f8' && hex(await toRgb(page, btn['border-top-color'])) === '#edf2f8', 'prefers-contrast: more → bordes en --ink');
  const box = await page.locator('#b2').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(350);
  ok((await cs(page, '#b2', ['box-shadow']))['box-shadow'] === 'none', 'prefers-contrast: more → sin sombra tampoco con hover');
  await page.screenshot({ path: join(OUT, 'fixture-contrast-more.png') });
  await ctx.close();
}
{
  const { ctx, page } = await open({ viewport: { width: 900, height: 900 } });
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(300); // las transiciones del botón (0,12 s) deben terminar antes de leer los estilos
  const body = await cs(page, 'body', ['background-color', 'color']);
  const art = await cs(page, '#tone-art', ['color', 'font-size', 'line-height']);
  const plate = await cs(page, '#plate', ['box-shadow', 'background-color', 'color', 'border-top-color']);
  const btn = await cs(page, '#b1', ['background-color', 'color', 'box-shadow', 'border-top-color']);
  const hidden = await page.evaluate(() => ['#cv', '#poster'].map((s) => getComputedStyle(document.querySelector(s)).display));
  const after = (await cs(page, '#ext', ['content'], '::after')).content;
  ok(rgb(body['background-color']).join() === '255,255,255' && rgb(body.color).join() === '0,0,0', 'impresión: fondo blanco y tinta negra');
  ok(rgb(art.color).join() === '0,0,0' && near(parseFloat(art['font-size']), 7 * (96 / 72), 0.01), `impresión: arte negro a 7 pt (${art['font-size']})`);
  ok(hidden.join() === 'none,none', 'impresión: lienzo y póster ocultos');
  ok(plate['box-shadow'] === 'none' && plate['background-color'] === 'rgba(0, 0, 0, 0)' && rgb(plate.color).join() === '0,0,0', 'impresión: placa sin sombra ni fondo, texto negro');
  ok(btn['box-shadow'] === 'none' && btn['background-color'] === 'rgba(0, 0, 0, 0)' && rgb(btn.color).join() === '0,0,0', 'impresión: botón sin sombra ni relleno, texto negro');
  ok(/https:\/\/example\.com\/ruta/.test(after), `impresión: la dirección del enlace externo queda a la vista (${after})`);
  await page.screenshot({ path: join(OUT, 'fixture-print.png') });
  await page.pdf({ path: join(OUT, 'fixture-print.pdf'), format: 'A4', printBackground: true });
  await ctx.close();
}

// ── 6. CLS de las páginas reales ───────────────────────────────────────────────────────────────
section(`6. CLS (Layout Instability) en las páginas reales; «retrasada» = fuentes con ${DELAY} ms de demora`);
async function cls(base, path, { mobile = false, delay = 0 } = {}) {
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  if (delay) {
    await page.route(/\.woff2$/, async (route) => {
      await new Promise((r) => setTimeout(r, delay));
      await route.continue();
    });
  }
  await page.goto(base + path, { waitUntil: 'load' });
  await page.waitForTimeout(delay + 2500);
  await scrollThrough(page);
  await page.waitForTimeout(500);
  const v = await page.evaluate(() => window.__cls);
  await ctx.close();
  return v;
}
for (const path of ['/', '/en/', '/referencias/', '/en/references/']) {
  for (const mobile of [false, true]) {
    const row = [];
    for (const delay of [0, DELAY]) {
      const now = await cls(site, path, { mobile, delay });
      const before = COMPARE ? await cls(COMPARE, path, { mobile, delay }) : null;
      row.push(`${delay ? 'retrasada' : 'normal'}: ${now.toFixed(4)}${before === null ? '' : ` (antes ${before.toFixed(4)})`}`);
      if (!delay) ok(now === 0, `CLS ${path} ${mobile ? 'móvil 390×844' : 'escritorio 1440×900'} con la fuente cargada = ${now.toFixed(4)}`);
    }
    console.log(`         ${path.padEnd(16)} ${mobile ? 'móvil     ' : 'escritorio'}  ${row.join('  ·  ')}`);
  }
}

await browser.close();
server.close();
siteServer.close();
rmSync(tmp, { recursive: true, force: true });
console.log(fails ? `\n${fails} comprobación(es) con fallo.` : '\nBase visual correcta.');
process.exit(fails ? 1 : 0);
