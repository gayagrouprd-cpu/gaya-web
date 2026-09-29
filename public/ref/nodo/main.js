/* Nodo · panel de pedidos y clientes. Datos de ejemplo generados de forma determinista. */
(() => {
  'use strict';

  const G = window.GAYA || { lang: 'es', still: false };
  const STILL = !!G.still;
  let lang = G.lang === 'en' ? 'en' : 'es';
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => STILL || mqReduce.matches;
  const EASE = 'cubic-bezier(.16,1,.3,1)';
  const doc = document;
  const $ = (s, c = doc) => c.querySelector(s);
  const $$ = (s, c = doc) => Array.from(c.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, p) => a + (b - a) * p;
  const expo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const icon = (n, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;

  /* ───────────────────────── Textos ───────────────────────── */
  const T = {
    es: {
      skip: 'Ir al contenido', title: 'Nodo · Pedidos y clientes', brandAria: 'Nodo, ir a Resumen', sample: 'Datos de ejemplo',
      range: 'Rango', search: 'Buscar', lang: 'Idioma', cta: 'Quiero una app así', views: 'Vistas',
      resumen: 'Resumen', clientes: 'Clientes', pedidos: 'Pedidos', role: 'Administración',
      revenue: 'Ingresos', vsPrev: 'vs. periodo anterior', legendNow: 'Este periodo', legendPrev: 'Periodo anterior',
      chartLabel: 'Gráfica de ingresos por día', kpis: 'Indicadores', orders: 'Pedidos', ticket: 'Ticket medio',
      activeClients: 'Clientes activos', ofTotal: 'de {n}', newN: '{n} nuevos en el periodo', new1: '1 nuevo en el periodo', new0: 'Sin clientes nuevos',
      byChannel: 'Por canal', metric: 'Métrica', shareOf: '{p} del total', vsN: 'vs. {v}',
      activity: 'Actividad', today: 'Hoy', ordersN: '{n} pedidos', ordersWord: 'pedidos',
      errChan: 'No se pudieron cargar los canales.', retry: 'Reintentar', chanOk: 'Canales actualizados',
      clientsSearch: 'Buscar clientes', status: 'Estado', all: 'Todos', fActive: 'Activos', fNew: 'Nuevos', fInactive: 'Inactivos',
      stActive: 'Activo', stNew: 'Nuevo', stInactive: 'Inactivo',
      thClient: 'Cliente', thArea: 'Barrio', thOrders: 'Pedidos · {r}', thSpent: 'Gastado · {r}', thLast: 'Último pedido',
      countOf: '{a} de {b}', emptyQ: 'Ningún cliente coincide con «{q}».', emptyF: 'Ningún cliente con este estado.',
      clearQ: 'Limpiar búsqueda', showAll: 'Ver todos',
      osNuevo: 'Nuevo', osPrep: 'Preparando', osListo: 'Listo', osEntregado: 'Entregado',
      goPrep: 'Preparar', goListo: 'Marcar listo', goEntregado: 'Entregar', noOrders: 'Sin pedidos',
      undo: 'Deshacer', movedTo: '{id} pasó a {s}', undone: '{id} volvió a {s}',
      copyEmail: 'Copiar correo', copied: 'Correo copiado', copyFail: 'No se pudo copiar', seeToday: 'Ver pedido de hoy',
      prevClient: 'Cliente anterior', nextClient: 'Cliente siguiente', close: 'Cerrar', since: 'Cliente desde {d}',
      weekly: 'Gasto semanal', weeks: '13 semanas', history: 'Historial', lastN: 'últimos {n}', drTicket: 'Ticket medio',
      palLabel: 'Comandos', palPh: 'Buscar comandos y clientes', results: 'Resultados',
      gNav: 'Ir a', gRange: 'Rango', gLang: 'Idioma', gAct: 'Acciones', gClients: 'Clientes', gOrders: 'Pedidos de hoy', gChan: 'Canal',
      cmdRange: 'Últimos {n} días', cmdFind: 'Buscar cliente', palEmpty: 'Sin resultados para «{q}»',
      ordersToday: '{n} pedidos · {a}',
      fName: 'Nombre', fContact: 'Correo o teléfono', fManage: '¿Qué quieres gestionar?',
      mOrders: 'Pedidos', mClients: 'Clientes', mStock: 'Inventario', mAppts: 'Citas', mPay: 'Pagos', mDeliv: 'Entregas',
      send: 'Enviar', sending: 'Enviando', cancel: 'Cancelar',
      errName: 'Escribe tu nombre.', errContact: 'Escribe un correo o un teléfono válido.',
      done: 'Recibido, {n}.', doneAnon: 'Recibido.', doneP: 'Es una demostración: no se envió nada.',
      notices: 'Avisos', now: 'ahora', minAgo: 'hace {n} min', hAgo: 'hace {n} h',
      dToday: 'hoy', dYesterday: 'ayer', dAgo: 'hace {n} d',
      evNew: 'Pedido de <b>{name}</b>', evPrep: '<b>{id}</b> en preparación', evListo: '<b>{id}</b> listo',
      evEntregado: '<b>{id}</b> entregado', evClient: 'Cliente nuevo',
      tipOrders: '{n} pedidos', tipOrders1: '1 pedido', tipPrev: 'Anterior {v}',
      chanChip: 'Canal: {c}', chanClear: 'Quitar filtro',
      sumChart: 'Ingresos de los últimos {r} días: {v}, {d} frente al periodo anterior.',
      rangeAnn: 'Mostrando los últimos {n} días', langDone: 'Idioma: español',
      ch: ['Web', 'Mensajes', 'Mostrador', 'Teléfono'],
      wdMon: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
      wd: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
      mo: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    },
    en: {
      skip: 'Skip to content', title: 'Nodo · Orders & customers', brandAria: 'Nodo, go to Overview', sample: 'Sample data',
      range: 'Range', search: 'Search', lang: 'Language', cta: 'I want an app like this', views: 'Views',
      resumen: 'Overview', clientes: 'Customers', pedidos: 'Orders', role: 'Admin',
      revenue: 'Revenue', vsPrev: 'vs. previous period', legendNow: 'This period', legendPrev: 'Previous period',
      chartLabel: 'Daily revenue chart', kpis: 'Key figures', orders: 'Orders', ticket: 'Average order',
      activeClients: 'Active customers', ofTotal: 'of {n}', newN: '{n} new this period', new1: '1 new this period', new0: 'No new customers',
      byChannel: 'By channel', metric: 'Metric', shareOf: '{p} of total', vsN: 'vs. {v}',
      activity: 'Activity', today: 'Today', ordersN: '{n} orders', ordersWord: 'orders',
      errChan: "Couldn't load channels.", retry: 'Retry', chanOk: 'Channels updated',
      clientsSearch: 'Search customers', status: 'Status', all: 'All', fActive: 'Active', fNew: 'New', fInactive: 'Inactive',
      stActive: 'Active', stNew: 'New', stInactive: 'Inactive',
      thClient: 'Customer', thArea: 'Area', thOrders: 'Orders · {r}', thSpent: 'Spent · {r}', thLast: 'Last order',
      countOf: '{a} of {b}', emptyQ: 'No customers match “{q}”.', emptyF: 'No customers with this status.',
      clearQ: 'Clear search', showAll: 'Show all',
      osNuevo: 'New', osPrep: 'Preparing', osListo: 'Ready', osEntregado: 'Delivered',
      goPrep: 'Start', goListo: 'Mark ready', goEntregado: 'Deliver', noOrders: 'No orders',
      undo: 'Undo', movedTo: '{id} moved to {s}', undone: '{id} back to {s}',
      copyEmail: 'Copy email', copied: 'Email copied', copyFail: "Couldn't copy", seeToday: "View today's order",
      prevClient: 'Previous customer', nextClient: 'Next customer', close: 'Close', since: 'Customer since {d}',
      weekly: 'Weekly spend', weeks: '13 weeks', history: 'History', lastN: 'last {n}', drTicket: 'Average order',
      palLabel: 'Commands', palPh: 'Search commands and customers', results: 'Results',
      gNav: 'Go to', gRange: 'Range', gLang: 'Language', gAct: 'Actions', gClients: 'Customers', gOrders: "Today's orders", gChan: 'Channel',
      cmdRange: 'Last {n} days', cmdFind: 'Find customer', palEmpty: 'No results for “{q}”',
      ordersToday: '{n} orders · {a}',
      fName: 'Name', fContact: 'Email or phone', fManage: 'What do you want to manage?',
      mOrders: 'Orders', mClients: 'Customers', mStock: 'Inventory', mAppts: 'Appointments', mPay: 'Payments', mDeliv: 'Deliveries',
      send: 'Send', sending: 'Sending', cancel: 'Cancel',
      errName: 'Enter your name.', errContact: 'Enter a valid email or phone.',
      done: 'Got it, {n}.', doneAnon: 'Got it.', doneP: 'This is a demo: nothing was sent.',
      notices: 'Notices', now: 'just now', minAgo: '{n} min ago', hAgo: '{n} h ago',
      dToday: 'today', dYesterday: 'yesterday', dAgo: '{n} d ago',
      evNew: 'Order from <b>{name}</b>', evPrep: '<b>{id}</b> in preparation', evListo: '<b>{id}</b> ready',
      evEntregado: '<b>{id}</b> delivered', evClient: 'New customer',
      tipOrders: '{n} orders', tipOrders1: '1 order', tipPrev: 'Previous {v}',
      chanChip: 'Channel: {c}', chanClear: 'Remove filter',
      sumChart: 'Revenue for the last {r} days: {v}, {d} vs. the previous period.',
      rangeAnn: 'Showing the last {n} days', langDone: 'Language: English',
      ch: ['Web', 'Messages', 'Counter', 'Phone'],
      wdMon: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      mo: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    },
  };
  const t = (k, v) => {
    let s = T[lang][k] != null ? T[lang][k] : T.es[k];
    if (v && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (_, n) => (v[n] != null ? v[n] : ''));
    return s;
  };

  /* ───────────────────────── Datos deterministas ───────────────────────── */
  const rnd = ((a) => () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  })(7291);
  const pickIdx = (ws) => {
    let tot = 0;
    for (const w of ws) tot += w;
    let x = rnd() * tot;
    for (let i = 0; i < ws.length; i++) { x -= ws[i]; if (x <= 0) return i; }
    return ws.length - 1;
  };

  const DAYS = 180, TODAY = 179, NOW = 16 * 60 + 40;
  const T0 = Date.now();
  const nowMin = () => NOW + (STILL ? 0 : Math.floor((Date.now() - T0) / 60000));
  const dateOf = (d) => new Date(2026, 8, 29 - (TODAY - d));
  const DOW = Array.from({ length: DAYS }, (_, d) => dateOf(d).getDay());

  const ITEMS = [
    ['Bizcocho de naranja', 'Orange sponge cake', 1850, 3],
    ['Tres leches', 'Tres leches cake', 2400, 3],
    ['Bizcocho dominicano', 'Dominican cake', 2900, 2.5],
    ['Pan sobao (12)', 'Soft rolls (12)', 480, 5],
    ['Galletas de avena', 'Oat cookies', 650, 4],
    ['Quipes (12)', 'Kibbeh (12)', 900, 3],
    ['Pastelitos de pollo (12)', 'Chicken turnovers (12)', 840, 4],
    ['Bandeja de bocadillos', 'Party platter', 3900, 1.4],
    ['Café de la casa (1 lb)', 'House coffee (1 lb)', 650, 3],
    ['Mini dulces (50)', 'Petit fours (50)', 2250, 1.4],
  ];
  // qué se pide según el canal: en mostrador, pan y café; por teléfono, encargos grandes
  const IW = ITEMS.map((x) => x[3]);
  const IW_STORE = [1, 1, 0.5, 7, 5, 4, 6, 0.3, 5, 0.3];
  const IW_PHONE = [2, 2, 4, 1, 1, 3, 2, 5, 1, 4];
  const NAMES = ('Mariela Soto,Joel Almonte,Carmen Rosario,Wendy Peralta,Luis Batista,Yokasta Féliz,Ramón Tavárez,Paola Jiménez,' +
    'Héctor Guzmán,Iris Mejía,Nelson Rosa,Katherine Núñez,Daniel Cabrera,Lorena Vásquez,Franklin Ureña,Sofía Liriano,' +
    'Andrés Polanco,Rosanna Pichardo,Miguel Fermín,Elena Castillo,Julio Encarnación,Patricia Holguín,Tomás Brito,Adriana Lora,' +
    'Ezequiel Santana,Marisol Gil,Víctor Reyes,Natalia Abreu,Omar Frías,Gisela Montás,Rafael Durán,Altagracia Peña,' +
    'César Valdez,Milagros Ortiz,Jonathan Espinal,Yanira Collado,Pedro Suero,Karina Solano,Manuel Arias,Estefany Vargas,' +
    'Alberto Cuevas,Dilenia Rodríguez,Fernando Tejada,Johanna Ramírez,Samuel Hernández,Leidy Morillo,Gustavo Paulino,' +
    'Mercedes Taveras,Ricardo Báez,Ana Grullón,Eduardo Sención,Viviana Checo,Kelvin Aquino,Raquel Méndez,Ismael Delgado,Belkis Familia').split(',');
  const AREAS = ['Gazcue', 'Naco', 'Piantini', 'Bella Vista', 'Los Cacicazgos', 'Evaristo Morales', 'Serrallés',
    'Julieta Morales', 'Arroyo Hondo', 'Los Prados', 'Zona Colonial', 'Mirador Norte', 'Paraíso', 'El Millón'];
  const JOIN = { 44: 96, 45: 104, 46: 113, 47: 121, 48: 129, 49: 137, 50: 144, 51: 152, 52: 160, 53: 167, 54: 173, 55: 179 };
  const LEAVE = { 5: 72, 12: 96, 20: 118, 27: 127, 36: 139, 41: 146 };

  const CLIENTS = NAMES.map((name, i) => {
    const p = name.split(' '), s = norm(name).split(' ');
    return {
      i, name, ini: p[0][0] + p[p.length - 1][0],
      email: s[0] + '.' + s[s.length - 1] + '@example.com',
      phone: '809-555-01' + String(i).padStart(2, '0'),
      area: AREAS[(i * 5 + 3) % AREAS.length],
      w: 0.4 + Math.pow(rnd(), 1.8) * 3.2,
      start: JOIN[i] != null ? JOIN[i] : 0,
      since: JOIN[i] != null ? null : new Date(2026, 3 - (7 + ((i * 7) % 26)), 1),
      end: LEAVE[i] != null ? LEAVE[i] : TODAY,
      orders: [],
    };
  });

  const WDF = [1.25, 0.7, 0.85, 0.9, 1, 1.2, 1.5];
  // días señalados: víspera y Día de las Madres (31 may), 16 de agosto, víspera y día de Las Mercedes (24 sep)
  const SPECIAL = { 57: 1.5, 58: 2.3, 135: 1.15, 173: 1.8, 174: 0.55 };
  const TODAY_TIMES = [431, 468, 522, 575, 634, 688, 742, 811, 873, 934, 973, 996];
  const ORDERS = [];
  let seq = 1180;
  for (let d = 0; d < DAYS; d++) {
    const f = d / TODAY;
    const lam = 6.4 * WDF[DOW[d]] * (1 + 0.45 * f) * (SPECIAL[d] || 1);
    const n = d === TODAY ? 12 : Math.max(2, Math.round(lam + (rnd() + rnd() + rnd() - 1.5) * 2));
    // quien entra ese día hace su primer pedido como «nuevo»; el resto, según su frecuencia
    const pool = CLIENTS.filter((c) => (c.start < d || c.start === 0) && c.end >= d);
    const pw = pool.map((c) => c.w);
    const joiners = d > 0 ? CLIENTS.filter((c) => c.start === d) : [];
    const cw = [0.16 + 0.26 * f * f, 0.4 - 0.1 * f, 0.28 - 0.05 * f + (d >= TODAY - 6 ? 0.16 : 0), 0.13 - 0.02 * f];
    const times = d === TODAY ? TODAY_TIMES : Array.from({ length: n }, () => 420 + Math.floor(rnd() * 720)).sort((a, b) => a - b);
    const used = new Set();
    for (let k = 0; k < n; k++) {
      const j = k - (n - joiners.length);
      let c = j >= 0 ? joiners[j] : pool[pickIdx(pw)];
      if (d === TODAY && j < 0) { let g = 0; while (used.has(c.i) && g++ < 40) c = pool[pickIdx(pw)]; }
      used.add(c.i);
      const ch = pickIdx(cw);
      const cnt = ch === 2 ? 1 + (rnd() < 0.2 ? 1 : 0) : ch === 3 ? 2 + (rnd() < 0.45 ? 1 : 0) : 1 + (rnd() < 0.5 ? 1 : 0) + (rnd() < 0.15 ? 1 : 0);
      const iw = ch === 2 ? IW_STORE : ch === 3 ? IW_PHONE : IW;
      const items = [];
      let amt = 0, guard = 0;
      while (items.length < cnt && guard++ < 12) {
        const it = pickIdx(iw);
        if (items.some((x) => x[0] === it)) continue;
        const q = rnd() < 0.22 ? 2 : 1;
        items.push([it, q]);
        amt += ITEMS[it][2] * q;
      }
      const o = { id: 'N-' + seq++, d, t: times[k], c: c.i, ch, items, amt };
      ORDERS.push(o);
      c.orders.push(o);
    }
  }

  const REV = [0, 1, 2, 3].map(() => new Float64Array(DAYS));
  const CNT = [0, 1, 2, 3].map(() => new Float64Array(DAYS));
  for (const o of ORDERS) { REV[o.ch][o.d] += o.amt; CNT[o.ch][o.d]++; }
  const sumArrs = (arrs) => {
    const out = new Float64Array(DAYS);
    for (const a of arrs) for (let d = 0; d < DAYS; d++) out[d] += a[d];
    return out;
  };
  const REV_ALL = sumArrs(REV), CNT_ALL = sumArrs(CNT);
  const revOf = (ch) => (ch == null ? REV_ALL : REV[ch]);
  const cntOf = (ch) => (ch == null ? CNT_ALL : CNT[ch]);

  for (const c of CLIENTS) {
    c.first = c.orders.length ? c.orders[0].d : null;
    c.last = c.orders.length ? c.orders[c.orders.length - 1].d : null;
    c.status = c.first != null && c.first >= TODAY - 13 ? 'new' : c.last != null && c.last >= TODAY - 29 ? 'active' : 'inactive';
  }

  // Tablero de hoy: los más antiguos ya salieron; los últimos acaban de entrar
  const TODAYS = ORDERS.filter((o) => o.d === TODAY);
  const BY_ID = {};
  TODAYS.forEach((o, k) => {
    BY_ID[o.id] = o;
    o.st = k < 4 ? 3 : k < 6 ? 2 : k < 9 ? 1 : 0;
    const tp = Math.min(o.t + 14 + ((o.c * 7) % 17), NOW - 9);
    const tl = Math.min(tp + 34 + ((o.c * 5) % 23), NOW - 5);
    const te = Math.min(tl + 18 + ((o.c * 3) % 15), NOW - 2);
    o.tt = [o.t, tp, tl, te];
  });
  const COLS = [[], [], [], []];
  TODAYS.slice().sort((a, b) => b.tt[b.st] - a.tt[a.st]).forEach((o) => COLS[o.st].push(o.id));

  const EVK = ['new', 'prep', 'listo', 'entregado'];
  const EVENTS = [];
  for (const o of TODAYS) {
    const fresh = CLIENTS[o.c].start === TODAY;
    if (fresh) EVENTS.push({ t: o.t - 0.001, k: 'client', o });
    for (let s = 0; s <= o.st; s++) EVENTS.push({ t: o.tt[s], k: EVK[s], o });
  }
  EVENTS.sort((a, b) => b.t - a.t);

  /* ───────────────────────── Cálculos ───────────────────────── */
  const sumRange = (arr, a, b) => { let s = 0; for (let d = Math.max(0, a); d <= b; d++) s += arr[d]; return s; };

  function stats(r, ch) {
    const rev = revOf(ch), cnt = cntOf(ch);
    const a = TODAY - r + 1;
    const R = sumRange(rev, a, TODAY), RP = sumRange(rev, a - r, a - 1);
    const C = sumRange(cnt, a, TODAY), CP = sumRange(cnt, a - r, a - 1);
    const wdS = [0, 0, 0, 0, 0, 0, 0], wdN = [0, 0, 0, 0, 0, 0, 0];
    for (let d = a; d <= TODAY; d++) { wdS[DOW[d]] += cnt[d]; wdN[DOW[d]]++; }
    const wd = [1, 2, 3, 4, 5, 6, 0].map((w) => (wdN[w] ? wdS[w] / wdN[w] : 0));
    const seen = new Set();
    for (const o of ORDERS) if (o.d >= a && (ch == null || o.ch === ch)) seen.add(o.c);
    let nw = 0;
    for (const c of CLIENTS) if (c.first != null && c.first >= a && seen.has(c.i)) nw++;
    return { rev: R, revP: RP, cnt: C, cntP: CP, tic: C ? R / C : 0, ticP: CP ? RP / CP : 0, act: seen.size, nw, wd };
  }
  const chanStats = (r, metric) => {
    const a = TODAY - r + 1, src = metric === 'revenue' ? REV : CNT;
    return [0, 1, 2, 3].map((i) => ({ i, v: sumRange(src[i], a, TODAY), p: sumRange(src[i], a - r, a - 1) }));
  };
  const CS = {};
  function clientStats(r) {
    if (CS[r]) return CS[r];
    const a = TODAY - r + 1;
    const out = CLIENTS.map(() => ({ n: 0, s: 0 }));
    for (const o of ORDERS) if (o.d >= a) { out[o.c].n++; out[o.c].s += o.amt; }
    return (CS[r] = out);
  }

  /* ───────────────────────── Formatos ───────────────────────── */
  const NF = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  const fmtN = (v) => NF.format(Math.round(v));
  const money = (v) => 'RD$ ' + fmtN(v);
  const moneyK = (v) => 'RD$ ' + (v >= 999500 ? (v / 1e6).toFixed(2) + 'M' : Math.round(v / 1000) + 'k');
  const pctOf = (v, p) => (p ? ((v - p) / p) * 100 : 0);
  const pctRound = (f) => Math.round(f * 100) + (lang === 'es' ? ' %' : '%');
  const pctTxt = (v) => {
    const s = (v >= 0.05 ? '+' : v <= -0.05 ? '−' : '') + Math.abs(v).toFixed(1);
    return lang === 'es' ? s + ' %' : s + '%';
  };
  const fmtDay = (d) => { const x = dateOf(d), m = t('mo')[x.getMonth()]; return lang === 'es' ? x.getDate() + ' ' + m : m + ' ' + x.getDate(); };
  const fmtWdDay = (d) => { const x = dateOf(d); return t('wd')[x.getDay()] + ' ' + x.getDate(); };
  const fmtLong = (d) => { const x = dateOf(d); return (lang === 'es' ? t('wd')[x.getDay()] + ' ' : t('wd')[x.getDay()] + ', ') + fmtDay(d); };
  const monthYear = (x) => t('mo')[x.getMonth()] + ' ' + x.getFullYear();
  const hm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(Math.floor(m) % 60).padStart(2, '0');
  const ago = (m) => { const x = Math.floor(nowMin() - m); return x < 1 ? t('now') : x < 60 ? t('minAgo', { n: x }) : t('hAgo', { n: Math.floor(x / 60) }); };
  const dayAgo = (d) => { const x = TODAY - d; return x === 0 ? t('dToday') : x === 1 ? t('dYesterday') : x < 30 ? t('dAgo', { n: x }) : fmtDay(d); };
  const itemsText = (o) => o.items.map(([i, q]) => ITEMS[i][lang === 'es' ? 0 : 1] + (q > 1 ? ' ×' + q : '')).join(' · ');
  const rangeTxt = (r) => r + ' d';
  const hl = (label, nq) => {
    if (!nq) return esc(label);
    const chars = Array.from(label), n = chars.map((c) => norm(c)).join('');
    const at = n.indexOf(nq);
    if (at < 0 || n.length !== chars.length) return esc(label);
    return esc(chars.slice(0, at).join('')) + '<mark>' + esc(chars.slice(at, at + nq.length).join('')) + '</mark>' + esc(chars.slice(at + nq.length).join(''));
  };
  const CHI = ['web', 'msg', 'store', 'phone'];
  const OS = ['osNuevo', 'osPrep', 'osListo', 'osEntregado'];
  const GO = ['goPrep', 'goListo', 'goEntregado'];
  const ST_KEY = { new: 'stNew', active: 'stActive', inactive: 'stInactive' };
  const ST_ORD = { new: 0, active: 1, inactive: 2 };

  /* ───────────────────────── Movimiento ───────────────────────── */
  function tween(dur, step, done) {
    const t0 = performance.now();
    let id = 0, alive = true;
    const f = (now) => {
      if (!alive) return;
      const p = clamp((now - t0) / dur, 0, 1);
      step(expo(p));
      if (p < 1) id = requestAnimationFrame(f);
      else if (done) done();
    };
    id = requestAnimationFrame(f);
    return () => { alive = false; cancelAnimationFrame(id); };
  }
  const fadeQuick = (el) => { if (!STILL && el.animate) el.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 100 }); };

  function countTo(el, to, fmt, animate, dur = 380) {
    if (!el) return;
    el.classList.remove('skel');
    const from = el._v != null ? el._v : 0;
    if (el._stop) { el._stop(); el._stop = null; }
    if (!animate || calm() || Math.abs(from - to) < 0.5) {
      const changed = el._v !== to;
      el._v = to;
      el.textContent = fmt(to);
      if (changed && animate && mqReduce.matches) fadeQuick(el);
      return;
    }
    el._stop = tween(dur, (p) => { const v = lerp(from, to, p); el._v = v; el.textContent = fmt(v); }, () => { el._v = to; el.textContent = fmt(to); el._stop = null; });
  }

  function flip(nodes, mutate, dur = 460) {
    if (calm()) { mutate(); return; }
    const first = nodes.map((n) => n.getBoundingClientRect());
    mutate();
    nodes.forEach((n, k) => {
      const a = first[k];
      if (!n.isConnected || (!a.width && !a.height)) return;
      const b = n.getBoundingClientRect();
      if (!b.width && !b.height) return;
      const dx = a.left - b.left, dy = a.top - b.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      n.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: dur, easing: EASE });
    });
  }

  const announce = (msg) => {
    const a = $('#announce');
    a.textContent = '';
    setTimeout(() => { a.textContent = msg; }, 40);
  };

  /* ───────────────────────── Gráfica de ingresos ───────────────────────── */
  const NS = 'http://www.w3.org/2000/svg';
  const r1 = (v) => Math.round(v * 10) / 10;
  function curve(xs, ys) {
    const n = xs.length;
    if (n < 2) return '';
    let d = 'M' + r1(xs[0]) + ',' + r1(ys[0]);
    const dx = [], s = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) { dx[i] = xs[i + 1] - xs[i] || 1e-6; s[i] = (ys[i + 1] - ys[i]) / dx[i]; }
    m[0] = s[0]; m[n - 1] = s[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (s[i - 1] * s[i] <= 0) m[i] = 0;
      else {
        const p = (s[i - 1] * dx[i] + s[i] * dx[i - 1]) / (dx[i - 1] + dx[i]);
        m[i] = (Math.sign(s[i - 1]) + Math.sign(s[i])) * Math.min(Math.abs(s[i - 1]), Math.abs(s[i]), 0.5 * Math.abs(p));
      }
    }
    for (let i = 0; i < n - 1; i++) {
      const h = dx[i] / 3;
      d += 'C' + r1(xs[i] + h) + ',' + r1(ys[i] + m[i] * h) + ',' + r1(xs[i + 1] - h) + ',' + r1(ys[i + 1] - m[i + 1] * h) + ',' + r1(xs[i + 1]) + ',' + r1(ys[i + 1]);
    }
    return d;
  }
  function niceTicks(max) {
    const raw = Math.max(max, 1) / 3.2;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / pow;
    const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow;
    const top = Math.ceil((max * 1.08) / step) * step;
    const vals = [];
    for (let v = 0; v <= top + 1e-6; v += step) vals.push(Math.round(v));
    return { top, vals };
  }
  const kLabel = (v) => (v === 0 ? '0' : v >= 1000 ? +(v / 1000).toFixed(1) + 'k' : String(v));

  function xLabels(r) {
    const out = [];
    for (let i = 90 - r; i < 90; i++) {
      const d = i + 90, x = dateOf(d);
      if (r === 7) out.push({ i, s: fmtWdDay(d) });
      else if (r === 30 ? x.getDay() === 1 : x.getDate() === 1 || x.getDate() === 15) out.push({ i, s: fmtDay(d) });
    }
    return out;
  }
  function chartTarget(r, ch) {
    const src = revOf(ch), cnt = cntOf(ch);
    const m = new Float64Array(90), p = new Float64Array(90), c = new Float64Array(90);
    for (let i = 0; i < 90; i++) { m[i] = src[i + 90]; p[i] = src[i + 90 - r]; c[i] = cnt[i + 90]; }
    const x0 = 90 - r;
    let mx = 0;
    for (let i = x0; i < 90; i++) mx = Math.max(mx, m[i], p[i]);
    const tk = niceTicks(mx);
    return { m, p, c, x0, y: tk.top, ticks: tk.vals, labels: xLabels(r), r, ch };
  }

  function Chart(el) {
    const svg = $('svg', el), grid = $('.grid', svg), ylab = $('.ylab', svg), area = $('.area', svg), lp = $('.line--prev', svg), lm = $('.line--main', svg);
    const dotsG = $('.dots', svg), xh = $('.xhair', svg), dm = $('.dot--main', svg), dp = $('.dot--prev', svg), clip = $('#clip-r', svg);
    const xl = $('.chart__x', el), tip = $('.tip', el);
    const PT = 22, PB = 30;
    let W = 0, H = 0, cur = null, live = null, stop = null, hover = -1, animating = false;
    let ticks = [], labels = [];
    const dotEls = [];
    for (let i = 0; i < 90; i++) { const c = doc.createElementNS(NS, 'circle'); c.setAttribute('r', '3.5'); dotsG.appendChild(c); dotEls.push(c); }

    const measure = () => {
      W = svg.clientWidth; H = svg.clientHeight;
      clip.setAttribute('width', W); clip.setAttribute('height', H);
      for (const tk of ticks) tk.line.setAttribute('x2', W);
    };
    const X = (s, i) => ((i - s.x0) / (89 - s.x0)) * W;
    const Y = (s, v) => PT + (H - PT - PB) - (v / s.y) * (H - PT - PB);

    // la línea de la marca va bajo el trazo; su cifra, encima y con halo
    function makeTick(v) {
      const g = doc.createElementNS(NS, 'g');
      const line = doc.createElementNS(NS, 'line');
      line.setAttribute('x1', 0); line.setAttribute('x2', W);
      if (v === 0) g.setAttribute('class', 'is-zero');
      g.append(line);
      grid.appendChild(g);
      const tg = doc.createElementNS(NS, 'text');
      tg.setAttribute('x', 0);
      tg.textContent = kLabel(v);
      ylab.appendChild(tg);
      return { v, g, tg, line, a: 0, b: 1 };
    }
    function makeLabel(l) {
      const s = doc.createElement('span');
      s.textContent = l.s;
      xl.appendChild(s);
      return { i: l.i, key: l.i + '|' + l.s, el: s, w: s.offsetWidth, a: 0, b: 1 };
    }

    function draw(s, p) {
      if (!W) return;
      const i0 = Math.max(0, Math.floor(s.x0) - 1);
      const xs = [], ym = [], yp = [];
      for (let i = i0; i < 90; i++) { xs.push(X(s, i)); ym.push(Y(s, s.m[i])); yp.push(Y(s, s.p[i])); }
      const dM = curve(xs, ym);
      const base = r1(H - PB);
      // cuanto más denso el tramo, más fino el trazo
      lm.style.strokeWidth = r1(clamp(2.4 - ((89 - s.x0 - 29) / 60) * 0.75, 1.65, 2.4));
      lm.setAttribute('d', dM);
      lp.setAttribute('d', curve(xs, yp));
      area.setAttribute('d', dM + 'L' + r1(xs[xs.length - 1]) + ',' + base + 'L' + r1(xs[0]) + ',' + base + 'Z');
      const gap = W / (89 - s.x0), op = clamp((gap - 30) / 40, 0, 1);
      dotsG.style.opacity = op;
      if (op > 0) for (let i = 0; i < 90; i++) {
        const c = dotEls[i];
        if (i < Math.ceil(s.x0) - 1) { c.setAttribute('cx', -20); continue; }
        c.setAttribute('cx', r1(X(s, i))); c.setAttribute('cy', r1(Y(s, s.m[i])));
      }
      for (const tk of ticks) {
        const y = r1(Y(s, tk.v)), o = lerp(tk.a, tk.b, p);
        tk.g.setAttribute('transform', 'translate(0,' + y + ')');
        tk.tg.setAttribute('y', r1(y - 6));
        tk.g.style.opacity = o;
        tk.tg.style.opacity = o;
      }
      // etiquetas de fecha: se mueven con su día; si chocan, cede la de la derecha
      let lastR = -Infinity;
      const placed = labels.map((lb) => ({ lb, x: clamp(X(s, lb.i) - lb.w / 2, 0, W - lb.w) })).sort((a, b) => a.x - b.x);
      for (const q of placed) {
        const lb = q.lb;
        let o = lerp(lb.a, lb.b, p);
        if (lb.b === 1) { if (q.x < lastR + 12) o = 0; else lastR = q.x + lb.w; }
        lb.el.style.transform = 'translate(' + r1(q.x) + 'px,0)';
        lb.el.style.opacity = o;
      }
    }

    function set(tg, animate) {
      tg.key = tg.r + '|' + tg.ch + '|' + lang;
      if (cur && !live && cur.key === tg.key) { measure(); draw(cur, 1); return; }
      measure();
      hide();
      if (stop) { stop(); stop = null; }
      const from = live || cur;
      // marcas del eje: las que siguen, entran o salen
      const keep = new Set(tg.ticks);
      ticks = ticks.filter((tk) => {
        if (tk.b === 0) { tk.g.remove(); tk.tg.remove(); return false; }
        return true;
      });
      for (const tk of ticks) { tk.a = 1; tk.b = keep.has(tk.v) ? 1 : 0; }
      for (const v of tg.ticks) if (!ticks.some((tk) => tk.v === v)) ticks.push(makeTick(v));
      const lkeep = new Set(tg.labels.map((l) => l.i + '|' + l.s));
      labels = labels.filter((lb) => { if (lb.b === 0) { lb.el.remove(); return false; } return true; });
      for (const lb of labels) { lb.a = 1; lb.b = lkeep.has(lb.key) ? 1 : 0; }
      for (const l of tg.labels) if (!labels.some((lb) => lb.key === l.i + '|' + l.s)) labels.push(makeLabel(l));

      const finish = () => {
        cur = tg; live = null; animating = false;
        ticks = ticks.filter((tk) => { if (tk.b === 0) { tk.g.remove(); tk.tg.remove(); return false; } tk.a = tk.b = 1; return true; });
        labels = labels.filter((lb) => { if (lb.b === 0) { lb.el.remove(); return false; } lb.a = lb.b = 1; return true; });
        draw(cur, 1);
      };
      if (!animate || calm() || !W) {
        finish();
        if (animate && mqReduce.matches && !STILL) fadeQuick(svg);
        return;
      }
      const src = from || { m: new Float64Array(90), p: new Float64Array(90), x0: tg.x0, y: tg.y };
      const s = { m: new Float64Array(90), p: new Float64Array(90), x0: src.x0, y: src.y };
      animating = true;
      stop = tween(640, (p) => {
        for (let i = 0; i < 90; i++) { s.m[i] = lerp(src.m[i], tg.m[i], p); s.p[i] = lerp(src.p[i], tg.p[i], p); }
        s.x0 = lerp(src.x0, tg.x0, p);
        s.y = lerp(src.y, tg.y, p);
        live = s;
        draw(s, p);
      }, finish);
    }

    function showAt(i, byKey) {
      if (!cur || animating || !W) return;
      i = clamp(Math.round(i), Math.ceil(cur.x0), 89);
      hover = i;
      const s = cur, x = r1(X(s, i)), ym = Y(s, s.m[i]), yp = Y(s, s.p[i]);
      xh.setAttribute('x1', x); xh.setAttribute('x2', x); xh.setAttribute('y1', PT - 8); xh.setAttribute('y2', H - PB);
      dm.setAttribute('cx', x); dm.setAttribute('cy', r1(ym));
      dp.setAttribute('cx', x); dp.setAttribute('cy', r1(yp));
      const n = s.c[i];
      $('#tip-d').textContent = fmtLong(i + 90);
      $('#tip-v').textContent = money(s.m[i]);
      $('#tip-o').textContent = n === 1 ? t('tipOrders1') : t('tipOrders', { n: fmtN(n) });
      $('#tip-p').textContent = t('tipPrev', { v: money(s.p[i]) });
      const tw = tip.offsetWidth;
      let left = x + 14;
      if (left + tw > W) left = x - 14 - tw;
      tip.style.transform = 'translate(' + r1(clamp(left, 0, Math.max(0, W - tw))) + 'px,0)';
      el.classList.add('has-tip');
      if (byKey) announce(fmtLong(i + 90) + ': ' + money(s.m[i]) + ', ' + $('#tip-o').textContent);
    }
    function hide() { el.classList.remove('has-tip'); }

    const fromPointer = (e) => {
      if (!cur) return;
      const b = svg.getBoundingClientRect();
      showAt(cur.x0 + ((e.clientX - b.left) / W) * (89 - cur.x0));
    };
    el.addEventListener('pointermove', fromPointer);
    el.addEventListener('pointerdown', fromPointer);
    el.addEventListener('pointerleave', () => { if (doc.activeElement !== el) hide(); });
    el.addEventListener('focus', () => showAt(hover >= 0 ? hover : 89, true));
    el.addEventListener('blur', hide);
    el.addEventListener('keydown', (e) => {
      if (!cur) return;
      let i = hover < 0 ? 89 : hover;
      const k = e.key;
      if (k === 'ArrowLeft') i--;
      else if (k === 'ArrowRight') i++;
      else if (k === 'Home') i = Math.ceil(cur.x0);
      else if (k === 'End') i = 89;
      else if (k === 'PageUp') i -= 7;
      else if (k === 'PageDown') i += 7;
      else if (k === 'Escape') { if (el.classList.contains('has-tip')) { e.preventDefault(); hide(); } return; }
      else return;
      e.preventDefault();
      showAt(i, true);
    });
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => {
        const w = svg.clientWidth;
        if (w === W && svg.clientHeight === H) return;
        measure();
        for (const lb of labels) lb.w = lb.el.offsetWidth;
        if (live || cur) draw(live || cur, 1);
      }).observe(el);
    }
    const relabel = () => {
      for (const lb of labels) lb.w = lb.el.offsetWidth;
      if (!animating && cur) draw(cur, 1);
    };
    return { set, hide, relabel };
  }

  /* ───────────────────────── Estado ───────────────────────── */
  const VIEWS = ['resumen', 'clientes', 'pedidos'];
  const state = { view: null, range: 30, ch: null, metric: 'orders', sort: { k: 'spent', dir: -1 }, filter: 'all', q: '', sel: null, errOnce: false, chanErr: false };
  let chart = null;

  /* ───────────────────────── Resumen ───────────────────────── */
  function setDelta(el, v, p, prevTxt) {
    const d = pctOf(v, p);
    $('.delta__v', el).textContent = pctTxt(d);
    el.classList.toggle('is-down', d <= -0.05);
    if (prevTxt != null) $('.delta__vs', el).textContent = t('vsN', { v: prevTxt });
  }
  function renderResumen(animate) {
    const r = state.range, ch = state.ch, S = stats(r, ch);
    countTo($('#k-rev'), S.rev, fmtN, animate, 400);
    setDelta($('#k-rev-d'), S.rev, S.revP);
    countTo($('#k-ord'), S.cnt, fmtN, animate);
    setDelta($('#k-ord-d'), S.cnt, S.cntP, fmtN(S.cntP));
    countTo($('#k-tic'), S.tic, fmtN, animate);
    setDelta($('#k-tic-d'), S.tic, S.ticP, money(S.ticP));
    countTo($('#k-act'), S.act, fmtN, animate, 300);
    $('#k-act-of').textContent = t('ofTotal', { n: CLIENTS.length });
    $('#k-act-bar').style.setProperty('--v', (S.act / CLIENTS.length).toFixed(3));
    $('#k-act-new').textContent = S.nw === 0 ? t('new0') : S.nw === 1 ? t('new1') : t('newN', { n: S.nw });
    const mx = Math.max(...S.wd, 1);
    $$('#wd .wd__col').forEach((col, k) => {
      $('.wd__bar', col).style.setProperty('--v', Math.max(0.04, S.wd[k] / mx).toFixed(3));
      col.classList.toggle('is-max', S.wd[k] === mx);
      $('.wd__l', col).textContent = t('wdMon')[k];
    });
    chart.set(chartTarget(r, ch), animate);
    $('#chart-sum').textContent = t('sumChart', { r, v: money(S.rev), d: pctTxt(pctOf(S.rev, S.revP)) });
    if (!state.chanErr) renderChannels(animate);
    renderActivity();
    renderChip();
  }

  const chanRows = [];
  function renderChannels(animate) {
    const box = $('#chan');
    if (!chanRows.length) {
      for (let i = 0; i < 4; i++) {
        const b = doc.createElement('button');
        b.type = 'button';
        b.className = 'chan__row';
        b.dataset.ch = i;
        b.innerHTML = '<span class="chan__name">' + icon(CHI[i]) + '<span class="chan__nt"><span class="chan__n"></span><span class="chan__share"></span></span></span>' +
          '<span class="chan__track" aria-hidden="true"><span class="chan__fill"></span></span>' +
          '<span class="chan__v"></span><span class="sr chan__sr"></span><span class="chan__d"></span>';
        chanRows.push(b);
        box.appendChild(b);
      }
    }
    const rev = state.metric === 'revenue';
    const cs = chanStats(state.range, state.metric);
    const max = Math.max(...cs.map((c) => c.v), 1);
    const total = cs.reduce((a, c) => a + c.v, 0) || 1;
    const sorted = cs.slice().sort((a, b) => b.v - a.v || a.i - b.i);
    const rows = sorted.map((c) => chanRows[c.i]);
    const moved = rows.some((row, k) => box.children[k] !== row);
    if (moved) flip(Array.from(box.children), () => rows.forEach((row) => box.appendChild(row)), 520);
    for (const c of sorted) {
      const row = chanRows[c.i];
      $('.chan__n', row).textContent = t('ch')[c.i];
      $('.chan__share', row).textContent = t('shareOf', { p: pctRound(c.v / total) });
      $('.chan__fill', row).style.setProperty('--v', (c.v / max).toFixed(3));
      const v = $('.chan__v', row);
      if (v._m !== state.metric) { if (v._stop) { v._stop(); v._stop = null; } v._m = state.metric; v._v = 0; }
      countTo(v, c.v, rev ? moneyK : fmtN, animate, 320);
      $('.chan__sr', row).textContent = rev ? ',' : ' ' + t('ordersWord') + ',';
      const d = pctOf(c.v, c.p);
      const dEl = $('.chan__d', row);
      dEl.textContent = pctTxt(d);
      dEl.classList.toggle('is-down', d <= -0.05);
      row.setAttribute('aria-pressed', String(state.ch === c.i));
    }
    box.classList.toggle('has-sel', state.ch != null);
  }
  function setMetric(m) {
    if (m === state.metric) return;
    state.metric = m;
    checkRadio($('#chan-metric'), $('#chan-metric [data-m="' + m + '"]'));
    if (!state.chanErr) renderChannels(true);
  }
  function setChannel(i) {
    state.ch = state.ch === i ? null : i;
    renderResumen(true);
    announce(state.ch == null ? t('chanClear') : t('chanChip', { c: t('ch')[state.ch] }));
  }
  function renderChip() {
    const chip = $('#chan-chip');
    const on = state.view === 'resumen' && state.ch != null;
    chip.hidden = !on;
    if (on) $('#chan-chip-t').innerHTML = '<span class="sr">' + esc(t('chanClear')) + ': </span>' + esc(t('chanChip', { c: t('ch')[state.ch] }));
  }
  function showChanErr(on) {
    $('#chan').hidden = on;
    $('#chan-err').hidden = !on;
  }

  function evText(ev) {
    const o = ev.o, c = CLIENTS[o.c], name = esc(c.name);
    if (ev.k === 'client') return { ic: 'userplus', acc: true, main: esc(t('evClient')), sub: name + '<span class="sep" aria-hidden="true">·</span>' + esc(c.area) };
    const amt = '<span class="mono">' + money(o.amt) + '</span>', sep = '<span class="sep" aria-hidden="true">·</span>';
    if (ev.k === 'new') return { ic: 'plus', acc: true, main: t('evNew', { name }), sub: '<span class="mono">' + o.id + '</span>' + sep + amt + sep + esc(t('ch')[o.ch]) };
    const key = { prep: 'evPrep', listo: 'evListo', entregado: 'evEntregado' }[ev.k];
    return { ic: { prep: 'orders', listo: 'check', entregado: 'enter' }[ev.k], acc: false, main: t(key, { id: '<span class="mono">' + o.id + '</span>' }), sub: name + sep + amt };
  }
  function renderActivity() {
    $('#act').innerHTML = EVENTS.slice(0, 5).map((ev) => {
      const x = evText(ev);
      const li = '<li' + (ev.fresh && !calm() ? ' class="is-new"' : '') + '><button type="button" class="act__item" data-client="' + ev.o.c + '">' +
        '<span class="act__ic' + (x.acc ? ' is-accent' : '') + '">' + icon(x.ic) + '</span>' +
        '<span class="act__top"><span class="act__main">' + x.main + '</span><span class="act__time mono">' + esc(ago(ev.t)) + '</span></span>' +
        '<span class="act__sub">' + x.sub + '</span></button></li>';
      ev.fresh = false;
      return li;
    }).join('');
  }

  /* ───────────────────────── Clientes ───────────────────────── */
  const rowMap = [];
  function buildRows() {
    for (const c of CLIENTS) {
      const tr = doc.createElement('tr');
      tr.dataset.id = c.i;
      tr.innerHTML = '<td class="td-name"><button type="button" class="rowbtn"><span class="avatar" aria-hidden="true">' + esc(c.ini) + '</span>' +
        '<span class="rowbtn__t"><span class="rowbtn__n"></span><span class="rowbtn__s"></span></span></button></td>' +
        '<td class="td-area"></td><td class="td-num td-orders"></td>' +
        '<td class="td-num td-spent"><span class="td-spent__v"></span><span class="td-sub"></span></td>' +
        '<td class="td-last"></td><td class="td-status"></td>';
      rowMap[c.i] = tr;
    }
  }
  const sorters = {
    name: (a, b) => a.name.localeCompare(b.name, lang),
    area: (a, b) => a.area.localeCompare(b.area, lang) || a.name.localeCompare(b.name, lang),
    orders: (a, b, st) => st[a.i].n - st[b.i].n || st[a.i].s - st[b.i].s,
    spent: (a, b, st) => st[a.i].s - st[b.i].s || st[a.i].n - st[b.i].n,
    last: (a, b) => (a.last ?? -1) - (b.last ?? -1),
    status: (a, b) => ST_ORD[a.status] - ST_ORD[b.status] || a.name.localeCompare(b.name, lang),
  };
  function tableList() {
    const st = clientStats(state.range), nq = norm(state.q.trim());
    const matched = CLIENTS.filter((c) => !nq || norm(c.name + ' ' + c.area + ' ' + c.email + ' ' + c.phone).includes(nq));
    const list = matched.filter((c) => state.filter === 'all' || c.status === state.filter);
    const { k, dir } = state.sort;
    list.sort((a, b) => dir * sorters[k](a, b, st) || a.i - b.i);
    return { list, matched, st, nq };
  }
  function renderTable(animate) {
    const { list, matched, st, nq } = tableList();
    const counts = { all: matched.length, active: 0, new: 0, inactive: 0 };
    for (const c of matched) counts[c.status]++;
    $$('#cfilter .seg__opt').forEach((b) => { $('.seg__n', b).textContent = counts[b.dataset.f]; });
    $('#th-orders').textContent = t('thOrders', { r: rangeTxt(state.range) });
    $('#th-spent').textContent = t('thSpent', { r: rangeTxt(state.range) });
    $$('#ctable th').forEach((th) => {
      if (th.dataset.sort === state.sort.k) th.setAttribute('aria-sort', state.sort.dir > 0 ? 'ascending' : 'descending');
      else th.removeAttribute('aria-sort');
    });
    for (const c of list) {
      const tr = rowMap[c.i], s = st[c.i];
      $('.rowbtn__n', tr).innerHTML = hl(c.name, nq);
      $('.rowbtn__s', tr).textContent = c.area + ' · ' + (c.last != null ? dayAgo(c.last) : '');
      $('.td-area', tr).textContent = c.area;
      $('.td-orders', tr).textContent = fmtN(s.n);
      $('.td-spent__v', tr).textContent = money(s.s);
      $('.td-sub', tr).textContent = t('ordersN', { n: s.n });
      $('.td-last', tr).textContent = c.last != null ? dayAgo(c.last) : '';
      $('.td-status', tr).innerHTML = '<span class="badge badge--' + c.status + '">' + esc(t(ST_KEY[c.status])) + '</span>';
      tr.classList.toggle('is-sel', state.sel === c.i && $('#drawer').open);
    }
    const body = $('#cbody');
    const before = Array.from(body.children);
    const had = new Set(before);
    const apply = () => body.replaceChildren(...list.map((c) => rowMap[c.i]));
    if (animate) flip(before, apply, 440); else apply();
    if (animate && !calm()) for (const c of list) {
      const tr = rowMap[c.i];
      if (!had.has(tr)) { tr.classList.remove('is-in'); void tr.offsetWidth; tr.classList.add('is-in'); }
    }
    const empty = !list.length;
    $('#cempty').hidden = !empty;
    $('#ctable').classList.toggle('is-empty', empty);
    if (empty) {
      const byQ = !!state.q.trim() && !matched.length;
      $('#cempty-t').textContent = byQ ? t('emptyQ', { q: state.q.trim() }) : t('emptyF');
      const btn = $('#cempty-btn');
      btn.textContent = byQ ? t('clearQ') : t('showAll');
      btn.dataset.act = byQ ? 'q' : 'f';
    }
    $('#ccount').textContent = t('countOf', { a: list.length, b: CLIENTS.length });
  }
  function setSort(k) {
    if (state.sort.k === k) state.sort.dir *= -1;
    else state.sort = { k, dir: k === 'name' || k === 'area' || k === 'status' ? 1 : -1 };
    renderTable(true);
  }
  function setFilter(f) {
    state.filter = f;
    checkRadio($('#cfilter'), $('#cfilter [data-f="' + f + '"]'));
    renderTable(true);
  }

  /* ───────────────────────── Pedidos ───────────────────────── */
  const cardMap = {};
  function fillCard(o) {
    const li = cardMap[o.id], c = CLIENTS[o.c];
    li.innerHTML = '<div class="order__top"><span class="mono order__id">' + o.id + '</span><span class="mono">' + hm(o.t) + '</span></div>' +
      '<button type="button" class="order__who" data-client="' + c.i + '">' + esc(c.name) + '</button>' +
      '<p class="order__items">' + esc(itemsText(o)) + '</p>' +
      '<div class="order__foot"><span class="order__ch">' + icon(CHI[o.ch]) + esc(t('ch')[o.ch]) + '</span><span class="order__amt">' + money(o.amt) + '</span></div>' +
      (o.st < 3
        ? '<button type="button" class="order__next" data-advance="' + o.id + '"><span>' + esc(t(GO[o.st])) + '<span class="sr"> ' + o.id + '</span></span>' + icon('arrow') + '</button>'
        : '<span class="order__done">' + icon('check') + hm(o.tt[3]) + '</span>');
  }
  function buildBoard() {
    for (const o of TODAYS) {
      const li = doc.createElement('li');
      li.className = 'order';
      li.tabIndex = -1;
      li.dataset.id = o.id;
      cardMap[o.id] = li;
      fillCard(o);
    }
    for (let s = 0; s < 4; s++) placeCol(s);
  }
  const colList = (s) => $('.col[data-col="' + ['nuevo', 'prep', 'listo', 'entregado'][s] + '"] .col__list');
  function placeCol(s) {
    const ol = colList(s);
    if (!COLS[s].length) ol.innerHTML = '<li class="col__empty">' + esc(t('noOrders')) + '</li>';
    else ol.replaceChildren(...COLS[s].map((id) => cardMap[id]));
  }
  function updateCounts() {
    $$('.col').forEach((col, s) => { $('.col__n', col).textContent = COLS[s].length; });
    const badge = $('#nav-orders');
    badge.textContent = COLS[0].length || '';
    if (state.view === 'pedidos') renderHead();
  }
  function moveOrder(id, to, idx) {
    const o = BY_ID[id], from = o.st;
    const cards = $$('.order', $('#board'));
    flip(cards, () => {
      COLS[from].splice(COLS[from].indexOf(id), 1);
      if (idx == null) COLS[to].unshift(id); else COLS[to].splice(idx, 0, id);
      o.st = to;
      if (to === 3 && from < 3) o.tt[3] = nowMin();
      fillCard(o);
      placeCol(from);
      placeCol(to);
    }, 520);
    updateCounts();
    const card = cardMap[id];
    if (!calm()) { card.classList.remove('is-flash'); void card.offsetWidth; card.classList.add('is-flash'); }
  }
  function focusAfterMove(id, fromCol, fromIdx) {
    const card = cardMap[id];
    const b = card.getBoundingClientRect();
    const visible = b.top >= 0 && b.bottom <= innerHeight;
    const target = visible ? $('.order__next', card) || card : (() => {
      const ids = COLS[fromCol];
      const next = ids[Math.min(fromIdx, ids.length - 1)];
      return next ? $('.order__next', cardMap[next]) || cardMap[next] : card;
    })();
    target.focus({ preventScroll: visible });
  }
  function advance(id) {
    const o = BY_ID[id];
    if (!o || o.st >= 3) return;
    const from = o.st, fromIdx = COLS[from].indexOf(id), to = from + 1;
    moveOrder(id, to);
    const ev = { t: nowMin(), k: EVK[to], o, fresh: true };
    EVENTS.unshift(ev);
    focusAfterMove(id, from, fromIdx);
    toast(t('movedTo', { id, s: t(OS[to]) }), {
      label: t('undo'), icon: 'undo',
      run: () => {
        moveOrder(id, from, fromIdx);
        const k = EVENTS.indexOf(ev);
        if (k >= 0) EVENTS.splice(k, 1);
        announce(t('undone', { id, s: t(OS[from]) }));
        const btn = $('.order__next', cardMap[id]);
        (btn || cardMap[id]).focus({ preventScroll: true });
      },
    }, id);
  }
  function showOrder(id) {
    setView('pedidos');
    const card = cardMap[id];
    if (!card) return;
    card.scrollIntoView({ block: 'center', behavior: calm() ? 'auto' : 'smooth' });
    if (!calm()) { card.classList.remove('is-flash'); void card.offsetWidth; card.classList.add('is-flash'); }
    ($('.order__next', card) || card).focus({ preventScroll: true });
  }

  /* ───────────────────────── Avisos ───────────────────────── */
  function toast(msg, action, key) {
    const box = $('#toasts');
    if (key) for (const old of Array.from(box.children)) if (old.dataset.key === key) old.remove();
    while (box.children.length > 2) box.firstElementChild.remove();
    const el = doc.createElement('div');
    el.className = 'toast';
    if (key) el.dataset.key = key;
    el.innerHTML = icon('check', 'toast__ic') + '<span>' + esc(msg) + '</span>' +
      (action ? '<button type="button" class="toast__act">' + icon(action.icon) + '<span>' + esc(action.label) + '</span></button>' : '');
    box.appendChild(el);
    announce(msg);
    let timer = 0, remain = 5000, started = 0;
    const close = () => {
      if (el._closed) return;
      el._closed = true;
      clearTimeout(timer);
      if (calm()) { el.remove(); return; }
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 240);
    };
    const start = () => { started = Date.now(); clearTimeout(timer); timer = setTimeout(close, remain); };
    const pause = () => { clearTimeout(timer); remain = Math.max(1200, remain - (Date.now() - started)); };
    el.addEventListener('pointerenter', pause);
    el.addEventListener('pointerleave', start);
    el.addEventListener('focusin', pause);
    el.addEventListener('focusout', start);
    if (action) $('.toast__act', el).addEventListener('click', () => { close(); action.run(); });
    start();
  }

  /* ───────────────────────── Diálogos ───────────────────────── */
  const openDialogs = [];
  function openDialog(d, opener) {
    if (d._closing && d._finish) d._finish();
    d._opener = opener || doc.activeElement;
    d.classList.remove('is-closing');
    if (!d.open) d.showModal();
    if (!openDialogs.includes(d)) openDialogs.push(d);
  }
  // restore: devolver el foco a quien abrió · instant: sin animación · then: acción tras cerrar
  function closeDialog(d, { restore = true, instant = false, then = null } = {}) {
    if (!d.open || d._closing) { if (then) then(); return; }
    d._closing = true;
    const finish = () => {
      if (!d._closing) return;
      d._closing = false;
      d.classList.remove('is-closing');
      d.close();
      const k = openDialogs.indexOf(d);
      if (k >= 0) openDialogs.splice(k, 1);
      if (d.id === 'drawer') { state.sel = null; $$('#cbody tr.is-sel').forEach((tr) => tr.classList.remove('is-sel')); }
      const o = d._opener;
      if (restore && o && o.isConnected && typeof o.focus === 'function') o.focus({ preventScroll: true });
      if (then) then();
    };
    d._finish = finish;
    if (instant || calm()) { finish(); return; }
    d.classList.add('is-closing');
    d.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, 280);
  }
  for (const d of $$('dialog')) {
    d.addEventListener('cancel', (e) => { e.preventDefault(); closeDialog(d); });
    d.addEventListener('click', (e) => {
      if (e.target !== d) return;
      const b = d.getBoundingClientRect();
      const inside = e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom;
      if (!inside) closeDialog(d);
    });
  }

  /* ── Panel lateral del cliente ── */
  const drawer = $('#drawer');
  function navIds() {
    const ids = tableList().list.map((c) => c.i);
    if (ids.includes(state.sel)) return ids;
    const all = CLIENTS.slice(), st = clientStats(state.range), { k, dir } = state.sort;
    all.sort((a, b) => dir * sorters[k](a, b, st) || a.i - b.i);
    return all.map((c) => c.i);
  }
  function renderDrawer(swap) {
    const c = CLIENTS[state.sel], r = state.range, s = clientStats(r)[c.i];
    const weeks = [];
    for (let w = 12; w >= 0; w--) {
      const b = TODAY - w * 7, a = b - 6;
      weeks.push(c.orders.reduce((acc, o) => acc + (o.d >= a && o.d <= b ? o.amt : 0), 0));
    }
    const wmax = Math.max(...weeks, 1);
    const hist = c.orders.slice(-8).reverse();
    const todayOrder = c.orders.find((o) => o.d === TODAY);
    $('#dr-body').innerHTML =
      '<div class="dr-head"><span class="avatar" aria-hidden="true">' + esc(c.ini) + '</span><div class="dr-head__t">' +
      '<h2 class="dr-name" id="dr-name" tabindex="-1">' + esc(c.name) + '</h2>' +
      '<span><span class="badge badge--' + c.status + '">' + esc(t(ST_KEY[c.status])) + '</span></span></div></div>' +
      '<ul class="dr-contact">' +
      '<li>' + icon('mail') + '<span class="mono">' + esc(c.email) + '</span></li>' +
      '<li>' + icon('phone') + '<span class="mono">' + esc(c.phone) + '</span></li>' +
      '<li>' + icon('pin') + '<span>' + esc(c.area) + '</span></li>' +
      '<li>' + icon('calendar') + '<span>' + esc(t('since', { d: c.since ? monthYear(c.since) : c.first != null ? monthYear(dateOf(c.first)) : '' })) + '</span></li></ul>' +
      '<dl class="dr-stats">' +
      '<div><dt>' + esc(t('thOrders', { r: rangeTxt(r) })) + '</dt><dd>' + fmtN(s.n) + '</dd></div>' +
      '<div><dt>' + esc(t('thSpent', { r: rangeTxt(r) })) + '</dt><dd>' + money(s.s) + '</dd></div>' +
      '<div><dt>' + esc(t('drTicket')) + '</dt><dd>' + money(s.n ? s.s / s.n : 0) + '</dd></div></dl>' +
      '<section class="dr-sec" aria-labelledby="dr-w"><h3 class="dr-sec__h" id="dr-w">' + esc(t('weekly')) + '<span class="dr-sec__m">' + esc(t('weeks')) + '</span></h3>' +
      '<div class="spark" role="img" aria-label="' + esc(t('weekly') + ': ' + weeks.map((v) => money(v)).join(', ')) + '">' +
      weeks.map((v, k) => '<span' + (v ? '' : ' class="is-zero"') + ' style="--v:' + Math.max(0.04, v / wmax).toFixed(3) + ';--i:' + k + '"></span>').join('') + '</div>' +
      '<div class="spark__x" aria-hidden="true"><span>' + esc(fmtDay(TODAY - 90)) + '</span><span>' + esc(fmtDay(TODAY)) + '</span></div></section>' +
      '<section class="dr-sec" aria-labelledby="dr-h"><h3 class="dr-sec__h" id="dr-h">' + esc(t('history')) + '<span class="dr-sec__m">' + esc(t('lastN', { n: hist.length })) + '</span></h3><ol class="hist">' +
      hist.map((o) => '<li><span class="hist__d mono">' + esc(fmtDay(o.d)) + '</span><span class="hist__t"><span class="hist__id mono">' + o.id +
        (o.d === TODAY ? ' · ' + esc(t(OS[o.st])) : '') + '</span><span class="hist__items">' + esc(itemsText(o)) + '</span></span><span class="hist__a">' + money(o.amt) + '</span></li>').join('') +
      '</ol></section>' +
      '<div class="dr-actions"><button type="button" class="btn btn--ghost" data-copy="' + esc(c.email) + '">' + icon('copy') + '<span>' + esc(t('copyEmail')) + '</span></button>' +
      (todayOrder ? '<button type="button" class="btn btn--ghost" data-see-order="' + todayOrder.id + '">' + icon('orders') + '<span>' + esc(t('seeToday')) + '</span></button>' : '') + '</div>';
    const body = $('#dr-body');
    if (swap && !calm()) { body.classList.remove('is-swap'); void body.offsetWidth; body.classList.add('is-swap'); }
    if (swap) body.scrollTop = 0;
    const ids = navIds(), k = ids.indexOf(c.i);
    $('#dr-pos').textContent = k + 1 + ' / ' + ids.length;
    $('#dr-prev').disabled = k <= 0;
    $('#dr-next').disabled = k >= ids.length - 1;
    $$('#cbody tr').forEach((tr) => tr.classList.toggle('is-sel', +tr.dataset.id === c.i));
  }
  function openClient(i, opener) {
    state.sel = i;
    renderDrawer(drawer.open);
    if (!drawer.open) openDialog(drawer, opener);
    $('#dr-name').focus({ preventScroll: true });
  }
  function stepClient(dir) {
    const ids = navIds(), k = ids.indexOf(state.sel), n = ids[k + dir];
    if (n == null) return;
    state.sel = n;
    renderDrawer(true);
    const btn = $(dir < 0 ? '#dr-prev' : '#dr-next');
    if (btn.disabled) $('#dr-name').focus({ preventScroll: true });
    $('#dr-live').textContent = CLIENTS[n].name;
  }

  /* ── Paleta de comandos ── */
  const pal = $('#pal'), palQ = $('#pal-q'), palList = $('#pal-list');
  let palItems = [], palActive = 0;
  const KW = { resumen: 'resumen overview inicio home panel dashboard', clientes: 'clientes customers tabla table', pedidos: 'pedidos orders tablero board hoy today' };
  const GL = { nav: 'gNav', range: 'gRange', lang: 'gLang', act: 'gAct' };
  function palCommands() {
    const c = [];
    VIEWS.forEach((v, k) => c.push({ g: 'nav', label: t(v), icon: ['overview', 'clients', 'orders'][k], kbd: ['G', ['R', 'C', 'P'][k]], kw: KW[v], on: state.view === v, movesFocus: true, run: () => setView(v, { focus: true }) }));
    [7, 30, 90].forEach((r) => c.push({ g: 'range', label: t('cmdRange', { n: r }), icon: 'calendar', kw: r + ' d dias days rango range', on: state.range === r, run: () => setRange(r) }));
    c.push({ g: 'lang', label: 'Español', icon: 'lang', kw: 'es spanish espanol idioma language', on: lang === 'es', run: () => setLang('es') });
    c.push({ g: 'lang', label: 'English', icon: 'lang', kw: 'en ingles english idioma language', on: lang === 'en', run: () => setLang('en') });
    c.push({ g: 'act', label: t('cmdFind'), icon: 'search', kbd: ['/'], kw: 'buscar find search cliente customer', movesFocus: true, run: focusClientSearch });
    c.push({ g: 'act', label: t('cta'), icon: 'bolt', kw: 'app contacto contact quiero want', movesFocus: true, run: () => openSheet(null) });
    return c;
  }
  function palGroups(nq) {
    const cmds = palCommands(), groups = [];
    const add = (id, label, items) => { if (items.length) groups.push({ id, label, items }); };
    if (!nq) { for (const g of ['nav', 'range', 'lang', 'act']) add(g, t(GL[g]), cmds.filter((c) => c.g === g)); return groups; }
    const sc = (text) => { const n = norm(text); return n.startsWith(nq) ? 3 : n.includes(' ' + nq) ? 2 : n.includes(nq) ? 1 : 0; };
    const cl = CLIENTS.map((c) => { const s = sc(c.name); return { c, s: s ? s + 1 : sc(c.area + ' ' + c.email + ' ' + c.phone) }; })
      .filter((x) => x.s > 0).sort((a, b) => b.s - a.s || a.c.name.localeCompare(b.c.name, lang)).slice(0, 6)
      .map((x) => ({ label: x.c.name, hl: true, sub: x.c.area, icon: 'clients', movesFocus: true, run: () => openClient(x.c.i, null) }));
    const od = TODAYS.slice().reverse().filter((o) => norm(o.id).includes(nq) || (nq.length > 1 && norm(CLIENTS[o.c].name).includes(nq))).slice(0, 4)
      .map((o) => ({ label: o.id + ' · ' + CLIENTS[o.c].name, hl: true, sub: t(OS[o.st]), icon: 'orders', movesFocus: true, run: () => showOrder(o.id) }));
    const chs = [0, 1, 2, 3].filter((i) => sc(t('ch')[i] + ' canal channel'))
      .map((i) => ({ label: t('chanChip', { c: t('ch')[i] }), icon: CHI[i], on: state.ch === i, run: () => { setView('resumen'); setChannel(i); } }));
    add('clients', t('gClients'), cl);
    add('orders', t('gOrders'), od);
    add('chan', t('gChan'), chs);
    const cm = cmds.filter((c) => sc(c.label + ' ' + c.kw) > 0);
    for (const g of ['nav', 'range', 'lang', 'act']) add(g, t(GL[g]), cm.filter((c) => c.g === g));
    return groups;
  }
  function palRender() {
    const raw = palQ.value.trim(), nq = norm(raw), groups = palGroups(nq);
    palItems = [];
    const empty = !groups.length;
    palList.hidden = empty;
    $('#pal-empty').hidden = !empty;
    if (empty) {
      $('#pal-empty-t').textContent = t('palEmpty', { q: raw });
      palQ.removeAttribute('aria-activedescendant');
      palList.innerHTML = '';
      return;
    }
    palList.innerHTML = groups.map((g) => '<div role="group" aria-labelledby="pg-' + g.id + '"><div class="pal__g" id="pg-' + g.id + '">' + esc(g.label) + '</div>' +
      g.items.map((it) => {
        const k = palItems.push(it) - 1;
        return '<div class="opt" role="option" id="po-' + k + '" data-k="' + k + '" aria-selected="false">' + icon(it.icon) +
          '<span class="opt__t">' + (it.hl ? hl(it.label, nq) : esc(it.label)) + '</span>' +
          (it.sub ? '<span class="opt__s">' + esc(it.sub) + '</span>' : '') +
          (it.on ? '<span class="opt__on">' + icon('check') + '</span>' : '') +
          (it.kbd ? '<span class="opt__k" aria-hidden="true">' + it.kbd.map((x) => '<kbd class="kbd">' + x + '</kbd>').join('') + '</span>' : '') + '</div>';
      }).join('') + '</div>').join('');
    palSetActive(0);
  }
  function palSetActive(k, scroll = true) {
    if (!palItems.length) return;
    palActive = (k + palItems.length) % palItems.length;
    $$('.opt', palList).forEach((o) => o.setAttribute('aria-selected', String(+o.dataset.k === palActive)));
    const el = $('#po-' + palActive);
    palQ.setAttribute('aria-activedescendant', 'po-' + palActive);
    if (scroll && el) el.scrollIntoView({ block: 'nearest' });
  }
  function palRun(k) {
    const it = palItems[k];
    if (!it) return;
    closeDialog(pal, { restore: !it.movesFocus, instant: true });
    it.run();
  }
  function openPalette(opener) {
    if (pal.open && !pal._closing) { closeDialog(pal); return; }
    for (const d of openDialogs.slice()) if (d !== pal) closeDialog(d, { restore: false, instant: true });
    const back = pal._closing ? pal._opener : null;
    palQ.value = '';
    palRender();
    openDialog(pal, opener || back || doc.activeElement);
    palQ.focus();
  }
  palQ.addEventListener('input', palRender);
  palQ.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); palSetActive(palActive + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palSetActive(palActive - 1); }
    else if (e.key === 'PageDown') { e.preventDefault(); palSetActive(Math.min(palActive + 5, palItems.length - 1)); }
    else if (e.key === 'PageUp') { e.preventDefault(); palSetActive(Math.max(palActive - 5, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); palRun(palActive); }
  });
  palList.addEventListener('pointermove', (e) => {
    const o = e.target.closest('.opt');
    if (o && +o.dataset.k !== palActive) palSetActive(+o.dataset.k, false);
  });
  palList.addEventListener('click', (e) => { const o = e.target.closest('.opt'); if (o) palRun(+o.dataset.k); });
  $('#pal-esc').addEventListener('click', () => closeDialog(pal));

  /* ── Hoja «Quiero una app así» ── */
  const sheet = $('#sheet'), form = $('#lead');
  function openSheet(opener) {
    for (const d of openDialogs.slice()) if (d !== sheet) closeDialog(d, { restore: false, instant: true });
    form.hidden = false;
    $('#sheet-done').hidden = true;
    for (const id of ['f-name', 'f-contact']) setErr(id, '');
    openDialog(sheet, opener || doc.activeElement);
    $('#f-name').focus();
  }
  function setErr(id, msg) {
    const inp = $('#' + id), p = $('#' + id + '-e');
    p.textContent = msg;
    p.hidden = !msg;
    if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if ($('#f-send').classList.contains('is-sending')) return;
    const name = $('#f-name').value.trim(), contact = $('#f-contact').value.trim();
    const okContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) || contact.replace(/\D/g, '').length >= 7;
    setErr('f-name', name ? '' : t('errName'));
    setErr('f-contact', okContact ? '' : t('errContact'));
    if (!name) { $('#f-name').focus(); return; }
    if (!okContact) { $('#f-contact').focus(); return; }
    const btn = $('#f-send');
    btn.classList.add('is-sending');
    btn.setAttribute('aria-disabled', 'true');
    $('#f-send-t').textContent = t('sending');
    setTimeout(() => {
      btn.classList.remove('is-sending');
      btn.removeAttribute('aria-disabled');
      $('#f-send-t').textContent = t('send');
      form.hidden = true;
      const done = $('#sheet-done');
      done.hidden = false;
      $('#sheet-done-h').textContent = t('done', { n: name.split(' ')[0] });
      $('#sheet-done-h').focus();
      form.reset();
    }, STILL ? 0 : 750);
  });
  $$('[data-close-sheet]').forEach((b) => b.addEventListener('click', () => closeDialog(sheet)));
  $$('[data-open-sheet]').forEach((b) => b.addEventListener('click', () => openSheet(b)));

  /* ───────────────────────── Vistas, rango e idioma ───────────────────────── */
  function renderHead() {
    const v = state.view;
    $('#view-title').textContent = t(v);
    const r = state.range;
    if (v === 'pedidos') {
      const amt = TODAYS.reduce((a, o) => a + o.amt, 0);
      $('#view-meta').textContent = t('today') + ' · ' + fmtLong(TODAY) + ' · ' + t('ordersToday', { n: TODAYS.length, a: money(amt) });
    } else {
      $('#view-meta').textContent = rangeTxt(r) + ' · ' + fmtDay(TODAY - r + 1) + ' – ' + fmtDay(TODAY);
    }
    $$('[data-range-group] [role="radio"]').forEach((b) => { b.disabled = v === 'pedidos'; });
    renderChip();
  }
  function setView(v, o = {}) {
    if (!VIEWS.includes(v)) v = 'resumen';
    const changed = v !== state.view;
    state.view = v;
    doc.body.dataset.view = v;
    for (const s of $$('.view')) {
      const on = s.dataset.view === v;
      s.hidden = !on;
      if (on && changed && !o.initial && !STILL) { s.classList.remove('is-entering'); void s.offsetWidth; s.classList.add('is-entering'); }
    }
    for (const a of $$('.nav')) {
      if (a.dataset.viewLink === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    }
    renderHead();
    if (v === 'resumen') renderResumen(true);
    if (v === 'clientes') renderTable(false);
    if (v === 'pedidos') updateCounts();
    if (!o.initial) { try { history.replaceState(null, '', location.pathname + location.search + '#' + v); } catch (e) { /* sin historial */ } }
    if (o.focus) { window.scrollTo(0, 0); $('#view-title').focus({ preventScroll: true }); }
  }
  let loadT = 0;
  function setRange(r) {
    if (r === state.range) return;
    state.range = r;
    for (const g of $$('[data-range-group]')) checkRadio(g, $('[data-range="' + r + '"]', g));
    renderHead();
    announce(t('rangeAnn', { n: r }));
    if (state.view === 'resumen') {
      const view = $('.view--resumen');
      clearTimeout(loadT);
      chart.hide();
      if (STILL) { renderResumen(false); return; }
      for (const n of $$('.num', view)) if (n._stop) { n._stop(); n._stop = null; }
      view.classList.remove('is-loading'); void view.offsetWidth;
      view.classList.add('is-loading');
      loadT = setTimeout(() => {
        view.classList.remove('is-loading');
        if (r === 90 && !state.errOnce) { state.errOnce = true; state.chanErr = true; showChanErr(true); }
        renderResumen(true);
      }, 250);
    } else if (state.view === 'clientes') renderTable(true);
    if (drawer.open) renderDrawer(false);
  }
  function applyStatic() {
    doc.documentElement.lang = lang;
    doc.title = t('title');
    for (const e of $$('[data-t]')) e.textContent = t(e.dataset.t);
    for (const e of $$('[data-t-aria]')) e.setAttribute('aria-label', t(e.dataset.tAria));
    for (const e of $$('[data-t-ph]')) e.setAttribute('placeholder', t(e.dataset.tPh));
    for (const g of $$('.lang')) checkRadio(g, $('[data-lang="' + lang + '"]', g));
    const badge = $('[data-gaya-badge]');
    if (badge) badge.textContent = badge.textContent.replace(/^[^·]+/, lang === 'en' ? 'Sample site ' : 'Sitio de ejemplo ');
  }
  function setLang(l) {
    if (l === lang || !T[l]) return;
    lang = l;
    G.lang = l;
    applyStatic();
    $('#toasts').replaceChildren();
    renderHead();
    if (state.view === 'resumen') renderResumen(false);
    chart.relabel();
    renderTable(false);
    for (const o of TODAYS) fillCard(o);
    for (let s = 0; s < 4; s++) if (!COLS[s].length) placeCol(s);
    if (drawer.open) renderDrawer(false);
    try {
      const u = new URL(location.href);
      u.searchParams.set('lang', l);
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) { /* sin historial */ }
    announce(t('langDone'));
  }

  /* ── Grupos de radio (rango, idioma, filtro) ── */
  function checkRadio(group, b) {
    if (!group || !b) return;
    for (const x of $$('[role="radio"]', group)) { const on = x === b; x.setAttribute('aria-checked', String(on)); x.tabIndex = on ? 0 : -1; }
  }
  function radioGroup(group, pick) {
    group.addEventListener('click', (e) => { const b = e.target.closest('[role="radio"]'); if (b && !b.disabled) pick(b); });
    group.addEventListener('keydown', (e) => {
      const opts = $$('[role="radio"]:not(:disabled)', group), i = opts.indexOf(doc.activeElement);
      if (i < 0) return;
      const k = e.key;
      const n = k === 'ArrowRight' || k === 'ArrowDown' ? opts[(i + 1) % opts.length]
        : k === 'ArrowLeft' || k === 'ArrowUp' ? opts[(i - 1 + opts.length) % opts.length]
          : k === 'Home' ? opts[0] : k === 'End' ? opts[opts.length - 1] : null;
      if (!n) return;
      e.preventDefault();
      n.focus();
      pick(n);
    });
  }

  function focusClientSearch() {
    setView('clientes');
    const q = $('#cq');
    q.focus();
    q.select();
  }

  /* ───────────────────────── Eventos ───────────────────────── */
  function bind() {
    for (const g of $$('[data-range-group]')) radioGroup(g, (b) => setRange(+b.dataset.range));
    for (const g of $$('.lang')) radioGroup(g, (b) => setLang(b.dataset.lang));
    radioGroup($('#cfilter'), (b) => setFilter(b.dataset.f));
    radioGroup($('#chan-metric'), (b) => setMetric(b.dataset.m));

    for (const a of $$('[data-view-link]')) a.addEventListener('click', (e) => { e.preventDefault(); setView(a.dataset.viewLink, { focus: true }); });
    $('#open-pal').addEventListener('click', (e) => openPalette(e.currentTarget));

    $('#chan').addEventListener('click', (e) => { const b = e.target.closest('.chan__row'); if (b) setChannel(+b.dataset.ch); });
    $('#chan-chip').addEventListener('click', () => { setChannel(state.ch); $('#view-title').focus({ preventScroll: true }); });
    $('#chan-retry').addEventListener('click', () => {
      const panel = $('.chan-panel');
      showChanErr(false);
      panel.classList.add('is-retrying');
      setTimeout(() => {
        panel.classList.remove('is-retrying');
        state.chanErr = false;
        renderChannels(true);
        announce(t('chanOk'));
        const first = $('#chan .chan__row');
        if (first) first.focus({ preventScroll: true });
      }, STILL ? 0 : 450);
    });
    $('#act').addEventListener('click', (e) => { const b = e.target.closest('.act__item'); if (b) openClient(+b.dataset.client, b); });

    $('#ctable thead').addEventListener('click', (e) => { const th = e.target.closest('th[data-sort]'); if (th && e.target.closest('.sort')) setSort(th.dataset.sort); });
    $('#cbody').addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (tr) openClient(+tr.dataset.id, $('.rowbtn', tr));
    });
    const cq = $('#cq');
    cq.addEventListener('input', () => { state.q = cq.value; renderTable(true); });
    cq.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && cq.value) { e.preventDefault(); e.stopPropagation(); cq.value = ''; state.q = ''; renderTable(true); }
    });
    $('#cempty-btn').addEventListener('click', (e) => {
      if (e.currentTarget.dataset.act === 'q') { cq.value = ''; state.q = ''; renderTable(true); cq.focus(); }
      else { setFilter('all'); $('#cfilter [data-f="all"]').focus(); }
    });

    $('#board').addEventListener('click', (e) => {
      const adv = e.target.closest('[data-advance]');
      if (adv) { advance(adv.dataset.advance); return; }
      const who = e.target.closest('.order__who');
      if (who) openClient(+who.dataset.client, who);
    });

    $('#dr-close').addEventListener('click', () => closeDialog(drawer));
    $('#dr-prev').addEventListener('click', () => stepClient(-1));
    $('#dr-next').addEventListener('click', () => stepClient(1));
    $('#dr-body').addEventListener('click', (e) => {
      const cp = e.target.closest('[data-copy]');
      if (cp) {
        const lab = $('span', cp);
        const done = (ok) => {
          lab.textContent = ok ? t('copied') : t('copyFail');
          cp.classList.toggle('is-done', ok);
          $('use', cp).setAttribute('href', ok ? '#i-check' : '#i-alert');
          $('#dr-live').textContent = lab.textContent;
          setTimeout(() => { if (!cp.isConnected) return; lab.textContent = t('copyEmail'); cp.classList.remove('is-done'); $('use', cp).setAttribute('href', '#i-copy'); }, 2200);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(cp.dataset.copy).then(() => done(true), () => done(false));
        else done(false);
        return;
      }
      const see = e.target.closest('[data-see-order]');
      if (see) closeDialog(drawer, { restore: false, then: () => showOrder(see.dataset.seeOrder) });
    });

    // Esc cierra el diálogo de arriba (y no sale del visor)
    doc.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !openDialogs.length) return;
      e.preventDefault();
      closeDialog(openDialogs[openDialogs.length - 1]);
    }, true);

    // Atajos: ⌘K / Ctrl+K, g r · g c · g p, /
    let gWait = false, gT = 0;
    doc.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openPalette(); return; }
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || openDialogs.length) return;
      const tg = e.target;
      if (tg && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName))) return;
      if (e.key === '/') { e.preventDefault(); focusClientSearch(); return; }
      if (gWait) {
        gWait = false;
        clearTimeout(gT);
        const v = { r: 'resumen', c: 'clientes', p: 'pedidos' }[e.key.toLowerCase()];
        if (v) { e.preventDefault(); setView(v, { focus: true }); }
        return;
      }
      if (e.key === 'g' || e.key === 'G') { gWait = true; gT = setTimeout(() => { gWait = false; }, 1000); }
    });

    window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (VIEWS.includes(h) && h !== state.view) setView(h); });
  }

  /* ───────────────────────── Inicio ───────────────────────── */
  function init() {
    chart = Chart($('#chart'));
    if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) $('#kbd-k').textContent = '⌘ K';
    applyStatic();
    $('#nav-clients').textContent = CLIENTS.length;
    buildRows();
    buildBoard();
    bind();
    const h = location.hash.slice(1);
    setView(VIEWS.includes(h) ? h : 'resumen', { initial: true });
    updateCounts();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => chart.relabel());
  }
  init();
})();
