// Hero de la portada. No importa three.js: la escena se carga aparte, sin retrasar el contenido,
// y solo si el dispositivo y las preferencias de la persona lo permiten.
const raiz = document.querySelector<HTMLElement>('[data-hero]');

function hayWebGL() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

if (raiz) {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pausadoAntes = document.documentElement.dataset.movimiento === 'pausado';
  const limitado = !!nav.connection?.saveData || (nav.deviceMemory ?? 8) <= 2 || (navigator.hardwareConcurrency ?? 8) <= 2;

  if (reducido || limitado || !hayWebGL()) {
    raiz.classList.add('sin-3d');
  } else {
    const concepto = new URLSearchParams(location.search).get('arbol') || raiz.dataset.concepto || 'crece';
    const cargar = async () => {
      const { iniciarEscena } = await import('./escena');
      const control = iniciarEscena({
        raiz,
        canvas: raiz.querySelector('canvas')!,
        titulo: raiz.querySelector('[data-arbol-titulo]')!,
        pie: raiz.querySelector('[data-arbol-pie]')!,
        cola: 1,
        quieto: pausadoAntes,
        alPrimerCuadro: () => raiz.classList.add('is-3d')
      });
      if (!control) { raiz.classList.add('sin-3d'); return; }
      await control.elegir(concepto);
      addEventListener('movimiento', e => control.pausar((e as CustomEvent<boolean>).detail));
    };
    // Espera a que la página esté libre para no competir con el primer contenido.
    if ('requestIdleCallback' in window) requestIdleCallback(cargar, { timeout: 1800 });
    else setTimeout(cargar, 600);
  }
}
