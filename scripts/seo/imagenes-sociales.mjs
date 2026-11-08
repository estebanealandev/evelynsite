// Genera las imágenes para compartir (Open Graph, 1200 × 630, JPEG) de cada área y cada artículo,
// recortando la ilustración que ya usa la página. Uso: node scripts/seo/imagenes-sociales.mjs
// JPEG y no WebP: algunas plataformas todavía no muestran WebP en las vistas previas.
import { mkdir, readdir, readFile, stat } from 'node:fs/promises';
import sharp from 'sharp';

const raiz = new URL('../../', import.meta.url);
const salida = new URL('public/assets/og/', raiz);
await mkdir(salida, { recursive: true });

const colecciones = [['servicios', 'servicio'], ['articulos', 'articulo']];
let n = 0;
for (const [carpeta, prefijo] of colecciones) {
  const dir = new URL(`src/content/${carpeta}/`, raiz);
  for (const f of (await readdir(dir)).filter(f => f.endsWith('.md'))) {
    const imagen = (await readFile(new URL(f, dir), 'utf8')).match(/^imagen:\s*"?([^"\n]+)"?/m)?.[1];
    if (!imagen) throw new Error(`${carpeta}/${f} no tiene imagen`);
    const origen = new URL(`public/assets/images/${imagen}.webp`, raiz);
    const destino = new URL(`${prefijo}-${f.replace(/\.md$/, '')}.jpg`, salida);
    // Solo se regenera si la ilustración cambió después de la imagen social.
    const actual = await stat(destino).catch(() => null);
    if (actual && actual.mtimeMs >= (await stat(origen)).mtimeMs) continue;
    await sharp(origen.pathname).resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 78, mozjpeg: true }).toFile(destino.pathname);
    n++;
  }
}
console.log(`Imágenes sociales generadas: ${n}`);
