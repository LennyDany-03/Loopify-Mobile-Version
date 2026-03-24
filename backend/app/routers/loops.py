from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
from app.services.supabase_client import supabase
from app.middleware.auth_guard import get_current_user

router = APIRouter(prefix="/loops", tags=["Loops"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class LoopCreate(BaseModel):
    name: str
    icon: Optional[str] = "🔁"
    category: Optional[str] = "General"
    frequency: str               # "daily" | "weekly" | "custom"
    custom_days: Optional[list[str]] = []   # ["Mon", "Wed", "Fri"]
    target_type: str             # "boolean" | "number" | "duration"
    target_value: Optional[float] = None    # e.g. 5.0 (km), 60 (mins)
    target_unit: Optional[str] = None       # e.g. "km", "mins", "pages"
    color: Optional[str] = "#6C63FF"


class LoopUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    category: Optional[str] = None
    frequency: Optional[str] = None
    custom_days: Optional[list[str]] = None
    target_type: Optional[str] = None
    target_value: Optional[float] = None
    target_unit: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/")
async def get_loops(user_id: str = Depends(get_current_user)):
    """
    Get all loops for the authenticated user.
    Returns only active loops by default.
    """
    res = (
        supabase.table("loops")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .order("created_at", desc=False)
        .execute()
    )
    return {"loops": res.data}


@router.get("/{loop_id}")
async def get_loop(loop_id: str, user_id: str = Depends(get_current_user)):
    """
    Get a single loop by ID. Must belong to the authenticated user.
    """
    res = (
        supabase.table("loops")
        .select("*")
        .eq("id", loop_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )

    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loop not found."
        )

    return res.data


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_loop(body: LoopCreate, user_id: str = Depends(get_current_user)):
    """
    Create a new loop for the authenticated user.
    """
    payload = {
        **body.model_dump(),
        "user_id": user_id,
        "is_active": True,
        "current_streak": 0,
        "best_streak": 0,
        "total_checkins": 0,
    }

    res = supabase.table("loops").insert(payload).execute()

    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create loop."
        )

    return {"message": "Loop created", "loop": res.data[0]}


@router.put("/{loop_id}")
async def update_loop(
    loop_id: str,
    body: LoopUpdate,
    user_id: str = Depends(get_current_user)
):
    """
    Update loop fields. Only provided (non-null) fields are updated.
    """
    # Filter out None values so we only patch what was sent
    updates = {k: v for k, v in body.model_dump().items() if v is not None}

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update."
        )

    res = (
        supabase.table("loops")
        .update(updates)
        .eq("id", loop_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loop not found or unauthorized."
        )

    return {"message": "Loop updated", "loop": res.data[0]}


@router.delete("/{loop_id}", status_code=status.HTTP_200_OK)
async def delete_loop(loop_id: str, user_id: str = Depends(get_current_user)):
    """
    Soft-delete a loop by setting is_active = False.
    Data is preserved for analytics history.
    """
    res = (
        supabase.table("loops")
        .update({"is_active": False})
        .eq("id", loop_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loop not found or unauthorized."
        )

    return {"message": "Loop deleted"}