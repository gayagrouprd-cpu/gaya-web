// Arranque del lienzo ASCII (DIRECTION §6.2). Tras `load` y un momento de inactividad, sin bloquear el LCP (que es el `h1`).
//   · El motor es UN solo módulo dinámico (él importa en estático el kit, las palabras y la escena `cover`): el empaquetador lo deja en
//     un único trozo de primera carga. En `DOMContentLoaded` solo se DESCARGA (y se precargan las palabras del primer cartel); al
//     llegar la inactividad el arranque no espera a la red.
//   · El arte es decoración: si algo falla, el motor deja `html[data-field="ssr"]` y la página sigue siendo texto (más el póster).
import type { Field, WellRect } from '../ascii/engine.ts';
import type { Lang, SceneId } from '../ascii/types.ts';

const SCENE_IDS: readonly string[] = ['cover', 'hola', 'mist', 'web', 'listo', 'eco', 'on', 'ver', 'tu'];
let field: Field | null = null;

const posters = (): { id: SceneId; el: HTMLElement }[] =>
  Array.from(document.querySelectorAll<HTMLElement>('main [data-poster]'))
    .filter((el) => SCENE_IDS.includes(el.dataset.poster ?? ''))
    .map((el) => ({ id: el.dataset.poster as SceneId, el }));

/** Rectángulos (px de documento) de los bloques de texto corto sobre arte; se miden al (re)medir, nunca en el bucle. */
const wells = (): WellRect[] => {
  const out: WellRect[] = [];
  for (const el of document.querySelectorAll<HTMLElement>('[data-well]')) {
    const b = el.getBoundingClientRect();
    if (b.width > 0 && b.height > 0) out.push({ x: b.left + window.scrollX, y: b.top + window.scrollY, w: b.width, h: b.height, kind: el.dataset.well === 'muted' ? 'muted' : 'ink' });
  }
  return out;
};

const lang = (): Lang => (document.documentElement.lang.startsWith('en') ? 'en' : 'es');

function preload(): void {
  const first = posters()[0]?.id;
  void import('../ascii/engine.ts').then((m) => first && m.warmup(lang(), first)).catch(() => {});
}

async function boot(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas.field');
  if (!canvas) return;
  try {
    const { mountField } = await import('../ascii/engine.ts');
    field = await mountField({ canvas, lang: lang(), posters: posters(), wells, params: new URLSearchParams(location.search) });
  } catch {
    field = null;
  }
  if (!field) document.documentElement.dataset.field = 'ssr';
  // solo desarrollo: las pruebas de navegador necesitan `dispose()`/`poke()`
  if (import.meta.env.DEV) (window as unknown as { __fieldApi?: Field | null }).__fieldApi = field;
}

if (typeof document !== 'undefined') {
  const start = (): void => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => void boot(), { timeout: 1200 });
    else setTimeout(() => void boot(), 200);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', preload, { once: true });
  else preload();
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
  // recarga en caliente (solo desarrollo): no dejar un motor vivo detrás
  import.meta.hot?.dispose(() => field?.dispose());
}
