// Genera logotipos, favicons, papelería, redes, patrones y tokens de las tres propuestas.
import { PROPUESTAS, caja, copia, aOrigen, simboloB, simboloA, simboloC, bloqueC, nombreC } from './marcas.mjs';
import { texto, paper, rect } from './lib.mjs';
import { MODOS, escribir, paths, logoSVG, png, ico, optimo, cerrar, NOMBRE } from './comun.mjs';

const TIPOS = {
  a: { display: ['BodoniModa.ttf', { opsz: 14, wght: 430 }], cursiva: ['BodoniModa-Italic.ttf', { opsz: 14, wght: 400 }], texto: ['InstrumentSans.ttf', { wght: 400, wdth: 100 }], trackD: .23 },
  b: { display: ['TenorSans.ttf', undefined], cursiva: ['HankenGrotesk.ttf', { wght: 450 }], texto: ['HankenGrotesk.ttf', { wght: 400 }], trackD: .012 },
  c: { display: ['IbarraRealNova.ttf', { wght: 420 }], cursiva: ['IbarraRealNova-Italic.ttf', { wght: 400 }], texto: ['SourceSerif4.ttf', { opsz: 12, wght: 400 }], trackD: .12 },
};
const CONTACTO = ['Teléfono por confirmar', 'Correo por confirmar', 'Dirección por confirmar'];
const CARNE = 'Carné profesional por confirmar';

const T = (id, cad, tipo, size, x, y, fill, { track = .02, ancla = 'i', op = 1 } = {}) => {
  const [f, v] = TIPOS[id][tipo];
  const t = texto(f, v, cad, { size, tracking: size * track });
  const b = t.bounds;
  const dx = ancla === 'i' ? x - b.left : ancla === 'd' ? x - b.right : x - b.center.x;
  t.translate(new paper.Point(dx, y));
  return `<path fill="${fill}"${op < 1 ? ` opacity="${op}"` : ''} d="${t.pathData}"/>`;
};
// Coloca un logo con alto o ancho dado.
const pone = (partes, col, x, y, { w, h, op = 1 } = {}) => {
  const a = aOrigen(partes), b = caja(a), e = w ? w / b.width : h / b.height;
  const g = paths(copia(a, { e, x, y }), col);
  return op < 1 ? `<g opacity="${op}">${g}</g>` : g;
};
const medidas = (partes, { w, h }) => { const b = caja(partes); const e = w ? w / b.width : h / b.height; return { w: b.width * e, h: b.height * e }; };
const barras = (x, y, w, n, salto, color, cortes = []) => { let s = ''; for (let i = 0; i < n; i++) { if (cortes.includes(i)) continue; const f = (i % 7 === 6 || cortes.includes(i + 1)) ? .62 : 1 - ((i * 37) % 9) * .012; s += `<rect x="${x}" y="${y + i * salto}" width="${(w * f).toFixed(1)}" height="9" fill="${color}"/>`; } return s; };
const doc = (W, H, cuerpo, titulo) => optimo(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img"><title>${titulo}</title>${cuerpo}</svg>`);

async function logos(p) {
  const c = p.color, m = MODOS(c), inv = [];
  for (const [comp, fn] of [['principal-horizontal', p.horizontal], ['compacta-vertical', p.vertical], ['isotipo', p.isotipo], ['isotipo-reducido', p.favicon]]) {
    for (const [modo, col] of Object.entries(m)) {
      const { svg, W, H } = logoSVG(fn(), col, { titulo: comp.startsWith('isotipo') ? `Símbolo de Evelyn Elizondo, propuesta ${p.nombre}` : NOMBRE, pad: col.fondo ? .1 : 0, fondo: col.fondo });
      const base = `propuesta-${p.id}/logos`;
      escribir(`${base}/svg/${comp}-${modo}.svg`, svg);
      await png(svg, W, H, `${base}/png/${comp}-${modo}.png`, { lado: comp.startsWith('isotipo') ? 2000 : 3000 });
      inv.push(`${comp}-${modo}`);
    }
  }
  // Cabeceras a la medida exacta del sitio: 240 x 48, alineadas a la izquierda.
  for (const [modo, col] of [['oscuro', m.oscuro], ['claro', m.claro]]) {
    const a = aOrigen(p.cabecera()), b = caja(a), e = Math.min(236 / b.width, 40 / b.height);
    const cuerpo = paths(copia(a, { e, y: (48 - b.height * e) / 2 }), col);
    escribir(`propuesta-${p.id}/aplicaciones/cabecera-${modo}.svg`, doc(240, 48, cuerpo, 'Evelyn Elizondo'));
  }
  return inv;
}

async function favicons(p) {
  const c = p.color;
  const fondo = p.id === 'c' ? c.acento : c.tinta;
  const col = p.id === 'c' ? { tinta: '#FFFFFF', acento: '#FFFFFF' } : p.id === 'a' ? { tinta: c.tintaOsc, acento: c.acentoOsc } : { tinta: c.tintaOsc, acento: c.tintaOsc };
  const hacer = (fr, fn = p.favicon) => { const a = aOrigen(fn()), b = caja(a), e = (100 * fr) / Math.max(b.width, b.height); const f = copia(a, { e, x: (100 - b.width * e) / 2, y: (100 - b.height * e) / 2 }); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><title>Evelyn Elizondo</title><rect width="100" height="100" fill="${fondo}"/>${paths(f, col)}</svg>`; };
  const base = `propuesta-${p.id}/favicon`;
  const svg = optimo(hacer(.72)); escribir(`${base}/favicon.svg`, svg);
  const ent = [];
  // A 16 px hay un dibujo propio cuando el general se empasta.
  const svg16 = optimo(hacer(.78, p.favicon16 ?? p.favicon)); escribir(`${base}/favicon-16.svg`, svg16);
  for (const t of [16, 32, 48]) ent.push({ tam: t, buf: await png(t === 16 ? svg16 : svg, 100, 100, `${base}/favicon-${t}.png`, { lado: t }) });
  escribir(`${base}/favicon.ico`, ico(ent));
  for (const [t, n] of [[180, 'apple-touch-icon'], [192, 'icon-192'], [512, 'icon-512']]) await png(svg, 100, 100, `${base}/${n}.png`, { lado: t });
  const mask = optimo(hacer(.54)); escribir(`${base}/icon-maskable.svg`, mask);
  await png(mask, 100, 100, `${base}/icon-maskable-512.png`, { lado: 512 });
}

function papeleria(p) {
  const id = p.id, c = p.color, m = MODOS(c), cla = m.claro, osc = m.oscuro;
  const papel = id === 'c' ? '#FBF8F1' : id === 'b' ? '#FAF7F0' : '#FAF7F2';
  const gris = id === 'a' ? '#D9D2CD' : id === 'b' ? '#D5D7CC' : '#DDD8CE';
  const baja = c.acentoTexto, tin = c.tinta;
  const base = `propuesta-${id}/papeleria`;
  // ── Hoja A4 (décimas de milímetro: 2100 x 2970)
  let hoja = `<rect width="2100" height="2970" fill="${papel}"/>`;
  if (id === 'a') {
    hoja += pone(simboloA(), { tinta: c.acento, acento: c.acento }, 1180, 1120, { h: 1300, op: .08 });
    hoja = `<defs><clipPath id="r"><rect width="2100" height="2970"/></clipPath></defs><g clip-path="url(#r)">${hoja}</g>`;
    hoja += pone(p.horizontal(), cla, 200, 190, { w: 980 });
    hoja += barras(200, 660, 1500, 8, 56, gris) + barras(200, 1180, 1500, 9, 56, gris) + barras(200, 1760, 1500, 5, 56, gris);
    hoja += `<rect x="200" y="2650" width="1700" height="2.4" fill="${c.acento}"/>`;
    CONTACTO.forEach((t, i) => { hoja += T(id, t, 'texto', 27, 200 + i * 440, 2710, tin, { track: .015 }); });
    hoja += T(id, CARNE, 'cursiva', 30, 1900, 2710, baja, { ancla: 'd', track: .02 });
  } else if (id === 'b') {
    hoja += `<defs><clipPath id="r"><rect width="2100" height="2970"/></clipPath></defs><g clip-path="url(#r)">${pone(simboloB({ acentoCentro: false }), { tinta: c.tinta, acento: c.tinta }, 1010, 2070, { h: 1500, op: .06 })}</g>`;
    hoja += pone(simboloB(), cla, 1740, 180, { h: 170 });
    hoja += T(id, 'Evelyn Elizondo', 'display', 66, 200, 280, tin, { track: .012 });
    hoja += T(id, 'Derecho de Familia  ·  Costa Rica', 'cursiva', 25, 200, 332, baja, { track: .05 });
    hoja += barras(560, 660, 1340, 8, 56, gris) + barras(560, 1180, 1340, 9, 56, gris) + barras(560, 1760, 1340, 5, 56, gris);
    [...CONTACTO, CARNE].forEach((t, i) => { hoja += T(id, t, 'texto', 27, 200, 2570 + i * 46, tin, { track: .015 }); });
  } else {
    hoja += `<rect x="96" y="0" width="5" height="2970" fill="${c.acento}"/>`;
    hoja += pone(nombreC({ tam: 40 }), cla, 240, 210, { w: 1200 });
    hoja += T(id, 'Derecho de Familia, Costa Rica', 'cursiva', 34, 1440, 400, tin, { ancla: 'd', track: .03 });
    hoja += barras(240, 660, 1560, 8, 56, gris) + barras(240, 1180, 1560, 9, 56, gris) + barras(240, 1760, 1560, 5, 56, gris);
    hoja += T(id, [...CONTACTO, CARNE].join('   ·   '), 'texto', 27, 240, 2730, tin, { track: .01 });
  }
  escribir(`${base}/hoja-membretada-a4.svg`, doc(2100, 2970, hoja, 'Hoja membretada A4'));
  // ── Sobre DL (2200 x 1100), anverso y reverso
  let sobre = `<rect width="2200" height="1100" fill="${papel}"/>`;
  if (id === 'c') sobre += pone(nombreC({ tam: 40 }), cla, 130, 110, { w: 720 }); else sobre += pone(p.horizontal(), cla, 130, 110, { w: 760 });
  escribir(`${base}/sobre-dl-anverso.svg`, doc(2200, 1100, sobre, 'Sobre DL, anverso'));
  const fondoR = id === 'c' ? c.acento : c.tinta;
  const colR = id === 'c' ? { tinta: '#FFFFFF', acento: '#FFFFFF' } : osc;
  let rev = `<rect width="2200" height="1100" fill="${fondoR}"/>`;
  const dRev = medidas(p.isotipo(), { h: 340 }); rev += pone(p.isotipo(), colR, (2200 - dRev.w) / 2, 380, { h: 340 });
  escribir(`${base}/sobre-dl-reverso.svg`, doc(2200, 1100, rev, 'Sobre DL, reverso'));
  // ── Tarjeta 85 x 55 mm (850 x 550)
  let fr = `<rect width="850" height="550" fill="${papel}"/>`;
  if (id === 'a') {
    fr += pone(simboloA(), cla, 62, 54, { h: 96 });
    fr += T(id, 'EVELYN ELIZONDO', 'display', 37, 62, 226, tin, { track: .2 });
    fr += T(id, 'Derecho de Familia, Costa Rica', 'cursiva', 27, 62, 268, baja, { track: .03 });
    [...CONTACTO, CARNE].forEach((t, i) => { fr += T(id, t, 'texto', 23, 62, 372 + i * 34, tin, { track: .01 }); });
  } else if (id === 'b') {
    fr += pone(simboloB(), cla, 668, 54, { h: 124 });
    fr += T(id, 'Evelyn Elizondo', 'display', 52, 58, 118, tin, { track: .012 });
    fr += T(id, 'Derecho de Familia, Costa Rica', 'cursiva', 23, 58, 164, baja, { track: .04 });
    [...CONTACTO, CARNE].forEach((t, i) => { fr += T(id, t, 'texto', 23, 58, 372 + i * 34, tin, { track: .01 }); });
  } else {
    fr += pone(nombreC({ tam: 40 }), cla, 62, 72, { w: 700 });
    fr += T(id, 'Derecho de Familia, Costa Rica', 'cursiva', 27, 762, 212, tin, { ancla: 'd', track: .03 });
    [...CONTACTO, CARNE].forEach((t, i) => { fr += T(id, t, 'texto', 23, 62, 372 + i * 34, tin, { track: .01 }); });
  }
  escribir(`${base}/tarjeta-anverso.svg`, doc(850, 550, fr, 'Tarjeta profesional, anverso'));
  let at = `<rect width="850" height="550" fill="${fondoR}"/>`;
  if (id === 'a') { const d = medidas(simboloA(), { h: 210 }); at += pone(simboloA(), osc, (850 - d.w) / 2, 170, { h: 210 }); }
  else if (id === 'b') { at += `<defs><clipPath id="t"><rect width="850" height="550"/></clipPath></defs><g clip-path="url(#t)">${pone(simboloB({ acentoCentro: false }), { tinta: c.tintaOsc, acento: c.tintaOsc }, 270, -190, { h: 900, op: .12 })}</g>`; const d = medidas(simboloB(), { h: 130 }); at += pone(simboloB(), osc, 62, 358, { h: 130 }); }
  else { const mv = bloqueC(); const d = medidas(mv, { w: 560 }); at += pone(mv, colR, (850 - d.w) / 2, (550 - d.h) / 2, { w: 560 }); }
  escribir(`${base}/tarjeta-reverso.svg`, doc(850, 550, at, 'Tarjeta profesional, reverso'));
}

function redes(p) {
  const id = p.id, c = p.color, osc = MODOS(c).oscuro;
  const base = `propuesta-${id}/redes`;
  const fondo = id === 'c' ? c.fondoClaro : c.tinta, col = id === 'c' ? MODOS(c).claro : osc;
  const comp = p.horizontal(); const d = medidas(comp, { w: 860 });
  const og = `<rect width="1200" height="630" fill="${fondo}"/>` + pone(comp, col, (1200 - d.w) / 2, (630 - d.h) / 2, { w: 860 });
  escribir(`${base}/og-1200x630.svg`, doc(1200, 630, og, NOMBRE));
  const fav = id === 'c' ? c.acento : c.tinta, colA = id === 'c' ? { tinta: '#FFFFFF', acento: '#FFFFFF' } : osc;
  const iso = p.isotipo(); const di = medidas(iso, { h: 520 });
  const av = `<rect width="1080" height="1080" fill="${fav}"/>` + pone(iso, colA, (1080 - di.w) / 2, (1080 - di.h) / 2, { h: 520 });
  escribir(`${base}/avatar-1080.svg`, doc(1080, 1080, av, 'Evelyn Elizondo'));
  // Firma de correo: datos pendientes marcados como tales.
  const tin = c.tinta;
  let f = `<rect width="640" height="170" fill="#FFFFFF"/>` + pone(p.isotipo(), MODOS(c).claro, 20, 34, { h: 100 });
  f += `<rect x="150" y="30" width="1.4" height="110" fill="${c.acento}"/>`;
  f += T(id, id === 'b' ? 'Evelyn Elizondo' : 'EVELYN ELIZONDO', 'display', id === 'b' ? 30 : 23, 172, 62, tin, { track: id === 'a' ? .2 : id === 'c' ? .12 : .012 });
  f += T(id, 'Derecho de Familia, Costa Rica', 'cursiva', 16.5, 172, 90, c.acentoTexto, { track: .03 });
  f += T(id, 'Teléfono y correo por confirmar', 'texto', 13.5, 172, 124, tin, { track: .01 });
  escribir(`${base}/firma-correo.svg`, doc(640, 170, f, 'Firma de correo'));
}

function patron(p) {
  const id = p.id, c = p.color;
  let tile, W, H;
  if (id === 'a') { // Astas a 12°: la inclinación de la cursiva, alternando pesos.
    // La baldosa mide lo que se desplaza un asta a 12° en toda su altura: así las líneas enlazan sin cortes.
    H = 600; W = H * Math.tan(12 * Math.PI / 180);
    const s = (x, g) => `<path fill="${c.acentoOsc}" d="M${(x + W).toFixed(3)} 0h${g}L${(x + g).toFixed(3)} ${H}h${-g}Z"/>`;
    tile = [0, 1, 2, 3, 4].map(i => { const g = i === 0 ? 8 : 1.1, x = i * W / 5; return s(x, g) + s(x - W, g); }).join('');
  } else if (id === 'b') {
    W = 200; H = 200; const s = copia(aOrigen(simboloB({ acentoCentro: false })), { e: 1.5, x: 26, y: 26 });
    tile = paths(s, { tinta: c.acentoOsc, acento: c.acentoOsc });
  } else {
    W = 220; H = 180; const e1 = texto('IbarraRealNova.ttf', { wght: 400 }, 'E', { size: 74 }); e1.translate(new paper.Point(36, 76)); const e2 = texto('IbarraRealNova.ttf', { wght: 400 }, 'E', { size: 74 }); e2.translate(new paper.Point(146, 166));
    tile = `<path fill="${c.acentoOsc}" d="${e1.pathData}${e2.pathData}"/>`;
  }
  const fondo = id === 'c' ? c.tinta : c.tinta;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" role="img"><title>Patrón de marca, propuesta ${p.nombre}</title><defs><pattern id="p" width="${W}" height="${H}" patternUnits="userSpaceOnUse"${id === 'b' ? '' : ''}>${tile}</pattern></defs><rect width="1200" height="800" fill="${fondo}"/><rect width="1200" height="800" fill="url(#p)" opacity="${id === 'a' ? .55 : .3}"/></svg>`;
  escribir(`propuesta-${id}/patron/patron.svg`, optimo(svg));
}

function tokens(p) {
  const c = p.color, t = TIPOS[p.id];
  const fams = { a: ['Bodoni Moda', 'Instrument Sans'], b: ['Tenor Sans', 'Hanken Grotesk'], c: ['Ibarra Real Nova', 'Source Serif 4'] }[p.id];
  const j = { nombre: p.nombre, color: { primario: c.tinta, acento: c.acento, acentoTextoSobreClaro: c.acentoTexto, fondoClaro: c.fondoClaro, fondoOscuro: c.fondoOscuro, textoSobreOscuro: c.tintaOsc, acentoSobreOscuro: c.acentoOsc, acentoTextoSobreOscuro: c.acentoTextoOsc }, tipografia: { titulares: fams[0], texto: fams[1], licencia: 'SIL OFL 1.1' } };
  escribir(`propuesta-${p.id}/tokens.json`, JSON.stringify(j, null, 2) + '\n');
  escribir(`propuesta-${p.id}/tokens.css`, `:root {\n${Object.entries(j.color).map(([k, v]) => `  --marca-${k.replace(/[A-Z]/g, l => '-' + l.toLowerCase())}: ${v};`).join('\n')}\n  --marca-fuente-titulares: '${fams[0]}', serif;\n  --marca-fuente-texto: '${fams[1]}', sans-serif;\n}\n`);
}

const inventario = {};
for (const p of Object.values(PROPUESTAS)) {
  inventario[p.id] = await logos(p);
  await favicons(p); papeleria(p); redes(p); patron(p); tokens(p);
  console.log('propuesta', p.id, 'lista');
}
await cerrar();
