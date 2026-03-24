from datetime import date, timedelta
from app.services.supabase_client import supabase


# ── Core streak calculator ─────────────────────────────────────────────────────

async def recalculate_streak(loop_id: str) -> dict:
    """
    Recalculates current streak, best streak, and total checkins
    for a given loop from scratch using all stored checkin dates.

    Algorithm:
    - Fetch all checkin dates for this loop, sorted descending.
    - Walk backwards from today checking for consecutive days.
    - A streak breaks if there's a gap of more than 1 day.
    - Also computes the all-time best streak across all history.

    Returns:
        {
            "current_streak": int,
            "best_streak": int,
            "total_checkins": int,
            "last_checkin_date": str | None,
        }
    """
    res = (
        supabase.table("checkins")
        .select("date")
        .eq("loop_id", loop_id)
        .eq("completed", True)
        .order("date", desc=False)
        .execute()
    )

    if not res.data:
        return {
            "current_streak": 0,
            "best_streak": 0,
            "total_checkins": 0,
            "last_checkin_date": None,
        }

    # Parse all checkin dates into a sorted set (ascending)
    checkin_dates = sorted(
        set(date.fromisoformat(row["date"]) for row in res.data)
    )
    total_checkins = len(checkin_dates)
    last_checkin_date = checkin_dates[-1]

    # ── Best streak (scan entire history) ─────────────────────────────────────
    best_streak = _calculate_best_streak(checkin_dates)

    # ── Current streak (walk back from today) ─────────────────────────────────
    current_streak = _calculate_current_streak(checkin_dates)

    return {
        "current_streak": current_streak,
        "best_streak": max(best_streak, current_streak),
        "total_checkins": total_checkins,
        "last_checkin_date": str(last_checkin_date),
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _calculate_current_streak(checkin_dates: list[date]) -> int:
    """
    Walk backwards from today.
    Count consecutive days that have a checkin.

    Rules:
    - If last checkin is today → start counting back.
    - If last checkin is yesterday → still active, count back.
    - If last checkin is 2+ days ago → streak is broken = 0.
    """
    if not checkin_dates:
        return 0

    today = date.today()
    date_set = set(checkin_dates)
    last = checkin_dates[-1]

    # Streak is dead if last checkin was more than 1 day ago
    if (today - last).days > 1:
        return 0

    streak = 0
    cursor = today

    while cursor in date_set:
        streak += 1
        cursor -= timedelta(days=1)

    # If today has no checkin yet but yesterday does, streak is still alive
    if today not in date_set and (today - timedelta(days=1)) in date_set:
        cursor = today - timedelta(days=1)
        streak = 0
        while cursor in date_set:
            streak += 1
            cursor -= timedelta(days=1)

    return streak


def _calculate_best_streak(checkin_dates: list[date]) -> int:
    """
    Scan the full sorted checkin history and find the longest
    consecutive-day run ever achieved.
    """
    if not checkin_dates:
        return 0

    best = 1
    current = 1

    for i in range(1, len(checkin_dates)):
        diff = (checkin_dates[i] - checkin_dates[i - 1]).days

        if diff == 1:
            # Consecutive day — extend current run
            current += 1
            best = max(best, current)
        elif diff > 1:
            # Gap found — reset current run
            current = 1

    return best


# ── Bulk recalculate (admin / repair utility) ──────────────────────────────────

async def recalculate_all_streaks_for_user(user_id: str) -> list[dict]:
    """
    Recalculates streaks for every loop belonging to a user.
    Useful for data repair or after bulk imports.

    Returns a list of update results per loop.
    """
    loops_res = (
        supabase.table("loops")
        .select("id")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .execute()
    )

    results = []
    for loop in (loops_res.data or []):
        loop_id = loop["id"]
        streak_data = await recalculate_streak(loop_id)

        supabase.table("loops").update({
            "current_streak": streak_data["current_streak"],
            "best_streak": streak_data["best_streak"],
            "total_checkins": streak_data["total_checkins"],
            "last_checkin_date": streak_data["last_checkin_date"],
        }).eq("id", loop_id).execute()

        results.append({"loop_id": loop_id, **streak_data})

    return results


# ── Streak status label (used in frontend badges) ─────────────────────────────

def get_streak_label(current_streak: int) -> str:
    """
    Returns a display label based on streak count.
    Used for badge text in the UI.
    """
    if current_streak == 0:
        return "Not started"
    elif current_streak < 3:
        return "Getting started"
    elif current_streak < 7:
        return "Building momentum"
    elif current_streak < 14:
        return "On fire"
    elif current_streak < 30:
        return "Unstoppable"
    elif current_streak < 100:
        return "Legend"
    else:
        return "Mythic"