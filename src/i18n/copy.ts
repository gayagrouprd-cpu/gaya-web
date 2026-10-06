// Textos del sitio (ES por defecto, EN). Fuente ÚNICA del texto visible de la interfaz: los componentes no escriben texto.
// Sin frases instructivas: solo contenido, etiquetas de campo, insignias de estado y mensajes reales (R1).
// Contenido de docs/ascii/DIRECTION.md §8 y §9. Los servicios y los datos locales viven en src/data/services.ts y facts.ts.
//
// Las líneas que dependen de una capacidad o un compromiso que solo el dueño puede confirmar llevan `flag`
// (brand.json › confirmed, todas false en la v1 honesta). Se resuelven con aboutRows() y processSteps().
//
// Corre igual en Vite/Astro y directamente en Node 24 (solo sintaxis borrable, imports con extensión).
import type { Lang } from '../ascii/types.ts';
import brand from '../../brand.json' with { type: 'json' };

// ── Banderas de confirmación (brand.json › confirmed) ────────────────────────────────────────────────────────
export type ConfirmFlag = keyof typeof brand.confirmed;
export type ConfirmMap = Record<ConfirmFlag, boolean>;
export const CONFIRMED: ConfirmMap = brand.confirmed;
/** Sin bandera = v1 (siempre visible). Con bandera: visible solo si el dueño la confirmó. */
export const flagOn = (flag: ConfirmFlag | undefined, confirmed: ConfirmMap = CONFIRMED): boolean => flag === undefined || confirmed[flag] === true;

export interface AboutRow {
  id: string;
  label: string;
  value: string;
  flag?: ConfirmFlag;
}
export interface ProcessStep {
  id: 'talk' | 'proposal' | 'build' | 'deliver';
  label: string;
  /** Redacción mejorada del paso cuando el dueño confirma la bandera. */
  upgrade?: { flag: ConfirmFlag; label: string };
  /** Insignia de estado (p. ej. «24–48 h»): solo con su bandera. */
  badge?: { flag: ConfirmFlag; text: string };
}

const hours = `${brand.commitments.proposalHours} h`;
// El nombre del dueño no se publica (decisión del 6-oct-2026): la firma es la marca.
const director = `${brand.name} · Santo Domingo`;
const directorEn = `${brand.name} · Santo Domingo`;

// ── Español ──────────────────────────────────────────────────────────────────────────────────────────────────
const aboutRowsEs: AboutRow[] = [
  { id: 'brand', label: 'Marca', value: brand.name },
  { id: 'from', label: 'Desde', value: 'Santo Domingo, República Dominicana · trabajo remoto' },
  { id: 'languages', label: 'Idiomas', value: 'Español · English' },
  { id: 'channel', label: 'Canal', value: 'WhatsApp primero: ahí empieza todo' },
  { id: 'how', label: 'Trato', value: 'Directo, sin intermediarios' },
  { id: 'proposal', label: 'Propuesta', value: `Por escrito, en ${brand.commitments.proposalHours} horas`, flag: 'proposalHours' },
  { id: 'access', label: 'Accesos', value: 'Tus accesos y tus archivos son tuyos desde el día uno', flag: 'accessOwned' },
];
const processStepsEs: ProcessStep[] = [
  { id: 'talk', label: 'Hablamos por WhatsApp' },
  {
    id: 'proposal',
    label: 'Propuesta por escrito',
    upgrade: { flag: 'pricingModel', label: 'Propuesta por escrito con alcance y precio' },
    badge: { flag: 'proposalHours', text: hours },
  },
  { id: 'build', label: 'Construimos con avances' },
  { id: 'deliver', label: 'Entregamos y acompañamos' },
];

const h1Es = 'Tu negocio, imposible de ignorar';
const leadEs = 'Web, apps, marketing, soporte IT e IA. Desde Santo Domingo para el mundo.';

const es = {
  meta: {
    title: `${brand.name} · ${brand.tagline.es}`,
    description: brand.description.es,
  },
  nav: {
    label: 'Principal',
    about: 'Nosotros',
    services: 'Servicios',
    samples: 'Ejemplos',
    process: 'Proceso',
    contact: 'Contacto',
    menu: 'Menú',
    close: 'Cerrar',
    skip: 'Ir al contenido',
    whatsapp: 'Escríbenos por WhatsApp',
    language: 'Idioma',
    switchTo: { code: 'EN', label: 'English' },
  },
  home: {
    title: `${brand.name} · ${brand.tagline.es}`,
    h1: h1Es,
    /** Palabra del `h1` que lleva el color de acento. */
    accent: 'imposible',
    lead: leadEs,
    primary: 'Escríbenos por WhatsApp',
    secondary: 'Ver ejemplos',
  },
  about: {
    h2: 'Quiénes somos',
    phrase: `${brand.name}: tecnología para tu negocio, sin rodeos.`,
    rows: aboutRowsEs,
    signature: director,
    place: 'Santo Domingo',
    clock: (time: string) => `Santo Domingo · ${time}`,
  },
  services: {
    h2: 'Servicios',
    details: 'Ver detalle',
    whatsapp: 'WhatsApp',
    whatsappFor: (name: string) => `Escríbenos por WhatsApp sobre ${name}`,
    detailsFor: (name: string) => `Ver detalle: ${name}`,
    more: 'Más detalles',
    fields: { includes: 'Incluye', audience: 'Para quién', needs: 'Necesitamos', result: 'Resultado' },
    source: (name: string) => `Fuente: ${name}`,
  },
  samples: {
    h2: 'Ejemplos',
    stamp: 'Datos ficticios',
    view: 'Ver ejemplo',
    want: 'Quiero una así',
    viewFor: (name: string) => `Ver ejemplo: ${name}`,
    wantFor: (name: string) => `Quiero una así: ${name}`,
    all: (n: number) => (n === 1 ? 'Ver el ejemplo' : `Ver los ${n} ejemplos`),
  },
  process: {
    h2: 'Proceso',
    steps: processStepsEs,
  },
  contact: {
    h2: 'Hablemos',
    primary: 'Escríbenos por WhatsApp',
    email: 'Correo',
    phone: 'Teléfono',
    copy: 'Copiar',
    copied: 'Copiado',
    social: { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', x: 'X', facebook: 'Facebook' },
    signature: director,
  },
  footer: {
    rights: 'Santo Domingo, República Dominicana',
    line: (time: string) => `Santo Domingo, República Dominicana · ${time}`,
  },
  gallery: {
    title: 'Ejemplos',
    metaTitle: 'Ejemplos · webs por rubro',
    metaDescription: 'Webs de ejemplo por rubro: presencia, reservas y pedidos, catálogo, tienda y apps. Datos ficticios.',
    all: 'Todas',
    filter: 'Tipo de web',
    count: (n: number) => `${n} ${n === 1 ? 'ejemplo' : 'ejemplos'}`,
    fav: (name: string) => `Guardar ${name} en favoritas`,
    unfav: (name: string) => `Quitar ${name} de favoritas`,
    favorites: 'Favoritas',
    sendFavs: 'Enviar favoritas',
  },
  viewer: {
    back: 'Volver a ejemplos',
    device: 'Tamaño de pantalla',
    desktop: 'Escritorio',
    tablet: 'Tablet',
    phone: 'Celular',
    open: 'Abrir en pestaña nueva',
    copy: 'Copiar enlace',
    copied: 'Enlace copiado',
    prev: 'Ejemplo anterior',
    next: 'Ejemplo siguiente',
    cta: 'Quiero una así',
    email: 'Escribir por correo',
    preview: (name: string) => `Vista previa de ${name}`,
  },
};

export type Copy = typeof es;

// ── English ──────────────────────────────────────────────────────────────────────────────────────────────────
const aboutRowsEn: AboutRow[] = [
  { id: 'brand', label: 'Brand', value: brand.name },
  { id: 'from', label: 'Based in', value: 'Santo Domingo, Dominican Republic · remote work' },
  { id: 'languages', label: 'Languages', value: 'Español · English' },
  { id: 'channel', label: 'Channel', value: 'WhatsApp first: that is where every project starts' },
  { id: 'how', label: 'How we work', value: 'Direct, no middlemen' },
  { id: 'proposal', label: 'Proposal', value: `In writing, within ${brand.commitments.proposalHours} hours`, flag: 'proposalHours' },
  { id: 'access', label: 'Access', value: 'Your logins and files are yours from day one', flag: 'accessOwned' },
];
const processStepsEn: ProcessStep[] = [
  { id: 'talk', label: 'We talk on WhatsApp' },
  {
    id: 'proposal',
    label: 'Written proposal',
    upgrade: { flag: 'pricingModel', label: 'Written proposal with scope and price' },
    badge: { flag: 'proposalHours', text: hours },
  },
  { id: 'build', label: 'We build, with progress updates' },
  { id: 'deliver', label: 'We deliver and stay by your side' },
];

const h1En = 'Your business, impossible to ignore';
const leadEn = 'Web, apps, marketing, IT support and AI. From Santo Domingo to the world.';

const en: Copy = {
  meta: {
    title: `${brand.name} · ${brand.tagline.en}`,
    description: brand.description.en,
  },
  nav: {
    label: 'Main',
    about: 'About',
    services: 'Services',
    samples: 'Samples',
    process: 'Process',
    contact: 'Contact',
    menu: 'Menu',
    close: 'Close',
    skip: 'Skip to content',
    whatsapp: 'Message us on WhatsApp',
    language: 'Language',
    switchTo: { code: 'ES', label: 'Español' },
  },
  home: {
    title: `${brand.name} · ${brand.tagline.en}`,
    h1: h1En,
    accent: 'impossible',
    lead: leadEn,
    primary: 'Message us on WhatsApp',
    secondary: 'See samples',
  },
  about: {
    h2: 'Who we are',
    phrase: `${brand.name}: tech for your business, straight to the point.`,
    rows: aboutRowsEn,
    signature: directorEn,
    place: 'Santo Domingo',
    clock: (time: string) => `Santo Domingo · ${time}`,
  },
  services: {
    h2: 'Services',
    details: 'See details',
    whatsapp: 'WhatsApp',
    whatsappFor: (name: string) => `Message us on WhatsApp about ${name}`,
    detailsFor: (name: string) => `See details: ${name}`,
    more: 'More details',
    fields: { includes: 'Includes', audience: 'For whom', needs: 'We need', result: 'Outcome' },
    source: (name: string) => `Source: ${name}`,
  },
  samples: {
    h2: 'Samples',
    stamp: 'Fictional data',
    view: 'View sample',
    want: 'I want one like this',
    viewFor: (name: string) => `View sample: ${name}`,
    wantFor: (name: string) => `I want one like this: ${name}`,
    all: (n: number) => (n === 1 ? 'See the sample' : `See all ${n} samples`),
  },
  process: {
    h2: 'Process',
    steps: processStepsEn,
  },
  contact: {
    h2: "Let's talk",
    primary: 'Message us on WhatsApp',
    email: 'Email',
    phone: 'Phone',
    copy: 'Copy',
    copied: 'Copied',
    social: { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', x: 'X', facebook: 'Facebook' },
    signature: directorEn,
  },
  footer: {
    rights: 'Santo Domingo, Dominican Republic',
    line: (time: string) => `Santo Domingo, Dominican Republic · ${time}`,
  },
  gallery: {
    title: 'Samples',
    metaTitle: 'Samples · websites by industry',
    metaDescription: 'Sample websites by industry: presence, bookings and orders, catalog, store and apps. Fictional data.',
    all: 'All',
    filter: 'Website type',
    count: (n: number) => `${n} ${n === 1 ? 'sample' : 'samples'}`,
    fav: (name: string) => `Save ${name} to favorites`,
    unfav: (name: string) => `Remove ${name} from favorites`,
    favorites: 'Favorites',
    sendFavs: 'Send favorites',
  },
  viewer: {
    back: 'Back to samples',
    device: 'Screen size',
    desktop: 'Desktop',
    tablet: 'Tablet',
    phone: 'Phone',
    open: 'Open in new tab',
    copy: 'Copy link',
    copied: 'Link copied',
    prev: 'Previous sample',
    next: 'Next sample',
    cta: 'I want one like this',
    email: 'Write by email',
    preview: (name: string) => `Preview of ${name}`,
  },
};

export const copy: Record<Lang, Copy> = { es, en };

export const t = (lang: Lang): Copy => copy[lang];

// ── Resolución de lo que depende de banderas ─────────────────────────────────────────────────────────────────
/** Filas de la placa «Quiénes somos» que se publican hoy (las v2 aparecen solas al confirmar su bandera). */
export function aboutRows(lang: Lang, confirmed: ConfirmMap = CONFIRMED): Array<{ id: string; label: string; value: string }> {
  return copy[lang].about.rows.filter((r) => flagOn(r.flag, confirmed)).map(({ id, label, value }) => ({ id, label, value }));
}

/** Pasos del Proceso ya resueltos: texto (mejorado si su bandera está activa) e insignia o `null`. */
export function processSteps(lang: Lang, confirmed: ConfirmMap = CONFIRMED): Array<{ id: ProcessStep['id']; label: string; badge: string | null }> {
  return copy[lang].process.steps.map((s) => ({
    id: s.id,
    label: s.upgrade && flagOn(s.upgrade.flag, confirmed) ? s.upgrade.label : s.label,
    badge: s.badge && flagOn(s.badge.flag, confirmed) ? s.badge.text : null,
  }));
}

// ── Hora de Santo Domingo ────────────────────────────────────────────────────────────────────────────────────
/** «21:40» en hora de Santo Domingo (UTC−4 todo el año). Sin API. `h23` evita el «24:05» que da hour12:false en en-US. */
export function formatSdTime(lang: Lang, now: Date | number = new Date()): string {
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-DO' : 'en-US', {
    timeZone: brand.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
}
