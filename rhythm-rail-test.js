import * as THREE from "three";

const container = document.getElementById("stage");
const progress = document.querySelector(".progress");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f6f0);
scene.fog = new THREE.Fog(0xf4f6f0, 9, 24);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0.3, 4.4, 9.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xffffff, 0xc7d3bd, 1.55);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffffff, 3.7);
key.position.set(-4.5, 7.0, 5.2);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 0.1;
key.shadow.camera.far = 24;
key.shadow.camera.left = -8;
key.shadow.camera.right = 8;
key.shadow.camera.top = 8;
key.shadow.camera.bottom = -8;
key.shadow.radius = 6;
scene.add(key);

const rim = new THREE.PointLight(0xa6ef7b, 6.5, 13);
rim.position.set(3.2, 4.2, 3.4);
scene.add(rim);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(22, 16),
  new THREE.MeshStandardMaterial({
    color: 0xf0f3eb,
    roughness: 0.84,
    metalness: 0.0
  })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2.12;
floor.receiveShadow = true;
scene.add(floor);

const green = 0x73ae4e;
const railMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x2c3b2b,
  roughness: 0.32,
  metalness: 0.58,
  clearcoat: 0.5,
  clearcoatRoughness: 0.24
});
const activeRailMaterial = new THREE.MeshPhysicalMaterial({
  color: green,
  roughness: 0.36,
  metalness: 0.18,
  clearcoat: 0.55,
  clearcoatRoughness: 0.28
});
const padMaterial = new THREE.MeshPhysicalMaterial({
  color: green,
  roughness: 0.42,
  metalness: 0.08,
  clearcoat: 0.45,
  clearcoatRoughness: 0.25
});
const mutedPadMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xd9e5d2,
  roughness: 0.7,
  metalness: 0.0
});

const tracks = [
  makeTrack([
    [-4.5, 1.6, -1.9],
    [-3.0, 0.95, -1.55],
    [-1.55, 0.45, -1.0],
    [-0.2, 0.1, -0.5]
  ]),
  makeTrack([
    [-0.15, 0.1, -0.5],
    [0.95, 0.86, -0.65],
    [2.15, 0.18, -0.3],
    [3.28, -0.42, 0.05]
  ]),
  makeTrack([
    [3.28, -0.42, 0.05],
    [1.92, -0.92, 0.48],
    [0.38, -1.22, 0.88],
    [-1.06, -0.78, 1.22]
  ]),
  makeTrack([
    [-1.06, -0.78, 1.22],
    [-0.05, 0.0, 1.44],
    [1.08, -0.18, 1.25],
    [2.1, -1.0, 1.58]
  ])
];

tracks.forEach((track, index) => {
  const rail = new THREE.Mesh(
    new THREE.TubeGeometry(track.curve, 80, 0.035, 12, false),
    index === 0 ? activeRailMaterial.clone() : railMaterial.clone()
  );
  rail.castShadow = true;
  rail.receiveShadow = true;
  scene.add(rail);
  track.rail = rail;

  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.4, 0.08, 48),
    mutedPadMaterial.clone()
  );
  pad.position.copy(track.end);
  pad.position.y -= 0.08;
  pad.castShadow = true;
  pad.receiveShadow = true;
  scene.add(pad);
  track.pad = pad;
});

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.26, 64, 64),
  new THREE.MeshPhysicalMaterial({
    color: green,
    roughness: 0.46,
    metalness: 0.02,
    clearcoat: 0.6,
    clearcoatRoughness: 0.32
  })
);
ball.castShadow = true;
ball.receiveShadow = true;
scene.add(ball);

const trailGroup = new THREE.Group();
scene.add(trailGroup);
const trailDots = Array.from({ length: 18 }, (_, i) => {
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.035 * (1 - i / 24), 16, 16),
    new THREE.MeshBasicMaterial({
      color: green,
      transparent: true,
      opacity: 0.18 * (1 - i / 18),
      depthWrite: false
    })
  );
  trailGroup.add(dot);
  return dot;
});
const trailPositions = [];

const labels = [
  { text: "VOICE", pos: new THREE.Vector3(-0.2, 0.52, -0.5) },
  { text: "PRD", pos: new THREE.Vector3(3.28, 0.08, 0.05) },
  { text: "iOS", pos: new THREE.Vector3(-1.06, -0.24, 1.22) },
  { text: "ON-IT", pos: new THREE.Vector3(2.1, -0.42, 1.58) }
].map(makeSpriteLabel);
labels.forEach((label) => scene.add(label));

const clock = new THREE.Clock();
const segmentDuration = 1.08;
const transferDuration = 0.34;
const loopDuration = tracks.length * (segmentDuration + transferDuration) + 1.0;

animate();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime() % loopDuration;
  progress.style.setProperty("--progress", (t / loopDuration).toFixed(4));

  const phaseLength = segmentDuration + transferDuration;
  const rawIndex = Math.min(tracks.length - 1, Math.floor(t / phaseLength));
  const phaseTime = t - rawIndex * phaseLength;
  const track = tracks[rawIndex];
  const nextTrack = tracks[Math.min(rawIndex + 1, tracks.length - 1)];

  let position;
  let impact = 0;

  if (phaseTime <= segmentDuration) {
    const u = easeInOutCubic(phaseTime / segmentDuration);
    position = track.curve.getPointAt(u);
    const tangent = track.curve.getTangentAt(u);
    ball.rotation.z -= 0.18 + Math.abs(tangent.x) * 0.08;
    ball.rotation.x += 0.16 + Math.abs(tangent.z) * 0.06;
  } else {
    const jump = (phaseTime - segmentDuration) / transferDuration;
    const j = easeOutCubic(jump);
    const start = track.end;
    const end = nextTrack.start;
    const arc = Math.sin(jump * Math.PI) * 0.52;
    position = new THREE.Vector3().lerpVectors(start, end, j);
    position.y += arc;
    impact = 1 - Math.abs(jump - 0.5) * 2;
    ball.rotation.x += 0.24;
    ball.rotation.z -= 0.14;
  }

  ball.position.copy(position);
  const squash = Math.max(0, Math.sin((phaseTime / phaseLength) * Math.PI * 2)) * 0.025;
  ball.scale.set(1 + squash, 1 - squash * 0.8, 1 + squash);

  trailPositions.unshift(position.clone());
  if (trailPositions.length > trailDots.length) trailPositions.pop();
  trailDots.forEach((dot, index) => {
    const p = trailPositions[index] || position;
    dot.position.copy(p);
    dot.material.opacity = 0.16 * (1 - index / trailDots.length);
  });

  tracks.forEach((item, index) => {
    const active = index === rawIndex || (phaseTime > segmentDuration && index === rawIndex + 1);
    item.rail.material.color.lerp(new THREE.Color(active ? green : 0x2c3b2b), 0.15);
    const hit = index === rawIndex && phaseTime > segmentDuration - 0.12 ? 1 : 0;
    const pulse = active ? 1 + hit * 0.22 + impact * 0.1 : 1;
    item.pad.scale.set(pulse, 1, pulse);
    item.pad.material.color.lerp(new THREE.Color(active ? green : 0xd9e5d2), 0.18);
  });

  labels.forEach((label, index) => {
    const isActive = index === rawIndex;
    label.material.opacity = lerp(label.material.opacity, isActive ? 0.95 : 0.34, 0.12);
    label.scale.setScalar(lerp(label.scale.x, isActive ? 0.84 : 0.72, 0.12));
  });

  const lookTarget = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, -0.3, 0), ball.position, 0.25);
  camera.position.x = lerp(camera.position.x, ball.position.x * 0.12 + 0.2, 0.035);
  camera.position.y = lerp(camera.position.y, 4.2 + ball.position.y * 0.08, 0.035);
  camera.lookAt(lookTarget);

  renderer.render(scene, camera);
}

function makeTrack(points) {
  const vectors = points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const curve = new THREE.CatmullRomCurve3(vectors);
  curve.curveType = "catmullrom";
  curve.tension = 0.55;
  return {
    curve,
    start: vectors[0].clone(),
    end: vectors[vectors.length - 1].clone()
  };
}

function makeSpriteLabel({ text, pos }) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  roundRect(ctx, 80, 42, 352, 76, 38);
  ctx.fill();
  ctx.strokeStyle = "rgba(115,174,78,0.42)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#20311e";
  ctx.font = "900 44px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 81);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.34,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(pos);
  sprite.scale.set(1.5, 0.47, 1);
  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
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
