// Prototipos 3D: funcionamiento, respaldos y contraste real del titular sobre cada escena.
import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';

test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);
const CONCEPTOS = ['d', 'a', 'b', 'c'];

const lista = (page: Page, frames = 3) => page.waitForFunction(n => (window as any).__lab?.frames > n, frames, { timeout: 60_000 });

const luminancia = (r: number, g: number, b: number) => {
  const f = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

// Oculta el texto, fotografía el fondo y mide el contraste del color del titular contra cada píxel detrás de sus líneas.
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

for (const c of CONCEPTOS) {
  test(`concepto ${c}: se dibuja sin errores y el titular conserva el contraste`, async ({ page, isMobile }) => {
    const errores: string[] = [];
    page.on('console', m => { if (['error', 'warning'].includes(m.type()) && !/GPU stall|GL Driver Message/.test(m.text())) errores.push(m.text()); });
    page.on('pageerror', e => errores.push(e.message));
    await page.goto(`/laboratorio#${c}`);
    await lista(page);
    await page.waitForTimeout(2600);
    expect(await page.evaluate(() => (window as any).__lab.concepto)).toBe(c);
    const medir = async (momento: string) => {
      const titulo = await contraste(page, '.lab__title');
      const parrafo = await contraste(page, '.lab__foot p');
      console.log(`[contraste] ${c} ${page.viewportSize()!.width}px ${momento}: titular ${titulo.toFixed(2)}:1, párrafo ${parrafo.toFixed(2)}:1`);
      expect(titulo, `titular ${momento}`).toBeGreaterThanOrEqual(3);
      expect(parrafo, `párrafo ${momento}`).toBeGreaterThanOrEqual(4.5);
    };
    await medir('inicio');
    // La luz no debe pasar detrás del menú mientras está en pantalla.
    if (!isMobile) {
      const menu = await contraste(page, '.header-cta');
      console.log(`[contraste] ${c} menú: ${menu.toFixed(2)}:1`);
      expect(menu, 'menú').toBeGreaterThanOrEqual(4.5);
    }

    await page.evaluate(() => scrollTo(0, document.querySelector<HTMLElement>('.lab')!.offsetHeight - innerHeight));
    await page.waitForTimeout(2600);
    await medir('final');

    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    expect(errores).toEqual([]);
  });
}

test('los conceptos se pueden cambiar con botones y teclado', async ({ page }) => {
  await page.goto('/laboratorio#a');
  await lista(page);
  await page.getByRole('button', { name: 'B Luz' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__lab.concepto)).toBe('b');
  await expect(page.getByRole('button', { name: 'B Luz' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('4');
  await expect.poll(() => page.evaluate(() => (window as any).__lab.concepto)).toBe('c');
  await expect(page).toHaveURL(/#c$/);
});

test('pausar detiene el dibujo', async ({ page }) => {
  await page.goto('/laboratorio#c');
  await lista(page);
  await page.locator('[data-pausa]').click();
  const a = await page.evaluate(() => (window as any).__lab.frames);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => (window as any).__lab.frames)).toBe(a);
});

test('sin WebGL muestra el monograma estático y el contenido completo', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, tipo: string, ...r: any[]) {
      return /webgl/.test(tipo) ? null : (original as any).call(this, tipo, ...r);
    } as typeof original;
  });
  await page.goto('/laboratorio');
  await expect(page.locator('.lab__fallback')).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Agendar una consulta' }).first()).toBeVisible();
});

test('con movimiento reducido no hay animación ni secuencia de scroll', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', baseURL });
  const page = await ctx.newPage();
  await page.goto('/laboratorio#a');
  await lista(page, 0);
  const a = await page.evaluate(() => (window as any).__lab.frames);
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => (window as any).__lab.frames)).toBe(a);
  const alturas = await page.evaluate(() => [document.querySelector<HTMLElement>('.lab')!.offsetHeight, innerHeight]);
  expect(alturas[0]).toBe(alturas[1]);
  await ctx.close();
});

test('el laboratorio no se indexa y three.js no llega a otras páginas', async ({ page, request }) => {
  await page.goto('/laboratorio');
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
  expect(await (await request.get('/sitemap.xml')).text()).not.toContain('laboratorio');
  const contextos: string[] = [];
  await page.addInitScript(() => {
    const o = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, t: string, ...r: any[]) {
      (window as any).__gl = true;
      return (o as any).call(this, t, ...r);
    } as typeof o;
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(await page.evaluate(() => (window as any).__gl === true), contextos.join()).toBe(false);
});
