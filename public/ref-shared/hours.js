/*
 * Horarios y «Abierto ahora» en hora de Santo Domingo (America/Santo_Domingo, sin horario de verano).
 *   <script src="../../ref-shared/hours.js"></script>   (después de frame.js)
 *
 *   var schedule = [ [], [[540,1080]], [[540,1080]], ... ];   // domingo..sábado; minutos desde medianoche
 *   var s = GAYA_HOURS.status(schedule);
 *   s.open      → true/false
 *   s.closesAt  → minutos si está abierto (hoy)          s.opensAt → { day, min } del próximo tramo si está cerrado
 *   s.day       → 0..6 (hoy)                               s.minutes → minutos actuales
 *   GAYA_HOURS.fmt(min, lang)   → "6:00 p. m." / "6:00 PM"
 *   GAYA_HOURS.dayName(day, lang, 'long'|'short')
 *   GAYA_HOURS.today()          → Date "de hoy" en Santo Domingo (en ?still: miércoles 7-oct-2026, 10:30, fijo)
 *
 * En modo ?still (capturas) la hora se fija a miércoles 10:30 para que el resultado sea reproducible.
 * Para probar otra hora: ?now=2026-10-10T20:15 (se interpreta como hora de Santo Domingo).
 */
(function () {
  'use strict';
  var TZ = 'America/Santo_Domingo';
  var G = window.GAYA || { still: false, lang: 'es' };
  var params = new URLSearchParams(location.search);
  var FIXED = { y: 2026, m: 10, d: 7, h: 10, min: 30 }; // miércoles

  function parts(date) {
    var f = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
    var o = {};
    f.formatToParts(date).forEach(function (p) { o[p.type] = p.value; });
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { y: +o.year, m: +o.month, d: +o.day, day: days[o.weekday], minutes: (+o.hour % 24) * 60 + +o.minute };
  }

  function today() {
    var n = params.get('now');
    if (n) { var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(n); if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] + 4, +m[5])); }
    if (G.still) return new Date(Date.UTC(FIXED.y, FIXED.m - 1, FIXED.d, FIXED.h + 4, FIXED.min));
    return new Date();
  }

  function status(schedule) {
    var p = parts(today());
    var slots = schedule[p.day] || [];
    var open = false, closesAt = null, opensAt = null;
    for (var i = 0; i < slots.length; i++) {
      if (p.minutes >= slots[i][0] && p.minutes < slots[i][1]) { open = true; closesAt = slots[i][1]; break; }
    }
    if (!open) {
      for (var k = 0; k < 8 && !opensAt; k++) {
        var day = (p.day + k) % 7;
        var list = schedule[day] || [];
        for (var j = 0; j < list.length; j++) {
          if (k > 0 || list[j][0] > p.minutes) { opensAt = { day: day, min: list[j][0], inDays: k }; break; }
        }
      }
    }
    return { open: open, closesAt: closesAt, opensAt: opensAt, day: p.day, minutes: p.minutes };
  }

  function fmt(min, lang) {
    var h = Math.floor(min / 60) % 24, m = min % 60;
    var mm = (m < 10 ? '0' : '') + m;
    if ((lang || G.lang) === 'en') return ((h + 11) % 12 + 1) + ':' + mm + ' ' + (h < 12 ? 'AM' : 'PM');
    return ((h + 11) % 12 + 1) + ':' + mm + ' ' + (h < 12 ? 'a. m.' : 'p. m.');
  }

  var NAMES = {
    es: { long: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'], short: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'] },
    en: { long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
  };
  function dayName(day, lang, size) { return NAMES[lang || G.lang][size || 'long'][day]; }

  window.GAYA_HOURS = { status: status, fmt: fmt, dayName: dayName, today: today, parts: parts, tz: TZ };
})();
