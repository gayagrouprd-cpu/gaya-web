// Micro-benchmark en Chrome real con CPU estrangulada (proxy del Samsung A07, §6.12): node tests/ascii/tools/bench-chrome.mjs
// Empaqueta bench-core.mjs con esbuild (viene con Vite), lo carga en una página vacía y lo ejecuta a CPU ×1, ×4 y ×6 por CDP.
// NO sustituye la puerta del A07 físico (T12): declara solo lo que dice CPU ×4/×6 de un PC.
import { build } from 'esbuild';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../../../scripts/lib/browser.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const json = process.argv.includes('--json');
const r = await build({
  entryPoints: [resolve(HERE, 'bench-core.mjs')],
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'B',
  platform: 'browser',
  logLevel: 'silent',
});
const code = r.outputFiles[0].text;

const browser = await launchBrowser();
const page = await browser.newPage();
await page.setContent('<!doctype html><title>bench</title>');
await page.addScriptTag({ content: code });
const cdp = await page.context().newCDPSession(page);
const ua = await page.evaluate(() => navigator.userAgent);
const results = [];
for (const rate of [1, 4, 6]) {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  for (const cells of [6500, 9000]) {
    await page.evaluate((c) => B.runBench(c, { frames: 100, warm: 200 }), cells); // calienta el JIT a esa velocidad
    const res = await page.evaluate(({ c, frames }) => B.runBench(c, { frames, warm: 100 }), { c: cells, frames: rate > 1 ? 300 : 500 });
    results.push({ rate, ...res });
  }
}
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await browser.close();
if (json) console.log(JSON.stringify({ ua, results }));
else {
  const f = (x) => x.toFixed(2).padStart(7);
  console.log(ua);
  console.log('\nCPU  celdas  | paint cover p50/p95 | compose p50/p95 | pozos p50/p95 | CUADRO DE MAREA p50 / p95 / máx | reposo p50 / p95 | horneado tesela + build×2 + póster');
  for (const r of results) {
    console.log(
      `×${r.rate}`.padEnd(4),
      String(r.cells).padStart(5),
      ' |',
      `${f(r.paintCover.p50)} ${f(r.paintCover.p95)} |`,
      `${f(r.compose.p50)} ${f(r.compose.p95)} |`,
      `${f(r.wells.p50)} ${f(r.wells.p95)} |`,
      `${f(r.total.p50)} ${f(r.total.p95)} ${f(r.total.max)} |`,
      `${f(r.idle.p50)} ${f(r.idle.p95)} |`,
      `${r.bakeTileMs.toFixed(1)} + ${r.buildMs.toFixed(1)} + ${r.posterMs.toFixed(1)} ms`,
    );
  }
}
