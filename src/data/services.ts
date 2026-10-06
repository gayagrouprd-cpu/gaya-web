// Los cuatro servicios en español e inglés (docs/ascii/DIRECTION.md §8.1, §8.4, §8.5; fuentes en research/04).
// Fuente ÚNICA del contenido de las fichas: los componentes solo lo pintan.
//
// v1 honesta: lo que se publica hoy. v2: líneas detrás de una bandera de brand.json › confirmed (todas false);
// aparecen solas al pasarla a true. Una línea v2 puede SUSTITUIR una v1 (`replaces`): así «Incluye» se queda entre 4 y 7
// líneas en cualquier combinación de banderas (lo comprueba scripts/lint-content.mjs).
// Nada de cifras propias, superlativos, plurales sin sustento, promesas, precios, plazos ni SLA (§8.13).
//
// Corre igual en Vite/Astro y directamente en Node 24 (solo sintaxis borrable, imports con extensión).
import type { Lang, SceneId, WordId } from '../ascii/types.ts';
import { CONFIRMED, flagOn, type ConfirmFlag, type ConfirmMap } from '../i18n/copy.ts';
import { getFact, type Fact, type FactId } from './facts.ts';

export type { ConfirmFlag, ConfirmMap } from '../i18n/copy.ts';
export type L<T> = Record<Lang, T>;
export type ServiceId = 'web' | 'automation' | 'marketing' | 'it';
export type SectionKey = 'home' | 'about' | 'services' | ServiceId | 'samples' | 'process' | 'contact';

/** Una línea de «Incluye». Sin `flag` es v1 (siempre). Con `flag` es v2: solo si el dueño la confirmó. */
export interface IncludeLine {
  id: string;
  text: L<string>;
  flag?: ConfirmFlag;
  /** Id de la línea v1 que esta sustituye cuando su bandera está activa (ocupa su mismo lugar). */
  replaces?: string;
}

/** Algo que depende del dueño: qué hay que confirmarle y con qué bandera se activa. Interno, no se publica. */
export interface ConfirmItem {
  flag: ConfirmFlag;
  ask: string;
}

export interface Service {
  id: ServiceId;
  order: 1 | 2 | 3 | 4;
  /** Escena del cartel (lienzo) de esta ficha. */
  scene: Extract<SceneId, 'web' | 'listo' | 'eco' | 'on'>;
  /** Palabra del cartel, por idioma. La palabra es imagen; el `h3` con el nombre real es el texto. */
  word: L<WordId>;
  /** `id` de la sección en la página, localizado (ancla). */
  section: L<string>;
  /** Nombre del servicio: el del catálogo de WhatsApp Business. Es también la etiqueta de medición. */
  name: L<string>;
  promise: L<string>;
  /** Descripción para buscadores y JSON-LD (puede llevar «Santo Domingo»; nunca los titulares). */
  seo: L<string>;
  includes: IncludeLine[];
  audience: L<string>;
  needs: L<string>;
  result: L<string>;
  /** Dato local de la ficha (src/data/facts.ts). Puede haber caducado: quien lo pinta admite `null`. */
  fact: FactId;
  /** Etiqueta con la que el dueño marca el chat en WhatsApp Business (medición sin analítica). */
  waTag: string;
  /** Lo que depende del dueño para esta ficha. */
  confirm: ConfirmItem[];
}

export const SERVICES: readonly Service[] = [
  // ── Desarrollo web y apps ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'web',
    order: 1,
    scene: 'web',
    word: { es: 'WEB', en: 'WEB' },
    section: { es: 'web', en: 'web' },
    name: { es: 'Desarrollo web y apps', en: 'Web and app development' },
    promise: { es: 'Tu web, rápida y lista para vender por WhatsApp.', en: 'Your website: fast, and built to sell on WhatsApp.' },
    seo: {
      es: 'Diseño y desarrollo de sitios web y apps para negocios en Santo Domingo y el mundo, en español e inglés, con botón de WhatsApp.',
      en: 'Design and development of websites and apps for businesses in Santo Domingo and worldwide, in Spanish and English, with a WhatsApp button.',
    },
    includes: [
      { id: 'design', text: { es: 'Diseño propio, pensado primero para el celular', en: 'Original design, mobile first' } },
      {
        id: 'design-apps',
        flag: 'nativeApps',
        replaces: 'design',
        text: {
          es: 'Diseño propio y app web instalable o a medida, pensados primero para el celular',
          en: 'Original design and an installable or custom app, mobile first',
        },
      },
      { id: 'languages', text: { es: 'Sitio en español, en inglés o en ambos', en: 'Site in Spanish, English or both' } },
      { id: 'whatsapp', text: { es: 'Botón de WhatsApp con el mensaje ya escrito', en: 'WhatsApp button with the message pre-written' } },
      { id: 'domain', text: { es: 'Dominio y correo del negocio configurados', en: 'Business domain and email set up' } },
      {
        id: 'domain-owned',
        flag: 'accessOwned',
        replaces: 'domain',
        text: {
          es: 'Dominio y correo configurados; accesos y archivos tuyos desde el día uno',
          en: 'Domain and email set up; logins and files yours from day one',
        },
      },
      { id: 'tests', text: { es: 'Pruebas de velocidad y accesibilidad', en: 'Speed and accessibility testing' } },
      { id: 'launch', text: { es: 'Publicación segura con HTTPS', en: 'Secure launch on HTTPS' } },
      {
        id: 'launch-cms',
        flag: 'cms',
        replaces: 'launch',
        text: {
          es: 'Publicación segura con HTTPS y panel para editar tu contenido',
          en: 'Secure HTTPS launch and a panel to edit your content',
        },
      },
      {
        id: 'store',
        flag: 'store',
        text: { es: 'Tienda en línea con pago por tarjeta o enlace', en: 'Online store with card or link payments' },
      },
    ],
    audience: {
      es: 'Negocios con o sin local, marcas personales y profesionales que hoy dependen solo de Instagram o WhatsApp.',
      en: 'Businesses with or without a storefront, personal brands and professionals who today rely only on Instagram or WhatsApp.',
    },
    needs: {
      es: 'Logo y colores (o los definimos juntos), textos e imágenes reales, acceso al dominio y una persona que decida por el negocio.',
      en: 'Logo and colors (or we define them together), real copy and images, domain access, and one person who decides for the business.',
    },
    result: {
      es: 'Una URL en vivo, medida en velocidad y accesibilidad, con un botón que abre WhatsApp con el mensaje escrito.',
      en: 'A live URL, measured for speed and accessibility, with a button that opens WhatsApp with the message written.',
    },
    fact: 'F13',
    waTag: 'web',
    confirm: [
      { flag: 'store', ask: 'Tienda en línea con pasarela real (enlace de pago, AZUL o CardNET) de punta a punta' },
      { flag: 'nativeApps', ask: 'App web instalable o app a medida (móvil)' },
      { flag: 'cms', ask: 'Panel para que el cliente edite su propio contenido' },
      { flag: 'accessOwned', ask: 'Dominio, cuentas y archivos a nombre del cliente desde el primer día' },
    ],
  },

  // ── Automatización e IA ────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'automation',
    order: 2,
    scene: 'listo',
    word: { es: 'LISTO', en: 'READY' },
    section: { es: 'automatizacion', en: 'automation' },
    name: { es: 'Automatización e IA', en: 'Automation and AI' },
    promise: { es: 'Que WhatsApp responda, agende y avise por ti.', en: 'Let WhatsApp answer, book and notify for you.' },
    seo: {
      es: 'Automatización de WhatsApp para negocios: respuestas, citas y pedidos, con traspaso a una persona, desde Santo Domingo.',
      en: 'WhatsApp automation for businesses: replies, bookings and orders, with handoff to a person, from Santo Domingo.',
    },
    includes: [
      { id: 'map', text: { es: 'Mapa de tareas repetidas: qué sí y qué no', en: 'Map of repeated tasks: what to automate and what not' } },
      { id: 'replies', text: { es: 'Respuestas y menú automáticos en WhatsApp', en: 'Automatic WhatsApp replies and menu' } },
      {
        id: 'pilot',
        text: {
          es: 'Un piloto con un caso tuyo: citas, pedidos o preguntas frecuentes',
          en: 'A pilot with one of your cases: bookings, orders or FAQs',
        },
      },
      { id: 'handoff', text: { es: 'Traspaso a una persona en cualquier momento', en: 'Handoff to a person at any moment' } },
      { id: 'tuning', text: { es: 'Ajustes durante el primer mes', en: 'Adjustments during the first month' } },
      {
        id: 'connections',
        flag: 'whatsappApi',
        text: { es: 'Conexión con hojas de cálculo, correo y calendario', en: 'Links to spreadsheets, email and calendar' },
      },
      {
        id: 'assistant',
        flag: 'aiAgent',
        text: { es: 'Asistente de IA con las reglas y los datos de tu negocio', en: 'AI assistant with your business rules and data' },
      },
    ],
    audience: {
      es: 'Negocios que reciben los mismos mensajes todos los días: precios, horarios, citas y pedidos.',
      en: 'Businesses that get the same messages every day: prices, hours, bookings and orders.',
    },
    needs: {
      es: 'Las 10 preguntas que más te hacen, horarios y precios, acceso a tu WhatsApp Business y a tus herramientas, y quién atiende cuando el bot pasa la conversación.',
      en: 'The 10 questions you get most, hours and prices, access to your WhatsApp Business and tools, and who answers when the bot hands over.',
    },
    result: {
      es: 'Un primer flujo probado con un caso real tuyo: el cliente escribe, recibe respuesta o agenda, y tú ves cada conversación. Si el bot no sabe, te la pasa.',
      en: 'A first flow tested with one of your real cases: the customer writes, gets an answer or books, and you see every conversation. If the bot does not know, it hands over.',
    },
    fact: 'F19',
    waTag: 'automatización',
    confirm: [
      { flag: 'whatsappApi', ask: 'API de WhatsApp en producción y conexión con hojas de cálculo, correo y calendario' },
      { flag: 'aiAgent', ask: 'Asistente de IA con reglas y datos del cliente (solo bots con función de negocio)' },
    ],
  },

  // ── Marketing digital y redes ──────────────────────────────────────────────────────────────────────────────
  {
    id: 'marketing',
    order: 3,
    scene: 'eco',
    word: { es: 'ECO', en: 'ECHO' },
    section: { es: 'marketing', en: 'marketing' },
    name: { es: 'Marketing digital y redes', en: 'Digital marketing and social media' },
    promise: { es: 'Que te encuentren, te escriban y te compren.', en: 'Get found, get messaged, get paid.' },
    seo: {
      es: 'Marketing digital y manejo de redes para negocios en Santo Domingo: perfiles ordenados, calendario de contenido y reporte mensual.',
      en: 'Digital marketing and social media management for businesses in Santo Domingo: tidy profiles, content calendar and monthly report.',
    },
    includes: [
      { id: 'review', text: { es: 'Revisión de tus perfiles y de tu competencia', en: 'Review of your profiles and competitors' } },
      { id: 'profiles', text: { es: 'Perfiles ordenados: bio, enlaces y WhatsApp', en: 'Tidy profiles: bio, links and WhatsApp' } },
      {
        id: 'profiles-google',
        flag: 'googleProfile',
        replaces: 'profiles',
        text: { es: 'Perfiles ordenados y perfil de Google, si tu negocio califica', en: 'Tidy profiles, and a Google profile if your business qualifies' },
      },
      { id: 'calendar', text: { es: 'Calendario mensual de contenido, aprobado por ti', en: 'Monthly content calendar, approved by you' } },
      { id: 'design', text: { es: 'Diseño de piezas para publicaciones e historias', en: 'Design of posts and stories' } },
      {
        id: 'design-video',
        flag: 'video',
        replaces: 'design',
        text: { es: 'Diseño de piezas para publicaciones e historias, y edición de Reels', en: 'Design of posts and stories, and Reels editing' },
      },
      { id: 'report', text: { es: 'Reporte mensual: qué pasó y qué sigue', en: 'Monthly report: what happened, what is next' } },
      { id: 'ads', flag: 'ads', text: { es: 'Anuncios que llevan a tu WhatsApp', en: 'Ads that lead to your WhatsApp' } },
      { id: 'monthly', flag: 'pricingModel', text: { es: 'Plan mensual, sin permanencia', en: 'Monthly plan, no lock-in' } },
    ],
    audience: {
      es: 'Negocios que ya venden pero casi no se ven, o que publican sin un plan.',
      en: 'Businesses that already sell but are barely seen, or that post without a plan.',
    },
    needs: {
      es: 'Acceso de administrador a tus perfiles, fotos y videos reales y una persona que apruebe el contenido.',
      en: 'Admin access to your profiles, real photos and videos, and one person who approves content.',
    },
    result: {
      es: 'Un calendario aprobado antes de publicar, perfiles ordenados y un reporte mensual con lo que miden las plataformas.',
      en: 'A calendar approved before anything goes live, tidy profiles, and a monthly report with what the platforms measure.',
    },
    fact: 'F15',
    waTag: 'marketing',
    confirm: [
      { flag: 'ads', ask: 'Campañas de anuncios (Meta y Google) hacia WhatsApp; el presupuesto lo paga el cliente' },
      { flag: 'video', ask: 'Edición de Reels y video' },
      { flag: 'googleProfile', ask: 'Perfil de Google solo si el negocio califica (contacto en persona); nunca una dirección falsa' },
      { flag: 'pricingModel', ask: 'Plan mensual sin permanencia (y propuesta con alcance y precio)' },
    ],
  },

  // ── Soporte e infraestructura IT ───────────────────────────────────────────────────────────────────────────
  {
    id: 'it',
    order: 4,
    scene: 'on',
    word: { es: 'ON', en: 'ON' },
    section: { es: 'soporte', en: 'it' },
    name: { es: 'Soporte e infraestructura IT', en: 'IT support and infrastructure' },
    promise: { es: 'Correo, redes y equipos que no te frenan.', en: 'Email, network and devices that keep you moving.' },
    seo: {
      es: 'Soporte e infraestructura IT para negocios pequeños en Santo Domingo: correo, red, equipos, cuentas y respaldos.',
      en: 'IT support and infrastructure for small businesses in Santo Domingo: email, network, devices, accounts and backups.',
    },
    includes: [
      { id: 'review', text: { es: 'Revisión inicial de equipos, red y cuentas', en: 'Initial review of devices, network and accounts' } },
      {
        id: 'review-inventory',
        flag: 'inventory',
        replaces: 'review',
        text: {
          es: 'Revisión inicial de equipos, red y cuentas, con inventario documentado',
          en: 'Initial review of devices, network and accounts, with a documented inventory',
        },
      },
      { id: 'email', text: { es: 'Correo con tu dominio, bien configurado', en: 'Email on your own domain, set up properly' } },
      { id: 'two-step', text: { es: 'Verificación en dos pasos en tus cuentas', en: 'Two-step verification on your accounts' } },
      { id: 'backups', text: { es: 'Respaldos automáticos con copia fuera del sitio', en: 'Automatic backups with an off-site copy' } },
      {
        id: 'backups-managed',
        flag: 'managedBackups',
        replaces: 'backups',
        text: {
          es: 'Respaldos vigilados, con copia fuera del sitio y restauración probada',
          en: 'Monitored backups, with an off-site copy and tested restores',
        },
      },
      { id: 'wifi', text: { es: 'Wi-Fi ordenado y un plan para cuando se va la luz', en: 'Tidy Wi-Fi and a plan for when the power goes out' } },
      { id: 'remote', flag: 'remoteSupport', text: { es: 'Soporte por WhatsApp en horario hábil', en: 'Support over WhatsApp in business hours' } },
      { id: 'monthly', flag: 'pricingModel', text: { es: 'Plan mensual, sin permanencia', en: 'Monthly plan, no lock-in' } },
    ],
    audience: {
      es: 'Negocios pequeños sin departamento de sistemas y profesionales con equipo propio.',
      en: 'Small businesses with no IT department, and professionals with their own equipment.',
    },
    needs: {
      es: 'Lista de equipos y cuentas, acceso de administrador y una persona autorizada para aprobar cambios.',
      en: 'A list of devices and accounts, admin access, and one person authorized to approve changes.',
    },
    result: {
      es: 'Una hoja: qué tienes, qué está protegido, qué falta y en qué orden se arregla.',
      en: 'One page: what you have, what is protected, what is missing and the order to fix it.',
    },
    fact: 'F30',
    waTag: 'it',
    confirm: [
      { flag: 'remoteSupport', ask: 'Soporte remoto por WhatsApp con horario definido (sin SLA ni «24/7»)' },
      { flag: 'managedBackups', ask: 'Respaldos gestionados con restauración probada' },
      { flag: 'inventory', ask: 'Inventario de equipos y accesos documentado' },
      { flag: 'pricingModel', ask: 'Plan mensual sin permanencia (y propuesta con alcance y precio)' },
    ],
  },
];

export const getService = (id: ServiceId): Service => SERVICES.find((s) => s.id === id) as Service;

// ── «Incluye» ────────────────────────────────────────────────────────────────────────────────────────────────
/** Líneas de «Incluye» que se publican con las banderas dadas: las v2 activas entran; las v1 que sustituyen, salen. */
export function publishedLines(service: Service, confirmed: ConfirmMap = CONFIRMED): IncludeLine[] {
  const active = service.includes.filter((l) => flagOn(l.flag, confirmed));
  const replaced = new Set(active.flatMap((l) => (l.replaces ? [l.replaces] : [])));
  return active.filter((l) => !replaced.has(l.id));
}

/** El texto de «Incluye» listo para pintar. */
export const publishedIncludes = (service: Service, lang: Lang, confirmed: ConfirmMap = CONFIRMED): string[] => publishedLines(service, confirmed).map((l) => l.text[lang]);

/** Mínimo y máximo de líneas publicadas según las banderas (todas apagadas · todas encendidas). */
export function includeRange(service: Service): { min: number; max: number } {
  const flags = Object.keys(CONFIRMED) as ConfirmFlag[];
  const off = Object.fromEntries(flags.map((f) => [f, false])) as ConfirmMap;
  const on = Object.fromEntries(flags.map((f) => [f, true])) as ConfirmMap;
  return { min: publishedLines(service, off).length, max: publishedLines(service, on).length };
}

/** El dato local de una ficha, o `null` si ya caducó. */
export const serviceFact = (service: Service, now: Date | string | number = new Date()): Fact | null => getFact(service.fact, now);

// ── Secciones de la página (§4.1): ids localizados y escena de cada cartel ───────────────────────────────────
export interface Section {
  key: SectionKey;
  id: L<string>;
  scene: SceneId;
}
export const SECTIONS: readonly Section[] = [
  { key: 'home', id: { es: 'inicio', en: 'home' }, scene: 'cover' },
  { key: 'about', id: { es: 'nosotros', en: 'about' }, scene: 'hola' },
  { key: 'services', id: { es: 'servicios', en: 'services' }, scene: 'mist' },
  ...SERVICES.map((s): Section => ({ key: s.id, id: s.section, scene: s.scene })),
  { key: 'samples', id: { es: 'ejemplos', en: 'samples' }, scene: 'ver' },
  { key: 'process', id: { es: 'proceso', en: 'process' }, scene: 'mist' },
  { key: 'contact', id: { es: 'contacto', en: 'contact' }, scene: 'tu' },
];
export const sectionId = (lang: Lang, key: SectionKey): string => (SECTIONS.find((s) => s.key === key) as Section).id[lang];

// ── Lo que depende del dueño ─────────────────────────────────────────────────────────────────────────────────
/** Pendientes que no son de un servicio: la placa «Quiénes somos» (`about`) y el hilo del Proceso (`process`). */
export const SITE_CONFIRM: Array<ConfirmItem & { where: Array<'about' | 'process'> }> = [
  { flag: 'proposalHours', where: ['about', 'process'], ask: 'Plazo de la propuesta por escrito (hoy brand.json › commitments: «24–48» horas)' },
  { flag: 'pricingModel', where: ['process'], ask: 'Propuesta por escrito con alcance y precio (precio cerrado por proyecto; mensual para Marketing y Soporte)' },
  { flag: 'accessOwned', where: ['about'], ask: 'Accesos y archivos del cliente desde el día uno' },
];

export interface ConfirmEntry {
  flag: ConfirmFlag;
  on: boolean;
  /** Dónde aparece: ids de servicio, `about` o `process`. */
  where: string[];
  asks: string[];
}

/** Lista agrupada por bandera de todo lo que depende del dueño, con su estado actual. */
export function confirmList(confirmed: ConfirmMap = CONFIRMED): ConfirmEntry[] {
  const map = new Map<ConfirmFlag, ConfirmEntry>();
  const add = (flag: ConfirmFlag, where: string, ask: string) => {
    const e = map.get(flag) ?? { flag, on: confirmed[flag] === true, where: [], asks: [] };
    if (!e.where.includes(where)) e.where.push(where);
    if (!e.asks.includes(ask)) e.asks.push(ask);
    map.set(flag, e);
  };
  for (const s of SERVICES) for (const c of s.confirm) add(c.flag, s.id, c.ask);
  for (const c of SITE_CONFIRM) for (const w of c.where) add(c.flag, w, c.ask);
  return [...map.values()];
}
