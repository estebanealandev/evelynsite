// Concepto 2: puntos de luz dispersos que se reúnen hasta formar el árbol.
import { BufferAttribute, BufferGeometry, NoToneMapping, PerspectiveCamera, Points, Scene, ShaderMaterial, SRGBColorSpace, Vector2, Vector3 } from 'three';
import { actualizarComunes, CAMARA_FOV, CAMARA_Z, crearBosque, crearComunes, crearHalo, encuadre, GLSL_MASCARA, type Comunes } from './arbol';
import { suave, type Crear } from './types';

export const crear: Crear = renderer => {
  renderer.toneMapping = NoToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x14283e, 1);
  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMARA_FOV, 1, 0.1, 40);
  camera.position.z = CAMARA_Z;

  const pequena = innerWidth < 768;
  const bosque = crearBosque(pequena);
  const destinos: number[] = [], tamanos: number[] = [], tonos: number[] = [];
  let sem = 11;
  const r = () => (sem = (sem * 16807) % 2147483647) / 2147483647;
  // Las ramas se convierten en hileras de puntos; las hojas, en un punto cada una.
  for (const t of bosque.tramos) {
    const largo = Math.hypot(t.b[0] - t.a[0], t.b[1] - t.a[1]);
    const n = Math.max(1, Math.round(largo * (pequena ? 170 : 300) * (0.45 + t.r0 * 120)));
    for (let i = 0; i < n; i++) {
      const k = r(), d = (r() - 0.5) * t.r0;
      destinos.push(t.a[0] + (t.b[0] - t.a[0]) * k + d, t.a[1] + (t.b[1] - t.a[1]) * k + d * 0.4, t.a[2] + (t.b[2] - t.a[2]) * k);
      tamanos.push(0.0034 + r() * 0.002);
      tonos.push(t.tono ? 1 : 0.15);
    }
  }
  for (const h of bosque.hojas) {
    destinos.push(...h.p);
    tamanos.push(h.tam * 0.72);
    tonos.push(h.tono);
  }
  const n = destinos.length / 3;
  const dispersos = new Float32Array(n * 3), retraso = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    dispersos.set([r() * 2 - 1, r() * 2 - 1, r() * 2 - 1], i * 3);
    retraso[i] = r() * 0.55;
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(destinos), 3));
  g.setAttribute('aDisperso', new BufferAttribute(dispersos, 3));
  g.setAttribute('aRetraso', new BufferAttribute(retraso, 1));
  g.setAttribute('aTam', new BufferAttribute(new Float32Array(tamanos), 1));
  g.setAttribute('aTono', new BufferAttribute(new Float32Array(tonos), 1));

  const u: Comunes = {
    ...crearComunes(),
    uUnion: { value: 0 }, uMedia: { value: new Vector3(1, 1, 1) }, uBase: { value: new Vector3() }, uEsc: { value: 1 }, uCursor: { value: new Vector2(9, 9) }
  };
  const m = new ShaderMaterial({
    uniforms: u,
    vertexShader: /* glsl */ `
      uniform float uT,uUnion,uEsc,uPx,uViento; uniform vec3 uMedia,uBase; uniform vec2 uCursor;
      attribute vec3 aDisperso; attribute float aRetraso,aTam,aTono;
      varying float vTono; varying float vU;
      void main(){
        float k=clamp((uUnion-aRetraso)/.45,0.,1.); k=k*k*(3.-2.*k);
        float h=smoothstep(.02,1.,position.y);
        vec3 meta=position+vec3((sin(uT*.62+position.x*1.7+position.y*1.1)*.014+uViento*.018)*h,cos(uT*.91+position.x*2.3)*.005*h,0.);
        vec3 fin=uBase+meta*uEsc;
        // Flotan despacio antes de ocupar su lugar.
        vec3 flota=aDisperso*uMedia+vec3(sin(uT*.21+aDisperso.y*9.)*.24,cos(uT*.17+aDisperso.x*8.)*.2,0.);
        vec3 p=mix(flota,fin,k);
        vec2 d=p.xy-uCursor;
        p.xy+=normalize(d+vec2(1e-4))*exp(-dot(d,d)*5.)*.1;
        vTono=aTono; vU=k;
        gl_PointSize=max(aTam*uPx*mix(.8,1.,k),1.2);
        gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      ${GLSL_MASCARA}
      varying float vTono; varying float vU;
      void main(){
        float a=1.-smoothstep(.25,.5,length(gl_PointCoord-.5));
        if(a<=.01) discard;
        vec3 c=vTono>.72?vec3(.88,.72,.42):vec3(.94,.91,.84);
        gl_FragColor=vec4(c,a*mix(.42,.95,vU)*mascara());
      }`,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const puntos = new Points(g, m);
  puntos.frustumCulled = false;
  puntos.renderOrder = 1;
  const halo = crearHalo();
  scene.add(halo.malla, puntos);

  let aspecto = 1;
  return {
    resize(w, h) {
      aspecto = w / h;
      camera.aspect = aspecto;
      camera.updateProjectionMatrix();
    },
    frame({ t, progreso, x, y, zona }) {
      const e = encuadre(zona, aspecto);
      u.uBase.value.set(e.x, e.y, 0);
      u.uEsc.value = e.esc;
      u.uMedia.value.set(e.anchoVista * 0.54, e.altoVista * 0.54, 0.4);
      u.uCursor.value.set((x * e.anchoVista) / 2, (y * e.altoVista) / 2);
      // Al entrar se reúnen casi por completo; el scroll termina de unirlas.
      u.uUnion.value = Math.max(suave(t / 4.5) * 0.8, suave(t / 4.5) * (0.8 + 0.2 * suave(progreso / 0.7)));
      u.uT.value = t;
      u.uViento.value = x;
      actualizarComunes(u, renderer, camera, zona, e.esc);
      halo.u.uCentro.value.set(zona.sueloX, zona.sueloY - zona.altura * 0.62);
      halo.u.uAsp.value = aspecto;
      halo.u.uRadio.value = zona.altura * 0.8;
      halo.u.uLuz.value = (0.02 + 0.075 * progreso) * suave(t / 3);
      renderer.render(scene, camera);
    },
    dispose() {
      g.dispose(); m.dispose();
      halo.malla.geometry.dispose(); (halo.malla.material as ShaderMaterial).dispose();
    }
  };
};
