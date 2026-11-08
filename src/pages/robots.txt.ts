import type { APIRoute } from 'astro';
import { site as cfg } from '../config/site';
import { generarRobots } from '../lib/seo/robots.mjs';

export const GET: APIRoute = ({ site }) =>
  new Response(generarRobots({ indexable: cfg.indexable, sitemap: new URL('/sitemap.xml', site).href }), {
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
