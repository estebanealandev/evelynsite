// Orquesta el laboratorio: un solo lienzo, un concepto activo, scroll, cursor y modos de respaldo.
import { WebGLRenderer } from 'three';
import { clamp, type Concepto, type Crear, type Zona } from './types';

const CONCEPTOS: Record<string, () => Promise<{ crear: Crear }>> = {
  crece: () => import('./arbol-crece'),
  particulas: () => import('./arbol-particulas'),
  sombra: () => import('./arbol-sombra')
};

const raiz = document.querySelector<HTMLElement>('[data-lab]')!;
const canvas = raiz.querySelector<HTMLCanvasElement>('canvas')!;
const botones = [...document.querySelectorAll<HTMLButtonElement>('[data-concepto]')];
const pausa = document.querySelector<HTMLButtonElement>('[data-pausa]')!;
const nota = document.querySelector<HTMLElement>('[data-nota]')!;
const fpsEl = document.querySelector<HTMLElement>('[data-fps]')!;

const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const estadoPublico = { concepto: '', frames: 0, fps: 0, reducido, calidad: 1 };
(window as unknown as { __lab: typeof estadoPublico }).__lab = estadoPublico;

let renderer: WebGLRenderer | null = null;
try {
  renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch {
  raiz.classList.add('lab--sin-webgl');
  nota.textContent = 'Este dispositivo no admite WebGL: se muestra el contenido sin animación.';
}

if (renderer) {
  const r = renderer;
  // Baja la resolución de forma progresiva si el dispositivo no logra mantener la fluidez.
  let calidad = 1;
  let lento = 0;
  const dpr = () => Math.min(devicePixelRatio || 1, innerWidth < 768 ? 1.5 : 1.75, actual?.dprMax ?? 9) * calidad;
  let actual: Concepto | null = null;
  let turno = 0;
  let visible = true;
  let pausado = reducido;
  let ultimo = performance.now();
  const delta = () => { const a = performance.now(), d = (a - ultimo) / 1000; ultimo = a; return d; };
  let zona: Zona = { sueloX: 0.8, sueloY: 0.8, altura: 0.6, linea1: [0, 0, 0, 0], linea2: [0, 0, 0, 0] };
  let t = reducido ? 100 : 0;
  let progreso = reducido ? 1 : 0;
  let cx = 0, cy = 0, mx = 0, my = 0;
  let acumulado = 0, cuenta = 0;

  // Coloca el árbol sobre la línea del pie si hay espacio a la derecha del titular; si no, sobre el titular.
  const medirZona = () => {
    const c = canvas.getBoundingClientRect();
    const titulo = raiz.querySelector('.lab__title')!;
    const rango = document.createRange();
    rango.selectNodeContents(titulo);
    const lineas: { top: number; bottom: number; right: number }[] = [];
    [...rango.getClientRects()].sort((a, b) => a.top - b.top).forEach(q => {
      const u = lineas[lineas.length - 1];
      if (u && q.top < u.top + (u.bottom - u.top) / 2) u.right = Math.max(u.right, q.right);
      else lineas.push({ top: q.top, bottom: q.bottom, right: q.right });
    });
    const margen = titulo.getBoundingClientRect();
    const izq = margen.left - c.left, der = margen.right - c.left;
    const panel = document.querySelector('.lab-panel')!.getBoundingClientRect();
    const cabecera = document.querySelector<HTMLElement>('.site-header')!.offsetHeight;
    const arriba = Math.max(cabecera, panel.bottom < innerHeight / 2 ? panel.bottom - c.top : 0) + 10;
    const finTexto = Math.max(...lineas.map(l => l.right)) - c.left;
    const pie = raiz.querySelector('.lab__foot')!.getBoundingClientRect().top - c.top;
    const techo = lineas[0].top - c.top;
    canvas.parentElement!.style.setProperty('--pie', `${pie}px`);
    const libre = der - finTexto;
    const alLado = libre >= 240;
    const sueloX = alLado ? finTexto + libre * 0.42 : (izq + der) * 0.5;
    const sueloY = alLado ? pie : techo - 4;
    const altura = Math.min((sueloY - arriba) * 0.96, c.height * (alLado ? 0.6 : 0.34), alLado ? (c.width - sueloX) * 1.5 : c.width * 0.72);
    const frac = (a: number, b: number, d: number, e: number) => [a / c.width, b / c.height, d / c.width, e / c.height] as [number, number, number, number];
    const uno = lineas[0], fin = lineas[lineas.length - 1];
    const resto = lineas.slice(1);
    zona = {
      sueloX: sueloX / c.width,
      sueloY: sueloY / c.height,
      altura: altura / c.height,
      linea1: frac(izq, techo, uno.right - c.left, uno.bottom - c.top),
      linea2: resto.length ? frac(izq, resto[0].top - c.top, Math.max(...resto.map(l => l.right)) - c.left, fin.bottom - c.top) : frac(0, 0, 0, 0)
    };
    Object.assign(estadoPublico, { zona });
  };

  const dimensiones = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    r.setPixelRatio(dpr());
    r.setSize(w, h, false);
    medirZona();
    actual?.resize(w, h);
  };

  const scrollObjetivo = () => {
    if (reducido) return 1;
    const caja = raiz.getBoundingClientRect();
    return clamp(-caja.top / Math.max(1, caja.height - innerHeight));
  };

  const dibujar = (dt: number) => {
    if (!actual) return;
    actual.frame({ dt, t, progreso, x: cx, y: cy, zona });
    estadoPublico.frames++;
  };

  const bucle = () => {
    requestAnimationFrame(bucle);
    if (!visible || document.hidden || !actual) { delta(); return; }
    const dt = Math.min(delta(), 0.1);
    acumulado += dt; cuenta++;
    if (acumulado >= 0.5) {
      estadoPublico.fps = Math.round(cuenta / acumulado);
      fpsEl.textContent = `${estadoPublico.fps} fps`;
      lento = estadoPublico.fps < 28 && !pausado ? lento + 1 : 0;
      if (lento >= 3 && calidad > 0.6) {
        calidad = Math.max(0.6, calidad * 0.8);
        estadoPublico.calidad = calidad;
        lento = 0;
        dimensiones();
      }
      acumulado = 0; cuenta = 0;
    }
    if (pausado) return;
    t += dt;
    const k = 1 - Math.exp(-dt * 5);
    progreso += (scrollObjetivo() - progreso) * k;
    cx += (mx - cx) * k;
    cy += (my - cy) * k;
    dibujar(dt);
  };

  const elegir = async (id: string) => {
    if (!CONCEPTOS[id]) id = 'crece';
    const este = ++turno;
    botones.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.concepto === id)));
    const { crear } = await CONCEPTOS[id]();
    if (este !== turno) return;
    actual?.dispose();
    r.setClearColor(0x14283e, 1);
    actual = crear(r);
    estadoPublico.concepto = id;
    if (!reducido) t = 0;
    dimensiones();
    history.replaceState(null, '', `#${id}`);
    if (reducido) dibujar(0);
  };

  addEventListener('resize', dimensiones);
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || reducido) return;
    mx = (e.clientX / innerWidth) * 2 - 1;
    my = -((e.clientY / innerHeight) * 2 - 1);
  }, { passive: true });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(raiz);

  botones.forEach(b => b.addEventListener('click', () => elegir(b.dataset.concepto!)));
  addEventListener('keydown', e => {
    const id = { 1: 'crece', 2: 'particulas', 3: 'sombra' }[e.key];
    if (id && !(e.target as HTMLElement).closest('input, textarea, select')) elegir(id);
  });
  pausa.addEventListener('click', () => {
    pausado = !pausado;
    pausa.setAttribute('aria-pressed', String(pausado));
    pausa.textContent = pausado ? 'Reanudar' : 'Pausar';
  });
  if (reducido) {
    pausa.hidden = true;
    nota.textContent = 'Movimiento reducido activo: se muestra el estado final, sin animación.';
    addEventListener('resize', () => dibujar(0));
  }
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    raiz.classList.add('lab--sin-webgl');
    nota.textContent = 'Se perdió el contexto 3D: se muestra el contenido sin animación.';
  });

  document.fonts?.ready.then(dimensiones);
  elegir(location.hash.slice(1) || 'crece');
  bucle();
}
