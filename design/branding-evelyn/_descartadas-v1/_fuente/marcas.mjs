// Dibujo definitivo de las tres identidades. Cada función devuelve piezas { i, rol } en coordenadas propias.
import { paper, texto, glifos, rect, unir, fusionar, ahusar } from './lib.mjs';

const pt = (x, y) => new paper.Point(x, y);
const poly = pts => new paper.Path({ segments: pts, closed: true, insert: false });
const forma = d => new paper.CompoundPath({ pathData: d, insert: false });
const IB = 'IbarraRealNova.ttf', IBI = 'IbarraRealNova-Italic.ttf';
const BO = 'BodoniModa.ttf', BOI = 'BodoniModa-Italic.ttf';

// ───────────── Utilidades de composición
export const copia = (partes, { e = 1, x = 0, y = 0 } = {}) => partes.map(p => {
  const c = p.i.clone({ insert: false });
  c.scale(e, pt(0, 0)); c.translate(pt(x, y));
  return { i: c, rol: p.rol };
});
export const caja = partes => partes.map(p => p.i.bounds).reduce((a, b) => a.unite(b));
export const aOrigen = partes => { const b = caja(partes); return copia(partes, { x: -b.left, y: -b.top }); };
const unidos = (cad, f, v, op, rol = 'tinta') => ({ i: texto(f, v, cad, op), rol });

// Interletraje manual: fija el blanco entre las cajas de cada pareja. Redondas y diagonales se cierran más.
const OPT = { EV: .72, VE: .72, EL: 1, LY: .42, YN: .62, LI: 1, IZ: 1, ZO: .86, ON: .86, ND: .78, DO: .76 };
function espaciar(gs, G) {
  const v = gs.filter(q => q.c);
  for (let i = 1; i < v.length; i++) {
    const f = OPT[v[i - 1].car + v[i].car] ?? 1, dx = v[i - 1].c.bounds.right + G * f - v[i].c.bounds.left;
    v[i].c.translate(pt(dx, 0));
  }
  return v;
}
// ═════════════ A · NEXO: redonda y cursiva
export function simboloA({ asta = 16, fil = 3.3, grados = 12, X = 40, hueco = 3, brazoSup = 26, brazoMed = 19, brazoInf = 21, largo = 26, largoMed = 17, k = 12, picos = true } = {}) {
  const tan = Math.tan(grados * Math.PI / 180), H = 100;
  const xS = y => X + (H - y) * tan;
  const m = 49.2; // el brazo medio va apenas por encima del centro óptico
  // Los brazos de la redonda se igualan ópticamente y nunca llegan a tocar la cursiva.
  const tope = (y, l) => Math.min(asta + l, xS(y + fil) - hueco);
  const brazoR = (y, l) => rect(asta - .2, y, tope(y, l) - asta + .2, fil);
  const remateR = (y, l, sube) => { if (!picos) return null; const x = tope(y, l); return poly(sube ? [[x - 1.3, y + fil], [x, y + fil], [x, y + fil - k], [x - 1.3, y + fil - k]] : [[x - 1.3, y], [x, y], [x, y + k], [x - 1.3, y + k]]); };
  const pR = [rect(0, 0, asta, H), brazoR(0, brazoSup), brazoR(m - fil / 2, brazoMed), brazoR(H - fil, brazoInf), remateR(0, brazoSup, false), remateR(H - fil, brazoInf, true)].filter(Boolean);
  if (picos) { const x = tope(m, brazoMed), km = k * .62; pR.push(poly([[x - 1.3, m - km], [x, m - km], [x, m + km], [x - 1.3, m + km]])); }
  const redonda = fusionar(pR);
  const piezas = [poly([[xS(0), 0], [xS(0) + asta, 0], [xS(H) + asta, H], [xS(H), H]])];
  const brazoI = (y, l) => { const a = xS(y) + asta - .2, b = xS(y + fil) + asta - .2; return poly([[a, y], [xS(y) + asta + l, y], [xS(y + fil) + asta + l, y + fil], [b, y + fil]]); };
  piezas.push(brazoI(0, largo), brazoI(m - fil / 2, largoMed), brazoI(H - fil, largo));
  if (picos) {
    // Los tres remates siguen la misma regla: una lámina fina paralela a la inclinación.
    const lam = (y0, y1, l) => { const e = 1.35, xa = y => xS(y) + asta + l; return poly([[xa(y0) - e, y0], [xa(y0), y0], [xa(y1), y1], [xa(y1) - e, y1]]); };
    piezas.push(lam(0, k, largo), lam(m - k * .62, m + k * .62, largoMed), lam(H - k, H, largo));
  }
  return [{ i: redonda, rol: 'tinta' }, { i: fusionar(piezas), rol: 'acento' }];
}
const nombreA = (s = 30, v = { opsz: 14, wght: 430 }, tr = .3) => {
  const G = s * tr, a = espaciar(glifos(BO, v, 'EVELYN', { size: s }).glifos, G), b = espaciar(glifos(BO, v, 'ELIZONDO', { size: s }).glifos, G);
  const x = a[a.length - 1].c.bounds.right + s * .95 - b[0].c.bounds.left;
  b.forEach(q => q.c.translate(pt(x, 0)));
  return [{ i: unir([...a, ...b].map(q => q.c)), rol: 'tinta' }];
};
const lemaA = (s = 15.5, cad = 'Derecho de Familia  ·  Costa Rica') => [unidos(cad, BOI, { opsz: 14, wght: 400 }, { size: s, tracking: s * .05 }, 'acentoTexto')];

// ═════════════ B · HEBRAS: tres líneas tangentes
export function simboloB({ radios = [18, 29, 40], g = 6.4, D = 54, angulo = 45, barrido = 300, barrido2 = 278, espejo = true, acentoCentro = true } = {}) {
  const rad = a => a * Math.PI / 180;
  const c1 = [0, 0], c2 = [D * Math.cos(rad(angulo)), D * Math.sin(rad(angulo))];
  const p = (c, r, a) => [c[0] + r * Math.cos(rad(a)), c[1] + r * Math.sin(rad(a))];
  const h = g / 2, f = n => n.toFixed(4);
  const hebra = r1 => {
    const r2 = D - r1;
    const t1 = angulo, s1 = t1 - barrido;      // alrededor del primer centro, en sentido horario hasta la tangencia
    const t2 = angulo + 180, e2 = t2 - barrido2; // alrededor del segundo, en sentido antihorario
    const lg = barrido > 180 ? 1 : 0, lg2 = barrido2 > 180 ? 1 : 0;
    const A = p(c1, r1 + h, s1), B = p(c1, r1 + h, t1), C = p(c2, r2 - h, e2), E = p(c2, r2 + h, e2), F = p(c2, r2 + h, t2), G = p(c1, r1 - h, s1);
    return forma(`M${f(A[0])} ${f(A[1])} A${f(r1 + h)} ${f(r1 + h)} 0 ${lg} 1 ${f(B[0])} ${f(B[1])} A${f(r2 - h)} ${f(r2 - h)} 0 ${lg2} 0 ${f(C[0])} ${f(C[1])} L${f(E[0])} ${f(E[1])} A${f(r2 + h)} ${f(r2 + h)} 0 ${lg2} 1 ${f(F[0])} ${f(F[1])} A${f(r1 - h)} ${f(r1 - h)} 0 ${lg} 0 ${f(G[0])} ${f(G[1])} Z`);
  };
  const partes = radios.map((r, i) => ({ i: hebra(r), rol: acentoCentro && radios.length === 3 && i === 1 ? 'acento' : 'tinta' }));
  if (espejo) partes.forEach(q => q.i.scale(-1, 1, pt(0, 0)));
  const cb = caja(partes), esc = 100 / cb.height, sx = espejo ? -1 : 1;
  const salida = copia(aOrigen(partes), { e: esc });
  const tr = c => [(c[0] * sx - cb.left) * esc, (c[1] - cb.top) * esc];
  salida.meta = { c1: tr(c1), c2: tr(c2), radios: radios.map(r => r * esc), D: D * esc, g: g * esc };
  return salida;
}
const nombreB = (s = 42) => [unidos('Evelyn Elizondo', 'TenorSans.ttf', undefined, { size: s, tracking: s * .012 })];
const lemaB = (s = 13.4, cad = 'Derecho de Familia  ·  Costa Rica') => [unidos(cad, 'HankenGrotesk.ttf', { wght: 450 }, { size: s, tracking: s * .05 }, 'acentoTexto')];

// ═════════════ C · RÚBRICA
const vIB = { wght: 400 };
// Inicial grande y resto en versalita; el peso sube en las pequeñas para igualar el color.
function lineaC(cad, tam, { x = 0, y = 0, pequena = .8, tr = .2 } = {}) {
  const gr = glifos(IB, { wght: 400 }, cad[0], { size: tam }).glifos;
  const pe = glifos(IB, { wght: 455 }, cad.slice(1), { size: tam * pequena }).glifos;
  const v = espaciar([...gr, ...pe], tam * pequena * tr);
  const dx = x - v[0].c.bounds.left;
  v.forEach(q => q.c.translate(pt(dx, y)));
  return v;
}
// La Y pierde su pie: el asta se corta recta y continúa, con el mismo ancho exacto, en la rúbrica.
function conRubrica(Y, fin, tam, { prof = tam * .3, gMin = .62, bajada = .18, curva = .8 } = {}) {
  const yb = Y.bounds, base = yb.bottom, corte = base - yb.height * .16;
  const m = medirAsta(Y, corte);
  const resto = Y.subtract(rect(yb.left - 3, corte, yb.width + 6, yb.height), { insert: false });
  const rub = ahusar(`M${m.cx} ${corte - .02} L${m.cx} ${base + prof * bajada} C${m.cx} ${base + prof * .98} ${m.cx + tam * .24} ${base + prof * 1.02} ${m.cx + tam * .86} ${base + prof} L${fin} ${base + prof * .86}`, m.ancho, gMin, { pasos: 140, curva });
  return { resto, rub };
}
export function nombreC({ tam = 40, rubrica = true, gMin = .62, fuga = 0 } = {}) {
  const a = lineaC('EVELYN', tam);
  const b = lineaC('ELIZONDO', tam, { x: a[a.length - 1].c.bounds.right + tam * .66 });
  const Y = a.find(q => q.car === 'Y');
  const otros = [...a, ...b].filter(q => q !== Y).map(q => q.c);
  if (!rubrica) return [{ i: unir([...otros, Y.c]), rol: 'tinta' }];
  const { resto, rub } = conRubrica(Y.c, b[b.length - 1].c.bounds.right + fuga, tam, { gMin });
  return [{ i: unir(otros), rol: 'tinta' }, { i: resto, rol: 'tinta' }, { i: rub, rol: 'acento' }];
}
// Bloque compacto: las dos palabras completas, a la misma inicial; la rúbrica ocupa el hueco que deja EVELYN.
export function bloqueC({ tam = 44, gMin = .7 } = {}) {
  const a = lineaC('EVELYN', tam);
  const b = lineaC('ELIZONDO', tam, { y: tam * 1.14 });
  const Y = a.find(q => q.car === 'Y');
  const { resto, rub } = conRubrica(Y.c, b[b.length - 1].c.bounds.right, tam, { prof: tam * .26, gMin });
  return [{ i: unir([...a, ...b].filter(q => q !== Y).map(q => q.c)), rol: 'tinta' }, { i: resto, rol: 'tinta' }, { i: rub, rol: 'acento' }];
}
function medirAsta(gl, y) {
  const b = gl.bounds; const l = new paper.Path.Line({ from: [b.left - 5, y], to: [b.right + 5, y], insert: false });
  const xs = gl.getIntersections(l).map(c => c.point.x).sort((a, c) => a - c);
  return { cx: (xs[0] + xs[xs.length - 1]) / 2, ancho: xs[xs.length - 1] - xs[0] };
}
const lemaC = (s = 17, cad = 'Derecho de Familia, Costa Rica') => [unidos(cad, IBI, { wght: 400 }, { size: s, tracking: s * .035 }, 'tinta')];

// Símbolo: la E hereda el gesto de la Y; la rúbrica nace justo bajo su pie, sin invadirlo.
export function simboloC({ g, gMin = .85, peso = 400, fin = 88, prof = 13, cola = true } = {}) {
  const E = texto(IB, { wght: peso }, 'E', { size: 200 });
  E.translate(pt(-E.bounds.left, -E.bounds.top)); E.scale(84 / E.bounds.height, pt(0, 0));
  if (!cola) return [{ i: E, rol: 'tinta' }];
  const lin = new paper.Path.Line({ from: [-5, 84 * .27], to: [E.bounds.width + 5, 84 * .27], insert: false });
  const xs = E.getIntersections(lin).map(c => c.point.x).sort((a, b) => a - b);
  const cx = (xs[0] + xs[1]) / 2, ga = g ?? (xs[1] - xs[0]) * .5;
  const r = ahusar(`M${cx} 84.6 L${cx} ${84 + prof * .3} C${cx} ${84 + prof} ${cx + 9} ${84 + prof * 1.06} ${cx + 26} ${84 + prof} L${fin} ${84 + prof * .86}`, ga, gMin, { pasos: 100, curva: .62 });
  return [{ i: E, rol: 'tinta' }, { i: r, rol: 'acento' }];
}

// ═════════════ Composiciones comunes
function fila(simbolo, altoS, nombre, lema, sep, salto) {
  const n = aOrigen(nombre), l = lema ? aOrigen(lema) : null;
  const hn = caja(n).height, hl = l ? caja(l).height : 0, total = hn + (l ? salto + hl : 0);
  const s = copia(aOrigen(simbolo), { e: altoS / caja(aOrigen(simbolo)).height });
  const x = caja(s).width + sep, y0 = (altoS - total) / 2;
  const out = [...s, ...copia(n, { x, y: y0 })];
  if (l) out.push(...copia(l, { x, y: y0 + hn + salto }));
  return out;
}
function columna(simbolo, altoS, nombre, lema, sep, salto) {
  const n = aOrigen(nombre), l = lema ? aOrigen(lema) : null;
  const s = copia(aOrigen(simbolo), { e: altoS / caja(aOrigen(simbolo)).height });
  const W = Math.max(caja(n).width, caja(s).width, l ? caja(l).width : 0);
  const out = [...copia(s, { x: (W - caja(s).width) / 2 }), ...copia(n, { x: (W - caja(n).width) / 2, y: altoS + sep })];
  if (l) out.push(...copia(l, { x: (W - caja(l).width) / 2, y: altoS + sep + caja(n).height + salto }));
  return out;
}

export const PROPUESTAS = {
  a: {
    id: 'a', nombre: 'Nexo', subtitulo: 'Monograma editorial de lujo',
    color: { tinta: '#2A1826', acento: '#94774B', acentoTexto: '#7A5F36', fondoClaro: '#F1ECE3', fondoOscuro: '#2A1826', tintaOsc: '#F1ECE3', acentoOsc: '#BFA374', acentoTextoOsc: '#CDB58C', invFondo: '#94774B', invTinta: '#FFFFFF' , invAcento: '#2A1826' },
    horizontal: () => fila(simboloA(), 78, nombreA(34), lemaA(17), 30, 13),
    vertical: () => columna(simboloA(), 120, nombreA(27), lemaA(14.2), 26, 11),
    isotipo: () => simboloA(),
    cabecera: () => fila(simboloA({ fil: 4.8, hueco: 3.6, k: 10 }), 46, nombreA(19.5, { opsz: 6, wght: 500 }, .25), null, 14, 0),
    favicon: () => simboloA({ asta: 19, fil: 7.5, picos: false, X: 40, hueco: 6.5, brazoSup: 22, brazoMed: 16, brazoInf: 21, largo: 21, largoMed: 13 }),
  },
  b: {
    id: 'b', nombre: 'Hebras', subtitulo: 'Raíces, vínculos y crecimiento',
    color: { tinta: '#1D3128', acento: '#B5623D', acentoTexto: '#8A4628', fondoClaro: '#F3EEE4', fondoOscuro: '#1D3128', tintaOsc: '#F3EEE4', acentoOsc: '#D98A64', acentoTextoOsc: '#E2A98C', invFondo: '#B5623D', invTinta: '#FFFFFF', invAcento: '#1D3128' },
    horizontal: () => fila(simboloB(), 84, nombreB(46), lemaB(14.6), 26, 13),
    vertical: () => columna(simboloB(), 118, nombreB(38), lemaB(12.4), 24, 11),
    isotipo: () => simboloB(),
    cabecera: () => fila(simboloB({ g: 7.2 }), 46, nombreB(24.5), null, 13, 0),
    favicon: () => simboloB({ radios: [15, 37], g: 12, D: 52, acentoCentro: false, barrido: 300, barrido2: 285 }),
    favicon16: () => simboloB({ radios: [24], g: 17, D: 50, acentoCentro: false, barrido: 300, barrido2: 300 }),
  },
  c: {
    id: 'c', nombre: 'Rúbrica', subtitulo: 'Identidad tipográfica de autor',
    color: { tinta: '#1B1916', acento: '#B5301C', acentoTexto: '#B5301C', fondoClaro: '#F7F3EA', fondoOscuro: '#1B1916', tintaOsc: '#F7F3EA', acentoOsc: '#E2583F', acentoTextoOsc: '#F0836E', invFondo: '#B5301C', invTinta: '#FFFFFF', invAcento: '#1B1916' },
    horizontal: () => { const n = aOrigen(nombreC({ tam: 44 })); const l = aOrigen(lemaC(16)); const b = caja(n); return [...n, ...copia(l, { x: b.width - caja(l).width, y: b.height + 9 })]; },
    vertical: () => { const m = aOrigen(bloqueC()); const l = aOrigen(lemaC(15.5)); const b = caja(m); return [...m, ...copia(l, { x: b.width - caja(l).width, y: b.height + 12 })]; },
    isotipo: () => simboloC(),
    cabecera: () => nombreC({ tam: 25.5, gMin: 1.5 }),
    favicon: () => simboloC({ g: 8, gMin: 4, peso: 620, fin: 80, prof: 13 }),
    favicon16: () => simboloC({ peso: 520, cola: false }),
  },
};
