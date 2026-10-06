// Datos locales con procedencia y caducidad (docs/ascii/DIRECTION.md §8.9).
// Un dato por servicio, nada fiscal. Cada dato lleva su fuente (nombre + URL), la fecha en que se leyó y la fecha
// en que caduca: pasada esa fecha `getFacts()` lo deja fuera y desaparece del HTML sin romper el build.
// Grados C y X nunca se publican. Quién los revisa: el dueño, cada 90 días (`node scripts/lint-content.mjs` avisa con
// `freshness()` cuando un dato está por caducar o lleva más de 90 días sin releerse; es aviso, nunca bloquea).
//
// Este módulo corre igual en Vite/Astro y directamente en Node 24 (solo sintaxis borrable, imports con extensión).
import type { Lang } from '../ascii/types.ts';

export type Grade = 'A' | 'B' | 'C' | 'X';
export type FactId = 'F13' | 'F19' | 'F15' | 'F30';

export interface Fact {
  id: FactId;
  /** Texto del dato, por idioma (mismo hecho en los dos). */
  text: Record<Lang, string>;
  /** Nombre de la fuente tal como se muestra: «Fuente: {nombre}». */
  source: Record<Lang, string>;
  /** URL exacta de la fuente (se muestra como enlace). */
  src: string;
  /** Día en que se leyó la fuente (AAAA-MM-DD). */
  verified: string;
  /** Último día en que el dato se publica (AAAA-MM-DD, hora de Santo Domingo). */
  expires: string;
  grade: Grade;
}

export const FACTS: readonly Fact[] = [
  {
    id: 'F13',
    text: {
      es: 'Si un dominio .do vence, queda suspendido 30 días y 15 más en rescate antes de borrarse.',
      en: 'An expired .do domain is suspended for 30 days, then held 15 more before deletion.',
    },
    source: { es: 'NIC.DO, política de delegación', en: 'NIC.DO, delegation policy' },
    src: 'https://www.nic.do/en/policies/domain-names-delegation-policies-for-cctld-do/',
    verified: '2026-09-30',
    expires: '2027-03-29',
    grade: 'A',
  },
  {
    id: 'F19',
    text: {
      es: 'WhatsApp exige ofrecer siempre un camino para hablar con una persona.',
      en: 'WhatsApp requires offering customers a way to reach a person at all times.',
    },
    source: { es: 'WhatsApp Business, política de mensajería', en: 'WhatsApp Business, messaging policy' },
    src: 'https://whatsappbusiness.com/es-la/policy/',
    verified: '2026-09-30',
    expires: '2027-03-29',
    grade: 'A',
  },
  {
    id: 'F15',
    text: {
      es: 'Si tu cliente te escribe desde un anuncio o botón a WhatsApp, Meta da 72 h de mensajes sin cargo.',
      en: 'When a customer messages from an ad or button, Meta gives 72 hours of charge-free messages.',
    },
    source: { es: 'Meta for Developers, precios de WhatsApp', en: 'Meta for Developers, WhatsApp pricing' },
    src: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing',
    verified: '2026-09-30',
    expires: '2026-12-29',
    grade: 'A',
  },
  {
    id: 'F30',
    text: {
      es: 'Regla de respaldo 3-2-1: tres copias, en dos medios, una fuera del sitio.',
      en: 'The 3-2-1 backup rule: three copies, on two media, one off-site.',
    },
    source: { es: 'CISA, respaldo de datos', en: 'CISA, back up business data' },
    src: 'https://www.cisa.gov/audiences/small-and-medium-businesses/secure-your-business/back-up-business-data',
    verified: '2026-09-30',
    expires: '2027-03-29',
    grade: 'A',
  },
];

/** Solo grados A y B se publican; C y X sirven para calibrar, nunca para mostrar. */
export const PUBLISHABLE_GRADES: readonly Grade[] = ['A', 'B'];

const SD_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' });

/** Día (AAAA-MM-DD) de un instante, en hora de Santo Domingo. Una cadena AAAA-MM-DD se toma tal cual. */
export function dayOf(now: Date | string | number = new Date()): string {
  if (typeof now === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(now)) return now;
  return SD_DAY.format(typeof now === 'string' ? new Date(now) : new Date(now));
}

/** ¿Se publica este dato en `now`? Grado A/B y todavía sin caducar (el día de `expires` aún se muestra). */
export function isLive(fact: Fact, now: Date | string | number = new Date()): boolean {
  return PUBLISHABLE_GRADES.includes(fact.grade) && dayOf(now) <= fact.expires;
}

/** Los datos vigentes en `now`. Lo caducado simplemente no sale: no rompe nada. */
export function getFacts(now: Date | string | number = new Date()): Fact[] {
  return FACTS.filter((f) => isLive(f, now));
}

/** Un dato por id, o `null` si caducó (o no se publica). Quien lo pinta debe admitir `null`. */
export function getFact(id: FactId, now: Date | string | number = new Date()): Fact | null {
  return getFacts(now).find((f) => f.id === id) ?? null;
}

const DAY_MS = 86_400_000;
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);

/** Aviso de frescura (nunca bloquea): datos que caducan en `withinDays` o cuya lectura pasó de `maxAgeDays`. */
export function freshness(now: Date | string | number = new Date(), withinDays = 21, maxAgeDays = 90) {
  const today = dayOf(now);
  return FACTS.flatMap((f) => {
    const left = daysBetween(today, f.expires);
    const age = daysBetween(f.verified, today);
    const notes: string[] = [];
    if (left < 0) notes.push(`caducó hace ${-left} d (${f.expires}): ya no se publica`);
    else if (left <= withinDays) notes.push(`caduca en ${left} d (${f.expires})`);
    if (age > maxAgeDays) notes.push(`leído hace ${age} d (${f.verified}): toca re-verificar`);
    return notes.length ? [{ id: f.id, notes }] : [];
  });
}
