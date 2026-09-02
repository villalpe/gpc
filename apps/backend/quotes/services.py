from dataclasses import dataclass
from typing import List, Dict

@dataclass
class Carrier:
    code: str
    name: str
    base_rate: float
    per_kg: float
    eta_days: int

CARRIERS = [
    Carrier("ally_a", "Ally Express", 115.0, 24.0, 1),
    Carrier("ally_b", "Paquetería MX", 95.0, 19.5, 2),
    Carrier("ally_c", "Global Freight", 105.0, 21.0, 2),
    Carrier("ally_d", "Ruta Segura", 88.0, 22.0, 3),
    Carrier("ally_e", "Cargo Plus", 120.0, 18.0, 3),
    Carrier("ally_f", "Nexo Envíos", 98.0, 20.0, 2),
]

def volumetric_weight(length_cm: float, width_cm: float, height_cm: float, factor: float = 5000.0) -> float:
    return round((length_cm * width_cm * height_cm) / factor, 2)

def score_option(price: float, eta_days: int) -> float:
    # menor score = mejor
    return round((price * 0.7) + (eta_days * 30 * 0.3), 2)

def build_quote_options(data: Dict) -> Dict:
    real_weight = float(data["weight_kg"])
    vol_weight = volumetric_weight(data["length_cm"], data["width_cm"], data["height_cm"])
    chargeable = max(real_weight, vol_weight)

    multiplier = 1.0
    if data["scope"] == "internacional":
        multiplier += 0.35
    if data["urgency"] == "express":
        multiplier += 0.20
    elif data["urgency"] == "prioritario":
        multiplier += 0.35
    if data.get("requires_insurance"):
        multiplier += 0.08
    if data.get("pickup"):
        multiplier += 0.04

    options: List[Dict] = []
    for c in CARRIERS:
        price = (c.base_rate + (c.per_kg * chargeable)) * multiplier
        option = {
            "carrier_code": c.code,
            "carrier_name": c.name,
            "estimated_price_mxn": round(price, 2),
            "eta_days": c.eta_days,
            "service_level": data["urgency"],
            "score": score_option(price, c.eta_days),
        }
        options.append(option)

    # top 3 por score
    top3 = sorted(options, key=lambda x: x["score"])[:3]

    return {
        "weight": {
            "real_kg": round(real_weight, 2),
            "volumetric_kg": round(vol_weight, 2),
            "chargeable_kg": round(chargeable, 2),
            "volumetric_factor": 5000,
        },
        "options": top3,
    }