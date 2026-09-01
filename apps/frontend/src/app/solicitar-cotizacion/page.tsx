"use client";

import { useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Globe2,
  Package2,
  Scale,
  Send,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "next-themes";

type ShipmentScope = "nacional" | "internacional";
type Urgency = "economico" | "express" | "prioritario";
type Frequency = "unico" | "semanal" | "mensual";

export default function QuotePage() {
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [scope, setScope] = useState<ShipmentScope>("nacional");
  const [serviceType, setServiceType] = useState("paquete");

  const [originCountry, setOriginCountry] = useState("México");
  const [originZip, setOriginZip] = useState("");
  const [destCountry, setDestCountry] = useState("México");
  const [destZip, setDestZip] = useState("");
  const [destCity, setDestCity] = useState("");

  const [weightKg, setWeightKg] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [pieces, setPieces] = useState("1");

  const [declaredValue, setDeclaredValue] = useState("");
  const [requiresInsurance, setRequiresInsurance] = useState(false);

  const [urgency, setUrgency] = useState<Urgency>("economico");
  const [frequency, setFrequency] = useState<Frequency>("unico");
  const [pickup, setPickup] = useState(true);

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

  const numericWeight = Number(weightKg || 0);
  const volumetricKg = useMemo(() => {
    const l = Number(lengthCm || 0);
    const w = Number(widthCm || 0);
    const h = Number(heightCm || 0);
    if (!l || !w || !h) return 0;
    return Number(((l * w * h) / 5000).toFixed(2)); // fórmula típica aérea
  }, [lengthCm, widthCm, heightCm]);

  const chargeableWeight = useMemo(
    () => Math.max(numericWeight, volumetricKg),
    [numericWeight, volumetricKg]
  );

  const isValid =
    fullName.trim().length >= 3 &&
    emailValid &&
    phone.trim().length >= 8 &&
    originZip.trim().length >= 4 &&
    destZip.trim().length >= 4 &&
    numericWeight > 0 &&
    Number(pieces) > 0 &&
    Number(lengthCm) > 0 &&
    Number(widthCm) > 0 &&
    Number(heightCm) > 0 &&
    (scope === "nacional" || (originCountry.trim() && destCountry.trim()));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess(false);
    setError("");

    if (!isValid) {
      setError("Completa los campos obligatorios para poder cotizar.");
      return;
    }

    setLoading(true);
    try {
      // Aquí luego conectamos backend real: POST /api/quotes/request
      await new Promise((r) => setTimeout(r, 900));
      setSuccess(true);
    } catch {
      setError("No se pudo enviar la solicitud. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#030712] dark:text-white">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#0B1220]">
        <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[radial-gradient(circle_at_15%_20%,rgba(255,90,107,0.18),transparent_35%)]" />
        <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[radial-gradient(circle_at_85%_85%,rgba(124,143,184,0.16),transparent_42%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9F2436] dark:border-white/20 dark:bg-white/10 dark:text-white/80">
              Solicitar cotización
            </p>
            <h1 className="mt-3 text-2xl font-extrabold md:text-3xl dark:bg-gradient-to-r dark:from-white dark:via-rose-100 dark:to-white dark:bg-clip-text dark:text-transparent">
              Comparamos entre 6 aliados y te damos la mejor opción
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-white/75">
              Nacional e internacional · precio, tiempo y confiabilidad.
            </p>
          </div>

            <div className="flex items-center gap-3">
                <div
                className={
                    isDark
                    ? "rounded-xl border border-slate-200 bg-white px-2 py-1 shadow-sm"
                    : "bg-transparent px-0 py-0 shadow-none border-0"
                }
                >
                <div className="relative h-22 w-[175px]">
                    <Image
                    src="/images/Logo-fb.png"
                    alt="Global Pack Center"
                    fill
                    className="object-contain"
                    sizes="175px"
                    />
                </div>
                </div>

            <Link
                href="/"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
                Volver al inicio
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
              <li className="flex gap-2"><Clock3 className="mt-0.5 h-4 w-4 text-[#C1374A]" />Urgencia de entrega</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
            <h3 className="font-semibold">Peso cobrable estimado</h3>
            <p className="mt-2 text-2xl font-bold">{chargeableWeight.toFixed(2)} kg</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-white/60">
              Máximo entre peso real y volumétrico.
            </p>
          </article>
        </aside>

        <section className="lg:col-span-8">
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-white/[0.06]"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Nombre completo *" value={fullName} onChange={setFullName} placeholder="Tu nombre" />
              <Input label="Empresa" value={company} onChange={setCompany} placeholder="Razón social / comercial" />
              <Input label="Email *" value={email} onChange={setEmail} placeholder="tu@empresa.com" type="email" />
              <Input label="Teléfono / WhatsApp *" value={phone} onChange={setPhone} placeholder="+52..." />

              <Select label="Tipo de envío *" value={scope} onChange={setScope} options={[
                { label: "Nacional", value: "nacional" },
                { label: "Internacional", value: "internacional" },
              ]} />
              <Select label="Servicio *" value={serviceType} onChange={setServiceType} options={[
                { label: "Paquete", value: "paquete" },
                { label: "Documento", value: "documento" },
                { label: "Carga ligera", value: "carga_ligera" },
              ]} />

              <Input label="País origen *" value={originCountry} onChange={setOriginCountry} placeholder="México" />
              <Input label="CP origen *" value={originZip} onChange={setOriginZip} placeholder="01000" />

              <Input label="País destino *" value={destCountry} onChange={setDestCountry} placeholder="México / USA / ..." />
              <Input label="CP destino *" value={destZip} onChange={setDestZip} placeholder="44100" />

              <Input label="Ciudad destino" value={destCity} onChange={setDestCity} placeholder="Guadalajara" />
              <Input label="Piezas *" value={pieces} onChange={setPieces} placeholder="1" type="number" />

              <Input label="Peso (kg) *" value={weightKg} onChange={setWeightKg} placeholder="2.5" type="number" />
              <Input label="Valor declarado" value={declaredValue} onChange={setDeclaredValue} placeholder="2500" type="number" />

              <Input label="Largo (cm) *" value={lengthCm} onChange={setLengthCm} placeholder="30" type="number" />
              <Input label="Ancho (cm) *" value={widthCm} onChange={setWidthCm} placeholder="20" type="number" />
              <Input label="Alto (cm) *" value={heightCm} onChange={setHeightCm} placeholder="15" type="number" />

              <Select label="Urgencia *" value={urgency} onChange={(v) => setUrgency(v as Urgency)} options={[
                { label: "Económico", value: "economico" },
                { label: "Express", value: "express" },
                { label: "Prioritario", value: "prioritario" },
              ]} />

              <Select label="Frecuencia *" value={frequency} onChange={(v) => setFrequency(v as Frequency)} options={[
                { label: "Único envío", value: "unico" },
                { label: "Semanal", value: "semanal" },
                { label: "Mensual", value: "mensual" },
              ]} />

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
                Recolección a domicilio
              </label>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium">Comentarios</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Horario de recolección, restricciones, contenido, etc."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#FF5A6B] focus:ring-4 focus:ring-[#FF5A6B]/15 dark:border-white/20 dark:bg-slate-900/60 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 dark:text-white/60">
                Al enviar, nuestro equipo comparará opciones de 6 aliados estratégicos.
              </p>
              <button
                type="submit"
                disabled={!isValid || loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#C1374A] px-5 text-sm font-semibold text-white transition hover:bg-[#9F2436] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {loading ? "Enviando..." : "Solicitar cotización"}
              </button>
            </div>

            {success && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  ¡Solicitud enviada! Te contactaremos con la mejor opción.
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

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
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