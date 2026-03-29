# auth.py - User authentication with email verification
import sqlite3
import hashlib
import secrets
import os
import re
import time
from pathlib import Path
from email_service import (
    send_verification_email,
    send_welcome_email,
    send_password_reset_email,
)

DB_PATH = Path(__file__).parent / "codexfarm.db"


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
            email TEXT,
            email_verified INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            gold INTEGER DEFAULT 500,
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            best_roi REAL DEFAULT 0.0,
            completed_missions TEXT DEFAULT '[]',
            unlocked_achievements TEXT DEFAULT '[]',
            planted_crop_types TEXT DEFAULT '[]',
            active_mission_idx INTEGER DEFAULT 0,
            total_harvests INTEGER DEFAULT 0,
            total_scripts_run INTEGER DEFAULT 0,
            is_premium INTEGER DEFAULT 0
        )
    """)
    # Migrations for existing databases
    for col, default in [
        ("is_premium", "INTEGER DEFAULT 0"),
        ("email", "TEXT"),
        ("email_verified", "INTEGER DEFAULT 0"),
    ]:
        try:
            conn.execute(f"ALTER TABLE users ADD COLUMN {col} {default}")
            conn.commit()
        except Exception:
            pass

    conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS email_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            code TEXT NOT NULL,
            created_at REAL NOT NULL,
            expires_at REAL NOT NULL,
            used INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS password_resets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            code TEXT NOT NULL,
            created_at REAL NOT NULL,
            expires_at REAL NOT NULL,
            used INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    conn.commit()
    conn.close()


def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((password + salt).encode()).hexdigest()


def _generate_code() -> str:
    """Generate a 6-digit verification code."""
    return f"{secrets.randbelow(1000000):06d}"


def _is_valid_email(email: str) -> bool:
    """Basic email format validation."""
    return bool(re.match(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$', email))


def register(username: str, password: str, email: str = "") -> dict:
    """Register a new user. Requires email verification before login."""
    if not username or len(username) < 2 or len(username) > 20:
        return {"success": False, "message": "Username must be 2-20 characters"}
    if not password or len(password) < 4:
        return {"success": False, "message": "Password must be at least 4 characters"}
    if not all(c.isalnum() or c == '_' for c in username):
        return {"success": False, "message": "Username can only contain letters, numbers, and underscores"}
    if not email or not _is_valid_email(email):
        return {"success": False, "message": "A valid email address is required"}

    salt = secrets.token_hex(16)
    pw_hash = hash_password(password, salt)

    conn = get_db()
    try:
        # Check email uniqueness
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            return {"success": False, "message": "Email already registered"}

        conn.execute(
            "INSERT INTO users (username, password_hash, salt, email, email_verified) VALUES (?, ?, ?, ?, 0)",
            (username, pw_hash, salt, email)
        )
        conn.commit()
        user_id = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()["id"]

        # Generate verification code
        code = _generate_code()
        now = time.time()
        conn.execute(
            "INSERT INTO email_verifications (user_id, code, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (user_id, code, now, now + 900)  # 15 minutes
        )
        conn.commit()

        # Send verification email
        send_verification_email(email, username, code)

        return {
            "success": True,
            "message": "Verification code sent to your email",
            "pending_verification": True,
            "username": username,
        }
    except sqlite3.IntegrityError:
        return {"success": False, "message": "Username already taken"}
    finally:
        conn.close()


def verify_email(username: str, code: str) -> dict:
    """Verify email with code. On success, create session and send welcome email."""
    if not username or not code:
        return {"success": False, "message": "Username and code are required"}

    conn = get_db()
    try:
        user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if not user:
            return {"success": False, "message": "User not found"}

        if user["email_verified"]:
            return {"success": False, "message": "Email already verified. Please log in."}

        now = time.time()
        row = conn.execute("""
            SELECT * FROM email_verifications
            WHERE user_id = ? AND code = ? AND used = 0 AND expires_at > ?
            ORDER BY created_at DESC LIMIT 1
        """, (user["id"], code.strip(), now)).fetchone()

        if not row:
            return {"success": False, "message": "Invalid or expired verification code"}

        # Mark code as used, set email_verified
        conn.execute("UPDATE email_verifications SET used = 1 WHERE id = ?", (row["id"],))
        conn.execute("UPDATE users SET email_verified = 1 WHERE id = ?", (user["id"],))

        # Create session
        token = secrets.token_hex(32)
        conn.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user["id"]))
        conn.commit()

        # Send welcome email
        send_welcome_email(user["email"], username)

        return {"success": True, "message": "Email verified!", "token": token, "username": username}
    finally:
        conn.close()


def resend_verification(username: str) -> dict:
    """Resend verification code to the user's email."""
    if not username:
        return {"success": False, "message": "Username is required"}

    conn = get_db()
    try:
        user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if not user:
            return {"success": False, "message": "User not found"}
        if user["email_verified"]:
            return {"success": False, "message": "Email already verified"}
        if not user["email"]:
            return {"success": False, "message": "No email on file"}

        # Rate limit: check last code was at least 60s ago
        now = time.time()
        last = conn.execute(
            "SELECT created_at FROM email_verifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
            (user["id"],)
        ).fetchone()
        if last and now - last["created_at"] < 60:
            return {"success": False, "message": "Please wait 60 seconds before requesting another code"}

        code = _generate_code()
        conn.execute(
            "INSERT INTO email_verifications (user_id, code, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (user["id"], code, now, now + 900)
        )
        conn.commit()
        send_verification_email(user["email"], username, code)
        return {"success": True, "message": "New verification code sent"}
    finally:
        conn.close()


def request_password_reset(username_or_email: str) -> dict:
    """Send a password reset code to the user's email."""
    if not username_or_email:
        return {"success": False, "message": "Username or email is required"}

    conn = get_db()
    try:
        user = conn.execute(
            "SELECT * FROM users WHERE username = ? OR email = ?",
            (username_or_email, username_or_email)
        ).fetchone()
        if not user:
            # Don't reveal whether user exists
            return {"success": True, "message": "If the account exists, a reset code has been sent"}
        if not user["email"]:
            return {"success": False, "message": "No email on file for this account"}

        # Rate limit
        now = time.time()
        last = conn.execute(
            "SELECT created_at FROM password_resets WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
            (user["id"],)
        ).fetchone()
        if last and now - last["created_at"] < 60:
            return {"success": True, "message": "If the account exists, a reset code has been sent"}

        code = _generate_code()
        conn.execute(
            "INSERT INTO password_resets (user_id, code, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (user["id"], code, now, now + 900)
        )
        conn.commit()
        send_password_reset_email(user["email"], user["username"], code)
        return {"success": True, "message": "If the account exists, a reset code has been sent"}
    finally:
        conn.close()


def reset_password(username: str, code: str, new_password: str) -> dict:
    """Reset password using verification code."""
    if not username or not code or not new_password:
        return {"success": False, "message": "All fields are required"}
    if len(new_password) < 4:
        return {"success": False, "message": "Password must be at least 4 characters"}

    conn = get_db()
    try:
        user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if not user:
            return {"success": False, "message": "Invalid username or code"}

        now = time.time()
        row = conn.execute("""
            SELECT * FROM password_resets
            WHERE user_id = ? AND code = ? AND used = 0 AND expires_at > ?
            ORDER BY created_at DESC LIMIT 1
        """, (user["id"], code.strip(), now)).fetchone()

        if not row:
            return {"success": False, "message": "Invalid or expired reset code"}

        # Update password
        salt = secrets.token_hex(16)
        pw_hash = hash_password(new_password, salt)
        conn.execute("UPDATE password_resets SET used = 1 WHERE id = ?", (row["id"],))
        conn.execute("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?", (pw_hash, salt, user["id"]))
        conn.commit()
        return {"success": True, "message": "Password reset successfully. Please log in."}
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

        # Check if email verification is pending
        if user["email"] and not user["email_verified"]:
            return {
                "success": False,
                "message": "Please verify your email first",
                "pending_verification": True,
                "username": username,
            }

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


def get_user_email(user_id: int) -> str | None:
    """Get email for a user by ID."""
    conn = get_db()
    try:
        row = conn.execute("SELECT email, username FROM users WHERE id = ?", (user_id,)).fetchone()
        if row:
            return row["email"], row["username"]
        return None, None
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
        "username": user["username"],
        "total_harvests": user.get("total_harvests", 0),
        "total_scripts_run": user.get("total_scripts_run", 0),
        "is_premium": bool(user.get("is_premium", 0)),
    }


def logout(token: str):
    """Remove session."""
    conn = get_db()
    try:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
    finally:
        conn.close()


def upgrade_to_premium(user_id: int):
    """Set a user's account to premium."""
    conn = get_db()
    try:
        conn.execute("UPDATE users SET is_premium = 1 WHERE id = ?", (user_id,))
        conn.commit()
    finally:
        conn.close()


# Initialize DB on import
init_db()
