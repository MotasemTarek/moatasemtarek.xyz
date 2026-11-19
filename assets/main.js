(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // loader
  const bar = $('.loader .bar');
  if (bar) requestAnimationFrame(() => (bar.style.width = '100%'));
  const done = () => setTimeout(() => document.body.classList.add('loaded'), reduce ? 0 : 650);
  document.readyState === 'complete' ? done() : addEventListener('load', done);
  setTimeout(() => document.body.classList.add('loaded'), 3500);

  // year
  $$('[data-year]').forEach(e => (e.textContent = new Date().getFullYear()));

  // nav
  const nav = $('.nav');
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 40);
    nav.classList.toggle('hide', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
    lastY = y;
  }, { passive: true });
  $('.burger')?.addEventListener('click', () => document.body.classList.toggle('menu-open'));
  $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));

  // cursor
  const cur = $('.cursor');
  if (cur && matchMedia('(hover:hover)').matches) {
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener("mousemove", e => { x = e.clientX; y = e.clientY; cur.style.opacity = 1; });
    (function loop() { cx += (x - cx) * .2; cy += (y - cy) * .2; cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
    $$('a,button,figure,.svc,.brand-cell').forEach(el => {
      el.addEventListener('mouseenter', () => cur.classList.add('big'));
      el.addEventListener('mouseleave', () => cur.classList.remove('big'));
    });
  }

  // magnetic buttons
  if (!reduce && matchMedia('(hover:hover)').matches) {
    $$('.btn, .wa').forEach(b => {
      b.addEventListener('mousemove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      b.addEventListener('mouseleave', () => (b.style.transform = ''));
    });
  }

  // reveal
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .14, rootMargin: '0px 0px -40px 0px' });
  $$('.rv,.img-rv').forEach(el => io.observe(el));

  // counters
  const fmt = (v, d) => d ? v.toFixed(d) : Math.round(v).toLocaleString('en-US');
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, to = +el.dataset.to, from = +(el.dataset.from || 0), d = +(el.dataset.dec || 0);
    cio.unobserve(el);
    if (reduce) { el.textContent = fmt(to, d); return; }
    const t0 = performance.now(), dur = 1700;
    (function tick(t) {
      const p = Math.min((t - t0) / dur, 1), k = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(from + (to - from) * k, d);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }), { threshold: .5 });
  $$('[data-to]').forEach(el => cio.observe(el));

  // horizontal scroll section
  const hs = $('.hscroll');
  if (hs) {
    const track = $('.track', hs), prog = $('.progress i', hs);
    const update = () => {
      if (innerWidth <= 860) { track.style.transform = ''; return; }
      const r = hs.getBoundingClientRect();
      const max = track.scrollWidth - innerWidth;
      hs.style.height = `${max + innerHeight}px`;
      const p = Math.min(Math.max(-r.top / (hs.offsetHeight - innerHeight), 0), 1);
      track.style.transform = `translate3d(${-max * p}px,0,0)`;
      if (prog) prog.style.width = `${p * 100}%`;
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    addEventListener('load', update);
    update();
  }

  // parallax on images
  if (!reduce) {
    const px = $$('[data-parallax]');
    if (px.length) addEventListener('scroll', () => px.forEach(el => {
      const r = el.getBoundingClientRect();
      const s = +el.dataset.parallax || .08;
      el.style.transform = `translateY(${(r.top + r.height / 2 - innerHeight / 2) * -s}px) scale(1.12)`;
    }), { passive: true });
  }

  // lightbox
  const figs = $$('.gallery figure');
  if (figs.length) {
    const lb = document.createElement('div');
    lb.className = 'lb';
    lb.innerHTML = '<button class="x" aria-label="Close">✕</button><button class="pv" aria-label="Previous">←</button><img alt=""><button class="nx" aria-label="Next">→</button><div class="cap"></div>';
    document.body.appendChild(lb);
    let i = 0;
    const vis = () => figs.filter(f => f.offsetParent !== null);
    const show = n => {
      const list = vis(); i = (n + list.length) % list.length;
      const im = $('img', list[i]);
      $('img', lb).src = im.src; $('img', lb).alt = im.alt;
      $('.cap', lb).textContent = list[i].dataset.cap || im.alt;
      lb.classList.add('open');
    };
    figs.forEach(f => f.addEventListener('click', () => show(vis().indexOf(f))));
    $('.x', lb).onclick = () => lb.classList.remove('open');
    $('.pv', lb).onclick = e => { e.stopPropagation(); show(i - 1); };
    $('.nx', lb).onclick = e => { e.stopPropagation(); show(i + 1); };
    lb.addEventListener('click', e => { if (e.target === lb) lb.classList.remove('open'); });
    addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') lb.classList.remove('open');
      if (e.key === 'ArrowRight') show(i + 1);
      if (e.key === 'ArrowLeft') show(i - 1);
    });
  }

  // filters (work page)
  $$('.filters').forEach(fl => {
    const items = $$(fl.dataset.target);
    $$('button', fl).forEach(b => b.addEventListener('click', () => {
      $$('button', fl).forEach(x => x.classList.toggle('on', x === b));
      const f = b.dataset.f;
      items.forEach(it => { it.style.display = f === 'all' || it.dataset.cat.includes(f) ? '' : 'none'; });
    }));
  });

  // services sub-nav highlight
  const sn = $$('.svc-nav a');
  if (sn.length) {
    const sio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) sn.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    sn.forEach(a => { const t = $(a.getAttribute('href')); t && sio.observe(t); });
  }

  // logo fallback: show wordmark if logo image fails
  $$('.brand-cell .logo img').forEach(img => img.addEventListener('error', () => {
    const s = document.createElement('span'); s.className = 'wm'; s.textContent = img.alt; img.replaceWith(s);
  }));
})();
