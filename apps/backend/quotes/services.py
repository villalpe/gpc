def volumetric_weight(
    length_cm: float,
    width_cm: float,
    height_cm: float,
    factor: float = 5000.0,
) -> float:
    return round((length_cm * width_cm * height_cm) / factor, 2)


def parcels_weight_summary(parcels) -> dict:
    real = sum(float(p["weight"]) for p in parcels)
    vol = sum(
        volumetric_weight(p["length"], p["width"], p["height"]) for p in parcels
    )
    return {
        "real_kg": round(real, 2),
        "volumetric_kg": round(vol, 2),
        "chargeable_kg": round(max(real, vol), 2),
        "volumetric_factor": 5000,
    }
