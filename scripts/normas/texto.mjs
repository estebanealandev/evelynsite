// Utilidades para leer las copias oficiales guardadas y separarlas por artículo.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DIR_NORMAS } from './catalogo.mjs';

const TITULO = /^[ \t]*(?:ART[ÍI]CULO|Art[íi]culo)[ \t]+(\d+)[ \t]*(?:[°ºo][ \t]*)?(bis|ter|qu[aá]ter)?\b/gim;

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
    const clave = [m[1], (m[2] || '').toLowerCase().replace('á', 'a')].filter(Boolean).join(' ');
    const fin = i + 1 < marcas.length ? marcas[i + 1].index : texto.length;
    const cuerpo = texto.slice(m.index, fin).trim();
    salida[clave] = salida[clave] ? `${salida[clave]}\n\n${cuerpo}` : cuerpo;
  });
  return salida;
}
