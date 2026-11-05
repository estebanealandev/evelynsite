// Árbol de copa ancha y dos árboles jóvenes bajo su sombra. Toda la forma se genera por código.
// No importa three.js: se ejecuta en un Worker para no bloquear la página.
type V3 = [number, number, number];
export type Tramo = { a: V3; b: V3; r0: number; r1: number; nace: number; dur: number; tono: number };
export type Hoja = { p: V3; nace: number; rot: number; tam: number; tono: number };
export type Bosque = { tramos: Tramo[]; hojas: Hoja[] };

function azar(semilla: number) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

type Opciones = { semilla: number; atractores: number; hojasPorPunta: number; tono: number };
type Nodo = { p: V3; padre: number; hijos: number[]; r: number; nace: number };

// Colonización del espacio: las ramas crecen hacia puntos de una copa en forma de sombrilla,
// lo que reparte el follaje de manera natural y uniforme.
function crearArbol({ semilla, atractores, hojasPorPunta, tono }: Opciones): Bosque {
  const r = azar(semilla);
  const PASO = 0.03, INFLUENCIA = 0.2, CONTACTO = 0.05;
  const ANCHO_COPA = 0.62, ALTO_COPA = 0.34, CENTRO_COPA = 0.64;

  const puntos: V3[] = [];
  while (puntos.length < atractores) {
    const x = r() * 2 - 1, y = r() * 2 - 1;
    if (x * x + y * y > 1) continue;
    // Solo la parte superior y un poco de la inferior: copa ancha, no una esfera.
    if (y < -0.42) continue;
    puntos.push([x * ANCHO_COPA, CENTRO_COPA + y * ALTO_COPA, (r() - 0.5) * 0.24]);
  }

  const nodos: Nodo[] = [{ p: [0, 0, 0], padre: -1, hijos: [], r: 0, nace: 0 }];
  // Tronco con una ligera inclinación.
  const pasosTronco = Math.round(0.36 / PASO);
  for (let i = 1; i <= pasosTronco; i++) {
    const q = nodos[i - 1].p;
    nodos.push({ p: [q[0] + (r() - 0.5) * 0.008, q[1] + PASO, 0], padre: i - 1, hijos: [], r: 0, nace: 0 });
    nodos[i - 1].hijos.push(i);
  }

  const vivos = puntos.slice();
  for (let iter = 0; iter < 170 && vivos.length; iter++) {
    const tirones = new Map<number, [number, number, number, number]>();
    for (const a of vivos) {
      let mejor = -1, dm = INFLUENCIA * INFLUENCIA;
      for (let n = 0; n < nodos.length; n++) {
        const q = nodos[n].p;
        const dx = a[0] - q[0], dy = a[1] - q[1], dz = a[2] - q[2];
        const d = dx * dx + dy * dy + dz * dz;
        if (d < dm) { dm = d; mejor = n; }
      }
      if (mejor < 0) continue;
      const q = nodos[mejor].p;
      const l = Math.sqrt(dm) || 1;
      const v = tirones.get(mejor) ?? [0, 0, 0, 0];
      tirones.set(mejor, [v[0] + (a[0] - q[0]) / l, v[1] + (a[1] - q[1]) / l, v[2] + (a[2] - q[2]) / l, v[3] + 1]);
    }
    if (!tirones.size) {
      // Sin nadie en rango, la punta del tronco sigue subiendo hasta alcanzar la copa.
      const n = nodos.length - 1, q = nodos[n].p;
      nodos.push({ p: [q[0], q[1] + PASO, q[2]], padre: n, hijos: [], r: 0, nace: 0 });
      nodos[n].hijos.push(nodos.length - 1);
      continue;
    }
    for (const [n, v] of tirones) {
      const l = Math.hypot(v[0], v[1], v[2]) || 1;
      const q = nodos[n].p;
      const sube = 0.12;
      const d: V3 = [v[0] / l + (r() - 0.5) * 0.3, v[1] / l + sube + (r() - 0.5) * 0.3, v[2] / l + (r() - 0.5) * 0.3];
      const m = Math.hypot(d[0], d[1], d[2]);
      nodos.push({ p: [q[0] + (d[0] / m) * PASO, q[1] + (d[1] / m) * PASO, q[2] + (d[2] / m) * PASO], padre: n, hijos: [], r: 0, nace: 0 });
      nodos[n].hijos.push(nodos.length - 1);
    }
    for (let k = vivos.length - 1; k >= 0; k--) {
      const a = vivos[k];
      for (let n = nodos.length - tirones.size; n < nodos.length; n++) {
        const q = nodos[n].p;
        if ((a[0] - q[0]) ** 2 + (a[1] - q[1]) ** 2 + (a[2] - q[2]) ** 2 < CONTACTO * CONTACTO) { vivos.splice(k, 1); break; }
      }
    }
  }

  // Suaviza los quiebres para que las ramas se vean orgánicas.
  for (let pasada = 0; pasada < 2; pasada++) {
    const previo = nodos.map(n => n.p);
    nodos.forEach((n, i) => {
      if (n.padre < 0 || !n.hijos.length) return;
      const a = previo[n.padre], b = previo[n.hijos[0]], c = previo[i];
      n.p = [c[0] * 0.5 + (a[0] + b[0]) * 0.25, c[1] * 0.5 + (a[1] + b[1]) * 0.25, c[2] * 0.5 + (a[2] + b[2]) * 0.25];
    });
  }

  // Grosor por modelo de tubos: cada rama es tan gruesa como la suma de sus hijas.
  for (let i = nodos.length - 1; i >= 0; i--) {
    const n = nodos[i];
    n.r = n.hijos.length ? Math.pow(n.hijos.reduce((s, h) => s + Math.pow(nodos[h].r, 2.6), 0), 1 / 2.6) : 0.001;
  }
  const factor = 0.021 / nodos[0].r;
  // Momento de nacimiento según la distancia recorrida desde la base.
  for (let i = 1; i < nodos.length; i++) nodos[i].nace = nodos[nodos[i].padre].nace + PASO;

  const tramos: Tramo[] = [];
  const hojas: Hoja[] = [];
  let tiempo = 0, alto = 0, anchoMax = 0;
  for (const n of nodos) { tiempo = Math.max(tiempo, n.nace); alto = Math.max(alto, n.p[1]); anchoMax = Math.max(anchoMax, Math.abs(n.p[0])); }
  tiempo += 0.14;
  for (let i = 1; i < nodos.length; i++) {
    const n = nodos[i], q = nodos[n.padre];
    tramos.push({ a: q.p, b: n.p, r0: q.r * factor, r1: n.r * factor, nace: q.nace / tiempo, dur: PASO / tiempo, tono });
    if (!n.hijos.length || (n.p[1] > 0.42 && r() < 0.3)) {
      for (let k = 0; k < hojasPorPunta; k++) {
        const ang = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.07;
        hojas.push({
          p: [n.p[0] + Math.cos(ang) * d, n.p[1] + Math.sin(ang) * d * 0.72, n.p[2] + (r() - 0.5) * 0.05],
          nace: (n.nace + 0.02 + r() * 0.12) / tiempo,
          rot: r() * Math.PI,
          tam: 0.0075 + r() * 0.0075,
          tono: r()
        });
      }
    }
  }
  const e = (v: V3): V3 => [v[0] / alto, v[1] / alto, v[2] / alto];
  for (const q of tramos) { q.a = e(q.a); q.b = e(q.b); q.r0 /= alto; q.r1 /= alto; }
  for (const h of hojas) h.p = e(h.p);
  return { tramos, hojas };
}

// Un árbol que resguarda a dos árboles jóvenes, que empiezan a crecer después.
export function crearBosque(pequena: boolean): Bosque {
  const grande = crearArbol({ semilla: 31, atractores: pequena ? 190 : 300, hojasPorPunta: pequena ? 5 : 8, tono: 0 });
  const jovenes: [number, number, number, number][] = [[-0.2, 0.25, 12, 0.32], [0.23, 0.18, 47, 0.44]];
  const tramos = [...grande.tramos];
  const hojas = [...grande.hojas];
  for (const [x, esc, semilla, inicio] of jovenes) {
    const j = crearArbol({ semilla, atractores: 60, hojasPorPunta: 6, tono: 1 });
    const m = (v: V3): V3 => [v[0] * esc + x, v[1] * esc, v[2] * esc + 0.02];
    const t = (v: number) => inicio + v * (1 - inicio);
    for (const q of j.tramos) tramos.push({ ...q, a: m(q.a), b: m(q.b), r0: q.r0 * esc * 1.5, r1: q.r1 * esc * 1.5, nace: t(q.nace), dur: q.dur * (1 - inicio) });
    for (const h of j.hojas) hojas.push({ ...h, p: m(h.p), nace: t(h.nace), tam: h.tam * 0.74, tono: 1 });
  }
  return { tramos, hojas };
}
