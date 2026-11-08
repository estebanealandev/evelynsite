import { defineConfig, devices } from '@playwright/test';

// Chrome corre siempre. Firefox y WebKit se piden con NAVEGADORES=todos (npm run test:navegadores).
const chrome = { channel: 'chrome', launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } };

// SERVIDOR=cloudflare prueba la compilación de Workers (`npm run build:cf`) en el runtime local de Cloudflare.
// Las pruebas que arrancan el servidor Node o leen el buzón local quedan fuera en ese modo.
const enCloudflare = process.env.SERVIDOR === 'cloudflare';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4325' },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], ...chrome, viewport: { width: 1440, height: 900 } } },
    { name: 'movil', use: { ...devices['Pixel 7'], ...chrome, viewport: { width: 390, height: 844 } } },
    ...(process.env.NAVEGADORES === 'todos'
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 800 } } },
          { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 800 } } },
          { name: 'webkit-movil', use: { ...devices['iPhone 14'] } }
        ]
      : [])
  ],
  testIgnore: enCloudflare ? ['**/forms-smtp.spec.ts', '**/forms-disabled.spec.ts', '**/limite.spec.ts'] : [],
  webServer: enCloudflare ? {
    command: 'npx wrangler dev --ip 127.0.0.1 --port 4325 --var RATE_LIMIT_MAX:500 --var RATE_LIMIT_EDGE:off --var MAIL_MODE:cloudflare --var MAIL_TO:pruebas@example.test --var MAIL_FROM:sitio@example.test --log-level warn',
    url: 'http://127.0.0.1:4325/',
    reuseExistingServer: true
  } : {
    command: 'node scripts/servidor.mjs',
    url: 'http://127.0.0.1:4325/',
    reuseExistingServer: false,
    env: { HOST: '127.0.0.1', PORT: '4325', MAIL_MODE: 'outbox', RATE_LIMIT_MAX: '500', MAIL_TO: 'pruebas@example.test' }
  }
});
