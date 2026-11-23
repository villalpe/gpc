export type RateDelivery = {
  dateKey: string | null;
  dateLabel: string | null;
  timeLabel: string | null;
};

export type RateWithDelivery = { delivery_date: string | null };
export type RateDeliveryGroup<T extends RateWithDelivery> = {
  key: string;
  label: string;
  rates: T[];
};

export function rateDelivery(value: string | null): RateDelivery {
  const match = value?.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/
  );
  if (!match) return { dateKey: null, dateLabel: null, timeLabel: null };

  const [, yearText, monthText, dayText, hour, minute] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { dateKey: null, dateLabel: null, timeLabel: null };
  }

  const dateKey = `${yearText}-${monthText}-${dayText}`;
  const dateLabel = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  const validTime = hour !== undefined &&
    Number(hour) >= 0 && Number(hour) <= 23 &&
    Number(minute) >= 0 && Number(minute) <= 59;
  return {
    dateKey,
    dateLabel: dateLabel.charAt(0).toLocaleUpperCase("es-MX") + dateLabel.slice(1),
    timeLabel: validTime ? `${hour}:${minute}` : null,
  };
}

export function formatRateAmount(amount: number | null, currency: string | null): string {
  return typeof amount === "number" && Number.isFinite(amount) && currency
    ? `${amount.toFixed(2)} ${currency}`
    : "No proporcionado";
}

export function selectedRateSummary(rate: {
  service_name: string;
  delivery_date: string | null;
  amount: number | null;
  currency: string | null;
}): string {
  const delivery = rateDelivery(rate.delivery_date);
  const estimate = delivery.dateLabel
    ? `${delivery.dateLabel}${delivery.timeLabel ? ` hasta las ${delivery.timeLabel}` : ", hora de entrega por confirmar"}`
    : "fecha y hora de entrega por confirmar";
  return `Servicio seleccionado: ${rate.service_name} — ${estimate} — costo estimado: ${formatRateAmount(rate.amount, rate.currency)}`;
}

export function groupRatesByDelivery<T extends RateWithDelivery>(
  rates: T[]
): RateDeliveryGroup<T>[] {
  const groups = new Map<string, RateDeliveryGroup<T>>();
  for (const rate of rates) {
    const delivery = rateDelivery(rate.delivery_date);
    const key = delivery.dateKey ?? "unknown";
    const group = groups.get(key) ?? {
      key,
      label: delivery.dateLabel ?? "Fecha de entrega por confirmar",
      rates: [],
    };
    group.rates.push(rate);
    groups.set(key, group);
  }
  return [...groups.values()]
    .sort((a, b) => a.key === "unknown" ? 1 : b.key === "unknown" ? -1 : a.key.localeCompare(b.key))
    .map((group) => ({
      ...group,
      rates: group.rates.toSorted((a, b) => {
        const first = rateDelivery(a.delivery_date).timeLabel ?? "99:99";
        const second = rateDelivery(b.delivery_date).timeLabel ?? "99:99";
        return first.localeCompare(second);
      }),
    }));
}
