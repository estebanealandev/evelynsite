// Guías de marca (HTML y PDF), tableros comparativos y galería.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PROPUESTAS, caja, copia, aOrigen, simboloA, simboloB, nombreC } from './marcas.mjs';
import { paths, optimo, escribir, navegador, cerrar, RAIZ, contraste, MODOS } from './comun.mjs';
import { DATOS, CRITERIOS } from './datos.mjs';

const inline = (partes, col, attrs = '') => { const b = caja(partes); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.left} ${b.top} ${b.width} ${b.height}" ${attrs} aria-hidden="true">${paths(partes, col)}</svg>`; };
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const cmyk = h => { const [r, g, b] = rgb(h).map(v => v / 255), k = 1 - Math.max(r, g, b); if (k === 1) return '0 / 0 / 0 / 100'; return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k].map(v => Math.round(v * 100)).join(' / '); };
const texClaro = h => contraste(h, '#FFFFFF') > contraste(h, '#111111');

function construccion(id, c) {
  const guia = '#8A8A8A';
  if (id === 'a') {
    const t = Math.tan(12 * Math.PI / 180), X = 40, asta = 16;
    const l = [...[0, 49.2, 100].map(y => `<line x1="-8" x2="118" y1="${y}" y2="${y}"/>`), `<line x1="0" x2="0" y1="-8" y2="108"/>`, `<line x1="${asta}" x2="${asta}" y1="-8" y2="108"/>`, ...[X, X + asta].map(x => `<line x1="${x + 108 * t}" y1="-8" x2="${x - 8 * t}" y2="108"/>`)].join('');
    return `<svg viewBox="-12 -14 136 128" class="fig">${paths(simboloA(), { tinta: c.tinta, acento: c.acento })}<g stroke="${guia}" stroke-width=".25" stroke-dasharray="1 1" fill="none">${l}</g><text x="${X + 12}" y="-9" font-size="3.4" fill="${guia}">12°</text><text x="104" y="52" font-size="3.4" fill="${guia}">brazo medio</text></svg>`;
  }
  if (id === 'b') {
    const s = simboloB(), m = s.meta;
    const circ = [...m.radios.map(r => `<circle cx="${m.c1[0]}" cy="${m.c1[1]}" r="${r}"/>`), ...m.radios.map(r => `<circle cx="${m.c2[0]}" cy="${m.c2[1]}" r="${m.D - r}"/>`)].join('');
    return `<svg viewBox="-8 -8 118 118" class="fig">${paths(s, { tinta: c.tinta, acento: c.acento })}<g stroke="${guia}" stroke-width=".25" stroke-dasharray="1 1" fill="none">${circ}<line x1="${m.c1[0]}" y1="${m.c1[1]}" x2="${m.c2[0]}" y2="${m.c2[1]}"/></g><circle cx="${m.c1[0]}" cy="${m.c1[1]}" r=".9" fill="${guia}"/><circle cx="${m.c2[0]}" cy="${m.c2[1]}" r=".9" fill="${guia}"/></svg>`;
  }
  const n = aOrigen(nombreC({ tam: 40 })), b = caja(n);
  return `<svg viewBox="-8 -10 ${b.width + 16} ${b.height + 24}" class="fig">${paths(n, { tinta: c.tinta, acento: c.acento })}<g stroke="${guia}" stroke-width=".25" stroke-dasharray="1 1"><line x1="-6" x2="${b.width + 6}" y1="0" y2="0"/><line x1="-6" x2="${b.width + 6}" y1="${b.height - 12.1}" y2="${b.height - 12.1}"/></g></svg>`;
}
function proteccion(p) {
  const a = aOrigen(p.horizontal()), b = caja(a), c = p.color;
  const iso = aOrigen(p.isotipo()); const x = p.id === 'c' ? 44 * .66 : b.height * .25;
  return `<svg viewBox="${-x - 4} ${-x - 4} ${b.width + 2 * x + 8} ${b.height + 2 * x + 8}" class="fig">${paths(a, { tinta: c.tinta, acento: c.acento, acentoTexto: c.acentoTexto })}<rect x="${-x}" y="${-x}" width="${b.width + 2 * x}" height="${b.height + 2 * x}" fill="none" stroke="${c.acento}" stroke-width=".7" stroke-dasharray="3 3"/><rect x="0" y="0" width="${b.width}" height="${b.height}" fill="none" stroke="#8A8A8A" stroke-width=".35"/></svg>`;
}

function guia(p) {
  const d = DATOS[p.id], c = p.color, m = MODOS(c), id = p.id;
  const R = `../propuesta-${id}`;
  const img = (f, alt, st = '') => `<img src="${R}/${f}" alt="${alt}" style="${st}">`;
  const parejas = [[c.tinta, c.fondoClaro, 'tinta / claro'], [c.acentoTexto, c.fondoClaro, 'texto de acento / claro'], [c.acento, c.fondoClaro, 'acento gráfico / claro'], [c.tintaOsc, c.fondoOscuro, 'claro / oscuro'], [c.acentoOsc, c.fondoOscuro, 'acento / oscuro']];
  const noUsar = [['transform:scaleX(1.35)', 'No deformar'], ['transform:rotate(-14deg)', 'No girar'], ['filter:hue-rotate(120deg) saturate(1.6)', 'No cambiar los colores'], ['filter:drop-shadow(3px 4px 2px rgb(0 0 0/.55))', 'No añadir sombras ni efectos']];
  return `<!doctype html><html lang="es-CR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Guía de marca: ${d.nombre}</title><style>
@font-face{font-family:'G-A';src:url(../_fuente/fuentes/${d.fuenteTit})}
@font-face{font-family:'G-C';src:url(../_fuente/fuentes/${d.fuenteCur});font-style:italic}
@font-face{font-family:'G-B';src:url(../_fuente/fuentes/${d.fuenteTxt})}
:root{--t:${c.tinta};--a:${c.acento};--at:${c.acentoTexto};--f:${c.fondoClaro};--o:${c.fondoOscuro}}
*{box-sizing:border-box}body{margin:0;background:#fff;color:var(--t);font:17px/1.6 'G-B',system-ui,sans-serif}
section{padding:72px clamp(20px,6vw,88px);border-top:1px solid color-mix(in srgb,var(--t) 14%,transparent);break-inside:avoid}
.ini{background:var(--o);color:var(--f);min-height:92vh;display:flex;flex-direction:column;justify-content:space-between;gap:40px;border:0}
.ini svg{width:min(760px,100%);height:auto}.ini p{margin:0;max-width:60ch}
h1,h2{font-family:'G-A',serif;font-weight:400;line-height:1.1;margin:0 0 28px}h2{font-size:clamp(30px,4vw,48px)}h3{font-size:15px;margin:0 0 8px;font-weight:600}
.n{font-size:14px;color:var(--at);margin:0 0 8px}p{max-width:66ch;margin:0 0 16px}
.r{display:grid;gap:16px}.r3{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}.r2{grid-template-columns:repeat(auto-fit,minmax(320px,1fr))}.r4{grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}
.lam{display:flex;align-items:center;justify-content:center;padding:36px;min-height:230px}.lam img{max-width:100%;max-height:170px;display:block}
.fig{width:100%;height:auto;max-height:440px;display:block}
.sw{padding:18px;min-height:150px;display:flex;flex-direction:column;justify-content:flex-end;font-size:13.5px;line-height:1.45;border:1px solid rgb(0 0 0/.08)}.sw b{font-size:15px}
table{border-collapse:collapse;width:100%;font-size:15px}th,td{border-bottom:1px solid rgb(0 0 0/.12);padding:10px 8px;text-align:left;vertical-align:top}
.ap{width:100%;display:block;border:1px solid rgb(0 0 0/.08)}figure{margin:0}figcaption{font-size:13.5px;margin-top:6px;color:var(--at)}
.no{background:var(--f);padding:28px;height:170px;display:flex;align-items:center;justify-content:center;overflow:hidden}.no img{max-width:80%;max-height:90px}
.tip{font-family:'G-A',serif;font-size:clamp(30px,5vw,58px);line-height:1.1;margin:0 0 6px}.tip2{font-family:'G-B',sans-serif;font-size:24px;margin:0 0 6px}
${id === 'a' ? "h1,h2,.tip{font-optical-sizing:none;font-variation-settings:'opsz' 20}" : ''}
@media print{@page{size:A4 landscape;margin:0}body{font-size:12.5px}section{padding:32px 44px;break-after:page}.ini{min-height:100vh}.lam{min-height:150px;padding:18px}.lam img{max-height:110px}.ap{max-height:440px;width:auto;max-width:100%}.fig{max-height:300px}}
</style></head><body>
<section class="ini">${inline(p.horizontal(), m.oscuro)}<div><p class="n" style="color:${c.acentoTextoOsc}">Propuesta ${id.toUpperCase()}, guía de marca</p><h1 style="font-size:clamp(40px,7vw,84px);margin-bottom:14px">${d.nombre}</h1><p>${d.idea}</p></div></section>
<section><p class="n">1. Concepto</p><h2>${d.sub}</h2>${d.concepto.map(t => `<p>${t}</p>`).join('')}</section>
<section><p class="n">2. Versiones</p><h2>Logotipos</h2><div class="r r3">
${[['principal-horizontal', 'Principal horizontal'], ['compacta-vertical', 'Compacta'], ['isotipo', 'Isotipo']].map(([f, t]) => `<figure><div class="lam" style="background:${c.fondoClaro}">${img(`logos/svg/${f}-claro.svg`, t)}</div><figcaption>${t}, fondo claro</figcaption></figure><figure><div class="lam" style="background:${c.fondoOscuro}">${img(`logos/svg/${f}-oscuro.svg`, t)}</div><figcaption>${t}, fondo oscuro</figcaption></figure>`).join('')}
<figure><div class="lam" style="background:#fff;outline:1px solid #ddd;outline-offset:-1px">${img('logos/svg/principal-horizontal-mono-negro.svg', 'Monocromo negro')}</div><figcaption>Monocromo negro</figcaption></figure><figure><div class="lam" style="background:#111">${img('logos/svg/principal-horizontal-mono-blanco.svg', 'Monocromo blanco')}</div><figcaption>Monocromo blanco</figcaption></figure><figure><div class="lam" style="padding:0">${img('logos/svg/principal-horizontal-invertido.svg', 'Invertido', 'max-height:none;width:100%')}</div><figcaption>Invertido, con fondo incluido</figcaption></figure></div></section>
<section><p class="n">3. Construcción y área de protección</p><h2>Geometría</h2><div class="r r2"><figure style="background:${c.fondoClaro};padding:20px">${construccion(id, c)}<figcaption>Trazado de la marca</figcaption></figure><figure style="background:${c.fondoClaro};padding:20px;display:flex;flex-direction:column;justify-content:center">${proteccion(p)}<figcaption>${d.proteccion}</figcaption></figure></div></section>
<section><p class="n">4. Tamaño mínimo</p><h2>Tamaños mínimos recomendados</h2><table><tr><th>Versión</th><th>Mínimo</th><th>A ese tamaño</th></tr>${d.min.map(([n, t, f, st]) => `<tr><td>${n}</td><td>${t}</td><td><img src="${R}/${f}" alt="" style="${st};display:block"></td></tr>`).join('')}<tr><td>Favicon</td><td>16, 24 y 32 px</td><td><img src="${R}/favicon/favicon-16.svg" alt="" width="16" height="16" style="margin-right:10px;vertical-align:middle"><img src="${R}/favicon/favicon.svg" alt="" width="24" height="24" style="margin-right:10px;vertical-align:middle"><img src="${R}/favicon/favicon.svg" alt="" width="32" height="32" style="vertical-align:middle"></td></tr></table></section>
<section><p class="n">5. Color</p><h2>Paleta</h2><div class="r r4">${d.paleta.map(([n, h, u]) => { const [r, g, b] = rgb(h); return `<div class="sw" style="background:${h};color:${texClaro(h) ? '#fff' : '#111'}"><b>${n}</b>${h}<br>RGB ${r} ${g} ${b}<br>CMYK ${cmyk(h)}<br>${u}</div>`; }).join('')}</div><p style="margin-top:14px;font-size:14px">CMYK calculado de forma aproximada: se debe ajustar con una prueba de imprenta.</p>
<h3 style="margin-top:28px">Contraste comprobado (WCAG)</h3><table><tr><th>Pareja</th><th>Razón</th><th>Uso permitido</th></tr>${parejas.map(([a, b, n]) => { const r = contraste(a, b); return `<tr><td>${n} (${a} sobre ${b})</td><td>${r.toFixed(2)}:1</td><td>${r >= 7 ? 'Todo texto (AAA)' : r >= 4.5 ? 'Todo texto (AA)' : r >= 3 ? 'Solo gráficos y texto grande' : 'Solo decorativo'}</td></tr>`; }).join('')}</table></section>
<section><p class="n">6. Tipografía</p><h2>Familias y licencias</h2><div class="r r2">${d.fuentes.map(([n, u, a, ofl, cp, fam, mu]) => `<div><p class="${fam === "'G-A'" ? 'tip' : 'tip2'}">${mu}</p><h3>${n}</h3><p style="font-size:15px">${u}<br>Licencia: SIL Open Font License 1.1 (<a href="../_fuente/fuentes/${ofl}">texto</a>). ${cp}.</p></div>`).join('')}</div><p style="font-size:15px">La OFL permite usar estas fuentes en logotipos y documentos comerciales. Los logotipos se entregan en trazos: no hace falta instalar ninguna fuente para usarlos.</p></section>
<section><p class="n">7. Usos incorrectos</p><h2>Lo que no se hace</h2><div class="r r4">${noUsar.map(([st, t]) => `<figure><div class="no"><img src="${R}/logos/svg/isotipo-claro.svg" alt="" style="${st}"></div><figcaption>${t}</figcaption></figure>`).join('')}</div><p style="margin-top:16px">Tampoco se usa sobre fotografías sin un área tranquila, ni se recompone el nombre con otra fuente.</p></section>
<section><p class="n">8. Aplicaciones</p><h2>En el sitio</h2><div class="r r2"><figure>${img('aplicaciones/portada-actual-con-logo.png', 'Portada actual con el logotipo', 'width:100%;display:block')}<figcaption>Portada actual, sin otros cambios</figcaption></figure><figure>${img('aplicaciones/portada-con-paleta-propia.png', 'Portada con la paleta', 'width:100%;display:block')}<figcaption>Portada con la paleta y las fuentes de la propuesta (simulación en memoria)</figcaption></figure></div><figure style="margin-top:16px">${img('aplicaciones/cabecera-sobre-portada.png', 'Cabecera sobre la portada', 'width:100%;display:block')}</figure><figure style="margin-top:8px">${img('aplicaciones/cabecera-pagina-interior.png', 'Cabecera en página interior', 'width:100%;display:block;border:1px solid #eee')}<figcaption>Cabecera a la medida real del sitio, 240 x 48</figcaption></figure></section>
<section><h2>Papelería y tarjeta</h2><figure>${img('aplicaciones/papeleria.png', 'Hoja, sobre y tarjeta', 'width:100%;display:block')}<figcaption>Hoja A4, sobre DL y tarjeta de 85 x 55 mm. Los archivos vectoriales están en <code>papeleria/</code>. Sin sangrado: se debe añadir según la imprenta.</figcaption></figure></section>
<section><h2>Patrón, redes y favicon</h2><div class="r r3"><figure>${img('patron/patron.svg', 'Patrón', 'width:100%;display:block')}<figcaption>${d.patron}</figcaption></figure><figure>${img('redes/og-1200x630.svg', 'Imagen para compartir', 'width:100%;display:block')}<figcaption>Imagen para compartir, 1200 x 630</figcaption></figure><figure>${img('redes/avatar-1080.svg', 'Avatar', 'width:62%;display:block')}<figcaption>Avatar para perfiles</figcaption></figure></div><figure style="margin-top:16px;max-width:640px">${img('redes/firma-correo.svg', 'Firma de correo', 'width:100%;display:block;border:1px solid #eee')}<figcaption>Firma de correo</figcaption></figure></section>
<section><p class="n">9. Voz</p><h2>Cómo escribe la marca</h2><p>Trato de usted, en un registro sobrio y concreto, primero la respuesta y luego las excepciones. Sin autoelogio ni promesas de resultado. Rige la guía editorial del proyecto, en <code>docs/auditoria-evelyn/guia-editorial.md</code>.</p><p>El lema es descriptivo a propósito: «Derecho de Familia, Costa Rica». No se añade un eslogan que prometa acompañamiento, seguridad o victorias.</p></section>
<section><p class="n">10. Antes de usarla</p><h2>Pendientes y riesgos</h2><ul>${d.riesgos.map(t => `<li>${t}</li>`).join('')}<li>Teléfono, correo, dirección y carné profesional aparecen como «por confirmar»: no se inventaron datos.</li><li>Las búsquedas hechas no equivalen a una autorización de registro. Falta una búsqueda de anterioridades en el Registro Nacional de Costa Rica, por una persona especialista, y la revisión de las normas del Colegio de Abogados sobre publicidad.</li></ul></section>
</body></html>`;
}

async function pdf(id) {
  const b = await navegador(); const pg = await b.newPage();
  await pg.goto('file://' + join(RAIZ, `brand-guidelines/guia-${id}.html`), { waitUntil: 'networkidle' });
  await pg.pdf({ path: join(RAIZ, `brand-guidelines/guia-${id}.pdf`), printBackground: true, preferCSSPageSize: true });
  await pg.close();
}

async function tableros() {
  const ids = ['a', 'b', 'c'];
  const b = await navegador();
  const base = `<!doctype html><meta charset=utf-8><base href="file://${RAIZ}/"><style>@font-face{font-family:H;src:url(_fuente/fuentes/HankenGrotesk.ttf)}body{margin:0;background:#fff;font:15px H,sans-serif;color:#1a1a1a;width:1800px}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}.c{display:flex;align-items:center;justify-content:center;padding:44px;min-height:220px;position:relative}.c img{display:block}.t{padding:14px 24px;font-size:14px}.l{position:absolute;left:14px;top:10px;font-size:13px;opacity:.75}</style>`;
  const et = id => `<div class="t"><b>${id.toUpperCase()}</b> · ${DATOS[id].nombre}</div>`;
  const cols = fn => `<div class=g>${ids.map(et).join('')}</div><div class=g>${ids.map(fn).join('')}</div>`;
  const lam = (id, f, fondo, st) => `<div class=c style="background:${fondo}"><img src="propuesta-${id}/${f}" style="${st}"></div>`;
  const t = {
    '01-logotipo-principal': cols(id => lam(id, 'logos/svg/principal-horizontal-claro.svg', PROPUESTAS[id].color.fondoClaro, 'width:480px')) + `<div class=g>${ids.map(id => lam(id, 'logos/svg/principal-horizontal-oscuro.svg', PROPUESTAS[id].color.fondoOscuro, 'width:480px')).join('')}</div>`,
    '02-compacta-e-isotipo': cols(id => lam(id, 'logos/svg/compacta-vertical-claro.svg', PROPUESTAS[id].color.fondoClaro, 'height:230px;max-width:460px')) + `<div class=g>${ids.map(id => lam(id, 'logos/svg/isotipo-claro.svg', '#fff', 'height:200px')).join('')}</div>`,
    '03-monocromo': cols(id => lam(id, 'logos/svg/principal-horizontal-mono-negro.svg', '#fff', 'width:480px')) + `<div class=g>${ids.map(id => lam(id, 'logos/svg/principal-horizontal-mono-blanco.svg', '#000', 'width:480px')).join('')}</div>`,
    '04-favicon-y-reduccion': cols(id => `<div class=c style="background:#ECECEC;gap:22px">${[64, 48, 32, 24, 16].map(s => `<img src="propuesta-${id}/favicon/favicon${s === 16 ? '-16' : ''}.svg" width=${s} height=${s}>`).join('')}</div>`) + `<div class=g>${ids.map(id => `<div class=c style="background:#fff;gap:26px;min-height:120px">${[64, 48].map(s => `<img src="propuesta-${id}/logos/svg/isotipo-claro.svg" style="height:${s}px">`).join('') + [32, 24, 16].map(s => `<img src="propuesta-${id}/logos/svg/isotipo-reducido-claro.svg" style="height:${s}px">`).join('')}</div>`).join('')}</div>`,
    '05-cabecera-del-sitio': ids.map(id => `<div class=t><b>${id.toUpperCase()}</b> · ${DATOS[id].nombre}</div><img src="propuesta-${id}/aplicaciones/cabecera-sobre-portada.png" style="width:1800px;display:block"><img src="propuesta-${id}/aplicaciones/cabecera-pagina-interior.png" style="width:1800px;display:block">`).join(''),
    '06-portada-actual': cols(id => `<img src="propuesta-${id}/aplicaciones/portada-actual-con-logo.png" style="width:100%;display:block">`),
    '07-portada-con-paleta': cols(id => `<img src="propuesta-${id}/aplicaciones/portada-con-paleta-propia.png" style="width:100%;display:block">`),
    '08-papeleria': cols(id => `<img src="propuesta-${id}/aplicaciones/papeleria.png" style="width:100%;display:block">`),
    '09-tarjeta': cols(id => `<img src="propuesta-${id}/aplicaciones/tarjeta.png" style="width:100%;display:block">`),
  };
  for (const [n, h] of Object.entries(t)) {
    const f = escribir(`_fuente/.t.html`, base + h);
    const pg = await b.newPage({ viewport: { width: 1800, height: 40 } });
    await pg.goto('file://' + f, { waitUntil: 'networkidle' }); await pg.waitForTimeout(150);
    await pg.screenshot({ path: join(RAIZ, `comparativa/${n}.png`), fullPage: true });
    await pg.close();
  }
  return Object.keys(t);
}

function evaluacionMD() {
  const tot = id => CRITERIOS.reduce((s, [, v]) => s + v[id][0], 0);
  let s = `# Evaluación comparativa\n\nPuntuación de 1 a 5. Es un juicio razonado de quien diseñó las propuestas, no una prueba con personas usuarias.\n\n| Criterio | A · Nexo | B · Hebras | C · Rúbrica |\n|---|---|---|---|\n`;
  for (const [n, v] of CRITERIOS) s += `| ${n} | ${v.a[0]}: ${v.a[1]} | ${v.b[0]}: ${v.b[1]} | ${v.c[0]}: ${v.c[1]} |\n`;
  s += `| **Total (sobre 40)** | **${tot('a')}** | **${tot('b')}** | **${tot('c')}** |\n\n## Recomendación\n\n${RECOMENDACION.join('\n\n')}\n`;
  return s;
}
export const RECOMENDACION = [
  'Se recomienda **A · Nexo**, aunque empata con C a 33 puntos sobre 40 y B queda en 31: la tabla no decide. Decide el encaje con el encargo. A transmite autoridad, discreción y elegancia editorial sin depender de una metáfora emocional, contiene las iniciales, se lee como EE hasta 16 px con su dibujo reducido y tiene un eco en el sitio, porque el titular de la portada alterna redonda y cursiva.',
  'Su reserva: sobre el navy actual, el latón repite el par azul y oro que la auditoría critica. Se puede estrenar sin cambiar la paleta, pero el cambio de marca solo se completa con su propia paleta.',
  'Elija **C · Rúbrica** si quiere que la marca sea su nombre firmado, sin símbolo. Es la de mayor oficio tipográfico y la más personal, pero la menos eficaz en espacios pequeños.',
  'Elija **B · Hebras** si Evelyn prefiere una marca más cálida, y acepta renovar la paleta del sitio. Antes conviene probar cómo la perciben personas ajenas al proyecto, por las lecturas de cadena y de permanencia, y que una persona especialista revise la marca similar detectada.',
  'La decisión es de Evelyn. Las tres quedan completas y la identidad oficial del sitio no se cambió.',
];

for (const p of Object.values(PROPUESTAS)) { escribir(`brand-guidelines/guia-${p.id}.html`, guia(p)); await pdf(p.id); }
const tab = await tableros();
escribir('comparativa/evaluacion.md', evaluacionMD());
await cerrar();
console.log('guías y tableros', tab.length);
