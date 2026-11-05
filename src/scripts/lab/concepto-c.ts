// Concepto C: relieve de líneas inspirado en la cordillera. El scroll lleva de la agitación a la calma.
import { AdditiveBlending, BufferAttribute, BufferGeometry, LineSegments, Mesh, NoToneMapping, PerspectiveCamera, Plane, PlaneGeometry, Raycaster, Scene, ShaderMaterial, SRGBColorSpace, Vector2, Vector3 } from 'three';
import type { Crear } from './types';

const vert = /* glsl */ `
uniform float uT; uniform float uP; uniform vec2 uC; uniform float uCF;
varying float vAlt; varying float vProf; varying float vCur;
vec2 h2(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return -1.+2.*fract(sin(p)*43758.5453); }
float sn(vec2 p){ const float K1=.366025404,K2=.211324865; vec2 i=floor(p+(p.x+p.y)*K1); vec2 a=p-i+(i.x+i.y)*K2;
  float m=step(a.y,a.x); vec2 o=vec2(m,1.-m); vec2 b=a-o+K2; vec2 c=a-1.+2.*K2;
  vec3 h=max(.5-vec3(dot(a,a),dot(b,b),dot(c,c)),0.);
  vec3 n=h*h*h*h*vec3(dot(a,h2(i)),dot(b,h2(i+o)),dot(c,h2(i+1.))); return dot(n,vec3(70.)); }
float cordillera(vec2 p){ float a=1.,s=0.,f=1.; for(int i=0;i<3;i++){ float n=1.-abs(sn(p*f)); s+=a*n*n; a*=.36; f*=2.03; p+=11.3; } return s; }
void main(){
  vec3 q=position;
  float calma=1.-smoothstep(.05,.9,uP);
  vec2 d=q.xz*vec2(.15,.2)+vec2(0.,uT*.012);
  float h=(cordillera(d)-.5)*(.18+.92*calma);
  float lejos=smoothstep(1.,-7.5,q.z);
  h*=mix(.55,1.5,lejos);
  float dc=distance(q.xz,uC);
  float onda=exp(-dc*dc*.42);
  h+=onda*uCF*.42*sin(dc*5.5-uT*1.9);
  q.y+=h;
  vAlt=h; vCur=onda*uCF; vProf=q.z;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(q,1.);
}`;
const frag = /* glsl */ `
precision highp float;
uniform float uP;
varying float vAlt; varying float vProf; varying float vCur;
void main(){
  float dist=smoothstep(-14.,-7.,vProf)*smoothstep(4.,.4,vProf);
  vec3 ivory=vec3(.96,.93,.87), gold=vec3(.84,.68,.38);
  vec3 c=mix(ivory,gold,smoothstep(.0,.7,vCur+vAlt*.34));
  gl_FragColor=vec4(c,(.2+.5*smoothstep(-.3,.9,vAlt)+.42*vCur)*dist);
}`;

export const crear: Crear = renderer => {
  renderer.toneMapping = NoToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x14283e, 1);
  const pequena = innerWidth < 768;
  const filas = pequena ? 100 : 150;
  const pasos = pequena ? 120 : 260;

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 60);

  const pos = new Float32Array(filas * pasos * 6);
  let n = 0;
  for (let j = 0; j < filas; j++) {
    const z = 4.5 - (j / (filas - 1)) * 19;
    for (let i = 0; i < pasos; i++) {
      const a = -13 + (i / pasos) * 26;
      const b = -13 + ((i + 1) / pasos) * 26;
      pos.set([a, 0, z, b, 0, z], n);
      n += 6;
    }
  }
  // Superficie invisible del color de fondo: oculta las líneas que quedan detrás de cada cresta.
  const geoSolida = new PlaneGeometry(26, 19, pasos >> 1, filas);
  geoSolida.rotateX(-Math.PI / 2);
  geoSolida.translate(0, 0, -5);
  const uniforms = { uT: { value: 0 }, uP: { value: 0 }, uC: { value: new Vector2(0, -2) }, uCF: { value: 0 } };
  const matSolido = new ShaderMaterial({
    uniforms,
    vertexShader: vert,
    fragmentShader: 'precision highp float; void main(){ gl_FragColor=vec4(.0784,.1569,.2431,1.); }',
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 2
  });
  const solido = new Mesh(geoSolida, matSolido);
  solido.frustumCulled = false;
  scene.add(solido);

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  const mat = new ShaderMaterial({
    uniforms,
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending
  });
  const lineas = new LineSegments(geo, mat);
  lineas.frustumCulled = false;
  lineas.renderOrder = 1;
  scene.add(lineas);

  const ray = new Raycaster();
  const suelo = new Plane(new Vector3(0, 1, 0), 0);
  const punto = new Vector3();
  const m = new Vector2();
  const objetivo = new Vector3(0, 0.4, -7);
  let fuerza = 0;
  let ultX = 9, ultY = 9;

  return {
    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    frame({ t, dt, progreso, x, y }) {
      camera.position.set(x * 0.28, 2.5 + progreso * 0.8 - y * 0.07, 4.6 + progreso * 0.5);
      // El horizonte queda arriba y deja libre la zona del titular.
      objetivo.y = -1.05 - progreso * 0.35;
      camera.lookAt(objetivo);

      m.set(x, y);
      ray.setFromCamera(m, camera);
      if (ray.ray.intersectPlane(suelo, punto)) mat.uniforms.uC.value.set(punto.x, punto.z);
      const mov = Math.abs(x - ultX) + Math.abs(y - ultY);
      ultX = x; ultY = y;
      fuerza += ((mov > 0.0015 ? 1 : 0) - fuerza) * Math.min(1, dt * (mov > 0.0015 ? 4 : 0.9));
      mat.uniforms.uCF.value = fuerza;
      mat.uniforms.uT.value = t;
      mat.uniforms.uP.value = progreso;
      renderer.render(scene, camera);
    },
    dispose() { geo.dispose(); mat.dispose(); geoSolida.dispose(); matSolido.dispose(); }
  };
};
