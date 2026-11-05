// Concepto A: el monograma EE en piedra y latón. Las dos letras se entrelazan con el scroll.
import {
  ACESFilmicToneMapping, AmbientLight, BoxGeometry, CanvasTexture, Color, DirectionalLight, ExtrudeGeometry, Group, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, PCFShadowMap, PerspectiveCamera, PlaneGeometry, PMREMGenerator, PointLight,
  RepeatWrapping, Scene, Shape, SRGBColorSpace, Vector3
} from 'three';
import { suave, type Crear } from './types';

// Silueta de la E, con las mismas medidas del logotipo vectorial (caja de 100 × 100).
function contornoE(): [number, number][] {
  const L = 15, S = 24.5, T = 9, B = 79, b = 2.9, R = 64, M = 54, sw = 2.9, sh = 9;
  const mY = (T + B - b) / 2;
  return [
    [L, T], [R, T], [R, T + sh], [R - sw, T + sh], [R - sw, T + b], [S, T + b],
    [S, mY], [M, mY], [M, mY + sh], [M - sw, mY + sh], [M - sw, mY + b], [S, mY + b],
    [S, B - b], [R - sw, B - b], [R - sw, B - sh], [R, B - sh], [R, B], [L, B]
  ];
}

const ESCALA = 1 / 36;
const PROFUNDIDAD = 0.3;

function geometriaE(espejo: boolean) {
  const puntos = contornoE().map(([x, y]) => (espejo ? [100 - x, y + 12] : [x, y]));
  // Centrado respecto del conjunto y con el eje Y hacia arriba.
  const a = puntos.map(([x, y]) => [(x - 50) * ESCALA, -(y - 50) * ESCALA] as [number, number]);
  const forma = new Shape();
  a.forEach(([x, y], i) => (i ? forma.lineTo(x, y) : forma.moveTo(x, y)));
  forma.closePath();
  const g = new ExtrudeGeometry(forma, { depth: PROFUNDIDAD, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, steps: 1 });
  g.translate(0, 0, -PROFUNDIDAD / 2);
  return g;
}

// Textura de grano fino para piedra y latón cepillado.
function ruido(tam: number, estirar: boolean) {
  const c = document.createElement('canvas');
  c.width = c.height = tam;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(tam, tam);
  let semilla = 7;
  const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
  for (let y = 0; y < tam; y++) {
    const fila = estirar ? azar() : 0;
    for (let x = 0; x < tam; x++) {
      const v = Math.round(255 * (estirar ? 0.55 * fila + 0.45 * azar() : azar() * 0.5 + azar() * 0.5));
      const i = (y * tam + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(estirar ? 0.4 : 3, estirar ? 7 : 3);
  return t;
}

// Estudio de luz: paneles luminosos que dan reflejos largos al latón.
function entorno(pmrem: PMREMGenerator) {
  const s = new Scene();
  s.background = new Color(0x060b12);
  const panel = (c: number, f: number, x: number, y: number, z: number, w: number, h: number) => {
    const m = new Mesh(new BoxGeometry(w, h, 0.1), new MeshBasicMaterial({ color: new Color(c).multiplyScalar(f) }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  panel(0xfff1d6, 26, -4, 3, 3, 1.6, 7);
  panel(0xdbe8ff, 9, 5, 1, 2, 1.2, 8);
  panel(0xfff1d6, 7, 0, 6, 1, 8, 1.4);
  panel(0x8fa8c8, 2.5, 0, -5, 2, 9, 1.4);
  // Panel frontal amplio: da al latón un brillo cálido en sus caras principales.
  panel(0xffe9c4, 2.6, 1, 0.5, 9, 12, 12);
  const rt = pmrem.fromScene(s, 0.035);
  s.traverse(o => { if (o instanceof Mesh) { o.geometry.dispose(); (o.material as MeshBasicMaterial).dispose(); } });
  return rt;
}

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
  const ANCHO_E = 1.95, ALTO_E = 2.28;

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
