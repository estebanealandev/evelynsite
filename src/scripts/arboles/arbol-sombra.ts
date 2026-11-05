// Concepto 3: la sombra suave de un árbol sobre un muro. Solo se ve su resguardo, no el árbol.
import { BufferAttribute, BufferGeometry, Group, LinearFilter, LinearMipmapLinearFilter, Mesh, NoToneMapping, OrthographicCamera, Scene, ShaderMaterial, SRGBColorSpace, Vector2, WebGLRenderTarget } from 'three';
import { crearComunes, crearHojas, crearRamas, GLSL_MASCARA } from './arbol';
import { suave, type Crear } from './types';

const frag = /* glsl */ `
precision highp float;
${GLSL_MASCARA}
uniform sampler2D uSombra; uniform vec2 uBase; uniform float uEsc,uAsp,uLuz,uT;
varying vec2 vF;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float ruido(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float tomar(vec2 q,float b){ vec2 s=vec2((q.x+1.3)/2.6,(q.y+.12)/1.42); if(s.x<0.||s.x>1.||s.y<0.||s.y>1.) return 0.; return texture2D(uSombra,s,b).r; }
// Una atenuación amplia alrededor del titular, sin bordes visibles.
float caja(vec2 f,vec4 r,float k){ vec2 d=max(max(r.xy-f,f-r.zw),vec2(0.)); return 1.-smoothstep(0.,k,length(d)); }
void main(){
  vec2 d=(vF-uBase)*vec2(uAsp,1.);
  vec2 q=vec2(d.x,-d.y)/uEsc;
  q.x-=q.y*.3;
  // Más lejos de la base, más difusa: como una sombra real.
  float b=.6+clamp(q.y,0.,1.2)*1.3;
  float e=.006+.012*clamp(q.y,0.,1.);
  float s=0.;
  // Muestreo en espiral: difumina sin dejar la huella cuadrada de la textura.
  for(int i=0;i<12;i++){ float a=float(i)*2.399963; float k=sqrt((float(i)+.5)/12.); s+=tomar(q+vec2(cos(a),sin(a))*e*k*2.2,b); }
  s/=12.;
  vec2 c=(vF-vec2(uBase.x-.02/uAsp,uBase.y-uEsc*.56))*vec2(uAsp,1.);
  float charco=exp(-dot(c,c)/(uEsc*uEsc*.42));
  float yeso=.86+.26*(ruido(vF*vec2(uAsp,1.)*7.)*.45+ruido(vF*vec2(uAsp,1.)*44.)*.25+.25);
  vec3 navy=vec3(.0784,.1569,.2431);
  vec3 calida=vec3(.86,.72,.5)*yeso;
  float luz=charco*uLuz*(1.-min(s*1.1,1.)*.95);
  vec2 ff=vec2(vF.x,vF.y);
  float bajo=1.-.93*max(caja(ff,uL1,.13),caja(ff,uL2,.11));
  vec3 col=mix(navy,calida,luz*bajo*.86);
  col+=(hash(gl_FragCoord.xy+fract(uT)*91.)-.5)*.014;
  gl_FragColor=vec4(col,1.);
}`;

export const crear: Crear = (renderer, bosque) => {
  renderer.toneMapping = NoToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;
  const pequena = innerWidth < 768;

  // El árbol se dibuja en blanco sobre negro y esa imagen se usa como sombra.
  const u = crearComunes();
  u.uPlano.value = 1;
  const ramas = crearRamas(bosque, u);
  const hojas = crearHojas(bosque, u);
  const arbol = new Group();
  arbol.add(ramas, hojas);
  const escenaArbol = new Scene();
  escenaArbol.add(arbol);
  const camArbol = new OrthographicCamera(-1.3, 1.3, 1.3, -0.12, -2, 2);
  const tam = pequena ? 512 : 1024;
  const rt = new WebGLRenderTarget(tam, tam, { generateMipmaps: true, minFilter: LinearMipmapLinearFilter, magFilter: LinearFilter, depthBuffer: false });
  u.uPx.value = tam / 1.42;

  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const uMuro = {
    uSombra: { value: rt.texture }, uBase: { value: new Vector2(0.8, 0.8) }, uEsc: { value: 0.8 }, uAsp: { value: 1 }, uLuz: { value: 0 }, uT: { value: 0 },
    uL1: u.uL1, uL2: u.uL2, uBuf: { value: new Vector2(1, 1) }, uPlano: { value: 0 }
  };
  const m = new ShaderMaterial({
    uniforms: uMuro,
    vertexShader: 'varying vec2 vF; void main(){ vF=vec2(position.x*.5+.5,.5-position.y*.5); gl_Position=vec4(position.xy,0.,1.); }',
    fragmentShader: frag,
    depthTest: false,
    depthWrite: false
  });
  const muro = new Mesh(g, m);
  muro.frustumCulled = false;
  const escena = new Scene();
  escena.add(muro);
  const cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let aspecto = 1;
  return {
    dprMax: 1.25,
    resize(w, h) { aspecto = w / h; },
    frame({ t, progreso, x, zona }) {
      u.uT.value = t;
      u.uViento.value = x;
      u.uCrece.value = 1.02;
      u.uFlor.value = 1.1;
      u.uL1.value = zona.linea1;
      u.uL2.value = zona.linea2;

      renderer.setClearColor(0x000000, 1);
      renderer.setRenderTarget(rt);
      renderer.clear();
      renderer.render(escenaArbol, camArbol);
      renderer.setRenderTarget(null);

      renderer.getDrawingBufferSize(uMuro.uBuf.value);
      uMuro.uBase.value.set(zona.sueloX + 0.015 + x * 0.004, zona.sueloY);
      uMuro.uEsc.value = zona.altura * 1.28;
      uMuro.uAsp.value = aspecto;
      uMuro.uT.value = t;
      uMuro.uLuz.value = (0.5 + 0.5 * suave(progreso / 0.8)) * suave(t / 3);
      renderer.render(escena, cam);
    },
    dispose() {
      ramas.geometry.dispose(); (ramas.material as ShaderMaterial).dispose();
      hojas.geometry.dispose(); (hojas.material as ShaderMaterial).dispose();
      g.dispose(); m.dispose(); rt.dispose();
    }
  };
};
