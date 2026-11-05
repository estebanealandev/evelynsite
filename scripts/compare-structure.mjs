// Mide la implementación y la compara con las métricas capturadas del sitio de referencia.
// Genera docs/reference/structure-comparison.md y capturas en docs/reference/screenshots/.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const ref = JSON.parse(fs.readFileSync('docs/reference/metrics.json', 'utf8'));
const SHOTS = 'docs/reference/screenshots/implementacion';
fs.mkdirSync(SHOTS, { recursive: true });

const MAPA = [
  ['home', '/', 'Portada'],
  ['about', '/sobre-evelyn', 'Sobre / About'],
  ['divorce', '/servicios/divorcios', 'Servicio: divorcio'],
  ['child-custody-support', '/servicios/guarda-crianza', 'Servicio: guarda'],
  ['prenuptial-agreements', '/servicios/acuerdos-familiares', 'Servicio: acuerdos'],
  ['contact', '/contacto', 'Contacto'],
  ['schedule-a-consultation', '/agendar-consulta', 'Agendar'],
  ['blog', '/blog', 'Blog'],
  ['blog_prenup-101', '/blog/divorcio-mutuo-consentimiento-costa-rica', 'Artículo'],
  ['privacy-policy', '/politica-de-privacidad', 'Privacidad'],
  ['terms-conditions', '/aviso-juridico', 'Aviso jurídico'],
  ['esta-ruta-no-existe', '/esta-ruta-no-existe', '404']
];
const ANCHOS = [1440, 768, 375];
const px = v => (v ? parseFloat(v) : null);
const pct = (a, b) => (a && b ? ((a - b) / b) * 100 : null);
const fmt = (v, d = 0) => (v === null || v === undefined ? 'n/d' : Number(v).toFixed(d));

function refMetrics(m) {
  const secs = m.sections.filter(s => s.tag === 'SECTION');
  const heads = m.sections.flatMap(s => s.heads);
  const h1 = heads.find(h => h.tag === 'H1');
  const h2 = heads.filter(h => h.tag === 'H2').find(h => parseFloat(h.fs) < 100);
  const footer = m.sections.find(s => s.tag === 'FOOTER');
  const firstMain = secs.find(s => s.rect.y > 0 && s.rect.h < m.docH * 0.6);
  return { docH: m.docH, sections: secs.filter(s => s.rect.h < m.docH * 0.6).length, header: m.header?.rect.h, hero: firstMain?.rect.h, h1: px(h1?.fs), h1Y: h1?.rect.y, h2: px(h2?.fs), p: px(m.p?.fs), lh: px(m.p?.lh), footer: footer?.rect.h };
}

const browser = await chromium.launch({ channel: 'chrome' });
const filas = [];
for (const w of ANCHOS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w > 800 ? 900 : 812 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const [clave, ruta, nombre] of MAPA) {
    const r = ref[`${clave}-${w}`];
    await page.goto(BASE + ruta, { waitUntil: 'networkidle' });
    const n = await page.evaluate(() => {
      const fs = e => (e ? parseFloat(getComputedStyle(e).fontSize) : null);
      const main = document.querySelector('main');
      const kids = [...main.children].filter(e => e.getBoundingClientRect().height > 30);
      const h1 = document.querySelector('h1');
      const p = [...main.querySelectorAll('p')].find(e => e.textContent.trim().length > 60);
      return {
        docH: document.documentElement.scrollHeight,
        sections: kids.length,
        header: document.querySelector('.site-header').getBoundingClientRect().height,
        hero: kids[0]?.getBoundingClientRect().height,
        h1: fs(h1),
        h1Y: h1 ? h1.getBoundingClientRect().y + scrollY : null,
        h2: fs(main.querySelector('h2:not(.visually-hidden)')),
        p: fs(p),
        lh: p ? parseFloat(getComputedStyle(p).lineHeight) : null,
        footer: document.querySelector('footer').getBoundingClientRect().height,
        scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });
    const nombreArchivo = `${(ruta === '/' ? 'portada' : ruta.slice(1).replace(/\//g, '_'))}-${w}`;
    const buf = await page.screenshot({ fullPage: true });
    await sharp(buf).webp({ quality: 62 }).toFile(path.join(SHOTS, `${nombreArchivo}.webp`));
    const rm = r && !r.error ? refMetrics(r) : null;
    filas.push({ w, nombre, ruta, n, r: rm });
  }
  await ctx.close();
}
await browser.close();

let md = `# Comparación estructural medida\n\n**Documento interno.** Generado por \`npm run test:visual\`. Compara dimensiones y tipografía de la implementación con las del sitio de referencia (4 de noviembre de 2026).\n\nUna comparación píxel a píxel no tiene sentido aquí, porque cambian de forma deliberada las imágenes, la tipografía, los colores y los textos. Esta tabla mide, por lo tanto, **similitud estructural, no identidad visual**. No debe leerse como un porcentaje de fidelidad global.\n\n`;
for (const w of ANCHOS) {
  md += `## ${w} px\n\n| Página | Alto ref. | Alto impl. | Dif. | Cabecera ref./impl. | H1 ref./impl. | H2 ref./impl. | Párrafo ref./impl. | Pie ref./impl. | Scroll horiz. |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n`;
  for (const f of filas.filter(x => x.w === w)) {
    const { n, r } = f;
    md += `| ${f.nombre} | ${fmt(r?.docH)} | ${fmt(n.docH)} | ${fmt(pct(n.docH, r?.docH))} % | ${fmt(r?.header)}/${fmt(n.header)} | ${fmt(r?.h1, 1)}/${fmt(n.h1, 1)} | ${fmt(r?.h2, 1)}/${fmt(n.h2, 1)} | ${fmt(r?.p, 1)}/${fmt(n.p, 1)} | ${fmt(r?.footer)}/${fmt(n.footer)} | ${n.scroll} |\n`;
  }
  md += '\n';
}
const difs = filas.map(f => Math.abs(pct(f.n.docH, f.r?.docH) ?? NaN)).filter(Number.isFinite);
md += `## Resumen\n\n- Desviación media absoluta del alto de página: ${(difs.reduce((a, b) => a + b, 0) / difs.length).toFixed(1)} %.\n- Mayor desviación: ${Math.max(...difs).toFixed(1)} %.\n- Páginas con scroll horizontal: ${filas.filter(f => f.n.scroll > 0).length}.\n`;
fs.writeFileSync('docs/reference/structure-comparison.md', md);
console.log(md.split('## Resumen')[1]);
for (const f of filas.filter(x => x.w === 1440)) console.log(f.nombre.padEnd(22), fmt(f.r?.docH).padStart(6), fmt(f.n.docH).padStart(6), fmt(pct(f.n.docH, f.r?.docH)).padStart(5) + '%');
