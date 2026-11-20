import math


def build_rate_request(data, account_number):
    def address(party):
        result = {
            "countryCode": party["country_code"].upper(),
            "postalCode": party["postal_code"],
        }
        if party.get("city"):
            result["city"] = party["city"]
        if party.get("state"):
            result["stateOrProvinceCode"] = party["state"]
        return result

    packages = []
    for package in data["packages"]:
        # Send each physical package explicitly so no units are omitted.
        for _ in range(package["quantity"]):
            packages.append({
                "weight": {"units": package["weight_units"], "value": float(package["weight"])},
                "dimensions": {
                    "length": package["length"],
                    "width": package["width"],
                    "height": package["height"],
                    "units": package["dimension_units"],
                },
            })

    return {
        "accountNumber": {"value": account_number},
        "rateRequestControlParameters": {"returnTransitTimes": True},
        "requestedShipment": {
            "shipDatestamp": data["ship_date"].isoformat(),
            "pickupType": data["pickup_type"],
            "packagingType": data["packaging_type"],
            "rateRequestType": ["ACCOUNT"],
            "shipper": {"address": address(data["sender"])},
            "recipient": {"address": address(data["recipient"])},
            "requestedPackageLineItems": packages,
        },
    }


def normalize_rate_response(raw):
    if not isinstance(raw, dict) or not isinstance(raw.get("output"), dict):
        raise ValueError("Respuesta de tarifas FedEx inválida.")
    output = raw["output"]
    details = output.get("rateReplyDetails")
    if not isinstance(details, list):
        raise ValueError("La respuesta de FedEx no contiene la lista de tarifas.")

    rates = []
    for entry in details:
        if not isinstance(entry, dict) or not isinstance(entry.get("serviceType"), str):
            raise ValueError("FedEx devolvió un servicio sin código válido.")
        rated = entry.get("ratedShipmentDetails") or []
        account = next(
            (
                item for item in rated
                if isinstance(item, dict) and str(item.get("rateType", "")).startswith("ACCOUNT")
            ),
            None,
        )
        amount = account.get("totalNetCharge") if account else None
        currency = account.get("currency") if account else None
        if isinstance(amount, dict):
            currency = amount.get("currency") or currency
            amount = amount.get("amount")
        shipment_rate = account.get("shipmentRateDetail") if account else None
        if not currency and isinstance(shipment_rate, dict):
            currency = shipment_rate.get("currency")
        if (
            isinstance(amount, bool)
            or not isinstance(amount, (int, float))
            or not math.isfinite(amount)
        ):
            amount = None
        if not isinstance(currency, str):
            currency = None
        commit = entry.get("commit") or {}
        if not isinstance(commit, dict):
            commit = {}
        date_detail = commit.get("dateDetail") or {}
        if not isinstance(date_detail, dict):
            date_detail = {}
        delivery_date = (
            date_detail.get("dayCxsFormat")
            or commit.get("commitDate")
            or entry.get("deliveryDate")
            or entry.get("commitDate")
        )
        transit_time = commit.get("transitDays") or entry.get("transitTime")
        name = entry.get("serviceName")
        billing = (
            shipment_rate.get("totalBillingWeight") if isinstance(shipment_rate, dict) else None
        )
        billing = billing if isinstance(billing, dict) else {}
        billing_value = billing.get("value")
        if (
            isinstance(billing_value, bool)
            or not isinstance(billing_value, (int, float))
            or not math.isfinite(billing_value)
        ):
            billing_value = None
        billing_unit = billing.get("units")
        method = account.get("ratedWeightMethod") if account else None
        rates.append({
            "service_type": entry["serviceType"],
            "service_name": name if isinstance(name, str) and name else entry["serviceType"],
            "amount": amount,
            "currency": currency,
            "delivery_date": delivery_date if isinstance(delivery_date, str) else None,
            "transit_time": transit_time if isinstance(transit_time, str) else None,
            "billing_weight": billing_value,
            "billing_weight_units": billing_unit if isinstance(billing_unit, str) else None,
            "rated_weight_method": method if isinstance(method, str) else None,
        })
    return rates
