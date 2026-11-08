import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import cloudflare from '@astrojs/cloudflare';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { cabecerasSeguridad, HSTS } from './src/lib/cabeceras.mjs';

// `astro build` no carga .env en process.env: sin esto, un sitio publicado saldría con canonical en localhost.
const env = { ...loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), ''), ...process.env };
const siteUrl = new URL(env.PUBLIC_SITE_URL || 'http://localhost:4321');
const listo = env.PUBLIC_SITE_READY === 'true';
if (listo && (siteUrl.protocol !== 'https:' || /localhost|127\.0\.0\.1|ejemplo/.test(siteUrl.hostname))) {
  throw new Error('PUBLIC_SITE_READY=true requiere PUBLIC_SITE_URL con el dominio real y https.');
}

// DESTINO=cloudflare compila para Workers (npm run deploy); sin él, para el servidor Node de las pruebas.
const enCloudflare = env.DESTINO === 'cloudflare';

// En Cloudflare las páginas estáticas no pasan por el Worker: sus cabeceras van en _headers.
// La regla general pone no-store; las de recursos la quitan («! Cache-Control») y fijan su propia caché.
const archivoCabeceras = () => {
  const todas = { ...cabecerasSeguridad, 'Strict-Transport-Security': HSTS, 'Cache-Control': 'no-store' };
  const recurso = cache => `  ! Cache-Control\n  Cache-Control: ${cache}\n`;
  return [
    `/*\n${Object.entries(todas).map(([k, v]) => `  ${k}: ${v}\n`).join('')}`,
    `/_astro/*\n${recurso('public, max-age=31536000, immutable')}`,
    ...['/assets/*', '/favicon.ico', '/favicon.svg', '/manifest.webmanifest', '/robots.txt', '/sitemap.xml'].map(r => `${r}\n${recurso('public, max-age=3600')}`)
  ].join('\n');
};
const cabecerasCloudflare = {
  name: 'cabeceras-cloudflare',
  hooks: { 'astro:build:done': ({ dir }) => writeFile(new URL('_headers', dir), archivoCabeceras()) }
};

export default defineConfig({
  site: siteUrl.href,
  // Permite validar el origen de los formularios con el dominio real y con el servidor local de pruebas.
  security: {
    checkOrigin: true,
    allowedDomains: [{ hostname: siteUrl.hostname, protocol: siteUrl.protocol.replace(':', '') }, ...(listo ? [] : [{ hostname: '127.0.0.1', protocol: 'http' }])]
  },
  output: 'static',
  adapter: enCloudflare ? cloudflare({ prerenderEnvironment: 'node', imageService: 'passthrough' }) : node({ mode: 'standalone' }),
  integrations: enCloudflare ? [cabecerasCloudflare] : [],
  ...(enCloudflare ? { session: false } : {}),
  trailingSlash: 'ignore',
  redirects: { '/home': '/' },
  build: { inlineStylesheets: 'never' },
  vite: {
    build: { assetsInlineLimit: 0 },
    // En Workers no hay nodemailer ni disco: el correo sale por el Email Service de Cloudflare.
    resolve: enCloudflare ? { alias: [{ find: /^#plataforma$/, replacement: fileURLToPath(new URL('./src/lib/plataforma-cloudflare.ts', import.meta.url)) }] } : {}
  },
  devToolbar: { enabled: false },
  telemetry: false
});
