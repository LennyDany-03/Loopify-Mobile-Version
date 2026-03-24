from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.services.supabase_client import supabase
from app.services.streak_service import recalculate_streak
from app.middleware.auth_guard import get_current_user

router = APIRouter(prefix="/checkins", tags=["Checkins"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class CheckinCreate(BaseModel):
    loop_id: str
    date: Optional[date] = None        # Defaults to today if not provided
    value: Optional[float] = None      # For numeric/duration loops
    note: Optional[str] = None         # Optional journal note


class CheckinUpdate(BaseModel):
    value: Optional[float] = None
    note: Optional[str] = None


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_checkin(body: CheckinCreate, user_id: str = Depends(get_current_user)):
    """
    Log a checkin for a loop.
    - Defaults to today's date if not specified.
    - Prevents duplicate boolean checkins for the same loop + date.
    - Number and duration loops accumulate value in the same daily checkin.
    - Triggers streak recalculation after insert.
    """
    checkin_date = body.date or date.today()

    # 1. Verify loop ownership
    loop_res = (
        supabase.table("loops")
        .select("id, target_type, target_value")
        .eq("id", body.loop_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not loop_res.data:
        raise HTTPException(status_code=404, detail="Loop not found or unauthorized.")

    loop = loop_res.data
    target_type = loop["target_type"]
    target_value = float(loop["target_value"] or 0)

    # 2. Check for existing checkin today
    existing_checkin_res = (
        supabase.table("checkins")
        .select("id, value, note, completed")
        .eq("loop_id", body.loop_id)
        .eq("user_id", user_id)
        .eq("date", str(checkin_date))
        .execute()
    )
    existing_checkin = (
        existing_checkin_res.data[0]
        if existing_checkin_res.data
        else None
    )

    if target_type == "boolean" and existing_checkin:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already checked in for this loop today.",
        )

    checkin = None

    if target_type in {"number", "duration"}:
        if target_value <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Numeric and duration loops need a target value greater than zero.",
            )

        increment_value = float(body.value if body.value is not None else 1)

        if increment_value <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Checkin value must be greater than zero.",
            )

        if existing_checkin:
            current_value = float(existing_checkin["value"] or 0)

            if existing_checkin["completed"] and current_value >= target_value:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Today's target is already completed for this loop.",
                )

            next_value = min(current_value + increment_value, target_value)
            completed = next_value >= target_value
            updates = {
                "value": next_value,
                "completed": completed,
            }

            if body.note is not None:
                updates["note"] = body.note

            update_res = (
                supabase.table("checkins")
                .update(updates)
                .eq("id", existing_checkin["id"])
                .eq("user_id", user_id)
                .execute()
            )

            if not update_res.data:
                raise HTTPException(status_code=500, detail="Failed to update checkin progress.")

            checkin = update_res.data[0]
        else:
            starting_value = min(increment_value, target_value)
            payload = {
                "loop_id": body.loop_id,
                "user_id": user_id,
                "date": str(checkin_date),
                "value": starting_value,
                "note": body.note,
                "completed": starting_value >= target_value,
            }
            insert_res = supabase.table("checkins").insert(payload).execute()

            if not insert_res.data:
                raise HTTPException(status_code=500, detail="Failed to save checkin.")

            checkin = insert_res.data[0]
    else:
        payload = {
            "loop_id": body.loop_id,
            "user_id": user_id,
            "date": str(checkin_date),
            "value": body.value,
            "note": body.note,
            "completed": True,
        }
        insert_res = supabase.table("checkins").insert(payload).execute()

        if not insert_res.data:
            raise HTTPException(status_code=500, detail="Failed to save checkin.")

        checkin = insert_res.data[0]

    # 3. Recalculate streak for this loop
    streak_data = await recalculate_streak(body.loop_id)

    # 4. Update loop stats
    supabase.table("loops").update({
        "current_streak": streak_data["current_streak"],
        "best_streak": streak_data["best_streak"],
        "total_checkins": streak_data["total_checkins"],
        "last_checkin_date": streak_data["last_checkin_date"],
    }).eq("id", body.loop_id).execute()

    return {
        "message": "Checked in!" if checkin["completed"] else "Progress updated!",
        "checkin": checkin,
        "streak": streak_data,
    }


@router.get("/{loop_id}")
async def get_checkins_for_loop(
    loop_id: str,
    from_date: Optional[date] = Query(default=None),
    to_date: Optional[date] = Query(default=None),
    user_id: str = Depends(get_current_user)
):
    """
    Get all checkins for a specific loop.
    Optionally filter by date range using `from_date` and `to_date`.
    """
    query = (
        supabase.table("checkins")
        .select("*")
        .eq("loop_id", loop_id)
        .eq("user_id", user_id)
        .order("date", desc=True)
    )

    if from_date:
        query = query.gte("date", str(from_date))
    if to_date:
        query = query.lte("date", str(to_date))

    res = query.execute()
    return {"checkins": res.data, "count": len(res.data)}


@router.get("/today/all")
async def get_todays_checkins(user_id: str = Depends(get_current_user)):
    """
    Get all checkins the user has made today.
    Used by dashboard to highlight already-completed loops.
    """
    today = str(date.today())
    res = (
        supabase.table("checkins")
        .select("id, loop_id, value, note, completed")
        .eq("user_id", user_id)
        .eq("date", today)
        .execute()
    )
    # Return as a set-like dict keyed by loop_id for fast frontend lookup
    completed_map = {c["loop_id"]: c for c in (res.data or [])}
    return {"date": today, "completed": completed_map}


@router.put("/{checkin_id}")
async def update_checkin(
    checkin_id: str,
    body: CheckinUpdate,
    user_id: str = Depends(get_current_user)
):
    """
    Update value or note for an existing checkin.
    """
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update.")

    res = (
        supabase.table("checkins")
        .update(updates)
        .eq("id", checkin_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=404, detail="Checkin not found.")

    return {"message": "Checkin updated", "checkin": res.data[0]}


@router.delete("/{checkin_id}")
async def delete_checkin(checkin_id: str, user_id: str = Depends(get_current_user)):
    """
    Delete a checkin (undo a log).
    Also recalculates streak after deletion.
    """
    # Fetch checkin to get loop_id before deleting
    fetch = (
        supabase.table("checkins")
        .select("loop_id")
        .eq("id", checkin_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not fetch.data:
        raise HTTPException(status_code=404, detail="Checkin not found.")

    loop_id = fetch.data["loop_id"]

    supabase.table("checkins").delete().eq("id", checkin_id).execute()

    # Recalculate streak after undo
    streak_data = await recalculate_streak(loop_id)
    supabase.table("loops").update({
        "current_streak": streak_data["current_streak"],
        "best_streak": streak_data["best_streak"],
        "total_checkins": streak_data["total_checkins"],
    }).eq("id", loop_id).execute()

    return {"message": "Checkin deleted", "streak": streak_data}
