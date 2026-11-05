// Contrato común de los prototipos del laboratorio.
import type { WebGLRenderer } from 'three';

export type Estado = {
  dt: number;
  t: number;
  // Avance del scroll dentro del hero, de 0 a 1 y ya suavizado.
  progreso: number;
  // Cursor en coordenadas normalizadas, de -1 a 1 y ya suavizado.
  x: number;
  y: number;
  zona: Zona;
};

// Espacio libre junto al titular, en fracciones del lienzo medidas desde arriba a la izquierda.
export type Zona = { cx: number; cy: number; w: number; h: number; tituloTop: number };

export type Concepto = {
  resize(ancho: number, alto: number): void;
  frame(estado: Estado): void;
  dispose(): void;
  // Densidad máxima de píxeles: las imágenes suaves no necesitan más.
  dprMax?: number;
};

export type Crear = (renderer: WebGLRenderer) => Concepto;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const suave = (v: number) => { const x = clamp(v); return x * x * (3 - 2 * x); };
