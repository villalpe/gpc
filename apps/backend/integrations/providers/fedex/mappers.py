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


def build_fedex_shipment_request(data: dict, account_number: str) -> dict:
    sender = data["sender"]
    recipient = data["recipient"]
    payment_type = data["payment_type"]
    payer_account = account_number if payment_type == "SENDER" else data["payment_account_number"]

    def contact(value):
        return {
            "companyName": value["company_name"],
            "personName": value["person_name"],
            "phoneNumber": value["phone_number"],
            "emailAddress": value.get("email_address", ""),
        }

    def address(value):
        return {
            "streetLines": value["street_lines"],
            "city": value["city"],
            "stateOrProvinceCode": value["state"],
            "postalCode": value["postal_code"],
            "countryCode": value["country_code"].upper(),
        }

    packages = data["packages"]
    international = (
        sender["country_code"].upper() != recipient["country_code"].upper()
    )
    requested_packages = []
    commodities = []
    total_customs_value = 0
    customs_currency = None

    for index, package in enumerate(packages, start=1):
        requested_packages.append(
            {
                "sequenceNumber": index,
                "groupPackageCount": package["quantity"],
                "weight": {
                    "units": package["weight_units"],
                    "value": float(package["weight"]),
                },
                "dimensions": {
                    "length": float(package["length"]),
                    "width": float(package["width"]),
                    "height": float(package["height"]),
                    "units": package["dimension_units"],
                },
                "customerReferences": [
                    {
                        "customerReferenceType": "CUSTOMER_REFERENCE",
                        "value": data["cb_number"],
                    }
                ],
            }
        )

        if international:
            for item in package.get("customs_items", []):
                currency = item["customs_currency"].upper()
                customs_currency = customs_currency or currency
                total_customs_value += float(item["customs_value"])
                commodities.append(
                    {
                        "description": item["description"],
                        "countryOfManufacture": item["origin_country"].upper(),
                        "harmonizedCode": item["hs_code"],
                        "quantity": item["quantity"],
                        "quantityUnits": "EA",
                        "unitPrice": {
                            "amount": float(item["customs_value"]) / item["quantity"],
                            "currency": currency,
                        },
                        "customsValue": {
                            "amount": float(item["customs_value"]),
                            "currency": currency,
                        },
                        "weight": {
                            "units": item["weight_units"],
                            "value": float(item["weight"]),
                        },
                    }
                )

    requested_shipment = {
        "shipDatestamp": data["ship_date"].isoformat(),
        "pickupType": data["pickup_type"],
        "serviceType": data["service_type"],
        "packagingType": data["packaging_type"],
        "shipper": {
            "contact": contact(sender),
            "address": address(sender),
        },
        "recipients": [
            {
                "contact": contact(recipient),
                "address": address(recipient),
            }
        ],
        "shippingChargesPayment": {
            "paymentType": payment_type,
            "payor": {
                "responsibleParty": {
                    "accountNumber": {"value": payer_account},
                }
            },
        },
        "labelSpecification": {
            "imageType": "PDF",
            "labelStockType": "PAPER_4X6",
        },
        "requestedPackageLineItems": requested_packages,
        "totalPackageCount": sum(package["quantity"] for package in packages),
    }

    if commodities:
        duties_payment_type = data["duties_payment_type"]
        duties_account = (
            account_number
            if duties_payment_type == "SENDER"
            else data["duties_account_number"]
        )
        requested_shipment["customsClearanceDetail"] = {
            "dutiesPayment": {
                "paymentType": duties_payment_type,
                "payor": {
                    "responsibleParty": {
                        "accountNumber": {"value": duties_account},
                    }
                },
            },
            "commodities": commodities,
            "totalCustomsValue": {
                "amount": total_customs_value,
                "currency": customs_currency,
            },
        }

    return {
        "labelResponseOptions": "LABEL",
        "accountNumber": {"value": account_number},
        "requestedShipment": requested_shipment,
    }


def map_fedex_shipment(raw: dict, cb_number: str) -> dict:
    shipment = (raw.get("output", {}).get("transactionShipments") or [{}])[0]
    piece_responses = shipment.get("pieceResponses") or []
    labels = []

    for index, piece in enumerate(piece_responses, start=1):
        for document in piece.get("packageDocuments") or []:
            encoded = document.get("encodedLabel")
            if encoded:
                labels.append(
                    {
                        "file_name": f"{cb_number}-fedex-label-{index}.pdf",
                        "content_base64": encoded,
                    }
                )

    if not labels:
        for document in shipment.get("shipmentDocuments") or []:
            encoded = document.get("encodedLabel")
            if encoded and document.get("docType", "").upper() == "LABEL":
                labels.append(
                    {
                        "file_name": f"{cb_number}-fedex-label.pdf",
                        "content_base64": encoded,
                    }
                )

    tracking_numbers = [
        piece.get("trackingNumber")
        for piece in piece_responses
        if piece.get("trackingNumber")
    ]
    master_tracking = shipment.get("masterTrackingId") or {}
    master_tracking_number = (
        master_tracking.get("trackingNumber")
        if isinstance(master_tracking, dict)
        else None
    )
    tracking_number = tracking_numbers[0] if tracking_numbers else master_tracking_number

    return {
        "provider": "fedex",
        "cb_number": cb_number,
        "tracking_number": tracking_number or "",
        "tracking_numbers": tracking_numbers or ([tracking_number] if tracking_number else []),
        "labels": labels,
        "warning": (
            "FedEx aceptó la solicitud, pero no se pudo identificar la guía o "
            "la etiqueta en la respuesta. "
            "No vuelvas a crear el envío hasta verificarlo en FedEx."
            if not tracking_number or not labels
            else ""
        ),
    }