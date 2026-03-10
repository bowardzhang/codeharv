![Screenshot](CyberFarm_Screenshot.png?raw=true "Screenshot")

# 🌱 Cyber Farm

**Cyber Farm** is a browser-based farming simulation game designed to help users learn **Python programming basics through gameplay**.

Instead of clicking buttons to farm, players **write Python scripts** to control planting, watering, fertilizing, and harvesting crops.  
Your code directly affects the farm — if your logic is good, your farm thrives 🌾.

---

## ✨ Features

- 🧠 **Learn Python by coding** — use real Python syntax to control the farm
- 🌱 **Grid-based farming system** with crops, growth, and resources
- 💧 Actions: **plant, water, fertilize, wait, harvest**
- ⏱ **Time-based crop growth** with maturity simulation
- 📊 Script execution statistics (cost, gain, ROI)
- 🏆 Best ROI tracking as an achievement
- 🖥 **Visual feedback**: animations, tooltips, hover highlights
- 🔌 Real-time backend powered by **FastAPI + WebSocket**

---

## 🌾 Crops

Currently supported crops:

| Crop        | Emoji |
|------------|-------|
| Grass      | 🌿 |
| Wheat      | 🌾 |
| Carrot     | 🥕 |
| Cabbage    | 🥬 |
| Strawberry | 🍓 |
| Eggplant   | 🍆 |
| Tomato     | 🍅 |

Each crop has different:
- planting cost
- growth speed
- harvest reward

---

## 🧪 Example Python Script

```python
plant("wheat", 2, 3)
water(2, 3)
fertilize(2, 3)
wait(4)

if is_mature(2, 3):
    harvest(2, 3)
```

Scripts can be executed:
- step-by-step (manual mode)
- automatically (run-all mode)

During execution, the game visualizes each step on the farm, highlights the currently executing line of code, and updates the farm state in real time.

---

## 🖥 Tech Stack

### Frontend
- Vanilla JavaScript
- HTML5 Canvas (perspective / isometric-style grid rendering)
- CSS (tooltips, hover highlights, animations)

### Backend
- Python 3
- FastAPI
- WebSocket for real-time communication
- Custom Python AST-based script executor

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/cyber-farm.git
cd cyber-farm
```

### 2. Start the App
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```


### 3. Then open:

http://localhost:8000

---

## 🎯 Project Goal

Cyber Farm is designed for:

- 🧑‍🎓 Beginners learning Python
- 👨‍🏫 Programming education and teaching demos
- 🧪 Experimenting with automation logic
- 🎮 Learning through interactive simulation

The long-term vision is to evolve Cyber Farm into a code-driven sandbox game where logic, optimization, and strategy matter more than clicks.

---

## 🛣 Roadmap

- User accounts and persistent farms
- More crops and advanced soil mechanics
- Fertilizer and nutrient systems
- Weather and seasonal effects
- Script challenges and puzzles
- Leaderboards (best ROI, efficiency)
- Mobile-friendly UI

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
