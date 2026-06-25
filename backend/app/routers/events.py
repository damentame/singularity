from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any
from datetime import date
from app.dependencies import get_current_user
from app.db import supabase

router = APIRouter(prefix="/events", tags=["events"])


class EventUpsert(BaseModel):
    event_id: str
    event_name: str | None = None
    event_type: str | None = None
    event_category: str | None = None
    country: str | None = None
    city: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    total_days: int | None = None
    total_guests: int | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    currency: str = "ZAR"
    status: str = "draft"
    notes: str | None = None
    questionnaire_responses: dict[str, Any] = {}
    sub_events: list[dict[str, Any]] = []
    guests: list[dict[str, Any]] = []
    selections: list[dict[str, Any]] = []


@router.get("")
def list_events(user=Depends(get_current_user)):
    resp = (
        supabase.table("events")
        .select("*")
        .eq("user_id", str(user.id))
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data


@router.post("")
def upsert_event(body: EventUpsert, user=Depends(get_current_user)):
    event_data = body.model_dump(exclude={"sub_events", "guests", "selections"})
    event_data["user_id"] = str(user.id)
    event_data = {k: v for k, v in event_data.items() if v is not None}

    resp = supabase.table("events").upsert(event_data, on_conflict="event_id").execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to upsert event")

    event_db_id = resp.data[0]["id"]

    # Batch-replace related rows (mirrors frontend delete-then-insert pattern)
    supabase.table("sub_events").delete().eq("event_id", event_db_id).execute()
    if body.sub_events:
        for se in body.sub_events:
            se.pop("id", None)
            se["event_id"] = event_db_id
        supabase.table("sub_events").insert(body.sub_events).execute()

    supabase.table("guests").delete().eq("event_id", event_db_id).execute()
    if body.guests:
        for g in body.guests:
            g.pop("id", None)
            g["event_id"] = event_db_id
        supabase.table("guests").insert(body.guests).execute()

    supabase.table("service_provider_selections").delete().eq("event_id", event_db_id).execute()
    if body.selections:
        for s in body.selections:
            s.pop("id", None)
            s["event_id"] = event_db_id
        supabase.table("service_provider_selections").insert(body.selections).execute()

    return resp.data[0]


@router.get("/{event_id}")
def get_event(event_id: str, user=Depends(get_current_user)):
    resp = (
        supabase.table("events")
        .select("*")
        .eq("event_id", event_id)
        .eq("user_id", str(user.id))
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Event not found")

    event = resp.data
    event_db_id = event["id"]

    event["sub_events"] = (
        supabase.table("sub_events").select("*").eq("event_id", event_db_id).order("day_number").execute().data
    )
    event["guests"] = (
        supabase.table("guests").select("*").eq("event_id", event_db_id).order("full_name").execute().data
    )
    event["selections"] = (
        supabase.table("service_provider_selections").select("*").eq("event_id", event_db_id).execute().data
    )

    return event


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: str, user=Depends(get_current_user)):
    supabase.table("events").delete().eq("event_id", event_id).eq("user_id", str(user.id)).execute()
