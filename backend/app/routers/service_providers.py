from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Any
from app.dependencies import get_current_user
from app.db import supabase

router = APIRouter(prefix="/service-providers", tags=["service-providers"])


class ProviderUpdate(BaseModel):
    business_name: str | None = None
    trading_name: str | None = None
    business_description: str | None = None
    website: str | None = None
    instagram: str | None = None
    facebook: str | None = None
    pinterest: str | None = None
    tiktok: str | None = None
    country: str | None = None
    state: str | None = None
    city: str | None = None
    postcode: str | None = None
    service_radius: str | None = None
    selected_event_types: list[str] | None = None
    selected_categories: dict[str, Any] | None = None
    service_details: dict[str, Any] | None = None
    insurance_types: list[str] | None = None
    public_liability_amount: str | None = None


class PortfolioAppend(BaseModel):
    urls: list[str]


class PortfolioRemove(BaseModel):
    url: str


class CoverUpdate(BaseModel):
    cover_image_url: str | None = None


# ── Public endpoints (no auth required) ─────────────────────────────────────

@router.get("")
def search_providers(
    q: str | None = None,
    country: str | None = None,
    category: str | None = None,
    limit: int = Query(default=50, le=200),
):
    query = supabase.table("service_providers").select("*").eq("is_active", True)

    if country:
        query = query.eq("country", country)
    if q:
        query = query.or_(
            f"business_name.ilike.%{q}%,"
            f"business_description.ilike.%{q}%,"
            f"city.ilike.%{q}%"
        )

    resp = query.limit(limit).execute()
    results = resp.data

    # Filter by category if provided (selected_categories is JSONB)
    if category and results:
        results = [p for p in results if category in (p.get("selected_categories") or {})]

    return results


@router.get("/me")
def get_my_provider(user=Depends(get_current_user)):
    resp = (
        supabase.table("service_providers")
        .select("*")
        .eq("user_id", str(user.id))
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    return resp.data


@router.put("/me")
def update_my_provider(body: ProviderUpdate, user=Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    resp = (
        supabase.table("service_providers")
        .update(updates)
        .eq("user_id", str(user.id))
        .execute()
    )
    return resp.data[0] if resp.data else None


@router.get("/me/portfolio")
def get_portfolio(user=Depends(get_current_user)):
    resp = (
        supabase.table("service_providers")
        .select("portfolio_urls, cover_image_url")
        .eq("user_id", str(user.id))
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    return resp.data


@router.post("/me/portfolio")
def append_portfolio(body: PortfolioAppend, user=Depends(get_current_user)):
    current = (
        supabase.table("service_providers")
        .select("portfolio_urls")
        .eq("user_id", str(user.id))
        .single()
        .execute()
    )
    if not current.data:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    existing: list[str] = current.data.get("portfolio_urls") or []
    merged = existing + [u for u in body.urls if u not in existing]

    resp = (
        supabase.table("service_providers")
        .update({"portfolio_urls": merged})
        .eq("user_id", str(user.id))
        .execute()
    )
    return {"portfolio_urls": merged}


@router.delete("/me/portfolio")
def remove_portfolio_url(body: PortfolioRemove, user=Depends(get_current_user)):
    current = (
        supabase.table("service_providers")
        .select("portfolio_urls")
        .eq("user_id", str(user.id))
        .single()
        .execute()
    )
    if not current.data:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    remaining = [u for u in (current.data.get("portfolio_urls") or []) if u != body.url]
    supabase.table("service_providers").update({"portfolio_urls": remaining}).eq(
        "user_id", str(user.id)
    ).execute()
    return {"portfolio_urls": remaining}


@router.put("/me/cover")
def set_cover_image(body: CoverUpdate, user=Depends(get_current_user)):
    resp = (
        supabase.table("service_providers")
        .update({"cover_image_url": body.cover_image_url})
        .eq("user_id", str(user.id))
        .execute()
    )
    return resp.data[0] if resp.data else None


# ── Must be last — catches /{id} ─────────────────────────────────────────────

@router.get("/{provider_id}")
def get_provider(provider_id: str):
    resp = (
        supabase.table("service_providers")
        .select("*")
        .eq("id", provider_id)
        .eq("is_active", True)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Provider not found")
    return resp.data
