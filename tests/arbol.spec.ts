// Escena del árbol en la portada: funcionamiento, respaldos y contraste real del titular sobre el lienzo.
import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';

test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);

const lista = (page: Page, frames = 3) => page.waitForFunction(n => (window as any).__arbol?.frames > n, frames, { timeout: 60_000 });

// El hero reserva su última pantalla para que la sección siguiente lo cubra: aquí termina el crecimiento.
const irAlFinal = (page: Page) => page.evaluate(() => {
  scrollTo({ top: document.querySelector<HTMLElement>('.h-hero')!.offsetHeight - innerHeight * 2, behavior: 'instant' });
});

const luminancia = (r: number, g: number, b: number) => {
  const f = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

// Oculta el texto, fotografía el fondo y mide el contraste del color del texto contra cada píxel detrás de sus líneas.
async function contraste(page: Page, selector: string) {
  const { rects, color } = await page.evaluate(sel => {
    const t = document.querySelector<HTMLElement>(sel)!;
    const r = document.createRange();
    r.selectNodeContents(t);
    const rects = [...r.getClientRects()].map(q => ({ x: q.x, y: q.y, width: q.width, height: q.height }));
    const color = getComputedStyle(t).color.match(/\d+/g)!.map(Number);
    t.style.visibility = 'hidden';
    return { rects, color };
  }, selector);
  const img = await page.screenshot();
  await page.evaluate(sel => { document.querySelector<HTMLElement>(sel)!.style.visibility = ''; }, selector);
  const { data, info } = await sharp(img).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const texto = luminancia(color[0], color[1], color[2]);
  const valores: number[] = [];
  // La captura está en píxeles físicos; los rectángulos, en píxeles CSS.
  const k = info.width / page.viewportSize()!.width;
  for (const q of rects) {
    for (let y = Math.max(0, Math.round(q.y * k)); y < Math.min(info.height, (q.y + q.height) * k); y += 2) {
      for (let x = Math.max(0, Math.round(q.x * k)); x < Math.min(info.width, (q.x + q.width) * k); x += 2) {
        const i = (y * info.width + x) * info.channels;
        const fondo = luminancia(data[i], data[i + 1], data[i + 2]);
        valores.push((Math.max(texto, fondo) + 0.05) / (Math.min(texto, fondo) + 0.05));
      }
    }
  }
  valores.sort((a, b) => a - b);
  return valores[Math.floor(valores.length * 0.01)];
}

test('se dibuja sin errores y el texto conserva el contraste', async ({ page, isMobile }) => {
  const errores: string[] = [];
  page.on('console', m => { if (['error', 'warning'].includes(m.type()) && !/GPU stall|GL Driver Message/.test(m.text())) errores.push(m.text()); });
  page.on('pageerror', e => errores.push(e.message));
  await page.goto('/');
  await lista(page);
  await page.waitForTimeout(2600);
  const medir = async (momento: string) => {
    const titulo = await contraste(page, '.h-hero__title');
    const parrafo = await contraste(page, '.h-hero__foot p');
    console.log(`[contraste] ${page.viewportSize()!.width}px ${momento}: titular ${titulo.toFixed(2)}:1, párrafo ${parrafo.toFixed(2)}:1`);
    expect(titulo, `titular ${momento}`).toBeGreaterThanOrEqual(3);
    expect(parrafo, `párrafo ${momento}`).toBeGreaterThanOrEqual(4.5);
  };
  await medir('inicio');
  // La luz no debe pasar detrás del menú mientras está en pantalla.
  if (!isMobile) {
    const menu = await contraste(page, '.header-cta');
    console.log(`[contraste] menú: ${menu.toFixed(2)}:1`);
    expect(menu, 'menú').toBeGreaterThanOrEqual(4.5);
  }

  await irAlFinal(page);
  await page.waitForTimeout(2600);
  await medir('final');

  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(errores).toEqual([]);
});

test('el titular conserva el contraste en pantalla grande', async ({ page, isMobile }) => {
  test.skip(isMobile, 'solo escritorio');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  await lista(page);
  await page.waitForTimeout(6500);
  await irAlFinal(page);
  await page.waitForTimeout(2500);
  const titulo = await contraste(page, '.h-hero__title');
  console.log(`[contraste] 1920px final: titular ${titulo.toFixed(2)}:1`);
  expect(titulo).toBeGreaterThanOrEqual(3);
});

test('sin WebGL muestra el contenido completo y la imagen del árbol', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, tipo: string, ...r: any[]) {
      return /webgl/.test(tipo) ? null : (original as any).call(this, tipo, ...r);
    } as typeof original;
  });
  await page.goto('/');
  await expect(page.locator('.h-hero canvas')).toBeHidden();
  await expect(page.locator('.h-hero__poster')).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Agendar una consulta' }).first()).toBeVisible();
});

// Las hojas caídas son doradas; solo el titular aportaría píxeles marfil en esa esquina.
test('la imagen de reserva no incluye texto del titular', async () => {
  const archivo = process.env.POSTER ?? 'public/assets/images/arbol-lineas.webp';
  const { width, height } = await sharp(archivo).metadata();
  const { data, info } = await sharp(archivo)
    .extract({ left: 0, top: Math.round(height * 0.6), width: Math.round(width * 0.2), height: Math.round(height * 0.4) })
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let marfil = 0;
  for (let i = 0; i < data.length; i += info.channels) if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 190) marfil++;
  expect(marfil).toBe(0);
});

test('con movimiento reducido no hay secuencia de scroll', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', baseURL });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('.h-hero')).toHaveClass(/sin-3d/);
  const [hero, pantalla] = await page.evaluate(() => [document.querySelector<HTMLElement>('.h-hero')!.offsetHeight, innerHeight]);
  expect(hero).toBeLessThan(pantalla * 1.5);
  await ctx.close();
});

test('el laboratorio ya no existe y three.js no llega a otras páginas', async ({ page, request }) => {
  expect((await request.get('/laboratorio')).status()).toBe(404);
  expect(await (await request.get('/sitemap.xml')).text()).not.toContain('laboratorio');
  await page.addInitScript(() => {
    const o = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, t: string, ...r: any[]) {
      (window as any).__gl = true;
      return (o as any).call(this, t, ...r);
    } as typeof o;
  });
  await page.goto('/servicios', { waitUntil: 'networkidle' });
  expect(await page.evaluate(() => (window as any).__gl === true)).toBe(false);
});
