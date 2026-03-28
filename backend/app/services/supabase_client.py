import os

from dotenv import load_dotenv
from supabase import Client, ClientOptions, create_client

load_dotenv()

# ── Config ─────────────────────────────────────────────────────────────────────

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise EnvironmentError(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment. "
        "Check your .env file."
    )

# ── Client (singleton) ─────────────────────────────────────────────────────────
# Uses the service role key — bypasses Row Level Security for backend operations.
# Never expose this key to the frontend.

SERVICE_CLIENT_OPTIONS = ClientOptions(
    persist_session=False,
    auto_refresh_token=False,
)

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
    options=SERVICE_CLIENT_OPTIONS,
)


def create_auth_client() -> Client:
    """
    Return a fresh client for auth flows like sign-in and sign-up.

    Supabase auth methods can mutate the client's in-memory session. Creating
    a dedicated client per auth request prevents that session from leaking into
    the shared service-role client used by the rest of the backend.
    """
    return create_client(
        SUPABASE_URL,
        SUPABASE_SERVICE_KEY,
        options=ClientOptions(
            persist_session=False,
            auto_refresh_token=False,
        ),
    )
