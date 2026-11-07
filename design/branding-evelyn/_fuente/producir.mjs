// Logotipos, favicons, papelería y piezas. Todo en vector real.
import { PROPUESTAS, TIPOS, caja, copia, aOrigen, nombre } from './marcas.mjs';
import { texto, paper } from './lib.mjs';
import { MODOS, escribir, paths, logoSVG, png, ico, optimo, cerrar, NOMBRE } from './comun.mjs';
const DESC = ['Derecho de Familia', 'Costa Rica'];
const svgDoc = (W, H, cuerpo, titulo) => optimo(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img"><title>${titulo}</title>${cuerpo}</svg>`);
const rectS = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
const pone = (partes, fill, x, y, { w, h, op } = {}) => { const a = aOrigen(partes), b = caja(a), e = w ? w / b.width : h / b.height; const g = paths(copia(a, { e, x, y }), { tinta: fill }); return op ? `<g opacity="${op}">${g}</g>` : g; };
const mide = (partes, { w, h }) => { const b = caja(partes), e = w ? w / b.width : h / b.height; return { w: b.width * e, h: b.height * e }; };
const T = (id, cad, tipo, size, x, y, fill, { ancla = 'i', tr } = {}) => { const [f, v] = TIPOS[id][tipo]; const t = texto(f, v, cad, { size, tracking: size * (tr ?? (tipo === 'tit' ? TIPOS[id].tr : .004)) }); const b = t.bounds; t.translate(new paper.Point((ancla === 'i' ? x - b.left : ancla === 'd' ? x - b.right : x - b.center.x), y)); return `<path fill="${fill}" d="${t.pathData}"/>`; };
const recorta = (W, H, cuerpo, idc = 'r') => `<defs><clipPath id="${idc}"><rect width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#${idc})">${cuerpo}</g>`;
// Gráfica: el símbolo muy grande y recortado, con encuadre propio de cada marca.
const grafica = (p, W, H, fill) => {
  const hor = W > H;
  if (p.id === 'c') { // El arco, de pie y con la base a sangre: se lee como un portal.
    const g = p.isotipo().map(q => { const c = q.i.clone({ insert: false }); c.rotate(90, new paper.Point(0, 0)); return { i: c, rol: q.rol }; });
    const a = aOrigen(g), alto = hor ? H * 1.02 : Math.min(H * .96, W * 1.02 * (caja(a).height / caja(a).width));
    const d = mide(a, { h: alto });
    return pone(a, fill, hor ? W - d.w - W * .06 : (W - d.w) / 2, H - alto, { h: alto });
  }
  const s = p.isotipo();
  if (p.id === 'a') { const alto = hor ? W * .98 : H * 1.1, d = mide(s, { h: alto }); return pone(s, fill, W - d.w * .985, -alto * (hor ? .13 : .06), { h: alto }); }
  const alto = hor ? W * 1.2 : H * 1.28, d = mide(s, { h: alto });
  return pone(s, fill, hor ? W * .04 : W - d.w * .66, hor ? -alto * .03 : H - alto * .78, { h: alto });
};
// Tipografía enorme, partida como en un cartel.
const cartel = (id, lineas, W, x, y, fill, maxH = 1e9) => { const size = Math.min(maxH / (lineas.length * .9), ...lineas.map(l => { const t = texto(TIPOS[id].tit[0], TIPOS[id].tit[1], l, { size: 100, tracking: 100 * TIPOS[id].tr }); return (W / t.bounds.width) * 100; })); const lh = size * .9; return lineas.map((l, i) => T(id, l, 'tit', size, x, y + i * lh + size * .72, fill)).join(''); };

async function logos(p) {
  const m = MODOS(p.color);
  for (const [comp, fn] of [['principal-horizontal', p.principal], ['principal-con-lema', p.conLema], ['compacta-vertical', p.compacta], ['isotipo', p.isotipo]]) for (const [modo, col] of Object.entries(m)) {
    const { svg, W, H } = logoSVG(fn(), col, { titulo: comp === 'isotipo' ? `Símbolo de Evelyn Elizondo, propuesta ${p.nombre}` : NOMBRE, pad: col.fondo ? .12 : 0, fondo: col.fondo });
    escribir(`propuesta-${p.id}/logos/svg/${comp}-${modo}.svg`, svg);
    await png(svg, W, H, `propuesta-${p.id}/logos/png/${comp}-${modo}.png`, { lado: comp === 'isotipo' ? 2000 : 3000 });
  }
  for (const [modo, col] of [['oscuro', m.oscuro], ['claro', m.claro]]) {
    const a = aOrigen(p.principal()), b = caja(a), e = Math.min(236 / b.width, 44 / b.height);
    escribir(`propuesta-${p.id}/aplicaciones/cabecera-${modo}.svg`, svgDoc(240, 48, paths(copia(a, { e, y: (48 - b.height * e) / 2 }), col), 'Evelyn Elizondo'));
  }
}
async function favicons(p) {
  const c = p.color, base = `propuesta-${p.id}/favicon`;
  const hacer = fr => { const a = aOrigen((p.simboloPeq ?? p.simbolo)()), b = caja(a), e = (100 * fr) / Math.max(b.width, b.height); return optimo(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><title>Evelyn Elizondo</title>${rectS(0, 0, 100, 100, c.o)}${paths(copia(a, { e, x: (100 - b.width * e) / 2, y: (100 - b.height * e) / 2 }), { tinta: c.s })}</svg>`); };
  const svg = hacer(p.id === 'b' ? .76 : p.id === 'a' ? .72 : .68); escribir(`${base}/favicon.svg`, svg);
  const ent = []; for (const t of [16, 32, 48]) ent.push({ tam: t, buf: await png(svg, 100, 100, `${base}/favicon-${t}.png`, { lado: t }) });
  escribir(`${base}/favicon.ico`, ico(ent));
  for (const [t, n] of [[180, 'apple-touch-icon'], [192, 'icon-192'], [512, 'icon-512']]) await png(svg, 100, 100, `${base}/${n}.png`, { lado: t });
  const mask = hacer(.54); escribir(`${base}/icon-maskable.svg`, mask); await png(mask, 100, 100, `${base}/icon-maskable-512.png`, { lado: 512 });
}
export const PIEZAS = {};
function piezas(p) {
  const id = p.id, { o, c, s, m, p: papel, n2 } = p.color, base = `propuesta-${id}/papeleria`;
  const iso = p.isotipo(), nom = () => nombre(id, 40);
  const guarda = (n, W, H, cuerpo, t) => { escribir(`${base}/${n}.svg`, svgDoc(W, H, cuerpo, t)); (PIEZAS[id] ??= {})[n] = { W, H }; };
  const baja = id === 'c', cartelDF = baja ? ['Derecho', 'de', 'familia'] : ['DERECHO', 'DE', 'FAMILIA'], cartelED = baja ? ['Entender', 'antes', 'de', 'decidir'] : ['ENTENDER', 'ANTES', 'DE', 'DECIDIR'];
  // Tarjeta 85 x 55 mm. Solo datos confirmados: el resto de los datos de contacto tiene su sitio reservado.
  guarda('tarjeta-anverso', 850, 550, rectS(0, 0, 850, 550, c) + pone(nom(), o, 54, 54, { h: 122 }) + DESC.map((t, i) => T(id, t, 'txt', 25, 54, 462 + i * 34, o)).join('') + pone(iso, o, 850 - 54 - mide(iso, { h: 92 }).w, 550 - 54 - 92, { h: 92 }), 'Tarjeta, anverso');
  guarda('tarjeta-reverso', 850, 550, rectS(0, 0, 850, 550, o) + recorta(850, 550, grafica(p, 850, 550, s)), 'Tarjeta, reverso');
  // Hoja A4
  let hoja = rectS(0, 0, 2100, 2970, papel) + pone(iso, o, 2100 - 170 - mide(iso, { h: 150 }).w, 170, { h: 150 });
  hoja += pone(nom(), o, 170, 2640, { h: 130 });
  DESC.forEach((t, i) => { hoja += T(id, t, 'txt', 30, 760, 2680 + i * 46, o); });
  for (const [y0, n] of [[620, 8], [1180, 9], [1800, 5]]) for (let i = 0; i < n; i++) hoja += rectS(760, y0 + i * 56, (1170 * (i === n - 1 ? .58 : 1 - ((i * 37) % 9) * .012)).toFixed(0), 9, '#D6D3CC');
  guarda('hoja-membretada-a4', 2100, 2970, hoja, 'Hoja membretada A4');
  // Sobre DL
  guarda('sobre-dl-anverso', 2200, 1100, rectS(0, 0, 2200, 1100, papel) + pone(iso, o, 110, 110, { h: 120 }) + pone(nom(), o, 110, 790, { h: 200 }), 'Sobre DL, anverso');
  guarda('sobre-dl-reverso', 2200, 1100, rectS(0, 0, 2200, 1100, o) + pone(iso, s, 110, 840, { h: 150 }) + DESC.map((t, i) => T(id, t, 'txt', 36, 2090, 930 + i * 52, s, { ancla: 'd' })).join(''), 'Sobre DL, reverso');
  // Carpeta y libreta: la gráfica nunca entra en la franja del nombre.
  guarda('carpeta', 2200, 3100, rectS(0, 0, 2200, 3100, o) + recorta(2200, 2500, grafica(p, 2200, 2500, m), 'cp') + pone(nom(), s, 170, 2660, { h: 270 }), 'Carpeta');
  guarda('libreta', 1400, 2000, rectS(0, 0, 1400, 2000, o) + recorta(1400, 1500, grafica(p, 1400, 1500, s), 'lb') + pone(nom(), s, 110, 1610, { h: 170 }) + T(id, DESC.join(', '), 'txt', 38, 110, 1875, s), 'Libreta');
  // Pantalla de teléfono y piezas de redes
  guarda('telefono', 1170, 2532, rectS(0, 0, 1170, 2532, c) + cartel(id, cartelDF, 1000, 80, 280, o, 1500) + pone(iso, o, 80, 2532 - 150 - 180, { h: 180 }), 'Pantalla de teléfono');
  guarda('post-grafica', 1080, 1350, rectS(0, 0, 1080, 1350, o) + recorta(1080, 1350, grafica(p, 1080, 1350, s), 'pg'), 'Publicación: gráfica');
  guarda('post-cartel', 1080, 1350, rectS(0, 0, 1080, 1350, c) + cartel(id, cartelED, 920, 80, 80, o, 1000) + pone(iso, o, 80, 1350 - 80 - 90, { h: 90 }), 'Publicación: cartel');
  guarda('post-marca', 1080, 1350, rectS(0, 0, 1080, 1350, papel) + pone(iso, o, 80, 80, { h: 200 }) + pone(nom(), o, 80, 1110, { h: 160 }), 'Publicación: marca');
  const pr = p.principal(), d = mide(pr, { w: 720 });
  escribir(`propuesta-${id}/redes/og-1200x630.svg`, svgDoc(1200, 630, rectS(0, 0, 1200, 630, o) + pone(pr, s, (1200 - d.w) / 2, (630 - d.h) / 2, { w: 720 }), NOMBRE));
  const di = mide(iso, { h: 560 });
  escribir(`propuesta-${id}/redes/avatar-1080.svg`, svgDoc(1080, 1080, rectS(0, 0, 1080, 1080, o) + pone(iso, s, (1080 - di.w) / 2, (1080 - di.h) / 2, { h: 560 }), 'Evelyn Elizondo'));
  escribir(`propuesta-${id}/redes/firma-correo.svg`, svgDoc(620, 150, rectS(0, 0, 620, 150, '#FFFFFF') + pone(iso, o, 16, 25, { h: 100 }) + pone(nom(), o, 16 + mide(iso, { h: 100 }).w + 24, 25, { h: 62 }) + T(id, DESC.join(', '), 'txt', 16, 16 + mide(iso, { h: 100 }).w + 24, 122, o), 'Firma de correo'));
  escribir(`propuesta-${id}/patron/patron.svg`, svgDoc(1600, 1000, rectS(0, 0, 1600, 1000, o) + recorta(1600, 1000, grafica(p, 1600, 1000, s), 'pt'), 'Gráfica de marca ampliada'));
}
function tokens(p) {
  const { o, c, s, m, p: pa, n2 } = p.color, f = { a: ['Schibsted Grotesk', 'Schibsted Grotesk'], b: ['Archivo (ancho 125)', 'Archivo'], c: ['Familjen Grotesk', 'Familjen Grotesk'] }[p.id];
  const j = { nombre: p.nombre, color: { oscuro: o, claro: c, sobreOscuro: s, medio: m, papel: pa, oscuroSecundario: n2 }, tipografia: { ...(p.id === 'a' ? { nombre: 'Marcellus' } : {}), titulares: f[0], texto: f[1], licencia: 'SIL OFL 1.1' } };
  escribir(`propuesta-${p.id}/tokens.json`, JSON.stringify(j, null, 2) + '\n');
  escribir(`propuesta-${p.id}/tokens.css`, `:root {\n${Object.entries(j.color).map(([k, v]) => `  --marca-${k.replace(/[A-Z]/g, l => '-' + l.toLowerCase())}: ${v};`).join('\n')}\n  --marca-fuente: '${f[1].replace(/ \(.*/, '')}', sans-serif;\n}\n`);
}
for (const p of Object.values(PROPUESTAS)) { await logos(p); await favicons(p); piezas(p); tokens(p); console.log('propuesta', p.id); }
await cerrar();
