from datetime import datetime

# derivedCode/status code mapping (FedEx track)
# IN = In transit, DL = Delivered, DE = Delivery exception, etc.
FEDEX_DERIVED_CODE_MAP = {
    "OC": "label_created",          # Order Created / info sent
    "AR": "picked_up",              # At pickup location / accepted (depende flujo)
    "PU": "picked_up",
    "DP": "in_transit",             # Departed
    "IT": "in_transit",
    "IN": "in_transit",
    "OD": "out_for_delivery",
    "OF": "out_for_delivery",
    "DL": "delivered",
    "DE": "exception",
    "SE": "exception",
    "CA": "exception",
    "RS": "available_for_pickup",
}

def _safe_get(dct, *keys, default=None):
    cur = dct
    for k in keys:
        if not isinstance(cur, dict):
            return default
        cur = cur.get(k)
        if cur is None:
            return default
    return cur

def _parse_dt(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).isoformat()
    except Exception:
        return None

def map_fedex_tracking(raw: dict, tracking_number: str) -> dict:
    tr = (
        raw.get("output", {})
           .get("completeTrackResults", [{}])[0]
           .get("trackResults", [{}])[0]
    )

    latest = tr.get("latestStatusDetail", {}) or {}
    latest_code = (latest.get("derivedCode") or latest.get("code") or "UNKNOWN").upper()
    status = FEDEX_DERIVED_CODE_MAP.get(latest_code, "unknown")

    # estimated delivery (si viene)
    estimated_delivery = None
    for item in tr.get("dateAndTimes", []) or []:
        if item.get("type") in ("ESTIMATED_DELIVERY", "ACTUAL_DELIVERY"):
            estimated_delivery = _parse_dt(item.get("dateTime"))
            if estimated_delivery:
                break

    signed_by = _safe_get(tr, "deliveryDetails", "receivedByName")

    events = []
    for e in tr.get("scanEvents", []) or []:
        city = _safe_get(e, "scanLocation", "city") or ""
        state = _safe_get(e, "scanLocation", "stateOrProvinceCode") or ""
        country = _safe_get(e, "scanLocation", "countryCode") or ""
        location = ", ".join([x for x in [city, state, country] if x]) or None

        event_code = (
            e.get("derivedStatusCode") or e.get("eventType") or e.get("derivedStatus") or ""
        ).upper()
        desc = e.get("eventDescription") or e.get("derivedStatus") or e.get("exceptionDescription")

        events.append({
            "code": event_code or None,
            "description": desc,
            "location": location,
            "timestamp": _parse_dt(e.get("date")),
        })

    # fallback: si no hay scanEvents, usa latestStatusDetail como un evento
    if not events and latest:
        city = _safe_get(latest, "scanLocation", "city") or ""
        state = _safe_get(latest, "scanLocation", "stateOrProvinceCode") or ""
        country = _safe_get(latest, "scanLocation", "countryCode") or ""
        location = ", ".join([x for x in [city, state, country] if x]) or None

        events = [{
            "code": latest.get("derivedCode") or latest.get("code"),
            "description": latest.get("description") or latest.get("statusByLocale"),
            "location": location,
            "timestamp": None,
        }]

    delivered_at = None
    if status == "delivered":
        delivered_at = next(
            (ev["timestamp"] for ev in events if (ev.get("code") or "").upper() == "DL"),
            None
        ) or estimated_delivery

    return {
        "provider": "fedex",
        "tracking_number": tracking_number,
        "status": status,
        "substatus": (latest.get("statusByLocale") or latest_code).lower().replace(" ", "_"),
        "estimated_delivery": estimated_delivery,
        "delivered_at": delivered_at,
        "signed_by": signed_by,
        "events": events,
    }