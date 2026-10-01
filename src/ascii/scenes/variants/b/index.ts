// Variante B · «El agua hecha del nombre»: entrada única del paquete. Copia autosuficiente de las escenas `cover` y `hola` (más su marea y su bruma de
// puntuación) con la rampa de densidad del nombre ` ·:=*yaAG▒▓█`. Implementa el contrato `Scene` de types.ts y se enchufa al motor SIN tocar nada
// compartido: en `scenes/index.ts` basta cambiar dos líneas del registro,
//
//   import { coverB as cover, createCoverB as createCover } from "./variants/b/index.ts";            // en lugar de "./cover.ts"
//   hola: () => import("./variants/b/hola.ts").then((m) => m.holaB),                                 // en lugar de "./hola.ts"
//
// y, para que la marea hable el mismo idioma (banda de letras en vez de tramas), el motor llama `composeB` donde llamaba `compose` (misma firma).
export { coverB, createCoverB } from "./cover.ts";
export type { CoverBOpts } from "./cover.ts";
export { holaB, createHolaB } from "./hola.ts";
export type { HolaBOpts } from "./hola.ts";
export { composeB } from "./tide.ts";
export { INK, K, NAME_RAMP, RAMP_GL } from "./ramp.ts";
