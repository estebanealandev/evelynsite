// Aplica cada propuesta sobre el sitio real, solo en memoria. No toca ningún archivo del sitio.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROPUESTAS } from './marcas.mjs';
import { navegador, cerrar, RAIZ } from './comun.mjs';
import { AQUI } from './lib.mjs';
const SITIO = 'http://localhost:4321';
const svgDe = (id, n) => readFileSync(join(RAIZ, `propuesta-${id}/aplicaciones/${n}`));
const FUENTES = { a: ['SchibstedGrotesk.ttf', '400 900', ''], b: ['Archivo.ttf', '100 900', 'font-stretch:62% 125%;'], c: ['FamiljenGrotesk.ttf', '400 700', ''] };
const estilos = id => { const c = PROPUESTAS[id].color, [f, w, st] = FUENTES[id];
  return `@font-face{font-family:'Marca';src:url(/__marca/${f});font-weight:${w};${st}font-display:block}:root{--color-primary:${c.o};--color-secondary:${c.n2};--color-accent:${c.s};--color-accent-text:${c.n2};--color-accent-soft:${c.c};--color-background:${c.p};--color-text:${c.o};--color-muted:${c.n2};--color-on-dark:${c.s};--color-on-dark-muted:${c.s};--font-serif:'Marca',sans-serif;--font-sans:'Marca',sans-serif}h1,h2,h1 *,h2 *{font-weight:600;letter-spacing:-.03em;font-style:normal!important${id === 'b' ? ';font-stretch:125%' : ''}}`; };
const v3 = h => `vec3(${[1, 3, 5].map(i => (parseInt(h.slice(i, i + 2), 16) / 255).toFixed(3)).join(',')})`;
const hexNum = h => String(parseInt(h.slice(1), 16));
async function pagina(ctx, id, conPaleta) {
  const p = await ctx.newPage(), c = PROPUESTAS[id].color;
  await p.route('**/assets/brand/evelyn-elizondo-navbar-dark.svg', r => r.fulfill({ contentType: 'image/svg+xml', body: svgDe(id, 'cabecera-oscuro.svg') }));
  await p.route('**/assets/brand/evelyn-elizondo-navbar.svg', r => r.fulfill({ contentType: 'image/svg+xml', body: svgDe(id, 'cabecera-claro.svg') }));
  if (conPaleta) {
    await p.route(/\/_astro\/.*\.js/, async r => { const res = await r.fetch(); await r.fulfill({ response: res, body: (await res.text()).replace(/1321022/g, hexNum(c.o)).replace(/vec3\(\.95,\.72,\.42\)|vec3\(\.85,\.7,\.42\)/g, v3(c.s)).replace(/vec4\(\.84,\.68,\.38,/g, v3(c.s).replace('vec3(', 'vec4(').replace(')', ',')) }); });
    await p.route(/\/_astro\/.*\.css/, async r => { const res = await r.fetch(); const [R, G, B] = [1, 3, 5].map(i => parseInt(c.o.slice(i, i + 2), 16)); await r.fulfill({ response: res, body: (await res.text()).replace(/#14283e/gi, c.o).replace(/rgb\(20 40 62/g, `rgb(${R} ${G} ${B}`) }); });
    await p.route('**/__marca/*', r => r.fulfill({ contentType: 'font/ttf', body: readFileSync(join(AQUI, 'fuentes', r.request().url().split('/').pop())) }));
  }
  return p;
}
const b = await navegador();
for (const id of process.argv[2]?.split(',') ?? Object.keys(PROPUESTAS)) {
  const dir = join(RAIZ, `propuesta-${id}/aplicaciones`);
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, bypassCSP: true });
  let p = await pagina(ctx, id, false);
  await p.goto(SITIO + '/', { waitUntil: 'load' }); await p.waitForTimeout(10000);
  await p.screenshot({ path: join(dir, 'portada-actual-con-logo.png') });
  await p.screenshot({ path: join(dir, 'cabecera-sobre-portada.png'), clip: { x: 0, y: 0, width: 1440, height: 100 } });
  await p.goto(SITIO + '/servicios/divorcios', { waitUntil: 'load' }).catch(() => {}); await p.waitForTimeout(700);
  await p.evaluate(() => document.querySelector('.site-header')?.classList.add('is-solid')); await p.waitForTimeout(500);
  await p.screenshot({ path: join(dir, 'cabecera-pagina-interior.png'), clip: { x: 0, y: 0, width: 1440, height: 100 } });
  await p.close(); await ctx.close();
  const c2 = await b.newContext({ viewport: { width: 1440, height: 900 }, bypassCSP: true });
  p = await pagina(c2, id, true);
  await p.goto(SITIO + '/', { waitUntil: 'load' }); await p.addStyleTag({ content: estilos(id) }); await p.waitForTimeout(10000);
  await p.screenshot({ path: join(dir, 'portada-con-paleta-propia.png') });
  await p.close(); await c2.close();
  const c3 = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, bypassCSP: true, isMobile: true, hasTouch: true });
  p = await pagina(c3, id, false);
  await p.goto(SITIO + '/', { waitUntil: 'load' }); await p.waitForTimeout(9000);
  await p.screenshot({ path: join(dir, 'portada-movil.png') });
  await p.close(); await c3.close();
  console.log('capturas', id);
}
await cerrar();
