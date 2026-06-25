from fastapi import Request, HTTPException
from app.db import supabase


def get_current_user(request: Request):
    """Validate Supabase JWT from Authorization header and return the user."""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    token = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing authorization token")

    try:
        resp = supabase.auth.get_user(token)
        if not resp or not resp.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return resp.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
