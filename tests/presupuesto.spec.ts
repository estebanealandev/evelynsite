// Límites de peso y rendimiento definidos en docs/plan-ux-diseno.md. Se comprueban en cada fase.
import { expect, test, type Page } from '@playwright/test';
import { gzipSync } from 'node:zlib';
import { principales } from './routes';

const LIMITE_JS_GZIP_KB = 60;
const LIMITE_LCP_MS = 2500;
const LIMITE_CLS = 0.1;
const LIMITE_INP_MS = 200;

// Simula un móvil de gama media con conexión 4G lenta.
async function limitar(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6e6) / 8, uploadThroughput: (750e3) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
}

test.describe('peso de JavaScript', () => {
  for (const ruta of principales) {
    test(`${ruta} respeta el límite y no carga three.js sin necesidad`, async ({ page }) => {
      const scripts: Buffer[] = [];
      page.on('response', async r => {
        if (r.request().resourceType() === 'script') scripts.push(await r.body());
      });
      await page.goto(ruta, { waitUntil: 'networkidle' });
      await page.waitForTimeout(ruta === '/' ? 2200 : 100);
      // La escena de la portada es diferida y solo se admite allí.
      const conEscena = scripts.filter(b => b.includes('WebGLRenderer'));
      const kb = scripts.filter(b => !b.includes('WebGLRenderer')).reduce((t, b) => t + gzipSync(b).length, 0) / 1024;
      expect(kb, `${kb.toFixed(1)} KB`).toBeLessThanOrEqual(LIMITE_JS_GZIP_KB);
      if (ruta !== '/') expect(conEscena.length).toBe(0);
    });
  }
});

test.describe('experiencia de carga con red y CPU limitadas', () => {
  test.describe.configure({ mode: 'serial' });
  for (const ruta of ['/', '/servicios/divorcios', '/blog/cambios-codigo-procesal-familia']) {
    test(`${ruta}: LCP y CLS dentro del límite`, async ({ page }) => {
      await limitar(page);
      await page.addInitScript(() => {
        const m = { lcp: 0, cls: 0 };
        (window as any).__m = m;
        new PerformanceObserver(l => { for (const e of l.getEntries()) m.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(l => { for (const e of l.getEntries() as any[]) if (!e.hadRecentInput) m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(ruta, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(800);
      const m = await page.evaluate(() => (window as any).__m);
      expect(m.lcp, `LCP ${Math.round(m.lcp)} ms`).toBeLessThanOrEqual(LIMITE_LCP_MS);
      expect(m.cls, `CLS ${m.cls.toFixed(3)}`).toBeLessThanOrEqual(LIMITE_CLS);
    });
  }

  test('el cálculo del árbol ocurre fuera del hilo principal', async ({ page }) => {
    const workers: string[] = [];
    page.on('worker', w => workers.push(w.url()));
    await page.goto('/');
    await page.waitForFunction(() => (window as any).__arbol?.frames > 0, null, { timeout: 60000 });
    expect(workers.length).toBeGreaterThan(0);
  });

  test('la interacción responde a tiempo (INP)', async ({ page, isMobile }) => {
    await limitar(page);
    await page.goto('/', { waitUntil: 'load', timeout: 60000 });
    await page.evaluate(() => {
      (window as any).__d = 0;
      new PerformanceObserver(l => { for (const e of l.getEntries()) (window as any).__d = Math.max((window as any).__d, e.duration); }).observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    });
    await page.locator(isMobile ? '.burger' : '.has-menu button').click();
    await page.waitForTimeout(500);
    const d = await page.evaluate(() => (window as any).__d);
    expect(d, `${Math.round(d)} ms`).toBeLessThanOrEqual(LIMITE_INP_MS);
  });
});
