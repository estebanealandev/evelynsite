// Genera la imagen estática del árbol a partir de la escena real, para mostrar mientras carga y sin animación.
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
await sharp(png).extract({ left: izq, top: arriba, width: der - izq, height: Math.round(suelo) - arriba }).webp({ quality: 82 }).toFile('public/assets/images/arbol-lineas.webp');
console.log('arbol-lineas', der - izq, Math.round(suelo) - arriba);
await browser.close();
