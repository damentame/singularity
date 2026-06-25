from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any
from datetime import date
from app.dependencies import get_current_user
from app.db import supabase

router = APIRouter(prefix="/clients", tags=["clients"])


class ClientCreate(BaseModel):
    client_type: str = "wedding"
    primary_contact_name: str = ""
    primary_contact_email: str = ""
    primary_contact_phone_code: str = ""
    primary_contact_phone: str = ""
    company_name: str = ""
    country: str = ""
    region: str = ""
    city: str = ""
    billing_address: str = ""
    vat_number: str = ""
    style_preferences: dict[str, Any] = {}
    budget_history: list[Any] = []
    notes: str = ""
    mood_board_refs: list[Any] = []
    tags: list[str] = []


class ClientUpdate(BaseModel):
    client_type: str | None = None
    primary_contact_name: str | None = None
    primary_contact_email: str | None = None
    primary_contact_phone_code: str | None = None
    primary_contact_phone: str | None = None
    company_name: str | None = None
    country: str | None = None
    region: str | None = None
    city: str | None = None
    billing_address: str | None = None
    vat_number: str | None = None
    style_preferences: dict[str, Any] | None = None
    budget_history: list[Any] | None = None
    notes: str | None = None
    mood_board_refs: list[Any] | None = None
    tags: list[str] | None = None


class ClientEventUpsert(BaseModel):
    event_local_id: str
    event_name: str = ""
    event_type: str = ""
    event_date: date | None = None
    venue: str = ""
    guest_count: int = 0
    total_budget: float = 0
    total_client_price: float = 0
    suppliers_used: list[Any] = []
    mood_board_refs: list[Any] = []
    status: str = "draft"
    notes: str = ""


@router.get("")
def list_clients(q: str | None = None, user=Depends(get_current_user)):
    query = (
        supabase.table("clients")
        .select("*")
        .eq("coordinator_id", str(user.id))
        .eq("is_active", True)
    )
    if q:
        query = query.or_(
            f"primary_contact_name.ilike.%{q}%,"
            f"primary_contact_email.ilike.%{q}%,"
            f"company_name.ilike.%{q}%"
        )
    resp = query.order("updated_at", desc=True).limit(50).execute()
    return resp.data


@router.post("", status_code=201)
def create_client(body: ClientCreate, user=Depends(get_current_user)):
    data = body.model_dump()
    data["coordinator_id"] = str(user.id)
    resp = supabase.table("clients").insert(data).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create client")
    return resp.data[0]


@router.get("/{client_id}")
def get_client(client_id: str, user=Depends(get_current_user)):
    resp = (
        supabase.table("clients")
        .select("*")
        .eq("id", client_id)
        .eq("coordinator_id", str(user.id))
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Client not found")
    return resp.data


@router.put("/{client_id}")
def update_client(client_id: str, body: ClientUpdate, user=Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    resp = (
        supabase.table("clients")
        .update(updates)
        .eq("id", client_id)
        .eq("coordinator_id", str(user.id))
        .execute()
    )
    return resp.data[0] if resp.data else None


@router.delete("/{client_id}", status_code=204)
def delete_client(client_id: str, user=Depends(get_current_user)):
    # Soft-delete
    supabase.table("clients").update({"is_active": False}).eq("id", client_id).eq(
        "coordinator_id", str(user.id)
    ).execute()


@router.get("/{client_id}/events")
def list_client_events(client_id: str, user=Depends(get_current_user)):
    resp = (
        supabase.table("client_events")
        .select("*")
        .eq("client_id", client_id)
        .eq("coordinator_id", str(user.id))
        .order("event_date", desc=True)
        .execute()
    )
    return resp.data


@router.post("/{client_id}/events", status_code=201)
def upsert_client_event(client_id: str, body: ClientEventUpsert, user=Depends(get_current_user)):
    # Check for existing record with the same event_local_id
    existing = (
        supabase.table("client_events")
        .select("id")
        .eq("client_id", client_id)
        .eq("event_local_id", body.event_local_id)
        .execute()
    )
    data = body.model_dump()

    if existing.data:
        resp = (
            supabase.table("client_events")
            .update(data)
            .eq("id", existing.data[0]["id"])
            .execute()
        )
    else:
        data["client_id"] = client_id
        data["coordinator_id"] = str(user.id)
        resp = supabase.table("client_events").insert(data).execute()

    return resp.data[0] if resp.data else None
