// Validación y saneamiento de formularios en el servidor. Sin dependencias del framework para poder probarla.
export const TIPOS = [
  'Divorcio',
  'Pensión alimentaria',
  'Guarda y crianza',
  'Interrelación familiar',
  'Bienes gananciales',
  'Unión de hecho',
  'Filiación',
  'Otro asunto de familia'
];

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const TAGS = /<[^>]*>/g;
const EMAIL = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[^\s@<>"'.]{2,24}$/;
const PHONE = /^[+()\d\s.-]{8,20}$/;

export function limpiarLinea(v: unknown, max: number) {
  return String(v ?? '')
    .replace(CONTROL, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(TAGS, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, max);
}

export function limpiarTexto(v: unknown, max: number) {
  return String(v ?? '')
    .replace(CONTROL, '')
    .replace(/\r\n?/g, '\n')
    .replace(TAGS, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

export type Campos = Record<string, unknown>;
export type Errores = Record<string, string>;

export function esSpam(c: Campos, ahora = Date.now()) {
  // Campo trampa: las personas no lo ven ni lo completan.
  if (limpiarLinea(c.sitio_web, 200)) return true;
  // Tiempo mínimo de llenado: lo define el navegador al cargar. Sin JavaScript no se evalúa.
  const t = Number(c.iniciado);
  if (Number.isFinite(t) && t > 0 && ahora - t < 3000) return true;
  return false;
}

export function validarConsulta(c: Campos) {
  const datos = {
    nombre: limpiarLinea(c.nombre, 120),
    correo: limpiarLinea(c.correo, 200).toLowerCase(),
    telefono: limpiarLinea(c.telefono, 25),
    tipo: limpiarLinea(c.tipo, 60),
    mensaje: limpiarTexto(c.mensaje, 3000)
  };
  const errores: Errores = {};
  if (datos.nombre.length < 3) errores.nombre = 'Indique su nombre completo.';
  if (!EMAIL.test(datos.correo)) errores.correo = 'Indique un correo electrónico válido.';
  if (datos.telefono && !PHONE.test(datos.telefono)) errores.telefono = 'Indique un teléfono válido o deje el campo vacío.';
  if (!TIPOS.includes(datos.tipo)) errores.tipo = 'Seleccione el tipo de consulta.';
  if (datos.mensaje.length < 20) errores.mensaje = 'Cuéntenos brevemente su consulta (mínimo 20 caracteres).';
  if (!esVerdadero(c.consentimiento)) errores.consentimiento = 'Necesitamos su consentimiento para tratar estos datos.';
  return { datos, errores, valido: Object.keys(errores).length === 0 };
}

export function validarSuscripcion(c: Campos) {
  const correo = limpiarLinea(c.correo, 200).toLowerCase();
  const errores: Errores = {};
  if (!EMAIL.test(correo)) errores.correo = 'Indique un correo electrónico válido.';
  if (!esVerdadero(c.consentimiento)) errores.consentimiento = 'Marque la casilla de consentimiento.';
  return { datos: { correo }, errores, valido: Object.keys(errores).length === 0 };
}

function esVerdadero(v: unknown) {
  return v === true || v === 'on' || v === 'true' || v === '1';
}
