from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, date
from uuid import UUID


# ── Base ───────────────────────────────────────────────────────────────────────

class CheckinBase(BaseModel):
    loop_id: UUID
    date: Optional[date] = Field(
        default=None,
        description="Date of checkin. Defaults to today if not provided."
    )
    value: Optional[float] = Field(
        default=None,
        description="Logged value for number/duration loops e.g. 5.2 (km)"
    )
    note: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Optional journal note for this checkin"
    )


# ── Create / Update ────────────────────────────────────────────────────────────

class CheckinCreate(CheckinBase):
    pass


class CheckinUpdate(BaseModel):
    value: Optional[float] = None
    note: Optional[str] = Field(default=None, max_length=500)


# ── DB Row ─────────────────────────────────────────────────────────────────────

class Checkin(CheckinBase):
    """
    Full checkin object as stored in the `checkins` table.
    """
    id: UUID
    user_id: UUID
    completed: bool = True
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Streak data (returned alongside checkin creation) ─────────────────────────

class StreakData(BaseModel):
    current_streak: int
    best_streak: int
    total_checkins: int
    last_checkin_date: Optional[date] = None


# ── Response shapes ────────────────────────────────────────────────────────────

class CheckinCreateResponse(BaseModel):
    message: str
    checkin: Checkin
    streak: StreakData


class CheckinListResponse(BaseModel):
    checkins: List[Checkin]
    count: int


class TodayCheckinsResponse(BaseModel):
    """
    Used by dashboard to instantly know which loops are done today.
    Key = loop_id (str), Value = checkin summary
    """
    date: date
    completed: Dict[str, dict]


# ── Heatmap cell ───────────────────────────────────────────────────────────────

class HeatmapCell(BaseModel):
    """
    Single day entry in the GitHub-style heatmap.
    count=0 means no checkin that day.
    """
    date: date
    count: int              # 0 or 1 for boolean, actual value for numeric
    value: Optional[float]  # Raw logged value (if numeric loop)


class HeatmapResponse(BaseModel):
    year: int
    heatmap: List[HeatmapCell]