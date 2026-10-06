from datetime import datetime
from decimal import Decimal, InvalidOperation

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


VALID_RATE_STATUSES = ("approved", "price_found_internal", "price_found_external")

PRICE_FIELDS = ("price", "price_breakdown", "total_value_with_protection")


def _to_decimal(value):
    if value is None or value == "":
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None


def map_rate(rate: dict):
    """Normaliza una tarifa de Skydropx; regresa None si no es utilizable."""
    if not rate or rate.get("success") is not True:
        return None
    if rate.get("status") not in VALID_RATE_STATUSES:
        return None

    pickup = bool(rate.get("pickup"))
    office_pickup = bool(rate.get("office_pickup"))
    if pickup:
        pickup_type = "pickup"
    elif office_pickup:
        pickup_type = "dropoff"
    else:
        pickup_type = None

    packaging_type = rate.get("packaging_type")
    mode = "freight" if str(packaging_type).strip().lower() == "pallet" else "parcel"

    return {
        "rate_id": rate.get("id"),
        "carrier": rate.get("provider_display_name"),
        "carrier_code": rate.get("provider_name"),
        "service": rate.get("provider_service_name"),
        "service_code": rate.get("provider_service_code"),
        "estimated_days": rate.get("days"),
        "pickup_type": pickup_type,
        "pickup_available": pickup,
        "office_pickup_available": office_pickup,
        "delivery_type": "ocurre" if rate.get("office_delivery") else "home",
        "packaging_type": packaging_type,
        "mode": mode,
        "fulfillment_level": None,
        "requires_origin_verification": bool(rate.get("requires_origin_verification")),
        "price": _to_decimal(rate.get("total")),
        "price_breakdown": {
            "amount": _to_decimal(rate.get("amount")),
            "vat_fee": _to_decimal(rate.get("vat_fee")),
            "service_fee": _to_decimal(rate.get("service_fee")),
            "extra_fees": rate.get("extra_fees") or [],
            "currency_code": rate.get("currency_code"),
        },
        "total_value_with_protection": _to_decimal(rate.get("total_value_with_protection")),
    }


def map_quotation_rates(raw: dict) -> list:
    options = [map_rate(r) for r in (raw or {}).get("rates", []) or []]
    return [o for o in options if o]
