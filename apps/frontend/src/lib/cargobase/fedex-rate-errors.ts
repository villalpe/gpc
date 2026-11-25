const labels: Record<string, string> = {
  sender: "Remitente",
  recipient: "Destinatario",
  state: "Estado / provincia",
  country_code: "País",
  postal_code: "Código postal",
  city: "Ciudad",
  ship_date: "Fecha de envío",
  pickup_type: "Entrega o recolección",
  packaging_type: "Tipo de empaque",
  packages: "Paquetes",
  quantity: "Cantidad",
  weight: "Peso",
  weight_units: "Unidad de peso",
  length: "Largo",
  width: "Ancho",
  height: "Alto",
  dimension_units: "Unidad de dimensiones",
  customs_items: "Mercancías / datos aduanales",
  description: "Descripción aduanal",
  hs_code: "Código HS",
  origin_country: "País de fabricación",
  unit_price: "Valor unitario",
  customs_value: "Valor aduanal total",
  customs_currency: "Moneda",
};

export function rateValidationErrors(value: unknown): string[] {
  function collect(item: unknown, path: string[]): string[] {
    if (typeof item === "string") {
      return [path.length ? `${path.join(" / ")}: ${item}` : item];
    }
    if (Array.isArray(item)) {
      return item.flatMap((entry, index) =>
        collect(entry, typeof entry === "object" && entry !== null
          ? [...path, `Paquete ${index + 1}`]
          : path)
      );
    }
    if (item && typeof item === "object") {
      return Object.entries(item).flatMap(([key, entry]) =>
        collect(entry, key === "detail" || key === "non_field_errors"
          ? path
          : [...path, labels[key] ?? key])
      );
    }
    return [];
  }
  return collect(value, []);
}
