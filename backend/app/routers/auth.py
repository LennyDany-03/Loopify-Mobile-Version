from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from postgrest.exceptions import APIError
from supabase_auth.errors import AuthApiError, AuthError, AuthWeakPasswordError

from app.services.supabase_client import supabase
from app.utils.jwt import create_access_token, create_refresh_token, decode_token

router = APIRouter(prefix="/auth", tags=["Auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


def raise_supabase_auth_error(exc: AuthError) -> None:
    message = getattr(exc, "message", None) or str(exc)
    lowered = message.lower()
    status_code = getattr(exc, "status", status.HTTP_400_BAD_REQUEST)

    if "rate limit" in lowered:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many signup attempts. Please wait a bit and try again.",
        ) from exc

    if "weak password" in lowered or "at least 6 characters" in lowered:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters.",
        ) from exc

    if "already registered" in lowered or "already exists" in lowered:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from exc

    if status_code == status.HTTP_401_UNAUTHORIZED:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        ) from exc

    raise HTTPException(status_code=status_code, detail=message) from exc


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    """
    Register a new user via Supabase Auth.
    Also inserts or updates a profile row in the `profiles` table.
    """
    if len(body.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters.",
        )

    try:
        res = supabase.auth.sign_up(
            {
                "email": body.email,
                "password": body.password,
                "options": {
                    "data": {
                        "full_name": body.full_name,
                    }
                },
            }
        )
    except (AuthWeakPasswordError, AuthApiError, AuthError) as exc:
        raise_supabase_auth_error(exc)

    if res.user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed. Email may already be in use.",
        )

    user_id = res.user.id

    try:
        supabase.table("profiles").upsert(
            {
                "id": user_id,
                "full_name": body.full_name,
            }
        ).execute()
    except APIError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"User was created, but profile setup failed: {exc.message}",
        ) from exc

    return {
        "message": "Registration successful",
        "user_id": user_id,
        "access_token": create_access_token(user_id),
        "refresh_token": create_refresh_token(user_id),
    }


@router.post("/login")
async def login(body: LoginRequest):
    """
    Login with email + password via Supabase Auth.
    Returns JWT access + refresh tokens.
    """
    try:
        res = supabase.auth.sign_in_with_password(
            {
                "email": body.email,
                "password": body.password,
            }
        )
    except (AuthApiError, AuthError) as exc:
        raise_supabase_auth_error(exc)

    if res.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    user_id = res.user.id

    return {
        "message": "Login successful",
        "user_id": user_id,
        "access_token": create_access_token(user_id),
        "refresh_token": create_refresh_token(user_id),
    }


@router.post("/refresh")
async def refresh_token(body: RefreshRequest):
    """
    Exchange a valid refresh token for a new access token.
    """
    payload = decode_token(body.refresh_token)

    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    user_id = payload.get("sub")

    return {
        "access_token": create_access_token(user_id),
    }


@router.post("/logout")
async def logout():
    """
    Sign out the current session via Supabase Auth.
    Client should also discard stored tokens.
    """
    supabase.auth.sign_out()
    return {"message": "Logged out successfully"}
