from supabase import create_client, Client
from app.config import settings

# Single service-role client used for all DB queries and JWT validation.
# Returns None when Supabase is not yet configured (health check still works).
supabase: Client | None = None

if settings.supabase_url and settings.supabase_service_role_key:
    supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
