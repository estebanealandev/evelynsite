// Arranca el sitio con cabeceras de seguridad, también para las páginas estáticas.
// Astro solo controla las respuestas dinámicas; estas cabeceras cubren todas.
import http from 'node:http';
import net from 'node:net';
import { readFileSync } from 'node:fs';
import { cabecerasSeguridad, esRecurso, HSTS } from '../src/lib/cabeceras.mjs';

process.env.ASTRO_NODE_AUTOSTART = 'disabled';
// DIST_DIR permite servir otra compilación (p. ej. la de prueba del widget Turnstile) sin tocar dist/.
const DIST = new URL(`../${process.env.DIST_DIR || 'dist'}/`, import.meta.url);
const { handler } = await import(new URL('server/entry.mjs', DIST).href);

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 4321);
const esHttps = (process.env.PUBLIC_SITE_URL || '').startsWith('https://') && process.env.PUBLIC_SITE_READY === 'true';

const cabeceras = { ...cabecerasSeguridad, ...(esHttps ? { 'Strict-Transport-Security': HSTS } : {}) };

// X-Robots-Tag igual a la meta robots compilada de cada página (lo escribe astro.config.mjs al compilar).
// Sin ese archivo se asume lo más restrictivo.
let robots = { indexable: false, rutas: {} };
try { robots = JSON.parse(readFileSync(new URL('robots-compilados.json', DIST), 'utf8')); } catch {}
const robotsDe = url => {
  if (!robots.indexable) return 'noindex, nofollow';
  const ruta = decodeURI(new URL(url, 'http://x').pathname).replace(/\/$/, '') || '/';
  const v = robots.rutas[ruta];
  return v?.includes('noindex') ? v : null;
};

const confiarEnProxy = process.env.TRUST_PROXY === 'true';

// Astro toma la IP de X-Forwarded-For. Aquí se deja solo el valor de confianza para que nadie pueda inventarlo.
function fijarDireccion(req) {
  const ultimo = confiarEnProxy ? req.headers['x-forwarded-for']?.split(',').pop()?.trim() : null;
  req.headers['x-forwarded-for'] = net.isIP(ultimo ?? '') ? ultimo : req.socket.remoteAddress ?? '';
  if (!confiarEnProxy) {
    delete req.headers['x-forwarded-host'];
    delete req.headers['x-forwarded-proto'];
    delete req.headers['x-forwarded-port'];
  }
}

const servidor = http.createServer({ connectionsCheckingInterval: 5000 }, (req, res) => {
  fijarDireccion(req);
  // Una sola URL por página: /ruta/ → /ruta con 301 (el canonical ya apunta a la versión sin barra).
  const [ruta, consulta] = (req.url ?? '/').split(/\?(.*)/s);
  if ((req.method === 'GET' || req.method === 'HEAD') && ruta.length > 1 && ruta.endsWith('/') && !ruta.startsWith('//')) {
    res.writeHead(301, { ...cabeceras, Location: ruta.replace(/\/+$/, '') + (consulta ? `?${consulta}` : ''), 'Cache-Control': 'no-store' });
    return res.end();
  }
  for (const [k, v] of Object.entries(cabeceras)) res.setHeader(k, v);
  if (!esRecurso(req.url)) res.setHeader('Cache-Control', 'no-store');
  const directiva = robotsDe(req.url);
  if (directiva) res.setHeader('X-Robots-Tag', directiva);
  handler(req, res);
});
servidor.maxConnections = 2000;
servidor.requestTimeout = 30_000;
servidor.headersTimeout = 15_000;
if (process.env.PUBLIC_SITE_READY === 'true' && process.env.MAIL_MODE !== 'smtp') {
  console.error('Aviso: el sitio está marcado como listo y el correo no está en modo smtp: el formulario no enviará nada.');
}
servidor.listen(PORT, HOST, () => console.log(`Sitio en http://${HOST}:${PORT}`));
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => servidor.close(() => process.exit(0)));
