import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

const LOOP = 8.2;
const GREEN = 0x73ae4e;
const BG = 0xf5f7f1;

createOptionA(document.querySelector("#option-a"));
createOptionB(document.querySelector("#option-b"));

function createBaseScene(panel) {
  const stage = panel.querySelector(".panel-stage");
  const progress = panel.querySelector(".progress");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 8, 18);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.34, 8.6);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xc7d3bd, 1.65);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 3.7);
  key.position.set(-3.1, 5.4, 4.6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 18;
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.radius = 6;
  key.shadow.bias = -0.00008;
  scene.add(key);

  const rim = new THREE.PointLight(0xa6ef7b, 7.5, 12);
  rim.position.set(2.7, 2.8, 3.2);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 10),
    new THREE.ShadowMaterial({ color: 0x22321d, opacity: 0.18 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.45;
  floor.receiveShadow = true;
  scene.add(floor);

  const line = new THREE.Mesh(
    new THREE.BoxGeometry(5.8, 0.012, 0.012),
    new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.34 })
  );
  line.position.set(0, -2.438, 0.12);
  scene.add(line);

  const clock = new THREE.Clock();

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(rect.width, rect.height, false);
  };

  resize();
  new ResizeObserver(resize).observe(stage);

  return { panel, stage, scene, camera, renderer, progress, clock };
}

function createOptionA(panel) {
  const ctx = createBaseScene(panel);
  const letters = [...panel.querySelectorAll(".clay-letter")];
  const clayCircle = panel.querySelector(".clay-circle");
  const radius = 1.18;
  let lastSettledY = 0.42;

  const group = new THREE.Group();
  group.position.set(0, 0.42, 0);
  ctx.scene.add(group);

  const sphere = makeClaySphere(radius, 0);
  group.add(sphere.mesh, sphere.highlight, sphere.glow);

  const shadow = makeContactShadow();
  ctx.scene.add(shadow);

  const layout = [
    { x: -1.78, y: 0.03, r: -1.5 },
    { x: -0.86, y: 0.02, r: 1.0 },
    { x: -0.04, y: 0, r: 0 },
    { x: 0.58, y: 0.02, r: -1.0 },
    { x: 1.28, y: 0.03, r: 1.5 }
  ];

  const animate = () => {
    requestAnimationFrame(animate);
    const t = ctx.clock.getElapsedTime() % LOOP;
    ctx.progress.style.setProperty("--progress", (t / LOOP).toFixed(4));

    const gather = smoothstep(0.9, 2.85, t);
    const circleIn = smoothstep(2.0, 3.25, t);
    const logoOut = smoothstep(2.45, 3.35, t);
    const inflate = smoothstep(3.35, 4.85, t);
    const fallTime = Math.max(0, t - 4.85);

    ctx.camera.position.x = Math.sin(t * 0.55) * 0.05;
    ctx.camera.position.y = lerp(0.32, 0.54, inflate);
    ctx.camera.lookAt(0, -0.03, 0);

    const planar = 0.24 + circleIn * 0.76;
    const appear = smoothstep(0.04, 0.62, inflate);
    sphere.mesh.material.opacity = appear;
    sphere.highlight.material.opacity = smoothstep(0.24, 0.92, inflate) * 0.25;
    sphere.glow.material.opacity = smoothstep(0.18, 1, inflate) * 0.075;

    if (fallTime <= 0) {
      lastSettledY = lerp(0.42, 0.72, inflate);
      group.position.set(0, lastSettledY, 0);
      group.scale.set(planar, planar, Math.max(0.012, planar * smoothstep(0, 1, inflate)));
      shadow.material.opacity = appear * 0.05;
      shadow.scale.setScalar(0.55 + appear * 0.18);
    } else {
      const physics = dropMotion(fallTime, lastSettledY);
      group.position.set(0, physics.y, 0);
      group.scale.set(1 + physics.squashX, 1 + physics.squashY, 1 + physics.squashX);
      shadow.material.opacity = physics.shadow;
      shadow.scale.set(physics.shadowScale, physics.shadowScale * 0.42, 1);
    }

    group.rotation.y = inflate * 1.8 + fallTime * 1.3;
    group.rotation.x = Math.sin(t * 1.7) * 0.055 * inflate;

    letters.forEach((letter, index) => {
      const item = layout[index];
      const localGather = smoothstep(0, 1, gather - index * 0.045);
      const clayPulse = Math.sin(t * 7.2 + index * 1.7) * 0.08 * localGather * (1 - logoOut);
      const x = lerp(item.x * responsiveUnit(ctx.stage), (index - 2) * 4 * (1 - localGather), localGather);
      const y = lerp(item.y * responsiveUnit(ctx.stage), 0, localGather) + clayPulse * 15;
      const scale = lerp(1, 1.2 + clayPulse, localGather) * lerp(1, 0.8, logoOut);
      const opacity = 1 - smoothstep(0.62, 1, logoOut);
      letter.style.opacity = opacity.toFixed(3);
      letter.style.transform = `translate(-50%, -50%) translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${lerp(item.r, item.r * 0.18, localGather).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    });

    syncCircleToGroup(ctx, clayCircle, group, radius);
    clayCircle.style.opacity = (circleIn * (1 - smoothstep(0.16, 0.78, inflate))).toFixed(3);

    ctx.renderer.render(ctx.scene, ctx.camera);
  };

  animate();
}

function createOptionB(panel) {
  const ctx = createBaseScene(panel);
  const radius = 1.18;
  let lastSettledY = 0.46;
  let lettersReady = false;
  const textGroup = new THREE.Group();
  const orbGroup = new THREE.Group();
  const clayLumps = [];
  const textMeshes = [];

  ctx.scene.add(textGroup, orbGroup);

  const sphere = makeClaySphere(radius, 0);
  orbGroup.add(sphere.mesh, sphere.highlight, sphere.glow);

  const shadow = makeContactShadow();
  ctx.scene.add(shadow);

  const material = new THREE.MeshPhysicalMaterial({
    color: GREEN,
    roughness: 0.52,
    metalness: 0.01,
    clearcoat: 0.42,
    clearcoatRoughness: 0.38,
    transparent: true,
    opacity: 1
  });

  new FontLoader().load(
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json",
    (font) => {
      const chars = ["O", "N", "-", "I", "T"];
      const xs = [-1.55, -0.72, -0.02, 0.55, 1.14];
      chars.forEach((char, index) => {
        const geometry = new TextGeometry(char, {
          font,
          size: char === "-" ? 0.64 : 0.86,
          height: 0.2,
          curveSegments: 18,
          bevelEnabled: true,
          bevelThickness: 0.035,
          bevelSize: 0.028,
          bevelSegments: 8
        });
        geometry.center();
        const mesh = new THREE.Mesh(geometry, material.clone());
        mesh.userData.start = new THREE.Vector3(xs[index], char === "-" ? 0.01 : 0, 0);
        mesh.userData.rot = new THREE.Euler(-0.05, (index - 2) * 0.08, (index - 2) * 0.025);
        mesh.position.copy(mesh.userData.start);
        mesh.rotation.copy(mesh.userData.rot);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        textGroup.add(mesh);
        textMeshes.push(mesh);
      });

      for (let i = 0; i < 14; i++) {
        const lump = new THREE.Mesh(
          new THREE.SphereGeometry(0.18 + Math.random() * 0.12, 32, 32),
          material.clone()
        );
        const angle = (i / 14) * Math.PI * 2;
        lump.userData.start = new THREE.Vector3(Math.cos(angle) * (0.9 + Math.random() * 0.35), Math.sin(angle) * 0.34, (Math.random() - 0.5) * 0.18);
        lump.castShadow = true;
        lump.receiveShadow = true;
        lump.material.opacity = 0;
        textGroup.add(lump);
        clayLumps.push(lump);
      }

      lettersReady = true;
    }
  );

  const animate = () => {
    requestAnimationFrame(animate);
    const t = ctx.clock.getElapsedTime() % LOOP;
    ctx.progress.style.setProperty("--progress", (t / LOOP).toFixed(4));

    const merge = smoothstep(1.0, 3.15, t);
    const compress = smoothstep(2.35, 3.65, t);
    const orbIn = smoothstep(3.1, 4.55, t);
    const textOut = smoothstep(3.45, 4.55, t);
    const fallTime = Math.max(0, t - 4.85);

    ctx.camera.position.x = Math.sin(t * 0.54) * 0.06;
    ctx.camera.position.y = lerp(0.34, 0.56, orbIn);
    ctx.camera.lookAt(0, -0.04, 0);

    if (lettersReady) {
      textMeshes.forEach((mesh, index) => {
        const lag = index * 0.035;
        const m = smoothstep(0, 1, merge - lag);
        const c = smoothstep(0, 1, compress - lag);
        const wobble = Math.sin(t * 8 + index * 1.4) * 0.04 * m * (1 - textOut);
        mesh.position.set(
          lerp(mesh.userData.start.x, (index - 2) * 0.04, m),
          lerp(mesh.userData.start.y, 0, m) + wobble,
          lerp(mesh.userData.start.z, 0.03 * (index - 2), m)
        );
        mesh.rotation.set(
          lerp(mesh.userData.rot.x, -Math.PI * 0.42, c),
          lerp(mesh.userData.rot.y, 0, m),
          lerp(mesh.userData.rot.z, 0, m)
        );
        const scale = lerp(1, 0.52, c) * (1 + Math.sin(t * 9 + index) * 0.035 * m * (1 - textOut));
        mesh.scale.set(scale * lerp(1, 1.45, c), scale * lerp(1, 0.72, c), scale * lerp(1, 0.9, c));
        mesh.material.opacity = 1 - textOut;
      });

      clayLumps.forEach((lump, index) => {
        const c = smoothstep(0.05, 1, compress - index * 0.008);
        const out = smoothstep(0.2, 1, textOut);
        lump.position.lerpVectors(lump.userData.start, new THREE.Vector3(0, 0, 0), c);
        lump.scale.setScalar(lerp(0.25, 1.18, c) * lerp(1, 0.25, out));
        lump.material.opacity = c * (1 - out);
      });
    }

    const planar = lerp(0.18, 1, orbIn);
    sphere.mesh.material.opacity = smoothstep(0.1, 0.75, orbIn);
    sphere.highlight.material.opacity = smoothstep(0.42, 1, orbIn) * 0.25;
    sphere.glow.material.opacity = smoothstep(0.34, 1, orbIn) * 0.075;

    if (fallTime <= 0) {
      lastSettledY = lerp(0.46, 0.72, orbIn);
      orbGroup.position.set(0, lastSettledY, 0);
      orbGroup.scale.set(planar, planar, planar);
      shadow.material.opacity = smoothstep(0.1, 0.75, orbIn) * 0.05;
      shadow.scale.setScalar(0.55 + orbIn * 0.18);
    } else {
      const physics = dropMotion(fallTime, lastSettledY);
      orbGroup.position.set(0, physics.y, 0);
      orbGroup.scale.set(1 + physics.squashX, 1 + physics.squashY, 1 + physics.squashX);
      shadow.material.opacity = physics.shadow;
      shadow.scale.set(physics.shadowScale, physics.shadowScale * 0.42, 1);
    }

    textGroup.position.y = lerp(0.42, 0.68, compress);
    textGroup.rotation.y = Math.sin(t * 0.8) * 0.08 * (1 - textOut);
    orbGroup.rotation.y = orbIn * 1.8 + fallTime * 1.3;
    orbGroup.rotation.x = Math.sin(t * 1.7) * 0.055 * orbIn;

    ctx.renderer.render(ctx.scene, ctx.camera);
  };

  animate();
}

function makeClaySphere(radius, opacity) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 96, 96),
    new THREE.MeshPhysicalMaterial({
      color: GREEN,
      roughness: 0.48,
      metalness: 0.01,
      clearcoat: 0.58,
      clearcoatRoughness: 0.34,
      sheen: 0.48,
      sheenColor: new THREE.Color(0xcaf3b6),
      transparent: true,
      opacity
    })
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const highlight = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.005, 96, 96),
    new THREE.MeshBasicMaterial({
      color: 0xdff8d4,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  highlight.scale.set(0.24, 0.16, 0.24);
  highlight.position.set(-radius * 0.32, radius * 0.35, radius * 0.82);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.2, 96, 96),
    new THREE.MeshBasicMaterial({
      color: 0x9be56d,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide
    })
  );

  return { mesh, highlight, glow };
}

function makeContactShadow() {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.55, 96),
    new THREE.MeshBasicMaterial({
      color: 0x182318,
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -2.43;
  return shadow;
}

function syncCircleToGroup(ctx, circle, group, radius) {
  group.updateWorldMatrix(true, false);
  const center = new THREE.Vector3(0, 0, 0);
  const edge = new THREE.Vector3(radius, 0, 0);
  group.localToWorld(center);
  group.localToWorld(edge);

  const c = projectToPanel(ctx, center);
  const e = projectToPanel(ctx, edge);
  const r = Math.hypot(e.x - c.x, e.y - c.y);
  const d = Math.max(1, r * 2);

  circle.style.left = `${c.x.toFixed(2)}px`;
  circle.style.top = `${c.y.toFixed(2)}px`;
  circle.style.width = `${d.toFixed(2)}px`;
  circle.style.height = `${d.toFixed(2)}px`;
}

function projectToPanel(ctx, worldPosition) {
  const rect = ctx.stage.getBoundingClientRect();
  const ndc = worldPosition.clone().project(ctx.camera);
  return {
    x: (ndc.x * 0.5 + 0.5) * rect.width,
    y: (-ndc.y * 0.5 + 0.5) * rect.height
  };
}

function dropMotion(time, startY) {
  const floorY = -1.19;
  let y = startY - 0.5 * 4.8 * time * time;
  let squashX = 0;
  let squashY = 0;
  let shadow = 0.08;
  let shadowScale = 0.8;

  if (y <= floorY) {
    const impactAt = Math.sqrt(Math.max(0, (startY - floorY) * 2 / 4.8));
    const impact = time - impactAt;
    const bounce = Math.exp(-impact * 2.05) * Math.abs(Math.sin(impact * 9.4));
    const hit = Math.max(0, 1 - impact * 3.6) * Math.abs(Math.cos(impact * 9.4));
    y = floorY + bounce * 0.9;
    squashX = hit * 0.12;
    squashY = -hit * 0.15;
    shadow = 0.23 + (1 - Math.min(bounce, 1)) * 0.12;
    shadowScale = 1.02 + (1 - Math.min(bounce, 1)) * 0.35;
  } else {
    const distance = Math.max(0, y - floorY);
    const proximity = 1 - Math.min(distance / 2.7, 1);
    shadow = lerp(0.04, 0.2, proximity);
    shadowScale = lerp(0.55, 1.08, proximity);
  }

  return { y, squashX, squashY, shadow, shadowScale };
}

function responsiveUnit(stage) {
  return Math.min(stage.getBoundingClientRect().width, 720) / 4.9;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
