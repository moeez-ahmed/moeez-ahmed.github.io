import * as THREE from "three";
import { createStage, seeded } from "./stage.js";

/**
 * The living world behind the whole site: a desert at sunset that turns to night and back to dawn
 * as the visitor scrolls. The camera flies between "shots", one per section and chapter gate:
 *
 *   sky -> settlement (WAHM) -> tower (KingdomLand, Riyadh skyline) -> night (stars)
 *       -> oasis (Tamr Farm) -> caravan (Caravan of the Sands) -> finale
 *
 * getAnchors() returns [{ y, shot }] in page coordinates (the centre of each tagged element).
 */
export function mountWorld(canvas, { getAnchors, small = false } = {}) {
  const rand = seeded(2026);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.5, 2600);

  const stage = createStage(canvas, {
    alpha: false,
    antialias: !small,
    maxDPR: small ? 1.25 : 1.5,
    onResize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
  });
  const { renderer } = stage;
  renderer.setClearColor(0x17110d, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const disposables = [];
  const track = (o) => (disposables.push(o), o);
  const flat = (color, extra = {}) =>
    track(new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0, flatShading: true, ...extra }));

  // ---------------- Places ----------------
  const SETTLEMENT = new THREE.Vector3(0, 0, -150);
  const CITY = new THREE.Vector3(270, 0, -430);
  const OASIS = new THREE.Vector3(-230, 0, -340);
  const CARAVAN_Z = -40;
  const flats = [
    { x: SETTLEMENT.x, z: SETTLEMENT.z, r: 75, h: 3 },
    { x: CITY.x, z: CITY.z, r: 240, h: 2 },
    { x: OASIS.x, z: OASIS.z, r: 70, h: 1.5 },
  ];

  function rawHeight(x, z) {
    return (
      Math.sin(x * 0.011 + z * 0.006) * 9 +
      Math.sin(x * 0.004 - z * 0.009 + 1.7) * 14 +
      Math.sin(x * 0.027 + z * 0.019) * 3 +
      Math.sin(x * 0.06 - z * 0.045) * 0.9 +
      8
    );
  }
  function heightAt(x, z) {
    let h = rawHeight(x, z);
    for (const f of flats) {
      const d = Math.hypot(x - f.x, z - f.z);
      const k = THREE.MathUtils.smoothstep(d, f.r, f.r * 0.6);
      h = h * (1 - k) + f.h * k;
    }
    // a flatter trodden band where the caravan walks
    const band = THREE.MathUtils.smoothstep(Math.abs(z - CARAVAN_Z), 26, 8);
    return h * (1 - band * 0.6) + 3 * band * 0.6;
  }

  // ---------------- Sky, sun, moon, stars ----------------
  const PAL = {
    dusk: { top: 0x3b2546, horizon: 0xf0a35e, bottom: 0x6e4428, fog: 0xc28758, hemiSky: 0xffd9a8, hemiGround: 0x5a3a22 },
    night: { top: 0x04060e, horizon: 0x1c2138, bottom: 0x0e0b0a, fog: 0x15182a, hemiSky: 0x55669a, hemiGround: 0x0e0c10 },
  };
  const C = (hex) => new THREE.Color(hex);
  const pal = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([n, h]) => [n, C(h)]))]));
  const SUN_DIR = new THREE.Vector3(-0.38, 0.09, -1).normalize();
  const MOON_DIR = new THREE.Vector3(0.5, 0.42, -1).normalize();

  const skyU = {
    uTop: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() },
    uBottom: { value: new THREE.Color() },
    uSunDir: { value: SUN_DIR },
    uMoonDir: { value: MOON_DIR },
    uNight: { value: 0 },
  };
  const sky = new THREE.Mesh(
    track(new THREE.SphereGeometry(2000, 32, 16)),
    track(
      new THREE.ShaderMaterial({
        uniforms: skyU,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = position;
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop, uHorizon, uBottom, uSunDir, uMoonDir;
          uniform float uNight;
          varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            float h = d.y;
            vec3 col = h > 0.0
              ? mix(uHorizon, uTop, pow(smoothstep(0.0, 0.55, h), 0.75))
              : mix(uHorizon, uBottom, smoothstep(0.0, -0.2, h));
            float s = max(dot(d, uSunDir), 0.0);
            col += vec3(1.0, 0.72, 0.42) * (pow(s, 1400.0) * 5.0 + pow(s, 14.0) * 0.38) * (1.0 - uNight);
            float m = max(dot(d, uMoonDir), 0.0);
            col += vec3(0.86, 0.9, 1.0) * (smoothstep(0.99955, 0.99975, m) * 1.1 + pow(m, 80.0) * 0.1) * uNight;
            gl_FragColor = vec4(col, 1.0);
          }`,
      })
    )
  );
  sky.renderOrder = -1;
  scene.add(sky);

  const STAR_N = small ? 900 : 1800;
  const starPos = new Float32Array(STAR_N * 3);
  for (let i = 0; i < STAR_N; i++) {
    const u = rand();
    const v = 0.08 + rand() * 0.92; // keep stars above the horizon
    const th = u * Math.PI * 2;
    const ph = Math.acos(1 - v);
    starPos.set([Math.sin(ph) * Math.cos(th) * 1500, Math.cos(ph) * 1500, Math.sin(ph) * Math.sin(th) * 1500], i * 3);
  }
  const starGeo = track(new THREE.BufferGeometry());
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const starMat = track(new THREE.PointsMaterial({ color: 0xffffff, size: small ? 1.6 : 1.8, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }));
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  scene.fog = new THREE.Fog(0xc28758, 220, 1500);

  // ---------------- Lights ----------------
  const hemi = new THREE.HemisphereLight(0xffd9a8, 0x5a3a22, 1.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffb877, 2.6);
  sun.position.set(SUN_DIR.x * 600, 180, SUN_DIR.z * 600); // light comes from the low sun ahead
  scene.add(sun);
  const moon = new THREE.DirectionalLight(0x9fb4ff, 0);
  moon.position.copy(MOON_DIR).multiplyScalar(600);
  scene.add(moon);

  // ---------------- Terrain ----------------
  const SEG = small ? 110 : 170;
  let tg = new THREE.PlaneGeometry(2600, 2600, SEG, SEG);
  tg.rotateX(-Math.PI / 2);
  const tp = tg.attributes.position;
  for (let i = 0; i < tp.count; i++) tp.setY(i, heightAt(tp.getX(i), tp.getZ(i)));
  tg = tg.toNonIndexed();
  tg.computeVertexNormals();
  const tpos = tg.attributes.position;
  const tcol = new Float32Array(tpos.count * 3);
  const lo = C(0xb87a42);
  const hi = C(0xe6b77e);
  const path = C(0x9c6a3a);
  const col = new THREE.Color();
  for (let i = 0; i < tpos.count; i += 3) {
    const y = (tpos.getY(i) + tpos.getY(i + 1) + tpos.getY(i + 2)) / 3;
    const z = (tpos.getZ(i) + tpos.getZ(i + 1) + tpos.getZ(i + 2)) / 3;
    col.copy(lo).lerp(hi, THREE.MathUtils.clamp(y / 30 + (rand() - 0.5) * 0.12, 0, 1));
    if (Math.abs(z - CARAVAN_Z) < 7) col.lerp(path, 0.4);
    for (let k = 0; k < 3; k++) col.toArray(tcol, (i + k) * 3);
  }
  tg.setAttribute("color", new THREE.BufferAttribute(tcol, 3));
  track(tg);
  scene.add(new THREE.Mesh(tg, flat(0xffffff, { vertexColors: true, roughness: 1 })));

  // distant mesas on the horizon
  const mesaMat = flat(0x7a4a2b);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rand() * 0.2;
    const r = 760 + rand() * 360;
    const h = 50 + rand() * 110;
    const rad = 40 + rand() * 90;
    const m = new THREE.Mesh(track(new THREE.CylinderGeometry(rad * 0.7, rad, h, 7)), mesaMat);
    m.position.set(Math.cos(a) * r, h / 2 - 4, Math.sin(a) * r - 300);
    scene.add(m);
  }

  // ---------------- WAHM: the walled settlement ----------------
  const mud = flat(0xc4925a);
  const mudDark = flat(0xa8743f);
  const doorM = flat(0x3b2516);
  const glowMat = track(new THREE.MeshStandardMaterial({ color: 0xffb35c, emissive: 0xe0782f, emissiveIntensity: 1.5 }));
  {
    const g = new THREE.Group();
    g.position.copy(SETTLEMENT).setY(heightAt(SETTLEMENT.x, SETTLEMENT.z));
    g.rotation.y = 0.3;
    const S = 80;
    const H = 9;
    const crenelGeo = track(new THREE.BoxGeometry(2.4, 2, 2.6));
    for (let side = 0; side < 4; side++) {
      const wall = new THREE.Group();
      wall.rotation.y = (side * Math.PI) / 2;
      const seg = new THREE.Mesh(track(new THREE.BoxGeometry(S, H, 2.6)), mud);
      seg.position.set(0, H / 2, S / 2);
      wall.add(seg);
      for (let x = -S / 2 + 2; x <= S / 2 - 1; x += 5) {
        const cr = new THREE.Mesh(crenelGeo, mud);
        cr.position.set(x, H + 1, S / 2);
        wall.add(cr);
      }
      if (side === 0) {
        const gate = new THREE.Mesh(track(new THREE.BoxGeometry(9, 7, 0.6)), doorM);
        gate.position.set(0, 3.5, S / 2 + 1.4);
        wall.add(gate);
        for (const sx of [-7, 7]) {
          const lamp = new THREE.Mesh(track(new THREE.SphereGeometry(0.9, 10, 8)), glowMat);
          lamp.position.set(sx, 8, S / 2 + 1.8);
          wall.add(lamp);
        }
      }
      g.add(wall);
    }
    for (let i = 0; i < 16; i++) {
      const w = 8 + rand() * 9;
      const d = 8 + rand() * 9;
      const h = 6 + rand() * 9;
      const x = (rand() - 0.5) * (S - 22);
      const z = (rand() - 0.5) * (S - 22);
      const house = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), i % 3 ? mud : mudDark);
      house.position.set(x, h / 2, z);
      g.add(house);
      if (i % 4 === 0) {
        const lit = new THREE.Mesh(track(new THREE.BoxGeometry(1.6, 2.2, 0.3)), glowMat);
        lit.position.set(x, 2.5, z + d / 2 + 0.1);
        g.add(lit);
      }
    }
    const tower = new THREE.Mesh(track(new THREE.BoxGeometry(10, 30, 10)), mudDark);
    tower.position.set(S / 2 - 4, 15, -S / 2 + 4);
    g.add(tower);
    const brazier = new THREE.Mesh(track(new THREE.SphereGeometry(1.4, 10, 8)), glowMat);
    brazier.position.set(S / 2 - 4, 31.5, -S / 2 + 4);
    g.add(brazier);
    scene.add(g);
  }

  // ---------------- KingdomLand: the Riyadh skyline ----------------
  const winTex = (() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 128;
    const x = c.getContext("2d");
    x.fillStyle = "#000";
    x.fillRect(0, 0, 64, 128);
    for (let r = 0; r < 16; r++)
      for (let k = 0; k < 6; k++) {
        if (rand() < 0.42) {
          x.fillStyle = rand() < 0.8 ? "#ffcf8a" : "#cfe3ff";
          x.fillRect(4 + k * 10, 4 + r * 7.7, 6, 4);
        }
      }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return track(t);
  })();
  let cityGlow = null;
  const cityMat = track(
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, metalness: 0.1, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 0 })
  );
  {
    const N = small ? 34 : 60;
    const box = track(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0));
    const city = new THREE.InstancedMesh(box, cityMat, N);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const tones = [0xeadfc8, 0xd8c5a3, 0xc7b391, 0xb8a888, 0xdfe3e2].map(C);
    let placed = 0;
    let guard = 0;
    while (placed < N && guard++ < 2000) {
      const a = rand() * Math.PI * 2;
      const r = 45 + Math.pow(rand(), 0.8) * 200;
      const x = CITY.x + Math.cos(a) * r;
      const z = CITY.z + Math.sin(a) * r;
      const near = 1 - r / 250;
      const h = 18 + rand() * 50 + near * near * rand() * 160;
      const w = 12 + rand() * 18;
      m4.compose(new THREE.Vector3(x, heightAt(x, z) - 1, z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand() * 0.6), new THREE.Vector3(w, h, w * (0.7 + rand() * 0.6)));
      city.setMatrixAt(placed, m4);
      city.setColorAt(placed, tones[placed % tones.length]);
      placed++;
    }
    city.count = placed;
    scene.add(city);

    // the tower with its sky bridge
    const H = 300;
    const W = 38;
    const half = (y) => W * Math.pow(Math.max(0, 1 - Math.pow(y / H, 2.2)), 0.55) + 1.5;
    const shape = new THREE.Shape();
    shape.moveTo(-half(0), 0);
    for (let i = 0; i <= 30; i++) shape.lineTo(half((H * i) / 30), (H * i) / 30);
    for (let i = 30; i >= 0; i--) shape.lineTo(-half((H * i) / 30), (H * i) / 30);
    const hole = new THREE.Path();
    const y1 = 202;
    const y2 = 282;
    const inner = (y) => Math.max(0.8, half(y) - 6.5);
    hole.moveTo(-inner(y1), y1);
    for (let i = 0; i <= 14; i++) {
      const y = y1 + ((y2 - y1) * i) / 14;
      hole.lineTo(-inner(y) * (1 - Math.pow(i / 14, 6)), y);
    }
    for (let i = 14; i >= 0; i--) {
      const y = y1 + ((y2 - y1) * i) / 14;
      hole.lineTo(inner(y) * (1 - Math.pow(i / 14, 6)), y);
    }
    shape.holes.push(hole);
    const tGeo = track(new THREE.ExtrudeGeometry(shape, { depth: 30, bevelEnabled: false, curveSegments: 4 }));
    tGeo.translate(0, 0, -15);
    const glass = track(new THREE.MeshStandardMaterial({ color: 0xa9bcc4, roughness: 0.25, metalness: 0.55 }));
    const tower = new THREE.Mesh(tGeo, glass);
    tower.position.copy(CITY).setY(1);
    tower.rotation.y = -0.45;
    scene.add(tower);
    const bridgeMat = track(new THREE.MeshStandardMaterial({ color: 0xffc27e, emissive: 0xe0782f, emissiveIntensity: 0.6 }));
    const bridge = new THREE.Mesh(track(new THREE.BoxGeometry(26, 3.5, 20)), bridgeMat);
    bridge.position.set(0, 258, 0);
    tower.add(bridge);
    const beacon = new THREE.Mesh(track(new THREE.SphereGeometry(1.6, 10, 8)), track(new THREE.MeshBasicMaterial({ color: 0xff5a3c })));
    beacon.position.set(0, H + 3, 0);
    tower.add(beacon);
    cityGlow = { bridgeMat, beacon };
  }

  // ---------------- Tamr Farm: the oasis ----------------
  const trunkM = flat(0x6f4a2d);
  const leafA = flat(0x5f8f3a);
  const leafB = flat(0x47772c);
  const dateM = flat(0x7a3e1c);
  const trunkGeo = track(new THREE.CylinderGeometry(0.5, 1.0, 16, 6));
  const leafGeo = track(new THREE.ConeGeometry(1.4, 10, 4));
  const dateGeo = track(new THREE.SphereGeometry(1.1, 6, 5));
  function palm(x, z, s, lean) {
    const p = new THREE.Group();
    p.position.set(x, heightAt(x, z) - 0.3, z);
    p.scale.setScalar(s);
    p.rotation.set(lean, rand() * 6.28, -lean * 0.7);
    const trunk = new THREE.Mesh(trunkGeo, trunkM);
    trunk.position.y = 8;
    p.add(trunk);
    const crown = new THREE.Group();
    crown.position.y = 16;
    for (let k = 0; k < 8; k++) {
      const arm = new THREE.Group();
      arm.rotation.y = (k / 8) * Math.PI * 2;
      const leaf = new THREE.Mesh(leafGeo, k % 2 ? leafA : leafB);
      leaf.scale.set(1, 1, 0.3);
      leaf.position.set(0, 0, 4.4);
      leaf.rotation.x = Math.PI / 2 + 0.55;
      arm.add(leaf);
      crown.add(arm);
    }
    const dates = new THREE.Mesh(dateGeo, dateM);
    dates.position.set(0.6, -1, 0.4);
    crown.add(dates);
    p.add(crown);
    scene.add(p);
  }
  {
    const water = new THREE.Mesh(
      track(new THREE.CircleGeometry(26, 28)),
      track(new THREE.MeshStandardMaterial({ color: 0x3d9c94, roughness: 0.08, metalness: 0.25, emissive: 0x0b3c37, emissiveIntensity: 0.5 }))
    );
    water.rotation.x = -Math.PI / 2;
    water.position.copy(OASIS).setY(1.8);
    scene.add(water);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + rand() * 0.3;
      const r = 30 + rand() * 28;
      palm(OASIS.x + Math.cos(a) * r, OASIS.z + Math.sin(a) * r, 0.75 + rand() * 0.45, (rand() - 0.5) * 0.25);
    }
    // a few lone palms scattered across the dunes
    for (let i = 0; i < (small ? 8 : 16); i++) {
      const x = (rand() - 0.5) * 900;
      const z = -100 - rand() * 600;
      if (Math.hypot(x - CITY.x, z - CITY.z) < 260 || Math.hypot(x - SETTLEMENT.x, z - SETTLEMENT.z) < 90) continue;
      palm(x, z, 0.6 + rand() * 0.4, (rand() - 0.5) * 0.3);
    }
  }

  // ---------------- Caravan of the Sands: camels walking the dunes ----------------
  const camels = [];
  {
    const hide = flat(0xc08a50);
    const hideDark = flat(0xa4733f);
    const bags = [flat(0x8a3b2a), flat(0x2f5d6a), flat(0x6b4a8a)];
    const bodyGeo = track(new THREE.SphereGeometry(0.5, 9, 7));
    const humpGeo = track(new THREE.SphereGeometry(0.3, 8, 6));
    const neckGeo = track(new THREE.CylinderGeometry(0.08, 0.12, 0.75, 6));
    const headGeo = track(new THREE.BoxGeometry(0.38, 0.18, 0.18));
    const legGeo = track(new THREE.CylinderGeometry(0.055, 0.04, 0.8, 5));
    const bagGeo = track(new THREE.BoxGeometry(0.28, 0.22, 0.66));
    const riderGeo = track(new THREE.CylinderGeometry(0.1, 0.14, 0.42, 6));
    const headwrap = flat(0xe9dcc4);
    for (let n = 0; n < 7; n++) {
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
      const bag = new THREE.Mesh(bagGeo, bags[n % 3]);
      bag.position.set(0.22, 0.2, 0);
      camel.add(bag);
      if (n % 3 === 0) {
        const rider = new THREE.Mesh(riderGeo, headwrap);
        rider.position.set(0.2, 0.52, 0);
        camel.add(rider);
      }
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
      camel.scale.setScalar(4.2);
      scene.add(camel);
      camels.push({ camel, legs, offset: n * 11 });
    }
  }
  // the caravan crosses the same stretch of dunes on a loop, framed by the caravan shots
  const SPAN = 320;
  const START = -230;
  function caravanX(t, offset) {
    return START + ((((t * 2.6 - offset) % SPAN) + SPAN) % SPAN);
  }

  // ---------------- Drifting sand near the camera ----------------
  const SAND_N = small ? 500 : 1300;
  const sandBase = new Float32Array(SAND_N * 3);
  for (let i = 0; i < SAND_N; i++) sandBase.set([rand() * 320, rand() * 70, rand() * 320], i * 3);
  const sandPos = new Float32Array(SAND_N * 3);
  const sandGeo = track(new THREE.BufferGeometry());
  sandGeo.setAttribute("position", new THREE.BufferAttribute(sandPos, 3));
  const sandMat = track(new THREE.PointsMaterial({ color: 0xf0cf96, size: 0.9, transparent: true, opacity: 0.55, depthWrite: false }));
  scene.add(new THREE.Points(sandGeo, sandMat));

  // ---------------- Shots ----------------
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const SHOTS = {
    sky: { pos: V(0, 260, 420), look: V(-40, 70, -600), night: 0.04 },
    settlement: { pos: V(-60, 34, -38), look: V(0, 10, -150), night: 0.12 },
    "settlement-hold": { pos: V(-120, 70, -10), look: V(10, 4, -170), night: 0.2 },
    tower: { pos: V(110, 60, -220), look: V(270, 150, -430), night: 0.38 },
    "tower-hold": { pos: V(40, 130, -170), look: V(270, 110, -440), night: 0.5 },
    night: { pos: V(30, 140, -120), look: V(140, 560, -800), night: 1 },
    "night-hold": { pos: V(0, 150, -60), look: V(-140, 640, -820), night: 1 },
    oasis: { pos: V(-150, 30, -265), look: V(-230, 8, -340), night: 0.78 },
    "oasis-hold": { pos: V(-175, 55, -225), look: V(-232, 4, -345), night: 0.62 },
    caravan: { pos: V(-95, 20, 45), look: V(-40, 8, -40), night: 0.32 },
    "caravan-hold": { pos: V(-150, 46, 95), look: V(-20, 2, -50), night: 0.22 },
    finale: { pos: V(0, 120, 220), look: V(0, 220, -800), night: 1 },
  };
  const resolve = (name) => SHOTS[name] || SHOTS.sky;

  // ---------------- Pointer parallax ----------------
  const pointer = new THREE.Vector2();
  const pointerT = new THREE.Vector2();
  function onMove(e) {
    pointerT.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
  }
  addEventListener("pointermove", onMove, { passive: true });

  // ---------------- Frame ----------------
  const camPos = SHOTS.sky.pos.clone();
  const camLook = SHOTS.sky.look.clone();
  let night = SHOTS.sky.night;
  let first = true;
  const tPos = new THREE.Vector3();
  const tLook = new THREE.Vector3();
  const tmpC = new THREE.Color();
  const ss = (x) => x * x * (3 - 2 * x);

  stage.setRender((dt, t) => {
    // the caravan keeps walking whether or not it is on screen
    camels.forEach(({ camel, legs, offset }, i) => {
      const x = caravanX(t, offset);
      const z = CARAVAN_Z + Math.sin(x * 0.01 + i) * 2;
      camel.position.set(x, heightAt(x, z) + 0.95 * 4.2 + Math.abs(Math.sin(t * 2.6 + i)) * 0.15, z);
      camel.rotation.y = 0;
      legs.forEach(({ pivot, phase }) => (pivot.rotation.z = Math.sin(t * 2.6 + phase + i) * 0.38));
    });

    // where should the camera be for this scroll position?
    const anchors = getAnchors?.() || [];
    const c = scrollY + innerHeight / 2;
    let target;
    if (!anchors.length) target = resolve("sky");
    else if (c <= anchors[0].y) target = resolve(anchors[0].shot);
    else if (c >= anchors[anchors.length - 1].y) target = resolve(anchors[anchors.length - 1].shot);
    else {
      let i = 0;
      while (i < anchors.length - 2 && c > anchors[i + 1].y) i++;
      const a = resolve(anchors[i].shot);
      const b = resolve(anchors[i + 1].shot);
      const k = ss(THREE.MathUtils.clamp((c - anchors[i].y) / Math.max(1, anchors[i + 1].y - anchors[i].y), 0, 1));
      target = { pos: tPos.copy(a.pos).lerp(b.pos, k), look: tLook.copy(a.look).lerp(b.look, k), night: a.night + (b.night - a.night) * k };
    }
    const damp = first || dt === 0 ? 1 : 1 - Math.pow(0.06, dt);
    first = false;
    camPos.lerp(target.pos, damp);
    camLook.lerp(target.look, damp);
    night += (target.night - night) * damp;
    pointer.lerp(pointerT, dt === 0 ? 1 : 1 - Math.pow(0.05, dt));
    camera.position.set(camPos.x + pointer.x * 7, Math.max(camPos.y - pointer.y * 3.5, heightAt(camPos.x, camPos.z) + 6), camPos.z);
    camera.lookAt(camLook);

    // time of day
    skyU.uNight.value = night;
    skyU.uTop.value.copy(pal.dusk.top).lerp(pal.night.top, night).convertLinearToSRGB();
    skyU.uHorizon.value.copy(pal.dusk.horizon).lerp(pal.night.horizon, night).convertLinearToSRGB();
    skyU.uBottom.value.copy(pal.dusk.bottom).lerp(pal.night.bottom, night).convertLinearToSRGB();
    scene.fog.color.copy(pal.dusk.fog).lerp(pal.night.fog, night);
    hemi.color.copy(pal.dusk.hemiSky).lerp(pal.night.hemiSky, night);
    hemi.groundColor.copy(pal.dusk.hemiGround).lerp(pal.night.hemiGround, night);
    hemi.intensity = 1.1 - night * 0.72;
    sun.intensity = 2.6 * (1 - night);
    moon.intensity = 0.75 * night;
    starMat.opacity = THREE.MathUtils.smoothstep(night, 0.35, 0.9);
    cityMat.emissiveIntensity = THREE.MathUtils.smoothstep(night, 0.15, 0.6) * 1.6;
    cityGlow.bridgeMat.emissiveIntensity = 0.6 + night * 1.6;
    cityGlow.beacon.visible = Math.sin(t * 3) > -0.2;
    glowMat.emissiveIntensity = 1.2 + night * 2.2 + Math.sin(t * 7) * 0.15;
    sandMat.opacity = 0.55 * (1 - night * 0.6);
    tmpC.set(0xf0cf96).lerp(new THREE.Color(0x9fb0d8), night * 0.6);
    sandMat.color.copy(tmpC);

    sky.position.copy(camera.position);
    stars.position.copy(camera.position);

    // drifting sand around the camera
    for (let i = 0; i < SAND_N; i++) {
      const bx = sandBase[i * 3];
      const by = sandBase[i * 3 + 1];
      const bz = sandBase[i * 3 + 2];
      const x = ((((bx + t * 14) % 320) + 320) % 320) - 160;
      const z = ((((bz + t * 3) % 320) + 320) % 320) - 160;
      sandPos[i * 3] = camera.position.x + x;
      sandPos[i * 3 + 1] = Math.max(heightAt(camera.position.x + x, camera.position.z + z), 0) + by * 0.5 + Math.sin(t + i) * 0.6;
      sandPos[i * 3 + 2] = camera.position.z + z;
    }
    sandGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  });

  return {
    setPaused: (v) => stage.setPaused(v),
    dispose() {
      removeEventListener("pointermove", onMove);
      disposables.forEach((d) => d.dispose?.());
      stage.dispose();
    },
  };
}
