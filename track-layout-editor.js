const canvas = document.getElementById("editor");
const ctx = canvas.getContext("2d");
const output = document.getElementById("output");
const stats = document.getElementById("stats");
const railMode = document.getElementById("railMode");
const xyloMode = document.getElementById("xyloMode");
const undoBtn = document.getElementById("undoBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");

const world = {
  xMin: -5.2,
  xMax: 5.2,
  yTop: 0.4,
  yBottom: -7.2,
  zMin: -1.4,
  zMax: 2.8
};

let mode = "rail";
let pendingRailStart = null;
const rails = [];
const xylophones = [];

resize();
render();
exportLayout();

window.addEventListener("resize", () => {
  resize();
  render();
});

railMode.addEventListener("click", () => setMode("rail"));
xyloMode.addEventListener("click", () => setMode("xylophone"));
undoBtn.addEventListener("click", undo);
clearBtn.addEventListener("click", clearAll);
copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(output.value);
  copyBtn.textContent = "Copied";
  setTimeout(() => (copyBtn.textContent = "Copy JSON"), 700);
});

canvas.addEventListener("pointerdown", (event) => {
  const point = screenToWorld(event.offsetX, event.offsetY);
  if (mode === "rail") {
    if (!pendingRailStart) {
      pendingRailStart = point;
    } else {
      rails.push({
        start: roundPoint(pendingRailStart),
        end: roundPoint(point),
        beat: rails.length + 1
      });
      pendingRailStart = null;
    }
  } else {
    xylophones.push({
      position: roundPoint(point),
      note: ["C4", "E4", "G4", "B4", "D5"][xylophones.length % 5],
      beat: xylophones.length + 1
    });
  }
  render();
  exportLayout();
});

canvas.addEventListener("pointermove", (event) => {
  if (!pendingRailStart || mode !== "rail") return;
  render(screenToWorld(event.offsetX, event.offsetY));
});

function setMode(next) {
  mode = next;
  pendingRailStart = null;
  railMode.classList.toggle("active", mode === "rail");
  xyloMode.classList.toggle("active", mode === "xylophone");
  render();
}

function undo() {
  if (pendingRailStart) {
    pendingRailStart = null;
  } else if (mode === "rail" && rails.length) {
    rails.pop();
  } else if (mode === "xylophone" && xylophones.length) {
    xylophones.pop();
  } else if (xylophones.length) {
    xylophones.pop();
  } else if (rails.length) {
    rails.pop();
  }
  render();
  exportLayout();
}

function clearAll() {
  pendingRailStart = null;
  rails.length = 0;
  xylophones.length = 0;
  render();
  exportLayout();
}

function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function render(hoverPoint = null) {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  drawGrid(rect);
  drawRails();
  drawXylophones();
  if (pendingRailStart) drawPendingRail(pendingRailStart, hoverPoint || pendingRailStart);
}

function drawGrid(rect) {
  ctx.fillStyle = "#bfc2ba";
  ctx.fillRect(0, 0, rect.width, rect.height);
  ctx.strokeStyle = "rgba(30,33,29,0.14)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 16; i++) {
    const x = (rect.width / 16) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rect.height);
    ctx.stroke();
  }
  for (let i = 0; i <= 12; i++) {
    const y = (rect.height / 12) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(rect.width, y);
    ctx.stroke();
  }
}

function drawRails() {
  rails.forEach((rail, index) => {
    const a = worldToScreen(rail.start);
    const b = worldToScreen(rail.end);
    drawRailPair(a, b, "#30342f", "#d8dad6");
    drawPoint(a, "#73ae4e", `${index + 1}`);
    drawPoint(b, "#d94435", "");
  });
}

function drawPendingRail(aWorld, bWorld) {
  const a = worldToScreen(aWorld);
  const b = worldToScreen(bWorld);
  drawRailPair(a, b, "rgba(32,38,30,0.45)", "rgba(115,174,78,0.9)");
  drawPoint(a, "#73ae4e", "start");
}

function drawRailPair(a, b, shadowColor, railColor) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = (-dy / length) * 8;
  const ny = (dx / length) * 8;
  const a1 = { x: a.x + nx, y: a.y + ny };
  const b1 = { x: b.x + nx, y: b.y + ny };
  const a2 = { x: a.x - nx, y: a.y - ny };
  const b2 = { x: b.x - nx, y: b.y - ny };

  drawRailLine(a1, b1, shadowColor, 7);
  drawRailLine(a2, b2, shadowColor, 7);
  drawRailLine(a1, b1, railColor, 3);
  drawRailLine(a2, b2, railColor, 3);
}

function drawRailLine(a, b, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function drawXylophones() {
  xylophones.forEach((item, index) => {
    const p = worldToScreen(item.position);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(-0.2);
    ctx.fillStyle = "#d94435";
    ctx.roundRect(-28, -12, 56, 24, 5);
    ctx.fill();
    ctx.fillStyle = "#52d1cf";
    ctx.roundRect(-20, -8, 32, 16, 4);
    ctx.fill();
    ctx.restore();
    drawPoint(p, "#151812", `${index + 1}`);
  });
}

function drawPoint(p, color, label) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
  ctx.fill();
  if (!label) return;
  ctx.fillStyle = "#eef2ea";
  ctx.font = "700 11px Inter, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, p.x, p.y);
}

function exportLayout() {
  const data = {
    coordinateSystem: {
      description: "Front-view layout. Rails are centerlines for the marble path; the renderer draws two physical rails around each centerline.",
      world
    },
    rails,
    xylophones
  };
  output.value = JSON.stringify(data, null, 2);
  stats.textContent = `${rails.length} rails, ${xylophones.length} xylophones`;
}

function screenToWorld(x, y) {
  const rect = canvas.getBoundingClientRect();
  const nx = x / rect.width;
  const ny = y / rect.height;
  const worldY = lerp(world.yTop, world.yBottom, ny);
  return {
    x: lerp(world.xMin, world.xMax, nx),
    y: worldY,
    z: lerp(world.zMin, world.zMax, ny)
  };
}

function worldToScreen(point) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((point.x - world.xMin) / (world.xMax - world.xMin)) * rect.width,
    y: ((point.y - world.yTop) / (world.yBottom - world.yTop)) * rect.height
  };
}

function roundPoint(point) {
  return {
    x: Number(point.x.toFixed(2)),
    y: Number(point.y.toFixed(2)),
    z: Number(point.z.toFixed(2))
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
