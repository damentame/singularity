"""Seed 30 simulated planner_events via direct Postgres (docker)."""
from __future__ import annotations

import json
import subprocess
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

USER_ID = "38d1654a-b8b3-4de1-baf0-5c0165a849a9"
EMAIL = "tipodis7@gmail.com"

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
    "Garden Ceremony", "Leadership Summit", "Anniversary Gala", "Product Launch Evening",
    "Family Reunion Dinner", "Client Appreciation Night", "Spring Wedding Weekend",
    "Board Strategy Offsite", "Charity Fundraiser Ball", "Team Away Day",
    "Engagement Cocktail", "Year-End Awards", "Birthday Soirée", "Brand Activation",
    "Cultural Festival Dinner",
]


def spaced_dates(count: int) -> list[date]:
    start = date(2026, 9, 24)
    end = date(2027, 9, 30)
    span = (end - start).days
    return [start + timedelta(days=round(i * span / (count - 1))) for i in range(count)]


def build_event(i: int, event_date: date) -> tuple[dict, float]:
    now = datetime.now(timezone.utc).isoformat()
    eid = f"evt-sim-{i + 1:02d}-{uuid4().hex[:8]}"
    etype = EVENT_TYPES[i % len(EVENT_TYPES)]
    venue, city, region = VENUES[i % len(VENUES)]
    client_name, client_email, company = CLIENTS[i % len(CLIENTS)]
    status = STATUSES[i % len(STATUSES)]
    name = f"{NAMES[i % len(NAMES)]} #{i + 1:02d}"
    guests = 40 + (i * 7) % 180
    end = event_date if etype != "corporate" else event_date + timedelta(days=1)
    mom1 = f"mom-{uuid4().hex[:8]}"
    mom2 = f"mom-{uuid4().hex[:8]}"
    unit = 250 + (i * 37) % 900
    qty = max(1, guests // 10)
    cost = float(unit * qty)

    evt = {
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
        "venueSpaces": [{"id": f"vs-{uuid4().hex[:8]}", "name": "Main Hall", "capacity": guests + 20, "notes": ""}],
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
        "jobCode": f"EVT-SIM-{event_date.year}-{i + 1:04d}",
        "companyName": "SIM",
        "divisionName": "",
        "lineItems": [{
            "id": f"li-{uuid4().hex[:8]}",
            "name": "Core Package",
            "category": "catering",
            "quantity": qty,
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
        }],
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
    }
    return evt, cost


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main():
    dates = spaced_dates(30)
    statements = [
        f"DELETE FROM public.planner_events WHERE user_id = '{USER_ID}';",
    ]

    for i, d in enumerate(dates):
        evt, cost = build_event(i, d)
        client_price = round(cost * 1.3, 2)
        payload = json.dumps(evt, ensure_ascii=False)
        statements.append(
            "INSERT INTO public.planner_events ("
            "event_id, user_id, event_data, name, event_type, event_date, end_date, status, "
            "guest_count, venue, country, city, currency, total_client_price, total_supplier_cost, "
            "margin_percent, moments_count, line_items_count, last_auto_save_at, updated_at"
            ") VALUES ("
            f"{sql_literal(evt['id'])}, '{USER_ID}', {sql_literal(payload)}::jsonb, "
            f"{sql_literal(evt['name'])}, {sql_literal(evt['eventType'])}, "
            f"{sql_literal(evt['date'])}::date, {sql_literal(evt['endDate'])}::date, "
            f"{sql_literal(evt['status'])}, {evt['guestCount']}, {sql_literal(evt['venue'])}, "
            f"{sql_literal(evt['country'])}, {sql_literal(evt['city'])}, {sql_literal(evt['currency'])}, "
            f"{client_price}, {cost}, 30, {len(evt['moments'])}, {len(evt['lineItems'])}, "
            f"{sql_literal(evt['updatedAt'])}::timestamptz, {sql_literal(evt['updatedAt'])}::timestamptz"
            ");"
        )

    statements.append(
        f"SELECT count(*) AS total, min(event_date) AS first_date, max(event_date) AS last_date "
        f"FROM public.planner_events WHERE user_id = '{USER_ID}';"
    )

    sql_path = Path(__file__).with_name("seed_sim_events.sql")
    sql_path.write_text("\n".join(statements), encoding="utf-8")

    # Copy into container and execute
    subprocess.check_call(
        ["docker", "cp", str(sql_path), "supabase_db_singularity:/tmp/seed_sim_events.sql"]
    )
    out = subprocess.check_output(
        [
            "docker",
            "exec",
            "supabase_db_singularity",
            "psql",
            "-U",
            "postgres",
            "-v",
            "ON_ERROR_STOP=1",
            "-f",
            "/tmp/seed_sim_events.sql",
        ],
        text=True,
    )
    print(out)
    print(f"Seeded 30 events for {EMAIL} ({USER_ID})")
    print("Login password (local): TestPassword123!")


if __name__ == "__main__":
    main()
