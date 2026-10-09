import * as THREE from "three";

/**
 * Creates a renderer bound to a canvas and runs its frame loop only while the
 * canvas is on screen and the tab is visible. Every 3D scene on the site uses it.
 *
 * render(dt, elapsed) is called each frame.
 * When `still` is true (reduced motion), the loop never runs on its own;
 * call stage.invalidate() to draw a single frame after an interaction.
 */
export function createStage(canvas, { alpha = true, antialias = true, maxDPR = 2, still = false, onResize } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha, antialias, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDPR));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  let render = () => {};
  let visible = false;
  let running = false;
  let paused = still;
  let raf = 0;
  let last = 0;
  let elapsed = 0;
  let pending = false;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    onResize?.(w, h);
    invalidate();
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;
    render(dt, elapsed);
    raf = requestAnimationFrame(loop);
  }

  function update() {
    const should = visible && !paused && !document.hidden;
    if (should && !running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }

  // Draw one frame on demand (used while paused / reduced motion)
  function invalidate() {
    if (running || pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      render(0, elapsed);
    });
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  });
  io.observe(canvas);
  document.addEventListener("visibilitychange", update);

  return {
    renderer,
    setRender(fn) {
      render = fn;
      resize();
    },
    invalidate,
    setPaused(value) {
      paused = value;
      update();
      invalidate();
    },
    get elapsed() {
      return elapsed;
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
      renderer.dispose();
    },
  };
}

/** Pointer position relative to an element, as normalised device coords (-1..1). */
export function pointerNDC(event, el) {
  const r = el.getBoundingClientRect();
  return {
    x: ((event.clientX - r.left) / r.width) * 2 - 1,
    y: -((event.clientY - r.top) / r.height) * 2 + 1,
    inside: event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom,
  };
}

/** Small deterministic random generator so procedural scenes look the same on every visit. */
export function seeded(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
