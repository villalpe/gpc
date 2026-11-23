"use client";

import { useState } from "react";
import type { FedexDraft } from "@/lib/cargobase/fedex";
import { rateValidationErrors } from "@/lib/cargobase/fedex-rate-errors";
import {
  formatRateAmount,
  groupRatesByDelivery,
  rateDelivery,
  selectedRateSummary,
} from "@/lib/cargobase/fedex-rate-presentation";
import { fedexRoute, fedexServices } from "@/lib/cargobase/fedex-services";

type Rate = {
  service_type: string;
  service_name: string;
  amount: number | null;
  currency: string | null;
  delivery_date: string | null;
  transit_time: string | null;
  billing_weight: number | null;
  billing_weight_units: string | null;
  rated_weight_method: string | null;
};

type DateResult = { date: string; rates?: Rate[]; error?: string };
type SelectedRate = {
  shipDate: string;
  service: string;
  rate: Rate;
  quoteKey: string;
};

function requestData(draft: FedexDraft, shipDate: string) {
  const address = (party: FedexDraft["sender"]) => ({
    country_code: party.country_code.trim(),
    postal_code: party.postal_code.trim(),
    city: party.city.trim(),
    state: party.state.trim(),
  });
  return {
    ship_date: shipDate,
    pickup_type: draft.pickup_type,
    packaging_type: draft.packaging_type.trim(),
    sender: address(draft.sender),
    recipient: address(draft.recipient),
    packages: draft.packages.map((item) => ({
      quantity: item.quantity,
      weight: item.weight,
      weight_units: item.weight_units,
      length: item.length,
      width: item.width,
      height: item.height,
      dimension_units: item.dimension_units,
    })),
  };
}

function validate(draft: FedexDraft, dates: string[]) {
  if (dates.some((date) => !date)) return "Selecciona todas las fechas de envío.";
  if (new Set(dates).size !== dates.length) return "Las fechas no deben repetirse.";
  if (fedexRoute(draft.sender.country_code, draft.recipient.country_code) === "unknown") {
    return "Indica los códigos de país de origen y destino (2 letras).";
  }
  if (!draft.sender.postal_code.trim() || !draft.recipient.postal_code.trim()) {
    return "Indica los códigos postales de origen y destino.";
  }
  const invalidStates = [
    draft.sender.state.trim().length > 3 && "remitente",
    draft.recipient.state.trim().length > 3 && "destinatario",
  ].filter(Boolean);
  if (invalidStates.length) {
    return `Revisa el estado / provincia de ${invalidStates.join(" y ")}: usa el código correspondiente de hasta 3 caracteres, no el nombre completo.`;
  }
  if (!draft.pickup_type || !draft.packaging_type.trim()) {
    return "Selecciona entrega o recolección e indica el tipo de empaque FedEx.";
  }
  if (!draft.packages.length) return "Agrega al menos un paquete.";
  let total = 0;
  for (const p of draft.packages) {
    const quantity = Number(p.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 ||
        !p.weight || !Number.isFinite(Number(p.weight)) || Number(p.weight) <= 0 ||
        !["KG", "LB"].includes(p.weight_units) ||
        !["CM", "IN"].includes(p.dimension_units) ||
        [p.length, p.width, p.height].some((value) =>
          !value || !Number.isInteger(Number(value)) || Number(value) < 1
        )) {
      return "Revisa cantidad, peso, unidades y dimensiones enteras positivas de cada paquete.";
    }
    total += quantity;
  }
  return total > 40 ? "El máximo es 40 paquetes por consulta." : "";
}

async function fetchRates(draft: FedexDraft, date: string): Promise<DateResult> {
  try {
    const response = await fetch("/api/fedex/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData(draft, date)),
    });
    const data = await response.json();
    if (!response.ok) {
      const codes = Array.isArray(data.codes) ? data.codes.join(", ") : "";
      const validationErrors = response.status === 400 ? rateValidationErrors(data) : [];
      return {
        date,
        error: `${validationErrors.join(" ") || (typeof data.detail === "string" ? data.detail : "Revisa los datos del envío.")}${codes ? ` (${codes})` : ""}`,
      };
    }
    if (!Array.isArray(data.rates)) {
      return { date, error: "La respuesta de tarifas tiene un formato inesperado." };
    }
    return { date, rates: data.rates };
  } catch {
    return { date, error: "No se pudo conectar para consultar esta fecha." };
  }
}

export default function FedexRates({
  draft,
  onSelect,
}: {
  draft: FedexDraft;
  onSelect: (date: string, service: string) => void;
}) {
  const [additionalDates, setAdditionalDates] = useState<string[]>([]);
  const [results, setResults] = useState<DateResult[] | null>(null);
  const [resultKey, setResultKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRate, setSelectedRate] = useState<SelectedRate | null>(null);
  const dates = [draft.ship_date, ...additionalDates];
  const key = JSON.stringify(dates.map((date) => requestData(draft, date)).sort());
  const quoteKey = JSON.stringify({
    ...requestData(draft, draft.ship_date),
    ship_date: undefined,
  });
  const currentResults = resultKey === key ? results : null;
  const currentSelection = selectedRate &&
    selectedRate.quoteKey === quoteKey &&
    selectedRate.shipDate === draft.ship_date &&
    selectedRate.service === draft.service_type
    ? selectedRate
    : null;
  const services = fedexServices(fedexRoute(draft.sender.country_code, draft.recipient.country_code));

  async function compare() {
    const message = validate(draft, dates);
    if (message) {
      setError(message);
      setResults(null);
      return;
    }
    setError("");
    setResults(null);
    setLoading(true);
    const responses = await Promise.all(dates.map((date) => fetchRates(draft, date)));
    setResultKey(key);
    setResults(responses);
    setLoading(false);
  }

  function selectRate(date: string, rate: Rate) {
    setSelectedRate({
      shipDate: date,
      service: rate.service_type,
      rate,
      quoteKey,
    });
    if (date !== draft.ship_date) {
      setAdditionalDates((current) =>
        current.map((item) => item === date ? draft.ship_date : item)
      );
    }
    onSelect(date, rate.service_type);
  }

  function selectRateButton(result: DateResult, rate: Rate) {
    const delivery = rateDelivery(rate.delivery_date);
    return (
      <button
        type="button"
        onClick={() => selectRate(result.date, rate)}
        aria-label={`Seleccionar ${rate.service_name}${delivery.timeLabel ? `, entrega a las ${delivery.timeLabel}` : ""}`}
        className="font-semibold text-[#C1374A]"
      >
        Seleccionar
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
      <h2 className="text-lg font-semibold">Comparar tarifas y tiempos de tránsito</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
        Se consulta la tarifa de cuenta para la fecha de envío indicada arriba.
        Puedes añadir hasta cuatro fechas para comparar. Completa origen, destino,
        paquetes, empaque y modalidad antes de consultar.
      </p>
      <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
        Son estimaciones; no garantizan disponibilidad ni incluyen necesariamente
        aduanas, seguros, servicios especiales o el costo de una recolección futura.
        La consulta no programa recolecciones ni crea guías.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {additionalDates.map((date, index) => (
          <label key={index} className="text-sm font-medium">
            Fecha adicional {index + 1}
            <span className="mt-1 flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(event) => setAdditionalDates((current) =>
                  current.map((item, i) => i === index ? event.target.value : item)
                )}
                className="rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-white/20 dark:bg-slate-900 dark:text-white"
              />
              <button type="button" onClick={() => setAdditionalDates((current) =>
                current.filter((_, i) => i !== index)
              )} className="text-rose-600" aria-label={`Eliminar fecha ${index + 1}`}>Quitar</button>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={loading || additionalDates.length >= 4}
          onClick={() => setAdditionalDates((current) => [...current, ""])}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-white/20">
          Agregar fecha
        </button>
        <button type="button" disabled={loading} onClick={compare}
          className="rounded-lg bg-[#C1374A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? "Consultando FedEx..." : "Comparar tarifas y tiempos"}
        </button>
      </div>
      {currentSelection && (
        <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
          {selectedRateSummary(currentSelection.rate)}
        </p>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
      {results && !currentResults && (
        <p role="status" className="mt-3 text-sm text-amber-700 dark:text-amber-300">
          Los datos cambiaron. Vuelve a consultar las tarifas.
        </p>
      )}
      {currentResults?.map((result) => (
        <div key={result.date} className="mt-5 border-t border-slate-200 pt-4 dark:border-white/10">
          <h3 className="font-semibold">Fecha de envío: {result.date}</h3>
          {result.error ? (
            <p role="alert" className="mt-2 text-sm text-rose-700 dark:text-rose-300">{result.error}</p>
          ) : !result.rates?.length ? (
            <p className="mt-2 text-sm text-slate-600 dark:text-white/70">FedEx no devolvió opciones para esta fecha.</p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              {groupRatesByDelivery(result.rates).map((group) => (
                <section key={`${result.date}-${group.key}`} className="mb-5">
                  <h4 className="font-semibold">{group.label}</h4>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr>
                        <th className="p-2">Hora estimada</th>
                        <th className="p-2">Servicio</th>
                        <th className="p-2">Costo estimado</th>
                        <th className="p-2">Peso cobrable</th>
                        <th className="p-2">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rates.map((rate, index) => {
                        const selectable = services.some((service) => service.code === rate.service_type);
                        const delivery = rateDelivery(rate.delivery_date);
                        return (
                          <tr key={`${rate.service_type}-${index}`} className="border-t border-slate-100 dark:border-white/10">
                            <td className="p-2">{delivery.timeLabel ? `Hasta las ${delivery.timeLabel}` : rate.transit_time || "No proporcionada"}</td>
                            <td className="p-2">{rate.service_name}</td>
                            <td className="p-2">{formatRateAmount(rate.amount, rate.currency)}</td>
                            <td className="p-2">
                              {typeof rate.billing_weight === "number" && rate.billing_weight_units
                                ? `${rate.billing_weight} ${rate.billing_weight_units}` : "No proporcionado"}
                              {rate.rated_weight_method === "ACTUAL" ? " (real)" : rate.rated_weight_method === "DIM" || rate.rated_weight_method === "DIMENSIONAL" ? " (volumétrico)" : rate.rated_weight_method ? ` (${rate.rated_weight_method})` : ""}
                            </td>
                            <td className="p-2">
                              {selectable ? selectRateButton(result, rate) : <span className="text-xs text-slate-500">Servicio por confirmar</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
