"use client";

import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Download, ArrowRight, Send } from "lucide-react";
import TrackingHeader from "@/components/tracking/TrackingHeader";
import { buildSheet, type Sheet } from "@/lib/cargobase/sheet";
import { downloadSheetPdf } from "@/lib/cargobase/pdf";

type Quote = {
  quote_reference: string;
  freight: string;
  quote_title: string;
  status: string;
};

type QuotesResponse = {
  shipment: string;
  count: number;
  quotes: Quote[];
};

const CB_NUMBER = /^S\d{9}$/;

const CARRIER_ACTIONS = [
  { id: "fedex", label: "Crear envío FedEx" },
  { id: "dhl", label: "Crear envío DHL" },
  { id: "skydropx", label: "Crear envío Skydropx" },
] as const;

const card =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]";
const muted = "text-xs text-slate-500 dark:text-white/60";
const chip =
  "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-white/10 dark:text-white/80";

function val(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  return String(value);
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "booked":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
    case "submitted":
      return "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300";
    case "lost":
    case "canceled":
    case "cancelled":
      return "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/80";
  }
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className={muted}>{label}</p>
      <p className="break-words text-sm font-medium">{children}</p>
    </div>
  );
}

function SheetView({ sheet }: { sheet: Sheet }) {
  return (
    <>
      <article className={card}>
        <p className={`${muted} uppercase tracking-wide`}>Shipment</p>
        <h2 className="text-lg font-bold">{sheet.shipmentId}</h2>
        <p className="text-sm text-slate-600 dark:text-white/70">
          {sheet.title}
        </p>
      </article>

      {sheet.sections.map((section) => (
        <article key={section.title} className={card}>
          <h2 className="mb-3 font-semibold">{section.title}</h2>
          <div className="space-y-4">
            {section.groups.map((group, index) => (
              <div
                key={`${group.heading ?? section.title}-${index}`}
                className={
                  index > 0
                    ? "border-t border-slate-100 pt-4 dark:border-white/10"
                    : ""
                }
              >
                {group.heading && (
                  <p className="mb-3 text-sm font-semibold">{group.heading}</p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {group.rows.map((row) => (
                    <Field key={row.label} label={row.label}>
                      {row.value}
                    </Field>
                  ))}
                </div>

                {group.customsRows && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <tbody>
                        {group.customsRows.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className={
                              rowIndex === 2
                                ? "border-y-2 border-double border-slate-200 dark:border-white/20"
                                : "border-b border-slate-100 dark:border-white/10"
                            }
                          >
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className={`px-3 py-2 ${
                                  cellIndex === 0
                                    ? "font-semibold text-slate-700 dark:text-white/80"
                                    : ""
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>
      ))}
    </>
  );
}

function httpError(status: number, fallback: string, what: string) {
  if (status === 401) {
    return "Sesión expirada o token de Cargobase inválido (401).";
  }
  if (status === 403) {
    return `No tienes permiso para consultar ${what} en Cargobase (403).`;
  }
  if (status === 404) {
    return `No se encontró ${what} en Cargobase (404).`;
  }
  return fallback;
}

export default function RastreoCargobasePage() {
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [notice, setNotice] = useState("");
  const [quotesError, setQuotesError] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);

  async function loadRequest(id: string): Promise<Record<string, unknown>> {
    const response = await fetch(
      `/api/cargobase/requests/${encodeURIComponent(id)}`
    );
    const json: unknown = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail =
        json && typeof json === "object" && "detail" in json
          ? String(json.detail)
          : "No se pudo consultar la solicitud.";
      throw new Error(httpError(response.status, detail, "esta solicitud"));
    }

    if (!json || typeof json !== "object" || Array.isArray(json)) {
      throw new Error("Cargobase devolvió una respuesta inválida.");
    }

    return json as Record<string, unknown>;
  }

  async function loadQuotes(id: string): Promise<Quote[]> {
    const response = await fetch(
      `/api/cargobase/quotes?shipment=${encodeURIComponent(id)}`
    );
    const json: unknown = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        json && typeof json === "object" && "message" in json
          ? String(json.message)
          : "No se pudieron consultar las quotes.";
      throw new Error(httpError(response.status, message, "las quotes"));
    }

    if (!json || typeof json !== "object" || Array.isArray(json)) return [];
    const quoteList = (json as QuotesResponse).quotes;
    return Array.isArray(quoteList) ? quoteList : [];
  }

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = requestId.trim().toUpperCase();

    setError("");
    setPdfError("");
    setNotice("")
    setQuotesError("");
    setResult(null);
    setQuotes([]);
    setSelectedQuote(null);
    setSearched(false);

    if (!CB_NUMBER.test(value)) {
      setError(
        "Ingresa un CB number válido (S seguido de 9 dígitos, ej. S136951885)."
      );
      return;
    }

    setRequestId(value);
    setLoading(true);

    const [requestResult, quotesResult] = await Promise.allSettled([
      loadRequest(value),
      loadQuotes(value),
    ]);

    if (requestResult.status === "fulfilled") {
      setResult(requestResult.value);
    } else {
      setError(
        requestResult.reason instanceof Error
          ? requestResult.reason.message
          : "Error de red al consultar Cargobase."
      );
    }

    if (quotesResult.status === "fulfilled") {
      setQuotes(quotesResult.value);
    } else {
      setQuotesError(
        quotesResult.reason instanceof Error
          ? quotesResult.reason.message
          : "Error de red al consultar las quotes."
      );
    }

    setSearched(true);
    setLoading(false);
  }

  const sheet = useMemo(
    () => (result ? buildSheet(result) : null),
    [result]
  );

  async function onDownload() {
    if (!sheet) return;

    setDownloading(true);
    setPdfError("");

    try {
      await downloadSheetPdf(sheet);
    } catch {
      setPdfError("No se pudo generar el PDF. Inténtalo de nuevo.");
    } finally {
      setDownloading(false);
    }
  }

  function onCreateShipment(carrier: (typeof CARRIER_ACTIONS)[number]) {
    // TODO: enviar `sheet` a la API de creación de envíos del carrier
    setNotice(`"${carrier.label}" estará disponible próximamente.`);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <TrackingHeader
        logoSrc="/images/cargobase.svg"
        logoAlt="Cargobase"
        accentGradient="from-[#C1374A] via-[#C1374A] to-[#5B6F99]"
        eyebrow="Solicitudes y cotizaciones"
        title="Solicitud y quotes"
        description="Consulta el detalle de la solicitud y las quotes por CB number."
        inputLabel="CB number"
        placeholder="Ej. S136951885"
        helperText="Formato: la letra S seguida de 9 dígitos."
        buttonLabel="Buscar"
        inputId="cargobase-request"
        maxLength={10}
        uppercase
        value={requestId}
        onChange={setRequestId}
        onSubmit={onSearch}
        loading={loading}
      />

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </p>
      )}

      {/* Quotes: solo pantalla, no se incluye en el PDF */}
      {searched && (
        <article className={card}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Quotes ({quotes.length})</h2>
            <span className={muted}>{requestId}</span>
          </div>

          {quotesError ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {quotesError}
            </p>
          ) : quotes.length === 0 ? (
            <p className="rounded-xl border border-slate-100 p-4 text-sm text-slate-600 dark:border-white/10 dark:text-white/70">
              Este CB number todavía no tiene quotes.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={muted}>
                  <tr>
                    <th className="py-2 pr-3">Quote</th>
                    <th className="py-2 pr-3">Freight</th>
                    <th className="py-2 pr-3">Quote title</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => {
                    const selected =
                      selectedQuote === quote.quote_reference;

                    return (
                      <tr
                        key={quote.quote_reference}
                        className={`border-t border-slate-100 align-middle dark:border-white/10 ${
                          selected
                            ? "bg-rose-50/60 dark:bg-white/[0.06]"
                            : ""
                        }`}
                      >
                        <td className="py-2 pr-3 font-medium">
                          {val(quote.quote_reference)}
                        </td>
                        <td className="py-2 pr-3">{val(quote.freight)}</td>
                        <td className="py-2 pr-3">
                          {val(quote.quote_title)}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(
                              quote.status
                            )}`}
                          >
                            {val(quote.status)}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          {/* TODO fase 2: continuar al resumen del envío */}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedQuote(
                                selected ? null : quote.quote_reference
                              )
                            }
                            className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${
                              selected
                                ? "bg-[#C1374A] text-white"
                                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-white"
                            }`}
                          >
                            {selected ? "Seleccionada" : "Seleccionar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>
      )}

      {sheet && (
        <>
          <SheetView sheet={sheet} />

          {pdfError && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
            >
              {pdfError}
            </p>
          )}

          {notice && (
            <p
              role="status"
              className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
            >
              {notice}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            {CARRIER_ACTIONS.map((carrier) => (
              <button
                key={carrier.id}
                type="button"
                onClick={() => onCreateShipment(carrier)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-white"
              >
                <Send className="h-4 w-4" />
                {carrier.label}
              </button>
            ))}

            <button
              type="button"
              onClick={onDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#C1374A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a52f40] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {downloading ? "Generando PDF..." : "Descargar PDF"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}