import * as THREE from "three";

const VARIANT = window.ONIT_SEQUENCE || { id: 1, title: "MacBook Absorb" };
const GREEN = 0x08c923;
const GREEN_2 = 0x62ff7d;
const DARK = 0x050807;
const DURATION = 19.5;
const SHAPE_POINTS = 88;

const root = document.getElementById("stage");
root.innerHTML = `
  <div class="sequence-webgl"></div>
  <div class="logo-layer" aria-hidden="true">
    <span class="logo-letter" data-i="0">O</span>
    <span class="logo-letter" data-i="1">N</span>
    <span class="logo-letter" data-i="2">-</span>
    <span class="logo-letter" data-i="3">I</span>
    <span class="logo-letter" data-i="4">T</span>
    <svg class="logo-orb" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="orbGradient" cx="35%" cy="28%" r="72%">
          <stop offset="0%" stop-color="#56f36c" />
          <stop offset="58%" stop-color="#08c923" />
          <stop offset="100%" stop-color="#00aa1b" />
        </radialGradient>
      </defs>
      <path id="orbPath" fill="url(#orbGradient)" fill-rule="evenodd"></path>
    </svg>
    <div class="orb-shadow"></div>
    <div class="orb-ripple"></div>
  </div>
  <div class="hud">
    <div class="hud-kicker">ON-IT SEQUENCE ${String(VARIANT.id).padStart(2, "0")}</div>
    <div class="hud-title">${VARIANT.title}</div>
  </div>
  <div class="progress"></div>
`;

const style = document.createElement("style");
style.textContent = `
  * { box-sizing: border-box; }
  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
    background: #050807;
    font-family: Inter, "Helvetica Neue", Arial, sans-serif;
  }
  #stage, .sequence-webgl, .logo-layer {
    position: fixed;
    inset: 0;
  }
  .sequence-webgl { z-index: 1; }
  .logo-layer { z-index: 2; pointer-events: none; }
  .logo-letter {
    position: absolute;
    left: 50%;
    top: 43%;
    color: #08c923;
    font-size: clamp(76px, 13vw, 190px);
    font-weight: 950;
    line-height: 0.9;
    letter-spacing: 0;
    text-shadow: 0 20px 48px rgba(8, 201, 35, 0.34), 0 0 18px rgba(72, 232, 91, 0.18);
    transform: translate(-50%, -50%);
    will-change: transform, opacity;
  }
  .logo-orb {
    position: fixed;
    left: 50%;
    top: 43%;
    width: 260px;
    height: 260px;
    opacity: 0;
    overflow: visible;
    filter: drop-shadow(0 28px 42px rgba(0,0,0,0.42)) drop-shadow(0 0 28px rgba(8,201,35,0.2));
    transform: translate(-50%, -50%);
    will-change: left, top, width, height, opacity, transform;
  }
  .orb-shadow, .orb-ripple {
    position: fixed;
    left: 50%;
    top: 77%;
    opacity: 0;
    transform: translate(-50%, -50%);
    pointer-events: none;
    will-change: left, top, width, opacity;
  }
  .orb-shadow {
    width: 180px;
    height: 28px;
    border-radius: 50%;
    background: radial-gradient(ellipse, rgba(0,0,0,0.46), rgba(8,201,35,0.12) 48%, rgba(8,201,35,0) 72%);
    filter: blur(1px);
  }
  .orb-ripple {
    width: 120px;
    height: 70px;
    border: 2px solid rgba(8,201,35,0.32);
    border-radius: 50%;
  }
  .hud {
    position: fixed;
    left: 34px;
    top: 30px;
    z-index: 3;
    color: rgba(224,255,231,0.82);
    pointer-events: none;
  }
  .hud-kicker {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.18em;
    color: rgba(8,201,35,0.86);
  }
  .hud-title {
    margin-top: 8px;
    font-size: 18px;
    font-weight: 850;
    letter-spacing: 0;
  }
  .progress {
    position: fixed;
    left: 34px;
    right: 34px;
    bottom: 30px;
    z-index: 3;
    height: 2px;
    overflow: hidden;
    background: rgba(8,201,35,0.14);
    border-radius: 999px;
  }
  .progress::after {
    content: "";
    display: block;
    width: 100%;
    height: 100%;
    transform: scaleX(var(--progress, 0));
    transform-origin: left center;
    background: #08c923;
  }
`;
document.head.appendChild(style);

const webgl = document.querySelector(".sequence-webgl");
const progress = document.querySelector(".progress");
const letters = [...document.querySelectorAll(".logo-letter")];
const orb = document.querySelector(".logo-orb");
const orbPath = document.getElementById("orbPath");
const orbShadow = document.querySelector(".orb-shadow");
const orbRipple = document.querySelector(".orb-ripple");

const scene = new THREE.Scene();
scene.background = new THREE.Color(DARK);
scene.fog = new THREE.FogExp2(DARK, 0.05);

const camera = new THREE.PerspectiveCamera(37, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.75, 8.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
webgl.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xb9ffd0, 0x050807, 0.44);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xe8ffec, 3.0);
key.position.set(-4.8, 6.8, 5.6);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -9;
key.shadow.camera.right = 9;
key.shadow.camera.top = 8;
key.shadow.camera.bottom = -8;
key.shadow.camera.near = 0.1;
key.shadow.camera.far = 30;
key.shadow.radius = 7;
scene.add(key);
const accent = new THREE.PointLight(GREEN_2, 1.7, 12, 2);
accent.position.set(3.2, 2.4, 3.0);
scene.add(accent);
const roomLight = new THREE.PointLight(0xfff0c8, 0, 12, 2);
roomLight.position.set(0, 3.0, -4.2);
scene.add(roomLight);

const matGreen = new THREE.MeshPhysicalMaterial({
  color: GREEN,
  roughness: 0.34,
  metalness: 0.04,
  clearcoat: 0.66,
  clearcoatRoughness: 0.28,
  emissive: GREEN,
  emissiveIntensity: 0.08
});
const matDark = new THREE.MeshStandardMaterial({ color: 0x101713, roughness: 0.82, metalness: 0.02 });
const matFloor = new THREE.MeshStandardMaterial({
  color: 0x0b100e,
  roughness: 0.76,
  metalness: 0.04,
  map: makeNoiseTexture("#050706", "#101812", "#1f3024", 1)
});
matFloor.map.wrapS = THREE.RepeatWrapping;
matFloor.map.wrapT = THREE.RepeatWrapping;
matFloor.map.repeat.set(3.2, 2.4);

buildRoom();

const variantGroup = new THREE.Group();
scene.add(variantGroup);
const variant = buildVariant(VARIANT.id, variantGroup);

const circleShape = makeCircleLogoShape();
const frameShape = makeLogoShapeVariant(0);
const logoShape = makeLogoShapeVariant(1);
updateOrbShape(0);

const clock = new THREE.Clock();
animate();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime() % DURATION;
  progress.style.setProperty("--progress", (t / DURATION).toFixed(4));
  updateIntro(t);
  updateScene(t);
  renderer.render(scene, camera);
}

function updateIntro(t) {
  const gather = smoothstep(0.8, 2.75, t);
  const circleIn = smoothstep(2.05, 3.25, t);
  const logoOut = smoothstep(2.48, 3.34, t);
  const runTime = Math.max(0, t - 3.35);
  const motion = introMotion(runTime);
  const logoMorph = smoothstep(5.65, 10.85, runTime);
  const sequence = smoothstep(10.4, 12.1, t);

  letters.forEach((letter, index) => {
    const layout = [-2.27, -1.08, -0.05, 0.73, 1.63][index];
    const local = smoothstep(0, 1, gather - index * 0.045);
    const pulse = Math.sin(t * 7.2 + index * 1.7) * 0.08 * local * (1 - logoOut);
    const startX = layout * responsiveUnit();
    const x = lerp(startX, (index - 2) * 5 * (1 - local), local);
    const scale = lerp(1, 1.22 + pulse, local) * lerp(1, 0.8, logoOut);
    const opacity = 1 - smoothstep(0.62, 1, logoOut);
    letter.style.opacity = opacity.toFixed(3);
    letter.style.transform = `translate(-50%, -50%) translate(${x.toFixed(2)}px, ${(pulse * 18).toFixed(2)}px) scale(${scale.toFixed(3)})`;
  });

  updateOrbShape(logoMorph);
  let cx = window.innerWidth * 0.5;
  let cy = motion.y;
  let size = motion.size;

  const target = getVariantLogoTarget(VARIANT.id, sequence);
  if (sequence > 0) {
    const e = easeInOutCubic(sequence);
    cx = lerp(cx, target.x, e);
    cy = lerp(cy, target.y, e);
    size = lerp(size, target.size, e);
  }

  const postFade = getVariantLogoFade(VARIANT.id, sequence);
  orb.style.left = `${cx.toFixed(2)}px`;
  orb.style.top = `${cy.toFixed(2)}px`;
  orb.style.width = `${size.toFixed(2)}px`;
  orb.style.height = `${size.toFixed(2)}px`;
  orb.style.opacity = (circleIn * postFade).toFixed(3);
  orb.style.transform = `translate(-50%, -50%) rotate(${target.rotation || 0}rad)`;

  const contact = motion.contact * (1 - sequence);
  orbShadow.style.left = `${(window.innerWidth * 0.5).toFixed(2)}px`;
  orbShadow.style.top = `${motion.floor.toFixed(2)}px`;
  orbShadow.style.width = `${(size * (0.48 + contact * 0.42)).toFixed(2)}px`;
  orbShadow.style.opacity = (circleIn * (0.08 + contact * 0.34) * (1 - sequence)).toFixed(3);
  orbRipple.style.left = orbShadow.style.left;
  orbRipple.style.top = orbShadow.style.top;
  orbRipple.style.width = `${(size * (1 + motion.impact * 2.2)).toFixed(2)}px`;
  orbRipple.style.opacity = (motion.impact * 0.48 * (1 - sequence)).toFixed(3);
}

function updateScene(t) {
  const s = Math.max(0, t - 10.2);
  const inSeq = smoothstep(0, 1.2, s);
  roomLight.intensity = lerp(0, variant.roomLight || 2.5, inSeq);
  accent.intensity = lerp(1.7, variant.accent || 2.4, inSeq);

  const target = new THREE.Vector3(0, 0.2, -2.0);
  camera.position.set(0, lerp(0.75, variant.cameraY || 1.05, inSeq), lerp(8.5, variant.cameraZ || 7.2, inSeq));
  if (variant.cameraX) camera.position.x = lerp(0, variant.cameraX, inSeq);
  camera.lookAt(target);

  variant.update(s, inSeq);
}

function introMotion(time) {
  const floor = window.innerHeight * 0.78;
  const startY = window.innerHeight * 0.43;
  let y = startY;
  let velocity = -20;
  let impact = 0;
  let contact = 0;
  const dt = 1 / 90;
  let remaining = Math.min(time, 4.95);
  while (remaining > 0) {
    const step = Math.min(dt, remaining);
    velocity += 1620 * step;
    y += velocity * step;
    if (y >= floor && velocity > 0) {
      y = floor;
      const power = velocity;
      if (power > 70) {
        velocity = -power * 0.56;
        impact = Math.min(1, power / 1500);
      } else {
        velocity = 0;
      }
    }
    remaining -= step;
  }
  const lift = smoothstep(4.95, 6.25, time);
  if (lift > 0) y = lerp(y, startY, easeInOutCubic(lift));
  contact = 1 - Math.min(1, Math.abs(floor - y) / 230);
  return { y, floor, contact, impact: impact * (1 - lift), size: lerp(132, 116, smoothstep(0, 2, time)) };
}

function buildRoom() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(13, 10), matFloor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -2.45, 0.7);
  floor.receiveShadow = true;
  scene.add(floor);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(13, 7.8), matDark);
  back.position.set(0, 0.2, -3.6);
  back.receiveShadow = true;
  scene.add(back);

  const left = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 7.8), matDark.clone());
  left.position.set(-6.5, 0.2, 0);
  left.rotation.y = Math.PI / 2;
  left.receiveShadow = true;
  scene.add(left);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 7.8), matDark.clone());
  right.position.set(6.5, 0.2, 0);
  right.rotation.y = -Math.PI / 2;
  right.receiveShadow = true;
  scene.add(right);
}

function buildVariant(id, group) {
  const builders = [
    buildMacbookAbsorb,
    buildShockwaveSummon,
    buildSplitIcons,
    buildAppWindow,
    buildWallProjection,
    buildKeyPress,
    buildGlassPanels,
    buildLensZoom,
    buildDeskAssembly,
    buildUpdateBadge
  ];
  return builders[Math.max(0, Math.min(9, id - 1))](group);
}

function buildMacbookAbsorb(group) {
  const laptop = makeLaptop();
  group.add(laptop.group);
  return {
    roomLight: 3.0,
    update(t, intro) {
      laptop.group.position.y = lerp(-2.8, -1.05, easeOutCubic(smoothstep(0.1, 2.1, t)));
      laptop.group.rotation.x = lerp(0.25, 0, intro);
      laptop.setScreenPower(smoothstep(1.2, 2.6, t));
      pulseLines(laptop.uiLines, t, smoothstep(2, 6, t));
    }
  };
}

function buildShockwaveSummon(group) {
  const laptop = makeLaptop();
  laptop.group.position.y = -3.2;
  group.add(laptop.group);
  const rings = [];
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.7, 0.012, 10, 120),
      new THREE.MeshBasicMaterial({ color: GREEN_2, transparent: true, opacity: 0 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -2.38;
    group.add(ring);
    rings.push(ring);
  }
  return {
    roomLight: 2.7,
    cameraZ: 7.7,
    update(t) {
      rings.forEach((ring, i) => {
        const p = smoothstep(i * 0.28, i * 0.28 + 2.0, t);
        ring.scale.setScalar(lerp(0.2, 3.6, p));
        ring.material.opacity = Math.sin(p * Math.PI) * 0.46;
      });
      laptop.group.position.y = lerp(-3.2, -1.05, easeOutCubic(smoothstep(1.1, 3.4, t)));
      laptop.setScreenPower(smoothstep(2.4, 3.7, t));
      pulseLines(laptop.uiLines, t, smoothstep(3, 7, t));
    }
  };
}

function buildSplitIcons(group) {
  const laptop = makeLaptop();
  group.add(laptop.group);
  const icons = ["mic", "doc", "ios"].map((name, i) => makeFeatureIcon(name, i));
  icons.forEach((icon) => group.add(icon));
  return {
    roomLight: 2.8,
    cameraZ: 7.5,
    update(t) {
      laptop.group.position.y = lerp(-2.2, -1.05, smoothstep(0.4, 1.8, t));
      laptop.setScreenPower(smoothstep(1.2, 2.4, t));
      icons.forEach((icon, i) => {
        const angle = -Math.PI / 2 + i * Math.PI / 2;
        const p = easeOutCubic(smoothstep(1.0 + i * 0.2, 2.8 + i * 0.2, t));
        icon.position.set(Math.cos(angle) * lerp(0, 2.1, p), lerp(0.35, 1.35, p), -1.55 + Math.sin(angle) * 0.25);
        icon.rotation.y += 0.018;
        icon.scale.setScalar(lerp(0.1, 1, p));
      });
    }
  };
}

function buildAppWindow(group) {
  const windowGroup = new THREE.Group();
  group.add(windowGroup);
  const panel = makePanel(3.8, 2.5, 0x102016, 0.9);
  windowGroup.add(panel);
  const bars = [];
  for (let i = 0; i < 7; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.6 - i * 0.18, 0.05, 0.035), matGreen.clone());
    bar.position.set(-0.15, 0.68 - i * 0.22, 0.08);
    windowGroup.add(bar);
    bars.push(bar);
  }
  return {
    roomLight: 2.2,
    cameraZ: 6.6,
    update(t) {
      const p = easeOutCubic(smoothstep(0.2, 2.1, t));
      windowGroup.position.set(0, lerp(-0.15, 0.4, p), -1.8);
      windowGroup.scale.set(lerp(0.08, 1.0, p), lerp(0.08, 1.0, p), 1);
      bars.forEach((bar, i) => {
        bar.scale.x = smoothstep(1.6 + i * 0.18, 2.8 + i * 0.18, t);
      });
    }
  };
}

function buildWallProjection(group) {
  const planes = [];
  for (let i = 0; i < 3; i++) {
    const panel = makePanel(2.2, 1.45, [0x102218, 0x141e28, 0x20182a][i], 0.72);
    panel.position.set((i - 1) * 2.45, 0.62, -3.42);
    group.add(panel);
    planes.push(panel);
  }
  return {
    roomLight: 2.0,
    cameraZ: 7.0,
    update(t) {
      planes.forEach((panel, i) => {
        const p = smoothstep(0.7 + i * 0.4, 2.1 + i * 0.4, t);
        panel.scale.setScalar(lerp(0.2, 1, easeOutCubic(p)));
        panel.material.opacity = p * 0.72;
        panel.rotation.y = Math.sin(t * 0.7 + i) * 0.04;
      });
    }
  };
}

function buildKeyPress(group) {
  const laptop = makeLaptop();
  group.add(laptop.group);
  const keyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.34), matGreen.clone());
  keyMesh.position.set(0, -1.4, 0.72);
  keyMesh.castShadow = true;
  group.add(keyMesh);
  return {
    roomLight: 2.7,
    cameraZ: 7.4,
    update(t) {
      laptop.group.position.y = lerp(-2.4, -1.05, smoothstep(0.2, 1.6, t));
      const press = Math.sin(smoothstep(1.8, 2.8, t) * Math.PI);
      keyMesh.position.y = -1.4 - press * 0.08;
      keyMesh.scale.set(1 + press * 0.08, 1 - press * 0.3, 1 + press * 0.05);
      laptop.setScreenPower(smoothstep(2.35, 3.3, t));
      pulseLines(laptop.uiLines, t, smoothstep(2.6, 7, t));
    }
  };
}

function buildGlassPanels(group) {
  const panels = [];
  for (let i = 0; i < 3; i++) {
    const panel = makePanel(1.45, 2.1, 0x0f2618, 0.36);
    panel.material.transparent = true;
    panel.position.x = (i - 1) * 1.65;
    panel.position.z = -1.7;
    group.add(panel);
    panels.push(panel);
  }
  const laptop = makeLaptop();
  laptop.group.position.y = -2.8;
  group.add(laptop.group);
  return {
    roomLight: 2.6,
    cameraZ: 7.1,
    update(t) {
      panels.forEach((panel, i) => {
        const p = smoothstep(0.4 + i * 0.28, 2.1 + i * 0.28, t);
        panel.position.y = lerp(-2.3, 0.35, easeOutCubic(p));
        panel.rotation.y = lerp((i - 1) * 0.25, 0, smoothstep(2.4, 3.4, t));
        panel.material.opacity = Math.sin(Math.min(1, p) * Math.PI) * 0.42;
      });
      laptop.group.position.y = lerp(-2.8, -1.05, smoothstep(3.0, 4.2, t));
      laptop.setScreenPower(smoothstep(3.6, 4.6, t));
    }
  };
}

function buildLensZoom(group) {
  const rings = [];
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.65 + i * 0.22, 0.016, 12, 120),
      new THREE.MeshBasicMaterial({ color: GREEN_2, transparent: true, opacity: 0 })
    );
    ring.position.set(0, 0.35, -1.7 - i * 0.07);
    group.add(ring);
    rings.push(ring);
  }
  const panel = makePanel(3.4, 2.2, 0x102016, 0.86);
  panel.position.set(0, 0.35, -2.25);
  group.add(panel);
  return {
    roomLight: 2.1,
    cameraZ: 6.5,
    update(t) {
      rings.forEach((ring, i) => {
        const p = smoothstep(0.2 + i * 0.12, 2.0 + i * 0.12, t);
        ring.scale.setScalar(lerp(0.1, 1.25, p));
        ring.rotation.z = t * (0.15 + i * 0.04);
        ring.material.opacity = (1 - p * 0.55) * smoothstep(0, 0.7, p);
      });
      panel.scale.setScalar(smoothstep(1.8, 3.0, t));
      panel.material.opacity = smoothstep(2.0, 3.2, t) * 0.86;
    }
  };
}

function buildDeskAssembly(group) {
  const laptop = makeLaptop();
  const phone = makePhone();
  laptop.group.position.set(-0.55, -2.8, -1.25);
  phone.position.set(1.95, -2.2, -1.05);
  group.add(laptop.group, phone);
  const platform = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.12, 2.5), new THREE.MeshStandardMaterial({ color: 0x111a14, roughness: 0.68 }));
  platform.position.set(0, -2.1, -1.0);
  platform.receiveShadow = true;
  group.add(platform);
  return {
    roomLight: 3.1,
    cameraZ: 7.6,
    update(t) {
      platform.position.y = lerp(-3.0, -2.1, smoothstep(0.2, 1.5, t));
      laptop.group.position.y = lerp(-3.0, -1.05, smoothstep(1.0, 2.7, t));
      phone.position.y = lerp(-3.0, -0.9, smoothstep(1.5, 3.0, t));
      phone.rotation.z = lerp(0.25, -0.08, smoothstep(2.1, 3.3, t));
      laptop.setScreenPower(smoothstep(2.8, 3.8, t));
    }
  };
}

function buildUpdateBadge(group) {
  const icon = new THREE.Group();
  const frame = makePanel(2.0, 2.0, GREEN, 1);
  frame.material = matGreen.clone();
  icon.add(frame);
  const badge = new THREE.Mesh(new THREE.SphereGeometry(0.32, 48, 32), new THREE.MeshPhysicalMaterial({ color: 0xfff2c8, roughness: 0.28, clearcoat: 0.4 }));
  badge.position.set(0.85, 0.86, 0.18);
  icon.add(badge);
  group.add(icon);
  const cards = [makeFeatureCard("VOICE"), makeFeatureCard("PRD"), makeFeatureCard("iOS")];
  cards.forEach((card, i) => {
    card.position.set((i - 1) * 1.75, -1.28, -0.12);
    group.add(card);
  });
  return {
    roomLight: 2.5,
    cameraZ: 6.7,
    update(t) {
      icon.position.set(0, lerp(-1.5, 0.55, smoothstep(0.2, 2.0, t)), -1.7);
      icon.rotation.y = Math.sin(t * 0.7) * 0.08;
      icon.scale.setScalar(lerp(0.15, 1, smoothstep(0.3, 2.0, t)));
      badge.scale.setScalar(1 + Math.sin(t * 5) * 0.04);
      cards.forEach((card, i) => {
        const p = smoothstep(2.0 + i * 0.32, 3.0 + i * 0.32, t);
        card.scale.setScalar(lerp(0.15, 1, easeOutCubic(p)));
        card.position.y = lerp(-2.3, -1.28, p);
      });
    }
  };
}

function makeLaptop() {
  const group = new THREE.Group();
  group.position.set(0, -1.05, -1.25);
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 2.1), new THREE.MeshStandardMaterial({ color: 0x1a211c, roughness: 0.5, metalness: 0.1 }));
  base.position.y = -0.92;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);
  const screenShell = new THREE.Mesh(new THREE.BoxGeometry(3.55, 2.16, 0.12), new THREE.MeshStandardMaterial({ color: 0x0e1511, roughness: 0.52, metalness: 0.08 }));
  screenShell.position.set(0, 0.26, -0.92);
  screenShell.castShadow = true;
  screenShell.receiveShadow = true;
  group.add(screenShell);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.25, 1.86), new THREE.MeshBasicMaterial({ color: 0x08100b, transparent: true, opacity: 0.95 }));
  screen.position.set(0, 0.26, -0.845);
  group.add(screen);
  const uiLines = [];
  for (let i = 0; i < 8; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(1.0 + (i % 3) * 0.45, 0.035, 0.012), new THREE.MeshBasicMaterial({ color: GREEN_2, transparent: true, opacity: 0 }));
    line.position.set(-0.62 + (i % 2) * 0.22, 0.9 - i * 0.2, -0.83);
    group.add(line);
    uiLines.push(line);
  }
  return {
    group,
    uiLines,
    setScreenPower(power) {
      screen.material.color.setRGB(0.03, 0.12 + power * 0.12, 0.06);
      uiLines.forEach((line, i) => {
        line.material.opacity = power * (0.36 + (i % 3) * 0.16);
      });
    }
  };
}

function makePhone() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.45, 0.08), new THREE.MeshStandardMaterial({ color: 0x101713, roughness: 0.42, metalness: 0.08 }));
  body.castShadow = true;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 1.2), new THREE.MeshBasicMaterial({ color: 0x083412 }));
  screen.position.z = 0.05;
  group.add(body, screen);
  return group;
}

function makePanel(w, h, color, opacity) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, 0.045),
    new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.02, transparent: true, opacity })
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeFeatureIcon(name, i) {
  const group = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.36, 48, 32), matGreen.clone());
  group.add(shell);
  const mark = new THREE.Mesh(new THREE.BoxGeometry(name === "ios" ? 0.22 : 0.42, 0.08, 0.04), new THREE.MeshBasicMaterial({ color: 0x061008 }));
  mark.position.z = 0.34;
  mark.rotation.z = i === 1 ? Math.PI / 2 : 0;
  group.add(mark);
  return group;
}

function makeFeatureCard(label) {
  const group = new THREE.Group();
  const card = makePanel(1.28, 0.72, 0x102016, 0.88);
  group.add(card);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.055, 0.04), new THREE.MeshBasicMaterial({ color: GREEN_2, transparent: true, opacity: 0.8 }));
  stripe.position.z = 0.05;
  group.add(stripe);
  const small = new THREE.Mesh(new THREE.BoxGeometry(0.32 + label.length * 0.02, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: 0xd9ffe0, transparent: true, opacity: 0.7 }));
  small.position.set(0, -0.18, 0.05);
  group.add(small);
  return group;
}

function pulseLines(lines, t, amount) {
  lines.forEach((line, i) => {
    line.scale.x = 0.55 + amount * (0.42 + Math.sin(t * 2.4 + i) * 0.12);
  });
}

function getVariantLogoTarget(id, sequence) {
  const center = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.43, size: 116, rotation: 0 };
  const screen = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.47, size: 54, rotation: 0 };
  const left = { x: window.innerWidth * 0.22, y: window.innerHeight * 0.46, size: 64, rotation: -0.1 };
  const targets = {
    1: screen,
    2: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.74, size: 78, rotation: 0 },
    3: center,
    4: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.44, size: lerp(116, 340, sequence), rotation: 0 },
    5: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.32, size: 72, rotation: 0 },
    6: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.62, size: 62, rotation: 0 },
    7: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.42, size: 70, rotation: 0 },
    8: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.43, size: lerp(116, 52, sequence), rotation: sequence * Math.PI },
    9: { x: window.innerWidth * 0.36, y: window.innerHeight * 0.5, size: 58, rotation: 0 },
    10: left
  };
  return targets[id] || screen;
}

function getVariantLogoFade(id, sequence) {
  if ([1, 2, 4, 8].includes(id)) return 1 - smoothstep(0.55, 1, sequence);
  if (id === 3) return 1;
  return 1 - smoothstep(0.75, 1, sequence) * 0.35;
}

function updateOrbShape(progressValue) {
  const frameProgress = easeInOutCubic(smoothstep(0, 0.52, progressValue));
  const foldProgress = easeInOutCubic(smoothstep(0.72, 1, progressValue));
  const holeProgress = easeInOutCubic(smoothstep(0.18, 0.9, progressValue));
  const outerFrame = interpolatePoints(circleShape.outer, frameShape.outer, frameProgress);
  const outer = interpolatePoints(outerFrame, logoShape.outer, foldProgress);
  const inner = interpolatePoints(circleShape.inner, logoShape.inner, holeProgress);
  orbPath.setAttribute("d", `${pointsToPath(outer)} ${pointsToPath(inner)}`);
}

function makeCircleLogoShape() {
  const center = { x: 50, y: 50 };
  const outer = [];
  const inner = [];
  for (let i = 0; i < SHAPE_POINTS; i++) {
    const angle = -Math.PI / 2 + (i / SHAPE_POINTS) * Math.PI * 2;
    outer.push({ x: center.x + Math.cos(angle) * 47, y: center.y + Math.sin(angle) * 47 });
    inner.push({ x: center.x, y: center.y });
  }
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

function sampleCubic(start, a, b, end, steps) {
  const points = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const inv = 1 - t;
    points.push({
      x: inv ** 3 * start.x + 3 * inv ** 2 * t * a.x + 3 * inv * t ** 2 * b.x + t ** 3 * end.x,
      y: inv ** 3 * start.y + 3 * inv ** 2 * t * a.y + 3 * inv * t ** 2 * b.y + t ** 3 * end.y
    });
  }
  return points;
}

function lerpPoint(from, to, t) {
  return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) };
}

function interpolatePoints(from, to, progressValue) {
  return from.map((point, index) => ({ x: lerp(point.x, to[index].x, progressValue), y: lerp(point.y, to[index].y, progressValue) }));
}

function pointsToPath(points) {
  const [first, ...rest] = points;
  return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} ${rest.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ")} Z`;
}

function makeNoiseTexture(base, mid, accentColor, strength) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(460, 300, 70, 512, 512, 720);
  gradient.addColorStop(0, accentColor);
  gradient.addColorStop(0.45, mid);
  gradient.addColorStop(1, base);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 1;
  for (let i = 0; i <= 1024; i += 128) {
    ctx.strokeStyle = `rgba(105,255,139,${0.08 * strength})`;
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
    ctx.fillStyle = `rgba(255,255,255,${(Math.random() * 0.035 + 0.008) * strength})`;
    ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function responsiveUnit() {
  return Math.min(window.innerWidth, 1440) / 6.8;
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
