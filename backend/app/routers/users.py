from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
import re
from postgrest.exceptions import APIError
from app.services.supabase_client import supabase
from app.middleware.auth_guard import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    symbol: Optional[str] = None
    timezone: Optional[str] = None       # e.g. "Asia/Kolkata"
    reminder_time: Optional[str] = None  # e.g. "08:00"
    theme: Optional[str] = None          # "dark" | "light" | "system"


class PasswordChange(BaseModel):
    new_password: str


def sanitize_username(value: str | None) -> Optional[str]:
    if value is None:
        return None

    normalized = re.sub(r"[^a-z0-9_]+", "_", value.strip().lower().lstrip("@"))
    normalized = re.sub(r"_+", "_", normalized).strip("_")
    return normalized or None


def derive_username(full_name: str | None = None, email: str | None = None) -> Optional[str]:
    source = full_name or (email.split("@")[0] if email else None)
    return sanitize_username(source)


def get_auth_email(user_id: str) -> Optional[str]:
    try:
        auth_res = supabase.auth.admin.get_user_by_id(user_id)
    except Exception:
        return None

    auth_user = getattr(auth_res, "user", None)

    if auth_user is None and isinstance(auth_res, dict):
        auth_user = auth_res.get("user")

    if isinstance(auth_user, dict):
        return auth_user.get("email")

    return getattr(auth_user, "email", None)


def is_missing_profile_column_error(exc: Exception, column_name: str) -> bool:
    message = f"{getattr(exc, 'message', '')} {exc}"
    return f"Could not find the '{column_name}' column of 'profiles'" in message


def fetch_profile_row(user_id: str) -> dict:
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

    profile = dict(res.data)
    profile.setdefault("theme", "dark")
    return profile


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/me")
async def get_my_profile(user_id: str = Depends(get_current_user)):
    """
    Get the authenticated user's profile.
    """
    profile = fetch_profile_row(user_id)
    updates = {}

    auth_email = profile.get("email") or get_auth_email(user_id)
    if auth_email and auth_email != profile.get("email"):
        updates["email"] = auth_email

    derived_username = profile.get("username") or derive_username(
        full_name=profile.get("full_name"),
        email=auth_email,
    )
    if derived_username and derived_username != profile.get("username"):
        updates["username"] = derived_username

    if updates:
        try:
            supabase.table("profiles").update(updates).eq("id", user_id).execute()
            profile.update(updates)
        except Exception:
            profile.update(updates)

    return profile


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

    if "username" in updates:
        normalized_username = sanitize_username(updates["username"])
        if not normalized_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username must contain at least one letter, number, or underscore."
            )
        updates["username"] = normalized_username

    if "full_name" in updates:
        normalized_full_name = updates["full_name"].strip()
        if not normalized_full_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Full name cannot be empty."
            )
        updates["full_name"] = normalized_full_name

    try:
        res = (
            supabase.table("profiles")
            .update(updates)
            .eq("id", user_id)
            .execute()
        )
    except APIError as exc:
        if "theme" in updates and is_missing_profile_column_error(exc, "theme"):
            fallback_updates = {key: value for key, value in updates.items() if key != "theme"}

            if fallback_updates:
                try:
                    res = (
                        supabase.table("profiles")
                        .update(fallback_updates)
                        .eq("id", user_id)
                        .execute()
                    )
                except APIError as retry_exc:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to update profile: {getattr(retry_exc, 'message', str(retry_exc))}"
                    ) from retry_exc
            else:
                res = None

            profile = fetch_profile_row(user_id)
            profile["theme"] = updates["theme"]

            return {
                "message": "Profile updated",
                "profile": profile,
                "sync_warning": "Theme column is missing in the profiles table, so the theme was only saved locally.",
            }

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {getattr(exc, 'message', str(exc))}"
        ) from exc

    if res is None or not res.data:
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
