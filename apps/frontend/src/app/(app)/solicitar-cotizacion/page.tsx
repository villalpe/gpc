"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  BadgeDollarSign,
  CheckCircle2,
  Clock3,
  Copy,
  Globe2,
  Package,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  Target,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

/* ───────────── Tipos ───────────── */

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
  price?: string;
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

type Address = {
  country: string;
  zip: string;
  state: string;
  city: string;
  area: string;
};

type SavedAddress = Address & { id: string; label: string };

type PackageItem = {
  id: string;
  templateId: string;
  length: string;
  width: string;
  height: string;
  weight: string;
  declaredValue: string;
  protectedPkg: boolean;
};

type PackageTemplate = {
  id: string;
  name: string;
  length: string;
  width: string;
  height: string;
  weight: string;
};

/* ───────────── Datos locales ───────────── */

const SAVED_ADDRESSES: SavedAddress[] = [
  {
    id: "bodega-mty",
    label: "Bodega Monterrey",
    country: "MX",
    zip: "64000",
    state: "Nuevo León",
    city: "Monterrey",
    area: "Centro",
  },
  {
    id: "oficina-gdl",
    label: "Oficina Guadalajara",
    country: "MX",
    zip: "44100",
    state: "Jalisco",
    city: "Guadalajara",
    area: "Americana",
  },
];

const PACKAGE_TEMPLATES: PackageTemplate[] = [
  { id: "caja_chica", name: "Caja de cartón chica", length: "30", width: "20", height: "15", weight: "2" },
  { id: "caja_mediana", name: "Caja de cartón mediana", length: "40", width: "30", height: "20", weight: "8" },
  { id: "tarima", name: "Tarima estándar", length: "120", width: "100", height: "150", weight: "80" },
];

const VOLUMETRIC_FACTOR = 5000;
const EMPTY_ADDRESS: Address = { country: "MX", zip: "", state: "", city: "", area: "" };

/* ───────────── Estilos reutilizables ───────────── */

const FIELD_BASE =
  "w-full rounded-xl border px-4 py-2.5 text-sm font-medium outline-none transition " +
  "border-slate-400/70 bg-slate-50 text-slate-900 placeholder:font-normal placeholder:text-slate-400 " +
  "hover:border-slate-500 focus:border-[#C1374A] focus:bg-white focus:ring-4 focus:ring-[#C1374A]/15 " +
  "dark:border-white/25 dark:bg-slate-900/60 dark:text-white dark:placeholder:text-white/35 " +
  "dark:hover:border-white/40 dark:focus:border-[#FF5A6B] dark:focus:bg-slate-900 dark:focus:ring-[#FF5A6B]/20";

const LABEL_BASE = "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-white/85";

/* ───────────── Helpers ───────────── */

function volumetricOf(p: PackageItem) {
  const l = Number(p.length || 0);
  const w = Number(p.width || 0);
  const h = Number(p.height || 0);
  if (!l || !w || !h) return 0;
  return (l * w * h) / VOLUMETRIC_FACTOR;
}

function isAddressValid(a: Address) {
  return (
    a.country.trim().toUpperCase() === "MX" &&
    a.zip.trim().length >= 4 &&
    a.state.trim().length >= 2 &&
    a.city.trim().length >= 2 &&
    a.area.trim().length >= 2
  );
}

function isPackageValid(p: PackageItem) {
  return Number(p.weight) > 0 && Number(p.length) > 0 && Number(p.width) > 0 && Number(p.height) > 0;
}

function formatPrice(opt: QuoteOption) {
  if (!opt.price) return "Precio disponible al solicitar";
  const n = Number(opt.price);
  if (Number.isNaN(n)) return `${opt.price} MXN`;
  return `$${n.toFixed(2)} MXN`;
}

/* ───────────── Página ───────────── */

export default function QuotePage() {
  const idCounter = useRef(0);

  const newPackage = (): PackageItem => {
    idCounter.current += 1;
    return {
      id: `pkg-${idCounter.current}`,
      templateId: "",
      length: "",
      width: "",
      height: "",
      weight: "",
      declaredValue: "",
      protectedPkg: false,
    };
  };

  const [origin, setOrigin] = useState<Address>(EMPTY_ADDRESS);
  const [destination, setDestination] = useState<Address>(EMPTY_ADDRESS);
  const [originSavedId, setOriginSavedId] = useState("");
  const [destSavedId, setDestSavedId] = useState("");

  const [packages, setPackages] = useState<PackageItem[]>(() => [newPackage()]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [quoteParcelOptions, setQuoteParcelOptions] = useState<QuoteOption[]>([]);
  const [quoteFreightOptions, setQuoteFreightOptions] = useState<QuoteOption[]>([]);
  const [serverWeight, setServerWeight] = useState<QuoteResponse["data"]["weight"] | null>(null);
  const [quotationId, setQuotationId] = useState<string | null>(null);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [shipmentError, setShipmentError] = useState("");

  const totals = useMemo(() => {
    const real = packages.reduce((acc, p) => acc + Number(p.weight || 0), 0);
    const vol = packages.reduce((acc, p) => acc + volumetricOf(p), 0);
    const chargeable = packages.reduce((acc, p) => acc + Math.max(Number(p.weight || 0), volumetricOf(p)), 0);
    return { real, vol, chargeable };
  }, [packages]);

  const isRouteValid = isAddressValid(origin) && isAddressValid(destination);
  const arePackagesValid = packages.length > 0 && packages.every(isPackageValid);
  const isValid = isRouteValid && arePackagesValid;

  const selectedOption = useMemo(
    () => [...quoteParcelOptions, ...quoteFreightOptions].find((o) => o.rate_id === selectedRateId) ?? null,
    [quoteParcelOptions, quoteFreightOptions, selectedRateId],
  );

  function addPackage() {
    setPackages((prev) => [...prev, newPackage()]);
  }

  function removePackage(id: string) {
    setPackages((prev) => (prev.length === 1 ? prev : prev.filter((p) => p.id !== id)));
  }

  function duplicatePackage(id: string) {
    setPackages((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: newPackage().id };
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
  }

  function updatePackage(id: string, patch: Partial<PackageItem>) {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function applyTemplate(id: string, templateId: string) {
    const tpl = PACKAGE_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) {
      updatePackage(id, { templateId: "" });
      return;
    }
    updatePackage(id, {
      templateId: tpl.id,
      length: tpl.length,
      width: tpl.width,
      height: tpl.height,
      weight: tpl.weight,
    });
  }

  function applySavedAddress(kind: "origin" | "destination", savedId: string) {
    const saved = SAVED_ADDRESSES.find((a) => a.id === savedId);
    const next: Address = saved
      ? { country: saved.country, zip: saved.zip, state: saved.state, city: saved.city, area: saved.area }
      : EMPTY_ADDRESS;
    if (kind === "origin") {
      setOriginSavedId(savedId);
      if (saved) setOrigin(next);
    } else {
      setDestSavedId(savedId);
      if (saved) setDestination(next);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess(false);
    setError("");
    setQuoteParcelOptions([]);
    setQuoteFreightOptions([]);
    setServerWeight(null);
    setQuotationId(null);
    setSelectedRateId(null);
    setSummaryOpen(false);
    setShipmentError("");

    if (!isValid) {
      setError("Completa origen, destino y las medidas y peso de todos los paquetes.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        origin: {
          country_code: origin.country.trim().toUpperCase(),
          postal_code: origin.zip.trim(),
          state: origin.state.trim(),
          city: origin.city.trim(),
          area: origin.area.trim(),
        },
        destination: {
          country_code: destination.country.trim().toUpperCase(),
          postal_code: destination.zip.trim(),
          state: destination.state.trim(),
          city: destination.city.trim(),
          area: destination.area.trim(),
        },
        parcels: packages.map((p) => ({
          length: Number(p.length),
          width: Number(p.width),
          height: Number(p.height),
          weight: Number(p.weight),
          ...(p.declaredValue ? { declared_value: Number(p.declaredValue) } : {}),
          ...(p.protectedPkg ? { package_protected: true } : {}),
        })),
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
      setQuotationId(data?.provider_quotation_id ?? null);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la solicitud. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateShipment() {
    if (!selectedOption || !quotationId) return;
    setCreatingShipment(true);
    setShipmentError("");

    try {
      const payload = {
        quotation_id: quotationId,
        rate_id: selectedOption.rate_id,
        origin,
        destination,
        parcels: packages.map((p) => ({
          length: Number(p.length),
          width: Number(p.width),
          height: Number(p.height),
          weight: Number(p.weight),
          ...(p.declaredValue ? { declared_value: Number(p.declaredValue) } : {}),
          ...(p.protectedPkg ? { package_protected: true } : {}),
        })),
      };

      // TODO(Fase 2): conectar endpoint real para crear envío
      // const res = await fetch("/api/shipments/skydropx", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // });
      // if (!res.ok) throw new Error("No se pudo crear el envío.");

      console.log("Payload crear envío (pendiente de endpoint):", payload);
    } catch (err) {
      setShipmentError(err instanceof Error ? err.message : "No se pudo crear el envío.");
    } finally {
      setCreatingShipment(false);
    }
  }

  const hasResults = quoteParcelOptions.length > 0 || quoteFreightOptions.length > 0;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#030712] dark:text-white">
      {/* Header */}
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
              <div className="relative h-25 w-[175px]">
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

      {/* Qué evaluamos */}
      <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-8">
        <article className="rounded-2xl border border-slate-300 bg-white p-5 shadow-md dark:border-white/15 dark:bg-white/[0.06]">
          <h2 className="text-lg font-bold">¿Qué evaluamos por ti?</h2>
          <ul className="mt-3 grid gap-3 text-sm text-slate-600 dark:text-white/75 sm:grid-cols-2 lg:grid-cols-3">
            <li className="flex gap-2"><Truck className="mt-0.5 h-4 w-4 shrink-0 text-[#C1374A]" />Tiempo de tránsito estimado</li>
            <li className="flex gap-2"><Scale className="mt-0.5 h-4 w-4 shrink-0 text-[#C1374A]" />Peso real vs volumétrico</li>
            <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#C1374A]" />Seguro y valor declarado</li>
            <li className="flex gap-2"><Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-[#C1374A]" />Cobertura nacional</li>
            <li className="flex gap-2"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#C1374A]" />Urgencia operativa</li>
            <li className="flex gap-2"><Target className="mt-0.5 h-4 w-4 shrink-0 text-[#C1374A]" />Mejor relación costo-beneficio</li>
          </ul>
        </article>
      </div>

      {/* Barra sticky */}
      <div className="sticky top-0 z-30 mt-6 border-y border-slate-200 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-[#0B1220]/90">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-[#C1374A]" />
            <span className="text-sm font-semibold">
              {packages.length} {packages.length === 1 ? "paquete" : "paquetes"}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/60">
              Peso cobrable total
            </span>
            <span className="text-xl font-bold">{totals.chargeable.toFixed(2)} kg</span>
          </div>

          <div className="flex flex-wrap gap-x-4 text-xs text-slate-600 dark:text-white/70">
            <span>Real: <strong>{totals.real.toFixed(2)} kg</strong></span>
            <span>Volumétrico: <strong>{totals.vol.toFixed(2)} kg</strong></span>
            {serverWeight && (
              <span className="text-emerald-600 dark:text-emerald-300">
                Confirmado por servidor: <strong>{serverWeight.chargeable_kg.toFixed(2)} kg</strong>
              </span>
            )}
          </div>

          {selectedOption && (
            <div className="ml-auto flex items-center gap-3 rounded-xl border border-[#C1374A]/40 bg-[#C1374A]/5 px-3 py-1.5">
              <span className="text-xs text-slate-600 dark:text-white/70">
                {selectedOption.carrier} · {selectedOption.service}
              </span>
              <span className="text-base font-bold text-[#C1374A]">{formatPrice(selectedOption)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Formulario */}
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <form
          onSubmit={onSubmit}
          className="space-y-6 rounded-2xl border border-slate-300 bg-white p-5 shadow-md dark:border-white/15 dark:bg-white/[0.06] md:p-6"
        >
          {/* Origen y Destino */}
          <div className="grid gap-6 lg:grid-cols-2">
            <AddressBlock
              title="Origen"
              tone="origin"
              value={origin}
              onChange={(a) => {
                setOrigin(a);
                setOriginSavedId("");
              }}
              savedId={originSavedId}
              onSelectSaved={(id) => applySavedAddress("origin", id)}
            />

            <AddressBlock
              title="Destino"
              tone="destination"
              value={destination}
              onChange={(a) => {
                setDestination(a);
                setDestSavedId("");
              }}
              savedId={destSavedId}
              onSelectSaved={(id) => applySavedAddress("destination", id)}
            />
          </div>

          {/* Paquetes */}
          <div className="space-y-4 rounded-2xl border border-slate-300 bg-slate-50/70 p-4 dark:border-white/15 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-white/85">
                Paquetes
              </h3>
              {packages.length > 1 && (
                <span className="rounded-full bg-[#C1374A]/10 px-2.5 py-0.5 text-xs font-semibold text-[#C1374A] dark:text-[#FF9AAA]">
                  Multipaquete · {packages.length}
                </span>
              )}
            </div>

            {packages.map((pkg, idx) => {
              const pkgValid = isPackageValid(pkg);

              return (
                <article
                  key={pkg.id}
                  className={`rounded-xl border p-4 transition ${
                    pkgValid
                      ? "border-slate-300 bg-white dark:border-white/15 dark:bg-white/[0.06]"
                      : "border-amber-300 bg-amber-50/40 dark:border-amber-400/30 dark:bg-amber-500/10"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Paquete {idx + 1}</p>
                      <p className="text-xs text-slate-500 dark:text-white/60">
                        {pkgValid
                          ? "Completo"
                          : "Faltan datos de dimensiones o peso"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => duplicatePackage(pkg.id)}
                        title="Duplicar paquete"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-white"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePackage(pkg.id)}
                        disabled={packages.length === 1}
                        title="Eliminar paquete"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20 dark:bg-white/10 dark:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-6">
                    <div className="md:col-span-4 xl:col-span-2">
                      <Select
                        label="Empaque o paquete guardado"
                        value={pkg.templateId}
                        onChange={(v) => applyTemplate(pkg.id, v)}
                        options={[
                          { label: "Personalizado", value: "" },
                          ...PACKAGE_TEMPLATES.map((t) => ({ label: t.name, value: t.id })),
                        ]}
                      />
                    </div>

                    <Input
                      label="Largo (cm) *"
                      type="number"
                      placeholder="Ej. 40"
                      value={pkg.length}
                      onChange={(v) => updatePackage(pkg.id, { length: v, templateId: "" })}
                    />
                    <Input
                      label="Ancho (cm) *"
                      type="number"
                      placeholder="Ej. 30"
                      value={pkg.width}
                      onChange={(v) => updatePackage(pkg.id, { width: v, templateId: "" })}
                    />
                    <Input
                      label="Alto (cm) *"
                      type="number"
                      placeholder="Ej. 20"
                      value={pkg.height}
                      onChange={(v) => updatePackage(pkg.id, { height: v, templateId: "" })}
                    />
                    <Input
                      label="Peso (kg) *"
                      type="number"
                      placeholder="Ej. 8"
                      value={pkg.weight}
                      onChange={(v) => updatePackage(pkg.id, { weight: v, templateId: "" })}
                    />

                    <div className="md:col-span-2">
                      <Input
                        label="Valor declarado (MXN)"
                        type="number"
                        placeholder="Ej. 2500"
                        value={pkg.declaredValue}
                        onChange={(v) => updatePackage(pkg.id, { declaredValue: v })}
                      />
                    </div>

                    <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 md:col-span-2 md:mt-[30px] dark:border-white/20 dark:bg-slate-900/50 dark:text-white/85">
                      <input
                        type="checkbox"
                        checked={pkg.protectedPkg}
                        onChange={(e) => updatePackage(pkg.id, { protectedPkg: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 accent-[#C1374A]"
                      />
                      Protección (seguro)
                    </label>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-white/10 dark:text-white/75">
                      Peso real: <strong>{Number(pkg.weight || 0).toFixed(2)} kg</strong>
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-white/10 dark:text-white/75">
                      Volumétrico: <strong>{volumetricOf(pkg).toFixed(2)} kg</strong>
                    </span>
                    <span className="rounded-full bg-[#C1374A]/10 px-2.5 py-1 text-[#C1374A] dark:text-[#FF9AAA]">
                      Cobrable: <strong>{Math.max(Number(pkg.weight || 0), volumetricOf(pkg)).toFixed(2)} kg</strong>
                    </span>
                  </div>
                </article>
              );
            })}

            <button
              type="button"
              onClick={addPackage}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-dashed border-[#C1374A]/60 px-4 text-sm font-semibold text-[#C1374A] transition hover:bg-[#C1374A]/5 dark:text-[#FF9AAA]"
            >
              <Plus className="h-4 w-4" />
              Agregar paquete
            </button>
          </div>

          {/* Acción */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="submit"
              disabled={!isValid || loading}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#C1374A] px-5 text-sm font-semibold text-white transition hover:bg-[#9F2436] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search className="h-4 w-4" />
              {loading ? "Cotizando..." : "Cotizar envío"}
            </button>
            <p className="text-xs text-slate-500 dark:text-white/60">
              El precio de cada opción es el total de todos los paquetes.
            </p>
          </div>

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Listo. Encontramos opciones para tu envío de {packages.length}{" "}
                {packages.length === 1 ? "paquete" : "paquetes"}.
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300">
              <span className="inline-flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </span>
            </div>
          )}

          {/* Resultados */}
          {hasResults && (
            <div className="space-y-4 rounded-2xl border border-slate-300 bg-slate-50 p-4 dark:border-white/15 dark:bg-white/[0.04]">
              <h4 className="flex items-center gap-2 text-base font-bold">
                <BadgeDollarSign className="h-4 w-4 text-[#C1374A]" />
                Opciones de cotización
              </h4>

              {quoteParcelOptions.length > 0 && (
                <OptionList
                  title="Paquetería"
                  options={quoteParcelOptions}
                  selectedRateId={selectedRateId}
                  onSelect={(id) => {
                    setSelectedRateId(id);
                    setShipmentError("");
                    setSummaryOpen(true);
                  }}
                  highlightFirst
                />
              )}

              {quoteFreightOptions.length > 0 && (
                <OptionList
                  title="Carga"
                  options={quoteFreightOptions}
                  selectedRateId={selectedRateId}
                  onSelect={(id) => {
                    setSelectedRateId(id);
                    setShipmentError("");
                    setSummaryOpen(true);
                  }}
                />
              )}

              {selectedOption && (
                <div className="rounded-xl border border-[#C1374A]/40 bg-white p-4 dark:border-[#FF8FA1]/45 dark:bg-white/[0.08]">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/60">
                    Resumen de selección
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {selectedOption.carrier} · {selectedOption.service}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    {packages.length} {packages.length === 1 ? "paquete" : "paquetes"} ·{" "}
                    {totals.chargeable.toFixed(2)} kg cobrables
                  </p>
                  <p className="mt-2 text-xl font-bold text-[#C1374A]">{formatPrice(selectedOption)}</p>
                  <button
                    type="button"
                    onClick={() => setSummaryOpen(true)}
                    className="mt-3 h-9 rounded-lg bg-[#C1374A] px-4 text-xs font-semibold text-white transition hover:bg-[#9F2436]"
                  >
                    Ver resumen y continuar
                  </button>
                </div>
              )}
            </div>
          )}

          <ShipmentSummaryModal
            open={summaryOpen && !!selectedOption}
            onClose={() => setSummaryOpen(false)}
            origin={origin}
            destination={destination}
            packages={packages}
            option={selectedOption}
            totals={totals}
            quotationId={quotationId}
            creating={creatingShipment}
            error={shipmentError}
            onConfirm={handleCreateShipment}
          />
        </form>
      </div>
    </main>
  );
}

/* ───────────── Componentes ───────────── */

function AddressBlock({
  title,
  tone,
  value,
  onChange,
  savedId,
  onSelectSaved,
}: {
  title: string;
  tone: "origin" | "destination";
  value: Address;
  onChange: (a: Address) => void;
  savedId: string;
  onSelectSaved: (id: string) => void;
}) {
  const set = (patch: Partial<Address>) => onChange({ ...value, ...patch });

  const styles =
    tone === "origin"
      ? {
          card: "border-[#C1374A]/25 bg-[#C1374A]/[0.04] dark:border-[#FF5A6B]/25 dark:bg-[#FF5A6B]/[0.05]",
          bar: "bg-[#C1374A]",
          badge: "bg-[#C1374A] text-white",
          title: "text-[#9F2436] dark:text-[#FF9AAA]",
          num: "1",
        }
      : {
          card: "border-[#5B6F99]/30 bg-[#5B6F99]/[0.05] dark:border-[#7C8FB8]/30 dark:bg-[#7C8FB8]/[0.06]",
          bar: "bg-[#5B6F99] dark:bg-[#7C8FB8]",
          badge: "bg-[#5B6F99] text-white dark:bg-[#7C8FB8] dark:text-slate-900",
          title: "text-[#3F5078] dark:text-[#B4C2E2]",
          num: "2",
        };

  return (
    <div className={`relative space-y-4 overflow-hidden rounded-2xl border p-5 pl-6 ${styles.card}`}>
      <span className={`absolute inset-y-0 left-0 w-1.5 ${styles.bar}`} aria-hidden />
      <div className="flex items-center gap-2.5">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${styles.badge}`}
        >
          {styles.num}
        </span>
        <h3 className={`text-sm font-bold uppercase tracking-wide ${styles.title}`}>{title}</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Select
            label="Dirección guardada"
            value={savedId}
            onChange={onSelectSaved}
            options={[
              { label: "Capturar manualmente (C.P.)", value: "" },
              ...SAVED_ADDRESSES.map((a) => ({ label: `${a.label} · ${a.zip}`, value: a.id })),
            ]}
          />
        </div>
        <Input label="C.P. *" value={value.zip} onChange={(v) => set({ zip: v })} placeholder="Ej. 64000" />
        <Input label="País (ISO) *" value={value.country} onChange={(v) => set({ country: v })} placeholder="Ej. MX" />
        <Input label="Estado *" value={value.state} onChange={(v) => set({ state: v })} placeholder="Ej. Nuevo León" />
        <Input label="Ciudad *" value={value.city} onChange={(v) => set({ city: v })} placeholder="Ej. Monterrey" />
        <div className="sm:col-span-2">
          <Input label="Colonia/Área *" value={value.area} onChange={(v) => set({ area: v })} placeholder="Ej. Centro" />
        </div>
      </div>
    </div>
  );
}

const CARRIER_LOGOS: Record<string, string> = {
  fedex: "/images/fedex-ar21.svg",
  dhl: "/images/dhl-1.svg",
  ups: "/images/carriers/ups.svg",
  estafeta: "/images/estafeta.svg",
  redpack: "/images/carriers/redpack.svg",
  paquetexpress: "/images/PaqueteExpress.png",
};

function getCarrierLogo(carrier: string) {
  const key = carrier.toLowerCase().replace(/[^a-z0-9]/g, "");
  return CARRIER_LOGOS[key] ?? null;
}

function OptionList({
  title,
  options,
  selectedRateId,
  onSelect,
  highlightFirst = false,
}: {
  title: string;
  options: QuoteOption[];
  selectedRateId: string | null;
  onSelect: (id: string) => void;
  highlightFirst?: boolean;
}) {
  return (
    <div>
      <h5 className="mb-2 text-sm font-semibold">{title}</h5>
      <div className="grid grid-cols-1 gap-3">
        {options.map((opt, idx) => {
          const selected = selectedRateId === opt.rate_id;
          return (
            <article
              key={opt.rate_id}
              className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                selected
                  ? "border-[#C1374A] bg-white ring-2 ring-[#C1374A]/20 dark:bg-white/[0.1]"
                  : highlightFirst && idx === 0
                    ? "border-[#C1374A]/40 bg-white dark:border-[#FF8FA1]/45 dark:bg-white/[0.08]"
                    : "border-slate-300 bg-white dark:border-white/15 dark:bg-white/[0.06]"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {getCarrierLogo(opt.carrier) ? (
                    <Image
                      src={getCarrierLogo(opt.carrier)!}
                      alt={opt.carrier}
                      width={56}
                      height={24}
                      className="h-6 w-auto object-contain"
                    />
                  ) : null}
                  <p className="text-sm font-semibold">{opt.carrier}</p>
                  {highlightFirst && idx === 0 && (
                    <span className="rounded-full bg-[#C1374A]/10 px-2 py-0.5 text-[10px] font-semibold text-[#C1374A] dark:text-[#FF9AAA]">
                      Recomendada
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-white/60">{opt.service}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-white/60">
                  Entrega: {opt.delivery_type === "ocurre" ? "Sucursal (ocurre)" : "Domicilio"} · Recolección:{" "}
                  {opt.pickup_available ? "Disponible" : "No disponible"}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1">
                <p className="text-lg font-bold text-[#C1374A]">{formatPrice(opt)}</p>
                <p className="text-xs text-slate-500 dark:text-white/60">{opt.estimated_days ?? "-"} día(s)</p>
                <button
                  type="button"
                  onClick={() => onSelect(opt.rate_id)}
                  className={`mt-1 h-8 rounded-lg px-3 text-xs font-semibold transition ${
                    selected
                      ? "bg-[#C1374A] text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-white"
                  }`}
                >
                  {selected ? "Seleccionada" : "Seleccionar"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
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
      <label className={LABEL_BASE}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={FIELD_BASE}
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
      <label className={LABEL_BASE}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={`${FIELD_BASE} ${value === "" ? "text-slate-500 dark:text-white/60" : ""}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-slate-900">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ShipmentSummaryModal({
  open,
  onClose,
  origin,
  destination,
  packages,
  option,
  totals,
  quotationId,
  creating,
  error,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  origin: Address;
  destination: Address;
  packages: PackageItem[];
  option: QuoteOption | null;
  totals: { real: number; vol: number; chargeable: number };
  quotationId: string | null;
  creating: boolean;
  error: string;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !creating && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, creating, onClose]);

  if (!open || !option) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => !creating && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-title"
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/15 dark:bg-[#0B1220]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/60">
              Resumen final
            </p>
            <h2 id="summary-title" className="text-lg font-bold">
              Confirma tu envío
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            aria-label="Cerrar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-white/15">
            <p className="text-xs font-semibold uppercase text-slate-500 dark:text-white/60">Origen</p>
            <p className="mt-1 text-sm">
              {origin.area}, {origin.city}, {origin.state}, C.P. {origin.zip}, {origin.country}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-white/15">
            <p className="text-xs font-semibold uppercase text-slate-500 dark:text-white/60">Destino</p>
            <p className="mt-1 text-sm">
              {destination.area}, {destination.city}, {destination.state}, C.P. {destination.zip}, {destination.country}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 p-3 dark:border-white/15">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-white/60">
            Paquetes ({packages.length})
          </p>
          <ul className="mt-2 divide-y divide-slate-100 text-sm dark:divide-white/10">
            {packages.map((p, i) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 py-1.5">
                <span>
                  {i + 1}. {p.length} × {p.width} × {p.height} cm
                </span>
                <span className="text-slate-600 dark:text-white/70">
                  {p.weight} kg
                  {p.declaredValue ? ` · Valor $${p.declaredValue}` : ""}
                  {p.protectedPkg ? " · Con seguro" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/[0.05]">
            <p className="text-xs text-slate-500 dark:text-white/60">Real</p>
            <p className="text-sm font-bold">{totals.real.toFixed(2)} kg</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/[0.05]">
            <p className="text-xs text-slate-500 dark:text-white/60">Volumétrico</p>
            <p className="text-sm font-bold">{totals.vol.toFixed(2)} kg</p>
          </div>
          <div className="rounded-xl bg-[#C1374A]/10 p-3">
            <p className="text-xs text-slate-500 dark:text-white/60">Cobrable</p>
            <p className="text-sm font-bold text-[#C1374A]">{totals.chargeable.toFixed(2)} kg</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#C1374A]/40 bg-[#C1374A]/5 p-4">
          <div>
            <p className="text-sm font-semibold">{option.carrier}</p>
            <p className="text-xs text-slate-600 dark:text-white/70">{option.service}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-white/60">
              {option.estimated_days ?? "-"} día(s) ·{" "}
              {option.delivery_type === "ocurre" ? "Entrega en sucursal (ocurre)" : "Entrega a domicilio"} · Recolección{" "}
              {option.pickup_available ? "disponible" : "no disponible"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-white/60">Precio estimado</p>
            <p className="text-xl font-bold text-[#C1374A]">{formatPrice(option)}</p>
          </div>
        </div>

        <p className="mt-2 text-[10px] text-slate-400">
          quotation: {quotationId ?? "-"} · rate: {option.rate_id}
        </p>

        {error && (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="h-10 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
          >
            Cambiar opción
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={creating || !quotationId}
            className="h-10 rounded-xl bg-[#C1374A] px-5 text-sm font-semibold text-white transition hover:bg-[#9F2436] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Creando envío..." : "Crear envío"}
          </button>
        </div>
      </div>
    </div>
  );
}