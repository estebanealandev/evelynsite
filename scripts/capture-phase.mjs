// Guarda capturas y métricas de una fase para compararla con la anterior.
// Uso: BASE=http://localhost:4321 node scripts/capture-phase.mjs fase-1
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const fase = process.argv[2];
if (!fase) throw new Error('Indique el nombre de la fase.');
const BASE = process.env.BASE || 'http://localhost:4321';
const SHOTS = path.join('docs/reference/screenshots/fases', fase);
fs.mkdirSync(SHOTS, { recursive: true });

const RUTAS = ['/', '/servicios', '/servicios/divorcios', '/servicios/proteccion-familiar', '/sobre-evelyn', '/blog', '/blog/cambios-codigo-procesal-familia', '/contacto', '/agendar-consulta', '/politica-de-privacidad', '/esta-ruta-no-existe'];
const ANCHOS = [1440, 768, 390];
const metricas = {};

const browser = await chromium.launch({ channel: 'chrome' });
for (const w of ANCHOS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w > 800 ? 900 : 844 } });
  const page = await ctx.newPage();
  for (const ruta of RUTAS) {
    await page.goto(BASE + ruta, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); }
      scrollTo(0, 0);
    });
    await page.waitForTimeout(250);
    const nombre = `${ruta === '/' ? 'portada' : ruta.slice(1).replace(/\//g, '_')}-${w}`;
    await sharp(await page.screenshot({ fullPage: true }), { limitInputPixels: false }).webp({ quality: 65 }).toFile(path.join(SHOTS, `${nombre}.webp`));
    metricas[nombre] = await page.evaluate(() => {
      const main = document.querySelector('main');
      const fs = s => { const e = document.querySelector(s); return e ? parseFloat(getComputedStyle(e).fontSize) : null; };
      return {
        alto: document.documentElement.scrollHeight,
        modulos: [...main.children].filter(e => e.getBoundingClientRect().height > 30).length,
        h1: fs('h1'),
        h2: fs('main h2:not(.visually-hidden)'),
        cabecera: Math.round(document.querySelector('.site-header').getBoundingClientRect().height),
        pie: Math.round(document.querySelector('footer').getBoundingClientRect().height),
        scrollHorizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });
  }
  await ctx.close();
}
await browser.close();
fs.mkdirSync('docs/reference/fases', { recursive: true });
fs.writeFileSync(`docs/reference/fases/${fase}.json`, JSON.stringify(metricas, null, 1) + '\n');
console.log(`${fase}: ${Object.keys(metricas).length} capturas`);
for (const k of ['portada-1440', 'portada-390', 'servicios_divorcios-1440']) console.log(k, JSON.stringify(metricas[k]));
