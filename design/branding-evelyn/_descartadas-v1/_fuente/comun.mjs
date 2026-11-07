// Salida común: SVG optimizado, PNG con Chrome, ICO y colores por modo.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { optimize } from 'svgo';
import { caja, copia } from './marcas.mjs';
import { AQUI } from './lib.mjs';
const require = createRequire('/home/esteban/Escritorio/evelynsite/package.json');
export const { chromium } = require('@playwright/test');
export const RAIZ = join(AQUI, '..');
export const NOMBRE = 'Evelyn Elizondo, Derecho de Familia, Costa Rica';

export const MODOS = c => ({
  claro: { tinta: c.tinta, acento: c.acento, acentoTexto: c.acentoTexto },
  oscuro: { tinta: c.tintaOsc, acento: c.acentoOsc, acentoTexto: c.acentoTextoOsc },
  'mono-negro': { tinta: '#000000', acento: '#000000', acentoTexto: '#000000' },
  'mono-blanco': { tinta: '#FFFFFF', acento: '#FFFFFF', acentoTexto: '#FFFFFF' },
  invertido: { tinta: c.fondoClaro, acento: c.fondoClaro, acentoTexto: c.fondoClaro, fondo: c.fondoOscuro },
});
export const escribir = (ruta, contenido) => { const r = join(RAIZ, ruta); mkdirSync(dirname(r), { recursive: true }); writeFileSync(r, contenido); return r; };

// Agrupa por color para que el SVG tenga un trazo por tinta.
export function paths(partes, col) {
  const grupos = new Map();
  for (const p of partes) { const k = col[p.rol] ?? col.tinta; grupos.set(k, (grupos.get(k) ?? '') + p.i.pathData); }
  return [...grupos].map(([fill, d]) => `<path fill="${fill}" d="${d}"/>`).join('');
}
export const optimo = svg => optimize(svg, { multipass: true, floatPrecision: 2, plugins: [{ name: 'preset-default', params: { overrides: { cleanupIds: false, mergePaths: false } } }, 'removeDimensions'] }).data;

// Normaliza al lado mayor indicado y devuelve el SVG final.
export function logoSVG(partes, col, { titulo = NOMBRE, lado = 1000, pad = 0, fondo } = {}) {
  const b0 = caja(partes), e = lado / Math.max(b0.width, b0.height);
  const q = copia(partes, { e, x: -b0.left * e, y: -b0.top * e }), b = caja(q);
  const m = pad * Math.max(b.width, b.height);
  const W = b.width + 2 * m, H = b.height + 2 * m;
  const fig = copia(q, { x: m - b.left, y: m - b.top });
  const rec = fondo ? `<rect width="${W.toFixed(2)}" height="${H.toFixed(2)}" fill="${fondo}"/>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(2)} ${H.toFixed(2)}" role="img"><title>${titulo}</title>${rec}${paths(fig, col)}</svg>`;
  return { svg: optimo(svg), W, H };
}

let nav;
export const navegador = async () => (nav ??= await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }));
export const cerrar = async () => { if (nav) await nav.close(); };
export async function png(svg, W, H, salida, { lado } = {}) {
  const b = await navegador(); const e = lado ? lado / Math.max(W, H) : 1;
  const w = Math.round(W * e), h = Math.round(H * e);
  const pag = await b.newPage({ viewport: { width: Math.max(w, 1), height: Math.max(h, 1) } });
  await pag.setContent(`<!doctype html><html style="background:transparent"><body style="margin:0;background:transparent;line-height:0">${svg.replace('<svg ', `<svg width="${w}" height="${h}" `)}</body></html>`);
  const buf = await pag.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  await pag.close();
  const r = join(RAIZ, salida); mkdirSync(dirname(r), { recursive: true }); writeFileSync(r, buf); return buf;
}
export function ico(entradas) { // entradas: [{ tam, buf }]
  const cab = Buffer.alloc(6 + 16 * entradas.length); cab.writeUInt16LE(1, 2); cab.writeUInt16LE(entradas.length, 4);
  let off = cab.length; entradas.forEach((e, i) => { const p = 6 + 16 * i; cab[p] = e.tam % 256; cab[p + 1] = e.tam % 256; cab.writeUInt16LE(1, p + 4); cab.writeUInt16LE(32, p + 6); cab.writeUInt32LE(e.buf.length, p + 8); cab.writeUInt32LE(off, p + 12); off += e.buf.length; });
  return Buffer.concat([cab, ...entradas.map(e => e.buf)]);
}
export const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
export const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
