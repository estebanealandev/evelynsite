import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

const siteUrl = new URL(process.env.PUBLIC_SITE_URL || 'http://localhost:4321');

export default defineConfig({
  site: siteUrl.href,
  // Permite validar el origen de los formularios con el dominio real y con el servidor local de pruebas.
  security: {
    checkOrigin: true,
    allowedDomains: [{ hostname: siteUrl.hostname, protocol: siteUrl.protocol.replace(':', '') }, { hostname: '127.0.0.1', protocol: 'http' }]
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
