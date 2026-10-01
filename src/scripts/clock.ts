// Hora de Santo Domingo en la placa «Quiénes somos» y en el pie (DIRECTION §8.3, §8.8). Sin API ni red: solo Intl.
// El HTML trae el lugar sin hora (así no se publica una hora del build); aquí se le pone la del momento, una sola vez.
// La plantilla («Santo Domingo · {time}») viene de src/i18n/copy.ts en `data-tpl`: este módulo no lleva texto propio.
// Sin región viva: el reloj no se anuncia.

function initClock(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-clock]')) {
    const { lang, tz, tpl } = el.dataset;
    if (!tpl || !tz) continue;
    try {
      const time = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-DO', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
      el.textContent = tpl.replace('{time}', time);
    } catch {
      // Sin Intl o con una zona desconocida se queda el lugar, sin hora.
    }
  }
}

initClock();
