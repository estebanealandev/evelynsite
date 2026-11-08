// Grafo JSON-LD único por página. Cada entidad tiene un @id estable y las demás la citan por referencia,
// así no aparecen dos versiones de la misma entidad con datos distintos.
//
// Regla: solo se declara lo confirmado. La persona profesional y el servicio jurídico entran al grafo cuando
// su identidad y sus datos están aprobados (site.autora.verificada, site.perfil.aprobado). No se declaran
// valoraciones, reseñas, premios, sameAs ni direcciones sin confirmar.
import { site } from '../../config/site';

export type TipoPagina = 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage' | 'ItemPage';
export type Miga = { label: string; href?: string };

export const ids = (base: URL | string) => {
  const u = (p: string) => new URL(p, base).href;
  return {
    sitio: u('/#website'),
    profesional: u('/#profesional'),
    servicio: u('/#servicio-juridico'),
    logo: u('/#logo'),
    pagina: (url: string) => `${url}#webpage`,
    migas: (url: string) => `${url}#breadcrumb`,
    articulo: (url: string) => `${url}#article`
  };
};

type Opciones = {
  base: URL | string;
  url: string;
  titulo: string;
  descripcion: string;
  tipo?: TipoPagina;
  imagen?: string;
  migas?: Miga[];
  tema?: string[];
  revisadaPor?: string | null;
  revisadaEl?: string | null;
  nodos?: Record<string, unknown>[];
};

export function grafo(o: Opciones) {
  const id = ids(o.base);
  const abs = (p: string) => new URL(p, o.base).href;
  const profesionalVerificada = site.autora.verificada;
  const perfilAprobado = site.perfil.aprobado;
  const nodos: Record<string, unknown>[] = [];

  nodos.push({
    '@type': 'WebSite',
    '@id': id.sitio,
    url: abs('/'),
    name: site.name,
    alternateName: site.fullName,
    description: site.description,
    inLanguage: 'es-CR',
    ...(profesionalVerificada ? { publisher: { '@id': id.profesional } } : {})
  });

  if (profesionalVerificada) {
    const { nombre, credencial, perfil } = site.autora;
    nodos.push({
      '@type': 'Person',
      '@id': id.profesional,
      name: nombre,
      url: abs('/sobre-evelyn'),
      knowsAbout: ['Derecho de familia', 'Derecho de familia de Costa Rica'],
      knowsLanguage: 'es',
      ...(credencial ? { hasCredential: { '@type': 'EducationalOccupationalCredential', name: credencial } } : {}),
      ...(perfil ? { sameAs: [perfil] } : {})
    });
  }

  if (perfilAprobado) {
    const c = site.contact;
    // Google define LocalBusiness (y LegalService) por una ubicación física. Sin oficina confirmada se declara
    // un Service, sin dirección, en lugar de inventar un establecimiento.
    const conOficina = Boolean(c.address);
    nodos.push({
      '@type': conOficina ? 'LegalService' : 'Service',
      '@id': id.servicio,
      ...(conOficina ? {} : { serviceType: 'Asesoría en derecho de familia' }),
      name: site.name,
      description: site.description,
      url: abs('/'),
      ...(conOficina ? { logo: { '@type': 'ImageObject', '@id': id.logo, url: abs('/assets/brand/evelyn-elizondo-monogram.png') } } : {}),
      image: abs('/assets/brand/og-default.jpg'),
      areaServed: { '@type': 'Country', name: 'Costa Rica' },
      ...(conOficina ? { knowsLanguage: 'es-CR' } : { availableLanguage: 'es' }),
      ...(profesionalVerificada ? (conOficina ? { founder: { '@id': id.profesional } } : { provider: { '@id': id.profesional } }) : {}),
      ...(c.phone ? { telephone: c.phone } : {}),
      ...(c.email ? { email: c.email } : {}),
      // La dirección solo se declara si existe una oficina real con atención presencial.
      ...(conOficina ? { address: { '@type': 'PostalAddress', streetAddress: c.address, addressCountry: 'CR' } } : {})
    });
  }

  const migas = o.migas?.length ? [{ label: 'Inicio', href: '/' }, ...o.migas] : [];
  nodos.push({
    '@type': o.tipo ?? 'WebPage',
    '@id': id.pagina(o.url),
    url: o.url,
    name: o.titulo,
    description: o.descripcion,
    inLanguage: 'es-CR',
    isPartOf: { '@id': id.sitio },
    ...(o.imagen ? { primaryImageOfPage: { '@type': 'ImageObject', url: abs(o.imagen) } } : {}),
    ...(migas.length ? { breadcrumb: { '@id': id.migas(o.url) } } : {}),
    ...(o.tema?.length ? { about: o.tema.map(name => ({ '@type': 'Thing', name })) } : {}),
    ...(perfilAprobado ? { provider: { '@id': id.servicio } } : {}),
    // La revisión profesional solo se declara cuando consta: quién y cuándo.
    ...(o.revisadaPor && o.revisadaEl ? { reviewedBy: { '@type': 'Person', name: o.revisadaPor }, lastReviewed: o.revisadaEl } : {})
  });

  if (migas.length)
    nodos.push({
      '@type': 'BreadcrumbList',
      '@id': id.migas(o.url),
      itemListElement: migas.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.label,
        // El último elemento es la página actual.
        item: c.href ? abs(c.href) : o.url
      }))
    });

  nodos.push(...(o.nodos ?? []));
  return { '@context': 'https://schema.org', '@graph': nodos };
}

/** Nodo Article para un artículo del blog. Sin autoría confirmada no se declara autor. */
export function nodoArticulo(o: {
  base: URL | string;
  url: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  publicado: string;
  actualizado?: string | null;
  seccion: string;
  etiquetas: string[];
}) {
  const id = ids(o.base);
  return {
    '@type': 'Article',
    '@id': id.articulo(o.url),
    headline: o.titulo,
    description: o.descripcion,
    image: new URL(o.imagen, o.base).href,
    datePublished: o.publicado,
    dateModified: o.actualizado ?? o.publicado,
    inLanguage: 'es-CR',
    articleSection: o.seccion,
    keywords: o.etiquetas.join(', '),
    mainEntityOfPage: { '@id': id.pagina(o.url) },
    isPartOf: { '@id': id.sitio },
    ...(site.autora.verificada ? { author: { '@id': id.profesional }, publisher: { '@id': id.profesional } } : {}),
    ...(site.perfil.aprobado && !site.autora.verificada ? { publisher: { '@id': id.servicio } } : {})
  };
}
