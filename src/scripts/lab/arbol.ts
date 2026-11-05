// Árbol de copa ancha y dos árboles jóvenes bajo su sombra. Toda la forma se genera por código.
import { BufferAttribute, BufferGeometry, DoubleSide, Mesh, Points, ShaderMaterial, Vector2, type IUniform, type PerspectiveCamera, type WebGLRenderer } from 'three';
import type { Zona } from './types';

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

export const GLSL_VIENTO = /* glsl */ `
uniform float uT; uniform float uViento;
vec3 viento(vec3 p){
  float h=smoothstep(.02,1.,p.y);
  float a=sin(uT*.62+p.x*1.7+p.y*1.1)*.014+sin(uT*1.37+p.x*4.1+p.z*3.)*.005;
  float b=cos(uT*.91+p.x*2.3)*.005;
  return vec3((a+uViento*.018)*h,b*h,a*.5*h);
}`;

// Atenúa lo que quede detrás del titular para proteger su lectura.
export const GLSL_MASCARA = /* glsl */ `
uniform vec4 uL1; uniform vec4 uL2; uniform vec2 uBuf; uniform float uPlano;
float dentro(vec2 f, vec4 r){
  return smoothstep(r.x-.012,r.x+.004,f.x)*smoothstep(r.z+.022,r.z+.002,f.x)*smoothstep(r.y-.012,r.y+.004,f.y)*smoothstep(r.w+.012,r.w-.004,f.y);
}
float mascara(){
  if(uPlano>.5) return 1.;
  vec2 f=vec2(gl_FragCoord.x/uBuf.x,1.-gl_FragCoord.y/uBuf.y);
  return 1.-.88*max(dentro(f,uL1),dentro(f,uL2));
}`;

export type Comunes = Record<string, IUniform>;

export function crearComunes(): Comunes {
  return {
    uT: { value: 0 }, uViento: { value: 0 }, uCrece: { value: 1 }, uFlor: { value: 1 }, uPx: { value: 500 },
    uL1: { value: [0, 0, 0, 0] }, uL2: { value: [0, 0, 0, 0] }, uBuf: { value: new Vector2(1, 1) }, uPlano: { value: 0 }
  };
}

export function crearRamas(b: Bosque, u: Comunes) {
  const n = b.tramos.length * 6;
  const A = new Float32Array(n * 3), B = new Float32Array(n * 3);
  const lado = new Float32Array(n), fin = new Float32Array(n), ancho = new Float32Array(n), nace = new Float32Array(n), dur = new Float32Array(n), tono = new Float32Array(n);
  const esquinas: [number, number][] = [[-1, 0], [1, 0], [1, 1], [-1, 0], [1, 1], [-1, 1]];
  b.tramos.forEach((t, i) => {
    esquinas.forEach(([l, f], k) => {
      const v = i * 6 + k;
      A.set(t.a, v * 3); B.set(t.b, v * 3);
      lado[v] = l; fin[v] = f;
      ancho[v] = f ? t.r1 : t.r0;
      nace[v] = t.nace; dur[v] = t.dur; tono[v] = t.tono;
    });
  });
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(A, 3));
  g.setAttribute('aB', new BufferAttribute(B, 3));
  g.setAttribute('aLado', new BufferAttribute(lado, 1));
  g.setAttribute('aFin', new BufferAttribute(fin, 1));
  g.setAttribute('aAncho', new BufferAttribute(ancho, 1));
  g.setAttribute('aNace', new BufferAttribute(nace, 1));
  g.setAttribute('aDur', new BufferAttribute(dur, 1));
  g.setAttribute('aTono', new BufferAttribute(tono, 1));
  const m = new ShaderMaterial({
    uniforms: u,
    vertexShader: /* glsl */ `
      ${GLSL_VIENTO}
      uniform float uCrece; uniform float uPx;
      attribute vec3 aB; attribute float aLado,aFin,aAncho,aNace,aDur,aTono;
      varying float vT; varying float vS;
      void main(){
        float s=clamp((uCrece-aNace)/max(aDur,.0005),0.,1.);
        vec3 A=position+viento(position); vec3 B=aB+viento(aB);
        vec3 p=mix(A,B,aFin*s);
        vec2 d=normalize((B-A).xy+vec2(1e-5)); vec2 n=vec2(-d.y,d.x);
        // Mínimo de un píxel para que las puntas no se corten.
        float w=max(aAncho,1./uPx)*smoothstep(0.,.5,s);
        p.xy+=n*aLado*w*.5;
        vT=aTono; vS=s;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      ${GLSL_MASCARA}
      varying float vT; varying float vS;
      void main(){
        if(vS<=0.) discard;
        if(uPlano>.5){ gl_FragColor=vec4(1.); return; }
        vec3 c=mix(vec3(.8,.78,.74),vec3(.85,.7,.42),vT);
        gl_FragColor=vec4(c,.92*mascara());
      }`,
    transparent: true,
    side: DoubleSide,
    depthTest: false,
    depthWrite: false
  });
  const malla = new Mesh(g, m);
  malla.frustumCulled = false;
  malla.renderOrder = 1;
  return malla;
}

export function crearHojas(b: Bosque, u: Comunes) {
  const n = b.hojas.length;
  const p = new Float32Array(n * 3), nace = new Float32Array(n), rot = new Float32Array(n), tam = new Float32Array(n), tono = new Float32Array(n);
  b.hojas.forEach((h, i) => { p.set(h.p, i * 3); nace[i] = h.nace; rot[i] = h.rot; tam[i] = h.tam; tono[i] = h.tono; });
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(p, 3));
  g.setAttribute('aNace', new BufferAttribute(nace, 1));
  g.setAttribute('aRot', new BufferAttribute(rot, 1));
  g.setAttribute('aTam', new BufferAttribute(tam, 1));
  g.setAttribute('aTono', new BufferAttribute(tono, 1));
  const m = new ShaderMaterial({
    uniforms: u,
    vertexShader: /* glsl */ `
      ${GLSL_VIENTO}
      uniform float uFlor; uniform float uPx; uniform float uPlano;
      attribute float aNace,aRot,aTam,aTono;
      varying float vRot; varying float vTono; varying float vA;
      void main(){
        float s=smoothstep(aNace,aNace+.09,uFlor);
        vec3 q=position+viento(position)+vec3(sin(uT*1.9+aRot*9.)*.0018,cos(uT*1.5+aRot*7.)*.0012,0.);
        vRot=aRot+sin(uT*1.2+aRot*5.)*.22; vTono=aTono; vA=s;
        gl_PointSize=max(aTam*uPx*s*(uPlano>.5?2.6:1.),.01);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(q,1.);
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      ${GLSL_MASCARA}
      varying float vRot; varying float vTono; varying float vA;
      void main(){
        if(vA<=0.) discard;
        vec2 v=gl_PointCoord-.5; float c=cos(vRot),s=sin(vRot);
        v=vec2(c*v.x-s*v.y,s*v.x+c*v.y);
        float e=length(v/vec2(.5,.2));
        float a=1.-smoothstep(.72,1.,e);
        if(a<=.01) discard;
        if(uPlano>.5){ gl_FragColor=vec4(1.,1.,1.,a); return; }
        vec3 col=vTono>.8?vec3(.84,.68,.38):mix(vec3(.95,.92,.85),vec3(.72,.76,.72),vTono/.8);
        gl_FragColor=vec4(col,a*.92*mascara());
      }`,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const puntos = new Points(g, m);
  puntos.frustumCulled = false;
  puntos.renderOrder = 2;
  return puntos;
}

// Resplandor cálido detrás de la copa, que aumenta con el avance.
export function crearHalo() {
  const u = { uCentro: { value: new Vector2(0.8, 0.4) }, uAsp: { value: 1 }, uLuz: { value: 0 }, uRadio: { value: 0.5 } };
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const m = new ShaderMaterial({
    uniforms: u,
    vertexShader: 'varying vec2 vF; void main(){ vF=vec2(position.x*.5+.5,.5-position.y*.5); gl_Position=vec4(position.xy,0.,1.); }',
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform vec2 uCentro; uniform float uAsp,uLuz,uRadio; varying vec2 vF;
      void main(){
        vec2 d=(vF-uCentro)*vec2(uAsp,1.);
        float k=exp(-dot(d,d)/(uRadio*uRadio));
        // Un leve grano evita las bandas de color en el degradado.
        float g=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
        gl_FragColor=vec4(vec3(.95,.72,.42),k*uLuz+(g-.5)*.012);
      }`,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const malla = new Mesh(g, m);
  malla.frustumCulled = false;
  malla.renderOrder = 0;
  return { malla, u };
}

export const CAMARA_Z = 10;
export const CAMARA_FOV = 24;

export function encuadre(zona: Zona, aspecto: number) {
  const altoVista = 2 * CAMARA_Z * Math.tan((CAMARA_FOV * Math.PI) / 360);
  const anchoVista = altoVista * aspecto;
  return { altoVista, anchoVista, x: (zona.sueloX - 0.5) * anchoVista, y: (0.5 - zona.sueloY) * altoVista, esc: zona.altura * altoVista };
}

// Actualiza las medidas que comparten los materiales. `escala` es la del árbol en la escena.
export function actualizarComunes(u: Comunes, renderer: WebGLRenderer, camera: PerspectiveCamera, zona: Zona, escala: number) {
  const tam = u.uBuf.value as Vector2;
  renderer.getDrawingBufferSize(tam);
  const altoVista = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
  u.uPx.value = (escala / altoVista) * tam.y;
  u.uL1.value = zona.linea1;
  u.uL2.value = zona.linea2;
}

