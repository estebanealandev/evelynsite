// Busca referencias residuales de la identidad anterior en el producto publicado.
// La documentación técnica en docs/ queda excluida por ser trazabilidad interna.
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = ['src', 'public', 'dist', 'tests', 'astro.config.mjs', 'package.json', '.env.example', 'README.md'];
const PATRONES = [
  [/emily/i, 'Emily'], [/rubenstein/i, 'Rubenstein'], [/\bERL\b/, 'ERL'], [/\bdivorcingLA\b/i, 'divorcingLA'],
  [/los\s+[aá]ngeles/i, 'Los Ángeles'], [/beverly\s*hills/i, 'Beverly Hills'], [/california/i, 'California'], [/wilshire/i, 'Wilshire'],
  [/squarespace|sqspcdn|typekit|freight-big|hoffbeck/i, 'Plataforma o proveedor anterior'],
  [/fonts\.googleapis|fonts\.gstatic|googletagmanager|google-analytics|recaptcha|vimeo/i, 'Servicio remoto'],
  [/lorem ipsum|placeholder\.com|via\.placeholder/i, 'Relleno'],
  [/\(310\)|90212/, 'Dato de contacto anterior']
];
const BIN = /\.(png|jpe?g|webp|avif|ico|woff2?|ttf|otf|gz|br)$/i;
const IGNORAR = new Set(['audit-identity.mjs']);
const hallazgos = [];
let revisados = 0;
const recorrer = p => {
  if (!fs.existsSync(p)) return;
  const st = fs.statSync(p);
  if (st.isDirectory()) { for (const f of fs.readdirSync(p)) recorrer(path.join(p, f)); return; }
  if (BIN.test(p) || IGNORAR.has(path.basename(p))) return;
  revisados++;
  fs.readFileSync(p, 'utf8').split('\n').forEach((l, i) => {
    for (const [re, nombre] of PATRONES) if (re.test(l)) hallazgos.push({ archivo: p, linea: i + 1, nombre, texto: l.trim().slice(0, 110) });
  });
};
RAIZ.forEach(recorrer);
console.log(`Archivos revisados: ${revisados}`);
if (hallazgos.length) {
  for (const h of hallazgos) console.log(`${h.archivo}:${h.linea} [${h.nombre}] ${h.texto}`);
  process.exitCode = 1;
} else {
  console.log('Sin referencias residuales.');
}
