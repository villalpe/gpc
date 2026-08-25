"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/apiFetch";

type PermissionsResponse = {
  permissions: string[];
};

export function useMyPermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setLoading(true);
        setError(null);
        setRedirectTo(null);

        const res = await apiFetch("/api/me/permissions", { method: "GET" });
        const data: PermissionsResponse = await res.json();

        if (mounted) setPermissions(data.permissions || []);
      } catch (e) {
        if (!mounted) return;
        setPermissions([]);

        if (e instanceof ApiError) {
          if (e.status === 401) {
            setError("Tu sesión expiró. Inicia sesión nuevamente.");
            setRedirectTo(e.redirectTo ?? "/login");
          } else if (e.status === 403) {
            setError("No autorizado para esta acción.");
          } else {
            setError("No se pudieron cargar permisos.");
          }
        } else {
          setError("No se pudieron cargar permisos.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, []);

  return { permissions, loading, error, redirectTo };
}