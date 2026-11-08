// Auditoría SEO de la compilación (dist/client). Uso: npm run seo:auditar [-- --informe docs/seo/inventario-rutas.md]
// Recorre el HTML generado, rastrea los enlaces internos desde la portada y comprueba metadatos, canonical,
// robots, JSON-LD, sitemap, enlaces rotos, recursos externos y textos residuales. Sale con código 1 si hay
// errores críticos. No hace peticiones a la red.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const raiz = new URL('../../', import.meta.url).pathname;
const cliente = join(raiz, 'dist/client');
if (!existsSync(cliente)) { console.error('Falta dist/client: ejecute npm run build o npm run build:cf.'); process.exit(2); }
const compilado = JSON.parse(readFileSync(join(raiz, 'dist/robots-compilados.json'), 'utf8'));
const archivoInforme = process.argv.includes('--informe') ? process.argv[process.argv.indexOf('--informe') + 1] : null;

const criticos = [];
const avisos = [];
const archivos = readdirSync(cliente, { recursive: true }).map(String);
const rutaDe = f => ('/' + f.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '')).replace(/\/$/, '') || '/';
const paginas = new Map();
const recursos = new Set(archivos.filter(f => !f.endsWith('.html')).map(f => '/' + f));

// Las rutas que nunca se indexan, aunque se autorice el lanzamiento.
const EXCLUIDAS = [/^\/404$/, /^\/consulta-(recibida|no-enviada)$/, /^\/blog\/etiqueta\//];
// Textos de la plantilla original o de relleno que no deben quedar en el sitio.
const RESIDUALES = /California|Emily Rubenstein|rubensteinlaw|lorem ipsum|example\.com/i;
const PENDIENTES_DE_CODIGO = /\bTODO\b|FIXME|XXX\b/; // en mayúsculas: «todo» es una palabra corriente

const revisionDe = ruta => {
  const m = ruta.match(/^\/(servicios|blog|orientacion)\/([^/]+)$/);
  if (!m) return null;
  const carpeta = { servicios: 'servicios', blog: 'articulos', orientacion: 'fichas' }[m[1]];
  const f = join(raiz, 'src/content', carpeta, `${m[2]}.md`);
  return existsSync(f) ? (readFileSync(f, 'utf8').match(/^revisionProfesional:\s*"?(\w+)/m)?.[1] ?? 'pendiente') : null;
};
const attr = (tag, nombre) => tag.match(new RegExp(`\\s${nombre}="([^"]*)"`))?.[1] ?? null;
const sinEntidades = s => s?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

for (const f of archivos.filter(f => f.endsWith('.html'))) {
  const html = readFileSync(join(cliente, f), 'utf8');
  const ruta = rutaDe(f);
  const metas = [...html.matchAll(/<meta\s[^>]*>/g)].map(m => m[0]);
  const meta = n => sinEntidades(attr(metas.find(t => attr(t, 'name') === n || attr(t, 'property') === n) ?? '', 'content'));
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  paginas.set(ruta, {
    ruta,
    archivo: f,
    html,
    visible,
    title: sinEntidades(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? null),
    description: meta('description'),
    robots: meta('robots'),
    ogImage: meta('og:image'),
    canonical: html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? null,
    lang: html.match(/<html lang="([^"]+)"/)?.[1] ?? null,
    h1: (html.match(/<h1[\s>]/g) ?? []).length,
    ld,
    enlaces: [...visible.matchAll(/<a\s[^>]*href="([^"]+)"/g)].map(m => m[1]),
    srcs: [...html.matchAll(/\s(?:src|href)="([^"]+)"/g)].map(m => m[1]).filter(u => !u.startsWith('#')),
    imgs: [...visible.matchAll(/<img\s[^>]*>/g)].map(m => m[0])
  });
}

const sitioBase = (() => { try { return new URL(paginas.get('/').canonical).origin; } catch { return null; } })();
const interna = u => u.startsWith('/') && !u.startsWith('//') ? u : sitioBase && u.startsWith(sitioBase) ? u.slice(sitioBase.length) || '/' : null;
const normal = u => decodeURI(u.split('#')[0].split('?')[0]).replace(/(.)\/$/, '$1');
const existe = u => paginas.has(normal(u)) || recursos.has(normal(u)) || normal(u).startsWith('/api/');

// Rastreo desde la portada: profundidad de clic y enlaces entrantes.
const profundidad = new Map([['/', 0]]);
const entrantes = new Map();
const cola = ['/'];
while (cola.length) {
  const r = cola.shift();
  for (const e of new Set((paginas.get(r)?.enlaces ?? []).map(interna).filter(Boolean).map(normal))) {
    entrantes.set(e, (entrantes.get(e) ?? 0) + 1);
    if (paginas.has(e) && !profundidad.has(e)) { profundidad.set(e, profundidad.get(r) + 1); cola.push(e); }
  }
}

const titulos = new Map();
const descripciones = new Map();
for (const p of paginas.values()) {
  const excluida = EXCLUIDAS.some(x => x.test(p.ruta));
  const err = m => criticos.push(`${p.ruta}: ${m}`);
  const avi = m => avisos.push(`${p.ruta}: ${m}`);
  if (!p.title) err('sin <title>');
  if (!p.description) err('sin meta description');
  if (p.lang !== 'es-CR') err(`lang="${p.lang}"`);
  if (p.h1 !== 1) err(`${p.h1} elementos h1`);
  if (!p.robots) err('sin meta robots');
  if (!compilado.indexable && !/noindex/.test(p.robots ?? '')) err('indexable sin lanzamiento autorizado');
  if (compilado.rutas[p.ruta] !== undefined && compilado.rutas[p.ruta] !== p.robots) err('la directiva compilada no coincide con la meta robots');
  if (!p.ogImage) err('sin og:image');
  else if (!existe(interna(p.ogImage) ?? '/')) err(`og:image inexistente ${p.ogImage}`);
  if (!p.canonical || !/^https?:\/\//.test(p.canonical)) err('canonical ausente o relativo');
  else if (new URL(p.canonical).pathname !== (p.ruta === '/404' ? '/404' : p.ruta)) err(`canonical ${p.canonical} no es autorreferencial`);
  if (!excluida) {
    if (p.title) titulos.set(p.title, [...(titulos.get(p.title) ?? []), p.ruta]);
    if (p.description) descripciones.set(p.description, [...(descripciones.get(p.description) ?? []), p.ruta]);
    if (p.title && p.title.length > 70) avi(`title de ${p.title.length} caracteres (puede truncarse)`);
    if (p.description && (p.description.length < 70 || p.description.length > 165)) avi(`description de ${p.description.length} caracteres`);
    if (!profundidad.has(p.ruta)) avi('huérfana: no se llega desde la portada por enlaces');
  }
  for (const re of [RESIDUALES, PENDIENTES_DE_CODIGO]) if (re.test(p.visible)) err(`texto residual: «${p.visible.match(re)[0]}»`);
  for (const u of p.srcs) {
    if (/^https?:\/\//.test(u) && !interna(u) && /<(script|link|img|iframe)[^>]+(src|href)="/.test(p.html.slice(Math.max(0, p.html.indexOf(u) - 200), p.html.indexOf(u)))) {
      const tag = p.html.slice(p.html.lastIndexOf('<', p.html.indexOf(u)), p.html.indexOf(u));
      if (!/^<a\s/.test(tag) && !/rel="canonical"|property=/.test(tag)) err(`recurso externo ${u}`);
    }
    const i = interna(u);
    if (i && !existe(i)) err(`enlace o recurso roto ${u}`);
  }
  for (const img of p.imgs) {
    if (attr(img, 'alt') === null) err(`imagen sin alt: ${attr(img, 'src')}`);
    if (!attr(img, 'width') || !attr(img, 'height')) avi(`imagen sin dimensiones: ${attr(img, 'src')}`);
  }
  // JSON-LD: un único grafo, @id únicos, referencias resueltas y sin propiedades prohibidas.
  if (p.ld.length !== 1) err(`${p.ld.length} bloques JSON-LD (se espera un grafo)`);
  for (const bloque of p.ld) {
    let datos;
    try { datos = JSON.parse(bloque); } catch (e) { err(`JSON-LD inválido: ${e.message}`); continue; }
    const nodos = datos['@graph'] ?? [datos];
    const ids = nodos.map(n => n['@id']).filter(Boolean);
    if (new Set(ids).size !== ids.length) err('JSON-LD con @id duplicados');
    const texto = JSON.stringify(datos);
    for (const ref of texto.matchAll(/\{"@id":"([^"]+)"\}/g)) if (!ids.includes(ref[1])) err(`JSON-LD referencia ${ref[1]} sin definir`);
    for (const prohibida of ['aggregateRating', 'review', 'award', 'FAQPage']) if (texto.includes(`"${prohibida}"`)) err(`JSON-LD declara ${prohibida}`);
    const pagina = nodos.find(n => n['@id']?.endsWith('#webpage'));
    if (!pagina) err('JSON-LD sin nodo WebPage');
    else if (pagina.url !== p.canonical) err('el WebPage del JSON-LD no coincide con el canonical');
    p.tipos = nodos.map(n => n['@type']).join(', ');
    p.tipoPagina = pagina?.['@type'];
  }
}
for (const [t, rs] of titulos) if (rs.length > 1) criticos.push(`title duplicado «${t}»: ${rs.join(', ')}`);
for (const [d, rs] of descripciones) if (rs.length > 1) criticos.push(`description duplicada en ${rs.join(', ')}`);

// Sitemap: solo URL canónicas, existentes, elegibles e iguales a su canonical.
const sitemapXml = readFileSync(join(cliente, 'sitemap.xml'), 'utf8');
const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const hoy = new Date().toISOString().slice(0, 10);
for (const m of sitemapXml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) if (m[1] > hoy) criticos.push(`sitemap: lastmod futuro ${m[1]}`);
if (new Set(locs).size !== locs.length) criticos.push('sitemap: URL repetidas');
for (const loc of locs) {
  const ruta = normal(new URL(loc).pathname);
  const p = paginas.get(ruta);
  if (!p) criticos.push(`sitemap: ${loc} no corresponde a una página`);
  else if (p.canonical !== loc) criticos.push(`sitemap: ${loc} difiere de su canonical ${p.canonical}`);
  if (EXCLUIDAS.some(x => x.test(ruta))) criticos.push(`sitemap: incluye la ruta excluida ${ruta}`);
  if (revisionDe(ruta) === 'pendiente') criticos.push(`sitemap: incluye contenido sin aprobación ${ruta}`);
}

// Recursos pesados.
for (const f of archivos) {
  const t = statSync(join(cliente, f)).size;
  if (/\.(webp|jpe?g|png|avif)$/.test(f) && t > 400_000) avisos.push(`imagen pesada ${f} (${Math.round(t / 1024)} KB)`);
  if (/\.js$/.test(f) && t > 150_000) avisos.push(`JavaScript pesado ${f} (${Math.round(t / 1024)} KB)`);
}

// El sitemap lista lo que será indexable al lanzar; lo demás queda fuera por exclusión o por falta de aprobación.
const enSitemap = ruta => locs.some(l => normal(new URL(l).pathname) === ruta);
const estado = p => {
  if (enSitemap(p.ruta)) return 'Indexable al autorizar el lanzamiento';
  if (revisionDe(p.ruta) === 'pendiente') return 'noindex hasta aprobación jurídica';
  return 'Excluida (noindex permanente)';
};
const filas = [...paginas.values()].sort((a, b) => a.ruta.localeCompare(b.ruta));
if (archivoInforme) {
  const cel = s => String(s ?? '—').replace(/\|/g, '\\|');
  const md = [
    '# Inventario de rutas (generado)',
    '',
    `Generado por \`npm run seo:auditar\` el ${hoy} sobre la compilación en \`dist/\` (entorno: ${compilado.entorno}, indexable: ${compilado.indexable}).`,
    'No se edita a mano: se regenera tras cada cambio de contenido.',
    '',
    `Páginas: ${filas.length} · En el sitemap: ${locs.length} · Críticos: ${criticos.length} · Avisos: ${avisos.length}`,
    '',
    '| Ruta | Tipo | Title | Desc. | H1 | Robots (hoy) | Schema | Prof. | Entrantes | Revisión jurídica | Indexación prevista | Sitemap |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|',
    ...filas.map(p => `| \`${p.ruta}\` | ${cel(p.tipoPagina)} | ${cel(p.title)} | ${p.description?.length ?? 0} | ${p.h1} | ${cel(p.robots)} | ${cel(p.tipos)} | ${profundidad.get(p.ruta) ?? 'huérfana'} | ${entrantes.get(p.ruta) ?? 0} | ${revisionDe(p.ruta) ?? 'n/a (aprobación global)'} | ${estado(p)} | ${enSitemap(p.ruta) ? 'sí' : 'no'} |`),
    '',
    '## Avisos',
    '',
    ...(avisos.length ? avisos.map(a => `- ${a}`) : ['Ninguno.']),
    ''
  ].join('\n');
  writeFileSync(join(raiz, archivoInforme), md);
}

console.log(`Páginas: ${paginas.size} · sitemap: ${locs.length} URL · indexable: ${compilado.indexable} (${compilado.entorno})`);
for (const a of avisos) console.log(`  aviso   ${a}`);
for (const c of criticos) console.log(`  CRÍTICO ${c}`);
console.log(criticos.length ? `\n${criticos.length} errores críticos.` : '\nSin errores críticos.');
process.exit(criticos.length ? 1 : 0);
