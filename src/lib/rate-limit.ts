// Límite de solicitudes en memoria. Suficiente para una sola instancia; ver README si se escala.
import { createHash } from 'node:crypto';

const visitas = new Map<string, number[]>();

export function permitido(clave: string, max: number, ventanaMs: number, ahora = Date.now()) {
  const id = createHash('sha256').update(clave).digest('hex');
  const recientes = (visitas.get(id) ?? []).filter(t => ahora - t < ventanaMs);
  if (recientes.length >= max) {
    visitas.set(id, recientes);
    return false;
  }
  recientes.push(ahora);
  visitas.set(id, recientes);
  if (visitas.size > 5000) {
    for (const [k, v] of visitas) if (!v.some(t => ahora - t < ventanaMs)) visitas.delete(k);
  }
  return true;
}
