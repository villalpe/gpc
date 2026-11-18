"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Mail, PackageCheck, Plus, Trash2 } from "lucide-react";
import {
  fedexDraftFromCargobase,
  isInternationalFedexDraft,
  type FedexDraft,
  type FedexCommodity,
  type FedexPackage,
  type FedexParty,
} from "@/lib/cargobase/fedex";

type CreatedShipment = {
  tracking_number: string;
  tracking_numbers: string[];
  labels: { file_name: string; content_base64: string }[];
  warning?: string;
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
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  step?: string;
  placeholder?: string;
}) {
  return (
    <label className={label}>
      {title}
      <input
        className={input}
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
}: {
  title: string;
  party: FedexParty;
  onChange: (key: keyof FedexParty, value: string | string[]) => void;
}) {
  const set = (key: keyof FedexParty) => (value: string) => onChange(key, value);

  return (
    <section className={card}>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field title="Empresa" value={party.company_name} onChange={set("company_name")} required />
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
    </section>
  );
}

function downloadPdf(base64: string, fileName: string) {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
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
  const isInternational = useMemo(
    () => (draft ? isInternationalFedexDraft(draft) : false),
    [draft]
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
        ? { ...current, [which]: { ...current[which], [key]: value } }
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
                dimension_units: "",
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
    setCreating(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/fedex/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const data = (await response.json()) as CreatedShipment;
      setCreated(data);
      setNotice("FedEx creó el envío. Revisa la guía y la etiqueta antes de enviar el correo.");
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
          labels: created.labels,
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
            <PackageCheck className="h-6 w-6 text-emerald-600" />
            <div>
              <h2 className="text-lg font-semibold">Envío creado en FedEx</h2>
              <p className="text-sm text-slate-600 dark:text-white/70">Guía: <strong>{created.tracking_number || "Revisar respuesta de FedEx"}</strong></p>
            </div>
          </div>
          {created.warning && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{created.warning}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            {created.labels.map((label, index) => (
              <button
                type="button"
                key={`${label.file_name}-${index}`}
                onClick={() => downloadPdf(label.content_base64, label.file_name)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-white/20"
              >
                <Download className="h-4 w-4" /> Descargar etiqueta {index + 1}
              </button>
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
              disabled={sending || emailSent || !draft.recipient_email || !created.tracking_number || !created.labels.length}
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
              <Field title="Servicio FedEx (código confirmado por GPC)" value={draft.service_type} onChange={(value) => setDraft({ ...draft, service_type: value })} required placeholder="Selecciona según ruta y cotización" />
              <SelectField title="Entrega o recolección" value={draft.pickup_type} onChange={(value) => setDraft({ ...draft, pickup_type: value })} required options={["DROPOFF_AT_FEDEX_LOCATION", "CONTACT_FEDEX_TO_SCHEDULE", "USE_SCHEDULED_PICKUP"]} />
              <Field title="Tipo de empaque FedEx" value={draft.packaging_type} onChange={(value) => setDraft({ ...draft, packaging_type: value })} required placeholder="Ej. YOUR_PACKAGING, confirmado por GPC" />
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

          <PartyFields title="Remitente (Cargobase)" party={draft.sender} onChange={(key, value) => updateParty("sender", key, value)} />
          <PartyFields title="Destinatario (Cargobase)" party={draft.recipient} onChange={(key, value) => updateParty("recipient", key, value)} />

          <section className={card}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Paquetes y mercancías</h2>
                <p className="text-sm text-slate-500 dark:text-white/60">Cada renglón representa unidades con las mismas medidas y peso.</p>
              </div>
              <button type="button" onClick={addPackage} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-white/20">
                <Plus className="h-4 w-4" /> Agregar paquete
              </button>
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
                    <Field title="Largo" type="number" step="0.01" value={item.length} onChange={(value) => updatePackage(index, "length", value)} required />
                    <Field title="Ancho" type="number" step="0.01" value={item.width} onChange={(value) => updatePackage(index, "width", value)} required />
                    <Field title="Alto" type="number" step="0.01" value={item.height} onChange={(value) => updatePackage(index, "height", value)} required />
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

          <section className={card}>
            <h2 className="mb-2 text-lg font-semibold">Correo posterior a la creación</h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-white/70">El correo se enviará solo cuando GPC pulse el botón después de revisar la guía y descargar la etiqueta.</p>
            <Field title="Correo del solicitante de Cargobase" type="email" value={draft.recipient_email} onChange={(value) => setDraft({ ...draft, recipient_email: value })} required />
          </section>

          <div className="flex justify-end">
            <button type="submit" disabled={creating} className="inline-flex items-center gap-2 rounded-xl bg-[#C1374A] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              <PackageCheck className="h-4 w-4" /> {creating ? "Creando guía en sandbox..." : "Crear guía FedEx"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
