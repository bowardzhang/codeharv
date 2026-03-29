# email_service.py - Email sending for Code X Farm
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def _get_smtp_config():
    return {
        "host": os.environ.get("SMTP_HOST", ""),
        "port": int(os.environ.get("SMTP_PORT", "587")),
        "user": os.environ.get("SMTP_USER", ""),
        "password": os.environ.get("SMTP_PASSWORD", ""),
        "from_email": os.environ.get("SMTP_FROM_EMAIL", ""),
    }


def _send_email(to: str, subject: str, html_body: str) -> bool:
    """Send an email via SMTP. Returns True on success."""
    cfg = _get_smtp_config()
    if not cfg["host"] or not cfg["user"]:
        print(f"[email] SMTP not configured. Would send to={to} subject={subject}")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = cfg["from_email"] or cfg["user"]
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html"))

    try:
        if cfg["port"] == 465:
            server = smtplib.SMTP_SSL(cfg["host"], cfg["port"], timeout=10)
        else:
            server = smtplib.SMTP(cfg["host"], cfg["port"], timeout=10)
            server.starttls()
        server.login(cfg["user"], cfg["password"])
        server.sendmail(msg["From"], [to], msg.as_string())
        server.quit()
        print(f"[email] Sent to {to}: {subject}")
        return True
    except Exception as e:
        print(f"[email] Failed to send to {to}: {e}")
        return False


def send_verification_email(to: str, username: str, code: str) -> bool:
    """Send email verification code."""
    subject = "Code X Farm - Verify your email"
    html = f"""
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <div style="text-align:center;margin-bottom:20px;">
        <span style="font-size:36px;">🌱</span>
        <h2 style="color:#7CB342;margin:8px 0 0;">Code &#10006; Farm</h2>
      </div>
      <p>Hi <b>{username}</b>,</p>
      <p>Thank you for registering! Please verify your email with this code:</p>
      <div style="text-align:center;margin:24px 0;">
        <span style="font-size:32px;font-weight:800;letter-spacing:8px;background:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:12px 24px;color:#166534;">{code}</span>
      </div>
      <p style="color:#64748b;font-size:13px;">This code expires in 15 minutes. If you didn't register, you can ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
      <p style="color:#94a3b8;font-size:12px;text-align:center;">Code &#10006; Farm - Learn Python by farming</p>
    </div>
    """
    return _send_email(to, subject, html)


def send_welcome_email(to: str, username: str) -> bool:
    """Send welcome email after successful verification."""
    subject = "Welcome to Code X Farm! 🌱"
    html = f"""
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <div style="text-align:center;margin-bottom:20px;">
        <span style="font-size:36px;">🌱</span>
        <h2 style="color:#7CB342;margin:8px 0 0;">Welcome to Code &#10006; Farm!</h2>
      </div>
      <p>Hi <b>{username}</b>,</p>
      <p>Your email has been verified and your account is ready! Here's what you can do:</p>
      <ul style="line-height:1.8;">
        <li>Write Python scripts to control your farm</li>
        <li>Complete 25 progressive missions to learn Python</li>
        <li>Level up and unlock achievements</li>
        <li>Your progress is saved to the cloud automatically</li>
      </ul>
      <p>Happy farming — and happy coding! 🐍</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
      <p style="color:#94a3b8;font-size:12px;text-align:center;">Code &#10006; Farm - Learn Python by farming</p>
    </div>
    """
    return _send_email(to, subject, html)


def send_password_reset_email(to: str, username: str, code: str) -> bool:
    """Send password reset code."""
    subject = "Code X Farm - Password Reset"
    html = f"""
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <div style="text-align:center;margin-bottom:20px;">
        <span style="font-size:36px;">🔑</span>
        <h2 style="color:#7CB342;margin:8px 0 0;">Password Reset</h2>
      </div>
      <p>Hi <b>{username}</b>,</p>
      <p>You requested a password reset. Use this code:</p>
      <div style="text-align:center;margin:24px 0;">
        <span style="font-size:32px;font-weight:800;letter-spacing:8px;background:#fef3c7;border:2px solid #f59e0b;border-radius:12px;padding:12px 24px;color:#92400e;">{code}</span>
      </div>
      <p style="color:#64748b;font-size:13px;">This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
      <p style="color:#94a3b8;font-size:12px;text-align:center;">Code &#10006; Farm - Learn Python by farming</p>
    </div>
    """
    return _send_email(to, subject, html)


def send_payment_confirmation_email(to: str, username: str) -> bool:
    """Send premium upgrade confirmation."""
    subject = "Code X Farm - Premium Activated! ⭐"
    html = f"""
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <div style="text-align:center;margin-bottom:20px;">
        <span style="font-size:36px;">⭐</span>
        <h2 style="color:#f59e0b;margin:8px 0 0;">Premium Activated!</h2>
      </div>
      <p>Hi <b>{username}</b>,</p>
      <p>Thank you for upgrading to Premium! You now have access to:</p>
      <ul style="line-height:1.8;">
        <li>All 25 missions (including 20 premium missions)</li>
        <li>Advanced Python concepts</li>
        <li>Market trading missions</li>
        <li>Pest control challenges</li>
        <li>Algorithm optimization tasks</li>
      </ul>
      <p><b>Payment: $9.90 (one-time)</b></p>
      <p>Happy farming! 🌾</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
      <p style="color:#94a3b8;font-size:12px;text-align:center;">Code &#10006; Farm - Learn Python by farming</p>
    </div>
    """
    return _send_email(to, subject, html)
