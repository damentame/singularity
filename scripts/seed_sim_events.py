"""Seed 30 simulated planner events for tipodis7@gmail.com into local Supabase."""
from __future__ import annotations

import json
import math
import re
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

API = "http://127.0.0.1:54321"
SERVICE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5OX0."
    "EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
)
EMAIL = "tipodis7@gmail.com"
PASSWORD = "TestPassword123!"

EVENT_TYPES = ["wedding", "corporate", "celebration"]
VENUES = [
    ("Waterfall Manor Estate", "Johannesburg", "Gauteng"),
    ("Sandton Convention Centre", "Johannesburg", "Gauteng"),
    ("The Twelve Apostles Hotel", "Cape Town", "Western Cape"),
    ("Spier Wine Farm", "Stellenbosch", "Western Cape"),
    ("Durban ICC", "Durban", "KwaZulu-Natal"),
    ("Mount Edgecombe Country Club", "Umhlanga", "KwaZulu-Natal"),
    ("Kyalami Grand Prix Circuit Pavilion", "Midrand", "Gauteng"),
    ("V&A Waterfront Ballroom", "Cape Town", "Western Cape"),
]
CLIENTS = [
    ("Emma Sterling", "emma.sterling@example.com", "Sterling Family"),
    ("Sipho Dlamini", "sdlamini@apexgroup.co.za", "Apex Group Holdings"),
    ("Priya Naidoo", "priya.naidoo@example.com", "Naidoo Celebrations"),
    ("James Okonkwo", "j.okonkwo@meridian.co.za", "Meridian Tech"),
    ("Lerato Molefe", "lerato@sunrise.co.za", "Sunrise Events Client"),
    ("Chen Wei", "chen.wei@pacific.co.za", "Pacific Trading"),
]
STATUSES = ["draft", "active", "active", "active", "completed"]
NAMES = [
    "Garden Ceremony",
    "Leadership Summit",
    "Anniversary Gala",
    "Product Launch Evening",
    "Family Reunion Dinner",
    "Client Appreciation Night",
    "Spring Wedding Weekend",
    "Board Strategy Offsite",
    "Charity Fundraiser Ball",
    "Team Away Day",
    "Engagement Cocktail",
    "Year-End Awards",
    "Birthday Soirée",
    "Brand Activation",
    "Cultural Festival Dinner",
]


def api(method: str, path: str, body: dict | None = None, key: str = SERVICE_KEY):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        f"{API}{path}",
        data=data,
        method=method,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    with urllib.request.urlopen(req) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else None


def ensure_user() -> str:
    users = api("GET", f"/auth/v1/admin/users")
    for u in users.get("users", []):
        if (u.get("email") or "").lower() == EMAIL.lower():
            return u["id"]
    created = api(
        "POST",
        "/auth/v1/admin/users",
        {
            "email": EMAIL,
            "password": PASSWORD,
            "email_confirm": True,
            "user_metadata": {"full_name": "Tipo Dis", "role": "coordinator"},
        },
    )
    return created["id"]


def spaced_dates(count: int) -> list[date]:
    start = date(2026, 9, 24)  # next week from 2026-09-17
    end = date(2027, 9, 30)
    span = (end - start).days
    return [start + timedelta(days=round(i * span / (count - 1))) for i in range(count)]


def build_event(i: int, event_date: date) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    eid = f"evt-sim-{i + 1:02d}-{uuid4().hex[:8]}"
    etype = EVENT_TYPES[i % len(EVENT_TYPES)]
    venue, city, region = VENUES[i % len(VENUES)]
    client_name, client_email, company = CLIENTS[i % len(CLIENTS)]
    status = STATUSES[i % len(STATUSES)]
    base_name = NAMES[i % len(NAMES)]
    name = f"{base_name} #{i + 1:02d}"
    guests = 40 + (i * 7) % 180
    end = event_date if etype != "corporate" else event_date + timedelta(days=1)
    mom1 = f"mom-{uuid4().hex[:8]}"
    mom2 = f"mom-{uuid4().hex[:8]}"
    unit = 250 + (i * 37) % 900
    line_cost = unit * max(1, guests // 10)

    return {
        "id": eid,
        "name": name,
        "eventTitle": name,
        "date": event_date.isoformat(),
        "endDate": end.isoformat(),
        "eventType": etype,
        "clientDetails": {
            "name": client_name,
            "email": client_email,
            "phone": f"+27 82 555 {1000 + i:04d}",
            "address": f"{10 + i} Demo Street, {city}",
            "company": company if etype == "corporate" else "",
            "notes": f"Simulated event {i + 1} for load testing.",
        },
        "clientAccountId": "",
        "venue": venue,
        "venueType": "other",
        "country": "ZA",
        "region": region,
        "city": city,
        "venueSpaces": [
            {"id": f"vs-{uuid4().hex[:8]}", "name": "Main Hall", "capacity": guests + 20, "notes": ""}
        ],
        "moments": [
            {"id": mom1, "name": "Welcome / Arrival", "startTime": "10:00", "endTime": "12:00", "notes": ""},
            {"id": mom2, "name": "Main Programme", "startTime": "14:00", "endTime": "22:00", "notes": ""},
        ],
        "guestCount": guests,
        "status": status,
        "currency": "ZAR",
        "vatRate": 0.15,
        "vatName": "VAT",
        "defaultPricesIncludeVat": False,
        "vatEnabled": True,
        "billingCountry": "ZA",
        "billingCurrency": "ZAR",
        "showPricing": False,
        "jobCode": f"EVT-SIM-{2026 + (1 if event_date.year >= 2027 else 0)}-{i + 1:04d}",
        "companyName": "SIM",
        "divisionName": "",
        "lineItems": [
            {
                "id": f"li-{uuid4().hex[:8]}",
                "name": "Core Package",
                "category": "catering",
                "quantity": max(1, guests // 10),
                "isGuestDependent": False,
                "guestRatio": 1,
                "unitCost": unit,
                "setupCost": 0,
                "breakdownCost": 0,
                "deliveryCost": 0,
                "deliveryType": "flat",
                "markupPercent": 30,
                "flagged": False,
                "notes": "",
                "rfqSent": False,
                "rfqJobCode": "",
                "momentId": mom2,
                "timeType": "normal",
                "imageUrl": "",
                "productId": "",
                "programId": "",
                "internalNotes": "",
                "clientVisibleNotes": "",
                "specIds": [],
                "supplierAssignmentId": "",
                "supplierPriceIncludesVat": False,
                "vatRateUsed": 0.15,
                "isDryHire": False,
            }
        ],
        "supplierAssignments": [],
        "tasks": [],
        "rfqMessages": [],
        "versions": [],
        "currentVersion": 1,
        "specs": [],
        "shoppingLists": [],
        "salesOrders": [],
        "supplierQuotes": [],
        "approvalRequests": [],
        "budgetLines": [],
        "activityLog": [],
        "programs": [],
        "backupVenue": "",
        "backupVenueSpaces": [],
        "createdAt": now,
        "updatedAt": now,
        "_simLineCost": line_cost,
    }


def load_service_key() -> str:
    for name in ("_env.txt",):
        env_path = Path(__file__).with_name(name)
        if env_path.exists():
            text = env_path.read_text(encoding="utf-8", errors="ignore")
            m = re.search(r'SERVICE_ROLE_KEY="([^"]+)"', text, re.S)
            if m:
                return m.group(1).replace("\n", "").replace("\r", "")
    backend_env = Path(__file__).resolve().parents[1] / "backend" / ".env"
    if backend_env.exists():
        for line in backend_env.read_text(encoding="utf-8-sig").splitlines():
            if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return SERVICE_KEY


def main():
    global SERVICE_KEY
    SERVICE_KEY = load_service_key()
    user_id = ensure_user()
    print(f"User: {EMAIL} -> {user_id}")

    dates = spaced_dates(30)
    rows = []
    for i, d in enumerate(dates):
        evt = build_event(i, d)
        cost = evt.pop("_simLineCost")
        client_price = round(cost * 1.3, 2)
        rows.append(
            {
                "event_id": evt["id"],
                "user_id": user_id,
                "event_data": evt,
                "name": evt["name"],
                "event_type": evt["eventType"],
                "event_date": evt["date"],
                "end_date": evt["endDate"],
                "status": evt["status"],
                "guest_count": evt["guestCount"],
                "venue": evt["venue"],
                "country": evt["country"],
                "city": evt["city"],
                "currency": evt["currency"],
                "total_client_price": client_price,
                "total_supplier_cost": float(cost),
                "margin_percent": 30,
                "moments_count": len(evt["moments"]),
                "line_items_count": len(evt["lineItems"]),
                "last_auto_save_at": evt["updatedAt"],
                "updated_at": evt["updatedAt"],
            }
        )

    # Clear previous simulated events for this user (keep non-sim)
    # Delete all for clean demo set
    req = urllib.request.Request(
        f"{API}/rest/v1/planner_events?user_id=eq.{user_id}",
        method="DELETE",
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
        },
    )
    with urllib.request.urlopen(req):
        pass

    # Insert in batches
    batch = 10
    for start in range(0, len(rows), batch):
        chunk = rows[start : start + batch]
        api("POST", "/rest/v1/planner_events", chunk)
        print(f"Inserted {start + len(chunk)}/{len(rows)}")

    # Verify
    count_req = urllib.request.Request(
        f"{API}/rest/v1/planner_events?user_id=eq.{user_id}&select=event_id,name,event_date",
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
        },
    )
    with urllib.request.urlopen(count_req) as resp:
        data = json.loads(resp.read().decode())
    print(f"Total planner_events for user: {len(data)}")
    print(f"Date range: {data[0]['event_date'] if data else '?'} .. {data[-1]['event_date'] if data else '?'}")
    print(f"Login: {EMAIL} / {PASSWORD}")


if __name__ == "__main__":
    main()
