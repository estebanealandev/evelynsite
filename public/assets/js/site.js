// Interacciones del sitio. El contenido sigue disponible si este archivo no carga.
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const raiz = document.documentElement;
  raiz.classList.add('mov-listo');
  const sinMovimiento = () => matchMedia('(prefers-reduced-motion: reduce)').matches || raiz.dataset.movimiento === 'pausado';

  // Pausar animaciones: la preferencia queda solo en este navegador.
  const botonesMov = $$('[data-movimiento-btn]');
  const pintarMov = () => {
    const p = raiz.dataset.movimiento === 'pausado';
    botonesMov.forEach(b => { b.setAttribute('aria-pressed', String(p)); b.textContent = p ? 'Reanudar animaciones' : 'Pausar animaciones'; });
  };
  botonesMov.forEach(b => b.addEventListener('click', () => {
    const pausar = raiz.dataset.movimiento !== 'pausado';
    if (pausar) raiz.dataset.movimiento = 'pausado'; else delete raiz.dataset.movimiento;
    try { if (pausar) localStorage.setItem('movimiento', 'pausado'); else localStorage.removeItem('movimiento'); } catch {}
    pintarMov();
    dispatchEvent(new CustomEvent('movimiento', { detail: pausar }));
  }));
  pintarMov();

  // Menú móvil a pantalla completa
  const burger = $('.burger');
  const menu = $('#menu-movil');
  if (burger && menu) {
    const toggle = open => {
      burger.setAttribute('aria-expanded', String(open));
      burger.querySelector('.visually-hidden').textContent = open ? 'Cerrar menú' : 'Abrir menú';
      menu.dataset.open = String(open);
      menu.inert = !open;
      // Con el menú abierto, el foco no debe llegar al contenido que queda detrás.
      $$('main, .site-footer').forEach(el => { el.inert = open; });
      raiz.classList.toggle('menu-abierto', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    menu.inert = true;
    burger.addEventListener('click', () => toggle(burger.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', e => { if (e.target.closest('a')) toggle(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { toggle(false); burger.focus(); }
    });
    matchMedia('(min-width: 1024px)').addEventListener('change', e => { if (e.matches) toggle(false); });
  }

  // Submenú de áreas
  $$('.has-menu').forEach(item => {
    const btn = item.querySelector('button');
    const set = open => { item.dataset.open = String(open); btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', () => set(item.dataset.open !== 'true'));
    if (matchMedia('(hover: hover)').matches) {
      item.addEventListener('mouseenter', () => set(true));
      item.addEventListener('mouseleave', () => set(false));
    }
    item.addEventListener('keydown', e => { if (e.key === 'Escape') { set(false); btn.focus(); } });
    item.addEventListener('focusout', e => { if (!item.contains(e.relatedTarget)) set(false); });
  });

  // Cabecera: transparente sobre el encabezado oscuro, sólida después; se oculta al bajar y vuelve al subir.
  const header = $('.site-header');
  // Solo la portada tiene un encabezado oscuro; en las demás páginas la cabecera es siempre sólida.
  const finHero = $('.h-telon');
  let ultimoY = scrollY;
  const pintarHeader = () => {
    const y = scrollY;
    const solida = finHero ? finHero.getBoundingClientRect().top <= header.offsetHeight : true;
    header.classList.toggle('is-solid', solida);
    const abierto = header.contains(document.activeElement) || $('.has-menu[data-open="true"]');
    if (y < 200 || abierto || y < ultimoY - 4) header.classList.remove('is-oculta');
    else if (y > ultimoY + 6) header.classList.add('is-oculta');
    ultimoY = y;
  };
  header.addEventListener('focusin', () => header.classList.remove('is-oculta'));

  // Efectos ligados al scroll, agrupados en un solo cuadro.
  const paralajes = $$('[data-paralaje]');
  const progreso = $('[data-progreso]');
  const pasos = $('[data-pasos-scroll]');
  let pendiente = false;
  const alScroll = () => {
    pendiente = false;
    pintarHeader();
    if (progreso) {
      const total = document.documentElement.scrollHeight - innerHeight;
      progreso.style.setProperty('--avance', String(total > 0 ? Math.min(1, scrollY / total) : 0));
    }
    if (pasos) {
      const c = pasos.getBoundingClientRect();
      const a = (innerHeight * 0.55 - c.top) / c.height;
      pasos.style.setProperty('--avance', String(Math.max(0, Math.min(1, a))));
    }
    if (!sinMovimiento()) {
      paralajes.forEach(img => {
        const c = img.parentElement.getBoundingClientRect();
        if (c.bottom < 0 || c.top > innerHeight) return;
        const k = (c.top + c.height) / (innerHeight + c.height);
        img.style.transform = `translateY(${(-(1 - k) * 15).toFixed(2)}%)`;
      });
    }
  };
  const pedir = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(alScroll); } };
  addEventListener('scroll', pedir, { passive: true });
  addEventListener('resize', pedir);
  alScroll();

  // Titulares que entran palabra por palabra. El texto sigue siendo uno solo para los lectores de pantalla.
  const partir = el => {
    let i = 0;
    const recorrer = nodo => {
      [...nodo.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const f = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(t => {
            if (!t) return;
            if (/^\s+$/.test(t)) { f.append(' '); return; }
            const w = document.createElement('span');
            w.className = 'palabra';
            const d = document.createElement('span');
            d.style.setProperty('--i', i++);
            d.textContent = t;
            w.append(d);
            f.append(w);
          });
          n.replaceWith(f);
        } else if (n.nodeType === 1) recorrer(n);
      });
    };
    recorrer(el);
  };
  $$('[data-partir]').forEach(partir);

  // Revelado al entrar en pantalla
  const animados = $$('.reveal, [data-mascara], [data-partir]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, o) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); o.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    animados.forEach(el => io.observe(el));
    // El contenido inicial de la página nunca espera al scroll.
    requestAnimationFrame(() => $$('.h-hero__content .reveal, .h-hero__content [data-partir], .page-hero .reveal, .page-hero [data-partir]').forEach(el => el.classList.add('is-in')));
  } else {
    animados.forEach(el => el.classList.add('is-in'));
  }

  // Proceso: resalta el paso que se está leyendo.
  if (pasos && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => en.target.classList.toggle('is-activo', en.isIntersecting));
    }, { rootMargin: '-35% 0px -35% 0px' });
    $$('li', pasos).forEach(li => io.observe(li));
  } else if (pasos) {
    $$('li', pasos).forEach(li => li.classList.add('is-activo'));
  }

  // Áreas: una imagen acompaña al cursor. Solo con ratón y con movimiento activo.
  const listas = $$('.areas[data-preview]');
  if (listas.length && matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)').matches) {
    let caja = null, tx = 0, ty = 0, x = 0, y = 0, animando = false, dentro = false;
    const crear = () => {
      caja = document.createElement('div');
      caja.className = 'areas__preview';
      caja.setAttribute('aria-hidden', 'true');
      document.body.append(caja);
    };
    const mover = () => {
      x += (tx - x) * 0.14; y += (ty - y) * 0.14;
      caja.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      if (dentro || Math.abs(tx - x) > 0.5) requestAnimationFrame(mover); else animando = false;
    };
    listas.forEach(lista => {
      $$('a', lista).forEach(a => {
        a.addEventListener('mouseenter', e => {
          if (sinMovimiento()) return;
          if (!caja) crear();
          let img = $(`img[src="${a.dataset.img}"]`, caja);
          if (!img) { img = new Image(); img.alt = ''; img.src = a.dataset.img; caja.append(img); }
          $$('img', caja).forEach(i => i.classList.toggle('is-activa', i === img));
          if (!dentro) { x = tx = e.clientX + 28; y = ty = e.clientY - 120; }
          dentro = true;
          caja.classList.add('is-visible');
          if (!animando) { animando = true; requestAnimationFrame(mover); }
        });
      });
      lista.addEventListener('mousemove', e => { tx = Math.min(e.clientX + 28, innerWidth - 320); ty = Math.max(e.clientY - 120, 80); });
      lista.addEventListener('mouseleave', () => { dentro = false; caja?.classList.remove('is-visible'); });
    });
  }

  // Índice de lectura: marca la sección visible y se pliega en móvil.
  const toc = $('[data-toc]');
  if (toc) {
    if (matchMedia('(max-width: 1023px)').matches) toc.open = false;
    const enlaces = $$('a', toc);
    const objetivos = enlaces.map(a => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
    const marcar = id => enlaces.forEach(a => { if (decodeURIComponent(a.hash.slice(1)) === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    if ('IntersectionObserver' in window && objetivos.length) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) marcar(en.target.id); });
      }, { rootMargin: '-20% 0px -70% 0px' });
      objetivos.forEach(o => io.observe(o));
    }
    enlaces.forEach(a => a.addEventListener('click', () => { if (matchMedia('(max-width: 1023px)').matches) toc.open = false; }));
  }

  // Salida rápida: oculta la página al instante, la reemplaza en el historial y lleva a un sitio neutro.
  const irAFuera = destino => {
    raiz.style.visibility = 'hidden';
    document.title = '';
    location.replace(destino);
  };
  const salida = $('[data-salida]');
  if (salida) {
    salida.addEventListener('click', e => { e.preventDefault(); irAFuera(salida.href); });
    let ultimaEsc = 0;
    let menuAbiertoAlPulsar = false;
    // Fase de captura: se comprueba antes de que el menú se cierre con esa misma tecla.
    addEventListener('keydown', e => {
      if (e.key === 'Escape') menuAbiertoAlPulsar = !!$('.burger[aria-expanded="true"], .has-menu[data-open="true"]');
    }, true);
    addEventListener('keydown', e => {
      if (e.key !== 'Escape' || e.repeat) return;
      // Si Esc cerró un menú abierto, no cuenta para salir.
      if (menuAbiertoAlPulsar) { menuAbiertoAlPulsar = false; ultimaEsc = 0; return; }
      const ahora = Date.now();
      if (ahora - ultimaEsc < 700) irAFuera(salida.href);
      ultimaEsc = ahora;
    });
  }

  // Orientador: una pregunta a la vez. Señala qué leer; nada se guarda ni se envía.
  $$('[data-guia]').forEach(guia => {
    const datos = JSON.parse($('[data-guia-datos]', guia).textContent);
    const panel = $('[data-guia-panel]', guia);
    let camino = [];
    const crear = (tag, clase, texto) => {
      const el = document.createElement(tag);
      if (clase) el.className = clase;
      if (texto) el.textContent = texto;
      return el;
    };
    const enfocar = () => {
      const t = $('[tabindex="-1"]', panel);
      if (!t) return;
      t.focus({ preventScroll: true });
      t.scrollIntoView({ block: 'center', behavior: sinMovimiento() ? 'auto' : 'smooth' });
    };
    const boton = (clase, texto, accion) => {
      const b = crear('button', clase, texto);
      b.type = 'button';
      b.addEventListener('click', accion);
      return b;
    };
    const controles = () => {
      const c = crear('div', 'guia__ctrl');
      if (camino.length) c.append(boton('guia__atras', 'Volver', () => { preguntar(camino.pop()); enfocar(); }));
      if (camino.length) c.append(boton('guia__atras', 'Empezar de nuevo', () => { camino = []; preguntar(datos.inicio); enfocar(); }));
      return c;
    };
    const preguntar = id => {
      const q = datos.preguntas[id];
      panel.replaceChildren();
      const h = crear('h3', 'guia__q', q.pregunta);
      h.tabIndex = -1;
      const ul = crear('ul', 'guia__ops');
      q.opciones.forEach(o => {
        const li = crear('li');
        li.append(boton('guia__op', o.texto, () => {
          camino.push(id);
          if (o.siguiente) preguntar(o.siguiente);
          else if (o.listado) sinClasificar();
          else resultado(o);
          enfocar();
        }));
        ul.append(li);
      });
      panel.append(h, ul, controles());
    };
    const sinClasificar = () => {
      panel.replaceChildren();
      const c = crear('div', 'guia__res');
      const h = crear('h3', '', 'Vea todos los temas');
      h.tabIndex = -1;
      c.append(h, crear('p', '', 'La lista completa de áreas puede ayudarle a ubicar el asunto. También puede describirlo en una solicitud de consulta, de forma general.'));
      const r = crear('div', 'btn-row');
      const ver = crear('a', 'btn', 'Ver todos los temas');
      ver.href = '/servicios';
      const k = crear('a', 'btn btn-outline', 'Agendar una consulta');
      k.href = '/agendar-consulta';
      r.append(ver, k);
      c.append(r);
      panel.append(c, controles());
    };
    const resultado = o => {
      const area = o.resultado ? datos.areas[o.resultado] : null;
      const guiaFicha = o.ficha ? datos.guias[o.ficha] : null;
      const principal = area || guiaFicha;
      panel.replaceChildren();
      const c = crear('div', 'guia__res');
      const h = crear('h3', '', principal.titulo);
      h.tabIndex = -1;
      if (o.riesgo) c.append(crear('p', 'notice notice--urgent', datos.aviso));
      c.append(crear('p', 'eyebrow', 'Tema para revisar'), h, crear('p', '', principal.resumen));
      const r = crear('div', 'btn-row');
      const leer = crear('a', 'btn', area ? 'Leer esta área' : 'Leer esta guía');
      leer.href = area ? `/servicios/${o.resultado}` : `/orientacion/${o.ficha}`;
      r.append(leer);
      if (area && guiaFicha) {
        const g = crear('a', 'btn btn-outline', guiaFicha.titulo);
        g.href = `/orientacion/${o.ficha}`;
        r.append(g);
      }
      if (o.riesgo) {
        const s = crear('a', 'btn btn-outline', 'Salir rápido');
        s.href = 'https://www.google.com/';
        s.rel = 'noreferrer';
        s.addEventListener('click', e => { e.preventDefault(); irAFuera(s.href); });
        r.append(s);
      }
      c.append(r, crear('p', 'guia__nota', 'Esta guía no analiza su caso ni determina qué procede. Hay excepciones que dependen de hechos que aquí no se preguntan.'));
      panel.append(c, controles());
    };
    preguntar(datos.inicio);
  });

  // Blog: filtro por categoría y búsqueda en esta misma página.
  const filtros = $('[data-filtros]');
  if (filtros) {
    const tarjetas = $$('.post-card[data-cat]', filtros);
    const salidaTxt = $('[data-resultado]', filtros);
    const buscador = $('[data-buscador]', filtros);
    const input = $('input', buscador);
    const botones = $$('[data-cat-btn]', filtros);
    let cat = '';
    buscador.hidden = false;
    const aplicar = () => {
      const q = input.value.trim().toLowerCase();
      let n = 0;
      tarjetas.forEach(t => {
        const ok = (!cat || t.dataset.cat === cat) && (!q || t.dataset.texto.includes(q));
        t.hidden = !ok;
        if (ok) n++;
      });
      salidaTxt.textContent = cat || q ? (n ? `${n} ${n === 1 ? 'artículo' : 'artículos'}` : 'No hay artículos con esa búsqueda. Pruebe con otras palabras.') : '';
      botones.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.catBtn === cat)));
    };
    botones.forEach(b => {
      b.hidden = false;
      b.setAttribute('role', 'button');
      b.addEventListener('click', e => { e.preventDefault(); cat = b.dataset.catBtn; aplicar(); });
      b.addEventListener('keydown', e => { if (e.key === ' ') { e.preventDefault(); b.click(); } });
    });
    input.addEventListener('input', aplicar);
    aplicar();
  }

  // Formularios: mejora progresiva sobre el envío nativo
  $$('form[data-ajax]').forEach(form => {
    // Sin JavaScript valida el navegador; con él, los mensajes propios.
    form.noValidate = true;
    const transcurrido = form.querySelector('input[name="transcurrido"]');
    const inicio = performance.now();
    // Lo escrito no debe reaparecer con el botón Atrás en un equipo compartido.
    addEventListener('pagehide', () => form.reset());
    const status = form.querySelector('.form__status');
    const btn = form.querySelector('button[type="submit"]');
    const show = (kind, msg) => { status.dataset.kind = kind; status.textContent = msg; };
    const aviso = () => { status.tabIndex = -1; status.focus(); };

    // Turnstile (Cloudflare) solo existe en el formulario y se carga al llegar al último paso:
    // no retrasa la página ni se descarga si la persona no llega a enviar.
    const zona = form.querySelector('[data-turnstile]');
    let widget = null;
    let cargando = null;
    const errorVerificacion = 'No fue posible completar la verificación de seguridad. Recargue la página o intente de nuevo más tarde.';
    const cargarTurnstile = () => {
      if (!zona || cargando) return cargando;
      cargando = new Promise((ok, mal) => {
        const s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        s.async = true;
        s.onload = ok;
        s.onerror = mal;
        document.head.appendChild(s);
      }).then(() => {
        widget = window.turnstile.render(zona, {
          sitekey: zona.dataset.sitekey,
          action: zona.dataset.action,
          size: 'flexible',
          language: 'es',
          'refresh-expired': 'auto',
          'error-callback': () => { show('error', errorVerificacion); return true; }
        });
      }).catch(() => { cargando = null; show('error', errorVerificacion); });
      return cargando;
    };
    const tokenTurnstile = () => (form.elements['cf-turnstile-response'] || {}).value || '';
    const reiniciarTurnstile = () => { if (widget !== null && window.turnstile) window.turnstile.reset(widget); };
    if (zona) form.addEventListener('focusin', () => { if (!pasosF.length) cargarTurnstile(); });

    // Paso a paso, si el formulario lo admite.
    const pasosF = $$('[data-paso]', form);
    let actual = 0;
    const irA = (i, enfocar) => {
      actual = i;
      pasosF.forEach((f, k) => f.classList.toggle('is-activo', k === i));
      const final = i === pasosF.length - 1;
      $('[data-atras]', form).hidden = i === 0;
      $('[data-siguiente]', form).hidden = final;
      $('[data-enviar]', form).hidden = !final;
      if (final) cargarTurnstile();
      $('[data-pasos-texto]', form).textContent = `Paso ${i + 1} de ${pasosF.length}`;
      $('.pasos__barra i', form).style.setProperty('--avance', `${((i + 1) / pasosF.length) * 100}%`);
      if (enfocar) (pasosF[i].querySelector('input:not([type=hidden]):not([tabindex="-1"]), textarea') || pasosF[i]).focus();
    };
    const clearErrors = (ambito = form) => {
      $$('[aria-invalid]', ambito).forEach(i => i.removeAttribute('aria-invalid'));
      $$('.field__error', ambito).forEach(e => { e.textContent = ''; });
    };
    const showErrors = errors => {
      let first = null;
      Object.entries(errors || {}).forEach(([k, msg]) => {
        const c = form.elements[k];
        const input = c && c.setAttribute ? c : c && c[0];
        const out = form.querySelector(`[data-error="${k}"]`);
        if (out) out.textContent = msg;
        if (input && input.setAttribute) { input.setAttribute('aria-invalid', 'true'); first = first || input; }
      });
      if (first) {
        const p = first.closest('[data-paso]');
        if (p) irA(pasosF.indexOf(p));
        first.focus();
      }
    };
    const local = (ambito = form) => {
      const errors = {};
      $$('input, select, textarea', ambito).forEach(i => {
        if (i.name && !i.closest('.hp') && !i.checkValidity()) errors[i.name] = i.dataset.msg || 'Revise este campo.';
      });
      return errors;
    };
    if (pasosF.length) {
      form.classList.add('js-pasos');
      irA(0);
      $('[data-siguiente]', form).addEventListener('click', () => {
        clearErrors(pasosF[actual]);
        show('', '');
        const e = local(pasosF[actual]);
        if (Object.keys(e).length) { showErrors(e); return; }
        irA(actual + 1, true);
      });
      $('[data-atras]', form).addEventListener('click', () => { show('', ''); irA(actual - 1, true); });
      pasosF[0].addEventListener('change', e => { if (e.target.type === 'radio') clearErrors(pasosF[0]); });
      form.addEventListener('keydown', e => {
        if (e.key === 'Enter' && actual < pasosF.length - 1 && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') { e.preventDefault(); $('[data-siguiente]', form).click(); }
      });
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      clearErrors();
      show('', '');
      const errors = local();
      if (Object.keys(errors).length) { showErrors(errors); show('error', 'Revise los campos señalados.'); return; }
      if (zona && !tokenTurnstile()) {
        cargarTurnstile();
        show('error', 'Espere a que termine la verificación de seguridad y vuelva a enviar.');
        return;
      }
      btn.setAttribute('aria-busy', 'true');
      btn.disabled = true;
      try {
        if (transcurrido) transcurrido.value = String(Math.round(performance.now() - inicio));
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          form.reset();
          form.classList.add('is-enviado');
          show('ok', data.mensaje);
          aviso();
        } else {
          // El token ya se usó o caducó: hace falta uno nuevo para el siguiente intento.
          reiniciarTurnstile();
          // Un 429 del borde (regla de rate limiting) llega como texto plano, sin JSON.
          const porDefecto = res.status === 429
            ? 'Ha enviado varias solicitudes en poco tiempo. Su solicitud no se ha enviado; espere unos segundos e intente de nuevo.'
            : 'No fue posible procesar su solicitud y no se ha enviado.';
          showErrors(data.errores); show('error', data.mensaje || porDefecto); if (!data.errores) aviso();
        }
      } catch {
        reiniciarTurnstile();
        show('error', 'No hay conexión con el servidor. Su solicitud no se ha enviado; intente de nuevo.');
        aviso();
      } finally {
        btn.removeAttribute('aria-busy');
        btn.disabled = false;
      }
    });
  });
})();
