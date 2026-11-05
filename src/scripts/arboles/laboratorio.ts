// Comparador de conceptos: panel de pruebas sobre la misma escena de la portada.
import { iniciarEscena } from './escena';

const raiz = document.querySelector<HTMLElement>('[data-lab]')!;
const botones = [...document.querySelectorAll<HTMLButtonElement>('[data-concepto]')];
const pausa = document.querySelector<HTMLButtonElement>('[data-pausa]')!;
const nota = document.querySelector<HTMLElement>('[data-nota]')!;
const fpsEl = document.querySelector<HTMLElement>('[data-fps]')!;
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

const control = iniciarEscena({
  raiz,
  canvas: raiz.querySelector('canvas')!,
  titulo: raiz.querySelector('.lab__title')!,
  pie: raiz.querySelector('.lab__foot')!,
  panel: document.querySelector('.lab-panel'),
  quieto: reducido
});

if (!control) {
  raiz.classList.add('sin-3d');
  nota.textContent = 'Este dispositivo no admite WebGL: se muestra el contenido sin animación.';
} else {
  control.onFps = fps => { fpsEl.textContent = `${fps} fps`; };
  const elegir = async (id: string) => {
    botones.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.concepto === id)));
    await control.elegir(id);
    history.replaceState(null, '', `#${id}`);
  };
  botones.forEach(b => b.addEventListener('click', () => elegir(b.dataset.concepto!)));
  addEventListener('keydown', e => {
    const id = ({ 1: 'crece', 2: 'particulas', 3: 'sombra' } as Record<string, string>)[e.key];
    if (id && !(e.target as HTMLElement).closest('input, textarea, select')) elegir(id);
  });
  let pausado = false;
  pausa.addEventListener('click', () => {
    pausado = !pausado;
    control.pausar(pausado);
    pausa.setAttribute('aria-pressed', String(pausado));
    pausa.textContent = pausado ? 'Reanudar' : 'Pausar';
  });
  if (reducido) {
    pausa.hidden = true;
    nota.textContent = 'Movimiento reducido activo: se muestra el estado final, sin animación.';
  }
  const pedido = location.hash.slice(1);
  elegir(['crece', 'particulas', 'sombra'].includes(pedido) ? pedido : 'crece');
}
