"use client";

import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import Image from "next/image";
import TrackingHeader from "@/components/tracking/TrackingHeader";

type Nullable<T> = T | null | undefined;

type GoodItem = {
  units?: Nullable<number | string>;
  handling_unit?: Nullable<string>;
  length?: Nullable<number | string>;
  width?: Nullable<number | string>;
  height?: Nullable<number | string>;
  m_unit?: Nullable<string>;
  weight?: Nullable<number | string>;
  w_unit?: Nullable<string>;
  total_cbm?: Nullable<number | string>;
  stackable?: Nullable<boolean>;
  hazardous?: Nullable<boolean>;
  is_dangerous_good?: Nullable<boolean>;
  crating_required?: Nullable<boolean>;
  temperature_control_required?: Nullable<boolean>;
  un_number?: Nullable<string>;
  other_instructions?: Nullable<string>;
};

type Organization = {
  shipment_id?: Nullable<string>;
  request_status?: Nullable<string>;
  title?: Nullable<string>;
  shipment_type_display?: Nullable<string>;
  requestor?: Nullable<string>;
  requestor_email?: Nullable<string>;
  shipper?: Nullable<string>;
  request_creation_datetime?: Nullable<string>;
  cost_center?: Nullable<string>;
  reason_code?: Nullable<string>;
  reason_code_group?: Nullable<string>;
  custom_field1?: Nullable<string>;
  custom_field2?: Nullable<string>;
  custom_field3?: Nullable<string>;
  custom_longfield_01?: Nullable<string>;
  cost_recovery_required?: Nullable<boolean | string>;
  custom_cost_recovery_field1?: Nullable<string>;
  custom_cost_recovery_field2?: Nullable<string>;
  goods_confirmation_type?: Nullable<string>;
  good_items?: Nullable<GoodItem[]>;
  requested_cbm?: Nullable<number | string>;
  shipment_currency?: Nullable<string>;
  payment_location?: Nullable<string>;
  additional_comments?: Nullable<string>;
  quoting_deadline_date?: Nullable<string>;
  quoting_deadline_time?: Nullable<string>;
  quoting_deadline_utc_offset?: Nullable<string>;
  quoting_deadline_remaining_time_display?: Nullable<string>;
  confirmation_date?: Nullable<string>;
  confirmation_time?: Nullable<string>;
  confirmation_remaining_time_display?: Nullable<string>;
  open_for_quotation?: Nullable<boolean>;
};

type SpecialRequirement = {
  label?: Nullable<string>;
  value?: Nullable<boolean>;
  additional_information?: Nullable<string>;
};

type Service = {
  incoterm?: Nullable<string>;
  service_requirement_display?: Nullable<string>;
  export_clearance?: Nullable<string>;
  transit_clearance?: Nullable<string>;
  import_clearance?: Nullable<string>;
  insurance?: Nullable<string | boolean>;
  invited_freight_modes?: Nullable<string[]>;
  provider_reference?: Nullable<string[] | string>;
  available_teams?: Nullable<{ assigned_team?: Nullable<string>; [key: string]: unknown }>;
  special_requirements_json?: Nullable<Record<string, SpecialRequirement>>;
};

type AddressV2 = {
  name?: Nullable<string>;
  address_name?: Nullable<string>;
  street?: Nullable<string>;
  street_address?: Nullable<string>;
  city?: Nullable<string>;
  city_name?: Nullable<string>;
  state?: Nullable<string>;
  zipcode?: Nullable<string>;
  country?: Nullable<string>;
  country_name?: Nullable<string>;
};

type Stop = {
  address_name?: Nullable<string>;
  street?: Nullable<string>;
  city?: Nullable<string>;
  state?: Nullable<string>;
  zipcode?: Nullable<string>;
  country?: Nullable<string>;
  datetime?: Nullable<string>;
  [key: string]: unknown;
};

type Schedule = {
  address_v2?: Nullable<{ pickup?: Nullable<AddressV2>; stop1?: Nullable<AddressV2> } & Record<string, unknown>>;
  stops?: Nullable<Stop[]>;
  [key: string]: unknown;
};

type BillingParty = {
  name?: Nullable<string>;
  street_address?: Nullable<string>;
  city_name?: Nullable<string>;
  country_name?: Nullable<string>;
  phone?: Nullable<string>;
};

type BillingInfo = {
  billed_from?: Nullable<BillingParty>;
  billed_to?: Nullable<BillingParty>;
};

type CargobaseRequest = {
  quick_request_details?: unknown;
  organization?: Nullable<Organization>;
  service?: Nullable<Service>;
  schedule?: Nullable<Schedule>;
  billing_info?: Nullable<BillingInfo>;
};

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

type Point = {
  name: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  datetime: string;
  timezone: string;
  contact: string;
  phone: string;
  email: string;
  notes: string;
};

const CB_NUMBER = /^S\d{9}$/;

const card =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]";
const muted = "text-xs text-slate-500 dark:text-white/60";
const chip =
  "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-white/10 dark:text-white/80";

function val(v: unknown): string {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "-";
  return String(v);
}

function fmt(timestamp?: Nullable<string>) {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? timestamp
    : date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

function pick(...values: unknown[]): string {
  for (const v of values) {
    if (v !== null && v !== undefined && v !== "") return String(v);
  }
  return "";
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

function buildPoint(
  schedule: Schedule,
  prefix: "pickup" | "stop1",
  addr: Nullable<AddressV2>
): Point {
  const s = schedule as Record<string, unknown>;
  const g = (k: string) => s[`${prefix}_${k}`];
  return {
    name: pick(addr?.name, addr?.address_name, g("address_name")),
    street: pick(addr?.street, addr?.street_address, g("street")),
    city: pick(addr?.city, addr?.city_name, g("city")),
    state: pick(addr?.state, g("state")),
    zipcode: pick(addr?.zipcode, g("zipcode")),
    country: pick(addr?.country, addr?.country_name, g("country")),
    datetime: pick(g("datetime"), g("date_time")),
    timezone: pick(g("timezone")),
    contact: pick(g("contact_name"), g("contact")),
    phone: pick(g("contact_phone"), g("phone")),
    email: pick(g("contact_email"), g("email")),
    notes: pick(g("notes")),
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className={muted}>{label}</p>
      <p className="break-words text-sm font-medium">{children}</p>
    </div>
  );
}

function Flag({ on, label }: { on: Nullable<boolean>; label: string }) {
  if (!on) return null;
  return <span className={chip}>{label}</span>;
}

function PointCard({ title, p }: { title: string; p: Point }) {
  return (
    <div className="flex-1 rounded-xl border border-slate-100 p-4 dark:border-white/10">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre">{val(p.name)}</Field>
        <Field label="Calle">{val(p.street)}</Field>
        <Field label="Ciudad">{val(p.city)}</Field>
        <Field label="Estado">{val(p.state)}</Field>
        <Field label="C.P.">{val(p.zipcode)}</Field>
        <Field label="País">{val(p.country)}</Field>
        <Field label="Fecha y hora">{fmt(p.datetime || null)}</Field>
        <Field label="Zona horaria">{val(p.timezone)}</Field>
        <Field label="Contacto">{val(p.contact)}</Field>
        <Field label="Teléfono">{val(p.phone)}</Field>
        <Field label="Correo">{val(p.email)}</Field>
        <Field label="Notas">{val(p.notes)}</Field>
      </div>
    </div>
  );
}

function BillingCard({ title, party }: { title: string; party: Nullable<BillingParty> }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4 dark:border-white/10">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre">{val(party?.name)}</Field>
        <Field label="Dirección">{val(party?.street_address)}</Field>
        <Field label="Ciudad">{val(party?.city_name)}</Field>
        <Field label="País">{val(party?.country_name)}</Field>
        <Field label="Teléfono">{val(party?.phone)}</Field>
      </div>
    </div>
  );
}

function httpError(status: number, fallback: string, what: string) {
  if (status === 401) return "Sesión expirada o token de Cargobase inválido (401).";
  if (status === 403) return `No tienes permiso para consultar ${what} en Cargobase (403).`;
  if (status === 404) return `No se encontró ${what} en Cargobase (404).`;
  return fallback;
}

export default function RastreoCargobasePage() {
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [quotesError, setQuotesError] = useState("");
  const [result, setResult] = useState<CargobaseRequest | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);

  async function loadRequest(id: string) {
    const response = await fetch(`/api/cargobase/requests/${encodeURIComponent(id)}`);
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        httpError(response.status, json?.detail ?? "No se pudo consultar la solicitud.", "esta solicitud")
      );
    }
    return json as CargobaseRequest;
  }

  async function loadQuotes(id: string) {
    const response = await fetch(`/api/cargobase/quotes?shipment=${encodeURIComponent(id)}`);
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        httpError(response.status, json?.message ?? "No se pudieron consultar las quotes.", "las quotes")
      );
    }
    return (json as QuotesResponse).quotes ?? [];
  }

  async function onSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = requestId.trim().toUpperCase();

    setError("");
    setQuotesError("");
    setResult(null);
    setQuotes([]);
    setSelectedQuote(null);
    setSearched(false);

    if (!CB_NUMBER.test(value)) {
      setError("Ingresa un CB number válido (S seguido de 9 dígitos, ej. S136951885).");
      return;
    }

    setRequestId(value);
    setLoading(true);

    // Las dos consultas corren en paralelo y una no bloquea a la otra
    const [reqRes, quotesRes] = await Promise.allSettled([loadRequest(value), loadQuotes(value)]);

    if (reqRes.status === "fulfilled") setResult(reqRes.value);
    else setError(reqRes.reason instanceof Error ? reqRes.reason.message : "Error de red al consultar Cargobase.");

    if (quotesRes.status === "fulfilled") setQuotes(quotesRes.value);
    else
      setQuotesError(
        quotesRes.reason instanceof Error ? quotesRes.reason.message : "Error de red al consultar las quotes."
      );

    setSearched(true);
    setLoading(false);
  }

  const org = result?.organization ?? {};
  const service = result?.service ?? {};
  const schedule = result?.schedule ?? {};
  const billing = result?.billing_info ?? {};
  const items = org.good_items ?? [];
  const stops = schedule.stops ?? [];
  const pickup = result ? buildPoint(schedule, "pickup", schedule.address_v2?.pickup) : null;
  const delivery = result ? buildPoint(schedule, "stop1", schedule.address_v2?.stop1) : null;
  const requirements = Object.values(service.special_requirements_json ?? {}).filter(
    (r) => r?.value === true
  );
  const modes = service.invited_freight_modes ?? [];

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
        helperText="Formato: la letra S seguida de 9 dígitos. CB numeros de prueba: S136951885, S833950886"
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

      {/* Quotes */}
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
                  {quotes.map((q) => {
                    const selected = selectedQuote === q.quote_reference;
                    return (
                      <tr
                        key={q.quote_reference}
                        className={`border-t border-slate-100 align-middle dark:border-white/10 ${
                          selected ? "bg-rose-50/60 dark:bg-white/[0.06]" : ""
                        }`}
                      >
                        <td className="py-2 pr-3 font-medium">{val(q.quote_reference)}</td>
                        <td className="py-2 pr-3">{val(q.freight)}</td>
                        <td className="py-2 pr-3">{val(q.quote_title)}</td>
                        <td className="py-2 pr-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(q.status)}`}
                          >
                            {val(q.status)}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          {/* TODO fase 2: al seleccionar, continuar al resumen del envío */}
                          <button
                            type="button"
                            onClick={() => setSelectedQuote(selected ? null : q.quote_reference)}
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

      {/* Detalle del request */}
      {result && pickup && delivery && (
        <>
          <article className={card}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`${muted} uppercase tracking-wide`}>Solicitud</p>
                <h2 className="text-lg font-bold">{val(org.title)}</h2>
                <p className="text-sm text-slate-600 dark:text-white/70">{val(org.shipment_id)}</p>
              </div>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-[#C1374A] dark:bg-white/10">
                {val(org.request_status)}
              </span>
            </div>
            <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 dark:border-white/10 sm:grid-cols-3">
              <Field label="Tipo de envío">{val(org.shipment_type_display)}</Field>
              <Field label="Abierta para cotización">{val(org.open_for_quotation)}</Field>
              <Field label="Creación">{fmt(org.request_creation_datetime)}</Field>
              <Field label="Solicitante">{val(org.requestor)}</Field>
              <Field label="Correo del solicitante">{val(org.requestor_email)}</Field>
              <Field label="Embarcador">{val(org.shipper)}</Field>
            </div>
          </article>

          <article className={card}>
            <h2 className="mb-3 font-semibold">Programación</h2>
            <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
              <PointCard title="Recolección" p={pickup} />
              <ArrowRight className="h-5 w-5 shrink-0 rotate-90 self-center lg:rotate-0" />
              <PointCard title="Entrega" p={delivery} />
            </div>

            {stops.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">Paradas ({stops.length})</p>
                {stops.map((stop, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-100 p-3 text-sm dark:border-white/10"
                  >
                    <p className="font-medium">
                      {index + 1}. {val(stop.address_name)}
                    </p>
                    <p className={muted}>
                      {[stop.street, stop.city, stop.state, stop.zipcode, stop.country]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </p>
                    <p className={muted}>{fmt(stop.datetime)}</p>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className={card}>
            <h2 className="mb-3 font-semibold">Servicio</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Incoterm">{val(service.incoterm)}</Field>
              <Field label="Servicio requerido">{val(service.service_requirement_display)}</Field>
              <Field label="Despacho de exportación">{val(service.export_clearance)}</Field>
              <Field label="Despacho en tránsito">{val(service.transit_clearance)}</Field>
              <Field label="Despacho de importación">{val(service.import_clearance)}</Field>
              <Field label="Seguro">{val(service.insurance)}</Field>
              <Field label="Referencia del proveedor">{val(service.provider_reference)}</Field>
              <Field label="Equipo asignado">{val(service.available_teams?.assigned_team)}</Field>
            </div>

            <div className="mt-4">
              <p className={muted}>Modos de flete invitados</p>
              {modes.length ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  {modes.map((mode) => (
                    <span key={mode} className={chip}>
                      {mode}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium">-</p>
              )}
            </div>

            <div className="mt-4">
              <p className={muted}>Requisitos especiales</p>
              {requirements.length ? (
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                  {requirements.map((r, index) => (
                    <li key={index}>
                      {val(r.label)}
                      {r.additional_information ? ` - ${r.additional_information}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-medium">Sin requisitos especiales.</p>
              )}
            </div>
          </article>

          <article className={card}>
            <h2 className="mb-3 font-semibold">Lista de empaque ({items.length})</h2>
            {items.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className={muted}>
                    <tr>
                      <th className="py-2 pr-3">Unidades</th>
                      <th className="py-2 pr-3">Tipo de manejo</th>
                      <th className="py-2 pr-3">Dimensiones</th>
                      <th className="py-2 pr-3">Peso</th>
                      <th className="py-2 pr-3">CBM total</th>
                      <th className="py-2">Características</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-t border-slate-100 align-top dark:border-white/10">
                        <td className="py-2 pr-3">{val(item.units)}</td>
                        <td className="py-2 pr-3">{val(item.handling_unit)}</td>
                        <td className="py-2 pr-3">
                          {item.length || item.width || item.height
                            ? `${val(item.length)} x ${val(item.width)} x ${val(item.height)} ${item.m_unit ?? ""}`
                            : "-"}
                        </td>
                        <td className="py-2 pr-3">
                          {item.weight ? `${item.weight} ${item.w_unit ?? ""}` : "-"}
                        </td>
                        <td className="py-2 pr-3">{val(item.total_cbm)}</td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-1">
                            <Flag on={item.stackable} label="Apilable" />
                            <Flag on={item.hazardous} label="Peligroso" />
                            <Flag on={item.is_dangerous_good} label="Mercancía peligrosa" />
                            <Flag on={item.crating_required} label="Requiere embalaje" />
                            <Flag on={item.temperature_control_required} label="Control de temperatura" />
                          </div>
                          {item.un_number && <p className={`${muted} mt-1`}>UN: {item.un_number}</p>}
                          {item.other_instructions && (
                            <p className={`${muted} mt-1`}>{item.other_instructions}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm">-</p>
            )}
          </article>

          <article className={card}>
            <h2 className="mb-3 font-semibold">Facturación</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <BillingCard title="Facturado desde" party={billing.billed_from} />
              <BillingCard title="Facturado a" party={billing.billed_to} />
            </div>
          </article>
        </>
      )}
    </div>
  );
}
