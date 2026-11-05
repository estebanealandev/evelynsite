// Contrato entre la escena y el árbol.
import type { WebGLRenderer } from 'three';
import type { Bosque } from './bosque';

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

// Medidas de la composición, en fracciones del lienzo desde arriba a la izquierda.
// El árbol se apoya en `suelo`; las líneas del titular se indican como [izquierda, arriba, derecha, abajo].
export type Linea = [number, number, number, number];
export type Zona = { sueloX: number; sueloY: number; altura: number; linea1: Linea; linea2: Linea };

export type Arbol = {
  resize(ancho: number, alto: number): void;
  frame(estado: Estado): void;
  dispose(): void;
};

export type Crear = (renderer: WebGLRenderer, bosque: Bosque) => Arbol;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const suave = (v: number) => { const x = clamp(v); return x * x * (3 - 2 * x); };
