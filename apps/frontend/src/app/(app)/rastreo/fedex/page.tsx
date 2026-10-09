"use client";

import { useState } from "react";
import { ArrowRight, MapPin, PackageCheck, Search, Truck } from "lucide-react";

type Loc = {
  city?: string;
  stateOrProvinceCode?: string;
  countryCode?: string;
};

type ScanEvent = {
  date: string;
  eventType?: string;
  eventDescription?: string;
  derivedStatusCode?: string;
  scanLocation?: Loc;
};

type TrackResult = {
  trackingNumberInfo?: { trackingNumber?: string };
  serviceDetail?: { description?: string };
  latestStatusDetail?: {
    code?: string;
    derivedCode?: string;
    statusByLocale?: string;
    description?: string;
    scanLocation?: Loc;
  };
  scanEvents?: ScanEvent[];
  originLocation?: {
    locationContactAndAddress?: {
      address?: Loc;
    };
  };
  destinationLocation?: {
    locationContactAndAddress?: {
      address?: Loc;
    };
  };
  shipperInformation?: { address?: Loc };
  recipientInformation?: { address?: Loc };
  dateAndTimes?: {
    type: string;
    dateTime: string;
  }[];
};

const STEP_LABELS = ["Recolectado", "En tránsito", "En entrega", "Entregado"] as const;

function stepIndex(code?: string): number {
  switch ((code || "").toUpperCase()) {
    case "DL":
      return 3;

    case "OD":
      return 2;

    case "IT":
    case "AR":
    case "DP":
    case "AF":
    case "OF":
      return 1;

    default:
      return 0;
  }
}

function fmt(timestamp?: string) {
  if (!timestamp) return "-";

  const date = new Date(timestamp);

  return Number.isNaN(date.getTime())
    ? timestamp
    : date.toLocaleString("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function place(location?: Loc) {
  if (!location) return "-";

  const value = [location.city, location.stateOrProvinceCode, location.countryCode]
    .filter(Boolean)
    .join(", ");

  return value || "-";
}

export default function RastreoFedexPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);

  async function onSearch(event: React.FormEvent) {
    event.preventDefault();

    const value = trackingNumber.trim();

    setError("");
    setResult(null);

    if (!value) {
      setError("Ingresa un número de guía.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/fedex/track?trackingNumber=${encodeURIComponent(value)}`
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        // El proxy convierte errors[0].message de FedEx en json.detail.
        setError(json?.detail ?? "No se pudo consultar la guía.");
        return;
      }

      const trackResult: TrackResult | undefined =
        json?.output?.completeTrackResults?.[0]?.trackResults?.[0];

      if (!trackResult) {
        setError("FedEx no devolvió información para esta guía.");
        return;
      }

      setResult(trackResult);
    } catch {
      setError("Error de red al consultar FedEx.");
    } finally {
      setLoading(false);
    }
  }

  const events = [...(result?.scanEvents ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const latest = result?.latestStatusDetail;
  const statusCode = latest?.derivedCode ?? latest?.code;
  const step = stepIndex(statusCode);
  const delivered = step === 3;

  const origin = place(
    result?.originLocation?.locationContactAndAddress?.address ??
      result?.shipperInformation?.address
  );

  const destination = place(
    result?.destinationLocation?.locationContactAndAddress?.address ??
      result?.recipientInformation?.address
  );

  const estimatedDelivery = result?.dateAndTimes?.find((item) =>
    /ESTIMATED_DELIVERY/i.test(item.type)
  )?.dateTime;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Rastreo FedEx</h1>

      <form onSubmit={onSearch} className="flex gap-2">
        <input
          value={trackingNumber}
          onChange={(event) => setTrackingNumber(event.target.value)}
          placeholder="Número de guía"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#FF5A6B] focus:ring-4 focus:ring-[#FF5A6B]/15 dark:border-white/20 dark:bg-slate-900/70"
        />

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#C1374A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#9F2436] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          {loading ? "Buscando..." : "Rastrear"}
        </button>
      </form>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </p>
      )}

      {result && (
        <>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-rose-50 p-2 text-[#C1374A] dark:bg-white/10">
                {delivered ? (
                  <PackageCheck className="h-5 w-5" />
                ) : (
                  <Truck className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/60">
                  Estatus actual
                </p>
                <p className="text-lg font-bold">
                  {latest?.statusByLocale ?? latest?.description ?? "-"}
                </p>
                <p className="text-sm text-slate-600 dark:text-white/70">
                  {latest?.description ?? "-"}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-white/60">
                  <MapPin className="h-3 w-3" />
                  {place(latest?.scanLocation)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm dark:border-white/10 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500 dark:text-white/60">Guía</p>
                <p className="font-medium">
                  {result.trackingNumberInfo?.trackingNumber ?? trackingNumber}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 dark:text-white/60">Servicio</p>
                <p className="font-medium">{result.serviceDetail?.description ?? "-"}</p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500 dark:text-white/60">Ruta</p>
                <p className="inline-flex items-center gap-2 font-medium">
                  {origin}
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  {destination}
                </p>
              </div>

              {estimatedDelivery && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    Entrega estimada
                  </p>
                  <p className="font-medium">{fmt(estimatedDelivery)}</p>
                </div>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Progreso del envío
            </p>

            <div className="mt-4">
              <div className="relative">
                <div className="absolute left-0 right-0 top-3 h-1 rounded bg-slate-200 dark:bg-white/10" />
                <div
                  className="absolute left-0 top-3 h-1 rounded bg-[#C1374A] transition-all"
                  style={{
                    width: `${(step / (STEP_LABELS.length - 1)) * 100}%`,
                  }}
                />

                <ol className="relative grid grid-cols-4">
                  {STEP_LABELS.map((label, index) => {
                    const done = index <= step;
                    const currentStep = index === step;

                    return (
                      <li key={label} className="flex flex-col items-center text-center">
                        <span
                          className={`z-10 flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold ${
                            done
                              ? "border-[#C1374A] bg-[#C1374A] text-white"
                              : "border-slate-300 bg-white text-slate-500 dark:border-white/20 dark:bg-slate-900 dark:text-white/60"
                          } ${currentStep ? "ring-4 ring-[#C1374A]/20" : ""}`}
                        >
                          {index + 1}
                        </span>

                        <span
                          className={`mt-2 text-[11px] leading-tight ${
                            done
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-500 dark:text-white/60"
                          }`}
                        >
                          {label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
            <h2 className="mb-3 font-semibold">Historial ({events.length})</h2>

            <ol className="space-y-4 border-l border-slate-200 pl-4 dark:border-white/15">
              {events.map((event, index) => (
                <li key={`${event.date}-${index}`} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#C1374A]" />

                  <p className="text-sm font-medium">
                    {event.eventDescription ?? event.eventType ?? "-"}
                  </p>

                  <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-white/60">
                    <MapPin className="h-3 w-3" />
                    {place(event.scanLocation)}
                  </p>

                  <p className="text-xs text-slate-500 dark:text-white/60">
                    {fmt(event.date)}
                  </p>
                </li>
              ))}
            </ol>
          </article>
        </>
      )}
    </div>
  );
}