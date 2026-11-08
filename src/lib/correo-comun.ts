// Tipos comunes del envío de correo, compartidos por las dos plataformas.
export type Mensaje = { asunto: string; texto: string; responderA?: string; para?: string };

export class CorreoNoDisponible extends Error {}
