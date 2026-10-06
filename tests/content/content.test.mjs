// Pruebas del paquete de contenido (WP2): node --test tests/content
// Importan los .ts directamente en Node 24 (sintaxis borrable) y, en la última, también a través de Vite (SSR) para
// demostrar que los mismos módulos corren en los dos sitios y que wa.ts da el mismo mensaje que refs.ts.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const load = (f) => import(pathToFileURL(join(ROOT, f)).href);
const brand = JSON.parse(readFileSync(join(ROOT, 'brand.json'), 'utf8'));
const lint = (...args) => spawnSync(process.execPath, [join(ROOT, 'scripts/lint-content.mjs'), ...args], { encoding: 'utf8' });

const svc = await load('src/data/services.ts');
const facts = await load('src/data/facts.ts');
const copyMod = await load('src/i18n/copy.ts');
const wa = await load('src/lib/wa.ts');
const jl = await load('src/lib/jsonld.ts');
const emb = await load('src/data/emblems.ts');
const glyphs = await load('src/ascii/glyphs.ts');

const FLAGS = Object.keys(brand.confirmed);
const allOn = Object.fromEntries(FLAGS.map((f) => [f, true]));
const allOff = Object.fromEntries(FLAGS.map((f) => [f, false]));

// ── Lint ─────────────────────────────────────────────────────────────────────────────────────────────────────
test('lint: el contenido real sale verde (exit 0)', () => {
  const r = lint('--quiet');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /contenido OK/);
});

test('lint: el caso rojo falla con exit 1 y nombra cada familia de defecto', () => {
  const r = lint('--red');
  assert.equal(r.status, 1);
  for (const code of ['figure', 'superlative', 'promise', 'ai', 'instructive', 'plural', 'fiscal', 'jargon', 'flag-v2-no-flag', 'flag-missing-line', 'includes-count', 'parity', 'refs-word', 'glyph', 'jsonld']) {
    assert.match(r.stdout, new RegExp(`ERROR  ${code} `), `el caso rojo no detectó «${code}»`);
  }
});

test('lint: la autoprueba integrada pasa', () => {
  const r = lint('--self-test');
  assert.equal(r.status, 0, r.stdout);
});

test('lint: con fecha futura los datos caducan y el lint sigue verde (la frescura es aviso)', () => {
  const r = lint('--now', '2099-01-01', '--quiet');
  assert.equal(r.status, 0, r.stdout);
});

// ── Datos locales ────────────────────────────────────────────────────────────────────────────────────────────
test('getFacts(now): filtra por expires, el día de caducidad aún se muestra y no rompe con fechas futuras', () => {
  assert.deepEqual(facts.getFacts('2026-09-30').map((f) => f.id).sort(), ['F13', 'F15', 'F19', 'F30']);
  assert.deepEqual(facts.getFacts('2026-12-29').map((f) => f.id).sort(), ['F13', 'F15', 'F19', 'F30'], 'el último día aún sale');
  assert.deepEqual(facts.getFacts('2026-12-30').map((f) => f.id).sort(), ['F13', 'F19', 'F30'], 'F15 se retira sola al día siguiente');
  assert.deepEqual(facts.getFacts('2027-03-30'), []);
  assert.deepEqual(facts.getFacts('2099-12-31'), []);
  assert.equal(facts.getFact('F15', '2027-01-01'), null);
  for (const s of svc.SERVICES) assert.equal(svc.serviceFact(s, '2099-01-01'), null);
  assert.ok(facts.getFacts(new Date('2026-10-01T12:00:00Z')).length === 4);
});

test('getFacts: el día es el de Santo Domingo (UTC−4), no el de UTC', () => {
  // 2027-03-30T02:00Z = 2027-03-29 22:00 en Santo Domingo: F13 todavía sale
  assert.ok(facts.getFacts(new Date('2027-03-30T02:00:00Z')).some((f) => f.id === 'F13'));
  assert.ok(!facts.getFacts(new Date('2027-03-30T04:30:00Z')).some((f) => f.id === 'F13'));
});

test('facts: solo grados A y B, con fuente https, verificados antes de caducar', () => {
  for (const f of facts.FACTS) {
    assert.ok(['A', 'B'].includes(f.grade), f.id);
    assert.match(f.src, /^https:\/\//);
    assert.ok(f.verified < f.expires);
    assert.ok(f.text.es && f.text.en && f.source.es && f.source.en);
  }
  const used = svc.SERVICES.map((s) => s.fact);
  assert.equal(new Set(used).size, 4, 'un dato distinto por servicio');
});

// ── Servicios y banderas ─────────────────────────────────────────────────────────────────────────────────────
test('servicios: §8.5 verbatim en v1 (Incluye 6·5·5·5) con paridad ES/EN', () => {
  const n = Object.fromEntries(svc.SERVICES.map((s) => [s.id, svc.publishedIncludes(s, 'es', allOff).length]));
  assert.deepEqual(n, { web: 6, automation: 5, marketing: 5, it: 5 });
  for (const s of svc.SERVICES) assert.equal(svc.publishedIncludes(s, 'en', allOff).length, n[s.id]);
  const web = svc.getService('web');
  assert.equal(web.promise.es, 'Tu web, rápida y lista para vender por WhatsApp.');
  assert.equal(web.promise.en, 'Your website: fast, and built to sell on WhatsApp.');
  assert.deepEqual(svc.publishedIncludes(web, 'es', allOff), [
    'Diseño propio, pensado primero para el celular',
    'Sitio en español, en inglés o en ambos',
    'Botón de WhatsApp con el mensaje ya escrito',
    'Dominio y correo del negocio configurados',
    'Pruebas de velocidad y accesibilidad',
    'Publicación segura con HTTPS',
  ]);
  assert.equal(svc.getService('it').name.es, 'Soporte e infraestructura IT');
  assert.equal(svc.getService('automation').word.en, 'READY');
});

test('banderas: hoy todas en false y lo publicado es la v1', () => {
  assert.deepEqual(Object.keys(brand.confirmed).sort(), [...svc.confirmList().map((e) => e.flag)].sort());
  assert.ok(Object.values(brand.confirmed).every((v) => v === false));
  for (const s of svc.SERVICES) assert.equal(svc.publishedLines(s).every((l) => !l.flag), true);
});

test('banderas: una línea v2 aparece sola al activarla y las sustituciones conservan su lugar', () => {
  const web = svc.getService('web');
  const base = svc.publishedIncludes(web, 'es', allOff);
  const store = svc.publishedIncludes(web, 'es', { ...allOff, store: true });
  assert.equal(store.length, base.length + 1);
  assert.equal(store.at(-1), 'Tienda en línea con pago por tarjeta o enlace');
  const cms = svc.publishedIncludes(web, 'es', { ...allOff, cms: true });
  assert.equal(cms.length, base.length, 'una sustitución no suma');
  assert.equal(cms[5], 'Publicación segura con HTTPS y panel para editar tu contenido', 'ocupa el lugar de la línea que sustituye');
  for (const s of svc.SERVICES) {
    const r = svc.includeRange(s);
    assert.ok(r.min >= 4 && r.max <= 7, `${s.id}: ${r.min}–${r.max}`);
    for (const l of ['es', 'en']) assert.ok(svc.publishedIncludes(s, l, allOn).length <= 7);
  }
});

test('copia: la placa y el proceso crecen solo con sus banderas', () => {
  for (const l of ['es', 'en']) {
    assert.equal(copyMod.aboutRows(l).length, 5);
    assert.equal(copyMod.aboutRows(l, allOn).length, 7);
    assert.ok(copyMod.aboutRows(l, { ...allOff, proposalHours: true }).some((r) => r.id === 'proposal' && /24–48/.test(r.value)));
    const steps = copyMod.processSteps(l);
    assert.equal(steps.length, 4);
    assert.ok(steps.every((s) => s.badge === null));
    assert.equal(copyMod.processSteps(l, { ...allOff, proposalHours: true })[1].badge, '24–48 h');
    assert.notEqual(copyMod.processSteps(l, { ...allOff, pricingModel: true })[1].label, steps[1].label);
  }
});

test('secciones: ids localizados, únicos y en el orden de §4.1', () => {
  assert.deepEqual(svc.SECTIONS.map((s) => s.key), ['home', 'about', 'services', 'web', 'automation', 'marketing', 'it', 'samples', 'process', 'contact']);
  assert.deepEqual(svc.SECTIONS.map((s) => s.scene), ['cover', 'hola', 'mist', 'web', 'listo', 'eco', 'on', 'ver', 'mist', 'tu']);
  assert.equal(svc.sectionId('es', 'about'), 'nosotros');
  assert.equal(svc.sectionId('en', 'it'), 'it');
  for (const l of ['es', 'en']) assert.equal(new Set(svc.SECTIONS.map((s) => s.id[l])).size, svc.SECTIONS.length);
});

// ── Copia ────────────────────────────────────────────────────────────────────────────────────────────────────
test('copia: «Referencias» → «Ejemplos» / «Samples» en nav, galería, visor y portada', () => {
  const { es, en } = copyMod.copy;
  assert.deepEqual([es.nav.samples, es.gallery.title, es.home.secondary], ['Ejemplos', 'Ejemplos', 'Ver ejemplos']);
  assert.deepEqual([en.nav.samples, en.gallery.title, en.home.secondary], ['Samples', 'Samples', 'See samples']);
  assert.equal(es.viewer.back, 'Volver a ejemplos');
  assert.equal(en.viewer.back, 'Back to samples');
  assert.equal(es.gallery.count(1), '1 ejemplo');
  assert.equal(en.gallery.count(3), '3 samples');
  assert.match(es.nav.switchTo.label, /English/);
});

test('copia: las claves que usan hoy Nav, portada, galería y visor siguen ahí', () => {
  for (const l of ['es', 'en']) {
    const c = copyMod.t(l);
    for (const k of ['label', 'samples', 'services', 'process', 'contact', 'menu', 'close', 'whatsapp', 'language']) assert.equal(typeof c.nav[k], 'string', `nav.${k}`);
    for (const k of ['lead', 'primary', 'secondary']) assert.equal(typeof c.home[k], 'string', `home.${k}`);
    // la palabra de acento es la tercera del titular (el CSS la pone en su propia línea)
    const words = c.home.h1.split(' ');
    assert.equal(words.length, 5);
    assert.equal(words[2].toLowerCase(), c.home.accent);
    assert.equal(c.hero, undefined, 'la portada WebGL antigua ya no existe: nada de `hero` en la copia');
    assert.equal(typeof c.footer.rights, 'string');
    for (const k of ['title', 'metaTitle', 'metaDescription', 'all', 'filter', 'favorites', 'sendFavs']) assert.equal(typeof c.gallery[k], 'string', `gallery.${k}`);
    for (const k of ['count', 'fav', 'unfav']) assert.equal(typeof c.gallery[k], 'function');
    for (const k of ['back', 'device', 'desktop', 'tablet', 'phone', 'open', 'copy', 'copied', 'prev', 'next', 'cta', 'email']) assert.equal(typeof c.viewer[k], 'string', `viewer.${k}`);
    assert.equal(typeof c.viewer.preview, 'function');
  }
});

test('copia §8: textos literales de la portada, contacto y microcopy', () => {
  const { es, en } = copyMod.copy;
  assert.equal(es.home.h1, 'Tu negocio, imposible de ignorar');
  assert.equal(en.home.h1, 'Your business, impossible to ignore');
  assert.equal(es.home.title, 'Gaya Digital · Tecnología para tu negocio');
  assert.equal(es.contact.h2, 'Hablemos');
  assert.equal(en.contact.h2, "Let's talk");
  assert.deepEqual([es.nav.about, es.nav.services, es.nav.samples, es.nav.process, es.nav.contact], ['Nosotros', 'Servicios', 'Ejemplos', 'Proceso', 'Contacto']);
  assert.deepEqual([en.nav.about, en.nav.services, en.nav.samples, en.nav.process, en.nav.contact], ['About', 'Services', 'Samples', 'Process', 'Contact']);
  assert.equal(es.samples.stamp, 'Datos ficticios');
  assert.equal(en.services.source('NIC.DO'), 'Source: NIC.DO');
  assert.equal(es.services.whatsappFor('Automatización e IA'), 'Escríbenos por WhatsApp sobre Automatización e IA');
  assert.ok(es.services.whatsappFor('X').includes(es.services.whatsapp), '2.5.3: el nombre accesible contiene el texto visible');
  assert.ok(es.samples.wantFor('X').includes(es.samples.want));
  assert.equal(es.samples.all(3), 'Ver los 3 ejemplos');
  assert.equal(copyMod.aboutRows('es')[0].value, 'Gaya Digital');
  assert.equal(es.about.signature, 'Gaya Digital · Santo Domingo');
});

test('hora de Santo Domingo: UTC−4, sin «24:05» a medianoche', () => {
  const t = new Date('2026-10-01T04:05:00Z'); // 00:05 en Santo Domingo
  assert.equal(copyMod.formatSdTime('es', t), '00:05');
  assert.equal(copyMod.formatSdTime('en', t), '00:05');
  assert.equal(copyMod.formatSdTime('en', new Date('2026-10-01T01:40:00Z')), '21:40');
});

// ── WhatsApp ─────────────────────────────────────────────────────────────────────────────────────────────────
test('WhatsApp: el servicio llega escrito en el mensaje y el enlace es wa.me sin datos personales', () => {
  const u = wa.waService('es', 'Automatización e IA');
  assert.equal(u, 'https://wa.me/18499254426?text=Hola%20Gaya%20Digital%2C%20me%20interesa%20%C2%ABAutomatizaci%C3%B3n%20e%20IA%C2%BB.%20Quiero%20una%20propuesta.');
  assert.equal(decodeURIComponent(wa.waService('en', 'Web and app development').split('text=')[1]), "Hi Gaya Digital, I'm interested in «Web and app development». I'd like a proposal.");
  assert.equal(wa.waServiceOf('es', 'it'), wa.waService('es', 'Soporte e infraestructura IT'));
  assert.equal(wa.waTagOf('automation'), 'automatización');
  assert.equal(wa.waGeneric('es'), `https://wa.me/18499254426?text=${encodeURIComponent(brand.whatsappMessage.generic.es)}`);
  assert.match(decodeURIComponent(wa.waService('es', 'Web', { name: 'Fogón', url: 'https://gaya.com.do/ref/fogon/' }).split('text=')[1]), /Ejemplo: «Fogón»/);
});

// ── JSON-LD ──────────────────────────────────────────────────────────────────────────────────────────────────
test('JSON-LD: Organization + 4 Service, sin LocalBusiness ni ratings, propiedades válidas en schema.org', () => {
  for (const l of ['es', 'en']) {
    const ld = jl.jsonLd(l);
    assert.equal(ld['@context'], 'https://schema.org');
    const types = ld['@graph'].map((n) => n['@type']);
    assert.deepEqual(types, ['Organization', 'Service', 'Service', 'Service', 'Service']);
    const org = ld['@graph'][0];
    assert.equal(org.alternateName, 'Gaya Group');
    assert.equal(org.name, 'Gaya Digital');
    assert.equal(org.founder, undefined, 'el nombre del dueño no se publica');
    assert.deepEqual(org.sameAs, Object.values(brand.social));
    assert.deepEqual(org.knowsLanguage, ['es', 'en']);
    for (const s of ld['@graph'].slice(1)) {
      assert.equal(s.provider['@id'], org['@id']);
      assert.equal('availableLanguage' in s, false, 'availableLanguage no es propiedad de Service: va en ServiceChannel');
      assert.deepEqual(s.availableChannel.availableLanguage, ['es', 'en']);
      assert.match(s.availableChannel.serviceUrl, /^https:\/\/wa\.me\/18499254426\?text=/);
    }
    const json = JSON.stringify(ld);
    for (const bad of ['LocalBusiness', 'aggregateRating', 'review', 'address', 'ratingValue']) assert.ok(!json.includes(bad), bad);
    assert.ok(!jl.jsonLdScript(l).includes('<'));
  }
  assert.equal(jl.jsonLd('en')['@graph'][1].name, 'Web and app development');
});

// ── Emblemas ─────────────────────────────────────────────────────────────────────────────────────────────────
test('emblemas: 14, de 11×5, solo con glifos permitidos y uno por icon de references.json', () => {
  const refs = JSON.parse(readFileSync(join(ROOT, 'src/data/references.json'), 'utf8')).refs;
  assert.equal(emb.EMBLEM_KEYS.length, 14);
  for (const r of refs) assert.ok(emb.emblemFor(r.icon), `sin emblema para ${r.icon}`);
  for (const k of emb.EMBLEM_KEYS) {
    assert.equal(emb.EMBLEMS[k].length, emb.EMBLEM_ROWS);
    for (const row of emb.EMBLEMS[k]) {
      assert.equal([...row].length, emb.EMBLEM_COLS, `${k}: «${row}»`);
      for (const c of row) assert.ok(glyphs.ALLOWED_ART_CHARS.has(c), `${k}: glifo «${c}» no permitido`);
    }
  }
  assert.equal(emb.emblemFor('no-existe'), null);
  assert.equal(emb.emblemArt('camera').split('\n').length, 5);
});

// ── Vite ─────────────────────────────────────────────────────────────────────────────────────────────────────
test('Vite (SSR): los mismos módulos cargan y wa.ts coincide con refWhatsApp de refs.ts', async () => {
  const { createServer } = await import(pathToFileURL(join(ROOT, 'node_modules/vite/dist/node/index.js')).href);
  const server = await createServer({ root: ROOT, configFile: false, appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    const v = (f) => server.ssrLoadModule(f);
    const [vs, vc, vw, vr, vroutes, vj] = await Promise.all([v('/src/data/services.ts'), v('/src/i18n/copy.ts'), v('/src/lib/wa.ts'), v('/src/lib/refs.ts'), v('/src/routes.ts'), v('/src/lib/jsonld.ts')]);
    assert.equal(vs.SERVICES.length, 4);
    assert.deepEqual(JSON.parse(JSON.stringify(vs.SERVICES)), JSON.parse(JSON.stringify(svc.SERVICES)));
    assert.equal(vc.t('es').gallery.title, 'Ejemplos');
    assert.deepEqual(vj.jsonLd('en'), jl.jsonLd('en'));
    const rs = vr.builtRefs();
    assert.ok(rs.length >= 1);
    for (const lang of ['es', 'en']) {
      const toSample = (r) => ({ name: r.name, sector: r.sector[lang], url: vroutes.url(lang, 'ref', { slug: r.slug }) });
      assert.equal(vw.waSample(lang, toSample(rs[0])), vr.refWhatsApp(lang, [rs[0]]));
      assert.equal(vw.waSamples(lang, rs.map(toSample)), vr.refWhatsApp(lang, rs));
    }
  } finally {
    await server.close();
  }
});
