// Interacciones del sitio. El contenido sigue disponible si este archivo no carga.
(() => {
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // Menú móvil a pantalla completa
  const burger = document.querySelector('.burger');
  const menu = document.getElementById('menu-movil');
  if (burger && menu) {
    const toggle = open => {
      burger.setAttribute('aria-expanded', String(open));
      burger.querySelector('.visually-hidden').textContent = open ? 'Cerrar menú' : 'Abrir menú';
      menu.dataset.open = String(open);
      menu.inert = !open;
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

  // Submenú de servicios
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

  // Carruseles
  $$('[data-carousel]').forEach(root => {
    const track = root.querySelector('.carousel__track');
    const prev = root.querySelector('[data-prev]');
    const next = root.querySelector('[data-next]');
    if (!track || !prev || !next) return;
    const step = () => {
      const s = track.querySelector('.carousel__slide');
      return s ? s.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : track.clientWidth;
    };
    const sync = () => {
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -step() }));
    next.addEventListener('click', () => track.scrollBy({ left: step() }));
    track.addEventListener('scroll', sync, { passive: true });
    addEventListener('resize', sync);
    sync();
  });

  // Formularios: mejora progresiva sobre el envío nativo
  $$('form[data-ajax]').forEach(form => {
    const started = form.querySelector('input[name="iniciado"]');
    if (started) started.value = String(Date.now());
    const status = form.querySelector('.form__status');
    const btn = form.querySelector('button[type="submit"]');
    const show = (kind, msg) => { status.dataset.kind = kind; status.textContent = msg; };
    const clearErrors = () => {
      $$('[aria-invalid]', form).forEach(i => i.removeAttribute('aria-invalid'));
      $$('.field__error', form).forEach(e => { e.textContent = ''; });
    };
    const showErrors = errors => {
      let first = null;
      Object.entries(errors || {}).forEach(([k, msg]) => {
        const input = form.elements[k];
        const out = form.querySelector(`[data-error="${k}"]`);
        if (out) out.textContent = msg;
        if (input && input.setAttribute) { input.setAttribute('aria-invalid', 'true'); first = first || input; }
      });
      if (first) first.focus();
    };
    const local = () => {
      const errors = {};
      $$('input, select, textarea', form).forEach(i => {
        if (i.name && !i.closest('.hp') && !i.checkValidity()) errors[i.name] = i.dataset.msg || 'Revise este campo.';
      });
      return errors;
    };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      clearErrors();
      show('', '');
      const errors = local();
      if (Object.keys(errors).length) { showErrors(errors); show('error', 'Revise los campos señalados.'); return; }
      btn.setAttribute('aria-busy', 'true');
      btn.disabled = true;
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) { form.reset(); if (started) started.value = String(Date.now()); show('ok', data.mensaje); }
        else { showErrors(data.errores); show('error', data.mensaje || 'No fue posible procesar su solicitud y no se ha enviado.'); }
      } catch {
        show('error', 'No hay conexión con el servidor. Su solicitud no se ha enviado; intente de nuevo.');
      } finally {
        btn.removeAttribute('aria-busy');
        btn.disabled = false;
      }
    });
  });
})();
