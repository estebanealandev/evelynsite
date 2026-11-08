// Comprueba el sitio publicado, solo con peticiones GET y HEAD. Uso: npm run seo:produccion [-- https://dominio]
// Verifica: redirecciones http→https, www→raíz y barra final; X-Robots-Tag igual a la meta robots; canonical;
// robots.txt y sitemap. Sirve antes y después del lanzamiento: informa el estado, no lo cambia.
const base = (process.argv[2] ?? 'https://evelynelizondo.com').replace(/\/$/, '');
const host = new URL(base).host;
const UA = { 'user-agent': 'evelynsite-verificacion/1.0' };
let errores = 0;
const ok = m => console.log(`  ✔ ${m}`);
const mal = m => { errores++; console.log(`  ✘ ${m}`); };
const get = (u, redirect = 'manual') => fetch(u, { redirect, headers: UA });

console.log('Redirecciones');
for (const [desde, hacia, esperado] of [
  [`http://${host}/servicios`, `${base}/servicios`, [301, 308]],
  [`https://www.${host}/blog?x=1`, `${base}/blog?x=1`, [301, 308]],
  [`${base}/servicios/`, '/servicios', [301, 308]],
  [`${base}/home`, '/', [301, 308]]
]) {
  const r = await get(desde);
  const loc = r.headers.get('location');
  const destino = loc && new URL(loc, desde).href;
  if (destino !== new URL(hacia, base).href) mal(`${desde} → ${loc ?? 'sin redirección'} (se esperaba ${hacia})`);
  else if (!esperado.includes(r.status)) mal(`${desde} → ${hacia} con ${r.status}: debería ser permanente`);
  else ok(`${desde} → ${hacia} (${r.status})`);
}

console.log('Indexación');
const robotsTxt = await (await get(`${base}/robots.txt`)).text();
const indexable = /^Sitemap:/m.test(robotsTxt);
console.log(`  robots.txt ${indexable ? 'anuncia el sitemap (lanzamiento)' : 'sin sitemap (antes del lanzamiento)'}`);
if (/^User-agent: \*\n(?:.*\n)*?Disallow: \/$/m.test(robotsTxt.split(/\n\n/)[1] ?? robotsTxt)) mal('robots.txt bloquea todo para User-agent: *: los buscadores no pueden leer el noindex');
const sitemap = await (await get(`${base}/sitemap.xml`)).text();
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
for (const ruta of new Set(['/', ...locs.map(l => new URL(l).pathname), '/consulta-recibida', '/servicios/divorcios'])) {
  const r = await get(`${base}${ruta}`);
  const html = await r.text();
  const etiqueta = html.match(/<meta name="robots" content="([^"]+)"/)?.[1];
  const cabecera = r.headers.get('x-robots-tag');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const fallos = [];
  if (r.status !== 200) fallos.push(`estado ${r.status}`);
  if (!indexable && !/noindex/.test(etiqueta ?? '')) fallos.push('sin noindex antes del lanzamiento');
  if (cabecera && cabecera !== etiqueta) fallos.push(`X-Robots-Tag «${cabecera}» ≠ meta «${etiqueta}»`);
  if (!indexable && !cabecera) fallos.push('sin X-Robots-Tag antes del lanzamiento');
  if (canonical !== `${base}${ruta === '/' ? '/' : ruta}`) fallos.push(`canonical ${canonical}`);
  fallos.length ? mal(`${ruta}: ${fallos.join('; ')}`) : ok(`${ruta}: ${etiqueta}`);
}
console.log(errores ? `\n${errores} problemas.` : '\nSin problemas.');
process.exit(errores ? 1 : 0);
