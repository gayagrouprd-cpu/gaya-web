// Palabras reales de WP3 para los scripts que pintan escenas en Node (ascii-stills, ascii-perf…): carga una vez por idioma y devuelve lo que el
// motor le pasa a `build` (la palabra del cartel en la variante que cabe, o `[]` si el cartel no lleva palabra). Mismo criterio que
// tests/ascii/fixtures/scene-env.mjs › wordsFor, para que los hashes coincidan con los de golden.json.
import { getWords, loadWords, sceneWord } from '../../src/ascii/words.ts';

const loaded = new Set();

/** Carga las palabras de `lang` (una vez). Con `sceneId` y `spec`, devuelve además las palabras de ese cartel para esa rejilla. */
export async function ensureWordsFor(lang, sceneId = null, spec = null) {
  if (!loaded.has(lang)) {
    await loadWords(lang);
    loaded.add(lang);
  }
  if (!sceneId || !spec) return undefined;
  const id = sceneWord(sceneId, lang);
  return id ? [getWords(id, lang, spec.cols)] : [];
}
