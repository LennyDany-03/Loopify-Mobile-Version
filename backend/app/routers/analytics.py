from collections import defaultdict
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from app.middleware.auth_guard import get_current_user
from app.services.streak_service import (
    calculate_user_daily_streak,
    get_server_today,
    sync_loop_collection,
    sync_loop_streak_snapshot,
)
from app.services.supabase_client import supabase

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _get_week_start(value: date) -> date:
    return value - timedelta(days=value.weekday())


def _get_week_key(value: date) -> str:
    week_start = _get_week_start(value)
    return week_start.strftime("%Y-W%W")


def _build_recent_weeks(count: int = 12, today: date | None = None) -> list[dict]:
    active_today = today or get_server_today()
    current_week_start = _get_week_start(active_today)
    weeks = []

    for offset in range(count - 1, -1, -1):
        week_start = current_week_start - timedelta(weeks=offset)
        week_end = week_start + timedelta(days=6)
        weeks.append({
            "week": _get_week_key(week_start),
            "start_date": str(week_start),
            "end_date": str(week_end),
            "count": 0,
        })

    return weeks


@router.get("/summary")
async def get_summary(user_id: str = Depends(get_current_user)):
    """
    High-level summary card stats for the dashboard.
    """
    today = get_server_today()
    loops_res = (
        supabase.table("loops")
        .select("id, name, icon, current_streak, best_streak, total_checkins, category, last_checkin_date")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .execute()
    )
    loops = sync_loop_collection(loops_res.data or [], today=today)
    user_streak = await calculate_user_daily_streak(user_id, today=today)

    total_checkins = sum(int(loop.get("total_checkins") or 0) for loop in loops)
    active_streaks = sum(1 for loop in loops if int(loop.get("current_streak") or 0) > 0)

    return {
        "total_loops": len(loops),
        "total_checkins": total_checkins,
        "current_streak_overall": user_streak["current_streak"],
        "best_streak_overall": user_streak["best_streak"],
        "loops_on_streak_today": active_streaks,
        "server_date": str(today),
        "loops": loops,
    }


@router.get("/streak/{loop_id}")
async def get_streak(loop_id: str, user_id: str = Depends(get_current_user)):
    """
    Get current and best streak for a specific loop.
    """
    today = get_server_today()
    res = (
        supabase.table("loops")
        .select("id, name, current_streak, best_streak, total_checkins, last_checkin_date")
        .eq("id", loop_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=404, detail="Loop not found.")

    loop = sync_loop_streak_snapshot(res.data, today=today)
    return {
        **loop,
        "server_date": str(today),
    }


@router.get("/heatmap/{loop_id}")
async def get_heatmap(
    loop_id: str,
    year: int = Query(default=None),
    user_id: str = Depends(get_current_user)
):
    """
    Returns a year's worth of checkin data formatted for a GitHub-style heatmap.
    Defaults to the current server year.
    """
    target_year = year or get_server_today().year
    start = date(target_year, 1, 1)
    end = date(target_year, 12, 31)

    res = (
        supabase.table("checkins")
        .select("date, value")
        .eq("loop_id", loop_id)
        .eq("user_id", user_id)
        .eq("completed", True)
        .gte("date", str(start))
        .lte("date", str(end))
        .execute()
    )

    checkin_map = {}
    for checkin in (res.data or []):
        checkin_map[checkin["date"]] = {
            "date": checkin["date"],
            "count": 1,
            "value": checkin["value"],
        }

    heatmap = []
    cursor = start
    while cursor <= end:
        day_key = str(cursor)
        heatmap.append(checkin_map.get(day_key, {"date": day_key, "count": 0, "value": None}))
        cursor += timedelta(days=1)

    return {"year": target_year, "heatmap": heatmap}


@router.get("/weekly/{loop_id}")
async def get_weekly_stats(loop_id: str, user_id: str = Depends(get_current_user)):
    """
    Returns completed checkin counts grouped into the last 12 server-based weeks.
    """
    today = get_server_today()
    week_entries = _build_recent_weeks(today=today)
    start_date = week_entries[0]["start_date"]

    res = (
        supabase.table("checkins")
        .select("date")
        .eq("loop_id", loop_id)
        .eq("user_id", user_id)
        .eq("completed", True)
        .gte("date", start_date)
        .lte("date", str(today))
        .execute()
    )

    counts_by_week = defaultdict(int)
    for checkin in (res.data or []):
        checkin_date = date.fromisoformat(checkin["date"])
        counts_by_week[_get_week_key(checkin_date)] += 1

    weeks = [
        {
            **entry,
            "count": counts_by_week.get(entry["week"], 0),
        }
        for entry in week_entries
    ]

    return {
        "server_date": str(today),
        "weeks": weeks,
    }


@router.get("/category-breakdown")
async def get_category_breakdown(user_id: str = Depends(get_current_user)):
    """
    Returns total checkins grouped by loop category.
    """
    res = (
        supabase.table("loops")
        .select("category, total_checkins")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .execute()
    )

    breakdown = defaultdict(int)
    for loop in (res.data or []):
        breakdown[loop["category"]] += loop["total_checkins"]

    return {
        "categories": [
            {"category": category, "total": total}
            for category, total in sorted(breakdown.items(), key=lambda item: -item[1])
        ]
    }


@router.get("/completion-rate")
async def get_completion_rate(
    days: int = Query(default=30, ge=7, le=365),
    user_id: str = Depends(get_current_user)
):
    """
    Overall completion rate for all loops over the last N server-based days.
    """
    today = get_server_today()
    start = today - timedelta(days=days)

    loops_res = (
        supabase.table("loops")
        .select("id")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .execute()
    )
    loop_count = len(loops_res.data or [])
    expected = loop_count * days

    checkins_res = (
        supabase.table("checkins")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("completed", True)
        .gte("date", str(start))
        .execute()
    )
    actual = checkins_res.count or 0
    rate = round((actual / expected) * 100, 1) if expected > 0 else 0

    return {
        "period_days": days,
        "expected_checkins": expected,
        "actual_checkins": actual,
        "completion_rate_percent": rate,
    }
