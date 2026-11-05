// Piezas compartidas del monograma 3D: geometría de las letras, texturas y estudio de luz.
import { BoxGeometry, CanvasTexture, Color, ExtrudeGeometry, Mesh, MeshBasicMaterial, PMREMGenerator, RepeatWrapping, Scene, Shape } from 'three';

// Tamaño del monograma completo en unidades de escena.
export const ANCHO_E = 1.95;
export const ALTO_E = 2.28;

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

export function geometriaE(espejo: boolean) {
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
export function ruido(tam: number, estirar: boolean) {
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
export function entorno(pmrem: PMREMGenerator) {
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
