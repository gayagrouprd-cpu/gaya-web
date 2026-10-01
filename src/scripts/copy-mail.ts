// «Copiar» el correo (DIRECTION §8.8). `navigator.clipboard` exige contexto seguro y el HTTPS de gaya.com.do aún no está emitido
// (http:// responde), así que hay respaldo con `document.execCommand('copy')`. El estado «Copiado» es la ÚNICA región `role="status"`
// de la página; su texto viene del botón (`data-done`, de src/i18n/copy.ts). Si no se puede copiar, se deja el correo seleccionado.

const SHOW_MS = 2200;

function legacyCopy(text: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.setAttribute('aria-hidden', 'true');
  ta.tabIndex = -1;
  Object.assign(ta.style, { position: 'fixed', top: '0', left: '0', width: '1px', height: '1px', opacity: '0', pointerEvents: 'none' });
  document.body.append(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

async function copyText(text: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // permiso denegado o documento sin foco: se prueba el respaldo
    }
  }
  return legacyCopy(text);
}

function initCopyMail(): void {
  for (const btn of document.querySelectorAll<HTMLButtonElement>('button[data-copy]')) {
    const row = btn.closest('dd') ?? btn.parentElement;
    const status = row?.querySelector<HTMLElement>('[role="status"]');
    const addr = row?.querySelector<HTMLElement>('a');
    let timer = 0;
    btn.addEventListener('click', async () => {
      const ok = await copyText(btn.dataset.copy ?? '');
      btn.focus({ preventScroll: true }); // el respaldo mueve el foco a un textarea temporal
      window.clearTimeout(timer);
      if (ok && status) {
        status.textContent = btn.dataset.done ?? '';
        timer = window.setTimeout(() => (status.textContent = ''), SHOW_MS);
      } else if (addr) {
        getSelection()?.selectAllChildren(addr);
      }
    });
  }
}

initCopyMail();
