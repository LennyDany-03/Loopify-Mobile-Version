from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID


# ── Base ───────────────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email: EmailStr
    full_name: str


# ── DB Row (what Supabase returns) ─────────────────────────────────────────────

class UserProfile(BaseModel):
    """
    Represents a row in the `profiles` table.
    Created automatically on register.
    """
    id: UUID
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    symbol: Optional[str] = None
    timezone: Optional[str] = "Asia/Kolkata"   # Default: IST
    reminder_time: Optional[str] = None         # e.g. "08:00"
    theme: Optional[str] = "dark"               # "dark" | "light" | "system"
    is_deleted: Optional[bool] = False
    deleted_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Response shapes ────────────────────────────────────────────────────────────

class UserPublicResponse(BaseModel):
    """
    Safe public-facing user object. Never exposes sensitive fields.
    """
    id: UUID
    full_name: str
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    symbol: Optional[str] = None
    theme: Optional[str] = "dark"
    timezone: Optional[str] = None
    created_at: Optional[datetime] = None


class UserStatsResponse(BaseModel):
    """
    Returned by GET /users/me/stats
    """
    full_name: Optional[str]
    member_since: Optional[datetime]
    total_loops_created: int
    total_checkins_all_time: int
    best_streak_ever: int


# ── Auth response ──────────────────────────────────────────────────────────────

class AuthTokenResponse(BaseModel):
    """
    Returned on successful login or register.
    """
    message: str
    user_id: str
    access_token: str
    refresh_token: Optional[str] = None
