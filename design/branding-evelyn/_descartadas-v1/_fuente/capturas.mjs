// Aplica cada propuesta sobre el sitio real en una copia en memoria: no toca ningún archivo del sitio.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PROPUESTAS } from './marcas.mjs';
import { navegador, cerrar, RAIZ, escribir } from './comun.mjs';
import { AQUI } from './lib.mjs';
const SITIO = 'http://localhost:4321';
const svgDe = (id, n) => readFileSync(join(RAIZ, `propuesta-${id}/aplicaciones/${n}`));
const PALETA = {
  a: { '--color-primary': '#2A1826', '--color-secondary': '#44303F', '--color-accent': '#BFA374', '--color-accent-text': '#7A5F36', '--color-accent-soft': '#E7DCC8', '--color-background': '#F1ECE3', '--color-text': '#272025', '--color-muted': '#6B6068', '--color-on-dark': '#F1ECE3', '--color-on-dark-muted': '#D3C9CF', '--font-serif': "'Marca Titular', serif", '--font-sans': "'Marca Texto', sans-serif" },
  b: { '--color-primary': '#1D3128', '--color-secondary': '#33493E', '--color-accent': '#D98A64', '--color-accent-text': '#8A4628', '--color-accent-soft': '#E9D9C8', '--color-background': '#F3EEE4', '--color-text': '#222A25', '--color-muted': '#5F6A62', '--color-on-dark': '#F3EEE4', '--color-on-dark-muted': '#CDD5CE', '--font-serif': "'Marca Titular', serif", '--font-sans': "'Marca Texto', sans-serif" },
  c: { '--color-primary': '#1B1916', '--color-secondary': '#35312B', '--color-accent': '#E2583F', '--color-accent-text': '#B5301C', '--color-accent-soft': '#EEDFD0', '--color-background': '#F7F3EA', '--color-text': '#1F1D1A', '--color-muted': '#68635B', '--color-on-dark': '#F7F3EA', '--color-on-dark-muted': '#D3CEC4', '--font-serif': "'Marca Titular', serif", '--font-sans': "'Marca Texto', sans-serif" },
};
const FUENTES = {
  a: [['Marca Titular', 'BodoniModa.ttf', 'normal', '400 900'], ['Marca Titular', 'BodoniModa-Italic.ttf', 'italic', '400 900'], ['Marca Texto', 'InstrumentSans.ttf', 'normal', '400 700']],
  b: [['Marca Titular', 'TenorSans.ttf', 'normal', '400'], ['Marca Texto', 'HankenGrotesk.ttf', 'normal', '100 900']],
  c: [['Marca Titular', 'IbarraRealNova.ttf', 'normal', '400 700'], ['Marca Titular', 'IbarraRealNova-Italic.ttf', 'italic', '400 700'], ['Marca Texto', 'SourceSerif4.ttf', 'normal', '200 900']],
};
const CLEAR = { a: '0x2a1826', b: '0x1d3128', c: '0x1b1916' };

async function pagina(ctx, id, conPaleta) {
  const p = await ctx.newPage();
  await p.route('**/assets/brand/evelyn-elizondo-navbar-dark.svg', r => r.fulfill({ contentType: 'image/svg+xml', body: svgDe(id, 'cabecera-oscuro.svg') }));
  await p.route('**/assets/brand/evelyn-elizondo-navbar.svg', r => r.fulfill({ contentType: 'image/svg+xml', body: svgDe(id, 'cabecera-claro.svg') }));
  await p.route('**/favicon.svg', r => r.fulfill({ contentType: 'image/svg+xml', body: readFileSync(join(RAIZ, `propuesta-${id}/favicon/favicon.svg`)) }));
  if (conPaleta) {
    await p.route(/\/_astro\/.*\.js/, async r => {
      const res = await r.fetch(); let t = await res.text();
      t = t.replace(/0x14283e|1321022/g, String(parseInt(CLEAR[id], 16)));
      await r.fulfill({ response: res, body: t });
    });
    // Algunos tonos del sitio están escritos como literal en el CSS: en esta vista se sustituyen en memoria.
    await p.route(/\/_astro\/.*\.css/, async r => {
      const res = await r.fetch(); let t = await res.text();
      const h = PALETA[id]['--color-primary']; const [R, G, B] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
      t = t.replace(/#14283e/gi, h).replace(/rgb\(20 40 62/g, `rgb(${R} ${G} ${B}`).replace(/rgba\(20,\s*40,\s*62/g, `rgba(${R},${G},${B}`);
      await r.fulfill({ response: res, body: t });
    });
    await p.route('**/__marca/*', r => r.fulfill({ contentType: 'font/ttf', body: readFileSync(join(AQUI, 'fuentes', r.request().url().split('/').pop())) }));
  }
  return p;
}
const estilos = (id) => {
  const ff = FUENTES[id].map(([f, a, s, w]) => `@font-face{font-family:'${f}';src:url(/__marca/${a});font-style:${s};font-weight:${w};font-display:block}`).join('');
  const vars = Object.entries(PALETA[id]).map(([k, v]) => `${k}:${v}`).join(';');
  const extra = id === 'b' ? 'h1 em,h1 i,.statement em{font-style:normal;color:var(--color-accent)}' : id === 'a' ? "h1,h2,h3,.h-hero *{font-optical-sizing:none;font-variation-settings:'opsz' 20}" : '';
  return `${ff}:root{${vars}}${extra}`;
};
const b = await navegador();
for (const id of Object.keys(PROPUESTAS)) {
  const dir = join(RAIZ, `propuesta-${id}/aplicaciones`);
  // 1. Logo sobre la portada actual, sin cambiar nada más.
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, bypassCSP: true });
  let p = await pagina(ctx, id, false);
  await p.goto(SITIO + '/', { waitUntil: 'load' }); await p.waitForTimeout(10000);
  await p.screenshot({ path: join(dir, 'portada-actual-con-logo.png') });
  await p.screenshot({ path: join(dir, 'cabecera-sobre-portada.png'), clip: { x: 0, y: 0, width: 1440, height: 100 } });
  // 2. Cabecera sólida de una página interior.
  await p.goto(SITIO + '/servicios/divorcio', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(700);
  await p.evaluate(() => { document.querySelector('.site-header')?.classList.add('is-solid'); });
  await p.waitForTimeout(500);
  await p.screenshot({ path: join(dir, 'cabecera-pagina-interior.png'), clip: { x: 0, y: 0, width: 1440, height: 100 } });
  await p.close(); await ctx.close();
  // 3. Portada con la paleta y las fuentes de la propuesta.
  const ctx2 = await b.newContext({ viewport: { width: 1440, height: 900 }, bypassCSP: true });
  p = await pagina(ctx2, id, true);
  await p.goto(SITIO + '/', { waitUntil: 'load' }); await p.addStyleTag({ content: estilos(id) }); await p.waitForTimeout(10000);
  await p.screenshot({ path: join(dir, 'portada-con-paleta-propia.png') });
  await p.close(); await ctx2.close();
  // 4. Móvil.
  const ctx3 = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, bypassCSP: true, isMobile: true, hasTouch: true });
  p = await pagina(ctx3, id, false);
  await p.goto(SITIO + '/', { waitUntil: 'load' }); await p.waitForTimeout(9000);
  await p.screenshot({ path: join(dir, 'portada-movil.png') });
  await p.close(); await ctx3.close();
  console.log('capturas', id);
}
// 5. Escenas de papelería con la misma mesa, escala y disposición para las tres.
const escena = (id, cuerpo, w, h) => `<!doctype html><base href="file://${RAIZ}/propuesta-${id}/"><style>body{margin:0;width:${w}px;height:${h}px;background:#D9D5CD;position:relative;overflow:hidden}img{position:absolute;display:block;box-shadow:0 1px 1px rgb(40 30 20/.16),0 12px 26px rgb(40 30 20/.2)}</style>${cuerpo}`;
for (const id of Object.keys(PROPUESTAS)) {
  const pg = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const a4 = 'papeleria/hoja-membretada-a4.svg';
  const html = escena(id, `
    <img src="${a4}" style="left:120px;top:70px;width:610px;height:862px">
    <img src="papeleria/sobre-dl-reverso.svg" style="left:800px;top:60px;width:640px;height:320px">
    <img src="papeleria/sobre-dl-anverso.svg" style="left:860px;top:350px;width:640px;height:320px">
    <img src="papeleria/tarjeta-reverso.svg" style="left:820px;top:700px;width:340px;height:220px">
    <img src="papeleria/tarjeta-anverso.svg" style="left:1190px;top:700px;width:340px;height:220px">`, 1600, 1000);
  await pg.goto('about:blank');
  const f = join(RAIZ, `_fuente/.tmp-${id}.html`); escribir(`_fuente/.tmp-${id}.html`, html);
  await pg.goto('file://' + f); await pg.waitForTimeout(400);
  await pg.screenshot({ path: join(RAIZ, `propuesta-${id}/aplicaciones/papeleria.png`) });
  const html2 = escena(id, `<img src="papeleria/tarjeta-anverso.svg" style="left:90px;top:230px;width:680px;height:440px"><img src="papeleria/tarjeta-reverso.svg" style="left:830px;top:230px;width:680px;height:440px">`, 1600, 900);
  escribir(`_fuente/.tmp-${id}.html`, html2);
  await pg.setViewportSize({ width: 1600, height: 900 }); await pg.goto('file://' + f); await pg.waitForTimeout(300);
  await pg.screenshot({ path: join(RAIZ, `propuesta-${id}/aplicaciones/tarjeta.png`) });
  await pg.close();
}
await cerrar();
