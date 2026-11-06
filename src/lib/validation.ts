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

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u0085\u2028\u2029\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g;
// Solo etiquetas reales: «<100 000 y >150 000» es texto y el correo sale como texto plano.
const TAGS = /<\/?[a-zA-Z!][^>]*>/g;
// Sin comas ni punto y coma: una dirección no debe poder convertirse en varios destinatarios.
const EMAIL = /^[^\s@<>"',;:()[\]\\]{1,64}@[^\s@<>"',;:()[\]\\]{1,190}\.[^\s@<>"',;:()[\]\\.]{2,24}$/;
const PHONE = /^[+()\d\s.-]{8,20}$/;

// Un archivo u otro valor que no sea texto no se convierte en cadena: se trata como vacío.
const comoTexto = (v: unknown) => (typeof v === 'string' ? v : '');

export function limpiarLinea(v: unknown, max: number) {
  return comoTexto(v)
    .replace(CONTROL, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(TAGS, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, max);
}

export function limpiarTexto(v: unknown, max: number) {
  return comoTexto(v)
    .replace(CONTROL, '')
    .replace(/\r\n?/g, '\n')
    .replace(TAGS, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

// El primer contacto no necesita un relato extenso: limitarlo reduce los datos sensibles recibidos.
export const MAX_MENSAJE = 1200;

export type Campos = Record<string, unknown>;
export type Errores = Record<string, string>;

export function esSpam(c: Campos) {
  // Campo trampa: las personas no lo ven ni lo completan.
  if (limpiarLinea(c.sitio_web, 200)) return true;
  // Tiempo de llenado medido en el navegador. No usa la hora del dispositivo, que puede estar mal.
  const t = Number(c.transcurrido);
  return comoTexto(c.transcurrido) !== '' && Number.isFinite(t) && t >= 0 && t < 3000;
}

export function validarConsulta(c: Campos) {
  const datos = {
    nombre: limpiarLinea(c.nombre, 120),
    correo: limpiarLinea(c.correo, 200).toLowerCase(),
    telefono: limpiarLinea(c.telefono, 25),
    tipo: limpiarLinea(c.tipo, 60),
    mensaje: limpiarTexto(c.mensaje, MAX_MENSAJE)
  };
  const errores: Errores = {};
  if (datos.nombre.length < 2) errores.nombre = 'Indique su nombre.';
  if (!EMAIL.test(datos.correo)) errores.correo = 'Indique un correo electrónico válido.';
  if (datos.telefono && !PHONE.test(datos.telefono)) errores.telefono = 'Indique un teléfono válido o deje el campo vacío.';
  if (!TIPOS.includes(datos.tipo)) errores.tipo = 'Seleccione el tipo de consulta.';
  if (datos.mensaje.length < 20) errores.mensaje = 'Indique brevemente el asunto (mínimo 20 caracteres).';
  if (!esVerdadero(c.consentimiento)) errores.consentimiento = 'Para enviar la solicitud, debe autorizar el tratamiento de estos datos.';
  return { datos, errores, valido: Object.keys(errores).length === 0 };
}

function esVerdadero(v: unknown) {
  return v === 'on' || v === 'true' || v === '1';
}
