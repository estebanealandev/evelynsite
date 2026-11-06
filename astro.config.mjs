import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { loadEnv } from 'vite';

// `astro build` no carga .env en process.env: sin esto, un sitio publicado saldría con canonical en localhost.
const env = { ...loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), ''), ...process.env };
const siteUrl = new URL(env.PUBLIC_SITE_URL || 'http://localhost:4321');
const listo = env.PUBLIC_SITE_READY === 'true';
if (listo && (siteUrl.protocol !== 'https:' || /localhost|127\.0\.0\.1|ejemplo/.test(siteUrl.hostname))) {
  throw new Error('PUBLIC_SITE_READY=true requiere PUBLIC_SITE_URL con el dominio real y https.');
}

export default defineConfig({
  site: siteUrl.href,
  // Permite validar el origen de los formularios con el dominio real y con el servidor local de pruebas.
  security: {
    checkOrigin: true,
    allowedDomains: [{ hostname: siteUrl.hostname, protocol: siteUrl.protocol.replace(':', '') }, ...(listo ? [] : [{ hostname: '127.0.0.1', protocol: 'http' }])]
  },
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'ignore',
  redirects: { '/home': '/' },
  build: { inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
  devToolbar: { enabled: false },
  telemetry: false
});
