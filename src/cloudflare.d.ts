// Tipos mínimos del módulo del runtime de Workers que usa plataforma-cloudflare.ts.
declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
}
