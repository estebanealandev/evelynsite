#!/usr/bin/env node
// Comprobación previa a la activación del formulario. Solo lectura: no escribe secretos, no compila
// y no despliega. Dice qué falta y, cuando todo está listo, qué comandos ejecutar con autorización.
// Uso: npm run formulario:preparar [-- --remoto]
//   --remoto  además consulta (solo lectura) los nombres de secretos del Worker con `wrangler secret list`.
// Procedimiento completo: docs/security/turnstile-implementation.md, «Activación controlada».
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pendientesFormulario, REQUISITOS_COMPILACION, REQUISITO_FINAL, esClavePublicaDePrueba } from '../../src/config/formulario.mjs';

const REMOTO = process.argv.includes('--remoto');
const faltas = [];
const ok = m => console.log(`  ✔ ${m}`);
const falta = m => { faltas.push(m); console.log(`  ✖ ${m}`); };
const info = m => console.log(`  ℹ ${m}`);

// wrangler.jsonc admite comentarios: se quitan antes de leerlo (sin tocar las URL entre comillas).
const jsonc = texto => JSON.parse(texto.replace(/("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (m, cadena) => cadena ?? '').replace(/,(\s*[}\]])/g, '$1'));
const wrangler = jsonc(readFileSync('wrangler.jsonc', 'utf8'));
const vars = wrangler.vars ?? {};

console.log('Registro de activación (src/config/formulario.json)');
const registro = JSON.parse(readFileSync('src/config/formulario.json', 'utf8'));
const pendientes = pendientesFormulario(registro, REQUISITOS_COMPILACION);
if (pendientes.length) pendientes.forEach(falta);
else ok('requisitos de compilación aprobados con responsable, fecha y evidencia');
const final = pendientesFormulario(registro, REQUISITO_FINAL);
info(final.length ? 'envioRealVerificado: pendiente. Se cumple después de desplegar; hasta entonces el formulario no se declara operativo' : 'envío real verificado');

console.log('\nClave pública de Turnstile (PUBLIC_TURNSTILE_SITE_KEY, en el entorno de la compilación)');
const clave = (process.env.PUBLIC_TURNSTILE_SITE_KEY ?? '').trim();
if (!clave) falta('PUBLIC_TURNSTILE_SITE_KEY no está definida en este entorno');
else if (esClavePublicaDePrueba(clave)) falta('PUBLIC_TURNSTILE_SITE_KEY es una clave de prueba: no sirve para producción');
else ok('clave pública definida y distinta de las claves de prueba');

console.log('\nCorreo (wrangler.jsonc)');
if (vars.MAIL_MODE === 'cloudflare') ok('MAIL_MODE=cloudflare');
else falta(`MAIL_MODE es "${vars.MAIL_MODE ?? ''}": debe ser "cloudflare" para enviar`);
for (const k of ['MAIL_TO', 'MAIL_FROM']) (vars[k] ? ok : falta)(`${k} ${vars[k] ? 'definido' : 'sin definir (no se inventa: lo confirma la responsable)'}`);
const enlace = (wrangler.send_email ?? []).find(b => b.name === 'EMAIL');
if (!enlace) falta('falta el binding send_email EMAIL');
else if (enlace.destination_address || enlace.allowed_destination_addresses) ok('el binding EMAIL solo puede enviar al destino configurado');
else info('el binding EMAIL no limita el destino: al confirmar MAIL_TO, añada "destination_address" (mínimo privilegio)');
if (vars.TURNSTILE_SECRET_KEY) falta('TURNSTILE_SECRET_KEY aparece en vars: debe ser un secreto, nunca una variable');
if ((vars.TURNSTILE_MODE ?? '').toLowerCase() === 'off') info('TURNSTILE_MODE=off en vars no tiene efecto en el dominio real, pero conviene quitarlo');

console.log('\nSecreto del Worker');
if (!REMOTO) info('sin --remoto no se consulta Cloudflare. Con --remoto se listan los nombres de secretos (solo lectura)');
else {
  const r = spawnSync('npx', ['wrangler', 'secret', 'list', '--format', 'json'], { encoding: 'utf8' });
  let nombres = [];
  try { nombres = JSON.parse(r.stdout).map(s => s.name); } catch {}
  if (r.status !== 0) falta('no se pudo leer la lista de secretos (¿sesión de Wrangler?)');
  else if (nombres.includes('TURNSTILE_SECRET_KEY')) ok('TURNSTILE_SECRET_KEY existe en el Worker (su valor no es visible)');
  else falta('TURNSTILE_SECRET_KEY no existe en el Worker');
}

console.log(`\n${faltas.length ? `Faltan ${faltas.length} puntos: el formulario no puede activarse.` : 'Listo para la activación controlada.'}`);
console.log(`Siguientes pasos (con autorización expresa en cada uno): docs/security/turnstile-implementation.md, «Activación controlada».`);
process.exit(faltas.length ? 1 : 0);
