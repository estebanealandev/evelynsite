// Utilidades del generador: texto a trazos, booleanas y render. Todo es geometría vectorial real.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
export const paper = require('paper/dist/paper-core.js');
const fontkit = require('fontkit');
paper.setup(new paper.Size(2000, 2000));
export const AQUI = dirname(fileURLToPath(import.meta.url));

const cache = new Map();
function fuente(archivo, vars) {
  const k = archivo + JSON.stringify(vars ?? {});
  if (!cache.has(k)) {
    let f = fontkit.openSync(join(AQUI, 'fuentes', archivo));
    if (vars) f = f.getVariation(vars);
    cache.set(k, f);
  }
  return cache.get(k);
}

// Devuelve los glifos de un texto, cada uno como trazo independiente y ya posicionado.
export function glifos(archivo, vars, texto, { size = 100, tracking = 0, x = 0, y = 0, features } = {}) {
  const f = fuente(archivo, vars);
  const esc = size / f.unitsPerEm;
  const run = f.layout(texto, features);
  let cx = x;
  const salida = [];
  run.glyphs.forEach((g, i) => {
    const pos = run.positions[i];
    const d = g.path.toSVG();
    if (d) {
      const c = new paper.CompoundPath({ pathData: d, insert: false });
      c.scale(esc, -esc, new paper.Point(0, 0));
      c.translate(new paper.Point(cx + pos.xOffset * esc, y - pos.yOffset * esc));
      salida.push({ c, x: cx, adv: pos.xAdvance * esc, car: texto[i] });
    } else salida.push({ c: null, x: cx, adv: pos.xAdvance * esc, car: texto[i] });
    cx += pos.xAdvance * esc + tracking;
  });
  return { glifos: salida, ancho: cx - tracking - x };
}

export function texto(archivo, vars, cadena, op = {}) {
  const { glifos: g } = glifos(archivo, vars, cadena, op);
  return unir(g.filter(q => q.c).map(q => q.c));
}

// Une sin fusionar: conserva cada trazo con regla nonzero y se pasa después a una sola forma.
export function unir(items) {
  const c = new paper.CompoundPath({ insert: false });
  for (const it of items) {
    const hijos = it.children ? [...it.children] : [it];
    for (const h of hijos) c.addChild(h.clone({ insert: false }));
  }
  return c;
}

export function fusionar(items) {
  let r = items[0].clone({ insert: false });
  for (const it of items.slice(1)) r = r.unite(it, { insert: false });
  return r;
}

export const rect = (x, y, w, h) => new paper.Path.Rectangle({ point: [x, y], size: [w, h], insert: false });
export const circulo = (x, y, r) => new paper.Path.Circle({ center: [x, y], radius: r, insert: false });
export const trazoD = d => new paper.CompoundPath({ pathData: d, insert: false });

// Convierte una línea central en una forma de grosor variable.
export function ahusar(curvaD, g0, g1, { pasos = 64, curva = 1, puntaRedonda = false } = {}) {
  const base = new paper.Path({ pathData: curvaD, insert: false });
  const L = base.length, izq = [], der = [];
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos, s = Math.min(t * L, L - 1e-4);
    const p = base.getPointAt(s), n = base.getNormalAt(s);
    const g = (g0 + (g1 - g0) * Math.pow(t, curva)) / 2;
    izq.push(p.add(n.multiply(g))); der.push(p.subtract(n.multiply(g)));
  }
  const a = new paper.Path({ segments: izq, insert: false }); a.simplify(0.02);
  const b = new paper.Path({ segments: der.reverse(), insert: false }); b.simplify(0.02);
  const r = new paper.Path({ insert: false });
  r.addSegments(a.segments); r.addSegments(b.segments); r.closed = true;
  return r;
}

export const vistaD = item => item.pathData;
export const caja = item => item.bounds;
