"use client";

import { useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Globe2,
  Scale,
  Send,
  ShieldCheck,
  Truck,
  BadgeDollarSign,
  Target,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type ShipmentScope = "nacional" | "internacional";
type Urgency = "economico" | "express" | "prioritario";
type Frequency = "unico" | "semanal" | "mensual";

type QuoteOption = {
  rate_id: string;
  carrier: string;
  carrier_code: string;
  service: string;
  service_code: string;
  estimated_days: number | null;
  pickup_type: "pickup" | "dropoff" | null;
  pickup_available: boolean;
  office_pickup_available: boolean;
  delivery_type: "home" | "ocurre";
  packaging_type: string | null;
  mode: "parcel" | "freight";
  fulfillment_level: string | null;
  requires_origin_verification: boolean;
  price?: string; // viene solo para roles con permiso
  price_breakdown?: {
    amount?: string | null;
    vat_fee?: string | null;
    service_fee?: string | null;
    extra_fees?: Array<{
      code: string;
      value: number;
      groupable?: boolean;
      group_code?: string | null;
    }>;
    currency_code?: string | null;
  };
  total_value_with_protection?: string;
};

type QuoteResponse = {
  message: string;
  data: {
    id: number;
    provider: string;
    provider_quotation_id: string;
    origin: {
      country_code: string;
      postal_code: string;
      state: string;
      city: string;
      area: string;
    };
    destination: {
      country_code: string;
      postal_code: string;
      state: string;
      city: string;
      area: string;
    };
    parcels: Array<{
      length_cm: number;
      width_cm: number;
      height_cm: number;
      weight_kg: number;
    }>;
    weight: {
      real_kg: number;
      volumetric_kg: number;
      chargeable_kg: number;
      volumetric_factor: number;
    };
    options: {
      parcel: QuoteOption[];
      freight: QuoteOption[];
    };
    created_at: string;
  };
};

const TOTAL_STEPS = 4 as const;

export default function QuotePage() {
  // Stepper
  const [step, setStep] = useState(1);

  // Contacto (se mantiene por UX, aunque backend actual de quotes no lo usa)
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Envío
  const [scope, setScope] = useState<ShipmentScope>("nacional");
  const [serviceType, setServiceType] = useState("paquete");

  // Ruta
  const [originCountry, setOriginCountry] = useState("MX");
  const [originState, setOriginState] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [originArea, setOriginArea] = useState("");
  const [originZip, setOriginZip] = useState("");

  const [destCountry, setDestCountry] = useState("MX");
  const [destState, setDestState] = useState("");
  const [destCity, setDestCity] = useState("");
  const [destArea, setDestArea] = useState("");
  const [destZip, setDestZip] = useState("");

  // Dimensiones y peso
  const [weightKg, setWeightKg] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [pieces, setPieces] = useState("1");

  // Condiciones
  const [declaredValue, setDeclaredValue] = useState("");
  const [requiresInsurance, setRequiresInsurance] = useState(false);
  const [urgency, setUrgency] = useState<Urgency>("economico");
  const [frequency, setFrequency] = useState<Frequency>("unico");
  const [pickup, setPickup] = useState(true);

  // Comentarios / estado
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Resultados
  const [quoteParcelOptions, setQuoteParcelOptions] = useState<QuoteOption[]>([]);
  const [quoteFreightOptions, setQuoteFreightOptions] = useState<QuoteOption[]>([]);
  const [serverWeight, setServerWeight] = useState<QuoteResponse["data"]["weight"] | null>(null);

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

  const numericWeight = Number(weightKg || 0);
  const volumetricKg = useMemo(() => {
    const l = Number(lengthCm || 0);
    const w = Number(widthCm || 0);
    const h = Number(heightCm || 0);
    if (!l || !w || !h) return 0;
    return Number(((l * w * h) / 5000).toFixed(2));
  }, [lengthCm, widthCm, heightCm]);

  const chargeableWeight = useMemo(() => Math.max(numericWeight, volumetricKg), [numericWeight, volumetricKg]);

  const isStep1Valid =
    fullName.trim().length >= 3 &&
    emailValid &&
    phone.trim().length >= 8;

  const isStep2Valid =
    scope.length > 0 &&
    serviceType.length > 0 &&
    originCountry.trim().toUpperCase() === "MX" &&
    originZip.trim().length >= 4 &&
    originState.trim().length >= 2 &&
    originCity.trim().length >= 2 &&
    originArea.trim().length >= 2 &&
    destCountry.trim().toUpperCase() === "MX" &&
    destZip.trim().length >= 4 &&
    destState.trim().length >= 2 &&
    destCity.trim().length >= 2 &&
    destArea.trim().length >= 2;

  const isStep3Valid =
    Number(pieces) > 0 &&
    numericWeight > 0 &&
    Number(lengthCm) > 0 &&
    Number(widthCm) > 0 &&
    Number(heightCm) > 0 &&
    urgency.length > 0 &&
    frequency.length > 0;

  const isValid = isStep1Valid && isStep2Valid && isStep3Valid;

  const progress = Math.round((step / TOTAL_STEPS) * 100);

  function goNext() {
    setError("");
    if (step === 1 && !isStep1Valid) {
      setError("Completa nombre, correo válido y teléfono para continuar.");
      return;
    }
    if (step === 2 && !isStep2Valid) {
      setError("Completa origen y destino en MX (estado, ciudad, colonia y CP).");
      return;
    }
    if (step === 3 && !isStep3Valid) {
      setError("Completa piezas, peso, dimensiones y condiciones del servicio.");
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess(false);
    setError("");
    setQuoteParcelOptions([]);
    setQuoteFreightOptions([]);
    setServerWeight(null);

    if (!isValid) {
      setError("Completa los campos obligatorios para poder cotizar tu operación de carga.");
      return;
    }

    if (scope !== "nacional") {
      setError("Por ahora solo está habilitada la cotización nacional (MX).");
      return;
    }

    setLoading(true);
    try {
      const piecesCount = Number(pieces) || 1;
      const baseParcel = {
        length: Number(lengthCm),
        width: Number(widthCm),
        height: Number(heightCm),
        weight: Number(weightKg),
        ...(declaredValue ? { declared_value: Number(declaredValue) } : {}),
        ...(requiresInsurance ? { package_protected: true } : {}),
      };

      const parcels = Array.from({ length: piecesCount }, () => ({ ...baseParcel }));

      const payload = {
        origin: {
          country_code: originCountry.trim().toUpperCase(), // debe ser MX
          postal_code: originZip.trim(),
          state: originState.trim(),
          city: originCity.trim(),
          area: originArea.trim(),
        },
        destination: {
          country_code: destCountry.trim().toUpperCase(), // debe ser MX
          postal_code: destZip.trim(),
          state: destState.trim(),
          city: destCity.trim(),
          area: destArea.trim(),
        },
        parcels,
      };

      const res = await fetch("/api/quotes/skydropx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => null)) as QuoteResponse | { message?: string; detail?: string } | null;

      if (!res.ok) {
        const msg =
          (json && "message" in json && json.message) ||
          (json && "detail" in json && json.detail) ||
          "No se pudo procesar la cotización.";
        throw new Error(msg);
      }

      const data = (json as QuoteResponse).data;
      setQuoteParcelOptions(data?.options?.parcel ?? []);
      setQuoteFreightOptions(data?.options?.freight ?? []);
      setServerWeight(data?.weight ?? null);
      setSuccess(true);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la solicitud. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(opt: QuoteOption) {
    if (!opt.price) return "Precio disponible al solicitar";
    const n = Number(opt.price);
    if (Number.isNaN(n)) return `${opt.price} MXN`;
    return `$${n.toFixed(2)} MXN`;
    }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#030712] dark:text-white">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#0B1220]">
        <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[radial-gradient(circle_at_15%_20%,rgba(255,90,107,0.18),transparent_35%)]" />
        <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[radial-gradient(circle_at_85%_85%,rgba(124,143,184,0.16),transparent_42%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9F2436] dark:border-white/20 dark:bg-white/10 dark:text-white/80">
              Cotización logística de carga
            </p>
            <h1 className="mt-3 text-2xl font-extrabold md:text-3xl dark:bg-gradient-to-r dark:from-white dark:via-rose-100 dark:to-white dark:bg-clip-text dark:text-transparent">
              Compara opciones y elige la mejor para tu operación
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-white/75">
              Evaluamos costo, tránsito y confiabilidad con aliados estratégicos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-transparent px-0 py-0 shadow-none border-0 dark:rounded-xl dark:border dark:border-slate-200 dark:bg-white dark:px-2 dark:py-1 dark:shadow-sm">
              <div className="relative h-20 w-[175px]">
                <Image src="/images/Logo-fb.png" alt="Global Pack Center" fill className="object-contain" sizes="175px" />
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              Inicio
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:px-8">
        <aside className="space-y-4 lg:col-span-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
            <h2 className="text-lg font-bold">¿Qué evaluamos por ti?</h2>
            <ul className="mt-3 space-y-3 text-sm text-slate-600 dark:text-white/75">
              <li className="flex gap-2"><Truck className="mt-0.5 h-4 w-4 text-[#C1374A]" />Tiempo de tránsito estimado</li>
              <li className="flex gap-2"><Scale className="mt-0.5 h-4 w-4 text-[#C1374A]" />Peso real vs volumétrico</li>
              <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-[#C1374A]" />Seguro y valor declarado</li>
              <li className="flex gap-2"><Globe2 className="mt-0.5 h-4 w-4 text-[#C1374A]" />Cobertura nacional/internacional</li>
              <li className="flex gap-2"><Clock3 className="mt-0.5 h-4 w-4 text-[#C1374A]" />Urgencia y frecuencia operativa</li>
              <li className="flex gap-2"><Target className="mt-0.5 h-4 w-4 text-[#C1374A]" />Mejor relación costo-beneficio</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
            <h3 className="font-semibold">Peso cobrable estimado</h3>
            <p className="mt-2 text-2xl font-bold">{chargeableWeight.toFixed(2)} kg</p>
            <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-white/70">
              <p>Peso real: <strong>{numericWeight.toFixed(2)} kg</strong></p>
              <p>Peso volumétrico: <strong>{volumetricKg.toFixed(2)} kg</strong></p>
            </div>
            {serverWeight && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-white/15 dark:bg-white/5">
                <p>Confirmado por servidor: <strong>{serverWeight.chargeable_kg.toFixed(2)} kg</strong></p>
              </div>
            )}
          </article>
        </aside>

        <section className="lg:col-span-8">
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06] md:p-6"
          >
            {/* Stepper header */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-white/60">
                <span>Paso {step} de {TOTAL_STEPS}</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-[#C1374A] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {step === 1 && (
              <div className="grid gap-4 md:grid-cols-2">
                <h3 className="md:col-span-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-white/60">
                  1. Datos de contacto
                </h3>
                <Input label="Nombre completo *" value={fullName} onChange={setFullName} placeholder="Tu nombre" />
                <Input label="Empresa" value={company} onChange={setCompany} placeholder="Razón social / comercial" />
                <Input label="Email *" value={email} onChange={setEmail} placeholder="tu@empresa.com" type="email" />
                <Input label="Teléfono / WhatsApp *" value={phone} onChange={setPhone} placeholder="+52..." />
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4 md:grid-cols-2">
                <h3 className="md:col-span-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-white/60">
                  2. Perfil del envío y ruta (solo MX)
                </h3>
                <Select
                  label="Tipo de envío *"
                  value={scope}
                  onChange={setScope}
                  options={[
                    { label: "Nacional", value: "nacional" },
                    { label: "Internacional (próximamente)", value: "internacional" },
                  ]}
                />
                <Select
                  label="Servicio *"
                  value={serviceType}
                  onChange={setServiceType}
                  options={[
                    { label: "Paquetería", value: "paquete" },
                    { label: "Documento", value: "documento" },
                    { label: "Carga ligera", value: "carga_ligera" },
                    { label: "Carga consolidada", value: "carga_consolidada" },
                  ]}
                />

                <Input label="País origen (ISO) *" value={originCountry} onChange={setOriginCountry} placeholder="MX" />
                <Input label="CP origen *" value={originZip} onChange={setOriginZip} placeholder="64000" />
                <Input label="Estado origen *" value={originState} onChange={setOriginState} placeholder="Nuevo León" />
                <Input label="Ciudad origen *" value={originCity} onChange={setOriginCity} placeholder="Monterrey" />
                <Input label="Colonia/Área origen *" value={originArea} onChange={setOriginArea} placeholder="Centro" />

                <Input label="País destino (ISO) *" value={destCountry} onChange={setDestCountry} placeholder="MX" />
                <Input label="CP destino *" value={destZip} onChange={setDestZip} placeholder="44100" />
                <Input label="Estado destino *" value={destState} onChange={setDestState} placeholder="Jalisco" />
                <Input label="Ciudad destino *" value={destCity} onChange={setDestCity} placeholder="Guadalajara" />
                <Input label="Colonia/Área destino *" value={destArea} onChange={setDestArea} placeholder="Americana" />

                <Input label="Piezas *" value={pieces} onChange={setPieces} placeholder="1" type="number" />
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4 md:grid-cols-2">
                <h3 className="md:col-span-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-white/60">
                  3. Dimensiones y condiciones
                </h3>
                <Input label="Peso real (kg) *" value={weightKg} onChange={setWeightKg} placeholder="2.5" type="number" />
                <Input label="Valor declarado (MXN)" value={declaredValue} onChange={setDeclaredValue} placeholder="2500" type="number" />
                <Input label="Largo (cm) *" value={lengthCm} onChange={setLengthCm} placeholder="30" type="number" />
                <Input label="Ancho (cm) *" value={widthCm} onChange={setWidthCm} placeholder="20" type="number" />
                <Input label="Alto (cm) *" value={heightCm} onChange={setHeightCm} placeholder="15" type="number" />
                <Select
                  label="Urgencia *"
                  value={urgency}
                  onChange={setUrgency}
                  options={[
                    { label: "Económico", value: "economico" },
                    { label: "Express", value: "express" },
                    { label: "Prioritario", value: "prioritario" },
                  ]}
                />
                <Select
                  label="Frecuencia *"
                  value={frequency}
                  onChange={setFrequency}
                  options={[
                    { label: "Único envío", value: "unico" },
                    { label: "Semanal", value: "semanal" },
                    { label: "Mensual", value: "mensual" },
                  ]}
                />

                <label className="md:col-span-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={requiresInsurance}
                    onChange={(e) => setRequiresInsurance(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Requiere seguro
                </label>

                <label className="md:col-span-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={pickup}
                    onChange={(e) => setPickup(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Recolección a domicilio (preferencia)
                </label>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-white/60">
                  4. Confirmación y comentarios
                </h3>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/15 dark:bg-white/[0.04]">
                  <p><strong>Contacto:</strong> {fullName} · {email} · {phone}</p>
                  <p><strong>Ruta:</strong> {originCity} ({originZip}) → {destCity} ({destZip})</p>
                  <p><strong>Peso cobrable estimado:</strong> {chargeableWeight.toFixed(2)} kg</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Comentarios operativos</label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Horario de recolección, restricciones, contenido, referencias internas, etc."
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#FF5A6B] focus:ring-4 focus:ring-[#FF5A6B]/15 dark:border-white/20 dark:bg-slate-900/60 dark:text-white"
                  />
                </div>

                <p className="text-xs text-slate-500 dark:text-white/60">
                  Los tiempos y tarifas pueden variar por cobertura, dimensiones, peso cobrable y condiciones del servicio.
                </p>
              </div>
            )}

            {/* Footer acciones */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === 1 || loading}
                  className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>

                {step < TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={loading}
                    className="inline-flex h-10 items-center gap-1 rounded-xl bg-[#C1374A] px-4 text-sm font-semibold text-white transition hover:bg-[#9F2436] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!isValid || loading}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#C1374A] px-4 text-sm font-semibold text-white transition hover:bg-[#9F2436] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {loading ? "Cotizando..." : "Obtener cotización recomendada"}
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-white/60">
                Paso {step} de {TOTAL_STEPS}
              </p>
            </div>

            {success && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Listo. Encontramos opciones alineadas a tu operación de carga.
                </span>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300">
                <span className="inline-flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </span>
              </div>
            )}

            {(quoteParcelOptions.length > 0 || quoteFreightOptions.length > 0) && (
              <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/15 dark:bg-white/[0.04]">
                <h4 className="flex items-center gap-2 text-base font-bold">
                  <BadgeDollarSign className="h-4 w-4 text-[#C1374A]" />
                  Opciones de cotización
                </h4>

                {/* Paquetería */}
                {quoteParcelOptions.length > 0 && (
                  <div>
                    <h5 className="mb-2 text-sm font-semibold">Paquetería</h5>
                    <div className="grid gap-3 md:grid-cols-3">
                      {quoteParcelOptions.map((opt, idx) => (
                        <article
                          key={opt.rate_id}
                          className={`rounded-xl border p-3 ${
                            idx === 0
                              ? "border-[#C1374A]/40 bg-white dark:border-[#FF8FA1]/45 dark:bg-white/[0.08]"
                              : "border-slate-200 bg-white dark:border-white/15 dark:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-500 dark:text-white/60">Opción #{idx + 1}</p>
                            {idx === 0 && (
                              <span className="rounded-full bg-[#C1374A]/10 px-2 py-0.5 text-[10px] font-semibold text-[#C1374A] dark:text-[#FF9AAA]">
                                Recomendada
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm font-semibold">{opt.carrier}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-white/60">{opt.service}</p>
                          <p className="mt-2 text-lg font-bold text-[#C1374A]">
                            {formatPrice(opt)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-white/60">
                            Entrega estimada: {opt.estimated_days ?? "-"} día(s)
                          </p>
                          <p className="text-xs text-slate-500 dark:text-white/60">
                            Entrega: {opt.delivery_type === "ocurre" ? "Sucursal (ocurre)" : "Domicilio"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-white/60">
                            Recolección: {opt.pickup_available ? "Disponible" : "No disponible"}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                {/* Carga */}
                {quoteFreightOptions.length > 0 && (
                  <div>
                    <h5 className="mb-2 text-sm font-semibold">Carga</h5>
                    <div className="grid gap-3 md:grid-cols-3">
                      {quoteFreightOptions.map((opt, idx) => (
                        <article
                          key={opt.rate_id}
                          className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/15 dark:bg-white/[0.06]"
                        >
                          <p className="text-xs text-slate-500 dark:text-white/60">Opción #{idx + 1}</p>
                          <p className="mt-1 text-sm font-semibold">{opt.carrier}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-white/60">{opt.service}</p>
                          <p className="mt-2 text-lg font-bold text-[#C1374A]">
                            {formatPrice(opt)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-white/60">
                            Entrega estimada: {opt.estimated_days ?? "-"} día(s)
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#FF5A6B] focus:ring-4 focus:ring-[#FF5A6B]/15 dark:border-white/20 dark:bg-slate-900/60 dark:text-white"
      />
    </div>
  );
}

function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ label: string; value: T }>;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#FF5A6B] focus:ring-4 focus:ring-[#FF5A6B]/15 dark:border-white/20 dark:bg-slate-900/60 dark:text-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}