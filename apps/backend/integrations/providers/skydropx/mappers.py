from datetime import datetime


SKYDROPX_TRACKING_STATUS_MAP = {
    "label_created": "label_created",
    "pre_transit": "label_created",
    "info_received": "label_created",

    "picked_up": "picked_up",
    "in_transit": "in_transit",
    "on_route": "in_transit",
    "out_for_delivery": "out_for_delivery",
    "delivered": "delivered",

    "exception": "exception",
    "failed_attempt": "failed_attempt",
    "available_for_pickup": "available_for_pickup",
    "returned": "exception",
    "cancelled": "exception",
    "canceled": "exception",
}


def _parse_dt(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).isoformat()
    except Exception:
        return None


def _canon_status(raw_status: str) -> str:
    if not raw_status:
        return "unknown"
    key = str(raw_status).strip().lower().replace(" ", "_")
    return SKYDROPX_TRACKING_STATUS_MAP.get(key, "unknown")


def _index_included_packages(raw: dict) -> dict:
    """
    Regresa dict package_id -> package_attributes
    """
    out = {}
    for inc in raw.get("included", []) or []:
        if inc.get("type") == "package":
            out[str(inc.get("id"))] = inc.get("attributes", {}) or {}
    return out


def _get_first_package_attrs(item: dict, packages_index: dict) -> dict:
    rel = item.get("relationships", {}) or {}
    p = (rel.get("packages", {}) or {}).get("data", []) or []
    if not p:
        return {}

    first_pkg_id = str((p[0] or {}).get("id"))
    return packages_index.get(first_pkg_id, {})


def map_skydropx_shipment(item: dict, packages_index: dict) -> dict:
    attrs = item.get("attributes", {}) or {}
    shipment_id = str(item.get("id"))

    pkg = _get_first_package_attrs(item, packages_index)

    tracking_number = pkg.get("tracking_number") or shipment_id
    raw_tracking_status = pkg.get("tracking_status")
    raw_tracking_display = pkg.get("tracking_status_display_name")

    # fallback operativo (si package no trae tracking_status)
    workflow_status = attrs.get("workflow_status")
    substatus = raw_tracking_status or raw_tracking_display or workflow_status or "unknown"

    status = _canon_status(raw_tracking_status)
    if status == "unknown" and str(workflow_status).lower() == "success":
        status = "label_created"

    estimated_delivery = (
        _parse_dt(attrs.get("estimated_delivery_date"))
        or _parse_dt(attrs.get("estimated_delivery"))
        or _parse_dt(attrs.get("eta"))
    )

    delivered_at = (
        _parse_dt(attrs.get("delivered_at"))
        or _parse_dt(attrs.get("delivery_date"))
        or (_parse_dt(pkg.get("updated_at")) if status == "delivered" else None)
    )

    return {
        "provider": "skydropx",
        "shipment_id": shipment_id,
        "tracking_number": str(tracking_number) if tracking_number else None,
        "carrier": attrs.get("carrier_name"),
        "status": status,
        "substatus": str(substatus).strip().lower().replace(" ", "_"),
        "estimated_delivery": estimated_delivery,
        "delivered_at": delivered_at,
        "signed_by": None,
        "events": [],
        "tracking_url": pkg.get("tracking_url_provider"),
        "label_url": pkg.get("label_url"),
    }


def map_skydropx_shipments_list(raw: dict) -> dict:
    packages_index = _index_included_packages(raw)
    data = raw.get("data", []) or []
    normalized = [map_skydropx_shipment(item, packages_index) for item in data]

    return {
        "provider": "skydropx",
        "count": len(normalized),
        "results": normalized,
        "meta": raw.get("meta", {}),
    }