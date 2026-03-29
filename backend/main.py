from time import time
from farm import Farm, LEVELS, GOLD_INITIAL
from executor import Executor
from storage import load_user_farm
from auth import register, login, get_user_by_token, save_user_progress, load_user_progress, logout, upgrade_to_premium
from pydantic import BaseModel
import os
from pathlib import Path

# Load .env file if present
_env_path = Path(__file__).parent / ".env"
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
import ast
import asyncio
import re

app = FastAPI()


def friendly_error(e):
    """Translate Python errors into beginner-friendly messages."""
    msg = str(e)
    lineno = getattr(e, 'lineno', None)

    # --- SyntaxError from ast.parse ---
    if isinstance(e, SyntaxError):
        lineno = e.lineno
        raw = e.msg if hasattr(e, 'msg') else msg

        if 'unexpected indent' in raw:
            return lineno, (
                f"Line {lineno}: Indentation error — this line is indented too far.\n"
                "Hint: Make sure lines inside `if`, `for`, or `while` blocks are "
                "indented the same amount (usually 4 spaces). Lines that are NOT "
                "inside a block should start at the very beginning of the line."
            )
        if 'expected an indented block' in raw:
            return lineno, (
                f"Line {lineno}: Missing indented block — Python expects indented code here.\n"
                "Hint: After `if`, `for`, `while`, or `def`, the next line must be "
                "indented (use 4 spaces). For example:\n"
                "  if True:\n"
                "      plant(\"wheat\", 0, 0)"
            )
        if 'unindent does not match' in raw:
            return lineno, (
                f"Line {lineno}: Indentation mismatch — the spaces at the start of this line "
                "don't match the surrounding code.\n"
                "Hint: Make sure you use the same number of spaces for all lines in the same block."
            )
        if 'invalid syntax' in raw:
            return lineno, (
                f"Line {lineno}: Invalid syntax — Python can't understand this line.\n"
                "Hint: Common causes:\n"
                "  • Missing colon (:) after `if`, `for`, `while`, or `def`\n"
                "  • Mismatched parentheses or quotes\n"
                "  • Typo in a keyword (e.g., `iff` instead of `if`)"
            )
        if 'EOL while scanning string' in raw or 'unterminated string' in raw:
            return lineno, (
                f"Line {lineno}: Unterminated string — you started a string but didn't close it.\n"
                "Hint: Every opening quote (\", ') needs a matching closing quote.\n"
                "  Correct:   plant(\"wheat\", 0, 0)\n"
                "  Wrong:     plant(\"wheat, 0, 0)"
            )
        if 'unexpected EOF' in raw or 'unexpected end of' in raw:
            return lineno, (
                f"Line {lineno}: Unexpected end of code — something is incomplete.\n"
                "Hint: Check for:\n"
                "  • Unclosed parentheses: plant(\"wheat\", 0, 0  ← missing )\n"
                "  • An `if`/`for`/`while` with no body below it"
            )
        if "'return' outside function" in raw:
            return lineno, (
                f"Line {lineno}: 'return' can only be used inside a function.\n"
                "Hint: You can only use `return` inside a `def` block."
            )
        # Generic SyntaxError fallback
        return lineno, (
            f"Line {lineno}: Syntax error — {raw}\n"
            "Hint: Check for typos, missing colons, or mismatched parentheses."
        )

    # --- ScriptError from executor (already has lineno) ---
    if hasattr(e, 'lineno') and hasattr(e, 'message'):
        raw = e.message
        line = e.lineno

        # Undefined variable
        m = re.search(r"Undefined variable: '(\w+)'", raw)
        if m:
            var_name = m.group(1)
            return line, (
                f"Line {line}: Variable '{var_name}' doesn't exist yet.\n"
                "Hint: You need to create a variable before you can use it. For example:\n"
                f"  {var_name} = 0   # create the variable first\n"
                f"  print({var_name})  # now you can use it"
            )

        # Unknown function
        m = re.search(r"Unknown function: (\w+)", raw)
        if m:
            func_name = m.group(1)
            return line, (
                f"Line {line}: Unknown function '{func_name}'.\n"
                "Hint: Check the spelling. Available farm functions include:\n"
                "  plant(), water(), harvest(), sell(), wait(), print(), etc.\n"
                "Click '📖 Crops' to see all available functions."
            )

        # Division by zero
        if 'Division by zero' in raw or 'Modulo by zero' in raw:
            return line, (
                f"Line {line}: Division by zero — you can't divide a number by 0.\n"
                "Hint: Check the value of your divisor before dividing."
            )

        # Unsupported syntax
        if 'Unsupported syntax' in raw:
            return line, (
                f"Line {line}: This type of code is not supported in Code ✖ Farm.\n"
                "Hint: The farm script supports: variables, if/else, for/while loops, "
                "functions, and the built-in farm commands."
            )

        # Exceeded max steps
        if 'maximum execution steps' in raw:
            return line, (
                f"Line {line}: Your script ran too many steps and was stopped.\n"
                "Hint: Check if you have an infinite loop. Make sure your `while` condition "
                "eventually becomes False, or use `break` to exit the loop."
            )

        # While loop exceeded iterations
        if 'While loop exceeded' in raw:
            return line, (
                f"Line {line}: Your while loop ran too many times and was stopped.\n"
                "Hint: Make sure your while loop condition will eventually become False. "
                "For example, if you use `while i < 10`, make sure `i` increases inside the loop."
            )

        # Return original executor message for other ScriptErrors
        return line, raw

    # --- Fallback for any other error ---
    return lineno, msg

class AuthRequest(BaseModel):
    username: str
    password: str

class TokenRequest(BaseModel):
    token: str

class CheckoutRequest(BaseModel):
    token: str
    return_url: str = ""

class SaveRequest(BaseModel):
    token: str = ""
    save: dict = {}

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
        new_achievements = farm.check_achievements(
            called_functions=called_functions,
            code_text=code_text,
        )

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

            try:
                # ==============================
                # START SCRIPT
                # ==============================
                if msg["type"] == "start":
                    stop_idle_ticker()

                    # Reset time (but keep gold)
                    farm.time = 0

                    # Reset grid for fresh script run
                    for y in range(farm.grid_size):
                        for x in range(farm.grid_size):
                            farm.grid[y][x] = farm._empty_cell()
                    farm.pests.clear()

                    # ---- reset script execution stats ----
                    farm.script_cost = 0
                    farm.script_gain = 0

                    # ---- reset per-script tracking ----
                    farm.pest_removed_count = 0
                    farm.market_sell_gain = 0

                    # ---- reset action history ----
                    farm.has_planted = False
                    farm.has_watered = False
                    farm.has_harvested = False
                    farm.max_planted_in_row0 = 0
                    farm.harvested_in_winter = False

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
                        elif isinstance(ev, dict) and "type" in ev:
                            await ws.send_json({
                                "type": "event",
                                "event": ev
                            })
                            await ws.send_json({
                                "type": "farm_state",
                                "farm": farm.snapshot()
                            })
                        else:
                            # Non-event return (e.g. standalone get_gold())
                            # Skip sending as event, continue
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

                            # Only send dict events with proper structure
                            if isinstance(ev, dict) and "type" in ev:
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
                    elif isinstance(ev, dict) and "type" in ev:
                        await ws.send_json({
                            "type": "event",
                            "event": ev
                        })
                        await ws.send_json({
                            "type": "farm_state",
                            "farm": farm.snapshot()
                        })
                    else:
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
                    await ws.send_json({"type": "done", "farm": farm.snapshot()})

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
                        farm.pest_removed_count = save.get("pest_removed_count", 0)
                        farm.market_sell_gain = save.get("market_sell_gain", 0)
                    await ws.send_json({
                        "type": "farm_state",
                        "farm": farm.snapshot()
                    })

            except Exception as e:
                # Error within a single message handler - send error but keep connection alive
                executor = None
                try:
                    line, message = friendly_error(e)
                    await ws.send_json({
                        "type": "error",
                        "message": message,
                        "line": line
                    })
                except Exception:
                    pass

    except WebSocketDisconnect:
        stop_idle_ticker()
        print("Client disconnected")

    except Exception as e:
        stop_idle_ticker()
        print(f"WebSocket fatal error: {e}")

# ===============================
# Auth & Progress API
# ===============================

@app.post("/api/register")
async def api_register(req: AuthRequest):
    return register(req.username, req.password)

@app.post("/api/login")
async def api_login(req: AuthRequest):
    return login(req.username, req.password)

@app.post("/api/logout")
async def api_logout(req: TokenRequest):
    logout(req.token)
    return {"success": True}

@app.post("/api/save")
async def api_save(req: SaveRequest):
    if req.token:
        result = save_user_progress(req.token, req.save)
        if not result:
            return {"success": False, "message": "Invalid token or save failed"}
    return {"success": True}

@app.get("/api/load")
async def api_load(token: str = ""):
    if token:
        data = load_user_progress(token)
        if data:
            return {"success": True, "save": data}
    return {"success": False}

@app.get("/api/profile")
async def api_profile(token: str = ""):
    if token:
        user = get_user_by_token(token)
        if user:
            return {
                "success": True,
                "username": user["username"],
                "total_harvests": user.get("total_harvests", 0),
                "total_scripts_run": user.get("total_scripts_run", 0),
            }
    return {"success": False}

# ===============================
# Premium & Stripe API
# ===============================

@app.get("/api/premium-status")
async def api_premium_status(token: str = ""):
    if token:
        user = get_user_by_token(token)
        if user:
            is_premium = bool(user.get("is_premium", 0))
            return {"success": True, "is_premium": is_premium}
    return {"success": False, "is_premium": False}

@app.post("/api/create-checkout-session")
async def api_create_checkout(req: CheckoutRequest):
    stripe_key = os.environ.get("STRIPE_SECRET_KEY", "")
    if not stripe_key:
        return {"success": False, "message": "Payment system not configured"}
    user = get_user_by_token(req.token)
    if not user:
        return {"success": False, "message": "Please log in first"}
    if user.get("is_premium", 0):
        return {"success": False, "message": "Already premium"}
    try:
        import stripe
        stripe.api_key = stripe_key
        base_url = req.return_url or "http://localhost:8080"
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": "Code ✖ Farm Premium - Unlock All 25 Missions"},
                    "unit_amount": 990,
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=base_url + "?payment=success",
            cancel_url=base_url + "?payment=cancelled",
            metadata={"user_id": str(user["id"])},
        )
        return {"success": True, "url": session.url}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.post("/api/stripe-webhook")
async def stripe_webhook(request: Request):
    stripe_key = os.environ.get("STRIPE_SECRET_KEY", "")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    if not stripe_key:
        return {"received": False}
    try:
        import stripe
        import json as json_module
        stripe.api_key = stripe_key
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature", "")
        if webhook_secret and sig_header:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            event = json_module.loads(payload)
        if event.get("type") == "checkout.session.completed":
            session_data = event["data"]["object"]
            user_id = int(session_data["metadata"]["user_id"])
            upgrade_to_premium(user_id)
    except Exception as e:
        print(f"Stripe webhook error: {e}")
    return {"received": True}

@app.get("/api/stripe-key")
async def api_stripe_key():
    return {"key": os.environ.get("STRIPE_PUBLISHABLE_KEY", "")}

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
