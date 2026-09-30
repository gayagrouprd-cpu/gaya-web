// Micro-benchmark en Node (sin DOM): node tests/ascii/tools/bench.mjs [--json]
// Publica la mediana y el p95 por cuadro a 6 500 y 9 000 celdas y la estimación con CPU ×4 y ×6 (multiplicar el tiempo nativo).
import { runBench } from './bench-core.mjs';

const json = process.argv.includes('--json');
const all = [];
for (const cells of [6500, 9000]) {
  runBench(cells, { frames: 100, warm: 200 }); // calentamiento del JIT
  all.push(runBench(cells, { frames: 600, warm: 150 }));
}
if (json) console.log(JSON.stringify(all));
else {
  const f = (x) => x.toFixed(3).padStart(7);
  console.log(`Node ${process.version}  ${process.platform} ${process.arch}`);
  for (const r of all) {
    console.log(`\n${r.cells} celdas (${r.cols}×${r.rows})  ·  horneado: tesela ${r.bakeTileMs.toFixed(2)} ms, build ×2 ${r.buildMs.toFixed(2)} ms, póster SSR ${r.posterMs.toFixed(2)} ms`);
    console.log('                                   mediana   p95     máx   | ×4 mediana  ×4 p95 | ×6 mediana');
    for (const [k, label] of [['paintCover', 'paint cover (still, con calor/anillos a ratos)'], ['paintArrival', 'paint entrante (p variable)'], ['compose', 'composición de marea (con memoria)'], ['wells', 'pozos: buildCap + applyCap'], ['total', 'CUADRO DE MAREA (2 paint + compose + pozos)'], ['idle', 'cuadro en reposo (1 paint + pozos)']]) {
      const s = r[k];
      console.log(`  ${label.padEnd(44)} ${f(s.p50)} ${f(s.p95)} ${f(s.max)}   | ${f(s.p50 * 4)}  ${f(s.p95 * 4)}  | ${f(s.p50 * 6)}`);
    }
  }
}
