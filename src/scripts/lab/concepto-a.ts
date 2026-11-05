// Concepto A: el monograma EE en piedra y latón. Las dos letras se entrelazan con el scroll.
import {
  ACESFilmicToneMapping, AmbientLight, Color, DirectionalLight, Group, Mesh, MeshStandardMaterial, PCFShadowMap,
  PerspectiveCamera, PlaneGeometry, PMREMGenerator, PointLight, Scene, SRGBColorSpace, Vector3
} from 'three';
import { ALTO_E, ANCHO_E, entorno, geometriaE, ruido } from './monograma';
import { suave, type Crear } from './types';

export const crear: Crear = renderer => {
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.setClearColor(0x14283e, 1);

  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 0.1, 40);
  camera.position.set(0, 0, 8);

  const pmrem = new PMREMGenerator(renderer);
  const env = entorno(pmrem);
  pmrem.dispose();
  const pequena = innerWidth < 768;

  const grano = ruido(256, false);
  const cepillado = ruido(256, true);
  const piedra = new MeshStandardMaterial({ color: 0xd9d2c4, roughness: 1, metalness: 0, bumpMap: grano, bumpScale: 0.45, roughnessMap: grano, envMap: env.texture });
  const laton = new MeshStandardMaterial({ color: 0xd9b26c, roughness: 0.85, metalness: 0.92, bumpMap: cepillado, bumpScale: 0.05, roughnessMap: cepillado, envMap: env.texture });
  // El muro no recibe el entorno: así conserva el azul marino de la marca durante toda la secuencia.
  const muroMat = new MeshStandardMaterial({ color: new Color().setRGB(0.024, 0.062, 0.122), roughness: 0.95, metalness: 0, emissive: new Color().setRGB(0.012, 0.034, 0.078) });

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

  const clave = new DirectionalLight(0xfff0d8, 2);
  clave.position.set(-3.6, 3.8, 5);
  clave.castShadow = true;
  clave.shadow.mapSize.setScalar(pequena ? 1024 : 2048);
  clave.shadow.radius = 7;
  clave.shadow.bias = -0.0004;
  clave.shadow.normalBias = 0.012;
  const sc = clave.shadow.camera;
  sc.left = -5; sc.right = 5; sc.top = 5; sc.bottom = -5; sc.near = 0.5; sc.far = 18;
  scene.add(clave, clave.target);

  const cursor = new PointLight(0xffe6bd, 7, 7, 1.8);
  scene.add(cursor);
  const ambiente = new AmbientLight(0x6f8bad, 0.28);
  scene.add(ambiente);

  let aspecto = 1;
  const centro = new Vector3();

  return {
    resize(w, h) {
      aspecto = w / h;
      camera.aspect = aspecto;
      camera.updateProjectionMatrix();
    },
    frame({ t, progreso, x, y, zona }) {
      // Tamaño del encuadre en el plano de las letras. El monograma se ajusta al espacio libre junto al titular.
      const altoVista = 2 * 8 * Math.tan((28 * Math.PI) / 360);
      const anchoVista = altoVista * aspecto;
      const escala = Math.min((zona.h * altoVista) / ALTO_E, (zona.w * anchoVista) / ANCHO_E);
      centro.set((zona.cx - 0.5) * anchoVista, (0.5 - zona.cy) * altoVista, 0);

      const entrada = suave(t / 2.2);
      const union = suave(progreso / 0.82);
      const sep = 1 - union;

      conjunto.position.copy(centro);
      // Entreabiertas ocupan más ancho, así que se reducen para no salir de la zona libre.
      conjunto.scale.setScalar(escala * (1 - 0.2 * sep));
      conjunto.rotation.set(-y * 0.08 + Math.sin(t * 0.33) * 0.012, x * 0.14 + Math.sin(t * 0.21) * 0.02, 0);

      // Al inicio, las dos letras están entreabiertas como las hojas de una puerta.
      izq.position.set(-sep * 0.2, sep * 0.05, sep * 0.3);
      izq.rotation.set(0, sep * 0.78, 0);
      der.position.set(sep * 0.2, -sep * 0.05, sep * 0.3);
      der.rotation.set(0, -sep * 0.78, 0);

      // La luz se abre con el avance: de la penumbra a la claridad.
      clave.intensity = (0.55 + 2.05 * union) * entrada;
      const reflejo = (0.45 + 0.55 * union) * (0.25 + 0.75 * entrada);
      piedra.envMapIntensity = reflejo * 0.6;
      laton.envMapIntensity = reflejo;
      ambiente.intensity = 0.12 + 0.2 * union;
      clave.target.position.copy(centro);

      cursor.position.set(x * anchoVista * 0.5, y * altoVista * 0.5, 1.5);
      cursor.intensity = 1.5 + 2.5 * entrada;

      renderer.render(scene, camera);
    },
    dispose() {
      gIzq.dispose(); gDer.dispose(); gMuro.dispose();
      piedra.dispose(); laton.dispose(); muroMat.dispose();
      grano.dispose(); cepillado.dispose();
      env.dispose();
      clave.shadow.map?.dispose();
      renderer.shadowMap.enabled = false;
    }
  };
};
