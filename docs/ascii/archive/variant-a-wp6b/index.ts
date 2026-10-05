// Registro de la Variante A · Duotono ANSI. Dos formas de enchufarla al motor, sin tocar nada compartido:
//   1. el motor ya acepta un registro propio: `mountField({ …, loadScene: loadSceneA })` (cover y hola de la variante; el resto, del registro compartido);
//   2. o, en src/ascii/scenes/index.ts, dos líneas:  `import { coverA as cover, createCoverA as createCover } from "./variants/a/index.ts"`  en vez de ./cover.ts
//      y  `hola: () => import("./variants/a/hola.ts").then((m) => m.holaA)`.
// Opcional: la marea de caracteres (`composeA`, tide-a.ts: misma firma que `compose`) y el póster SSR con `bg` (`renderPosterLayersA`, poster-a.ts).
// `mist` (Índice y Proceso) no cambia de contrato: la bruma de la variante vive en kit-a.ts (`mistA`) y `mist.ts` puede usarla igual.
import type { Scene, SceneId } from "../../../types.ts";
import { coverA, createCoverA } from "./cover.ts";
import { loadScene as sharedLoadScene } from "../../index.ts";

export { coverA, createCoverA };
export { composeA } from "./tide-a.ts";
export { posterCollapse, renderPosterLayersA } from "./poster-a.ts";
export type { CoverAOpts } from "./cover.ts";

type Loader = () => Promise<Scene>;
/** Escenas de la variante, con la misma forma que `LOADERS` de scenes/index.ts. */
export const LOADERS_A: Partial<Record<SceneId, Loader>> = {
  cover: () => Promise.resolve(coverA),
  hola: () => import("./hola.ts").then((m) => m.holaA),
};

/** Registro inyectable en el motor (`mountField({ …, loadScene: loadSceneA })`, FieldOptions.loadScene de engine.ts): cover y hola de la variante; el resto de escenas, del registro compartido. */
export async function loadSceneA(id: SceneId): Promise<Scene> {
  const l = LOADERS_A[id];
  return l ? l() : sharedLoadScene(id);
}
