"""Seed a connected supplier demo for local testing.

Creates / updates:
  - supplier@theone.local (SIM Floral Studio)
  - catalog products + special-request settings
  - RFQ invitations from tipodis7@gmail.com events → that supplier

Run:  python scripts/seed_supplier_demo.py
"""
from __future__ import annotations

import json
import secrets
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

API = "http://127.0.0.1:55321"
SERVICE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5OX0."
    "EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
)

COORD_EMAIL = "tipodis7@gmail.com"
SUPPLIER_EMAIL = "supplier@theone.local"
SUPPLIER_PASSWORD = "TestPassword123!"
SUPPLIER_NAME = "SIM Floral Studio"


def load_service_key() -> str:
    backend_env = Path(__file__).resolve().parents[1] / "backend" / ".env"
    if backend_env.exists():
        for line in backend_env.read_text(encoding="utf-8-sig").splitlines():
            if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    for candidate in (
        Path(__file__).resolve().parents[1] / "supabase" / ".temp" / "service_role_key",
        Path(__file__).resolve().parents[1] / "supabase" / ".temp" / "service_key",
    ):
        if candidate.exists():
            return candidate.read_text(encoding="utf-8").strip()
    return SERVICE_KEY


def request(method: str, path: str, body=None, key: str = "", prefer: str = "return=representation"):
    data = None if body is None else json.dumps(body).encode()
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    req = urllib.request.Request(f"{API}{path}", data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode()
        raise SystemExit(f"{method} {path} -> {exc.code}: {detail[:800]}") from exc


def find_user_id(key: str, email: str) -> str | None:
    users = request("GET", "/auth/v1/admin/users?per_page=200", key=key) or {}
    for u in users.get("users", []):
        if (u.get("email") or "").lower() == email.lower():
            return u["id"]
    return None


def ensure_supplier(key: str) -> str:
    existing = find_user_id(key, SUPPLIER_EMAIL)
    if existing:
        request(
            "PUT",
            f"/auth/v1/admin/users/{existing}",
            {
                "password": SUPPLIER_PASSWORD,
                "email_confirm": True,
                "user_metadata": {"full_name": SUPPLIER_NAME, "role": "supplier"},
                "app_metadata": {"role": "supplier"},
            },
            key=key,
        )
        supplier_id = existing
    else:
        created = request(
            "POST",
            "/auth/v1/admin/users",
            {
                "email": SUPPLIER_EMAIL,
                "password": SUPPLIER_PASSWORD,
                "email_confirm": True,
                "user_metadata": {"full_name": SUPPLIER_NAME, "role": "supplier"},
                "app_metadata": {"role": "supplier"},
            },
            key=key,
        )
        supplier_id = created["id"]

    request(
        "POST",
        "/rest/v1/profiles",
        {
            "id": supplier_id,
            "email": SUPPLIER_EMAIL,
            "full_name": SUPPLIER_NAME,
            "role": "supplier",
            "available_roles": ["supplier"],
            "company_name": SUPPLIER_NAME,
            "country": "ZA",
            "city": "Cape Town",
        },
        key=key,
        prefer="return=representation,resolution=merge-duplicates",
    )

    provider_payload = {
        "user_id": supplier_id,
        "business_name": SUPPLIER_NAME,
        "trading_name": SUPPLIER_NAME,
        "business_type": "florist",
        "business_description": "Premium floral design for weddings and corporate events.",
        "country": "ZA",
        "city": "Cape Town",
        "selected_event_types": ["wedding", "corporate", "celebration"],
        "selected_categories": {"florals": True, "styling": True},
        "accepts_special_requests": True,
        "special_request_notes": "Bespoke installations available with 10+ days lead time.",
        "is_active": True,
    }
    existing_provider = request(
        "GET",
        f"/rest/v1/service_providers?user_id=eq.{supplier_id}&select=id",
        key=key,
    ) or []
    if existing_provider:
        request(
            "PATCH",
            f"/rest/v1/service_providers?user_id=eq.{supplier_id}",
            provider_payload,
            key=key,
        )
    else:
        request("POST", "/rest/v1/service_providers", provider_payload, key=key)
    return supplier_id


def seed_catalog(key: str, supplier_id: str) -> None:
    request("DELETE", f"/rest/v1/supplier_products?user_id=eq.{supplier_id}", key=key, prefer="")
    products = [
        ("Bridal Bouquet — Soft Blush", "Seasonal roses, ranunculus, and eucalyptus.", "Bouquets", 1850, 12, "Blush"),
        ("Centrepiece — Low Garden", "Low arrangement for round tables, candle-friendly.", "Centrepieces", 980, 40, "Ivory"),
        ("Ceremony Arch Install", "Full floral arch with trailing greenery.", "Installations", 12500, None, "Mixed"),
        ("Guest Boutonniere", "Classic rose boutonniere with silk wrap.", "Wearables", 180, 80, "White"),
        ("Welcome Arrangement", "Large foyer statement piece.", "Installations", 4200, 6, "Soft peach"),
    ]
    rows = []
    for i, (name, desc, cat, price, qty, color) in enumerate(products):
        rows.append(
            {
                "user_id": supplier_id,
                "name": name,
                "description": desc,
                "category": cat,
                "unit_price": price,
                "currency": "ZAR",
                "quantity_available": qty,
                "color": color,
                "is_active": True,
                "sort_order": i,
            }
        )
    request("POST", "/rest/v1/supplier_products", rows, key=key)


def pick_event_items(event_data: dict, limit: int = 3) -> list[dict]:
    items = event_data.get("lineItems") or []
    if not items:
        return []
    return items[:limit]


def seed_invitations(key: str, coord_id: str, supplier_id: str) -> int:
    events = request(
        "GET",
        f"/rest/v1/planner_events?user_id=eq.{coord_id}&select=event_id,name,event_date,city,country,currency,event_data&order=event_date.asc&limit=6",
        key=key,
    ) or []
    if not events:
        print("No coordinator events found — run seed_sim_events / same-day demo first.")
        return 0

    # Clear previous demo invites for this supplier email
    request(
        "DELETE",
        f"/rest/v1/rfq_batches?supplier_email=eq.{SUPPLIER_EMAIL}&id=like.rfq-demo-*",
        key=key,
        prefer="",
    )

    now = datetime.now(timezone.utc).isoformat()
    created = 0
    for idx, ev in enumerate(events[:4]):
        data = ev.get("event_data") or {}
        line_items = pick_event_items(data, 3 if idx < 2 else 2)
        if not line_items:
            # Synthetic items when event has none
            line_items = [
                {"id": f"li-demo-{uuid4().hex[:6]}", "name": "Floral centrepieces", "quantity": 12, "category": "florals", "notes": ""},
                {"id": f"li-demo-{uuid4().hex[:6]}", "name": "Bridal bouquet", "quantity": 1, "category": "florals", "notes": "Soft blush palette"},
            ]

        batch_id = f"rfq-demo-{idx + 1:02d}-{uuid4().hex[:6]}"
        token = secrets.token_urlsafe(18)
        # 0 pending (supplier can accept), 1 accepted, 2 declined, 3 pending
        invitation_response = {1: "accepted", 2: "declined"}.get(idx)

        event_context = {
            "currency": ev.get("currency") or data.get("currency") or "ZAR",
            "vatRate": data.get("vatRate", 0.15),
            "defaultPricesIncludeVat": data.get("defaultPricesIncludeVat", True),
            "moments": [{"id": m.get("id"), "name": m.get("name"), "venueSpaceId": m.get("venueSpaceId") or ""} for m in (data.get("moments") or [])],
            "venueSpaces": [{"id": s.get("id"), "name": s.get("name")} for s in (data.get("venueSpaces") or [])],
            "city": ev.get("city") or data.get("city") or "",
            "country": ev.get("country") or data.get("country") or "ZA",
            "date": ev.get("event_date") or data.get("date") or "",
            "quoteNumber": data.get("quoteNumber") or f"Q-DEMO-{idx + 1:03d}",
        }

        batch_row = {
            "id": batch_id,
            "event_id": ev["event_id"],
            "user_id": coord_id,
            "supplier_name": SUPPLIER_NAME,
            "supplier_email": SUPPLIER_EMAIL,
            "status": "SENT",
            "portal_token": token,
            "message_to_supplier": (
                "Please quote on the floral package for this event. Soft blush palette preferred."
                if idx == 0
                else "Looking forward to your availability for the install."
            ),
            "include_vat_info": True,
            "include_moment_space_context": True,
            "current_supplier_draft_version": 0,
            "current_submitted_version": 0,
            "event_context": event_context,
            "sent_at": now,
            "created_at": now,
            "invitation_response": invitation_response,
            "invitation_responded_at": now if invitation_response else None,
        }
        request("POST", "/rest/v1/rfq_batches", batch_row, key=key)

        item_rows = []
        for j, li in enumerate(line_items):
            moment_id = li.get("momentId") or ""
            item_rows.append(
                {
                    "id": f"rbi-demo-{idx + 1:02d}-{j + 1}-{uuid4().hex[:5]}",
                    "rfq_batch_id": batch_id,
                    "line_item_id": li.get("id") or f"li-{uuid4().hex[:8]}",
                    "item_name_snapshot": li.get("name") or f"Item {j + 1}",
                    "qty_snapshot": li.get("quantity") or 1,
                    "unit_type_snapshot": "EACH",
                    "moment_id_snapshot": moment_id,
                    "space_id_snapshot": "",
                    "installation_label_snapshot": "",
                    "item_notes_snapshot": li.get("notes") or li.get("clientVisibleNotes") or "",
                    "category_snapshot": li.get("category") or "Florals",
                    "created_at": now,
                }
            )
        request("POST", "/rest/v1/rfq_batch_items", item_rows, key=key)

        if invitation_response == "accepted":
            request(
                "POST",
                "/rest/v1/rfq_messages",
                {
                    "id": f"rfqm-demo-accept-{uuid4().hex[:8]}",
                    "rfq_batch_id": batch_id,
                    "sender_type": "system",
                    "sender_name": "Automated Notice",
                    "body": f"✅ {SUPPLIER_NAME} accepted this invitation and will prepare a quote.",
                    "read_by_coordinator": False,
                    "read_by_supplier": True,
                },
                key=key,
            )
        elif invitation_response == "declined":
            request(
                "POST",
                "/rest/v1/rfq_messages",
                {
                    "id": f"rfqm-demo-decline-{uuid4().hex[:8]}",
                    "rfq_batch_id": batch_id,
                    "sender_type": "system",
                    "sender_name": "Automated Notice",
                    "body": f"❌ {SUPPLIER_NAME} declined this invitation.",
                    "read_by_coordinator": False,
                    "read_by_supplier": True,
                },
                key=key,
            )
        else:
            request(
                "POST",
                "/rest/v1/rfq_messages",
                {
                    "id": f"rfqm-demo-hello-{uuid4().hex[:8]}",
                    "rfq_batch_id": batch_id,
                    "sender_type": "coordinator",
                    "sender_name": "Tipo Dis",
                    "body": "Hi — please confirm if you can take this floral package.",
                    "read_by_coordinator": True,
                    "read_by_supplier": False,
                },
                key=key,
            )

        created += 1
        print(f"  {batch_id}  {ev.get('name')}  response={invitation_response or 'pending'}")

    return created


def main():
    key = load_service_key()
    coord_id = find_user_id(key, COORD_EMAIL)
    if not coord_id:
        raise SystemExit(f"Coordinator {COORD_EMAIL} not found. Seed coordinator events first.")

    supplier_id = ensure_supplier(key)
    seed_catalog(key, supplier_id)
    n = seed_invitations(key, coord_id, supplier_id)

    print(f"\nSupplier ready: {SUPPLIER_EMAIL} / {SUPPLIER_PASSWORD}")
    print(f"Business: {SUPPLIER_NAME} ({supplier_id})")
    print(f"Invitations linked to {COORD_EMAIL}: {n}")
    print("Open supplier view as supplier@theone.local; coordinator sourcing will show accept/decline badges.")


if __name__ == "__main__":
    main()
