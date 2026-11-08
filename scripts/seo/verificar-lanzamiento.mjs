// Estado de la autorización de lanzamiento. Uso:
//   npm run seo:lanzamiento                  → muestra qué requisitos faltan
//   node scripts/seo/verificar-lanzamiento.mjs --compilacion → además, comprueba que dist/ sea coherente
// Lo ejecuta `npm run deploy` antes de subir nada: si la compilación no es coherente, no se despliega.
import { existsSync, readFileSync } from 'node:fs';
import { REQUISITOS, requisitosPendientes } from '../../src/config/indexacion.mjs';

const raiz = new URL('../../', import.meta.url);
const registro = JSON.parse(readFileSync(new URL('src/config/lanzamiento.json', raiz), 'utf8'));
const faltan = requisitosPendientes(registro);
console.log('Requisitos de lanzamiento (src/config/lanzamiento.json):');
for (const clave of Object.keys(REQUISITOS)) {
  const r = registro.requisitos?.[clave];
  console.log(`  ${r?.estado === 'aprobado' ? '✔' : '✘'} ${clave.padEnd(20)} ${r?.estado ?? 'sin registro'}${r?.evidencia ? ` · ${r.evidencia}` : ''}`);
}
console.log(faltan.length ? `\nLanzamiento NO autorizado: ${faltan.length} pendientes. El sitio debe compilarse con noindex.` : '\nTodos los requisitos constan como aprobados.');

if (process.argv.includes('--compilacion')) {
  const errores = [];
  const f = p => new URL(`dist/${p}`, raiz);
  if (!existsSync(f('robots-compilados.json'))) errores.push('falta dist/robots-compilados.json: compile antes de desplegar');
  else {
    const c = JSON.parse(readFileSync(f('robots-compilados.json'), 'utf8'));
    const headers = existsSync(f('client/_headers')) ? readFileSync(f('client/_headers'), 'utf8') : '';
    const robots = existsSync(f('client/robots.txt')) ? readFileSync(f('client/robots.txt'), 'utf8') : '';
    if (!headers) errores.push('falta dist/client/_headers (¿se compiló con DESTINO=cloudflare?)');
    if (c.entorno !== 'production') errores.push(`la compilación es de "${c.entorno}", no de production`);
    if (c.indexable && faltan.length) errores.push('la compilación es indexable pero faltan requisitos');
    if (!c.indexable) {
      if (!/^\/\*\n(?:  .+\n)*  X-Robots-Tag: noindex, nofollow$/m.test(headers)) errores.push('_headers no aplica X-Robots-Tag: noindex a todo el sitio');
      if (/^Sitemap:/m.test(robots)) errores.push('robots.txt anuncia el sitemap sin lanzamiento autorizado');
      const indexables = Object.entries(c.rutas).filter(([, v]) => !/noindex/.test(v ?? ''));
      if (indexables.length) errores.push(`páginas sin noindex: ${indexables.map(([r]) => r).join(', ')}`);
    }
    console.log(`\nCompilación: entorno=${c.entorno} indexable=${c.indexable} páginas=${Object.keys(c.rutas).length}`);
  }
  if (errores.length) { console.error(`\nNo se puede desplegar:\n- ${errores.join('\n- ')}`); process.exit(1); }
  console.log('Compilación coherente con la política de indexación.');
}
