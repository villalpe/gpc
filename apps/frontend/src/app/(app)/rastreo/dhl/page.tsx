"use client";

import { useState } from "react";
import { Search, MapPin, PackageCheck, Truck, ArrowRight } from "lucide-react";

type DhlEvent = {
  timestamp: string;
  location?: { address?: { addressLocality?: string; countryCode?: string } };
  statusCode?: string;
  status?: string;
  description?: string;
};

type DhlShipment = {
  id?: string;
  service?: string;
  origin?: { address?: { addressLocality?: string }; servicePoint?: { label?: string } };
  destination?: { address?: { addressLocality?: string }; servicePoint?: { label?: string } };
  status?: DhlEvent;
  details?: {
    product?: { productName?: string };
    totalNumberOfPieces?: number;
    shipmentActivationDate?: string;
    proofOfDelivery?: { documentUrl?: string; signatureUrl?: string };
  };
  events?: DhlEvent[];
};

const STATUS_LABEL: Record<string, string> = {
  "pre-transit": "Pre-envío",
  transit: "En tránsito",
  delivered: "Entregado",
  failure: "Incidencia",
  unknown: "Desconocido",
};

// Texto de respaldo cuando DHL no manda "description"
const EVENT_FALLBACK: Record<string, string> = {
  PU: "Envío recolectado",
  PL: "Procesado en instalación",
  DF: "Salió de instalación DHL",
  AF: "Llegó a instalación DHL",
  AR: "Llegó a instalación de entrega",
  OK: "Entregado",
};

const STEP_LABELS = ["Recolectado", "En tránsito", "En entrega", "Entregado"] as const;

function dhlStepIndex(events: DhlEvent[]): number {
  const codes = new Set(events.map((e) => (e.status || "").toUpperCase()));
  const hasDelivered = events.some(
    (e) => e.statusCode === "delivered" || (e.status || "").toUpperCase() === "OK"
  );
  if (hasDelivered) return 3;

  if (codes.has("AR")) return 2;
  if (codes.has("PL") || codes.has("DF") || codes.has("AF")) return 1;
  if (codes.has("PU")) return 0;
  return 0;
}

function fmt(ts?: string) {
  if (!ts) return "-";
  const d = new Date(ts);
  return Number.isNaN(d.getTime())
    ? ts
    : d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

function eventText(ev: DhlEvent) {
  return ev.description?.trim() || EVENT_FALLBACK[ev.status ?? ""] || ev.status || "-";
}

export default function RastreoDhlPage() {
  const [tn, setTn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shipment, setShipment] = useState<DhlShipment | null>(null);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setShipment(null);

    const value = tn.trim();
    if (!value) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/dhl/track?trackingNumber=${encodeURIComponent(value)}`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json?.detail ?? "No se pudo consultar la guía.");
        return;
      }

      const s: DhlShipment | undefined = json?.shipments?.[0];
      if (!s) {
        setError("No se encontró información para esta guía.");
        return;
      }

      setShipment(s);
    } catch {
      setError("Error de red al consultar DHL.");
    } finally {
      setLoading(false);
    }
  }

  const events = [...(shipment?.events ?? [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const current = shipment?.status ?? events[0];
  const code = current?.statusCode ?? "unknown";
  const step = dhlStepIndex(events);

  const originLabel =
    shipment?.origin?.address?.addressLocality || shipment?.origin?.servicePoint?.label || "-";
  const destLabel =
    shipment?.destination?.address?.addressLocality ||
    shipment?.destination?.servicePoint?.label ||
    "-";
  const pod = shipment?.details?.proofOfDelivery?.documentUrl;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Rastreo DHL</h1>

      <form onSubmit={onSearch} className="flex gap-2">
        <input
          value={tn}
          onChange={(e) => setTn(e.target.value)}
          placeholder="Número de guía"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#FF5A6B] focus:ring-4 focus:ring-[#FF5A6B]/15 dark:border-white/20 dark:bg-slate-900/70"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#C1374A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
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

      {shipment && (
        <>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-rose-50 p-2 text-[#C1374A] dark:bg-white/10">
                {code === "delivered" ? (
                  <PackageCheck className="h-5 w-5" />
                ) : (
                  <Truck className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/60">
                  Estatus actual
                </p>
                <p className="text-lg font-bold">{STATUS_LABEL[code] ?? code}</p>
                <p className="text-sm text-slate-600 dark:text-white/70">
                  {current?.description ?? "-"}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-white/60">
                  {fmt(current?.timestamp)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm dark:border-white/10 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500 dark:text-white/60">Guía</p>
                <p className="font-medium">{shipment.id || tn}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-white/60">Servicio</p>
                <p className="font-medium">
                  {shipment.details?.product?.productName ?? shipment.service ?? "-"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500 dark:text-white/60">Ruta</p>
                <p className="inline-flex items-center gap-2 font-medium">
                  {originLabel} <ArrowRight className="h-4 w-4" /> {destLabel}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-white/60">Fecha de activación</p>
                <p className="font-medium">{fmt(shipment.details?.shipmentActivationDate)}</p>
              </div>
              {pod ? (
                <div>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    Comprobante de entrega
                  </p>
                  <a
                    href={pod}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#C1374A] underline"
                  >
                    Ver comprobante
                  </a>
                </div>
              ) : null}
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
                  style={{ width: `${(step / (STEP_LABELS.length - 1)) * 100}%` }}
                />
                <ol className="relative grid grid-cols-4">
                  {STEP_LABELS.map((label, idx) => {
                    const done = idx <= step;
                    const currentStep = idx === step;
                    return (
                      <li key={label} className="flex flex-col items-center text-center">
                        <span
                          className={`z-10 flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold ${
                            done
                              ? "border-[#C1374A] bg-[#C1374A] text-white"
                              : "border-slate-300 bg-white text-slate-500 dark:border-white/20 dark:bg-slate-900 dark:text-white/60"
                          } ${currentStep ? "ring-4 ring-[#C1374A]/20" : ""}`}
                        >
                          {idx + 1}
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
              {events.map((ev, i) => (
                <li key={`${ev.timestamp}-${i}`} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#C1374A]" />
                  <p className="text-sm font-medium">{eventText(ev)}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-white/60">
                    <MapPin className="h-3 w-3" />
                    {ev.location?.address?.addressLocality || "-"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/60">{fmt(ev.timestamp)}</p>
                </li>
              ))}
            </ol>
          </article>
        </>
      )}
    </div>
  );
}