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
scene.fog = new THREE.Fog(0xf4f6f0, 9, 18);

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

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(16, 10),
  new THREE.ShadowMaterial({ color: 0x22321d, opacity: 0.18 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2.45;
floor.receiveShadow = true;
scene.add(floor);

const floorLine = new THREE.Mesh(
  new THREE.BoxGeometry(6.8, 0.012, 0.012),
  new THREE.MeshBasicMaterial({ color: 0x73ae4e, transparent: true, opacity: 0.34 })
);
floorLine.position.set(0, -2.438, 0.15);
scene.add(floorLine);

const railGroup = new THREE.Group();
scene.add(railGroup);

const railCenterPoints = [
  new THREE.Vector3(-2.7, -2.05, 0.82),
  new THREE.Vector3(-1.45, -2.15, 1.08),
  new THREE.Vector3(-0.1, -2.06, 1.36),
  new THREE.Vector3(1.3, -2.2, 1.72),
  new THREE.Vector3(2.9, -2.34, 2.1),
  new THREE.Vector3(4.3, -2.48, 2.45)
];

const railCurve = new THREE.CatmullRomCurve3(railCenterPoints);
railCurve.curveType = "catmullrom";
railCurve.tension = 0.5;

const rideCurve = new THREE.CatmullRomCurve3(
  railCenterPoints.map((point) => point.clone().add(new THREE.Vector3(0, SPHERE_RADIUS * ROLL_SCALE + 0.07, 0)))
);
rideCurve.curveType = "catmullrom";
rideCurve.tension = 0.5;

const railOffset = 0.22;
const leftRailCurve = new THREE.CatmullRomCurve3(
  railCenterPoints.map((point) => point.clone().add(new THREE.Vector3(0, 0, -railOffset)))
);
const rightRailCurve = new THREE.CatmullRomCurve3(
  railCenterPoints.map((point) => point.clone().add(new THREE.Vector3(0, 0, railOffset)))
);
[leftRailCurve, rightRailCurve].forEach((curve) => {
  curve.curveType = "catmullrom";
  curve.tension = 0.5;
});

const railLength = rideCurve.getLength();

const railMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x343833,
  roughness: 0.29,
  metalness: 0.72,
  clearcoat: 0.32,
  clearcoatRoughness: 0.24
});

const leftRail = makeRail(leftRailCurve);
const rightRail = makeRail(rightRailCurve);
railGroup.add(leftRail, rightRail);

const tieMaterial = new THREE.MeshStandardMaterial({
  color: 0x5d5044,
  roughness: 0.82,
  metalness: 0.0
});

for (let i = 0; i <= 18; i++) {
  const u = i / 18;
  const point = railCurve.getPointAt(u);
  const tangent = railCurve.getTangentAt(u);
  const tie = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.055, 0.72),
    tieMaterial
  );
  tie.position.copy(point);
  tie.position.y -= 0.085;
  tie.rotation.y = Math.atan2(tangent.z, tangent.x) + Math.PI / 2;
  tie.castShadow = true;
  tie.receiveShadow = true;
  railGroup.add(tie);
}

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
contactShadow.rotation.x = -Math.PI / 2;
contactShadow.position.y = -2.43;
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
    contactShadow.position.x = motion.position.x;
    contactShadow.position.z = motion.position.z;
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
  const railStart = rideCurve.getPointAt(0);
  const fallDuration = 1.05;
  const rollDuration = 4.2;

  if (time < fallDuration) {
    const p = time / fallDuration;
    const eased = easeInCubic(p);
    const start = new THREE.Vector3(0, startY, 0);
    const position = new THREE.Vector3().lerpVectors(start, railStart, eased);
    position.y += Math.sin(p * Math.PI) * 0.08;
    const approach = smoothstep(0.15, 1, p);
    const impact = smoothstep(0.78, 1, p);

    return {
      position,
      scale: lerp(1, ROLL_SCALE, approach),
      squashX: impact * 0.12,
      squashY: -impact * 0.16,
      shadow: lerp(0.04, 0.16, p),
      shadowScale: lerp(0.48, 0.92, p),
      spin: p * 0.8
    };
  }

  const elapsed = time - fallDuration;
  const rollTime = Math.min(1, elapsed / rollDuration);
  const u = Math.min(1, 0.16 * rollTime + 0.84 * rollTime * rollTime);
  const position = rideCurve.getPointAt(u);
  const tangent = rideCurve.getTangentAt(u);
  position.y += Math.abs(Math.sin(elapsed * Math.PI * 2.2)) * 0.01 * (1 - rollTime);

  const landingPulse = Math.max(0, 1 - (time - fallDuration) * 4.2);

  return {
    position,
    scale: ROLL_SCALE,
    squashX: landingPulse * 0.08,
    squashY: -landingPulse * 0.12,
    shadow: 0.14,
    shadowScale: lerp(0.86, 0.72, rollTime),
    spin: (u * railLength) / (SPHERE_RADIUS * ROLL_SCALE) + tangent.x * 0.25
  };
}

function updateCamera(t, inflate, fallTime) {
  const pullback = smoothstep(0.0, 2.2, fallTime);
  camera.position.x = Math.sin(t * 0.55) * 0.08 + sphereGroup.position.x * 0.11 * pullback;
  camera.position.y = lerp(0.36, 0.58, inflate) + pullback * 1.55;
  camera.position.z = lerp(8.7, 13.4, pullback);
  cameraTarget.lerp(
    new THREE.Vector3(
      sphereGroup.position.x * pullback,
      lerp(-0.03, -1.58, pullback),
      sphereGroup.position.z * pullback
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
