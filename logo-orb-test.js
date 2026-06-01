import * as THREE from "three";

const container = document.getElementById("stage");
const progressBar = document.querySelector(".progress");
const letters = [...document.querySelectorAll(".clay-letter")];
const clayCircle = document.querySelector(".clay-circle");
const orbPath = document.getElementById("orbPath");
const orbShadow = document.querySelector(".orb-shadow");
const orbRipple = document.querySelector(".orb-ripple");
const stageCaption = document.querySelector(".stage-caption");

const SPHERE_RADIUS = 0.38;
const ROLL_SCALE = 0.9;
const RAIL_GAP = 0.58;
const RAIL_TUBE_RADIUS = 0.026;
const RAIL_CONTACT_RADIUS = SPHERE_RADIUS * ROLL_SCALE * 0.72;
const FLOOR_Y = -2.42;
const FLOOR_CONTACT_Y = FLOOR_Y + (SPHERE_RADIUS * ROLL_SCALE);
const MORPH_START_Y = 0.44;
const SHAPE_POINT_COUNT = 88;
const IPHONE_ASPECT_RATIO = 159.9 / 76.7;
const BALL_COLOR = 0x08c923;
const BOARD_COLOR = 0x050807;
const RED = 0xd94435;
const METAL = 0xb8bab7;
const IPHONE_ASSET_URL = "./assets/iphone_16_-_free.glb";
const MACBOOK_ASSET_URL = "./assets/macbook_pro_14_inch_M5.glb";
const IPAD_ASSET_URL = "./assets/apple_ipad_pro.glb?v=ipad-centered-v2";
const WS_PHONE_VIDEO_URL = "./assets/웹소켓폰.mp4";
const WS_IPAD_VIDEO_URL = "./assets/웹소켓아이패드2.mp4";
const WS_MAC_VIDEO_URL = "./assets/웹소켓맥.mp4";
const VOICE_VIDEO_URL = "./assets/음성.mp4";
const PRD_VIDEO_URL = "./assets/PRD.mp4";
const PRD_SKIP_START = 6;
const PRD_SKIP_END = 137;
const WS_SCENE_DURATION = 26.25;
const VOICE_SCENE_DURATION = 7.1;
const PRD_SCENE_DURATION = 36.75;
const PHONE_FADE_START = 11.85;
const PHONE_FADE_END = 13.35;
const PHONE_IMAGE_INTERVAL = 0.75;
const PHONE_APP_NAME = "on-it";
const PHONE_TYPE_START = PHONE_FADE_END + 0.25;
const PHONE_TYPE_INTERVAL = 0.16;
const PHONE_CURSOR_ENTER_START = PHONE_TYPE_START + 0.22;
const PHONE_CURSOR_CLICK_TIME = PHONE_TYPE_START + 1.28;
const PHONE_SPIN_DURATION = 3.0;
const PHONE_IMAGE_SEQUENCE_START = PHONE_CURSOR_CLICK_TIME + PHONE_SPIN_DURATION * 0.5;
const LAPTOP_SLIDE_START = PHONE_CURSOR_CLICK_TIME + 0.06;
const LAPTOP_SLIDE_DURATION = PHONE_CURSOR_CLICK_TIME + PHONE_SPIN_DURATION - LAPTOP_SLIDE_START;
const IPAD_SLIDE_START = LAPTOP_SLIDE_START;
const IPAD_SLIDE_DURATION = LAPTOP_SLIDE_DURATION;
const IPAD_LANDSCAPE_ROTATION = Math.PI / 2;
const LINEUP_READY_TIME = LAPTOP_SLIDE_START + LAPTOP_SLIDE_DURATION;
const DEVICE_CAPTION_TEXT = "Mobile Application Published";
const DEVICE_CAPTION_START = LINEUP_READY_TIME + 0.45;
const DEVICE_CAPTION_INTERVAL = 0.055;
const DEVICE_CAPTION_END = DEVICE_CAPTION_START + (DEVICE_CAPTION_TEXT.length * DEVICE_CAPTION_INTERVAL);
const MACBOOK_SCENE_START = LINEUP_READY_TIME + WS_SCENE_DURATION + 0.35;
const DEVICE_SCENE_TRANSITION_DURATION = 1.25;
const SECOND_MACBOOK_REVEAL_START = MACBOOK_SCENE_START + 0.1;
const SECOND_MACBOOK_REVEAL_DURATION = 1.2;
const VOICE_VIDEO_START = SECOND_MACBOOK_REVEAL_START + SECOND_MACBOOK_REVEAL_DURATION;
const PRD_SCENE_START = VOICE_VIDEO_START + VOICE_SCENE_DURATION + 0.35;
const PRD_SCENE_TRANSITION_DURATION = 1.35;
const LOOP_DURATION = 3.35 + PRD_SCENE_START + PRD_SCENE_TRANSITION_DURATION + PRD_SCENE_DURATION + 1.2;
const PHONE_HOME_ICON_U = 0.5;
const PHONE_HOME_ICON_V = 0.42;
const PHONE_HOME_ICON_SIZE = 0.24;
const PHONE_ICON_MATERIALIZE_START = PHONE_FADE_END + 0.08;
const PHONE_ICON_MATERIALIZE_END = PHONE_ICON_MATERIALIZE_START + 0.5;
const PHONE_SCREEN_IMAGE_URLS = [
  "./assets/img/IMG_5928.PNG",
  "./assets/img/IMG_5929.PNG",
  "./assets/img/IMG_5930.PNG",
  "./assets/img/IMG_5931.PNG",
  "./assets/img/IMG_5932.PNG"
];
const BALL_RETURN_START = 3.85;
const BALL_RETURN_DURATION = 1.3;
const BALL_RETURN_END = BALL_RETURN_START + BALL_RETURN_DURATION;

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
scene.fog = new THREE.FogExp2(BOARD_COLOR, 0.018);

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.36, 8.7);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.32;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const phoneIntroScreen = makePhoneIntroScreenTexture();
const phoneScreenTextures = loadPhoneScreenTextures();
const phoneScreenMaterials = [];
const laptopScreenMaterials = [];
const secondLaptopScreenMaterials = [];
const ipadScreenMaterials = [];
const screenVideos = {
  wsPhone: makeScreenVideo(WS_PHONE_VIDEO_URL),
  wsIpad: makeScreenVideo(WS_IPAD_VIDEO_URL, {
    rotation: Math.PI * 1.5
  }),
  wsMac: makeScreenVideo(WS_MAC_VIDEO_URL),
  voice: makeScreenVideo(VOICE_VIDEO_URL),
  prd: makeScreenVideo(PRD_VIDEO_URL, {
    skipStart: PRD_SKIP_START,
    skipEnd: PRD_SKIP_END
  })
};
let currentPhoneScreenMapKey = "";
let currentDeviceScreenStage = "";
let phoneScreenIconLocal = null;
let phoneScreenIconRadius = 0.09;

const hemi = new THREE.HemisphereLight(0xeaffef, 0x172018, 0.74);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xf4fff7, 4.65);
key.position.set(-4.2, 6.4, 5.8);
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

const soft = new THREE.PointLight(0xcfffe0, 3.0, 13, 2);
soft.position.set(3.9, 2.2, 3.8);
scene.add(soft);

const rim = new THREE.PointLight(0x8effb4, 2.25, 12, 2);
rim.position.set(-3.6, -1.2, 2.7);
scene.add(rim);

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

const roomGroup = new THREE.Group();
scene.add(roomGroup);

const phoneRig = new THREE.Group();
phoneRig.visible = false;
scene.add(phoneRig);
loadPhoneAsset();

const laptopRig = new THREE.Group();
laptopRig.visible = false;
scene.add(laptopRig);
loadLaptopAsset(laptopRig);

const secondLaptopRig = new THREE.Group();
secondLaptopRig.visible = false;
scene.add(secondLaptopRig);
loadLaptopAsset(secondLaptopRig);

const ipadRig = new THREE.Group();
ipadRig.visible = false;
scene.add(ipadRig);
let ipadAssetLoaded = false;
loadIpadAsset();

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
    opacity: 0,
    depthWrite: false
  })
);
sphere.visible = false;
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
const frameShape = makeRoundedFrameShape();
const logoShape = makeOnitLogoShape();
const iphoneShape = makeIphoneShape();
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
  const logoMorph = smoothstep(5.65, 10.85, runTime);
  const phoneFade = smoothstep(PHONE_FADE_START, PHONE_FADE_END, runTime);

  updateBall(t, dropReady, runTime, circleIn, logoMorph);
  updatePhone(runTime, phoneFade, t);
  updateLaptop(runTime);
  updateSecondLaptop(runTime);
  updateIpad(runTime);
  updateStageCaption(runTime);
  updateDeviceScreenVideos(runTime);
  updateCamera(t, runTime);
  updateClayLogo(t, gather, circleIn, logoOut, logoMorph, phoneFade, runTime);

  renderer.render(scene, camera);
}

function updateClayLogo(t, gather, circleIn, logoOut, logoMorph, phoneFade, runTime) {
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
  updateOrbShape(logoMorph, 0);
  const iconLanding = smoothstep(PHONE_FADE_START, PHONE_FADE_END, runTime);
  if (phoneFade > 0.001) syncClayCircleToPhoneIcon(iconLanding);
  else syncClayCircleToSphere(0);

  const landedOnScreen = smoothstep(PHONE_ICON_MATERIALIZE_START, PHONE_ICON_MATERIALIZE_END, runTime);
  clayCircle.style.opacity = (circleOpacity * (1 - landedOnScreen)).toFixed(3);
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
      motion.scale * (1 + motion.squash * 0.035),
      motion.scale * (1 - motion.squash * 0.045),
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
  const dt = 1 / 120;
  const gravity = new THREE.Vector3(0, -7.35, 0);
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
    restTime: 0
  };

  let remaining = Math.min(time, BALL_RETURN_START);
  while (remaining > 0) {
    const step = Math.min(dt, remaining);
    stepPhysics(state, step, gravity);
    remaining -= step;
  }

  const lift = smoothstep(BALL_RETURN_START, BALL_RETURN_END, time);
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

  if (state.position.y <= FLOOR_CONTACT_Y && state.velocity.y < 0) {
    state.position.y = FLOOR_CONTACT_Y;
    const bouncePower = Math.abs(state.velocity.y);
    if (bouncePower > 0.28) {
      const restitution = 0.56;
      state.velocity.y = bouncePower * restitution;
      state.velocity.x = 0;
      state.velocity.z = 0;
      state.squash = Math.min(0.72, 0.18 + bouncePower * 0.035);
      state.impact = Math.min(0.72, 0.24 + bouncePower * 0.052);
      state.restTime = 0;
    } else {
      state.velocity.set(0, 0, 0);
      state.squash = Math.max(state.squash, 0.08);
      state.impact = Math.max(state.impact, 0.12);
      state.restTime += dt;
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

function syncClayCircleToSphere(centerOverride = 0) {
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
  const displayX = lerp(centerPx.x, window.innerWidth / 2, centerOverride);
  const displayY = lerp(centerPx.y, window.innerHeight / 2, centerOverride);
  const bottomY = centerPx.y + radiusPx;
  const floorDistance = Math.max(0, Math.min(1, Math.abs(floorPx.y - bottomY) / Math.max(1, diameter * 2.2)));
  const contact = 1 - floorDistance;

  clayCircle.style.left = `${displayX.toFixed(2)}px`;
  clayCircle.style.top = `${displayY.toFixed(2)}px`;
  clayCircle.style.width = `${diameter.toFixed(2)}px`;
  clayCircle.style.height = `${diameter.toFixed(2)}px`;
  clayCircle.style.clipPath = "none";

  orbShadow.style.left = `${floorPx.x.toFixed(2)}px`;
  orbShadow.style.top = `${floorPx.y.toFixed(2)}px`;
  orbShadow.style.width = `${(diameter * (0.48 + contact * 0.42)).toFixed(2)}px`;
  orbShadow.style.height = `${(diameter * (0.09 + contact * 0.04)).toFixed(2)}px`;
  orbShadow.style.opacity = "0";

  const rippleStrength = lastImpact;
  const rippleSize = diameter * (1.05 + rippleStrength * 3.2);
  orbRipple.style.left = `${floorPx.x.toFixed(2)}px`;
  orbRipple.style.top = `${floorPx.y.toFixed(2)}px`;
  orbRipple.style.width = `${rippleSize.toFixed(2)}px`;
  orbRipple.style.height = `${(rippleSize * 0.36).toFixed(2)}px`;
  orbRipple.style.opacity = "0";
}

function syncClayCircleToPhoneIcon(progress) {
  sphereGroup.updateWorldMatrix(true, false);

  const startCenter = new THREE.Vector3(0, 0, 0);
  const startEdge = new THREE.Vector3(SPHERE_RADIUS, 0, 0);
  sphereGroup.localToWorld(startCenter);
  sphereGroup.localToWorld(startEdge);

  const startPx = projectToScreen(startCenter);
  const startEdgePx = projectToScreen(startEdge);
  const startDiameter = Math.max(1, Math.hypot(startEdgePx.x - startPx.x, startEdgePx.y - startPx.y) * 2);
  const target = projectPhoneIconMetrics();
  const eased = easeInOutCubic(progress);
  const diameter = lerp(startDiameter, target.diameter, eased);

  clayCircle.style.left = `${lerp(startPx.x, target.x, eased).toFixed(2)}px`;
  clayCircle.style.top = `${lerp(startPx.y, target.y, eased).toFixed(2)}px`;
  clayCircle.style.width = `${diameter.toFixed(2)}px`;
  clayCircle.style.height = `${diameter.toFixed(2)}px`;
  clayCircle.style.clipPath = "none";
  orbShadow.style.opacity = "0";
  orbRipple.style.opacity = "0";
}

function projectPhoneIconMetrics() {
  if (!phoneScreenIconLocal) {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 - Math.min(window.innerHeight, window.innerWidth) * 0.04,
      diameter: Math.max(34, Math.min(window.innerHeight, window.innerWidth) * 0.075)
    };
  }

  phoneRig.updateWorldMatrix(true, true);
  const center = phoneScreenIconLocal.clone();
  const edge = phoneScreenIconLocal.clone().add(new THREE.Vector3(phoneScreenIconRadius, 0, 0));
  phoneRig.localToWorld(center);
  phoneRig.localToWorld(edge);

  const centerPx = projectToScreen(center);
  const edgePx = projectToScreen(edge);
  return {
    x: centerPx.x,
    y: centerPx.y,
    diameter: Math.max(28, Math.hypot(edgePx.x - centerPx.x, edgePx.y - centerPx.y) * 2)
  };
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
  const reveal = smoothstep(5.95, 7.55, runTime);
  const macScene = getMacbookSceneProgress(runTime);
  const prdScene = getPrdSceneProgress(runTime);

  camera.position.x = 0;
  camera.position.y = lerp(0.36, 1.2, smoothstep(0, 1.2, runTime));
  camera.position.y = lerp(camera.position.y, 0.8, reveal);
  camera.position.z = lerp(9.4, 6.65, reveal);
  camera.position.z = lerp(camera.position.z, 6.95, macScene);
  camera.position.z = lerp(camera.position.z, 5.55, prdScene);

  cameraTarget.set(0, lerp(-0.03, ball.y * 0.16, smoothstep(0.2, 1.8, runTime)), 0);
  cameraTarget.y = lerp(cameraTarget.y, -0.35, reveal);
  cameraTarget.z = lerp(cameraTarget.z, -1.25, reveal);
  cameraTarget.y = lerp(cameraTarget.y, -0.48, macScene);
  cameraTarget.z = lerp(cameraTarget.z, -1.1, macScene);
  cameraTarget.y = lerp(cameraTarget.y, -0.5, prdScene);
  cameraTarget.z = lerp(cameraTarget.z, -1.0, prdScene);
  camera.lookAt(cameraTarget);
}

function updatePhone(runTime, phoneFade, t) {
  const deviceExit = getMacbookSceneProgress(runTime);
  phoneRig.visible = phoneFade > 0.01 && deviceExit < 0.995;
  if (!phoneRig.visible) return;

  updatePhoneScreenSequence(runTime);

  const settle = easeOutCubic(phoneFade);
  const flipRaw = smoothstep(PHONE_CURSOR_CLICK_TIME, PHONE_CURSOR_CLICK_TIME + PHONE_SPIN_DURATION, runTime);
  const firstFlip = easeInOutCubic(smoothstep(0, 0.46, flipRaw));
  const secondFlip = easeInOutCubic(smoothstep(0.54, 1, flipRaw));
  const flipAmount = firstFlip + secondFlip;
  const lineUpProgress = easeInOutCubic(flipRaw);
  const flipAngle = -Math.PI * flipAmount;
  const flipLift = Math.max(Math.sin(firstFlip * Math.PI), Math.sin(secondFlip * Math.PI));
  const baseX = lerp(0.08, 0, settle);
  const baseY = lerp(-0.18, 0.02, settle) + Math.sin(t * 0.45) * 0.012 * phoneFade;
  const baseZ = lerp(-0.02, 0, settle);
  const scale = (lerp(0.86, 1.08, settle) * lerp(1, 0.74, lineUpProgress)) + flipLift * 0.08;

  phoneRig.position.set(0, 0, -0.2);
  phoneRig.rotation.set(
    baseX - flipLift * 0.12,
    baseY + flipAngle,
    baseZ + flipLift * 0.08
  );
  phoneRig.scale.setScalar(scale);

  const opacity = smoothstep(0.08, 0.9, phoneFade) * (1 - deviceExit);
  phoneRig.traverse((object) => {
    setObjectOpacity(object, opacity);
  });
}

function updateLaptop(runTime) {
  const slide = smoothstep(LAPTOP_SLIDE_START, LAPTOP_SLIDE_START + LAPTOP_SLIDE_DURATION, runTime);
  laptopRig.visible = slide > 0.001;
  if (!laptopRig.visible) return;

  const eased = easeOutCubic(slide);
  const macScene = easeInOutCubic(getMacbookSceneProgress(runTime));
  const prdScene = easeInOutCubic(getPrdSceneProgress(runTime));
  const lineUpX = lerp(4.8, 2.24, eased);
  const lineUpY = lerp(-0.82, -0.66, eased);
  const lineUpZ = lerp(-0.64, -0.44, eased);
  const lineUpRotX = lerp(0.08, -0.02, eased);
  const lineUpRotY = lerp(-0.34, -0.1, eased);
  const lineUpRotZ = lerp(0.04, 0, eased);
  const lineUpScale = lerp(0.78, 0.96, eased);

  const dualX = lerp(lineUpX, -1.82, macScene);
  const dualY = lerp(lineUpY, -0.62, macScene);
  const dualZ = lerp(lineUpZ, -0.44, macScene);
  const dualRotX = lerp(lineUpRotX, -0.02, macScene);
  const dualRotY = lerp(lineUpRotY, 0.08, macScene);
  const dualRotZ = lerp(lineUpRotZ, 0, macScene);
  const dualScale = lerp(lineUpScale, 0.88, macScene);

  laptopRig.position.set(
    lerp(dualX, 0, prdScene),
    lerp(dualY, -0.58, prdScene),
    lerp(dualZ, -0.42, prdScene)
  );
  laptopRig.rotation.set(
    lerp(dualRotX, -0.02, prdScene),
    lerp(dualRotY, 0, prdScene),
    lerp(dualRotZ, 0, prdScene)
  );
  laptopRig.scale.setScalar(lerp(dualScale, 1.14, prdScene));

  laptopRig.traverse((object) => {
    setObjectOpacity(object, smoothstep(0.02, 0.82, slide));
  });
}

function updateSecondLaptop(runTime) {
  const reveal = smoothstep(SECOND_MACBOOK_REVEAL_START, SECOND_MACBOOK_REVEAL_START + SECOND_MACBOOK_REVEAL_DURATION, runTime);
  const prdScene = easeInOutCubic(getPrdSceneProgress(runTime));
  secondLaptopRig.visible = reveal > 0.001 && prdScene < 0.995;
  if (!secondLaptopRig.visible) return;

  const eased = easeOutCubic(reveal);
  secondLaptopRig.position.set(
    lerp(lerp(4.2, 1.82, eased), 4.15, prdScene),
    lerp(lerp(-0.78, -0.62, eased), -0.72, prdScene),
    lerp(lerp(-0.64, -0.44, eased), -0.54, prdScene)
  );
  secondLaptopRig.rotation.set(
    lerp(0.08, -0.02, eased),
    lerp(-0.28, -0.08, eased),
    lerp(0.03, 0, eased)
  );
  secondLaptopRig.scale.setScalar(lerp(0.76, 0.88, eased));

  secondLaptopRig.traverse((object) => {
    setObjectOpacity(object, smoothstep(0.02, 0.85, reveal) * (1 - prdScene));
  });
}

function updateIpad(runTime) {
  const slide = smoothstep(IPAD_SLIDE_START, IPAD_SLIDE_START + IPAD_SLIDE_DURATION, runTime);
  const deviceExit = getMacbookSceneProgress(runTime);
  ipadRig.visible = slide > 0.001 && deviceExit < 0.995;
  if (!ipadRig.visible) return;

  const eased = easeOutCubic(slide);
  ipadRig.position.set(
    lerp(-4.2, -1.75, eased),
    lerp(-0.42, -0.24, eased),
    lerp(-0.62, -0.36, eased)
  );
  ipadRig.rotation.set(
    lerp(0.06, 0.02, eased),
    lerp(0.34, 0.08, eased),
    lerp(-0.035, IPAD_LANDSCAPE_ROTATION, eased)
  );
  ipadRig.scale.setScalar(lerp(0.76, 0.92, eased));

  ipadRig.traverse((object) => {
    setObjectOpacity(object, smoothstep(0.02, 0.82, slide) * (1 - deviceExit));
  });
}

function updateStageCaption(runTime) {
  if (!stageCaption) return;

  const enter = smoothstep(DEVICE_CAPTION_START - 0.18, DEVICE_CAPTION_START + 0.12, runTime);
  const exit = getMacbookSceneProgress(runTime);
  const visibleChars = Math.max(0, Math.min(
    DEVICE_CAPTION_TEXT.length,
    Math.floor((runTime - DEVICE_CAPTION_START) / DEVICE_CAPTION_INTERVAL)
  ));
  const isTyping = visibleChars < DEVICE_CAPTION_TEXT.length && runTime >= DEVICE_CAPTION_START;
  const showCursor = isTyping && Math.floor(runTime * 8) % 2 === 0;

  stageCaption.textContent = DEVICE_CAPTION_TEXT.slice(0, visibleChars) + (showCursor ? "|" : "");
  stageCaption.style.opacity = (enter * (1 - exit)).toFixed(3);
  stageCaption.style.transform = `translate(-50%, ${lerp(10, 0, enter)}px)`;
}

function getMacbookSceneProgress(runTime) {
  return smoothstep(MACBOOK_SCENE_START, MACBOOK_SCENE_START + DEVICE_SCENE_TRANSITION_DURATION, runTime);
}

function getPrdSceneProgress(runTime) {
  return smoothstep(PRD_SCENE_START, PRD_SCENE_START + PRD_SCENE_TRANSITION_DURATION, runTime);
}

function updateDeviceScreenVideos(runTime) {
  const stage = getDeviceScreenStage(runTime);

  if (stage !== currentDeviceScreenStage) {
    currentDeviceScreenStage = stage;
    resetVideosForStage(stage);
  }

  if (stage === "websocket-hold") {
    setWebsocketScreenMaps("ws-first-frame");
    holdScreenVideoFirstFrame(screenVideos.wsPhone);
    holdScreenVideoFirstFrame(screenVideos.wsIpad);
    holdScreenVideoFirstFrame(screenVideos.wsMac);
    return;
  }

  if (stage === "websocket") {
    setWebsocketScreenMaps("ws-phone-video");
    playScreenVideo(screenVideos.wsPhone);
    playScreenVideo(screenVideos.wsIpad);
    playScreenVideo(screenVideos.wsMac);
    return;
  }

  if (stage === "voice") {
    setScreenMaterialsMap(laptopScreenMaterials, screenVideos.voice.texture);
    setScreenMaterialsMap(secondLaptopScreenMaterials, screenVideos.voice.texture);
    playScreenVideo(screenVideos.voice);
    return;
  }

  if (stage === "prd") {
    setScreenMaterialsMap(laptopScreenMaterials, screenVideos.prd.texture);
    playScreenVideo(screenVideos.prd);
  }
}

function getDeviceScreenStage(runTime) {
  if (runTime >= PRD_SCENE_START) return "prd";
  if (runTime >= VOICE_VIDEO_START) return "voice";
  if (runTime >= LINEUP_READY_TIME) return "websocket";
  if (runTime >= LAPTOP_SLIDE_START) return "websocket-hold";
  return "intro";
}

function resetVideosForStage(stage) {
  if (stage === "intro") {
    pauseAndResetAllScreenVideos();
    return;
  }

  const videosByStage = {
    "websocket-hold": [screenVideos.wsPhone, screenVideos.wsIpad, screenVideos.wsMac],
    websocket: [screenVideos.wsPhone, screenVideos.wsIpad, screenVideos.wsMac],
    voice: [screenVideos.voice],
    prd: [screenVideos.prd]
  };

  (videosByStage[stage] || []).forEach((screenVideo) => {
    resetScreenVideo(screenVideo);
    if (stage === "websocket-hold") {
      holdScreenVideoFirstFrame(screenVideo);
    } else {
      playScreenVideo(screenVideo);
    }
  });
}

function setWebsocketScreenMaps(key) {
  setPhoneScreenMap(screenVideos.wsPhone.texture, key);
  setScreenMaterialsMap(ipadScreenMaterials, screenVideos.wsIpad.texture);
  setScreenMaterialsMap(laptopScreenMaterials, screenVideos.wsMac.texture);
}

function setScreenMaterialsMap(materials, texture) {
  materials.forEach((material) => {
    if (material.map === texture) return;
    material.map = texture;
    material.needsUpdate = true;
  });
}

function updateOrbShape(progress, phoneShapeProgress = 0) {
  const frameProgress = easeInOutCubic(smoothstep(0, 0.52, progress));
  const foldProgress = easeInOutCubic(smoothstep(0.72, 1, progress));
  const holeProgress = easeInOutCubic(smoothstep(0.18, 0.9, progress));
  const outerFrame = interpolatePoints(circleShape.outer, frameShape.outer, frameProgress);
  const logoOuter = interpolatePoints(outerFrame, logoShape.outer, foldProgress);
  const logoInner = interpolatePoints(circleShape.inner, logoShape.inner, holeProgress);
  const phoneProgress = easeInOutCubic(phoneShapeProgress);
  const outer = interpolatePoints(logoOuter, iphoneShape.outer, phoneProgress);
  const inner = interpolatePoints(logoInner, iphoneShape.inner, phoneProgress);
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

function makeRoundedFrameShape() {
  return makeLogoShapeVariant(0);
}

function makeOnitLogoShape() {
  return makeLogoShapeVariant(1);
}

function makeIphoneShape() {
  const left = 0;
  const right = 100;
  const top = 0;
  const bottom = 100;
  const radius = 18;
  const outer = sampleSegments([
    ["cubic", { x: left + radius, y: top }, { x: left + 5, y: top }, { x: left, y: top + 5 }, { x: left, y: top + radius }, 11],
    ["line", { x: left, y: top + radius }, { x: left, y: bottom - radius }, 17],
    ["cubic", { x: left, y: bottom - radius }, { x: left, y: bottom - 5 }, { x: left + 5, y: bottom }, { x: left + radius, y: bottom }, 11],
    ["line", { x: left + radius, y: bottom }, { x: right - radius, y: bottom }, 8],
    ["cubic", { x: right - radius, y: bottom }, { x: right - 5, y: bottom }, { x: right, y: bottom - 5 }, { x: right, y: bottom - radius }, 11],
    ["line", { x: right, y: bottom - radius }, { x: right, y: top + radius }, 17],
    ["cubic", { x: right, y: top + radius }, { x: right, y: top + 5 }, { x: right - 5, y: top }, { x: right - radius, y: top }, 11],
    ["line", { x: right - radius, y: top }, { x: left + radius, y: top }, 2]
  ]);
  const inner = outer.map(() => ({ x: 50, y: 50 }));
  return { outer, inner };
}

function makeLogoShapeVariant(fold) {
  const outer = sampleSegments([
    ["cubic", { x: 22, y: 8 }, { x: 10, y: 8 }, { x: 4, y: 14 }, { x: 4, y: 26 }, 9],
    ["line", { x: 4, y: 26 }, { x: 4, y: 75 }, 9],
    ["cubic", { x: 4, y: 75 }, { x: 4, y: 89 }, { x: 13, y: 98 }, { x: 28, y: 98 }, 10],
    ["line", { x: 28, y: 98 }, { x: 55, y: 98 }, 8],
    ["cubic", { x: 55, y: 98 }, { x: 62, y: 98 }, lerpPoint({ x: 70, y: 98 }, { x: 66, y: 95 }, fold), lerpPoint({ x: 78, y: 98 }, { x: 71, y: 90 }, fold), 8],
    ["cubic", lerpPoint({ x: 78, y: 98 }, { x: 71, y: 90 }, fold), lerpPoint({ x: 88, y: 98 }, { x: 77, y: 84 }, fold), lerpPoint({ x: 96, y: 90 }, { x: 83, y: 78 }, fold), lerpPoint({ x: 96, y: 80 }, { x: 88, y: 73 }, fold), 8],
    ["cubic", lerpPoint({ x: 96, y: 80 }, { x: 88, y: 73 }, fold), lerpPoint({ x: 96, y: 72 }, { x: 92, y: 69 }, fold), { x: 96, y: 64 }, { x: 96, y: 55 }, 9],
    ["line", { x: 96, y: 55 }, { x: 96, y: 29 }, 7],
    ["cubic", { x: 96, y: 29 }, { x: 96, y: 16 }, { x: 87, y: 8 }, { x: 74, y: 8 }, 10],
    ["line", { x: 74, y: 8 }, { x: 22, y: 8 }, 10]
  ]);

  const inner = sampleSegments([
    ["cubic", { x: 28, y: 23 }, { x: 25, y: 23 }, { x: 23, y: 25 }, { x: 23, y: 28 }, 7],
    ["line", { x: 23, y: 28 }, { x: 23, y: 74 }, 10],
    ["cubic", { x: 23, y: 74 }, { x: 23, y: 77 }, { x: 25, y: 79 }, { x: 28, y: 79 }, 7],
    ["line", { x: 28, y: 79 }, { x: 55, y: 79 }, 8],
    ["line", { x: 55, y: 79 }, lerpPoint({ x: 66, y: 79 }, { x: 55, y: 70 }, fold), 7],
    ["cubic", lerpPoint({ x: 66, y: 79 }, { x: 55, y: 70 }, fold), lerpPoint({ x: 78, y: 79 }, { x: 55, y: 62 }, fold), lerpPoint({ x: 78, y: 64 }, { x: 61, y: 57 }, fold), { x: 68, y: 57 }, 10],
    ["line", { x: 68, y: 57 }, { x: 78, y: 57 }, 6],
    ["line", { x: 78, y: 57 }, { x: 78, y: 28 }, 8],
    ["cubic", { x: 78, y: 28 }, { x: 78, y: 25 }, { x: 76, y: 23 }, { x: 73, y: 23 }, 7],
    ["line", { x: 73, y: 23 }, { x: 28, y: 23 }, 18]
  ]);

  return { outer, inner };
}

function sampleSegments(segments) {
  return segments.flatMap((segment) => {
    if (segment[0] === "line") return sampleLine(segment[1], segment[2], segment[3]);
    return sampleCubic(segment[1], segment[2], segment[3], segment[4], segment[5]);
  });
}

function sampleLine(start, end, steps) {
  const points = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    points.push({ x: lerp(start.x, end.x, t), y: lerp(start.y, end.y, t) });
  }
  return points;
}

function sampleCubic(start, controlA, controlB, end, steps) {
  const points = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const inv = 1 - t;
    points.push({
      x: (inv ** 3) * start.x + 3 * (inv ** 2) * t * controlA.x + 3 * inv * (t ** 2) * controlB.x + (t ** 3) * end.x,
      y: (inv ** 3) * start.y + 3 * (inv ** 2) * t * controlA.y + 3 * inv * (t ** 2) * controlB.y + (t ** 3) * end.y
    });
  }
  return points;
}

function lerpPoint(from, to, progress) {
  return {
    x: lerp(from.x, to.x, progress),
    y: lerp(from.y, to.y, progress)
  };
}

function interpolatePoints(from, to, progress) {
  return from.map((point, index) => ({
    x: lerp(point.x, samplePoint(to, index, from.length).x, progress),
    y: lerp(point.y, samplePoint(to, index, from.length).y, progress)
  }));
}

function samplePoint(points, index, targetLength) {
  if (points.length === targetLength) return points[index];
  const scaledIndex = Math.round((index / Math.max(1, targetLength - 1)) * (points.length - 1));
  return points[Math.max(0, Math.min(points.length - 1, scaledIndex))];
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

function loadPhoneAsset() {
  import("three/addons/loaders/GLTFLoader.js")
    .then(({ GLTFLoader }) => {
      const loader = new GLTFLoader();
      loader.load(
        IPHONE_ASSET_URL,
        (gltf) => {
          const model = gltf.scene;
          normalizeModel(model, 2.68);
          model.rotation.y = 0;
          prepareTransparentModel(model);
          replacePhoneScreenMaterial(model);
          phoneRig.add(model);
        },
        undefined,
        () => {
          addFallbackPhone();
        }
      );
    })
    .catch(() => {
      addFallbackPhone();
    });
}

function loadLaptopAsset(targetRig = laptopRig) {
  import("three/addons/loaders/GLTFLoader.js")
    .then(({ GLTFLoader }) => {
      const loader = new GLTFLoader();
      loader.load(
        MACBOOK_ASSET_URL,
        (gltf) => {
          const model = gltf.scene;
          normalizeModel(model, 3.35);
          model.rotation.y = 0;
          model.rotation.x = 0;
          prepareTransparentModel(model);
          fillLaptopScreenWhite(model, getLaptopScreenMaterials(targetRig));
          targetRig.add(model);
        },
        undefined,
        () => {
          addFallbackLaptop(targetRig);
        }
      );
    })
    .catch(() => {
      addFallbackLaptop(targetRig);
    });
}

function loadIpadAsset() {
  import("three/addons/loaders/GLTFLoader.js")
    .then(({ GLTFLoader }) => {
      const loader = new GLTFLoader();
      const fallbackTimer = window.setTimeout(() => {
        if (!ipadAssetLoaded && ipadRig.children.length === 0) addFallbackIpad();
      }, 1800);
      loader.load(
        IPAD_ASSET_URL,
        (gltf) => {
          window.clearTimeout(fallbackTimer);
          ipadAssetLoaded = true;
          ipadRig.clear();
          const model = gltf.scene;
          normalizeModel(model, 2.35);
          model.rotation.y = 0;
          model.rotation.x = 0;
          prepareTransparentModel(model);
          fillIpadScreenWhite(model);
          orientIpadForCamera(model);
          ipadRig.add(model);
        },
        undefined,
        () => {
          window.clearTimeout(fallbackTimer);
          addFallbackIpad();
        }
      );
    })
    .catch(() => {
      addFallbackIpad();
    });
}

function normalizeModel(model, targetSize) {
  model.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = targetSize / Math.max(size.x, size.y, size.z, 0.001);
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
}

function getLaptopScreenMaterials(targetRig) {
  return targetRig === secondLaptopRig ? secondLaptopScreenMaterials : laptopScreenMaterials;
}

function prepareTransparentModel(model) {
  model.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0;
      material.envMapIntensity = Math.max(material.envMapIntensity || 0, 1.15);
      if (material.color) material.color.offsetHSL(0, -0.02, 0.05);
      material.needsUpdate = true;
    });
  });
}

function fillLaptopScreenWhite(model, targetMaterials = laptopScreenMaterials) {
  const screenName = "tfTbkkzhxqpKRgC";
  let found = false;
  model.traverse((object) => {
    if (!object.isMesh || object.name !== screenName) return;

    const material = makeDeviceScreenMaterial();
    object.material = material;
    object.renderOrder = 35;
    targetMaterials.push(material);
    fitTextureToUvBounds(screenVideos.wsMac.texture, object.geometry);
    fitTextureToUvBounds(screenVideos.voice.texture, object.geometry);
    fitTextureToUvBounds(screenVideos.prd.texture, object.geometry);
    found = true;
  });

  if (found) return;

  model.traverse((object) => {
    if (!object.isMesh || !/screen|display|lcd/i.test(object.name || "")) return;
    const material = makeDeviceScreenMaterial();
    object.material = material;
    object.renderOrder = 35;
    targetMaterials.push(material);
  });
}

function fillIpadScreenWhite(model) {
  let found = false;
  model.traverse((object) => {
    if (!object.isMesh || object.name !== "iPad Pro 2020_screen_0") return;

    const material = makeDeviceScreenMaterial();
    object.material = material;
    object.renderOrder = 34;
    ipadScreenMaterials.push(material);
    fitTextureToUvBounds(screenVideos.wsIpad.texture, object.geometry);
    found = true;
  });

  if (found) return;

  model.traverse((object) => {
    if (!object.isMesh || !/screen|display|lcd/i.test(object.name || "")) return;
    const material = makeDeviceScreenMaterial();
    object.material = material;
    object.renderOrder = 34;
    ipadScreenMaterials.push(material);
  });
}

function makeDeviceScreenMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });
}

function orientIpadForCamera(model) {
  const screen = model.getObjectByName("iPad Pro 2020_screen_0") || model;
  const rotations = [0, Math.PI / 2, -Math.PI / 2, Math.PI];
  const size = new THREE.Vector3();
  let bestRotation = 0;
  let bestScore = -Infinity;

  rotations.forEach((rotationX) => {
    model.rotation.x = rotationX;
    model.updateWorldMatrix(true, true);

    const box = new THREE.Box3().setFromObject(screen);
    if (box.isEmpty()) return;

    box.getSize(size);
    const visibleArea = size.x * size.y;
    const edgePenalty = size.z * 0.08;
    const score = visibleArea - edgePenalty;
    if (score > bestScore) {
      bestScore = score;
      bestRotation = rotationX;
    }
  });

  model.rotation.x = bestRotation;
}

function replacePhoneScreenMaterial(model) {
  model.updateWorldMatrix(true, true);

  let best = null;
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();

  model.traverse((object) => {
    if (!object.isMesh || !object.geometry) return;

    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;

    box.getSize(size);
    box.getCenter(center);
    const dims = [size.x, size.y, size.z].sort((a, b) => b - a);
    const long = dims[0];
    const short = dims[1];
    const thin = dims[2];
    const aspect = long / Math.max(short, 0.001);

    if (long < 1.35 || short < 0.54) return;
    if (aspect < 1.85 || aspect > 2.35) return;
    if (thin > 0.012) return;
    if (center.z < 0) return;

    const material = Array.isArray(object.material) ? object.material[0] : object.material;
    const color = material?.color || new THREE.Color(0xffffff);
    const darkSurface = 1 - ((color.r + color.g + color.b) / 3);
    const screenNameBias = /screen|display|Object_18/i.test(object.name || "") ? 1.2 : 0;
    const score = (long * short) + (center.z * 3.2) + (darkSurface * 0.45) + screenNameBias - (thin * 20);

    if (!best || score > best.score) {
      best = { object, score, center: center.clone(), size: size.clone() };
    }
  });

  if (!best) return false;

  const screenTextures = [phoneIntroScreen.texture, ...phoneScreenTextures, screenVideos.wsPhone.texture];
  screenTextures.forEach((texture) => fitTextureToUvBounds(texture, best.object.geometry));

  const screenWidth = Math.min(best.size.x, best.size.y);
  const screenHeight = Math.max(best.size.x, best.size.y);
  phoneScreenIconLocal = best.center.clone();
  phoneScreenIconLocal.y += (0.5 - PHONE_HOME_ICON_V) * screenHeight;
  phoneScreenIconRadius = screenWidth * PHONE_HOME_ICON_SIZE * 0.5;

  const screenMaterial = new THREE.MeshBasicMaterial({
    map: phoneIntroScreen.texture,
    transparent: true,
    opacity: 0,
    depthTest: true,
    depthWrite: false,
    toneMapped: false
  });
  best.object.material = screenMaterial;
  best.object.renderOrder = 30;
  phoneScreenMaterials.push(screenMaterial);
  return true;
}

function loadPhoneScreenTextures() {
  const loader = new THREE.TextureLoader();
  return PHONE_SCREEN_IMAGE_URLS.map((url) => {
    const texture = loader.load(url);
    configurePhoneScreenTexture(texture);
    return texture;
  });
}

function makeScreenVideo(url, options = {}) {
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.loop = options.loop === true;
  video.playsInline = true;
  video.preload = "auto";
  video.autoplay = false;

  if (Number.isFinite(options.skipStart) && Number.isFinite(options.skipEnd)) {
    video.addEventListener("timeupdate", () => {
      if (video.currentTime >= options.skipStart && video.currentTime < options.skipEnd) {
        video.currentTime = options.skipEnd;
      }
    });
  }

  const texture = new THREE.VideoTexture(video);
  configureScreenVideoTexture(texture);
  if (Number.isFinite(options.rotation)) rotateScreenTexture(texture, options.rotation);
  video.addEventListener("loadeddata", () => {
    holdScreenVideoFirstFrame({ video, texture });
  }, { once: true });
  video.load();

  return { video, texture };
}

function configureScreenVideoTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function rotateScreenTexture(texture, rotation) {
  texture.center.set(0.5, 0.5);
  texture.rotation = rotation;
  texture.needsUpdate = true;
  return texture;
}

function resetScreenVideo(screenVideo) {
  try {
    screenVideo.video.currentTime = 0;
  } catch {
    // Some browsers reject seeks before metadata is ready; playback still starts normally.
  }
}

function holdScreenVideoFirstFrame(screenVideo) {
  screenVideo.video.pause();
  if (screenVideo.video.readyState >= 1 && Math.abs(screenVideo.video.currentTime) > 0.04) {
    resetScreenVideo(screenVideo);
  }
  screenVideo.texture.needsUpdate = true;
}

function pauseAndResetAllScreenVideos() {
  Object.values(screenVideos).forEach((screenVideo) => {
    screenVideo.video.pause();
    resetScreenVideo(screenVideo);
  });
}

function playScreenVideo(screenVideo) {
  const playPromise = screenVideo.video.play();
  if (playPromise?.catch) playPromise.catch(() => {});
}

function makePhoneIntroScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1206;
  canvas.height = 2622;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  configurePhoneScreenTexture(texture);
  return { canvas, ctx, texture };
}

function configurePhoneScreenTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function updatePhoneScreenSequence(runTime) {
  if (!phoneScreenMaterials.length) return;

  if (runTime < PHONE_IMAGE_SEQUENCE_START || !phoneScreenTextures.length) {
    renderPhoneIntroScreen(runTime);
    setPhoneScreenMap(phoneIntroScreen.texture, "intro");
    phoneIntroScreen.texture.needsUpdate = true;
    return;
  }

  const imageTime = Math.max(0, runTime - PHONE_IMAGE_SEQUENCE_START);
  const textureIndex = Math.floor(imageTime / PHONE_IMAGE_INTERVAL) % phoneScreenTextures.length;
  setPhoneScreenMap(phoneScreenTextures[textureIndex], `image-${textureIndex}`);
}

function setPhoneScreenMap(texture, key) {
  if (key === currentPhoneScreenMapKey && phoneScreenMaterials.every((material) => material.map === texture)) return;

  currentPhoneScreenMapKey = key;
  phoneScreenMaterials.forEach((material) => {
    material.map = texture;
    material.needsUpdate = true;
  });
}

function renderPhoneIntroScreen(runTime) {
  const { canvas, ctx } = phoneIntroScreen;
  const w = canvas.width;
  const h = canvas.height;
  const iconSize = w * PHONE_HOME_ICON_SIZE;
  const iconX = w * PHONE_HOME_ICON_U;
  const iconY = h * PHONE_HOME_ICON_V;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#020503";
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(iconX, iconY, iconSize * 0.2, iconX, iconY, iconSize * 2.8);
  glow.addColorStop(0, "rgba(8, 201, 35, 0.26)");
  glow.addColorStop(0.35, "rgba(8, 201, 35, 0.08)");
  glow.addColorStop(1, "rgba(8, 201, 35, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const iconMaterialize = smoothstep(PHONE_ICON_MATERIALIZE_START, PHONE_ICON_MATERIALIZE_END, runTime);
  if (iconMaterialize > 0) {
    const iconPop = easeOutBack(iconMaterialize);
    ctx.save();
    ctx.globalAlpha = Math.min(1, iconMaterialize * 1.2);
    drawOnitAppIcon(ctx, iconX, iconY, iconSize * iconPop);
    ctx.restore();
  }

  const typeStart = Math.max(PHONE_TYPE_START, PHONE_ICON_MATERIALIZE_END + 0.06);
  const typedCount = Math.max(0, Math.min(PHONE_APP_NAME.length, Math.floor((runTime - typeStart) / PHONE_TYPE_INTERVAL)));
  const typed = PHONE_APP_NAME.slice(0, typedCount);
  const showCursor = runTime < PHONE_CURSOR_CLICK_TIME && Math.floor(runTime * 3.2) % 2 === 0;
  drawTypedAppName(ctx, typed, showCursor, iconX, iconY + iconSize * 0.8, iconSize);

  const cursorProgress = smoothstep(PHONE_CURSOR_ENTER_START, PHONE_CURSOR_CLICK_TIME - 0.12, runTime);
  const click = smoothstep(PHONE_CURSOR_CLICK_TIME - 0.08, PHONE_CURSOR_CLICK_TIME, runTime)
    * (1 - smoothstep(PHONE_CURSOR_CLICK_TIME + 0.02, PHONE_CURSOR_CLICK_TIME + 0.22, runTime));
  if (cursorProgress > 0 && runTime < PHONE_IMAGE_SEQUENCE_START) {
    const startX = w * 1.08;
    const startY = iconY + iconSize * 0.96;
    const endX = iconX + iconSize * 0.34;
    const endY = iconY + iconSize * 0.34;
    const eased = easeInOutCubic(cursorProgress);
    drawMouseCursor(ctx, lerp(startX, endX, eased), lerp(startY, endY, eased), iconSize * (0.28 - click * 0.04), click);
  }
}

function drawOnitAppIcon(ctx, cx, cy, size) {
  if (size <= 1) return;

  const r = size * 0.22;
  const x = cx - size / 2;
  const y = cy - size / 2;
  roundRect(ctx, x, y, size, size, r, "#ffffff");

  ctx.save();
  ctx.translate(x + size * 0.13, y + size * 0.13);
  ctx.scale((size * 0.74) / 100, (size * 0.74) / 100);
  ctx.fillStyle = "#08c923";
  ctx.beginPath();
  canvasPointsPath(ctx, logoShape.outer);
  canvasPointsPath(ctx, logoShape.inner);
  ctx.fill("evenodd");
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.strokeStyle = "#08c923";
  ctx.lineWidth = Math.max(2, size * 0.018);
  roundRectStroke(ctx, x + size * 0.03, y + size * 0.03, size * 0.94, size * 0.94, r * 0.86);
  ctx.restore();
}

function drawTypedAppName(ctx, text, showCursor, cx, y, iconSize) {
  ctx.save();
  ctx.font = `700 ${Math.round(iconSize * 0.24)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const fullWidth = ctx.measureText(PHONE_APP_NAME).width;
  const startX = cx - fullWidth / 2;
  ctx.fillStyle = "#08c923";
  ctx.fillText(text, startX, y);
  if (showCursor) {
    const typedWidth = ctx.measureText(text).width;
    ctx.fillRect(startX + typedWidth + iconSize * 0.03, y - iconSize * 0.12, iconSize * 0.045, iconSize * 0.24);
  }
  ctx.restore();
}

function drawMouseCursor(ctx, x, y, size, click) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1 - click * 0.12, 1 - click * 0.12);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#0a0d0a";
  ctx.lineWidth = Math.max(4, size * 0.06);
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, size);
  ctx.lineTo(size * 0.27, size * 0.73);
  ctx.lineTo(size * 0.46, size * 1.14);
  ctx.lineTo(size * 0.64, size * 1.05);
  ctx.lineTo(size * 0.45, size * 0.65);
  ctx.lineTo(size * 0.84, size * 0.64);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  if (click > 0) {
    ctx.globalAlpha = click * 0.8;
    ctx.strokeStyle = "#08c923";
    ctx.lineWidth = Math.max(5, size * 0.055);
    ctx.beginPath();
    ctx.arc(0, 0, size * (0.72 + click * 0.42), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function fitTextureToUvBounds(texture, geometry) {
  const uv = geometry.attributes.uv;
  if (!uv) return;

  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;

  for (let index = 0; index < uv.count; index++) {
    const u = uv.getX(index);
    const v = uv.getY(index);
    minU = Math.min(minU, u);
    maxU = Math.max(maxU, u);
    minV = Math.min(minV, v);
    maxV = Math.max(maxV, v);
  }

  const width = Math.max(0.001, maxU - minU);
  const height = Math.max(0.001, maxV - minV);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1 / width, 1 / height);
  texture.offset.set(-minU / width, -minV / height);
  texture.needsUpdate = true;
}

function addFallbackPhone() {
  const fallback = makeFallbackPhone();
  phoneRig.add(fallback);
}

function addFallbackLaptop(targetRig = laptopRig) {
  const fallback = makeFallbackLaptop(getLaptopScreenMaterials(targetRig));
  targetRig.add(fallback);
}

function addFallbackIpad() {
  const fallback = makeFallbackIpad();
  ipadRig.add(fallback);
}

function makeFallbackPhone() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 1.9, 0.08),
    new THREE.MeshPhysicalMaterial({
      color: 0x101614,
      roughness: 0.44,
      metalness: 0.16,
      clearcoat: 0.46,
      clearcoatRoughness: 0.24,
      transparent: true,
      opacity: 0
    })
  );
  body.castShadow = true;
  group.add(body);

  const fallbackScreenMaterial = new THREE.MeshBasicMaterial({
      map: phoneIntroScreen.texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false
    });
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 1.72),
    fallbackScreenMaterial
  );
  screen.position.z = 0.045;
  group.add(screen);
  phoneScreenMaterials.push(fallbackScreenMaterial);

  return group;
}

function makeFallbackLaptop(targetMaterials = laptopScreenMaterials) {
  const group = new THREE.Group();
  const baseMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x1b211f,
    roughness: 0.34,
    metalness: 0.42,
    clearcoat: 0.28,
    clearcoatRoughness: 0.24,
    transparent: true,
    opacity: 0
  });
  const screenMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false
  });
  targetMaterials.push(screenMaterial);

  const screen = new THREE.Mesh(new THREE.BoxGeometry(2.45, 1.52, 0.06), baseMaterial.clone());
  screen.position.set(0, 0.52, -0.08);
  screen.rotation.x = -0.1;
  group.add(screen);

  const display = new THREE.Mesh(new THREE.PlaneGeometry(2.18, 1.24), screenMaterial);
  display.position.set(0, 0.53, -0.045);
  display.rotation.x = -0.1;
  group.add(display);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.08, 1.55), baseMaterial.clone());
  deck.position.set(0, -0.36, 0.52);
  deck.rotation.x = 0.13;
  group.add(deck);

  return group;
}

function makeFallbackIpad() {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x141817,
    roughness: 0.34,
    metalness: 0.36,
    clearcoat: 0.24,
    clearcoatRoughness: 0.2,
    transparent: true,
    opacity: 0
  });
  const screenMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false
  });
  ipadScreenMaterials.push(screenMaterial);

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.78, 0.06), bodyMaterial);
  body.castShadow = true;
  group.add(body);

  const display = new THREE.Mesh(new THREE.PlaneGeometry(1.19, 1.58), screenMaterial);
  display.position.z = 0.034;
  display.renderOrder = 34;
  group.add(display);

  return group;
}

function setObjectOpacity(object, opacity) {
  if (!object.material) return;
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  materials.forEach((material) => {
    material.transparent = true;
    material.opacity = opacity;
    material.needsUpdate = true;
  });
}

function addRoom() {
  const floorTexture = makeRoomTexture("#0a1110", "#14241b", "#1e3327", 1);
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(3, 2);

  const wallTexture = makeRoomTexture("#070c0b", "#101b17", "#183023", 0.55);
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(2, 1.4);

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x101b16,
    map: floorTexture,
    roughness: 0.76,
    metalness: 0.02
  });

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x0c1412,
    map: wallTexture,
    roughness: 0.84,
    metalness: 0
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 9), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, FLOOR_Y, 0.95);
  floor.receiveShadow = true;
  roomGroup.add(floor);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 8), wallMaterial);
  backWall.position.set(0, -0.28, -3.15);
  backWall.receiveShadow = true;
  roomGroup.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 8), wallMaterial.clone());
  leftWall.position.set(-6.25, -0.28, 0.15);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  roomGroup.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 8), wallMaterial.clone());
  rightWall.position.set(6.25, -0.28, 0.15);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  roomGroup.add(rightWall);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 2.4),
    new THREE.MeshBasicMaterial({
      color: 0x08c923,
      transparent: true,
      opacity: 0.08,
      depthWrite: false
    })
  );
  glow.position.set(0, 0.05, -3.12);
  roomGroup.add(glow);
}

function makeRoomTexture(base, line, accent, strength) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(460, 300, 70, 512, 512, 720);
  gradient.addColorStop(0, accent);
  gradient.addColorStop(0.45, line);
  gradient.addColorStop(1, base);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 1;
  for (let i = 0; i <= 1024; i += 128) {
    ctx.strokeStyle = `rgba(105, 255, 139, ${0.08 * strength})`;
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
    const alpha = (Math.random() * 0.035 + 0.008) * strength;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
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

function makeProjectListScreenTexture(flipY = false) {
  const canvas = document.createElement("canvas");
  canvas.width = 946;
  canvas.height = 2048;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f3f4f8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000000";
  ctx.font = "700 44px Arial, sans-serif";
  ctx.fillText("3:05", 106, 96);
  ctx.font = "700 34px Arial, sans-serif";
  ctx.fillText("LTE", 733, 94);
  roundRect(ctx, 800, 60, 58, 34, 10, "#63cf62");
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 28px Arial, sans-serif";
  ctx.fillText("67", 807, 86);

  circleButton(ctx, 88, 198, 52, "#58d143", "↻");
  circleButton(ctx, 854, 198, 52, "#58d143", "+");

  ctx.fillStyle = "#08090b";
  ctx.font = "900 72px Arial, sans-serif";
  ctx.fillText("프로젝트", 38, 352);

  pill(ctx, 38, 416, 128, 74, "#59d13e", "#ffffff", "전체");
  pill(ctx, 184, 416, 224, 74, "#ffffff", "#08090b", "내 프로젝트");
  pill(ctx, 430, 416, 158, 74, "#ffffff", "#08090b", "공유됨");

  roundRect(ctx, 38, 516, 868, 98, 22, "#ffffff");
  ctx.strokeStyle = "#8d8f96";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(83, 565, 16, 0, Math.PI * 2);
  ctx.moveTo(96, 578);
  ctx.lineTo(118, 600);
  ctx.stroke();
  ctx.fillStyle = "#b9bbc2";
  ctx.font = "700 36px Arial, sans-serif";
  ctx.fillText("프로젝트 검색", 132, 578);

  const items = [
    ["오", "오늘의 아이디어", "김민재", "3명"],
    ["N", "new", "김민재", "6명"],
    ["프", "프로젝트 시연", "김수빈", "6명"],
    ["현", "현우", "김민재", "2명"],
    ["김", "김민재", "김민재", "1명"]
  ];
  items.forEach((item, index) => {
    const y = 642 + index * 225;
    roundRect(ctx, 38, y, 814, 206, 26, "#ffffff");
    roundRect(ctx, 70, y + 34, 140, 140, 20, "#65cf8b");
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 54px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item[0], 140, y + 120);
    ctx.textAlign = "left";
    ctx.fillStyle = "#050609";
    ctx.font = "800 40px Arial, sans-serif";
    ctx.fillText(item[1], 250, y + 96);
    ctx.fillStyle = "#8a8c92";
    ctx.font = "700 26px Arial, sans-serif";
    ctx.fillText(`◉   ${item[2]}   ♧   ${item[3]}`, 260, y + 138);
    ctx.strokeStyle = "#8f9197";
    ctx.lineWidth = 6;
    ctx.beginPath();
    starPath(ctx, 787, y + 103, 29, 13);
    ctx.stroke();
    ctx.strokeStyle = "#bfc1c7";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(884, y + 91);
    ctx.lineTo(898, y + 103);
    ctx.lineTo(884, y + 115);
    ctx.stroke();
  });

  roundRect(ctx, 250, 1854, 444, 142, 68, "#ffffff");
  roundRect(ctx, 260, 1864, 222, 122, 60, "#dedee1");
  ctx.fillStyle = "#4dcc36";
  ctx.font = "900 58px Arial, sans-serif";
  ctx.fillText("▰", 338, 1934);
  ctx.font = "800 24px Arial, sans-serif";
  ctx.fillText("프로젝트", 330, 1970);
  ctx.fillStyle = "#050609";
  ctx.font = "900 58px Arial, sans-serif";
  ctx.fillText("⚙", 548, 1934);
  ctx.font = "800 24px Arial, sans-serif";
  ctx.fillText("설정", 552, 1970);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.flipY = flipY;
  texture.needsUpdate = true;
  return texture;
}

function roundRect(ctx, x, y, width, height, radius, fill) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  roundedRectPath(ctx, x, y, width, height, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundRectStroke(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  roundedRectPath(ctx, x, y, width, height, radius);
  ctx.stroke();
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function canvasPointsPath(ctx, points) {
  if (!points.length) return;
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
}

function pill(ctx, x, y, width, height, fill, color, text) {
  roundRect(ctx, x, y, width, height, height / 2, fill);
  ctx.fillStyle = color;
  ctx.font = "800 34px Arial, sans-serif";
  ctx.fillText(text, x + 34, y + 49);
}

function circleButton(ctx, x, y, radius, color, text) {
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = "800 64px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y - 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function starPath(ctx, cx, cy, outer, inner) {
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? outer : inner;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
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

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
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
