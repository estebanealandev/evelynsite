import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { slugify } from '../lib/format';

export const GET: APIRoute = async ({ site }) => {
  const servicios = await getCollection('servicios');
  const articulos = await getCollection('articulos');
  const cats = [...new Set(articulos.map(a => a.data.categoria))];
  const tags = [...new Set(articulos.flatMap(a => a.data.etiquetas))];
  const rutas = [
    '/', '/servicios', '/sobre-evelyn', '/blog', '/contacto', '/agendar-consulta', '/politica-de-privacidad', '/aviso-juridico',
    ...servicios.map(s => `/servicios/${s.id}`),
    ...articulos.map(a => `/blog/${a.id}`),
    ...cats.map(c => `/blog/categoria/${slugify(c)}`),
    ...tags.map(t => `/blog/etiqueta/${slugify(t)}`)
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rutas
    .map(r => `  <url><loc>${new URL(r, site).href.replace(/\/$/, r === '/' ? '/' : '')}</loc></url>`)
    .join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
