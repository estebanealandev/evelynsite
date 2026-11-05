// Mezcla de A y B: una ventana con hojas proyectada como luz real sobre el muro y el monograma.
import {
  ACESFilmicToneMapping, Color, Group, LinearFilter, Mesh, MeshStandardMaterial, OrthographicCamera, PCFShadowMap,
  PerspectiveCamera, PlaneGeometry, PMREMGenerator, PointLight, RepeatWrapping, Scene, ShaderMaterial, SpotLight, SRGBColorSpace,
  Vector2, Vector3, WebGLRenderTarget
} from 'three';
import { ALTO_E, ANCHO_E, entorno, geometriaE, ruido } from './monograma';
import { suave, type Crear } from './types';

// Máscara de luz: dibuja la ventana y las hojas en una textura que la luz proyecta sobre la escena.
const fragVentana = /* glsl */ `
precision highp float;
uniform float uT; uniform float uP; uniform vec2 uM;
varying vec2 vUv;
mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float caja(vec2 p, vec2 b, float e){ vec2 d=abs(p)-b; return 1.-smoothstep(-e,e,max(d.x,d.y)); }
void main(){
  vec2 q=vUv-.5+uM*.012;
  float abre=mix(.13,1.,smoothstep(0.,.85,uP));
  float luz=caja(q,vec2(.335*abre,.4),.009);
  // Parteluces.
  vec2 c=abs(fract(q/vec2(.222,.267)+.5)-.5);
  float marco=smoothstep(0.,.045,.5-c.x-.024)*smoothstep(0.,.045,.5-c.y-.024);
  luz*=mix(1.,marco,.96);
  // Hojas que se mecen con una brisa lenta.
  float brisa=sin(uT*.42)*.7+sin(uT*.93+1.3)*.3;
  float hojas=1.;
  for(int i=0;i<18;i++){
    float f=float(i);
    vec2 base=vec2(-.38+.044*f+.05*sin(f*2.17),.4-.026*f+.08*sin(f*1.71));
    float balanceo=brisa*(.011+.0015*f)+sin(uT*.8+f)*.0032;
    vec2 v=rot(f*1.31+balanceo*7.)*(q-base-vec2(balanceo,balanceo*.35));
    hojas*=smoothstep(.72,1.3,length(v/vec2(.076,.023)));
  }
  gl_FragColor=vec4(vec3(luz*mix(.05,1.,hojas)),1.);
}`;

export const crear: Crear = renderer => {
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.setClearColor(0x14283e, 1);
  const pequena = innerWidth < 768;

  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 0.1, 40);
  camera.position.set(0, 0, 8);

  // Textura animada de la ventana.
  const tamVentana = pequena ? 384 : 640;
  const rt = new WebGLRenderTarget(tamVentana, tamVentana, { minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false });
  const ventanaMat = new ShaderMaterial({
    uniforms: { uT: { value: 0 }, uP: { value: 0 }, uM: { value: new Vector2() } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
    fragmentShader: fragVentana,
    depthTest: false,
    depthWrite: false
  });
  const ventanaGeo = new PlaneGeometry(2, 2);
  const ventanaEscena = new Scene();
  ventanaEscena.add(new Mesh(ventanaGeo, ventanaMat));
  const ventanaCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const pmrem = new PMREMGenerator(renderer);
  const env = entorno(pmrem);
  pmrem.dispose();

  const grano = ruido(256, false);
  const cepillado = ruido(256, true);
  const yeso = grano.clone();
  yeso.wrapS = yeso.wrapT = RepeatWrapping;
  yeso.repeat.set(26, 16);
  yeso.needsUpdate = true;

  const piedra = new MeshStandardMaterial({ color: 0xd9d2c4, roughness: 1, bumpMap: grano, bumpScale: 0.45, roughnessMap: grano, envMap: env.texture });
  const laton = new MeshStandardMaterial({ color: 0xd9b26c, roughness: 0.85, metalness: 0.92, bumpMap: cepillado, bumpScale: 0.05, roughnessMap: cepillado, envMap: env.texture });

  // Muro de yeso claro en penumbra: la base azul marino es propia y solo la ventana revela su color cálido.
  const uTop = { value: 0.6 };
  const uZona = { value: new Vector2(0.7, 0.5) };
  const uBuffer = { value: new Vector2(1, 1) };
  const uCabecera = { value: new Vector2(0.9, 1) };
  const muroMat = new MeshStandardMaterial({ color: 0x8f8069, roughness: 0.96, bumpMap: yeso, bumpScale: 0.3, emissive: new Color().setRGB(0.0185, 0.0355, 0.062) });
  // Atenúa la luz del muro detrás del titular, pero la conserva alrededor del monograma.
  muroMat.onBeforeCompile = s => {
    s.uniforms.uTop = uTop;
    s.uniforms.uZona = uZona;
    s.uniforms.uBuffer = uBuffer;
    s.uniforms.uCabecera = uCabecera;
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTop; uniform vec2 uZona; uniform vec2 uBuffer; uniform vec2 uCabecera;')
      .replace(
        '#include <opaque_fragment>',
        `vec2 fPos = gl_FragCoord.xy / uBuffer;
        float fArriba = smoothstep(uTop, uTop + .09, fPos.y);
        float fLado = smoothstep(uZona.x - .002, uZona.x + .05, fPos.x) * smoothstep(uZona.y - .03, uZona.y + .04, fPos.y);
        // Mientras el menú está en pantalla, la luz no pasa detrás de él.
        float fMenu = 1. - uCabecera.y * smoothstep(uCabecera.x - .05, uCabecera.x, fPos.y);
        outgoingLight = mix(totalEmissiveRadiance + outgoingLight * .035, outgoingLight, max(fArriba, fLado) * fMenu);
        #include <opaque_fragment>`
      );
  };

  const gIzq = geometriaE(false);
  const gDer = geometriaE(true);
  const izq = new Mesh(gIzq, piedra);
  const der = new Mesh(gDer, laton);
  [izq, der].forEach(m => { m.castShadow = true; m.receiveShadow = true; });
  const conjunto = new Group();
  conjunto.add(izq, der);
  scene.add(conjunto);

  const gMuro = new PlaneGeometry(30, 18);
  const muro = new Mesh(gMuro, muroMat);
  muro.position.z = -0.75;
  muro.receiveShadow = true;
  scene.add(muro);

  // La luz principal es la ventana. Debe proyectar sombra para que three.js aplique su máscara.
  const sol = new SpotLight(0xffe7c2, 0, 0, 0.5, 0.12, 0);
  sol.map = rt.texture;
  sol.castShadow = true;
  sol.shadow.mapSize.setScalar(pequena ? 1024 : 2048);
  sol.shadow.radius = 3;
  sol.shadow.bias = -0.0009;
  sol.shadow.normalBias = 0.024;
  sol.shadow.camera.near = 1;
  sol.shadow.camera.far = 24;
  scene.add(sol, sol.target);

  const cursor = new PointLight(0xffe6bd, 0, 5, 1.8);
  scene.add(cursor);

  let aspecto = 1;
  const centro = new Vector3();
  const tamBuffer = new Vector2();
  const DIRECCION = new Vector3(-0.56, 0.54, 0.86).normalize();

  return {
    resize(w, h) {
      aspecto = w / h;
      camera.aspect = aspecto;
      camera.updateProjectionMatrix();
    },
    frame({ t, progreso, x, y, zona }) {
      const altoVista = 2 * 8 * Math.tan((28 * Math.PI) / 360);
      const anchoVista = altoVista * aspecto;
      const escala = Math.min((zona.h * altoVista) / ALTO_E, (zona.w * anchoVista) / ANCHO_E);
      centro.set((zona.cx - 0.5) * anchoVista, (0.5 - zona.cy) * altoVista, 0);

      const entrada = suave(t / 2.4);
      const union = suave(progreso / 0.82);
      const sep = 1 - union;

      conjunto.position.copy(centro);
      conjunto.scale.setScalar(escala * (1 - 0.2 * sep));
      conjunto.rotation.set(-y * 0.08 + Math.sin(t * 0.33) * 0.012, x * 0.14 + Math.sin(t * 0.21) * 0.02, 0);

      // Como en A: las letras parten entreabiertas, igual que las hojas de una puerta.
      izq.position.set(-sep * 0.2, sep * 0.05, sep * 0.3);
      izq.rotation.set(0, sep * 0.78, 0);
      der.position.set(sep * 0.2, -sep * 0.05, sep * 0.3);
      der.rotation.set(0, -sep * 0.78, 0);

      // Como en B: la ventana se abre con el avance. El cono se ajusta para enmarcar el monograma.
      const alcance = Math.max(escala * ALTO_E * 1.05, Math.min(anchoVista, altoVista) * 0.42);
      const distancia = 9;
      sol.target.position.set(centro.x - alcance * 0.22, centro.y + alcance * 0.06, 0);
      sol.position.copy(sol.target.position).addScaledVector(DIRECCION, distancia);
      sol.angle = Math.atan((alcance * 1.28) / distancia);
      sol.intensity = (2.6 + 5 * union) * entrada;

      const reflejo = (0.42 + 0.58 * union) * (0.25 + 0.75 * entrada);
      piedra.envMapIntensity = reflejo * 0.55;
      laton.envMapIntensity = reflejo;

      cursor.position.set(x * anchoVista * 0.5, y * altoVista * 0.5, 1.4);
      cursor.intensity = 0.7 * entrada;

      uTop.value = 1 - zona.tituloTop;
      uZona.value.set(zona.cx - zona.w / 2, 1 - (zona.cy + zona.h / 2));
      renderer.getDrawingBufferSize(tamBuffer);
      uBuffer.value.copy(tamBuffer);
      uCabecera.value.set(1 - zona.cabecera, 1 - suave(progreso / 0.1));

      ventanaMat.uniforms.uT.value = t;
      ventanaMat.uniforms.uP.value = progreso;
      ventanaMat.uniforms.uM.value.set(x, y);
      renderer.setRenderTarget(rt);
      renderer.render(ventanaEscena, ventanaCam);
      renderer.setRenderTarget(null);

      renderer.render(scene, camera);
    },
    dispose() {
      gIzq.dispose(); gDer.dispose(); gMuro.dispose(); ventanaGeo.dispose();
      piedra.dispose(); laton.dispose(); muroMat.dispose(); ventanaMat.dispose();
      grano.dispose(); cepillado.dispose(); yeso.dispose();
      env.dispose(); rt.dispose();
      sol.shadow.map?.dispose();
      renderer.shadowMap.enabled = false;
    }
  };
};
