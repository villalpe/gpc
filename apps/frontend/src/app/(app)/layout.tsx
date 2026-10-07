"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Calculator,
  Truck,
  Link2,
  PackageCheck,
  Users,
  ClipboardList,
  ShieldCheck,
  LogOut,
} from "lucide-react";

import { apiFetch, ApiError } from "@/lib/apiFetch";
import { AuthzProvider } from "@/components/authz/AuthzProvider";
import { useMyPermissions } from "@/hooks/useMyPermissions";

type Membership = {
  company_id: string;
  role: string;
};

type MeResponse = {
  email: string;
  memberships: Membership[];
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPerms?: string[];
};

type NavSection = {
  title: string;
  roles?: string[];
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "General",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Cotizar y crear", href: "/solicitar-cotizacion", icon: Calculator, requiredPerms: ["quotes.create"] },
    ],
  },
  {
    title: "Operación",
    items: [
      { label: "Crear envío", href: "/envios/crear", icon: Truck, requiredPerms: ["quotes.create"] },
      { label: "Link de pedido", href: "/pedidos/link", icon: Link2, requiredPerms: ["quotes.create"] },
      { label: "Preparar órdenes", href: "/ordenes/preparar", icon: PackageCheck, requiredPerms: ["inventory.read"] },
      { label: "Inventario", href: "/inventory", icon: ClipboardList, requiredPerms: ["inventory.read"] },
    ],
  },
  {
    title: "Administración",
    roles: ["SUPERADMIN", "ADMIN_COMPANY"],
    items: [
      { label: "Usuarios", href: "/users", icon: Users, requiredPerms: ["users.invite"] },
      { label: "Auditoría", href: "/audit", icon: ShieldCheck, requiredPerms: ["audit.read"] },
    ],
  },
  {
    title: "Viewer",
    roles: ["VIEWER", "CLIENT"],
    items: [
      { label: "Auditoría (solo lectura)", href: "/audit", icon: ShieldCheck, requiredPerms: ["audit.read"] },
    ],
  },
];

function hasAllPerms(userPerms: string[], required?: string[]) {
  if (!required?.length) return true;
  return required.every((p) => userPerms.includes(p));
}

function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const v = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
  return v ? decodeURIComponent(v) : "";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const { permissions, loading } = useMyPermissions();
  const [activeRole, setActiveRole] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const meRes = await apiFetch("/api/me", { method: "GET" });
        const meData: MeResponse = await meRes.json();

        const companyFromCookie = getCookie("active_company_id");
        const activeMembership = meData.memberships?.find(
          (m) => String(m.company_id) === String(companyFromCookie)
        );

        setActiveRole(activeMembership?.role || meData.memberships?.[0]?.role || "");
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
        }
      }
    })();
  }, [router]);

  const visibleSections = useMemo(() => {
    return NAV_SECTIONS.filter((section) => {
      if (!section.roles?.length) return true;
      return section.roles.includes(activeRole);
    });
  }, [activeRole]);

  async function onLogout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }

  return (
    <AuthzProvider permissions={permissions} loading={loading}>
      <div className="min-h-screen bg-slate-100 dark:bg-[#030712]">
        <div className="mx-auto flex max-w-7xl">
          <aside className="w-80 border-r border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0B1220]">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-white/60">
                Panel autenticado
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">
                Rol activo: {activeRole || "-"}
              </p>
            </div>

            <nav className="space-y-4">
              {visibleSections.map((section) => (
                <div key={section.title}>
                  <p className="mb-1 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-white/50">
                    {section.title}
                  </p>

                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      const allowed = hasAllPerms(permissions ?? [], item.requiredPerms);

                      return (
                        <Link
                          key={item.href}
                          href={allowed ? item.href : "#"}
                          onClick={(e) => {
                            if (!allowed) e.preventDefault();
                          }}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                            active
                              ? "bg-rose-50 text-[#9F2436] dark:bg-white/10 dark:text-white"
                              : "text-slate-700 hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/5"
                          } ${!allowed ? "opacity-75" : ""}`}
                          aria-disabled={!allowed}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </span>

                          {!allowed && (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-300">
                              Sin permiso
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <button
              onClick={onLogout}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/20 dark:text-white"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </aside>

          <main className="flex-1 p-4">{children}</main>
        </div>
      </div>
    </AuthzProvider>
  );
}