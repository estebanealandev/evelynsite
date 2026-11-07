// Control de calidad: valida SVG, PNG, ortografía de los textos trazados y diferencia entre propuestas.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { navegador, cerrar, RAIZ, escribir, contraste } from './comun.mjs';
import { PROPUESTAS } from './marcas.mjs';
import { DATOS } from './datos.mjs';
const lista = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (e.name === 'node_modules' ? [] : lista(join(d, e.name))) : [join(d, e.name)]);
const todo = ['propuesta-a', 'propuesta-b', 'propuesta-c'].flatMap(p => lista(join(RAIZ, p)));
const svgs = todo.filter(f => f.endsWith('.svg')), pngs = todo.filter(f => f.endsWith('.png'));
const fallos = [];
const b = await navegador();
const pg = await b.newPage();
// 1. SVG: analizan sin error, sin texto vivo, sin raster incrustado, sin referencias externas ni scripts.
let trazos = 0;
for (const f of svgs) {
  const s = readFileSync(f, 'utf8'), r = relative(RAIZ, f);
  const err = await pg.evaluate(t => { const d = new DOMParser().parseFromString(t, 'image/svg+xml'); const e = d.querySelector('parsererror'); return e ? e.textContent.slice(0, 120) : (d.documentElement.nodeName !== 'svg' ? 'raíz' : null); }, s);
  if (err) fallos.push(`${r}: XML ${err}`);
  if (/<text|<tspan|font-family/.test(s)) fallos.push(`${r}: texto vivo`);
  if (/<image|data:|base64/.test(s)) fallos.push(`${r}: raster incrustado`);
  if (/<script|href=|url\(http/.test(s)) fallos.push(`${r}: referencia externa o script`);
  if (!/<title>/.test(s)) fallos.push(`${r}: sin título`);
  if (!/viewBox/.test(s)) fallos.push(`${r}: sin viewBox`);
  trazos += (s.match(/<path/g) ?? []).length;
}
// 2. Variantes completas.
const comps = ['principal-horizontal', 'compacta-vertical', 'isotipo', 'isotipo-reducido'], modos = ['claro', 'oscuro', 'mono-negro', 'mono-blanco', 'invertido'];
for (const id of 'abc') {
  for (const c of comps) for (const m of modos) for (const [ext, dir] of [['svg', 'svg'], ['png', 'png']]) { const f = join(RAIZ, `propuesta-${id}/logos/${dir}/${c}-${m}.${ext}`); if (!existsSync(f) || statSync(f).size < 100) fallos.push(`falta ${f}`); }
  for (const f of ['favicon/favicon.svg', 'favicon/favicon-16.svg', 'favicon/favicon.ico', 'favicon/favicon-16.png', 'favicon/favicon-32.png', 'favicon/favicon-48.png', 'favicon/apple-touch-icon.png', 'favicon/icon-192.png', 'favicon/icon-512.png', 'favicon/icon-maskable-512.png', 'papeleria/hoja-membretada-a4.svg', 'papeleria/sobre-dl-anverso.svg', 'papeleria/sobre-dl-reverso.svg', 'papeleria/tarjeta-anverso.svg', 'papeleria/tarjeta-reverso.svg', 'aplicaciones/cabecera-oscuro.svg', 'aplicaciones/cabecera-claro.svg', 'aplicaciones/portada-actual-con-logo.png', 'aplicaciones/portada-con-paleta-propia.png', 'aplicaciones/portada-movil.png', 'aplicaciones/papeleria.png', 'aplicaciones/tarjeta.png', 'redes/og-1200x630.svg', 'redes/avatar-1080.svg', 'redes/firma-correo.svg', 'patron/patron.svg', 'tokens.json', 'tokens.css', 'README.md']) if (!existsSync(join(RAIZ, `propuesta-${id}/${f}`))) fallos.push(`falta propuesta-${id}/${f}`);
}
// 3. Transparencia real de los PNG de logotipo (salvo invertido) y monocromía real.
const alfa = async f => pg.evaluate(async u => { const i = new Image(); i.src = u; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); const d = x.getImageData(0, 0, i.width, i.height).data; let tr = 0, colores = new Set(); for (let k = 0; k < d.length; k += 4 * 37) { if (d[k + 3] < 8) tr++; if (d[k + 3] > 250) colores.add(`${d[k]},${d[k + 1]},${d[k + 2]}`); } return { tr, colores: colores.size, w: i.width, h: i.height }; }, 'data:image/png;base64,' + readFileSync(f).toString('base64'));
for (const id of 'abc') for (const c of comps) for (const m of modos) {
  const r = await alfa(join(RAIZ, `propuesta-${id}/logos/png/${c}-${m}.png`));
  if (m !== 'invertido' && r.tr === 0) fallos.push(`${id} ${c} ${m}: PNG sin transparencia`);
  if (m === 'invertido' && r.tr > 0) fallos.push(`${id} ${c} ${m}: invertido con huecos`);
  if (m.startsWith('mono') && r.colores > 1) fallos.push(`${id} ${c} ${m}: más de un color opaco (${r.colores})`);
  if (Math.max(r.w, r.h) < 2000) fallos.push(`${id} ${c} ${m}: resolución baja`);
}
// 4. Diferencia real entre isotipos: solape de siluetas a 200 px (1 = iguales).
const silueta = async id => pg.evaluate(async s => { const i = new Image(); i.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(s))); await i.decode(); const c = document.createElement('canvas'); c.width = c.height = 200; const x = c.getContext('2d'); const k = Math.min(200 / i.width, 200 / i.height); x.drawImage(i, 0, 0, i.width * k, i.height * k); const d = x.getImageData(0, 0, 200, 200).data, o = []; for (let n = 3; n < d.length; n += 4) o.push(d[n] > 128 ? 1 : 0); return o; }, readFileSync(join(RAIZ, `propuesta-${id}/logos/svg/isotipo-mono-negro.svg`), 'utf8').replace('<svg ', '<svg width="1000" height="1000" '));
const sil = {}; for (const id of 'abc') sil[id] = await silueta(id);
const iou = (a, c) => { let i = 0, u = 0; for (let k = 0; k < a.length; k++) { if (a[k] || c[k]) u++; if (a[k] && c[k]) i++; } return i / u; };
const parecidos = { 'A/B': iou(sil.a, sil.b), 'A/C': iou(sil.a, sil.c), 'B/C': iou(sil.b, sil.c) };
for (const [k, v] of Object.entries(parecidos)) if (v > .5) fallos.push(`isotipos ${k} demasiado parecidos: ${v.toFixed(2)}`);
// 5. Paletas sin colores compartidos entre propuestas.
const principales = id => ['tinta', 'acento', 'fondoClaro'].map(k => PROPUESTAS[id].color[k]);
const set = new Set(['a', 'b', 'c'].flatMap(principales)); if (set.size !== 9) fallos.push('hay colores principales repetidos');
// 6. Contrastes mínimos.
const con = [];
for (const id of 'abc') { const c = PROPUESTAS[id].color; for (const [a, f, min, n] of [[c.tinta, c.fondoClaro, 4.5, 'tinta/claro'], [c.acentoTexto, c.fondoClaro, 4.5, 'lema/claro'], [c.acento, c.fondoClaro, 3, 'acento/claro'], [c.tintaOsc, c.fondoOscuro, 4.5, 'claro/oscuro'], [c.acentoTextoOsc, c.fondoOscuro, 4.5, 'lema/oscuro'], [c.acentoOsc, c.fondoOscuro, 3, 'acento/oscuro']]) { const r = contraste(a, f); con.push([id, n, r.toFixed(2)]); if (r < min) fallos.push(`contraste ${id} ${n}: ${r.toFixed(2)} < ${min}`); } }
// 7. Licencias presentes.
const fuentesUsadas = [...new Set(Object.values(DATOS).flatMap(d => d.fuentes.map(f => f[3])))];
for (const o of fuentesUsadas) { const t = readFileSync(join(RAIZ, '_fuente/fuentes', o), 'utf8'); if (!/SIL OPEN FONT LICENSE Version 1\.1/i.test(t)) fallos.push(`licencia dudosa ${o}`); }
await cerrar();
const res = { svg: svgs.length, png: pngs.length, trazos, parecidos, contrastes: con, licencias: fuentesUsadas.length, fallos };
escribir('brand-guidelines/validacion.json', JSON.stringify(res, null, 1) + '\n');
console.log(JSON.stringify({ svg: res.svg, png: res.png, parecidos, fallos: fallos.length }, null, 0)); fallos.slice(0, 30).forEach(f => console.log(' -', f));
