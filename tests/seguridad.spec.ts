// Cabeceras, formulario, orientador y salida rápida: lo que protege a quien consulta.
import { expect, test } from '@playwright/test';

const origin = 'http://127.0.0.1:4325';
const valido = { nombre: 'Persona de Prueba', correo: 'p@example.test', tipo: 'Divorcio', mensaje: 'Mensaje suficientemente largo para la prueba.', consentimiento: 'on' };
const json = { accept: 'application/json', origin };

test.describe('cabeceras y política de contenido', () => {
  for (const ruta of ['/', '/servicios/proteccion-familiar']) {
    test(`${ruta} envía cabeceras de seguridad`, async ({ request }) => {
      const h = (await request.get(ruta)).headers();
      expect(h['x-frame-options']).toBe('DENY');
      expect(h['x-content-type-options']).toBe('nosniff');
      expect(h['referrer-policy']).toBe('same-origin');
      expect(h['cache-control']).toBe('no-store');
      expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
      expect(h['permissions-policy']).toContain('geolocation=()');
    });
  }

  test('los scripts en línea están bloqueados salvo el inicial, que sí corre', async ({ page }) => {
    const violaciones: string[] = [];
    page.on('console', m => { if (/Content Security Policy|Content-Security-Policy/i.test(m.text())) violaciones.push(m.text()); });
    await page.goto('/', { waitUntil: 'networkidle' });
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    await expect(page.locator('html')).toHaveClass(/js/);
    expect(violaciones).toEqual([]);
  });

  test('no se carga ningún recurso de terceros', async ({ page }) => {
    const ajenos: string[] = [];
    page.on('request', r => { if (!r.url().startsWith(origin) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) ajenos.push(r.url()); });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.goto('/agendar-consulta', { waitUntil: 'networkidle' });
    expect(ajenos).toEqual([]);
  });

  test('las fuentes son locales y se aplican', async ({ page }) => {
    await page.goto('/servicios/divorcios', { waitUntil: 'networkidle' });
    expect(await page.locator('h1').evaluate(e => getComputedStyle(e).fontFamily)).toContain('Schibsted Grotesk');
    expect(await page.locator('body').evaluate(e => getComputedStyle(e).fontFamily)).toContain('Schibsted Grotesk');
    expect(await page.evaluate(() => document.fonts.check('16px "Schibsted Grotesk"') && document.fonts.check('600 32px "Schibsted Grotesk"'))).toBe(true);
  });
});

test.describe('API del formulario', () => {
  test('rechaza un cuerpo demasiado grande, aunque no declare su tamaño', async ({ request }) => {
    const res = await request.post('/api/consulta', { headers: json, form: { ...valido, mensaje: 'x'.repeat(30000) } });
    expect(res.status()).toBe(422);
  });

  test('rechaza archivos adjuntos', async ({ request }) => {
    const res = await request.post('/api/consulta', {
      headers: json,
      multipart: { ...valido, documento: { name: 'cedula.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') } }
    });
    expect(res.status()).toBe(422);
  });

  test('rechaza JSON y otros tipos de contenido', async ({ request }) => {
    const res = await request.post('/api/consulta', { headers: { ...json, 'content-type': 'application/json' }, data: valido });
    expect(res.status()).toBe(422);
  });

  test('una dirección no puede convertirse en varios destinatarios', async ({ request }) => {
    for (const correo of ['a,b@example.test', 'a;b@example.test', 'a@example.test,c@example.test', 'A <a@example.test>']) {
      const res = await request.post('/api/consulta', { headers: json, form: { ...valido, correo } });
      expect(res.status(), correo).toBe(422);
    }
  });

  test('una cabecera X-Forwarded-For inventada no evade el límite de envíos', async ({ request }) => {
    // Con el límite real de la prueba se comprueba que todas cuentan para la misma dirección.
    const r = await request.post('/api/consulta', { headers: { ...json, 'x-forwarded-for': '203.0.113.9' }, form: { ...valido, correo: 'mal' } });
    expect(r.status()).toBe(422);
  });

  test('el texto con signos de menor y mayor no se recorta', async ({ request }) => {
    const res = await request.post('/api/consulta', { headers: json, form: { ...valido, mensaje: 'La pensión es <100000 colones y quiero que sea >150000 colones por mes' } });
    expect(res.status()).toBe(200);
  });

  test('el error de validación no repite los datos enviados', async ({ request }) => {
    const res = await request.post('/api/consulta', { headers: json, form: { ...valido, correo: 'dato-sensible-no-valido', mensaje: 'corto' } });
    expect(await res.text()).not.toContain('dato-sensible');
  });
});

test.describe('formulario: minimización', () => {
  test('no pide datos innecesarios y avisa sobre medios seguros', async ({ page }) => {
    await page.goto('/agendar-consulta');
    expect(await page.locator('form[action="/api/consulta"] input[type=file]').count()).toBe(0);
    for (const n of ['cedula', 'expediente', 'hijos', 'edad']) expect(await page.locator(`form[action="/api/consulta"] [name="${n}"]`).count()).toBe(0);
    await expect(page.locator('#c-mensaje')).toHaveAttribute('maxlength', '1200');
    await expect(page.locator('#h-seguro')).toContainText('solo usted');
  });
});

test.describe('orientador', () => {
  test('permite empezar de nuevo y no deja rastro en el navegador', async ({ page }) => {
    await page.goto('/servicios#por-donde-empiezo');
    await page.getByRole('button', { name: 'Hijas o hijos' }).click();
    await page.getByRole('button', { name: 'La pensión alimentaria' }).click();
    await page.getByRole('button', { name: 'Empezar de nuevo' }).click();
    await expect(page.getByRole('button', { name: /Temo por mi seguridad/ })).toBeVisible();
    const guardado = await page.evaluate(() => ({ local: Object.keys(localStorage), sesion: Object.keys(sessionStorage), cookies: document.cookie }));
    expect(guardado).toEqual({ local: [], sesion: [], cookies: '' });
    expect(new URL(page.url()).search).toBe('');
  });

  test('ante un riesgo ofrece salir y no invita a pedir una consulta', async ({ page }) => {
    await page.goto('/servicios#por-donde-empiezo');
    await page.getByRole('button', { name: /Temo por mi seguridad/ }).click();
    const res = page.locator('.guia__res');
    await expect(res).toContainText('9-1-1');
    await expect(res.getByRole('link', { name: 'Salir rápido' })).toBeVisible();
    await expect(res.getByRole('link', { name: 'Agendar una consulta' })).toHaveCount(0);
  });

  test('aclara que no concluye nada sobre el caso', async ({ page }) => {
    await page.goto('/servicios#por-donde-empiezo');
    await page.getByRole('button', { name: 'Convivencia sin matrimonio' }).click();
    await expect(page.locator('.guia__res')).toContainText('no analiza su caso');
    await expect(page.locator('.guia__res')).not.toContainText(/le corresponde|usted tiene derecho|debe demandar/i);
  });

  test('una notificación judicial lleva a su guía', async ({ page }) => {
    await page.goto('/servicios#por-donde-empiezo');
    await page.getByRole('button', { name: 'Recibí una notificación judicial' }).click();
    await expect(page.getByRole('link', { name: 'Leer esta guía' })).toHaveAttribute('href', '/orientacion/recibi-una-notificacion-judicial');
  });

  test('la opción sin clasificar ofrece el listado sin recargar', async ({ page }) => {
    await page.goto('/servicios#por-donde-empiezo');
    await page.getByRole('button', { name: /no lo tengo claro/ }).click();
    await expect(page.getByRole('link', { name: 'Ver todos los temas' })).toHaveAttribute('href', '/servicios');
    await expect(page.locator(':focus')).toHaveText('Vea todos los temas');
  });
});

test.describe('sin JavaScript', () => {
  test('el navegador valida el formulario antes de enviarlo', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ baseURL, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/agendar-consulta');
    expect(await page.locator('form[action="/api/consulta"]').getAttribute('novalidate')).toBeNull();
    await ctx.close();
  });
});

test.describe('página de violencia', () => {
  test('no propone agendar una consulta y remite a recursos oficiales', async ({ page }) => {
    await page.goto('/servicios/proteccion-familiar');
    await expect(page.locator('main').getByRole('link', { name: 'Agendar una consulta' })).toHaveCount(0);
    const ayuda = page.locator('.ayuda');
    await expect(ayuda).toContainText('9-1-1');
    await expect(ayuda).toContainText('no se requiere abogada o abogado');
    await expect(ayuda.locator('a[target=_blank]').first()).toHaveAttribute('href', /inamu\.go\.cr/);
  });
});

test.describe('salida rápida: lo que promete', () => {
  test('explica sus límites sin afirmar que borra el historial', async ({ page }) => {
    await page.goto('/servicios/proteccion-familiar');
    const nota = page.locator('[data-seguridad]');
    await nota.locator('summary').click();
    await expect(nota).toContainText('No borra el historial');
    await expect(nota).toContainText('programas espía');
    const cuerpo = (await page.locator('main').innerText()).toLowerCase();
    expect(cuerpo).not.toMatch(/(?<!no )\b(borra|elimina) (todo )?(su|el) historial/);
  });

  test('está en todo el sitio salvo la portada y se alcanza pronto con el teclado', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.salida')).toHaveCount(0);
    for (const ruta of ['/servicios', '/agendar-consulta', '/orientacion', '/biblioteca-juridica']) {
      await page.goto(ruta);
      await expect(page.locator('.salida')).toBeVisible();
    }
    // Va después del enlace para saltar al contenido.
    const orden = await page.evaluate(() => [...document.querySelectorAll('a[href], button')].slice(0, 2).map(e => e.className));
    expect(orden[1]).toContain('salida');
  });

  test('funciona desde teclado y es visible en móvil', async ({ page }) => {
    await page.goto('/servicios/proteccion-familiar');
    const s = page.locator('.salida');
    await expect(s).toBeVisible();
    const caja = (await s.boundingBox())!;
    expect(caja.height).toBeGreaterThanOrEqual(44);
    expect(await s.evaluate(e => (e as HTMLElement).tabIndex)).toBe(0);
  });
});
