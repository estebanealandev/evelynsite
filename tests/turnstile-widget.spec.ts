// Widget Turnstile real (claves de prueba oficiales) contra el Siteverify real de Cloudflare.
// Se ejecuta con `npm run test:turnstile`, que compila dist-turnstile/ con la clave pública de prueba.
// Las claves de prueba no validan hostname ni action: eso exige el widget real (ver
// docs/security/turnstile-implementation.md, «Prueba con claves reales»).
import { expect, test, type Page } from '@playwright/test';
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';

// Cada proyecto (escritorio, móvil) corre en paralelo con su propio servidor y buzón.
let origen = '';
let BUZON = '';
const FORM = 'form[action="/api/consulta"]';
const enviados = () => (existsSync(BUZON) ? readdirSync(BUZON).length : 0);

test.describe.configure({ mode: 'serial' });
test.skip(process.env.TURNSTILE_E2E !== '1', 'requiere npm run test:turnstile');

let srv: ReturnType<typeof spawn>;
test.beforeAll(async ({ request }, info) => {
  const PUERTO = String(4337 + info.parallelIndex);
  const nombre = `outbox-widget-${info.project.name}`;
  origen = `http://127.0.0.1:${PUERTO}`;
  BUZON = `var/${nombre}`;
  rmSync(BUZON, { recursive: true, force: true });
  srv = spawn('node', ['scripts/servidor.mjs'], {
    env: {
      ...process.env,
      DIST_DIR: 'dist-turnstile',
      HOST: '127.0.0.1',
      PORT: PUERTO,
      MAIL_MODE: 'outbox',
      OUTBOX_DIR: nombre,
      MAIL_TO: 'pruebas@example.test',
      RATE_LIMIT_MAX: '500',
      TURNSTILE_MODE: 'required',
      // Clave secreta de prueba oficial: solo se acepta en una máquina local.
      TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
      TURNSTILE_VERIFY_URL: ''
    },
    stdio: 'ignore'
  });
  await expect.poll(async () => (await request.get(`${origen}/`).catch(() => null))?.status(), { timeout: 15000 }).toBe(200);
});
test.afterAll(() => srv?.kill());

const vigilar = async (page: Page) => {
  const pedidos: string[] = [];
  page.on('request', r => { if (r.url().includes('challenges.cloudflare.com')) pedidos.push(r.url()); });
  await page.addInitScript(() => {
    (window as any).__violaciones = [];
    document.addEventListener('securitypolicyviolation', e => (window as any).__violaciones.push(`${e.violatedDirective} ${e.blockedURI}`));
    (window as any).__cls = 0;
    new PerformanceObserver(l => { for (const e of l.getEntries() as any[]) if (!e.hadRecentInput) (window as any).__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  return pedidos;
};
const csp = (page: Page) => page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');

test('prueba 11 y 12: las páginas públicas no cargan ni admiten Turnstile', async ({ page }) => {
  const pedidos = await vigilar(page);
  for (const ruta of ['/', '/servicios/divorcios', '/blog', '/politica-de-privacidad']) {
    const res = await page.goto(`${origen}${ruta}`);
    expect(res?.status()).toBe(200);
    expect(await csp(page)).not.toContain('challenges.cloudflare.com');
  }
  expect(pedidos).toEqual([]);
  // Con el widget publicado, la política lo describe y ya no afirma que no hay terceros.
  await expect(page.locator('#seguridad-del-formulario')).toBeVisible();
  await expect(page.locator('.legal')).not.toContainText('no carga recursos de terceros');
});

test('prueba 11 y 14: el formulario carga Turnstile solo tras el consentimiento, sin violar la CSP ni mover el diseño', async ({ page }) => {
  const pedidos = await vigilar(page);
  await page.goto(`${origen}/agendar-consulta`);
  await expect(page.locator('[data-formulario-cerrado]')).toHaveCount(0);
  const politica = (await csp(page)) ?? '';
  expect(politica).toMatch(/script-src 'self' 'sha256-[^']+' https:\/\/challenges\.cloudflare\.com;/);
  expect(politica).toContain("frame-src 'self' https://challenges.cloudflare.com");
  expect(politica).not.toMatch(/unsafe-eval|script-src[^;]*unsafe-inline/);

  await page.locator(`${FORM} .opcion`, { hasText: 'Divorcio' }).click();
  await page.click(`${FORM} [data-siguiente]`);
  await page.fill('#c-mensaje', 'Este es un mensaje de prueba con suficiente longitud.');
  await page.click(`${FORM} [data-siguiente]`);
  await page.fill('#c-nombre', 'Persona de Prueba');
  await page.fill('#c-correo', 'persona@example.test');
  // Hasta aquí, nada de Cloudflare: el tratamiento empieza con la autorización.
  expect(pedidos).toEqual([]);
  await page.check('#c-consentimiento', { force: true });
  await expect.poll(() => pedidos.some(u => u.includes('/turnstile/v0/api.js')), { timeout: 15000 }).toBe(true);
  await expect.poll(() => page.locator(`${FORM} input[name="cf-turnstile-response"]`).inputValue().catch(() => ''), { timeout: 20000 }).toBe('XXXX.DUMMY.TOKEN.XXXX');

  // El espacio reservado (65 px) evita desplazamientos al aparecer el widget.
  expect(await page.evaluate(() => (window as any).__cls)).toBeLessThan(0.1);
  expect(await page.evaluate(() => (window as any).__violaciones)).toEqual([]);

  // La CSP sigue bloqueando otros orígenes en la misma página.
  await page.evaluate(() => { const s = document.createElement('script'); s.src = 'https://example.com/x.js'; document.head.append(s); });
  await expect.poll(() => page.evaluate(() => (window as any).__violaciones.join(' '))).toContain('example.com');

  const antes = enviados();
  await page.waitForTimeout(3100);
  await page.click(`${FORM} button[type=submit]`);
  await expect(page.locator(`${FORM} .form__status`)).toContainText('Su solicitud se envió', { timeout: 15000 });
  expect(enviados()).toBe(antes + 1);

  // Informativo: cookies de Cloudflare tras la verificación (con la clave de prueba; repetir con la real).
  const cookies = (await page.context().cookies()).filter(c => c.domain.includes('cloudflare'));
  test.info().annotations.push({ type: 'cookies-cloudflare', description: cookies.map(c => c.name).join(', ') || 'ninguna' });
});

test('prueba 16: sin JavaScript no se puede enviar con Turnstile activo', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(`${origen}/agendar-consulta`);
  await expect(page.locator(`${FORM} noscript`)).toHaveCount(1);
  const antes = enviados();
  await page.locator(`${FORM} .opcion`, { hasText: 'Divorcio' }).click();
  await page.fill('#c-mensaje', 'Este es un mensaje de prueba con suficiente longitud.');
  await page.fill('#c-nombre', 'Persona de Prueba');
  await page.fill('#c-correo', 'persona@example.test');
  await page.check('#c-consentimiento');
  await page.click(`${FORM} button[type=submit]`);
  await expect(page).toHaveURL(/consulta-no-enviada$/);
  await expect(page.locator('h1')).toContainText('no se envió');
  await expect(page.locator('main')).toContainText('verificación de seguridad');
  expect(enviados()).toBe(antes);
  await ctx.close();
});
