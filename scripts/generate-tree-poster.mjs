// Genera la imagen estática del árbol a partir de la escena real, para mostrar cuando no hay animación.
// Requiere el servidor en marcha: BASE=http://127.0.0.1:4321 node scripts/generate-tree-poster.mjs
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const BASE = process.env.BASE || 'http://localhost:4321';
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1800, height: 1400 } });
const page = await ctx.newPage();
// Con las animaciones pausadas, la escena dibuja el árbol completo y quieto.
await page.addInitScript(() => localStorage.setItem('movimiento', 'pausado'));
await page.goto(`${BASE}/?poster`);
await page.waitForFunction(() => window.__arbol?.frames > 0, { timeout: 60000 });
// Espera a que termine el fundido del lienzo.
await page.waitForTimeout(1600);
const z = await page.evaluate(() => {
  document.querySelectorAll('.site-header, .h-hero__content').forEach(e => { e.style.visibility = 'hidden'; });
  return window.__arbol.zona;
});
// Con el movimiento pausado, `visibility` cambia un cuadro más tarde: sin esta espera el titular sale en la imagen.
await page.waitForTimeout(300);
const png = await page.screenshot();
const { width, height } = await sharp(png).metadata();
const alto = z.altura * height;
const base = z.sueloX * width, suelo = z.sueloY * height;
const izq = Math.max(0, Math.round(base - alto * 0.72));
const der = Math.min(width, Math.round(base + alto * 0.72));
const arriba = Math.max(0, Math.round(suelo - alto * 1.02));
const recorte = await sharp(png).extract({ left: izq, top: arriba, width: der - izq, height: Math.round(suelo) - arriba }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
// Fondo transparente: el degradado de la escena no coincide con el color del encabezado y se vería un rectángulo.
const { data, info } = recorte;
const salida = Buffer.alloc(info.width * info.height * 4);
const fondo = [data[0], data[1], data[2]];
for (let i = 0; i < info.width * info.height; i++) {
  const [r, g, b] = [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
  const distancia = Math.max(Math.abs(r - fondo[0]), Math.abs(g - fondo[1]), Math.abs(b - fondo[2]));
  salida[i * 4] = r; salida[i * 4 + 1] = g; salida[i * 4 + 2] = b;
  salida[i * 4 + 3] = Math.min(255, Math.max(0, (distancia - 14) * 5));
}
await sharp(salida, { raw: { width: info.width, height: info.height, channels: 4 } }).webp({ quality: 82, alphaQuality: 90 }).toFile('public/assets/images/arbol-lineas.webp');
console.log('arbol-lineas', der - izq, Math.round(suelo) - arriba);
await browser.close();
