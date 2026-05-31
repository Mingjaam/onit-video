import * as THREE from "three";

const container = document.getElementById("stage");
const progressBar = document.querySelector(".progress");
const letters = [...document.querySelectorAll(".clay-letter")];
const clayCircle = document.querySelector(".clay-circle");
const orbPath = document.getElementById("orbPath");
const orbShadow = document.querySelector(".orb-shadow");
const orbRipple = document.querySelector(".orb-ripple");

const SPHERE_RADIUS = 0.38;
const ROLL_SCALE = 0.9;
const RAIL_GAP = 0.58;
const RAIL_TUBE_RADIUS = 0.026;
const RAIL_CONTACT_RADIUS = SPHERE_RADIUS * ROLL_SCALE * 0.72;
const FLOOR_Y = -2.95;
const MORPH_START_Y = 0.44;
const SHAPE_POINT_COUNT = 88;
const LOOP_DURATION = 11.8;
const BALL_COLOR = 0x73ae4e;
const BOARD_COLOR = 0xbfc2ba;
const RED = 0xd94435;
const METAL = 0xb8bab7;

const TRACK_LAYOUT = {
  coordinateSystem: {
    description: "Front-view layout. Rails and xylophones are disabled for this clean logo-orb test.",
    xMin: -5.2,
    xMax: 5.2,
    yTop: 0.4,
    yBottom: -7.2,
    zMin: -1.4,
    zMax: 2.8
  },
  rails: [],
  xylophones: []
};

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

const railSegments = TRACK_LAYOUT.rails.map(makeRailFromLayout);

railSegments.forEach((segment) => addParallelRails(segment.curve));
TRACK_LAYOUT.xylophones.forEach((item) => {
  addGate(new THREE.Vector3(item.position.x, item.position.y, item.position.z), item.rotationY || 0, item.label, item.size || 1);
});

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

const letterLayout = [
  { x: -2.27, y: 0.03, r: -1.5 },
  { x: -1.08, y: 0.02, r: 1.0 },
  { x: -0.05, y: 0.0, r: 0.0 },
  { x: 0.73, y: 0.02, r: -1.0 },
  { x: 1.63, y: 0.03, r: 1.5 }
];

const circleShape = makeCircleLogoShape();
const logoShape = makeOnitLogoShape();
const clock = new THREE.Clock();
let lastIntroY = 0.44;
let cameraTarget = new THREE.Vector3(0, -0.03, 0);
let lastImpact = 0;

updateOrbShape(0);
animate();

function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime() % LOOP_DURATION;
  progressBar.style.setProperty("--progress", (t / LOOP_DURATION).toFixed(4));

  const gather = smoothstep(0.9, 2.85, t);
  const circleIn = smoothstep(2.0, 3.25, t);
  const logoOut = smoothstep(2.45, 3.35, t);
  const dropReady = smoothstep(3.12, 3.35, t);
  const runTime = Math.max(0, t - 3.35);
  const logoMorph = smoothstep(5.95, 7.45, runTime);

  updateBall(t, dropReady, runTime, circleIn, logoMorph);
  updateCamera(t, runTime);
  updateClayLogo(t, gather, circleIn, logoOut, logoMorph);

  renderer.render(scene, camera);
}

function updateClayLogo(t, gather, circleIn, logoOut, logoMorph) {
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

  const circleOpacity = circleIn;
  updateOrbShape(logoMorph);
  syncClayCircleToSphere();
  clayCircle.style.opacity = circleOpacity.toFixed(3);
  clayCircle.style.transform = "translate(-50%, -50%)";
}

function updateBall(t, dropReady, runTime, circleIn, logoMorph) {
  const planarScale = 0.22 + circleIn * 0.78;

  sphere.material.opacity = 0;

  if (dropReady < 1) {
    lastIntroY = MORPH_START_Y;
    sphereGroup.position.set(0, lastIntroY, 0);
    sphereGroup.scale.setScalar(planarScale);
  } else {
    const motion = simulateMarble(runTime, lastIntroY, logoMorph);
    lastImpact = motion.impact;
    sphereGroup.position.copy(motion.position);
    sphereGroup.scale.set(
      motion.scale * (1 + motion.squash * 0.18),
      motion.scale * (1 - motion.squash * 0.22),
      motion.scale
    );
    sphereGroup.rotation.y = 0;
    sphereGroup.rotation.x = 0;
    return;
  }

  lastImpact = 0;
  sphereGroup.rotation.y = 0;
  sphereGroup.rotation.x = 0;
}

function simulateMarble(time, startY, logoMorph) {
  const dt = 1 / 90;
  const gravity = new THREE.Vector3(0, -5.8, 0);
  const state = {
    mode: "falling",
    position: new THREE.Vector3(0, startY, 0),
    velocity: new THREE.Vector3(0, -0.2, 0),
    railIndex: -1,
    railS: 0,
    railV: 0,
    spin: 0,
    squash: 0,
    impact: 0,
    bounces: 0
  };

  let remaining = Math.min(time, 4.2);
  while (remaining > 0) {
    const step = Math.min(dt, remaining);
    stepPhysics(state, step, gravity);
    remaining -= step;
  }

  const lift = smoothstep(4.2, 5.65, time);
  if (lift > 0) {
    const liftedY = lerp(state.position.y, MORPH_START_Y, easeInOutCubic(lift));
    state.position.set(0, liftedY, 0);
    state.velocity.set(0, 0, 0);
    state.squash *= 1 - lift;
    state.impact *= 1 - lift;
  }

  return {
    position: state.position,
    scale: lerp(1, 1.08, logoMorph),
    spin: state.spin,
    squash: state.squash,
    impact: state.impact,
    floorY: FLOOR_Y
  };
}

function stepPhysics(state, dt, gravity) {
  if (state.mode === "rolling") {
    const rail = railSegments[state.railIndex];
    const tangent = railTangentAtDistance(rail, state.railS);
    const downhill = gravity.dot(tangent);
    const acceleration = downhill - state.railV * 0.08;
    state.railV += acceleration * dt;
    state.railS += state.railV * dt;
    state.spin += Math.abs(state.railV * dt) / (SPHERE_RADIUS * ROLL_SCALE);

    if (state.railS >= rail.length) {
      state.position.copy(pointOnRail(rail, rail.length));
      state.velocity.copy(tangent).multiplyScalar(Math.max(state.railV, 0.6));
      state.velocity.y += -0.15;
      state.mode = "falling";
      state.railIndex = -1;
      return;
    }

    state.position.copy(pointOnRail(rail, state.railS));
    return;
  }

  const previous = state.position.clone();
  state.velocity.addScaledVector(gravity, dt);
  state.position.addScaledVector(state.velocity, dt);
  state.spin += state.velocity.length() * dt * 0.42;
  state.squash = Math.max(0, state.squash - dt * 3.6);
  state.impact = Math.max(0, state.impact - dt * 1.8);

  if (state.position.y <= FLOOR_Y && state.velocity.y < 0) {
    state.position.y = FLOOR_Y;
    const bouncePower = Math.abs(state.velocity.y);
    if (bouncePower > 0.7 && state.bounces < 2) {
      state.velocity.y = bouncePower * (state.bounces === 0 ? 0.58 : 0.35);
      state.velocity.x = 0;
      state.velocity.z = 0;
      state.squash = Math.min(1, 0.3 + bouncePower * 0.045);
      state.impact = Math.min(1, 0.34 + bouncePower * 0.07);
      state.bounces += 1;
    } else {
      state.velocity.set(0, 0, 0);
      state.squash = Math.max(state.squash, 0.14);
      state.impact = Math.max(state.impact, 0.18);
    }
  }

  const hit = findRailHit(previous, state.position, state.railIndex);
  if (hit) {
    state.mode = "rolling";
    state.railIndex = hit.index;
    state.railS = hit.s;
    state.position.copy(hit.position);
    state.railV = Math.max(0.25, state.velocity.dot(railTangentAtDistance(hit.rail, hit.s)));
    state.velocity.set(0, 0, 0);
  }
}

function findRailHit(previous, current, ignoredIndex) {
  const samples = 8;
  let best = null;

  for (let i = 0; i < railSegments.length; i++) {
    if (i === ignoredIndex) continue;
    const rail = railSegments[i];
    for (let sample = 1; sample <= samples; sample++) {
      const alpha = sample / samples;
      const swept = previous.clone().lerp(current, alpha);
      const closest = closestPointOnRail(swept, rail);
      const ridePoint = pointOnRail(rail, closest.s);
      const distance = swept.distanceTo(ridePoint);
      const crossedDownward = previous.y >= ridePoint.y - 0.08 && current.y <= ridePoint.y + 0.1;
      const movingDown = current.y <= previous.y + 0.02;

      if (!movingDown || !crossedDownward || distance > RAIL_CONTACT_RADIUS) continue;

      const candidate = {
        index: i,
        s: closest.s,
        position: ridePoint,
        rail,
        distance
      };
      if (!best || candidate.distance < best.distance) best = candidate;
    }
  }

  return best;
}

function closestPointOnRail(point, rail) {
  const sampleCount = 90;
  let bestT = 0;
  let bestDistance = Infinity;

  for (let i = 0; i <= sampleCount; i++) {
    const t = i / sampleCount;
    const candidate = ridePointForRail(rail, t);
    const distance = point.distanceTo(candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestT = t;
    }
  }

  return {
    s: bestT * rail.length,
    distance: bestDistance
  };
}

function pointOnRail(rail, s) {
  return ridePointForRail(rail, Math.max(0, Math.min(1, s / rail.length)));
}

function ridePointForRail(rail, t) {
  return rail.curve.getPointAt(t)
    .add(new THREE.Vector3(0, 0, SPHERE_RADIUS * ROLL_SCALE * 0.2));
}

function railTangentAtDistance(rail, s) {
  return rail.curve.getTangentAt(Math.max(0, Math.min(1, s / rail.length))).normalize();
}

function syncClayCircleToSphere() {
  sphereGroup.updateWorldMatrix(true, false);

  const center = new THREE.Vector3(0, 0, 0);
  const edge = new THREE.Vector3(SPHERE_RADIUS, 0, 0);
  const floor = new THREE.Vector3(sphereGroup.position.x, FLOOR_Y, sphereGroup.position.z);
  sphereGroup.localToWorld(center);
  sphereGroup.localToWorld(edge);

  const centerPx = projectToScreen(center);
  const edgePx = projectToScreen(edge);
  const floorPx = projectToScreen(floor);
  const radiusPx = Math.hypot(edgePx.x - centerPx.x, edgePx.y - centerPx.y);
  const diameter = Math.max(1, radiusPx * 2);
  const floorDistance = Math.max(0, Math.min(1, (floorPx.y - centerPx.y) / Math.max(1, diameter * 3.2)));
  const contact = 1 - floorDistance;

  clayCircle.style.left = `${centerPx.x.toFixed(2)}px`;
  clayCircle.style.top = `${centerPx.y.toFixed(2)}px`;
  clayCircle.style.width = `${diameter.toFixed(2)}px`;
  clayCircle.style.height = `${diameter.toFixed(2)}px`;

  orbShadow.style.left = `${floorPx.x.toFixed(2)}px`;
  orbShadow.style.top = `${floorPx.y.toFixed(2)}px`;
  orbShadow.style.width = `${(diameter * (0.48 + contact * 0.42)).toFixed(2)}px`;
  orbShadow.style.height = `${(diameter * (0.09 + contact * 0.04)).toFixed(2)}px`;
  orbShadow.style.opacity = (clayCircle.style.opacity * (0.08 + contact * 0.34)).toFixed(3);

  const rippleStrength = lastImpact;
  const rippleSize = diameter * (1.05 + rippleStrength * 3.2);
  orbRipple.style.left = `${floorPx.x.toFixed(2)}px`;
  orbRipple.style.top = `${floorPx.y.toFixed(2)}px`;
  orbRipple.style.width = `${rippleSize.toFixed(2)}px`;
  orbRipple.style.height = `${(rippleSize * 0.36).toFixed(2)}px`;
  orbRipple.style.opacity = Math.min(0.55, rippleStrength * 1.9).toFixed(3);
}

function projectToScreen(worldPosition) {
  const ndc = worldPosition.clone().project(camera);
  return {
    x: (ndc.x * 0.5 + 0.5) * window.innerWidth,
    y: (-ndc.y * 0.5 + 0.5) * window.innerHeight
  };
}

function updateCamera(t, runTime) {
  const ball = sphereGroup.position;

  camera.position.x = 0;
  camera.position.y = lerp(0.36, 1.2, smoothstep(0, 1.2, runTime));
  camera.position.z = 9.4;

  cameraTarget.set(0, lerp(-0.03, ball.y * 0.16, smoothstep(0.2, 1.8, runTime)), 0);
  camera.lookAt(cameraTarget);
}

function updateOrbShape(progress) {
  const eased = easeInOutCubic(progress);
  const outer = interpolatePoints(circleShape.outer, logoShape.outer, eased);
  const innerOpen = smoothstep(0.18, 0.92, eased);
  const inner = interpolatePoints(circleShape.inner, logoShape.inner, innerOpen);
  orbPath.setAttribute("d", `${pointsToPath(outer)} ${pointsToPath(inner)}`);
}

function makeCircleLogoShape() {
  const center = { x: 50, y: 50 };
  const outer = [];
  const inner = [];
  for (let i = 0; i < SHAPE_POINT_COUNT; i++) {
    const angle = -Math.PI / 2 + (i / SHAPE_POINT_COUNT) * Math.PI * 2;
    outer.push({
      x: center.x + Math.cos(angle) * 47,
      y: center.y + Math.sin(angle) * 47
    });
    inner.push({ x: center.x, y: center.y });
  }
  return { outer, inner };
}

function makeOnitLogoShape() {
  const outerAnchors = [
    { x: 18, y: 6 }, { x: 72, y: 6 }, { x: 84, y: 10 }, { x: 91, y: 22 },
    { x: 91, y: 61 }, { x: 88, y: 72 }, { x: 66, y: 93 }, { x: 56, y: 97 },
    { x: 18, y: 97 }, { x: 7, y: 92 }, { x: 4, y: 80 }, { x: 4, y: 20 },
    { x: 8, y: 10 }
  ];
  const innerAnchors = [
    { x: 24, y: 22 }, { x: 72, y: 22 }, { x: 75, y: 24 }, { x: 75, y: 61 },
    { x: 61, y: 61 }, { x: 55, y: 64 }, { x: 52, y: 70 }, { x: 52, y: 84 },
    { x: 24, y: 84 }, { x: 21, y: 81 }, { x: 21, y: 25 }
  ];
  return {
    outer: sampleCatmullClosed(outerAnchors, SHAPE_POINT_COUNT),
    inner: sampleCatmullClosed(innerAnchors, SHAPE_POINT_COUNT)
  };
}

function sampleCatmullClosed(points, count) {
  const samples = [];
  const segmentCount = points.length;
  for (let i = 0; i < count; i++) {
    const segment = (i / count) * segmentCount;
    const index = Math.floor(segment);
    const t = segment - index;
    const p0 = points[(index - 1 + segmentCount) % segmentCount];
    const p1 = points[index % segmentCount];
    const p2 = points[(index + 1) % segmentCount];
    const p3 = points[(index + 2) % segmentCount];
    samples.push({
      x: catmull(p0.x, p1.x, p2.x, p3.x, t),
      y: catmull(p0.y, p1.y, p2.y, p3.y, t)
    });
  }
  return samples;
}

function catmull(a, b, c, d, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
}

function interpolatePoints(from, to, progress) {
  return from.map((point, index) => ({
    x: lerp(point.x, to[index].x, progress),
    y: lerp(point.y, to[index].y, progress)
  }));
}

function pointsToPath(points) {
  const [first, ...rest] = points;
  return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} ${rest.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ")} Z`;
}

function makeRailFromLayout(rail) {
  const points = (rail.points || [rail.start, rail.end])
    .map((point) => new THREE.Vector3(point.x, point.y, point.z));
  const curve = points.length > 2
    ? new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5)
    : new THREE.LineCurve3(points[0], points[1]);
  curve.arcLengthDivisions = 160;
  return {
    points,
    curve,
    length: Math.max(0.001, curve.getLength())
  };
}

function addParallelRails(curve) {
  const samples = 72;
  const left = [];
  const right = [];

  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const p = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u);
    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize().multiplyScalar(RAIL_GAP / 2);
    left.push(p.clone().add(normal));
    right.push(p.clone().sub(normal));
  }

  railMesh(new THREE.CatmullRomCurve3(left));
  railMesh(new THREE.CatmullRomCurve3(right));
}

function railMesh(curve) {
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 90, RAIL_TUBE_RADIUS, 10, false),
    metalMaterial.clone()
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  trackGroup.add(mesh);
}

function addGate(position, rotationY, label, size = 1) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;
  group.scale.setScalar(size);

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
