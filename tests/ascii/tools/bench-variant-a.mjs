// Coste de la Variante A frente a la base en Chrome real con CPU estrangulada (proxy del Samsung A07, §6.12): node tests/ascii/tools/bench-variant-a.mjs [--json]
// NO sustituye la puerta del A07 físico (T12): declara solo lo que dicen CPU ×4/×6 de un PC. Presupuesto: mediana ≤ 6 ms, p95 ≤ 12 ms.
import { build } from 'esbuild';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../../../scripts/lib/browser.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const json = process.argv.includes('--json');
const r = await build({ entryPoints: [resolve(HERE, 'bench-variant-a-core.mjs')], bundle: true, write: false, format: 'iife', globalName: 'B', platform: 'browser', logLevel: 'silent' });
const browser = await launchBrowser();
const page = await browser.newPage();
await page.setContent('<!doctype html><title>bench</title>');
await page.addScriptTag({ content: r.outputFiles[0].text });
const cdp = await page.context().newCDPSession(page);
const ua = await page.evaluate(() => navigator.userAgent);
const results = [];
for (const rate of [1, 4, 6]) {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  for (const cells of [6500, 9000]) {
    await page.evaluate((c) => B.runBench(c, { frames: 100, warm: 150 }), cells);
    results.push({ rate, ...(await page.evaluate(({ c, frames }) => B.runBench(c, { frames, warm: 100 }), { c: cells, frames: rate > 1 ? 240 : 400 })) });
  }
}
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await browser.close();
if (json) console.log(JSON.stringify({ ua, results }));
else {
  const f = (x) => `${x.p50.toFixed(2)}/${x.p95.toFixed(2)}`.padStart(11);
  console.log(ua);
  console.log('\nCPU  celdas | reposo cover: base · A | reposo hola: base · A | calor+anillos cover: base · A | ignición cover: base · A | cuadro de MAREA: base · A   [ms p50/p95]');
  for (const x of results) console.log(`×${x.rate}`.padEnd(4), String(x.cells).padStart(5), '|', f(x.idleCoverBase), f(x.idleCoverA), '|', f(x.idleHolaBase), f(x.idleHolaA), '|', f(x.heatCoverBase), f(x.heatCoverA), '|', f(x.igniteBase), f(x.igniteA), '|', f(x.tideBase), f(x.tideA));
  const x = results[0];
  console.log(`\nhorneado (×1, ${x.cells} celdas): build cover base ${x.buildBase.toFixed(1)} ms · A ${x.buildCoverA.toFixed(1)} · hola base+A ${x.buildHolaAB.toFixed(1)} · póster base ${x.posterBase.toFixed(1)} · póster A (colapsado) ${x.posterA.toFixed(1)}`);
  for (const y of results.filter((y) => y.rate > 1)) console.log(`horneado ×${y.rate} (${y.cells}): build cover base ${y.buildBase.toFixed(1)} · A ${y.buildCoverA.toFixed(1)} · hola base+A ${y.buildHolaAB.toFixed(1)} · póster base ${y.posterBase.toFixed(1)} · A ${y.posterA.toFixed(1)}`);
}
