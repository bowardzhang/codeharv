# farm.py
from typing import Dict, Any, List, Optional, Set
import time
import random

# ---------- Crop Config ----------
CROPS = {
    "grass": {
        "plant_cost": 1,
        "harvest_gain": 5,
        "grow_speed": 0.20,
    },
    "wheat": {
        "plant_cost": 5,
        "harvest_gain": 10,
        "grow_speed": 0.12,
    },
    "carrot": {
        "plant_cost": 7,
        "harvest_gain": 15,
        "grow_speed": 0.10,
    },
    "cabbage": {
        "plant_cost": 8,
        "harvest_gain": 20,
        "grow_speed": 0.08,
    },
    "strawberry": {
        "plant_cost": 10,
        "harvest_gain": 28,
        "grow_speed": 0.06,
    },
    "eggplant": {
        "plant_cost": 9,
        "harvest_gain": 22,
        "grow_speed": 0.05,
    },
    "tomato": {
        "plant_cost": 10,
        "harvest_gain": 18,
        "grow_speed": 0.10,
    },
    "sunflower": {
        "plant_cost": 12,
        "harvest_gain": 30,
        "grow_speed": 0.07,
    },
    "pumpkin": {
        "plant_cost": 15,
        "harvest_gain": 40,
        "grow_speed": 0.04,
    },
    "golden_apple": {
        "plant_cost": 25,
        "harvest_gain": 60,
        "grow_speed": 0.03,
    },
}

GRID_SIZE = 6
BACKGROUND = "assets/farm_bg.webp"

# 0~1 field border in proportion of canvas
FIELD_RATIO = {
    "topLeft":     [0.425, 0.545],
    "topRight":    [0.755, 0.625],
    "bottomLeft":  [0.165, 0.625],
    "bottomRight": [0.565, 0.815],
}

GOLD_INITIAL = 500
WATER_COST = 2
FERTILIZE_COST = 3
PEST_REMOVE_COST = 5
EXEC_INTERVAL = 100  # in milliseconds

# ---------- Weather System ----------
WEATHERS = {
    "sunny":   {"growth_mult": 1.3, "emoji": "\u2600\ufe0f", "desc": "Sunny - crops grow faster!"},
    "rainy":   {"growth_mult": 1.5, "emoji": "\U0001f327\ufe0f", "desc": "Rainy - free watering & fast growth!"},
    "cloudy":  {"growth_mult": 1.0, "emoji": "\u2601\ufe0f", "desc": "Cloudy - normal growth"},
    "windy":   {"growth_mult": 0.8, "emoji": "\U0001f4a8", "desc": "Windy - slightly slower growth"},
    "drought": {"growth_mult": 0.5, "emoji": "\U0001f3dc\ufe0f", "desc": "Drought - very slow growth, water evaporates!"},
}

WEATHER_CHANGE_INTERVAL = 30.0  # farm-time seconds between weather changes

# ---------- Season System ----------
SEASONS = {
    "spring": {
        "growth_mult": 1.2,
        "emoji": "\U0001f338",
        "desc": "Spring - good for planting!",
        "special": "planting_bonus",
    },
    "summer": {
        "growth_mult": 1.5,
        "emoji": "\u2600\ufe0f",
        "desc": "Summer - best growth!",
        "special": "best_growth",
    },
    "autumn": {
        "growth_mult": 0.8,
        "emoji": "\U0001f342",
        "desc": "Autumn - harvest bonus (1.5x gain)!",
        "special": "harvest_bonus",
    },
    "winter": {
        "growth_mult": 0.3,
        "emoji": "\u2744\ufe0f",
        "desc": "Winter - crops can freeze!",
        "special": "frost_risk",
    },
}

SEASON_CHANGE_INTERVAL = 50.0  # farm-time seconds between season changes
SEASON_ORDER = ["spring", "summer", "autumn", "winter"]

# ---------- XP & Level System ----------
LEVELS = [
    {"level": 1,  "xp_needed": 0,    "title": "Seed Planter"},
    {"level": 2,  "xp_needed": 50,   "title": "Sprout Tender"},
    {"level": 3,  "xp_needed": 150,  "title": "Garden Helper"},
    {"level": 4,  "xp_needed": 300,  "title": "Farm Hand"},
    {"level": 5,  "xp_needed": 500,  "title": "Crop Master"},
    {"level": 6,  "xp_needed": 800,  "title": "Harvest King"},
    {"level": 7,  "xp_needed": 1200, "title": "Python Farmer"},
    {"level": 8,  "xp_needed": 1800, "title": "Code Wizard"},
    {"level": 9,  "xp_needed": 2500, "title": "Farm Tycoon"},
    {"level": 10, "xp_needed": 3500, "title": "Code Legend"},
]

# ---------- Achievements ----------
ACHIEVEMENTS = [
    {"id": "first_plant",  "title": "Green Thumb",   "desc": "Plant your first crop",         "emoji": "\U0001f331"},
    {"id": "first_harvest","title": "Reaper",         "desc": "Harvest your first crop",       "emoji": "\U0001f33e"},
    {"id": "gold_100",     "title": "Gold Digger",    "desc": "Accumulate 100 gold",           "emoji": "\U0001f4b0"},
    {"id": "gold_1000",    "title": "Rich Farmer",    "desc": "Accumulate 1000 gold",          "emoji": "\U0001f3e6"},
    {"id": "full_field",   "title": "Land Baron",     "desc": "Fill every cell with crops",    "emoji": "\U0001f3de\ufe0f"},
    {"id": "roi_50",       "title": "Investor",       "desc": "Achieve 50% ROI",               "emoji": "\U0001f4c8"},
    {"id": "roi_200",      "title": "Tycoon",         "desc": "Achieve 200% ROI",              "emoji": "\U0001f680"},
    {"id": "level_5",      "title": "Halfway There",  "desc": "Reach level 5",                 "emoji": "\u2b50"},
    {"id": "level_10",     "title": "Max Level",      "desc": "Reach level 10",                "emoji": "\U0001f451"},
    {"id": "all_crops",    "title": "Botanist",       "desc": "Plant every type of crop",      "emoji": "\U0001f9ec"},
    {"id": "missions_5",   "title": "Task Master",    "desc": "Complete 5 missions",           "emoji": "\U0001f4cb"},
    {"id": "missions_all", "title": "Completionist",  "desc": "Complete all missions",         "emoji": "\U0001f3c6"},
    {"id": "speed_demon",  "title": "Speed Demon",     "desc": "Complete a script in under 50 farm-time seconds", "emoji": "\u26a1"},
    {"id": "diverse_farmer","title": "Diverse Farmer", "desc": "Plant all crop types including new ones", "emoji": "\U0001f308"},
    {"id": "big_spender",  "title": "Big Spender",     "desc": "Spend 500+ gold in one script", "emoji": "\U0001f4b3"},
    {"id": "season_surfer","title": "Season Surfer",   "desc": "Experience all 4 seasons",      "emoji": "\U0001f308"},
    {"id": "market_whale", "title": "Market Whale",    "desc": "Earn 200+ gold from market sells in one script", "emoji": "\U0001f40b"},
    {"id": "pest_free",    "title": "Pest Free",       "desc": "Remove 5 pests in one script",  "emoji": "\U0001f6e1\ufe0f"},
    {"id": "winter_survivor","title": "Winter Survivor","desc": "Successfully harvest during winter", "emoji": "\u2744\ufe0f"},
    {"id": "roi_500",      "title": "ROI King",        "desc": "Achieve 500% ROI",              "emoji": "\U0001f451"},
    {"id": "gold_5000",    "title": "Millionaire",     "desc": "Accumulate 5000 gold",          "emoji": "\U0001f48e"},
]

# ---------- Missions ----------
# check field is a string that maps to a method on Farm: _check_mission_<check>
MISSIONS = [
    {
        "id": "m1",
        "title": "First Seed",
        "desc": "Plant your first crop! Use: plant(\"grass\", 0, 0)",
        "hint": "plant(\"grass\", 0, 0)",
        "xp_reward": 20,
        "gold_reward": 50,
        "concept": "Function Calls",
        "check": "any_planted",
    },
    {
        "id": "m2",
        "title": "Water the Garden",
        "desc": "Plant grass and water it. Use water(x, y) after planting.",
        "hint": "plant(\"grass\", 0, 0)\nwater(0, 0)",
        "xp_reward": 25,
        "gold_reward": 30,
        "concept": "Sequential Execution",
        "check": "any_watered",
    },
    {
        "id": "m3",
        "title": "First Harvest",
        "desc": "Grow a crop to maturity and harvest it! Use wait() to let time pass.",
        "hint": "plant(\"grass\", 0, 0)\nwater(0, 0)\nwait(10)\nharvest(0, 0)",
        "xp_reward": 40,
        "gold_reward": 50,
        "concept": "Complete Workflow",
        "check": "any_harvested",
    },
    {
        "id": "m4",
        "title": "Row Farmer",
        "desc": "Use a for loop to plant a whole row of crops!",
        "hint": "for x in range(6):\n    plant(\"wheat\", x, 0)",
        "xp_reward": 60,
        "gold_reward": 80,
        "concept": "For Loops",
        "check": "row_planted",
    },
    {
        "id": "m5",
        "title": "Smart Farmer",
        "desc": "Use is_mature() with if to check before harvesting.",
        "hint": "plant(\"wheat\", 0, 0)\nwater(0, 0)\nwait(15)\nif is_mature(0, 0):\n    harvest(0, 0)",
        "xp_reward": 60,
        "gold_reward": 80,
        "concept": "If Conditions",
        "check": None,
    },
    {
        "id": "m6",
        "title": "Full Field",
        "desc": "Use nested for loops to fill the entire 6x6 farm!",
        "hint": "for y in range(6):\n    for x in range(6):\n        plant(\"grass\", x, y)",
        "xp_reward": 80,
        "gold_reward": 100,
        "concept": "Nested Loops",
        "check": "full_field",
    },
    {
        "id": "m7",
        "title": "Profit Master",
        "desc": "Achieve a positive ROI! Earn more gold than you spend.",
        "hint": "clear()\nfor x in range(6):\n    plant(\"grass\", x, 0)\n    water(x, 0)\nwait(20)\nfor x in range(6):\n    harvest(x, 0)",
        "xp_reward": 80,
        "gold_reward": 100,
        "concept": "Optimization",
        "check": "positive_roi",
    },
    {
        "id": "m8",
        "title": "Crop Diversity",
        "desc": "Plant at least 4 different types of crops on your farm.",
        "hint": "plant(\"grass\", 0, 0)\nplant(\"wheat\", 1, 0)\nplant(\"carrot\", 2, 0)\nplant(\"tomato\", 3, 0)",
        "xp_reward": 60,
        "gold_reward": 80,
        "concept": "String Arguments",
        "check": "crop_diversity",
    },
    {
        "id": "m9",
        "title": "Weather Watcher",
        "desc": "Use get_weather() in your script to check the weather!",
        "hint": "w = get_weather()\nprint(w)",
        "xp_reward": 50,
        "gold_reward": 60,
        "concept": "Variables & Return Values",
        "check": None,
    },
    {
        "id": "m10",
        "title": "Automation Expert",
        "desc": "Write a script with at least 5 different function calls to automate your farm completely.",
        "hint": "clear()\nfor x in range(6):\n    plant(\"wheat\", x, 0)\n    water(x, 0)\n    fertilize(x, 0)\nwait(10)\nfor x in range(6):\n    if is_mature(x, 0):\n        harvest(x, 0)",
        "xp_reward": 100,
        "gold_reward": 150,
        "concept": "Combining Everything",
        "check": None,
    },
    {
        "id": "m11",
        "title": "Function Creator",
        "desc": "Define and use your own function with def!",
        "hint": "def plant_row(crop, y):\n    for x in range(6):\n        plant(crop, x, y)\n\nplant_row(\"grass\", 0)",
        "xp_reward": 80,
        "gold_reward": 120,
        "concept": "Defining Functions",
        "check": None,
    },
    {
        "id": "m12",
        "title": "The Collector",
        "desc": "Harvest 10+ crops in one script for a big payday!",
        "hint": "for y in range(2):\n    for x in range(6):\n        plant(\"grass\", x, y)\n        water(x, y)\nwait(20)\nfor y in range(2):\n    for x in range(6):\n        harvest(x, y)",
        "xp_reward": 90,
        "gold_reward": 130,
        "concept": "Loops & Counting",
        "check": "collector",
    },
    {
        "id": "m13",
        "title": "Weather Adapter",
        "desc": "Use get_weather() with if/elif to adapt your farming strategy!",
        "hint": "w = get_weather()\nif w == \"sunny\":\n    plant(\"wheat\", 0, 0)\nelif w == \"rainy\":\n    plant(\"carrot\", 0, 0)\nelif w == \"drought\":\n    plant(\"grass\", 0, 0)",
        "xp_reward": 70,
        "gold_reward": 100,
        "concept": "Elif Chains",
        "check": None,
    },
    {
        "id": "m14",
        "title": "Crop Calculator",
        "desc": "Use print() to display profit calculations with arithmetic!",
        "hint": "cost = 5\ngain = 10\nprofit = gain - cost\nprint(f\"Profit: {profit}\")",
        "xp_reward": 60,
        "gold_reward": 80,
        "concept": "Expressions & Output",
        "check": None,
    },
    {
        "id": "m15",
        "title": "Master Automator",
        "desc": "Fill the entire field, water all, wait, harvest all for maximum profit!",
        "hint": "clear()\nfor y in range(6):\n    for x in range(6):\n        plant(\"grass\", x, y)\n        water(x, y)\nwait(30)\nfor y in range(6):\n    for x in range(6):\n        if is_mature(x, y):\n            harvest(x, y)",
        "xp_reward": 120,
        "gold_reward": 200,
        "concept": "Complete Automation",
        "check": "master_automator",
    },
    {
        "id": "m16",
        "title": "While Loop Warrior",
        "desc": "Use a while loop in your script.",
        "hint": "i = 0\nwhile i < 6:\n    plant(\"grass\", i, 0)\n    i = i + 1",
        "xp_reward": 70,
        "gold_reward": 90,
        "concept": "While Loops",
        "check": None,
    },
    {
        "id": "m17",
        "title": "Market Trader",
        "desc": "Use get_price() and sell() to sell at market price.",
        "hint": "plant(\"grass\", 0, 0)\nwater(0, 0)\nwait(15)\nprice = get_price(\"grass\")\nprint(price)\nsell(0, 0)",
        "xp_reward": 80,
        "gold_reward": 100,
        "concept": "Return Values & Variables",
        "check": None,
    },
    {
        "id": "m18",
        "title": "Pest Controller",
        "desc": "Use has_pest() and remove_pest() to handle pests.",
        "hint": "# Plant and wait for pests to appear\nfor y in range(6):\n    for x in range(6):\n        plant(\"grass\", x, y)\nwait(30)\nfor y in range(6):\n    for x in range(6):\n        if has_pest(x, y):\n            remove_pest(x, y)",
        "xp_reward": 70,
        "gold_reward": 90,
        "concept": "Boolean Logic",
        "check": None,
    },
    {
        "id": "m19",
        "title": "Season Watcher",
        "desc": "Use get_season() with if to adapt to seasons.",
        "hint": "s = get_season()\nif s == \"summer\":\n    plant(\"wheat\", 0, 0)\nif s == \"winter\":\n    print(\"Too cold!\")",
        "xp_reward": 70,
        "gold_reward": 90,
        "concept": "String Comparison",
        "check": None,
    },
    {
        "id": "m20",
        "title": "Data Analyst",
        "desc": "Use get_all_mature() with len() and print results.",
        "hint": "mature = get_all_mature()\nprint(len(mature))\nprint(mature)",
        "xp_reward": 80,
        "gold_reward": 100,
        "concept": "Lists & len()",
        "check": None,
    },
    {
        "id": "m21",
        "title": "The Optimizer",
        "desc": "Use get_status() to check crop status before acting.",
        "hint": "plant(\"wheat\", 0, 0)\nwait(5)\ninfo = get_status(0, 0)\nprint(info)\nif info[\"maturity\"] < 1.0:\n    water(0, 0)",
        "xp_reward": 80,
        "gold_reward": 110,
        "concept": "Dictionaries & Return Values",
        "check": None,
    },
    {
        "id": "m22",
        "title": "Loop & Condition Master",
        "desc": "Use a while loop with is_mature() to wait until crop matures.",
        "hint": "plant(\"grass\", 0, 0)\nwater(0, 0)\nwhile not is_mature(0, 0):\n    wait(2)\nharvest(0, 0)",
        "xp_reward": 90,
        "gold_reward": 120,
        "concept": "While + Conditions",
        "check": None,
    },
    {
        "id": "m23",
        "title": "Inventory Manager",
        "desc": "Use count_crops() and get_all_planted() in your script.",
        "hint": "plant(\"grass\", 0, 0)\nplant(\"wheat\", 1, 0)\nprint(count_crops())\nprint(get_all_planted())",
        "xp_reward": 70,
        "gold_reward": 90,
        "concept": "Working with Lists",
        "check": None,
    },
    {
        "id": "m24",
        "title": "Market Timing",
        "desc": "Use get_market() to find and plant the most profitable crop.",
        "hint": "market = get_market()\nprint(market)\n# Find best price and plant that crop!",
        "xp_reward": 100,
        "gold_reward": 150,
        "concept": "Data Analysis",
        "check": None,
    },
    {
        "id": "m25",
        "title": "Grand Master",
        "desc": "Achieve 500%+ ROI in a single script run.",
        "hint": "# Optimize your farm for maximum profit!\nclear()\nfor y in range(6):\n    for x in range(6):\n        plant(\"grass\", x, y)\n        water(x, y)\nwait(30)\nfor y in range(6):\n    for x in range(6):\n        if is_mature(x, y):\n            sell(x, y)",
        "xp_reward": 150,
        "gold_reward": 300,
        "concept": "Algorithm Optimization",
        "check": "roi_500",
    },
]

# ---------- Farm World ----------
class Farm:
    def __init__(self, size: int = GRID_SIZE):
        self.grid_size = size
        self.gold = GOLD_INITIAL
        self.time = 0.0  # farm time in seconds

        # ---- script execution stats ----
        self.script_cost = 0
        self.script_gain = 0

        self.best_roi = 0.0

        # ---- weather ----
        self.weather = "sunny"
        self._weather_timer = 0.0  # time since last weather change

        # ---- season ----
        self.season = "spring"
        self._season_timer = 0.0

        # ---- market ----
        self.market_prices: Dict[str, float] = {
            crop: float(cfg["harvest_gain"]) for crop, cfg in CROPS.items()
        }
        self._market_timer = 0.0

        # ---- pests ----
        self.pests: Dict[tuple, str] = {}  # {(x,y): pest_type}
        self.pest_removed_count = 0

        # ---- new tracking stats ----
        self.market_sell_gain = 0
        self.experienced_seasons: Set[str] = {"spring"}  # start in spring
        self.harvested_in_winter = False

        # ---- XP & level ----
        self.xp = 0
        self.level = 1

        # ---- missions ----
        self.completed_missions: Set[str] = set()
        self.active_mission_idx = 0

        # ---- achievements ----
        self.unlocked_achievements: Set[str] = set()

        # ---- crop history (for achievement tracking) ----
        self.planted_crop_types: Set[str] = set()

        # ---- script action history (for mission tracking) ----
        self.has_planted = False
        self.has_watered = False
        self.has_harvested = False
        self.max_planted_in_row0 = 0  # max simultaneous plants in row 0

        # ---- print log (for user print() calls) ----
        self.print_log: List[str] = []

        self.grid = [
            [self._empty_cell() for _ in range(size)]
            for _ in range(size)
        ]

    @staticmethod
    def get_config():
        return {
            "grid": GRID_SIZE,
            "background": BACKGROUND,
            "field_ratio": FIELD_RATIO,
            "exec_interval": EXEC_INTERVAL,
        }

    # ---------- Cell ----------
    def _empty_cell(self) -> Dict[str, Any]:
        return {
            "type": None,
            "maturity": 0.0,
            "water": 0.0,
            "nutrient": 0.5,
        }

    def _check_bounds(self, x: int, y: int) -> None:
        """Raise ValueError if (x, y) is outside the grid or not integers."""
        if not isinstance(x, int) or not isinstance(y, int):
            raise ValueError(f"Coordinates must be integers, got ({type(x).__name__}, {type(y).__name__})")
        if not (0 <= x < self.grid_size and 0 <= y < self.grid_size):
            raise ValueError(f"Position ({x}, {y}) is out of range. Valid range: 0-{self.grid_size - 1}")

    def _cell(self, x: int, y: int) -> Dict[str, Any]:
        self._check_bounds(x, y)
        return self.grid[y][x]

    # ---------- Events ----------
    def _cell_event(self, x: int, y: int) -> Dict[str, Any]:
        return {
            "type": "cell_update",
            "x": x,
            "y": y,
            "cell": self.grid[y][x],
            "gold": self.gold,
        }

    def _farm_event(self, event_type: str) -> Dict[str, Any]:
        return {
            "type": event_type,
            "gold": self.gold,
        }

    # ---------- Weather ----------
    def get_weather(self) -> str:
        return self.weather

    def _maybe_change_weather(self, dt: float) -> None:
        self._weather_timer += dt
        if self._weather_timer >= WEATHER_CHANGE_INTERVAL:
            self._weather_timer = 0.0
            self.weather = random.choice(list(WEATHERS.keys()))

    # ---------- Season ----------
    def get_season(self) -> str:
        return self.season

    def _maybe_change_season(self, dt: float) -> None:
        self._season_timer += dt
        if self._season_timer >= SEASON_CHANGE_INTERVAL:
            self._season_timer = 0.0
            idx = SEASON_ORDER.index(self.season)
            self.season = SEASON_ORDER[(idx + 1) % len(SEASON_ORDER)]
            self.experienced_seasons.add(self.season)

    # ---------- Market ----------
    def get_price(self, crop: str) -> float:
        """Return current market sell price for a crop."""
        if crop not in CROPS:
            available = ", ".join(f'"{c}"' for c in CROPS)
            raise ValueError(f"Unknown crop: \"{crop}\". Available crops: {available}")
        return self.market_prices.get(crop, CROPS[crop]["harvest_gain"])

    def get_market(self) -> Dict[str, float]:
        """Return dict of all current market prices."""
        return dict(self.market_prices)

    def _maybe_change_market(self, dt: float) -> None:
        self._market_timer += dt
        if self._market_timer >= 30.0:
            self._market_timer = 0.0
            for crop, cfg in CROPS.items():
                base = cfg["harvest_gain"]
                fluctuation = random.uniform(-0.20, 0.20)
                self.market_prices[crop] = round(base * (1.0 + fluctuation), 1)

    # ---------- Pest System ----------
    def has_pest(self, x: int, y: int) -> bool:
        """Return True if there is a pest at (x, y), False otherwise."""
        self._check_bounds(x, y)
        return (x, y) in self.pests

    def get_pests(self) -> List[List]:
        """Return list of [x, y, type] for all active pests.
        Each entry can be accessed via p[0] (x), p[1] (y), p[2] (type)."""
        return [
            [pos[0], pos[1], ptype]
            for pos, ptype in self.pests.items()
        ]

    def _get_pests_snapshot(self) -> List[Dict[str, Any]]:
        """Return pests as dicts for frontend snapshot (uses .x, .y, .type access)."""
        return [
            {"x": pos[0], "y": pos[1], "type": ptype}
            for pos, ptype in self.pests.items()
        ]

    def remove_pest(self, x: int, y: int) -> Dict[str, Any]:
        """Remove pest at (x, y). Costs PEST_REMOVE_COST gold."""
        self._check_bounds(x, y)
        if (x, y) not in self.pests:
            raise ValueError("No pest at this location")
        if self.gold < PEST_REMOVE_COST:
            raise ValueError("Not enough gold")

        self.gold -= PEST_REMOVE_COST
        self.script_cost += PEST_REMOVE_COST
        del self.pests[(x, y)]
        self.pest_removed_count += 1
        self.add_xp(3)

        return self._cell_event(x, y)

    def _maybe_spawn_pests(self, dt: float) -> None:
        """Random chance of pest appearing: 0.5% per cell per tick-second."""
        pest_types_normal = ["bug", "weed"]
        for y in range(self.grid_size):
            for x in range(self.grid_size):
                cell = self.grid[y][x]
                if not cell["type"]:
                    continue
                if (x, y) in self.pests:
                    continue
                chance = 0.005 * dt
                if random.random() < chance:
                    if self.season == "winter":
                        ptype = random.choice(pest_types_normal + ["frost"])
                    else:
                        ptype = random.choice(pest_types_normal)
                    self.pests[(x, y)] = ptype

    # ---------- XP & Level ----------
    def add_xp(self, amount: int) -> Optional[Dict[str, Any]]:
        """Add XP and check for level-up. Returns level_up info dict or None."""
        self.xp += amount
        new_level = self.level
        for lvl in reversed(LEVELS):
            if self.xp >= lvl["xp_needed"]:
                new_level = lvl["level"]
                break
        if new_level > self.level:
            old_level = self.level
            self.level = new_level
            title = LEVELS[new_level - 1]["title"]
            return {
                "old_level": old_level,
                "new_level": new_level,
                "title": title,
            }
        return None

    # ---------- New API Functions ----------
    def get_status(self, x: int, y: int) -> Dict[str, Any]:
        """Return dict with crop type, maturity, water, nutrient, pest info."""
        cell = self._cell(x, y)
        return {
            "type": cell["type"],
            "maturity": cell["maturity"],
            "water": cell["water"],
            "nutrient": cell["nutrient"],
            "pest": self.pests.get((x, y), None),
        }

    def get_gold(self) -> int:
        """Return current gold."""
        return self.gold

    def get_time(self) -> float:
        """Return current farm time."""
        return self.time

    def get_all_mature(self) -> List[List[int]]:
        """Return list of [x, y] for all mature crops."""
        result = []
        for y in range(self.grid_size):
            for x in range(self.grid_size):
                cell = self.grid[y][x]
                if cell["type"] and cell["maturity"] >= 1.0:
                    result.append([x, y])
        return result

    def get_all_planted(self) -> List[List[Any]]:
        """Return list of [x, y, crop_type] for all planted cells."""
        result = []
        for y in range(self.grid_size):
            for x in range(self.grid_size):
                cell = self.grid[y][x]
                if cell["type"]:
                    result.append([x, y, cell["type"]])
        return result

    def count_crops(self) -> int:
        """Return count of planted crops."""
        count = 0
        for y in range(self.grid_size):
            for x in range(self.grid_size):
                if self.grid[y][x]["type"]:
                    count += 1
        return count

    # ---------- Mission Checks ----------
    def _check_mission_any_planted(self) -> bool:
        return self.has_planted

    def _check_mission_any_watered(self) -> bool:
        return self.has_planted and self.has_watered

    def _check_mission_any_harvested(self) -> bool:
        return self.has_harvested and self.script_gain > 0

    def _check_mission_row_planted(self) -> bool:
        # Check current state OR historical max
        current = sum(1 for cell in self.grid[0] if cell["type"]) >= 6
        return current or self.max_planted_in_row0 >= 6

    def _check_mission_full_field(self) -> bool:
        return all(cell["type"] is not None for row in self.grid for cell in row)

    def _check_mission_positive_roi(self) -> bool:
        return self.script_gain > self.script_cost and self.script_cost > 0

    def _check_mission_crop_diversity(self) -> bool:
        types = set(cell["type"] for row in self.grid for cell in row if cell["type"])
        return len(types) >= 4

    def _check_mission_collector(self) -> bool:
        return self.script_gain >= 50

    def _check_mission_master_automator(self) -> bool:
        return self.script_gain >= 100

    def _check_mission_roi_500(self) -> bool:
        if self.script_cost <= 0:
            return False
        return (self.script_gain - self.script_cost) / self.script_cost >= 5.0

    def check_mission_by_name(self, check_name: str) -> bool:
        method = getattr(self, f"_check_mission_{check_name}", None)
        if method is None:
            return False
        return method()

    def check_missions(self, called_functions: Optional[Set[str]] = None,
                       code_text: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Check if active (and subsequent) missions are complete.
        Returns list of newly completed mission info dicts.
        """
        results = []

        while self.active_mission_idx < len(MISSIONS):
            mission = MISSIONS[self.active_mission_idx]
            mid = mission["id"]

            if mid in self.completed_missions:
                self.active_mission_idx += 1
                continue

            completed = False

            if mission["check"] is not None:
                completed = self.check_mission_by_name(mission["check"])
            else:
                # Code-analysis missions
                completed = self._check_code_mission(mid, called_functions, code_text)

            if not completed:
                break

            # Mission complete!
            self.completed_missions.add(mid)
            self.gold += mission["gold_reward"]
            level_up = self.add_xp(mission["xp_reward"])

            results.append({
                "mission_id": mid,
                "title": mission["title"],
                "xp_reward": mission["xp_reward"],
                "gold_reward": mission["gold_reward"],
                "concept": mission["concept"],
                "level_up": level_up,
            })

            self.active_mission_idx += 1

        return results

    def _check_code_mission(self, mission_id: str,
                            called_functions: Optional[Set[str]],
                            code_text: Optional[str]) -> bool:
        """Check missions that require code analysis."""
        cf = called_functions or set()
        ct = code_text or ""

        if mission_id == "m5":
            # Smart Farmer: must use is_mature and if
            return "is_mature" in cf and "if " in ct

        if mission_id == "m9":
            # Weather Watcher: must call get_weather
            return "get_weather" in cf

        if mission_id == "m10":
            # Automation Expert: at least 5 distinct function calls
            return len(cf) >= 5

        if mission_id == "m11":
            # Function Creator: must define a function with def
            return "def " in ct

        if mission_id == "m13":
            # Weather Adapter: must use get_weather and elif
            return "get_weather" in cf and "elif" in ct

        if mission_id == "m14":
            # Crop Calculator: must use print and arithmetic
            has_print = "print" in cf
            has_arithmetic = any(op in ct for op in ["+", "-", "*", "/"])
            return has_print and has_arithmetic

        if mission_id == "m16":
            # While Loop Warrior: must use a while loop
            return "while " in ct

        if mission_id == "m17":
            # Market Trader: must use get_price and sell
            return "get_price" in cf and "sell" in cf

        if mission_id == "m18":
            # Pest Controller: must use has_pest and remove_pest
            return "has_pest" in cf and "remove_pest" in cf

        if mission_id == "m19":
            # Season Watcher: must use get_season with if
            return "get_season" in cf and "if " in ct

        if mission_id == "m20":
            # Data Analyst: must use get_all_mature and len and print
            return "get_all_mature" in cf and "len" in ct and "print" in cf

        if mission_id == "m21":
            # The Optimizer: must use get_status
            return "get_status" in cf

        if mission_id == "m22":
            # Loop & Condition Master: while loop with is_mature
            return "while " in ct and "is_mature" in cf

        if mission_id == "m23":
            # Inventory Manager: count_crops and get_all_planted
            return "count_crops" in cf and "get_all_planted" in cf

        if mission_id == "m24":
            # Market Timing: get_market
            return "get_market" in cf

        return False

    def get_missions_data(self) -> List[Dict[str, Any]]:
        """Return serializable mission info (no lambdas/functions) for frontend."""
        data = []
        for i, m in enumerate(MISSIONS):
            data.append({
                "id": m["id"],
                "title": m["title"],
                "desc": m["desc"],
                "hint": m["hint"],
                "xp_reward": m["xp_reward"],
                "gold_reward": m["gold_reward"],
                "concept": m["concept"],
                "completed": m["id"] in self.completed_missions,
                "active": i == self.active_mission_idx,
            })
        return data

    # ---------- Achievements ----------
    def check_achievements(self) -> List[Dict[str, Any]]:
        """Check and return newly unlocked achievements."""
        newly_unlocked = []

        roi_current = 0.0
        if self.script_cost > 0:
            roi_current = (self.script_gain - self.script_cost) / self.script_cost

        checks = {
            "first_plant": self.has_planted,
            "first_harvest": self.has_harvested,
            "gold_100": self.gold >= 100,
            "gold_1000": self.gold >= 1000,
            "full_field": self._check_mission_full_field(),
            "roi_50": roi_current >= 0.5 if self.script_cost > 0 else False,
            "roi_200": roi_current >= 2.0 if self.script_cost > 0 else False,
            "level_5": self.level >= 5,
            "level_10": self.level >= 10,
            "all_crops": len(self.planted_crop_types) >= len(CROPS),
            "missions_5": len(self.completed_missions) >= 5,
            "missions_all": len(self.completed_missions) >= len(MISSIONS),
            "speed_demon": self.time < 50 and self.script_gain > 0,
            "diverse_farmer": len(self.planted_crop_types) >= len(CROPS),
            "big_spender": self.script_cost >= 500,
            # New achievements
            "season_surfer": len(self.experienced_seasons) >= 4,
            "market_whale": self.market_sell_gain >= 200,
            "pest_free": self.pest_removed_count >= 5,
            "winter_survivor": self.harvested_in_winter,
            "roi_500": roi_current >= 5.0 if self.script_cost > 0 else False,
            "gold_5000": self.gold >= 5000,
        }

        for ach in ACHIEVEMENTS:
            aid = ach["id"]
            if aid in self.unlocked_achievements:
                continue
            if checks.get(aid, False):
                self.unlocked_achievements.add(aid)
                newly_unlocked.append({
                    "id": aid,
                    "title": ach["title"],
                    "desc": ach["desc"],
                    "emoji": ach["emoji"],
                })

        return newly_unlocked

    # ---------- API ----------
    def plant(self, crop: str, x: int, y: int) -> Dict[str, Any]:
        if not isinstance(crop, str):
            raise ValueError(f"plant(crop, x, y): first argument must be a crop name string like \"grass\", got {type(crop).__name__}")
        if crop not in CROPS:
            available = ", ".join(f'"{c}"' for c in CROPS)
            raise ValueError(f"Unknown crop: \"{crop}\". Available crops: {available}")

        self._check_bounds(x, y)
        cell = self.grid[y][x]
        if cell["type"] is not None:
            raise ValueError("Cell already occupied")

        cost = CROPS[crop]["plant_cost"]
        if self.gold < cost:
            raise ValueError("Not enough gold")

        self.gold -= cost
        self.script_cost += cost

        cell.update({
            "type": crop,
            "maturity": 0.0,
            "water": 0.3,
            "nutrient": 0.5,
        })

        self.planted_crop_types.add(crop)
        self.has_planted = True

        # Track row 0 fill count for mission
        row0_count = sum(1 for c in self.grid[0] if c["type"])
        self.max_planted_in_row0 = max(self.max_planted_in_row0, row0_count)

        self.add_xp(2)

        return self._cell_event(x, y)

    def water(self, x: int, y: int) -> Dict[str, Any]:
        cell = self._cell(x, y)

        if cell["type"] is None:
            raise ValueError("Nothing to water")

        if self.gold < WATER_COST:
            raise ValueError("Not enough gold")

        self.gold -= WATER_COST
        self.script_cost += WATER_COST

        cell["water"] = min(1.0, cell["water"] + 0.4)

        # water accelerates maturity
        cell["maturity"] = min(
            1.0,
            cell["maturity"] + 0.15 * cell["water"]
        )

        self.has_watered = True
        self.add_xp(1)

        return self._cell_event(x, y)

    def harvest(self, x: int, y: int) -> Dict[str, Any]:
        cell = self._cell(x, y)

        if cell["type"] is None:
            raise ValueError("Nothing to harvest")

        if cell["maturity"] < 1.0:
            raise ValueError("Crop not mature")

        crop = cell["type"]
        gain = CROPS[crop]["harvest_gain"]

        # Autumn harvest bonus
        if self.season == "autumn":
            gain = int(gain * 1.5)

        self.gold += gain
        self.script_gain += gain

        # Track winter harvest
        if self.season == "winter":
            self.harvested_in_winter = True

        # Clean up pest if present
        if (x, y) in self.pests:
            del self.pests[(x, y)]

        self.grid[y][x] = self._empty_cell()

        self.has_harvested = True
        self.add_xp(5)

        return self._cell_event(x, y)

    def sell(self, x: int, y: int) -> Dict[str, Any]:
        """Sell a mature crop at current market price."""
        cell = self._cell(x, y)

        if cell["type"] is None:
            raise ValueError("Nothing to sell")

        if cell["maturity"] < 1.0:
            raise ValueError("Crop not mature")

        crop = cell["type"]
        gain = int(self.market_prices.get(crop, CROPS[crop]["harvest_gain"]))

        # Autumn harvest bonus applies to sells too
        if self.season == "autumn":
            gain = int(gain * 1.5)

        self.gold += gain
        self.script_gain += gain
        self.market_sell_gain += gain

        # Track winter harvest
        if self.season == "winter":
            self.harvested_in_winter = True

        # Clean up pest if present
        if (x, y) in self.pests:
            del self.pests[(x, y)]

        self.grid[y][x] = self._empty_cell()

        self.has_harvested = True
        self.add_xp(5)

        return self._cell_event(x, y)

    def fertilize(self, x: int, y: int) -> Dict[str, Any]:
        cell = self._cell(x, y)

        if cell["type"] is None:
            raise ValueError("Nothing to fertilize")

        if self.gold < FERTILIZE_COST:
            raise ValueError("Not enough gold")

        self.gold -= FERTILIZE_COST
        self.script_cost += FERTILIZE_COST

        cell["nutrient"] = min(1.0, cell["nutrient"] + 0.35)
        cell["maturity"] = min(
            1.0,
            cell["maturity"] + 0.18 * cell["nutrient"]
        )

        self.add_xp(2)

        return self._cell_event(x, y)

    def wait(self, seconds: int | float = 1) -> Dict[str, Any]:
        if seconds is None or seconds <= 0:
            raise ValueError("wait(seconds) expects a positive number")

        self.tick(float(seconds))
        return self._farm_event("wait")

    def is_mature(self, x: int, y: int) -> bool:
        cell = self._cell(x, y)
        return bool(cell["type"]) and cell["maturity"] >= 1.0

    # ------ Empty farm field ------
    def clear_field(self) -> Dict[str, Any]:
        for y in range(self.grid_size):
            for x in range(self.grid_size):
                self.grid[y][x] = self._empty_cell()
        self.pests.clear()

        return self._cell_event(0, 0)

    # ---------- Time ----------
    def tick(self, dt: float) -> None:
        """
        Update farm field as time elapses.
        dt: seconds
        """
        if dt <= 0:
            return
        self.time += dt

        # Weather change check
        self._maybe_change_weather(dt)
        # Season change check
        self._maybe_change_season(dt)
        # Market price fluctuation
        self._maybe_change_market(dt)
        # Pest spawning
        self._maybe_spawn_pests(dt)

        weather_mult = WEATHERS[self.weather]["growth_mult"]
        season_mult = SEASONS[self.season]["growth_mult"]

        for y in range(self.grid_size):
            for x in range(self.grid_size):
                cell = self.grid[y][x]
                if not cell["type"]:
                    continue

                # Apply pest effects
                pest = self.pests.get((x, y))
                pest_growth_mult = 1.0
                if pest == "bug":
                    pest_growth_mult = 0.5  # slows growth 50%
                elif pest == "weed":
                    cell["nutrient"] = max(0.05, cell["nutrient"] - 0.02 * dt)

                # Frost kills crops in winter if not removed after 20 seconds
                if pest == "frost" and self.season == "winter":
                    # Track frost duration in a simple way: frost kills after 20s of farm time
                    # We use a probabilistic approach: if frost has been present,
                    # after enough ticks it kills the crop
                    # Simplified: frost damage accumulates, kills at threshold
                    frost_kill_chance = dt / 20.0  # after ~20 seconds total, crop dies
                    if random.random() < frost_kill_chance:
                        self.grid[y][x] = self._empty_cell()
                        if (x, y) in self.pests:
                            del self.pests[(x, y)]
                        continue

                crop_cfg = CROPS[cell["type"]]
                growth = (
                    crop_cfg["grow_speed"]
                    * cell["water"]
                    * (0.5 + cell["nutrient"])
                    * dt
                    * weather_mult
                    * season_mult
                    * pest_growth_mult
                )
                cell["maturity"] = min(1.0, cell["maturity"] + growth)

                # nutrients slowly decay over time
                cell["nutrient"] = max(0.1, cell["nutrient"] - 0.015 * dt)

                # Rainy weather: slowly add water automatically
                if self.weather == "rainy":
                    cell["water"] = min(1.0, cell["water"] + 0.02 * dt)

                # Drought: water evaporates faster
                if self.weather == "drought":
                    cell["water"] = max(0.0, cell["water"] - 0.03 * dt)

    # ---------- Save Data ----------
    def save_data(self) -> Dict[str, Any]:
        """Return minimal state for client-side persistence."""
        return {
            "gold": self.gold,
            "xp": self.xp,
            "level": self.level,
            "completed_missions": list(self.completed_missions),
            "unlocked_achievements": list(self.unlocked_achievements),
            "planted_crop_types": list(self.planted_crop_types),
            "best_roi": self.best_roi,
            "active_mission_idx": self.active_mission_idx,
            "experienced_seasons": list(self.experienced_seasons),
            "pest_removed_count": self.pest_removed_count,
            "market_sell_gain": self.market_sell_gain,
            "harvested_in_winter": self.harvested_in_winter,
        }

    # ---------- Snapshot ----------
    def snapshot(self) -> Dict[str, Any]:
        """Full world state (for reconnect / reset)."""
        return {
            "type": "snapshot",
            "grid": self.grid,
            "gold": self.gold,
            "time": self.time,
            "weather": self.weather,
            "weather_info": WEATHERS[self.weather],
            "season": self.season,
            "season_info": SEASONS[self.season],
            "market_prices": dict(self.market_prices),
            "pests": self._get_pests_snapshot(),
            "xp": self.xp,
            "level": self.level,
            "level_title": LEVELS[self.level - 1]["title"],
            "levels": LEVELS,
            "missions": self.get_missions_data(),
            "achievements": [
                {**ach, "unlocked": ach["id"] in self.unlocked_achievements}
                for ach in ACHIEVEMENTS
            ],
            "print_log": self.print_log,
            "save": self.save_data(),
        }

    def get_script_result(self):
        cost = self.script_cost
        gain = self.script_gain

        roi = 0
        if gain > cost and cost > 0:
            roi = (gain - cost) / cost

        return {
            "cost": cost,
            "gain": gain,
            "roi": roi,
        }
