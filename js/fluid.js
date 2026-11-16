/* THARINI NAVEEN / liquid ink cursor
   A small WebGL fluid simulation. Ink is thresholded into a crisp blob and composited
   with mix-blend-mode:difference so that whatever sits under it swaps to the opposite
   palette colour (cream <-> plum). A second canvas adds the small per-channel offset
   that plain difference cannot reach, so the swap is exact in both themes. */
(function () {
  'use strict';
  const canvas = document.getElementById('ink');
  const tint = document.getElementById('ink-tint');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const api = { enabled: false, setTheme() {}, setGrainRect() {}, splat() {} };
  window.TNInk = api;
  if (!canvas || !fine || reduce) { canvas && canvas.remove(); tint && tint.remove(); return; }

  const P = {
    SIM: 128, DYE: 720,
    VEL_DISS: 1.1, DYE_DISS: 2.4,
    PRESSURE: 0.8, ITER: 16, CURL: 7,
    RADIUS: 0.0019, FORCE: 4200,
  };

  const opts = { alpha: true, depth: false, stencil: false, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false };
  let gl = canvas.getContext('webgl2', opts);
  const isGL2 = !!gl;
  if (!gl) gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
  if (!gl) { canvas.remove(); tint.remove(); return; }

  let halfFloat, linear;
  if (isGL2) { gl.getExtension('EXT_color_buffer_float'); linear = true; }
  else { halfFloat = gl.getExtension('OES_texture_half_float'); linear = !!gl.getExtension('OES_texture_half_float_linear'); }
  const HALF = isGL2 ? gl.HALF_FLOAT : halfFloat && halfFloat.HALF_FLOAT_OES;
  if (!HALF) { canvas.remove(); tint.remove(); return; }

  function supportRT(internal, format, type) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.deleteTexture(t); gl.deleteFramebuffer(fb);
    return ok;
  }
  function fmt(internal, format) {
    if (!isGL2) return supportRT(gl.RGBA, gl.RGBA, HALF) ? { internal: gl.RGBA, format: gl.RGBA } : null;
    if (supportRT(internal, format, HALF)) return { internal, format };
    if (internal === gl.R16F) return fmt(gl.RG16F, gl.RG);
    if (internal === gl.RG16F) return fmt(gl.RGBA16F, gl.RGBA);
    return null;
  }
  const F_RGBA = isGL2 ? fmt(gl.RGBA16F, gl.RGBA) : fmt();
  const F_RG = isGL2 ? fmt(gl.RG16F, gl.RG) : F_RGBA;
  const F_R = isGL2 ? fmt(gl.R16F, gl.RED) : F_RGBA;
  if (!F_RGBA || !F_RG || !F_R) { canvas.remove(); tint.remove(); return; }

  /* ---------- shaders ---------- */
  const VS = `precision highp float;
attribute vec2 aPosition; varying vec2 vUv, vL, vR, vT, vB; uniform vec2 texelSize;
void main(){ vUv=aPosition*.5+.5; vL=vUv-vec2(texelSize.x,0.); vR=vUv+vec2(texelSize.x,0.);
vT=vUv+vec2(0.,texelSize.y); vB=vUv-vec2(0.,texelSize.y); gl_Position=vec4(aPosition,0.,1.); }`;
  const FS = {
    splat: `precision highp float; varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio, radius;
uniform vec3 color; uniform vec2 point;
void main(){ vec2 p=vUv-point; p.x*=aspectRatio; vec3 s=exp(-dot(p,p)/radius)*color; gl_FragColor=vec4(texture2D(uTarget,vUv).xyz+s,1.); }`,
    advect: `precision highp float; varying vec2 vUv; uniform sampler2D uVelocity, uSource; uniform vec2 texelSize, dyeTexelSize;
uniform float dt, dissipation;
vec4 bilerp(sampler2D s, vec2 uv, vec2 ts){ vec2 st=uv/ts-.5; vec2 i=floor(st); vec2 f=fract(st);
 vec4 a=texture2D(s,(i+vec2(.5,.5))*ts), b=texture2D(s,(i+vec2(1.5,.5))*ts), c=texture2D(s,(i+vec2(.5,1.5))*ts), d=texture2D(s,(i+vec2(1.5,1.5))*ts);
 return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
void main(){
#ifdef MANUAL
 vec2 coord=vUv-dt*bilerp(uVelocity,vUv,texelSize).xy*texelSize; vec4 r=bilerp(uSource,coord,dyeTexelSize);
#else
 vec2 coord=vUv-dt*texture2D(uVelocity,vUv).xy*texelSize; vec4 r=texture2D(uSource,coord);
#endif
 gl_FragColor=r/(1.+dissipation*dt); }`,
    divergence: `precision highp float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uVelocity;
void main(){ float L=texture2D(uVelocity,vL).x, R=texture2D(uVelocity,vR).x, T=texture2D(uVelocity,vT).y, B=texture2D(uVelocity,vB).y;
 vec2 C=texture2D(uVelocity,vUv).xy; if(vL.x<0.)L=-C.x; if(vR.x>1.)R=-C.x; if(vT.y>1.)T=-C.y; if(vB.y<0.)B=-C.y;
 gl_FragColor=vec4(.5*(R-L+T-B),0.,0.,1.); }`,
    curl: `precision highp float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uVelocity;
void main(){ float L=texture2D(uVelocity,vL).y, R=texture2D(uVelocity,vR).y, T=texture2D(uVelocity,vT).x, B=texture2D(uVelocity,vB).x;
 gl_FragColor=vec4(.5*(R-L-T+B),0.,0.,1.); }`,
    vorticity: `precision highp float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uVelocity, uCurl; uniform float curl, dt;
void main(){ float L=texture2D(uCurl,vL).x, R=texture2D(uCurl,vR).x, T=texture2D(uCurl,vT).x, B=texture2D(uCurl,vB).x, C=texture2D(uCurl,vUv).x;
 vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L)); f/=length(f)+1e-4; f*=curl*C; f.y*=-1.;
 vec2 v=texture2D(uVelocity,vUv).xy+f*dt; v=clamp(v,-1000.,1000.); gl_FragColor=vec4(v,0.,1.); }`,
    pressure: `precision highp float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uPressure, uDivergence;
void main(){ float L=texture2D(uPressure,vL).x, R=texture2D(uPressure,vR).x, T=texture2D(uPressure,vT).x, B=texture2D(uPressure,vB).x;
 gl_FragColor=vec4((L+R+B+T-texture2D(uDivergence,vUv).x)*.25,0.,0.,1.); }`,
    gradient: `precision highp float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uPressure, uVelocity;
void main(){ float L=texture2D(uPressure,vL).x, R=texture2D(uPressure,vR).x, T=texture2D(uPressure,vT).x, B=texture2D(uPressure,vB).x;
 vec2 v=texture2D(uVelocity,vUv).xy-vec2(R-L,T-B); gl_FragColor=vec4(v,0.,1.); }`,
    clear: `precision highp float; varying vec2 vUv; uniform sampler2D uTexture; uniform float value;
void main(){ gl_FragColor=value*texture2D(uTexture,vUv); }`,
    display: `precision highp float; varying vec2 vUv; uniform sampler2D uTexture; uniform vec3 uColor; uniform vec4 uGrain; uniform float uTime;
float hash(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
void main(){
 float d=texture2D(uTexture,vUv).r;
 float a=smoothstep(.30,.36,d);
 if(vUv.x>uGrain.x && vUv.x<uGrain.z && vUv.y>uGrain.y && vUv.y<uGrain.w){
   float n=hash(floor(gl_FragCoord.xy/1.6)+mod(floor(uTime*20.),61.)*vec2(17.,31.));
   a=d>.045?step(n,smoothstep(.04,.6,d)*.94):0.;
 }
 gl_FragColor=vec4(uColor*a,a); }`,
  };

  function compile(type, src, defs) {
    const s = gl.createShader(type);
    gl.shaderSource(s, (defs || '') + src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const vsh = compile(gl.VERTEX_SHADER, VS);
  function program(fsrc, defs) {
    const p = gl.createProgram();
    gl.attachShader(p, vsh);
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsrc, defs));
    gl.bindAttribLocation(p, 0, 'aPosition');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
    return { p, u, use() { gl.useProgram(p); } };
  }
  let progs;
  try {
    progs = {};
    for (const k of Object.keys(FS)) progs[k] = program(FS[k], k === 'advect' && !linear ? '#define MANUAL\n' : '');
  } catch (e) { console.warn('ink cursor disabled', e); canvas.remove(); tint.remove(); return; }

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);
  function blit(target) {
    if (target) { gl.viewport(0, 0, target.w, target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb); }
    else { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  function fbo(w, h, f, filter) {
    gl.activeTexture(gl.TEXTURE0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, f.internal, w, h, 0, f.format, HALF, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fb, w, h, tx: 1 / w, ty: 1 / h, attach(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, tex); return id; } };
  }
  function double(w, h, f, filter) {
    let a = fbo(w, h, f, filter), b = fbo(w, h, f, filter);
    return { w, h, tx: 1 / w, ty: 1 / h, get read() { return a; }, get write() { return b; }, swap() { const t = a; a = b; b = t; } };
  }
  function res(r) {
    let ar = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (ar < 1) ar = 1 / ar;
    const mx = Math.round(r * ar), mn = Math.round(r);
    return gl.drawingBufferWidth > gl.drawingBufferHeight ? { w: mx, h: mn } : { w: mn, h: mx };
  }

  let dye, vel, div, curlT, pres, dpr = 1;
  const LIN = linear ? gl.LINEAR : gl.NEAREST;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    canvas.width = w; canvas.height = h;
    tint.width = w; tint.height = h;
    const s = res(P.SIM), d = res(P.DYE);
    dye = double(d.w, d.h, F_R, LIN);
    vel = double(s.w, s.h, F_RG, LIN);
    div = fbo(s.w, s.h, F_R, gl.NEAREST);
    curlT = fbo(s.w, s.h, F_R, gl.NEAREST);
    pres = double(s.w, s.h, F_R, gl.NEAREST);
  }
  size();
  let resizeT;
  addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(size, 120); }, { passive: true });

  function splat(x, y, dx, dy, amount, radius) {
    const ar = canvas.width / canvas.height;
    const p = progs.splat; p.use();
    gl.uniform1i(p.u.uTarget, vel.read.attach(0));
    gl.uniform1f(p.u.aspectRatio, ar);
    gl.uniform2f(p.u.point, x, y);
    gl.uniform3f(p.u.color, dx, dy, 0);
    gl.uniform1f(p.u.radius, radius * (ar > 1 ? 1 : 1));
    blit(vel.write); vel.swap();
    gl.uniform1i(p.u.uTarget, dye.read.attach(0));
    gl.uniform3f(p.u.color, amount, 0, 0);
    blit(dye.write); dye.swap();
  }

  function step(dt) {
    gl.disable(gl.BLEND);
    let p = progs.curl; p.use();
    gl.uniform2f(p.u.texelSize, vel.tx, vel.ty);
    gl.uniform1i(p.u.uVelocity, vel.read.attach(0));
    blit(curlT);

    p = progs.vorticity; p.use();
    gl.uniform2f(p.u.texelSize, vel.tx, vel.ty);
    gl.uniform1i(p.u.uVelocity, vel.read.attach(0));
    gl.uniform1i(p.u.uCurl, curlT.attach(1));
    gl.uniform1f(p.u.curl, P.CURL);
    gl.uniform1f(p.u.dt, dt);
    blit(vel.write); vel.swap();

    p = progs.divergence; p.use();
    gl.uniform2f(p.u.texelSize, vel.tx, vel.ty);
    gl.uniform1i(p.u.uVelocity, vel.read.attach(0));
    blit(div);

    p = progs.clear; p.use();
    gl.uniform1i(p.u.uTexture, pres.read.attach(0));
    gl.uniform1f(p.u.value, P.PRESSURE);
    blit(pres.write); pres.swap();

    p = progs.pressure; p.use();
    gl.uniform2f(p.u.texelSize, vel.tx, vel.ty);
    gl.uniform1i(p.u.uDivergence, div.attach(0));
    for (let i = 0; i < P.ITER; i++) {
      gl.uniform1i(p.u.uPressure, pres.read.attach(1));
      blit(pres.write); pres.swap();
    }

    p = progs.gradient; p.use();
    gl.uniform2f(p.u.texelSize, vel.tx, vel.ty);
    gl.uniform1i(p.u.uPressure, pres.read.attach(0));
    gl.uniform1i(p.u.uVelocity, vel.read.attach(1));
    blit(vel.write); vel.swap();

    p = progs.advect; p.use();
    gl.uniform2f(p.u.texelSize, vel.tx, vel.ty);
    if (!linear) gl.uniform2f(p.u.dyeTexelSize, vel.tx, vel.ty);
    const vid = vel.read.attach(0);
    gl.uniform1i(p.u.uVelocity, vid);
    gl.uniform1i(p.u.uSource, vid);
    gl.uniform1f(p.u.dt, dt);
    gl.uniform1f(p.u.dissipation, P.VEL_DISS);
    blit(vel.write); vel.swap();

    if (!linear) gl.uniform2f(p.u.dyeTexelSize, dye.tx, dye.ty);
    gl.uniform1i(p.u.uVelocity, vel.read.attach(0));
    gl.uniform1i(p.u.uSource, dye.read.attach(1));
    gl.uniform1f(p.u.dissipation, P.DYE_DISS);
    blit(dye.write); dye.swap();
  }

  /* ---------- palette swap colours ---------- */
  // difference with D maps x -> D - x; plus-lighter adds E. With D+E = bg+ink, bg<->ink swap exactly.
  const PAL = {
    light: { bg: [244, 236, 214], ink: [49, 10, 49] },
    dark: { bg: [18, 13, 21], ink: [244, 236, 214] },
  };
  let D = [1, 1, 1], E = [0, 0, 0];
  const tctx = tint.getContext('2d');
  function setTheme(t) {
    const p = PAL[t] || PAL.dark;
    const sum = p.bg.map((v, i) => v + p.ink[i]);
    D = sum.map(v => Math.min(255, v) / 255);
    E = sum.map(v => Math.max(0, v - 255));
    const plus = window.CSS && CSS.supports && CSS.supports('mix-blend-mode', 'plus-lighter');
    tint.style.display = plus && E.some(v => v > 9) ? 'block' : 'none';
  }
  api.setTheme = setTheme;
  setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

  // optional grainy ink region: a function returning the visible part of a section, or null
  let grainFn = null;
  api.setGrainRect = fn => { grainFn = fn; };

  /* ---------- pointer ---------- */
  let lastX = -1, lastY = -1, lastT = 0, moved = false, idle = 0;
  const queue = [];
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const now = performance.now();
    const x = e.clientX, y = e.clientY;
    if (lastX < 0) { lastX = x; lastY = y; lastT = now; return; }
    queue.push([lastX, lastY, x, y, Math.max(8, now - lastT)]);
    lastX = x; lastY = y; lastT = now; moved = true;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { lastX = -1; });

  function flushPointer() {
    const W = innerWidth, H = innerHeight;
    for (const [x0, y0, x1, y1, ms] of queue) {
      const dxp = x1 - x0, dyp = y1 - y0;
      const dist = Math.hypot(dxp, dyp);
      if (dist < 0.5) continue;
      const speed = dist / ms * 1000; // px/s
      const n = Math.min(24, Math.ceil(dist / 7));
      const amt = Math.min(0.95, 0.2 + speed * 0.00045) / Math.sqrt(n);
      const rad = P.RADIUS * (0.75 + Math.min(1, speed / 2000) * 1.1);
      const fx = dxp / W * P.FORCE / n * (W / H), fy = -dyp / H * P.FORCE / n;
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        splat((x0 + dxp * t) / W, 1 - (y0 + dyp * t) / H, fx, fy, amt, rad);
      }
    }
    queue.length = 0;
  }
  api.splat = (x, y, dx, dy, amount, radius) => queue.push([x - dx, y - dy, x, y, 16]);

  /* ---------- loop ---------- */
  let prev = performance.now(), t0 = prev;
  function tick(dt, now) {
    if (queue.length) { flushPointer(); idle = 0; } else idle += dt;
    if (idle > 4) return;
    step(dt);
    const p = progs.display; p.use();
    gl.uniform1i(p.u.uTexture, dye.read.attach(0));
    gl.uniform3f(p.u.uColor, D[0], D[1], D[2]);
    gl.uniform1f(p.u.uTime, (now - t0) / 1000);
    let g = [2, 2, 2, 2];
    const r = grainFn && grainFn();
    if (r && r.bottom > r.top) g = [r.left / innerWidth, 1 - r.bottom / innerHeight, r.right / innerWidth, 1 - r.top / innerHeight];
    gl.uniform4f(p.u.uGrain, g[0], g[1], g[2], g[3]);
    blit(null);
    if (tint.style.display !== 'none') {
      tctx.globalCompositeOperation = 'copy';
      tctx.drawImage(canvas, 0, 0);
      tctx.globalCompositeOperation = 'source-in';
      tctx.fillStyle = `rgb(${E[0]},${E[1]},${E[2]})`;
      tctx.fillRect(0, 0, tint.width, tint.height);
    }
  }
  function frame(now) {
    const dt = Math.min(0.0167, Math.max(0.001, (now - prev) / 1000));
    prev = now;
    if (!document.hidden && !api._manual) tick(dt, now);
    requestAnimationFrame(frame);
  }
  api._tick = (n) => { for (let i = 0; i < (n || 1); i++) tick(1 / 60, performance.now()); };
  api.enabled = true;
  document.documentElement.classList.add('has-ink');
  requestAnimationFrame(frame);
})();
