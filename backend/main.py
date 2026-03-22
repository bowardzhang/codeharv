from time import time
from farm import Farm, LEVELS, GOLD_INITIAL
from executor import Executor
from storage import load_user_farm

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import ast
import asyncio

app = FastAPI()

# ===============================
# API
# ===============================

@app.get("/api/bootstrap")
async def bootstrap(user_id: str | None = None):
    farm = load_user_farm(user_id)

    if farm is None:
        farm = Farm()

    return {
        "config": Farm.get_config(),
        "farm": farm.snapshot()
    }

TICK_INTERVAL_FARM = 1  # interval in second
TICK_INTERVAL_REAL = 0.1  # interval in second

async def idle_farm_ticker(
    ws: WebSocket, farm: Farm,
    stop_event: asyncio.Event
):
    """
    Idle farm ticker: advances farm time and sends farm_state.
    """
    try:
        while not stop_event.is_set() and farm.time < 199:
            await asyncio.sleep(TICK_INTERVAL_REAL)

            farm.tick(TICK_INTERVAL_FARM)

            await ws.send_json({
                "type": "farm_state",
                "farm": farm.snapshot()
            })

    except asyncio.CancelledError:
        pass


# ===============================
# WebSocket
# ===============================

@app.websocket("/ws/run")
async def run_script(ws: WebSocket):
    await ws.accept()

    farm = Farm()
    executor = None

    idle_ticker_task = None
    idle_stop_event = asyncio.Event()

    def stop_idle_ticker():
        nonlocal idle_ticker_task, idle_stop_event
        if idle_ticker_task:
            idle_stop_event.set()
            idle_ticker_task.cancel()
            idle_ticker_task = None
            idle_stop_event = asyncio.Event()

    def start_idle_ticker():
        nonlocal idle_ticker_task, idle_stop_event
        idle_stop_event = asyncio.Event()
        idle_ticker_task = asyncio.create_task(
            idle_farm_ticker(ws, farm, idle_stop_event)
        )

    async def handle_script_done(executor_ref=None):
        result = farm.get_script_result()

        new_record = False
        if result["roi"] > farm.best_roi:
            farm.best_roi = result["roi"]
            new_record = True

        # --- Check missions ---
        called_functions = executor_ref.called_functions if executor_ref else set()
        code_text = executor_ref.code_text if executor_ref else ""
        mission_results = farm.check_missions(
            called_functions=called_functions,
            code_text=code_text,
        )

        # --- Check achievements ---
        new_achievements = farm.check_achievements()

        # --- Build done message ---
        done_msg = {
            "type": "done",
            "result": {
                "cost": result["cost"],
                "gain": result["gain"],
                "roi": result["roi"],
                "best_roi": farm.best_roi,
                "new_record": new_record,
            },
            "farm": farm.snapshot(),
            "xp": farm.xp,
            "level": farm.level,
            "level_title": LEVELS[farm.level - 1]["title"],
            "missions_completed": mission_results,
            "achievements_unlocked": new_achievements,
            "print_log": farm.print_log,
        }

        # Check for level-ups from mission rewards
        level_ups = [
            m["level_up"] for m in mission_results
            if m.get("level_up") is not None
        ]
        if level_ups:
            done_msg["level_ups"] = level_ups

        await ws.send_json(done_msg)
        start_idle_ticker()

    try:
        while True:
            msg = await ws.receive_json()

            # ==============================
            # START SCRIPT
            # ==============================
            if msg["type"] == "start":
                stop_idle_ticker()

                # Reset time (but keep gold)
                farm.time = 0

                # ---- reset script execution stats ----
                farm.script_cost = 0
                farm.script_gain = 0

                # ---- reset print log ----
                farm.print_log = []

                tree = ast.parse(msg["code"])
                is_manual = msg["mode"] == "manual_step"
                executor = Executor(tree, farm, is_manual)

                # Manual step: execute one step
                if is_manual:
                    ev = executor.step()

                    if ev is None:
                        await handle_script_done(executor)
                    else:
                        await ws.send_json({
                            "type": "event",
                            "event": ev
                        })
                        await ws.send_json({
                            "type": "farm_state",
                            "farm": farm.snapshot()
                        })

                # Auto run
                else:
                    while True:
                        ev = executor.step()

                        if ev is None:
                            await handle_script_done(executor)
                            break

                        await ws.send_json({
                            "type": "event",
                            "event": ev
                        })
                        await ws.send_json({
                            "type": "farm_state",
                            "farm": farm.snapshot()
                        })

                        # Wait for frontend ack / abort
                        ctrl = await ws.receive_json()

                        if ctrl["type"] == "ack":
                            continue
                        elif ctrl["type"] == "abort":
                            executor = None
                            break

            # ==============================
            # STEP (manual mode)
            # ==============================
            elif msg["type"] == "step":
                if executor is None:
                    await ws.send_json({
                        "type": "error",
                        "message": "Script not initialized"
                    })
                    continue

                ev = executor.step()

                if ev is None:
                    await handle_script_done(executor)
                else:
                    await ws.send_json({
                        "type": "event",
                        "event": ev
                    })
                    await ws.send_json({
                        "type": "farm_state",
                        "farm": farm.snapshot()
                    })

            # ==============================
            # ABORT
            # ==============================
            elif msg["type"] == "abort":
                executor = None
                stop_idle_ticker()
                await ws.send_json({"type": "done"})

            # ==============================
            # RESTORE (client save data)
            # ==============================
            elif msg["type"] == "restore":
                # Restore farm state from client save data
                save = msg.get("save", {})
                if save:
                    farm.gold = save.get("gold", GOLD_INITIAL)
                    farm.xp = save.get("xp", 0)
                    farm.level = save.get("level", 1)
                    farm.completed_missions = set(save.get("completed_missions", []))
                    farm.unlocked_achievements = set(save.get("unlocked_achievements", []))
                    farm.planted_crop_types = set(save.get("planted_crop_types", []))
                    farm.best_roi = save.get("best_roi", 0.0)
                    farm.active_mission_idx = save.get("active_mission_idx", 0)
                await ws.send_json({
                    "type": "farm_state",
                    "farm": farm.snapshot()
                })

    except WebSocketDisconnect:
        stop_idle_ticker()
        print("Client disconnected")

    except Exception as e:
        stop_idle_ticker()
        await ws.send_json({
            "type": "error",
            "message": str(e),
            "line": getattr(e, "lineno", None)
        })

# ===============================
# Frontend (mount last!)
# ===============================
BASE_DIR = Path(__file__).resolve().parent          # project/backend
FRONTEND_DIR = BASE_DIR.parent / "frontend"         # project/frontend

app.mount(
    "/",
    StaticFiles(directory=FRONTEND_DIR, html=True),
    name="frontend"
)
