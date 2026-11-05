import type { APIRoute } from 'astro';
import { site as cfg } from '../config/site';

export const GET: APIRoute = ({ site }) => {
  const reglas = cfg.indexable
    ? `User-agent: *\nDisallow: /api/\nSitemap: ${new URL('/sitemap.xml', site).href}\n`
    : `# Sitio pendiente de publicación: activar PUBLIC_SITE_READY=true al completar las revisiones.\nUser-agent: *\nDisallow: /\n`;
  return new Response(reglas, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
