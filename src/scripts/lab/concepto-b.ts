// Concepto B: luz de ventana y sombra de hojas sobre un muro. El scroll abre la luz.
import { Mesh, NoToneMapping, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace, Vector2 } from 'three';
import type { Crear } from './types';

const frag = /* glsl */ `
precision highp float;
uniform vec2 uRes; uniform float uT; uniform float uP; uniform vec2 uM; uniform float uTop;
varying vec2 vUv;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*noise(p); p=p*2.03+7.1; a*=.5; } return s; }
mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float caja(vec2 p, vec2 b, float e){ vec2 d=abs(p)-b; return 1.-smoothstep(-e,e,max(d.x,d.y)); }
void main(){
  float asp=uRes.x/uRes.y;
  vec2 p=(vUv-.5)*vec2(asp,1.);
  // El haz entra inclinado, como el sol de la tarde.
  vec2 q=p-vec2(asp>1.?.26*asp:0.,asp>1.?.12:.22);
  q+=uM*.018;
  q.x+=q.y*.42;
  q=rot(-.09)*q;
  float abre=mix(.12,1.,smoothstep(0.,.85,uP));
  float pen=.012+.018*(1.+q.y*2.);
  vec2 tam=vec2(.3*abre*min(1.,asp*1.5),.4)*(asp>1.?1.:.72);
  float luz=caja(q,tam,pen);
  // Parteluces de la ventana.
  vec2 g=q/vec2(.205,.268)+.5;
  vec2 c=abs(fract(g)-.5);
  float mar=smoothstep(.0,.05,.5-max(c.x*1.,0.)-.022)*smoothstep(.0,.05,.5-c.y-.022);
  luz*=mix(1.,mar,.96);
  // Sombra de ramas que se mecen con una brisa lenta.
  float brisa=sin(uT*.42)*.7+sin(uT*.93+1.3)*.3;
  float hojas=1.;
  for(int i=0;i<22;i++){
    float f=float(i);
    vec2 base=vec2(-.42+.042*f+.05*sin(f*2.17),.42-.024*f+.09*sin(f*1.71));
    float balanceo=brisa*(.012+.0016*f)+sin(uT*.8+f)*.0035;
    vec2 v=rot(f*1.31+balanceo*7.)*(q-base-vec2(balanceo,balanceo*.35));
    float e=length(v/vec2(.078,.024));
    hojas*=smoothstep(.74,1.34,e);
  }
  luz*=mix(.1,1.,hojas);
  // La luz se atenúa detrás del titular para no perder contraste.
  luz*=mix(.08,1.,smoothstep(uTop-.07,uTop+.06,vUv.y));
  // Muro de yeso con relieve fino.
  float yeso=fbm(p*vec2(5.,7.))*.55+fbm(p*38.)*.2;
  vec3 navy=vec3(.063,.13,.205);
  vec3 muro=navy*(.8+.42*yeso);
  // El haz también rebota en la habitación.
  float halo=exp(-3.1*length(q*vec2(.9,1.15)));
  vec3 calida=vec3(.98,.87,.67);
  vec3 col=muro+calida*halo*mix(.012,.15,abre);
  col=mix(col,calida*(.72+.34*yeso),luz*mix(.72,.95,uP));
  // Grano editorial.
  col+=(hash(gl_FragCoord.xy+fract(uT)*91.)-.5)*.022;
  gl_FragColor=vec4(pow(max(col,0.),vec3(.95)),1.);
}`;

export const crear: Crear = renderer => {
  renderer.toneMapping = NoToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geo = new PlaneGeometry(2, 2);
  const mat = new ShaderMaterial({
    uniforms: { uRes: { value: new Vector2(1, 1) }, uT: { value: 0 }, uP: { value: 0 }, uM: { value: new Vector2() }, uTop: { value: 0.6 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
    fragmentShader: frag,
    depthTest: false,
    depthWrite: false
  });
  scene.add(new Mesh(geo, mat));
  return {
    dprMax: 1.25,
    resize(w, h) { mat.uniforms.uRes.value.set(w, h); },
    frame({ t, progreso, x, y, zona }) {
      mat.uniforms.uT.value = t;
      mat.uniforms.uP.value = progreso;
      mat.uniforms.uM.value.set(x, y);
      mat.uniforms.uTop.value = 1 - zona.tituloTop;
      renderer.render(scene, camera);
    },
    dispose() { geo.dispose(); mat.dispose(); }
  };
};
