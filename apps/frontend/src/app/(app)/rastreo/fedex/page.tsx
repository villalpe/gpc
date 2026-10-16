"use client";

import { useMemo, useState } from "react";
import { ArrowRight, MapPin, PackageCheck, Search, Truck } from "lucide-react";
import Image from "next/image";

type Loc = {
  city?: string;
  stateOrProvinceCode?: string;
  countryCode?: string;
  countryName?: string;
};

type ScanEvent = {
  date?: string;
  eventType?: string;
  eventDescription?: string;
  exceptionCode?: string;
  exceptionDescription?: string;
  derivedStatusCode?: string;
  derivedStatus?: string;
  scanLocation?: Loc & {
    streetLines?: string[];
    postalCode?: string;
    residential?: string | boolean;
    locationId?: string;
    locationType?: string;
  };
};

type TrackResult = {
  trackingNumberInfo?: { trackingNumber?: string };
  serviceDetail?: { type?: string; description?: string; shortDescription?: string };
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

const STEP_LABELS = ["Creado", "Recolectado", "En tránsito", "En entrega"] as const;

const STATUS_STEP: Record<string, number> = {
  IN: 0,
  OC: 0,
  PU: 1,
  IT: 2,
  AR: 2,
  DP: 2,
  AF: 2,
  OF: 2,
  AO: 2,
  HA: 2,
  RR: 2,
  OD: 3,
  HL: 3,
  HP: 3,
};

const EVENT_PRIORITY = ["DL", "OD", "HL", "HP", "PU", "IT", "AR", "DP", "AO", "HA", "RR", "OC", "IN"];

function codeStep(code?: string): number | null {
  const value = STATUS_STEP[(code || "").trim().toUpperCase()];
  return value === undefined ? null : value;
}

function normalizeCode(code?: string) {
  return (code || "").trim().toUpperCase();
}

function computeStep(
  latest: TrackResult["latestStatusDetail"] | undefined,
  events: ScanEvent[]
): number {
  const latestCode = normalizeCode(latest?.derivedCode || latest?.code);
  const newest = events[0];
  const newestCode = normalizeCode(newest?.derivedStatusCode || newest?.eventType);

  const sortedEvents = [...events].sort((a, b) => {
    const pa = EVENT_PRIORITY.indexOf(normalizeCode(a.derivedStatusCode || a.eventType));
    const pb = EVENT_PRIORITY.indexOf(normalizeCode(b.derivedStatusCode || b.eventType));
    return (pa === -1 ? 999 : pa) - (pb === -1 ? 999 : pb);
  });

  const eventCode = normalizeCode(
    sortedEvents[0]?.derivedStatusCode || sortedEvents[0]?.eventType
  );

  const candidates = [
    codeStep(latestCode),
    codeStep(newestCode),
    codeStep(eventCode),
  ].filter((n): n is number => n !== null);

  return candidates.length ? Math.max(...candidates) : 0;
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

function statusBadge(step: number) {
  return STEP_LABELS[Math.min(step, STEP_LABELS.length - 1)];
}

function translateFedexStatus(text?: string) {
  const value = (text || "").trim();

  if (!value) return "-";

  const lower = value.toLowerCase();

  if (lower === "ready for pickup") return "Listo para recoger";
  if (lower === "picked up") return "Recogido";
  if (lower === "in transit") return "En tránsito";
  if (lower === "on fedex vehicle for delivery") return "En vehículo FedEx para entrega";
  if (lower === "arrived at fedex location") return "Llegó a una instalación FedEx";
  if (lower === "at local fedex facility") return "En instalación local de FedEx";
  if (lower === "departed fedex location") return "Salió de una instalación FedEx";
  if (lower === "shipment information sent to fedex") return "Información del envío enviada a FedEx";
  if (lower === "shipment arriving on-time") return "El envío llegará a tiempo";
  if (lower === "delivery option requested") return "Opción de entrega solicitada";
  if (lower === "hold at location request accepted") return "Solicitud de retención en sucursal aceptada";

  return value;
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

  const events = useMemo(
    () =>
      [...(result?.scanEvents ?? [])].sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      }),
    [result?.scanEvents]
  );

  const latest = result?.latestStatusDetail;
  const step = computeStep(latest, events);
  const currentStatus = statusBadge(step);
  const delivered = step >= STEP_LABELS.length - 1;

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
      <div className="flex items-center gap-3">
        <Image
          src="/images/fedex-ar21.svg"
          alt="FedEx"
          width={42}
          height={42}
          className="h-20 w-42 object-contain"
          priority
        />
        <h1 className="text-4xl font-bold">Rastreo </h1>
      </div>

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
                  {translateFedexStatus(latest?.statusByLocale ?? latest?.description) ?? currentStatus}
                </p>
                <p className="text-sm text-slate-600 dark:text-white/70">
                  {translateFedexStatus(latest?.description ?? latest?.statusByLocale) ?? "-"}
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
                <p className="font-medium">
                  {result.serviceDetail?.description ??
                    result.serviceDetail?.shortDescription ??
                    result.serviceDetail?.type ??
                    "-"}
                </p>
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
                <li key={`${event.date ?? "event"}-${index}`} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#C1374A]" />

                  <p className="text-sm font-medium">
                    {event.eventDescription ?? event.derivedStatus ?? event.eventType ?? "-"}
                  </p>

                  {event.exceptionDescription && (
                    <p className="text-xs text-amber-600 dark:text-amber-300">
                      {event.exceptionDescription}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 dark:text-white/60">
                    {[
                      event.eventType ? `Tipo: ${event.eventType}` : null,
                      event.derivedStatusCode ? `Estado: ${event.derivedStatusCode}` : null,
                      event.exceptionCode ? `Excepción: ${event.exceptionCode}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
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