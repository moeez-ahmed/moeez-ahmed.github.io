import * as THREE from "three";
import { createStage, pointerNDC, seeded } from "./stage.js";

/**
 * A floating desert island with one landmark from each world Moeez builds:
 *   - a mud-brick settlement (WAHM)
 *   - a Riyadh skyline tower (KingdomLand)
 *   - date palms around an oasis (Tamr Farm)
 *   - a camel caravan walking the island's rim (Caravan of the Sands)
 *
 * landmarks: { settlement, tower, oasis, caravan } -> { id, label, sub } (any may be missing)
 * onHover({ label, sub, x, y }) or onHover(null); onSelect(projectId)
 * Drag to turn the island; it turns slowly on its own otherwise.
 */
export function mountDiorama(canvas, { still = false, landmarks = {}, onHover, onSelect } = {}) {
  const rand = seeded(1406);
  const R = 9; // island radius
  const TARGET = new THREE.Vector3(0, 1.2, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 300);
  let dist = 32;
  let yaw = 0.75;
  let pitch = 0.52;

  function fit() {
    const vHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const hHalf = vHalf * camera.aspect;
    dist = Math.max((R * 1.0) / hHalf, 6.6 / vHalf);
  }

  const stage = createStage(canvas, {
    maxDPR: 2,
    still,
    onResize(w, h) {
      camera.aspect = w / h;
      fit();
      camera.updateProjectionMatrix();
    },
  });
  const { renderer } = stage;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const disposables = [];
  const track = (o) => (disposables.push(o), o);
  const mat = (color, extra = {}) =>
    track(new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true, ...extra }));

  // ---------------- Lights ----------------
  scene.add(new THREE.HemisphereLight(0xffe7c4, 0x3a2416, 1.15));
  const sun = new THREE.DirectionalLight(0xffcf94, 2.6);
  sun.position.set(-14, 22, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 70 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xe0782f, 0.9);
  rim.position.set(12, 6, -14);
  scene.add(rim);

  // ---------------- Landmark positions ----------------
  const SETTLEMENT = new THREE.Vector2(-3.5, -2.0);
  const TOWER = new THREE.Vector2(3.7, -2.5);
  const OASIS = new THREE.Vector2(0.6, 3.6);
  const CARAVAN_R = 7.15;
  const flats = [
    { p: SETTLEMENT, r: 2.9, h: 0.55 },
    { p: TOWER, r: 2.3, h: 0.5 },
    { p: OASIS, r: 2.4, h: 0.35 },
  ];

  function rawHeight(x, z) {
    const r = Math.hypot(x, z) / R;
    const fall = Math.max(0, 1 - Math.pow(r, 4));
    const dunes =
      Math.sin(x * 0.55 + z * 0.25) * 0.55 +
      Math.sin(x * 0.21 - z * 0.48 + 1.3) * 0.7 +
      Math.sin(x * 1.1 + z * 0.9) * 0.14;
    return (dunes * 0.6 + 0.85) * fall;
  }
  function heightAt(x, z) {
    let h = rawHeight(x, z);
    for (const f of flats) {
      const d = Math.hypot(x - f.p.x, z - f.p.y);
      const k = THREE.MathUtils.smoothstep(d, f.r, f.r * 0.55); // 1 inside, 0 outside
      h = h * (1 - k) + f.h * k;
    }
    return h;
  }

  // ---------------- Terrain (low-poly dunes) ----------------
  let terrainGeo = new THREE.PlaneGeometry(2 * R, 2 * R, 70, 70);
  terrainGeo.rotateX(-Math.PI / 2);
  const tp = terrainGeo.attributes.position;
  for (let i = 0; i < tp.count; i++) {
    let x = tp.getX(i);
    let z = tp.getZ(i);
    const r = Math.hypot(x, z);
    if (r > R) {
      x *= R / r;
      z *= R / r;
      tp.setXYZ(i, x, 0, z);
    } else {
      tp.setY(i, heightAt(x, z));
    }
  }
  terrainGeo = terrainGeo.toNonIndexed();
  terrainGeo.computeVertexNormals();
  const tpos = terrainGeo.attributes.position;
  const tcol = new Float32Array(tpos.count * 3);
  const sandLo = new THREE.Color(0xc98d4f);
  const sandHi = new THREE.Color(0xe9c08a);
  const trodden = new THREE.Color(0xa9733f);
  const c = new THREE.Color();
  for (let i = 0; i < tpos.count; i += 3) {
    const cx = (tpos.getX(i) + tpos.getX(i + 1) + tpos.getX(i + 2)) / 3;
    const cy = (tpos.getY(i) + tpos.getY(i + 1) + tpos.getY(i + 2)) / 3;
    const cz = (tpos.getZ(i) + tpos.getZ(i + 1) + tpos.getZ(i + 2)) / 3;
    c.copy(sandLo).lerp(sandHi, THREE.MathUtils.clamp(cy / 1.5 + (rand() - 0.5) * 0.18, 0, 1));
    const onPath = Math.abs(Math.hypot(cx, cz) - CARAVAN_R) < 0.38;
    if (onPath) c.lerp(trodden, 0.45);
    for (let k = 0; k < 3; k++) c.toArray(tcol, (i + k) * 3);
  }
  terrainGeo.setAttribute("color", new THREE.BufferAttribute(tcol, 3));
  track(terrainGeo);
  const terrain = new THREE.Mesh(terrainGeo, mat(0xffffff, { vertexColors: true }));
  terrain.receiveShadow = true;
  scene.add(terrain);

  // island body: two strata of sandstone under the dunes
  const strata1 = new THREE.Mesh(track(new THREE.CylinderGeometry(R, R * 0.84, 2.4, 56, 2)), mat(0xb27a43));
  strata1.position.y = -1.2;
  const strata2 = new THREE.Mesh(track(new THREE.CylinderGeometry(R * 0.84, R * 0.42, 3.2, 56, 2)), mat(0x7e522e));
  strata2.position.y = -4.0;
  const tip = new THREE.Mesh(track(new THREE.ConeGeometry(R * 0.42, 2.6, 40)), mat(0x5c3a20));
  tip.rotation.x = Math.PI;
  tip.position.y = -6.9;
  strata1.receiveShadow = true;
  scene.add(strata1, strata2, tip);

  // ---------------- Landmarks ----------------
  const groups = []; // { key, group, mats: [{ m, base, baseI }], anchor }
  function landmark(key, build, anchorY) {
    const info = landmarks[key];
    const g = new THREE.Group();
    const mats = [];
    const lm = (color, extra) => {
      const m = mat(color, extra);
      mats.push({ m, base: m.emissive.clone(), baseI: m.emissiveIntensity });
      return m;
    };
    build(g, lm);
    g.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.userData.key = key;
      }
    });
    scene.add(g);
    groups.push({ key, group: g, mats, info, anchorY });
    return g;
  }

  // --- WAHM: walled mud-brick settlement with a watchtower
  landmark(
    "settlement",
    (g, lm) => {
      const mud = lm(0xc4925a);
      const mudDark = lm(0xa8743f);
      const y0 = heightAt(SETTLEMENT.x, SETTLEMENT.y);
      g.position.set(SETTLEMENT.x, y0, SETTLEMENT.y);
      g.rotation.y = 0.35;
      const S = 4.2;
      const wallH = 0.75;
      const wallT = 0.22;
      const wallGeo = track(new THREE.BoxGeometry(S, wallH, wallT));
      const crenel = track(new THREE.BoxGeometry(0.2, 0.18, wallT));
      for (let side = 0; side < 4; side++) {
        const wall = new THREE.Group();
        wall.rotation.y = (side * Math.PI) / 2;
        const seg = new THREE.Mesh(wallGeo, mud);
        seg.position.set(0, wallH / 2, S / 2);
        wall.add(seg);
        for (let x = -S / 2 + 0.15; x <= S / 2 - 0.1; x += 0.42) {
          const cr = new THREE.Mesh(crenel, mud);
          cr.position.set(x, wallH + 0.09, S / 2);
          wall.add(cr);
        }
        if (side === 0) {
          const gate = new THREE.Mesh(track(new THREE.BoxGeometry(0.7, 0.55, 0.06)), lm(0x3b2516));
          gate.position.set(0, 0.28, S / 2 + 0.12);
          wall.add(gate);
          for (const sx of [-0.55, 0.55]) {
            const lamp = new THREE.Mesh(track(new THREE.SphereGeometry(0.07, 8, 6)), lm(0xffb35c, { emissive: 0xe0782f, emissiveIntensity: 1.8 }));
            lamp.position.set(sx, 0.62, S / 2 + 0.16);
            wall.add(lamp);
          }
        }
        g.add(wall);
      }
      const houses = [
        [-1.1, -0.9, 1.1, 0.9, 0.9],
        [0.4, -1.1, 0.9, 1.3, 0.8],
        [1.2, 0.2, 0.8, 0.7, 1.0],
        [-0.9, 0.6, 1.0, 1.0, 0.9],
        [0.3, 0.9, 0.7, 0.8, 0.7],
      ];
      houses.forEach(([x, z, h, w, d], i) => {
        const m = i % 2 ? mudDark : mud;
        const hs = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), m);
        hs.position.set(x, h / 2, z);
        g.add(hs);
        const door = new THREE.Mesh(track(new THREE.BoxGeometry(0.18, 0.3, 0.02)), lm(0x3b2516));
        door.position.set(x, 0.15, z + d / 2 + 0.01);
        g.add(door);
      });
      // a second storey on the biggest house
      const upper = new THREE.Mesh(track(new THREE.BoxGeometry(0.6, 0.5, 0.55)), mud);
      upper.position.set(0.4, 1.55, -1.1);
      g.add(upper);
      // watchtower in the corner
      const tower = new THREE.Mesh(track(new THREE.BoxGeometry(0.8, 2.3, 0.8)), mudDark);
      tower.position.set(S / 2 - 0.25, 1.15, -S / 2 + 0.25);
      g.add(tower);
      for (let i = 0; i < 4; i++) {
        const cr = new THREE.Mesh(crenel, mudDark);
        const a = (i * Math.PI) / 2;
        cr.position.set(S / 2 - 0.25 + Math.sin(a) * 0.32, 2.38, -S / 2 + 0.25 + Math.cos(a) * 0.32);
        cr.rotation.y = a;
        g.add(cr);
      }
    },
    2.6
  );

  // --- KingdomLand: Riyadh tower with its sky bridge, and a few city blocks
  landmark(
    "tower",
    (g, lm) => {
      const y0 = heightAt(TOWER.x, TOWER.y);
      g.position.set(TOWER.x, y0, TOWER.y);
      g.rotation.y = -0.5;
      const H = 7.4;
      const W = 0.95;
      const half = (y) => W * Math.pow(Math.max(0, 1 - Math.pow(y / H, 2.2)), 0.55) + 0.04;
      const shape = new THREE.Shape();
      shape.moveTo(-half(0), 0);
      for (let i = 0; i <= 24; i++) {
        const y = (H * i) / 24;
        shape.lineTo(half(y), y);
      }
      for (let i = 24; i >= 0; i--) {
        const y = (H * i) / 24;
        shape.lineTo(-half(y), y);
      }
      // the opening near the top
      const hole = new THREE.Path();
      const y1 = 5.0;
      const y2 = 6.95;
      const inner = (y) => Math.max(0.02, half(y) - 0.17);
      hole.moveTo(-inner(y1), y1);
      for (let i = 0; i <= 12; i++) {
        const y = y1 + ((y2 - y1) * i) / 12;
        hole.lineTo(-inner(y) * (1 - Math.pow(i / 12, 6)), y);
      }
      for (let i = 12; i >= 0; i--) {
        const y = y1 + ((y2 - y1) * i) / 12;
        hole.lineTo(inner(y) * (1 - Math.pow(i / 12, 6)), y);
      }
      shape.holes.push(hole);
      const geo = track(new THREE.ExtrudeGeometry(shape, { depth: 0.8, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1, curveSegments: 4 }));
      geo.translate(0, 0, -0.4);
      const glass = lm(0xc3d0d4, { roughness: 0.28, metalness: 0.35, flatShading: false });
      g.add(new THREE.Mesh(geo, glass));
      const bridge = new THREE.Mesh(track(new THREE.BoxGeometry(0.7, 0.09, 0.5)), lm(0xffc27e, { emissive: 0xe0782f, emissiveIntensity: 1.4 }));
      bridge.position.set(0, 6.35, 0);
      g.add(bridge);
      const blockMats = [lm(0xeadfc8), lm(0xd8c5a3), lm(0xbfa784)];
      const blocks = [
        [-1.4, -0.4, 1.4], [-1.3, 0.9, 0.8], [1.3, -0.6, 1.1], [1.4, 0.7, 1.7],
        [0.1, 1.5, 0.7], [-0.3, -1.6, 1.0], [1.0, -1.5, 0.6], [-1.6, -1.4, 0.5],
      ];
      blocks.forEach(([x, z, h], i) => {
        const b = new THREE.Mesh(track(new THREE.BoxGeometry(0.75, h, 0.75)), blockMats[i % 3]);
        b.position.set(x, h / 2, z);
        g.add(b);
      });
    },
    7.8
  );

  // --- Tamr Farm: date palms around an oasis, with crop rows
  landmark(
    "oasis",
    (g, lm) => {
      const y0 = heightAt(OASIS.x, OASIS.y);
      g.position.set(OASIS.x, y0, OASIS.y);
      const water = new THREE.Mesh(
        track(new THREE.CircleGeometry(1.15, 20)),
        lm(0x4fb0a6, { roughness: 0.12, metalness: 0.1, emissive: 0x0d3c37, emissiveIntensity: 0.6, flatShading: false })
      );
      water.rotation.x = -Math.PI / 2;
      water.position.y = 0.04;
      water.receiveShadow = true;
      g.add(water);
      const trunkM = lm(0x7a5434);
      const leafA = lm(0x5f8f3a);
      const leafB = lm(0x4a7a2e);
      const dateM = lm(0x7a3e1c);
      const trunkGeo = track(new THREE.CylinderGeometry(0.06, 0.12, 1.9, 6));
      const leafGeo = track(new THREE.ConeGeometry(0.16, 1.15, 4));
      const dateGeo = track(new THREE.SphereGeometry(0.13, 6, 5));
      const palms = [
        [-1.6, -0.4, 1.0, 0.12], [-1.2, 1.1, 1.15, -0.1], [0.3, 1.6, 0.9, 0.08],
        [1.6, 0.6, 1.2, -0.14], [1.4, -1.1, 0.95, 0.1], [-0.2, -1.6, 1.05, -0.06],
      ];
      palms.forEach(([x, z, s, lean], i) => {
        const palm = new THREE.Group();
        palm.position.set(x, 0, z);
        palm.scale.setScalar(s);
        palm.rotation.set(lean, (i * 1.3) % 6.28, -lean);
        const trunk = new THREE.Mesh(trunkGeo, trunkM);
        trunk.position.y = 0.95;
        palm.add(trunk);
        const crown = new THREE.Group();
        crown.position.y = 1.9;
        for (let k = 0; k < 7; k++) {
          const leaf = new THREE.Mesh(leafGeo, k % 2 ? leafA : leafB);
          leaf.scale.set(1, 1, 0.35);
          leaf.position.set(0, 0, 0.5);
          const arm = new THREE.Group();
          arm.rotation.y = (k / 7) * Math.PI * 2;
          leaf.rotation.x = Math.PI / 2 + 0.55;
          arm.add(leaf);
          crown.add(arm);
        }
        const dates = new THREE.Mesh(dateGeo, dateM);
        dates.position.set(0.08, -0.12, 0.05);
        crown.add(dates);
        palm.add(crown);
        g.add(palm);
      });
      const rowM = lm(0x8fa64a);
      for (let r = 0; r < 4; r++) {
        const row = new THREE.Mesh(track(new THREE.BoxGeometry(1.5, 0.12, 0.16)), rowM);
        row.position.set(2.6, 0.06, -0.6 + r * 0.38);
        row.rotation.y = 0.2;
        g.add(row);
      }
    },
    2.5
  );

  // --- Caravan of the Sands: camels walking the rim
  const camels = [];
  landmark(
    "caravan",
    (g, lm) => {
      const hide = lm(0xc08a50);
      const hideDark = lm(0xa4733f);
      const bagA = lm(0x8a3b2a);
      const bagB = lm(0x2f5d6a);
      const bodyGeo = track(new THREE.SphereGeometry(0.5, 9, 7));
      const humpGeo = track(new THREE.SphereGeometry(0.3, 8, 6));
      const neckGeo = track(new THREE.CylinderGeometry(0.08, 0.12, 0.75, 6));
      const headGeo = track(new THREE.BoxGeometry(0.38, 0.18, 0.18));
      const legGeo = track(new THREE.CylinderGeometry(0.055, 0.04, 0.8, 5));
      const bagGeo = track(new THREE.BoxGeometry(0.28, 0.22, 0.66));
      for (let n = 0; n < 4; n++) {
        const camel = new THREE.Group();
        const body = new THREE.Mesh(bodyGeo, hide);
        body.scale.set(1.15, 0.62, 0.58);
        camel.add(body);
        const hump = new THREE.Mesh(humpGeo, hide);
        hump.scale.set(1, 0.85, 0.9);
        hump.position.set(-0.08, 0.36, 0);
        camel.add(hump);
        const neck = new THREE.Mesh(neckGeo, hide);
        neck.position.set(0.6, 0.32, 0);
        neck.rotation.z = -0.85;
        camel.add(neck);
        const head = new THREE.Mesh(headGeo, hideDark);
        head.position.set(0.9, 0.64, 0);
        camel.add(head);
        const bag = new THREE.Mesh(bagGeo, n % 2 ? bagB : bagA);
        bag.position.set(0.22, 0.2, 0);
        camel.add(bag);
        const legs = [];
        [[0.34, 0.17], [0.34, -0.17], [-0.34, 0.17], [-0.34, -0.17]].forEach(([x, z], k) => {
          const pivot = new THREE.Group();
          pivot.position.set(x, -0.15, z);
          const leg = new THREE.Mesh(legGeo, hideDark);
          leg.position.y = -0.4;
          pivot.add(leg);
          camel.add(pivot);
          legs.push({ pivot, phase: k === 0 || k === 3 ? 0 : Math.PI });
        });
        camel.scale.setScalar(0.62);
        g.add(camel);
        camels.push({ camel, legs, offset: -n * 0.24 });
      }
    },
    1.4
  );

  // ---------------- Drifting sand ----------------
  const SAND = 420;
  const sandPos = new Float32Array(SAND * 3);
  const sandSeed = [];
  for (let i = 0; i < SAND; i++) {
    const a = rand() * Math.PI * 2;
    const r = 2 + rand() * (R + 1.5);
    const y = 0.4 + rand() * 4.5;
    sandSeed.push({ a, r, y, s: 0.04 + rand() * 0.08 });
  }
  const sandGeo = track(new THREE.BufferGeometry());
  sandGeo.setAttribute("position", new THREE.BufferAttribute(sandPos, 3));
  const sand = new THREE.Points(
    sandGeo,
    track(new THREE.PointsMaterial({ color: 0xf0cf96, size: 0.07, transparent: true, opacity: 0.7, depthWrite: false }))
  );
  scene.add(sand);

  // ---------------- Interaction ----------------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pickables = [];
  groups.forEach((g) => g.info && g.group.traverse((o) => o.isMesh && pickables.push(o)));
  const EMBER = new THREE.Color(0xe0782f);
  let hovered = null;
  let dragging = false;
  let dragMoved = 0;
  let lastX = 0;
  let lastY = 0;
  let yawVel = 0;
  let idle = 0;

  function pick(e) {
    const p = pointerNDC(e, canvas);
    ndc.set(p.x, p.y);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    return hit ? groups.find((g) => g.key === hit.object.userData.key) : null;
  }
  const anchor = new THREE.Vector3();
  function report() {
    if (!hovered) {
      onHover?.(null);
      return;
    }
    hovered.group.getWorldPosition(anchor);
    anchor.y += hovered.anchorY;
    anchor.project(camera);
    onHover?.({
      label: hovered.info.label,
      sub: hovered.info.sub,
      x: ((anchor.x + 1) / 2) * canvas.clientWidth,
      y: ((1 - anchor.y) / 2) * canvas.clientHeight,
    });
  }
  function setHovered(g) {
    if (g === hovered) return;
    hovered = g;
    canvas.classList.toggle("is-pointer", !!g);
    report();
  }

  function onDown(e) {
    dragging = true;
    dragMoved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    yawVel = 0;
    canvas.setPointerCapture?.(e.pointerId);
    canvas.classList.add("is-dragging");
  }
  function onMove(e) {
    idle = 0;
    if (dragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      dragMoved += Math.abs(dx) + Math.abs(dy);
      yaw -= dx * 0.008;
      yawVel = -dx * 0.008;
      pitch = THREE.MathUtils.clamp(pitch + dy * 0.004, 0.3, 0.95);
      setHovered(null);
    } else if (e.pointerType === "mouse") {
      setHovered(pick(e));
    }
    stage.invalidate();
  }
  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove("is-dragging");
    if (dragMoved < 6) {
      const g = pick(e);
      if (g?.info?.id) onSelect?.(g.info.id);
      else if (e.pointerType !== "mouse") {
        setHovered(g);
      }
    }
  }
  function onLeave() {
    if (!dragging) setHovered(null);
  }
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onLeave);

  // ---------------- Frame ----------------
  stage.setRender((dt, t) => {
    // turn slowly by itself unless the visitor is interacting
    idle += dt;
    if (!dragging) {
      yawVel *= Math.pow(0.04, dt);
      yaw += yawVel;
      if (!hovered && idle > 1.2) yaw += dt * 0.07;
    }
    camera.position.set(
      TARGET.x + Math.sin(yaw) * Math.cos(pitch) * dist,
      TARGET.y + Math.sin(pitch) * dist,
      TARGET.z + Math.cos(yaw) * Math.cos(pitch) * dist
    );
    camera.lookAt(TARGET);

    // highlight the hovered landmark
    groups.forEach((g) => {
      const goal = g === hovered ? 1 : 0;
      g.glow = (g.glow ?? 0) + (goal - (g.glow ?? 0)) * (dt === 0 ? 1 : 1 - Math.pow(0.002, dt));
      g.mats.forEach(({ m, base, baseI }) => {
        m.emissive.copy(base).lerp(EMBER, g.glow * 0.55);
        m.emissiveIntensity = Math.max(baseI, g.glow * 0.6);
      });
    });

    // the caravan walks the rim
    camels.forEach(({ camel, legs, offset }) => {
      const a = t * 0.06 + offset;
      const x = Math.cos(a) * CARAVAN_R;
      const z = Math.sin(a) * CARAVAN_R;
      camel.position.set(x, heightAt(x, z) + 0.95 * 0.62 + Math.abs(Math.sin(t * 3 + offset * 9)) * 0.03, z);
      camel.rotation.y = -a - Math.PI / 2;
      legs.forEach(({ pivot, phase }) => (pivot.rotation.z = Math.sin(t * 3 + phase + offset * 9) * 0.38));
    });

    // drifting sand
    for (let i = 0; i < SAND; i++) {
      const s = sandSeed[i];
      const a = s.a + t * s.s * 0.6;
      sandPos[i * 3] = Math.cos(a) * s.r;
      sandPos[i * 3 + 1] = s.y + Math.sin(t * 0.5 + i) * 0.15;
      sandPos[i * 3 + 2] = Math.sin(a) * s.r;
    }
    sandGeo.attributes.position.needsUpdate = true;

    if (hovered) report();
    renderer.render(scene, camera);
  });

  return {
    dispose() {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      disposables.forEach((d) => d.dispose?.());
      stage.dispose();
    },
  };
}
