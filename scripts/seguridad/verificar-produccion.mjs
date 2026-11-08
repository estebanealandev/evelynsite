#!/usr/bin/env node
// Verificación de seguridad del sitio publicado. Solo lectura: GET, HEAD y un POST vacío de otro origen,
// sin cargas de ataque reales, sin volumen y sin tocar la configuración de Cloudflare.
// Uso: npm run seguridad:produccion [-- --base=https://… --esperar-waf]
//   --esperar-waf  exige que las reglas WAF de ops/cloudflare/seguridad estén aplicadas (403 en el borde).
import tls from 'node:tls';

const arg = n => process.argv.find(a => a.startsWith(`--${n}=`))?.split('=')[1];
const BASE = (arg('base') ?? 'https://evelynelizondo.com').replace(/\/$/, '');
const HOST = new URL(BASE).hostname;
const ESPERAR_WAF = process.argv.includes('--esperar-waf');
const UA = 'Mozilla/5.0 (verificador de seguridad de evelynelizondo.com)';

const fallos = [];
const ok = m => console.log(`  ✔ ${m}`);
const mal = m => { fallos.push(m); console.log(`  ✖ ${m}`); };
const info = m => console.log(`  ℹ ${m}`);
const pedir = (ruta, init = {}) => fetch(BASE + ruta, { redirect: 'manual', ...init, headers: { 'user-agent': UA, ...init.headers } });
// Un desafío lleva cf-mitigated; un bloqueo WAF, la página HTML de Cloudflare con su Ray ID.
// El 403 de Astro (origen ajeno) es texto plano.
const deCloudflare = async r =>
  r.headers.has('cf-mitigated') || (r.status === 403 && (r.headers.get('content-type') ?? '').includes('text/html') && /Cloudflare Ray ID|Attention Required/i.test(await r.clone().text()));

console.log(`Seguridad de ${BASE}\n\nCabeceras`);
{
  const r = await pedir('/');
  const h = k => r.headers.get(k) ?? '';
  r.status === 200 ? ok('portada 200') : mal(`portada ${r.status}`);
  /max-age=\d{7,}/.test(h('strict-transport-security')) ? ok(`HSTS: ${h('strict-transport-security')}`) : mal('falta HSTS');
  h('strict-transport-security').includes('preload') ? mal('HSTS con preload: no está aprobado') : ok('HSTS sin preload');
  h('content-security-policy').includes("frame-ancestors 'none'") ? ok('CSP frame-ancestors') : mal('CSP sin frame-ancestors');
  h('x-content-type-options') === 'nosniff' ? ok('nosniff') : mal('falta nosniff');
  h('x-frame-options') === 'DENY' ? ok('X-Frame-Options DENY') : mal('falta X-Frame-Options');
  h('referrer-policy') ? ok(`Referrer-Policy ${h('referrer-policy')}`) : mal('falta Referrer-Policy');
  h('permissions-policy').includes('camera=()') ? ok('Permissions-Policy') : mal('falta Permissions-Policy');
  h('cache-control') === 'no-store' ? ok('HTML no-store') : mal(`HTML Cache-Control: ${h('cache-control')}`);
  info(`X-Robots-Tag: ${h('x-robots-tag') || '(ninguna)'}; la indexación la controla la política de lanzamiento`);
  const html = await r.text();
  const meta = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '';
  /script-src[^;]*unsafe-inline/.test(meta) ? mal('CSP de la página admite scripts en línea') : ok("CSP de la página sin 'unsafe-inline' en scripts");
  meta.includes('challenges.cloudflare.com') ? mal('la portada admite Turnstile: debe limitarse al formulario') : ok('la portada no admite recursos de terceros');
}

console.log('\nFormulario');
{
  const pagina = await (await pedir('/agendar-consulta')).text();
  const widget = pagina.includes('data-turnstile');
  const meta = pagina.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '';
  if (widget === meta.includes('https://challenges.cloudflare.com')) ok(`Turnstile ${widget ? 'presente y admitido por la CSP' : 'no configurado (sin recursos de terceros)'}`);
  else mal('el widget Turnstile y la CSP no coinciden');
  // Estado A: sin widget, la página debe advertir antes de que se llene que no envía.
  const aviso = pagina.includes('data-formulario-cerrado');
  if (widget !== aviso) ok(widget ? 'formulario activo, sin aviso de cierre' : 'formulario cerrado y la página lo advierte');
  else mal(widget ? 'el formulario activo muestra el aviso de cierre' : 'el formulario está cerrado y la página no lo advierte');
  if (widget && /^[123]x0{20}[A-F]{2}$/.test(pagina.match(/data-sitekey="([^"]+)"/)?.[1] ?? '')) mal('el widget usa una clave pública de prueba');
  // La política describe lo publicado: Turnstile solo si está, y sin afirmar «sin terceros» si está.
  const privacidad = await (await pedir('/politica-de-privacidad')).text();
  if (widget === privacidad.includes('id="seguridad-del-formulario"') && !(widget && /no carga recursos de terceros/.test(privacidad))) ok('la política de privacidad coincide con el uso de Turnstile');
  else mal('la política de privacidad no coincide con el uso de Turnstile');
  const get = await pedir('/api/consulta');
  if (get.status === 405 && get.headers.get('allow') === 'POST') ok('GET /api/consulta: 405 del Worker');
  else if (get.status === 403 && (await deCloudflare(get))) ok('GET /api/consulta: 403 en el borde (regla WAF 3)');
  else mal(`GET /api/consulta: ${get.status}`);
  const ajeno = await pedir('/api/consulta', { method: 'POST', headers: { origin: 'https://otro.example', 'content-type': 'application/x-www-form-urlencoded' }, body: '' });
  ajeno.status === 403 ? ok(`POST de otro origen: 403${(await deCloudflare(ajeno)) ? ' en el borde' : ' del Worker'}`) : mal(`POST de otro origen: ${ajeno.status}`);
}

console.log('\nRecursos que nunca deben existir');
for (const ruta of ['/.env', '/.git/config', '/wp-login.php', '/xmlrpc.php', '/backup.sql', '/config.yml']) {
  const r = await pedir(ruta);
  if (r.status === 403 && (await deCloudflare(r))) ok(`${ruta}: bloqueado en el borde`);
  else if (r.status === 404) (ESPERAR_WAF ? mal : info)(`${ruta}: 404 del Worker${ESPERAR_WAF ? ', la regla WAF no actúa' : ' (reglas WAF sin aplicar)'}`);
  else mal(`${ruta}: ${r.status}`);
}
{
  const r = await pedir('/.well-known/security.txt');
  r.status === 403 && (await deCloudflare(r)) ? mal('/.well-known/ bloqueado: la regla 1 no debe alcanzarlo') : ok(`/.well-known/ no se bloquea (${r.status})`);
}

console.log('\nRastreo y lectura pública (sin desafíos)');
for (const [ruta, metodo] of [['/', 'HEAD'], ['/robots.txt', 'GET'], ['/sitemap.xml', 'GET'], ['/servicios/divorcios', 'GET'], ['/assets/brand/og-default.jpg', 'GET'], ['/manifest.webmanifest', 'GET']]) {
  const r = await pedir(ruta, { method: metodo });
  r.status === 200 && !r.headers.has('cf-mitigated') ? ok(`${metodo} ${ruta}: 200`) : mal(`${metodo} ${ruta}: ${r.status}${r.headers.has('cf-mitigated') ? ' (desafío de Cloudflare)' : ''}`);
}
{
  const html = await (await pedir('/')).text();
  const recursos = [...new Set([...html.matchAll(/(?:href|src)="(\/_astro\/[^"]+|\/assets\/[^"]+\.(?:css|js|woff2))"/g)].map(m => m[1]))].slice(0, 6);
  for (const ruta of recursos) {
    const r = await pedir(ruta);
    r.status === 200 ? ok(`${ruta.slice(0, 60)}: 200`) : mal(`${ruta}: ${r.status}`);
  }
}
{
  // Una cabecera User-Agent no verifica a un rastreador; solo comprueba que no se bloquea por la cadena.
  const r = await pedir('/', { headers: { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' } });
  r.status === 200 ? ok('UA de Googlebot no bloqueado por la cadena') : mal(`UA de Googlebot: ${r.status}`);
}

console.log('\nHTTPS y TLS');
{
  const r = await fetch(`http://${HOST}/servicios`, { redirect: 'manual' });
  r.status === 301 && r.headers.get('location') === `https://${HOST}/servicios` ? ok('http → https con 301') : mal(`http → ${r.status} ${r.headers.get('location')}`);
  const conectar = (version, max) =>
    new Promise(res => {
      const s = tls.connect({ host: HOST, port: 443, servername: HOST, minVersion: version, maxVersion: max ?? version, ciphers: 'DEFAULT@SECLEVEL=0' }, () => {
        const c = s.getPeerCertificate();
        res({ ok: true, protocolo: s.getProtocol(), vence: c.valid_to });
        s.end();
      });
      s.on('error', e => res({ ok: false, error: e.code ?? e.message }));
      s.setTimeout(8000, () => { s.destroy(); res({ ok: false, error: 'timeout' }); });
    });
  for (const v of ['TLSv1', 'TLSv1.1']) {
    const r2 = await conectar(v);
    r2.ok ? mal(`${v} aceptado`) : ok(`${v} rechazado (${r2.error})`);
  }
  for (const v of ['TLSv1.2', 'TLSv1.3']) {
    const r2 = await conectar(v);
    if (!r2.ok) { mal(`${v} no disponible (${r2.error})`); continue; }
    const dias = Math.round((Date.parse(r2.vence) - Date.now()) / 864e5);
    dias > 14 ? ok(`${v} aceptado; certificado vigente ${dias} días`) : mal(`${v}: el certificado vence en ${dias} días`);
  }
}

console.log(fallos.length ? `\n${fallos.length} problema(s).` : '\nSin problemas.');
process.exit(fallos.length ? 1 : 0);
