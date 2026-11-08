// Medición de laboratorio de LCP, CLS, TBT aproximado y peso transferido, en móvil emulado con red y CPU limitadas.
// Uso: node scripts/seo/medir-vitals.mjs [base] [ruta...]   (por defecto, producción)
// Son datos de laboratorio: orientan, pero no sustituyen los datos de campo (CrUX / Search Console) al percentil 75.
// INP necesita interacciones reales y no se mide aquí.
import { chromium, devices } from '@playwright/test';

const base = process.argv[2] ?? 'https://evelynelizondo.com';
const rutas = process.argv.slice(3).length ? process.argv.slice(3) : ['/', '/servicios/divorcios', '/blog/divorcio-mutuo-consentimiento-costa-rica', '/agendar-consulta'];
const navegador = await chromium.launch({ channel: 'chrome' });
const resultados = [];
for (const ruta of rutas) {
  const muestras = [];
  for (let i = 0; i < 3; i++) {
    const ctx = await navegador.newContext({ ...devices['Pixel 7'] });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    // Perfil similar a «Slow 4G» de Lighthouse: 150 ms RTT, 1,6 Mbps, CPU 4× más lenta.
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => {
      (window).__v = { lcp: 0, cls: 0, tbt: 0 };
      new PerformanceObserver(l => { for (const e of l.getEntries()) (window).__v.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) (window).__v.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(l => { for (const e of l.getEntries()) (window).__v.tbt += Math.max(0, e.duration - 50); }).observe({ type: 'longtask', buffered: true });
    });
    let bytes = 0;
    cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; });
    const t0 = Date.now();
    const res = await page.goto(base + ruta, { waitUntil: 'load' });
    const ttfb = await page.evaluate(() => performance.getEntriesByType('navigation')[0].responseStart);
    await page.waitForTimeout(3000);
    const v = await page.evaluate(() => (window).__v);
    muestras.push({ estado: res?.status(), ttfb, ...v, kb: bytes / 1024, carga: Date.now() - t0 });
    await ctx.close();
  }
  const med = k => muestras.map(m => m[k]).sort((a, b) => a - b)[1];
  resultados.push({ ruta, estado: muestras[0].estado, 'TTFB ms': Math.round(med('ttfb')), 'LCP ms': Math.round(med('lcp')), CLS: +med('cls').toFixed(3), 'TBT ms': Math.round(med('tbt')), 'KB': Math.round(med('kb')) });
}
await navegador.close();
console.log(`Base: ${base} · ${new Date().toISOString()} · mediana de 3 cargas · Pixel 7, 150 ms RTT, 1,6 Mbps, CPU ×4, sin caché`);
console.table(resultados);
