from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from enum import Enum


# ── Enums ──────────────────────────────────────────────────────────────────────

class FrequencyType(str, Enum):
    daily = "daily"
    weekly = "weekly"
    custom = "custom"


class TargetType(str, Enum):
    boolean = "boolean"     # Simple yes/no tick
    number = "number"       # e.g. ran 5 km
    duration = "duration"   # e.g. studied 60 mins


class LoopCategory(str, Enum):
    general = "General"
    fitness = "Fitness"
    study = "Study"
    finance = "Finance"
    health = "Health"
    mindfulness = "Mindfulness"
    social = "Social"
    creative = "Creative"
    work = "Work"
    custom = "Custom"


# ── Base ───────────────────────────────────────────────────────────────────────

class LoopBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    icon: Optional[str] = "🔁"
    category: Optional[LoopCategory] = LoopCategory.general
    color: Optional[str] = "#6C63FF"
    frequency: FrequencyType = FrequencyType.daily
    custom_days: Optional[List[str]] = Field(
        default=[],
        description="Active days for custom frequency e.g. ['Mon', 'Wed', 'Fri']"
    )
    target_type: TargetType = TargetType.boolean
    target_value: Optional[float] = Field(
        default=None,
        description="Target amount for number/duration loops e.g. 5.0"
    )
    target_unit: Optional[str] = Field(
        default=None,
        description="Unit label shown in UI e.g. 'km', 'mins', 'pages'"
    )


# ── Create request ─────────────────────────────────────────────────────────────

class LoopCreate(LoopBase):
    pass


# ── Update request (all fields optional) ──────────────────────────────────────

class LoopUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    icon: Optional[str] = None
    category: Optional[LoopCategory] = None
    color: Optional[str] = None
    frequency: Optional[FrequencyType] = None
    custom_days: Optional[List[str]] = None
    target_type: Optional[TargetType] = None
    target_value: Optional[float] = None
    target_unit: Optional[str] = None
    is_active: Optional[bool] = None


# ── DB Row (what Supabase returns) ─────────────────────────────────────────────

class Loop(LoopBase):
    """
    Full loop object as stored in the `loops` table.
    """
    id: UUID
    user_id: UUID
    is_active: bool = True

    # Stats — updated automatically on every checkin
    current_streak: int = 0
    best_streak: int = 0
    total_checkins: int = 0
    last_checkin_date: Optional[date] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Response shapes ────────────────────────────────────────────────────────────

class LoopSummary(BaseModel):
    """
    Lightweight loop card shown on dashboard.
    """
    id: UUID
    name: str
    icon: Optional[str]
    category: Optional[str]
    color: Optional[str]
    current_streak: int
    best_streak: int
    total_checkins: int
    target_type: str
    target_value: Optional[float]
    target_unit: Optional[str]
    last_checkin_date: Optional[date]


class LoopCreateResponse(BaseModel):
    message: str
    loop: Loop


class LoopListResponse(BaseModel):
    loops: List[Loop]