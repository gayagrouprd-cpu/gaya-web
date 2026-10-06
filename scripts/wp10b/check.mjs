#!/usr/bin/env node
// Comprobaciones del cromo y del arte en DOM (WP10b): DIRECTION §4.5, §5.10, §6.9, §7.8, §10 y las pruebas T4, T11, T14.
// Se ejecuta contra una URL ya servida (astro dev, astro preview o dist con `npm run pages`); no construye nada.
//   node scripts/wp10b/check.mjs [--base http://127.0.0.1:4332] [--paths /,/en/] [--gallery /ruta/]  (la galería vieja ya no existe: por omisión, ninguna)
//                                [--only nav,axe,focus,menu,spy,poster,thread,anim,art,print] [--shots reports/ascii/wp10b]
// `anim` (las animaciones con view()) SOLO es fiable contra un build de producción: en `astro dev` el CSS no se minifica y
// el fallo que busca (lightningcss funde `animation` + `animation-timeline` en un atajo que Chrome rechaza) no aparece.
// «paths» son las páginas con portada (cromo completo, póster, hilo); «gallery» las que solo llevan el menú.
import { mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, resolve } from 'node:path';
import { AxeBuilder } from '@axe-core/playwright';
import { launchBrowser, isExternal } from '../lib/browser.mjs';
import { forbiddenGlyphs, POSTER_VARIANTS, posterSpec } from '../../src/ascii/dom-art.ts';
import { loadWords, getWords } from '../../src/ascii/words.ts';
import * as ssr from '../../src/ascii/ssr.ts';

// La función que usa PosterSsr.astro: la del estilo Duotono (con `bg` colapsado) si existe; si no, la de siempre (sin `bg`).
const renderPosterLayers = ssr.renderPosterLayersDuo ?? ssr.renderPosterLayers;
import { getScene } from '../../src/ascii/scenes/index.ts';

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const base = arg('base', 'http://127.0.0.1:4332');
const homes = arg('paths', '/,/en/').split(',');
const galleries = arg('gallery', '').split(',').filter(Boolean);
const only = arg('only', '') ? new Set(arg('only', '').split(',')) : null;
const shots = resolve(arg('shots', 'reports/ascii/wp10b'));
mkdirSync(shots, { recursive: true });
const origin = new URL(base).origin;
const run = (k) => !only || only.has(k);

let fails = 0;
const ok = (cond, msg) => {
  if (!cond) fails++;
  console.log(`${cond ? '  ok   ' : '  FALLA'} ${msg}`);
};
const section = (t) => console.log(`\n${t}`);

const browser = await launchBrowser();
const MOBILE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const DESKTOP = { viewport: { width: 1440, height: 900 } };

async function open(path, opts = DESKTOP, { wait = 1200 } = {}) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', ...opts });
  const page = await ctx.newPage();
  const problems = [];
  const external = new Set();
  await page.route('**/*', (r) => (isExternal(r.request().url(), origin) ? r.abort() : r.continue()));
  page.on('request', (r) => isExternal(r.url(), origin) && external.add(r.url()));
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(`${m.type()}: ${m.text().slice(0, 160)}`));
  page.on('pageerror', (e) => problems.push(`excepción: ${e.message.slice(0, 160)}`));
  await page.goto(base + path, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(wait);
  // control negativo: sin scroll-padding el cromo fijo SÍ tapa el foco y la prueba de T14 tiene que fallar
  if (process.argv.includes('--no-padding')) await page.addStyleTag({ content: 'html{scroll-padding:0 !important}' });
  return { ctx, page, problems, external };
}

const scrollAll = (page) =>
  page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const max = () => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    for (let y = 0; y < max(); y += 500) {
      window.scrollTo(0, y);
      await sleep(40);
    }
    window.scrollTo(0, 0);
  });

// ── Red, consola y desborde ──────────────────────────────────────────────────────────────────────
if (run('nav')) {
  section('Red, consola y desborde horizontal');
  for (const p of [...homes, ...galleries]) {
    const { ctx, page, problems, external } = await open(p);
    await scrollAll(page);
    ok(external.size === 0, `${p}: 0 peticiones a otro origen${external.size ? ` (${[...external].join(', ')})` : ''}`);
    ok(problems.length === 0, `${p}: consola limpia${problems.length ? ` (${problems.join(' | ')})` : ''}`);
    await ctx.close();
    for (const width of [320, 360, 390, 414, 768, 1024, 1440, 1920]) {
      const c = await open(p, { viewport: { width, height: 900 } }, { wait: 500 });
      const r = await c.page.evaluate(() => ({ s: document.documentElement.scrollWidth, b: document.body.scrollWidth, i: innerWidth }));
      ok(r.s <= r.i && r.b <= r.i, `${p} a ${width} px: sin scroll horizontal (${Math.max(r.s, r.b)} ≤ ${r.i})`);
      await c.ctx.close();
    }
  }
}

// ── axe ──────────────────────────────────────────────────────────────────────────────────────────
if (run('axe')) {
  section('axe (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice)');
  for (const p of [...homes, ...galleries]) {
    for (const [name, o] of [
      ['escritorio', DESKTOP],
      ['móvil', MOBILE],
      ['movimiento reducido', { ...DESKTOP, reducedMotion: 'reduce' }],
    ]) {
      const { ctx, page } = await open(p, o);
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
      const v = res.violations.map((x) => `${x.id} (${x.impact}) ${x.nodes[0]?.target?.join(' ')}`);
      ok(v.length === 0, `${p} · ${name}: axe 0 violaciones${v.length ? ` → ${v.join(' | ')}` : ''}`);
      if (name === 'móvil') {
        // con el menú abierto
        if (await page.locator('.nav__menu').isVisible().catch(() => false)) {
          await page.locator('.nav__menu').click();
          await page.waitForTimeout(400);
          const r2 = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
          const v2 = r2.violations.map((x) => `${x.id} (${x.impact}) ${x.nodes[0]?.target?.join(' ')}`);
          ok(v2.length === 0, `${p} · móvil con el menú abierto: axe 0 violaciones${v2.length ? ` → ${v2.join(' | ')}` : ''}`);
        }
      }
      await ctx.close();
    }
  }
}

// ── Teclado, foco y objetivos (T14) ───────────────────────────────────────────────────────────────
if (run('focus')) {
  section('Teclado: Tab completo con el cromo visible (T14)');
  for (const p of [...homes, ...galleries]) {
    for (const [name, o] of [['escritorio', DESKTOP], ['móvil', MOBILE]]) {
      const { ctx, page } = await open(p, o);
      const seen = [];
      const bad = [];
      let key = 'Tab';
      for (let i = 0; i < 160; i++) {
        await page.keyboard.press(key);
        await page.waitForTimeout(60);
        const r = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const b = el.getBoundingClientRect();
          const cx = b.left + b.width / 2;
          const cy = b.top + b.height / 2;
          const inView = cx >= 0 && cx <= innerWidth && cy >= 0 && cy <= innerHeight;
          const hit = document.elementFromPoint(cx, cy);
          const chrome = !!el.closest('[data-nav], [data-bar], .skip');
          const cs = getComputedStyle(el);
          const pill = document.querySelector('.nav__pill')?.getBoundingClientRect();
          const bar = document.querySelector('[data-bar]');
          const barR = bar && getComputedStyle(bar).display !== 'none' && bar.dataset.hidden !== 'true' ? bar.getBoundingClientRect() : null;
          const hits = (a, z) => a && z && a.left < z.right && a.right > z.left && a.top < z.bottom && a.bottom > z.top;
          const under = !chrome && (hits(b, pill) || hits(b, barR));
          return {
            name: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 28),
            visible: b.width > 0 && b.height > 0,
            reached: !!hit && (hit === el || el.contains(hit) || hit.contains(el)),
            inView,
            under,
            w: b.width,
            h: b.height,
            outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
            chrome,
          };
        });
        if (!r) {
          if (key === 'Shift+Tab') break;
          key = 'Shift+Tab'; // fin del recorrido hacia delante: se vuelve por detrás (borde superior del cromo)
          continue;
        }
        seen.push(r);
        if (r.visible && (!r.inView || !r.reached || r.under)) bad.push(`«${r.name}» ${!r.inView ? 'fuera de la pantalla' : !r.reached ? 'tapado' : 'bajo el cromo'}`);
      }
      ok(seen.length >= 4, `${p} · ${name}: ${seen.length} focos recorridos`);
      ok(bad.length === 0, `${p} · ${name}: ningún foco queda oculto${bad.length ? ` (${bad.join(', ')})` : ''}`);
      const small = seen.filter((r) => r.visible && (r.w < 24 || r.h < 24)).map((r) => `«${r.name}» ${Math.round(r.w)}×${Math.round(r.h)}`);
      ok(small.length === 0, `${p} · ${name}: objetivos ≥ 24×24${small.length ? ` (${small.join(', ')})` : ''}`);
      if (name === 'móvil') {
        const s44 = seen.filter((r) => r.chrome && r.visible && (r.h < 44 || r.w < 44)).map((r) => `«${r.name}» ${Math.round(r.w)}×${Math.round(r.h)}`);
        ok(s44.length === 0, `${p} · móvil: objetivos del cromo ≥ 44 px${s44.length ? ` (${s44.join(', ')})` : ''}`);
      }
      const thin = seen.filter((r) => r.visible && !/^solid\s+3px/.test(r.outline)).map((r) => `«${r.name}» ${r.outline}`);
      ok(thin.length === 0, `${p} · ${name}: anillo de foco de 3 px${thin.length ? ` (${thin.join(', ')})` : ''}`);
      await ctx.close();
    }
  }
}

// ── Menú (popover), barra inferior y medida del cromo ───────────────────────────────────────────
if (run('menu')) {
  section('Menú móvil (popover), barra inferior y scroll-padding medido');
  for (const p of homes) {
    const { ctx, page } = await open(p, MOBILE);
    const st = () =>
      page.evaluate(() => ({
        open: document.querySelector('[data-menu-panel]')?.matches(':popover-open') ?? false,
        flag: document.documentElement.dataset.menu ?? '',
        expanded: document.querySelector('.nav__menu')?.getAttribute('aria-expanded'),
        focus: document.activeElement?.className || document.activeElement?.tagName,
      }));
    const hasCta = await page.locator('[data-cta]').count();
    const bar = () => page.evaluate(() => { const b = document.querySelector('[data-bar]'); return { hidden: b.dataset.hidden, inert: b.hasAttribute('inert'), h: b.offsetHeight, vis: getComputedStyle(b).visibility }; });
    if (hasCta) {
      const b0 = await bar();
      ok(b0.hidden === 'true' && b0.inert && b0.vis === 'hidden', `${p}: la barra está oculta mientras se ve el botón de la portada`);
      await page.evaluate(() => window.scrollTo(0, document.querySelector('[data-cta]').getBoundingClientRect().bottom + scrollY + 40));
      await page.waitForTimeout(600);
      const b1 = await bar();
      ok(b1.hidden === 'false' && !b1.inert && b1.vis === 'visible', `${p}: la barra aparece al salir el botón de la portada`);
      ok(b1.h >= 56, `${p}: la barra mide ${b1.h} px (≥ 56)`);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(600);
      ok((await bar()).hidden === 'true', `${p}: y se oculta de nuevo al volver al botón`);
    }
    const cs = await page.evaluate(() => ({ t: getComputedStyle(document.documentElement).scrollPaddingTop, b: getComputedStyle(document.documentElement).scrollPaddingBottom, pill: document.querySelector('.nav__pill').getBoundingClientRect().bottom, bar: document.querySelector('[data-bar]').offsetHeight, ch: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ch')) }));
    ok(Math.abs(parseFloat(cs.t) - (cs.pill + cs.ch)) <= 1.5, `${p}: scroll-padding-top = píldora + 1 fila (${cs.t} ≈ ${(cs.pill + cs.ch).toFixed(1)})`);
    ok(Math.abs(parseFloat(cs.b) - (cs.bar + cs.ch)) <= 1.5, `${p}: scroll-padding-bottom = barra + 1 fila (${cs.b} ≈ ${(cs.bar + cs.ch).toFixed(1)})`);
    await page.screenshot({ path: join(shots, `chk-bar${p.replace(/\//g, '_')}.png`) });

    await page.locator('.nav__menu').click();
    await page.waitForTimeout(400);
    let s = await st();
    ok(s.open && s.flag === 'open' && s.expanded === 'true', `${p}: el botón abre el popover (html[data-menu=open], aria-expanded=true)`);
    await page.screenshot({ path: join(shots, `chk-menu${p.replace(/\//g, '_')}.png`) });
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('[data-menu-panel] a, [data-menu-panel] button')]
        .map((e) => ({ n: (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 24), b: e.getBoundingClientRect() }))
        .filter((x) => x.b.height < 44 || x.b.width < 44)
        .map((x) => `«${x.n}» ${Math.round(x.b.width)}×${Math.round(x.b.height)}`),
    );
    ok(small.length === 0, `${p}: todos los enlaces y botones del menú miden ≥ 44 px${small.length ? ` (${small.join(', ')})` : ''}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    s = await st();
    ok(!s.open && s.flag === '' && s.expanded === 'false', `${p}: Esc lo cierra`);
    ok(String(s.focus).includes('nav__menu'), `${p}: el foco vuelve al botón de menú (${s.focus})`);
    // con teclado: Enter abre; el foco va DENTRO del menú (al botón «Cerrar») y nunca cae en la página que el menú tapa
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    ok((await st()).open, `${p}: Enter en el botón abre el menú`);
    const probe = () =>
      page.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body) return { where: 'navegador' };
        const r = a.getBoundingClientRect();
        const hit = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1));
        return { where: a.closest('[data-menu-panel]') ? 'menu' : 'pagina', covered: !a.closest('[data-menu-panel]') && !!hit?.closest('[data-menu-panel]'), name: (a.getAttribute('aria-label') || a.textContent || a.tagName).trim().slice(0, 24), cls: a.className };
      });
    const f0 = await probe();
    ok(f0.where === 'menu' && /menu__close/.test(f0.cls), `${p}: al abrir con teclado el foco va al botón «Cerrar» (${f0.name})`);
    const inertOpen = await page.evaluate(() => ({ main: document.querySelector('main')?.hasAttribute('inert') ?? null, pill: document.querySelector('.nav__pill').hasAttribute('inert'), bar: document.querySelector('[data-bar]').hasAttribute('inert'), menu: document.querySelector('[data-menu-panel]').hasAttribute('inert') }));
    ok(inertOpen.main !== false && inertOpen.pill && inertOpen.bar && !inertOpen.menu, `${p}: con el menú abierto la página, la píldora y la barra están inert y el menú no (main ${inertOpen.main}, píldora ${inertOpen.pill}, barra ${inertOpen.bar})`);
    const order = [];
    for (let i = 0; i < 24; i++) {
      await page.keyboard.press('Tab');
      order.push(await probe());
    }
    const strays = order.filter((o) => o.where === 'pagina' || o.covered);
    ok(strays.length === 0, `${p}: Tab y 24 pulsaciones: el foco nunca cae detrás del menú${strays.length ? ` (${strays.map((o) => o.name).join(', ')})` : ''}`);
    const inside = [...new Set(order.filter((o) => o.where === 'menu').map((o) => o.name))];
    ok(inside.length >= 9, `${p}: el menú ofrece ${inside.length} paradas de foco (5 destinos + 4 servicios + idioma + WhatsApp + cerrar)`);
    console.log(`       · recorrido de Tab: ${order.map((o) => o.name ?? '(navegador)').join(' › ')}`);
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Shift+Tab');
      order.push(await probe());
    }
    ok(order.slice(-6).every((o) => o.where !== 'pagina' && !o.covered), `${p}: Shift+Tab tampoco cae detrás del menú`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const freed = await page.evaluate(() => ({ leftover: [...document.querySelectorAll('[inert]')].filter((e) => !e.matches('[data-bar]')).map((e) => e.tagName.toLowerCase() + '.' + e.className), focus: document.activeElement?.className }));
    ok(freed.leftover.length === 0, `${p}: al cerrar no queda nada inert salvo la barra oculta${freed.leftover.length ? ` (${freed.leftover.join(', ')})` : ''}`);
    ok(/nav__menu/.test(freed.focus), `${p}: Esc tras recorrer el menú devuelve el foco al botón «Menú» (${freed.focus})`);
    // con el puntero: abre, el foco va a «Cerrar»; el botón «Cerrar» cierra y devuelve el foco al botón
    await page.locator('.nav__menu').click();
    await page.waitForTimeout(300);
    ok((await probe()).where === 'menu', `${p}: al abrir con el puntero el foco también entra en el menú`);
    await page.locator('.menu__close').click();
    await page.waitForTimeout(300);
    const back = await page.evaluate(() => ({ open: document.querySelector('[data-menu-panel]').matches(':popover-open'), focus: document.activeElement?.className }));
    ok(!back.open && /nav__menu/.test(back.focus), `${p}: «Cerrar» cierra y el foco vuelve al botón «Menú» (${back.focus})`);
    await page.locator('.nav__menu').click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    // elegir un destino cierra el menú y deja el foco en la sección
    await page.locator('.nav__menu').click();
    await page.waitForTimeout(300);
    const target = await page.locator('[data-menu-panel] .menu__list > li > a').nth(1).getAttribute('href');
    await page.locator('[data-menu-panel] .menu__list > li > a').nth(1).click();
    await page.waitForTimeout(900);
    const after = await page.evaluate(() => ({ open: document.querySelector('[data-menu-panel]').matches(':popover-open'), focus: document.activeElement?.id, top: document.getElementById(location.hash.slice(1))?.getBoundingClientRect().top, cp: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) }));
    ok(!after.open, `${p}: elegir «${target}» cierra el menú`);
    ok(target.endsWith('#' + after.focus), `${p}: el foco queda en la sección (${after.focus})`);
    ok(after.top >= after.cp - 2 && after.top <= after.cp + 40, `${p}: la sección queda bajo la píldora, no tapada (top ${Math.round(after.top)} px, padding ${Math.round(after.cp)} px)`);
    await ctx.close();
  }
  // pantalla baja (320×568): el botón dominante del menú queda a la vista sin desplazar el menú
  for (const p of homes) {
    const { ctx, page } = await open(p, { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await page.locator('.nav__menu').click();
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const m = document.querySelector('[data-menu-panel]');
      const wa = m.querySelector('.wa-wide').getBoundingClientRect();
      return { waBottom: wa.bottom, waTop: wa.top, h: innerHeight, scrolls: m.scrollHeight > m.clientHeight };
    });
    ok(r.waBottom <= r.h + 0.5 && r.waTop >= 0, `${p} a 320×568: «WhatsApp» del menú a la vista sin desplazar (base ${Math.round(r.waBottom)} ≤ ${r.h}; el menú ${r.scrolls ? 'sí' : 'no'} se desplaza)`);
    await page.screenshot({ path: join(shots, `chk-menu-320x568${p.replace(/\//g, '_')}.png`) });
    await ctx.close();
  }
}

// ── Scroll-spy, conmutador de idioma e historial ─────────────────────────────────────────────────
if (run('spy')) {
  section('Scroll-spy (aria-current), idioma con ancla y sin tocar el historial');
  for (const p of homes) {
    const { ctx, page } = await open(p, DESKTOP);
    const h0 = await page.evaluate(() => ({ len: history.length, hash: location.hash }));
    const ids = await page.evaluate(() => [...document.querySelectorAll('.nav__links a[data-spy]')].map((a) => ({ label: a.textContent.trim(), spy: a.dataset.spy.split(' ') })));
    ok(ids.length === 5, `${p}: cinco enlaces en la píldora (${ids.map((i) => i.label).join(' · ')})`);
    for (const l of ids) {
      for (const id of l.spy) {
        const exists = await page.evaluate((x) => !!document.getElementById(x), id);
        if (!exists) { ok(false, `${p}: existe la sección #${id} de «${l.label}»`); continue; }
        await page.evaluate((x) => { const el = document.getElementById(x); window.scrollTo(0, el.getBoundingClientRect().top + scrollY + 10); }, id);
        await page.waitForTimeout(500);
        const cur = await page.evaluate(() => [...document.querySelectorAll('.nav__links [aria-current]')].map((a) => a.textContent.trim()));
        ok(cur.length === 1 && cur[0] === l.label, `${p}: en #${id} el enlace activo es «${l.label}» (${cur.join(',') || 'ninguno'})`);
      }
    }
    const h1 = await page.evaluate(() => ({ len: history.length, hash: location.hash }));
    ok(h1.len === h0.len && h1.hash === h0.hash, `${p}: el scroll-spy no toca el historial (${h0.len} → ${h1.len}, hash «${h1.hash}»)`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    ok((await page.locator('.nav__links [aria-current]').count()) === 0, `${p}: en la portada no hay enlace activo`);
    // idioma con ancla
    const sid = ids[1].spy[0];
    await page.evaluate((x) => window.scrollTo(0, document.getElementById(x).getBoundingClientRect().top + scrollY + 10), sid);
    await page.waitForTimeout(500);
    const lang = await page.locator('.nav__end .lang-link').getAttribute('href');
    const hl = await page.locator('.nav__end .lang-link').getAttribute('hreflang');
    const lab = await page.locator('.nav__end .lang-link').getAttribute('aria-label');
    ok(/#[a-z]+$/.test(lang), `${p}: el enlace de idioma conserva el ancla (${lang}) · hreflang=${hl} · aria-label=${lab}`);
    await page.locator('.nav__end .lang-link').click();
    await page.waitForURL('**' + lang.split('#')[0] + '*');
    await page.waitForTimeout(900);
    const dest = await page.evaluate(() => { const el = document.getElementById(location.hash.slice(1)); return { hash: location.hash, top: el?.getBoundingClientRect().top, lang: document.documentElement.lang, cp: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) }; });
    ok(dest.top !== undefined && dest.top >= dest.cp - 2 && dest.top <= dest.cp + 40, `${p}: al cambiar de idioma llega a ${dest.hash} con el título bajo la píldora (top ${Math.round(dest.top)} px ≥ ${Math.round(dest.cp)} px)`);
    await ctx.close();
  }
  // galería: «Ejemplos» es la página actual
  for (const p of galleries) {
    const { ctx, page } = await open(p, DESKTOP);
    const cur = await page.evaluate(() => [...document.querySelectorAll('.nav__links [aria-current]')].map((a) => `${a.textContent.trim()}=${a.getAttribute('aria-current')}`));
    ok(cur.length === 1 && cur[0].endsWith('=page'), `${p}: «Ejemplos» lleva aria-current="page" (${cur.join(',')})`);
    const lang = await page.locator('.nav__end .lang-link').getAttribute('href');
    ok(lang && lang !== p, `${p}: el idioma enlaza a la misma ruta del otro idioma (${lang})`);
    await ctx.close();
  }
}

// ── Póster SSR (§6.9) ────────────────────────────────────────────────────────────────────────────
if (run('poster')) {
  section('Póster SSR: 3 variantes por @container, JS desactivado, peso');
  for (const p of homes) {
    const html = await (await fetch(base + p)).text();
    const m = html.match(/<div class="poster-ssr"[\s\S]*?<\/noscript>/);
    ok(!!m, `${p}: el HTML trae el póster SSR`);
    if (m) {
      const gz = gzipSync(Buffer.from(m[0]), { level: 9 }).length;
      console.log(`       · peso del póster (3 variantes, sin escape de Astro): ${(m[0].length / 1024).toFixed(1)} KB · ${(gz / 1024).toFixed(2)} KB gz (presupuesto ≈ 5,5 KB gz)`);
      ok(gz < 5.6 * 1024 + 3000, `${p}: el póster pesa ${(gz / 1024).toFixed(2)} KB gz`);
      ok(/data-nosnippet/.test(m[0]) && /aria-hidden="true"/.test(m[0]) && /translate="no"/.test(m[0]), `${p}: div[data-nosnippet][aria-hidden][translate=no]`);
      const arts = [...m[0].matchAll(/data-art="([^"]*)"/g)].map((x) => x[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&'));
      ok(arts.length === 12, `${p}: 12 capas (3 variantes × 4 tonos): ${arts.length}`);
      ok(arts.every((a) => forbiddenGlyphs(a).length === 0), `${p}: solo glifos del alfabeto permitido`);
      ok(!/data-art="[^"]*[<]/.test(m[0]) && !/data-art="[^"]*"[^"]*"/.test(m[0].replace(/data-art="[^"]*"/g, 'x')), `${p}: <, & y " escapados en data-art`);
    }
    // ida y vuelta: lo que trae el HTML es EXACTAMENTE lo que produce renderPosterLayers con la escena cover (T6 en el HTML)
    if (m && getScene('cover')) {
      const lang = p.startsWith('/en/') ? 'en' : 'es';
      await loadWords(lang, ['GAYA']);
      const dec = (x) => x.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
      let same = 0;
      let total = 0;
      for (const v of POSTER_VARIANTS) {
        const want = renderPosterLayers(getScene('cover'), posterSpec(v), lang, [getWords('GAYA', lang, v.cols, v.rows)]);
        const block = m[0].split('poster-ssr__v--' + v.key)[1]?.split('poster-ssr__v')[0] ?? '';
        for (const n of ['dim', 'mid', 'hot', 'spark']) {
          const got = block.match(new RegExp('poster-ssr__l--' + n + '"[^>]*data-art="([^"]*)"'))?.[1];
          total++;
          if (got !== undefined && dec(got) === want[n]) same++;
        }
      }
      ok(same === total && total === 12, `${p}: las 12 capas del HTML son idénticas al póster de la escena cover (${ssr.renderPosterLayersDuo ? 'renderPosterLayersDuo' : 'renderPosterLayers'}) (${same}/${total})`);
    }
    // con JS: no se pinta
    const a = await open(p, DESKTOP);
    const shown = await a.page.evaluate(() => getComputedStyle(document.querySelector('.poster-ssr')).display);
    ok(shown === 'none', `${p}: con JS el póster está display:none (${shown})`);
    await a.page.evaluate(() => (document.documentElement.dataset.field = 'ssr'));
    ok((await a.page.evaluate(() => getComputedStyle(document.querySelector('.poster-ssr')).display)) === 'grid', `${p}: con html[data-field="ssr"] se muestra`);
    await a.ctx.close();
    // sin JS: variante por ancho
    const expect = { 390: 'stack', 560: 'stack', 600: 'mid', 768: 'mid', 850: 'wide', 1100: 'mid', 1300: 'wide', 1440: 'wide', 1920: 'wide' };
    for (const [w, want] of Object.entries(expect)) {
      const c = await open(p, { viewport: { width: Number(w), height: 900 }, javaScriptEnabled: false }, { wait: 400 });
      const r = await c.page.evaluate(() => {
        const shown = [...document.querySelectorAll('.poster-ssr__v')].filter((e) => getComputedStyle(e).display !== 'none');
        return {
          v: shown.map((e) => e.className.match(/--(\w+)/)[1]),
          mt: shown.map((e) => parseFloat(getComputedStyle(e).marginTop)),
          ch: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ch')),
          cols: Math.floor(document.querySelector('.poster-ssr').clientWidth / (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cw')) || 9)),
        };
      });
      ok(r.v.length === 1 && r.v[0] === want, `${p} sin JS a ${w} px (${r.cols} columnas): variante ${r.v.join(',')} (esperada ${want})`);
      // mid y wide se componen para celdas de 9×18 (4 filas = 72 px bajo la píldora): con celdas de 6×12 (< 900 px) se bajan 2 filas
      const wantMt = Number(w) < 900 && want !== 'stack' ? 2 * r.ch : 0;
      ok(r.mt[0] === wantMt, `${p} sin JS a ${w} px: ${r.v[0]} ${wantMt ? 'baja 2 filas (' + wantMt + ' px) para no quedar bajo la píldora' : 'sin desplazamiento'} (margen superior ${r.mt[0]} px)`);
      await c.ctx.close();
    }
    // zoom de solo texto: el tamaño de fuente no rompe la conmutación (el contenedor mide en ch)
  }
}

// ── Hilo del Proceso (§7.8) ──────────────────────────────────────────────────────────────────────
if (run('thread')) {
  section('Hilo del Proceso: cabe a 320 px, ol real, encendido sin timeline o con movimiento reducido');
  for (const p of homes) {
    for (const width of [320, 360, 390, 768, 1440]) {
      const { ctx, page } = await open(p, { viewport: { width, height: 800 }, isMobile: width < 768, hasTouch: width < 768, reducedMotion: 'reduce' }, { wait: 500 });
      const r = await page.evaluate(() => {
        const t = document.querySelector('.thread');
        if (!t) return null;
        const tb = t.getBoundingClientRect();
        const arts = [...t.querySelectorAll('.art')].filter((a) => getComputedStyle(a).display !== 'none');
        const widest = Math.max(...arts.map((a) => a.scrollWidth));
        const words = [...t.querySelectorAll('.thread__cap')].map((c) => [...c.querySelectorAll('.thread__w')].find((w) => getComputedStyle(w).display !== 'none')?.className.match(/w--(\w+)/)[1]);
        const items = [...t.querySelectorAll('ol > li')];
        const lit = getComputedStyle(t.querySelector('.thread__rail--lit')).clipPath;
        const onOp = getComputedStyle(t.querySelector('.thread__node--on')).opacity;
        const lab = items.map((li) => li.querySelector('.thread__label').textContent.trim());
        const rows = items.map((li) => Math.round(li.getBoundingClientRect().height / parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ch'))));
        return { w: tb.width, widest, doc: document.documentElement.scrollWidth, inner: innerWidth, words, n: items.length, lit, onOp, lab, rows, role: t.querySelector('ol').getAttribute('role') };
      });
      if (!r) { ok(false, `${p}: hay un .thread`); await ctx.close(); continue; }
      ok(r.n === 4 && r.lab.every(Boolean), `${p} a ${width} px: ol de 4 pasos con texto real (${r.lab.join(' · ')})`);
      ok(r.widest <= r.w + 1 && r.doc <= r.inner, `${p} a ${width} px: el hilo cabe sin scroll horizontal (arte ${r.widest} px ≤ contenedor ${Math.round(r.w)} px); palabras: ${r.words.join(' + ')}`);
      ok(r.lit === 'none' && r.onOp === '1', `${p} a ${width} px con movimiento reducido: todo encendido`);
      ok(r.rows.every((x) => Number.isInteger(x)), `${p} a ${width} px: cada paso mide filas enteras (${r.rows.join(', ')})`);
      await ctx.close();
    }
  }
}

// ── Animaciones con view(): sobre el build de producción ────────────────────────────────────────
if (run('anim')) {
  section('Animaciones con animation-timeline: view() (hilo, reglas, palabras): CSS de producción y comportamiento');
  for (const p of homes) {
    // 1. el CSS servido no contiene `animation:` con view() (el atajo que Chrome rechaza)
    const html = await (await fetch(base + p)).text();
    const sheets = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((m) => m[1]);
    const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
    for (const h of sheets) css.push(await (await fetch(new URL(h, base + p))).text());
    const all = css.join('\n');
    const folded = all.match(/animation\s*:[^;}]*view\(/g) ?? [];
    ok(folded.length === 0, `${p}: ningún atajo «animation:» lleva view() (${folded.length ? folded.slice(0, 2).join(' | ') : 'longhands intactos'})`);
    ok(/animation-timeline\s*:\s*view\(/.test(all), `${p}: el CSS servido conserva animation-timeline: view()`);
    // 2. comportamiento real en Chrome (movimiento normal)
    const { ctx, page } = await open(p, { ...DESKTOP, reducedMotion: 'no-preference' });
    const supported = await page.evaluate(() => CSS.supports('animation-timeline', 'view()'));
    ok(supported, `${p}: este Chrome admite animation-timeline: view()`);
    if (supported) {
      const names = await page.evaluate(() => ({
        rail: getComputedStyle(document.querySelector('.thread__rail--lit')).animationName,
        node: getComputedStyle(document.querySelector('.thread__node--on')).animationName,
        word: getComputedStyle(document.querySelector('.thread__cap--bottom .thread__w--proc')).animationName,
        rule: getComputedStyle(document.querySelector('.art.rule')).animationName,
        mini: getComputedStyle(document.querySelector('.art.word-mini')).animationName,
      }));
      ok(Object.values(names).every((n) => n && n !== 'none'), `${p}: las cinco animaciones están activas (${Object.entries(names).map(([k, v]) => k + '=' + v).join(', ')})`);
      // el riel del hilo se enciende con el scroll: entra recortado y acaba entero
      const top = await page.evaluate(() => document.querySelector('.thread').getBoundingClientRect().top + scrollY);
      const clips = [];
      for (const off of [860, 640, 420, 200]) {
        await page.evaluate((y) => window.scrollTo(0, y), top - off);
        await page.waitForTimeout(350);
        clips.push(await page.evaluate(() => [...document.querySelectorAll('.thread__step')].map((s) => getComputedStyle(s.querySelector('.thread__rail--lit')).clipPath)));
      }
      const distinct = new Set(clips.flat());
      const mid = [...distinct].filter((c) => c !== 'inset(0px 0px 100%)' && c !== 'inset(0px 0px 0%)');
      ok(distinct.has('inset(0px 0px 100%)') && distinct.has('inset(0px 0px 0%)') && mid.length >= 1, `${p}: el clip-path del riel pasa de recortado (100 %) a entero (0 %) con el scroll, con pasos intermedios (${[...distinct].join(' · ')})`);
      await page.evaluate((y) => window.scrollTo(0, y), top - 860);
      await page.waitForTimeout(350);
      const a = await page.evaluate(() => [...document.querySelectorAll('.thread__node--on')].map((n) => +getComputedStyle(n).opacity));
      await page.evaluate((y) => window.scrollTo(0, y), top - 100);
      await page.waitForTimeout(350);
      const b = await page.evaluate(() => [...document.querySelectorAll('.thread__node--on')].map((n) => +getComputedStyle(n).opacity));
      ok(a.some((v, i) => v !== b[i]), `${p}: las estaciones se encienden con el scroll (${a.map((v) => v.toFixed(2)).join('·')} → ${b.map((v) => v.toFixed(2)).join('·')})`);
    }
    await ctx.close();
    // 3. movimiento reducido: todo encendido y sin animación
    const r = await open(p, { ...DESKTOP, reducedMotion: 'reduce' });
    const rr = await r.page.evaluate(() => ({ rail: getComputedStyle(document.querySelector('.thread__rail--lit')).animationName, clip: getComputedStyle(document.querySelector('.thread__rail--lit')).clipPath, rule: getComputedStyle(document.querySelector('.art.rule')).animationName }));
    ok(rr.rail === 'none' && rr.clip === 'none' && rr.rule === 'none', `${p}: con movimiento reducido no hay animaciones (todo encendido)`);
    await r.ctx.close();
  }
}

// ── Arte en DOM: contrato, forced-colors, contraste alto, impresión (T11) ───────────────────────
if (run('art') || run('print')) {
  section('Arte en DOM: contrato, forced-colors, prefers-contrast e impresión (T11)');
  for (const p of homes) {
    const { ctx, page } = await open(p, DESKTOP);
    const r = await page.evaluate(() => {
      const arts = [...document.querySelectorAll('.art')];
      const wrong = arts.filter((a) => a.tagName !== 'SPAN' || a.getAttribute('aria-hidden') !== 'true' || a.getAttribute('translate') !== 'no' || !a.hasAttribute('data-art'));
      const txt = arts.filter((a) => a.textContent.trim() !== '');
      const sel = arts.filter((a) => getComputedStyle(a).userSelect !== 'none');
      return { n: arts.length, wrong: wrong.length, txt: txt.length, sel: sel.length, all: arts.map((a) => a.dataset.art).join('\n') };
    });
    ok(r.n > 20 && r.wrong === 0, `${p}: ${r.n} piezas de arte, todas span.art[aria-hidden][translate=no][data-art]`);
    ok(r.txt === 0, `${p}: el arte no tiene texto en el DOM (solo ::before)`);
    ok(r.sel === 0, `${p}: user-select: none en todo el arte`);
    ok(forbiddenGlyphs(r.all).length === 0, `${p}: glifos dentro del alfabeto permitido${forbiddenGlyphs(r.all).length ? ' → ' + forbiddenGlyphs(r.all).join('') : ''}`);
    await ctx.close();

    const f = await open(p, { ...DESKTOP, forcedColors: 'active' });
    const fc = await f.page.evaluate(() => {
      const a = document.querySelector('.art.word-mini, .art.thread__w--proc, .art.rule');
      const cs = getComputedStyle(a);
      return { c: cs.color, ts: cs.textShadow, poster: getComputedStyle(document.querySelector('.poster-ssr')).display };
    });
    await f.page.evaluate(() => (document.documentElement.dataset.field = 'ssr'));
    const pd = await f.page.evaluate(() => getComputedStyle(document.querySelector('.poster-ssr')).display);
    ok(fc.ts === 'none' && fc.poster === 'none' && pd === 'none', `${p} forced-colors: sin sombra de texto y póster oculto (incluso con data-field=ssr)`);
    await f.page.screenshot({ path: join(shots, `chk-forced${p.replace(/\//g, '_')}.png`) });
    await f.ctx.close();

    const pr = await open(p, DESKTOP);
    await pr.page.emulateMedia({ media: 'print' });
    const prr = await pr.page.evaluate(() => {
      const a = document.querySelector('.art.word-mini');
      const cs = getComputedStyle(a);
      return { color: cs.color, fs: cs.fontSize, nav: getComputedStyle(document.querySelector('.nav')).display, bar: getComputedStyle(document.querySelector('[data-bar]')).display, shadow: cs.textShadow };
    });
    ok(prr.color === 'rgb(0, 0, 0)' && prr.fs === '9.33333px' && prr.nav === 'none' && prr.bar === 'none', `${p} impresión: arte negro a 7 pt (${prr.fs}), sin cromo`);
    await pr.page.screenshot({ path: join(shots, `chk-print${p.replace(/\//g, '_')}.png`), fullPage: false });
    await pr.ctx.close();

    const hc = await open(p, { ...DESKTOP, contrast: 'more' });
    const hcr = await hc.page.evaluate(() => { const a = document.querySelector('.art.word-mini'); return { c: getComputedStyle(a).color, ts: getComputedStyle(a).textShadow }; });
    ok(hcr.ts === 'none', `${p} prefers-contrast: more: sin sombras en el arte (${hcr.c})`);
    await hc.ctx.close();
  }
}

await browser.close();
console.log(fails ? `\n✗ ${fails} fallos` : '\n✓ Todo en verde');
process.exit(fails ? 1 : 0);
