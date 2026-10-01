#!/usr/bin/env node
// Comprueba los respaldos métricos de src/styles/fonts.css («Gaya Sans Fallback» y «Gaya Mono Fallback»).
// Mientras llega la fuente (font-display: swap) el respaldo debe ocupar el mismo ancho y la misma altura de línea,
// o la página se mueve (CLS). Dos etapas:
//   1. Con @capsizecss/unpack sobre los archivos reales: los ascent/descent/line-gap de cada @font-face deben salir de las
//      métricas de la fuente web divididas por su size-adjust (así se escriben los overrides). Determinista, sin navegador.
//   2. Con --measure, Chrome real: ancho de frases en español e inglés y altura de línea / línea base, fuente web frente a
//      respaldo, en cada peso. Tolerancia: ancho ±2 % (mono ±0,5 %), vertical ±1 px con cuerpo de 100 px.
// Por qué el respaldo sans son tres @font-face: el ancho de Bricolage crece con el peso (800 es ≈ 8 % más ancha que 400 y
// Arial no cambia), y el cálculo de capsize/Astro usa la instancia por defecto (ExtraBold, 111,04 %), que ensancha un 7 % el cuerpo.
// El respaldo es el primer archivo que exista: --sans <ttf> / --mono <ttf>, o Arial / Courier New del sistema.
// Uso: node scripts/fallback-check.mjs [--measure] [--sans ruta.ttf] [--mono ruta.ttf]
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromFile } from '@capsizecss/unpack/fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const FONTS = join(ROOT, 'node_modules/@fontsource-variable');
const WEB = {
  sans: join(FONTS, 'bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2'),
  mono: join(FONTS, 'geist-mono/files/geist-mono-latin-wght-normal.woff2'),
};
const SYSTEM = {
  sans: [arg('sans'), 'C:/Windows/Fonts/arial.ttf', '/System/Library/Fonts/Supplemental/Arial.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'],
  mono: [arg('mono'), 'C:/Windows/Fonts/cour.ttf', '/System/Library/Fonts/Courier.ttc', '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf'],
};
const FAMILY = { sans: 'Gaya Sans Fallback', mono: 'Gaya Mono Fallback' };
const css = readFileSync(join(ROOT, 'src/styles/fonts.css'), 'utf8');

/** Todos los @font-face de una familia, con sus descriptores métricos y su rango de peso. */
function facesOf(family) {
  const faces = [...css.matchAll(/@font-face\s*{[^}]*}/g)]
    .map((m) => m[0])
    .filter((block) => new RegExp(`font-family:\\s*'${family}'`).test(block))
    .map((block) => {
      const num = (name) => parseFloat(new RegExp(`${name}:\\s*([\\d.]+)%`).exec(block)?.[1] ?? 'NaN');
      const w = /font-weight:\s*(\d+)(?:\s+(\d+))?/.exec(block);
      return {
        block,
        from: w ? Number(w[1]) : 400,
        to: w ? Number(w[2] ?? w[1]) : 400,
        sizeAdjust: num('size-adjust'),
        ascent: num('ascent-override'),
        descent: num('descent-override'),
        lineGap: num('line-gap-override'),
      };
    });
  if (!faces.length) throw new Error(`fonts.css no declara @font-face de «${family}»`);
  return faces;
}

let fails = 0;
const say = (ok, line) => {
  if (!ok) fails++;
  console.log(`${ok ? 'ok   ' : 'FALLA'}  ${line}`);
};

// ── Etapa 1: capsize ───────────────────────────────────────────────────────────────────────────
const present = {};
for (const kind of ['sans', 'mono']) {
  const sysFile = SYSTEM[kind].find((f) => f && existsSync(f));
  const web = await fromFile(WEB[kind]);
  const sys = sysFile ? await fromFile(sysFile) : null;
  present[kind] = Boolean(sys);
  const ref = sys ? ((web.xWidthAvg / web.unitsPerEm) / (sys.xWidthAvg / sys.unitsPerEm)) * 100 : NaN;
  console.log(`\n${FAMILY[kind]}  web: ${web.familyName} (xWidthAvg ${web.xWidthAvg}/${web.unitsPerEm}, ascent ${web.ascent}, descent ${web.descent}, lineGap ${web.lineGap})`);
  console.log(`      respaldo: ${sys ? `${sys.familyName} en ${sysFile} (xWidthAvg ${sys.xWidthAvg}/${sys.unitsPerEm})` : 'no hay archivo en este equipo (usa --' + kind + ' ruta.ttf)'}`);
  if (sys) console.log(`      referencia capsize (instancia por defecto de la fuente web): size-adjust ${ref.toFixed(2)} %`);
  for (const f of facesOf(FAMILY[kind])) {
    const sa = f.sizeAdjust / 100;
    const label = `peso ${f.from === f.to ? f.from : f.from + '–' + f.to} size-adjust ${f.sizeAdjust} %`;
    say(Math.abs(f.ascent * sa - (web.ascent / web.unitsPerEm) * 100) <= 0.1, `${label}: ascent-override ${f.ascent} % × size-adjust = ${(f.ascent * sa).toFixed(2)} % (fuente: ${((web.ascent / web.unitsPerEm) * 100).toFixed(2)} %)`);
    say(Math.abs(f.descent * sa - (Math.abs(web.descent) / web.unitsPerEm) * 100) <= 0.1, `${label}: descent-override ${f.descent} % × size-adjust = ${(f.descent * sa).toFixed(2)} % (fuente: ${((Math.abs(web.descent) / web.unitsPerEm) * 100).toFixed(2)} %)`);
    say(f.lineGap === 0 && web.lineGap === 0, `${label}: line-gap-override ${f.lineGap} % (la fuente web no tiene line-gap)`);
  }
}

// ── Etapa 2: Chrome real ───────────────────────────────────────────────────────────────────────
if (process.argv.includes('--measure')) {
  const { launchBrowser } = await import('./lib/browser.mjs');
  const b64 = (f) => readFileSync(f).toString('base64');
  const SANS_SAMPLES = {
    es: 'Desarrollo web y apps, marketing digital, soporte IT y automatización con IA. Desde Santo Domingo, República Dominicana, para el mundo.',
    en: 'Web and app development, digital marketing, IT support and AI automation. From Santo Domingo, Dominican Republic, to the world.',
    ui: 'Referencias Presencia Reservas y pedidos App Quiero una así Escríbenos por WhatsApp Nosotros Servicios Ejemplos Proceso Contacto',
  };
  // Tipografía mixta: la mono ya no solo rotula (500), también pinta titulares y botones (600–800) mientras llega la fuente.
  const MONO_SAMPLES = {
    ascii: 'yaAG~*o·:= 0123456789 hola@gaya.com.do +1 849 925 4426 '.repeat(4),
    titulares: 'Tu negocio, imposible de ignorar · Quiénes somos · Soporte e infraestructura IT · Your business, impossible to ignore · Escríbenos por WhatsApp · Gaya Digital',
  };
  const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:W;src:url(data:font/woff2;base64,${b64(WEB.sans)}) format('woff2-variations');font-weight:200 800}
@font-face{font-family:M;src:url(data:font/woff2;base64,${b64(WEB.mono)}) format('woff2-variations');font-weight:100 900}
${[...facesOf(FAMILY.sans), ...facesOf(FAMILY.mono)].map((f) => f.block).join('\n')}
body{margin:0} .l{font-size:100px;white-space:nowrap;display:inline-block} .p{display:inline-block;width:0;height:0}
</style><body><div id="o"></div>`;
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setContent(html);
  const weights = [300, 400, 500, 600, 700, 800];
  await page.evaluate(async (ws) => {
    await Promise.all(ws.flatMap((w) => [document.fonts.load(`${w} 100px W`, 'Aa'), document.fonts.load(`${w} 100px "Gaya Sans Fallback"`, 'Aa')]));
    await Promise.all([document.fonts.load('400 100px M', 'Aa'), document.fonts.load('400 100px "Gaya Mono Fallback"', 'Aa')]);
  }, weights);
  const status = await page.evaluate(() => [...document.fonts].map((f) => `${f.family} ${f.weight}: ${f.status}`));
  console.log(`\nFuentes en Chrome: ${status.join(' · ')}`);
  const measure = (family, weight, text) =>
    page.evaluate(
      ({ family, weight, text }) => {
        const o = document.getElementById('o');
        o.innerHTML = '';
        const l = document.createElement('span');
        l.className = 'l';
        l.style.cssText = `font-family:${family};font-weight:${weight}`;
        l.textContent = text;
        const p = document.createElement('span');
        p.className = 'p';
        l.append(p);
        o.append(l);
        const box = l.getBoundingClientRect();
        // el inline-block vacío apoya su borde inferior en la línea base
        return { width: box.width, height: box.height, baseline: p.getBoundingClientRect().bottom - box.top };
      },
      { family, weight, text },
    );
  console.log('\nMedición en Chrome (cuerpo 100 px; respaldo / fuente web):');
  for (const [kind, webFamily, tol, ws, samples] of [
    ['sans', 'W', 0.02, weights, SANS_SAMPLES],
    ['mono', 'M', 0.005, [400, 500, 600, 700, 800], MONO_SAMPLES],
  ]) {
    if (!present[kind]) continue;
    for (const weight of ws) {
      const row = [];
      let worst = 0;
      for (const [name, text] of Object.entries(samples)) {
        const w = await measure(webFamily, weight, text);
        const f = await measure(`"${FAMILY[kind]}"`, weight, text);
        const ratio = f.width / w.width;
        worst = Math.max(worst, Math.abs(ratio - 1));
        row.push(`${name} ${(ratio * 100).toFixed(2)} %`);
        if (name === Object.keys(samples)[0]) {
          say(Math.abs(f.height - w.height) <= 1, `${kind} ${weight} alto de línea (normal) ${f.height.toFixed(2)} / ${w.height.toFixed(2)} px`);
          say(Math.abs(f.baseline - w.baseline) <= 1, `${kind} ${weight} línea base ${f.baseline.toFixed(2)} / ${w.baseline.toFixed(2)} px`);
        }
      }
      say(worst <= tol, `${kind} ${weight} ancho: ${row.join(' · ')}  (máx. desvío ${(worst * 100).toFixed(2)} %, tolerancia ${(tol * 100).toFixed(1)} %)`);
    }
  }
  await browser.close();
}

console.log(fails ? `\n${fails} comprobación(es) con fallo.` : '\nRespaldos métricos correctos.');
process.exit(fails ? 1 : 0);
