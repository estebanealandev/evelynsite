// Utilidades para leer las copias oficiales guardadas y separarlas por artículo.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DIR_NORMAS } from './catalogo.mjs';

// La copia oficial tiene algún número partido, como «Artículo 27 4-»: el grupo final lo recompone.
const TITULO = /^[ \t]*(?:ART[ÍI]CULO|Art[íi]culo)[ \t]*(\d+)(?:[ \t]+(\d)(?=[ \t]*[-.–—:]))?[ \t]*(?:[°ºo][ \t]*)?(bis|ter|qu[aá]ter)?\b/gim;

export const hash = t => createHash('sha256').update(t).digest('hex').slice(0, 16);
export const leer = clave => fs.readFileSync(path.join(DIR_NORMAS, `${clave}.txt`), 'utf8');

// Normaliza para comparar citas: sin mayúsculas, acentos, signos ni espacios repetidos.
export function normalizar(t) {
  return t.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

// Devuelve { '48': texto, '48 bis': texto }. Si un número se repite (títulos preliminares), une los textos.
export function articulos(texto) {
  const marcas = [...texto.matchAll(TITULO)];
  const salida = {};
  marcas.forEach((m, i) => {
    const clave = [`${m[1]}${m[2] || ''}`, (m[3] || '').toLowerCase().replace('á', 'a')].filter(Boolean).join(' ');
    const fin = i + 1 < marcas.length ? marcas[i + 1].index : texto.length;
    const cuerpo = texto.slice(m.index, fin).trim();
    salida[clave] = salida[clave] ? `${salida[clave]}\n\n${cuerpo}` : cuerpo;
  });
  return salida;
}

// Igual que articulos(), pero separa también los transitorios. Se usa para detectar cambios.
const TRANSITORIO = /^[ \t]*TRANSITORIO[ \t]+([IVXLC]+|[ÚU]NICO)\b/gim;
export function fragmentos(texto) {
  const marcas = [...texto.matchAll(TRANSITORIO)];
  const principal = marcas.length ? texto.slice(0, marcas[0].index) : texto;
  const salida = articulos(principal);
  marcas.forEach((m, i) => {
    const clave = `transitorio ${m[1].toLowerCase()}`;
    const fin = i + 1 < marcas.length ? marcas[i + 1].index : texto.length;
    const cuerpo = texto.slice(m.index, fin).trim();
    salida[clave] = salida[clave] ? `${salida[clave]}\n\n${cuerpo}` : cuerpo;
  });
  return salida;
}
