"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function DashboardPage() {
  const router = useRouter();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [activeCompanyId, setActiveCompanyId] = useState<string>("");
  const [effectivePermissions, setEffectivePermissions] = useState<string[]>([]);
  const [inventoryAllowed, setInventoryAllowed] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const meRes = await apiFetch("/api/me", { method: "GET" });
        const meData: MeResponse = await meRes.json();
        setMe(meData);

        const firstCompany = meData.memberships?.[0]?.company_id ?? "";
        const companyId = String(firstCompany);
        setActiveCompanyId(companyId);

        if (companyId) {
          setActiveCompanyCookie(companyId);
        }
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
    <main style={{ padding: 24 }}>
      <h1>Dashboard GPC</h1>
      <p><strong>Email:</strong> {me?.email}</p>

      <div style={{ marginTop: 16 }}>
        <label>
          <strong>Empresa activa: </strong>
        </label>
        <select value={activeCompanyId} onChange={(e) => onCompanyChange(e.target.value)}>
          {me?.memberships?.map((m) => {
            const displayName =
              m.company_trade_name?.trim() || m.company_legal_name || m.company_slug;

            return (
              <option key={`${m.company_id}-${m.role}`} value={String(m.company_id)}>
                {displayName} ({m.role})
              </option>
            );
          })}
        </select>
      </div>

      <div style={{ marginTop: 16 }}>
        <p><strong>Empresa seleccionada:</strong> {activeCompanyDisplay}</p>
        <p><strong>Rol activo:</strong> {activeMembership?.role ?? "-"}</p>
        <p>
          <strong>Permisos efectivos:</strong>{" "}
          {effectivePermissions.length ? effectivePermissions.join(", ") : "-"}
        </p>
        <p><strong>Backend Inventory permitido:</strong> {String(inventoryAllowed)}</p>
      </div>

      <section style={{ marginTop: 20, padding: 12, border: "1px solid #ddd" }}>
        <h3>Navegación por permisos</h3>
        <ul>
          {canInventoryRead ? (
            <li><Link href="/inventory">Inventario</Link></li>
          ) : (
            <li style={{ opacity: 0.6 }}>Inventario (sin permiso)</li>
          )}

          {canAuditRead ? (
            <li><Link href="/audit">Auditoría</Link></li>
          ) : (
            <li style={{ opacity: 0.6 }}>Auditoría (sin permiso)</li>
          )}

          {canUsersInvite ? (
            <li><Link href="/users">Usuarios</Link></li>
          ) : (
            <li style={{ opacity: 0.6 }}>Usuarios (sin permiso)</li>
          )}
        </ul>
      </section>

      <button onClick={onLogout} style={{ marginTop: 20 }}>
        Cerrar sesión
      </button>
    </main>
  );
}