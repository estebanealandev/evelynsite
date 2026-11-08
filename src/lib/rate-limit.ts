// Límite de solicitudes en memoria. Suficiente para una sola instancia; ver README si se escala.
import { createHmac, randomBytes } from 'node:crypto';

const visitas = new Map<string, number[]>();
// Clave aleatoria que solo vive en memoria: sin ella, la huella no permite recuperar la dirección IP.
// Se crea en la primera petición: Workers no permite generar valores aleatorios al cargar el módulo.
let secreto: Buffer | undefined;
let ultimaLimpieza = 0;

export function permitido(clave: string, max: number, ventanaMs: number, ahora = Date.now()) {
  // Las entradas vencidas se borran aunque haya poco tráfico.
  if (ahora - ultimaLimpieza > 60_000) {
    ultimaLimpieza = ahora;
    for (const [k, v] of visitas) if (!v.some(t => ahora - t < ventanaMs)) visitas.delete(k);
  }
  const id = createHmac('sha256', (secreto ??= randomBytes(32))).update(clave).digest('hex');
  const recientes = (visitas.get(id) ?? []).filter(t => ahora - t < ventanaMs);
  if (recientes.length >= max) {
    visitas.set(id, recientes);
    return false;
  }
  recientes.push(ahora);
  visitas.set(id, recientes);
  if (visitas.size > 5000) {
    for (const [k, v] of visitas) if (!v.some(t => ahora - t < ventanaMs)) visitas.delete(k);
    // Si aun así sigue creciendo, se descartan las entradas más antiguas para acotar la memoria.
    if (visitas.size > 20000) for (const k of [...visitas.keys()].slice(0, visitas.size - 20000)) visitas.delete(k);
  }
  return true;
}
