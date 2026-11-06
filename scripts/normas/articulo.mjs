// Muestra artículos o busca texto en la copia oficial.
// Uso: node scripts/normas/articulo.mjs CF 48 "48 bis" 143
//      node scripts/normas/articulo.mjs CF --buscar "unión de hecho"
import { articulos, leer, normalizar } from './texto.mjs';

const [clave, ...resto] = process.argv.slice(2);
const texto = leer(clave);
const arts = articulos(texto);
if (resto[0] === '--buscar') {
  const q = normalizar(resto.slice(1).join(' '));
  const hallados = Object.entries(arts).filter(([, t]) => normalizar(t).includes(q)).map(([k]) => k);
  console.log(`${clave}: "${q}" aparece en los artículos: ${hallados.join(', ') || '(ninguno)'}`);
} else {
  for (const n of resto) console.log(`--- ${clave} ${n}\n${arts[n.toLowerCase()] ?? 'NO ENCONTRADO'}\n`);
}
