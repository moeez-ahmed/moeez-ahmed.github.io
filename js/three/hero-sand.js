import * as THREE from "three";
import { createStage, pointerNDC, seeded } from "./stage.js";

/**
 * Wind-blown sand drifting across the hero film.
 * Grains move on the GPU; the cursor pushes them aside and fast movement adds a gust.
 */
export function mountSand(canvas, { count = 7000, still = false } = {}) {
  const rand = seeded(7);
  const SPAN = 12; // world units the grains travel across before wrapping

  const uniforms = {
    uWind: { value: 0 },
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(9, 9) },
    uAspect: { value: 1 },
    uSize: { value: 22 },
    uDPR: { value: Math.min(window.devicePixelRatio || 1, 1.75) },
    uOpacity: { value: 1 },
  };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
  camera.position.z = 5;

  const stage = createStage(canvas, {
    maxDPR: 1.75,
    antialias: false,
    still,
    onResize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      uniforms.uAspect.value = w / h;
    },
  });

  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const speeds = new Float32Array(count);
  const tints = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rand() - 0.5) * SPAN;
    // more grains low in the frame, like sand lifting off a dune
    const y = Math.pow(rand(), 1.6);
    positions[i * 3 + 1] = -2.6 + y * 5.4;
    positions[i * 3 + 2] = -3 + rand() * 5;
    seeds[i] = rand();
    speeds[i] = 0.55 + rand() * 0.9;
    tints[i] = rand();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute("aTint", new THREE.BufferAttribute(tints, 1));

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uWind, uTime, uAspect, uSize, uDPR;
      uniform vec2 uMouse;
      attribute float aSeed, aSpeed, aTint;
      varying float vAlpha;
      varying float vTint;
      const float SPAN = ${SPAN.toFixed(1)};
      void main() {
        vec3 p = position;
        p.x = mod(p.x + uWind * aSpeed + SPAN * 0.5, SPAN) - SPAN * 0.5;
        float t = uTime * (0.4 + aSeed * 0.5);
        p.y += sin(t + aSeed * 6.2831) * 0.18 + sin(p.x * 0.7 + uTime * 0.35) * 0.12;
        p.z += cos(t * 0.8 + aSeed * 3.1) * 0.15;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vec4 clip = projectionMatrix * mv;
        vec2 ndc = clip.xy / clip.w;
        vec2 d = ndc - uMouse;
        d.x *= uAspect;
        float dist = length(d);
        float push = smoothstep(0.32, 0.0, dist);
        vec2 dir = d / max(dist, 0.0001);
        dir.x /= uAspect;
        mv.xy += dir * push * 0.09 * -mv.z;

        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uDPR * (0.35 + aSeed * 0.9) / -mv.z;

        float edge = smoothstep(SPAN * 0.5, SPAN * 0.5 - 1.0, abs(p.x));
        vAlpha = (0.18 + 0.55 * fract(aSeed * 13.17)) * edge;
        vTint = aTint;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying float vAlpha;
      varying float vTint;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.0, length(c));
        vec3 sand = vec3(0.86, 0.68, 0.44);
        vec3 pale = vec3(0.95, 0.89, 0.78);
        vec3 ember = vec3(0.98, 0.55, 0.25);
        vec3 col = mix(sand, pale, smoothstep(0.4, 1.0, vTint));
        col = mix(col, ember, step(0.93, vTint));
        gl_FragColor = vec4(col, a * vAlpha * uOpacity);
      }
    `,
  });

  scene.add(new THREE.Points(geometry, material));

  // ---- pointer: repel + gust ----
  const target = new THREE.Vector2(9, 9);
  let gust = 0;
  let lastX = null;
  let lastT = 0;
  function onMove(e) {
    const p = pointerNDC(e, canvas);
    if (!p.inside) {
      target.set(9, 9);
      return;
    }
    target.set(p.x, p.y);
    const now = performance.now();
    if (lastX !== null && now > lastT) {
      const v = Math.abs(p.x - lastX) / ((now - lastT) / 1000);
      gust = Math.min(gust + v * 0.04, 2.2);
    }
    lastX = p.x;
    lastT = now;
    stage.invalidate();
  }
  function onLeave() {
    target.set(9, 9);
    lastX = null;
  }
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);

  stage.setRender((dt, elapsed) => {
    gust *= Math.pow(0.12, dt);
    uniforms.uWind.value += dt * (0.32 + gust);
    uniforms.uTime.value = elapsed;
    const m = uniforms.uMouse.value;
    const k = dt === 0 ? 1 : 1 - Math.pow(0.0015, dt);
    m.lerp(target, k);
    stage.renderer.render(scene, camera);
  });

  return {
    setPaused: (v) => stage.setPaused(v),
    setOpacity(v) {
      uniforms.uOpacity.value = v;
      stage.invalidate();
    },
    dispose() {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      geometry.dispose();
      material.dispose();
      stage.dispose();
    },
  };
}
