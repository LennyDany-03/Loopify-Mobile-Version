from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.jwt import decode_token

# ── Bearer token extractor ─────────────────────────────────────────────────────
# Reads the Authorization: Bearer <token> header automatically.
# auto_error=False lets us return a clean 401 instead of FastAPI's default 403.

bearer_scheme = HTTPBearer(auto_error=False)


# ── Main guard dependency ──────────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """
    FastAPI dependency — protects any route that requires authentication.

    Usage:
        @router.get("/protected")
        async def protected_route(user_id: str = Depends(get_current_user)):
            ...

    Flow:
        1. Extracts Bearer token from Authorization header.
        2. Decodes and validates the JWT.
        3. Confirms token type is "access" (not a refresh token).
        4. Returns the user_id (str) to the route handler.

    Raises:
        401 — missing token, invalid token, expired token, or wrong token type.
    """
    # 1. Check header is present
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # 2. Decode and validate JWT
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Reject refresh tokens used as access tokens
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Use an access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. Extract user_id
    user_id: str = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is malformed.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


# ── Optional auth (for public routes that can also be authed) ──────────────────

async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str | None:
    """
    Soft version of get_current_user.
    Returns user_id if a valid token is provided, otherwise returns None.

    Use for routes that work for both guests and logged-in users,
    e.g. a public loop preview that shows extra data if authed.

    Usage:
        @router.get("/preview/{loop_id}")
        async def preview(user_id: str | None = Depends(get_optional_user)):
            if user_id:
                # return personalized data
            else:
                # return public data
    """
    if credentials is None:
        return None

    payload = decode_token(credentials.credentials)

    if payload is None or payload.get("type") != "access":
        return None

    return payload.get("sub")