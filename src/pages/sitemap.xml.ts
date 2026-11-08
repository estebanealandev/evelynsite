import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { slugify } from '../lib/format';

// Sitemap de las URL que serán indexables cuando se autorice el lanzamiento: canónicas, con estado 200 y sin noindex.
// Quedan fuera las confirmaciones del formulario, la 404, las etiquetas del blog y todo el contenido jurídico
// sin aprobación profesional (revisionProfesional: pendiente). Antes del lanzamiento existe para poder probarlo,
// pero robots.txt no lo anuncia y no se envía a ningún buscador.
//
// lastmod sale de fechas reales del contenido (actualizado o, en artículos, la fecha de publicación). Las páginas
// sin fecha registrada no lo llevan: es preferible omitirlo a declarar una fecha que no corresponde.
const INSTITUCIONALES = [
  '/', '/servicios', '/sobre-evelyn', '/blog', '/contacto', '/agendar-consulta',
  '/politica-de-privacidad', '/aviso-juridico', '/biblioteca-juridica', '/orientacion'
];

export const GET: APIRoute = async ({ site }) => {
  const aprobada = (e: { data: { revisionProfesional: string } }) => e.data.revisionProfesional === 'aprobada';
  const servicios = await getCollection('servicios');
  const articulos = await getCollection('articulos');
  const fichas = await getCollection('fichas');
  const entradas: { ruta: string; lastmod?: string }[] = [
    ...INSTITUCIONALES.map(ruta => ({ ruta })),
    // Igual que en blog/categoria/[slug].astro: solo las categorías con dos artículos o más.
    ...[...new Set(articulos.map(a => a.data.categoria))]
      .filter(c => articulos.filter(a => a.data.categoria === c).length >= 2)
      .map(c => ({ ruta: `/blog/categoria/${slugify(c)}` })),
    ...servicios.filter(aprobada).map(s => ({ ruta: `/servicios/${s.id}`, lastmod: s.data.actualizado })),
    ...fichas.filter(aprobada).map(f => ({ ruta: `/orientacion/${f.id}`, lastmod: f.data.actualizado })),
    ...articulos.filter(aprobada).map(a => ({ ruta: `/blog/${a.id}`, lastmod: a.data.actualizado ?? a.data.fecha }))
  ];
  const loc = (r: string) => (r === '/' ? new URL('/', site).href : new URL(r, site).href.replace(/\/$/, ''));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entradas
    .map(e => `  <url><loc>${loc(e.ruta)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`)
    .join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
