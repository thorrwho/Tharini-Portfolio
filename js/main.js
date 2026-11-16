/* THARINI NAVEEN / page system: theme, smooth scroll, pinned sections, work grid, dialog */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches && !reduce;
  root.classList.add('has-js');

  /* ---------- theme (ChatGPT's circular reveal) ---------- */
  let theme = root.dataset.theme === 'light' ? 'light' : 'dark';
  const toggle = $('#theme-toggle'), themeLabel = $('.theme-label', toggle);
  function commitTheme(next) {
    theme = next;
    root.dataset.theme = next;
    themeLabel.textContent = next.toUpperCase();
    toggle.setAttribute('aria-label', `Switch to ${next === 'dark' ? 'light' : 'dark'} theme`);
    toggle.setAttribute('aria-pressed', String(next === 'light'));
    const meta = $('meta[name=theme-color]');
    if (meta) meta.content = next === 'dark' ? '#120d15' : '#f4ecd6';
    try { localStorage.setItem('tn-theme', next); } catch (e) {}
    window.TNInk && window.TNInk.setTheme(next);
    window.dispatchEvent(new Event('tn:theme'));
  }
  let themeTrans;
  toggle.addEventListener('click', () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const r = toggle.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    if (reduce || typeof document.startViewTransition !== 'function') { commitTheme(next); return; }
    try {
      if (themeTrans && themeTrans.skipTransition) themeTrans.skipTransition();
      const t = document.startViewTransition(() => commitTheme(next));
      themeTrans = t;
      t.ready.then(() => {
        root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
          { duration: 960, easing: 'cubic-bezier(.15,.85,.12,1)', fill: 'both', pseudoElement: '::view-transition-new(root)' });
      }).catch(() => {});
    } catch (e) { commitTheme(next); }
  });
  commitTheme(theme);

  /* ---------- header + reveal ---------- */
  const header = $('#site-header');
  const onScrollHeader = () => header.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();
  const io = 'IntersectionObserver' in window && !reduce
    ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: 0.1, rootMargin: '0px 0px -30px 0px' })
    : null;
  $$('.reveal').forEach(el => { if (io) io.observe(el); else el.classList.add('is-visible'); });

  /* ---------- smooth scroll (wheel is eased; keys, scrollbar and touch stay native) ---------- */
  const smooth = { on: fine && !reduce, cur: scrollY, target: scrollY, ours: false, locked: false };
  const maxScroll = () => document.documentElement.scrollHeight - innerHeight;
  if (smooth.on) {
    addEventListener('wheel', e => {
      if (e.ctrlKey || smooth.locked || e.defaultPrevented) return;
      if (e.target.closest && e.target.closest('[data-native-scroll]')) return;
      e.preventDefault();
      let d = e.deltaY;
      if (e.deltaMode === 1) d *= 32; else if (e.deltaMode === 2) d *= innerHeight;
      smooth.target = clamp(smooth.target + d, 0, maxScroll());
    }, { passive: false });
    addEventListener('scroll', () => {
      if (!smooth.ours) { smooth.cur = smooth.target = scrollY; }
      smooth.ours = false;
    }, { passive: true });
  }
  function scrollToY(y) {
    y = clamp(y, 0, maxScroll());
    if (smooth.on) smooth.target = y;
    else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const t = id === '#top' ? document.body : $(id);
    if (!t) return;
    e.preventDefault();
    const y = id === '#top' ? 0 : (t.closest('.pin') ? t.closest('.pin').offsetTop + innerHeight : t.getBoundingClientRect().top + scrollY);
    scrollToY(y);
    history.replaceState(null, '', id === '#top' ? location.pathname : id);
  }));

  /* ---------- pinned sections: hide what is fully covered, grain ink inside the philosophy stage ---------- */
  const philo = $('.glass-interlude');
  const workSec = $('#work'), aboutSec = $('#about');
  // the ink turns grainy over the uncovered part of the philosophy stage (Buttermax's video section)
  window.TNInk && window.TNInk.setGrainRect && window.TNInk.setGrainRect(() => {
    const top = Math.max(0, workSec.getBoundingClientRect().bottom);
    const bottom = Math.min(innerHeight, aboutSec.getBoundingClientRect().top);
    return bottom > top ? { left: 0, right: innerWidth, top, bottom } : null;
  });
  function updatePins() {
    $$('.pin').forEach(pin => {
      const st = $('.pin-stage', pin);
      const r = pin.getBoundingClientRect();
      const visible = r.bottom > 0 && r.top < innerHeight;
      st.style.visibility = visible ? '' : 'hidden';
      // 0 while still covered by the page above, 1 once fully uncovered
      const p = clamp(-r.top / innerHeight, 0, 1);
      st.style.setProperty('--uncover', p.toFixed(3));
    });
  }
  addEventListener('scroll', updatePins, { passive: true });
  addEventListener('resize', updatePins, { passive: true });
  updatePins();

  /* ---------- work grid ---------- */
  const grid = $('#work-grid');
  const cursorDot = $('#cursor-dot');
  const cells = [];
  window.TN_PROJECTS.forEach((p, i) => {
    const cell = document.createElement('article');
    cell.className = 'work-cell';
    cell.innerHTML = `
      <div class="work-meta"><span>${String(i + 1).padStart(2, '0')} / ${String(window.TN_PROJECTS.length).padStart(2, '0')}</span><span>${p.cat}</span></div>
      <button class="work-stage" type="button" aria-label="Open ${p.title.replace(/ \(.*\)/, '')} project details">
        <span class="work-circle" aria-hidden="true" style="--c1:${p.c1};--c2:${p.c2}"><span class="work-marquee">${(p.title + ' ✳ ' + p.metric + ' ✳ ').repeat(4)}</span></span>
        <span class="work-pop"><span class="work-tilt"></span></span>
      </button>
      <div class="work-foot"><h3>${p.title}<sup>${p.year}</sup></h3><span class="work-badge">${p.badge}</span></div>`;
    grid.appendChild(cell);
    const c = window.TNConsoles.build('mini', p);
    $('.work-tilt', cell).appendChild(c.root);
    const stage = $('.work-stage', cell);
    const tilt = $('.work-tilt', cell);
    const st = { cell, stage, tilt, rx: 0, ry: 0, tx: 0, ty: 0 };
    cells.push(st);
    stage.addEventListener('click', () => openDetail(i, stage));
    stage.addEventListener('pointerenter', () => { cell.classList.add('is-hot'); cursorDot.classList.add('is-work'); });
    stage.addEventListener('pointerleave', () => { cell.classList.remove('is-hot'); cursorDot.classList.remove('is-work'); });
  });
  let px = innerWidth / 2, py = innerHeight / 2;
  if (fine) {
    addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      px = e.clientX; py = e.clientY;
      cursorDot.style.left = px + 'px';
      cursorDot.style.top = py + 'px';
    }, { passive: true });
  } else cursorDot.style.display = 'none';

  /* ---------- project view: the clicked console flies forward (see viewer.js) ---------- */
  window.TNScroll = {
    lock() { smooth.locked = true; document.body.style.overflow = 'hidden'; cursorDot.classList.remove('is-work'); },
    unlock() { smooth.locked = false; document.body.style.overflow = ''; }
  };
  function openDetail(i, trigger) {
    const cell = cells[i];
    window.TNViewer && window.TNViewer.open(i, trigger, cell.tilt, { rx: cell.rx, ry: cell.ry });
  }

  /* ---------- magnetic buttons ---------- */
  if (fine) $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const b = el.getBoundingClientRect();
      el.style.transform = `translate3d(${(e.clientX - b.left - b.width / 2) * 0.09}px,${(e.clientY - b.top - b.height / 2) * 0.12}px,0)`;
    }, { passive: true });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; el.style.transition = 'transform .5s cubic-bezier(.18,1,.28,1)'; });
    el.addEventListener('pointerenter', () => { el.style.transition = 'transform .16s ease-out'; });
  });

  /* ---------- philosophy ribbons + contact hand (ChatGPT interactions) ---------- */
  const ribbons = $$('.glass-ribbons span');
  let raX = 0, raY = 0, rrx = 0, rry = 0, ribbonHot = false;
  philo.addEventListener('pointermove', e => {
    const b = philo.getBoundingClientRect();
    raX = ((e.clientX - b.left) / b.width - 0.5) * 2;
    raY = ((e.clientY - b.top) / b.height - 0.5) * 2;
    ribbonHot = true;
  }, { passive: true });
  philo.addEventListener('pointerleave', () => { ribbonHot = false; raX = 0; raY = 0; });
  const contact = $('#contact'), hand = $('#contact-hand-scene');
  let cax = 0, cay = 0, ccx = 0, ccy = 0;
  contact.addEventListener('pointermove', e => {
    const b = contact.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
    cax = clamp(x * 2 - 1, -1, 1); cay = clamp(y * 2 - 1, -1, 1);
    contact.style.setProperty('--contact-x', x * 100 + '%');
    contact.style.setProperty('--contact-y', y * 100 + '%');
  }, { passive: true });
  contact.addEventListener('pointerleave', () => { cax = 0; cay = 0; });

  /* ---------- frame loop ---------- */
  let prev = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - prev) / 1000));
    prev = now;
    if (smooth.on && !smooth.locked) {
      const before = smooth.cur;
      smooth.cur = damp(smooth.cur, smooth.target, 10.5, dt);
      if (Math.abs(smooth.target - smooth.cur) < 0.4) smooth.cur = smooth.target;
      if (Math.abs(smooth.cur - scrollY) >= 0.5 && Math.abs(before - smooth.cur) > 0.01) { smooth.ours = true; window.scrollTo({ top: smooth.cur, left: 0, behavior: 'instant' }); }
    }
    if (!reduce && !document.hidden) {
      // work consoles turn toward the cursor
      const vh = innerHeight;
      for (const c of cells) {
        const r = c.stage.getBoundingClientRect();
        if (r.bottom < -50 || r.top > vh + 50) continue;
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        c.ty = fine ? clamp((px - cx) * 0.06, -26, 26) : 0;
        c.tx = fine ? clamp(-(py - cy) * 0.06, -24, 24) : 0;
        c.tx += 7; c.ty -= 13;
        c.rx = damp(c.rx, c.tx, 9, dt); c.ry = damp(c.ry, c.ty, 9, dt);
        c.tilt.style.transform = `rotateX(${c.rx.toFixed(2)}deg) rotateY(${c.ry.toFixed(2)}deg)`;
      }
      rrx = damp(rrx, raX, 6, dt); rry = damp(rry, raY, 6, dt);
      if (ribbonHot || Math.abs(rrx) + Math.abs(rry) > 0.005) {
        philo.style.setProperty('--fluid-xx', `${rrx * 7}px`);
        philo.style.setProperty('--fluid-yy', `${rry * 5}px`);
        philo.style.setProperty('--ribbon-cx', rrx.toFixed(3));
        philo.style.setProperty('--ribbon-cy', rry.toFixed(3));
        ribbons.forEach((sp, i) => {
          const x = (i - 4) / 5, force = Math.exp(-Math.pow((rrx - x) * 2.3, 2)) * (0.6 + 0.4 * (1 - Math.abs(rry)));
          sp.style.setProperty('--rx', `${rrx * 42 * force}px`);
          sp.style.setProperty('--ry', `${rry * 93 * force}px`);
          sp.style.setProperty('--stretch', `${0.52 + i * 0.048 + force * 0.46}`);
          sp.style.setProperty('--rr', `${rrx * 15 * force}deg`);
          sp.style.setProperty('--shine', `${1 + force * 0.7}`);
        });
      }
      ccx = damp(ccx, cax, 4.7, dt); ccy = damp(ccy, cay, 4.7, dt);
      hand.style.setProperty('--hand-x', `${ccx * 36}px`);
      hand.style.setProperty('--hand-y', `${ccy * 24}px`);
      hand.style.setProperty('--hand-rotate', `${ccx * 11 - ccy * 5}deg`);
      contact.style.setProperty('--word-px', `${ccx * 8}px`);
      contact.style.setProperty('--word-py', `${ccy * 5}px`);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- clock ---------- */
  const clock = $('#local-time');
  function clockUpdate() {
    try { clock.textContent = `MYSURU · ${new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())} IST`; }
    catch (e) { clock.textContent = 'MYSURU · INDIA'; }
  }
  clockUpdate();
  setInterval(clockUpdate, 60000);
})();
