"""Insert four same-day simulated events so the month calendar can show them together."""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from seed_sim_events import EMAIL, build_event, load_service_key

API = "http://127.0.0.1:55321"
USER_ID = "38d1654a-b8b3-4de1-baf0-5c0165a849a9"
SHARED_DATE = "2026-10-17"
NAMES = [
    ("Harbour Breakfast", "active", 36),
    ("Garden Luncheon", "active", 80),
    ("Evening Reception", "draft", 140),
    ("Nightcap Session", "active", 48),
]


def request(method: str, path: str, body=None, key: str = ""):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        f"{API}{path}",
        data=data,
        method=method,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation,resolution=merge-duplicates",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode()
        raise SystemExit(f"{method} {path} -> {exc.code}: {detail[:500]}") from exc


def main():
    key = load_service_key()
    now = datetime.now(timezone.utc).isoformat()
    request("DELETE", "/rest/v1/planner_events?event_id=like.evt-sameday-*", key=key)

    rows = []
    for i, (title, status, guests) in enumerate(NAMES):
        evt = build_event(i, datetime.fromisoformat(SHARED_DATE).date())
        evt["id"] = f"evt-sameday-{i + 1:02d}"
        evt["name"] = title
        evt["eventTitle"] = title
        evt["companyName"] = "SIM"
        evt["divisionName"] = ""
        evt["date"] = SHARED_DATE
        evt["endDate"] = SHARED_DATE
        evt["status"] = status
        evt["guestCount"] = guests
        evt["setupDays"] = 0
        evt["strikeDays"] = 0
        evt["jobCode"] = f"EVT-SAMEDAY-2026-{i + 1:04d}"
        evt["createdAt"] = now
        evt["updatedAt"] = now
        cost = evt.pop("_simLineCost")
        rows.append(
            {
                "event_id": evt["id"],
                "user_id": USER_ID,
                "event_data": evt,
                "name": title,
                "event_type": evt["eventType"],
                "event_date": SHARED_DATE,
                "end_date": SHARED_DATE,
                "status": status,
                "guest_count": guests,
                "venue": evt["venue"],
                "country": "ZA",
                "city": evt["city"],
                "currency": "ZAR",
                "total_client_price": round(cost * 1.3, 2),
                "total_supplier_cost": float(cost),
                "margin_percent": 30,
                "moments_count": len(evt["moments"]),
                "line_items_count": len(evt["lineItems"]),
                "last_auto_save_at": now,
                "updated_at": now,
            }
        )

    inserted = request("POST", "/rest/v1/planner_events", rows, key=key)
    print(f"Inserted {len(inserted)} events on {SHARED_DATE} for {EMAIL}")
    for row in inserted:
        print(f"  {row['event_id']}  {row['status']}  {row['name']}")


if __name__ == "__main__":
    main()
