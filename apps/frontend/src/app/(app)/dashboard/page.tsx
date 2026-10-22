"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  BadgeDollarSign,
  Building2,
  CheckCircle2,
  ChevronRight,
  Factory,
  LogOut,
  Package,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  XCircle,
  History,
  Eye,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { apiFetch, ApiError } from "@/lib/apiFetch";
import { useTheme } from "next-themes";

type Membership = {
  company_id: string;
  company_slug: string;
  company_trade_name?: string | null;
  company_legal_name?: string | null;
  role: string;
};

type MeResponse = {
  email: string;
  memberships: Membership[];
};

type PermissionsResponse = {
  permissions: string[];
};

type QuoteOption = {
  rate_id?: string;
  carrier: string;
  carrier_code: string;
  service?: string;
  service_code?: string;
  estimated_days: number | null;
  mode?: "parcel" | "freight";
  price?: string; // solo para roles con permiso
};

type QuoteWeight = {
  real_kg: number;
  volumetric_kg: number;
  chargeable_kg: number;
  volumetric_factor?: number;
};

type QuoteAddress = {
  country_code?: string;
  postal_code?: string;
  state?: string;
  city?: string;
  area?: string;
};

type QuoteItem = {
  id: number;
  provider?: string;
  provider_quotation_id?: string;
  origin: QuoteAddress;
  destination: QuoteAddress;
  weight: QuoteWeight | null;
  options: { parcel: QuoteOption[]; freight: QuoteOption[] };
  created_at: string;
  // Campos legacy (opcionales)
  full_name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  customer_id?: number | null;
  customer_pickup_address_line1?: string | null;
  customer_pickup_city?: string;
  customer_pickup_zip?: string;
  customer_pickup_country?: string;
};

type LatestQuoteApiResponse = {
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any | null;
};

type QuoteHistoryApiResponse = {
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
};

type QuoteDetailApiResponse = {
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
};

type ShipmentSummary = {
  id: number;
  status: string;
  carrier?: string;
  service?: string;
  origin?: { city?: string; postal_code?: string };
  destination?: { city?: string; postal_code?: string };
  created_at: string;
};

/* ---------- Normalización (formato nuevo + legacy) ---------- */

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizeLegacyOption(o: any): QuoteOption {
  return {
    carrier: o.carrier ?? o.carrier_name ?? "-",
    carrier_code: o.carrier_code ?? "",
    service: o.service ?? o.service_level,
    estimated_days: o.estimated_days ?? o.eta_days ?? null,
    price:
      o.price ??
      (typeof o.estimated_price_mxn === "number" ? String(o.estimated_price_mxn) : undefined),
    rate_id: o.rate_id,
    mode: o.mode,
  };
}

function normalizeQuote(raw: any): QuoteItem {
  let parcel: QuoteOption[] = [];
  let freight: QuoteOption[] = [];

  if (Array.isArray(raw?.options)) {
    parcel = raw.options.map(normalizeLegacyOption);
  } else if (raw?.options) {
    parcel = (raw.options.parcel ?? []).map(normalizeLegacyOption);
    freight = (raw.options.freight ?? []).map(normalizeLegacyOption);
  } else if (Array.isArray(raw?.result_options)) {
    parcel = raw.result_options.map(normalizeLegacyOption);
  }

  return {
    ...raw,
    id: raw.id,
    origin: raw.origin ?? {
      country_code: raw.origin_country,
      postal_code: raw.origin_zip,
    },
    destination: raw.destination ?? {
      country_code: raw.dest_country,
      postal_code: raw.dest_zip,
      city: raw.dest_city,
    },
    weight: raw.weight ?? raw.result_weight ?? null,
    options: { parcel, freight },
    created_at: raw.created_at,
  } as QuoteItem;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ---------- Helpers ---------- */

function setActiveCompanyCookie(companyId: string) {
  document.cookie = `active_company_id=${encodeURIComponent(companyId)}; Path=/; SameSite=Lax`;
}

function formatMXN(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPrice(price?: string) {
  if (!price) return "Precio disponible al solicitar";
  const n = Number(price);
  if (Number.isNaN(n)) return `${price} MXN`;
  return formatMXN(n);
}

function getBestOption(q: QuoteItem): QuoteOption | null {
  const list = q.options?.parcel ?? [];
  if (!list.length) return null;
  const priced = list.filter((o) => o.price && !Number.isNaN(Number(o.price)));
  if (priced.length) {
    return priced.reduce((a, b) => (Number(b.price) < Number(a.price) ? b : a));
  }
  return list[0];
}

function formatRoute(q: QuoteItem) {
  const o = q.origin ?? {};
  const d = q.destination ?? {};
  const left = `${o.city ? o.city + " " : ""}(${o.postal_code ?? "-"})`;
  const right = `${d.city ? d.city + " " : ""}(${d.postal_code ?? "-"})`;
  return `${left} → ${right}`;
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function shipmentStatusClass(status: string) {
  switch ((status || "").toLowerCase()) {
    case "booked":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
    case "pending":
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
    case "cancelled":
    case "canceled":
      return "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/80";
  }
}

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/15 dark:bg-white/[0.06] dark:backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-white/60">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-2 text-[#C1374A] dark:border-white/15 dark:bg-white/10 dark:text-[#FF7B8F]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-white/70">{hint}</p>
    </article>
  );
}

function ModuleCard({
  title,
  description,
  href,
  enabled,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  enabled: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <article
      className={`rounded-2xl border p-5 transition-all duration-300 ${
        enabled
          ? "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md dark:border-white/15 dark:bg-white/[0.06] dark:hover:border-[#FF7B8F]/60 dark:hover:bg-white/[0.10]"
          : "border-slate-200 bg-slate-50 opacity-90 dark:border-white/10 dark:bg-white/[0.03]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-[#C1374A] dark:border-white/15 dark:bg-white/10 dark:text-[#FF7B8F]">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-white/70">{description}</p>

          {enabled ? (
            <Link
              href={href}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#C1374A] hover:text-[#9F2436] dark:text-[#FF9AAA] dark:hover:text-[#FFD1D8]"
            >
              Ir al módulo <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <p className="mt-4 text-xs font-medium text-slate-500 dark:text-white/45">Sin permiso por el rol actual</p>
          )}
        </div>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [activeCompanyId, setActiveCompanyId] = useState<string>("");
  const [effectivePermissions, setEffectivePermissions] = useState<string[]>([]);
  const [inventoryAllowed, setInventoryAllowed] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const [latestQuote, setLatestQuote] = useState<QuoteItem | null>(null);
  const [loadingLatestQuote, setLoadingLatestQuote] = useState(false);

  const [quoteHistory, setQuoteHistory] = useState<QuoteItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [selectedQuote, setSelectedQuote] = useState<QuoteItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [shipments, setShipments] = useState<ShipmentSummary[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(false);
  
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const getApiBase = useCallback(() => {
    const base = process.env.NEXT_PUBLIC_API_URL?.trim(); // ej: http://127.0.0.1:8000/api
    return base || "";
  }, []);

  const fetchLatestQuote = useCallback(async () => {
    setLoadingLatestQuote(true);
    try {
      const apiBase = getApiBase();
      const endpoint = apiBase ? `${apiBase}/quotes/latest/` : "/api/quotes/latest/";
      const res = await fetch(endpoint, { method: "GET" });
      const json: LatestQuoteApiResponse = await res.json().catch(() => ({ message: "", data: null }));
      if (!res.ok || !json.data) {
        setLatestQuote(null);
        return;
      }
      setLatestQuote(normalizeQuote(json.data));
    } catch {
      setLatestQuote(null);
    } finally {
      setLoadingLatestQuote(false);
    }
  }, [getApiBase]);

  const fetchQuoteHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const apiBase = getApiBase();
      const endpoint = apiBase ? `${apiBase}/quotes/history/` : "/api/quotes/history/";
      const res = await fetch(endpoint, { method: "GET" });
      const json: QuoteHistoryApiResponse = await res.json().catch(() => ({ message: "", data: [] }));
      if (!res.ok) {
        setQuoteHistory([]);
        return;
      }
      setQuoteHistory(Array.isArray(json.data) ? json.data.map(normalizeQuote) : []);
    } catch {
      setQuoteHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [getApiBase]);

  const fetchQuoteDetail = useCallback(
    async (quoteId: number) => {
      setLoadingDetail(true);
      try {
        const apiBase = getApiBase();
        const endpoint = apiBase ? `${apiBase}/quotes/${quoteId}/` : `/api/quotes/${quoteId}/`;
        const res = await fetch(endpoint, { method: "GET" });
        const json: QuoteDetailApiResponse = await res.json();
        if (!res.ok) return;
        setSelectedQuote(normalizeQuote(json.data));
      } catch (err) {
        console.error("Error cargando detalle de cotización:", err);
      } finally {
        setLoadingDetail(false);
      }
    },
    [getApiBase]
  );

  const fetchShipments = useCallback(async () => {
    setLoadingShipments(true);
    try {
      const res = await fetch("/api/quotes/shipments", { method: "GET" });
      const json = await res.json().catch(() => ({ data: [] }));
      setShipments(res.ok && Array.isArray(json.data) ? json.data : []);
    } catch {
      setShipments([]);
    } finally {
      setLoadingShipments(false);
    }
  }, []);

  const refreshQuotes = useCallback(async () => {
    await Promise.all([fetchLatestQuote(), fetchQuoteHistory()]);
  }, [fetchLatestQuote, fetchQuoteHistory]);

  useEffect(() => {
    (async () => {
      try {
        const meRes = await apiFetch("/api/me", { method: "GET" });
        const meData: MeResponse = await meRes.json();
        setMe(meData);

        const firstCompany = meData.memberships?.[0]?.company_id ?? "";
        const companyId = String(firstCompany);
        setActiveCompanyId(companyId);

        if (companyId) setActiveCompanyCookie(companyId);
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        console.error("Error cargando /api/me:", err);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (!activeCompanyId) return;

    (async () => {
      setLoading(true);
      try {
        const pRes = await apiFetch("/api/me/permissions", { method: "GET" });
        const pData: PermissionsResponse = await pRes.json();
        setEffectivePermissions(pData.permissions || []);

        try {
          const invRes = await apiFetch("/api/modules/inventory/ping", { method: "GET" });
          setInventoryAllowed(invRes.ok);
        } catch (e: unknown) {
          if (e instanceof ApiError && e.status === 403) {
            setInventoryAllowed(false);
          } else {
            throw e;
          }
        }
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        console.error("Error cargando dashboard:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeCompanyId, router]);

  useEffect(() => {
    const id = setTimeout(() => {
      void refreshQuotes();
    }, 0);
    return () => clearTimeout(id);
  }, [refreshQuotes]);

  useEffect(() => {
    const id = setTimeout(() => void fetchShipments(), 0);
    return () => clearTimeout(id);
  }, [fetchShipments]);

  const activeMembership = useMemo(
    () => me?.memberships?.find((m) => String(m.company_id) === String(activeCompanyId)),
    [me, activeCompanyId]
  );

  const activeCompanyDisplay = useMemo(() => {
    if (!activeMembership) return "-";
    return (
      activeMembership.company_trade_name?.trim() ||
      activeMembership.company_legal_name ||
      activeMembership.company_slug
    );
  }, [activeMembership]);

  const canInventoryRead = effectivePermissions.includes("inventory.read");
  const canAuditRead = effectivePermissions.includes("audit.read");
  const canUsersInvite = effectivePermissions.includes("users.invite");

  const adminProgress = useMemo(() => {
    const checkpoints = [canUsersInvite, canAuditRead].filter(Boolean).length;
    return `${checkpoints}/2`;
  }, [canUsersInvite, canAuditRead]);

  const opsProgress = useMemo(() => {
    const checkpoints = [canInventoryRead, inventoryAllowed].filter(Boolean).length;
    return `${checkpoints}/2`;
  }, [canInventoryRead, inventoryAllowed]);

  const latestBest = latestQuote ? getBestOption(latestQuote) : null;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of shipments) counts[s.status] = (counts[s.status] ?? 0) + 1;
    return counts;
  }, [shipments]);

const recentShipments = useMemo(() => shipments.slice(0, 5), [shipments]);

  function onCompanyChange(nextCompanyId: string) {
    setActiveCompanyId(nextCompanyId);
    setActiveCompanyCookie(nextCompanyId);
  }

  async function onLogout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-[#030712] dark:text-white">
      <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[radial-gradient(circle_at_15%_20%,rgba(255,90,107,0.15),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[radial-gradient(circle_at_85%_85%,rgba(124,143,184,0.14),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[linear-gradient(160deg,#030712_0%,#0f172a_50%,#111827_100%)] dark:opacity-95" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 dark:border-white/15 dark:bg-white/[0.06] dark:backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9F2436] dark:border-white/20 dark:bg-white/10 dark:text-white/80">
                <Sparkles className="h-3.5 w-3.5" />
                Dashboard ejecutivo
              </p>

              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl dark:bg-gradient-to-r dark:from-white dark:via-rose-100 dark:to-white dark:bg-clip-text dark:text-transparent">
                Panel de Control Global Pack Center
              </h1>

              <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
                Vista administrativa y operativa para presentación con cliente.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/" aria-label="Volver al inicio" className="inline-flex items-center">
                <div
                  className={
                    isDark
                      ? "rounded-lg border border-slate-200 bg-white px-2 py-1"
                      : "border-0 bg-transparent p-0 shadow-none"
                  }
                >
                  <div className="relative h-28 w-[130px]">
                    <Image
                      src="/images/Logo-fb.png"
                      alt="Global Pack Center"
                      fill
                      priority
                      className="object-contain object-left"
                      sizes="130px"
                    />
                  </div>
                </div>
              </Link>

              <ThemeToggle />

              <button
                onClick={onLogout}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-white/15 dark:bg-white/[0.06]">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-white/60">Contexto activo</p>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500 dark:text-white/60">Usuario</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{me?.email ?? "-"}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500 dark:text-white/60">Empresa seleccionada</p>
                <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <Building2 className="h-4 w-4 text-[#C1374A]" />
                  {activeCompanyDisplay}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500 dark:text-white/60">Rol activo</p>
                <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <ShieldCheck className="h-4 w-4 text-[#C1374A]" />
                  {activeMembership?.role ?? "-"}
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-500 dark:text-white/60">Cambiar empresa</label>
                <select
                  value={activeCompanyId}
                  onChange={(e) => onCompanyChange(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#FF5A6B] focus:ring-4 focus:ring-[#FF5A6B]/15 dark:border-white/20 dark:bg-slate-900/70 dark:text-white"
                >
                  {me?.memberships?.map((m) => {
                    const displayName = m.company_trade_name?.trim() || m.company_legal_name || m.company_slug;
                    return (
                      <option key={`${m.company_id}-${m.role}`} value={String(m.company_id)}>
                        {displayName} ({m.role})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-white/60">Estado de conexión</p>
            <div className="mt-3 space-y-2 text-sm">
              <p className="flex items-center gap-2 text-slate-800 dark:text-white">
                {loading ? (
                  <Activity className="h-4 w-4 animate-pulse text-amber-600" />
                ) : inventoryAllowed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600" />
                )}
                Inventory backend: <span className="font-semibold">{String(inventoryAllowed)}</span>
              </p>
              <p className="text-slate-600 dark:text-white/70">
                Permisos cargados: <span className="font-semibold text-slate-900 dark:text-white">{effectivePermissions.length}</span>
              </p>
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Empresas asociadas" value={String(me?.memberships?.length ?? 0)} hint="Multi-empresa habilitado" icon={Factory} />
          <StatCard title="Permisos efectivos" value={String(effectivePermissions.length)} hint="Control por rol y compañía" icon={ShieldCheck} />
          <StatCard title="Track operativos" value={opsProgress} hint="Inventario + conectividad backend" icon={Truck} />
          <StatCard title="Track administrativo" value={adminProgress} hint="Usuarios + auditoría" icon={Users} />
        </section>

<section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Accesos rápidos</h2>
  <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
    Flujo principal para la operación diaria.
  </p>

  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <Link
      href="/solicitar-cotizacion"
      className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
    >
      Cotizar y Crear
      <ChevronRight className="h-4 w-4" />
    </Link>

    <Link
      href="/envios/mis-envios"
      className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
    >
      Mis envíos
      <ChevronRight className="h-4 w-4" />
    </Link>

    <Link
      href="/envios/recoleccion"
      className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
    >
      Recolección
      <ChevronRight className="h-4 w-4" />
    </Link>
  </div>
</section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <Package className="h-5 w-5 text-[#C1374A]" />
            Resumen de Mis envíos
          </h2>
          <Link
            href="/envios/mis-envios"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#C1374A] hover:text-[#9F2436] dark:text-[#FF9AAA]"
          >
            Ver todos <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loadingShipments ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-white/60">Cargando envíos…</p>
        ) : shipments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600 dark:text-white/70">Aún no hay envíos registrados.</p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-white/80">
                Total: {shipments.length}
              </span>
              {Object.entries(statusCounts).map(([status, count]) => (
                <span
                  key={status}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${shipmentStatusClass(status)}`}
                >
                  {status}: {count}
                </span>
              ))}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-500 dark:text-white/60">
                  <tr>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Ruta</th>
                    <th className="py-2 pr-3">Paquetería</th>
                    <th className="py-2">Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {recentShipments.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100 dark:border-white/10">
                      <td className="py-2 pr-3">{formatDateTime(s.created_at)}</td>
                      <td className="py-2 pr-3">
                        {(s.origin?.city || s.origin?.postal_code || "-")} →{" "}
                        {(s.destination?.city || s.destination?.postal_code || "-")}
                      </td>
                      <td className="py-2 pr-3">{s.carrier || "-"}</td>
                      <td className="py-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${shipmentStatusClass(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>


      </div>
    </main>
  );
}