"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
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
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { apiFetch, ApiError } from "@/lib/apiFetch";

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

function setActiveCompanyCookie(companyId: string) {
  document.cookie = `active_company_id=${encodeURIComponent(companyId)}; Path=/; SameSite=Lax`;
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
      {/* Fondo corporate dark */}
      <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[radial-gradient(circle_at_15%_20%,rgba(255,90,107,0.15),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[radial-gradient(circle_at_85%_85%,rgba(124,143,184,0.14),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[linear-gradient(160deg,#030712_0%,#0f172a_50%,#111827_100%)] dark:opacity-95" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 dark:border-white/15 dark:bg-white/[0.06] dark:backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9F2436] dark:border-white/20 dark:bg-white/10 dark:text-white/80 dark:[text-shadow:0_0_14px_rgba(255,90,107,0.45)]">
                <Sparkles className="h-3.5 w-3.5" />
                Dashboard ejecutivo · Demo
              </p>

              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl dark:bg-gradient-to-r dark:from-white dark:via-rose-100 dark:to-white dark:bg-clip-text dark:text-transparent dark:[text-shadow:0_0_22px_rgba(255,90,107,0.30)]">
                Panel de Control GPC
              </h1>

              <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
                Vista administrativa y operativa para presentación con cliente.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-sm border border-slate-200 bg-white px-1 py-0.5">
                <div className="relative h-[88px] w-[115px]">
                  <Image
                    src="/images/Logo-fb.png"
                    alt="Global Pack Center"
                    fill
                    className="object-contain object-center"
                    sizes="115px"
                  />
                </div>
              </div>

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

        {/* Contexto */}
        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-white/15 dark:bg-white/[0.06] dark:backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-white/60">Contexto activo</p>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500 dark:text-white/60">Usuario</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{me?.email ?? "-"}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500 dark:text-white/60">Empresa seleccionada</p>
                <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <Building2 className="h-4 w-4 text-[#C1374A] dark:text-[#FF9AAA]" />
                  {activeCompanyDisplay}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500 dark:text-white/60">Rol activo</p>
                <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <ShieldCheck className="h-4 w-4 text-[#C1374A] dark:text-[#FF9AAA]" />
                  {activeMembership?.role ?? "-"}
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-500 dark:text-white/60">Cambiar empresa</label>
                <select
                  value={activeCompanyId}
                  onChange={(e) => onCompanyChange(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#FF5A6B] focus:ring-4 focus:ring-[#FF5A6B]/15 dark:border-white/20 dark:bg-slate-900/70 dark:text-white dark:focus:border-[#FF7B8F] dark:focus:ring-[#FF7B8F]/20"
                >
                  {me?.memberships?.map((m) => {
                    const displayName = m.company_trade_name?.trim() || m.company_legal_name || m.company_slug;
                    return (
                      <option
                        key={`${m.company_id}-${m.role}`}
                        value={String(m.company_id)}
                        className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white"
                      >
                        {displayName} ({m.role})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06] dark:backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-white/60">Estado de conexión</p>
            <div className="mt-3 space-y-2 text-sm">
              <p className="flex items-center gap-2 text-slate-800 dark:text-white">
                {loading ? (
                  <Activity className="h-4 w-4 animate-pulse text-amber-600 dark:text-amber-300" />
                ) : inventoryAllowed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-300" />
                )}
                Inventory backend: <span className="font-semibold">{String(inventoryAllowed)}</span>
              </p>
              <p className="text-slate-600 dark:text-white/70">
                Permisos cargados:{" "}
                <span className="font-semibold text-slate-900 dark:text-white">{effectivePermissions.length}</span>
              </p>
            </div>
          </article>
        </section>

        {/* KPIs */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Empresas asociadas" value={String(me?.memberships?.length ?? 0)} hint="Multi-empresa habilitado" icon={Factory} />
          <StatCard title="Permisos efectivos" value={String(effectivePermissions.length)} hint="Control por rol y compañía" icon={ShieldCheck} />
          <StatCard title="Track operativos" value={opsProgress} hint="Inventario + conectividad backend" icon={Truck} />
          <StatCard title="Track administrativo" value={adminProgress} hint="Usuarios + auditoría" icon={Users} />
        </section>

        {/* Siguiente etapa */}
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06] dark:backdrop-blur-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ruta operativa (siguiente etapa)</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-white/80">
              <li>• Monitoreo de envíos en tiempo real</li>
              <li>• Alertas de incidencias por estatus</li>
              <li>• Trazabilidad por guía y paquetería</li>
              <li>• Tablero de cumplimiento SLA</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06] dark:backdrop-blur-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ruta administrativa (siguiente etapa)</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-white/80">
              <li>• Gestión de usuarios y perfiles</li>
              <li>• Flujos de autorización por rol</li>
              <li>• Auditoría y bitácora de acciones</li>
              <li>• Reportes ejecutivos descargables</li>
            </ul>
          </article>
        </section>

        {/* Módulos */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06] dark:backdrop-blur-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Módulos habilitados por permisos</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
            Esta navegación responde al rol activo y permisos efectivos.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <ModuleCard title="Inventario" description="Control de stock, movimientos y visibilidad operativa." href="/inventory" enabled={canInventoryRead} icon={Package} />
            <ModuleCard title="Auditoría" description="Consulta de eventos y trazabilidad de acciones." href="/audit" enabled={canAuditRead} icon={ShieldCheck} />
            <ModuleCard title="Usuarios" description="Invitación, administración y gobierno de accesos." href="/users" enabled={canUsersInvite} icon={Users} />
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-black/20 dark:text-white/70">
            <strong className="text-slate-900 dark:text-white">Permisos efectivos:</strong>{" "}
            {effectivePermissions.length ? effectivePermissions.join(", ") : "-"}
          </div>
        </section>
      </div>
    </main>
  );
}