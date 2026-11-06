// Orquesta la escena del árbol: lienzo, scroll, cursor, pausa y calidad adaptativa.
import { WebGLRenderer } from 'three';
import { crear } from './arbol-crece';
import type { Bosque } from './bosque';
import { clamp, type Arbol, type Zona } from './types';

// Calcula el árbol fuera del hilo principal. Si el Worker falla, lo calcula aquí como respaldo.
function pedirBosque(pequena: boolean): Promise<Bosque> {
  const respaldo = () => import('./bosque').then(m => m.crearBosque(pequena));
  try {
    const w = new Worker(new URL('./bosque.worker.ts', import.meta.url), { type: 'module' });
    return new Promise<Bosque>(resolve => {
      w.onmessage = e => { resolve(e.data); w.terminate(); };
      w.onerror = () => { w.terminate(); resolve(respaldo()); };
      w.postMessage(pequena);
    });
  } catch {
    return respaldo();
  }
}

export type Control = { pausar(valor: boolean): void };

type Opciones = {
  raiz: HTMLElement;
  canvas: HTMLCanvasElement;
  titulo: Element;
  pie: Element;
  // Parte final del recorrido, en pantallas, reservada para que la sección siguiente cubra el hero.
  cola?: number;
  // Muestra el estado final, quieto.
  quieto?: boolean;
  alPrimerCuadro?: () => void;
};

// Devuelve null si el dispositivo no puede crear el contexto WebGL.
export function iniciarEscena(o: Opciones): Control | null {
  const { raiz, canvas } = o;
  let r: WebGLRenderer;
  try {
    r = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }

  // Estado de solo lectura para las pruebas automáticas.
  const estadoPublico = { frames: 0, fps: 0, calidad: 1, tiempo: 0 };
  (window as unknown as { __arbol: typeof estadoPublico }).__arbol = estadoPublico;

  let arbol: Arbol | null = null;
  let visible = true;
  let pausado = !!o.quieto;
  // Baja la resolución de forma progresiva si el dispositivo no logra mantener la fluidez.
  let calidad = 1;
  let lento = 0;
  let ultimo = performance.now();
  const delta = () => { const a = performance.now(), d = (a - ultimo) / 1000; ultimo = a; return d; };
  let t = pausado ? 100 : 0;
  let progreso = pausado ? 1 : 0;
  let cx = 0, cy = 0, mx = 0, my = 0;
  let acumulado = 0, cuenta = 0;
  let primerCuadro = false;
  let zona: Zona = { sueloX: 0.8, sueloY: 0.8, altura: 0.6, linea1: [0, 0, 0, 0], linea2: [0, 0, 0, 0] };

  const dpr = () => Math.min(devicePixelRatio || 1, innerWidth < 768 ? 1.5 : 1.75) * calidad;

  // Coloca el árbol sobre la línea del pie si hay espacio a la derecha del titular; si no, sobre el titular.
  const medirZona = () => {
    const c = canvas.getBoundingClientRect();
    const rango = document.createRange();
    rango.selectNodeContents(o.titulo);
    const lineas: { top: number; bottom: number; right: number }[] = [];
    // Si el titular está partido en palabras animadas, se miden sus cajas, que no se desplazan.
    const palabras = [...o.titulo.querySelectorAll('.palabra')].map(p => p.getBoundingClientRect());
    (palabras.length ? palabras : [...rango.getClientRects()]).sort((a, b) => a.top - b.top).forEach(q => {
      const u = lineas[lineas.length - 1];
      if (u && q.top < u.top + (u.bottom - u.top) / 2) u.right = Math.max(u.right, q.right);
      else lineas.push({ top: q.top, bottom: q.bottom, right: q.right });
    });
    if (!lineas.length) return;
    const margen = o.titulo.getBoundingClientRect();
    const izq = margen.left - c.left, der = margen.right - c.left;
    const arriba = (document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0) + 10;
    const finTexto = Math.max(...lineas.map(l => l.right)) - c.left;
    const pie = o.pie.getBoundingClientRect().top - c.top;
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
    if (!w || !h) return;
    r.setPixelRatio(dpr());
    r.setSize(w, h, false);
    medirZona();
    arbol?.resize(w, h);
  };

  const scrollObjetivo = () => {
    const caja = raiz.getBoundingClientRect();
    const recorrido = caja.height - innerHeight * (1 + (o.cola ?? 0));
    return clamp(-caja.top / Math.max(1, recorrido));
  };

  const dibujar = (dt: number) => {
    if (!arbol) return;
    arbol.frame({ dt, t, progreso, x: cx, y: cy, zona });
    estadoPublico.frames++;
    if (!primerCuadro) { primerCuadro = true; o.alPrimerCuadro?.(); }
  };

  const bucle = () => {
    requestAnimationFrame(bucle);
    if (!visible || document.hidden || !arbol) { delta(); return; }
    // Tope alto: con pocos cuadros por segundo, el árbol debe crecer en el mismo tiempo, no más despacio.
    const dt = Math.min(delta(), 0.5);
    if (pausado) return;
    acumulado += dt; cuenta++;
    if (acumulado >= 0.5) {
      estadoPublico.fps = Math.round(cuenta / acumulado);
      lento = estadoPublico.fps < 28 ? lento + 1 : 0;
      if (lento >= 3 && calidad > 0.6) {
        calidad = Math.max(0.6, calidad * 0.8);
        estadoPublico.calidad = calidad;
        lento = 0;
        dimensiones();
      }
      acumulado = 0; cuenta = 0;
    }
    t += dt;
    estadoPublico.tiempo = t;
    const k = 1 - Math.exp(-dt * 5);
    progreso += (scrollObjetivo() - progreso) * k;
    cx += (mx - cx) * k;
    cy += (my - cy) * k;
    dibujar(dt);
  };

  pedirBosque(innerWidth < 768).then(datos => {
    arbol = crear(r, datos);
    dimensiones();
    if (pausado) dibujar(0);
  }).catch(() => raiz.classList.add('sin-3d'));

  addEventListener('resize', () => { dimensiones(); if (pausado) dibujar(0); });
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || pausado) return;
    mx = (e.clientX / innerWidth) * 2 - 1;
    my = -((e.clientY / innerHeight) * 2 - 1);
  }, { passive: true });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(raiz);
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    raiz.classList.add('sin-3d');
  });
  document.fonts?.ready.then(() => { dimensiones(); if (pausado) dibujar(0); });
  bucle();
  return {
    pausar(valor) {
      pausado = valor;
      // Al pausar se muestra un estado completo: el árbol nunca queda a medio crecer.
      if (valor) { t = Math.max(t, 100); progreso = 1; dibujar(0); }
      else delta();
    }
  };
}
