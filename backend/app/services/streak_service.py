from datetime import date, timedelta
from app.services.supabase_client import supabase


def get_server_today() -> date:
    return date.today()


def _empty_streak_payload() -> dict:
    return {
        "current_streak": 0,
        "best_streak": 0,
        "total_checkins": 0,
        "last_checkin_date": None,
    }


def _parse_date(value):
    if value is None:
        return None

    if isinstance(value, date):
        return value

    if isinstance(value, str):
        try:
            return date.fromisoformat(value)
        except ValueError:
            return None

    return None


def _calculate_current_streak(checkin_dates: list[date], today: date | None = None) -> int:
    if not checkin_dates:
        return 0

    active_today = today or get_server_today()
    unique_dates = sorted(set(checkin_dates))
    date_set = set(unique_dates)
    last_checkin = unique_dates[-1]
    gap = (active_today - last_checkin).days

    if gap > 1:
        return 0

    cursor = active_today if active_today in date_set else active_today - timedelta(days=1)
    streak = 0

    while cursor in date_set:
        streak += 1
        cursor -= timedelta(days=1)

    return streak


def _calculate_best_streak(checkin_dates: list[date]) -> int:
    if not checkin_dates:
        return 0

    unique_dates = sorted(set(checkin_dates))
    best = 1
    current = 1

    for index in range(1, len(unique_dates)):
        diff = (unique_dates[index] - unique_dates[index - 1]).days

        if diff == 1:
            current += 1
            best = max(best, current)
        elif diff > 1:
            current = 1

    return best


def calculate_streaks_from_dates(checkin_dates: list[date], today: date | None = None) -> dict:
    if not checkin_dates:
        return _empty_streak_payload()

    unique_dates = sorted(set(checkin_dates))
    last_checkin_date = unique_dates[-1]
    best_streak = _calculate_best_streak(unique_dates)
    current_streak = _calculate_current_streak(unique_dates, today=today)

    return {
        "current_streak": current_streak,
        "best_streak": max(best_streak, current_streak),
        "total_checkins": len(unique_dates),
        "last_checkin_date": str(last_checkin_date),
    }


async def recalculate_streak(loop_id: str) -> dict:
    """
    Recalculate the streak for a single loop from stored completed check-ins.
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
        return _empty_streak_payload()

    checkin_dates = [date.fromisoformat(row["date"]) for row in res.data]
    return calculate_streaks_from_dates(checkin_dates, today=get_server_today())


def get_live_loop_current_streak(loop: dict, today: date | None = None) -> int:
    current_streak = int(loop.get("current_streak") or 0)

    if current_streak <= 0:
        return 0

    last_checkin_date = _parse_date(loop.get("last_checkin_date"))
    if not last_checkin_date:
        return 0

    active_today = today or get_server_today()
    gap = (active_today - last_checkin_date).days

    if gap > 1:
        return 0

    return current_streak


def sync_loop_streak_snapshot(loop: dict, today: date | None = None) -> dict:
    if not loop:
        return loop

    active_today = today or get_server_today()
    current_streak = int(loop.get("current_streak") or 0)
    live_current_streak = get_live_loop_current_streak(loop, today=active_today)

    if live_current_streak == current_streak:
        return loop

    synced_loop = {**loop, "current_streak": live_current_streak}

    if loop.get("id"):
        supabase.table("loops").update({
            "current_streak": live_current_streak,
        }).eq("id", loop["id"]).execute()

    return synced_loop


def sync_loop_collection(loops: list[dict], today: date | None = None) -> list[dict]:
    active_today = today or get_server_today()
    return [sync_loop_streak_snapshot(loop, today=active_today) for loop in (loops or [])]


async def calculate_user_daily_streak(user_id: str, today: date | None = None) -> dict:
    """
    Calculate the user's overall streak from distinct active days.
    A day counts once if any completed loop exists for that date.
    """
    res = (
        supabase.table("checkins")
        .select("date")
        .eq("user_id", user_id)
        .eq("completed", True)
        .order("date", desc=False)
        .execute()
    )

    if not res.data:
        return {
            "current_streak": 0,
            "best_streak": 0,
            "last_active_date": None,
        }

    checkin_dates = [date.fromisoformat(row["date"]) for row in res.data]
    streaks = calculate_streaks_from_dates(checkin_dates, today=today or get_server_today())

    return {
        "current_streak": streaks["current_streak"],
        "best_streak": streaks["best_streak"],
        "last_active_date": streaks["last_checkin_date"],
    }


async def recalculate_all_streaks_for_user(user_id: str) -> list[dict]:
    """
    Recalculate streaks for every active loop belonging to a user.
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


def get_streak_label(current_streak: int) -> str:
    if current_streak == 0:
        return "Not started"
    if current_streak < 3:
        return "Getting started"
    if current_streak < 7:
        return "Building momentum"
    if current_streak < 14:
        return "On fire"
    if current_streak < 30:
        return "Unstoppable"
    if current_streak < 100:
        return "Legend"
    return "Mythic"
