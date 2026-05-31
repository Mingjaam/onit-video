import * as THREE from "three";

const stage = document.getElementById("stage");
const progressBar = document.querySelector(".progress");
const soundButton = document.querySelector(".sound-button");

const GREEN = 0x08c923;
const GREEN_LIGHT = 0x7cff8d;
const DARK = 0x030504;
const WALL = 0x101713;
const FLOOR = 0x0b100e;
const LOOP_DURATION = 15.8;

const scene = new THREE.Scene();
scene.background = new THREE.Color(DARK);
scene.fog = new THREE.FogExp2(DARK, 0.055);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(0, 1.55, 7.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const ambient = new THREE.HemisphereLight(0x739c7a, 0x020302, 0.28);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xe7ffec, 1.2);
key.position.set(-4.5, 6.5, 5.2);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 0.1;
key.shadow.camera.far = 28;
key.shadow.camera.left = -9;
key.shadow.camera.right = 9;
key.shadow.camera.top = 8;
key.shadow.camera.bottom = -7;
key.shadow.radius = 6;
scene.add(key);

const entranceGlow = new THREE.PointLight(GREEN, 1.2, 7, 2);
entranceGlow.position.set(0, 2.1, 2.1);
scene.add(entranceGlow);

const roomLight = new THREE.PointLight(0xfff4cf, 0, 12, 2);
roomLight.position.set(0, 3.3, -5.2);
roomLight.castShadow = true;
roomLight.shadow.mapSize.set(1024, 1024);
scene.add(roomLight);

const backGlow = new THREE.PointLight(GREEN_LIGHT, 0, 9, 2);
backGlow.position.set(-2.4, 1.5, -6.3);
scene.add(backGlow);

const wallMaterial = new THREE.MeshStandardMaterial({
  color: WALL,
  roughness: 0.82,
  metalness: 0.02,
  map: makeNoiseTexture("#060907", "#14211a", "#294532", 0.72)
});
wallMaterial.map.wrapS = THREE.RepeatWrapping;
wallMaterial.map.wrapT = THREE.RepeatWrapping;
wallMaterial.map.repeat.set(2, 1.3);

const floorMaterial = new THREE.MeshStandardMaterial({
  color: FLOOR,
  roughness: 0.76,
  metalness: 0.04,
  map: makeNoiseTexture("#050706", "#101812", "#1f3024", 1)
});
floorMaterial.map.wrapS = THREE.RepeatWrapping;
floorMaterial.map.wrapT = THREE.RepeatWrapping;
floorMaterial.map.repeat.set(3.2, 3.2);

const greenMaterial = new THREE.MeshPhysicalMaterial({
  color: GREEN,
  roughness: 0.34,
  metalness: 0.05,
  clearcoat: 0.62,
  clearcoatRoughness: 0.28,
  emissive: GREEN,
  emissiveIntensity: 0.16
});

const innerDarkMaterial = new THREE.MeshStandardMaterial({
  color: 0x030504,
  roughness: 0.9,
  metalness: 0
});

const doorMaterial = new THREE.MeshStandardMaterial({
  color: 0x0b100d,
  roughness: 0.72,
  metalness: 0.04
});

const litDoorMaterial = new THREE.MeshStandardMaterial({
  color: 0x151f17,
  roughness: 0.62,
  metalness: 0.04
});

const room = new THREE.Group();
scene.add(room);
buildRoom();

const portal = new THREE.Group();
portal.position.set(0, 1.72, 0);
scene.add(portal);

const frameGroup = new THREE.Group();
portal.add(frameGroup);

const iconMark = new THREE.Group();
portal.add(iconMark);

const doorPivot = new THREE.Group();
doorPivot.position.set(-0.82, 0, 0.025);
portal.add(doorPivot);

const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.64, 2.72, 0.08), doorMaterial);
doorPanel.position.set(0.82, 0, 0);
doorPanel.castShadow = true;
doorPanel.receiveShadow = true;
doorPivot.add(doorPanel);

const doorInnerGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(1.46, 2.5),
  new THREE.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: 0, depthWrite: false })
);
doorInnerGlow.position.set(0, 0, -0.035);
portal.add(doorInnerGlow);

const switchGroup = new THREE.Group();
switchGroup.position.set(1.75, 0.3, 0.08);
portal.add(switchGroup);
buildSwitch();

buildFrameBars();
buildIconMark();

const dust = buildDust();
scene.add(dust);

let audioContext = null;
let soundEnabled = false;
let lastStepIndex = -1;

soundButton.addEventListener("click", async () => {
  audioContext = audioContext || new AudioContext();
  await audioContext.resume();
  soundEnabled = true;
  soundButton.textContent = "SOUND ON";
});

const clock = new THREE.Clock();
animate();

function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime() % LOOP_DURATION;
  progressBar.style.setProperty("--progress", (t / LOOP_DURATION).toFixed(4));

  updateSequence(t);
  renderer.render(scene, camera);
}

function updateSequence(t) {
  const doorBuild = smoothstep(0.7, 3.15, t);
  const switchIn = smoothstep(2.45, 3.2, t);
  const lightOn = smoothstep(3.35, 4.15, t);
  const doorOpen = smoothstep(4.15, 6.05, t);
  const walk = smoothstep(5.75, 8.75, t);
  const turnBack = smoothstep(8.65, 10.45, t);
  const closeDoor = smoothstep(10.35, 11.65, t);
  const shrink = smoothstep(11.75, 14.4, t);

  ambient.intensity = lerp(0.25, 0.52, lightOn);
  key.intensity = lerp(0.75, 1.45, lightOn);
  entranceGlow.intensity = lerp(1.6, 2.4, doorBuild) * (1 - shrink * 0.5);
  roomLight.intensity = lerp(0, 4.8, easeOutCubic(lightOn));
  backGlow.intensity = lerp(0, 1.2, lightOn);
  doorInnerGlow.material.opacity = lerp(0.02, 0.34, lightOn) * (1 - closeDoor);
  doorPanel.material = lightOn > 0.4 ? litDoorMaterial : doorMaterial;

  const doorScaleX = lerp(0.9, 1.95, doorBuild);
  const doorScaleY = lerp(0.82, 2.65, doorBuild);
  const finalScale = lerp(1, 0.25, shrink);
  portal.scale.set(doorScaleX * finalScale, doorScaleY * finalScale, 1);
  portal.position.x = lerp(0, -2.55, shrink);
  portal.position.y = lerp(1.72, 2.15, shrink);
  portal.position.z = lerp(0, -3.05, shrink);

  frameGroup.children.forEach((bar) => {
    bar.material.opacity = lerp(1, 0.92, shrink);
  });
  iconMark.scale.setScalar(lerp(1, 0.72, doorBuild) * lerp(1, 1.55, shrink));
  iconMark.visible = shrink > 0.08 || doorBuild < 0.58;
  iconMark.position.z = 0.065;
  iconMark.children.forEach((mesh) => {
    mesh.material.opacity = Math.max(1 - smoothstep(0.35, 0.78, doorBuild), smoothstep(0.18, 0.75, shrink));
  });

  const switchEase = easeOutCubic(switchIn);
  switchGroup.scale.setScalar(switchEase);
  switchGroup.visible = switchEase > 0.01 && shrink < 0.85;
  switchGroup.rotation.z = lerp(-0.08, 0.02, switchEase);
  const lever = switchGroup.getObjectByName("switchLever");
  if (lever) lever.rotation.x = lerp(-0.42, 0.42, lightOn);

  const openAngle = lerp(0, -1.72, easeInOutCubic(doorOpen)) * (1 - closeDoor);
  doorPivot.rotation.y = openAngle;
  doorPivot.visible = shrink < 0.92;

  updateCamera(t, walk, turnBack, shrink);
  updateDust(t, lightOn, walk);
  maybePlayFootstep(t, walk);
}

function updateCamera(t, walk, turnBack, shrink) {
  const walkEase = easeInOutCubic(walk);
  const basePosition = new THREE.Vector3(
    lerp(0, 0.05, walkEase),
    lerp(1.55, 1.46, walkEase),
    lerp(7.2, -3.75, walkEase)
  );
  const baseTarget = new THREE.Vector3(
    lerp(0, 0.08, walkEase),
    lerp(1.56, 1.5, walkEase),
    lerp(0, -6.4, walkEase)
  );

  const turnEase = easeInOutCubic(turnBack);
  const backTarget = new THREE.Vector3(-2.55, 2.08, -3.05);
  baseTarget.lerp(backTarget, turnEase);
  basePosition.x += Math.sin(turnEase * Math.PI) * 0.42;

  const stepPulse = walk > 0 && walk < 1 ? Math.sin(t * 9.3) : 0;
  const drift = walk > 0 && walk < 1 ? Math.sin(t * 2.1) : 0;
  camera.position.copy(basePosition);
  camera.position.x += drift * 0.025;
  camera.position.y += Math.abs(stepPulse) * 0.026;
  camera.rotation.z = drift * 0.006;

  const microTarget = baseTarget.clone();
  microTarget.x += Math.sin(t * 4.8) * 0.018 * walk;
  microTarget.y += Math.cos(t * 5.7) * 0.012 * walk;
  camera.lookAt(microTarget);

  if (shrink > 0.92) {
    camera.position.lerp(new THREE.Vector3(0, 1.6, 6.2), smoothstep(0.92, 1, shrink));
    camera.lookAt(-2.55, 2.08, -3.05);
  }
}

function maybePlayFootstep(t, walk) {
  if (!soundEnabled || !audioContext || walk <= 0 || walk >= 1) return;
  const stepIndex = Math.floor((t - 5.75) / 0.48);
  if (stepIndex === lastStepIndex) return;
  lastStepIndex = stepIndex;
  playFootstep(audioContext.currentTime, stepIndex % 2 === 0 ? -0.18 : 0.18);
}

function playFootstep(time, panValue) {
  const duration = 0.16;
  const sampleRate = audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const p = i / data.length;
    const envelope = Math.exp(-p * 13);
    data[i] = (Math.random() * 2 - 1) * envelope;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  const lowpass = audioContext.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(260, time);
  lowpass.Q.setValueAtTime(0.8, time);
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.12, time + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  const pan = audioContext.createStereoPanner();
  pan.pan.setValueAtTime(panValue, time);

  const thump = audioContext.createOscillator();
  thump.type = "sine";
  thump.frequency.setValueAtTime(84, time);
  thump.frequency.exponentialRampToValueAtTime(43, time + 0.09);
  const thumpGain = audioContext.createGain();
  thumpGain.gain.setValueAtTime(0.0001, time);
  thumpGain.gain.exponentialRampToValueAtTime(0.05, time + 0.01);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

  source.connect(lowpass).connect(gain).connect(pan).connect(audioContext.destination);
  thump.connect(thumpGain).connect(pan);
  source.start(time);
  thump.start(time);
  thump.stop(time + 0.13);
}

function buildRoom() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(11, 15), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -2.2);
  floor.receiveShadow = true;
  room.add(floor);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(11, 5.8), wallMaterial);
  backWall.position.set(0, 2.9, -8.7);
  backWall.receiveShadow = true;
  room.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(15, 5.8), wallMaterial.clone());
  leftWall.position.set(-5.5, 2.9, -2.2);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  room.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(15, 5.8), wallMaterial.clone());
  rightWall.position.set(5.5, 2.9, -2.2);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  room.add(rightWall);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(11, 15), wallMaterial.clone());
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 5.8, -2.2);
  ceiling.receiveShadow = true;
  room.add(ceiling);

  const lamp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.58, 0.3, 48),
    new THREE.MeshStandardMaterial({ color: 0x171f18, roughness: 0.42, metalness: 0.15 })
  );
  lamp.position.set(0, 5.45, -5.2);
  lamp.castShadow = true;
  room.add(lamp);

  const lightDisk = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 48),
    new THREE.MeshBasicMaterial({ color: 0xffedc4, transparent: true, opacity: 0.24, side: THREE.DoubleSide })
  );
  lightDisk.rotation.x = Math.PI / 2;
  lightDisk.position.set(0, 5.27, -5.2);
  room.add(lightDisk);
}

function buildFrameBars() {
  const bars = [
    { name: "top", size: [1.7, 0.15, 0.12], pos: [0, 0.74, 0] },
    { name: "bottom", size: [1.25, 0.15, 0.12], pos: [-0.18, -0.74, 0] },
    { name: "left", size: [0.15, 1.48, 0.12], pos: [-0.77, 0, 0] },
    { name: "right", size: [0.15, 1.1, 0.12], pos: [0.77, 0.19, 0] },
    { name: "fold", size: [0.72, 0.15, 0.12], pos: [0.52, -0.55, 0], rot: -0.77 }
  ];
  bars.forEach((item) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...item.size), greenMaterial.clone());
    mesh.name = item.name;
    mesh.position.set(...item.pos);
    mesh.rotation.z = item.rot || 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.material.transparent = true;
    frameGroup.add(mesh);
  });

  const darkInterior = new THREE.Mesh(new THREE.BoxGeometry(1.42, 2.38, 0.04), innerDarkMaterial);
  darkInterior.position.z = -0.035;
  darkInterior.receiveShadow = true;
  frameGroup.add(darkInterior);
}

function buildIconMark() {
  const markMat = greenMaterial.clone();
  markMat.transparent = true;
  const markA = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.08), markMat);
  markA.position.set(-0.14, 0.13, 0);
  markA.rotation.z = -0.75;
  const markB = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.08), markMat.clone());
  markB.position.set(0.13, 0.13, 0);
  markB.rotation.z = 0.75;
  iconMark.add(markA, markB);
}

function buildSwitch() {
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.56, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x172019, roughness: 0.5, metalness: 0.05 })
  );
  plate.castShadow = true;
  plate.receiveShadow = true;
  switchGroup.add(plate);

  const lever = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.34, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xdfffe6, roughness: 0.36, metalness: 0.02 })
  );
  lever.name = "switchLever";
  lever.position.z = 0.055;
  lever.castShadow = true;
  switchGroup.add(lever);
  switchGroup.scale.setScalar(0);
}

function buildDust() {
  const count = 360;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 1] = Math.random() * 4 + 0.8;
    positions[i * 3 + 2] = -Math.random() * 8 - 0.3;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xcffff0,
    size: 0.018,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  return new THREE.Points(geometry, material);
}

function updateDust(t, lightOn, walk) {
  dust.material.opacity = lerp(0, 0.42, lightOn) * (1 - walk * 0.2);
  dust.rotation.y = Math.sin(t * 0.18) * 0.03;
  dust.position.y = Math.sin(t * 0.5) * 0.04;
}

function makeNoiseTexture(base, mid, accent, strength) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(420, 360, 80, 512, 512, 720);
  gradient.addColorStop(0, accent);
  gradient.addColorStop(0.48, mid);
  gradient.addColorStop(1, base);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i <= 1024; i += 128) {
    ctx.strokeStyle = `rgba(116, 255, 138, ${0.045 * strength})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(1024, i);
    ctx.stroke();
  }

  for (let i = 0; i < 1200; i++) {
    ctx.fillStyle = `rgba(255, 255, 255, ${(Math.random() * 0.025 + 0.006) * strength})`;
    ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
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
