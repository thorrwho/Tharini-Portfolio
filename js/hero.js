/* THARINI NAVEEN / intro + hero
   1. Intro: loader mark -> halftone dot burst -> gooey dots flood into the page.
   2. Title: "Tharini" rises letter by letter, then "naveen" is handwritten with a brush.
      It is drawn in WebGL so the cursor can leave a liquid smear that relaxes back.
   3. Rigs: three consoles; click to swap, they turn toward the cursor. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const easeOut = x => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  const easeInOut = x => (x = clamp(x, 0, 1), x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const cssVar = n => getComputedStyle(root).getPropertyValue(n).trim();
  const hexRGB = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const THEMES = {
    light: { bg: '#f4ecd6', ink: '#310a31' },
    dark: { bg: '#120d15', ink: '#f4ecd6' }
  };
  const theme = () => (root.dataset.theme === 'light' ? 'light' : 'dark');

  /* ================= handwritten "naveen" ================= */
  const NAVEEN_D = [
    'M 0 192 C 8 160 14 126 22 104', 'C 21 140 20 172 20 200',
    'C 28 146 46 102 66 104 C 86 106 84 150 80 200', 'C 82 212 98 212 110 190',
    'C 120 162 136 118 152 112',
    'C 138 98 112 108 104 140 C 98 176 112 204 132 198 C 146 192 152 150 156 106',
    'C 152 150 150 188 160 200 C 170 210 184 200 194 180', 'C 200 150 202 120 206 104',
    'C 212 140 220 180 228 200', 'C 238 170 250 130 258 106',
    'C 260 96 252 94 249 104 C 246 114 258 122 282 122',
    'C 302 124 328 120 326 104 C 324 90 302 92 294 112 C 286 134 288 180 302 196 C 316 210 340 200 354 178',
    'C 368 160 396 124 394 104 C 392 90 370 92 362 112 C 354 134 356 180 370 196 C 384 210 408 200 422 178',
    'C 428 150 432 122 438 104', 'C 436 140 434 176 433 200',
    'C 442 146 460 104 480 105 C 500 106 496 160 492 196',
    'C 494 214 516 212 536 186 C 566 150 600 112 650 80'
  ].join(' ');
  const SKEW = 0.24, BASE = 200, XH = 96;
  let STROKE = null; // sampled points [x,y] in raw units after skew
  function sampleStroke() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', NAVEEN_D);
    svg.appendChild(path);
    document.body.appendChild(svg);
    const L = path.getTotalLength(), N = 1500, pts = [];
    for (let i = 0; i <= N; i++) { const p = path.getPointAtLength(L * i / N); pts.push([p.x + (BASE - p.y) * SKEW, p.y]); }
    svg.remove();
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (const [x, y] of pts) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    STROKE = { pts, minX, maxX, minY, maxY };
  }

  /* ================= title (2D source + WebGL smear) ================= */
  const titleBox = $('#hero-title');
  const glCanvas = $('#title-gl');
  const src = document.createElement('canvas');
  const sctx = src.getContext('2d');
  const FONT = '"Archivo", "Arial Black", Arial, sans-serif';
  let layout = null, dpr = 1;
  const anim = { t0: -1, done: false };

  function computeLayout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = titleBox.clientWidth;
    const stack = W < 700;
    const word = 'Tharini';
    const measure = F => { sctx.font = `900 ${F}px ${FONT}`; return sctx.measureText(word).width - 0.03 * F * (word.length - 1); };
    const capRatio = (() => { sctx.font = `900 100px ${FONT}`; const m = sctx.measureText('H'); return (m.actualBoundingBoxAscent || 72) / 100; })();
    const scriptRawW = STROKE.maxX - STROKE.minX;
    let F, s, sx, sBase, tharW, pad, H, baseY;
    if (!stack) {
      const t100 = measure(100) / 100;
      const sPerF = 0.6 * capRatio / XH;
      F = Math.min(W * 0.975 / (t100 + scriptRawW * sPerF + 0.005), 260);
      s = sPerF * F;
      tharW = measure(F);
      pad = 0.14 * F;
      const gap = 0.005 * F, total = tharW + gap + scriptRawW * s;
      const tx = (W - total) / 2;
      const topT = 1.02 * capRatio * F + 0.06 * F, topS = (BASE - STROKE.minY) * s;
      const ascent = Math.max(topT, topS);
      const descent = Math.max(0.05 * F, (STROKE.maxY - BASE) * s);
      baseY = pad + ascent;
      sBase = baseY - 0.01 * F;
      H = baseY + descent + pad;
      layout = { F, s, tx, sx: tx + tharW + gap - STROKE.minX * s, baseY, sBase, W, H, pad, stack };
    } else {
      F = Math.min(W * 0.95 / (measure(100) / 100), 150);
      tharW = measure(F);
      s = Math.min((W * 0.86) / scriptRawW, 0.62 * capRatio * F / XH * 1.15);
      pad = 0.12 * F;
      baseY = pad + 1.06 * capRatio * F;
      sBase = baseY + (BASE - STROKE.minY) * s + 0.02 * F;
      H = sBase + (STROKE.maxY - BASE) * s + pad;
      layout = { F, s, tx: (W - tharW) / 2, sx: W - scriptRawW * s - W * 0.04 - STROKE.minX * s, baseY, sBase, W, H, pad, stack };
    }
    titleBox.style.height = Math.round(layout.H) + 'px';
    src.width = Math.round(layout.W * dpr);
    src.height = Math.round(layout.H * dpr);
    glCanvas.width = src.width; glCanvas.height = src.height;
    // position hints for CSS (sub-bar etc.)
    root.style.setProperty('--title-h', Math.round(layout.H) + 'px');
    root.style.setProperty('--title-base', Math.round(layout.baseY) + 'px');
    root.style.setProperty('--title-left', Math.round(layout.tx) + 'px');
    root.style.setProperty('--title-right', Math.round(layout.W - (layout.sx + STROKE.maxX * layout.s)) + 'px');
  }

  function drawSource(now) {
    const L = layout, F = L.F;
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.clearRect(0, 0, L.W, L.H);
    const fillCol = fallback ? THEMES[theme()].ink : '#fff';
    sctx.fillStyle = fillCol;
    sctx.strokeStyle = fillCol;
    const t = anim.t0 < 0 ? (anim.done ? 99 : -1) : (now - anim.t0) / 1000;
    // Tharini: letters rise from under the baseline, clipped to the line
    sctx.save();
    sctx.beginPath();
    sctx.rect(0, 0, L.W, L.baseY + 0.06 * F);
    sctx.clip();
    sctx.font = `900 ${F}px ${FONT}`;
    sctx.textBaseline = 'alphabetic';
    const word = 'Tharini';
    for (let i = 0; i < word.length; i++) {
      const x = L.tx + sctx.measureText(word.slice(0, i)).width - 0.03 * F * i;
      const p = easeOut((t - i * 0.05) / 0.75);
      if (p <= 0) continue;
      const dy = (1 - p) * F * 1.05;
      sctx.save();
      sctx.translate(x, L.baseY + dy);
      sctx.rotate((1 - p) * 0.18);
      sctx.fillText(word[i], 0, 0);
      sctx.restore();
    }
    sctx.restore();
    // naveen: brush stroke drawn up to progress
    const sp = t > 50 ? 1 : easeInOut((t - 0.45) / 1.15);
    if (sp > 0) {
      const pts = STROKE.pts, n = Math.floor(pts.length * sp), s = L.s;
      const w0 = 15.5 * s;
      sctx.lineCap = 'round';
      sctx.lineJoin = 'round';
      for (let i = 1; i < n; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        const a = Math.atan2(y1 - y0, x1 - x0);
        const u = i / pts.length;
        const taper = Math.min(1, u * 16) * Math.min(1, (1 - u) * 4 + 0.22);
        sctx.lineWidth = Math.max(0.6, w0 * (0.6 + 0.4 * Math.abs(Math.sin(a - 0.75))) * taper);
        sctx.beginPath();
        sctx.moveTo(L.sx + x0 * s, L.sBase + (y0 - BASE) * s);
        sctx.lineTo(L.sx + x1 * s, L.sBase + (y1 - BASE) * s);
        sctx.stroke();
      }
    }
    return t > 2.2;
  }

  /* WebGL smear */
  const MAXS = 28;
  let gl = null, prog = null, tex = null, U = {};
  function initGL() {
    try {
      gl = glCanvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    } catch (e) { gl = null; }
    if (!gl) return false;
    const vs = `attribute vec2 a; varying vec2 v; void main(){ v=a*.5+.5; v.y=1.-v.y; gl_Position=vec4(a,0.,1.); }`;
    const fs = `precision highp float; varying vec2 v; uniform sampler2D T; uniform vec2 R; uniform vec3 C;
uniform vec4 P[${MAXS}]; uniform float A[${MAXS}]; uniform float S;
void main(){
  vec2 px=v*R; vec2 d=vec2(0.);
  for(int i=0;i<${MAXS};i++){
    vec2 q=px-P[i].xy; float w=exp(-dot(q,q)/(S*S))*A[i];
    vec2 vel=P[i].zw;
    float sw=sin(length(q)/S*3.0-A[i]*6.0)*0.35;
    d+=w*(vel+vec2(-vel.y,vel.x)*sw);
  }
  float m=length(d); if(m>S*1.1){ d*=S*1.1/m; }
  float a=texture2D(T,(px-d)/R).a;
  gl_FragColor=vec4(C*a,a);
}`;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    } catch (e) { console.warn('title GL fallback', e); gl = null; return false; }
    gl.useProgram(prog);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    ['T', 'R', 'C', 'P', 'A', 'S'].forEach(n => { U[n] = gl.getUniformLocation(prog, n); });
    U.P = gl.getUniformLocation(prog, 'P[0]') || U.P;
    U.A = gl.getUniformLocation(prog, 'A[0]') || U.A;
    return true;
  }
  function upload() {
    if (!gl) return;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  }

  // smear samples, in title-canvas device pixels
  const samples = [];
  let lastPX = null;
  function onPointer(e) {
    if (e.pointerType === 'touch' || !layout) return;
    const r = glCanvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const inside = x > -80 && y > -80 && x < r.width + 80 && y < r.height + 80;
    if (lastPX && inside) {
      const vx = (x - lastPX[0]), vy = (y - lastPX[1]);
      const sp = Math.hypot(vx, vy);
      if (sp > 0.5) {
        const k = Math.min(1, 16 / sp);
        samples.push({ x: x * dpr, y: y * dpr, vx: vx * k * 0.75 * dpr, vy: vy * k * 0.75 * dpr, age: 0 });
        if (samples.length > MAXS) samples.shift();
      }
    }
    lastPX = [x, y];
  }
  if (fine && !reduce) addEventListener('pointermove', onPointer, { passive: true });

  const Pbuf = new Float32Array(MAXS * 4), Abuf = new Float32Array(MAXS);
  let inkRGB = [1, 1, 1];
  function setInk() { const c = hexRGB(THEMES[theme()].ink); inkRGB = c.map(v => v / 255); }
  function renderGL(dt) {
    if (!gl) return;
    for (const s of samples) s.age += dt;
    while (samples.length && samples[0].age > 1.4) samples.shift();
    Pbuf.fill(0); Abuf.fill(0);
    samples.forEach((s, i) => {
      Pbuf[i * 4] = s.x; Pbuf[i * 4 + 1] = s.y; Pbuf[i * 4 + 2] = s.vx; Pbuf[i * 4 + 3] = s.vy;
      // swell quickly, then relax back slowly so the letters settle
      Abuf[i] = Math.min(1, s.age * 14) * Math.exp(-s.age * 2.6);
    });
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1i(U.T, 0);
    gl.uniform2f(U.R, glCanvas.width, glCanvas.height);
    gl.uniform3f(U.C, inkRGB[0], inkRGB[1], inkRGB[2]);
    gl.uniform4fv(U.P, Pbuf);
    gl.uniform1fv(U.A, Abuf);
    gl.uniform1f(U.S, layout.F * 0.21 * dpr);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /* ================= hero rigs ================= */
  const stage = $('#rig-stage');
  const tiltEl = $('#rig-tilt');
  const RIGS = [
    { kind: 'pocket', name: 'POCKET', projects: ['medipredict', 'rag', 'safelink'] },
    { kind: 'controller', name: 'CONTROLLER', projects: ['fairmesh', 'sahaaya', 'lostfound'] },
    { kind: 'tablet', name: 'TABLET', projects: ['devalaya', 'peppersense', 'vibe'] }
  ];
  const byId = id => window.TN_PROJECTS.find(p => p.id === id);
  let current = 0, switching = false;
  RIGS.forEach((rig, i) => {
    const p = byId(rig.projects[0]);
    const c = window.TNConsoles.build(rig.kind, p, { hud: true });
    const wrap = document.createElement('div');
    wrap.className = 'rig' + (i === 0 ? ' is-current' : '');
    const spin = document.createElement('div');
    spin.className = 'rig-spin';
    spin.appendChild(c.root);
    wrap.appendChild(spin);
    tiltEl.appendChild(wrap);
    rig.el = wrap; rig.spin = spin; rig.c = c; rig.slide = 0;
    rig.hud = { rig: $('.cx-rig', c.root), metric: $('.cx-metric', c.root), title: $('.cx-title', c.root) };
    setSlide(rig, 0);
  });
  function setSlide(rig, k) {
    rig.slide = k;
    const p = byId(rig.projects[k]);
    rig.c.screen.setProject(p.id);
    rig.c.root.style.setProperty('--c1', p.c1);
    rig.c.root.style.setProperty('--c2', p.c2);
    const i = RIGS.indexOf(rig);
    rig.hud.rig.textContent = `RIG 0${i + 1} // ${rig.name}`;
    rig.hud.metric.textContent = p.metric;
    rig.hud.title.textContent = p.title.replace(/ \(.*\)/, '').toUpperCase();
  }
  if (!reduce) setInterval(() => {
    if (document.hidden || switching) return;
    const rig = RIGS[current];
    setSlide(rig, (rig.slide + 1) % rig.projects.length);
  }, 4200);

  const capNum = $('#rig-caption-num'), capName = $('#rig-caption-name');
  function updateCaption() {
    if (capNum) capNum.textContent = `0${current + 1} / 03`;
    if (capName) capName.textContent = RIGS[current].name;
    stage.setAttribute('aria-label', `Console ${current + 1} of 3, ${RIGS[current].name.toLowerCase()}. Activate to switch console.`);
  }
  updateCaption();
  function swap() {
    if (switching) return;
    switching = true;
    const from = RIGS[current];
    current = (current + 1) % RIGS.length;
    const to = RIGS[current];
    updateCaption();
    if (reduce || !from.spin.animate) {
      from.el.classList.remove('is-current'); to.el.classList.add('is-current'); switching = false; return;
    }
    from.el.classList.add('is-leaving');
    from.spin.animate([
      { transform: 'translate3d(0,0,0) rotateY(0deg) rotateX(0deg) scale(1)', opacity: 1 },
      { transform: 'translate3d(-8%,-14%,-260px) rotateY(-150deg) rotateX(18deg) scale(.55)', opacity: 0 }
    ], { duration: 520, easing: 'cubic-bezier(.55,0,.75,.3)', fill: 'forwards' });
    setTimeout(() => {
      from.el.classList.remove('is-current');
      to.el.classList.add('is-current');
      const a = to.spin.animate([
        { transform: 'translate3d(10%,-30%,-320px) rotateY(160deg) rotateX(-24deg) scale(.5)', opacity: 0 },
        { transform: 'translate3d(0,0,0) rotateY(0deg) rotateX(0deg) scale(1)', opacity: 1, offset: 0.62 },
        { transform: 'translate3d(0,0,0) rotateY(-8deg) rotateX(3deg) scale(1.03)', opacity: 1, offset: 0.8 },
        { transform: 'translate3d(0,0,0) rotateY(0deg) rotateX(0deg) scale(1)', opacity: 1 }
      ], { duration: 980, easing: 'cubic-bezier(.2,.75,.25,1)' });
      a.onfinish = () => { from.el.classList.remove('is-leaving'); from.spin.getAnimations().forEach(x => x.cancel()); switching = false; };
    }, 300);
  }
  stage.addEventListener('click', swap);
  stage.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); swap(); } });

  // tilt toward the cursor (fast spring, so it never feels sluggish)
  let tx = 0, ty = 0, rx = 0, ry = 0, hoverRig = false;
  if (fine && !reduce) {
    addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      ty = clamp((e.clientX - cx) / innerWidth * 52, -24, 24);
      tx = clamp(-(e.clientY - cy) / innerHeight * 40, -18, 18);
    }, { passive: true });
    stage.addEventListener('pointerenter', () => { hoverRig = true; stage.classList.add('is-hover'); });
    stage.addEventListener('pointerleave', () => { hoverRig = false; stage.classList.remove('is-hover'); });
  }

  /* ================= intro ================= */
  const intro = $('#intro');
  const mark = $('#intro-mark');
  let introGL = null;
  function runIntro() {
    let visited = false;
    try { visited = sessionStorage.getItem('tn-intro') === '1'; sessionStorage.setItem('tn-intro', '1'); } catch (e) {}
    if (reduce || !intro) { finishIntro(true); return; }
    const T = visited
      ? { markEnd: 0.45, b0: 0.25, b1: 0.75, f0: 0.55, f1: 1.6, reveal: 0.7 }
      : { markEnd: 1.35, b0: 1.2, b1: 1.85, f0: 1.62, f1: 2.75, reveal: 1.78 };
    root.classList.add('is-intro');
    if (visited) mark.classList.add('is-quick');
    const th = THEMES[theme()];
    const introBg = theme() === 'light' ? '#310a31' : '#f4ecd6';
    root.style.setProperty('--intro-bg', introBg);
    root.style.setProperty('--intro-fg', th.bg);
    // WebGL halftone
    const gl2 = intro.getContext('webgl', { premultipliedAlpha: true, alpha: true });
    if (!gl2) { setTimeout(() => finishIntro(true), T.markEnd * 1000); return; }
    const vs = 'attribute vec2 a; varying vec2 v; void main(){ v=a*.5+.5; gl_Position=vec4(a,0.,1.); }';
    const fs = `precision highp float; varying vec2 v; uniform vec2 R; uniform float B, F, S, ROT;
uniform vec3 BG, K1, K2, K3;
void main(){
  vec2 p=v*R; vec2 c=R*.5; float maxD=length(R)*.5;
  float cs=cos(ROT), sn=sin(ROT);
  vec2 rp=p-c; vec2 q=vec2(cs*rp.x-sn*rp.y, sn*rp.x+cs*rp.y)/S;
  vec2 cell=floor(q)+.5;
  float F1=0., F2=0., F3=0.;
  for(int j=-1;j<=1;j++){ for(int i=-1;i<=1;i++){
    vec2 cc=(cell+vec2(float(i),float(j)))*S;
    vec2 wp=c+vec2(cs*cc.x+sn*cc.y, -sn*cc.x+cs*cc.y);
    float d0=length(wp-c)/maxD;
    float rb=S*.21*max(0.,1.-d0*1.55)*smoothstep(d0,d0+.05,B*.7)*(1.-smoothstep(.75,1.,B)*.0);
    float rf=S*1.08*smoothstep(0.,.34,F*1.42-d0*1.05);
    float r=max(rb,rf);
    vec2 dd=p-wp; float d2=dot(dd,dd)+1.;
    F1+=r*r/d2; F2+=r*r*.84/d2; F3+=r*r*.7/d2;
  }}
  float a1=smoothstep(.93,1.07,F1), a2=smoothstep(.93,1.07,F2), a3=smoothstep(.93,1.07,F3);
  vec3 col=mix(BG,K1,a1); col=mix(col,K2,a2); col=mix(col,K3,a3);
  float alpha=1.-a3*smoothstep(0.,.12,F);
  gl_FragColor=vec4(col*alpha,alpha);
}`;
    const mk = (t, s) => { const o = gl2.createShader(t); gl2.shaderSource(o, s); gl2.compileShader(o); return o; };
    const pr = gl2.createProgram();
    gl2.attachShader(pr, mk(gl2.VERTEX_SHADER, vs)); gl2.attachShader(pr, mk(gl2.FRAGMENT_SHADER, fs));
    gl2.linkProgram(pr);
    if (!gl2.getProgramParameter(pr, gl2.LINK_STATUS)) { finishIntro(true); return; }
    gl2.useProgram(pr);
    const b = gl2.createBuffer(); gl2.bindBuffer(gl2.ARRAY_BUFFER, b);
    gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl2.STATIC_DRAW);
    const al = gl2.getAttribLocation(pr, 'a'); gl2.enableVertexAttribArray(al); gl2.vertexAttribPointer(al, 2, gl2.FLOAT, false, 0, 0);
    const u = n => gl2.getUniformLocation(pr, n);
    const idpr = Math.min(window.devicePixelRatio || 1, 1.5);
    intro.width = Math.round(innerWidth * idpr); intro.height = Math.round(innerHeight * idpr);
    gl2.viewport(0, 0, intro.width, intro.height);
    const v3 = h => hexRGB(h).map(x => x / 255);
    gl2.uniform2f(u('R'), intro.width, intro.height);
    gl2.uniform1f(u('S'), 44 * idpr);
    gl2.uniform1f(u('ROT'), 0.55);
    gl2.uniform3fv(u('BG'), v3(introBg));
    gl2.uniform3fv(u('K1'), v3(theme() === 'light' ? '#6ad8ff' : '#2a9fd6'));
    gl2.uniform3fv(u('K2'), v3('#ff5fa8'));
    gl2.uniform3fv(u('K3'), v3(th.bg));
    const uB = u('B'), uF = u('F');
    const start = performance.now();
    let revealed = false, first = true;
    (function tick(now) {
      const t = (now - start) / 1000;
      const B = clamp((t - T.b0) / (T.b1 - T.b0), 0, 1);
      const Fp = easeInOut(clamp((t - T.f0) / (T.f1 - T.f0), 0, 1));
      gl2.clearColor(0, 0, 0, 0); gl2.clear(gl2.COLOR_BUFFER_BIT);
      gl2.uniform1f(uB, B); gl2.uniform1f(uF, Fp);
      gl2.drawArrays(gl2.TRIANGLE_STRIP, 0, 4);
      if (first) { first = false; intro.style.background = 'transparent'; }
      if (t > T.markEnd) mark.classList.add('is-gone');
      if (!revealed && t > T.reveal) { revealed = true; startHeroEntrance(); }
      if (t < T.f1 + 0.05) requestAnimationFrame(tick);
      else finishIntro(false);
    })(start);
    introGL = gl2;
  }
  function startHeroEntrance() {
    anim.t0 = performance.now();
    root.classList.add('is-revealed');
  }
  function finishIntro(skip) {
    if (skip) { anim.done = true; anim.t0 = -1; root.classList.add('is-revealed'); }
    root.classList.remove('is-intro');
    root.classList.add('intro-done');
    if (intro) intro.remove();
    if (mark) mark.remove();
    window.dispatchEvent(new Event('tn:intro-done'));
  }

  /* ================= boot ================= */
  let titleDirty = true, fallback = false;
  async function boot() {
    try { await document.fonts.load(`900 100px Archivo`); } catch (e) {}
    sampleStroke();
    computeLayout();
    if (!initGL()) {
      fallback = true;
      glCanvas.replaceWith(src);
      src.id = 'title-gl';
      src.className = 'title-fallback';
    }
    setInk();
    drawSource(performance.now());
    upload();
    runIntro();
    let prev = performance.now();
    (function frame(now) {
      const dt = Math.min(0.05, Math.max(0, (now - prev) / 1000)); prev = Math.max(prev, now);
      if (!document.hidden && layout) {
        const animating = anim.t0 >= 0 && !anim.done;
        if (animating || titleDirty) {
          const finished = drawSource(now);
          upload();
          titleDirty = false;
          if (finished && anim.t0 >= 0) { anim.done = true; }
        }
        if (fallback) { /* the 2D canvas is visible directly; colour via CSS */ }
        else if (scrollY < innerHeight * 1.3) renderGL(dt);
        // rig tilt
        const k = 1 - Math.exp(-dt * (hoverRig ? 10 : 7));
        rx += (tx + 6 - rx) * k; ry += (ty - 12 - ry) * k; // resting 3/4 angle shows the thickness
        tiltEl.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      }
      requestAnimationFrame(frame);
    })(prev);
  }
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (!STROKE) return; computeLayout(); titleDirty = true; }, 120); }, { passive: true });
  window.addEventListener('tn:theme', () => { setInk(); titleDirty = true; });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
