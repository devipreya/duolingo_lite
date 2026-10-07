"""Game rules: hearts regeneration, streak, XP."""
from datetime import date, datetime, timedelta

from fastapi import Request

MAX_HEARTS = 5
REGEN = timedelta(minutes=30)
XP_LESSON, XP_PERFECT = 10, 5


def today_of(request: Request) -> date:
    """Real date, or simulated via X-Debug-Date: YYYY-MM-DD (for testing streaks)."""
    raw = request.headers.get("x-debug-date")
    try:
        return date.fromisoformat(raw) if raw else date.today()
    except ValueError:
        return date.today()


def regen_hearts(u) -> None:
    now = datetime.utcnow()
    if u.hearts >= MAX_HEARTS:
        u.hearts_at = now
        return
    gained = int((now - u.hearts_at) // REGEN)
    if gained:
        u.hearts = min(MAX_HEARTS, u.hearts + gained)
        u.hearts_at = now if u.hearts >= MAX_HEARTS else u.hearts_at + gained * REGEN


def lose_heart(u) -> None:
    if u.hearts >= MAX_HEARTS:
        u.hearts_at = datetime.utcnow()
    u.hearts = max(0, u.hearts - 1)


def streak_now(u, today: date) -> int:
    if u.last_active is None or (today - u.last_active).days > 1:
        return 0
    return u.streak


def touch_streak(u, today: date) -> bool:
    if u.last_active == today:
        return False
    u.streak = u.streak + 1 if u.last_active and (today - u.last_active).days == 1 else 1
    u.last_active = today
    return True


def add_xp(u, amount: int, today: date) -> None:
    if u.xp_today_date != today:
        u.xp_today, u.xp_today_date = 0, today
    u.xp += amount
    u.xp_today += amount


def summary(u, today: date) -> dict:
    nxt = None
    if u.hearts < MAX_HEARTS:
        nxt = max(0, int((u.hearts_at + REGEN - datetime.utcnow()).total_seconds()))
    return {
        "name": u.name, "xp": u.xp, "streak": streak_now(u, today),
        "active_today": u.last_active == today, "hearts": u.hearts, "gems": u.gems,
        "daily_goal": u.daily_goal, "seconds_to_next_heart": nxt,
        "xp_today": u.xp_today if u.xp_today_date == today else 0,
    }
