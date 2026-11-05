// Piezas 3D compartidas por los conceptos del árbol.
import { BufferAttribute, BufferGeometry, DoubleSide, Mesh, Points, ShaderMaterial, Vector2, type IUniform, type PerspectiveCamera, type WebGLRenderer } from 'three';
import type { Zona } from './types';

import type { Bosque } from './bosque';

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

