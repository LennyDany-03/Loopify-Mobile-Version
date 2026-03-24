from fastapi import APIRouter, HTTPException, Query, Depends
from datetime import date, timedelta
from collections import defaultdict
from app.services.supabase_client import supabase
from app.middleware.auth_guard import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/summary")
async def get_summary(user_id: str = Depends(get_current_user)):
    """
    High-level summary card stats for the dashboard.
    Returns: total loops, total checkins, best streak, active streak today.
    """
    loops_res = (
        supabase.table("loops")
        .select("id, name, icon, current_streak, best_streak, total_checkins, category")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .execute()
    )
    loops = loops_res.data or []

    total_checkins = sum(l["total_checkins"] for l in loops)
    best_streak = max((l["best_streak"] for l in loops), default=0)
    active_streaks = sum(1 for l in loops if l["current_streak"] > 0)

    return {
        "total_loops": len(loops),
        "total_checkins": total_checkins,
        "best_streak_overall": best_streak,
        "loops_on_streak_today": active_streaks,
        "loops": loops,
    }


@router.get("/streak/{loop_id}")
async def get_streak(loop_id: str, user_id: str = Depends(get_current_user)):
    """
    Get current and best streak for a specific loop.
    """
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

    return res.data


@router.get("/heatmap/{loop_id}")
async def get_heatmap(
    loop_id: str,
    year: int = Query(default=None),
    user_id: str = Depends(get_current_user)
):
    """
    Returns a year's worth of checkin data formatted for a GitHub-style heatmap.
    Defaults to the current year.
    Each entry: { date: "YYYY-MM-DD", count: 1 }
    """
    target_year = year or date.today().year
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

    # Build checkin map: date -> count/value
    checkin_map = {}
    for c in (res.data or []):
        checkin_map[c["date"]] = {
            "date": c["date"],
            "count": 1,
            "value": c["value"],
        }

    # Fill all 365 days (so frontend can render empty cells)
    heatmap = []
    cursor = start
    while cursor <= end:
        d = str(cursor)
        heatmap.append(checkin_map.get(d, {"date": d, "count": 0, "value": None}))
        cursor += timedelta(days=1)

    return {"year": target_year, "heatmap": heatmap}


@router.get("/weekly/{loop_id}")
async def get_weekly_stats(loop_id: str, user_id: str = Depends(get_current_user)):
    """
    Returns checkin counts grouped by week for the last 12 weeks.
    Used for bar chart / sparkline on loop detail page.
    """
    end = date.today()
    start = end - timedelta(weeks=12)

    res = (
        supabase.table("checkins")
        .select("date")
        .eq("loop_id", loop_id)
        .eq("user_id", user_id)
        .eq("completed", True)
        .gte("date", str(start))
        .execute()
    )

    # Group by ISO week
    weekly = defaultdict(int)
    for c in (res.data or []):
        d = date.fromisoformat(c["date"])
        week_label = d.strftime("%Y-W%W")
        weekly[week_label] += 1

    return {
        "weeks": [
            {"week": week, "count": count}
            for week, count in sorted(weekly.items())
        ]
    }


@router.get("/category-breakdown")
async def get_category_breakdown(user_id: str = Depends(get_current_user)):
    """
    Returns total checkins grouped by loop category.
    Used for the pie/donut chart on the analytics page.
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
            {"category": cat, "total": total}
            for cat, total in sorted(breakdown.items(), key=lambda x: -x[1])
        ]
    }


@router.get("/completion-rate")
async def get_completion_rate(
    days: int = Query(default=30, ge=7, le=365),
    user_id: str = Depends(get_current_user)
):
    """
    Overall completion rate for all loops over the last N days.
    completion_rate = (actual checkins / expected checkins) * 100
    """
    end = date.today()
    start = end - timedelta(days=days)

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
