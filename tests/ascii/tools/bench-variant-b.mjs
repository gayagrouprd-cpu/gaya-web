// Coste de la variante B frente a la base en Chrome real con CPU estrangulada (proxy del Samsung A07, §6.12): node tests/ascii/tools/bench-variant-b.mjs [--json out.json]
// NO sustituye la puerta del A07 físico: declara solo lo que dicen CPU ×1/×4/×6 de un PC. Presupuesto: mediana ≤ 6 ms, p95 ≤ 12 ms por cuadro.
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../../../scripts/lib/browser.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const jsonIx = process.argv.indexOf('--json');
const r = await build({
  entryPoints: [resolve(HERE, 'bench-variant-b-core.mjs')],
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'B',
  platform: 'browser',
  logLevel: 'silent',
});
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
if (jsonIx > -1) writeFileSync(process.argv[jsonIx + 1], JSON.stringify({ ua, results }, null, 1));
const f = (x) => `${x.p50.toFixed(2)}/${x.p95.toFixed(2)}`.padStart(11);
console.log(ua);
for (const who of ['base', 'b']) {
  console.log(`\n${who === 'b' ? 'VARIANTE B' : 'BASE SÓLIDA'}   [ms p50/p95]\nCPU  celdas | reposo: cover · hola | calor+anillos: cover · hola | ignición cover | CUADRO DE MAREA (2 paint + compose + pozos)`);
  for (const x of results) {
    console.log(`×${x.rate}`.padEnd(4), String(x.cells).padStart(5), '|', f(x[`idleCover_${who}`]), f(x[`idleHola_${who}`]), '|', f(x[`heatCover_${who}`]), f(x[`heatHola_${who}`]), '|', f(x[`igniteCover_${who}`]), '|', f(x[`tide_${who}`]));
  }
}
const x = results[0];
const keys = ['baseCover', 'baseHola', 'bCover', 'bHola'];
console.log(`\nhorneado (×1, ${x.cells} celdas): tesela ${x.bakeTileMs.toFixed(1)} ms · build ${keys.map((k) => `${k} ${x[`build_${k}`].toFixed(1)}`).join(' · ')} ms`);
for (const y of results.filter((y) => y.rate > 1)) console.log(`horneado ×${y.rate} (${y.cells}): build ${keys.map((k) => `${k} ${y[`build_${k}`].toFixed(1)}`).join(' · ')} ms`);
