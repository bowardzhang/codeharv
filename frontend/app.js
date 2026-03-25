import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

// Expose monaco for external access (e.g. browser console debugging)
window.__monaco = monaco;

/* ============================================================
   i18n
============================================================ */

const I18N = {
  en: {
    welcome_title: "Welcome to Cyber Farm!",
    welcome_desc: "Learn Python programming by growing a virtual farm.\nWrite Python scripts to plant, water, and harvest crops.\nComplete missions to level up and unlock achievements!",
    quick_start: "Quick Start:",
    quick_start_steps: "1. Read the current mission in the bottom-right panel\n2. Write Python code in the editor on the left\n3. Click ▶ Run or press Ctrl+Enter to execute\n4. Watch your farm come alive!",
    start_farming: "Start Farming!",
    python_script: "Python Script",
    farm_view: "Farm View",
    run: "▶ Run",
    step: "⏭ Step",
    stop: "⏹ Stop",
    pause: "⏸ Pause",
    resume: "▶ Resume",
    current_mission: "📋 Current Mission",
    show_hint: "💡 Show Hint",
    hide_hint: "💡 Hide Hint",
    load_hint: "📝 Load into Editor",
    crops_btn: "📖 Crops",
    awards_btn: "🏆 Awards",
    crop_encyclopedia: "📖 Crop Encyclopedia",
    achievements_title: "🏆 Achievements",
    available_functions: "🎮 Available Functions",
    all_missions_complete: "🎉 All missions completed! You are a Python master!",
    connected: "[system] Connected to Cyber Farm server",
    done: "[system] done",
    paused: "[system] paused",
    resumed: "[system] resumed",
    aborted: "[system] aborted",
    loaded_hint: "[system] Loaded hint code into editor",
    no_hint: "[system] No active mission hint to load",
    script_result: "📊 Script Result",
    cost: "Cost",
    gain: "Gain",
    roi: "ROI",
    best_roi: "Best ROI",
    new_record: "🏆 New Best ROI!",
    mission_complete: "🎯 Mission Complete",
    achievement: "Achievement",
    level_up: "⭐ Level Up!",
    reward: "Reward",
    speed: "Speed",
    profit: "Profit",
    fast: "Fast",
    medium: "Medium",
    slow: "Slow",
    very_slow: "Very Slow",
    empty_plot: "Empty Plot",
    position: "Position",
    water: "Water",
    nutrition: "Nutrition",
    concept: "Concept",
    season: "Season",
    market: "Market",
    market_btn: "💹 Market",
    market_prices: "💹 Market Prices",
    login: "👤 Login",
    logout: "Logout",
    register: "Register",
    pest_alert: "🐛 Pest Alert",
    pest_removed: "Pest removed!",
    season_changed: "Season changed!",
    sell: "Sell",
    base_price: "Base",
    current_price: "Current",
  },
  zh: {
    welcome_title: "欢迎来到赛博农场！",
    welcome_desc: "通过经营虚拟农场来学习Python编程。\n编写Python脚本来种植、浇水和收获作物。\n完成任务来升级并解锁成就！",
    quick_start: "快速入门：",
    quick_start_steps: "1. 阅读右下角的当前任务\n2. 在左侧编辑器中编写Python代码\n3. 点击 ▶ 运行 或按 Ctrl+Enter 执行\n4. 看你的农场活起来！",
    start_farming: "开始种田！",
    python_script: "Python 脚本",
    farm_view: "农场视图",
    run: "▶ 运行",
    step: "⏭ 单步",
    stop: "⏹ 停止",
    pause: "⏸ 暂停",
    resume: "▶ 继续",
    current_mission: "📋 当前任务",
    show_hint: "💡 显示提示",
    hide_hint: "💡 隐藏提示",
    load_hint: "📝 加载到编辑器",
    crops_btn: "📖 作物",
    awards_btn: "🏆 成就",
    crop_encyclopedia: "📖 作物百科",
    achievements_title: "🏆 成就",
    available_functions: "🎮 可用函数",
    all_missions_complete: "🎉 所有任务已完成！你是Python大师！",
    connected: "[系统] 已连接到赛博农场服务器",
    done: "[系统] 完成",
    paused: "[系统] 已暂停",
    resumed: "[系统] 已继续",
    aborted: "[系统] 已中止",
    loaded_hint: "[系统] 已将提示代码加载到编辑器",
    no_hint: "[系统] 没有可加载的任务提示",
    script_result: "📊 脚本结果",
    cost: "花费",
    gain: "收入",
    roi: "投资回报率",
    best_roi: "最佳ROI",
    new_record: "🏆 新纪录！",
    mission_complete: "🎯 任务完成",
    achievement: "成就",
    level_up: "⭐ 升级！",
    reward: "奖励",
    speed: "速度",
    profit: "利润",
    fast: "快",
    medium: "中等",
    slow: "慢",
    very_slow: "很慢",
    empty_plot: "空地",
    position: "位置",
    water: "水分",
    nutrition: "养分",
    concept: "概念",
    season: "季节",
    market: "市场",
    market_btn: "💹 市场",
    market_prices: "💹 市场价格",
    login: "👤 登录",
    logout: "退出",
    register: "注册",
    pest_alert: "🐛 害虫警告",
    pest_removed: "害虫已清除！",
    season_changed: "季节已变化！",
    sell: "出售",
    base_price: "基础价",
    current_price: "当前价",
  }
};

let currentLang = localStorage.getItem("cyberfarm_lang") || "en";

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
}

/* ============================================================
   Editor
============================================================ */

const DEFAULT_CODE = `# Welcome to Cyber Farm!
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

function highlightLine(line) {
  currentLineDecoration = editor.deltaDecorations(
    currentLineDecoration,
    [{
      range: new monaco.Range(line, 1, line, 1),
      options: { isWholeLine: true, className: 'current-line-highlight' }
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
      { label: 'get_season', kind: monaco.languages.CompletionItemKind.Function, insertText: 'get_season()', insertTextRules: 4, documentation: 'Get current season' },
      { label: 'get_gold', kind: monaco.languages.CompletionItemKind.Function, insertText: 'get_gold()', insertTextRules: 4, documentation: 'Get current gold amount' },
      { label: 'get_time', kind: monaco.languages.CompletionItemKind.Function, insertText: 'get_time()', insertTextRules: 4, documentation: 'Get current farm time' },
      { label: 'get_all_mature', kind: monaco.languages.CompletionItemKind.Function, insertText: 'get_all_mature()', insertTextRules: 4, documentation: 'Get list of all mature crop positions' },
      { label: 'get_all_planted', kind: monaco.languages.CompletionItemKind.Function, insertText: 'get_all_planted()', insertTextRules: 4, documentation: 'Get list of all planted crops' },
      { label: 'count_crops', kind: monaco.languages.CompletionItemKind.Function, insertText: 'count_crops()', insertTextRules: 4, documentation: 'Count planted crops' },
      { label: 'has_pest', kind: monaco.languages.CompletionItemKind.Function, insertText: 'has_pest(${1:x}, ${2:y})', insertTextRules: 4, documentation: 'Check if cell has a pest' },
      { label: 'remove_pest', kind: monaco.languages.CompletionItemKind.Function, insertText: 'remove_pest(${1:x}, ${2:y})', insertTextRules: 4, documentation: 'Remove pest at (x,y) - costs 5 gold' },
      { label: 'get_pests', kind: monaco.languages.CompletionItemKind.Function, insertText: 'get_pests()', insertTextRules: 4, documentation: 'Get list of all pests' },
      { label: 'get_status', kind: monaco.languages.CompletionItemKind.Function, insertText: 'get_status(${1:x}, ${2:y})', insertTextRules: 4, documentation: 'Get detailed status of cell (x,y)' },
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

function drawScene(farm = EMPTY_FARM) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  updateFieldFromCanvas();
  updateResource(farm.gold ?? 0, farm.time ?? 0);
  updateWeatherDisplay(farm);
  updateSeasonDisplay(farm);

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
        const pest = farm.pests.find(p => p.x === x && p.y === y);
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
  weatherDisplay.textContent = `${farm.weather_info.emoji} ${capitalize(farm.weather || 'sunny')}`;
}

const seasonDisplay = document.getElementById("seasonDisplay");

function updateSeasonDisplay(farm) {
  if (!farm || !farm.season_info) return;
  seasonDisplay.textContent = `${farm.season_info.emoji} ${capitalize(farm.season || 'spring')}`;
}

function updateLevelDisplay(farm) {
  if (!farm || farm.level === undefined) return;
  const level = farm.level;
  const title = farm.level_title || (farm.levels && farm.levels[level - 1] ? farm.levels[level - 1].title : "");
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

  const active = missions.find(m => m.active && !m.completed);

  if (!active) {
    if (completedCount >= missions.length) {
      document.getElementById("missionContent").innerHTML =
        `<div class="mission-complete-msg">${t("all_missions_complete")}</div>`;
    }
    return;
  }

  missionTitle.textContent = active.title;
  missionDesc.textContent = active.desc;
  missionConcept.textContent = `🧠 ${active.concept}`;
  missionReward.textContent = `${t("reward")}: +${active.xp_reward} XP, +${active.gold_reward} gold`;
  missionHint.textContent = active.hint;
  missionHint.classList.add("hidden");
  hintBtn.textContent = t("show_hint");
}

hintBtn.addEventListener("click", () => {
  const isHidden = missionHint.classList.toggle("hidden");
  hintBtn.textContent = isHidden ? t("show_hint") : t("hide_hint");
});

// Load hint into editor
document.getElementById("loadHintBtn").onclick = function() {
  const active = currentMissions.find(m => m.active && !m.completed);
  if (active && active.hint) {
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
  grass:        { emoji: "🌿", cost: 1,  gain: 5,  speed_key: "fast" },
  wheat:        { emoji: "🌾", cost: 5,  gain: 10, speed_key: "medium" },
  carrot:       { emoji: "🥕", cost: 7,  gain: 15, speed_key: "medium" },
  cabbage:      { emoji: "🥬", cost: 8,  gain: 20, speed_key: "slow" },
  strawberry:   { emoji: "🍓", cost: 10, gain: 28, speed_key: "slow" },
  eggplant:     { emoji: "🍆", cost: 9,  gain: 22, speed_key: "very_slow" },
  tomato:       { emoji: "🍅", cost: 10, gain: 18, speed_key: "medium" },
  sunflower:    { emoji: "🌻", cost: 12, gain: 30, speed_key: "slow" },
  pumpkin:      { emoji: "🎃", cost: 15, gain: 40, speed_key: "very_slow" },
  golden_apple: { emoji: "🍎", cost: 25, gain: 60, speed_key: "very_slow" },
};

function buildCropList() {
  cropList.innerHTML = "";
  const newCrops = ["sunflower", "pumpkin", "golden_apple"];
  for (const [name, info] of Object.entries(cropData)) {
    const profit = info.gain - info.cost;
    const roi = Math.round((profit / info.cost) * 100);
    const isNew = newCrops.includes(name);
    const card = document.createElement("div");
    card.className = "crop-card";
    card.innerHTML = `
      <span class="crop-emoji">${info.emoji}</span>
      <div class="crop-info">
        <div class="crop-name">${name}${isNew ? ' <span class="crop-tag">NEW</span>' : ''}</div>
        <div class="crop-stats">
          ${t("cost")}: ${info.cost}g | ${t("gain")}: ${info.gain}g<br>
          ${t("speed")}: ${t(info.speed_key)}<br>
          <span class="crop-profit">${t("profit")}: +${profit}g (${roi}% ROI)</span>
        </div>
      </div>
    `;
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
    card.innerHTML = `
      <span class="achieve-emoji">${ach.emoji}</span>
      <div class="achieve-title">${ach.title}</div>
      <div class="achieve-desc">${ach.desc}</div>
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

let authToken = localStorage.getItem("cyberfarm_token") || null;
let currentUsername = localStorage.getItem("cyberfarm_username") || null;

function updateAuthUI() {
  if (authToken && currentUsername) {
    if (loginBtn) loginBtn.textContent = `👤 ${currentUsername}`;
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
      localStorage.setItem("cyberfarm_token", authToken);
      localStorage.setItem("cyberfarm_username", currentUsername);
      updateAuthUI();
      authModal.classList.add("hidden");
      showToastNotification(
        `👤 ${action === "register" ? "Registered" : "Logged in"}`,
        `Welcome, ${currentUsername}!`,
        "toast-mission"
      );
      // Load saved progress
      loadCloudProgress();
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
    localStorage.removeItem("cyberfarm_token");
    localStorage.removeItem("cyberfarm_username");
    updateAuthUI();
    authModal.classList.add("hidden");
    showToastNotification("👤 Logged out", "See you next time!", "toast-mission");
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
  updateSeasonDisplay(data.farm);
  updatePestDisplay(data.farm);

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
const ws = new WebSocket(`${protocol}://${location.host}/ws/run`);

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

ws.onopen = () => {
  log(t("connected"));
  // Try to restore saved game state
  const saved = localStorage.getItem("cyberfarm_save");
  if (saved) {
    try {
      ws.send(JSON.stringify({ type: "restore", save: JSON.parse(saved) }));
    } catch(e) { /* ignore corrupt save */ }
  }
};

ws.onmessage = async e => {
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
    updateSeasonDisplay(msg.farm);
    updatePestDisplay(msg.farm);

    // Save game progress
    if (msg.farm && msg.farm.save) {
      localStorage.setItem("cyberfarm_save", JSON.stringify(msg.farm.save));
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
      updateSeasonDisplay(msg.farm);
      updatePestDisplay(msg.farm);

      // Save game progress
      if (msg.farm.save) {
        localStorage.setItem("cyberfarm_save", JSON.stringify(msg.farm.save));
        saveCloudProgress(msg.farm.save);
      }
    }

    log(t("done"));
  }

  if (msg.type === "error") {
    log("[error] " + msg.message);
    sfxError();
  }
};

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
  let html = "";
  if (!cell || !cell.type) {
    html = `
      <b>${t("empty_plot")}</b><br>
      📍 ${t("position")}: (${x}, ${y})<br>
      💧 ${t("water")}: ${Math.round((cell?.water ?? 0) * 100)}%<br>
      🌱 ${t("nutrition")}: ${Math.round((cell?.nutrient ?? 0) * 100)}%
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
      🌱 ${t("nutrition")}: ${nutritionPct}%
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
   About Panel
============================================================ */

const aboutBtn = document.getElementById("aboutBtn");
const aboutPanel = document.getElementById("aboutPanel");

aboutBtn.onclick = (e) => {
  e.stopPropagation();
  aboutPanel.classList.toggle("hidden");
};

document.addEventListener("click", () => {
  aboutPanel.classList.add("hidden");
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
    const wo = document.getElementById("welcomeOverlay");
    if (wo) {
      wo.classList.add("hidden");
      localStorage.setItem("cyberfarm_welcomed", "1");
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
if (localStorage.getItem("cyberfarm_welcomed")) {
  welcomeOverlay.classList.add("hidden");
}

welcomeStartBtn.addEventListener("click", () => {
  welcomeOverlay.classList.add("hidden");
  localStorage.setItem("cyberfarm_welcomed", "1");
});

/* ============================================================
   Dark Mode Toggle
============================================================ */

const darkModeBtn = document.getElementById("darkModeBtn");
let isDarkMode = localStorage.getItem("cyberfarm_dark") === "1";

function applyDarkMode() {
  document.body.classList.toggle("dark-mode", isDarkMode);
  darkModeBtn.textContent = isDarkMode ? "\u2600\ufe0f" : "\uD83C\uDF19";
  // Switch Monaco editor theme
  monaco.editor.setTheme(isDarkMode ? "vs-dark" : "vs");
  localStorage.setItem("cyberfarm_dark", isDarkMode ? "1" : "0");
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
  localStorage.setItem("cyberfarm_lang", currentLang);
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
  const marketBtn = document.getElementById("marketBtn");
  if (marketBtn) marketBtn.textContent = t("market_btn");
  // Re-render the crop list
  buildCropList();
  // Re-render mission panel
  if (currentMissions.length) updateMissionPanel(currentMissions);
}

/* ============================================================
   Init
============================================================ */

bgImg.onload = () => drawScene(currentFarm);
