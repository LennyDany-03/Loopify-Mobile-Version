import os
from supabase import create_client, Client
from dotenv import load_dotenv

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

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)