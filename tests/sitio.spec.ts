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

const mostrarTodo = (page: any) => page.addStyleTag({ content: '.reveal,[data-mascara],.palabra>span{opacity:1!important;transform:none!important;clip-path:none!important;transition:none!important}' });

test.describe('portada', () => {
  test('tiene siete capítulos y ninguna animación CSS infinita', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('main > section').count()).toBe(7);
    const animados = await page.evaluate(() => document.getAnimations().filter(a => a.effect?.getComputedTiming().iterations === Infinity).length);
    expect(animados).toBe(0);
  });

  test('muestra las nueve áreas con su enlace', async ({ page }) => {
    await page.goto('/');
    const enlaces = await page.locator('.areas a').evaluateAll(as => as.map(a => a.getAttribute('href')));
    expect(enlaces).toEqual(servicios.map(s => `/servicios/${s}`));
  });

  test('el hero cabe en la primera pantalla', async ({ page }) => {
    await page.goto('/');
    const caja = await page.locator('.h-hero__foot .btn').first().boundingBox();
    expect(caja!.y + caja!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    // Los botones principales aparecen sin necesidad de hacer scroll.
    await expect.poll(() => page.locator('.h-hero__foot .btn-row').evaluate(e => Number(getComputedStyle(e).opacity)), { timeout: 3000 }).toBeGreaterThan(0.95);
  });

  test('el árbol nunca invade el titular en ningún tamaño de pantalla', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ baseURL, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    // Con la tipografía de reserva el titular mide distinto: se espera la definitiva.
    await page.evaluate(() => document.fonts.ready);
    for (const [width, height] of [[320, 568], [360, 640], [390, 664], [430, 932], [768, 1024], [1024, 768], [1280, 640], [1366, 768], [1440, 900], [1920, 1080], [2560, 1440]]) {
      await page.setViewportSize({ width, height });
      // Da tiempo a que el navegador recalcule las unidades de la nueva ventana.
      await page.waitForTimeout(150);
      const choque = await page.evaluate(() => {
        const m = document.querySelector('.h-hero__poster')!.getBoundingClientRect();
        // El tronco ocupa el centro de la imagen: se comprueba el 60 % central.
        const izq = m.left + m.width * 0.2, der = m.right - m.width * 0.2;
        // Se mide la caja interior de cada palabra: el relleno anti-recorte no es texto visible.
        return [...document.querySelectorAll('.h-hero__title .palabra > span')].map(e => e.getBoundingClientRect())
          .some(t => !(t.right <= izq || t.left >= der || t.bottom <= m.top + m.height * 0.3 || t.top >= m.bottom));
      });
      expect(choque, `${width}x${height}`).toBe(false);
    }
    await ctx.close();
  });

  test('con movimiento reducido no se descarga la escena y se ve la imagen del árbol', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ baseURL, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const three: string[] = [];
    page.on('request', r => { if (/escena|three|WebGL/i.test(r.url())) three.push(r.url()); });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);
    expect(three).toEqual([]);
    await expect(page.locator('.h-hero')).toHaveClass(/sin-3d/);
    await expect(page.locator('.h-hero__poster')).toBeVisible();
    await ctx.close();
  });

  test('sin JavaScript el contenido y la imagen quedan visibles', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ baseURL, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.h-hero__poster')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agendar una consulta' }).last()).toBeVisible();
    await ctx.close();
  });

  test('la escena carga en la portada', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).__arbol?.frames > 2, null, { timeout: 60000 });
    await expect(page.locator('.h-hero')).toHaveClass(/is-3d/);
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
    await page.goto('/servicios');
    const btn = page.getByRole('button', { name: 'Áreas' });
    await btn.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#submenu-servicios')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('la cabecera se vuelve sólida, se oculta al bajar y vuelve al subir', async ({ page }) => {
    await page.goto('/blog');
    const h = page.locator('.site-header');
    await expect(h).not.toHaveClass(/is-solid/);
    await page.evaluate(() => scrollTo({ top: 1200, behavior: 'instant' }));
    await expect(h).toHaveClass(/is-solid/);
    await expect(h).toHaveClass(/is-oculta/);
    await page.evaluate(() => scrollTo({ top: 900, behavior: 'instant' }));
    await expect(h).not.toHaveClass(/is-oculta/);
  });

  test('pausar animaciones se recuerda y detiene la escena', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).__arbol?.frames > 2, null, { timeout: 60000 });
    const btn = page.locator('[data-movimiento-btn]');
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await expect(btn).toHaveText('Reanudar animaciones');
    const a = await page.evaluate(() => (window as any).__arbol.frames);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as any).__arbol.frames)).toBe(a);
    await page.goto('/blog');
    expect(await page.evaluate(() => document.documentElement.dataset.movimiento)).toBe('pausado');
    await expect(page.locator('[data-movimiento-btn]')).toHaveText('Reanudar animaciones');
  });

  test('respeta prefers-reduced-motion', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', baseURL });
    const page = await ctx.newPage();
    await page.goto('/');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
    expect(await page.locator('.statement').evaluate(e => getComputedStyle(e.querySelector('.palabra > span')!).transform)).toBe('none');
    await ctx.close();
  });

  test('el contenido por debajo del pliegue se revela al llegar', async ({ page }) => {
    await page.goto('/blog/cambios-codigo-procesal-familia');
    await page.waitForTimeout(3300);
    const objetivo = page.locator('.post-grid .reveal').first();
    expect(await objetivo.evaluate(e => getComputedStyle(e).opacity)).toBe('0');
    await objetivo.scrollIntoViewIfNeeded();
    await expect.poll(() => objetivo.evaluate(e => Number(getComputedStyle(e).opacity))).toBeGreaterThan(0.9);
  });

  test('si no llega el script, todo aparece igualmente', async ({ page }) => {
    await page.route('**/assets/js/site.js', r => r.abort());
    await page.goto('/sobre-evelyn');
    await page.waitForTimeout(3300);
    expect(await page.locator('.reveal').last().evaluate(e => getComputedStyle(e).opacity)).toBe('1');
  });

  test('preguntas frecuentes se despliegan', async ({ page }) => {
    await page.goto('/servicios/divorcios');
    const det = page.locator('.faq details').first();
    await det.locator('summary').click();
    await expect(det).toHaveAttribute('open', '');
    await expect(det.locator('p')).toBeVisible();
  });

  test('el índice lleva a la sección y la marca', async ({ page, isMobile }) => {
    test.skip(isMobile, 'en móvil está plegado');
    await page.goto('/servicios/divorcios');
    await page.locator('.toc a[href="#preguntas"]').click();
    await expect(page).toHaveURL(/#preguntas$/);
    await expect(page.locator('.toc a[href="#preguntas"]')).toHaveAttribute('aria-current', 'true');
  });

  test('el índice se pliega en móvil', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'solo móvil');
    await page.goto('/servicios/divorcios');
    await expect(page.locator('.toc')).not.toHaveAttribute('open', '');
    await page.locator('.toc summary').click();
    await expect(page.locator('.toc a').first()).toBeVisible();
  });

  test('cada área responde con una respuesta directa desde el índice', async ({ request }) => {
    for (const s of servicios) {
      const html = await (await request.get(`/servicios/${s}`)).text();
      for (const id of ['en-breve', 'que-dice-la-ley', 'como-es-el-tramite', 'preguntas', 'fuentes']) expect(html, `${s} ${id}`).toContain(`id="${id}"`);
    }
  });
});

test.describe('orientador', () => {
  test('lleva al área correcta en dos pasos y permite volver', async ({ page }) => {
    await page.goto('/servicios#por-donde-empiezo');
    await page.getByRole('button', { name: 'Tengo una duda sobre mis hijas o hijos' }).click();
    await page.getByRole('button', { name: 'La pensión alimentaria' }).click();
    await expect(page.getByRole('link', { name: 'Leer esta área' })).toHaveAttribute('href', '/servicios/pensiones-alimentarias');
    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page.getByRole('button', { name: 'La pensión alimentaria' })).toBeVisible();
  });

  test('ante un temor por la seguridad muestra el aviso de emergencia', async ({ page }) => {
    await page.goto('/servicios#por-donde-empiezo');
    await page.getByRole('button', { name: /Temo por mi seguridad/ }).click();
    await expect(page.locator('.guia__res')).toContainText('9-1-1');
    await expect(page.getByRole('link', { name: 'Leer esta área' })).toHaveAttribute('href', '/servicios/proteccion-familiar');
  });

  test('no envía ninguna solicitud', async ({ page }) => {
    await page.goto('/servicios', { waitUntil: 'networkidle' });
    const envios: string[] = [];
    page.on('request', r => { if (r.method() !== 'GET') envios.push(r.url()); });
    await page.getByRole('button', { name: 'Convivimos sin estar casados' }).click();
    await page.waitForTimeout(300);
    expect(envios).toEqual([]);
  });

  test('sin JavaScript ofrece la lista de áreas', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ baseURL, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/servicios');
    expect(await page.locator('.guia__op').count()).toBe(servicios.length);
    await ctx.close();
  });
});

test.describe('salida rápida', () => {
  const bloquear = (page: any) => page.route('https://www.google.com/**', (r: any) => r.fulfill({ status: 200, contentType: 'text/html', body: 'neutro' }));

  test('solo aparece en las páginas de violencia', async ({ page }) => {
    await page.goto('/servicios/divorcios');
    await expect(page.locator('.salida')).toHaveCount(0);
    await page.goto('/servicios/proteccion-familiar');
    await expect(page.locator('.salida')).toBeVisible();
    await page.goto('/blog/proteccion-juridica-violencia-domestica');
    await expect(page.locator('.salida')).toBeVisible();
  });

  test('sale de inmediato y reemplaza la página en el historial', async ({ page }) => {
    await bloquear(page);
    await page.goto('/servicios');
    await page.goto('/servicios/proteccion-familiar');
    await page.locator('.salida').click();
    await expect(page).toHaveURL(/google\.com/);
    await page.goBack();
    await expect(page).toHaveURL(/\/servicios$/);
  });

  test('Esc dos veces también sale; una sola no', async ({ page }) => {
    await bloquear(page);
    await page.goto('/servicios/proteccion-familiar');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    await expect(page).toHaveURL(/proteccion-familiar/);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/google\.com/);
  });

  test('la página de violencia no carga escena ni animación automática', async ({ page }) => {
    await page.goto('/servicios/proteccion-familiar', { waitUntil: 'networkidle' });
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(await page.evaluate(() => document.getAnimations().filter(a => a.effect?.getComputedTiming().iterations === Infinity).length)).toBe(0);
  });
});

test.describe('blog', () => {
  test('filtra por categoría y busca en la misma página', async ({ page }) => {
    await page.goto('/blog');
    const total = await page.locator('.post-card[data-cat]').count();
    expect(total).toBe(14);
    await page.locator('[data-cat-btn="Divorcio"]').click();
    await expect(page.locator('[data-resultado]')).toHaveText('2 artículos');
    await expect(page.locator('.post-card[data-cat]:visible')).toHaveCount(2);
    await page.locator('[data-cat-btn=""]').click();
    await page.fill('#buscar', 'paternidad');
    await expect(page.locator('.post-card[data-cat]:visible')).toHaveCount(1);
    await page.fill('#buscar', 'zzzz');
    await expect(page.locator('[data-resultado]')).toContainText('No hay artículos');
  });

  test('sin JavaScript las categorías son enlaces y se ven todos los artículos', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ baseURL, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/blog');
    await expect(page.locator('.post-card[data-cat]:visible')).toHaveCount(14);
    await expect(page.locator('#buscar')).toBeHidden();
    await page.getByRole('link', { name: 'Divorcio', exact: true }).click();
    await expect(page).toHaveURL(/categoria\/divorcio$/);
    await ctx.close();
  });
});

test.describe('formulario de consulta', () => {
  const FORM = 'form[action="/api/consulta"]';
  const llenar = async (page: any) => {
    await page.locator(`${FORM} .opcion`, { hasText: 'Divorcio' }).click();
    await page.click(`${FORM} [data-siguiente]`);
    await page.fill('#c-mensaje', 'Este es un mensaje de prueba con suficiente longitud.');
    await page.click(`${FORM} [data-siguiente]`);
    await page.fill('#c-nombre', 'Persona de Prueba');
    await page.fill('#c-correo', 'persona@example.test');
    await page.check('#c-consentimiento', { force: true });
  };

  test('avanza por pasos y exige cada uno', async ({ page }) => {
    await page.goto('/agendar-consulta');
    await expect(page.locator('[data-pasos-texto]')).toHaveText('Paso 1 de 3');
    await page.click(`${FORM} [data-siguiente]`);
    await expect(page.locator('#e-tipo')).toContainText('Seleccione');
    await expect(page.locator('[data-pasos-texto]')).toHaveText('Paso 1 de 3');
    await page.locator(`${FORM} .opcion`, { hasText: 'Filiación' }).click();
    await page.click(`${FORM} [data-siguiente]`);
    await expect(page.locator('[data-pasos-texto]')).toHaveText('Paso 2 de 3');
    await expect(page.locator('#c-mensaje')).toBeFocused();
    await page.click(`${FORM} [data-siguiente]`);
    await expect(page.locator('#e-mensaje')).toContainText('mínimo');
    await expect(page.locator('#c-mensaje')).toHaveAttribute('aria-invalid', 'true');
    await page.click(`${FORM} [data-atras]`);
    await expect(page.locator('[data-pasos-texto]')).toHaveText('Paso 1 de 3');
    await expect(page.locator('input[value="Filiación"]')).toBeChecked();
  });

  test('envío real pasa por el backend', async ({ page }) => {
    await page.goto('/agendar-consulta');
    await llenar(page);
    await page.waitForTimeout(3100);
    const [res] = await Promise.all([page.waitForResponse('**/api/consulta'), page.click(`${FORM} button[type=submit]`)]);
    expect(res.status()).toBe(200);
    await expect(page.locator(`${FORM} .form__status`)).toContainText('Recibimos');
  });

  test('error de red: no simula éxito', async ({ page }) => {
    await page.goto('/agendar-consulta');
    await llenar(page);
    await page.route('**/api/consulta', r => r.abort());
    await page.waitForTimeout(3100);
    await page.click(`${FORM} button[type=submit]`);
    await expect(page.locator(`${FORM} .form__status`)).toContainText('no se ha enviado');
  });

  test('sin JavaScript se ven todos los campos y envía', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ baseURL, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/agendar-consulta');
    await expect(page.locator('#c-nombre')).toBeVisible();
    await expect(page.locator('#c-mensaje')).toBeVisible();
    await expect(page.locator(`${FORM} [data-siguiente]`)).toBeHidden();
    await page.locator(`${FORM} .opcion`, { hasText: 'Divorcio' }).click();
    await page.fill('#c-mensaje', 'Este es un mensaje de prueba con suficiente longitud.');
    await page.fill('#c-nombre', 'Persona de Prueba');
    await page.fill('#c-correo', 'persona@example.test');
    await page.check('#c-consentimiento');
    await page.click(`${FORM} button[type=submit]`);
    await expect(page).toHaveURL(/consulta-recibida$/);
    await ctx.close();
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
      await mostrarTodo(page);
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      const graves = r.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? '')).map(v => `${v.id}: ${v.nodes.slice(0, 4).map(n => n.target.join(' ')).join(' | ')}`);
      expect(graves).toEqual([]);
    });
  }
});
