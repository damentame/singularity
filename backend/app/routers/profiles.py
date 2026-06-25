from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.db import supabase

router = APIRouter(prefix="/profiles", tags=["profiles"])


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    company_name: str | None = None
    country: str | None = None
    city: str | None = None
    avatar_url: str | None = None


@router.get("/me")
def get_profile(user=Depends(get_current_user)):
    resp = supabase.table("profiles").select("*").eq("id", str(user.id)).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return resp.data


@router.put("/me")
def update_profile(body: ProfileUpdate, user=Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    resp = supabase.table("profiles").update(updates).eq("id", str(user.id)).execute()
    return resp.data[0] if resp.data else None
