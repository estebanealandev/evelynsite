// Estado de la autorización de lanzamiento. Uso:
//   npm run seo:lanzamiento                  → muestra qué requisitos faltan
//   node scripts/seo/verificar-lanzamiento.mjs --compilacion → además, comprueba que dist/ sea coherente
// Lo ejecuta `npm run deploy` antes de subir nada: si la compilación no es coherente, no se despliega.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
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
    // Seguridad (docs/security): nada sensible publicado y Turnstile solo donde hay formulario.
    const cliente = fileURLToPath(f('client/'));
    const publicados = readdirSync(cliente, { recursive: true }).map(String);
    const sensibles = publicados.filter(p => /(^|\/)\.(?!assetsignore$|well-known)/.test(p) || /\.(map|env|bak|sql|pem|key|log|ya?ml|toml|ini)$/i.test(p));
    if (sensibles.length) errores.push(`archivos que no deben publicarse: ${sensibles.join(', ')}`);
    const leer = r => (existsSync(f(`client/${r}`)) ? readFileSync(f(`client/${r}`), 'utf8') : '');
    const cspDe = html => html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '';
    const formulario = leer('agendar-consulta/index.html');
    const conWidget = formulario.includes('data-turnstile');
    // Solo la página del formulario puede admitir Cloudflare en su CSP.
    const ampliadas = publicados.filter(p => p.endsWith('.html') && p !== 'agendar-consulta/index.html' && cspDe(leer(p)).includes('challenges.cloudflare.com'));
    if (ampliadas.length) errores.push(`CSP con Turnstile fuera del formulario: ${ampliadas.join(', ')}`);
    if (conWidget !== cspDe(formulario).includes('https://challenges.cloudflare.com')) errores.push('el widget Turnstile y la CSP del formulario no coinciden');
    const clave = formulario.match(/data-sitekey="([^"]+)"/)?.[1] ?? '';
    if (/^[123]x0{20}[A-F]{2}$/.test(clave)) errores.push('el widget usa una clave pública de prueba de Turnstile');
    // La política y el aviso de cierre deben describir lo que realmente se publica.
    const privacidad = leer('politica-de-privacidad/index.html');
    if (conWidget !== privacidad.includes('id="seguridad-del-formulario"')) errores.push('la política de privacidad no coincide con el uso de Turnstile');
    if (conWidget && /no carga recursos de terceros/.test(privacidad)) errores.push('la política afirma que no se cargan recursos de terceros, pero el formulario carga Turnstile');
    if (conWidget === formulario.includes('data-formulario-cerrado')) errores.push(conWidget ? 'el formulario activo muestra el aviso de cierre' : 'el formulario cerrado no advierte que no envía');
    if (c.indexable && !conWidget) errores.push('lanzamiento sin Turnstile en el formulario: falta PUBLIC_TURNSTILE_SITE_KEY');
    console.log(`Turnstile en el formulario: ${conWidget ? 'sí' : 'no (sin PUBLIC_TURNSTILE_SITE_KEY; el servidor rechaza los envíos y la página lo advierte)'}`);
    console.log(`\nCompilación: entorno=${c.entorno} indexable=${c.indexable} páginas=${Object.keys(c.rutas).length}`);
  }
  if (errores.length) { console.error(`\nNo se puede desplegar:\n- ${errores.join('\n- ')}`); process.exit(1); }
  console.log('Compilación coherente con la política de indexación.');
}
