/*
 * Cimiento · interacciones de la página.
 * Horario vivo, índice con scrollspy, tabla de proyectos (filtro, orden y foto que se descubre desde la fila),
 * antes/después arrastrable, hojas de contacto, vCard, formulario de presupuesto y menú móvil.
 * Todo lee window.GAYA.still: en ?still no hay esperas ni transiciones por JS.
 */
(function () {
  'use strict';

  var G = window.GAYA || { still: false, lang: 'es' };
  var H = window.GAYA_HOURS || null;
  var still = !!G.still;
  var reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var deskMq = window.matchMedia('(min-width: 1100px)');
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function reduced() { return reduceMq.matches; }
  function onChange(mq, fn) { if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn); }

  /* ── Horario de oficina y «Abierto ahora» (hora de Santo Domingo) ───────── */
  // domingo..sábado, minutos desde medianoche: lun–vie 8:00–17:00, sáb 8:00–12:00
  var SCHEDULE = [[], [[480, 1020]], [[480, 1020]], [[480, 1020]], [[480, 1020]], [[480, 1020]], [[480, 720]]];
  function hora(min) { return min === 720 ? '12:00 m.' : H.fmt(min, 'es'); }

  function paintStatus() {
    if (!H) return;
    var s = H.status(SCHEDULE);
    var main = s.open ? 'Abierto ahora' : 'Cerrado';
    var sub = '';
    if (s.open) sub = 'cierra a las ' + hora(s.closesAt);
    else if (s.opensAt) {
      var o = s.opensAt;
      var when = o.inDays === 0 ? 'hoy' : o.inDays === 1 ? 'mañana' : 'el ' + H.dayName(o.day, 'es');
      sub = 'abre ' + when + ' a las ' + hora(o.min);
    }
    $$('[data-status]').forEach(function (el) {
      el.setAttribute('data-open', s.open ? 'true' : 'false');
      $('.status__main', el).textContent = main;
      $('.status__sub', el).textContent = sub;
    });
    $$('.hours tr[data-days]').forEach(function (tr) {
      var isToday = tr.getAttribute('data-days').split(',').indexOf(String(s.day)) > -1;
      var th = tr.querySelector('th');
      var tag = th.querySelector('.today');
      tr.classList.toggle('is-today', isToday);
      if (isToday && !tag) {
        tag = document.createElement('span');
        tag.className = 'today';
        tag.textContent = 'hoy';
        th.appendChild(tag);
      } else if (!isToday && tag) tag.remove();
    });
  }
  paintStatus();
  if (H && !still) setInterval(paintStatus, 30000);

  /* ── Índice lateral con scrollspy ─────────────────────────────────────── */
  var index = $('.index');
  if (index && 'IntersectionObserver' in window) {
    var links = $$('.index__list a', index);
    var mark = $('.index__mark', index);
    var sections = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var inBand = {};
    var current = null;

    var setCurrent = function (id) {
      if (id === current) return;
      current = id;
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        if (on) {
          a.setAttribute('aria-current', 'true');
          mark.style.setProperty('--y', a.offsetTop + 'px');
        } else a.removeAttribute('aria-current');
      });
      index.classList.toggle('is-live', !!id);
    };

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { inBand[e.target.id] = e.isIntersecting; });
      var id = null;
      sections.forEach(function (s) { if (!id && inBand[s.id]) id = s.id; });
      if (!id && sections[0].getBoundingClientRect().top < window.innerHeight * 0.4) return; // entre secciones o en el pie: se queda la última
      setCurrent(id);
    }, { rootMargin: '-38% 0px -58% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ── Proyectos: filtro, orden y foto que se descubre desde la fila ────── */
  var table = $('.ptable');
  if (table) {
    var tbody = table.tBodies[0];
    var rows = $$('tr', tbody);
    var frame = $('.visor__frame');
    var capName = $('[data-cap-name]');
    var capMeta = $('[data-cap-meta]');
    var countEl = $('#p-count');
    var sortMsg = $('#p-sort');
    var active = null;
    var layer = 2;
    var work = $('.work');

    // Las fotos viven en su fila; en escritorio se superponen al marco del visor, que las mide
    var measure = function () {
      if (!deskMq.matches) return;
      work.style.setProperty('--visor-w', frame.offsetWidth + 'px');
      work.style.setProperty('--visor-top', frame.offsetTop + 'px');
    };
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(frame);
    window.addEventListener('resize', measure);
    measure();

    var area = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
    var btnOf = function (r) { return r.querySelector('.prow'); };
    var cellOf = function (r) { return r.querySelector('.pfoto'); };
    var firstVisible = function () { for (var i = 0; i < rows.length; i++) if (!rows[i].hidden) return rows[i]; return null; };
    var setOpen = function (r, on) {
      r.classList.toggle('is-open', on);
      btnOf(r).setAttribute('aria-expanded', on ? 'true' : 'false');
    };

    // En escritorio las fotos se precargan cuando la tabla se acerca: el revelado nunca descubre un hueco
    var preload = function () {
      rows.forEach(function (x) { var img = cellOf(x).querySelector('img'); if (img.loading === 'lazy') img.loading = 'eager'; });
    };
    if ('IntersectionObserver' in window) {
      var near = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; }) && deskMq.matches) { preload(); near.disconnect(); }
      }, { rootMargin: '800px 0px' });
      near.observe(work);
    }

    var reveal = function (r, instant) {
      var cell = cellOf(r);
      var img = cell.querySelector('img');
      if (!instant && !still && img && !img.complete) {
        img.loading = 'eager';
        img.addEventListener('load', function () { if (active === r) reveal(r); }, { once: true });
        return;
      }
      layer += 1;
      cell.style.zIndex = layer;
      cell.style.transition = 'none';
      if (instant || still) {
        cell.style.clipPath = 'inset(0 0 0 0)';
        cell.style.opacity = '';
        void cell.offsetWidth;
        cell.style.transition = '';
        return;
      }
      if (reduced()) {
        // Sin desplazamiento: la foto aparece con un fundido corto
        cell.style.clipPath = 'inset(0 0 0 0)';
        cell.style.opacity = '0';
        void cell.offsetWidth;
        cell.style.transition = '';
        cell.style.opacity = '1';
        return;
      }
      // La foto se abre desde la altura de la fila: una franja que crece hasta llenar el visor
      var fr = frame.getBoundingClientRect();
      var rr = r.getBoundingClientRect();
      var y = ((rr.top + rr.height / 2) - fr.top) / fr.height * 100;
      y = Math.max(0, Math.min(100, y));
      cell.style.opacity = '';
      cell.style.clipPath = 'inset(' + y.toFixed(2) + '% 0 ' + (100 - y).toFixed(2) + '% 0)';
      void cell.offsetWidth;
      cell.style.transition = '';
      cell.style.clipPath = 'inset(0 0 0 0)';
    };

    var activate = function (r, instant) {
      if (!r || r.hidden) return;
      if (deskMq.matches && r === active) return;
      rows.forEach(function (x) { setOpen(x, x === r); });
      active = r;
      if (deskMq.matches) {
        capName.textContent = r.getAttribute('data-name');
        capMeta.textContent = r.getAttribute('data-zone') + ' · ' + area(r.getAttribute('data-area')) + ' m²';
        reveal(r, instant);
      }
    };

    tbody.addEventListener('click', function (e) {
      var b = e.target.closest('.prow');
      if (!b) return;
      var r = b.closest('tr');
      if (!deskMq.matches && r.classList.contains('is-open')) {
        setOpen(r, false);
        active = null;
      } else activate(r);
    });
    tbody.addEventListener('mouseover', function (e) {
      if (!deskMq.matches) return;
      var r = e.target.closest('tr');
      if (r && r.parentNode === tbody) activate(r);
    });
    tbody.addEventListener('focusin', function (e) {
      if (!deskMq.matches) return;
      var r = e.target.closest('tr');
      if (r) activate(r);
    });

    var resetLayout = function () {
      rows.forEach(function (x) {
        var c = cellOf(x);
        c.style.clipPath = '';
        c.style.transition = '';
        c.style.zIndex = '';
        c.style.opacity = '';
      });
      var keep = active && !active.hidden ? active : firstVisible();
      active = null;
      activate(keep, true);
    };
    onChange(deskMq, resetLayout);
    activate(firstVisible(), true);

    // Filtro por tipo
    var filters = $$('.filter [data-filter]');
    filters.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter');
        filters.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        var n = 0;
        rows.forEach(function (r) {
          var show = f === 'todos' || r.getAttribute('data-type') === f;
          r.hidden = !show;
          if (show) n += 1;
        });
        countEl.textContent = n === 0 ? 'Sin obras de este tipo' : n + (n === 1 ? ' obra' : ' obras');
        if (!active || active.hidden) {
          active = null;
          activate(firstVisible());
        }
      });
    });

    // Orden por columna (botón en cada encabezado, estado en aria-sort)
    var heads = $$('thead th[data-key]', table);
    var numeric = { year: true, area: true };
    var WORDS = {
      name: ['por proyecto, de la A a la Z', 'por proyecto, de la Z a la A'],
      type: ['por tipo, de la A a la Z', 'por tipo, de la Z a la A'],
      zone: ['por zona, de la A a la Z', 'por zona, de la Z a la A'],
      year: ['por año, del más antiguo al más reciente', 'por año, del más reciente al más antiguo'],
      area: ['por superficie, de menor a mayor', 'por superficie, de mayor a menor'],
    };
    var value = function (r, k) {
      if (numeric[k]) return +r.getAttribute('data-' + k);
      if (k === 'type') return r.querySelector('.c-type').textContent;
      return r.getAttribute('data-' + k);
    };
    var sortBy = function (key, dir) {
      var m = dir === 'ascending' ? 1 : -1;
      rows.sort(function (a, b) {
        var va = value(a, key);
        var vb = value(b, key);
        var c = numeric[key] ? va - vb : va.localeCompare(vb, 'es', { sensitivity: 'base' });
        if (c) return c * m;
        return (+b.getAttribute('data-year') - +a.getAttribute('data-year')) || (+b.getAttribute('data-area') - +a.getAttribute('data-area'));
      });
      rows.forEach(function (r) { tbody.appendChild(r); });
      heads.forEach(function (th) {
        if (th.getAttribute('data-key') === key) th.setAttribute('aria-sort', dir);
        else th.removeAttribute('aria-sort');
      });
      sortMsg.textContent = 'Ordenado ' + WORDS[key][dir === 'ascending' ? 0 : 1];
    };
    heads.forEach(function (th) {
      $('button', th).addEventListener('click', function () {
        var key = th.getAttribute('data-key');
        var cur = th.getAttribute('aria-sort');
        var dir = cur ? (cur === 'ascending' ? 'descending' : 'ascending') : (numeric[key] ? 'descending' : 'ascending');
        sortBy(key, dir);
      });
    });
  }

  /* ── Antes / después ──────────────────────────────────────────────────── */
  var stage = $('.ab__stage');
  if (stage) {
    var range = $('.ab__range', stage);
    var pos = 50;
    var drag = null;
    var raf = 0;
    var lastX = 0;

    var setPos = function (v) {
      pos = Math.max(0, Math.min(100, v));
      stage.style.setProperty('--pos', pos.toFixed(2) + '%');
      var a = Math.round(pos);
      range.value = String(a);
      range.setAttribute('aria-valuetext', 'Antes ' + a + ' %, después ' + (100 - a) + ' %');
    };
    var xToPos = function (x) {
      var b = stage.getBoundingClientRect();
      return (x - b.left) / b.width * 100;
    };

    range.addEventListener('input', function () { setPos(+range.value); });
    range.addEventListener('keydown', function (e) {
      var k = e.key;
      var v = null;
      if (k === 'ArrowLeft' || k === 'ArrowDown') v = pos - 5;
      else if (k === 'ArrowRight' || k === 'ArrowUp') v = pos + 5;
      else if (k === 'PageDown') v = pos - 10;
      else if (k === 'PageUp') v = pos + 10;
      else if (k === 'Home') v = 0;
      else if (k === 'End') v = 100;
      if (v === null) return;
      e.preventDefault();
      setPos(v);
    });

    // Ratón: arrastra desde cualquier punto. Táctil: solo con gesto horizontal (el vertical desplaza la página).
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, on: e.pointerType === 'mouse' };
      try { stage.setPointerCapture(e.pointerId); } catch (_) { /* sin captura: sigue funcionando dentro del área */ }
      if (drag.on) {
        e.preventDefault();
        stage.classList.add('is-drag');
        setPos(xToPos(e.clientX));
        range.focus({ preventScroll: true });
      }
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.on) {
        var dx = Math.abs(e.clientX - drag.x);
        var dy = Math.abs(e.clientY - drag.y);
        if (dx < 6 || dx < dy) return;
        drag.on = true;
        stage.classList.add('is-drag');
      }
      lastX = e.clientX;
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; setPos(xToPos(lastX)); });
    });
    var end = function (e) {
      if (!drag) return;
      if (!drag.on && e && e.type === 'pointerup') setPos(xToPos(e.clientX)); // toque corto: lleva el corte al punto tocado
      drag = null;
      stage.classList.remove('is-drag');
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', function () { drag = null; stage.classList.remove('is-drag'); });
    setPos(50);
  }

  /* ── Diálogos: cierre, Escape y clic fuera ────────────────────────────── */
  $$('dialog').forEach(function (d) {
    d.addEventListener('click', function (e) {
      if (e.target !== d) return;
      var r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
  });
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', function () { b.closest('dialog').close(); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = $('dialog[open]');
    if (open) {
      e.preventDefault(); // que el visor no reciba este Escape
      open.close();
    }
  });

  /* ── Hojas de contacto: WhatsApp, llamar y correo sin salir de la página ─ */
  var sheet = $('#sheet');
  var CH = {
    whatsapp: { t: 'WhatsApp', ico: '#i-chat', v: '809-555-0142', msg: 'Hola, Cimiento. Quiero pedir un presupuesto para mi obra.', copy: 'Copiar número' },
    llamar: { t: 'Llamar', ico: '#i-phone', v: '809-555-0142', msg: '', copy: 'Copiar número' },
    correo: { t: 'Correo', ico: '#i-mail', v: 'obras@example.com', msg: 'Asunto: presupuesto de obra', copy: 'Copiar correo' },
  };
  if (sheet) {
    var opener = null;
    var chan = null;
    var copyBtn = $('[data-copy]', sheet);
    var copyLabel = $('[data-copy-label]', sheet);
    var copyIco = $('[data-copy-ico] use', sheet);
    var copyNote = $('[data-copy-status]', sheet);
    var valEl = $('[data-sheet-val]', sheet);

    var resetCopy = function () {
      copyLabel.textContent = chan.copy;
      copyIco.setAttribute('href', '#i-copy');
      copyNote.textContent = '';
      copyNote.classList.remove('is-error');
    };
    $$('[data-channel]').forEach(function (b) {
      b.addEventListener('click', function () {
        chan = CH[b.getAttribute('data-channel')];
        opener = b;
        $('[data-sheet-title]', sheet).textContent = chan.t;
        $('[data-sheet-ico] use', sheet).setAttribute('href', chan.ico);
        valEl.textContent = chan.v;
        var msg = $('[data-sheet-msg]', sheet);
        msg.textContent = chan.msg;
        msg.hidden = !chan.msg;
        resetCopy();
        sheet.showModal();
      });
    });
    sheet.addEventListener('close', function () { if (opener) opener.focus(); });

    var copied = function () {
      copyLabel.textContent = 'Copiado';
      copyIco.setAttribute('href', '#i-check');
      copyNote.classList.remove('is-error');
      copyNote.textContent = chan.v + ' en el portapapeles';
    };
    var failed = function () {
      var sel = window.getSelection();
      var rg = document.createRange();
      rg.selectNodeContents(valEl);
      sel.removeAllRanges();
      sel.addRange(rg);
      copyNote.classList.add('is-error');
      copyNote.textContent = 'No se pudo copiar. Queda seleccionado para copiarlo a mano.';
    };
    var legacyCopy = function () {
      var ta = document.createElement('textarea');
      ta.value = chan.v;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      sheet.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
      ta.remove();
      return ok;
    };
    copyBtn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(chan.v).then(copied, function () { if (legacyCopy()) copied(); else failed(); });
      } else if (legacyCopy()) copied();
      else failed();
    });
  }

  /* ── Guardar contacto: vCard generada en el navegador ─────────────────── */
  var vbtn = $('#vcard');
  if (vbtn) {
    var vlabel = $('[data-vcard-label]', vbtn);
    var vstatus = $('#vcard-status');
    vbtn.addEventListener('click', function () {
      var card = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:;Cimiento;;;',
        'FN:Cimiento',
        'ORG:Cimiento Constructora',
        'TEL;TYPE=WORK,VOICE:+1 809 555 0142',
        'EMAIL;TYPE=WORK:obras@example.com',
        'ADR;TYPE=WORK:;;Naco;Santo Domingo;;;República Dominicana',
        'NOTE:Oficina lun-vie 8:00-17:00 · sáb 8:00-12:00',
        'END:VCARD',
      ].join('\r\n');
      try {
        var url = URL.createObjectURL(new Blob([card], { type: 'text/vcard;charset=utf-8' }));
        var a = document.createElement('a');
        a.href = url;
        a.download = 'Cimiento.vcf';
        a.click();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        vbtn.classList.add('is-done');
        vlabel.textContent = 'Guardado';
        $('use', vbtn).setAttribute('href', '#i-check');
        vstatus.textContent = 'Contacto guardado: Cimiento.vcf';
      } catch (_) {
        vstatus.textContent = 'No se pudo generar la tarjeta de contacto.';
      }
    });
  }

  /* ── Solicitud de presupuesto ─────────────────────────────────────────── */
  var form = $('#presupuesto');
  if (form) {
    var done = $('#quote-done');
    var nameI = $('#q-name');
    var telI = $('#q-tel');
    var kindSet = $('.field--kind', form);
    var submit = $('[data-submit]', form);
    var submitLabel = $('[data-submit-label]', form);
    var tried = false;

    var telFmt = function (s) {
      var d = String(s || '').replace(/\D/g, '');
      if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);
      return d.length === 10 ? d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6) : null;
    };
    var kind = function () { var c = $('input[name="tipo"]:checked', form); return c ? c.value : null; };
    var flag = function (input, errId, bad) {
      $('#' + errId).hidden = !bad;
      if (input) input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    };
    var check = function () {
      var okName = nameI.value.trim().length >= 2;
      var okTel = !!telFmt(telI.value);
      var okKind = !!kind();
      flag(nameI, 'e-name', !okName);
      flag(telI, 'e-tel', !okTel);
      flag(null, 'e-kind', !okKind);
      kindSet.setAttribute('data-invalid', okKind ? 'false' : 'true');
      return okName ? (okTel ? (okKind ? null : $('input[name="tipo"]', form)) : telI) : nameI;
    };

    telI.addEventListener('blur', function () { var f = telFmt(telI.value); if (f) telI.value = f; });
    form.addEventListener('input', function () { if (tried) check(); });
    form.addEventListener('change', function () { if (tried) check(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submit.classList.contains('is-loading')) return;
      tried = true;
      var bad = check();
      if (bad) { bad.focus(); return; }
      submit.classList.add('is-loading');
      submit.setAttribute('aria-disabled', 'true');
      submitLabel.textContent = 'Enviando…';
      setTimeout(function () {
        var first = nameI.value.trim().split(/\s+/)[0];
        var tel = telFmt(telI.value);
        var ref = still ? 2417 : 1000 + Math.floor(Math.random() * 9000);
        $('[data-ref]', done).textContent = 'Solicitud CIM-' + ref;
        $('[data-done-title]', done).textContent = 'Solicitud recibida';
        $('[data-done-text]', done).textContent = 'Gracias, ' + first + '. Te llamamos al ' + tel + ' en horario de oficina para coordinar la visita.';
        $('[data-done-kind]', done).textContent = kind();
        $('[data-done-tel]', done).textContent = tel;
        submit.classList.remove('is-loading');
        submit.removeAttribute('aria-disabled');
        submitLabel.textContent = 'Solicitar presupuesto';
        form.hidden = true;
        done.hidden = false;
        $('[data-done-title]', done).focus();
      }, still ? 0 : 900);
    });

    $('[data-again]', done).addEventListener('click', function () {
      form.reset();
      tried = false;
      ['e-name', 'e-tel', 'e-kind'].forEach(function (id) { $('#' + id).hidden = true; });
      nameI.removeAttribute('aria-invalid');
      telI.removeAttribute('aria-invalid');
      kindSet.removeAttribute('data-invalid');
      done.hidden = true;
      form.hidden = false;
      nameI.focus();
    });

    // Los CTA llevan al formulario y dejan el cursor en el primer campo
    $$('a[href="#presupuesto"]').forEach(function (a) {
      a.addEventListener('click', function () {
        setTimeout(function () {
          if (!form.hidden) nameI.focus({ preventScroll: true });
          else $('[data-done-title]', done).focus({ preventScroll: true });
        }, still || reduced() ? 0 : 500);
      });
    });
  }

  /* ── Cómo llegar ──────────────────────────────────────────────────────── */
  var routeBtn = $('#route-btn');
  var route = $('#ruta');
  if (routeBtn && route) {
    route.hidden = true;
    routeBtn.setAttribute('aria-expanded', 'false');
    routeBtn.addEventListener('click', function () {
      var open = route.hidden;
      route.hidden = !open;
      routeBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ── Menú móvil a pantalla completa ───────────────────────────────────── */
  var menu = $('#menu');
  var menuBtn = $('.bar__menu');
  if (menu && menuBtn) {
    menuBtn.addEventListener('click', function () {
      menu.showModal();
      menuBtn.setAttribute('aria-expanded', 'true');
    });
    menu.addEventListener('close', function () { menuBtn.setAttribute('aria-expanded', 'false'); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { menu.close(); }); });
  }
})();
