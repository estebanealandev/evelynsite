// Orquesta el laboratorio: un solo lienzo, un concepto activo, scroll, cursor y modos de respaldo.
import { WebGLRenderer } from 'three';
import { clamp, type Concepto, type Crear, type Zona } from './types';

const CONCEPTOS: Record<string, () => Promise<{ crear: Crear }>> = {
  a: () => import('./concepto-a'),
  b: () => import('./concepto-b'),
  c: () => import('./concepto-c'),
  d: () => import('./concepto-d')
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
  nota.textContent = 'Este dispositivo no admite WebGL: se muestra la versión estática.';
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
  let zona: Zona = { cx: 0.75, cy: 0.3, w: 0.3, h: 0.4, tituloTop: 0.45, cabecera: 0.12 };
  let t = reducido ? 100 : 0;
  let progreso = reducido ? 1 : 0;
  let cx = 0, cy = 0, mx = 0, my = 0;
  let acumulado = 0, cuenta = 0;

  // Busca el mayor espacio libre sobre el titular o a la derecha de su primera línea.
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
    const panel = document.querySelector('.lab-panel')!.getBoundingClientRect();
    const cabecera = document.querySelector<HTMLElement>('.site-header')!.offsetHeight;
    const arriba = Math.max(cabecera, panel.bottom < innerHeight / 2 ? panel.bottom - c.top : 0) + 14;
    const izq = margen.left - c.left;
    // El monograma puede ocupar parte del margen derecho.
    const der = margen.right - c.left + (c.width - (margen.right - c.left)) * 0.5;
    const uno = lineas[0], dos = lineas[1];
    const techo = uno.top - c.top;
    const ASPECTO = 0.85;
    const ajustar = (ancho: number, alto: number) => Math.max(0, Math.min(alto, ancho / ASPECTO));
    const altoSobre = ajustar(der - izq, techo - arriba - 8);
    const inicioLado = uno.right - c.left + 28;
    const piso = (dos ? dos.top : uno.bottom) - c.top - 4;
    const altoLado = ajustar(der - inicioLado, piso - arriba);
    const h = Math.max(altoSobre, altoLado);
    const w = h * ASPECTO;
    const vertical = c.width < c.height;
    let cx = der - w / 2;
    let cy = arriba + h / 2;
    if (altoSobre >= altoLado) {
      cy = (arriba + techo - 8) / 2;
      if (vertical) cx = (izq + der) / 2;
    }
    zona = { cx: cx / c.width, cy: cy / c.height, w: w / c.width, h: h / c.height, tituloTop: techo / c.height, cabecera: cabecera / c.height };
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
    if (!CONCEPTOS[id]) id = 'd';
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
    const id = { 1: 'd', 2: 'a', 3: 'b', 4: 'c' }[e.key];
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
    nota.textContent = 'Se perdió el contexto 3D: se muestra la versión estática.';
  });

  document.fonts?.ready.then(dimensiones);
  elegir(location.hash.slice(1) || 'd');
  bucle();
}
