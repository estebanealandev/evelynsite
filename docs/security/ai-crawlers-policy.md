# Política de rastreadores de IA: Search, Agent y Training

Cloudflare separa las políticas por comportamiento:

- **Search:** rastreadores que indexan para dar respuestas con enlaces.
- **Agent:** agentes que visitan la página a petición de una persona.
- **Training:** rastreadores que recopilan datos para entrenar modelos.

Las acciones posibles son Block, Block on pages with ads, Allow y, solo para Training, Disallow por `robots.txt`.

## Estado (2026-11-08)

| Capa | Search | Agent | Training |
|---|---|---|---|
| Políticas de Cloudflare (`ai_search`, `ai_user`, `ai_training`) | `disabled`, es decir, no bloquea | `disabled` | `disabled` |
| `robots.txt` del sitio (antes del lanzamiento) | Rastreo general permitido. `OAI-SearchBot` y `PerplexityBot` con `Disallow: /` | Sin regla propia | `Disallow: /` para GPTBot, Google-Extended, Applebot-Extended, ClaudeBot, CCBot, meta-externalagent y Bytespider |
| `robots.txt` del sitio (tras el lanzamiento) | Permitido, con el sitemap anunciado | Sin regla propia | Bloqueado mientras la responsable no decida otra cosa |
| `robots.txt` gestionado por Cloudflare | Desactivado: no se antepone nada | — | — |

## Política recomendada

| Comportamiento | Recomendación | Motivo |
|---|---|---|
| **Search** | **Allow en el borde.** El `robots.txt` del sitio decide el momento | El objetivo GEO es que los motores de respuesta citen el sitio. Antes del lanzamiento, el `robots.txt` excluye a los buscadores de IA que podrían usar contenido no aprobado sin leer el `noindex`. Al lanzar, se abren solos (`src/lib/seo/robots.mjs`) |
| **Agent** | **Allow** para lectura | Una persona que pide a un asistente que lea una página debe poder hacerlo. Ser un agente verificado **no** da permisos de escritura: el formulario exige un POST del mismo origen (regla WAF 3) y Turnstile, que un agente no puede resolver por su cuenta |
| **Training** | **Decisión pendiente de la responsable del sitio.** Hoy: `Disallow` en `robots.txt` y Allow en el borde | Es independiente de Search. El `robots.txt` expresa la preferencia, y bloquear en el borde la haría obligatoria. No se activa sin una decisión expresa |

### Por qué no se activa el bloqueo de IA en el borde

1. La consigna es no bloquear la IA de forma general por defecto. Hacerlo contradiría la estrategia GEO.
2. **Rastreadores de propósito mixto:**
   - Googlebot alimenta tanto Search como AI Overviews, y Google-Extended es solo un *token* de `robots.txt`, no un rastreador aparte.
   - Applebot y Applebot-Extended siguen la misma lógica.
   - Bingbot alimenta Bing y Copilot.

   Bloquear «Training» en el borde no debe alcanzar nunca a Googlebot ni a Bingbot. Para no correr ese riesgo sin poder verificarlo en Search Console, la preferencia se expresa en `robots.txt`, que cada operador interpreta por su *token*.
3. Activar las políticas con Bot Preference Sync haría que Cloudflare antepusiera su propio bloque gestionado (Content Signals y `Disallow`) al `robots.txt` del sitio. Habría dos fuentes de verdad.

### Si la responsable decide bloquear el entrenamiento en el borde

1. En el panel: AI Crawl Control → Training → **Block**. Search y Agent quedan en **Allow**.
2. Mantener desactivado Bot Preference Sync o `robots.txt` gestionado, para que el `robots.txt` siga siendo el del sitio. Si se prefiere activarlo, revisar el resultado con `curl https://evelynelizondo.com/robots.txt` y adaptar `src/lib/seo/robots.mjs`.
3. Comprobar con `npm run seo:produccion` y `npm run seguridad:produccion` que Googlebot (por UA) y las páginas siguen en 200.
4. **Reversión:** volver a Allow.

### Si decide permitir el entrenamiento

Cambiar `ENTRENAMIENTO` a `'permitir'` en `src/lib/seo/robots.mjs` y desplegar. Así lo prevé la estrategia SEO.

## Herramientas de validación

Search Console, Bing Webmaster Tools, Rich Results Test y los validadores de Open Graph acceden con GET y HEAD. Ninguna regla preparada los desafía ni los bloquea. La única regla que podría hacerlo, la reservada 4, se limita a `/agendar-consulta` y lleva `not cf.client.bot`.
