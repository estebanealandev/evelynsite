// Concepto 1: el árbol crece trazo a trazo. Después llegan los jóvenes, las hojas y la luz.
import { BufferAttribute, BufferGeometry, Group, NoToneMapping, PerspectiveCamera, Points, Scene, ShaderMaterial, SRGBColorSpace } from 'three';
import { actualizarComunes, CAMARA_FOV, CAMARA_Z, crearBosque, crearComunes, crearHalo, crearHojas, crearRamas, encuadre, GLSL_MASCARA } from './arbol';
import { suave, type Crear } from './types';

export const crear: Crear = renderer => {
  renderer.toneMapping = NoToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x14283e, 1);
  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMARA_FOV, 1, 0.1, 40);
  camera.position.z = CAMARA_Z;

  const u = crearComunes();
  const bosque = crearBosque(innerWidth < 768);
  const ramas = crearRamas(bosque, u);
  const hojas = crearHojas(bosque, u);
  const arbol = new Group();
  arbol.add(ramas, hojas);
  const halo = crearHalo();
  scene.add(halo.malla, arbol);

  // Unas pocas hojas caen despacio cuando el árbol ya está formado.
  const N = 26;
  const semilla = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i++) semilla[i] = ((i * 2654435761) >>> 0) / 4294967296;
  const gCaen = new BufferGeometry();
  gCaen.setAttribute('position', new BufferAttribute(semilla, 3));
  const mCaen = new ShaderMaterial({
    uniforms: u,
    vertexShader: /* glsl */ `
      uniform float uT; uniform float uFlor; uniform float uPx;
      varying float vA; varying float vR;
      void main(){
        float f=fract(position.y+uT*(.018+position.z*.016));
        vec3 p=vec3((position.x-.5)*1.15+sin(uT*.5+position.y*30.)*.05+f*.1,.82-f*.82,0.);
        vA=smoothstep(.72,1.,uFlor)*smoothstep(0.,.06,f)*smoothstep(1.,.86,f);
        vR=uT*(.5+position.x)+position.z*6.;
        gl_PointSize=(.011+position.z*.006)*uPx;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      ${GLSL_MASCARA}
      varying float vA; varying float vR;
      void main(){
        vec2 v=gl_PointCoord-.5; float c=cos(vR),s=sin(vR); v=vec2(c*v.x-s*v.y,s*v.x+c*v.y);
        float a=1.-smoothstep(.72,1.,length(v/vec2(.5,.2)));
        gl_FragColor=vec4(.84,.68,.38,a*vA*.8*mascara());
      }`,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const caen = new Points(gCaen, mCaen);
  caen.frustumCulled = false;
  caen.renderOrder = 3;
  arbol.add(caen);

  let aspecto = 1;
  return {
    resize(w, h) {
      aspecto = w / h;
      camera.aspect = aspecto;
      camera.updateProjectionMatrix();
    },
    frame({ t, progreso, x, y, zona }) {
      const e = encuadre(zona, aspecto);
      arbol.position.set(e.x, e.y, 0);
      arbol.scale.setScalar(e.esc);
      arbol.rotation.y = x * 0.1;

      // Crece solo al entrar; el scroll lo lleva a plenitud.
      const auto = suave(t / 6);
      const final = auto * (0.84 + 0.16 * suave(progreso / 0.6));
      u.uCrece.value = final * 1.04;
      u.uFlor.value = final * 1.12;
      u.uT.value = t;
      u.uViento.value = x;
      actualizarComunes(u, renderer, camera, zona, e.esc);

      halo.u.uCentro.value.set(zona.sueloX, zona.sueloY - zona.altura * 0.62);
      halo.u.uAsp.value = aspecto;
      halo.u.uRadio.value = zona.altura * 0.8;
      halo.u.uLuz.value = (0.025 + 0.085 * progreso) * suave(t / 3);
      renderer.render(scene, camera);
    },
    dispose() {
      ramas.geometry.dispose(); (ramas.material as ShaderMaterial).dispose();
      hojas.geometry.dispose(); (hojas.material as ShaderMaterial).dispose();
      halo.malla.geometry.dispose(); (halo.malla.material as ShaderMaterial).dispose();
      gCaen.dispose(); mCaen.dispose();
    }
  };
};
