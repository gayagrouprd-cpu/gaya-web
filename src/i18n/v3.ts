// Textos del estilo «cartel editorial» (decisión del dueño del 5-oct-2026: el estilo de su presentación + arte ASCII).
// Titulares en mayúsculas con una palabra o frase de acento en cursiva. Pocas palabras por cartel (6-oct: «hay mucho
// texto de más»). El nombre del dueño NO se publica («no menciones mi nombre»). Sin texto instructivo; sin cifras,
// clientes ni testimonios inventados.
import type { Lang } from '../ascii/types.ts';
import type { ServiceId } from '../data/services.ts';

/** Un titular: líneas en mayúsculas y, opcionalmente, un acento en cursiva (va en su propia línea, después de `lines`). */
export interface Headline {
  lines: string[];
  em?: string;
  /** El acento va ANTES de la última línea (p. ej. «TU NEGOCIO, / imposible / DE IGNORAR.»). */
  emBefore?: number;
}

/** Versión corta de una línea de «Incluye» (services.ts): solo se pinta si esa línea está publicada. */
export interface ShortInclude {
  id: string;
  text: string;
}

export interface V3Copy {
  hero: { title: Headline };
  about: { kicker: string; title: Headline; lead: string };
  services: { title: Headline };
  service: Record<ServiceId, Headline>;
  includes: Record<ServiceId, ShortInclude[]>;
  samples: { kicker: string; title: Headline };
  process: { kicker: string; steps: Array<{ big: string; em: string }> };
  contact: { title: Headline };
}

const es: V3Copy = {
  hero: { title: { lines: ['Tu negocio,', 'de ignorar.'], em: 'imposible', emBefore: 1 } },
  about: {
    kicker: 'Quiénes somos · Santo Domingo',
    title: { lines: ['Hola.'], em: 'somos Gaya Digital' },
    lead: 'Hablas directo con quien hace tu proyecto, sin intermediarios, en español o en inglés.',
  },
  services: { title: { lines: ['Servicios'], em: 'todo en un mismo lugar' } },
  service: {
    web: { lines: ['Tu web,'], em: 'lista para vender' },
    automation: { lines: ['WhatsApp'], em: 'responde por ti' },
    marketing: { lines: ['Que te', 'encuentren'], em: 'y te escriban' },
    it: { lines: ['Todo', 'funciona'], em: 'sin frenarte' },
  },
  includes: {
    web: [
      { id: 'design', text: 'Diseño propio' },
      { id: 'whatsapp', text: 'Botón de WhatsApp' },
      { id: 'domain', text: 'Dominio y correo' },
      { id: 'languages', text: 'Español e inglés' },
    ],
    automation: [
      { id: 'replies', text: 'Respuestas automáticas' },
      { id: 'pilot', text: 'Citas, pedidos o preguntas' },
      { id: 'handoff', text: 'Pasa a una persona' },
      { id: 'tuning', text: 'Ajustes el primer mes' },
    ],
    marketing: [
      { id: 'profiles', text: 'Perfiles ordenados' },
      { id: 'calendar', text: 'Calendario mensual' },
      { id: 'design', text: 'Diseño de piezas' },
      { id: 'report', text: 'Reporte mensual' },
    ],
    it: [
      { id: 'email', text: 'Correo con tu dominio' },
      { id: 'two-step', text: 'Verificación en dos pasos' },
      { id: 'backups', text: 'Respaldos automáticos' },
      { id: 'wifi', text: 'Wi-Fi ordenado' },
    ],
  },
  samples: { kicker: 'Ejemplos · datos ficticios', title: { lines: ['Mira'], em: 'lo que podemos hacer' } },
  process: {
    kicker: 'Proceso',
    steps: [
      { big: 'Hablamos', em: 'por WhatsApp' },
      { big: 'Propuesta', em: 'por escrito' },
      { big: 'Construimos', em: 'con avances' },
      { big: 'Entregamos', em: 'y acompañamos' },
    ],
  },
  contact: { title: { lines: ['Hablemos.'], em: 'tu proyecto empieza aquí' } },
};

const en: V3Copy = {
  hero: { title: { lines: ['Your business,', 'to ignore.'], em: 'impossible', emBefore: 1 } },
  about: {
    kicker: 'Who we are · Santo Domingo',
    title: { lines: ['Hello.'], em: 'we are Gaya Digital' },
    lead: 'You talk directly to the people building your project, no middlemen, in Spanish or English.',
  },
  services: { title: { lines: ['Services'], em: 'all in one place' } },
  service: {
    web: { lines: ['Your site,'], em: 'ready to sell' },
    automation: { lines: ['WhatsApp'], em: 'answers for you' },
    marketing: { lines: ['Get', 'found'], em: 'and get messaged' },
    it: { lines: ['It just', 'works'], em: 'and keeps you moving' },
  },
  includes: {
    web: [
      { id: 'design', text: 'Original design' },
      { id: 'whatsapp', text: 'WhatsApp button' },
      { id: 'domain', text: 'Domain and email' },
      { id: 'languages', text: 'Spanish and English' },
    ],
    automation: [
      { id: 'replies', text: 'Automatic replies' },
      { id: 'pilot', text: 'Bookings, orders or FAQs' },
      { id: 'handoff', text: 'Handoff to a person' },
      { id: 'tuning', text: 'First-month tuning' },
    ],
    marketing: [
      { id: 'profiles', text: 'Tidy profiles' },
      { id: 'calendar', text: 'Monthly calendar' },
      { id: 'design', text: 'Post design' },
      { id: 'report', text: 'Monthly report' },
    ],
    it: [
      { id: 'email', text: 'Email on your domain' },
      { id: 'two-step', text: 'Two-step verification' },
      { id: 'backups', text: 'Automatic backups' },
      { id: 'wifi', text: 'Tidy Wi-Fi' },
    ],
  },
  samples: { kicker: 'Samples · fictional data', title: { lines: ['Look'], em: 'at what we can build' } },
  process: {
    kicker: 'Process',
    steps: [
      { big: 'We talk', em: 'on WhatsApp' },
      { big: 'Proposal', em: 'in writing' },
      { big: 'We build', em: 'with progress updates' },
      { big: 'We deliver', em: 'and stay by your side' },
    ],
  },
  contact: { title: { lines: ["Let's talk."], em: 'your project starts here' } },
};

export const v3: Record<Lang, V3Copy> = { es, en };
