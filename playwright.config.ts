import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4325',
    channel: 'chrome',
    // Permite ejecutar WebGL sin tarjeta gráfica en las pruebas del laboratorio.
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } },
    { name: 'movil', use: { ...devices['Pixel 7'], channel: 'chrome', viewport: { width: 390, height: 844 } } }
  ],
  webServer: {
    command: 'node ./dist/server/entry.mjs',
    url: 'http://127.0.0.1:4325/',
    reuseExistingServer: false,
    env: { HOST: '127.0.0.1', PORT: '4325', MAIL_MODE: 'outbox', RATE_LIMIT_MAX: '200', MAIL_TO: 'pruebas@example.test' }
  }
});
