// Cabeceras de seguridad en las respuestas generadas al pedirlas (formulario y páginas no encontradas).
// Las páginas estáticas las reciben del servidor Node o, en Cloudflare, del archivo _headers.
import { defineMiddleware } from 'astro:middleware';
import { cabecerasSeguridad, esRecurso, HSTS } from './lib/cabeceras.mjs';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const r = await next();
  if (ctx.isPrerendered) return r;
  // Algunas respuestas llegan con cabeceras inmutables: se copian en una nueva.
  const res = new Response(r.body, r);
  for (const [k, v] of Object.entries(cabecerasSeguridad)) if (!res.headers.has(k)) res.headers.set(k, v);
  if (ctx.url.protocol === 'https:' && ctx.url.hostname !== 'localhost') res.headers.set('Strict-Transport-Security', HSTS);
  if (!esRecurso(ctx.url.pathname) && !res.headers.has('cache-control')) res.headers.set('Cache-Control', 'no-store');
  // Lo que genera el Worker (formulario, errores) nunca es indexable.
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
});
