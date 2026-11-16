/* THARINI NAVEEN / pixel screens
   Every console screen is a tiny low-resolution canvas scaled up with crisp pixels.
   Each project gets its own looping animation, so the screens are never a still image. */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 3x5 pixel font */
  const G = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
    F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
    K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
    P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
    Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
    4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111',
    9: '111101111001110', '%': '101001010100101', '.': '000000000000010', ':': '000010000010000', '/': '001001010100100',
    '-': '000000111000000', '+': '000010111010000', '>': '100010001010100', '<': '001010100010001', '[': '110100100100110',
    ']': '011001001001011', '!': '010010010000010', '?': '110001010000010', '#': '101111101111101', '_': '000000000000111',
    '=': '000111000111000', ',': '000000000010100', ' ': '000000000000000', '$': '011110010011110'
  };

  function rgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const CREAM = [244, 236, 214];

  function makeG(ctx, W, H, p) {
    const c1 = rgb(p.c1), c2 = rgb(p.c2);
    const col = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    const g = {
      ctx, W, H, c1, c2, cream: CREAM, col,
      rect(x, y, w, h, c, a) { ctx.fillStyle = col(c, a); ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); },
      px(x, y, c, a) { ctx.fillStyle = col(c, a); ctx.fillRect(Math.round(x), Math.round(y), 1, 1); },
      text(s, x, y, c, a = 1, scale = 1) {
        ctx.fillStyle = col(c, a);
        x = Math.round(x); y = Math.round(y);
        for (const ch of String(s).toUpperCase()) {
          const b = G[ch] || G[' '];
          for (let i = 0; i < 15; i++) if (b[i] === '1') ctx.fillRect(x + (i % 3) * scale, y + ((i / 3) | 0) * scale, scale, scale);
          x += 4 * scale;
        }
      },
      tw(s, scale = 1) { return String(s).length * 4 * scale - scale; },
      line(x0, y0, x1, y1, c, a = 1, dash = 0) {
        x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
        let err = dx + dy, i = 0;
        ctx.fillStyle = col(c, a);
        for (;;) {
          if (!dash || (i++ % (dash * 2)) < dash) ctx.fillRect(x0, y0, 1, 1);
          if (x0 === x1 && y0 === y1) break;
          const e2 = 2 * err;
          if (e2 >= dy) { err += dy; x0 += sx; }
          if (e2 <= dx) { err += dx; y0 += sy; }
        }
      },
      disc(cx, cy, r, c, a = 1) {
        ctx.fillStyle = col(c, a);
        for (let y = -r; y <= r; y++) {
          const w = Math.floor(Math.sqrt(r * r - y * y + r * 0.6));
          ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
        }
      },
      ring(cx, cy, r, c, a = 1, a0 = 0, a1 = Math.PI * 2) {
        ctx.fillStyle = col(c, a);
        const n = Math.max(8, Math.ceil(r * 7));
        for (let i = 0; i <= n; i++) {
          const ang = a0 + (a1 - a0) * i / n;
          ctx.fillRect(Math.round(cx + Math.cos(ang) * r), Math.round(cy + Math.sin(ang) * r), 1, 1);
        }
      },
      bg() {
        ctx.fillStyle = '#0a030b';
        ctx.fillRect(0, 0, W, H);
        const gr = ctx.createRadialGradient(W * 0.85, H * 0.1, 0, W * 0.85, H * 0.1, W * 0.8);
        gr.addColorStop(0, col(c1, 0.28));
        gr.addColorStop(1, col(c1, 0));
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, W, H);
      }
    };
    return g;
  }
  const ease = x => (x = Math.min(1, Math.max(0, x)), x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const blink = (t, hz = 2) => Math.floor(t * hz) % 2 === 0;

  const ANIM = {
    fairmesh(g, t) {
      const { W, H } = g;
      g.text('PTS', 3, 3, g.cream, 0.7);
      g.text(String(1000 + Math.floor((t * 87) % 8999)), 17, 3, g.c1);
      const bw = Math.round(W * 0.56);
      for (let i = 0; i < 6; i++) {
        const x = 6 + i * (bw - 10) / 5, y = ((t * 24 + i * 13) % (H - 22)) + 10;
        g.disc(x, y, 2, g.c1);
        g.px(x - 1, y - 1, g.cream);
      }
      g.rect(3, H - 10, bw, 1, g.cream, 0.6);
      g.rect(3, H - 10, 1, 7, g.cream, 0.6);
      g.rect(3 + bw - 1, H - 10, 1, 7, g.cream, 0.6);
      g.rect(3, H - 4, bw, 1, g.cream, 0.6);
      g.rect(5, H - 8, (bw - 4) * ((t * 0.3) % 1), 3, g.c1, 0.8);
      const cx = W * 0.8, cy = H * 0.6, lit = Math.floor((t * 1.3) % 4);
      g.disc(cx, cy, 1, lit >= 0 ? g.c2 : g.cream);
      for (let k = 1; k <= 3; k++) g.ring(cx, cy, k * 5, k <= lit ? g.c2 : g.cream, k <= lit ? 1 : 0.25, -Math.PI * 0.78, -Math.PI * 0.22);
      if (lit === 3 && blink(t, 4)) g.text('FREE', cx - 7, H - 9, g.c2);
      else g.text('WIFI', cx - 7, H - 9, g.cream, 0.6);
    },
    medipredict(g, t) {
      const { W, H } = g;
      for (let x = 0; x < W; x += 6) g.rect(x, 0, 1, H, g.c2, 0.08);
      for (let y = 0; y < H; y += 6) g.rect(0, y, W, 1, g.c2, 0.08);
      const yb = Math.round(H * 0.42), hx = (t * 40) % W;
      const ecg = s => (s >= 8 && s < 11) ? -2 : s === 15 ? 2 : s === 16 ? -15 : s === 17 ? 7 : (s >= 23 && s < 29) ? -3 : 0;
      let prevY = yb;
      for (let x = 0; x < W; x++) {
        const age = (hx - x + W) % W;
        if (age > W * 0.82) { prevY = yb; continue; }
        const y = yb + ecg(Math.floor(x + 400) % 36);
        const a = 1 - age / (W * 0.82);
        g.line(x - 1, prevY, x, y, age < 2 ? g.cream : g.c1, 0.25 + a * 0.75);
        prevY = y;
      }
      g.text('BPM ' + (72 + Math.round(Math.sin(t) * 3)), 3, 3, g.c2, 0.9);
      const r = 0.23 + Math.sin(t * 0.9) * 0.04;
      g.text('RISK', 3, H - 8, g.cream, 0.75);
      g.rect(21, H - 8, W * 0.38, 5, g.cream, 0.15);
      g.rect(21, H - 8, W * 0.38 * r * 2, 5, g.c1);
      g.text(Math.round(r * 100) + '%', 23 + W * 0.38, H - 8, g.c1);
      g.text('AUC.826', W - g.tw('AUC.826') - 3, 3, g.cream, 0.55);
    },
    rag(g, t) {
      const { W, H } = g;
      const pw = Math.round(W * 0.34), ph = Math.round(H * 0.66);
      for (let k = 2; k >= 0; k--) {
        const x = 3 + k * 3, y = 6 + k * 3;
        g.rect(x, y, pw, ph, k ? g.cream : [238, 228, 205], k ? 0.25 : 0.95);
      }
      const rowH = 4, rows = Math.floor((ph - 6) / rowH), hl = Math.floor(t * 3) % rows;
      for (let r = 0; r < rows; r++) {
        const w = pw - 8 - ((r * 7) % 9);
        if (r === hl) g.rect(5, 9 + r * rowH - 1, pw - 4, 3, g.c1, 0.85);
        g.rect(7, 9 + r * rowH, w, 1, [70, 50, 70], 0.8);
      }
      const cyc = t % 4.5, bx = Math.round(W * 0.47), bw = W - bx - 3;
      g.rect(bx, 5, bw, 9, g.cream, 0.9);
      g.text('WHAT IS RAG?', bx + 2, 7, [49, 10, 49], 1);
      g.rect(bx, 18, bw, 26, g.c2, 0.18);
      g.rect(bx, 18, 1, 26, g.c2, 0.9);
      if (cyc < 1.1) {
        for (let i = 0; i < 3; i++) if (Math.floor(cyc * 6) % 3 >= i) g.rect(bx + 5 + i * 4, 29, 2, 2, g.c2);
      } else {
        const p = Math.min(1, (cyc - 1.1) / 1.6);
        for (let i = 0; i < 4; i++) g.rect(bx + 4, 22 + i * 5, (bw - 8 - (i === 3 ? 10 : 0)) * Math.min(1, Math.max(0, p * 4 - i)), 2, g.c2, 0.85);
        if (p >= 1 && blink(t, 3)) g.text('[P.4]', bx + bw - g.tw('[P.4]') - 1, 47, g.c1);
      }
    },
    sahaaya(g, t) {
      const { W, H } = g;
      g.ctx.fillStyle = 'rgba(0,229,163,0.06)';
      g.ctx.fillRect(0, 0, W, H);
      const ys = [Math.round(H * 0.32), Math.round(H * 0.7)], xs = [Math.round(W * 0.22), Math.round(W * 0.58), Math.round(W * 0.86)];
      ys.forEach(y => g.rect(0, y, W, 2, g.cream, 0.16));
      xs.forEach(x => g.rect(x, 0, 2, H, g.cream, 0.16));
      for (let i = 0; i < W; i++) g.px(i, Math.round(H * 0.9 - i * 0.12 + Math.sin(i * 0.2) * 1.5), [80, 160, 255], 0.35);
      const rx = xs[1], ry = ys[0];
      const pr = (t * 10) % 16;
      g.ring(rx, ry, pr, g.c2, 1 - pr / 16);
      const starts = [[xs[0], H - 3], [W - 2, ys[1]], [xs[2], 2]];
      starts.forEach(([sx, sy], i) => {
        const p = ease(((t * 0.22) + i * 0.31) % 1);
        // L-shaped route: move along x first to the road, then along y
        const mx = sx, my = ry;
        const l1 = Math.abs(my - sy), l2 = Math.abs(rx - mx), L = l1 + l2, d = p * L;
        const x = d < l1 ? sx : mx + Math.sign(rx - mx) * (d - l1);
        const y = d < l1 ? sy + Math.sign(my - sy) * d : my;
        g.line(sx, sy, mx, my, g.c1, 0.35, 1);
        g.line(mx, my, rx, ry, g.c1, 0.35, 1);
        g.disc(x, y, 1, g.c1);
      });
      g.disc(rx, ry, 2, g.c2);
      g.rect(rx - 1, ry - 6, 3, 3, g.c2);
      g.text('3 HELPERS NEAR', 3, 3, g.cream, 0.85);
    },
    lostfound(g, t) {
      const { W, H } = g;
      const p = (t % 4.2) / 4.2, cw = Math.round(W * 0.3), ch = Math.round(H * 0.5), y = Math.round(H * 0.16);
      const k = ease(p * 1.7);
      const lx = 3 + (W * 0.5 - cw - 2 - 3) * k, fx = (W - cw - 3) - (W - cw - 3 - W * 0.5 - 2) * k;
      const card = (x, label, c) => {
        g.rect(x, y, cw, ch, c, 0.14);
        g.rect(x, y, cw, 1, c); g.rect(x, y + ch - 1, cw, 1, c); g.rect(x, y, 1, ch, c); g.rect(x + cw - 1, y, 1, ch, c);
        const kx = x + cw / 2 - 4, ky = y + 7;
        g.disc(kx + 2, ky + 2, 2, g.cream, 0.9); g.px(kx + 2, ky + 2, [10, 3, 11]);
        g.rect(kx + 4, ky + 2, 6, 1, g.cream, 0.9); g.rect(kx + 7, ky + 3, 1, 2, g.cream, 0.9); g.rect(kx + 9, ky + 3, 1, 1, g.cream, 0.9);
        g.text(label, x + cw / 2 - g.tw(label) / 2, y + ch - 8, c);
      };
      card(lx, 'LOST', g.c1);
      card(fx, 'FOUND', g.c2);
      const m = Math.min(1, Math.max(0, (p - 0.45) / 0.2));
      g.rect(6, H - 9, W - 12, 3, g.cream, 0.15);
      g.rect(6, H - 9, (W - 12) * 0.92 * m, 3, g.c1);
      if (p > 0.66) g.text('MATCH 92%', W / 2 - g.tw('MATCH 92%') / 2, 3, blink(t, 4) ? g.c1 : g.cream);
      else g.text('SCANNING', W / 2 - g.tw('SCANNING') / 2, 3, g.cream, 0.6);
    },
    devalaya(g, t) {
      const { W, H } = g;
      const cx = Math.round(W * 0.3), base = H - 6, tiers = 7;
      let top = base;
      for (let i = 0; i < tiers; i++) {
        const w = Math.round(W * 0.42 * (1 - i / (tiers + 1.6))), h = i === 0 ? 7 : 5;
        top -= h;
        g.rect(cx - w / 2, top, w, h, i % 2 ? [204, 90, 30] : g.c1);
        for (let x = cx - w / 2 + 2; x < cx + w / 2 - 1; x += 3) g.px(x, top + 1, [60, 20, 10], 0.7);
      }
      g.rect(cx - 2, top - 3, 4, 3, [255, 200, 70]);
      g.px(cx, top - 4, [255, 230, 140]);
      const x0 = cx - W * 0.23, x1 = cx + W * 0.23, y0 = top - 6, y1 = base + 2;
      const sy = y0 + ((t * 18) % (y1 - y0));
      g.rect(x0, sy, x1 - x0, 1, g.c2, 0.9);
      g.rect(x0, sy - 2, x1 - x0, 2, g.c2, 0.2);
      if (blink(t, 2.5)) {
        [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, a, b]) => {
          g.rect(Math.min(x, x + a * 4), y, 5, 1, g.c2); g.rect(x, Math.min(y, y + b * 4), 1, 5, g.c2);
        });
      }
      const lx = Math.round(W * 0.62), cyc = (t % 3.5) / 3.5;
      [['DRAVIDA', 0.91], ['NAGARA', 0.06], ['VESARA', 0.03]].forEach(([n, v], i) => {
        const yy = 6 + i * 14;
        g.text(n, lx, yy, i ? g.cream : g.c1, i ? 0.6 : 1);
        g.rect(lx, yy + 7, W - lx - 4, 3, g.cream, 0.12);
        g.rect(lx, yy + 7, (W - lx - 4) * v * ease(cyc * 2), 3, i ? g.cream : g.c1, i ? 0.6 : 1);
      });
    },
    peppersense(g, t) {
      const { W, H } = g;
      const cx = W * 0.34, cy = H * 0.52, rx = W * 0.27, ry = H * 0.34;
      for (let y = -ry; y <= ry; y++) {
        const w = rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))) * (1 - Math.abs(y / ry) * 0.25);
        g.rect(cx - w + y * 0.35, cy + y, w * 2, 1, [46, 140, 60]);
      }
      g.line(cx - rx * 0.9, cy + ry * 0.35, cx + rx * 0.9, cy - ry * 0.35, [120, 210, 120], 0.8);
      const spots = [[-0.35, -0.2], [0.2, 0.25], [0.45, -0.15], [-0.05, 0.05]];
      const n = Math.floor((t * 0.9) % 5.5);
      spots.forEach(([sx, sy], i) => {
        if (i >= n) return;
        const x = cx + sx * rx * 1.2, y = cy + sy * ry * 1.4;
        g.disc(x, y, 2, [120, 70, 30]);
        g.px(x, y, [70, 40, 20]);
        g.rect(x - 4, y - 4, 9, 1, g.c2); g.rect(x - 4, y + 4, 9, 1, g.c2);
        g.rect(x - 4, y - 4, 1, 9, g.c2); g.rect(x + 4, y - 4, 1, 9, g.c2);
      });
      const lx = Math.round(W * 0.7);
      g.text('YOLO', lx, 4, g.c2);
      g.text('V12', lx, 11, g.c2, 0.7);
      g.text('SPOT', lx, 24, g.cream, 0.8);
      g.text(n ? '.88' : '...', lx, 31, g.c1);
      g.text('N=' + Math.min(n, 4), lx, 44, g.cream, 0.6);
    },
    safelink(g, t) {
      const { W, H } = g;
      const url = 'PAYTM-KYC.CO/LOGIN', cyc = t % 5, typed = Math.min(url.length, Math.floor(cyc * 10));
      g.rect(2, 3, W - 4, 9, g.cream, 0.12);
      g.text(url.slice(0, typed), 4, 5, g.cream, 0.95);
      if (typed < url.length && blink(t, 4)) g.rect(4 + typed * 4, 5, 3, 5, g.c2);
      const scan = Math.min(1, Math.max(0, (cyc - 1.9) / 1.4));
      if (scan > 0 && scan < 1) g.rect(2 + (W - 6) * scan, 2, 2, 11, g.c2, 0.9);
      const gx = Math.round(W * 0.3), gy = H - 9, r = 15;
      for (let i = 0; i <= 20; i++) {
        const a = Math.PI + Math.PI * i / 20;
        const c = i < 7 ? [80, 220, 140] : i < 14 ? [255, 184, 0] : g.c1;
        g.px(gx + Math.cos(a) * r, gy + Math.sin(a) * r, c);
        g.px(gx + Math.cos(a) * (r - 1), gy + Math.sin(a) * (r - 1), c, 0.6);
      }
      const na = Math.PI + Math.PI * (0.1 + 0.84 * ease(scan));
      g.line(gx, gy, gx + Math.cos(na) * (r - 3), gy + Math.sin(na) * (r - 3), g.cream);
      g.disc(gx, gy, 1, g.cream);
      const ix = Math.round(W * 0.72), iy = Math.round(H * 0.42);
      if (scan >= 1 && blink(t, 3)) {
        for (let y = 0; y < 13; y++) g.rect(ix - y / 2, iy + y, y + 1, 1, g.c1);
        g.rect(ix, iy + 4, 1, 5, [10, 3, 11]); g.px(ix, iy + 11, [10, 3, 11]);
      }
      g.text(scan >= 1 ? 'PHISH 94%' : 'CHECKING', ix - 17, H - 8, scan >= 1 ? g.c1 : g.cream, scan >= 1 ? 1 : 0.6);
    },
    vibe(g, t) {
      // a tiny browser that flips between the three vibe-coded sites
      const { W, H } = g;
      const sites = [
        { url: 'MOOD-PICKER', bg: [16, 10, 20], fg: [255, 42, 51] },
        { url: 'RESUME-ROASTER', bg: [27, 26, 58], fg: [255, 183, 3] },
        { url: 'SCAM-HAI-KYA', bg: [255, 61, 139], fg: [31, 75, 255] }
      ];
      const per = 2.6, k = Math.floor(t / per) % 3, lt = (t % per) / per, site = sites[k];
      g.rect(0, 0, W, 9, [36, 28, 40]);
      [[255, 95, 87], [255, 189, 46], [40, 200, 64]].forEach((c, i) => g.rect(3 + i * 4, 3, 2, 2, c));
      g.rect(17, 2, W - 20, 5, [12, 8, 14]);
      g.text(site.url, 19, 2, g.cream, 0.85);
      const top = 10, h = H - top;
      g.rect(0, top, W, h, site.bg);
      if (k === 0) {
        // ghost clerk behind the counter, neon OPEN sign, a tape sliding out
        const gx = Math.round(W * 0.3), gy = top + 10 + Math.round(Math.sin(t * 3) * 1.5);
        g.disc(gx, gy + 6, 9, [236, 232, 240]);
        g.rect(gx - 9, gy + 6, 19, 12, [236, 232, 240]);
        for (let i = 0; i < 5; i++) g.rect(gx - 9 + i * 4, gy + 17, 2, 2, site.bg);
        g.rect(gx - 4, gy + 3, 2, 3, [16, 10, 20]); g.rect(gx + 3, gy + 3, 2, 3, [16, 10, 20]);
        g.rect(0, top + h - 14, W, 14, [60, 30, 40]);
        if (blink(t, 1.7)) g.text('OPEN', W - 22, top + 4, site.fg);
        const tx = W - 6 - Math.round(ease(lt * 1.6) * (W * 0.42));
        g.rect(tx, top + h - 12, 26, 10, [20, 20, 22]); g.rect(tx + 4, top + h - 10, 18, 4, [236, 232, 240]);
        g.disc(tx + 8, top + h - 8, 1, [16, 10, 20]); g.disc(tx + 18, top + h - 8, 1, [16, 10, 20]);
      } else if (k === 1) {
        // roti on a tawa getting more charred as the score climbs
        const cx = Math.round(W * 0.32), cy = top + Math.round(h * 0.52);
        g.disc(cx, cy + 3, 15, [30, 30, 34]);
        g.disc(cx, cy, 13, [226, 170, 96]);
        const burns = Math.floor(lt * 9);
        for (let i = 0; i < burns; i++) { const a = i * 2.4, r = 3 + (i * 5) % 9; g.disc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1, [92, 50, 24]); }
        for (let i = 0; i < 3; i++) { const fy = cy - 16 - ((t * 14 + i * 5) % 8); g.rect(cx - 8 + i * 7, fy, 2, 3, site.fg, 0.8); }
        const score = Math.round(20 + lt * 66);
        g.text('ROAST', W * 0.62, top + 6, g.cream, 0.7);
        g.text(String(score), W * 0.62, top + 14, site.fg, 1, 2);
        g.rect(W * 0.62, top + h - 9, W * 0.32, 4, g.cream, 0.2);
        g.rect(W * 0.62, top + h - 9, W * 0.32 * score / 100, 4, [230, 59, 46]);
      } else {
        // halftone pink page, a paste box, then the stamp slams down
        for (let y = top + 2; y < H; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < W; x += 4) g.px(x, y, [255, 140, 190], 0.6);
        g.rect(6, top + 6, W * 0.5, h - 14, [255, 255, 255], 0.92);
        for (let i = 0; i < 5; i++) g.rect(9, top + 10 + i * 6, W * 0.5 - 8 - (i % 2) * 8, 2, [120, 120, 140]);
        const st = Math.min(1, Math.max(0, (lt - 0.35) / 0.12));
        if (st > 0) {
          const sc = 1 + (1 - st) * 1.4, sx = W * 0.76, sy = top + h * 0.48;
          const w2 = 18 * sc, h2 = 9 * sc;
          g.rect(sx - w2, sy - h2, w2 * 2, 2, site.fg); g.rect(sx - w2, sy + h2 - 2, w2 * 2, 2, site.fg);
          g.rect(sx - w2, sy - h2, 2, h2 * 2, site.fg); g.rect(sx + w2 - 2, sy - h2, 2, h2 * 2, site.fg);
          if (st >= 1) g.text('SCAM', sx - 7, sy - 2, site.fg);
        }
      }
      for (let i = 0; i < 3; i++) g.rect(W / 2 - 7 + i * 5, H - 3, 3, 2, i === k ? g.cream : g.cream, i === k ? 1 : 0.3);
    }
  };

  /* ---------- screen instances + shared loop ---------- */
  const screens = new Set();
  function create(canvas, projectId, opts = {}) {
    const W = opts.w || 96, H = opts.h || 60;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const byId = id => window.TN_PROJECTS.find(p => p.id === id) || window.TN_PROJECTS[0];
    const s = {
      canvas, visible: true, project: byId(projectId), seed: Math.random() * 10, glitch: 0,
      setProject(id) { this.project = byId(id); this.g = makeG(ctx, W, H, this.project); this.glitch = 1; },
      draw(t) {
        const g = this.g;
        g.bg();
        const fn = ANIM[this.project.id];
        if (fn) fn(g, t + this.seed);
        if (this.glitch > 0) {
          // channel-change static between projects
          const n = Math.floor(H * this.glitch);
          for (let i = 0; i < n * 3; i++) g.rect(Math.random() * W, Math.random() * H, Math.random() * 12, 1, Math.random() > 0.5 ? g.cream : g.c1, Math.random());
          this.glitch = Math.max(0, this.glitch - 0.12);
        }
      }
    };
    s.g = makeG(ctx, W, H, s.project);
    screens.add(s);
    if ('IntersectionObserver' in window) {
      s.visible = false;
      new IntersectionObserver(es => es.forEach(e => { s.visible = e.isIntersecting; }), { rootMargin: '120px' }).observe(canvas);
    }
    s.draw(0);
    return s;
  }
  let last = 0;
  const t0 = performance.now();
  function loop(now) {
    if (!document.hidden && now - last > 33) {
      last = now;
      const t = (now - t0) / 1000;
      screens.forEach(s => { if (s.visible) s.draw(t); });
    }
    if (!reduce) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.TNScreens = { create };
})();
