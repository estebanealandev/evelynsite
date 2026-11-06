// Vigilancia normativa: compara la última versión oficial con la copia guardada y señala qué afirmaciones revisar.
// Uso: npm run normas:vigilar   (código de salida 2 si hay cambios; 1 si una fuente falla)
// No modifica el contenido ni interpreta las reformas: genera un informe para decidir.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DIR_NORMAS } from './catalogo.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'normas-'));
let fallo = false;
try {
  execFileSync(process.execPath, ['scripts/normas/descargar.mjs', tmp], { stdio: 'inherit' });
} catch {
  // Una fuente caída no debe confundirse con «sin cambios»: se informa y se compara lo que sí llegó.
  fallo = true;
}
const leerJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const antes = leerJson(path.join(DIR_NORMAS, 'registro.json'));
const ahora = leerJson(path.join(tmp, 'registro.json'));
const matriz = fs.existsSync('docs/auditoria-evelyn/matriz-juridica.json') ? leerJson('docs/auditoria-evelyn/matriz-juridica.json').afirmaciones : [];

const cambios = [];
const sinDatos = [];
for (const [clave, viejo] of Object.entries(antes.normas)) {
  const nuevo = ahora.normas[clave];
  if (!nuevo) { sinDatos.push(clave); continue; }
  if (nuevo.sha256 === viejo.sha256 && nuevo.version === viejo.version) continue;
  const articulos = new Set([...Object.keys(viejo.articulos), ...Object.keys(nuevo.articulos)]);
  const tocados = [...articulos].filter(a => viejo.articulos[a] !== nuevo.articulos[a]);
  const afectadas = matriz.filter(c => !c.retirada && (c.respaldos || []).some(r => r.norma === clave && (r.articulos || []).some(a => tocados.includes(String(a).toLowerCase()))));
  cambios.push({ clave, titulo: viejo.titulo, versionAnterior: viejo.version, versionNueva: nuevo.version, articulos: tocados, afectadas: afectadas.map(c => ({ id: c.id, pagina: c.pagina, tema: c.tema })) });
}

const hoy = new Date().toISOString().slice(0, 10);
const lineas = [`# Vigilancia normativa, ${hoy}`, '', `Copia de referencia: ${antes.consultado}. Fuente: ${antes.fuente}.`, ''];
if (sinDatos.length) lineas.push(`**No se pudieron comprobar:** ${sinDatos.join(', ')}. Esto no significa que no hayan cambiado.`, '');
if (!cambios.length) lineas.push(sinDatos.length ? 'Sin cambios en las normas que sí se pudieron comprobar.' : 'Sin cambios.');
for (const c of cambios) {
  lineas.push(`## ${c.titulo} (${c.clave})`, '', `Versión ${c.versionAnterior} → ${c.versionNueva}.`, '', `Artículos con cambios: ${c.articulos.join(', ') || 'solo cambios de formato o notas generales'}.`, '');
  if (c.afectadas.length) {
    lineas.push('Afirmaciones que deben revisarse. Si el efecto de la reforma no es claro, se retiran hasta aclararlo:', '');
    for (const a of c.afectadas) lineas.push(`- ${a.id}: ${a.tema} (${a.pagina})`);
  } else lineas.push('Ninguna afirmación registrada depende de esos artículos.');
  lineas.push('');
}
const dirInformes = 'docs/auditoria-evelyn/vigilancia';
fs.mkdirSync(dirInformes, { recursive: true });
const archivo = path.join(dirInformes, `${hoy}.md`);
fs.writeFileSync(archivo, `${lineas.join('\n')}\n`);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`Informe: ${archivo}. Normas con cambios: ${cambios.length}. Sin comprobar: ${sinDatos.length}.`);
process.exit(cambios.length ? 2 : fallo || sinDatos.length ? 1 : 0);
