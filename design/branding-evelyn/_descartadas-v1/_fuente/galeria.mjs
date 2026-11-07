// Galería local: index.html y README de cada propuesta. Solo rutas relativas; funciona desde file://.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PROPUESTAS } from './marcas.mjs';
import { escribir, RAIZ } from './comun.mjs';
import { DATOS, CRITERIOS } from './datos.mjs';
const REC = readFileSync(join(RAIZ, 'comparativa/evaluacion.md'), 'utf8').split('## Recomendación')[1].trim().split('\n\n').map(t => t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'));
const v = existsSync(join(RAIZ, 'brand-guidelines/validacion.json')) ? JSON.parse(readFileSync(join(RAIZ, 'brand-guidelines/validacion.json'), 'utf8')) : null;
const ids = ['a', 'b', 'c'];
const total = id => CRITERIOS.reduce((s, [, c]) => s + c[id][0], 0);

const seccion = id => {
  const d = DATOS[id], c = PROPUESTAS[id].color, R = `propuesta-${id}`;
  const fig = (f, t, cls = '') => `<figure class="${cls}"><a href="${R}/${f}"><img loading="lazy" src="${R}/${f}" alt="${t}"></a><figcaption>${t}</figcaption></figure>`;
  const lam = (f, t, fondo, alto = '') => `<figure><a class="lam" href="${R}/logos/svg/${f}.svg" style="background:${fondo}"><img loading="lazy" src="${R}/logos/svg/${f}.svg" alt="${t}" style="${alto}"></a><figcaption>${t}</figcaption></figure>`;
  return `<section id="propuesta-${id}" class="prop" style="--t:${c.tinta};--a:${c.acentoTexto};--f:${c.fondoClaro};--o:${c.fondoOscuro}">
<header class="cab" style="background:${c.fondoOscuro};color:${c.fondoClaro}"><div class="med"><p class="eti" style="color:${c.acentoTextoOsc}">Propuesta ${id.toUpperCase()} · ${d.sub}</p><img class="logo" src="${R}/logos/svg/principal-horizontal-oscuro.svg" alt="Logotipo principal de la propuesta ${d.nombre}"><h2>${d.nombre}</h2><p class="idea">${d.idea}</p></div></header>
<div class="med cuerpo"><div class="txt">${d.concepto.map(t => `<p>${t}</p>`).join('')}</div>
<h3>Logotipos</h3><div class="g g3">
${lam('principal-horizontal-claro', 'Principal, fondo claro', c.fondoClaro)}${lam('compacta-vertical-claro', 'Compacta, fondo claro', c.fondoClaro)}${lam('isotipo-claro', 'Isotipo, fondo claro', c.fondoClaro)}
${lam('principal-horizontal-oscuro', 'Principal, fondo oscuro', c.fondoOscuro)}${lam('compacta-vertical-oscuro', 'Compacta, fondo oscuro', c.fondoOscuro)}${lam('isotipo-oscuro', 'Isotipo, fondo oscuro', c.fondoOscuro)}
${lam('principal-horizontal-mono-negro', 'Monocromo negro', '#FFFFFF')}${lam('principal-horizontal-mono-blanco', 'Monocromo blanco', '#000000')}<figure><a class="lam" style="padding:0;background:${c.fondoOscuro}" href="${R}/logos/svg/principal-horizontal-invertido.svg"><img loading="lazy" src="${R}/logos/svg/principal-horizontal-invertido.svg" alt="Versión invertida" style="width:100%;max-height:none"></a><figcaption>Invertido, con fondo</figcaption></figure></div>
<h3>Color y tipografía</h3><div class="sws">${d.paleta.map(([n, h]) => `<div class="sw"><span style="background:${h}"></span><b>${n}</b><code>${h}</code></div>`).join('')}</div>
<p class="fuentes">${d.fuentes.map(f => `<strong>${f[0]}</strong>: ${f[1]}`).join('<br>')}<br>Ambas con licencia SIL Open Font License 1.1.</p>
<h3>Favicon</h3><div class="favs">${[64, 48, 32, 24, 16].map(s => `<img src="${R}/favicon/favicon${s === 16 ? '-16' : ''}.svg" width="${s}" height="${s}" alt="Favicon a ${s} píxeles">`).join('')}<span>64, 48, 32, 24 y 16 px</span></div>
<h3>En el sitio</h3><div class="g g2">${fig('aplicaciones/portada-actual-con-logo.png', 'Portada actual con este logotipo')}${fig('aplicaciones/portada-con-paleta-propia.png', 'Portada con su paleta y fuentes (simulación)')}</div>
<div class="g g1">${fig('aplicaciones/cabecera-sobre-portada.png', 'Cabecera sobre la portada', 'tira')}${fig('aplicaciones/cabecera-pagina-interior.png', 'Cabecera en una página interior', 'tira')}</div>
<h3>Papelería y tarjeta</h3><div class="g g2">${fig('aplicaciones/papeleria.png', 'Hoja A4, sobre DL y tarjeta')}${fig('aplicaciones/tarjeta.png', 'Tarjeta profesional, 85 x 55 mm')}</div>
<h3>Patrón y redes</h3><div class="g g3">${fig('patron/patron.svg', 'Patrón de marca')}${fig('redes/og-1200x630.svg', 'Imagen para compartir')}${fig('redes/firma-correo.svg', 'Firma de correo')}</div>
<h3>Riesgos que conviene conocer</h3><ul>${d.riesgos.map(r => `<li>${r}</li>`).join('')}</ul>
<p class="enl"><a href="brand-guidelines/guia-${id}.html">Abrir la guía de marca</a> · <a href="brand-guidelines/guia-${id}.pdf">Guía en PDF</a> · <a href="${R}/README.md">Lista de archivos</a> · <a href="${R}/tokens.css">Tokens CSS</a></p></div></section>`;
};
const ESC = [['01-logotipo-principal', 'Logotipo principal'], ['02-compacta-e-isotipo', 'Compacta e isotipo'], ['03-monocromo', 'Monocromo'], ['04-favicon-y-reduccion', 'Favicon y reducción'], ['05-cabecera-del-sitio', 'Cabecera del sitio'], ['06-portada-actual', 'Portada actual'], ['07-portada-con-paleta', 'Portada con paleta'], ['08-papeleria', 'Papelería'], ['09-tarjeta', 'Tarjeta']];
const html = `<!doctype html><html lang="es-CR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Identidad de Evelyn Elizondo</title><link rel="icon" href="data:,">
<style>
@font-face{font-family:'Hanken';src:url(_fuente/fuentes/HankenGrotesk.ttf);font-weight:100 900}
@font-face{font-family:'Ibarra';src:url(_fuente/fuentes/IbarraRealNova.ttf);font-weight:400 700}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:64px}body{margin:0;background:#FBFAF7;color:#1B1A18;font:17px/1.6 'Hanken',system-ui,sans-serif}
a{color:inherit}img{max-width:100%;display:block}.med{width:min(1320px,100% - 32px);margin-inline:auto}
nav{position:sticky;top:0;z-index:5;background:#FBFAF7ee;backdrop-filter:blur(6px);border-bottom:1px solid #E4E0D8}nav div{display:flex;gap:6px 20px;flex-wrap:wrap;align-items:center;padding:12px 0;font-size:15px}nav b{margin-right:auto;font-weight:600}nav a{text-decoration:none}nav a:hover{text-decoration:underline}
h1,h2{font-family:'Ibarra',Georgia,serif;font-weight:400;line-height:1.08;margin:0}h1{font-size:clamp(40px,7vw,88px)}h2{font-size:clamp(32px,4.4vw,56px)}h3{font-size:15px;font-weight:600;margin:52px 0 14px;padding-top:14px;border-top:1px solid #E4E0D8}
.ini{padding:clamp(48px,8vw,104px) 0 clamp(40px,6vw,72px)}.ini p{max-width:64ch;font-size:19px}
.tres{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-top:36px}.tres a{display:flex;flex-direction:column;justify-content:space-between;gap:28px;text-decoration:none;padding:26px;min-height:240px;transition:transform .2s}.tres a:hover{transform:translateY(-3px)}.tres img{max-height:96px;width:auto;max-width:100%}.tres small{font-size:14px;display:block}
.cab{padding:clamp(40px,6vw,76px) 0}.cab .logo{width:min(620px,100%);margin:6px 0 44px}.cab h2{margin-bottom:8px}.eti{font-size:14px;margin:0 0 26px}.idea{margin:0;font-size:19px;max-width:52ch}
.cuerpo{padding:40px 0 72px;color:var(--t)}.txt{max-width:68ch}.g{display:grid;gap:12px}.g3{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}.g2{grid-template-columns:repeat(auto-fit,minmax(340px,1fr))}.g1{grid-template-columns:1fr;margin-top:12px}
figure{margin:0;min-width:0}figcaption{font-size:13.5px;margin-top:6px;color:#55524C}.lam{display:flex;align-items:center;justify-content:center;padding:32px;height:210px;border:1px solid rgb(0 0 0/.07)}.lam img{max-height:140px;max-width:100%}
figure>a:not(.lam)>img{width:100%;border:1px solid rgb(0 0 0/.07)}.tira img{width:100%}
.sws{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px}.sw{font-size:13.5px;line-height:1.35}.sw span{display:block;height:84px;border:1px solid rgb(0 0 0/.1);margin-bottom:6px}.sw b{display:block;font-weight:600}.sw code{font-size:13px}.fuentes{margin-top:20px;font-size:15.5px;max-width:78ch}
.favs{display:flex;align-items:end;gap:16px;flex-wrap:wrap}.favs span{font-size:13.5px;color:#55524C}.enl{margin-top:34px;font-weight:500}
.band{padding:clamp(48px,7vw,88px) 0;border-top:1px solid #E4E0D8}.band p{max-width:70ch}
.tabs{display:flex;flex-wrap:wrap;gap:6px;margin:22px 0}.tabs button{font:inherit;font-size:15px;min-height:44px;padding:8px 14px;background:transparent;border:1px solid #B9B4A9;color:inherit;cursor:pointer}.tabs button[aria-selected=true]{background:#1B1A18;color:#fff;border-color:#1B1A18}.tabs button:focus-visible,a:focus-visible{outline:2px solid #1B1A18;outline-offset:2px}
.tablero{width:100%;border:1px solid #E4E0D8}.tw{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:760px;font-size:15px}th,td{padding:12px 10px;border-bottom:1px solid #E4E0D8;text-align:left;vertical-align:top}th{font-weight:600}td b{font-size:19px;display:block;font-weight:600}tfoot td{font-weight:600}
.est{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}.est div{padding:18px;background:#F3F0E9;font-size:15.5px}.est b{display:block}.est h4{margin:0 0 6px;font-size:15px}
@media (max-width:520px){.lam{height:170px;padding:22px}.g2,.g3{grid-template-columns:1fr}}
</style></head><body>
<nav aria-label="Secciones"><div class="med"><b>Evelyn Elizondo · identidad</b><a href="#propuesta-a">A · Nexo</a><a href="#propuesta-b">B · Hebras</a><a href="#propuesta-c">C · Rúbrica</a><a href="#comparar">Comparar</a><a href="#evaluacion">Evaluación</a><a href="#proceso">Proceso</a></div></nav>
<main>
<div class="ini med"><h1>Tres identidades para Evelyn Elizondo</h1><p>Derecho de Familia, Costa Rica. Tres lenguajes formales distintos, cada uno completo: logotipos vectoriales, paleta, tipografía, favicon, papelería y aplicación sobre el sitio real. Nada se ha cambiado en el sitio: la decisión está pendiente.</p>
<div class="tres">${ids.map(id => { const c = PROPUESTAS[id].color; return `<a href="#propuesta-${id}" style="background:${c.fondoClaro};color:${c.tinta}"><img src="propuesta-${id}/logos/svg/isotipo-claro.svg" alt=""><span><strong>${id.toUpperCase()} · ${DATOS[id].nombre}</strong><small>${DATOS[id].idea}</small></span></a>`; }).join('')}</div></div>
${ids.map(seccion).join('\n')}
<section id="comparar" class="band"><div class="med"><h2>Comparar a la misma escala</h2><p>Mismos escenarios, misma medida y mismo fondo de mesa.</p>
<div class="tabs" role="tablist" aria-label="Escenario">${ESC.map(([f, t], i) => `<button role="tab" type="button" aria-selected="${i === 0}" aria-controls="tablero" data-f="comparativa/${f}.png" data-t="${t}">${t}</button>`).join('')}</div>
<a id="enlace" href="comparativa/${ESC[0][0]}.png"><img id="tablero" role="tabpanel" class="tablero" src="comparativa/${ESC[0][0]}.png" alt="Comparación: ${ESC[0][1]}"></a></div></section>
<section id="evaluacion" class="band"><div class="med"><h2>Evaluación</h2><p>De 1 a 5. Es un juicio razonado de quien diseñó las propuestas, no una prueba con personas usuarias: conviene contrastarlo con Evelyn y con personas ajenas al proyecto.</p>
<div class="tw" tabindex="0" role="region" aria-label="Tabla de evaluación"><table><thead><tr><th>Criterio</th>${ids.map(id => `<th>${id.toUpperCase()} · ${DATOS[id].nombre}</th>`).join('')}</tr></thead><tbody>${CRITERIOS.map(([n, c]) => `<tr><th scope="row">${n}</th>${ids.map(id => `<td><b>${c[id][0]}</b>${c[id][1]}</td>`).join('')}</tr>`).join('')}</tbody><tfoot><tr><td>Total sobre 40</td>${ids.map(id => `<td>${total(id)}</td>`).join('')}</tr></tfoot></table></div>
<h3>Recomendación</h3>${REC.map(p => `<p>${p}</p>`).join('')}</div></section>
<section id="proceso" class="band"><div class="med"><h2>Proceso y estado</h2>
<h3>Bocetos descartados y ciclos de crítica</h3><div class="g g3">${[['ronda-1', 'Ronda 1: 24 opciones, entre monogramas, símbolos y fuentes'], ['ronda-2', 'Ronda 2: redibujo. El marco C10 se retiró después: se leía «IVELYN»'], ['ronda-3-orientacion-hebras', 'Ronda 3: B se leía como una S; se buscó otra orientación'], ['logo-actual-auditoria', 'Logo actual, punto de partida de la auditoría']].map(([f, t]) => `<figure><a href="comparativa/bocetos/${f}.png"><img loading="lazy" src="comparativa/bocetos/${f}.png" alt="${t}"></a><figcaption>${t}</figcaption></figure>`).join('')}</div>
<h3>Comprobaciones automáticas</h3><div class="est"><div><h4>Archivos</h4>${v ? `${v.svg} SVG y ${v.png} PNG; ${v.fallos.length} fallos en la validación.` : 'Sin datos.'}</div><div><h4>Parecido entre isotipos</h4>${v ? Object.entries(v.parecidos).map(([k, n]) => `${k}: ${(n * 100).toFixed(0)} %`).join(' · ') : ''}<br>Solape de siluetas; 100 % serían iguales.</div><div><h4>Vectores</h4>Sin texto vivo, sin raster incrustado, sin scripts ni enlaces externos.</div></div>
<h3>Documentos</h3><p><a href="brand-guidelines/auditoria-e-investigacion.md">Auditoría, investigación y evaluación de herramientas</a> · <a href="comparativa/evaluacion.md">Evaluación en texto</a> · <a href="brand-guidelines/validacion.json">Resultado de la validación</a></p>
<h3>Lo que falta y no se pudo hacer aquí</h3><ul><li>Decisión de Evelyn entre las tres propuestas.</li><li>Búsqueda de anterioridades de marca en el Registro Nacional de Costa Rica. Las búsquedas web hechas no equivalen a una autorización de registro.</li><li>Teléfono, correo, dirección y carné profesional, que siguen «por confirmar».</li><li>Prueba de imprenta: colores CMYK aproximados y papelería sin sangrado.</li><li>Prueba con personas: la percepción de cada marca no se ha medido.</li></ul></div></section>
</main>
<script>
const tabs=[...document.querySelectorAll('[role=tab]')],im=document.getElementById('tablero'),en=document.getElementById('enlace');
const elegir=b=>{tabs.forEach(x=>x.setAttribute('aria-selected',x===b));im.src=b.dataset.f;im.alt='Comparación: '+b.dataset.t;en.href=b.dataset.f;};
tabs.forEach((b,i)=>{b.addEventListener('click',()=>elegir(b));b.addEventListener('keydown',e=>{const d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(d){const n=tabs[(i+d+tabs.length)%tabs.length];n.focus();elegir(n);}});});
</script></body></html>`;
escribir('index.html', html);
for (const id of ids) {
  const d = DATOS[id];
  escribir(`propuesta-${id}/README.md`, `# Propuesta ${id.toUpperCase()}: ${d.nombre}\n\n${d.sub}. ${d.idea}\n\n${d.concepto.map(t => t.replace(/<\/?em>/g, '*')).join('\n\n')}\n\n## Archivos\n\n| Carpeta | Contenido |\n|---|---|\n| \`logos/svg\`, \`logos/png\` | Principal horizontal, compacta, isotipo e isotipo reducido, cada uno en claro, oscuro, mono-negro, mono-blanco e invertido. PNG de hasta 3000 px, transparente salvo el invertido. |\n| \`favicon\` | SVG, ICO (16, 32, 48), Apple touch, 192, 512 y enmascarable. |\n| \`aplicaciones\` | Cabecera a 240 x 48 (SVG) y capturas sobre el sitio real, papelería y tarjeta. |\n| \`papeleria\` | Hoja A4, sobre DL y tarjeta de 85 x 55 mm, en vector. Sin sangrado. |\n| \`redes\` | Imagen para compartir, avatar y firma de correo. |\n| \`patron\` | Patrón de marca. |\n| \`tokens.json\`, \`tokens.css\` | Colores y fuentes como variables. |\n\nGuía completa: [\`../brand-guidelines/guia-${id}.html\`](../brand-guidelines/guia-${id}.html).\n\n## Paleta\n\n${d.paleta.map(([n, h, u]) => `- **${n}** \`${h}\`: ${u}.`).join('\n')}\n\n## Tipografía\n\n${d.fuentes.map(f => `- **${f[0]}**: ${f[1]} SIL OFL 1.1.`).join('\n')}\n\n## Tamaños mínimos\n\n${d.min.map(([n, t]) => `- ${n}: ${t}.`).join('\n')}\n\n${d.proteccion}\n\n## Riesgos\n\n${d.riesgos.map(r => `- ${r.replace('&amp;', '&')}`).join('\n')}\n\nLos datos de contacto y el carné aparecen como «por confirmar»: no se inventó ninguno.\n`);
}
console.log('galería lista');
