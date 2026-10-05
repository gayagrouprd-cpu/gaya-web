// Peso gzip (-9) del póster SSR de la portada por variante e idioma, con la escena oficial y `renderPosterLayersDuo`, frente al presupuesto (≈ 3 KB gz en wide).
//   node tests/ascii/tools/poster-size.mjs
import { gzipSync } from 'node:zlib';
import { loadWords, getWords } from '../../../src/ascii/words.ts';
import { cover } from '../../../src/ascii/scenes/index.ts';
import { renderPosterLayersDuo } from '../../../src/ascii/ssr.ts';
import { POSTER_VARIANTS, escapeAttr, posterSpec } from '../../../src/ascii/dom-art.ts';

await loadWords('es');
await loadWords('en');
for (const lang of ['es', 'en']) {
  let all = '';
  const parts = [];
  for (const v of POSTER_VARIANTS) {
    const L = renderPosterLayersDuo(cover, posterSpec(v), lang, [getWords('GAYA', lang, v.cols, v.rows)]);
    let html = '';
    for (const [name, s] of Object.entries(L)) html += `<span class="art poster-ssr__l poster-ssr__l--${name}" aria-hidden="true" translate="no" data-art="${escapeAttr(s)}"></span>`;
    all += html;
    parts.push(`${v.key} ${gzipSync(Buffer.from(html), { level: 9 }).length} B`);
  }
  console.log(`${lang}: ${parts.join(' · ')} · total ${gzipSync(Buffer.from(all), { level: 9 }).length} B gz`);
}
