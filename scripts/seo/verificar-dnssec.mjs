// Verifica la cadena DNSSEC de un dominio con dos resolutores públicos (DNS sobre HTTPS). Solo lectura.
// Uso: npm run seo:dnssec [-- dominio]
// Comprueba: DS publicado en el registro padre, DNSKEY en la zona, que alguna DNSKEY corresponda a la
// etiqueta (key tag) y algoritmo del DS, y la bandera AD (respuesta validada) en ambos resolutores.
const dominio = process.argv[2] ?? 'evelynelizondo.com';
const resolutores = {
  // Por IP: no depende del resolutor local, que puede no validar DNSSEC o filtrar estos nombres.
  Cloudflare: (n, t) => `https://1.1.1.1/dns-query?name=${n}&type=${t}&do=1`,
  Google: (n, t) => `https://8.8.8.8/resolve?name=${n}&type=${t}&do=1`
};
const consultar = async (url) => (await fetch(url, { headers: { accept: 'application/dns-json' } })).json();

// Etiqueta de clave (RFC 4034, apéndice B) a partir del RDATA de una DNSKEY en texto: «flags proto alg base64».
function keyTag(texto) {
  const [flags, proto, alg, ...b64] = texto.trim().split(/\s+/);
  const clave = Buffer.from(b64.join(''), 'base64');
  const rdata = Buffer.concat([Buffer.from([(flags >> 8) & 255, flags & 255, Number(proto), Number(alg)]), clave]);
  let ac = 0;
  for (let i = 0; i < rdata.length; i++) ac += i & 1 ? rdata[i] : rdata[i] << 8;
  ac += (ac >> 16) & 0xffff;
  return ac & 0xffff;
}

let ok = true;
const fallo = m => { ok = false; console.log(`  ✘ ${m}`); };
for (const [nombre, url] of Object.entries(resolutores)) {
  console.log(`${nombre}:`);
  try { await consultar(url(dominio, 'SOA')); } catch (e) { fallo(`no se pudo consultar (${e.cause?.code ?? e.message})`); continue; }
  const ds = await consultar(url(dominio, 'DS'));
  const dnskey = await consultar(url(dominio, 'DNSKEY'));
  const a = await consultar(url(dominio, 'A'));
  if (a.Status === 2) fallo('SERVFAIL al resolver A: la cadena DNSSEC está rota');
  const registrosDs = (ds.Answer ?? []).filter(r => r.type === 43).map(r => r.data);
  const claves = (dnskey.Answer ?? []).filter(r => r.type === 48).map(r => r.data);
  if (!registrosDs.length) fallo('sin registro DS en el padre (.com): el registrador aún no lo publicó');
  else console.log(`  ✔ DS: ${registrosDs.join(' | ')}`);
  if (!claves.length) fallo('sin DNSKEY en la zona');
  else console.log(`  ✔ DNSKEY: ${claves.length} (etiquetas ${claves.map(keyTag).join(', ')})`);
  for (const d of registrosDs) {
    const [tag, alg] = d.split(/\s+/).map(Number);
    if (!claves.some(k => keyTag(k) === tag && Number(k.split(/\s+/)[2]) === alg)) fallo(`el DS ${tag}/${alg} no corresponde a ninguna DNSKEY`);
  }
  if (a.AD) console.log('  ✔ AD: la respuesta está validada por DNSSEC');
  else fallo('AD=false: la respuesta no está validada');
}
console.log(ok ? `\nDNSSEC válido para ${dominio}.` : `\nDNSSEC NO validado para ${dominio}. Revise el DS en el registrador (Cloudflare → DNS → Settings → DNSSEC). Contraste con https://dnsviz.net/d/${dominio}/dnssec/`);
process.exit(ok ? 0 : 1);
