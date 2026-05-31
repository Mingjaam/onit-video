import * as THREE from "three";

const container = document.getElementById("stage");
const progressBar = document.querySelector(".progress");
const letters = [...document.querySelectorAll(".clay-letter")];
const clayCircle = document.querySelector(".clay-circle");

const SPHERE_RADIUS = 0.74;
const LOOP_DURATION = 11.8;
const BALL_COLOR = 0x73ae4e;
const BOARD_COLOR = 0xbfc2ba;
const RED = 0xd94435;
const METAL = 0xb8bab7;

const scene = new THREE.Scene();
scene.background = new THREE.Color(BOARD_COLOR);
scene.fog = new THREE.Fog(BOARD_COLOR, 10, 24);

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.36, 8.7);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xffffff, 0xa7ada4, 1.25);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffffff, 4.1);
key.position.set(-4.6, 6.5, 5.8);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 0.1;
key.shadow.camera.far = 26;
key.shadow.camera.left = -9;
key.shadow.camera.right = 9;
key.shadow.camera.top = 9;
key.shadow.camera.bottom = -9;
key.shadow.radius = 7;
key.shadow.bias = -0.00008;
scene.add(key);

const soft = new THREE.PointLight(0xffffff, 2.6, 16);
soft.position.set(4, 3.2, 4.8);
scene.add(soft);

const board = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 12),
  new THREE.MeshStandardMaterial({
    color: BOARD_COLOR,
    roughness: 0.78,
    metalness: 0.0
  })
);
board.rotation.x = -Math.PI / 2;
board.position.y = -2.2;
board.receiveShadow = true;
scene.add(board);

const trackGroup = new THREE.Group();
trackGroup.visible = true;
scene.add(trackGroup);

const metalMaterial = new THREE.MeshPhysicalMaterial({
  color: METAL,
  roughness: 0.24,
  metalness: 0.76,
  clearcoat: 0.34,
  clearcoatRoughness: 0.22
});
const redMaterial = new THREE.MeshPhysicalMaterial({
  color: RED,
  roughness: 0.42,
  metalness: 0.08,
  clearcoat: 0.38,
  clearcoatRoughness: 0.26
});
const screenMaterial = new THREE.MeshStandardMaterial({
  color: 0x8dd4d2,
  roughness: 0.5,
  metalness: 0.0
});

const railSegments = [
  makeLineSegment([-0.48, -1.18, -0.12], [1.32, -1.78, 0.34]),
  makeLineSegment([1.9, -2.55, 0.52], [3.55, -3.2, 0.96]),
  makeLineSegment([3.95, -4.05, 1.12], [2.25, -4.72, 1.68])
];

railSegments.forEach((segment) => addParallelRails(segment.curve));
addGate(new THREE.Vector3(0.25, -0.88, -0.18), -0.22, "VOICE");
addGate(new THREE.Vector3(2.25, -2.12, 0.58), -0.18, "PRD");
addGate(new THREE.Vector3(3.62, -3.62, 1.08), 0.12, "iOS");

const sphereGroup = new THREE.Group();
sphereGroup.position.set(0, 0.44, 0);
scene.add(sphereGroup);

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(SPHERE_RADIUS, 96, 96),
  new THREE.MeshPhysicalMaterial({
    color: BALL_COLOR,
    roughness: 0.4,
    metalness: 0.04,
    clearcoat: 0.62,
    clearcoatRoughness: 0.28,
    sheen: 0.4,
    sheenColor: new THREE.Color(0xcaf3b6),
    transparent: true,
    opacity: 0
  })
);
sphere.castShadow = true;
sphere.receiveShadow = true;
sphereGroup.add(sphere);

const contactShadow = new THREE.Mesh(
  new THREE.CircleGeometry(1.0, 64),
  new THREE.MeshBasicMaterial({
    color: 0x172016,
    transparent: true,
    opacity: 0,
    depthWrite: false
  })
);
contactShadow.rotation.x = -Math.PI / 2;
contactShadow.position.y = -2.185;
scene.add(contactShadow);

const letterLayout = [
  { x: -2.27, y: 0.03, r: -1.5 },
  { x: -1.08, y: 0.02, r: 1.0 },
  { x: -0.05, y: 0.0, r: 0.0 },
  { x: 0.73, y: 0.02, r: -1.0 },
  { x: 1.63, y: 0.03, r: 1.5 }
];

const clock = new THREE.Clock();
let lastIntroY = 0.44;
let cameraTarget = new THREE.Vector3(0, -0.03, 0);

animate();

function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime() % LOOP_DURATION;
  progressBar.style.setProperty("--progress", (t / LOOP_DURATION).toFixed(4));

  const gather = smoothstep(0.9, 2.85, t);
  const circleIn = smoothstep(2.0, 3.25, t);
  const logoOut = smoothstep(2.45, 3.35, t);
  const inflate = smoothstep(3.35, 4.85, t);
  const runTime = Math.max(0, t - 4.85);

  updateBall(t, inflate, runTime, circleIn);
  updateClayLogo(t, gather, circleIn, logoOut, inflate);
  updateCamera(t, inflate, runTime);

  renderer.render(scene, camera);
}

function updateClayLogo(t, gather, circleIn, logoOut, inflate) {
  letters.forEach((letter, index) => {
    const item = letterLayout[index];
    const delay = index * 0.045;
    const localGather = smoothstep(0, 1, gather - delay);
    const clayPulse = Math.sin((t * 7.2) + index * 1.7) * 0.08 * localGather * (1 - logoOut);

    const startX = item.x * responsiveUnit();
    const startY = item.y * responsiveUnit();
    const centerBiasX = (index - 2) * 5 * (1 - localGather);
    const x = lerp(startX, centerBiasX, localGather);
    const y = lerp(startY, 0, localGather) + clayPulse * 18;
    const scale = lerp(1, 1.22 + clayPulse, localGather) * lerp(1, 0.8, logoOut);
    const rotation = lerp(item.r, item.r * 0.18, localGather);
    const opacity = 1 - smoothstep(0.62, 1, logoOut);

    letter.style.opacity = opacity.toFixed(3);
    letter.style.transform = [
      "translate(-50%, -50%)",
      `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`,
      `rotate(${rotation.toFixed(2)}deg)`,
      `scale(${scale.toFixed(3)})`
    ].join(" ");
  });

  const circleFade = smoothstep(0.16, 0.78, inflate);
  const circleOpacity = circleIn * (1 - circleFade);
  syncClayCircleToSphere();
  clayCircle.style.opacity = circleOpacity.toFixed(3);
  clayCircle.style.transform = "translate(-50%, -50%)";
}

function updateBall(t, inflate, runTime, circleIn) {
  const appear = smoothstep(0.04, 0.62, inflate);
  const clayToSphere = smoothstep(0, 1, inflate);
  const planarScale = 0.22 + circleIn * 0.78;

  sphere.material.opacity = appear;

  if (runTime <= 0) {
    lastIntroY = lerp(0.44, 0.7, inflate);
    sphereGroup.position.set(0, lastIntroY, 0);
    sphereGroup.scale.set(
      planarScale,
      planarScale,
      Math.max(0.012, planarScale * clayToSphere)
    );
    contactShadow.material.opacity = 0;
  } else {
    const motion = simulateMarble(runTime, lastIntroY);
    sphereGroup.position.copy(motion.position);
    sphereGroup.scale.setScalar(motion.scale);
    contactShadow.material.opacity = motion.shadow;
    contactShadow.position.x = motion.position.x;
    contactShadow.position.z = motion.position.z;
    contactShadow.scale.setScalar(motion.shadowScale);
  }

  const spin = runTime > 0 ? simulateMarble(runTime, lastIntroY).spin : 0;
  sphereGroup.rotation.y = inflate * 1.8 + spin * 0.18;
  sphereGroup.rotation.x = Math.sin(t * 1.7) * 0.06 * inflate + spin;
}

function simulateMarble(time, startY) {
  const dt = 1 / 90;
  const gravity = new THREE.Vector3(0, -5.8, 0);
  const state = {
    mode: "falling",
    position: new THREE.Vector3(-0.45, startY, -0.1),
    velocity: new THREE.Vector3(0.2, -0.2, 0.04),
    railIndex: -1,
    railS: 0,
    railV: 0,
    spin: 0
  };

  let remaining = Math.min(time, 6.2);
  while (remaining > 0) {
    const step = Math.min(dt, remaining);
    stepPhysics(state, step, gravity);
    remaining -= step;
  }

  return {
    position: state.position,
    scale: 0.86,
    shadow: state.mode === "rolling" ? 0.15 : 0.08,
    shadowScale: state.mode === "rolling" ? 0.68 : 0.48,
    spin: state.spin
  };
}

function stepPhysics(state, dt, gravity) {
  if (state.mode === "rolling") {
    const rail = railSegments[state.railIndex];
    const downhill = gravity.dot(rail.direction);
    const acceleration = downhill - state.railV * 0.08;
    state.railV += acceleration * dt;
    state.railS += state.railV * dt;
    state.spin += Math.abs(state.railV * dt) / (SPHERE_RADIUS * 0.86);

    if (state.railS >= rail.length) {
      state.position.copy(rail.end);
      state.velocity.copy(rail.direction).multiplyScalar(Math.max(state.railV, 0.6));
      state.velocity.y += -0.15;
      state.mode = "falling";
      state.railIndex = -1;
      return;
    }

    state.position.copy(rail.start).addScaledVector(rail.direction, state.railS);
    return;
  }

  const previous = state.position.clone();
  state.velocity.addScaledVector(gravity, dt);
  state.position.addScaledVector(state.velocity, dt);

  const hit = findRailHit(previous, state.position, state.railIndex);
  if (hit) {
    state.mode = "rolling";
    state.railIndex = hit.index;
    state.railS = hit.s;
    state.position.copy(hit.position);
    state.railV = Math.max(0.25, state.velocity.dot(hit.rail.direction));
    state.velocity.set(0, 0, 0);
  }
}

function findRailHit(previous, current, ignoredIndex) {
  for (let i = 0; i < railSegments.length; i++) {
    if (i === ignoredIndex) continue;
    const rail = railSegments[i];
    const closest = closestPointOnSegment(current, rail.start, rail.end);
    const distance = current.distanceTo(closest.point);
    const crossedDownward = previous.y >= closest.point.y - 0.08 && current.y <= closest.point.y + 0.12;
    const nearCenter = distance < 0.2;
    const movingDown = current.y <= previous.y + 0.02;
    if (closest.t >= 0 && closest.t <= 1 && crossedDownward && nearCenter && movingDown) {
      return {
        index: i,
        s: closest.t * rail.length,
        position: closest.point,
        rail
      };
    }
  }
  return null;
}

function closestPointOnSegment(point, start, end) {
  const ab = end.clone().sub(start);
  const t = Math.max(0, Math.min(1, point.clone().sub(start).dot(ab) / ab.lengthSq()));
  return {
    t,
    point: start.clone().addScaledVector(ab, t)
  };
}

function syncClayCircleToSphere() {
  sphereGroup.updateWorldMatrix(true, false);

  const center = new THREE.Vector3(0, 0, 0);
  const edge = new THREE.Vector3(SPHERE_RADIUS, 0, 0);
  sphereGroup.localToWorld(center);
  sphereGroup.localToWorld(edge);

  const centerPx = projectToScreen(center);
  const edgePx = projectToScreen(edge);
  const radiusPx = Math.hypot(edgePx.x - centerPx.x, edgePx.y - centerPx.y);
  const diameter = Math.max(1, radiusPx * 2);

  clayCircle.style.left = `${centerPx.x.toFixed(2)}px`;
  clayCircle.style.top = `${centerPx.y.toFixed(2)}px`;
  clayCircle.style.width = `${diameter.toFixed(2)}px`;
  clayCircle.style.height = `${diameter.toFixed(2)}px`;
}

function projectToScreen(worldPosition) {
  const ndc = worldPosition.clone().project(camera);
  return {
    x: (ndc.x * 0.5 + 0.5) * window.innerWidth,
    y: (-ndc.y * 0.5 + 0.5) * window.innerHeight
  };
}

function updateCamera(t, inflate, runTime) {
  const reveal = smoothstep(0, 1.7, runTime);
  const follow = runTime > 1.2 ? smoothstep(1.2, 5.2, runTime) : 0;
  const ball = sphereGroup.position;

  camera.position.x = lerp(0, -1.15, reveal) + ball.x * 0.08 * follow;
  camera.position.y = lerp(0.36, 4.55, reveal) + ball.y * 0.03 * follow;
  camera.position.z = lerp(8.7, 9.9, reveal);
  cameraTarget.lerp(
    new THREE.Vector3(
      lerp(0, 0.1, reveal) + ball.x * 0.18 * follow,
      lerp(-0.03, -1.65, reveal) + ball.y * 0.22 * follow,
      lerp(0, 0.45, reveal) + ball.z * 0.2 * follow
    ),
    0.12
  );
  camera.lookAt(cameraTarget);
}

function makeLineSegment(startArray, endArray) {
  const start = new THREE.Vector3(...startArray);
  const end = new THREE.Vector3(...endArray);
  const delta = end.clone().sub(start);
  const length = delta.length();
  const direction = delta.clone().normalize();
  return {
    start,
    end,
    length,
    direction,
    curve: new THREE.LineCurve3(start, end)
  };
}

function addParallelRails(curve) {
  const samples = 72;
  const railGap = 0.42;
  const left = [];
  const right = [];

  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const p = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(railGap / 2);
    left.push(p.clone().add(normal));
    right.push(p.clone().sub(normal));
  }

  railMesh(new THREE.CatmullRomCurve3(left));
  railMesh(new THREE.CatmullRomCurve3(right));
}

function railMesh(curve) {
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 90, 0.028, 10, false),
    metalMaterial.clone()
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  trackGroup.add(mesh);
}

function addGate(position, rotationY, label) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.42, 0.08), redMaterial);
  frame.castShadow = true;
  frame.receiveShadow = true;
  group.add(frame);

  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.28, 0.09), screenMaterial.clone());
  screen.position.z = 0.01;
  screen.castShadow = true;
  group.add(screen);

  const side = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.12), redMaterial.clone());
  side.position.x = 0.57;
  side.castShadow = true;
  group.add(side);

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 18), metalMaterial.clone());
  post.position.set(-0.22, -0.42, 0.02);
  post.rotation.z = -0.2;
  post.castShadow = true;
  group.add(post);

  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.68, 18), metalMaterial.clone());
  foot.position.set(-0.24, -0.65, 0.18);
  foot.rotation.x = Math.PI / 2;
  foot.rotation.z = 0.12;
  foot.castShadow = true;
  group.add(foot);

  const mark = makeMarkTexture(label);
  screen.material.map = mark;
  screen.material.needsUpdate = true;

  trackGroup.add(group);
}

function makeMarkTexture(label) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 512, 0);
  gradient.addColorStop(0, "#6b6bd6");
  gradient.addColorStop(0.5, "#55d7d5");
  gradient.addColorStop(1, "#75dc74");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = "#1f2630";
  ctx.font = "900 88px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 256, 132);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function responsiveUnit() {
  return Math.min(window.innerWidth, 1440) / 6.8;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function easeInCubic(x) {
  return x * x * x;
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
});
