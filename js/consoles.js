/* THARINI NAVEEN / handheld consoles
   Hand-built CSS 3D consoles in the Gemini style: an outlined plum body, a stack of
   thin slabs that gives each one real, chunky thickness when it tilts, and a live pixel
   screen. Four shapes: mini (work grid), pocket, controller and tablet (the hero rigs).
   The project viewer reuses addDepth() for its large console. */
(function () {
  'use strict';
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  // body thickness in px; slabs sit 1.5px apart so the side reads as one solid wall
  const DEPTH = { mini: 24, pocket: 30, controller: 30, tablet: 30 };
  const SCREEN = { mini: [104, 60], pocket: [120, 72], controller: [128, 64], tablet: [148, 79] };

  function addDepth(root, depthPx) {
    const depth = el('div', 'cx-depth');
    const step = 1.5, n = Math.max(4, Math.round(depthPx / step));
    for (let i = n; i >= 1; i--) {
      const s = el('div', 'cx-slab' + (i === n ? ' cx-slab-back' : ''));
      s.style.transform = `translateZ(${(-i * step).toFixed(1)}px)`;
      // cream at the front edge, warmer and darker toward the back, like a lit side wall
      s.style.setProperty('--k', Math.round(Math.pow(i / n, 1.4) * 100) + '%');
      depth.appendChild(s);
    }
    root.appendChild(depth);
    root.style.setProperty('--depth', depthPx + 'px');
    return depth;
  }

  function build(kind, project, opts = {}) {
    const root = el('div', `cx cx-${kind}`);
    root.style.setProperty('--c1', project.c1);
    root.style.setProperty('--c2', project.c2);
    addDepth(root, DEPTH[kind]);
    if (kind === 'controller') {
      const ant = el('div', 'cx-antennas', '<i class="cx-ant l"><b></b></i><i class="cx-ant r"><b></b></i>');
      root.appendChild(ant);
    }
    const face = el('div', 'cx-face');
    root.appendChild(face);
    if (kind === 'tablet') face.appendChild(el('div', 'cx-bumpers', '<i></i><i></i><i></i><i></i>'));

    const screen = el('div', 'cx-screen');
    const view = el('div', 'cx-view');
    const canvas = el('canvas', 'cx-canvas');
    canvas.setAttribute('aria-hidden', 'true');
    view.appendChild(canvas);
    view.appendChild(el('div', 'cx-glass'));
    if (opts.hud) {
      screen.appendChild(el('div', 'cx-bar', '<span class="cx-rig"></span><span class="cx-metric"></span>'));
      screen.appendChild(view);
      screen.appendChild(el('div', 'cx-bar cx-bar-bottom', '<strong class="cx-title"></strong><span>[CLICK]</span>'));
    } else {
      screen.appendChild(el('div', 'cx-bar', `<span class="cx-metric">${project.metric}</span>`));
      screen.appendChild(view);
    }
    if (kind === 'mini') {
      face.appendChild(screen);
      face.appendChild(el('div', 'cx-controls',
        `<div class="cx-dpad"></div>
         <div class="cx-label"><span>${project.badge} · RIG</span><span class="cx-live">● LIVE</span></div>
         <div class="cx-btns"><i></i><i style="background:var(--c1)"></i><i style="background:var(--c2)"></i><i></i></div>`));
    } else if (kind === 'pocket') {
      face.appendChild(el('div', 'cx-topline', '<span>TN // POCKET</span><span class="cx-led"></span>'));
      face.appendChild(screen);
      face.appendChild(el('div', 'cx-controls',
        `<div class="cx-dpad"></div>
         <div class="cx-label"><div class="cx-pins">${'<i></i>'.repeat(8)}</div><span>THORRWHO // 3D</span></div>
         <div class="cx-btns cx-btns-lg"><i>AI</i><i>ML</i><i>FS</i><i>UI</i></div>`));
      face.appendChild(el('div', 'cx-speaker', '<i></i><i></i><i></i><i></i><i></i>'));
    } else if (kind === 'controller') {
      face.appendChild(el('div', 'cx-stick l', '<b></b>'));
      face.appendChild(screen);
      face.appendChild(el('div', 'cx-stick r', '<b></b>'));
      face.appendChild(el('div', 'cx-ctl-row', `<div class="cx-dpad cx-dpad-sm"></div><span>TN·DRONE 02</span><div class="cx-btns cx-btns-row"><i></i><i style="background:var(--c1)"></i><i style="background:var(--c2)"></i></div>`));
    } else if (kind === 'tablet') {
      face.appendChild(screen);
      face.appendChild(el('div', 'cx-tab-row', `<i></i><i></i><span>TN // RUGGED 03</span><i style="background:var(--c1)"></i><i style="background:var(--c2)"></i>`));
    }
    const [w, h] = SCREEN[kind];
    const scr = window.TNScreens.create(canvas, project.id, { w, h });
    return { root, screen: scr, face };
  }
  window.TNConsoles = { build, addDepth };
})();
