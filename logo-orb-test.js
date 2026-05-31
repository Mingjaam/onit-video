import * as THREE from "three";

const container = document.getElementById("stage");
const progressBar = document.querySelector(".progress");
const letters = [...document.querySelectorAll(".clay-letter")];
const clayCircle = document.querySelector(".clay-circle");
const SPHERE_RADIUS = 0.86;
const ROLL_SCALE = 0.82;
const LOOP_DURATION = 10.6;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f6f0);
scene.fog = new THREE.Fog(0xf4f6f0, 10, 20);

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.36, 8.7);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xffffff, 0xc7d3bd, 1.65);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffffff, 3.8);
key.position.set(-3.2, 5.5, 4.6);
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
rim.position.set(2.8, 2.8, 3.2);
scene.add(rim);

const wall = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 9),
  new THREE.MeshStandardMaterial({
    color: 0xf0f3eb,
    roughness: 0.88,
    metalness: 0.0
  })
);
wall.position.set(0, -0.45, -0.08);
wall.receiveShadow = true;
scene.add(wall);

const railGroup = new THREE.Group();
scene.add(railGroup);

const railDepth = 0.04;
const ballDepth = SPHERE_RADIUS * ROLL_SCALE + 0.08;
const railGap = 0.46;
const trackSegments = [
  {
    start: new THREE.Vector3(-0.75, -2.65, railDepth),
    end: new THREE.Vector3(1.45, -3.15, railDepth)
  },
  {
    start: new THREE.Vector3(-1.35, -4.05, railDepth),
    end: new THREE.Vector3(1.75, -4.75, railDepth)
  }
];
const rideSegments = trackSegments.map((segment) => makeLineCurve(
  new THREE.Vector3(segment.start.x, segment.start.y, ballDepth),
  new THREE.Vector3(segment.end.x, segment.end.y, ballDepth)
));
const railLengths = rideSegments.map((curve) => curve.getLength());

const railMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x343833,
  roughness: 0.29,
  metalness: 0.72,
  clearcoat: 0.32,
  clearcoatRoughness: 0.24
});

trackSegments.forEach((segment) => addRailPair(segment.start, segment.end));

const sphereGroup = new THREE.Group();
sphereGroup.position.set(0, 0.44, 0);
scene.add(sphereGroup);

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(SPHERE_RADIUS, 96, 96),
  new THREE.MeshPhysicalMaterial({
    color: 0x73ae4e,
    roughness: 0.48,
    metalness: 0.01,
    clearcoat: 0.58,
    clearcoatRoughness: 0.34,
    sheen: 0.48,
    sheenColor: new THREE.Color(0xcaf3b6),
    transparent: true,
    opacity: 0
  })
);
sphere.castShadow = true;
sphere.receiveShadow = true;
sphereGroup.add(sphere);

const contactShadow = new THREE.Mesh(
  new THREE.CircleGeometry(1.55, 96),
  new THREE.MeshBasicMaterial({
    color: 0x182318,
    transparent: true,
    opacity: 0,
    depthWrite: false
  })
);
contactShadow.rotation.x = 0;
contactShadow.position.z = 0.02;
scene.add(contactShadow);

const letterLayout = [
  { x: -2.27, y: 0.03, r: -1.5 },
  { x: -1.08, y: 0.02, r: 1.0 },
  { x: -0.05, y: 0.0, r: 0.0 },
  { x: 0.73, y: 0.02, r: -1.0 },
  { x: 1.63, y: 0.03, r: 1.5 }
];

const clock = new THREE.Clock();
let lastSettledY = 0.44;
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
  const fallTime = Math.max(0, t - 4.85);

  updateSphere(t, inflate, fallTime, circleIn);
  updateClayLogo(t, gather, circleIn, logoOut, inflate);
  updateCamera(t, inflate, fallTime);

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

function updateSphere(t, inflate, fallTime, circleIn) {
  const appear = smoothstep(0.04, 0.62, inflate);
  const clayToSphere = smoothstep(0, 1, inflate);
  const planarScale = 0.22 + circleIn * 0.78;

  sphere.material.opacity = appear;

  if (fallTime <= 0) {
    lastSettledY = lerp(0.44, 0.74, inflate);
    sphereGroup.position.set(0, lastSettledY, 0);
    sphereGroup.scale.set(
      planarScale,
      planarScale,
      Math.max(0.012, planarScale * clayToSphere)
    );
    contactShadow.material.opacity = 0.05 * appear;
    contactShadow.position.set(0, lastSettledY, 0.02);
    contactShadow.scale.setScalar(0.58 + appear * 0.18);
  } else {
    const motion = railMotion(fallTime, lastSettledY);
    sphereGroup.position.copy(motion.position);
    sphereGroup.scale.set(
      motion.scale * (1 + motion.squashX),
      motion.scale * (1 + motion.squashY),
      motion.scale * (1 + motion.squashX)
    );
    contactShadow.material.opacity = motion.shadow;
    contactShadow.position.set(motion.position.x, motion.position.y, 0.02);
    contactShadow.scale.set(motion.shadowScale, motion.shadowScale * 0.42, 1);
  }

  const rollingSpin = fallTime > 0 ? railMotion(fallTime, lastSettledY).spin : 0;
  sphereGroup.rotation.y = inflate * 1.8 + Math.max(0, fallTime) * 0.35;
  sphereGroup.rotation.x = Math.sin(t * 1.7) * 0.06 * inflate + rollingSpin;
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

function railMotion(time, startY) {
  const firstRailStart = rideSegments[0].getPointAt(0);
  const firstRailEnd = rideSegments[0].getPointAt(1);
  const secondRailStart = rideSegments[1].getPointAt(0);
  const fallToFirstDuration = 0.85;
  const firstRollDuration = 1.35;
  const fallToSecondDuration = 0.58;
  const secondRollDuration = 1.8;

  if (time < fallToFirstDuration) {
    const p = time / fallToFirstDuration;
    const eased = easeInCubic(p);
    const start = new THREE.Vector3(0, startY, 0);
    const position = new THREE.Vector3().lerpVectors(start, firstRailStart, eased);
    position.y += Math.sin(p * Math.PI) * 0.05;
    const approach = smoothstep(0.15, 1, p);
    const impact = smoothstep(0.78, 1, p);

    return {
      position,
      scale: lerp(1, ROLL_SCALE, approach),
      squashX: impact * 0.12,
      squashY: -impact * 0.16,
      shadow: lerp(0.04, 0.16, p),
      shadowScale: lerp(0.48, 0.92, p),
      spin: p * 0.6
    };
  }

  let elapsed = time - fallToFirstDuration;
  if (elapsed < firstRollDuration) {
    const rollTime = Math.min(1, elapsed / firstRollDuration);
    const u = easeInOutCubic(rollTime);
    const position = rideSegments[0].getPointAt(u);
    const tangent = rideSegments[0].getTangentAt(u);
    const landingPulse = Math.max(0, 1 - elapsed * 4.2);

    return {
      position,
      scale: ROLL_SCALE,
      squashX: landingPulse * 0.08,
      squashY: -landingPulse * 0.12,
      shadow: 0.14,
      shadowScale: 0.78,
      spin: (u * railLengths[0]) / (SPHERE_RADIUS * ROLL_SCALE) + tangent.x * 0.2
    };
  }

  elapsed -= firstRollDuration;
  if (elapsed < fallToSecondDuration) {
    const p = elapsed / fallToSecondDuration;
    const eased = easeInCubic(p);
    const position = new THREE.Vector3().lerpVectors(firstRailEnd, secondRailStart, eased);
    position.y += Math.sin(p * Math.PI) * 0.08;
    const impact = smoothstep(0.72, 1, p);

    return {
      position,
      scale: ROLL_SCALE,
      squashX: impact * 0.08,
      squashY: -impact * 0.13,
      shadow: lerp(0.08, 0.15, p),
      shadowScale: lerp(0.54, 0.78, p),
      spin: (railLengths[0] / (SPHERE_RADIUS * ROLL_SCALE)) + p * 0.7
    };
  }

  elapsed -= fallToSecondDuration;
  const rollTime = Math.min(1, elapsed / secondRollDuration);
  const u = easeInCubic(rollTime);
  const position = rideSegments[1].getPointAt(u);
  const tangent = rideSegments[1].getTangentAt(u);
  const secondLandingPulse = Math.max(0, 1 - elapsed * 4.0);

  return {
    position,
    scale: ROLL_SCALE,
    squashX: secondLandingPulse * 0.08,
    squashY: -secondLandingPulse * 0.12,
    shadow: 0.14,
    shadowScale: lerp(0.78, 0.68, rollTime),
    spin: ((railLengths[0] + u * railLengths[1]) / (SPHERE_RADIUS * ROLL_SCALE)) + tangent.x * 0.2
  };
}

function updateCamera(t, inflate, fallTime) {
  const pullback = smoothstep(0.0, 2.05, fallTime);
  camera.position.x = Math.sin(t * 0.55) * 0.03 * (1 - pullback);
  camera.position.y = lerp(0.36, 0.58, inflate) - pullback * 0.65;
  camera.position.z = lerp(8.7, 12.8, pullback);
  cameraTarget.lerp(
    new THREE.Vector3(
      0,
      lerp(-0.03, -3.35, pullback),
      0
    ),
    0.12
  );
  camera.lookAt(cameraTarget);
}

function makeRail(curve) {
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 120, 0.032, 12, false),
    railMaterial.clone()
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeLineCurve(start, end) {
  return new THREE.LineCurve3(start, end);
}

function addRailPair(start, end) {
  const direction = new THREE.Vector2(end.x - start.x, end.y - start.y).normalize();
  const normal = new THREE.Vector2(-direction.y, direction.x).multiplyScalar(railGap / 2);
  const left = makeLineCurve(
    new THREE.Vector3(start.x + normal.x, start.y + normal.y, start.z),
    new THREE.Vector3(end.x + normal.x, end.y + normal.y, end.z)
  );
  const right = makeLineCurve(
    new THREE.Vector3(start.x - normal.x, start.y - normal.y, start.z),
    new THREE.Vector3(end.x - normal.x, end.y - normal.y, end.z)
  );
  railGroup.add(makeRail(left), makeRail(right));
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

function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
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
