from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.services.supabase_client import supabase
from app.middleware.auth_guard import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    timezone: Optional[str] = None       # e.g. "Asia/Kolkata"
    reminder_time: Optional[str] = None  # e.g. "08:00"
    theme: Optional[str] = None          # "dark" | "light" | "system"


class PasswordChange(BaseModel):
    new_password: str


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/me")
async def get_my_profile(user_id: str = Depends(get_current_user)):
    """
    Get the authenticated user's profile.
    """
    res = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user_id)
        .single()
        .execute()
    )

    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found."
        )

    return res.data


@router.put("/me")
async def update_my_profile(
    body: ProfileUpdate,
    user_id: str = Depends(get_current_user)
):
    """
    Update the authenticated user's profile fields.
    Only provided (non-null) fields are updated.
    """
    updates = {k: v for k, v in body.model_dump().items() if v is not None}

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update."
        )

    res = (
        supabase.table("profiles")
        .update(updates)
        .eq("id", user_id)
        .execute()
    )

    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile."
        )

    return {"message": "Profile updated", "profile": res.data[0]}


@router.put("/me/password")
async def change_password(
    body: PasswordChange,
    user_id: str = Depends(get_current_user)
):
    """
    Change the user's password via Supabase Auth.
    """
    if len(body.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters."
        )

    res = supabase.auth.update_user({"password": body.new_password})

    if not res.user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update password."
        )

    return {"message": "Password updated successfully"}


@router.delete("/me")
async def delete_account(user_id: str = Depends(get_current_user)):
    """
    Soft-delete the user's account.
    Marks profile as deleted; actual Supabase auth deletion handled separately.
    """
    supabase.table("profiles").update({
        "is_deleted": True,
        "deleted_at": "now()",
    }).eq("id", user_id).execute()

    return {"message": "Account deleted. Sorry to see you go!"}


@router.get("/me/stats")
async def get_my_stats(user_id: str = Depends(get_current_user)):
    """
    Quick stat summary attached to the user profile.
    Total loops, total checkins, days active, member since.
    """
    profile_res = (
        supabase.table("profiles")
        .select("created_at, full_name")
        .eq("id", user_id)
        .single()
        .execute()
    )

    loops_res = (
        supabase.table("loops")
        .select("id, total_checkins, best_streak")
        .eq("user_id", user_id)
        .execute()
    )

    loops = loops_res.data or []
    total_checkins = sum(l["total_checkins"] for l in loops)
    best_streak = max((l["best_streak"] for l in loops), default=0)

    return {
        "full_name": profile_res.data.get("full_name") if profile_res.data else None,
        "member_since": profile_res.data.get("created_at") if profile_res.data else None,
        "total_loops_created": len(loops),
        "total_checkins_all_time": total_checkins,
        "best_streak_ever": best_streak,
    }