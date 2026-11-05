// Genera la identidad de Evelyn Elizondo: SVG con geometría real, PNG, WebP e ICO.
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';
import sharp from 'sharp';

const OUT = 'public/assets/brand';
const ICONS = 'public/assets/icons';
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(ICONS, { recursive: true });

const C = {
  navy: '#14283e',
  slate: '#30465a',
  gold: '#b49a68',
  ivory: '#f6f3ed',
  white: '#ffffff',
  carbon: '#24282d'
};

const fontDir = 'node_modules/@fontsource/cormorant-garamond/files';
const loadFont = name => {
  const b = fs.readFileSync(path.join(fontDir, name));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
const serif = loadFont('cormorant-garamond-latin-500-normal.woff');
const italic = loadFont('cormorant-garamond-latin-400-italic.woff');

// Convierte texto a un único trazo, con interletraje y kerning manuales.
function textPath(font, text, size, tracking, x = 0, y = 0) {
  const scale = size / font.unitsPerEm;
  let pen = x;
  const parts = [];
  const glyphs = font.stringToGlyphs(text);
  glyphs.forEach((g, i) => {
    parts.push(g.getPath(pen, y, size).toPathData(2));
    const next = glyphs[i + 1];
    const kern = next ? font.getKerningValue(g, next) * scale : 0;
    pen += g.advanceWidth * scale + kern + tracking * size;
  });
  return { d: parts.join(''), width: pen - x - tracking * size };
}

// Monograma: dos E enfrentadas, desplazadas en diagonal, cuyos brazos se alternan.
// Caja de 100 × 100. `heavy` engrosa los brazos para tamaños muy pequeños.
function monogramPaths(heavy = false) {
  const stem = heavy ? 12 : 9.5;
  const bar = heavy ? 5.4 : 2.9;
  const serifH = heavy ? 0 : 9;
  const serifW = heavy ? 0 : 2.9;
  const r = (x, y, w, h) => `M${x} ${y}H${x + w}V${y + h}H${x}Z`;

  const top = 9, bottom = 79, offset = 12;
  const leftX = 15;
  const rightEdge = 85;
  const reach = 49;
  const midReach = 39;

  const rows = [top, (top + bottom - bar) / 2, bottom - bar];
  const left = [r(leftX, top, stem, bottom - top)];
  rows.forEach((y, i) => {
    const len = i === 1 ? midReach : reach;
    left.push(r(leftX + stem, y, len - stem, bar));
    if (serifH) {
      const ty = i === 2 ? y + bar - serifH : y;
      left.push(r(leftX + len - serifW, ty, serifW, serifH));
    }
  });

  const right = [r(rightEdge - stem, top + offset, stem, bottom - top)];
  rows.forEach((row, i) => {
    const y = row + offset;
    const len = i === 1 ? midReach : reach;
    right.push(r(rightEdge - len, y, len - stem, bar));
    if (serifH) {
      const ty = i === 2 ? y + bar - serifH : y;
      right.push(r(rightEdge - len, ty, serifW, serifH));
    }
  });
  return { left: left.join(''), right: right.join('') };
}

const svgWrap = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;

const markGroup = (x, y, size, c1, c2, heavy = false) => {
  const { left, right } = monogramPaths(heavy);
  return `<g transform="translate(${x} ${y}) scale(${size / 100})"><path fill="${c1}" d="${left}"/><path fill="${c2}" d="${right}"/></g>`;
};

function horizontal({ c1, c2, name, desc, title, compact = false }) {
  const mark = 96;
  const gap = 24;
  const n = textPath(serif, 'EVELYN ELIZONDO', compact ? 41 : 39, 0.11, mark + gap, compact ? 57 : 50);
  const d = compact ? null : textPath(italic, 'Derecho de Familia', 25, 0.075, mark + gap, 84);
  const w = Math.ceil(mark + gap + n.width + 2);
  const body =
    markGroup(0, 0, mark, c1, c2) +
    `<path fill="${name}" d="${n.d}"/>` +
    (d ? `<path fill="${desc}" d="${d.d}"/>` : '');
  return svgWrap(w, mark, body, title);
}

function vertical({ c1, c2, name, desc, title }) {
  const w = 460;
  const mark = 150;
  const n0 = textPath(serif, 'EVELYN ELIZONDO', 45, 0.11);
  const n = textPath(serif, 'EVELYN ELIZONDO', 45, 0.11, (w - n0.width) / 2, mark + 62);
  const d0 = textPath(italic, 'Derecho de Familia', 28, 0.08);
  const d = textPath(italic, 'Derecho de Familia', 28, 0.08, (w - d0.width) / 2, mark + 104);
  return svgWrap(w, mark + 120, markGroup((w - mark) / 2, 0, mark, c1, c2) + `<path fill="${name}" d="${n.d}"/><path fill="${desc}" d="${d.d}"/>`, title);
}

const T = 'Evelyn Elizondo, Derecho de Familia';
const files = {
  // Sobre fondo claro
  'evelyn-elizondo-horizontal.svg': horizontal({ c1: C.navy, c2: C.gold, name: C.navy, desc: C.slate, title: T }),
  'evelyn-elizondo-vertical.svg': vertical({ c1: C.navy, c2: C.gold, name: C.navy, desc: C.slate, title: T }),
  'evelyn-elizondo-light.svg': horizontal({ c1: C.navy, c2: C.gold, name: C.navy, desc: C.slate, title: T }),
  // Sobre fondo oscuro
  'evelyn-elizondo-dark.svg': horizontal({ c1: C.ivory, c2: C.gold, name: C.ivory, desc: C.ivory, title: T }),
  'evelyn-elizondo-vertical-dark.svg': vertical({ c1: C.ivory, c2: C.gold, name: C.ivory, desc: C.ivory, title: T }),
  // Monocromas
  'evelyn-elizondo-mono.svg': horizontal({ c1: C.carbon, c2: C.carbon, name: C.carbon, desc: C.carbon, title: T }),
  'evelyn-elizondo-mono-white.svg': horizontal({ c1: C.white, c2: C.white, name: C.white, desc: C.white, title: T }),
  // Aplicaciones
  'evelyn-elizondo-navbar.svg': horizontal({ c1: C.navy, c2: C.gold, name: C.navy, desc: C.slate, title: 'Evelyn Elizondo', compact: true }),
  'evelyn-elizondo-navbar-dark.svg': horizontal({ c1: C.ivory, c2: C.gold, name: C.ivory, desc: C.ivory, title: 'Evelyn Elizondo', compact: true }),
  'evelyn-elizondo-footer.svg': vertical({ c1: C.ivory, c2: C.gold, name: C.ivory, desc: C.ivory, title: T }),
  // Monograma
  'evelyn-elizondo-monogram.svg': svgWrap(100, 100, markGroup(0, 0, 100, C.navy, C.gold), 'Monograma EE'),
  'evelyn-elizondo-monogram-dark.svg': svgWrap(100, 100, markGroup(0, 0, 100, C.ivory, C.gold), 'Monograma EE'),
  'evelyn-elizondo-monogram-mono.svg': svgWrap(100, 100, markGroup(0, 0, 100, C.carbon, C.carbon), 'Monograma EE')
};
for (const [name, svg] of Object.entries(files)) fs.writeFileSync(path.join(OUT, name), svg);

// Favicon e icono: versión reforzada para tamaños pequeños.
const tile = (pad, heavy) => {
  const size = 100 - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><title>EE</title><rect width="100" height="100" fill="${C.navy}"/>${markGroup(pad, pad, size, C.ivory, C.gold, heavy)}</svg>\n`;
};
const favicon = tile(11, true);
fs.writeFileSync(path.join(OUT, 'favicon.svg'), favicon);
fs.writeFileSync('public/favicon.svg', favicon);

const png = (svg, w, h = w, file) => sharp(Buffer.from(svg), { density: 300 }).resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(file);
const small = [16, 32, 48];
const icoImages = [];
for (const s of small) {
  const b = await sharp(Buffer.from(favicon), { density: 300 }).resize(s, s).png().toBuffer();
  icoImages.push({ s, b });
}
// ICO con cargas PNG.
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(icoImages.length, 4);
let offset = 6 + 16 * icoImages.length;
const dir = icoImages.map(({ s, b }) => {
  const e = Buffer.alloc(16);
  e[0] = s; e[1] = s; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
  e.writeUInt32LE(b.length, 8); e.writeUInt32LE(offset, 12);
  offset += b.length;
  return e;
});
fs.writeFileSync('public/favicon.ico', Buffer.concat([header, ...dir, ...icoImages.map(i => i.b)]));

await png(tile(14, false), 180, 180, path.join(ICONS, 'apple-touch-icon.png'));
await png(tile(14, false), 192, 192, path.join(ICONS, 'icon-192.png'));
await png(tile(14, false), 512, 512, path.join(ICONS, 'icon-512.png'));
await png(tile(22, false), 512, 512, path.join(ICONS, 'icon-maskable-512.png'));

// Exportaciones rasterizadas de los formatos principales.
for (const [name, w] of [['evelyn-elizondo-horizontal', 1200], ['evelyn-elizondo-vertical', 920], ['evelyn-elizondo-monogram', 800], ['evelyn-elizondo-dark', 1200]]) {
  const svg = fs.readFileSync(path.join(OUT, `${name}.svg`));
  const img = sharp(svg, { density: 400 }).resize({ width: w });
  await img.clone().png().toFile(path.join(OUT, `${name}.png`));
  await img.clone().webp({ quality: 92 }).toFile(path.join(OUT, `${name}.webp`));
}

// Imagen Open Graph.
const n0 = textPath(serif, 'EVELYN ELIZONDO', 64, 0.11);
const nOg = textPath(serif, 'EVELYN ELIZONDO', 64, 0.11, (1200 - n0.width) / 2, 420);
const d0 = textPath(italic, 'Derecho de Familia · Costa Rica', 38, 0.05);
const dOg = textPath(italic, 'Derecho de Familia · Costa Rica', 38, 0.05, (1200 - d0.width) / 2, 482);
const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${C.navy}"/>${markGroup(500, 140, 200, C.ivory, C.gold)}<path fill="${C.ivory}" d="${nOg.d}"/><path fill="${C.gold}" d="${dOg.d}"/></svg>`;
await sharp(Buffer.from(og)).resize(1200, 630).jpeg({ quality: 88 }).toFile(path.join(OUT, 'og-default.jpg'));

fs.writeFileSync(path.join(OUT, 'brand-colors.json'), JSON.stringify({
  primary: { name: 'Navy profundo', hex: C.navy },
  secondary: { name: 'Azul pizarra', hex: C.slate },
  accent: { name: 'Oro envejecido', hex: C.gold },
  accentText: { name: 'Oro envejecido para texto sobre claro', hex: '#7a6232', note: 'Ajuste de accesibilidad: el oro base no alcanza 4,5:1 sobre marfil.' },
  background: { name: 'Marfil', hex: C.ivory },
  surface: { name: 'Blanco puro', hex: C.white },
  text: { name: 'Carbón', hex: C.carbon },
  muted: { name: 'Gris pizarra', hex: '#626971' },
  border: { name: 'Gris piedra', hex: '#dfe1e0' }
}, null, 2) + '\n');

// Copia local de tipografías (licencia SIL OFL 1.1).
const F = 'public/assets/fonts';
fs.mkdirSync(F, { recursive: true });
const copies = [
  ['@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2', 'cormorant-400.woff2'],
  ['@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2', 'cormorant-500.woff2'],
  ['@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff2', 'cormorant-400i.woff2'],
  ['@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2', 'cormorant-500i.woff2'],
  ['@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', 'inter.woff2'],
  ['@fontsource-variable/inter/files/inter-latin-wght-italic.woff2', 'inter-i.woff2']
];
for (const [src, dest] of copies) fs.copyFileSync(path.join('node_modules', src), path.join(F, dest));

console.log('Marca generada.');
