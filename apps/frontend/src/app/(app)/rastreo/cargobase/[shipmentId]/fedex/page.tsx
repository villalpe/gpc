"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Mail, PackageCheck, Plus, Trash2 } from "lucide-react";
import {
  fedexDraftFromCargobase,
  fedexDomesticShipmentPayload,
  fedexRateQuoteKey,
  isInternationalFedexDraft,
  type FedexDraft,
  type FedexCommodity,
  type FedexPackage,
  type FedexParty,
} from "@/lib/cargobase/fedex";
import { fedexRoute, fedexServices } from "@/lib/cargobase/fedex-services";
import FedexRates from "@/components/tracking/FedexRates";
import FedexSavedAddresses from "@/components/tracking/FedexSavedAddresses";
import FedexNotificationPreferences from "@/components/tracking/FedexNotificationPreferences";

type CreatedShipment = {
  id: number;
  status: "processing" | "created" | "uncertain" | "failed";
  tracking_number: string;
  tracking_numbers: string[];
  labels: { id: number; file_name: string }[];
  warning?: string;
};

type SelectedFedexRate = {
  billingWeight: number | null;
  billingWeightUnits: string | null;
  ratedWeightMethod: string | null;
  shipDate: string;
  service: string;
  quoteKey: string;
};

const card =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]";
const input =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#C1374A] focus:ring-2 focus:ring-[#C1374A]/15 dark:border-white/20 dark:bg-slate-900 dark:text-white";
const label = "block text-sm font-medium text-slate-700 dark:text-white/80";

function Field({
  title,
  value,
  onChange,
  required = false,
  type = "text",
  step,
  placeholder,
  inputClassName,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  step?: string;
  placeholder?: string;
  inputClassName?: string;
}) {
  return (
    <label className={label}>
      {title}
      <input
        className={`${input} ${inputClassName ?? ""}`}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        step={step}
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectField({
  title,
  value,
  onChange,
  options,
  required = false,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className={label}>
      {title}
      <select
        className={input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        <option value="">Selecciona...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PartyFields({
  title,
  party,
  onChange,
  onSelect,
}: {
  title: string;
  party: FedexParty;
  onChange: (key: keyof FedexParty, value: string | string[]) => void;
  onSelect: (party: FedexParty) => void;
}) {
  const set = (key: keyof FedexParty) => (value: string) => onChange(key, value);
  const isSender = title.startsWith("Remitente");
  const sectionStyle = isSender
    ? {
        section: "border-sky-300 bg-sky-50/40 dark:border-sky-400/40 dark:bg-sky-950/15",
        heading: "border-sky-200 bg-sky-100 text-sky-950 dark:border-sky-400/30 dark:bg-sky-900/40 dark:text-sky-100",
        company: "!border-sky-400 !bg-sky-50 font-semibold focus:!border-sky-600 focus:!ring-sky-500/25 dark:!border-sky-400/60 dark:!bg-sky-950/60",
      }
    : {
        section: "border-amber-300 bg-amber-50/40 dark:border-amber-400/40 dark:bg-amber-950/15",
        heading: "border-amber-200 bg-amber-100 text-amber-950 dark:border-amber-400/30 dark:bg-amber-900/40 dark:text-amber-100",
        company: "!border-amber-400 !bg-amber-50 font-semibold focus:!border-amber-600 focus:!ring-amber-500/25 dark:!border-amber-400/60 dark:!bg-amber-950/60",
      };

  return (
    <section className={`${card} overflow-hidden border-2 p-0 ${sectionStyle.section}`}>
      <div className={`border-b px-5 py-3 ${sectionStyle.heading}`}>
        <p className="text-xs font-bold uppercase tracking-wider opacity-70">
          {isSender ? "Origen del envío" : "Destino del envío"}
        </p>
        <h2 className="mt-0.5 text-lg font-bold">{title}</h2>
      </div>
      <div className="p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          title="Empresa"
          value={party.company_name}
          onChange={set("company_name")}
          required
          inputClassName={sectionStyle.company}
        />
        <Field title="Contacto" value={party.person_name} onChange={set("person_name")} required />
        <Field title="Teléfono" value={party.phone_number} onChange={set("phone_number")} required />
        <Field title="Correo" type="email" value={party.email_address} onChange={set("email_address")} />
        <label className={label}>
          Dirección (hasta 3 líneas)
          <textarea
            className={input}
            rows={3}
            value={party.street_lines.join("\n")}
            onChange={(event) =>
              onChange(
                "street_lines",
                event.target.value
                  .split(/\r?\n/)
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .slice(0, 3)
              )
            }
            required
          />
        </label>
        <Field title="Ciudad" value={party.city} onChange={set("city")} required />
        <Field title="Estado / provincia (código)" value={party.state} onChange={set("state")} />
        <Field title="Código postal" value={party.postal_code} onChange={set("postal_code")} required />
        <Field
          title="País (código ISO de 2 letras)"
          value={party.country_code}
          onChange={set("country_code")}
          required
          placeholder="MX"
        />
      </div>
      <FedexSavedAddresses party={party} onSelect={onSelect} />
      </div>
    </section>
  );
}

async function responseError(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (typeof data.detail === "string") return data.detail;
  return JSON.stringify(data);
}

export default function FedexShipmentReviewPage() {
  const params = useParams<{ shipmentId: string }>();
  const router = useRouter();
  const cbNumber = String(params.shipmentId ?? "").toUpperCase();
  const validCbNumber = /^S\d{9}$/.test(cbNumber);
  const [draft, setDraft] = useState<FedexDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [created, setCreated] = useState<CreatedShipment | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [confirmSandbox, setConfirmSandbox] = useState(false);
  const [selectedRate, setSelectedRate] = useState<SelectedFedexRate | null>(null);
  const isInternational = useMemo(
    () => (draft ? isInternationalFedexDraft(draft) : false),
    [draft]
  );
  const route = draft
    ? fedexRoute(draft.sender.country_code, draft.recipient.country_code)
    : "unknown";
  const updateRequesterEmail = useCallback((email: string) => {
    setDraft((current) => current ? { ...current, recipient_email: email } : current);
  }, []);
  const currentSelectedRate = draft && selectedRate &&
    selectedRate.shipDate === draft.ship_date &&
    selectedRate.service === draft.service_type &&
    selectedRate.quoteKey === fedexRateQuoteKey(draft)
    ? selectedRate
    : null;
  const isDomesticUs = Boolean(
    draft &&
      draft.sender.country_code.toUpperCase() === "US" &&
      draft.recipient.country_code.toUpperCase() === "US"
  );

  useEffect(() => {
    let active = true;
    if (!validCbNumber) return;

    fetch(`/api/cargobase/requests/${encodeURIComponent(cbNumber)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseError(response));
        return response.json();
      })
      .then((data: unknown) => {
        if (active) setDraft(fedexDraftFromCargobase(data, cbNumber));
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "No se pudo cargar la información de Cargobase."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cbNumber, validCbNumber]);

  function updateParty(
    which: "sender" | "recipient",
    key: keyof FedexParty,
    value: string | string[]
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            [which]: { ...current[which], [key]: value },
            service_type: key === "country_code" ? "" : current.service_type,
          }
        : current
    );
  }

  function updatePackage(
    index: number,
    key: Exclude<keyof FedexPackage, "customs_items">,
    value: string
  ) {
    setDraft((current) => {
      if (!current) return current;
      const packages = [...current.packages];
      packages[index] = { ...packages[index], [key]: value };
      return { ...current, packages };
    });
  }

  function updateCommodity(
    packageIndex: number,
    commodityIndex: number,
    key: keyof FedexCommodity,
    value: string
  ) {
    setDraft((current) => {
      if (!current) return current;
      const packages = [...current.packages];
      const packageItem = { ...packages[packageIndex] };
      const customsItems = [...packageItem.customs_items];
      customsItems[commodityIndex] = {
        ...customsItems[commodityIndex],
        [key]: value,
      };
      packageItem.customs_items = customsItems;
      packages[packageIndex] = packageItem;
      return { ...current, packages };
    });
  }

  function addCommodity(packageIndex: number) {
    setDraft((current) => {
      if (!current) return current;
      const packages = [...current.packages];
      const packageItem = { ...packages[packageIndex] };
      packageItem.customs_items = [
        ...packageItem.customs_items,
        {
          description: "",
          hs_code: "",
          origin_country: "",
          quantity: "",
          weight: "",
          weight_units: "",
          customs_value: "",
          customs_currency: "",
        },
      ];
      packages[packageIndex] = packageItem;
      return { ...current, packages };
    });
  }

  function removeCommodity(packageIndex: number, commodityIndex: number) {
    setDraft((current) => {
      if (!current) return current;
      const packages = [...current.packages];
      const packageItem = { ...packages[packageIndex] };
      packageItem.customs_items = packageItem.customs_items.filter(
        (_, index) => index !== commodityIndex
      );
      packages[packageIndex] = packageItem;
      return { ...current, packages };
    });
  }

  function addPackage() {
    setDraft((current) =>
      current
        ? {
            ...current,
            packages: [
              ...current.packages,
              {
                quantity: "1",
                weight: "",
                weight_units: "",
                length: "",
                width: "",
                height: "",
                dimension_units: "IN",
                customs_items: [
                  {
                    description: "",
                    hs_code: "",
                    origin_country: "",
                    quantity: "1",
                    weight: "",
                    weight_units: "",
                    customs_value: "",
                    customs_currency: "",
                  },
                ],
              },
            ],
          }
        : current
    );
  }

  async function createShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    if (!isDomesticUs) {
      setError("En esta primera etapa solo se pueden crear envíos domésticos dentro de Estados Unidos.");
      return;
    }
    setCreating(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/fedex/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fedexDomesticShipmentPayload(draft)),
      });
      const data = (await response.json().catch(() => ({}))) as {
      detail?: string;
      shipment?: CreatedShipment;
      } & Partial<CreatedShipment>;
      if (!response.ok) {
      if (data.shipment?.status === "uncertain" || data.shipment?.status === "processing") {
        setCreated(data.shipment);
        setError(data.detail || "No se pudo confirmar el resultado. No vuelvas a crear el envío.");
        return;
      }
      throw new Error(data.detail || "No se pudo crear el envío en FedEx.");
      }
      const shipment = data as CreatedShipment;
      setCreated(shipment);
      setNotice(
      shipment.status === "created"
        ? "FedEx creó el envío. Revisa la guía y la etiqueta antes de enviar el correo."
        : "La respuesta de FedEx requiere verificación. El CB quedó bloqueado para evitar duplicados."
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "No se pudo crear el envío en FedEx."
      );
    } finally {
      setCreating(false);
    }
  }

  async function sendEmail() {
    if (!draft || !created) return;
    setSending(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/fedex/shipments/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cb_number: draft.cb_number,
          tracking_number: created.tracking_number,
          recipient_email: draft.recipient_email,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      setEmailSent(true);
      setNotice(`Correo enviado a ${draft.recipient_email}.`);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "No se pudo enviar el correo."
      );
    } finally {
      setSending(false);
    }
  }

  if (!validCbNumber) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <button type="button" onClick={() => router.back()} className="text-sm font-semibold text-[#C1374A]">
          Volver
        </button>
        <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Número CB inválido.</p>
      </div>
    );
  }

  if (loading) {
    return <p className="mx-auto max-w-5xl p-6 text-sm text-slate-600">Cargando datos de Cargobase...</p>;
  }

  if (!draft) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <button type="button" onClick={() => router.back()} className="text-sm font-semibold text-[#C1374A]">
          Volver
        </button>
        <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#C1374A] dark:text-white/70"
      >
        <ArrowLeft className="h-4 w-4" /> Regresar a Cargobase
      </button>

      <header className={card}>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#C1374A]">FedEx · Revisión de envío</p>
        <h1 className="mt-1 text-2xl font-bold">CB {draft.cb_number}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
          Revisa y completa los datos. No se creará la guía hasta que confirmes el formulario.
          {isInternational && " Por ser internacional, se validarán los datos aduanales antes de enviar a FedEx."}
        </p>
      </header>

      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">{notice}</p>}

      {created ? (
        <section className={card}>
          <div className="flex items-center gap-3">
            <PackageCheck className={`h-6 w-6 ${created.status === "created" ? "text-emerald-600" : "text-amber-600"}`} />
            <div>
              <h2 className="text-lg font-semibold">
                {created.status === "created" ? "Envío creado en FedEx" : "Resultado pendiente de verificar"}
              </h2>
              <p className="text-sm text-slate-600 dark:text-white/70">Guía: <strong>{created.tracking_number || "Revisar respuesta de FedEx"}</strong></p>
            </div>
          </div>
          {created.warning && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{created.warning}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            {created.labels.map((label, index) => (
              <a
                key={`${label.file_name}-${index}`}
                href={`/api/fedex/shipments/labels/${label.id}`}
                download={label.file_name}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-white/20"
              >
                <Download className="h-4 w-4" /> Descargar etiqueta {index + 1}
              </a>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <Field
              title="Correo del solicitante"
              type="email"
              value={draft.recipient_email}
              onChange={(value) => setDraft((current) => current ? { ...current, recipient_email: value } : current)}
              required
            />
            <button
              type="button"
              onClick={sendEmail}
              disabled={sending || emailSent || created.status !== "created" || !draft.recipient_email || !created.tracking_number || !created.labels.length}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#C1374A] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Mail className="h-4 w-4" /> {sending ? "Enviando..." : emailSent ? "Correo enviado" : "Enviar correo con guía"}
            </button>
          </div>
        </section>
      ) : (
        <form onSubmit={createShipment} className="space-y-5">
          <section className={card}>
            <h2 className="mb-4 text-lg font-semibold">Configuración FedEx</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field title="Fecha de envío" type="date" value={draft.ship_date} onChange={(value) => setDraft({ ...draft, ship_date: value })} required />
              <label className={label}>
                Servicio FedEx
                <select
                  className={input}
                  value={draft.service_type}
                  onChange={(event) => setDraft({ ...draft, service_type: event.target.value })}
                  disabled={route === "unknown"}
                  required
                >
                  <option value="">
                    {route === "unknown" ? "Completa los países de origen y destino" : "Selecciona un servicio..."}
                  </option>
                  {fedexServices(route).map((service) => (
                    <option key={service.label} value={service.code ?? service.label} disabled={!service.code}>
                      {service.label}{service.reason ? ` — ${service.reason}` : ""}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-white/60">
                  Opciones de referencia, no una consulta de disponibilidad. FedEx debe confirmar el servicio para la ruta, paquete y cuenta.
                </span>
              </label>
              <label className={label}>
                Entrega o recolección
                <select
                  className={input}
                  value={draft.pickup_type}
                  onChange={(event) => setDraft({ ...draft, pickup_type: event.target.value })}
                  required
                >
                  <option value="DROPOFF_AT_FEDEX_LOCATION">DROPOFF_AT_FEDEX_LOCATION</option>
                  <option value="CONTACT_FEDEX_TO_SCHEDULE" disabled>CONTACT_FEDEX_TO_SCHEDULE</option>
                  <option value="USE_SCHEDULED_PICKUP" disabled>USE_SCHEDULED_PICKUP</option>
                </select>
                <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-white/60">
                  DROPOFF_AT_FEDEX_LOCATION significa dejar el paquete en FedEx; no agenda una recolección.
                  Las otras opciones están deshabilitadas por ahora.
                </span>
              </label>
              <label className={label}>Tipo de empaque FedEx
                <input className={input} value="YOUR_PACKAGING" readOnly />
                <span className="mt-1 block text-xs font-normal text-slate-500">Solo para empaque propio.</span>
              </label>
              <SelectField title="Quién paga el transporte" value={draft.payment_type} onChange={(value) => setDraft({ ...draft, payment_type: value })} required options={["SENDER", "RECIPIENT", "THIRD_PARTY"]} />
              {draft.payment_type !== "SENDER" && (
                <Field title="Cuenta FedEx que paga el transporte" type="password" value={draft.payment_account_number} onChange={(value) => setDraft({ ...draft, payment_account_number: value })} required />
              )}
              {isInternational && (
                <SelectField title="Quién paga cargos aduanales" value={draft.duties_payment_type} onChange={(value) => setDraft({ ...draft, duties_payment_type: value })} required options={["SENDER", "RECIPIENT", "THIRD_PARTY"]} />
              )}
              {isInternational && draft.duties_payment_type && draft.duties_payment_type !== "SENDER" && (
                <Field title="Cuenta FedEx que paga los cargos aduanales" type="password" value={draft.duties_account_number} onChange={(value) => setDraft({ ...draft, duties_account_number: value })} required />
              )}
            </div>
          </section>

          <FedexRates
            draft={draft}
            onSelect={(date, service) =>
              setDraft((current) => current
                ? { ...current, ship_date: date, service_type: service }
                : current)
            }
            onRateSelected={(rate, shipDate, quoteKey) => setSelectedRate({
              billingWeight: rate.billing_weight,
              billingWeightUnits: rate.billing_weight_units,
              ratedWeightMethod: rate.rated_weight_method,
              shipDate,
              service: rate.service_type,
              quoteKey,
            })}
          />

          <PartyFields title="Remitente (Cargobase)" party={draft.sender} onChange={(key, value) => updateParty("sender", key, value)} onSelect={(party) => setDraft({ ...draft, sender: party, service_type: "" })} />
          <PartyFields title="Destinatario (Cargobase)" party={draft.recipient} onChange={(key, value) => updateParty("recipient", key, value)} onSelect={(party) => setDraft({ ...draft, recipient: party, service_type: "" })} />

          <section className={card}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Paquetes y mercancías</h2>
                <p className="text-sm text-slate-500 dark:text-white/60">Cada renglón representa unidades con las mismas medidas y peso.</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">Las medidas recibidas en centímetros se convierten a pulgadas enteras redondeadas; revisa las medidas antes de cotizar.</p>
              </div>
              <button type="button" onClick={addPackage} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-white/20">
                <Plus className="h-4 w-4" /> Agregar paquete
              </button>
            </div>
            <div className={`mb-4 rounded-xl border-2 p-4 shadow-sm ${
              currentSelectedRate
                ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/10"
                : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.03]"
            }`}>
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-800 dark:text-indigo-300">
                Peso cobrable estimado · FedEx
              </p>
              {currentSelectedRate &&
              typeof currentSelectedRate.billingWeight === "number" &&
              currentSelectedRate.billingWeightUnits ? (
                <>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-950 dark:text-indigo-100">
                    {currentSelectedRate.billingWeight} {currentSelectedRate.billingWeightUnits}
                    {currentSelectedRate.ratedWeightMethod === "ACTUAL"
                      ? " · real"
                      : currentSelectedRate.ratedWeightMethod === "DIM" ||
                          currentSelectedRate.ratedWeightMethod === "DIMENSIONAL"
                        ? " · volumétrico"
                        : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-white/70">
                    Peso del envío cotizado (todas las cajas), según FedEx; no es el peso por caja.
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
                  Selecciona una tarifa para ver el peso cobrable que FedEx devolvió. Si FedEx no lo incluye, aparecerá como no proporcionado.
                </p>
              )}
            </div>
            <div className="space-y-5">
              {draft.packages.map((item, index) => (
                <div key={index} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">Paquete {index + 1}</h3>
                    {draft.packages.length > 1 && (
                      <button type="button" onClick={() => setDraft({ ...draft, packages: draft.packages.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Eliminar paquete ${index + 1}`} className="text-rose-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field title="Cantidad" type="number" step="1" value={item.quantity} onChange={(value) => updatePackage(index, "quantity", value)} required />
                    <Field title="Peso por unidad" type="number" step="0.001" value={item.weight} onChange={(value) => updatePackage(index, "weight", value)} required />
                    <SelectField title="Unidad de peso" value={item.weight_units} onChange={(value) => updatePackage(index, "weight_units", value)} required options={["KG", "LB"]} />
                    <Field title="Largo" type="number" step="1" value={item.length} onChange={(value) => updatePackage(index, "length", value)} required />
                    <Field title="Ancho" type="number" step="1" value={item.width} onChange={(value) => updatePackage(index, "width", value)} required />
                    <Field title="Alto" type="number" step="1" value={item.height} onChange={(value) => updatePackage(index, "height", value)} required />
                    <SelectField title="Unidad de dimensiones" value={item.dimension_units} onChange={(value) => updatePackage(index, "dimension_units", value)} required options={["CM", "IN"]} />
                    {isInternational && (
                      <>
                        <div className="sm:col-span-3">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-medium">Mercancías / datos aduanales</h4>
                            <button type="button" onClick={() => addCommodity(index)} className="text-sm font-semibold text-[#C1374A]">Agregar mercancía</button>
                          </div>
                          <div className="space-y-4">
                            {item.customs_items.map((commodity, commodityIndex) => (
                              <div key={commodityIndex} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                                <div className="mb-3 flex items-center justify-between">
                                  <span className="text-sm font-semibold">Mercancía {commodityIndex + 1}</span>
                                  {item.customs_items.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeCommodity(index, commodityIndex)}
                                      className="text-rose-600"
                                      aria-label={`Eliminar mercancía ${commodityIndex + 1}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                                <div className="grid gap-4 sm:grid-cols-3">
                                  <Field title="Descripción aduanal" value={commodity.description} onChange={(value) => updateCommodity(index, commodityIndex, "description", value)} required />
                                  <Field title="Código HS" value={commodity.hs_code} onChange={(value) => updateCommodity(index, commodityIndex, "hs_code", value)} required />
                                  <Field title="País de origen (ISO 2 letras)" value={commodity.origin_country} onChange={(value) => updateCommodity(index, commodityIndex, "origin_country", value.toUpperCase())} required />
                                  <Field title="Cantidad de mercancía" type="number" step="1" value={commodity.quantity} onChange={(value) => updateCommodity(index, commodityIndex, "quantity", value)} required />
                                  <Field title="Peso de mercancía" type="number" step="0.001" value={commodity.weight} onChange={(value) => updateCommodity(index, commodityIndex, "weight", value)} required />
                                  <SelectField title="Unidad de peso" value={commodity.weight_units} onChange={(value) => updateCommodity(index, commodityIndex, "weight_units", value)} required options={["KG", "LB"]} />
                                  <Field title="Valor aduanal total" type="number" step="0.01" value={commodity.customs_value} onChange={(value) => updateCommodity(index, commodityIndex, "customs_value", value)} required />
                                  <Field title="Moneda (ISO 3 letras)" value={commodity.customs_currency} onChange={(value) => updateCommodity(index, commodityIndex, "customs_currency", value.toUpperCase())} required placeholder="USD" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <FedexNotificationPreferences
            cbNumber={draft.cb_number}
            senderEmail={draft.sender.email_address}
            recipientEmail={draft.recipient.email_address}
            requesterEmail={draft.recipient_email}
            onRequesterEmailChange={updateRequesterEmail}
          />

          {!isDomesticUs && (
            <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              La creación de guías está habilitada por ahora solo para envíos domésticos US→US.
            </p>
          )}
          <label className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <input
              type="checkbox"
              checked={confirmSandbox}
              onChange={(event) => setConfirmSandbox(event.target.checked)}
              required
              className="mt-0.5 h-4 w-4 accent-[#C1374A]"
            />
            <span>Confirmo que esta solicitud creará una guía FedEx en el entorno sandbox y que revisaré su resultado antes de repetirla.</span>
          </label>
          <div className="flex justify-end">
            <button type="submit" disabled={creating || !confirmSandbox || !isDomesticUs} className="inline-flex items-center gap-2 rounded-xl bg-[#C1374A] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              <PackageCheck className="h-4 w-4" /> {creating ? "Creando guía en sandbox..." : "Crear guía FedEx"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
