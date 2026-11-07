// Las tres marcas. Símbolos macizos, una sola tinta; nombre en dos líneas apretadas.
import { paper, texto, glifos, rect, circulo, fusionar, unir } from './lib.mjs';
const pt = (x, y) => new paper.Point(x, y);
const menos = (a, ...b) => b.reduce((r, x) => r.subtract(x, { insert: false }), a);
const mas = (...a) => fusionar(a);
export const copia = (partes, { e = 1, x = 0, y = 0 } = {}) => partes.map(p => { const c = p.i.clone({ insert: false }); c.scale(e, pt(0, 0)); c.translate(pt(x, y)); return { i: c, rol: p.rol }; });
export const caja = partes => partes.map(p => p.i.bounds).reduce((a, b) => a.unite(b));
export const aOrigen = partes => { const b = caja(partes); return copia(partes, { x: -b.left, y: -b.top }); };
const pieza = i => ({ i, rol: 'tinta' });

const ranura = (x0, y, h) => mas(rect(x0 + h / 2, y, 80, h), circulo(x0 + h / 2, y + h / 2, h / 2));
// Polígono cerrado con cada vértice redondeado: [x, y, radio].
const poligono = v => {
  const K = .5523, q = new paper.Path({ insert: false, closed: true });
  v.forEach(([x, y, r], i) => {
    const P = pt(x, y), haciaA = pt(...v[(i + v.length - 1) % v.length]).subtract(P).normalize(), haciaB = pt(...v[(i + 1) % v.length]).subtract(P).normalize();
    q.add(new paper.Segment(P.add(haciaA.multiply(r)), null, haciaA.multiply(-r * K)), new paper.Segment(P.add(haciaB.multiply(r)), haciaB.multiply(-r * K), null));
  });
  return q;
};
// A · Doble: un solo bloque y tres cortes finos, con las esquinas apenas redondeadas. Una E mira a la derecha, la otra a la izquierda; comparten el tramo central.
export const simboloA = ({ t = 3.4 } = {}) => {
  const W = 108, H = 100, st = 20, f = H / 4, R = 3.5, b = Math.min(1.2, t * .3), e = t / 2;
  const y1 = f - e, y2 = f + e, y7 = 3 * f - e, y8 = 3 * f + e;
  const silueta = poligono([[0, 0, R], [W, 0, R], [W, y1, b], [st, y1, e], [st, y2, e], [W, y2, b], [W, H, R], [0, H, R], [0, y8, b], [W - st, y8, e], [W - st, y7, e], [0, y7, b]]);
  const ranura = y => poligono([[st, y - e, e], [W - st, y - e, e], [W - st, y + e, e], [st, y + e, e]]);
  return [pieza(menos(silueta, ranura(2 * f)))];
};
// B · Disco: círculo macizo con dos ranuras de fondo redondeado.
export const simboloB = () => [pieza(menos(circulo(50, 50, 50), ranura(33.5, 23, 13), ranura(33.5, 64, 13)))];
// C · Portal: un solo arco, tumbado y cortado en tres franjas. De pie es una puerta.
export const simboloC = () => {
  const arco = mas(rect(50, 0, 44, 100), circulo(50, 50, 50));
  const f = (y, h, x1) => arco.intersect(rect(-1, y, x1 + 1, h), { insert: false });
  return [pieza(f(0, 27, 94)), pieza(f(36.5, 27, 74)), pieza(f(73, 27, 94))];
};

export const TIPOS = {
  a: { tit: ['Marcellus.ttf'], txt: ['SchibstedGrotesk.ttf', { wght: 450 }], tr: 0, lh: .87, lineas: ['EVELYN', 'ELIZONDO'], G: .1, par: { EV: .3, VE: .32, EL: 1, LY: .12, YN: .5, LI: 1, IZ: .85, ZO: .62, ON: .7, ND: 1, DO: .6 } },
  b: { tit: ['Archivo.ttf', { wdth: 125, wght: 550 }], txt: ['Archivo.ttf', { wdth: 100, wght: 450 }], tr: -.035, lh: .9, lineas: ['EVELYN', 'ELIZONDO'], G: .07 },
  c: { tit: ['FamiljenGrotesk.ttf', { wght: 600 }], txt: ['FamiljenGrotesk.ttf', { wght: 450 }], tr: -.025, lh: 1, lineas: ['Evelyn', 'Elizondo'] },
};
// Interletraje manual: blanco entre cajas de cada pareja. Redondas y diagonales se cierran; las rectas mandan.
const PAR = { EV: .42, VE: .42, EL: .9, LY: .22, YN: .45, LI: 1, IZ: .9, ZO: .8, ON: .78, ND: 1, DO: .62 };
function espaciar(v, G, par = PAR) { for (let i = 1; i < v.length; i++) { const f = par[v[i - 1].car + v[i].car] ?? 1; v[i].c.translate(pt(v[i - 1].c.bounds.right + G * f - v[i].c.bounds.left, 0)); } return v; }
// La I de esa fuente lleva remates: dentro de una grotesca maciza se sustituye por un asta limpia.
function ajustarI(v) {
  const L = v.find(q => q.car === 'L') ?? v.find(q => q.car === 'E'), b = L.c.bounds;
  const lin = new paper.Path.Line({ from: [b.left - 2, b.top + b.height * .3], to: [b.right + 2, b.top + b.height * .3], insert: false });
  const xs = L.c.getIntersections(lin).map(p => p.point.x).sort((m, n) => m - n), ancho = xs[1] - xs[0];
  for (const q of v) if (q.car === 'I') q.c = rect(q.c.bounds.center.x - ancho / 2, b.top, ancho, b.height);
}
// Dos líneas alineadas por la izquierda óptica.
export function nombre(id, size = 40) {
  const t = TIPOS[id], [f, v] = t.tit, [l1, l2] = t.lineas;
  const linea = (cad, y) => {
    if (t.G) { const g = glifos(f, v, cad, { size, y }).glifos; if (t.recta) ajustarI(g); return unir(espaciar(g, size * t.G, t.par).map(q => q.c)); }
    return texto(f, v, cad, { size, tracking: size * t.tr, y });
  };
  const a = linea(l1, 0), b = linea(l2, size * t.lh);
  a.translate(pt(-a.bounds.left, 0)); b.translate(pt(-b.bounds.left, 0));
  return [pieza(a), pieza(b)];
}
export function lema(id, size) {
  const [f, v] = TIPOS[id].txt;
  return [pieza(texto(f, v, 'Derecho de Familia, Costa Rica', { size, tracking: size * .002 }))];
}
const SIMBOLO = { a: simboloA, b: simboloB, c: simboloC };

function horizontal(id, conLema) {
  const n = aOrigen(nombre(id)), hn = caja(n).height, l = conLema ? aOrigen(lema(id, 13.2)) : null;
  const total = conLema ? hn + hn * .24 + caja(l).height : hn;
  const s0 = aOrigen(SIMBOLO[id]()), sobre = id === 'b' ? 1.04 : 1, e = total * sobre / caja(s0).height, s = copia(s0, { e, y: -total * (sobre - 1) / 2 });
  const x = caja(s).width + total * .2;
  const out = [...s, ...copia(n, { x })];
  if (l) out.push(...copia(l, { x, y: total - caja(l).height }));
  return out;
}
function vertical(id) {
  const n = aOrigen(nombre(id)), hn = caja(n).height, l = aOrigen(lema(id, 13.2));
  const s0 = aOrigen(SIMBOLO[id]()), e = (hn * 1.5) / caja(s0).height, s = copia(s0, { e });
  const y1 = hn * 1.5 + hn * .3, y2 = y1 + hn + hn * .24;
  return [...s, ...copia(n, { y: y1 }), ...copia(l, { y: y2 })];
}
export const PROPUESTAS = {
  a: { id: 'a', nombre: 'Doble', sub: 'Un bloque, dos letras', simbolo: simboloA, simboloPeq: () => simboloA({ t: 7 }),
    color: { o: '#1B1A18', c: '#DAD5CC', s: '#DAD5CC', m: '#8E867A', p: '#F4F2EC', n2: '#3A3835' } },
  b: { id: 'b', nombre: 'Disco', sub: 'Un círculo, una letra', simbolo: simboloB,
    color: { o: '#14283E', c: '#E6E1D8', s: '#E6E1D8', m: '#7F8C99', p: '#F6F4EE', n2: '#2C4158' } },
  c: { id: 'c', nombre: 'Portal', sub: 'Un arco, tres franjas', simbolo: simboloC,
    color: { o: '#2F1518', c: '#E3D9CC', s: '#E3D9CC', m: '#9A7F73', p: '#F7F3EC', n2: '#4B2B2E' } },
};
for (const p of Object.values(PROPUESTAS)) Object.assign(p, {
  principal: () => horizontal(p.id, false),
  conLema: () => horizontal(p.id, true),
  compacta: () => vertical(p.id),
  isotipo: () => aOrigen(p.simbolo()),
});
