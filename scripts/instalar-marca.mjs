// Instala en el sitio la identidad elegida (A · Doble) desde design/branding-evelyn. La fuente de los diseños está allí.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const A = 'design/branding-evelyn/propuesta-a';
const OUT = 'public/assets/brand';
const ICONS = 'public/assets/icons';
const copia = (de, a) => { fs.mkdirSync(path.dirname(a), { recursive: true }); fs.copyFileSync(path.join(A, de), a); };

for (const f of fs.existsSync(OUT) ? fs.readdirSync(OUT) : []) if (/\.(svg|png|webp|jpg)$/.test(f)) fs.rmSync(path.join(OUT, f));
const logos = {
  'principal-horizontal-claro': 'evelyn-elizondo-horizontal',
  'principal-horizontal-oscuro': 'evelyn-elizondo-horizontal-dark',
  'principal-con-lema-claro': 'evelyn-elizondo-lema',
  'principal-con-lema-oscuro': 'evelyn-elizondo-lema-dark',
  'compacta-vertical-claro': 'evelyn-elizondo-vertical',
  'compacta-vertical-oscuro': 'evelyn-elizondo-vertical-dark',
  'isotipo-claro': 'evelyn-elizondo-isotipo',
  'isotipo-oscuro': 'evelyn-elizondo-isotipo-dark',
  'principal-horizontal-mono-negro': 'evelyn-elizondo-mono',
  'principal-horizontal-mono-blanco': 'evelyn-elizondo-mono-white',
};
for (const [de, a] of Object.entries(logos)) copia(`logos/svg/${de}.svg`, `${OUT}/${a}.svg`);
copia('aplicaciones/cabecera-claro.svg', `${OUT}/evelyn-elizondo-navbar.svg`);
copia('aplicaciones/cabecera-oscuro.svg', `${OUT}/evelyn-elizondo-navbar-dark.svg`);
// PNG para datos estructurados: fondo oscuro, sin transparencia.
await sharp(path.join(A, 'favicon/icon-512.png')).png().toFile(`${OUT}/evelyn-elizondo-monogram.png`);
await sharp(path.join(A, 'redes/og-1200x630.svg'), { density: 150 }).resize(1200, 630).jpeg({ quality: 90 }).toFile(`${OUT}/og-default.jpg`);

copia('favicon/favicon.svg', 'public/favicon.svg');
copia('favicon/favicon.ico', 'public/favicon.ico');
copia('favicon/favicon.svg', `${OUT}/favicon.svg`);
for (const [de, a] of [['apple-touch-icon', 'apple-touch-icon'], ['icon-192', 'icon-192'], ['icon-512', 'icon-512'], ['icon-maskable-512', 'icon-maskable-512']]) copia(`favicon/${de}.png`, `${ICONS}/${a}.png`);
console.log('Marca instalada');
