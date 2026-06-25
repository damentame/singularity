from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any
from app.dependencies import get_current_user
from app.db import supabase

router = APIRouter(prefix="/rfq", tags=["rfq"])


class RfqBatchItem(BaseModel):
    id: str
    line_item_id: str
    item_name_snapshot: str = ""
    qty_snapshot: int = 1
    unit_type_snapshot: str = "EACH"
    moment_id_snapshot: str = ""
    space_id_snapshot: str = ""
    installation_label_snapshot: str = ""
    item_notes_snapshot: str = ""
    category_snapshot: str = ""


class RfqBatchCreate(BaseModel):
    id: str
    event_id: str
    supplier_name: str
    supplier_email: str = ""
    portal_token: str
    message_to_supplier: str = ""
    include_vat_info: bool = True
    include_moment_space_context: bool = True
    event_context: dict[str, Any] = {}
    items: list[RfqBatchItem] = []


class QuoteItem(BaseModel):
    rfq_batch_item_id: str
    supplier_unit_price_input: float = 0
    supplier_price_includes_vat: bool = True
    vat_rate_used: float = 0
    currency: str = "ZAR"
    lead_time_days: int = 0
    availability_notes: str = ""


class QuoteSubmit(BaseModel):
    id: str
    version_number: int
    type: str  # 'DRAFT_SAVE' or 'SUBMITTED'
    supplier_notes: str = ""
    total_net: float = 0
    total_vat: float = 0
    total_gross: float = 0
    items: list[QuoteItem] = []


@router.get("")
def list_batches(user=Depends(get_current_user)):
    resp = (
        supabase.table("rfq_batches")
        .select("*")
        .eq("user_id", str(user.id))
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data


@router.post("", status_code=201)
def create_batch(body: RfqBatchCreate, user=Depends(get_current_user)):
    batch_data = body.model_dump(exclude={"items"})
    batch_data["user_id"] = str(user.id)

    resp = supabase.table("rfq_batches").insert(batch_data).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create RFQ batch")

    if body.items:
        items_data = [
            {**item.model_dump(), "rfq_batch_id": body.id}
            for item in body.items
        ]
        supabase.table("rfq_batch_items").insert(items_data).execute()

    return resp.data[0]


@router.get("/{batch_id}")
def get_batch(batch_id: str, user=Depends(get_current_user)):
    resp = (
        supabase.table("rfq_batches")
        .select("*")
        .eq("id", batch_id)
        .eq("user_id", str(user.id))
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="RFQ batch not found")

    batch = resp.data

    batch["items"] = (
        supabase.table("rfq_batch_items").select("*").eq("rfq_batch_id", batch_id).execute().data
    )

    versions_resp = (
        supabase.table("supplier_quote_versions")
        .select("*")
        .eq("rfq_batch_id", batch_id)
        .order("version_number", desc=True)
        .execute()
    )
    versions = versions_resp.data

    for version in versions:
        version["items"] = (
            supabase.table("supplier_quote_items")
            .select("*")
            .eq("quote_version_id", version["id"])
            .execute()
            .data
        )

    batch["quote_versions"] = versions
    return batch


@router.post("/{batch_id}/quote", status_code=201)
def submit_quote(batch_id: str, body: QuoteSubmit, user=Depends(get_current_user)):
    # Verify the batch belongs to this user
    check = (
        supabase.table("rfq_batches")
        .select("id")
        .eq("id", batch_id)
        .eq("user_id", str(user.id))
        .single()
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=404, detail="RFQ batch not found")

    version_data = body.model_dump(exclude={"items"})
    version_data["rfq_batch_id"] = batch_id

    version_resp = supabase.table("supplier_quote_versions").insert(version_data).execute()
    if not version_resp.data:
        raise HTTPException(status_code=500, detail="Failed to create quote version")

    if body.items:
        items_data = [
            {**item.model_dump(), "quote_version_id": body.id}
            for item in body.items
        ]
        supabase.table("supplier_quote_items").insert(items_data).execute()

    return version_resp.data[0]
