import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const fuente = z.object({
  ref: z.enum(['CF', 'CPF', 'L9747', 'CNA', 'LCVD', 'L8968', 'R37554', 'CDJ']),
  detalle: z.string()
});

// Revisión profesional de cada pieza. «aprobada» exige quién y cuándo: sin eso la compilación falla.
// Solo las piezas aprobadas pueden indexarse cuando se autorice el lanzamiento.
const revision = {
  revisionProfesional: z.enum(['pendiente', 'aprobada']).default('pendiente'),
  revisadoPor: z.string().optional(),
  revisadoEl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  // Última actualización sustantiva del contenido (no cambios de formato). Alimenta lastmod y dateModified.
  actualizado: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
};
const exigirRevisor = (d: { revisionProfesional: string; revisadoPor?: string; revisadoEl?: string }, ctx: { addIssue: (i: { code: 'custom'; message: string }) => void }) => {
  if (d.revisionProfesional === 'aprobada' && (!d.revisadoPor || !d.revisadoEl))
    ctx.addIssue({ code: 'custom', message: 'revisionProfesional: aprobada exige revisadoPor y revisadoEl' });
};

const servicios = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/servicios' }),
  schema: z.object({
    titulo: z.string(),
    orden: z.number(),
    categoria: z.string(),
    metaTitulo: z.string().max(70),
    metaDescripcion: z.string().max(170),
    resumen: z.string(),
    imagen: z.string(),
    imagenAncha: z.string(),
    alt: z.string(),
    hero: z.object({ titulo: z.string(), entrada: z.string(), puntos: z.array(z.string()) }),
    intro: z.object({ titulo: z.string(), parrafo: z.string(), lista: z.array(z.string()), cierre: z.string() }),
    aspectos: z.object({
      titulo: z.string(),
      entrada: z.string(),
      items: z.array(z.object({ titulo: z.string(), resumen: z.string(), detalle: z.string() }))
    }),
    situaciones: z.object({ titulo: z.string(), items: z.array(z.string()) }),
    procedimiento: z.object({
      etiqueta: z.string().default('El procedimiento'),
      titulo: z.string(),
      entrada: z.string(),
      pasos: z.array(z.object({ titulo: z.string(), texto: z.string() }))
    }),
    importante: z.object({ titulo: z.string(), entrada: z.string(), subtitulo: z.string(), items: z.array(z.string()), cierre: z.string() }),
    preguntas: z.array(z.object({ p: z.string(), r: z.string() })),
    fuentes: z.array(fuente),
    relacionados: z.array(z.string()),
    aviso: z.string().optional(),
    // Qué conviene reunir o hacer a continuación. Es opcional porque no todas las áreas lo necesitan.
    siguientes: z.object({ titulo: z.string(), items: z.array(z.string()) }).optional(),
    ...revision
  }).superRefine(exigirRevisor)
});

const articulos = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/articulos' }),
  schema: z.object({
    titulo: z.string(),
    metaTitulo: z.string().max(70),
    metaDescripcion: z.string().max(170),
    resumen: z.string(),
    categoria: z.string(),
    etiquetas: z.array(z.string()),
    fecha: z.string(),
    imagen: z.string(),
    alt: z.string(),
    destacado: z.boolean().default(false),
    servicios: z.array(z.string()),
    fuentes: z.array(fuente),
    ...revision
  }).superRefine(exigirRevisor)
});

// Fichas por situación: explican qué reunir y qué suele ser relevante, sin concluir nada sobre el caso.
const fichas = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/fichas' }),
  schema: z.object({
    titulo: z.string(),
    orden: z.number(),
    metaTitulo: z.string().max(70),
    metaDescripcion: z.string().max(170),
    resumen: z.string(),
    reunir: z.array(z.string()),
    aspectos: z.array(z.object({ titulo: z.string(), texto: z.string() })),
    limites: z.string(),
    servicios: z.array(z.string()),
    fuentes: z.array(fuente),
    ...revision
  }).superRefine(exigirRevisor)
});

export const collections = { servicios, articulos, fichas };
