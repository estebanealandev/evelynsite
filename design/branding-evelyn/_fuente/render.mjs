// Renderiza los mockups con Chrome y three.js. Uso: node render.mjs [ids] [escenas] [ancho] [muestras]
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROPUESTAS } from './marcas.mjs';
import { chromium, RAIZ, png, cerrar } from './comun.mjs';
import { AQUI } from './lib.mjs';
const [,, idsA = 'a,b,c', escA = 'hero,tarjetas,papeleria,letrero,portatil', wA = '1800', nA = '96', destino = ''] = process.argv;
const TH = '/home/esteban/Escritorio/evelynsite/node_modules/three/';
const TEX = join(AQUI, '.tex');
const PIEZAS = { 'tarjeta-anverso': 1700, 'tarjeta-reverso': 1700, 'hoja-membretada-a4': 2100, 'sobre-dl-anverso': 2200, 'sobre-dl-reverso': 2200, carpeta: 2200, libreta: 2000, telefono: 1800 };
const dim = t => { const m = t.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/); return [+m[1], +m[2]]; };
for (const id of idsA.split(',')) for (const [n, lado] of Object.entries(PIEZAS)) {
  const d = join(TEX, id); mkdirSync(d, { recursive: true });
  const svg = readFileSync(join(RAIZ, `propuesta-${id}/papeleria/${n}.svg`), 'utf8'), [W, H] = dim(svg);
  const r = `_fuente/.tex/${id}/${n}.png`; await png(svg, W, H, r, { lado });
}
await cerrar();
const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist'], env: { ...process.env, __NV_PRIME_RENDER_OFFLOAD: '1', __GLX_VENDOR_LIBRARY_NAME: 'nvidia' } });
const MIME = { js: 'text/javascript', png: 'image/png', svg: 'image/svg+xml', html: 'text/html' };
const servir = async r => {
  const u = new URL(r.request().url()); let f;
  if (u.pathname === '/') return r.fulfill({ contentType: 'text/html', body: `<!doctype html><body style="margin:0"><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script><script type="module" src="/escena.js"></script>` });
  if (u.pathname === '/escena.js') f = join(AQUI, 'render/escena.js');
  else if (u.pathname.startsWith('/three/')) f = TH + u.pathname.slice(7);
  else if (u.pathname.startsWith('/tex/')) { const [, , id, n] = u.pathname.split('/'); f = n === 'portada-sitio.png' ? join(RAIZ, `propuesta-${id}/aplicaciones/portada-con-paleta-propia.png`) : join(TEX, id, n); }
  else if (u.pathname.startsWith('/logo/')) f = join(RAIZ, `propuesta-${u.pathname.split('/')[2][0]}/logos/svg/principal-horizontal-claro.svg`);
  else return r.fulfill({ status: 404, body: '' });
  r.fulfill({ contentType: MIME[f.split('.').pop()] ?? 'application/octet-stream', body: readFileSync(f) });
};
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
for (const id of idsA.split(',')) for (const esc of escA.split(',')) for (let intento = 0; intento < 4; intento++) {
  const W = +wA, H = Math.round(W * (esc === 'letrero' ? .56 : .68));
  const c = PROPUESTAS[id].color, col = { ...c, paredRGB: rgb(c.c).map(v => v - 8) };
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.route('http://render.test/**', servir);
  const t0 = Date.now();
  await p.goto(`http://render.test/?id=${id}&esc=${esc}&w=${W}&h=${H}&n=${nA}&col=${encodeURIComponent(JSON.stringify(col))}`);
  await p.waitForFunction(() => window.__fin, null, { timeout: 900000 }).catch(e => errs.push('tiempo agotado'));
  const data = await p.evaluate(() => window.__fin);
  if (data) { const dest = destino ? join(destino, `${id}-${esc}.png`) : join(RAIZ, `propuesta-${id}/aplicaciones/${esc}.png`); mkdirSync(join(dest, '..'), { recursive: true }); writeFileSync(dest, Buffer.from(data.split(',')[1], 'base64')); }
  console.log(id, esc, ((Date.now() - t0) / 1000).toFixed(0) + 's', errs.slice(0, 3).join(' | '));
  await p.close();
  // La primera imagen de una sesión de GPU a veces sale en blanco: se repite si no hay contenido.
  if (data && data.length > 300000 * (W / 1400)) break;
  console.log('  repetir', id, esc, data?.length);
}
await b.close();
