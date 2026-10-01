// Coste de las escenas de WP6 en Chrome real con CPU estrangulada (proxy del Samsung A07, §6.12): node tests/ascii/tools/bench-scenes.mjs [--json]
// NO sustituye la puerta del A07 físico (T12): declara solo lo que dicen CPU ×4/×6 de un PC. Presupuesto: mediana ≤ 6 ms, p95 ≤ 12 ms.
import { build } from 'esbuild';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../../../scripts/lib/browser.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const json = process.argv.includes('--json');
const r = await build({
  entryPoints: [resolve(HERE, 'bench-scenes-core.mjs')],
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
if (json) console.log(JSON.stringify({ ua, results }));
else {
  const f = (x) => `${x.p50.toFixed(2)}/${x.p95.toFixed(2)}`.padStart(11);
  console.log(ua);
  console.log('\nCPU  celdas | reposo: cover · hola · mist | calor+anillos: cover · hola | ignición cover | CUADRO DE MAREA (2 paint + compose + pozos)   [ms p50/p95]');
  for (const x of results) {
    console.log(`×${x.rate}`.padEnd(4), String(x.cells).padStart(5), '|', f(x.idleCover), f(x.idleHola), f(x.idleMist), '|', f(x.heatCover), f(x.heatHola), '|', f(x.igniteCover), '|', f(x.tideFrame));
  }
  const x = results[0];
  console.log(`\nhorneado (×1, ${x.cells} celdas): tesela ${x.bakeTileMs.toFixed(1)} ms · build cover ${x.buildCoverMs.toFixed(1)} · hola ${x.buildHolaMs.toFixed(1)} · mist ${x.buildMistMs.toFixed(1)} · póster ${x.posterMs.toFixed(1)} ms`);
  for (const y of results.filter((y) => y.rate > 1)) console.log(`horneado ×${y.rate} (${y.cells}): tesela ${y.bakeTileMs.toFixed(1)} · build cover ${y.buildCoverMs.toFixed(1)} · hola ${y.buildHolaMs.toFixed(1)} · mist ${y.buildMistMs.toFixed(1)} · póster ${y.posterMs.toFixed(1)} ms`);
}
