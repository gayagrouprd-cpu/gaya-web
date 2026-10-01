// Entorno común de las pruebas y herramientas de las escenas REALES (WP6–WP9): visores de referencia, rejilla de cada uno y
// palabras reales de WP3 por idioma. Las escenas de prueba de WP4 no usan esto (llevan sus propios especímenes).
import { getWords, loadWords, sceneWord } from '../../../src/ascii/words.ts';
import { specForViewport } from '../../../src/ascii/scenes/common.ts';

/** Visores de referencia: celda CSS de §5.2 y `dpr` del que se pinta la imagen de revisión. */
export const VIEWPORTS = {
  d1440: { name: '1440×900', w: 1440, h: 900, cssCw: 9, cssCh: 18, dpr: 2 },
  d1600: { name: '1600×900', w: 1600, h: 900, cssCw: 12, cssCh: 25, dpr: 1 },
  d1920: { name: '1920×1080', w: 1920, h: 1080, cssCw: 12, cssCh: 25, dpr: 1 },
  t1024: { name: '1024×768', w: 1024, h: 768, cssCw: 9, cssCh: 18, dpr: 2 },
  m360: { name: '360×800', w: 360, h: 800, cssCw: 6, cssCh: 12, dpr: 2 },
  m390: { name: '390×844', w: 390, h: 844, cssCw: 6, cssCh: 12, dpr: 2 },
  m320: { name: '320×568', w: 320, h: 568, cssCw: 6, cssCh: 12, dpr: 2 },
};

export const specOf = (vp) => specForViewport(vp.w, vp.h, vp.cssCw, vp.cssCh, vp.dpr);

let loaded = new Set();
export async function ensureWords(lang) {
  if (loaded.has(lang)) return;
  await loadWords(lang);
  loaded.add(lang);
}

/** Lo que el motor le pasa a `build`: la palabra del cartel en la variante que cabe (o `[]` si el cartel no lleva palabra). */
export function wordsFor(sceneId, lang, spec) {
  const id = sceneWord(sceneId, lang);
  return id ? [getWords(id, lang, spec.cols)] : [];
}
