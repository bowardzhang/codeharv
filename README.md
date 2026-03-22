![Screenshot](CyberFarm_Screenshot.png?raw=true "Screenshot")

# 🌱 Cyber Farm

**Cyber Farm** is a browser-based farming simulation game designed to help users learn **Python programming basics through gameplay**.

Instead of clicking buttons to farm, players **write Python scripts** to control planting, watering, fertilizing, and harvesting crops.
Your code directly affects the farm — if your logic is good, your farm thrives 🌾.

---

## ✨ Features

### Core Gameplay
- 🧠 **Learn Python by coding** — use real Python syntax to control the farm
- 🌱 **Grid-based farming system** (6×6) with crops, growth, and resources
- 💧 Actions: **plant, water, fertilize, wait, harvest, clear**
- ⏱ **Time-based crop growth** with maturity simulation
- 🌦 **Dynamic weather system** — sunny, rainy, cloudy, windy, drought affect growth
- 📊 Script execution statistics (cost, gain, ROI)

### Mission & Progression System
- 📋 **15 progressive missions** teaching Python concepts step by step:
  - Function calls → Sequential execution → For loops → If conditions → Nested loops → User-defined functions → And more
- ⭐ **XP & Level system** — 10 levels from "Seed Planter" to "Cyber Legend"
- 🏆 **15 achievements** to unlock (Green Thumb, Reaper, Investor, Speed Demon, etc.)
- 💡 **Hint system** with "Load into Editor" for guided learning

### Python Features Supported
- Variables, assignment, augmented assignment (`+=`, `-=`, etc.)
- `for` loops with `range()`, `while` loops
- `if`/`elif`/`else` conditionals
- User-defined functions with `def`, parameters, and `return`
- F-strings, list/tuple literals, subscript indexing
- Boolean/comparison/arithmetic operators
- Built-in functions: `print`, `len`, `str`, `int`, `float`, `bool`, `abs`, `max`, `min`, `round`, `type`, `range`

### UI & Experience
- 🌙 **Dark mode** with toggle
- 🌐 **Bilingual** — English / 简体中文 language switching
- 💾 **Game state persistence** — progress saves to localStorage and restores on reload
- 🖥 **Visual feedback**: crop growth stages (seedling → sprout → mature), harvest particle effects, floating gold animations
- 📖 **Crop Encyclopedia** with stats, ROI, and profit info
- ⌨️ **Monaco Editor** with Python autocomplete and syntax highlighting
- 🔔 **Toast notifications** for mission completions, achievements, and level-ups

---

## 🌾 Crops

| Crop         | Emoji | Cost | Gain | Speed     | ROI  |
|-------------|-------|------|------|-----------|------|
| Grass        | 🌿   | 1g   | 5g   | Fast      | 400% |
| Wheat        | 🌾   | 5g   | 10g  | Medium    | 100% |
| Carrot       | 🥕   | 7g   | 15g  | Medium    | 114% |
| Cabbage      | 🥬   | 8g   | 20g  | Slow      | 150% |
| Strawberry   | 🍓   | 10g  | 28g  | Slow      | 180% |
| Eggplant     | 🍆   | 9g   | 22g  | Very Slow | 144% |
| Tomato       | 🍅   | 10g  | 18g  | Medium    | 80%  |
| Sunflower    | 🌻   | 12g  | 30g  | Slow      | 150% |
| Pumpkin      | 🎃   | 15g  | 40g  | Very Slow | 167% |
| Golden Apple | 🍎   | 25g  | 60g  | Very Slow | 140% |

Each crop progresses through 3 visual growth stages: 🌱 Seedling → 🪴 Sprout → Final Emoji.

---

## 🧪 Example Python Scripts

### Beginner: Plant and Harvest
```python
plant("grass", 0, 0)
water(0, 0)
wait(10)
harvest(0, 0)
```

### Intermediate: Loop Planting
```python
for x in range(6):
    plant("wheat", x, 0)
    water(x, 0)
wait(20)
for x in range(6):
    if is_mature(x, 0):
        harvest(x, 0)
```

### Advanced: Custom Functions
```python
def plant_row(crop, y):
    for x in range(6):
        plant(crop, x, y)
        water(x, y)

plant_row("grass", 0)
plant_row("wheat", 1)
wait(20)

for y in range(2):
    for x in range(6):
        if is_mature(x, y):
            harvest(x, y)
```

### Weather-Adaptive Farming
```python
w = get_weather()
if w == "sunny":
    plant("wheat", 0, 0)
elif w == "rainy":
    plant("carrot", 0, 0)
elif w == "drought":
    plant("grass", 0, 0)
```

Scripts can be executed:
- **Step-by-step** (manual mode) — learn what each line does
- **Automatically** (run-all mode) — watch your farm come alive
- **Pause/Resume** — pause auto-execution at any time

---

## 🎮 Available Functions

| Function | Description | Cost |
|---------|-------------|------|
| `plant("crop", x, y)` | Plant a crop at position (x, y) | Varies |
| `water(x, y)` | Water the crop | 2g |
| `fertilize(x, y)` | Fertilize for faster growth | 3g |
| `harvest(x, y)` | Harvest a mature crop | Free |
| `wait(seconds)` | Advance farm time | Free |
| `is_mature(x, y)` | Check if crop is ready | Free |
| `get_weather()` | Get current weather | Free |
| `clear()` | Clear entire field | Free |
| `print(value)` | Print to console | Free |

---

## 🖥 Tech Stack

### Frontend
- Vanilla JavaScript (ES Modules)
- Monaco Editor (via CDN) for Python editing
- HTML5 Canvas (perspective grid rendering)
- CSS with dark mode support
- i18n (English / Chinese)

### Backend
- Python 3
- FastAPI
- WebSocket for real-time communication
- Custom Python AST-based script executor (safe sandboxed execution)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/bowardzhang/cyber-farm.git
cd cyber-farm
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Start the server
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8080
```

### 4. Open in browser

http://localhost:8080

---

## 🎯 Project Goal

Cyber Farm is designed for:

- 🧑‍🎓 **Beginners learning Python** — zero to hero through guided missions
- 👨‍🏫 **Programming education** — teaching demos and classroom use
- 🧪 **Experimenting with automation logic** — optimize your farm for max ROI
- 🎮 **Learning through play** — gamification makes coding fun

The long-term vision is to evolve Cyber Farm into a code-driven sandbox game where logic, optimization, and strategy matter more than clicks.

---

## 🛣 Roadmap

- [x] Weather and seasonal effects
- [x] Mission system with progressive Python concepts
- [x] XP, levels, and achievements
- [x] Dark mode
- [x] Bilingual support (EN/CN)
- [x] Game state persistence
- [x] User-defined functions (`def`)
- [ ] User accounts and cloud-based persistent farms
- [ ] More advanced Python features (classes, dictionaries)
- [ ] Script challenges and puzzles with leaderboards
- [ ] Multiplayer / farm visiting
- [ ] Mobile-friendly responsive UI

---

## 📜 License

MIT License
You are free to use, modify, and distribute this project.

---

## 🙌 Contributions

Contributions, ideas, and feedback are welcome!
If you find a bug or have an idea, please open an issue or submit a pull request.

---

Happy farming — and happy coding! 🌱🐍
