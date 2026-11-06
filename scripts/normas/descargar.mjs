// Descarga la última versión de cada norma desde SINALEVI y actualiza la copia y el registro.
// Uso: node scripts/normas/descargar.mjs [carpeta]   (por defecto, docs/auditoria-evelyn/normas)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { catalogo, urlNorma, DIR_NORMAS } from './catalogo.mjs';
import { fragmentos, hash } from './texto.mjs';

const destino = process.argv[2] || DIR_NORMAS;
// Se descarga aparte: la copia de referencia solo se sustituye si llegaron todas las normas.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'descarga-normas-'));
const anterior = fs.existsSync(path.join(DIR_NORMAS, 'registro.json')) ? JSON.parse(fs.readFileSync(path.join(DIR_NORMAS, 'registro.json'), 'utf8')) : null;
const hoy = new Date().toISOString().slice(0, 10);
const registro = { consultado: hoy, fuente: 'SINALEVI, Procuraduría General de la República', normas: {} };
// La página de SINALEVI se genera con JavaScript: hay que abrirla en un navegador, con una petición cada vez.
const navegador = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await navegador.newContext({ locale: 'es-CR' });
let fallos = 0;
for (const [clave, n] of Object.entries(catalogo)) {
  const p = await ctx.newPage();
  try {
    await p.goto(urlNorma(n.id), { waitUntil: 'load', timeout: 90000 });
    await p.waitForFunction(() => /Versi[oó]n de la Norma:\s*\d+\s*de\s*\d+/.test(document.body.innerText), null, { timeout: 45000 });
    await p.waitForTimeout(1500);
    const bruto = await p.evaluate(() => (document.querySelector('#contenidoTexto') || document.body).innerText);
    const v = bruto.match(/Versi[oó]n de la Norma:\s*(\d+)\s*de\s*(\d+)/i);
    const ultima = /[úu]ltima versi[oó]n de la norma/i.test(bruto) && v && v[1] === v[2];
    if (!ultima) throw new Error(`no se abrió la última versión: ${v?.[0] ?? 'sin dato de versión'}`);
    const texto = bruto.replace(/^Ficha Art[íi]culo.*$/gim, '').replace(/^Ir al men[úu] de .*$/gim, '').replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    // Una página incompleta no debe confundirse con una reforma ni reemplazar la copia.
    const previa = path.join(DIR_NORMAS, `${clave}.txt`);
    if (fs.existsSync(previa) && texto.length < fs.statSync(previa).size * 0.7) throw new Error(`captura incompleta: ${texto.length} caracteres`);
    fs.writeFileSync(path.join(dir, `${clave}.txt`), `${texto}\n`);
    const arts = fragmentos(texto);
    registro.normas[clave] = { ...n, url: urlNorma(n.id), version: `${v[1]} de ${v[2]}`, sha256: hash(texto), articulos: Object.fromEntries(Object.entries(arts).map(([k, t]) => [k, hash(t)])) };
    console.log(clave, `versión ${v[1]} de ${v[2]}`, Object.keys(arts).length, 'artículos');
  } catch (e) {
    fallos++;
    console.error(clave, 'ERROR', e.message.split('\n')[0]);
  }
  await p.close();
  await new Promise(r => setTimeout(r, 2000));
}
await navegador.close();
fs.writeFileSync(path.join(dir, 'registro.json'), `${JSON.stringify(registro, null, 1)}\n`);
const esReferencia = path.resolve(destino) === path.resolve(DIR_NORMAS);
if (esReferencia && fallos) {
  console.error('No se actualizó la copia de referencia: alguna norma no se pudo descargar.');
} else {
  fs.mkdirSync(destino, { recursive: true });
  for (const f of fs.readdirSync(dir)) fs.copyFileSync(path.join(dir, f), path.join(destino, f));
}
fs.rmSync(dir, { recursive: true, force: true });
if (anterior && esReferencia && !fallos) console.log(`Copia actualizada. La anterior era del ${anterior.consultado}.`);
process.exit(fallos ? 1 : 0);
