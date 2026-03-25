# auth.py - Simple user authentication with SQLite
import sqlite3
import hashlib
import secrets
import os
from pathlib import Path

DB_PATH = Path(__file__).parent / "cyberfarm.db"

def get_db():
    """Get SQLite connection with row factory."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database tables."""
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            gold INTEGER DEFAULT 500,
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            best_roi REAL DEFAULT 0.0,
            completed_missions TEXT DEFAULT '[]',
            unlocked_achievements TEXT DEFAULT '[]',
            planted_crop_types TEXT DEFAULT '[]',
            active_mission_idx INTEGER DEFAULT 0,
            experienced_seasons TEXT DEFAULT '[]',
            total_harvests INTEGER DEFAULT 0,
            total_scripts_run INTEGER DEFAULT 0
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    conn.commit()
    conn.close()

def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((password + salt).encode()).hexdigest()

def register(username: str, password: str) -> dict:
    """Register a new user. Returns {success, message, token?}"""
    if not username or len(username) < 2 or len(username) > 20:
        return {"success": False, "message": "Username must be 2-20 characters"}
    if not password or len(password) < 4:
        return {"success": False, "message": "Password must be at least 4 characters"}
    # Only allow alphanumeric and underscore
    if not all(c.isalnum() or c == '_' for c in username):
        return {"success": False, "message": "Username can only contain letters, numbers, and underscores"}

    salt = secrets.token_hex(16)
    pw_hash = hash_password(password, salt)

    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)",
            (username, pw_hash, salt)
        )
        conn.commit()
        user_id = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()["id"]
        token = secrets.token_hex(32)
        conn.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user_id))
        conn.commit()
        return {"success": True, "message": "Registration successful", "token": token, "username": username}
    except sqlite3.IntegrityError:
        return {"success": False, "message": "Username already taken"}
    finally:
        conn.close()

def login(username: str, password: str) -> dict:
    """Login user. Returns {success, message, token?}"""
    conn = get_db()
    try:
        user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if not user:
            return {"success": False, "message": "Invalid username or password"}
        pw_hash = hash_password(password, user["salt"])
        if pw_hash != user["password_hash"]:
            return {"success": False, "message": "Invalid username or password"}
        token = secrets.token_hex(32)
        conn.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user["id"]))
        conn.commit()
        return {"success": True, "message": "Login successful", "token": token, "username": username}
    finally:
        conn.close()

def get_user_by_token(token: str) -> dict | None:
    """Get user data from session token."""
    if not token:
        return None
    conn = get_db()
    try:
        row = conn.execute("""
            SELECT u.* FROM users u
            JOIN sessions s ON u.id = s.user_id
            WHERE s.token = ?
        """, (token,)).fetchone()
        if row:
            return dict(row)
        return None
    finally:
        conn.close()

def save_user_progress(token: str, save_data: dict):
    """Save user game progress."""
    user = get_user_by_token(token)
    if not user:
        return False
    conn = get_db()
    try:
        import json
        conn.execute("""
            UPDATE users SET
                gold = ?,
                xp = ?,
                level = ?,
                best_roi = ?,
                completed_missions = ?,
                unlocked_achievements = ?,
                planted_crop_types = ?,
                active_mission_idx = ?,
                experienced_seasons = ?,
                total_harvests = COALESCE(total_harvests, 0) + ?,
                total_scripts_run = COALESCE(total_scripts_run, 0) + 1
            WHERE id = ?
        """, (
            save_data.get("gold", 500),
            save_data.get("xp", 0),
            save_data.get("level", 1),
            save_data.get("best_roi", 0.0),
            json.dumps(save_data.get("completed_missions", [])),
            json.dumps(save_data.get("unlocked_achievements", [])),
            json.dumps(save_data.get("planted_crop_types", [])),
            save_data.get("active_mission_idx", 0),
            json.dumps(save_data.get("experienced_seasons", [])),
            save_data.get("harvests_this_run", 0),
            user["id"]
        ))
        conn.commit()
        return True
    finally:
        conn.close()

def load_user_progress(token: str) -> dict | None:
    """Load user game progress."""
    user = get_user_by_token(token)
    if not user:
        return None
    import json
    return {
        "gold": user["gold"],
        "xp": user["xp"],
        "level": user["level"],
        "best_roi": user["best_roi"],
        "completed_missions": json.loads(user["completed_missions"] or "[]"),
        "unlocked_achievements": json.loads(user["unlocked_achievements"] or "[]"),
        "planted_crop_types": json.loads(user["planted_crop_types"] or "[]"),
        "active_mission_idx": user["active_mission_idx"],
        "experienced_seasons": json.loads(user.get("experienced_seasons", "[]") if user.get("experienced_seasons") else "[]"),
        "username": user["username"],
        "total_harvests": user.get("total_harvests", 0),
        "total_scripts_run": user.get("total_scripts_run", 0),
    }

def logout(token: str):
    """Remove session."""
    conn = get_db()
    try:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
    finally:
        conn.close()

# Initialize DB on import
init_db()
