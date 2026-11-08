import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import cloudflare from '@astrojs/cloudflare';
import { readFileSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { cabecerasSeguridad, HSTS } from './src/lib/cabeceras.mjs';
import { resolverIndexacion } from './src/config/indexacion.mjs';
import { agruparExcluidas } from './src/lib/seo/cabeceras-robots.mjs';

// `astro build` no carga .env en process.env: sin esto, un sitio publicado saldría con canonical en localhost.
const env = { ...loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), ''), ...process.env };
const siteUrl = new URL(env.PUBLIC_SITE_URL || 'http://localhost:4321');

// La indexación la decide solo src/config/indexacion.mjs. Si se pide sin cumplir los requisitos, la compilación falla.
const registroLanzamiento = JSON.parse(readFileSync(new URL('./src/config/lanzamiento.json', import.meta.url), 'utf8'));
const politica = resolverIndexacion(env, registroLanzamiento);
const listo = politica.indexable;
// PUBLIC_SITE_READY deja de ser una entrada: se deriva de la política para el resto del código.
process.env.PUBLIC_SITE_READY = String(listo);
process.env.PUBLIC_SITE_ENV = politica.entorno;
console.log(`[indexación] entorno=${politica.entorno} indexable=${listo} (${politica.motivo})`);

// DESTINO=cloudflare compila para Workers (npm run deploy); sin él, para el servidor Node de las pruebas.
const enCloudflare = env.DESTINO === 'cloudflare';

// Recorre el HTML compilado y anota la directiva robots de cada página. De ahí salen X-Robots-Tag en _headers
// (Cloudflare) y en el servidor Node, así la cabecera nunca contradice a la etiqueta.
async function robotsCompilados(dir) {
  const raiz = fileURLToPath(dir);
  const rutas = {};
  for (const f of await readdir(raiz, { recursive: true })) {
    if (!f.endsWith('.html')) continue;
    const m = (await readFile(`${raiz}/${f}`, 'utf8')).match(/<meta name="robots" content="([^"]+)"/);
    const ruta = '/' + f.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '');
    rutas[ruta.replace(/\/$/, '') || '/'] = m?.[1] ?? null;
  }
  return rutas;
}

// En Cloudflare las páginas estáticas no pasan por el Worker: sus cabeceras van en _headers.
// La regla general pone no-store; las de recursos la quitan («! Cache-Control») y fijan su propia caché.
// Antes del lanzamiento, X-Robots-Tag va en todo (también imágenes y PDF); después, solo en las páginas noindex.
const LIMITE_REGLAS = 100; // máximo de reglas que admite _headers en Workers Static Assets
const archivoCabeceras = robots => {
  const todas = { ...cabecerasSeguridad, 'Strict-Transport-Security': HSTS, 'Cache-Control': 'no-store', ...(listo ? {} : { 'X-Robots-Tag': 'noindex, nofollow' }) };
  const recurso = cache => `  ! Cache-Control\n  Cache-Control: ${cache}\n`;
  const excluidas = listo ? agruparExcluidas(robots) : [];
  const reglas = [
    `/*\n${Object.entries(todas).map(([k, v]) => `  ${k}: ${v}\n`).join('')}`,
    `/_astro/*\n${recurso('public, max-age=31536000, immutable')}`,
    ...['/assets/*', '/favicon.ico', '/favicon.svg', '/manifest.webmanifest', '/robots.txt', '/sitemap.xml'].map(r => `${r}\n${recurso('public, max-age=3600')}`),
    ...excluidas.map(([ruta, v]) => `${ruta}\n  X-Robots-Tag: ${v}\n`)
  ];
  if (reglas.length > LIMITE_REGLAS) throw new Error(`_headers tendría ${reglas.length} reglas; Cloudflare admite ${LIMITE_REGLAS}. Agrupe las páginas excluidas por prefijo.`);
  return reglas.join('\n');
};
const cabecerasSeo = {
  name: 'cabeceras-seo',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const robots = await robotsCompilados(dir);
      // Lo lee scripts/servidor.mjs. Queda fuera de la carpeta pública.
      await writeFile(new URL('../robots-compilados.json', dir), JSON.stringify({ indexable: listo, entorno: politica.entorno, rutas: robots }, null, 1));
      if (enCloudflare) await writeFile(new URL('_headers', dir), archivoCabeceras(robots));
    }
  }
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
  integrations: [cabecerasSeo],
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
