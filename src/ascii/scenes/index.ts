// Registro de escenas (DIRECTION §6.14). `cover`, `hola` y `mist` son el estilo oficial Duotono (docs/ascii/KIT.md); WP7–WP9 añaden las suyas con UNA línea en
// `LOADERS` (su id ya está en `SceneId`) y su prueba con tests/ascii/fixtures/scene-template.test.mjs. `cover` se importa en estático (es la escena de la primera
// carga y la del póster SSR); el resto, bajo demanda con `loadScene(id)` (JS diferido, §11.1: `import()` al faltar ≤ 1,5 pantallas).
//
// Uso del motor: `const scene = getScene(id) ?? (await loadScene(id))`; las palabras de la escena salen de
// `getWords(sceneWord(id, lang), lang, spec.cols)` (words.ts) y se pasan a `scene.build(spec, lang, [set])`; `mist` no lleva palabra (`[]`).
// Exploración de la portada: `createCover({ level })` (?level=).
import type { Scene, SceneId } from "../types.ts";
import { cover, createCover } from "./cover.ts";

export { cover, createCover };
export type { CoverOpts } from "./cover.ts";

type Loader = () => Promise<Scene>;
const LOADERS: Partial<Record<SceneId, Loader>> = {
  cover: () => Promise.resolve(cover),
  hola: () => import("./hola.ts").then((m) => m.hola),
  mist: () => import("./mist.ts").then((m) => m.mistScene),
};

const LOADED = new Map<SceneId, Scene>([["cover", cover]]);

/** Ids de escena que ya tienen implementación registrada. */
export const REGISTERED: readonly SceneId[] = Object.keys(LOADERS) as SceneId[];
export const hasScene = (id: SceneId): boolean => LOADERS[id] !== undefined;

/** Escena ya cargada (síncrona) o `undefined`; `cover` siempre está. */
export const getScene = (id: SceneId): Scene | undefined => LOADED.get(id);

/** Carga (una vez) la escena `id`; lanza si ese paquete aún no la ha entregado. */
export async function loadScene(id: SceneId): Promise<Scene> {
  const hit = LOADED.get(id);
  if (hit) return hit;
  const load = LOADERS[id];
  if (!load) throw new Error(`scenes: la escena «${id}» aún no está registrada`);
  const s = await load();
  LOADED.set(id, s);
  return s;
}
