#!/usr/bin/env node
// Lint de contenido (docs/ascii/DIRECTION.md §8.13, §8.1, §9, T17): corre antes de cada build.
// Falla (exit 1) si el texto visible rompe la honestidad o la regla del dueño, si ES y EN no tienen paridad exacta, si una
// línea v2 sale sin su bandera o una bandera queda sin línea, si «Incluye» se sale de 4–7 líneas, si un dato local no
// es publicable, si el JSON-LD trae algo prohibido o si un emblema usa glifos fuera del alfabeto.
//
// Uso:
//   node scripts/lint-content.mjs                verde: revisa el contenido real (exit 0) o falla (exit 1)
//   node scripts/lint-content.mjs --red          caso rojo: el mismo lint sobre contenido con defectos a propósito (exit 1)
//   node scripts/lint-content.mjs --self-test    comprueba que el verde pasa y que el rojo detecta cada defecto (exit 0 si ambas)
//   node scripts/lint-content.mjs --now 2027-06-01   fecha de referencia para la frescura de los datos
//   --quiet  solo errores y la línea final
//
// La frescura de los datos locales es AVISO programado, nunca bloqueo (R18, II-7): un dato caducado simplemente no sale.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LANGS = ['es', 'en'];

// ── Reglas de texto (§8.13, R04 §5.3, ampliadas) ─────────────────────────────────────────────────────────────
// `W` = alternativa delimitada por letras Unicode (\b no sirve con acentos: «único», «líder»).
const W = (src) => new RegExp(`(?<![\\p{L}\\p{N}_])(?:${src})(?![\\p{L}\\p{N}_])`, 'iu');
const R = (src) => new RegExp(src, 'iu');

const RULES = [
  // Cifras o trayectoria propias. Los datos locales con fuente (facts) quedan exentos: llevan su procedencia.
  { code: 'figure', why: 'cifra o trayectoria propia', skip: ['fact'], re: [R('\\d+\\s?(?:\\+|(?:años|anos|years|yrs|clientes|clients|proyectos|projects)(?![\\p{L}]))'), W('(?:m[aá]s de|mas de|over|more than)\\s+\\d+'), R('\\d+\\s?%')] },
  { code: 'superlative', why: 'superlativo', re: [R('(?:^|\\s)#\\s?1(?:\\s|$)'), W('n[uú]mero (?:uno|1)|number (?:one|1)|l[ií]der(?:es)?|leading|the best|(?:el|la|los|las) mejor(?:es)?|(?:el|la|los|las) m[aá]s \\p{L}+|the most|world[- ]class|de clase mundial|sin igual|incomparable|(?:el|la) [uú]nic[oa]|the only|unrivaled|unrivalled')] },
  { code: 'plural', why: 'plural sin sustento (Gaya es una marca personal)', re: [W('nuestr[oa]s? (?:equipo|personal|staff|colaboradores)'), W('nuestros (?:expertos|especialistas|profesionales|t[eé]cnicos|ingenieros|desarrolladores|dise[ñn]adores|consultores)'), W('equipo de (?:expertos|especialistas|profesionales|trabajo|desarrolladores|dise[ñn]adores)'), W('somos un equipo|we are a team'), W('our (?:team|staff|experts|specialists|professionals|engineers|developers|designers|consultants)'), W('team of (?:experts|specialists|professionals)'), W('expert(?:o|a|os|as|s)?|especialistas?|specialists?|gur[uú]s?|ninjas?')] },
  { code: 'promise', why: 'promesa de resultado', re: [W('garantiz\\p{L}*|garant[ií]a|guarantee\\p{L}*|duplic\\p{L}*|triplic\\p{L}*|roi|sin riesgo|risk[- ]free|resultados? (?:asegurados?|garantizados?)|posici[oó]n #?1|page one|zero downtime|cero ca[ií]das|seguridad total|money[- ]back'), R('100\\s?%'), R('24\\s?/\\s?7|24x7'), W('aumenta(?:r[aá]s)? tus ventas|increase your sales|multiplica tus ventas|ventas aseguradas')] },
  { code: 'ai', why: 'autoría de IA (la web nunca dice quién la hizo)', re: [W('(?:hecho|hecha|creado|creada|dise[ñn]ado|dise[ñn]ada|desarrollado|desarrollada|construido|construida|generado|generada|escrito|escrita|programado|programada|built|made|created|designed|developed|generated|written|powered|coded)\\s+(?:con|por|by|with|using|usando|gracias a|thanks to)\\s+(?:la |an? |the )?(?:ia|ai|inteligencia artificial|artificial intelligence|claude|chatgpt|gpt|anthropic|openai|gemini|copilot|llm)'), W('ai[- ](?:generated|made|built|powered|written)|generado por (?:ia|ai)|con ayuda de (?:la )?(?:ia|inteligencia)|with the help of ai'), W('claude|chatgpt|anthropic|openai|copilot|llm')] },
  { code: 'instructive', why: 'texto instructivo (regla del dueño: la interfaz se explica sola)', re: [W('haz clic|haga clic|hacer clic|click (?:here|on)|clic aqu[ií]|toca (?:aqu[ií]|el bot[oó]n)|tap (?:here|the)|desliza|swipe|scroll (?:down|to)|despl[aá]zate|baja (?:para|hasta)|c[oó]mo (?:usar|funciona|se usa|empezar)|how (?:it works|to use|to get started)|paso a paso|step[- ]by[- ]step|consejos?|tips?|presiona|pulsa|selecciona|arrastra|drag|usa las flechas|use the arrows|instrucciones|instructions|puedes|you can|debes|you should|recuerda|remember|no olvides|don'+"'"+'t forget|simplemente|simply|solo tienes que|follow the steps|sigue los pasos')] },
  { code: 'fiscal', why: 'tema fiscal o legal (fuera de la v1)', re: [W('dgii|e-?cf|e-?ncf|factura(?:ci[oó]n)? electr[oó]nica|e-?invoic\\p{L}*|itbis|impuestos?|fiscal\\p{L}*|tax(?:es)?|rnc|ncf|ley 30-26|ley 172|law 30-26|multas?|fines?|penalt\\p{L}*|retenci[oó]n|facturador|apagones?|blackouts?|power outages?')] },
  { code: 'jargon', why: 'jerga técnica en línea visible (se traduce a beneficio)', re: [W('spf|dkim|dmarc|datos estructurados|structured data|coexisten\\p{L}*|coexistence|crm|api|webhooks?|seo t[eé]cnico|technical seo')] },
  { code: 'price', why: 'precio, tarifa o SLA (nada de eso se publica)', skip: [], re: [R('(?:rd)?\\$\\s?\\d'), R('us\\$'), W('usd|dop|sla|acuerdo de nivel'), R('\\d[\\d.,]*\\s?(?:pesos|d[oó]lares|euros|usd|dop)(?![\\p{L}])')] },
  { code: 'deadline', why: 'plazo (solo el de la propuesta y solo con su bandera)', skip: ['fact'], exemptFlag: 'proposalHours', re: [R('\\d+(?:\\s?[–-]\\s?\\d+)?\\s*(?:h|hr|hrs|horas?|hours?|d[ií]as?|days?|semanas?|weeks?|meses|months?)(?![\\p{L}])')] },
  { code: 'brand-name', why: '«Gaya Group» solo vive en alternateName del JSON-LD', re: [W('gaya group')] },
  { code: 'placeholder', why: 'marcador sin resolver', skip: ['brand'], re: [R('\\[confirmar\\]|lorem ipsum|\\{\\w+\\}'), /\bTODO\b/] },
  { code: 'refs-word', why: '«Referencias» pasó a «Ejemplos» en la copia visible (decisión #4; las URL no cambian)', only: ['copy'], re: [W('referencias?|references?')] },
];

// Alfabeto del arte (glyphs.ts › ALLOWED_ART_CHARS) y lista explícita de prohibidos (DIRECTION §5.6)
const FORBIDDEN_ART = /[←→■□▪▫●○◆◇▲▶★≈≠≤≥✓✗\u2800-\u28FF]|\p{Extended_Pictographic}/u;

const BUDGET = { name: 40, promise: 72, seo: 170, include: 90, audience: 170, needs: 200, result: 220, fact: 140, headingWords: 7 };
const SCHEMA_ALLOWED = {
  Organization: ['@type', '@id', 'name', 'alternateName', 'url', 'description', 'email', 'telephone', 'sameAs', 'knowsLanguage', 'areaServed'],
  Service: ['@type', '@id', 'name', 'description', 'url', 'provider', 'areaServed', 'availableChannel'],
  ServiceChannel: ['@type', 'serviceUrl', 'availableLanguage'],
  Person: ['@type', 'name', 'jobTitle'],
  Country: ['@type', 'name'],
};
const SCHEMA_FORBIDDEN_KEYS = ['aggregateRating', 'review', 'reviews', 'rating', 'ratingValue', 'reviewCount', 'address', 'geo', 'openingHours', 'priceRange', 'makesOffer', 'offers'];
const EXPECTED = {
  services: [
    { id: 'web', scene: 'web', word: { es: 'WEB', en: 'WEB' }, section: { es: 'web', en: 'web' } },
    { id: 'automation', scene: 'listo', word: { es: 'LISTO', en: 'READY' }, section: { es: 'automatizacion', en: 'automation' } },
    { id: 'marketing', scene: 'eco', word: { es: 'ECO', en: 'ECHO' }, section: { es: 'marketing', en: 'marketing' } },
    { id: 'it', scene: 'on', word: { es: 'ON', en: 'ON' }, section: { es: 'soporte', en: 'it' } },
  ],
  flags: ['proposalHours', 'pricingModel', 'accessOwned', 'store', 'nativeApps', 'cms', 'whatsappApi', 'aiAgent', 'ads', 'video', 'googleProfile', 'remoteSupport', 'managedBackups', 'inventory'],
  emblems: ['utensils', 'hard-hat', 'app-window', 'smile', 'scissors', 'sailboat', 'scale', 'library', 'shopping-bag', 'leaf', 'coffee', 'dumbbell', 'camera', 'building-2'],
};

const seg = new Intl.Segmenter('es', { granularity: 'grapheme' });
const len = (s) => [...seg.segment(String(s).normalize('NFC'))].length;
const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;
const clone = (v) => (Array.isArray(v) ? v.map(clone) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)])) : v);

// ── Recolección de texto visible ─────────────────────────────────────────────────────────────────────────────
const SKIP_KEYS = new Set(['id', 'flag', 'code', 'scene', 'replaces', 'waTag', 'key']);
const FN_ARGS = [1, 3, 'Nombre', '21:40'];

/** Recorre la copia: cada cadena con su ruta y la bandera de su nodo (las filas v2 y los pasos con bandera). */
function walkCopy(node, path, flag, out) {
  if (typeof node === 'string') out.push({ where: path, text: node, flag, kind: 'copy' });
  else if (typeof node === 'function') {
    for (const a of FN_ARGS) {
      let v;
      try {
        v = node(a);
      } catch {
        continue;
      }
      if (typeof v === 'string') out.push({ where: `${path}(${JSON.stringify(a)})`, text: v, flag, kind: 'copy' });
    }
  } else if (Array.isArray(node)) node.forEach((x, i) => walkCopy(x, `${path}[${i}]`, flag, out));
  else if (node && typeof node === 'object') {
    const f = node.flag ?? flag;
    for (const [k, v] of Object.entries(node)) if (!SKIP_KEYS.has(k)) walkCopy(v, path ? `${path}.${k}` : k, f, out);
  }
}

function collectTexts(d) {
  const out = [];
  for (const s of d.services) {
    for (const l of LANGS) {
      for (const f of ['name', 'promise', 'seo', 'audience', 'needs', 'result']) out.push({ where: `${s.id}.${f}.${l}`, text: s[f]?.[l] ?? '', kind: 'service' });
      for (const line of s.includes) out.push({ where: `${s.id}.includes[${line.id}].${l}`, text: line.text?.[l] ?? '', flag: line.flag, kind: 'service' });
    }
  }
  for (const l of LANGS) walkCopy(d.copy[l], `copy.${l}`, undefined, out);
  for (const f of d.facts) for (const l of LANGS) {
    out.push({ where: `${f.id}.text.${l}`, text: f.text?.[l] ?? '', kind: 'fact' });
    out.push({ where: `${f.id}.source.${l}`, text: f.source?.[l] ?? '', kind: 'fact' });
  }
  const b = d.brand;
  for (const l of LANGS) {
    for (const [k, v] of [['tagline', b.tagline?.[l]], ['description', b.description?.[l]], ['whatsappMessage.generic', b.whatsappMessage?.generic?.[l]], ['whatsappMessage.service', b.whatsappMessage?.service?.[l]]]) out.push({ where: `brand.${k}.${l}`, text: v ?? '', kind: 'brand' });
  }
  return out;
}

// ── El lint ──────────────────────────────────────────────────────────────────────────────────────────────────
/**
 * @param d  { services, facts, copy, emblems, brand, confirmed, sections, siteConfirm, jsonLd(lang), lib:{publishedLines,…}, art:{ALLOWED}, now }
 * @returns {{ errors: {code,where,msg}[], warnings: string[], info: string[], texts: number }}
 */
export function lintContent(d) {
  const errors = [];
  const warnings = [];
  const info = [];
  const err = (code, where, msg) => errors.push({ code, where, msg });
  const flags = Object.keys(d.confirmed);
  const today = d.lib.dayOf(d.now);

  // 1) Reglas de texto ---------------------------------------------------------------------------------------
  const texts = collectTexts(d);
  for (const t of texts) {
    if (!t.text.trim()) {
      err('empty', t.where, 'texto vacío');
      continue;
    }
    for (const rule of RULES) {
      if (rule.skip?.includes(t.kind)) continue;
      if (rule.only && !rule.only.includes(t.kind)) continue;
      if (rule.exemptFlag && t.flag === rule.exemptFlag) continue;
      for (const re of rule.re) {
        const m = re.exec(t.text);
        if (m) {
          err(rule.code, t.where, `${rule.why} → «${m[0].trim()}» en «${t.text}»`);
          break;
        }
      }
    }
  }
  // JSON-LD también es texto visible para los buscadores
  const ld = {};
  for (const l of LANGS) {
    try {
      ld[l] = d.jsonLd(l);
    } catch (e) {
      err('jsonld', l, `jsonLd(${l}) lanzó: ${e.message}`);
    }
  }

  // 2) Presupuestos de longitud ------------------------------------------------------------------------------
  const over = (where, text, max) => len(text) > max && err('budget', where, `${len(text)} > ${max} caracteres: «${text}»`);
  for (const s of d.services) {
    for (const l of LANGS) {
      over(`${s.id}.name.${l}`, s.name?.[l] ?? '', BUDGET.name);
      over(`${s.id}.promise.${l}`, s.promise?.[l] ?? '', BUDGET.promise);
      over(`${s.id}.seo.${l}`, s.seo?.[l] ?? '', BUDGET.seo);
      over(`${s.id}.audience.${l}`, s.audience?.[l] ?? '', BUDGET.audience);
      over(`${s.id}.needs.${l}`, s.needs?.[l] ?? '', BUDGET.needs);
      over(`${s.id}.result.${l}`, s.result?.[l] ?? '', BUDGET.result);
      for (const line of s.includes) over(`${s.id}.includes[${line.id}].${l}`, line.text?.[l] ?? '', BUDGET.include);
    }
  }
  for (const f of d.facts) for (const l of LANGS) over(`${f.id}.text.${l}`, f.text?.[l] ?? '', BUDGET.fact);
  for (const l of LANGS) {
    const c = d.copy[l];
    for (const [k, v] of [['home.h1', c.home?.h1], ['about.h2', c.about?.h2], ['services.h2', c.services?.h2], ['samples.h2', c.samples?.h2], ['process.h2', c.process?.h2], ['contact.h2', c.contact?.h2]]) {
      if (typeof v === 'string' && words(v) > BUDGET.headingWords) err('budget', `copy.${l}.${k}`, `titular de ${words(v)} palabras (máx. ${BUDGET.headingWords})`);
    }
  }

  // 3) Paridad ES/EN -----------------------------------------------------------------------------------------
  const parity = (a, b, path) => {
    if (typeof a !== typeof b) return err('parity', path, `tipos distintos (${typeof a} vs ${typeof b})`);
    if (typeof a === 'function') {
      const va = a(3);
      const vb = b(3);
      if (typeof va !== 'string' || typeof vb !== 'string' || !va || !vb) err('parity', path, 'una función no devuelve texto en los dos idiomas');
      return;
    }
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) return err('parity', path, `distinto número de elementos (${a.length} vs ${b?.length})`);
      a.forEach((x, i) => parity(x, b[i], `${path}[${i}]`));
    } else if (a && typeof a === 'object') {
      const ka = Object.keys(a).sort().join();
      const kb = Object.keys(b ?? {}).sort().join();
      if (ka !== kb) return err('parity', path, `claves distintas (${ka}) vs (${kb})`);
      for (const k of Object.keys(a)) parity(a[k], b[k], path ? `${path}.${k}` : k);
    } else if (k_isFlag(path)) {
      if (a !== b) err('parity', path, `bandera distinta («${a}» vs «${b}»)`);
    }
  };
  const k_isFlag = (path) => /\.flag$/.test(path);
  parity(d.copy.es, d.copy.en, 'copy');
  // Las cadenas idénticas en ES y EN de 4 palabras o más suelen ser una traducción olvidada (aviso)
  const flat = (l) => {
    const o = [];
    walkCopy(d.copy[l], '', undefined, o);
    return o;
  };
  const en = new Map(flat('en').map((t) => [t.where, t.text]));
  for (const t of flat('es')) if (words(t.text) >= 4 && en.get(t.where) === t.text && !/[@·]/.test(t.text)) warnings.push(`copy.${t.where}: idéntico en ES y EN («${t.text}»)`);
  for (const s of d.services) for (const l of LANGS) for (const f of ['name', 'promise', 'seo', 'audience', 'needs', 'result']) if (!s[f]?.[l]?.trim()) err('parity', `${s.id}.${f}.${l}`, 'falta el texto en este idioma');
  for (const f of d.facts) for (const l of LANGS) if (!f.text?.[l]?.trim() || !f.source?.[l]?.trim()) err('parity', `${f.id}.${l}`, 'dato o fuente sin texto en este idioma');

  // 4) Servicios: estructura, «Incluye» 4–7 y banderas -------------------------------------------------------
  const ids = d.services.map((s) => s.id);
  EXPECTED.services.forEach((e, i) => {
    const s = d.services[i];
    if (!s || s.id !== e.id) return err('structure', `services[${i}]`, `se esperaba «${e.id}» en la posición ${i + 1}, hay «${s?.id}»`);
    if (s.order !== i + 1) err('structure', s.id, `order ${s.order} ≠ ${i + 1}`);
    if (s.scene !== e.scene) err('structure', s.id, `escena «${s.scene}» ≠ «${e.scene}»`);
    for (const l of LANGS) {
      if (s.word?.[l] !== e.word[l]) err('structure', s.id, `palabra ${l} «${s.word?.[l]}» ≠ «${e.word[l]}»`);
      if (s.section?.[l] !== e.section[l]) err('structure', s.id, `id de sección ${l} «${s.section?.[l]}» ≠ «${e.section[l]}»`);
    }
  });
  if (d.services.length !== 4 || new Set(ids).size !== ids.length) err('structure', 'services', 'deben ser exactamente 4 servicios con id único');

  const allOff = Object.fromEntries(flags.map((f) => [f, false]));
  const allOn = Object.fromEntries(flags.map((f) => [f, true]));
  const lineFlags = new Set();
  for (const s of d.services) {
    const lines = s.includes;
    const byId = new Map(lines.map((l) => [l.id, l]));
    if (byId.size !== lines.length) err('includes', s.id, 'ids de línea repetidos');
    const targets = new Set();
    lines.forEach((l, i) => {
      if (l.flag) lineFlags.add(l.flag);
      if (l.flag && !flags.includes(l.flag)) err('flag-unknown', `${s.id}.${l.id}`, `la bandera «${l.flag}» no existe en brand.json › confirmed`);
      if (l.replaces && !l.flag) err('flag-v2-no-flag', `${s.id}.${l.id}`, 'línea v2 (sustituye a otra) sin bandera: saldría sin confirmar');
      if (l.replaces) {
        const t = byId.get(l.replaces);
        if (!t) err('includes', `${s.id}.${l.id}`, `sustituye a «${l.replaces}», que no existe`);
        else if (t.flag) err('includes', `${s.id}.${l.id}`, `sustituye a «${l.replaces}», que también es v2`);
        else if (lines[i - 1] !== t) err('includes', `${s.id}.${l.id}`, `debe ir justo después de «${l.replaces}» para ocupar su lugar`);
        if (targets.has(l.replaces)) err('includes', `${s.id}.${l.id}`, `«${l.replaces}» ya la sustituye otra línea`);
        targets.add(l.replaces);
      }
      if (!l.flag && !l.replaces && i > 0 && lines.slice(0, i).some((x) => x.flag && !x.replaces)) err('includes', `${s.id}.${l.id}`, 'las líneas v1 van antes de las adiciones v2');
    });
    // conteo 4–7: hoy, todo apagado y todo encendido
    const now = d.lib.publishedLines(s, d.confirmed).length;
    const min = d.lib.publishedLines(s, allOff).length;
    const max = d.lib.publishedLines(s, allOn).length;
    for (const [label, n] of [['publicadas hoy', now], ['con todas las banderas apagadas (v1)', min], ['con todas las banderas encendidas (v2)', max]]) {
      if (n < 4 || n > 7) err('includes-count', s.id, `«Incluye» con ${n} líneas ${label}: deben ser 4–7`);
    }
    info.push(`${s.id}: Incluye ${now} hoy (rango ${min}–${max})`);
    // nada v2 sin su bandera en lo publicado, en los dos idiomas
    for (const l of LANGS) {
      const published = d.lib.publishedLines(s, d.confirmed);
      for (const p of published) if (p.flag && d.confirmed[p.flag] !== true) err('flag-published', `${s.id}.${p.id}.${l}`, `línea v2 publicada sin su bandera «${p.flag}»`);
      const visible = d.lib.publishedIncludes(s, l, d.confirmed);
      const v2texts = lines.filter((x) => x.flag && d.confirmed[x.flag] !== true).map((x) => x.text?.[l]);
      for (const t of visible) if (v2texts.includes(t)) err('flag-published', `${s.id}.${l}`, `«${t}» sale en lo publicado y es v2 apagada`);
    }
    // lo que depende del dueño: cada línea con bandera debe estar en confirm[] de su ficha
    const cf = new Set((s.confirm ?? []).map((c) => c.flag));
    for (const l of lines) if (l.flag && !cf.has(l.flag)) err('confirm', `${s.id}.${l.id}`, `la bandera «${l.flag}» no está en confirm[] de la ficha (el dueño no la vería pendiente)`);
    for (const c of s.confirm ?? []) {
      if (!flags.includes(c.flag)) err('flag-unknown', `${s.id}.confirm`, `«${c.flag}» no existe en brand.json › confirmed`);
      else if (!lines.some((l) => l.flag === c.flag)) err('confirm', `${s.id}.confirm`, `«${c.flag}» está en confirm[] pero ninguna línea de la ficha lo usa`);
    }
  }
  // banderas de la copia (placa y proceso)
  const copyFlags = new Set();
  const collectFlags = (n) => {
    if (Array.isArray(n)) n.forEach(collectFlags);
    else if (n && typeof n === 'object') {
      if (typeof n.flag === 'string') copyFlags.add(n.flag);
      Object.values(n).forEach(collectFlags);
    }
  };
  LANGS.forEach((l) => collectFlags(d.copy[l]));
  const siteFlags = new Set((d.siteConfirm ?? []).map((c) => c.flag));
  for (const f of copyFlags) {
    if (!flags.includes(f)) err('flag-unknown', 'copy', `la bandera «${f}» no existe en brand.json › confirmed`);
    else if (!siteFlags.has(f)) err('confirm', 'copy', `la bandera «${f}» de la copia no está en SITE_CONFIRM`);
  }
  // bandera sin su línea
  for (const f of flags) if (!lineFlags.has(f) && !copyFlags.has(f)) err('flag-missing-line', f, `brand.json › confirmed.${f} no tiene ninguna línea que la use`);
  for (const f of flags) if (typeof d.confirmed[f] !== 'boolean') err('flag-unknown', f, `confirmed.${f} no es booleano`);
  for (const f of EXPECTED.flags) if (!flags.includes(f)) err('flag-unknown', f, `falta confirmed.${f} (§8.10)`);
  // lo publicado de la placa y el proceso, con las banderas de hoy
  const aboutHoy = d.lib.aboutRows('es', d.confirmed).length;
  const aboutV1 = d.lib.aboutRows('es', allOff).length;
  info.push(`placa «Quiénes somos»: ${aboutHoy} filas hoy (v1: ${aboutV1}, v2: ${d.lib.aboutRows('es', allOn).length})`);
  if (aboutV1 < 5 || d.lib.aboutRows('es', allOn).length > 7) err('structure', 'about.rows', 'la placa debe tener 5 filas v1 y como máximo 7 con las v2 (sin el nombre del dueño)');
  for (const l of LANGS) {
    const steps = d.lib.processSteps(l, allOff);
    if (steps.length !== 4 || steps.some((s) => s.badge)) err('structure', `process.${l}`, 'el Proceso tiene 4 pasos y ninguna insignia sin bandera');
  }

  // 5) Secciones ----------------------------------------------------------------------------------------------
  for (const l of LANGS) {
    const seen = new Map();
    for (const s of d.sections) {
      const id = s.id?.[l];
      if (!/^[a-z][a-z0-9-]*$/.test(id ?? '')) err('ids', `${s.key}.${l}`, `id «${id}» no es un ancla válida`);
      if (seen.has(id)) err('ids', `${s.key}.${l}`, `id «${id}» repetido (también en ${seen.get(id)})`);
      seen.set(id, s.key);
    }
  }
  const order = ['home', 'about', 'services', 'web', 'automation', 'marketing', 'it', 'samples', 'process', 'contact'];
  if (d.sections.map((s) => s.key).join() !== order.join()) err('ids', 'sections', `orden de secciones distinto de §4.1: ${d.sections.map((s) => s.key).join()}`);

  // 6) Datos locales ------------------------------------------------------------------------------------------
  const factIds = d.facts.map((f) => f.id);
  if (new Set(factIds).size !== factIds.length) err('fact', 'facts', 'ids repetidos');
  for (const f of d.facts) {
    if (!['A', 'B'].includes(f.grade)) err('fact', f.id, `grado ${f.grade}: solo A y B se publican`);
    if (!/^https:\/\//.test(f.src ?? '')) err('fact', f.id, `src debe ser una URL https: «${f.src}»`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.verified ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(f.expires ?? '')) err('fact', f.id, 'verified y expires deben ser AAAA-MM-DD');
    else if (f.verified > f.expires) err('fact', f.id, `verificado (${f.verified}) después de caducar (${f.expires})`);
  }
  const used = new Set();
  for (const s of d.services) {
    if (!d.facts.some((f) => f.id === s.fact)) err('fact', s.id, `el dato «${s.fact}» no existe en facts.ts`);
    if (used.has(s.fact)) err('fact', s.id, `el dato «${s.fact}» ya lo usa otro servicio (un dato por servicio)`);
    used.add(s.fact);
  }
  // getFacts(now) filtra por expires y no rompe: con una fecha futura no queda ninguno y nada lanza
  try {
    const future = d.lib.getFacts('2099-01-01');
    if (future.length !== 0) err('fact', 'getFacts', `con 2099-01-01 deberían salir 0 datos y salen ${future.length}`);
    const live = d.lib.getFacts(today);
    const expected = d.facts.filter((f) => ['A', 'B'].includes(f.grade) && today <= f.expires).length;
    if (live.length !== expected) err('fact', 'getFacts', `hoy (${today}) salen ${live.length} datos y deberían ser ${expected}`);
    for (const s of d.services) d.lib.serviceFact(s, '2099-01-01');
    info.push(`datos locales vigentes hoy: ${live.map((f) => f.id).join(', ') || 'ninguno'}`);
  } catch (e) {
    err('fact', 'getFacts', `lanzó: ${e.message}`);
  }
  for (const n of d.lib.freshness(d.now)) warnings.push(`dato ${n.id}: ${n.notes.join('; ')}`);

  // 7) Emblemas -----------------------------------------------------------------------------------------------
  const keys = Object.keys(d.emblems);
  for (const k of EXPECTED.emblems) if (!keys.includes(k)) err('emblem', k, 'falta el emblema (uno por icon de references.json)');
  for (const k of keys) {
    const rows = d.emblems[k];
    if (rows.length !== 5) err('emblem-size', k, `${rows.length} filas (deben ser 5)`);
    rows.forEach((r, i) => {
      const cs = [...r];
      if (cs.length !== 11) err('emblem-size', `${k}[${i}]`, `${cs.length} columnas (deben ser 11): «${r}»`);
      const bad = cs.filter((c) => FORBIDDEN_ART.test(c) || !d.art.ALLOWED.has(c));
      if (bad.length) err('glyph', `${k}[${i}]`, `glifos fuera del alfabeto: ${[...new Set(bad)].join(' ')}`);
    });
  }

  // 8) JSON-LD ------------------------------------------------------------------------------------------------
  const visitLd = (n, path, type) => {
    if (Array.isArray(n)) return n.forEach((x, i) => visitLd(x, `${path}[${i}]`, type));
    if (!n || typeof n !== 'object') return;
    const t = n['@type'];
    if (t === 'LocalBusiness' || (Array.isArray(t) && t.includes('LocalBusiness'))) err('jsonld', path, 'LocalBusiness exige address: prohibido');
    if (t) {
      const allowed = SCHEMA_ALLOWED[t];
      if (!allowed) err('jsonld', path, `tipo «${t}» fuera de los permitidos (${Object.keys(SCHEMA_ALLOWED).join(', ')})`);
      else for (const k of Object.keys(n)) if (!allowed.includes(k)) err('jsonld', `${path}.${k}`, `«${k}» no es una propiedad de ${t} en schema.org (o no está permitida aquí)`);
    }
    for (const [k, v] of Object.entries(n)) {
      if (SCHEMA_FORBIDDEN_KEYS.includes(k)) err('jsonld', `${path}.${k}`, `«${k}» prohibido (sin ratings, reseñas ni dirección)`);
      visitLd(v, `${path}.${k}`, t);
    }
  };
  for (const l of LANGS) {
    const g = ld[l]?.['@graph'];
    if (!g) continue;
    visitLd(ld[l], `jsonld.${l}`);
    const orgs = g.filter((n) => n['@type'] === 'Organization');
    const svcs = g.filter((n) => n['@type'] === 'Service');
    if (orgs.length !== 1 || svcs.length !== 4 || g.length !== 5) err('jsonld', l, `se esperaba 1 Organization + 4 Service y hay ${orgs.length} + ${svcs.length} (${g.length} nodos)`);
    const o = orgs[0];
    if (o) {
      if (o.alternateName !== 'Gaya Group') err('jsonld', `${l}.alternateName`, `debe ser «Gaya Group», es «${o.alternateName}»`);
      if (o.name !== d.brand.name) err('jsonld', `${l}.name`, `«${o.name}» ≠ brand.name «${d.brand.name}»`);
      if (o.founder) err('jsonld', `${l}.founder`, 'el nombre del dueño no se publica (decisión del 6-oct-2026)');
      if (JSON.stringify(o.sameAs) !== JSON.stringify(Object.values(d.brand.social))) err('jsonld', `${l}.sameAs`, 'sameAs debe ser exactamente las redes de brand.json');
      if (JSON.stringify(o.knowsLanguage) !== '["es","en"]') err('jsonld', `${l}.knowsLanguage`, 'debe ser ["es","en"]');
    }
    svcs.forEach((s, i) => {
      if (s.name !== d.services[i]?.name?.[l]) err('jsonld', `${l}.service[${i}].name`, `«${s.name}» ≠ el nombre visible «${d.services[i]?.name?.[l]}»`);
      if (s.provider?.['@id'] !== o?.['@id']) err('jsonld', `${l}.service[${i}].provider`, 'provider debe apuntar a la Organization');
    });
    for (const n of g) for (const k of ['name', 'description', 'jobTitle']) if (typeof n[k] === 'string') texts.push({ where: `jsonld.${l}.${n['@type']}.${k}`, text: n[k], kind: 'jsonld' });
  }
  for (const t of texts.filter((x) => x.kind === 'jsonld')) for (const rule of RULES) {
    if (rule.only || rule.skip?.includes('jsonld')) continue;
    for (const re of rule.re) {
      const m = re.exec(t.text);
      if (m) {
        err(rule.code, t.where, `${rule.why} → «${m[0].trim()}»`);
        break;
      }
    }
  }
  try {
    if (/</.test(d.lib.jsonLdScript('es'))) err('jsonld', 'jsonLdScript', 'el JSON incrustado no debe contener «<»');
  } catch (e) {
    err('jsonld', 'jsonLdScript', `lanzó: ${e.message}`);
  }

  // 9) WhatsApp y brand.json ----------------------------------------------------------------------------------
  const wm = d.brand.whatsappMessage ?? {};
  for (const l of LANGS) if (!wm.service?.[l]?.includes('{service}')) err('wa', `brand.whatsappMessage.service.${l}`, 'falta la plantilla con «{service}» (§8.10)');
  if (!/^\d{10,15}$/.test(d.brand.contact?.whatsapp?.e164 ?? '')) err('wa', 'brand.contact.whatsapp.e164', 'número internacional sin + ni guiones');
  try {
    for (const l of LANGS) {
      for (const s of d.services) {
        const u = d.lib.waService(l, s.name[l]);
        const expected = `https://wa.me/${d.brand.contact.whatsapp.e164}?text=${encodeURIComponent(wm.service[l].replace('{service}', s.name[l]))}`;
        if (u !== expected) err('wa', `${s.id}.${l}`, `waService no construye el enlace esperado: ${u}`);
        if (/[?&](?:name|email|phone|tel)=/i.test(u)) err('wa', `${s.id}.${l}`, 'datos personales en la URL');
        if (!decodeURIComponent(u.split('text=')[1] ?? '').includes(`«${s.name[l]}»`)) err('wa', `${s.id}.${l}`, 'el mensaje no lleva el nombre del servicio entre « »');
      }
      if (!d.lib.waGeneric(l).includes('text=')) err('wa', `generic.${l}`, 'waGeneric sin texto');
    }
  } catch (e) {
    err('wa', 'waService', `lanzó: ${e.message}`);
  }
  const pending = flags.filter((f) => d.confirmed[f] !== true);
  info.push(`banderas confirmadas: ${flags.length - pending.length}/${flags.length} (la v1 honesta es lo que se publica)`);

  return { errors, warnings, info, texts: texts.length };
}

// ── Datos reales y caso rojo ─────────────────────────────────────────────────────────────────────────────────
async function load(file) {
  return import(pathToFileURL(join(ROOT, file)).href);
}

async function realData(now) {
  const [svc, fct, cpy, emb, gly, jld, wa] = await Promise.all(['src/data/services.ts', 'src/data/facts.ts', 'src/i18n/copy.ts', 'src/data/emblems.ts', 'src/ascii/glyphs.ts', 'src/lib/jsonld.ts', 'src/lib/wa.ts'].map(load));
  const brand = JSON.parse(readFileSync(join(ROOT, 'brand.json'), 'utf8'));
  return {
    services: svc.SERVICES,
    facts: fct.FACTS,
    copy: cpy.copy,
    emblems: emb.EMBLEMS,
    brand,
    confirmed: brand.confirmed,
    sections: svc.SECTIONS,
    siteConfirm: svc.SITE_CONFIRM,
    jsonLd: (l) => jld.jsonLd(l),
    art: { ALLOWED: gly.ALLOWED_ART_CHARS },
    lib: {
      publishedLines: svc.publishedLines,
      publishedIncludes: svc.publishedIncludes,
      serviceFact: svc.serviceFact,
      getFacts: fct.getFacts,
      freshness: fct.freshness,
      dayOf: fct.dayOf,
      aboutRows: cpy.aboutRows,
      processSteps: cpy.processSteps,
      jsonLdScript: (l) => jld.jsonLdScript(l),
      waService: wa.waService,
      waGeneric: wa.waGeneric,
    },
    now,
  };
}

/** Contenido con un defecto de cada familia, para probar que el lint de verdad falla. Devuelve los códigos esperados. */
function redData(d) {
  const r = { ...d, services: clone(d.services), facts: clone(d.facts), copy: clone(d.copy), emblems: clone(d.emblems), brand: clone(d.brand), confirmed: clone(d.confirmed) };
  // cifras, superlativo, promesa, IA, instructivo, plural, precio, plazo
  r.services[0].promise.es = 'Somos líderes: +10 años y 40 clientes, garantizamos ROI, hecho con IA. Haz clic aquí.';
  r.services[0].seo.en = 'Our team of experts builds sites from RD$ 5,000, ready in 3 days, 100 % sure.';
  // fiscal y jerga
  r.services[1].needs.es = 'Tu RNC, tu DGII y el registro SPF/DKIM de tu CRM.';
  // línea v2 sin bandera (sustituye a otra) y bandera inexistente
  r.services[1].includes.push({ id: 'ghost', text: { es: 'Línea fantasma', en: 'Ghost line' }, replaces: 'map' });
  r.services[1].includes.push({ id: 'ghost2', flag: 'noExiste', text: { es: 'Otra fantasma', en: 'Another ghost' } });
  // bandera de brand.json sin ninguna línea que la use
  r.confirmed.sinLinea = false;
  r.brand.confirmed = r.confirmed;
  // «Incluye» fuera de 4–7
  r.services[2].includes = r.services[2].includes.filter((l) => ['review', 'report', 'ads'].includes(l.id));
  // paridad rota: falta una fila en EN y una clave distinta
  r.copy.en.about.rows.pop();
  delete r.copy.en.nav.skip;
  // «Referencias» en la copia visible y nombre de marca alternativo
  r.copy.es.viewer.back = 'Volver a referencias de Gaya Group';
  // dato local: grado C, sin https, caducado antes de verificarse
  r.facts[0].grade = 'C';
  r.facts[1].src = 'http://ejemplo.test/';
  r.facts[2].verified = '2030-01-01';
  r.services[3].fact = 'F99';
  // emblema con glifo prohibido y fila de 12 columnas
  r.emblems.camera[2] = ' █ ● ╭───╮  █';
  // JSON-LD con LocalBusiness, rating y una propiedad que no existe en Service
  r.jsonLd = (l) => {
    const g = clone(d.jsonLd(l));
    g['@graph'][0]['@type'] = 'LocalBusiness';
    g['@graph'][0].aggregateRating = { '@type': 'AggregateRating', ratingValue: 5 };
    g['@graph'][1].availableLanguage = ['es'];
    return g;
  };
  // mensaje de WhatsApp sin su plantilla
  delete r.brand.whatsappMessage.service;
  const expected = ['figure', 'superlative', 'promise', 'ai', 'instructive', 'plural', 'price', 'deadline', 'fiscal', 'jargon', 'flag-v2-no-flag', 'flag-unknown', 'flag-missing-line', 'includes-count', 'parity', 'refs-word', 'brand-name', 'fact', 'emblem-size', 'glyph', 'jsonld', 'wa'];
  return { data: r, expected };
}

function print({ errors, warnings, info, texts }, { quiet }) {
  const groups = new Map();
  for (const e of errors) groups.set(e.code, [...(groups.get(e.code) ?? []), e]);
  for (const [code, list] of groups) {
    console.log(`\nERROR  ${code} (${list.length})`);
    for (const e of list.slice(0, 12)) console.log(`   - ${e.where}: ${e.msg}`);
    if (list.length > 12) console.log(`   … y ${list.length - 12} más`);
  }
  if (!quiet) {
    if (warnings.length) console.log('');
    for (const w of warnings) console.log(`aviso   ${w}`);
    if (info.length) console.log('');
    for (const i of info) console.log(`info    ${i}`);
  }
  console.log(errors.length ? `\n✗ contenido: ${errors.length} errores en ${groups.size} reglas (${texts} textos revisados)` : `\n✓ contenido OK · 4 servicios · 2 idiomas · ${texts} textos revisados`);
}

// ── Ejecución directa ────────────────────────────────────────────────────────────────────────────────────────
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const argv = process.argv.slice(2);
  const quiet = argv.includes('--quiet');
  const ni = argv.indexOf('--now');
  const now = ni > -1 ? argv[ni + 1] : new Date();
  const real = await realData(now);

  if (argv.includes('--self-test')) {
    const green = lintContent(real);
    const { data, expected } = redData(real);
    const red = lintContent(data);
    const seen = new Set(red.errors.map((e) => e.code));
    const missing = expected.filter((c) => !seen.has(c));
    console.log(`verde: ${green.errors.length} errores (debe ser 0) · rojo: ${red.errors.length} errores en ${seen.size} reglas`);
    if (green.errors.length) print(green, { quiet: true });
    if (missing.length) console.log(`el caso rojo NO detectó: ${missing.join(', ')}`);
    const okSelf = green.errors.length === 0 && missing.length === 0 && red.errors.length > 0;
    console.log(okSelf ? '✓ autoprueba superada: el verde pasa y el rojo falla en cada regla' : '✗ AUTOPRUEBA FALLIDA');
    process.exit(okSelf ? 0 : 1);
  }

  const target = argv.includes('--red') ? redData(real).data : real;
  const res = lintContent(target);
  print(res, { quiet });
  process.exit(res.errors.length ? 1 : 0);
}
