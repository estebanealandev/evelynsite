// Arranca el sitio con cabeceras de seguridad, también para las páginas estáticas.
// Astro solo controla las respuestas dinámicas; estas cabeceras cubren todas.
import http from 'node:http';

process.env.ASTRO_NODE_AUTOSTART = 'disabled';
const { handler } = await import('../dist/server/entry.mjs');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 4321);
const esHttps = (process.env.PUBLIC_SITE_URL || '').startsWith('https://') && process.env.PUBLIC_SITE_READY === 'true';

const cabeceras = {
  // Las directivas `frame-ancestors` y similares no funcionan en la etiqueta meta de cada página.
  'Content-Security-Policy': "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  ...(esHttps ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' } : {})
};

const servidor = http.createServer((req, res) => {
  for (const [k, v] of Object.entries(cabeceras)) res.setHeader(k, v);
  handler(req, res);
});
servidor.requestTimeout = 30_000;
servidor.headersTimeout = 15_000;
servidor.listen(PORT, HOST, () => console.log(`Sitio en http://${HOST}:${PORT}`));
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => servidor.close(() => process.exit(0)));
