/* THARINI NAVEEN / project viewer
   Clicking a console in Selected work makes that console fly toward you and grow to about
   half the screen. An iridescent glass mosaic (after Buttermax's device swap) sweeps around
   it as it arrives, then the project boots up on its screen. The console's own buttons
   work: A opens GitHub or the live site, B closes, the D-pad scrolls or picks. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches && !reduce;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const vw = $('#viewer'), fly = $('#vw-fly'), tilt = $('#vw-tilt'), cx = $('#vw-cx');
  const body = $('#vw-body'), mosaic = $('#vw-mosaic'), mctx = mosaic.getContext('2d');
  const btnA = $('#vw-open'), labelA = $('#vw-open-label'), btnB = $('#vw-close');
  const hint = $('#vw-hint');
  window.TNConsoles.addDepth(cx, 56);

  let state = null; // { i, project, source, cell, sel }
  let busy = false, pendingClose = false;

  /* ---------- content ---------- */
  function render(i) {
    const p = window.TN_PROJECTS[i], n = window.TN_PROJECTS.length;
    cx.style.setProperty('--c1', p.c1);
    cx.style.setProperty('--c2', p.c2);
    $('#vw-code').textContent = `TN // PROJECT ${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
    $('#vw-cat').textContent = p.cat;
    $('#vw-metric').textContent = p.metric;
    let html = `
      <div class="vw-line vw-kicker">${esc(p.year)} // ${esc(p.badge)} · RIG</div>
      <h3 class="vw-line vw-title" id="vw-title">${esc(p.title)}</h3>
      <p class="vw-line vw-desc">${esc(p.desc)}</p>`;
    if (p.sites) {
      html += `<ul class="vw-line vw-sites" role="list">${p.sites.map((s, k) => `
        <li class="vw-site${k === 0 ? ' is-sel' : ''}" data-k="${k}">
          <span class="vw-site-num">0${k + 1}</span>
          <span class="vw-site-text"><b>${esc(s.name)}</b><small>${esc(s.desc)}</small></span>
          <span class="vw-site-links">
            <a href="${esc(s.live)}" target="_blank" rel="noopener noreferrer">LIVE ↗</a>
            <a href="${esc(window.TN_GITHUB + '/' + s.repo)}" target="_blank" rel="noopener noreferrer">CODE ↗</a>
          </span>
        </li>`).join('')}</ul>`;
    }
    html += `<div class="vw-line vw-chips">${p.stack.map(t => `<span>${esc(t)}</span>`).join('')}</div>`;
    if (p.note) html += `<div class="vw-line vw-note">${esc(p.note)}</div>`;
    body.innerHTML = html;
    body.scrollTop = 0;
    $$('.vw-line', body).forEach((el, k) => el.style.setProperty('--d', (k * 70) + 'ms'));
    $$('.vw-site', body).forEach(li => li.addEventListener('pointerenter', () => select(+li.dataset.k)));
    state.sel = 0;
    updateA();
  }
  function $$(s, r) { return Array.from(r.querySelectorAll(s)); }
  function updateA() {
    const p = state.project;
    btnA.classList.remove('is-off');
    btnA.removeAttribute('aria-disabled');
    if (p.sites) {
      const s = p.sites[state.sel];
      btnA.href = s.live; labelA.textContent = 'A · VISIT';
      btnA.setAttribute('aria-label', `Visit ${s.name}`);
      hint.innerHTML = '<span>▲▼ PICK A SITE</span><span>A VISIT · B CLOSE</span>';
    } else if (p.repo) {
      btnA.href = `${window.TN_GITHUB}/${p.repo}`; labelA.textContent = 'A · GITHUB';
      btnA.setAttribute('aria-label', `View ${p.title} on GitHub`);
      hint.innerHTML = '<span>▲▼ SCROLL</span><span>A GITHUB · B CLOSE</span>';
    } else if (p.note) {
      btnA.removeAttribute('href'); btnA.classList.add('is-off'); btnA.setAttribute('aria-disabled', 'true');
      labelA.textContent = 'A · PRIVATE';
      btnA.setAttribute('aria-label', 'Source is private');
      hint.innerHTML = '<span>▲▼ SCROLL</span><span>B CLOSE</span>';
    } else {
      btnA.href = `${window.TN_GITHUB}?tab=repositories`; labelA.textContent = 'A · GITHUB';
      btnA.setAttribute('aria-label', 'More projects on GitHub');
      hint.innerHTML = '<span>▲▼ SCROLL</span><span>A GITHUB · B CLOSE</span>';
    }
  }
  function select(k) {
    const p = state && state.project;
    if (!p || !p.sites) return;
    state.sel = (k + p.sites.length) % p.sites.length;
    $$('.vw-site', body).forEach((li, j) => li.classList.toggle('is-sel', j === state.sel));
    const li = $$('.vw-site', body)[state.sel];
    li && li.scrollIntoView({ block: 'nearest' });
    updateA();
  }
  function dpad(dir) {
    if (!state) return;
    press($(`.vw-dpad [data-dir="${dir}"]`));
    if (state.project.sites) select(state.sel + (dir === 'up' || dir === 'left' ? -1 : 1));
    else body.scrollBy({ top: (dir === 'up' || dir === 'left' ? -1 : 1) * body.clientHeight * 0.6, behavior: reduce ? 'auto' : 'smooth' });
  }
  function press(el) {
    if (!el) return;
    el.classList.remove('is-pressed'); void el.offsetWidth; el.classList.add('is-pressed');
  }
  document.querySelectorAll('.vw-dpad [data-dir]').forEach(b => b.addEventListener('click', () => dpad(b.dataset.dir)));
  btnA.addEventListener('click', e => { press(btnA); if (btnA.classList.contains('is-off')) e.preventDefault(); });
  btnB.addEventListener('click', () => { press(btnB); close(); });
  $('[data-vw-close]', vw).addEventListener('click', () => close());
  document.addEventListener('keydown', e => {
    if (!state || vw.hidden) return;
    if (e.key === 'Escape' || e.key === 'Backspace' && e.target === document.body) { e.preventDefault(); close(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); dpad(e.key === 'ArrowUp' ? 'up' : 'down'); }
    else if (e.key === 'Tab') {
      const f = Array.from(vw.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')).filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- glass mosaic ---------- */
  let cells = [], mW = 0, mH = 0, mPad = 0, mDpr = 1, mRect = null;
  function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  function prepMosaic() {
    mDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = cx.offsetWidth, h = cx.offsetHeight;
    mPad = Math.round(w * 0.06);
    mW = w + mPad * 2; mH = h + mPad * 2;
    mosaic.style.left = mosaic.style.top = -mPad + 'px';
    mosaic.style.width = mW + 'px'; mosaic.style.height = mH + 'px';
    mosaic.width = Math.round(mW * mDpr); mosaic.height = Math.round(mH * mDpr);
    const cs = Math.max(8, Math.round(w / 64));
    const r = w * 0.1, cxm = mW / 2, cym = mH / 2;
    cells = [];
    for (let y = 0; y < mH; y += cs) for (let x = 0; x < mW; x += cs) {
      // signed distance to the console's rounded rectangle
      const qx = Math.abs(x + cs / 2 - cxm) - (w / 2 - r), qy = Math.abs(y + cs / 2 - cym) - (h / 2 - r);
      const sd = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
      const inside = sd < 0;
      if (!inside && sd > mPad * 0.9) continue;
      const u = (x + cs / 2 - cxm) / (w / 2), v = (y + cs / 2 - cym) / (h / 2);
      const ang = ((Math.atan2(u, -v) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2); // 0 at top, clockwise
      const rad = Math.min(1, Math.hypot(u, v) / 1.42);
      const hsh = hash(x, y);
      cells.push({ x, y, s: cs, u, v, inside, sd, hsh, col: (x / cs) | 0, key: 0.62 * ang + 0.24 * (1 - rad) + 0.14 * hsh });
    }
  }
  // p: 0 = fully covered in glass, 1 = fully revealed
  function drawMosaic(p, time) {
    const c = mctx;
    c.setTransform(mDpr, 0, 0, mDpr, 0, 0);
    c.clearRect(0, 0, mW, mH);
    if (p >= 1) return;
    const front = p * 1.32 - 0.16, band = 0.16;
    for (let i = 0; i < cells.length; i++) {
      const e = cells[i];
      const d = (e.key - front) / band;
      let a = 0, light = 0;
      if (e.inside) {
        if (d > 1) a = 0.86;
        else if (d > 0) { a = 0.95; light = 1 - Math.abs(d * 2 - 1); }
        else continue;
      } else {
        if (d <= 0 || d > 1 || e.hsh < 0.45) continue;
        a = (1 - Math.abs(d * 2 - 1)) * (1 - e.sd / mPad) * 0.9;
        light = 0.6;
      }
      const hue = (205 + 150 * Math.sin(e.u * 2.6 + e.v * 1.9 + time * 4.2 + e.key * 5)) % 360;
      const l = 52 + e.hsh * 20 + light * 30 + (e.col % 4 === 0 ? 8 : 0);
      c.fillStyle = `hsla(${hue.toFixed(0)},96%,${Math.min(96, l).toFixed(0)}%,${a.toFixed(3)})`;
      const g = light > 0.5 ? 0 : 1;
      c.fillRect(e.x + g, e.y + g, e.s - g, e.s - g);
      if (light > 0.35) { c.fillStyle = `rgba(255,255,255,${(light * 0.7).toFixed(3)})`; c.fillRect(e.x + 1, e.y + 1, e.s * 0.5, e.s * 0.28); }
    }
  }
  function runMosaic(from, to, delay, dur) {
    return new Promise(res => {
      const t0 = performance.now() + delay;
      (function tick(now) {
        const k = clamp((now - t0) / dur, 0, 1);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        drawMosaic(from + (to - from) * e, now / 1000);
        if (k < 1) requestAnimationFrame(tick); else res();
      })(performance.now());
    });
  }

  /* ---------- tilt while open ---------- */
  let tx = 0, ty = 0, rx = 0, ry = 0, loopOn = false;
  addEventListener('pointermove', e => {
    if (!state || !fine) return;
    tx = clamp(-(e.clientY / innerHeight - 0.5) * 12, -7, 7);
    ty = clamp((e.clientX / innerWidth - 0.5) * 16, -9, 9);
  }, { passive: true });
  const face = cx.querySelector('.cx-face');
  const DEPTH = 56, STEPS = 18, BASE_SHADOW = 'inset 0 2px 0 rgba(255,220,240,.18), inset 0 -12px 26px rgba(0,0,0,.38)';
  let settled = false, lastExt = '';
  function extrusion() {
    // the console's side wall as stacked shadows, offset the way the tilt would reveal it
    const dx = -DEPTH * Math.sin(ry * Math.PI / 180), dy = DEPTH * Math.sin(rx * Math.PI / 180);
    const key = dx.toFixed(1) + ',' + dy.toFixed(1);
    if (key === lastExt) return;
    lastExt = key;
    const parts = [BASE_SHADOW];
    for (let i = 1; i <= STEPS; i++) {
      const t = i / STEPS, k = Math.round(Math.pow(t, 1.4) * 100);
      const col = i === STEPS ? 'var(--cx-edge-line)' : `color-mix(in srgb, var(--cx-edge-back) ${k}%, var(--cx-edge-front))`;
      parts.push(`${(dx * t).toFixed(2)}px ${(dy * t).toFixed(2)}px 0 ${i === STEPS ? '1px' : '0'} ${col}`);
    }
    parts.push(`${(dx + 4).toFixed(1)}px ${(dy + 26).toFixed(1)}px 44px rgba(20,3,20,.32)`);
    face.style.boxShadow = parts.join(', ');
  }
  function settle(on) {
    settled = on;
    vw.classList.toggle('is-settled', on);
    lastExt = '';
    if (on) extrusion(); else face.style.boxShadow = '';
    applyTilt();
  }
  function applyTilt() {
    tilt.style.transform = settled
      ? `perspective(1700px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`
      : `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
  }
  function loop() {
    if (!loopOn) return;
    rx += (tx + 7 - rx) * 0.08; ry += (ty - 13 - ry) * 0.08;
    applyTilt();
    if (settled) extrusion();
    requestAnimationFrame(loop);
  }

  /* ---------- open / close ---------- */
  function fromTransform(src, fin, tiltIn) {
    const s = src.width / fin.width;
    const dx = (src.left + src.width / 2) - (fin.left + fin.width / 2);
    const dy = (src.top + src.height / 2) - (fin.top + fin.height / 2);
    return `translate3d(${dx.toFixed(1)}px,${dy.toFixed(1)}px,0) scale(${s.toFixed(4)}) rotateX(${(tiltIn.rx - 7).toFixed(1)}deg) rotateY(${(tiltIn.ry + 13).toFixed(1)}deg)`;
  }
  function open(i, trigger, tiltWrap, tiltIn) {
    if (busy || state) return;
    const project = window.TN_PROJECTS[i];
    const source = tiltWrap.firstElementChild;
    const cell = tiltWrap.closest('.work-cell');
    state = { i, project, source, cell, trigger, tiltIn: tiltIn || { rx: 0, ry: 0 }, sel: 0 };
    render(i);
    window.TNScroll && window.TNScroll.lock();
    vw.hidden = false;
    vw.classList.remove('is-booted', 'is-closing');
    rx = 7; ry = -13; tx = ty = 0;
    tilt.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    loopOn = true; requestAnimationFrame(loop);
    btnB.focus({ preventScroll: true });
    if (reduce) {
      vw.classList.add('is-in', 'is-booted');
      settle(true);
      drawMosaic(1, 0);
      return;
    }
    busy = true;
    prepMosaic();
    drawMosaic(0, performance.now() / 1000);
    const src = source.getBoundingClientRect();
    const fin = fly.getBoundingClientRect();
    cell.classList.add('is-open');
    requestAnimationFrame(() => vw.classList.add('is-in'));
    const start = fromTransform(src, fin, state.tiltIn);
    const a = fly.animate([
      { transform: start, offset: 0 },
      { transform: 'translate3d(0,-2%,90px) scale(1.06) rotateX(-7deg) rotateY(12deg)', offset: 0.58 },
      { transform: 'translate3d(0,0,0) scale(.985) rotateX(2deg) rotateY(-3deg)', offset: 0.82 },
      { transform: 'none', offset: 1 }
    ], { duration: 1150, easing: 'cubic-bezier(.22,.9,.24,1)' });
    setTimeout(() => vw.classList.add('is-booted'), 820);
    let landed = false;
    const land = () => {
      if (landed) return;
      landed = true;
      a.cancel(); fly.style.transform = '';
      drawMosaic(1, 0);
      settle(true);
      busy = false;
      if (pendingClose) { pendingClose = false; close(); }
    };
    // land when both the flight and the mosaic are done, with a fallback so it can never get stuck
    Promise.all([a.finished.catch(() => {}), runMosaic(0, 1, 260, 1050)]).then(land);
    setTimeout(land, 1900);
  }
  function close() {
    if (!state) return;
    if (busy) { if (!vw.classList.contains('is-closing')) pendingClose = true; return; }
    const st = state;
    vw.classList.remove('is-booted');
    settle(false);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      vw.hidden = true;
      vw.classList.remove('is-in', 'is-closing');
      st.cell.classList.remove('is-open');
      fly.style.opacity = '';
      loopOn = false;
      state = null; busy = false;
      window.TNScroll && window.TNScroll.unlock();
      st.trigger && st.trigger.focus({ preventScroll: true });
    };
    if (reduce) { finish(); return; }
    busy = true;
    vw.classList.add('is-closing');
    prepMosaic();
    const fin = fly.getBoundingClientRect();
    // measure where the mini console sits right now (it is hidden, but still laid out)
    const src = st.source.getBoundingClientRect();
    runMosaic(1, 0.08, 0, 420);
    const end = fromTransform(src, fin, st.tiltIn);
    const a = fly.animate([
      { transform: 'none', opacity: 1 },
      { transform: 'translate3d(0,-1%,60px) scale(1.04) rotateX(-4deg) rotateY(8deg)', opacity: 1, offset: 0.3 },
      { transform: end, opacity: 1, offset: 0.92 },
      { transform: end, opacity: 0 }
    ], { duration: 820, easing: 'cubic-bezier(.6,.05,.3,1)', fill: 'forwards' });
    setTimeout(() => st.cell.classList.remove('is-open'), 700);
    a.finished.catch(() => {}).then(() => { a.cancel(); finish(); });
    setTimeout(() => { a.cancel(); finish(); }, 1500);
  }
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (state && !busy) { prepMosaic(); drawMosaic(1, 0); } }, 150); }, { passive: true });
  window.TNViewer = { open, close, _debug: () => ({ busy, open: !!state, settled }), _preview(p) { prepMosaic(); drawMosaic(p, 1.3); } };
})();
