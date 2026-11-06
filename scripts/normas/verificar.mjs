// Comprueba la matriz jurídica contra las copias oficiales y contra el contenido publicado.
// Uso: node scripts/normas/verificar.mjs [--archivo <fragmento de ruta>] [--unir]
import fs from 'node:fs';
import path from 'node:path';
import { parse as leerYaml } from 'yaml';
import { catalogo, DIR_NORMAS } from './catalogo.mjs';
import { articulos, leer, normalizar } from './texto.mjs';

const args = process.argv.slice(2);
const filtro = args.includes('--archivo') ? args[args.indexOf('--archivo') + 1] : null;
const DIR_MATRIZ = 'docs/auditoria-evelyn/matriz';
const ESTADOS = ['VERIFICADA', 'REQUIERE_CORRECCION', 'SIN_RESPALDO', 'NO_VERIFICABLE', 'HISTORICA'];
const PUBLICABLES = ['VERIFICADA', 'HISTORICA'];
export const PROHIBIDAS = ['acompañamos en cada paso', 'acompañarte en cada paso', 'cada familia es única', 'soluciones legales a tu medida', 'soluciones a tu medida', 'nuestro compromiso es', 'protegemos lo que más importa', 'atención integral', 'soluciones integrales', 'velar por tus derechos', 'estamos aquí para', 'cada caso es distinto', 'cada caso es único', 'más que un trámite', 'brindamos', 'nuestro equipo', 'le acompañamos', 'te acompañamos'];

const errores = [];
const avisos = [];
const arts = Object.fromEntries(Object.keys(catalogo).map(k => [k, articulos(leer(k))]));
const fuentesTexto = { };

function fuenteDe(archivo) {
  if (!(archivo in fuentesTexto)) fuentesTexto[archivo] = fs.existsSync(archivo) ? normalizar(fs.readFileSync(archivo, 'utf8')) : null;
  return fuentesTexto[archivo];
}

const fragmentos = fs.existsSync(DIR_MATRIZ) ? fs.readdirSync(DIR_MATRIZ).filter(f => f.endsWith('.json')) : [];
const todas = [];
for (const f of fragmentos) {
  let lista;
  try { lista = JSON.parse(fs.readFileSync(path.join(DIR_MATRIZ, f), 'utf8')); }
  catch (e) { errores.push(`${f}: JSON inválido: ${e.message}`); continue; }
  for (const c of lista) todas.push({ ...c, _f: f });
}
const ids = new Set();
const vigentes = todas.filter(c => !filtro || (c.archivo || '').includes(filtro));
for (const c of todas) {
  if (ids.has(c.id)) errores.push(`${c.id}: identificador repetido`);
  ids.add(c.id);
}
for (const c of vigentes) {
  const yo = c.id || `(sin id en ${c._f})`;
  for (const campo of ['id', 'archivo', 'pagina', 'tema', 'texto', 'tipo', 'estado', 'consultado']) if (!c[campo]) errores.push(`${yo}: falta ${campo}`);
  if (!ESTADOS.includes(c.estado)) errores.push(`${yo}: estado no válido: ${c.estado}`);
  if (c.retirada) { if (!c.motivo) errores.push(`${yo}: retirada sin motivo`); continue; }
  const fuente = fuenteDe(c.archivo);
  if (fuente === null) errores.push(`${yo}: no existe ${c.archivo}`);
  else if (!fuente.includes(normalizar(c.texto))) errores.push(`${yo}: el texto no aparece en ${c.archivo}: «${c.texto.slice(0, 70)}»`);
  if (!PUBLICABLES.includes(c.estado)) errores.push(`${yo}: publicada con estado ${c.estado}`);
  const respaldos = c.respaldos || [];
  if (!respaldos.length && !c.fuenteExterna) errores.push(`${yo}: sin respaldo`);
  for (const r of respaldos) {
    if (!catalogo[r.norma]) { errores.push(`${yo}: norma desconocida ${r.norma}`); continue; }
    const conjunto = (r.articulos || []).map(a => String(a).toLowerCase());
    if (!conjunto.length) errores.push(`${yo}: respaldo de ${r.norma} sin artículos`);
    const textos = [];
    for (const a of conjunto) {
      if (arts[r.norma][a]) textos.push(arts[r.norma][a]);
      else errores.push(`${yo}: ${r.norma} art. ${a} no existe en la copia oficial`);
    }
    if (!r.cita) errores.push(`${yo}: respaldo de ${r.norma} sin cita literal`);
    else if (r.cita.length > 320) errores.push(`${yo}: la cita pasa de 320 caracteres`);
    else if (textos.length && !normalizar(textos.join(' ')).includes(normalizar(r.cita))) errores.push(`${yo}: la cita no aparece en ${r.norma} arts. ${conjunto.join(', ')}: «${r.cita.slice(0, 70)}»`);
  }
  if (c.fuenteExterna && !/^https:\/\//.test(c.fuenteExterna.url || '')) errores.push(`${yo}: fuente externa sin URL https`);
}

// Contenido: YAML válido, artículos citados que existen, cobertura en la matriz y frases prohibidas.
const contenido = [];
for (const col of ['servicios', 'articulos', 'fichas']) {
  const d = `src/content/${col}`;
  if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) contenido.push(path.join(d, f));
}
const paginas = [...contenido, ...['index', 'sobre-evelyn', 'aviso-juridico', 'politica-de-privacidad', 'contacto', 'agendar-consulta', 'servicios/index', 'blog/index', 'biblioteca-juridica'].map(p => `src/pages/${p}.astro`).filter(fs.existsSync), 'src/lib/institucional.ts', 'src/lib/orientador.ts'];
for (const archivo of paginas) {
  if (filtro && !archivo.includes(filtro)) continue;
  const bruto = fs.readFileSync(archivo, 'utf8');
  const bajo = bruto.toLowerCase();
  for (const p of PROHIBIDAS) if (bajo.includes(p)) errores.push(`${archivo}: frase prohibida «${p}»`);
  if (archivo.endsWith('.md')) {
    const fm = bruto.match(/^---\n([\s\S]*?)\n---/);
    let datos = null;
    try { datos = leerYaml(fm[1]); } catch (e) { errores.push(`${archivo}: YAML inválido: ${e.message.split('\n')[0]}`); }
    for (const f of datos?.fuentes || []) {
      if (!catalogo[f.ref]) continue;
      for (const a of expandir(f.detalle)) if (!arts[f.ref][a]) errores.push(`${archivo}: ${f.ref} art. ${a} citado en fuentes no existe`);
    }
    const propias = todas.filter(c => c.archivo === archivo && !c.retirada);
    if (!propias.length) errores.push(`${archivo}: sin afirmaciones registradas en la matriz`);
    const cubiertos = new Set(propias.flatMap(c => (c.respaldos || []).flatMap(r => (r.articulos || []).map(a => String(a).toLowerCase()))));
    const citados = new Set();
    const cuerpo = bruto.replace(/^fuentes:[\s\S]*?(?=^\w|^---)/m, '');
    for (const m of cuerpo.matchAll(/art[íi]culos?\s+([\d][\d\s,y a\)\(bister]*)/gi)) for (const a of expandir(m[1])) citados.add(a);
    for (const a of citados) if (!cubiertos.has(a)) avisos.push(`${archivo}: el artículo ${a} se menciona y no tiene respaldo en la matriz`);
  }
}

function expandir(detalle) {
  const salida = [];
  const limpio = detalle.replace(/incisos?\s+\S+/gi, ' ').replace(/arts?\.?/gi, ' ').replace(/transitorios?[^,;]*/gi, ' ');
  for (const m of limpio.matchAll(/(\d+)\s*(bis|ter)?\s*(?:a\s+(\d+))?/gi)) {
    if (m[3]) { for (let i = +m[1]; i <= +m[3] && +m[3] - +m[1] < 200; i++) salida.push(String(i)); }
    else salida.push([m[1], (m[2] || '').toLowerCase()].filter(Boolean).join(' '));
  }
  return salida;
}

if (args.includes('--unir')) {
  const limpias = todas.map(({ _f, ...c }) => c);
  const reg = JSON.parse(fs.readFileSync(path.join(DIR_NORMAS, 'registro.json'), 'utf8'));
  const resumen = Object.fromEntries(ESTADOS.map(e => [e, limpias.filter(c => c.estado === e).length]));
  fs.writeFileSync('docs/auditoria-evelyn/matriz-juridica.json', `${JSON.stringify({ generado: reg.consultado, total: limpias.length, publicadas: limpias.filter(c => !c.retirada).length, retiradas: limpias.filter(c => c.retirada).length, resumen, afirmaciones: limpias }, null, 1)}\n`);
}

console.log(`Afirmaciones revisadas: ${vigentes.length} de ${todas.length}. Errores: ${errores.length}. Avisos: ${avisos.length}.`);
for (const e of errores.slice(0, 200)) console.log(`ERROR  ${e}`);
for (const a of avisos.slice(0, 200)) console.log(`AVISO  ${a}`);
process.exit(errores.length ? 1 : 0);
