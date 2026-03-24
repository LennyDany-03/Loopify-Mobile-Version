import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

# ── Config ─────────────────────────────────────────────────────────────────────

SECRET_KEY: str = os.getenv("JWT_SECRET", "")
ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 30))

if not SECRET_KEY:
    raise EnvironmentError(
        "Missing JWT_SECRET in environment. Add it to your .env file."
    )


# ── Token creators ─────────────────────────────────────────────────────────────

def create_access_token(user_id: str) -> str:
    """
    Creates a short-lived JWT access token.
    Expires in ACCESS_TOKEN_EXPIRE_MINUTES (default: 60 mins).

    Payload:
        sub  → user_id
        type → "access"
        exp  → expiry timestamp
        iat  → issued at timestamp
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(user_id),
        "type": "access",
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """
    Creates a long-lived JWT refresh token.
    Expires in REFRESH_TOKEN_EXPIRE_DAYS (default: 30 days).

    Payload:
        sub  → user_id
        type → "refresh"   ← checked in /auth/refresh to prevent misuse
        exp  → expiry timestamp
        iat  → issued at timestamp
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── Token decoder ──────────────────────────────────────────────────────────────

def decode_token(token: str) -> Optional[dict]:
    """
    Decodes and validates a JWT token.

    Returns the payload dict on success.
    Returns None if the token is expired, tampered with, or malformed.

    Callers should always check the return value before using it:

        payload = decode_token(token)
        if payload is None:
            raise HTTPException(401, "Invalid token")
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# ── Token introspection helpers ────────────────────────────────────────────────

def get_user_id_from_token(token: str) -> Optional[str]:
    """
    Shorthand to extract just the user_id (sub) from a valid token.
    Returns None if the token is invalid or expired.
    """
    payload = decode_token(token)
    if payload is None:
        return None
    return payload.get("sub")


def is_token_expired(token: str) -> bool:
    """
    Returns True if the token has expired, False if still valid.
    Useful for client-side checks before making API calls.
    """
    payload = decode_token(token)
    return payload is None


def get_token_type(token: str) -> Optional[str]:
    """
    Returns the token type: "access" or "refresh".
    Returns None if the token is invalid.
    """
    payload = decode_token(token)
    if payload is None:
        return None
    return payload.get("type")