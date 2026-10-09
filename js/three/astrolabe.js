import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createStage, pointerNDC } from "./stage.js";

/**
 * A brass astrolabe. Each inner ring is one entry in SYSTEMS.
 * onHover(index) fires when the pointer moves onto a ring (or -1 when it leaves).
 */
export function mountAstrolabe(canvas, { rings = 6, still = false, onHover, onSelect } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 10.2);

  const stage = createStage(canvas, {
    maxDPR: 2,
    still,
    onResize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
  });
  const { renderer } = stage;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.environment = envTex;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffd2a0, 2.2);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0xe0782f, 18, 12, 2);
  rim.position.set(-3, -2, 2);
  scene.add(rim);

  const BRASS = new THREE.Color(0x9a7444);
  const HOT = new THREE.Color(0xffc27e);
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9974f, metalness: 0.92, roughness: 0.3 });
  const darkBrass = new THREE.MeshStandardMaterial({ color: 0x7a5530, metalness: 0.9, roughness: 0.42 });
  const disposables = [brass, darkBrass, envTex];
  const track = (o) => (disposables.push(o), o);

  const root = new THREE.Group();
  scene.add(root);

  // ---- Mater: the outer frame with degree ticks ----
  const outerR = 2.75;
  root.add(new THREE.Mesh(track(new THREE.TorusGeometry(outerR, 0.07, 24, 160)), brass));
  root.add(new THREE.Mesh(track(new THREE.TorusGeometry(outerR - 0.2, 0.016, 12, 160)), darkBrass));
  const tickGeo = track(new THREE.BoxGeometry(0.018, 1, 0.018));
  const ticks = new THREE.InstancedMesh(tickGeo, brass, 120);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const pos = new THREE.Vector3();
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    const long = i % 10 === 0;
    const len = long ? 0.16 : 0.07;
    const r = outerR - 0.1 - len / 2 + 0.03;
    pos.set(Math.cos(a) * r, Math.sin(a) * r, 0);
    q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a - Math.PI / 2);
    s.set(long ? 1.6 : 1, len, 1);
    ticks.setMatrixAt(i, m4.compose(pos, q, s));
  }
  root.add(ticks);

  // the hanging ring at the top
  const throne = new THREE.Mesh(track(new THREE.TorusGeometry(0.2, 0.045, 16, 48)), brass);
  throne.position.set(0, outerR + 0.24, 0);
  root.add(throne);

  // ---- Domain rings ----
  const ringGroup = new THREE.Group();
  root.add(ringGroup);
  const ringData = [];
  const hitTargets = [];
  const r0 = 2.25;
  const step = rings > 1 ? (r0 - 0.7) / (rings - 1) : 0;
  for (let i = 0; i < rings; i++) {
    const radius = r0 - i * step;
    const pivot = new THREE.Group();
    pivot.rotation.set(
      Math.sin(i * 1.7) * 0.9,
      Math.cos(i * 1.3) * 0.9,
      i * 0.6
    );
    const mat = track(
      new THREE.MeshStandardMaterial({ color: 0xc9974f, metalness: 0.9, roughness: 0.32, emissive: 0xe0782f, emissiveIntensity: 0 })
    );
    const ring = new THREE.Mesh(track(new THREE.TorusGeometry(radius, 0.03, 16, 140)), mat);
    pivot.add(ring);

    // a bead that travels around the ring
    const bead = new THREE.Mesh(track(new THREE.SphereGeometry(0.075, 20, 20)), mat);
    bead.position.set(radius, 0, 0);
    ring.add(bead);

    // an invisible, fatter ring that is easier to hover
    const hit = new THREE.Mesh(track(new THREE.TorusGeometry(radius, 0.13, 8, 64)), new THREE.MeshBasicMaterial());
    hit.visible = false;
    hit.userData.index = i;
    pivot.add(hit);
    hitTargets.push(hit);

    ringGroup.add(pivot);
    ringData.push({ pivot, ring, mat, base: pivot.rotation.clone(), speed: 0.12 + i * 0.035, dir: i % 2 ? -1 : 1, glow: 0 });
  }

  // ---- Rete: the star plate in the centre ----
  const star = new THREE.Shape();
  const points = 12;
  for (let i = 0; i <= points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 0.62 : 0.3;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) star.moveTo(x, y);
    else star.lineTo(x, y);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.16, 0, Math.PI * 2, true);
  star.holes.push(hole);
  const rete = new THREE.Mesh(
    track(new THREE.ExtrudeGeometry(star, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2 })),
    darkBrass
  );
  rete.position.z = -0.03;
  root.add(rete);

  const core = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.12, 32, 32)),
    track(new THREE.MeshStandardMaterial({ color: 0x2a1408, emissive: 0xe0782f, emissiveIntensity: 1.6, roughness: 0.4 }))
  );
  root.add(core);

  // the alidade: a long pointer across the face
  const alidade = new THREE.Group();
  const bar = new THREE.Mesh(track(new THREE.BoxGeometry(outerR * 1.9, 0.05, 0.03)), brass);
  alidade.add(bar);
  for (const sx of [-1, 1]) {
    const tip = new THREE.Mesh(track(new THREE.ConeGeometry(0.06, 0.22, 4)), brass);
    tip.rotation.z = (sx * -Math.PI) / 2;
    tip.position.x = sx * outerR * 0.95;
    alidade.add(tip);
  }
  alidade.position.z = 0.06;
  root.add(alidade);

  // ---- Interaction ----
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const tilt = new THREE.Vector2();
  const tiltTarget = new THREE.Vector2();
  let hovered = -1;
  let active = 0;

  function pick(e) {
    const p = pointerNDC(e, canvas);
    ndc.set(p.x, p.y);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(hitTargets, false);
    return hits.length ? hits[0].object.userData.index : -1;
  }
  function onMove(e) {
    const p = pointerNDC(e, canvas);
    tiltTarget.set(p.y * 0.25, p.x * 0.35);
    const idx = pick(e);
    if (idx !== hovered) {
      hovered = idx;
      canvas.classList.toggle("is-pointer", idx >= 0);
      if (idx >= 0) onHover?.(idx);
    }
    stage.invalidate();
  }
  function onLeave() {
    tiltTarget.set(0, 0);
    hovered = -1;
    canvas.classList.remove("is-pointer");
    stage.invalidate();
  }
  function onClick(e) {
    const idx = pick(e);
    if (idx >= 0) onSelect?.(idx);
  }
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("click", onClick);

  root.rotation.set(-0.35, 0.45, 0);

  stage.setRender((dt, t) => {
    const k = dt === 0 ? 1 : 1 - Math.pow(0.02, dt);
    tilt.lerp(tiltTarget, k);
    root.rotation.x = -0.35 + tilt.x + Math.sin(t * 0.25) * 0.05;
    root.rotation.y = 0.45 + tilt.y + Math.cos(t * 0.2) * 0.06;

    ringData.forEach((d, i) => {
      d.ring.rotation.z = t * d.speed * d.dir;
      d.pivot.rotation.x = d.base.x + Math.sin(t * 0.3 + i) * 0.12;
      d.pivot.rotation.y = d.base.y + Math.cos(t * 0.27 + i * 0.7) * 0.12;
      const goal = i === active ? 1 : i === hovered ? 0.45 : 0;
      d.glow += (goal - d.glow) * (dt === 0 ? 1 : 1 - Math.pow(0.004, dt));
      d.mat.emissiveIntensity = d.glow * 2.2;
      d.mat.color.lerpColors(BRASS, HOT, d.glow);
    });
    alidade.rotation.z = t * 0.08;
    rete.rotation.z = -t * 0.05;
    core.material.emissiveIntensity = 1.4 + Math.sin(t * 2) * 0.25;
    renderer.render(scene, camera);
  });

  return {
    setActive(i) {
      active = i;
      stage.invalidate();
      if (still) {
        // snap glow so a single frame shows the change
        ringData.forEach((d, j) => (d.glow = j === i ? 1 : 0));
      }
    },
    dispose() {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
      disposables.forEach((d) => d.dispose?.());
      stage.dispose();
    },
  };
}
