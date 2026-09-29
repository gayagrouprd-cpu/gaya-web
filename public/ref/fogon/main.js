/* Fogón · comanda que se imprime, filtros del menú, hoja móvil y horario en vivo */
(function () {
  'use strict';

  var G = window.GAYA || { still: false, lang: 'es' };
  var H = window.GAYA_HOURS || null;
  var root = document.documentElement;
  var still = !!G.still;
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqDesk = window.matchMedia('(min-width: 1024px)');
  var EASE = 'cubic-bezier(.16, 1, .3, 1)';
  var MAX = 9;
  var ITBIS = 0.18;
  var TIP = 0.10;

  root.classList.add('js');

  function moving() { return !still && !mqReduce.matches; }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function r2(n) { return Math.round(n * 100) / 100; }
  function money(n) { return r2(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function anim(el, frames, opts) { return el && el.animate ? el.animate(frames, opts) : null; }
  function stop(el) { if (el && el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); }); }

  // ---------- Elementos
  var bar = $('[data-bar]');
  var orderLink = $('[data-order-link]');
  var countEls = $$('[data-count]');
  var comanda = $('[data-comanda]');
  var heading = $('#comanda-t');
  var slotEl = $('[data-slot]');
  var scroller = $('[data-scroll]');
  var paper = $('[data-paper]');
  var linesEl = $('[data-lines]');
  var emptyEl = $('[data-empty]');
  var foot = $('[data-foot]');
  var sendBtn = $('[data-send]');
  var sendLabel = $('[data-send-label]');
  var errorEl = $('[data-error]');
  var liveEl = $('[data-live]');
  var peek = $('[data-peek]');
  var slipEl = $('[data-slip]');
  var scrim = $('[data-scrim]');
  var doneDlg = $('[data-done]');
  var filtersEl = $('[data-filters]');
  var groupsEl = $('[data-groups]');
  var menuEl = $('#menu');
  var out = {
    sub: $('[data-sub]'), itbis: $('[data-itbis]'), tip: $('[data-tip]'),
    total: $('[data-total]'), peek: $('[data-peek-total]')
  };

  // ---------- Platos (leídos del HTML: el menú se ve sin JS)
  var dishes = {};
  $$('.dish').forEach(function (li) {
    dishes[li.dataset.id] = {
      id: li.dataset.id,
      price: Number(li.dataset.price),
      name: $('.dish__name', li).textContent.trim(),
      row: li,
      stepper: $('.stepper', li),
      n: $('.step__n', li),
      inc: $('.step--inc', li),
      dec: $('.step--dec', li)
    };
  });

  var order = [];            // líneas, la más reciente primero: { id, qty, el }
  var mode = 'aqui';
  var orderNo = 4821;
  var shownTotal = 0;

  function find(id) {
    for (var i = 0; i < order.length; i++) if (order[i].id === id) return order[i];
    return null;
  }

  function calc() {
    var sub = 0;
    order.forEach(function (it) { sub += dishes[it.id].price * it.qty; });
    var itbis = r2(sub * ITBIS);
    var tip = mode === 'aqui' ? r2(sub * TIP) : 0;
    return { sub: sub, itbis: itbis, tip: tip, total: r2(sub + itbis + tip) };
  }

  // ---------- Anuncios para lectores de pantalla
  var liveT = 0;
  function say(msg) {
    clearTimeout(liveT);
    liveEl.textContent = '';
    liveT = setTimeout(function () { liveEl.textContent = msg; }, 180);
  }

  // ---------- Total que cuenta hasta su valor
  var raf = 0;
  function paintTotal(v) {
    var s = money(v);
    out.total.textContent = s;
    out.peek.textContent = s;
  }
  function countTo(v) {
    cancelAnimationFrame(raf);
    if (!moving() || Math.abs(v - shownTotal) < 0.005) { shownTotal = v; paintTotal(v); return; }
    var from = shownTotal;
    var t0 = performance.now();
    var dur = 680;
    function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      shownTotal = from + (v - from) * e;
      paintTotal(shownTotal);
      if (p < 1) raf = requestAnimationFrame(step);
      else { shownTotal = v; paintTotal(v); }
    }
    raf = requestAnimationFrame(step);
  }

  function renderSums() {
    var t = calc();
    out.sub.textContent = money(t.sub);
    out.itbis.textContent = money(t.itbis);
    if (mode === 'aqui') { out.tip.textContent = money(t.tip); out.tip.classList.remove('na'); }
    else { out.tip.textContent = 'No aplica'; out.tip.classList.add('na'); }
    countTo(t.total);

    var n = order.length;
    sendBtn.disabled = n === 0;
    countEls.forEach(function (c) {
      var was = c.textContent;
      c.textContent = n;
      c.hidden = n === 0;
      if (n && String(n) !== was && moving()) anim(c, [{ transform: 'scale(1.3)' }, { transform: 'none' }], { duration: 420, easing: EASE });
    });
    orderLink.setAttribute('aria-label', n ? 'Pedir: ' + n + (n === 1 ? ' plato' : ' platos') + ' en la comanda' : 'Pedir');
    peek.setAttribute('aria-label', 'Comanda: ' + n + (n === 1 ? ' plato' : ' platos') + ', total RD$ ' + money(t.total));
    updateBar();
    return t;
  }

  // ---------- Líneas del ticket
  var ICON_MINUS = '<svg class="i" aria-hidden="true"><use href="#i-minus"/></svg>';
  var ICON_PLUS = '<svg class="i" aria-hidden="true"><use href="#i-plus"/></svg>';

  function lineEl(it) {
    var d = dishes[it.id];
    var li = document.createElement('li');
    li.className = 'line';
    li.dataset.id = it.id;
    li.innerHTML =
      '<div class="line__step">' +
        '<button type="button" class="tstep" data-act="dec">' + ICON_MINUS + '</button>' +
        '<span class="line__n"></span>' +
        '<button type="button" class="tstep" data-act="inc">' + ICON_PLUS + '</button>' +
      '</div>' +
      '<span class="line__name"></span>' +
      '<span class="line__amt"></span>' +
      '<span class="line__strike" aria-hidden="true"></span>';
    $('[data-act="dec"]', li).setAttribute('aria-label', 'Quitar: ' + d.name);
    $('[data-act="inc"]', li).setAttribute('aria-label', 'Añadir: ' + d.name);
    $('.line__name', li).textContent = d.name;
    it.el = li;
    paintLine(it);
    return li;
  }

  function paintLine(it) {
    var d = dishes[it.id];
    $('.line__n', it.el).textContent = it.qty;
    $('.line__amt', it.el).textContent = money(d.price * it.qty);
    $('[data-act="inc"]', it.el).setAttribute('aria-disabled', String(it.qty >= MAX));
  }

  function roll(el, dir) {
    if (!moving()) return;
    anim(el, [
      { transform: 'translateY(' + (dir > 0 ? 60 : -60) + '%)', opacity: 0 },
      { transform: 'none', opacity: 1 }
    ], { duration: 380, easing: EASE });
  }

  function comandaVisible() { return mqDesk.matches || comanda.classList.contains('is-open'); }

  function pieces() {
    return $$('.lines > li:not(.is-leaving)', paper)
      .concat($$(':scope > :not(.lines)', paper))
      .concat([foot]);
  }

  var leaving = [];
  function settle() { leaving.slice().forEach(function (f) { f(); }); }

  function printing() {
    slotEl.classList.add('is-printing');
    clearTimeout(printing.t);
    printing.t = setTimeout(function () { slotEl.classList.remove('is-printing'); }, 560);
  }

  function fitScroll() {
    var need = paper.offsetHeight > scroller.clientHeight + 1;
    scroller.classList.toggle('is-scroll', need);
  }

  /* FLIP del papel: todo lo que está debajo avanza como la tira de una impresora térmica.
     La línea nueva sale de debajo de la ranura (translateY + recorte del contenedor). */
  function flip(mutate, entering, inPlace) {
    var go = moving() && comandaVisible();
    var els = go ? pieces() : [];
    var before = els.map(function (el) { return el.getBoundingClientRect().top; });
    els.forEach(stop);
    mutate();
    fitScroll();
    if (!go) {
      if (entering && !still && comandaVisible()) anim(entering, [{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: 'linear' });
      return;
    }
    els.forEach(function (el, i) {
      if (!el.isConnected || el === entering) return;
      var r = el.getBoundingClientRect();
      if (!r.height) return;
      var dy = before[i] - r.top;
      if (Math.abs(dy) > 0.5) anim(el, [{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: 680, easing: EASE });
    });
    if (entering && inPlace) {
      // Primera línea: ocupa el hueco del ticket vacío y su texto sale de debajo de la ranura
      var h = entering.getBoundingClientRect().height;
      anim(entering, [{ clipPath: 'inset(0 -8px 0 -8px)' }, { clipPath: 'inset(0 -8px 0 -8px)' }], { duration: 680 });
      Array.prototype.forEach.call(entering.children, function (c) {
        if (c.classList.contains('line__strike')) return;
        anim(c, [{ transform: 'translateY(' + -h + 'px)' }, { transform: 'none' }], { duration: 680, easing: EASE });
      });
      printing();
    } else if (entering) {
      // Avanza al mismo paso que el papel que empuja: sin rendijas entre líneas
      var from = entering.getBoundingClientRect().height;
      anim(entering, [{ transform: 'translateY(' + -from + 'px)' }, { transform: 'none' }], { duration: 680, easing: EASE });
      printing();
    }
  }

  function emptyHeight() {
    if (!emptyEl.hidden) return emptyEl.offsetHeight;
    emptyEl.hidden = false;
    var h = emptyEl.offsetHeight;
    emptyEl.hidden = true;
    return h;
  }

  function following(li) {
    var list = [];
    for (var sib = li.nextElementSibling; sib; sib = sib.nextElementSibling) list.push(sib);
    $$(':scope > :not(.lines):not(.lead)', paper).forEach(function (el) { if (!el.hidden) list.push(el); });
    list.push(foot);
    return list;
  }

  function focusAfter(li) {
    var sib = li.nextElementSibling;
    while (sib && sib.classList.contains('is-leaving')) sib = sib.nextElementSibling;
    if (!sib) {
      sib = li.previousElementSibling;
      while (sib && sib.classList.contains('is-leaving')) sib = sib.previousElementSibling;
    }
    return sib ? $('[data-act="dec"]', sib) : heading;
  }

  function removeLine(it, src) {
    var li = it.el;
    var target = src && li.contains(src) ? focusAfter(li) : null;
    li.classList.add('is-leaving');
    if (target) target.focus({ preventScroll: true });
    li.inert = true;

    var running = [];
    var finish = function () {
      if (finish.done) return;
      finish.done = true;
      leaving.splice(leaving.indexOf(finish), 1);
      var wasLast = order.length === 0;
      li.remove();
      emptyEl.hidden = !wasLast;
      running.forEach(function (a) { if (a) a.cancel(); });
      fitScroll();
      if (wasLast && !still && comandaVisible()) anim($('.i', emptyEl), [{ opacity: 0 }, { opacity: 1 }], { duration: moving() ? 420 : 120, easing: 'ease-out' });
    };
    leaving.push(finish);

    var kids = [$('.line__step', li), $('.line__name', li), $('.line__amt', li)];
    if (!comandaVisible() || still || !li.animate) { finish(); return; }
    if (!moving()) {
      kids.forEach(function (k) { running.push(anim(k, [{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'linear', fill: 'forwards' })); });
      running[0].onfinish = finish;
      return;
    }
    // 1) se tacha como en la cocina  2) el papel de abajo sube por encima  3) fuera del DOM
    var strike = $('.line__strike', li);
    running.push(anim(strike, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 300, easing: EASE, fill: 'forwards' }));
    kids.forEach(function (k) {
      running.push(anim(k, [{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration: 460, easing: 'linear', fill: 'forwards' }));
    });
    running[1].onfinish = function () {
      if (finish.done) return;
      var h = li.offsetHeight;
      var d = order.length === 0 ? h - emptyHeight() : h;
      running.push(anim(strike, [{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'linear', fill: 'forwards' }));
      if (d < 0.5) { setTimeout(finish, 240); return; }
      var last = null;
      following(li).forEach(function (el) {
        stop(el);
        last = anim(el, [{ transform: 'none' }, { transform: 'translateY(' + -d + 'px)' }], { duration: 560, easing: EASE, fill: 'forwards' });
        running.push(last);
      });
      if (last) last.onfinish = finish;
      else finish();
    };
  }

  function syncDish(id, q, delta) {
    var d = dishes[id];
    var was = d.stepper.classList.contains('is-on');
    if (q > 0) d.n.textContent = q;
    d.row.classList.toggle('is-on', q > 0);
    d.stepper.classList.toggle('is-on', q > 0);
    d.stepper.classList.toggle('is-max', q >= MAX);
    d.inc.setAttribute('aria-disabled', String(q >= MAX));
    if (q > 0 && was) roll(d.n, delta);
    if (q === 0 && document.activeElement === d.dec) d.inc.focus({ preventScroll: true });
  }

  function change(id, delta, src) {
    var d = dishes[id];
    if (!d) return;
    settle();
    var it = find(id);
    var q = it ? it.qty : 0;
    var nq = Math.max(0, Math.min(MAX, q + delta));
    if (nq === q) {
      if (delta > 0) say(d.name + ': máximo ' + MAX + ' por plato.');
      return;
    }
    errorEl.textContent = '';

    if (!it) {
      var first = !emptyEl.hidden;
      it = { id: id, qty: nq };
      order.unshift(it);
      var li = lineEl(it);
      flip(function () {
        linesEl.insertBefore(li, linesEl.firstChild);
        emptyEl.hidden = true;
        scroller.scrollTop = 0;
      }, li, first);
    } else if (nq === 0) {
      order.splice(order.indexOf(it), 1);
      removeLine(it, src);
    } else {
      it.qty = nq;
      paintLine(it);
      roll($('.line__n', it.el), delta);
    }

    syncDish(id, nq, delta);
    var t = renderSums();
    say(d.name + (nq ? ': ' + nq : ': fuera de la comanda') + '. Total RD$ ' + money(t.total) + '.');
    if (delta > 0) slip(d, nq);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!b) return;
    var host = b.closest('[data-id]');
    if (!host || host.classList.contains('is-leaving')) return;
    if (b.getAttribute('aria-disabled') === 'true') { say(dishes[host.dataset.id].name + ': máximo ' + MAX + ' por plato.'); return; }
    change(host.dataset.id, b.dataset.act === 'inc' ? 1 : -1, b);
  });

  // ---------- Tira que asoma sobre la barra (móvil)
  function slip(d, q) {
    if (mqDesk.matches || comanda.classList.contains('is-open') || !moving()) return;
    $('[data-slip-q]', slipEl).textContent = q;
    $('[data-slip-name]', slipEl).textContent = d.name;
    $('[data-slip-amt]', slipEl).textContent = money(d.price * q);
    slipEl.classList.remove('is-out');
    void slipEl.offsetWidth;
    slipEl.classList.add('is-out');
  }
  slipEl.addEventListener('animationend', function () { slipEl.classList.remove('is-out'); });

  // ---------- Modo de servicio
  $$('input[name="modo"]').forEach(function (r) {
    r.addEventListener('change', function () {
      if (!r.checked) return;
      mode = r.value;
      if (moving()) roll(out.tip, mode === 'aqui' ? 1 : -1);
      var t = renderSums();
      say((mode === 'aqui' ? 'Para comer aquí' : 'Para llevar, sin propina legal') + '. Total RD$ ' + money(t.total) + '.');
    });
  });

  // ---------- Barra inferior y hoja (móvil)
  var menuSeen = false;
  function updateBar() {
    root.classList.toggle('bar-on', !mqDesk.matches && (menuSeen || order.length > 0));
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      menuSeen = es[0].isIntersecting;
      updateBar();
    }, { rootMargin: '0px 0px -30% 0px' }).observe(menuEl);
  }

  var inerted = [];
  function setInert(on) {
    if (!on) {
      inerted.forEach(function (el) { el.inert = false; });
      inerted = [];
      return;
    }
    var node = comanda;
    while (node && node !== document.body) {
      var parent = node.parentElement;
      Array.prototype.forEach.call(parent.children, function (sib) {
        if (sib === node || sib === scrim || sib === liveEl || sib === doneDlg || sib.inert) return;
        if (/^(SCRIPT|STYLE)$/.test(sib.tagName)) return;
        sib.inert = true;
        inerted.push(sib);
      });
      node = parent;
    }
  }

  var sheetReturn = null;
  function isOpen() { return comanda.classList.contains('is-open'); }
  function openSheet() {
    if (mqDesk.matches || isOpen()) return;
    sheetReturn = document.activeElement;
    comanda.setAttribute('role', 'dialog');
    comanda.setAttribute('aria-modal', 'true');
    // La hoja fija su altura al abrirse: quitar líneas no hace saltar su borde superior
    comanda.style.height = '';
    var sheetH = comanda.offsetHeight;
    comanda.style.height = sheetH + 'px';
    root.style.setProperty('--gaya-badge-lift', (sheetH + 8) + 'px');
    comanda.classList.add('is-open');
    root.classList.add('sheet-open');
    peek.setAttribute('aria-expanded', 'true');
    setInert(true);
    fitScroll();
    heading.focus({ preventScroll: true });
  }
  function closeSheet(restore) {
    if (!isOpen()) return;
    comanda.classList.remove('is-open');
    comanda.removeAttribute('role');
    comanda.removeAttribute('aria-modal');
    comanda.style.transform = '';
    root.style.removeProperty('--gaya-badge-lift');
    root.classList.remove('sheet-open');
    setTimeout(function () { if (!isOpen()) { comanda.style.height = ''; fitScroll(); } }, 650);
    peek.setAttribute('aria-expanded', 'false');
    setInert(false);
    if (restore !== false) {
      var t = sheetReturn && sheetReturn.isConnected && sheetReturn.getClientRects().length ? sheetReturn : peek;
      t.focus({ preventScroll: true });
    }
  }

  peek.addEventListener('click', openSheet);
  scrim.addEventListener('click', function () { closeSheet(); });
  $('[data-close]').addEventListener('click', function () { closeSheet(); });
  orderLink.addEventListener('click', function (e) {
    if (!mqDesk.matches && order.length) { e.preventDefault(); openSheet(); }
  });

  // Arrastrar la hoja hacia abajo para cerrarla
  var headEl = $('[data-sheet-head]');
  var drag = null;
  headEl.addEventListener('pointerdown', function (e) {
    if (mqDesk.matches || !isOpen() || e.button > 0 || e.target.closest('button')) return;
    drag = { y: e.clientY, dy: 0, t: performance.now() };
    try { headEl.setPointerCapture(e.pointerId); } catch (_) { /* sin captura */ }
    comanda.classList.add('is-dragging');
  });
  headEl.addEventListener('pointermove', function (e) {
    if (!drag) return;
    drag.dy = Math.max(0, e.clientY - drag.y);
    comanda.style.transform = 'translateY(' + drag.dy + 'px)';
  });
  function endDrag() {
    if (!drag) return;
    var v = drag.dy / Math.max(1, performance.now() - drag.t);
    var shut = drag.dy > 120 || (drag.dy > 32 && v > 0.6);
    drag = null;
    comanda.classList.remove('is-dragging');
    comanda.style.transform = '';
    if (shut) closeSheet();
  }
  headEl.addEventListener('pointerup', endDrag);
  headEl.addEventListener('pointercancel', endDrag);

  // ---------- Teclado: Esc y foco atrapado
  function focusables(box) {
    return $$('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])', box).filter(function (el) {
      if (el.type === 'radio' && !el.checked) return false;
      return el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[inert]');
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (doneDlg.open) { e.preventDefault(); closeDone(); return; }
      if (isOpen()) { e.preventDefault(); closeSheet(); return; }
    }
    if (e.key !== 'Tab') return;
    var box = doneDlg.open ? doneDlg : isOpen() ? comanda : null;
    if (!box) return;
    var f = focusables(box);
    if (!f.length) { e.preventDefault(); return; }
    var first = f[0];
    var last = f[f.length - 1];
    var inside = box.contains(document.activeElement);
    if (e.shiftKey && (!inside || document.activeElement === first || document.activeElement === heading)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (!inside || document.activeElement === last)) { e.preventDefault(); first.focus(); }
  });

  // ---------- Enviar pedido
  var busy = false;
  sendBtn.addEventListener('click', function () {
    if (busy || !order.length) return;
    if (navigator.onLine === false) {
      errorEl.textContent = 'Sin conexión. Tu comanda sigue aquí: vuelve a enviarla en un momento.';
      return;
    }
    busy = true;
    errorEl.textContent = '';
    sendBtn.setAttribute('aria-busy', 'true');
    sendLabel.textContent = 'Enviando';
    setTimeout(function () {
      busy = false;
      sendBtn.removeAttribute('aria-busy');
      sendLabel.textContent = 'Enviar pedido';
      openDone();
    }, still ? 0 : 900);
  });

  function nowText() {
    if (!H) return '';
    return H.fmt(H.parts(H.today()).minutes, 'es');
  }

  function sumsHTML(t) {
    function row(label, value, cls) {
      return '<div' + (cls ? ' class="' + cls + '"' : '') + '><dt>' + label + '</dt><dd>' + value + '</dd></div>';
    }
    return row('Subtotal', money(t.sub)) +
      row('ITBIS 18 %', money(t.itbis)) +
      row('Propina legal 10 %', mode === 'aqui' ? money(t.tip) : '<span class="na">No aplica</span>') +
      row('Total', '<span class="cur">RD$</span> ' + money(t.total), 'is-total');
  }

  function openDone() {
    var t = calc();
    $('[data-done-no]').textContent = '#' + orderNo;
    var time = nowText();
    $('[data-done-meta]').textContent = (mode === 'aqui' ? 'Para comer aquí' : 'Para llevar') + (time ? ' · ' + time : '');
    var ol = $('[data-done-lines]');
    ol.textContent = '';
    order.slice().reverse().forEach(function (it) {
      var d = dishes[it.id];
      var li = document.createElement('li');
      var q = document.createElement('b');
      var n = document.createElement('span');
      var a = document.createElement('span');
      q.textContent = it.qty;
      n.textContent = d.name;
      a.textContent = money(d.price * it.qty);
      li.append(q, n, a);
      ol.appendChild(li);
    });
    $('[data-done-sums]').innerHTML = sumsHTML(t);
    closeSheet(false);
    doneDlg.showModal();
    doneDlg.scrollTop = 0;
    $('#done-t').focus({ preventScroll: true });
    say('Pedido ' + orderNo + ' enviado a cocina. Listo en 25 minutos.');
  }

  // Tras enviar: el ticket se arranca y la ranura imprime uno nuevo, en blanco
  function clearOrder() {
    settle();
    var had = order.length > 0;
    order.slice().forEach(function (it) { syncDish(it.id, 0, -1); });
    order = [];
    if (!had) return;
    renderSums();
    function reset() {
      linesEl.textContent = '';
      emptyEl.hidden = false;
      fitScroll();
    }
    if (!moving() || !comandaVisible() || !paper.animate) {
      reset();
      if (!still && comandaVisible()) anim(paper, [{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: 'linear' });
      return;
    }
    var footTop = foot.getBoundingClientRect().top;
    var tear = anim(paper, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(48px)', opacity: 0 }], { duration: 300, easing: 'cubic-bezier(.7, 0, .84, 0)', fill: 'forwards' });
    tear.onfinish = function () {
      reset();
      tear.cancel();
      anim(paper, [{ transform: 'translateY(' + -paper.offsetHeight + 'px)' }, { transform: 'none' }], { duration: 820, easing: EASE });
      var d = footTop - foot.getBoundingClientRect().top;
      if (Math.abs(d) > 0.5) anim(foot, [{ transform: 'translateY(' + d + 'px)' }, { transform: 'none' }], { duration: 820, easing: EASE });
      printing();
    };
  }

  function closeDone() { if (doneDlg.open) doneDlg.close(); }
  doneDlg.addEventListener('close', function () {
    clearOrder();
    orderNo += 1;
    var target = mqDesk.matches ? heading : (root.classList.contains('bar-on') ? peek : $('#menu-t'));
    target.focus({ preventScroll: mqDesk.matches || target === peek });
  });
  $('[data-done-close]').addEventListener('click', closeDone);
  doneDlg.addEventListener('click', function (e) {
    if (e.target !== doneDlg) return;
    var r = $('.done__paper', doneDlg).getBoundingClientRect();
    var b = $('[data-done-close]', doneDlg).getBoundingClientRect();
    var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= b.bottom;
    if (!inside) closeDone();
  });

  // ---------- Filtros del menú
  var filterBtns = $$('[data-filter]');
  function setFilter(f, keepPlace) {
    filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filter === f)); });
    $$('.group', groupsEl).forEach(function (g) {
      var show = f === 'todo' || g.dataset.cat === f;
      if (show === !g.hidden) return;
      g.hidden = !show;
      if (show && moving()) anim(g, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 560, easing: EASE });
    });
    if (!keepPlace) return;
    var barH = bar.offsetHeight;
    var fb = filtersEl.getBoundingClientRect();
    var gTop = groupsEl.getBoundingClientRect().top;
    if (gTop < fb.bottom - 1) {
      var y = window.scrollY + gTop - barH - filtersEl.offsetHeight - 12;
      window.scrollTo({ top: y, behavior: moving() ? 'smooth' : 'auto' });
    }
  }
  filterBtns.forEach(function (b) {
    b.addEventListener('click', function () { setFilter(b.dataset.filter, true); });
  });
  $$('[data-goto]').forEach(function (a) {
    a.addEventListener('click', function () { setFilter(a.dataset.goto, false); });
  });

  // ---------- Barra sólida y filtros pegados
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      bar.classList.toggle('is-solid', window.scrollY > 24);
      var top = filtersEl.getBoundingClientRect().top;
      var m = menuEl.getBoundingClientRect();
      filtersEl.classList.toggle('is-stuck', top <= bar.offsetHeight + 1 && m.bottom > bar.offsetHeight + 80);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Revelados de fotos por clip-path
  if (moving() && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.18 });
    $$('[data-reveal]').forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      el.classList.add('is-armed');
      io.observe(el);
    });
  }

  // ---------- Horario y «Abierto ahora» (hora de Santo Domingo)
  var SCHEDULE = [
    [[780, 1260]],   // domingo 1:00 p. m. – 9:00 p. m.
    [],              // lunes cerrado
    [[1080, 1380]],  // martes
    [[1080, 1380]],  // miércoles
    [[1080, 1380]],  // jueves
    [[1080, 1440]],  // viernes hasta medianoche
    [[1080, 1440]]   // sábado hasta medianoche
  ];
  function at(min) {
    var h = (Math.floor(min / 60) % 24 + 11) % 12 + 1;
    return (h === 1 ? 'la ' : 'las ') + H.fmt(min, 'es');
  }
  function renderStatus() {
    if (!H) return;
    var s = H.status(SCHEDULE);
    var text;
    if (s.open) text = 'Abierto ahora · hasta ' + (s.closesAt >= 1440 ? 'la medianoche' : at(s.closesAt));
    else if (s.opensAt) {
      var o = s.opensAt;
      var when = o.inDays === 0 ? 'hoy' : o.inDays === 1 ? 'mañana' : 'el ' + H.dayName(o.day, 'es', 'long');
      text = 'Cerrado · abre ' + when + ' a ' + at(o.min);
    } else text = 'Cerrado';
    $$('[data-status]').forEach(function (p) {
      p.classList.toggle('is-open', s.open);
      $('[data-status-text]', p).textContent = text;
    });
    $$('[data-hours] > div').forEach(function (row) {
      var today = row.dataset.days.split(' ').indexOf(String(s.day)) > -1;
      var dt = $('dt', row);
      var badge = $('.today', dt);
      row.classList.toggle('is-today', today);
      if (today && !badge) {
        badge = document.createElement('span');
        badge.className = 'today';
        badge.textContent = 'Hoy';
        dt.appendChild(badge);
      } else if (!today && badge) badge.remove();
    });
  }
  renderStatus();
  if (!still) setInterval(renderStatus, 60000);

  // ---------- Cambios de tamaño
  function onLayout() {
    if (mqDesk.matches) closeSheet(false);
    updateBar();
    fitScroll();
  }
  if (mqDesk.addEventListener) mqDesk.addEventListener('change', onLayout);
  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fitScroll, 120); });

  renderSums();
  fitScroll();
})();
