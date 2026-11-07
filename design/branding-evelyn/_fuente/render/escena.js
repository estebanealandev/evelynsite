// Mockups 3D: la luz de área y la oclusión salen de acumular muchas pasadas con la luz desplazada.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
const Q = new URLSearchParams(location.search);
const ID = Q.get('id'), ESC = Q.get('esc'), W = +Q.get('w') || 1000, H = +Q.get('h') || 700, N = +Q.get('n') || 16;
const COL = JSON.parse(Q.get('col'));
const azar = (() => { let s = 12345; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

// ── Texturas procedurales
function ruido(n, oct, sem) {
  const r = (() => { let s = sem; return () => (s = (s * 48271) % 2147483647) / 2147483647; })();
  const out = new Float32Array(n * n);
  for (let o = 0; o < oct; o++) {
    const c = 4 << o, g = new Float32Array((c + 1) * (c + 1)).map(() => r()), A = 1 / (1 << o);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const fx = x / n * c, fy = y / n * c, ix = fx | 0, iy = fy | 0; let tx = fx - ix, ty = fy - iy; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
      const a = g[iy * (c + 1) + ix], b = g[iy * (c + 1) + ix + 1], d = g[(iy + 1) * (c + 1) + ix], e = g[(iy + 1) * (c + 1) + ix + 1];
      out[y * n + x] += A * (a + (b - a) * tx + (d - a) * ty + (a - b - d + e) * tx * ty);
    }
  }
  return out;
}
function hormigon({ n = 2048, base = [186, 185, 181], var1 = 22, poros = 1500, grietas = 2, sem = 7 } = {}) {
  const a = ruido(n, 7, sem), b = ruido(n, 4, sem * 3 + 1);
  const cv = document.createElement('canvas'); cv.width = cv.height = n; const x = cv.getContext('2d');
  const im = x.createImageData(n, n);
  for (let i = 0; i < n * n; i++) { const v = (a[i] - 1) * var1 + (b[i] - 1) * var1 * .9; im.data[i * 4] = base[0] + v; im.data[i * 4 + 1] = base[1] + v; im.data[i * 4 + 2] = base[2] + v * .96; im.data[i * 4 + 3] = 255; }
  x.putImageData(im, 0, 0);
  const bc = document.createElement('canvas'); bc.width = bc.height = n; const bx = bc.getContext('2d');
  const bi = bx.createImageData(n, n);
  for (let i = 0; i < n * n; i++) { const v = 128 + (a[i] - 1) * 150; bi.data[i * 4] = bi.data[i * 4 + 1] = bi.data[i * 4 + 2] = v; bi.data[i * 4 + 3] = 255; }
  bx.putImageData(bi, 0, 0);
  const rr = (() => { let s = sem * 11; return () => (s = (s * 48271) % 2147483647) / 2147483647; })();
  for (let i = 0; i < poros * 3; i++) { const px = rr() * n, py = rr() * n; if (b[(py | 0) * n + (px | 0)] < 1.02) continue; const ra = .3 + rr() * rr() * rr() * 3; x.fillStyle = `rgba(90,90,88,${.18 + rr() * .3})`; x.beginPath(); x.arc(px, py, ra, 0, 7); x.fill(); bx.fillStyle = 'rgba(20,20,20,.9)'; bx.beginPath(); bx.arc(px, py, ra, 0, 7); bx.fill(); }
  for (let g = 0; g < grietas; g++) { let px = rr() * n, py = rr() * n, an = rr() * 6.3; x.strokeStyle = 'rgba(60,60,58,.5)'; bx.strokeStyle = 'rgba(0,0,0,.9)'; x.lineWidth = bx.lineWidth = .7; x.beginPath(); bx.beginPath(); x.moveTo(px, py); bx.moveTo(px, py); for (let k = 0; k < 90; k++) { an += (rr() - .5) * .9; px += Math.cos(an) * 5; py += Math.sin(an) * 5; x.lineTo(px, py); bx.lineTo(px, py); } x.stroke(); bx.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  const u = new THREE.CanvasTexture(bc); u.wrapS = u.wrapT = THREE.RepeatWrapping; u.anisotropy = 8;
  return { map: t, bumpMap: u, bumpScale: 1.4, roughness: .95, metalness: 0 };
}
function fino(base, sem = 3, var1 = 7) { return hormigon({ n: 1024, base, var1, poros: 0, grietas: 0, sem }); }
const carga = new THREE.TextureLoader();
const tex = n => new Promise(res => carga.load(`/tex/${ID}/${n}.png`, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; t.generateMipmaps = true; res(t); }));
// UV a escala real: el hormigón no se estira en bloques de distinto tamaño.
function uvReal(g, esc = 110) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)); let u, v; if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); } else if (ax >= az) { u = p.getZ(i); v = p.getY(i); } else { u = p.getX(i); v = p.getY(i); } uv.setXY(i, u / esc + .5, v / esc + .5); }
  return g;
}
const sombra = m => { m.castShadow = m.receiveShadow = true; return m; };
const hex = h => new THREE.Color(h);
function bloque(w, h, d, mat, r = .35) { const g = uvReal(new RoundedBoxGeometry(w, h, d, 3, r)); return sombra(new THREE.Mesh(g, new THREE.MeshStandardMaterial(mat))); }
// Pieza de papel con grosor: la textura va en la cara superior.
function papel(w, d, t, mapa, lado, { rugos = .86 } = {}) {
  const s = new THREE.MeshStandardMaterial({ color: hex(lado), roughness: rugos });
  const top = new THREE.MeshStandardMaterial({ map: mapa, roughness: rugos });
  return sombra(new THREE.Mesh(new THREE.BoxGeometry(w, t, d), [s, s, top, s, s, s]));
}
function redondo(w, d, r) { const s = new THREE.Shape(), x = -w / 2, y = -d / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
function placaRedonda(w, d, r, t, matTop, matLado) {
  const g = new THREE.ExtrudeGeometry(redondo(w, d, r), { depth: t, bevelEnabled: false, curveSegments: 10 });
  const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + .5, p.getY(i) / d + .5);
  g.rotateX(-Math.PI / 2); g.translate(0, 0, 0);
  return sombra(new THREE.Mesh(g, [matTop, matLado]));
}
function libreta(mapa) {
  const G = new THREE.Group(), w = 14, d = 20;
  const lado = new THREE.MeshStandardMaterial({ color: hex(COL.o), roughness: .7 });
  const top = new THREE.MeshStandardMaterial({ map: mapa, roughness: .72 });
  const baj = placaRedonda(w, d, .5, .22, lado, lado); baj.position.y = 0;
  const paginas = sombra(new THREE.Mesh(new THREE.BoxGeometry(w - .35, 1.25, d - .35), new THREE.MeshStandardMaterial({ color: hex('#EDEAE2'), roughness: .9 }))); paginas.position.y = .22 + .625;
  const cub = placaRedonda(w, d, .5, .22, top, lado); cub.position.y = 1.47;
  const banda = sombra(new THREE.Mesh(new THREE.BoxGeometry(.65, 1.84, d + .08), new THREE.MeshStandardMaterial({ color: hex(COL.n2), roughness: .95 }))); banda.position.set(w / 2 - 1.5, .92, 0);
  G.add(baj, paginas, cub, banda); return G;
}
function telefono(mapa) {
  const G = new THREE.Group(), w = 7.4, d = 15.6;
  const cuerpo = sombra(new THREE.Mesh(new RoundedBoxGeometry(w, .8, d, 5, .4), new THREE.MeshStandardMaterial({ color: hex('#121214'), roughness: .3, metalness: .5 })));
  const pant = new THREE.Mesh(new THREE.ShapeGeometry(redondo(w - .36, d - .36, .95), 12), new THREE.MeshBasicMaterial({ map: mapa, color: '#FFFFFF' }));
  const p = pant.geometry.attributes.position, uv = pant.geometry.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / (w - .36) + .5, p.getY(i) / (d - .36) + .5);
  pant.rotation.x = -Math.PI / 2; pant.position.y = .405;
  const isla = new THREE.Mesh(new THREE.ShapeGeometry(redondo(1.9, .52, .25), 8), new THREE.MeshStandardMaterial({ color: '#050505', roughness: .2 })); isla.rotation.x = -Math.PI / 2; isla.position.set(0, .41, -d / 2 + .75);
  G.add(cuerpo, pant, isla); return G;
}
function pila(n, fn, salto, gira = .012) { const G = new THREE.Group(); for (let i = 0; i < n; i++) { const m = fn(i); m.position.y = i * salto; m.rotation.y = (azar() - .5) * gira * (i < n - 1 ? 1 : 0); G.add(m); } return G; }
function sobreReverso(w, d, mapa, col) {
  const G = new THREE.Group(); G.add(papel(w, d, .08, mapa, col));
  const s = new THREE.Shape(); s.moveTo(-w / 2, d / 2 - .02); s.lineTo(w / 2, d / 2 - .02); s.lineTo(w / 2 - .25, d / 2 - d * .52 + d * .06); s.quadraticCurveTo(w / 2 - .5, d / 2 - d * .56 + d * .06, w / 2 - 1.5, d / 2 - d * .56 + d * .06); s.lineTo(-w / 2 + 1.5, d / 2 - d * .56 + d * .06); s.quadraticCurveTo(-w / 2 + .5, d / 2 - d * .56 + d * .06, -w / 2 + .25, d / 2 - d * .52 + d * .06); s.closePath();
  const f = sombra(new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .05, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: hex(col), roughness: .8 }))); f.geometry.rotateX(-Math.PI / 2); f.position.y = .045; f.scale.z = 1; G.add(f); return G;
}

// ── Motor de acumulación
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setSize(W, H, false); renderer.setPixelRatio(1); document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene();
const principal = new THREE.DirectionalLight('#FFF6EC', 1), domo = new THREE.DirectionalLight('#E8EEF5', 1), fill = new THREE.HemisphereLight('#FFFFFF', '#9A9894', .42);
for (const l of [principal, domo]) { l.castShadow = true; l.shadow.mapSize.set(4096, 4096); l.shadow.bias = -.0003; l.shadow.normalBias = .02; const c = l.shadow.camera; c.left = c.bottom = -70; c.right = c.top = 70; c.near = 1; c.far = 400; scene.add(l, l.target); }
scene.add(fill);
async function acumular(camara, { dirKey, radio = .16, kKey = 2.2, kDomo = 1.7, sobreKey } = {}) {
  const op = { type: THREE.HalfFloatType, depthBuffer: true, colorSpace: THREE.LinearSRGBColorSpace };
  const rtA = new THREE.WebGLRenderTarget(W, H, op), rtB = new THREE.WebGLRenderTarget(W, H, { ...op, depthBuffer: false }), rtC = new THREE.WebGLRenderTarget(W, H, { ...op, depthBuffer: false });
  const qs = new THREE.Scene(), qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mezcla = new THREE.ShaderMaterial({ uniforms: { a: { value: null }, b: { value: null }, k: { value: 0 } }, vertexShader: 'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}', fragmentShader: 'uniform sampler2D a,b;uniform float k;varying vec2 v;void main(){gl_FragColor=mix(texture2D(a,v),texture2D(b,v),k);}', depthTest: false, depthWrite: false, toneMapped: false });
  const final = new THREE.ShaderMaterial({ uniforms: { t: { value: null } }, vertexShader: 'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}', fragmentShader: 'uniform sampler2D t;varying vec2 v;void main(){vec3 c=texture2D(t,v).rgb*.86;vec3 h=.78+.22*(1.-exp(-(max(c,.78)-.78)/.22));c=mix(c,h,step(.78,c));gl_FragColor=vec4(c,1.);\n#include <colorspace_fragment>\n}', depthTest: false, depthWrite: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mezcla); qs.add(quad);
  const k = new THREE.Vector3(...dirKey).normalize(), t1 = new THREE.Vector3(0, 1, 0).cross(k).normalize(), t2 = k.clone().cross(t1).normalize();
  principal.intensity = kKey; domo.intensity = kDomo;
  let acum = rtB, otro = rtC;
  for (let i = 0; i < N; i++) {
    const a = azar() * 6.283, r = Math.sqrt(azar()) * radio;
    principal.position.copy(k.clone().add(t1.clone().multiplyScalar(Math.cos(a) * r)).add(t2.clone().multiplyScalar(Math.sin(a) * r))).multiplyScalar(200);
    const u = azar(), ph = azar() * 6.283, y = Math.sqrt(1 - u * .96), s = Math.sqrt(1 - y * y);
    domo.position.set(Math.cos(ph) * s, y, Math.sin(ph) * s).multiplyScalar(200);
    camara.setViewOffset(W, H, azar() - .5, azar() - .5, W, H);
    renderer.setRenderTarget(rtA); renderer.render(scene, camara);
    quad.material = mezcla; mezcla.uniforms.a.value = acum.texture; mezcla.uniforms.b.value = rtA.texture; mezcla.uniforms.k.value = 1 / (i + 1);
    renderer.setRenderTarget(otro); renderer.render(qs, qc);
    [acum, otro] = [otro, acum];
    if (i % 4 === 3) await new Promise(r => setTimeout(r));
  }
  quad.material = final; final.uniforms.t.value = acum.texture; renderer.setRenderTarget(null); renderer.render(qs, qc);
}
const camara = (fov, pos, mira) => { const c = new THREE.PerspectiveCamera(fov, W / H, 1, 800); c.position.set(...pos); c.lookAt(...mira); return c; };
const pasarela = () => { // Ciclorama: el suelo sube en curva hasta ser pared, sin horizonte.
  const g = new THREE.PlaneGeometry(1200, 1000, 1, 160), p = g.attributes.position, R = 90, zc = -150;
  for (let i = 0; i < p.count; i++) { const zz = 400 - (500 - p.getY(i)); let y, z; const L = zz - zc; if (L >= 0) { z = zz; y = 0; } else { const arco = -L, th = arco / R; if (th < Math.PI / 2) { z = zc - Math.sin(th) * R; y = R - Math.cos(th) * R; } else { z = zc - R; y = R + (arco - R * Math.PI / 2); } } p.setXYZ(i, p.getX(i), y, z); }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ ...fino([208, 209, 206], 5, 3), side: THREE.DoubleSide })); m.material.bumpScale = .1; m.receiveShadow = true; return m; };

const E = {
  async hero() {
    const con = hormigon({});
    scene.add(pasarela());
    const Gr = new THREE.Group(); Gr.rotation.y = -.5; scene.add(Gr);
    const b1 = bloque(62, 7, 30, con, .4); b1.position.set(0, 3.5, 0); Gr.add(b1);
    const b2 = bloque(21, 5, 30, hormigon({ sem: 23 }), .4); b2.position.set(16, 9.5, 0); Gr.add(b2);
    const lb = libreta(await tex('libreta')); lb.position.set(16, 12, 0); Gr.add(lb);
    const tel = telefono(await tex('telefono')); tel.position.set(-1.6, 7.4, .6); tel.rotation.y = .07; Gr.add(tel);
    const at = await tex('tarjeta-anverso'), rv = await tex('tarjeta-reverso');
    const cards = pila(6, i => papel(8.5, 5.5, .05, at, COL.c), .052); cards.position.set(-18, 7.03, 4.6); cards.rotation.y = .05; Gr.add(cards);
    const c2 = papel(8.5, 5.5, .05, rv, COL.o); c2.position.set(-18.4, 7.03, -4.6); c2.rotation.y = -.06; Gr.add(c2);
    await acumular(camara(23, [12, 104, 88], [2, 5, 3]), { dirKey: [-.8, .95, -.3], radio: .12, kKey: 2.7, kDomo: 1.9 });
  },
  async tarjetas() {
    scene.add(pasarela());
    const con = hormigon({ sem: 19 }); const b = bloque(46, 10, 34, con, .4); b.position.set(3, 5, -8); b.rotation.y = .32; scene.add(b);
    const G = new THREE.Group(); G.position.set(3, 10, -8); G.rotation.y = .32; scene.add(G);
    const at = await tex('tarjeta-anverso'), rv = await tex('tarjeta-reverso');
    const p1 = pila(12, i => papel(17, 11, .06, i === 11 ? at : at, COL.c), .062, .03); p1.position.set(-7, .03, 2); p1.rotation.y = -.18; G.add(p1);
    const p2 = pila(7, i => papel(17, 11, .06, rv, COL.o), .062, .03); p2.position.set(11, .03, -5); p2.rotation.y = .09; G.add(p2);
    await acumular(camara(22, [-16, 74, 74], [3, 9, -6]), { dirKey: [-.9, .9, -.45], radio: .11, kKey: 2.8, kDomo: 1.9 });
  },
  async papeleria() {
    const await_hoja = await tex('hoja-membretada-a4'), tarAn = await tex('tarjeta-anverso'), tarRe = await tex('tarjeta-reverso');
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ ...hormigon({ base: [205, 204, 200], var1: 6, poros: 260, grietas: 0, sem: 31 }) })); suelo.material.bumpScale = .4; suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; scene.add(suelo);
    const G = new THREE.Group(); G.rotation.y = -.3; scene.add(G);
    const cp = papel(22, 31, .6, await tex('carpeta'), COL.o); cp.position.set(-25, .3, 0); G.add(cp);
    const ho = pila(14, () => papel(21, 29.7, .04, await_hoja, COL.p), .04, .004); ho.position.set(-.5, .02, .4); ho.rotation.y = .02; G.add(ho);
    const sr = sobreReverso(22, 11, await tex('sobre-dl-reverso'), COL.o); sr.position.set(24.5, .16, -9.5); sr.rotation.y = -.02; G.add(sr);
    const sa = papel(22, 11, .22, await tex('sobre-dl-anverso'), COL.p); sa.position.set(24.5, .11, 3); sa.rotation.y = .02; G.add(sa);
    const t1 = pila(5, (() => { const m = { a: null }; return i => papel(8.5, 5.5, .05, tarAn, COL.c); })(), .05); t1.position.set(19, .03, 13); t1.rotation.y = -.04; G.add(t1);
    const t2 = pila(5, i => papel(8.5, 5.5, .05, tarRe, COL.o), .05); t2.position.set(29.5, .03, 13); t2.rotation.y = .03; G.add(t2);
    await acumular(camara(25, [2, 124, 62], [0, 0, 1]), { dirKey: [-.75, .6, -.42], radio: .05, kKey: 3.1, kDomo: 1.6 });
  },
  async letrero() {
    const pared = new THREE.Mesh(new THREE.PlaneGeometry(700, 400), new THREE.MeshStandardMaterial({ ...fino(COL.paredRGB, 9, 5) })); pared.material.bumpScale = .25; pared.position.y = 40; pared.receiveShadow = true; scene.add(pared);
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(700, 400), new THREE.MeshStandardMaterial({ ...hormigon({ base: [150, 149, 146], var1: 9, poros: 200, grietas: 0, sem: 61 }) })); suelo.material.bumpScale = .3; suelo.rotation.x = -Math.PI / 2; suelo.position.set(0, -46, 200); suelo.receiveShadow = true; scene.add(suelo);
    const banco = bloque(150, 12, 30, hormigon({ sem: 77 }), .3); banco.position.set(26, -40, 18);
    const txt = await (await fetch(`/logo/${ID}.svg`)).text();
    const datos = new SVGLoader().parse(txt), G = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: hex(COL.o), roughness: .62, metalness: 0 });
    for (const p of datos.paths) for (const sh of SVGLoader.createShapes(p)) G.add(sombra(new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 8, bevelEnabled: false, curveSegments: 22 }), mat)));
    const caja = new THREE.Box3().setFromObject(G), an = caja.max.x - caja.min.x, al = caja.max.y - caja.min.y, e = 72 / an;
    G.scale.set(e, -e, e); G.position.set(-(caja.min.x + an / 2) * e, 10 + (caja.min.y + al / 2) * e, 1.1); scene.add(G);
    await acumular(camara(27, [-30, 4, 136], [3, -3, 0]), { dirKey: [-.5, .72, .55], radio: .22, kKey: 2.3, kDomo: 2.5 });
  },
  async portatil() {
    scene.add(pasarela());
    const con = hormigon({ sem: 43 }); const pl = bloque(54, 22, 38, con, .5); pl.position.set(0, 11, 0); pl.rotation.y = .1; scene.add(pl);
    const G = new THREE.Group(); G.position.y = 22; G.rotation.y = .1; scene.add(G);
    const alum = new THREE.MeshStandardMaterial({ color: '#A9AAAD', roughness: .46, metalness: .05 });
    const base = sombra(new THREE.Mesh(new RoundedBoxGeometry(34, 1, 23, 3, .4), alum)); base.position.set(0, .5, 2); G.add(base);
    const bisagra = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 25, 16), new THREE.MeshStandardMaterial({ color: '#2A2B2E', roughness: .5 }))); bisagra.rotation.z = Math.PI / 2; bisagra.position.set(0, 1, -9.35); G.add(bisagra);
    const cv = document.createElement('canvas'); cv.width = 1450; cv.height = 550; const x = cv.getContext('2d'); x.fillStyle = '#3B3C40'; x.fillRect(0, 0, 1450, 550);
    const filas = [[14, 1], [14, 1], [13, 1], [12, 1]]; x.fillStyle = '#0F1012';
    for (let f = 0; f < 5; f++) { const n = f === 4 ? 9 : 14, h = f === 0 ? 62 : 92, y = f === 0 ? 12 : 84 + (f - 1) * 114; let px = 12; for (let k = 0; k < n; k++) { let w = (1450 - 24 - (n - 1) * 12) / n; if (f === 4) w = k === 4 ? 500 : (1450 - 24 - 8 * 12 - 500) / 8; x.beginPath(); x.roundRect(px, y, w, h, 9); x.fill(); px += w + 12; } }
    const tt = new THREE.CanvasTexture(cv); tt.colorSpace = THREE.SRGBColorSpace; tt.anisotropy = 16;
    const tecl = new THREE.Mesh(new THREE.PlaneGeometry(29, 11), new THREE.MeshStandardMaterial({ map: tt, roughness: .6 })); tecl.rotation.x = -Math.PI / 2; tecl.position.set(0, 1.01, -1.3); tecl.receiveShadow = true; G.add(tecl);
    const pista = new THREE.Mesh(new THREE.PlaneGeometry(11, 6.6), new THREE.MeshStandardMaterial({ color: '#8F9093', roughness: .36 })); pista.rotation.x = -Math.PI / 2; pista.position.set(0, 1.01, 8.3); G.add(pista);
    const tapa = new THREE.Group(); tapa.position.set(0, 1, -9.4); tapa.rotation.x = -.2; G.add(tapa);
    const lid = sombra(new THREE.Mesh(new RoundedBoxGeometry(34, 22.4, .42, 3, .2), new THREE.MeshStandardMaterial({ color: '#A9AAAD', roughness: .46 })));
    const marco = new THREE.Mesh(new THREE.PlaneGeometry(33.6, 22), new THREE.MeshStandardMaterial({ color: '#08080A', roughness: .3 })); marco.position.set(0, 11.2, .215); tapa.add(marco); lid.position.set(0, 11.2, 0); tapa.add(lid);
    const mt = await tex('portada-sitio'); const pant = new THREE.Mesh(new THREE.PlaneGeometry(32.6, 20.38), new THREE.MeshBasicMaterial({ map: mt, color: '#FFFFFF' })); pant.position.set(0, 11.35, .225); tapa.add(pant);
    await acumular(camara(25, [-16, 50, 92], [0, 31, 0]), { dirKey: [-.8, .8, .28], radio: .14, kKey: 2.4, kDomo: 1.9 });
  },
};
await E[ESC]();
window.__fin = renderer.domElement.toDataURL('image/png');
