// Emblemas de sector: 14 letreros de 11×5 celdas, uno por rubro de la galería (DIRECTION §5.10, §7.7).
// BORRADOR partido del de concepts/mundo.md A.4 y redibujado solo con glifos de src/ascii/glyphs.ts
// (ALLOWED_ART_CHARS), sin los que caen a otra fuente. Necesitan pulido de diseñador (decisión del dueño #10):
// se sustituyen editando este archivo, sin tocar nada más.
//
// Arte decorativo: se pinta como `span.art[aria-hidden][translate="no"][data-art]` dentro de la fila del ejemplo y nunca
// lleva información que no esté también en texto. La clave es el `icon` de cada ejemplo en src/data/references.json.
//
// Corre igual en Vite/Astro y directamente en Node 24.

export const EMBLEM_COLS = 11;
export const EMBLEM_ROWS = 5;

export type EmblemKey =
  | 'utensils'
  | 'hard-hat'
  | 'app-window'
  | 'smile'
  | 'scissors'
  | 'sailboat'
  | 'scale'
  | 'library'
  | 'shopping-bag'
  | 'leaf'
  | 'coffee'
  | 'dumbbell'
  | 'camera'
  | 'building-2';

type Emblem = readonly [string, string, string, string, string];

export const EMBLEMS: Record<EmblemKey, Emblem> = {
  // restaurante: tenedor y cuchillo
  utensils: [
    ' │ │ │  ▗█▖',
    ' └─┼─┘  ██▌',
    '   │    ██▌',
    '   │    ██▌',
    '   │    ▝▀▘',
  ],
  // constructora: casco
  'hard-hat': [
    '   ▄▄█▄▄   ',
    '  ▟█████▙  ',
    ' ▟███████▙ ',
    '███████████',
    ' ▀▀▀▀▀▀▀▀▀ ',
  ],
  // app / SaaS: ventana con barra de título
  'app-window': [
    '╭─────────╮',
    '│ o o o   │',
    '├─────────┤',
    '│ ███ ▄▄▄ │',
    '╰─────────╯',
  ],
  // clínica dental: muela
  smile: [
    '  ▄██▄██▄  ',
    ' ▟████████▙',
    ' █████████ ',
    '  ███ ███  ',
    '  ▝█▘ ▝█▘  ',
  ],
  // barbería: tijeras
  scissors: [
    '  ╲     ╱  ',
    '   ╲   ╱   ',
    '     X     ',
    '   ╱   ╲   ',
    ' (o)   (o) ',
  ],
  // turismo y excursiones: velero
  sailboat: [
    '    █▖     ',
    '    ██▖    ',
    '    ███▖   ',
    ' ▀▀▀▀▀▀▀▀▀ ',
    '~ ~ ~ ~ ~ ~',
  ],
  // abogados: balanza
  scale: [
    '     ┬     ',
    '  ───┼───  ',
    '  ╱╲ │ ╱╲  ',
    '  ╰╯ │ ╰╯  ',
    '    ─┴─    ',
  ],
  // biblioteca: edificio con columnas
  library: [
    '   ▄▟█▙▄   ',
    ' ▟███████▙ ',
    ' █ █ █ █ █ ',
    ' █ █ █ █ █ ',
    '███████████',
  ],
  // tienda online: bolsa
  'shopping-bag': [
    '   ╭───╮   ',
    '  ▟█████▙  ',
    ' ▟███████▙ ',
    ' █████████ ',
    ' ▀▀▀▀▀▀▀▀▀ ',
  ],
  // masajes y terapias: hoja
  leaf: [
    '     ▗▄▄▟▙ ',
    '   ▗▟████▛ ',
    '  ▟████▛▘  ',
    ' ▟███▛▘    ',
    ' ▀▀▘       ',
  ],
  // café y panadería: taza con vapor
  coffee: [
    '   ) ) )   ',
    '  ██████╮  ',
    '  ██████│  ',
    '  ▜████▛╯  ',
    ' ▀▀▀▀▀▀▀▀▀ ',
  ],
  // gimnasio: mancuerna
  dumbbell: [
    ' ▗▄▖   ▗▄▖ ',
    '▐███▄▄▄███▌',
    '▐███▀▀▀███▌',
    ' ▝▀▘   ▝▀▘ ',
    '           ',
  ],
  // eventos y fotografía: cámara
  camera: [
    '   ╭───╮   ',
    ' ▄▄█████▄▄ ',
    ' █ ╭───╮ █ ',
    ' █ ╰───╯ █ ',
    ' ▀▀▀▀▀▀▀▀▀ ',
  ],
  // inmobiliaria: dos edificios
  'building-2': [
    ' ▄▄▄▄▄     ',
    ' █▀█▀█     ',
    ' █▄█▄█▄▄▄▄▄',
    ' █▀█▀█▀█▀█▀',
    ' ▀▀▀▀▀▀▀▀▀▀',
  ],
};

export const EMBLEM_KEYS = Object.keys(EMBLEMS) as EmblemKey[];

/** El emblema de un ejemplo por su `icon` de references.json, o `null` si ese rubro aún no tiene. */
export function emblemFor(icon: string): Emblem | null {
  return (EMBLEMS as Record<string, Emblem>)[icon] ?? null;
}

/** Las cinco filas unidas con saltos de línea: el valor de `data-art`. */
export function emblemArt(icon: string): string {
  return (emblemFor(icon) ?? []).join('\n');
}
