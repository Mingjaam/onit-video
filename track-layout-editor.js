import * as THREE from "three";

const stage = document.getElementById("stage");
const output = document.getElementById("output");
const stats = document.getElementById("stats");
const selectedInput = document.getElementById("selectedInput");
const spawnBallBtn = document.getElementById("spawnBallBtn");
const xInput = document.getElementById("xInput");
const yInput = document.getElementById("yInput");
const zInput = document.getElementById("zInput");
const sizeInput = document.getElementById("sizeInput");
const labelInput = document.getElementById("labelInput");
const selectModeBtn = document.getElementById("selectModeBtn");
const addRailPointBtn = document.getElementById("addRailPointBtn");
const addXyloBtn = document.getElementById("addXyloBtn");

const SPHERE_RADIUS = 0.38;
const ROLL_SCALE = 0.9;
const RAIL_GAP = 0.58;
const RAIL_TUBE_RADIUS = 0.026;
const RAIL_CONTACT_RADIUS = SPHERE_RADIUS * ROLL_SCALE * 0.78;
const BALL_COLOR = 0x73ae4e;
const BOARD_COLOR = 0xbfc2ba;
const RED = 0xd94435;
const METAL = 0xb8bab7;
const GRAVITY = new THREE.Vector3(0, -5.8, 0);

const scene = new THREE.Scene();
scene.background = new THREE.Color(BOARD_COLOR);
scene.fog = new THREE.Fog(BOARD_COLOR, 10, 24);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
const fixedRunLookDirection = new THREE.Vector3(0, -0.28, -1).normalize();

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

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
  metalness: 0
});
const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x20251e, roughness: 0.44 });
const selectedMaterial = new THREE.MeshStandardMaterial({ color: 0xf1d75e, roughness: 0.38 });
const selectedWireMaterial = new THREE.MeshBasicMaterial({ color: 0xf1d75e, wireframe: true });
const draftMaterial = new THREE.MeshStandardMaterial({ color: 0x73ae4e, roughness: 0.38 });

const trackGroup = new THREE.Group();
const handleGroup = new THREE.Group();
const draftGroup = new THREE.Group();
const xyloGroup = new THREE.Group();
scene.add(trackGroup, handleGroup, draftGroup, xyloGroup);

const ballGroup = new THREE.Group();
const ball = new THREE.Mesh(
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
    opacity: 1
  })
);
ball.castShadow = true;
ball.receiveShadow = true;
ballGroup.add(ball);
ballGroup.scale.setScalar(ROLL_SCALE);
ballGroup.visible = false;
scene.add(ballGroup);

const rails = [];
const xylophones = [];
let runtimeRails = [];
let draftPoints = [];
let handleObjects = [];
let selected = null;
let dragging = false;
let ballState = null;
let spin = 0;
let lastTime = performance.now();
let activeTool = "select";

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const placementPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const dragPoint = new THREE.Vector3();
const placementPoint = new THREE.Vector3();

spawnBallBtn.addEventListener("click", spawnBall);
document.getElementById("resetBallBtn").addEventListener("click", removeBall);
selectModeBtn.addEventListener("click", () => setTool("select"));
addRailPointBtn.addEventListener("click", () => setTool("rail"));
document.getElementById("finishRailBtn").addEventListener("click", finishDraftRail);
document.getElementById("clearDraftBtn").addEventListener("click", clearDraft);
addXyloBtn.addEventListener("click", () => setTool("xylophone"));
document.getElementById("prevBtn").addEventListener("click", () => moveSelection(-1));
document.getElementById("nextBtn").addEventListener("click", () => moveSelection(1));
document.getElementById("deleteBtn").addEventListener("click", deleteSelected);
document.getElementById("clearBtn").addEventListener("click", clearLayout);
document.getElementById("copyBtn").addEventListener("click", copyJson);

[xInput, yInput, zInput, sizeInput, labelInput].forEach((input) => {
  input.addEventListener("input", applyInputsToSelection);
});

renderer.domElement.addEventListener("pointerdown", onPointerDown);
renderer.domElement.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("resize", resize);

resize();
refreshScene();
animate();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  if (ballState) {
    stepBall(dt);
    ballGroup.position.copy(ballState.position);
    spin += ballState.mode === "rolling" ? Math.abs(ballState.railV * dt) / (SPHERE_RADIUS * ROLL_SCALE) : dt * 1.2;
    ballGroup.rotation.x = spin;
    ballGroup.rotation.y = spin * 0.18;
  }

  updateCamera();
  renderer.render(scene, camera);
  updateStats();
}

function spawnBall() {
  if (ballState) return;

  ballState = {
    mode: "falling",
    position: new THREE.Vector3(-0.45, 0.7, -0.1),
    velocity: new THREE.Vector3(0.2, -0.2, 0.04),
    railIndex: -1,
    railS: 0,
    railV: 0
  };
  spin = 0;
  ballGroup.visible = true;
  ballGroup.position.copy(ballState.position);
  spawnBallBtn.disabled = true;
  spawnBallBtn.textContent = "Ball Active";
}

function removeBall() {
  ballState = null;
  spin = 0;
  ballGroup.visible = false;
  spawnBallBtn.disabled = false;
  spawnBallBtn.textContent = "Spawn Ball";
}

function stepBall(dt) {
  if (ballState.mode === "rolling") {
    const rail = runtimeRails[ballState.railIndex];
    const tangent = railTangentAtDistance(rail, ballState.railS);
    const downhill = GRAVITY.dot(tangent);
    ballState.railV += (downhill - ballState.railV * 0.08) * dt;
    ballState.railS += ballState.railV * dt;

    if (ballState.railS >= rail.length) {
      ballState.position.copy(pointOnRail(rail, rail.length));
      ballState.velocity.copy(tangent).multiplyScalar(Math.max(ballState.railV, 0.6));
      ballState.velocity.y -= 0.15;
      ballState.mode = "falling";
      ballState.railIndex = -1;
      return;
    }

    ballState.position.copy(pointOnRail(rail, ballState.railS));
    return;
  }

  const previous = ballState.position.clone();
  ballState.velocity.addScaledVector(GRAVITY, dt);
  ballState.position.addScaledVector(ballState.velocity, dt);

  const hit = findRailHit(previous, ballState.position, ballState.railIndex);
  if (hit) {
    ballState.mode = "rolling";
    ballState.railIndex = hit.index;
    ballState.railS = hit.s;
    ballState.position.copy(hit.position);
    ballState.railV = Math.max(0.25, ballState.velocity.dot(railTangentAtDistance(hit.rail, hit.s)));
    ballState.velocity.set(0, 0, 0);
  }

  if (ballState.position.y < -9.2) removeBall();
}

function findRailHit(previous, current, ignoredIndex) {
  const samples = 8;
  let best = null;

  for (let i = 0; i < runtimeRails.length; i++) {
    if (i === ignoredIndex) continue;
    const rail = runtimeRails[i];
    for (let sample = 1; sample <= samples; sample++) {
      const swept = previous.clone().lerp(current, sample / samples);
      const closest = closestPointOnRail(swept, rail);
      const ridePoint = pointOnRail(rail, closest.s);
      const distance = swept.distanceTo(ridePoint);
      const crossedDownward = previous.y >= ridePoint.y - 0.08 && current.y <= ridePoint.y + 0.1;
      const movingDown = current.y <= previous.y + 0.02;
      if (!movingDown || !crossedDownward || distance > RAIL_CONTACT_RADIUS) continue;

      const candidate = { index: i, s: closest.s, rail, position: ridePoint, distance };
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

  return { s: bestT * rail.length, distance: bestDistance };
}

function pointOnRail(rail, s) {
  return ridePointForRail(rail, Math.max(0, Math.min(1, s / rail.length)));
}

function ridePointForRail(rail, t) {
  return rail.curve.getPointAt(t).add(new THREE.Vector3(0, 0, SPHERE_RADIUS * ROLL_SCALE * 0.2));
}

function railTangentAtDistance(rail, s) {
  const t = Math.max(0, Math.min(1, s / rail.length));
  return rail.curve.getTangentAt(t).normalize();
}

function setTool(nextTool) {
  activeTool = nextTool;
  selectModeBtn.classList.toggle("active", activeTool === "select");
  addRailPointBtn.classList.toggle("active", activeTool === "rail");
  addXyloBtn.classList.toggle("active", activeTool === "xylophone");
}

function addRailPointAt(point) {
  draftPoints.push(roundPoint(point));
  rebuildDraft();
  exportLayout();
}

function finishDraftRail() {
  if (draftPoints.length < 2) return;
  rails.push({
    points: draftPoints.map((point) => ({ ...point })),
    beat: rails.length + 1
  });
  draftPoints = [];
  selected = { type: "railPoint", railIndex: rails.length - 1, pointIndex: 0 };
  refreshScene();
}

function clearDraft() {
  draftPoints = [];
  rebuildDraft();
  exportLayout();
}

function addXylophoneAt(position) {
  xylophones.push({
    position: roundPoint(position),
    rotationY: 0,
    size: 1,
    label: ["VOICE", "PRD", "iOS", "SYNC"][xylophones.length % 4],
    beat: xylophones.length + 1
  });
  selected = { type: "xylophone", index: xylophones.length - 1 };
  refreshScene();
}

function refreshScene() {
  runtimeRails = rails.map((rail) => makeRuntimeRail(rail.points));
  clearGroup(trackGroup);
  clearGroup(handleGroup);
  clearGroup(xyloGroup);
  handleObjects = [];

  runtimeRails.forEach((rail, index) => {
    addParallelRails(rail.curve);
    addRailPointHandles(rails[index], index);
  });
  xylophones.forEach((item, index) => addXylophone(item, index));
  rebuildDraft();
  syncInputs();
  exportLayout();
}

function rebuildDraft() {
  clearGroup(draftGroup);
  draftPoints.forEach((point, index) => {
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.06, 18, 18), draftMaterial);
    marker.position.set(point.x, point.y, point.z);
    draftGroup.add(marker);
    if (index > 0) {
      const rail = makeRuntimeRail(draftPoints.slice(index - 1, index + 1));
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(rail.curve, 24, RAIL_TUBE_RADIUS, 8, false), draftMaterial);
      draftGroup.add(mesh);
    }
  });
}

function makeRuntimeRail(points) {
  const vectors = points.map((point) => new THREE.Vector3(point.x, point.y, point.z));
  const curve = vectors.length > 2
    ? new THREE.CatmullRomCurve3(vectors, false, "catmullrom", 0.5)
    : new THREE.LineCurve3(vectors[0], vectors[1]);
  curve.arcLengthDivisions = 160;
  return {
    points: vectors,
    curve,
    length: Math.max(0.001, curve.getLength())
  };
}

function addParallelRails(curve) {
  const samples = 90;
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

  trackGroup.add(railMesh(new THREE.CatmullRomCurve3(left)));
  trackGroup.add(railMesh(new THREE.CatmullRomCurve3(right)));
}

function railMesh(curve) {
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 90, RAIL_TUBE_RADIUS, 10, false),
    metalMaterial.clone()
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addRailPointHandles(rail, railIndex) {
  rail.points.forEach((point, pointIndex) => {
    const isSelected = selected
      && selected.type === "railPoint"
      && selected.railIndex === railIndex
      && selected.pointIndex === pointIndex;
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 18, 18),
      isSelected ? selectedMaterial : handleMaterial
    );
    marker.position.set(point.x, point.y, point.z);
    marker.userData.selection = { type: "railPoint", railIndex, pointIndex };
    marker.castShadow = true;
    handleGroup.add(marker);
    handleObjects.push(marker);
  });
}

function addXylophone(item, index) {
  const group = new THREE.Group();
  group.position.set(item.position.x, item.position.y, item.position.z);
  group.rotation.y = item.rotationY || 0;
  group.scale.setScalar(item.size || 1);
  group.userData.selection = { type: "xylophone", index };

  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.42, 0.08), redMaterial.clone());
  frame.castShadow = true;
  frame.receiveShadow = true;
  group.add(frame);

  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.28, 0.09), screenMaterial.clone());
  screen.position.z = 0.01;
  screen.castShadow = true;
  screen.material.map = makeMarkTexture(item.label || "ON");
  screen.material.needsUpdate = true;
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

  if (selected && selected.type === "xylophone" && selected.index === index) {
    const outline = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.56, 0.22), selectedWireMaterial);
    group.add(outline);
  }

  xyloGroup.add(group);
  handleObjects.push(group);
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

function onPointerDown(event) {
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(handleObjects, true);
  if (intersects.length) {
    const target = findSelectable(intersects[0].object);
    if (!target) return;
    selected = target.userData.selection;
    dragging = true;
    renderer.domElement.classList.add("dragging");
    refreshScene();
    return;
  }

  const point = pointerToPlacementPoint();
  if (!point) return;

  if (activeTool === "rail") {
    addRailPointAt(point);
    return;
  }

  if (activeTool === "xylophone") {
    addXylophoneAt(point);
    setTool("select");
  }
}

function onPointerMove(event) {
  if (!dragging || !selected) return;
  const target = selectedPoint();
  if (!target) return;

  updatePointer(event);
  dragPlane.constant = -target.z;
  raycaster.setFromCamera(pointer, camera);
  if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;

  target.x = roundNumber(dragPoint.x);
  target.y = roundNumber(dragPoint.y);
  target.z = roundNumber(dragPoint.z);
  refreshScene();
}

function onPointerUp() {
  dragging = false;
  renderer.domElement.classList.remove("dragging");
}

function updatePointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function pointerToPlacementPoint() {
  raycaster.setFromCamera(pointer, camera);
  return raycaster.ray.intersectPlane(placementPlane, placementPoint)
    ? placementPoint.clone()
    : null;
}

function findSelectable(object) {
  let current = object;
  while (current && !current.userData.selection) current = current.parent;
  return current;
}

function selectedPoint() {
  if (!selected) return null;
  if (selected.type === "railPoint") return rails[selected.railIndex]?.points[selected.pointIndex] || null;
  if (selected.type === "xylophone") return xylophones[selected.index]?.position || null;
  return null;
}

function syncInputs() {
  const point = selectedPoint();
  const xylo = selected?.type === "xylophone" ? xylophones[selected.index] : null;
  selectedInput.value = selected ? selectionLabel(selected) : "none";
  [xInput, yInput, zInput, sizeInput, labelInput].forEach((input) => {
    input.disabled = !point;
  });

  if (!point) {
    xInput.value = "";
    yInput.value = "";
    zInput.value = "";
    sizeInput.value = "";
    labelInput.value = "";
    return;
  }

  xInput.value = point.x;
  yInput.value = point.y;
  zInput.value = point.z;
  sizeInput.disabled = !xylo;
  labelInput.disabled = !xylo;
  sizeInput.value = xylo ? xylo.size : "";
  labelInput.value = xylo ? xylo.label : "";
}

function applyInputsToSelection() {
  const point = selectedPoint();
  if (!point) return;
  point.x = Number(xInput.value || point.x);
  point.y = Number(yInput.value || point.y);
  point.z = Number(zInput.value || point.z);

  if (selected.type === "xylophone") {
    const xylo = xylophones[selected.index];
    xylo.size = Math.max(0.35, Number(sizeInput.value || xylo.size));
    xylo.label = labelInput.value || xylo.label;
  }

  refreshScene();
}

function moveSelection(offset) {
  const items = selectionItems();
  if (!items.length) return;
  const current = selected ? items.findIndex((item) => sameSelection(item, selected)) : -1;
  const next = (current + offset + items.length) % items.length;
  selected = items[next];
  refreshScene();
}

function selectionItems() {
  const items = [];
  rails.forEach((rail, railIndex) => {
    rail.points.forEach((_, pointIndex) => items.push({ type: "railPoint", railIndex, pointIndex }));
  });
  xylophones.forEach((_, index) => items.push({ type: "xylophone", index }));
  return items;
}

function deleteSelected() {
  if (!selected) return;
  if (selected.type === "railPoint") {
    const rail = rails[selected.railIndex];
    if (rail) {
      rail.points.splice(selected.pointIndex, 1);
      if (rail.points.length < 2) rails.splice(selected.railIndex, 1);
    }
  } else if (selected.type === "xylophone") {
    xylophones.splice(selected.index, 1);
  }
  selected = null;
  refreshScene();
}

function clearLayout() {
  rails.length = 0;
  xylophones.length = 0;
  draftPoints = [];
  selected = null;
  refreshScene();
}

async function copyJson() {
  await navigator.clipboard.writeText(output.value);
  const button = document.getElementById("copyBtn");
  button.textContent = "Copied";
  setTimeout(() => (button.textContent = "Copy JSON"), 700);
}

function exportLayout() {
  const data = {
    coordinateSystem: {
      description: "Same Three.js camera, ball radius, gravity, and scale as the video preview. Rails are curve centerlines.",
      ball: {
        radius: SPHERE_RADIUS,
        scale: ROLL_SCALE,
        gravity: { x: GRAVITY.x, y: GRAVITY.y, z: GRAVITY.z }
      }
    },
    rails: rails.map((rail, index) => ({
      points: rail.points.map((point) => ({ ...point })),
      start: { ...rail.points[0] },
      end: { ...rail.points[rail.points.length - 1] },
      beat: rail.beat || index + 1
    })),
    xylophones: xylophones.map((item, index) => ({
      position: { ...item.position },
      rotationY: item.rotationY || 0,
      size: item.size || 1,
      label: item.label,
      beat: item.beat || index + 1
    }))
  };
  output.value = JSON.stringify(data, null, 2);
}

function updateStats() {
  const ballText = ballState
    ? `ball ${ballState.position.x.toFixed(2)}, ${ballState.position.y.toFixed(2)}, ${ballState.position.z.toFixed(2)}`
    : "ball not spawned";
  stats.textContent = `tool ${activeTool} | ${rails.length} rails, ${draftPoints.length} draft points, ${xylophones.length} xylophones | ${ballText}`;
}

function updateCamera() {
  const ballPosition = ballState ? ballState.position : new THREE.Vector3(-0.45, 0.7, -0.1);
  camera.position.x = -1.15 + ballPosition.x * 0.18;
  camera.position.y = 3.65 + ballPosition.y * 0.62;
  camera.position.z = 10.6;
  camera.lookAt(camera.position.clone().add(fixedRunLookDirection));
}

function clearGroup(group) {
  while (group.children.length) group.remove(group.children[0]);
}

function sameSelection(a, b) {
  return a.type === b.type
    && a.index === b.index
    && a.railIndex === b.railIndex
    && a.pointIndex === b.pointIndex;
}

function selectionLabel(item) {
  if (item.type === "railPoint") return `rail ${item.railIndex + 1} point ${item.pointIndex + 1}`;
  if (item.type === "xylophone") return `xylophone ${item.index + 1}`;
  return "none";
}

function roundPoint(point) {
  return {
    x: roundNumber(point.x),
    y: roundNumber(point.y),
    z: roundNumber(point.z)
  };
}

function roundNumber(value) {
  return Number(value.toFixed(2));
}

function resize() {
  const rect = stage.getBoundingClientRect();
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(rect.width, rect.height);
}
