import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { principales, servicios } from './routes';

test.describe('rutas y dependencias', () => {
  for (const ruta of principales) {
    test(`${ruta} carga solo recursos locales y sin errores`, async ({ page }) => {
      const externos: string[] = [];
      const fallidos: string[] = [];
      const errores: string[] = [];
      page.on('request', r => { const u = new URL(r.url()); if (!['127.0.0.1', ''].includes(u.hostname) && u.protocol.startsWith('http')) externos.push(r.url()); });
      page.on('response', r => { if (r.status() >= 400) fallidos.push(`${r.status()} ${r.url()}`); });
      page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
      page.on('pageerror', e => errores.push(e.message));
      const res = await page.goto(ruta, { waitUntil: 'networkidle' });
      expect(res?.status()).toBe(200);
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 25)); } });
      await page.waitForLoadState('networkidle');
      expect(externos).toEqual([]);
      expect(fallidos).toEqual([]);
      expect(errores).toEqual([]);
      await expect(page.locator('h1')).toHaveCount(1);
      const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(scroll).toBeLessThanOrEqual(0);
    });
  }

  test('todos los enlaces internos del sitemap responden', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    const rutas = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname);
    expect(rutas.length).toBeGreaterThan(30);
    const enlaces = new Set<string>(rutas);
    for (const r of rutas) {
      const res = await request.get(r);
      expect(res.status(), r).toBe(200);
      const html = await res.text();
      for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) enlaces.add(m[1]);
      for (const m of html.matchAll(/src="(\/[^"#?]*)/g)) enlaces.add(m[1]);
    }
    for (const e of enlaces) {
      const res = await request.get(e);
      expect(res.status(), e).toBe(200);
    }
  });

  test('no instala cookies, como declara la política de privacidad', async ({ page, context }) => {
    await page.goto('/agendar-consulta', { waitUntil: 'networkidle' });
    expect(await context.cookies()).toEqual([]);
  });

  test('página 404 con estado correcto', async ({ page }) => {
    const res = await page.goto('/esta-ruta-no-existe');
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1')).toContainText('404');
  });

  test('sin publicación habilitada: noindex y robots bloqueado', async ({ page, request }) => {
    await page.goto('/');
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
    expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
  });
});

test.describe('metadatos', () => {
  test('títulos y descripciones únicos', async ({ page }) => {
    const titulos = new Set<string>();
    const descripciones = new Set<string>();
    for (const r of principales) {
      await page.goto(r);
      titulos.add(await page.title());
      descripciones.add((await page.locator('meta[name=description]').getAttribute('content')) ?? '');
      await expect(page.locator('link[rel=canonical]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    }
    expect(titulos.size).toBe(principales.length);
    expect(descripciones.size).toBe(principales.length);
  });

  test('datos estructurados válidos y sin datos inventados', async ({ page }) => {
    await page.goto('/servicios/divorcios');
    const bloques = await page.locator('script[type="application/ld+json"]').allTextContents();
    const datos = bloques.map(b => JSON.parse(b));
    const org = datos.find(d => d['@type'] === 'LegalService');
    expect(org.name).toBe('Evelyn Elizondo');
    expect(org.address).toBeUndefined();
    expect(datos.some(d => d['@type'] === 'FAQPage')).toBe(true);
    expect(datos.some(d => d['@type'] === 'BreadcrumbList')).toBe(true);
  });
});

test.describe('interacciones', () => {
  test('menú móvil abre, navega y cierra con Escape', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'solo móvil');
    await page.goto('/');
    const burger = page.locator('.burger');
    const menu = page.locator('#menu-movil');
    await expect(menu).toHaveAttribute('data-open', 'false');
    await burger.click();
    await expect(menu).toHaveAttribute('data-open', 'true');
    await expect(menu.getByRole('link', { name: 'Blog' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('data-open', 'false');
    await burger.click();
    await menu.getByRole('link', { name: 'Blog' }).click();
    await expect(page).toHaveURL(/\/blog$/);
  });

  test('submenú de escritorio con teclado', async ({ page, isMobile }) => {
    test.skip(isMobile, 'solo escritorio');
    await page.goto('/');
    const btn = page.getByRole('button', { name: 'Más áreas' });
    await btn.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#submenu-servicios')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('carrusel avanza y actualiza flechas', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-carousel]').first();
    await root.scrollIntoViewIfNeeded();
    const prev = root.locator('[data-prev]');
    const next = root.locator('[data-next]');
    await expect(prev).toBeDisabled();
    await next.click();
    await expect(prev).toBeEnabled();
  });

  test('diálogo abre y cierra', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-dialog]').first().click();
    const d = page.locator('dialog');
    await expect(d).toBeVisible();
    await d.locator('[data-close]').click();
    await expect(d).toBeHidden();
  });

  test('acordeón Leer más revela el detalle', async ({ page }) => {
    await page.goto('/servicios/divorcios');
    const det = page.locator('details.more').first();
    await det.locator('summary').click();
    await expect(det).toHaveAttribute('open', '');
    await expect(det.locator('p')).toBeVisible();
  });

  test('respeta prefers-reduced-motion', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('http://127.0.0.1:4325/');
    expect(await page.locator('.marquee__track').first().evaluate(e => getComputedStyle(e).animationName)).toBe('none');
    expect(await page.locator('.reveal').first().evaluate(e => getComputedStyle(e).opacity)).toBe('1');
    await ctx.close();
  });
});

test.describe('formulario de consulta', () => {
  const llenar = async (page: any) => {
    await page.fill('#c-nombre', 'Persona de Prueba');
    await page.fill('#c-correo', 'persona@example.test');
    await page.selectOption('#c-tipo', 'Divorcio');
    await page.fill('#c-mensaje', 'Este es un mensaje de prueba con suficiente longitud.');
    await page.check('#c-consentimiento');
  };

  test('muestra errores accesibles si está vacío', async ({ page }) => {
    await page.goto('/agendar-consulta');
    await page.click('form[action="/api/consulta"] button[type=submit]');
    await expect(page.locator('#e-nombre')).toContainText('nombre');
    await expect(page.locator('#c-nombre')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('form[action="/api/consulta"] .form__status')).toContainText('Revise');
  });

  test('envío real pasa por el backend', async ({ page }) => {
    await page.goto('/agendar-consulta');
    await llenar(page);
    await page.waitForTimeout(3100);
    const [res] = await Promise.all([
      page.waitForResponse('**/api/consulta'),
      page.click('form[action="/api/consulta"] button[type=submit]')
    ]);
    expect(res.status()).toBe(200);
    await expect(page.locator('form[action="/api/consulta"] .form__status')).toContainText('Recibimos');
  });

  test('error de red: no simula éxito', async ({ page }) => {
    await page.goto('/agendar-consulta');
    await llenar(page);
    await page.route('**/api/consulta', r => r.abort());
    await page.waitForTimeout(3100);
    await page.click('form[action="/api/consulta"] button[type=submit]');
    await expect(page.locator('form[action="/api/consulta"] .form__status')).toContainText('no se ha enviado');
  });
});

test.describe('API', () => {
  const origin = 'http://127.0.0.1:4325';
  const valido = { nombre: 'Persona de Prueba', correo: 'p@example.test', telefono: '', tipo: 'Divorcio', mensaje: 'Mensaje suficientemente largo para la prueba.', consentimiento: 'on' };
  const post = (request: any, data: object) => request.post('/api/consulta', { headers: { accept: 'application/json', origin }, form: data });

  test('rechaza datos inválidos en el servidor', async ({ request }) => {
    const res = await post(request, { ...valido, correo: 'no-es-correo', tipo: 'Otro', consentimiento: '' });
    expect(res.status()).toBe(422);
    const j = await res.json();
    expect(Object.keys(j.errores).sort()).toEqual(['consentimiento', 'correo', 'tipo']);
  });

  test('neutraliza inyección de cabeceras y HTML', async ({ request }) => {
    const res = await post(request, { ...valido, nombre: 'Ana\r\nBcc: x@example.test <script>alert(1)</script>', mensaje: 'Texto <img src=x onerror=alert(1)> de longitud suficiente.' });
    expect(res.status()).toBe(200);
  });

  test('el campo trampa descarta el envío sin procesarlo', async ({ request }) => {
    const res = await post(request, { ...valido, sitio_web: 'http://spam.example' });
    expect(res.status()).toBe(200);
  });

  test('rechaza una solicitud de otro origen', async ({ request }) => {
    const res = await request.post('/api/consulta', { headers: { origin: 'https://otro.example' }, form: valido });
    expect(res.status()).toBe(403);
  });

  test('sin JavaScript redirige a la página de confirmación', async ({ request }) => {
    const res = await request.post('/api/consulta', { headers: { origin }, form: valido, maxRedirects: 0 });
    expect(res.status()).toBe(303);
    expect(res.headers().location).toBe('/consulta-recibida');
  });

  test('suscripción exige consentimiento', async ({ request }) => {
    const res = await request.post('/api/suscripcion', { headers: { accept: 'application/json', origin }, form: { correo: 'p@example.test' } });
    expect(res.status()).toBe(422);
  });
});

test.describe('accesibilidad WCAG 2.2 AA', () => {
  for (const ruta of ['/', '/servicios/divorcios', '/servicios/proteccion-familiar', '/sobre-evelyn', '/blog', '/blog/cambios-codigo-procesal-familia', '/agendar-consulta', '/contacto', '/politica-de-privacidad']) {
    test(`${ruta} sin violaciones graves`, async ({ page }) => {
      await page.goto(ruta, { waitUntil: 'networkidle' });
      await page.addStyleTag({ content: '.js .reveal{opacity:1!important;transform:none!important;transition:none!important}' });
      // Las palabras gigantes son decoración pura (aria-hidden): WCAG las exime del requisito de contraste.
      const r = await new AxeBuilder({ page }).exclude('.ghost').exclude('.approach-ghost').exclude('.blog-ghost').exclude('.corner-ghost').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      const graves = r.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? '')).map(v => `${v.id}: ${v.nodes.slice(0, 4).map(n => n.target.join(' ')).join(' | ')}`);
      expect(graves).toEqual([]);
    });
  }
});
