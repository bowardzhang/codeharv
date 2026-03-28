import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

// Expose monaco for external access (e.g. browser console debugging)
window.__monaco = monaco;

/* ============================================================
   i18n  (translations loaded from i18n.js)
============================================================ */

// I18N, MISSION_I18N, ACHIEVEMENT_I18N, FREE_MISSION_COUNT are defined in i18n.js

let currentLang = localStorage.getItem("codeharv_lang") || "en";

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
}

// Translate mission fields using MISSION_I18N
function tm(missionId, field) {
  const m = MISSION_I18N[missionId];
  if (!m) return "";
  const lang = m[currentLang] || m.en;
  return lang[field] || "";
}

// Translate achievement fields using ACHIEVEMENT_I18N
function ta(achievementId, field) {
  const a = ACHIEVEMENT_I18N[achievementId];
  if (!a) return "";
  const lang = a[currentLang] || a.en;
  return lang[field] || "";
}

// Premium state
let isPremium = false;

async function checkPremiumStatus() {
  if (!authToken) { isPremium = false; return; }
  try {
    const res = await fetch(`/api/premium-status?token=${authToken}`);
    const data = await res.json();
    isPremium = data.is_premium === true;
  } catch(e) { /* ignore */ }
}

/* ============================================================
   Editor
============================================================ */

const DEFAULT_CODE = `# Welcome to Code Harv!
# Complete missions to learn Python step by step.
# Mission 1: Plant your first crop!

plant("grass", 0, 0)
`;

const editor = monaco.editor.create(document.getElementById('editor'), {
  value: DEFAULT_CODE,
  language: 'python',
  theme: 'vs',
  automaticLayout: true,
  minimap: { enabled: false },
  fontSize: 15,
  lineHeight: 22,
  tabSize: 4,
  insertSpaces: true,
  wordWrap: 'on',
  scrollBeyondLastLine: false,
  padding: { top: 8 },
});

window.__editor = editor;

let currentLineDecoration = [];

function highlightLine(line, isError) {
  currentLineDecoration = editor.deltaDecorations(
    currentLineDecoration,
    [{
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className: isError ? 'error-line-highlight' : 'current-line-highlight'
      }
    }]
  );
}

function clearHighlight() {
  currentLineDecoration = editor.deltaDecorations(currentLineDecoration, []);
}

/* ============================================================
   Autocomplete
============================================================ */

monaco.languages.registerCompletionItemProvider('python', {
  provideCompletionItems: () => ({
    suggestions: [
      { label: 'plant', kind: monaco.languages.CompletionItemKind.Function, insertText: 'plant("${1:crop}", ${2:x}, ${3:y})', insertTextRules: 4, documentation: 'Plant a crop at (x, y)' },
      { label: 'harvest', kind: monaco.languages.CompletionItemKind.Function, insertText: 'harvest(${1:x}, ${2:y})', insertTextRules: 4, documentation: 'Harvest mature crop at (x, y)' },
      { label: 'water', kind: monaco.languages.CompletionItemKind.Function, insertText: 'water(${1:x}, ${2:y})', insertTextRules: 4, documentation: 'Water crop at (x, y) - costs 2 gold' },
      { label: 'fertilize', kind: monaco.languages.CompletionItemKind.Function, insertText: 'fertilize(${1:x}, ${2:y})', insertTextRules: 4, documentation: 'Fertilize crop at (x, y) - costs 3 gold' },
      { label: 'is_mature', kind: monaco.languages.CompletionItemKind.Function, insertText: 'is_mature(${1:x}, ${2:y})', insertTextRules: 4, documentation: 'Check if crop at (x, y) is mature' },
      { label: 'wait', kind: monaco.languages.CompletionItemKind.Function, insertText: 'wait(${1:seconds})', insertTextRules: 4, documentation: 'Wait for time to pass' },
      { label: 'clear', kind: monaco.languages.CompletionItemKind.Function, insertText: 'clear()', insertTextRules: 4, documentation: 'Clear the entire farm field' },
      { label: 'get_weather', kind: monaco.languages.CompletionItemKind.Function, insertText: 'get_weather()', insertTextRules: 4, documentation: 'Get current weather condition' },
      { label: 'get_status', kind: monaco.languages.CompletionItemKind.Function, insertText: 'get_status(${1:x}, ${2:y})', insertTextRules: 4, documentation: 'Get crop status at (x, y)' },
      { label: 'print', kind: monaco.languages.CompletionItemKind.Function, insertText: 'print(${1:value})', insertTextRules: 4, documentation: 'Print value to console' },
      { label: 'sell', kind: monaco.languages.CompletionItemKind.Function, insertText: 'sell(${1:x}, ${2:y})', insertTextRules: 4, documentation: 'Sell mature crop at market price' },
      { label: 'get_price', kind: monaco.languages.CompletionItemKind.Function, insertText: 'get_price("${1:crop}")', insertTextRules: 4, documentation: 'Get current market price for a crop' },
      { label: 'get_market', kind: monaco.languages.CompletionItemKind.Function, insertText: 'get_market()', insertTextRules: 4, documentation: 'Get all current market prices' },
      { label: 'get_gold', kind: monaco.languages.CompletionItemKind.Function, insertText: 'get_gold()', insertTextRules: 4, documentation: 'Get current gold amount' },
      { label: 'get_time', kind: monaco.languages.CompletionItemKind.Function, insertText: 'get_time()', insertTextRules: 4, documentation: 'Get current farm time' },
      { label: 'get_all_mature', kind: monaco.languages.CompletionItemKind.Function, insertText: 'get_all_mature()', insertTextRules: 4, documentation: 'Get list of all mature crop positions' },
      { label: 'get_all_planted', kind: monaco.languages.CompletionItemKind.Function, insertText: 'get_all_planted()', insertTextRules: 4, documentation: 'Get list of all planted crops' },
      { label: 'count_crops', kind: monaco.languages.CompletionItemKind.Function, insertText: 'count_crops()', insertTextRules: 4, documentation: 'Count planted crops' },
      { label: 'has_pest', kind: monaco.languages.CompletionItemKind.Function, insertText: 'has_pest(${1:x}, ${2:y})', insertTextRules: 4, documentation: 'Check if cell has a pest' },
      { label: 'remove_pest', kind: monaco.languages.CompletionItemKind.Function, insertText: 'remove_pest(${1:x}, ${2:y})', insertTextRules: 4, documentation: 'Remove pest at (x,y) - costs 5 gold' },
      { label: 'get_pests', kind: monaco.languages.CompletionItemKind.Function, insertText: 'get_pests()', insertTextRules: 4, documentation: 'Get list of all pests' },
      { label: 'range', kind: monaco.languages.CompletionItemKind.Function, insertText: 'range(${1:n})', insertTextRules: 4, documentation: 'Generate a range of numbers' },
      { label: 'len', kind: monaco.languages.CompletionItemKind.Function, insertText: 'len(${1:obj})', insertTextRules: 4, documentation: 'Get length of a list or string' },
      { label: 'enumerate', kind: monaco.languages.CompletionItemKind.Function, insertText: 'enumerate(${1:iterable})', insertTextRules: 4, documentation: 'Get index-value pairs from iterable' },
      { label: 'sorted', kind: monaco.languages.CompletionItemKind.Function, insertText: 'sorted(${1:iterable})', insertTextRules: 4, documentation: 'Return a sorted list' },
      { label: 'list', kind: monaco.languages.CompletionItemKind.Function, insertText: 'list(${1:iterable})', insertTextRules: 4, documentation: 'Convert to list' },
      { label: 'sum', kind: monaco.languages.CompletionItemKind.Function, insertText: 'sum(${1:iterable})', insertTextRules: 4, documentation: 'Sum all values in iterable' },
      { label: 'abs', kind: monaco.languages.CompletionItemKind.Function, insertText: 'abs(${1:value})', insertTextRules: 4, documentation: 'Get absolute value' },
      { label: 'max', kind: monaco.languages.CompletionItemKind.Function, insertText: 'max(${1:args})', insertTextRules: 4, documentation: 'Get maximum value' },
      { label: 'min', kind: monaco.languages.CompletionItemKind.Function, insertText: 'min(${1:args})', insertTextRules: 4, documentation: 'Get minimum value' },
      { label: 'round', kind: monaco.languages.CompletionItemKind.Function, insertText: 'round(${1:number})', insertTextRules: 4, documentation: 'Round a number' },
    ]
  })
});

/* ============================================================
   Console
============================================================ */

const consoleEl = document.getElementById('console');

function log(msg, color) {
  const span = document.createElement('span');
  span.textContent = msg + '\n';
  if (color) span.style.color = color;
  consoleEl.appendChild(span);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

/* ============================================================
   Toast Notifications
============================================================ */

const toastContainer = document.getElementById('toastContainer');

function showToastNotification(title, detail, cssClass) {
  const el = document.createElement('div');
  el.className = `toast ${cssClass}`;
  el.innerHTML = `<div class="toast-title">${title}</div><div class="toast-detail">${detail}</div>`;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ============================================================
   Canvas / Rendering
============================================================ */

const canvas = document.getElementById('farmCanvas');
const ctx = canvas.getContext('2d');

let canvasCSSWidth = 0;
let canvasCSSHeight = 0;

let GRID = 0;
let FIELD_RATIO = null;
let field = null;
let EXEC_INTERVAL = 0;
const floatingTexts = [];

/* ---------- background ---------- */
let bgImg = new Image();
let bgRect = null;
let bgScale = 1;

function fieldPoint(r) {
  if (!bgRect) return { x: 0, y: 0 };
  return {
    x: bgRect.x + r.x * bgRect.w,
    y: bgRect.y + r.y * bgRect.h
  };
}

function updateFieldFromCanvas() {
  if (!FIELD_RATIO || !bgRect) return;
  field = {
    topLeft: fieldPoint({ x: FIELD_RATIO.topLeft[0], y: FIELD_RATIO.topLeft[1] }),
    topRight: fieldPoint({ x: FIELD_RATIO.topRight[0], y: FIELD_RATIO.topRight[1] }),
    bottomLeft: fieldPoint({ x: FIELD_RATIO.bottomLeft[0], y: FIELD_RATIO.bottomLeft[1] }),
    bottomRight: fieldPoint({ x: FIELD_RATIO.bottomRight[0], y: FIELD_RATIO.bottomRight[1] })
  };
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvasCSSWidth = rect.width;
  canvasCSSHeight = rect.height;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawScene(currentFarm);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

/* ---------- grid mapping ---------- */
const EMPTY_FARM = { gold: null, time: null, grid: [], weather: "sunny", weather_info: { emoji: "☀️", desc: "Sunny" } };
let currentFarm = EMPTY_FARM;
const CELL_HIT_RADIUS = 28;
let hoveredCell = null;

function gridUVToScreen(u, v) {
  const px =
    field.topLeft.x * (1 - u) * (1 - v) +
    field.topRight.x * u * (1 - v) +
    field.bottomLeft.x * (1 - u) * v +
    field.bottomRight.x * u * v;
  const py =
    field.topLeft.y * (1 - u) * (1 - v) +
    field.topRight.y * u * (1 - v) +
    field.bottomLeft.y * (1 - u) * v +
    field.bottomRight.y * u * v;
  return { x: px, y: py, depth: v };
}

function gridToScreen(x, y) {
  return gridUVToScreen(
    (x + 0.35) / (GRID - 1),
    (y + 0.2) / (GRID - 1)
  );
}

/* ---------- draw crop ---------- */
const cropEmoji = {
  grass: "🌿", wheat: "🌾", carrot: "🥕", cabbage: "🥬",
  strawberry: "🍓", eggplant: "🍆", tomato: "🍅",
  sunflower: "🌻", pumpkin: "🎃", golden_apple: "🍎"
};

const cropStages = {
  grass:        ["🌱", "🌿", "🌿"],
  wheat:        ["🌱", "🪴", "🌾"],
  carrot:       ["🌱", "🪴", "🥕"],
  cabbage:      ["🌱", "🪴", "🥬"],
  strawberry:   ["🌱", "🪴", "🍓"],
  eggplant:     ["🌱", "🪴", "🍆"],
  tomato:       ["🌱", "🪴", "🍅"],
  sunflower:    ["🌱", "🪴", "🌻"],
  pumpkin:      ["🌱", "🪴", "🎃"],
  golden_apple: ["🌱", "🪴", "🍎"],
};

function getCropEmoji(type, maturity) {
  const stages = cropStages[type] || ["🌱", "🪴", "🌿"];
  if (maturity >= 1.0) return stages[2];
  if (maturity >= 0.5) return stages[1];
  return stages[0];
}

function drawCrop(cell, p) {
  const baseSize = 44;
  const depthScale = 1.0 + p.depth * 0.25;
  const maturityScale = 0.6 + cell.maturity * 0.4;
  const size = Math.max(32, Math.min(64, baseSize * bgScale * depthScale * maturityScale));

  ctx.save();
  ctx.font = `${size}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(getCropEmoji(cell.type, cell.maturity), p.x, p.y);
  ctx.restore();
}

function drawHarvestIndicator(p, depth) {
  const size = (14 + depth * 4) * bgScale;
  ctx.save();
  ctx.font = `${size}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🟢", p.x + size, p.y - size);
  ctx.restore();
}

/* ---------- scene drawing ---------- */
function getCellCorners(x, y) {
  const step = 1 / (GRID - 1);
  const u0 = x * step, v0 = y * step;
  const u1 = (x + 1) * step, v1 = (y + 1) * step;
  return [
    gridUVToScreen(u0, v0),
    gridUVToScreen(u1, v0),
    gridUVToScreen(u1, v1),
    gridUVToScreen(u0, v1)
  ];
}

function drawCellHighlight(x, y) {
  const corners = getCellCorners(x, y);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y);
  ctx.closePath();
  ctx.fillStyle = "rgba(0, 200, 255, 0.25)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(0, 200, 255, 0.9)";
  ctx.stroke();
  ctx.restore();
}

function drawFloatingTexts() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "20px serif";
  for (const ft of floatingTexts) {
    ctx.globalAlpha = ft.life;
    ctx.fillStyle = ft.color || "gold";
    ctx.fillText(ft.text, ft.x, ft.y);
  }
  ctx.restore();
}

function drawBackground() {
  const cw = canvasCSSWidth;
  const ch = canvasCSSHeight;
  const iw = bgImg.width;
  const ih = bgImg.height;
  bgScale = Math.min(cw / iw, ch / ih);
  const dw = iw * bgScale;
  const dh = ih * bgScale;
  const dx = (cw - dw) / 2;
  const dy = 0;
  bgRect = { x: dx, y: dy, w: dw, h: dh };
  ctx.drawImage(bgImg, dx, dy, dw, dh);
}

/* ---------- Weather Canvas Overlay ---------- */
let weatherParticles = [];
let lastWeatherType = null;

function initWeatherParticles(weather, cw, ch) {
  weatherParticles = [];
  if (weather === "rainy") {
    for (let i = 0; i < 120; i++) {
      weatherParticles.push({
        x: Math.random() * cw,
        y: Math.random() * ch,
        speed: 4 + Math.random() * 4,
        len: 10 + Math.random() * 15,
      });
    }
  } else if (weather === "windy") {
    for (let i = 0; i < 40; i++) {
      weatherParticles.push({
        x: Math.random() * cw,
        y: Math.random() * ch,
        speed: 2 + Math.random() * 3,
        size: 3 + Math.random() * 5,
        alpha: 0.15 + Math.random() * 0.25,
      });
    }
  } else if (weather === "drought") {
    for (let i = 0; i < 25; i++) {
      weatherParticles.push({
        x: Math.random() * cw,
        y: ch * 0.6 + Math.random() * ch * 0.4,
        speed: 0.3 + Math.random() * 0.6,
        size: 20 + Math.random() * 40,
        alpha: 0.08 + Math.random() * 0.12,
      });
    }
  }
}

function drawWeatherOverlay(weather) {
  if (!bgRect) return;
  const cw = canvasCSSWidth;
  const ch = canvasCSSHeight;

  if (weather !== lastWeatherType) {
    lastWeatherType = weather;
    initWeatherParticles(weather, cw, ch);
  }

  ctx.save();

  if (weather === "rainy") {
    // Blue-grey tint
    ctx.fillStyle = "rgba(80, 100, 140, 0.15)";
    ctx.fillRect(bgRect.x, bgRect.y, bgRect.w, bgRect.h);
    // Rain streaks
    ctx.strokeStyle = "rgba(180, 210, 255, 0.4)";
    ctx.lineWidth = 1.2;
    for (const p of weatherParticles) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 2, p.y + p.len);
      ctx.stroke();
      p.y += p.speed;
      p.x -= 0.5;
      if (p.y > ch) { p.y = -p.len; p.x = Math.random() * cw; }
    }
  } else if (weather === "cloudy") {
    // Grey desaturation overlay
    ctx.fillStyle = "rgba(120, 130, 140, 0.18)";
    ctx.fillRect(bgRect.x, bgRect.y, bgRect.w, bgRect.h);
    // Dim gradient from top
    const grad = ctx.createLinearGradient(0, bgRect.y, 0, bgRect.y + bgRect.h * 0.4);
    grad.addColorStop(0, "rgba(100, 110, 120, 0.20)");
    grad.addColorStop(1, "rgba(100, 110, 120, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(bgRect.x, bgRect.y, bgRect.w, bgRect.h * 0.4);
  } else if (weather === "windy") {
    // Slight cool tint
    ctx.fillStyle = "rgba(180, 200, 220, 0.08)";
    ctx.fillRect(bgRect.x, bgRect.y, bgRect.w, bgRect.h);
    // Horizontal wind streaks
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1.5;
    for (const p of weatherParticles) {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.size * 6, p.y - 1);
      ctx.stroke();
      p.x += p.speed;
      if (p.x > cw + 30) { p.x = -40; p.y = Math.random() * ch; }
    }
    ctx.globalAlpha = 1;
  } else if (weather === "drought") {
    // Warm amber tint
    ctx.fillStyle = "rgba(200, 150, 50, 0.15)";
    ctx.fillRect(bgRect.x, bgRect.y, bgRect.w, bgRect.h);
    // Heat shimmer / haze at bottom
    for (const p of weatherParticles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = "rgba(255, 220, 140, 0.15)";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.speed;
      p.y += Math.sin(p.x * 0.02) * 0.3;
      if (p.x > cw + p.size) { p.x = -p.size; }
    }
    ctx.globalAlpha = 1;
  } else if (weather === "sunny") {
    // Warm golden glow from top-right
    const grad = ctx.createRadialGradient(
      bgRect.x + bgRect.w * 0.85, bgRect.y, 0,
      bgRect.x + bgRect.w * 0.85, bgRect.y, bgRect.h * 0.6
    );
    grad.addColorStop(0, "rgba(255, 240, 180, 0.18)");
    grad.addColorStop(0.5, "rgba(255, 230, 150, 0.06)");
    grad.addColorStop(1, "rgba(255, 230, 150, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(bgRect.x, bgRect.y, bgRect.w, bgRect.h);
  }

  ctx.restore();
}

function drawScene(farm = EMPTY_FARM) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawWeatherOverlay(farm.weather || "sunny");
  updateFieldFromCanvas();
  updateResource(farm.gold ?? 0, farm.time ?? 0);
  updateWeatherDisplay(farm);

  const grid = farm.grid ?? [];
  if (!grid.length) return;

  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const cell = farm.grid[y][x];
      if (!cell) continue;
      const p = gridToScreen(x, y);
      if (hoveredCell && hoveredCell.x === x && hoveredCell.y === y) {
        drawCellHighlight(x, y);
      }
      if (!cell.type) continue;
      drawCrop(cell, p);
      if (cell.maturity >= 1.0) {
        drawHarvestIndicator(p, p.depth);
      }
      // Draw pest indicator
      if (farm.pests) {
        const pest = farm.pests.find(pe => pe.x === x && pe.y === y);
        if (pest) {
          const pestEmoji = pest.type === "bug" ? "🐛" : pest.type === "weed" ? "🌵" : "❄️";
          const pestSize = (14 + p.depth * 3) * bgScale;
          ctx.save();
          ctx.font = `${pestSize}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(pestEmoji, p.x - pestSize, p.y - pestSize);
          ctx.restore();
        }
      }
    }
  }
  drawFloatingTexts();
}

/* ---------- floating text animation ---------- */
let lastFrameTime = performance.now();

function updateFloatingTexts(dt) {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y += ft.vy * dt;
    ft.life -= dt;
    if (ft.life <= 0) floatingTexts.splice(i, 1);
  }
}

function animate(now) {
  const dt = (now - lastFrameTime) / 1000;
  lastFrameTime = now;
  updateFloatingTexts(dt);
  drawScene(currentFarm);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

/* ============================================================
   Resource & Weather & Level Display
============================================================ */

const resourceEl = document.getElementById("resource");
const weatherDisplay = document.getElementById("weatherDisplay");
const levelText = document.getElementById("levelText");
const xpFill = document.getElementById("xpFill");
const xpText = document.getElementById("xpText");

function updateResource(gold, time) {
  resourceEl.textContent = `💰 ${gold} | 🕒 ${Math.round(time)}`;
}

function updateWeatherDisplay(farm) {
  if (!farm || !farm.weather_info) return;
  const key = "weather_" + (farm.weather || "sunny");
  const name = t(key) !== key ? t(key) : capitalize(farm.weather || "sunny");
  weatherDisplay.textContent = `${farm.weather_info.emoji} ${name}`;
}


function updateLevelDisplay(farm) {
  if (!farm || farm.level === undefined) return;
  const level = farm.level;
  const rawTitle = farm.level_title || (farm.levels && farm.levels[level - 1] ? farm.levels[level - 1].title : "");
  // Translate level title if key exists, e.g. "level_seed_planter"
  const titleKey = "level_" + rawTitle.toLowerCase().replace(/\s+/g, "_");
  const title = t(titleKey) !== titleKey ? t(titleKey) : rawTitle;
  levelText.textContent = `Lv.${level} ${title}`;

  // XP progress bar
  const levels = farm.levels || [];
  const currentLvlXP = levels[level - 1] ? levels[level - 1].xp_needed : 0;
  const nextLvlXP = levels[level] ? levels[level].xp_needed : currentLvlXP;
  const xp = farm.xp || 0;

  let pct = 100;
  if (nextLvlXP > currentLvlXP) {
    pct = Math.min(100, ((xp - currentLvlXP) / (nextLvlXP - currentLvlXP)) * 100);
  }
  xpFill.style.width = `${pct}%`;
  xpText.textContent = `${xp} XP`;
}

const pestCountEl = document.getElementById("pestCount");

function updatePestDisplay(farm) {
  if (!farm || !farm.pests) {
    if (pestCountEl) pestCountEl.classList.add("hidden");
    return;
  }
  const count = farm.pests.length;
  if (count > 0) {
    pestCountEl.textContent = `🐛 ${count}`;
    pestCountEl.classList.remove("hidden");
  } else {
    pestCountEl.classList.add("hidden");
  }
}

/* ============================================================
   Mission Panel
============================================================ */

const missionTitle = document.getElementById("missionTitle");
const missionDesc = document.getElementById("missionDesc");
const missionConcept = document.getElementById("missionConcept");
const missionReward = document.getElementById("missionReward");
const missionHint = document.getElementById("missionHint");
const missionProgress = document.getElementById("missionProgress");
const hintBtn = document.getElementById("hintBtn");

let currentMissions = [];

function updateMissionPanel(missions) {
  if (!missions || !missions.length) return;
  currentMissions = missions;

  const completedCount = missions.filter(m => m.completed).length;
  missionProgress.textContent = `${completedCount} / ${missions.length}`;

  const playerLevel = (currentFarm && currentFarm.level) || 1;
  const active = missions.find(m => m.active && !m.completed);

  if (!active) {
    if (completedCount >= missions.length) {
      document.getElementById("missionContent").innerHTML =
        `<div class="mission-complete-msg">${t("all_missions_complete")}</div>`;
    }
    return;
  }

  // Check if this mission is premium-locked or level-locked
  const missionIdx = missions.indexOf(active);
  const isPremiumLocked = missionIdx >= FREE_MISSION_COUNT && !isPremium;
  const reqLevel = active.required_level || 1;
  const isLevelLocked = playerLevel < reqLevel;
  const isLocked = isPremiumLocked || isLevelLocked;

  const mId = active.id || "";
  missionTitle.textContent = tm(mId, "title") || active.title;
  missionDesc.textContent = isLocked ? "" : (tm(mId, "desc") || active.desc);
  missionConcept.textContent = `🧠 ${tm(mId, "concept") || active.concept}`;
  missionReward.textContent = `${t("reward")}: +${active.xp_reward} XP, +${active.gold_reward} gold`;

  if (isLevelLocked) {
    missionHint.textContent = "";
    missionHint.classList.add("hidden");
    hintBtn.style.display = "none";
    document.getElementById("loadHintBtn").style.display = "none";
    missionDesc.innerHTML = `<span style="color:#ef4444;">🔒 ${t("requires_level")} ${reqLevel}</span><br>
      <span style="font-size:12px;color:#64748b;">${t("level_up_hint")}</span>`;
  } else if (isPremiumLocked) {
    missionHint.textContent = "";
    missionHint.classList.add("hidden");
    hintBtn.style.display = "none";
    document.getElementById("loadHintBtn").style.display = "none";
    missionDesc.innerHTML = `<span style="color:#d97706;">${t("premium_required")}</span><br>
      <button onclick="document.getElementById('premiumModal').classList.remove('hidden')"
        style="margin-top:8px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;border-radius:6px;padding:6px 16px;font-size:12px;font-weight:600;cursor:pointer;">
        ${t("upgrade_to_premium")}
      </button>`;
  } else {
    missionHint.textContent = active.hint;
    missionHint.classList.add("hidden");
    hintBtn.textContent = t("show_hint");
    hintBtn.style.display = "";
    document.getElementById("loadHintBtn").style.display = "";
  }
}

hintBtn.addEventListener("click", () => {
  const isHidden = missionHint.classList.toggle("hidden");
  hintBtn.textContent = isHidden ? t("show_hint") : t("hide_hint");
});

// Load hint into editor
document.getElementById("loadHintBtn").onclick = function() {
  const active = currentMissions.find(m => m.active && !m.completed);
  if (active && active.hint) {
    const currentCode = editor.getValue().trim();
    if (currentCode && !confirm(t("confirm_load_hint") || "This will replace your current code. Continue?")) {
      return;
    }
    editor.setValue(active.hint);
    log(t("loaded_hint"));
  } else {
    log(t("no_hint"), "#f87171");
  }
};

/* ============================================================
   Crop Encyclopedia Modal
============================================================ */

const cropModal = document.getElementById("cropModal");
const cropList = document.getElementById("cropList");
const cropBookBtn = document.getElementById("cropBookBtn");
const cropModalClose = document.getElementById("cropModalClose");

const cropData = {
  grass:        { emoji: "🌿", cost: 1,  gain: 5,  speed_key: "fast",      required_level: 1 },
  wheat:        { emoji: "🌾", cost: 5,  gain: 10, speed_key: "medium",    required_level: 1 },
  carrot:       { emoji: "🥕", cost: 7,  gain: 15, speed_key: "medium",    required_level: 2 },
  cabbage:      { emoji: "🥬", cost: 8,  gain: 20, speed_key: "slow",      required_level: 3 },
  strawberry:   { emoji: "🍓", cost: 10, gain: 28, speed_key: "slow",      required_level: 4 },
  eggplant:     { emoji: "🍆", cost: 9,  gain: 22, speed_key: "very_slow", required_level: 5 },
  tomato:       { emoji: "🍅", cost: 10, gain: 18, speed_key: "medium",    required_level: 3 },
  sunflower:    { emoji: "🌻", cost: 12, gain: 30, speed_key: "slow",      required_level: 6 },
  pumpkin:      { emoji: "🎃", cost: 15, gain: 40, speed_key: "very_slow", required_level: 7 },
  golden_apple: { emoji: "🍎", cost: 25, gain: 60, speed_key: "very_slow", required_level: 9 },
};

function buildCropList() {
  cropList.innerHTML = "";
  const playerLevel = (currentFarm && currentFarm.level) || 1;
  for (const [name, info] of Object.entries(cropData)) {
    const profit = info.gain - info.cost;
    const roi = Math.round((profit / info.cost) * 100);
    const isLocked = playerLevel < info.required_level;
    const card = document.createElement("div");
    card.className = "crop-card" + (isLocked ? " crop-locked" : "");
    if (isLocked) {
      card.innerHTML = `
        <span class="crop-emoji" style="filter:grayscale(0.8);opacity:0.5;">${info.emoji}</span>
        <div class="crop-info">
          <div class="crop-name">${name} <span class="crop-tag crop-tag-locked">🔒 Lv.${info.required_level}</span></div>
          <div class="crop-stats" style="color:#94a3b8;">${t("requires_level")} ${info.required_level}</div>
        </div>
      `;
    } else {
      card.innerHTML = `
        <span class="crop-emoji">${info.emoji}</span>
        <div class="crop-info">
          <div class="crop-name">${name}</div>
          <div class="crop-stats">
            ${t("cost")}: ${info.cost}g | ${t("gain")}: ${info.gain}g<br>
            ${t("speed")}: ${t(info.speed_key)}<br>
            <span class="crop-profit">${t("profit")}: +${profit}g (${roi}% ROI)</span>
          </div>
        </div>
      `;
    }
    cropList.appendChild(card);
  }
}

buildCropList();

cropBookBtn.addEventListener("click", () => cropModal.classList.remove("hidden"));
cropModalClose.addEventListener("click", () => cropModal.classList.add("hidden"));
cropModal.addEventListener("click", (e) => { if (e.target === cropModal) cropModal.classList.add("hidden"); });

/* ============================================================
   Achievements Modal
============================================================ */

const achieveModal = document.getElementById("achieveModal");
const achieveList = document.getElementById("achieveList");
const achieveBtn = document.getElementById("achieveBtn");
const achieveModalClose = document.getElementById("achieveModalClose");

let currentAchievements = [];

function updateAchievementsList(achievements) {
  if (!achievements) return;
  currentAchievements = achievements;
  renderAchievements();
}

function renderAchievements() {
  achieveList.innerHTML = "";
  for (const ach of currentAchievements) {
    const card = document.createElement("div");
    card.className = `achieve-card ${ach.unlocked ? 'unlocked' : 'locked'}`;
    const aTitle = ta(ach.id, "title") || ach.title;
    const aDesc = ta(ach.id, "desc") || ach.desc;
    card.innerHTML = `
      <span class="achieve-emoji">${ach.emoji}</span>
      <div class="achieve-title">${aTitle}</div>
      <div class="achieve-desc">${aDesc}</div>
    `;
    achieveList.appendChild(card);
  }
}

achieveBtn.addEventListener("click", () => { renderAchievements(); achieveModal.classList.remove("hidden"); });
achieveModalClose.addEventListener("click", () => achieveModal.classList.add("hidden"));
achieveModal.addEventListener("click", (e) => { if (e.target === achieveModal) achieveModal.classList.add("hidden"); });

/* ============================================================
   Market Modal
============================================================ */

const marketModal = document.getElementById("marketModal");
const marketList = document.getElementById("marketList");
const marketBtn = document.getElementById("marketBtn");
const marketModalClose = document.getElementById("marketModalClose");

let currentMarketPrices = {};

function updateMarketList() {
  if (!marketList) return;
  marketList.innerHTML = "";

  for (const [name, info] of Object.entries(cropData)) {
    const basePrice = info.gain;
    const currentPrice = currentMarketPrices[name] || basePrice;
    const diff = currentPrice - basePrice;
    let priceClass = "price-normal";
    let arrow = "";
    if (diff > 0.5) { priceClass = "price-up"; arrow = "▲"; }
    else if (diff < -0.5) { priceClass = "price-down"; arrow = "▼"; }

    const card = document.createElement("div");
    card.className = "market-card";
    card.innerHTML = `
      <span class="market-emoji">${info.emoji}</span>
      <div>
        <div class="market-name">${name}</div>
        <div class="market-price">
          ${t("base_price")}: ${basePrice}g<br>
          ${t("current_price")}: <span class="${priceClass}">${currentPrice}g ${arrow}</span>
        </div>
      </div>
    `;
    marketList.appendChild(card);
  }
}

if (marketBtn) {
  marketBtn.addEventListener("click", () => { updateMarketList(); marketModal.classList.remove("hidden"); });
}
if (marketModalClose) {
  marketModalClose.addEventListener("click", () => marketModal.classList.add("hidden"));
}
if (marketModal) {
  marketModal.addEventListener("click", (e) => { if (e.target === marketModal) marketModal.classList.add("hidden"); });
}

/* ============================================================
   Auth System
============================================================ */

const authModal = document.getElementById("authModal");
const authModalClose = document.getElementById("authModalClose");
const loginBtn = document.getElementById("loginBtn");
const userDisplayEl = document.getElementById("userDisplay");
const authUsername = document.getElementById("authUsername");
const authPassword = document.getElementById("authPassword");
const authError = document.getElementById("authError");
const authLoginSubmit = document.getElementById("authLoginSubmit");
const authRegisterSubmit = document.getElementById("authRegisterSubmit");
const authLogoutArea = document.getElementById("authLogoutArea");
const authLogoutBtn = document.getElementById("authLogoutBtn");
const authCurrentUser = document.getElementById("authCurrentUser");

let authToken = localStorage.getItem("codeharv_token") || null;
let currentUsername = localStorage.getItem("codeharv_username") || null;

function updateAuthUI() {
  if (authToken && currentUsername) {
    const premBadge = isPremium ? " ⭐" : "";
    if (loginBtn) loginBtn.textContent = `👤 ${currentUsername}${premBadge}`;
    if (userDisplayEl) { userDisplayEl.textContent = currentUsername; userDisplayEl.classList.remove("hidden"); }
    if (authLoginSubmit) authLoginSubmit.style.display = "none";
    if (authRegisterSubmit) authRegisterSubmit.style.display = "none";
    if (authLogoutArea) { authLogoutArea.classList.remove("hidden"); }
    if (authCurrentUser) authCurrentUser.textContent = currentUsername;
    if (authUsername) authUsername.parentElement.style.display = "none";
    if (authPassword) authPassword.parentElement.style.display = "none";
  } else {
    if (loginBtn) loginBtn.textContent = t("login");
    if (userDisplayEl) userDisplayEl.classList.add("hidden");
    if (authLoginSubmit) authLoginSubmit.style.display = "";
    if (authRegisterSubmit) authRegisterSubmit.style.display = "";
    if (authLogoutArea) authLogoutArea.classList.add("hidden");
    if (authUsername) authUsername.parentElement.style.display = "";
    if (authPassword) authPassword.parentElement.style.display = "";
  }
}

async function doAuth(action) {
  const username = authUsername.value.trim();
  const password = authPassword.value.trim();
  if (!username || !password) {
    authError.textContent = "Please enter username and password";
    authError.style.display = "block";
    return;
  }
  authError.style.display = "none";

  try {
    const res = await fetch(`/api/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success) {
      authToken = data.token;
      currentUsername = data.username;
      localStorage.setItem("codeharv_token", authToken);
      localStorage.setItem("codeharv_username", currentUsername);
      updateAuthUI();
      authModal.classList.add("hidden");
      showToastNotification(
        `👤 ${action === "register" ? t("register") : t("login")}`,
        `Welcome, ${currentUsername}!`,
        "toast-mission"
      );
      // Load saved progress and check premium
      loadCloudProgress();
      await checkPremiumStatus();
      updateAuthUI();
      if (currentMissions.length) updateMissionPanel(currentMissions);
    } else {
      authError.textContent = data.message;
      authError.style.display = "block";
    }
  } catch (e) {
    authError.textContent = "Network error";
    authError.style.display = "block";
  }
}

async function loadCloudProgress() {
  if (!authToken) return;
  try {
    const res = await fetch(`/api/load?token=${authToken}`);
    const data = await res.json();
    if (data.success && data.save) {
      // Send restore to websocket
      ws.send(JSON.stringify({ type: "restore", save: data.save }));
      log("[system] Cloud save loaded");
    }
  } catch (e) { /* ignore */ }
}

async function saveCloudProgress(saveData) {
  if (!authToken) return;
  try {
    await fetch(`/api/save?token=${authToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ save: saveData })
    });
  } catch (e) { /* ignore */ }
}

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    updateAuthUI();
    authModal.classList.remove("hidden");
  });
}

if (authModalClose) {
  authModalClose.addEventListener("click", () => authModal.classList.add("hidden"));
}

if (authModal) {
  authModal.addEventListener("click", (e) => { if (e.target === authModal) authModal.classList.add("hidden"); });
}

if (authLoginSubmit) {
  authLoginSubmit.addEventListener("click", () => doAuth("login"));
}

if (authRegisterSubmit) {
  authRegisterSubmit.addEventListener("click", () => doAuth("register"));
}

if (authLogoutBtn) {
  authLogoutBtn.addEventListener("click", async () => {
    if (authToken) {
      try { await fetch("/api/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: authToken }) }); } catch(e) {}
    }
    authToken = null;
    currentUsername = null;
    isPremium = false;
    localStorage.removeItem("codeharv_token");
    localStorage.removeItem("codeharv_username");
    updateAuthUI();
    authModal.classList.add("hidden");
    showToastNotification("👤 " + t("logout"), "", "toast-mission");
  });
}

// Allow Enter key in auth form
if (authPassword) {
  authPassword.addEventListener("keydown", (e) => {
    if (e.key === "Enter") authLoginSubmit.click();
  });
}

// Init auth UI
updateAuthUI();
checkPremiumStatus();

/* ============================================================
   All Missions Modal
============================================================ */

const missionsModal = document.getElementById("missionsModal");
const missionsModalClose = document.getElementById("missionsModalClose");
const missionsListAll = document.getElementById("missionsListAll");
const allMissionsBtn = document.getElementById("allMissionsBtn");

function renderAllMissions() {
  if (!missionsListAll || !currentMissions.length) return;
  missionsListAll.innerHTML = "";
  const playerLevel = (currentFarm && currentFarm.level) || 1;
  currentMissions.forEach((m, idx) => {
    const mId = m.id || "";
    const mTitle = tm(mId, "title") || m.title;
    const mDesc = tm(mId, "desc") || m.desc;
    const mConcept = tm(mId, "concept") || m.concept;
    const reqLevel = m.required_level || 1;
    const isFree = idx < FREE_MISSION_COUNT;
    const isPremiumLocked = !isFree && !isPremium;
    const isLevelLocked = playerLevel < reqLevel;
    const isLocked = isPremiumLocked || isLevelLocked;

    // Build tags
    let tags = "";
    if (isFree) {
      tags += `<span style="background:#22c55e;color:#fff;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:700;">${t("free_tag")}</span>`;
    } else {
      tags += `<span style="background:#f59e0b;color:#fff;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:700;">${t("premium_tag")}</span>`;
    }
    if (reqLevel > 1) {
      const lvlColor = isLevelLocked ? "#ef4444" : "#22c55e";
      tags += ` <span style="background:${lvlColor};color:#fff;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:700;">Lv.${reqLevel}</span>`;
    }

    const statusIcon = m.completed ? "✅" : (m.active && !isLocked ? "▶️" : (isLocked ? "🔒" : "⬜"));
    let descText = mDesc;
    if (isPremiumLocked) {
      descText = "🔒 " + t("premium_required");
    } else if (isLevelLocked) {
      descText = "🔒 " + t("requires_level") + " " + reqLevel;
    }

    const div = document.createElement("div");
    div.style.cssText = `padding:10px 14px;border-bottom:1px solid #e2e8f0;display:flex;align-items:flex-start;gap:10px;${isLocked ? "opacity:0.65;" : ""}`;
    div.innerHTML = `
      <span style="font-size:16px;flex-shrink:0;margin-top:2px;">${statusIcon}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          ${mTitle} ${tags}
        </div>
        <div style="font-size:12px;color:#64748b;margin-top:2px;">${descText}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:2px;">🧠 ${mConcept} | +${m.xp_reward} XP, +${m.gold_reward} gold</div>
      </div>
    `;
    missionsListAll.appendChild(div);
  });
  // If not premium, add upgrade button at bottom
  if (!isPremium) {
    const btn = document.createElement("div");
    btn.style.cssText = "padding:16px;text-align:center;";
    btn.innerHTML = `<button onclick="document.getElementById('missionsModal').classList.add('hidden');document.getElementById('premiumModal').classList.remove('hidden');"
      style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:14px;font-weight:700;cursor:pointer;">
      ${t("upgrade_to_premium")} - $9.90
    </button>`;
    missionsListAll.appendChild(btn);
  }
}

if (allMissionsBtn) {
  allMissionsBtn.addEventListener("click", () => {
    renderAllMissions();
    missionsModal.classList.remove("hidden");
  });
}
if (missionsModalClose) {
  missionsModalClose.addEventListener("click", () => missionsModal.classList.add("hidden"));
}
if (missionsModal) {
  missionsModal.addEventListener("click", (e) => { if (e.target === missionsModal) missionsModal.classList.add("hidden"); });
}

/* ============================================================
   Premium / Stripe Checkout
============================================================ */

const premiumModal = document.getElementById("premiumModal");
const premiumModalClose = document.getElementById("premiumModalClose");
const premiumBuyBtn = document.getElementById("premiumBuyBtn");
const premiumLoginNote = document.getElementById("premiumLoginNote");

if (premiumModalClose) {
  premiumModalClose.addEventListener("click", () => premiumModal.classList.add("hidden"));
}
if (premiumModal) {
  premiumModal.addEventListener("click", (e) => { if (e.target === premiumModal) premiumModal.classList.add("hidden"); });
}

if (premiumBuyBtn) {
  premiumBuyBtn.addEventListener("click", async () => {
    if (!authToken) {
      if (premiumLoginNote) premiumLoginNote.classList.remove("hidden");
      return;
    }
    if (premiumLoginNote) premiumLoginNote.classList.add("hidden");
    premiumBuyBtn.disabled = true;
    premiumBuyBtn.textContent = "...";
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: authToken, return_url: window.location.origin })
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        showToastNotification("⚠️", data.message || "Payment unavailable", "toast-pest");
        premiumBuyBtn.disabled = false;
        premiumBuyBtn.textContent = t("upgrade_btn");
      }
    } catch(e) {
      showToastNotification("⚠️", "Network error", "toast-pest");
      premiumBuyBtn.disabled = false;
      premiumBuyBtn.textContent = t("upgrade_btn");
    }
  });
}

// Check for payment result in URL
(function checkPaymentResult() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("payment") === "success") {
    showToastNotification("🎉", t("payment_success"), "toast-mission");
    isPremium = true;
    // Clean URL
    window.history.replaceState({}, "", window.location.pathname);
    // Refresh premium status
    checkPremiumStatus();
  } else if (params.get("payment") === "cancelled") {
    showToastNotification("ℹ️", t("payment_cancelled"), "toast-pest");
    window.history.replaceState({}, "", window.location.pathname);
  }
})();
/* ============================================================
   Sound Effects (Web Audio API)
============================================================ */

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playTone(freq, duration, type = "sine", volume = 0.1) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) { /* audio not available */ }
}

function sfxPlant() { playTone(523, 0.15, "sine", 0.08); }
function sfxHarvest() { playTone(784, 0.1, "sine", 0.08); setTimeout(() => playTone(1047, 0.15, "sine", 0.08), 100); }
function sfxLevelUp() { playTone(523, 0.12, "sine", 0.08); setTimeout(() => playTone(659, 0.12, "sine", 0.08), 120); setTimeout(() => playTone(784, 0.2, "sine", 0.08), 240); }
function sfxMission() { playTone(659, 0.15, "triangle", 0.08); setTimeout(() => playTone(880, 0.2, "triangle", 0.08), 150); }
function sfxError() { playTone(200, 0.3, "sawtooth", 0.05); }
function sfxPest() { playTone(150, 0.2, "sawtooth", 0.06); }

/* ============================================================
   Bootstrap
============================================================ */

async function bootstrap() {
  try {
    const res = await fetch("/api/bootstrap");
    const data = await res.json();

    GRID = data.config.grid;
    FIELD_RATIO = data.config.field_ratio;
    bgImg.src = data.config.background;
    EXEC_INTERVAL = data.config.exec_interval;

    currentFarm = data.farm;

    updateLevelDisplay(data.farm);
    updateMissionPanel(data.farm.missions);
    updateAchievementsList(data.farm.achievements);

    updatePestDisplay(data.farm);
  } catch(e) {
    // Fallback when backend is unavailable
    bgImg.src = "assets/farm_bg.webp";
  }

  resizeCanvas();
}

bootstrap();

/* ============================================================
   Harvest Particle Effects
============================================================ */

function addHarvestParticles(x, y) {
  const p = gridToScreen(x, y);
  const sparkles = ["✨", "⭐", "💫"];
  for (let i = 0; i < 3; i++) {
    floatingTexts.push({
      x: p.x + (Math.random() - 0.5) * 40,
      y: p.y - 10 - Math.random() * 20,
      text: sparkles[i % sparkles.length],
      life: 1.2,
      vy: -30 - Math.random() * 20,
      color: "gold"
    });
  }
}

/* ============================================================
   WebSocket
============================================================ */

const protocol = location.protocol === "https:" ? "wss" : "ws";
let ws;
let wsReconnectTimer = null;

function connectWebSocket() {
  ws = new WebSocket(`${protocol}://${location.host}/ws/run`);

  ws.onopen = () => {
    log(t("connected"));
    // Try to restore saved game state
    const saved = localStorage.getItem("codeharv_save");
    if (saved) {
      try {
        ws.send(JSON.stringify({ type: "restore", save: JSON.parse(saved) }));
      } catch(e) { /* ignore corrupt save */ }
    }
  };

  ws.onclose = () => {
    log("[system] Connection lost. Reconnecting...", "#f59e0b");
    executionActive = false;
    autoPaused = false;
    executionMode = null;
    clearHighlight();
    setButtonsIdle();
    if (!wsReconnectTimer) {
      wsReconnectTimer = setTimeout(() => {
        wsReconnectTimer = null;
        connectWebSocket();
      }, 2000);
    }
  };

  ws.onerror = () => {
    // onclose will fire after this, handling reconnection
  };

  ws.onmessage = wsOnMessage;
}

let executionActive = false;
let executionMode = null;
let autoPaused = false;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function showScriptResult(r) {
  const roiPct = Math.round(r.roi * 100);
  let text = `\n${t("script_result")}\n💸 ${t("cost")}: ${r.cost}\n💰 ${t("gain")}: ${r.gain}\n📈 ${t("roi")}: ${roiPct}%`;
  if (r.new_record) {
    text += `\n${t("new_record")}`;
  } else {
    text += `\n⭐ ${t("best_roi")}: ${Math.round(r.best_roi * 100)}%`;
  }
  log(text);
}

// WebSocket connection initialized below after all handlers are defined

async function wsOnMessage(e) {
  const msg = JSON.parse(e.data);

  if (msg.type === "event") {
    highlightLine(msg.event.line);

    const goldDelta = msg.event.gold - currentFarm.gold;
    if (goldDelta !== 0) {
      const p = gridToScreen(msg.event.x, msg.event.y);
      const sign = (goldDelta > 0) ? '+' : '';
      floatingTexts.push({
        x: p.x, y: p.y - 20,
        text: `${sign}${goldDelta} 💰`,
        life: 1.0, vy: -40,
        color: goldDelta > 0 ? "#22c55e" : "gold"
      });
      if (goldDelta > 0) {
        addHarvestParticles(msg.event.x, msg.event.y);
      }
    }

    if (executionMode === "auto_step" && !autoPaused) {
      await sleep(EXEC_INTERVAL);
      ws.send(JSON.stringify({ type: "ack" }));
    }
  }

  if (msg.type === "farm_state") {
    currentFarm = msg.farm;
    drawScene(currentFarm);

    if (msg.farm.missions) updateMissionPanel(msg.farm.missions);
    if (msg.farm.achievements) updateAchievementsList(msg.farm.achievements);
    updateLevelDisplay(msg.farm);
    updatePestDisplay(msg.farm);

    // Save game progress
    if (msg.farm && msg.farm.save) {
      localStorage.setItem("codeharv_save", JSON.stringify(msg.farm.save));
    }

    // Track market prices
    if (msg.farm && msg.farm.market_prices) {
      currentMarketPrices = msg.farm.market_prices;
    }
  }

  if (msg.type === "done") {
    executionActive = false;
    autoPaused = false;
    executionMode = null;

    clearHighlight();
    setButtonsIdle();

    // Show print log
    if (msg.print_log && msg.print_log.length > 0) {
      for (const line of msg.print_log) {
        log(`>>> ${line}`, "#a5f3fc");
      }
    }

    if (msg.result) {
      showScriptResult(msg.result);
    }

    // Show mission completions
    if (msg.missions_completed && msg.missions_completed.length > 0) {
      for (const m of msg.missions_completed) {
        log(`\n🎯 Mission Complete: "${m.title}"!`, "#4ade80");
        log(`   +${m.xp_reward} XP, +${m.gold_reward} gold`, "#86efac");
        showToastNotification(
          `🎯 Mission Complete: ${m.title}`,
          `+${m.xp_reward} XP, +${m.gold_reward} gold | Concept: ${m.concept}`,
          "toast-mission"
        );
      }
      sfxMission();
    }

    // Show achievements
    if (msg.achievements_unlocked && msg.achievements_unlocked.length > 0) {
      for (const a of msg.achievements_unlocked) {
        log(`\n🏆 Achievement: "${a.title}" - ${a.desc}`, "#fbbf24");
        showToastNotification(
          `${a.emoji} Achievement: ${a.title}`,
          a.desc,
          "toast-achieve"
        );
      }
    }

    // Show level ups
    if (msg.level_ups && msg.level_ups.length > 0) {
      for (const lu of msg.level_ups) {
        log(`\n⭐ Level Up! Lv.${lu.new_level} - ${lu.title}`, "#c084fc");
        showToastNotification(
          `⭐ Level Up! Lv.${lu.new_level}`,
          lu.title,
          "toast-levelup"
        );
      }
      sfxLevelUp();
    }

    // Update level display from done message
    if (msg.level !== undefined) {
      updateLevelDisplay({
        level: msg.level,
        level_title: msg.level_title,
        xp: msg.xp,
        levels: currentFarm.levels
      });
    }

    // Update farm state from done message (includes post-mission-check state)
    if (msg.farm) {
      currentFarm = msg.farm;
      drawScene(currentFarm);
      if (msg.farm.missions) updateMissionPanel(msg.farm.missions);
      if (msg.farm.achievements) updateAchievementsList(msg.farm.achievements);
      updateLevelDisplay(msg.farm);
      updatePestDisplay(msg.farm);

      // Save game progress
      if (msg.farm.save) {
        localStorage.setItem("codeharv_save", JSON.stringify(msg.farm.save));
        saveCloudProgress(msg.farm.save);
      }
    }

    log(t("done"));
  }

  if (msg.type === "error") {
    log("[error] " + msg.message, "#ef4444");
    sfxError();
    // Highlight the error line in red if available
    if (msg.line) {
      highlightLine(msg.line, true);
    } else {
      clearHighlight();
    }
    executionActive = false;
    autoPaused = false;
    executionMode = null;
    setButtonsIdle();
  }
}

// Initialize WebSocket connection
connectWebSocket();

/* ============================================================
   Buttons
============================================================ */

const runAllBtn = document.getElementById("runAllBtn");
const stepBtn = document.getElementById("stepBtn");
const stopBtn = document.getElementById("stopBtn");

function setButtonsRunning() {
  runAllBtn.disabled = false;
  stopBtn.disabled = false;
}

function setButtonsIdle() {
  runAllBtn.disabled = false;
  stopBtn.disabled = true;
  runAllBtn.textContent = t("run");
}

function startExecution(mode) {
  executionActive = true;
  executionMode = mode;
  autoPaused = false;
  consoleEl.innerHTML = '';
  clearHighlight();
  setButtonsRunning();
}

runAllBtn.onclick = () => {
  if (!executionActive) {
    startExecution("auto_step");
    runAllBtn.textContent = t("pause");
    ws.send(JSON.stringify({
      type: "start",
      mode: "auto_step",
      code: editor.getValue()
    }));
    return;
  }
  if (executionActive && !autoPaused) {
    autoPaused = true;
    runAllBtn.textContent = t("resume");
    log(t("paused"));
    return;
  }
  if (executionActive && autoPaused) {
    autoPaused = false;
    runAllBtn.textContent = t("pause");
    log(t("resumed"));
    ws.send(JSON.stringify({ type: "ack" }));
  }
};

stepBtn.onclick = () => {
  if (!executionActive) {
    startExecution("manual_step");
    ws.send(JSON.stringify({
      type: "start",
      mode: "manual_step",
      code: editor.getValue()
    }));
  } else {
    ws.send(JSON.stringify({ type: "step" }));
  }
};

stopBtn.onclick = () => {
  if (!executionActive) return;
  ws.send(JSON.stringify({ type: "abort" }));
  executionActive = false;
  autoPaused = false;
  executionMode = null;
  clearHighlight();
  setButtonsIdle();
  log(t("aborted"));
};

/* ============================================================
   Draggable Divider
============================================================ */

const divider = document.getElementById("divider");
const leftPanel = document.getElementById("leftPanel");
let dragging = false;

divider.addEventListener("mousedown", () => {
  dragging = true;
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
});

window.addEventListener("mouseup", () => {
  dragging = false;
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
});

window.addEventListener("mousemove", e => {
  if (!dragging) return;
  const minLeft = 280;
  const maxLeft = window.innerWidth - 300;
  let newLeftWidth = Math.max(minLeft, Math.min(maxLeft, e.clientX));
  leftPanel.style.width = newLeftWidth + "px";
  editor.layout();
  resizeCanvas();
});

/* ============================================================
   Farm Tooltip
============================================================ */

const tooltip = document.getElementById("cellTooltip");

function cross(ax, ay, bx, by) {
  return ax * by - ay * bx;
}

function pointInQuad(p, quad) {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = quad[i];
    const b = quad[(i + 1) % 4];
    const c = cross(b.x - a.x, b.y - a.y, p.x - a.x, p.y - a.y);
    if (c === 0) continue;
    if (sign === 0) sign = Math.sign(c);
    else if (Math.sign(c) !== sign) return false;
  }
  return true;
}

canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  hoveredCell = null;

  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const quad = getCellCorners(x, y);
      if (pointInQuad({ x: mx, y: my }, quad)) {
        hoveredCell = { x, y };
        drawScene(currentFarm);
        showCellTooltip({ x: mx, y: my }, x, y);
        return;
      }
    }
  }
  hideCellTooltip();
  drawScene(currentFarm);
});

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function showCellTooltip(p, x, y) {
  const cell = currentFarm.grid[y][x];
  // Check for pest at this cell
  let pestHtml = "";
  if (currentFarm.pests) {
    const pest = currentFarm.pests.find(pe => pe.x === x && pe.y === y);
    if (pest) {
      const pestEmoji = pest.type === "bug" ? "🐛" : pest.type === "weed" ? "🌵" : "❄️";
      const pestName = t("pest_" + pest.type) || capitalize(pest.type);
      pestHtml = `<br><span style="color:#ef4444;">${pestEmoji} ${t("pest")}: ${pestName}</span>`;
    }
  }
  let html = "";
  if (!cell || !cell.type) {
    html = `
      <b>${t("empty_plot")}</b><br>
      📍 ${t("position")}: (${x}, ${y})<br>
      💧 ${t("water")}: ${Math.round((cell?.water ?? 0) * 100)}%<br>
      🌱 ${t("nutrition")}: ${Math.round((cell?.nutrient ?? 0) * 100)}%${pestHtml}
    `;
  } else {
    const waterPct = Math.round((cell.water ?? 0) * 100);
    const nutritionPct = Math.round((cell.nutrient ?? 0) * 100);
    let maturityDisplay = "";
    if ((cell.maturity ?? 0) >= 1) {
      maturityDisplay = ` <span class="tick">✔</span>`;
    } else {
      maturityDisplay = ` (${Math.round((cell.maturity ?? 0) * 100)}%)`;
    }
    html = `
      <b>${capitalize(cell.type)}${maturityDisplay}</b><br>
      📍 ${t("position")}: (${x}, ${y})<br>
      💧 ${t("water")}: ${waterPct}%<br>
      🌱 ${t("nutrition")}: ${nutritionPct}%${pestHtml}
    `;
  }
  tooltip.innerHTML = html;
  tooltip.style.left = `${p.x}px`;
  tooltip.style.top = `${p.y - 12}px`;
  tooltip.classList.remove("hidden");
}

function hideCellTooltip() {
  tooltip.classList.add("hidden");
}

canvas.addEventListener("mouseleave", () => {
  hoveredCell = null;
  hideCellTooltip();
  drawScene(currentFarm);
});

/* ============================================================
   Settings Panel
============================================================ */

const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const aboutBtn = document.getElementById("aboutBtn");
const aboutPanel = document.getElementById("aboutPanel");

settingsBtn.onclick = (e) => {
  e.stopPropagation();
  settingsPanel.classList.toggle("hidden");
};

aboutBtn.onclick = (e) => {
  e.stopPropagation();
  aboutPanel.classList.toggle("hidden");
};

document.addEventListener("click", () => {
  settingsPanel.classList.add("hidden");
  aboutPanel.classList.add("hidden");
});

// Prevent clicks inside settings panel from closing it
settingsPanel.addEventListener("click", (e) => {
  e.stopPropagation();
});

/* ============================================================
   Global Keyboard Shortcuts
============================================================ */

// Escape closes modals
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cropModal.classList.add("hidden");
    achieveModal.classList.add("hidden");
    if (marketModal) marketModal.classList.add("hidden");
    if (authModal) authModal.classList.add("hidden");
    if (missionsModal) missionsModal.classList.add("hidden");
    if (shareModal) shareModal.classList.add("hidden");
    if (premiumModal) premiumModal.classList.add("hidden");
    if (settingsPanel) settingsPanel.classList.add("hidden");
    if (aboutPanel) aboutPanel.classList.add("hidden");
    hideGridMenus();
    const wo = document.getElementById("welcomeOverlay");
    if (wo) {
      wo.classList.add("hidden");
      localStorage.setItem("codeharv_welcomed", "1");
    }
  }
});

// Ctrl+Enter to run script
try {
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
    runAllBtn.click();
  });
} catch (e) {
  // fallback: listen globally
  document.addEventListener("keydown", (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") {
      runAllBtn.click();
    }
  });
}

/* ============================================================
   Refetch farm state after done to sync missions
============================================================ */

async function refetchFarmState() {
  try {
    const res = await fetch("/api/bootstrap");
    const data = await res.json();
    currentFarm = data.farm;
    updateLevelDisplay(data.farm);
    updateMissionPanel(data.farm.missions);
    updateAchievementsList(data.farm.achievements);
    drawScene(currentFarm);
  } catch (err) {
    // silent - non-critical
  }
}

/* ============================================================
   Welcome Overlay
============================================================ */

const welcomeOverlay = document.getElementById("welcomeOverlay");
const welcomeStartBtn = document.getElementById("welcomeStartBtn");

// Show welcome only on first visit
if (localStorage.getItem("codeharv_welcomed")) {
  welcomeOverlay.classList.add("hidden");
}

welcomeStartBtn.addEventListener("click", () => {
  welcomeOverlay.classList.add("hidden");
  localStorage.setItem("codeharv_welcomed", "1");
});

/* ============================================================
   Dark Mode Toggle
============================================================ */

const darkModeBtn = document.getElementById("darkModeBtn");
let isDarkMode = localStorage.getItem("codeharv_dark") === "1";

function applyDarkMode() {
  document.body.classList.toggle("dark-mode", isDarkMode);
  darkModeBtn.textContent = isDarkMode ? "☀️ " + t("light_theme") : "🌙 " + t("dark_theme");
  // Switch Monaco editor theme
  monaco.editor.setTheme(isDarkMode ? "vs-dark" : "vs");
  localStorage.setItem("codeharv_dark", isDarkMode ? "1" : "0");
}

darkModeBtn.onclick = () => {
  isDarkMode = !isDarkMode;
  applyDarkMode();
};

// Apply on load
applyDarkMode();

/* ============================================================
   Language Switcher
============================================================ */

const langSelect = document.getElementById("langSelect");
langSelect.value = currentLang;
langSelect.addEventListener("change", () => {
  currentLang = langSelect.value;
  localStorage.setItem("codeharv_lang", currentLang);
  applyLanguage();
});

function applyLanguage() {
  // Update static text elements
  document.querySelector("#leftPanel .panel-title span").textContent = t("python_script");
  document.querySelector("#rightPanel .panel-title span").textContent = t("farm_view");
  document.querySelector(".mission-header span").textContent = t("current_mission");
  runAllBtn.textContent = executionActive ? (autoPaused ? t("resume") : t("pause")) : t("run");
  stepBtn.textContent = t("step");
  stopBtn.textContent = t("stop");
  cropBookBtn.textContent = t("crops_btn");
  achieveBtn.textContent = t("awards_btn");
  document.getElementById("loadHintBtn").textContent = t("load_hint");
  hintBtn.textContent = missionHint.classList.contains("hidden") ? t("show_hint") : t("hide_hint");
  const marketBtnEl = document.getElementById("marketBtn");
  if (marketBtnEl) marketBtnEl.textContent = t("market_btn");

  // Modal headers
  const cropEncTitle = document.querySelector("#cropModal .modal-header h2");
  if (cropEncTitle) cropEncTitle.textContent = t("crop_encyclopedia");
  const achieveTitle = document.querySelector("#achieveModal .modal-header h2");
  if (achieveTitle) achieveTitle.textContent = t("achievements_title");
  const marketTitle = document.querySelector("#marketModal .modal-header h2");
  if (marketTitle) marketTitle.textContent = t("market_prices");
  const funcTitle = document.querySelector("#cropModal .modal-footer h3");
  if (funcTitle) funcTitle.textContent = t("available_functions");
  const missionsTitle = document.getElementById("missionsModalTitle");
  if (missionsTitle) missionsTitle.textContent = "📋 " + t("all_missions");
  const premiumTitle = document.getElementById("premiumModalTitle");
  if (premiumTitle) premiumTitle.textContent = "⭐ " + t("upgrade_to_premium");
  const shareBtnEl = document.getElementById("shareBtn");
  if (shareBtnEl) shareBtnEl.textContent = t("share");
  const shareTitle = document.getElementById("shareModalTitle");
  if (shareTitle) shareTitle.textContent = t("share_title");

  // About button
  const aboutBtn = document.getElementById("aboutBtn");
  if (aboutBtn) aboutBtn.textContent = "ℹ️ " + t("about");

  // Dark mode button text
  const darkModeBtnEl = document.getElementById("darkModeBtn");
  if (darkModeBtnEl) darkModeBtnEl.textContent = isDarkMode ? "☀️ " + t("light_theme") : "🌙 " + t("dark_theme");

  // Auth modal
  const authTitle = document.getElementById("authModalTitle");
  if (authTitle) authTitle.textContent = t("login");
  const loginSubmit = document.getElementById("authLoginSubmit");
  if (loginSubmit) loginSubmit.textContent = t("login").replace("👤 ", "");
  const registerSubmit = document.getElementById("authRegisterSubmit");
  if (registerSubmit) registerSubmit.textContent = t("register");

  // Premium modal
  const premiumDesc = document.getElementById("premiumDesc");
  if (premiumDesc) premiumDesc.textContent = t("upgrade_desc");
  if (premiumBuyBtn && !premiumBuyBtn.disabled) premiumBuyBtn.textContent = "💳 " + t("upgrade_btn");
  const premNote = document.getElementById("premiumLoginNote");
  if (premNote) premNote.textContent = t("login_required_for_premium");

  // Grid-to-Code menu labels
  const gcMenu = document.getElementById("gridCodeMenu");
  if (gcMenu) {
    gcMenu.querySelectorAll(".grid-code-item").forEach(item => {
      const action = item.dataset.action;
      const label = item.querySelector(".gc-label");
      if (label && action) label.textContent = t("gc_" + action);
    });
  }

  // Market info
  const marketInfo = document.querySelector("#marketModal .market-info p");
  if (marketInfo) marketInfo.innerHTML = `<span style="font-size:13px;color:#64748b;">${t("market_info")}</span>`;

  // Function reference translations
  const funcRef = document.querySelector("#cropModal .func-ref");
  if (funcRef) {
    funcRef.innerHTML = `
      <code>plant("crop", x, y)</code> - ${t("func_plant")}<br>
      <code>water(x, y)</code> - ${t("func_water")}<br>
      <code>fertilize(x, y)</code> - ${t("func_fertilize")}<br>
      <code>harvest(x, y)</code> - ${t("func_harvest")}<br>
      <code>wait(seconds)</code> - ${t("func_wait")}<br>
      <code>is_mature(x, y)</code> - ${t("func_is_mature")}<br>
      <code>get_weather()</code> - ${t("func_get_weather")}<br>
      <code>get_status(x, y)</code> - ${t("func_get_status")}<br>
      <code>clear()</code> - ${t("func_clear")}<br>
      <code>print(value)</code> - ${t("func_print")}<br>
      <code>sell(x, y)</code> - ${t("func_sell")}<br>
      <code>get_price("crop")</code> - ${t("func_get_price")}<br>
      <code>get_market()</code> - ${t("func_get_market")}<br>
      <code>get_gold()</code> - ${t("func_get_gold")}<br>
      <code>get_time()</code> - ${t("func_get_time")}<br>
      <code>get_all_mature()</code> - ${t("func_get_all_mature")}<br>
      <code>get_all_planted()</code> - ${t("func_get_all_planted")}<br>
      <code>count_crops()</code> - ${t("func_count_crops")}<br>
      <code>has_pest(x, y)</code> - ${t("func_has_pest")}<br>
      <code>remove_pest(x, y)</code> - ${t("func_remove_pest")}<br>
      <code>get_pests()</code> - ${t("func_get_pests")}<br>
    `;
  }

  // Login button
  if (!authToken) {
    if (loginBtn) loginBtn.textContent = t("login");
  }

  // Re-render the crop list
  buildCropList();
  // Re-render mission panel
  if (currentMissions.length) updateMissionPanel(currentMissions);
  // Re-render achievements
  if (currentAchievements.length) renderAchievements();
  // Re-render weather and level
  updateWeatherDisplay(currentFarm);
  updateLevelDisplay(currentFarm);
}

/* ============================================================
   Social Sharing
============================================================ */

const shareModal = document.getElementById("shareModal");
const shareModalClose = document.getElementById("shareModalClose");
const shareBtn = document.getElementById("shareBtn");
const shareCanvas = document.getElementById("shareCanvas");

function generateShareImage() {
  const sc = shareCanvas;
  const w = 600, h = 400;
  sc.width = w;
  sc.height = h;
  const ctx = sc.getContext("2d");

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#0f172a");
  grad.addColorStop(1, "#1e3a5f");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Copy farm canvas into share image
  const farmCvs = document.getElementById("farmCanvas");
  if (farmCvs) {
    const farmAspect = farmCvs.width / farmCvs.height;
    const drawW = 340;
    const drawH = drawW / farmAspect;
    const farmX = (w - drawW) / 2;
    const farmY = 80;
    // Rounded rect clip
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(farmX - 4, farmY - 4, drawW + 8, drawH + 8, 12);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fill();
    ctx.restore();
    try {
      ctx.drawImage(farmCvs, farmX, farmY, drawW, drawH);
    } catch(e) {}
  }

  // Title
  ctx.fillStyle = "#22c55e";
  ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🌱 Code Harv", w / 2, 45);

  // Stats bar at bottom
  const farm = currentFarm || {};
  const gold = farm.gold ?? 0;
  const level = farm.level ?? 1;
  const completedMissions = currentMissions ? currentMissions.filter(m => m.completed).length : 0;
  const totalMissions = currentMissions ? currentMissions.length : 25;

  const statsY = h - 60;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(0, statsY - 10, w, 80);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`💰 ${gold} Gold  |  ⭐ Level ${level}  |  📋 ${completedMissions}/${totalMissions} Missions`, w / 2, statsY + 15);

  // Username if logged in
  if (currentUsername) {
    ctx.fillStyle = "#64748b";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(`👤 ${currentUsername}`, w / 2, statsY + 40);
  }

  // Watermark
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("codeharv.com", w - 16, h - 10);
}

function getShareText() {
  const farm = currentFarm || {};
  const gold = farm.gold ?? 0;
  const level = farm.level ?? 1;
  const completedMissions = currentMissions ? currentMissions.filter(m => m.completed).length : 0;
  return `🌱 I'm farming with Python on Code Harv! Level ${level}, ${gold} gold, ${completedMissions} missions completed. Learn Python by growing a virtual farm!`;
}

function getShareUrl() {
  return "https://codeharv.com";
}

if (shareBtn) {
  shareBtn.addEventListener("click", () => {
    generateShareImage();
    shareModal.classList.remove("hidden");
  });
}

if (shareModalClose) {
  shareModalClose.addEventListener("click", () => shareModal.classList.add("hidden"));
}
if (shareModal) {
  shareModal.addEventListener("click", (e) => { if (e.target === shareModal) shareModal.classList.add("hidden"); });
}

// Twitter/X
document.getElementById("shareTwitter")?.addEventListener("click", () => {
  const text = encodeURIComponent(getShareText());
  const url = encodeURIComponent(getShareUrl());
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank", "width=600,height=400");
});

// Facebook
document.getElementById("shareFacebook")?.addEventListener("click", () => {
  const url = encodeURIComponent(getShareUrl());
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=400");
});

// WeChat - show QR code hint (WeChat can't directly share from web)
document.getElementById("shareWeChat")?.addEventListener("click", () => {
  // Download the image so user can share it in WeChat
  const link = document.createElement("a");
  link.download = "codeharv-share.png";
  link.href = shareCanvas.toDataURL("image/png");
  link.click();
  showToastNotification("💬 WeChat", t("share_wechat_hint") || "Image saved! Share it in WeChat.", "toast-mission");
});

// WhatsApp
document.getElementById("shareWhatsApp")?.addEventListener("click", () => {
  const text = encodeURIComponent(getShareText() + " " + getShareUrl());
  window.open(`https://wa.me/?text=${text}`, "_blank");
});

// Download image
document.getElementById("shareDownload")?.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "codeharv-share.png";
  link.href = shareCanvas.toDataURL("image/png");
  link.click();
});

/* ============================================================
   Grid-to-Code
============================================================ */

let mouseMode = true;
const gridCodeMenu = document.getElementById("gridCodeMenu");
const gridCropPicker = document.getElementById("gridCropPicker");
let gridCodeTarget = null;        // { x, y } of clicked cell
let selectionStart = null;        // { x, y } for drag-select
let selectionEnd = null;          // { x, y } for drag-select
let isSelecting = false;

canvas.classList.add("mouse-mode-cursor");

function hideGridMenus() {
  gridCodeMenu.classList.add("hidden");
  gridCropPicker.classList.add("hidden");
}

// Close menus on outside click
document.addEventListener("mousedown", (e) => {
  if (!gridCodeMenu.contains(e.target) && !gridCropPicker.contains(e.target)) {
    hideGridMenus();
  }
});

// Get grid cell from mouse position on canvas
function canvasMouseToCell(e) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const quad = getCellCorners(x, y);
      if (pointInQuad({ x: mx, y: my }, quad)) {
        return { x, y };
      }
    }
  }
  return null;
}

// Position menu near a canvas cell, but keep it within viewport
function positionMenuNearCell(menu, cell) {
  const corners = getCellCorners(cell.x, cell.y);
  const cx = (corners[0].x + corners[1].x + corners[2].x + corners[3].x) / 4;
  const cy = (corners[0].y + corners[1].y + corners[2].y + corners[3].y) / 4;

  const canvasRect = canvas.getBoundingClientRect();
  let left = canvasRect.left + cx + 10;
  let top = canvasRect.top + cy - 20;

  // Ensure the menu stays within the viewport
  menu.classList.remove("hidden");
  const menuRect = menu.getBoundingClientRect();
  if (left + menuRect.width > window.innerWidth - 8) {
    left = canvasRect.left + cx - menuRect.width - 10;
  }
  if (top + menuRect.height > window.innerHeight - 8) {
    top = window.innerHeight - menuRect.height - 8;
  }
  if (top < 8) top = 8;

  menu.style.position = "fixed";
  menu.style.left = left + "px";
  menu.style.top = top + "px";
}

// Append code at end of editor
function appendToEditor(code) {
  const model = editor.getModel();
  const lastLine = model.getLineCount();
  const lastCol = model.getLineMaxColumn(lastLine);
  const lastLineContent = model.getLineContent(lastLine);
  const prefix = lastLineContent.trim() === "" ? "" : "\n";
  editor.executeEdits("grid-to-code", [{
    range: new monaco.Range(lastLine, lastCol, lastLine, lastCol),
    text: prefix + code + "\n"
  }]);
  // Scroll to bottom and focus
  const newLastLine = model.getLineCount();
  editor.revealLine(newLastLine);
  editor.setPosition({ lineNumber: newLastLine, column: 1 });
  editor.focus();
}

// Generate code for single cell action
function codeForAction(action, x, y, crop) {
  switch (action) {
    case "plant":     return `plant("${crop}", ${x}, ${y})`;
    case "water":     return `water(${x}, ${y})`;
    case "fertilize": return `fertilize(${x}, ${y})`;
    case "harvest":   return `harvest(${x}, ${y})`;
    case "sell":      return `sell(${x}, ${y})`;
    case "remove_pest": return `remove_pest(${x}, ${y})`;
    case "status":    return `print(get_status(${x}, ${y}))`;
    case "is_mature": return `print(is_mature(${x}, ${y}))`;
    default:          return "";
  }
}

// Generate loop code for a rectangular selection
function codeForSelection(action, x0, y0, x1, y1, crop) {
  const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;

  // Single cell — no loop needed
  if (w === 1 && h === 1) return codeForAction(action, minX, minY, crop);

  // Build the inner statement with variable names
  function innerCode(xVar, yVar) {
    switch (action) {
      case "plant":       return `plant("${crop}", ${xVar}, ${yVar})`;
      case "water":       return `water(${xVar}, ${yVar})`;
      case "fertilize":   return `fertilize(${xVar}, ${yVar})`;
      case "harvest":     return `harvest(${xVar}, ${yVar})`;
      case "sell":        return `sell(${xVar}, ${yVar})`;
      case "remove_pest": return `remove_pest(${xVar}, ${yVar})`;
      case "status":      return `print(get_status(${xVar}, ${yVar}))`;
      case "is_mature":   return `print(is_mature(${xVar}, ${yVar}))`;
      default:            return "";
    }
  }

  const xRange = w === GRID && minX === 0 ? `range(${GRID})` : `range(${minX}, ${maxX + 1})`;
  const yRange = h === GRID && minY === 0 ? `range(${GRID})` : `range(${minY}, ${maxY + 1})`;

  // Single row
  if (h === 1) {
    return `for x in ${xRange}:\n    ${innerCode("x", minY)}`;
  }

  // Single column
  if (w === 1) {
    return `for y in ${yRange}:\n    ${innerCode(minX, "y")}`;
  }

  // Rectangle — nested loops
  return `for y in ${yRange}:\n    for x in ${xRange}:\n        ${innerCode("x", "y")}`;
}

// Draw selection highlight overlay
function drawSelectionOverlay() {
  if (!selectionStart || !selectionEnd) return;
  const minX = Math.min(selectionStart.x, selectionEnd.x);
  const maxX = Math.max(selectionStart.x, selectionEnd.x);
  const minY = Math.min(selectionStart.y, selectionEnd.y);
  const maxY = Math.max(selectionStart.y, selectionEnd.y);
  ctx.save();
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const corners = getCellCorners(x, y);
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y);
      ctx.closePath();
      ctx.fillStyle = "rgba(59, 130, 246, 0.25)";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(59, 130, 246, 0.7)";
      ctx.stroke();
    }
  }
  ctx.restore();
}

// Canvas mousedown — start selection or show menu
canvas.addEventListener("mousedown", (e) => {
  if (!mouseMode || e.button !== 0) return;
  const cell = canvasMouseToCell(e);
  if (!cell) return;
  hideGridMenus();
  selectionStart = cell;
  selectionEnd = cell;
  isSelecting = true;
});

// Canvas mousemove — update selection during drag
const origMouseMove = canvas.onmousemove;
canvas.addEventListener("mousemove", (e) => {
  if (!mouseMode || !isSelecting) return;
  const cell = canvasMouseToCell(e);
  if (cell && (cell.x !== selectionEnd?.x || cell.y !== selectionEnd?.y)) {
    selectionEnd = cell;
    drawScene(currentFarm);
    drawSelectionOverlay();
  }
});

// Canvas mouseup — finalize selection and show menu
canvas.addEventListener("mouseup", (e) => {
  if (!mouseMode || !isSelecting) return;
  isSelecting = false;
  const cell = canvasMouseToCell(e);
  if (cell) selectionEnd = cell;

  if (!selectionStart) return;

  gridCodeTarget = { ...selectionStart };
  const isSingle = selectionStart.x === selectionEnd.x && selectionStart.y === selectionEnd.y;

  // Update menu label
  const label = document.getElementById("gridCodeCellLabel");
  if (isSingle) {
    label.textContent = `(${selectionStart.x}, ${selectionStart.y})`;
  } else {
    const minX = Math.min(selectionStart.x, selectionEnd.x);
    const maxX = Math.max(selectionStart.x, selectionEnd.x);
    const minY = Math.min(selectionStart.y, selectionEnd.y);
    const maxY = Math.max(selectionStart.y, selectionEnd.y);
    const count = (maxX - minX + 1) * (maxY - minY + 1);
    label.textContent = `(${minX},${minY})→(${maxX},${maxY}) [${count} cells]`;
  }

  // Draw selection overlay
  drawScene(currentFarm);
  drawSelectionOverlay();

  positionMenuNearCell(gridCodeMenu, selectionEnd);
});

// Prevent canvas click from propagating when in mouse mode
canvas.addEventListener("click", (e) => {
  if (mouseMode) {
    e.stopPropagation();
  }
});

// Handle action button clicks
gridCodeMenu.addEventListener("click", (e) => {
  const item = e.target.closest(".grid-code-item");
  if (!item) return;
  const action = item.dataset.action;

  if (action === "plant") {
    // Show crop picker
    buildCropPicker();
    const menuRect = gridCodeMenu.getBoundingClientRect();
    gridCropPicker.style.position = "fixed";
    gridCropPicker.style.left = (menuRect.right + 4) + "px";
    gridCropPicker.style.top = menuRect.top + "px";
    gridCropPicker.classList.remove("hidden");
    // Reposition if overflows right
    const pickerRect = gridCropPicker.getBoundingClientRect();
    if (pickerRect.right > window.innerWidth - 8) {
      gridCropPicker.style.left = (menuRect.left - pickerRect.width - 4) + "px";
    }
    if (pickerRect.bottom > window.innerHeight - 8) {
      gridCropPicker.style.top = (window.innerHeight - pickerRect.height - 8) + "px";
    }
    return;
  }

  // Generate and insert code
  insertActionCode(action);
});

function insertActionCode(action, crop) {
  const isSingle = selectionStart.x === selectionEnd.x && selectionStart.y === selectionEnd.y;
  let code;
  if (isSingle) {
    code = codeForAction(action, selectionStart.x, selectionStart.y, crop);
  } else {
    code = codeForSelection(action, selectionStart.x, selectionStart.y, selectionEnd.x, selectionEnd.y, crop);
  }
  appendToEditor(code);
  hideGridMenus();
  selectionStart = null;
  selectionEnd = null;
  drawScene(currentFarm);
  log(`🖱 ${t("grid_code_inserted") || "Code inserted from farm click"}`, "#3b82f6");
}

// Build crop picker buttons
function buildCropPicker() {
  gridCropPicker.innerHTML = `<div class="grid-code-title">${t("gc_select_crop")}</div>`;
  const playerLevel = (currentFarm && currentFarm.level) || 1;
  for (const [name, info] of Object.entries(cropData)) {
    const isLocked = playerLevel < info.required_level;
    const btn = document.createElement("button");
    btn.className = "crop-pick-item" + (isLocked ? " crop-pick-locked" : "");
    if (isLocked) {
      btn.innerHTML = `<span style="filter:grayscale(0.8);opacity:0.5;">${info.emoji}</span> <span style="color:#94a3b8;">${name}</span> <span class="crop-pick-cost">🔒 Lv.${info.required_level}</span>`;
      btn.disabled = true;
      btn.style.cursor = "not-allowed";
      btn.style.opacity = "0.55";
    } else {
      btn.innerHTML = `<span>${info.emoji}</span> <span>${name}</span> <span class="crop-pick-cost">${info.cost}g</span>`;
      btn.addEventListener("click", () => {
        insertActionCode("plant", name);
      });
    }
    gridCropPicker.appendChild(btn);
  }
}

/* ============================================================
   Init
============================================================ */

bgImg.onload = () => drawScene(currentFarm);

// Apply language on load (translates HTML elements)
applyLanguage();
